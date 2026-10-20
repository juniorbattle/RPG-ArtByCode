# Art Lab

Development-time workspace for **authored / baked finishing** of project art. Its scope is the **character** pipeline:
reference sheets -> rig scripts -> Aseprite sources -> baked sheets (PNG + JSON) -> provenance manifests.

> **STATUS (2026-10-18).** The game reads only its **production cast** from here: the baked sheets
> (`characters/exports/<id>.png + .json`), with their manifests and the SHA-256 their provenance packs record, loaded by
> `src/characters/BakedCast.ts` (each sheet hash-checked, decoded byte-exact), and only for the manifests approved by the operator with
> `runtimeUse: "production"`: `dockworker-x2-v2`, `merchant-x2-v2`,
> `blacksmith-x2-v1`, `guard-x2-v1`, `hooded-x2-v1` and the five townsfolk of the ambient crowd (`artisan-x2-v1`, `traveler-x2-v1`,
> `townswoman-x2-v1`, `older-merchant-x2-v1`, `courier-x2-v1`), all approved on 2026-10-17, and the hero `hero-x2-v4`, approved on 2026-10-20 (in place of `hero-x2-v3`, approved on 2026-10-19);
> none declared a Gold Master. The cat is still generated; `?cast=generated` shows the old generated sprites. Everything else here (Character Lab, tools, sources,
> reviews, lab and experimental exports) stays out of the game and of its build. Details: [`characters/README.md`](characters/README.md);
> history: Passes 4A-0A to 4A-quatervicies, archived in `journal/` (index at the top of `JOURNAL.md`).
>
> **Toolchain (Pass 4A-0B, 2026-10-15): installed and validated end to end on this machine** — Aseprite 1.3.18.6, Aseprite AI Artist
> 0.8.2 (Claude Code plugin, local scope, pinned to tag `v0.8.2`; Lua extension 0.8.2). The smoke test drew a synthetic dummy live in
> Aseprite, exported a real sheet and passed the Character Lab self-test (`characters/smoke-test/4a0b/`). `npm run art:doctor` reports
> what is configured; only re-running the smoke test proves the live link after an upgrade.

## Principle

The project moves from *pure code-generated art* toward *code-directed procedural art + selective authored / baked finishing*.

- **Maximise perceptual visual complexity while minimising runtime complexity.**
- Detail may be procedurally generated, baked, or selectively authored. The deciding factor is final perceptual quality,
  runtime cost, reproducibility and operator approval, not procedural purity.
- External art tools may help produce or finish assets. They are **never runtime dependencies**: the game, `npm install`,
  `npm run dev` and `npm run build` must work on a machine without Aseprite.
- No generated output silently becomes canonical production art: see the provenance manifests below.

Only characters are in scope (the ambient crowd's townsfolk are characters). Environment textures, decals, signage, VFX flipbooks,
distant-city cards and facade baking may be evaluated later, each through an explicit operator-approved task. None of that exists here.

## Layout

```
art-lab/
  README.md                      this file
  characters/
    README.md                    status, approval scopes, provenance, pipeline, manifest contract, quality gates, NPC notes
    manifest.example.json        documented template (status "planned"; validated by art:validate)
    runtime-integration-contract.md   multi-resolution sprites in the main atlas / renderer (v3, accepted with amendments)
    reference/                   reference-package conventions (README; A / B / C folders hold only .gitkeep) and sources/:
                                 the archived reference sheets and art sources, each with its .source.json record
    briefs/                      character briefs / proposals
    source/                      *.aseprite production sources (project-owned, tracked)
    exports/                     baked runtime-ready outputs: sheet PNG + metadata JSON (tracked)
    manifests/                   one <id>.manifest.json per asset (provenance, approval, runtime use)
    provenance/                  <id>/PROVENANCE.json: SHA-256 of the chain, dated decisions, rebuild inputs
    rigs/                        <id>.rig.mjs: the whole recipe of an animated character (crops, palette, view edits, frames)
    reviews/                     contact sheets / critic notes (tracked evidence)
    smoke-test/                  evidence of the 4A-0B validation (tracked)
tools/art-lab/
  doctor.mjs                     environment report (read-only)
  validate-manifest.mjs          provenance manifest + orphan check + archived reference sheets vs their records
  make-contact-sheet.mjs         labelled nearest-neighbour review sheet of an exported PNG + JSON
  reconstruct-grid.mjs           strict-grid reconstruction of one figure from a reference sheet
  replay-pixel-ops.mjs           replays the recorded pixel edits of a provenance pack
  quantize-palette.mjs           one palette for several views (joint OKLab k-means, or an approved sprite's colours)
  rig-engine.mjs                 cut-out rig: parts, row remaps, RotSprite rotation, IK legs, painted limbs, frame checks
  build-character.mjs            rig script -> views -> frames -> Aseprite source + sheet PNG / JSON; --check = rebuild and compare
  verify-provenance.mjs          a provenance pack's hashes; --rebuild re-runs its chain (rig packs: build-character --check)
  baked-proof.mjs, storage-bench.mjs, dynwalk.mjs, dynwalk-report.mjs   proofs of the shared atlas (see below)
character-lab.html + src/lab/    Character Lab: dev-only Three.js viewer for an exported sheet
```

## Commands

| Command | What it does |
|---|---|
| `npm run art:doctor` | Environment report: Node, repo, Art Lab, Aseprite, AI Artist. Read-only. Exit 0 when Aseprite is absent. `-- --json` for a machine-readable report. |
| `npm run art:validate` | Validates every manifest + the example, and lists sources / exports that no manifest claims. `-- --strict` turns warnings into errors. |
| `npm run art:sheet -- <sheet.png> [meta.json] [--out f.png] [--scale 4]` | Review contact sheet (needs Chrome / Edge like the other tools). Default output: `art-lab/characters/reviews/`. |
| `npm run dev`, then `/character-lab.html` (or `npm run art:lab`) | Character Lab. Default: a synthetic test sheet generated by code. `?sheet=/art-lab/characters/exports/x.png&meta=/art-lab/characters/exports/x.json` loads a real export. |

> **Windows PowerShell:** the `npm` shim silently drops the first `--`, so `npm run art:doctor -- --json` loses `--json` (npm swallows
> it as its own flag). Quote it, `npm run art:doctor '--' --json`, or call the script directly, `node tools/art-lab/doctor.mjs --json`.
> Same for `art:sheet` (`--out`, `--scale`) and `art:lab` (`--port`). bash / cmd are not affected.

### Character Lab

Dev server only: it is a separate Vite page that the game entry never imports, so it is absent from `npm run build`.
It exists to prove `exported sprite -> Three.js -> correct filtering -> correct scale`, not to look good.

- Neutral grey background (`bg=neutral|dark|light`), transparent sprites, nearest sampling, no mipmaps, clamp, straight alpha:
  the same texture contract as `SpriteAtlas`.
- Three simultaneous views on a shared, pixel-snapped foot line: **1x**, **4x nearest**, and **runtime scale** for a chosen
  framing (`cam=A|B|C|D`, `h=1080`): the real screen pixels per sprite pixel for a player at the framing's reference
  position, computed from the game's own `CameraGraph.evalAnchor` + `applyPose` and the `SpriteRenderer` sizing rule. At
  1080p that is currently A 2.42, B 4.55, C 4.96, D 4.37 px per texel, i.e. non-integer: uneven texel widths are expected at
  runtime and visible in that panel. Verified equal to the running game's own projection (see JOURNAL, Passe 4A-0A).
- Also: whole-sheet view with the current frame highlighted, tag playback from the metadata (Aseprite `frameTags`), frame
  stepping (arrows), trimmed frames (`spriteSourceSize`) and both Aseprite JSON shapes (`json-array`, `json-hash`).
- `window.__lab.selfTest()` re-derives, for every pixel of every panel, which texel the GPU should have sampled and compares
  the frame buffer with the decoded PNG over the background; it also reads the GL filter state back from the driver.
  `&filter=linear` is a deliberate **negative control** (wrong filtering): the self-test must then fail.
- The default synthetic sheet is a hand-written fixture in the *shape* of an Aseprite export. A **real** Aseprite export
  (`characters/exports/smoke-4a0b-v1.*`, `ExportSpriteSheet` json-array + tags) passed the self-test on cameras A-D in Pass 4A-0B;
  the self-test checks the first frame of the selected tag only (the other frames were decoded separately, see the smoke test).

### In-scene preview (dev only): `?labsprite=<id>`

The Lab proves texel accuracy; the district proves whether a sprite *belongs*. With the dev server running,
`/?labsprite=<id>&labpos=x,z` loads `characters/exports/<id>.png + .json` (32x48 frames, runtime format) into the boot atlas in place
of one actor's generated cells (`labactor`, default `porter`) and stands that actor still at the given quay position(s), facing the
camera, under the real lights, fog, DOF, rim treatment and wet-ground reflections. `labsprite=-` keeps the generated frames (the
"before" image of a comparison, same spot); `labtag` picks a tag. Code: `src/lab/runtimePreview.ts`, reached only through a
`main.ts` branch guarded by `import.meta.env.DEV`: the production bundle is byte-identical with or without it (verified, Pass 4A), so
`runtimeUse: lab` covers this preview — it never ships and makes nothing canonical. The runtime idle plays only the first two frames
of the tag (2 atlas cells, 1.7 fps); the Lab plays them all.

Example (Pass 4A captures): `?seed=1842&clean=1&freeze=7.3&intro=0&camera=B&player=-4.6,0.6&labsprite=porter-gm-v1&labpos=-2.2,3.3`.

Other pixel densities (frames larger than 32x48, or `labhd=1`) are drawn by a second sprite renderer with the same shader and lights, at
the same world size (density = frame height / 48). For those: `labdetail=hero|mid|crowd` (DOF protection tier, default `mid`),
`labscale=<k>` (presentation scale), `labfollow=1` (the first actor takes the hidden player's place every frame: walk it through the
framings), `spritelight=sat,chroma,edge,vertMin,tone,overlay,unlit` (character lighting treatment; `,,0` = no silhouette edge). Full list in
the header of `src/lab/runtimePreview.ts`.

### Shared atlas, experimental (dev only): `?baked=<id>`

The DEV harness of the integration contract (`characters/runtime-integration-contract.md`, v3): any export with a `lab` or
`production` manifest joins the **main** atlas (blocks above the generated cells, their bytes untouched) and is drawn by the **main**
renderer (no second renderer, no extra draw call), at authored spawns. The production cast (`src/characters/BakedCast.ts`) is the
contract's production path; this flag stays the DEV test bench. The loader (`src/lab/bakedLoader.ts`) needs a manifest with runtime use and a provenance pack whose SHA-256
matches the PNG, decodes it byte-exact, and refuses a spawn whose sheet lacks a frame its behaviour needs (amendment B); `bakedfallback=front-idle`
declares the front-idle aliases explicitly (lab, immobile only). Spawns: `bakedpos=x,z;x,z` (absent = loaded, not spawned), `bakedscale`,
`bakedheight`, `bakeddetail`, `bakedface`; `bakedhide=porter`, `bakedfollow=1` as above. Example:
`?seed=1842&clean=1&freeze=7.3&intro=0&camera=B&player=-4.6,0.6&baked=dockworker-x2-v1&bakeddetail=crowd&bakedscale=0.9&bakedpos=-2.2,3.3`.
Proofs: `tools/art-lab/baked-proof.mjs` (atlas bytes, deterministic scene / parade captures, self-test, rules, actors),
`tools/art-lab/storage-bench.mjs` (amendment C), `tools/art-lab/dynwalk.mjs` + `dynwalk-report.mjs` (walks; both paths).

### Critique workflow (replaces `aseprite:pixel-critic`, which cannot see the sprite in 0.8.2)

A fresh, independent agent with only a Read tool gets an evidence pack: the 8x render, an ASCII pixel map with coordinates
(`look op=ascii`), gameplay-scale runtime crops (A / B / C), before / after comparisons, the current cast atlas and the operator's
references. It writes a **cold read before reading the brief**, then judges against the references, answers the operator's questions
and lists located, pixel-level findings (craft vs taste) with a score; the next pass also gets the previous findings to verify. Pass 4A:
`characters/reviews/porter-gm-v1/critiques.md`. The production cast was reviewed by **blind** critiques, a fresh agent each round (the
full protocol in `JOURNAL.md`, "Principes à garder": labels drawn at random, key out of the critic's reach, self-critique written before
reading the verdict); evidence in `characters/reviews/<id>/`.

## Provenance (no silent canon)

Every baked sprite gets `characters/manifests/<id>.manifest.json`: where it came from, which tool produced it, whether it is
experimental, whether an operator approved it, and whether it may be used by the runtime (`none` / `lab` / `production`).
`production` requires `approved: true` with a named approver and date. Format and rules: `characters/README.md`.
`*.aseprite` files are production sources; the PNG + JSON exports are the baked, runtime-ready outputs.

## Installed toolchain (Pass 4A-0B; same versions reported by `art:doctor` on 2026-10-18)

| Piece | Exactly what is installed | Where (none of it is in Git) |
|---|---|---|
| Aseprite | 1.3.18.6-x64 | `C:\Program Files\Aseprite` |
| Lua extension | aseprite-ai-artist **0.8.2** (`npx @pebbly/aseprite-ai-artist@0.8.2 install-extension`) | `%APPDATA%\Aseprite\extensions\aseprite-ai-artist` |
| Claude Code plugin | `aseprite@aseprite-ai-artist` **0.8.2**: MCP server (18 tools), 14 `/aseprite:*` skills, 4 agents, 2 hooks | enabled in `.claude/settings.local.json` (**local scope**, git-ignored), cache `~/.claude/plugins/cache/aseprite-ai-artist/aseprite/0.8.2` |
| Marketplace | `with-pebbly/aseprite-ai-artist#v0.8.2` (tag commit `5894b12`), `autoUpdate: false` | declared in `.claude/settings.local.json` |

Reproduce (from the repo root, any shell; a later version only after its own smoke test):

```
npx -y @pebbly/aseprite-ai-artist@0.8.2 install-extension     # then quit and reopen Aseprite
claude plugin marketplace add "with-pebbly/aseprite-ai-artist#v0.8.2" --scope local
claude plugin install aseprite@aseprite-ai-artist --scope local
```

then add `"autoUpdate": false` to the marketplace entry and the `permissions.deny` rules below to `.claude/settings.local.json`.
Checked before installing: tag `v0.8.2` = npm 0.8.2 (extension, skills, agents, hooks, rules identical; the plugin's locally built
`dist/` equals the published one), only three runtime dependencies (`ws`, `zod`, `@modelcontextprotocol/sdk`), no install scripts.

- **Do not use upstream's `install claude`** (it writes a *user-scope* server into `~/.claude.json` with `@latest`, i.e. unpinned
  and loaded in every project) nor `--agents` (it appends a section to `AGENTS.md`). The plugin already brings the MCP server:
  adding a standalone one would load every tool twice.
- **Blocked locally**: `"permissions": {"deny": ["Skill(aseprite:submit)", "Bash(gh repo fork:*)", "Bash(gh pr create:*)"]}`.
  `aseprite:submit` forks upstream and opens a **public** pull request; the deny rule is verified (the skill call is refused).
- Context cost: ~1.7k tokens per session in this repo only (skill and agent descriptions; MCP tool schemas load on demand).
- **Bridge (Windows)**: the extension dials a local relay (`127.0.0.1:9931`, agents on `:9932`). A session-spawned relay died with
  its headless session here, and Aseprite only re-dials while its window has focus. For unattended / headless runs, keep one relay
  alive (`node ~/.claude/plugins/cache/aseprite-ai-artist/aseprite/0.8.2/dist/cli.js bridge`) and start or focus Aseprite once;
  `preflight` must say `ready: true` before any drawing.
- **`aseprite:pixel-critic` cannot see the sprite** in 0.8.2: its agent definition grants only `Read`, `Glob`, `Grep` (no aseprite
  MCP tools). Review with the `aseprite:review` skill + `validate` (which caught a planted defect blind), or a critic brief run by a
  general agent. `validate`'s stray check also flags deliberate isolated pixels (the smoke test's corner markers).

## Upstream tool (research notes of 2026-10-12, before installation)

**with-pebbly/aseprite-ai-artist** (<https://github.com/with-pebbly/aseprite-ai-artist>, MIT), from its README / `docs/INSTALL.md`
and a read-only `npm view`:

| Item | Observed |
|---|---|
| npm package | **`@pebbly/aseprite-ai-artist`** (the unscoped `aseprite-ai-artist` and `@with-pebbly/aseprite-ai-artist` do **not** exist: npm 404). Registry `latest` observed: **0.8.2** (still latest on 2026-10-15; pinned at 0.8.2 above). |
| Requirements | **Aseprite 1.3+** (its Lua WebSocket API does not exist in 1.2; Aseprite must have been run once), **Node >= 22.6** (this machine: 22.14.0). |
| Shape | agent -(MCP)-> MCP server -(bridge, binds 127.0.0.1, ports 9931 / 9932)-> Aseprite extension. Every action is one undo step; with Aseprite detached the tools refuse instead of editing files on disk. |
| MCP | 18 tools grouped by noun (`draw`, `look`, `layer`, `frame`, `export`, ...). |
| Workflows / skills | 14 `aseprite:*`: `studio` (front door), `brief`, `concept`, `new`, `palette`, `draw`, `shade`, `rig`, `animate`, `tileset`, `review`, `fix`, `export`, `submit`. |
| Craft knowledge | 62 pixel-art rules (served as `rules://` resources; core, technique, colour, characters, animation, ...), pixel templates, palette presets. |
| Specialists | `palette-smith`, `rig-builder`, `animation-director`, read-only `pixel-critic` (Claude Code / omp plugins). `studio` hands the result to the critic for a cold read. |
| Clients listed upstream | Claude Code, omp, OpenCode, Codex CLI, Gemini CLI, Cursor, VS Code, Windsurf. The Devin CLI is not listed: wire it as a plain MCP server, using what `install <client> --dry-run` shows. |
| Headless | `serve --headless --aseprite <path>` runs `aseprite -b` itself. Not a fallback: it is chosen explicitly. |

Exercised in the 4A-0B smoke test: MCP (`preflight`, `sprite_manage`, `sprite_info`, `palette`, `layer`, `draw`, `look`,
`read_pixels`, `frame`, `tag`, `validate`, `export`), the `aseprite:review` skill, the hooks, the critic agent (which failed, see
above). **Not exercised**: `studio`, `brief`, `concept`, `shade`, `rig`, `animate`, `tileset`, `fix`, the palette / rig / animation
agents, headless mode.

Upstream's own caveat: the effect of its critic loop on quality "is not yet measured". Treat its output as a draft source
under our own review gates, never as proof of quality.

### 4A-0B smoke test (done 2026-10-15, evidence in `characters/smoke-test/4a0b/`)

Synthetic 32x48 dummy `smoke-4a0b-v1` (manifest: `experimental`, `runtimeUse: lab`), drawn live by two fresh headless Claude Code
sessions (`brief-A.md`, `brief-B.md`, verbatim reports beside them): preflight -> sprite / 8-colour palette / 2 layers -> exact pixel
reads -> 2-pixel edit -> palette + layer validation -> 4-frame tagged animation -> blind review (a planted off-palette pixel was found
by `validate` and removed with before / after reads) -> real `ExportSpriteSheet` (128x48, json-array, tag `test`) -> Character Lab
self-test A-D 0 mismatch (negative control fails) -> `art:sheet` -> `art:validate`. The game build stayed byte-identical.
Re-run it after any upgrade of Aseprite, the extension or the plugin.

## Hygiene

`.gitignore` keeps local application and tool files out (Aseprite executables / app folders / extension packages, backups
and temp files, agent wiring such as `.mcp.json`, `.cursor/mcp.json`, `.codex/`, `*.bak-*`, secrets, tool caches) and does
**not** ignore project-owned `*.aseprite` / `*.ase` sources, exports, manifests, reviews or smoke-test evidence.
`.gitattributes` marks `*.aseprite`, `*.ase` and `*.png` binary (no line-ending conversion, no text diff).
If a sanitised, path-free agent config is ever meant to be shared, add it explicitly with `git add -f`.
