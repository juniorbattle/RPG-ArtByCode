// Rig of npc-m-x3-combat (CANDIDATE, never in production without the operator's approval): the townsman template, the combat sheet at x3 on which the town's
// men fight themselves (the operator's GP-04 note, word for word « Mais les pnjs peuvent etre des combattants eux-meme personne ne se bat vraiment pour d'ou la
// volonte de conception generique avec des declinaisons de peau cheveux, couleur de vetement et armes etc... », and his answer « Gabarits d'abord (Recommandé) »,
// journal Passe GP2). The figure is n° 01 « Merchant (Male) » of the NPC reference sheet 01-16 (the approved town sheet vendor-x2-v1), without his apron (a neutral
// template: proposed on the art sheet). The chain is lib/combat.mjs, on 4 generated pose sheets (task npc-gabarits, NON-CANONICAL until the operator's art sheet) on a
// flat green ground, on the palette of vendor-x2-v1 with a steel ramp: 30 frames of the § 14 list (guard, dodge and the three skill families: any kit a townsperson
// fights with). His one-handed sword is the template's weapon; the weapons a townsperson carries (sword, axe, hammer, mace, dagger) are drawn over it at load
// (src/characters/NpcLook.ts). Built 120 texels tall, 7 % under the town sheet's 129 (the operator's remark of 2026-11-15, « Certaines des pnjs conmbattants semblent trop gros visuellement dans leur proportion comparer au heros »: the NPC sheet draws its townsfolk with bigger heads than the fighters; the head now at Ren's width). Each sheet's pitch from a standing figure's height from the soles to the top of the hair (the sheets are not drawn at one scale).
//   node tools/art-lab/build-combat.mjs art-lab/characters/rigs/npc-m-x3-combat.rig.mjs [--check]
import { rivalRig, STEEL_RAMP } from './lib/combat.mjs';

const src = (n) => `art-lab/characters/reference/sources/npc-m-combat-x3-2026-11-15-${n}.png`;
/** a figure's box on its sheet: its foreground's box, 12 pixels of margin (4 below the soles) */
const box = (x0, y0, x1, y1) => [x0 - 12, y0 - 12, x1 + 12, y1 + 4];
export const { id, frame, clips, PALETTE, EXTRA, SHEETS, FIGURES, figures, placement, frames } = rivalRig({
  id: 'npc-m-x3-combat', height: 120, extra: STEEL_RAMP, soles: true,
  palette: { path: 'art-lab/characters/exports/vendor-x2-v1.png', sha256: 'd70c4594bfd2187d78938d749275cca25f46f2211a51379e8ae9d0c81ea63b01' },
  sheets: {
    a: { path: src('a'), sha256: '088323ada7e8045db7284f36a81598f39ce8b1affe8f5dda9ab7d5bc5e5c23ef', stand: 276 },
    b: { path: src('b'), sha256: 'fcf17c6b29d2f6eff2652b37becadb15da40eb049510d515802847c6ac871d83', stand: 279 },
    c: { path: src('c'), sha256: '5dba4250f2178d5a3647d9c7624719d0bccc2fcebb77fd0af1acc2f88d37a69f', stand: 279 },
    d: { path: src('d'), sha256: '9ac6cacb4d40291597bf10f2898385c413bab8a7119f56d21645ac929f9ee856', stand: 366 },
  },
  figures: {
    idle: { sheet: 'a', box: box(76, 118, 260, 398) },
    ready: { sheet: 'a', box: box(392, 141, 677, 398) },
    windup: { sheet: 'a', box: box(829, 100, 1020, 398) },
    cut: { sheet: 'a', box: box(1070, 136, 1429, 398) },
    follow: { sheet: 'a', box: box(72, 590, 309, 852) },
    guard: { sheet: 'a', box: box(507, 555, 672, 852) },
    hop: { sheet: 'a', box: box(839, 553, 1014, 811) },
    land: { sheet: 'a', box: box(1240, 589, 1436, 852) },
    gather: { sheet: 'b', box: box(119, 208, 386, 425) },
    raise: { sheet: 'b', box: box(487, 96, 685, 425) },
    cleave: { sheet: 'b', box: box(726, 197, 1066, 425) },
    through: { sheet: 'b', box: box(1150, 217, 1429, 431) },
    recoil: { sheet: 'b', box: box(30, 580, 328, 840) },
    recovery: { sheet: 'b', box: box(408, 613, 644, 845) },
    stunned: { sheet: 'b', box: box(878, 603, 1010, 847) },
    victory: { sheet: 'b', box: box(1220, 458, 1342, 847) },
    offPrep: { sheet: 'c', box: box(86, 137, 328, 418) },
    offSurge: { sheet: 'c', box: box(370, 145, 688, 418) },
    // the lunge's blade, too long for the cell: its tip trimmed (the weapon is drawn again at load anyway)
    offHit: { sheet: 'c', box: box(721, 167, 1137, 418), trim: 6 },
    offBack: { sheet: 'c', box: box(1241, 135, 1453, 418) },
    defPrep: { sheet: 'c', box: box(97, 542, 342, 813) },
    def: { sheet: 'c', box: box(400, 586, 712, 813) },
    defBack: { sheet: 'c', box: box(823, 542, 1080, 813) },
    fall: { sheet: 'c', box: box(1187, 563, 1422, 817) },
    supPrep: { sheet: 'd', box: box(203, 100, 394, 463) },
    sup: { sheet: 'd', box: box(671, 94, 862, 463) },
    supBack: { sheet: 'd', box: box(1003, 130, 1406, 464) },
    kneel: { sheet: 'd', box: box(226, 614, 598, 844) },
    ground: { sheet: 'd', box: box(881, 718, 1331, 858) },
  },
});
