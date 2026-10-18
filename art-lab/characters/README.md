# Character Art Lab

Contract for the character pipeline. Current state (2026-10-18; history: Passes 4A-0A to 4A-quatervicies, archived in `journal/`,
index at the top of `JOURNAL.md`):

- **Toolchain** validated end to end (Pass 4A-0B); `npm run art:doctor` reports what is configured.
- **Production cast** — `approved: true`, `runtimeUse: "production"`, approved by the operator on 2026-10-17, **none declared a Gold
  Master**; loaded by the game through `src/characters/BakedCast.ts` (sheet SHA-256 checked against `provenance/<id>/PROVENANCE.json`,
  decoded byte-exact), each in place of one generated archetype on the same seeded spawns (`?cast=generated` shows the old sprites):

  | Manifest | Stands in for | Animations (front / back / side) |
  |---|---|---|
  | `dockworker-x2-v2` | the porter | idle, walk |
  | `merchant-x2-v2` | the hero stall's merchant | idle, walk, talk |
  | `blacksmith-x2-v1` | the forge's blacksmith | idle, walk, hammer (side only) |
  | `guard-x2-v1` | both guards | idle, walk |
  | `hooded-x2-v1` | the hooded stranger | idle, walk |
  | `artisan-x2-v1`, `traveler-x2-v1`, `townswoman-x2-v1`, `older-merchant-x2-v1`, `courier-x2-v1` | the ambient crowd (`crowd0`..`crowd4`) | idle, walk |

  All density x2 (64 × 96 frames, the world frame of the 32 × 48 runtime sprites), built from the 01-16 / 17-24 reference sheets by
  `tools/art-lab/build-character.mjs` from `rigs/<id>.rig.mjs` (`--check` rebuilds and compares). Approvals, revisions and blind
  critiques: each manifest's `approval`, `provenance/<id>/`, `reviews/<id>/`. The hero and the cat are still generated.
- **Lab only** — `dockworker-x2-v1`: the **approved visual baseline** for standard NPCs (operator, 2026-10-16: art direction + in-scene +
  dynamic validation; `runtimeUse: "lab"`, not a production asset). Standard NPCs = its quality at density x2; key characters get a
  higher budget later; one art direction, different precision budgets; never degrade a new character to match the old sprites.
  Experimental, not approved: `porter-gm-v1` (aimed at the wrong reference), `merchant-x2-v1` (its ChatGPT source, proportions to
  regenerate, was superseded by the sheet's merchant; kept as evidence), `smoke-4a0b-v1` (the 4A-0B smoke test).
- **Source sheets** — **provenance confirmed by the operator** (2026-10-16, `provenance/dockworker-x2-v1/source-declaration.json`: the
  "Merchant District — Night" sheets, NPCs 1-24, were generated with ChatGPT / OpenAI from our art direction, not by an external artist)
  — not cryptographically certified (no C2PA). Use as sources and art references, commercial game assets included, **authorised**
  (2026-10-16) subject to third-party rights (not exhaustively verified); that authorisation alone did not replace production NPCs (each
  production asset was approved separately, above). The three reference sheets are archived byte for byte in `reference/sources/`
  (records `<name>.source.json`, checked by `npm run art:validate`); classification in `reference/README.md`.

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

The production cast went through it with a reference sheet as the source and a rig script as the recipe (`rigs/<id>.rig.mjs` ->
`build-character.mjs`: grid reconstruction per facing, one palette, rig frames, Aseprite source + sheet PNG / JSON), then the manifest,
the Lab, the scene A-D, blind critiques and the operator's approval.

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
| D | Gold masters: Merchant, Dock Worker, Forge Helper | production character authority, once declared (none is: the production cast is approved, not declared Gold Masters) |

No reference image is committed unless it is explicitly supplied / approved for repository storage.

## Quality gates

A character is **not** successful merely because it is readable or technically valid. It succeeds only when it **increases the
perceived production value of the Merchant District**. Each candidate is reviewed on:

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

Open: the operator's request for NPC variants with other hair and skin colours (2026-10-17), not started; constraints and the
untested lead are in `JOURNAL.md`, "À reprendre".
