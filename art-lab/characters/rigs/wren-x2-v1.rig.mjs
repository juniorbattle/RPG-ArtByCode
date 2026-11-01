// Rig of wren-x2-v1 (journal Passe CA2): P no. 06, Herald, the operator's casting sheet (journal Passe CA1); a person who only stands, 12 frames.
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/wren-x2-v1.rig.mjs`.
import { standing } from './lib/standing.mjs';

export const { id, source, prepare, frames } = standing({
  id: 'wren-x2-v1',
  sheet: 'art-lab/characters/reference/sources/main-characters-casting-2026-10-18-original.png',
  pitch: 1.66,
  views: { down: '585,474,664,622', up: '682,474,757,622', side: '485,474,573,622' },
  floor: true,
  mirror: [],
});
