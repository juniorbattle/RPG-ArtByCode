// Rig of vessa-x3-combat (LAB, not approved, never in production without the operator's approval): Vessa Lark's combat sheet at x3, in the arena's cells (journal Passe CX2; the casting's
// decisions R-vessa « a n° 11 Duelist », X1, X2, X4 « Planche, puis texte pour Vessa, Ilse et Tobin »: the fine blade, X5). The chain is lib/combat.mjs, on four generated pose sheets
// (NON-CANONICAL until the operator's lot sheet) drawn from the casting's clean figure casting-clear-2026-11-01-e on a flat green ground, on the palette of her approved town sheet. All 34 frames
// of the § 14 list: she has every family, the guard and the dodge (V2_FOES.vessa).
//   node tools/art-lab/build-combat.mjs art-lab/characters/rigs/vessa-x3-combat.rig.mjs [--check]
import { rivalRig } from './lib/combat.mjs';

const src = (n) => `art-lab/characters/reference/sources/vessa-combat-x3-2026-11-01-${n}.png`;
export const { id, frame, clips, PALETTE, SHEETS, FIGURES, figures, placement, frames } = rivalRig({
  id: 'vessa-x3-combat', height: 120,
  palette: { path: 'art-lab/characters/exports/vessa-x2-v2.png', sha256: '34637c3687087acfb8cce445e1c1712ee7b5abe0ec6ea43661972e1730643826' },
  sheets: {
    a: { path: src('a'), sha256: '28d9107850ce7c53e56d7775f7cdb94d0f3aee755980fe7de1c732fdd245011e', stand: 280 },
    b: { path: src('b'), sha256: '7199bcc972b98c3d69f66de924b10b4e7e0c21e4aafc4aa1ce3ae898ea221099', stand: 280 },
    c: { path: src('c'), sha256: '4842f716f57327bdfa2961c56e531b5d57e2db2a38224fbad99970455687729e', stand: 280 },
    d: { path: src('d'), sha256: '28869f39da5149d958db816a5030342a2ada73c06997b591b00a980070c5c897', stand: 307 },
  },
  figures: {
    idle: { sheet: 'a', box: [58, 130, 293, 410] },
    ready: { sheet: 'a', box: [357, 163, 686, 410] },
    windup: { sheet: 'a', box: [822, 108, 1033, 408] },
    cut: { sheet: 'a', box: [1072, 148, 1473, 410] },
    follow: { sheet: 'a', box: [25, 582, 345, 839] },
    guard: { sheet: 'a', box: [474, 501, 639, 839] },
    recoil: { sheet: 'a', box: [738, 590, 1078, 839] },
    recovery: { sheet: 'a', box: [1120, 616, 1422, 844] },
    gather: { sheet: 'b', box: [112, 237, 379, 441] },
    raise: { sheet: 'b', box: [445, 48, 692, 441] },
    cleave: { sheet: 'b', box: [720, 223, 1064, 442] },
    through: { sheet: 'b', box: [1142, 252, 1424, 442] },
    stunned: { sheet: 'b', box: [76, 562, 265, 844] },
    fall: { sheet: 'b', box: [370, 645, 637, 843] },
    kneel: { sheet: 'b', box: [708, 688, 1016, 853] },
    ground: { sheet: 'b', box: [1118, 788, 1466, 869] },
    offPrep: { sheet: 'c', box: [69, 186, 353, 393] },
    offSurge: { sheet: 'c', box: [406, 170, 701, 396] },
    offHit: { sheet: 'c', box: [742, 211, 1120, 399] },
    offBack: { sheet: 'c', box: [1200, 157, 1409, 404] },
    defPrep: { sheet: 'c', box: [80, 630, 275, 851] },
    def: { sheet: 'c', box: [439, 660, 659, 852] },
    defBack: { sheet: 'c', box: [800, 633, 1037, 853] },
    victory: { sheet: 'c', box: [1229, 471, 1348, 854], hair: 150 },
    supPrep: { sheet: 'd', box: [232, 140, 394, 447] },
    sup: { sheet: 'd', box: [623, 86, 888, 437] },
    supBack: { sheet: 'd', box: [1029, 183, 1368, 445] },
    hop: { sheet: 'd', box: [298, 572, 577, 841] },
    land: { sheet: 'd', box: [865, 604, 1189, 863] },
  },
});
