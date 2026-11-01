// Rig of pip-x2-v2 (journal Passe CA4): Pip on the clean generated sheet casting-clear-2026-11-01-d, redrawn from the figure the operator chose (journal Passe CA1), the operator's « Les quinze ».
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/pip-x2-v2.rig.mjs`.
import { clearRig } from './lib/clear.mjs';

export const { id, source, prepare, frames } = clearRig({
  "id": "pip-x2-v2",
  "sheet": "art-lab/characters/reference/sources/casting-clear-2026-11-01-d.png",
  "views": {
    "down": "58,578,201,869",
    "up": "457,578,596,867",
    "side": "638,578,767,872"
  },
  "head": 1.1,
  "chin": 0.36
});
