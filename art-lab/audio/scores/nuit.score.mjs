// « Le Tournoi », the night (journal Passe SN5): the same motif drawn out over a slow fusion ballad, the calm side of Final Fantasy VIII heard from the quays:
// an electric piano with its stereo tremolo, a vibraphone, a fretless bass, brushes, a dark wind synth. D dorian, the third F natural: the third is the hour.
// An original score, no work reproduced.
import { Session } from '../../../tools/audio/band/session.mjs';
import { rhodes, bass, vibes, strings, ewi } from '../../../tools/audio/band/instruments.mjs';
import { tremolo, pingPong, chorus, compress } from '../../../tools/audio/band/dsp.mjs';
import { longHead } from './theme.mjs';

const fretless = (m, v, _, take) => bass(m, v, 'fretless', take);
const BRUSH = { sweep: 'o...o...o...o...', brush: '....x..g....x.g.', hat: '....g.......g...', kick: 'g.........g.....' };
const SOFT = { sweep: 'o.......o.......', hat: '....g.......g...' };

/** the tracks that carry the tune: the band's voicings make room for them */
export const tunes = ['lead', 'vibes'];

export default function score(o = {}) {
  const s = new Session({ id: 'nuit', seed: 64, bpm: 64, swing: 0.6, bars: 23, tail: 7, ...o });
  const keys = s.track('rhodes', { pan: -0.05, gain: 0.3, plate: 0.2, hall: 0.08, jitter: 0.006, vary: 0.1, lay: 0.004, eq: [['hp', 120], ['high', 5000, 0.7, -2]], fx: (L, R) => { tremolo(L, R, 3.4, 0.34); chorus(L, R, { rate: 0.4, depth: 0.0016, mix: 0.2 }); } });
  const vib = s.track('vibes', { pan: 0.3, gain: 0.4, hall: 0.26, plate: 0.1, jitter: 0.005, eq: [['hp', 240]], fx: (L, R) => tremolo(L, R, 4.6, 0.22) });
  const low = s.track('fretless', { gain: 0.42, room: 0.05, plate: 0.05, lay: 0.012, jitter: 0.008, eq: [['hp', 40], ['peak', 230, 1, -2], ['peak', 900, 1, 2]], fx: (L, R) => compress(L, R, { th: -14, ratio: 3, attack: 0.01, release: 0.18, makeup: 1 }) });
  const kit = s.track('brushes', { gain: 0.95, room: 0.26, jitter: 0.008, lay: 0.006, vary: 0.14, eq: [['hp', 50]] });
  const lead = s.track('lead', { gain: 0.26, hall: 0.26, plate: 0.14, lay: 0.012, eq: [['hp', 200], ['high', 3800, 0.7, -3]], fx: (L, R) => pingPong(L, R, { time: s.span(6), feedback: 0.34, mix: 0.2, tone: 1900 }) });
  lead.voice = (notes, total) => ewi(notes, total, { seed: 13, dark: 1, porta: 0.06, scoop: 0.9, scoopT: 0.09, attack: 0.03, release: 0.16, vibRate: 4.6, vibDepth: 0.2, vibDelay: 0.32 });
  const pad = s.track('strings', { gain: 0.18, hall: 0.34, eq: [['hp', 220], ['high', 3000, 0.7, -4]], fx: (L, R) => chorus(L, R, { rate: 0.3, depth: 0.002, mix: 0.25 }) });

  /** a bar of the electric piano: a slow arrival and its answers, never twice the same placing in a row */
  const PLACE = [[[0, 10], [11, 4.5]], [[0, 6], [7, 3], [11, 4.5]], [[0, 3], [3, 7], [14, 2]]];
  const keysBar = (bar, sym, vel = 0.5, only = PLACE[bar % 3]) => only.forEach(([st, len], k) => s.chord(keys, rhodes, bar, st, sym, len, { vel: k ? vel * 0.8 : vel, lo: 53, hi: 72, n: 4, strum: k ? 0.01 : 0.014, rel: 0.3 }));
  const under = (bar, sym, row = '1-------5-----7-', vel = 0.66) => s.bass(low, fretless, bar, sym, row, { vel, art: 1 });

  const A = ['Dm11', 'Fmaj9', 'Bbmaj9', 'A7sus'], B = ['Am9', 'Dm9', 'Gm9', 'Ebmaj9#11'], TAG = ['Dm11', 'Em7b5', 'Bbmaj9', 'Dm9'];
  // ---- the electric piano alone
  keysBar(0, 'Dm11', 0.46); keysBar(1, 'Bbmaj9', 0.46); under(1, 'Bbmaj9', '1---------------', 0.56); s.drums(kit, 1, 1, SOFT, { vel: 0.7 });
  // ---- the vibraphone has the motif
  A.forEach((c, i) => { keysBar(2 + i, c); under(2 + i, c); s.drums(kit, 2 + i, 1, BRUSH); });
  s.line(vib, vibes, 2, 0, longHead(5), { vel: 0.66, art: 1.2, rel: 0.4 });
  // ---- the dark wind takes the answer
  s.phrase(lead, 5, 10, 'A5:2 C6:2 D6:2 E6:10~ D6:3 C6:3 A5:16~ G5:3 A5:3 C6:5 A5:3 G5:2 A5:12~', { vel: 0.68 });
  B.forEach((c, i) => { const turn = i === 3; keysBar(6 + i, c, 0.5, turn ? [[0, 11.5]] : undefined); under(6 + i, c, turn ? '1-------5---' : undefined); s.drums(kit, 6 + i, 1, BRUSH); s.pad(pad, strings, 6 + i, 0, c, turn ? 11.5 : 15, { vel: 0.4, n: 4, lo: 57, hi: 79, attack: 1.2, release: turn ? 0.6 : 1.2 }); });
  // the end of the phrase turns to the altered chord: the bass, the strings and the piano together
  s.chord(keys, rhodes, 9, 12, 'A7alt', 4, { vel: 0.5, lo: 53, hi: 72, strum: 0.01 }); s.bass(low, fretless, 9, 'A7alt', '1---', { vel: 0.66, art: 1, from: 12 }); s.pad(pad, strings, 9, 12, 'A7alt', 3.8, { vel: 0.4, n: 4, lo: 57, hi: 79, attack: 0.3, release: 0.6 });
  // ---- the motif again, on the wind, the vibraphone answering in the long notes
  A.forEach((c, i) => { keysBar(10 + i, c, 0.54); under(10 + i, c, '1-----5-1-----7-', 0.7); s.drums(kit, 10 + i, 1, BRUSH); s.pad(pad, strings, 10 + i, 0, c, 15, { vel: 0.46, n: 4, lo: 57, hi: 79, attack: 1, release: 1.2 }); });
  s.phrase(lead, 10, 0, longHead(5), { vel: 0.72 });
  s.line(vib, vibes, 10, 10, 'F5:2 A5:2 C6:2', { vel: 0.5, art: 1.5, rel: 0.4 }); s.line(vib, vibes, 12, 10, 'A5:2 D6:2 F6:2', { vel: 0.5, art: 1.5, rel: 0.4 });
  // ---- the fanfare, whispered
  TAG.forEach((c, i) => { keysBar(14 + i, c, 0.58); under(14 + i, c, '1-----5-1-----7-', 0.74); s.drums(kit, 14 + i, 1, BRUSH); s.pad(pad, strings, 14 + i, 0, c, 15, { vel: 0.54, n: 5, lo: 57, hi: 81, attack: 0.8, release: 1.4 }); });
  s.phrase(lead, 14, 0, 'D6:3 D6:3 D6:2 A5:8~ | D6:3 D6:3 D6:2 E6:8~ | D6:6 C6:2 A5:6 G5:2 | D6:16~', { vel: 0.76 });
  // ---- the end: the motif's head alone, and the third that says the hour
  keysBar(18, 'Bbmaj9', 0.46); under(18, 'Bbmaj9', '1---------------', 0.6); s.drums(kit, 18, 2, SOFT, { vel: 0.7 });
  keysBar(19, 'A7sus', 0.44); under(19, 'A7sus', '1---------------', 0.56);
  s.line(vib, vibes, 18, 0, 'D5:8 A5:5 A5:3 | C6:5 A5:3 G5:5 A5:3', { vel: 0.5, art: 1.3, rel: 0.5 });
  s.chord(keys, rhodes, 20, 0, 'Dm9', 24, { vel: 0.46, lo: 53, hi: 74, n: 5, strum: 0.03, rel: 0.6 }); s.bass(low, fretless, 20, 'Dm9', '1-----------------------', { vel: 0.56, art: 1 }); s.line(vib, vibes, 20, 8, 'F5:24', { vel: 0.44, art: 1, rel: 1 });
  s.padNotes(pad, strings, s.t(20), s.span(30), [62, 65, 69, 72], { vel: 0.36, attack: 1, release: 2 });
  return s;
}
