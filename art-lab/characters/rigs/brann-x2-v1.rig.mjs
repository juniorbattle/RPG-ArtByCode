// Rig of brann-x2-v1 (journal Passe CA2): P no. 05, Captain of the guards, the operator's casting sheet (journal Passe CA1); a person who only stands, 12 frames.
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/brann-x2-v1.rig.mjs`.
import { standing } from './lib/standing.mjs';

export const { id, source, prepare, frames } = standing({
  id: 'brann-x2-v1',
  sheet: 'art-lab/characters/reference/sources/main-characters-casting-2026-10-18-original.png',
  pitch: 1.72,
  views: { down: '36,474,115,624', up: '215,474,289,624', side: '395,474,454,624' },
  floor: true,
  emblem: { down: [[25, 48, 35, 57], [25, 62, 35, 71]], up: [[33, 46, 50, 66]] },
  plain: { up: [[31, 46, 50, 64]] },
  mirror: ['side'],
});
