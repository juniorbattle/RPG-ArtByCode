// The band's instruments (journal Passe SN5): each note computed once at development time, from a model of the instrument and not from an oscillator:
// FM for the electric piano, plucked and struck strings as banks of partials, wind voices played phrase by phrase (a phrase's legato, its breath and its
// vibrato do not exist note by note), sections and pads as ensembles of band-limited saws. Pure: the same key, the same bytes.
import { SR, TAU, hz, clamp, Rand, seedOf, coef, filter, eq, Svf, ring, burst, fadeIn, sawAt, squareAt, drive } from './dsp.mjs';

const memo = new Map();
const once = (key, make) => { let v = memo.get(key); if (!v) { v = make(new Rand(seedOf(key))); memo.set(key, v); } return v; };
/** velocities fall on five layers: the timbre moves with them, the level stays continuous at the mix */
const layer = (v) => clamp(Math.round(v * 4) / 4, 0.25, 1);
const blank = (secs) => new Float32Array(Math.round(secs * SR));

/** a string as its partials: the pluck's and the pickup's places cut harmonics out, the high partials die first, a stiff string is a little sharp */
function string({ f, p, q = 0, k, t0, fc, fp = 2, cap = 7000, B = 0, ph = 0, shape }) {
  const list = [];
  for (let n = 1; n * f < cap && n < 90; n++) {
    const fn = n * f * Math.sqrt(1 + B * n * n), s = Math.sin(n * Math.PI * p) * (q ? Math.sin(n * Math.PI * q) : 1), tau = t0 / (1 + (fn / fc) ** fp);
    const e = { f: fn, a: s / n ** k, tau: Math.max(0.012, tau), ph };
    list.push(shape ? shape(e, n) : e);
  }
  return list;
}

/** the electric piano: a tine, a tone bar and a pickup (two FM pairs at 1:1 and 1:14), harder hits bark on the pickup's asymmetry */
export function rhodes(midi, vel, take = 0) {
  const v = layer(vel);
  return once(`rhodes:${midi}:${v}:${take}`, (r) => {
    const f = hz(midi) * (1 + r.bi() * 0.0003), x = blank(clamp(5.5 * (220 / f) ** 0.45, 1.4, 6)), w = TAU * f / SR, mod = Math.min(14, 11000 / f), tb = clamp(2.4 * (261 / f) ** 0.5, 0.7, 4.2);
    const tt = 0.3 + 0.4 * (261 / f) ** 0.5, ib0 = 0.6 + 1.5 * v, at0 = 0.2 + 0.6 * v, it0 = 0.5 + 2.4 * v * v, bark = 0.05 + 0.22 * v;
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, body = Math.exp(-t / tb) * Math.sin(w * i + ib0 * (0.38 + 0.62 * Math.exp(-t / 0.3)) * Math.sin(w * i));
      const y = body + at0 * Math.exp(-t / tt) * Math.sin(w * i * 1.0006 + it0 * (0.14 + 0.86 * Math.exp(-t / 0.09)) * Math.sin(w * mod * i));
      x[i] = y + bark * y * y;
    }
    return filter(fadeIn(x, 0.0012), coef('hp', 30));
  });
}

/** the electric bass, five ways of playing it: fingers, the thumb's slap, the popped string, a muted ghost, the fretless's singing middle */
const BASS = {
  finger: { p: 0.22, q: 0.24, k: 1.1, t0: 2.2, fc: 900, cap: 4000 },
  thumb: { p: 0.14, q: 0.17, k: 1.12, t0: 1.5, fc: 1300, cap: 6000, click: [2300, 0.2, 0.005] },
  pop: { p: 0.09, q: 0.13, k: 0.92, t0: 1.1, fc: 2000, cap: 8000, click: [3400, 0.36, 0.0035], gain: 1.1 },
  ghost: { p: 0.16, q: 0.2, k: 1, t0: 0.05, fc: 1000, cap: 2400, click: [1400, 0.4, 0.008], gain: 0.8 },
  fretless: { p: 0.2, q: 0.22, k: 1, t0: 2.8, fc: 1100, cap: 4600 },
};
export function bass(midi, vel, kind = 'finger', take = 0) {
  const v = layer(vel), b = BASS[kind];
  return once(`bass:${kind}:${midi}:${v}:${take}`, (r) => {
    const f = hz(midi), x = blank(kind === 'ghost' ? 0.2 : kind === 'fretless' ? 6 : 3.2);
    ring(x, string({ f, ...b, B: 0.00012, fc: b.fc * (0.75 + 0.5 * v), shape: kind === 'fretless' ? (e, n) => (n > 3 && n < 9 ? { ...e, a: e.a * 1.7, tau: e.tau * 1.6 } : e) : (e, n) => (n === 1 ? { ...e, a: e.a * 2 } : n === 2 ? { ...e, a: e.a * 1.4 } : e) }));
    fadeIn(x, kind === 'finger' || kind === 'fretless' ? 0.003 : 0.0008);
    if (b.click) burst(x, r, { f: b.click[0], q: 0.8, a: b.click[1] * (0.6 + 0.6 * v), tau: b.click[2] });
    const g = (b.gain ?? 1) * 1.6; for (let i = 0; i < x.length; i++) x[i] *= g;
    return drive(x, 1.15 + v * 0.45, 0.7);
  });
}

/** the nylon string: a thumb near the sound hole, a body with three resonances, the nail's tick */
export function nylon(midi, vel, take = 0) {
  const v = layer(vel);
  return once(`nylon:${midi}:${v}:${take}`, (r) => {
    const f = hz(midi) * (1 + r.bi() * 0.0005), x = blank(clamp(3.4 * (110 / f) ** 0.5, 1.4, 4));
    ring(x, string({ f, p: 0.13 + 0.04 * r.next(), k: 1.02 + (1 - v) * 0.3, t0: clamp(3.2 * (110 / f) ** 0.6, 0.7, 3.5), fc: 2300 + 3000 * v, fp: 1.5, cap: 9000, B: 1.2e-5 }));
    burst(fadeIn(x, 0.0008), r, { f: 2600 + 2000 * v, q: 0.8, a: 0.1 + 0.18 * v, tau: 0.004 });
    return eq(x, [['hp', 70], ['peak', 105, 3, 4], ['peak', 205, 2.5, 2], ['peak', 430, 2, 1], ['peak', 2800, 1, 3], ['high', 6000, 0.7, -2]]);
  });
}
/** the bouzouki: double courses a few cents apart and a high octave string, played with a plectrum: the bright folk colour */
export function bouzouki(midi, vel, take = 0) {
  const v = layer(vel);
  return once(`bouzouki:${midi}:${v}:${take}`, (r) => {
    const x = blank(2.8), s = (f, a) => ring(x, string({ f, p: 0.09, k: 0.95, t0: clamp(2.6 * (147 / f) ** 0.5, 0.6, 2.8), fc: 2600 + 2400 * v, fp: 1.5, cap: 10000, B: 2.5e-5 }).map((e) => ({ ...e, a: e.a * a })));
    const f = hz(midi); s(f * 1.0016, 0.6); s(f * 0.9986, 0.6); if (midi < 69) s(f * 2.0011, 0.22);
    burst(fadeIn(x, 0.0006), r, { f: 3800, q: 0.7, a: 0.14 + 0.16 * v, tau: 0.003 });
    return eq(x, [['hp', 110], ['peak', 320, 2, 2.5], ['peak', 2600, 1.2, 2]]);
  });
}
/** the electric guitar, clean or choked (the funk's scratched sixteenths) */
export function eguitar(midi, vel, kind = 'clean', take = 0) {
  const v = layer(vel);
  return once(`eguitar:${kind}:${midi}:${v}:${take}`, (r) => {
    const f = hz(midi), mute = kind === 'mute', x = blank(mute ? 0.14 : 2.2);
    ring(x, string({ f: f * (1 + r.bi() * 0.0004), p: 0.11, q: 0.21, k: 0.9, t0: mute ? 0.035 : clamp(2.4 * (196 / f) ** 0.5, 0.5, 2.6), fc: 2200 + 2200 * v, fp: 1.7, cap: 7500, B: 3e-5 }));
    burst(fadeIn(x, 0.0006), r, { f: 2800, q: 0.9, a: mute ? 0.3 : 0.1, tau: mute ? 0.012 : 0.003 });
    return eq(x, [['hp', 160], ['peak', 2400, 1, 3]]);
  });
}
/** the rock guitar: the whole chord into one distortion, as an amplifier hears it, then its cabinet; palm-muted, a tight chug */
export function rockGuitar(midis, dur, vel, muted = false, take = 0) {
  const key = `rock:${midis.join('.')}:${dur.toFixed(3)}:${layer(vel)}:${muted}:${take}`;
  return once(key, (r) => {
    const x = blank(dur + 0.25);
    midis.forEach((m, i) => { const at = Math.round(i * 0.0026 * SR), part = blank(dur + 0.25); ring(part, string({ f: hz(m) * (1 + r.bi() * 0.0006), p: 0.1, q: 0.14, k: 0.85, t0: muted ? 0.09 : 1.6, fc: muted ? 900 : 2600, fp: 1.6, cap: 6500, B: 3e-5 })); for (let k = 0; k + at < x.length; k++) x[k + at] += part[k]; });
    filter(x, coef('hp', 110)); filter(x, coef('peak', 900, 0.8, 5)); drive(x, 9 + 9 * layer(vel), 1);
    eq(x, [['hp', 90], ['peak', 118, 1.4, 3.5], ['peak', 520, 1.2, -5], ['peak', 2300, 1, 5], ['lp', 5200, 0.8], ['lp', 7500, 0.7]]);
    const n = x.length; for (let i = 0; i < n; i++) x[i] *= clamp((n - i) / (0.05 * SR), 0, 1) * (1 - Math.exp(-(i / SR) / 0.0015));
    return x;
  });
}

/** the vibraphone: three bar modes, the mallet's touch; its motor's tremolo is a track's */
export function vibes(midi, vel, take = 0) {
  const v = layer(vel);
  return once(`vibes:${midi}:${v}:${take}`, (r) => {
    const f = hz(midi), t = clamp(3 * (440 / f) ** 0.4, 1.4, 4), x = blank(t * 1.4);
    ring(x, [{ f, a: 0.9, tau: t * 0.5 }, { f: f * 3.99, a: 0.14 + 0.3 * v, tau: t * 0.12 }, { f: f * 9.92, a: 0.03 + 0.09 * v, tau: t * 0.03 }]);
    return burst(fadeIn(x, 0.001), r, { f: 1800, q: 0.7, a: 0.06 + 0.1 * v, tau: 0.002 });
  });
}
/** the marimba: short warm bars, the folk side's quick notes */
export function marimba(midi, vel, take = 0) {
  const v = layer(vel);
  return once(`marimba:${midi}:${v}:${take}`, (r) => {
    const f = hz(midi), x = blank(0.9), t = clamp(0.5 * (440 / f) ** 0.5, 0.16, 0.8);
    ring(x, [{ f, a: 0.9, tau: t }, { f: f * 3.93, a: 0.1 + 0.26 * v, tau: t * 0.2 }, { f: f * 9.2, a: 0.02 + 0.06 * v, tau: t * 0.06 }]);
    return burst(fadeIn(x, 0.0012), r, { f: 1100, q: 0.7, a: 0.08 + 0.12 * v, tau: 0.003 });
  });
}

/** a Hammond's drawbars with their key click and the second harmonic's percussion; the Leslie is a track's */
export function organ(midi, vel) {
  const v = layer(vel);
  return once(`organ:${midi}:${v}`, (r) => {
    const f = hz(midi), x = blank(6), bars = [[0.5, 0.55], [1, 1], [1.5, 0.5], [2, 0.6], [3, 0.3], [4, 0.28], [6, 0.12], [8, 0.1]];
    const ph = bars.map(() => r.next() * TAU);
    for (let i = 0; i < x.length; i++) { let s = 0; for (let k = 0; k < bars.length; k++) { const fk = f * bars[k][0]; if (fk < 14000) s += bars[k][1] * Math.sin(TAU * fk * i / SR + ph[k]); } x[i] = s * 0.32; }
    ring(x, [{ f: f * 2, a: 0.2 + 0.2 * v, tau: 0.09 }, { f: f * 3, a: 0.12, tau: 0.06 }]);
    return burst(fadeIn(x, 0.002), r, { f: 3400, q: 0.5, a: 0.1 + 0.1 * v, tau: 0.002 });
  });
}

/** a section's voice: three saws a few cents apart, a filter that opens as the air arrives: bright when blown hard, a fall when asked */
export function brass(midi, dur, vel, { fall = 0, take = 0, soft = false } = {}) {
  const key = `brass:${midi}:${dur.toFixed(3)}:${layer(vel)}:${fall}:${take}:${soft}`;
  return once(key, (r) => {
    const v = layer(vel), rel = 0.09, x = blank(dur + rel + 0.02), f0 = hz(midi), det = [1 - 0.0031, 1, 1 + 0.0027], ph = det.map(() => r.next()), lp = new Svf(), lp2 = new Svf(), att = soft ? 0.05 : 0.014;
    let cut = 0;
    for (let i = 0; i < x.length; i++) {
      const t = i / SR, up = 1 - 2 ** (-t / 0.02), off = t - dur, fp = 1 - 0.018 * Math.exp(-t / 0.018) - (fall && off > -0.16 ? fall * 0.059 * ((off + 0.16) / 0.16) ** 2 : 0), env = (1 - Math.exp(-t / att)) * (off > 0 ? Math.exp(-off / (rel / 3)) : 1) * (0.86 + 0.14 * Math.exp(-t / 0.2));
      if (i % 16 === 0) { cut = f0 * (1.1 + (1.6 + 6.5 * v) * up * (0.72 + 0.28 * Math.exp(-t / 0.3)) * (soft ? 0.55 : 1)) * (off > 0 ? 0.7 : 1); lp.set(cut + 300, 0.85); lp2.set(cut * 1.8 + 500, 0.7); }
      let s = 0; for (let k = 0; k < 3; k++) { const f = f0 * det[k] * fp, dt = f / SR; ph[k] = (ph[k] + dt) % 1; s += sawAt(ph[k], dt); }
      x[i] = Math.tanh(1.3 * lp2.step(lp.step(s * 0.4))) * env;
    }
    return x;
  });
}

/** an ensemble of strings for pads, one pitch computed once for both sides: slow independent drifts between a dozen saws; the chord's envelope is a track's */
export function strings(midi) {
  return once(`strings:${midi}`, (r) => {
    const f0 = hz(midi), side = () => {
      const x = blank(12), det = [-14, -8, -3, 3, 8, 14].map((c) => 2 ** (c / 1200)), ph = det.map(() => r.next()), lfo = det.map(() => [r.range(0.13, 0.31), r.next() * TAU]);
      for (let i = 0; i < x.length; i++) { let s = 0; for (let k = 0; k < det.length; k++) { const f = f0 * det[k] * (1 + 0.0009 * Math.sin(TAU * lfo[k][0] * i / SR + lfo[k][1])), dt = f / SR; ph[k] = (ph[k] + dt) % 1; s += sawAt(ph[k], dt); } x[i] = s * 0.2; }
      return eq(x, [['hp', 180], ['lp', 1900 + f0 * 1.6, 0.6], ['peak', 880, 1.3, 3.5], ['peak', 2700, 1.4, 2.5], ['high', 5000, 0.7, -6]]);
    };
    return [side(), side()];
  });
}

// ------------------------------------------------------------------------------------------------- the wind voices, phrase by phrase

const smooth = (t) => (t >= 1 ? 1 : t * t * (3 - 2 * t));
/** a phrase's two gestures, a pitch and a breath for each sample: legato notes glide, detached ones scoop up from under the note, a repeated one is tongued, long ones warm into a vibrato */
export function gestures(notes, total, { porta = 0.035, scoop = 0.6, scoopT = 0.05, attack = 0.012, release = 0.07, vibRate = 5.4, vibDepth = 0.16, vibDelay = 0.22 } = {}, r = new Rand(1)) {
  const P = new Float32Array(total), B = new Float32Array(total); let last = null;
  notes.forEach((n, k) => {
    const next = notes[k + 1], tied = next && next.midi !== n.midi && next.t - (n.t + n.dur) < 0.03, legato = last && last.midi !== n.midi && n.t - last.end < 0.03, again = last && last.midi === n.midi && n.t - last.end < 0.12, a = Math.round(n.t * SR), b = Math.round((tied ? Math.max(n.t + n.dur, next.t) : n.t + n.dur) * SR), tail = tied ? 0 : Math.round(release * SR), ph = r.next() * TAU;
    for (let i = a; i < Math.min(b + tail, total); i++) {
      const t = (i - a) / SR, past = (i - b) / SR, left = (b - i) / SR, m = n.mods ?? {};
      let p = n.midi; if (legato) p = last.midi + (n.midi - last.midi) * smooth(t / porta); else p -= (again ? 0.08 : scoop) * Math.exp(-t / scoopT);
      if (m.bend) p -= m.bend * (1 - smooth(t / 0.14));
      if (m.fall && left < 0.16) p -= m.fall * ((0.16 - left) / 0.16) ** 2;
      p += vibDepth * (m.vib ?? 1) * clamp((t - vibDelay) / 0.28, 0, 1) * Math.sin(TAU * vibRate * t + ph);
      let e = legato ? 0.8 + 0.2 * smooth(t / 0.03) : 1 - Math.exp(-t / attack);
      e *= n.vel * (1 + 0.1 * clamp((t - 0.2) / 0.6, 0, 1) * Math.sin(TAU * vibRate * t + ph)) * (m.swell ? 0.55 + 0.6 * smooth(t / n.dur) : 1 - 0.1 * clamp(t / Math.max(n.dur, 0.3), 0, 1));
      if (past > 0) e *= Math.exp(-past / (release / 3));
      if (e >= B[i]) { P[i] = p; B[i] = e; }
    }
    last = { midi: n.midi, end: n.t + n.dur };
  });
  return { P, B };
}
/** the wind synthesiser of the Japanese fusion bands' leads: two saws and a square under a filter driven by the breath, a horn's formant, a touch of air */
export function ewi(notes, total, { dark = 0, seed = 1, ...o } = {}) {
  const r = new Rand(seed), { P, B } = gestures(notes, total, o, r), x = new Float32Array(total), lp = new Svf(), fm = new Svf(), air = new Svf(); let a = 0, b = 0, c = 0, last = 60;
  air.set(3100, 0.8);
  for (let i = 0; i < total; i++) {
    const e = B[i]; if (e < 1e-4) { x[i] = 0; continue; }
    if (P[i] > 0) last = P[i];
    const f = hz(last); if (i % 8 === 0) { lp.set(f * (1.3 + (6.5 - 3 * dark) * e * e) + 320, 0.9); fm.set(1400 - 300 * dark, 1.3); }
    const d1 = f / SR, d2 = f * 1.0041 / SR, d3 = f * 0.5 / SR; a = (a + d1) % 1; b = (b + d2) % 1; c = (c + d3) % 1;
    const s = lp.step(0.62 * sawAt(a, d1) + 0.38 * sawAt(b, d2) + 0.26 * squareAt(c, d3, 0.42)); fm.step(s);
    x[i] = Math.tanh(1.6 * (s + 0.55 * fm.bp)) * e + 0.02 * e * air.step(r.bi()) * (air.bp + 0.3);
  }
  return x;
}
/** the wooden flute: a handful of harmonics, a breath tuned to the note, the chiff of the attack, more vibrato in the air than in the pitch */
export function flute(notes, total, { seed = 1, breath = 0.1, ...o } = {}) {
  const r = new Rand(seed), { P, B } = gestures(notes, total, { porta: 0.05, scoop: 0.35, scoopT: 0.04, attack: 0.022, release: 0.11, vibRate: 5, vibDepth: 0.09, vibDelay: 0.3, ...o }, r), x = new Float32Array(total), bp = new Svf(), hi = new Svf(), H = [1, 0.34, 0.16, 0.07, 0.03, 0.015]; let ph = 0, last = 72;
  hi.set(5200, 0.6);
  for (let i = 0; i < total; i++) {
    const e = B[i]; if (e < 1e-4) continue;
    if (P[i] > 0) last = P[i];
    const f = hz(last), d = i ? Math.abs(B[i] - B[i - 1]) : 0; if (i % 8 === 0) bp.set(f, 5);
    ph = (ph + f / SR) % 1;
    const b = 0.32 + 0.9 * e; let s = 0, g = 1; for (let k = 0; k < 6; k++) { if (f * (k + 1) < 16000) s += H[k] * g * Math.sin(TAU * ph * (k + 1)); g *= b; }
    const n = r.bi(); bp.step(n); hi.step(n);
    x[i] = e * (s * 0.8 + breath * (2.6 * bp.bp + 0.5 * hi.bp)) + Math.min(1, d * 60) * 0.1 * hi.bp;
  }
  return x;
}
