// The places' sounds that only the band and the crowd's voices can play (lot S2, journal Passe SN18), written here and baked: the interface (a click, a dialog
// opening, the purse's coins: the marimba, the vibraphone, the electric piano on the motif's notes, without a third, as the duel's sounds) and the murmur of the
// town and the lists (the crowd's voices of lot S3, fewer and nearer than the arena's, in a street's air). Everything else of the places is computed in the page
// (src/audio/places.ts: the rain, the fire, the thunder, the birds...). Proposals for the operator's ear, not baked.
import { SR, Rand, seedOf, coef, filter, room, convolve, clamp } from '../../../tools/audio/band/dsp.mjs';
import { marimba, vibes, rhodes } from '../../../tools/audio/band/instruments.mjs';
import { Cue } from './duel.sfx.mjs';
import { voice, person, formants, level } from './crowd.sfx.mjs';

const D4 = 62, D5 = 74, A5 = 81, E6 = 88;

/** a sound: [family, seconds, takes, writer] as the duel's (art-lab/audio/sfx/duel.sfx.mjs); the writer returns the finish's options */
export const PLACE_CUES = {
  // a button pressed: one short bar of the marimba, the same note each time, a take's own touch
  'ui-click': ['interface', 0.3, 3, (c, take) => { c.put(marimba(A5, 0.45 + 0.05 * take, take), 0, { g: 0.6, dur: 0.07, rel: 0.04, send: 0.06 }); return { target: -24, rt: 0.3 }; }],
  // a dialog appears: two bars of the vibraphone a fifth apart, the electric piano under them
  'ui-open': ['interface', 0.6, 1, (c) => { c.put(vibes(D5, 0.5), 0, { g: 0.45, dur: 0.2, rel: 0.07 }); c.put(vibes(A5, 0.45), 0.055, { g: 0.4, dur: 0.18, rel: 0.07 }); c.put(rhodes(D4, 0.3), 0, { g: 0.18, dur: 0.18, rel: 0.07 }); return { target: -23, rt: 0.35 }; }],
  // the purse: two or three coins against each other, a glint of the vibraphone
  'ui-coin': ['interface', 0.7, 2, (c, take) => {
    c.clang(0, { f: 4100, g: 0.5, tau: 0.05, pan: -0.1 }); c.clang(0.07, { f: 5300, g: 0.4, tau: 0.045, pan: 0.1 });
    if (take) c.clang(0.13, { f: 4700, g: 0.3, tau: 0.04 });
    c.put(vibes(E6, 0.4), 0.02, { g: 0.22, dur: 0.14, rel: 0.06 });
    return { target: -23, rt: 0.3 };
  }],
};

/** the murmur of the town and the lists: sixteen people talking, syllable by syllable, nearer than the arena's sixty, in a street's air; a circle of 12 s */
export function murmur() {
  const r = new Rand(seedOf('place:murmur')), secs = 12, pad = 2.5, n = Math.round((secs + pad) * SR), L = new Float32Array(n), R = new Float32Array(n), vows = ['a', 'o', 'e', 'i', 'ae', 'u'];
  const people = 16;
  for (let k = 0; k < people; k++) {
    const p = person(r), syl = [];
    for (let t = r.next() * 2.5; t < secs + pad - 0.5;) { const words = 2 + Math.floor(r.next() * 6); for (let w = 0; w < words; w++) { const d = 0.09 + r.next() * 0.16; syl.push([t, d, r.pick(vows)]); t += d + 0.02 + r.next() * 0.05; } t += 0.6 + r.next() * 2.6; }
    const env = new Float32Array(n), vAt = new Float32Array(Math.ceil(n / 32)), vlist = syl.map(([, , x]) => formants(x, p)), far = 0.15 + 0.7 * p.far;
    syl.forEach(([a, d], j) => { const i0 = Math.max(0, Math.round((a - 0.03) * SR)), i1 = Math.min(n, Math.round((a + d + 0.05) * SR)); for (let i = i0; i < i1; i++) env[i] = Math.max(env[i], Math.sin(Math.PI * clamp((i / SR - a + 0.03) / (d + 0.08), 0, 1)) * 0.8 * (1 - 0.6 * far)); for (let b = Math.floor(i0 / 32); b < vAt.length && b * 32 < i1 + 0.4 * SR; b++) vAt[b] = j; });
    const vowelAt = (t) => vlist[vAt[Math.floor(t * SR / 32)] | 0] ?? formants('a', p);
    voice(L, R, 0, secs + pad, r, { f0: (t) => p.f * (1 + 0.07 * Math.sin(2 * Math.PI * (0.6 + 0.5 * p.far) * t + k)), vowel: vowelAt, env, pan: p.pan, far, g: 0.6 / Math.sqrt(people), breath: 0.22 });
  }
  // a street's air: stone walls near, a short tail
  const [a, b] = room({ seed: 31, rt: 1.1, pre: 0.012, damp: 3400, bright: 0.5, early: 8, size: 0.05 }), wl = convolve(L, a), wr = convolve(R, b), wet = 0.35;
  for (let i = 0; i < n; i++) { L[i] = L[i] * (1 - wet) + wl[i] * wet; R[i] = R[i] * (1 - wet) + wr[i] * wet; }
  for (const c of [L, R]) { filter(c, coef('hp', 130)); filter(c, coef('lp', 4500, 0.6)); }
  const m = Math.round(secs * SR), cL = L.slice(0, m), cR = R.slice(0, m); for (let i = m; i < n; i++) { cL[i - m] += L[i]; cR[i - m] += R[i]; }
  return level(cL, cR, -26, 'lufs');
}

/** a place's cue rendered: its takes, each a stereo pair at 48 kHz */
export function renderPlace(id) {
  if (id === 'murmur') { const { L, R } = murmur(); return { id, family: 'lieux', kind: 'loop', takes: [{ L, R }] }; }
  const [family, secs, takes, write] = PLACE_CUES[id], out = [];
  for (let t = 0; t < takes; t++) { const c = new Cue(secs + 1.2, seedOf(`${id}:${t}`)), o = write(c, t) ?? {}; out.push(c.finish({ family, ...o })); }
  return { id, family, kind: 'once', takes: out };
}
export const PLACE_IDS = [...Object.keys(PLACE_CUES), 'murmur'];
