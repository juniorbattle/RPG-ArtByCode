import { clamp, type GameState } from './state';
import type { ActionDef } from './actions';
import type { Emit } from './advance';
import { isV2 } from './v2';
import { learnFromChallenge, sandLesson } from './v2skills';
import { keepOutcomeNote } from './v2notes';
import { GEAR, SHOPS, type ShopId } from './gear';
import { gearOf, itemName } from './v2gear';
import { holds, recordTheft, registrarOnCatch, wanted } from './v2law';
import { PASSERS, passerOpen, passersHere } from './v2barter';
import { applyReprisal } from './v2law';
import { GENERICS, MUSCLE } from '../narrative/generics';
import { LATE_TEACHER, taughtBy } from '../combat/skillbook';
import { playerMatch } from '../tournament/pool';
import { PEOPLE, placeOf, presentAt } from '../narrative/people';
import { PLAYER_ID, RIVALS } from '../narrative/roster';
import { tx } from '../narrative/text';
import { available } from './roles';
import { watchPost } from './v2watch';
import type { DuelOutcome } from '../tournament/pool';

/** The town's actions of the version 2 (lot V4; the operator's decision AV-11 « Les trois, le vol avec ses conséquences », journal Passe V4):
 *  haggling, challenging, stealing, « comme Octopath Traveler », kept structured and simple. None is a mini-game apart (GAMEPLAY § 1): each
 *  changes a real state (a price of the day, a skill and its level, the purse, the reputation, a keeper's goodwill, a shop's door).
 *  - haggle: once a day per shop; the chance follows the reputation and the keeper's goodwill; a bargain (15 % off for the day), or a grudge
 *    (a tenth more, the goodwill down);
 *  - challenge: a duel in town against a fighter who teaches a skill (src/combat/skillbook.ts); it takes a slot (GAMEPLAY § 4.1: a structured
 *    activity), fought in the arena's sand at half health (sparring); won: the skill learnt, or raised; lost: a little reputation, no wound;
 *  - steal: a real risk, easier at night and when the watch is thin; taken: the shop's cheapest piece not owned; caught: the reputation falls,
 *    the watch fines the player (what the purse holds, up to 15 coins), the keeper bars the door for the day and marks the prices up the next
 *    day (the other districts' shops stay open: GAMEPLAY § 10's designed alternative); never a dead end (no jail: the escape the project
 *    contract's anti-frustration rule asks for). Every number is « proposé ». Pure. */

/** the three a challenge can be put to from the first day (where and when they stand: src/narrative/people.ts) */
export const CHALLENGERS: Record<string, true> = { orla: true, vessa: true, ilse: true };

/** a challenge's stake (lot L2b, the operator's EV-3 « Pleine vie, une mise, une fois par phase », journal Passe EVL3): coins put on the table at once
 *  and won back twice, or a share of one's name won or lost at the result (« proposé ») */
/** the most a theft caught at a stall is fined, by day and at night (read by the guide too, journal Passe TU3) */
export const STEAL_FINE = { day: 15, night: 25 } as const;
export const STAKE = { coins: 10, name: 5 } as const;
export type Stake = keyof typeof STAKE;
/** a fighter is challenged once per phase: before the cut (days 1 to 5), then after it (days 6 to 10) */
export const phaseOf = (day: number): 1 | 2 => (day <= 5 ? 1 : 2);
/** a rival's bout today (the pool or the bracket) */
const fightsToday = (s: GameState, who: string): boolean => s.tournament.matches.some((m) => m.day === s.day && (m.a === who || m.b === who));
/** the day from which a rival out of the title can be challenged (EV-4); the skills' page says it for the skills only those rivals teach (journal Passe CO1) */
export const RIVALS_CHALLENGE_DAY = 6;
/** can this fighter be challenged now (lot L2b, EV-4 « Les trois, puis les éliminés à partir du jour 6 »): the three from the first day, the generic fighters
 *  (the qualifiers' losers), and from day 6 a rival out of the title (one of the cut's four others) on a day without a bout of theirs; null, or why not */
export function challengeable(s: GameState, who: string): string | null {
  const p = PEOPLE[who];
  if (!p) return tx('v2.challenge.who');
  if (GENERICS[who]) return null;
  if (CHALLENGERS[who]) return s.tournament.matches.some((m) => m.day === s.day && !m.winner && ((m.a === who && m.b === PLAYER_ID) || (m.b === who && m.a === PLAYER_ID))) ? tx('v2.challenge.fights', { name: p.name }) : null;
  const c = s.competitors[who];
  if (!RIVALS[who] || !c || s.day < RIVALS_CHALLENGE_DAY) return tx('v2.challenge.who');
  if (c.phaseStatus !== 'gate' && c.phaseStatus !== 'third') return tx('v2.challenge.crown', { name: p.name });
  return fightsToday(s, who) ? tx('v2.challenge.fights', { name: p.name }) : null;
}
/** the fighters a challenge can be offered to at this place: the three, the generic fighters, and from day 6 the rivals in town */
// (the muscle waiting for a debt offers no sport: lot L2b)
const candidates = (s: GameState): string[] => Object.values(PEOPLE).filter((p) => placeOf(p, true) === s.place && (CHALLENGERS[p.id] || GENERICS[p.id] || (s.day >= RIVALS_CHALLENGE_DAY && RIVALS[p.id])) && !(p.id === MUSCLE && s.v2?.reprisal)).map((p) => p.id);
const fighterName = (who: string): string => PEOPLE[who]?.name ?? GENERICS[who]?.name ?? RIVALS[who]?.name ?? who;

/** a stall forced at night (lot L2a, EV-2: « La nuit, les étals fermés se forcent : plus facile, puni plus fort »): a day shop shut at dusk */
export const forced = (s: GameState, shop: ShopId): boolean => s.slot === 'evening' && !SHOPS[shop].open.includes('evening');

export function stealChance(s: GameState, shop: ShopId): number {
  // the watch on alert the day after a theft was caught (lot V7, the event v2-quay-alert): a sixth less; a shuttered stall at night is easier, unless
  // the watch the player paid walks that quay (lot L2a; no hidden eye of the watch since L2-2 « Des marques », journal Passe EVL4)
  const night = forced(s, shop) ? 0.7 - (s.place === 'district' && s.services.forgeWatch ? 0.25 : 0) : s.slot === 'evening' ? 0.6 : 0.3;
  return clamp(night + (60 - s.pulse.security) / 200 - (s.town[SHOPS[shop].keeper] ?? 0) / 400 - (s.flags[`alert:${s.day}`] ? 0.15 : 0), 0.05, 0.85);
}
/** a passer-by's pocket (lot L2a): harder by day */
export function pocketChance(s: GameState): number {
  return clamp((s.slot === 'evening' ? 0.5 : 0.35) + (60 - s.pulse.security) / 200 - (s.flags[`alert:${s.day}`] ? 0.15 : 0), 0.05, 0.85);
}
/** what a theft takes: the shop's cheapest piece the player does not own (a whetstone only if none held) */
export function stealTarget(s: GameState, shop: ShopId): string | null {
  const g = s.v2?.gear, owned = (id: string) => !!g && (g.weapon === id || g.armour === id || g.acc.includes(id) || g.bag.includes(id));
  const c = Object.values(GEAR).filter((x) => x.shop === shop && x.id !== 'salve' && !(x.id === 'whetstone' ? s.player.items.includes('whetstone') : owned(x.id))).sort((a, b) => a.price - b.price || (a.id < b.id ? -1 : 1));
  return c[0]?.id ?? null;
}
/** can this stall be robbed now: open (by its keeper's hours), or a day stall shuttered at night; never the day it is barred after a catch */
function stallOpen(s: GameState, shop: ShopId): string | null {
  const sh = SHOPS[shop];
  if (s.place !== sh.place) return tx('v2.shop.notHere');
  if (!sh.open.includes(s.slot) && !forced(s, shop)) return tx('v2.shop.shut');
  if (s.v2?.shops?.[shop]?.closed === s.day) return tx('v2.shop.barred');
  if (wanted(s)) return tx('v2.steal.wanted', { name: PEOPLE[SHOPS[shop].keeper]?.name ?? SHOPS[shop].keeper });
  // lot L5 (EV-12, « un garde se poste à l’étal le jour d’un vol »): Wynn stands by the stall a theft was known at (src/simulation/v2watch.ts)
  return watchPost(s)?.shop === shop ? tx('v2.steal.watched', { name: PEOPLE[SHOPS[shop].keeper]?.name ?? SHOPS[shop].keeper }) : null;
}
const shopDay = (s: GameState, shop: ShopId) => { const v = s.v2!; v.shops ??= {}; return (v.shops[shop] ??= {}); };
const shopsHere = (s: GameState) => (Object.keys(SHOPS) as ShopId[]).filter((k) => SHOPS[k].place === s.place);
const boutToday = (s: GameState) => { const m = playerMatch(s); return !!m && s.slot === 'afternoon' && !m.winner; };

export type V2TownAction =
  | { type: 'steal'; shop: ShopId }
  | { type: 'pickpocket'; who: string }
  | { type: 'challenge'; who: string; stake: Stake }
  | { type: 'challengeResult'; outcome: DuelOutcome }
  | { type: 'cancelChallenge' }
  | { type: 'checkGear' };

export const V2_TOWN_ACTIONS: { [K in V2TownAction['type']]: ActionDef<Extract<V2TownAction, { type: K }>> & { by: string | ((a: Extract<V2TownAction, { type: K }>) => string) | null } } = {
  steal: {
    by: null,
    // the open stalls here, and at night the day stalls shuttered (lot L2a)
    list: (s) => (isV2(s) ? shopsHere(s).filter((shop) => SHOPS[shop].open.includes(s.slot) || forced(s, shop)).map((shop) => ({ type: 'steal' as const, shop })) : []),
    label: (s, a) => {
      const t = stealTarget(s, a.shop), name = PEOPLE[SHOPS[a.shop].keeper]?.name ?? SHOPS[a.shop].keeper;
      return t ? tx(forced(s, a.shop) ? 'v2.steal.labelNight' : 'v2.steal.label', { item: itemName(t), name, pct: Math.round(stealChance(s, a.shop) * 100) }) : tx('v2.steal.labelNone');
    },
    cost: () => 0,
    check: (s, a) => (!isV2(s) ? tx('v2.only') : stallOpen(s, a.shop) ?? (!stealTarget(s, a.shop) ? tx('v2.steal.nothing') : null)),
    apply: (s, a, r, emit) => {
      const item = stealTarget(s, a.shop)!, keeper = SHOPS[a.shop].keeper, name = PEOPLE[keeper]?.name ?? keeper, night = forced(s, a.shop);
      if (r.next() < stealChance(s, a.shop)) {
        take(s, item);
        s.flags['pulse:sabotageRisk'] = ((s.flags['pulse:sabotageRisk'] as number) ?? 0) + 2;
        // the theft kept for its owner to find at dawn (lot L2a): a mark then
        recordTheft(s, { day: s.day, from: keeper, item, seen: null, ...(night ? { night: true } : {}) });
        emit({ kind: 'action', id: 'steal:ok', cause: 'action:steal', visible: true, text: tx(night ? 'v2.steal.okNight' : 'v2.steal.ok', { item: itemName(item), name }) });
        return;
      }
      // caught: forcing a shutter is punished harder (lot L2a)
      const cap = night ? STEAL_FINE.night : STEAL_FINE.day, fine = Math.min(cap, s.player.coins), d = shopDay(s, a.shop);
      s.player.coins -= fine; s.player.reputation = clamp(s.player.reputation - (night ? (fine < cap ? 15 : 12) : fine < cap ? 12 : 8));
      s.town[keeper] = clamp((s.town[keeper] ?? 0) - (night ? 25 : 20), -100, 100); s.town.hale = clamp((s.town.hale ?? 0) - (night ? 15 : 10), -100, 100);
      if (night) { d.closed = s.day + 1; d.markup = s.day + 2; } else { d.closed = s.day; d.markup = s.day + 1; }
      s.flags[`caught:${s.day}`] = true;
      recordTheft(s, { day: s.day, from: keeper, item, seen: 'caught', ...(night ? { night: true } : {}) });
      emit({ kind: 'consequence', id: 'steal:caught', cause: 'action:steal', visible: true, text: tx(night ? (fine < cap ? 'v2.steal.caughtNightPoor' : 'v2.steal.caughtNight') : fine < cap ? 'v2.steal.caughtPoor' : 'v2.steal.caught', { item: itemName(item), name, fine }) });
      registrarOnCatch(s, emit);
    },
  },
  // a passer-by's piece, lifted instead of bargained for (lot L2a, the operator's note on EV-6)
  pickpocket: {
    by: null,
    list: (s) => passersHere(s).map((who) => ({ type: 'pickpocket' as const, who })),
    label: (s, a) => tx('v2.pocket.label', { name: PEOPLE[a.who].name, item: itemName(PASSERS[a.who].item), pct: Math.round(pocketChance(s) * 100) }),
    cost: () => 0,
    check: (s, a) => passerOpen(s, a.who) ?? (holds(s, PASSERS[a.who].item) ? tx('v2.shop.owned') : null),
    apply: (s, a, r, emit) => {
      const p = PASSERS[a.who], name = PEOPLE[a.who].name;
      if (r.next() < pocketChance(s)) {
        take(s, p.item); (s.v2!.passed ??= {})[a.who] = s.day;
        recordTheft(s, { day: s.day, from: a.who, item: p.item, seen: null });
        emit({ kind: 'action', id: 'pocket:ok', cause: 'action:steal', visible: true, text: tx('v2.pocket.ok', { name, item: itemName(p.item) }) });
        return;
      }
      const fine = Math.min(10, s.player.coins);
      s.player.coins -= fine; s.player.reputation = clamp(s.player.reputation - 8);
      s.town[a.who] = clamp((s.town[a.who] ?? 0) - 30, -100, 100); s.town.hale = clamp((s.town.hale ?? 0) - 10, -100, 100);
      s.flags[`snub:${a.who}`] = true; s.flags[`caught:${s.day}`] = true;
      recordTheft(s, { day: s.day, from: a.who, item: p.item, seen: 'caught' });
      emit({ kind: 'consequence', id: 'pocket:caught', cause: 'action:steal', visible: true, text: tx('v2.pocket.caught', { name, item: itemName(p.item), fine }) });
      registrarOnCatch(s, emit);
    },
  },
  challenge: {
    by: (a) => a.who,
    list: (s) => (isV2(s) ? candidates(s).flatMap((who) => (['coins', 'name'] as Stake[]).map((stake) => ({ type: 'challenge' as const, who, stake }))) : []),
    label: (_s, a) => tx(a.stake === 'coins' ? (teacherOf(a.who) ? 'v2.challenge.labelCoins' : 'v2.challenge.labelCoinsPlain') : teacherOf(a.who) ? 'v2.challenge.labelName' : 'v2.challenge.labelNamePlain', { name: fighterName(a.who), n: STAKE[a.stake] }),
    cost: () => 0,
    // the slot is spent at the result (challengeResult); the tag says it now (rule P2, journal Passe EVL1); the coins staked are put on the table at once
    later: () => 1,
    coins: (_s, a) => (a.stake === 'coins' ? STAKE.coins : 0),
    check: (s, a) => {
      if (!isV2(s)) return tx('v2.only');
      const p = PEOPLE[a.who];
      if (!p || !STAKE[a.stake]) return tx('v2.challenge.who');
      const why = challengeable(s, a.who); if (why) return why;
      if (placeOf(p, true) !== s.place || !presentAt(p, s.place, s.slot, true) || (p.days && (s.day < p.days[0] || s.day > p.days[1]))) return tx('avail.notNow', { name: p.name });
      if (boutToday(s)) return tx('refuse.boutFirst');
      if (s.v2?.challenge) return tx('v2.challenge.pending');
      if (a.who === MUSCLE && s.v2?.reprisal) return tx('v2.reprisal.notSport', { name: p.name });
      const last = s.v2?.challenged?.[a.who];
      if (last !== undefined && phaseOf(last) === phaseOf(s.day)) return tx(phaseOf(s.day) === 1 ? 'v2.challenge.oncePool' : 'v2.challenge.onceCup', { name: p.name });
      if (a.stake === 'coins' && s.player.coins < STAKE.coins) return tx('v2.challenge.poor', { n: STAKE.coins });
      return a.stake === 'name' && s.player.reputation < STAKE.name ? tx('v2.challenge.nameless', { n: STAKE.name }) : null;
    },
    apply: (s, a, _r, emit) => {
      if (a.stake === 'coins') s.player.coins -= STAKE.coins;
      s.v2!.challenge = { who: a.who, day: s.day, stake: a.stake };
      emit({ kind: 'action', id: 'challenge', cause: 'action:challenge', visible: true, text: tx(a.stake === 'coins' ? 'v2.challenge.logCoins' : 'v2.challenge.logName', { name: fighterName(a.who), n: STAKE[a.stake] }) });
    },
  },
  challengeResult: {
    by: null,
    // the arena hands the result in (as `fight`)
    list: () => [],
    label: () => tx('v2.challenge.result'),
    cost: () => 1,
    check: (s, a) => (!isV2(s) ? tx('v2.only') : !s.v2?.challenge ? tx('v2.challenge.none') : !a.outcome || (a.outcome.winner !== 'player' && a.outcome.winner !== 'opponent') ? tx('fight.noResult') : null),
    apply: (s, a, _r, emit) => applyChallenge(s, a.outcome, emit),
  },
  // an answer to the gear's sabotage (lot V7, the event v2-gear-tamper): Hilde looks over every strap for 5 coins, the day it matters
  checkGear: {
    by: 'hilde',
    list: (s) => (isV2(s) && s.place === 'forecourt' ? [{ type: 'checkGear' }] : []),
    label: () => tx('v2.check.label'),
    cost: () => 0,
    coins: () => 5,
    check: (s) => (!isV2(s) ? tx('v2.only') : available(s, 'hilde') ?? (s.flags[`checked:${s.day}`] ? tx('v2.check.done') : s.player.coins < 5 ? tx('v2.check.poor') : null)),
    apply: (s, _a, _r, emit) => {
      s.player.coins -= 5; s.flags[`checked:${s.day}`] = true;
      if (s.flags[`tampered:${s.day}`]) {
        if (!s.facts.includes('tamper-found')) s.facts.push('tamper-found');
        if (s.facts.includes('armour-asked') && !s.flags['culprit-known']) s.flags['culprit-known'] = 'cassius';
        emit({ kind: 'consequence', id: 'check:found', cause: 'action:checkGear', visible: true, text: tx('v2.check.found') });
      } else emit({ kind: 'action', id: 'check:clean', cause: 'action:checkGear', visible: true, text: tx('v2.check.clean') });
    },
  },
  cancelChallenge: {
    by: null,
    list: (s) => (isV2(s) && s.v2?.challenge ? [{ type: 'cancelChallenge' }] : []),
    label: () => tx('v2.challenge.cancel'),
    cost: () => 0,
    check: (s) => (!isV2(s) ? tx('v2.only') : !s.v2?.challenge ? tx('v2.challenge.none') : null),
    apply: (s, _a, _r, emit) => {
      // the coins staked come back; a reprisal called off waits for its night again (lot L2b)
      const c = s.v2!.challenge!; delete s.v2!.challenge;
      if (c.stake === 'coins') s.player.coins += STAKE.coins;
      emit({ kind: 'action', id: 'challenge:off', cause: 'action:cancelChallenge', visible: true, text: tx(c.reprisal ? 'v2.reprisal.off' : 'v2.challenge.off', { name: fighterName(c.who) }) });
    },
  },
};

function take(s: GameState, item: string): void {
  if (item === 'whetstone') { s.player.items.push('whetstone'); return; }
  const g = gearOf(s), d = GEAR[item];
  if (d.slot === 'accessory') { const i = g.acc.indexOf(null); if (i >= 0) { g.acc[i] = item; return; } }
  if (d.slot === 'armour' && !g.armour) { g.armour = item; return; }
  g.bag.push(item);
}

/** does a challenge won against this fighter teach a skill (the three's own, a rival's of the catalogue from day 6; a generic fighter none) */
const teacherOf = (who: string): boolean => !!(taughtBy(who) ?? LATE_TEACHER[who]);

/** a challenge's result (lot L2b, EV-3): won, the stake back twice and the fighter's skill learnt or raised; lost, the stake gone and never a wound (V2B1-1
 *  stays the only rule of wounds); a reprisal's bout has its own ends (v2law.ts) */
export function applyChallenge(s: GameState, o: DuelOutcome, emit: Emit): void {
  const v = s.v2!, ch = v.challenge!, who = ch.who, won = o.winner === 'player', temper = RIVALS[who]?.temper, name = fighterName(who);
  delete v.challenge;
  if (ch.reprisal) { applyReprisal(s, o, emit); return; }
  (v.challenged ??= {})[who] = s.day;
  // Master Corvin's note of the challenge (lot 3 of « La Brute »), outside the fingerprint
  keepOutcomeNote(s, o, 'challenge');
  const stake = ch.stake ?? 'name';
  if (won) {
    // lot L4 (EV-7 « Les suites des actions »): the day's win, which makes the town talk (src/events/v2catalog.ts v2-challenge-fame: Master Corvin's lesson the next day)
    s.flags['challenge-won'] = true; s.flags[`won-challenge:${s.day}`] = true;
    // the vigour (DB7-4 « +12 PV par victoire », journal Passe DB8): a challenge won counts
    v.wins = (v.wins ?? 0) + 1;
    if (stake === 'coins') s.player.coins += 2 * STAKE.coins; else s.player.reputation = clamp(s.player.reputation + STAKE.name);
    const c = s.competitors[who]; if (c) c.relationships.player = clamp((c.relationships.player ?? 0) + (temper === 'proud' ? -6 : 10), -100, 100);
    emit({ kind: 'action', id: 'challenge:won', cause: `challenge:${who}`, visible: true, text: tx(stake === 'coins' ? 'v2.challenge.wonCoins' : 'v2.challenge.wonName', { name, n: stake === 'coins' ? 2 * STAKE.coins : STAKE.name }) });
    // lot L4 (EV-9): Rhosk beaten on the sand leaves it to the player (src/simulation/v2rivals.ts), whatever he meant to do with it
    if (who === 'rhosk' && !s.flags['sand-cleared']) {
      s.flags['sand-cleared'] = true;
      if (s.flags[`sand:${s.day}`] || s.flags[`sand:${s.day + 1}`]) emit({ kind: 'consequence', id: 'rhosk:beaten', cause: `challenge:${who}`, visible: true, text: tx('v2.sand.challengeLog') });
    }
    learnFromChallenge(s, who, emit);
    // the sand's lesson (BL1-4 « Au lot 3 : la ville nourrit le build »): the first blow of the plan under the cap rises a level
    sandLesson(s, who, emit);
  } else {
    if (stake === 'name') s.player.reputation = clamp(s.player.reputation - STAKE.name);
    const c = s.competitors[who]; if (c) c.relationships.player = clamp((c.relationships.player ?? 0) + 3, -100, 100);
    emit({ kind: 'action', id: 'challenge:lost', cause: `challenge:${who}`, visible: true, text: tx(stake === 'coins' ? 'v2.challenge.lostCoins' : 'v2.challenge.lostName', { name, n: STAKE[stake] }) });
  }
}

