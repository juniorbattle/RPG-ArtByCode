// The duel's sounds (lot S3, journal Passe SN15): one sound for each of the arena's effect recipes (src/arena/fx/fxRecipes.ts: one per action), and the duel's
// reading that was silent (the opponent's sequence, the dodge window, the stun, the push), played by the band's own instruments (tools/audio/band/): its kit,
// its timpani, its brass, its organ, its vibraphone, its electric piano, its guitars, its bass, its wind synth and its flute. The pitched ones stand on the
// motif's notes, D, E, G, A, C, without a third: they sit in the fights' D by day and by night. Proposals for the operator's ear, not baked.
import { SR, Rand, seedOf, coef, filter, eq, room, convolve, resample, clamp } from '../../../tools/audio/band/dsp.mjs';
import { drum } from '../../../tools/audio/band/drums.mjs';
import { brass, vibes, marimba, organ, rhodes, rockGuitar, bass, ewi, flute } from '../../../tools/audio/band/instruments.mjs';
import { loudness } from '../../../tools/audio/measure.mjs';

const D2 = 38, A2 = 45, D3 = 50, E3 = 52, A3 = 57, D4 = 62, E4 = 64, G4 = 67, A4 = 69, D5 = 74, E5 = 76, G5 = 79, A5 = 81, D6 = 86, A6 = 93, D7 = 98;

/** a cue being written: a stereo buffer, a send to a small room, its own draws */
export class Cue {
  constructor(secs, seed) { const n = Math.round(secs * SR); this.n = n; this.L = new Float32Array(n); this.R = new Float32Array(n); this.sL = new Float32Array(n); this.sR = new Float32Array(n); this.r = new Rand(seed); }
  /** a mono sound at `t`: panned, cut after `dur` with a release, read at another rate (its pitch with it) */
  put(x, t, { g = 1, pan = 0, send = 0.12, rate = 1, dur, rel = 0.05 } = {}) {
    const buf = rate === 1 ? x : resample(x, () => rate, Math.floor(x.length / rate)), a = Math.round(t * SR), th = (clamp(pan, -1, 1) + 1) * Math.PI / 4, gl = g * Math.cos(th), gr = g * Math.sin(th);
    const hold = dur === undefined ? Infinity : Math.round(dur * SR), k = Math.exp(-1 / (rel * SR)); let e = 1;
    for (let i = 0; i < buf.length; i++) { const p = a + i; if (p >= this.n) break; if (i > hold) { e *= k; if (e < 1e-4) break; } if (p < 0) continue; const v = buf[i] * e; this.L[p] += v * gl; this.R[p] += v * gr; this.sL[p] += v * gl * send; this.sR[p] += v * gr * send; }
    return this;
  }
  /** a held note (organ, any sustained voice) shaped by an attack and a release */
  held(x, t, dur, { attack = 0.02, release = 0.25, ...o } = {}) {
    const n = Math.min(x.length, Math.round((dur + release * 4) * SR)), y = new Float32Array(n), hold = Math.round(dur * SR), k = Math.exp(-1 / (release * SR)); let e = 1;
    for (let i = 0; i < n; i++) { if (i > hold) e *= k; y[i] = x[i] * e * (1 - Math.exp(-(i / SR) / (attack / 3))); }
    return this.put(y, t, o);
  }
  /** a breath of noise whose band glides (a blade through the air, a whoosh) */
  whoosh(t, { secs = 0.2, f0 = 3000, f1 = 900, q = 1.2, g = 0.5, pan = 0, attack = 0.04 } = {}) {
    const n = Math.round(secs * SR), y = new Float32Array(n);
    let lp = 0, bp = 0;
    for (let i = 0; i < n; i++) {
      const u = i / n, f = f0 * (f1 / f0) ** u, w = 2 * Math.sin(Math.PI * Math.min(f, SR * 0.2) / SR), env = (1 - Math.exp(-(i / SR) / attack)) * Math.sin(Math.PI * Math.min(1, u * 1.15)) ** 1.5;
      const x = this.r.bi(); lp += w * bp; const hp = x - lp - bp / q; bp += w * hp; y[i] = bp * env;
    }
    return this.put(y, t, { g, pan, send: 0.2 });
  }
  /** metal ringing: a blade's clang */
  clang(t, { f = 2300, g = 0.3, tau = 0.15, pan = 0 } = {}) {
    const y = new Float32Array(Math.round(tau * 6 * SR)), parts = [[1, 1], [1.47, 0.7], [2.23, 0.5], [2.91, 0.35], [3.83, 0.2]];
    for (const [k, a] of parts) { const w = 2 * Math.PI * f * k * (1 + this.r.bi() * 0.004) / SR, d = Math.exp(-1 / (tau * SR / k ** 0.5)); let re = a, im = 0; const c = Math.cos(w), s = Math.sin(w); let amp = 1; for (let i = 0; i < y.length; i++) { y[i] += im * amp; const nr = re * c - im * s; im = re * s + im * c; re = nr; amp *= d; } }
    return this.put(y, t, { g: g / 2, pan, send: 0.25 });
  }
  /** a crackle: short bright bursts at random (a bolt, a shattering) */
  crackle(t, { secs = 0.2, count = 8, f = 7000, g = 0.25 } = {}) {
    for (let k = 0; k < count; k++) { const y = new Float32Array(Math.round(0.02 * SR)), tau = 0.002 + this.r.next() * 0.004; for (let i = 0; i < y.length; i++) y[i] = this.r.bi() * Math.exp(-(i / SR) / tau); filter(y, coef('bp', f * (0.7 + 0.6 * this.r.next()), 1.4)); this.put(y, t + this.r.next() * secs, { g: g * (0.5 + this.r.next()), pan: this.r.bi() * 0.6, send: 0.3 }); }
    return this;
  }
  /** low noise under a hit: the ground's weight */
  rumble(t, { secs = 0.6, f = 120, g = 0.4 } = {}) {
    const n = Math.round(secs * SR), y = new Float32Array(n); for (let i = 0; i < n; i++) y[i] = this.r.bi() * Math.exp(-(i / SR) / (secs / 4)); filter(y, coef('lp', f, 0.8)); filter(y, coef('lp', f, 0.8));
    return this.put(y, t, { g, send: 0.1 });
  }
  /** the wind synthesiser or the flute playing a few notes ([midi, start, length]) */
  wind(kind, notes, t, { g = 0.4, pan = 0, porta = 0.035, send = 0.2, breath } = {}) {
    const total = Math.round((Math.max(...notes.map(([, a, d]) => a + d)) + 0.4) * SR), list = notes.map(([midi, a, d, vel = 0.85]) => ({ midi, t: a, dur: d, vel }));
    const x = kind === 'flute' ? flute(list, total, { seed: seedOf(String(notes)), porta, ...(breath ? { breath } : {}) }) : ewi(list, total, { seed: seedOf(String(notes)), porta, scoop: 0.3 });
    return this.put(x, t, { g, pan, send });
  }
  /** the room, a tone, the end trimmed, the level set on the loudest 400 ms */
  finish({ rt = 0.45, tone = [], target = -18, family } = {}) {
    const [a, b] = room({ seed: 11, rt, pre: 0.008, damp: 5200, bright: 0.6, early: 6, size: 0.03 }), wl = convolve(this.sL, a), wr = convolve(this.sR, b);
    for (let i = 0; i < this.n; i++) { this.L[i] += wl[i]; this.R[i] += wr[i]; }
    const base = TONE[family] ?? [['hp', 30]]; eq(this.L, [...base, ...tone]); eq(this.R, [...base, ...tone]);
    let peak = 0; for (let i = 0; i < this.n; i++) peak = Math.max(peak, Math.abs(this.L[i]), Math.abs(this.R[i]));
    let end = this.n; const floor = peak * 10 ** (-66 / 20); while (end > 1 && Math.abs(this.L[end - 1]) < floor && Math.abs(this.R[end - 1]) < floor) end--;
    end = Math.min(this.n, end + Math.round(0.01 * SR));
    const L = this.L.slice(0, end), R = this.R.slice(0, end), fade = Math.min(end, Math.round(0.02 * SR)); for (let i = 0; i < fade; i++) { const k = i / fade; L[end - 1 - i] *= k; R[end - 1 - i] *= k; }
    const m = loudness([L, R], SR).momentary, g = 10 ** ((target - m) / 20); for (let i = 0; i < end; i++) { L[i] *= g; R[i] *= g; }
    return { L, R };
  }
}

const k = (v) => v; // a velocity, written where it is read
/** each family's tone: the frequent blows the leanest under 200 Hz, the big moments keep a little more weight (the audit, journal Passe SN1: 93 % to 99 % of the blows' energy under 200 Hz) */
const TONE = {
  blow: [['hp', 90], ['low', 160, 0.7, -6], ['peak', 2600, 0.8, 3]],
  read: [['hp', 90], ['low', 160, 0.7, -5], ['peak', 2400, 0.8, 2]],
  charge: [['hp', 120]],
  ren: [['hp', 60], ['low', 140, 0.7, -4], ['peak', 2500, 0.8, 2.5]],
  rival: [['hp', 60], ['low', 140, 0.7, -4], ['peak', 2500, 0.8, 2.5]],
  ward: [['hp', 70], ['low', 150, 0.7, -4], ['peak', 2200, 0.8, 2]],
  boost: [['hp', 70], ['low', 150, 0.7, -4], ['peak', 2200, 0.8, 2]],
  ko: [['hp', 40], ['low', 120, 0.7, -2]],
};
export const kit = (c, kind, t, v, o = {}) => c.put(drum(kind, v, o.take ?? 0), t, o);

/** each recipe's sound: [family, length (s), takes, writer]; a take is the same gesture with the kit's other draws and the hand's small differences */
export const CUES = {
  // ---- the plain blows, each side its colour: Ren the steel (rim, snare, a blade's chink), the rivals the skins (toms, cajón, a slap)
  light: ['blow', 0.5, 3, (c, take) => { kit(c, 'rim', 0, k(0.75), { take, g: 0.8 }); kit(c, 'snare', 0.003, 0.5, { take, g: 0.55 }); kit(c, 'hat', 0, 0.6, { take, g: 0.3, pan: 0.2 }); c.clang(0.002, { f: 2900 + 200 * take, g: 0.18, tau: 0.05 }); return { target: -21 }; }],
  heavy: ['blow', 0.9, 1, (c) => { kit(c, 'snare', 0.002, 1, { g: 1 }); kit(c, 'kick', 0, 1, { g: 0.9 }); kit(c, 'crash', 0.004, 0.8, { g: 0.5, dur: 0.32, rel: 0.08 }); c.put(rockGuitar([D3, A3, D4], 0.18, 0.9, true), 0.004, { g: 0.45 }); c.clang(0.004, { f: 2400, g: 0.25, tau: 0.08 }); return { target: -17 }; }],
  m_slash: ['blow', 0.5, 3, (c, take) => { kit(c, 'tomH', 0, 0.7, { take, g: 0.7, pan: 0.1 }); kit(c, 'slap', 0.002, 0.8, { take, g: 0.75 }); kit(c, 'cajon', 0, 0.5, { take, g: 0.35 }); c.whoosh(0, { secs: 0.09, f0: 2600, f1: 1100, g: 0.25 }); return { target: -21 }; }],
  m_heavy: ['blow', 1, 1, (c) => { kit(c, 'kick', 0, 1); kit(c, 'tomL', 0.003, 1, { g: 0.9 }); c.put(brass(D2, 0.22, 0.9, { fall: 3 }), 0.01, { g: 0.5 }); c.put(brass(D3, 0.22, 0.9, { fall: 3 }), 0.01, { g: 0.35 }); kit(c, 'crash', 0.006, 0.7, { g: 0.35, dur: 0.3, rel: 0.1 }); return { target: -17 }; }],
  // ---- a blow stopped: steel on steel, a bell's ring; a blow missed: the air
  guard: ['blow', 0.7, 3, (c, take) => { kit(c, 'bell', 0, 0.6, { take, g: 0.45, dur: 0.22, rel: 0.1 }); kit(c, 'rim', 0, 0.8, { take, g: 0.5 }); c.clang(0, { f: 2200 + 150 * take, g: 0.35, tau: 0.16 }); return { target: -20 }; }],
  guardHeavy: ['blow', 1, 1, (c) => { kit(c, 'bell', 0, 1, { g: 0.6, dur: 0.3, rel: 0.12 }); kit(c, 'snare', 0, 0.8, { g: 0.6 }); kit(c, 'crash', 0.003, 0.6, { g: 0.35, dur: 0.28, rel: 0.1 }); c.clang(0, { f: 1900, g: 0.5, tau: 0.22 }); return { target: -18 }; }],
  whiff: ['blow', 0.45, 2, (c, take) => { kit(c, 'sweep', 0, 0.8, { take, g: 0.8 }); c.whoosh(0, { secs: 0.2, f0: 3400, f1: 800, g: 0.6 }); kit(c, 'brush', 0.05, 0.4, { take, g: 0.25 }); return { target: -24 }; }],
  // ---- a gauge breaks: the whole kit, the timpani, the brass, and glass
  break: ['blow', 1.8, 1, (c) => { kit(c, 'crash', 0, 1, { g: 0.8 }); kit(c, 'timp', 0, 1, { g: 0.9 }); kit(c, 'kick', 0, 1); for (const m of [D3, A3, D4, A4]) c.put(brass(m, 0.3, 1), 0.006, { g: 0.22 }); [A6, 96, D7, 100].forEach((m, i) => c.put(vibes(m, 0.9), 0.03 + i * 0.025, { g: 0.12, pan: (i - 1.5) * 0.3, dur: 0.25, rel: 0.15 })); c.crackle(0.02, { secs: 0.18, count: 10, f: 7500, g: 0.2 }); return { target: -15 }; }],
  // ---- the K.O.: everything on one stroke, then the same stroke slowed under the slow motion (0.65 s at a third of the speed), the ground's weight under it
  ko: ['ko', 2.8, 1, (c) => {
    kit(c, 'kick', 0, 1); kit(c, 'timp', 0, 1); kit(c, 'timp', 0.022, 0.9, { g: 0.7, take: 1 }); kit(c, 'crash', 0, 1); kit(c, 'snare', 0.002, 1);
    for (const m of [D2, D3, A3]) c.put(brass(m, 0.35, 1, { fall: 4 }), 0.008, { g: 0.32 });
    const head = Math.round(0.7 * SR), slow = (x) => { const y = resample(x.slice(0, head), () => 0.45, Math.floor(head / 0.45)); for (let i = 0; i < y.length; i++) y[i] *= Math.exp(-(i / SR) / 0.55); filter(y, coef('lp', 2600, 0.7)); return y; };
    const sl = slow(c.L), sr = slow(c.R), at = Math.round(0.11 * SR);
    for (let i = 0; i < sl.length && at + i < c.n; i++) { c.L[at + i] += 0.55 * sl[i]; c.R[at + i] += 0.55 * sr[i]; c.sL[at + i] += 0.2 * sl[i]; c.sR[at + i] += 0.2 * sr[i]; }
    c.rumble(0, { secs: 1.6, f: 70, g: 0.9 });
    return { target: -13, rt: 0.8 };
  }],
  // ---- Ren's skills
  t1: ['ren', 1.1, 1, (c) => { c.wind('ewi', [[D5, 0, 0.1, 0.95], [A6, 0.1, 0.09, 0.9]], 0, { g: 0.32, porta: 0.07 }); kit(c, 'crash', 0.03, 0.9, { g: 0.5, dur: 0.45, rel: 0.12 }); kit(c, 'snare', 0.03, 0.9, { g: 0.7 }); c.crackle(0.03, { secs: 0.25, count: 12, f: 6500, g: 0.3 }); return { target: -16 }; }],
  t2: ['ren', 1, 1, (c) => { c.wind('flute', [[A5, 0, 0.06, 0.9], [D6, 0.06, 0.22, 0.95]], 0, { g: 0.45, porta: 0.04, breath: 0.22 }); c.whoosh(0, { secs: 0.18, f0: 1500, f1: 5200, g: 0.4 }); kit(c, 'rim', 0.02, 1, { g: 0.7 }); kit(c, 'bell', 0.03, 0.7, { g: 0.3, dur: 0.3, rel: 0.15 }); return { target: -17 }; }],
  t3: ['ren', 1.3, 1, (c) => { [[0, -0.45], [0.07, 0.45], [0.14, 0]].forEach(([t, pan], i) => { kit(c, 'sweep', t, 0.9, { take: i, g: 0.7, pan }); c.whoosh(t, { secs: 0.14, f0: 3800, f1: 1200, g: 0.35, pan }); }); c.wind('ewi', [[D6, 0, 0.06], [A5, 0.06, 0.06], [D5, 0.12, 0.16]], 0, { g: 0.22, porta: 0.03 }); kit(c, 'snare', 0.14, 0.9, { g: 0.6 }); kit(c, 'ride', 0.14, 0.6, { g: 0.3, dur: 0.4, rel: 0.2 }); return { target: -16 }; }],
  t4: ['ren', 1.8, 1, (c) => { for (const m of [A3, D4, A4, D5, E5]) c.put(brass(m, 0.42, 1), 0.006, { g: 0.2, pan: (m - D4) / 40 }); kit(c, 'timp', 0, 1, { g: 0.9 }); kit(c, 'kick', 0, 1); kit(c, 'crash', 0.004, 1, { g: 0.7 }); kit(c, 'snare', 0.008, 1, { g: 0.7 }); c.rumble(0, { secs: 0.8, f: 90, g: 0.5 }); return { target: -14, rt: 0.6 }; }],
  k_sunder: ['ren', 1.4, 1, (c) => { kit(c, 'kick', 0, 1); kit(c, 'tomL', 0, 1); kit(c, 'tomL', 0.09, 0.9, { take: 1, g: 0.8 }); kit(c, 'timp', 0.01, 1, { g: 0.8 }); c.put(bass(D2, 1, 'finger'), 0.01, { g: 0.6, rate: 1, dur: 0.5, rel: 0.2 }); c.put(resample(bass(D2, 1, 'finger'), (t) => 1 - 0.35 * Math.min(1, t / 0.45), Math.round(0.6 * SR)), 0.05, { g: 0.4 }); c.rumble(0, { secs: 1, f: 110, g: 0.7 }); kit(c, 'crash', 0.02, 0.7, { g: 0.35, dur: 0.4, rel: 0.15 }); return { target: -15 }; }],
  k_feint: ['ren', 0.6, 1, (c) => { kit(c, 'brush', 0, 0.8, { g: 0.6, pan: -0.3 }); kit(c, 'brush', 0.07, 0.8, { take: 1, g: 0.6, pan: 0.3 }); kit(c, 'rim', 0.08, 0.7, { g: 0.5 }); c.whoosh(0, { secs: 0.12, f0: 2600, f1: 1300, g: 0.25, pan: -0.3 }); c.whoosh(0.07, { secs: 0.12, f0: 2600, f1: 1300, g: 0.25, pan: 0.3 }); return { target: -20 }; }],
  // ---- the rivals' skills
  m_ironfall: ['rival', 1.6, 1, (c) => { c.put(brass(D2, 0.4, 1, { fall: 5 }), 0, { g: 0.6 }); c.put(brass(A2, 0.4, 1, { fall: 5 }), 0, { g: 0.45 }); kit(c, 'timp', 0, 1); kit(c, 'kick', 0, 1); kit(c, 'crash', 0.004, 1, { g: 0.6 }); kit(c, 'tomL', 0.02, 1, { g: 0.7 }); c.rumble(0, { secs: 0.9, f: 100, g: 0.6 }); return { target: -14 }; }],
  m_lunge: ['rival', 1, 1, (c) => { c.put(vibes(A6, 0.9), 0, { g: 0.35, pan: 0.2 }); c.put(vibes(D7, 0.9), 0.03, { g: 0.3, pan: -0.2 }); kit(c, 'rim', 0, 0.8, { g: 0.6 }); kit(c, 'hat', 0, 0.8, { g: 0.4 }); c.whoosh(0, { secs: 0.16, f0: 2000, f1: 6000, g: 0.3 }); c.crackle(0.02, { secs: 0.1, count: 5, f: 9000, g: 0.15 }); return { target: -18 }; }],
  m_shoulder: ['rival', 0.8, 1, (c) => { kit(c, 'kick', 0, 1, { g: 1 }); kit(c, 'cajon', 0, 1, { g: 0.8 }); kit(c, 'tomL', 0.004, 0.8, { g: 0.6 }); c.rumble(0, { secs: 0.4, f: 160, g: 0.6 }); return { target: -17 }; }],
  m_riposte: ['rival', 0.9, 1, (c) => { c.put(brass(A4, 0.12, 0.9), 0, { g: 0.4 }); c.put(brass(D5, 0.12, 0.9), 0, { g: 0.25 }); kit(c, 'bell', 0, 0.8, { g: 0.35, dur: 0.25, rel: 0.12 }); kit(c, 'rim', 0, 0.8, { g: 0.5 }); c.clang(0, { f: 2500, g: 0.25, tau: 0.1 }); return { target: -18 }; }],
  m_smite: ['rival', 1.5, 1, (c) => { for (const m of [D4, A4, D5]) c.held(organ(m, 1), 0, 0.45, { attack: 0.01, release: 0.35, g: 0.18 }); kit(c, 'bell', 0, 1, { g: 0.45, dur: 0.5, rel: 0.25 }); kit(c, 'timp', 0, 0.8, { g: 0.7 }); kit(c, 'crash', 0.004, 0.6, { g: 0.3, dur: 0.4, rel: 0.2 }); return { target: -15, rt: 0.7 }; }],
  m_wild: ['rival', 0.8, 1, (c) => { kit(c, 'tomM', 0, 1, { g: 0.8, pan: 0.2 }); kit(c, 'slap', 0, 0.8, { g: 0.5 }); kit(c, 'tomL', 0.1, 1, { g: 0.85, pan: -0.2 }); kit(c, 'kick', 0.1, 0.9, { g: 0.8 }); return { target: -17 }; }],
  m_cleave: ['rival', 1.4, 1, (c) => { kit(c, 'tomL', 0, 1); kit(c, 'timp', 0, 1); kit(c, 'kick', 0, 1); kit(c, 'crash', 0.004, 0.9, { g: 0.5 }); c.put(resample(bass(A2, 1, 'finger'), (t) => 1 - 0.3 * Math.min(1, t / 0.4), Math.round(0.6 * SR)), 0.02, { g: 0.5 }); c.rumble(0, { secs: 0.9, f: 110, g: 0.6 }); return { target: -15 }; }],
  // ---- the charge: a note of the vibraphone for each tier reached, climbing the motif's fifths; held, a breath; released, a whip
  charge1: ['charge', 0.6, 1, (c) => { c.put(vibes(A4, 0.7), 0, { g: 0.5, dur: 0.3, rel: 0.12 }); c.put(rhodes(A4, 0.5), 0, { g: 0.25, dur: 0.3, rel: 0.12 }); return { target: -24 }; }],
  charge2: ['charge', 0.6, 1, (c) => { c.put(vibes(D5, 0.75), 0, { g: 0.5, dur: 0.3, rel: 0.12 }); c.put(rhodes(D5, 0.55), 0, { g: 0.25, dur: 0.3, rel: 0.12 }); return { target: -23 }; }],
  charge3: ['charge', 0.8, 1, (c) => { c.put(vibes(A5, 0.8), 0, { g: 0.45, dur: 0.4, rel: 0.15 }); c.put(vibes(D6, 0.7), 0.02, { g: 0.3, dur: 0.4, rel: 0.15 }); c.put(rhodes(A5, 0.6), 0, { g: 0.25, dur: 0.4, rel: 0.15 }); return { target: -22 }; }],
  hold1: ['charge', 0.4, 1, (c) => { kit(c, 'tamb', 0, 0.25, { g: 0.3 }); c.put(vibes(A4, 0.25), 0, { g: 0.12, dur: 0.15, rel: 0.1 }); return { target: -34 }; }],
  hold2: ['charge', 0.4, 1, (c) => { kit(c, 'tamb', 0, 0.25, { g: 0.3, take: 1 }); c.put(vibes(D5, 0.25), 0, { g: 0.12, dur: 0.15, rel: 0.1 }); return { target: -33 }; }],
  hold3: ['charge', 0.4, 1, (c) => { kit(c, 'tamb', 0, 0.25, { g: 0.3, take: 2 }); c.put(vibes(A5, 0.25), 0, { g: 0.12, dur: 0.15, rel: 0.1 }); return { target: -32 }; }],
  release: ['charge', 0.35, 1, (c) => { c.whoosh(0, { secs: 0.09, f0: 1200, f1: 4500, g: 0.5, attack: 0.01 }); kit(c, 'rim', 0.06, 0.6, { g: 0.4 }); return { target: -23 }; }],
  denied: ['charge', 0.3, 1, (c) => { c.put(rockGuitar([D2], 0.06, 0.6, true), 0, { g: 0.6 }); kit(c, 'rim', 0, 0.3, { g: 0.25 }); return { target: -26 }; }],
  // ---- the duel's reading: the opponent starts his sequence, the window to dodge opens, Ren dodges, a fighter is stunned, Ren's action is pushed back
  threat: ['read', 0.8, 1, (c) => { kit(c, 'tomL', 0, 0.6, { g: 0.6, pan: 0.25 }); kit(c, 'tomL', 0.07, 0.5, { take: 1, g: 0.5, pan: 0.25 }); c.put(brass(D2, 0.32, 0.5, { soft: true }), 0, { g: 0.3, pan: 0.25 }); return { target: -24 }; }],
  window: ['read', 0.5, 1, (c) => { kit(c, 'bell', 0, 1, { g: 0.5, dur: 0.16, rel: 0.07 }); c.put(vibes(A6, 1), 0, { g: 0.35, dur: 0.14, rel: 0.07 }); return { target: -20 }; }],
  dodge: ['read', 0.4, 2, (c, take) => { kit(c, 'sweep', 0, 0.7, { take, g: 0.7, pan: -0.25 }); c.whoosh(0, { secs: 0.2, f0: 4200, f1: 1100, g: 0.5, pan: -0.25 }); return { target: -24 }; }],
  stun: ['read', 1.5, 1, (c) => { [D6, A5, E5].forEach((m, i) => { const x = vibes(m, 0.7), y = new Float32Array(x.length); for (let j = 0; j < x.length; j++) y[j] = x[j] * (0.75 + 0.25 * Math.sin(2 * Math.PI * 7 * j / SR)); c.put(y, i * 0.09, { g: 0.4, dur: 0.6, rel: 0.25, pan: 0.3 - i * 0.3 }); }); kit(c, 'timp', 0, 0.5, { g: 0.4 }); kit(c, 'tamb', 0.05, 0.4, { g: 0.25 }); return { target: -19 }; }],
  pushed: ['read', 0.5, 1, (c) => { kit(c, 'kick', 0, 0.5, { g: 0.6, pan: -0.25 }); c.whoosh(0.02, { secs: 0.25, f0: 900, f1: 500, q: 0.8, g: 0.5, pan: -0.25, attack: 0.01 }); c.put(bass(D2, 0.5, 'ghost'), 0, { g: 0.5 }); return { target: -24 }; }],
  // ---- wards: a shield that rings, each caster's colour
  d1: ['ward', 1.3, 1, (c) => { for (const m of [D4, A4, D5]) c.held(organ(m, 0.8), 0, 0.5, { attack: 0.08, release: 0.35, g: 0.16 }); kit(c, 'bell', 0.02, 0.7, { g: 0.35, dur: 0.6, rel: 0.25 }); return { target: -19, rt: 0.8 }; }],
  m_bulwark: ['ward', 1.2, 1, (c) => { c.put(brass(D3, 0.5, 0.6, { soft: true }), 0, { g: 0.35 }); c.put(brass(A3, 0.5, 0.6, { soft: true }), 0, { g: 0.3 }); kit(c, 'timp', 0, 0.6, { g: 0.6 }); return { target: -19 }; }],
  m_brace: ['ward', 1, 1, (c) => { kit(c, 'tomL', 0, 0.8, { g: 0.7 }); for (const m of [D3, A3]) c.held(organ(m, 0.7), 0.01, 0.3, { attack: 0.02, release: 0.25, g: 0.18 }); return { target: -20 }; }],
  m_aegis: ['ward', 1.3, 1, (c) => { for (const m of [A4, D5, A5]) c.held(organ(m, 0.8), 0, 0.5, { attack: 0.08, release: 0.35, g: 0.14 }); c.put(vibes(A6, 0.7), 0.03, { g: 0.25, dur: 0.6, rel: 0.25 }); return { target: -19, rt: 0.8 }; }],
  m_hide: ['ward', 1.2, 1, (c) => { [0, 0.06, 0.12, 0.18].forEach((t, i) => kit(c, 'tomL', t, 0.5 + 0.1 * i, { take: i, g: 0.5 })); for (const m of [A2, D3, A3]) c.held(organ(m, 0.6), 0.05, 0.4, { attack: 0.1, release: 0.3, g: 0.14 }); return { target: -20 }; }],
  k_iron: ['ward', 1.1, 1, (c) => { c.put(vibes(D5, 0.8), 0, { g: 0.4 }); c.put(vibes(A5, 0.8), 0.04, { g: 0.35 }); kit(c, 'ride', 0, 0.6, { g: 0.3, dur: 0.5, rel: 0.2 }); return { target: -20 }; }],
  k_parry: ['ward', 0.8, 1, (c) => { kit(c, 'rim', 0, 0.9, { g: 0.6 }); kit(c, 'bell', 0, 0.7, { g: 0.35, dur: 0.3, rel: 0.12 }); c.put(rockGuitar([D3, A3], 0.15, 0.8, true), 0.01, { g: 0.4 }); return { target: -20 }; }],
  // ---- boosts: a short rising call, each caster's colour
  s1: ['boost', 1, 1, (c) => { c.put(brass(A4, 0.1, 0.9), 0, { g: 0.4 }); c.put(brass(D5, 0.32, 1), 0.1, { g: 0.45 }); c.put(brass(A4, 0.32, 0.8), 0.1, { g: 0.25 }); return { target: -18 }; }],
  k_cry: ['boost', 0.9, 1, (c) => { c.put(rockGuitar([D3, A3, D4], 0.4, 0.9, false), 0, { g: 0.45 }); kit(c, 'snare', 0, 0.8, { g: 0.6 }); kit(c, 'kick', 0, 0.8, { g: 0.6 }); return { target: -18 }; }],
  k_focus: ['boost', 1, 1, (c) => { [D4, A4, D5, A5].forEach((m, i) => c.put(vibes(m, 0.7), i * 0.05, { g: 0.35, dur: 0.4, rel: 0.2, pan: (i - 1.5) * 0.2 })); return { target: -20 }; }],
  m_resolve: ['boost', 1, 1, (c) => { c.put(brass(D3, 0.1, 0.8), 0, { g: 0.4, pan: 0.2 }); c.put(brass(A3, 0.3, 0.9), 0.1, { g: 0.45, pan: 0.2 }); kit(c, 'timp', 0, 0.5, { g: 0.4 }); return { target: -19 }; }],
  m_tempo: ['boost', 0.8, 1, (c) => { [A5, D6, A5, D6].forEach((m, i) => c.put(marimba(m, 0.8, i), i * 0.06, { g: 0.45, pan: 0.2 })); return { target: -20 }; }],
  m_gild: ['boost', 1.1, 1, (c) => { c.put(brass(D5, 0.3, 0.9), 0, { g: 0.4, pan: 0.2 }); kit(c, 'bell', 0.01, 0.8, { g: 0.35, dur: 0.4, rel: 0.2 }); c.put(vibes(D6, 0.7), 0.02, { g: 0.25 }); return { target: -19 }; }],
  m_prayer: ['boost', 1.3, 1, (c) => { for (const m of [D4, A4]) c.held(organ(m, 0.7), 0, 0.5, { attack: 0.1, release: 0.35, g: 0.18 }); c.wind('flute', [[A5, 0.05, 0.4, 0.7]], 0, { g: 0.3, breath: 0.15 }); return { target: -20, rt: 0.8 }; }],
  m_grit: ['boost', 0.9, 1, (c) => { kit(c, 'kick', 0, 0.9); kit(c, 'tomL', 0.06, 0.8, { g: 0.6 }); c.put(brass(D2, 0.1, 0.8), 0, { g: 0.4 }); c.put(brass(A2, 0.25, 0.9), 0.1, { g: 0.4 }); return { target: -19 }; }],
  m_roar: ['boost', 1.1, 1, (c) => { c.put(brass(D2, 0.45, 1, { fall: 2 }), 0, { g: 0.5 }); c.put(brass(D3, 0.45, 1, { fall: 2 }), 0, { g: 0.35 }); kit(c, 'tomL', 0, 0.9, { g: 0.6 }); kit(c, 'tomL', 0.1, 0.8, { take: 1, g: 0.5 }); c.rumble(0, { secs: 0.6, f: 140, g: 0.4 }); return { target: -18 }; }],
};

/** a cue rendered: its takes, each a stereo pair at 48 kHz */
export function renderCue(id) {
  const [family, secs, takes, write] = CUES[id], out = [];
  for (let t = 0; t < takes; t++) { const c = new Cue(secs + 1.2, seedOf(`${id}:${t}`)), o = write(c, t) ?? {}; out.push(c.finish({ family, ...o })); }
  return { id, family, takes: out };
}
