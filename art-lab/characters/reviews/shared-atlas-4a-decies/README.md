# Shared atlas / baked sprites — experimental implementation evidence (Pass 4A-decies, 2026-10-16)

DEV flag only (`?baked=`), nothing in production. Contract: `../../runtime-integration-contract.md` (v3, sections 10-12). Full captures stay
local in `art-lab/characters/scratch/baked-proof/` (git-ignored); the decisions and numbers are in `JOURNAL.md` (Pass 4A-decies).

| File | Evidence |
|---|---|
| `01-shared-atlas-816-top.png` | The main atlas with the x2 dockworker block above the generated cells (`?baked=dockworker-x2-v1&sprites=1`), x2. |
| `02-test3-x2-preview-vs-shared.png` | Test 3: the x2 NPC drawn by the old preview renderer (a) and by the shared main renderer (p), cameras A-D: 0 px on every x2 NPC. |
| `03-tie-camC-hero-720-vs-816.png` | The open point of amendment A: camera C, the generated HERO, atlas 720 rows (left) vs 816 rows (right), x5: one scanline sits exactly on a texel edge and the tie is resolved differently (16 px). |
| `04-tie-parade-720-vs-1968.png` | Same mechanism in the parade sweep: generated sprites, scale 2.1, atlas 720 vs 1968 rows (1 render of 51), x4. |
| `05-parade-vs-negative-control.png` | Parade of the 234 generated frames (0 px between atlas heights in 27 renders) and its negative control (UVs normalised by the old height). |
| `data/*.json` | Reports: atlas hashes, parade / sweep / scene / test 3 / tie control diffs, self-test (test 2), amendment B rules, actors per seed (test 6), perf (test 5), storage bench (amendment C). |

Reproduce (dev server on :5180, the `eecea58` tree served on :5181): `tools/art-lab/baked-proof.mjs` (modes `atlas`, `shots`, `parade`,
`selftest`, `rules`, `actors`), `tools/art-lab/storage-bench.mjs`, `tools/art-lab/dynwalk.mjs` + `dynwalk-report.mjs`, `tools/perf.mjs`.
The sprite derives from a source sheet whose provenance is an operator declaration, not a verified one: production stays blocked.
