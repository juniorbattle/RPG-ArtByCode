# hero-x2-v1 — review evidence (Pass H3, 2026-10-18/19)

EXPERIMENTAL, NOT APPROVED (manifest `status: "experimental"`, `runtimeUse: "lab"`): the premium hero built from the operator's individual sheet
v2 (`reference/sources/hero-turnaround-v2-2026-10-18.png`), shown in the scene in DEV (`?cast=candidate`, an entry removed since) and turned down by
the operator: « Il s'affiche mais enorment de probleme deja il semble avoir des proportions differents aux autres pnjjs sprite travaille et surtout
les animations de marche deplacement non c'est mauvais, bras qui ne bouge pas, les jambes qui ne soont pas alignes et donne l'impression qui marche
de maniere decale » ; « on voit le ddefaut clairement sur ce runntime capture du protagnoist enrain de marcher avec les jambes cuisses trop haute et
les bras immobiles ». Way forward chosen by the operator: « Planche v3 (Recommandé) » (prompt v3, `../../briefs/hero-proposal.md` section 5).
Built by `node tools/art-lab/build-character.mjs art-lab/characters/rigs/hero-x2-v1.rig.mjs` (`--check` rebuilds identically).

| File | What it shows |
|---|---|
| `01-in-scene-B-v2.png` | 1:1 crop of a deterministic capture (DEV, camera B, `seed=1842&forge=normal&clean=1&freeze=7.3&player=-4.6,0.6&cast=candidate`, 120 steps of 1/60 s): the hero standing among the cast; his head is visibly smaller than the merchant's, the dock worker's and the traveler's |
| `02-lineup-cast-front-x3.png` | idle front x3, same scale and ground line: hero-x2-v1, dockworker-x2-v2, traveler-x2-v1, courier-x2-v1, merchant-x2-v2 |
| `03-run-side-legs-before-after-x3.png` | the profile run's six frames: upper row as shown in the scene (the knees driven up under the pouches: « cuisses trop haute »), lower row after the rig's fix (longer legs, hip higher, knees below the pouches, legs centred under the torso) |
| `04-frames-x3.png` | every frame x3 after the fix: idle 4 + run 6, front / back / profile (the profile faces left; the renderer mirrors it) |

Measures (the cast read the same way): head, top to chin, 24 rows of 85 (0.28) against 0.31-0.32 for the dock worker, the traveler and the courier
and about 0.35 for the merchant; face about 13 texels wide against 22-25. Profile run: planted foot 9 texels per frame (`walkSlide`), clock x1.56 in
B / D at 2.5 m/s (unchanged by the legs' fix: same stance positions, flat foot); foot slip, measured on the frames shown in the scene before
that fix (player held on a movement key, seeded harness, median): A +0.09 (the clock's x1.6 bound), B -0.02, C -0.05, D -0.02; known bad case,
the run key (4.25 m/s) in B: -1.09. No blind critique was run: the operator's own review came first and sent the work back to the
source.
