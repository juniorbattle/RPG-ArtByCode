// Rig of ilse-x2-v2 (journal Passe CA4): Ilse Morrow on the clean generated sheet casting-clear-2026-11-01-b, redrawn from the figure the operator chose (journal Passe CA1), the operator's « Les quinze ».
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/ilse-x2-v2.rig.mjs`.
import { clearRig } from './lib/clear.mjs';

export const { id, source, prepare, frames } = clearRig({
  "id": "ilse-x2-v2",
  "sheet": "art-lab/characters/reference/sources/casting-clear-2026-11-01-b.png",
  "views": {
    "down": "66,571,204,851",
    "up": "438,571,567,850",
    "side": "625,574,740,850"
  },
  "head": 1.12,
  "chin": 0.27
});
