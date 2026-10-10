# Cité du Tournoi — procedural HD-2D Merchant District

Three.js + TypeScript (Vite). Everything (geometry, textures, sprites, lighting) is generated from code at boot.

## Project journal (MANDATORY workflow)
`JOURNAL.md` is the project's memory: what was done, what worked, what failed and why, open problems, lessons.
- **Before starting any new conversation or task — and always before an analysis, audit, optimisation or
  investigation — read `JOURNAL.md` first** (at least the latest pass, "À reprendre" and "Principes à garder").
  Do not redo an approach it records as failed; start from its "À reprendre" list and known issues
  (reference images live in `screenshots/calibration/`, see `known-issues/`).
- **When an analysis or task ends, update `JOURNAL.md` before you finish**, whether it succeeded or not. Every
  discovered process or finding gets an entry: what was tried, the result **[OK] validated / [KO] failed /
  [?] unresolved**, the measurements or evidence, and the lesson ("Pensée"). Failures and dead ends are as
  valuable as successes: record why they failed so nobody repeats them.
- Add a new "Passe N" section at the bottom (newest last); update "À reprendre" (remove what is done, add what
  was discovered) and "Principes à garder". Write in French, factual, no embellished numbers.
- Keep a few key images for unresolved issues in `screenshots/calibration/known-issues/` (or a sibling folder per
  pass); delete throw-away captures.

## Commands
- `npm run dev` — dev server on http://127.0.0.1:5173
- `npm run typecheck` — `tsc --noEmit` (run after every change)
- `npm run build` — typecheck + production bundle
- `npm run shots [-- name:query ...]` — headless Chrome/Edge screenshots of the running dev server into `screenshots/`
  (env `SHOTS_DIR` changes the folder, `BASE_URL` the server). Query suffix `@x,y,w,h` clips a region.
- `npm run compare -- out.png before.png after.png "caption"` — labelled side-by-side composite
- `node tools/eval.mjs "<js using window.__app>" [query] [shot.png]` — evaluate inside the running app
- `node tools/perf.mjs [--secs=4] [--rounds=2] "label|<query or full url>|<js>" ...` — per-pass GPU ms (timer
  queries), uncapped frame time, draws/tris; variants interleaved in one browser session (the Iris Xe drifts
  thermally: only compare rows of the same run). A frozen baseline can be served from another port/worktree.
- `node tools/diff.mjs a.png b.png [out.png] [thr]` — pixel diff (use `static=1` shots: NPCs/smoke are not deterministic)
- `node tools/zoom.mjs in.png out.png x y w h [scale]` — nearest-neighbour crop for pixel-level sprite review
- `node tools/walk.mjs <prefix> "<query>" "w,d" <secs>` — holds keys, logs camera blend steps, writes a contact sheet

## Useful URL params
`seed=1842` (canonical) · `forge=sabotaged` · `clean=1` (no HUD/panel) · `freeze=7.3` (deterministic time) ·
`player=x,z` (place the player; the camera settles in that zone's framing, no arrival hold) ·
`camera=A|B|C` (pin a framing) · `camB=yaw,pitch,dist,fov,shift,hx,hy,hz` (override a framing while tuning) ·
`blend=A,B,0.5` (freeze mid-transition, with the blend's visible set) · `intro=0` (no arrival hold) ·
`cam=dist,pitchDeg,yawDeg,shift,tx,ty,tz[,fov]` (manual camera) · `vis=0` (no visibility bake: keep everything) ·
`static=1` (hide characters/particles) · `gpuprof=1` (per-pass GPU timer in `__stats()`)

## Art direction (locked)
Monochrome-leaning night: indigo / slate dominant, cool stone secondary, amber light as the only warm accent,
desaturated ivory for canvas/highlights. Keep props concentrated at focal points (hero stall, lantern clusters,
quay edge, bridge, a few banners); do not add uniform clutter.

## Camera graph (`src/app/CameraGraph.ts`)
Three authored, semi-fixed framings, all on the canal side looking up-canal (+x), chosen by zone with 0.9 m
hysteresis and blended 0.6-1.2 s (smootherstep on yaw/pitch/dist/fov/pivot/character scale):
- **A establishing** (west end x < -9.4, and the arrival hold on a fresh session until the first move): yaw -78,
  pitch 2.5, dist 44, fov 38 — moon, castle, bridge, canal; player small.
- **B merchant** (default): yaw -57.5, pitch 8, dist 26, fov 30 — the old locked view (yaw -55 / pitch 5 / 30 m /
  fov 34) re-staged; characters x1.12.
- **C forge** (x 4.2..13.2, z < 2.4): yaw -60, pitch 8.5, dist 27, fov 24 — a long-lens push-in from almost the B
  camera position (the boat's banner stays a right-hand framing element); characters x1.15.
Movement keys stay mapped through the yaw they were pressed under until released. Panel edits of a framing re-run
the visibility bake.

## Visibility-driven generation (`src/district/Visibility.ts`)
Every wall per floor / roof / far house / bridge is a visibility part. After generation the graph's ~100 sample
poses (each framing over its zone + AB/BC blend poses + their planar-mirror twins) are rendered as part-ID tiles and
counted on the GPU. Never-seen parts (Tier 3) leave every per-frame pass (shadow casters survive only for the
one-off moon-shadow render). Static meshes are ordered [always | notC | onlyA]; a framing = one drawRange. Building
back walls are not generated (keep the skipped RNG draw so seeds stay identical). Verify culling with
`static=1` shots, `vis=0` vs default: they must be pixel-identical.

## Rendering notes
- The mirror pass clips at the water with an oblique near plane: surface shaders must NOT `discard` (kills early-z).
- `lightSum()` walks a per-cell light list (`LIGHT_GRID`, rebuilt in `LightRig`); `lightMirror()` still uses all lights.
- The sky is drawn last among opaques, depth-tested.
- Sprites: nearest texel sampling, anchor snapped to the render-target pixel grid, scene alpha = DOF protection
  mask (1 - protection) read by DOF and in-scatter; a 55% overlay re-draws characters after transparent effects.

Detail tiers: anything that can sit in the foreground / midground of that camera (the whole north frontage up to the
bridge, plus the two houses just past it) is a generated building at full detail. Simplified modules
(`DistantCity.ts`) are reserved for non-walkable background planes only. The playable quay ends at the guards'
barrier (`WALK.x1`); the street beyond stays visible and fully built.

## Layout notes
- Composition constants live in `src/architecture/StreetComposer.ts` (`QUAY_Z`, `WATER_Y`, `SOUTH_QUAY_Z`, `WALK`, ...).
- Building slots are authored in `layoutSlots()` (`src/district/MerchantDistrictGenerator.ts`); slots may be `mirror`ed.
- Background layers (bridges, banks, hill city, castle) are in `src/district/DistantCity.ts` (one cheap far material).
- Fog/sky share `skyHaze()/skyColor()` in `src/materials/ShaderChunks.ts`; post (in-scatter, DOF, bloom, palette grade) in `src/atmosphere/PostFX.ts`.
- Headless perf numbers on this machine are GPU-bound; the vsync'd frame time quantises to 16.7/33.3 ms, so use
  `tools/perf.mjs` (GPU timer queries) and compare A/B in one session only.
