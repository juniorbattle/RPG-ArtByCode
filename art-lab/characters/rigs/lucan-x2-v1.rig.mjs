// Rig of lucan-x2-v1 (journal Passe GA3, CANDIDATE: never in production without the operator's approval): Lucan Rook, the Red Blade, a generic fighter of the version 2 (src/narrative/generics.ts),
// one of the three the operator kept on the generic fighters' lot sheet (GA-P1 to GA-P3 « Oui, ainsi », GA-P4 « Une tâche à part, après celle-ci », journal Passe GA2), on the
// clean generated sheet lucan-clear-2026-11-07, redrawn from his figure: n° 08, the swordmaster of the tournament casting sheet a (tournament-roster-casting-2026-10-18-a-original), the
// casting's second recipe (lib/clear.mjs, journal Passe CA4). His head 1.1 x from the same source, after the blind critique (a size small beside the cast's men, 84 rows; his portrait's crop on his collar). Standing only: his face in a version 2 game's portraits (a generic is met in portrait only).
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/lucan-x2-v1.rig.mjs`.
import { clearRig } from './lib/clear.mjs';

export const { id, source, prepare, frames } = clearRig({
  "id": "lucan-x2-v1",
  "sheet": "art-lab/characters/reference/sources/lucan-clear-2026-11-07.png",
  "views": {
    "down": "84,231,353,739",
    "up": "858,236,1112,743",
    "side": "1263,236,1465,743"
  },
  "head": 1.1
});
