import type { GameState, MatchRecord } from './state';
import { isV2 } from './v2';
import { PLAYER_ID, RIVALS } from '../narrative/roster';
import { tx, word, skillName, type TextKey } from '../narrative/text';
import { pendingFinal } from '../tournament/v2calendar';
import { stageOf, type Stage } from '../combat/stats';
import { AUTO_BRUTE, AUTO_FOES, AUTO_ROLES, AUTO_STYLES, autoRivalLevel } from '../combat/autoData';
import type { AutoCond, AutoRole } from '../combat/auto';
import { FOE_SKILLS } from '../combat/v2duel';

/** The scouting by tiers (lot 3 of « La Brute », the operator's PB-4 « Toutes », briefs/combat-auto.md § 33.5; the proposition's « Le repérage qui révèle le style puis
 *  le plan : une première observation donne le style du rival ; une deuxième, son plan ; la rumeur, son kit du prochain combat »). What the player knows of a rival's
 *  way of fighting, by what they saw of it in the Cité:
 *  - tier 0, nothing seen: the match sheet says how to learn more;
 *  - tier 1, the style: a first watch at practice (src/simulation/roles.ts `scout`), or a bout or a challenge already fought against them: their skills and the role
 *    of each, their heavy blow, their pieces;
 *  - tier 2, the plan: a second watch, another day (`scouted2:<id>`): when they use each skill (their conditions, AUTO_STYLES);
 *  - the rumour of the next opponent (src/simulation/v2intel.ts): their kit for that bout, their skills and the uses each has at its stage.
 *  The match sheet, the tournament's board and Master Corvin's notebook read it; the rehearsal plays the shadow it allows (src/simulation/v2prep.ts). Pure. */

export type ScoutTier = 0 | 1 | 2;

/** the player's bouts against a fighter that are fought (a tournament's), in the calendar's order */
const foughtBouts = (s: GameState, id: string): MatchRecord[] => s.tournament.matches.filter((m) => !!m.winner && ((m.a === PLAYER_ID && m.b === id) || (m.b === PLAYER_ID && m.a === id)));

/** has the player fought this fighter (a bout of the tournament or a challenge in town, won or lost) */
export const hasFought = (s: GameState, id: string): boolean => foughtBouts(s, id).length > 0 || s.v2?.challenged?.[id] !== undefined;

/** what the player knows of a rival's way of fighting (above) */
export function scoutTier(s: GameState, id: string): ScoutTier {
  if (!isV2(s)) return s.facts.includes(`scouted:${id}`) ? 1 : 0;
  if (s.facts.includes(`scouted2:${id}`)) return 2;
  return s.facts.includes(`scouted:${id}`) || hasFought(s, id) ? 1 : 0;
}

/** the player's next bout of the tournament (today's, a later one, or the final before it is drawn): its opponent, its day, its stage (0 the pool, 1 the bracket,
 *  2 the final); null once every bout is fought */
export function nextBoutOf(s: GameState): { foe: string; day: number; stage: Stage } | null {
  const m = s.tournament.matches.filter((x) => x.day >= s.day && !x.winner && (x.a === PLAYER_ID || x.b === PLAYER_ID)).sort((x, y) => x.day - y.day)[0];
  if (m) return { foe: m.a === PLAYER_ID ? m.b : m.a, day: m.day, stage: stageOf(m.day, m.stage === 'final') };
  const f = pendingFinal(s);
  return f?.foe ? { foe: f.foe, day: f.day, stage: 2 } : null;
}

/** the kit of a rival's next bout against the player is known: a rumour heard of them since the player last fought them, and they are the next opponent */
export function kitKnown(s: GameState, id: string): boolean {
  const h = s.v2?.heard?.[id], n = nextBoutOf(s);
  if (!h || n?.foe !== id) return false;
  return !foughtBouts(s, id).some((m) => m.day >= h.day);
}

/** the uses each skill of a rival has in a bout at this stage (PB-2: a rival's level 1, 2, 3 at the pool, the bracket, the final) */
export const usesAt = (stage: Stage): number => AUTO_BRUTE.uses[autoRivalLevel(stage) - 1] ?? 2;

/** a role in words (the skills page's « role: exploit »), keys written whole (tests/texts.test.mjs) */
export const ROLE_WORD: Record<AutoRole, TextKey> = {
  exploit: 'ui.role.exploit', punish: 'ui.role.punish', pierce: 'ui.role.pierce', breaker: 'ui.role.breaker', opener: 'ui.role.opener', interrupt: 'ui.role.interrupt',
  ward: 'ui.role.ward', parry: 'ui.role.parry', haste: 'ui.role.haste', slow: 'ui.role.slow', load: 'ui.role.load',
};
/** a rival's condition in words, said of them (their plan, tier 2); 'auto' the rule of the skill's role (src/combat/auto.ts autoRole), said by ROLE_WHEN */
const PLAN_WORD: Record<Exclude<AutoCond, 'auto'>, TextKey> = {
  ready: 'scout.when.ready', incoming: 'scout.when.incoming', follow: 'scout.when.follow', gauge: 'scout.when.gauge', broken: 'scout.when.broken', hurt: 'scout.when.hurt',
  finish: 'scout.when.finish', open: 'scout.when.open', start: 'scout.when.start', foeGauge: 'scout.when.foeGauge', warded: 'scout.when.warded', never: 'scout.when.never',
};
const ROLE_WHEN: Record<AutoRole, TextKey> = {
  exploit: 'scout.role.exploit', punish: 'scout.role.punish', pierce: 'scout.role.pierce', breaker: 'scout.role.breaker', opener: 'scout.role.opener', interrupt: 'scout.role.interrupt',
  ward: 'scout.role.ward', parry: 'scout.role.parry', haste: 'scout.role.haste', slow: 'scout.role.slow', load: 'scout.role.load',
};
/** when a rival uses a skill, in words: its condition, or its role's rule */
export function whenText(id: string, cond: AutoCond): string {
  const r = AUTO_ROLES[id]?.role;
  return cond !== 'auto' ? tx(PLAN_WORD[cond]) : r ? tx(ROLE_WHEN[r]) : tx('scout.when.ready');
}

/** a skill's name, a rival's own or Ren's catalogue's */
export const anySkillName = (id: string): string => (FOE_SKILLS[id] ? word(FOE_SKILLS[id].name) : skillName(id));

/** the rival's kit (AUTO_FOES: a generic fighter fights with its rival's) */
const kitOf = (id: string): string => (AUTO_FOES[id] ? id : 'marek');

/** tier 1: their skills and the role of each, their heavy blow (a brawler's as soon as it is ready), their pieces (a dodger's leathers, a shield, a heavy fighter) */
export function styleText(id: string, name: string): string {
  const k = kitOf(id), st = AUTO_STYLES[k], skills = AUTO_FOES[k].skills.map((x) => { const r = AUTO_ROLES[x.id]?.role; return r ? tx('auto.style.skill', { skill: anySkillName(x.id), role: tx(ROLE_WORD[r]) }) : anySkillName(x.id); });
  const pieces = st.dodge >= 1.5 ? tx('scout.pieces.light', { name }) : st.guard >= 1.5 ? tx('scout.pieces.shield', { name }) : st.dodge <= 0.5 ? tx('scout.pieces.heavy', { name }) : '';
  return [tx('auto.style.skills', { name, list: skills.join(', ') }), st.heavy === 'ready' ? tx('auto.style.heavy', { name }) : '', pieces].filter(Boolean).join(' ');
}

/** tier 2: when they use each skill (their plan: AUTO_STYLES' conditions, 'auto' its role's own rule) */
export function planText(id: string, name: string): string {
  const k = kitOf(id), t = AUTO_STYLES[k].tactic;
  const parts = AUTO_FOES[k].skills.map((x) => tx('scout.plan.skill', { skill: anySkillName(x.id), when: whenText(x.id, (t[x.id] ?? 'auto') as AutoCond) }));
  return tx('scout.plan', { name, list: parts.join(', ') });
}

/** the rumour's kit: their skills and the uses each has in the next bout */
export function kitText(id: string, name: string, stage: Stage): string {
  return tx('scout.kit', { name, list: AUTO_FOES[kitOf(id)].skills.map((x) => anySkillName(x.id)).join(', '), n: usesAt(stage) });
}

/** what the player knows of a rival, as lines (the match sheet, the board, the notebook): the tier's lines, then how to learn more; a generic fighter (met in
 *  portrait only) fights with its rival's kit and is never watched, its style said once fought */
export function scoutLines(s: GameState, id: string): string[] {
  const name = RIVALS[id]?.name ?? id, tier = scoutTier(s, id), out: string[] = [];
  if (tier === 0) out.push(tx('scout.unseen', { name }));
  if (tier >= 1) out.push(styleText(id, name));
  if (tier >= 2) out.push(planText(id, name));
  const n = nextBoutOf(s);
  if (n && kitKnown(s, id)) out.push(kitText(id, name, n.stage));
  if (tier === 1 && RIVALS[id]) out.push(tx('scout.more', { name }));
  return out;
}

/** the tier in a word (the notebook's list) */
export const tierWord = (t: ScoutTier): string => tx(t === 2 ? 'scout.tier.plan' : t === 1 ? 'scout.tier.style' : 'scout.tier.none');

/** a rival's second watch is open: watched once, on another day than today, not yet their plan */
export function secondWatch(s: GameState, id: string): boolean {
  return isV2(s) && s.facts.includes(`scouted:${id}`) && !s.facts.includes(`scouted2:${id}`) && s.flags[`scoutDay:${id}`] !== s.day;
}
