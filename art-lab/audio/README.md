# The band: the game's music, written here

The sound's source (the operator's sheet, `AGENTS.md`, section "Sound"): scores written in this repository, played by a synthesis written in this repository, baked at
development time. No sample bank, no generated audio, no dependency. Journal: Passes SN4 to SN7.

- `scores/theme.mjs`: the motif, SA-2's thirteen notes, in the meters the versions use; `WHOLE_MOTIF`, the pieces where it is heard whole, and `THEME_STEPS`, the
  turns two pieces may share by design (journal Passe SN8: one piece, one tune; the whole motif in the title, midday, the fights' riffs and the finale, elsewhere its head
  hidden in an accompaniment; the fanfare's call in midday and the finale only); `TOURNAMENT`, the four pieces the operator kept as SN7 wrote them (journal Passe SN9:
  midday, the duel, the rival, the finale), which may share among themselves, the duel ending on the fanfare in 7/8.
- `scores/<id>.score.mjs`: one piece, an original score. `tunes` names the tracks that carry the tune: the band's voicings make room for them.
- `scores/rig.mjs`: the band's desks, measured on the approved versions, and the helpers a score shares.
- `manifests/<id>.manifest.json`: a baked piece's provenance (`tools/audio/validate.mjs`): its score, its files and their SHA-256, the operator's words. Fourteen since journal Passe SN10
  (R-SUITE « Cuire et brancher dans la version 2 »): the catalogue plays in the version 2.

`tools/audio/band/` holds the instruments (`instruments.mjs`, `drums.mjs`), the signal tools (`dsp.mjs`), how a score is read and mixed (`session.mjs`), the checks without
an ear (`check.mjs`), how much the pieces resemble each other (`likeness.mjs`: the tunes' turns of six notes read in any key and rhythm, the two-bar blocks copied, the
progressions, the keys), and the renders:

```bash
node --max-old-space-size=8192 tools/audio/band/render.mjs <outDir> [id ...] [--lufs=-18] [--stems] [--meters] [--loop]
```

WAV always, AAC and Opus through `ffmpeg` when it is found (`FFMPEG` or the PATH; a development tool, never in the game or the repository). A piece takes 20 to 50 s to
render. `--meters` prints each track's loudness and its balance by octave: the mix is set on these, a change of an instrument is measured again. `--loop` renders the game's
file: the piece's body alone, a circle: what rings past the end lands on the start, the dynamics go round twice. Without it a piece has its intro and its ending, for the ear.

The bake (journal Passe SN10) writes what the game plays: `src/audio/baked/` (Opus in WebM, AAC in M4A), the manifests and `src/audio/catalogue.json`:

```bash
node --max-old-space-size=8192 tools/audio/band/bake.mjs [id ...] [--check]
```

A loop is its body; the fights' three layers each carry the gain the master's dynamics gave the whole mix, so that the three together are the approved master; the
intros (the fights', the title's) are rendered apart (`intro: true` on the session: what comes before the loop and its ringing, nothing of the body) with the loop's
levels, and end where the loop begins. The encoders run bit-exact (`encode.mjs`); Opus's delay is written as 336 samples, 7 ms, the file led by 24 of the loop's
last samples: Chrome reads the WebM's delay through the container's millisecond. Each piece is rendered from its score alone (`forgetNotes`, `forgetHits`): a note
kept from an earlier piece under a length rounded to the millisecond could stand for a slightly different one. `--check` rebuilds and compares.

The notes are read without sound by a dry session (`tests/audio-band.test.mjs`): the motif whole where it belongs and its head elsewhere, no held note of the tune a
semitone above the band, each instrument in its range, the third of the hour, and the catalogue not copying itself (outside the theme, under 8 % of the tunes' turns heard
in another piece, at most four shared by two pieces, no two bars copied, the fanfare's call nowhere else, six keys at least; the tournament's four pieces are free among themselves, journal Passe SN9). They find faults; only an ear says a piece is good, and nobody here has one: each lot goes to the operator on a listening sheet.

The duel's sounds (lot S3, journal Passe SN15) live in `sfx/`: `duel.sfx.mjs`, one sound for each of the arena's effect recipes (`src/arena/fx/fxRecipes.ts`, name for name) and the duel's reading, each a few strokes of the band's instruments on the motif's notes; `crowd.sfx.mjs`, the arena's crowd in code (voices through their vowels' formants, hands as bursts of noise: a murmur that loops and four reactions). `node --max-old-space-size=8192 tools/audio/band/sfx.mjs <outDir>` renders them (16-bit WAV and `sfx.json`, 13 s for the 64 files); `node tools/audio/sfx-listen.mjs <sfxDir> <outDir> <siteDir> --duels=<dir> --today=<render dir>` plays them in the real engine on the bot's duels, the levels set on the engine's output, and writes the sheet's excerpts and palettes. In the version 2 since journal Passe SN16 (S3-SUITE « Cuire et brancher dans la version 2 ce qui est validé »): `node --max-old-space-size=8192 tools/audio/band/bake-sfx.mjs [--check]` bakes them (Opus at 64 kb/s and AAC at 80 without its noise substitution, the murmur at 96; one manifest a family; the table `sfx` of `src/audio/catalogue.json`), and `src/audio/sfx.ts` says which plays for which event of a duel.
