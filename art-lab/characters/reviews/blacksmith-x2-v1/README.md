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

The reconstruction no longer closes short vertical gaps above row 48 (`reconstruct-grid --closing-from=48`): there the closing filled the background seen between hair and shoulders, beside the jaw / neck, with its darkest colour (near-black strokes that read as long hair). Below row 48 it still restores the dark leg and boot outlines, and the legs keep the approved texels (a first attempt without any closing lost them and was abandoned). Against the approved sheet: 930 texels removed, 6 added, 1366 recoloured, 0 new colours (the approved 64-colour palette is pinned, `provenance/blacksmith-x2-v1/palette.png`). Enclosed pinholes of 1-2 texels are filled with the darkest neighbouring colour (6 texels, gaps already in the approved sheet), loose fragments beside the swinging fists removed. `--check` rebuilds identically; `selftest.json` refreshed (`?baked=blacksmith-x2-v1`): CPU 0 / GPU 0 texels at 1, 2, 3, 2.37, negative controls fail, bleed 0. The approval was given for the previous sheet; the revision was merged into main at the operator's request (« si la tache est fini on peut commit/push vers main »), **the revised sheet itself is not yet reviewed by the operator** (JOURNAL, Passe 4A-unvicies).
