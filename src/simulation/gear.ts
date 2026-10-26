import type { PlaceId } from './state';

/** The equipment of a version 2 game (lot V3, C5; the operator's decision AV-12 with its note, word for word « arme + armure + 2 accessoires »,
 *  journal Passe V3): one weapon upgradable by tiers, one armour, two accessories, each changing a real number of the duel (the specification
 *  § 8: « arme predefini avec amelioration (stats-effets) », « 2-3 slot d'accessoires »). Today's items join the system: the whetstone stays a
 *  consumable (+5 % at the next bout), the salve a consumable (one level of injury), the imported blade a weapon, Bram's Wyrmsteel temper a
 *  weapon tier. Every number is « proposé ». Pure data and functions. */

export type GearSlot = 'weapon' | 'armour' | 'accessory' | 'consumable';
export interface GearDef {
  id: string; slot: GearSlot;
  /** list price (coins) */
  price: number;
  /** what it changes in a duel */
  fx: GearFx;
  /** the shop (place) that sells it; absent: not sold (a quest's or a challenge's) */
  shop?: ShopId;
}
export interface GearFx {
  /** the player's damage (x) */
  damage?: number;
  /** the damage the player takes (x) */
  taken?: number;
  /** extra AP at the start of a duel */
  ap?: number;
  /** what the opponent's blows add to the player's resistance gauge (x: under 1, the gauge fills slower) */
  gauge?: number;
  /** the charge times (x: under 1, faster) */
  charge?: number;
  /** a ward's and a boost's duration (x) */
  effect?: number;
  /** the player's health (x) */
  hp?: number;
}

/** a shop per district, each with its specialty (AV-12: « une boutique par district ») */
export type ShopId = 'mara' | 'armourer' | 'master' | 'trinkets';
export interface ShopDef { id: ShopId; place: PlaceId; keeper: string; specialty: string; open: Array<'morning' | 'afternoon' | 'evening'>; factor: number }

export const SHOPS: Record<ShopId, ShopDef> = {
  // the Merchant District: Mara's stall, the general goods (her blades, salves, whetstones), by day
  mara: { id: 'mara', place: 'district', keeper: 'mara', specialty: 'general', open: ['morning', 'afternoon'], factor: 1 },
  // the arena's forecourt: the armourer by the gate, armour and the tournament's tokens, dearer near the Colosseum
  armourer: { id: 'armourer', place: 'forecourt', keeper: 'hilde', specialty: 'armour', open: ['morning', 'afternoon'], factor: 1.15 },
  // the weapon master, skills (lot V2) and fine weapons: on the forecourt until the training ground is built (lot V5)
  master: { id: 'master', place: 'training', keeper: 'corvin', specialty: 'weapons', open: ['morning', 'afternoon'], factor: 1.1 },
  // a trinket stall that opens at dusk, the accessories, cheap: on Lantern Row until the festive square replaces it (lot V5)
  trinkets: { id: 'trinkets', place: 'lanterns', keeper: 'pip', specialty: 'accessories', open: ['afternoon', 'evening'], factor: 0.9 },
};

export const GEAR: Record<string, GearDef> = {
  // weapons
  'training-sword': { id: 'training-sword', slot: 'weapon', price: 0, fx: {} },
  'imported-blade': { id: 'imported-blade', slot: 'weapon', price: 30, fx: { damage: 1.15 }, shop: 'mara' },
  'duelist-sabre': { id: 'duelist-sabre', slot: 'weapon', price: 55, fx: { damage: 1.12, charge: 0.92 }, shop: 'master' },
  // armour
  'padded-jack': { id: 'padded-jack', slot: 'armour', price: 18, fx: { taken: 0.94 }, shop: 'armourer' },
  'mail-shirt': { id: 'mail-shirt', slot: 'armour', price: 40, fx: { taken: 0.88, charge: 1.05 }, shop: 'armourer' },
  'dock-leathers': { id: 'dock-leathers', slot: 'armour', price: 26, fx: { taken: 0.92, gauge: 0.92 }, shop: 'mara' },
  // accessories (two slots)
  'lucky-ribbon': { id: 'lucky-ribbon', slot: 'accessory', price: 12, fx: { ap: 1 }, shop: 'trinkets' },
  'iron-ring': { id: 'iron-ring', slot: 'accessory', price: 24, fx: { gauge: 0.85 }, shop: 'armourer' },
  'swift-boots': { id: 'swift-boots', slot: 'accessory', price: 30, fx: { charge: 0.9 }, shop: 'master' },
  'fervour-charm': { id: 'fervour-charm', slot: 'accessory', price: 16, fx: { effect: 1.3 }, shop: 'trinkets' },
  'docker-wrap': { id: 'docker-wrap', slot: 'accessory', price: 14, fx: { hp: 1.06 }, shop: 'mara' },
  'champion-token': { id: 'champion-token', slot: 'accessory', price: 0, fx: { ap: 1, gauge: 0.95 } },
  // consumables (used up by the next bout, or at once)
  whetstone: { id: 'whetstone', slot: 'consumable', price: 8, fx: { damage: 1.05 }, shop: 'mara' },
  salve: { id: 'salve', slot: 'consumable', price: 10, fx: {}, shop: 'mara' },
};

/** the weapon's tiers: each +8 % damage; the forge (Bram) raises it, the Wyrmsteel temper is the first tier (the steel cargo's quest) */
export const WEAPON_TIER_DAMAGE = 0.08;
export const MAX_WEAPON_TIER = 3;
export const TIER_PRICE = [10, 25, 40];
