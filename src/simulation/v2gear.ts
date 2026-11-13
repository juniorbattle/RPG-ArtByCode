import { clamp, type GameState, type V2Gear } from './state';
import type { ActionDef } from './actions';
import { isV2 } from './v2';
import { GEAR, MAX_WEAPON_TIER, SHOPS, TIER_PRICE, WEAPON_TIER_ATK, type GearFx, type ShopId } from './gear';
import { REN_BASE, TRAINED_STATS, VIGOUR_HP, trainGain, type FighterStats, type TrainedStat } from '../combat/stats';
import { itemText, tx } from '../narrative/text';
import { allyAp } from '../narrative/v2story';
import type { Mods } from '../combat/profiles';
import { wanted } from './v2law';
import { PEOPLE } from '../narrative/people';

/** The equipment and the shops of a version 2 game (lot V3, C5; the operator's decision AV-12, with its note « arme + armure + 2 accessoires »,
 *  journal Passe V3): the gear carried (one weapon and its tier, one armour, two accessories, the bag of what is owned and not worn), what it
 *  changes in a duel (`v2Mods`), the shops (one per district, each its specialty) and their prices, which follow the district, the player's
 *  reputation, the keeper's goodwill, the events (the steel shortage) and the hour, « sans simulation financière lourde » (GAMEPLAY § 10).
 *  Mara's shop of today is this system's general store in a version 2 game; the forge's Wyrmsteel temper is the weapon's first tier. Pure. */

/** a level of wound takes this share of the health in a bout; a training session gives TRAIN_POINT to the stat chosen at the next bout (the operator's
 *  DB7-3 « +1 à la stat choisie, pour le prochain combat », journal Passe DB8; +5 % damage before), TRAIN_HP to health (DB11-5), up to TRAIN_MAX sessions (read by the guide too,
 *  journal Passe TU3) */
export const INJURY_HP = 0.2, TRAIN_MAX = 2;
export const START_GEAR: V2Gear = { weapon: 'training-sword', tier: 0, armour: null, acc: [null, null], bag: [] };

export function gearOf(s: GameState): V2Gear {
  if (!s.v2) throw new Error('not a version 2 game');
  if (!s.v2.gear) s.v2.gear = JSON.parse(JSON.stringify(START_GEAR)) as V2Gear;
  return s.v2.gear;
}
const gearView = (s: GameState): V2Gear => s.v2?.gear ?? START_GEAR;
/** the pieces Ren wears (the weapon, the armour, the two accessories): the duel reads their effects on top of their points (src/combat/autoData.ts AUTO_GEAR_FX) */
export function wornPieces(s: GameState): Array<string | null> { const g = gearView(s); return [g.weapon, g.armour, ...g.acc]; }
/** the Speed points of the pieces worn (the gear's own table, AC-11's doubled points): the duel counts them at AUTO_PIECE_VIV (PB-1) */
export function piecesViv(s: GameState): number { return wornPieces(s).reduce((n, id) => n + (id ? GEAR[id]?.fx?.viv ?? 0 : 0), 0); }

/** the weapon's tier as the duel reads it: its own, and the Wyrmsteel temper of the steel cargo (one more), at most MAX_WEAPON_TIER */
export function weaponTier(s: GameState): number {
  return Math.min(MAX_WEAPON_TIER, gearView(s).tier + (s.player.items.includes('tempered-blade') ? 1 : 0));
}

/** every effect the player wears (the weapon and its tiers, the armour, both accessories): the stat points added, the AP added, the effect multiplied */
export function wornFx(s: GameState): Required<GearFx> {
  const g = gearView(s), fx: Required<GearFx> = { atk: 0, def: 0, end: 0, viv: 0, hp: 0, ap: 0, effect: 1 };
  for (const id of [g.weapon, g.armour, ...g.acc]) {
    const d = id ? GEAR[id] : undefined;
    if (!d) continue;
    for (const [k, v] of Object.entries(d.fx) as Array<[keyof GearFx, number]>) { if (k === 'effect') fx.effect *= v; else fx[k] += v; }
  }
  fx.atk += WEAPON_TIER_ATK * weaponTier(s);
  return fx;
}

/** the training sessions' stats for the next bout (DB7-3): the stat chosen at each, a session recorded before DB7 as Attack (its +5 % damage of before) */
export function trainedStats(s: GameState): TrainedStat[] {
  const n = Math.min(TRAIN_MAX, s.player.training), chosen = (s.v2?.prep ?? []).filter((k): k is TrainedStat => (TRAINED_STATS as readonly string[]).includes(k)).slice(0, n);
  return [...chosen, ...Array<TrainedStat>(n - chosen.length).fill('atk')];
}

/** Ren's stats in a version 2 game's next bout (the operator's DB7 sheet, decisions A3, journal Passe DB8; src/combat/stats.ts): his base, the
 *  vigour of his wins (DB7-4 « +12 PV par victoire »), the gear in points (DB7-2), the whetstone, the training sessions (DB7-3); an injury is a share
 *  of the health on top (v2Mods) */
export function v2Stats(s: GameState): FighterStats {
  const fx = wornFx(s), st: FighterStats = { ...REN_BASE };
  st.hp += VIGOUR_HP * (s.v2?.wins ?? 0) + fx.hp;
  st.atk += fx.atk + (s.player.items.includes('whetstone') ? GEAR.whetstone.fx.atk ?? 0 : 0);
  st.def += fx.def; st.end += fx.end; st.viv += fx.viv;
  for (const k of trainedStats(s)) st[k] += trainGain(k);
  for (const k of Object.keys(st) as Array<keyof FighterStats>) st[k] = +st[k].toFixed(2);
  return st;
}

/** where Ren's health in his next bout comes from (the operator's DB11-5 « Le dire partout », journal Passe DB13: the match sheet says it): his start, his
 *  vigour (VIGOUR_HP a bout won), his gear, his training sessions given to health, and what a wound takes; `total` is the bout's health (v2Stats × v2Mods) */
export function healthParts(s: GameState): { base: number; vigour: number; gear: number; train: number; wound: number; total: number } {
  const st = v2Stats(s), share = 1 - INJURY_HP * s.player.injury, total = Math.max(1, Math.round(st.hp * share));
  return {
    base: REN_BASE.hp, vigour: VIGOUR_HP * (s.v2?.wins ?? 0), gear: wornFx(s).hp,
    train: trainedStats(s).filter((k) => k === 'hp').length * trainGain('hp'), wound: Math.round(st.hp) - total, total,
  };
}

/** what a version 2 player's state changes in a duel on top of his stats (v2Stats): the injury's share of his health, the AP of his gear and of a
 *  friend, the night's tampering, the effects' duration; `damage`, `gauge` and `charge` are in his stats since DB7-2 (1 here) */
export function v2Mods(s: GameState): Mods & { taken: number; gauge: number; charge: number; effect: number; stats: FighterStats } {
  const fx = wornFx(s);
  return {
    stats: v2Stats(s),
    hp: +(1 - INJURY_HP * s.player.injury).toFixed(4), damage: 1, ap: fx.ap + allyAp(s),
    // the gear tampered with in the night (lot V7, the event v2-gear-tamper): 15 % more damage taken that day, unless Hilde checked it
    taken: s.flags[`tampered:${s.day}`] && !s.flags[`checked:${s.day}`] ? 1.15 : 1, gauge: 1, charge: 1, effect: +fx.effect.toFixed(4),
  };
}

// ------------------------------------------------------------------------------------------------ the shops and their prices

/** a shop's price for an item now (« proposé »): its list price × the district's factor × the player's name (up to 15 % off at reputation 60)
 *  × the keeper's goodwill (a tenth off at 15) × the steel shortage on blades and armour (today's `shopFactor`) × the hour (a fifth more at
 *  night) × the keeper's markup the days after a theft caught (lot V4); a bargain is struck at the moment of buying (lot L2a, v2barter.ts) */
export function shopPrice(s: GameState, shop: ShopId, item: string): number {
  const d = GEAR[item], sh = SHOPS[shop];
  if (!d) return 0;
  const steel = d.slot === 'weapon' || d.slot === 'armour' ? s.services.shopFactor : 1;
  const rep = 1 - Math.min(0.15, s.player.reputation / 400), rel = (s.town[sh.keeper] ?? 0) >= 15 ? 0.9 : 1, night = s.slot === 'evening' ? 1.2 : 1;
  const day = s.v2?.shops?.[shop], markup = day?.markup && day.markup >= s.day ? 1.25 : 1;
  return Math.max(1, Math.round(d.price * sh.factor * rep * rel * steel * night * markup));
}

/** is this shop open to the player now: its place, its hours, its keeper there, not closed to the player for the day (a theft caught, V4), not
 *  shut to a player the watch wants (lot L2a: the stallholders talk, until a restitution at Sergeant Hale's) */
export function shopOpen(s: GameState, shop: ShopId): string | null {
  const sh = SHOPS[shop];
  if (s.place !== sh.place) return tx('v2.shop.notHere');
  if (!sh.open.includes(s.slot)) return tx('v2.shop.shut');
  if (s.v2?.shops?.[shop]?.closed === s.day) return tx('v2.shop.barred');
  if (wanted(s)) return tx('v2.shop.wanted', { name: PEOPLE[sh.keeper]?.name ?? sh.keeper });
  return null;
}

/** a piece bought (from a shop, by a bargain, from a passer-by) goes where it is worn, or into the bag: the salve heals at once, the whetstone waits for
 *  the next bout, a weapon is taken in hand (the old one to the bag), an armour worn (the old one to the bag), an accessory on a free place or the bag */
export function receive(s: GameState, item: string): void {
  const d = GEAR[item];
  if (item === 'salve') { s.player.injury = Math.max(0, s.player.injury - 1); return; }
  if (item === 'whetstone') { s.player.items.push('whetstone'); return; }
  const g = gearOf(s);
  if (d.slot === 'weapon') { g.bag.push(g.weapon); g.weapon = item; g.tier = 0; }
  else if (d.slot === 'armour') { if (g.armour) g.bag.push(g.armour); g.armour = item; }
  else { const i = g.acc.indexOf(null); if (i >= 0) g.acc[i] = item; else g.bag.push(item); }
}

export const itemName = (id: string): string => itemText(id, 'name');
export const itemAbout = (id: string): string => itemText(id, 'about');
/** after « your »: without its article */
const heldName = (id: string): string => itemName(id).replace(/^an? /, '');

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
      const p = shopPrice(s, a.shop, a.item), d = GEAR[a.item], keeper = SHOPS[a.shop].keeper;
      s.player.coins -= p; s.town[keeper] = clamp((s.town[keeper] ?? 0) + 3, -100, 100);
      // what is bought is worn at once when its place is free (or better than nothing), else kept in the bag
      receive(s, a.item);
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
    // a tier's Attack as the gear's table gives it (journal Passe CO1: « +8 % damage » since DB7-2 made it a point, AC-11 two)
    label: (s) => tx('v2.upgrade.label', { item: heldName(gearView(s).weapon), tier: weaponTier(s) + 1, price: TIER_PRICE[Math.min(MAX_WEAPON_TIER - 1, weaponTier(s))], atk: WEAPON_TIER_ATK }),
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
      emit({ kind: 'action', id: 'upgrade', cause: 'action:upgradeWeapon', visible: true, text: tx('v2.upgrade.log', { item: heldName(gearView(s).weapon), tier: weaponTier(s) }) });
    },
  },
};
