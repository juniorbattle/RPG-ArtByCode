// « Le Tournoi », the end of the day (journal Passe SN7): the low sun: a warm laid-back fusion on the nylon guitar, the electric piano and a soft wind synth. The third hesitates:
// the motif leans on F natural, the answer on F sharp, the day ending and the night on its way. An original score, no work reproduced.
import { Session, parseChord, voice } from '../../../tools/audio/band/session.mjs';
import { rig, rhodes, strings, vibes, nylon, fretless, loopOf } from './rig.mjs';
import { fusionHead } from './theme.mjs';

/** the tracks that carry the tune: the band's voicings make room for them */
export const tunes = ['lead'];
const A = ['Fmaj9', 'Cmaj9', 'Bbmaj9', 'A7sus'], B = ['Gmaj9', 'D/F#', 'Em9', 'A13sus'];
const BRUSH = { sweep: 'o...o...o...o...', brush: '....x..g....x.g.', hat: '....g.......g...', kick: 'o.........o.....' }, LIFT = { ...BRUSH, shaker: 'x.o.x.o.x.o.x.o.', kick: 'x.....o...o.....' };

export default function score(o = {}) {
  const s = new Session({ id: 'fin', seed: 78, bpm: 78, swing: 0.57, bars: 20, tail: 6, ...o, ...loopOf(o, 2, 18) }), r = rig(s);
  const gtr = r.nylon({ gain: 0.52 }), keys = r.keysSoft({ gain: 0.26, pan: 0.16 }), low = r.fret(), kit = r.kit({ id: 0, gain: 0.82, room: 0.24, jitter: 0.007, lay: 0.005, vary: 0.13, fx: null }), lead = r.softLead({}, { dark: 0.55, attack: 0.022, release: 0.12 }), pad = r.pad({ gain: 0.2, hall: 0.3 }), vib = r.vib({ gain: 0.32 });

  /** the nylon's picking on the fusion's rhythm, every note left ringing */
  const pick = (bar, sym, vel = 0.46) => {
    const c = parseChord(sym), v = voice(c, s.voicings.get('nylon'), { lo: 55, hi: 74, n: 3, avoid: s.avoidAt(s.t(bar), s.span(16)) }), root = 40 + ((c.bass - 4 + 12) % 12); s.voicings.set('nylon', v);
    [[0, root], [3, v[0]], [6, v[1]], [8, v[2]], [11, v[1]], [14, v[0]]].forEach(([st, m], i) => { const [t, g] = gtr.human(s.t(bar, st), vel * (i ? 0.9 : 1.2)); gtr.sound(() => nylon(m, g, gtr.take()), t, { g, dur: s.span(16 - st) + 0.2, rel: 0.25 }, m); });
  };
  const hold = (bar, sym, vel = 0.42) => s.chord(keys, rhodes, bar, 8, sym, 7.5, { vel, lo: 55, hi: 74, n: 4, strum: 0.016, rel: 0.3 });
  const under = (bar, sym, row = '1-----5-1-----7-', vel = 0.66) => s.bass(low, fretless, bar, sym, row, { vel, art: 1 });
  const wash = (bar, sym, vel = 0.42) => s.pad(pad, strings, bar, 0, sym, 15, { vel, n: 4, lo: 57, hi: 79, attack: 1, release: 1.1 });
  const phrase = (bar) => { s.phrase(lead, bar, 0, `${fusionHead(5)} | D5:10^~ E5:2 G5:2 A5:2 | D6:6 C6:2 A5:8~`, { vel: 0.72 }); };

  pick(0, 'Fmaj9', 0.44); pick(1, 'A7sus', 0.44); under(1, 'A7sus', '1---------------', 0.54); s.drums(kit, 1, 1, { sweep: 'o...o...o...o...' }, { vel: 0.7 });
  // ---- the motif, leaning on F natural
  phrase(2); A.forEach((c, i) => { pick(2 + i, c); hold(2 + i, c); under(2 + i, c); s.drums(kit, 2 + i, 1, BRUSH); });
  // ---- the answer: the day's own third, F sharp, one last time; the strings come in
  s.phrase(lead, 6, 0, 'B5:6 A5:2 F#5:4 D5:4 | E5:4 F#5:4 A5:8^~ | G5:4 B5:4 D6:4 E6:4 | F#6:8^~ E6:4 D6:4', { vel: 0.76 });
  B.forEach((c, i) => { pick(6 + i, c, 0.5); hold(6 + i, c, 0.46); under(6 + i, c, '1-----5-1-----5-', 0.7); wash(6 + i, c); s.drums(kit, 6 + i, 1, LIFT); });
  // ---- the motif again, the vibraphone answering in its long notes
  phrase(10); A.forEach((c, i) => { pick(10 + i, c, 0.5); hold(10 + i, c, 0.46); under(10 + i, c); wash(10 + i, c, 0.46); s.drums(kit, 10 + i, 1, LIFT); }); s.line(vib, vibes, 12, 2, 'F5:2 A5:2 C6:4', { vel: 0.5, art: 1.5, rel: 0.4 }); s.line(vib, vibes, 13, 10, 'E6:2 D6:2 C6:2', { vel: 0.48, art: 1.5, rel: 0.4 });
  // ---- the sun goes: the two thirds side by side
  s.phrase(lead, 14, 0, 'D6:6 C6:2 A5:8~ | F5:6 A5:2 D6:8~ | F#5:6 A5:2 D6:8~ | E6:8 D6:8~', { vel: 0.74 });
  ['Bbmaj9', 'Dm9', 'Dmaj9', 'A13sus'].forEach((c, i) => { pick(14 + i, c, 0.48); hold(14 + i, c, 0.44); under(14 + i, c, '1-------5-------', 0.66); wash(14 + i, c, 0.46); s.drums(kit, 14 + i, 1, BRUSH, { vel: 0.9 }); });
  if (!s.loop) { pick(18, 'D6/9', 0.42); s.chord(keys, rhodes, 18, 8, 'D6/9', 20, { vel: 0.4, lo: 55, hi: 76, n: 4, strum: 0.03, rel: 0.6 }); s.bass(low, fretless, 18, 'D6/9', '1-----------------------', { vel: 0.54, art: 1 }); s.pad(pad, strings, 18, 0, 'D6/9', 24, { vel: 0.34, n: 4, lo: 57, hi: 79, attack: 1, release: 2 }); s.phrase(lead, 18, 8, 'A5:8 D6:20~', { vel: 0.56 }); }
  return s;
}
