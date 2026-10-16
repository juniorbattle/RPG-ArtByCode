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
node tools/art-lab/verify-provenance.mjs art-lab/characters/provenance/dockworker-x2-v1 --rebuild
```

Both check the archived source sheet's hash; the second also re-runs `tools/art-lab/reconstruct-grid.mjs` (full + 64 colours: bit-identical) and
replays `cleanup-ops.json` with `tools/art-lab/replay-pixel-ops.mjs` (pixel-identical to the approved export). Verified 2026-10-16.

## The source sheet: provenance confirmed by the operator, archived in the repository

**Provenance confirmed by the operator (2026-10-16)**, recorded in `source-declaration.json` (statements verbatim): the sheets "Cité du
Tournoi — Merchant District — Night" (NPCs 1 to 24) were generated with ChatGPT / OpenAI from the team's art-direction instructions, not
obtained from an external artist; the source file is a re-encoded copy of one of these generations. **Not cryptographically verified**: the
file carries no provenance metadata (WebP with a generic sRGB ICC profile only: no EXIF, XMP or C2PA) and the original generations are not
available; nothing missing is inferred. **Use as a source and art reference, including for commercial game assets, is authorised by the
operator (2026-10-16), subject to applicable third-party rights, which have not been exhaustively verified.** Neither the missing originals
nor the missing C2PA forbid production by themselves; this decision is not an authorisation to replace production NPCs: production stays
subject to the technical and art contracts, the acceptance tests, an explicit task and `runtimeUse: "production"`.

**Archived byte for byte** (operator approval, 2026-10-16): `../../reference/sources/merchant-district-night-npc-01-16.webp` (record
`merchant-district-night-npc-01-16.source.json` next to it), named in `PROVENANCE.json` (`source.sheet.path`): `verify-provenance` checks
it by default and `--rebuild` re-runs the whole chain from it. Earlier, its only copy was the git-ignored
`art-lab/characters/scratch/e2-x2-candidate/input/reference-sheet-4.webp` (same bytes).

Earlier record (until 2026-10-16): origin and usage rights "unconfirmed" (no metadata in the file); the wording is kept in
`PROVENANCE.json` (`source.sheet.history`) and `source-declaration.json` (`history`).
