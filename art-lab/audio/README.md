# The band: the game's music, written here

The sound's source (the operator's sheet, `AGENTS.md`, section "Sound"): scores written in this repository, played by a synthesis written in this repository, baked at
development time. No sample bank, no generated audio, no dependency. Journal: Passes SN4 to SN7.

- `scores/theme.mjs`: the motif, SA-2's thirteen notes, in the meters the versions use.
- `scores/<id>.score.mjs`: one piece, an original score. `tunes` names the tracks that carry the tune: the band's voicings make room for them.
- `scores/rig.mjs`: the band's desks, measured on the approved versions, and the helpers a score shares.
- `manifests/<id>.manifest.json`: a baked file's provenance, once a piece is approved for the game (`tools/audio/validate.mjs`). None yet: these scores are for the ear.

`tools/audio/band/` holds the instruments (`instruments.mjs`, `drums.mjs`), the signal tools (`dsp.mjs`), how a score is read and mixed (`session.mjs`), the checks without
an ear (`check.mjs`), and the renders:

```bash
node --max-old-space-size=8192 tools/audio/band/render.mjs <outDir> [id ...] [--lufs=-18] [--stems] [--meters] [--loop]
```

WAV always, AAC and Opus through `ffmpeg` when it is found (`FFMPEG` or the PATH; a development tool, never in the game or the repository). A piece takes 20 to 50 s to
render. `--meters` prints each track's loudness and its balance by octave: the mix is set on these, a change of an instrument is measured again. `--loop` renders the game's
file: the piece's body alone, a circle: what rings past the end lands on the start, the dynamics go round twice. Without it a piece has its intro and its ending, for the ear.

The notes are read without sound by a dry session (`tests/audio-band.test.mjs`): the motif in order, no held note of the tune a semitone above the band, each instrument in
its range, the third of the hour. They find faults; only an ear says a piece is good, and nobody here has one: each lot goes to the operator on a listening sheet.
