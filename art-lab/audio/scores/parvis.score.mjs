// The forecourt (journal Passes SN7 / SN8): a crowd gathering before the arena's gate, in the urban manner of Breath of Fire III: toms and stamps, a slap bass on one
// chord, a brass riff and a wind-synth tune of their own that the band piles up layer by layer. C mixolydian, A flat and B flat in the rise. The motif is an inner voice
// of the electric piano under the tune, its head once, and the stamps keep its rhythm; the fanfare is left to the tournament (journal Passe SN8: one piece, one tune). An original score, no work reproduced.
import { Session } from '../../../tools/audio/band/session.mjs';
import { rig, rhodes, slapped, hit, hornLine, loopOf } from './rig.mjs';

/** the tracks that carry the tune: the band's voicings make room for them */
export const tunes = ['lead', 'horn'];
const STAMP = { tomL: 'X..x..x.X..x.x..', shaker: 'x.o.x.o.x.o.x.o.' };
const WALK = { kick: 'X..x..x.X..x.x..', snare: '....X.......X...', slap: '....x.......x...', hat: 'x.o.x.o.x.o.x.o.' }, DRIVE = { ...WALK, hat: 'XoxoXoxoXoxoXo.o', open: '..............x.', snare: '....X..g....X.g.' };
const FILL = { hat: 'XoxoXoxoXoxo....', kick: 'X..x..x.X...X...', snare: '....X.......X.XX', tomL: '..........x.x...', slap: '............x.x.' };
const BASS = '1..1..1.1..x1.7.', BASS2 = '1..1..p.1..xp.75', VAMP = ['C13sus', 'Bb/C'];
const RIFF = 'G4:2 Bb4:2 C5:3 G4:3 .:2 F4:2 G4:2 | Bb4:3 C5:3 D5:2 C5:4 .:4';

export default function score(o = {}) {
  const s = new Session({ id: 'parvis', seed: 96, bpm: 96, swing: 0.53, bars: 27, tail: 4, ...o, ...loopOf(o, 4, 24) }), r = rig(s);
  const kit = r.kit(), low = r.slap(), keys = r.keys(), lead = r.lead(), horn = r.horns({ gain: 0.36 }, 'horn'), brass = r.horns(), inner = s.track('rhodes voice', { pan: 0.18, gain: 0.24, plate: 0.13, room: 0.08, jitter: 0.004, eq: [['hp', 150]] });
  const groove = (bar, row = BASS, drums = WALK, n = 2) => { for (let b = bar; b < bar + n; b++) { const c = VAMP[(b - bar) % 2]; s.bass(low, slapped, b, c, row, { slap: true, vel: 0.8 }); s.chord(keys, rhodes, b, 6, c, 2.4, { vel: 0.56, lo: 54, hi: 74 }); s.chord(keys, rhodes, b, 11, c, 2.4, { vel: 0.5, lo: 54, hi: 74 }); s.chord(keys, rhodes, b, 14, VAMP[(b - bar + 1) % 2], 5, { vel: 0.6, lo: 54, hi: 74 }); } s.drums(kit, bar, n, drums); };
  const stab = (b, st, sym, len, v = 0.86, f = 0) => s.chord(brass, hit(s.span(len) * 0.92, { fall: f }), b, st, sym, len, { vel: v, n: 4, lo: 60, hi: 84 });

  // ---- the stamps, then the bass on the same rhythm
  s.drums(kit, 0, 2, STAMP, { vel: 0.74 }); s.drums(kit, 2, 2, STAMP, { vel: 0.9 }); s.bass(low, slapped, 2, 'C13sus', BASS, { slap: true, vel: 0.74 }); s.bass(low, slapped, 3, 'Bb/C', BASS, { slap: true, vel: 0.78 });
  // ---- the groove, and the brass riff, twice
  groove(4); groove(6); hornLine(s, horn, 4, 0, RIFF, { vel: 0.8, soft: false, art: 0.9 }); hornLine(s, horn, 6, 0, RIFF, { vel: 0.84, soft: false, art: 0.9 });
  // ---- the wind synth's tune, the brass hitting in its rests
  s.drums(kit, 8, 1, { crash: 'X...............' }); groove(8, BASS2, DRIVE); groove(10, BASS2, DRIVE, 1); s.bass(low, slapped, 11, 'Bb/C', BASS2, { slap: true, vel: 0.84 }); s.chord(keys, rhodes, 11, 6, 'Bb/C', 2.4, { vel: 0.56, lo: 54, hi: 74 }); s.drums(kit, 11, 1, FILL);
  s.phrase(lead, 8, 0, 'F6:2 F6:2 D6:3 C6:3 Bb5:2 C6:4 | G5:8~ .:2 Bb5:2 C6:2 D6:2 | F6:2 F6:2 G6:3 F6:3 D6:2 C6:4 | Bb5:12~ .:4', { vel: 0.82 });
  for (const [b, c, sts] of [[9, 'Bb/C', [8, 10]], [11, 'Bb/C', [12, 14]]]) for (const st of sts) stab(b, st, c, 1.4, 0.8);
  // ---- again, higher, the riff under it
  groove(12, BASS2, DRIVE); groove(14, BASS2, DRIVE, 1); s.bass(low, slapped, 15, 'Bb/C', BASS2, { slap: true, vel: 0.86 }); s.chord(keys, rhodes, 15, 0, 'Bb/C', 7, { vel: 0.56, lo: 54, hi: 74 }); s.drums(kit, 15, 1, FILL);
  s.phrase(lead, 12, 0, 'F6:2 F6:2 D6:3 C6:3 Bb5:2 G5:4 | D6:6 C6:2 Bb5:8~ | F6:2 G6:2 Bb6:4 G6:3 F6:3 D6:2 | C6:16~', { vel: 0.84 }); hornLine(s, horn, 12, 0, RIFF, { vel: 0.72, soft: false, art: 0.9 });
  s.line(inner, rhodes, 14, 0, 'C5:4 G5:2 G5:2 Bb5:4 G5:2 F5:2 | G5:8', { vel: 0.42, art: 1, rel: 0.2 }); // the motif's head, an inner voice under the tune (journal Passe SN8)
  // ---- the rise: A flat and B flat under the brass's own shout; the wind synth answers above
  const UP = ['Abmaj9', 'Bb13sus', 'Abmaj9', 'Bb13'];
  hornLine(s, horn, 16, 0, 'Eb5:2 F5:2 G5:2 .:2 Bb5:3 Ab5:3 G5:2 | Eb5:4 F5:4 G5:8', { vel: 0.9, soft: false, art: 0.9 }); hornLine(s, horn, 16, 0, 'Eb4:2 F4:2 G4:2 .:2 Bb4:3 Ab4:3 G4:2 | Eb4:4 F4:4 G4:8', { vel: 0.8, soft: false, art: 0.9 });
  s.phrase(lead, 18, 0, 'Eb6:3 G6:3 Bb6:2 Ab6:8 | C7:3 Bb6:3 F6:2 G6:8', { vel: 0.86 });
  UP.forEach((c, i) => { const b = 16 + i; s.bass(low, slapped, b, c, BASS2, { slap: true, vel: 0.84 }); s.chord(keys, rhodes, b, 0, c, 5, { vel: 0.6, lo: 54, hi: 74 }); s.chord(keys, rhodes, b, 6, c, 2.4, { vel: 0.52, lo: 54, hi: 74 }); s.chord(keys, rhodes, b, 11, c, 4, { vel: 0.56, lo: 54, hi: 74 }); if (i >= 2) { stab(b, 0, c, 2.6, 0.78 + 0.06 * i); stab(b, 3, c, 2.6, 0.78 + 0.06 * i); } });
  s.drums(kit, 16, 3, DRIVE); s.drums(kit, 19, 1, { kick: 'X..x..x.X..x.x..', snare: 'X..X..X.X..X.X..', tomL: '............xxxx' });
  // ---- the whole crowd: the riff in octaves, the wind synth on it, then its own cry
  s.drums(kit, 20, 1, { crash: 'X...............' }); groove(20, BASS2, DRIVE); groove(22, BASS2, DRIVE, 1); s.bass(low, slapped, 23, 'Bb/C', '1..1..p.1.......', { slap: true, vel: 0.88 }); s.drums(kit, 23, 1, { ...FILL, crash: '........X.......' });
  hornLine(s, horn, 20, 0, RIFF, { vel: 0.9, soft: false, art: 0.9 }); hornLine(s, horn, 20, 0, RIFF, { vel: 0.8, soft: false, art: 0.9, transpose: -12 }); s.phrase(lead, 20, 0, 'G5:2 Bb5:2 C6:3 G5:3 .:2 F5:2 G5:2 | Bb5:3 C6:3 D6:2 C6:4 .:4 | C6:3 D6:3 F6:2 G6:4 Bb6:4 | C7:8~ .:8', { vel: 0.88 });
  for (const st of [8, 10, 12]) stab(23, st, 'Bb/C', 1.6, 0.9);
  // ---- the end: the crowd's stamps alone again, the bass with them, one last stamp
  if (!s.loop) { s.drums(kit, 24, 2, STAMP, { vel: 0.9 }); s.bass(low, slapped, 24, 'C13sus', BASS, { slap: true, vel: 0.78 }); s.bass(low, slapped, 25, 'Bb/C', BASS, { slap: true, vel: 0.76 }); s.drums(kit, 26, 1, { tomL: 'X...............', kick: 'X...............', slap: 'X...............' }); s.bass(low, slapped, 26, 'C13sus', '1---', { slap: true, vel: 0.88 }); }
  return s;
}
