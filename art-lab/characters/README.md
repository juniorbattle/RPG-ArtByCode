# Character Art Lab

Contract for the character pipeline. **Status: toolchain validated (Pass 4A-0B). `dockworker-x2-v1` is the APPROVED VISUAL
BASELINE for standard NPCs (operator, 2026-10-16: art direction + in-scene + dynamic validation) — NOT an approved production asset**
(`runtimeUse: "lab"`). Standard NPCs = its quality, density x2 (64 × 96, the same world frame as the 32 × 48 runtime sprites); key
characters get a higher budget later; one art direction, different precision budgets; never degrade the new character to match the old
sprites. `porter-gm-v1` stays an experimental baseline (aimed at the wrong reference). No production sprite exists. Next: a second
ORIGINAL NPC at the same quality, after operator validation. Evidence: `reviews/dockworker-x2-v1/`, `provenance/dockworker-x2-v1/`,
`reviews/porter-gm-v1/`. Source sheet: **operator declaration** (2026-10-16, `provenance/dockworker-x2-v1/source-declaration.json`: our
reference sheets were created with ChatGPT under the operator's art direction) — not a verified provenance; local experiments allowed,
**production blocked** until the original PNG is recovered and checked.

**Approval scopes.** *Approved visual baseline* = `approved: true` + `runtimeUse: "lab"`: an operator-approved quality / direction
reference, usable in the Art Lab and the DEV in-scene preview only. *Approved production asset* = `approved: true` +
`runtimeUse: "production"`: only through an explicit, operator-approved integration task (and confirmed source rights).

**Provenance packs.** `provenance/<id>/` (tracked): `PROVENANCE.json` (SHA-256 of the chain, parameters, dated decisions) + the
intermediate images and recorded edits needed to rebuild an asset, verified by `node tools/art-lab/verify-provenance.mjs
provenance/<id> [--sheet <source> --rebuild]` (`tools/art-lab/reconstruct-grid.mjs`, `tools/art-lab/replay-pixel-ops.mjs`). A source
whose rights are unconfirmed is recorded by hash, never committed.

## Pipeline

```
REFERENCE PACKAGE            (reference/: categories A-D, unequal authority)
      |
character brief
      |
shape / silhouette work
      |
Aseprite pixel-art work
      |
palette / material ramps
      |
review / critic
      |
exact pixel corrections
      |
animation frames
      |
sprite-sheet export          (PNG + JSON)
      |
metadata                     (provenance manifest)
      |
Three.js Character Lab       (character-lab.html)
      |
runtime validation           (Merchant District, Cameras A-D)
```

Aseprite `.aseprite` files in `source/` are the **production sources**. The sheet PNG + metadata JSON in `exports/` are the
**baked, runtime-ready outputs**. The game only ever sees the baked outputs, and only through an approved manifest.
Aseprite itself is never a runtime (or build) dependency.

## Provenance manifest

One file per baked asset: `manifests/<id>.manifest.json`, validated by `npm run art:validate`. Template:
[`manifest.example.json`](manifest.example.json).

```json
{
  "schemaVersion": 1,
  "id": "merchant-gold-master-v1",
  "kind": "character",
  "status": "planned",
  "source": "art-lab/characters/source/merchant-v1.aseprite",
  "exports": {
    "sheet": "art-lab/characters/exports/merchant-v1.png",
    "metadata": "art-lab/characters/exports/merchant-v1.json"
  },
  "generator": { "pipeline": "aseprite-ai-artist", "version": null, "model": null },
  "references": [{ "category": "A", "label": "Merchant District runtime, Camera B", "path": null }],
  "approved": false,
  "runtimeUse": "none",
  "notes": ""
}
```

| Field | Rule |
|---|---|
| `id` | lowercase kebab-case; the file is `<id>.manifest.json`; unique. |
| `kind` | `character` only. Other kinds need an explicit, operator-approved task and a schema bump. |
| `status` | `planned` -> `experimental` -> `candidate` -> `approved`; or `rejected` / `superseded`. |
| `source`, `exports.*` | repo-relative, forward slashes, under `source/` (`.aseprite` / `.ase`) and `exports/` (`.png`, `.json`). `null` only while `planned`; must exist from `experimental` on. |
| `generator` | `pipeline`: `aseprite-ai-artist`, `aseprite-manual`, `procedural`, `external`, `unknown`. `version`: version of that tool. `model`: the model that drove it, if any. Null only while `planned` (otherwise a warning). |
| `references` | `{category: A-D, label, path?, note?}`: what authority informed the asset (see `reference/README.md`). |
| `approved` | `true` requires `status: "approved"` and `approval: {by, date: YYYY-MM-DD, note?}`. A planned asset cannot be approved. An approved asset needs a known pipeline. |
| `runtimeUse` | `none` (default), `lab` (Character Lab only), `production` (**requires `approved: true`**). Generated output never becomes canonical by itself. |

`npm run art:validate` also warns about any `source/*.aseprite` or `exports/*.png|json` that no manifest claims.

## Reference package

Four categories with **unequal authority**; details and storage rules in [`reference/README.md`](reference/README.md).

| Cat. | Content | Authority for |
|---|---|---|
| A | Current runtime baseline: actual Merchant District screenshots | the environment |
| B | Runtime quality targets: our character-integration previews | perceptual integration, the quality ceiling |
| C | Sprite quality references: our NPC sheets + selected external inspiration | pixel-art craft, silhouette, costume quality |
| D | Gold masters: Merchant, Dock Worker, Forge Helper | future production character authority |

No reference image is committed unless it is explicitly supplied / approved for repository storage.

## Quality gates (future Pass 4A)

A character is **not** successful merely because it is readable or technically valid. Pass 4A succeeds only when
characters **increase the perceived production value of the Merchant District**. Each candidate is reviewed on:

- [ ] silhouette
- [ ] proportions
- [ ] pixel clusters
- [ ] palette
- [ ] material readability
- [ ] selective outlines
- [ ] face readability
- [ ] hair
- [ ] hands
- [ ] boots
- [ ] clothing layering
- [ ] profession identity
- [ ] pose quality
- [ ] animation
- [ ] runtime integration
- [ ] ground contact
- [ ] DOF stability
- [ ] forge-light behaviour
- [ ] halo / compositing

The last five are judged **in the running scene** (Cameras A / B / C / D, forge lit, static and moving), not in the Lab:
the Lab proves the pixels arrive intact, not that the character belongs in the district. The known sprite limitations
(forge halo workaround, 55 % character overlay) are recorded in `JOURNAL.md`.

## Generic NPC architecture (design note, not implemented)

```
NPC FAMILY
    |
controlled variation
    |
artistic cleanup / compiler
    |
final baked sprite
```

Families: **Merchant**, **Artisan / Forge Helper**, **Dock Worker**, **Civilian / Customer**, **Guard**, **Traveller**.

Variation axes: body build, age impression, head, hair, headwear, outerwear, apron, boots, accessory, palette.

Generic NPCs must not look like visibly interchangeable Lego parts. The final artistic pass has authority over procedural
modularity: a variant that reads as a recoloured template is a rejected variant, however valid its parts.
