> Verbatim prompt sent to a fresh headless `claude -p` session (model opus) in the repo root; the absolute repo path is redacted as `<repo>`.

You are running step B of a toolchain smoke test (Pass 4A-0B) of the Aseprite AI Artist integration, in the live Aseprite window.
The open sprite smoke-4a0b-v1 is a SYNTHETIC TEST DUMMY made to prove the toolchain. It is not character art: do not restyle it.
Use the aseprite MCP tools (load them with ToolSearch). Do not edit any file on disk yourself; Aseprite writes the exports.

INTENDED SPEC (what is correct)
- 32 x 48 px, RGB. Palette exactly: #00000000 #1b1f33 #3b4466 #5e6a8f #8f9bb8 #e9a64c #d9cfb8 #ff00ff.
- Layers: body (bottom), markers (top). markers: one #ff00ff pixel at each canvas corner, every frame, nothing else.
- body: mannequin (head x 12..19 y 6..13, torso x 11..20 y 14..29, legs x 12..14 and x 17..19 y 30..44), 1 px outline #1b1f33,
  fill #5e6a8f, light column #8f9bb8, shadow column #3b4466, belt #e9a64c, eyes #e9a64c. Lowest opaque body row y = 44 in every frame.
- Animation tag "test", frames 1..4, 120 ms each: frames 2 and 4 have head + torso 1 px higher; frame 3 has the belt at y = 25.
  These frame differences are intended.

STEPS (report evidence for each, numbered):
1. preflight (must be ready); activate smoke-4a0b-v1 if needed; sprite_info.
2. Blind review. Invoke the plugin's pixel-critic subagent (Agent tool, subagent_type "aseprite:pixel-critic") on the open sprite,
   giving it the spec above. Paste its findings (with coordinates) in your report. If it cannot inspect the sprite (for example it
   has no access to the aseprite tools), quote its answer verbatim, then run the aseprite:review skill yourself and say which path
   produced the review. Also run validate yourself on all frames and report every finding with coordinates.
3. Evidence-based correction. Fix ONLY objective defects against the spec (off-palette colours, stray pixels, spec violations),
   never stylistic suggestions. For each fix: read_pixels of the exact pixels before, the minimal draw op, read_pixels after.
4. validate again: report errors (must be zero) and any warning you keep, with the reason.
5. Export: export op spritesheet, path <repo>\art-lab\characters\exports\smoke-4a0b-v1.png ,
   sheetType horizontal, padding 0, trim false, byTag false, scale 1, includeJson true. Report files written, width, height, frameCount.
   Then Read the written .json and report its frames (name, x, y, w, h, duration) and frameTags.
6. sprite_manage op save (the source is art-lab\characters\source\smoke-4a0b-v1.aseprite). Leave the sprite open.

FINAL OUTPUT: a compact numbered report of steps 1-6 with the evidence. Quote any tool error verbatim. Do not claim success without evidence.
