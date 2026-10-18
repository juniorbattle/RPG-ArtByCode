import { PAINT_JOBS, type PaintReply, type PaintRequest } from './PainterJobs';

/** Texture painter worker (journal pass 6, P3): paints one named job per message and transfers its two arrays back (no copy). */
const post = (r: PaintReply, transfer: Transferable[] = []) => (self as unknown as Worker).postMessage(r, transfer);

self.onmessage = (e: MessageEvent<PaintRequest>) => {
  const { id, job } = e.data;
  try {
    const t0 = performance.now();
    const s = PAINT_JOBS[job]();
    post({ id, job, ms: performance.now() - t0, size: s.size, albedo: s.albedo, nr: s.nr }, [s.albedo.buffer, s.nr.buffer]);
  } catch (err) {
    post({ id, job, error: String((err as Error)?.stack ?? err) });
  }
};
