# Cité du Tournoi — procedural HD-2D Merchant District

Three.js + TypeScript (Vite). Everything (geometry, textures, sprites, lighting) is generated from code at boot.

## Status
The Merchant District (night) is **complete** since 2026-10-19 (operator decision RJ1 « Clore après le gel », journal Passe Z4): milestone
M1 applied and reviewed, then frozen (journal Passes Z1-Z3). Its content, framings, cast and look stay as they are; any change to them is a
new task decided by the operator. It is **not** Gold Master (RJ3 « Pas encore »: that status is the operator's). Next (RJ2): the day states,
decided (journal Passes D4, D6; see "Art direction"): the morning, midday and the end of day are built behind `?time=` (journal Passes Y2-Y4);
the weather applies to each state (journal Passe Y5); the day's crowd is decided and applied (J7, journal Passes R3 / D7). After the operator's
review in game, the day is the default of « Explore the district » (L7-6a, journal Passe D8, applied in journal Passe D9 with the operator's
scope, « Midi » and « Le bouton seul »): the title screen's « Explore the district » opens midday; every address with parameters, and the bare
address in a driven browser, keeps the night without `time=`. The arena of the play mode (the duel and the forecourt) takes the slot's day state
by `DayState` (L7-2 « Oui, après la revue du jour (J9), par DayState », journal Passe AD1): the afternoon's bout at midday, the forecourt in the
morning, at midday, at the end of day or at night; `?scene=arena` without `time=` keeps the night. Still not Gold Master (L7-6b « Pas encore
(RJ3 inchangé) », journal Passe D8).

The playable slice (the gameplay contract's § 13, cloud session « version jouable », journal Passes L0-L7, its review in Passe L7) is on
`main`: the bare address shows the title screen to a person (New game / Continue / Explore the district; « Explore the district » is the game
above at midday, decision L7-6a, journal Passe D9); the game code lives in `src/simulation`, `src/tournament`, `src/combat`, `src/events`, `src/narrative` (pure) and `src/ui`,
`src/world` (pages). Its prepared decisions and gaps (E1-E30) are listed in journal Passe L7; the operator decided the six decisions and six of
the gaps on the sheet of journal Passe D8 (none by an agent), and the work they call for is five tasks of their own listed there.

## Master contracts (operator decision C1, 2026-10-20, journal Passe N2)
The operator's master contracts live in `contracts/`, versioned and therefore published, since the repository is public:
- `GAMEPLAY_MASTER_CONTRACT.md` and `TOURNAMENT_MASTER_CONTRACT.md` (v1.0, 2026-10-02, in French);
- `PROJECT_MASTER_CONTRACT.md`, the gameplay contract's higher authority (decision C2): pasted by the operator on 2026-10-20 and versioned
  as received (journal Passe N3; its header says version 1.2, its last line v1.1: the header governs, E25 « 1.2 : l’en-tête fait foi »,
  journal Passe D8). Its gaps with this repository (Blender and glTF as the city's source, runtime generation of the city as a V1 non-goal,
  turn-based combat...) are listed in `briefs/cloud-session-playable.md` § 3b. Decided in journal Passe D8:
  - generation by code is the project's way (E14 / E15, « Amender le contrat : la génération par le code est la voie du projet »); the pasted
    text stays as received until the task that amends it, written with the operator;
  - combat without turns stayed a recorded gap (E1 / E16, « Écart consigné jusqu’à la phase d’équipe ») until the combat-system workshop, led
    by the operator (journal Passe CB1): its specification is `briefs/combat-system.md` (« tour par tour dynamique »: the time never stops,
    instant actions or an automatic preparation delay, skills paid in action points, the opponent's priority while it attacks, guard and
    dodge, one resistance gauge per fighter whose break stuns 5-10 s, K.O. only). The operator amended the three « tour par tour » sentences
    of the project (§ 1, § 6.1) and gameplay (§ 1) contracts (A3, CB-8 « Amender maintenant, ces trois phrases »), each contract noting the
    change in its header; the rest of their text is unchanged. Until the operator's play test, the new rules stay behind a parameter and
    today's arena stays the default (CB-10). Lot C1 (journal Passe C1): the duel's rules as a pure simulation, `src/combat/dynamic.ts`
    (`DynamicSim`, `DYNAMIC_DATA`), its bot (`runDynamicBotDuel`, `src/combat/bot.ts`) and its off-screen race (`dyn*` in
    `src/combat/profiles.ts`); a game plays them only with `flags.combat = 'dynamic'` (the TournamentLab's `--rules=dynamic`). Lot C2 (journal
    Passe C2): the arena shows them behind `?scene=arena&combat=dynamic` (`src/arena/dynamicView.ts`, `DynPresets.ts`, `DynamicHud.ts`: today's
    clips on the new moments, the HUD of the design system with both gauges, the AP, the four skills and the opponent's priority; `dyn=` the
    trial's numbers), and the play mode with `&combat=dynamic` on a new game (the game's flag, in the save); today's arena modules never load
    them. The operator's trial: `briefs/combat-trial-c2.md` and the decision sheet of journal Passe C2.

They govern gameplay and the tournament; this file keeps the repository's rules (branches, journal, proofs, art). Two rules follow from
decision C3 (« Aucun verrou modifié, écarts consignés »):
- no lock (« verrou ») of a contract changes without the operator; the contracts' « décision A3 » is the operator's explicit decision, quoted
  word for word and dated in a journal pass, before any implementation (E11, « A3 = ma décision citée mot pour mot au journal », journal Passe
  D8);
- a gap between a contract and the code is recorded in the journal, never resolved by an agent.

The plan of the cloud session « version jouable » (the gameplay contract's vertical slice, § 13), with the operator's choices on it (§ 11), is
`briefs/cloud-session-playable.md`. Its brief is `briefs/cloud-session-playable-brief.md`.

The roadmap after the playable slice (the operator's five points, in order: the arena's sprites, the UI / HUD, the districts with the arena's
forecourt first, populating them, then gameplay) is `briefs/roadmap-2026-10.md` (journal Passe FR1); each of its tasks runs in a session of its own.

## Project journal (MANDATORY workflow)
`JOURNAL.md` is the project's memory: what was done, what worked, what failed and why, open problems, lessons. It holds the
recent passes, "À reprendre" and "Principes à garder"; older passes are archived **verbatim** in `journal/` (operator decision,
2026-10-18, journal Passe M3), and the index at the top of `JOURNAL.md` says which file holds which pass.
- **Before starting any new conversation or task — and always before an analysis, audit, optimisation or
  investigation — read `JOURNAL.md` first, whole.** Open a `journal/` file only for the pass a task or a reference
  ("journal pass 6k", "JOURNAL, Passe 4A-0B") points to, through the index, with targeted reads. Do not redo an approach
  the journal records as failed; start from its "À reprendre" list and known issues (reference images live in
  `screenshots/calibration/`, see `known-issues/`).
- **When an analysis or task ends, update `JOURNAL.md` before you finish**, whether it succeeded or not. Every
  discovered process or finding gets an entry: what was tried, the result **[OK] validated / [KO] failed /
  [?] unresolved**, the measurements or evidence, and the lesson ("Pensée"). Failures and dead ends are as
  valuable as successes: record why they failed so nobody repeats them.
- Add a new "Passe N" section after the last pass, before "À reprendre" (newest last); update "À reprendre" (remove what is
  done, add what was discovered) and "Principes à garder". Write in French, factual, no embellished numbers.
- **Archiving**: when the passes kept in `JOURNAL.md` exceed about 60 KB, move the oldest closed passes (closed = their branch
  merged: operator decision of 2026-10-19, « Branche fusionnée suffit », journal Passe D1) as one contiguous block, in their original order and byte for byte, into the next
  `journal/NN-passes-<first>-<last>.md` (a short header, a `---` line, then the unchanged bytes), add its row to the index, and
  prove the move (the archived bodies concatenated equal the removed bytes; every section in exactly one file; CRLF kept).
  Never edit an archived pass: a correction or a complement goes in a new pass of `JOURNAL.md`.
- Keep a few key images for unresolved issues in `screenshots/calibration/known-issues/` (or a sibling folder per
  pass); delete throw-away captures.

## Git workflow (operator rules, 2026-10-16)
- **One working branch at a time** besides `main`, one per task (this project does not work directly on `main`). Never open a second
  branch while another one is unfinished.
- **On that branch, every commit is pushed right away** (`git push -u origin <branch>` the first time), with everything the branch needs;
  the `JOURNAL.md` update goes in the same commit as the work it records.
- **When the task's work passes validation** (typecheck, tests, build, and the task's own proofs): merge the branch into `main` without
  asking (fast-forward when possible: `main` has a linear history), push `main`, delete the merged branch (local and remote), and only then
  create the branch of the next task. The operator says explicitly when a task must not be merged this way (operator rule, 2026-10-18).
- Before a push, check the commits for secrets and machine-specific paths (never committed, see "Art production principle").
- Anything else on `main` (direct commits, merging an unfinished branch), force pushes and history rewrites need the operator's explicit
  approval.

## Commands
- `npm run dev` — dev server on http://127.0.0.1:5173 (`strictPort`: it stops with an error when 5173 is taken instead of moving to another
  port, operator decision of 2026-10-19, journal Passe O1)
- `npm run typecheck` — `tsc --noEmit` (run after every change)
- `npm run build` — typecheck + production bundle
- `npm test` — unit tests of the pure logic (`tests/*.test.mjs`, built-in `node --test`, ~2 s, no browser or GPU): camera zone hysteresis,
  `planDraw`, the production cast's gate (manifest approval, SHA-256 against the provenance pack), sheet metadata, PNG decoding, the baked walk
  cycles' ground speed and the walkers' animation clock (journal Passe S2), the image generation tool offline (a fake API and key, journal Passe I1), the game's headless core and the tournament (journal Passes L1 / L2: determinism, saves, the pure modules, the off-screen resolution against full duels, the events and the sabotage chain), the arena's combat simulation against the prototype's own script
  read out of `arena/arena.html` (same events and state at every step, journal Passe P1), the arena fighters' atlas and the interface's design
  system (the fonts' bytes, the palette's tones and contrasts, the frames, the sizes, journal Passe UI3), the duel of the « tour par tour
  dynamique » (`tests/combat-dynamic.test.mjs`, journal Passe C1: each rule against an oracle, the duels' length, the bot, the off-screen race
  against full duels on held-out seeds, the arena of today untouched; ~15 s, the suite's longest file), the arena of the new duel
  (`tests/arena-dynamic.test.mjs`, journal Passe C2: the parameter, the keys, the trial's settings, today's clips on the new moments, the HUD's
  reading at every step of a duel, every scripted moment, the play mode's flag).
  `tests/load.mjs` loads `src/` through Vite's SSR loader (extensionless imports, `?url`, named JSON imports, as the bundle resolves
  them; `--experimental-strip-types` alone cannot), with its own cache folder (`node_modules/.vite-test`), no file watcher and no
  `vite.config.ts` (`configFile: false` + `server.watch: null`: a merged config drops the null, and the watcher crawled the ignored Art Lab
  scratch files, 22 s instead of ~2 s, journal Passe Q1b)
- `node tools/tournament-lab.mjs [--seeds=1..50 | --seeds=a,b] [--policy=idle|diligent] [--json=f]` — the TournamentLab (tournament contract
  § 13, journal Passe L2): whole games of the playable slice headless (the game's pure modules, the player's duels fought by a bot in the arena's
  full simulation): win, injury, upset and sabotage rates, events fired, forgotten participants; `--state=<named>` / `--save=<file>` `[--days=N]`
  loads a state and plays on; `--compare=a,b` two seeds side by side; `--rules=dynamic` plays the games under the rules of the « tour par tour
  dynamique » (journal Passe C1: their duels in `DynamicSim`, their off-screen matches in its race; absent = the arena of today). No browser
- `node tools/play-flow.mjs <outDir> <win|lose> [seed] [day]` — the play mode's scene change in a browser (journal Passe L3): a new game in the town
  page, the clock driven by `window.__game` to the day's bout, the arena page loaded from the save, the bout decided by scripted inputs on
  `window.__arena`, the town page again from the save; the browser's final state replayed in Node must give the same fingerprint (DEV or
  production server; `BASE_URL`, `CHROME_PATH` / `CHROME_ARGS` / `READY_MS` as `detshots`; `COMBAT=dynamic`: the game under the rules of the
  « tour par tour dynamique », journal Passe C2)
- `node tools/play-day.mjs <outDir> [seed]` — the first day in the town page (journal Passe L4): E next to Mara opens her dialogue, the day through
  `window.__game` (the steel cargo, the forecourt), every reload from the save, Node's replay with the same fingerprint
- `node tools/play-shots.mjs <outDir> "name|<named state>|<WxH,..>|<js>|<extra query>" ...` — review captures of the play mode at window sizes (DEV
  server: named states; `vis=0` unless the query sets `vis`), a panel opened by its JS (`__ui.openPerson('mara')`); not pixel proofs
- `node tools/title-proof.mjs <outDir> <base url> <branch url> [steps]` — the title screen's proof (journal Passe L4): in a browser that does not
  announce automation, the bare address shows the title screen (« Continue » only with a save); « Explore the district » then gives the frozen
  main's `?time=midday` at threshold 0 (journal Passe D9; `BASE_QUERY` changes that query, `BASE_QUERY=` = main's bare address, the night: the
  negative control; compare the two captures with `tools/diff.mjs`). Explore's DEV panel starts closed (journal Passe UI2): the base page gets
  `BASE_KEYS` before its capture (default `h`, its panel closed by H; `BASE_KEYS=` = the panel open, the negative control); Explore after H
  and the branch's own `BASE_QUERY` address (panel open) are captured against the base without keys; every page's panel state is checked
- `node tools/ui-text.mjs [--json=f] "name|<query>|<WxH,..>|<js>" ...` — the interface's text measured in the page (journal Passe UI3, S1 / S4):
  every visible text node's computed size and font, every character against the embedded fonts' subset; fails under 16 px on a computer or
  14 px on a phone (the design system's phone query), on a font other than the two embedded ones, on a character outside their subset, on fonts
  not loaded (DEV server for named states; `?title=1` for the title screen; `__arena.jump(...)` on arena pages)
- CI (`.github/workflows/ci.yml`, GitHub Actions, every push and pull request): Node 22 on `ubuntu-24.04` (pinned, operator decision of 2026-10-19), `npm ci`, `npm run typecheck`,
  `npm run build`, `npm run art:validate`, `npm test`. The runner has no Chrome, GPU or Aseprite (`puppeteer-core` downloads no browser at
  install): every other tool below (screenshots, perf / cadence / startup / overdraw measurements, visibility and viewport proofs, camera
  and occlusion tools, `build-character --check`, `art:doctor`, the Character Lab) stays a local proof on the operator's machine (journal
  Passe Q1)
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
- `node tools/cadence.mjs [--secs=8] [--rounds=1] [--gpu=..] [--visible=0|1] "label|<query or url>|<max | WxH[@dpr]>|<js>" ...` — the cadence the
  player sees, in a headed Chrome window with vsync: display vsync, render intervals in vsync units, irregular share, GPU busy share, package and
  SoC power (`tools/energy-witness.ps1`, RAPL counters: SoC = package minus cores = the iGPU's share; a busy share is not a power figure, the
  driver lowers the clocks when there is slack; under a heavy CPU load from other programs the difference is no longer the SoC, journal pass
  6j), idle-page reference per round, foreign GPU use. **Discreet by default** (operator's request, journal pass 6k): the window sits
  off-screen, one tab is reused (a new tab takes the keyboard focus), nothing is brought to front, and `max` emulates the maximised viewport
  (`MAX_VIEWPORT` in `bench-common.mjs`: same vsync, DPR and 2560 x 1267 rendering); `--visible=1` opens the maximised window on the desktop
- `node tools/vsync-probe.mjs [--n=8] [--play=<s>] [--size=..] [--cpuload=<k>|all] [--gpuload=<k>] [--visible=0|1] "<query or url>"` — the frame
  cap's vsync interval against the display's (same discreet window): the boot probe's reading and raw intervals per load, the interval after
  s seconds of play (in-session check), under k busy CPU threads or k uncapped headless pages of the app (journal pass 6k)
- Frozen baseline for A/B: `git -c core.autocrlf=false archive <commit>` into a scratch folder, copy `node_modules/three` into it (no
  junction), serve it with the repo's `node_modules/vite/bin/vite.js <folder> --config <its config> --port <518x> --strictPort` (a
  `.claude/launch.json` entry); `autocrlf` on converts the archive's line endings (`dist/index.html` then differs by CR only)
- `node tools/diff.mjs a.png b.png [out.png] [thr]` — pixel diff (use `static=1` shots: NPCs/smoke are not deterministic)
- `node tools/detshots.mjs <outDir> "<query>" <steps> "name|js" ...` — deterministic captures WITH characters: seeded `Math.random`, the game
  loop never started (`App.start` a no-op), N fixed 1/60 s steps, one render + shot per variant on the same frame (two loads: 0 px; journal
  Passes M5 / S1); `CLIP=x,y,w,h` crops; `CHROME_ARGS` replaces the GL switches (`--use-angle=swiftshader` without a GPU: software WebGL,
  compare such captures only with each other) and `READY_MS` the boot timeout (journal Passe T1)
- `node tools/sprite-halo.mjs <out.json> "<query>" [route] [secs] [every] [ring]` — the characters' halo in motion (same harness): per sampled
  frame and character, how much the post chain makes a character change the pixels 1..ring px around its silhouette, and its contrast kept;
  `POST=air|bloom|dof` attributes it to one effect (journal Passe S1)
- `node tools/foot-slip.mjs [--secs=20] [--keys=d,shift] "label|<query or url>" ...` — the baked walkers' foot slip in motion (same harness, no
  rendering): at each frame change, the planted foot's drift along the camera's right over the walker's own advance (0 = planted, negative =
  moonwalk; journal Passe S2); `--keys` holds movement keys (the player runs: a baked hero is measured too, Passe H6); a median of a few % can be
  the frame quantisation (5 or 6 steps of 1/60 s per frame, Passe H6). `node tools/art-lab/stride.mjs` — the ground speed each production walk
  cycle draws (the runtime's `walkSlide`)
- `node tools/step-angles.mjs [--secs=40] "label|<query or url>" ...` — the NPCs' steps by on-screen direction per framing (same harness, no
  rendering): front / three-quarter / profile sectors, and the 3-view rule's steps 20-40 deg off the shown view's axis (journal Passe H6)
- `node tools/art-lab/variant-masks.mjs <out.png> [id ...]` — the NPC variant masks (hair magenta, skin cyan) of the production sheets over their
  idle and walk frames, and each sheet's mask fingerprint; `node tools/art-lab/variant-lineup.mjs <out.png>` — every sheet's original and variants,
  recoloured with the shader's formula (journal Passe V1); `node tools/art-lab/palette-ramps.mjs` — the palette analysis of Passe V0
- `node tools/flipbook.mjs <out.html> "<spec prefix>" <from> <to> [every] [WxH] [zoom] "label|url" ...` — the same deterministic run on several
  servers / queries, a crop following one actor, played in sync in one self-contained HTML page (motion review, journal Passe S2); `KEYS=d,shift`
  holds movement keys (the player's run, Passe H6)
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
- `node tools/visproof-walk.mjs [--every=6] [--thr=24] [--q=..] [--keep=dir] [--control] "name|x,z|g=x,z;keys:secs;..." ...` — the visibility proof IN MOTION
  (journal Passe K7): the same deterministic walk (the player steered like `camsim`) on the culled default and on `vis=0`, stepped in lockstep,
  both shot every N steps and compared: the poses a walk really produces (a held-back follow, blends at their real weights), where `visproof` /
  `viewport-proof` replay sampled or pinned poses; `--control` (the culled page drawing A's parts only) must differ
- `tools/eval.mjs` honours BASE_URL (serve a frozen baseline worktree on :5174 for A/B)
- `npm run art:doctor` — read-only report of the character art toolchain (Node, repo, Art Lab, Aseprite, Aseprite AI Artist);
  "Aseprite not installed" is a valid state (exit 0) and it never reports the integration as validated. `-- --json` available.
- `npm run art:validate` — provenance manifests (`art-lab/characters/manifests/*.manifest.json`) + orphan sources / exports + archived
  reference sheets (`art-lab/characters/reference/sources/`: each file against its `.source.json` record, SHA-256 and size); a
  `production` manifest also needs its export PNG to match the SHA-256 of its provenance pack (what the game's cast trusts)
- `node tools/art-lab/build-character.mjs art-lab/characters/rigs/<id>.rig.mjs [--check]` — an animated baked character from its rig script
  (archived sheet -> reconstruction per facing, with the rig's optional `source.options` such as `bgThreshold` or `closingFrom` -> one palette (or the approved palette pinned by `palette.from`) -> rig frames (idle / walk / talk / hammer; facings down / up / side, plus the three-quarter downSide / upSide when the rig's source names them, journal Passe H8) -> Aseprite `.aseprite` + sheet PNG / JSON with tags
  `<anim>-<dir>`); `--check` rebuilds into a temp folder and compares with the committed views and exports (needs Chrome + Aseprite)
- `npm run art:sheet -- <sheet.png> [meta.json] [--out f.png] [--scale 4]` — labelled nearest-neighbour review contact sheet
  (Windows PowerShell drops the first `--` of any `npm run x -- flags` and npm then eats the flags: write `npm run x '--' flags`
  or call `node tools/art-lab/<script>.mjs flags` directly)
- Arena prototype (`arena/`, journal Passe A1; not part of the game or its build): `node tools/arena-shots.mjs <outDir> arena/arena.html
  "name|moment|js" ...` — captures of its scripted moments (`charging`, `window`, `combo`, ...); `node tools/arena-check.mjs <file.html> ...`
  — its combat simulation's state hash over a fixed input script, every moment in every mode without a page error, the telegraph's contrast
  against the floor (>= 2:1); both serve the file locally (`ARENA_THREE=<three r128>` when cdnjs is unreachable); `node tools/arena-page.mjs arena/arena.html <page.html>` — the page
  to publish as an artifact (the service adds its own document skeleton; journal Passe A2)
- Arena scene of the game (`?scene=arena`, `src/arena/`, journal Passe P1), on a running dev server (`BASE_URL`): `node tools/arena-scene-shots.mjs
  <outDir> "<extra query>" "name|moment|js" ...` — captures of the scripted moments (`__arena.jump`: the prototype's eleven plus `strike`,
  `heavyRen`, `ko`; deterministic, every step delivered to the presentation); `node tools/arena-scene-check.mjs ["<extra query>"]` — live play
  (keys pressed while the loop runs), the simulation's hash against the prototype's (with `combat=dynamic`: DynamicSim's own script against
  `DYNAMIC_SIM_HASH`, journal Passe C2), every moment in every assistance mode without a page error, the floor telegraph's contrast (>= 2:1,
  also deuteranopia); exit 1 on a failure; `node tools/arena-scene-page.mjs <outDir> [query] [title]` (query default `scene=arena`) — a
  production build with relative paths and the page to publish as an artifact (`arena-page.html`, no document skeleton, sets `?scene=arena`
  itself: the service hands no query string; its supporting files are `assets/*`; journal Passe P2). GPU time per pass of the arena:
  `node tools/perf.mjs "arena|scene=arena"` (the tool drives `window.__arena` when there is no `__app`; `?gpuprof=1` for the panel-less timer)
- Character Lab (dev only): `npm run dev`, then `/character-lab.html` (or `npm run art:lab`) — shows an exported PNG sheet through
  Three.js at 1x / 4x / runtime scale; `window.__lab.selfTest()` checks nearest filtering texel-for-texel. Not part of the game or its build.
- `node tools/art-lab/build-trial.mjs art-lab/characters/rigs/<id>.rig.mjs [--check]` — a LAB character at another density than x2 (the rig's
  `frame`: 32k x 48k, feet on 45k): build-character.mjs's chain (reconstruct-grid, quantize-palette with a pinned palette, rig-engine, the
  frame contract, Aseprite, every exported frame compared), build-character.mjs left as it is (its SHA-256 is pinned in the approved packs);
  first use: `hero-x3-trial` / `hero-x4-trial`, `trialRig(K)` of `rigs/hero-trial.common.mjs` (journal Passe AA2)
- `node tools/art-lab/gen-image.mjs --task=<name> --prompt-file=<f.txt> [--ref=<image> ...] [--n=1] [--size=1536x1024] [--quality=high]
  [--dry-run]` — images through the OpenAI Images API, under the rule "Image generation" below (`--list-models`, `--spent`,
  `--archive=<generated.png> --name=<base>`; journal Passe I1)

## Dev servers and background processes (operator rule, 2026-10-17)
- Start dev servers with the session's `preview_start` tool and a `.claude/launch.json` entry (`dev`; `dev-strict` = the repo on :5186 with
  `--strictPort`, through `node node_modules/vite/bin/vite.js`, safe from the other local project that also uses 5173: tools take
  `BASE_URL=http://127.0.0.1:5186/`); for a new port, add an entry instead of launching it by hand. Stop them with `preview_stop`.
- Run long scripts (`tools/perf.mjs`, `tools/viewport-proof.mjs`, trace series…) with the Bash tool's
  `run_in_background`, and stop them with `TaskStop` on their task id. `TaskStop` on a background `bash script.sh` stopped the shell, not
  the node / Chrome it had started (they ran on to their end and two measurements measured each other, journal pass 6h): before relaunching,
  look up the witness's foreign GPU PIDs with `Get-Process -Id <pid>` and wait for them to exit.
- Never use `taskkill`, `Stop-Process` or a system-wide process scan (`Get-CimInstance Win32_Process`, process lists
  filtered by command line) to find or stop leftovers: each one needs the operator's approval and can hit unrelated
  programs. If a process escapes the tools (an orphan holding a port), report the port and its owning PID
  (`Get-NetTCPConnection -LocalPort <port>`) and let the operator decide.
- Before ending a session, stop every server and background task it started.

## Useful URL params
`seed=1842` (canonical) · `forge=sabotaged` · `clean=1` (no HUD/panel) · `freeze=7.3` (deterministic time) ·
`player=x,z` (place the player; the camera settles in that zone's framing, no arrival hold) ·
`camera=A|B|C|D` (pin a framing) · `camblend=interpolated` (the former interpolated A <-> B / B <-> C blends, for comparison; absent = every blend
anchored, the operator's decision of 2026-10-19, journal Passes K1 / K4) · `camfollow=off` (the former follow, for comparison; absent =
while D is on screen the follow never overtakes the player on screen, the focus held back and caught up by the usual smoothing: journal Passe K5,
the default since the operator's decision of 2026-10-19, « Adopter (avec la preuve) », journal Passes D3 / K7) · `camD=yaw,pitch,dist,fov,shift,hx,hy,hz[,gainX,gainZ,refX,refZ,charScale]` (override
a framing while tuning; blank = keep) · `blend=C,D,0.5` (freeze mid-transition, with the blend's visible set) · `intro=0` (no arrival hold) ·
`cam=dist,pitchDeg,yawDeg,shift,tx,ty,tz[,fov]` (manual camera) · `vis=0` (no visibility bake: keep everything) ·
`title=1` (the title screen, journal Passe L4, choice P2: « New game », « Explore the district », « Continue » with a save; it shows by itself
on the bare address only, and only in a browser no automation drives (`navigator.webdriver`), kept by the operator (L7-5 « Le garder », journal
Passe D8): every tool and proof keeps today's game; its
« Explore the district » runs today's town at midday, as `time=midday` without changing the address, and the DEV panel: decision L7-6a, journal Passe D9; that panel closed, H opens it: decision P1, journal Passe UI2) · `play=1` (the game's play mode, journal Passe L3, loaded on demand: the state from the browser's save, or `&new=1&name=<name>&seed=<n>` for a
new game; DEV only `&state=<named state>` of `src/simulation/named.ts`; the page shown is the state's place, or the day's bout with
`&scene=arena`; moving to another slot or place saves and reloads; `&noreload=1` keeps the page and leaves the next address in `window.__go`;
`window.__game` drives it: `state()`, `actions()`, `act(action)`, `hash()`; the tools' parameters `fps`, `vis`, `viscache`, `painters`, `res`,
`msaa`, `refl`, `camera`, `player`, `static`, `occ`, `freeze`, `gpuprof` are carried into the scene; absent = the game as before) ·
`static=1` (hide characters/particles) · weather (`src/atmosphere/Weather.ts`, journal Passe W1; absent = nothing created, the game as before;
a bare parameter = 1): `rain=<0..1>` (lamp-lit streaks, wetter cobbles, rings in puddles and on the canal, a little more mist), `snow=<0..1>`
(drifting flakes, a cover on the cobbles and upward faces), `storm=<0..1>` (lightning flashes every 5-14 s, overcast sky hiding the moon; brings
rain 0.85 x storm and wind 1 + storm unless given), `wind=<0..3>` (cloth / leaves sway, smoke drift, precipitation slant; 1 = as before);
by day (`time=`, journal Passe Y5) the cover of rain, snow or storm veils the sun (its light and its shadow; to 18 % under a full storm), greys
the sky (an overcast deck, the bolt during a flash), the haze, the zenith and the ambient, and lowers the grade's saturation; wind alone leaves
the day's cobbles dry; at night every weather is the one of Passes W1-W3;
DEV: the panel's closed « Weather » section changes it while playing (`App.setWeather`, journal Passe W2) · `time=morning|midday|afternoon` (alias `time=day` = midday; the day
states, `src/atmosphere/DayState.ts`, the operator's decision D6, each after its generated track: `midday` (journal Passes Y1 / Y2) - a high
sun in the moon's place and its shadow, a deep blue sky with white clouds, saturated blue roofs and water, almost no haze; `morning` (journal
Passe Y4) - a soft sun not yet high from the canal side, a pale sky veiled by a cool haze and mist, dewy cobbles, slate-blue roofs;
`afternoon`, the end of day (journal Passe Y4) - a low golden sun at the far end of the canal, long shadows, a warm haze and a glow around the
sun; in every day state the lanterns, windows and far lights are unlit, the forge lit, and the tournament's bunting is up (blue and ivory
pennants along the frontage, across the street to the quay lamps and along the quay wall, journal Passe Y3); more walkers by day: 6 in the
morning, 12 at midday, 9 at the end of day at density 1 (the operator's decision J7a, journal Passe D7; the night keeps 5); `evening` is not a parameter:
the evening is the night; absent or `night` = the night, unchanged, for every address (tools, proofs, the play mode's
evening); only the title screen's « Explore the district » takes midday by itself (the operator's decision L7-6a, journal Passes D8 / D9, scope
« Le bouton seul »)) · `gpuprof=1` (per-pass GPU timer in `__stats()`) · `painters=main|<n>` (texture painters on the main
thread / in n Web Workers; default min(4, cores - 1) workers, the main thread below 2, journal pass 6 P3: same bytes either way) ·
`fps=off|<n>|v<k>|e<n>|a<n>` (frame cap, `src/app/FrameCap.ts`: none / an average of n fps / one frame every k vsyncs / evenly paced near n, every
round(refresh / n) vsyncs / the same with an adaptive step; **default `a60`**, chosen by the operator on 2026-10-18 (`e60` from 2026-10-17):
55 fps at 165 Hz, 72 at 144, 60 at 60 / 120; the vsync interval comes from a boot probe, checked in session (the intervals of the callbacks the
cap skips, or the grid of all callbacks, over 1.5 s windows without a late frame; two agreeing readings more than 10 % off replace it: the
callback rate can change during a session, journal pass 6k); `tools/perf.mjs` and `tools/startup.mjs` add `fps=off` unless the query sets
`fps`; journal pass 6c; `a<n>` = `e<n>` with an adaptive step: one more vsync per frame while rendered frames keep missing their slot, down to
30 fps, then trials of the shorter step after 4-16 s; `__stats().frameCap` shows the step and its changes; journal pass 6h) · DEV server only:
`vsyncprobe=<ms>` (a wrong boot reading on demand) and `vsyncwatch=0` (no in-session check), to prove the check (journal pass 6k) ·
`viscache=0|verify` (visibility bake cache off / bake and compare with the stored result, journal pass 6d) ·
`res=<lines>p[:px]` (internal resolution cap, manual: at most lines² x 16 / 9 rendered pixels, scene and reflection, the browser scales the canvas up,
smoothed or nearest with `:px`; at or under the budget nothing changes; default native, the operator's choice on 2026-10-18, journal pass 6e) ·
`msaa=0|2|4|8` (samples of the scene target, manual; default 4, the operator's choice on 2026-10-18, journal pass 6f) ·
`refl=<scale>` (planar reflection size against the internal resolution, manual; default 0.5, the operator's choice on 2026-10-18, journal pass 6g) · DEV server only: `visfail=alloc|zero` (force a
visibility-bake failure: the fallback must keep every part and report it), `vispage=<px>` (bake page size), `visscale=<k>` (every bake tile k x:
what a finer bake would keep) and `visfine=D:4|A+B+C+D:2|0` (the extra fine tiles, default D at 2x; `0` = none) ·
`occ=0` (no player reveal: pixel-identical to Pass 2) · `occstyle=soft|dither|hybrid` · `occforce=all|0,2` (force
occluders open: review / visibility proof) · `occdebug=1` (proxy boxes, reveal ellipse, active list) ·
`occbehind=1` (run the behind-occluder bake pass; absent = skipped since the district's freeze, the operator's decisions T1 / RG1, journal Passe Z1) · `occtest=shopA,tall` (treat those buildings' front walls as
occludable: stress test of the behind-occluder bake) · DEV server only: `labsprite=<id>|-&labpos=x,z[;x,z]` (show an Art Lab export
on the porter actor, standing still, in the real scene; `-` = generated frames for the "before" image; compiled out of production,
see `art-lab/README.md`) · DEV server only, EXPERIMENTAL: `baked=<id>&bakedpos=x,z` (a baked export in the MAIN atlas and renderer, per
`art-lab/characters/runtime-integration-contract.md` v3; never in production builds; flags in `src/lab/bakedLoader.ts`) · `crowd=<n>` (n ambient walkers, the five townsfolk in turn, journal Passe C1; absent =
round(5 x density) in turn, each townsperson once at density 1: the operator's decision of 2026-10-19, « Cinq par défaut », journal Passe C2; the quay
holds 8 walkers at most 3.2 m apart, so with `crowd` or by day a walker without a place tries again 2.2 then 1.4 m apart, journal Passe R3 and the
operator's decision J7b « Accepter », Passe D7; by day the default is round(n x density) with n = 6 / 12 / 9 for the morning / midday / end of day,
decision J7a, Passe D7) · `cast=generated`
(skip the production cast of baked characters, `src/characters/BakedCast.ts`: the old generated hero / porter / merchant / NPCs) · DEV server only:
`cast=candidate` (also load the cast entries whose manifests still wait for the operator's approval: review before production; none today) ·
`views=3` (the three-view rule for every sprite; absent = the five-view rule, journal Passe V5: front / three-quarter / profile sectors at
22.5 / 67.5 deg on screen, for the sheets that hold both three-quarter facings `downSide` / `upSide` only, today the hero; every other sprite
keeps the three views; the default since the operator's decision of 2026-10-19, « Par défaut avec le héros », journal Passes D3 / H10) ·
`facing=ray|screen` (walking views; absent = the hero by the line of sight - the heading's angle to the ground direction from the walker to
the camera, so a walk away shows his back even where the low pitch of A turns it into a slide toward the vanishing point - and the NPCs by
their step on screen, journal Passe F1, until they have three-quarter views: the operator's decision K9, journal Passe K10, refined by
`npcfacing` below; `ray` = everyone by the line of sight, `screen` = everyone by the screen, for comparison, journal Passe K9) ·
`npcfacing=screen|mirror|34|wide` (the NPCs' walking views, journal Passe F2; absent = `34`, the default since the operator's decision of
2026-10-20, « Applique npcfacing=34 comme règle par défaut des PNJ. », journal Passe F3): the five townsfolk's `down` is drawn turned left (their
reference sheet has no true front; `frontLeft` in `BakedCast.ts`); `34` turns it toward a rightward step (held within 8 deg of the vertical) and
keeps it up to 67.5 deg from the vertical for a step going down the screen (profile beyond), every other sheet keeping the screen rule;
`screen` = the screen rule of Passe F1 for every NPC (the game before), `mirror` = the turn only, `wide` = 34 + every NPC's front / back up to 60
deg; carried into the play mode · `spriteedge=rim|norim` (the baked sheets' silhouette edge, journal Passes S3 / S3b, the
operator's « contours blancs »: absent = a dark outline, day and night, the operator's decision « Contour noir 25 %, de jour et de nuit :
applique-le par défaut. » - no crown rim (the shader's top-edge light, that the sun turned white by day) and the outer texel ring at a quarter
of its colour; `rim` = the crown rim as before, for comparison; `norim` = no rim, no dark ring; carried into the play mode's town) · DEV server only:
`variants=candidate` (apply the NPC variants file `art-lab/characters/variants/variants.json` while it waits for the operator's approval; production
applies it only once approved, its mask fingerprints checked, journal Passe V1) · `scene=arena` (the arena of the Cité du Tournoi instead of the
town, `src/arena/ArenaApp.ts`, loaded on demand; journal Passe P1; absent = the town, unchanged) with `assist=subtle|full|off` (the prototype's
visual assistance, default subtle; full adds the floor telegraph, the alert and the reaction window's bar), `hud=0` (or `clean=1`: no HUD),
`cam=pitchDeg,dist,fov,ty,tz,tx` (the arena's framing while tuning; blank = keep), `time=morning|midday|afternoon` (a day state of the arena,
journal Passe AD1: the state's sky, haze, grade, its sun turned into the arena - morning and midday keep their place against the moon, the end of
day's low sun stands in the gate where the moon hangs at night - only the fires lit (braziers, the tunnels' hearths), the fighters' silhouette
treatment at the night's strength; the play mode's duel and forecourt set it from the slot, `arenaQuery`; absent = the night, unchanged),
`combat=dynamic` (the duel of the « tour par tour dynamique », lot C2, journal Passe C2: `DynamicSim` and its HUD, keys 3-6 the four skill slots;
`dyn=apMax:5,apStart:1,apRegen:0,gauge:100,decay:1.8,stun:6,breakDmg:1.2,guard:0.6,level:3,foeHp:8000,renHp:2200` sets the trial's numbers, each
bounded, any other key or value refused; absent = today's CombatSim, unchanged; the play mode: `&combat=dynamic` with `new=1` or `state=`); keys
1-6, A dodge, B guard (hold), R restart, Space pause, H HUD; DEV server only, the fighters' density trial (journal Passe AA2, decision AA1-3;
`src/lab/fighterDensity.ts`, compiled out of production builds): `fighterdensity=x2|x3|x4` (Ren drawn by the hero's baked sheet: `hero-x2-v4` as it is, or
the lab rebuilds `hero-x3-trial` / `hero-x4-trial`, idle and walk only, at the hero's scale 0.9), `fighterpose=idle|walk|idle.<i>|walk.<i>`,
`fighteredge=dark|rim` (the town's dark outline, default, or the shader's crown rim); `window.__density` (the sheet, its atlas cost, `measure()` the
texel on screen); absent = the arena as before (0 px against frozen main, the production bundle identical)

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
  `crowd0`..`crowd4`), approved by the operator on 2026-10-17; `hero-x2-v4` (the player, in five facings, run cycles drawn in
  every facing), approved on 2026-10-20 (« Production : mets hero-x2-v4 en production à la place de hero-x2-v3. », journal Passes K11 / H11), in
  place of `hero-x2-v3` (approved on 2026-10-19, journal Passes D3 / H10, now superseded); the cat is still generated. The arena scene (`?scene=arena`, journal
  Passe P1) generates its fighters (Ren with the hero's palette, Marek, and the play mode's Vessa Lark, kept generated for the slice: L7-1 « La
  garder pour la tranche », journal Passe D8) with the town generator's rules at x2 density (`src/arena/FighterArt.ts`);
  a baked sheet can take their place by the same frame keys only through an approved manifest; the combat sheets are made at x3 (the
  operator's decision AA2-1 « ×3 », journal Passe AA2: 2.3 px per texel in the duel at 1080p, as the hero in the town's close framings).
- A baked asset may reach the runtime only through an approved provenance manifest (`approved: true`, `runtimeUse: "production"`)
  and an explicit operator-approved task. Generated output never becomes canonical production art silently.
- `*.aseprite` files are production sources (tracked); the sheet PNG + metadata JSON exports are the baked, runtime-ready outputs.
  Local application / tool files, agent wiring with machine paths, secrets and temp files are never committed (`.gitignore`).
- The workspace is `art-lab/` (see `art-lab/README.md`, `art-lab/characters/README.md`). Whether Aseprite and its agent
  integration have been validated is recorded in `JOURNAL.md` (latest pass) and by `npm run art:doctor`, not here.

## Image generation (operator rule, 2026-10-19)
The operator's decision, word for word: « Oui : fais créer l'outil de génération d'images par la séance du héros, avec un plafond de 5 $ par
tâche, la provenance enregistrée automatiquement et la règle dans AGENTS.md. » (journal Passe I1).
- Images are generated only through `tools/art-lab/gen-image.mjs` (OpenAI Images API, plain Node, no dependency), never by a hand-written
  request. **Cap: 5 USD per task**, kept in a git-ignored ledger (`art-lab/characters/scratch/gen-image-ledger.json`): each request is reserved at
  its worst-case estimate before it is sent and refused beyond the cap; `--cap` may only lower it. Raising the cap is the operator's decision.
  `--dry-run` shows the request and its estimate without sending anything.
- The key (`OPENAI_API_KEY`) lives in the environment or in `.env.local` at the repo root, which must stay git-ignored (the tool checks it).
  It is never read by hand, printed, logged, committed or copied into a record, a message or another session. The MiniMax key of the same
  file is not used unless the operator asks.
- Provenance is automatic: every image keeps the API's original bytes next to its `.source.json` (model, endpoint, parameters, exact prompt and
  its SHA-256, references' SHA-256, request id, dates, usage, cost from the tool's price table). The C2PA chunk is located, never claimed valid.
  Generated images land in `art-lab/characters/scratch/generated/<task>/` (ignored); one that matters is copied byte for byte with
  `--archive` into `art-lab/characters/reference/sources/` (checked by `npm run art:validate`) and committed with its record.
- **Generated images are non-canonical** until the operator approves them; any use as a source of a character, and anything reaching the
  runtime, goes through the usual manifests and the operator's decisions ("Art production principle").
- Cloud sessions have no key (`.env.local` is not in the repository). Protocol: the cloud session writes its request in a tracked file on its
  branch (prompt, references, count, purpose) and pushes; the operator tells the local session (or it reads the cloud session's transcript);
  the local session generates with the tool, archives the images it keeps under `reference/sources/` with their records, pushes only its own
  commits on top of that branch, and tells the cloud session to pull.
- Cloud relay (journal Passe N4): any tool a cloud session lacks (Aseprite, the OpenAI key, the operator's GPU) is requested in a tracked file
  `briefs/local-requests/NNN-<topic>.md` pushed on its branch. A local session watches that branch, does the work, writes the answer in the
  same file, pushes only its own commits on top and messages the cloud session. A cloud session cannot message any session; the request never
  blocks its work.

## Art direction (locked)
Monochrome-leaning night: indigo / slate dominant, cool stone secondary, amber light as the only warm accent,
desaturated ivory for canvas/highlights. Keep props concentrated at focal points (hero stall, lantern clusters,
quay edge, bridge, a few banners); do not add uniform clutter.
Day and night (the operator's note of 2026-10-19, word for word, journal Passe D1): « Mais prend en compte que nous aurons un etat jour et nuit, et jour sera l'etat par defaut qui represente les evenements principaux du jeu : le deroule du tournoi ». Its art direction is decided
(the operator's day-state sheet, journal Passe D4, then the operator's direction of journal Passe D6); a first draft runs behind `?time=day`
(journal Passe Y1), midday matched to the midday track behind `?time=midday` (journal Passe Y2), the morning and the end of day matched to
their tracks behind `?time=morning` / `?time=afternoon` (journal Passe Y4). The night above stayed the game's default until the operator approved the day in game (J9 « Après ma revue en jeu »); after that review the operator decided « Le jour devient le défaut d’« Explore the district » (tâche à part) » (L7-6a, journal Passe D8), applied in journal Passe D9 with the operator's answers « Midi » and « Le bouton seul »: « Explore the district » opens midday, and any address without `time=` keeps the night.
Day (decided, journal Passes D4 and D6):
- **Four fixed states** (D6, replacing J8 « Deux états fixes »): **morning**, **midday** (the tournament's launch), **end of day** (after the
  tournament) and **evening, which is the night above** (the operator's answer « La nuit actuelle »). **The weather** (rain, snow, storm,
  wind) applies to each (built, journal Passe Y5: by day the cover veils the sun and greys the sky; the night's weather unchanged).
- **Midday is the generated midday track** (the operator, word for word: « le jour doit etre cette image joint »):
  `art-lab/characters/reference/sources/day-state-midday-2026-10-19.png`. That means a deep blue sky with white clouds, a high sun and short
  crisp shadows, saturated blue roofs and banners, and the tournament's bunting along the whole frontage, across the street and on the quay wall
  (« Comme l'image »). For midday this replaces the sheet's J2 (the night's rule transposed), J3 (pale sky, light haze) and J5 (bunting at the
  focal points). The image's characters were redrawn by the tool: its light, palette, sky and bunting are the target, not its sprites.
- **Morning and end of day** take the generated morning and late-afternoon tracks as references (`day-state-morning-2026-10-19.png`,
  `day-state-late-afternoon-2026-10-19.png`). Built and shown (journal Passe Y4), not yet reviewed in game by the operator. As on its track,
  the morning's light comes from the canal side (not from an east consistent with the end of day's sun at the far end of the canal).
- **Kept from the sheet**: J4, lanterns and windows unlit by day, the forge lit; J6, the bunting by day only, never at night; J7, more people by
  day, decided on the sheet of journal Passe R3 (journal Passe D7): J7a « Matin 6, midi 12, fin 9 » (walkers at density 1; the night keeps 5)
  and J7b « Accepter » (the relaxed spacing beyond eight); J9, the night stays the default until the operator
  approves the day in game (the operator's review in game of 2026-10-20, word for word: « tout est bien implemente mais la nuit rst toujours le
  defaut pour le moment », journal Passe K9); then L7-6a (journal Passe D8): the day becomes the default of « Explore the district », applied
  in journal Passe D9 (midday, the button alone).
Interface (decided, journal Passe UI1: the operator's UI sheet, 14 choices of 14, all at the recommendation; roadmap step 2):
- **Direction C « Héraldique pixel »** (L1): pixel-art frames generated by code, on the sprites' texel grid, in nine slices (S2 « Générés par
  le code (neuf tranches) »); the tournament's royal blue, ivory and gold, amber for the action, gauges inside the palette (S3 « Bleu, ivoire,
  or ; ambre pour l'action », with the operator's note, word for word: « Cela peut changer par la suite »: the palette is provisional).
- **L2 « Un style, des tons qui suivent DayState »**: one style, day and night, whose tones follow the page's day state (`DayState`).
- **L3 « Avec le système de design »**: the phone layout (a strip, a dialogue sheet, tabs) comes with the design system; touch stays out of the
  slice (E30).
- **L4 « Visage cuit d'abord, bustes plus tard »**: a character's portrait is first the face of its baked sheet; busts of the main characters
  later, through the art chain (manifest, blind critique, the operator's approval), in a task of their own.
- **S1 « Pixel pour les titres + texte lisible »**: an embedded pixel font for titles, numbers and keys, and an embedded readable text font
  (free licence); no system font.
- **S4 « 16 px ordinateur, 14 px téléphone »**: no text under 16 px on a computer, under 14 px on a phone.
- References: `art-lab/characters/reference/sources/ui-direction-c-{town,arena,town-night,phone}-2026-10-24.png`, **non-canonical**
  (generated): their illustrated busts, their green and red gauges and the scene they redrew are not targets.
- Order: P1 « Fermé par défaut, H l'ouvre » (Explore's DEV panel closed, H opens it), P2 « En premier » (one cost tag per currency: coins from
  the simulation's `ActionOption.coins`, the slot, « free » only when nothing is spent) and P3 « En premier » (the arena's action bar 60 px
  high on a computer, its sub-labels whole), done before the design system (journal Passe UI2); then the design system
  (roadmap step 2.3: S1-S4, L2, L3, L4; built in journal Passe UI3, see below), and screen by screen P4 (the dialogue at the bottom, the speaker visible), P5 (« Here » reduced to the
  place's actions) and P6 (the match sheet and the victory), « Avec la direction choisie ».
- **The design system** (journal Passe UI3, `src/ui/design/`): `tokens.ts` holds every colour of the interface (four tones, `TONES`: night =
  the evening, morning, midday, end of day; the provisional palette S3 is changed there and only there), the type scale and its phone sizes
  (`TYPE`, `MIN_TEXT`, `PHONE_QUERY`) and the frames' texel (`TEXEL_PX` = 2 CSS px); `frames.ts` paints the nine-slice frames (panel, parchment,
  buttons, tags, keycaps, gauge) from a tone, pure; `system.ts` installs the fonts, the page's tone (`installDesign(time)`: the page's `DayState`)
  and the base components. The fonts (Pixelify Sans for titles, numbers and keys; Alegreya Sans for text; SIL OFL 1.1, chosen by the operator on
  2026-10-25) and their record (source, licence, SHA-256): `src/ui/fonts/FONTS.md`. The play mode's screens (`src/ui`), the forecourt and Lantern
  Row pages and the arena's HUD use it; the free-roaming town, its DEV panel and HUD and the loading screen do not (unchanged). Portraits: the
  face of the baked sheet (`preloadPortraits`), the generator's portrait where no baked sheet stands for the person. The arena's HUD with the HUD
  hidden (`hud=0`, H) keeps its KO and pause screens, in the system's look since journal Passe C2. On a phone (`PHONE_QUERY`): a strip along the top, tabs along the bottom
  (« Here » first), every card a sheet at the bottom of the screen. Proofs: `tests/ui-design.test.mjs`, `tools/ui-text.mjs`.

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
  D is a 20 m / fov 36 lens, not a long telephoto. Every blend is ANCHORED (the C -> D and B -> D ones since Pass 4B, edge walkers at
  z > 2.4 never entering C's zone; A <-> B and B <-> C too since the operator's decision of 2026-10-19, journal Passe K4) (`blendPose`): the pivot is shifted along the camera's own right / up so the player's screen
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
- Visibility bake: a second pass (`?occbehind=1`; off since the district's freeze, journal Passe Z1: it restored no part on three seeds at three
  window sizes and cost 90-160 ms per fresh bake) renders the world WITHOUT the occludable parts, ID'd only inside the reveal windows (the quay
  positions a pose can hold); what it shows joins the normal counts so a reveal never exposes a Tier 3 hole. Run it again, with
  `tools/occ-inventory.mjs`, whenever the framings, the occluders or the composition change.
- New occluders: add them with `registerOcc` (static) / the lamp pattern (instanced) in `MerchantDistrictGenerator`,
  keep the table <= `OCC_MAX`, re-run the inventory and the `vis=0` vs default diff with `occforce=all`.

## Rendering notes
- The mirror pass clips at the water with an oblique near plane: surface shaders must NOT `discard` (kills early-z) —
  the single exception is the occludable variant above, bound only while a reveal is active.
- `lightSum()` walks a per-cell light list (`LIGHT_GRID`, rebuilt in `LightRig`); `lightMirror()` still uses all lights.
- The sky is drawn last among opaques, depth-tested.
- Weather (journal Passe W1): one instanced draw per precipitation (a quad per drop / flake animated in the vertex shader from the scene time),
  main pass only (`LAYER_NOREFLECT`), after the opaque pass, depth-tested without depth writes, `maskSafeBlending`, no `discard` (alpha =
  coverage), double-sided (a falling streak's quad winds clockwise). The surfaces, ground, water and sky read `uRain` / `uSnow` / `uCloud` only
  inside a `> 0` branch (0 without weather: the same pixels as before); by day the sky's overcast deck and bolt are a variant compiled only
  while a weather covers it (`DAY_WEATHER`, journal Passe Y5), and the cover's veil is written once by the weather and given back. A lightning flash scales the shared light / haze uniforms for a frame
  and gives them back (a value written meanwhile, e.g. by the debug panel, is kept).
- Texture painters (`TexturePainters.ts`) run as named jobs (`PainterJobs.ts`) in a small Web Worker pool (`PainterPool.ts`) while the main
  thread paints the canvas atlases; a worker that cannot start, throws or stays silent 20 s has its job painted on the main thread (console,
  `lib.painterFallbacks`). Painters must stay pure (no DOM, no `Math.random`) so both paths paint the same bytes, and the THREE textures are
  created in their fixed order afterwards (texture ids, uuids).
- Sprites: nearest texel sampling, anchor snapped to the render-target pixel grid, ONE depth per sprite in the main pass (its anchor's,
  `SPRITE_DEPTH_CARD` = 0.2 m toward the camera: the tilted quad no longer passes behind props standing behind the character, journal Passe S1b),
  scene alpha = DOF protection
  mask (1 - protection), written by the opaque pass only: everything drawn after it (particles, decals, contact shadows, the bloom's
  composite) blends with `maskSafeBlending` (`SceneUniforms.ts`), which keeps the destination alpha. The DOF carries the mask on in its
  alpha and the grade applies the in-scatter protection at full resolution (no second pass of the characters: the old 55 % overlay
  is gone, journal Passe S1). A baked sheet's silhouette: no lit-side lift (Passe S1), no crown rim and its outer texel ring at `EDGE_INK`
  (0.25) of its colour (Passe S3b), compiled in by `SpriteRenderer.setEdgeMode` (optional macros tested with `#ifdef` only: in GLSL ES an
  undefined macro inside an `#if` expression does not compile and the sprites vanish). `uMoonCol` is the sun by day: an effect tuned for
  the moon is re-measured under it.

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
- Performance budget (project contract §§ 14 and 16; the operator's decision E24, journal Passe D8): « Pas plus cher que la nuit B, à définition
  égale », a page of the game costs no more GPU than the default night B at the same resolution. The operator's note, word for word: « Mais rien
  n'est confirme car il y a peut etre des zones plus grande et dense ». The play mode's pages against it, without contention: journal Passe Q4b.
