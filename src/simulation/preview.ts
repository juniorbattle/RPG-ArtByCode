import { ACTIONS, type Action } from './actions';
import type { GameState } from './state';
import { isV2, v2KitOf } from './v2';
import { v2Mods } from './v2gear';
import { TRAIN_CAP, levelOf } from './v2skills';
import type { ChargeTier } from '../combat/charge';
import type { DynActionId } from '../combat/dynamic';
import { matchSheetFor, playerMods, v2SheetData } from '../combat/match';
import { DYN_PROFILES, PROFILES, duelData, dynDuelData } from '../combat/profiles';
import { LATE_TEACHER, SKILL_BOOK } from '../combat/skillbook';
import { MAX_LEVEL } from '../combat/skills';
import { v2DuelData, type V2Duel, type V2Kit } from '../combat/v2duel';
import { hitFactor, skillPower } from '../combat/stats';
import { Rng } from '../core/rng';
import { AUTO_RULES, autoGaugeHit, type AutoFighter } from '../combat/auto';
import { autoFoe, autoOrderOf, autoRaceSheet, autoRen, autoSkill } from '../combat/autoData';
import { autoBoutOf } from '../combat/autoMatch';
import { v2Stats } from './v2gear';
import { RIVALS_CHALLENGE_DAY } from './v2town';

/** What a purchase or a change of gear would change (the operator's choice UM7-3 « Lot à part : héros, détail, comparaison », journal Passe UM9): no
 *  rule of its own, so it cannot drift from the game. The numbers are read from the duel's own data, built as a bout builds them; the « after » is the
 *  real action applied to a copy of the state, its clock left alone. Pure. */

export type StatId = 'hp' | 'atk' | 'def' | 'end' | 'viv' | 'blow' | 'taken' | 'ap' | 'charge' | 'gauge' | 'effect';
export type Stats = Partial<Record<StatId, number>>;
/** the order of the sheet: a version 2 game's stats first (the operator's DB7-7 « Équipement, fiche de match et compétences », journal Passe DB8) */
export const STAT_IDS: readonly StatId[] = ['hp', 'atk', 'def', 'end', 'viv', 'blow', 'taken', 'ap', 'charge', 'gauge', 'effect'];
/** the numbers where less is better */
const LESS_IS_BETTER: ReadonlySet<StatId> = new Set(['taken', 'charge', 'gauge']);

const NAMES = { seed: 1, playerName: '', opponentName: '' };

/** the player's numbers in a bout now: health and the heavy blow's damage in today's game; a version 2 game's stats at the next bout (the operator's
 *  DB7 sheet, journal Passe DB8: health with the injury's share, Attack, Defence, Endurance, Speed, src/simulation/v2gear.ts v2Stats), the AP at the
 *  start and the wards' and boosts' length (% of the bare figure); the opponent's own numbers stay out of it */
export function duelStats(s: GameState): Stats {
  // a version 2 game: the duel played by the computer's Ren (lot 2, journal Passe LC3): his stats (the gear's points doubled, AC-11), his AP at the start, his
  // effects' length; the health the bout gives him, as the match sheet says it (the duel doubles every fighter's, DB5; the sheet's own figure ×
  // AUTO_RULES.hpScale, journal Passe CO1: the gear page said 300 under « In a bout » where the match sheet and the duel say 600)
  if (isV2(s)) {
    const m = v2Mods(s), st = v2Stats(s);
    return { hp: Math.round(st.hp * (m.hp ?? 1) * AUTO_RULES.hpScale), atk: st.atk, def: st.def, end: st.end, viv: st.viv, ap: AUTO_RULES.ap.start + (m.ap ?? 0), effect: m.effect * 100 };
  }
  const m = playerMods(s), d = s.flags.combat === 'dynamic' ? dynDuelData(DYN_PROFILES.marek, { ...NAMES, player: m }) : duelData(PROFILES.marek, { ...NAMES, player: m });
  return { hp: d.fighters.ren.maxHp, blow: d.actions.heavy.damage };
}

/** a duel as a bout builds it, with these skills at these levels: the player's next bout when there is one (since journal Passe DB8 a blow's damage
 *  follows the opponent's Defence and its stage), else Marek at the pool */
function skillDuel(s: GameState, loadout: string[], levels: Record<string, number>): V2Duel {
  const m = v2Mods(s), kit = { loadout: loadout as V2Kit['loadout'], levels }, sh = matchSheetFor(s);
  if (sh) return v2SheetData(sh, undefined, kit, m);
  return v2DuelData('marek', { ...NAMES, player: { hp: m.hp, damage: m.damage, ap: m.ap }, gear: m, ren: m.stats, kit });
}

export interface SkillFigures {
  ap: number;
  /** an offensive skill's power before the stats (the operator's DB7-7, journal Passe DB8: src/combat/stats.ts skillPower; 0 for a ward or a boost) */
  power: number;
  /** what the blow does, gear and level in it: its damage and what it adds to the gauge (every blow of a skill that strikes several, journal Passe CO2) */
  damage: number; gauge: number;
  /** the blows it strikes (Taille éclair 2, Tourbillon 3: AUTO_SKILLS hits) */
  hits: number;
  /** the hold that opens it (s) */
  charge: number;
  /** a ward's or a boost's length (s) and what it multiplies, 0 and none for a blow */
  dur: number; ward: { damage: number; resist: number } | null; boost: { damage: number; resist: number } | null;
  pierce: boolean;
}

/** the four brought, with this skill among them (in the first slot when it is not) */
const withSkill = (s: GameState, id: string): string[] => { const k = v2KitOf(s); return k.loadout.includes(id as never) ? k.loadout : [id, ...k.loadout.slice(1)]; };

/** the two fighters of the next bout as the duel played by the computer builds them (the bout of the day, else Ren against the pool's Marek) */
function autoPair(s: GameState): { ren: AutoFighter; foe: AutoFighter } {
  const b = matchSheetFor(s) ? autoBoutOf(s) : null;
  if (b) return { ren: b.ren, foe: b.foe };
  const m = v2Mods(s);
  return { ren: autoRen(v2Stats(s), v2KitOf(s), { weapon: s.v2?.gear?.weapon, hpShare: m.hp, apStart: m.ap ?? 0, effect: m.effect }), foe: autoFoe('marek', autoRaceSheet('marek', 0, 0)) };
}

/** what a skill does in a bout at a level (journal Passe UM11): no rule of its own either, the numbers are the duel's. A version 2 game's are the duel played by
 *  the computer's (lot 2, journal Passe LC3): the skill at that level, its damage against the next opponent's Defence from Ren's Attack, what it adds to that
 *  opponent's gauge by its Endurance, its charge at Ren's Speed, its effect's length with his gear */
export function skillFigures(s: GameState, id: string, level: number): SkillFigures {
  if (isV2(s)) {
    const { ren, foe } = autoPair(s), a = autoSkill(id, level, v2Mods(s).effect), e = a.ward ?? a.boost;
    // each blow as the duel strikes it (src/combat/auto.ts hitOnce: its share of the power, at least 1; its share of the gauge): the page said one blow of the whole
    // power, Tourbillon's three of 0.36 are 1.08 of it (journal Passe CO2)
    const off = !e, hits = a.hits ?? [1], k = hitFactor(ren.atk, foe.def);
    return {
      ap: a.ap ?? 0, power: off ? +(a.power ?? 0).toFixed(1) : 0, hits: off ? hits.length : 0,
      damage: off ? hits.reduce((n, sh) => n + Math.max(1, Math.round((a.power ?? 0) * sh * k)), 0) : 0,
      gauge: off ? +hits.reduce((n, sh) => n + autoGaugeHit(a, sh, foe.end), 0).toFixed(1) : 0, charge: +(a.charge * (ren.tempo / Math.max(1, ren.viv))).toFixed(2),
      dur: e?.dur ?? 0, ward: a.ward ? { damage: a.ward.dmg, resist: a.ward.gauge } : null, boost: a.boost ? { damage: a.boost.dmg, resist: a.boost.gauge } : null, pierce: !!a.pierce,
    };
  }
  const k = v2KitOf(s), { data: d, tiers } = skillDuel(s, withSkill(s, id), { ...k.levels, [id]: level });
  const a = d.actions[id as DynActionId], e = a.ward ?? a.boost;
  return { ap: a.apCost ?? 0, power: a.family === 'offensive' ? +skillPower(id, level).toFixed(1) : 0, hits: a.family === 'offensive' ? 1 : 0, damage: a.damage, gauge: a.resist, charge: tiers.find((t) => t.id === id)!.at, dur: e?.dur ?? 0, ward: a.ward ?? null, boost: a.boost ?? null, pierce: !!a.ignoreGuard };
}

/** the tiers of the charge with these skills (the light attack, then each one by its time; the heavy attack only when it is among them, journal Passe CH1), as
 *  the duel ranks them; a choice of fewer than four is completed for the duel and shown as it stands */
export function chargeLadder(s: GameState, ids: string[]): ChargeTier[] {
  const k = v2KitOf(s), full = [...ids, ...Object.keys(k.levels).filter((x) => !ids.includes(x))].slice(0, 4);
  return skillDuel(s, full, k.levels).tiers.filter((t) => t.id === 'light' || ids.includes(t.id));
}

/** the order the automatic follows with these four (AC-09), each with its AP and its charge at Ren's Speed, then the light attack: what the match sheet and the
 *  skills' page show (lot 2, journal Passe LC3); a choice of fewer than four is shown as it stands */
export function autoOrderView(s: GameState, ids: string[]): Array<{ id: string; ap: number; charge: number }> {
  const k = v2KitOf(s), { ren } = autoPair(s), order = autoOrderOf({ loadout: ids, levels: k.levels, order: k.order });
  return order.map((id) => { const a = autoSkill(id, k.levels[id] ?? 1); return { id, ap: a.ap ?? 0, charge: +(a.charge * (ren.tempo / Math.max(1, ren.viv))).toFixed(2) }; });
}

/** the level a skill can still reach and how: drilling up to its cap, then only the fighter who teaches it; a skill only a rival out of the title teaches
 *  (LATE_TEACHER, lot L2b) from the day such a rival can be challenged (journal Passe CO1: the page said « No higher level » for Iron Skin, Feint, Sunder and
 *  the Piercing Lunge at level 3, though a challenge won from day 6 raises them, src/simulation/v2skills.ts learnFromChallenge) */
export function nextLevel(s: GameState, id: string): { level: number; by: 'drill' | 'challenge'; teacher?: string; fromDay?: number } | null {
  const lv = levelOf(s, id), teacher = SKILL_BOOK[id]?.teacher, late = Object.keys(LATE_TEACHER).find((f) => LATE_TEACHER[f] === id);
  if (lv < TRAIN_CAP) return { level: lv + 1, by: 'drill' };
  if (lv >= MAX_LEVEL) return null;
  if (teacher) return { level: lv + 1, by: 'challenge', teacher };
  return late ? { level: lv + 1, by: 'challenge', teacher: late, fromDay: RIVALS_CHALLENGE_DAY } : null;
}

export interface StatChange { id: StatId; now: number; after: number; better: boolean }
export interface Preview {
  /** the numbers it changes, in the sheet's order */
  rows: StatChange[];
  /** the purse now and after (below zero: what is missing) */
  coins: [number, number];
  /** the place it takes on the body (null: none, the bag or the belt) */
  slot: 'weapon' | 'armour' | 0 | 1 | null;
  /** what stood in that place */
  replaces: string | null;
  /** the forge's tiers that go with the weapon taken off */
  tierLost: number;
  /** a version 2 piece that goes to the bag: no place free */
  toBag: boolean;
}

/** the action applied to a copy: the same `apply` a bout of play runs, without the clock `advance` would move (no event, no new slot) */
export function preview(s: GameState, a: Action): Preview {
  const c = JSON.parse(JSON.stringify(s)) as GameState;
  (ACTIONS[a.type] as unknown as { apply(s: GameState, a: Action, r: Rng, e: () => void): void }).apply(c, a, new Rng(1), () => {});
  const was = duelStats(s), is = duelStats(c), g0 = s.v2?.gear, g1 = c.v2?.gear;
  const rows = STAT_IDS.flatMap((id) => (was[id] === undefined || +was[id]!.toFixed(3) === +is[id]!.toFixed(3) ? [] : [{ id, now: was[id]!, after: is[id]!, better: (is[id]! < was[id]!) === LESS_IS_BETTER.has(id) }]));
  const slot = !g0 || !g1 ? null : g0.weapon !== g1.weapon || g0.tier !== g1.tier ? 'weapon' as const : g0.armour !== g1.armour ? 'armour' as const : g0.acc[0] !== g1.acc[0] ? 0 as const : g0.acc[1] !== g1.acc[1] ? 1 as const : null;
  const replaces = !g0 || slot === null ? null : slot === 'weapon' ? (g0.weapon !== g1!.weapon ? g0.weapon : null) : slot === 'armour' ? g0.armour : g0.acc[slot];
  return { rows, coins: [s.player.coins, c.player.coins], slot, replaces, tierLost: replaces && slot === 'weapon' ? g0!.tier : 0, toBag: !!g0 && !!g1 && g1.bag.length > g0.bag.length && slot === null };
}
