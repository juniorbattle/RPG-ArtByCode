# Contract proposal — multi-resolution sprites in the main `SpriteAtlas` / `SpriteRenderer`

**Status: v3 — ACCEPTED WITH AMENDMENTS (operator, 2026-10-16).** Approved principles: one shared `SpriteRenderer`; one atlas holding
32 × 48 and 64 × 96 frames; **no production shader change** while the existing invariants suffice; foot anchoring, DOF, lighting, shadows
and occlusion kept; **no change to how existing characters render**; no LOD; no change to the Merchant District environment, the cameras
or the reveal. Amendments A (atlas compatibility proof), B (incomplete facings), C (storage / loading comparison) are section 10.
**Authorised now: an experimental implementation of the shared atlas and of baked-sprite loading, behind a DEV flag only**, on
`character-gold-master-4a-1`, with the six tests. **Not authorised: any production NPC replacement or production activation.** Production
stays subject to this contract and its acceptance tests: the source sheet's provenance is confirmed by the operator (not cryptographically
certified) and its use as a source is authorised subject to third-party rights (2026-10-16), which is not an authorisation to replace
production NPCs (`provenance/dockworker-x2-v1/source-declaration.json`). v2 added the compatibility review (section 8), the files touched (section 9), the real texture-size ceiling
and risks R11, R12. **Experimental implementation done (2026-10-16): results in section 12; amendment C measured, C2 proposed (section 11);
amendment A resolved by integer cell addressing (section 13); the x2 cast-shadow difference to the old preview was accepted.** `AGENTS.md` stays the authority.

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
- Loader checks, all measured true today (section 8): frame = 32k × 48k; last opaque row of every standing / contact frame = 45k (never
  lower); a fully transparent one-texel ring around every frame; binary alpha (0 or 255).

## 4. Proposed changes (minimal)

1. **Atlas — mixed cell sizes, one page.** Generated cells keep their exact positions (first rows, same packing); baked frames are
   appended as *k × k* blocks of base cells (an x2 frame = 2 × 2 cells, 24 KB colour + 24 KB emissive). Same texture → **no extra draw
   call**. Emissive of a baked frame = 0 unless the sheet ships an emissive layer. Ceiling: WebGL2 only guarantees
   `MAX_TEXTURE_SIZE` >= 2048 (this machine: 16384) → at width 512, rows 720..2047 hold 13 rows of x2 blocks = **104 x2 frames**; checked
   at boot against `renderer.capabilities.maxTextureSize`. Beyond that: widen the atlas to 1024 (moves generated cells, same pixels) or a
   second page (+ draw calls) — a separate decision.
2. **Baked character spec.** `BakedSpec { id = manifest id, density k, detail tier, dirs, anims, frames (dir/anim/i → cell), sha256 }`
   registered in `atlas.specs` / `counts` like a generated spec, built from the Aseprite JSON (tags → animations). Sheets with one
   facing / one animation declare it; nothing else is invented.
3. **Loading — pixel-exact, gated by manifest.** Only manifests with `runtimeUse: "production"` can ever enter the game build (checked
   by `art:validate` + the loader); `lab` manifests load only behind the DEV flag. The storage format (generated TypeScript module vs
   versioned PNG / pre-baked atlas) is **not locked**: it is chosen by the measured comparison of amendment C (section 10). Whatever the
   format, the loader verifies the export's SHA-256 against its provenance pack and the frame invariant (section 3), and decodes the
   bytes without colour management or premultiplication.
4. **Renderer — no shader change.** Size, foot, rim and lighting come from the existing invariants. The silhouette rim stays **one
   texel of the sprite's own texture** (validated L0 look: half as wide on screen for x2); a density-aware rim is a later art decision.
   Missing facings / animations are handled by amendment B (explicit, validated before spawning), **not** by a silent renderer fallback;
   the existing fallback chain of the generated characters is untouched.
5. **Actors.** Baked NPCs enter through authored spawns (`NpcSpawn` with an explicit spec) **without consuming the seeded RNG stream**
   (seed determinism, `AGENTS.md`): appended after every seeded spawn in `ActorSystem.populate` and **not** added to the crowd's `taken`
   list (adding them would move crowd members); an overlap with a crowd member is reported, not silently fixed. Each spawn carries its
   presentation `scale` **and** `height` (shadow length, bubble height; today a per-spec `HEIGHT` table). A spawn is refused (explicit
   error) unless its sheet holds every frame its behaviour needs (amendment B). Detail tier `crowd` or `mid` as authored.
6. **Unchanged by construction** (to be proven, not assumed): contact shadows (they sample the instance's own cell alpha), DOF protection
   (`iFx.x`), 55 % overlay (same geometry), mirror pass (same group, `uClipY`), light grid, camera-graph `charScale`, occlusion reveal.
7. **Retire the DEV second renderer** (`src/lab/runtimePreview.ts`, `labhd=1`) once the unified path exists; keep `?labsprite=` for
   lab-status sheets, drawn through the same main renderer.

## 5. Acceptance tests (all must pass before any operator review of the integration)

| # | Test | Pass |
|---|---|---|
| 1 | No baked NPC in the scene, cameras A / B / C / D (`static=1` and with characters, fixed seed, fixed time step) vs the current build: (a) no baked asset loaded; (b) baked asset loaded (atlas taller) but not spawned; (c) amendment A sampling proof | **pixel-identical** in all; (a) atlas byte-identical; (b) every generated cell byte-identical by content; (c) 0 px over every generated frame at several heights and sub-pixel offsets, negative control fails |
| 2 | Self-test of the baked cell inside the main atlas: CPU bytes vs the independently decoded export, and GPU sampling through the renderer's addressing at 1 / 2 / 3 / non-integer scale | 0 texel mismatch; negative controls (frame table off by one row; uncentred linear sampling) fail |
| 3 | Same spots as the validated evidence (Pass 4A-sexies), x2 drawn by the main renderer vs by the DEV preview renderer | pixel-identical (proves the unified path = the validated look) |
| 4 | `dynwalk` quay + standing-NPC runs | churn within ±1 point of Pass 4A-septies; no vanishing frame |
| 5 | `tools/perf.mjs`, camera B, 1 / 8 / 32 baked NPCs, interleaved | GPU within noise of the runtime-porter variants; **draw calls unchanged** (no +4); atlas +48 KB per x2 frame |
| 6 | `npm run typecheck`, `npm run build`, `npm run art:validate`, seeds 1842 / 7719 / 30417 | green; other characters' spawns and positions unchanged |

## 6. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Source sheet: provenance confirmed by the operator, not cryptographically certified; use authorised (2026-10-16) subject to third-party rights, not exhaustively verified | a third-party claim on a derived sprite | keep the decision and the record (`source-declaration.json`, archived source); production still needs its own task, the acceptance tests and `runtimeUse: "production"`; no automatic ban from the missing C2PA |
| First authored asset in the build | changes the "everything generated at boot" contract and the bundle | explicit task + `AGENTS.md` update; manifest gating; hash check |
| Mixed densities on screen (hero 32 × 48 next to x2 NPCs) | the hero looks coarser than the extras | operator decision: hero later, with a key-character budget |
| Texel loss near 1 screen px per texel (camera A, distant NPCs) | single-texel details flicker | QA watch point; no LOD now (operator decision) |
| Incomplete sheets (one facing / one animation) | invisible or sliding NPCs | amendment B: frames required per behaviour validated before spawning (explicit error); explicit front-idle fallback only for an immobile lab asset |
| Colour management / premultiplied alpha on decode | silent texel drift | build-time bake or `colorSpaceConversion: 'none'`; tests 2–3 |
| Atlas growth | memory, texture-size ceiling | 48 KB per x2 frame; first-fit k × k blocks; ceiling checked at boot |
| Rim width is per texel | thinner rim on x2 | validated as is (L0); density-aware rim = later art decision |
| RNG / spawn order | seed drift for every other character | authored spawns outside the RNG stream; test 6 |
| NPCs behind the banner / lamps are not revealed | partial uncovering by the player's ellipse | by design (V1); banner-pole anomaly tracked separately |
| R11 (added v2) Cell-border sampling: at a quad edge `floor(vUv × uAtlasSize)` can land on the neighbour cell, and the rim reads ±1 texel | a stray texel / false rim from the next cell | loader rejects a frame without a transparent one-texel ring (measured: 0 opaque ring texels in the 234 generated cells and in x2 v1) |
| R12 (added v2) Future facings: the `side` view is mirrored for the other side | asymmetric costume details (bag, strap) swap sides when the NPC turns | author side views mirror-safe; distinct left / right facings = a separate contract (renderer + `ActorSystem`) |

## 7. Proposed phasing (each step stops for review)

1. Atlas mixed cells + `BakedSpec` + loader in DEV only, behind a URL flag; tests 1–2.
2. Main-renderer drawing of one baked NPC at an authored spot (flag); tests 3–6.
3. Operator review → decide production gating, rights, `AGENTS.md` update; only then `runtimeUse: "production"` for an approved asset.

## 8. Compatibility review (v2, 2026-10-16: code re-read + measurements in the running app, seed 1842)

**Existing 32 × 48 characters.** Generated specs, order, packing and atlas width (512) are unchanged; baked blocks are appended below them
(image rows >= 720). Generated cells keep their image-space positions; because data rows are flipped and UVs are normalised by the atlas
height, their `v` values are recomputed when the atlas grows, and the shader addresses texels explicitly (`floor(vUv × uAtlasSize)`): test
1b proves the image stays pixel-identical. No GLSL, uniform or instance-attribute change; hero, generated NPCs, crowd and cat untouched;
crowd RNG untouched (4.5). The DEV atlas dump (`?sprites=1`, `src/main.ts`) and the in-place `labsprite` mode read `atlas.rgba` with the
same flip convention and keep working.

**Foot anchoring.** Vertex height = `(corner.y × uWorldSize.y − uFootOffset) × iTint.w × uCharScale`, `uFootOffset` = (48 − 45) × 0.047 =
0.141 m, shared. Measured: last opaque row = **45 in 232 of the 234 generated frames** (the 2 others are speech bubbles, 43); x2 v1: **90 =
2 × 45**. The ground line is the top edge of row 45k; the bottom outline row sits just under it (4.7 cm at x1, 2.35 cm at x2: a 2.35 cm
difference, half an x1 texel). The pixel snap acts on the instance anchor only (density-independent). The contact blob does not depend on
the frame; the light / moon cast shadows reuse the cell alpha (same geometry, finer outline). x2 v1 figure = 89 texels × 0.0235 m = 2.09 m
at scale 1 (1.88 m = scale 0.9): `Actor.height` (shadow length, bubble) is set with `scale` per spawn (4.5).

**Filtering.** Nearest, no mipmaps, clamp; explicit texel-centre addressing in atlas space works for any cell size. The silhouette rim reads
±1 atlas texel = one texel of the sprite's own density (validated L0 look, half as wide on screen for x2). Screen density halves at x2:
camera B ≈ 1.9–2.0 px / texel (1.88 m), camera A 1.1–1.2, distant standing NPCs in A down to 0.57 (Pass 4A-septies); a lower render
resolution lowers these figures proportionally. Under 1 px / texel texels are skipped (single-texel flicker): QA watch point, no LOD
(operator decision). Colour: the atlas is an sRGB `DataTexture`; baked bytes must be inserted raw (no colour conversion, no premultiplied
alpha) → build-time bake. x2 v1 has 0 semi-transparent texels (alpha test 0.5 unchanged). Cell borders: R11.

**Future animations.** Today: facings `down` / `up` / `side` (+ mirror), animations `idle | walk | hammer | talk | carry`, one frame count
per spec / animation (identical for every facing), fixed rates in `frameIndex` (walk / carry 7.5 fps, hammer 5.5, talk 4, idle 1.7):
Aseprite frame durations are not read. Baked sheets: one Aseprite tag per `<anim>-<dir>`, the same count per animation for every facing
(rejected otherwise), authored to the fixed rates (walk 133 ms, talk 250 ms, idle ≈ 590 ms per frame); per-frame durations (holds) would
need a per-spec timing table in `frameIndex` (CPU only, later). Every contact frame keeps its last opaque row at 45k (bob and lifted feet
stay inside the frame). NPC speeds are 0.8 (mid) / 0.95 (crowd) / 0.9 m/s (porter): a walk cycle is authored to its speed or the feet
slide; a baked NPC walks only once its cycle is validated in motion (Pass 4A-septies tested a fixed pose only). Mirroring: R12.

**GPU memory.** Today 512 × 720 × 4 B × 2 textures (colour + emissive) = 2.95 MB; the arrays also stay in CPU memory (`atlas.rgba`,
`DataTexture.image.data`). One x2 frame = 64 × 96 × 4 B = 24 KB colour + 24 KB emissive = **48 KB**; the atlas grows by rows of 8 x2
frames (96 texels, 384 KB). Hypothetical example (not planned): an NPC with 3 facings × (idle 4 + walk 8 + talk 4) = 48 frames = 6 rows =
+2.25 MiB (atlas 512 × 1296, ≈ 5.3 MB). Ceiling: 104 x2 frames at width 512 within the WebGL2 guarantee (4.1); a 2048 × 2048 pair is
32 MiB at worst. The emissive texture uses one channel of RGBA8: an R8 emissive would save 37.5 % of the total — outside this contract
(it would touch the generated sprites too).

**Batching.** One atlas, one material: x2 instances join the existing draws — main pass body + shadows + 55 % overlay, mirror pass body =
**4 draw calls for all characters, unchanged** (the DEV preview path adds 4: its own renderer, measured). Instance layout unchanged (`iUV`
already carries the cell rectangle); instance buffers grow by themselves (40, doubled when actors × 2 exceed it). Measured with the same
shader (DEV preview renderer, camera B): 32 x2 NPCs 9.54 ms GPU vs 32 runtime porters 9.67 ms (base 9.23, noise ±0.2).

## 9. Files touched

**Experimental phase (implemented 2026-10-16, DEV flag only, nothing in production):**

| File | Change |
|---|---|
| `src/characters/BakedSprites.ts` (new) | `BakedSheet` / `AuthoredSpawn` types, `requiredFrames` (amendment B), `checkBakedSheet` (frame invariant: 32k x 48k, idle on row 45k, nothing below it, transparent ring, binary alpha, equal counts per facing, fallback lab-only) |
| `src/characters/SpriteAtlas.ts` | `build(specs, baked = [], maxTextureSize)`: baked blocks shelf-packed in data rows above the generated cells (their bytes and UV expressions unchanged), frames / counts registered, explicit front-idle aliases listed in `atlas.aliases`, ceiling check, `generatedHeight` |
| `src/characters/ActorSystem.ts` | `authored` spawns appended after every seeded spawn (no RNG, not in `taken`), refused with an explicit error when a required frame is missing; `spawn` takes an optional `t` (no `Math.random` call then) |
| `src/app/App.ts` | optional `AppOptions.baked` (set only by the DEV loader), `maxTextureSize` passed to the atlas |
| `src/main.ts` | DEV-only dynamic import of the loader + harness (`?baked=`) |
| `src/lab/bakedLoader.ts` (new, DEV only) | manifest gate, SHA-256 against the provenance pack, exact PNG decode, Aseprite tags `<anim>-<dir>`, authored spawns from URL flags, harness (hide / follow / visibility toggle for measurements), test-2 self-test |
| `tools/art-lab/baked-proof.mjs`, `png.mjs`, `storage-bench.mjs`, `dynwalk.mjs` + `dynwalk-report.mjs` (moved from `scratch/`) | tests 1-4 and 6, amendment C |
| `src/characters/SpriteRenderer.ts`, every shader | **not modified** (amendment B is solved before spawning, not by a renderer fallback) |
| `src/lab/runtimePreview.ts` | not modified: kept as the reference of test 3; to retire with a later task |

**Not touched**: `SpriteGenerator.ts`, `PixelPainter.ts`, every shader, `Occlusion.ts`, `CameraGraph.ts`, `Visibility.ts`, `PostFX.ts`,
`ShaderChunks.ts`, `MerchantDistrictGenerator.ts`, the hero, `vite.config.ts`.

**A later production task would add** (not done, needs operator approval and a verified source): the C2 loader moved out of `src/lab/`
into the game (approved `production` manifests only), the export PNG imported as a hashed asset, `art:validate` gating, the `AGENTS.md`
update ("the game loads no authored asset" becomes "only approved production manifests"), and the removal of the old preview renderer.

## 10. Operator amendments (2026-10-16)

### A — Atlas compatibility: the old pixels and the 32 × 48 rendering must survive a taller atlas

Growing the atlas changes `uAtlasSize.y` and the normalised `v` of every generated cell. The texel the shader fetches is
`floor(vUv × H)`: in exact arithmetic it is the same cell texel for any height (for a cell whose data rows start at `r0`,
`vUv × H = r0 + 48 t`), but float32 rounding differs with `H`, so identity is **proven, not assumed**:

- **Layout that keeps the old bytes**: the generated cells keep their data rows `[0, H0)` exactly (the first `H0 × W × 4` bytes of the
  colour and emissive arrays are unchanged); baked blocks are added in rows `[H0, H)`. Generated UVs keep the same expression
  (`1 − cy / H`, image-space rows), so with no baked asset every float is the one of today.
- **A1 bytes**: colour + emissive bytes of every generated cell identical for `H` = 720 and every grown height tested.
- **A2 sampling parade**: every generated frame (234) drawn by the production `SpriteRenderer` (same shader, same instance path) in
  front of a fixed camera, at several world scales and sub-pixel offsets, with the atlas at `H` = 720, at `H` = 816 (the x2 dockworker)
  and near the 2048 ceiling (synthetic x2 blocks): screenshots **0 px** different.
- **A3 scene**: cameras A / B / C / D with characters (seeded `Math.random`, fixed 1/60 s steps from load): `eecea58` build vs the new
  code without baked asset vs the new code with the asset loaded but not spawned: **0 px**.
- **A4 negative control**: the parade with the grown atlas but the generated UVs normalised by the old height (a deliberate bug) **must
  differ**; otherwise the parade proves nothing.
- If A2 or A3 is not 0 px: stop. The way out (fixed atlas height, or integer `texelFetch` in the shader) changes memory or a production
  shader and needs operator approval.

### B — Incomplete facings and animations: explicit, never masked

- **Frames required per behaviour** (from `ActorSystem`): immobile and never faced → `idle/down`; immobile but faced, or interactive
  (detail `mid` / `hero`: it turns to the player when talked to) → `idle` × `down` / `up` / `side`; `wander` / `patrol` → `idle` + `walk`
  × the three facings; `work` → `hammer/side`; a `talk` role → `talk` × the three facings. One frame count per animation for every facing.
- **Production** (`runtimeUse: "production"`): a missing required frame is a **load / spawn error** naming the missing `dir/anim`. The
  renderer never meets a missing baked frame; nothing is masked.
- **Experimental only**: a `lab` asset with an **immobile** behaviour may declare `fallback: front-idle` **explicitly** at the spawn (DEV
  flag); the missing idle facings are then registered as named aliases of the front idle frame, listed in the harness report and logged
  once. Never for walking / working NPCs, never in production. Without the declaration the spawn is refused.
- The generated characters' existing renderer fallback chain is not modified (their sheets are complete).

### C — Storage and loading: measured comparison before locking a format

Candidates, all decoded to the same atlas bytes: **C1** a generated TypeScript module (raw RGBA + frame table + SHA-256, tracked);
**C2** the versioned Aseprite export (PNG + JSON, already tracked and hashed in the provenance pack) fetched and decoded at boot;
**C3** a pre-baked atlas PNG packing every baked frame at build time (same loader as C2, one file instead of one per asset). Measured:
build time (`vite build`, median of 3), bundle (JS raw / gzip, extra asset bytes), load (fetch + decode ms, atlas build ms), memory (JS heap,
GPU texture bytes), draw calls, reproducibility (byte-exact decode against an independent Node decode; hash check), simplicity (tooling
steps, code). Rule: identical atlas bytes are a precondition; then the simplest, fastest and reproducible candidate wins. Results and
decision: section 11.

## 11. Amendment C — measured comparison and decision (2026-10-16)

`tools/art-lab/storage-bench.mjs` (report: `art-lab/characters/scratch/storage-bench/report.json`, not tracked): three throw-away copies of
the current tree, **production** builds (`vite build`, 3 each), `vite preview`, Chrome with the cache disabled, 3 interleaved boots each.
One asset, `dockworker-x2-v1` (one 64 × 96 frame: PNG 5 196 B, raw RGBA 24 576 B).

| | base (today) | C1 generated TS module | C2 versioned PNG + JSON |
|---|---|---|---|
| build time (median, ms; noise ≈ ±100) | 685 | 667 | 600 |
| JS bundle raw / gzip (bytes) | 822 553 / 235 396 | **+33 433 / +5 034** | **+1 891 / +957** (decoder + loader) |
| extra asset files | — | — | PNG 5 196 B (fetched once, cacheable) |
| loader alone, idle page (median of 20 × 3) | — | 0.2 ms (base64 → bytes) | 10.6–14.6 ms (fetch + SHA-256 + exact decode) |
| time to ready (median; noise ±300 ms) | 4 758 ms | 4 770 ms | 4 677 ms |
| atlas / GPU texture bytes | 512 × 720 | 512 × 816, SHA `e02b3cb6…` | 512 × 816, **same bytes** |
| draw calls (whole frame) | 108 | 108 | 108 |
| JS heap | (GC noise 110–300 MB: not usable) | | |

Reading: both decode to **byte-identical atlas bytes** (precondition met) and the same draws. C1 is faster to decode by ~12 ms, but that
load is overlapped with the boot (`App.init` awaits it only at the sprite stage) and changes nothing measurable in time to ready. C1 puts the
raw pixels into the JS bundle (×1.33 in base64: ≈ +33 KB raw per x2 frame — a hypothetical 48-frame NPC would add ≈ 1.6 MB of JS to parse,
an extrapolation, not a measurement) and **duplicates in Git** pixels that already live in the hashed Aseprite export, so a generated file
must be kept in sync and checked. C2 keeps **one source of truth** (the tracked export, already hashed in its provenance pack), adds ~1 KB
of gzip JS once, and its loader is the one the experiment already uses.

**Decision (proposed, applies to the experimental path now and to a later production task): C2.** Versioned PNG + Aseprite JSON exports,
fetched at boot, SHA-256 checked against the provenance pack, decoded by our exact decoder (no colour management, no premultiplication),
packed into the shared atlas. C3 (a pre-baked atlas PNG of every baked frame) is the same loader with one file; worth it only when the
number of baked files makes the requests matter. C1 is not adopted.

## 12. Results of the experimental implementation (2026-10-16, DEV flag only)

Every capture comes from `tools/art-lab/baked-proof.mjs` (seeded `Math.random`, app loop taken over, 1/60 s steps, frozen clock, one
warm-up load per framing: the first load of a framing in a browser session renders differently from all later ones, which agree with
each other — a harness fact, measured). Baseline = the `eecea58` tree served on :5181. Evidence (untracked):
`art-lab/characters/scratch/baked-proof/`; key images in `art-lab/characters/reviews/shared-atlas-4a-decies/`.

| # | Result |
|---|---|
| 1a | atlas without baked sheet **byte-identical** to `eecea58` (colour + emissive SHA-256); scene A / B / C / D, with characters and `static=1`: **0 px** (8 views) |
| 1b | baked sheet loaded, not spawned (atlas 512 x 816): generated rows byte-identical; scene A-D: **0 px** (8 views) |
| A2 | parade of the 234 generated frames (+ bubbles), 3 scales x 3 batches, atlas 720 / 816 / 1968: **0 px** (27 renders); repeat control 0 px |
| A2+ | dense sweep, 17 scales x 3 batches: atlas 816 **0 px** (51 renders); atlas 1968 **1 render of 51 differs: 1 032 px on 5 scanlines** (scale 2.1) |
| A4 | negative control (generated UVs normalised by the old height): 480 000 – 1 200 000 px per render: the parade detects a real UV error |
| 2 | baked block CPU bytes = the export decoded in Node: 0 mismatch; GPU sampling at scales 1 / 2 / 3 / 2.37: **0 texel mismatch**; negative controls fail (off-by-one row 6 616, uncentred linear 10 804). A "wrong atlas height" control was tried and is NOT valid: the nearest re-quantisation cancels it (0 mismatch) |
| 3 | x2 by the main renderer vs the old preview renderer, 4A-sexies spots (12 x2 NPCs): **0 px on every x2 NPC** in A / B / C / D. Whole images: A, B, D 0 px; C **16 px on one scanline of the generated HERO** (32 x 48): the preview path keeps the atlas at 720 rows, the shared path has 816 — the amendment-A tie below. Control: the shared path alone at 816 vs 1968 rows flips 12 px on the same scanline |
| 4 | `tools/art-lab/dynwalk.mjs` (seeded, frozen clock per frame), 4A-septies routes. Quay 1.88 m, median churn shared / old preview / 4A-septies: A 5.8 / 5.7 / 5.7, B 7.6 / 7.6 / 7.5, C 9.4 / 9.4 / 9.4, D 10.2 / 10.2 / 10.2, blends 11.4 / 11.5 / 11.4; no frame without the sprite (881). Standing NPCs: all 14 actor x framing groups **within 0.8 point** of 4A-septies; NPC 3 leaves its mask on 20 frames, the same as in 4A-septies (scene occlusion) |
| 5 | camera B, 3 interleaved rounds (noise up to ±1 ms this session): base 9.91 ms GPU, 114 draws; shared x2 1 / 8 / 32 NPCs 10.21 / 10.12 / 10.21 ms, **114 draws**; runtime porters 8 / 32: 10.20 / 11.12 ms; old preview x2 32: 10.52 ms, **118 draws (+4)**; atlas +393 KB with the x2 block (512 x 816) |
| 6 | typecheck, build green; `art:validate` 0 error; seeds 1842 / 7719 / 30417: the 11 seeded characters identical to `eecea58`, authored ones only appended; production bundle 818 648 → 822 553 B (+3.9 KB: the shared-atlas code, inert without baked sheets), DEV loader absent from it; amendment B rules 8 / 8 (refusals with explicit messages, explicit aliases listed) |

**Open point (amendment A, stop for arbitration).** The bytes of the old cells never change, but the *rendering* can, on rare scanlines:
when a texel edge falls exactly on a pixel centre (a tie), `floor(vUv × H)` resolves the tie by float rounding, and that rounding depends
on the atlas height. Both results are correct nearest samples (the texel boundary moves by one screen pixel line), but the image is no
longer bit-identical. Measured: at 816 rows (the dockworker alone) **one real case, camera C, the hero at the 4A-sexies spot: 16 px on one scanline**, none in
87 parade renders + 16 scene captures; at 1968 rows, 1 parade render of 51 (scale 2.1, 1 032 px on 5 scanlines). Ways out, all outside the approved scope: (1) integer texel addressing (`iUV` in texels + `texelFetch`): ties then never
depend on the atlas size, but this is a production shader change and shifts today's tie scanlines once; (2) a fixed atlas height (e.g.
2048 rows from now on, +5 MB GPU): same one-time shift, then stable; (3) accept tie flips as equivalent samples, with a growth budget
proven by the parade sweep before each growth; (4) a second atlas page for baked sheets (+ draw calls: rejected by the batching rule).

## 13. Amendment A resolved — integer cell addressing (Pass 4A-undecies, 2026-10-16; operator chose "integer addressing")

**Cause.** A texel was chosen by `floor(vUv × H)` with `vUv` interpolated between vertex values `1 − cy / H` (rounded floats) and multiplied
again by `H`. When a texel edge falls exactly on a pixel centre (the pixel-snapped anchor makes this happen at some scales), the exact value
is an integer and float rounding (~1e-4 texel) picks the texel; that rounding depends on `H`, so growing the atlas flipped some ties (a whole
scanline moves by one texel). Reproduced on `5d10a37`: 1 032 px (parade, 1 968 rows) and the hero in camera C (16 px at 816 rows).

**Fix (sprite renderer + atlas only).**
- Generated sprites: **their texture is frozen** (exactly the `eecea58` 512 x 720 texture, never resized): same bytes, same UVs, same
  sampling code — their tie resolution is the baseline's, forever.
- Baked sprites: **their own texture**, addressed by the integer cell `(x0, y0, w, h)` through one GLSL function (`BAKED_GLSL`, shared by body,
  overlay, shadows and the self-test): `texel = cell.xy + clamp(floor(t × cell.zw), 0, cell.zw − 1)`, `t ∈ [0, 1]` across the quad, read at the
  texel centre `(texel + 0.5) / size` (exact under nearest filtering for any size). Boundary policy: an edge exactly on a fragment centre goes
  to the higher texel, the same for every atlas; never a read outside the cell; silhouette neighbours outside the cell are transparent.
  `texture2D` at texel centres: no `texelFetch`, no GLSL migration.
- Common batching kept: instance attribute `iCell` (w = 0 for generated frames), both textures bound to the same material, both paths read
  without a branch around texture reads, the instance selects. **No extra draw call.** The rim select is made on the neighbour alpha
  samples before `step` (made after `step`, it changed the compiled lighting by one level on 5 pixels in 51 renders — measured and removed).

**Results** (`reviews/texel-addressing-4a-undecies/`): generated texture byte-identical to `eecea58` in every variant; parade of the 234
generated frames, 17 scales x 3 batches, alternate mirrors: **0 px in 4 x 51 renders** (no baked / 96 / 1 248 rows / moved cell), negative
control >= 141 590 px per render; x2 parade (17 scales, mirrors): **0 px between a 96-row and a 1 248-row texture and a moved cell**
(2 x 51 renders), old addressing >= 102 px per render, negative control >= 78 375 px; scenes A-D with characters and `static=1` (including the
hero spot in C): **0 px** (9 views x 4 variants); self-test: 0 texel mismatch at two cell positions, **bleed test 0 foreign pixel of 4 277 568**
(192 renders of opaque, ringless cells), negative controls 6 616 / 10 804 / 37 517; x2 vs the validated preview **without character shadows:
0 px** in A-D; **with shadows: 3 / 40 / 67 / 4 px (max 12/255), identical for every atlas size** — see the open point; perf (interleaved, 4
rounds): 114 draws everywhere, GPU within noise (rounds 1-3: base 9.13 / 9.23 ms, 32 x2 NPCs 9.63 / 9.67 ms, old / new).

**x2 cast shadow vs the old preview — ACCEPTED by the operator (2026-10-16): the shadow follows the body's integer texel rule; committed.** The old preview read the shadow alpha with the
hardware's nearest sampler (fixed-point, ~1/256 texel) on its private 64 x 96 texture; the shared path reads it with the same integer floor as
the body. They differ on near-ties of the cast shadow (a few ground scanlines). Stable for every atlas size. Options: (a) accept (the shadow
then follows the body's own texel decisions) and commit; (b) baked frames in a texture **array** of fixed-size layers (one per density,
`sampler2DArray`: a GLSL 3 construct, which three.js already compiles for WebGL2 but this renderer does not use yet), so the shadow can keep a
hardware nearest read on a layer of exactly the preview's size — a wider shader change, to be approved and proven before a commit.

## 14. Production cast (Pass 4A-sedecies, 2026-10-16) — implemented, gated on the operator's approval

Operator request (2026-10-16): characters integrated and working, idle and walk, visible in production, built on the shared reference images.
Implemented as the "later production task" of section 9, without any shader or renderer change:

- **Loader in the game** (`src/characters/BakedDecode.ts`): the exact PNG decoder and the Aseprite-JSON frame cutting (tags `<anim>-<dir>`)
  moved out of `src/lab/`; the DEV loader now imports them (one implementation). `src/characters/SheetMeta.ts` holds the JSON reader.
- **Cast table** (`src/characters/BakedCast.ts`): each entry = an export (PNG imported as a hashed build asset, JSON bundled), the gate fields
  of its manifest (named JSON imports: only `id`, `status`, `approved`, `runtimeUse` reach the bundle), its pack's `files` table, the generated
  archetype it replaces, its presentation scale. Gate: `runtimeUse: "production"` needs `approved: true` + `status: "approved"` (else a load
  error); unapproved entries are skipped in every build; DEV only, `?cast=candidate` also loads `candidate` entries. Load: fetch, SHA-256
  against the pack (WebCrypto; skipped with no error on a non-secure http origin, where `art:validate` is the check), exact decode, the frame
  invariant (section 3) and the frames the replaced behaviours need (idle + walk in the three facings, amendment B): any miss is a load error.
- **Actors** (`ActorSystem.cast`): `spawn()` swaps the archetype's spec for the baked id, multiplies its scale and sets its height (figure
  rows of the front idle frame x texel size x scale); the actor keeps `base` = the archetype, its role, detail tier, behaviour and RNG draws.
  Behaviours read the archetype where they were keyed on it (the porter's speed), and the frame set where they asked for an animation
  (`carry` / `talk` only when the sheet has it). `?cast=generated` keeps the generated cast.
- **Gate in the tools**: `art:validate` refuses a `production` manifest whose export PNG does not match its provenance pack's SHA-256.

Candidates (`status: "candidate"`, `runtimeUse: "lab"`, not approved): `dockworker-x2-v2` -> porter, `merchant-x2-v2` -> merchant (both
x2, idle 4 + walk 6 frames per facing, talk 6 for the merchant: 30 + 48 frames). Measured (seed 1842, 1920 x 1080):
- default boot (no approved manifest) vs the previous commit `894c4d3`: **0 px** in cameras A / B / C / D, characters included (deterministic
  captures, `baked-proof.mjs shots`), with and without `?cast=generated`;
- `?cast=candidate`: the 11 seeded characters keep spec order, roles, positions, tints, behaviours and detail tiers; only sprite, scale and
  height change on the three replaced actors;
- selftest (test 2) of both sheets: CPU bytes 0, GPU texels 0 at scale 1 / 2 / 3 / 2.37, negative controls fail, bleed 0;
- `tools/perf.mjs` interleaved, 3 rounds (final sheets): camera B 9.49 ms (generated) / 9.51 ms (cast), camera C 9.22 / 9.05 ms (noise);
  **draw calls 108 in every variant**; baked texture 512 x 960 (1.97 MB) for the 78 frames;
- production bundle (JS) 824 923 B at `894c4d3` -> 847 433 B (+22.5 KB; gzip 238.64 -> 243.67 KB) + the two PNGs (49 / 71 KB, shipped but not fetched while unapproved); a simulation
  build accepting the candidates loads both sheets from their hashed assets, SHA-256 equal to the packs.
