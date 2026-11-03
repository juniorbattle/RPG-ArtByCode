// The end of the day (journal Passes SN7 / SN8): the low sun, a slow bossa in straight eighths: the nylon guitar comping on the clave, a rim and a shaker, a finger bass,
// and a tune of its own on a soft horn: eight bars in F, six that turn to its minor, four where the third hesitates, A flat then A. Nothing of the night's band (journal
// Passe SN8: its brushes, its fretless, its wind and its piano were the night's). The motif is only the vibraphone's, its head once in F, low under the held A flat.
// An original score, no work reproduced.
import { Session } from '../../../tools/audio/band/session.mjs';
import { rig, strings, vibes, nylon, finger, hornLine, loopOf } from './rig.mjs';

/** the tracks that carry the tune: the band's voicings make room for them */
export const tunes = ['horn', 'vibes'];
const A = ['Fmaj9', 'Fmaj7#11', 'Bbmaj9', 'Am9', 'Gm9', 'C13sus', 'Fmaj9', 'Dm9'], B = ['Dbmaj9', 'Cm9', 'Fm9', 'Dbmaj9', 'Gm9', 'C13sus'], END = ['Fm9', 'Dbmaj9', 'F6/9', 'C13sus'];
const BOSSA = { rim: 'x..x..x...x..x..', shaker: 'ogogogogogogogog', kick: 'o..g....o..g....' }, OPEN = { ...BOSSA, ride: 'x...x...x...x...', kick: 'x..g....x..g....' };
/** the clave's strokes: where the guitar's fingers fall, and how long they ring */
const STROKES = [[0, 2.6, 1], [3, 2.6, 0.84], [6, 3.6, 0.92], [10, 2.6, 0.84], [13, 2.6, 0.8]];
const BASS = '1--5----1--5----';

export default function score(o = {}) {
  const s = new Session({ id: 'fin', seed: 78, bpm: 78, swing: 0.5, bars: 22, tail: 6, ...o, ...loopOf(o, 2, 20) }), r = rig(s);
  const gtr = r.nylon({ gain: 0.5 }), low = r.slap({ gain: 0.42, room: 0.05 }), kit = r.kit({ gain: 0.78, room: 0.22, jitter: 0.006, lay: 0.004, vary: 0.12, fx: null }), horn = r.horns({ gain: 0.4, hall: 0.24, plate: 0.16, pan: 0.04 }, 'horn'), pad = r.pad({ gain: 0.18, hall: 0.3 }), vib = r.vib({ gain: 0.32 });

  const comp = (bar, sym, vel = 0.46) => { for (const [st, len, k] of STROKES) s.chord(gtr, nylon, bar, st, sym, len, { vel: vel * k, n: 4, lo: 52, hi: 72, strum: 0.012, rel: 0.12 }); };
  const under = (bar, sym, vel = 0.7) => s.bass(low, finger, bar, sym, BASS, { vel, art: 0.92 });
  const wash = (bar, sym, vel = 0.4) => s.pad(pad, strings, bar, 0, sym, 15, { vel, n: 4, lo: 57, hi: 79, attack: 1, release: 1.1 });
  const sing = (bar, text, vel) => hornLine(s, horn, bar, 0, text, { vel, soft: true, art: 0.98 });

  // ---- the rim and the shaker alone, then the guitar; the bass comes in with the tune
  s.drums(kit, 0, 2, { rim: 'x..x..x...x..x..', shaker: 'ogogogogogogogog' }, { vel: 0.8 }); comp(1, 'C13sus', 0.44);
  // ---- the tune on the soft horn, eight bars in F
  sing(2, '.:2 C5:2 F5:2 G5:2 A5:8 | G5:3 A5:3 E5:2 C5:8 | .:2 D5:2 F5:2 A5:2 C6:8 | A5:12 G5:4 | F5:4 G5:4 Bb5:8 | A5:3 G5:3 F5:2 D5:8 | .:4 C6:4 A5:4 F5:4 | G5:16', 0.72);
  A.forEach((c, i) => { comp(2 + i, c); under(2 + i, c); s.drums(kit, 2 + i, 1, i < 4 ? BOSSA : OPEN); if (i >= 4) wash(2 + i, c, 0.34); });
  // ---- six bars that turn to the minor: D flat, the A flat of the dusk, the strings under it
  sing(10, 'F5:4 Ab5:4 C6:8 | Bb5:4 G5:4 Eb5:8 | F5:4 G5:4 Ab5:4 C6:4 | Ab5:4 C6:4 Eb6:8 | D6:4 Bb5:4 G5:8 | A5:6 G5:2 Bb5:8', 0.76);
  B.forEach((c, i) => { comp(10 + i, c, 0.5); under(10 + i, c, 0.72); wash(10 + i, c, 0.44); s.drums(kit, 10 + i, 1, OPEN); });
  // ---- the third hesitates: A flat held over the motif's head, low on the vibraphone, then A
  sing(16, 'Ab5:16 | F5:4 Ab5:4 C6:8 | A5:16', 0.72); s.line(vib, vibes, 16, 0, 'F4:3 C5:3 C5:2 Eb5:3 C5:2 Bb4:3', { vel: 0.5, art: 1.3, rel: 0.4 }); s.line(vib, vibes, 19, 0, 'G5:4 A5:4 C6:8', { vel: 0.46, art: 1.4, rel: 0.4 });
  END.forEach((c, i) => { comp(16 + i, c, 0.44); under(16 + i, c, 0.64); wash(16 + i, c, 0.42); s.drums(kit, 16 + i, 1, BOSSA, { vel: 0.9 }); });
  // ---- the end: the guitar's last stroke, and the two thirds in a row on the horn
  if (!s.loop) { s.chord(gtr, nylon, 20, 0, 'Fmaj9', 20, { vel: 0.46, n: 4, lo: 52, hi: 72, strum: 0.04, rel: 0.6 }); s.bass(low, finger, 20, 'Fmaj9', '1---------------', { vel: 0.6, art: 1 }); sing(20, 'Ab5:4 A5:20', 0.62); s.drums(kit, 20, 1, { shaker: 'o...............', rim: 'x...............' }); }
  return s;
}
