// Rig of orla-x2-v2 (journal Passe CA4): Orla Brask on the clean generated sheet casting-clear-2026-11-01-a, redrawn from the figure the operator chose (journal Passe CA1), the operator's « Les quinze ».
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/orla-x2-v2.rig.mjs`.
import { clearRig } from './lib/clear.mjs';

export const { id, source, prepare, frames } = clearRig({
  "id": "orla-x2-v2",
  "sheet": "art-lab/characters/reference/sources/casting-clear-2026-11-01-a.png",
  "views": {
    "down": "824,88,994,426",
    "up": "1204,92,1367,426",
    "side": "1386,100,1514,426"
  },
  "head": 1.15,
  "walk": {
    "sheet": "art-lab/characters/reference/sources/casting-clear-2026-11-01-walk.png",
    "boxes": [
      "115,579,274,866",
      "352,579,509,866",
      "555,578,720,866",
      "810,579,962,866",
      "1034,582,1214,866",
      "1273,582,1437,867"
    ],
    "down": {
      "crotch": 66,
      "split": 32
    },
    "up": {
      "crotch": 66,
      "split": 32
    }
  }
});
