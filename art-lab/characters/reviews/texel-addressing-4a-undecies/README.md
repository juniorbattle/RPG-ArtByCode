# Texel addressing independent of the atlas size — evidence (Pass 4A-undecies, 2026-10-16)

DEV flag only, nothing in production. Contract: `../../runtime-integration-contract.md`, section 13. Journal: Pass 4A-undecies. Full
captures stay local in `art-lab/characters/scratch/addr-fix/` (git-ignored). Restore point: commit `5d10a37`.
2026-10-18: that local folder was deleted with the operator's approval (JOURNAL, Passe M5); the key images below are the evidence kept.

| File | Evidence |
|---|---|
| `01-hero-camC-baseline-before-after.png` | The defect and its fix: the generated hero in camera C (x2 loaded, not spawned), x4. Baseline `eecea58`; `5d10a37` with an 816-row atlas (16 px on one scanline) and a 1 968-row atlas (20 px); the fix with the x2 + 103 frames (0 px). |
| `02-x2-shadow-divergence-camC.png` | The x2 cast shadow (difference ACCEPTED by the operator, 2026-10-16), validated preview vs fixed shared path, and the differing pixels (near-ties of the shadow, max 12/255, identical for every atlas size; the body is identical, 0 px without shadows). |
| `data/before*.json` | Defect reproduced on `5d10a37` (parade 1 968 rows: 1 032 px; hero in camera C: 16 / 20 px). |
| `data/atlas.json` | Generated texture byte-identical to `eecea58` in every variant; baked texture sizes / hashes. |
| `data/sweep-generated.json`, `data/sweep-baked.json` | Parades, 17 scales x 3 batches, mirrors: generated 0 px (4 x 51 renders), x2 0 px across texture sizes and cell positions (2 x 51), negative controls. |
| `data/scenes.json` | Cameras A-D with characters and `static=1`, including the hero spot: 0 px (9 views x 4 variants). |
| `data/selftest-*.json` | Production addressing code: 0 texel mismatch at two cell positions; bleed test 0 foreign pixel of 4 277 568; negative controls. |
| `data/test3*.json` | x2 vs the validated preview, with and without character shadows. |
| `data/perf.json` | Old vs new addressing, 1 / 8 / 32 x2 NPCs, 4 interleaved rounds: 114 draws everywhere. |
