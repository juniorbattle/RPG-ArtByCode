import type { DynActionDef, DynActionId } from './dynamic';

/** The player's skills and their levels (the operator's decision AV-8, « Un niveau par compétence », journal Passes AV1 / V1): each skill of
 *  the catalogue has a level, 1 to 5, that sets its power and its charge time under the three-button command (AV-5, the charged attack « comme
 *  Cyan », AV-7: the attack held passes its tiers one after the other, the skills ranked by their charge time). There is no level of the
 *  player (PROJECT_MASTER_CONTRACT § 7: no single level statistic). The action points stay (AV-6): a skill still costs its AP. Behind the
 *  version 2's flag (src/simulation/v2.ts). Pure data and pure functions.
 *  Numbers « proposé » (journal Passe V1): the skills from 3 to 10 s (« les compétences les plus puissantes nous obligeraient a charger pendant
 *  peut etre 10s »), each level 10 % more power.
 *  The heavy attack is a skill since the operator's decision A3 of 2026-11-04 (journal Passe CH1, word for word: « On peut la retirer mais donc on
 *  devra aussi revoir le temps de chargement des autres actions qui seront legerement plus courts attaque puissante deviendra une des competences
 *  par exemple.. »): no tier of its own at 2 s any more (HEAVY_AT and the floor « 0.25 s after it » are gone), it is brought or not among the four
 *  like the others, with its levels; and every charge time is a little shorter: CHARGE_TRIM of the times of journal Passe V1 (the operator's CH-1 « 0,85 (−15 %) », journal Passe CH2). */

export const MAX_LEVEL = 5;
/** each level's power: damage, a ward's or a boost's duration */
export const LEVEL_POWER = [1.0, 1.1, 1.2, 1.3, 1.4] as const;
/** the charge times' share of journal Passe V1's (« legerement plus courts », journal Passe CH1; the operator's CH-1 « 0,85 (−15 %) », journal Passe CH2),
 *  rounded to 0.05 s */
export const CHARGE_TRIM = 0.85;

export type Times = readonly [number, number, number, number, number];
export interface SkillDef {
  id: DynActionId;
  /** the charge time at each level (s), level 1 first: shorter as the level rises */
  charge: Times;
  /** how the skill is learnt (lot V2): bought from the weapon master, trained on the practice sand, or won by a challenge in town */
  source: 'start' | 'buy' | 'train' | 'challenge';
}

/** the charge times before the trim (journal Passe V1; the heavy's from the 2 s of its old tier, shorter by level as Flash cut's) */
export const BASE_CHARGE: Record<string, Times> = {
  heavy: [2.0, 1.85, 1.7, 1.6, 1.5],
  t1: [4.0, 3.75, 3.5, 3.25, 3.0], t2: [4.5, 4.2, 3.9, 3.6, 3.4], t3: [6.0, 5.6, 5.2, 4.8, 4.5], t4: [9.0, 8.2, 7.4, 6.7, 6.0],
  d1: [3.5, 3.3, 3.1, 2.9, 2.7], s1: [5.0, 4.7, 4.4, 4.1, 3.8],
  k_sunder: [5.5, 5.1, 4.7, 4.4, 4.0], k_feint: [3.0, 2.9, 2.8, 2.7, 2.6], k_iron: [4.5, 4.2, 3.9, 3.6, 3.3], k_parry: [2.8, 2.7, 2.6, 2.5, 2.4],
  k_cry: [4.2, 3.9, 3.6, 3.4, 3.2], k_focus: [6.5, 6.0, 5.5, 5.0, 4.6],
};
/** a base's times at a trim, rounded to 0.05 s, a half up (1.5 x 0.85 = 1.275 -> 1.3: the float 1.27499... would round down) */
export const trimmed = (t: Times, k = CHARGE_TRIM): Times => t.map((x) => +(Math.round((x * k) / 0.05 + 1e-9) * 0.05).toFixed(2)) as unknown as Times;

/** the heavy attack, today's six skills of the « tour par tour dynamique » (src/combat/dynamic.ts), with their charge times; the catalogue of lot
 *  V2 extends it */
const SOURCE: Record<string, SkillDef['source']> = {
  heavy: 'start', t1: 'start', t2: 'train', t3: 'buy', t4: 'start', d1: 'start', s1: 'start',
  // the six the version 2 adds (lot V2, src/combat/skillbook.ts: their actions and how they are obtained)
  k_sunder: 'buy', k_feint: 'train', k_iron: 'buy', k_parry: 'challenge', k_cry: 'challenge', k_focus: 'challenge',
};
/** the rivals' signature attacks in Ren's catalogue (the operator's SK-7 « Deux temps : le soutien au jour 1, la signature dès le jour 6 » and SK-8 « Ces nombres »,
 *  the sheet https://claude.ai/artifact/2KKiD7u2rzxtWc6NE9CfVX, journal Passe SK2): their rival's own charge at level 1 (src/combat/autoData.ts AUTO_FOES, not trimmed), each level on the pattern of Ren's skill of the same role (the
 *  Flash cut's for a punish, the Lunge's for a pierce, Tourbillon's for a breaker, the Thrust's for an exploit, Breach's for an opener), to 0.05 s */
export const SIGNATURE_CHARGE: Record<string, Times> = {
  m_lunge: [3, 2.8, 2.65, 2.45, 2.25], m_wild: [3.9, 3.65, 3.35, 3.15, 2.95], m_riposte: [3.4, 3.15, 2.9, 2.7, 2.55], m_shoulder: [3.7, 3.4, 3.15, 2.95, 2.7],
  m_smite: [3.8, 3.45, 3.15, 2.85, 2.55], m_ironfall: [4.3, 3.9, 3.55, 3.2, 2.85], m_cleave: [4.4, 4.1, 3.8, 3.55, 3.3],
};
/** the skills the town fighters teach (the operator's NC-1 « Adopter ces cinq, enseignées par les combattants de la ville » and NC-3 to NC-7 « Ces nombres », the sheet
 *  https://claude.ai/artifact/FJdfCEs4igBxqgtVeQj5pV, journal Passe SK4): each the charge of Ren's skill it is measured against, by level (the Finishing Blow the Thrust's,
 *  Disarm and Wrist Strike the Flash cut's, Sidestep the Rampart's, Second Wind the Fervour's) */
export const TOWN_CHARGE: Record<string, Times> = {
  n_grace: [7.65, 6.95, 6.3, 5.7, 5.1], n_disarm: [3.4, 3.2, 3.0, 2.75, 2.55], n_wrist: [3.4, 3.2, 3.0, 2.75, 2.55],
  n_sidestep: [3.0, 2.8, 2.65, 2.45, 2.3], n_wind: [4.25, 4.0, 3.75, 3.5, 3.25],
};
export const SKILLS: Record<string, SkillDef> = {
  ...Object.fromEntries(Object.entries(BASE_CHARGE).map(([id, t]) => [id, { id: id as DynActionId, charge: trimmed(t), source: SOURCE[id] }])),
  ...Object.fromEntries(Object.entries(SIGNATURE_CHARGE).map(([id, t]) => [id, { id: id as DynActionId, charge: t, source: 'challenge' as const }])),
  ...Object.fromEntries(Object.entries(TOWN_CHARGE).map(([id, t]) => [id, { id: id as DynActionId, charge: t, source: 'challenge' as const }])),
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
