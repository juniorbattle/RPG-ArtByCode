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

Storage rules:

- **No reference image is committed unless it is explicitly supplied / approved for repository storage.** The folders hold
  only `.gitkeep` today.
- External inspiration (C) is committed only if its licence permits it **and** the operator approves. Otherwise cite it by
  URL / title in the manifest (`references[].label` + `note`), without storing the image.
- Store the evidence next to the image: a short note with its origin (command, URL, seed, date) so the reference can be re-derived.
- Make runtime screenshots reproducible: record the full query string (`seed`, `freeze`, `player`, `camera`, ...; see `AGENTS.md`).
  NPCs and smoke are not deterministic: use `static=1` for any pixel diff, never for a reference that must show characters.
