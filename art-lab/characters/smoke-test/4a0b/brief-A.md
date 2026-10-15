> Verbatim prompt sent to a fresh headless `claude -p` session (model opus) in the repo root; the absolute repo path is redacted as `<repo>`.

You are running step A of a toolchain smoke test (Pass 4A-0B) of the Aseprite AI Artist MCP integration in the live Aseprite window.
This is a SYNTHETIC TEST DUMMY to prove the toolchain, not character art and not a design task. Follow the spec exactly; do not improvise style.
Use only the aseprite MCP tools (load them with ToolSearch). Batch drawing ops. Do not edit any file on disk yourself.

SPEC
- New sprite: 32 x 48 px, RGB colour mode, transparent background, name it smoke-4a0b-v1.
- Palette (set exactly these 8 entries, in this order): #00000000, #1b1f33, #3b4466, #5e6a8f, #8f9bb8, #e9a64c, #d9cfb8, #ff00ff.
- Two layers: "body" (bottom) and "markers" (top). No other layers.
- markers layer, every frame: one #ff00ff pixel at each canvas corner (0,0) (31,0) (0,47) (31,47). Nothing else on that layer.
- body layer, frame 1: a simple test mannequin, 1 px outline #1b1f33 around every part:
  head box x 12..19, y 6..13; torso box x 11..20, y 14..29; two legs x 12..14 and x 17..19, y 30..44.
  Inside: fill #5e6a8f, left inner column of each part #8f9bb8 (light), right inner column #3b4466 (shadow).
  Belt: row y = 24 inside the torso #e9a64c. Eyes: (14,9) and (17,9) #d9cfb8.
  The lowest opaque body row must be y = 44 (the runtime foot line is y = 45). Nothing below y = 44 except the corner markers.

STEPS (report the evidence for each, numbered):
1. preflight; must be ready. Paste mode, versions, features.
2. Create the sprite, palette and layers per spec; draw frame 1.
3. Inspect exact pixels: read_pixels (or look op ascii) on region x 10..21, y 5..15 and on the four corners. Report the colour at (14,9), (17,9), (11,14), (12,24), (0,0), (31,47), and the lowest opaque body row.
4. Modify selected pixels: change ONLY the two eyes (14,9) and (17,9) to #e9a64c. Re-read those two pixels and their 8 neighbours and report before/after.
5. Validate: sprite_info (dimensions, colour mode, palette entries, layers in order, frames); palette op analyze; validate. Report all findings with coordinates and say whether any colour is outside the 8-entry palette.
6. Four-frame animation "test" (a simple idle bob): duplicate frame 1 to make 4 frames. Frames 2 and 4: head + torso (rows 6..29) moved up 1 px (legs unchanged, so the feet stay on y = 44). Frame 3: same as frame 1 but the belt row shifts down by 1 px to y = 25. Corner markers identical in all 4 frames.
   Durations 120 ms each. Create tag "test" covering frames 1..4, direction forward.
   Evidence: look op diff for 1->2, 2->3, 3->4, 4->1 (changedBounds must be non-null each time and must never include a corner), the lowest opaque body row of each frame, and a look op filmstrip description.
7. Run validate again and report.
8. Then, as the very LAST drawing action, on layer body, frame 3, set ONE pixel (5,20) to #00ff00. This is a deliberately planted defect for a later blind review: do not validate or look after this step, and do not fix it.
9. Save the document with sprite_manage op save_as to <repo>\art-lab\characters\source\smoke-4a0b-v1.aseprite . Leave the sprite open in Aseprite.

FINAL OUTPUT: a compact numbered report of steps 1-9 with the evidence values. State plainly any step that failed or any tool error, verbatim. Do not claim success without the evidence.
