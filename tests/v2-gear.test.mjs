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

test('GP-20: the Wyrmsteel temper costs the tier it gives, so the weapon\'s three tiers cost the same whatever the order; refused at the top tier, where it gives nothing; today\'s game keeps its 10 coins', () => {
  const quest = () => { const s = v2(); s.quests.cargo = 'delivered'; s.player.coins = 300; return s; };
  const coins = (s, type) => G.actions(s).find((x) => x.action.type === type);
  const again = (s) => { s.slot = 'morning'; return s; };
  // the temper first: 10, then the forge's 25 and 40
  let a = quest(); assert.equal(coins(a, 'temper').coins, GE.TIER_PRICE[0]);
  a = again(act(a, { type: 'temper' })); a = again(act(a, { type: 'upgradeWeapon' })); a = again(act(a, { type: 'upgradeWeapon' }));
  // the forge first, then the temper: it gives the third tier, at the third tier's price (45 before: the order changed the price)
  let b = quest(); b = again(act(b, { type: 'upgradeWeapon' })); b = again(act(b, { type: 'upgradeWeapon' }));
  const t = coins(b, 'temper'); assert.ok(t.ok); assert.equal(t.coins, GE.TIER_PRICE[2]); assert.match(t.label, new RegExp(`\\(${GE.TIER_PRICE[2]} coins: Attack \\+${GE.WEAPON_TIER_ATK}\\)$`));
  b = again(act(b, { type: 'temper' }));
  assert.deepEqual([VG.weaponTier(a), VG.weaponTier(b)], [GE.MAX_WEAPON_TIER, GE.MAX_WEAPON_TIER]);
  assert.equal(300 - a.player.coins, GE.TIER_PRICE.reduce((x, y) => x + y, 0)); assert.equal(a.player.coins, b.player.coins, 'the same price, either order');
  // the three tiers paid at the forge: the temper refused, with its reason (it was sold, for nothing)
  let c = quest(); for (let i = 0; i < GE.MAX_WEAPON_TIER; i++) c = again(act(c, { type: 'upgradeWeapon' }));
  refused(c, { type: 'temper' }, /as fine as Bram can make it/); assert.equal(coins(c, 'temper').coins, 0);
  // too poor for the tier it gives: Bram says his price
  const poor = quest(); poor.player.coins = 5; refused(poor, { type: 'temper' }, /^Bram wants 10 coins\.$/);
  // today's game: its quest's temper at 10 coins, its words unchanged
  const d = G.namedState('day1-morning'); d.quests.cargo = 'delivered'; d.player.coins = 50;
  const dt = coins(d, 'temper'); assert.equal(dt.coins, 10); assert.equal(dt.label, 'Have Bram temper your blade in the Wyrmsteel (10 coins: +15 % damage)');
});

test('GP-20: « two at once » never takes a weapon in hand: the pair\'s sabre goes to the bag, the forge\'s tiers kept; a plain purchase still wields it, the page saying what it loses', async () => {
  const W = await load('/src/simulation/preview.ts');
  const st = v2(); st.place = 'training'; st.slot = 'morning'; st.player.coins = 300; st.v2.gear.tier = 2;
  const win = { next: () => 0, fork() { return this; } };
  const r = G.advance(st, { type: 'bargain', shop: 'master', item: 'swift-boots', arg: 'pair' }, win);
  assert.ok(r.ok, r.reason); assert.ok(r.events.some((e) => e.id === 'bargain:won'));
  const g = r.state.v2.gear;
  assert.deepEqual([g.weapon, g.tier], ['training-sword', 2], 'the weapon in hand and its tiers kept');
  assert.ok(g.bag.includes('duelist-sabre') && g.acc.includes('swift-boots'), 'the sabre in the bag, the boots worn');
  // a single bargain for a weapon: to the bag as well
  const one = structuredClone(st); one.place = 'district';
  const r1 = G.advance(one, { type: 'bargain', shop: 'mara', item: 'imported-blade', arg: 'name' }, win);
  assert.ok(r1.ok, r1.reason); assert.deepEqual([r1.state.v2.gear.weapon, r1.state.v2.gear.tier, r1.state.v2.gear.bag], ['training-sword', 2, ['imported-blade']]);
  // the negative control: bought plainly, the sabre is taken in hand and the tiers go, as the goods page warns (Preview.tierLost)
  const p = W.preview(st, { type: 'shopBuy', shop: 'master', item: 'duelist-sabre' });
  assert.deepEqual([p.slot, p.replaces, p.tierLost], ['weapon', 'training-sword', 2]);
  const bought = act(st, { type: 'shopBuy', shop: 'master', item: 'duelist-sabre' });
  assert.deepEqual([bought.v2.gear.weapon, bought.v2.gear.tier], ['duelist-sabre', 0]);
  // worn from the bag, the warning is the page's too
  const e = W.preview(r.state, { type: 'equip', item: 'duelist-sabre' });
  assert.deepEqual([e.slot, e.replaces, e.tierLost], ['weapon', 'training-sword', 2]);
  // armour and accessories as before: a free place takes the piece
  const armour = v2(); armour.place = 'forecourt'; armour.slot = 'morning'; armour.player.coins = 300;
  const ra = G.advance(armour, { type: 'bargain', shop: 'armourer', item: 'padded-jack', arg: 'pair' }, win);
  assert.ok(ra.ok, ra.reason); assert.ok(ra.state.v2.gear.armour !== null, 'an armour worn');
});

test('what the gear changes in a duel (the operator\'s DB7-2 « Des points, le reste gardé », journal Passe DB8): stat points, the AP at the start and the effects as before', () => {
  const st = G.makeV2(G.namedState('day2-afternoon'));
  const bare = structuredClone(st); bare.v2.gear = { weapon: 'training-sword', tier: 0, armour: null, acc: [null, null], bag: [] };
  st.v2.gear = { weapon: 'duelist-sabre', tier: 2, armour: 'mail-shirt', acc: ['lucky-ribbon', 'fervour-charm'], bag: [] };
  const m = VG.v2Mods(st), x = m.stats, x0 = VG.v2Stats(bare);
  // the sabre +3 Attack and +2 Speed, two tiers +4 Attack, the mail +6 Defence and -1 Speed (each point doubled since lot 2 of the duel played by the computer, the
  // operator's AC-11 « Doubler les points de l’équipement (décision A3 : change DB7-2) », journal Passes AC4 / LC3); the ribbon one AP, the charm the effects x 1.3
  assert.deepEqual([x.atk - x0.atk, x.def - x0.def, x.end - x0.end, x.viv - x0.viv, x.hp - x0.hp], [7, 6, 0, 1, 0]);
  assert.equal(m.damage, 1); assert.equal(m.taken, 1); assert.equal(m.ap, 1); assert.equal(m.charge, 1); assert.equal(m.gauge, 1); assert.equal(m.effect, 1.3);
  const sh = M.matchSheetFor(st), F = M.foeSheetOf(sh.sides[1].fighters[0], sh.stage), plain = M.v2SheetData(sh, undefined, G.v2KitOf(bare), VG.v2Mods(bare)), geared = M.v2SheetData(sh, undefined, G.v2KitOf(st), m);
  const k = (a, d) => (2 * a) / (a + d);
  assert.equal(geared.data.actions.light.damage, Math.round(6 * k(x.atk, F.def)), 'the light attack: 6 by the formula');
  assert.ok(Math.abs(geared.data.actions.m_slash.damage - plain.data.actions.m_slash.damage * k(F.atk, x.def) / k(F.atk, x0.def)) <= 1, 'the opponent\'s blows, by Ren\'s Defence');
  assert.equal(geared.data.ap.start, plain.data.ap.start + 1);
  // the charge times by the Speed: Rampart's 3 s (3.5 x 0.85, journal Passe CH1) x 10 / Speed
  assert.equal(geared.tiers.find((t) => t.id === 'd1').at, +(3 * 10 / x.viv).toFixed(3));
  assert.equal(geared.data.actions.d1.ward.dur, +(plain.data.actions.d1.ward.dur * 1.3).toFixed(2));
  // the iron ring: Endurance +4 (+2 before AC-11), what the opponent's blows add to Ren's gauge x 10 / Endurance
  const ring = structuredClone(bare); ring.v2.gear.acc = ['iron-ring', null];
  const r = VG.v2Stats(ring);
  assert.equal(r.end, x0.end + 4);
  assert.ok(Math.abs(M.v2SheetData(sh, undefined, G.v2KitOf(ring), VG.v2Mods(ring)).data.actions.m_heavy.resist - plain.data.actions.m_heavy.resist * x0.end / r.end) <= 0.011);
  // no gear, no change: the plain sheet is the version 2 duel of lot V1
  assert.equal(JSON.stringify(M.v2SheetData(sh, undefined, G.v2KitOf(st)).data), JSON.stringify(V.v2DuelData(sh.sides[1].fighters[0].profile, { seed: sh.seed, playerName: sh.sides[0].fighters[0].name, opponentName: sh.sides[1].fighters[0].name, player: sh.sides[0].fighters[0].mods, enemy: sh.sides[1].fighters[0].mods }).data));
});
