// Rig of tobin-x3-combat (LAB, not approved, never in production without the operator's approval): Tobin Fenn's combat sheet at x3, in the arena's cells (journal Passe CX3; the casting's decisions
// R-tobin « G2 n° 01 Cedric », X1, X2, X4 « Planche, puis texte pour Vessa, Ilse et Tobin »: his worn short sword, from the text, X5, CX-S1 « Même recette »). The chain is lib/combat.mjs, on 3 generated pose sheets (NON-CANONICAL until the
// operator's lot sheet) drawn from the casting's clean figure casting-clear-2026-11-01-d on a flat green ground, on the palette of the approved town sheet with a steel ramp. 27 frames of the § 14 list: no guard, no dodge, no defensive skill (V2_FOES.tobin).
//   node tools/art-lab/build-combat.mjs art-lab/characters/rigs/tobin-x3-combat.rig.mjs [--check]
import { rivalRig, STEEL_RAMP } from './lib/combat.mjs';

const src = (n) => `art-lab/characters/reference/sources/tobin-combat-x3-2026-11-01-${n}.png`;
export const { id, frame, clips, PALETTE, EXTRA, SHEETS, FIGURES, figures, placement, frames } = rivalRig({
  id: 'tobin-x3-combat', height: 131, head: { s: 1.15, r: 46, blade: true }, extra: STEEL_RAMP, soles: true,
  palette: { path: 'art-lab/characters/exports/tobin-x2-v2.png', sha256: '151d7504936dcf9c80c020659c8787db98d91435bb3b804f2fcf46182aa576e8' },
  sheets: {
    a: { path: src('a'), sha256: '975ce3ecebd847ed4ee84179db0640626aa96c3500cf35cb3598fbf017e9f4de', stand: 266 },
    b: { path: src('b'), sha256: '86a8ced0d5750af49b08442abb49dd497fec12657cd6b03ae057c8c86eceb23a', stand: 266 },
    c: { path: src('c'), sha256: 'dffeb7eb85905e4f9d695fef0c532571305de4119d317ff43a6a8d6b6273c677', stand: 292 },
    d: { path: src('d'), sha256: '88abb04ca80907a3c0deacd116ed2292a8bc3091858eee5c248afeb99055e14e', stand: 366 },
  },
  figures: {
    idle: { sheet: 'a', box: [93, 163, 295, 427], head: [216, 216] },
    ready: { sheet: 'a', box: [442, 171, 653, 427], head: [544, 220] },
    windup: { sheet: 'a', box: [821, 153, 1032, 426], head: [900, 210] },
    cut: { sheet: 'a', box: [1114, 175, 1407, 426], head: [1270, 224] },
    follow: { sheet: 'a', box: [88, 571, 320, 814], head: [184, 620] },
    recoil: { sheet: 'a', box: [557, 552, 863, 817], head: [810, 600, 100] },
    recovery: { sheet: 'a', box: [1061, 579, 1285, 818], head: [1150, 630] },
    gather: { sheet: 'b', box: [132, 214, 378, 431], head: [176, 266, 60], hips: 185 },
    raise: { sheet: 'b', box: [458, 72, 649, 431], head: [550, 196] },
    cleave: { sheet: 'b', box: [686, 226, 1069, 431], head: [870, 276, 40], trim: 5 },
    through: { sheet: 'b', box: [1113, 228, 1374, 431], head: [1230, 276, 50] },
    stunned: { sheet: 'b', box: [139, 568, 281, 839], head: [180, 620, 70] },
    fall: { sheet: 'b', box: [430, 646, 623, 842], head: [504, 692, 60] },
    kneel: { sheet: 'b', box: [799, 681, 1016, 844], head: [844, 726, 50] },
    ground: { sheet: 'b', box: [1109, 768, 1452, 848], head: [1190, 806, 0] },
    offPrep: { sheet: 'c', box: [148, 126, 339, 398], head: [210, 176] },
    offSurge: { sheet: 'c', box: [457, 136, 695, 399], head: [540, 182] },
    offHit: { sheet: 'd', box: [164,84,646,415], head: [456, 142] },
    offBack: { sheet: 'c', box: [1177, 137, 1418, 402], head: [1296, 182] },
    victory: { sheet: 'c', box: [153, 468, 306, 854], head: [244, 612], hair: 141 },
    supPrep: { sheet: 'd', box: [949,83,1255,415], head: [1096, 148] },
    sup: { sheet: 'd', box: [233,521,595,885], head: [450, 592] },
    supBack: { sheet: 'c', box: [1184, 575, 1411, 854], head: [1320, 622] },
  },
});
