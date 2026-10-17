# older-merchant-x2-v1 — review evidence (Pass 4A-tervicies, 2026-10-17)

CANDIDATE (manifest `status: candidate`, `approved: false`, `runtimeUse: "lab"`): an ambient townsperson of the crowd, NPC 15 "Older Merchant (Male)" of the
operator's reference sheet. With the DEV flag `?cast=candidate` it replaces the generated crowd variant `crowd3` (the ambient wanderers pick one of
crowd0..crowd4 per spawn); production builds never load it until the operator approves it. Built by
`node tools/art-lab/build-character.mjs art-lab/characters/rigs/older-merchant-x2-v1.rig.mjs` (`--check` rebuilds identically). Not declared a Gold Master.

| File | What it shows |
|---|---|
| `01-frames-x3.png` | every frame x3: idle front / back / profile (4), walk front / back / profile (6); the profile faces left (the renderer mirrors it); red line under the foot row 90 |
| `02-in-scene-walk-cameraB.png` | 1:1 captures from the running game (DEV, camera B, `seed=1842`, a fresh `crowd3` actor sent left, right, away and towards the camera on the open quay, other actors hidden, seeded, 1/60 s steps); per facing (towards, away, profile left, profile right) one walk cycle: the generated `crowd3` (`?cast=generated`, upper row) / older-merchant-x2-v1 (`?cast=candidate`, lower row) |
| `selftest.json` | test 2 of the runtime contract (`?baked=older-merchant-x2-v1`): baked block in the main atlas vs the export decoded by the tool |

Walk: front / back: the approved guard's walk (body above the crotch bobs, rigid lower legs behind it); profile: the dock worker's painted IK legs in the view's own trouser ramp (sampled inside a measured box of trouser texels) with the near boot of the view moved rigidly; arms still. Selftest: CPU 0 texels; GPU exact sampling at 1: 0, 2: 0, 3: 0, 2.37: 0 mismatches; negative controls fail as they must (offByOne 8396, linear 12697);
bleed 0 foreign pixels (negative control 37517). Default boot (A, B, C, D, sabotaged C / D, 1920 x 1080,
deterministic): 0 px against `main` (`549aab9`) served aside, repeat witness 0 px (the candidates load only with the DEV flag); scene comparison:
`../crowd-4a-tervicies/`.

Blind critiques (fresh agents, random labels, key withheld, self-critique written first): round 1, the candidate 7/10 in the scene against 3.5/10 for the generated crowd3 (sheet 6.5/10); round 2, revised 6.5/10 against 6/10 (no float or uneven lift from the front, legs no longer near-black) but the two boots merged in profile; round 3, revised 6.5/10 against 6/10 (far boot darker again, idle boot matching the walk), nothing new. Left as they are: arms still, the far foot a small nub behind the shin in profile 1 / 4, apron and shirt colours that differ between facings (as the sheet). **This candidate awaits the operator's review.**
