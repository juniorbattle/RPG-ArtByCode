// Rig of rhosk-x2-v2 (journal Passe CA4): Rhosk on the clean generated sheet casting-clear-2026-11-01-a, redrawn from the figure the operator chose (journal Passe CA1), the operator's « Les quinze ».
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/rhosk-x2-v2.rig.mjs`.
import { clearRig } from './lib/clear.mjs';

export const { id, source, prepare, frames } = clearRig({
  "id": "rhosk-x2-v2",
  "sheet": "art-lab/characters/reference/sources/casting-clear-2026-11-01-a.png",
  "views": {
    "down": "47,526,264,892",
    "up": "454,531,626,892",
    "side": "643,533,776,892"
  },
  "rows": 82,
  "head": 1.3
});
