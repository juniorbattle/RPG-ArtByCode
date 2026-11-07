// Rig of kell-x3-combat (CANDIDATE, never in production without the operator's approval): Kell Barrow's combat sheet at x3, in the arena's cells (journal Passe GA3; the operator's
// GA-P3 « Oui, ainsi » and GA-P4 « Une tâche à part, après celle-ci », journal Passe GA2: n° 14, the martial artist of the tournament casting sheet a, bare-handed; X5 « Une tâche de
// 5 $ par combattant »; CX-S1 « Même recette »). The chain is lib/combat.mjs, on 4 generated pose sheets (NON-CANONICAL until the operator's lot sheet) drawn from the clean figure
// kell-clear-2026-11-07 on a flat green ground, on the palette of his town sheet (no steel: no weapon). A generic fighter, he fights on Tobin's profile (src/narrative/generics.ts): 23 frames
// of the § 14 list, his clips (no guard, no dodge, no defensive skill: V2_FOES.tobin), every blow a fist. Each sheet's pitch from a standing figure's height from the soles to the top of
// the hair (the sheets are not drawn at one scale). Sheet d retakes, after the blind critique: the heavy blow's raise (the fists drawn back like a club, the head up), its end standing (sheet b drew him kneeling, read as a knock-down) and his rally's preparation (the fists at the hips, not the hands on the head).
//   node tools/art-lab/build-combat.mjs art-lab/characters/rigs/kell-x3-combat.rig.mjs [--check]
import { rivalRig } from './lib/combat.mjs';

const src = (n) => `art-lab/characters/reference/sources/kell-combat-x3-2026-11-07-${n}.png`;
export const { id, frame, clips, PALETTE, EXTRA, SHEETS, FIGURES, figures, placement, frames } = rivalRig({
  id: 'kell-x3-combat', height: 128, soles: true,
  palette: { path: 'art-lab/characters/exports/kell-x2-v1.png', sha256: '6bcd4d727ad6c7a6165993eccf66841c731ee70d7cb8a43222144e8df20399ce' },
  sheets: {
    a: { path: src('a'), sha256: '48a73b9e15feb566486077f1394feb081dcb25a82b2dfdabdc91cfe76a660225', stand: 309 },
    b: { path: src('b'), sha256: '03f0efd51af12d5208470f203219d550e4840d1114a904cb9b21853964cf8de3', stand: 330 },
    c: { path: src('c'), sha256: 'd84c7f9114238489ed835a6368f744bbaaf384e23ee8cbd2d8e1b21819e55470', stand: 320 },
    d: { path: src('d'), sha256: '076500a64c3797da0dbe72a5b6d48c44b01caebf57a0a32b43a551d74269e143', stand: 345 },
  },
  figures: {
    idle: { sheet: 'a', box: [143, 119, 284, 448] },
    ready: { sheet: 'a', box: [427, 137, 649, 448] },
    windup: { sheet: 'a', box: [804, 128, 1026, 448] },
    cut: { sheet: 'a', box: [1144, 126, 1410, 448] },
    follow: { sheet: 'a', box: [192, 526, 410, 843] },
    recoil: { sheet: 'a', box: [561, 536, 812, 843] },
    recovery: { sheet: 'a', box: [1008, 537, 1230, 843] },
    gather: { sheet: 'b', box: [130, 183, 323, 459] },
    raise: { sheet: 'd', box: [190, 64, 406, 428] },
    cleave: { sheet: 'b', box: [729, 178, 1062, 459] },
    through: { sheet: 'd', box: [588, 135, 877, 428] },
    stunned: { sheet: 'b', box: [130, 556, 287, 886] },
    fall: { sheet: 'b', box: [416, 586, 642, 885] },
    kneel: { sheet: 'b', box: [751, 682, 1003, 885] },
    ground: { sheet: 'b', box: [1078, 794, 1456, 887] },
    offPrep: { sheet: 'c', box: [114, 111, 346, 421] },
    offSurge: { sheet: 'c', box: [468, 115, 714, 421] },
    offHit: { sheet: 'c', box: [786, 114, 1100, 421] },
    offBack: { sheet: 'c', box: [1215, 115, 1429, 421] },
    supPrep: { sheet: 'd', box: [183, 530, 356, 892] },
    sup: { sheet: 'c', box: [453, 532, 655, 871] },
    supBack: { sheet: 'c', box: [844, 535, 1037, 871] },
    victory: { sheet: 'c', box: [1207, 471, 1393, 871] },
  },
});
