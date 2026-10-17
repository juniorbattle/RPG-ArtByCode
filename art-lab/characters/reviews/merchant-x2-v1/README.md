# merchant-x2-v1 — evidence (Pass 4A-quindecies, 2026-10-16)

First candidate of the experimental second NPC (the merchant), reconstructed from the approved V3 source
(`../../reference/sources/npc2-merchant-source-2026-10-16.png`). **Not approved.** After the in-scene comparison the operator decided to
**regenerate the source** for its proportions (prompt V4, `../../briefs/npc2-proposal.md` § 6.4); this folder keeps the evidence of that
decision and of the pipeline, which will be rerun on the new source.

| File | What it shows |
|---|---|
| `01-pitches-88-85-83-79-78-and-docker.png` | reconstruction pitches 13.9 / 14.3 / 14.75 / 15.3 / 15.7 (figure 88 / 85 / 83 / 79 / 78 texels) and dockworker-x2-v1, x4; before `--holes` (grey neck pocket visible) |
| `02-palettes-full-96-64-48-32.png` | pitch 13.9 with `--holes --no-shadow`: full colours, 96, 64, 48, 32 (OKLab error 64: mean 9.5, face 6.3, max 33.4 per mille) |
| `03-faces-pitch-13.9-14.75-15.7.png` | faces at x9: 13.9 keeps the most of the eyes and the hair; the mouth (a third of an art pixel high in the source) is lost at every pitch |
| `04-character-lab-camB.png` | Character Lab, the finished export: 1x, 4x, runtime scale; self-test 0 mismatch in A-D, negative control (linear) fails |
| `05`-`08-scene-A..D.png` | shared path (`?baked=`), seed 1842, freeze 7.3, deterministic captures: before (generated merchant) / finished / automatic / dockworker (control); A, B at the generated merchant's spot (the stall lantern hides the face in B), C, D at the dockworker's spots |
| `09-scene-B-side-by-side.png` | the new merchant / the dockworker next to the generated merchant (camera B): texel density 1.8 against 4.6 px |
| `10-proportions-same-depth-B.png` | same depth as the generated merchant (feet on the same screen row): new merchant at 1.66 m and 1.88 m, dockworker at 1.88 m — the proportion gap the operator pointed out |
| `scene-nonreg-report.json` | cameras A-D: repeat, merchant loaded not spawned, merchant + dockworker loaded not spawned: **0 px** each |

Measured (sprites x2): head share 0.26 of the height (about 3.8 heads) against 0.33 (about 3.1) for the dockworker; head width 0.29 against
0.35; shoulders 0.35 against 0.40; maximum width 0.41 against 0.48. The generated merchant's drawn figure is 1.88 x 1.08 m (its `HEIGHT`
1.66 m is nominal); the new one at 1.66 m is 1.66 x 0.68 m. Screen px per texel at 1.66 m: A 0.88, B 1.81, C 1.8-2.1, D 1.6-1.9.

Not done on this candidate (deferred to the regenerated source): blind critique, dynamic walk, GPU performance. Scripts and raw captures:
the session's working folder (not versioned); the chain itself is versioned and verified (`../../provenance/merchant-x2-v1/`).
