// The theme (journal Passes SN5 / SN7 / SN8): SA-2's motif « Le Tournoi », the operator's « Motif et son : bonne direction » and F-MOTIF « Garder le motif », thirteen
// notes: D A A C A G A D C A G E D. It has no third: the third is the hour, major by day, minor at night. Since journal Passe SN8 it is rare: whole in a few pieces,
// hidden elsewhere. Original, written for this project.
export const MOTIF = ['D', 'A', 'A', 'C', 'A', 'G', 'A', 'D', 'C', 'A', 'G', 'E', 'D'];
/** the theme's lines as the catalogue writes them, by their intervals: the motif, its mirror, the fanfare's call. Two pieces may share their turns by design; any other
 *  turn two pieces share is a likeness (journal Passe SN8, `tools/audio/band/likeness.mjs`) */
const STEPS = [7, 0, 3, -3, -2, 2, 5, -2, -3, -2, -3, -2];
/** the motif told twice in a row (its last D held into its first) is still the motif: the turns across the join are the theme's too */
export const THEME_STEPS = { motif: [...STEPS, 0, ...STEPS], mirror: [-7, 0, -3, 3, 2, -2, -5, 2, 3, 2, 3], fanfare: [0, 0, -5, 5, 0, 0, 2, -2, -2, -3, -2, 7] };
/** where the whole motif may be heard: its telling (the title), the tournament's song (midday), the riffs of the fights, the finale's return; elsewhere its head,
 *  hidden in an accompaniment (journal Passe SN8, the operator's « il faut de la subtilite ») */
export const WHOLE_MOTIF = ['titre', 'midi', 'duel', 'rival', 'finale'];

/** the motif in the fusion's rhythm, 3-3-2-3-2-3 over two bars of sixteenths, in the octave a version asks for: midday's song */
export const fusionHead = (o = 5) => `D${o}:3 A${o}:3 A${o}:2 C${o + 1}:3 A${o}:2 G${o}:3 | A${o}:3 D${o + 1}:3 C${o + 1}:2 A${o}:3 G${o}:2 E${o}:3`;
/** the motif drawn out over four bars, its long notes and its short ones kept: the title's horn */
export const longHead = (o = 5) => `D${o}:8 A${o}:5 A${o}:3 | C${o + 1}:5 A${o}:3 G${o}:5 A${o}:3 | D${o + 1}:8 C${o + 1}:5 A${o}:3 | G${o}:5 E${o}:3 D${o}:8`;
/** the motif in 7/8, three notes to the bar on 2 + 2 + 3: the duel's riff */
export const riff = (o = 2) => `D${o}:4 A${o}:4 A${o}:6 | C${o + 1}:4 A${o}:4 G${o}:6 | A${o}:4 D${o + 1}:4 C${o + 1}:6 | A${o}:4 G${o}:4 E${o}:6`;
/** the rival's riff: the motif upside down around D, its notes the same five, on 3 + 2 + 2: the hero's theme in a mirror */
export const mirror = (o = 2) => `D${o + 1}:6 G${o}:4 G${o}:4 | E${o}:6 G${o}:4 A${o}:4 | G${o}:6 D${o}:4 E${o}:4 | G${o}:6 A${o}:4 C${o + 1}:4`;
