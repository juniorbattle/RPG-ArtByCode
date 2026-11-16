import type { Action, GameState } from '../simulation';
import { GEAR, SHOPS, shopsOf } from '../simulation/gear';
import { itemAbout, itemName, weaponTier, wornAt, type WornPlace } from '../simulation/v2gear';
import { PASSERS } from '../simulation/v2barter';
import { PEOPLE } from '../narrative/people';
import { tx, type TextKey } from '../narrative/text';
import { sellOf, type Line } from './wares';

/** What the gear page (src/ui/gearPage.ts) reads from the game, without a page: the pieces owned, the four places and what each shows, the action a click on a piece
 *  of the bag asks for, the places a piece would take, what Mara would buy. Each reads the game's own state and rules (`wornAt`, `GEAR`, `sellOf`'s check): none holds
 *  a rule of its own, and `tests/gear-page.test.mjs` holds them against the game's actions. */

export type Kind = 'weapon' | 'armour' | 'accessory';
export const PLACES: WornPlace[] = ['weapon', 'armour', 0, 1];
export const KIND_TEXT: Record<Kind, TextKey> = { weapon: 'v2.gear.weapon', armour: 'v2.gear.armour', accessory: 'v2.gear.acc' };
export const kindOfPlace = (p: WornPlace): Kind => (p === 'weapon' ? 'weapon' : p === 'armour' ? 'armour' : 'accessory');
export const kindOfId = (id: string): Kind => (GEAR[id]?.slot === 'weapon' || GEAR[id]?.slot === 'armour' ? (GEAR[id].slot as Kind) : 'accessory');
/** the training sword is the hand's own: never taken off, never sold */
export const HAND = 'training-sword';

/** what stands at a place: the piece worn, the training sword in hand on the weapon's place (the game's `wornAt` says null for it, it being no piece), null for a free place */
export const placeId = (s: GameState, place: WornPlace): string | null => wornAt(s, place) ?? (place === 'weapon' ? HAND : null);

/** a piece owned: in the bag (`place` null) or worn at a place; `key` tells two of the same piece apart */
export interface Own { id: string; key: string; place: WornPlace | null }

/** everything the player owns, the worn pieces in the order of the four places, then the bag */
export function ownedOf(s: GameState): Own[] {
  const out: Own[] = [], seen = new Map<string, number>();
  const key = (id: string): string => { const n = (seen.get(id) ?? 0) + 1; seen.set(id, n); return n === 1 ? id : `${id}#${n}`; };
  for (const place of PLACES) { const id = wornAt(s, place); if (id && id !== HAND) out.push({ id, key: key(id), place }); }
  for (const id of s.v2?.gear?.bag ?? []) out.push({ id, key: key(id), place: null });
  return out;
}

/** the free accessory place (0 or 1), or -1 when both are taken */
export const freeAcc = (s: GameState): 0 | 1 | -1 => (wornAt(s, 0) ? (wornAt(s, 1) ? -1 : 1) : 0);
/** what the bag holds that fits a kind of place */
export const bagOf = (s: GameState, kind: Kind): string[] => (s.v2?.gear?.bag ?? []).filter((id) => kindOfId(id) === kind);

/** the equip action of a piece of the bag; null when both accessory places are taken and the player must first say which one it replaces */
export function wearAction(s: GameState, id: string, at?: 0 | 1): Action | null {
  if (kindOfId(id) !== 'accessory') return { type: 'equip', item: id };
  const slot = at ?? (freeAcc(s) >= 0 ? undefined : null);
  if (slot === null) return null;
  return { type: 'equip', item: id, ...(slot === undefined ? {} : { slot }) };
}

/** the places a piece would take (the places that light up when it is selected): its own when worn, else its kind's, an accessory the free one or either */
export function hitPlacesFor(s: GameState, id: string, worn: WornPlace | null): WornPlace[] {
  if (worn !== null) return [worn];
  const k = kindOfId(id);
  return k === 'weapon' ? ['weapon'] : k === 'armour' ? ['armour'] : freeAcc(s) >= 0 ? [freeAcc(s) as 0 | 1] : [0, 1];
}

/** the piece a line of a keeper's goods sells, when it is a piece (not the forge's work, not a skill) */
export const pieceOfLine = (l: Line): string | null => (l.action.type === 'shopBuy' || l.action.type === 'buy' ? (l.action as { item: string }).item : l.action.type === 'barter' && !l.action.arg ? PASSERS[l.action.who].item : null);

/** who sells a kind of piece: the shops' keepers, from the catalogue itself (a free place says where to find what fits it) */
export function sellersOf(kind: Kind): string {
  const keepers = new Set<string>();
  for (const d of Object.values(GEAR)) if (d.slot === kind && d.price > 0) for (const sh of shopsOf(d)) keepers.add(SHOPS[sh].keeper);
  return [...keepers].map((k) => PEOPLE[k]?.name ?? k).join(', ');
}

/** what Mara would buy, the bag and the body, each with the sale's own check (GP-19: her price, the hour, a stolen piece) */
export const sellListOf = (s: GameState): Array<{ o: Own; sale: NonNullable<Line['sell']> }> => ownedOf(s).flatMap((o) => { const sale = sellOf(s, o.id, o.place ?? undefined); return sale ? [{ o, sale }] : []; });

/** what a piece's tile says: worn, or where it would go */
export function statusOf(s: GameState, o: Own): string {
  if (o.place !== null) return tx('ui.gear.wornTag');
  const k = kindOfId(o.id);
  if (k === 'weapon') { const w = wornAt(s, 'weapon'); return w && w !== HAND ? tx('ui.gear.replaces', { item: itemName(w) }) : tx('ui.gear.goesOn'); }
  if (k === 'armour') { const a = wornAt(s, 'armour'); return a ? tx('ui.gear.replaces', { item: itemName(a) }) : tx('ui.gear.goesOn'); }
  return freeAcc(s) >= 0 ? tx('ui.gear.goesFree') : tx('ui.gear.either');
}
/** a tile's second line: its kind and its points */
export const subOf = (id: string): string => `${tx(KIND_TEXT[kindOfId(id)])} · ${itemAbout(id) || tx('ui.gear.noPoints')}`;

/** one of the four places as the page draws it */
export interface PlaceView {
  place: WornPlace; kind: Kind;
  /** the piece worn, or null: a free place */
  id: string | null;
  /** the hand's own sword */
  hand: boolean;
  /** the points the piece gives (its `itemAbout`) */
  points: string;
  /** the forge's tier, on the weapon's place */
  tier: number;
  /** a free place: what the bag holds for it, and who sells it */
  bag: number; sellers: string;
  /** Mara's price for the worn piece, when she can buy it now */
  sale: number | null;
}
export function placeViews(s: GameState): PlaceView[] {
  return PLACES.map((place) => {
    const id = placeId(s, place), kind = kindOfPlace(place), hand = id === HAND, sale = id && !hand ? sellOf(s, id, place) : undefined;
    return { place, kind, id, hand, points: id ? itemAbout(id) : '', tier: place === 'weapon' ? weaponTier(s) : 0, bag: bagOf(s, kind).length, sellers: id ? '' : sellersOf(kind), sale: sale?.ok ? sale.n : null };
  });
}
