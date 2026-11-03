// « La Finale », the last bout (journal Passe SN7): the orchestral rock of Final Fantasy VIII's great fights with the fusion's hits: the motif on the whole brass over D minor, a tone
// higher for the last push, then the fanfare in D major: the night's third gives way to the day's. Three synchronous layers (SA-5). An original score, no work reproduced.
import { Session } from '../../../tools/audio/band/session.mjs';
import { rig, organ, strings, slapped, thumb, hit, hornLine, power, loopOf } from './rig.mjs';
import { drum } from '../../../tools/audio/band/drums.mjs';
import { fusionHead } from './theme.mjs';

/** the tracks that carry the tune: the band's voicings make room for them */
export const tunes = ['lead', 'horn'];
const DRIVE = { ride: 'x.o.x.o.x.o.x.o.', kick: 'X..x..x....x.x..', snare: '....X.......X...' }, ROCK = { ride: 'X.x.X.x.X.x.X.x.', kick: 'X..x..x.X..x.x..', snare: '....X.......X..g' };
const FILL = { kick: 'X.....x.........', snare: '....X...X.gX.gXg', tomH: '.........x......', tomM: '............x...', tomL: '..............xx' }, HALF = { hat: 'x.o.x.o.x.o.x.o.', kick: 'X...............', snare: '........X.......' };

export default function score(o = {}) {
  const s = new Session({ id: 'finale', seed: 136, bpm: 136, swing: 0.5, bars: 29, tail: 4.5, ...o, ...loopOf(o, 4, 28) }), r = rig(s);
  const kit = r.kit({ stem: 'base', gain: 0.72, room: 0.14, plate: 0.04 }), low = r.slap({ stem: 'base' }), gtrs = r.guitars({ stem: 'base' }), org = r.org({ stem: 'melody' }), lead = r.lead({ stem: 'melody', plate: 0.24 }, { vibDepth: 0.24, vibRate: 5.8 }), horn = r.horns({ stem: 'melody', gain: 0.3, plate: 0.26 }, 'horn'), brass = r.horns({ stem: 'tension' }), pad = r.pad({ stem: 'tension', gain: 0.3, hall: 0.24, fx: null, eq: [['hp', 200]] }), timp = r.timp({ stem: 'tension', gain: 0.38 });
  const stab = (bar, st, sym, len, vel = 0.86, f = 0) => s.chord(brass, hit(s.span(len) * 0.9, { fall: f }), bar, st, sym, len, { vel, n: 4, lo: 60, hi: 84 });
  const wash = (bar, sym, vel = 0.5, len = 15) => s.pad(pad, strings, bar, 0, sym, len, { vel, n: 5, lo: 60, hi: 86, attack: 0.2, release: 0.4 });
  const boom = (bar, st = 0, v = 0.9) => { const [t, g] = timp.human(s.t(bar, st), v); timp.sound(() => drum('timp', g, bar + st), t, { g }); };
  const chugs = (bar, root, n = 1) => { for (let b = bar; b < bar + n; b++) power(s, gtrs, b, `${root}:3 ${root}:3 ${root}:2 ${root}:3 ${root}:2 ${root}:3`, { vel: 0.84, muted: true }); };
  const pedal = (bar, sym, row = '1..1..1.1..1p.1.', vel = 0.86) => s.bass(low, slapped, bar, sym, row, { slap: true, vel });
  const A = ['Dm9', 'Am11', 'Bbmaj9', 'A7#9'], T = (x) => x.replace(/^[A-G][b#]?/, (n) => ({ D: 'E', A: 'B', Bb: 'C', G: 'A', F: 'G', E: 'F#', C: 'D' })[n]);

  // ---- the gathering: timpani and strings on an open fifth, the guitars' first blows
  s.padNotes(pad, strings, 0, s.span(62), [50, 57, 62, 69, 74], { vel: 0.5, attack: 1.2, release: 0.3 }); for (const [b, st] of [[0, 0], [0, 8], [1, 0], [1, 8], [2, 0], [2, 6], [2, 12], [3, 0], [3, 4], [3, 8], [3, 12]]) boom(b, st, 0.7 + b * 0.09);
  s.drums(kit, 0, 2, { hat: '........x.......' }, { vel: 0.7 }); s.bass(low, (m, v, _, take) => slapped(m, v, 'finger', take), 0, 'Dm9', '1---------------', { vel: 0.7, art: 1 }); s.bass(low, (m, v, _, take) => slapped(m, v, 'finger', take), 1, 'Dm9', '1---------------', { vel: 0.74, art: 1 });
  chugs(2, 'D2', 2); s.bass(low, slapped, 2, 'Dm9', '1..1..1.1..1p.1.', { slap: true, vel: 0.8 }); s.bass(low, slapped, 3, 'Dm9', '1..1..1.1..1p.1.', { slap: true, vel: 0.82 }); s.drums(kit, 2, 1, HALF); s.drums(kit, 3, 1, FILL);
  // ---- the motif on the whole brass, the third F natural
  const chorus = (bar, list, roots, { up = 0, lead: withLead = false, next = list[0] } = {}) => {
    list.forEach((c, i) => { chugs(bar + i, roots[i]); pedal(bar + i, c); s.chord(org, organ, bar + i, 6, c, 2.2, { vel: 0.7, lo: 57, hi: 76, n: 4, strum: 0.002 }); s.chord(org, organ, bar + i, 14, i === 3 ? next : list[i + 1], 4, { vel: 0.74, lo: 57, hi: 76, n: 4, strum: 0.002 }); wash(bar + i, c); s.drums(kit, bar + i, 1, i === 3 ? FILL : withLead ? ROCK : DRIVE); if (up ? i === 1 : i !== 3) boom(bar + i); }); // the timpani is in D: it sits out what has no D
    hornLine(s, horn, bar, 0, `${fusionHead(4)} | D4:10`, { vel: 0.86, soft: false, transpose: up, art: 0.92 }); hornLine(s, horn, bar, 0, `${fusionHead(5)} | D5:10`, { vel: 0.8, soft: false, transpose: up, art: 0.92 });
    if (withLead) s.phrase(lead, bar, 0, `${fusionHead(5)} | D5:10^~ E5:2 F5:2 G5:2 | A5:6 C6:2 E6:8~`, { vel: 0.84, transpose: up });
    for (const [st, v] of [[6, 0.78], [8, 0.84], [11, 0.94]]) stab(bar + 3, st, list[3], st === 11 ? 4 : 1.4, v, st === 11 ? 1 : 0);
  };
  s.drums(kit, 4, 1, { crash: 'X...............' }); chorus(4, A, ['D2', 'A1', 'Bb1', 'A1']); s.drums(kit, 8, 1, { crash: 'X...............' }); chorus(8, A, ['D2', 'A1', 'Bb1', 'A1'], { lead: true, next: 'Bbmaj9' });
  // ---- the answer: long lines on the strings' rise
  const B = ['Bbmaj9', 'C13', 'Dm9', 'Ebmaj9#11'];
  s.phrase(lead, 12, 0, 'A5:3 C6:3 D6:2 E6:8^~ | E6:6 D6:2 C6:8 | A5:3 C6:3 D6:2 F6:8^~ | G6:6 F6:2 A6:8~', { vel: 0.86 });
  B.forEach((c, i) => { power(s, gtrs, 12 + i, `${['Bb1', 'C2', 'D2', 'Eb2'][i]}:16`, { vel: 0.74 }); pedal(12 + i, c, '1...1.1.1...p.1.', 0.82); s.chord(org, organ, 12 + i, 0, c, 15.4, { vel: 0.6, lo: 57, hi: 77, n: 4 }); wash(12 + i, c, 0.6); stab(12 + i, 0, c, 3, 0.8); stab(12 + i, 8, c, 3, 0.76); s.drums(kit, 12 + i, 1, i === 3 ? FILL : DRIVE); if (i !== 3) { boom(12 + i); boom(12 + i, 8, 0.7); } });
  // ---- the break: half time, the hit before the key goes up a tone
  s.drums(kit, 16, 1, { crash: 'X...............' }); s.drums(kit, 16, 3, HALF); s.drums(kit, 19, 1, { kick: 'X...X...X...X...', snare: 'X.gXX.gXX.gXXXXX', tomL: '............x.xx' });
  ['Dm9', 'Bbmaj9', 'Gm9', 'A7#9'].forEach((c, i) => { pedal(16 + i, c, '1-----------5-7-', 0.8); wash(16 + i, c, 0.64); s.chord(org, organ, 16 + i, 0, c, 15.4, { vel: 0.56, lo: 57, hi: 77, n: 4 }); if (i !== 3) boom(16 + i); });
  s.phrase(lead, 16, 0, 'D6:16^~ | F6:8 E6:8 | D6:4 F6:4 G6:8 | A6:8~ C#6:4 E6:4', { vel: 0.8 });
  // ---- a tone up, the last push
  s.drums(kit, 20, 1, { crash: 'X...............' }); chorus(20, A.map(T), ['E2', 'B1', 'C2', 'B1'], { up: 2, lead: true, next: 'D13sus' });
  // ---- the fanfare in D major: the day's third, at last
  s.drums(kit, 24, 1, { crash: 'X...............' }); s.phrase(lead, 24, 0, 'D6:3! D6:3! D6:2! A5:8^~ | D6:3! D6:3! D6:2! E6:8^~ | D6:6 C6:2 A5:6 G5:2 | F#6:16^~', { vel: 0.92 });
  for (const [b, c, root] of [[24, 'D13sus', 'D2'], [25, 'E/D', 'D2']]) { for (const [st, len] of [[0, 2.6], [3, 2.6], [6, 1.7], [8, 7]]) stab(b, st, c, len, st === 8 ? 0.82 : 0.92); power(s, gtrs, b, `${root}:3 ${root}:3 ${root}:2 ${root}:8`, { vel: 0.92 }); pedal(b, c, '1..1..1.1...p.1.', 0.9); wash(b, c, 0.66); s.drums(kit, b, 1, ROCK); boom(b); }
  stab(26, 0, 'Bbmaj9', 7, 0.9); stab(26, 8, 'C9', 7, 0.92); power(s, gtrs, 26, 'Bb1:8 C2:8', { vel: 0.92 }); s.bass(low, slapped, 26, 'Bbmaj9', '1..1p.1.', { slap: true, vel: 0.9 }); s.bass(low, slapped, 26, 'C9', '1..1p.1.', { slap: true, vel: 0.9, from: 8 }); wash(26, 'Bbmaj9', 0.66, 7.5); s.pad(pad, strings, 26, 8, 'C9', 7.5, { vel: 0.66, n: 5, lo: 60, hi: 86, attack: 0.2, release: 0.4 }); s.drums(kit, 26, 1, { kick: 'X.....x.X.....x.', snare: 'X..gX..gXgXgX.X.', tomH: '..x.....x.......', tomL: '......x....x....' }); boom(26); boom(26, 8);
  s.drums(kit, 27, 1, { crash: 'X...............', kick: 'X.......X.......', snare: 'X.......X.......' }); stab(27, 0, 'D6/9', s.loop ? 12 : 15, 1); power(s, gtrs, 27, 'D2:16', { vel: 0.96 }); pedal(27, 'D6/9', '1---------------', 0.9); wash(27, 'D6/9', 0.7, s.loop ? 11 : 15); boom(27); // going round, the day's F sharp must not ring into the night's F
  if (!s.loop) { s.drums(kit, 28, 1, { crash: 'X...............', kick: 'X...............', snare: 'X...............', tomL: 'X...............' }); stab(28, 0, 'D6/9', 12, 1); power(s, gtrs, 28, 'D2:14', { vel: 1 }); pedal(28, 'D6/9', '1---------------', 0.9); boom(28, 0, 1); s.phrase(lead, 28, 0, 'A6:12~', { vel: 0.92 }); }
  return s;
}
