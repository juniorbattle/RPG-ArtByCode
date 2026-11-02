// « Le Tournoi », the training ground (journal Passe SN7): work at the lists: a groove in 5/4, the motif in cells of five, a marimba and a slap bass going round like a drill.
// One eighth from the duel's 7/8 and the same family: fusion's odd meters. D mixolydian, the third held back. An original score, no work reproduced.
import { Session } from '../../../tools/audio/band/session.mjs';
import { rig, rhodes, marimba, slapped, hit, loopOf } from './rig.mjs';
import { cells, cellsTight } from './theme.mjs';

/** the tracks that carry the tune: the band's voicings make room for them */
export const tunes = ['lead'];
const A = ['D9sus', 'Am11', 'D9sus', 'C13sus'], B = ['G13sus', 'Am11', 'Bbmaj9', 'C9'];
const GROOVE = { hat: 'XoxoXoxoXoxoXoxoXoxo', kick: 'X.....x...X.....x...', snare: '....X.......X.....g.', conga: '..o.......o.......o.' }, OPEN = { ...GROOVE, hat: 'XoxoXoxoXoxoXoxoXo.o', open: '..................x.' };
const LIGHT = { hat: 'x.o.x.o.x.o.x.o.x.o.', rim: '....x.......x.......', kick: 'X.........X.........' }, FILL = { hat: 'XoxoXoxoXoxo........', kick: 'X.....x...X.........', snare: '....X.......X..gX.gX', tomH: '..............x.....', tomL: '..................xx' };
const LOOP = 'D5:2 A5:2 C6:2 A5:2 G5:2 A5:2 D5:2 A5:2 C6:2 E6:2', SLAP = ['1..xp.1.5.1.p..7.x5.', '1..xp.1.5.1.p.xb.5p.'];

export default function score(o = {}) {
  const s = new Session({ id: 'lices', seed: 132, bpm: 132, steps: 20, beat: 4, swing: 0.52, bars: 25, tail: 4, ...o, ...loopOf(o, 2, 24) }), r = rig(s);
  const kit = r.kit(), low = r.slap(), bars = r.bars({ gain: 0.38 }), keys = r.keys({ gain: 0.28 }), lead = r.lead(), brass = r.horns();
  const drill = (bar, v = 0.5, transpose = 0) => s.line(bars, marimba, bar, 0, LOOP, { vel: v, art: 1.1, rel: 0.1, transpose });
  const comp = (bar, sym) => { s.chord(keys, rhodes, bar, 6, sym, 3, { vel: 0.54, lo: 54, hi: 74 }); s.chord(keys, rhodes, bar, 12, sym, 3, { vel: 0.5, lo: 54, hi: 74 }); s.chord(keys, rhodes, bar, 17, sym, 3, { vel: 0.46, lo: 54, hi: 74 }); };
  const band = (bar, list, { row = 0, marim = true, drums = GROOVE, vel = 0.82 } = {}) => list.forEach((c, i) => { s.bass(low, slapped, bar + i, c, SLAP[(row + i) % 2], { slap: true, vel }); comp(bar + i, c); if (marim) drill(bar + i, 0.5, bar < 20 ? -12 : 0); s.drums(kit, bar + i, 1, i === list.length - 1 ? OPEN : drums); });
  const stab = (b, st, sym, len, v = 0.84, f = 0) => s.chord(brass, hit(s.span(len) * 0.92, { fall: f }), b, st, sym, len, { vel: v, n: 4, lo: 60, hi: 84 });

  // ---- the marimba alone, going round, then the bass
  drill(0, 0.46); drill(1, 0.48); s.drums(kit, 1, 1, LIGHT, { vel: 0.74 }); s.bass(low, slapped, 1, 'D9sus', SLAP[0], { slap: true, vel: 0.72 });
  drill(2); drill(3); s.bass(low, slapped, 2, 'D9sus', SLAP[0], { slap: true, vel: 0.76 }); s.bass(low, slapped, 3, 'Am11', SLAP[1], { slap: true, vel: 0.76 }); s.drums(kit, 2, 1, LIGHT); s.drums(kit, 3, 1, FILL);
  // ---- the motif in cells of five
  s.drums(kit, 4, 1, { crash: 'X...................' }); band(4, A); s.phrase(lead, 4, 0, cells(5), { vel: 0.78 });
  // ---- tighter, the brass answering in the gaps
  band(8, A, { row: 1 }); s.phrase(lead, 8, 0, cellsTight(5), { vel: 0.82 }); s.phrase(lead, 10, 0, 'D5:8^~ .:2 E5:2 G5:2 A5:2 C6:2 D6:2 | E6:4 D6:4 C6:4 A5:8~', { vel: 0.8 });
  for (const b of [9, 11]) for (const [st, len, v] of [[12, 1.7, 0.74], [14, 1.7, 0.78], [16, 3.6, 0.86]]) stab(b, st, b === 9 ? 'Am11' : 'C13sus', len, v);
  // ---- the answer, higher ground
  band(12, B, { marim: false }); s.phrase(lead, 12, 0, 'E6:6 D6:4 C6:6 A5:4 | G5:4 A5:4 C6:4 A5:4 G5:4 | Bb5:6 C6:4 D6:6 F6:4 | E6:8 D6:4 C6:4 A5:4', { vel: 0.84 }); B.forEach((c, i) => stab(12 + i, 0, c, 3.6, 0.76));
  // ---- the drill stripped: bass and hands; the keys take four bars alone, then the band climbs back
  s.drums(kit, 16, 3, LIGHT); s.drums(kit, 19, 1, FILL); A.forEach((c, i) => { s.bass(low, slapped, 16 + i, c, SLAP[i % 2], { slap: true, vel: 0.72 }); s.chord(keys, rhodes, 16 + i, 0, c, 4, { vel: 0.6, lo: 54, hi: 74 }); s.chord(keys, rhodes, 16 + i, 7, c, 3, { vel: 0.54, lo: 54, hi: 74 }); s.chord(keys, rhodes, 16 + i, 12, c, 5, { vel: 0.58, lo: 54, hi: 74 }); });
  s.line(bars, marimba, 16, 0, 'D6:2 C6:2 A5:2 G5:2 E5:2 D5:2 E5:2 G5:2 A5:2 C6:2 | D6:2 E6:2 G6:2 E6:2 D6:2 C6:2 A5:2 G5:2 A5:2 C6:2', { vel: 0.56, art: 1.1, rel: 0.1 });
  // ---- the whole drill, the motif tight and high
  s.drums(kit, 20, 1, { crash: 'X...................' }); band(20, A, { row: 1, vel: 0.86 }); s.phrase(lead, 20, 0, cellsTight(5), { vel: 0.86, transpose: 12 }); s.phrase(lead, 22, 0, 'D6:8^~ .:12 | E6:4 D6:4 C6:4 A5:8~', { vel: 0.84 }); for (const [st, len, v] of [[12, 1.7, 0.76], [14, 1.7, 0.8], [16, 3.6, 0.9]]) stab(22, st, 'D9sus', len, v);
  if (!s.loop) { s.drums(kit, 24, 1, { crash: 'X...................', kick: 'X...................', snare: 'X...................' }); s.bass(low, slapped, 24, 'D9sus', '1-------------------', { slap: true, vel: 0.86 }); stab(24, 0, 'D9sus', 12, 0.96); s.chord(keys, rhodes, 24, 0, 'D9sus', 14, { vel: 0.66, lo: 54, hi: 76 }); s.phrase(lead, 24, 0, 'D6:12~', { vel: 0.84 }); }
  return s;
}
