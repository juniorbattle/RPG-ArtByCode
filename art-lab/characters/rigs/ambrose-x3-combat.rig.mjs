// Rig of ambrose-x3-combat (CANDIDATE, never in production without the operator's approval): Brother Ambrose's combat sheet at x3, in the arena's cells (journal Passe GA1; the operator's
// L2-11 « Ces trois figures, une tâche à part après la fusion », journal Passe EVL4: panel 4 of the G1 casting sheet, the lantern-bearer; his staff from the panel, his lantern at his belt, X4;
// X5 « Une tâche de 5 $ par combattant »; CX-S1 « Même recette »). The chain is lib/combat.mjs, on 5 generated pose sheets (NON-CANONICAL until the operator's lot sheet) drawn from the clean
// figure ambrose-clear-2026-11-07 on a flat green ground, on the palette of his town sheet with a steel ramp. A generic fighter fights on Cassius's profile (src/narrative/generics.ts): 34
// frames of the § 14 list, his clips (guard and dodge: V2_FOES.cassius). The rally comes from sheet e: sheet d drew it facing the viewer. Each sheet's pitch from a standing figure.
// Sheet f retakes, after the blind critique: the stunned and knocked-out figures with his staff at its full length, the dodge with his lantern at his belt.
//   node tools/art-lab/build-combat.mjs art-lab/characters/rigs/ambrose-x3-combat.rig.mjs [--check]
import { rivalRig, STEEL_RAMP } from './lib/combat.mjs';

const src = (n) => `art-lab/characters/reference/sources/ambrose-combat-x3-2026-11-07-${n}.png`;
export const { id, frame, clips, PALETTE, EXTRA, SHEETS, FIGURES, figures, placement, frames } = rivalRig({
  id: 'ambrose-x3-combat', height: 126, extra: STEEL_RAMP, soles: true,
  palette: { path: 'art-lab/characters/exports/ambrose-x2-v1.png', sha256: '48505e8b4d384168788cc7207c2fd7d0931908b3572ea349a01c47474c3e2566' },
  sheets: {
    a: { path: src('a'), sha256: 'cd47710e6aabb928afba3aa98cd14a41fd473628d814fde5802a022e39af4baf', stand: 324 },
    b: { path: src('b'), sha256: '18f34c3c568ddac212f60e81e7d2050f58247f03f93179e8ad2c4e017f2461bc', stand: 324 },
    c: { path: src('c'), sha256: 'ec272be349c2ef298107aec31661c0a981690f6b5a293088acca3d0d92ff2028', stand: 292 },
    d: { path: src('d'), sha256: '731d4a255f2fa9efc290f419b7a8f4507e597680dedd95770f4e567e9967c043', stand: 365 },
    e: { path: src('e'), sha256: 'd519366544675982c4e79423489b7d828996c201f06299c48bac5c889e8be8c8', stand: 545 },
    f: { path: src('f'), sha256: '9596aeb7a8dd17ecf8a8b6927b678c89d6237c761678c08a4469675b9308922c', stand: 345 },
  },
  figures: {
    idle: { sheet: 'a', box: [31, 83, 318, 425] },
    ready: { sheet: 'a', box: [343, 102, 710, 424] },
    windup: { sheet: 'a', box: [804, 67, 1093, 423] },
    cut: { sheet: 'a', box: [1079, 97, 1474, 423] },
    follow: { sheet: 'a', box: [15, 561, 358, 882] },
    guard: { sheet: 'a', box: [452, 500, 698, 882] },
    recoil: { sheet: 'a', box: [744, 549, 1100, 881] },
    recovery: { sheet: 'a', box: [1109, 582, 1457, 882] },
    gather: { sheet: 'b', box: [88, 226, 377, 461] },
    raise: { sheet: 'b', box: [418, 48, 706, 461] },
    cleave: { sheet: 'b', box: [672, 212, 1111, 461] },
    through: { sheet: 'b', box: [1123, 245, 1496, 463] },
    stunned: { sheet: 'f', box: [74, 73, 281, 468] },
    fall: { sheet: 'f', box: [372, 144, 603, 478] },
    kneel: { sheet: 'f', box: [617, 294, 1003, 476] },
    ground: { sheet: 'f', box: [1045, 362, 1489, 482] },
    offPrep: { sheet: 'c', box: [68, 111, 378, 439] },
    offSurge: { sheet: 'c', box: [390, 132, 734, 436] },
    offHit: { sheet: 'c', box: [731, 151, 1175, 437] },
    offBack: { sheet: 'c', box: [1222, 135, 1471, 444] },
    defPrep: { sheet: 'c', box: [67, 582, 339, 878] },
    def: { sheet: 'c', box: [385, 612, 764, 878] },
    defBack: { sheet: 'c', box: [781, 591, 1107, 878] },
    victory: { sheet: 'c', box: [1239, 448, 1459, 887] },
    supPrep: { sheet: 'd', box: [203, 44, 445, 457] },
    sup: { sheet: 'e', box: [94, 144, 462, 806] },
    supBack: { sheet: 'd', box: [1144, 44, 1376, 458] },
    hop: { sheet: 'f', box: [135, 571, 543, 889] },
    land: { sheet: 'f', box: [598, 625, 976, 893] },
  },
});
