# Reference package conventions

Future Pass 4A uses four kinds of references. They do **not** have equal authority; when they disagree, the table decides.

| Cat. | Folder | What it is | Authority |
|---|---|---|---|
| **A** | `A-runtime-baseline/` | Current Runtime Baseline: actual Merchant District screenshots (`npm run shots`, Cameras A / B / C / D) | **environment authority**: how the world really looks |
| **B** | `B-runtime-quality-targets/` | Runtime Quality Targets: our generated Merchant District character-integration previews | **perceptual integration / quality ceiling**: how good a character may look in this scene |
| **C** | `C-sprite-quality/` | Sprite Quality References: our generated NPC sheets + selected external inspiration | **pixel-art craft, silhouette, costume quality** |
| **D** | (none: by manifest) | Gold Master Outputs: Merchant, Dock Worker, Forge Helper | **future production character authority** |

Rules of thumb:

- A never overrules B on integration, and B never overrules A on what the district is. C teaches craft, never composition.
- D does not exist yet. Once approved, a gold master lives in `exports/` with its manifest (`approved: true`) and is referenced
  **by manifest id**: never copy it into `reference/`.
- Every manifest lists the references that informed it (`references[].category`).

Our reference sheets (operator decisions, 2026-10-16; record `../provenance/dockworker-x2-v1/source-declaration.json`). Generated with
ChatGPT / OpenAI under our art direction; provenance confirmed by operator declaration, **not cryptographically certified** (no C2PA);
use as sources and art references, including for commercial game assets, authorised by the operator **subject to applicable third-party
rights, which have not been exhaustively verified**. Not an authorisation to replace production NPCs (contracts and acceptance tests apply).

| Sheet | Role | SHA-256 | In the repo |
|---|---|---|---|
| "Cité du Tournoi — Merchant District — Night", NPC 01-16 | C — the 24-NPC series; source of the approved `dockworker-x2-v1` baseline | `1c3bc603…36ce` | `sources/merchant-district-night-npc-01-16.webp` |
| same series, NPC 17-24 | C — the 24-NPC series | `3b30b930…d6d4` | `sources/merchant-district-night-npc-17-24.webp` |
| "Cité du Tournoi — Merchant District (Night) — NPC CHARACTER REFERENCE SHEET", 14 characters | C — **complementary** reference (a distinct generation): key characters, costumes, elaborate silhouettes; does not replace the x2 v1 baseline for standard NPCs | `05c101db…97af` | `sources/merchant-district-night-npc-character-reference-sheet.webp` |

All three are re-encoded copies (WebP pasted in a working session), not the original ChatGPT files; each is archived byte for byte with
its record (`sources/<name>.source.json`: format, content, classification, provenance, rights, derived assets).

Storage rules:

- **No reference image is committed unless it is explicitly supplied / approved for repository storage.** The category folders hold
  only `.gitkeep` today.
- `sources/`: **source sheets archived byte for byte** with operator approval, each with a record `<name>.source.json` (SHA-256,
  format, declared provenance, rights decision, the assets derived from it and how to rebuild them). Never edited, re-encoded or replaced;
  an original found later is added as a separate file next to its copy, with its own record (a distinct base name: one record per file).
  `*.webp` / `*.png` are binary in `.gitattributes`; `npm run art:validate` checks every file against its record (SHA-256, size) and
  reports a file without a record or a record without its file.
- External inspiration (C) is committed only if its licence permits it **and** the operator approves. Otherwise cite it by
  URL / title in the manifest (`references[].label` + `note`), without storing the image.
- Store the evidence next to the image: a short note with its origin (command, URL, seed, date) so the reference can be re-derived.
- Make runtime screenshots reproducible: record the full query string (`seed`, `freeze`, `player`, `camera`, ...; see `AGENTS.md`).
  NPCs and smoke are not deterministic: use `static=1` for any pixel diff, never for a reference that must show characters.
