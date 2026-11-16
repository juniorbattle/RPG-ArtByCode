import { AUTO_RULES, type AutoInflict, type AutoStateId } from '../combat/auto';
import { AUTO_GEAR_FX, AUTO_SKILL_STATES, AUTO_STYLES } from '../combat/autoData';

/** LABORATORY ONLY — the harmful states (journal Passes GP4-1, GP4-2; briefs/combat-auto.md § 41). The four states decided on the operator's sheet
 *  https://claude.ai/artifact/DqsBjqLm1UQG4ChPC2EeRW are the game's (src/combat/auto.ts AUTO_RULES.states, src/combat/autoData.ts AUTO_SKILL_STATES, AUTO_STYLES,
 *  STATE_*_FAMILIES); this file changes the game's tables for one process (tools/auto-states.mjs): a weapon family on a piece, a protection, the
 *  candidates of the operator's note on GE-1 (« paralysie, baisse attaque ( malediction ), baisse defense ( affaiblissement ) peuvent etre des options aussi interessante »,
 *  his answer « Les mesurer, fiche courte (Recommandé) »). Nothing of the game reads it. */

/** a set: the states' numbers, the skills' states and the rivals' weapons and resistances added or removed, a weapon's state and a piece's resistances */
export interface StatesSpec {
  rules?: Record<string, unknown>;
  /** skills' states by id (null removes the game's) */
  skills?: Record<string, AutoInflict | null> | null;
  /** rivals' weapon states by id (null removes) */
  rivals?: Record<string, AutoInflict | null> | null;
  rivalResist?: Record<string, Partial<Record<AutoStateId, number>> | null> | null;
  /** a property on a weapon of the game (its id) */
  weapon?: { id: string; inflict: AutoInflict } | null;
  /** resistances on a piece of the game (its id) */
  resist?: { id: string; resist: Partial<Record<AutoStateId, number>> } | null;
  /** no harmful state at all (the duel before the construction) */
  none?: boolean;
}
const KEEP = JSON.stringify({ rules: AUTO_RULES.states, skills: AUTO_SKILL_STATES, styles: Object.fromEntries(Object.entries(AUTO_STYLES).map(([k, v]) => [k, { inflict: v.inflict ?? null, resist: v.resist ?? null }])) });
const GEAR_KEEP: Record<string, string> = {};
/** apply a set (after reset): the game's tables changed for this process */
export function applyStates(s: StatesSpec): void {
  resetStates();
  if (s.none) { for (const id of Object.keys(AUTO_SKILL_STATES)) delete AUTO_SKILL_STATES[id]; for (const st of Object.values(AUTO_STYLES)) { delete st.inflict; delete st.resist; } }
  const R = AUTO_RULES.states as unknown as Record<string, unknown>;
  for (const [k, v] of Object.entries(s.rules ?? {})) { if (v && typeof v === 'object') R[k] = { ...(R[k] as object ?? {}), ...v }; else R[k] = v; }
  for (const [id, inf] of Object.entries(s.skills ?? {})) { if (inf) AUTO_SKILL_STATES[id] = inf; else delete AUTO_SKILL_STATES[id]; }
  for (const [id, inf] of Object.entries(s.rivals ?? {})) if (AUTO_STYLES[id]) { if (inf) AUTO_STYLES[id].inflict = inf; else delete AUTO_STYLES[id].inflict; }
  for (const [id, r] of Object.entries(s.rivalResist ?? {})) if (AUTO_STYLES[id]) { if (r) AUTO_STYLES[id].resist = r; else delete AUTO_STYLES[id].resist; }
  const piece = (id: string) => { GEAR_KEEP[id] ??= JSON.stringify(AUTO_GEAR_FX[id] ?? null); return (AUTO_GEAR_FX[id] ??= {}); };
  if (s.weapon) piece(s.weapon.id).inflict = s.weapon.inflict;
  if (s.resist) piece(s.resist.id).resist = { ...(piece(s.resist.id).resist ?? {}), ...s.resist.resist };
}
/** the game's tables as they were */
export function resetStates(): void {
  const k = JSON.parse(KEEP);
  const R = AUTO_RULES.states as unknown as Record<string, unknown>;
  for (const key of Object.keys(R)) if (!(key in k.rules)) delete R[key];
  for (const [key, v] of Object.entries(k.rules)) R[key] = typeof v === 'object' ? { ...(v as object) } : v;
  for (const id of Object.keys(AUTO_SKILL_STATES)) delete AUTO_SKILL_STATES[id];
  Object.assign(AUTO_SKILL_STATES, k.skills);
  for (const [id, st] of Object.entries(AUTO_STYLES)) { const o = k.styles[id]; delete st.inflict; delete st.resist; if (o?.inflict) st.inflict = o.inflict; if (o?.resist) st.resist = o.resist; }
  for (const [id, j] of Object.entries(GEAR_KEEP)) { const v = JSON.parse(j); if (v) AUTO_GEAR_FX[id] = v; else delete AUTO_GEAR_FX[id]; delete GEAR_KEEP[id]; }
}

