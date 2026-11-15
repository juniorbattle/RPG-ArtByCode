import type { AutoCond, AutoRole } from '../combat/auto';
import { AUTO_BRUTE, AUTO_CONDS_BY_ROLE, AUTO_ROLES, AUTO_SKILLS, RANK_OF_ROLE, type AutoSkillDef } from '../combat/autoData';
import type { DynActionDef, DynActionId } from '../combat/dynamic';
import { NEW_SKILLS, SKILL_BOOK, type SkillInfo } from '../combat/skillbook';
import { SKILLS, type Times } from '../combat/skills';

/** The workshop of new skills (journal Passe SK3, the operator's note on SK-1, word for word « il faudra prevoir d'autres competences tout ausi coherente pour
 *  apporter de la diversite et de la strategie »): six candidates, one a lever of the duel no skill touches today, each taught by a town fighter beaten in a
 *  challenge (the six of src/narrative/generics.ts, who teach nothing today). LABORATORY ONLY: `applySk3()` adds them to the game's tables for one process
 *  (tools/auto-lab.mjs --catalogue=sk3); nothing of the default game reads this file. Their numbers are « proposé », measured in journal Passe SK3.
 *  - Finishing Blow (Lucan Rook, the Red Blade): an ULTIMATE of a new role, finish: ×2.5 on a target under half of its health, ×1 else (SK-6), the exploit's charge;
 *  - Disarm (Ser Aldric Venn): strip, a technique: its blow (×1.5) lifts the target's ward, haste and load, and no ward can parry it;
 *  - Leg Sweep (Corra Dunmere): a second interrupt, measured and set aside: it plays the Feint's very duels;
 *  - Sidestep (Piers Calloway): evade, a defence: a stance in which every blow that can be dodged is dodged, even while charging (a big blow dodged opens its striker, the duel's rule);
 *  - Second Wind (Brother Ambrose): recover, a support: one's gauge emptied by 35 %;
 *  - Wrist Strike (Kell Barrow, the Bare Fist): sap, a technique: its blow, when it lands, makes the target's skills and heavy blow wait 15 s. */

type Sk3 = { id: string; name: string; family: SkillInfo['family']; teacher: string; charge: Times; auto: AutoSkillDef; role: { role: string; gap: 'R' | 'M' | 'L'; undodge?: boolean; unparry?: boolean } };
export const SK3: readonly Sk3[] = [
  // the Thrust's charge and power (powerK 0.8), the exploit's charge × (an ultimate holds in its window)
  { id: 'n_grace', name: 'Finishing Blow', family: 'offensive', teacher: 'lucan', charge: [7.65, 6.95, 6.3, 5.7, 5.1], auto: { family: 'offensive', powerK: 0.8 }, role: { role: 'finisher', gap: 'L' } },
  // the Flash cut's charge, a heavier blow (×1.5: at ×0.7 the curious player who brings it lost a third of his titles, journal Passe SK3)
  { id: 'n_disarm', name: 'Disarm', family: 'offensive', teacher: 'aldric', charge: [3.4, 3.2, 3.0, 2.75, 2.55], auto: { family: 'offensive', powerK: 1.5 }, role: { role: 'strip', gap: 'M', unparry: true } },
  // MEASURED AND SET ASIDE (journal Passe SK3): the Feint's charge and power, undodgeable instead of piercing: at equal level it plays the very duels of the
  // Feint (an interrupt strikes a fighter who charges, who neither guards nor dodges); applied only when --only names it
  { id: 'n_sweep', name: 'Leg Sweep', family: 'offensive', teacher: 'corra', charge: [2.55, 2.45, 2.4, 2.3, 2.2], auto: { family: 'offensive' }, role: { role: 'interrupt', gap: 'R', undodge: true } },
  // the Rampart's charge; a stance that takes nothing off (×1), the ward's slot, 6 s at level 1 (13.5 s, the Rampart's, took the reference's finals from 56 to 81 %)
  { id: 'n_sidestep', name: 'Sidestep', family: 'defensive', teacher: 'piers', charge: [3.0, 2.8, 2.65, 2.45, 2.3], auto: { family: 'defensive', ward: { dur: 2, dmg: 1, gauge: 1 } }, role: { role: 'evade', gap: 'M' } },
  // the Fervour's charge; its effect the rule's (half of one's gauge)
  { id: 'n_wind', name: 'Second Wind', family: 'support', teacher: 'ambrose', charge: [4.25, 4.0, 3.75, 3.5, 3.25], auto: { family: 'support', boost: { dur: 1, dmg: 1, gauge: 1 } }, role: { role: 'recover', gap: 'L' } },
  // the Flash cut's charge, a lighter blow
  { id: 'n_wrist', name: 'Wrist Strike', family: 'offensive', teacher: 'kell', charge: [3.4, 3.2, 3.0, 2.75, 2.55], auto: { family: 'offensive', powerK: 1 }, role: { role: 'sap', gap: 'R' } },
];
/** the conditions each new role offers (the automatic's first) */
export const SK3_CONDS: Record<string, readonly AutoCond[]> = {
  finisher: ['auto', 'ready', 'finish', 'open', 'broken', 'incoming'],
  strip: ['auto', 'warded', 'ready', 'incoming', 'never'],
  evade: ['auto', 'incoming', 'ready', 'never'],
  recover: ['auto', 'gauge', 'hurt', 'never'],
  sap: ['auto', 'ready', 'start', 'open', 'never'],
};

let applied = false;
/** adds the six to the game's tables (once per process): their skill, role, charge, catalogue entry and teacher; the finisher an ultimate, its charge the exploit's */
export function applySk3(only?: readonly string[]): void {
  if (applied) return;
  applied = true;
  for (const k of SK3) {
    if (only ? !only.includes(k.id) : k.id === 'n_sweep') continue;
    AUTO_SKILLS[k.id] = k.auto;
    (AUTO_ROLES as Record<string, unknown>)[k.id] = k.role;
    SKILLS[k.id] = { id: k.id as DynActionId, charge: k.charge, source: 'challenge' };
    SKILL_BOOK[k.id] = { id: k.id as DynActionId, family: k.family, source: 'challenge', teacher: k.teacher };
    NEW_SKILLS[k.id] = { id: k.id as DynActionId, owner: 'ren', kind: 'skill', name: k.name, family: k.family, prep: 0.35, impactAt: 0.16, follow: 0.26, recover: 0.12, damage: 0, resist: 0, apCost: 1, anim: k.family === 'offensive' ? 'skillOff' : k.family === 'defensive' ? 'skillDef' : 'skillSup' } as DynActionDef;
  }
  RANK_OF_ROLE.finisher = 'ultimate';
  AUTO_BRUTE.roleCharge.finisher = AUTO_BRUTE.roleCharge.exploit;
  for (const [role, conds] of Object.entries(SK3_CONDS)) (AUTO_CONDS_BY_ROLE as Record<string, readonly AutoCond[]>)[role] = conds;
}
/** the role of each candidate (the laboratory's tables) */
export const sk3Role = (id: string): AutoRole | string | undefined => SK3.find((k) => k.id === id)?.role.role;
