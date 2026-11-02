import { ACTIONS, type Action } from './actions';
import type { GameState } from './state';
import { isV2 } from './v2';
import { v2Mods } from './v2gear';
import { playerMods } from '../combat/match';
import { DYN_PROFILES, PROFILES, duelData, dynDuelData } from '../combat/profiles';
import { v2DuelData } from '../combat/v2duel';
import { Rng } from '../core/rng';

/** What a purchase or a change of gear would change (the operator's choice UM7-3 « Lot à part : héros, détail, comparaison », journal Passe UM9): no
 *  rule of its own, so it cannot drift from the game. The numbers are read from the duel's own data, built as a bout builds them; the « after » is the
 *  real action applied to a copy of the state, its clock left alone. Pure. */

export type StatId = 'hp' | 'blow' | 'taken' | 'ap' | 'charge' | 'gauge' | 'effect';
export type Stats = Partial<Record<StatId, number>>;
/** the order of the sheet */
export const STAT_IDS: readonly StatId[] = ['hp', 'blow', 'taken', 'ap', 'charge', 'gauge', 'effect'];
/** the numbers where less is better */
const LESS_IS_BETTER: ReadonlySet<StatId> = new Set(['taken', 'charge', 'gauge']);

const NAMES = { seed: 1, playerName: '', opponentName: '' };

/** the player's numbers in a bout now: health, the heavy blow's damage, then a version 2 game's damage taken, starting AP, heavy charge (s), gauge
 *  fill and the wards' and boosts' length (% of the bare figure); the opponent's own numbers stay out of it */
export function duelStats(s: GameState): Stats {
  if (isV2(s)) {
    const m = v2Mods(s), { data: d, tiers } = v2DuelData('marek', { ...NAMES, player: { hp: m.hp, damage: m.damage, ap: m.ap }, gear: m });
    const heavy = tiers.find((t) => t.id === 'heavy');
    return { hp: d.fighters.ren.maxHp, blow: d.actions.heavy.damage, taken: m.taken * 100, ap: d.ap.start, charge: heavy?.at ?? 0, gauge: m.gauge * 100, effect: m.effect * 100 };
  }
  const m = playerMods(s), d = s.flags.combat === 'dynamic' ? dynDuelData(DYN_PROFILES.marek, { ...NAMES, player: m }) : duelData(PROFILES.marek, { ...NAMES, player: m });
  return { hp: d.fighters.ren.maxHp, blow: d.actions.heavy.damage };
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
