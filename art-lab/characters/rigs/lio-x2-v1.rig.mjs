// Rig of lio-x2-v1 (journal Passe CA2): N2 no. 23, Tavern Owner, the operator's casting sheet (journal Passe CA1); a person who only stands, 12 frames.
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/lio-x2-v1.rig.mjs`.
import { standing } from './lib/standing.mjs';

export const { id, source, prepare, frames } = standing({
  id: 'lio-x2-v1',
  sheet: 'art-lab/characters/reference/sources/merchant-district-night-npc-17-24.webp',
  pitch: 2.15,
  views: { down: '37,830,155,1016', up: '474,830,586,1016', side: '160,830,247,1016' },
  floor: true,
  mirror: [],
});
