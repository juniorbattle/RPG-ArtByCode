// Rig of hero-x3-combat (LAB, not approved, never in production without the operator's approval): Ren's combat sheet, the production hero
// hero-x2-v4 at x3 in the arena's cells (journal Passes RC1 and RC2; the operator's decisions AA2-1 « ×3 », for its first 22 frames « Génération
// (Recommandé) » and « Clés hors C2 (Recommandé) », for the rest RC1-1 « Bonne base : compléter après la fiche C2, avec les reprises », C2-7
// « En arrière », C2-10 « Les garder »). A cell is the arena's 64 x 96 town pixels at 3 texels per pixel: 192 x 288 texels, the feet
// on row 270, the body axis (the hips) on column 96, the fighter facing LEFT (FighterArt's frames, keys `ren/side/<clip>.<i>/0`).
// Sources: eleven generated pose sheets (NON-CANONICAL, archived with their records under reference/sources/: ren-combat-x3-2026-10-25-a1, -a2,
// -b2 of Passe RC1, ren-combat-x3-2026-10-26-c1, -c2, -d1, -d2, -e1, -e2, -f2 of Passe RC2, -2026-11-01-g1 of Passe CX1), the hero's design from the v4-b turnaround and the
// v3 sheet given as references (and the RC1 sheets a2 / b2 for RC2's); the figures chosen by blind critiques (Passes RC1, RC2).
// Chain per figure: the figure alone on its sheet (the other figures painted with the background) -> reconstruct-grid.mjs at the sheet's
// own pitch (its standing figure's height over the 128 rows of hero-x3-trial's idle: every clip at the hero's x3 height) into a 384 x 288
// frame, feet on row 270 -> the sheet's grey halo peeled on the full colours -> nearest OKLab colour of hero-x2-v4's palette (pinned: no new
// colour) -> loose texels removed -> the hips put on column 96, cropped to the 192-texel cell. Then the rig: the alternate frames of the loops
// (idle, ready, victory: the inhale; recover: the exhale, head lower) by rig-engine's breath, and the guard's « encaisse » (block 1) by a
// shear of the upper body; every blade at two texels of steel and a dark edge (blade2, pinned per figure in BLADES). The 34 frames of the CB-2 list (briefs/combat-
// system.md § 14): idle 2, ready 2, strike 3, heavy 4, skillOff 4, skillDef 3, skillSup 3, block 2, dodge 2 (backward, C2-7), hit 2,
// recover 2, ko 3, victory 2 (in profile since Passe RC2); then the five charge poses of the casting's decision X3 « Ren seul, avant Marek » (journal Passe CX1): charge 2, chargeHi 2,
// chargeGuard 1. The chain lives in lib/combat.mjs since that pass.
//   node tools/art-lab/build-combat.mjs art-lab/characters/rigs/hero-x3-combat.rig.mjs [--check]
import { FRAME, STEEL, blade2, breath, despeckle, encaisse, headTop, place, reconstructFigures } from './lib/combat.mjs';

export { STEEL, blade2 };
export const id = 'hero-x3-combat';
export const frame = FRAME;
/** the clips, in the sheet's order, with their frame counts (briefs/combat-system.md § 14) */
export const clips = { idle: 2, ready: 2, strike: 3, heavy: 4, skillOff: 4, skillDef: 3, skillSup: 3, block: 2, dodge: 2, hit: 2, recover: 2, ko: 3, victory: 2, charge: 2, chargeHi: 2, chargeGuard: 1 };
export const PALETTE = { path: 'art-lab/characters/exports/hero-x2-v4.png', sha256: '06a7fab7c90ee0d83b97477c3276710bb217161c2be32b12ab4143c338c603f1' };
/** the hero's standing height at x3 (hero-x3-trial's side idle: rows 8..135) */
const HEIGHT = 128;
/** each sheet: its file, its SHA-256, the standing figure's height in sheet pixels (hair to soles) -> its pitch; c1 / c2 draw a smaller body
 *  under the same head (at the pitch of their stand, 214, the reconstructed heads came out 15 % larger than the RC1 frames', measured side by
 *  side, journal Passe RC2): their pitch splits the gap (heads 7 % larger, bodies 7 % shorter) */
export const SHEETS = {
  a1: { path: 'art-lab/characters/reference/sources/ren-combat-x3-2026-10-25-a1.png', sha256: '7455dfa020a4ec7d8a833b4785bd25deaa526675b229b6c52eca204db0d92fed', stand: 280 },
  a2: { path: 'art-lab/characters/reference/sources/ren-combat-x3-2026-10-25-a2.png', sha256: 'de039a7ecb6e3d7a48c807c925e7707a2430c9166aa4def86e32cd81e51fffbb', stand: 240 },
  b2: { path: 'art-lab/characters/reference/sources/ren-combat-x3-2026-10-25-b2.png', sha256: 'd04766360cbb835c945be9a3e8f38004c2e14cfa2b44a133eb3f65fb5cae9d76', stand: 285 },
  c1: { path: 'art-lab/characters/reference/sources/ren-combat-x3-2026-10-26-c1.png', sha256: '46c21a063f659bf10832803b24447a7eb9848981d1d064e75fa785741587b405', stand: 214, pitch: 1.797 },
  c2: { path: 'art-lab/characters/reference/sources/ren-combat-x3-2026-10-26-c2.png', sha256: 'dcdbddba587678deae68a8b155baa667aa34430e4abc052322870edee9e41f9f', stand: 214, pitch: 1.797 },
  d1: { path: 'art-lab/characters/reference/sources/ren-combat-x3-2026-10-26-d1.png', sha256: 'ac4b8b9335ceee927e3c343c7435735f5b4e22abb0317a85eb6ea40cda2e9357', stand: 313 },
  d2: { path: 'art-lab/characters/reference/sources/ren-combat-x3-2026-10-26-d2.png', sha256: '5914d20addfa19db1d78a0eec556c7dfd1ca4de4bdfb2ba6a001dba46dcae9fa', stand: 308 },
  e1: { path: 'art-lab/characters/reference/sources/ren-combat-x3-2026-10-26-e1.png', sha256: '1193d4b4efd1477c7e57bcbcab86e44827b2e839cc884a7a0ee08594487fcbd7', stand: 292 },
  e2: { path: 'art-lab/characters/reference/sources/ren-combat-x3-2026-10-26-e2.png', sha256: '2fe682c35284825f4adbd5c3c13734662913426159bfcbdac7dc73876eef5cb0', stand: 289 },
  f2: { path: 'art-lab/characters/reference/sources/ren-combat-x3-2026-10-26-f2.png', sha256: '579ce9bfe118bfc4aef8111a174387ea997a2797db3ab1801cb39f27e370d2a4', stand: 273 },
  g1: { path: 'art-lab/characters/reference/sources/ren-combat-x3-2026-11-01-g1.png', sha256: '1fb6bc61a7a5bce10d0fe4eb5a4b99e11144e9acb0b7de69767674fa1da8e23a', stand: 280 },
};
for (const s of Object.values(SHEETS)) s.pitch ??= +(s.stand / HEIGHT).toFixed(4);
/** the figures: sheet, box (sheet pixels), and for the three knockout figures the hips' column in the 384-wide reconstruction, set by eye (null =
 *  the midpoint of the two feet on the ground, FighterArt's body axis between its front and back foot) */
export const FIGURES = {
  idle: { sheet: 'a2', box: [57, 232, 232, 471], hips: null },
  ready: { sheet: 'a2', box: [284, 253, 572, 471], hips: null },
  windup: { sheet: 'a2', box: [687, 192, 851, 471], hips: null },
  thrust: { sheet: 'a2', box: [855, 263, 1193, 471], hips: null },
  cut: { sheet: 'f2', box: [102, 105, 495, 422], hips: null },
  follow: { sheet: 'a2', box: [1235, 285, 1459, 471], hips: null },
  guard: { sheet: 'a2', box: [123, 552, 267, 815], hips: null },
  recoil: { sheet: 'a2', box: [386, 611, 648, 816], hips: null },
  recovery: { sheet: 'a1', box: [715, 591, 969, 840], hips: null },
  stunned: { sheet: 'a2', box: [1207, 598, 1339, 816], hips: null },
  gather: { sheet: 'b2', box: [120, 266, 392, 490], hips: null },
  raise: { sheet: 'b2', box: [475, 168, 719, 490], hips: null },
  cleave: { sheet: 'b2', box: [778, 255, 1121, 498], hips: null },
  through: { sheet: 'b2', box: [47, 643, 353, 877], hips: null },
  fall: { sheet: 'b2', box: [490, 626, 725, 889], hips: 188 },
  kneel: { sheet: 'b2', box: [735, 708, 1084, 881], hips: 232 },
  ground: { sheet: 'b2', box: [1175, 795, 1477, 886], hips: 178 },
  lungePrep: { sheet: 'c2', box: [58, 221, 337, 408], hips: null },
  surge: { sheet: 'c2', box: [365, 217, 688, 408], hips: null },
  lungeBack: { sheet: 'c1', box: [1215, 214, 1475, 424], hips: null },
  wardPrep: { sheet: 'd2', box: [206, 77, 424, 416], hips: null },
  ward: { sheet: 'e2', box: [178, 632, 430, 886], hips: null },
  wardBack: { sheet: 'd1', box: [1022, 549, 1371, 850], hips: null },
  fervourPrep: { sheet: 'd2', box: [225, 548, 368, 859], hips: null },
  cry: { sheet: 'e2', box: [1118, 242, 1354, 510], hips: null },
  fervourBack: { sheet: 'd2', box: [1059, 543, 1334, 829], hips: null },
  hop: { sheet: 'c2', box: [429, 558, 674, 791], hips: null },
  land: { sheet: 'c1', box: [762, 575, 1058, 776], hips: null },
  victory: { sheet: 'e1', box: [572, 30, 794, 468], hips: null },
  chargeLow: { sheet: 'g1', box: [94, 228, 358, 435], hips: null },
  chargeHigh: { sheet: 'g1', box: [122, 530, 345, 828], hips: null },
  chargeGuard: { sheet: 'g1', box: [885, 580, 1033, 829], hips: null },
};
/** each figure's blade in its cell (texels): [hilt end, tip] or [hilt end, tip, generated tip] (proposed by a RANSAC over the steel texels of
 *  the placed figures, checked on overlays, journal Passe RC2); where the generated blade was the figure's lowest point (the cleave, the
 *  planted sword, the sword on the ground), its tip is pinned on the foot row: the frame keeps standing on row 270 */
export const BLADES = {
  idle: [[76, 226], [44, 268]], ready: [[68, 202], [1, 200]], windup: [[80, 164], [128, 123]], cut: [[51, 160], [2, 122]], follow: [[55, 242], [20, 269]],
  gather: [[112, 233], [166, 257]], raise: [[115, 147], [155, 195]], cleave: [[46, 232], [3, 270]], through: [[47, 246], [11, 270]],
  lungePrep: [[119, 224], [75, 245]], surge: [[64, 214], [3, 212]], thrust: [[59, 201], [2, 199]], lungeBack: [[65, 233], [7, 261]],
  wardPrep: [[77, 198], [79, 131]], ward: [[106, 165], [38, 162]], wardBack: [[55, 208], [6, 180]],
  fervourPrep: [[95, 215], [96, 270]], cry: [[74, 219], [72, 268]], fervourBack: [[64, 216], [24, 241]],
  guard: [[79, 185], [88, 130]], hop: [[90, 193], [39, 217]], land: [[72, 223], [1, 220]], recoil: [[79, 199], [24, 221]], recovery: [[75, 220], [31, 243]],
  stunned: [[81, 235], [58, 270]], fall: [[84, 237], [110, 270]], kneel: [[45, 259], [3, 270]], ground: [[82, 263], [43, 270]], victory: [[65, 127], [32, 79]],
  chargeLow: [[128, 234], [173, 259]], chargeHigh: [[100, 152], [148, 134]], chargeGuard: [[71, 205], [74, 159]],
};
/** every figure reconstructed in a 384 x 288 frame (feet on row 270, the bbox centred), on the palette: { name: image } */
export const figures = () => reconstructFigures({ id, palette: PALETTE, sheets: SHEETS, figures: FIGURES });
/** the placement report: per figure, the hips' column and how far the cell pushed the body */
export const placement = {};
const CHARGE_HIGH_HAIR = 157;
export function frames(F = figures()) {
  const P = Object.fromEntries(Object.keys(FIGURES).map((n) => { const im = place(n, F[n], FIGURES[n].hips, placement), b = BLADES[n]; return [n, b ? blade2(im, ...b) : im]; }));
  // the charge's figures: what the old blade held together falls away with it
  for (const n of ['chargeLow', 'chargeHigh', 'chargeGuard']) P[n] = despeckle(P[n], 12);
  const out = [], add = (anim, list) => list.forEach((im, i) => out.push({ anim, dir: 'side', i, im }));
  const T = (n) => headTop(P[n]);
  add('idle', [P.idle, breath(P.idle, T('idle')).inhale]);
  add('ready', [P.ready, breath(P.ready, T('ready')).inhale]);
  add('strike', [P.windup, P.cut, P.follow]);
  add('heavy', [P.gather, P.raise, P.cleave, P.through]);
  add('skillOff', [P.lungePrep, P.surge, P.thrust, P.lungeBack]);
  add('skillDef', [P.wardPrep, P.ward, P.wardBack]);
  add('skillSup', [P.fervourPrep, P.cry, P.fervourBack]);
  add('block', [P.guard, encaisse(P.guard, T('guard'))]);
  add('dodge', [P.hop, P.land]);
  add('hit', [P.recoil, P.recovery]);
  add('recover', [P.stunned, breath(P.stunned, T('stunned')).exhale]);
  add('ko', [P.fall, P.kneel, P.ground]);
  add('victory', [P.victory, breath(P.victory, T('victory')).inhale]);
  // the charge held (journal Passe CX1, § 14's list): low, the blade behind him, the breath of the rig (a bowed head read as exhausted, blind critique); high, the raised hand over
  // the head (his hair's top pinned: the highest coloured texel is the glove); the guard while charging
  add('charge', [P.chargeLow, breath(P.chargeLow, T('chargeLow')).inhale]);
  add('chargeHi', [P.chargeHigh, breath(P.chargeHigh, CHARGE_HIGH_HAIR).inhale]);
  add('chargeGuard', [P.chargeGuard]);
  return out;
}
