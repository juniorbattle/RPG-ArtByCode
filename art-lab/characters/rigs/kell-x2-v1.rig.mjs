// Rig of kell-x2-v1 (journal Passe GA3, CANDIDATE: never in production without the operator's approval): Kell Barrow, the Bare Fist, a generic fighter of the version 2 (src/narrative/generics.ts),
// one of the three the operator kept on the generic fighters' lot sheet (GA-P1 to GA-P3 « Oui, ainsi », GA-P4 « Une tâche à part, après celle-ci », journal Passe GA2), on the
// clean generated sheet kell-clear-2026-11-07, redrawn from his figure: n° 14, the martial artist of the tournament casting sheet a (tournament-roster-casting-2026-10-18-a-original), the
// casting's second recipe (lib/clear.mjs, journal Passe CA4). His head 1.2 x from the same source (23 texels wide at 1, 29 to 34 for the casting), on 83 rows as Cassius and Tobin. Standing only: his face in a version 2 game's portraits (a generic is met in portrait only).
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/kell-x2-v1.rig.mjs`.
import { clearRig } from './lib/clear.mjs';

export const { id, source, prepare, frames } = clearRig({
  "id": "kell-x2-v1",
  "sheet": "art-lab/characters/reference/sources/kell-clear-2026-11-07.png",
  "views": {
    "down": "94,175,353,830",
    "up": "850,175,1108,830",
    "side": "1226,177,1455,830"
  },
  "rows": 83,
  "head": 1.2
});
