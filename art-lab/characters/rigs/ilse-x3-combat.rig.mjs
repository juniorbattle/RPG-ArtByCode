// Rig of ilse-x3-combat (LAB, not approved, never in production without the operator's approval): Ilse Morrow's combat sheet at x3, in the arena's cells (journal Passe CX3; the casting's decisions
// R-ilse « G2 n° 03 Prêtresse », X1, X2, X4 « Planche, puis texte pour Vessa, Ilse et Tobin »: her sword, from the text, X5, CX-S1 « Même recette »). The chain is lib/combat.mjs, on 4 generated pose sheets (NON-CANONICAL until the
// operator's lot sheet) drawn from the casting's clean figure casting-clear-2026-11-01-b on a flat green ground, on the palette of the approved town sheet with a steel ramp. 32 frames of the § 14 list: no dodge (V2_FOES.ilse).
//   node tools/art-lab/build-combat.mjs art-lab/characters/rigs/ilse-x3-combat.rig.mjs [--check]
import { rivalRig, STEEL_RAMP } from './lib/combat.mjs';

const src = (n) => `art-lab/characters/reference/sources/ilse-combat-x3-2026-11-01-${n}.png`;
export const { id, frame, clips, PALETTE, EXTRA, SHEETS, FIGURES, figures, placement, frames } = rivalRig({
  id: 'ilse-x3-combat', height: 131, head: { s: 1.2, r: 50 }, extra: STEEL_RAMP, soles: true,
  palette: { path: 'art-lab/characters/exports/ilse-x2-v2.png', sha256: '7c021b0bf26d49e3b659bec0d3c79d18f1f4c48b3349c5f927fbdbaf8111d0bb' },
  sheets: {
    a: { path: src('a'), sha256: '48d6fa1101bf826fbc8d0d7616f9b24d5486391c4838b4be7dad086dd99d5337', stand: 244 },
    b: { path: src('b'), sha256: '3a08bca5dfe4ded6b7f61fc05866eb0bb870009b2385576af2ac2adbac30b1ad', stand: 244 },
    c: { path: src('c'), sha256: '6a18bfd6ac72ec05726931e69bde181af52defbe313c19327fa5a6f55159ed80', stand: 268 },
    d: { path: src('d'), sha256: '0707e6ebd2ae5d55e444a15d69b311153d0ca45c54a6b593043e1ba04fd353ba', stand: 387 },
    e: { path: src('e'), sha256: '0b4096beffd7b834456b5c776d4ec84c95e3e9f22050bdbbb8f05863f2b6f7a4', stand: 294 },
  },
  figures: {
    idle: { sheet: 'a', box: [75, 179, 255, 425], head: [188, 235] },
    ready: { sheet: 'a', box: [406, 166, 644, 425], head: [537, 242] },
    windup: { sheet: 'a', box: [814, 167, 1026, 425], head: [891, 242] },
    cut: { sheet: 'a', box: [1140, 192, 1441, 425], head: [1325, 242] },
    follow: { sheet: 'a', box: [83, 605, 309, 841], head: [195, 655] },
    guard: { sheet: 'a', box: [469, 551, 638, 841], head: [537, 655] },
    recoil: { sheet: 'a', box: [762, 594, 1043, 841], head: [997, 645, 100] },
    recovery: { sheet: 'a', box: [1168, 614, 1401, 843], head: [1274, 660] },
    gather: { sheet: 'b', box: [120, 219, 385, 413], head: [164, 266, 60] },
    raise: { sheet: 'b', box: [467, 62, 668, 413], head: [537, 188] },
    cleave: { sheet: 'b', box: [723, 202, 1095, 412], head: [922, 250, 40] },
    through: { sheet: 'b', box: [1120, 241, 1431, 417], head: [1280, 287, 50] },
    stunned: { sheet: 'e', box: [424,596,566,896], head: [480, 666, 70] },
    fall: { sheet: 'b', box: [395, 634, 622, 833], head: [492, 676, 60] },
    kneel: { sheet: 'b', box: [690, 673, 1006, 840], head: [830, 707, 50] },
    ground: { sheet: 'b', box: [1155, 772, 1427, 848], head: [1198, 799, 0] },
    offPrep: { sheet: 'c', box: [129, 101, 278, 413], head: [188, 195] },
    offSurge: { sheet: 'c', box: [469, 47, 669, 413], head: [537, 184] },
    offHit: { sheet: 'e', box: [737,637,1142,893], head: [1010, 686, 40] },
    offBack: { sheet: 'c', box: [1236, 101, 1385, 413], head: [1280, 235] },
    defPrep: { sheet: 'c', box: [123, 596, 265, 872], head: [174, 645] },
    def: { sheet: 'c', box: [464, 587, 668, 872], head: [543, 645] },
    defBack: { sheet: 'c', box: [768, 606, 1081, 872], head: [952, 655] },
    victory: { sheet: 'e', box: [400,22,558,483], head: [504, 240], hair: 138 },
    supPrep: { sheet: 'd', box: [154, 304, 406, 691], head: [276, 368], r: 64 },
    sup: { sheet: 'd', box: [611, 290, 939, 691], head: [768, 358], r: 64 },
    supBack: { sheet: 'd', box: [1068, 297, 1406, 691], head: [1280, 368], r: 64 },
  },
});
