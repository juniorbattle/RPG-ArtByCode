import type { DynActionDef, DynActionId } from './dynamic';
import { DYNAMIC_DATA } from './dynamic';

/** The skills' catalogue of the version 2 (lot V2 of briefs/cloud-session-v2-brief.md, C4; the operator's decision AV-9 « Achat, entraînement
 *  et défi », journal Passe V2): twelve skills at most, in the three families of the specification (offensive, defensive, support [G1]), each
 *  with its charge time and its AP (src/combat/skills.ts: the levels, AV-8), and how it is obtained:
 *  - `start`: the four the player arrives with (today's loadout);
 *  - `buy`: from the weapon master, dear (`price` coins);
 *  - `train`: a slot on the practice sand, the base skills;
 *  - `challenge`: beating a fighter in town teaches its skill (`teacher`), as in Octopath Traveler, and raises it on a later win.
 *  The six skills the version 2 adds (`k_*`) have their numbers « proposé ». Pure data. */

export type SkillSource = 'start' | 'buy' | 'train' | 'challenge';
export interface SkillInfo { id: DynActionId; family: 'offensive' | 'defensive' | 'support'; source: SkillSource; price?: number; teacher?: string }

const ren = (o: Partial<DynActionDef> & Pick<DynActionDef, 'id' | 'name' | 'family'>): DynActionDef => ({
  owner: 'ren', kind: 'skill', prep: 0.35, impactAt: 0.16, follow: 0.26, recover: 0.12, damage: 0, resist: 0, anim: o.family === 'offensive' ? 'skillOff' : o.family === 'defensive' ? 'skillDef' : 'skillSup', ...o,
});

/** the six skills the version 2 adds, as actions of the player's seat (their numbers at level 1, before the charge's power: v2duel.ts) */
export const NEW_SKILLS: Record<string, DynActionDef> = {
  k_sunder: ren({ id: 'k_sunder', name: 'Sunder', family: 'offensive', prep: 0.45, damage: 16, resist: 30, apCost: 2 }),
  k_feint: ren({ id: 'k_feint', name: 'Feint', family: 'offensive', prep: 0.25, damage: 14, resist: 8, apCost: 1, ignoreGuard: true }),
  k_iron: ren({ id: 'k_iron', name: 'Iron Skin', family: 'defensive', prep: 0.3, impactAt: 0.1, follow: 0.2, recover: 0.1, apCost: 2, ward: { dur: 8, damage: 0.8, resist: 0.3 } }),
  k_parry: ren({ id: 'k_parry', name: 'Riposte Stance', family: 'defensive', prep: 0.2, impactAt: 0.1, follow: 0.2, recover: 0.1, apCost: 1, ward: { dur: 3, damage: 0.35, resist: 0.6 } }),
  k_cry: ren({ id: 'k_cry', name: 'Battle Cry', family: 'support', prep: 0.4, impactAt: 0.1, follow: 0.2, recover: 0.1, apCost: 2, boost: { dur: 5, damage: 1.45, resist: 1.2 } }),
  k_focus: ren({ id: 'k_focus', name: 'Focus', family: 'support', prep: 0.4, impactAt: 0.1, follow: 0.2, recover: 0.1, apCost: 2, boost: { dur: 10, damage: 1.1, resist: 2.0 } }),
};

/** every skill of the catalogue: today's six and the six new ones (twelve, the brief's « une douzaine au plus ») */
export const SKILL_BOOK: Record<string, SkillInfo> = {
  t1: { id: 't1', family: 'offensive', source: 'start' },
  t4: { id: 't4', family: 'offensive', source: 'start' },
  d1: { id: 'd1', family: 'defensive', source: 'start' },
  s1: { id: 's1', family: 'support', source: 'start' },
  t2: { id: 't2', family: 'offensive', source: 'train' },
  k_feint: { id: 'k_feint', family: 'offensive', source: 'train' },
  t3: { id: 't3', family: 'offensive', source: 'buy', price: 45 },
  k_sunder: { id: 'k_sunder', family: 'offensive', source: 'buy', price: 40 },
  k_iron: { id: 'k_iron', family: 'defensive', source: 'buy', price: 35 },
  k_cry: { id: 'k_cry', family: 'support', source: 'challenge', teacher: 'orla' },
  k_parry: { id: 'k_parry', family: 'defensive', source: 'challenge', teacher: 'ilse' },
  k_focus: { id: 'k_focus', family: 'support', source: 'challenge', teacher: 'vessa' },
};

/** a skill's action at level 1 (today's from DYNAMIC_DATA, the new ones from NEW_SKILLS) */
export function skillAction(id: string): DynActionDef {
  const a = (DYNAMIC_DATA.actions as Record<string, DynActionDef>)[id] ?? NEW_SKILLS[id];
  if (!a || a.owner !== 'ren' || a.kind !== 'skill') throw new Error(`no skill "${id}" in the catalogue`);
  return JSON.parse(JSON.stringify(a)) as DynActionDef;
}

/** the skill a fighter teaches by a challenge won (null: none) */
export function taughtBy(fighter: string): string | null {
  return Object.values(SKILL_BOOK).find((s) => s.teacher === fighter)?.id ?? null;
}
