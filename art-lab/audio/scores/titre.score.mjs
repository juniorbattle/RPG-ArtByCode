// « La Cité », the title (journal Passes SN7 / SN8): the theme's one full telling, in the cinematic manner of Final Fantasy VIII's openings: an open fifth without a
// third, the motif drawn out on a soft horn, an answer of its own on the wind synth, then the band and the motif's head on the horns twice as slow; the third of the
// day lands last, on the wind synth. The fanfare is the tournament's and stays out of it (journal Passe SN8). D, no third in the tune until bar 13. An original score.
import { Session, parseChord, voice } from '../../../tools/audio/band/session.mjs';
import { rig, rhodes, strings, vibes, fretless, slapped, hit, hornLine, loopOf } from './rig.mjs';
import { longHead } from './theme.mjs';

/** the tracks that carry the tune: the band's voicings make room for them */
export const tunes = ['horn', 'lead', 'vibes'];
const A = ['Gsus2/D', 'Cmaj9', 'F6/9/C', 'Em11'], B = ['Gmaj9', 'Em9', 'Cmaj9', 'Gm9'], C = ['Bbmaj9', 'C9sus', 'Gm9', 'D6/9'];
const QUIET = { ride: 'o...o.o.o...o.o.', kick: 'g.........g.....', hat: '....g.......g...' }, FULL = { ride: 'x.x.x.x.x.x.x.x.', kick: 'X.......x.X.....', snare: '....X..g....X...', hat: '....g.......g...' };
const LIFT = { ride: 'X.x.x.x.X.x.x.x.', kick: 'X.......X.X...x.', snare: '....X.......X..g', hat: '....g.......g...' };

export default function score(o = {}) {
  const s = new Session({ id: 'titre', seed: 72, bpm: 72, swing: 0.55, bars: 18, tail: 7, ...o, ...loopOf(o, 2, 16) }), r = rig(s);
  const keys = r.keysSoft(), low = r.fret(), slap = r.slap({ gain: 0.42 }), kit = r.kit({ gain: 0.72, room: 0.2, plate: 0.05 }), lead = r.lead({ hall: 0.12 }), pad = r.pad({ gain: 0.24, hall: 0.34 }), vib = r.vib({ gain: 0.44 });
  const horn = r.horns({ gain: 0.42, hall: 0.26, plate: 0.14 }, 'horn'), brass = r.horns({ gain: 0.26 });
  /** the electric piano's slow arpeggio: every note stops with the bar, or it rings over the next chord */
  const arp = (bar, sym, vel = 0.5, end = 15.5) => { const v = voice(parseChord(sym), s.voicings.get('rhodes'), { lo: 53, hi: 76, n: 4, avoid: s.avoidAt(s.t(bar), s.span(end)) }); s.voicings.set('rhodes', v); v.forEach((m, i) => { const st = i * 2, [t, g] = keys.human(s.t(bar, st), vel); keys.sound(() => rhodes(m, g, keys.take()), t, { g, dur: s.span(end - st), rel: 0.3 }, m); }); };
  const under = (bar, sym, row = '1-------5-------', vel = 0.62) => s.bass(low, fretless, bar, sym, row, { vel, art: 1 });
  const wash = (bar, sym, vel = 0.42, len = 15) => s.pad(pad, strings, bar, 0, sym, len, { vel, n: 4, lo: 57, hi: 81, attack: 0.9, release: 1.1 });
  const stab = (b, st, sym, len, v = 0.86) => s.chord(brass, hit(s.span(len) * 0.92), b, st, sym, len, { vel: v, n: 4, lo: 60, hi: 84 });

  // ---- an open fifth, no third yet, and two notes of the motif on the vibraphone; the bass comes in with the horn
  s.padNotes(pad, strings, 0, s.span(30), [50, 57, 62, 69], { vel: 0.5, attack: 2, release: 1.4 }); s.line(vib, vibes, 0, 8, 'D6:8 | A5:8 D6:8', { vel: 0.56, art: 1.6, rel: 0.5 });
  // ---- the motif on the horn, drawn out, over chords of its own: a quartal G over D, C, F over C, E minor (journal Passe SN8: not midday's)
  A.forEach((c, i) => { arp(2 + i, c); under(2 + i, c); wash(2 + i, c); }); hornLine(s, horn, 2, 0, longHead(5), { vel: 0.74 });
  s.drums(kit, 4, 2, { sweep: 'o...o...o...o...', hat: '....g.......g...' }, { vel: 0.6 });
  // ---- its answer, the wind synth's own: a lydian C sharp, a leap to the major seventh, the kit coming in under it
  s.phrase(lead, 6, 0, 'B5:6 C#6:2 D6:8~ | G6:4 E6:4 B5:8 | C6:4 E6:4 B6:8~ | A6:4 G6:4 D6:4 C#6:4', { vel: 0.76 });
  B.forEach((c, i) => { arp(6 + i, c, 0.56, i === 3 ? 11.5 : 15.5); under(6 + i, c, i === 3 ? '1-------5---' : undefined, 0.68); wash(6 + i, c, 0.48, i === 3 ? 11.5 : 15); s.drums(kit, 6 + i, 1, i < 2 ? QUIET : FULL, { vel: i < 2 ? 0.8 : 0.84 }); });
  s.chord(keys, rhodes, 9, 12, 'A7alt', 4, { vel: 0.56, lo: 53, hi: 74 }); s.chord(brass, hit(s.span(3.6), { fall: 1 }), 9, 12, 'A7alt', 3.6, { vel: 0.82, n: 4, lo: 60, hi: 81 }); s.bass(low, fretless, 9, 'A7alt', '1---', { vel: 0.7, art: 1, from: 12 }); s.pad(pad, strings, 9, 12, 'A7alt', 3.8, { vel: 0.46, n: 4, lo: 57, hi: 79, attack: 0.3, release: 0.6 });
  // ---- the band: the motif's head on the horns, twice as slow, rising through four chords; the wind synth gives the third on the last
  s.drums(kit, 10, 1, { crash: 'X...............' }); hornLine(s, horn, 10, 0, 'D5:8 A5:8 | A5:8 C6:8 | A5:8 G5:8 | A5:6 D6:10', { vel: 0.86, soft: false, art: 0.95 }); hornLine(s, horn, 10, 0, 'D4:8 A4:8 | F4:8 C5:8 | D5:8 Bb4:8 | A4:6 D5:10', { vel: 0.74, soft: false, art: 0.95 });
  C.forEach((c, i) => { const b = 10 + i, last = i === 3; stab(b, 0, c, last ? 15 : 6, last ? 0.96 : 0.84); if (!last) stab(b, 10, c, 5, 0.8); s.chord(keys, rhodes, b, 0, c, last ? 15 : 9, { vel: 0.62, lo: 53, hi: 74 }); if (!last) s.chord(keys, rhodes, b, 10, c, 5, { vel: 0.54, lo: 53, hi: 74 }); s.bass(slap, slapped, b, c, last ? '1---------------' : '1..1..p.1..x1.5.', { slap: true, vel: 0.84 }); wash(b, c, 0.56); s.drums(kit, b, 1, last ? { crash: 'X...............', kick: 'X...............', ride: '....x.ox.ox.x.ox' } : LIFT); });
  s.drums(kit, 12, 1, { crash: '..........x.....' }); s.phrase(lead, 13, 4, 'F#6:12~', { vel: 0.84 });
  // ---- it falls back: the vibraphone on the six-nine, the strings holding the day
  ['Gmaj9', 'D9sus'].forEach((c, i) => { arp(14 + i, c, 0.46); under(14 + i, c, '1---------------', 0.56); wash(14 + i, c, 0.42); }); s.line(vib, vibes, 14, 0, 'E6:4 D6:4 A5:8 | B5:4 A5:4 E5:8', { vel: 0.52, art: 1.3, rel: 0.5 });
  if (!s.loop) { s.chord(keys, rhodes, 16, 0, 'D6/9', 22, { vel: 0.46, lo: 53, hi: 76, n: 4, strum: s.span(1), rel: 0.6 }); s.bass(low, fretless, 16, 'D6/9', '1-----------------------', { vel: 0.56, art: 1 }); s.line(vib, vibes, 16, 4, 'F#5:20', { vel: 0.5, art: 1, rel: 1 }); s.pad(pad, strings, 16, 0, 'D6/9', 24, { vel: 0.4, n: 4, lo: 57, hi: 81, attack: 0.9, release: 2 }); }
  return s;
}
