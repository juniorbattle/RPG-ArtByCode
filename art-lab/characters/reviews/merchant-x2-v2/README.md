# merchant-x2-v2 — review evidence (Pass 4A-sedecies, 2026-10-16)

PRODUCTION ASSET, approved by the operator on 2026-10-17 (manifest `approved`, `runtimeUse: "production"`); reviewed as a candidate. Built by
`node tools/art-lab/build-character.mjs art-lab/characters/rigs/merchant-x2-v2.rig.mjs` (`--check` rebuilds identically). Source: the
reference sheet's NPC 02 "Merchant (Female)" (front, back, profile); it supersedes the `merchant-x2-v1` experiment (ChatGPT source V3).

| File | What it shows |
|---|---|
| `01-idle-walk-x3.png` | the rig's frames x3: rows front / back / profile (native, facing left); idle 4 frames then walk 6 frames |
| `02-talk-x3.png` | talk frames x3, rows front / back / profile: mouth closed / open three times, the head nods once per cycle (frame 3); she hawks at the hero stall like the generated merchant |
| `03-in-scene-walk-cameraB.png` | 1:1 captures from the running game (DEV `?cast=candidate`, camera B, others hidden), one walk cycle per row; she was moved to free ground for the test: her stall spot lies inside the stall collider's box, she does not walk there (same as the generated merchant) |
| `04-scene-B-stall-generated-vs-cast.png` | camera B, same deterministic frame: the generated merchant (left) / the sheet's merchant in her place (right), with the dock worker |

Queries: `seed=1842&clean=1&freeze=7.3&intro=0&camera=B&player=2,1.5`, `&cast=generated` vs `&cast=candidate`.


## Revision of 2026-10-17 (Pass 4A-unvicies): black pixels, at the operator's request

| File | What it shows |
|---|---|
| `05-revision-black-pixels.png` | per animation (row), its first frame x3: the approved sheet (`2eb83d1`) / the revised sheet / the changes on the revised frame dimmed (magenta = texel removed, yellow = recoloured to a neighbouring colour of the approved palette, cyan = added) |

The reconstruction no longer closes short vertical gaps above row 48 (`reconstruct-grid --closing-from=48`): there the closing filled the background seen between hair and shoulders, beside the jaw / neck, with its darkest colour (near-black strokes that read as long hair). Below row 48 it still restores the dark leg and boot outlines, and the legs keep the approved texels (a first attempt without any closing lost them and was abandoned). Against the approved sheet: 1843 texels removed, 0 added, 1754 recoloured, 0 new colours (the approved 64-colour palette is pinned, `provenance/merchant-x2-v2/palette.png`). `--check` rebuilds identically; `selftest.json` refreshed (`?baked=merchant-x2-v2`): CPU 0 / GPU 0 texels at 1, 2, 3, 2.37, negative controls fail, bleed 0. The approval was given for the previous sheet; the revision was merged into main at the operator's request (« si la tache est fini on peut commit/push vers main »), **the revised sheet itself is not yet reviewed by the operator** (JOURNAL, Passe 4A-unvicies).
