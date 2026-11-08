import type { GameState, PlaceId } from './state';
import { isV2 } from './v2';
import { SHOPS, type ShopId } from './gear';
import { PEOPLE, placeOf, type Person } from '../narrative/people';

/** The watch posted at a robbed stall (lot L5, « la ville qui réagit »; the operator's choice EV-12 « Les places lisent le pouls, la célébrité compte », its
 *  recommendation word for word: « un garde se poste à l’étal le jour d’un vol », journal Passe EV2). Sergeant Hale's man Wynn, the quay's second guard,
 *  leaves the barrier for the stall a theft was known at: the day it was caught and the next (a stall forced at night: the day it stays shut and the next),
 *  or the day its owner found it at dawn; a restitution at Hale's settles it and sends him back. While he stands there, nobody steals from that stall (the
 *  reason is said where the theft is offered). He stands at every hour of those days, the stall open or shuttered. A passer-by's pocket has no stall.
 *  And the passers-by (« Townsfolk ») can be spoken to on every place of a version 2 game, not on the quay alone: the squares' crowd says what the
 *  town says. Every rule is « proposé ». Pure. */

export interface WatchPost { shop: ShopId; keeper: string; place: PlaceId; day: number }

/** the stall a keeper holds (a passer-by holds none) */
export const shopOf = (keeper: string): ShopId | null => (Object.keys(SHOPS) as ShopId[]).find((k) => SHOPS[k].keeper === keeper) ?? null;

/** the days a theft keeps Wynn at its stall: [from, to], or null (unseen, settled, or a passer-by's) */
export function watchDays(t: { day: number; seen: 'caught' | 'found' | null; night?: boolean; settled?: boolean }): [number, number] | null {
  if (t.settled || !t.seen) return null;
  if (t.seen === 'found') return [t.day + 1, t.day + 1];
  const shut = t.day + (t.night ? 1 : 0);
  return [shut, shut + 1];
}

/** where Wynn stands today: the stall of the latest known theft that keeps him there, or null (the quay's barrier) */
export function watchPost(s: GameState): WatchPost | null {
  if (!isV2(s)) return null;
  const list = s.v2?.thefts ?? [];
  for (let i = list.length - 1; i >= 0; i--) {
    const t = list[i], shop = shopOf(t.from), d = watchDays(t);
    if (!shop || !d || s.day < d[0] || s.day > d[1]) continue;
    return { shop, keeper: t.from, place: SHOPS[shop].place, day: t.day };
  }
  return null;
}

/** where a person stands in this game, Wynn's post and the passers-by of every place included (the talk action and its availability read it) */
export function placeIn(p: Person, s: GameState): PlaceId {
  if (isV2(s) && p.id === 'wynn') return watchPost(s)?.place ?? p.place;
  if (isV2(s) && p.id === 'folk') return s.place;
  return placeOf(p, isV2(s));
}

/** the talk action's people here: as before, and in a version 2 game Wynn at his post and the passers-by everywhere */
export const talkableHere = (s: GameState): Person[] => Object.values(PEOPLE).filter((p) => placeIn(p, s) === s.place && (!p.v2 || isV2(s)));
