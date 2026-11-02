// « Le Tournoi », morning (journal Passe SN5): the motif as it was first written, in 6/8, on the folk side of the fusion, in the manner of Chrono Cross's
// villages: a nylon guitar picking, a wooden flute, a fretless bass, hands on a frame drum, a bouzouki joining for the fanfare. D major, the third F sharp in
// the open: the day has come. An original score, no work reproduced.
import { Session, parseChord, voice } from '../../../tools/audio/band/session.mjs';
import { nylon, bouzouki, bass, marimba, strings, flute } from '../../../tools/audio/band/instruments.mjs';
import { chorus, compress } from '../../../tools/audio/band/dsp.mjs';
import { lilt } from './theme.mjs';
import { loopOf } from './rig.mjs';

const A = ['Dadd9', 'Cadd9', 'Am7', 'Em7'], B = ['Gmaj9', 'D7/F#', 'Am7', 'Dadd9'], TAG = ['Dadd9', 'Em7', 'Cadd9', 'Dadd9'], C = ['Bm9', 'F#m7', 'Gmaj9', 'Dadd9/F#', 'Em9', 'Bm7', 'Cadd9', 'A7sus'];
const HANDS = {
  light: { frame: 'X.....x...o.', shaker: 'x.o.o.x.o.o.' },
  full: { frame: 'X.....x...o.', shaker: 'x.o.o.x.o.o.', bongo: '....o.....o.', conga: '..o.....o...', slap: '......x.....' },
  tag: { frame: 'X..o..X...o.', shaker: 'x.o.o.x.o.o.', tamb: 'x.....x.....', bongo: '....o.....x.', conga: '..o.....x...', slap: '......X.....', cajon: 'X.........o.' },
};
const fretless = (m, v, _, take) => bass(m, v, 'fretless', take);
/** the middle's hemiola: three groups of four sixteenths against the flute's two of six */
const HEMI = { frame: 'X...x...x...', shaker: 'x.o.x.o.x.o.', conga: '..o...o...o.', bongo: '....o...o...' };

/** the tracks that carry the tune: the band's voicings make room for them */
export const tunes = ['flute'];

export default function score(o = {}) {
  const s = new Session({ id: 'matin', seed: 66, bpm: 66, steps: 12, beat: 6, bars: 44, tail: 6, ...o, ...loopOf(o, 4, 40) });
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
    const order = shape === 0 ? [root, v[0], v[1], v[2], v[1], v[0]] : shape === 1 ? [root, v[1], v[2], v[1] + 12 - 12, v[2], v[1]] : [root, root + 12, v[1], v[2], v[0], v[1]];
    order.forEach((m, i) => { const st = i * 2, [t, g] = gtr.human(s.t(bar, st), vel * (hemi ? (i % 2 ? 0.8 : 1.2) : i === 0 ? 1.25 : i === 3 ? 1.05 : 0.92)); gtr.sound(() => nylon(m, g, gtr.take()), t, { g, dur: s.span(12 - st) + 0.15, rel: 0.2 }, m); });
  };
  const round = (bar, list, o) => list.forEach((c, i) => pick(bar + i, c, { shape: i % 2, ...o }));
  const under = (bar, list, row = '1-----5---.-', vel = 0.68) => list.forEach((c, i) => s.bass(low, fretless, bar + i, c, row, { vel, art: 1 }));
  const padOver = (bar, list, vel = 0.42) => list.forEach((c, i) => s.pad(pad, strings, bar + i, 0, c, 11.5, { vel, n: 4, lo: 57, hi: 81, attack: 0.9, release: 0.8 }));

  // ---- the guitar alone, then the fretless under it, then the hands
  round(0, ['Dadd9', 'Dadd9', 'Cadd9', 'A7sus'], { vel: 0.46 }); under(2, ['Cadd9', 'A7sus'], '1-----------', 0.6); s.drums(hands, 3, 1, { shaker: 'o.o.o.o.o.x.', frame: '..........o.' });
  // ---- the theme, twice, the second time with the strings and the marimba's answers
  round(4, A); under(4, A); s.drums(hands, 4, 4, HANDS.light); s.phrase(fl, 4, 0, lilt.a, { vel: 0.66 });
  round(8, B); under(8, B); s.drums(hands, 8, 4, HANDS.light); s.phrase(fl, 8, 0, lilt.b, { vel: 0.7 });
  round(12, A); under(12, A); padOver(12, A); s.drums(hands, 12, 4, HANDS.full); s.phrase(fl, 12, 0, lilt.a, { vel: 0.72 });
  s.line(bars, marimba, 13, 8, 'A5:1 C6:1 D6:1 E6:1', { vel: 0.5 }); s.line(bars, marimba, 15, 6, 'F#5:2 G5:2 A5:2', { vel: 0.5 });
  round(16, B); under(16, B); padOver(16, B); s.drums(hands, 16, 4, HANDS.full); s.phrase(fl, 16, 0, lilt.b, { vel: 0.76 });
  s.line(bars, marimba, 19, 0, 'A5:2 B5:2 D6:2 E6:2 F#6:2 A6:2', { vel: 0.55 });
  // ---- the fanfare, the bouzouki and the tambourine join
  round(20, TAG, { vel: 0.56 }); under(20, TAG, '1--1--5---7-', 0.74); padOver(20, TAG, 0.5); s.drums(hands, 20, 4, HANDS.tag); s.phrase(fl, 20, 0, lilt.tag, { vel: 0.82 });
  s.line(bouz, bouzouki, 20, 0, 'A4:2 A4:2 A4:2 F#4:6 | A4:2 A4:2 A4:2 B4:6 | A4:4 G4:2 E4:4 D4:2 | F#4:12', { vel: 0.7, art: 1 });
  TAG.forEach((c, i) => TAGstrum(s, bouz, 20 + i, c));
  // ---- the song's middle: B minor, the flute up high, the marimba running under it
  round(24, C, { vel: 0.54, hemi: true }); under(24, C, '1---5---1---', 0.72); padOver(24, C, 0.5); s.drums(hands, 24, 7, HEMI); s.drums(hands, 31, 1, { frame: 'X..o..x.o.ox', shaker: 'x.o.o.x.o.oX', conga: '..o..o..o.o.', bongo: '.......x..x.' });
  s.phrase(fl, 24, 0, 'F#6:6 E6:4 D6:2 | C#6:6 A5:6 | B5:4 D6:2 E6:6 | F#6:6 A6:6 | G6:6 F#6:4 E6:2 | D6:6 B5:6 | C6:4 D6:2 E6:4 G6:2 | A6:12~', { vel: 0.8 });
  [[24, 'B5 D6 F#6'], [25, 'A5 C#6 E6'], [26, 'B5 D6 F#6'], [27, 'A5 D6 F#6'], [28, 'B5 E6 G6'], [29, 'B5 D6 F#6'], [30, 'C6 E6 G6'], [31, 'A5 D6 E6']].forEach(([b, notes]) => { const n = notes.split(' '); s.line(bars, marimba, b, 0, `${n[0]}:2 ${n[1]}:2 ${n[2]}:2 ${n[1]}:2 ${n[2]}:2 ${n[1]}:2`, { vel: 0.42, art: 1, transpose: -12 }); });
  // ---- the theme comes home with a voice under it, the third itself, then the fanfare
  round(32, A, { vel: 0.56 }); under(32, A); padOver(32, A, 0.5); s.drums(hands, 32, 4, HANDS.full); s.phrase(fl, 32, 0, lilt.a, { vel: 0.8 });
  s.line(bouz, bouzouki, 32, 0, 'B4:6 F#5:4 F#5:2 | A5:4 F#5:2 E5:4 F#5:2 | B5:6 A5:4 F#5:2 | E5:4 C5:2 D5:6', { vel: 0.66, art: 1 });
  round(36, TAG, { vel: 0.58 }); under(36, TAG, '1--1--5---7-', 0.76); padOver(36, TAG, 0.56); s.drums(hands, 36, 4, HANDS.tag); s.phrase(fl, 36, 0, lilt.tag, { vel: 0.86 }); TAG.forEach((c, i) => TAGstrum(s, bouz, 36 + i, c));
  if (s.loop) return s;
  // ---- the guitar alone again
  round(40, ['Gmaj9', 'Dadd9'], { vel: 0.46 }); under(40, ['Gmaj9', 'Dadd9'], '1-----------', 0.6);
  pick(42, 'Dadd9', { vel: 0.4, shape: 2 }); s.phrase(fl, 42, 0, 'A5:6 D6:18~', { vel: 0.5 }); s.bass(low, fretless, 42, 'Dadd9', '1-----------', { vel: 0.56 });
  s.drums(hands, 40, 2, { shaker: 'o.o.o.o.o.o.' }, { vel: 0.7 });
  return s;
}
/** the bouzouki's strummed double course on each strong beat of the fanfare */
function TAGstrum(s, bouz, bar, sym) { s.chord(bouz, bouzouki, bar, 0, sym, 5, { vel: 0.5, n: 3, lo: 57, hi: 69, strum: 0.012, rel: 0.2 }); s.chord(bouz, bouzouki, bar, 6, sym, 5, { vel: 0.44, n: 3, lo: 57, hi: 69, strum: 0.012, rel: 0.2 }); }
