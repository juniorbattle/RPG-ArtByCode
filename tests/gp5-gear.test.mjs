// The gold and the gear of the general gameplay audit's chantier 5 (the operator's GP-17 « Des pièces de fin de tournoi et une avance sur la bourse », GP-18 « Revoir le
// catalogue » and GP-19 « Déséquiper et vendre une pièce portée », journal Passe GP2; his sheet https://claude.ai/artifact/Eg4nNbYLtAaCfngnEKZLGs, fourteen of fourteen at the
// recommendation, journal Passe GP5-2): the catalogue of thirty-two pieces (EQ-1 to EQ-4, EQ-9), the pieces of the end of the tournament (EQ-5), Clerk Odo's advance (EQ-6),
// the prices by stage (EQ-7), the two shortages (EQ-8), the forge's tiers that follow the hand (EQ-11), the laboratory's policies (EQ-12), the trial `states=` removed (EQ-13).
// The oracles are the decisions written out here, not the code's tables (the sale and the taking off of a worn piece, EQ-10: tests/v2-work.test.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { load } from './load.mjs';

const G = await load('/src/simulation/index.ts');
const GE = await load('/src/simulation/gear.ts');
const VG = await load('/src/simulation/v2gear.ts');
const AD = await load('/src/combat/autoData.ts');
const E = await load('/src/events/engine.ts');
const V = await load('/src/events/v2catalog.ts');
const D = await load('/src/narrative/dialogue.ts');
const POOL = await load('/src/tournament/pool.ts');
const LAB = await load('/src/tournament/lab.ts');
const { tx } = await load('/src/narrative/text/index.ts');
const { EN } = await load('/src/narrative/text/en.ts');
const { FR } = await load('/src/narrative/text/fr.ts');
const { Rng } = await load('/src/core/rng.ts');

const v2 = () => { const st = G.makeV2(G.namedState('day1-morning')); st.player.reputation = 0; return st; };
const at = (st, place, slot, day) => { const s = structuredClone(st); s.place = place; s.slot = slot; if (day) s.day = day; return s; };
const act = (st, a) => { const r = G.advance(st, a); assert.ok(r.ok, `${a.type}: ${r.reason}`); return r; };
const refused = (st, a) => { const r = G.advance(st, a); assert.equal(r.ok, false, JSON.stringify(a)); return r.reason; };
const opt = (st, a) => G.actions(st).find((o) => JSON.stringify(o.action) === JSON.stringify(a));
const byId = Object.fromEntries(V.V2_EVENTS.map((e) => [e.id, e]));
const run = (s, id) => { const out = []; E.runEvents(s, s.pulse, (e) => { out.push(e); return e; }, new Rng(1), [byId[id]]); return out; };
const WIN = { winner: 'player', playerHp: 100, playerMaxHp: 300, opponentHp: 0, opponentMaxHp: 300, finisher: null };
const LOSS = { winner: 'opponent', playerHp: 0, playerMaxHp: 300, opponentHp: 100, opponentMaxHp: 300, finisher: null };

// the catalogue as the sheet gives it: slot, list price, the shops (EQ-9: the second where there is one), the first day sold (EQ-5), the points
const SHEET = {
  // weapons: the imported blade at 24, the sabre at 50 with Attack 5 (EQ-4), the six of the harmful states at 26-30 (EQ-2: the blade less 2 Attack), the caravan's greatblade
  'imported-blade': ['weapon', 24, ['mara', 'master'], 0, { atk: 4 }], 'duelist-sabre': ['weapon', 50, ['master'], 0, { atk: 5, viv: 2 }],
  'viper-blade': ['weapon', 26, ['mara'], 0, { atk: 2 }], 'serrated-cutlass': ['weapon', 30, ['mara', 'master'], 0, { atk: 2 }], 'ember-sword': ['weapon', 30, ['master'], 0, { atk: 2 }],
  'mirror-blade': ['weapon', 30, ['master'], 0, { atk: 2 }], 'hex-falchion': ['weapon', 30, ['master'], 0, { atk: 2 }], 'torpor-rapier': ['weapon', 30, ['master'], 0, { atk: 2 }],
  'caravan-greatblade': ['weapon', 90, ['mara'], 6, { atk: 10 }],
  // armours (EQ-3: the families; EQ-4: the hauberk at 60)
  'padded-jack': ['armour', 14, ['armourer', 'mara'], 0, { def: 2 }], 'mail-shirt': ['armour', 40, ['armourer'], 0, { def: 6, viv: -1 }], 'dock-leathers': ['armour', 30, ['mara'], 0, { def: 3, end: 2 }],
  'knight-hauberk': ['armour', 60, [], 0, { def: 7, viv: -1 }], 'hostler-leathers': ['armour', 18, [], 0, { def: 2, end: 1 }], 'tournament-plate': ['armour', 100, ['armourer'], 6, { def: 8, viv: -1 }],
  // accessories (EQ-3: four charms; EQ-4: the retouches; EQ-5: the sash and the laurel)
  'lucky-ribbon': ['accessory', 10, ['trinkets'], 0, { hp: 24, ap: 1 }], 'iron-ring': ['accessory', 32, ['armourer', 'trinkets'], 0, { end: 3 }], 'swift-boots': ['accessory', 24, ['master'], 0, { viv: 2 }],
  'fervour-charm': ['accessory', 12, ['trinkets'], 0, { effect: 1.6 }], 'docker-wrap': ['accessory', 12, ['mara', 'trinkets'], 0, { hp: 36 }],
  'bezoar-stone': ['accessory', 16, ['trinkets'], 0, { end: 2 }], 'salamander-charm': ['accessory', 18, ['trinkets', 'armourer'], 0, { def: 2, hp: 18 }],
  'wayfarer-hood': ['accessory', 18, ['armourer', 'master'], 0, { viv: 2 }], 'field-tourniquet': ['accessory', 18, ['mara'], 0, { hp: 36 }],
  'river-pearl': ['accessory', 30, [], 0, { end: 3, hp: 20 }], 'mender-gloves': ['accessory', 22, [], 0, { def: 1, end: 2 }], 'courier-boots': ['accessory', 12, [], 0, { viv: 1 }],
  'minstrel-charm': ['accessory', 12, [], 0, { hp: 24, effect: 1.15 }], 'sergeant-gorget': ['accessory', 14, [], 0, { def: 2, hp: 12 }], 'pilgrim-medal': ['accessory', 14, [], 0, { hp: 32, effect: 1.15 }],
  'masters-sash': ['accessory', 85, ['master'], 6, { viv: 3, hp: 36 }], 'champion-laurel': ['accessory', 80, ['trinkets'], 6, { hp: 60, end: 2, effect: 1.25 }],
};
const END = ['caravan-greatblade', 'tournament-plate', 'masters-sash', 'champion-laurel'];
const PLACE = { mara: 'district', armourer: 'forecourt', master: 'training', trinkets: 'lanterns' };

test('EQ-1 to EQ-5, EQ-9: the catalogue of thirty-two pieces, each its slot, price, shops, first day and points, seven at two places', () => {
  const pieces = Object.values(GE.GEAR).filter((d) => d.slot !== 'consumable' && d.id !== 'training-sword');
  assert.equal(pieces.length, 32, 'thirty-two pieces');
  assert.deepEqual(pieces.map((d) => d.id).sort(), Object.keys(SHEET).sort());
  for (const [id, [slot, price, shops, from, fx]] of Object.entries(SHEET)) {
    const d = GE.GEAR[id];
    assert.deepEqual([d.slot, d.price, GE.shopsOf(d), d.from ?? 0, d.fx], [slot, price, shops, from, fx], id);
  }
  // seven pieces at two places (EQ-9 « Ces sept pièces »)
  assert.deepEqual(pieces.filter((d) => GE.shopsOf(d).length === 2).map((d) => d.id).sort(), ['docker-wrap', 'imported-blade', 'iron-ring', 'padded-jack', 'salamander-charm', 'serrated-cutlass', 'wayfarer-hood']);
  // the pieces of the end: one a shop, from day 6, dear (80 to 100), the dearest piece of their slot (EQ-5)
  assert.deepEqual(pieces.filter((d) => d.from).map((d) => d.id).sort(), [...END].sort());
  assert.deepEqual(END.map((id) => GE.GEAR[id].shop).sort(), ['armourer', 'master', 'mara', 'trinkets'].sort());
  for (const id of END) { const d = GE.GEAR[id]; assert.ok(d.price >= 80 && d.price <= 100 && d.from === 6, id); assert.ok(pieces.filter((x) => x.slot === d.slot && !END.includes(x.id)).every((x) => x.price < d.price), `${id}: dearer than the ordinary pieces of its slot`); }
  // every shop sells something, and a piece is sold at the shop's place only, by day and by its first day
  for (const shop of Object.keys(GE.SHOPS)) assert.ok(pieces.some((d) => GE.soldAt(d, shop, 10)), shop);
  assert.equal(GE.soldAt(GE.GEAR['tournament-plate'], 'armourer', 5), false); assert.equal(GE.soldAt(GE.GEAR['tournament-plate'], 'armourer', 6), true);
  assert.equal(GE.soldAt(GE.GEAR['tournament-plate'], 'mara', 10), false, 'only at its shop');
  // the families' weapons are the blade less two Attack (EQ-2); the blade is dearer in Attack only
  for (const id of ['viper-blade', 'serrated-cutlass', 'ember-sword', 'mirror-blade', 'hex-falchion', 'torpor-rapier']) assert.equal(GE.GEAR[id].fx.atk, GE.GEAR['imported-blade'].fx.atk - 2, id);
  // the gold and the gear of an older save: a piece that left no longer exists nowhere (the token), the rest by id
  assert.equal(GE.GEAR['champion-token'], undefined);
});

test('EQ-5 and EQ-9: the shops list what they sell today; the pieces of the end only from day 6; a piece at two places costs what its place asks', () => {
  const listed = (st, shop) => G.actions(st).filter((o) => o.action.type === 'shopBuy' && o.action.shop === shop).map((o) => o.action.item).sort();
  const soldAt = (shop, day) => Object.entries(SHEET).filter(([, [, , shops, from]]) => shops.includes(shop) && day >= from).map(([id]) => id);
  for (const day of [1, 5, 6, 10]) for (const shop of Object.keys(PLACE)) {
    const st = at(v2(), PLACE[shop], 'morning', day);
    const want = [...soldAt(shop, day), ...(shop === 'mara' ? ['salve', 'whetstone'] : [])].sort();
    assert.deepEqual(listed(st, shop), want, `${shop} on day ${day}`);
  }
  // the second place's price: Hilde ×1.15, Corvin ×1.1, Pip ×0.9, Mara ×1 (the district's factor, EQ-9 « Le prix suit le lieu »)
  const day = (shop) => at(v2(), PLACE[shop], 'morning', 1);
  assert.equal(VG.shopPrice(day('mara'), 'mara', 'padded-jack'), 14); assert.equal(VG.shopPrice(day('armourer'), 'armourer', 'padded-jack'), 16);
  assert.equal(VG.shopPrice(day('mara'), 'mara', 'imported-blade'), 24); assert.equal(VG.shopPrice(day('master'), 'master', 'imported-blade'), 26);
  assert.equal(VG.shopPrice(day('trinkets'), 'trinkets', 'iron-ring'), 29); assert.equal(VG.shopPrice(day('armourer'), 'armourer', 'iron-ring'), 37);
  // bought at the second place, the piece is bought: Hilde sells the padded jack, Mara too
  const st = at(v2(), 'forecourt', 'morning'); st.player.coins = 99;
  assert.equal(act(st, { type: 'shopBuy', shop: 'armourer', item: 'padded-jack' }).state.v2.gear.armour, 'padded-jack');
  const m = at(v2(), 'district', 'morning'); m.player.coins = 99;
  assert.equal(act(m, { type: 'shopBuy', shop: 'mara', item: 'padded-jack' }).state.v2.gear.armour, 'padded-jack');
  // not at a shop that does not sell it
  assert.equal(refused(at(m, 'forecourt', 'morning'), { type: 'shopBuy', shop: 'armourer', item: 'viper-blade' }), tx('v2.shop.notSold'));
  // before day 6 the plate is not sold, from day 6 it is
  const early = at(v2(), 'forecourt', 'morning', 5); early.player.coins = 300;
  assert.equal(refused(early, { type: 'shopBuy', shop: 'armourer', item: 'tournament-plate' }), tx('v2.shop.notSold'));
  const late = at(v2(), 'forecourt', 'morning', 6); late.player.coins = 300;
  assert.equal(act(late, { type: 'shopBuy', shop: 'armourer', item: 'tournament-plate' }).state.v2.gear.armour, 'tournament-plate');
});

test('EQ-7: the prices follow the stage, ×1.15 from day 6 and ×1.3 from day 9 on the shops\' pieces; not the consumables, not the pieces of the end (their price fixed), not the forge', () => {
  const k = (day) => (day >= 9 ? 1.3 : day >= 6 ? 1.15 : 1);
  for (const day of [1, 4, 5, 6, 7, 8, 9, 10]) {
    const st = at(v2(), 'district', 'morning', day);
    assert.equal(VG.shopPrice(st, 'mara', 'imported-blade'), Math.round(24 * k(day)), `the blade on day ${day}`);
    assert.equal(VG.shopPrice(st, 'mara', 'docker-wrap'), Math.round(12 * k(day)), `the wrap on day ${day}`);
    assert.equal(VG.shopPrice(st, 'mara', 'whetstone'), 8, 'the whetstone keeps its price'); assert.equal(VG.shopPrice(st, 'mara', 'salve'), 10);
    if (day >= 6) assert.equal(VG.shopPrice(st, 'mara', 'caravan-greatblade'), 90, `a piece of the end on day ${day}: fixed`);
    // the forge's tiers: the same on every day (src/simulation/gear.ts TIER_PRICE)
    const forge = opt(st, { type: 'upgradeWeapon' }); assert.equal(forge.coins, 10, `the forge on day ${day}`);
  }
  assert.deepEqual(GE.STAGE_PRICE, [{ from: 6, k: 1.15 }, { from: 9, k: 1.3 }]);
  // the night's fifth more, the keeper's goodwill and the name stay on top
  const night = at(v2(), 'district', 'evening', 9); night.player.reputation = 0;
  assert.equal(VG.shopPrice(night, 'mara', 'imported-blade'), Math.round(24 * 1.3 * 1.2));
});

test('EQ-8: House Dree\'s order (Hilde\'s armours +30 %, days 3 to 5, once Cassius is hostile) and the parade\'s rush (Pip\'s accessories +50 %, day 9), each told by an event, by its keeper and in the purchase\'s log', () => {
  // House Dree: the evening of day 2 with Cassius hostile
  const st = at(v2(), 'forecourt', 'evening', 2); st.competitors.cassius.relationships.player = -30;
  const news = run(st, 'v2-dree-order');
  assert.equal(news.length, 1); assert.match(news[0].text, /House Dree's steward buys up the armourer's racks/); assert.equal(news[0].cause, "House Dree's quarrel with the player");
  // the quiet Cassius: no order
  const calm = at(v2(), 'forecourt', 'evening', 2); calm.competitors.cassius.relationships.player = 0;
  assert.equal(run(calm, 'v2-dree-order').length, 0, 'only a hostile Cassius');
  // days 3 to 5: Hilde's armours dearer by three tenths, nothing else of hers, nothing elsewhere
  const base = (s) => VG.shopPrice(s, 'armourer', 'mail-shirt'), lost = (day) => VG.shopPrice(Object.assign(at(st, 'forecourt', 'morning', day)), 'armourer', 'mail-shirt');
  const free = at(v2(), 'forecourt', 'morning', 3);
  assert.equal(lost(3), Math.round(40 * 1.15 * 1.3)); assert.equal(base(free), Math.round(40 * 1.15));
  assert.equal(lost(5), Math.round(40 * 1.15 * 1.3));
  assert.equal(lost(6), Math.round(40 * 1.15 * 1.15), 'over after day 5 (the stage\'s step is another thing)');
  assert.equal(VG.shopPrice(at(st, 'forecourt', 'morning', 3), 'armourer', 'iron-ring'), VG.shopPrice(free, 'armourer', 'iron-ring'), 'an accessory is not an armour');
  assert.equal(VG.shopPrice(at(st, 'district', 'morning', 3), 'mara', 'dock-leathers'), VG.shopPrice(at(v2(), 'district', 'morning', 3), 'mara', 'dock-leathers'), 'Mara\'s leathers are not Hilde\'s armours');
  // said by Hilde, and the purchase says its cause
  const day3 = at(st, 'forecourt', 'morning', 3); day3.player.coins = 99;
  assert.ok(D.linesOf(day3, 'hilde').includes(EN['v2.line.hilde.dree']));
  assert.ok(!D.linesOf(at(free, 'forecourt', 'morning', 3), 'hilde').includes(EN['v2.line.hilde.dree']));
  const bought = act(day3, { type: 'shopBuy', shop: 'armourer', item: 'mail-shirt' });
  assert.equal(bought.events.find((e) => e.id === 'shop:mail-shirt').cause, tx('buy.causePrices', { cause: "House Dree's order" }));
  // the parade's rush: the evening of day 8, then day 9 on Pip's accessories (not his weapons, there are none)
  const eve = at(v2(), 'lanterns', 'evening', 8), rush = run(eve, 'v2-parade-rush');
  assert.equal(rush.length, 1); assert.match(rush[0].text, /Pip's table is stripped/);
  assert.equal(run(at(v2(), 'lanterns', 'evening', 7), 'v2-parade-rush').length, 0, 'the eve of the parade only');
  const nine = at(eve, 'lanterns', 'afternoon', 9), plain = at(v2(), 'lanterns', 'afternoon', 9);
  assert.equal(VG.shopPrice(nine, 'trinkets', 'iron-ring'), Math.round(32 * 0.9 * 1.3 * 1.5)); assert.equal(VG.shopPrice(plain, 'trinkets', 'iron-ring'), Math.round(32 * 0.9 * 1.3));
  assert.equal(VG.shopPrice(at(eve, 'lanterns', 'afternoon', 10), 'trinkets', 'iron-ring'), Math.round(32 * 0.9 * 1.3), 'day 9 only');
  assert.equal(VG.shopPrice(at(eve, 'forecourt', 'afternoon', 9), 'armourer', 'iron-ring'), Math.round(32 * 1.15 * 1.3), 'Hilde\'s ring is not Pip\'s');
  assert.ok(D.linesOf(nine, 'pip').includes(EN['v2.line.pip.rush']));
  // the steel keeps its place: on blades and armour, and its words first
  const steel = at(v2(), 'forecourt', 'morning', 3); steel.services.shopFactor = 1.4; steel.services.shopCause = 'steel is scarce since the forge burned';
  assert.equal(VG.shopPrice(steel, 'armourer', 'mail-shirt'), Math.round(40 * 1.15 * 1.4));
  assert.equal(VG.shopPrice(steel, 'armourer', 'iron-ring'), Math.round(32 * 1.15), 'an accessory is no steel');
  assert.equal(VG.shortageOf(Object.assign(at(st, 'forecourt', 'morning', 3), { services: steel.services }), 'armourer', 'armour').cause, 'steel is scarce since the forge burned');
  // in French, the words of both
  assert.equal(FR['=House Dree\'s order'], 'la commande de la maison Dree'); assert.equal(FR['=the parade\'s rush'], 'la ruée de la parade');
});

// a version 2 game on day 9 with its final drawn: the player and Marek
const finalist = (day = 9) => { const st = at(v2(), 'forecourt', 'morning', day); st.tournament.matches.push({ round: 6, a: 'player', b: 'marek', winner: null, close: false, day: 10, seen: true, stage: 'final' }); return st; };

test('EQ-6: Clerk Odo\'s advance: 30 coins once from day 9, no slot, to the player who fights the final; given back out of its purse, whoever wins', () => {
  const st = finalist();
  const o = opt(st, { type: 'purseAdvance' });
  assert.ok(o && o.ok, o?.reason); assert.equal(o.gain, 30, 'the tag says what it pays'); assert.equal(o.cost, 0, 'no slot'); assert.equal(o.coins ?? 0, 0);
  assert.equal(o.label, tx('v2.advance.label', { n: 30 }));
  const r = act(st, { type: 'purseAdvance' });
  assert.equal(r.state.player.coins, st.player.coins + 30); assert.equal(r.state.v2.advance, 30); assert.equal(r.state.slot, st.slot, 'no slot');
  assert.ok(r.events.some((e) => e.id === 'purseAdvance' && e.visible && /30 coins/.test(e.text)));
  // once
  assert.equal(refused(r.state, { type: 'purseAdvance' }), tx('v2.advance.done'));
  // only at Clerk Odo's (the forecourt, by day), from day 9
  assert.ok(!opt(at(st, 'district', 'morning'), { type: 'purseAdvance' }), 'not listed away from him');
  assert.equal(opt(at(st, 'forecourt', 'evening'), { type: 'purseAdvance' }).ok, false, 'he keeps day hours');
  const early = finalist(8); early.slot = 'morning';
  assert.ok(!opt(early, { type: 'purseAdvance' }), 'not before day 9'); assert.equal(refused(early, { type: 'purseAdvance' }), tx('v2.advance.noFinal', { day: 9 }));
  // only to a finalist: the final drawn with the player in it
  const out = finalist(); const m = out.tournament.matches.find((x) => x.stage === 'final'); m.a = 'orla';
  assert.equal(opt(out, { type: 'purseAdvance' }).ok, false); assert.equal(refused(out, { type: 'purseAdvance' }), tx('v2.advance.noFinal', { day: 9 }));
  assert.equal(refused(at(v2(), 'forecourt', 'morning', 9), { type: 'purseAdvance' }), tx('v2.advance.noFinal', { day: 9 }), 'no final drawn');
  // the advance given back out of the purse: a win pays 80 less 30, a defeat 30 less 30
  for (const [outcome, purse] of [[WIN, 80], [LOSS, 30]]) {
    const fight = structuredClone(r.state); fight.day = 10; fight.slot = 'afternoon';
    const coins = fight.player.coins, events = [];
    POOL.applyPlayerDuel(fight, outcome, (e) => { events.push(e); return e; });
    assert.equal(fight.player.coins, coins + purse - 30, `the final ${outcome.winner === 'player' ? 'won' : 'lost'}: the purse less the advance`);
    assert.equal(fight.v2.advance, 0); assert.ok(events.some((e) => e.id === 'advance-repaid' && /30 coins/.test(e.text)), 'said');
  }
  // never taken: the purse whole, nothing said
  const plain = finalist(); plain.day = 10; plain.slot = 'afternoon'; const c0 = plain.player.coins, said = [];
  POOL.applyPlayerDuel(plain, WIN, (e) => { said.push(e); return e; });
  assert.equal(plain.player.coins, c0 + 80); assert.ok(!said.some((e) => e.id === 'advance-repaid')); assert.equal(plain.v2.advance, undefined);
  // today's game has none of it
  assert.ok(!G.actions(G.namedState('day1-morning')).some((x) => x.action.type === 'purseAdvance'));
  // in both languages
  for (const key of ['v2.advance.label', 'v2.advance.log', 'v2.advance.noFinal', 'v2.advance.done', 'v2.advance.repaid']) assert.ok(EN[key] && FR[key], key);
});

test('EQ-11: the forge\'s tiers follow the hand: a blade changed, taken off or sold leaves them; the training sword in hand wears them', () => {
  const st = at(v2(), 'district', 'morning'); st.player.coins = 300; Object.assign(st.v2.gear, { weapon: 'imported-blade', tier: 2 });
  assert.equal(VG.v2Stats(st).atk, 10 + 4 + 4);
  const off = act(st, { type: 'unequip', slot: 'weapon' }).state;
  assert.deepEqual([off.v2.gear.weapon, off.v2.gear.tier], ['training-sword', 2]); assert.equal(VG.v2Stats(off).atk, 10 + 4, 'the sword in hand wears the tiers');
  const sold = act(st, { type: 'sell', item: 'imported-blade', from: 'weapon' }).state;
  assert.deepEqual([sold.v2.gear.weapon, sold.v2.gear.tier], ['training-sword', 2], 'the blade sold does not give them back');
  const swapped = act(st, { type: 'shopBuy', shop: 'mara', item: 'viper-blade' }).state;
  assert.deepEqual([swapped.v2.gear.weapon, swapped.v2.gear.tier], ['viper-blade', 2]); assert.equal(VG.v2Stats(swapped).atk, 10 + 2 + 4);
  // the forge raises them whatever the blade
  assert.equal(act(swapped, { type: 'upgradeWeapon' }).state.v2.gear.tier, 3);
  // the constant that held the old rule is gone
  assert.equal(GE.TIERS_FOLLOW_THE_HAND, undefined);
});

test('EQ-2 and EQ-3: each piece\'s words say its state or its protection, the numbers the duel\'s own, in both languages', () => {
  // a weapon of a family: its points and the state it puts, its chance a hit
  const words = (id) => VG.pieceWords(id);
  assert.match(words('viper-blade'), /^Attack \+2; .*its blows can poison, 12 % a hit/);
  assert.match(words('serrated-cutlass'), /its blows can make bleed, 12 % a hit/); assert.match(words('ember-sword'), /its blows can burn, 8 % a hit, a guarded one too/);
  assert.match(words('mirror-blade'), /its blows can blind, 15 % a hit/); assert.match(words('hex-falchion'), /its blows can curse, 40 % a hit/); assert.match(words('torpor-rapier'), /its blows can paralyse, 40 % a hit/);
  // the armours halve a state's chance, the charms keep it off
  assert.match(words('padded-jack'), /halves your chance of being burned/); assert.match(words('dock-leathers'), /halves your chance of being poisoned/);
  assert.match(words('mail-shirt'), /halves your chance of bleeding/); assert.match(words('knight-hauberk'), /halves your chance of bleeding/); assert.match(words('tournament-plate'), /halves your chance of bleeding/);
  assert.match(words('bezoar-stone'), /keeps poison off you/); assert.match(words('salamander-charm'), /keeps burns off you/); assert.match(words('wayfarer-hood'), /keeps blindness off you/); assert.match(words('field-tourniquet'), /keeps bleeding off you/);
  // the end of the tournament's effects
  assert.match(words('tournament-plate'), /deal you 30 % less damage/); assert.match(words('masters-sash'), /your first charge of a bout leaves at once/); assert.match(words('champion-laurel'), /your breaks 15 % shorter/);
  // every piece has a name and its words in both languages (the table's completeness: tests/language.test.mjs)
  // (the fervour charm has no points of its own: its effect alone, as before)
  for (const id of Object.keys(SHEET)) for (const part of id === 'fervour-charm' ? ['name'] : ['name', 'about']) { assert.ok(EN[`gear.${id}.${part}`], `${id} ${part} in English`); assert.ok(FR[`gear.${id}.${part}`], `${id} ${part} in French`); }
  for (const st of ['poison', 'burn', 'blind', 'bleed', 'curse', 'paralysis']) { assert.ok(EN[`gear.fx.inflict.${st}`] && FR[`gear.fx.inflict.${st}`], st); }
  for (const st of ['poison', 'burn', 'blind', 'bleed']) for (const k of ['half', 'off']) assert.ok(EN[`gear.fx.resist.${k}.${st}`] && FR[`gear.fx.resist.${k}.${st}`], `${k} ${st}`);
});

test('EQ-12: the planner, the reference and the curious player wear a piece of the end of the tournament with their surplus, take Clerk Odo\'s advance and sell the piece replaced; the plan never buys a step twice', () => {
  // a policy with the plan's gear all worn and coins to spare, on day 7 at Hilde's: the plate (armour: the mail shirt goes to the bag, sold at Mara's the next morning)
  const base = at(v2(), 'forecourt', 'morning', 7); base.player.coins = 400;
  Object.assign(base.v2.gear, { weapon: 'imported-blade', tier: 3, armour: 'mail-shirt', acc: ['docker-wrap', 'iron-ring'], bag: [] });
  for (const name of ['planner', 'reference', 'curious']) {
    let st = structuredClone(base); const done = [];
    for (let i = 0; i < 12 && st.day === 7; i++) {
      const a = LAB.POLICIES[name].choose(st); done.push(`${st.place}:${a.type}${a.item ? '/' + a.item : ''}`);
      if (a.type === 'equip') { st = act(st, a).state; continue; }
      const r = G.advance(st, a); assert.ok(r.ok, `${name}: ${a.type} ${r.reason}`); st = r.state;
    }
    const g = st.v2.gear, worn = [g.weapon, g.armour, ...g.acc];
    assert.ok(worn.some((id) => END.includes(id)) || g.bag.some((id) => END.includes(id)), `${name}: a piece of the end bought (${done.join(', ')})`);
    // the plan never takes the mail shirt again over the plate, nor buys the blade again over the caravan's
    assert.ok(!(g.armour === 'mail-shirt' && done.filter((d) => d.endsWith('/mail-shirt')).length > 0), `${name}: no step bought twice (${done.join(', ')})`);
  }
  // the advance when it brings a piece within reach: day 9, a finalist, 30 coins short
  const fin = finalist(); Object.assign(fin.v2.gear, { weapon: 'imported-blade', tier: 3, armour: 'mail-shirt', acc: ['docker-wrap', 'iron-ring'], bag: [] });
  fin.player.coins = 70;
  const a = LAB.POLICIES.planner.choose(fin);
  assert.deepEqual(a, { type: 'purseAdvance' }, 'the caravan’s greatblade costs 90 (and 8 kept for the healer) and the purse 70: the advance first');
  const rich = structuredClone(fin); rich.player.coins = 100;
  assert.deepEqual(LAB.POLICIES.planner.choose(rich), { type: 'move', to: 'district' }, 'with 100 coins the greatblade is within reach: no advance, Mara’s stall');
  // the planner of the plan's steps: a plate worn counts for the mail shirt's step, a blade of any kind for the blade's
  const worn = structuredClone(fin); worn.v2.gear.armour = 'tournament-plate'; worn.v2.gear.weapon = 'caravan-greatblade';
  const step = (s) => LAB.POLICIES.planner.choose(s);
  assert.ok(!(step(worn).type === 'shopBuy' && ['mail-shirt', 'imported-blade'].includes(step(worn).item)), 'no downgrade bought');
});

test('EQ-13: the trial `states=` of the harmful states is gone; `weapon=` wears a piece of the catalogue with its effects on the arena\'s own page', () => {
  const src = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
  assert.doesNotMatch(src('src/main.ts'), /installStatesTrial|params\.has\('states'\)/); assert.doesNotMatch(src('src/lab/states.ts'), /installStatesTrial|PROTECTIONS/);
  assert.doesNotMatch(src('src/arena/ArenaApp.ts'), /params\.has\('states'\)/);
  assert.match(src('src/arena/ArenaApp.ts'), /gear: \[opts\.params\.get\('weapon'\)!\]/);
  // the weapon given by id carries its state in the duel Ren fights
  const AV = null; void AV;
  const ren = AD.autoRen({ hp: 300, atk: 14, def: 10, end: 10, viv: 10 }, { loadout: ['t1', 't4', 'd1', 's1'], levels: {} }, { weapon: 'viper-blade', gear: ['viper-blade'] });
  assert.deepEqual(ren.gfx.inflict, { state: 'poison', chance: 0.12 }); assert.deepEqual(AD.autoLight('viper-blade').hits ?? AD.AUTO_WEAPONS['viper-blade'].hits, AD.AUTO_WEAPONS['imported-blade'].hits);
});
