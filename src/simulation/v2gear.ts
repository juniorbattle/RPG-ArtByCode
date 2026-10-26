import { clamp, type GameState, type V2Gear } from './state';
import type { ActionDef } from './actions';
import { isV2 } from './v2';
import { GEAR, MAX_WEAPON_TIER, SHOPS, TIER_PRICE, WEAPON_TIER_DAMAGE, type GearFx, type ShopId } from './gear';
import { itemText, tx } from '../narrative/text';
import { allyAp } from '../narrative/v2story';
import type { Mods } from '../combat/profiles';

/** The equipment and the shops of a version 2 game (lot V3, C5; the operator's decision AV-12, with its note « arme + armure + 2 accessoires »,
 *  journal Passe V3): the gear carried (one weapon and its tier, one armour, two accessories, the bag of what is owned and not worn), what it
 *  changes in a duel (`v2Mods`), the shops (one per district, each its specialty) and their prices, which follow the district, the player's
 *  reputation, the keeper's goodwill, the events (the steel shortage) and the hour, « sans simulation financière lourde » (GAMEPLAY § 10).
 *  Mara's shop of today is this system's general store in a version 2 game; the forge's Wyrmsteel temper is the weapon's first tier. Pure. */

export const START_GEAR: V2Gear = { weapon: 'training-sword', tier: 0, armour: null, acc: [null, null], bag: [] };

export function gearOf(s: GameState): V2Gear {
  if (!s.v2) throw new Error('not a version 2 game');
  if (!s.v2.gear) s.v2.gear = JSON.parse(JSON.stringify(START_GEAR)) as V2Gear;
  return s.v2.gear;
}
const gearView = (s: GameState): V2Gear => s.v2?.gear ?? START_GEAR;

/** the weapon's tier as the duel reads it: its own, and the Wyrmsteel temper of the steel cargo (one more), at most MAX_WEAPON_TIER */
export function weaponTier(s: GameState): number {
  return Math.min(MAX_WEAPON_TIER, gearView(s).tier + (s.player.items.includes('tempered-blade') ? 1 : 0));
}

/** every effect the player wears (the weapon, the armour, both accessories), multiplied or added */
export function wornFx(s: GameState): Required<GearFx> {
  const g = gearView(s), fx: Required<GearFx> = { damage: 1, taken: 1, ap: 0, gauge: 1, charge: 1, effect: 1, hp: 1 };
  for (const id of [g.weapon, g.armour, ...g.acc]) {
    const d = id ? GEAR[id] : undefined;
    if (!d) continue;
    for (const [k, v] of Object.entries(d.fx) as Array<[keyof GearFx, number]>) { if (k === 'ap') fx.ap += v; else fx[k] *= v; }
  }
  fx.damage *= 1 + WEAPON_TIER_DAMAGE * weaponTier(s);
  return fx;
}

/** what a version 2 player's state changes in a duel: today's injury, whetstone and training, and the gear (the weapon replaces today's blade
 *  items: the imported blade is a weapon, the temper a tier); `taken`, `gauge`, `charge`, `effect` go to the duel's data (v2duel.ts) */
export function v2Mods(s: GameState): Mods & { taken: number; gauge: number; charge: number; effect: number } {
  const fx = wornFx(s), stone = s.player.items.includes('whetstone') ? 1.05 : 1;
  return {
    hp: +((1 - 0.2 * s.player.injury) * fx.hp).toFixed(4), damage: +(fx.damage * stone * (1 + 0.05 * Math.min(2, s.player.training))).toFixed(4), ap: fx.ap + allyAp(s),
    taken: +fx.taken.toFixed(4), gauge: +fx.gauge.toFixed(4), charge: +fx.charge.toFixed(4), effect: +fx.effect.toFixed(4),
  };
}

// ------------------------------------------------------------------------------------------------ the shops and their prices

/** a shop's price for an item now (« proposé »): its list price × the district's factor × the player's name (up to 15 % off at reputation 60)
 *  × the keeper's goodwill (a tenth off at 15) × the steel shortage on blades and armour (today's `shopFactor`) × the hour (a fifth more at
 *  night) × a bargain or a grudge of the day (lot V4) */
export function shopPrice(s: GameState, shop: ShopId, item: string): number {
  const d = GEAR[item], sh = SHOPS[shop];
  if (!d) return 0;
  const steel = d.slot === 'weapon' || d.slot === 'armour' ? s.services.shopFactor : 1;
  const rep = 1 - Math.min(0.15, s.player.reputation / 400), rel = (s.town[sh.keeper] ?? 0) >= 15 ? 0.9 : 1, night = s.slot === 'evening' ? 1.2 : 1;
  const day = s.v2?.shops?.[shop], deal = day?.deal === s.day ? 0.85 : day?.sour === s.day ? 1.1 : 1, markup = day?.markup && day.markup >= s.day ? 1.25 : 1;
  return Math.max(1, Math.round(d.price * sh.factor * rep * rel * steel * night * deal * markup));
}

/** is this shop open to the player now: its place, its hours, its keeper there, not closed to the player for the day (a theft caught, V4) */
export function shopOpen(s: GameState, shop: ShopId): string | null {
  const sh = SHOPS[shop];
  if (s.place !== sh.place) return tx('v2.shop.notHere');
  if (!sh.open.includes(s.slot)) return tx('v2.shop.shut');
  if (s.v2?.shops?.[shop]?.closed === s.day) return tx('v2.shop.barred');
  return null;
}

export const itemName = (id: string): string => itemText(id, 'name');
export const itemAbout = (id: string): string => itemText(id, 'about');

export type V2GearAction =
  | { type: 'shopBuy'; shop: ShopId; item: string }
  | { type: 'equip'; item: string; slot?: 0 | 1 }
  | { type: 'upgradeWeapon' };

const has = (s: GameState, id: string) => { const g = gearView(s); return g.weapon === id || g.armour === id || g.acc.includes(id) || g.bag.includes(id); };

export const V2_GEAR_ACTIONS: { [K in V2GearAction['type']]: ActionDef<Extract<V2GearAction, { type: K }>> & { by: string | ((a: Extract<V2GearAction, { type: K }>) => string) | null } } = {
  shopBuy: {
    by: (a) => SHOPS[a.shop].keeper,
    list: (s) => (!isV2(s) ? [] : (Object.keys(SHOPS) as ShopId[]).filter((k) => SHOPS[k].place === s.place).flatMap((shop) => Object.values(GEAR).filter((g) => g.shop === shop).map((g) => ({ type: 'shopBuy' as const, shop, item: g.id })))),
    label: (s, a) => tx('v2.shop.label', { item: itemName(a.item), price: shopPrice(s, a.shop, a.item), about: itemAbout(a.item) }),
    cost: () => 0,
    coins: (s, a) => shopPrice(s, a.shop, a.item),
    check: (s, a) => {
      if (!isV2(s)) return tx('v2.only');
      const d = GEAR[a.item];
      if (!d || d.shop !== a.shop) return tx('v2.shop.notSold');
      const o = shopOpen(s, a.shop); if (o) return o;
      if (d.slot !== 'consumable' && has(s, a.item)) return tx('v2.shop.owned');
      if (a.item === 'whetstone' && s.player.items.includes('whetstone')) return tx('buy.haveStone');
      if (a.item === 'salve' && s.player.injury === 0) return tx('buy.notHurt');
      return s.player.coins < shopPrice(s, a.shop, a.item) ? tx('buy.poor') : null;
    },
    apply: (s, a, _r, emit) => {
      const p = shopPrice(s, a.shop, a.item), d = GEAR[a.item], g = gearOf(s), keeper = SHOPS[a.shop].keeper;
      s.player.coins -= p; s.town[keeper] = clamp((s.town[keeper] ?? 0) + 3, -100, 100);
      if (a.item === 'salve') s.player.injury = Math.max(0, s.player.injury - 1);
      else if (a.item === 'whetstone') s.player.items.push('whetstone');
      // what is bought is worn at once when its place is free (or better than nothing), else kept in the bag
      else if (d.slot === 'weapon') { g.bag.push(g.weapon); g.weapon = a.item; g.tier = 0; }
      else if (d.slot === 'armour') { if (g.armour) g.bag.push(g.armour); g.armour = a.item; }
      else { const i = g.acc.indexOf(null); if (i >= 0) g.acc[i] = a.item; else g.bag.push(a.item); }
      emit({ kind: 'action', id: `shop:${a.item}`, cause: s.services.shopFactor > 1 && (d.slot === 'weapon' || d.slot === 'armour') ? tx('buy.causePrices', { cause: s.services.shopCause }) : 'action:shopBuy', visible: true, text: tx('v2.shop.log', { item: itemName(a.item), price: p }) });
    },
  },
  equip: {
    by: null,
    // from the gear card (the interface): not listed among the place's actions
    list: () => [],
    label: (_s, a) => tx('v2.equip.label', { item: itemName(a.item) }),
    cost: () => 0,
    check: (s, a) => (!isV2(s) ? tx('v2.only') : !GEAR[a.item] || GEAR[a.item].slot === 'consumable' ? tx('v2.equip.cannot') : !gearView(s).bag.includes(a.item) ? tx('v2.equip.notInBag') : null),
    apply: (s, a, _r, emit) => {
      const g = gearOf(s), d = GEAR[a.item];
      g.bag.splice(g.bag.indexOf(a.item), 1);
      if (d.slot === 'weapon') { g.bag.push(g.weapon); g.weapon = a.item; g.tier = 0; }
      else if (d.slot === 'armour') { if (g.armour) g.bag.push(g.armour); g.armour = a.item; }
      else { const i = a.slot ?? (g.acc[0] === null ? 0 : g.acc[1] === null ? 1 : 0); const old = g.acc[i]; if (old) g.bag.push(old); g.acc[i] = a.item; }
      emit({ kind: 'action', id: 'equip', cause: 'action:equip', visible: false, text: tx('v2.equip.log', { item: itemName(a.item) }) });
    },
  },
  upgradeWeapon: {
    by: 'bram',
    list: (s) => (isV2(s) && s.place === 'district' ? [{ type: 'upgradeWeapon' }] : []),
    label: (s) => tx('v2.upgrade.label', { item: itemName(gearView(s).weapon), tier: weaponTier(s) + 1, price: TIER_PRICE[Math.min(MAX_WEAPON_TIER - 1, weaponTier(s))] }),
    cost: () => 1,
    coins: (s) => (weaponTier(s) >= MAX_WEAPON_TIER ? 0 : TIER_PRICE[weaponTier(s)]),
    check: (s) => {
      if (!isV2(s)) return tx('v2.only');
      if (s.place !== 'district') return tx('v2.upgrade.notHere');
      if (s.services.forge === 'sabotaged') return tx('temper.cold');
      if (s.slot === 'evening') return tx('v2.upgrade.night');
      if (weaponTier(s) >= MAX_WEAPON_TIER) return tx('v2.upgrade.max');
      return s.player.coins < TIER_PRICE[weaponTier(s)] ? tx('v2.upgrade.poor', { price: TIER_PRICE[weaponTier(s)] }) : null;
    },
    apply: (s, _a, _r, emit) => {
      const p = TIER_PRICE[weaponTier(s)];
      s.player.coins -= p; gearOf(s).tier++; s.town.bram = clamp((s.town.bram ?? 0) + 5, -100, 100);
      emit({ kind: 'action', id: 'upgrade', cause: 'action:upgradeWeapon', visible: true, text: tx('v2.upgrade.log', { item: itemName(gearView(s).weapon), tier: weaponTier(s) }) });
    },
  },
};
