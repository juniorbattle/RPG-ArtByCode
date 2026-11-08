import type { ForgeService, SlotId, WorldPulse } from '../simulation/state';

/** The dynamic events' configuration language (PROJECT_MASTER_CONTRACT §§ 9, 14: « au moins 12 événements dynamiques configurables »;
 *  journal Passe L2): an event is data, a condition over the state and the pulse, effects, a cause and a text; a major one names its signs
 *  and the answers the player has (§ 9.3). Pure data types. */

export type Num = { gte?: number; lte?: number };
export type Cond =
  | { all: Cond[] } | { any: Cond[] } | { not: Cond }
  | ({ pulse: keyof WorldPulse } & Num)
  | ({ day: true } & Num)
  | { slot: SlotId[] }
  | ({ flag: string } & Num) | { flagSet: string }
  | { forge: ForgeService[] }
  | { watch: boolean }
  /** competitor a's relationship to b ('player' for the player) */
  | ({ rel: [string, string] } & Num)
  /** the player's standing with a townsperson */
  | ({ town: string } & Num)
  | ({ player: 'reputation' | 'coins' | 'injury' | 'training' } & Num)
  | { item: string }
  | { quest: string; in: string[] }
  | { fact: string }
  /** the player's duel wins so far */
  | ({ wins: true } & Num)
  /** the player's rank in the pool */
  | ({ rank: true } & Num)
  /** some rival is hurt or injured */
  | { rivalHurt: true }
  /** a rival knows a fact starting with this prefix (e.g. it won a bout: 'beat:') */
  | { rivalFact: [string, string] }
  /** this event (or another) has fired */
  | { fired: string }
  /** the version 2 (lot V7): a version 2 game; a flag of today (`<name>:<day>`); the player in the bracket's semi-finals */
  | { v2: true } | { today: string } | { semi: true }
  /** the version 2 (journal Passe VP1): a bout today the player does not fight; an event fired in an earlier slot (a sign strictly before what
   *  it announces) */
  | { others: true } | { firedBefore: string }
  /** lot L3 (journal Passe EVL5): the player fights tomorrow (a bout of theirs on the next day, not fought yet) */
  | { boutTomorrow: true }
  /** lot L4 (journal Passe EVL7): the player's next bout, not fought yet, comes in exactly this many days (1 = tomorrow); a competitor's phase in the
   *  version 2's bracket (`phaseStatus`: 'pool', 'semi', 'gate', 'third', 'final', 'champion') */
  | { boutIn: number } | { status: [string, string[]] };

export type Effect =
  /** a lasting shift of a pulse field (read by computePulse) */
  | { pulse: keyof WorldPulse; add: number }
  | { flag: string; set?: number | boolean | string; add?: number }
  | { fact: string }
  | { forge: ForgeService }
  | { shop: number; cause: string }
  | { coins: number }
  | { reputation: number }
  | { town: string; add: number }
  | { rel: [string, string]; add: number }
  | { points: string; add: number }
  | { rivalRep: string; add: number }
  | { quest: string; stage: string }
  /** the version 2 (lot V7): a flag of today (`<name>:<day>`) or of tomorrow */
  | { today: string } | { tomorrow: string };

export type EventType = 'global' | 'district' | 'faction' | 'tournament' | 'targeted' | 'personal';

export interface EventOutcome { when?: Cond; effects: Effect[]; text: string }

export interface EventDef {
  id: string; type: EventType;
  /** what the event is, for the designer and the TournamentLab */
  about: string;
  /** the slots at whose end it can fire (default: all) */
  slots?: SlotId[];
  /** fires at most once in a game (default), or again after `cooldown` slots */
  once?: boolean; cooldown?: number;
  when: Cond;
  /** among the events whose causes hold, a share fires (randomness never replaces a cause: PROJECT § 3.3) */
  chance?: number;
  /** the readable cause written in the log with the event */
  cause: string;
  /** the first outcome whose condition holds applies */
  outcomes: EventOutcome[];
  /** a major event: the signs that announce it and the answers the player has (PROJECT § 9.3, GAMEPLAY § 9: at least two) */
  major?: { signs: string[]; answers: string[] };
  /** an ambience a version 2 game keeps out of the news (lot L4, the operator's EV-8 « Hors des nouvelles, dans les répliques et le son », journal Passe EV2):
   *  it still fires and still moves the pulse, written hidden from the journal and the bands; the town's lines say it instead (src/narrative/dialogue.ts).
   *  Today's game shows it as before */
  v2quiet?: true;
}
