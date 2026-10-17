# blacksmith-x2-v1 — review evidence (Pass 4A-duodevicies, 2026-10-17)

PRODUCTION ASSET, approved by the operator on 2026-10-17 (manifest `approved`, `runtimeUse: "production"`); reviewed as a candidate. The
game's production cast loads it in place of the generated blacksmith; `?cast=generated` restores the generated sprite. Built by `node tools/art-lab/build-character.mjs art-lab/characters/rigs/blacksmith-x2-v1.rig.mjs`
(`--check` rebuilds identically from the archived sheet).

| File | What it shows |
|---|---|
| `01-frames-x3.png` | every frame x3: idle front / back / profile (4), walk front / back / profile (6), hammer (profile only, 4); the profile faces left (the renderer mirrors it); red line = foot row 90 |
| `02-in-scene-walk-cameraB.png` | 1:1 captures from the running game (DEV `?cast=candidate`, camera B, other actors hidden, 1/60 s steps), x2, one walk cycle per row: away (back), across (profile, mirrored), towards (front) |
| `03-scene-C-forge-generated-vs-candidate.png` | camera C, the same deterministic frame: the generated blacksmith (left) / blacksmith-x2-v1 hammering in its place (right) |
| `04-hammer-in-scene-cameraC.png` | the hammer cycle in game, frames 0-3 (lift, wind-up, strike = the frame the forge throws its sparks on, bounce): generated (top) / candidate (bottom) |
| `scene-report.json`, `selftest.json` | deterministic A-D (+ sabotaged forge) comparison (`base` = `main` at `f34e2f2` served aside, `cur` = this tree by default, `gen` = `?cast=generated`, `cand` = `?cast=candidate`) and the test-2 selftest |

The sheet's NPC 04 holds no tool: the hammer is painted (palette greys and browns). In cameras B and C the forge-work spawn faces away from
the anvil (its facing is the generated blacksmith's, unchanged), so the strike lands on the side opposite the sparks, as it did before.
Measured (JOURNAL, Passe 4A-duodevicies): selftest CPU 0 / GPU 0 texels at 1, 2, 3, 2.37 (negative controls fail, bleed 0); default boot
pixel-identical to `main` in A-D; two blind reviews (4/10, then 6/10), third iteration not re-reviewed.


## Revision of 2026-10-17 (Pass 4A-unvicies): black pixels, at the operator's request

| File | What it shows |
|---|---|
| `05-revision-black-pixels.png` | per animation (row), its first frame x3: the approved sheet (`2eb83d1`) / the revised sheet / the changes on the revised frame dimmed (magenta = texel removed, yellow = recoloured to a neighbouring colour of the approved palette, cyan = added) |

The reconstruction no longer closes short vertical gaps above row 48 (`reconstruct-grid --closing-from=48`): there the closing filled the background seen between hair and shoulders, beside the jaw / neck, with its darkest colour (near-black strokes that read as long hair). Below row 48 it still restores the dark leg and boot outlines, and the legs keep the approved texels (a first attempt without any closing lost them and was abandoned). Against the approved sheet: 930 texels removed, 6 added, 1366 recoloured, 0 new colours (the approved 64-colour palette is pinned, `provenance/blacksmith-x2-v1/palette.png`). Enclosed pinholes of 1-2 texels are filled with the darkest neighbouring colour (6 texels, gaps already in the approved sheet), loose fragments beside the swinging fists removed. `--check` rebuilds identically; `selftest.json` refreshed (`?baked=blacksmith-x2-v1`): CPU 0 / GPU 0 texels at 1, 2, 3, 2.37, negative controls fail, bleed 0. The approval was given for the previous sheet; the revision was merged into main at the operator's request (« si la tache est fini on peut commit/push vers main »), the revised sheet was then reviewed by the operator, its images shown one by one, and **approved on 2026-10-17**: « Les cinq planches révisées me conviennent. » (JOURNAL, Passes 4A-unvicies and 4A-duovicies).

## Rig pass C3 of 2026-10-17 (Pass 4A-duovicies): inherited walk defects, at the operator's request

| File | What it shows |
|---|---|
| `06-rig-c3-before-after.png` | the changed frames x3: the sheet before this pass (`8972e8f9...`, approved) / after / the changes on the revised frame dimmed (magenta = texel removed, cyan = added, yellow = recoloured) |
| `07-rig-c3-walk-in-scene-cameraB.png` | 1:1 captures from the running game (camera B, the character sent walking on the open quay, other actors hidden, seeded, 1/60 s steps): per facing (towards, away, profile left, profile right) one walk cycle, before (upper row) / after (lower row) |

Fixed in the rig script (`rigs/blacksmith-x2-v1.rig.mjs`): back walk 0-5: the outer outline column of each arm runs two texels from the skin, outside the arm mask (skin span + 1), and stayed put while the fist rose (a detached arm outline hanging below it); the fist's bottom row (66 = hipY) belonged to the leg layer and stayed on the leg (the small tabs under the fist) -> the back arm masks take one more texel on the outer side, the arm texels at or below hipY move with the arm, and the leg layer gets the leg texel under them in its column there (else nothing). Against the sheet before: 33 texels removed, 44 added, 45 recoloured, 0 new colours, in 6 frames (walk-up 0, walk-up 1, walk-up 2, walk-up 3, walk-up 4, walk-up 5); same frames, tags and metadata JSON; `--check`
rebuilds identically. Default boot (A, B, C, D, sabotaged C / D, 1920 x 1080, deterministic): 0 px against dab59f9, repeat witness 0 px. Blind critique (fresh agent, random labels, key withheld): revised 7.5/10, previous 5.5/10; every difference a fix (the doubled / ghost arm outline, the strand and the floating fist underside of the back walk), nothing new. Left as they were (inherited): the jagged left shoulder of the front walk (a tick and notches), outline gaps on the left fist that toggle, a small tick beside the right fist. **Approved by the operator on 2026-10-17**: « J'approuve les cinq planches corrigées de la passe C3 pour la production : fusionne cast-rig-fixes dans main, pousse main et supprime la branche. » Not declared a Gold Master.

## Inherited defects -1d (g), 2026-10-17 (Pass 4A-quatervicies), at the operator's request

| File | What it shows |
|---|---|
| `08-inherited-defects-before-after.png` | the changed frames x3: the sheet before this pass (`e830a19f...`, approved) / after / the changes on the revised frame dimmed (magenta = texel removed, cyan = added, yellow = recoloured) |
| `09-inherited-defects-walk-in-scene-cameraB.png` | 1:1 captures from the running game (camera B, the character spawned on the open quay and sent left, right, away and towards the camera, other actors hidden, seeded, 1/60 s steps): per changed facing one walk cycle, before (upper row, `main` served aside) / after (lower row) |

Fixed in the rig script (`rigs/blacksmith-x2-v1.rig.mjs`): front walk 0, 2, 3, 5: the outer outline column of each arm runs two texels from the skin, outside the arm mask (skin span + 1), and stayed put while the arm stretched, squeezed or moved a texel (notched left shoulder and arm); the fist's bottom outline (row 63, under shaded skin the skin test misses) stayed behind when the fist rose (the left fist's outline that came and went) -> the masks widened one texel on the outer side (outer, as the back walk of Pass 4A-duovicies) and the outline row under the fist's last skin row taken with the fist (down); the one-texel notch the inward move then left at the elbow (12, 50) of front walk 3 (second blind critique) closed by closeNotches (inside the arm boxes, a transparent texel between two dark outline texels above and below takes the darker). Against the sheet before: 6 texels removed, 42 added, 11 recoloured, 0 new colours, in 4 frames (walk-down 0, walk-down 2, walk-down 3, walk-down 5); same frames, tags and metadata JSON; `--check`
rebuilds identically; texture selftest exact (CPU 0, GPU 0 at scales 1 / 2 / 3 / 2.37, negative controls failing, bleed 0). Blind critiques (fresh agents, X / Y drawn at random, keys kept out of their reach, self-critique written before): revised 7/10 against previous 6/10 (the fist outlines and corner shape now stable across the six front frames; one new one-frame notch at the elbow, (12, 50) of front walk 3), then, that notch closed, 7.5/10 against 7.3/10 (that one texel). Remaining (inherited): the dotted left-shoulder outline of the front view itself (idle included), a nick under the left fist (x 17), the apron edge without outline under the right fist (front walk 2-3), a one-frame notch at (49, 67) in front walk 5. **Approved by the operator on 2026-10-17**: « J'approuve les cinq planches corrigées des défauts hérités pour la production : fusionne cast-inherited-defects dans main, pousse main et supprime la branche. » Not declared a Gold Master.
