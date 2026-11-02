// « Le Rival », a named rival's bout (journal Passe SN7): the duel's world, faster, the motif upside down around D on 3 + 2 + 2: the hero's theme in a mirror; then the lead takes the
// true motif back over it. Three synchronous layers as the duel's (SA-5). D minor, the third F natural. An original score, no work reproduced.
import { Session } from '../../../tools/audio/band/session.mjs';
import { rig, organ, strings, slapped, thumb, hit, power, loopOf } from './rig.mjs';
import { drum } from '../../../tools/audio/band/drums.mjs';
import { mirror, riff } from './theme.mjs';

/** the tracks that carry the tune: the band's voicings make room for them */
export const tunes = ['lead'];
const R = ['Gm9', 'Am11', 'C6/9', 'Fmaj9'], TURN = ['Dm9', 'A7#9'];
const DRIVE = { ride: 'x.o.o.x.o.x.o.', kick: 'X.........X...', snare: '......X.....X.' }, BUILD = { hat: 'x.o.o.x.o.x.o.', kick: 'X.........X...', snare: '......X.....Xg' };
const FILL = { kick: 'X.........X...', snare: '......X...X.XX', tomH: '....x.........', tomM: '........x.....', crash: '..............' };
/** the true motif goes back to the duel's 2 + 2 + 3, and the band with it */
const HERO = { ride: 'x.o.x.o.x.o.o.', kick: 'X.......X.x...', snare: '....X.......X.' }, HEROFILL = { kick: 'X.......X.....', snare: '....X...X..gXX', tomH: '......x.......', tomM: '..........x...' };

export default function score(o = {}) {
  const s = new Session({ id: 'rival', seed: 164, bpm: 164, steps: 14, beat: 4, bars: 31, tail: 3.5, ...o, ...loopOf(o, 2, 30) }), r = rig(s);
  const kit = r.kit({ stem: 'base', gain: 0.72, room: 0.12, plate: 0.03 }), low = r.slap({ stem: 'base', gain: 0.45 }), gtrs = r.guitars({ stem: 'base' }), org = r.org({ stem: 'melody', gain: 0.3 }), lead = r.lead({ stem: 'melody', hall: 0, fx: null }, { porta: 0.02, vibDepth: 0.24, vibRate: 6 }), brass = r.horns({ stem: 'tension' }), pad = r.pad({ stem: 'tension', gain: 0.27, hall: 0.2, fx: null, eq: [['hp', 220]] }), timp = r.timp({ stem: 'tension' });
  const walk = (bar, text, kind = thumb, vel = 0.84) => s.line(low, kind, bar, 0, text, { vel, art: 0.88 });
  const boom = (b, v = 0.84) => { const [t, g] = timp.human(s.t(b, 0), v); timp.sound(() => drum('timp', g, b), t, { g }); };
  const comp = (bar, sym, first = 6) => { s.chord(org, organ, bar, first, sym, 3, { vel: 0.7, lo: 57, hi: 76, n: 4, strum: 0.002 }); s.chord(org, organ, bar, 10, sym, 3.4, { vel: 0.76, lo: 57, hi: 76, n: 4, strum: 0.002 }); };
  const stab = (bar, st, sym, len, vel = 0.86) => s.chord(brass, hit(s.span(len) * 0.9), bar, st, sym, len, { vel, n: 4, lo: 60, hi: 84 });
  const wash = (bar, sym, vel = 0.46) => s.pad(pad, strings, bar, 0, sym, 13.5, { vel, n: 4, lo: 62, hi: 84, attack: 0.15, release: 0.3 });
  /** the mirror: four bars of the riff and the two that turn it round */
  const six = (bar, { drums = BUILD, full = false } = {}) => {
    power(s, gtrs, bar, `${mirror(2)} | D3:6 D3:4 C3:4 | A2:6 A2:4 Bb2:4`); walk(bar, `${mirror(2)} | D3:6 D3:4 C3:4 | A2:6 A2:4 Bb2:4`);
    [...R, ...TURN].forEach((c, i) => { comp(bar + i, c); s.drums(kit, bar + i, 1, i === 5 ? FILL : drums); if (full) { stab(bar + i, 0, c, 3.2); stab(bar + i, 6, c, 3.2, 0.8); stab(bar + i, 10, c, 3.2, 0.84); wash(bar + i, c); } else { wash(bar + i, c, 0.3); if (i % 2 === 0) boom(bar + i); } });
  };

  // ---- two bars of the hat and the organ, then the mirror
  s.drums(kit, 0, 2, { hat: 'x.o.o.x.o.x.o.' }, { vel: 0.7 }); s.chord(org, organ, 0, 0, 'Dm9', 27, { vel: 0.5, lo: 57, hi: 74, n: 4 }); walk(0, 'D2:14 | D2:6 D2:4 C2:4', (m, v, take) => slapped(m, v, 'finger', take), 0.62);
  s.drums(kit, 2, 1, { crash: 'X.............' }); six(2);
  // ---- the mirror in the high lead
  s.drums(kit, 8, 1, { crash: 'X.............' }); six(8, { drums: DRIVE }); s.phrase(lead, 8, 0, mirror(5), { vel: 0.84, art: 0.94 });
  // ---- the rival sings the hero's theme: the true motif over it, on the same chords as the duel's riff
  const D = ['Dm9', 'C6/9', 'Am11', 'A7sus'];
  for (const b of [14, 18]) { power(s, gtrs, b, riff(2), { vel: 0.84 }); walk(b, riff(2)); D.forEach((c, i) => { comp(b + i, c, 4); s.drums(kit, b + i, 1, b === 18 && i === 3 ? HEROFILL : HERO); wash(b + i, c, 0.42); stab(b + i, 0, c, 3.2, 0.74); }); }
  s.drums(kit, 14, 1, { crash: 'X.............' }); s.phrase(lead, 14, 0, `${riff(5)} | D5:14~ | C6:4 D6:4 E6:6 | D6:8 C6:6 | A5:14~`, { vel: 0.88 });
  // ---- the mirror with everything on it, timpani on the bar
  s.drums(kit, 22, 1, { crash: 'X.............' }); six(22, { drums: DRIVE, full: true }); s.phrase(lead, 22, 0, mirror(5), { vel: 0.9, art: 0.94, transpose: 12 }); for (let b = 22; b < 27; b++) boom(b);
  s.drums(kit, 28, 1, { crash: 'X.............' }); ['Dm9', 'A7#9'].forEach((c, i) => { power(s, gtrs, 28 + i, `${i ? 'A1' : 'D2'}:6 ${i ? 'A1' : 'D2'}:4 ${i ? 'A1' : 'D2'}:4`, { vel: 0.92 }); stab(28 + i, 0, c, 3.2, 0.92); stab(28 + i, 6, c, 3.2, 0.92); stab(28 + i, 10, c, 3.6, 0.96); wash(28 + i, c, 0.56); s.bass(low, slapped, 28 + i, c, '1.....1...1.p.', { slap: true, vel: 0.9 }); s.drums(kit, 28 + i, 1, { ride: 'X.x.x.X.x.X.x.', kick: 'X.....X...X...', snare: '......X...X..X' }); });
  s.phrase(lead, 28, 0, 'D6:6! A5:4 D6:4 | C#6:6! E6:4 G6:4', { vel: 0.92 });
  if (!s.loop) { s.drums(kit, 30, 1, { crash: 'X.............', kick: 'X.............', snare: 'X.............', tomL: 'X.............' }); stab(30, 0, 'Dm9', 12, 1); power(s, gtrs, 30, 'D2:14', { vel: 1 }); s.bass(low, slapped, 30, 'Dm9', '1-------------', { slap: true, vel: 0.9 }); s.phrase(lead, 30, 0, 'D6:12~', { vel: 0.92 }); timp.sound(() => drum('timp', 1, 0), s.t(30, 0), { g: 1 }); }
  return s;
}
