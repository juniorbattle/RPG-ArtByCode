// The band's drums and hand percussion (journal Passe SN5): every hit computed, several takes of each so no hit repeats the one before, the velocity moves
// the tone as much as the level. A kit for the fusion, brushes for the night, a cajón, a frame drum, hands and a shaker for the morning. Pure.
import { SR, TAU, clamp, Rand, seedOf, coef, filter, ring, burst, fadeIn, drive } from './dsp.mjs';

const memo = new Map();
const blank = (secs) => new Float32Array(Math.round(secs * SR));
const sweep = (x, { f0, f1, tf, tau, a = 1, pre = 0 }) => { let ph = 0; for (let i = 0; i < x.length; i++) { const t = i / SR; ph += TAU * (f1 + (f0 - f1) * Math.exp(-t / tf)) / SR; x[i] += a * Math.exp(-t / tau) * Math.sin(ph + pre); } return x; };
/** a cymbal's partials: an inharmonic cloud, each with its own short life, darker when played softly */
const cloud = (x, r, { n, lo, hi, tau, a = 1, v = 1 }) => {
  const list = []; for (let i = 0; i < n; i++) { const k = r.next(), f = lo * (hi / lo) ** k; list.push({ f, a: (a / Math.sqrt(n)) * (0.4 + 0.6 * r.next()) * (1 - k * (1 - v) * 0.8), tau: tau * (0.5 + r.next()) * (1 - 0.5 * k), ph: r.next() * TAU }); }
  return ring(x, list);
};

const KIT = {
  kick(x, r, v) { sweep(x, { f0: 165, f1: 52, tf: 0.019, tau: 0.17, a: 1 }); burst(x, r, { f: 3200, q: 0.5, a: 0.22 + 0.34 * v, tau: 0.0028 }); burst(x, r, { f: 900, q: 0.8, a: 0.18, tau: 0.006 }); drive(x, 1.5 + 0.6 * v, 0.8); },
  snare(x, r, v) {
    ring(x, [{ f: 188, a: 0.9 * (0.5 + 0.5 * v), tau: 0.085, ph: 1 }, { f: 322, a: 0.6 * (0.4 + 0.6 * v), tau: 0.06, ph: 2 }, { f: 512, a: 0.26 * v, tau: 0.03 }]);
    burst(x, r, { f: 3300, q: 0.55, a: 0.26 + 0.6 * v, tau: 0.07 + 0.06 * v, attack: 0.0012, hp: 1100 }); burst(x, r, { f: 6200, q: 0.8, a: 0.14 + 0.3 * v, tau: 0.04 });
    burst(x, r, { f: 1500, q: 0.8, a: 0.26 * v, tau: 0.0035 });
  },
  rim(x, r, v) { ring(x, [{ f: 1720, a: 0.55, tau: 0.018 }, { f: 472, a: 0.4, tau: 0.03 }, { f: 2830, a: 0.2, tau: 0.01 }]); burst(x, r, { f: 3000, q: 0.7, a: 0.3 + 0.2 * v, tau: 0.003 }); },
  hat(x, r, v) { cloud(x, r, { n: 34, lo: 5200, hi: 15500, tau: 0.03 + 0.012 * v, a: 1.1, v }); burst(x, r, { f: 9500, q: 0.6, a: 0.3 + 0.3 * v, tau: 0.018, hp: 6000 }); filter(x, coef('hp', 4200)); },
  open(x, r, v) { cloud(x, r, { n: 46, lo: 4800, hi: 15500, tau: 0.32, a: 1, v }); burst(x, r, { f: 9000, q: 0.5, a: 0.3, tau: 0.17, hp: 5500 }); filter(x, coef('hp', 3800)); },
  ride(x, r, v) { cloud(x, r, { n: 70, lo: 2600, hi: 13000, tau: 1, a: 0.42, v }); ring(x, [{ f: 3340, a: 0.17, tau: 0.09 }, { f: 4910, a: 0.12, tau: 0.06 }]); burst(x, r, { f: 7000, q: 0.6, a: 0.2 + 0.16 * v, tau: 0.004 }); filter(x, coef('hp', 900)); },
  bell(x, r, v) { ring(x, [{ f: 1096, a: 0.42, tau: 0.8 }, { f: 1650, a: 0.3, tau: 0.6 }, { f: 2710, a: 0.22, tau: 0.45 }, { f: 3920, a: 0.12, tau: 0.3 }]); cloud(x, r, { n: 30, lo: 3000, hi: 12000, tau: 0.7, a: 0.24, v }); burst(x, r, { f: 6000, q: 0.6, a: 0.2, tau: 0.003 }); },
  crash(x, r, v) { cloud(x, r, { n: 150, lo: 1400, hi: 15500, tau: 1.25, a: 1.15, v }); burst(x, r, { f: 5200, q: 0.4, a: 0.8, tau: 0.42 }); filter(x, coef('hp', 420)); },
  tomH(x, r, v) { sweep(x, { f0: 300, f1: 196, tf: 0.03, tau: 0.25 }); ring(x, [{ f: 330, a: 0.2, tau: 0.08 }]); burst(x, r, { f: 2100, q: 0.7, a: 0.2 + 0.2 * v, tau: 0.004 }); },
  tomM(x, r, v) { sweep(x, { f0: 215, f1: 147, tf: 0.034, tau: 0.3 }); ring(x, [{ f: 248, a: 0.2, tau: 0.09 }]); burst(x, r, { f: 1700, q: 0.7, a: 0.2 + 0.2 * v, tau: 0.004 }); },
  tomL(x, r, v) { sweep(x, { f0: 150, f1: 98, tf: 0.04, tau: 0.36 }); ring(x, [{ f: 165, a: 0.2, tau: 0.1 }]); burst(x, r, { f: 1300, q: 0.7, a: 0.2 + 0.2 * v, tau: 0.004 }); },
  brush(x, r, v) { burst(x, r, { f: 2700, q: 0.45, a: 0.6 + 0.4 * v, tau: 0.075, attack: 0.002 }); ring(x, [{ f: 196, a: 0.12 * v, tau: 0.06 }]); },
  sweep(x, r, v) { burst(x, r, { f: 3900, q: 0.4, a: 0.42 * v, tau: 0.11, attack: 0.05, hp: 1800 }); },
  shaker(x, r, v) { burst(x, r, { f: 6600, q: 0.8, a: 0.5 + 0.5 * v, tau: 0.024, attack: 0.006, hp: 3200 }); },
  tamb(x, r, v) { cloud(x, r, { n: 30, lo: 6000, hi: 13000, tau: 0.06, a: 0.7, v }); burst(x, r, { f: 7500, q: 0.8, a: 0.2, tau: 0.01 }); filter(x, coef('hp', 3000)); },
  cajon(x, r, v) { sweep(x, { f0: 124, f1: 82, tf: 0.022, tau: 0.13 }); burst(x, r, { f: 520, q: 0.8, a: 0.34, tau: 0.012 }); },
  slap(x, r, v) { ring(x, [{ f: 246, a: 0.3, tau: 0.04 }, { f: 412, a: 0.2, tau: 0.03 }]); burst(x, r, { f: 3000, q: 0.5, a: 0.42 + 0.5 * v, tau: 0.05, attack: 0.0009, hp: 1200 }); },
  frame(x, r, v) { sweep(x, { f0: 176, f1: 128, tf: 0.03, tau: 0.22, a: 0.9 }); burst(x, r, { f: 760, q: 0.7, a: 0.22 + 0.2 * v, tau: 0.01 }); },
  conga(x, r, v) { sweep(x, { f0: 352, f1: 322, tf: 0.02, tau: 0.16, a: 0.8 }); ring(x, [{ f: 540, a: 0.2, tau: 0.05 }]); burst(x, r, { f: 1700, q: 0.8, a: 0.2 + 0.2 * v, tau: 0.004 }); },
  bongo(x, r, v) { sweep(x, { f0: 492, f1: 448, tf: 0.015, tau: 0.1, a: 0.7 }); ring(x, [{ f: 760, a: 0.2, tau: 0.03 }]); burst(x, r, { f: 2500, q: 0.8, a: 0.2 + 0.2 * v, tau: 0.003 }); },
  timp(x, r, v) { sweep(x, { f0: 76, f1: 73.4, tf: 0.05, tau: 0.75, a: 1 }); ring(x, [{ f: 110, a: 0.42, tau: 0.5 }, { f: 145, a: 0.3, tau: 0.38 }, { f: 179, a: 0.14, tau: 0.3 }]); burst(x, r, { f: 900, q: 0.6, a: 0.2 + 0.2 * v, tau: 0.009 }); },
};
const LENGTH = { kick: 0.5, snare: 0.45, rim: 0.2, hat: 0.2, open: 1, ride: 3, bell: 2.4, crash: 4, tomH: 0.9, tomM: 1, tomL: 1.2, brush: 0.45, sweep: 0.5, shaker: 0.2, tamb: 0.4, cajon: 0.6, slap: 0.4, frame: 0.9, conga: 0.7, bongo: 0.5, timp: 3 };
export const DRUMS = Object.keys(KIT);

/** a hit: the kit's piece, a velocity from 0 to 1 and a take; each take its own draw */
export function drum(kind, vel, take = 0) {
  const v = clamp(Math.round(vel * 4) / 4, 0.25, 1), key = `${kind}:${v}:${take % 4}`; let x = memo.get(key);
  if (!x) { x = blank(LENGTH[kind]); KIT[kind](x, new Rand(seedOf(key)), v); fadeIn(x, 0.0003); const n = x.length, tail = Math.round(0.02 * SR); for (let i = 0; i < tail; i++) x[n - 1 - i] *= i / tail; memo.set(key, x); }
  return x;
}
