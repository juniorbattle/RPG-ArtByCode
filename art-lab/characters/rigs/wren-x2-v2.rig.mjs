// Rig of wren-x2-v2 (journal Passe CA4): Wren on the clean generated sheet casting-clear-2026-11-01-c, redrawn from the figure the operator chose (journal Passe CA1), the operator's « Les quinze ».
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/wren-x2-v2.rig.mjs`.
import { clearRig } from './lib/clear.mjs';

export const { id, source, prepare, frames } = clearRig({
  "id": "wren-x2-v2",
  "sheet": "art-lab/characters/reference/sources/casting-clear-2026-11-01-c.png",
  "views": {
    "down": "835,546,983,853",
    "up": "1199,554,1336,851",
    "side": "1368,551,1506,853"
  },
  "head": 1.1,
  "chin": 0.36
});
