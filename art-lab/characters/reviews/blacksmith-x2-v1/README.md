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
