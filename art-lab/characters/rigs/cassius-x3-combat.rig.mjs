// Rig of cassius-x3-combat (LAB, not approved, never in production without the operator's approval): Cassius Dree's combat sheet at x3, in the arena's cells (journal Passe CX3; the casting's decisions
// R-cassius « G2 n° 06 Rival », X1, X2, X4 « Planche, puis texte pour Vessa, Ilse et Tobin »: his long sword, from the sheet, X5, CX-S1 « Même recette »). The chain is lib/combat.mjs, on 4 generated pose sheets (NON-CANONICAL until the
// operator's lot sheet) drawn from the casting's clean figure casting-clear-2026-11-01-a on a flat green ground, on the palette of the approved town sheet with a steel ramp. 34 frames of the § 14 list: every family, the guard and the dodge (V2_FOES.cassius).
//   node tools/art-lab/build-combat.mjs art-lab/characters/rigs/cassius-x3-combat.rig.mjs [--check]
import { rivalRig, STEEL_RAMP } from './lib/combat.mjs';

const src = (n) => `art-lab/characters/reference/sources/cassius-combat-x3-2026-11-01-${n}.png`;
export const { id, frame, clips, PALETTE, EXTRA, SHEETS, FIGURES, figures, placement, frames } = rivalRig({
  id: 'cassius-x3-combat', height: 128, head: { s: 1.15, r: 46, blade: true }, extra: STEEL_RAMP, soles: true,
  palette: { path: 'art-lab/characters/exports/cassius-x2-v2.png', sha256: 'f24845f974ba0c4135aa560339707744690d7a112295af913f1c060e98a8c4b1' },
  sheets: {
    a: { path: src('a'), sha256: '49d236d2c730fa4827d1f96666ec340a163eca4437e9484a769fcf44ddc07540', stand: 287 },
    b: { path: src('b'), sha256: 'bdd4c721b8c7cddf937d5d0b5314197fa710db4f3f7bfed0766f46330805bc6a', stand: 287 },
    c: { path: src('c'), sha256: '3bdce212283f443d832fedad64189aa5474b3a53eddae13e369642b28a1723ad', stand: 287 },
    d: { path: src('d'), sha256: '4b2314ba7fcf02b245f94af849fcfa5567955648110c2a454f5504174055d17c', stand: 265 },
    e: { path: src('e'), sha256: 'dd6e18eadeed25aa2ae354dccbaf4f28e815196720ddc59350d121dd8b19b786', stand: 290 },
  },
  figures: {
    idle: { sheet: 'a', box: [63, 143, 300, 430], head: [219, 195] },
    ready: { sheet: 'a', box: [414, 166, 693, 432], head: [584, 215] },
    windup: { sheet: 'e', box: [361,544,631,896], head: [464, 650] },
    cut: { sheet: 'a', box: [1079, 172, 1455, 430], head: [1305, 219] },
    follow: { sheet: 'a', box: [41, 570, 326, 833], head: [184, 620] },
    guard: { sheet: 'a', box: [495, 517, 663, 835], head: [573, 620] },
    recoil: { sheet: 'a', box: [735, 554, 1043, 828], head: [997, 604, 100] },
    recovery: { sheet: 'a', box: [1123, 580, 1429, 833], head: [1270, 635] },
    gather: { sheet: 'b', box: [67, 211, 361, 418], head: [106, 256, 60], hips: 178 },
    raise: { sheet: 'b', box: [442, 75, 647, 418], head: [539, 205] },
    cleave: { sheet: 'b', box: [684, 201, 1085, 420], head: [891, 246, 40] },
    through: { sheet: 'b', box: [1138, 214, 1419, 420], head: [1270, 250, 50] },
    stunned: { sheet: 'b', box: [70, 559, 241, 823], head: [127, 604, 70] },
    fall: { sheet: 'b', box: [414, 617, 620, 823], head: [471, 659, 60] },
    kneel: { sheet: 'b', box: [749, 645, 1042, 823], head: [860, 686, 50] },
    ground: { sheet: 'b', box: [1138, 740, 1467, 830], head: [1188, 778, 0] },
    offPrep: { sheet: 'c', box: [83, 98, 309, 404], head: [195, 137] },
    offSurge: { sheet: 'c', box: [383, 131, 697, 404], head: [567, 174] },
    offHit: { sheet: 'e', box: [183,141,663,433], head: [474, 190], trim: 16 },
    offBack: { sheet: 'c', box: [1176, 121, 1435, 419], head: [1362, 164] },
    defPrep: { sheet: 'c', box: [101, 614, 331, 881], head: [188, 655] },
    def: { sheet: 'c', box: [456, 620, 694, 882], head: [569, 655] },
    defBack: { sheet: 'c', box: [768, 609, 1093, 882], head: [946, 655] },
    victory: { sheet: 'c', box: [1239, 440, 1404, 886], head: [1317, 645], hair: 144 },
    supPrep: { sheet: 'd', box: [178, 106, 313, 405], head: [242, 178], r: 56 },
    sup: { sheet: 'e', box: [963,25,1156,433], head: [1038, 176] },
    supBack: { sheet: 'd', box: [1101, 180, 1353, 405], head: [1235, 225], r: 56 },
    hop: { sheet: 'd', box: [338, 574, 561, 834], head: [528, 614], r: 56 },
    land: { sheet: 'd', box: [912, 607, 1166, 834], head: [1061, 655], r: 56 },
  },
});
