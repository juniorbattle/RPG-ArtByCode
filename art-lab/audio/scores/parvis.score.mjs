// « Le Tournoi », the forecourt (journal Passe SN7): a crowd gathering before the arena's gate, in the urban manner of Breath of Fire III: toms and stamps on the motif's own rhythm,
// a slap bass on one chord, the motif in fragments on the brass before the wind synth takes it whole. D mixolydian, the third held until the last chord. An original score.
import { Session } from '../../../tools/audio/band/session.mjs';
import { rig, rhodes, slapped, hit, hornLine, loopOf } from './rig.mjs';
import { fusionHead } from './theme.mjs';

/** the tracks that carry the tune: the band's voicings make room for them */
export const tunes = ['lead', 'horn'];
const STAMP = { tomL: 'X..x..x.X..x.x..', shaker: 'x.o.x.o.x.o.x.o.' };
const WALK = { kick: 'X..x..x.X..x.x..', snare: '....X.......X...', slap: '....x.......x...', hat: 'x.o.x.o.x.o.x.o.' }, DRIVE = { ...WALK, hat: 'XoxoXoxoXoxoXo.o', open: '..............x.', snare: '....X..g....X.g.' };
const FILL = { hat: 'XoxoXoxo........', kick: 'X..x..x.........', snare: '....X...X.gX.gXg', tomH: '.........x......', tomL: '..............xx' };
const BASS = '1..1..1.1..x1.7.', BASS2 = '1..1..p.1..xp.75', VAMP = ['D13sus', 'C/D'];

export default function score(o = {}) {
  const s = new Session({ id: 'parvis', seed: 96, bpm: 96, swing: 0.53, bars: 25, tail: 4, ...o, ...loopOf(o, 4, 24) }), r = rig(s);
  const kit = r.kit(), low = r.slap(), keys = r.keys(), lead = r.lead(), horn = r.horns({ gain: 0.36 }, 'horn'), brass = r.horns();
  const groove = (bar, row = BASS, drums = WALK, n = 2) => { for (let b = bar; b < bar + n; b++) { const c = VAMP[(b - bar) % 2]; s.bass(low, slapped, b, c, row, { slap: true, vel: 0.8 }); s.chord(keys, rhodes, b, 6, c, 2.4, { vel: 0.56, lo: 54, hi: 74 }); s.chord(keys, rhodes, b, 11, c, 2.4, { vel: 0.5, lo: 54, hi: 74 }); s.chord(keys, rhodes, b, 14, VAMP[(b - bar + 1) % 2], 5, { vel: 0.6, lo: 54, hi: 74 }); } s.drums(kit, bar, n, drums); };
  const stab = (b, st, sym, len, v = 0.86, f = 0) => s.chord(brass, hit(s.span(len) * 0.92, { fall: f }), b, st, sym, len, { vel: v, n: 4, lo: 60, hi: 84 });

  // ---- the stamps, then the bass on the same rhythm
  s.drums(kit, 0, 2, STAMP, { vel: 0.74 }); s.drums(kit, 2, 2, STAMP, { vel: 0.9 }); s.bass(low, slapped, 2, 'D13sus', BASS, { slap: true, vel: 0.74 }); s.bass(low, slapped, 3, 'C/D', BASS, { slap: true, vel: 0.78 });
  // ---- the groove, the motif's head called on the brass
  groove(4); groove(6); s.drums(kit, 7, 1, { crash: '................' });
  hornLine(s, horn, 5, 8, 'D4:3 A4:3 A4:2', { vel: 0.8, soft: false }); hornLine(s, horn, 6, 0, 'C5:3 A4:3 G4:2', { vel: 0.82, soft: false }); hornLine(s, horn, 7, 8, 'A4:3 D5:3 C5:2', { vel: 0.84, soft: false });
  // ---- the wind synth takes the motif whole
  s.drums(kit, 8, 1, { crash: 'X...............' }); groove(8, BASS2, DRIVE); groove(10, BASS2, DRIVE, 1); s.bass(low, slapped, 11, 'C/D', BASS2, { slap: true, vel: 0.84 }); s.chord(keys, rhodes, 11, 6, 'C/D', 2.4, { vel: 0.56, lo: 54, hi: 74 }); s.drums(kit, 11, 1, FILL);
  s.phrase(lead, 8, 0, `${fusionHead(5)} | D5:10^~ E5:2 G5:2 A5:2 | C6:6 A5:2 G5:8~`, { vel: 0.82 });
  for (const [st, v] of [[6, 0.74], [8, 0.8], [11, 0.92]]) stab(11, st, 'C/D', st === 11 ? 4 : 1.4, v, st === 11 ? 1 : 0);
  // ---- again, the brass under it in fourths
  groove(12, BASS2, DRIVE); groove(14, BASS2, DRIVE, 1); s.bass(low, slapped, 15, 'C/D', BASS2, { slap: true, vel: 0.86 }); s.chord(keys, rhodes, 15, 0, 'C/D', 7, { vel: 0.56, lo: 54, hi: 74 }); s.drums(kit, 15, 1, FILL);
  s.phrase(lead, 12, 0, `${fusionHead(5)} | D5:12^~ .:4`, { vel: 0.84 }); hornLine(s, horn, 12, 0, fusionHead(4), { vel: 0.7, soft: false, transpose: 7, art: 0.86 });
  // ---- the rise: a tone at a time, up to the fanfare
  const UP = ['G6/9', 'A9', 'Bbmaj9', 'C13'];
  s.phrase(lead, 16, 0, 'B5:3 D6:3 E6:2 G6:4 E6:4 | C#6:3 E6:3 G6:2 A6:8^~ | D6:3 F6:3 G6:2 A6:4 F6:4 | E6:3 G6:3 A6:2 Bb6:4 C7:4', { vel: 0.86 });
  UP.forEach((c, i) => { const b = 16 + i; s.bass(low, slapped, b, c, BASS2, { slap: true, vel: 0.84 }); s.chord(keys, rhodes, b, 0, c, 5, { vel: 0.6, lo: 54, hi: 74 }); s.chord(keys, rhodes, b, 6, c, 2.4, { vel: 0.52, lo: 54, hi: 74 }); s.chord(keys, rhodes, b, 11, c, 4, { vel: 0.56, lo: 54, hi: 74 }); stab(b, 0, c, 2.6, 0.72 + 0.06 * i); stab(b, 3, c, 2.6, 0.72 + 0.06 * i); });
  s.drums(kit, 16, 3, DRIVE); s.drums(kit, 19, 1, { kick: 'X..x..x.X..x.x..', snare: 'X..X..X.X..X.X..', tomL: '............xxxx' });
  // ---- the fanfare, the crowd on the motif's rhythm
  s.drums(kit, 20, 1, { crash: 'X...............' }); s.phrase(lead, 20, 0, 'D6:3! D6:3! D6:2! A5:8^~ | D6:3! D6:3! D6:2! E6:8^~ | D6:6 C6:2 A5:6 G5:2 | D6:12~ .:4', { vel: 0.9 });
  for (const [b, c] of [[20, 'D13sus'], [21, 'E/D']]) { stab(b, 0, c, 2.6); stab(b, 3, c, 2.6); stab(b, 6, c, 1.7); stab(b, 8, c, 7, 0.78); s.chord(keys, rhodes, b, 0, c, 14, { vel: 0.64, lo: 54, hi: 74 }); s.bass(low, slapped, b, c, '1..1..1.1.xp.7x5', { slap: true, vel: 0.88 }); s.drums(kit, b, 1, { bell: 'X.x.X.x.X.x.X.x.', kick: 'X..X..X.X..X.X..', snare: '....X.......X..g', slap: '....x.......x...' }); }
  stab(22, 0, 'Bbmaj9', 7, 0.84); stab(22, 8, 'C9', 7, 0.86); s.chord(keys, rhodes, 22, 0, 'Bbmaj9', 8, { vel: 0.64, lo: 54, hi: 74 }); s.chord(keys, rhodes, 22, 8, 'C9', 8, { vel: 0.64, lo: 54, hi: 74 }); s.bass(low, slapped, 22, 'Bbmaj9', '1..xp.1.', { slap: true, vel: 0.88 }); s.bass(low, slapped, 22, 'C9', '1..xp.1x', { slap: true, vel: 0.88, from: 8 }); s.drums(kit, 22, 1, { kick: 'X.....x.X.....x.', snare: 'X..gX..gXgXgX.X.', tomH: '..x.....x.......', tomL: '......x....x....' });
  s.drums(kit, 23, 1, { crash: 'X...............', kick: 'X..x..x.X.......', snare: 'X...X...X.......' }); stab(23, 0, 'D6/9', 11, 0.96); s.chord(keys, rhodes, 23, 0, 'D6/9', 12, { vel: 0.68, lo: 54, hi: 76 }); s.bass(low, slapped, 23, 'D6/9', '1---------..p7p5', { slap: true, vel: 0.86 });
  if (!s.loop) { s.drums(kit, 24, 1, { crash: 'X...............', kick: 'X...............', snare: 'X...............' }); stab(24, 0, 'D6/9', 12, 1); s.chord(keys, rhodes, 24, 0, 'D6/9', 14, { vel: 0.74, lo: 54, hi: 76 }); s.bass(low, slapped, 24, 'D6/9', '1---------------', { slap: true, vel: 0.88 }); s.phrase(lead, 24, 0, 'F#6:12^~', { vel: 0.88 }); }
  return s;
}
