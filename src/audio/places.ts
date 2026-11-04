/** The places' sounds (lot S2, journal Passe SN18): what the version 2's places, their hours and their weather sound like, beyond the band's music. Written as
 *  recipes computed in the page when a scene first needs them (each a few milliseconds, its own seed: the same samples every time), not baked: the margin
 *  under SA-17 « 12 Mo au plus » was 0.29 MiB after lot S3 (journal Passe SN17). The rain's patter, the braziers' fire, the thunder, the birds, the crickets,
 *  the owl, the forge's anvil, the practice of the lists, the stables, the boat's timbers and the steps on the setts and on the lists' earth. Pure. */

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

/** a burst of noise through a band, decaying: the click of a heel, a pop of the fire, a drop on a stone. `wrap` writes round a circle (a loop) */
function burst(y: Float32Array, r: Draw, sr: number, o: { at: number; f: number; q?: number; a: number; tau: number; attack?: number; kind?: Kind; wrap?: boolean }): void {
  const n = Math.min(Math.round((o.tau * 7 + (o.attack ?? 0)) * sr), y.length), b = new Biquad(o.kind ?? 'bp', o.f, o.q ?? 1, sr), at = Math.round(o.at * sr), atk = (o.attack ?? 0.0004) * sr;
  for (let i = 0; i < n; i++) {
    const e = (i < atk ? i / atk : 1) * Math.exp(-(i / sr) / o.tau), v = b.step(r.bi()) * e * o.a;
    let p = at + i; if (o.wrap) p %= y.length; else if (p >= y.length) break;
    y[p] += v;
  }
}
/** a few modes ringing (a metal, a wood): [frequency, amplitude, decay] */
function modes(y: Float32Array, sr: number, at: number, list: ReadonlyArray<readonly [number, number, number]>, g = 1, r?: Draw): void {
  const a0 = Math.round(at * sr);
  for (const [f, a, tau] of list) {
    const ff = f * (r ? 1 + r.bi() * 0.006 : 1), w = 2 * Math.PI * ff / sr, d = Math.exp(-1 / (tau * sr)), c = Math.cos(w), s = Math.sin(w), n = Math.min(Math.round(tau * 8 * sr), y.length - a0);
    let re = 0, im = a * g, amp = 1;
    for (let i = 0; i < n; i++) { y[a0 + i] += re * amp * Math.min(1, i / 24); const nr = re * c - im * s; im = re * s + im * c; re = nr; amp *= d; }
  }
}
/** a tone whose frequency follows f(t) and its level env(t), with a few harmonics: a bird, a cricket, an owl */
function tone(y: Float32Array, sr: number, at: number, secs: number, f: (t: number) => number, env: (t: number) => number, harm: readonly number[] = [1]): void {
  const a0 = Math.round(at * sr), n = Math.min(Math.round(secs * sr), y.length - a0); let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr, e = env(t); ph += f(t) / sr; if (ph > 1) ph -= Math.floor(ph);
    if (e <= 1e-5) continue;
    let v = 0; for (let h = 0; h < harm.length; h++) v += harm[h] * Math.sin(2 * Math.PI * ph * (h + 1));
    y[a0 + i] += v * e;
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

/** the birds of the day: 0 a sparrow's chirps, 1 a blackbird's phrase (on the motif's notes, D, E, G, A, two octaves up: the band's colour, never a tune), 2 the
 *  swallows' twitter of the end of the day */
export function bird(sr: number, take: number): Float32Array {
  const r = new Draw(seedOf(`bird:${take}`)), y = new Float32Array(Math.round(1.8 * sr));
  if (take % 3 === 0) {
    let t = 0.02; const count = 4 + Math.floor(r.next() * 4);
    for (let k = 0; k < count; k++) {
      const d = r.range(0.04, 0.08), f0 = r.range(4300, 5400), f1 = r.range(3000, 3800), up = r.next() < 0.3;
      tone(y, sr, t, d, (u) => (up ? f1 + (f0 - f1) * Math.sin(Math.PI * u / d) : f0 + (f1 - f0) * (u / d)), (u) => Math.sin(Math.PI * u / d) ** 2 * r.range(0.6, 1), [1, 0.16]);
      t += d + r.range(0.06, 0.14);
    }
  } else if (take % 3 === 1) {
    const notes = [2349.3, 2637, 3136, 3520], phrase = [r.pick(notes), r.pick(notes), r.pick(notes), r.pick(notes), r.pick(notes)]; let t = 0.02;
    phrase.forEach((f, k) => {
      const d = r.range(0.08, 0.17), next = phrase[k + 1] ?? f * 0.94, warble = r.range(20, 34);
      tone(y, sr, t, d, (u) => (f + (next - f) * smooth((u / d - 0.7) / 0.3)) * (1 + 0.02 * Math.sin(2 * Math.PI * warble * u)), (u) => smooth(u / 0.015) * Math.exp(-u / (d * 0.9)) * 0.9, [1, 0.22, 0.05]);
      t += d + r.range(0.03, 0.08);
    });
    for (let k = 0; k < 5; k++) { const d = 0.022; tone(y, sr, t, d, (u) => 5200 - 1600 * u / d, (u) => Math.sin(Math.PI * u / d) ** 2 * 0.4, [1]); t += 0.035; }
  } else {
    let t = 0.02; const count = 12 + Math.floor(r.next() * 8);
    for (let k = 0; k < count; k++) {
      const d = r.range(0.015, 0.026), f = r.range(4200, 6800), wob = r.range(60, 110);
      tone(y, sr, t, d, (u) => f * (1 + 0.08 * Math.sin(2 * Math.PI * wob * u)), (u) => Math.sin(Math.PI * u / d) ** 2 * r.range(0.4, 1), [1, 0.1]);
      t += d + r.range(0.012, 0.05) + (r.next() < 0.15 ? 0.15 : 0);
    }
  }
  level([y], -16, sr, 0.3);
  return tail(y, sr);
}

/** a field cricket at night: chirps of three or four pulses, repeated */
export function cricket(sr: number, take: number): Float32Array {
  const r = new Draw(seedOf(`cricket:${take}`)), y = new Float32Array(Math.round(2.4 * sr)), f = take % 2 ? 4900 : 4400, every = take % 2 ? 0.46 : 0.58;
  for (let t = 0.02; t < 2.2; t += every * r.range(0.95, 1.05)) {
    const pulses = r.next() < 0.5 ? 3 : 4, a = r.range(0.6, 1);
    for (let p = 0; p < pulses; p++) tone(y, sr, t + p * 0.032, 0.016, () => f, (u) => Math.sin(Math.PI * u / 0.016) ** 2 * a, [1, 0, 0.08]);
  }
  level([y], -20, sr, 0.5);
  return tail(y, sr);
}

/** a tawny owl far off: « hoo », a pause, « hu-hu-hoooo », breathy */
export function owl(sr: number): Float32Array {
  const r = new Draw(seedOf('owl')), y = new Float32Array(Math.round(3.2 * sr)), breath = new Float32Array(y.length);
  const hoot = (at: number, d: number, f0: number, trem = 0) => {
    tone(y, sr, at, d + 0.1, (u) => f0 * (1 + 0.04 * Math.sin(Math.PI * Math.min(1, u / d))), (u) => smooth(u / 0.06) * (u < d ? 1 : Math.exp(-(u - d) / 0.04)) * (1 - trem * 0.5 * (1 + Math.sin(2 * Math.PI * 6 * u))), [1, 0.28, 0.08]);
    for (let i = 0; i < Math.round(d * sr); i++) breath[Math.round(at * sr) + i] += r.bi() * 0.25 * smooth(i / sr / 0.06);
  };
  hoot(0.05, 0.45, 410); hoot(1.45, 0.1, 400); hoot(1.65, 0.1, 405); hoot(1.85, 0.85, 415, 0.6);
  run(breath, 'bp', 700, 0.8, sr); for (let i = 0; i < y.length; i++) y[i] += breath[i];
  run(y, 'lp', 2400, 0.7, sr);
  level([y], -20, sr, 0.5);
  return tail(y, sr);
}

const ANVIL: ReadonlyArray<readonly [number, number, number]> = [[1180, 1, 0.9], [2720, 0.6, 0.7], [3990, 0.45, 0.5], [5350, 0.3, 0.35], [7100, 0.15, 0.2]];
/** the forge's anvil: a strike on the hot iron (a dull blow, a short ring), the hammer's rebound on the face (a clear tink), in the smith's rhythm */
export function anvil(sr: number, take: number): Float32Array {
  const r = new Draw(seedOf(`anvil:${take}`)), y = new Float32Array(Math.round(2.4 * sr));
  const strike = (at: number) => { burst(y, r, sr, { at, f: 260, q: 0.7, a: 1.2, tau: 0.03, kind: 'lp' }); modes(y, sr, at, ANVIL.map(([f, a, t]) => [f, a, t * 0.18] as const), 0.5, r); burst(y, r, sr, { at, f: 3500, q: 1, a: 0.4, tau: 0.002 }); };
  const tink = (at: number) => { modes(y, sr, at, ANVIL, 0.32, r); burst(y, r, sr, { at, f: 5000, q: 1, a: 0.15, tau: 0.0015 }); };
  const PAT = [[['s', 0], ['s', 0.55], ['t', 0.85], ['t', 1.0]], [['s', 0], ['s', 0.42], ['s', 0.84], ['t', 1.1]], [['t', 0], ['t', 0.15], ['s', 0.5], ['s', 1.0]]] as const;
  for (const [k, at] of PAT[take % 3]) (k === 's' ? strike : tink)(at + r.range(-0.015, 0.015));
  run(y, 'lp', 6000, 0.7, sr);
  level([y], -16, sr, 0.4);
  return tail(y, sr, 0.1);
}

/** the practice of the lists: 0 two wooden swords, 1 steel on steel with its scrape, 2 three wooden knocks, 3 a blade into a straw dummy */
export function clash(sr: number, take: number): Float32Array {
  const r = new Draw(seedOf(`clash:${take}`)), y = new Float32Array(Math.round(1.4 * sr));
  const WOOD: ReadonlyArray<readonly [number, number, number]> = [[620, 1, 0.045], [1340, 0.6, 0.028], [2150, 0.35, 0.016]];
  const knock = (at: number, g = 1) => { modes(y, sr, at, WOOD, g, r); burst(y, r, sr, { at, f: 1800, q: 0.9, a: 0.5 * g, tau: 0.003 }); };
  const k = take % 4;
  if (k === 0) { knock(0); knock(0.18, 0.8); }
  else if (k === 2) { knock(0); knock(0.14, 0.7); knock(0.33, 0.9); }
  else if (k === 1) {
    const STEEL: ReadonlyArray<readonly [number, number, number]> = [[2100, 1, 0.35], [3180, 0.7, 0.25], [4410, 0.5, 0.18], [5900, 0.3, 0.12]];
    modes(y, sr, 0, STEEL, 0.6, r); burst(y, r, sr, { at: 0, f: 3000, q: 0.8, a: 0.6, tau: 0.003 });
    burst(y, r, sr, { at: 0.03, f: 3500, q: 2, a: 0.25, tau: 0.04, attack: 0.02 });
    modes(y, sr, 0.22, STEEL.map(([f, a, t]) => [f * 1.04, a, t * 0.7] as const), 0.35, r);
  } else {
    burst(y, r, sr, { at: 0, f: 300, q: 0.7, a: 1.2, tau: 0.05, kind: 'lp' });
    for (let j = 0; j < 30; j++) burst(y, r, sr, { at: 0.005 + 0.07 * r.next(), f: r.range(2500, 7000), q: 1.2, a: r.range(0.05, 0.2), tau: 0.002 });
  }
  level([y], -16, sr, 0.3);
  return tail(y, sr, 0.05);
}

/** the stables under the lists' gallery: 0 two hooves on the boards, 1 a snort, 2 a horse shifting on the stones */
export function stable(sr: number, take: number): Float32Array {
  const r = new Draw(seedOf(`stable:${take}`)), y = new Float32Array(Math.round(1.4 * sr)), k = take % 3;
  if (k === 0) for (const at of [0, 0.35]) { burst(y, r, sr, { at, f: 200, q: 0.7, a: 1.2, tau: 0.04, kind: 'lp' }); modes(y, sr, at, [[480, 0.6, 0.03], [1050, 0.3, 0.02]], 1, r); }
  else if (k === 1) {
    const n = Math.round(0.7 * sr), x = new Float32Array(n);
    for (let i = 0; i < n; i++) { const t = i / sr, e = smooth(t / 0.05) * Math.exp(-Math.max(0, t - 0.05) / 0.18), flutter = 0.6 + 0.4 * Math.sin(2 * Math.PI * 28 * t); x[i] = r.bi() * e * flutter; }
    run(x, 'bp', 650, 0.8, sr); run(x, 'lp', 2500, 0.7, sr);
    for (let i = 0; i < n; i++) y[i] += x[i] * 3;
    tone(y, sr, 0.02, 0.4, () => 108, (u) => smooth(u / 0.05) * Math.exp(-u / 0.12) * 0.05, [1, 0.5, 0.3]);
  } else for (const at of [0, 0.18, 0.5, 0.62]) { burst(y, r, sr, { at, f: 220, q: 0.7, a: 0.8, tau: 0.025, kind: 'lp' }); burst(y, r, sr, { at, f: r.range(1200, 1600), q: 1, a: 0.6, tau: 0.005 }); burst(y, r, sr, { at, f: r.range(2600, 3200), q: 1, a: 0.3, tau: 0.003 }); }
  level([y], -18, sr, 0.3);
  return tail(y, sr, 0.05);
}

/** the moored boat's timbers and ropes on the canal: wood that sticks and slips, a rope that stretches */
export function creak(sr: number, take: number): Float32Array {
  const r = new Draw(seedOf(`creak:${take}`)), secs = r.range(0.8, 1.3), n = Math.round((secs + 0.3) * sr), x = new Float32Array(n), rope = take % 3 === 1;
  const lo = rope ? 80 : 22, hi = rope ? 140 : 70;
  for (let t = 0.02; t < secs;) { const u = t / secs, rate = lo + (hi - lo) * Math.sin(Math.PI * u) * (0.8 + 0.4 * r.next()); x[Math.round(t * sr)] += (0.5 + 0.5 * r.next()) * Math.sin(Math.PI * u) ** 0.5; t += 1 / rate; }
  const y = new Float32Array(n), RES = rope ? [[1100, 25, 1], [1900, 30, 0.6]] : take % 3 === 2 ? [[180, 12, 1], [420, 15, 0.7], [960, 20, 0.3]] : [[310, 14, 1], [690, 18, 0.7], [1420, 24, 0.4], [2300, 30, 0.2]];
  for (const [f, q, a] of RES) { const b = new Biquad('bp', f, q, sr); for (let i = 0; i < n; i++) y[i] += b.step(x[i]) * a; }
  level([y], -20, sr, 0.4);
  return tail(y, sr, 0.05);
}

/** thunder after a flash: 0 near (the crack, then the roll), 1 rolling at a middle distance, 2 far off (the low rumble alone). Stereo */
export function thunder(sr: number, take: number): [Float32Array, Float32Array] {
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
  }
  const body = new Float32Array(Math.round(5 * lr));
  for (let i = 0; i < body.length; i++) { const t = i / lr; body[i] = r.bi() * smooth(t / 0.35) * Math.exp(-Math.max(0, t - 0.35) / 1.2); }
  run(body, 'lp', 60, 0.7, lr); run(body, 'lp', 60, 0.7, lr); add(body, 0.2, 0, 2.5, lr, lL, lR);
  run(lL, 'hp', 28, 0.7, lr); run(lR, 'hp', 28, 0.7, lr);
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
  level([L, R], [-12, -15, -19][k], sr, 1);
  return [tail(L, sr, 0.3), tail(R, sr, 0.3)];
}

// ---------------------------------------------------------------------------------------------------------------- loops

/** a stereo circle: the samples written past its end land on its start, so it loops without a seam */
function circle(secs: number, sr: number): [Float32Array, Float32Array] { const n = Math.round(secs * sr); return [new Float32Array(n), new Float32Array(n)]; }
const pan2 = (pan: number): [number, number] => { const th = (Math.max(-1, Math.min(1, pan)) + 1) * Math.PI / 4; return [Math.cos(th), Math.sin(th)]; };

/** the rain's patter, a circle: drops ticking on the setts and the roofs, plinks in the puddles and the canal (a bubble's rising note) */
export function patter(sr: number, secs = 7, seed = 1): [Float32Array, Float32Array] {
  const r = new Draw(seedOf(`patter:${seed}`)), [L, R] = circle(secs, sr), n = L.length;
  for (let d = 0, count = Math.round(210 * secs); d < count; d++) {
    const plink = r.next() < 0.22, a = 0.15 + 0.85 * r.next() ** 3, at = Math.floor(r.next() * n), [gl, gr] = pan2(r.bi() * 0.9);
    if (plink) {
      // a bubble: its note rising as it closes, decaying in a few tens of milliseconds
      const f0 = r.range(1200, 3400), tau = r.range(0.01, 0.025), len = Math.round(tau * 5 * sr), k = Math.exp(-1 / (tau * sr)); let ph = 0, e = 0.4 * a;
      for (let i = 0; i < len; i++) { ph += f0 * (1 + 0.6 * i / len) / sr; const v = Math.sin(2 * Math.PI * ph) * e * Math.min(1, i / 48); e *= k; const p = (at + i) % n; L[p] += v * gl; R[p] += v * gr; }
    } else {
      // a tick on a stone: a few samples of noise through a band
      const b = new Biquad('bp', r.range(2500, 9000), r.range(0.8, 1.5), sr), tau = r.range(0.0008, 0.003), len = Math.round(tau * 6 * sr), k = Math.exp(-1 / (tau * sr)); let e = a;
      for (let i = 0; i < len; i++) { const v = b.step(r.bi()) * e; e *= k; const p = (at + i) % n; L[p] += v * gl; R[p] += v * gr; }
    }
  }
  for (const c of [L, R]) run(c, 'hp', 300, 0.7, sr);
  level([L, R], -22, sr, secs);
  return [L, R];
}

/** a brazier's fire, a circle: pops and snaps (a few loud, many small), a fine crackle, the flames' low breath */
export function fire(sr: number, secs = 9, seed = 1): [Float32Array, Float32Array] {
  const r = new Draw(seedOf(`fire:${seed}`)), [L, R] = circle(secs, sr), n = L.length;
  /** a pop: noise through a band, decaying, written round the circle */
  const pop = (t: number, f: number, q: number, a: number, tau: number, pan: number) => {
    const b = new Biquad('bp', f, q, sr), len = Math.round(tau * 6 * sr), k = Math.exp(-1 / (tau * sr)), at = Math.floor(t * sr), [gl, gr] = pan2(pan); let e = a;
    for (let i = 0; i < len; i++) { const v = b.step(r.bi()) * e; e *= k; const p = (at + i) % n; L[p] += v * gl; R[p] += v * gr; }
  };
  for (let t = 0; t < secs; t += -Math.log(1 - r.next() * 0.999) / 9) {
    const a = Math.min(1, 0.05 / (1 - r.next()) ** 0.8), snaps = r.next() < 0.2 ? 3 : 1;
    for (let s = 0; s < snaps; s++) pop(t + s * r.range(0.003, 0.012), r.range(1200, 5000), r.range(1, 2), a * (s ? 0.6 : 1), r.range(0.001, 0.004), r.bi() * 0.3);
  }
  for (let t = 0; t < secs; t += -Math.log(1 - r.next() * 0.999) / 60) pop(t, r.range(3000, 8000), 1.2, r.range(0.02, 0.06), 0.0012, r.bi() * 0.4);
  // the flames' breath: low noise, its level wandering, written round the circle
  const body = new Float32Array(n), b = new Biquad('lp', 320, 0.7, sr); let lvl = 0.5, goal = 0.5;
  for (let i = 0; i < n + 4800; i++) { if (i % 2400 === 0) goal = r.range(0.2, 1); lvl += (goal - lvl) * 0.0004; body[i % n] += b.step(r.bi()) * lvl * 0.5; }
  for (let i = 0; i < n; i++) { L[i] += body[i]; R[i] += body[i] * 0.9; }
  for (const c of [L, R]) run(c, 'hp', 60, 0.7, sr);
  level([L, R], -24, sr, secs);
  return [L, R];
}

// ---------------------------------------------------------------------------------------------------------------- the table

/** the sounds computed in the page, by id: one-shots (mono) and loops (stereo), and how many takes each has */
export const COMPUTED = {
  'step-stone': 4, 'step-earth': 4, bird: 3, cricket: 2, owl: 1, anvil: 3, clash: 4, stable: 3, creak: 3, thunder: 3, patter: 1, fire: 1,
} as const;
export type ComputedId = keyof typeof COMPUTED;
/** a computed sound's take, its channels */
export function compute(id: ComputedId, take: number, sr: number): Float32Array[] {
  switch (id) {
    case 'step-stone': return [step(sr, 'stone', take)];
    case 'step-earth': return [step(sr, 'earth', take)];
    case 'bird': return [bird(sr, take)];
    case 'cricket': return [cricket(sr, take)];
    case 'owl': return [owl(sr)];
    case 'anvil': return [anvil(sr, take)];
    case 'clash': return [clash(sr, take)];
    case 'stable': return [stable(sr, take)];
    case 'creak': return [creak(sr, take)];
    case 'thunder': return thunder(sr, take);
    case 'patter': return patter(sr);
    case 'fire': return fire(sr);
  }
}
