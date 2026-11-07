// Rig of aldric-x3-combat (CANDIDATE, never in production without the operator's approval): Ser Aldric Venn's combat sheet at x3, in the arena's cells (journal Passe GA1; the operator's
// L2-11 « Ces trois figures, une tâche à part après la fusion », journal Passe EVL4: the knight n° 07 of the main characters' casting sheet; his longsword from the text, X4; X5 « Une tâche de
// 5 $ par combattant »; CX-S1 « Même recette »). The chain is lib/combat.mjs, on 4 generated pose sheets (NON-CANONICAL until the operator's lot sheet) drawn from the clean figure
// aldric-clear-2026-11-07 on a flat green ground, on the palette of his town sheet with a steel ramp. A generic fighter fights on Ilse's profile (src/narrative/generics.ts): 32 frames of
// the § 14 list, her clips (no dodge: V2_FOES.ilse).
//   node tools/art-lab/build-combat.mjs art-lab/characters/rigs/aldric-x3-combat.rig.mjs [--check]
import { rivalRig, STEEL_RAMP } from './lib/combat.mjs';

const src = (n) => `art-lab/characters/reference/sources/aldric-combat-x3-2026-11-07-${n}.png`;
export const { id, frame, clips, PALETTE, EXTRA, SHEETS, FIGURES, figures, placement, frames } = rivalRig({
  id: 'aldric-x3-combat', height: 132, extra: STEEL_RAMP, soles: true,
  palette: { path: 'art-lab/characters/exports/aldric-x2-v1.png', sha256: 'e8d3f128d4054044b9941a865cca1e2799a2700b3fbb4291339f1998fdfb8bd9' },
  sheets: {
    a: { path: src('a'), sha256: '1929d64e19a55a367ab5b5f48c78b5c0cf5f45db37dee1e9081d78ef25f06b8d', stand: 328 },
    b: { path: src('b'), sha256: '4e6c6dd2c6181742bcf80fc749e693e7a4fc929314330afeee030c4b3703ed2c', stand: 328 },
    c: { path: src('c'), sha256: 'f316ef24f8a72402e6e08a15582d63b03353bc7e9b4dd162142dc380f65a083d', stand: 316 },
    d: { path: src('d'), sha256: '8a71064b215c24e0f38249402ea546f308c0c761f7c6b43e3ad486e154f172b1', stand: 500 },
  },
  figures: {
    idle: { sheet: 'a', box: [54, 65, 326, 410] },
    ready: { sheet: 'a', box: [414, 88, 697, 410] },
    windup: { sheet: 'a', box: [815, 73, 1090, 410] },
    cut: { sheet: 'a', box: [1067, 95, 1468, 410] },
    follow: { sheet: 'a', box: [36, 520, 345, 846] },
    guard: { sheet: 'a', box: [464, 504, 695, 855] },
    recoil: { sheet: 'a', box: [742, 543, 1073, 855] },
    recovery: { sheet: 'a', box: [1131, 546, 1455, 855] },
    gather: { sheet: 'b', box: [85, 157, 368, 420] },
    raise: { sheet: 'b', box: [447, 39, 721, 424] },
    cleave: { sheet: 'b', box: [671, 173, 1092, 427] },
    through: { sheet: 'b', box: [1117, 188, 1422, 428] },
    stunned: { sheet: 'b', box: [91, 546, 286, 846] },
    fall: { sheet: 'b', box: [388, 606, 656, 849] },
    kneel: { sheet: 'b', box: [687, 662, 1051, 850] },
    ground: { sheet: 'b', box: [1107, 734, 1461, 862] },
    offPrep: { sheet: 'c', box: [147, 76, 308, 453] },
    offSurge: { sheet: 'c', box: [442, 8, 722, 453] },
    offHit: { sheet: 'c', box: [718, 174, 1108, 454] },
    offBack: { sheet: 'c', box: [1197, 83, 1421, 453] },
    defPrep: { sheet: 'c', box: [118, 603, 311, 915] },
    def: { sheet: 'c', box: [456, 586, 657, 915] },
    defBack: { sheet: 'c', box: [767, 598, 1136, 915] },
    victory: { sheet: 'c', box: [1242, 457, 1392, 915] },
    supPrep: { sheet: 'd', box: [178, 224, 417, 743] },
    sup: { sheet: 'd', box: [594, 224, 927, 744] },
    supBack: { sheet: 'd', box: [1079, 236, 1424, 744] },
  },
});
