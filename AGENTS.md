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

## Git workflow (operator rules, 2026-10-16)
- **One working branch at a time** besides `main`, one per task (this project does not work directly on `main`). Never open a second
  branch while another one is unfinished.
- **On that branch, every commit is pushed right away** (`git push -u origin <branch>` the first time), with everything the branch needs;
  the `JOURNAL.md` update goes in the same commit as the work it records.
- **When the operator considers the task finished**: merge the branch into `main` (fast-forward when possible: `main` has a linear
  history), push `main`, delete the merged branch (local and remote), and only then create the branch of the next task.
- Before a push, check the commits for secrets and machine-specific paths (never committed, see "Art production principle").
- Anything else on `main` (direct commits, merging an unfinished branch), force pushes and history rewrites need the operator's explicit
  approval.

## Commands
- `npm run dev` — dev server on http://127.0.0.1:5173
- `npm run typecheck` — `tsc --noEmit` (run after every change)
- `npm run build` — typecheck + production bundle
- `npm run shots [-- name:query ...]` — headless Chrome/Edge screenshots of the running dev server into `screenshots/`
  (env `SHOTS_DIR` changes the folder, `BASE_URL` the server). Query suffix `@x,y,w,h` clips a region.
- `npm run compare -- out.png before.png after.png "caption"` — labelled side-by-side composite
- `node tools/eval.mjs "<js using window.__app>" [query] [shot.png]` — evaluate inside the running app
- `node tools/perf.mjs [--secs=4] [--warm=2.5] [--rounds=2] [--size=WxH[@dpr]] [--gpu=igpu|dgpu] [--witness=1|0] [--thr=15] [--json=f]
  "label|<query or full url>|<js>|<WxH[@dpr]>" ...` — per-pass GPU ms (timer queries, each frame's value: mean / p95), uncapped frame
  time, JS ms of `App.update` / `App.render`, draws/tris, and the adapter actually used; variants interleaved in one browser session
  (only compare rows of the same run: the GPU drifts thermally). The dev laptop is hybrid: Chrome renders on the integrated
  **Radeon 780M** (the game's `powerPreference` does not switch it), `--gpu=dgpu` forces the RTX 4060. Contention witness (Windows,
  `tools/gpu-witness.ps1`, read-only GPU performance counters): rounds during which another process used more than `--thr` % of the
  same adapter are flagged `*` and left out of the "clean" median; the min over rounds is the estimate without contention. The
  headless frame-time tail (p95) is not trusted (an idle page shows ~40 ms). A frozen baseline can be served from another port.
- `node tools/startup.mjs [--n=4] [--gpu=..] "label|<query or url>|<WxH>" ...` — boot phases (texture painters, atlas, generation
  laps, bake split, the boot's synchronous `regenerate()` block, the first frame after `App.start()` and the programs the first frames
  still create, time to `__ready`, long tasks) and first-use hitches (first / later occlusion reveal, forge swap, regeneration,
  programs created at the first reveal), median [min-max] per variant. The largest rAF interval from the very first frame is the
  `regenerate()` block under the loading screen, not the first frame (journal pass 6)
- `node tools/overdraw.mjs "label|<query or url>|<WxH>" ...` — fragments shaded per covered pixel in the scene pass (real draw order)
- `node tools/cadence.mjs [--secs=8] [--rounds=1] [--gpu=..] "label|<query or url>|<max | WxH[@dpr]>|<js>" ...` — the cadence the player sees, in
  a VISIBLE maximised Chrome window with vsync (a window opens on the desktop for the run: leave it on screen): display vsync, render
  intervals in vsync units, irregular share, GPU busy share, package and SoC power (`tools/energy-witness.ps1`, RAPL counters: SoC = package
  minus cores = the iGPU's share; a busy share is not a power figure, the driver lowers the clocks when there is slack), idle-page reference
  per round, foreign GPU use
- Frozen baseline for A/B: `git -c core.autocrlf=false archive <commit>` into a scratch folder, copy `node_modules/three` into it (no
  junction), serve it with the repo's `node_modules/vite/bin/vite.js <folder> --config <its config> --port <518x> --strictPort` (a
  `.claude/launch.json` entry); `autocrlf` on converts the archive's line endings (`dist/index.html` then differs by CR only)
- `node tools/diff.mjs a.png b.png [out.png] [thr]` — pixel diff (use `static=1` shots: NPCs/smoke are not deterministic)
- `node tools/zoom.mjs in.png out.png x y w h [scale]` — nearest-neighbour crop for pixel-level sprite review
- `node tools/walk.mjs <prefix> "<query>" "w,d" <secs>` — holds keys, logs camera blend steps (and occlusion fades:
  reversals / jumps), writes a contact sheet
- `node tools/occ-inventory.mjs [query] [out.json]` — empirical occluder inventory (`OCC_FRAC=0.55|0.9|0.2` = torso /
  head / legs ray): traces camera -> player over the quay x the graph's poses against every triangle, clusters hits
- `node tools/occ-compare.mjs out.png "caption" "label|file|x,y,w,h|scale" ...` — N-up labelled crops (reveal variants)
- `node tools/camsearch.mjs out.png <id> "x,z;x,z" "name=yaw,pitch,dist,fov,shift,hx,hy,hz[,gx,gz,rx,rz,cs]" ...` — camera
  search: candidates (rows) x player positions (columns) of one framing, contact sheet
- `node tools/camsim.mjs [--json=f] "name|x,z|keys:secs;g=x,z;..." ...` — deterministic walk through the real `App.update`
  (1/60 s steps, no rendering): framing changes, blend times, per-frame yaw / fov / pivot steps, control-yaw jump, the
  player's screen glide against its walking direction, reveal fades / flicker. `g=x,z` = a player steering to a point.
- `node tools/visproof.mjs [--keep=dir] "name|x,z|stable|A|B|C|D|X,Y,w" ...` — culling proof: pruned vs `vis=0` pixel diff
  (stable, pinned or frozen-blend poses); use QUERY with `occ=0`
- `node tools/viewport-proof.mjs [--keep=dir] [--sizes=WxH,...] [--seeds=a,b] [--q=extra&query] [--strict]` — window-format proof: bake success /
  page sizes, the view never leaving the baked frame, pruned vs `vis=0` at A-D + blends per size and seed, resize without reload vs fresh loads,
  and the `visfail` negative controls (DEV server); exit 1 on any failure. Draw-order witness: a differing pose is shot again on `vis=0` with
  every mesh's triangles reversed; pruned pixels within 1 px of a pixel that reversal changes are coplanar faces z-fighting (the culling's
  class order is not the builder order), reported as "order", failing only with `--strict`
- `node tools/vis-why.mjs [--seed=s] [--size=WxH] [--ss=2] [--q=..] "name|x,z|mode" ...` — explains a pruned-vs-`vis=0` diff: the parts this exact
  camera (direct and mirror) shows that the active set does not draw, their bake-size / 8x tile counts (tile 0 + tile8x > 0 = a sliver
  thinner than a bake pixel), the diff left once they are forced into the active set, and the draw-order witness
- `tools/eval.mjs` honours BASE_URL (serve a frozen baseline worktree on :5174 for A/B)
- `npm run art:doctor` — read-only report of the character art toolchain (Node, repo, Art Lab, Aseprite, Aseprite AI Artist);
  "Aseprite not installed" is a valid state (exit 0) and it never reports the integration as validated. `-- --json` available.
- `npm run art:validate` — provenance manifests (`art-lab/characters/manifests/*.manifest.json`) + orphan sources / exports + archived
  reference sheets (`art-lab/characters/reference/sources/`: each file against its `.source.json` record, SHA-256 and size); a
  `production` manifest also needs its export PNG to match the SHA-256 of its provenance pack (what the game's cast trusts)
- `node tools/art-lab/build-character.mjs art-lab/characters/rigs/<id>.rig.mjs [--check]` — an animated baked character from its rig script
  (archived sheet -> reconstruction per facing, with the rig's optional `source.options` such as `bgThreshold` or `closingFrom` -> one palette (or the approved palette pinned by `palette.from`) -> rig frames (idle / walk / talk / hammer) -> Aseprite `.aseprite` + sheet PNG / JSON with tags
  `<anim>-<dir>`); `--check` rebuilds into a temp folder and compares with the committed views and exports (needs Chrome + Aseprite)
- `npm run art:sheet -- <sheet.png> [meta.json] [--out f.png] [--scale 4]` — labelled nearest-neighbour review contact sheet
  (Windows PowerShell drops the first `--` of any `npm run x -- flags` and npm then eats the flags: write `npm run x '--' flags`
  or call `node tools/art-lab/<script>.mjs flags` directly)
- Character Lab (dev only): `npm run dev`, then `/character-lab.html` (or `npm run art:lab`) — shows an exported PNG sheet through
  Three.js at 1x / 4x / runtime scale; `window.__lab.selfTest()` checks nearest filtering texel-for-texel. Not part of the game or its build.

## Dev servers and background processes (operator rule, 2026-10-17)
- Start dev servers with the session's `preview_start` tool and a `.claude/launch.json` entry (`dev`, `dev-cast2`,
  `dev-cast3`); for a new port, add an entry instead of launching it by hand. Stop them with `preview_stop`.
- Run long scripts (`tools/perf.mjs`, `tools/viewport-proof.mjs`, trace series…) with the Bash tool's
  `run_in_background`, and stop them with `TaskStop` on their task id.
- Never use `taskkill`, `Stop-Process` or a system-wide process scan (`Get-CimInstance Win32_Process`, process lists
  filtered by command line) to find or stop leftovers: each one needs the operator's approval and can hit unrelated
  programs. If a process escapes the tools (an orphan holding a port), report the port and its owning PID
  (`Get-NetTCPConnection -LocalPort <port>`) and let the operator decide.
- Before ending a session, stop every server and background task it started.

## Useful URL params
`seed=1842` (canonical) · `forge=sabotaged` · `clean=1` (no HUD/panel) · `freeze=7.3` (deterministic time) ·
`player=x,z` (place the player; the camera settles in that zone's framing, no arrival hold) ·
`camera=A|B|C|D` (pin a framing) · `camD=yaw,pitch,dist,fov,shift,hx,hy,hz[,gainX,gainZ,refX,refZ,charScale]` (override
a framing while tuning; blank = keep) · `blend=C,D,0.5` (freeze mid-transition, with the blend's visible set) · `intro=0` (no arrival hold) ·
`cam=dist,pitchDeg,yawDeg,shift,tx,ty,tz[,fov]` (manual camera) · `vis=0` (no visibility bake: keep everything) ·
`static=1` (hide characters/particles) · `gpuprof=1` (per-pass GPU timer in `__stats()`) · `painters=main|<n>` (texture painters on the main
thread / in n Web Workers; default min(4, cores - 1) workers, the main thread below 2, journal pass 6 P3: same bytes either way) ·
`fps=off|<n>|v<k>|e<n>` (frame cap, `src/app/FrameCap.ts`: none / an average of n fps / one frame every k vsyncs / evenly paced near n, every
round(refresh / n) vsyncs; **default `e60`**, chosen by the operator on 2026-10-17: 55 fps at 165 Hz, 72 at 144, 60 at 60 / 120; the vsync
interval comes from a boot probe; `tools/perf.mjs` and `tools/startup.mjs` add `fps=off` unless the query sets `fps`; journal pass 6c) ·
`viscache=0|verify` (visibility bake cache off / bake and compare with the stored result, journal pass 6d) ·
`res=<lines>p[:px]` (internal resolution cap, manual: at most lines² x 16 / 9 rendered pixels, scene and reflection, the browser scales the canvas up,
smoothed or nearest with `:px`; at or under the budget nothing changes; default native, the operator's choice on 2026-10-18, journal pass 6e) ·
`msaa=0|2|4|8` (samples of the scene target, default 4; journal pass 6f) · DEV server only: `visfail=alloc|zero` (force a
visibility-bake failure: the fallback must keep every part and report it), `vispage=<px>` (bake page size), `visscale=<k>` (every bake tile k x:
what a finer bake would keep) and `visfine=D:4|A+B+C+D:2|0` (the extra fine tiles, default D at 2x; `0` = none) ·
`occ=0` (no player reveal: pixel-identical to Pass 2) · `occstyle=soft|dither|hybrid` · `occforce=all|0,2` (force
occluders open: review / visibility proof) · `occdebug=1` (proxy boxes, reveal ellipse, active list) ·
`occbehind=0` (skip the behind-occluder bake pass) · `occtest=shopA,tall` (treat those buildings' front walls as
occludable: stress test of the behind-occluder bake) · DEV server only: `labsprite=<id>|-&labpos=x,z[;x,z]` (show an Art Lab export
on the porter actor, standing still, in the real scene; `-` = generated frames for the "before" image; compiled out of production,
see `art-lab/README.md`) · DEV server only, EXPERIMENTAL: `baked=<id>&bakedpos=x,z` (a baked export in the MAIN atlas and renderer, per
`art-lab/characters/runtime-integration-contract.md` v3; never in production builds; flags in `src/lab/bakedLoader.ts`) · `cast=generated`
(skip the production cast of baked characters, `src/characters/BakedCast.ts`: the old generated porter / merchant) · DEV server only:
`cast=candidate` (also load the cast entries whose manifests still wait for the operator's approval: review before production)

## Art production principle
Maximise perceptual complexity while minimising runtime complexity.

Detail may be procedurally generated, baked, or selectively authored. The deciding factor is final perceptual quality, runtime
cost, reproducibility and operator approval — not procedural purity.
- External art tools (Aseprite and the like) are development-time helpers, never runtime, install or build dependencies:
  `npm install`, `npm run dev`, `npm run build` and the game must work on a machine without them. The game generates everything at
  boot except its production cast (`src/characters/BakedCast.ts`): baked character sheets (exported PNG + JSON, bundled as assets,
  SHA-256 checked against their provenance pack, decoded byte-exact) standing in for generated archetypes, and only those whose
  manifest is approved for production. Today: `dockworker-x2-v2` (in place of the porter), `merchant-x2-v2` (the hero stall's
  merchant), `blacksmith-x2-v1` (the forge's blacksmith), `guard-x2-v1` (both guards), `hooded-x2-v1` (the hooded stranger) and the five
  townsfolk of the ambient crowd (`artisan-x2-v1`, `traveler-x2-v1`, `townswoman-x2-v1`, `older-merchant-x2-v1`, `courier-x2-v1` in place of
  `crowd0`..`crowd4`), approved by the operator on 2026-10-17; the hero and the cat are still generated.
- A baked asset may reach the runtime only through an approved provenance manifest (`approved: true`, `runtimeUse: "production"`)
  and an explicit operator-approved task. Generated output never becomes canonical production art silently.
- `*.aseprite` files are production sources (tracked); the sheet PNG + metadata JSON exports are the baked, runtime-ready outputs.
  Local application / tool files, agent wiring with machine paths, secrets and temp files are never committed (`.gitignore`).
- The workspace is `art-lab/` (see `art-lab/README.md`, `art-lab/characters/README.md`). Whether Aseprite and its agent
  integration have been validated is recorded in `JOURNAL.md` (latest pass) and by `npm run art:doctor`, not here.

## Art direction (locked)
Monochrome-leaning night: indigo / slate dominant, cool stone secondary, amber light as the only warm accent,
desaturated ivory for canvas/highlights. Keep props concentrated at focal points (hero stall, lantern clusters,
quay edge, bridge, a few banners); do not add uniform clutter.

## Camera graph (`src/app/CameraGraph.ts`)
Four authored, semi-fixed framings, all on the canal side (+z of the pivot) looking up-canal (+x), chosen by zone with
0.9 m hysteresis and blended 0.6-1.3 s (smootherstep on yaw/pitch/dist/fov/pivot/character scale):
- **A establishing** (west end x < -9.4, and the arrival hold on a fresh session until the first move): yaw -78,
  pitch 2.5, dist 44, fov 38 — moon, castle, bridge, canal; player small.
- **B merchant** (default): yaw -57.5, pitch 8, dist 26, fov 30 — the old locked view (yaw -55 / pitch 5 / 30 m /
  fov 34) re-staged; characters x1.12.
- **C forge** (x 4.2..13.2, z < 2.4): yaw -60, pitch 8.5, dist 27, fov 24 — a long-lens push-in from almost the B
  camera position (the boat's banner stays a right-hand framing element); characters x1.15.
- **D frontal district** (x >= 14.0, any z; releases at 13.1): yaw -20, pitch 8, dist 20, fov 36 — the frontage seen
  almost square-on, a long horizontal backdrop to walk across; characters x1.12. Camera z must stay < ~18.5: the
  opposite-bank houses start at z 19.8 (never visible from A/B/C, they would swallow a camera placed further back), so
  D is a 20 m / fov 36 lens, not a long telephoto. A C -> D or B -> D blend (edge walkers at z > 2.4 never enter C's
  zone) is ANCHORED (`blendPose`): the pivot is shifted along the camera's own right / up so the player's screen
  position glides between its position in the two framings (no swing from the 40 deg yaw change, no backwards drift:
  D's pivot is set so the player enters D where it stood in C, ndc x ~ +0.35). 1.3 s.
Movement keys stay mapped through the yaw they were pressed under until released. Panel edits of a framing re-run
the visibility bake. Graph: A AB B BC C CD D (+ BD for the water's-edge walker).
Window formats (`CameraRig.applyFrame`): a pose's vertical field is its 16:9 one at every aspect. Wider than 16:9 sees more on the sides (up to
the frame the bake covered, `rig.frame`); narrower shows a horizontal crop of the 16:9 frame, placed by an off-axis lens shift so the player keeps
its 16:9 NDC; wider than the baked frame shows a vertical crop of it until the district is re-baked (400 ms after the resize settles, actors kept).
The graph composes its poses at `rig.poseAspect`. Never widen the lens on narrow windows: the view must stay inside the baked frame.

## Visibility-driven generation (`src/district/Visibility.ts`)
Every wall per floor / roof / far house / bridge is a visibility part. After generation the graph's ~270 sample
poses (each framing over its zone + AB/BC/CD/BD blend poses + their planar-mirror twins) are rendered as part-ID tiles and
counted on the GPU into 8 sets (A B C D AB BC CD BD). A part's need mask = the sets that show it. Never-seen parts
(Tier 3) leave every per-frame pass (shadow casters survive only for the one-off moon-shadow render). Each static mesh
stores its triangles class by class (class = distinct need mask), ordered by `planDraw` (search minimising the weighted
triangles drawn per framing / blend; A/B/C and their blends weigh double so they never draw more than before D); a
framing or blend = the prefix of classes up to the last it needs = one drawRange, no extra draw call. `levelOf(ids)` /
`setLevel(n)` replace the old 0/1/2 levels. Building back walls are not generated (keep the skipped RNG draw so seeds
stays identical). The bake renders its tiles into pages of at most 2048 x 2048 (the WebGL2 guaranteed minimum, also clamped to the GPU
limits) and counts them into shared counters; an incomplete target, a GL error or an empty set throws `VisBakeError` and the district keeps every
part (`snapshot().visibility.error`, console, panel): a failed bake must never cull. The tiles point-sample the view at 1/4 resolution (mirror
1/8): a strip thinner than one bake pixel can be missed. D sees the front-row side walls edge-on, so D's stable poses also get a 2x main-view
tile (`BAKE_FINE`, additive: +16 ms). Verify culling with `tools/visproof.mjs` / `tools/viewport-proof.mjs` (pruned vs `vis=0`, same session,
`occ=0` to keep the reveal fade out of the comparison): they must be pixel-identical, except the known residue (journal pass 5b): pixels decided
by draw order (coplanar far-city faces), single MSAA samples through rasterisation cracks, and slivers seen only between sampled poses.
Explain any new diff with `tools/vis-why.mjs` before changing the bake.
Bake cache (`src/district/BakeCache.ts`, journal pass 6d): the bake goes through a cache keyed by a 64-bit hash of everything its result depends
on (the ID scenes' geometry, poses, reveal windows, frame, options and page cap, the bake's own code via `bakeCodeFingerprint()`, the GPU string);
results live in memory and in localStorage (6 entries). A malformed entry is a miss, a failed bake is never stored, the DEV `visfail` controls
bypass it. `viscache=0` bakes and stores nothing; `viscache=verify` bakes and compares with the stored entry (`__stats().visibility.bakeCache`).
Anything new the bake reads must enter the key (`bakeKey`), or a stale result could cull.

## Player occlusion reveal (`src/app/Occlusion.ts`)
V1 protects the player only. When an occludable object stands between the camera and the player's torso, a soft
screen-space ellipse around the player is cut out of THAT object only (colour and depth, so the sprite really renders);
the rest of the object stays solid. The occludable set is tiny and measured (`tools/occ-inventory.mjs`): the boat's
banner, the boat's rig (mast / yard / sail) and the 7 quay lamps. Never tag small props, hulls, floor or whole buildings.
- Plumbing: occludable static parts are visibility parts (`kind: 'occluder'`); `addRanged` moves their triangles of
  each slot into a separate `occ:static:<slot>` mesh with an `aOcc` attribute (occluder index). The quay lamps are an
  instanced prototype: their draws swap to the `OCC_INST` variant (index = `uOccBase + gl_InstanceID`). Variants come
  from `MaterialLibrary.occVariant()`, share the slot's uniforms, and are bound ONLY while a fade is > 0 (otherwise the
  slot material is used: no discard anywhere, Pass 2 early-z intact, image pixel-identical to Pass 2). The one exception is
  `App.warmOcclusionVariants()`: at each regeneration, one throw-away frame (mirror + scene target, never presented) with every
  variant bound and every fade at 0, because ANGLE / D3D11 finishes a program at its first draw (the first reveal froze 0.3-1.1 s;
  compiling ahead without drawing does not help, journal pass 6). New occludable variants are warmed by it as long as they are in
  `occluders.meshes`.
- Only `occReveal()` (`ShaderChunks.ts`, `#if OCC`) may `discard` in a surface shader; it is skipped in the mirror pass
  (`uClipY`), shadows use an override material, alpha stays 1 (the DOF / in-scatter protection mask is untouched).
- Detection (`OcclusionReveal.update`) runs after `CameraGraph.update`, with the final pose (settled or mid-blend):
  segment camera -> torso vs voxelised proxy boxes; per-occluder fade in 0.2 s / out 0.3 s, 0.25 s release delay and a
  wider re-test radius while active. The ellipse (1080p reference: inner 40-70 px, outer 80-120 px) scales with the
  sprite's apparent height and the render height. Fragments are only cut if they are >= 0.35 m nearer than the player.
- Visibility bake: a second pass renders the world WITHOUT the occludable parts, ID'd only inside the reveal windows
  (the quay positions a pose can hold); what it shows joins the normal counts so a reveal never exposes a Tier 3 hole.
- New occluders: add them with `registerOcc` (static) / the lamp pattern (instanced) in `MerchantDistrictGenerator`,
  keep the table <= `OCC_MAX`, re-run the inventory and the `vis=0` vs default diff with `occforce=all`.

## Rendering notes
- The mirror pass clips at the water with an oblique near plane: surface shaders must NOT `discard` (kills early-z) —
  the single exception is the occludable variant above, bound only while a reveal is active.
- `lightSum()` walks a per-cell light list (`LIGHT_GRID`, rebuilt in `LightRig`); `lightMirror()` still uses all lights.
- The sky is drawn last among opaques, depth-tested.
- Texture painters (`TexturePainters.ts`) run as named jobs (`PainterJobs.ts`) in a small Web Worker pool (`PainterPool.ts`) while the main
  thread paints the canvas atlases; a worker that cannot start, throws or stays silent 20 s has its job painted on the main thread (console,
  `lib.painterFallbacks`). Painters must stay pure (no DOM, no `Math.random`) so both paths paint the same bytes, and the THREE textures are
  created in their fixed order afterwards (texture ids, uuids).
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
  `tools/perf.mjs` (GPU timer queries) and compare A/B in one session only. Measured state, ablations and the GPU plan: journal
  pass 6 (780M: 10-12 ms at 1080p, 16-21 ms at 2560 x 1440; the scene pass is bandwidth-bound by the 4x MSAA HDR target).
