// The band's palette (journal Passe SN5): each instrument alone on the motif, to judge a timbre apart from a piece. Three bars each, in the order of LIST.
import { Session } from '../../../tools/audio/band/session.mjs';
import { rhodes, bass, nylon, bouzouki, eguitar, vibes, marimba, organ, brass, strings, ewi, flute, rockGuitar } from '../../../tools/audio/band/instruments.mjs';
import { chorus, tremolo } from '../../../tools/audio/band/dsp.mjs';
import { fusionHead } from './theme.mjs';

export const LIST = ['Piano électrique', 'Basse au pouce (slap)', 'Basse fretless', 'Guitare nylon', 'Bouzouki', 'Guitare électrique', 'Guitare rock', 'Vibraphone', 'Marimba', 'Orgue', 'Cuivres', 'Cordes', 'Synthé à vent', 'Flûte de bois'];
export const tunes = [];

export default function score(o = {}) {
  const s = new Session({ id: 'palette', seed: 5, bpm: 100, bars: LIST.length * 3, tail: 3, ...o });
  const dry = s.track('dry', { gain: 0.34, room: 0.16, plate: 0.1, eq: [['hp', 30]] }), low = s.track('low', { gain: 0.5, room: 0.04, eq: [['hp', 34], ['low', 130, 0.7, 4], ['peak', 300, 1, -3], ['high', 1500, 0.7, -4]] });
  const wide = s.track('wide', { gain: 0.34, plate: 0.16, fx: (L, R) => chorus(L, R, { rate: 0.7, mix: 0.4 }), eq: [['hp', 120]] }), vib = s.track('vib', { gain: 0.5, plate: 0.16, fx: (L, R) => tremolo(L, R, 4.6, 0.22), eq: [['hp', 200]] });
  const pad = s.track('pad', { gain: 0.5, hall: 0.2, eq: [['hp', 220]] }), lead = s.track('lead', { gain: 0.34, plate: 0.2, eq: [['hp', 220], ['peak', 1100, 0.8, -2.5], ['peak', 3000, 1, 2.5]] }), fl = s.track('flute', { gain: 0.42, hall: 0.2, eq: [['hp', 260], ['peak', 3400, 1, 2]] });
  lead.voice = (notes, total) => ewi(notes, total, { seed: 7, vibDepth: 0.2 }); fl.voice = (notes, total) => flute(notes, total, { seed: 11 });
  let bar = 0; const next = () => { const b = bar; bar += 3; return b; };
  const head = (o2) => `${fusionHead(o2)} | D${o2}:12`;
  { const b = next(); ['D13sus', 'Am11', 'Gmaj9'].forEach((c, i) => { s.chord(wide, rhodes, b + i, 0, c, 6, { vel: 0.62, lo: 54, hi: 74 }); s.chord(wide, rhodes, b + i, 8, c, 5, { vel: 0.5, lo: 54, hi: 74 }); }); }
  s.line(low, (m, v, take) => bass(m, v, 'thumb', take), next(), 0, head(2), { vel: 0.84, art: 0.86 });
  s.line(low, (m, v, take) => bass(m, v, 'fretless', take), next(), 0, head(2), { vel: 0.8, art: 0.95 });
  s.line(dry, nylon, next(), 0, head(4), { vel: 0.7, art: 1.2, rel: 0.2 });
  s.line(dry, bouzouki, next(), 0, head(4), { vel: 0.7, art: 1.2, rel: 0.2 });
  s.line(dry, (m, v, take) => eguitar(m, v, 'clean', take), next(), 0, head(4), { vel: 0.7, art: 1 });
  { const b = next(), at = (st) => s.t(b, st); [[38, 0, 6], [45, 8, 6], [43, 16, 6], [38, 24, 12]].forEach(([m, st, len]) => { const d = s.span(len) * 0.94; dry.sound(() => rockGuitar([m, m + 7, m + 12], d, 0.9), at(st), { g: 0.34 }, m); }); }
  s.line(vib, vibes, next(), 0, head(5), { vel: 0.68, art: 1.3, rel: 0.4 });
  s.line(dry, marimba, next(), 0, head(5), { vel: 0.7, art: 1.2, rel: 0.1 });
  s.line(wide, organ, next(), 0, head(4), { vel: 0.7, art: 0.96 });
  { const b = next(); ['D13sus', 'Am11', 'Gmaj9'].forEach((c, i) => { s.chord(wide, (m, v, take) => brass(m, s.span(5.4), v, { take }), b + i, 0, c, 5.4, { vel: 0.8, lo: 60, hi: 81 }); s.chord(wide, (m, v, take) => brass(m, s.span(5.4), v, { take }), b + i, 8, c, 5.4, { vel: 0.74, lo: 60, hi: 81 }); }); }
  { const b = next(); ['D13sus', 'Am11', 'Gmaj9'].forEach((c, i) => s.pad(pad, strings, b + i, 0, c, 15, { vel: 0.6, attack: 0.5, release: 0.6 })); }
  s.phrase(lead, next(), 0, head(5), { vel: 0.8 });
  s.phrase(fl, next(), 0, head(5), { vel: 0.72 });
  return s;
}
