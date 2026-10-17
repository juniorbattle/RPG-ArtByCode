# traveler-x2-v1 — review evidence (Pass 4A-tervicies, 2026-10-17)

PRODUCTION ASSET, approved by the operator on 2026-10-17 (manifest `approved`, `runtimeUse: "production"`); reviewed as a candidate: an ambient townsperson of the crowd, NPC 07 "Traveler (Male)" of the
operator's reference sheet. The game's production cast loads it in place of the generated crowd variant `crowd1` (the ambient wanderers pick one of
crowd0..crowd4 per spawn); `?cast=generated` restores the generated sprite. Built by
`node tools/art-lab/build-character.mjs art-lab/characters/rigs/traveler-x2-v1.rig.mjs` (`--check` rebuilds identically). Not declared a Gold Master.

| File | What it shows |
|---|---|
| `01-frames-x3.png` | every frame x3: idle front / back / profile (4), walk front / back / profile (6); the profile faces left (the renderer mirrors it); red line under the foot row 90 |
| `02-in-scene-walk-cameraB.png` | 1:1 captures from the running game (DEV, camera B, `seed=1842`, a fresh `crowd1` actor sent left, right, away and towards the camera on the open quay, other actors hidden, seeded, 1/60 s steps); per facing (towards, away, profile left, profile right) one walk cycle: the generated `crowd1` (`?cast=generated`, upper row) / traveler-x2-v1 (`?cast=candidate`, lower row) |
| `selftest.json` | test 2 of the runtime contract (`?baked=traveler-x2-v1`): baked block in the main atlas vs the export decoded by the tool |

Walk: front / back: the approved guard's walk (body above the crotch bobs, rigid lower legs behind it); profile: the dock worker's painted IK legs in the view's own trouser ramp (sampled inside a measured box of trouser texels) with the near boot of the view moved rigidly; arms still. Selftest: CPU 0 texels; GPU exact sampling at 1: 0, 2: 0, 3: 0, 2.37: 0 mismatches; negative controls fail as they must (offByOne 7796, linear 12093);
bleed 0 foreign pixels (negative control 37517). Default boot (A, B, C, D, sabotaged C / D, 1920 x 1080,
deterministic): 0 px against `main` (`549aab9`) served aside, repeat witness 0 px (the candidates load only with the DEV flag); scene comparison:
`../crowd-4a-tervicies/`.

Blind critiques (fresh agents, random labels, key withheld, self-critique written first): round 1, the candidate 6.5/10 in the scene against 3/10 for the generated crowd1 (sheet 6/10); round 2, revised 6/10 against 5/10 (brown painted legs, no shard between the legs, feet on one ground line); round 3, revised 6.5/10 against 6/10 (the far leg darker, the back idle boot set down), nothing new. Left as they are: arms still, no backpack in profile (the sheet's 4th view has none), a dark corner between the legs from behind, a small spike at the pack's right edge. **Approved by the operator on 2026-10-17**, after the five sheets were shown one by one: « J'approuve les cinq citadins pour la production : fusionne cast-crowd dans main, pousse main et supprime la branche. » Not declared a Gold Master.
