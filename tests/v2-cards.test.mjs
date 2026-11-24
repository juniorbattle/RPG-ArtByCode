// The winner's card (the operator's CL-2 « Version légère : deux cartes par victoire (stat, niveau de compétence, bourse) », his note « mais a determiner si on se limite que a
// 2 par victoire ? pk pas + ? », journal Passes CL1 / CV1; src/simulation/v2cards.ts): after each bout of the tournament the player wins, the cards the game's seed drew, one
// taken (a lasting point of a stat, a level of a skill of the four, the bout's purse again). The oracles are the decisions written out here, not the code's tables.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { load, ROOT } from './load.mjs';

const G = await load('/src/simulation/index.ts');
const C = await load('/src/simulation/v2cards.ts');
const GEAR = await load('/src/simulation/v2gear.ts');
const ST = await load('/src/combat/stats.ts');
const LAB = await load('/src/tournament/lab.ts');
const TODO = await load('/src/simulation/v2todo.ts');
const LM = await load('/src/ui/listModel.ts');
const T = await load('/src/narrative/text/index.ts');
const { EN } = await load('/src/narrative/text/en.ts');
const { FR_TEXTS } = await load('/src/narrative/text/fr-texts.ts');

const WIN = { winner: 'player', playerHp: 300, playerMaxHp: 300, opponentHp: 0, opponentMaxHp: 900, finisher: 'light' };
const LOSS = { winner: 'opponent', playerHp: 0, playerMaxHp: 300, opponentHp: 400, opponentMaxHp: 900, finisher: 'light' };
const act = (st, a) => { const r = G.advance(st, a); assert.ok(r.ok, `${a.type}: ${r.reason}`); return r; };
const refused = (st, a) => { const r = G.advance(st, a); assert.equal(r.ok, false, JSON.stringify(a)); return r.reason; };
const day2 = () => G.namedState('v2-day2-afternoon');
const keep = { ...C.CARD_RULES, stages: [...C.CARD_RULES.stages] }, keepPoint = ST.CARD.point;
const restore = () => { Object.assign(C.CARD_RULES, keep, { stages: [...keep.stages] }); ST.CARD.point = keepPoint; };
const kinds = (cs) => cs.map((c) => c.k);

test('the decisions: a card is a stat, a skill level or the purse; the four stats, never health; the training\'s level cap; the final offers none', () => {
  assert.deepEqual([...ST.STAT_CARDS], ['atk', 'def', 'end', 'viv']);
  assert.equal(C.CARD_RULES.levelCap, 3, 'a card goes no higher than the training (Master Corvin\'s lessons go further)');
  assert.deepEqual([...C.CARD_RULES.stages].sort(), ['gate', 'gateFinal', 'pool', 'semi', 'third'], 'every bout of the tournament but the final');
  assert.equal(C.cardId({ k: 'stat', stat: 'atk' }), 'stat:atk'); assert.equal(C.cardId({ k: 'skill', skill: 't1' }), 'skill:t1'); assert.equal(C.cardId({ k: 'purse', coins: 20 }), 'purse:20');
  assert.deepEqual(C.cardOf('stat:def'), { k: 'stat', stat: 'def' }); assert.equal(C.cardOf('stat:hp'), null, 'no health card'); assert.equal(C.cardOf('purse:x'), null); assert.equal(C.cardOf('nope'), null);
  // the skills page's cap is the card's cap
  assert.equal(C.CARD_RULES.levelCap, 3);
});

test('a bout of the tournament won offers the cards the seed draws, the same ones from the same state; a defeat, the final and today\'s game offer none', () => {
  const st = day2();
  assert.equal(st.v2.cards, undefined, 'no field before a bout is won: the fingerprint of a game that never wins one is the one of before');
  const a = act(st, { type: 'fight', outcome: WIN }), b = act(st, { type: 'fight', outcome: WIN });
  const o = a.state.v2.cards.offers[0];
  assert.equal(o.day, 2); assert.equal(o.foe, 'vessa'); assert.equal(o.stage, 'pool'); assert.equal(o.picks, 1); assert.equal(o.cards.length, C.CARD_RULES.offered);
  assert.deepEqual(a.state.v2.cards, b.state.v2.cards, 'the same state draws the same cards'); assert.equal(G.hash(a.state), G.hash(b.state));
  assert.ok(a.events.some((e) => e.id === 'cards:offered' && e.visible && /card/.test(e.text)), 'said in the log');
  // the purse card is the bout's purse (20 in the pool)
  const purse = o.cards.find((c) => c.k === 'purse'); if (purse) assert.equal(purse.coins, Math.round(20 * C.CARD_RULES.purse));
  // a defeat: no card
  const l = act(st, { type: 'fight', outcome: LOSS }); assert.equal(l.state.v2.cards, undefined);
  // the final (the player's bout of day 10): none
  const fin = G.namedState('v2-day2-afternoon'); fin.day = 10; fin.slot = 'afternoon';
  fin.tournament.matches = fin.tournament.matches.filter((m) => m.a !== 'player' && m.b !== 'player');
  fin.tournament.matches.push({ round: 0, a: 'player', b: 'marek', winner: null, close: false, day: 10, seen: true, stage: 'final' });
  const f = act(fin, { type: 'fight', outcome: WIN }); assert.equal(f.state.v2.cards, undefined, 'no bout follows the final');
  // today's game: nothing
  const old = G.namedState('day2-afternoon'); assert.ok(!old.flags.v2);
  const w = act(old, { type: 'fight', outcome: WIN }); assert.equal(w.state.v2, undefined); assert.ok(!w.events.some((e) => e.id.startsWith('cards')));
  assert.deepEqual(G.actions(w.state).filter((o2) => o2.action.type === 'takeCard'), []);
});

test('the draw: one card of each kind first, in a shuffled order, then a second round; no skill card when every skill of the four is at the cap; the purse card only with coins', () => {
  const base = day2();
  const draw = (n, mut = (s) => s, coins = 20) => { const s = structuredClone(base); mut(s); s.step = 7; return C.drawCards(s, n, coins); };
  for (let step = 0; step < 40; step++) {
    const s = structuredClone(base); s.step = step;
    const three = C.drawCards(s, 3, 20); assert.deepEqual(kinds(three), ['stat', 'skill', 'purse'], 'three cards: one of each kind, a stat first, then the skill, then the purse');
    const two = C.drawCards(s, 2, 20); assert.equal(two.length, 2); assert.notEqual(two[0].k, two[1].k, 'two cards: two kinds');
    const four = C.drawCards(s, 4, 20); assert.equal(four.length, 4); assert.equal(new Set(four.map(C.cardId)).size, 4, 'four distinct cards');
    for (const k of ['stat', 'skill', 'purse']) assert.ok(kinds(four).includes(k), `four cards: a ${k} among them`);
    assert.equal(C.drawCards(s, 1, 20).length, 1);
  }
  // the kinds' draws vary across steps (the stat, the skill)
  const seen = new Set(); for (let step = 0; step < 60; step++) { const s = structuredClone(base); s.step = step; for (const c of C.drawCards(s, 3, 20)) seen.add(C.cardId(c)); }
  for (const id of ['stat:atk', 'stat:def', 'stat:end', 'stat:viv', 'purse:20']) assert.ok(seen.has(id), `${id} is drawn`);
  assert.ok([...seen].filter((i) => i.startsWith('skill:')).length >= 3, 'each skill of the four is drawn');
  // every skill of the four at the cap: no skill card, a third card is a second stat
  const capped = draw(3, (s) => { for (const id of s.v2.kit.loadout) s.v2.kit.levels[id] = 3; });
  assert.deepEqual(kinds(capped), ['stat', 'stat', 'purse']);
  assert.deepEqual(draw(2, (s) => { for (const id of s.v2.kit.loadout) s.v2.kit.levels[id] = 3; }).map((c) => c.k).filter((k) => k === 'skill'), []);
  // a skill card names a skill of the four, never the heavy blow or one out of the four
  for (const c of draw(4)) if (c.k === 'skill') assert.ok(base.v2.kit.loadout.includes(c.skill) && c.skill !== 'heavy');
  // no coins, no purse card
  assert.ok(!draw(4, undefined, 0).some((c) => c.k === 'purse'));
});

test('taking a card: a lasting point of a stat, a skill a level higher (to the cap), the purse in the coins; the offer is over, a second take is refused', () => {
  const won = act(day2(), { type: 'fight', outcome: WIN }).state;
  const o = won.v2.cards.offers[0];
  const opts = G.actions(won).filter((x) => x.action.type === 'takeCard');
  assert.deepEqual(opts.map((x) => x.action.card), o.cards.map(C.cardId), 'a line per card of the offer, in its order'); assert.ok(opts.every((x) => x.ok && x.cost === 0 && x.coins === 0), 'no slot, no coin');
  for (const c of o.cards) {
    const r = act(won, { type: 'takeCard', card: C.cardId(c) }), s = r.state, id = C.cardId(c);
    assert.deepEqual(s.v2.cards.offers, [], 'the offer is over'); assert.deepEqual(s.v2.cards.taken, [id]); assert.equal(s.step, won.step + 1);
    assert.ok(r.events.some((e) => e.id === `cards:${c.k}` && e.visible), 'said');
    if (c.k === 'stat') {
      assert.equal(s.v2.cards.stats[c.stat], ST.CARD.point); const before = GEAR.v2Stats(won), after = GEAR.v2Stats(s);
      assert.equal(+(after[c.stat] - before[c.stat]).toFixed(2), ST.CARD.point, 'the stat is higher for every bout from now on'); assert.equal(C.cardStat(s, c.stat), ST.CARD.point);
      for (const k of ['atk', 'def', 'end', 'viv'].filter((k2) => k2 !== c.stat)) assert.equal(after[k], before[k]);
    } else if (c.k === 'skill') {
      assert.equal(s.v2.kit.levels[c.skill], won.v2.kit.levels[c.skill] + 1);
    } else {
      assert.equal(s.player.coins, won.player.coins + c.coins);
    }
    assert.match(refused(s, { type: 'takeCard', card: id }), /No winner's card is waiting/);
  }
  assert.match(refused(won, { type: 'takeCard', card: 'stat:nope' }), /not in the offer/);
  const absent = ['stat:atk', 'stat:def', 'stat:end', 'stat:viv'].find((i) => !o.cards.some((c) => C.cardId(c) === i));
  if (absent) assert.match(refused(won, { type: 'takeCard', card: absent }), /not in the offer/);
  // the training's cap: a skill that reached it meanwhile is no card any more
  const sk = o.cards.find((c) => c.k === 'skill');
  if (sk) {
    const capped = structuredClone(won); capped.v2.kit.levels[sk.skill] = 3;
    assert.ok(!G.actions(capped).some((x) => x.action.type === 'takeCard' && x.action.card === C.cardId(sk)), 'no line for a skill at the cap');
    assert.match(refused(capped, { type: 'takeCard', card: C.cardId(sk) }), /already at level 3/);
  }
});

test('the offer waits: it blocks nothing, it waits across the slots and days, and the next win queues another; picks above one keep the offer until they are taken', () => {
  try {
    const won = act(day2(), { type: 'fight', outcome: WIN }).state;
    // a slot, a day later: still there; any other action allowed
    let s = act(won, { type: 'wait' }).state; s = act(s, { type: 'wait' }).state;
    assert.equal(C.cardsWaiting(s), 1); assert.ok(G.actions(s).some((x) => x.action.type === 'takeCard' && x.ok));
    // the todo's line, first after the bout; the list's group first
    const todo = TODO.todoHere(s); assert.ok(todo.some((t) => t.kind === 'card' && t.key === `card:${C.pendingOffer(s).day}`), 'the list\'s count holds it');
    assert.equal(LM.hereGroup('takeCard'), 'card');
    // two picks of the offer
    C.CARD_RULES.picks = 2; C.CARD_RULES.offered = 4;
    const two = act(day2(), { type: 'fight', outcome: WIN }).state, o = two.v2.cards.offers[0];
    assert.equal(o.picks, 2); assert.equal(o.cards.length, 4);
    const first = act(two, { type: 'takeCard', card: C.cardId(o.cards[0]) }).state;
    assert.equal(first.v2.cards.offers.length, 1); assert.equal(first.v2.cards.offers[0].picks, 1); assert.equal(first.v2.cards.offers[0].cards.length, 3);
    const second = act(first, { type: 'takeCard', card: C.cardId(o.cards[1]) }).state;
    assert.equal(second.v2.cards.offers.length, 0); assert.equal(second.v2.cards.taken.length, 2);
    assert.match(T.tx('v2.card.offeredN', { n: 4, picks: 2 }), /choose 2 of 4/);
  } finally { restore(); }
});

test('the offer is part of the fingerprint and the save: a reload keeps it, an old save without the field is read as it was', () => {
  const won = act(day2(), { type: 'fight', outcome: WIN }).state, back = G.deserialize(G.serialize(won));
  assert.equal(G.hash(back), G.hash(won)); assert.deepEqual(back.v2.cards, won.v2.cards);
  const taken = act(won, { type: 'takeCard', card: C.cardId(won.v2.cards.offers[0].cards[0]) }).state;
  assert.equal(G.hash(G.deserialize(G.serialize(taken))), G.hash(taken));
  // a save of before: no field, the same hash after a reload, the stats of before
  const old = day2(); assert.equal(old.v2.cards, undefined);
  assert.equal(G.hash(G.deserialize(G.serialize(old))), G.hash(old)); assert.equal(C.cardStat(old, 'atk'), 0); assert.equal(C.cardsWaiting(old), 0); assert.equal(C.pendingOffer(old), null);
  // a game that wins nothing carries no field all through
  let s = G.makeV2(G.newGame(5, 'Ren'));
  for (let i = 0; i < 80 && !s.over; i++) { const bout = s.slot === 'afternoon' && s.tournament.matches.some((m) => m.day === s.day && !m.winner && (m.a === 'player' || m.b === 'player')); s = act(s, bout ? { type: 'fight', outcome: LOSS } : { type: 'wait' }).state; }
  assert.equal(s.v2.cards, undefined);
});

test('the words in both languages: every key of the cards is in both tables with the same slots; a tile says its kind, its card and what it does', () => {
  const keys = Object.keys(EN).filter((k) => /^(v2\.card\.|ui\.card\.|ui\.group\.card|ui\.todo\.card|tut\.hint\.card|tut\.ch\.prepare\.cards)/.test(k));
  assert.ok(keys.length >= 28, `${keys.length} keys`);
  const slots = (t) => [...t.matchAll(/\{(\w+)(?:\|\w+)?\}/g)].map((m) => m[1]).sort().join();
  for (const k of keys) { assert.ok(FR_TEXTS[k], `${k} in French`); assert.equal(slots(FR_TEXTS[k]), slots(EN[k]), `${k}: the same slots`); }
  const won = act(day2(), { type: 'fight', outcome: WIN }).state;
  for (const c of won.v2.cards.offers[0].cards) {
    const title = C.cardTitle(won, c), line = C.cardLine(won, c);
    assert.ok(title.length > 3 && line.length > 20 && !/[{}]/.test(title + line), `${C.cardId(c)}: ${title} / ${line}`);
  }
  // the French says the card too (a game in French keeps the state: tx runs in English inside advance)
  assert.match(FR_TEXTS['v2.card.took.stat'], /pour de bon/); assert.match(FR_TEXTS['v2.card.maxed'], /niveau \{cap\}/);
  assert.equal(EN['v2.card.title.stat'], '{stat} +{n}');
});

test('the laboratory\'s players take the card: the planner, the reference and the curious one; the idle and the diligent never; each model takes a card of its kind', () => {
  const won = act(day2(), { type: 'fight', outcome: WIN }).state, keepPick = LAB.LAB_CARDS.pick;
  try {
    for (const pick of ['rank', 'random', 'stat', 'skill', 'purse', 'best']) {
      LAB.LAB_CARDS.pick = pick;
      const a = LAB.labCard(won); assert.ok(a && a.type === 'takeCard', `${pick} takes a card`);
      const kind = C.cardOf(a.card).k;
      if (pick === 'stat') assert.equal(kind, 'stat'); if (pick === 'skill' || pick === 'rank') assert.equal(kind, 'skill'); if (pick === 'purse') assert.equal(kind, 'purse');
      assert.deepEqual(LAB.labCard(won), a, `${pick}: the same state, the same card`);
      for (const p of ['planner', 'reference', 'curious']) assert.deepEqual(LAB.POLICIES[p].choose(won), a, `${p} takes it first`);
    }
    LAB.LAB_CARDS.pick = 'none'; assert.equal(LAB.labCard(won), null);
    LAB.LAB_CARDS.pick = 'random';
    for (const p of ['idle', 'diligent']) assert.notEqual(LAB.POLICIES[p].choose(won).type, 'takeCard', `${p} leaves the card`);
    assert.equal(LAB.labCard(day2()), null, 'no offer, no card');
  } finally { LAB.LAB_CARDS.pick = keepPick; }
  // a whole game of the planner: deterministic with its cards, and it takes them
  const g1 = LAB.autoplay(3, LAB.POLICIES.planner, 'Ren', 320, 'v2'), g2 = LAB.autoplay(3, LAB.POLICIES.planner, 'Ren', 320, 'v2');
  assert.equal(g1.hash, g2.hash); assert.ok((g1.state.v2.cards?.taken.length ?? 0) >= 2, 'the planner took cards');
});

test('the pages: the result page draws the row and takes the pick through the game; the list holds the card first; a hint and a guide line say it; the number keys and the arrows are the row\'s', () => {
  const src = (f) => fs.readFileSync(`${ROOT}/${f}`, 'utf8').replace(/\r\n/g, '\n');
  const arena = src('src/ui/playArena.ts'), page = src('src/ui/cardsPage.ts'), town = src('src/ui/townUi.ts'), tut = src('src/ui/tutorial.ts'), todo = src('src/ui/todo.ts');
  assert.match(arena, /offered = \(res\.events as Array<\{ id: string \}>\)\.some\(\(e\) => e\.id === 'cards:offered'\), offer = won && v2 && offered \? pendingOffer\(st\) : null;/, 'a result that just offered cards, a bout\'s or a challenge\'s');
  assert.match(arena, /mountCards\(\{ slot: o\.root\.querySelector<HTMLElement>\('\.pm-cards-slot'\)!/);
  assert.match(arena, /e\.id !== 'cards:offered'/, 'the log line is not said twice on the page');
  assert.match(page, /act\(\{ type: 'takeCard', card: id \}\)/); assert.match(page, /\/\^\[1-9\]\$\/\.test\(e\.key\)/, 'the number keys');
  assert.match(page, /ArrowRight/); assert.match(page, /ArrowLeft/);  assert.match(src('src/ui/style.ts'), /\.pm-cardrow\{/);
  assert.match(town, /if \(g\.card\.length\) \{ title\('ui\.group\.card'\)/); assert.match(town, /cardsWaiting\(s\) > 0\) this\.hint\('card'\)/);
  assert.match(town, /o\.action\.type !== 'takeCard'\)/, 'no « free » tag on a card line');
  assert.match(tut, /card: \{ title: 'tut\.hint\.card\.title'/); assert.match(tut, /tut\.ch\.prepare\.cards/); assert.match(todo, /ui\.todo\.card/);
  // the guide's line reads the numbers from the data (TU-6): no digit of its own
  for (const k of ['tut.hint.card.body', 'tut.ch.prepare.cards']) { assert.doesNotMatch(EN[k], /\d/, k); assert.doesNotMatch(FR_TEXTS[k], /\d/, k); }
});

test('a challenge won in town (the operator\'s CV-3, journal Passe CV3) offers three cards of stats alone, one taken; a challenge lost, a thief caught, a piece taken by force and a reprisal offer none', () => {
  const v2 = () => G.makeV2(G.namedState('day1-morning'));
  const challenge = (win) => { let st = act(v2(), { type: 'move', to: 'training' }).state; st = act(st, { type: 'challenge', who: 'orla', stake: 'coins' }).state; return { st, r: act(st, { type: 'challengeResult', outcome: win ? WIN : LOSS }) }; };
  assert.equal(C.CARD_RULES.challengeOffered, 3, 'the operator\'s « uniquement 3 cartes de la famille des stats »');
  const { st, r: won } = challenge(true), o = won.state.v2.cards.offers[0];
  assert.equal(o.stage, 'challenge'); assert.equal(o.foe, 'orla'); assert.equal(o.picks, 1, 'one taken (CV-2)');
  assert.equal(o.cards.length, 3); assert.ok(o.cards.every((c) => c.k === 'stat'), 'stats alone: no skill, no purse');
  assert.equal(new Set(o.cards.map(C.cardId)).size, 3, 'three of the four stats');
  assert.ok(won.events.some((e) => e.id === 'cards:offered' && e.visible), 'said in the log');
  assert.deepEqual(act(st, { type: 'challengeResult', outcome: WIN }).state.v2.cards, won.state.v2.cards, 'the same state draws the same cards');
  // one taken: a lasting point of the stat
  const take = act(won.state, { type: 'takeCard', card: C.cardId(o.cards[0]) }).state;
  assert.equal(take.v2.cards.stats[o.cards[0].stat], ST.CARD.point); assert.deepEqual(take.v2.cards.offers, []);
  // the challenge's own prizes stay (the skill, the stake)
  assert.ok(won.state.player.coins > st.player.coins, 'the stake given back twice');
  // a challenge lost: none
  assert.equal(challenge(false).r.state.v2.cards, undefined);
  // the other fights on the sand: none (a thief caught, a piece by force, a reprisal)
  const caught = v2(); caught.v2.challenge = { who: 'mara', day: 1, kind: 'caught', caught: { by: 'mara', from: 'mara', item: 'whetstone', fine: 15, shop: 'mara' } };
  assert.equal(act(caught, { type: 'challengeResult', outcome: WIN }).state.v2.cards, undefined, 'a thief caught');
  const seize = v2(); seize.v2.challenge = { who: 'edda', day: 1, kind: 'seize' };
  assert.equal(act(seize, { type: 'challengeResult', outcome: WIN }).state.v2.cards, undefined, 'a piece taken by force');
  const reprisal = v2(); reprisal.v2.challenge = { who: 'corra', day: 1, reprisal: true }; reprisal.v2.reprisal = { by: 'corra', until: 3 };
  assert.equal(act(reprisal, { type: 'challengeResult', outcome: WIN }).state.v2.cards, undefined, 'a reprisal');
  // in the source: the offer comes after the early returns of the kinds that are no challenge
  const src = fs.readFileSync(`${ROOT}/src/simulation/v2town.ts`, 'utf8').replace(/\r\n/g, '\n'), at = src.indexOf('offerChallengeCards(s, who, emit);');
  assert.ok(at > src.indexOf("if (ch.kind === 'encounter')") && at > src.indexOf("if (ch.kind === 'seize')") && at > src.indexOf('if (ch.reprisal)') && at > src.indexOf("if (ch.kind === 'caught')"), 'after the four early returns');
  // the page: a result that just offered shows the tiles, an older offer left for later does not
  assert.match(fs.readFileSync(`${ROOT}/src/ui/playArena.ts`, 'utf8'), /offered = \(res\.events as Array<\{ id: string \}>\)\.some\(\(e\) => e\.id === 'cards:offered'\), offer = won && v2 && offered \? pendingOffer\(st\) : null/);
  assert.match(T.tx('prep.challenge.cards', { n: 3 }), /3 cards of stats/); assert.match(FR_TEXTS['prep.challenge.cards'], /cartes de statistique/);
});
