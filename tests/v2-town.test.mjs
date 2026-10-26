// The town's actions of the version 2 (lot V4; the operator's decision AV-11 « Les trois, le vol avec ses conséquences », journal Passe V4):
// haggling by reputation and goodwill, a challenge in town that teaches a skill and takes a slot, a theft that is a real risk (easier at
// night) with consequences and always a way out. Each changes a real state. The default game offers none of them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';

const G = await load('/src/simulation/index.ts');
const T = await load('/src/simulation/v2town.ts');
const VG = await load('/src/simulation/v2gear.ts');
const M = await load('/src/combat/match.ts');
const V = await load('/src/combat/v2duel.ts');
const B = await load('/src/combat/bot.ts');

const v2 = (name = 'day1-morning') => G.makeV2(G.namedState(name));
const act = (st, a) => { const r = G.advance(st, a); assert.ok(r.ok, `${a.type}: ${r.reason}`); return r; };
const refused = (st, a, re) => { const r = G.advance(st, a); assert.equal(r.ok, false, a.type); if (re) assert.match(r.reason, re); };
const WIN = { winner: 'player', playerHp: 900, playerMaxHp: 2200, opponentHp: 0, opponentMaxHp: 3000, finisher: 'heavy' };
const LOSS = { winner: 'opponent', playerHp: 0, playerMaxHp: 2200, opponentHp: 900, opponentMaxHp: 3000, finisher: 'heavy' };

test('haggling: once a day per shop, its chance by reputation and goodwill; a bargain of 15 % for the day, or a tenth more and the goodwill down', () => {
  const st = v2();
  assert.equal(T.haggleChance(st, 'mara'), Math.min(0.85, Math.max(0.1, 0.25 + 10 / 200)));
  const rich = structuredClone(st); rich.player.reputation = 100; rich.town.mara = 100; assert.equal(T.haggleChance(rich, 'mara'), 0.85);
  const poor = structuredClone(st); poor.player.reputation = 0; poor.town.mara = -100; assert.equal(T.haggleChance(poor, 'mara'), 0.1);
  let deals = 0, sours = 0;
  for (let seed = 1; seed <= 60; seed++) {
    const s = G.makeV2(G.newGame(seed, 'Ren')), before = VG.shopPrice(s, 'mara', 'imported-blade');
    const r = act(s, { type: 'haggle', shop: 'mara' }), after = VG.shopPrice(r.state, 'mara', 'imported-blade');
    if (r.events[0].id === 'haggle:deal') { deals++; assert.equal(after, Math.round(30 * 0.85 * (1 - 10 / 400))); }
    else { sours++; assert.equal(after, Math.round(30 * 1.1 * (1 - 10 / 400))); assert.equal(r.state.town.mara, -4); }
    assert.ok(before === Math.round(30 * (1 - 10 / 400)));
    refused(r.state, { type: 'haggle', shop: 'mara' }, /haggled here today/);
    // the next day the price is the list's again
    const next = structuredClone(r.state); next.day = 2; assert.equal(VG.shopPrice(next, 'mara', 'imported-blade'), Math.round(30 * (1 - 10 / 400) * (r.events[0].id === 'haggle:sour' ? 1 : 1)));
  }
  assert.ok(deals > 10 && sours > 20, `${deals} bargains, ${sours} grudges at a chance of 0.3`);
});

test('stealing: easier at night and with a thin watch; taken, the cheapest piece not owned; caught, the fame, the fine, the door barred, the prices up — never a dead end', () => {
  const day = v2(), night = v2('day1-evening');
  assert.ok(T.stealChance(night, 'mara') > T.stealChance(day, 'mara'));
  // the rule written out: 0.3 by day, 0.6 at night, the watch's slack, the keeper's goodwill
  const rule = (s) => Math.min(0.85, Math.max(0.05, (s.slot === 'evening' ? 0.6 : 0.3) + (60 - s.pulse.security) / 200 - (s.town.mara ?? 0) / 400));
  for (const s of [day, night]) assert.equal(T.stealChance(s, 'mara'), rule(s));
  const thin = structuredClone(day); thin.pulse.security = 20; assert.ok(T.stealChance(thin, 'mara') > T.stealChance(day, 'mara'));
  assert.equal(T.stealTarget(day, 'mara'), 'whetstone');
  let ok = 0, caught = 0;
  for (let seed = 1; seed <= 60; seed++) {
    const s = G.makeV2(G.newGame(seed, 'Ren')), coins = s.player.coins, rep = s.player.reputation;
    const r = act(s, { type: 'steal', shop: 'mara' }), st = r.state;
    if (r.events[0].id === 'steal:ok') { ok++; assert.ok(st.player.items.includes('whetstone')); assert.equal(st.player.coins, coins); }
    else {
      caught++;
      assert.equal(st.player.coins, coins - 15); assert.equal(st.player.reputation, rep - 8); assert.equal(st.town.mara, -20);
      refused(st, { type: 'shopBuy', shop: 'mara', item: 'whetstone' }, /will not serve you/);
      refused(st, { type: 'steal', shop: 'mara' }, /will not serve you/);
      // the way out: the other districts' shops are open; the next day the door opens again, the prices a quarter up
      const fore = structuredClone(st); fore.place = 'forecourt'; fore.player.coins = 99;
      assert.ok(G.actions(fore).some((o) => o.action.type === 'shopBuy' && o.ok));
      const next = structuredClone(st); next.day = 2; next.player.coins = 99;
      assert.equal(VG.shopPrice(next, 'mara', 'whetstone'), Math.round(8 * (1 - st.player.reputation / 400) * 1.25));
      assert.ok(G.actions(next).some((o) => o.action.type === 'shopBuy' && o.action.item === 'whetstone' && o.ok));
      assert.ok(!st.over && st.slot === 'morning', 'no jail: the slot goes on');
    }
  }
  assert.ok(ok > 5 && caught > 20, `${ok} taken, ${caught} caught by day`);
  // a purse too thin for the fine: what it holds, and the name pays the rest
  const broke = v2(); broke.player.coins = 4;
  for (let seed = 1; seed < 40; seed++) { const s = G.makeV2(G.newGame(seed, 'Ren')); s.player.coins = 4; const r = act(s, { type: 'steal', shop: 'mara' }); if (r.events[0].id === 'steal:caught') { assert.equal(r.state.player.coins, 0); assert.equal(r.state.player.reputation, Math.max(0, 10 - 12)); break; } }
});

test('a challenge: put to a fighter who is there, no bout that afternoon, one at a time and once a day; its bout takes a slot; won, the skill learnt then raised', () => {
  // the fighters who teach train at the training ground (lot V5); Marek teaches nothing
  refused(act(v2(), { type: 'move', to: 'forecourt' }).state, { type: 'challenge', who: 'orla' }, /not here|not.*now|isn't|is not/i);
  let st = act(v2(), { type: 'move', to: 'training' }).state;
  refused(st, { type: 'challenge', who: 'marek' }, /Nobody to challenge/);
  st = act(st, { type: 'challenge', who: 'orla' }).state;
  assert.deepEqual(st.v2.challenge, { who: 'orla', day: 1 });
  refused(st, { type: 'challenge', who: 'ilse' }, /waiting for you/);
  const sh = M.challengeSheetFor(st);
  assert.equal(sh.sides[1].fighters[0].id, 'orla'); assert.equal(sh.sides[1].fighters[0].mods.hp, 0.5);
  const slot = st.slot, r = act(st, { type: 'challengeResult', outcome: WIN });
  assert.notEqual(r.state.slot, slot, 'a slot');
  assert.equal(r.state.v2.kit.levels.k_cry, 1); assert.equal(r.state.v2.challenge, undefined); assert.equal(r.state.player.reputation, st.player.reputation + 3);
  // the same day: refused; the next day: won again, raised
  let s2 = r.state; s2.slot = 'morning'; refused(s2, { type: 'challenge', who: 'orla' }, /fought you today/);
  s2.day = 2; s2 = act(s2, { type: 'challenge', who: 'orla' }).state; s2 = act(s2, { type: 'challengeResult', outcome: WIN }).state;
  assert.equal(s2.v2.kit.levels.k_cry, 2);
  // lost: a lesson, no wound, no skill
  let s3 = act(act(v2(), { type: 'move', to: 'training' }).state, { type: 'challenge', who: 'ilse' }).state;
  s3 = act(s3, { type: 'challengeResult', outcome: LOSS }).state;
  assert.equal(s3.player.injury, 0); assert.equal(s3.v2.kit.levels.k_parry, undefined);
  // called off, and never on the bout's afternoon
  let s4 = act(act(v2(), { type: 'move', to: 'forecourt' }).state, { type: 'challenge', who: 'vessa' }).state;
  s4 = act(s4, { type: 'cancelChallenge' }).state; assert.equal(s4.v2.challenge, undefined);
  const bout = G.makeV2(G.namedState('day2-afternoon')); bout.place = 'training'; refused(bout, { type: 'challenge', who: 'orla' }, /arena is waiting/);
  // the challenge's duel is a version 2 duel the bot can fight to its end
  const d = M.v2SheetData(sh, undefined, G.v2KitOf(st), VG.v2Mods(st));
  assert.ok(B.runV2BotDuel(d.data, d.tiers, { skill: 0.6, seed: 3 }).winner);
});

test('the default game offers none of it', () => {
  for (const name of Object.keys(G.NAMED_STATES).filter((n) => !G.NAMED_STATES[n].v2)) for (const place of ['district', 'forecourt', 'lanterns', 'training']) {
    const s = G.namedState(name); s.place = place;
    assert.ok(!G.actions(s).some((o) => ['haggle', 'steal', 'challenge', 'challengeResult', 'cancelChallenge'].includes(o.action.type)), `${name} ${place}`);
  }
  refused(G.namedState('day1-morning'), { type: 'steal', shop: 'mara' }, /version 2/);
});
