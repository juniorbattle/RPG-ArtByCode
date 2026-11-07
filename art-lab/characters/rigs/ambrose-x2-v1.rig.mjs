// Rig of ambrose-x2-v1 (journal Passe GA1, CANDIDATE: never in production without the operator's approval): Brother Ambrose, a generic fighter of the version 2 (lot L2b,
// src/narrative/generics.ts), on the clean generated sheet ambrose-clear-2026-11-07, redrawn from the figure the operator chose (L2-11 « Ces trois figures, une tâche à part
// après la fusion », journal Passe EVL4: panel 4 of the G1 casting sheet, the lantern-bearer), the casting's second recipe (lib/clear.mjs, journal Passe CA4). Standing only:
// his face in a version 2 game's portraits (a generic is met in portrait only). bgThreshold 14: his dark cloak, close to the sheet's ground, was flooded at 26.
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/ambrose-x2-v1.rig.mjs`.
import { clearRig } from './lib/clear.mjs';

export const { id, source, prepare, frames } = clearRig({
  "id": "ambrose-x2-v1",
  "sheet": "art-lab/characters/reference/sources/ambrose-clear-2026-11-07.png",
  "views": {
    "down": "56,172,400,823",
    "up": "795,172,1147,829",
    "side": "1207,174,1454,833"
  },
  "head": 1.1,
  "bgThreshold": 14
});
