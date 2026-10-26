import type { Cond, EventDef } from './types';

/** The slice's dynamic events (PROJECT_MASTER_CONTRACT §§ 9.1, 14; journal Passes L2 / L5): eighteen definitions of the six types of § 9.1,
 *  each fired by its causes at the end of a slot, in this order. The forge's sabotage is the targeted chain of § 3.4 (« joueur favori +
 *  faction hostile + sécurité faible → tentative possible »): announced by two signs, answered by the watch, the investigation, the repair
 *  or the merchant's blade (§ 9.3). English texts (choice K1). */

/** Cassius holds a grudge against the player */
const HOSTILE: Cond = { rel: ['cassius', 'player'], lte: -25 };
/** the player has become someone worth undermining */
const FAVOURITE: Cond = { any: [{ wins: true, gte: 1 }, { player: 'reputation', gte: 35 }] };

export const EVENTS: readonly EventDef[] = [
  // ---------------------------------------------------------------- tournament
  {
    id: 'heralds', type: 'tournament', about: 'The heralds cry the day from the Colosseum steps (PROJECT § 8.2: the Colosseum suggested).',
    slots: ['morning'], once: false, cooldown: 3, when: { day: true, gte: 1 }, cause: 'the tournament calendar',
    outcomes: [
      { when: { day: true, lte: 1 }, effects: [{ pulse: 'excitement', add: 2 }], text: 'From the Colosseum steps the heralds cry the pool of eight: the first bouts are tomorrow.' },
      { effects: [{ pulse: 'excitement', add: 3 }], text: 'Drums from the Colosseum: the heralds cry this afternoon\'s bouts across the rooftops.' },
    ],
  },
  {
    id: 'colosseum-roar', type: 'tournament', about: 'The Colosseum\'s roar over the rooftops on the afternoons of the bouts (PROJECT § 8.2: the Colosseum audible).',
    slots: ['afternoon'], once: false, cooldown: 3, when: { day: true, gte: 2 }, cause: 'the pool\'s bouts at the Colosseum',
    outcomes: [{ effects: [{ pulse: 'excitement', add: 3 }], text: 'A roar rolls over the rooftops from the Colosseum: the pool\'s other bouts are being fought.' }],
  },
  {
    id: 'crowd-swell', type: 'tournament', about: 'A big crowd fills the streets once the excitement is high.',
    slots: ['afternoon'], when: { pulse: 'excitement', gte: 60 }, cause: 'the tournament\'s excitement (60 or more)',
    outcomes: [{ effects: [{ pulse: 'festivity', add: 8 }, { pulse: 'commerce', add: 6 }], text: 'The whole Cité seems to be in the streets: hawkers sell ribbons in the pool\'s colours.' }],
  },
  {
    id: 'rising-star', type: 'tournament', about: 'The player\'s first win makes a name, and a jealous rival.',
    slots: ['afternoon'], when: { wins: true, gte: 1 }, cause: 'your first win in the pool',
    outcomes: [{ effects: [{ pulse: 'playerFame', add: 5 }, { rel: ['cassius', 'player'], add: -20 }, { fact: 'cassius-resents' }], text: 'Your name is on every tongue. In the noble stand, Cassius Dree did not applaud.' }],
  },
  {
    id: 'upset-talk', type: 'tournament', about: 'An underdog\'s win sets the betting halls alight.',
    when: { flag: 'upsets', gte: 1 }, cause: 'an upset in the pool',
    outcomes: [
      // the version 2's festival square in Lantern Row's place (lot V7)
      { when: { v2: true }, effects: [{ pulse: 'excitement', add: 8 }], text: 'An upset! The betting tents of the festival square are in uproar.' },
      { effects: [{ pulse: 'excitement', add: 8 }], text: 'An upset! The betting halls of Lantern Row are in uproar.' },
    ],
  },
  // ---------------------------------------------------------------- targeted: the forge chain (signs, attempt, consequence)
  {
    id: 'sign-lamp-oil', type: 'targeted', about: 'First sign: someone in a hood buys lamp oil and pitch from Mara.',
    slots: ['morning', 'afternoon'], when: { all: [HOSTILE, FAVOURITE, { forge: ['open'] }] }, cause: 'a hostile rival and your rising fame',
    outcomes: [{ effects: [{ fact: 'lamp-oil' }, { pulse: 'sabotageRisk', add: 10 }], text: 'Mara frowns: a man in a hood bought all her lamp oil and a pot of pitch, and asked when the smith sleeps.' }],
  },
  {
    id: 'sign-loiterer', type: 'targeted', about: 'Second sign: the watch notices a figure around the forge.',
    slots: ['afternoon', 'evening'], when: { all: [{ fired: 'sign-lamp-oil' }, { pulse: 'security', lte: 62 }] }, cause: 'the first sign, and a stretched watch',
    outcomes: [{ effects: [{ fact: 'loiterer' }], text: 'Wynn of the watch mentions a hooded figure pacing round Bram\'s forge at dusk.' }],
  },
  {
    id: 'forge-sabotage', type: 'targeted', about: 'The attempt on the forge (the targeted sabotage of PROJECT § 3.4).',
    slots: ['evening'], when: { all: [HOSTILE, FAVOURITE, { fired: 'sign-lamp-oil' }, { forge: ['open'] }] }, cause: 'Cassius\'s grudge, your fame and the night',
    major: {
      signs: ['sign-lamp-oil', 'sign-loiterer'],
      answers: ['pay the night watch (Sergeant Hale)', 'keep watch at the forge yourself', 'ask the hooded stranger who paid', 'report the culprit to the watch', 'help Bram repair the forge', 'buy Mara\'s imported blade'],
    },
    outcomes: [
      { when: { watch: true }, effects: [{ fact: 'saboteur-caught' }, { flag: 'culprit-known', set: 'cassius' }, { points: 'cassius', add: -3 }, { rivalRep: 'cassius', add: -20 }, { coins: 15 }, { pulse: 'security', add: 6 }],
        text: 'Torches at the forge! The watch seizes a hireling with a pot of pitch. He names his paymaster: Cassius Dree. The pool docks Cassius three points; the smiths\' guild sends you 15 coins.' },
      { when: { pulse: 'security', gte: 60 }, effects: [{ fact: 'saboteur-fled' }], text: 'A shout in the dark near the forge, running steps: the watch scared someone off. Bram\'s forge is safe tonight.' },
      { effects: [{ forge: 'sabotaged' }, { fact: 'forge-burned' }, { pulse: 'commerce', add: -6 }, { flag: 'sabotaged-day', add: 1 }],
        text: 'Fire in the night: Bram\'s forge is ruined, the bellows slashed and pitch in the coals. The smith will not work tomorrow.' },
    ],
  },
  {
    id: 'steel-shortage', type: 'global', about: 'With the quay\'s forge cold, steel is scarce: the shop\'s prices climb.',
    when: { forge: ['sabotaged'] }, cause: 'the forge\'s sabotage',
    outcomes: [{ effects: [{ shop: 1.4, cause: 'steel is scarce since the forge burned' }], text: 'Word spreads that the quay\'s forge is cold: Mara raises the price of every blade by four tenths.' }],
  },
  // ---------------------------------------------------------------- district
  {
    id: 'vandal-bunting', type: 'district', about: 'Pennants torn down in the night when the watch is thin.',
    slots: ['evening'], chance: 0.6, when: { all: [{ pulse: 'security', lte: 52 }, { pulse: 'festivity', gte: 25 }] }, cause: 'a thin night watch on a festive night',
    outcomes: [{ effects: [{ pulse: 'security', add: -4 }, { pulse: 'festivity', add: -4 }, { fact: 'bunting-torn' }], text: 'In the night, someone tore down the tournament\'s pennants along the quay.' }],
  },
  {
    id: 'pickpockets', type: 'district', about: 'Cutpurses work the festive crowds.',
    slots: ['afternoon'], chance: 0.5, when: { all: [{ pulse: 'festivity', gte: 40 }, { pulse: 'security', lte: 62 }] }, cause: 'thick crowds and a stretched watch',
    outcomes: [
      { when: { town: 'hale', gte: 10 }, effects: [{ town: 'hale', add: 2 }], text: 'A cutpurse brushes past you, and one of Hale\'s men collars him: Hale keeps an eye on his friends.' },
      { effects: [{ coins: -4 }], text: 'In the crush of the crowd, a cutpurse lifts four coins from your belt.' },
    ],
  },
  {
    id: 'merchant-favour', type: 'district', about: 'Mara takes a liking to a helpful customer.',
    when: { town: 'mara', gte: 15 }, cause: 'your good turns to Mara',
    outcomes: [{ effects: [{ flag: 'discount:mara', set: true }], text: 'Mara will knock a tenth off her prices for you from now on.' }],
  },
  {
    id: 'night-market', type: 'district', about: 'Lantern Row comes alive at night.',
    slots: ['afternoon'], once: false, cooldown: 3, when: { pulse: 'festivity', gte: 30 }, cause: 'the tournament\'s crowds',
    outcomes: [
      { when: { v2: true }, effects: [{ pulse: 'commerce', add: 2 }], text: 'As the sun goes down, the festival square lights its paper lanterns: the night market opens.' },
      { effects: [{ pulse: 'commerce', add: 2 }], text: 'As the sun goes down, Lantern Row lights its paper lanterns: the night market opens.' },
    ],
  },
  // ---------------------------------------------------------------- faction
  {
    id: 'guild-feud', type: 'faction', about: 'House Dree and the Temple quarrel in public.',
    when: { rel: ['cassius', 'ilse'], lte: -20 }, cause: 'the bad blood between Cassius Dree and Ilse Morrow',
    outcomes: [{ effects: [{ pulse: 'sabotageRisk', add: 5 }, { pulse: 'security', add: -3 }, { fact: 'dree-temple-feud' }], text: 'House Dree\'s men and the Temple\'s wardens trade insults by the bridge; the watch is stretched thin.' }],
  },
  {
    id: 'temple-alms', type: 'faction', about: 'Ilse\'s win fills the Temple\'s purse: free care at the arena.',
    when: { rivalFact: ['ilse', 'beat:'] }, cause: 'Ilse Morrow\'s win, which she gave to the Temple hospital',
    outcomes: [{ effects: [{ flag: 'free-care', set: true }], text: 'Ilse Morrow gives her purse to the Temple: Sister Anwen will treat any fighter for free.' }],
  },
  // ---------------------------------------------------------------- personal
  {
    id: 'rival-injured', type: 'personal', about: 'News of a rival hurt in the pool.',
    slots: ['afternoon'], when: { rivalHurt: true }, cause: 'a rival hurt in the pool',
    outcomes: [{ effects: [{ fact: 'rival-hurt-news' }], text: 'From the arena\'s infirmary: a fighter of the pool is nursing a wound. Sister Anwen is busy tonight.' }],
  },
  {
    id: 'healer-offer', type: 'personal', about: 'Sister Anwen offers to treat the hurt player.',
    when: { player: 'injury', gte: 1 }, cause: 'your injury',
    outcomes: [{ effects: [{ fact: 'healer-offer' }], text: 'A note from Sister Anwen: « Come to the forecourt before your next bout, and let me see that wound. »' }],
  },
  // ---------------------------------------------------------------- global
  {
    id: 'rain-front', type: 'global', about: 'A front from the sea brings rain on the last day.',
    slots: ['evening'], chance: 0.5, when: { day: true, gte: 2, lte: 2 }, cause: 'a front from the sea',
    outcomes: [{ effects: [{ flag: 'weather', set: 'rain' }, { pulse: 'festivity', add: -4 }], text: 'Clouds roll in from the sea: tomorrow will be wet.' }],
  },
];
