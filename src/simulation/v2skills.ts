import { clamp, type GameState, type V2State } from './state';
import type { Emit } from './advance';
import type { ActionDef } from './actions';
import { isV2, v2KitOf } from './v2';
import { SIGNATURES, SIGNATURE_DAY, SKILL_BOOK, taughtBy } from '../combat/skillbook';
import { MAX_LEVEL, chargeTime } from '../combat/skills';
import { joined, skillName, tx, type TextKey } from '../narrative/text';
import { sandRefusal } from './v2rivals';
import { AUTO_CONDS_OF, AUTO_SKILLS, autoCondsFor, autoOrderOf, kitRankFault } from '../combat/autoData';
import type { AutoCond } from '../combat/auto';

/** The skills of a version 2 game (lot V2, C4; the operator's decision AV-9 « Achat, entraînement et défi », journal Passe V2): the skills the
 *  player owns and their levels (`s.v2.kit.levels`, AV-8), the four brought to a duel (`s.v2.kit.loadout`), and the three ways to obtain one:
 *  bought from the weapon master (dear), drilled on the practice sand (a slot: a base skill learnt, or a level gained, up to TRAIN_CAP), won by
 *  a challenge in town (lot V4: `learnFromChallenge`). The four are chosen at the match sheet (`setLoadout`, a minor action). Only a version 2
 *  game offers these actions; the default game never lists them. Pure. */

/** training raises a skill to this level at most, and so does a challenge won (the operator's GP-16 « Les corriger », journal Passe GP2: a challenge of the second
 *  phase took a skill to level 4 without a lesson); the levels above come from Master Corvin's lessons alone (« proposé ») */
export const TRAIN_CAP = 3;
/** Master Corvin's lessons (the operator's NC-11 « (a) Les leçons de maître Corvin, 30 / 60 pièces », the sheet https://claude.ai/artifact/FJdfCEs4igBxqgtVeQj5pV,
 *  journal Passe SK4): from the bracket's first day, a skill drilled to the training's cap is taken a level further, a slot and its price (level 4, level 5); the
 *  training stays at TRAIN_CAP. Measured in journal Passe SK3: the titles unchanged, the free slots limiting, the purse of day 10 given a use */
export const LESSON = { day: 6, price: { 4: 30, 5: 60 } as Readonly<Record<number, number>> };
/** a lesson's price to reach this level (0: none) */
export const lessonPrice = (level: number): number => LESSON.price[level] ?? 0;
/** the master's fifth off of the day (his open lesson, the event v2-masterclass; the day after a challenge won, v2-challenge-fame « teaches the winner at a fifth
 *  off »): on the skills he sells and, since the operator's GP-16 « Les corriger » (journal Passe GP2), on his lessons too */
const masterDiscount = (s: GameState): number => (s.flags[`lesson:${s.day}`] ? 0.8 : 1);
/** what a lesson to this level costs today: its price, less the master's fifth off of the day */
export const lessonCost = (s: GameState, level: number): number => Math.round(lessonPrice(level) * masterDiscount(s));

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

/** the skill a challenge won against this fighter teaches today (the operator's SK-7 « Deux temps : le soutien au jour 1, la signature dès le jour 6 », journal Passe
 *  SK2): before day 6 the support or defence of Orla, Ilse and Vessa, from day 6 every rival's signature attack; a generic fighter none. None either once the player
 *  holds that skill at the training's cap (the operator's GP-16 « Les corriger », journal Passe GP2: the sand teaches up to TRAIN_CAP, Master Corvin's lessons beyond):
 *  the challenge's label then promises no skill */
export function challengeSkill(s: GameState, fighter: string): string | null {
  // (a fighter without a signature, a town fighter, teaches what it teaches in both phases: the operator's NC-8 « Ainsi », journal Passe SK4; Corra none, NC-2)
  const id = s.day >= SIGNATURE_DAY ? SIGNATURES[fighter] ?? taughtBy(fighter) : taughtBy(fighter);
  return id && levelOf(s, id) < TRAIN_CAP ? id : null;
}

/** a challenge won against this fighter (lot V4): its skill learnt, or raised up to the training's cap (GP-16); null when the fighter teaches none, or none more */
export function learnFromChallenge(s: GameState, fighter: string, emit: Emit): string | null {
  const id = challengeSkill(s, fighter);
  if (!id) return null;
  const r = learnOrRaise(s, id, TRAIN_CAP);
  emit({ kind: 'action', id: `skill:${r}`, cause: `challenge:${fighter}`, visible: true, text: r === 'learnt' ? tx('v2.skill.learnt', { skill: skillName(id) }) : tx('v2.skill.raised', { skill: skillName(id), level: levelOf(s, id) }) });
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
  // the master's open lesson (lot V7, the event v2-masterclass), and the day after a challenge won: a fifth less that day
  return Math.round(p * (s.player.reputation >= 40 ? 0.9 : 1) * masterDiscount(s));
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
  | { type: 'lessonSkill'; skill: string }
  | { type: 'setLoadout'; skills: string[] }
  | { type: 'setOrder'; skills: string[]; foe?: string }
  | { type: 'setTactic'; skill: string; cond: string; foe?: string }
  | { type: 'setMode'; mode: 'auto' | 'manual' };

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
      !owns(s, a.skill) && SKILL_BOOK[a.skill]?.source !== 'train' ? tx('v2.drill.notBase') : levelOf(s, a.skill) >= TRAIN_CAP ? tx('v2.drill.capTop', { skill: skillName(a.skill), cap: TRAIN_CAP, day: LESSON.day }) : null)),
    apply: (s, a, _r, emit) => {
      const r = learnOrRaise(s, a.skill, TRAIN_CAP);
      s.player.reputation = clamp(s.player.reputation + 1);
      emit({ kind: 'action', id: `drill:${a.skill}`, cause: 'action:drillSkill', visible: true, text: r === 'learnt' ? tx('v2.drill.logLearn', { skill: skillName(a.skill) }) : tx('v2.drill.logRaise', { skill: skillName(a.skill), level: levelOf(s, a.skill) }) });
    },
  },
  // Master Corvin's lesson (NC-11): from day 6, a skill at the training's cap (or one level above it) taken a level further, a slot and 30 or 60 coins
  lessonSkill: {
    by: 'corvin',
    list: (s) => (isV2(s) && atForecourt(s) && s.day >= LESSON.day ? Object.values(SKILL_BOOK).filter((k) => levelOf(s, k.id) >= TRAIN_CAP && levelOf(s, k.id) < MAX_LEVEL).map((k) => ({ type: 'lessonSkill', skill: k.id })) : []),
    label: (s, a) => tx('v2.lesson.label', { skill: skillName(a.skill), level: levelOf(s, a.skill) + 1, price: lessonCost(s, levelOf(s, a.skill) + 1) }),
    cost: () => 1,
    coins: (s, a) => lessonCost(s, levelOf(s, a.skill) + 1),
    check: (s, a) => {
      if (!isV2(s)) return tx('v2.only');
      if (!atForecourt(s)) return tx('v2.buySkill.notHere');
      if (s.slot === 'evening') return tx('v2.buySkill.closed');
      if (s.day < LESSON.day) return tx('v2.lesson.early', { cap: TRAIN_CAP, day: LESSON.day });
      const lv = levelOf(s, a.skill);
      if (!SKILL_BOOK[a.skill] || lv < TRAIN_CAP) return tx('v2.lesson.drill', { skill: skillName(a.skill), cap: TRAIN_CAP });
      if (lv >= MAX_LEVEL) return tx('v2.lesson.top', { skill: skillName(a.skill) });
      const p = lessonCost(s, lv + 1);
      return s.player.coins < p ? tx('v2.buySkill.poor', { price: p }) : null;
    },
    apply: (s, a, _r, emit) => {
      const k = v2State(s).kit, to = (k.levels[a.skill] ?? 0) + 1, p = lessonCost(s, to);
      s.player.coins -= p; k.levels[a.skill] = to;
      emit({ kind: 'action', id: `lesson:${a.skill}`, cause: 'action:lessonSkill', visible: true, text: tx('v2.lesson.log', { skill: skillName(a.skill), price: p, level: to }) });
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
      // one ultimate and one super at most among the four (the operator's SK-2 « Quatre places : une ultime au plus, une super au plus », journal Passe SK2)
      const fault = kitRankFault(a.skills);
      if (fault) return tx(fault === 'ultimate' ? 'v2.loadout.ultimate' : 'v2.loadout.super');
      return null;
    },
    apply: (s, a, _r, emit) => {
      const k = v2State(s).kit, was = [...k.loadout], out = was.filter((x) => !a.skills.includes(x)), inn = a.skills.filter((x) => !was.includes(x));
      // one skill for another (the page's replacement, the operator's CM-02): the newcomer takes the leaver's place in every order kept (the general plan's and each rival's)
      if (out.length === 1 && inn.length === 1) {
        const put = (o: string[] | undefined): void => { const i = o?.indexOf(out[0]) ?? -1; if (o && i >= 0) o[i] = inn[0]; };
        put(k.order); for (const p of Object.values(k.plans ?? {})) put(p.order);
      }
      k.loadout = [...a.skills]; emit({ kind: 'action', id: 'loadout', cause: 'action:setLoadout', visible: false, text: tx('v2.loadout.log', { skills: joined(a.skills.map(skillName)) }) });
    },
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
  },  /** the combat mode (the operator's CM-07 « Adopter les deux modes et amender le § 6.1 (décision A3) », journal Passe CM2): auto (the plan launches the skills) or manual (the
   *  player does); kept in the kit, absent = auto (a game that never touches it keeps its fingerprint), a minor action as the order and the tactic are */
  setMode: {
    by: null,
    list: () => [],
    label: () => tx('v2.mode.label'),
    cost: () => 0,
    check: (s, a) => {
      if (!isV2(s)) return tx('v2.only');
      return a.mode === 'auto' || a.mode === 'manual' ? null : tx('v2.mode.bad');
    },
    apply: (s, a, _r, emit) => {
      const k = v2State(s).kit;
      if (a.mode === 'manual') k.mode = 'manual'; else delete k.mode;
      emit({ kind: 'action', id: 'mode', cause: 'action:setMode', visible: false, text: tx('v2.mode.log', { mode: tx(a.mode === 'manual' ? 'v2.mode.manual' : 'v2.mode.auto') }) });
    },
  },
};
