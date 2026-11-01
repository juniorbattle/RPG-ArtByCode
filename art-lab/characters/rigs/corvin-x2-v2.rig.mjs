// Rig of corvin-x2-v2 (journal Passe CA4): Master Corvin on the clean generated sheet casting-clear-2026-11-01-b, redrawn from the figure the operator chose (journal Passe CA1), the operator's « Les quinze ».
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/corvin-x2-v2.rig.mjs`.
import { clearRig } from './lib/clear.mjs';

export const { id, source, prepare, frames } = clearRig({
  "id": "corvin-x2-v2",
  "sheet": "art-lab/characters/reference/sources/casting-clear-2026-11-01-b.png",
  "views": {
    "down": "809,98,977,390",
    "up": "1180,99,1323,390",
    "side": "1383,102,1495,390"
  },
  "rows": 83,
  "head": 1.2
});
