// Rig of pip-x2-v1 (journal Passe CA2): b no. 19, Traveling Merchant, the operator's casting sheet (journal Passe CA1); a person who only stands, 12 frames.
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/pip-x2-v1.rig.mjs`.
import { standing } from './lib/standing.mjs';

export const { id, source, prepare, frames } = standing({
  id: 'pip-x2-v1',
  sheet: 'art-lab/characters/reference/sources/tournament-roster-casting-2026-10-18-b-original.png',
  pitch: 1.38,
  views: { down: '1083,926,1141,1040', up: '1322,926,1370,1040', side: '1375,926,1418,1040' },
  floor: true,
  k: 32,
  mirror: ['side'],
});
