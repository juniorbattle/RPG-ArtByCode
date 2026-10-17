# hooded-x2-v1 — review evidence (Pass 4A-duodevicies, 2026-10-17)

PRODUCTION ASSET, approved by the operator on 2026-10-17 (manifest `approved`, `runtimeUse: "production"`); reviewed as a candidate. The
game's production cast loads it in place of the generated hooded stranger; `?cast=generated` restores the generated sprite. Built by `node tools/art-lab/build-character.mjs art-lab/characters/rigs/hooded-x2-v1.rig.mjs`
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


## Revision of 2026-10-17 (Pass 4A-unvicies): black pixels, at the operator's request

| File | What it shows |
|---|---|
| `04-revision-black-pixels.png` | per animation (row), its first frame x3: the approved sheet (`2eb83d1`) / the revised sheet / the changes on the revised frame dimmed (magenta = texel removed, yellow = recoloured to a neighbouring colour of the approved palette, cyan = added) |

The reconstruction no longer closes short vertical gaps above row 48 (`reconstruct-grid --closing-from=48`): there the closing filled the background seen between hair and shoulders, beside the jaw / neck, with its darkest colour (near-black strokes that read as long hair). Below row 48 it still restores the dark leg and boot outlines, and the legs keep the approved texels (a first attempt without any closing lost them and was abandoned). Against the approved sheet: 441 texels removed, 4 added, 1558 recoloured, 0 new colours (the approved 64-colour palette is pinned, `provenance/hooded-x2-v1/palette.png`). Enclosed pinholes of 1-2 texels are filled with the darkest neighbouring colour (4 texels, gaps already in the approved sheet). `--check` rebuilds identically; `selftest.json` refreshed (`?baked=hooded-x2-v1`): CPU 0 / GPU 0 texels at 1, 2, 3, 2.37, negative controls fail, bleed 0. The approval was given for the previous sheet; the revision was merged into main at the operator's request (« si la tache est fini on peut commit/push vers main »), the revised sheet was then reviewed by the operator, its images shown one by one, and **approved on 2026-10-17**: « Les cinq planches révisées me conviennent. » (JOURNAL, Passes 4A-unvicies and 4A-duovicies).
