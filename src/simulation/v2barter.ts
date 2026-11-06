import { clamp, type GameState, type PlaceId } from './state';
import type { ActionDef } from './actions';
import { isV2 } from './v2';
import { GEAR, SHOPS, type ShopId } from './gear';
import { itemName, receive, shopOpen, shopPrice } from './v2gear';
import { holds } from './v2law';
import { PEOPLE, presentAt } from '../narrative/people';
import { tx, type TextKey } from '../narrative/text';

/** Bargaining in a version 2 game (lot L2a; the operator's choice EV-6 « Au moment d’acheter, un argument à choisir », with his note « mais on
 *  peut aussi marchander avec les passants pour obtenir un objet qui possede au lieu de le voler par exemple, ce qui peut donner l"obtention de
 *  items unique ou rentable comme dans octopath travaler », journal Passes EV2 / EVL2): a short decision, not a mini-game (GAMEPLAY § 1).
 *  - At a shop, buying a piece, one argument among three, each its chance: the player's name in the pool (the reputation), the keeper's friendship
 *    (the goodwill), two pieces at once (the shop's cheapest other piece the player lacks). Won: the piece (or both) at the argument's discount;
 *    lost: no extra cost, the keeper's goodwill down, and no other argument heard that day.
 *  - Three passers-by hold a piece no shop sells (gear.ts): bought at their price, bargained for by the name or by what touches them, or stolen
 *    (v2town.ts) instead. Only the mechanism comes from Octopath Traveler. Every number and line is « proposé ». Pure. */

export type ShopArg = 'name' | 'friend' | 'pair';
export type PasserArg = 'name' | 'soft';

/** the discount an argument wins, on this purchase only */
export const DISCOUNT: Record<ShopArg | 'soft', number> = { name: 0.2, friend: 0.15, pair: 0.25, soft: 0.3 };

/** a passer-by's piece, its price, and the argument that touches them (its chance before the name's share) */
export interface Passer { id: string; item: string; price: number; soft: { label: TextKey; won: TextKey; chance: number } }
export const PASSERS: Record<string, Passer> = {
  fenwick: { id: 'fenwick', item: 'river-pearl', price: 26, soft: { label: 'v2.passer.fenwick.soft', won: 'v2.passer.fenwick.won', chance: 0.55 } },
  edda: { id: 'edda', item: 'knight-hauberk', price: 34, soft: { label: 'v2.passer.edda.soft', won: 'v2.passer.edda.won', chance: 0.6 } },
  sela: { id: 'sela', item: 'pilgrim-medal', price: 18, soft: { label: 'v2.passer.sela.soft', won: 'v2.passer.sela.won', chance: 0.5 } },
};

export function argChance(s: GameState, arg: ShopArg | PasserArg, seller: string): number {
  const rep = s.player.reputation, good = s.town[seller] ?? 0;
  if (arg === 'name') return clamp(0.15 + rep / 120, 0.1, 0.85);
  if (arg === 'friend') return clamp(0.2 + good / 60, 0.05, 0.85);
  if (arg === 'pair') return clamp(0.45 + rep / 300 + good / 300, 0.1, 0.85);
  return clamp((PASSERS[seller]?.soft.chance ?? 0.5) + rep / 400, 0.1, 0.85);
}

/** the second piece of « two at once »: the shop's cheapest other piece the player lacks and would use (never the salve) */
export function pairOf(s: GameState, shop: ShopId, item: string): string | null {
  const c = Object.values(GEAR).filter((g) => g.shop === shop && g.id !== item && g.id !== 'salve' && !holds(s, g.id)).sort((a, b) => a.price - b.price || (a.id < b.id ? -1 : 1));
  return c[0]?.id ?? null;
}

const off = (p: number, arg: ShopArg | 'soft') => Math.max(1, Math.round(p * (1 - DISCOUNT[arg])));
/** what a bargain costs if it is won (both pieces for « two at once ») */
export function bargainPrice(s: GameState, shop: ShopId, item: string, arg: ShopArg): number {
  const pair = arg === 'pair' ? pairOf(s, shop, item) : null;
  return off(shopPrice(s, shop, item), arg) + (pair ? off(shopPrice(s, shop, pair), arg) : 0);
}
export const passerPrice = (p: Passer, arg?: PasserArg): number => (arg ? off(p.price, arg === 'name' ? 'name' : 'soft') : p.price);

const argued = (s: GameState, seller: string): boolean => s.flags[`argued:${seller}`] === s.day;
const add = (s: GameState, who: string, n: number) => { s.town[who] = clamp((s.town[who] ?? 0) + n, -100, 100); };
const ARG_LABEL: Record<ShopArg, TextKey> = { name: 'v2.bargain.name', friend: 'v2.bargain.friend', pair: 'v2.bargain.pair' };

/** a passer-by here now with their piece, or why not */
export function passerOpen(s: GameState, who: string): string | null {
  const p = PEOPLE[who];
  if (!isV2(s) || !p?.passer || !PASSERS[who]) return tx('v2.only');
  if (s.place !== p.place) return tx('avail.notHere', { name: p.name });
  if ((p.days && (s.day < p.days[0] || s.day > p.days[1])) || !presentAt(p, s.place as PlaceId, s.slot, true)) return tx('avail.notNow', { name: p.name });
  if (s.v2?.passed?.[who] !== undefined) return tx('v2.passer.gone', { name: p.name, item: itemName(PASSERS[who].item) });
  if (s.flags[`snub:${who}`]) return tx('v2.passer.snub', { name: p.name });
  return null;
}
export const passersHere = (s: GameState): string[] => (isV2(s) ? Object.keys(PASSERS).filter((w) => PEOPLE[w].place === s.place) : []);

export type V2BarterAction =
  | { type: 'bargain'; shop: ShopId; item: string; arg: ShopArg }
  | { type: 'barter'; who: string; arg?: PasserArg };

export const V2_BARTER_ACTIONS: { [K in V2BarterAction['type']]: ActionDef<Extract<V2BarterAction, { type: K }>> & { by: string | ((a: Extract<V2BarterAction, { type: K }>) => string) | null } } = {
  bargain: {
    by: (a) => SHOPS[a.shop].keeper,
    list: (s) => (!isV2(s) ? [] : (Object.keys(SHOPS) as ShopId[]).filter((k) => SHOPS[k].place === s.place)
      .flatMap((shop) => Object.values(GEAR).filter((g) => g.shop === shop).flatMap((g) => (['name', 'friend', 'pair'] as ShopArg[]).map((arg) => ({ type: 'bargain' as const, shop, item: g.id, arg }))))),
    label: (s, a) => { const k = SHOPS[a.shop].keeper, pair = a.arg === 'pair' ? pairOf(s, a.shop, a.item) : null; return tx(ARG_LABEL[a.arg], { name: PEOPLE[k]?.name ?? k, item: pair ? itemName(pair) : '', pct: Math.round(argChance(s, a.arg, k) * 100) }); },
    cost: () => 0,
    coins: (s, a) => bargainPrice(s, a.shop, a.item, a.arg),
    check: (s, a) => {
      if (!isV2(s)) return tx('v2.only');
      const d = GEAR[a.item], keeper = SHOPS[a.shop].keeper;
      if (!d || d.shop !== a.shop) return tx('v2.shop.notSold');
      const o = shopOpen(s, a.shop); if (o) return o;
      if (d.slot !== 'consumable' && holds(s, a.item)) return tx('v2.shop.owned');
      if (a.item === 'whetstone' && s.player.items.includes('whetstone')) return tx('buy.haveStone');
      if (a.item === 'salve' && s.player.injury === 0) return tx('buy.notHurt');
      if (argued(s, keeper)) return tx('v2.bargain.done', { name: PEOPLE[keeper]?.name ?? keeper });
      if (a.arg === 'pair' && !pairOf(s, a.shop, a.item)) return tx('v2.bargain.noPair');
      return s.player.coins < bargainPrice(s, a.shop, a.item, a.arg) ? tx('buy.poor') : null;
    },
    apply: (s, a, r, emit) => {
      const keeper = SHOPS[a.shop].keeper, name = PEOPLE[keeper]?.name ?? keeper, pair = a.arg === 'pair' ? pairOf(s, a.shop, a.item) : null;
      s.flags[`argued:${keeper}`] = s.day;
      if (r.next() < argChance(s, a.arg, keeper)) {
        const p = bargainPrice(s, a.shop, a.item, a.arg);
        s.player.coins -= p; add(s, keeper, 3);
        receive(s, a.item); if (pair) receive(s, pair);
        emit({ kind: 'action', id: 'bargain:won', cause: 'action:bargain', visible: true, text: tx(pair ? 'v2.bargain.wonPair' : 'v2.bargain.won', { name, item: itemName(a.item), pair: pair ? itemName(pair) : '', price: p }) });
        return;
      }
      add(s, keeper, a.arg === 'friend' ? -8 : -4);
      emit({ kind: 'action', id: 'bargain:lost', cause: 'action:bargain', visible: true, text: tx(a.arg === 'friend' ? 'v2.bargain.lostFriend' : 'v2.bargain.lost', { name, item: itemName(a.item), price: shopPrice(s, a.shop, a.item) }) });
    },
  },
  barter: {
    by: (a) => a.who,
    list: (s) => passersHere(s).flatMap((who) => [{ type: 'barter' as const, who }, { type: 'barter' as const, who, arg: 'name' as const }, { type: 'barter' as const, who, arg: 'soft' as const }]),
    label: (s, a) => {
      const p = PASSERS[a.who], name = PEOPLE[a.who].name;
      return !a.arg ? tx('v2.passer.buy', { name, item: itemName(p.item), price: p.price }) : tx(a.arg === 'name' ? 'v2.passer.name' : p.soft.label, { name, pct: Math.round(argChance(s, a.arg, a.who) * 100) });
    },
    cost: () => 0,
    coins: (s, a) => passerPrice(PASSERS[a.who], a.arg),
    check: (s, a) => {
      const o = passerOpen(s, a.who); if (o) return o;
      const p = PASSERS[a.who];
      if (holds(s, p.item)) return tx('v2.shop.owned');
      if (a.arg && argued(s, a.who)) return tx('v2.bargain.done', { name: PEOPLE[a.who].name });
      return s.player.coins < passerPrice(p, a.arg) ? tx('buy.poor') : null;
    },
    apply: (s, a, r, emit) => {
      const p = PASSERS[a.who], name = PEOPLE[a.who].name, price = passerPrice(p, a.arg);
      if (a.arg) {
        s.flags[`argued:${a.who}`] = s.day;
        if (r.next() >= argChance(s, a.arg, a.who)) {
          add(s, a.who, -4);
          emit({ kind: 'action', id: 'barter:lost', cause: 'action:barter', visible: true, text: tx('v2.passer.lost', { name, item: itemName(p.item), price: p.price }) });
          return;
        }
      }
      s.player.coins -= price; add(s, a.who, 5); (s.v2!.passed ??= {})[a.who] = s.day;
      receive(s, p.item);
      emit({ kind: 'action', id: a.arg ? 'barter:won' : 'barter', cause: 'action:barter', visible: true,
        text: a.arg === 'soft' ? tx(p.soft.won, { item: itemName(p.item), price }) : tx(a.arg ? 'v2.passer.wonName' : 'v2.passer.bought', { name, item: itemName(p.item), price }) });
    },
  },
};
