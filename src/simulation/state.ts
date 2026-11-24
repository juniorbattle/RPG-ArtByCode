import type { V2Festival } from './v2festival';
import type { TextRef } from '../narrative/text';
import type { BoutNote } from '../combat/autoNotes';
import type { Rehearsal } from './v2prep';
import type { V2Cards } from './v2cards';
/** The game's state (the playable slice, journal Passe L1): plain data only, JSON-serialisable, versioned. Pure module: no three, no DOM,
 *  no Math.random, no clock (tests/game-core.test.mjs scans src/simulation, src/tournament, src/combat, src/events, src/narrative).
 *  The simulation owns the state (PROJECT_MASTER_CONTRACT § 10.2: `advance(state, action, rng)`); the town and the arena only display it. */

/** the save format's version (PROJECT_MASTER_CONTRACT § 10.3): a save of another version is refused with a readable reason, or migrated */
export const SCHEMA_VERSION = 1;

/** the three decision slots of a day (GAMEPLAY_MASTER_CONTRACT § 4) */
export type SlotId = 'morning' | 'afternoon' | 'evening';
export const SLOTS: readonly SlotId[] = ['morning', 'afternoon', 'evening'];
/** the slice's three days (GAMEPLAY § 13, PROJECT § 14: 3 days, 9 slots) */
export const DAYS = 3;

/** the slice's places (choice P3: the district, the arena's forecourt, a light third place) */
export type PlaceId = 'district' | 'forecourt' | 'lanterns' | 'training';
export const PLACES: readonly PlaceId[] = ['district', 'forecourt', 'lanterns'];
/** the version 2's places (lot V5, journal Passe V5): the training ground added, Lantern Row's street become the Festival Square */
export const V2_PLACES: readonly PlaceId[] = ['district', 'forecourt', 'training', 'lanterns'];

export interface PlayerState {
  name: string;
  /** coins */
  coins: number;
  /** 0..100 */
  reputation: number;
  /** 0 healthy, 1 hurt (-20 % health in a duel), 2 badly hurt (-40 %) */
  injury: number;
  /** training sessions since the last duel (each: +5 % damage at the next duel, at most 2; in a version 2 game +1 to the stat chosen, V2State.prep) */
  training: number;
  /** items held (ids of the narrative's item table) */
  items: string[];
}

/** the persistent state of a competitor (TOURNAMENT_MASTER_CONTRACT § 5, the interface word for word) */
export interface CompetitorState {
  id: string; phaseStatus: string; combatProfile: string; healthState: string; preparation: number; reputation: number; wealth: number;
  relationships: Record<string, number>; objectives: string[]; knownFacts: string[]; teamId?: string;
  /** a version 2 rival's plan (the operator's GP-15 « Les rivaux s’adaptent, la rumeur le dit », journal Passe GP2): the index of its plans it plays now
   *  (src/combat/autoData.ts AUTO_PLANS; absent: its plan of the pool), and the last change, its day and why (the cut, or a defeat against the player) */
  plan?: number;
  planFrom?: { day: number; why: 'cut' | 'beaten' };
}

/** the individual states aggregated once teams appear (TOURNAMENT § 5): typed only, outside the slice (phase III) */
export interface TeamState { id: string; name: string; members: string[]; reputation: number }

/** the tournament's pulse published after every slot (TOURNAMENT § 9), each 0..100 except the count */
export interface WorldPulse {
  excitement: number; activeCompetitors: number; playerFame: number; publicPressure: number; security: number; commerce: number;
  festivity: number; sabotageRisk: number;
}

export interface MatchRecord {
  round: number; a: string; b: string; winner: string | null; close: boolean; day: number; seen: boolean;
  /** the version 2's bracket after the pool (src/tournament/v2calendar.ts): absent in today's game */
  stage?: string;
}
export interface TournamentState {
  phase: 'I';
  /** points per competitor (choice G3: a points pool, a defeat costs but does not eliminate) */
  points: Record<string, number>;
  /** the pool's rounds: pairings, filled with their results when played */
  matches: MatchRecord[];
}

export type ForgeService = 'open' | 'sabotaged' | 'repaired';
export interface ServicesState {
  forge: ForgeService;
  /** the shop's price factor (1 = list price) and the cause of its last change */
  shopFactor: number; shopCause: string;
  /** the night watch paid at the forge for tonight */
  forgeWatch: boolean;
}

/** one entry of the causal log (GAMEPLAY § 14, verrou 8: important events have a causality): what happened, why, when */
export interface GameEvent {
  seq: number; day: number; slot: SlotId;
  /** action | slot | offscreen | match | event | sign | consequence */
  kind: string;
  id: string;
  /** what caused it: an action, an event, a condition (readable) */
  cause: string;
  /** English, shown to the player (choice K1) */
  text: string;
  /** shown in the player's journal; offscreen detail is kept but not shown */
  visible: boolean;
  /** what `text` and `cause` say, for the journal in the language chosen (journal Passe RG4); outside the fingerprint (« $ » keys) */
  $t?: TextRef; $c?: TextRef;
}

export interface GameState {
  schemaVersion: number;
  /** the content tables' version the state was made with */
  content: string;
  seed: number;
  day: number;
  slot: SlotId;
  /** the slice is over (day 3's evening ended) */
  over: boolean;
  place: PlaceId;
  /** actions applied so far (the random streams are derived from it: a reloaded save draws what the continued game draws) */
  step: number;
  player: PlayerState;
  competitors: Record<string, CompetitorState>;
  tournament: TournamentState;
  pulse: WorldPulse;
  services: ServicesState;
  /** quest stages by id */
  quests: Record<string, string>;
  /** relationships of the player with the town's people (npc id -> -100..100) */
  town: Record<string, number>;
  /** small facts the content reads (once-only events, choices made) */
  flags: Record<string, number | boolean | string>;
  /** what the player knows (fact ids of the narrative), in order learnt */
  facts: string[];
  log: GameEvent[];
  /** the duel waiting to be fought (set when the afternoon of a match day starts the duel, cleared by its result) */
  pendingMatch: string | null;
  /** a version 2 game's own state (src/simulation/v2.ts, journal Passes V0-V9): absent in today's game (the canonical text skips it) */
  v2?: V2State;
}

/** the version 2's state: the skills and their levels, the four brought (lot V2); the lots after it add their parts */
export interface V2State {
  /** Clerk Odo's advance on the final's purse (the operator's EQ-6 « 30 pièces à maître Odo dès le jour 9, rendues sur la bourse », journal Passe GP5-2): the coins still to give back out
   *  of it, 0 once the final is fought; absent = never taken (src/simulation/v2work.ts, src/tournament/pool.ts) */
  advance?: number;
  /** the coins a short restitution still owes the watch, worked off at 10 a slot (the operator's CO-3, journal Passe CO3); the ledger keeps the name meanwhile */
  debt?: number;
  /** `order`: the order of priority of the four brought in the duel played by the computer (the operator's AC-09 « le joueur règle ses quatre compétences et
   *  leur ordre », journal Passe AC4; set on the match sheet, lot 2, journal Passe LC3); absent = the automatic's own order (autoDefaultOrder) */
  kit: { loadout: string[]; levels: Record<string, number>; order?: string[]; tactic?: Record<string, string>; mode?: 'manual'; plans?: Record<string, { order?: string[]; tactic?: Record<string, string> }> };
  /** the stat chosen at each training session since the last bout (the operator's DB7-3 « +1 à la stat choisie, pour le prochain combat », journal
   *  Passe DB8): 'atk', 'def', 'end' or 'viv'; emptied with the sessions after the bout */
  prep?: string[];
  /** the tournament's bouts won (DB7-4 « +12 PV par victoire »: Ren's vigour, src/simulation/v2gear.ts v2Stats); a challenge counted too until the operator's GP-14
   *  « La vigueur pour les combats du tournoi seulement (décision A3 : précise DB7-4) » (journal Passe GP2): an older save is counted again as it loads (advance.ts) */
  wins?: number;
  /** the winner's cards (the operator's CL-2 « Version légère : deux cartes par victoire (stat, niveau de compétence, bourse) », journal Passes CL1 / CV1; src/simulation/v2cards.ts): the
   *  offers a bout won left waiting, the cards taken and the lasting points they gave; absent until a bout is won (a game that never wins one keeps its fingerprint) */
  cards?: V2Cards;
  /** what the player has seen of each person's offers, kept as their dialogue opens (the operator's MK-4 / MK-5, journal Passe MK2; src/simulation/v2offers.ts): a « $ »
   *  key, saved with the game and left out of its fingerprint */
  $seen?: Record<string, string[]>;
  /** what the player has seen of the things to do in the list (Q) (the operator's LA-7, journal Passe LA2; src/simulation/v2todo.ts): a « $ » key, saved with
   *  the game and left out of its fingerprint */
  $todo?: string[];
  /** a bout under way in the arena (the operator's SY-10 « Le résultat de la tactique écrit à l’ouverture », journal Passe SY2): the result its tactic gives, written
   *  when the fight starts and applied if the page is left before its end (a bout left is not fought again for a better press); replaced by the bout's own result at
   *  its end. A « $ » key, saved with the game and left out of its fingerprint (src/ui/playArena.ts, src/ui/play.ts) */
  $pending?: { kind: 'bout' | 'challenge'; outcome: { winner: 'player' | 'opponent'; playerHp: number; playerMaxHp: number; opponentHp: number; opponentMaxHp: number; finisher: string | null } };
  /** Master Corvin's notebook (lot 3 of « La Brute », PB-4): a note after each bout and challenge (src/combat/autoNotes.ts), newest last; a « $ » key, saved with the game
   *  and left out of its fingerprint */
  $notes?: BoutNote[];
  /** the last rehearsal against each rival (lot 3 of « La Brute », src/simulation/v2prep.ts): its chances, a win and a loss to watch again; a « $ » key, saved with the game and
   *  left out of its fingerprint (the rehearsal's line in the log says its chances) */
  $rehearsals?: Record<string, Rehearsal>;
  /** the gear carried (lot V3): the weapon and its tier, the armour, the two accessories, the bag of what is owned and not worn */
  gear?: V2Gear;
  /** the shops' day-long states (lot V4): a bargain or a grudge of the day, closed to the player for the day, a markup until a day */
  shops?: Record<string, { deal?: number; sour?: number; closed?: number; markup?: number; haggled?: number }>;
  /** a challenge put to a fighter in town, waiting for its bout on the sand (lot V4), and the day each fighter was last challenged; `kind` (journal Passe PN1, the
   *  operator's GP-01 « Les deux : se battre quand on est pris, et prendre de force »): 'caught' the fight of a thief caught (`caught` what is at stake), 'seize' a
   *  passer-by's piece demanded by force, 'encounter' the fight of an event's answer or of Lio's quest (src/simulation/v2encounter.ts) */
  challenge?: { who: string; day: number; stake?: 'coins' | 'name'; reprisal?: boolean; kind?: 'caught' | 'seize' | 'encounter'; caught?: V2Caught; encounter?: V2EncounterFight };
  /** a thief caught, the fine not yet paid (journal Passe PN1, the operator's GP-03 « Gagné : on s’échappe sans amende (la pièce reste) »): who caught the player (the
   *  keeper by day, Wynn of the watch at night, the passer-by), whom the theft was from, the piece, the fine's cap; settled by paying or by fighting, nothing else in between */
  caught?: V2Caught;
  /** the day each passer-by was last challenged for their piece (journal Passe PN1, GP-02 « Les passants seulement »: once a phase) */
  seized?: Record<string, number>;
  /** a robbed owner's muscle waiting for the player (lot L2b, the operator's note on EV-2: « une possibilite de combat et de represaille reelle »): whom it is
   *  for, and the last day it waits */
  reprisal?: { by: string; until: number };
  challenged?: Record<string, number>;
  /** the marks in Sergeant Hale's ledger (lot L2a, the operator's EV-2 « Un soupçon qui dure, une sortie par la restitution » and L2-2 « Des marques
   *  (Recommandé) », journal Passes EVL2 / EVL4): one per theft caught or found at dawn, a number apart from the reputation (the name the Cité gives) */
  marks?: number;
  /** every theft (lot L2a): its day, whom it robbed (a keeper or a passer-by), what; `seen` 'caught' in the act, 'found' at the next dawn, null
   *  unseen; `night` a shuttered stall forced; `settled` returned or paid at Sergeant Hale's, or taken back by his men */
  thefts?: V2Theft[];
  /** the registrar's one warning given (a theft caught; the next costs a point of the pool) */
  warned?: boolean;
  /** the passers-by who no longer hold their piece (bought or stolen: lot L2a, the operator's note on EV-6) */
  passed?: Record<string, number>;
  /** the last rumour heard of each rival (lot L3, the operator's EV-11 « Observer tout adversaire, rumeurs, activité lisible », journal Passe EV2): what the
   *  source said, true or not (src/simulation/v2intel.ts), never the truth itself */
  heard?: Record<string, V2Rumour>;
  /** the tale Vessa Lark paid Lio's room to tell (lot L4, the operator's EV-9 « Chaque rival se souvient ; deux autres agissent », journal Passe EV2): of which rival,
   *  from which day the room repeats it, until the day of the player's bout against them (src/simulation/v2rivals.ts) */
  lie?: { who: string; from: number; until: number };
  /** an encounter a costly event of the town opened, waiting for the player's answer before anything else (the operator's GP-10 « Le lieu et le choix », journal
   *  Passe GP2: « un événement qui coûte propose une réponse : payer, refuser, ou se battre »; src/simulation/v2encounter.ts): which, when and where */
  encounter?: { id: 'cutpurse' | 'sharps'; day: number; slot: SlotId; place: PlaceId };
  /** the festival of day 9 (lot L6, the operator's EV-14 and the festival's sheet, journal Passe EVL11): the good turns done, the rival walked behind, the parade's
   *  order once set (src/simulation/v2festival.ts) */
  festival?: V2Festival;
  /** the player's sabotage (the operator's SB-1 « couper une sangle de l’adversaire la veille d’un combat de tableau », journal Passes CL2 / SB4; src/simulation/v2sabotage.ts): the lockers cased
   *  the day of the eve, the stranger's tool held, and how each eve ended (the strap cut, or seen); absent until the player first sets about it (a game that never does keeps its fingerprint) */
  sabotage?: V2Sabotage;
}
/** the player's sabotage: the day the arena's lockers were cased (good that day only), the fine tool held, and each eve's end by its day (5, 7 or 9) */
export interface V2Sabotage { cased?: number; tool?: boolean; eves?: Record<number, V2SabEve> }
/** how an eve ended: the strap of the next bout's rival cut (kept secret, SA-6) or the player seen (nothing cut, the rival's grudge, a warning, half the next purse) */
export interface V2SabEve { foe: string; result: 'cut' | 'seen'; accomplice?: boolean; /** the gesture of the night: the rival's weapon blunted (absent: the strap cut, as every eve before the blade) */ gesture?: 'blade' }
/** a rumour as it was told: the day, the source (Lio's room, often right; the hooded stranger, never wrong), the rival's form as said, whether they changed their plan
 *  and since what (the operator's GP-15 « Les rivaux s’adaptent, la rumeur le dit », journal Passe GP2: `plan`, `since` the cut or their defeat against the player, absent
 *  when the source says it without knowing why), and a secret only the stranger tells (they watched you train, they meet a hood at night); `hp` the health a rumour told
 *  before GP-15 took it out (an older save), never said again */
export interface V2Rumour { day: number; src: 'lio' | 'stranger'; hp?: 'fit' | 'hurt' | 'injured'; form: 'rusty' | 'steady' | 'sharp'; plan?: 'same' | 'new'; since?: 'cut' | 'beaten'; secret?: 'spy' | 'plot' }
export interface V2Theft { day: number; from: string; item: string; seen: 'caught' | 'found' | null; night?: boolean; settled?: boolean; /** taken by force from a passer-by (journal Passe PN1) */ seized?: boolean }
/** the fight an event's answer or Lio's quest opens (src/simulation/v2encounter.ts): the encounter it answers (put back if the player calls the fight off), its cost
 *  (taken again when lost, given back when won), `quest` Lio's card sharps: won, they leave and the quest is done; lost, they take the quest's price and the quest stays open */
export interface V2EncounterFight { id: 'cutpurse' | 'sharps'; day: number; slot: SlotId; place: PlaceId; quest?: boolean }
export interface V2Caught { by: string; from: string; item: string; fine: number; night?: boolean; shop?: string }
export interface V2Gear { weapon: string; tier: number; armour: string | null; acc: [string | null, string | null]; bag: string[] }

export function slotName(s: SlotId): string { return s; }
export function placeName(p: PlaceId, v2 = false): string {
  if (v2 && p === 'lanterns') return 'the Festival Square';
  return p === 'district' ? 'the Merchant District' : p === 'forecourt' ? 'the Arena Forecourt' : p === 'training' ? 'the Training Ground' : 'Lantern Row';
}
export function slotIndex(s: SlotId): number { return SLOTS.indexOf(s); }
/** 0..8 over the slice */
export function slotNumber(st: Pick<GameState, 'day' | 'slot'>): number { return (st.day - 1) * 3 + slotIndex(st.slot); }
export const clamp = (v: number, a = 0, b = 100): number => Math.max(a, Math.min(b, v));
export function clone<T>(v: T): T { return JSON.parse(JSON.stringify(v)) as T; }
