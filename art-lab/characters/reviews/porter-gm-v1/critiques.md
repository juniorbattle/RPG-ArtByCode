# porter-gm-v1 — independent critique log (Pass 4A)

Method (see `art-lab/README.md`, "Critique workflow"): `aseprite:pixel-critic` 0.8.2 cannot see the sprite (its agent definition grants
only Read / Glob / Grep), so each pass was a **fresh** agent (Claude Opus, Read tool only, no editing) given an evidence pack: 8x render,
ASCII pixel map with coordinates, runtime crops at cameras A / B / C, before / after comparisons, the current cast atlas and the
operator's reference images (B: refined NPC sheet, C: supporting roster, plus the rejected generic sheet). It wrote a **cold read
before reading the brief**, then answered the operator's questions with located, pixel-level findings and a score. From pass 2 on it
also received the previous findings to verify. Below: faithful condensations (scores, verdicts and cold reads are verbatim).
Coordinates are (x, y) in the 32 x 48 frame of the revision named.

## Pass 1 — on v4 · 5/10 · "not there: needs redesign of the sack-carry (sack shape, grip and shoulder pad) and one signature costume element"
Cold read: *"A stocky bearded workman in a blue knit cap and dark-blue waistcoat over a white shirt, holding a pale burlap sack up
beside his head with one raised fist and an iron hook hanging from his other hand."* Eye: face → sack → shirt stripe.
- Blocker: the sack was an upright 12x18 rectangle level with the cap (pillow / sign read), a tassel-like fringe, a stray nub.
- Majors: vertical forearm with a bright fist at nose height (a wave, not a load); costume stacked in horizontal bands like the
  rejected "05 Dock Worker"; brow + 1x2 eye fused into a stare; light shirt run and cuffs outshining the face; left arm glued to the
  torso with the hand on the belt rows (tangent).
- Minors: cap rib speckle, beard checker, leg wraps as knee patches, boot highlights, outline rule, 45 colours with near-duplicate darks.
- Kept: palette families, forehead under the cap shadow, nose pair, moustache / mouth spacing, buckle, J-hook, proportion, stance.
-> v5 / v6: sack lying across the shoulder, diagonal strap, squint, values, arm gap, palette 45 -> 39; carry re-staged twice.

## Pass 2 — on v6 · 6/10 · "close: fix the listed blockers/majors" (re-stage x17-31 / y4-20)
Cold read: *"A stocky bearded dock porter in a blue knit cap and dark-blue waistcoat over a pale shirt, carrying a tan burlap sack on
his right shoulder with his arm raised and an iron hook held low in his left hand."*
- Verified fixed: beard checker, left-arm gap; mostly fixed: value hierarchy; partly: sack, strap, eyes, wraps, boots.
- Majors: the hook read as a hook-hand (no fist); the brown diagonal strap copied the playable hero's signature; head, sack and arm
  merged into one warm dark mass (beard and sack shadow same value / hue); sack on the frame border (crate read); grip illogical
  (fist on the corner opposite the tie, nothing reacts to the load); vertical marks under the eyes.
-> v7: head 1 px away from the load + cool separator, fist closes on the tied neck, raised loaded shoulder on a 4x2 pad, cooler
   bowed sack, hemp rope harness, a real fist on the hook, closed mouth, palette 39 -> 32 -> 31.

## Pass 3 — on v7 (animated) · 7/10 · "close: fix the listed items"
Cold read: *"A stocky, bearded dock workman in a blue knit cap and indigo vest over a grey shirt holds a tied sack up on his shoulder
with one raised fist and carries an iron hook in the other hand, standing on a wet cobbled quay at night."*
- Success criteria 1-5 PASS, 6 PARTIAL. Verified fixed: hook-hand, head / sack merge, eye marks, mouth.
- Majors: style split with the hero (round 2-px eyes vs this modelled face — Reference B sides with the porter: an operator decision);
  "brick" head; "stick" forearm (no elbow, fist no wider than the arm); right torso merging into one shadow.
- Taste: angry brows -> weary. Mediums / minors: harness still echoing the hero's strap, sack base too light, cuff tick, pouch, palette.
-> v8: rounded head, weary brows, 5-px fist + cuff + foreshortened upper arm, lit vest edge, harness ends at a chest knot, palette 30.

## Verification — on v8 · 8/10 · "close: fix the three holes (B1) and the sleeve block (B2); B3 and the outer-brow tweak are polish"
- Findings 2-8 fixed or partly fixed; all six success criteria PASS for the sprite (criterion 6 PARTIAL overall only because of the
  open hero-style decision).
- New: three enclosed transparent pixels at face / neck height; a bright sleeve block at beard height; a speckled sternum.
-> v9 (final candidate): holes filled (objective check: 0 enclosed transparent pixels in all 4 frames), sleeve stepped into shadow,
   button to linen (the buckle stays the only warm accent), rope shadows into the vest, softer outer brows. Not re-reviewed by an agent
   after v9: the v9 changes are the verifier's own pixel-level prescriptions plus the objective hole check.

## Production notes raised by the critics (not sprite defects)
- Two porter actors exist in the district (the ambient one and an NPC); in the preview both wear this sprite. A family needs
  variants (cap / flat cap / scarf, sack / crate / rope coil, hook / none, bearded / clean-shaven) before it fills the quay.
- The runtime idle shows frames 1-2 only (2 atlas cells); instances should get distinct phase offsets (they do: actor clocks start at random).
