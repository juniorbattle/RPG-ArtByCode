// Rig of anwen-x2-v1 (journal Passe CA2): P no. 11, Priestess, the operator's casting sheet (journal Passe CA1); a person who only stands, 12 frames.
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/anwen-x2-v1.rig.mjs`.
import { standing } from './lib/standing.mjs';

export const { id, source, prepare, frames } = standing({
  id: 'anwen-x2-v1',
  sheet: 'art-lab/characters/reference/sources/main-characters-casting-2026-10-18-original.png',
  pitch: 1.76,
  views: { down: '35,864,122,1018', up: '214,864,286,1018', side: '134,864,201,1018' },
  floor: true,
  mirror: [],
});
