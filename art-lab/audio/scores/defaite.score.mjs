// The defeat's jingle (journal Passe SN7): the motif's head alone and slow on the vibraphone, the night's third under it, an answer that does not come: it stops on a suspended chord.
import { Session } from '../../../tools/audio/band/session.mjs';
import { rig, rhodes, vibes, strings, fretless } from './rig.mjs';

export const tunes = ['vibes'];

export default function score(o = {}) {
  const s = new Session({ id: 'defaite', seed: 13, bpm: 66, bars: 2, tail: 5, ...o }), r = rig(s);
  const vib = r.vib({ gain: 0.44 }), keys = r.keysSoft(), low = r.fret(), pad = r.pad({ gain: 0.22, hall: 0.34 });
  s.line(vib, vibes, 0, 0, 'D5:4 A5:4 A5:4 C6:4 | A5:4 G5:12', { vel: 0.6, art: 1.4, rel: 0.6 });
  s.chord(keys, rhodes, 0, 0, 'Dm11', 8, { vel: 0.48, lo: 53, hi: 72, strum: 0.03, rel: 0.4 }); s.chord(keys, rhodes, 0, 8, 'Bbmaj9', 8, { vel: 0.46, lo: 53, hi: 72, strum: 0.03, rel: 0.4 }); s.chord(keys, rhodes, 1, 0, 'A7sus', 20, { vel: 0.44, lo: 53, hi: 72, strum: 0.04, rel: 0.8 });
  s.bass(low, fretless, 0, 'Dm11', '1-------', { vel: 0.6, art: 1 }); s.bass(low, fretless, 0, 'Bbmaj9', '1-------', { vel: 0.58, art: 1, from: 8 }); s.bass(low, fretless, 1, 'A7sus', '1-------------------', { vel: 0.56, art: 1 });
  s.pad(pad, strings, 0, 0, 'Dm11', 15, { vel: 0.4, n: 4, lo: 57, hi: 79, attack: 0.8, release: 1 }); s.pad(pad, strings, 1, 0, 'A7sus', 18, { vel: 0.36, n: 4, lo: 57, hi: 79, attack: 0.8, release: 1.6 });
  return s;
}
