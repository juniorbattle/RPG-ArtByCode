// The town's actions of the version 2 (lot V4; the operator's decision AV-11 « Les trois, le vol avec ses conséquences », journal Passe V4):
// (haggling: tests/v2-law.test.mjs since lot L2a), a challenge in town that teaches a skill and takes a slot, a theft that is a real risk (easier at
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
const K = await load('/src/simulation/v2skills.ts');
/** the levels a challenge won leaves when its fighter teaches nothing: the sand's lesson alone (BL1-4, journal Passe BL3), the first blow of the plan raised */
const sand = (s) => { const l = { ...s.v2.kit.levels }, id = K.sandLessonSkill(s); if (id) l[id] += 1; return l; };

const v2 = (name = 'day1-morning') => G.makeV2(G.namedState(name));
const act = (st, a) => { const r = G.advance(st, a); assert.ok(r.ok, `${a.type}: ${r.reason}`); return r; };
const refused = (st, a, re) => { const r = G.advance(st, a); assert.equal(r.ok, false, a.type); if (re) assert.match(r.reason, re); };
const WIN = { winner: 'player', playerHp: 900, playerMaxHp: 2200, opponentHp: 0, opponentMaxHp: 3000, finisher: 'heavy' };
const LOSS = { winner: 'opponent', playerHp: 0, playerMaxHp: 2200, opponentHp: 900, opponentMaxHp: 3000, finisher: 'heavy' };

// (haggling for the day, lot V4, became a bargain put at the moment of buying in lot L2a: tests/v2-law.test.mjs)

test('stealing: easier at night and with a thin watch; taken, the cheapest piece not owned; caught, the fame, the fine, the door barred, the prices up — never a dead end', () => {
  const day = v2(), night = v2('day1-evening');
  assert.ok(T.stealChance(night, 'mara') > T.stealChance(day, 'mara'));
  // the rule written out: 0.3 by day, 0.7 at night (a shuttered stall forced), the watch's slack, the keeper's goodwill
  // (Mara's stall is shut at night: since lot L2a it is forced there, 0.7: tests/v2-law.test.mjs)
  const rule = (s) => Math.min(0.85, Math.max(0.05, (s.slot === 'evening' ? 0.7 : 0.3) + (60 - s.pulse.security) / 200 - (s.town.mara ?? 0) / 400));
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

test('a challenge (lot L2b, EV-3 / EV-4): put to a fighter who is there, a stake chosen, full health, once per phase, no wound; its bout takes a slot; won, the stake back twice and the skill learnt then raised', () => {
  // the fighters who teach train at the training ground (lot V5); Marek takes no challenge before the cut
  refused(act(v2(), { type: 'move', to: 'forecourt' }).state, { type: 'challenge', who: 'orla', stake: 'coins' }, /not here|not.*now|isn't|is not/i);
  let st = act(v2(), { type: 'move', to: 'training' }).state;
  refused(st, { type: 'challenge', who: 'marek', stake: 'coins' }, /Nobody to challenge/);
  const coins = st.player.coins, rep = st.player.reputation;
  st = act(st, { type: 'challenge', who: 'orla', stake: 'coins' }).state;
  assert.deepEqual(st.v2.challenge, { who: 'orla', day: 1, stake: 'coins' });
  assert.equal(st.player.coins, coins - 10, 'the coins on the table at once');
  refused(st, { type: 'challenge', who: 'ilse', stake: 'name' }, /waiting for you/);
  const sh = M.challengeSheetFor(st);
  assert.equal(sh.sides[1].fighters[0].id, 'orla'); assert.equal(sh.sides[1].fighters[0].mods.hp, 1, 'full health');
  const slot = st.slot, r = act(st, { type: 'challengeResult', outcome: WIN });
  assert.notEqual(r.state.slot, slot, 'a slot');
  assert.equal(r.state.v2.kit.levels.k_cry, 1); assert.equal(r.state.v2.challenge, undefined);
  assert.equal(r.state.player.coins, coins - 10 + 20, 'twice back'); assert.equal(r.state.player.reputation, rep);
  // once per phase: the same fighter again before the cut, refused; after it, once more, raised
  let s2 = structuredClone(r.state); s2.slot = 'morning'; s2.day = 3; refused(s2, { type: 'challenge', who: 'orla', stake: 'coins' }, /once before the cut/);
  s2.day = 7; s2 = act(s2, { type: 'challenge', who: 'orla', stake: 'name' }).state; s2 = act(s2, { type: 'challengeResult', outcome: WIN }).state;
  assert.equal(s2.v2.kit.levels.k_cry, 2); assert.equal(s2.player.reputation, rep + 5, 'the name staked, as much again');
  // lost: the stake gone, no wound, no skill
  let s3 = act(act(v2(), { type: 'move', to: 'training' }).state, { type: 'challenge', who: 'ilse', stake: 'name' }).state;
  s3 = act(s3, { type: 'challengeResult', outcome: LOSS }).state;
  assert.equal(s3.player.injury, 0); assert.equal(s3.v2.kit.levels.k_parry, undefined); assert.equal(s3.player.reputation, Math.max(0, rep - 5));
  // called off, the coins come back; never on the bout's afternoon
  const c4 = act(v2(), { type: 'move', to: 'forecourt' }).state, c0 = c4.player.coins;
  let s4 = act(c4, { type: 'challenge', who: 'vessa', stake: 'coins' }).state;
  s4 = act(s4, { type: 'cancelChallenge' }).state; assert.equal(s4.v2.challenge, undefined); assert.equal(s4.player.coins, c0);
  const bout = G.makeV2(G.namedState('day2-afternoon')); bout.place = 'training'; refused(bout, { type: 'challenge', who: 'orla', stake: 'name' }, /arena is waiting/);
  // a stake one cannot pay
  const poor = act(v2(), { type: 'move', to: 'training' }).state; poor.player.coins = 9; refused(poor, { type: 'challenge', who: 'orla', stake: 'coins' }, /10 coins/);
  // a generic fighter: on its rival's profile, a little weaker; teaches nothing
  const gs = act(act(v2(), { type: 'move', to: 'training' }).state, { type: 'challenge', who: 'aldric', stake: 'coins' }).state, gsh = M.challengeSheetFor(gs);
  assert.equal(gsh.sides[1].fighters[0].name, 'Ser Aldric Venn'); assert.equal(gsh.sides[1].fighters[0].profile, 'ilse'); assert.deepEqual(gsh.sides[1].fighters[0].mods, { hp: 0.9, damage: 0.95 });
  const gw = act(gs, { type: 'challengeResult', outcome: WIN }).state; assert.deepEqual(gw.v2.kit.levels, sand(gs), 'no skill of its own, the sand\'s lesson');
  // the challenge's duel is a version 2 duel the bot can fight to its end, the rival's and the generic's
  for (const s of [st, gs]) { const x = M.challengeSheetFor(s), d = M.v2SheetData(x, undefined, G.v2KitOf(s), VG.v2Mods(s)); assert.ok(B.runV2BotDuel(d.data, d.tiers, { skill: 0.6, seed: 3 }).winner); }
});

test('the three more generic fighters (GA-P1 to GA-P3 « Oui, ainsi », journal Passe GA3): each at its place and hour, on its rival\'s profile, teaching nothing of their own', () => {
  // the oracle, as the operator's lot sheet kept them: the swordmaster on the forecourt in the evening (Marek's profile), the spear champion on the quay by day
  // (Vessa's), the bare-handed fighter on the market hall's square in the morning (Tobin's); health and blows « proposés »
  const ORACLE = {
    lucan: { name: 'Lucan Rook', place: 'forecourt', slots: ['evening'], profile: 'marek', mods: { hp: 0.85, damage: 0.9 } },
    piers: { name: 'Piers Calloway', place: 'district', slots: ['morning', 'afternoon'], profile: 'vessa', mods: { hp: 0.9, damage: 0.95 } },
    kell: { name: 'Kell Barrow', place: 'lanterns', slots: ['morning'], profile: 'tobin', mods: { hp: 0.9, damage: 0.95 } },
  };
  for (const [who, o] of Object.entries(ORACLE)) {
    for (const slot of ['morning', 'afternoon', 'evening']) {
      const s = v2(); s.place = o.place; s.slot = slot; s.day = 3;
      const offer = G.actions(s).find((x) => x.action.type === 'challenge' && x.action.who === who && x.action.stake === 'coins');
      if (!o.slots.includes(slot)) { assert.ok(!offer?.ok, `${who} not there at ${slot}`); continue; }
      assert.ok(offer?.ok, `${who} at ${o.place} at ${slot}: ${offer?.reason}`);
      const st = act(s, offer.action).state, sh = M.challengeSheetFor(st), f = sh.sides[1].fighters[0];
      assert.equal(f.name, o.name); assert.equal(f.profile, o.profile); assert.deepEqual(f.mods, o.mods);
      const won = act(st, { type: 'challengeResult', outcome: WIN }).state;
      assert.deepEqual(won.v2.kit.levels, sand(st), `${who}: no skill of their own, the sand's lesson`); assert.equal(won.player.coins, s.player.coins + 10, `${who}: the stake back twice`);
      // the duel is a version 2 duel the bot can fight to its end
      const d = M.v2SheetData(sh, undefined, G.v2KitOf(st), VG.v2Mods(st)); assert.ok(B.runV2BotDuel(d.data, d.tiers, { skill: 0.6, seed: 3 }).winner, who);
    }
    // nowhere else
    const away = v2(); away.place = o.place === 'training' ? 'forecourt' : 'training'; away.slot = o.slots[0]; away.day = 3;
    assert.ok(!G.actions(away).some((x) => x.action.type === 'challenge' && x.action.who === who), `${who} only at ${o.place}`);
  }
  // today's game: none of them
  const def = G.namedState('day1-morning'); def.place = 'district';
  assert.ok(!G.actions(def).some((x) => x.action.type === 'talk' && ['lucan', 'piers', 'kell'].includes(x.action.who)));
});

test('from day 6, a rival out of the title (one of the cut\'s four others) takes a challenge on a day without a bout of theirs and teaches a skill of the catalogue', () => {
  const s = v2('day1-morning'); s.day = 7; s.place = 'training';
  for (const id of Object.keys(s.competitors)) s.competitors[id].phaseStatus = ['rhosk', 'tobin', 'marek', 'cassius'].includes(id) ? 'gate' : 'semi';
  s.competitors.vessa.phaseStatus = 'semi';
  const offered = G.actions(s).filter((o) => o.action.type === 'challenge' && o.ok).map((o) => o.action.who);
  assert.ok(offered.includes('rhosk') && offered.includes('tobin'), offered.join());
  const f = structuredClone(s); f.place = 'forecourt';
  // the three of the first day stay open to a challenge, in the title's race or out of it
  assert.ok(G.actions(f).some((o) => o.action.type === 'challenge' && o.action.who === 'vessa' && o.ok));
  const semi = structuredClone(f); semi.competitors.marek.phaseStatus = 'semi';
  assert.match(G.actions(semi).find((o) => o.action.type === 'challenge' && o.action.who === 'marek').reason, /the crown or a place to fight for/);
  assert.ok(G.actions(f).some((o) => o.action.type === 'challenge' && o.action.who === 'marek' && o.ok));
  // a bout of theirs that day: refused
  const fight = structuredClone(s); fight.tournament.matches.push({ round: 5, a: 'rhosk', b: 'tobin', winner: null, close: false, day: 7, seen: false, stage: 'gateFinal' });
  assert.match(G.actions(fight).find((o) => o.action.type === 'challenge' && o.action.who === 'rhosk').reason, /fights in the tournament today/);
  // won: Rhosk's sunder
  let w = act(s, { type: 'challenge', who: 'rhosk', stake: 'name' }).state; w = act(w, { type: 'challengeResult', outcome: WIN }).state;
  assert.equal(w.v2.kit.levels.k_sunder, 1);
  // before day 6 no rival but the three is offered
  const early = v2(); early.place = 'forecourt';
  assert.ok(!G.actions(early).some((o) => o.action.type === 'challenge' && o.action.who === 'marek'));
});

test('the default game offers none of it', () => {
  for (const name of Object.keys(G.NAMED_STATES).filter((n) => !G.NAMED_STATES[n].v2)) for (const place of ['district', 'forecourt', 'lanterns', 'training']) {
    const s = G.namedState(name); s.place = place;
    assert.ok(!G.actions(s).some((o) => ['bargain', 'steal', 'challenge', 'challengeResult', 'cancelChallenge'].includes(o.action.type)), `${name} ${place}`);
  }
  refused(G.namedState('day1-morning'), { type: 'steal', shop: 'mara' }, /version 2/);
});
