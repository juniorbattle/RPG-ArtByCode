// The theme (journal Passe SN5): SA-2's motif « Le Tournoi », the operator's « Motif et son : bonne direction », the same thirteen notes in every version:
// D A A C A G A D C A G E D. It has no third: the third is the hour, F sharp by day, F natural at night. Original, written for this project.
export const MOTIF = ['D', 'A', 'A', 'C', 'A', 'G', 'A', 'D', 'C', 'A', 'G', 'E', 'D'];

/** the motif in the fusion's rhythm, 3-3-2-3-2-3 over two bars of sixteenths, in the octave a version asks for */
export const fusionHead = (o = 5) => `D${o}:3 A${o}:3 A${o}:2 C${o + 1}:3 A${o}:2 G${o}:3 | A${o}:3 D${o + 1}:3 C${o + 1}:2 A${o}:3 G${o}:2 E${o}:3`;
/** the motif as it was written, in 6/8 (twelve steps to the bar) */
export const lilt = {
  a: 'D5:6 A5:4 A5:2 | C6:4 A5:2 G5:4 A5:2 | D6:6 C6:4 A5:2 | G5:4 E5:2 D5:6',
  b: 'A5:2 C6:2 D6:2 E6:6 | D6:4 C6:2 A5:6 | G5:2 A5:2 C6:2 A5:4 G5:2 | A5:12',
  tag: 'D6:2 D6:2 D6:2 A5:6 | D6:2 D6:2 D6:2 E6:6 | D6:4 C6:2 A5:4 G5:2 | D6:12',
};
/** the motif drawn out over four bars of a ballad, its long notes and its short ones kept */
export const longHead = (o = 5) => `D${o}:8 A${o}:5 A${o}:3 | C${o + 1}:5 A${o}:3 G${o}:5 A${o}:3 | D${o + 1}:8 C${o + 1}:5 A${o}:3 | G${o}:5 E${o}:3 D${o}:8`;
/** the motif in 7/8, three notes to the bar on 2 + 2 + 3 */
export const riff = (o = 2) => `D${o}:4 A${o}:4 A${o}:6 | C${o + 1}:4 A${o}:4 G${o}:6 | A${o}:4 D${o + 1}:4 C${o + 1}:6 | A${o}:4 G${o}:4 E${o}:6`;
