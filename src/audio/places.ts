/** The places' sounds of lot S2 (journal Passes SN18 / SN19), as the operator kept them on the sheet briefs/fiche-son-lieux.html: the steps on the setts and
 *  on the lists' earth (S2-PAS « Bonne direction »), the rain's patter (S2-PLUIE « Bonne direction »), the thunder after a flash (S2-ORAGE « Bonne direction »).
 *  Computed in the page, never baked (S2-POIDS « Calculer dans la page, cuire l’interface et le murmure (121 Ko) »): each its own seed, the same samples every
 *  time; the patter and the thunder are written step by step (a generator), so that the engine can spread them over a few frames. Pure. */

/** a seeded draw (mulberry32): a sound never takes from the game's random numbers nor from Math.random */
export class Draw {
  private s: number;
  constructor(seed: number) { this.s = seed >>> 0; }
  next(): number {
    let t = (this.s = (this.s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  bi(): number { return this.next() * 2 - 1; }
  range(a: number, b: number): number { return a + (b - a) * this.next(); }
  pick<T>(list: readonly T[]): T { return list[Math.floor(this.next() * list.length)]; }
}
export function seedOf(text: string): number { let h = 2166136261; for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619); return h >>> 0; }

type Kind = 'lp' | 'hp' | 'bp';
/** a biquad of the cookbook (the band-pass at 0 dB at its centre) */
class Biquad {
  private b0 = 0; private b1 = 0; private b2 = 0; private a1 = 0; private a2 = 0; private x1 = 0; private x2 = 0; private y1 = 0; private y2 = 0;
  constructor(kind: Kind, f: number, q: number, sr: number) { this.set(kind, f, q, sr); }
  set(kind: Kind, f: number, q: number, sr: number): void {
    const w = 2 * Math.PI * Math.min(f, sr * 0.45) / sr, c = Math.cos(w), al = Math.sin(w) / (2 * q), a0 = 1 + al;
    if (kind === 'lp') { this.b0 = (1 - c) / 2 / a0; this.b1 = (1 - c) / a0; this.b2 = this.b0; }
    else if (kind === 'hp') { this.b0 = (1 + c) / 2 / a0; this.b1 = -(1 + c) / a0; this.b2 = this.b0; }
    else { this.b0 = al / a0; this.b1 = 0; this.b2 = -al / a0; }
    this.a1 = -2 * c / a0; this.a2 = (1 - al) / a0;
  }
  step(x: number): number {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y; return y;
  }
}
const run = (x: Float32Array, kind: Kind, f: number, q: number, sr: number): Float32Array => { const b = new Biquad(kind, f, q, sr); for (let i = 0; i < x.length; i++) x[i] = b.step(x[i]); return x; };
/** a filter round a circle: a first lap primes it, the second is kept, so the loop's start hears its end (journal Passe SN19: run once, the patter's first 10 ms
 *  differed from its circle by -35.6 dB) */
const runRound = (x: Float32Array, kind: Kind, f: number, q: number, sr: number): Float32Array => { const b = new Biquad(kind, f, q, sr); for (let i = 0; i < x.length; i++) b.step(x[i]); for (let i = 0; i < x.length; i++) x[i] = b.step(x[i]); return x; };

/** a burst of noise through a band, decaying: the click of a heel, a pop of the fire, a drop on a stone. `wrap` writes round a circle (a loop) */
function burst(y: Float32Array, r: Draw, sr: number, o: { at: number; f: number; q?: number; a: number; tau: number; attack?: number; kind?: Kind; wrap?: boolean }): void {
  const n = Math.min(Math.round((o.tau * 7 + (o.attack ?? 0)) * sr), y.length), b = new Biquad(o.kind ?? 'bp', o.f, o.q ?? 1, sr), at = Math.round(o.at * sr), atk = (o.attack ?? 0.0004) * sr;
  for (let i = 0; i < n; i++) {
    const e = (i < atk ? i / atk : 1) * Math.exp(-(i / sr) / o.tau), v = b.step(r.bi()) * e * o.a;
    let p = at + i; if (o.wrap) p %= y.length; else if (p >= y.length) break;
    y[p] += v;
  }
}
const smooth = (x: number): number => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const rms = (x: Float32Array, from = 0, to = x.length): number => { let s = 0; for (let i = from; i < to; i++) s += x[i] * x[i]; return Math.sqrt(s / Math.max(1, to - from)); };
/** the level set on the loudest window (dBFS RMS): every sound of a kind at the same weight, the engine's gains then mean the same thing; the peak kept under
 *  `ceil` (an impulse's crest is far above its window's level) */
function level(chs: Float32Array[], db: number, sr: number, win = 0.4, ceil = 0.7): void {
  const w = Math.max(1, Math.round(win * sr)), n = chs[0].length; let best = 0;
  for (let i = 0; i + w <= n || i === 0; i += Math.max(1, w >> 2)) { let s = 0; for (const c of chs) s += rms(c, i, Math.min(n, i + w)) ** 2; best = Math.max(best, Math.sqrt(s / chs.length)); if (i + w > n) break; }
  let g = best > 0 ? 10 ** (db / 20) / best : 0, peak = 0;
  for (const c of chs) for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(c[i]));
  if (peak * g > ceil) g = ceil / peak;
  for (const c of chs) for (let i = 0; i < n; i++) c[i] *= g;
}
/** the last milliseconds faded: no click when a buffer ends */
function tail(x: Float32Array, sr: number, secs = 0.02): Float32Array { const n = Math.min(x.length, Math.round(secs * sr)); for (let i = 0; i < n; i++) x[x.length - 1 - i] *= i / n; return x; }

// ---------------------------------------------------------------------------------------------------------------- one-shots

export type Surface = 'stone' | 'earth';
/** a step: the heel, then the toe; on the setts a leather click and the weight of the body, on the lists' earth a crunch of grit */
export function step(sr: number, surface: Surface, take: number): Float32Array {
  const r = new Draw(seedOf(`step:${surface}:${take}`)), y = new Float32Array(Math.round(0.3 * sr)), toe = r.range(0.045, 0.075);
  burst(y, r, sr, { at: 0, f: 160, q: 0.7, a: 1.1, tau: 0.02, kind: 'lp', attack: 0.002 });
  if (surface === 'stone') {
    burst(y, r, sr, { at: 0.001, f: r.range(1500, 2000), q: 1.1, a: 0.9, tau: 0.006 });
    burst(y, r, sr, { at: 0.001, f: r.range(3600, 4600), q: 0.9, a: 0.3, tau: 0.003 });
    burst(y, r, sr, { at: toe, f: r.range(2300, 2900), q: 1.2, a: 0.4, tau: 0.004 });
    for (let k = 0; k < 4; k++) burst(y, r, sr, { at: toe + r.range(0, 0.02), f: r.range(5000, 8000), q: 1.3, a: 0.08, tau: 0.001 });
  } else {
    for (let k = 0; k < 28; k++) burst(y, r, sr, { at: 0.004 + 0.085 * r.next() ** 1.6, f: r.range(1500, 5500), q: 1.5, a: r.range(0.12, 0.4), tau: r.range(0.0015, 0.004) });
    for (let k = 0; k < 12; k++) burst(y, r, sr, { at: toe + 0.05 * r.next() ** 1.4, f: r.range(2000, 6000), q: 1.5, a: r.range(0.08, 0.25), tau: r.range(0.0015, 0.003) });
  }
  level([y], -14, sr, 0.1);
  return tail(y, sr);
}

/** thunder after a flash: 0 near (the crack, then the roll), 1 rolling at a middle distance, 2 far off (the low rumble alone). Stereo; written stroke by stroke */
export function* thunderSteps(sr: number, take: number): Generator<void, [Float32Array, Float32Array]> {
  const r = new Draw(seedOf(`thunder:${take}`)), k = take % 3, secs = 7.5, n = Math.round(secs * sr), L = new Float32Array(n), R = new Float32Array(n);
  const strokes = [14, 11, 8][k], span = [3.2, 3.4, 4][k], cut = ([[180, 700], [120, 420], [70, 220]] as const)[k];
  // the roll lives under 700 Hz: written at a quarter of the rate, then read back at the full rate (four times less work)
  const q = 4, lr = sr / q, m = Math.ceil(n / q) + 2, lL = new Float32Array(m), lR = new Float32Array(m);
  const add = (x: Float32Array, at: number, pan: number, g: number, rate: number, oL: Float32Array, oR: Float32Array) => {
    const th = (pan + 1) * Math.PI / 4, gl = Math.cos(th) * g, gr = Math.sin(th) * g, a = Math.round(at * rate), d = Math.round(Math.abs(pan) * 0.012 * rate), len = oL.length;
    for (let i = 0; i < x.length; i++) { if (a + i < len && !(pan > 0 && i < d)) oL[a + i] += x[i] * gl; const j = a + i + (pan < 0 ? d : 0); if (j < len) oR[j] += x[i] * gr; }
  };
  for (let s = 0; s < strokes; s++) {
    const at = (k === 0 ? 0.08 : 0.15) + span * r.next() ** 1.7, tau = r.range(0.35, 1.4), atk = k === 2 ? r.range(0.1, 0.3) : r.range(0.02, 0.12), len = Math.round(Math.min(atk + tau * 5, secs - at) * lr), x = new Float32Array(Math.max(1, len)), f = r.range(cut[0], cut[1]);
    for (let i = 0; i < x.length; i++) { const t = i / lr; x[i] = r.bi() * smooth(t / atk) * Math.exp(-Math.max(0, t - atk) / tau); }
    run(x, 'lp', f, 0.7, lr); run(x, 'lp', f, 0.7, lr);
    add(x, at, r.bi() * 0.7, (1 - 0.6 * at / (span + 0.2)) * r.range(0.5, 1), lr, lL, lR);
    yield;
  }
  const body = new Float32Array(Math.round(5 * lr));
  for (let i = 0; i < body.length; i++) { const t = i / lr; body[i] = r.bi() * smooth(t / 0.35) * Math.exp(-Math.max(0, t - 0.35) / 1.2); }
  run(body, 'lp', 60, 0.7, lr); run(body, 'lp', 60, 0.7, lr); add(body, 0.2, 0, 2.5, lr, lL, lR);
  run(lL, 'hp', 28, 0.7, lr); run(lR, 'hp', 28, 0.7, lr);
  yield;
  // back to the full rate (linear: the roll has nothing above a few hundred hertz to fold)
  for (let i = 0; i < n; i++) { const p = i / q, j = Math.floor(p), u = p - j; L[i] = lL[j] + (lL[j + 1] - lL[j]) * u; R[i] = lR[j] + (lR[j + 1] - lR[j]) * u; }
  if (k === 0) {
    const crack = new Float32Array(Math.round(0.8 * sr));
    burst(crack, r, sr, { at: 0, f: 800, q: 0.7, a: 1, tau: 0.08, kind: 'hp' });
    for (let j = 0; j < 5; j++) { const p = Math.round(r.range(0, 0.04) * sr); crack[p] += r.bi() * 0.6; }
    run(crack, 'lp', 7000, 0.7, sr);
    burst(crack, r, sr, { at: 0.01, f: 1500, q: 0.7, a: 0.5, tau: 0.25, attack: 0.01 });
    run(crack, 'hp', 40, 0.7, sr);
    add(crack, 0.02, r.bi() * 0.4, 0.6, sr, L, R);
  }
  yield;
  level([L, R], [-12, -15, -19][k], sr, 1);
  return [tail(L, sr, 0.3), tail(R, sr, 0.3)];
}

// ---------------------------------------------------------------------------------------------------------------- loops

/** a stereo circle: the samples written past its end land on its start, so it loops without a seam */
function circle(secs: number, sr: number): [Float32Array, Float32Array] { const n = Math.round(secs * sr); return [new Float32Array(n), new Float32Array(n)]; }
const pan2 = (pan: number): [number, number] => { const th = (Math.max(-1, Math.min(1, pan)) + 1) * Math.PI / 4; return [Math.cos(th), Math.sin(th)]; };

/** the rain's drops: ticking on the setts and the roofs, plinks in the puddles and the canal (a bubble's rising note); written a hundred drops at a time, round a
 *  circle of `secs` (`wrap`), or flat with 0.2 s past its end (the proof that the circle is the flat drops folded) */
export function* patterDrops(sr: number, secs: number, seed: number, wrap: boolean): Generator<void, [Float32Array, Float32Array]> {
  const r = new Draw(seedOf(`patter:${seed}`)), [L, R] = circle(secs + (wrap ? 0 : 0.2), sr), n = Math.round(secs * sr);
  for (let d = 0, count = Math.round(210 * secs); d < count; d++) {
    const plink = r.next() < 0.22, a = 0.15 + 0.85 * r.next() ** 3, at = Math.floor(r.next() * n), [gl, gr] = pan2(r.bi() * 0.9);
    if (plink) {
      // a bubble: its note rising as it closes, decaying in a few tens of milliseconds
      const f0 = r.range(1200, 3400), tau = r.range(0.01, 0.025), len = Math.round(tau * 5 * sr), k = Math.exp(-1 / (tau * sr)); let ph = 0, e = 0.4 * a;
      for (let i = 0; i < len; i++) { ph += f0 * (1 + 0.6 * i / len) / sr; const v = Math.sin(2 * Math.PI * ph) * e * Math.min(1, i / 48); e *= k; const p = wrap ? (at + i) % n : at + i; L[p] += v * gl; R[p] += v * gr; }
    } else {
      // a tick on a stone: a few samples of noise through a band
      const b = new Biquad('bp', r.range(2500, 9000), r.range(0.8, 1.5), sr), tau = r.range(0.0008, 0.003), len = Math.round(tau * 6 * sr), k = Math.exp(-1 / (tau * sr)); let e = a;
      for (let i = 0; i < len; i++) { const v = b.step(r.bi()) * e; e *= k; const p = wrap ? (at + i) % n : at + i; L[p] += v * gl; R[p] += v * gr; }
    }
    if (d % 100 === 99) yield;
  }
  return [L, R];
}
/** the rain's patter, a circle: its drops, a high-pass, its level */
export function* patterSteps(sr: number, secs = 7, seed = 1): Generator<void, [Float32Array, Float32Array]> {
  const [L, R] = yield* patterDrops(sr, secs, seed, true);
  for (const c of [L, R]) { runRound(c, 'hp', 300, 0.7, sr); yield; }
  level([L, R], -22, sr, secs);
  return [L, R];
}

// ---------------------------------------------------------------------------------------------------------------- the table

/** a generator run to its end */
export function finish<T>(g: Generator<void, T>): T { for (;;) { const r = g.next(); if (r.done) return r.value; } }
export const thunder = (sr: number, take: number): [Float32Array, Float32Array] => finish(thunderSteps(sr, take));
export const patter = (sr: number, secs = 7, seed = 1): [Float32Array, Float32Array] => finish(patterSteps(sr, secs, seed));

/** the sounds computed in the page, by id, and how many takes each has */
export const COMPUTED = { 'step-stone': 4, 'step-earth': 4, thunder: 3, patter: 1 } as const;
export type ComputedId = keyof typeof COMPUTED;
/** a computed sound's take, its channels, step by step (the steps in one: under a millisecond) */
export function* computeSteps(id: ComputedId, take: number, sr: number): Generator<void, Float32Array[]> {
  switch (id) {
    case 'step-stone': return [step(sr, 'stone', take)];
    case 'step-earth': return [step(sr, 'earth', take)];
    case 'thunder': return yield* thunderSteps(sr, take);
    case 'patter': return yield* patterSteps(sr);
  }
}
/** a computed sound's take, its channels, at once */
export const compute = (id: ComputedId, take: number, sr: number): Float32Array[] => finish(computeSteps(id, take, sr));
