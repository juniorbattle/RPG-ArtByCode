import type { Rng } from '../core/rng';
import { clamp, type CompetitorState, type GameState, type MatchRecord } from '../simulation/state';
import type { Emit } from '../simulation/advance';
import { PLAYER_ID, POINTS, RIVALS, ROUNDS } from '../narrative/roster';
import { tx } from '../narrative/text';
import { isV2 } from '../simulation/v2';
import { DYN_PROFILES, DYN_RACE_SLOPE, dynRacerOf, PROFILES, raceWinChance, racerOf, type Mods } from '../combat/profiles';
import { autoWinner } from '../combat/auto';
import { autoOffscreen, autoRound } from '../combat/autoData';
import { stageOf } from '../combat/stats';

/** The pool of phase I (choice G3, journal Passe L2): eight competitors, two rounds in the slice, points (a defeat costs points, reputation,
 *  sometimes an injury, never the tournament). The matches the player does not fight are resolved by the damage race of the same combat
 *  profiles the arena plays (src/combat/profiles.ts; TOURNAMENT § 6), each from its own random stream; a version 2 game's by the duel played by the
 *  computer itself, the AI on both sides (AC-18, lot 2). Pure. */

export function initialCompetitors(): Record<string, CompetitorState> {
  const out: Record<string, CompetitorState> = {};
  for (const r of Object.values(RIVALS)) {
    out[r.id] = {
      id: r.id, phaseStatus: 'pool', combatProfile: r.profile, healthState: 'fit', preparation: 20, reputation: r.reputation, wealth: r.wealth,
      relationships: { ...r.relationships }, objectives: [...r.objectives], knownFacts: [],
    };
  }
  return out;
}

export function initialMatches(): MatchRecord[] {
  return ROUNDS.flatMap((r) => r.pairs.map(([a, b]) => ({ round: r.round, a, b, winner: null, close: false, day: r.day, seen: a === PLAYER_ID || b === PLAYER_ID })));
}

export function initialPoints(): Record<string, number> {
  return Object.fromEntries([PLAYER_ID, ...Object.keys(RIVALS)].map((id) => [id, 0]));
}

export const nameOf = (id: string): string => (id === PLAYER_ID ? 'you' : RIVALS[id]?.name ?? id);

/** what a competitor's state changes in a duel: its health (an injury) and its damage (its preparation) */
export function rivalMods(c: CompetitorState): Mods {
  return { hp: c.healthState === 'injured' ? 0.7 : c.healthState === 'hurt' ? 0.85 : 1, damage: 1 + c.preparation / 400 };
}

/** the player's match of this day, if any */
export function playerMatch(s: GameState, day = s.day): MatchRecord | undefined {
  return s.tournament.matches.find((m) => m.day === day && (m.a === PLAYER_ID || m.b === PLAYER_ID));
}
export const opponentOf = (m: MatchRecord): string => (m.a === PLAYER_ID ? m.b : m.a);
export const matchId = (m: MatchRecord): string => `r${m.round}:${m.a}-${m.b}`;

/** standings: points, then reputation, then id (a stable order) */
export function standings(s: GameState): Array<{ id: string; points: number; reputation: number }> {
  const rep = (id: string) => (id === PLAYER_ID ? s.player.reputation : s.competitors[id]?.reputation ?? 0);
  return Object.entries(s.tournament.points).map(([id, points]) => ({ id, points, reputation: rep(id) }))
    .sort((a, b) => b.points - a.points || b.reputation - a.reputation || (a.id < b.id ? -1 : 1));
}
export function rankOf(s: GameState, id: string): number { return standings(s).findIndex((r) => r.id === id) + 1; }

/** a rival's reading of a result (TOURNAMENT § 7: rivalries from facts): the proud resent who beat them, the honourable respect them */
function rivalry(s: GameState, loser: string, winner: string, humiliating: boolean): void {
  const c = s.competitors[loser], def = RIVALS[loser];
  if (!c || !def) return;
  const d = def.temper === 'proud' ? (humiliating ? -25 : -15) : def.temper === 'honourable' ? 8 : -5;
  c.relationships[winner] = clamp((c.relationships[winner] ?? 0) + d, -100, 100);
  if (!c.knownFacts.includes(`lost-to:${winner}`)) c.knownFacts.push(`lost-to:${winner}`);
}

/** the combat rules a game is played under: `flags.combat = 'dynamic'` for the « tour par tour dynamique » (src/combat/dynamic.ts, journal
 *  Passe C1; behind its parameter, CB-10: the TournamentLab's `--rules=dynamic` sets it); absent = the arena of today */
export function dynamicRules(s: GameState): boolean { return s.flags.combat === 'dynamic'; }
/** the duel played by the computer (briefs/combat-auto.md): every version 2 game's since lot 2 (journal Passe LC3; lot 1 kept it behind a laboratory's flag): the
 *  player's bouts, the challenges and the off-screen bouts in src/combat/auto.ts; today's game (`v2=0`) keeps its own */
export function autoDuelRules(s: Pick<GameState, 'flags'>): boolean { return isV2(s); }

/** the round's matches without the player, at the end of the match afternoon */
export function playOffscreenMatches(s: GameState, emit: Emit, rng: Rng): void {
  for (const m of s.tournament.matches) {
    if (m.day !== s.day || m.seen || m.winner) continue;
    const A = s.competitors[m.a], B = s.competitors[m.b], r = rng.fork(matchId(m));
    let aWins: boolean, close: boolean, upset: boolean, crushing: boolean;
    if (autoDuelRules(s)) {
      // the duel played by the computer (a version 2 game): the same duel, the AI on both sides (AC-18); close and crushing read on the winner's health as
      // the player's bout reads them; an upset, the less renowned beating one renowned 15 points more (« proposé » in lot 1, kept: journal Passe LC3)
      const d = autoOffscreen(A.id, B.id, { stage: stageOf(m.day, m.stage === 'final'), round: autoRound(m.day), seed: Math.floor(r.next() * 4294967296), a: { preparation: A.preparation, hp: rivalMods(A).hp }, b: { preparation: B.preparation, hp: rivalMods(B).hp } });
      const wi = autoWinner(d), share = d.hp[wi] / d.maxHp[wi];
      aWins = wi === 0; close = share <= 0.25; crushing = share > 0.7;
      upset = (aWins ? B : A).reputation - (aWins ? A : B).reputation >= 15;
    } else {
      const p = dynamicRules(s)
        ? raceWinChance(dynRacerOf(DYN_PROFILES[A.combatProfile], rivalMods(A)), dynRacerOf(DYN_PROFILES[B.combatProfile], rivalMods(B)), 0, DYN_RACE_SLOPE)
        : raceWinChance(racerOf(PROFILES[A.combatProfile], rivalMods(A)), racerOf(PROFILES[B.combatProfile], rivalMods(B)));
      aWins = r.next() < p;
      const pw = aWins ? p : 1 - p;
      close = pw < 0.62; upset = pw < 0.4; crushing = pw > 0.85;
    }
    const [w, l] = aWins ? [A, B] : [B, A];
    m.winner = w.id; m.close = close;
    // the pool's points: a bout of the version 2's bracket (its `stage`) gives none (journal Passe VP1: the standings stay the pool's)
    if (!m.stage) { s.tournament.points[w.id] += POINTS.win; s.tournament.points[l.id] += m.close ? POINTS.close : POINTS.loss; }
    w.reputation = clamp(w.reputation + (upset ? 10 : 5)); l.reputation = clamp(l.reputation - (m.close ? 1 : 3));
    rivalry(s, l.id, w.id, crushing);
    if (r.next() < (m.close ? 0.35 : 0.2)) l.healthState = 'hurt';
    if (!w.knownFacts.includes(`beat:${l.id}`)) w.knownFacts.push(`beat:${l.id}`);
    if (upset) s.flags.upsets = ((s.flags.upsets as number) ?? 0) + 1;
    emit({
      kind: 'match', id: upset ? 'upset' : 'result', cause: `match:${matchId(m)}`, visible: true,
      text: tx('match.result', { winner: RIVALS[w.id].name, loser: RIVALS[l.id].name, close: m.close ? tx('match.close') : '', upset: upset ? tx('match.upset') : '', limp: l.healthState === 'hurt' ? tx('match.limp', { loser: RIVALS[l.id].name }) : '' }),
    });
  }
}

/** the result of the player's own duel (fought in the arena, or by the bot headless) */
export interface DuelOutcome {
  winner: 'player' | 'opponent';
  playerHp: number; playerMaxHp: number; opponentHp: number; opponentMaxHp: number;
  /** the kind of the blow that ended it ('light' | 'heavy' | 'tech'), when one did */
  finisher: string | null;
}

/** a bout's purse, won or lost: 20 / 5 in today's game and the version 2's pool; in a version 2 game's bracket the purses rise with the tournament (the
 *  operator's ECO-4 « Bourses qui montent : jour 6 35 / 10, jour 8 45 / 15, finale 80 / 30 », journal Passe ECO2); the champion's 100 apart (v2calendar.ts) */
export const PURSES: Record<'pool' | 'semi' | 'gate' | 'third' | 'gateFinal' | 'final', readonly [number, number]> = { pool: [20, 5], semi: [35, 10], gate: [35, 10], third: [45, 15], gateFinal: [45, 15], final: [80, 30] };
export function boutPurse(s: Pick<GameState, 'flags'>, m: Pick<MatchRecord, 'stage'>, won: boolean): number {
  const p = isV2(s) ? PURSES[(m.stage ?? 'pool') as keyof typeof PURSES] ?? PURSES.pool : PURSES.pool;
  return won ? p[0] : p[1];
}

export function applyPlayerDuel(s: GameState, o: DuelOutcome, emit: Emit): void {
  const m = playerMatch(s);
  if (!m) throw new Error('no duel for the player today');
  const opp = opponentOf(m), c = s.competitors[opp], won = o.winner === 'player';
  const close = won ? o.playerHp / o.playerMaxHp <= 0.25 : o.opponentHp / o.opponentMaxHp <= 0.25;
  m.winner = won ? PLAYER_ID : opp; m.close = close;
  if (!m.stage) {
    s.tournament.points[won ? PLAYER_ID : opp] += POINTS.win;
    s.tournament.points[won ? opp : PLAYER_ID] += close ? POINTS.close : POINTS.loss;
  }
  const P = s.player, name = RIVALS[opp].name;
  // the vigour of a version 2 game (the operator's DB7-4 « +12 PV par victoire », journal Passe DB8: src/simulation/v2gear.ts v2Stats)
  if (won && s.v2) s.v2.wins = (s.v2.wins ?? 0) + 1;
  if (won) {
    P.reputation = clamp(P.reputation + (opp === 'marek' ? 20 : 15)); P.coins += boutPurse(s, m, true);
    c.reputation = clamp(c.reputation - (close ? 1 : 4));
    rivalry(s, opp, PLAYER_ID, o.playerHp / o.playerMaxHp > 0.7);
    // a version 2 game (lot L4, EV-9 « Chaque rival se souvient »): the rival remembers a beating taken with the player barely touched, the day it came
    if (isV2(s) && o.playerHp / o.playerMaxHp > 0.7) c.knownFacts.push(`humbled-by:${PLAYER_ID}:${m.day}`);
  } else {
    P.reputation = clamp(P.reputation + (close ? 2 : -5)); P.coins += boutPurse(s, m, false);
    c.reputation = clamp(c.reputation + 5);
    if (!c.knownFacts.includes('beat:player')) c.knownFacts.push('beat:player');
  }
  // an injury: knocked down by a heavy blow, or a win paid for with nearly all one's health (GAMEPLAY § 11: the failure opens answers); in a
  // version 2 game the knock-down alone (the operator's V2B1-1 « A. K.O. par un coup puissant », journal Passe V2B1): the charge is paid in
  // health, and a win never wounds
  const hurt = (!won && o.finisher === 'heavy') || (!isV2(s) && won && o.playerHp / o.playerMaxHp < 0.15);
  if (hurt) P.injury = Math.min(2, P.injury + 1);
  P.training = 0; if (s.v2?.prep) s.v2.prep = [];
  P.items = P.items.filter((i) => i !== 'whetstone');
  emit({
    kind: 'match', id: won ? 'player-won' : 'player-lost', cause: `match:${matchId(m)}`, visible: true,
    // a version 2 game says its purse (ECO-4, journal Passe ECO2); today's game keeps its line word for word
    text: won ? (isV2(s) ? tx('v2.duel.won', { name, close: close ? tx('duel.wonClose') : '', rep: opp === 'marek' ? 20 : 15, n: boutPurse(s, m, true) }) : tx('duel.won', { name, close: close ? tx('duel.wonClose') : '', rep: opp === 'marek' ? 20 : 15 }))
      // a defeat in the version 2's bracket says what it costs there (journal Passe VP1), not the pool's rule
      : m.stage ? tx(m.stage === 'semi' ? 'v2.duel.lostSemi' : m.stage === 'gate' ? 'v2.duel.lostGate' : m.stage === 'final' ? 'v2.duel.lostFinal' : 'v2.duel.lostLast', { name, close: close ? tx('v2.duel.lostClose') : '' })
      : tx('duel.lost', { name, close: close ? tx('duel.lostClose') : '' }),
  });
  if (hurt) emit({ kind: 'consequence', id: 'player-injured', cause: `match:${matchId(m)}`, visible: true, text: tx('duel.injured') });
  // a version 2 game (lot L3, the operator's EV-10 « Une réponse par lieu, un effet lisible », journal Passe EV2): a strap cut in the night and fought on is found
  // when the gear comes off; Lady Edda can then name the servant's colours (src/narrative/dialogue.ts)
  if (isV2(s) && s.flags[`tampered:${s.day}`] && !s.flags[`checked:${s.day}`]) {
    if (!s.facts.includes('tamper-suffered')) s.facts.push('tamper-suffered');
    emit({ kind: 'consequence', id: 'tamper:suffered', cause: `match:${matchId(m)}`, visible: true, text: tx('v2.tamper.suffered') });
  }
}
