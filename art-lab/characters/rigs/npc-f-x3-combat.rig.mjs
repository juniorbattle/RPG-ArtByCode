// Rig of npc-f-x3-combat (CANDIDATE, never in production without the operator's approval): the townswoman template, the combat sheet at x3 on which the town's
// women fight themselves (the operator's GP-04 note, word for word « Mais les pnjs peuvent etre des combattants eux-meme personne ne se bat vraiment pour d'ou la
// volonte de conception generique avec des declinaisons de peau cheveux, couleur de vetement et armes etc... », and his answer « Gabarits d'abord (Recommandé) »,
// journal Passe GP2). The figure is n° 03 « Artisan (Female) » of the NPC reference sheet 01-16 (the approved town sheet artisan-x2-v1), without her apron and her
// satchel (a neutral template: proposed on the art sheet). The chain is lib/combat.mjs, on 4 generated pose sheets (task npc-gabarits, NON-CANONICAL until the
// operator's art sheet; sheet b retaken in milder words: the image service refused « struck by a blow ») on a flat green ground, on the palette of artisan-x2-v1 with a
// steel ramp: 30 frames of the § 14 list. Her one-handed sword is the template's weapon; the weapons a townsperson carries are drawn over it at load
// (src/characters/NpcLook.ts). Built 116 texels tall, 7 % under the town sheet's 125 (the operator's remark of 2026-11-15 on the townsfolk's proportions against Ren, as the townsman's). Each sheet's pitch from a standing figure's height from the soles to the top of the hair.
//   node tools/art-lab/build-combat.mjs art-lab/characters/rigs/npc-f-x3-combat.rig.mjs [--check]
import { rivalRig, STEEL_RAMP } from './lib/combat.mjs';

const src = (n) => `art-lab/characters/reference/sources/npc-f-combat-x3-2026-11-15-${n}.png`;
/** a figure's box on its sheet: its foreground's box, 12 pixels of margin (4 below the soles) */
const box = (x0, y0, x1, y1) => [x0 - 12, y0 - 12, x1 + 12, y1 + 4];
export const { id, frame, clips, PALETTE, EXTRA, SHEETS, FIGURES, figures, placement, frames } = rivalRig({
  id: 'npc-f-x3-combat', height: 116, extra: STEEL_RAMP, soles: true,
  palette: { path: 'art-lab/characters/exports/artisan-x2-v1.png', sha256: 'b26095eff8363d17f51a333ec4f285d46a42b14e3ff78125bd2c2188575bc6db' },
  sheets: {
    a: { path: src('a'), sha256: '2a85bdb904023caa3567569374ddda56799c4165b65c8a502b3ab9017571756e', stand: 259 },
    b: { path: src('b'), sha256: 'c9f0fd13587ccb0dd05730097b4a82adf1a529973e5eb7f416d39f60cb39c315', stand: 321 },
    c: { path: src('c'), sha256: 'bb752f4d5fca505528eca4fbbd6879bef37807bd6d3eeb4d3f1b596f2652b8d0', stand: 260 },
    d: { path: src('d'), sha256: 'd86a046a51b28165503141b79440f3cef9203ecec3f8e0ab28181a4987f2f5f0', stand: 384 },
  },
  figures: {
    idle: { sheet: 'a', box: box(96, 154, 296, 415) },
    ready: { sheet: 'a', box: box(428, 160, 701, 413) },
    windup: { sheet: 'a', box: box(836, 149, 1038, 413) },
    cut: { sheet: 'a', box: box(1090, 162, 1410, 413) },
    follow: { sheet: 'a', box: box(81, 583, 324, 840) },
    guard: { sheet: 'a', box: box(519, 529, 645, 841) },
    hop: { sheet: 'a', box: box(844, 557, 1015, 824) },
    land: { sheet: 'a', box: box(1237, 582, 1408, 840) },
    gather: { sheet: 'b', box: box(126, 177, 308, 419) },
    raise: { sheet: 'b', box: box(475, 57, 671, 419) },
    cleave: { sheet: 'b', box: box(744, 175, 1091, 419) },
    through: { sheet: 'b', box: box(1189, 203, 1477, 419) },
    recoil: { sheet: 'b', box: box(47, 576, 334, 874) },
    recovery: { sheet: 'b', box: box(401, 617, 660, 877) },
    stunned: { sheet: 'b', box: box(861, 596, 1029, 878) },
    victory: { sheet: 'b', box: box(1234, 457, 1363, 877) },
    offPrep: { sheet: 'c', box: box(154, 137, 307, 407) },
    offSurge: { sheet: 'c', box: box(411, 159, 674, 407) },
    offHit: { sheet: 'c', box: box(737, 189, 1112, 407) },
    offBack: { sheet: 'c', box: box(1233, 146, 1398, 407) },
    defPrep: { sheet: 'c', box: box(122, 580, 328, 840) },
    def: { sheet: 'c', box: box(466, 615, 699, 840) },
    defBack: { sheet: 'c', box: box(798, 580, 1053, 840) },
    fall: { sheet: 'c', box: box(1155, 589, 1381, 842) },
    supPrep: { sheet: 'd', box: box(238, 85, 383, 469) },
    sup: { sheet: 'd', box: box(704, 78, 862, 468) },
    supBack: { sheet: 'd', box: box(1003, 128, 1368, 468) },
    kneel: { sheet: 'd', box: box(177, 634, 586, 860) },
    ground: { sheet: 'd', box: box(868, 749, 1352, 883) },
  },
});
