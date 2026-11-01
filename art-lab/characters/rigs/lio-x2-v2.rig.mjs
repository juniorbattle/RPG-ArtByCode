// Rig of lio-x2-v2 (journal Passe CA4): Lio on the clean generated sheet casting-clear-2026-11-01-c, redrawn from the figure the operator chose (journal Passe CA1), the operator's « Les quinze ».
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/lio-x2-v2.rig.mjs`.
import { clearRig } from './lib/clear.mjs';

export const { id, source, prepare, frames } = clearRig({
  "id": "lio-x2-v2",
  "sheet": "art-lab/characters/reference/sources/casting-clear-2026-11-01-c.png",
  "views": {
    "down": "48,539,221,850",
    "up": "432,545,599,847",
    "side": "632,546,742,850"
  },
  "head": 1.1
});
