# hero-x2-v2 — review evidence (Pass H5, 2026-10-19)

CANDIDATE, NOT APPROVED (manifest `status: "candidate"`, `approved: false`, `runtimeUse: "lab"`): the premium hero built from the operator's
base sheet (`reference/sources/hero-turnaround-v3-2026-10-19.png`, chosen by the operator: « Oui : archive 2.png et construis le héros depuis
elle, cape sans motif doré sur l'ourlet. »), shown on the player in DEV only (`?cast=candidate`). Production, approval and any Gold Master status
are the operator's decision. Built by `node tools/art-lab/build-character.mjs art-lab/characters/rigs/hero-x2-v2.rig.mjs` (`--check` rebuilds
identically).

| File | What it shows |
|---|---|
| `01-in-scene-B.png` | 1:1 crop of a deterministic capture (DEV, camera B, `seed=1842&forge=normal&clean=1&freeze=7.3&player=-4.6,0.6&cast=candidate`, 120 steps of 1/60 s), the same place as `../hero-x2-v1/01-in-scene-B-v2.png`: the hero idle among the cast. The dotted ring around his head is the quay lamp's occlusion reveal (the lamp stands between the camera and him), not the sprite |
| `02-lineup-cast-front-x3.png` | idle front x3, same scale and ground line: hero-x2-v2, hero-x2-v1 (turned down), dockworker-x2-v2, traveler-x2-v1, courier-x2-v1, merchant-x2-v2 |
| `03-run-side-x3.png` | the profile run's eight frames x3 (facing left, the renderer mirrors it): the sheet's own drawn upper bodies and legs (frames 4 and 8 reuse the legs of frames 3 and 7, the sheet drawing only contact and gathered poses); every frame's drawn legs are sheared from the hip so that the planted foot moves 9 texels per frame |
| `04-run-front-back-x2.png` | the run seen from the front (8 frames) and from the back (8 frames) x2: body bob and weight shift, cape sway, each leg lifted under the body, the hands dropping on their forward swing |
| `05-in-scene-D.png` | 1:1 crop of the same harness in camera D (`player=16,1.2&camera=D`, 120 steps): the hero idle on the frontage at night, the guards at the barrier |

Measures (the runtime's own functions): front 84 rows, 1.777 m at the cast's 0.9 scale; head about 0.33 of the height (cast 0.31-0.35);
profile run: planted foot 9 texels per frame (`walkSlide`), clock x1.56 in B / D, x1.52 in C, x1.6 (the bound) in A at 2.5 m/s. Foot slip in motion
(the player held on a movement key, seeded harness, median): B -0.02, C -0.05, D -0.02; A: no side-walk period measured in that run; the run key
(4.25 m/s) in B: -1.09 (known, to be decided). A flipbook of the run in B and D was reviewed in the browser (scratch, not versioned). Blind critique (fresh agent, random labels, against
dockworker-x2-v2): a light halo of the sheet's grey background around the contour, confirmed on the pixels (6.2 % of the edge texels against
0.8-1 % for the cast) and peeled in the rig (0.5 %); see JOURNAL, Passe H5.
