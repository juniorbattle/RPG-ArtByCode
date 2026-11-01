// Rig of tobin-x2-v1 (journal Passe CA2): G2 no. 01, Cedric, the operator's casting sheet (journal Passe CA1); a person who only stands, 12 frames.
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/tobin-x2-v1.rig.mjs`.
import { standing } from './lib/standing.mjs';

export const { id, source, prepare, frames } = standing({
  id: 'tobin-x2-v1',
  sheet: 'art-lab/characters/reference/sources/combat-casting-2026-11-01-g2.webp',
  pitch: 1.76,
  views: { down: '105,59,172,210', up: '242,59,325,210', side: '182,59,240,210' },
  options: { closingFrom: 48, bgThreshold: 50 },   // the grey sheet's soft edge (90 ate grey hair and a blue cape, --holes the steel and the faces)
  floor: true,
  mirror: [],
});
