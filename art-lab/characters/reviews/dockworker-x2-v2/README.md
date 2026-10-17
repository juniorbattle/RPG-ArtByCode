# dockworker-x2-v2 — review evidence (Pass 4A-sedecies, 2026-10-16)

PRODUCTION ASSET, approved by the operator on 2026-10-17 (manifest `approved`, `runtimeUse: "production"`); reviewed as a candidate. Built by
`node tools/art-lab/build-character.mjs art-lab/characters/rigs/dockworker-x2-v2.rig.mjs` (`--check` rebuilds identically).

| File | What it shows |
|---|---|
| `01-idle-walk-x3.png` | the rig's frames x3: rows front / back / profile (native, facing left); idle 4 frames then walk 6 frames |
| `03-in-scene-walk-cameraB.png` | 1:1 captures from the running game (DEV `?cast=candidate`, camera B, other actors hidden), one walk cycle per row: away from the camera (back), across (profile, mirrored by the renderer), towards the camera (front); frames 133 ms apart |
| `04-scene-C-generated-vs-cast.png` | camera C, same deterministic frame: the generated porter (left) / the dock worker in its place (right) |
| `05-scene-D-generated-vs-cast.png` | camera D, same: the forge-yard porter / the dock worker (cap behind the hooded stranger) |
| `scene-report.json`, `selftest.json` | deterministic A-D comparison (`base` = `894c4d3` served aside, `cur` = this tree by default, `gen` = `?cast=generated`, `cand` = `?cast=candidate`) and the test-2 selftest |

Queries: `seed=1842&clean=1&freeze=7.3&intro=0` + `camera=C&player=8,1` / `camera=D&player=16,2`, `&cast=generated` vs `&cast=candidate`
(deterministic captures: `tools/art-lab/baked-proof.mjs shots`). In-scene walk: the scratch script `walkcam.mjs` of the pass (seeded,
1/60 s steps, the actor sent to four targets).

Measured (JOURNAL, Passe 4A-sedecies): selftest CPU 0 / GPU 0 texels at scale 1, 2, 3, 2.37 (negative controls fail, bleed 0); default boot
pixel-identical to `894c4d3` in A-D; draw calls 108 with and without the cast; GPU within noise.


## Revision of 2026-10-17 (Pass 4A-unvicies): black pixels, at the operator's request

| File | What it shows |
|---|---|
| `06-revision-black-pixels.png` | per animation (row), its first frame x3: the approved sheet (`2eb83d1`) / the revised sheet / the changes on the revised frame dimmed (magenta = texel removed, yellow = recoloured to a neighbouring colour of the approved palette, cyan = added) |
| `07-walk-facing-cameraB.png` | 1:1 captures x2 from the running game (camera B, other actors hidden, seeded, 1/60 s steps; scratch `walkcam2.mjs`), the same walk with the old facing rule (top) and the new one (bottom): along the quay to the left (4 tiles: the old rule showed the front while the figure slides sideways on screen) then away from the camera, 12.6 deg off its axis (2 tiles: back view in both) |

The reconstruction no longer closes short vertical gaps above row 48 (`reconstruct-grid --closing-from=48`): there the closing filled the background seen between hair and shoulders, beside the jaw / neck, with its darkest colour (near-black strokes that read as long hair). Below row 48 it still restores the dark leg and boot outlines, and the legs keep the approved texels (a first attempt without any closing lost them and was abandoned). Back and profile only: the front is the approved v1 export, unchanged. Against the approved sheet: 501 texels removed, 0 added, 0 recoloured, 0 new colours (back and profile mapped onto the approved front's 64 colours, as before). `--check` rebuilds identically; `selftest.json` refreshed (`?baked=dockworker-x2-v2`): CPU 0 / GPU 0 texels at 1, 2, 3, 2.37, negative controls fail, bleed 0. The approval was given for the previous sheet; the revision was merged into main at the operator's request (« si la tache est fini on peut commit/push vers main »), the revised sheet was then reviewed by the operator, its images shown one by one, and **approved on 2026-10-17**: « Les cinq planches révisées me conviennent. » (JOURNAL, Passes 4A-unvicies and 4A-duovicies).
