import type { DynActionDef, DynActionId } from './dynamic';

/** The player's skills and their levels (the operator's decision AV-8, « Un niveau par compétence », journal Passes AV1 / V1): each skill of
 *  the catalogue has a level, 1 to 5, that sets its power and its charge time under the three-button command (AV-5, the charged attack « comme
 *  Cyan », AV-7: the attack held passes its tiers one after the other, the skills ranked by their charge time). There is no level of the
 *  player (PROJECT_MASTER_CONTRACT § 7: no single level statistic). The action points stay (AV-6): a skill still costs its AP. Behind the
 *  version 2's flag (src/simulation/v2.ts). Pure data and pure functions.
 *  Numbers « proposé » (journal Passe V1): the heavy attack at 2 s of hold (the operator's « 2-3 s », its low end), the skills from 3 to 10 s
 *  (« les compétences les plus puissantes nous obligeraient a charger pendant peut etre 10s »), each level 10 % more power. */

export const MAX_LEVEL = 5;
/** the hold that turns a tap into the heavy attack (s) */
export const HEAVY_AT = 2.0;
/** each level's power: damage, a ward's or a boost's duration */
export const LEVEL_POWER = [1.0, 1.1, 1.2, 1.3, 1.4] as const;

export interface SkillDef {
  id: DynActionId;
  /** the charge time at each level (s), level 1 first: shorter as the level rises */
  charge: readonly [number, number, number, number, number];
  /** how the skill is learnt (lot V2): bought from the weapon master, trained on the practice sand, or won by a challenge in town */
  source: 'start' | 'buy' | 'train' | 'challenge';
}

/** today's six skills of the « tour par tour dynamique » (src/combat/dynamic.ts), with their charge times; the catalogue of lot V2 extends it */
export const SKILLS: Record<string, SkillDef> = {
  t1: { id: 't1', charge: [4.0, 3.75, 3.5, 3.25, 3.0], source: 'start' },
  t2: { id: 't2', charge: [4.5, 4.2, 3.9, 3.6, 3.4], source: 'train' },
  t3: { id: 't3', charge: [6.0, 5.6, 5.2, 4.8, 4.5], source: 'buy' },
  t4: { id: 't4', charge: [9.0, 8.2, 7.4, 6.7, 6.0], source: 'start' },
  d1: { id: 'd1', charge: [3.5, 3.3, 3.1, 2.9, 2.7], source: 'start' },
  s1: { id: 's1', charge: [5.0, 4.7, 4.4, 4.1, 3.8], source: 'start' },
  // the six the version 2 adds (lot V2, src/combat/skillbook.ts: their actions and how they are obtained)
  k_sunder: { id: 'k_sunder', charge: [5.5, 5.1, 4.7, 4.4, 4.0], source: 'buy' },
  k_feint: { id: 'k_feint', charge: [3.0, 2.9, 2.8, 2.7, 2.6], source: 'train' },
  k_iron: { id: 'k_iron', charge: [4.5, 4.2, 3.9, 3.6, 3.3], source: 'buy' },
  k_parry: { id: 'k_parry', charge: [2.8, 2.7, 2.6, 2.5, 2.4], source: 'challenge' },
  k_cry: { id: 'k_cry', charge: [4.2, 3.9, 3.6, 3.4, 3.2], source: 'challenge' },
  k_focus: { id: 'k_focus', charge: [6.5, 6.0, 5.5, 5.0, 4.6], source: 'challenge' },
};

export const clampLevel = (n: number): number => Math.max(1, Math.min(MAX_LEVEL, Math.round(n)));

/** a skill's charge time at its level */
export function chargeTime(id: string, level: number): number {
  const s = SKILLS[id];
  if (!s) throw new Error(`no skill "${id}" in the catalogue`);
  return s.charge[clampLevel(level) - 1];
}

/** a skill's definition at its level: its damage, what it adds to the gauge and its effect's duration raised by the level's power */
export function atLevel(a: DynActionDef, level: number): DynActionDef {
  const k = LEVEL_POWER[clampLevel(level) - 1], out: DynActionDef = JSON.parse(JSON.stringify(a));
  out.damage = Math.round(a.damage * k);
  out.resist = +(a.resist * k).toFixed(2);
  if (out.ward) out.ward.dur = +(a.ward!.dur * k).toFixed(2);
  if (out.boost) out.boost.dur = +(a.boost!.dur * k).toFixed(2);
  return out;
}
