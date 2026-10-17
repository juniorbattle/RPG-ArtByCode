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

The reconstruction no longer closes short vertical gaps above row 48 (`reconstruct-grid --closing-from=48`): there the closing filled the background seen between hair and shoulders, beside the jaw / neck, with its darkest colour (near-black strokes that read as long hair). Below row 48 it still restores the dark leg and boot outlines, and the legs keep the approved texels (a first attempt without any closing lost them and was abandoned). Against the approved sheet: 1843 texels removed, 0 added, 1754 recoloured, 0 new colours (the approved 64-colour palette is pinned, `provenance/merchant-x2-v2/palette.png`). `--check` rebuilds identically; `selftest.json` refreshed (`?baked=merchant-x2-v2`): CPU 0 / GPU 0 texels at 1, 2, 3, 2.37, negative controls fail, bleed 0. The approval was given for the previous sheet; the revision was merged into main at the operator's request (« si la tache est fini on peut commit/push vers main »), the revised sheet was then reviewed by the operator, its images shown one by one, and **approved on 2026-10-17**: « Les cinq planches révisées me conviennent. » (JOURNAL, Passes 4A-unvicies and 4A-duovicies).

## Rig pass C3 of 2026-10-17 (Pass 4A-duovicies): inherited walk defects, at the operator's request

| File | What it shows |
|---|---|
| `06-rig-c3-before-after.png` | the changed frames x3: the sheet before this pass (`01dcbb4c...`, approved) / after / the changes on the revised frame dimmed (magenta = texel removed, cyan = added, yellow = recoloured) |
| `07-rig-c3-walk-in-scene-cameraB.png` | 1:1 captures from the running game (camera B, the character sent walking on the open quay, other actors hidden, seeded, 1/60 s steps): per facing (towards, away, profile left, profile right) one walk cycle, before (upper row) / after (lower row) |

Fixed in the rig script (`rigs/merchant-x2-v2.rig.mjs`): front / back walk 4-5 (and one texel in front walk 3): boot 0 stands one row higher in the view (sole on row 89) and is set down on row 90; on the high-body frames that left one empty row between the hem and the planted boot (the shoe floated under the hem) -> a one-row gap right above a boot takes the boot's top row (its dark shaft goes up under the hem). Against the sheet before: 0 texels removed, 30 added, 0 recoloured, 0 new colours, in 5 frames (walk-down 3, walk-down 4, walk-down 5, walk-up 4, walk-up 5); same frames, tags and metadata JSON; `--check`
rebuilds identically. Default boot (A, B, C, D, sabotaged C / D, 1920 x 1080, deterministic): 0 px against dab59f9, repeat witness 0 px. Blind critique (fresh agent, random labels, key withheld): revised 7/10, previous 6/10; the floating shoe and a one-texel hole fixed, nothing new (on those frames the shoe is one row taller: read as a slightly longer ankle). Left as they were (inherited, not in the operator's list): in the profile walk the two shoes merge into one wide slab (frames 2, 5) with a black bar through them (frame 4); the body jumps 2 texels sideways between front / back walk frames (the weight shift); a hem notch that blinks. **Approved by the operator on 2026-10-17**: « J'approuve les cinq planches corrigées de la passe C3 pour la production : fusionne cast-rig-fixes dans main, pousse main et supprime la branche. » Not declared a Gold Master.

## Inherited defects -1d (d), 2026-10-17 (Pass 4A-quatervicies), at the operator's request

| File | What it shows |
|---|---|
| `08-inherited-defects-before-after.png` | the changed frames x3: the sheet before this pass (`abc819b9...`, approved) / after / the changes on the revised frame dimmed (magenta = texel removed, cyan = added, yellow = recoloured) |
| `09-inherited-defects-walk-in-scene-cameraB.png` | 1:1 captures from the running game (camera B, the character spawned on the open quay and sent left, right, away and towards the camera, other actors hidden, seeded, 1/60 s steps): per changed facing one walk cycle, before (upper row, `main` served aside) / after (lower row) |

Fixed in the rig script (`rigs/merchant-x2-v2.rig.mjs`): front / back walk 1, 2, 4, 5: the weight shift (SHIFT) was 0, 2, 1, 0, -2, -1 texels: the 2-texel step read as the body jumping sideways -> 0, 1, 1, 0, -1, -1 (the crowd's dress walk); profile walk 0-5: the far boot copy, 0.1 OKLab darker and at the near boot's level, merged with the near boot into one wide sole where the two 10-column shoes overlap (frames 2, 5) -> 0.16 darker, floored at OKLab L 0.2 (flooredDarkener: 0.16 alone turned its heel outline-black, a black lump at frame 3, second blind critique) and one row higher (further from the camera, as the sheet draws it in the idle profile; third critique: the two soles still made one continuous bottom edge), nothing of it above the hem's bottom row (fourth critique: its top row stuck out in front of the skirt at frame 3, a 4-texel stub). Against the sheet before: 380 texels removed, 329 added, 6124 recoloured, 0 new colours, in 10 frames (walk-down 1, walk-down 4, walk-up 1, walk-up 4, walk-side 0, walk-side 1, walk-side 2, walk-side 3, walk-side 4, walk-side 5); same frames, tags and metadata JSON; `--check`
rebuilds identically; texture selftest exact (CPU 0, GPU 0 at scales 1 / 2 / 3 / 2.37, negative controls failing, bleed 0). Blind critiques (fresh agents, X / Y drawn at random, keys kept out of their reach, self-critique written before), revised against the sheet before it each time: round 1 (shift 1 texel, far boot 0.16 darker) 7/10 against 6/10 (the sideways jump fixed, the shoes separated by value; the far heel turned outline-black, a black lump at profile frame 3); round 2 (floored darkening) 7.3 against 7.0; round 3 (far boot one row higher) 7.5 against 7 (consistent depth, no continuous sole at frame 5); round 4 (nothing of the far boot above the hem line) 7.5 against 7.0 (the 4-texel stub in front of the skirt at frame 3 removed; cost: a 2-texel bite at the hem front there, near invisible on the night ground). Remaining: the far boot lifted 2 rows at frame 0 (toe-off), its toe touching the near sole at frame 4, a mostly dark far boot at frame 5, no arm or skirt swing. **Approved by the operator on 2026-10-17**: « J'approuve les cinq planches corrigées des défauts hérités pour la production : fusionne cast-inherited-defects dans main, pousse main et supprime la branche. » Not declared a Gold Master.
