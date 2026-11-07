// Rig of corra-x2-v1 (journal Passe GA1, CANDIDATE: never in production without the operator's approval): Corra Dunmere, a generic fighter of the version 2 (lot L2b,
// src/narrative/generics.ts), on the clean generated sheet corra-clear-2026-11-07, redrawn from the figure the operator chose (L2-11 « Ces trois figures, une tâche à part
// après la fusion », journal Passe EVL4: panel 2 of the G1 casting sheet, the lady with the staff), the casting's second recipe (lib/clear.mjs, journal Passe CA4). Standing only:
// her face in a version 2 game's portraits (a generic is met in portrait only).
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/corra-x2-v1.rig.mjs`.
import { clearRig } from './lib/clear.mjs';

export const { id, source, prepare, frames } = clearRig({
  "id": "corra-x2-v1",
  "sheet": "art-lab/characters/reference/sources/corra-clear-2026-11-07.png",
  "views": {
    "down": "57,195,359,832",
    "up": "824,200,1124,829",
    "side": "1218,198,1473,834"
  },
  "head": 1.2
});
