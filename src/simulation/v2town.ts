import { clamp, type GameState } from './state';
import type { ActionDef } from './actions';
import type { Emit } from './advance';
import { isV2 } from './v2';
import { learnFromChallenge } from './v2skills';
import { GEAR, SHOPS, type ShopId } from './gear';
import { gearOf, itemName, shopOpen } from './v2gear';
import { playerMatch } from '../tournament/pool';
import { PEOPLE, placeOf, presentAt } from '../narrative/people';
import { RIVALS } from '../narrative/roster';
import { tx } from '../narrative/text';
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

/** the fighters a challenge can be put to, where and when (a version 2 person or a rival met in town) */
export const CHALLENGERS: Record<string, { hp: number }> = { orla: { hp: 0.5 }, vessa: { hp: 0.5 }, ilse: { hp: 0.5 } };

export function haggleChance(s: GameState, shop: ShopId): number {
  return clamp(0.25 + s.player.reputation / 200 + (s.town[SHOPS[shop].keeper] ?? 0) / 200, 0.1, 0.85);
}
export function stealChance(s: GameState, shop: ShopId): number {
  return clamp((s.slot === 'evening' ? 0.6 : 0.3) + (60 - s.pulse.security) / 200 - (s.town[SHOPS[shop].keeper] ?? 0) / 400, 0.05, 0.85);
}
/** what a theft takes: the shop's cheapest piece the player does not own (a whetstone only if none held) */
export function stealTarget(s: GameState, shop: ShopId): string | null {
  const g = s.v2?.gear, owned = (id: string) => !!g && (g.weapon === id || g.armour === id || g.acc.includes(id) || g.bag.includes(id));
  const c = Object.values(GEAR).filter((x) => x.shop === shop && x.id !== 'salve' && !(x.id === 'whetstone' ? s.player.items.includes('whetstone') : owned(x.id))).sort((a, b) => a.price - b.price || (a.id < b.id ? -1 : 1));
  return c[0]?.id ?? null;
}
const shopDay = (s: GameState, shop: ShopId) => { const v = s.v2!; v.shops ??= {}; return (v.shops[shop] ??= {}); };
const shopsHere = (s: GameState) => (Object.keys(SHOPS) as ShopId[]).filter((k) => SHOPS[k].place === s.place);
const boutToday = (s: GameState) => { const m = playerMatch(s); return !!m && s.slot === 'afternoon' && !m.winner; };

export type V2TownAction =
  | { type: 'haggle'; shop: ShopId }
  | { type: 'steal'; shop: ShopId }
  | { type: 'challenge'; who: string }
  | { type: 'challengeResult'; outcome: DuelOutcome }
  | { type: 'cancelChallenge' };

export const V2_TOWN_ACTIONS: { [K in V2TownAction['type']]: ActionDef<Extract<V2TownAction, { type: K }>> & { by: string | ((a: Extract<V2TownAction, { type: K }>) => string) | null } } = {
  haggle: {
    by: (a) => SHOPS[a.shop].keeper,
    list: (s) => (isV2(s) ? shopsHere(s).map((shop) => ({ type: 'haggle' as const, shop })) : []),
    label: (s, a) => tx('v2.haggle.label', { name: PEOPLE[SHOPS[a.shop].keeper]?.name ?? SHOPS[a.shop].keeper, pct: Math.round(haggleChance(s, a.shop) * 100) }),
    cost: () => 0,
    check: (s, a) => (!isV2(s) ? tx('v2.only') : shopOpen(s, a.shop) ?? (s.v2?.shops?.[a.shop]?.haggled === s.day ? tx('v2.haggle.done') : null)),
    apply: (s, a, r, emit) => {
      const d = shopDay(s, a.shop), keeper = SHOPS[a.shop].keeper, name = PEOPLE[keeper]?.name ?? keeper;
      d.haggled = s.day;
      if (r.next() < haggleChance(s, a.shop)) { d.deal = s.day; emit({ kind: 'action', id: 'haggle:deal', cause: 'action:haggle', visible: true, text: tx('v2.haggle.deal', { name }) }); }
      else { d.sour = s.day; s.town[keeper] = clamp((s.town[keeper] ?? 0) - 4, -100, 100); emit({ kind: 'action', id: 'haggle:sour', cause: 'action:haggle', visible: true, text: tx('v2.haggle.sour', { name }) }); }
    },
  },
  steal: {
    by: null,
    list: (s) => (isV2(s) ? shopsHere(s).map((shop) => ({ type: 'steal' as const, shop })) : []),
    label: (s, a) => { const t = stealTarget(s, a.shop); return t ? tx('v2.steal.label', { item: itemName(t), pct: Math.round(stealChance(s, a.shop) * 100) }) : tx('v2.steal.labelNone'); },
    cost: () => 0,
    check: (s, a) => (!isV2(s) ? tx('v2.only') : shopOpen(s, a.shop) ?? (!stealTarget(s, a.shop) ? tx('v2.steal.nothing') : null)),
    apply: (s, a, r, emit) => {
      const item = stealTarget(s, a.shop)!, keeper = SHOPS[a.shop].keeper, name = PEOPLE[keeper]?.name ?? keeper;
      if (r.next() < stealChance(s, a.shop)) {
        take(s, item);
        s.flags['pulse:sabotageRisk'] = ((s.flags['pulse:sabotageRisk'] as number) ?? 0) + 2;
        emit({ kind: 'action', id: 'steal:ok', cause: 'action:steal', visible: true, text: tx('v2.steal.ok', { item: itemName(item), name }) });
        return;
      }
      const fine = Math.min(15, s.player.coins), d = shopDay(s, a.shop);
      s.player.coins -= fine; s.player.reputation = clamp(s.player.reputation - (fine < 15 ? 12 : 8));
      s.town[keeper] = clamp((s.town[keeper] ?? 0) - 20, -100, 100); s.town.hale = clamp((s.town.hale ?? 0) - 10, -100, 100);
      d.closed = s.day; d.markup = s.day + 1;
      s.flags[`caught:${s.day}`] = true;
      emit({ kind: 'consequence', id: 'steal:caught', cause: 'action:steal', visible: true, text: tx(fine < 15 ? 'v2.steal.caughtPoor' : 'v2.steal.caught', { item: itemName(item), name, fine }) });
    },
  },
  challenge: {
    by: (a) => a.who,
    list: (s) => (isV2(s) ? Object.keys(CHALLENGERS).filter((w) => PEOPLE[w] && placeOf(PEOPLE[w], true) === s.place).map((who) => ({ type: 'challenge' as const, who })) : []),
    label: (_s, a) => tx('v2.challenge.label', { name: PEOPLE[a.who].name }),
    cost: () => 0,
    check: (s, a) => {
      if (!isV2(s)) return tx('v2.only');
      const p = PEOPLE[a.who];
      if (!p || !CHALLENGERS[a.who]) return tx('v2.challenge.who');
      if (placeOf(p, true) !== s.place || !presentAt(p, s.place, s.slot, true)) return tx('avail.notNow', { name: p.name });
      if (boutToday(s)) return tx('refuse.boutFirst');
      if (s.v2?.challenge) return tx('v2.challenge.pending');
      return s.v2?.challenged?.[a.who] === s.day ? tx('v2.challenge.today', { name: p.name }) : null;
    },
    apply: (s, a, _r, emit) => { s.v2!.challenge = { who: a.who, day: s.day }; emit({ kind: 'action', id: 'challenge', cause: 'action:challenge', visible: true, text: tx('v2.challenge.log', { name: PEOPLE[a.who].name }) }); },
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
  cancelChallenge: {
    by: null,
    list: (s) => (isV2(s) && s.v2?.challenge ? [{ type: 'cancelChallenge' }] : []),
    label: () => tx('v2.challenge.cancel'),
    cost: () => 0,
    check: (s) => (!isV2(s) ? tx('v2.only') : !s.v2?.challenge ? tx('v2.challenge.none') : null),
    apply: (s, _a, _r, emit) => { const w = s.v2!.challenge!.who; delete s.v2!.challenge; emit({ kind: 'action', id: 'challenge:off', cause: 'action:cancelChallenge', visible: true, text: tx('v2.challenge.off', { name: PEOPLE[w].name }) }); },
  },
};

function take(s: GameState, item: string): void {
  if (item === 'whetstone') { s.player.items.push('whetstone'); return; }
  const g = gearOf(s), d = GEAR[item];
  if (d.slot === 'accessory') { const i = g.acc.indexOf(null); if (i >= 0) { g.acc[i] = item; return; } }
  if (d.slot === 'armour' && !g.armour) { g.armour = item; return; }
  g.bag.push(item);
}

/** a challenge's result: won, the fighter's skill learnt or raised (and a little fame); lost, a little fame lost, no wound (sparring) */
export function applyChallenge(s: GameState, o: DuelOutcome, emit: Emit): void {
  const v = s.v2!, who = v.challenge!.who, won = o.winner === 'player', temper = RIVALS[who]?.temper;
  delete v.challenge;
  (v.challenged ??= {})[who] = s.day;
  if (won) {
    s.player.reputation = clamp(s.player.reputation + 3);
    const c = s.competitors[who]; if (c) c.relationships.player = clamp((c.relationships.player ?? 0) + (temper === 'proud' ? -6 : 10), -100, 100);
    emit({ kind: 'action', id: 'challenge:won', cause: `challenge:${who}`, visible: true, text: tx('v2.challenge.won', { name: PEOPLE[who].name }) });
    learnFromChallenge(s, who, emit);
  } else {
    s.player.reputation = clamp(s.player.reputation - 1);
    const c = s.competitors[who]; if (c) c.relationships.player = clamp((c.relationships.player ?? 0) + 3, -100, 100);
    emit({ kind: 'action', id: 'challenge:lost', cause: `challenge:${who}`, visible: true, text: tx('v2.challenge.lost', { name: PEOPLE[who].name }) });
  }
}

