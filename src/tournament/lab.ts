import { advance, actions, newGame, hash } from '../simulation/advance';
import type { Action } from '../simulation/actions';
import type { GameEvent, GameState } from '../simulation/state';
import { runBotDuel, runDynamicBotDuel, runV2BotDuel } from '../combat/bot';
import { dynSheetData, matchSheetFor, sheetData, v2SheetData } from '../combat/match';
import { RIVALS, PLAYER_ID } from '../narrative/roster';
import type { DuelOutcome } from './pool';
import { dynamicRules, standings } from './pool';
import { isV2, makeV2, v2KitOf } from '../simulation/v2';
import { v2Mods } from '../simulation/v2gear';

/** The TournamentLab's library (TOURNAMENT_MASTER_CONTRACT § 13, journal Passe L2; the CLI is tools/tournament-lab.mjs): play whole games
 *  headless with a player policy, the player's duels fought by the bot in the arena's full simulation; find the forgotten participants;
 *  measure eliminations, injuries, upsets and events over many seeds. Pure and deterministic: the same seeds give the same report. A game
 *  can be played under the rules of the « tour par tour dynamique » (`rules: 'dynamic'`, journal Passe C1): its duels in DynamicSim, its
 *  off-screen matches in the same rules' race (pool.ts). */

/** 'v2': a version 2 game (src/simulation/v2.ts: its flag, the dynamic rules with it, journal Passe V0) */
export type CombatRules = 'classic' | 'dynamic' | 'v2';

/** the player's duel today, fought by the bot at this skill in the arena's simulation (the match sheet's data), or in the new rules' */
export function botOutcome(st: GameState, skill: number): DuelOutcome {
  const sh = matchSheetFor(st);
  if (!sh) throw new Error('no duel today');
  const seed = sh.seed ^ 0x5bd1e995, v2 = isV2(st) ? v2SheetData(sh, undefined, v2KitOf(st), v2Mods(st)) : null;
  const r = v2 ? runV2BotDuel(v2.data, v2.tiers, { skill, seed }) : dynamicRules(st) ? runDynamicBotDuel(dynSheetData(sh), { skill, seed }) : runBotDuel(sheetData(sh), { skill, seed });
  if (!r.winner) throw new Error(`match ${sh.id}: no K.O. after ${r.t} s`);
  return { winner: r.winner === 'player' ? 'player' : 'opponent', playerHp: r.playerHp, playerMaxHp: r.playerMaxHp, opponentHp: r.opponentHp, opponentMaxHp: r.opponentMaxHp, finisher: r.finisher };
}

export interface Policy { name: string; skill: number; choose(st: GameState): Action }

const has = (st: GameState, a: Action) => actions(st).some((o) => o.ok && JSON.stringify(o.action) === JSON.stringify(a));
/** a policy's fallback for a slot: fight on a match afternoon, else let the time pass */
const fallback = (st: GameState, skill: number): Action => (st.slot === 'afternoon' && matchSheetFor(st) && !st.tournament.matches.find((m) => m.day === st.day && (m.a === PLAYER_ID || m.b === PLAYER_ID))?.winner ? { type: 'fight', outcome: botOutcome(st, skill) } : { type: 'wait' });

export const POLICIES: Record<string, Policy> = {
  /** does nothing but fight */
  idle: { name: 'idle', skill: 0.3, choose: (st) => fallback(st, 0.3) },
  /** trains by day, pays the watch at night when it can */
  diligent: {
    name: 'diligent', skill: 0.6,
    choose: (st) => {
      for (const a of [{ type: 'payWatch' }, { type: 'rest' }] as Action[]) if (has(st, a)) return a;
      if (st.slot === 'evening' && st.place !== 'district') return { type: 'move', to: 'district' };
      if (st.slot !== 'evening' && !(st.slot === 'afternoon' && matchSheetFor(st))) {
        if (st.place !== 'forecourt') return { type: 'move', to: 'forecourt' };
        if (has(st, { type: 'train' })) return { type: 'train' };
      }
      return fallback(st, 0.6);
    },
  },
};

/** a scripted game (journal Passe L5): per slot, the actions to try in order (each once, when the state allows it), then the slot's end
 *  (the bout on a match afternoon, fought by the bot at `skill`; otherwise the time let pass) */
export function scripted(name: string, skill: number, plan: Record<string, Action[]>): Policy {
  let key = '', i = 0;
  return {
    name, skill,
    choose: (st) => {
      const k = `${st.day}:${st.slot}:${st.flags[`night:${st.day}`] ? 'n' : ''}`;
      if (k !== key) { key = k; i = 0; }
      const list = plan[`${st.day}:${st.slot}`] ?? [];
      while (i < list.length) { const a = list[i++]; if (has(st, a)) return a; }
      return fallback(st, skill);
    },
  };
}

const T = (who: string): Action => ({ type: 'talk', who });
/** the three games of the slice's proof (journal Passe L5): the careful one (the cargo quest, the scouting, the watch paid), the careless one
 *  (nothing prepared: the forge burns, the merchant's blade at the shortage's price, the culprit found after), the losing one (a weak hand,
 *  wounded, healed, losing again) */
export const SCRIPTS: Record<string, () => Policy> = {
  careful: () => scripted('careful', 0.6, {
    '1:morning': [T('tam'), T('hale'), { type: 'askPapers' }, { type: 'haul' }],
    '1:afternoon': [{ type: 'move', to: 'forecourt' }, T('odo'), { type: 'register' }, T('orla'), { type: 'spar' }],
    '1:evening': [{ type: 'move', to: 'district' }, T('stranger'), { type: 'buyInfo' }, { type: 'move', to: 'lanterns' }, T('lio'), { type: 'listen' }],
    '2:morning': [{ type: 'move', to: 'district' }, T('bram'), { type: 'temper' }],
    '2:evening': [{ type: 'nightfall' }, T('hale'), { type: 'payWatch' }],
    '3:morning': [{ type: 'move', to: 'forecourt' }, T('marek'), { type: 'scout', who: 'marek' }],
    '3:evening': [{ type: 'nightfall' }, { type: 'move', to: 'district' }, T('folk')],
  }),
  careless: () => scripted('careless', 0.45, {
    '1:morning': [T('mara'), { type: 'restock' }],
    '2:evening': [{ type: 'nightfall' }, T('folk')],
    '3:morning': [T('mara'), { type: 'buy', item: 'imported-blade' }],
    '3:evening': [{ type: 'nightfall' }, T('stranger'), { type: 'buyInfo' }, T('hale'), { type: 'report' }],
  }),
  losing: () => scripted('losing', -1, {
    '1:morning': [T('folk')],
    '2:evening': [{ type: 'nightfall' }, { type: 'move', to: 'forecourt' }, T('anwen'), { type: 'heal' }],
    '3:morning': [T('anwen'), { type: 'heal' }, { type: 'move', to: 'district' }, T('mara'), { type: 'buy', item: 'salve' }],
    '3:evening': [{ type: 'nightfall' }, T('folk')],
  }),
};

export interface GameRun { seed: number; state: GameState; events: GameEvent[]; hash: string }
export function autoplay(seed: number, policy: Policy, name = 'Ren', maxActions = 200, rules: CombatRules = 'classic'): GameRun {
  let st = newGame(seed, name);
  if (rules === 'dynamic') st.flags.combat = 'dynamic';
  if (rules === 'v2') makeV2(st);
  const events: GameEvent[] = [];
  for (let i = 0; i < maxActions && !st.over; i++) {
    const r = advance(st, policy.choose(st));
    if (!r.ok) throw new Error(`policy ${policy.name} chose a refused action on day ${st.day} ${st.slot}: ${r.reason}`);
    st = r.state; events.push(...r.events);
  }
  if (!st.over) throw new Error(`policy ${policy.name} did not finish the slice in ${maxActions} actions`);
  return { seed, state: st, events, hash: hash(st) };
}

/** the rivals with a day of the slice in which nothing about them was logged (TOURNAMENT § 13: « repérer les participants oubliés ») */
export function forgotten(st: GameState): Array<{ id: string; day: number }> {
  const out: Array<{ id: string; day: number }> = [];
  for (const id of Object.keys(RIVALS)) for (let d = 1; d <= st.day; d++) {
    const seen = st.log.some((e) => e.day === d && (e.cause === `offscreen:${id}` || (e.kind === 'match' && e.cause.includes(id))));
    if (!seen) out.push({ id, day: d });
  }
  return out;
}

export interface LabReport {
  policy: string; rules: CombatRules; seeds: number; games: Array<{ seed: number; hash: string; points: number; rank: number; wins: number; injuries: number; forge: string; events: string[] }>;
  rates: { playerWins: number; playerInjured: number; rivalInjured: number; eliminations: number; upsets: number; sabotaged: number; foiled: number };
  eventCounts: Record<string, number>;
  forgotten: number;
  /** TOURNAMENT § 13 « vérifier la transition vers les formats d'équipe »: outside the slice (phase I only) */
  teamTransition: string;
}

export function labReport(seeds: number[], policy: Policy, rules: CombatRules = 'classic'): LabReport {
  const games: LabReport['games'] = [], eventCounts: Record<string, number> = {};
  let wins = 0, inj = 0, rivalInj = 0, elim = 0, upsets = 0, sab = 0, foil = 0, forg = 0;
  for (const seed of seeds) {
    const g = autoplay(seed, policy, undefined, undefined, rules), st = g.state;
    const fired = st.log.filter((e) => e.kind === 'event' || e.kind === 'sign' || e.kind === 'consequence').map((e) => e.id);
    for (const id of fired) eventCounts[id] = (eventCounts[id] ?? 0) + 1;
    const w = st.tournament.matches.filter((m) => m.winner === PLAYER_ID).length;
    wins += w; inj += st.log.filter((e) => e.id === 'player-injured').length;
    rivalInj += Object.values(st.competitors).filter((c) => c.healthState !== 'fit').length;
    elim += Object.values(st.competitors).filter((c) => c.phaseStatus === 'eliminated').length;
    upsets += (st.flags.upsets as number) ?? 0;
    if (st.facts.includes('forge-burned')) sab++;
    if (st.facts.includes('saboteur-caught')) foil++;
    forg += forgotten(st).length;
    const rank = standings(st).findIndex((r) => r.id === PLAYER_ID) + 1;
    games.push({ seed, hash: g.hash, points: st.tournament.points[PLAYER_ID], rank, wins: w, injuries: st.player.injury, forge: st.services.forge, events: fired });
  }
  const n = seeds.length;
  return {
    policy: policy.name, rules, seeds: n, games, eventCounts, forgotten: forg,
    rates: { playerWins: wins / (2 * n), playerInjured: inj / n, rivalInjured: rivalInj / n, eliminations: elim / n, upsets: upsets / n, sabotaged: sab / n, foiled: foil / n },
    teamTransition: 'outside the slice: phase I (a points pool, 1v1) only; teams are typed (TeamState), never formed',
  };
}
