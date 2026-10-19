# hero-x2-v3 — review evidence (Pass H8, 2026-10-19)

CANDIDATE, NOT APPROVED (manifest `status: "candidate"`, `approved: false`, `runtimeUse: "lab"`): the retouched premium hero, built from the
GENERATED, NON-CANONICAL eight-view turnaround `reference/sources/hero-turnaround-v4-2026-10-19-b.png` (gpt-image-2, journal Passe I1), the
source the operator chose on the decision sheet (H4 « Source : la b »; H1 « Retouches d'abord (visage, palette) »; H3 « Cinq vues, le héros
d'abord »; journal Passe D1). Shown on the player in DEV only (`?cast=candidate`; the three-quarter facings with `?views=5`, journal Passe V5).
Production, approval and any Gold Master status are the operator's decision. Built by
`node tools/art-lab/build-character.mjs art-lab/characters/rigs/hero-x2-v3.rig.mjs` (`--check` rebuilds identically).

| File | What it shows |
|---|---|
| `01-export-x3.png` | the export's 60 frames x3 with tags and durations: idle 4 and run 8 in five facings (down, up, side, downSide = three-quarter front, upSide = three-quarter back) |
| `02-in-scene-B.png` | 1:1 crop of a deterministic capture (DEV, camera B, `seed=1842&forge=normal&clean=1&freeze=7.3&player=-3.1,1.2&cast=candidate`, 120 steps): the hero idle among the cast, the face readable (two eyes under the fringe) |
| `03-run-upSide-x4.png` | the three-quarter back run x4: body bob, the near leg lifted, the near gauntlet dropping on its forward swing, the far boot under the cape's hem |
| `04-run-downSide-x4.png` | the three-quarter front run x4 |
| `05-in-scene-D.png` | 1:1 crop of the same harness in camera D (`player=19,3.6&camera=D&cast=candidate&views=5`, 120 steps): the hero idle on the frontage |
| `06-v2-vs-v3-idle-x3.png` | x3: top, hero-x2-v2 idle front / profile / back (the three facings); bottom, hero-x2-v3 front, three-quarter front, profile, three-quarter back, back |
| `07-h9-face-before-after-x8.png` | Pass H9, the face retouched at the texel (decision H1): the idle head x8, front / three-quarter front / profile; top before (Pass H8), bottom after |
| `08-h9-in-scene-before-after-x5.png` | Pass H9 in the scene: crops x5 of deterministic 1080p captures (DEV, `seed=1842&forge=normal&clean=1&freeze=7.3&cast=candidate&views=5`, 120 steps, the player's facing set before the render), top camera B (`player=-3.1,1.2`), bottom camera D (`player=19,3.6&camera=D`); per facing (front, three-quarter front, profile) before then after |

Images 01-06 show the export of Pass H8 (the face before the Pass H9 retouch); only the faces changed since (JOURNAL, Passe H9).

Measures (the runtime's own functions): `walkSlide` 14 (the profile run is hero-x2-v2's, the v3 sheet's drawn run, on this palette): 3.73 m/s,
4.48 m/s with the run key. Foot slip in motion (`tools/foot-slip.mjs --secs=3`, median): B -0.07, D -0.07 (the quantisation of Pass H6).
Keyboard directions on screen (the player at the framings' reference spots): w / s at 3-13 deg from the vertical in B / C (front / back), 33-35
deg in A / D (three-quarter with `?views=5`); the diagonals at 69-79 deg (profile). Flipbooks in D (`KEYS=w` and `KEYS=s`, three views against
five) were reviewed in the browser (scratch, not versioned; attached to the operator's review). Blind critique: see JOURNAL, Passe H8.
