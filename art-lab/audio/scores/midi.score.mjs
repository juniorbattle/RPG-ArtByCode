// « Le Tournoi », midday (journal Passe SN5): the tournament's launch, in the manner of the Japanese fusion bands behind Breath of Fire III: straight sixteenths
// with a breath of swing, slap bass, electric piano, a scratching guitar, a wind synth on the tune, brass answering it. D mixolydian, the third F sharp held
// back until the fanfare lands; the last chorus a tone up. An original score, no work reproduced.
import { Session } from '../../../tools/audio/band/session.mjs';
import { rhodes, bass, eguitar, brass, strings, ewi } from '../../../tools/audio/band/instruments.mjs';
import { chorus, phaser, pingPong, compress, drive } from '../../../tools/audio/band/dsp.mjs';
import { fusionHead } from './theme.mjs';

const fall = (dur, o = {}) => (m, v, take) => brass(m, dur, v, { take, ...o });
const up = (sym, n) => (n ? sym.replace(/^[A-G][#b]?/, (r) => TONE[r]).replace(/\/([A-G][#b]?)$/, (_, b) => `/${TONE[b]}`) : sym);
const TONE = { C: 'D', D: 'E', E: 'F#', F: 'G', 'F#': 'G#', G: 'A', A: 'B', Bb: 'C', B: 'C#', Eb: 'F', Ab: 'Bb', Db: 'Eb' };

const A = ['D13sus', 'Am11', 'Gmaj9', 'C13sus'], A2 = ['D13sus', 'Am11', 'Gmaj9', 'C9'], B = ['Fmaj9', 'Cmaj9/E', 'Ebmaj9#11', 'A7sus'];
const GROOVE = {
  a: { hat: 'XoxoXoxoXoxoXoxo', kick: 'X..x..x....x.x..', snare: '....X..g.g..X..g' },
  a2: { hat: 'XoxoXoxoXoxoXo.o', open: '..............x.', kick: 'X..x..x....x.x..', snare: '....X..g.g..X.g.' },
  b: { hat: 'XoxoXoxoXoxoXo.o', open: '..............x.', kick: 'X.....x...x.....', snare: '....X..g.g..X.g.' },
  tag: { bell: 'X.x.X.x.X.x.X.x.', kick: 'X..X..X.X..X.X..', snare: '....X.......X..g' },
  solo: { ride: 'x.ox.ox.x.ox.ox.', kick: 'X.....x...x..x..', snare: '....x..g..g.x..g', hat: '..x...x...x...x.' },
  fill: { hat: 'XoxoXoxo........', kick: 'X.....x.........', snare: '....X..gX.gX.gXg', tomH: '........x..x....', tomM: '.............x..', tomL: '..............xx' },
  fill2: { kick: 'X.....x.......x.', snare: 'X..gX..gXgXgX.X.', tomH: '..x.....x.......', tomL: '......x....x....', crash: '................' },
};
const SLAP = ['1..xp.1.5..1p7.x', '1..xp.1x.1.1pb5.', '1.x1p.1x5.1xp.75', '1x1xp.1xp.1xb.p5'];

/** the tracks that carry the tune: the band's voicings make room for them */
export const tunes = ['lead'];

export default function score(o = {}) {
  const s = new Session({ id: 'midi', seed: 106, bpm: 106, swing: 0.535, bars: 42, tail: 4, ...o });
  const kit = s.track('kit', { lay: 0.001, jitter: 0.0035, room: 0.1, gain: 0.8, fx: (L, R) => compress(L, R, { th: -14, ratio: 3, attack: 0.004, release: 0.09, makeup: 2 }), eq: [['hp', 30], ['peak', 3800, 0.9, 1.5]] });
  const low = s.track('bass', { lay: 0.003, jitter: 0.003, gain: 0.5, room: 0.02, eq: [['hp', 34], ['low', 130, 0.7, 4], ['peak', 300, 1, -3], ['high', 1500, 0.7, -4]], fx: (L, R) => compress(L, R, { th: -12, ratio: 5, attack: 0.002, release: 0.06, makeup: 3 }) });
  const keys = s.track('rhodes', { pan: -0.12, gain: 0.32, plate: 0.13, room: 0.08, jitter: 0.004, eq: [['hp', 150], ['peak', 2200, 1, 1.5]], fx: (L, R) => { phaser(L, R, { rate: 0.31, mix: 0.45 }); chorus(L, R, { rate: 0.7, mix: 0.42 }); } });
  const gtr = s.track('guitar', { pan: 0.56, gain: 0.26, room: 0.14, jitter: 0.003, lay: -0.002, eq: [['hp', 240], ['peak', 1900, 1, 2]], takes: 3 });
  const lead = s.track('lead', { pan: 0.02, gain: 0.27, plate: 0.2, hall: 0.05, lay: 0.004, eq: [['hp', 220], ['peak', 1100, 0.8, -2.5], ['peak', 3000, 1, 2.5]], fx: (L, R) => { chorus(L, R, { rate: 0.5, depth: 0.0012, mix: 0.16 }); pingPong(L, R, { time: s.span(3), feedback: 0.3, mix: 0.16 }); } });
  lead.voice = (notes, total) => ewi(notes, total, { seed: 7, porta: 0.03, vibDepth: 0.2 });
  const fourth = s.track('fourths', { pan: -0.34, gain: 0.2, plate: 0.16, lay: 0.006, eq: [['hp', 240]] });
  fourth.voice = (notes, total) => ewi(notes, total, { seed: 9, dark: 0.5 });
  const horns = s.track('brass', { gain: 0.25, plate: 0.24, room: 0.1, jitter: 0.005, pan: 0.05, eq: [['hp', 170], ['peak', 3000, 1, 1]], fx: (L, R) => chorus(L, R, { rate: 0.9, depth: 0.0016, mix: 0.22 }) });
  const pad = s.track('strings', { gain: 0.2, hall: 0.2, eq: [['hp', 260]] });

  const phraseA = (bar, n, o = 5) => {
    s.phrase(lead, bar, 0, fusionHead(o), { vel: 0.8, transpose: n });
    s.phrase(lead, bar + 2, 0, `D${o}:10^~`, { vel: 0.8, transpose: n });
  };
  const chorusA = (bar, n, { second = false } = {}) => {
    const ch = (second ? A2 : A).map((c) => up(c, n)), t = n ? 2 : 0;
    phraseA(bar, t);
    if (second) { s.phrase(fourth, bar, 0, fusionHead(4), { vel: 0.62, transpose: t + 7 }); s.phrase(lead, bar + 2, 10, 'G5:2 A5:2 B5:2', { vel: 0.78, transpose: t }); s.phrase(lead, bar + 3, 0, 'C6:6 D6:2 E6:8^~', { vel: 0.84, transpose: t }); }
    else { for (const [st, v] of [[6, 0.74], [8, 0.8], [11, 0.92]]) s.chord(horns, fall(s.span(st === 11 ? 4 : 1.4), { fall: st === 11 ? 1 : 0 }), bar + 3, st, ch[3], 1.4, { vel: v, n: 4, lo: 60, hi: 81 }); }
    ch.forEach((c, i) => { const next = i === 3 ? up('Fmaj9', n) : ch[i + 1], b = bar + i; s.chord(keys, rhodes, b, 6, c, 3, { vel: 0.56, lo: 54, hi: 74 }); if (i < 3 || second) s.chord(keys, rhodes, b, 13, next, 7, { vel: 0.64, lo: 54, hi: 74 }); });
    ch.forEach((c, i) => { s.bass(low, bass, bar + i, c, SLAP[i === 3 ? 1 : i % 2], { slap: true, vel: second ? 0.84 : 0.74 }); if (second) funk(bar + i, c); });
    s.drums(kit, bar, 3, GROOVE.a, { vel: second ? 1 : 0.84 }); s.drums(kit, bar + 3, 1, GROOVE.a2, { vel: second ? 1 : 0.84 });
  };
  /** the rhythm guitar: scratched sixteenths with the chord's top on the off-beats */
  const funk = (bar, sym, later = sym) => {
    const mute = (m, v, take) => eguitar(m, v, 'mute', take), clean = (m, v, take) => eguitar(m, v, 'clean', take), row = 'g.gx.g.gx.g.gxg.';
    [...row].forEach((c, i) => { if (c === '.') return; if (c === 'x') s.chord(gtr, clean, bar, i, i < 8 ? sym : later, 0.8, { vel: 0.6, n: 3, lo: 62, hi: 79, strum: 0.003 }); else { const [t, v] = gtr.human(s.t(bar, i), 0.34); gtr.sound(() => mute(62, v, gtr.take()), t, { g: v }); gtr.sound(() => mute(69, v, gtr.take()), t + 0.002, { g: v }); } });
  };
  const chorusB = (bar, n) => {
    const t = n ? 2 : 0, ch = B.map((c) => up(c, n)), last = up('A7alt', n);
    s.phrase(lead, bar, 0, 'E6:6 D6:3 C6:3 A5:4', { vel: 0.86, transpose: t }); s.phrase(lead, bar + 1, 0, 'G5:2 A5:2 C6:4 A5:3 G5:2 E5:3', { vel: 0.78, transpose: t });
    s.phrase(lead, bar + 2, 0, 'A5:8^~ G5:2 Bb5:2 C6:4', { vel: 0.82, transpose: t }); s.phrase(lead, bar + 3, 0, 'D6:6 E6:2 C#6:4 Bb5:2 G5:2', { vel: 0.86, transpose: t });
    // the last bar turns to the altered chord at its middle: the whole band turns with it
    ch.forEach((c, i) => { const turn = i === 3; s.chord(keys, rhodes, bar + i, 0, c, turn ? 8 : 6, { vel: 0.58, lo: 54, hi: 74 }); if (!turn) { s.chord(keys, rhodes, bar + i, 10, c, 2, { vel: 0.48, lo: 54, hi: 74 }); s.bass(low, bass, bar + i, c, SLAP[2], { slap: true, lift: !n && i < 2 ? 12 : 0 }); } s.pad(pad, strings, bar + i, 0, c, turn ? 8 : 15, { vel: 0.5, top: 84 }); funk(bar + i, c, turn ? last : c); });
    s.bass(low, bass, bar + 3, ch[3], '1x1xp.1x', { slap: true }); s.bass(low, bass, bar + 3, last, 'p.1xb.p.', { slap: true, from: 8 }); s.pad(pad, strings, bar + 3, 8, last, 7, { vel: 0.5, top: 84 });
    s.chord(keys, rhodes, bar + 3, 8, last, 7, { vel: 0.7, lo: 54, hi: 74 }); s.chord(horns, fall(s.span(7), { fall: 1 }), bar + 3, 8, last, 7, { vel: 0.8, lo: 60, hi: 81 });
    s.drums(kit, bar, 3, GROOVE.b); s.drums(kit, bar + 3, 1, GROOVE.fill);
  };
  const chorusTag = (bar, n) => {
    const t = n ? 2 : 0, u = (c) => up(c, n), hit = (b, st, sym, len, v = 0.86, f = 0) => s.chord(horns, fall(s.span(len) * 0.92, { fall: f }), b, st, sym, len, { vel: v, n: 4, lo: 60, hi: 84 });
    s.phrase(lead, bar, 0, 'D6:3! D6:3! D6:2! A5:8~ | D6:3! D6:3! D6:2! E6:8~ | D6:6 C6:2 A5:6 G5:2 | D6:16~', { vel: 0.9, transpose: t });
    s.drums(kit, bar, 1, { crash: 'X...............', ...GROOVE.tag }); s.drums(kit, bar + 1, 2, GROOVE.tag); s.drums(kit, bar + 3, 1, { ...GROOVE.fill2, crash: 'X...............' });
    for (const [b, c] of [[bar, u('D13sus')], [bar + 1, u('E/D')]]) { hit(b, 0, c, 2.6); hit(b, 3, c, 2.6); hit(b, 6, c, 1.7); hit(b, 8, c, 7, 0.78, 0); s.chord(keys, rhodes, b, 0, c, 14, { vel: 0.66, lo: 54, hi: 74 }); s.bass(low, bass, b, c, '1..1..1.1.xp.7x5', { slap: true }); }
    hit(bar + 2, 0, u('Bbmaj9'), 7, 0.82); hit(bar + 2, 8, u('C9'), 7, 0.84); s.chord(keys, rhodes, bar + 2, 0, u('Bbmaj9'), 8, { vel: 0.66, lo: 54, hi: 74 }); s.chord(keys, rhodes, bar + 2, 8, u('C9'), 8, { vel: 0.66, lo: 54, hi: 74 });
    s.bass(low, bass, bar + 2, u('Bbmaj9'), '1..xp.1.', { slap: true }); s.bass(low, bass, bar + 2, u('C9'), '1..xp.1x', { slap: true, from: 8 });
    hit(bar + 3, 0, u('D6/9'), 14, 0.96); s.chord(keys, rhodes, bar + 3, 0, u('D6/9'), 15, { vel: 0.72, lo: 54, hi: 76 }); s.bass(low, bass, bar + 3, u('D6/9'), '1-----------..p7', { slap: true }); s.pad(pad, strings, bar + 3, 0, u('D6/9'), 15, { vel: 0.6, top: 86 });
  };

  // ---- intro: the motif in the slap bass alone, then the band falls in
  s.line(low, (m, v, take) => bass(m, v, 'thumb', take), 0, 0, 'D2:3 A2:3 A2:2 C3:3 A2:2 G2:3 | A2:3 D3:3 C3:2 A2:3 G2:2 E2:3', { vel: 0.84, art: 0.86 });
  s.drums(kit, 0, 2, { hat: '....x...x...x..x' }, { vel: 0.7 });
  s.line(low, (m, v, take) => bass(m, v, 'thumb', take), 2, 0, 'D2:3 A2:3 A2:2 C3:3 A2:2 G2:3 | A2:3 D3:3 C3:2 A2:3 G2:2 E2:3', { vel: 0.88, art: 0.86 });
  s.drums(kit, 2, 1, GROOVE.a); s.drums(kit, 3, 1, GROOVE.fill);
  s.chord(keys, rhodes, 2, 0, 'D13sus', 6, { vel: 0.6, lo: 54, hi: 74 }); s.chord(keys, rhodes, 2, 8, 'D13sus', 4, { vel: 0.5, lo: 54, hi: 74 }); s.chord(keys, rhodes, 3, 0, 'Am11', 6, { vel: 0.6, lo: 54, hi: 74 }); s.chord(keys, rhodes, 3, 14, 'D13sus', 2, { vel: 0.66, lo: 54, hi: 74 });

  s.drums(kit, 4, 1, { crash: 'X...............' }); chorusA(4, 0); chorusA(8, 0, { second: true }); chorusB(12, 0); chorusTag(16, 0);

  // ---- the solo: the motif's head climbing by minor thirds over major sevenths, a run, then the whole band in unison on the motif's rhythm, a tone higher
  const solo = ['Fmaj9', 'Abmaj9', 'Bmaj9', 'Dmaj9', 'Gmaj9', 'C13', 'Bbmaj9', 'B13sus'];
  s.phrase(lead, 20, 0, 'F5:3 C6:3 C6:2 E6:3 C6:2 A5:3 | Ab5:3 Eb6:3 Eb6:2 G6:3 Eb6:2 C6:3 | B5:3 F#6:3 F#6:2 A#6:3 F#6:2 D#6:3 | D6:3 A6:3 F#6:2 E6:3 D6:2 A5:3', { vel: 0.84 });
  s.phrase(lead, 24, 0, 'B6:3 A6:1 F#6:2 E6:1 D6:1 B5:3 A5:1 G5:1 F#5:1 E5:2 | G5:2 Bb5:2 C6:2 D6:2 E6:2 G6:2 A6:4^~ | A6:3 G6:1 F6:2 D6:1 C6:1 A5:3 Bb5:1 C6:1 D6:1 F6:2 | E6:3! F#6:3! A6:2! B6:3! A6:2! F#6:3!', { vel: 0.86 });
  solo.slice(0, 7).forEach((c, i) => { const b = 20 + i; s.chord(keys, rhodes, b, 0, c, 3, { vel: 0.6, lo: 54, hi: 74 }); s.chord(keys, rhodes, b, 6, c, 2, { vel: 0.5, lo: 54, hi: 74 }); s.chord(keys, rhodes, b, 11, c, 4, { vel: 0.56, lo: 54, hi: 74 }); s.bass(low, bass, b, c, '1--.5-.x1-.p.7-.', { vel: i < 4 ? 0.66 : 0.78, slap: i >= 4 }); s.pad(pad, strings, b, 0, c, 15, { vel: 0.42, top: 82 }); });
  s.drums(kit, 20, 4, GROOVE.solo, { vel: 0.8 }); s.drums(kit, 24, 3, GROOVE.solo, { vel: 0.94 });
  s.line(low, (m, v, take) => bass(m, v, 'thumb', take), 27, 0, 'E2:3 F#2:3 A2:2 B2:3 A2:2 F#2:3', { vel: 0.9, art: 0.7 }); s.drums(kit, 27, 1, { kick: 'X..X..X.X..X.X..', snare: 'X..X..X.X..X.X..', crash: 'X...............' });
  for (const [st, len] of [[0, 2.6], [3, 2.6], [6, 1.7], [8, 2.6], [11, 1.7], [13, 2.6]]) { s.chord(horns, fall(s.span(len)), 27, st, solo[7], len, { vel: 0.88, n: 4, lo: 60, hi: 84 }); s.chord(keys, rhodes, 27, st, solo[7], len, { vel: 0.66, lo: 54, hi: 74 }); }

  s.drums(kit, 28, 1, { crash: 'X...............' }); chorusA(28, 2, { second: true }); chorusB(32, 2); chorusTag(36, 2);
  // ---- the end: the whole band on one last chord, the tune landing on the day's third
  s.drums(kit, 40, 1, { crash: 'X...............', kick: 'X...............', snare: 'X...............', tomL: 'X...............' });
  s.chord(horns, fall(s.span(14), { fall: 0 }), 40, 0, 'Emaj9', 14, { vel: 1, n: 4, lo: 60, hi: 86 }); s.chord(keys, rhodes, 40, 0, 'Emaj9', 16, { vel: 0.8, lo: 54, hi: 76, n: 4 });
  s.bass(low, bass, 40, 'Emaj9', '1---------------', { slap: true }); s.phrase(lead, 40, 0, 'G#6:14^~', { vel: 0.9 });
  return s;
}
