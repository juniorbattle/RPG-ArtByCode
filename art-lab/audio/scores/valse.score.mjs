// « Le Tournoi », the market hall's square (journal Passe SN7): the festival's waltz, in the manner of Final Fantasy VIII's ballroom crossed with Chrono Cross's village bands: a jazz
// waltz in 3/4, the flute and the bouzouki on the motif, a chromatic bridge, a ride and a tambourine. D major, the third in the open. An original score, no work reproduced.
import { Session } from '../../../tools/audio/band/session.mjs';
import { rig, nylon, bouzouki, vibes, fretless, strings, loopOf } from './rig.mjs';
import { waltz, lilt } from './theme.mjs';

/** the tracks that carry the tune: the band's voicings make room for them */
export const tunes = ['flute', 'bouzouki'];
const A = ['Dmaj9', 'D9', 'Am7', 'A7sus', 'Dmaj9', 'Bm9', 'Em9', 'A13sus'], B = ['Gmaj9', 'Gm6', 'F#m7', 'Bm9', 'Em9', 'A13', 'Dmaj9', 'A7sus'], TAG = ['Dmaj9', 'Em7', 'Cadd9', 'A9sus'];
const WALTZ = { ride: 'X...x..ox...', hat: '....x.......', kick: 'o...........', rim: '........o...' }, FEAST = { ...WALTZ, tamb: 'x...o...o...', snare: '...g.......g' }, TURN = { ride: 'X...x..ox...', snare: '....x..g.gXg', tomL: '..........x.', kick: 'o.......x...' };
const WALK = ['1---5---3---', '1---3---5---'], OMPAH = (bar, s, tr, sym, v) => { for (const st of [4, 8]) s.chord(tr, nylon, bar, st, sym, 2.6, { vel: st === 4 ? v : v * 0.86, n: 3, lo: 55, hi: 74, strum: 0.01, rel: 0.08 }); };

export default function score(o = {}) {
  const s = new Session({ id: 'valse', seed: 138, bpm: 138, steps: 12, beat: 4, swing: 0.5, bars: 43, tail: 5, ...o, ...loopOf(o, 4, 40) }), r = rig(s);
  const gtr = r.nylon({ gain: 0.46 }), fl = r.flute({ gain: 0.27 }), bouz = r.bouz({ gain: 0.32 }), vib = r.vib({ gain: 0.3 }), low = r.fret({ gain: 0.46, plate: 0.02 }), kit = r.kit({ gain: 0.54, room: 0.2, fx: null, jitter: 0.005, vary: 0.1 }), pad = r.pad({ gain: 0.16 });
  const round = (bar, list, { drums = WALTZ, v = 0.46, fill = true, wash = false } = {}) => list.forEach((c, i) => { const b = bar + i; OMPAH(b, s, gtr, c, v); s.bass(low, fretless, b, c, WALK[b % 2], { vel: 0.7, art: 0.96 }); s.drums(kit, b, 1, fill && i === list.length - 1 ? TURN : drums); if (wash) s.pad(pad, strings, b, 0, c, 11.5, { vel: 0.42, n: 4, lo: 57, hi: 79, attack: 0.3, release: 0.5 }); });

  // ---- the guitar and the bass set the dance going
  round(0, ['Dmaj9', 'Dmaj9', 'Em9', 'A13sus'], { drums: { ride: 'x...o...o...' }, fill: false, v: 0.44 });
  // ---- the motif, dotted, then its second half in the day's major
  round(4, A); s.phrase(fl, 4, 0, `${waltz(5)} | F#5:4 A5:4 B5:4 | G5:6 F#5:2 E5:4 | A5:12`, { vel: 0.72 });
  // ---- again, the bouzouki under the flute, the third itself
  round(12, A, { drums: FEAST, v: 0.5 }); s.phrase(fl, 12, 0, `${waltz(5)} | F#5:4 A5:4 B5:4 | G5:6 F#5:2 E5:4 | A5:12`, { vel: 0.78 }); s.line(bouz, bouzouki, 12, 0, 'F#4:6 F#4:2 F#4:4 | A4:6 F#4:2 E4:4 | E4:6 A4:2 G4:4 | E4:6 D4:2 B3:4 | A4:12 | D4:4 F#4:4 A4:4 | E4:6 D4:2 B3:4 | E4:12', { vel: 0.6, art: 1 });
  // ---- the bridge, the bass falling by semitones, the vibraphone on the tune
  round(20, B, { drums: FEAST, v: 0.5, wash: true }); s.phrase(fl, 20, 0, 'B5:6 D6:2 E6:4 | Bb5:6 D6:2 E6:4 | A5:6 C#6:2 E6:4 | D6:6 C#6:2 B5:4 | G5:6 B5:2 D6:4 | C#6:6 E6:2 G6:4 | F#6:12 | E6:12', { vel: 0.8 }); s.line(vib, vibes, 20, 0, 'B5:6 D6:2 E6:4 | Bb5:6 D6:2 E6:4 | A5:6 C#6:2 E6:4 | D6:6 C#6:2 B5:4', { vel: 0.46, art: 1.2, rel: 0.3, transpose: -12 });
  // ---- the motif a last time, everyone dancing
  round(28, A, { drums: FEAST, v: 0.54, wash: true }); s.phrase(fl, 28, 0, `${waltz(5)} | F#5:4 A5:4 B5:4 | G5:6 F#5:2 E5:4 | A5:12`, { vel: 0.84 });
  s.line(bouz, bouzouki, 28, 0, 'F#4:2 A4:2 D5:2 A4:2 F#4:2 A4:2 | A4:2 C5:2 E5:2 C5:2 A4:2 E4:2 | E4:2 A4:2 C5:2 A4:2 E4:2 G4:2 | E4:2 A4:2 D5:2 A4:2 G4:2 E4:2 | F#4:2 A4:2 D5:2 A4:2 F#4:2 A4:2 | F#4:2 B4:2 A4:2 B4:2 A4:2 F#4:2 | G4:2 B4:2 E5:2 B4:2 E4:2 B4:2 | A4:2 D5:2 E5:2 D5:2 B4:2 E4:2', { vel: 0.62, art: 1.1, rel: 0.1 });
  // ---- the fanfare as a waltz
  round(36, TAG, { drums: FEAST, v: 0.56, wash: true }); s.phrase(fl, 36, 0, lilt.tag, { vel: 0.88 }); s.line(bouz, bouzouki, 36, 0, 'A4:2 A4:2 A4:2 F#4:6 | A4:2 A4:2 A4:2 B4:6 | A4:4 G4:2 E4:4 D4:2 | E4:12', { vel: 0.7, art: 1 });
  if (!s.loop) { s.drums(kit, 40, 1, { ride: 'x...o...o...', tamb: 'x...........' }); OMPAH(40, s, gtr, 'D6/9', 0.5); s.bass(low, fretless, 40, 'D6/9', '1---5---3---', { vel: 0.7, art: 0.96 }); s.chord(gtr, nylon, 41, 0, 'D6/9', 24, { vel: 0.6, n: 3, lo: 55, hi: 74, strum: 0.03, rel: 0.4 }); s.bass(low, fretless, 41, 'D6/9', '1-----------------------', { vel: 0.66, art: 1 }); s.phrase(fl, 41, 0, 'F#6:18~', { vel: 0.76 }); s.drums(kit, 41, 1, { crash: 'x...........', kick: 'o...........' }); }
  return s;
}
