import type { DynActionDef, DynActionId } from './dynamic';
import { DYNAMIC_DATA } from './dynamic';

/** The skills' catalogue of the version 2 (lot V2 of briefs/cloud-session-v2-brief.md, C4; the operator's decision AV-9 « Achat, entraînement
 *  et défi », journal Passe V2): twelve skills at most, in the three families of the specification (offensive, defensive, support [G1]), each
 *  with its charge time and its AP (src/combat/skills.ts: the levels, AV-8), and how it is obtained:
 *  - `start`: the four the player arrives with (today's loadout);
 *  - `buy`: from the weapon master, dear (`price` coins);
 *  - `train`: a slot on the practice sand, the base skills;
 *  - `challenge`: beating a fighter in town teaches its skill (`teacher`), as in Octopath Traveler, and raises it on a later win.
 *  The six skills the version 2 adds (`k_*`) have their numbers « proposé ». Since the operator's sheet of the skills' structure (journal Passe SK2) the catalogue
 *  holds nineteen: the seven rivals' signature attacks (`signature`), learnt by a challenge won from day 6 (SK-12 « La lever : dix-neuf compétences »). Pure data. */

export type SkillSource = 'start' | 'buy' | 'train' | 'challenge';
export interface SkillInfo { id: DynActionId; family: 'offensive' | 'defensive' | 'support'; source: SkillSource; price?: number; teacher?: string; signature?: string }

const ren = (o: Partial<DynActionDef> & Pick<DynActionDef, 'id' | 'name' | 'family'>): DynActionDef => ({
  owner: 'ren', kind: 'skill', prep: 0.35, impactAt: 0.16, follow: 0.26, recover: 0.12, damage: 0, resist: 0, anim: o.family === 'offensive' ? 'skillOff' : o.family === 'defensive' ? 'skillDef' : 'skillSup', ...o,
});

/** the six skills the version 2 adds, as actions of the player's seat (their numbers at level 1, before the charge's power: v2duel.ts) */
export const NEW_SKILLS: Record<string, DynActionDef> = {
  k_sunder: ren({ id: 'k_sunder', name: 'Breach', family: 'offensive', prep: 0.45, damage: 16, resist: 30, apCost: 2 }),
  k_feint: ren({ id: 'k_feint', name: 'Feint', family: 'offensive', prep: 0.25, damage: 14, resist: 8, apCost: 1, ignoreGuard: true }),
  k_iron: ren({ id: 'k_iron', name: 'Iron Skin', family: 'defensive', prep: 0.3, impactAt: 0.1, follow: 0.2, recover: 0.1, apCost: 2, ward: { dur: 8, damage: 0.8, resist: 0.3 } }),
  k_parry: ren({ id: 'k_parry', name: 'Riposte Stance', family: 'defensive', prep: 0.2, impactAt: 0.1, follow: 0.2, recover: 0.1, apCost: 1, ward: { dur: 3, damage: 0.35, resist: 0.6 } }),
  k_cry: ren({ id: 'k_cry', name: 'Battle Cry', family: 'support', prep: 0.4, impactAt: 0.1, follow: 0.2, recover: 0.1, apCost: 2, boost: { dur: 5, damage: 1.45, resist: 1.2 } }),
  k_focus: ren({ id: 'k_focus', name: 'Focus', family: 'support', prep: 0.4, impactAt: 0.1, follow: 0.2, recover: 0.1, apCost: 2, boost: { dur: 10, damage: 1.1, resist: 2.0 } }),
};

/** every skill of the catalogue: the heavy attack (journal Passe CH1), today's six and the six new ones (thirteen: the brief's « une douzaine au
 *  plus » and the heavy attack, which was the command's own tier before) */
export const SKILL_BOOK: Record<string, SkillInfo> = {
  // the heavy attack, a skill since the operator's decision A3 of 2026-11-04 (journal Passe CH1): owned from the start, drilled as the others
  heavy: { id: 'heavy', family: 'offensive', source: 'start' },
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
  // the rivals' signature attacks (the operator's SK-7 and SK-12 « La lever : dix-neuf compétences », the sheet https://claude.ai/artifact/2KKiD7u2rzxtWc6NE9CfVX, journal Passe SK2): a challenge won against that rival from day 6
  m_ironfall: { id: 'm_ironfall', family: 'offensive', source: 'challenge', signature: 'marek' },
  m_smite: { id: 'm_smite', family: 'offensive', source: 'challenge', signature: 'ilse' },
  m_wild: { id: 'm_wild', family: 'offensive', source: 'challenge', signature: 'tobin' },
  m_cleave: { id: 'm_cleave', family: 'offensive', source: 'challenge', signature: 'rhosk' },
  m_riposte: { id: 'm_riposte', family: 'offensive', source: 'challenge', signature: 'cassius' },
  m_shoulder: { id: 'm_shoulder', family: 'offensive', source: 'challenge', signature: 'orla' },
  m_lunge: { id: 'm_lunge', family: 'offensive', source: 'challenge', signature: 'vessa' },
};

/** a skill's action at level 1 (today's and the heavy attack from DYNAMIC_DATA, the new ones from NEW_SKILLS) */
export function skillAction(id: string): DynActionDef {
  const a = (DYNAMIC_DATA.actions as Record<string, DynActionDef>)[id] ?? NEW_SKILLS[id];
  if (!a || a.owner !== 'ren' || (a.kind !== 'skill' && id !== 'heavy')) throw new Error(`no skill "${id}" in the catalogue`);
  // the heavy attack keeps its kind (its blow, its sound, its effect); as a skill it is an offensive one (journal Passe CH1)
  return { ...(JSON.parse(JSON.stringify(a)) as DynActionDef), ...(id === 'heavy' ? { family: 'offensive' as const } : {}) };
}

/** the day from which a challenge won teaches a rival's signature attack (the operator's SK-7 « Deux temps : le soutien au jour 1, la signature dès le jour 6 »,
 *  the sheet https://claude.ai/artifact/2KKiD7u2rzxtWc6NE9CfVX, journal Passe SK2): the second phase of the challenges (src/simulation/v2town.ts RIVALS_CHALLENGE_DAY, the day the rivals out of the title can be challenged). Before it,
 *  Orla, Ilse and Vessa teach their support or defence (`teacher`); from it, every rival its signature. LATE_TEACHER (Marek's Iron Skin, Cassius's Feint, Rhosk's
 *  Sunder, Tobin's Lunge) gave way to it: those four are bought or drilled, and no player of the laboratory carried them (journal Passe SK1) */
export const SIGNATURE_DAY = 6;
/** each rival's signature attack (SK-7) */
export const SIGNATURES: Record<string, string> = Object.fromEntries(Object.values(SKILL_BOOK).filter((k) => k.signature).map((k) => [k.signature!, k.id]));

/** the skill a fighter teaches by a challenge won (null: none) */
export function taughtBy(fighter: string): string | null {
  return Object.values(SKILL_BOOK).find((s) => s.teacher === fighter)?.id ?? null;
}
