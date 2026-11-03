// The market hall's square (journal Passes SN7 / SN8): the festival's waltz, in the manner of Final Fantasy VIII's ballroom crossed with Chrono Cross's village bands: a
// jazz waltz in 3/4 with a tune of its own on the flute, a bridge in the minor, a ride and a tambourine. B flat major, the third D in the open. The motif hides in the
// bridge's bass, its head one note to a bar (journal Passe SN8: one piece, one tune). An original score, no work reproduced.
import { Session } from '../../../tools/audio/band/session.mjs';
import { rig, nylon, bouzouki, vibes, fretless, slapped, strings, loopOf } from './rig.mjs';

/** the tracks that carry the tune: the band's voicings make room for them */
export const tunes = ['flute'];
const A = ['Bbmaj9', 'Gm9', 'Cm9', 'F13sus', 'Dm7', 'Gm9', 'Cm9', 'F13'], A2 = [...A.slice(0, 7), 'Bbmaj9'], B = ['Gm9/Bb', 'Dm7/F', 'Fm9', 'Abmaj9', 'Dbmaj9/F', 'Ebmaj9', 'F13sus', 'F13'];
const WALTZ = { ride: 'X...x..ox...', hat: '....x.......', kick: 'o...........', rim: '........o...' }, FEAST = { ...WALTZ, tamb: 'x...o...o...', snare: '...g.......g' }, TURN = { ride: 'X...x..ox...', snare: '....x..g.gXg', tomL: '..........x.', kick: 'o.......x...' };
const WALK = ['1---5---3---', '1---3---5---'], OMPAH = (bar, s, tr, sym, v) => { for (const st of [4, 8]) s.chord(tr, nylon, bar, st, sym, 2.6, { vel: st === 4 ? v : v * 0.86, n: 3, lo: 55, hi: 74, strum: 0.01, rel: 0.08 }); };
const TUNE = 'D5:4 F5:4 Bb5:4 | A5:8 G5:4 | G5:6 F5:2 Eb5:4 | F5:12 | F5:4 A5:4 D6:4 | C6:8 Bb5:4';

export default function score(o = {}) {
  const s = new Session({ id: 'valse', seed: 138, bpm: 138, steps: 12, beat: 4, swing: 0.5, bars: 36, tail: 4, ...o, ...loopOf(o, 2, 34) }), r = rig(s);
  const gtr = r.nylon({ gain: 0.46 }), fl = r.flute({ gain: 0.27 }), bouz = r.bouz({ gain: 0.32 }), vib = r.vib({ gain: 0.3 }), low = r.fret({ gain: 0.46, plate: 0.02 }), kit = r.kit({ gain: 0.54, room: 0.2, fx: null, jitter: 0.005, vary: 0.1 }), pad = r.pad({ gain: 0.16 });
  const round = (bar, list, { drums = WALTZ, v = 0.46, fill = true, wash = false, walk = true } = {}) => list.forEach((c, i) => { const b = bar + i; OMPAH(b, s, gtr, c, v); if (walk) s.bass(low, fretless, b, c, WALK[b % 2], { vel: 0.7, art: 0.96 }); s.drums(kit, b, 1, fill && i === list.length - 1 ? TURN : drums); if (wash) s.pad(pad, strings, b, 0, c, 11.5, { vel: 0.42, n: 4, lo: 57, hi: 79, attack: 0.3, release: 0.5 }); });

  // ---- one bar of the bouzouki and the tambourine, one of the guitar with the flute's pickup; the bass comes in with the tune
  s.chord(bouz, bouzouki, 0, 0, 'Bbmaj9', 11, { vel: 0.5, n: 3, lo: 57, hi: 72, strum: 0.03, rel: 0.3 }); s.drums(kit, 0, 1, { tamb: 'x...o...o...' }, { vel: 0.8 });
  round(1, ['F13sus'], { drums: { ride: 'x...o...o...', tamb: 'x...o...o...' }, fill: false, v: 0.44, walk: false }); s.phrase(fl, 1, 4, 'C5:4 Bb4:4', { vel: 0.6 });
  // ---- the tune, twice: it ends open on the dominant, then home
  round(2, A); s.phrase(fl, 2, 0, `${TUNE} | Bb5:6 A5:2 G5:4 | A5:12`, { vel: 0.72 });
  round(10, A2, { drums: FEAST, v: 0.5 }); s.phrase(fl, 10, 0, `${TUNE} | Eb6:6 D6:2 C6:4 | Bb5:12`, { vel: 0.78 });
  s.line(vib, vibes, 13, 4, 'C5:4 Bb4:4', { vel: 0.42, art: 1.2, rel: 0.3 }); s.line(vib, vibes, 15, 4, 'D5:4 F5:4', { vel: 0.42, art: 1.2, rel: 0.3 });
  // ---- the bridge, in the minor: the fretless walks the motif's head a note to a bar, the vibraphone under the flute
  round(18, B, { drums: FEAST, v: 0.5, wash: true, walk: false }); s.line(low, (m, v, take) => slapped(m, v, 'fretless', take), 18, 0, 'Bb1:12 | F2:12 | F2:12 | Ab2:12 | F2:12 | Eb2:12 | F2:24', { vel: 0.72, art: 0.98 });
  s.phrase(fl, 18, 0, 'D6:6 C6:2 Bb5:4 | A5:8 F5:4 | Ab5:6 G5:2 F5:4 | Eb6:8 C6:4 | Db6:6 C6:2 Ab5:4 | Bb5:8 G5:4 | C6:6 Bb5:2 G5:4 | A5:12', { vel: 0.8 }); s.line(vib, vibes, 18, 0, 'D6:6 C6:2 Bb5:4 | A5:8 F5:4 | Ab5:6 G5:2 F5:4 | Eb6:8 C6:4', { vel: 0.44, art: 1.2, rel: 0.3, transpose: -12 });
  // ---- the tune a last time, everyone dancing, the bouzouki's arpeggios against it
  round(26, A, { drums: FEAST, v: 0.54, wash: true }); s.phrase(fl, 26, 0, `${TUNE} | Bb5:6 A5:2 G5:4 | A5:12`, { vel: 0.84 });
  s.line(bouz, bouzouki, 26, 0, 'D4:2 F4:2 A4:2 F4:2 D4:2 F4:2 | D4:2 G4:2 Bb4:2 G4:2 D4:2 A4:2 | Eb4:2 G4:2 C5:2 G4:2 Eb4:2 D4:2 | C4:2 F4:2 Bb4:2 F4:2 C4:2 Eb4:2 | D4:2 F4:2 A4:2 F4:2 C4:2 F4:2 | D4:2 G4:2 Bb4:2 A4:2 G4:2 D4:2 | Eb4:2 G4:2 Bb4:2 G4:2 Eb4:2 D4:2 | C4:2 F4:2 A4:2 Eb4:2 D4:2 C4:2', { vel: 0.6, art: 1.1, rel: 0.1 });
  // ---- the end: a last turn of the dance and a clean stop on the downbeat, the way a ball's waltz ends
  if (!s.loop) { round(34, ['Bbmaj9'], { drums: FEAST, v: 0.54, fill: false }); s.phrase(fl, 34, 0, 'D6:4 C6:4 A5:4', { vel: 0.8 }); s.chord(gtr, nylon, 35, 0, 'Bb6/9', 3, { vel: 0.66, n: 3, lo: 55, hi: 74, strum: 0.015, rel: 0.1 }); s.bass(low, fretless, 35, 'Bb6/9', '1--', { vel: 0.74, art: 0.9 }); s.phrase(fl, 35, 0, 'Bb5:3', { vel: 0.82 }); s.drums(kit, 35, 1, { tamb: 'X...........', kick: 'x...........', ride: 'x...........' }); }
  return s;
}
