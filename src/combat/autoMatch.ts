import type { GameState } from '../simulation/state';
import type { DuelOutcome } from '../tournament/pool';
import { rivalMods } from '../tournament/pool';
import { v2Mods, v2Stats, wornFx } from '../simulation/v2gear';
import { GEAR } from '../simulation/gear';
import { v2KitOf } from '../simulation/v2';
import { GENERICS } from '../narrative/generics';
import { autoDuel, autoWinner, type AutoFighter, type AutoResult } from './auto';
import { autoFoe, autoGenericSheet, autoRaceSheet, autoRen, autoRound } from './autoData';
import { challengeSheetFor, matchSheetFor } from './match';
import type { FighterStats, Stage } from './stats';

/** A game's bouts in the duel played by the computer (lot 1, briefs/combat-auto.md § 17.3): Ren and his opponent from a version 2 game's state, the player's
 *  bout of the day or the challenge waiting. Nothing of the game reads it yet but the laboratory's games (`flags.autoDuel`, the TournamentLab's
 *  `--rules=auto`): the duel of today stays on screen until lot 2. Pure. */

/** the operator's AC-11 « Doubler les points de l’équipement (décision A3 : change DB7-2) » (journal Passe AC4): every stat point of every piece worn and of the
 *  forge, the penalties included, ×2 in this duel (the gear's own table, src/simulation/gear.ts, keeps today's points until lot 2 switches the duel) */
export const AUTO_GEAR_K = 2;

/** Ren's stats in a bout of this duel: the game's (v2Stats: his start, his vigour, his gear, the whetstone, his training), the gear's points ×2 (AC-11) */
export function autoRenStats(st: GameState): FighterStats {
  const s = v2Stats(st), fx = wornFx(st), k = AUTO_GEAR_K - 1, stone = st.player.items.includes('whetstone') ? GEAR.whetstone.fx.atk ?? 0 : 0;
  const out = { hp: s.hp + k * fx.hp, atk: s.atk + k * (fx.atk + stone), def: s.def + k * fx.def, end: s.end + k * fx.end, viv: s.viv + k * fx.viv };
  for (const key of Object.keys(out) as Array<keyof FighterStats>) out[key] = +out[key].toFixed(2);
  return out;
}

export interface AutoBout { ren: AutoFighter; foe: AutoFighter; foeId: string; seed: number; stage: Stage; round: number }

/** the player's bout of the day (`bout`) or the challenge waiting (`challenge`) as the duel's two fighters and its seed; null when there is none */
export function autoBoutOf(st: GameState, kind: 'bout' | 'challenge' = 'bout'): AutoBout | null {
  const sh = kind === 'challenge' ? challengeSheetFor(st) : matchSheetFor(st);
  if (!sh) return null;
  const o = sh.sides[1].fighters[0], stage = sh.stage ?? 0, round = stage === 0 ? autoRound(st.day) : 0, mods = v2Mods(st), g = GENERICS[o.id];
  const ren = autoRen(autoRenStats(st), v2KitOf(st), { weapon: st.v2?.gear?.weapon, hpShare: mods.hp, apStart: mods.ap ?? 0, taken: mods.taken, effect: mods.effect });
  const c = st.competitors[o.id];
  const foe = g ? autoFoe(o.id, autoGenericSheet(g.profile, g, stage, round), { kitOf: g.profile })
    : autoFoe(o.id, autoRaceSheet(o.id, stage, round, { preparation: c?.preparation, hp: c ? rivalMods(c).hp : 1 }));
  return { ren, foe, foeId: o.id, seed: (sh.seed ^ 0x5bd1e995) >>> 0, stage, round };
}

/** the player's bout or challenge fought in this duel, as the game takes its result (DuelOutcome), and the duel itself */
export function autoOutcome(st: GameState, kind: 'bout' | 'challenge' = 'bout', o: { log?: boolean } = {}): DuelOutcome & { duel: AutoResult; bout: AutoBout } {
  const b = autoBoutOf(st, kind);
  if (!b) throw new Error(kind === 'challenge' ? 'no challenge waiting' : 'no duel today');
  const r = autoDuel(b.ren, b.foe, b.seed, { log: o.log }), win = autoWinner(r) === 0;
  return { winner: win ? 'player' : 'opponent', playerHp: r.hp[0], playerMaxHp: r.maxHp[0], opponentHp: r.hp[1], opponentMaxHp: r.maxHp[1], finisher: r.finisher, duel: r, bout: b };
}
