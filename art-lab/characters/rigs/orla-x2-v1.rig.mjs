// Rig of orla-x2-v1 (journal Passe CA2): G1 panel 5, the operator's casting sheet (journal Passe CA1); he or she walks in a cutscene, 30 frames.
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/orla-x2-v1.rig.mjs`.
import { standing } from './lib/standing.mjs';

export const { id, source, prepare, frames } = standing({
  "id": "orla-x2-v1",
  "sheet": "art-lab/characters/reference/sources/combat-casting-2026-11-01-g1.webp",
  "pitch": 2.04,
  "views": {
    "down": "524,534,617,706",
    "up": "914,534,1010,706",
    "side": "619,534,709,706"
  },
  "options": {
    "closingFrom": 48,
    "bgThreshold": 50
  },
  "floor": true,
  "head": { "k": 1.2 },
  
  "pocket": [103, 104, 102],
  "mirror": [],
  "walk": {
    "head": { "k": 1.2 },
    "pitch": 1.56,
    "mirror": true,
    "order": [
      2,
      3,
      4,
      5,
      2,
      3
    ],
    "boxes": [
      "519,721,620,855",
      "617,721,700,855",
      "699,721,775,855",
      "782,721,857,855",
      "862,721,937,855",
      "937,721,1012,855"
    ],
    "down": {
      "crotch": 68,
      "split": 32
    },
    "up": {
      "crotch": 74,
      "split": 32
    }
  }
});
