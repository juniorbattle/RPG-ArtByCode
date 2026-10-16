# dockworker-x2-v1 — provenance pack

**Status: approved visual baseline for standard NPCs (operator, 2026-10-16). Not an approved production asset.**
The manifest is `../../manifests/dockworker-x2-v1.manifest.json` (`approved: true`, `runtimeUse: "lab"`). A production asset would need
`runtimeUse: "production"`, which requires an explicit integration task, an operator approval for production and confirmed source rights.

| File | What it is |
|---|---|
| `PROVENANCE.json` | SHA-256 of every file of the chain, reconstruction parameters, cleanup steps, dated decisions, QA watch points. |
| `x2-auto.png` | Strict-grid reconstruction of the reference figure, 64 × 96, feet on row 90, 2 153 colours, no retouch ("C — x2 auto"). |
| `x2-quant64.png` | Same pixels reduced to 64 colours (OKLab k-means, deterministic, face weighted ×4): the cleanup base. |
| `cleanup-ops.json` | The recorded Aseprite AI Artist `draw` operations of the approved cleanup (orphans, mouth, collar, left neck). |
| `reconstruction-report.json` | The reconstruction report (pitch, phase, figure size, closing, islands). |

The approved result is `../../exports/dockworker-x2-v1.png` (+ `.json`), exported by Aseprite from `../../source/dockworker-x2-v1.aseprite`.

## Verify / rebuild

```
node tools/art-lab/verify-provenance.mjs art-lab/characters/provenance/dockworker-x2-v1
node tools/art-lab/verify-provenance.mjs art-lab/characters/provenance/dockworker-x2-v1 --sheet <reference sheet> --rebuild
```

The second form checks the source sheet's hash, re-runs `tools/art-lab/reconstruct-grid.mjs` (full + 64 colours: bit-identical) and
replays `cleanup-ops.json` with `tools/art-lab/replay-pixel-ops.mjs` (pixel-identical to the approved export). Verified 2026-10-16.

## The source sheet is NOT stored here

The operator's reference sheet ("16 generic townsfolk") has **no provenance metadata** (WebP with an sRGB ICC profile only: no EXIF, XMP,
author or generator) and its origin and usage rights are **unconfirmed**. Under `../../reference/README.md` it is not committed until the
operator confirms them. It is identified by SHA-256 in `PROVENANCE.json`; today its only copy in this project is the git-ignored
`art-lab/characters/scratch/e2-x2-candidate/input/reference-sheet-4.webp`. The derived images in this pack and in the exports inherit
that open rights question.
