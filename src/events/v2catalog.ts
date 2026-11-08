import type { Cond, EventDef } from './types';

/** The version 2's own events (lot V7, journal Passe V7; the operator's decision AV-16 « Relier et compléter »), read after today's eighteen
 *  in a version 2 game only (src/events/engine.ts `catalogOf`): each district its own, by day and by night, tied to the new systems (the
 *  shops and their prices, the gear, the challenges, the thefts, the training ground, the festival square, the bracket); and the targeted
 *  sabotage of the elimination phase (PROJECT § 4, day 6: « sabotage davantage ciblé »), announced by its signs, with its answers (GAMEPLAY
 *  § 9). Today's eighteen are tied to the new systems by what they already change (the steel shortage raises the shops' blades and armour,
 *  Mara's favour is her goodwill, a sabotaged forge stops Bram's tiers, the Temple's alms the healer, the cutpurses the purse) and, where their
 *  text names Lantern Row, by an outcome of the version 2 that names the festival square. English texts, « proposé ». Pure data. */

const HOSTILE: Cond = { rel: ['cassius', 'player'], lte: -25 };
/** the player has become someone worth undermining (as src/events/catalog.ts) */
const FAVOURITE: Cond = { any: [{ wins: true, gte: 1 }, { player: 'reputation', gte: 35 }] };
/** lot L4 (the operator's EV-9 « Chaque rival se souvient ; deux autres agissent », whose card said « un rival aidé peut avertir d'un sabotage », journal Passe EV2):
 *  a rival who counts the player a friend (25 or more: Orla after the cargo and a bout of sparring, an honourable rival beaten and helped), in this order when there
 *  are several (src/simulation/v2rivals.ts FRIENDS) */
const FRIENDS = ['orla', 'ilse', 'tobin', 'marek'] as const;
const friend = (id: string): Cond => ({ rel: [id, 'player'], gte: 25 });
const FRIEND: Cond = { any: FRIENDS.map(friend) };

export const V2_EVENTS: readonly EventDef[] = [
  // ---------------------------------------------------------------- the Merchant District: the caravan by day, the quay's thieves at night
  {
    id: 'v2-steel-caravan', type: 'district', about: 'A caravan of steel ends the shortage once the forge works again.',
    slots: ['morning'], when: { all: [{ forge: ['repaired'] }, { flagSet: 'ev:steel-shortage' }] }, cause: 'the forge rebuilt, and the river barges back',
    outcomes: [{ effects: [{ shop: 1, cause: 'a steel caravan from the river' }, { pulse: 'commerce', add: 6 }], text: 'A caravan of river steel rolls onto the quay: the blades and the mail are back at their prices.' }],
  },
  {
    id: 'v2-quay-alert', type: 'district', about: 'After a theft is caught, the watch doubles its rounds for two nights.',
    slots: ['evening'], once: false, cooldown: 3, when: { any: [{ today: 'caught' }] }, cause: 'a thief caught in the shops today',
    outcomes: [{ effects: [{ pulse: 'security', add: 6 }, { tomorrow: 'alert' }], text: 'Sergeant Hale doubles the night rounds: a thief was caught in the market today. Every stall keeps one eye open tomorrow.' }],
  },
  // ---------------------------------------------------------------- the forecourt: the bookmakers by day, the vigil at night
  {
    id: 'v2-bookmakers', type: 'tournament', about: 'The bookmakers lay odds on the player once the pool has seen them win.',
    slots: ['morning'], when: { all: [{ wins: true, gte: 2 }, { rank: true, lte: 3 }] }, cause: 'two wins and a place among the pool\'s best',
    outcomes: [{ effects: [{ pulse: 'playerFame', add: 6 }, { coins: 10 }], text: 'At the forecourt\'s gate the bookmakers chalk your name among the favourites. A grateful punter slips you 10 coins.' }],
  },
  {
    id: 'v2-gate-vigil', type: 'tournament', about: 'The night before the semi-finals the Temple keeps a vigil at the arena\'s gate.',
    slots: ['evening'], when: { day: true, gte: 5, lte: 5 }, cause: 'the semi-finals tomorrow',
    outcomes: [{ effects: [{ pulse: 'security', add: 5 }, { pulse: 'festivity', add: 4 }], text: 'Candles at the arena\'s gate: the Temple keeps its vigil for the four who go on, and the watch stands with them.' }],
  },
  // ---------------------------------------------------------------- the training ground: the master's open lesson by day, a brawl at night
  {
    id: 'v2-masterclass', type: 'district', about: 'Master Corvin gives an open lesson: his skills cost a fifth less today.',
    slots: ['morning'], chance: 0.35, once: false, cooldown: 6, when: { day: true, gte: 3 }, cause: 'the weapon master\'s open day',
    outcomes: [{ effects: [{ today: 'lesson' }], text: 'Master Corvin opens his school to all comers today: every skill he teaches costs a fifth less until dusk.' }],
  },
  {
    // journal Passe VP1: its first `about` promised the training ground shut the next morning, which nothing did; the drill master speaks of it
    id: 'v2-barracks-brawl', type: 'district', about: 'A brawl at the barracks when the watch is thin: the drill master talks of his bruised recruits the next morning.',
    slots: ['evening'], chance: 0.4, when: { all: [{ pulse: 'security', lte: 50 }, { day: true, gte: 3 }] }, cause: 'a thin watch and the soldiers\' wine',
    outcomes: [{ effects: [{ pulse: 'security', add: -3 }, { fact: 'barracks-brawl' }, { tomorrow: 'brawl' }], text: 'Shouts from the barracks by the training ground: the soldiers\' wine ran out before their tempers did.' }],
  },
  // ---------------------------------------------------------------- the festival square: the puppets by day, the parade at night
  {
    id: 'v2-puppet-show', type: 'district', about: 'The puppeteers play the tournament\'s bouts on the square: the player\'s fame grows with the crowd.',
    // kept out of the news (lot L4, EV-8 « Hors des nouvelles, dans les répliques et le son »): Wren the bard says it on the square
    v2quiet: true,
    slots: ['afternoon'], once: false, cooldown: 6, when: { all: [{ pulse: 'festivity', gte: 35 }, { wins: true, gte: 1 }] }, cause: 'the crowds and your wins',
    outcomes: [{ effects: [{ pulse: 'playerFame', add: 3 }, { pulse: 'festivity', add: 3 }], text: 'On the festival square the puppeteers replay your last bout, with a bigger sword and a better hat.' }],
  },
  {
    id: 'v2-lantern-parade', type: 'district', about: 'The lantern parade on the festival square, the night before the final.',
    slots: ['evening'], when: { day: true, gte: 9, lte: 9 }, cause: 'the eve of the final',
    outcomes: [{ effects: [{ pulse: 'festivity', add: 10 }, { pulse: 'commerce', add: 6 }, { pulse: 'security', add: -4 }], text: 'A river of paper lanterns winds round the festival square: the whole Cité walks the eve of the final.' }],
  },
  {
    id: 'v2-card-sharps', type: 'district', about: 'Card sharps on the festival square at night, when the watch is thin.',
    slots: ['evening'], chance: 0.4, when: { all: [{ pulse: 'festivity', gte: 45 }, { pulse: 'security', lte: 55 }] }, cause: 'a festive night and a thin watch',
    outcomes: [
      { when: { town: 'lio', gte: 10 }, effects: [{ town: 'lio', add: 2 }], text: 'Lio warns you off the card sharps by the stage: friends of the house do not lose their purse here.' },
      { effects: [{ coins: -5 }], text: 'A friendly game by the stage costs you 5 coins before you see the marked cards.' },
    ],
  },
  // ---------------------------------------------------------------- the new systems: thefts, challenges
  {
    id: 'v2-thief-talk', type: 'personal', about: 'A theft caught follows the player: the town talks.',
    slots: ['evening'], when: { today: 'caught' }, cause: 'your theft caught today',
    outcomes: [{ effects: [{ pulse: 'playerFame', add: -4 }, { town: 'mara', add: -3 }], text: 'In the taverns they say a fighter of the pool was caught with a hand in a merchant\'s stall. Your name is not said kindly.' }],
  },
  {
    // lot L4 (the operator's EV-7 « Les suites des actions, puis un par lieu, puis le ciblé », with his note « il faut que cela puisse impacter la preparation du
    // joueur en jouant sur cet aspect imprevisible », journal Passe EV2): the challenge that makes the town talk now touches the preparation, each challenge won,
    // a day apart: Master Corvin hears of it and teaches the winner at a fifth off the next day (his open lesson's price, src/simulation/v2skills.ts); the
    // heralds' line the first time, as before
    id: 'v2-challenge-fame', type: 'personal', about: 'A challenge won in town makes a name on the sand: the heralds the first time, and Master Corvin teaches the winner at a fifth off the next day.',
    once: false, cooldown: 3, when: { today: 'won-challenge' }, cause: 'a challenge won in town',
    outcomes: [
      { when: { not: { fired: 'v2-challenge-fame' } }, effects: [{ pulse: 'playerFame', add: 4 }, { pulse: 'excitement', add: 3 }, { tomorrow: 'lesson' }], text: 'Word of your bout on the training sand reaches the Colosseum: the heralds add a line about you. Master Corvin heard it too: his skills cost you a fifth less tomorrow.' },
      { effects: [{ tomorrow: 'lesson' }], text: 'Master Corvin heard of your bout on the sand: « Come tomorrow. A fighter who wins in the street learns at a fifth off. »' },
    ],
  },
  // ---------------------------------------------------------------- targeted: the gear tampered with before a bracket bout (signs, attempt, answers)
  {
    // journal Passe VP1: from the pool's second round, as soon as the player is among its best four (the semi-finals in sight), so that both
    // signs come before the attempt with a slot left to answer them
    id: 'v2-sign-armourer', type: 'targeted', about: 'First sign: a stranger asks Hilde about the player\'s armour.',
    when: { all: [HOSTILE, { any: [{ semi: true }, { all: [{ day: true, gte: 4, lte: 5 }, { rank: true, lte: 4 }] }] }] }, cause: 'Cassius\'s grudge, and you among the pool\'s best four',
    outcomes: [{ effects: [{ fact: 'armour-asked' }, { pulse: 'sabotageRisk', add: 8 }], text: 'Hilde the armourer frowns: a well-dressed servant asked her which straps of your armour hold the plates.' }],
  },
  {
    id: 'v2-sign-locker', type: 'targeted', about: 'Second sign: the arena\'s locker room found unlocked.',
    when: { all: [{ firedBefore: 'v2-sign-armourer' }, { pulse: 'security', lte: 64 }] }, cause: 'the first sign, and the arena\'s doors unguarded',
    outcomes: [{ effects: [{ fact: 'locker-open' }], text: 'Clerk Odo mutters that the fighters\' lockers were found open last night. Nothing missing, he says. Nothing he saw.' }],
  },
  {
    id: 'v2-gear-tamper', type: 'targeted', about: 'The attempt: a strap of the player\'s armour cut the night before a bracket bout (the elimination phase\'s targeted sabotage).',
    // both signs strictly before the attempt (journal Passe VP1: a sign the same night as what it announces gives no time to answer it); the eve of a bout of the
    // player's only (lot L3, journal Passe EVL5: on main it fired 13 times in 19 the night before a day the diligent player did not fight, a cut that changed nothing,
    // and the strongroom is taken the eve of a bout)
    slots: ['evening'], when: { all: [HOSTILE, { semi: true }, { firedBefore: 'v2-sign-locker' }, { not: { flagSet: 'tamper-done' } }, { any: [{ day: true, gte: 5, lte: 5 }, { day: true, gte: 7, lte: 7 }, { day: true, gte: 9, lte: 9 }] }, { boutTomorrow: true }] }, cause: 'Cassius\'s grudge, and a bout of the bracket tomorrow',
    major: {
      signs: ['v2-sign-armourer', 'v2-sign-locker'],
      // lot L3 (the operator's EV-10 « Une réponse par lieu, un effet lisible », journal Passe EV2): the lockers' own answer, Clerk Odo's strongroom, in the place of
      // the quay's paid watch, which guards the forge alone; Lady Edda names the servant's colours once a strap was cut and worn (src/narrative/dialogue.ts)
      answers: ['leave your gear in Clerk Odo\'s strongroom on the eve', 'have Hilde check your gear on the day of the bout', 'ask Lady Edda whose servant cut it', 'report the culprit to the watch', 'confront Cassius on the festival square'],
    },
    outcomes: [
      { when: { today: 'strongroom' }, effects: [{ flag: 'tamper-done', set: true }, { fact: 'tamper-foiled' }, { flag: 'culprit-known', set: 'cassius' }, { pulse: 'security', add: 4 }], text: 'In the night someone tries the fighters\' lockers and finds yours empty: your gear sleeps in Clerk Odo\'s strongroom. At dawn Odo picks up a button in House Dree\'s colours by its door.' },
      { effects: [{ flag: 'tamper-done', set: true }, { tomorrow: 'tampered' }, { fact: 'gear-tampered' }], text: 'In the night, someone slips into the fighters\' lockers. Nobody sees what they touched.' },
    ],
  },
  // ---------------------------------------------------------------- lot L4: a friend warns of Cassius's two chains (EV-9: « un rival aidé peut avertir d'un sabotage »)
  {
    // the slot before the night the forge can burn: the afternoon after the hood bought Mara's oil, while the forge stands and the attempt has not come
    id: 'v2-friend-forge', type: 'targeted', about: 'A rival who counts the player a friend warns of the forge\'s sabotage, the afternoon before the night it can come, and names the answer.',
    slots: ['afternoon'], when: { all: [FRIEND, HOSTILE, FAVOURITE, { fired: 'sign-lamp-oil' }, { forge: ['open'] }, { not: { fired: 'forge-sabotage' } }] }, cause: 'a friend among the fighters, and the hood who bought Mara\'s oil',
    outcomes: [
      { when: friend('orla'), effects: [{ fact: 'friend-warned-forge' }], text: 'Orla Brask finds you: « The dockers say a hood bought pitch and asked when Bram sleeps. Pay Hale\'s watch at the forge tonight. »' },
      { when: friend('ilse'), effects: [{ fact: 'friend-warned-forge' }], text: 'Ilse Morrow stops you: « A man in a hood asked the Temple\'s wardens when the smith on the quay sleeps. Have Hale\'s watch stand at the forge tonight. »' },
      { when: friend('tobin'), effects: [{ fact: 'friend-warned-forge' }], text: 'Tobin Fenn runs up, out of breath: « A man with pitch on his hands asked me where Bram sleeps! Get the watch on the forge tonight! »' },
      { effects: [{ fact: 'friend-warned-forge' }], text: 'Marek Varn speaks low: « Somebody means to burn the quay\'s forge. I would not leave it to the night alone: Hale\'s watch costs less than a new forge. »' },
    ],
  },
  {
    // the eve of the bout the gear's sabotage aims at, by day, while Clerk Odo's strongroom is still open (by day) and Hilde can look the gear over on the day itself
    id: 'v2-friend-gear', type: 'targeted', about: 'A rival who counts the player a friend warns of the gear\'s sabotage on the eve of the bout it aims at, by day, and names the answers.',
    slots: ['morning', 'afternoon'],
    when: { all: [FRIEND, HOSTILE, { fired: 'v2-sign-armourer' }, { not: { flagSet: 'tamper-done' } }, { any: [{ all: [{ day: true, gte: 5, lte: 5 }, { rank: true, lte: 4 }] }, { all: [{ semi: true }, { boutTomorrow: true }, { any: [{ day: true, gte: 7, lte: 7 }, { day: true, gte: 9, lte: 9 }] }] }] }] },
    cause: 'a friend among the fighters, and the servant who asked about your straps',
    outcomes: [
      { when: friend('orla'), effects: [{ fact: 'friend-warned-gear' }], text: 'Orla Brask catches your sleeve: « A servant in House Dree\'s colours asked the dockers which locker is yours. Leave your gear with Clerk Odo before dusk, or have Hilde look it over before the bell. »' },
      { when: friend('ilse'), effects: [{ fact: 'friend-warned-gear' }], text: 'Ilse Morrow, quietly: « A servant of House Dree asked the wardens which locker is yours. Leave your gear with Clerk Odo before dusk, or let Hilde see it before the bell. »' },
      { when: friend('tobin'), effects: [{ fact: 'friend-warned-gear' }], text: 'Tobin Fenn whispers: « A man in Dree colours asked me which locker is yours. I did not tell him! Give your gear to Clerk Odo before dusk, or show it to Hilde. »' },
      { effects: [{ fact: 'friend-warned-gear' }], text: 'Marek Varn, without turning: « Someone asked which locker is yours. Champions keep their gear with the registrar on the eve, and let Hilde see it on the day. »' },
    ],
  },
  // ---------------------------------------------------------------- lot L4: Rhosk takes the training sand (EV-9 « deux autres agissent »: the intimidation, PROJECT § 9.2)
  {
    // out of the title (the cut's four others, the Gate) while the player is in it, the free day before the player's next bout: the sign the night before, from the staff
    // for hire he tried to hire (src/simulation/v2rivals.ts: the sand taken, its three answers)
    id: 'v2-rhosk-offer', type: 'targeted', about: 'Rhosk, out of the title, means to take the training sand where the player drills on the free day before their next bout: Corra Dunmere, whom he offered coin on the quay, says so the night before.',
    slots: ['evening'], when: { all: [{ status: ['rhosk', ['gate']] }, { semi: true }, { boutIn: 2 }, { not: { flagSet: 'sand-cleared' } }] }, cause: 'Rhosk out of the title, and you two days from your next bout',
    outcomes: [{ effects: [{ fact: 'rhosk-offer' }, { tomorrow: 'sand' }, { pulse: 'sabotageRisk', add: 4 }], text: 'On the quay at dusk, Corra Dunmere spits into the water: the Northman offered her coin to stand with him on the training sand tomorrow, « where the favourite drills ». She told him to find another staff.' }],
  },
];
