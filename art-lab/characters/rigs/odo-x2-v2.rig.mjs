// Rig of odo-x2-v2 (journal Passe CA4): Clerk Odo on the clean generated sheet casting-clear-2026-11-01-b, redrawn from the figure the operator chose (journal Passe CA1), the operator's « Les quinze ».
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/odo-x2-v2.rig.mjs`.
import { clearRig } from './lib/clear.mjs';

export const { id, source, prepare, frames } = clearRig({
  "id": "odo-x2-v2",
  "sheet": "art-lab/characters/reference/sources/casting-clear-2026-11-01-b.png",
  "views": {
    "down": "73,100,198,390",
    "up": "440,100,562,390",
    "side": "631,106,723,390"
  },
  "rows": 82,
  "head": 1.25
});
