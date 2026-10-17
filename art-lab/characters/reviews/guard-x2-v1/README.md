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

The reconstruction no longer closes short vertical gaps above row 48 (`reconstruct-grid --closing-from=48`): there the closing filled the background seen between hair and shoulders, beside the jaw / neck, with its darkest colour (near-black strokes that read as long hair). Below row 48 it still restores the dark leg and boot outlines, and the legs keep the approved texels (a first attempt without any closing lost them and was abandoned). Against the approved sheet: 884 texels removed, 0 added, 893 recoloured, 0 new colours (the approved 64-colour palette is pinned, `provenance/guard-x2-v1/palette.png`). `--check` rebuilds identically; `selftest.json` refreshed (`?baked=guard-x2-v1`): CPU 0 / GPU 0 texels at 1, 2, 3, 2.37, negative controls fail, bleed 0. The approval was given for the previous sheet; the revision was merged into main at the operator's request (« si la tache est fini on peut commit/push vers main »), the revised sheet was then reviewed by the operator, its images shown one by one, and **approved on 2026-10-17**: « Les cinq planches révisées me conviennent. » (JOURNAL, Passes 4A-unvicies and 4A-duovicies).

## Rig pass C3 of 2026-10-17 (Pass 4A-duovicies): inherited walk defects, at the operator's request

| File | What it shows |
|---|---|
| `06-rig-c3-before-after.png` | the changed frames x3 (front walk 0, 2, 3, 5; back idle 0, the same pinhole in every back frame; profile walk 0, 2, 5): the sheet before this pass (`fa8224c1...`, approved) / after / the changes on the revised frame dimmed (magenta = texel removed, cyan = added, yellow = recoloured) |
| `07-rig-c3-walk-in-scene-cameraB.png` | 1:1 captures from the running game (camera B, the barrier guard sent walking on the open quay, other actors hidden, seeded, 1/60 s steps): per facing (towards, away, profile left, profile right) one walk cycle, before (upper row) / after (lower row); guards stand still in the game today, so these frames only show when one walks |

The defects found by the blind critique of Pass 4A-unvicies, each traced to the rig script and fixed there (`rigs/guard-x2-v1.rig.mjs`):
front walk 2-3, a hole through the tabard beside the rising right fist (the fill searched 3 texels outward inside a 7-texel arm mask) -> a
texel the fist uncovers takes the cape / tabard just below the arm; front walk 0 / 5, a dark dash left floating under the rising left fist
(the fist's bottom outline was outside the arm mask) -> the front arm masks end on that row; back, a one-texel pinhole in the cape (in the
reconstructed view) -> filled with the cape colour beside it; profile walk 0 / 1 / 5, a transparent strip between the tabard panel and the
arm -> those tabard texels keep their colour; profile walk 0-5, a lone dark thread behind the legs (the source's rear-leg edge carried with
the cape) -> left out of the cape mask. Against the sheet before: 43 texels removed, 68 added, 65 recoloured, 0 new colours, in 20 frames
(idle front / profile and every other frame unchanged); same frames, tags and metadata JSON; `--check` rebuilds identically. Default boot
(A, B, C, D, sabotaged C / D, 1920 x 1080, deterministic): 0 px against `dab59f9`, repeat witness 0 px. Blind critique (random labels,
key withheld): revised 7/10, previous 4.5/10, every difference a defect of the previous sheet, nothing new; left as they were (inherited):
the hem trim's corner at the profile cape's tip reads as a loose heel (x 46-50, rows 81-84), the far leg mostly hidden in profile, a
1 x 2 slit between tabard and cape (front walk 2), a 2-texel pocket (profile 3). **Approved by the operator on 2026-10-17**: « J'approuve les cinq planches corrigées de la passe C3 pour la production : fusionne cast-rig-fixes dans main, pousse main et supprime la branche. » Not declared a Gold Master.
