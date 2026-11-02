// Rig of rhosk-x3-combat (LAB, not approved, never in production without the operator's approval): Rhosk's combat sheet at x3, in the arena's cells (journal Passe CX3; the casting's decisions
// R-rhosk « G1 panneau 6 », X1, X2, X4 « Planche, puis texte pour Vessa, Ilse et Tobin »: his two-handed axe, from the sheet, X5, CX-S1 « Même recette »). The chain is lib/combat.mjs, on 4 generated pose sheets (NON-CANONICAL until the
// operator's lot sheet) drawn from the casting's clean figure casting-clear-2026-11-01-a on a flat green ground, on the palette of the approved town sheet with a steel ramp. 32 frames of the § 14 list: no dodge (V2_FOES.rhosk).
//   node tools/art-lab/build-combat.mjs art-lab/characters/rigs/rhosk-x3-combat.rig.mjs [--check]
import { rivalRig, STEEL_RAMP } from './lib/combat.mjs';

const src = (n) => `art-lab/characters/reference/sources/rhosk-combat-x3-2026-11-01-${n}.png`;
export const { id, frame, clips, PALETTE, EXTRA, SHEETS, FIGURES, figures, placement, frames } = rivalRig({
  id: 'rhosk-x3-combat', height: 132, head: { s: 1, r: 50, blade: true }, extra: STEEL_RAMP, soles: true,
  palette: { path: 'art-lab/characters/exports/rhosk-x2-v2.png', sha256: '75a309479502007ece17886fdb1d242811e8214e8ffaf05a0d3bf5374d15eb09' },
  sheets: {
    a: { path: src('a'), sha256: '4c18fed1e540da53b1144e02a0214b465e8dcdf183d80b7eea8e90877b45f78a', stand: 330 },
    b: { path: src('b'), sha256: '23f87966ee4be06c549e1cf50a827075717a65630d91801cd53da2738ca29f85', stand: 310 },
    c: { path: src('c'), sha256: 'fb11cbe6410f38f8e49584c9e63c97845e9c3eac7fd32c6bf37342d8ea4aa057', stand: 270 },
    d: { path: src('d'), sha256: '5e8eb34c10414f0e6df02e8ed725e1c8f31065d41ab4a4642bb3cf8512d1ce03', stand: 400 },
    e: { path: src('e'), sha256: '93041980d3c43f2dc4020c4902827243b01efa59850bce5ca7e2e4c1fe8ec364', stand: 270 },
  },
  figures: {
    idle: { sheet: 'a', box: [35, 110, 319, 437], head: [211, 180] },
    ready: { sheet: 'a', box: [363, 149, 725, 435], head: [580, 215] },
    windup: { sheet: 'a', box: [819, 89, 1093, 434], head: [946, 195] },
    cut: { sheet: 'a', box: [1080, 154, 1477, 436], head: [1305, 215] },
    follow: { sheet: 'a', box: [25, 579, 361, 878], head: [188, 639] },
    guard: { sheet: 'a', box: [448, 538, 677, 877], head: [543, 655] },
    recoil: { sheet: 'a', box: [724, 568, 1085, 875], head: [1030, 625, 100] },
    recovery: { sheet: 'a', box: [1104, 592, 1433, 884], head: [1286, 655] },
    gather: { sheet: 'b', box: [69, 240, 385, 480], head: [117, 297, 60], hips: 172 },
    raise: { sheet: 'b', box: [433, 84, 687, 476], head: [569, 229] },
    cleave: { sheet: 'b', box: [690, 257, 1100, 478], head: [887, 307, 40] },
    through: { sheet: 'b', box: [1124, 259, 1457, 480], head: [1270, 307, 50] },
    stunned: { sheet: 'b', box: [49, 579, 289, 875], head: [164, 625, 70] },
    fall: { sheet: 'b', box: [351, 626, 640, 879], head: [446, 680, 60] },
    kneel: { sheet: 'b', box: [709, 702, 1057, 881], head: [850, 748, 50] },
    ground: { sheet: 'b', box: [1124, 784, 1474, 890], head: [1229, 829, 0] },
    offPrep: { sheet: 'c', box: [96, 77, 308, 397], head: [184, 174] },
    offSurge: { sheet: 'c', box: [472, 25, 684, 398], head: [537, 195] },
    offHit: { sheet: 'c', box: [724, 181, 1100, 402], head: [922, 246, 40] },
    offBack: { sheet: 'c', box: [1138, 136, 1426, 398], head: [1315, 195] },
    defPrep: { sheet: 'e', box: [33, 615, 330, 875], head: [180, 665] },
    def: { sheet: 'e', box: [404, 607, 679, 875], head: [537, 659] },
    defBack: { sheet: 'e', box: [766, 605, 1052, 877], head: [921, 655] },
    victory: { sheet: 'c', box: [1166, 454, 1356, 860], head: [1270, 655], hair: 140 },
    supPrep: { sheet: 'd', box: [45, 281, 395, 688], head: [242, 348], r: 62 },
    sup: { sheet: 'd', box: [451, 246, 1006, 680], head: [795, 317], r: 62 },
    supBack: { sheet: 'd', box: [992, 294, 1475, 689], head: [1235, 358], r: 62 },
  },
});
