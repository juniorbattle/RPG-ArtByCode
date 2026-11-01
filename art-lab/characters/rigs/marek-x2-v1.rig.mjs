// Rig of marek-x2-v1 (journal Passe CA2): G1 panel 3, the operator's casting sheet (journal Passe CA1); he or she walks in a cutscene, 30 frames.
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/marek-x2-v1.rig.mjs`.
import { standing } from './lib/standing.mjs';

export const { id, source, prepare, frames } = standing({
  "id": "marek-x2-v1",
  "sheet": "art-lab/characters/reference/sources/combat-casting-2026-11-01-g1.webp",
  "pitch": 2,
  "views": {
    "down": "1045,25,1141,190",
    "up": "1415,25,1516,190",
    "side": "1231,25,1307,190"
  },
  "options": {
    "closingFrom": 48,
    "bgThreshold": 50
  },
  "floor": true,
  "plain": { "up": [[25, 46, 40, 69]] },
  "head": { "k": 1.3 },
  "emblem": { "down": [[27, 42, 37, 51], [26, 58, 38, 71]], "up": [[24, 49, 38, 69], [12, 71, 50, 80]], "side": [[38, 49, 56, 78]] },
  "mirror": [],
  "walk": {
    "head": { "k": 1.3 },
    "pitch": 1.58,
    "mirror": true,
    "boxes": [
      "1034,202,1124,331",
      "1122,202,1212,331",
      "1207,202,1297,331",
      "1294,202,1368,331",
      "1374,202,1448,331",
      "1454,202,1527,331"
    ],
    "down": {
      "crotch": 68,
      "split": 32
    },
    "up": {
      "crotch": 80,
      "split": 32
    }
  }
});
