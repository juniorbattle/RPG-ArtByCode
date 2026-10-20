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
export type PlaceId = 'district' | 'forecourt' | 'lanterns';
export const PLACES: readonly PlaceId[] = ['district', 'forecourt', 'lanterns'];

export interface PlayerState {
  name: string;
  /** coins */
  coins: number;
  /** 0..100 */
  reputation: number;
  /** 0 healthy, 1 hurt (-20 % health in a duel), 2 badly hurt (-40 %) */
  injury: number;
  /** training sessions since the last duel (each: +1 action point at the start of the next duel, at most 2) */
  training: number;
  /** items held (ids of the narrative's item table) */
  items: string[];
}

/** the persistent state of a competitor (TOURNAMENT_MASTER_CONTRACT § 5, the interface word for word) */
export interface CompetitorState {
  id: string; phaseStatus: string; combatProfile: string; healthState: string; preparation: number; reputation: number; wealth: number;
  relationships: Record<string, number>; objectives: string[]; knownFacts: string[]; teamId?: string;
}

/** the individual states aggregated once teams appear (TOURNAMENT § 5): typed only, outside the slice (phase III) */
export interface TeamState { id: string; name: string; members: string[]; reputation: number }

/** the tournament's pulse published after every slot (TOURNAMENT § 9), each 0..100 except the count */
export interface WorldPulse {
  excitement: number; activeCompetitors: number; playerFame: number; publicPressure: number; security: number; commerce: number;
  festivity: number; sabotageRisk: number;
}

export interface MatchRecord { round: number; a: string; b: string; winner: string | null; close: boolean; day: number; seen: boolean }
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
}

export function slotName(s: SlotId): string { return s; }
export function placeName(p: PlaceId): string { return p === 'district' ? 'the Merchant District' : p === 'forecourt' ? 'the Arena Forecourt' : 'Lantern Row'; }
export function slotIndex(s: SlotId): number { return SLOTS.indexOf(s); }
/** 0..8 over the slice */
export function slotNumber(st: Pick<GameState, 'day' | 'slot'>): number { return (st.day - 1) * 3 + slotIndex(st.slot); }
export const clamp = (v: number, a = 0, b = 100): number => Math.max(a, Math.min(b, v));
export function clone<T>(v: T): T { return JSON.parse(JSON.stringify(v)) as T; }
