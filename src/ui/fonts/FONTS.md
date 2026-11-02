# The interface's embedded fonts

The operator's decision UM-S1 (sheet of journal Passe UM1, « Lever la police pixel, garder le principe »): two free fonts embedded, no system font. The
pair is direction A « Voile »'s (UM-1): Marcellus for titles, names and numbers, Source Sans 3 for text. UM-T3 « Oui »: downloaded from Google Fonts
(latin subset), and the fonts of the former direction (Pixelify Sans, Alegreya Sans, journal Passe UI3) leave the repository. Loaded by
`src/ui/design/system.ts` (`@font-face`, bundled by Vite as assets).

| File | Family | Use | Licence | Source | Bytes | SHA-256 |
|---|---|---|---|---|---|---|
| `Marcellus-latin.woff2` | Marcellus Regular | titles, names, numbers (`"CdT Title"`) | SIL OFL 1.1, `OFL-Marcellus.txt` | https://fonts.gstatic.com/s/marcellus/v14/wEO_EBrOk8hQLDvIAF81VvoK.woff2 (Google Fonts, latin subset) | 14 552 | `8a539799d12e3a144273288055490f57e1eee84da7a9145f085bc522e80719c3` |
| `SourceSans3-latin.woff2` | Source Sans 3 (variable, 200-900) | sentences, labels, keys (`"CdT Text"`) | SIL OFL 1.1, `OFL-SourceSans3.txt` | https://fonts.gstatic.com/s/sourcesans3/v20/nwpStKy2OAdR1K-IwhWudF-R3w8aZQ.woff2 (Google Fonts, latin subset) | 28 872 | `19143dca075972bc84e3fd9eab7416dd40cc565dccb2435a044bdfabe060c7d5` |
| `OFL-Marcellus.txt` | — | licence | — | https://raw.githubusercontent.com/google/fonts/main/ofl/marcellus/OFL.txt | 4 430 | `715ba72697e14daa9b29a333545f69bde7c497b9f77d0a2a4c4a5a752d961801` |
| `OFL-SourceSans3.txt` | — | licence | — | https://raw.githubusercontent.com/google/fonts/main/ofl/sourcesans3/OFL.txt | 4 579 | `09746787287a289323b0ec3cff4d1a4a801331b82b7207c1e186f5d26619a392` |

- Downloaded on 2026-11-01 under UM-T3, kept byte for byte (`tests/ui-design.test.mjs` checks each file's SHA-256 against this table). Copyright:
  « Copyright (c) 2012, Brian J. Bonislawsky DBA Astigmatic (AOETI) (astigma@astigmatic.com), with Reserved Font Names "Marcellus" »; « Copyright
  2010-2020 Adobe (http://www.adobe.com/), with Reserved Font Name 'Source'. All Rights Reserved. Source is a trademark of Adobe in the United States
  and/or other countries. » The OFL lets the fonts be bundled with the game; they are not sold alone, and the reserved names are not used for a
  modified version (the files are unmodified).
- The latin subset holds U+0000-00FF, the general punctuation and a few signs (`LATIN_RANGE` in `system.ts`): English and French with their
  accents. A character outside it would fall back to a system font: `tools/ui-text.mjs` checks every visible character of the pages it measures.
- Marcellus has one set of figures, with no lining or tabular alternate in this file (measured in the page: `lnum`, `tnum` and `onum` change nothing):
  its « 1 » is about as wide as its « I » and its « 0 » exactly as wide as its « O ». At small sizes « 10 » reads close to « IO » (journal Passe UM2). The
  operator's decision UM2-3 « Chiffres en Source Sans 3 » (journal Passe UM3): the digits of `"CdT Title"` come from the text font's file, by a second
  `@font-face` on `DIGITS` in `system.ts`; titles and names stay in Marcellus.
