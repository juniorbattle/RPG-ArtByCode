# courier-x2-v1 — review evidence (Pass 4A-tervicies, 2026-10-17)

PRODUCTION ASSET, approved by the operator on 2026-10-17 (manifest `approved`, `runtimeUse: "production"`); reviewed as a candidate: an ambient townsperson of the crowd, NPC 22 "Courier (Male)" of the
operator's reference sheet. The game's production cast loads it in place of the generated crowd variant `crowd4` (the ambient wanderers pick one of
crowd0..crowd4 per spawn); `?cast=generated` restores the generated sprite. Built by
`node tools/art-lab/build-character.mjs art-lab/characters/rigs/courier-x2-v1.rig.mjs` (`--check` rebuilds identically). Not declared a Gold Master.

| File | What it shows |
|---|---|
| `01-frames-x3.png` | every frame x3: idle front / back / profile (4), walk front / back / profile (6); the profile faces left (the renderer mirrors it); red line under the foot row 90 |
| `02-in-scene-walk-cameraB.png` | 1:1 captures from the running game (DEV, camera B, `seed=1842`, a fresh `crowd4` actor sent left, right, away and towards the camera on the open quay, other actors hidden, seeded, 1/60 s steps); per facing (towards, away, profile left, profile right) one walk cycle: the generated `crowd4` (`?cast=generated`, upper row) / courier-x2-v1 (`?cast=candidate`, lower row) |
| `selftest.json` | test 2 of the runtime contract (`?baked=courier-x2-v1`): baked block in the main atlas vs the export decoded by the tool |

Walk: front / back: the approved guard's walk (body above the crotch bobs, rigid lower legs behind it); profile: the dock worker's painted IK legs in the view's own trouser ramp (sampled inside a measured box of trouser texels) with the near boot of the view moved rigidly; arms still. Selftest: CPU 0 texels; GPU exact sampling at 1: 0, 2: 0, 3: 0, 2.37: 0 mismatches; negative controls fail as they must (offByOne 8256, linear 12619);
bleed 0 foreign pixels (negative control 37517). Default boot (A, B, C, D, sabotaged C / D, 1920 x 1080,
deterministic): 0 px against `main` (`549aab9`) served aside, repeat witness 0 px (the candidates load only with the DEV flag); scene comparison:
`../crowd-4a-tervicies/`.

Blind critiques (fresh agents, random labels, key withheld, self-critique written first): round 1, the candidate 6/10 in the scene against 3/10 for the generated crowd4 (sheet 6/10); round 2, revised 6.5/10 against 5/10 (back view no longer 2 texels high, the ground-shadow slab gone, no limp) but the far leg as light as the near one; round 3, revised 6.5/10 against 5.5/10 (far leg and boot darker, closed sole outline), nothing new. Left as they are: arms still, the guard's bob (0, -2, -1) and 2-texel sideways steps, orange speckle on the scarf, a 3-texel tab under the right sole from behind (frames 3-5). **Approved by the operator on 2026-10-17**, after the five sheets were shown one by one: « J'approuve les cinq citadins pour la production : fusionne cast-crowd dans main, pousse main et supprime la branche. » Not declared a Gold Master.
