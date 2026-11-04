import { nextBoundary } from './score';

/** where a decoded stem's loop lies (journal Passe SN10): a decoder may leave a codec's delay before it and padding after it (src/audio/align.ts) */
export interface LoopSpan { offset: number; frames: number; rate: number }

/** Synchronous layers (lot S1, journal Passe SN3; SA-5 « Oui, par couches »): stems of one length started on one clock and looped to the sample, each
 *  with its own level; a level moves on the next bar, so the music changes on its beat, never in the middle of one. The band's pieces play on it, one stem
 *  or the fights' three (journal Passe SN10): each stem looped on its own span, the loop started at `at` (after an intro) or now. */
export class LayerSet {
  /** the audio time of position 0 */
  readonly start: number;
  /** the loop's length in seconds */
  readonly length: number;
  private sources: AudioBufferSourceNode[] = [];
  private gains: GainNode[] = [];
  private held: number[];

  constructor(private c: BaseAudioContext, stems: readonly AudioBuffer[], readonly bar: number, out: AudioNode, levels: readonly number[], from = 0, o: { at?: number; spans?: readonly LoopSpan[] } = {}) {
    const spans = o.spans;
    if (!stems.length || (spans ? spans.length !== stems.length || spans.some((p, i) => p.frames / p.rate !== spans[0].frames / spans[0].rate || p.offset + p.frames * (stems[i].sampleRate / p.rate) > stems[i].length + 1) : stems.some((s) => s.length !== stems[0].length))) throw new RangeError('layers need stems of one length');
    this.length = spans ? spans[0].frames / spans[0].rate : stems[0].duration;
    const at = o.at ?? c.currentTime + 0.1;
    this.start = at - from;
    this.held = stems.map((_, i) => levels[i] ?? 0);
    stems.forEach((b, i) => {
      const s = c.createBufferSource(), g = c.createGain(), a = spans ? spans[i].offset / b.sampleRate : 0;
      s.buffer = b; s.loop = true; if (spans) { s.loopStart = a; s.loopEnd = a + this.length; } g.gain.value = this.held[i];
      s.connect(g); g.connect(out); s.start(at, a + from);
      this.sources.push(s); this.gains.push(g);
    });
  }

  /** a layer's level now */
  levelOf(i: number): number { return this.held[i]; }

  /** a layer to a level from the next bar, over `ramp` seconds; returns when it moves */
  level(i: number, v: number, ramp = 0.25): number {
    const t = nextBoundary(this.c.currentTime, this.start, this.bar), g = this.gains[i].gain;
    g.setValueAtTime(this.held[i], t); g.linearRampToValueAtTime(v, t + ramp);
    this.held[i] = v;
    return t;
  }

  /** where the loop stands, in seconds (0 while an intro still plays before it) */
  position(): number { const p = this.c.currentTime - this.start; return p < 0 ? 0 : p % this.length; }

  /** down in `secs`, then gone */
  stop(secs = 0.8): void {
    const t = this.c.currentTime;
    for (const g of this.gains) { g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(0, t, secs / 3); }
    for (const s of this.sources) s.stop(t + secs + 0.2);
  }
}
