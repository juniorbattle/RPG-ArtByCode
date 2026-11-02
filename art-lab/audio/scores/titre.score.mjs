// « La Cité », the title (journal Passe SN7): the whole theme told once, in the cinematic manner of Final Fantasy VIII's openings: an open fifth without a third, the motif
// on a soft horn, the answer on the wind synth, the band arriving for the fanfare, and the third of the day landing last. D, no third until bar 13. An original score.
import { Session, parseChord, voice } from '../../../tools/audio/band/session.mjs';
import { rig, rhodes, strings, vibes, fretless, slapped, hit, hornLine, loopOf } from './rig.mjs';
import { longHead } from './theme.mjs';

/** the tracks that carry the tune: the band's voicings make room for them */
export const tunes = ['horn', 'lead', 'vibes'];
const A = ['D9sus', 'Am11', 'Bbmaj9', 'A7sus'], B = ['Cmaj9', 'Fmaj9', 'G13sus', 'Ebmaj9#11'];
const QUIET = { ride: 'o...o.o.o...o.o.', kick: 'g.........g.....', hat: '....g.......g...' }, FULL = { ride: 'x.ox.ox.x.ox.ox.', kick: 'X.....x...x..x..', snare: '....X..g..g.X..g', hat: '..g...g...g...g.' };

export default function score(o = {}) {
  const s = new Session({ id: 'titre', seed: 72, bpm: 72, swing: 0.55, bars: 18, tail: 7, ...o, ...loopOf(o, 2, 16) }), r = rig(s);
  const keys = r.keysSoft(), low = r.fret(), slap = r.slap({ gain: 0.42 }), kit = r.kit({ gain: 0.72, room: 0.2, plate: 0.05 }), lead = r.lead({ hall: 0.12 }), pad = r.pad({ gain: 0.24, hall: 0.34 }), vib = r.vib({ gain: 0.44 });
  const horn = r.horns({ gain: 0.42, hall: 0.26, plate: 0.14 }, 'horn'), brass = r.horns({ gain: 0.26 });
  /** the electric piano's slow arpeggio: every note stops with the bar, or it rings over the next chord */
  const arp = (bar, sym, vel = 0.5, end = 15.5) => { const v = voice(parseChord(sym), s.voicings.get('rhodes'), { lo: 53, hi: 76, n: 4, avoid: s.avoidAt(s.t(bar), s.span(end)) }); s.voicings.set('rhodes', v); v.forEach((m, i) => { const st = i * 2, [t, g] = keys.human(s.t(bar, st), vel); keys.sound(() => rhodes(m, g, keys.take()), t, { g, dur: s.span(end - st), rel: 0.3 }, m); }); };
  const under = (bar, sym, row = '1-------5-------', vel = 0.62) => s.bass(low, fretless, bar, sym, row, { vel, art: 1 });
  const wash = (bar, sym, vel = 0.42, len = 15) => s.pad(pad, strings, bar, 0, sym, len, { vel, n: 4, lo: 57, hi: 81, attack: 0.9, release: 1.1 });
  const stab = (b, st, sym, len, v = 0.86) => s.chord(brass, hit(s.span(len) * 0.92), b, st, sym, len, { vel: v, n: 4, lo: 60, hi: 84 });

  // ---- an open fifth, no third yet, and two notes of the motif on the vibraphone
  s.padNotes(pad, strings, 0, s.span(30), [50, 57, 62, 69], { vel: 0.5, attack: 2, release: 1.4 }); s.line(vib, vibes, 0, 8, 'D6:8 | A5:8 D6:8', { vel: 0.56, art: 1.6, rel: 0.5 }); under(1, 'D9sus', '1---------------', 0.5);
  // ---- the motif on the horn, drawn out
  A.forEach((c, i) => { arp(2 + i, c); under(2 + i, c); wash(2 + i, c); }); hornLine(s, horn, 2, 0, longHead(5), { vel: 0.74 });
  s.drums(kit, 4, 2, { sweep: 'o...o...o...o...', hat: '....g.......g...' }, { vel: 0.6 });
  // ---- the answer on the wind synth, the kit coming in under it
  s.phrase(lead, 5, 10, 'A5:2 C6:2 D6:2 E6:10~ D6:3 C6:3 A5:16^~ G5:3 A5:3 C6:5 A5:3 G5:2 A5:12~', { vel: 0.76 });
  B.forEach((c, i) => { arp(6 + i, c, 0.56, i === 3 ? 11.5 : 15.5); under(6 + i, c, i === 3 ? '1-------5---' : undefined, 0.68); wash(6 + i, c, 0.48, i === 3 ? 11.5 : 15); s.drums(kit, 6 + i, 1, i < 2 ? QUIET : FULL, { vel: i < 2 ? 0.8 : 0.84 }); });
  s.chord(keys, rhodes, 9, 12, 'A7alt', 4, { vel: 0.56, lo: 53, hi: 74 }); s.chord(brass, hit(s.span(3.6), { fall: 1 }), 9, 12, 'A7alt', 3.6, { vel: 0.82, n: 4, lo: 60, hi: 81 }); s.bass(low, fretless, 9, 'A7alt', '1---', { vel: 0.7, art: 1, from: 12 }); s.pad(pad, strings, 9, 12, 'A7alt', 3.8, { vel: 0.46, n: 4, lo: 57, hi: 79, attack: 0.3, release: 0.6 });
  // ---- the fanfare, the whole band, and the third arrives on its last chord
  s.drums(kit, 10, 1, { crash: 'X...............' }); s.phrase(lead, 10, 0, 'D6:3! D6:3! D6:2! A5:8^~ | D6:3! D6:3! D6:2! E6:8^~ | D6:6 C6:2 A5:6 G5:2 | D6:16~', { vel: 0.88 });
  for (const [b, c] of [[10, 'D13sus'], [11, 'E/D']]) { stab(b, 0, c, 2.6); stab(b, 3, c, 2.6); stab(b, 6, c, 1.7); stab(b, 8, c, 7, 0.78); s.chord(keys, rhodes, b, 0, c, 14, { vel: 0.62, lo: 53, hi: 74 }); s.bass(slap, slapped, b, c, '1..1..1.1.xp.7x5', { slap: true, vel: 0.84 }); wash(b, c, 0.56); s.drums(kit, b, 1, { kick: 'X..X..X.X..X.X..', snare: '....X.......X..g', bell: 'x.o.x.o.x.o.x.o.' }); }
  stab(12, 0, 'Bbmaj9', 7, 0.84); stab(12, 8, 'C9', 7, 0.86); s.chord(keys, rhodes, 12, 0, 'Bbmaj9', 8, { vel: 0.62, lo: 53, hi: 74 }); s.chord(keys, rhodes, 12, 8, 'C9', 8, { vel: 0.62, lo: 53, hi: 74 });
  s.bass(slap, slapped, 12, 'Bbmaj9', '1..xp.1.', { slap: true, vel: 0.84 }); s.bass(slap, slapped, 12, 'C9', '1..xp.1x', { slap: true, vel: 0.84, from: 8 }); s.drums(kit, 12, 1, { kick: 'X.....x.X.....x.', snare: 'X..gX..gXgXgX.X.', tomH: '..x.............', tomL: '..........x.x...' });
  s.drums(kit, 13, 1, { crash: 'X...............', kick: 'X...............', snare: 'X...............' }); stab(13, 0, 'D6/9', 15, 0.98); s.chord(keys, rhodes, 13, 0, 'D6/9', 15, { vel: 0.68, lo: 53, hi: 76 }); s.bass(slap, slapped, 13, 'D6/9', '1---------------', { slap: true, vel: 0.84 }); wash(13, 'D6/9', 0.6);
  // ---- it falls back: the motif's head alone on the vibraphone, the strings holding the day
  ['Gmaj9', 'D9sus'].forEach((c, i) => { arp(14 + i, c, 0.46); under(14 + i, c, '1---------------', 0.56); wash(14 + i, c, 0.42); }); s.line(vib, vibes, 14, 0, 'D5:8 A5:5 A5:3 | C6:5 A5:3 G5:5 A5:3', { vel: 0.56, art: 1.3, rel: 0.5 });
  if (!s.loop) { s.chord(keys, rhodes, 16, 0, 'D6/9', 22, { vel: 0.46, lo: 53, hi: 76, n: 4, strum: s.span(1), rel: 0.6 }); s.bass(low, fretless, 16, 'D6/9', '1-----------------------', { vel: 0.56, art: 1 }); s.line(vib, vibes, 16, 4, 'F#5:20', { vel: 0.5, art: 1, rel: 1 }); s.pad(pad, strings, 16, 0, 'D6/9', 24, { vel: 0.4, n: 4, lo: 57, hi: 81, attack: 0.9, release: 2 }); }
  return s;
}
