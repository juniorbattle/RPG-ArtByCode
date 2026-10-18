/** Frame-rate cap (journal pass 6, P4). The loop keeps its rAF callback every vsync; a callback the cap does not let through skips
 *  update and render (the simulation follows dt, so a skipped callback changes no image: the next rendered frame shows the same state).
 *  Modes (`?fps=`):
 *  - `off`: every callback renders (the pre-P4 loop).
 *  - `<n>` (e.g. `60`): an average of n frames per second; on a display whose rate is not a multiple of n the intervals alternate
 *    (2 and 3 vsyncs for 60 at 165 Hz).
 *  - `v<k>` (e.g. `v3`): one frame every k vsyncs, evenly paced (55 fps at 165 Hz).
 *  - `e<n>` (e.g. `e60`): evenly paced near n: every round(refresh / n) vsyncs (165 Hz -> 55, 144 -> 72, 120 -> 60, 60 -> 60).
 *  - `a<n>` (e.g. `a60`): `e<n>` with an adaptive step (journal pass 6h): when rendered frames keep missing their slot (LATE_MAX of the
 *    last LATE_N came more than half a vsync late), one more vsync per frame, down to 30 fps; after HOLD_MS at a longer step, a trial of
 *    the shorter one, kept if it holds TRIAL_MS, otherwise undone with the hold doubled (up to HOLD_MAX_MS).
 *  The vsync interval comes from a probe run while the loading screen is idle (`probe` / `endProbe`: the texture painters work in
 *  workers then); without enough samples it stays at 1000 / 60, which only loosens the cap on a faster display (never tightens it).
 *  The loop's own callbacks do not refine it: their rAF intervals are not whole vsyncs (journal pass 6, P4: a median of the intervals
 *  after a skipped callback read 2 vsyncs under GPU contention and lifted the cap; their minimum read 2.8-4.4 ms at 165 Hz, both [KO]). */
export type FrameCapMode = { kind: 'off' } | { kind: 'fps'; fps: number } | { kind: 'vsync'; every: number } | { kind: 'even'; fps: number }
  | { kind: 'adaptive'; fps: number };

export function parseFrameCap(s: string | null): FrameCapMode | null {
  if (s === null) return null;
  if (s === 'off' || s === 'max') return { kind: 'off' };
  let m = s.match(/^v(\d)$/);
  if (m && +m[1] >= 1) return { kind: 'vsync', every: +m[1] };
  m = s.match(/^e(\d{2,3})$/);
  if (m) return { kind: 'even', fps: +m[1] };
  m = s.match(/^a(\d{2,3})$/);
  if (m) return { kind: 'adaptive', fps: +m[1] };
  m = s.match(/^(\d{2,3})$/);
  if (m) return { kind: 'fps', fps: +m[1] };
  return null;
}

export const frameCapLabel = (m: FrameCapMode): string =>
  m.kind === 'off' ? 'off' : m.kind === 'fps' ? `${m.fps}` : m.kind === 'vsync' ? `v${m.every}` : m.kind === 'even' ? `e${m.fps}` : `a${m.fps}`;

// adaptive step: a frame is late when it comes more than half a vsync after its slot; LATE_MAX late among the last LATE_N rendered frames
// lengthen the step. The first frame and intervals of HITCH_MS or more (a regeneration, a hidden tab) say nothing about the GPU's rate, nor
// do the frames of the next GRACE_MS (the loop's first frames ran 30-100 ms and pushed the step to its floor at every load, journal pass 6h);
// the SETTLE_FRAMES frames after a step change still run at the old pace
const LATE_N = 30, LATE_MAX = 3, SETTLE_FRAMES = 6, HITCH_MS = 250, GRACE_MS = 2000, HOLD_MS = 4000, HOLD_MAX_MS = 16000, TRIAL_MS = 2000, FLOOR_FPS = 30;

export class FrameCap {
  mode: FrameCapMode = { kind: 'off' };
  /** display vsync interval, ms (boot probe) */
  vsync = 1000 / 60;
  /** where `vsync` comes from: 'default' | 'probe' */
  vsyncSource = 'default';
  /** callbacks skipped by the cap since start */
  skipped = 0;
  /** adaptive mode: step changes, step-down trials undone, the last changes as [rAF time ms, vsyncs per frame] */
  steps = 0;
  trialsFailed = 0;
  readonly log: [number, number][] = [];
  private lastRender = NaN;
  private due = NaN;
  private probing = false;
  private probeDeltas: number[] = [];
  private k = 0;
  private late: boolean[] = [];
  private sinceChange = 0;
  private graceUntil = NaN;
  private holdMs = HOLD_MS;
  private changedAt = NaN;
  private trialUntil = NaN;

  /** vsyncs per frame of the current mode (0 = not vsync-locked) */
  every(): number {
    const m = this.mode;
    if (m.kind === 'vsync') return m.every;
    if (m.kind === 'even') return this.evenStep(m.fps);
    if (m.kind === 'adaptive') return this.k || this.evenStep(m.fps);
    return 0;
  }

  private evenStep(fps: number): number {
    return Math.max(1, Math.round(1000 / this.vsync / fps));
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
      if (go && this.mode.kind === 'adaptive') this.adapt(t, t - this.lastRender, k, this.mode.fps);
    } else {
      const iv = 1000 / (this.mode as { fps: number }).fps;
      if (isNaN(this.due) || t - this.due > iv) this.due = t; // first frame, or far behind: restart the schedule
      go = t >= this.due - v / 2;
      if (go) this.due += iv;
    }
    if (go) this.lastRender = t; else this.skipped++;
    return go;
  }

  /** adaptive step, on each rendered frame (`dt` = its interval since the previous one, NaN on the first) */
  private adapt(t: number, dt: number, k: number, fps: number): void {
    if (!(dt < HITCH_MS)) {
      this.graceUntil = t + GRACE_MS; this.late = [];
      if (this.trialUntil > t) this.trialUntil = this.graceUntil + TRIAL_MS; // a trial is judged on frames outside the grace
      return;
    }
    if (t < this.graceUntil) return;
    const k0 = this.evenStep(fps), kMax = Math.max(k0, Math.floor(1000 / this.vsync / FLOOR_FPS + 1e-6));
    if (++this.sinceChange > SETTLE_FRAMES) {
      this.late.push(dt > (k + 0.5) * this.vsync);
      if (this.late.length > LATE_N) this.late.shift();
    }
    const trial = t < this.trialUntil;
    if (k < kMax && this.late.filter(Boolean).length >= LATE_MAX) {
      if (trial) { this.trialsFailed++; this.holdMs = Math.min(HOLD_MAX_MS, this.holdMs * 2); }
      this.setStep(t, k + 1);
    } else if (this.trialUntil <= t) {
      this.trialUntil = NaN; this.holdMs = HOLD_MS; // the shorter step held its trial
    } else if (k > k0 && !trial && t - this.changedAt >= this.holdMs) {
      this.setStep(t, k - 1);
      this.trialUntil = t + TRIAL_MS;
    }
  }

  private setStep(t: number, k: number): void {
    this.k = k; this.changedAt = t; this.late = []; this.sinceChange = 0; this.trialUntil = NaN; this.steps++;
    this.log.push([+t.toFixed(1), k]);
    if (this.log.length > 16) this.log.shift();
  }
}
