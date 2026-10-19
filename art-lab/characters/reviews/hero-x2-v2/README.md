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

## Pass H6 (2026-10-19, cloud session without Aseprite) — the rig prepared, the export NOT rebuilt

The operator's decision of Pass F1, word for word: « Héros plus rapide (Recommandé) » (keep the drawn stride, about 3.5-4 m/s, the run key
to revisit; no more legs lifted 9 texels in the front run: « une monte de genou »). The rig `rigs/hero-x2-v2.rig.mjs` now puts the planted foot
on a 14-texel-per-frame track (the sheet's contact-to-gathered span in two frames instead of three of 9), makes the fourth frame of each step a
flight (the figure 2 rows above the foot row) and lifts the front / back legs 5 texels at most. **The committed export, `.aseprite` and pack are
still Pass H5's** (this session had no Aseprite): `verify-provenance` reports the rig's hash until the operator rebuilds.

| File | What it shows |
|---|---|
| `07-h6-run-before-after-x3.png` | rows 1-2: the profile run, Pass H5 export (9 texels per frame) then the Pass H6 rig (14, flight frames 4 and 8); rows 3-4: the front run, H5 then H6 (lift 9 -> 5). The H6 frames were built here by `build-character.mjs` steps 1-4 (the reconstruction reproduces the H5 export's 36 frames at 0 texels), not exported by Aseprite |
| `08-turnaround-eight-views-x3.png` | the sheet's idle views reconstructed at the hero's pitch and palette: front, 2nd view (three-quarter front), profile, back, 5th (a back), 6th, 7th (right side): the study of `briefs/three-quarter-views.md` |

To finish on the operator's machine (Aseprite):
`node tools/art-lab/build-character.mjs art-lab/characters/rigs/hero-x2-v2.rig.mjs` (writes the export, the `.aseprite`, `build.json` and the pack's
file table), then `--check`, `node tools/art-lab/verify-provenance.mjs art-lab/characters/provenance/hero-x2-v2`, `node tools/art-lab/stride.mjs`
is production-only: the hero's `walkSlide` must read 14 (`ActorSystem.playerSpeed` then gives 3.73 m/s, the run key 4.48 m/s).

## Pass H7 (2026-10-19, the operator's machine) — the export rebuilt from the Pass H6 rig

`build-character.mjs` with Aseprite 1.3.18.6 wrote the export, the `.aseprite`, `build.json` and the pack's file table; `--check` rebuilds identically,
`verify-provenance` reports the pack intact, the JSON (frames, durations, tags) and the reconstructed views are unchanged. The engine's `walkSlide`
reads 14 (Pass H5 export: 9): 3.73 m/s, 4.48 m/s with the run key. Foot slip in motion (`tools/foot-slip.mjs --secs=3`, median): A +0.05, B -0.03,
C -0.10, D -0.07 walking; A +0.01, B -0.03, C -0.07, D -0.01 with the run key (the quantisation of Pass H6). Still a CANDIDATE: the operator decides
in game (`?cast=candidate`).

| File | What it shows |
|---|---|
| `09-h7-export-x3.png` | the rebuilt export's 36 frames x3 with their tags and durations (`tools/art-lab/make-contact-sheet.mjs`): idle front / back / profile, the front and back runs (legs lifted 5 texels at most), the profile run with its flight frames (4th and 8th) |

## Pass G1 (2026-10-19) — the v4-b turnaround at the hero's pitch, a preview for the operator's decision

| File | What it shows |
|---|---|
| `10-v4b-views-vs-current-x3.png` | x3 nearest on grey: top, hero-x2-v2 idle front / profile / back (export frames 0, 8, 4); bottom, five views of the GENERATED, NON-CANONICAL sheet `reference/sources/hero-turnaround-v4-2026-10-19-b.png` (front, three-quarter front, profile, three-quarter back, back) reconstructed with `reconstruct-grid.mjs` at pitch 3.4, frame 64 x 96, feet on row 90, `--holes --no-shadow --closing-from=48` (85-87 rows). A preview only: nothing is built from that sheet until the operator decides (decision sheet, H4) |
