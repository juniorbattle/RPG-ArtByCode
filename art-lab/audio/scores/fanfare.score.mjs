// The announcement's fanfare (journal Passe SN5, SA-7 « Fanfare et texte »): the motif's call on the brass, timpani and a snare roll under it, landing on the day's third.
import { Session } from '../../../tools/audio/band/session.mjs';
import { brass, bass, strings } from '../../../tools/audio/band/instruments.mjs';
import { chorus, compress } from '../../../tools/audio/band/dsp.mjs';
import { drum } from '../../../tools/audio/band/drums.mjs';

export const tunes = ['trumpets'];
const hits = (dur, o = {}) => (m, v, take) => brass(m, dur, v, { take, ...o });

export default function score(o = {}) {
  const s = new Session({ id: 'fanfare', seed: 9, bpm: 96, bars: 5, tail: 4, ...o });
  const top = s.track('trumpets', { gain: 0.36, plate: 0.24, hall: 0.1, jitter: 0.003, eq: [['hp', 240], ['peak', 3000, 1, 2]] }), horns = s.track('brass', { gain: 0.3, plate: 0.26, hall: 0.1, jitter: 0.005, eq: [['hp', 170]], fx: (L, R) => chorus(L, R, { rate: 0.9, depth: 0.0016, mix: 0.24 }) });
  const kit = s.track('kit', { gain: 0.8, room: 0.14, plate: 0.05, jitter: 0.003, eq: [['hp', 32]], fx: (L, R) => compress(L, R, { th: -13, ratio: 3, attack: 0.004, release: 0.1, makeup: 1 }) }), timp = s.track('timpani', { gain: 0.42, hall: 0.2, jitter: 0.004, eq: [['hp', 45]] });
  const low = s.track('bass', { gain: 0.46, eq: [['hp', 34], ['low', 130, 0.7, 3]] }), pad = s.track('strings', { gain: 0.3, hall: 0.3, eq: [['hp', 220]] });
  const call = (bar, text) => s.line(top, (m, v, take) => brass(m, 0.5, v, { take }), bar, 0, text, { vel: 0.92, art: 0.9 });
  call(0, 'D5:3 D5:3 D5:2'); s.line(top, (m, v, take) => brass(m, s.span(7.4), v, { take }), 0, 8, 'A5:8', { vel: 0.94, art: 0.92 });
  call(1, 'D5:3 D5:3 D5:2'); s.line(top, (m, v, take) => brass(m, s.span(7.4), v, { take }), 1, 8, 'E5:8', { vel: 0.96, art: 0.92 });
  s.line(top, (m, v, take) => brass(m, s.span(5.4), v, { take }), 2, 0, 'D6:6', { vel: 0.94 }); s.line(top, (m, v, take) => brass(m, s.span(1.8), v, { take }), 2, 6, 'C6:2', { vel: 0.88 }); s.line(top, (m, v, take) => brass(m, s.span(5.4), v, { take }), 2, 8, 'A5:6', { vel: 0.9 }); s.line(top, (m, v, take) => brass(m, s.span(1.8), v, { take }), 2, 14, 'G5:2', { vel: 0.88 });
  s.line(top, (m, v, take) => brass(m, s.span(22), v, { take }), 3, 0, 'D6:24', { vel: 1 });
  const stab = (bar, st, sym, len, vel = 0.84) => s.chord(horns, hits(s.span(len) * 0.92), bar, st, sym, len, { vel, lo: 55, hi: 79, n: 4 });
  for (const [b, c] of [[0, 'D13sus'], [1, 'E/D']]) { stab(b, 0, c, 2.6); stab(b, 3, c, 2.6); stab(b, 6, c, 1.7); stab(b, 8, c, 7.4, 0.8); }
  stab(2, 0, 'Bbmaj9', 7.4); stab(2, 8, 'C9', 7.4); stab(3, 0, 'D6/9', 22, 1); s.pad(pad, strings, 3, 0, 'D6/9', 22, { vel: 0.6, attack: 0.3, release: 1.2, n: 5 });
  s.bass(low, (m, v, _, take) => bass(m, v, 'finger', take), 0, 'D13sus', '1--1--1-1-------'); s.bass(low, (m, v, _, take) => bass(m, v, 'finger', take), 1, 'E/D', '1--1--1-1-------'); s.bass(low, (m, v, _, take) => bass(m, v, 'finger', take), 2, 'Bbmaj9', '1-------'); s.bass(low, (m, v, _, take) => bass(m, v, 'finger', take), 2, 'C9', '1-------', { from: 8 }); s.bass(low, (m, v, _, take) => bass(m, v, 'finger', take), 3, 'D6/9', '1---------------------');
  const roll = (bar, n, v0, v1) => { for (let i = 0; i < n; i++) { const [t, g] = kit.human(s.t(bar, i), v0 + (v1 - v0) * (i / n)); kit.sound(() => drum('snare', g, i), t, { g: g * 0.8 }); } };
  s.drums(kit, 0, 2, { kick: 'X..X..X.X.......', snare: 'X..X..X.X.......', crash: 'X...............' }); roll(2, 16, 0.3, 0.95); s.drums(kit, 3, 1, { crash: 'X...............', kick: 'X...............', snare: 'X...............' });
  for (const [b, st] of [[0, 0], [0, 8], [1, 0], [1, 8], [3, 0]]) timp.sound(() => drum('timp', 0.9, st), s.t(b, st), { g: 0.9 });
  return s;
}
