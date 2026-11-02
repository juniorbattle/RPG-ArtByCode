// Rig of vessa-x3-combat (LAB, not approved, never in production without the operator's approval): Vessa Lark's combat sheet at x3, in the arena's cells (journal Passe CX3; the casting's
// decisions R-vessa « a n° 11 Duelist », X1, X2, X4 « Planche, puis texte pour Vessa, Ilse et Tobin »: the fine blade, X5, CX-S1 « Même recette »). The chain is lib/combat.mjs, on six generated
// pose sheets (NON-CANONICAL until the operator's lot sheet) drawn from the casting's clean figure casting-clear-2026-11-01-e on a flat green ground, on the palette of her approved town sheet
// with a steel ramp. All 34 frames of the § 14 list: she has every family, the guard and the dodge (V2_FOES.vessa). Sheet e is the retake after the blind critique: the Brace drawn in the plane of
// the image, the raised blade clear of her head, both blows at the opponent's height, a whole blade at the victory. Her head grown by 1.2.
//   node tools/art-lab/build-combat.mjs art-lab/characters/rigs/vessa-x3-combat.rig.mjs [--check]
import { rivalRig, STEEL_RAMP } from './lib/combat.mjs';

const src = (n) => `art-lab/characters/reference/sources/vessa-combat-x3-2026-11-01-${n}.png`;
export const { id, frame, clips, PALETTE, EXTRA, SHEETS, FIGURES, figures, placement, frames } = rivalRig({
  id: 'vessa-x3-combat', height: 120, head: { s: 1.2, r: 46, blade: true }, extra: STEEL_RAMP, soles: true,
  palette: { path: 'art-lab/characters/exports/vessa-x2-v2.png', sha256: '34637c3687087acfb8cce445e1c1712ee7b5abe0ec6ea43661972e1730643826' },
  sheets: {
    a: { path: src('a'), sha256: '28d9107850ce7c53e56d7775f7cdb94d0f3aee755980fe7de1c732fdd245011e', stand: 280 },
    b: { path: src('b'), sha256: '7199bcc972b98c3d69f66de924b10b4e7e0c21e4aafc4aa1ce3ae898ea221099', stand: 280 },
    c: { path: src('c'), sha256: '4842f716f57327bdfa2961c56e531b5d57e2db2a38224fbad99970455687729e', stand: 280 },
    d: { path: src('d'), sha256: '28869f39da5149d958db816a5030342a2ada73c06997b591b00a980070c5c897', stand: 307 },
    f: { path: src('f'), sha256: 'b68dc460159ba4b39aa2655aac6190dfa7ab7a34410e7eee2fa44bcf7737e93a', stand: 280 },
    e: { path: src('e'), sha256: '40879059c1e1e913674510aa386b9af0eaee2a1e998439d0db60520f5af2ee32', stand: 280 },
  },
  figures: {
    idle: { sheet: 'a', box: [58, 130, 293, 410], head: [210, 180] },
    ready: { sheet: 'a', box: [357, 163, 686, 410], head: [580, 200] },
    windup: { sheet: 'f', box: [137, 168, 403, 453], head: [210, 230] },
    cut: { sheet: 'a', box: [1072, 148, 1473, 410], head: [1300, 200] },
    follow: { sheet: 'a', box: [25, 582, 345, 839], head: [184, 640] },
    guard: { sheet: 'a', box: [474, 501, 639, 839], head: [536, 630] },
    recoil: { sheet: 'a', box: [738, 590, 1078, 839], head: [1020, 650, 100] },
    recovery: { sheet: 'a', box: [1120, 616, 1422, 844], head: [1264, 670] },
    gather: { sheet: 'b', box: [112, 237, 379, 441], head: [160, 286, 60] },
    raise: { sheet: 'f', box: [442, 83, 689, 453], head: [600, 230] },
    cleave: { sheet: 'e', box: [356, 638, 697, 843], head: [544, 690, 40] },
    through: { sheet: 'b', box: [1142, 252, 1424, 442], head: [1270, 296, 50] },
    stunned: { sheet: 'b', box: [76, 562, 265, 844], head: [140, 616, 70] },
    fall: { sheet: 'b', box: [370, 645, 637, 843], head: [480, 696, 60] },
    kneel: { sheet: 'b', box: [708, 688, 1016, 853], head: [850, 736, 50] },
    ground: { sheet: 'b', box: [1118, 788, 1466, 869], head: [1240, 826, 0] },
    offPrep: { sheet: 'c', box: [69, 186, 353, 393], head: [170, 242] },
    offSurge: { sheet: 'c', box: [406, 170, 701, 396], head: [570, 222] },
    offHit: { sheet: 'e', box: [754, 648, 1124, 843], head: [970, 700, 40] },
    offBack: { sheet: 'c', box: [1200, 157, 1409, 404], head: [1320, 212] },
    defPrep: { sheet: 'e', box: [122, 79, 330, 391], head: [256, 200] },
    def: { sheet: 'e', box: [448, 104, 677, 391], head: [570, 210] },
    defBack: { sheet: 'e', box: [1126, 163, 1397, 394], head: [1300, 230] },
    victory: { sheet: 'f', box: [1222, 33, 1382, 455], head: [1310, 236], hair: 150 },
    supPrep: { sheet: 'f', box: [804, 630, 996, 894], head: [930, 680] },
    sup: { sheet: 'f', box: [873, 98, 1042, 453], head: [950, 230] },
    supBack: { sheet: 'd', box: [1029, 183, 1368, 445], head: [1230, 240], r: 52 },
    hop: { sheet: 'd', box: [298, 572, 577, 841], head: [460, 620], r: 52 },
    land: { sheet: 'd', box: [865, 604, 1189, 863], head: [1060, 650], r: 52 },
  },
});
