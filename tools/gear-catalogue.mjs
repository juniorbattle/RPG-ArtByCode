// The draft of the revised catalogue (the general gameplay audit's chantier 5, GP-18 « Revoir le catalogue »; journal Passe GP5-1): the pieces the draft changes or adds, laid
// over the game's own by `tools/auto-gear.mjs --catalogue=draft`. Nothing in `src/` reads it until the operator's sheet is read back. Every number is « proposé ».
//   fx      the points (src/simulation/gear.ts GearFx)        gfx      the duel's effects (src/combat/autoData.ts AUTO_GEAR_FX), merged over the game's
//   inflict a weapon family (STATE_WEAPON_FAMILIES)            resist   a protection (STATE_ARMOUR_FAMILIES / STATE_CHARM_FAMILIES)
//   shape   a weapon's light attack (AUTO_WEAPONS)             from     the first day it is sold (a piece of the end of the tournament: day 6)
// a family's weapon is the imported blade (its blows, its effects) less 2 Attack and with a state (GE-4's counterpart, measured on the blade in journal Passe GP4-1)
const BLADE = { hits: [0.8, 0.8], gap: 0.32 };
const FAM = (id, slot, price, fx, inflict, extra = {}) => ({ id, slot, price, fx, inflict, shape: BLADE, gfx: { gauge: 1.1, lightCharge: 1.1 }, ...extra });
export const CATALOGUE = [
  // ------------------------------------------------------------------------------------------------------ the weapons: the six families of the harmful states, each the blade less 2 Attack
  FAM('viper-blade', 'weapon', 26, { atk: 2 }, 'venom', { shop: 'mara' }),
  FAM('serrated-cutlass', 'weapon', 30, { atk: 2 }, 'serrated', { shop: 'mara' }),
  FAM('ember-sword', 'weapon', 30, { atk: 2 }, 'ember', { shop: 'master' }),
  FAM('mirror-blade', 'weapon', 30, { atk: 2 }, 'glare', { shop: 'master' }),
  FAM('hex-falchion', 'weapon', 30, { atk: 2 }, 'hex', { shop: 'master' }),
  FAM('torpor-rapier', 'weapon', 30, { atk: 2 }, 'numb', { shop: 'master' }),
  // the plain blade is the cheap one (the families' blades, a state for the same Attack less two, beat it at the bracket and the final: measured, journal Passe GP5-1)
  { id: 'imported-blade', slot: 'weapon', price: 24, fx: { atk: 4 } },
  // the sabre: three light cuts that fill the gauge less, the last through the guard; with the blade's Attack minus one it had no role at its price
  { id: 'duelist-sabre', slot: 'weapon', price: 50, fx: { atk: 5, viv: 2 } },
  // ------------------------------------------------------------------------------------------------------ the armours: the three existing ones take the families, the hauberk loses the mail's
  { id: 'padded-jack', slot: 'armour', price: 14, fx: { def: 2 }, resist: { burn: 0.5 } },
  { id: 'dock-leathers', slot: 'armour', price: 30, fx: { def: 3, end: 2 }, resist: { poison: 0.5 } },
  { id: 'mail-shirt', slot: 'armour', price: 40, fx: { def: 6, viv: -1 }, resist: { bleed: 0.5 } },
  { id: 'knight-hauberk', slot: 'armour', price: 60, fx: { def: 7, viv: -1 }, resist: { bleed: 0.5 } },
  { id: 'hostler-leathers', slot: 'armour', price: 18, fx: { def: 2, end: 1 } },
  // ------------------------------------------------------------------------------------------------------ the accessories: the four charms keep a state off, the ring and the cheap ones re-measured
  { id: 'bezoar-stone', slot: 'accessory', price: 16, fx: { end: 2 }, resist: { poison: 1 }, shop: 'trinkets' },
  { id: 'salamander-charm', slot: 'accessory', price: 18, fx: { def: 2, hp: 18 }, resist: { burn: 1 }, shop: 'trinkets' },
  { id: 'wayfarer-hood', slot: 'accessory', price: 18, fx: { viv: 2 }, resist: { blind: 1 }, shop: 'armourer' },
  { id: 'field-tourniquet', slot: 'accessory', price: 18, fx: { hp: 36 }, resist: { bleed: 1 }, shop: 'mara' },
  { id: 'iron-ring', slot: 'accessory', price: 32, fx: { end: 3 }, gfx: { stun: 0.75 } },
  { id: 'river-pearl', slot: 'accessory', price: 30, fx: { end: 3, hp: 20 } },
  { id: 'swift-boots', slot: 'accessory', price: 24, fx: { viv: 2 } },
  { id: 'mender-gloves', slot: 'accessory', price: 22, fx: { def: 1, end: 2 } },
  { id: 'docker-wrap', slot: 'accessory', price: 12, fx: { hp: 36 } },
  { id: 'pilgrim-medal', slot: 'accessory', price: 14, fx: { hp: 32, effect: 1.15 } },
  { id: 'sergeant-gorget', slot: 'accessory', price: 14, fx: { def: 2, hp: 12 } },
  { id: 'courier-boots', slot: 'accessory', price: 12, fx: { viv: 1 } },
  { id: 'minstrel-charm', slot: 'accessory', price: 12, fx: { hp: 24, effect: 1.15 } },
  { id: 'fervour-charm', slot: 'accessory', price: 12, fx: { effect: 1.6 } },
  { id: 'lucky-ribbon', slot: 'accessory', price: 10, fx: { hp: 24, ap: 1 }, gfx: { cd: 0.8 } },
  // ------------------------------------------------------------------------------------------------------ the end of the tournament: one piece a shop, from day 6, dear
  { id: 'caravan-greatblade', slot: 'weapon', price: 90, fx: { atk: 10 }, gfx: { gauge: 1.1, lightCharge: 1.15 }, shape: { hits: [0.8, 0.8], gap: 0.34 }, shop: 'mara', from: 6 },
  { id: 'tournament-plate', slot: 'armour', price: 100, fx: { def: 8, viv: -1 }, gfx: { lightTaken: 0.7, dodge: 0.4 }, resist: { bleed: 0.5 }, shop: 'armourer', from: 6 },
  { id: 'masters-sash', slot: 'accessory', price: 85, fx: { viv: 3, hp: 36 }, gfx: { firstFast: true, cd: 0.9 }, shop: 'master', from: 6 },
  { id: 'champion-laurel', slot: 'accessory', price: 80, fx: { hp: 60, end: 2, effect: 1.25 }, gfx: { stun: 0.85 }, shop: 'trinkets', from: 6 },
];
