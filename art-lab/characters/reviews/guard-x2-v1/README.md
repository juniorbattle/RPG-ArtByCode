# guard-x2-v1 — review evidence (Pass 4A-duodevicies, 2026-10-17)

PRODUCTION ASSET, approved by the operator on 2026-10-17 (manifest `approved`, `runtimeUse: "production"`); reviewed as a candidate. The
game's production cast loads it in place of BOTH generated guards (guardA, guardB); `?cast=generated` restores the generated sprite. Built by `node tools/art-lab/build-character.mjs art-lab/characters/rigs/guard-x2-v1.rig.mjs`
(`--check` rebuilds identically).

| File | What it shows |
|---|---|
| `01-frames-x3.png` | every frame x3: idle front / back / profile (4), walk front / back / profile (6); profile faces left; red line = foot row 90 |
| `02-in-scene-walk-cameraB.png` | 1:1 in-game walk (DEV `?cast=candidate`, camera B, other actors hidden), x2: away, across, towards. The guards never walk in the current staging (idle at the barrier and in the sabotaged forge); the walk is the cast contract's |
| `03-scene-D-barrier-generated-vs-candidate.png` | camera D, the barrier at the end of the quay: generated guardA / guardB (left) / guard-x2-v1 in both places (right) |
| `04-scene-D-sabotaged-forge-generated-vs-candidate.png` | camera D, `forge=sabotaged`: the whole new cast in one frame (blacksmith on alert, the two guards, the hooded stranger in front; the dock worker on the right is approved) |
| `scene-report.json`, `selftest.json` | as for the blacksmith |

Resampled at pitch 1.95 (the helmet does not fit the frame at 1.775) and shown at the cast's scale 0.9: same texel size as the dock worker,
~10 % smaller than the sheet's unified scale (1.86 m, helmet included). One sheet for both guards: identical uniforms (and faces); the
generated guards' spears are gone (the sheet's guard carries none).


## Revision of 2026-10-17 (Pass 4A-unvicies): black pixels, at the operator's request

| File | What it shows |
|---|---|
| `05-revision-black-pixels.png` | per animation (row), its first frame x3: the approved sheet (`2eb83d1`) / the revised sheet / the changes on the revised frame dimmed (magenta = texel removed, yellow = recoloured to a neighbouring colour of the approved palette, cyan = added) |

The reconstruction no longer closes short vertical gaps above row 48 (`reconstruct-grid --closing-from=48`): there the closing filled the background seen between hair and shoulders, beside the jaw / neck, with its darkest colour (near-black strokes that read as long hair). Below row 48 it still restores the dark leg and boot outlines, and the legs keep the approved texels (a first attempt without any closing lost them and was abandoned). Against the approved sheet: 884 texels removed, 0 added, 893 recoloured, 0 new colours (the approved 64-colour palette is pinned, `provenance/guard-x2-v1/palette.png`). `--check` rebuilds identically; `selftest.json` refreshed (`?baked=guard-x2-v1`): CPU 0 / GPU 0 texels at 1, 2, 3, 2.37, negative controls fail, bleed 0. The approval was given for the previous sheet; the revision was merged into main at the operator's request (« si la tache est fini on peut commit/push vers main »), **the revised sheet itself is not yet reviewed by the operator** (JOURNAL, Passe 4A-unvicies).
