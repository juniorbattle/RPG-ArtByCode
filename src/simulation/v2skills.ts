import { clamp, type GameState, type V2State } from './state';
import type { Emit } from './advance';
import type { ActionDef } from './actions';
import { isV2, v2KitOf } from './v2';
import { SKILL_BOOK, taughtBy } from '../combat/skillbook';
import { MAX_LEVEL, chargeTime } from '../combat/skills';
import { skillName, tx } from '../narrative/text';

/** The skills of a version 2 game (lot V2, C4; the operator's decision AV-9 « Achat, entraînement et défi », journal Passe V2): the skills the
 *  player owns and their levels (`s.v2.kit.levels`, AV-8), the four brought to a duel (`s.v2.kit.loadout`), and the three ways to obtain one:
 *  bought from the weapon master (dear), drilled on the practice sand (a slot: a base skill learnt, or a level gained, up to TRAIN_CAP), won by
 *  a challenge in town (lot V4: `learnFromChallenge`). The four are chosen at the match sheet (`setLoadout`, a minor action). Only a version 2
 *  game offers these actions; the default game never lists them. Pure. */

/** training raises a skill to this level at most; the levels above come from challenges won (« proposé ») */
export const TRAIN_CAP = 3;

/** the version 2's state of a game (created with its flag, makeV2) */
export function v2State(s: GameState): V2State {
  if (!s.v2) { const k = v2KitOf(s); s.v2 = { kit: { loadout: [...k.loadout], levels: { ...k.levels } } }; }
  return s.v2;
}
export const owns = (s: GameState, id: string): boolean => (s.v2?.kit.levels[id] ?? v2KitOf(s).levels[id] ?? 0) > 0;
export const levelOf = (s: GameState, id: string): number => s.v2?.kit.levels[id] ?? v2KitOf(s).levels[id] ?? 0;

/** learns a skill at level 1, or raises an owned one (capped); the text of what happened */
export function learnOrRaise(s: GameState, id: string, cap = MAX_LEVEL): 'learnt' | 'raised' | 'max' {
  const k = v2State(s).kit, lv = k.levels[id] ?? 0;
  if (!lv) { k.levels[id] = 1; return 'learnt'; }
  if (lv >= cap) return 'max';
  k.levels[id] = lv + 1; return 'raised';
}

/** a challenge won against this fighter (lot V4): its skill learnt, or raised; null when the fighter teaches none */
export function learnFromChallenge(s: GameState, fighter: string, emit: Emit): string | null {
  const id = taughtBy(fighter);
  if (!id) return null;
  const r = learnOrRaise(s, id);
  emit({ kind: 'action', id: `skill:${r}`, cause: `challenge:${fighter}`, visible: true, text: r === 'learnt' ? tx('v2.skill.learnt', { skill: skillName(id) }) : r === 'raised' ? tx('v2.skill.raised', { skill: skillName(id), level: levelOf(s, id) }) : tx('v2.skill.max', { skill: skillName(id) }) });
  return id;
}

/** the weapon master's price for a skill: its list price, less a tenth for a good name in the pool (reputation 40 or more) (« proposé ») */
export function skillPrice(s: GameState, id: string): number {
  const p = SKILL_BOOK[id]?.price ?? 0;
  // the master's open lesson (lot V7, the event v2-masterclass): a fifth less that day
  return Math.round(p * (s.player.reputation >= 40 ? 0.9 : 1) * (s.flags[`lesson:${s.day}`] ? 0.8 : 1));
}

export type V2SkillAction =
  | { type: 'buySkill'; skill: string }
  | { type: 'drillSkill'; skill: string }
  | { type: 'setLoadout'; skills: string[] };

// the skills are taught and drilled at the training ground (lot V5)
const atForecourt = (s: GameState) => s.place === 'training';

export const V2_SKILL_ACTIONS: { [K in V2SkillAction['type']]: ActionDef<Extract<V2SkillAction, { type: K }>> & { by: string | null } } = {
  buySkill: {
    by: 'corvin',
    list: (s) => (isV2(s) && atForecourt(s) ? Object.values(SKILL_BOOK).filter((k) => k.source === 'buy').map((k) => ({ type: 'buySkill', skill: k.id })) : []),
    label: (s, a) => tx('v2.buySkill.label', { skill: skillName(a.skill), price: skillPrice(s, a.skill), charge: chargeTime(a.skill, 1) }),
    cost: () => 0,
    coins: (s, a) => skillPrice(s, a.skill),
    check: (s, a) => (!isV2(s) ? tx('v2.only') : SKILL_BOOK[a.skill]?.source !== 'buy' ? tx('v2.buySkill.notSold') : !atForecourt(s) ? tx('v2.buySkill.notHere')
      : s.slot === 'evening' ? tx('v2.buySkill.closed') : owns(s, a.skill) ? tx('v2.buySkill.owned') : s.player.coins < skillPrice(s, a.skill) ? tx('v2.buySkill.poor', { price: skillPrice(s, a.skill) }) : null),
    apply: (s, a, _r, emit) => {
      const p = skillPrice(s, a.skill);
      s.player.coins -= p; learnOrRaise(s, a.skill); s.town.corvin = clamp((s.town.corvin ?? 0) + 5, -100, 100);
      emit({ kind: 'action', id: `buySkill:${a.skill}`, cause: 'action:buySkill', visible: true, text: tx('v2.buySkill.log', { skill: skillName(a.skill), price: p }) });
    },
  },
  drillSkill: {
    by: null,
    list: (s) => (isV2(s) && atForecourt(s) ? Object.values(SKILL_BOOK).filter((k) => k.source === 'train' || owns(s, k.id)).map((k) => ({ type: 'drillSkill', skill: k.id })) : []),
    label: (s, a) => (owns(s, a.skill) ? tx('v2.drill.raise', { skill: skillName(a.skill), level: levelOf(s, a.skill) + 1 }) : tx('v2.drill.learn', { skill: skillName(a.skill) })),
    cost: () => 1,
    check: (s, a) => (!isV2(s) ? tx('v2.only') : !atForecourt(s) ? tx('v2.train.notHere') : s.slot === 'evening' ? tx('train.closed')
      : !owns(s, a.skill) && SKILL_BOOK[a.skill]?.source !== 'train' ? tx('v2.drill.notBase') : levelOf(s, a.skill) >= TRAIN_CAP ? tx('v2.drill.cap', { skill: skillName(a.skill), cap: TRAIN_CAP }) : null),
    apply: (s, a, _r, emit) => {
      const r = learnOrRaise(s, a.skill, TRAIN_CAP);
      s.player.reputation = clamp(s.player.reputation + 1);
      emit({ kind: 'action', id: `drill:${a.skill}`, cause: 'action:drillSkill', visible: true, text: r === 'learnt' ? tx('v2.drill.logLearn', { skill: skillName(a.skill) }) : tx('v2.drill.logRaise', { skill: skillName(a.skill), level: levelOf(s, a.skill) }) });
    },
  },
  setLoadout: {
    by: null,
    // chosen at the match sheet (the interface): not listed among the place's actions
    list: () => [],
    label: () => tx('v2.loadout.label'),
    cost: () => 0,
    check: (s, a) => {
      if (!isV2(s)) return tx('v2.only');
      if (!Array.isArray(a.skills) || a.skills.length !== 4 || new Set(a.skills).size !== 4) return tx('v2.loadout.four');
      for (const id of a.skills) if (!owns(s, id)) return tx('v2.loadout.notOwned', { skill: SKILL_BOOK[id] ? skillName(id) : id });
      return null;
    },
    apply: (s, a, _r, emit) => { v2State(s).kit.loadout = [...a.skills]; emit({ kind: 'action', id: 'loadout', cause: 'action:setLoadout', visible: false, text: tx('v2.loadout.log', { skills: a.skills.map(skillName).join(', ') }) }); },
  },
};
