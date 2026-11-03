// « Le Rival », a named rival's bout (journal Passes SN7 / SN8): the duel's world, faster and in another key, F sharp minor: the guitars and the bass go round the motif
// upside down on 3 + 2 + 2, the hero's theme in a mirror, and the lead has a line of its own over it. Once, for four bars, the band bends to the hero's riff on 2 + 2 + 3,
// the lead silent. Three synchronous layers as the duel's (SA-5). It opens on the toms and the organ, no gathering, and stops dead on the riff's second group. An original score, no work reproduced.
import { Session } from '../../../tools/audio/band/session.mjs';
import { rig, organ, strings, slapped, thumb, hit, power, loopOf } from './rig.mjs';
import { drum } from '../../../tools/audio/band/drums.mjs';
import { mirror, riff } from './theme.mjs';

/** the tracks that carry the tune: the band's voicings make room for them */
export const tunes = ['lead'];
const UP = 4, R = ['F#m11', 'C#m11', 'E6/9', 'Amaj9'], TURN = ['F#m9', 'C#7#9'], HEROC = ['F#m9', 'E6/9', 'C#m11', 'C#7sus'];
const DRIVE = { ride: 'x.o.o.x.o.x.o.', kick: 'X.........X...', snare: '......X.....X.' }, BUILD = { hat: 'x.o.o.x.o.x.o.', kick: 'X.........X...', snare: '......X.....Xg' };
const FILL = { kick: 'X.........X...', snare: '......X...X.XX', tomH: '....x.........', tomM: '........x.....', crash: '..............' };
/** the hero's riff goes back to the duel's 2 + 2 + 3, and the band with it */
const HERO = { ride: 'x.o.x.o.x.o.o.', kick: 'X.......X.x...', snare: '....X.......X.' }, HEROFILL = { kick: 'X.......X.....', snare: '....X...X..gXX', tomH: '......x.......', tomM: '..........x...' };
const SIX = `${mirror(2)} | D3:6 D3:4 C3:4 | A2:6 A2:4 C#3:4`, GSIX = `${mirror(2)} | D3:6 D3:4 C3:4 | A2:6 A2:4 A2:4`; // the bass alone climbs to the turn's third, a step under the tonic
const LINE = 'F#6:6 E6:4 C#6:4 | D#6:6 E6:4 G#6:4 | F#6:14~ | E6:4 C#6:4 A5:6 | B5:6 C#6:4 E6:4 | F6:6 E6:4 C#6:4';
const HIGH = 'A6:6 G#6:4 F#6:4 | G#6:6 B6:4 G#6:4 | F#6:14~ | E6:4 F#6:4 A6:6 | G#6:6 E6:4 C#6:4 | F6:6 G#6:4 B6:4';

export default function score(o = {}) {
  const s = new Session({ id: 'rival', seed: 164, bpm: 164, steps: 14, beat: 4, bars: 27, tail: 3.5, ...o, ...loopOf(o, 2, 26) }), r = rig(s);
  const kit = r.kit({ stem: 'base', gain: 0.72, room: 0.12, plate: 0.03 }), low = r.slap({ stem: 'base', gain: 0.45 }), gtrs = r.guitars({ stem: 'base' }), org = r.org({ stem: 'melody', gain: 0.3 }), lead = r.lead({ stem: 'melody', hall: 0, fx: null }, { porta: 0.02, vibDepth: 0.24, vibRate: 6 }), brass = r.horns({ stem: 'tension' }), pad = r.pad({ stem: 'tension', gain: 0.27, hall: 0.2, fx: null, eq: [['hp', 220]] }), timp = r.timp({ stem: 'tension' });
  const walk = (bar, text, kind = thumb, vel = 0.84) => s.line(low, kind, bar, 0, text, { vel, art: 0.88, transpose: UP });
  // the timpani tuned to F sharp: it plays under the F sharp minor chords only
  const boom = (b, v = 0.84) => { const [t, g] = timp.human(s.t(b, 0), v); timp.sound(() => drum('timp', g, b, UP), t, { g }); };
  const comp = (bar, sym, first = 6) => { s.chord(org, organ, bar, first, sym, 3, { vel: 0.7, lo: 57, hi: 76, n: 4, strum: 0.002 }); s.chord(org, organ, bar, 10, sym, 3.4, { vel: 0.76, lo: 57, hi: 76, n: 4, strum: 0.002 }); };
  const stab = (bar, st, sym, len, vel = 0.86) => s.chord(brass, hit(s.span(len) * 0.9), bar, st, sym, len, { vel, n: 4, lo: 60, hi: 84 });
  const wash = (bar, sym, vel = 0.46) => s.pad(pad, strings, bar, 0, sym, 13.5, { vel, n: 4, lo: 62, hi: 84, attack: 0.15, release: 0.3 });
  /** the mirror: four bars of the riff and the two that turn it round */
  const six = (bar, { drums = BUILD, full = false } = {}) => {
    power(s, gtrs, bar, GSIX, { transpose: UP }); walk(bar, SIX);
    [...R, ...TURN].forEach((c, i) => { comp(bar + i, c); s.drums(kit, bar + i, 1, i === 5 ? FILL : drums); if (full) { stab(bar + i, 0, c, 3.2); stab(bar + i, 6, c, 3.2, 0.8); stab(bar + i, 10, c, 3.2, 0.84); wash(bar + i, c); } else { wash(bar + i, c, 0.3); } if (i === 0 || i === 4) boom(bar + i, full ? 0.9 : 0.8); });
  };

  // ---- the toms on 3 + 2 + 2 and the organ swelling, then the mirror
  s.drums(kit, 0, 2, { tomL: 'X.....x...x...', tomH: '......x...x...', hat: 'x.o.o.x.o.x.o.' }, { vel: 0.74 }); s.chord(org, organ, 0, 0, 'F#m11', 27, { vel: 0.46, lo: 57, hi: 74, n: 4 }); boom(0, 0.7); boom(1, 0.8);
  s.drums(kit, 2, 1, { crash: 'X.............' }); six(2);
  // ---- the lead's own line over it
  s.drums(kit, 8, 1, { crash: 'X.............' }); six(8, { drums: DRIVE }); s.phrase(lead, 8, 0, LINE, { vel: 0.86 });
  // ---- four bars where the band bends to the hero's riff, the lead silent, the strings rising
  power(s, gtrs, 14, riff(2), { vel: 0.84, transpose: UP }); walk(14, riff(2)); HEROC.forEach((c, i) => { comp(14 + i, c, 4); s.drums(kit, 14 + i, 1, i === 3 ? HEROFILL : HERO); s.pad(pad, strings, 14 + i, 0, c, 13.5, { vel: 0.4 + 0.08 * i, n: 5, lo: 62, hi: 86, attack: 0.3, release: 0.3 }); stab(14 + i, 0, c, 3.2, 0.74); });
  s.drums(kit, 14, 1, { crash: 'X.............' }); boom(14);
  // ---- the mirror with everything on it, the lead's line at the top
  s.drums(kit, 18, 1, { crash: 'X.............' }); six(18, { drums: DRIVE, full: true }); s.phrase(lead, 18, 0, HIGH, { vel: 0.9 });
  s.drums(kit, 24, 1, { crash: 'X.............' }); TURN.forEach((c, i) => { const root = i ? 'C#3' : 'F#2'; power(s, gtrs, 24 + i, `${root}:6 ${root}:4 ${root}:4`, { vel: 0.92 }); stab(24 + i, 0, c, 3.2, 0.92); stab(24 + i, 6, c, 3.2, 0.92); stab(24 + i, 10, c, 3.6, 0.96); wash(24 + i, c, 0.56); s.bass(low, slapped, 24 + i, c, '1.....1...1.p.', { slap: true, vel: 0.9 }); s.drums(kit, 24 + i, 1, { ride: 'X.x.x.X.x.X.x.', kick: 'X.....X...X...', snare: '......X...X..X' }); });
  s.phrase(lead, 24, 0, 'F#6:6! C#6:4 F#6:4 | F6:6! G#6:4 B6:4', { vel: 0.92 }); boom(24, 0.96);
  // ---- the end: the whole band on the riff's first two groups, then nothing
  if (!s.loop) { s.drums(kit, 26, 1, { crash: '......X.......', kick: 'X.....X.......', snare: 'X.....X.......' }); stab(26, 0, 'F#m9', 2.5, 0.96); stab(26, 6, 'F#m9', 3, 1); power(s, gtrs, 26, 'F#2:3 .:3 F#2:3', { vel: 1 }); s.bass(low, slapped, 26, 'F#m9', '1.....1..', { slap: true, vel: 0.9 }); s.phrase(lead, 26, 0, 'F#6:3 .:3 F#6:4!', { vel: 0.92 }); timp.sound(() => drum('timp', 1, 0, UP), s.t(26, 6), { g: 1 }); }
  return s;
}
