// The victory's jingle (journal Passe SN7): the motif's call, the landing of the fanfare, the day's third on top. An original score.
import { Session } from '../../../tools/audio/band/session.mjs';
import { rig, rhodes, strings, slapped, hit, hornLine } from './rig.mjs';

export const tunes = ['horn'];

export default function score(o = {}) {
  const s = new Session({ id: 'victoire', seed: 11, bpm: 118, bars: 3, tail: 3.5, ...o }), r = rig(s);
  const horn = r.horns({ gain: 0.34, plate: 0.26, hall: 0.1 }, 'horn'), brass = r.horns({ gain: 0.26 }), keys = r.keys(), kit = r.kit(), low = r.slap(), pad = r.pad({ gain: 0.26 });
  const stab = (b, st, sym, len, v = 0.88) => s.chord(brass, hit(s.span(len) * 0.92), b, st, sym, len, { vel: v, n: 4, lo: 55, hi: 79 });
  hornLine(s, horn, 0, 0, 'D5:3 D5:3 D5:2 A5:8 | D6:6 C6:2', { vel: 0.92, soft: false, art: 0.9 }); hornLine(s, horn, 1, 8, 'E6:8', { vel: 0.94, soft: false }); hornLine(s, horn, 2, 0, 'F#6:14', { vel: 1, soft: false });
  stab(0, 0, 'D13sus', 2.6); stab(0, 3, 'D13sus', 2.6); stab(0, 6, 'D13sus', 1.7); stab(0, 8, 'D13sus', 7, 0.82); stab(1, 0, 'Bbmaj9', 7, 0.86); stab(1, 8, 'C9', 7, 0.9); stab(2, 0, 'D6/9', 14, 1);
  s.chord(keys, rhodes, 2, 0, 'D6/9', 15, { vel: 0.7, lo: 54, hi: 76, strum: 0.02 }); s.pad(pad, strings, 2, 0, 'D6/9', 14, { vel: 0.56, attack: 0.15, release: 1 });
  s.bass(low, slapped, 0, 'D13sus', '1..1..1.1.......', { slap: true }); s.bass(low, slapped, 1, 'Bbmaj9', '1.......', { slap: true }); s.bass(low, slapped, 1, 'C9', '1.......', { slap: true, from: 8 }); s.bass(low, slapped, 2, 'D6/9', '1---------------', { slap: true });
  s.drums(kit, 0, 1, { kick: 'X..X..X.X.......', snare: 'X..X..X.X.......', crash: 'X...............' }); s.drums(kit, 1, 1, { kick: 'X.......X.......', snare: '....X...X.gXgXgX', tomL: '..............xx' }); s.drums(kit, 2, 1, { crash: 'X...............', kick: 'X...............', snare: 'X...............' });
  return s;
}
