# merchant-x2-v2 — review evidence (Pass 4A-sedecies, 2026-10-16)

PRODUCTION CANDIDATE, not approved (manifest `candidate`, `runtimeUse: "lab"`). Built by
`node tools/art-lab/build-character.mjs art-lab/characters/rigs/merchant-x2-v2.rig.mjs` (`--check` rebuilds identically). Source: the
reference sheet's NPC 02 "Merchant (Female)" (front, back, profile); it supersedes the `merchant-x2-v1` experiment (ChatGPT source V3).

| File | What it shows |
|---|---|
| `01-idle-walk-x3.png` | the rig's frames x3: rows front / back / profile (native, facing left); idle 4 frames then walk 6 frames |
| `02-talk-x3.png` | talk frames x3, rows front / back / profile: mouth closed / open three times, the head nods once per cycle (frame 3); she hawks at the hero stall like the generated merchant |
| `03-in-scene-walk-cameraB.png` | 1:1 captures from the running game (DEV `?cast=candidate`, camera B, others hidden), one walk cycle per row; she was moved to free ground for the test: her stall spot lies inside the stall collider's box, she does not walk there (same as the generated merchant) |
| `04-scene-B-stall-generated-vs-cast.png` | camera B, same deterministic frame: the generated merchant (left) / the sheet's merchant in her place (right), with the dock worker |

Queries: `seed=1842&clean=1&freeze=7.3&intro=0&camera=B&player=2,1.5`, `&cast=generated` vs `&cast=candidate`.
