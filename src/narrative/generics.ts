/** The version 2's generic fighters (lot L2b; the operator's note on EV-4, « Je voulais integrer aussi des pnjs generiques qui peuvent etre des
 *  combattants present lors de qualifs/eliminatoires par exemple », and his answer « En ville, structure gardée (Recommandé) », journal Passes EV2 / EVL3):
 *  the qualifiers' losers, held before Ren came to the Cité; the ten days and the pool of eight stay as they are. They stayed in town: each takes a
 *  challenge at its place and hour, and the staff for hire on the quay is the muscle a robbed keeper pays (the operator's note on EV-2, « une possibilite de
 *  combat et de represaille reelle »). Each fights on a rival's combat profile, a little weaker (« proposé »); its figure is the one the operator chose
 *  (L2-11, journal Passe EVL4): its town sheet gives its portrait's face and its combat sheet plays in a version 2 duel on that rival's clips, both approved on the
 *  operator's lot sheet (journal Passe GA2; src/characters/PlazaCast.ts, src/arena/CombatCast.ts). English (K1). Pure data. */

export interface GenericDef {
  id: string; name: string; epithet: string;
  /** a line that says who they are */
  bio: string;
  /** the rival's combat profile they fight on (src/combat/profiles.ts, src/combat/v2duel.ts), and their health and blows against it */
  profile: string; hp: number; damage: number;
  /** the figure their sheets were drawn from (art-lab/characters/reference/sources): the operator's L2-11 */
  figure: string;
}

export const GENERICS: Record<string, GenericDef> = {
  aldric: {
    id: 'aldric', name: 'Ser Aldric Venn', epithet: 'the Unlucky Knight', profile: 'ilse', hp: 0.9, damage: 0.95, figure: 'main characters\' casting sheet, n° 07, the knight',
    bio: 'Lady Edda\'s son. A strap gave way in his qualifying bout; he stayed to drill alone on the training ground.',
  },
  corra: {
    id: 'corra', name: 'Corra Dunmere', epithet: 'of the Staff', profile: 'orla', hp: 0.9, damage: 1, figure: 'G1 panel 2',
    bio: 'A noble\'s daughter with a quarterstaff and debts. Out in the qualifiers, she hires her staff out on the quay at night.',
  },
  ambrose: {
    id: 'ambrose', name: 'Brother Ambrose', epithet: 'the Lantern-bearer', profile: 'cassius', hp: 0.85, damage: 0.95, figure: 'G1 panel 4',
    bio: 'A lantern-bearer of the hill shrines. He came for a purse for his shrine and lost it in the qualifiers.',
  },
};

/** the staff for hire a robbed keeper pays (the reprisal, lot L2b) */
export const MUSCLE = 'corra';
