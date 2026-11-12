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
/** what an item gives (the operator's DB7-2 « Des points, le reste gardé », a decision A3, journal Passe DB8): points of the fighter's stats
 *  (src/combat/stats.ts: Attack, Defence, Endurance, Speed, health; each item's percentage of before turned into points, briefs/stats-combattants.md
 *  § 2.3), and what is not a stat as before (the AP, the effects' duration) */
export interface GearFx {
  /** Attack points */
  atk?: number;
  /** Defence points */
  def?: number;
  /** Endurance points (the gauge the opponent's blows fill) */
  end?: number;
  /** Speed points (the charge times; DB7-1 « Ajouter la Vivacité (vitesse de charge) ») */
  viv?: number;
  /** health points */
  hp?: number;
  /** extra AP at the start of a duel */
  ap?: number;
  /** a ward's and a boost's duration (x) */
  effect?: number;
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

/** the points of every piece, the forge's tier and the whetstone, its penalties included, doubled since the duel played by the computer (the operator's AC-11
 *  « Doubler les points de l’équipement (décision A3 : change DB7-2) », journal Passe AC4; applied with lot 2, journal Passe LC3): each one twice its DB7-2
 *  figure; the AP and the effects' length unchanged */
export const GEAR: Record<string, GearDef> = {
  // weapons
  'training-sword': { id: 'training-sword', slot: 'weapon', price: 0, fx: {} },
  'imported-blade': { id: 'imported-blade', slot: 'weapon', price: 30, fx: { atk: 4 }, shop: 'mara' },
  'duelist-sabre': { id: 'duelist-sabre', slot: 'weapon', price: 55, fx: { atk: 3, viv: 2 }, shop: 'master' },
  // armour
  'padded-jack': { id: 'padded-jack', slot: 'armour', price: 18, fx: { def: 2 }, shop: 'armourer' },
  'mail-shirt': { id: 'mail-shirt', slot: 'armour', price: 40, fx: { def: 6, viv: -1 }, shop: 'armourer' },
  'dock-leathers': { id: 'dock-leathers', slot: 'armour', price: 26, fx: { def: 3, end: 2 }, shop: 'mara' },
  // accessories (two slots)
  'lucky-ribbon': { id: 'lucky-ribbon', slot: 'accessory', price: 12, fx: { ap: 1 }, shop: 'trinkets' },
  'iron-ring': { id: 'iron-ring', slot: 'accessory', price: 24, fx: { end: 4 }, shop: 'armourer' },
  'swift-boots': { id: 'swift-boots', slot: 'accessory', price: 30, fx: { viv: 2 }, shop: 'master' },
  'fervour-charm': { id: 'fervour-charm', slot: 'accessory', price: 16, fx: { effect: 1.3 }, shop: 'trinkets' },
  'docker-wrap': { id: 'docker-wrap', slot: 'accessory', price: 14, fx: { hp: 36 }, shop: 'mara' },
  'champion-token': { id: 'champion-token', slot: 'accessory', price: 0, fx: { ap: 1, end: 1 } },
  // the passers-by's pieces (lot L2a, the operator's note on EV-6: « items unique ou rentable »), sold by no shop: bought, bargained for or stolen
  // from their owner (src/simulation/v2barter.ts PASSERS); the hauberk is the « rentable » one, better and cheaper than the armourer's mail
  'river-pearl': { id: 'river-pearl', slot: 'accessory', price: 26, fx: { end: 3, hp: 20 } },
  'knight-hauberk': { id: 'knight-hauberk', slot: 'armour', price: 34, fx: { def: 7, viv: -1 } },
  'pilgrim-medal': { id: 'pilgrim-medal', slot: 'accessory', price: 18, fx: { hp: 32, effect: 1.15 } },
  // consumables (used up by the next bout, or at once)
  whetstone: { id: 'whetstone', slot: 'consumable', price: 8, fx: { atk: 1 }, shop: 'mara' },
  salve: { id: 'salve', slot: 'consumable', price: 10, fx: {}, shop: 'mara' },
};

/** the weapon's tiers: each +2 Attack (+1 before AC-11, +8 % damage before DB7-2); the forge (Bram) raises it, the Wyrmsteel temper is the first tier
 *  (the steel cargo's quest) */
export const WEAPON_TIER_ATK = 2;
export const MAX_WEAPON_TIER = 3;
export const TIER_PRICE = [10, 25, 40];
