import { clamp, type GameState, type V2Gear } from './state';
import type { ActionDef } from './actions';
import { isV2 } from './v2';
import { GEAR, MAX_WEAPON_TIER, SHOPS, TIER_PRICE, WEAPON_TIER_ATK, soldAt, stagePrice, type GearFx, type GearSlot, type ShopId } from './gear';
import { REN_BASE, STAT_CARDS, TRAINED_STATS, VIGOUR_HP, trainGain, type FighterStats, type TrainedStat } from '../combat/stats';
import { cardStat } from './v2cards';
import { AUTO_GEAR_FX, AUTO_PIECE_VIV } from '../combat/autoData';
import { AUTO_RULES, type AutoGearFx, type AutoStateId } from '../combat/auto';
import { itemText, tx, type TextKey } from '../narrative/text';
import { allyAp } from '../narrative/v2story';
import type { Mods } from '../combat/profiles';
import { wanted } from './v2law';
import { PEOPLE } from '../narrative/people';
import { draughtHp, QUEST } from './v2questData';

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

/** the tiers the forge has given the weapon (Bram's, bought: TIER_PRICE), at most MAX_WEAPON_TIER */
export const forgeTier = (s: GameState): number => Math.min(MAX_WEAPON_TIER, gearView(s).tier);
/** the weapon's tier: the forge's. The Wyrmsteel temper of the steel cargo is no tier any more but an Attack on top of them that the forge does not sell (the
 *  operator's GP-09 « Quatre quêtes de ville et une page « En cours » », the cargo « réécrite pour donner ce que la forge ne vend pas », journal Passe GP2;
 *  before it the temper was the forge's first tier, MAX_WEAPON_TIER in all): `wyrmTier` */
export function weaponTier(s: GameState): number {
  return forgeTier(s);
}
/** the Wyrmsteel's Attack is worn once Bram tempered the blade: at once, on top of the forge's tiers, even the last (Q-02 « Attaque +1, en plus des paliers, tout de
 *  suite », journal Passe QE2) */
export const wyrmTier = (s: GameState): boolean => s.player.items.includes('tempered-blade');

/** every effect the player wears (the weapon and its tiers, the armour, both accessories): the stat points added, the AP added, the effect multiplied */
export function wornFx(s: GameState): Required<GearFx> {
  const g = gearView(s), fx: Required<GearFx> = { atk: 0, def: 0, end: 0, viv: 0, hp: 0, ap: 0, effect: 1 };
  for (const id of [g.weapon, g.armour, ...g.acc]) {
    const d = id ? GEAR[id] : undefined;
    if (!d) continue;
    for (const [k, v] of Object.entries(d.fx) as Array<[keyof GearFx, number]>) { if (k === 'effect') fx.effect *= v; else fx[k] += v; }
  }
  fx.atk += WEAPON_TIER_ATK * forgeTier(s) + (wyrmTier(s) ? QUEST.wyrmAtk : 0);
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
  st.hp += VIGOUR_HP * (s.v2?.wins ?? 0) + fx.hp + draughtHp(s);
  st.atk += fx.atk + (s.player.items.includes('whetstone') ? GEAR.whetstone.fx.atk ?? 0 : 0);
  st.def += fx.def; st.end += fx.end; st.viv += fx.viv;
  for (const k of trainedStats(s)) st[k] += trainGain(k);
  // the winner's cards' lasting points (the operator's CL-2, src/simulation/v2cards.ts)
  for (const k of STAT_CARDS) st[k] += cardStat(s, k);
  for (const k of Object.keys(st) as Array<keyof FighterStats>) st[k] = +st[k].toFixed(2);
  return st;
}

/** where Ren's health in his next bout comes from (the operator's DB11-5 « Le dire partout », journal Passe DB13: the match sheet says it): his start, his
 *  vigour (VIGOUR_HP a bout won), his gear, his training sessions given to health, and what a wound takes; `total` is the bout's health (v2Stats × v2Mods) */
/** `draught`: Sister Anwen's draught waiting for the next bout or challenge (the town's quests, Q-03 « Ainsi : +45 de santé, une fois », journal Passe QE2) */
export function healthParts(s: GameState): { base: number; vigour: number; gear: number; train: number; draught: number; wound: number; total: number } {
  const st = v2Stats(s), share = 1 - INJURY_HP * s.player.injury, total = Math.max(1, Math.round(st.hp * share));
  return {
    base: REN_BASE.hp, vigour: VIGOUR_HP * (s.v2?.wins ?? 0), gear: wornFx(s).hp,
    train: trainedStats(s).filter((k) => k === 'hp').length * trainGain('hp'), draught: draughtHp(s), wound: Math.round(st.hp) - total, total,
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

/** House Dree's order and the parade's rush, the two shortages of the operator's EQ-8 « Ces deux pénuries » (journal Passe GP5-2), each told by an event of the version 2's
 *  catalogue (src/events/v2catalog.ts): House Dree buys armour by the cartload while Cassius is hostile, from the night of day 2 to 4 until day 5 (Hilde's armours +30 %);
 *  the whole Cité wants a lantern on the eve of the parade, day 9 (Pip's accessories +50 %); the steel's (today's `shopFactor`) stays as it was */
export const SHORTAGE = { dree: 1.3, rush: 1.5 } as const;
export const dreeOrder = (s: GameState): boolean => isV2(s) && s.flags['ev:v2-dree-order'] !== undefined && s.day >= 3 && s.day <= 5;
export const paradeRush = (s: GameState): boolean => isV2(s) && s.flags['ev:v2-parade-rush'] !== undefined && s.day === 9;
/** what raises a piece's price now besides the stage and the hour: the steel on every shop's blades and armour, House Dree's order on Hilde's armours, the parade's rush on
 *  Pip's accessories; the factor and the cause (the first's words) said in the news, by the keeper and in the purchase's log */
export function shortageOf(s: GameState, shop: ShopId, slot: GearSlot): { k: number; cause: string } | null {
  const out: Array<{ k: number; cause: string }> = [];
  if (s.services.shopFactor > 1 && (slot === 'weapon' || slot === 'armour')) out.push({ k: s.services.shopFactor, cause: s.services.shopCause });
  if (shop === 'armourer' && slot === 'armour' && dreeOrder(s)) out.push({ k: SHORTAGE.dree, cause: "House Dree's order" });
  if (shop === 'trinkets' && slot === 'accessory' && paradeRush(s)) out.push({ k: SHORTAGE.rush, cause: "the parade's rush" });
  return out.length ? { k: out.reduce((n, o) => n * o.k, 1), cause: out[0].cause } : null;
}

/** a shop's price for an item now (« proposé »): its list price × the district's factor × the player's name (up to 15 % off at reputation 60)
 *  × the keeper's goodwill (a tenth off at 15) × the shortages (the steel, House Dree's order, the parade's rush: `shortageOf`) × the stage of the tournament (the
 *  operator's EQ-7 « Deux paliers : ×1,15 au tableau, ×1,3 dès le jour 9 », journal Passe GP5-2: the pieces of the shops, not the consumables nor the pieces of the end,
 *  whose price is fixed, EQ-5) × the hour (a fifth more at night) × the keeper's markup the days after a theft caught (lot V4); a bargain is struck at the moment of
 *  buying (lot L2a, v2barter.ts) */
export function shopPrice(s: GameState, shop: ShopId, item: string): number {
  const d = GEAR[item], sh = SHOPS[shop];
  if (!d) return 0;
  const short = shortageOf(s, shop, d.slot)?.k ?? 1, stage = d.slot === 'consumable' || d.from ? 1 : stagePrice(s.day);
  const rep = 1 - Math.min(0.15, s.player.reputation / 400), rel = (s.town[sh.keeper] ?? 0) >= 15 ? 0.9 : 1, night = s.slot === 'evening' ? 1.2 : 1;
  const day = s.v2?.shops?.[shop], markup = day?.markup && day.markup >= s.day ? 1.25 : 1;
  return Math.max(1, Math.round(d.price * sh.factor * rep * rel * short * stage * night * markup));
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

/** a weapon taken in hand: the old one to the bag; the forge's tiers stay with the hand (the operator's EQ-11 « Les paliers suivent la main », journal Passe GP5-2) */
function wield(g: V2Gear, item: string): void { g.bag.push(g.weapon); g.weapon = item; }

/** a place of the body (the weapon, the armour, an accessory's first or second place): what the gear page takes off and Mara buys worn (the operator's GP-19 « Déséquiper et vendre une
 *  pièce portée », journal Passe GP2) */
export type WornPlace = 'weapon' | 'armour' | 0 | 1;
/** the piece worn at a place, null when there is none (the training sword is the hand's own: not a piece one takes off) */
export function wornAt(s: GameState, place: WornPlace): string | null {
  const g = gearView(s), id = place === 'weapon' ? g.weapon : place === 'armour' ? g.armour : g.acc[place];
  return id && id !== 'training-sword' ? id : null;
}
/** the piece at a place taken off the body and handed back (the caller puts it in the bag or sells it): a weapon leaves the training sword in hand (the one the bag held, else
 *  a plain one); the forge's tiers stay with the hand (EQ-11) */
export function removeWorn(s: GameState, place: WornPlace): string {
  const g = gearOf(s), id = wornAt(s, place)!;
  if (place === 'weapon') { const i = g.bag.indexOf('training-sword'); if (i >= 0) g.bag.splice(i, 1); g.weapon = 'training-sword'; }
  else if (place === 'armour') g.armour = null;
  else g.acc[place] = null;
  return id;
}

/** a piece received (won by a bargain, the bargain's pair, bought from a passer-by) goes where it is worn, or into the bag: the salve heals at once, the whetstone
 *  waits for the next bout, an armour is worn (the old one to the bag), an accessory on a free place or the bag. A weapon never replaces the one in hand: it goes to
 *  the bag and is worn from the gear page (the operator's GP-20 « Les corriger », journal Passe GP2: « two at once » took the sabre in hand and wiped the tiers paid at
 *  Bram's; since EQ-11 the tiers stay with the hand whatever the swap, the plain purchase wields it, shopBuy) */
export function receive(s: GameState, item: string): void {
  const d = GEAR[item];
  if (item === 'salve') { s.player.injury = Math.max(0, s.player.injury - 1); return; }
  if (item === 'whetstone') { s.player.items.push('whetstone'); return; }
  const g = gearOf(s);
  if (d.slot === 'weapon') { if (g.weapon) g.bag.push(item); else g.weapon = item; }
  else if (d.slot === 'armour') { if (g.armour) g.bag.push(g.armour); g.armour = item; }
  else { const i = g.acc.indexOf(null); if (i >= 0) g.acc[i] = item; else g.bag.push(item); }
}

export const itemName = (id: string): string => itemText(id, 'name');
/** a piece's points in words (the gear's text; today's game reads it too) */
export const itemAbout = (id: string): string => itemText(id, 'about');

/** the words of a weapon's state and of a protection (keys written whole: tests/texts.test.mjs) */
const INFLICT_FX: Record<AutoStateId, TextKey> = { poison: 'gear.fx.inflict.poison', burn: 'gear.fx.inflict.burn', blind: 'gear.fx.inflict.blind', bleed: 'gear.fx.inflict.bleed', curse: 'gear.fx.inflict.curse', paralysis: 'gear.fx.inflict.paralysis' };
const RESIST_HALF: Partial<Record<AutoStateId, TextKey>> & Record<'poison' | 'burn' | 'blind' | 'bleed', TextKey> = { poison: 'gear.fx.resist.half.poison', burn: 'gear.fx.resist.half.burn', blind: 'gear.fx.resist.half.blind', bleed: 'gear.fx.resist.half.bleed' };
const RESIST_OFF: Partial<Record<AutoStateId, TextKey>> & Record<'poison' | 'burn' | 'blind' | 'bleed', TextKey> = { poison: 'gear.fx.resist.off.poison', burn: 'gear.fx.resist.off.burn', blind: 'gear.fx.resist.off.blind', bleed: 'gear.fx.resist.off.bleed' };

/** a version 2 piece's effects in a bout, in words, each number read from the duel's own tables (the operator's GP-20 « Les corriger », journal Passe GP2: the gear
 *  page showed the pieces' Speed whole, said « wards and boosts » where only the protections last longer, src/combat/autoData.ts autoSkill (a support's boost is its
 *  role's, the parry's window its own), and named none of AUTO_GEAR_FX): its Speed counted at AUTO_PIECE_VIV, its protections' length, its effects. Each value's
 *  words say its side of 1 (tests/v2-gear.test.mjs holds every value of the tables on the side its words say) */
export function pieceFx(id: string): string[] {
  const d = GEAR[id], e: AutoGearFx = AUTO_GEAR_FX[id] ?? {}, pct = (k: number): number => Math.round(Math.abs(1 - k) * 100), out: string[] = [];
  // a weapon's state and what a piece keeps off (the operator's EQ-2 and EQ-3, journal Passe GP5-2: the harmful states' families made pieces), their numbers the duel's own
  if (e.inflict) out.push(tx(INFLICT_FX[e.inflict.state], { pct: Math.round(e.inflict.chance * 100) }));
  if (d?.fx.viv) out.push(tx('gear.fx.viv', { pct: Math.round(AUTO_PIECE_VIV * 100) }));
  if (d?.fx.effect !== undefined && d.fx.effect !== 1) out.push(tx('gear.fx.effect', { pct: pct(d.fx.effect) }));
  if (e.lastPierce) out.push(tx('gear.fx.lastPierce'));
  if (e.gauge !== undefined) out.push(tx(e.gauge > 1 ? 'gear.fx.gaugeMore' : 'gear.fx.gaugeLess', { pct: pct(e.gauge) }));
  if (e.lightCharge !== undefined) out.push(tx('gear.fx.lightCharge', { pct: pct(e.lightCharge) }));
  if (e.guardGauge !== undefined) out.push(tx('gear.fx.guardGauge', { pct: Math.round(e.guardGauge * 100), base: Math.round(AUTO_RULES.gauge.guardMul * 100) }));
  if (e.lightTaken !== undefined) out.push(tx('gear.fx.lightTaken', { pct: pct(e.lightTaken) }));
  if (e.dodge !== undefined) out.push(tx(e.dodge > 1 ? 'gear.fx.dodgeMore' : 'gear.fx.dodgeLess', { pct: pct(e.dodge) }));
  if (e.guardChance !== undefined) out.push(tx('gear.fx.guardLess', { pct: pct(e.guardChance) }));
  if (e.stun !== undefined) out.push(tx('gear.fx.stun', { pct: pct(e.stun) }));
  if (e.cd !== undefined) out.push(tx('gear.fx.cd', { pct: pct(e.cd) }));
  if (e.firstFast) out.push(tx('gear.fx.firstFast'));
  for (const [st, k] of Object.entries(e.resist ?? {})) { const key = (k >= 1 ? RESIST_OFF : RESIST_HALF)[st as AutoStateId]; if (key) out.push(tx(key)); }
  return out;
}
/** a version 2 piece's words: its points, then its effects in a bout (the shop's label, the goods page) */
export function pieceWords(id: string): string {
  const points = itemAbout(id), fx = pieceFx(id).join(', ');
  return points && fx ? tx('gear.words', { points, fx }) : points || fx;
}
/** after « your »: without its article */
const heldName = (id: string): string => itemName(id).replace(/^an? /, '');

export type V2GearAction =
  | { type: 'shopBuy'; shop: ShopId; item: string }
  | { type: 'equip'; item: string; slot?: 0 | 1 }
  | { type: 'unequip'; slot: WornPlace }
  | { type: 'upgradeWeapon' };

const has = (s: GameState, id: string) => { const g = gearView(s); return g.weapon === id || g.armour === id || g.acc.includes(id) || g.bag.includes(id); };

export const V2_GEAR_ACTIONS: { [K in V2GearAction['type']]: ActionDef<Extract<V2GearAction, { type: K }>> & { by: string | ((a: Extract<V2GearAction, { type: K }>) => string) | null } } = {
  shopBuy: {
    by: (a) => SHOPS[a.shop].keeper,
    list: (s) => (!isV2(s) ? [] : (Object.keys(SHOPS) as ShopId[]).filter((k) => SHOPS[k].place === s.place).flatMap((shop) => Object.values(GEAR).filter((g) => soldAt(g, shop, s.day)).map((g) => ({ type: 'shopBuy' as const, shop, item: g.id })))),
    label: (s, a) => tx('v2.shop.label', { item: itemName(a.item), price: shopPrice(s, a.shop, a.item), about: pieceWords(a.item) }),
    cost: () => 0,
    coins: (s, a) => shopPrice(s, a.shop, a.item),
    check: (s, a) => {
      if (!isV2(s)) return tx('v2.only');
      const d = GEAR[a.item];
      if (!d || !soldAt(d, a.shop, s.day)) return tx('v2.shop.notSold');
      const o = shopOpen(s, a.shop); if (o) return o;
      if (d.slot !== 'consumable' && has(s, a.item)) return tx('v2.shop.owned');
      if (a.item === 'whetstone' && s.player.items.includes('whetstone')) return tx('buy.haveStone');
      if (a.item === 'salve' && s.player.injury === 0) return tx('buy.notHurt');
      return s.player.coins < shopPrice(s, a.shop, a.item) ? tx('buy.poor') : null;
    },
    apply: (s, a, _r, emit) => {
      const p = shopPrice(s, a.shop, a.item), d = GEAR[a.item], keeper = SHOPS[a.shop].keeper;
      s.player.coins -= p; s.town[keeper] = clamp((s.town[keeper] ?? 0) + 3, -100, 100);
      // what is bought is worn at once when its place is free (or better than nothing), else kept in the bag; a weapon bought is taken in hand, as before (the goods
      // page says what the swap loses, the forge's tiers: Preview.tierLost)
      if (d.slot === 'weapon') wield(gearOf(s), a.item); else receive(s, a.item);
      emit({ kind: 'action', id: `shop:${a.item}`, cause: shortageOf(s, a.shop, d.slot) ? tx('buy.causePrices', { cause: shortageOf(s, a.shop, d.slot)!.cause }) : 'action:shopBuy', visible: true, text: tx('v2.shop.log', { item: itemName(a.item), price: p }) });
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
      if (d.slot === 'weapon') wield(g, a.item);
      else if (d.slot === 'armour') { if (g.armour) g.bag.push(g.armour); g.armour = a.item; }
      else { const i = a.slot ?? (g.acc[0] === null ? 0 : g.acc[1] === null ? 1 : 0); const old = g.acc[i]; if (old) g.bag.push(old); g.acc[i] = a.item; }
      emit({ kind: 'action', id: 'equip', cause: 'action:equip', visible: false, text: tx('v2.equip.log', { item: itemName(a.item) }) });
    },
  },
  unequip: {
    by: null,
    // from the gear card (the interface), like equip: not listed among the place's actions; no slot, anywhere (the operator's GP-19)
    list: () => [],
    label: (s, a) => tx('v2.unequip.label', { item: itemName(wornAt(s, a.slot) ?? 'training-sword') }),
    cost: () => 0,
    check: (s, a) => (!isV2(s) ? tx('v2.only') : !wornAt(s, a.slot) ? tx('v2.unequip.nothing') : null),
    apply: (s, a, _r, emit) => {
      const item = removeWorn(s, a.slot);
      gearOf(s).bag.push(item);
      emit({ kind: 'action', id: 'unequip', cause: 'action:unequip', visible: false, text: tx('v2.unequip.log', { item: itemName(item) }) });
    },
  },
  upgradeWeapon: {
    by: 'bram',
    list: (s) => (isV2(s) && s.place === 'district' ? [{ type: 'upgradeWeapon' }] : []),
    // a tier's Attack as the gear's table gives it (journal Passe CO1: « +8 % damage » since DB7-2 made it a point, AC-11 two)
    label: (s) => tx('v2.upgrade.label', { item: heldName(gearView(s).weapon), tier: weaponTier(s) + 1, price: TIER_PRICE[Math.min(MAX_WEAPON_TIER - 1, forgeTier(s))], atk: WEAPON_TIER_ATK }),
    cost: () => 1,
    coins: (s) => (forgeTier(s) >= MAX_WEAPON_TIER ? 0 : TIER_PRICE[forgeTier(s)]),
    check: (s) => {
      if (!isV2(s)) return tx('v2.only');
      if (s.place !== 'district') return tx('v2.upgrade.notHere');
      if (s.services.forge === 'sabotaged') return tx('temper.cold');
      if (s.slot === 'evening') return tx('v2.upgrade.night');
      if (forgeTier(s) >= MAX_WEAPON_TIER) return tx('v2.upgrade.max');
      return s.player.coins < TIER_PRICE[forgeTier(s)] ? tx('v2.upgrade.poor', { price: TIER_PRICE[forgeTier(s)] }) : null;
    },
    apply: (s, _a, _r, emit) => {
      const p = TIER_PRICE[forgeTier(s)];
      s.player.coins -= p; gearOf(s).tier++; s.town.bram = clamp((s.town.bram ?? 0) + 5, -100, 100);
      emit({ kind: 'action', id: 'upgrade', cause: 'action:upgradeWeapon', visible: true, text: tx('v2.upgrade.log', { item: heldName(gearView(s).weapon), tier: weaponTier(s) }) });
    },
  },
};
