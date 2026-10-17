# hooded-x2-v1 — review evidence (Pass 4A-duodevicies, 2026-10-17)

PRODUCTION CANDIDATE, not approved (manifest `candidate`, `runtimeUse: "lab"`): the production cast skips it; DEV `?cast=candidate` shows it
in place of the generated hooded stranger. Built by `node tools/art-lab/build-character.mjs art-lab/characters/rigs/hooded-x2-v1.rig.mjs`
(`--check` rebuilds identically).

| File | What it shows |
|---|---|
| `01-frames-x3.png` | every frame x3: idle front / back / profile (4), walk front / back / profile (6); profile faces left; red line = foot row 90 |
| `02-in-scene-walk-cameraB.png` | 1:1 in-game walk (DEV `?cast=candidate`, camera B, other actors hidden), x2: away, across, towards (the stranger only stands in the current staging) |
| `03-scene-B-boat-generated-vs-candidate.png` | camera B, the stranger watching the boat: generated (left) / hooded-x2-v1 (right) |
| `scene-report.json`, `selftest.json` | as for the blacksmith; the sabotaged forge shot is in `../guard-x2-v1/` |

Reconstructed with `reconstruct-grid --bg-threshold=16` (the navy cloak is close to the sheet's background: the default 26 cut slits into
the back of the cloak), pitch 1.95 (the hood does not fit at 1.775), scale 0.9 (the cast's texel size, ~10 % smaller than the sheet's unified
scale). Kept from the sheet on purpose: the dark values, the bright hands, the face in the hood's shadow (no eye glint, unlike the generated one).
