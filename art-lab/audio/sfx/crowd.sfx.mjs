// The arena's crowd written in code (lot S3, journal Passe SN15; SA-11 « Code + CC0 enregistré »: the code first): a crowd is many voices, each a glottal
// source through its vowel's formants, with its own pitch, breath and timing, and many hands. A murmur that loops in place of the arena's rumble (the « bruit de
// vague » of the operator's note), and its reactions: an « oh » when a heavy blow lands, a gasp at a break, a cheer when Ren lands a skill, the roar and the
// applause of the K.O. Proposals for the operator's ear, not baked.
import { SR, Rand, seedOf, coef, filter, Svf, room, convolve, clamp } from '../../../tools/audio/band/dsp.mjs';
import { loudness } from '../../../tools/audio/measure.mjs';

/** the vowels' first three formants (Hz, an adult man's; a woman's a sixth higher) */
const VOWEL = { a: [730, 1090, 2440], o: [570, 840, 2410], u: [300, 870, 2240], e: [530, 1840, 2480], i: [390, 1990, 2550], ae: [660, 1720, 2410] };

/** one voice into L/R: `f0(t)` its pitch, `vowel(t)` its formants, `env(t)` its breath; placed in the field, farther ones darker */
function voice(L, R, at, secs, r, { f0, vowel, env, pan = 0, g = 1, breath = 0.18, far = 0 }) {
  const n = Math.min(Math.round(secs * SR), L.length - at), f1 = new Svf(), f2 = new Svf(), f3 = new Svf(), dark = new Svf(), th = (clamp(pan, -1, 1) + 1) * Math.PI / 4, gl = g * Math.cos(th), gr = g * Math.sin(th);
  dark.set(5200 - 3600 * far, 0.6);
  let ph = r.next(), jit = 0, F = [500, 1500, 2500];
  for (let i = 0; i < n; i++) {
    const t = i / SR, e = typeof env === 'function' ? env(t) : env[i]; if (!(e >= 1e-4)) continue;
    if (i % 32 === 0) { F = vowel(t); f1.set(F[0], F[0] / 90); f2.set(F[1], F[1] / 110); f3.set(F[2], F[2] / 160); jit = 1 + r.bi() * 0.012; }
    const f = f0(t) * jit; ph += f / SR; if (ph >= 1) ph -= 1;
    // a glottal pulse: a sawtooth's fall, softened; and the breath that rides it
    const src = (1 - 2 * ph) * 0.6 + breath * r.bi() * (0.6 + 0.4 * Math.cos(2 * Math.PI * ph));
    f1.step(src); f2.step(src); f3.step(src);
    const y = dark.step(f1.bp + 0.55 * f2.bp + 0.25 * f3.bp) * e;
    L[at + i] += y * gl; R[at + i] += y * gr;
  }
}

/** a clap: two or three quick bursts of noise through the hands' band */
function clap(L, R, at, r, { g = 1, pan = 0, far = 0 } = {}) {
  const n = Math.round(0.05 * SR), y = new Float32Array(n), f = 900 + 1300 * r.next(), parts = 2 + (r.next() < 0.5 ? 1 : 0);
  for (let p = 0; p < parts; p++) { const a = Math.round((p * 0.004 + r.next() * 0.003) * SR), tau = 0.003 + 0.004 * r.next(); for (let i = a; i < n; i++) y[i] += r.bi() * Math.exp(-((i - a) / SR) / tau); }
  filter(y, coef('bp', f, 1.1)); if (far) filter(y, coef('lp', 4000 - 2500 * far, 0.7));
  const th = (clamp(pan, -1, 1) + 1) * Math.PI / 4;
  for (let i = 0; i < n && at + i < L.length; i++) { L[at + i] += y[i] * g * Math.cos(th); R[at + i] += y[i] * g * Math.sin(th); }
}

const smooth = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const lerp3 = (a, b, k) => [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * k);
/** a member of the crowd: a man or a woman, a pitch, a distance */
const person = (r) => { const woman = r.next() < 0.45; return { woman, f: (woman ? 205 : 118) * 2 ** (r.bi() * 0.25), far: r.next(), pan: r.bi() * 0.9, sc: woman ? 1.17 : 1 }; };
const formants = (v, p) => VOWEL[v].map((x) => x * p.sc);

/** a reaction of `count` voices: each a shout on its vowels, its pitch's contour, a little early or late */
function shout(L, R, at, r, count, { vowels, rise = 2, fall = -5, attack = 0.12, hold = 0.25, decay = 1, spread = 0.18, g = 1, breath = 0.2, high = 1 }) {
  for (let k = 0; k < count; k++) {
    const p = person(r), a = at + Math.round(r.next() * spread * SR), v1 = r.pick(vowels), v2 = r.pick(vowels), A = attack * (0.7 + 0.6 * r.next()), H = hold * (0.6 + 0.8 * r.next()), Dc = decay * (0.7 + 0.6 * r.next());
    const len = A + H + Dc * 3, F1 = formants(v1, p), F2 = formants(v2, p), base = p.f * high;
    voice(L, R, a, len, r, {
      f0: (t) => base * 2 ** ((t < A + H ? rise * smooth(t / (A + H)) : rise + fall * smooth((t - A - H) / (Dc * 2))) / 12),
      vowel: (t) => lerp3(F1, F2, smooth(t / len)),
      env: (t) => (t < A ? smooth(t / A) : t < A + H ? 1 : Math.exp(-(t - A - H) / Dc)) * (1 - 0.6 * p.far),
      pan: p.pan, far: p.far, g: g / Math.sqrt(count) * (0.6 + 0.8 * r.next()), breath,
    });
  }
}
/** applause: `hands` people clapping 3 to 6 times a second, for `secs`, swelling and fading */
function applause(L, R, at, r, hands, secs, { g = 1, swell = 0.3 } = {}) {
  for (let k = 0; k < hands; k++) {
    const rate = 3.2 + 2.8 * r.next(), p = { pan: r.bi() * 0.95, far: r.next() }, stop = secs * (0.6 + 0.4 * r.next());
    for (let t = r.next() * 0.25; t < stop; t += (1 / rate) * (0.9 + 0.2 * r.next())) { const e = smooth(t / swell) * (t > stop - 0.6 ? Math.max(0, (stop - t) / 0.6) : 1); clap(L, R, at + Math.round(t * SR), r, { g: g * e * (0.5 + 0.5 * r.next()) * (1 - 0.6 * p.far) / Math.sqrt(hands), pan: p.pan, far: p.far }); }
  }
}

/** the arena's air: a big room, a long tail */
function arena(L, R, { rt = 1.8, wet = 0.45 } = {}) {
  const [a, b] = room({ seed: 23, rt, pre: 0.03, damp: 2600, bright: 0.45, early: 10, size: 0.09 }), wl = convolve(L, a), wr = convolve(R, b);
  for (let i = 0; i < L.length; i++) { L[i] = L[i] * (1 - wet) + wl[i] * wet; R[i] = R[i] * (1 - wet) + wr[i] * wet; }
}
function level(L, R, target, by = 'momentary') {
  const m = loudness([L, R], SR)[by === 'lufs' ? 'lufs' : 'momentary'], g = 10 ** ((target - m) / 20); for (let i = 0; i < L.length; i++) { L[i] *= g; R[i] *= g; }
  return { L, R };
}

/** the crowd's sounds: [kind, writer]; `bed` loops, the others play once */
export const CROWD = {
  // the murmur: sixty people talking among themselves, syllable by syllable, a few hands now and then; a circle of 16 s
  bed: ['loop', (r) => {
    const secs = 16, pad = 3, n = Math.round((secs + pad) * SR), L = new Float32Array(n), R = new Float32Array(n), vows = ['a', 'o', 'e', 'i', 'ae', 'u'];
    for (let k = 0; k < 60; k++) {
      const p = person(r), syl = [];
      for (let t = r.next() * 2; t < secs + pad - 0.5;) { const words = 2 + Math.floor(r.next() * 6); for (let w = 0; w < words; w++) { const d = 0.09 + r.next() * 0.16; syl.push([t, d, r.pick(vows)]); t += d + 0.02 + r.next() * 0.05; } t += 0.4 + r.next() * 2.2; }
      // the syllables' breath written once, sample by sample; the vowel of the syllable under way
      const env = new Float32Array(n), vAt = new Float32Array(Math.ceil(n / 32)), vlist = syl.map(([, , x]) => formants(x, p));
      syl.forEach(([a, d], j) => { const i0 = Math.max(0, Math.round((a - 0.03) * SR)), i1 = Math.min(n, Math.round((a + d + 0.05) * SR)); for (let i = i0; i < i1; i++) env[i] = Math.max(env[i], Math.sin(Math.PI * clamp((i / SR - a + 0.03) / (d + 0.08), 0, 1)) * 0.8 * (1 - 0.7 * p.far)); for (let b = Math.floor(i0 / 32); b < vAt.length && b * 32 < i1 + 0.4 * SR; b++) vAt[b] = j; });
      const vowelAt = (t) => vlist[vAt[Math.floor(t * SR / 32)] | 0] ?? formants('a', p);
      voice(L, R, 0, secs + pad, r, { f0: (t) => p.f * (1 + 0.06 * Math.sin(2 * Math.PI * (0.7 + 0.5 * p.far) * t + k)), vowel: vowelAt, env, pan: p.pan, far: 0.4 + 0.6 * p.far, g: 0.5 / Math.sqrt(60), breath: 0.25 });
    }
    for (let i = 0; i < 6; i++) { const t = r.next() * secs; applause(L, R, Math.round(t * SR), r, 3, 0.8, { g: 0.12, swell: 0.1 }); }
    arena(L, R, { rt: 2.2, wet: 0.6 }); filter(L, coef('hp', 120)); filter(R, coef('hp', 120)); filter(L, coef('lp', 3800, 0.6)); filter(R, coef('lp', 3800, 0.6));
    // a circle: the last `pad` seconds land on the start, the file is 16 s
    const m = Math.round(secs * SR), cL = L.slice(0, m), cR = R.slice(0, m); for (let i = m; i < n; i++) { cL[i - m] += L[i]; cR[i - m] += R[i]; }
    return level(cL, cR, -26, 'lufs');
  }],
  // a heavy blow lands: an « oh » that rises and falls
  oh: ['once', (r) => { const n = Math.round(3.2 * SR), L = new Float32Array(n), R = new Float32Array(n); shout(L, R, 0, r, 70, { vowels: ['o', 'u'], rise: 3, fall: -6, attack: 0.16, hold: 0.25, decay: 0.55, spread: 0.12 }); arena(L, R); return level(L, R, -18); }],
  // a guard breaks: a gasp, the breath in, then an « ah »
  gasp: ['once', (r) => {
    const n = Math.round(2.6 * SR), L = new Float32Array(n), R = new Float32Array(n);
    for (let k = 0; k < 40; k++) { const p = person(r), a = Math.round(r.next() * 0.06 * SR); voice(L, R, a, 0.3, r, { f0: () => p.f, vowel: () => formants('ae', p), env: (t) => smooth(t / 0.12) * Math.exp(-Math.max(0, t - 0.12) / 0.05), pan: p.pan, far: p.far, g: 0.6 / Math.sqrt(40), breath: 2.5 }); }
    shout(L, R, Math.round(0.16 * SR), r, 50, { vowels: ['a', 'ae'], rise: 1, fall: -4, attack: 0.06, hold: 0.12, decay: 0.45, spread: 0.08, high: 1.12 });
    arena(L, R); return level(L, R, -18);
  }],
  // Ren lands a skill: a cheer, « hé ! », and hands
  cheer: ['once', (r) => { const n = Math.round(3.4 * SR), L = new Float32Array(n), R = new Float32Array(n); shout(L, R, 0, r, 70, { vowels: ['e', 'ae', 'a'], rise: 4, fall: -3, attack: 0.07, hold: 0.35, decay: 0.6, spread: 0.15, high: 1.25 }); applause(L, R, Math.round(0.1 * SR), r, 30, 2.2, { g: 0.7 }); arena(L, R); return level(L, R, -17); }],
  // the K.O.: the whole arena on its feet, a long roar, a storm of hands
  roar: ['once', (r) => { const n = Math.round(6.5 * SR), L = new Float32Array(n), R = new Float32Array(n); shout(L, R, 0, r, 110, { vowels: ['a', 'o', 'e', 'ae'], rise: 4, fall: -5, attack: 0.25, hold: 1.4, decay: 1.1, spread: 0.4, high: 1.15, breath: 0.3 }); applause(L, R, Math.round(0.3 * SR), r, 60, 5, { g: 0.9, swell: 0.6 }); arena(L, R, { rt: 2.2, wet: 0.5 }); return level(L, R, -15); }],
};

export function renderCrowd(id) { const [kind, write] = CROWD[id], { L, R } = write(new Rand(seedOf(`crowd:${id}`))); return { id, kind, L, R }; }
