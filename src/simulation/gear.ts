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
  /** a second shop that sells it (the operator's EQ-9 « Ces sept pièces », journal Passe GP5-2: seven pieces at two places, the price following the place) */
  also?: ShopId;
  /** the first day it is sold (the operator's EQ-5 « Ces quatre, de 80 à 100 pièces dès le jour 6 »: a piece of the end of the tournament, its price fixed) */
  from?: number;
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

/** the shops that sell a piece, the first then the second (the operator's EQ-9); none for a piece no shop sells */
export const shopsOf = (d: GearDef | undefined): ShopId[] => (d ? ([d.shop, d.also].filter(Boolean) as ShopId[]) : []);
/** is this piece sold at this shop on this day: one of its places, and from its first day (the pieces of the end of the tournament, EQ-5) */
export const soldAt = (d: GearDef | undefined, shop: ShopId, day: number): boolean => !!d && shopsOf(d).includes(shop) && day >= (d.from ?? 0);

/** the points of every piece, the forge's tier and the whetstone, its penalties included, doubled since the duel played by the computer (the operator's AC-11
 *  « Doubler les points de l’équipement (décision A3 : change DB7-2) », journal Passe AC4; applied with lot 2, journal Passe LC3): each one twice its DB7-2
 *  figure; the AP and the effects' length unchanged. The catalogue of the operator's chantier 5 (GP-18 « Revoir le catalogue », the sheet https://claude.ai/artifact/Eg4nNbYLtAaCfngnEKZLGs
 *  read back fourteen of fourteen at the recommendation, journal Passe GP5-2): every piece measured piece by piece on the game's own duel (tools/auto-gear.mjs), none
 *  dominated at its price and none a choice nobody makes at its price but the cheap ones, which are worth one coin for one point of victory like the others; the six
 *  weapons of the harmful states each the imported blade less 2 Attack with a state (EQ-2), the armours and four charms that keep states off (EQ-3), the retouches (EQ-4),
 *  the four pieces of the end (EQ-5) */
export const GEAR: Record<string, GearDef> = {
  // weapons
  'training-sword': { id: 'training-sword', slot: 'weapon', price: 0, fx: {} },
  'imported-blade': { id: 'imported-blade', slot: 'weapon', price: 24, fx: { atk: 4 }, shop: 'mara', also: 'master' },
  'duelist-sabre': { id: 'duelist-sabre', slot: 'weapon', price: 50, fx: { atk: 5, viv: 2 }, shop: 'master' },
  // the weapons of the harmful states (EQ-2 « Ces six armes, à 26-30 pièces »): the imported blade, its blows and its effects, less 2 Attack (GE-4's counterpart), with their family's state
  'viper-blade': { id: 'viper-blade', slot: 'weapon', price: 26, fx: { atk: 2 }, shop: 'mara' },
  'serrated-cutlass': { id: 'serrated-cutlass', slot: 'weapon', price: 30, fx: { atk: 2 }, shop: 'mara', also: 'master' },
  'ember-sword': { id: 'ember-sword', slot: 'weapon', price: 30, fx: { atk: 2 }, shop: 'master' },
  'mirror-blade': { id: 'mirror-blade', slot: 'weapon', price: 30, fx: { atk: 2 }, shop: 'master' },
  'hex-falchion': { id: 'hex-falchion', slot: 'weapon', price: 30, fx: { atk: 2 }, shop: 'master' },
  'torpor-rapier': { id: 'torpor-rapier', slot: 'weapon', price: 30, fx: { atk: 2 }, shop: 'master' },
  // armour: the three of the shops keep a state's chance halved (EQ-3), the passer-by's hauberk the mail's
  'padded-jack': { id: 'padded-jack', slot: 'armour', price: 14, fx: { def: 2 }, shop: 'armourer', also: 'mara' },
  'mail-shirt': { id: 'mail-shirt', slot: 'armour', price: 40, fx: { def: 6, viv: -1 }, shop: 'armourer' },
  'dock-leathers': { id: 'dock-leathers', slot: 'armour', price: 30, fx: { def: 3, end: 2 }, shop: 'mara' },
  // accessories (two slots)
  'lucky-ribbon': { id: 'lucky-ribbon', slot: 'accessory', price: 10, fx: { hp: 24, ap: 1 }, shop: 'trinkets' },
  'iron-ring': { id: 'iron-ring', slot: 'accessory', price: 32, fx: { end: 3 }, shop: 'armourer', also: 'trinkets' },
  'swift-boots': { id: 'swift-boots', slot: 'accessory', price: 24, fx: { viv: 2 }, shop: 'master' },
  'fervour-charm': { id: 'fervour-charm', slot: 'accessory', price: 12, fx: { effect: 1.6 }, shop: 'trinkets' },
  'docker-wrap': { id: 'docker-wrap', slot: 'accessory', price: 12, fx: { hp: 36 }, shop: 'mara', also: 'trinkets' },
  // the four charms that keep a state off (EQ-3 « Ces armures et ces quatre charmes, avec un petit bonus »)
  'bezoar-stone': { id: 'bezoar-stone', slot: 'accessory', price: 16, fx: { end: 2 }, shop: 'trinkets' },
  'salamander-charm': { id: 'salamander-charm', slot: 'accessory', price: 18, fx: { def: 2, hp: 18 }, shop: 'trinkets', also: 'armourer' },
  'wayfarer-hood': { id: 'wayfarer-hood', slot: 'accessory', price: 18, fx: { viv: 2 }, shop: 'armourer', also: 'master' },
  'field-tourniquet': { id: 'field-tourniquet', slot: 'accessory', price: 18, fx: { hp: 36 }, shop: 'mara' },
  // the end of the tournament (EQ-5, GP-17 « Des pièces de fin de tournoi et une avance sur la bourse »): one a shop, from day 6, dear, their price fixed
  'caravan-greatblade': { id: 'caravan-greatblade', slot: 'weapon', price: 90, fx: { atk: 10 }, shop: 'mara', from: 6 },
  'tournament-plate': { id: 'tournament-plate', slot: 'armour', price: 100, fx: { def: 8, viv: -1 }, shop: 'armourer', from: 6 },
  'masters-sash': { id: 'masters-sash', slot: 'accessory', price: 85, fx: { viv: 3, hp: 36 }, shop: 'master', from: 6 },
  'champion-laurel': { id: 'champion-laurel', slot: 'accessory', price: 80, fx: { hp: 60, end: 2, effect: 1.25 }, shop: 'trinkets', from: 6 },
  // (the champion's token, given by nothing and sold by no one, left the catalogue: the operator's GP-20 « Les corriger », journal Passe GP2; no save holds it.
  // Its effect stays in src/combat/autoData.ts AUTO_GEAR_FX, the laboratory's table the duel is proven identical to)
  // the passers-by's pieces (lot L2a, the operator's note on EV-6: « items unique ou rentable »), sold by no shop: bought, bargained for or stolen
  // from their owner (src/simulation/v2barter.ts PASSERS); the hauberk is the « rentable » one, the only piece better than every other of its slot (EQ-4: 60 pieces
  // at the armourer's price, the passer-by asks 34)
  'river-pearl': { id: 'river-pearl', slot: 'accessory', price: 30, fx: { end: 3, hp: 20 } },
  'knight-hauberk': { id: 'knight-hauberk', slot: 'armour', price: 60, fx: { def: 7, viv: -1 } },
  'pilgrim-medal': { id: 'pilgrim-medal', slot: 'accessory', price: 14, fx: { hp: 32, effect: 1.15 } },
  // the seven more passers-by's pieces (the operator's GP-06, journal Passe PN1; the catalogue revised with chantier 5, GP-18): five sold by no shop (two
  // more of the passers-by carry a shop's piece, Mara's imported blade and Pip's lucky ribbon)
  'mender-gloves': { id: 'mender-gloves', slot: 'accessory', price: 22, fx: { def: 1, end: 2 } },
  'courier-boots': { id: 'courier-boots', slot: 'accessory', price: 12, fx: { viv: 1 } },
  'minstrel-charm': { id: 'minstrel-charm', slot: 'accessory', price: 12, fx: { hp: 24, effect: 1.15 } },
  'sergeant-gorget': { id: 'sergeant-gorget', slot: 'accessory', price: 14, fx: { def: 2, hp: 12 } },
  'hostler-leathers': { id: 'hostler-leathers', slot: 'armour', price: 18, fx: { def: 2, end: 1 } },
  // consumables (used up by the next bout, or at once)
  whetstone: { id: 'whetstone', slot: 'consumable', price: 8, fx: { atk: 1 }, shop: 'mara' },
  salve: { id: 'salve', slot: 'consumable', price: 10, fx: {}, shop: 'mara' },
};

/** the weapon's tiers: each +2 Attack (+1 before AC-11, +8 % damage before DB7-2); the forge (Bram) raises it, the Wyrmsteel temper is the first tier
 *  (the steel cargo's quest) */
export const WEAPON_TIER_ATK = 2;
export const MAX_WEAPON_TIER = 3;
export const TIER_PRICE = [10, 25, 40];
// the forge's tiers follow the player's hand (the operator's EQ-11 « Les paliers suivent la main », journal Passe GP5-2): they stay when he changes blade, and the blade
// sold or taken off does not give them back (the blacksmith's Attack is the player's); the training sword in hand wears them as any weapon

/** the shops' prices by stage of the tournament (the operator's EQ-7 « Deux paliers : ×1,15 au tableau, ×1,3 dès le jour 9 »): the pieces of the shops (not the consumables,
 *  not the forge's tiers, not the pieces of the end, whose price is fixed), from the day each step starts, as the purses rise in three steps */
export const STAGE_PRICE: ReadonlyArray<{ from: number; k: number }> = [{ from: 6, k: 1.15 }, { from: 9, k: 1.3 }];
export const stagePrice = (day: number): number => STAGE_PRICE.reduce((k, p) => (day >= p.from ? p.k : k), 1);

/** Clerk Odo's advance on the final's purse (the operator's EQ-6 « 30 pièces à maître Odo dès le jour 9, rendues sur la bourse », GP-17): the coins, once, to the player who
 *  fights the final (drawn after day 8's bouts), from this day, no slot; given back out of the purse when the final is fought, whoever wins (the purse of a final lost is 30) */
export const ADVANCE = { coins: 30, from: 9 } as const;
