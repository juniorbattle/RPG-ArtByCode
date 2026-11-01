// Rig of hilde-x2-v2 (journal Passe CA4): Hilde on the clean generated sheet casting-clear-2026-11-01-b, redrawn from the figure the operator chose (journal Passe CA1), the operator's « Les quinze ».
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/hilde-x2-v2.rig.mjs`.
import { clearRig } from './lib/clear.mjs';

export const { id, source, prepare, frames } = clearRig({
  "id": "hilde-x2-v2",
  "sheet": "art-lab/characters/reference/sources/casting-clear-2026-11-01-b.png",
  "views": {
    "down": "809,568,965,848",
    "up": "1179,570,1321,848",
    "side": "1376,574,1509,849"
  },
  "head": 1.12
});
