/** The pool's competitors (journal Passe L2): the player and seven rivals, persistent on and off screen (TOURNAMENT_MASTER_CONTRACT § 5).
 *  Each has an identity, a style (its combat profile, src/combat/profiles.ts), objectives, starting relationships and a portrait look (the
 *  town generator's colours: rivals appear in town as portraits and dialogues only, choice K3). English (choice K1). Pure data. */

export interface RivalDef {
  id: string; name: string; epithet: string; profile: string;
  /** a line that says who they are */
  bio: string;
  /** starting reputation and wealth (0..100, coins) */
  reputation: number; wealth: number;
  objectives: string[];
  /** starting relationships (to the player, 'player', and to other competitors), -100..100 */
  relationships: Record<string, number>;
  /** how this rival takes a defeat: 'proud' grows resentful, 'honourable' grows respectful (TOURNAMENT § 7: rivalries from facts) */
  temper: 'proud' | 'honourable' | 'cold';
  /** portrait colours (skin, hair, top, accent) and hairstyle, in the town generator's grammar */
  look: { skin: [number, number, number]; hair: [number, number, number]; top: [number, number, number]; trim: [number, number, number]; hairStyle: string; beard?: [number, number, number] };
}

export const PLAYER_ID = 'player';

export const RIVALS: Record<string, RivalDef> = {
  marek: {
    id: 'marek', name: 'Marek Varn', epithet: 'the Iron Gate', profile: 'marek', bio: 'Last year\'s champion. He waits for you to tire, then ends it with one blow.',
    reputation: 70, wealth: 80, objectives: ['defend-the-title'], relationships: { player: 0, vessa: 10, cassius: -10 }, temper: 'honourable',
    look: { skin: [208, 152, 120], hair: [172, 176, 192], top: [88, 98, 122], trim: [210, 172, 92], hairStyle: 'long', beard: [112, 110, 124] },
  },
  vessa: {
    id: 'vessa', name: 'Vessa Lark', epithet: 'the Quickblade', profile: 'vessa', bio: 'A duelist from the river towns: three cuts before you see the first.',
    reputation: 45, wealth: 40, objectives: ['beat-marek', 'win-the-crowd'], relationships: { player: 0, marek: 10, orla: 5 }, temper: 'proud',
    look: { skin: [236, 196, 160], hair: [40, 34, 46], top: [62, 104, 112], trim: [220, 210, 180], hairStyle: 'long' },
  },
  orla: {
    id: 'orla', name: 'Orla Brask', epithet: 'of the Docks', profile: 'orla', bio: 'Tam the porter\'s cousin. She hauls crates by day and fights for the quay\'s pride.',
    reputation: 25, wealth: 15, objectives: ['prove-the-docks', 'find-a-team'], relationships: { player: 10, rhosk: -5 }, temper: 'honourable',
    look: { skin: [214, 160, 124], hair: [168, 74, 40], top: [120, 98, 70], trim: [190, 170, 120], hairStyle: 'bandana' },
  },
  cassius: {
    id: 'cassius', name: 'Cassius Dree', epithet: 'of House Dree', profile: 'cassius', bio: 'A noble who bought his place in the pool and means to buy his way out of it on top.',
    reputation: 40, wealth: 160, objectives: ['undermine-the-favourite', 'win-at-any-cost'], relationships: { player: -10, ilse: -15, marek: -10 }, temper: 'proud',
    look: { skin: [244, 210, 178], hair: [222, 196, 120], top: [96, 40, 70], trim: [230, 190, 90], hairStyle: 'short' },
  },
  ilse: {
    id: 'ilse', name: 'Ilse Morrow', epithet: 'of the Temple', profile: 'ilse', bio: 'A temple knight who fights for the hospital\'s purse, and never strikes a fallen foe.',
    reputation: 50, wealth: 30, objectives: ['fund-the-hospital'], relationships: { player: 5, cassius: -15 }, temper: 'honourable',
    look: { skin: [226, 180, 146], hair: [200, 190, 170], top: [180, 180, 196], trim: [210, 180, 100], hairStyle: 'short' },
  },
  tobin: {
    id: 'tobin', name: 'Tobin Fenn', epithet: 'the Hopeful', profile: 'tobin', bio: 'Sixteen, a farm sword and more courage than sense.',
    reputation: 10, wealth: 5, objectives: ['win-one-bout'], relationships: { player: 5 }, temper: 'honourable',
    look: { skin: [240, 200, 164], hair: [150, 110, 60], top: [110, 130, 80], trim: [180, 160, 110], hairStyle: 'spiky' },
  },
  rhosk: {
    id: 'rhosk', name: 'Rhosk', epithet: 'the Northman', profile: 'rhosk', bio: 'A mercenary from beyond the passes. Slow, until his axe is already falling.',
    reputation: 55, wealth: 60, objectives: ['earn-a-contract'], relationships: { player: 0, orla: -5 }, temper: 'cold',
    look: { skin: [222, 186, 160], hair: [196, 120, 60], top: [84, 74, 64], trim: [150, 140, 120], hairStyle: 'long', beard: [180, 110, 56] },
  },
};

/** the pool's two rounds in the slice (choice G3): the player meets Vessa on day 2 and Marek on day 3; every competitor fights both days */
export const ROUNDS: ReadonlyArray<{ round: number; day: number; pairs: ReadonlyArray<readonly [string, string]> }> = [
  { round: 1, day: 2, pairs: [[PLAYER_ID, 'vessa'], ['marek', 'tobin'], ['orla', 'rhosk'], ['cassius', 'ilse']] },
  { round: 2, day: 3, pairs: [[PLAYER_ID, 'marek'], ['vessa', 'orla'], ['cassius', 'tobin'], ['ilse', 'rhosk']] },
];

/** points of the pool: a win 3, a close defeat 1 (the loser kept a quarter of its health, or the race was near even), a defeat 0 */
export const POINTS = { win: 3, close: 1, loss: 0 } as const;
