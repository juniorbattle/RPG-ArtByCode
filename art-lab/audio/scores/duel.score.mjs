// « Le Tournoi », the duel (journal Passe SN5): the motif as a riff in 7/8, three notes to the bar on 2 + 2 + 3, on the rock and orchestral side of Final Fantasy
// VIII's fights crossed with the fusion's slap bass and organ. Three synchronous layers (SA-5 « Oui, par couches », the engine of journal Passe SN3): `base` the
// rhythm and the riff, `melody` the organ and the lead, `tension` the brass, the strings and the timpani. D minor, the third F natural. An original score.
import { Session, parseLine } from '../../../tools/audio/band/session.mjs';
import { bass, organ, brass, strings, rockGuitar, ewi } from '../../../tools/audio/band/instruments.mjs';
import { chorus, tremolo, compress, pingPong } from '../../../tools/audio/band/dsp.mjs';
import { drum } from '../../../tools/audio/band/drums.mjs';
import { riff } from './theme.mjs';

const hits = (dur, o = {}) => (m, v, take) => brass(m, dur, v, { take, ...o });
const DRIVE = { ride: 'x.o.x.o.x.o.o.', kick: 'X.......X.x...', snare: '....X.......X.' };
const BUILD = { hat: 'x.o.x.o.x.o.o.', kick: 'X.......X.x...', snare: '....X.......Xg' };
const FILL = { kick: 'X.......X.....', snare: '....X...X..gXX', tomH: '......x.......', tomM: '..........x...', crash: '..............' };
const HALF = { hat: 'x.o.x.o.x.o.o.', kick: 'X.............', snare: '........X.....' };

/** the tracks that carry the tune: the band's voicings make room for them */
export const tunes = ['lead'];

export default function score(o = {}) {
  const s = new Session({ id: 'duel', seed: 152, bpm: 152, steps: 14, beat: 4, bars: 37, tail: 3.5, ...o });
  const kit = s.track('kit', { stem: 'base', gain: 0.8, room: 0.12, plate: 0.03, jitter: 0.003, eq: [['hp', 32], ['peak', 3600, 0.9, 2]], fx: (L, R) => compress(L, R, { th: -13, ratio: 3.5, attack: 0.003, release: 0.08, makeup: 2 }) });
  const low = s.track('bass', { stem: 'base', gain: 0.5, room: 0.02, jitter: 0.002, eq: [['hp', 38], ['low', 130, 0.7, 4], ['peak', 300, 1, -3], ['high', 1500, 0.7, -4]], fx: (L, R) => compress(L, R, { th: -12, ratio: 5, attack: 0.002, release: 0.06, makeup: 3 }) });
  const gl = s.track('guitar L', { stem: 'base', pan: -0.78, gain: 0.14, room: 0.06, jitter: 0.004, eq: [['hp', 95], ['peak', 400, 1, -2]] }), gr = s.track('guitar R', { stem: 'base', pan: 0.78, gain: 0.14, room: 0.06, jitter: 0.004, lay: 0.004, eq: [['hp', 95], ['peak', 400, 1, -2]] });
  const org = s.track('organ', { stem: 'melody', pan: -0.14, gain: 0.27, room: 0.14, plate: 0.08, jitter: 0.003, eq: [['hp', 130]], fx: (L, R) => { tremolo(L, R, 6.1, 0.28); chorus(L, R, { rate: 6.1, depth: 0.0007, mix: 0.4 }); } });
  const lead = s.track('lead', { stem: 'melody', gain: 0.26, plate: 0.2, lay: 0.002, eq: [['hp', 240], ['peak', 1100, 0.8, -2.5], ['peak', 3000, 1, 3]], fx: (L, R) => pingPong(L, R, { time: s.span(6), feedback: 0.28, mix: 0.14 }) }); lead.voice = (notes, total) => ewi(notes, total, { seed: 21, porta: 0.022, vibDepth: 0.24, vibRate: 6 });
  const horns = s.track('brass', { stem: 'tension', gain: 0.25, plate: 0.2, hall: 0.08, jitter: 0.004, eq: [['hp', 180], ['peak', 3000, 1, 1.5]], fx: (L, R) => chorus(L, R, { rate: 0.9, depth: 0.0016, mix: 0.22 }) });
  const pad = s.track('strings', { stem: 'tension', gain: 0.27, hall: 0.2, eq: [['hp', 220]] });
  const timp = s.track('timpani', { stem: 'tension', gain: 0.34, hall: 0.14, room: 0.1, jitter: 0.004, eq: [['hp', 45]] });

  /** the guitars double-tracked, each with its own take: power chords on a written line, or the palm's chug */
  const power = (bar, text, { vel = 0.9, muted = false } = {}) => { for (const n of parseLine(text).notes) { const at = bar * s.steps + n.at, b = Math.floor(at / s.steps), st = at - b * s.steps, dur = s.span(n.len) * 0.94; for (const [tr, take] of [[gl, 0], [gr, 1]]) { const [t, v] = tr.human(s.t(b, st), vel); tr.sound(() => rockGuitar([n.midi, n.midi + 7, n.midi + 12], dur, v, muted, take), t, { g: v }, n.midi); } } };
  const walk = (bar, text, kind = 'thumb', vel = 0.84) => s.line(low, (m, v, take) => bass(m, v, kind, take), bar, 0, text, { vel, art: 0.88 });
  const stab = (bar, st, sym, len, vel = 0.86, o = {}) => s.chord(horns, hits(s.span(len) * 0.9, o), bar, st, sym, len, { vel, n: 4, lo: 60, hi: 84 });
  const roll = (bar, steps, v) => { for (let i = 0; i < steps; i++) { const [t, g] = timp.human(s.t(bar, i), v * (0.35 + 0.65 * (i / steps))); timp.sound(() => drum('timp', g, i), t, { g }); } };
  /** the two bars' organ: the off-beat stabs of a Hammond under the riff */
  const comp = (bar, sym) => { s.chord(org, organ, bar, 4, sym, 3, { vel: 0.7, lo: 57, hi: 76, n: 4, strum: 0.002 }); s.chord(org, organ, bar, 10, sym, 3.4, { vel: 0.76, lo: 57, hi: 76, n: 4, strum: 0.002 }); };

  // ---- the gathering: timpani and strings, a held fifth, the bass's first notes
  roll(0, 14, 0.8); s.padNotes(pad, strings, 0, s.span(56), [50, 57, 62, 69], { vel: 0.5, attack: 1.8, release: 0.3 }); roll(2, 14, 0.9); roll(3, 14, 1);
  s.line(low, (m, v, take) => bass(m, v, 'finger', take), 0, 0, 'D2:14 | D2:14', { vel: 0.62, art: 0.96 }); s.drums(kit, 0, 2, { hat: '....x.......x.' }, { vel: 0.6 });
  s.drums(kit, 2, 1, { hat: 'x.o.x.o.x.o.o.' }, { vel: 0.7 }); s.drums(kit, 3, 1, FILL); walk(2, 'D2:4 D2:4 D2:6 | D2:4 D2:4 D2:2 E2:2 F2:2', 'thumb', 0.8);
  stab(3, 8, 'A7alt', 5, 0.8, { fall: 0 });

  const R = ['Dm9', 'C6/9', 'Am11', 'A7sus'];
  const riffBars = (bar, { lead: octave = 0, full = false, groove = BUILD } = {}) => {
    power(bar, riff(2)); walk(bar, full ? 'D2:4 A2:4 A2:2 C3:2 D3:2 | C3:4 A2:4 G2:2 A2:2 C3:2 | A2:4 D3:4 C3:2 A2:2 G2:2 | A2:4 G2:4 E2:2 G2:2 E2:2' : riff(2));
    R.forEach((c, i) => comp(bar + i, c));
    s.drums(kit, bar, 3, groove); s.drums(kit, bar + 3, 1, FILL);
    if (octave) s.phrase(lead, bar, 0, riff(octave), { vel: 0.84, art: 0.94 });
    if (full) { R.forEach((c, i) => { stab(bar + i, 0, c, 3.2, 0.86); stab(bar + i, 8, c, 5.4, 0.8); s.pad(pad, strings, bar + i, 0, c, 13.5, { vel: 0.46, n: 4, lo: 62, hi: 84, attack: 0.2, release: 0.3 }); }); }
  };
  // ---- the riff: alone, then the lead doubles it high
  s.drums(kit, 4, 1, { crash: 'X.............' }); riffBars(4); s.drums(kit, 8, 1, { crash: 'X.............' }); riffBars(8, { lead: 5, groove: DRIVE });

  // ---- the answer: long lines over a bass in 2 + 2 + 3
  const B = ['Bbmaj7#11', 'C13', 'Dm9', 'Am11', 'Bbmaj7#11', 'C13sus', 'Ebmaj9#11', 'A7#9'], OST = ['1...1...1.p.7.', '1...1...1.p.5.'];
  B.forEach((c, i) => { const b = 12 + i; s.bass(low, bass, b, c, OST[i % 2], { slap: true, vel: 0.82 }); s.chord(org, organ, b, 0, c, 13.4, { vel: 0.6, lo: 57, hi: 77, n: 4, strum: 0.002 }); s.pad(pad, strings, b, 0, c, 13.5, { vel: 0.44, n: 4, lo: 60, hi: 84, attack: 0.25, release: 0.4 }); stab(b, 0, c, 3, 0.8); stab(b, 8, c, 3, 0.74); power(b, `${['Bb1', 'C2', 'D2', 'A1', 'Bb1', 'C2', 'Eb2', 'A1'][i]}:14`, { vel: 0.7 }); });
  s.drums(kit, 12, 1, { crash: 'X.............' }); s.drums(kit, 12, 7, DRIVE); s.drums(kit, 19, 1, FILL);
  s.phrase(lead, 12, 0, 'A5:4 C6:4 D6:6 | E6:14~ | D6:8 C6:6 | A5:14~ | G5:4 A5:4 C6:6 | A5:8 G5:6 | Bb5:4 C6:4 D6:6 | C#6:6 E6:8!', { vel: 0.86 });

  // ---- the break: half time, the strings' rising line over the timpani: the second wind
  const H = ['Dm9', 'Bbmaj7#11', 'Gm9', 'A7sus'];
  H.forEach((c, i) => { const b = 20 + i; s.pad(pad, strings, b, 0, c, 13.5, { vel: 0.6, n: 5, lo: 60, hi: 86, attack: 0.25, release: 0.5 }); s.chord(org, organ, b, 0, c, 13.4, { vel: 0.5, lo: 57, hi: 76, n: 4 }); s.bass(low, bass, b, c, '1-----------5-', { vel: 0.8 }); });
  s.drums(kit, 20, 3, HALF); s.drums(kit, 23, 1, { ...HALF, snare: '........X.X.XX', tomL: '............xx' });
  [0, 8].forEach((st) => timp.sound(() => drum('timp', 0.9, st), s.t(20, st), { g: 0.9 })); roll(23, 14, 1);
  s.phrase(lead, 20, 0, 'D6:14~ | F6:8 E6:6 | D6:4 F6:4 G6:6 | A6:14~', { vel: 0.8 });

  // ---- the riff with everything on it, then the fanfare in 7/8 on the brass
  s.drums(kit, 24, 1, { crash: 'X.............' }); riffBars(24, { lead: 5, full: true, groove: DRIVE }); s.drums(kit, 28, 1, { crash: 'X.............' }); riffBars(28, { lead: 6, full: true, groove: DRIVE });
  const T = ['Dm11', 'Em7b5', 'Bbmaj7#11', 'A7#9'];
  T.forEach((c, i) => { const b = 32 + i; [[0, 3.6], [4, 3.6], [8, 5.6]].forEach(([st, len]) => stab(b, st, c, len, 0.92)); power(b, `${['D2', 'E2', 'Bb1', 'A1'][i]}:4 ${['D2', 'E2', 'Bb1', 'A1'][i]}:4 ${['D2', 'E2', 'Bb1', 'A1'][i]}:6`, { vel: 0.9 }); s.bass(low, bass, b, c, '1...1...1...p.', { slap: true, vel: 0.9 }); s.pad(pad, strings, b, 0, c, 13.5, { vel: 0.6, n: 5, lo: 60, hi: 86, attack: 0.2, release: 0.4 }); });
  s.phrase(lead, 32, 0, 'D6:4! D6:4! A5:6 | D6:4! D6:4! E6:6 | D6:4 C6:4 A5:6 | G5:4 E5:4 A5:6~', { vel: 0.92 });
  s.drums(kit, 32, 1, { crash: 'X.............' }); s.drums(kit, 32, 3, { ride: 'X.x.X.x.X.x.x.', kick: 'X...X...X.....', snare: '....X...X..gXX' }); s.drums(kit, 35, 1, { ...FILL, kick: 'X...X...X.....' });
  // ---- the last hit
  s.drums(kit, 36, 1, { crash: 'X.............', kick: 'X.............', snare: 'X.............', tomL: 'X.............' }); stab(36, 0, 'Dm9', 12, 1); power(36, 'D2:14', { vel: 1 }); s.bass(low, bass, 36, 'Dm9', '1-------------', { slap: true, vel: 0.9 }); timp.sound(() => drum('timp', 1, 0), s.t(36, 0), { g: 1 }); s.phrase(lead, 36, 0, 'D6:12~', { vel: 0.92 });
  return s;
}
