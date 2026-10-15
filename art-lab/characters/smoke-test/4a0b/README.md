# Pass 4A-0B smoke test evidence (2026-10-15)

Aseprite -> Three.js round trip of the synthetic dummy `smoke-4a0b-v1` (manifest `../../manifests/smoke-4a0b-v1.manifest.json`,
`experimental`, `runtimeUse: lab`). Not character art.

| File | What |
|---|---|
| `brief-A.md`, `session-A-report.md` | build: preflight, sprite, palette, layers, exact pixel reads, 2-pixel edit, validation, 4-frame tagged animation, planted defect, save |
| `brief-B.md`, `session-B-report.md` | blind review (critic agent failed: no aseprite tools; `aseprite:review` + `validate` found the planted pixel), correction with before / after reads, export, save |
| `lab-check.json` | Character Lab self-test on the real export, cameras A-D (0 mismatches), negative control `filter=linear` (fails: 4 950 / 6 212), synthetic fixture control, independent per-frame decode |
| `lab-camB.png` | Character Lab at Camera B runtime scale, 1920x1080 |
| `../../reviews/smoke-4a0b-v1-contact.png` | `art:sheet` contact sheet, 4x |

Versions: Aseprite 1.3.18.6-x64, extension and Claude Code plugin aseprite-ai-artist 0.8.2 (marketplace tag `v0.8.2`, local scope),
Claude Code 2.1.301, sessions driven by `claude-opus-5-5`. SHA-256 (first 16): source `5118e7529e21c20a`, sheet `61bc0056fd9cc47a`,
atlas `56a9e1791a66f0e4`. Session reports are the sessions' own words; the facts in them were re-checked from the files (see
JOURNAL, Passe 4A-0B). The absolute repo path is redacted as `<repo>`.
