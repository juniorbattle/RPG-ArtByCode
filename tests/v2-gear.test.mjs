// The equipment and the shops of the version 2 (lot V3, C5; the operator's decision AV-12 with its note « arme + armure + 2 accessoires »,
// journal Passe V3): one weapon upgradable by tiers, one armour, two accessories, each changing a real number of the duel; a shop per
// district with its specialty; prices by district, reputation, goodwill, the steel shortage and the hour; today's items in the system.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';

const G = await load('/src/simulation/index.ts');
const GE = await load('/src/simulation/gear.ts');
const VG = await load('/src/simulation/v2gear.ts');
const M = await load('/src/combat/match.ts');
const V = await load('/src/combat/v2duel.ts');

const v2 = (name = 'day1-morning') => G.makeV2(G.namedState(name));
const act = (st, a) => { const r = G.advance(st, a); assert.ok(r.ok, `${a.type}: ${r.reason}`); return r.state; };
const refused = (st, a, re) => { const r = G.advance(st, a); assert.equal(r.ok, false, a.type); if (re) assert.match(r.reason, re); };

test('the gear: one weapon, one armour, two accessories; every piece sold somewhere changes a number; a shop per district, each its specialty', () => {
  const st = v2();
  assert.deepEqual(st.v2.gear, { weapon: 'training-sword', tier: 0, armour: null, acc: [null, null], bag: [] });
  const slots = new Set(Object.values(GE.GEAR).map((g) => g.slot));
  for (const s of ['weapon', 'armour', 'accessory', 'consumable']) assert.ok(slots.has(s), s);
  for (const g of Object.values(GE.GEAR)) if (g.id !== 'training-sword' && g.id !== 'salve') assert.ok(Object.keys(g.fx).length >= 1, `${g.id} changes something`);
  const places = new Set(Object.values(GE.SHOPS).map((s) => s.place)), specialties = new Set(Object.values(GE.SHOPS).map((s) => s.specialty));
  // a shop in each of the version 2's districts (lot V5: the weapon master at the training ground, the trinkets on the festival square)
  assert.deepEqual([...places].sort(), ['district', 'forecourt', 'lanterns', 'training'], 'a shop per district');
  assert.equal(specialties.size, Object.keys(GE.SHOPS).length, 'each its specialty');
  for (const shop of Object.keys(GE.SHOPS)) assert.ok(Object.values(GE.GEAR).some((g) => g.shop === shop), `${shop} sells something`);
  // today's items in the system: the whetstone and the salve consumables, the imported blade a weapon
  assert.equal(GE.GEAR.whetstone.slot, 'consumable'); assert.equal(GE.GEAR.salve.slot, 'consumable'); assert.equal(GE.GEAR['imported-blade'].slot, 'weapon');
});

test('prices follow the district, the reputation (up to 15 % off), the keeper\'s goodwill (a tenth), the steel shortage (blades and armour) and the night (a fifth)', () => {
  const st = v2();
  // oracle: the rule written out
  const price = (s, shop, item) => Math.max(1, Math.round(GE.GEAR[item].price * GE.SHOPS[shop].factor * (1 - Math.min(0.15, s.player.reputation / 400))
    * ((s.town[GE.SHOPS[shop].keeper] ?? 0) >= 15 ? 0.9 : 1) * (['weapon', 'armour'].includes(GE.GEAR[item].slot) ? s.services.shopFactor : 1) * (s.slot === 'evening' ? 1.2 : 1)));
  for (const rep of [0, 10, 40, 60, 100]) for (const rel of [0, 15]) for (const steel of [1, 1.4]) for (const slot of ['morning', 'evening']) {
    const s = structuredClone(st); s.player.reputation = rep; s.town.hilde = rel; s.town.mara = rel; s.services.shopFactor = steel; s.slot = slot;
    for (const [shop, item] of [['armourer', 'mail-shirt'], ['mara', 'imported-blade'], ['trinkets', 'lucky-ribbon'], ['mara', 'whetstone']]) assert.equal(VG.shopPrice(s, shop, item), price(s, shop, item), `${shop} ${item} rep ${rep} rel ${rel} steel ${steel} ${slot}`);
  }
  assert.ok(VG.shopPrice(st, 'armourer', 'padded-jack') > GE.GEAR['padded-jack'].price, 'dearer near the Colosseum');
});

test('buying: at the shop\'s district and hours, worn at once when the place is free, else in the bag; equipping from the bag swaps', () => {
  let st = v2(); st.player.coins = 300;
  refused(st, { type: 'shopBuy', shop: 'armourer', item: 'mail-shirt' }, /another district/);
  st = act(st, { type: 'shopBuy', shop: 'mara', item: 'imported-blade' });
  assert.equal(st.v2.gear.weapon, 'imported-blade'); assert.deepEqual(st.v2.gear.bag, ['training-sword']);
  refused(st, { type: 'shopBuy', shop: 'mara', item: 'imported-blade' }, /own it/);
  st = act(st, { type: 'shopBuy', shop: 'mara', item: 'docker-wrap' });
  assert.deepEqual(st.v2.gear.acc, ['docker-wrap', null]);
  st = act(st, { type: 'move', to: 'forecourt' });
  st = act(st, { type: 'shopBuy', shop: 'armourer', item: 'padded-jack' });
  st = act(st, { type: 'shopBuy', shop: 'armourer', item: 'mail-shirt' });
  assert.equal(st.v2.gear.armour, 'mail-shirt'); assert.ok(st.v2.gear.bag.includes('padded-jack'));
  st = act(st, { type: 'shopBuy', shop: 'armourer', item: 'iron-ring' });
  refused(st, { type: 'shopBuy', shop: 'master', item: 'swift-boots' }, /another district/);
  st = act(st, { type: 'move', to: 'training' });
  st = act(st, { type: 'shopBuy', shop: 'master', item: 'swift-boots' });
  assert.deepEqual(st.v2.gear.acc, ['docker-wrap', 'iron-ring']); assert.ok(st.v2.gear.bag.includes('swift-boots'), 'two accessories at most');
  st = act(st, { type: 'equip', item: 'swift-boots', slot: 0 });
  assert.deepEqual(st.v2.gear.acc, ['swift-boots', 'iron-ring']); assert.ok(st.v2.gear.bag.includes('docker-wrap'));
  refused(st, { type: 'equip', item: 'lucky-ribbon' }, /not in your bag/);
  // the trinket seller at dusk only, Mara by day only
  const night = v2('lanterns-night'); night.player.coins = 99;
  assert.ok(G.actions(night).some((o) => o.action.type === 'shopBuy' && o.action.shop === 'trinkets' && o.ok));
  const dusk = v2('day1-evening'); dusk.player.coins = 99; refused(dusk, { type: 'shopBuy', shop: 'mara', item: 'whetstone' }, /shut/);
  // the default game keeps Mara's stall of today; a version 2 game buys through the gear system only
  assert.ok(G.actions(G.namedState('day1-morning')).some((o) => o.action.type === 'buy'));
  assert.ok(!G.actions(v2()).some((o) => o.action.type === 'buy'));
  assert.ok(!G.actions(G.namedState('day1-morning')).some((o) => o.action.type === 'shopBuy' || o.action.type === 'upgradeWeapon'));
});

test('the weapon\'s tiers: Bram raises it by day at the forge (a slot, 10 / 25 / 40 coins), the Wyrmsteel temper is a tier, at most three', () => {
  let st = v2(); st.player.coins = 200;
  const o = G.actions(st).find((x) => x.action.type === 'upgradeWeapon');
  assert.ok(o.ok && o.coins === 10 && o.cost === 1);
  st = act(st, { type: 'upgradeWeapon' });
  assert.equal(st.v2.gear.tier, 1); assert.equal(st.player.coins, 190);
  assert.equal(G.actions({ ...st, slot: 'morning' }).find((x) => x.action.type === 'upgradeWeapon').coins, 25, 'the second tier: 25 coins');
  st.player.items.push('tempered-blade');
  assert.equal(VG.weaponTier(st), 2);
  st.slot = 'morning'; st = act(st, { type: 'upgradeWeapon' });
  assert.equal(VG.weaponTier(st), 3); assert.equal(st.player.coins, 190 - 40);
  st.slot = 'morning'; refused(st, { type: 'upgradeWeapon' }, /as fine/);
  const burnt = v2(); burnt.services.forge = 'sabotaged'; burnt.player.coins = 99; refused(burnt, { type: 'upgradeWeapon' }, /cold/);
});

test('what the gear changes in a duel: damage by the weapon and its tier, the damage taken, the AP at the start, the gauge, the charge, the effects', () => {
  const st = G.makeV2(G.namedState('day2-afternoon'));
  st.v2.gear = { weapon: 'duelist-sabre', tier: 2, armour: 'mail-shirt', acc: ['lucky-ribbon', 'fervour-charm'], bag: [] };
  const m = VG.v2Mods(st);
  assert.equal(m.damage, +(1.12 * 1.16).toFixed(4));
  assert.equal(m.taken, 0.88); assert.equal(m.ap, 1); assert.equal(m.charge, +(0.92 * 1.05).toFixed(4)); assert.equal(m.effect, 1.3);
  const sh = M.matchSheetFor(st), plain = M.v2SheetData(sh, undefined, G.v2KitOf(st)), geared = M.v2SheetData(sh, undefined, G.v2KitOf(st), m);
  assert.equal(geared.data.actions.light.damage, Math.round(10 * m.damage), 'the light attack: 10 at today\'s numbers');
  assert.ok(Math.abs(geared.data.actions.m_slash.damage - plain.data.actions.m_slash.damage * 0.88) <= 1, 'the opponent\'s blows, 12 % less');
  assert.equal(geared.data.ap.start, plain.data.ap.start + 1);
  assert.equal(geared.tiers[1].at, +(2 * m.charge).toFixed(3));
  assert.equal(geared.data.actions.d1.ward.dur, +(plain.data.actions.d1.ward.dur * 1.3).toFixed(2));
  const ring = structuredClone(st); ring.v2.gear.acc = ['iron-ring', null];
  assert.equal(M.v2SheetData(sh, undefined, G.v2KitOf(ring), VG.v2Mods(ring)).data.actions.m_heavy.resist, +(plain.data.actions.m_heavy.resist * 0.85).toFixed(2));
  // no gear, no change: the plain sheet is the version 2 duel of lot V1
  assert.equal(JSON.stringify(M.v2SheetData(sh, undefined, G.v2KitOf(st)).data), JSON.stringify(V.v2DuelData(sh.sides[1].fighters[0].profile, { seed: sh.seed, playerName: sh.sides[0].fighters[0].name, opponentName: sh.sides[1].fighters[0].name, player: sh.sides[0].fighters[0].mods, enemy: sh.sides[1].fighters[0].mods }).data));
});
