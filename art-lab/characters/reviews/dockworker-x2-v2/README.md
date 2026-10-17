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

## Rig pass C3 of 2026-10-17 (Pass 4A-duovicies): inherited walk defects, at the operator's request

| File | What it shows |
|---|---|
| `08-rig-c3-before-after.png` | the changed frames x3: the sheet before this pass (`afe693cd...`, approved) / after / the changes on the revised frame dimmed (magenta = texel removed, cyan = added, yellow = recoloured) |
| `09-rig-c3-walk-in-scene-cameraB.png` | 1:1 captures from the running game (camera B, the character sent walking on the open quay, other actors hidden, seeded, 1/60 s steps): per facing (towards, away, profile left, profile right) one walk cycle, before (upper row) / after (lower row) |

Fixed in the rig script (`rigs/dockworker-x2-v2.rig.mjs`): front walk 2-3 / 0, 5 and back walk 0, 2, 3, 5: a forearm moved down (2 rows) by R.movePart left the rows it uncovered at the top of its mask filled sideways with the vest's dark colour or transparent: a dark band cutting the sleeve, notches at its edge, a 5 x 2 hole in the back (back walk 5) -> those rows take, column by column, the texel just above the mask wherever the forearm has texels in that column (the sleeve continues down); and the back right arm's mask reaches x 52: the sleeve's outline columns 50-52 stayed put when the forearm moved in, a seam down the arm (back walk 0) and a lone outline texel (back walk 2-3); and the left back fist's bottom outline (row 66 = hipY) belonged to the leg layer and stayed put when the fist rose (a loose dark dash beside the thigh, back walk 0 / 5) -> the left back arm mask reaches row 66, those texels move with the arm and the leg layer gets the leg texel under them (else nothing). Against the sheet before: 35 texels removed, 117 added, 158 recoloured, 0 new colours, in 9 frames (walk-down 0, walk-down 2, walk-down 3, walk-down 5, walk-up 0, walk-up 2, walk-up 3, walk-up 4, walk-up 5); same frames, tags and metadata JSON; `--check`
rebuilds identically. Default boot (A, B, C, D, sabotaged C / D, 1920 x 1080, deterministic): 0 px against dab59f9, repeat witness 0 px. Blind critique, three rounds (a fresh agent each, random labels, key withheld): round 1 revised 7.5/10 vs 5.5/10 but a one-texel notch created by the first fix and an inherited seam down the back right arm; round 2 (both reworked) 7.5/10 vs 5/10, an inherited loose dash beside the thigh (back walk 0 / 5); round 3 (reworked) revised 8/10, previous 5/10, every difference a fix. Side effects noted: the stretched arm lengthens a little in motion, a one-texel elbow jog (back walk 0). Left as they were (inherited): the cap's thick dark top bar with broken corners, single-texel breaks at the wrist, the trouser hem and the profile hip. **Approved by the operator on 2026-10-17**: « J'approuve les cinq planches corrigées de la passe C3 pour la production : fusionne cast-rig-fixes dans main, pousse main et supprime la branche. » Not declared a Gold Master.

## Inherited defects -1d (h), 2026-10-17 (Pass 4A-quatervicies), at the operator's request

| File | What it shows |
|---|---|
| `10-inherited-defects-before-after.png` | the changed frames x3: the sheet before this pass (`49d289ad...`, approved) / after / the changes on the revised frame dimmed (magenta = texel removed, cyan = added, yellow = recoloured) |
| `11-inherited-defects-walk-in-scene-cameraB.png` | 1:1 captures from the running game (camera B, the character spawned on the open quay and sent left, right, away and towards the camera, other actors hidden, seeded, 1/60 s steps): per changed facing one walk cycle, before (upper row, `main` served aside) / after (lower row) |

Fixed in the rig script (`rigs/dockworker-x2-v2.rig.mjs`): every frame of the three facings: the cap's top was a thick dark bar (front: two rows) with broken corners -> in prepare(), the front bar's row 2 removed, the missing outline steps at the corners drawn in the outline's colour and the holes inside the cap's edge given the cap colour beside them (capOutline, recorded coordinates; the front view is the approved v1 export, edited here, not in the export); front / back walk: the forward forearm moved two rows down, a two-row stretch of the sleeve that read as the arm lengthening -> one row. Against the sheet before: 169 texels removed, 147 added, 775 recoloured, 0 new colours, in 30 frames (idle-down 0, idle-down 1, idle-down 2, idle-down 3, idle-up 0, idle-up 1, idle-up 2, idle-up 3, idle-side 0, idle-side 1, idle-side 2, idle-side 3, walk-down 0, walk-down 1, walk-down 2, walk-down 3, walk-down 4, walk-down 5, walk-up 0, walk-up 1, walk-up 2, walk-up 3, walk-up 4, walk-up 5, walk-side 0, walk-side 1, walk-side 2, walk-side 3, walk-side 4, walk-side 5); same frames, tags and metadata JSON; `--check`
rebuilds identically; texture selftest exact (CPU 0, GPU 0 at scales 1 / 2 / 3 / 2.37, negative controls failing, bleed 0). Blind critique (fresh agent, X / Y drawn at random, key kept out of its reach, self-critique written before): revised 7.5/10, previous 6/10; every cap defect fixed in the three views and the arm stretch halved, no hole, break or pop added; costs: a smaller, asymmetric swing (+1 / -2 rows, still readable) and the front crown one texel lower. Remaining (inherited): the sleeve compressed two rows on the back swing, an unoutlined strap edge in front walk 2-3, a weak profile arm swing and merging profile boots. **Approved by the operator on 2026-10-17**: « J'approuve les cinq planches corrigées des défauts hérités pour la production : fusionne cast-inherited-defects dans main, pousse main et supprime la branche. » Not declared a Gold Master.
