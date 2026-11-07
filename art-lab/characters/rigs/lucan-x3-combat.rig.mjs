// Rig of lucan-x3-combat (CANDIDATE, never in production without the operator's approval): Lucan Rook's combat sheet at x3, in the arena's cells (journal Passe GA3; the operator's
// GA-P1 « Oui, ainsi » and GA-P4 « Une tâche à part, après celle-ci », journal Passe GA2: n° 08, the swordmaster of the tournament casting sheet a; his longsword from the text, X4; X5 « Une
// tâche de 5 $ par combattant »; CX-S1 « Même recette »). The chain is lib/combat.mjs, on 7 generated pose sheets (NON-CANONICAL until the operator's lot sheet) drawn from the clean
// figure lucan-clear-2026-11-07 on a flat green ground, on the palette of his town sheet with a steel ramp. A generic fighter, he fights on Marek's profile (src/narrative/generics.ts):
// 27 frames of the § 14 list, his clips (guard, three skills, no dodge: V2_FOES.marek). Each sheet's pitch from a standing figure's height from the soles to the top of the hair (the sheets
// are not drawn at one scale). Sheet e retakes Iron Gate in the side view (sheet c drew its ward facing the viewer); sheet f, after the blind critique: the hit (sheet a's sword pointed at the opponent, read as a thrust), its recovery, the heavy raise with the face clear, the stunned and the victory with the sword at its full length.
// Sheet g, after the re-check: the hit's second frame upright, staggering back with the sword up (sheet f's crouch read as the heavy attack's gather).
//   node tools/art-lab/build-combat.mjs art-lab/characters/rigs/lucan-x3-combat.rig.mjs [--check]
import { rivalRig, STEEL_RAMP } from './lib/combat.mjs';

const src = (n) => `art-lab/characters/reference/sources/lucan-combat-x3-2026-11-07-${n}.png`;
export const { id, frame, clips, PALETTE, EXTRA, SHEETS, FIGURES, figures, placement, frames } = rivalRig({
  id: 'lucan-x3-combat', height: 125, extra: STEEL_RAMP, soles: true,
  palette: { path: 'art-lab/characters/exports/lucan-x2-v1.png', sha256: '9d5f40f181980b237a0560d8de267d171ca77a14d03abdf6dc1ec7758b3e06f3' },
  sheets: {
    a: { path: src('a'), sha256: '51ddeb7345e4266700ca37e048f61ae69fabfbe44581b611f440bd2beb8263d7', stand: 292 },
    b: { path: src('b'), sha256: 'b897a89804429d145729808bad8d3ae5dd511c6121c5f6705a8fd4c715b2ebbc', stand: 305 },
    c: { path: src('c'), sha256: '374be5d8bcb5247d549ae5ea14d59dd9018ad944fec08ebebabcb52ad1f301c5', stand: 290 },
    d: { path: src('d'), sha256: 'd79e4bd8d306ee69881776051eee0f114d5016602c378ada39cb7a4825170be5', stand: 420 },
    e: { path: src('e'), sha256: '6b628d5a7f2a18df27cebb1d3ba89749b26b0f32d4ac1db5e528876a1513b2bc', stand: 350 },
    f: { path: src('f'), sha256: 'c901f6768f62a5b938c515b16ca829c50ed7b517aab5b0b5525f0e66f5244a6e', stand: 291 },
    g: { path: src('g'), sha256: '9d2339ce9aef7351a98f9e2644b5d78838de65d4139f5994301f352a0c280883', stand: 455 },
  },
  figures: {
    idle: { sheet: 'a', box: [93, 106, 349, 418] },
    ready: { sheet: 'a', box: [416, 115, 718, 418] },
    windup: { sheet: 'a', box: [846, 78, 1055, 418] },
    cut: { sheet: 'a', box: [1038, 144, 1437, 418] },
    follow: { sheet: 'a', box: [51, 577, 369, 854] },
    guard: { sheet: 'a', box: [480, 504, 688, 854] },
    recoil: { sheet: 'f', box: [195, 96, 535, 422] },
    recovery: { sheet: 'g', box: [75, 182, 502, 728] },
    gather: { sheet: 'b', box: [78, 209, 393, 448] },
    raise: { sheet: 'f', box: [1088, 49, 1332, 421] },
    cleave: { sheet: 'b', box: [622, 190, 1063, 451] },
    through: { sheet: 'b', box: [1063, 204, 1426, 454] },
    stunned: { sheet: 'f', box: [388, 603, 565, 905] },
    fall: { sheet: 'b', box: [368, 560, 640, 857] },
    kneel: { sheet: 'b', box: [644, 640, 1056, 860] },
    ground: { sheet: 'b', box: [1097, 738, 1482, 869] },
    offPrep: { sheet: 'c', box: [83, 68, 308, 424] },
    offSurge: { sheet: 'c', box: [441, 47, 722, 424] },
    offHit: { sheet: 'c', box: [725, 155, 1112, 424] },
    offBack: { sheet: 'c', box: [1154, 114, 1462, 424] },
    defPrep: { sheet: 'e', box: [143, 246, 425, 686] },
    def: { sheet: 'e', box: [517, 298, 993, 686] },
    defBack: { sheet: 'e', box: [1044, 338, 1429, 686] },
    victory: { sheet: 'f', box: [981, 442, 1152, 905] },
    supPrep: { sheet: 'd', box: [131, 284, 379, 717] },
    sup: { sheet: 'd', box: [582, 105, 983, 717] },
    supBack: { sheet: 'd', box: [1003, 296, 1454, 717] },
  },
});
