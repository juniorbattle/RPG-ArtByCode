import type { GameState } from '../simulation/state';
import type { DuelOutcome } from '../tournament/pool';
import { rivalMods } from '../tournament/pool';
import { piecesViv, v2Mods, v2Stats, wornPieces } from '../simulation/v2gear';
import { v2KitOf } from '../simulation/v2';
import { GENERICS } from '../narrative/generics';
import { allyCd } from '../narrative/v2story';
import { AUTO_RULES, autoDuel, autoFormsOf, autoWinner, type AutoFighter, type AutoResult } from './auto';
import { autoFoe, autoGenericSheet, autoKitFor, autoPrepPoints, autoRaceSheet, autoRen, autoRound } from './autoData';
import { challengeSheetFor, matchSheetFor, type MatchSheet } from './match';
import type { FighterStats, Stage } from './stats';

/** A game's bouts in the duel played by the computer (briefs/combat-auto.md § 17.3): Ren and his opponent from a version 2 game's state, the player's bout
 *  of the day or the challenge waiting. Every version 2 game plays it since lot 2 (journal Passe LC3: the arena shows its script, the match sheet says what
 *  decides it); today's game (`v2=0`) keeps its own duel. Pure. */

/** Ren's stats in a bout of this duel: the game's (v2Stats: his start, his vigour, his gear, the whetstone, his training); the gear's points are the
 *  doubled ones of the operator's AC-11 « Doubler les points de l’équipement (décision A3 : change DB7-2) » (journal Passe AC4), in the gear's own table
 *  since lot 2 (src/simulation/gear.ts; lot 1 doubled them here) */
export function autoRenStats(st: GameState): FighterStats {
  return v2Stats(st);
}

export interface AutoBout { ren: AutoFighter; foe: AutoFighter; foeId: string; seed: number; stage: Stage; round: number; prep: number }

/** the sheet of the player's bout of the day (`bout`) or of the challenge waiting (`challenge`) */
export const autoSheetOf = (st: GameState, kind: 'bout' | 'challenge' = 'bout'): MatchSheet | null => (kind === 'challenge' ? challengeSheetFor(st) : matchSheetFor(st));

/** the player's bout of the day (`bout`) or the challenge waiting (`challenge`) as the duel's two fighters and its seed; null when there is none. `prep` the
 *  opponent's preparation as the visible Attack points of AC-17 (0 for a generic fighter) */
export function autoBoutOf(st: GameState, kind: 'bout' | 'challenge' = 'bout'): AutoBout | null {
  const sh = autoSheetOf(st, kind);
  if (!sh) return null;
  const o = sh.sides[1].fighters[0], stage = sh.stage ?? 0, round = stage === 0 ? autoRound(st.day) : 0, mods = v2Mods(st), g = GENERICS[o.id];
  // the plan kept for this rival, else the general one (lot 2 of « La Brute »: « un plan par rival », set on its match sheet)
  const ren = autoRen(autoRenStats(st), autoKitFor(v2KitOf(st), o.id), { weapon: st.v2?.gear?.weapon, hpShare: mods.hp, taken: mods.taken, effect: mods.effect, gear: wornPieces(st), pieceViv: piecesViv(st) });
  // Orla's advice from the gate (BL1-6): the gaps and the cooldown × 0.9, on top of the gear's
  const ally = allyCd(st);
  if (ally !== 1) ren.gfx = { ...ren.gfx, cd: (ren.gfx?.cd ?? 1) * ally };
  const c = st.competitors[o.id];
  const foe = g ? autoFoe(o.id, autoGenericSheet(g.profile, g, stage, round), { kitOf: g.profile, stage })
    : autoFoe(o.id, autoRaceSheet(o.id, stage, round, { preparation: c?.preparation, hp: c ? rivalMods(c).hp : 1 }), { stage });
  return { ren, foe, foeId: o.id, seed: (sh.seed ^ 0x5bd1e995) >>> 0, stage, round, prep: g || !c ? 0 : autoPrepPoints(c.preparation) };
}

/** the player's bout or challenge fought in this duel, as the game takes its result (DuelOutcome), and the duel itself (`log`: its script, with each
 *  event's state for the arena, `trace`) */
export function autoOutcome(st: GameState, kind: 'bout' | 'challenge' = 'bout', o: { log?: boolean } = {}): DuelOutcome & { duel: AutoResult; bout: AutoBout } {
  const b = autoBoutOf(st, kind);
  if (!b) throw new Error(kind === 'challenge' ? 'no challenge waiting' : 'no duel today');
  const r = autoDuel(b.ren, b.foe, b.seed, { log: o.log, trace: o.log }), win = autoWinner(r) === 0;
  return { winner: win ? 'player' : 'opponent', playerHp: r.hp[0], playerMaxHp: r.maxHp[0], opponentHp: r.hp[1], opponentMaxHp: r.maxHp[1], finisher: r.finisher, duel: r, bout: b };
}

/** the form of the day of a bout's two fighters (AC-08 « Une forme du jour ±15 %, dite sur la fiche de match »): drawn from the bout's seed before it, as the
 *  duel draws it (its own stream) */
export const autoForms = (b: Pick<AutoBout, 'seed'>): [number, number] => autoFormsOf(b.seed);

/** the chances of a reaction for a fighter defending against another (AC-05; briefs/combat-auto.md § 3, « La fiche de match montre les deux chances »): its
 *  dodge, its guard against a light attack and against a big action seen coming (the duel's own formulas: the stats, a rival's style and the gear's effects,
 *  at most 90 %), and the share its guard takes off this attacker's blows (PB-1: 30 to 70 % by its Defence against the Attack) */
export function autoReactions(def: Pick<AutoFighter, 'def' | 'viv'> & Partial<Pick<AutoFighter, 'style' | 'gfx'>>, att: Pick<AutoFighter, 'atk' | 'viv'>): { dodge: number; guard: number; guardSkill: number; reduce: number } {
  const R = AUTO_RULES, ratio = (a: number, b: number) => (2 * a) / Math.max(1e-6, a + b);
  const dodge = Math.min(1, R.react.dodge * ratio(def.viv, att.viv) * (def.gfx?.dodge ?? 1) * (def.style?.dodge ?? 1));
  const g = R.react.guard * ratio(def.def, att.atk) * (def.gfx?.guardChance ?? 1) * (def.style?.guard ?? 1);
  return { dodge, guard: Math.min(R.react.cap, g), guardSkill: Math.min(R.react.cap, g * R.react.skillGuard), reduce: Math.min(R.guard.hi, Math.max(R.guard.lo, R.guard.base * ratio(def.def, att.atk))) };
}

