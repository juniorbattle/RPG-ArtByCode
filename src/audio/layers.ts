import { nextBoundary } from './score';

/** Synchronous layers (lot S1, journal Passe SN3; SA-5 « Oui, par couches »): stems of one length started on one clock and looped to the sample, each
 *  with its own level; a level moves on the next bar, so the music changes on its beat, never in the middle of one. Their music is lot S3. */
export class LayerSet {
  /** the audio time of position 0 */
  readonly start: number;
  /** the loop's length in seconds */
  readonly length: number;
  private sources: AudioBufferSourceNode[] = [];
  private gains: GainNode[] = [];
  private held: number[];

  constructor(private c: BaseAudioContext, stems: readonly AudioBuffer[], readonly bar: number, out: AudioNode, levels: readonly number[], from = 0) {
    if (!stems.length || stems.some((s) => s.length !== stems[0].length)) throw new RangeError('layers need stems of one length');
    this.length = stems[0].duration;
    const at = c.currentTime + 0.1;
    this.start = at - from;
    this.held = stems.map((_, i) => levels[i] ?? 0);
    stems.forEach((b, i) => {
      const s = c.createBufferSource(), g = c.createGain();
      s.buffer = b; s.loop = true; g.gain.value = this.held[i];
      s.connect(g); g.connect(out); s.start(at, from);
      this.sources.push(s); this.gains.push(g);
    });
  }

  /** a layer to a level from the next bar, over `ramp` seconds; returns when it moves */
  level(i: number, v: number, ramp = 0.25): number {
    const t = nextBoundary(this.c.currentTime, this.start, this.bar), g = this.gains[i].gain;
    g.setValueAtTime(this.held[i], t); g.linearRampToValueAtTime(v, t + ramp);
    this.held[i] = v;
    return t;
  }

  /** where the loop stands, in seconds */
  position(): number { return (((this.c.currentTime - this.start) % this.length) + this.length) % this.length; }

  /** down in `secs`, then gone */
  stop(secs = 0.8): void {
    const t = this.c.currentTime;
    for (const g of this.gains) { g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(0, t, secs / 3); }
    for (const s of this.sources) s.stop(t + secs + 0.2);
  }
}
