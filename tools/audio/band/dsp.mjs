// The band's signal tools (journal Passe SN5): filters, oscillators, resonators, dynamics and spaces, in plain JavaScript and without dependencies. The
// band's sound is computed here at development time, sample by sample, then baked (SA-8): nothing here runs in the game. Pure: the same seed, the same bytes.
import { fft } from '../measure.mjs';

export const SR = 48000;
export const TAU = 2 * Math.PI;
export const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);
export const db = (x) => 10 ** (x / 20);
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, k) => a + (b - a) * k;

/** a seeded draw (mulberry32): never Math.random, the render is reproducible to the byte */
export class Rand {
  constructor(seed) { this.s = seed >>> 0; }
  next() { let t = (this.s = (this.s + 0x6d2b79f5) | 0); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  bi() { return this.next() * 2 - 1; }
  range(a, b) { return a + (b - a) * this.next(); }
  pick(list) { return list[Math.floor(this.next() * list.length)]; }
}
/** a string's seed */
export function seedOf(text) { let h = 2166136261; for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619); return h >>> 0; }

// ------------------------------------------------------------------------------------------------- filters

/** the RBJ cookbook's biquads */
export function coef(type, f, q = 0.707, gain = 0, sr = SR) {
  const w = TAU * Math.min(f, sr * 0.49) / sr, c = Math.cos(w), s = Math.sin(w), a = s / (2 * q), A = 10 ** (gain / 40), rt = 2 * Math.sqrt(A) * a;
  const n = (b0, b1, b2, a0, a1, a2) => ({ b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 });
  if (type === 'lp') return n((1 - c) / 2, 1 - c, (1 - c) / 2, 1 + a, -2 * c, 1 - a);
  if (type === 'hp') return n((1 + c) / 2, -1 - c, (1 + c) / 2, 1 + a, -2 * c, 1 - a);
  if (type === 'bp') return n(a, 0, -a, 1 + a, -2 * c, 1 - a);
  if (type === 'peak') return n(1 + a * A, -2 * c, 1 - a * A, 1 + a / A, -2 * c, 1 - a / A);
  if (type === 'low') return n(A * (A + 1 - (A - 1) * c + rt), 2 * A * (A - 1 - (A + 1) * c), A * (A + 1 - (A - 1) * c - rt), A + 1 + (A - 1) * c + rt, -2 * (A - 1 + (A + 1) * c), A + 1 + (A - 1) * c - rt);
  if (type === 'high') return n(A * (A + 1 + (A - 1) * c + rt), -2 * A * (A - 1 + (A + 1) * c), A * (A + 1 + (A - 1) * c - rt), A + 1 - (A - 1) * c + rt, 2 * (A - 1 - (A + 1) * c), A + 1 - (A - 1) * c - rt);
  throw new Error(`filter ${type}`);
}
/** a biquad over a buffer, in place */
export function filter(x, k) {
  let z1 = 0, z2 = 0; const { b0, b1, b2, a1, a2 } = k;
  for (let i = 0; i < x.length; i++) { const v = x[i], o = b0 * v + z1; z1 = b1 * v - a1 * o + z2; z2 = b2 * v - a2 * o; x[i] = o; }
  return x;
}
/** an equaliser written as a list: [['hp', 120], ['peak', 900, 1.2, 3], ...] */
export function eq(x, list) { for (const [t, f, q, g] of list) filter(x, coef(t, f, q ?? 0.707, g ?? 0)); return x; }

/** a state-variable filter (Zavalishin's topology-preserving form): holds its tone while its cutoff moves */
export class Svf {
  constructor() { this.a = 0; this.b = 0; this.lp = 0; this.bp = 0; this.hp = 0; this.set(1000, 0.7); }
  set(f, q) { const g = Math.tan(Math.PI * Math.min(f, SR * 0.45) / SR), k = 1 / q; this.k = k; this.a1 = 1 / (1 + g * (g + k)); this.a2 = g * this.a1; this.a3 = g * this.a2; }
  step(x) { const v3 = x - this.b, v1 = this.a1 * this.a + this.a2 * v3, v2 = this.b + this.a2 * this.a + this.a3 * v3; this.a = 2 * v1 - this.a; this.b = 2 * v2 - this.b; this.lp = v2; this.bp = v1; this.hp = x - this.k * v1 - v2; return v2; }
}

// ------------------------------------------------------------------------------------------------- sources

/** band-limited steps (polyBLEP): a saw and a square that do not alias */
const blep = (t, dt) => { if (t < dt) { t /= dt; return t + t - t * t - 1; } if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; } return 0; };
export const sawAt = (ph, dt) => 2 * ph - 1 - blep(ph, dt);
export const squareAt = (ph, dt, pw = 0.5) => (ph < pw ? 1 : -1) + blep(ph, dt) - blep((ph + 1 - pw) % 1, dt);

/** decaying partials as complex resonators, added into `out`: { f, a, tau, ph? }; the cheapest road to a struck or plucked tone */
export function ring(out, list) {
  for (const p of list) {
    const w = TAU * p.f / SR; if (w >= Math.PI * 0.95 || p.a === 0) continue;
    const r = Math.exp(-1 / (p.tau * SR)), cr = r * Math.cos(w), ci = r * Math.sin(w), n = Math.min(out.length, Math.ceil(p.tau * SR * Math.log(Math.abs(p.a) * 1e5)));
    let re = p.a * Math.cos(p.ph ?? 0), im = p.a * Math.sin(p.ph ?? 0);
    for (let i = 0; i < n; i++) { out[i] += im; const t = re * cr - im * ci; im = re * ci + im * cr; re = t; }
  }
  return out;
}
/** a burst of noise through a band, added into `out` */
export function burst(out, r, { f, q = 1, a = 1, tau = 0.01, attack = 0.0005, at = 0, hp = 0 }) {
  const n = Math.min(out.length - at, Math.ceil(tau * SR * 12)), b = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR; b[i] = r.bi() * (1 - Math.exp(-t / attack)) * Math.exp(-t / tau); }
  filter(b, coef('bp', f, q)); if (hp) filter(b, coef('hp', hp));
  for (let i = 0; i < n; i++) out[at + i] += a * b[i];
  return out;
}
export const fadeIn = (x, secs) => { const n = Math.min(x.length, Math.round(secs * SR)); for (let i = 0; i < n; i++) x[i] *= 1 - Math.exp(-(i / SR) / (secs / 4)); return x; };

/** a played note's pitch carried by a playback-rate curve: a slide, a bend, a vibrato on a computed note */
export function resample(x, rate, length) {
  const y = new Float32Array(length); let p = 0;
  for (let i = 0; i < length; i++) { const k = p | 0; if (k + 1 >= x.length) break; const f = p - k; y[i] = x[k] + (x[k + 1] - x[k]) * f; p += rate(i / SR); }
  return y;
}

// ------------------------------------------------------------------------------------------------- dynamics, spaces, modulation

const softClip = (x) => Math.tanh(x);
export function drive(x, g, mix = 1) { const k = 1 / softClip(g); for (let i = 0; i < x.length; i++) x[i] = x[i] * (1 - mix) + mix * k * softClip(g * x[i]); return x; }

/** a compressor on a stereo pair, in place: threshold and ratio in dB terms, a soft knee; `trace`, when given, receives each sample's gain (the bake applies
 *  the mix's gain to each of its layers, journal Passe SN10) */
export function compress(L, R, { th = -18, ratio = 3, attack = 0.01, release = 0.12, makeup = 0, knee = 6, trace = null }) {
  const a = Math.exp(-1 / (attack * SR)), b = Math.exp(-1 / (release * SR)), m = db(makeup); let e = 0;
  for (let i = 0; i < L.length; i++) {
    const v = Math.max(Math.abs(L[i]), Math.abs(R[i])), lvl = 20 * Math.log10(v + 1e-9);
    const over = lvl - th, want = over <= -knee / 2 ? 0 : over >= knee / 2 ? over * (1 - 1 / ratio) : (1 - 1 / ratio) * (over + knee / 2) ** 2 / (2 * knee);
    e = want > e ? a * e + (1 - a) * want : b * e + (1 - b) * want;
    const g = db(-e) * m; L[i] *= g; R[i] *= g;
    if (trace) trace[i] = g;
  }
}
/** a look-ahead limiter: nothing passes `ceiling`; `trace` as the compressor's */
export function limit(L, R, ceiling = 0.84, look = 0.003, release = 0.08, trace = null) {
  const n = Math.round(look * SR), b = Math.exp(-1 / (release * SR)), need = new Float32Array(L.length);
  for (let i = 0; i < L.length; i++) { const v = Math.max(Math.abs(L[i]), Math.abs(R[i])); need[i] = v > ceiling ? ceiling / v : 1; }
  // the sliding minimum of what the next `n` samples need
  let env = 1, head = 0; const gain = new Float32Array(L.length), q = new Int32Array(L.length);
  for (let i = L.length - 1, tail = 0; i >= 0; i--) { while (tail > head && need[q[tail - 1]] >= need[i]) tail--; q[tail++] = i; if (q[head] > i + n) head++; gain[i] = need[q[head]]; }
  for (let i = 0; i < L.length; i++) { env = gain[i] < env ? gain[i] : b * env + (1 - b) * gain[i]; L[i] *= env; R[i] *= env; if (trace) trace[i] = env; }
}

/** one long FFT: a whole track through an impulse */
export function convolve(x, ir) {
  let n = 1; while (n < x.length + ir.length) n <<= 1;
  const a = new Float64Array(n), ai = new Float64Array(n), b = new Float64Array(n), bi = new Float64Array(n);
  a.set(x); b.set(ir); fft(a, ai); fft(b, bi);
  for (let i = 0; i < n; i++) { const r = a[i] * b[i] - ai[i] * bi[i]; ai[i] = a[i] * bi[i] + ai[i] * b[i]; a[i] = r; }
  fft(a, ai, true);
  return Float32Array.from(a.subarray(0, x.length + ir.length));
}
/** a computed room, one impulse per side: early reflections, then a tail that darkens as it decays; the two sides never the same */
export function room({ seed = 1, rt = 1.4, pre = 0.018, damp = 3200, bright = 0.5, early = 8, size = 0.04 }) {
  const r = new Rand(seed), len = Math.round((rt * 1.3 + pre) * SR), side = () => {
    const y = new Float32Array(len), start = Math.round(pre * SR), lo = new Float32Array(len), hi = new Float32Array(len);
    for (let i = start; i < len; i++) { const t = (i - start) / SR, s = r.bi() * Math.min(1, t / 0.012); lo[i] = s * Math.exp(-6.9 * t / rt); hi[i] = s * Math.exp(-6.9 * t / (rt * bright)); }
    filter(lo, coef('lp', damp, 0.5)); filter(hi, coef('hp', damp, 0.5));
    for (let i = 0; i < len; i++) y[i] = lo[i] + 0.7 * hi[i];
    for (let k = 0; k < early; k++) { const t = pre + size * (0.15 + r.next()), at = Math.round(t * SR); if (at < len) y[at] += (r.next() < 0.5 ? -1 : 1) * 0.5 * Math.exp(-t * 14); }
    let e = 0; for (let i = 0; i < len; i++) e += y[i] * y[i];
    const g = 1 / Math.sqrt(e); for (let i = 0; i < len; i++) y[i] *= g;
    return y;
  };
  return [side(), side()];
}

/** a delay line read at a moving place */
function delayed(x, secs, out, mix) {
  const n = x.length, buf = new Float32Array(1 << 16), mask = buf.length - 1;
  for (let i = 0; i < n; i++) { buf[i & mask] = x[i]; const d = secs(i / SR) * SR, p = i - d, k = Math.floor(p), f = p - k; const a = k < 0 ? 0 : buf[k & mask], b = k + 1 < 0 ? 0 : buf[(k + 1) & mask]; out[i] += mix * (a + (b - a) * f); }
}
/** the ensemble: two moving delays per side, the electric keys' and the strings' width */
export function chorus(L, R, { rate = 0.8, depth = 0.0024, delay = 0.011, mix = 0.5 }) {
  const a = Float32Array.from(L), b = Float32Array.from(R);
  delayed(a, (t) => delay + depth * Math.sin(TAU * rate * t), L, mix); delayed(b, (t) => delay + depth * Math.sin(TAU * rate * t + 1.9), R, mix);
  delayed(b, (t) => delay * 1.4 + depth * 0.8 * Math.sin(TAU * rate * 0.73 * t + 0.7), L, mix * 0.5); delayed(a, (t) => delay * 1.4 + depth * 0.8 * Math.sin(TAU * rate * 0.73 * t + 2.6), R, mix * 0.5);
}
/** the suitcase's stereo tremolo */
export function tremolo(L, R, rate, depth) {
  for (let i = 0; i < L.length; i++) { const s = Math.sin(TAU * rate * i / SR) * depth; L[i] *= 1 + s; R[i] *= 1 - s; }
}
/** a sweeping phaser: four all-passes, the electric piano's slow turn */
export function phaser(L, R, { rate = 0.22, lo = 280, hi = 1900, mix = 0.5, fb = 0.35 }) {
  for (const [x, off] of [[L, 0], [R, 1.3]]) {
    const z = new Float64Array(4); let last = 0;
    for (let i = 0; i < x.length; i++) {
      const f = lo * (hi / lo) ** (0.5 + 0.5 * Math.sin(TAU * rate * i / SR + off)), t = Math.tan(Math.PI * f / SR), a = (t - 1) / (t + 1);
      let v = x[i] + fb * last;
      for (let k = 0; k < 4; k++) { const o = a * v + z[k]; z[k] = v - a * o; v = o; }
      last = v; x[i] = x[i] * (1 - mix) + v * mix;
    }
  }
}
/** a delay that crosses the stereo field, each repeat darker */
export function pingPong(L, R, { time, feedback = 0.32, mix = 0.2, tone = 2600 }) {
  const n = L.length, d = Math.round(time * SR), a = new Float32Array(n), b = new Float32Array(n), k = coef('lp', tone); let z1 = 0, z2 = 0;
  for (let i = d; i < n; i++) { const v = (L[i - d] + R[i - d]) * 0.5 + feedback * b[i - d], o = k.b0 * v + z1; z1 = k.b1 * v - k.a1 * o + z2; z2 = k.b2 * v - k.a2 * o; a[i] = o; b[i] = feedback * a[i - d]; }
  for (let i = 0; i < n; i++) { L[i] += mix * a[i]; R[i] += mix * b[i]; }
}
