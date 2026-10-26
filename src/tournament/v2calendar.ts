import { DAYS, clamp, type GameState, type MatchRecord } from '../simulation/state';
import type { Emit } from '../simulation/advance';
import { isV2 } from '../simulation/v2';
import { PLAYER_ID, RIVALS } from '../narrative/roster';
import { tx } from '../narrative/text';
import { nameOf, standings } from './pool';

/** The ten days of the version 2's tournament (lot V6, journal Passe V6; the project contract's planning lock, § 4: « 1 arrivée, inscription,
 *  découverte de la ville » ... « 10 finale et résolution des principaux arcs »). Phase I only: the duels of the individual phase (the
 *  contract's team phase is a recorded gap, journal Passe V6). « Proposé »:
 *  - three rounds of the pool (days 2, 4, 5: the first match, the second, the first great selection), every competitor in each, a defeat costs
 *    points and never the tournament;
 *  - the cut at the end of day 5's afternoon: the best four go on to the semi-finals (day 6, 1 v 4 and 2 v 3); the four others fight the Gate
 *    bouts the same day (5 v 8, 6 v 7: a purse and a name, never nothing to do);
 *  - day 8, the major match: the semi-finals' losers fight for the third place, the Gate bouts' winners the Gate final;
 *  - day 10: the final (the semi-finals' winners); the champion crowned at dusk, the arcs resolved, the game over after its evening;
 *  - days 3, 7 and 9: free preparation (the contract's « préparation libre », « enquête, recrutement, récupération », « préparation finale »).
 *  Pure. */

export const V2_DAYS = 10;
/** the days a game lasts: today's slice (3), or the version 2's tournament (10) */
export function daysOf(s: Pick<GameState, 'flags'>): number { return isV2(s) ? V2_DAYS : DAYS; }

/** the pool's three rounds: each pair meets once; the player meets the proud duelist, the docks' fighter, then the noble */
export const V2_ROUNDS: ReadonlyArray<{ round: number; day: number; pairs: ReadonlyArray<readonly [string, string]> }> = [
  { round: 1, day: 2, pairs: [[PLAYER_ID, 'vessa'], ['marek', 'tobin'], ['orla', 'rhosk'], ['cassius', 'ilse']] },
  { round: 2, day: 4, pairs: [[PLAYER_ID, 'orla'], ['marek', 'cassius'], ['vessa', 'ilse'], ['tobin', 'rhosk']] },
  { round: 3, day: 5, pairs: [[PLAYER_ID, 'cassius'], ['marek', 'ilse'], ['vessa', 'rhosk'], ['orla', 'tobin']] },
];
export type Stage = 'semi' | 'gate' | 'third' | 'gateFinal' | 'final';

/** the ten days' structure: the act, the day's kind (shown by the board and the heralds) */
export const V2_DAY_KIND: Record<number, 'arrival' | 'pool' | 'free' | 'cut' | 'semis' | 'major' | 'final'> = {
  1: 'arrival', 2: 'pool', 3: 'free', 4: 'pool', 5: 'cut', 6: 'semis', 7: 'free', 8: 'major', 9: 'free', 10: 'final',
};
const DAY_LINE: Record<number, () => string> = {
  2: () => tx('v2.day.2'), 3: () => tx('v2.day.3'), 4: () => tx('v2.day.4'), 5: () => tx('v2.day.5'), 6: () => tx('v2.day.6'),
  7: () => tx('v2.day.7'), 8: () => tx('v2.day.8'), 9: () => tx('v2.day.9'), 10: () => tx('v2.day.10'),
};
export const actOf = (day: number): 1 | 2 | 3 => (day <= 5 ? 1 : day <= 8 ? 2 : 3);

export function v2Matches(): MatchRecord[] {
  return V2_ROUNDS.flatMap((r) => r.pairs.map(([a, b]) => ({ round: r.round, a, b, winner: null, close: false, day: r.day, seen: a === PLAYER_ID || b === PLAYER_ID })));
}

const match = (round: number, day: number, a: string, b: string, stage: Stage): MatchRecord =>
  ({ round, a, b, winner: null, close: false, day, seen: a === PLAYER_ID || b === PLAYER_ID, stage });
const winnerOf = (m: MatchRecord) => m.winner!;
const loserOf = (m: MatchRecord) => (m.winner === m.a ? m.b : m.a);
export const stageMatches = (s: GameState, stage: Stage): MatchRecord[] => s.tournament.matches.filter((m) => m.stage === stage);
/** a match's name: its round of the pool, or its stage of the bracket */
export function stageName(m: MatchRecord): string {
  return m.stage === 'semi' ? tx('v2.stage.semi') : m.stage === 'gate' ? tx('v2.stage.gate') : m.stage === 'third' ? tx('v2.stage.third') : m.stage === 'gateFinal' ? tx('v2.stage.gateFinal') : m.stage === 'final' ? tx('v2.stage.final') : tx('v2.stage.pool', { round: m.round });
}

/** after a slot of a version 2 game: the bracket's next round once the day's bouts are fought (the cut after day 5's afternoon, the major
 *  match after day 6's, the final after day 8's) */
export function v2AfterSlot(s: GameState, ended: string, emit: Emit): void {
  if (!isV2(s)) return;
  // the heralds cry the next day's kind at nightfall (the board's line of the morning); their cry stirs the town as today's heralds do every
  // morning (src/events/catalog.ts, which a version 2 game keeps for the first day only: journal Passe VP1)
  if (ended === 'evening' && s.day < V2_DAYS) {
    s.flags['pulse:excitement'] = ((s.flags['pulse:excitement'] as number) ?? 0) + 3;
    emit({ kind: 'slot', id: `v2:day:${s.day + 1}`, cause: 'the tournament calendar', visible: true, day: s.day + 1, slot: 'morning', text: DAY_LINE[s.day + 1]() });
  }
  if (ended !== 'afternoon') return;
  if (s.day === 5) cut(s, emit);
  else if (s.day === 6) major(s, emit);
  else if (s.day === 8) final(s, emit);
  else if (s.day === 10) crown(s, emit);
}

function cut(s: GameState, emit: Emit): void {
  const order = standings(s).map((r) => r.id), top = order.slice(0, 4), rest = order.slice(4, 8);
  for (const id of order) { const c = s.competitors[id]; if (c) c.phaseStatus = top.includes(id) ? 'semi' : 'gate'; }
  s.tournament.matches.push(match(4, 6, top[0], top[3], 'semi'), match(4, 6, top[1], top[2], 'semi'), match(4, 6, rest[0], rest[3], 'gate'), match(4, 6, rest[1], rest[2], 'gate'));
  const inside = top.includes(PLAYER_ID);
  emit({ kind: 'match', id: inside ? 'cut:in' : 'cut:out', cause: 'tournament:cut', visible: true, text: inside
    ? tx('v2.cut.in', { rank: top.indexOf(PLAYER_ID) + 1, four: top.filter((id) => id !== PLAYER_ID).map((id) => RIVALS[id].name).join(', ') })
    : tx('v2.cut.out', { four: top.map((id) => RIVALS[id].name).join(', ') }) });
}

function major(s: GameState, emit: Emit): void {
  const semis = stageMatches(s, 'semi'), gates = stageMatches(s, 'gate');
  s.tournament.matches.push(match(5, 8, loserOf(semis[0]), loserOf(semis[1]), 'third'), match(5, 8, winnerOf(gates[0]), winnerOf(gates[1]), 'gateFinal'));
  for (const m of semis) { const c = s.competitors[loserOf(m)]; if (c) c.phaseStatus = 'third'; }
  const fin = semis.map(winnerOf);
  for (const id of fin) { const c = s.competitors[id]; if (c) c.phaseStatus = 'final'; }
  emit({ kind: 'match', id: 'finalists', cause: 'tournament:semis', visible: true, text: tx('v2.finalists', { a: cap(nameOf(fin[0])), b: nameOf(fin[1]) }) });
}

function final(s: GameState, emit: Emit): void {
  const fin = stageMatches(s, 'semi').map(winnerOf);
  s.tournament.matches.push(match(6, 10, fin[0], fin[1], 'final'));
  emit({ kind: 'match', id: 'final-set', cause: 'tournament:major', visible: true, text: tx('v2.finalSet', { a: cap(nameOf(fin[0])), b: nameOf(fin[1]) }) });
}

function crown(s: GameState, emit: Emit): void {
  const f = stageMatches(s, 'final')[0];
  if (!f?.winner) return;
  const champ = f.winner;
  s.flags.champion = champ;
  const c = s.competitors[champ]; if (c) { c.phaseStatus = 'champion'; c.reputation = clamp(c.reputation + 15); }
  if (champ === PLAYER_ID) { s.player.reputation = clamp(s.player.reputation + 20); s.player.coins += 100; }
  emit({ kind: 'match', id: champ === PLAYER_ID ? 'crowned' : 'champion', cause: 'tournament:final', visible: true,
    text: champ === PLAYER_ID ? tx('v2.crowned') : tx('v2.champion', { name: RIVALS[champ].name }) });
}

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** the final order once the tournament is over (or as far as it went): the final, the third place, the Gate final, the Gate bouts' losers, then
 *  the pool's order */
export function v2Ranking(s: GameState): string[] {
  const out: string[] = [], put = (id: string | undefined) => { if (id && !out.includes(id)) out.push(id); };
  const one = (st: Stage) => stageMatches(s, st)[0];
  for (const st of ['final', 'third', 'gateFinal'] as Stage[]) { const m = one(st); if (m?.winner) { put(m.winner); put(loserOf(m)); } }
  for (const id of standings(s).map((r) => r.id)) put(id);
  return out;
}

/** the epilogue's line by the player's place (shown on the end screen) */
export function v2EndLine(s: GameState): string {
  const r = v2Ranking(s).indexOf(PLAYER_ID) + 1;
  return r === 1 ? tx('v2.end.champion') : r === 2 ? tx('v2.end.final') : r <= 4 ? tx('v2.end.semis', { rank: r }) : r <= 6 ? tx('v2.end.gate', { rank: r }) : tx('v2.end.out', { rank: r });
}
