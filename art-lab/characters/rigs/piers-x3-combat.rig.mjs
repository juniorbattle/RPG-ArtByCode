// Rig of piers-x3-combat (CANDIDATE, never in production without the operator's approval): Piers Calloway's combat sheet at x3, in the arena's cells (journal Passe GA3; the operator's
// GA-P2 « Oui, ainsi » and GA-P4 « Une tâche à part, après celle-ci », journal Passe GA2: n° 09, the spear champion of the tournament casting sheet a; his spear from the text, X4; X5 « Une tâche de
// 5 $ par combattant »; CX-S1 « Même recette »). The chain is lib/combat.mjs, on 6 generated pose sheets (NON-CANONICAL until the operator's lot sheet) drawn from the clean figure
// piers-clear-2026-11-07 on a flat green ground, on the palette of his town sheet with a steel ramp. A generic fighter, he fights on Vessa's profile (src/narrative/generics.ts): 29 frames of
// the § 14 list, her clips (guard, dodge, three skills: V2_FOES.vessa). Each sheet's pitch from a standing figure's height from the soles to the top of the hair (the sheets are not drawn at
// one scale); his standing height 123, after the blind critique (118, Vessa's, left him 5 % under his town sheet): the lunge's coat and spear take most of the cell's width.
// Sheet e retakes, after the blind critique: Tempo's preparation and return and the dodge's landing with the spear up (sheet d held it level: read as attacks), the hit's recovery, and the knock-out with the spear at a slant (flat under him, a straight edge).
// Sheet f, after the re-check: the ready stance, the dodge's push-off and the victory with the spear nearer his idle's length, and the knock-out with the spear lying behind him (its butt beyond the boots masked: the cell's width).
//   node tools/art-lab/build-combat.mjs art-lab/characters/rigs/piers-x3-combat.rig.mjs [--check]
import { rivalRig, STEEL_RAMP } from './lib/combat.mjs';

const src = (n) => `art-lab/characters/reference/sources/piers-combat-x3-2026-11-07-${n}.png`;
export const { id, frame, clips, PALETTE, EXTRA, SHEETS, FIGURES, figures, placement, frames } = rivalRig({
  id: 'piers-x3-combat', height: 123, extra: STEEL_RAMP, soles: true,
  palette: { path: 'art-lab/characters/exports/piers-x2-v1.png', sha256: '22ecc4b6f601512f32e69f9cdfcaf4488d5c81b9983731900a19af96d97dca74' },
  sheets: {
    a: { path: src('a'), sha256: 'eedbac4544a50ca7900c2a3a5e6211aa7797ed27441a0c61f14b88a58105c99c', stand: 270 },
    b: { path: src('b'), sha256: '211a744c869f827be5540dac146d2c1b268a2ef3b8d7b87ea1de130eb234ef5d', stand: 292 },
    c: { path: src('c'), sha256: 'a6d502edbc7bd68767426c4dc1984d9c5663a28bd3ad7695fb30776cce9fb05e', stand: 261 },
    d: { path: src('d'), sha256: '717af3b810244e1933dffe99e196803db8172e6d48ad4512c2505713153dbb6b', stand: 300 },
    e: { path: src('e'), sha256: 'c42aa6c24f079af6d435d0574f17b17f086547441f8eee6e69d369c219f70d11', stand: 305 },
    f: { path: src('f'), sha256: '97a53373d9bdde5f1e3e0208f885d76b0d39912018be466f484f2504e2ebb038', stand: 274 },
  },
  figures: {
    idle: { sheet: 'a', box: [14, 146, 309, 436] },
    ready: { sheet: 'f', box: [160, 148, 473, 456] },
    windup: { sheet: 'a', box: [772, 120, 1079, 434] },
    cut: { sheet: 'a', box: [1055, 174, 1426, 434] },
    follow: { sheet: 'a', box: [15, 576, 328, 851] },
    guard: { sheet: 'a', box: [476, 526, 669, 851] },
    recoil: { sheet: 'a', box: [715, 582, 1083, 855] },
    recovery: { sheet: 'e', box: [337, 524, 569, 901] },
    gather: { sheet: 'b', box: [92, 195, 444, 415] },
    raise: { sheet: 'b', box: [458, 51, 737, 416] },
    cleave: { sheet: 'b', box: [712, 198, 1144, 416] },
    through: { sheet: 'b', box: [1146, 213, 1491, 416] },
    stunned: { sheet: 'b', box: [80, 480, 247, 857] },
    fall: { sheet: 'b', box: [372, 615, 662, 865] },
    kneel: { sheet: 'b', box: [685, 701, 1067, 861] },
    ground: { sheet: 'f', box: [860, 733, 1322, 847], mask: [[1274, 790, 1322, 845]] },
    offPrep: { sheet: 'c', box: [28, 161, 313, 411] },
    offSurge: { sheet: 'c', box: [364, 175, 705, 410] },
    offHit: { sheet: 'c', box: [721, 180, 1141, 411] },
    offBack: { sheet: 'c', box: [1199, 165, 1504, 415] },
    defPrep: { sheet: 'c', box: [25, 584, 330, 832] },
    def: { sheet: 'c', box: [386, 594, 716, 834] },
    defBack: { sheet: 'c', box: [796, 590, 1102, 836] },
    victory: { sheet: 'f', box: [1125, 46, 1294, 458] },
    supPrep: { sheet: 'e', box: [256, 54, 423, 466] },
    sup: { sheet: 'd', box: [647, 53, 848, 446] },
    supBack: { sheet: 'e', box: [579, 97, 868, 466] },
    hop: { sheet: 'f', box: [597, 145, 906, 458] },
    land: { sheet: 'e', box: [1010, 127, 1353, 466] },
  },
});
