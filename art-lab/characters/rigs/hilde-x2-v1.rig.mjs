// Rig of hilde-x2-v1 (journal Passe CA2): G2 no. 05, itinerant merchant, the operator's casting sheet (journal Passe CA1); a person who only stands, 12 frames.
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/hilde-x2-v1.rig.mjs`.
import { standing } from './lib/standing.mjs';

export const { id, source, prepare, frames } = standing({
  id: 'hilde-x2-v1',
  sheet: 'art-lab/characters/reference/sources/combat-casting-2026-11-01-g2.webp',
  pitch: 1.72,
  views: { down: '501,608,597,756', up: '695,608,768,756', side: '600,608,691,756' },
  options: { closingFrom: 48, bgThreshold: 50 },   // the grey sheet's soft edge (90 ate grey hair and a blue cape, --holes the steel and the faces)
  floor: true,
  pocket: [104, 107, 108],
  mirror: [],
});
