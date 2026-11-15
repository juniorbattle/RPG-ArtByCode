import { AUTO_FOES, AUTO_ROLES, AUTO_SKILLS, autoCharge, type AutoSkillDef } from '../combat/autoData';
import type { AutoRole } from '../combat/auto';
import type { CineRule } from '../arena/cineRule';

/** The workshop of the skills' structure (journal Passe SK1), DEV and laboratory only: nothing of the game reads it. The operator's request of 15/11/2026, word for
 *  word: « il est clair que nous pouvons avoir des plusieurs competences super mais aussi des competences ulttra obtenable par nos adversaires et donc equipables
 *  sans oublier les competences de soutien ... il faut bien structurer cela c'est essentiel ». The arena loads it behind the DEV parameters `kit=` (a rival's
 *  signature in Ren's four) and `cine=sk1`; tools/auto-lab.mjs `--catalogue=signatures` reads the same table. */

/** Ren's skill whose charge pattern by level a rival's signature follows, by role */
const PATTERN: Partial<Record<AutoRole, string>> = { punish: 't1', pierce: 't2', breaker: 't3', exploit: 't4', opener: 'k_sunder' };

export interface Signature { foe: string; role: AutoRole; def: AutoSkillDef }
/** each rival's signature attack as a skill of Ren's catalogue: its rival's charge at level 1 and its weight on the gauge (AUTO_FOES), its role's pattern by level */
export function signatures(): Record<string, Signature> {
  return Object.fromEntries(Object.entries(AUTO_FOES).map(([foe, K]) => {
    const s = K.skills.find((x) => x.family === 'offensive')!, role = AUTO_ROLES[s.id].role, pat = PATTERN[role]!, p = autoCharge(pat, 1);
    const charge = [1, 2, 3, 4, 5].map((lv) => +(Math.round((s.charge * autoCharge(pat, lv)) / p / 0.05) * 0.05).toFixed(2)) as unknown as AutoSkillDef['charge'];
    return [s.id, { foe, role, def: { family: 'offensive', charge, ...(s.gaugeK && s.gaugeK !== 1 ? { gaugeK: s.gaugeK } : {}) } }];
  }));
}

/** put the signatures into the duel's catalogue (AUTO_SKILLS), with a power factor or a weight on the gauge of the workshop's candidates (`tune`) */
export function injectSignatures(tune: Record<string, Partial<AutoSkillDef>> = {}): Record<string, Signature> {
  const S = signatures();
  for (const [id, x] of Object.entries(S)) (AUTO_SKILLS as Record<string, AutoSkillDef>)[id] = { ...x.def, ...(tune[id] ?? {}) };
  return S;
}

/** the workshop's candidate numbers (journal Passe SK1): the rivals' ultimates in Ren's hands at the Thrust's level against AC-12's table (Iron Fall ×1.2, Temple Smite
 *  ×1.4: 88 / 66 / 51 and 88 / 69 / 48 % against the Thrust's 86 / 66 / 51 at the pool, the bracket and the final), the openers at a normal weight on the gauge (only a
 *  breaker weighs more than an ordinary skill: Orla's shoulder ×2 made it the best kit of the final, 66 % against 51) */
export const SK1_TUNE: Record<string, Partial<AutoSkillDef>> = { m_ironfall: { powerK: 1.2 }, m_smite: { powerK: 1.4 }, m_shoulder: { gaugeK: 1 } };

/** the whole candidate in the duel's tables: the signatures tuned, Sunder and Orla's shoulder at a normal weight on the gauge */
export function applySk1(): Record<string, Signature> {
  const S = injectSignatures(SK1_TUNE);
  (AUTO_SKILLS as Record<string, AutoSkillDef>).k_sunder = { ...AUTO_SKILLS.k_sunder, gaugeK: 1 };
  for (const s of AUTO_FOES.orla.skills) if (s.id === 'm_shoulder') delete (s as { gaugeK?: number }).gaugeK;
  return S;
}

/** the operator's answer of 15/11/2026, word for word « si c'est la competences ultime alors la cinematique doit se jouer en tout temps, des lors que'elle reussit »:
 *  an ultimate every time it lands in full, outside the cap; a super when every blow lands, 3 a bout at most, 20 s apart; the K.O. always */
export const CINE_RULE_SK1: CineRule = {
  tiers: [{ tier: 'ultra', roles: ['exploit'], land: 'hit', free: true }, { tier: 'super', roles: ['breaker'], land: 'hit' }],
  side: 'both', max: 3, gap: 20, ko: true,
};
