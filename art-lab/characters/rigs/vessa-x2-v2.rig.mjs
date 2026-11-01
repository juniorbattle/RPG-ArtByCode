// Rig of vessa-x2-v2 (journal Passe CA4): Vessa Lark on the clean generated sheet casting-clear-2026-11-01-e, redrawn from the figure the operator chose (journal Passe CA1), the operator's « Les quinze ».
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/vessa-x2-v2.rig.mjs`.
import { clearRig } from './lib/clear.mjs';

export const { id, source, prepare, frames } = clearRig({
  "id": "vessa-x2-v2",
  "sheet": "art-lab/characters/reference/sources/casting-clear-2026-11-01-e.png",
  "views": {
    "down": "96,96,294,502",
    "up": "684,112,862,502",
    "side": "949,117,1104,502"
  },
  "rows": 84
});
