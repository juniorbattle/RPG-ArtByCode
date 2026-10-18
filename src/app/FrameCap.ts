/** Frame-rate cap (journal pass 6, P4). The loop keeps its rAF callback every vsync; a callback the cap does not let through skips
 *  update and render (the simulation follows dt, so a skipped callback changes no image: the next rendered frame shows the same state).
 *  Modes (`?fps=`):
 *  - `off`: every callback renders (the pre-P4 loop).
 *  - `<n>` (e.g. `60`): an average of n frames per second; on a display whose rate is not a multiple of n the intervals alternate
 *    (2 and 3 vsyncs for 60 at 165 Hz).
 *  - `v<k>` (e.g. `v3`): one frame every k vsyncs, evenly paced (55 fps at 165 Hz).
 *  - `e<n>` (e.g. `e60`): evenly paced near n: every round(refresh / n) vsyncs (165 Hz -> 55, 144 -> 72, 120 -> 60, 60 -> 60).
 *  The vsync interval comes from a probe run while the loading screen is idle (`probe` / `endProbe`: the texture painters work in
 *  workers then); without enough samples it stays at 1000 / 60, which only loosens the cap on a faster display (never tightens it).
 *  The loop's own callbacks do not refine it: their rAF intervals are not whole vsyncs (journal pass 6, P4: a median of the intervals
 *  after a skipped callback read 2 vsyncs under GPU contention and lifted the cap; their minimum read 2.8-4.4 ms at 165 Hz, both [KO]). */
export type FrameCapMode = { kind: 'off' } | { kind: 'fps'; fps: number } | { kind: 'vsync'; every: number } | { kind: 'even'; fps: number };

export function parseFrameCap(s: string | null): FrameCapMode | null {
  if (s === null) return null;
  if (s === 'off' || s === 'max') return { kind: 'off' };
  let m = s.match(/^v(\d)$/);
  if (m && +m[1] >= 1) return { kind: 'vsync', every: +m[1] };
  m = s.match(/^e(\d{2,3})$/);
  if (m) return { kind: 'even', fps: +m[1] };
  m = s.match(/^(\d{2,3})$/);
  if (m) return { kind: 'fps', fps: +m[1] };
  return null;
}

export const frameCapLabel = (m: FrameCapMode): string =>
  m.kind === 'off' ? 'off' : m.kind === 'fps' ? `${m.fps}` : m.kind === 'vsync' ? `v${m.every}` : `e${m.fps}`;

export class FrameCap {
  mode: FrameCapMode = { kind: 'off' };
  /** display vsync interval, ms (boot probe) */
  vsync = 1000 / 60;
  /** where `vsync` comes from: 'default' | 'probe' */
  vsyncSource = 'default';
  /** callbacks skipped by the cap since start */
  skipped = 0;
  private lastRender = NaN;
  private due = NaN;
  private probing = false;
  private probeDeltas: number[] = [];

  /** vsyncs per frame of the current mode (0 = not vsync-locked) */
  every(): number {
    const m = this.mode;
    if (m.kind === 'vsync') return m.every;
    if (m.kind === 'even') return Math.max(1, Math.round(1000 / this.vsync / m.fps));
    return 0;
  }

  /** Starts measuring the vsync interval from an otherwise idle rAF chain (call while the main thread waits, e.g. on the painters). */
  probe(): void {
    if (this.probing) return;
    this.probing = true; this.probeDeltas = [];
    let prev = NaN;
    const f = (t: number) => {
      if (!this.probing) return;
      if (!isNaN(prev)) this.probeDeltas.push(t - prev);
      prev = t;
      requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  }

  endProbe(): void {
    this.probing = false;
    const d = this.probeDeltas.filter((x) => x > 2.5 && x < 50).sort((a, b) => a - b);
    // an idle chain runs every vsync: the median is the interval (measured 6.0-6.1 ms at 165 Hz on every load, painters on the main
    // thread included); too few samples: keep the default
    if (d.length >= 8) { this.vsync = d[Math.floor(d.length / 2)]; this.vsyncSource = 'probe'; }
  }

  /** Called on every loop callback with its rAF timestamp: true = update and render now. */
  shouldRender(t: number): boolean {
    if (this.mode.kind === 'off') return true;
    const v = this.vsync, k = this.every();
    let go: boolean;
    if (k > 0) {
      go = isNaN(this.lastRender) || t - this.lastRender >= (k - 0.5) * v;
    } else {
      const iv = 1000 / (this.mode as { fps: number }).fps;
      if (isNaN(this.due) || t - this.due > iv) this.due = t; // first frame, or far behind: restart the schedule
      go = t >= this.due - v / 2;
      if (go) this.due += iv;
    }
    if (go) this.lastRender = t; else this.skipped++;
    return go;
  }
}
