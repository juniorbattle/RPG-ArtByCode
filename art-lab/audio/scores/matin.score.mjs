// The morning (journal Passes SN5 / SN8): a song of its own in 6/8, on the folk side of the fusion, in the manner of Chrono Cross's villages: a nylon guitar picking,
// a wooden flute, a fretless bass, hands on a frame drum, a bouzouki joining for the chorus. G major, the third B in the open: the day has come. Verses of six bars,
// a chorus of eight; the motif is only the marimba's ostinato in the middle, its head in E under the flute (journal Passe SN8: one piece, one tune). An original score.
import { Session, parseChord, voice } from '../../../tools/audio/band/session.mjs';
import { nylon, bouzouki, bass, marimba, strings, flute } from '../../../tools/audio/band/instruments.mjs';
import { chorus, compress } from '../../../tools/audio/band/dsp.mjs';
import { loopOf } from './rig.mjs';

const VERSE = ['Gadd9', 'Cadd9/G', 'Em7', 'Cmaj9', 'Am7', 'D9sus'], VERSE2 = ['Gadd9', 'Cadd9/G', 'Em7', 'Cmaj9', 'D9sus', 'Gadd9'], CHORUS = ['Cmaj9', 'D/C', 'Bm7', 'Em9', 'Am9', 'D9sus', 'Gmaj9', 'Gmaj9'], MIDDLE = ['Em9', 'Cmaj9', 'Am9', 'Bm11'], HOME = ['Gadd9', 'Cadd9/G', 'Em7', 'D9sus'];
const HANDS = {
  light: { frame: 'X.....x...o.', shaker: 'x.o.o.x.o.o.' },
  full: { frame: 'X.....x...o.', shaker: 'x.o.o.x.o.o.', bongo: '....o.....o.', conga: '..o.....o...', slap: '......x.....' },
  tag: { frame: 'X..o..X...o.', shaker: 'x.o.o.x.o.o.', tamb: 'x.....x.....', bongo: '....o.....x.', conga: '..o.....x...', slap: '......X.....', cajon: 'X.........o.' },
};
const fretless = (m, v, _, take) => bass(m, v, 'fretless', take);
/** the middle's hemiola: three groups of four sixteenths against the flute's two of six */
const HEMI = { frame: 'X...x...x...', shaker: 'x.o.x.o.x.o.', conga: '..o...o...o.', bongo: '....o...o...' };
const V1 = 'D5:2 G5:4 A5:2 B5:4 | D6:6 B5:2 A5:2 G5:2 | A5:4 G5:2 E5:6 | E5:2 G5:4 A5:2 B5:4 | D6:4 E6:2 D6:4 B5:2';

/** the tracks that carry the tune: the band's voicings make room for them */
export const tunes = ['flute'];

export default function score(o = {}) {
  const s = new Session({ id: 'matin', seed: 66, bpm: 66, steps: 12, beat: 6, bars: 40, tail: 6, ...o, ...loopOf(o, 2, 38) });
  const gtr = s.track('nylon', { pan: -0.2, gain: 0.56, plate: 0.09, room: 0.12, jitter: 0.005, lay: 0.002, vary: 0.12, eq: [['hp', 80]], fx: (L, R) => compress(L, R, { th: -16, ratio: 2, attack: 0.012, release: 0.12, makeup: 1 }) });
  const bouz = s.track('bouzouki', { pan: 0.42, gain: 0.3, room: 0.14, plate: 0.08, jitter: 0.004, eq: [['hp', 170]] });
  const fl = s.track('flute', { pan: 0.04, gain: 0.31, hall: 0.2, plate: 0.09, lay: 0.006, eq: [['hp', 260], ['peak', 3400, 1, 2]] }); fl.voice = (notes, total) => flute(notes, total, { seed: 11, breath: 0.11 });
  const low = s.track('fretless', { gain: 0.42, room: 0.04, plate: 0.03, lay: 0.004, eq: [['hp', 40], ['peak', 230, 1, -2], ['peak', 900, 1, 1.5]], fx: (L, R) => compress(L, R, { th: -14, ratio: 3, attack: 0.008, release: 0.14, makeup: 1 }) });
  const hands = s.track('hands', { gain: 0.6, room: 0.2, plate: 0.05, jitter: 0.006, lay: -0.001, vary: 0.14, eq: [['hp', 60]] });
  const bars = s.track('marimba', { pan: 0.34, gain: 0.34, room: 0.2, plate: 0.1, jitter: 0.004, eq: [['hp', 200]] });
  const pad = s.track('strings', { gain: 0.2, hall: 0.3, eq: [['hp', 240]], fx: (L, R) => chorus(L, R, { rate: 0.4, depth: 0.002, mix: 0.25 }) });

  /** the guitar's picking: the thumb on the bass, the fingers climbing; every note left ringing */
  const pick = (bar, sym, { vel = 0.5, shape = 0, hemi = false } = {}) => {
    const c = parseChord(sym), v = voice(c, s.voicings.get('nylon'), { lo: 55, hi: 74, n: 3, avoid: s.avoidAt(s.t(bar), s.span(12)) }), root = 40 + ((c.bass - 4 + 12) % 12); s.voicings.set('nylon', v);
    const order = shape === 0 ? [root, v[0], v[1], v[2], v[1], v[0]] : shape === 1 ? [root, v[1], v[2], v[1], v[2], v[1]] : [root, root + 12, v[1], v[2], v[0], v[1]];
    order.forEach((m, i) => { const st = i * 2, [t, g] = gtr.human(s.t(bar, st), vel * (hemi ? (i % 2 ? 0.8 : 1.2) : i === 0 ? 1.25 : i === 3 ? 1.05 : 0.92)); gtr.sound(() => nylon(m, g, gtr.take()), t, { g, dur: s.span(12 - st) + 0.15, rel: 0.2 }, m); });
  };
  const round = (bar, list, o) => list.forEach((c, i) => pick(bar + i, c, { shape: i % 2, ...o }));
  const under = (bar, list, row = '1-----5---.-', vel = 0.68) => list.forEach((c, i) => s.bass(low, fretless, bar + i, c, row, { vel, art: 1 }));
  const padOver = (bar, list, vel = 0.42) => list.forEach((c, i) => s.pad(pad, strings, bar + i, 0, c, 11.5, { vel, n: 4, lo: 57, hi: 81, attack: 0.9, release: 0.8 }));
  const strum = (bar, list) => list.forEach((c, i) => { s.chord(bouz, bouzouki, bar + i, 0, c, 5, { vel: 0.5, n: 3, lo: 57, hi: 72, strum: 0.012, rel: 0.2 }); s.chord(bouz, bouzouki, bar + i, 6, c, 5, { vel: 0.44, n: 3, lo: 57, hi: 69, strum: 0.012, rel: 0.2 }); });

  // ---- the hands and the guitar together; the fretless comes in with the verse
  round(0, ['Gadd9', 'Cadd9/G'], { vel: 0.46 }); s.drums(hands, 0, 2, { frame: 'X.....o...o.', shaker: 'o.o.o.o.o.x.' }, { vel: 0.8 });
  // ---- the verse, six bars: it ends open on the first time, home on the second; the marimba answers in the long notes
  round(2, VERSE); under(2, VERSE); s.drums(hands, 2, 6, HANDS.light); s.phrase(fl, 2, 0, `${V1} | A5:12`, { vel: 0.68 });
  round(8, VERSE2); under(8, VERSE2); s.drums(hands, 8, 6, HANDS.light); s.phrase(fl, 8, 0, `${V1} | G5:12`, { vel: 0.72 });
  s.line(bars, marimba, 10, 6, 'B4:2 D5:2 E5:2', { vel: 0.5 }); s.line(bars, marimba, 13, 4, 'D5:2 B4:2 A4:2 G4:2', { vel: 0.5 });
  // ---- the chorus: the flute up high, the strings and the bouzouki's strokes; the bass pops the octave where the flute holds the root
  const CH = 'G6:6 E6:4 D6:2 | F#6:6 D6:4 A5:2 | D6:4 B5:2 A5:4 F#5:2 | G5:12 | E6:6 D6:4 C6:2 | B5:4 A5:2 C6:4 B5:2 | A5:6 B5:6 | G5:12';
  round(14, CHORUS, { vel: 0.54 }); under(14, CHORUS, '1--1--5---p-', 0.72); padOver(14, CHORUS, 0.46); s.drums(hands, 14, 8, HANDS.full); s.phrase(fl, 14, 0, CH, { vel: 0.8 }); strum(14, CHORUS);
  // ---- the middle: E minor in a hemiola, the marimba going round the motif's head, the flute in groups of four
  round(22, MIDDLE, { vel: 0.52, hemi: true }); under(22, MIDDLE, '1---5---1---', 0.7); padOver(22, MIDDLE, 0.5); s.drums(hands, 22, 3, HEMI); s.drums(hands, 25, 1, { frame: 'X..o..x.o.ox', shaker: 'x.o.o.x.o.oX', conga: '..o..o..o.o.', bongo: '.......x..x.' });
  for (let b = 22; b < 26; b++) s.line(bars, marimba, b, 0, 'E4:2 B4:2 B4:2 D5:2 B4:2 A4:2', { vel: 0.44, art: 1 });
  s.phrase(fl, 22, 0, 'G6:6 F#6:6 | E6:4 D6:4 B5:4 | D6:4 E6:4 F#6:4 | E6:12', { vel: 0.8 });
  // ---- the chorus again, the bouzouki's own line against the flute
  round(26, CHORUS, { vel: 0.58 }); under(26, CHORUS, '1--1--5---p-', 0.76); padOver(26, CHORUS, 0.54); s.drums(hands, 26, 8, HANDS.tag); s.phrase(fl, 26, 0, CH, { vel: 0.86 });
  s.line(bouz, bouzouki, 26, 0, 'E4:6 G4:6 | F#4:6 A4:6 | F#4:6 D4:6 | E4:12 | C5:6 E5:6 | D5:6 C5:6 | B4:12 | D4:6 G4:6', { vel: 0.64, art: 1 });
  // ---- a tag of its own, down from D to the A where the verse starts again
  round(34, HOME, { vel: 0.5 }); under(34, HOME, '1-----5---.-', 0.66); padOver(34, HOME, 0.38); s.drums(hands, 34, 4, HANDS.light, { vel: 0.9 }); s.phrase(fl, 34, 0, 'D6:6 E6:4 G6:2 | E6:6 D6:6 | B5:4 G5:2 E5:6 | A5:12', { vel: 0.7 });
  if (s.loop) return s;
  // ---- the guitar alone again
  round(38, ['Gadd9', 'Gadd9'], { vel: 0.44 }); under(38, ['Gadd9'], '1-----------', 0.58); s.phrase(fl, 38, 0, 'B5:6 G5:18~', { vel: 0.52 });
  s.drums(hands, 38, 2, { shaker: 'o.o.o.o.o.o.' }, { vel: 0.7 });
  return s;
}
