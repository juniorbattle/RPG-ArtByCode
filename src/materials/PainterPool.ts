import { PAINT_JOBS, type PaintJob, type PaintReply } from './PainterJobs';
import type { TexSet } from './TexturePainters';

export interface PaintResult {
  sets: Record<PaintJob, TexSet>;
  /** Each job's own painting time (worker or main thread), ms. */
  ms: Record<string, number>;
  /** Workers that started (0 = everything painted on the main thread). */
  workers: number;
  /** Why a job left its worker for the main thread (empty when every worker answered). */
  fallbacks: string[];
}

/** Workers a boot uses by default: the longest job (cobble) is about a quarter of the total, so more than 4 gains nothing (measured: 4, 6
 *  and 8 workers paint in the same time); one core is left to the main thread (canvas atlases, loading screen). A job runs ~10 % slower in
 *  a worker than on the main thread, so a single worker loses: below 2 workers the main thread paints (journal pass 6, P3). */
export const defaultPainters = (): number => { const n = Math.min(4, (navigator.hardwareConcurrency || 2) - 1); return n >= 2 ? n : 0; };

/** Milliseconds a worker may stay silent on one job before the job is painted on the main thread instead (a worker that never answers must
 *  not hang the boot; the slowest job takes ~1 s on the dev laptop under contention). */
const WATCHDOG_MS = 20000;

const tick = () => new Promise<void>((r) => setTimeout(r, 0));

/** Paints the library's textures in a small pool of Web Workers (journal pass 6, P3): the main thread stays free for the canvas atlases
 *  and the loading screen. The jobs are pure functions with fixed seeds, so a worker paints the bytes the main thread would (SHA-256
 *  checked, journal). The game must run without workers: a worker that cannot start, throws, or stays silent past the watchdog has its
 *  job painted on the main thread, and whatever is still queued once no worker is left goes there too (console warning, `fallbacks`).
 *  `poolSize` 0 paints every job on the main thread in `order` (`?painters=main`). Each worker takes the next queued job as soon as it
 *  is free: pass the longest first. */
export async function paintAll(order: readonly PaintJob[], poolSize: number, onJob: (job: PaintJob, done: number) => void): Promise<PaintResult> {
  const sets = {} as Record<PaintJob, TexSet>, ms: Record<string, number> = {}, fallbacks: string[] = [];
  const queue = [...order];
  let done = 0;
  const finish = (job: PaintJob, s: TexSet, t: number) => { sets[job] = s; ms[job] = t; onJob(job, ++done); };
  const onMain = (job: PaintJob) => { const t0 = performance.now(); finish(job, PAINT_JOBS[job](), performance.now() - t0); };

  const lane = (w: Worker) => new Promise<void>((resolve) => {
    let current: PaintJob | null = null, id = 0, timer = 0;
    const next = () => {
      current = queue.shift() ?? null;
      if (!current) { w.terminate(); resolve(); return; }
      timer = window.setTimeout(() => fail(`no answer in ${WATCHDOG_MS} ms`), WATCHDOG_MS);
      w.postMessage({ id: ++id, job: current });
    };
    const fail = (why: string) => {
      clearTimeout(timer); w.terminate();
      const job = current; current = null;
      console.warn(`[painters] a texture worker failed (${why}); ${job ?? 'no job'} painted on the main thread`);
      fallbacks.push(`${job ?? '-'}: ${why}`);
      if (job) onMain(job);
      resolve();
    };
    w.onmessage = (e: MessageEvent<PaintReply>) => {
      const r = e.data;
      if (r.id !== id || r.job !== current) return;
      if ('error' in r) { fail(r.error); return; }
      clearTimeout(timer);
      finish(r.job, { size: r.size, albedo: r.albedo, nr: r.nr }, r.ms);
      next();
    };
    w.onerror = (e) => { e.preventDefault(); fail(e.message || 'worker error'); };
    w.onmessageerror = () => fail('message could not be decoded');
    next();
  });

  const lanes: Promise<void>[] = [];
  for (let i = 0; i < Math.min(poolSize, order.length); i++) {
    let w: Worker;
    try {
      w = new Worker(new URL('./painter.worker.ts', import.meta.url), { type: 'module' });
    } catch (err) {
      console.warn(`[painters] texture workers unavailable (${String(err)}); painting on the main thread`);
      fallbacks.push(`spawn: ${String(err)}`);
      break;
    }
    lanes.push(lane(w));
  }
  await Promise.all(lanes);
  // no worker at all, or every worker failed before the queue emptied: the main thread paints the rest, yielding between jobs so the
  // loading screen keeps updating (the pre-P3 behaviour)
  while (queue.length) { await tick(); onMain(queue.shift()!); }
  return { sets, ms, workers: lanes.length, fallbacks };
}
