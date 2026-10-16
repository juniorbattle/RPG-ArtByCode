# Contract proposal — multi-resolution sprites in the main `SpriteAtlas` / `SpriteRenderer`

**Status: PROPOSAL (2026-10-16), awaiting operator validation. Nothing here is implemented.** `AGENTS.md` stays the authority; this
document only proposes how the approved x2 NPC baseline (`dockworker-x2-v1`, 64 × 96) would enter the main sprite system. Integration
itself needs a separate, explicitly approved task; production use needs `runtimeUse: "production"` (operator) and confirmed source rights.

## 1. Scope

In scope: one unified path that draws sprites of different texel densities (32 × 48 runtime sprites and 64 × 96 baked sprites) in the
same atlas and the same instanced renderer, keeping the controlled pixel-art rendering, the existing lighting, contact shadows, DOF,
occlusion, foot anchoring, batching / performance, and full compatibility with today's characters.

Out of scope: replacing the existing sprites, a renderer overhaul, the hero / key characters, animations and other facings for baked
sprites, LOD / 32 × 48 fallback (not justified by the dynamic validation; camera A stays a QA watch point), the occlusion reveal (the
banner-pole anomaly is a separate issue), any roster.

## 2. What the code does today (measured 2026-10-16)

- `SpriteAtlas.build(specs)` bakes every generated frame once at boot into one RGBA atlas + one emissive atlas, on a grid of 16 columns
  × 32 × 48 cells: **512 × 720 texels, 234 frames, 2.9 MB** (colour + emissive). `frames` maps `spec/dir/anim/i` → UV rect;
  `counts` maps `spec/anim` → frame count. Nearest filtering, no mipmaps, rows flipped (data row 0 = v 0).
- `SpriteRenderer` = one instanced body mesh + the same geometry as a 55 % readability overlay (`LessEqualDepth`, after transparents)
  + one instanced shadow mesh (contact blob + up to two warm-light shadows + moon). Per instance: `iPos`, `iUV` (atlas rect), `iTint`
  (rgb tint, **w = per-actor scale**), `iFlip`, `iFx` (DOF protection, key side, warmth, edge amount).
- **Shared uniforms**: `uWorldSize = (FRAME_W, FRAME_H) × PIXEL_WORLD` (1.504 × 2.256 m), `uFootOffset = (FRAME_H − FOOT_Y) ×
  PIXEL_WORLD` (0.141 m), billboard basis, `uCharScale` (camera graph), `uAtlasSize`.
- Fragment: nearest texel addressed explicitly (`floor(vUv × uAtlasSize) + 0.5`), alpha test 0.5, scene lighting (`lightSum`, moon
  shadow, hemisphere), muted chroma (`uSat` 0.8), silhouette rim from the **one-texel** neighbours (`1 / uAtlasSize`), tone compression,
  emissive; scene alpha = DOF protection mask. The vertex shader snaps the foot anchor to the render-target pixel grid (main pass only).
- Facing: `ActorSystem.applyFacing` picks `down` / `up` / `side` from the camera; the renderer falls back `dir` → `side` (+`sideFlip`)
  → `idle` frame 0 of `dir`, then **skips the actor** if nothing exists (an incomplete sheet would make a character vanish).
- Animation: `frameIndex` uses fixed rates per animation (walk 7.5 fps, idle 1.7 fps...), not the Aseprite frame durations.
- Occlusion reveal: computed for the player only (torso ray, sprite height × `charScale`); NPCs are never revealed (V1, by design).
- Today the game loads **no authored or baked asset**; everything is generated at boot (`AGENTS.md`).

## 3. Core invariant: one world frame, many densities

A sprite of density *k* (integer) has a frame of **32k × 48k texels with the feet on row 45k**. Its world rectangle and foot offset are
then identical to the runtime sprites: 64 × 96 × 0.0235 m = 1.504 × 2.256 m, (96 − 90) × 0.0235 = 0.141 m. Consequences:

- `uWorldSize`, `uFootOffset`, the billboard maths, the anchor snap and the contact-shadow geometry stay **shared and unchanged**; the
  density only changes the **size of the atlas cell** an instance samples (`iUV` already carries it).
- **World height is per instance** (`iTint.w` = `Actor.scale`, × `uCharScale`), independent of the texture resolution: 1.65 / 1.75 /
  1.88 m are presentation data, not properties of the sheet (operator decision 2026-10-16). No universal NPC height.
- Frames that break the invariant (another aspect ratio, feet elsewhere, non-integer k) are **rejected by the loader**; supporting
  them would need per-instance world size / foot offset attributes (a later, separate contract).

## 4. Proposed changes (minimal)

1. **Atlas — mixed cell sizes, one page.** Generated cells keep their exact positions (first rows, same packing); baked frames are
   appended as *k × k* blocks of base cells (an x2 frame = 2 × 2 cells, 24 KB colour + 24 KB emissive). Same texture → **no extra draw
   call**. Emissive of a baked frame = 0 unless the sheet ships an emissive layer. Ceiling: 4096 texels high = 85 rows of base cells.
2. **Baked character spec.** `BakedSpec { id = manifest id, density k, detail tier, dirs, anims, frames (dir/anim/i → cell), sha256 }`
   registered in `atlas.specs` / `counts` like a generated spec, built from the Aseprite JSON (tags → animations). Sheets with one
   facing / one animation declare it; nothing else is invented.
3. **Loading — production assets only, pixel-exact.** Only manifests with `runtimeUse: "production"` can enter the game build (checked by
   `art:validate` + the loader; `lab` manifests stay in the DEV preview). Recommended: a build-time step that turns the approved PNG + JSON
   into a generated module (RGBA + frame table + manifest id + SHA-256), so boot stays synchronous, offline and free of browser colour
   management. Alternative: `fetch` + `createImageBitmap(..., { colorSpaceConversion: 'none', premultiplyAlpha: 'none' })` awaited in
   `App.init` before `SpriteAtlas.build`. Either way the loader verifies the hash and the frame invariant (section 3).
4. **Renderer — no shader change for size / foot.** Fallback chain extended for baked specs: any missing `dir` / `anim` resolves to the
   declared front idle frame (**never skip the actor**). The silhouette rim stays **one texel of the sprite's own texture** (the
   validated L0 look: half as wide on screen for x2); a density-aware rim width is an option for a later art decision, not part of this
   contract.
5. **Actors.** Baked NPCs enter through authored spawns (`NpcSpawn` with an explicit spec) **without consuming the seeded RNG stream**
   (seed determinism, `AGENTS.md`). Until they have walk cycles and facings: `idle` behaviour only (no wandering: an unanimated sprite
   would slide), front frame for every facing, detail tier `crowd` or `mid` as authored.
6. **Unchanged by construction** (to be proven, not assumed): contact shadows (they sample the instance's own cell alpha), DOF protection
   (`iFx.x`), 55 % overlay (same geometry), mirror pass (same group, `uClipY`), light grid, camera-graph `charScale`, occlusion reveal.
7. **Retire the DEV second renderer** (`src/lab/runtimePreview.ts`, `labhd=1`) once the unified path exists; keep `?labsprite=` for
   lab-status sheets, drawn through the same main renderer.

## 5. Acceptance tests (all must pass before any operator review of the integration)

| # | Test | Pass |
|---|---|---|
| 1 | No baked NPC in the scene: frames A / B / C / D (static=1 and with characters, fixed seed) vs the current build | **pixel-identical**; generated atlas cells byte-identical |
| 2 | Character Lab `selfTest` on the baked cell inside the main atlas | 0 texel mismatch; negative control (`filter=linear`) fails |
| 3 | Same spots as the validated evidence (Pass 4A-sexies), x2 drawn by the main renderer vs by the DEV preview renderer | pixel-identical (proves the unified path = the validated look) |
| 4 | `dynwalk` quay + standing-NPC runs | churn within ±1 point of Pass 4A-septies; no vanishing frame |
| 5 | `tools/perf.mjs`, camera B, 1 / 8 / 32 baked NPCs, interleaved | GPU within noise of the runtime-porter variants; **draw calls unchanged** (no +4); atlas +48 KB per x2 frame |
| 6 | `npm run typecheck`, `npm run build`, `npm run art:validate`, seeds 1842 / 7719 / 30417 | green; other characters' spawns and positions unchanged |

## 6. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Source sheet rights unconfirmed | **Blocks production use** of any derived sprite | operator confirms origin / licence before `runtimeUse: "production"` |
| First authored asset in the build | changes the "everything generated at boot" contract and the bundle | explicit task + `AGENTS.md` update; manifest gating; hash check |
| Mixed densities on screen (hero 32 × 48 next to x2 NPCs) | the hero looks coarser than the extras | operator decision: hero later, with a key-character budget |
| Texel loss near 1 screen px per texel (camera A, distant NPCs) | single-texel details flicker | QA watch point; no LOD now (operator decision) |
| Incomplete sheets (one facing / one animation) | invisible or sliding NPCs | fallback rule + idle-only behaviour (4.4, 4.5) |
| Colour management / premultiplied alpha on decode | silent texel drift | build-time bake or `colorSpaceConversion: 'none'`; tests 2–3 |
| Atlas growth | memory, texture-size ceiling | 48 KB per x2 frame; first-fit k × k blocks; ceiling checked at boot |
| Rim width is per texel | thinner rim on x2 | validated as is (L0); density-aware rim = later art decision |
| RNG / spawn order | seed drift for every other character | authored spawns outside the RNG stream; test 6 |
| NPCs behind the banner / lamps are not revealed | partial uncovering by the player's ellipse | by design (V1); banner-pole anomaly tracked separately |

## 7. Proposed phasing (each step stops for review)

1. Atlas mixed cells + `BakedSpec` + loader in DEV only, behind a URL flag; tests 1–2.
2. Main-renderer drawing of one baked NPC at an authored spot (flag); tests 3–6.
3. Operator review → decide production gating, rights, `AGENTS.md` update; only then `runtimeUse: "production"` for an approved asset.
