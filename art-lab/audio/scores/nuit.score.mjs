// The night (journal Passes SN5 / SN8): a slow fusion ballad with a song of its own, the calm side of Final Fantasy VIII heard from the quays: an electric piano with its
// stereo tremolo, a vibraphone, a fretless bass, brushes, a dark wind synth. D dorian, the song opening on its third, F natural: the third is the hour. A phrase of five
// bars, one of four, then the day comes back as a memory: the motif's head low on the vibraphone, under a soft line of the wind (journal Passe SN8: one piece,
// one tune). An original score, no work reproduced.
import { Session } from '../../../tools/audio/band/session.mjs';
import { rhodes, bass, vibes, strings, ewi } from '../../../tools/audio/band/instruments.mjs';
import { tremolo, pingPong, chorus, compress } from '../../../tools/audio/band/dsp.mjs';
import { loopOf } from './rig.mjs';

const fretless = (m, v, _, take) => bass(m, v, 'fretless', take);
const BRUSH = { sweep: 'o...o...o...o...', brush: '....x..g....x.g.', hat: '....g.......g...', kick: 'g.........g.....' };
const SOFT = { sweep: 'o.......o.......', hat: '....g.......g...' };

/** the tracks that carry the tune: the band's voicings make room for them */
export const tunes = ['lead', 'vibes'];

export default function score(o = {}) {
  const s = new Session({ id: 'nuit', seed: 64, bpm: 64, swing: 0.6, bars: 21, tail: 7, ...o, ...loopOf(o, 2, 19) });
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
  const wash = (bar, sym, vel = 0.42, len = 15) => s.pad(pad, strings, bar, 0, sym, len, { vel, n: 4, lo: 57, hi: 79, attack: 1, release: 1.2 });

  const A = ['Dm11', 'Em7/D', 'Fmaj7#11', 'G13', 'A7sus'], A2 = ['Dm11', 'Gm9', 'Bbmaj7#11', 'A7alt'], MEM = ['Dm9', 'Am11', 'Fmaj9', 'A7sus'], A3 = ['Dm11', 'Em7/D', 'Bbmaj9', 'A7sus'];
  // ---- the electric piano alone, the wind's pickup into the song; the bass waits for it
  keysBar(0, 'Dm11', 0.46); keysBar(1, 'Bbmaj9', 0.46); s.drums(kit, 1, 1, SOFT, { vel: 0.6 }); s.phrase(lead, 1, 8, 'C5:4 D5:2 E5:2', { vel: 0.56 });
  // ---- the song: five bars, the bass holding D under the second, the dorian B natural on the fourth; the vibraphone echoes the last
  A.forEach((c, i) => { keysBar(2 + i, c); under(2 + i, c, i === 1 ? '1---------------' : undefined); s.drums(kit, 2 + i, 1, BRUSH); });
  s.phrase(lead, 2, 0, 'F5:4 E5:2 D5:2 A5:8~ | G5:6 A5:2 E5:4 D5:4 | C6:6 B5:2 A5:8~ | B5:4 A5:4 G5:4 F5:4 | E5:16~', { vel: 0.7 });
  s.line(vib, vibes, 6, 4, 'A5:4 D6:4 E6:4', { vel: 0.5, art: 1.4, rel: 0.4 });
  // ---- four bars that climb and turn to the altered chord
  A2.forEach((c, i) => { keysBar(7 + i, c, 0.52); under(7 + i, c, '1-----5-1-----7-', 0.68); s.drums(kit, 7 + i, 1, BRUSH); wash(7 + i, c, 0.4); });
  s.phrase(lead, 7, 0, 'D6:6 C6:2 A5:8~ | Bb5:6 A5:2 F5:8 | A5:4 C6:4 D6:8~ | C#6:7 Bb5:1 A5:8~', { vel: 0.74 }); s.line(vib, vibes, 8, 10, 'C6:2 D6:2 F6:2', { vel: 0.48, art: 1.5, rel: 0.4 });
  // ---- the day as a memory: the motif's head low on the vibraphone, in a rhythm of its own, under the wind's soft counter-line (journal Passe SN8: hidden, not the title's opening)
  MEM.forEach((c, i) => { keysBar(11 + i, c, 0.46); under(11 + i, c, '1---------------', 0.6); s.drums(kit, 11 + i, 1, SOFT, { vel: 0.8 }); wash(11 + i, c, 0.5); });
  s.line(vib, vibes, 11, 0, 'D4:8 A4:6 A4:2 | C5:6 A4:2 G4:8 | A4:16', { vel: 0.58, art: 1.2, rel: 0.5 }); s.phrase(lead, 11, 0, 'F5:8 E5:8 | E5:6 G5:2 C6:8 | C6:8 B5:8 | G5:4 E5:4 A5:8~', { vel: 0.6 });
  // ---- the song again, its end turned home
  A3.forEach((c, i) => { keysBar(15 + i, c, 0.54); under(15 + i, c, i === 1 ? '1---------------' : '1-----5-1-----7-', 0.7); s.drums(kit, 15 + i, 1, BRUSH); wash(15 + i, c, 0.44); });
  s.phrase(lead, 15, 0, 'F5:4 E5:2 D5:2 A5:8~ | G5:6 A5:2 E5:4 D5:4 | F5:6 G5:2 A5:8~ | G5:4 E5:4 D5:8~', { vel: 0.72 });
  if (s.loop) return s;
  // ---- the end, left open: the dominant held, the vibraphone alone over it; the night goes on
  s.chord(keys, rhodes, 19, 0, 'A7sus', 24, { vel: 0.42, lo: 53, hi: 74, n: 4, strum: 0.03, rel: 0.6 }); s.line(vib, vibes, 19, 4, 'E5:6 G5:6 D5:20', { vel: 0.44, art: 1, rel: 1 });
  s.padNotes(pad, strings, s.t(19), s.span(30), [57, 62, 64, 67], { vel: 0.34, attack: 1, release: 2 });
  return s;
}
