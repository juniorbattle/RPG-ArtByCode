// Rig of cassius-x2-v1 (journal Passe CA2): G2 no. 06, Rival, the operator's casting sheet (journal Passe CA1); a person who only stands, 12 frames.
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/cassius-x2-v1.rig.mjs`.
import { standing } from './lib/standing.mjs';

export const { id, source, prepare, frames } = standing({
  id: 'cassius-x2-v1',
  sheet: 'art-lab/characters/reference/sources/combat-casting-2026-11-01-g2.webp',
  pitch: 1.8,
  views: { down: '992,604,1075,756', up: '1217,604,1285,756', side: '1157,604,1215,756' },
  options: { closingFrom: 48, bgThreshold: 50 },   // the grey sheet's soft edge (90 ate grey hair and a blue cape, --holes the steel and the faces)
  floor: true,
  head: { k: 1.2 },
  mirror: [],
});
