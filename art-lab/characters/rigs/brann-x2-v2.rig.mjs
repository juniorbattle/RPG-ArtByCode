// Rig of brann-x2-v2 (journal Passe CA4): Sergeant Brann on the clean generated sheet casting-clear-2026-11-01-c, redrawn from the figure the operator chose (journal Passe CA1), the operator's « Les quinze ».
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/brann-x2-v2.rig.mjs`.
import { clearRig } from './lib/clear.mjs';

export const { id, source, prepare, frames } = clearRig({
  "id": "brann-x2-v2",
  "sheet": "art-lab/characters/reference/sources/casting-clear-2026-11-01-c.png",
  "views": {
    "down": "837,100,984,403",
    "up": "1203,102,1343,399",
    "side": "1386,106,1495,403"
  },
  "head": 1.1,
  "chin": 0.3
});
