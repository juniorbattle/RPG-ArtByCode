// Rig of vessa-x2-v1 (journal Passe CA2): a no. 11, Duelist, the operator's casting sheet (journal Passe CA1); a person who only stands, 12 frames.
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/vessa-x2-v1.rig.mjs`.
import { standing } from './lib/standing.mjs';

export const { id, source, prepare, frames } = standing({
  id: 'vessa-x2-v1',
  sheet: 'art-lab/characters/reference/sources/tournament-roster-casting-2026-10-18-a-original.png',
  pitch: 1.46,
  views: { down: '1117,580,1178,692', up: '1243,580,1298,692', side: '1185,580,1241,692' },
  options: { closingFrom: 84 },   // a small figure: the closing from row 48 draws black stripes under her hem
  floor: true,
  mirror: [],
});
