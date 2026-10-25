# The interface's embedded fonts

The operator's decision S1 (sheet of journal Passe UI1, « Pixel pour les titres + texte lisible »): an embedded pixel font for titles, numbers and
keys, and an embedded readable text font, both under a free licence; no system font. The pair was chosen by the operator on 2026-10-25
(« Pixelify + Alegreya (Recommandé) », journal Passe UI3). Loaded by `src/ui/design/system.ts` (`@font-face`, bundled by Vite as assets).

| File | Family | Use | Licence | Source | Bytes | SHA-256 |
|---|---|---|---|---|---|---|
| `PixelifySans-latin.woff2` | Pixelify Sans (variable, 400-700) | titles, names, numbers, keys (`"CdT Pixel"`) | SIL OFL 1.1, `OFL-PixelifySans.txt` | https://fonts.gstatic.com/s/pixelifysans/v3/CHylV-3HFUT7aC4iv1TxGDR9Jn0Eiw.woff2 (Google Fonts, latin subset) | 12 016 | `4a5633a0c9c1b73abd133a56d3716c2d8df2ed03cb987346f72194aeb224f382` |
| `AlegreyaSans-400-latin.woff2` | Alegreya Sans Regular | sentences, labels (`"CdT Text"`) | SIL OFL 1.1, `OFL-AlegreyaSans.txt` | https://fonts.gstatic.com/s/alegreyasans/v28/5aUz9_-1phKLFgshYDvh6Vwt7VptvQ.woff2 (Google Fonts, latin subset) | 23 708 | `b2a5a35a2563a2f9bf9fb91939fc6ea6c115e9811cda5c4a37d02f623c7c4dbe` |
| `AlegreyaSans-700-latin.woff2` | Alegreya Sans Bold | bold labels (`"CdT Text"` 700) | SIL OFL 1.1, `OFL-AlegreyaSans.txt` | https://fonts.gstatic.com/s/alegreyasans/v28/5aUu9_-1phKLFgshYDvh6Vwt5eFIqEp2iw.woff2 (Google Fonts, latin subset) | 23 976 | `5acd19a588614d23e52b741a21dd8555178ab4932c3195c6d8fb4b296f84acae` |
| `OFL-PixelifySans.txt` | — | licence | — | https://raw.githubusercontent.com/google/fonts/main/ofl/pixelifysans/OFL.txt | 4 488 | `b66ba46f511a851ab09998b5a5a9fdbb102545a3864cb993095e1745996873a7` |
| `OFL-AlegreyaSans.txt` | — | licence | — | https://raw.githubusercontent.com/google/fonts/main/ofl/alegreyasans/OFL.txt | 4 405 | `0677891e6a143f297350d260ad766ad33bfc18ed5fa4f213acf648d6b597ec1a` |

- Downloaded on 2026-10-25 with the operator's permission, kept byte for byte (`tests/ui-design.test.mjs` checks each file's SHA-256 against this
  table). Copyright: « Copyright 2021 The Pixelify Sans Project Authors (https://github.com/eifetx/Pixelify-Sans) »; « Copyright 2013 The Alegreya
  Sans Project Authors (https://github.com/huertatipografica/Alegreya-Sans) ». The OFL lets the fonts be bundled with the game; they are not sold
  alone, and the reserved names are not used for a modified version (the files are unmodified).
- The latin subset holds U+0000-00FF, the general punctuation and a few signs (`LATIN_RANGE` in `system.ts`): English and French with their
  accents. A character outside it would fall back to a system font: `tools/ui-text.mjs` checks every visible character of the pages it measures.
- Pixelify Sans is drawn on a tenth of its em: at 20 / 30 / 40 px its pixel is 2 / 3 / 4 px wide (the type scale keeps those sizes); its outlines
  sit half a pixel off the grid at 20 px, so its edges are softened by the browser's anti-aliasing (journal Passe UI3).
