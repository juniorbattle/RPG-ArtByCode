// Rig of ilse-x2-v1 (journal Passe CA2): G2 no. 03, Priestess, the operator's casting sheet (journal Passe CA1); a person who only stands, 12 frames.
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/ilse-x2-v1.rig.mjs`.
import { standing } from './lib/standing.mjs';

export const { id, source, prepare, frames } = standing({
  id: 'ilse-x2-v1',
  sheet: 'art-lab/characters/reference/sources/combat-casting-2026-11-01-g2.webp',
  pitch: 1.84,
  views: { down: '1086,54,1153,212', up: '1222,54,1288,212', side: '1157,54,1220,212' },
  options: { closingFrom: 48, bgThreshold: 50 },   // the grey sheet's soft edge (90 ate grey hair and a blue cape, --holes the steel and the faces)
  floor: true,
  mirror: [],
});
