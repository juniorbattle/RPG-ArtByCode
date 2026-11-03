// The training ground (journal Passes SN7 / SN8): work at the lists: a groove in 5/4, a marimba and a slap bass going round like a drill, and over them a wind-synth tune
// of its own in phrases of three bars. One eighth from the duel's 7/8 and the same family: fusion's odd meters. A dorian, written in E and played a fifth down (journal Passe SN8). The motif is the drill: the marimba goes round
// its head, six notes, and four of its own, under the tune, never on top (journal Passe SN8: one piece, one tune). An original score, no work reproduced.
import { Session } from '../../../tools/audio/band/session.mjs';
import { rig, rhodes, marimba, slapped, hit, loopOf } from './rig.mjs';

/** the tracks that carry the tune: the band's voicings make room for them */
export const tunes = ['lead'];
/** the score is written in E and played in A: every note and chord moves by K */
const K = -7, TONE = { E: 'A', A: 'D', C: 'F', D: 'G', G: 'C', 'F#': 'B', B: 'E', 'C#': 'F#', Bb: 'Eb', Eb: 'Ab', F: 'Bb', Ab: 'Db' };
const k = (sym) => sym.replace(/^[A-G][#b]?/, (r) => TONE[r]).replace(/\/([A-G][#b]?)$/, (_, b) => `/${TONE[b]}`);
const A = ['Em11', 'A13', 'Cmaj9', 'Em11', 'A13', 'D6/9'], B = ['Gmaj9', 'F#m11', 'B7sus'], BARE = ['Em11', 'A13', 'Cmaj9', 'B7sus'];
const GROOVE = { hat: 'XoxoXoxoXoxoXoxoXoxo', kick: 'X.....x...X.....x...', snare: '....X.......X.....g.', conga: '..o.......o.......o.' }, OPEN = { ...GROOVE, hat: 'XoxoXoxoXoxoXoxoXo.o', open: '..................x.' };
const LIGHT = { hat: 'x.o.x.o.x.o.x.o.x.o.', rim: '....x.......x.......', kick: 'X.........X.........' }, FILL = { hat: 'XoxoXoxoXoxo........', kick: 'X.....x...X.........', snare: '....X.......X..gX.gX', tomH: '..............x.....', tomL: '..................xx' };
const DRILL = 'E5:2 B5:2 B5:2 D6:2 B5:2 A5:2 G5:2 A5:2 B5:2 A5:2', DRILL_A13 = 'E5:2 B5:2 B5:2 C#6:2 B5:2 A5:2 G5:2 A5:2 B5:2 A5:2', SLAP = ['1..xp.1.5.1.p..7.x5.', '1..xp.1.5.1.p.xb.5p.'];
const TUNE = 'B5:4 D6:2 E6:4 G6:2 F#6:4 D6:4 | E6:6 C#6:2 B5:4 A5:8 | G5:4 B5:4 E6:12~ | B5:4 D6:2 E6:4 G6:2 A6:4 G6:4 | F#6:6 E6:2 C#6:4 A5:8 | B5:4 A5:4 F#5:12';
const TIGHT = 'B5:3 D6:3 E6:2 G6:4 F#6:2 D6:2 .:4 | E6:4 C#6:4 B5:2 A5:6 .:4 | G5:2 A5:2 B5:2 D6:2 E6:12~ | B5:3 D6:3 E6:2 G6:4 A6:4 B6:4 | A6:6 F#6:2 E6:4 C#6:8 | D6:4 B5:4 A5:12';

export default function score(o = {}) {
  const s = new Session({ id: 'lices', seed: 132, bpm: 132, steps: 20, beat: 4, swing: 0.52, bars: 29, tail: 4, ...o, ...loopOf(o, 2, 27) }), r = rig(s);
  const kit = r.kit(), low = r.slap(), bars = r.bars({ gain: 0.38 }), keys = r.keys({ gain: 0.28 }), lead = r.lead(), brass = r.horns();
  /** the drill, an octave under the tune and over the keys; over A13 its D turns to the chord's C sharp (journal Passe SN8) */
  const drill = (bar, v = 0.5, sym = 'Em11') => s.line(bars, marimba, bar, 0, sym === 'A13' ? DRILL_A13 : DRILL, { vel: v, art: 1.1, rel: 0.1, transpose: K });
  const comp = (bar, sym) => { s.chord(keys, rhodes, bar, 6, k(sym), 3, { vel: 0.54, lo: 54, hi: 74 }); s.chord(keys, rhodes, bar, 12, k(sym), 3, { vel: 0.5, lo: 54, hi: 74 }); s.chord(keys, rhodes, bar, 17, k(sym), 3, { vel: 0.46, lo: 54, hi: 74 }); };
  const band = (bar, list, { row = 0, marim = true, drums = GROOVE, vel = 0.82 } = {}) => list.forEach((c, i) => { s.bass(low, slapped, bar + i, k(c), SLAP[(row + i) % 2], { slap: true, vel }); comp(bar + i, c); if (marim) drill(bar + i, 0.48, c); s.drums(kit, bar + i, 1, i === list.length - 1 ? OPEN : drums); });
  const stab = (b, st, sym, len, v = 0.84, f = 0) => s.chord(brass, hit(s.span(len) * 0.92, { fall: f }), b, st, k(sym), len, { vel: v, n: 4, lo: 60, hi: 79 });

  // ---- the drill and the drums together, the bass in on the third beat of the second bar
  drill(0, 0.46); drill(1, 0.48); s.drums(kit, 0, 2, LIGHT, { vel: 0.74 }); s.bass(low, slapped, 1, k('Em11'), '1.p.5.1.p..7', { slap: true, vel: 0.72, from: 8 });
  // ---- the tune, two phrases of three bars, the drill under it
  s.drums(kit, 2, 1, { crash: 'X...................' }); band(2, A); s.phrase(lead, 2, 0, TUNE, { vel: 0.8, transpose: K + 12 });
  // ---- again, tighter, the brass in its rests
  band(8, A, { row: 1 }); s.phrase(lead, 8, 0, TIGHT, { vel: 0.82, transpose: K + 12 });
  for (const b of [8, 9]) for (const [st, len, v] of [[16, 1.7, 0.76], [18, 1.7, 0.82]]) stab(b, st, A[b - 8], len, v); for (const [st, len, v] of [[12, 1.7, 0.74], [14, 1.7, 0.78], [16, 3.6, 0.86]]) stab(13, st, 'D6/9', len, v);
  // ---- three bars of higher ground, the drill resting
  band(14, B, { marim: false }); s.phrase(lead, 14, 0, 'D6:6 B5:2 A5:4 F#5:4 A5:4 | B5:12 A5:4 F#5:4 | E5:8 F#5:4 A5:4 B5:4', { vel: 0.84, transpose: K + 12 }); B.forEach((c, i) => stab(14 + i, 0, c, 3.6, 0.76));
  // ---- the drill bare: bass, hands and keys, the marimba on its own, then a run to bring the band back
  s.drums(kit, 17, 3, LIGHT); s.drums(kit, 20, 1, FILL); BARE.forEach((c, i) => { s.bass(low, slapped, 17 + i, k(c), SLAP[i % 2], { slap: true, vel: 0.72 }); s.chord(keys, rhodes, 17 + i, 0, k(c), 4, { vel: 0.6, lo: 54, hi: 74 }); s.chord(keys, rhodes, 17 + i, 7, k(c), 3, { vel: 0.54, lo: 54, hi: 74 }); s.chord(keys, rhodes, 17 + i, 12, k(c), 5, { vel: 0.58, lo: 54, hi: 74 }); });
  drill(17, 0.56); drill(18, 0.56, 'A13'); s.line(bars, marimba, 19, 0, 'E6:2 D6:2 B5:2 A5:2 G5:2 E5:2 G5:2 A5:2 B5:2 D6:2 | E6:2 F#6:2 A6:2 F#6:2 E6:2 C#6:2 B5:2 A5:2 F#5:2 A5:2', { vel: 0.56, art: 1.1, rel: 0.1, transpose: K });
  // ---- the whole drill, the tune tight and high, the brass on its last bar
  s.drums(kit, 21, 1, { crash: 'X...................' }); band(21, A, { row: 1, vel: 0.86 }); s.phrase(lead, 21, 0, TIGHT, { vel: 0.86, transpose: K + 12 }); for (const [st, len, v] of [[12, 1.7, 0.76], [14, 1.7, 0.8], [16, 3.6, 0.9]]) stab(26, st, 'D6/9', len, v);
  // ---- the end: the drill alone a last time, and the band's one blow on its downbeat
  if (!s.loop) { drill(27, 0.52); s.drums(kit, 27, 1, { rim: 'x.........x.........' }); s.drums(kit, 28, 1, { kick: 'X...................', snare: 'X...................' }); s.bass(low, slapped, 28, k('Em11'), '1---', { slap: true, vel: 0.86 }); stab(28, 0, 'Em11', 3, 0.94); s.line(bars, marimba, 28, 0, 'E5:4', { vel: 0.6, transpose: K }); }
  return s;
}
