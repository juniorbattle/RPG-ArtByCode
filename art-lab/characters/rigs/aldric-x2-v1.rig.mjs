// Rig of aldric-x2-v1 (journal Passe GA1, CANDIDATE: never in production without the operator's approval): Ser Aldric Venn, a generic fighter of the version 2 (lot L2b,
// src/narrative/generics.ts), on the clean generated sheet aldric-clear-2026-11-07, redrawn from the figure the operator chose (L2-11 « Ces trois figures, une tâche à part
// après la fusion », journal Passe EVL4: the knight n° 07 of the main characters' casting sheet), the casting's second recipe (lib/clear.mjs, journal Passe CA4). Standing only:
// his face in a version 2 game's portraits (a generic is met in portrait only).
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/aldric-x2-v1.rig.mjs`.
import { clearRig } from './lib/clear.mjs';

export const { id, source, prepare, frames } = clearRig({
  "id": "aldric-x2-v1",
  "sheet": "art-lab/characters/reference/sources/aldric-clear-2026-11-07.png",
  "views": {
    "down": "75,192,347,783",
    "up": "807,199,1076,785",
    "side": "1227,195,1429,784"
  },
  "rows": 88
});
