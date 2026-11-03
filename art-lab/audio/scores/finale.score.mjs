// « La Finale », the last bout (journal Passes SN7 / SN8): the orchestral rock of Final Fantasy VIII's great fights. A riff of its own in straight eighths, C minor, and over
// it the whole motif on the horns in long values, a chorale over the rock; four bars of the lead's own; two bars that turn to D, the timpani rolling; four bars in D minor
// over a falling bass, the motif's head on the horns in a rhythm of its own, a descant against it; then the fanfare in D major, its call over D, C and G, hit on the
// beats: the night's third gives way to the day's, and the catalogue comes home to its key. Nothing of midday's chorus, of the duel's plan nor of the night's chords
// (journal Passe SN8, two independent readings). Three synchronous layers (SA-5). An original score, no work reproduced.
import { Session } from '../../../tools/audio/band/session.mjs';
import { rig, organ, strings, slapped, hit, hornLine, power, loopOf } from './rig.mjs';
import { drum } from '../../../tools/audio/band/drums.mjs';

/** the tracks that carry the tune: the band's voicings make room for them */
export const tunes = ['lead', 'horn'];
const ROCK = { ride: 'X.x.X.x.X.x.X.x.', kick: 'X.......X.X.....', snare: '....X.......X...' }, PUSH = { ...ROCK, kick: 'X.....x.X.X...x.', snare: '....X.......X..g' };
const FILL = { kick: 'X...X...X...X...', snare: '....X...X..XXXXX', tomH: '......x.........' }, CALL = { kick: 'X...X...X...X...', snare: '....X.......X...', ride: 'x.x.x.x.x.x.x.x.' };
/** the chords and the guitars' roots, never under D2 */
const A = ['Cm9', 'Ebmaj9', 'Bb6/9', 'Gm11', 'Ab6/9', 'Eb6/9/Bb', 'G7#9', 'Cm9'], AR = ['C3', 'Eb2', 'Bb2', 'G2', 'Ab2', 'Bb2', 'G2', 'C3'];
const B = ['Abmaj9', 'Bb13sus', 'Gm9', 'G7#9'], BR = ['Ab2', 'Bb2', 'G2', 'G2'], D = ['Dm9', 'Fmaj9/C', 'Gm9/Bb', 'A7sus'], DR = ['D2', 'C3', 'Bb2', 'A2'];
/** the timpani is in D: retuned to the chord's root where it is a C, a G, a D or an A, silent elsewhere */
const TIMP = { C: -2, G: 5, D: 0, A: 7 };

export default function score(o = {}) {
  const s = new Session({ id: 'finale', seed: 136, bpm: 136, swing: 0.5, bars: 25, tail: 4.5, ...o, ...loopOf(o, 2, 24) }), r = rig(s);
  const kit = r.kit({ stem: 'base', gain: 0.72, room: 0.14, plate: 0.04 }), low = r.slap({ stem: 'base' }), gtrs = r.guitars({ stem: 'base' }), org = r.org({ stem: 'melody' }), lead = r.lead({ stem: 'melody', plate: 0.24 }, { vibDepth: 0.24, vibRate: 5.8 }), horn = r.horns({ stem: 'melody', gain: 0.3, plate: 0.26 }, 'horn'), brass = r.horns({ stem: 'tension' }), pad = r.pad({ stem: 'tension', gain: 0.3, hall: 0.24, fx: null, eq: [['hp', 200]] }), timp = r.timp({ stem: 'tension', gain: 0.38 });
  const stab = (bar, st, sym, len, vel = 0.86) => s.chord(brass, hit(s.span(len) * 0.9), bar, st, sym, len, { vel, n: 4, lo: 60, hi: 79 });
  const wash = (bar, sym, vel = 0.5, len = 15) => s.pad(pad, strings, bar, 0, sym, len, { vel, n: 4, lo: 55, hi: 76, attack: 0.25, release: 0.4 });
  const tap = (bar, st, tune, v = 0.9) => { const [t, g] = timp.human(s.t(bar, st), v); timp.sound(() => drum('timp', g, bar + st, tune), t, { g }); };
  const boom = (bar, sym, st = 0, v = 0.9) => { const tune = TIMP[sym[0]]; if (tune !== undefined && sym[1] !== 'b' && sym[1] !== '#') tap(bar, st, tune, v); };
  const roll = (bar, tune, v0, v1) => { for (let i = 0; i < 16; i++) tap(bar, i, tune, v0 + (v1 - v0) * i / 16); };
  /** the riff: the open chord on the downbeat, then the palm's eighths; the bass on the same eighths, popping the octave */
  const riff = (bar, sym, root, vel = 0.86) => { power(s, gtrs, bar, `${root}:4`, { vel }); power(s, gtrs, bar, `.:4 ${root}:2 ${root}:2 ${root}:2 ${root}:2 ${root}:2 ${root}:2`, { vel: vel * 0.9, muted: true }); s.bass(low, slapped, bar, sym, '1.1.1.1.1.1.p.1.', { slap: true, vel }); };
  const comp = (bar, sym) => { for (const st of [6, 14]) s.chord(org, organ, bar, st, sym, 1.6, { vel: 0.66, lo: 55, hi: 74, n: 4, strum: 0.002 }); };

  // ---- the riff, at once
  s.drums(kit, 0, 1, { crash: 'X...............', ...ROCK }); s.drums(kit, 1, 1, FILL); riff(0, 'Cm9', 'C3', 0.82); riff(1, 'Cm9', 'C3', 0.84); boom(0, 'Cm9');
  // ---- the motif whole on the horns in long values, two octaves, over the riff: a chorale over the rock
  hornLine(s, horn, 2, 0, 'C5:8 G5:8 | G5:4 Bb5:12 | G5:8 F5:8 | G5:16 | C6:8 Bb5:8 | G5:8 F5:8 | D5:16 | C5:16', { vel: 0.86, soft: false, art: 0.95 }); hornLine(s, horn, 2, 0, 'C4:8 G4:8 | G4:4 Bb4:12 | G4:8 F4:8 | G4:16 | C5:8 Bb4:8 | G4:8 F4:8 | D4:16 | C4:16', { vel: 0.76, soft: false, art: 0.95 });
  A.forEach((c, i) => { const b = 2 + i; riff(b, c, AR[i]); comp(b, c); wash(b, c, 0.42); s.drums(kit, b, 1, i === 7 ? FILL : ROCK); boom(b, c); });
  s.drums(kit, 2, 1, { crash: 'X...............' }); s.drums(kit, 6, 1, { crash: 'X...............' });
  // ---- four bars of the lead's own over the brass and the strings
  s.phrase(lead, 10, 0, 'Eb6:6 C6:2 G5:8 | Ab5:4 Bb5:4 C6:4 Eb6:4 | D6:4 Bb5:4 G5:4 F5:4 | D6:4 F6:4 D6:8', { vel: 0.86 });
  B.forEach((c, i) => { const b = 10 + i; power(s, gtrs, b, `${BR[i]}:8 ${BR[i]}:8`, { vel: 0.76 }); s.bass(low, slapped, b, c, '1-----1-1-----5-', { slap: true, vel: 0.8 }); s.chord(org, organ, b, 0, c, 15.4, { vel: 0.56, lo: 55, hi: 74, n: 4 }); wash(b, c, 0.56); stab(b, 0, c, 6, 0.78); stab(b, 10, c, 4, 0.72); s.drums(kit, b, 1, i === 3 ? FILL : PUSH); boom(b, c); });
  s.drums(kit, 10, 1, { crash: 'X...............' });
  // ---- two bars that turn to D: G minor then its dominant, the timpani walking G to A with the bass, the guitars on eighths, the lead climbing
  ['Gm11', 'A7#9'].forEach((c, i) => { const b = 14 + i, root = i ? 'A2' : 'G2'; power(s, gtrs, b, Array(8).fill(`${root}:2`).join(' '), { vel: 0.7 + 0.1 * i }); s.bass(low, slapped, b, c, '1.1.1.1.1.1.1.1.', { slap: true, vel: 0.78 + 0.06 * i }); s.pad(pad, strings, b, 0, c, 15.5, { vel: 0.5 + 0.12 * i, n: 5, lo: 55, hi: 81, attack: 0.6, release: 0.2 }); s.chord(org, organ, b, 0, c, 15.4, { vel: 0.5 + 0.1 * i, lo: 55, hi: 74, n: 4 }); });
  roll(14, 5, 0.4, 0.7); roll(15, 7, 0.7, 1); s.drums(kit, 14, 1, { ride: 'x.x.x.x.x.x.x.x.', kick: 'X.......X.......' }); s.drums(kit, 15, 1, { kick: 'X...X...X...X...', snare: 'x.x.x.x.xxxxXXXX' });
  s.phrase(lead, 14, 0, 'Bb5:4 C6:4 D6:4 F6:4 | G6:4 E6:4 C#6:8~', { vel: 0.84 });
  // ---- D minor over a falling bass, D C B flat A: the motif's head on the horns in quarters and halves, a descant against it
  hornLine(s, horn, 16, 0, 'D5:4 A5:4 A5:8 | C6:4 A5:4 G5:8 | A5:8 G5:8 | A5:16', { vel: 0.9, soft: false, art: 0.95 }); hornLine(s, horn, 16, 0, 'D4:4 F4:4 F4:8 | A4:4 F4:4 E4:8 | D4:16 | E4:16', { vel: 0.8, soft: false, art: 0.95 });
  s.phrase(lead, 16, 0, 'A6:8 G6:8 | F6:4 E6:4 F6:8 | G6:8 Bb6:8 | A6:16', { vel: 0.84 });
  D.forEach((c, i) => { const b = 16 + i; riff(b, c, DR[i], 0.9); comp(b, c); wash(b, c, 0.62); s.drums(kit, b, 1, i === 3 ? FILL : PUSH); boom(b, c); });
  s.drums(kit, 16, 1, { crash: 'X...............' });
  // ---- the fanfare in D major: the call over D, C and G on a D pedal, the brass and the timpani on the beats
  s.drums(kit, 20, 1, { crash: 'X...............' }); s.phrase(lead, 20, 0, `D6:3! D6:3! D6:2! A5:8^~ | D6:3! D6:3! D6:2! E6:8^~ | D6:6 C6:2 A5:6 G5:2 | F#6:${s.loop ? 10 : 16}^~`, { vel: 0.92 });
  ['Dmaj9', 'C/D', 'G6/9/D', 'D6/9'].forEach((c, i) => { const b = 20 + i, last = i === 3; for (const st of last ? [0] : [0, 4, 8]) stab(b, st, c, last ? (s.loop ? 9.5 : 15) : st === 8 ? 7 : 3.6, last ? 1 : 0.9); power(s, gtrs, b, last ? `D2:${s.loop ? 10 : 16}` : 'D2:4 D2:4 D2:8', { vel: 0.9 }); s.bass(low, slapped, b, c, last ? '1---------' : '1...1...1...1...', { slap: true, vel: 0.88 }); wash(b, c, 0.66, last && s.loop ? 9.5 : 15); s.drums(kit, b, 1, i === 2 ? { ...CALL, snare: '....X.......X.XX' } : CALL); if (i < 2) for (const st of [0, 4, 8]) tap(b, st, 0); });
  if (s.loop) { stab(23, 10, 'G7#9', 5.5, 0.9); s.bass(low, slapped, 23, 'G7#9', '1.....', { slap: true, vel: 0.86, from: 10 }); power(s, gtrs, 23, '.:10 G2:6', { vel: 0.9 }); s.chord(org, organ, 23, 10, 'G7#9', 5.5, { vel: 0.6, lo: 55, hi: 74, n: 4 }); s.drums(kit, 23, 1, { kick: '..........X.X...', snare: '..........X.XXXX' }); } // going round, the dominant of C minor
  else { s.drums(kit, 24, 1, { crash: 'X...............', kick: 'X...............' }); stab(24, 0, 'D6/9', 15, 1); power(s, gtrs, 24, 'D2:16', { vel: 1 }); s.bass(low, slapped, 24, 'D6/9', '1---------------', { slap: true, vel: 0.9 }); hornLine(s, horn, 24, 0, 'D5:16', { vel: 0.9, soft: false }); s.phrase(lead, 24, 0, 'A6:14~', { vel: 0.9 }); roll(24, 0, 0.4, 1); }
  return s;
}
