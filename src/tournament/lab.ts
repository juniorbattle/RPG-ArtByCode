import { advance, actions, newGame, hash } from '../simulation/advance';
import type { Action } from '../simulation/actions';
import type { GameEvent, GameState } from '../simulation/state';
import { runBotDuel, runDynamicBotDuel, runV2BotDuel } from '../combat/bot';
import { challengeSheetFor, dynSheetData, matchSheetFor, sheetData, v2SheetData } from '../combat/match';
import { RIVALS, PLAYER_ID } from '../narrative/roster';
import type { DuelOutcome } from './pool';
import { dynamicRules, standings } from './pool';
import { isV2, makeV2, v2KitOf } from '../simulation/v2';
import { v2Mods } from '../simulation/v2gear';
import { v2Ranking } from './v2calendar';
import { SKILL_BOOK } from '../combat/skillbook';
import { marksOf, wanted } from '../simulation/v2law';
import { argChance, PASSERS } from '../simulation/v2barter';
import { pocketChance, stealChance } from '../simulation/v2town';
import { SHOPS, type ShopId } from '../simulation/gear';
import { scoutable } from '../simulation/roles';
import { boutTomorrow, nextOpponent, RUMOUR } from '../simulation/v2intel';
import { opponentOf } from './pool';
import { PEOPLE, placeOf } from '../narrative/people';
import type { PlaceId } from '../simulation/state';

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

/** a challenge in town, fought by the bot at this skill in the version 2's duel (lot L2a: the curious player's challenges) */
export function challengeOutcome(st: GameState, skill: number): DuelOutcome {
  const sh = challengeSheetFor(st);
  if (!sh) throw new Error('no challenge waiting');
  const v2 = v2SheetData(sh, undefined, v2KitOf(st), v2Mods(st)), r = runV2BotDuel(v2.data, v2.tiers, { skill, seed: sh.seed ^ 0x5bd1e995 });
  if (!r.winner) throw new Error(`challenge ${sh.id}: no K.O. after ${r.t} s`);
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
      if (isV2(st)) return diligentV2(st);
      for (const a of [{ type: 'payWatch' }, { type: 'rest' }] as Action[]) if (has(st, a)) return a;
      if (st.slot === 'evening' && st.place !== 'district') return { type: 'move', to: 'district' };
      if (st.slot !== 'evening' && !(st.slot === 'afternoon' && matchSheetFor(st))) {
        if (st.place !== 'forecourt') return { type: 'move', to: 'forecourt' };
        if (has(st, { type: 'train' })) return { type: 'train' };
      }
      return fallback(st, 0.6);
    },
  },
  /** the curious player (lot L2a, the operator's EV-16 « Ajouter le joueur curieux au laboratoire », journal Passe EVL2): the diligent's care, and the
   *  town's actions a person tries: bargains when buying, steals while Hale's ledger is clean, challenges and brings what it learns, pays the watch only
   *  after a sign, settles with Sergeant Hale when the watch wants it; a version 2 game only (today's game plays the diligent). Lot L3 (EV-10, EV-11, journal
   *  Passe EVL5): the watch after a sign at the forge only, Clerk Odo's strongroom on the eve of a bout after a sign at the lockers, a rumour of tomorrow's opponent
   *  from Lio's room, its next opponent watched wherever they train, Lady Edda asked whose servant cut a strap it fought on, the culprit reported to Hale */
  curious: { name: 'curious', skill: 0.6, choose: (st) => (isV2(st) ? curiousV2(st) : POLICIES.diligent.choose(st)) },
};

/** the same diligence in a version 2 game (journal Passe VP1: today's policy only waited there, its practice sand moved to the training
 *  ground): the healer when hurt (the forecourt, else rest), the watch paid at dusk, Hilde's look at the gear on the morning of a bout once a
 *  sign was seen, the armourer's padded jack then mail shirt when the purse allows (worn at once), and the training ground's sand by day */
function diligentV2(st: GameState): Action {
  const bout = st.slot === 'afternoon' && !!matchSheetFor(st), hurt = st.player.injury > 0;
  // an action that holds at a place (moves take no time: the policy walks there only for what it can do there)
  const at = (place: string, a: Action): Action | null => (has(st.place === place ? st : { ...st, place: place as GameState['place'] }, a) ? (st.place === place ? a : { type: 'move', to: place } as Action) : null);
  if (st.slot === 'evening') return at('district', { type: 'payWatch' }) ?? (hurt && has(st, { type: 'rest' }) ? { type: 'rest' } : fallback(st, 0.6));
  if (bout) return fallback(st, 0.6);
  if (hurt) { const h = at('forecourt', { type: 'heal' }); if (h) return h; if (has(st, { type: 'rest' })) return { type: 'rest' }; }
  const boutToday = st.tournament.matches.some((m) => m.day === st.day && (m.a === PLAYER_ID || m.b === PLAYER_ID));
  if (st.slot === 'morning' && boutToday && st.facts.includes('armour-asked')) { const c = at('forecourt', { type: 'checkGear' }); if (c) return c; }
  const armour = st.v2?.gear?.armour, want = !armour ? 'padded-jack' : armour === 'padded-jack' ? 'mail-shirt' : null;
  if (want && st.player.coins >= (want === 'padded-jack' ? 25 : 50)) { const b = at('forecourt', { type: 'shopBuy', shop: 'armourer', item: want }); if (b) return b; }
  return at('training', { type: 'train' }) ?? fallback(st, 0.6);
}

/** the curious player's version 2 day (« proposé », a policy, not a person): see POLICIES.curious */
function curiousV2(st: GameState): Action {
  const bout = st.slot === 'afternoon' && !!matchSheetFor(st), hurt = st.player.injury > 0, marks = marksOf(st);
  const there = (place: string): GameState => (st.place === place ? st : { ...st, place: place as PlaceId });
  const at = (place: string, a: Action): Action | null => (has(there(place), a) ? (st.place === place ? a : { type: 'move', to: place } as Action) : null);
  const first = (...xs: Array<() => Action | null>): Action | null => { for (const f of xs) { const a = f(); if (a) return a; } return null; };
  // a challenge accepted is fought at once (its bout takes the slot)
  if (st.v2?.challenge) return { type: 'challengeResult', outcome: challengeOutcome(st, 0.6) };
  // brings what it learnt: a skill won by a challenge takes the place of the start skill of its family
  const kit = v2KitOf(st), learnt = Object.values(SKILL_BOOK).filter((k) => k.source === 'challenge' && (kit.levels[k.id] ?? 0) > 0 && !(kit.loadout as string[]).includes(k.id));
  for (const k of learnt) { const i = (kit.loadout as string[]).findIndex((id) => SKILL_BOOK[id]?.source === 'start' && SKILL_BOOK[id]?.family === k.family); if (i >= 0) { const four = [...kit.loadout] as string[]; four[i] = k.id; return { type: 'setLoadout', skills: four }; } }
  // the watch wants a word: settle with Sergeant Hale
  if (wanted(st)) { const r = at('district', { type: 'restitute' }); if (r) return r; }
  // lot L3 (EV-10 « Une réponse par lieu »): the forge's signs send it to Hale's watch on the quay, the gear's to Clerk Odo's strongroom on the eve of a bout
  const forgeSigns = ['lamp-oil', 'loiterer'].some((f) => st.facts.includes(f)) && st.services.forge === 'open' && !st.facts.includes('saboteur-caught');
  const gearSigns = ['armour-asked', 'locker-open'].some((f) => st.facts.includes(f)) && !st.flags['tamper-done'];
  const strongroom = (): Action | null => (gearSigns && boutTomorrow(st) ? at('forecourt', { type: 'lockGear' }) : null);
  // the investigation and its compensation (EV-10): a strap cut and fought on, Lady Edda names the colours; a culprit known, reported to Sergeant Hale
  const investigate = (): Action | null => (st.facts.includes('tamper-suffered') && !st.flags['culprit-known'] ? at('forecourt', { type: 'talk', who: 'edda' }) : null)
    ?? (st.flags['culprit-known'] && !st.flags.reported && !st.facts.includes('saboteur-caught') ? at('district', { type: 'report' }) : null);
  // a rumour of tomorrow's opponent from Lio's room (EV-11), a purse kept for the healer
  const rumour = (): Action | null => (boutTomorrow(st) && nextOpponent(st) && st.player.coins >= RUMOUR.lio.coins + 8 ? at('lanterns', { type: 'rumour', src: 'lio' }) : null);
  // a passer-by's piece, the best argument first, then its price (a purse kept for the healer)
  const barter = (): Action | null => {
    for (const who of Object.keys(PASSERS)) {
      const place = PEOPLE[who].place, p = PASSERS[who];
      if (st.player.coins < p.price * 0.7 + 8) continue;
      const args = (['soft', 'name'] as const).slice().sort((a, b) => argChance(st, b, who) - argChance(st, a, who));
      for (const arg of args) { const a = at(place, { type: 'barter', who, arg }); if (a) return a; }
      if (st.player.coins >= p.price + 8) { const a = at(place, { type: 'barter', who }); if (a) return a; }
    }
    return null;
  };
  // a theft while Hale's ledger is clean and the chance is good: a stall, or a passer-by's pocket
  const steal = (): Action | null => {
    if (marks > 0) return null;
    for (const shop of Object.keys(SHOPS) as ShopId[]) { const pl = SHOPS[shop].place; if (stealChance(there(pl), shop) >= 0.45) { const a = at(pl, { type: 'steal', shop }); if (a) return a; } }
    for (const who of Object.keys(PASSERS)) { const pl = PEOPLE[who].place; if (pocketChance(there(pl)) >= 0.45) { const a = at(pl, { type: 'pickpocket', who }); if (a) return a; } }
    return null;
  };
  // the muscle a robbed owner paid waits on the quay at night (lot L2b): faced when the player is whole, else paid off when the purse allows
  const reprisal = (): Action | null => (!st.v2?.reprisal ? null : (hurt && st.player.coins >= 30 ? at('district', { type: 'payMuscle' }) : null) ?? at('district', { type: 'faceMuscle' }) ?? at('district', { type: 'payMuscle' }));
  if (st.slot === 'evening') return first(reprisal, () => (forgeSigns ? at('district', { type: 'payWatch' }) : null), investigate, barter, steal, () => (hurt && has(st, { type: 'rest' }) ? { type: 'rest' } : null)) ?? fallback(st, 0.6);
  if (bout) return fallback(st, 0.6);
  if (hurt) { const h = at('forecourt', { type: 'heal' }); if (h) return h; if (has(st, { type: 'rest' })) return { type: 'rest' }; }
  const boutToday = st.tournament.matches.some((m) => m.day === st.day && (m.a === PLAYER_ID || m.b === PLAYER_ID));
  if (st.slot === 'morning' && boutToday && st.facts.includes('armour-asked')) { const c = at('forecourt', { type: 'checkGear' }); if (c) return c; }
  // the armour as the diligent buys it, with an argument first (the best chance), then at its price
  const armour = st.v2?.gear?.armour, want = !armour ? 'padded-jack' : armour === 'padded-jack' ? 'mail-shirt' : null;
  const buy = (): Action | null => {
    if (!want || st.player.coins < (want === 'padded-jack' ? 25 : 50)) return null;
    const args = (['name', 'friend', 'pair'] as const).slice().sort((a, b) => argChance(st, b, 'hilde') - argChance(st, a, 'hilde'));
    for (const arg of args) { const a = at('forecourt', { type: 'bargain', shop: 'armourer', item: want, arg }); if (a) return a; }
    return at('forecourt', { type: 'shopBuy', shop: 'armourer', item: want });
  };
  // a challenge (lot L2b: a stake, once per phase): the three who teach first, then from day 6 a rival out of the title, then the generic fighters; coins staked
  // when the purse allows, else the name
  const challenge = (): Action | null => {
    const stake = st.player.coins >= 30 ? 'coins' as const : st.player.reputation >= 15 ? 'name' as const : null;
    if (!stake) return null;
    for (const who of ['orla', 'ilse', 'vessa', 'marek', 'cassius', 'rhosk', 'tobin', 'aldric', 'ambrose', 'lucan', 'piers', 'kell']) { const a = at(PEOPLE[who].v2at?.place ?? PEOPLE[who].place, { type: 'challenge', who, stake }); if (a) return a; }
    return null;
  };
  // watches its next opponent at practice when it can: wherever they train since lot L3 (EV-11 « Observer tout adversaire »)
  const scout = (): Action | null => { const m = st.tournament.matches.find((x) => x.day > st.day && !x.winner && (x.a === PLAYER_ID || x.b === PLAYER_ID)), o = m ? opponentOf(m) : null; return o && scoutable(st).includes(o) ? at(placeOf(PEOPLE[o], true), { type: 'scout', who: o }) : null; };
  return first(strongroom, investigate, buy, barter, steal, rumour, challenge, scout, () => at('training', { type: 'train' })) ?? fallback(st, 0.6);
}

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
  /** a version 2 game's ten days (lot V6): the player's bouts, the cut, the final and the crown, the final order's histogram; the town's actions
   *  per game (lot L2a): thefts, caught, found at dawn, searched, settled at Hale's, bargains put and won, passers-by's pieces, challenges and wins, the
   *  marks left in Hale's ledger at the end, the pool's points lost to the registrar */
  v2?: { bouts: number; madeCut: number; finalist: number; champion: number; ranks: number[]; town: Record<string, number> };
}

export function labReport(seeds: number[], policy: Policy, rules: CombatRules = 'classic'): LabReport {
  const games: LabReport['games'] = [], eventCounts: Record<string, number> = {};
  let bouts = 0, cutIn = 0, finals = 0, crowns = 0;
  const ranks = [0, 0, 0, 0, 0, 0, 0, 0];
  const town: Record<string, number> = { thefts: 0, caught: 0, found: 0, searched: 0, settled: 0, bargains: 0, bargainsWon: 0, barters: 0, challenges: 0, challengesWon: 0, marks: 0, pointsLost: 0 };
  const count = (st: GameState, ...ids: string[]) => st.log.filter((e) => ids.includes(e.id)).length;
  let wins = 0, inj = 0, rivalInj = 0, elim = 0, upsets = 0, sab = 0, foil = 0, forg = 0;
  for (const seed of seeds) {
    const g = autoplay(seed, policy, undefined, undefined, rules), st = g.state;
    const fired = st.log.filter((e) => e.kind === 'event' || e.kind === 'sign' || e.kind === 'consequence').map((e) => e.id);
    for (const id of fired) eventCounts[id] = (eventCounts[id] ?? 0) + 1;
    const w = st.tournament.matches.filter((m) => m.winner === PLAYER_ID).length;
    bouts += st.tournament.matches.filter((m) => m.a === PLAYER_ID || m.b === PLAYER_ID).length;
    if (rules === 'v2') {
      const r = v2Ranking(st).indexOf(PLAYER_ID); ranks[r]++;
      if (st.tournament.matches.some((m) => m.stage === 'semi' && (m.a === PLAYER_ID || m.b === PLAYER_ID))) cutIn++;
      if (st.tournament.matches.some((m) => m.stage === 'final' && (m.a === PLAYER_ID || m.b === PLAYER_ID))) finals++;
      if (st.flags.champion === PLAYER_ID) crowns++;
      town.thefts += (st.v2?.thefts ?? []).length; town.caught += count(st, 'steal:caught', 'pocket:caught'); town.found += count(st, 'theft:found');
      town.searched += count(st, 'theft:search'); town.settled += count(st, 'theft:settled'); town.bargains += count(st, 'bargain:won', 'bargain:lost', 'barter:won', 'barter:lost');
      town.bargainsWon += count(st, 'bargain:won', 'barter:won'); town.barters += Object.keys(st.v2?.passed ?? {}).length; town.challenges += count(st, 'challenge:won', 'challenge:lost');
      town.challengesWon += count(st, 'challenge:won'); town.marks += marksOf(st); town.pointsLost += count(st, 'registrar:point');
    }
    wins += w; inj += st.log.filter((e) => e.id === 'player-injured').length;
    rivalInj += Object.values(st.competitors).filter((c) => c.healthState !== 'fit').length;
    elim += Object.values(st.competitors).filter((c) => c.phaseStatus === 'eliminated').length;
    upsets += (st.flags.upsets as number) ?? 0;
    if (st.facts.includes('forge-burned')) sab++;
    if (st.facts.includes('saboteur-caught')) foil++;
    forg += forgotten(st).length;
    const rank = rules === 'v2' ? v2Ranking(st).indexOf(PLAYER_ID) + 1 : standings(st).findIndex((r) => r.id === PLAYER_ID) + 1;
    games.push({ seed, hash: g.hash, points: st.tournament.points[PLAYER_ID], rank, wins: w, injuries: st.player.injury, forge: st.services.forge, events: fired });
  }
  const n = seeds.length;
  return {
    policy: policy.name, rules, seeds: n, games, eventCounts, forgotten: forg,
    rates: { playerWins: wins / bouts, playerInjured: inj / n, rivalInjured: rivalInj / n, eliminations: elim / n, upsets: upsets / n, sabotaged: sab / n, foiled: foil / n },
    teamTransition: 'outside the slice: phase I (a points pool, 1v1) only; teams are typed (TeamState), never formed',
    ...(rules === 'v2' ? { v2: { bouts: bouts / n, madeCut: cutIn / n, finalist: finals / n, champion: crowns / n, ranks, town: Object.fromEntries(Object.entries(town).map(([k, v]) => [k, v / n])) } } : {}),
  };
}
