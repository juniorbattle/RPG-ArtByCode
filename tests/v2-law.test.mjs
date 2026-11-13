// The town's actions of lot L2a (the operator's choices EV-2 « Un soupçon qui dure, une sortie par la restitution », EV-6 « Au moment d’acheter, un
// argument à choisir » with his notes, EV-16 « Ajouter le joueur curieux au laboratoire », journal Passes EV2 / EVL2): two numbers apart (the
// reputation, the marks of Sergeant Hale's ledger since L2-2 « Des marques (Recommandé) », journal Passe EVL4), a theft found at the next dawn, the stalls forced at night, the watch's search past a threshold, the stalls shut to a
// suspect until a restitution at Sergeant Hale's (always open), the registrar's warning then a point of the pool, a bargain put at the moment of
// buying, the passers-by's pieces, the curious player of the laboratory. The oracles are the rules written out here, not the code's functions.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from './load.mjs';

const G = await load('/src/simulation/index.ts');
const T = await load('/src/simulation/v2town.ts');
const L = await load('/src/simulation/v2law.ts');
const VG = await load('/src/simulation/v2gear.ts');
const LAB = await load('/src/tournament/lab.ts');
const D = await load('/src/narrative/dialogue.ts');
const MATCH = await load('/src/combat/match.ts');
const PLAN = await load('/src/audio/plan.ts');

const v2 = (name = 'day1-morning') => G.makeV2(G.namedState(name));
const act = (st, a, rng) => { const r = G.advance(st, a, rng); assert.ok(r.ok, `${a.type}: ${r.reason}`); return r; };
const refused = (st, a, re) => { const r = G.advance(st, a); assert.equal(r.ok, false, a.type); if (re) assert.match(r.reason, re); return r.reason; };
/** a draw that always wins (0) or always loses (0.999) the action's own roll */
const WIN = { next: () => 0, fork() { return this; } }, LOSE = { next: () => 0.999, fork() { return this; } };
const held = (st, id) => id === 'whetstone' ? st.player.items.includes('whetstone') : [st.v2.gear.weapon, st.v2.gear.armour, ...st.v2.gear.acc, ...st.v2.gear.bag].includes(id);
/** the marks in Sergeant Hale's ledger */
const sus = (st) => st.v2.marks ?? 0;
/** to the next dawn: the slots end by waiting (the player's own action) */
const toMorning = (st) => { let s = st; const d = s.day; while (s.day === d) s = act(s, { type: 'wait' }).state; return s; };
const emitTo = (log) => (e) => { log.push(e); return e; };

test('two numbers apart: a theft caught puts a mark in Hale\'s ledger and costs the name, an unseen one none; no hidden eye on the chance (L2-2)', () => {
  const st = v2();
  assert.equal(sus(st), 0); assert.equal(st.player.reputation, 10);
  const ok = act(st, { type: 'steal', shop: 'mara' }, WIN).state;
  assert.equal(sus(ok), 0, 'an unseen theft: no mark until it is found'); assert.equal(ok.player.reputation, 10, 'the name does not know of it');
  assert.deepEqual(ok.v2.thefts, [{ day: 1, from: 'mara', item: 'whetstone', seen: null }]);
  const caught = act(st, { type: 'steal', shop: 'mara' }, LOSE).state;
  assert.equal(sus(caught), 1, 'caught in the act: one mark'); assert.equal(caught.player.reputation, 2); assert.equal(caught.player.coins, st.player.coins - 15);
  // the rule written out: by day 0.3, the watch's slack, the keeper's goodwill, the alert; the marks change nothing (L2-2: no hidden points)
  const rule = (s, shop = 'mara') => Math.min(0.85, Math.max(0.05, (s.slot === 'evening' ? 0.6 : 0.3) + (60 - s.pulse.security) / 200 - (s.town[{ mara: 'mara', armourer: 'hilde', master: 'corvin', trinkets: 'pip' }[shop]] ?? 0) / 400 - (s.flags[`alert:${s.day}`] ? 0.15 : 0)));
  for (const k of [0, 1, 2, 3]) { const s = structuredClone(st); s.v2.marks = k; assert.equal(T.stealChance(s, 'mara'), rule(s), `marks ${k}`); }
  // the ledger holds three, and a player the watch wants steals at no stall (journal Passe CO2, AU-08: the stalls that refuse to sell refuse to be robbed)
  const full = structuredClone(st); full.v2.marks = 3; full.player.coins = 99; full.place = 'lanterns'; full.slot = 'afternoon';
  const steal = G.actions(full).find((x) => x.action.type === 'steal' && x.action.shop === 'trinkets');
  assert.ok(steal && !steal.ok && /Sergeant Hale/.test(steal.reason), 'wanted: the stall is not robbed'); assert.equal(sus(full), 3);
});

test('an unseen theft can be found at the next dawn: the owner names the item, the watch learns of it; a theft nobody finds stays hidden', () => {
  let found = 0, kept = 0;
  for (let seed = 1; seed <= 80; seed++) {
    const s0 = G.makeV2(G.newGame(seed, 'Ren')), r = act(s0, { type: 'steal', shop: 'mara' }, WIN), s1 = toMorning(r.state);
    const e = s1.log.find((x) => x.id === 'theft:found');
    if (e) {
      found++;
      assert.equal(e.day, 2); assert.equal(e.slot, 'morning'); assert.ok(e.visible);
      assert.match(e.text, /Mara/); assert.match(e.text, /whetstone/);
      assert.equal(sus(s1), 1, 'found: one mark'); assert.equal(s1.town.mara, (r.state.town.mara ?? 0) - 10);
      assert.equal(s1.v2.thefts[0].seen, 'found');
    } else { kept++; assert.equal(s1.v2.thefts[0].seen, null); }
    assert.ok(held(s1, 'whetstone'), 'the piece stays with the thief');
    // one dawn only: the next one (the end of day 2) does not count it again, whatever its draw
    const s2 = structuredClone(s1), log = []; L.v2Dawn(s2, emitTo(log), WIN);
    assert.ok(!log.some((x) => x.id === 'theft:found'), `seed ${seed}: counted once`);
  }
  // 0.6 by the rule: 48 of 80 expected
  assert.ok(found > 36 && found < 60 && kept > 20, `${found} found, ${kept} kept`);
  // the dawn's own draw, by hand: a stall 0.6, a forced shutter 0.85, a pocket 0.5
  for (const [t, p] of [[{ day: 1, from: 'mara', item: 'whetstone', seen: null }, 0.6], [{ day: 1, from: 'mara', item: 'whetstone', seen: null, night: true }, 0.85], [{ day: 1, from: 'edda', item: 'knight-hauberk', seen: null }, 0.5]]) {
    for (const [x, hit] of [[p - 0.001, true], [p + 0.001, false]]) {
      const s = v2(); s.v2.thefts = [structuredClone(t)]; const log = [];
      L.v2Dawn(s, emitTo(log), { next: () => x });
      assert.equal(s.v2.thefts[0].seen === 'found', hit, `${t.from}${t.night ? ' night' : ''} at ${x}`);
    }
  }
});

test('the night: a day stall shuttered can be forced, easier, unless the watch the player paid walks the quay; caught, punished harder', () => {
  const night = v2('day1-evening');
  assert.equal(night.place, 'district');
  const o = G.actions(night).find((x) => x.action.type === 'steal' && x.action.shop === 'mara');
  assert.ok(o?.ok, 'Mara\'s stall, shut at night, can be forced'); assert.match(o.label, /^Force Mara's shuttered stall/);
  const rule = (s) => Math.min(0.85, Math.max(0.05, 0.7 - (s.services.forgeWatch ? 0.25 : 0) + (60 - s.pulse.security) / 200 - (s.town.mara ?? 0) / 400 - (s.flags[`alert:${s.day}`] ? 0.15 : 0)));
  assert.equal(T.stealChance(night, 'mara'), rule(night));
  const watched = act(night, { type: 'payWatch' }).state;
  assert.equal(T.stealChance(watched, 'mara'), rule(watched)); assert.ok(T.stealChance(watched, 'mara') < T.stealChance(night, 'mara'));
  const ok = act(night, { type: 'steal', shop: 'mara' }, WIN).state;
  assert.deepEqual(ok.v2.thefts[0], { day: 1, from: 'mara', item: 'whetstone', seen: null, night: true });
  const c = act(night, { type: 'steal', shop: 'mara' }, LOSE).state;
  assert.equal(c.player.coins, night.player.coins - Math.min(25, night.player.coins)); assert.equal(c.player.reputation, Math.max(0, night.player.reputation - (night.player.coins < 25 ? 15 : 12)));
  assert.equal(sus(c), 1, 'one mark, the fine and the name harder'); assert.equal(c.v2.shops.mara.closed, 2, 'shut to the player tomorrow'); assert.equal(c.v2.shops.mara.markup, 3);
  // by day the stall that is open is robbed as before, and a day stall shut by day (Pip's in the morning) cannot be
  const sq = v2(); sq.place = 'lanterns';
  assert.ok(!G.actions(sq).some((x) => x.action.type === 'steal'));
});

test('past the threshold: the watch searches at dawn, no stall sells (bargains included); the passers-by still do; the way out is at Sergeant Hale\'s', () => {
  const st = v2(); st.v2.marks = 3; st.player.coins = 99;
  for (const shop of ['mara', 'armourer', 'master', 'trinkets']) {
    const s = structuredClone(st); s.place = { mara: 'district', armourer: 'forecourt', master: 'training', trinkets: 'lanterns' }[shop]; s.slot = 'afternoon';
    const buy = G.actions(s).filter((x) => (x.action.type === 'shopBuy' || x.action.type === 'bargain') && x.action.shop === shop);
    assert.ok(buy.length && buy.every((x) => !x.ok && /Sergeant Hale/.test(x.reason)), `${shop} refuses a suspect`);
  }
  const below = structuredClone(st); below.v2.marks = 2;
  assert.ok(G.actions(below).some((x) => x.action.type === 'shopBuy' && x.ok), 'at two marks the stalls sell');
  const fc = structuredClone(st); fc.place = 'forecourt';
  assert.ok(G.actions(fc).some((x) => x.action.type === 'barter' && !x.action.arg && x.ok), 'Lady Edda sells to anyone');
  // the dawn search: what is still held of the thefts goes back, and a fine; nothing held, no search; a theft caught took nothing, so the whetstone the player holds is
  // their own and stays (journal Passe CO2: a copy bought later was seized)
  const s = structuredClone(st); s.slot = 'evening'; s.player.items.push('whetstone'); s.v2.gear.acc[0] = 'docker-wrap';
  s.v2.thefts = [{ day: 1, from: 'mara', item: 'whetstone', seen: 'caught' }, { day: 1, from: 'mara', item: 'docker-wrap', seen: null }, { day: 1, from: 'pip', item: 'lucky-ribbon', seen: 'found' }];
  const log = []; L.v2Dawn(s, emitTo(log), LOSE);
  const e = log.find((x) => x.id === 'theft:search');
  assert.ok(e && e.day === 2 && e.slot === 'morning'); assert.match(e.text, /docker's wrap/); assert.doesNotMatch(e.text, /whetstone/);
  assert.ok(held(s, 'whetstone') && !held(s, 'docker-wrap')); assert.equal(s.player.coins, 99 - 10);
  assert.deepEqual(s.v2.thefts.map((t) => !!t.settled), [false, true, false]);
  const none = structuredClone(st); none.v2.thefts = [{ day: 1, from: 'pip', item: 'lucky-ribbon', seen: 'found' }]; const log2 = [];
  L.v2Dawn(none, emitTo(log2), LOSE); assert.ok(!log2.some((x) => x.id === 'theft:search'));
});

test('a restitution at Sergeant Hale\'s: the pieces held go back, the others are paid at their list price, his fee; the ledger clean; a thin purse hauls a slot', () => {
  const st = v2(); st.player.coins = 60; st.player.items.push('whetstone');
  assert.ok(!G.actions(st).some((x) => x.action.type === 'restitute'), 'nothing to settle: not offered');
  st.v2.marks = 3; st.v2.thefts = [{ day: 1, from: 'mara', item: 'whetstone', seen: 'found' }, { day: 1, from: 'pip', item: 'lucky-ribbon', seen: 'caught' }];
  const o = G.actions(st).find((x) => x.action.type === 'restitute');
  // the whetstone held goes back; the ribbon, caught in the act, was never taken: nothing to pay for it (journal Passe CO2, AU-08; it was billed 12), only the fee 5
  assert.ok(o.ok); assert.equal(o.coins, 5); assert.equal(o.cost, 0); assert.match(o.label, /return a whetstone/);
  const r = act(st, { type: 'restitute' }).state;
  assert.equal(sus(r), 0); assert.equal(r.player.coins, 60 - 5); assert.ok(!held(r, 'whetstone')); assert.ok(r.v2.thefts.every((t) => t.settled));
  assert.equal(r.slot, st.slot, 'paid: no slot');
  assert.ok(G.actions(Object.assign(r, { slot: 'morning' })).some((x) => x.action.type === 'shopBuy' && x.action.shop === 'mara' && x.ok), 'Mara sells again');
  // a piece really taken and no longer held is paid at its list price
  const sold = structuredClone(st); sold.v2.thefts = [{ day: 1, from: 'pip', item: 'lucky-ribbon', seen: 'found' }];
  assert.equal(G.actions(sold).find((x) => x.action.type === 'restitute').coins, 12 + 5);
  // the way out is always open: a purse of 3 pays its 3 and hauls the rest of the slot
  const poor = structuredClone(st); poor.player.coins = 3;
  const p = G.actions(poor).find((x) => x.action.type === 'restitute');
  assert.ok(p.ok); assert.equal(p.coins, 3); assert.equal(p.cost, 1);
  const pr = act(poor, { type: 'restitute' });
  assert.equal(pr.state.player.coins, 0); assert.equal(sus(pr.state), 0); assert.notEqual(pr.state.slot, poor.slot, 'a slot hauled');
  // only Sergeant Hale, on the quay
  const away = structuredClone(st); away.place = 'forecourt'; assert.ok(!G.actions(away).some((x) => x.action.type === 'restitute'));
  // he says what his ledger holds
  assert.ok(D.linesOf(st, 'hale').some((l) => /ledger/.test(l) && /3 marks/.test(l)));
  assert.ok(D.linesOf(Object.assign(structuredClone(st), { v2: { ...st.v2, marks: 1 } }), 'hale').some((l) => /one mark/.test(l)));
  assert.ok(!D.linesOf(r, 'hale').some((l) => /ledger/.test(l)), 'a clean ledger, nothing said');
});

test('the registrar warns once; a second theft caught costs a point of the pool while it is fought, a fine after it', () => {
  let s = v2(); s.player.coins = 99;
  s = act(s, { type: 'steal', shop: 'mara' }, LOSE).state;
  assert.ok(s.log.some((e) => e.id === 'registrar:warn' && e.visible)); assert.equal(s.tournament.points.player, 0); assert.equal(s.v2.warned, true);
  const p0 = s.tournament.points.player, again = structuredClone(s); again.place = 'lanterns'; again.slot = 'afternoon';
  const t = act(again, { type: 'steal', shop: 'trinkets' }, LOSE).state;
  assert.equal(t.tournament.points.player, p0 - 1); assert.ok(t.log.some((e) => e.id === 'registrar:point'));
  const late = structuredClone(again); late.day = 6; late.player.coins = 40;
  const u = act(late, { type: 'steal', shop: 'trinkets' }, LOSE).state;
  assert.equal(u.tournament.points.player, p0, 'after the pool: no point'); assert.equal(u.player.coins, 40 - 15 - 15, 'the stall\'s fine, then the registrar\'s');
  assert.ok(u.log.some((e) => e.id === 'registrar:fine'));
});

test('a bargain at the moment of buying: three arguments, each its chance; won, the piece (or two) at its discount; lost, no cost, less goodwill, no other argument that day', () => {
  const st = v2(); st.place = 'forecourt'; st.player.coins = 200;
  const price = (item) => VG.shopPrice(st, 'armourer', item), off = (p, d) => Math.max(1, Math.round(p * (1 - d)));
  const opts = G.actions(st).filter((x) => x.action.type === 'bargain' && x.action.item === 'mail-shirt');
  assert.deepEqual(opts.map((x) => x.action.arg).sort(), ['friend', 'name', 'pair']);
  // the chances written out: the name 0.15 + reputation / 120, a friend 0.2 + goodwill / 60, two at once 0.45 + reputation / 300 + goodwill / 300
  const ch = (arg, s = st) => Math.round(Math.min(0.85, Math.max(arg === 'friend' ? 0.05 : 0.1, arg === 'name' ? 0.15 + s.player.reputation / 120 : arg === 'friend' ? 0.2 + (s.town.hilde ?? 0) / 60 : 0.45 + s.player.reputation / 300 + (s.town.hilde ?? 0) / 300)) * 100);
  for (const o of opts) assert.match(o.label, new RegExp(`\\(${ch(o.action.arg)} %\\)$`), o.label);
  assert.equal(opts.find((x) => x.action.arg === 'name').coins, off(price('mail-shirt'), 0.2));
  assert.equal(opts.find((x) => x.action.arg === 'friend').coins, off(price('mail-shirt'), 0.15));
  // two at once: the armourer's cheapest other piece not held (the padded jack, 18), both at a quarter off
  assert.equal(opts.find((x) => x.action.arg === 'pair').coins, off(price('mail-shirt'), 0.25) + off(price('padded-jack'), 0.25));
  const won = act(st, { type: 'bargain', shop: 'armourer', item: 'mail-shirt', arg: 'pair' }, WIN).state;
  assert.equal(won.player.coins, 200 - (off(price('mail-shirt'), 0.25) + off(price('padded-jack'), 0.25)));
  assert.equal(won.v2.gear.armour, 'padded-jack', 'the second piece worn last, the first to the bag'); assert.ok(won.v2.gear.bag.includes('mail-shirt'));
  const lost = act(st, { type: 'bargain', shop: 'armourer', item: 'mail-shirt', arg: 'friend' }, LOSE).state;
  assert.equal(lost.player.coins, 200, 'no extra cost'); assert.equal(lost.town.hilde, (st.town.hilde ?? 0) - 8, 'a friend presumed upon');
  assert.ok(!held(lost, 'mail-shirt'));
  refused(lost, { type: 'bargain', shop: 'armourer', item: 'iron-ring', arg: 'name' }, /heard your bargaining today/);
  assert.ok(G.actions(lost).some((x) => x.action.type === 'shopBuy' && x.action.item === 'mail-shirt' && x.ok), 'the full price is still there');
  const lostName = act(st, { type: 'bargain', shop: 'armourer', item: 'mail-shirt', arg: 'name' }, LOSE).state;
  assert.equal(lostName.town.hilde, (st.town.hilde ?? 0) - 4);
  // the next day the keeper hears an argument again
  const next = structuredClone(lost); next.day = 2; assert.ok(G.actions(next).some((x) => x.action.type === 'bargain' && x.ok));
  // two at once needs a second piece: nothing left to take
  const full = structuredClone(st); full.v2.gear.bag.push('padded-jack', 'iron-ring');
  refused(full, { type: 'bargain', shop: 'armourer', item: 'mail-shirt', arg: 'pair' }, /Nothing else/);
  // the version 2's old « bargain for the day » is gone
  assert.ok(!G.actions(st).some((x) => x.action.type === 'haggle'));
});

test('the passers-by: each at their place and hours, some days only; their piece bought, bargained for, or lifted instead; gone once taken', () => {
  const fc = v2(); fc.place = 'forecourt'; fc.player.coins = 80;
  const buy = G.actions(fc).find((x) => x.action.type === 'barter' && x.action.who === 'edda' && !x.action.arg);
  assert.ok(buy.ok); assert.equal(buy.coins, 34);
  const soft = G.actions(fc).find((x) => x.action.type === 'barter' && x.action.who === 'edda' && x.action.arg === 'soft');
  assert.equal(soft.coins, Math.round(34 * 0.7)); assert.match(soft.label, /her son's courage/);
  const won = act(fc, soft.action, WIN).state;
  assert.equal(won.v2.gear.armour, 'knight-hauberk'); assert.equal(won.player.coins, 80 - 24); assert.equal(won.v2.passed.edda, 1);
  assert.ok(!G.actions(won).some((x) => x.action.type === 'barter' && x.ok), 'gone once taken');
  assert.ok(D.linesOf(won, 'edda')[0] !== D.linesOf(fc, 'edda')[0], 'her line changes');
  const lost = act(fc, soft.action, LOSE).state;
  assert.equal(lost.player.coins, 80); refused(lost, { type: 'barter', who: 'edda', arg: 'name' }, /bargaining today/);
  assert.ok(G.actions(lost).some((x) => x.action.type === 'barter' && !x.action.arg && x.ok), 'her price still stands');
  // the river trader at night on the quay, days 1 to 7; the pilgrim on the square from the afternoon, days 1 to 9
  const quay = v2('day1-evening'); quay.player.coins = 80;
  assert.ok(G.actions(quay).some((x) => x.action.type === 'barter' && x.action.who === 'fenwick' && x.ok));
  const late = structuredClone(quay); late.day = 8; assert.ok(!G.actions(late).some((x) => x.action.type === 'barter' && x.action.who === 'fenwick' && x.ok));
  const day = v2(); assert.ok(!G.actions(day).some((x) => x.action.type === 'barter' && x.action.who === 'fenwick' && x.ok), 'not by day');
  const sq = v2(); sq.place = 'lanterns'; sq.slot = 'afternoon'; sq.player.coins = 80;
  assert.ok(G.actions(sq).some((x) => x.action.type === 'barter' && x.action.who === 'sela' && x.ok));
  sq.day = 10; assert.ok(!G.actions(sq).some((x) => x.action.type === 'barter' && x.action.who === 'sela' && x.ok));
  // lifted instead: a theft like a stall's, found at dawn by its owner (half the time), the owner shy of the player once caught
  const p = act(fc, { type: 'pickpocket', who: 'edda' }, WIN).state;
  assert.equal(p.v2.gear.armour, 'knight-hauberk'); assert.deepEqual(p.v2.thefts[0], { day: 1, from: 'edda', item: 'knight-hauberk', seen: null }); assert.equal(sus(p), 0);
  const pc = act(fc, { type: 'pickpocket', who: 'edda' }, LOSE).state;
  assert.equal(sus(pc), 1); refused(pc, { type: 'barter', who: 'edda' }, /nothing to do with you/);
  // given back at Hale's, the piece is the passer-by's again
  const back = act(Object.assign(structuredClone(p), { place: 'district' }), { type: 'restitute' }).state;
  assert.ok(!held(back, 'knight-hauberk')); assert.equal(back.v2.passed.edda, undefined);
});

test('a reprisal (lot L2b, the operator\'s note on EV-2): a robbed owner\'s grudge pays the muscle at dawn; met on the quay at night, faced on the empty sand or paid off; ignored, it takes its due; a restitution ends it', () => {
  const M = G.makeV2(G.namedState('day1-morning'));
  // caught at Mara's with her goodwill already low: -15 - 20 = -35, under the grudge's -30
  M.town.mara = -15;
  const caught = act(M, { type: 'steal', shop: 'mara' }, LOSE).state;
  const log = [], dawn = structuredClone(caught); dawn.slot = 'evening'; L.v2Dawn(dawn, emitTo(log), LOSE);
  const e = log.find((x) => x.id === 'reprisal:hired');
  assert.ok(e && e.day === 2 && e.slot === 'morning'); assert.match(e.text, /Mara/); assert.match(e.text, /Corra Dunmere/);
  assert.deepEqual(dawn.v2.reprisal, { by: 'mara', until: 3 });
  // a goodwill above the grudge hires nobody
  const mild = structuredClone(caught); mild.town.mara = -29; mild.slot = 'evening'; const l2 = []; L.v2Dawn(mild, emitTo(l2), LOSE); assert.ok(!l2.some((x) => x.id === 'reprisal:hired'));
  // the next night on the quay: Corra waits; her sport is not on offer
  const night = structuredClone(dawn); night.day = 2; night.slot = 'evening'; night.place = 'district'; night.player.coins = 50;
  const opts = G.actions(night), face = opts.find((o) => o.action.type === 'faceMuscle'), pay = opts.find((o) => o.action.type === 'payMuscle');
  assert.ok(face.ok && pay.ok); assert.equal(pay.coins, 20); assert.equal(face.later, 1);
  assert.ok(!opts.some((o) => o.action.type === 'challenge' && o.action.who === 'corra'), 'her sport is not offered');
  assert.match(G.advance(night, { type: 'challenge', who: 'corra', stake: 'coins' }).reason, /a debt, not for sport/);
  const paid = act(night, { type: 'payMuscle' }).state;
  assert.equal(paid.player.coins, 30); assert.equal(paid.v2.reprisal, undefined); assert.equal(paid.town.mara, night.town.mara + 15);
  // faced: her sheet on her rival's profile; won, the muscle gone and a little name; lost, the purse, the pieces back, a heavy blow's wound
  const f = act(night, { type: 'faceMuscle' }).state;
  assert.deepEqual(f.v2.challenge, { who: 'corra', day: 2, reprisal: true });
  const sh = MATCH.challengeSheetFor(f); assert.equal(sh.id, 'rp:corra:2'); assert.equal(sh.sides[1].fighters[0].profile, 'orla');
  const won = act(f, { type: 'challengeResult', outcome: { winner: 'player', playerHp: 900, playerMaxHp: 2200, opponentHp: 0, opponentMaxHp: 2500, finisher: 'heavy' } }).state;
  assert.equal(won.v2.reprisal, undefined); assert.equal(won.player.reputation, Math.min(100, f.player.reputation + 2)); assert.equal(won.player.coins, f.player.coins);
  const holding = structuredClone(f); holding.player.items.push('whetstone'); holding.v2.thefts.push({ day: 1, from: 'mara', item: 'whetstone', seen: 'found' });
  const lost = act(holding, { type: 'challengeResult', outcome: { winner: 'opponent', playerHp: 0, playerMaxHp: 2200, opponentHp: 900, opponentMaxHp: 2500, finisher: 'heavy' } }).state;
  assert.equal(lost.player.coins, holding.player.coins - 20); assert.ok(!held(lost, 'whetstone')); assert.equal(lost.player.injury, holding.player.injury + 1);
  const light = act(holding, { type: 'challengeResult', outcome: { winner: 'opponent', playerHp: 0, playerMaxHp: 2200, opponentHp: 900, opponentMaxHp: 2500, finisher: 'light' } }).state;
  assert.equal(light.player.injury, holding.player.injury, 'no heavy blow, no wound');
  // ignored: at the dawn after its last night, she takes her due
  const late = structuredClone(dawn); late.day = 3; late.slot = 'evening'; late.player.coins = 12; const l3 = [];
  L.v2Dawn(late, emitTo(l3), LOSE);
  assert.ok(l3.some((x) => x.id === 'reprisal:taken')); assert.equal(late.player.coins, 0); assert.equal(late.v2.reprisal, undefined);
  // a restitution at Sergeant Hale's pays the owner: no muscle waits any more
  const settle = structuredClone(night); settle.slot = 'morning'; const rs = act(settle, { type: 'restitute' }).state;
  assert.equal(rs.v2.reprisal, undefined);
});

test('the empty stands (lot L2b, EV-5 « L’arène aux gradins vides »): a challenge or a reprisal is fought without spectators or crowd, on the lists\' piece', () => {
  const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');
  const play = read('src/ui/playArena.ts'), app = read('src/arena/ArenaApp.ts'), snd = read('src/audio/Sound.ts');
  assert.match(play, /piece: challenge \? 'lices' : boutPiece\(m\?\.stage\), \.\.\.\(challenge \? \{ empty: true \} : \{\}\)/);
  assert.match(app, /!this\.opts\.match\?\.empty && this\.opts\.params\.get\('cast'\) !== 'generated'/, 'no stands');
  assert.match(app, /this\.stands \|\| this\.opts\.match\?\.empty \? \[\] : this\.arena\.stands/, 'no generated spectators');
  assert.match(app, /\.\.\.\(opts\.match\?\.empty \? \{ empty: true \} : \{\}\)/, 'the sound told');
  assert.match(snd, /if \(place === 'arena' && music\.empty\) \{ const bank = this\.loadBank\(\);[^\n]*\n\s*else if \(place === 'arena'\) this\.crowdScene\(amb, cross\);/, 'no crowd, the duel\'s sounds loaded');
  assert.equal(PLAN.pieceFor('arena', 'midday', { bout: 'lices' }), 'lices');
});

test('the curious player of the laboratory: every town action in some game, none refused; the diligent and the idle play as before', () => {
  const r = LAB.labReport([1, 2, 3, 4, 5, 6, 7, 8], LAB.POLICIES.curious, 'v2');
  const t = r.v2.town;
  for (const k of ['thefts', 'found', 'bargains', 'barters', 'challenges']) assert.ok(t[k] > 0, `${k}: ${t[k]}`);
  assert.ok(r.games.every((g) => g.events.length > 0));
  // the diligent and the idle never steal, bargain or meet a passer-by: their games are untouched by the lot
  for (const name of ['diligent', 'idle']) {
    const d = LAB.labReport([1, 2, 3], LAB.POLICIES[name], 'v2');
    assert.equal(d.v2.town.thefts + d.v2.town.bargains + d.v2.town.barters + d.v2.town.marks, 0, name);
  }
  // in today's game the curious plays the diligent
  assert.deepEqual(LAB.labReport([1, 2], LAB.POLICIES.curious, 'classic').games.map((g) => g.hash), LAB.labReport([1, 2], LAB.POLICIES.diligent, 'classic').games.map((g) => g.hash));
});

test('the default game offers none of it, and its people never see the passers-by', () => {
  for (const name of Object.keys(G.NAMED_STATES).filter((n) => !G.NAMED_STATES[n].v2)) for (const place of ['district', 'forecourt', 'lanterns', 'training']) for (const slot of ['morning', 'afternoon', 'evening']) {
    const s = G.namedState(name); s.place = place; s.slot = slot;
    const types = G.actions(s).map((o) => o.action.type);
    for (const t of ['steal', 'pickpocket', 'bargain', 'barter', 'restitute']) assert.ok(!types.includes(t), `${name} ${place} ${slot}: ${t}`);
    assert.ok(!G.actions(s).some((o) => o.action.type === 'talk' && ['fenwick', 'edda', 'sela'].includes(o.action.who)));
  }
  for (const a of [{ type: 'restitute' }, { type: 'bargain', shop: 'mara', item: 'whetstone', arg: 'name' }, { type: 'barter', who: 'edda' }, { type: 'pickpocket', who: 'edda' }]) refused(G.namedState('day1-morning'), a, /version 2|not here|nobody/i);
});
