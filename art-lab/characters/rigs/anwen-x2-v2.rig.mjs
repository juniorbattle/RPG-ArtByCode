// Rig of anwen-x2-v2 (journal Passe CA4): Sister Anwen on the clean generated sheet casting-clear-2026-11-01-c, redrawn from the figure the operator chose (journal Passe CA1), the operator's « Les quinze ».
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/anwen-x2-v2.rig.mjs`.
import { clearRig } from './lib/clear.mjs';

export const { id, source, prepare, frames } = clearRig({
  "id": "anwen-x2-v2",
  "sheet": "art-lab/characters/reference/sources/casting-clear-2026-11-01-c.png",
  "views": {
    "down": "60,113,204,403",
    "up": "441,114,575,399",
    "side": "614,114,721,403"
  },
  "head": 1.1,
  "chin": 0.3
});
