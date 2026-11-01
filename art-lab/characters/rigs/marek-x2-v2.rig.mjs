// Rig of marek-x2-v2 (journal Passe CA4): Marek Varn on the clean generated sheet casting-clear-2026-11-01-a, redrawn from the figure the operator chose (journal Passe CA1), the operator's « Les quinze ».
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/marek-x2-v2.rig.mjs`.
import { clearRig } from './lib/clear.mjs';

export const { id, source, prepare, frames } = clearRig({
  "id": "marek-x2-v2",
  "sheet": "art-lab/characters/reference/sources/casting-clear-2026-11-01-a.png",
  "views": {
    "down": "49,86,249,424",
    "up": "444,86,601,424",
    "side": "632,86,758,424"
  },
  "rows": 80,
  "head": 1.3,
  "walk": {
    "sheet": "art-lab/characters/reference/sources/casting-clear-2026-11-01-walk.png",
    "boxes": [
      "127,114,274,414",
      "364,113,511,414",
      "575,113,747,413",
      "820,114,982,414",
      "1037,118,1214,416",
      "1269,120,1441,418"
    ],
    "down": {
      "crotch": 68,
      "split": 32
    },
    "up": {
      "crotch": 76,
      "split": 32
    }
  }
});
