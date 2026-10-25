import type { CombatData } from '../arena/CombatSim';
import type { DynData } from './dynamic';
import type { GameState } from '../simulation/state';
import { PLAYER_ID, RIVALS } from '../narrative/roster';
import { matchId, opponentOf, playerMatch, rivalMods } from '../tournament/pool';
import { duelData, dynDuelData, DYN_PROFILES, PROFILES, type Mods } from './profiles';
import { mix32, hashString } from '../core/rng';

/** A match sheet (journal Passe L2, used by the arena's play mode in Passe L3): who fights whom, with what the preparation changed. The
 *  game's side of the interface takes lists of fighters per side (PROJECT_MASTER_CONTRACT § 6.1, gap E17: a combat « extensible vers
 *  l'équipe »); the arena's simulation seats two (`ren` / `marek`), so a sheet becomes `CombatData` only when each side has one fighter, and
 *  says so otherwise. Pure. */

export interface SheetFighter { id: string; name: string; profile?: string; mods: Mods }
export interface MatchSheet {
  id: string; round: number; day: number;
  sides: [{ fighters: SheetFighter[] }, { fighters: SheetFighter[] }];
  /** the floor telegraph and alerts (the arena's `full` assistance) when the player has scouted the opponent */
  assist: 'subtle' | 'full';
  /** what the player learnt about the opponent, shown by the arena (empty: nothing) */
  intel: string[];
  /** the opponent's sequence seed */
  seed: number;
}

/** what the player's state changes in a duel: an injury (-20 % health per level), a tempered blade (+15 % damage), a whetstone (+5 %, used
 *  up by the bout), training (+5 % damage
 *  per session, at most 2; a head start of action points made the bot spend them at once and lose its dodges, journal Passe L2) */
export function playerMods(s: GameState): Mods {
  const blade = s.player.items.includes('tempered-blade') || s.player.items.includes('imported-blade') ? 1.15 : 1;
  const stone = s.player.items.includes('whetstone') ? 1.05 : 1;
  return { hp: 1 - 0.2 * s.player.injury, damage: +(blade * stone * (1 + 0.05 * Math.min(2, s.player.training))).toFixed(4) };
}

/** the sheet of the player's duel today (null when there is none) */
export function matchSheetFor(s: GameState): MatchSheet | null {
  const m = playerMatch(s);
  if (!m) return null;
  const opp = opponentOf(m), c = s.competitors[opp], scouted = s.facts.includes(`scouted:${opp}`);
  return {
    id: matchId(m), round: m.round, day: m.day,
    sides: [{ fighters: [{ id: PLAYER_ID, name: s.player.name, mods: playerMods(s) }] }, { fighters: [{ id: opp, name: RIVALS[opp].name, profile: c.combatProfile, mods: rivalMods(c) }] }],
    assist: scouted ? 'full' : 'subtle',
    intel: scouted ? [`${RIVALS[opp].name}: ${PROFILES[c.combatProfile].style}.`, 'Her heavy blow shows on the floor: dodge [A] as the ring closes.'.replace('Her', opp === 'marek' ? 'His' : 'Her')] : [],
    seed: mix32(s.seed, hashString(matchId(m))),
  };
}

/** a 1v1 sheet as the arena's data (action names given in the play mode's language); refuses team sheets, outside the slice */
export function sheetData(sh: MatchSheet, names?: Partial<Record<string, string>>): CombatData {
  const [a, b] = sh.sides;
  if (a.fighters.length !== 1 || b.fighters.length !== 1) throw new Error(`match ${sh.id}: team formats (${a.fighters.length}v${b.fighters.length}) are outside the slice; the arena seats one fighter per side`);
  const p = a.fighters[0], o = b.fighters[0], prof = PROFILES[o.profile ?? ''];
  if (!prof) throw new Error(`match ${sh.id}: no combat profile "${o.profile}"`);
  return duelData(prof, { seed: sh.seed, playerName: p.name, opponentName: o.name, player: p.mods, enemy: o.mods, names });
}

/** the same sheet under the rules of the « tour par tour dynamique » (src/combat/dynamic.ts, journal Passe C1; behind its parameter, CB-10) */
export function dynSheetData(sh: MatchSheet, names?: Partial<Record<string, string>>): DynData {
  const [a, b] = sh.sides;
  if (a.fighters.length !== 1 || b.fighters.length !== 1) throw new Error(`match ${sh.id}: team formats (${a.fighters.length}v${b.fighters.length}) are outside the slice; the arena seats one fighter per side`);
  const p = a.fighters[0], o = b.fighters[0], prof = DYN_PROFILES[o.profile ?? ''];
  if (!prof) throw new Error(`match ${sh.id}: no combat profile "${o.profile}"`);
  return dynDuelData(prof, { seed: sh.seed, playerName: p.name, opponentName: o.name, player: p.mods, enemy: o.mods, names });
}
