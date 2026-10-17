# townswoman-x2-v1 — review evidence (Pass 4A-tervicies, 2026-10-17)

PRODUCTION ASSET, approved by the operator on 2026-10-17 (manifest `approved`, `runtimeUse: "production"`); reviewed as a candidate: an ambient townsperson of the crowd, NPC 09 "Townswoman (Female)" of the
operator's reference sheet. The game's production cast loads it in place of the generated crowd variant `crowd2` (the ambient wanderers pick one of
crowd0..crowd4 per spawn); `?cast=generated` restores the generated sprite. Built by
`node tools/art-lab/build-character.mjs art-lab/characters/rigs/townswoman-x2-v1.rig.mjs` (`--check` rebuilds identically). Not declared a Gold Master.

| File | What it shows |
|---|---|
| `01-frames-x3.png` | every frame x3: idle front / back / profile (4), walk front / back / profile (6); the profile faces left (the renderer mirrors it); red line under the foot row 90 |
| `02-in-scene-walk-cameraB.png` | 1:1 captures from the running game (DEV, camera B, `seed=1842`, a fresh `crowd2` actor sent left, right, away and towards the camera on the open quay, other actors hidden, seeded, 1/60 s steps); per facing (towards, away, profile left, profile right) one walk cycle: the generated `crowd2` (`?cast=generated`, upper row) / townswoman-x2-v1 (`?cast=candidate`, lower row) |
| `selftest.json` | test 2 of the runtime contract (`?baked=townswoman-x2-v1`): baked block in the main atlas vs the export decoded by the tool |

Walk: the approved merchant's walk (body and dress bob and shift their weight, the hem lags, the boots are rigid parts behind the dress; profile: one boot of the view and a darker copy on the dock worker's ankle cycle); arms still. Selftest: CPU 0 texels; GPU exact sampling at 1: 0, 2: 0, 3: 0, 2.37: 0 mismatches; negative controls fail as they must (offByOne 7176, linear 11232);
bleed 0 foreign pixels (negative control 37517). Default boot (A, B, C, D, sabotaged C / D, 1920 x 1080,
deterministic): 0 px against `main` (`549aab9`) served aside, repeat witness 0 px (the candidates load only with the DEV flag); scene comparison:
`../crowd-4a-tervicies/`.

Blind critiques (fresh agents, random labels, key withheld, self-critique written first): round 1, the candidate 6.5/10 in the scene against 3/10 for the generated crowd2 (sheet 6/10); round 2, revised 5.5/10 against 4/10 (profile shoes instead of thin pins, weight shift halved) but the two shoes merged into one long sole in profile 4-5; round 3 (11-column shoe) lost to round 2, 6 against 6.5: the dark toe outline was cut, rejected; round 4 (final, 13-column shoe, far shoe 0.16 darker, pinholes filled) 6.5/10 against round 2's 6/10, nothing new. Left as they are: arms still, no apron and a brown skirt in profile (as the sheet's 4th view), an open bonnet outline at the top left, one-texel spurs and hem nubs. **Approved by the operator on 2026-10-17**, after the five sheets were shown one by one: « J'approuve les cinq citadins pour la production : fusionne cast-crowd dans main, pousse main et supprime la branche. » Not declared a Gold Master.
