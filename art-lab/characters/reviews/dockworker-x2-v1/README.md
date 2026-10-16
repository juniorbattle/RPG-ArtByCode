# dockworker-x2-v1 — essential validation evidence

Approved visual baseline for standard NPCs (not a production asset). Full evidence (every capture, sequence and viewer) stays local in
`art-lab/characters/scratch/e2-x2-candidate/` (git-ignored); the decisions and numbers are in `JOURNAL.md` (passes 4A-quater to 4A-septies).
No image here contains the reference sheet itself (its rights are unconfirmed, see `../../provenance/dockworker-x2-v1/README.md`).

| File | Evidence |
|---|---|
| `01-sprite-auto-vs-clean.png` | x2 automatic vs x2 cleaned v1, ×6 nearest-neighbour. |
| `02-scene-camB-before-auto-clean.png`, `03-scene-camD-...` | In scene, same 3 spots: runtime porter / x2 auto / x2 cleaned / cleaned without rim, 1:1 then enlarged. |
| `04-scale-next-to-hero.png` | World scale at the same depth as the hero (runtime porter vs x2 cleaned at 1.88 m). |
| `05-walk-A-to-D.png` | Real walk (fixed 1/60 s, real movement keys) through cameras A → B → C → D and their transitions, 1:1. |
| `06-seq-camA-consecutive.png` | 8 consecutive frames in camera A (about 1.1 screen px per texel): the QA watch point. |
| `07-seq-camB-x2.png`, `08-seq-camB-x1-control.png` | 8 consecutive frames in camera B: x2 vs the same art at 32 × 48 (control), same frames. |
| `dynamic-metrics.json` | Per-run, per-framing churn / silhouette / outline-survival statistics (`scene/dyn/report.mjs`). |
| `perf-summary.json` | `tools/perf.mjs`, camera B, 3 interleaved rounds: base, +8 / +32 runtime porters, +1 / +8 / +32 x2 NPCs, +32 x1 control. |

Blind and independent reviews (summaries in JOURNAL): cleaned v1 clearly better than x2 auto (face 7 vs 4, collar 6 vs 3), "yes with a
minor caveat" for the baseline; dynamic review "yes with conditions" to plan integration (x2 as stable as x1, same cost).
