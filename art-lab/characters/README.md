# Character Art Lab

Contract for the Aseprite-first character pipeline (Pass 4A). **Status: toolchain validated (Pass 4A-0B); first gold-master
CANDIDATE `porter-gm-v1` (canal porter, generic NPC) produced in Pass 4A, awaiting operator approval** — `status: candidate`,
`approved: false`, `runtimeUse: lab`: the game does not use it. No production sprite exists. Evidence: `reviews/porter-gm-v1/`,
`../../screenshots/4a/`, JOURNAL Passe 4A.

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
