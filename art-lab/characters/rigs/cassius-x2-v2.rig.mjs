// Rig of cassius-x2-v2 (journal Passe CA4): Cassius Dree on the clean generated sheet casting-clear-2026-11-01-a, redrawn from the figure the operator chose (journal Passe CA1), the operator's « Les quinze ».
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/cassius-x2-v2.rig.mjs`.
import { clearRig } from './lib/clear.mjs';

export const { id, source, prepare, frames } = clearRig({
  "id": "cassius-x2-v2",
  "sheet": "art-lab/characters/reference/sources/casting-clear-2026-11-01-a.png",
  "views": {
    "down": "829,543,1003,887",
    "up": "1203,547,1355,886",
    "side": "1386,553,1503,888"
  },
  "rows": 83,
  "head": 1.2
});
