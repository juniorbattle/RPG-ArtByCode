// Rig of orla-x3-combat (LAB, not approved, never in production without the operator's approval): Orla Brask's combat sheet at x3, in the arena's cells (journal Passe CX3; the casting's
// decisions R-orla « G1 panneau 5 », X1, X2, X4 « Planche, puis texte pour Vessa, Ilse et Tobin »: her two swords, from the sheet, X5, CX-S1 « Même recette »). The chain is lib/combat.mjs, on
// four generated pose sheets (NON-CANONICAL until the operator's lot sheet) drawn from the casting's clean figure casting-clear-2026-11-01-a and G1's panel 5 on a flat green ground, on the
// palette of her approved town sheet with a steel ramp. 29 frames of the § 14 list: no dodge, no support skill (V2_FOES.orla). Her head grown by 1.2 (the operator's note on Marek's 1.3).
//   node tools/art-lab/build-combat.mjs art-lab/characters/rigs/orla-x3-combat.rig.mjs [--check]
import { rivalRig, STEEL_RAMP } from './lib/combat.mjs';

const src = (n) => `art-lab/characters/reference/sources/orla-combat-x3-2026-11-01-${n}.png`;
export const { id, frame, clips, PALETTE, EXTRA, SHEETS, FIGURES, figures, placement, frames } = rivalRig({
  id: 'orla-x3-combat', height: 128, head: { s: 1.1, r: 50, blade: true }, extra: STEEL_RAMP, soles: true,
  palette: { path: 'art-lab/characters/exports/orla-x2-v2.png', sha256: '7b1a2a83734aac67c8a13277bfce66556c8b7b0da278ae51d50d468de2f8e1d2' },
  sheets: {
    a: { path: src('a'), sha256: 'f5ad404de4387670350e0b4f2cc6118d1acf60e604884a0fa7478d90e1efe2c8', stand: 322 },
    b: { path: src('b'), sha256: 'a7b1a7211ebf2df1717c6307dd80237cc0647f37f3868c62164ae94640238253', stand: 320 },
    d: { path: src('d'), sha256: '1d61473a59d50b76c949b80b961cfd7093c16559dee4005df03184a155ee1a7c', stand: 322 },
    c: { path: src('c'), sha256: '3e7af23496fe52dca4636eaa6fda1c9afa384401168d7f4d4bfe8992b1b14c37', stand: 322 },
  },
  figures: {
    idle: { sheet: 'a', box: [86, 104, 322, 426], head: [230, 170] },
    ready: { sheet: 'a', box: [421, 151, 666, 426], head: [566, 190] },
    windup: { sheet: 'a', box: [800, 129, 1044, 426], head: [876, 194] },
    cut: { sheet: 'a', box: [1087, 135, 1421, 426], head: [1280, 194] },
    follow: { sheet: 'a', box: [76, 576, 348, 860], head: [200, 640] },
    guard: { sheet: 'a', box: [475, 554, 673, 860], head: [576, 640] },
    recoil: { sheet: 'a', box: [781, 560, 1065, 841], head: [1016, 616, 100] },
    recovery: { sheet: 'a', box: [1139, 592, 1401, 860], head: [1256, 660] },
    gather: { sheet: 'd', box: [68, 604, 343, 850], head: [114, 660, 60] },
    raise: { sheet: 'b', box: [415, 56, 634, 439], head: [500, 186] },
    cleave: { sheet: 'b', box: [681, 199, 1076, 443], head: [854, 266, 40] },
    through: { sheet: 'b', box: [1137, 203, 1418, 445], head: [1250, 266, 50] },
    stunned: { sheet: 'b', box: [121, 547, 280, 840], head: [170, 612, 70] },
    fall: { sheet: 'b', box: [392, 618, 657, 862], head: [470, 676, 60] },
    kneel: { sheet: 'b', box: [730, 664, 1053, 869], head: [840, 726, 50] },
    ground: { sheet: 'b', box: [1177, 776, 1473, 887], head: [1210, 812, 0] },
    offPrep: { sheet: 'c', box: [69, 109, 357, 406], head: [160, 192] },
    offSurge: { sheet: 'c', box: [462, 145, 745, 406], head: [510, 202, 60] },
    offHit: { sheet: 'd', box: [834, 136, 1113, 413], head: [880, 190, 40] },
    offBack: { sheet: 'c', box: [1170, 109, 1447, 406], head: [1310, 192] },
    defPrep: { sheet: 'c', box: [102, 567, 301, 865], head: [170, 642] },
    def: { sheet: 'c', box: [458, 586, 683, 865], head: [570, 642] },
    defBack: { sheet: 'c', box: [799, 567, 1064, 865], head: [960, 642] },
    victory: { sheet: 'c', box: [1244, 468, 1422, 870], head: [1310, 612], hair: 142 },
  },
});
