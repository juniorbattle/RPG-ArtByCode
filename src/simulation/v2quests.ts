import { clamp, slotIndex, type GameState, type PlaceId } from './state';
import type { ActionDef } from './actions';
import type { Emit } from './advance';
import { isV2, v2KitOf } from './v2';
import { available } from './roles';
import { learnOrRaise, levelOf } from './v2skills';
import { MAX_LEVEL } from '../combat/skills';
import { marksOf } from './v2law';
import { nextBoutOf, scoutTier } from './v2scout';
import { PEOPLE } from '../narrative/people';
import { RIVALS } from '../narrative/roster';
import { SKILL_BOOK } from '../combat/skillbook';
import { tx, skillName, type TextKey } from '../narrative/text';
import { QUEST, QUESTS, QUEST_IDS, TITLE, type QuestDef, type QuestId } from './v2questData';
export * from './v2questData';

/** The town's quests of a version 2 game (the operator's GP-09 « Quatre quêtes de ville et une page « En cours » », journal Passe GP2; the general gameplay
 *  audit, briefs/audit-gameplay-gp1.md § 4): one quest a place, each asked by someone who is there, in two or three steps, each with a real effect on the
 *  preparation or a bout and a way to fail (GAMEPLAY § 11: « quête ratée → coût économique ou faction renforcée »), followed on the journal's « In progress »
 *  page (src/ui/journal.ts):
 *  - the quay: the Steel Cargo, rewritten (Tam, Sergeant Hale, Bram: src/simulation/roles.ts askPapers / haul / temper) for what the forge does not sell, the
 *    Wyrmsteel tier beyond the forge's last (src/simulation/v2gear.ts weaponTier);
 *  - the forecourt: Sister Anwen's herbs (Fenwick's river herbs on the quay at night, the draught brewed with her): health in the next bout;
 *  - the training ground: Master Corvin's treatise (bought back from Pip on the festival square, studied with him): a skill one level up, past the training's cap;
 *  - the festival square: Lio's card sharps (paid off, or faced with the watch Sergeant Hale lends): Lio's word on each next opponent's plan, the eve of the bout.
 *  A quest is offered by talking to its giver (src/narrative/dialogue.ts onTalk), on its days; it fails at the end of its deadline's slot when its stage is still
 *  among `before`: the giver's goodwill falls and a rival gains (`failRival`, its preparation: AC-17's Attack points). The state is `GameState.quests` (a stage by
 *  quest), plus the draught's flag and the facts each reward writes. Pure. */

/** the stage of a quest (none: not taken) */
export const questStage = (s: Pick<GameState, 'quests'>, id: QuestId): string | undefined => s.quests[id];
/** a quest taken and neither done nor failed */
export const questOpen = (s: Pick<GameState, 'quests'>, id: QuestId): boolean => { const q = s.quests[id]; return !!q && q !== 'done' && q !== 'failed'; };
/** the quests of a version 2 game (today's game keeps its steel cargo as it was) */
export const questsOn = (s: Pick<GameState, 'flags'>): boolean => isV2(s);

/** the quest this person offers now (their quest, on its days, not taken yet) */
export function questOffered(s: GameState, who: string): QuestId | null {
  if (!questsOn(s)) return null;
  for (const id of QUEST_IDS) {
    const q = QUESTS[id];
    if (q.giver === who && !s.quests[id] && s.day >= q.offer[0] && s.day <= q.offer[1]) return id;
  }
  return null;
}

/** talking to a giver offers their quest (src/narrative/dialogue.ts onTalk): its stage `asked`, its words in the journal */
export function offerQuest(s: GameState, who: string, emit: Emit): void {
  const id = questOffered(s, who);
  if (!id) return;
  s.quests[id] = 'asked';
  emit({ kind: 'action', id: `quest:${id}`, cause: 'action:talk', visible: true, text: tx(OFFER[id]) });
}
const OFFER: Record<QuestId, TextKey> = { cargo: 'v2.quest.cargo.offer', herbs: 'v2.quest.herbs.offer', treatise: 'v2.quest.treatise.offer', sharps: 'v2.quest.sharps.offer' };
const FAILED: Record<QuestId, TextKey> = { cargo: 'v2.quest.cargo.failed', herbs: 'v2.quest.herbs.failed', treatise: 'v2.quest.treatise.failed', sharps: 'v2.quest.sharps.failed' };

/** has the deadline's slot ended (the slot ending now is `s.day` / `s.slot`) */
const pastDeadline = (s: Pick<GameState, 'day' | 'slot'>, d: QuestDef['deadline']): boolean => s.day > d.day || (s.day === d.day && slotIndex(s.slot) >= slotIndex(d.slot));

/** the end of a slot (src/simulation/advance.ts passSlot, before the clock moves): each quest whose deadline has come fails; Lio's word the eve of a bout */
export function questsAfterSlot(s: GameState, emit: Emit): void {
  if (!questsOn(s)) return;
  for (const id of QUEST_IDS) {
    const q = QUESTS[id], st = s.quests[id];
    if (!st || !q.deadline.before.includes(st) || !pastDeadline(s, q.deadline)) continue;
    s.quests[id] = 'failed';
    s.town[q.giver] = clamp((s.town[q.giver] ?? 0) + QUEST.failGoodwill, -100, 100);
    const c = q.failRival ? s.competitors[q.failRival] : undefined;
    if (c) c.preparation = clamp(c.preparation + QUEST.failPrep);
    emit({ kind: 'consequence', id: `quest:${id}:failed`, cause: tx('v2.quest.why', { quest: tx(TITLE[id]) }), visible: true, text: tx(FAILED[id]) });
  }
  // Lio's word (the card sharps' reward): the eve of each bout, the plan of the next opponent (the scouting's second tier, src/simulation/v2scout.ts)
  if (s.slot === 'evening' && s.quests.sharps === 'done') {
    const n = nextBoutOf(s);
    // the plan as the scouting keeps it (the operator's GP-15, journal Passe GP3: the plan seen and its day, a rival changing its plan at the cut and after a defeat)
    if (n && n.day === s.day + 1 && RIVALS[n.foe] && scoutTier(s, n.foe) < 2) {
      for (const f of [`scouted:${n.foe}`, `scouted2:${n.foe}`]) if (!s.facts.includes(f)) s.facts.push(f);
      s.flags[`scoutPlan:${n.foe}`] = s.competitors[n.foe]?.plan ?? 0; s.flags[`scoutPlanDay:${n.foe}`] = s.day;
      emit({ kind: 'action', id: `quest:sharps:word:${n.foe}`, cause: tx('v2.quest.why', { quest: tx(TITLE.sharps) }), visible: true, text: tx('v2.quest.sharps.word', { name: RIVALS[n.foe].name }) });
    }
  }
}

/** the step to take now in an open quest: its words, its place and who (for the « In progress » page, the marks and the list) */
export function questStep(s: GameState, id: QuestId): { text: string; place: PlaceId; who: string | null } | null {
  const st = s.quests[id];
  if (!st || st === 'done' || st === 'failed') return null;
  switch (id) {
    case 'cargo':
      return st === 'asked' ? { text: tx('v2.quest.cargo.step.papers'), place: 'district', who: 'hale' }
        : st === 'papers' ? { text: tx('v2.quest.cargo.step.haul'), place: 'district', who: 'tam' }
          : { text: tx('v2.quest.cargo.step.temper', { price: 10 }), place: 'district', who: 'bram' };
    case 'herbs':
      return st === 'asked' ? { text: tx('v2.quest.herbs.step.buy', { price: QUEST.herbsPrice }), place: 'district', who: 'fenwick' }
        : { text: tx('v2.quest.herbs.step.brew'), place: 'forecourt', who: 'anwen' };
    case 'treatise':
      return st === 'asked' ? { text: tx('v2.quest.treatise.step.buy', { price: QUEST.treatisePrice }), place: 'lanterns', who: 'pip' }
        : { text: tx('v2.quest.treatise.step.study'), place: 'training', who: 'corvin' };
    case 'sharps':
      return st === 'asked' ? { text: tx('v2.quest.sharps.step.face', { price: QUEST.sharpsPrice }), place: 'lanterns', who: null }
        : { text: tx('v2.quest.sharps.step.watch'), place: 'lanterns', who: null };
  }
}

/** the deadline in words (« before dusk on day 3 »), or null once nothing can fail any more */
export function questDeadline(s: GameState, id: QuestId): string | null {
  const q = QUESTS[id], st = s.quests[id];
  if (!st || !q.deadline.before.includes(st)) return null;
  return tx(q.deadline.slot === 'afternoon' ? 'v2.quest.deadline.dusk' : 'v2.quest.deadline.night', { day: q.deadline.day });
}

// ------------------------------------------------------------------------------------------------ the actions of the quests (the cargo's are roles.ts')

export type V2QuestAction =
  | { type: 'buyHerbs' }
  | { type: 'brewDraught' }
  | { type: 'buyTreatise' }
  | { type: 'studyTreatise'; skill: string }
  | { type: 'askWatch' }
  | { type: 'faceSharps'; how: 'pay' | 'watch' };

type T = { [K in V2QuestAction['type']]: ActionDef<Extract<V2QuestAction, { type: K }>> & { by: string | null } };
const add = (s: GameState, who: string, n: number) => { s.town[who] = clamp((s.town[who] ?? 0) + n, -100, 100); };
const v2 = (s: GameState): string | null => (isV2(s) ? null : tx('v2.only'));
/** a skill the treatise can raise: owned, under the treatise's cap (the heavy blow is a base attack: never) */
const studiable = (s: GameState): string[] => Object.keys(v2KitOf(s).levels).filter((id) => id !== 'heavy' && SKILL_BOOK[id] && levelOf(s, id) > 0 && levelOf(s, id) < QUEST.treatiseCap);

export const V2_QUEST_ACTIONS: T = {
  // ---------------------------------------------------------------- Sister Anwen's herbs: Fenwick's river herbs on the quay at night, the draught brewed with her
  buyHerbs: {
    by: 'fenwick',
    list: (s) => (isV2(s) && s.place === 'district' && s.quests.herbs === 'asked' ? [{ type: 'buyHerbs' }] : []),
    label: () => tx('v2.quest.herbs.buyLabel', { price: QUEST.herbsPrice }),
    cost: () => 0,
    coins: () => QUEST.herbsPrice,
    check: (s) => v2(s) ?? available(s, 'fenwick') ?? (s.quests.herbs !== 'asked' ? tx('v2.quest.none') : s.player.coins < QUEST.herbsPrice ? tx('v2.quest.poor', { price: QUEST.herbsPrice }) : null),
    apply: (s, _a, _r, emit) => {
      s.player.coins -= QUEST.herbsPrice; s.quests.herbs = 'herbs'; add(s, 'fenwick', 3);
      emit({ kind: 'action', id: 'quest:herbs:buy', cause: 'quest:herbs', visible: true, text: tx('v2.quest.herbs.buyLog') });
    },
  },
  brewDraught: {
    by: 'anwen',
    list: (s) => (isV2(s) && s.place === 'forecourt' && s.quests.herbs === 'herbs' ? [{ type: 'brewDraught' }] : []),
    label: () => tx('v2.quest.herbs.brewLabel', { hp: QUEST.draughtHp }),
    cost: () => 1,
    check: (s) => v2(s) ?? available(s, 'anwen') ?? (s.quests.herbs !== 'herbs' ? tx('v2.quest.none') : s.slot === 'evening' ? tx('v2.quest.herbs.night') : null),
    apply: (s, _a, _r, emit) => {
      s.quests.herbs = 'done'; s.flags.draught = true; add(s, 'anwen', QUEST.doneGoodwill);
      emit({ kind: 'action', id: 'quest:herbs:done', cause: 'quest:herbs', visible: true, text: tx('v2.quest.herbs.brewLog', { hp: QUEST.draughtHp }) });
    },
  },
  // ---------------------------------------------------------------- Master Corvin's treatise: bought back from Pip's stall, studied with him
  buyTreatise: {
    by: 'pip',
    list: (s) => (isV2(s) && s.place === 'lanterns' && s.quests.treatise === 'asked' ? [{ type: 'buyTreatise' }] : []),
    label: () => tx('v2.quest.treatise.buyLabel', { price: QUEST.treatisePrice }),
    cost: () => 0,
    coins: () => QUEST.treatisePrice,
    check: (s) => v2(s) ?? available(s, 'pip') ?? (s.quests.treatise !== 'asked' ? tx('v2.quest.none') : s.player.coins < QUEST.treatisePrice ? tx('v2.quest.poor', { price: QUEST.treatisePrice }) : null),
    apply: (s, _a, _r, emit) => {
      s.player.coins -= QUEST.treatisePrice; s.quests.treatise = 'bought';
      emit({ kind: 'action', id: 'quest:treatise:buy', cause: 'quest:treatise', visible: true, text: tx('v2.quest.treatise.buyLog') });
    },
  },
  studyTreatise: {
    by: 'corvin',
    list: (s) => (isV2(s) && s.place === 'training' && s.quests.treatise === 'bought' ? studiable(s).map((skill) => ({ type: 'studyTreatise', skill })) : []),
    label: (s, a) => tx('v2.quest.treatise.studyLabel', { skill: skillName(a.skill), level: levelOf(s, a.skill) + 1 }),
    cost: () => 1,
    check: (s, a) => v2(s) ?? available(s, 'corvin') ?? (s.quests.treatise !== 'bought' ? tx('v2.quest.none') : s.slot === 'evening' ? tx('v2.quest.treatise.night')
      : !studiable(s).includes(a.skill) ? tx('v2.quest.treatise.cap', { cap: QUEST.treatiseCap }) : null),
    apply: (s, a, _r, emit) => {
      learnOrRaise(s, a.skill, Math.min(MAX_LEVEL, QUEST.treatiseCap));
      s.quests.treatise = 'done'; add(s, 'corvin', QUEST.doneGoodwill);
      emit({ kind: 'action', id: 'quest:treatise:done', cause: 'quest:treatise', visible: true, text: tx('v2.quest.treatise.studyLog', { skill: skillName(a.skill), level: levelOf(s, a.skill) }) });
    },
  },
  // ---------------------------------------------------------------- Lio's card sharps: paid off, or faced with the watch Sergeant Hale lends
  askWatch: {
    by: 'hale',
    list: (s) => (isV2(s) && s.place === 'district' && s.quests.sharps === 'asked' ? [{ type: 'askWatch' }] : []),
    label: () => tx('v2.quest.sharps.askLabel'),
    cost: () => 0,
    check: (s) => v2(s) ?? available(s, 'hale') ?? (s.quests.sharps !== 'asked' ? tx('v2.quest.none') : marksOf(s) > 0 ? tx('v2.quest.sharps.marked') : null),
    apply: (s, _a, _r, emit) => {
      s.quests.sharps = 'watch';
      emit({ kind: 'action', id: 'quest:sharps:watch', cause: 'quest:sharps', visible: true, text: tx('v2.quest.sharps.askLog') });
    },
  },
  faceSharps: {
    by: null,
    list: (s) => (isV2(s) && s.place === 'lanterns' && (s.quests.sharps === 'asked' || s.quests.sharps === 'watch')
      ? [...(s.quests.sharps === 'watch' ? [{ type: 'faceSharps', how: 'watch' } as const] : []), { type: 'faceSharps', how: 'pay' } as const] : []),
    label: (_s, a) => (a.how === 'pay' ? tx('v2.quest.sharps.payLabel', { price: QUEST.sharpsPrice }) : tx('v2.quest.sharps.watchLabel')),
    cost: () => 1,
    coins: (_s, a) => (a.how === 'pay' ? QUEST.sharpsPrice : 0),
    check: (s, a) => v2(s) ?? (s.place !== 'lanterns' ? tx('v2.quest.sharps.notHere') : s.slot !== 'evening' ? tx('v2.quest.sharps.night')
      : !(s.quests.sharps === 'asked' || s.quests.sharps === 'watch') ? tx('v2.quest.none') : a.how === 'watch' && s.quests.sharps !== 'watch' ? tx('v2.quest.sharps.noWatch')
        : a.how === 'pay' && s.player.coins < QUEST.sharpsPrice ? tx('v2.quest.poor', { price: QUEST.sharpsPrice }) : null),
    apply: (s, a, _r, emit) => {
      if (a.how === 'pay') s.player.coins -= QUEST.sharpsPrice;
      s.quests.sharps = 'done'; s.facts.push('sharps-gone'); add(s, 'lio', QUEST.doneGoodwill);
      if (a.how === 'watch') add(s, 'hale', 3);
      emit({ kind: 'action', id: `quest:sharps:${a.how}`, cause: 'quest:sharps', visible: true, text: tx(a.how === 'pay' ? 'v2.quest.sharps.payLog' : 'v2.quest.sharps.watchLog') });
    },
  },
};

/** who offers each step to the player, for a person's name in the words (the journal, the list) */
export const giverName = (id: QuestId): string => PEOPLE[QUESTS[id].giver]?.name ?? QUESTS[id].giver;
