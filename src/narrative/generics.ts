import { localize } from './text';
/** The version 2's generic fighters (lot L2b; the operator's note on EV-4, « Je voulais integrer aussi des pnjs generiques qui peuvent etre des
 *  combattants present lors de qualifs/eliminatoires par exemple », and his answer « En ville, structure gardée (Recommandé) », journal Passes EV2 / EVL3):
 *  the qualifiers' losers, held before Ren came to the Cité; the ten days and the pool of eight stay as they are. They stayed in town: each takes a
 *  challenge at its place and hour, and the staff for hire on the quay is the muscle a robbed keeper pays (the operator's note on EV-2, « une possibilite de
 *  combat et de represaille reelle »). Each fights on a rival's combat profile, a little weaker (« proposé »); its figure is the one the operator chose
 *  (L2-11, journal Passe EVL4): its town sheet gives its portrait's face and its combat sheet plays in a version 2 duel on that rival's clips, both approved on the
 *  operator's lot sheet (journal Passe GA2; src/characters/PlazaCast.ts, src/arena/CombatCast.ts). Three more, the operator's GA-P1 to GA-P3 « Oui, ainsi » and GA-P4
 *  « Une tâche à part, après celle-ci » (journal Passes GA2 / GA3): the swordmaster, the spear champion and the bare-handed fighter of the tournament casting sheet a,
 *  with the names, places, hours and profiles the sheet proposed. English (K1). Pure data. */

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
  // the three more of journal Passe GA3 (GA-P1 to GA-P3 « Oui, ainsi »): health and blows « proposés », a little under their rival's
  lucan: {
    id: 'lucan', name: 'Lucan Rook', epithet: 'the Red Blade', profile: 'marek', hp: 0.85, damage: 0.9, figure: 'tournament casting sheet a, n° 08, the swordmaster',
    bio: 'A swordmaster of the river towns. Marek beat him in the qualifiers; every evening he drills before the arena\'s gate.',
  },
  piers: {
    id: 'piers', name: 'Piers Calloway', epithet: 'of the Long Spear', profile: 'vessa', hp: 0.9, damage: 0.95, figure: 'tournament casting sheet a, n° 09, the spear champion',
    bio: 'A spear champion out in the qualifiers. He stayed on to guard the river traders\' barges on the quay by day.',
  },
  kell: {
    id: 'kell', name: 'Kell Barrow', epithet: 'the Bare Fist', profile: 'tobin', hp: 0.9, damage: 0.95, figure: 'tournament casting sheet a, n° 14, the martial artist',
    bio: 'A bare-handed fighter out in the qualifiers. He fights for a few coins on the market hall\'s steps in the morning.',
  },
};

// names, epithets and stories read in the language shown (journal Passe RG4)
for (const g of Object.values(GENERICS)) localize(g, ['name', 'epithet', 'bio']);

/** the staff for hire a robbed keeper pays (the reprisal, lot L2b) */
export const MUSCLE = 'corra';
