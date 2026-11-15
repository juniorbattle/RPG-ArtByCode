import type { GameState, PlaceId, SlotId } from './state';
import type { TextKey } from '../narrative/text';

/** The town's quests' data (the operator's GP-09, journal Passe GP2; the rules: src/simulation/v2quests.ts): a leaf module, imported by the gear and the duel
 *  without the action table. Pure. */

export type QuestId = 'cargo' | 'herbs' | 'treatise' | 'sharps';
export const QUEST_IDS: readonly QuestId[] = ['cargo', 'herbs', 'treatise', 'sharps'];

export interface QuestDef {
  id: QuestId;
  /** where it is asked and mostly lived */
  place: PlaceId;
  /** who asks for it (talking to them offers it) */
  giver: string;
  /** the days it can be taken */
  offer: readonly [number, number];
  /** its stages in order, the last one `done` (a failed quest is `failed`) */
  stages: readonly string[];
  /** it fails at the end of this slot when its stage is still one of `before` */
  deadline: { day: number; slot: SlotId; before: readonly string[] };
  /** the rival who gains what the player let go */
  failRival: string;
}

export const QUESTS: Record<QuestId, QuestDef> = {
  cargo: { id: 'cargo', place: 'district', giver: 'tam', offer: [1, 3], stages: ['asked', 'papers', 'delivered', 'done'], deadline: { day: 3, slot: 'afternoon', before: ['asked', 'papers'] }, failRival: 'cassius' },
  herbs: { id: 'herbs', place: 'forecourt', giver: 'anwen', offer: [2, 5], stages: ['asked', 'herbs', 'done'], deadline: { day: 5, slot: 'evening', before: ['asked', 'herbs'] }, failRival: 'ilse' },
  treatise: { id: 'treatise', place: 'training', giver: 'corvin', offer: [3, 7], stages: ['asked', 'bought', 'done'], deadline: { day: 7, slot: 'evening', before: ['asked'] }, failRival: 'vessa' },
  sharps: { id: 'sharps', place: 'lanterns', giver: 'lio', offer: [2, 8], stages: ['asked', 'watch', 'done'], deadline: { day: 8, slot: 'evening', before: ['asked', 'watch'] }, failRival: '' },
};

/** the quests' numbers (« proposé », on the operator's sheet before they are built) */
export const QUEST = {
  /** Fenwick's river herbs, Pip's price for the treatise, the sharps paid off to leave the square */
  herbsPrice: 5, treatisePrice: 15, sharpsPrice: 15,
  /** the draught: health added to the next bout or challenge (once) */
  draughtHp: 45,
  /** the treatise: a skill one level up, past the training's cap, to this level at most */
  treatiseCap: 4,
  /** a failed quest: the rival's preparation (AC-17: +1 visible Attack point per 25) and the giver's goodwill */
  failPrep: 25, failGoodwill: -10,
  /** a quest done: the giver's goodwill */
  doneGoodwill: 10,
  /** the Wyrmsteel (the cargo's reward, src/simulation/v2gear.ts wyrmTier): `beyond` a tier beyond the forge's at once, `fourth` a fourth tier once the forge's three
   *  are bought, `edge` no tier but its edge in the duel (src/combat/autoMatch.ts); its Attack as a tier */
  wyrm: 'beyond' as 'beyond' | 'fourth' | 'edge', wyrmAtk: 1,
};

/** the quests' names (keys written whole: tests/texts.test.mjs) */
export const TITLE: Record<QuestId, TextKey> = { cargo: 'v2.quest.cargo.title', herbs: 'v2.quest.herbs.title', treatise: 'v2.quest.treatise.title', sharps: 'v2.quest.sharps.title' };
/** what each quest gives, said on the « In progress » page */
export const REWARD: Record<QuestId, TextKey> = { cargo: 'v2.quest.cargo.reward', herbs: 'v2.quest.herbs.reward', treatise: 'v2.quest.treatise.reward', sharps: 'v2.quest.sharps.reward' };

// ------------------------------------------------------------------------------------------------ the draught (Sister Anwen's herbs)

/** the draught waiting for the next bout or challenge: its health (src/simulation/v2gear.ts v2Stats), drunk by that bout (src/tournament/pool.ts, v2town.ts) */
export const draughtHp = (s: Pick<GameState, 'flags'>): number => (s.flags.draught === true ? QUEST.draughtHp : 0);
/** the bout or the challenge has been fought: the draught is drunk */
export function drinkDraught(s: GameState): void { if (s.flags.draught === true) s.flags.draught = 'drunk'; }

