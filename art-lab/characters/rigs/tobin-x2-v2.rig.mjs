// Rig of tobin-x2-v2 (journal Passe CA4): Tobin Fenn on the clean generated sheet casting-clear-2026-11-01-d, redrawn from the figure the operator chose (journal Passe CA1), the operator's « Les quinze ».
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/tobin-x2-v2.rig.mjs`.
import { clearRig } from './lib/clear.mjs';

export const { id, source, prepare, frames } = clearRig({
  "id": "tobin-x2-v2",
  "sheet": "art-lab/characters/reference/sources/casting-clear-2026-11-01-d.png",
  "views": {
    "down": "853,156,987,447",
    "up": "1201,156,1334,450",
    "side": "1380,164,1487,449"
  },
  "rows": 83,
  "head": 1.2
});
