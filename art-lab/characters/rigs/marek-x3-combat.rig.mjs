// Rig of marek-x3-combat (LAB, not approved, never in production without the operator's approval): Marek Varn's combat sheet at x3, in the arena's cells (journal Passe CX1; the
// casting's decisions R-marek « G1 panneau 3 », X1 « Les sept rivaux », X2, X4 « Planche, puis texte pour Vessa, Ilse et Tobin », X5 « Une tâche de 5 $ par combattant »). The chain is
// lib/combat.mjs, on five generated pose sheets (NON-CANONICAL until the operator's lot sheet) drawn from the casting's clean figure casting-clear-2026-11-01-a and G1's panel 3 on a flat green
// ground, on the palette of his approved town sheet marek-x2-v2. 32 frames of the § 14 list: he has no dodge (V2_FOES.marek: guard 0.35, dodge 0). Sheet e is the retake after the blind
// critique: both blows landing at the height of the opponent's body, the cape low, the stunned figure, a whole blade at the victory, steel boots.
//   node tools/art-lab/build-combat.mjs art-lab/characters/rigs/marek-x3-combat.rig.mjs [--check]
import { rivalRig } from './lib/combat.mjs';

const src = (n) => `art-lab/characters/reference/sources/marek-combat-x3-2026-11-01-${n}.png`;
/** the knockout's figures on sheet b are drawn larger than its standing ones (a fallen head came out 35 % larger than a standing one, blind critique) */
const FALLEN = 2.66;
export const { id, frame, clips, PALETTE, SHEETS, FIGURES, figures, placement, frames } = rivalRig({
  id: 'marek-x3-combat', height: 132, head: { s: 1.3, r: 48 },
  palette: { path: 'art-lab/characters/exports/marek-x2-v2.png', sha256: 'd2e975afd2a22bff82a3b66265ea35ebe1fa4f0d38703cdb45f8b143dc8a6765' },
  sheets: {
    a: { path: src('a'), sha256: '69f6a8934b8669766bf418e2547bf6f66aceb24aee30d196f285ecbf329e800d', stand: 281 },
    b: { path: src('b'), sha256: 'faabb660f47adeab0fecf9830190e3502afecc4027c27ec02e717297ed9b8177', stand: 290 },
    c: { path: src('c'), sha256: '70f553ecdbce72e77df68bf7ccfa502f459ef49ebea44331a69c6781fc5bfdc7', stand: 290 },
    d: { path: src('d'), sha256: '2d9fbbb96e592dba50e0873913e2fefbf0e0d5b28f673085ae962be6e799e8ac', stand: 357 },
    e: { path: src('e'), sha256: 'f0447931dd03563865006176dbd86295d31c7d4d054df3a4cb7329428fd2a78a', stand: 282 },
  },
  figures: {
    idle: { sheet: 'a', box: [70, 135, 333, 416], head: [260, 180] },
    ready: { sheet: 'a', box: [412, 107, 726, 417], head: [600, 200] },
    windup: { sheet: 'a', box: [844, 68, 1080, 418], head: [924, 190] },
    cut: { sheet: 'a', box: [1055, 144, 1470, 417], head: [1280, 194], trim: 8 },
    follow: { sheet: 'a', box: [44, 594, 374, 863], head: [212, 644] },
    guard: { sheet: 'a', box: [477, 520, 668, 865], head: [580, 644] },
    recoil: { sheet: 'a', box: [737, 562, 1088, 842], head: [1050, 606, 100] },
    recovery: { sheet: 'a', box: [1132, 611, 1434, 868], head: [1280, 660] },
    gather: { sheet: 'b', box: [102, 189, 439, 439], head: [148, 240, 60] },
    raise: { sheet: 'b', box: [459, 56, 738, 439], head: [590, 190] },
    cleave: { sheet: 'e', box: [37, 175, 427, 403], head: [250, 212, 40] },
    through: { sheet: 'b', box: [1102, 236, 1475, 439], head: [1254, 280, 40] },
    stunned: { sheet: 'e', box: [121, 619, 308, 885], head: [210, 652, 70] },
    fall: { sheet: 'b', box: [366, 599, 675, 853], head: [474, 650, 50], pitch: FALLEN },
    kneel: { sheet: 'b', box: [676, 653, 1076, 855], head: [854, 700, 50], pitch: FALLEN },
    ground: { sheet: 'b', box: [1100, 767, 1465, 868], head: [1184, 820, 0], pitch: FALLEN },
    offPrep: { sheet: 'c', box: [106, 181, 389, 449], head: [170, 226, 70] },
    offSurge: { sheet: 'c', box: [454, 15, 678, 447], head: [560, 186] },
    offHit: { sheet: 'e', box: [414, 176, 767, 403], head: [574, 216, 40] },
    offBack: { sheet: 'e', box: [771, 123, 1060, 404], head: [956, 182] },
    defPrep: { sheet: 'c', box: [114, 617, 293, 913], head: [180, 666] },
    def: { sheet: 'c', box: [412, 601, 687, 914], head: [530, 646] },
    defBack: { sheet: 'e', box: [1090, 128, 1411, 408], head: [1280, 188] },
    supPrep: { sheet: 'd', box: [301, 65, 538, 424], head: [374, 126, 70], r: 62 },
    sup: { sheet: 'd', box: [770, 60, 1367, 430], head: [1124, 116, 110], r: 62, trim: 30 },
    supBack: { sheet: 'd', box: [120, 582, 602, 926], head: [384, 646], r: 62 },
    victory: { sheet: 'e', box: [861, 435, 1029, 888], head: [956, 642], hair: 138 },
  },
});
