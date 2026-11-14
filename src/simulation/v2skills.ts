import { clamp, type GameState, type V2State } from './state';
import type { Emit } from './advance';
import type { ActionDef } from './actions';
import { isV2, v2KitOf } from './v2';
import { LATE_TEACHER, SKILL_BOOK, taughtBy } from '../combat/skillbook';
import { MAX_LEVEL, chargeTime } from '../combat/skills';
import { joined, skillName, tx, type TextKey } from '../narrative/text';
import { sandRefusal } from './v2rivals';
import { AUTO_CONDS_OF, AUTO_SKILLS, autoCondsFor, autoOrderOf } from '../combat/autoData';
import type { AutoCond } from '../combat/auto';

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
/** the plan of combat an action writes (lot 2 of « La Brute », briefs/combat-auto.md § 33.5 « un plan par rival »): the general one (the kit's order and tactic,
 *  the skills page's), or the one kept for `foe` (its match sheet's), begun from the general plan the first time it is set */
function planOf(s: GameState, foe: string | undefined): { order?: string[]; tactic?: Record<string, string> } {
  const k = v2State(s).kit;
  if (!foe) return k;
  const plans = (k.plans ??= {});
  return (plans[foe] ??= { ...(k.order ? { order: [...k.order] } : {}), ...(k.tactic ? { tactic: { ...k.tactic } } : {}) });
}
/** a rival's name or a fighter's, as the log says it */
const foeOk = (foe: unknown): boolean => foe === undefined || (typeof foe === 'string' && /^[a-z_]{2,24}$/.test(foe));

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
  // (a rival out of the title teaches a skill of the catalogue from day 6, lot L2b)
  const id = taughtBy(fighter) ?? LATE_TEACHER[fighter] ?? null;
  if (!id) return null;
  const r = learnOrRaise(s, id);
  emit({ kind: 'action', id: `skill:${r}`, cause: `challenge:${fighter}`, visible: true, text: r === 'learnt' ? tx('v2.skill.learnt', { skill: skillName(id) }) : r === 'raised' ? tx('v2.skill.raised', { skill: skillName(id), level: levelOf(s, id) }) : tx('v2.skill.max', { skill: skillName(id) }) });
  return id;
}

/** the sand's lesson (the operator's BL1-4 « Au lot 3 : la ville nourrit le build », journal Passe BL1; lot 3 of « La Brute »): a challenge won in town raises by
 *  `levels` the first offensive skill of the general plan's order (the four brought, autoOrderOf: the player's order, else the strongest first) still under `cap`
 *  (the training's cap: the levels above come from the challenges' teachers and the master). « proposé », measured on the curious player (journal Passe BL3) */
export const SAND_LESSON = { cap: TRAIN_CAP, levels: 1 };
/** the skill a challenge won would raise now (the sand's lesson), or null when every offensive skill of the four is at the cap */
export function sandLessonSkill(s: GameState): string | null {
  const k = v2KitOf(s);
  return autoOrderOf(k).find((id) => AUTO_SKILLS[id]?.family === 'offensive' && (k.levels[id] ?? 0) > 0 && (k.levels[id] ?? 0) < SAND_LESSON.cap) ?? null;
}
/** a challenge won: the sand's lesson given, said in the log; the skill raised, or null */
export function sandLesson(s: GameState, fighter: string, emit: Emit): string | null {
  const id = sandLessonSkill(s);
  if (!id || SAND_LESSON.levels <= 0) return null;
  const k = v2State(s).kit;
  k.levels[id] = Math.min(SAND_LESSON.cap, (k.levels[id] ?? 1) + SAND_LESSON.levels);
  emit({ kind: 'action', id: 'skill:sand', cause: `challenge:${fighter}`, visible: true, text: tx('v2.skill.sand', { skill: skillName(id), level: k.levels[id] }) });
  return id;
}

/** the weapon master's price for a skill: its list price, less a tenth for a good name in the pool (reputation 40 or more) (« proposé ») */
export function skillPrice(s: GameState, id: string): number {
  const p = SKILL_BOOK[id]?.price ?? 0;
  // the master's open lesson (lot V7, the event v2-masterclass): a fifth less that day
  return Math.round(p * (s.player.reputation >= 40 ? 0.9 : 1) * (s.flags[`lesson:${s.day}`] ? 0.8 : 1));
}

/** a tactic's condition in words (the match sheet, the skills page, the journal) */
export const COND_TEXT: Record<AutoCond, TextKey> = {
  auto: 'auto.cond.auto', ready: 'auto.cond.ready', broken: 'auto.cond.broken', incoming: 'auto.cond.incoming', gauge: 'auto.cond.gauge',
  hurt: 'auto.cond.hurt', finish: 'auto.cond.finish', follow: 'auto.cond.follow', open: 'auto.cond.open', start: 'auto.cond.start', foeGauge: 'auto.cond.foeGauge',
  warded: 'auto.cond.warded', never: 'auto.cond.never',
};

export type V2SkillAction =
  | { type: 'buySkill'; skill: string }
  | { type: 'drillSkill'; skill: string }
  | { type: 'setLoadout'; skills: string[] }
  | { type: 'setOrder'; skills: string[]; foe?: string }
  | { type: 'setTactic'; skill: string; cond: string; foe?: string };

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
    // lot L4 (EV-7 / EV-9): the sand shut the morning after a brawl, or taken by Rhosk (src/simulation/v2rivals.ts)
    check: (s, a) => (!isV2(s) ? tx('v2.only') : !atForecourt(s) ? tx('v2.train.notHere') : s.slot === 'evening' ? tx('train.closed') : sandRefusal(s) ?? (
      !owns(s, a.skill) && SKILL_BOOK[a.skill]?.source !== 'train' ? tx('v2.drill.notBase') : levelOf(s, a.skill) >= TRAIN_CAP ? tx(SKILL_BOOK[a.skill]?.teacher || Object.values(LATE_TEACHER).includes(a.skill) ? 'v2.drill.cap' : 'v2.drill.capTop', { skill: skillName(a.skill), cap: TRAIN_CAP }) : null)),
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
      // the heavy attack, a base attack of every fighter since SY-02 (A3): never one of the four (SL1-7)
      if (a.skills.includes('heavy')) return tx('v2.loadout.heavy');
      for (const id of a.skills) if (!owns(s, id)) return tx('v2.loadout.notOwned', { skill: SKILL_BOOK[id] ? skillName(id) : id });
      return null;
    },
    apply: (s, a, _r, emit) => { v2State(s).kit.loadout = [...a.skills]; emit({ kind: 'action', id: 'loadout', cause: 'action:setLoadout', visible: false, text: tx('v2.loadout.log', { skills: joined(a.skills.map(skillName)) }) }); },
  },
  /** the order of priority of the four brought, that the automatic follows in the duel played by the computer (the operator's AC-09 « L’automatique qui place
   *  ses soutiens ; le joueur règle ses quatre compétences et leur ordre », journal Passe AC4): set on the match sheet (lot 2, journal Passe LC3), a minor action
   *  as the four are; a skill brought later takes its place after the others (autoRen) */
  setOrder: {
    by: null,
    list: () => [],
    label: () => tx('v2.order.label'),
    cost: () => 0,
    check: (s, a) => {
      if (!isV2(s)) return tx('v2.only');
      const four = v2KitOf(s).loadout as string[];
      if (!Array.isArray(a.skills) || a.skills.length !== four.length || new Set(a.skills).size !== four.length || a.skills.some((id) => !four.includes(id))) return tx('v2.order.four');
      if (!foeOk(a.foe)) return tx('v2.order.four');
      return null;
    },
    apply: (s, a, _r, emit) => { planOf(s, a.foe).order = [...a.skills]; emit({ kind: 'action', id: 'order', cause: 'action:setOrder', visible: false, text: tx('v2.order.log', { skills: joined(a.skills.map(skillName)) }) }); },
  },
  /** the tactic (the operator's SY-08 « Une condition par compétence, l’ordre gardé », journal Passe SY2): one of the four brought takes a condition (src/combat/auto.ts
   *  AutoCond), set on the match sheet and the skills page as the order is, a minor action; 'auto' gives the skill back to the automatic's own rule. The tactic decides
   *  the duel, so it is part of the game (its fingerprint) */
  setTactic: {
    by: null,
    list: () => [],
    label: () => tx('v2.tactic.label'),
    cost: () => 0,
    check: (s, a) => {
      if (!isV2(s)) return tx('v2.only');
      if (!(v2KitOf(s).loadout as string[]).includes(a.skill)) return tx('v2.tactic.notBrought');
      const fam = AUTO_SKILLS[a.skill]?.family;
      // a condition of its role (the plan's page since lot 2 of « La Brute ») or of its family (the page of before)
      if (!fam || !(autoCondsFor(a.skill).includes(a.cond as never) || AUTO_CONDS_OF[fam].includes(a.cond as never))) return tx('v2.tactic.cond');
      if (!foeOk(a.foe)) return tx('v2.tactic.cond');
      return null;
    },
    apply: (s, a, _r, emit) => {
      const k = planOf(s, a.foe), t = { ...(k.tactic ?? {}) };
      if (a.cond === 'auto') delete t[a.skill]; else t[a.skill] = a.cond;
      if (Object.keys(t).length) k.tactic = t; else delete k.tactic;
      emit({ kind: 'action', id: 'tactic', cause: 'action:setTactic', visible: false, text: tx('v2.tactic.log', { skill: skillName(a.skill), cond: tx(COND_TEXT[a.cond as AutoCond]) }) });
    },
  },
};
