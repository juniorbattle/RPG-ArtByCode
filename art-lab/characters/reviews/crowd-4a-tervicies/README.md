# Crowd townsfolk — scene evidence (Pass 4A-tervicies, 2026-10-17)

Five CANDIDATE baked sheets for the ambient crowd (`artisan-x2-v1`, `traveler-x2-v1`, `townswoman-x2-v1`, `older-merchant-x2-v1`,
`courier-x2-v1`), replacing the generated variants `crowd0`..`crowd4` only with the DEV flag `?cast=candidate` until the operator approves them.
Per-character evidence: `../<id>/`.

| File | What it shows |
|---|---|
| `01-scene-B-generated-vs-candidates.png` | camera B, `seed=1842&clean=1&freeze=7.3`, the same deterministic frame: the generated crowd (left) / the candidates (right). At NPC density 1 the crowd has two wanderers (`round(2 x density)`): crowd0 (artisan, at the back) and crowd1 (traveler, in front) |
| `02-scene-C-generated-vs-candidates.png` | the same in camera C |
| `scene-report.json` | `tools/art-lab/baked-proof.mjs shots`, 1920 x 1080, views A, B, C, D, sabotaged C / D: `base` = `main` at `549aab9` served aside (`:5184`), `work` / `work2` = this tree (default boot, twice: repeat witness), `cand` = this tree with `?cast=candidate`. Default boot 0 px in all six views, repeat witness 0 px |

The townswoman, the older merchant and the courier do not appear at seed 1842 with the default density; they spawn with other seeds or a
higher density (the operator chose « remplacer seulement »: no new placed NPCs).
