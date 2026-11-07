// Rig of corra-x3-combat (CANDIDATE, never in production without the operator's approval): Corra Dunmere's combat sheet at x3, in the arena's cells (journal Passe GA1; the operator's
// L2-11 « Ces trois figures, une tâche à part après la fusion », journal Passe EVL4: panel 2 of the G1 casting sheet, the lady with the staff; her staff from the panel, X4; X5 « Une tâche de
// 5 $ par combattant »; CX-S1 « Même recette »). The chain is lib/combat.mjs, on 3 generated pose sheets (NON-CANONICAL until the operator's lot sheet) drawn from the clean figure
// corra-clear-2026-11-07 on a flat green ground, on the palette of her town sheet with a steel ramp. A generic fighter fights on Orla's profile (src/narrative/generics.ts): 29 frames of
// the § 14 list, her clips (no dodge, no support skill: V2_FOES.orla). Each sheet's pitch from a standing figure's height from the soles to the ribbon (the sheets are not drawn at one scale).
//   node tools/art-lab/build-combat.mjs art-lab/characters/rigs/corra-x3-combat.rig.mjs [--check]
import { rivalRig, STEEL_RAMP } from './lib/combat.mjs';

const src = (n) => `art-lab/characters/reference/sources/corra-combat-x3-2026-11-07-${n}.png`;
export const { id, frame, clips, PALETTE, EXTRA, SHEETS, FIGURES, figures, placement, frames } = rivalRig({
  id: 'corra-x3-combat', height: 125, extra: STEEL_RAMP, soles: true,
  palette: { path: 'art-lab/characters/exports/corra-x2-v1.png', sha256: 'faa6fa92ef41f4fb33c0f0373daa691a379bb533d453a4dd031366c30db13e46' },
  sheets: {
    a: { path: src('a'), sha256: '70a3fb4070deca2f19fe7b23575a90fa685a8f5eec004c63af3dcd343502fe5a', stand: 310 },
    b: { path: src('b'), sha256: '4b904bbbc0c39f144734ba315bcfb0b821d45ea376595b63fef74283baaad8b2', stand: 330 },
    c: { path: src('c'), sha256: 'ee2bfdcfc5f5fdd8c423a10f417d5d2b9281a4564bc9904f60450d6c69fba641', stand: 300 },
  },
  figures: {
    idle: { sheet: 'a', box: [33, 110, 326, 435] },
    ready: { sheet: 'a', box: [372, 118, 711, 435] },
    windup: { sheet: 'a', box: [834, 71, 1135, 432], mask: [[1060, 225, 1180, 290]] },
    cut: { sheet: 'a', box: [1054, 134, 1465, 435], mask: [[1040, 60, 1140, 150]] },
    follow: { sheet: 'a', box: [21, 572, 369, 873] },
    guard: { sheet: 'a', box: [491, 521, 701, 877] },
    recoil: { sheet: 'a', box: [755, 560, 1125, 867] },
    recovery: { sheet: 'a', box: [1125, 581, 1470, 877] },
    gather: { sheet: 'b', box: [70, 222, 367, 473] },
    raise: { sheet: 'b', box: [398, 61, 647, 466] },
    cleave: { sheet: 'b', box: [650, 224, 1086, 469] },
    through: { sheet: 'b', box: [1077, 250, 1456, 475] },
    stunned: { sheet: 'b', box: [54, 537, 272, 883] },
    fall: { sheet: 'b', box: [365, 608, 639, 886] },
    kneel: { sheet: 'b', box: [671, 701, 1047, 897] },
    ground: { sheet: 'b', box: [1105, 785, 1485, 907] },
    offPrep: { sheet: 'c', box: [84, 121, 336, 408] },
    offSurge: { sheet: 'c', box: [405, 142, 729, 403] },
    offHit: { sheet: 'c', box: [789, 158, 1112, 407] },
    offBack: { sheet: 'c', box: [1125, 105, 1439, 405] },
    defPrep: { sheet: 'c', box: [40, 567, 361, 863] },
    def: { sheet: 'c', box: [390, 596, 750, 861] },
    defBack: { sheet: 'c', box: [761, 568, 1089, 863] },
    victory: { sheet: 'c', box: [1201, 426, 1373, 864] },
  },
});
