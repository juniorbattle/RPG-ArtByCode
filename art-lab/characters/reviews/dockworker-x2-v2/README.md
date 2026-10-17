# dockworker-x2-v2 — review evidence (Pass 4A-sedecies, 2026-10-16)

PRODUCTION CANDIDATE, not approved (manifest `candidate`, `runtimeUse: "lab"`). Built by
`node tools/art-lab/build-character.mjs art-lab/characters/rigs/dockworker-x2-v2.rig.mjs` (`--check` rebuilds identically).

| File | What it shows |
|---|---|
| `01-idle-walk-x3.png` | the rig's frames x3: rows front / back / profile (native, facing left); idle 4 frames then walk 6 frames |
| `03-in-scene-walk-cameraB.png` | 1:1 captures from the running game (DEV `?cast=candidate`, camera B, other actors hidden), one walk cycle per row: away from the camera (back), across (profile, mirrored by the renderer), towards the camera (front); frames 133 ms apart |
| `04-scene-C-generated-vs-cast.png` | camera C, same deterministic frame: the generated porter (left) / the dock worker in its place (right) |
| `05-scene-D-generated-vs-cast.png` | camera D, same: the forge-yard porter / the dock worker (cap behind the hooded stranger) |
| `scene-report.json`, `selftest.json` | deterministic A-D comparison (`base` = `894c4d3` served aside, `cur` = this tree by default, `gen` = `?cast=generated`, `cand` = `?cast=candidate`) and the test-2 selftest |

Queries: `seed=1842&clean=1&freeze=7.3&intro=0` + `camera=C&player=8,1` / `camera=D&player=16,2`, `&cast=generated` vs `&cast=candidate`
(deterministic captures: `tools/art-lab/baked-proof.mjs shots`). In-scene walk: the scratch script `walkcam.mjs` of the pass (seeded,
1/60 s steps, the actor sent to four targets).

Measured (JOURNAL, Passe 4A-sedecies): selftest CPU 0 / GPU 0 texels at scale 1, 2, 3, 2.37 (negative controls fail, bleed 0); default boot
pixel-identical to `894c4d3` in A-D; draw calls 108 with and without the cast; GPU within noise.
