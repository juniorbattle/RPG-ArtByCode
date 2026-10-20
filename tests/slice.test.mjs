// The vertical slice, checked from what the games log (journal Passe L5): three scripted games (careful, careless, losing) played to the end
// headless, the player's bouts fought by the bot in the arena's full simulation; every requirement of GAMEPLAY_MASTER_CONTRACT § 13 and
// PROJECT_MASTER_CONTRACT § 14 that a headless run can show is ticked from their states and events. The rest (captures on desktop and phone,
// the GPU budget) is proved in the browser and on the operator's machine (journal, Passes L4 / L7).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';

const G = await load('/src/simulation/index.ts');
const L = await load('/src/tournament/lab.ts');
const { EVENTS } = await load('/src/events/catalog.ts');
const { matchSheetFor, sheetData } = await load('/src/combat/match.ts');
const { RIVALS } = await load('/src/narrative/roster.ts');

const SEEDS = [1842, 7719, 30417];

/** a game, with the state before every action (the looks it showed, the bouts' data) */
function play(script, seed) {
  const p = L.SCRIPTS[script]();
  let st = G.newGame(seed, 'Aster');
  const states = [st], actions = [], sheets = [];
  for (let i = 0; i < 200 && !st.over; i++) {
    const a = p.choose(st);
    if (a.type === 'fight') sheets.push({ sheet: matchSheetFor(st), data: sheetData(matchSheetFor(st)) });
    const r = G.advance(st, a);
    assert.ok(r.ok, `${script}: ${a.type} refused on day ${st.day} ${st.slot}: ${r.reason}`);
    st = r.state; states.push(st); actions.push(a);
  }
  return { st, states, actions, sheets, ids: new Set(st.log.map((e) => e.id)) };
}

const games = Object.fromEntries(Object.keys(L.SCRIPTS).flatMap((n) => SEEDS.map((s) => [`${n}:${s}`, play(n, s)])));
const all = Object.values(games);
const of = (n) => SEEDS.map((s) => games[`${n}:${s}`]);

test('3 playable days, 9 slots, to the end of the slice (every game)', () => {
  for (const g of all) {
    assert.ok(g.st.over && g.st.day === 3);
    const slots = new Set(g.states.map((s) => `${s.day}:${s.slot}`));
    assert.equal(slots.size, 9);
    assert.ok(g.ids.has('slice-over'));
  }
});

test('day and night alternate and change the possibilities: the four looks, services and people by the hour', () => {
  for (const g of all) assert.deepEqual([...new Set(g.states.map((s) => G.lookOf(s)))].sort(), ['afternoon', 'midday', 'morning', 'night']);
  const night = G.namedState('day1-evening'), day = G.namedState('day1-morning');
  assert.equal(G.advance(night, { type: 'buy', item: 'whetstone' }).ok, false);
  assert.equal(G.advance(night, { type: 'talk', who: 'bram' }).ok, false);
  assert.ok(G.advance(night, { type: 'talk', who: 'stranger' }).ok);
  assert.ok(G.advance(day, { type: 'talk', who: 'bram' }).ok);
});

test('2 official 1v1 bouts (in every game), won and lost across the games; a defeat never ends the tournament', () => {
  for (const g of all) {
    const fights = g.st.log.filter((e) => e.id === 'player-won' || e.id === 'player-lost');
    assert.equal(fights.length, 2);
    for (const s of g.sheets) assert.deepEqual(s.sheet.sides.map((x) => x.fighters.length), [1, 1]);
  }
  const outcomes = new Set(all.flatMap((g) => g.st.log.filter((e) => e.id === 'player-won' || e.id === 'player-lost').map((e) => e.id)));
  assert.deepEqual([...outcomes].sort(), ['player-lost', 'player-won']);
  for (const g of of('losing')) { assert.equal(g.st.tournament.matches.filter((m) => m.winner === 'player').length, 0); assert.ok(g.st.over); }
});

test('a future recruit introduced (Orla Brask), and recruitable in the careful game', () => {
  for (const g of of('careful')) assert.ok(g.st.facts.includes('orla-introduced') && g.st.facts.includes('orla-recruitable'));
});

test('a quest changes a bout: the steel cargo\'s tempered blade raises the player\'s damage in the bout after it', () => {
  for (const g of of('careful')) {
    assert.equal(g.st.quests.cargo, 'done');
    const after = g.sheets.find((s) => s.sheet.sides[0].fighters[0].mods.damage >= 1.15);
    assert.ok(after, 'a bout fought with the tempered blade');
    assert.ok(after.data.actions.light.damage > 10);
  }
});

test('a counterable sabotage: signs first, foiled by the careful game\'s watch, suffered by the careless one, its culprit found after', () => {
  for (const g of of('careful')) {
    const seq = (id) => g.st.log.find((e) => e.id === id)?.seq ?? -1;
    assert.ok(seq('sign-lamp-oil') >= 0 && seq('sign-loiterer') > seq('sign-lamp-oil') && seq('forge-sabotage') > seq('sign-loiterer'));
    assert.ok(g.st.facts.includes('saboteur-caught'), 'the watch paid: foiled'); assert.equal(g.st.services.forge, 'open');
  }
  for (const g of of('careless')) {
    assert.ok(g.st.facts.includes('forge-burned')); assert.equal(g.st.flags['culprit-known'], 'cassius'); assert.ok(g.st.flags.reported);
  }
  for (const g of of('losing')) assert.ok(!g.ids.has('forge-sabotage'), 'no cause, no attempt: the losing player is nobody\'s threat');
});

test('a city service changed by a consequence (the forge), and the shop affected by it, with a designed alternative', () => {
  for (const g of of('careless')) {
    assert.equal(g.st.services.forge, 'sabotaged');
    assert.equal(g.st.services.shopFactor, 1.4);
    const buy = g.st.log.find((e) => e.id === 'buy:imported-blade');
    assert.ok(buy && /forge burned/.test(buy.cause), 'the merchant\'s blade, bought at the shortage\'s price, says why');
    assert.ok(g.st.player.items.includes('imported-blade'));
  }
});

test('competitors move off screen: every rival is logged every day, their states change, matches are played without the player', () => {
  for (const g of all) {
    assert.deepEqual(L.forgotten(g.st), []);
    for (const id of Object.keys(RIVALS)) assert.notDeepEqual(g.st.competitors[id], G.newGame(g.st.seed, 'Aster').competitors[id], id);
    assert.equal(g.st.tournament.matches.filter((m) => !m.seen && m.winner).length, 6);
  }
});

test('saves and loads: a save reloaded before every action gives the same game; the simulation is deterministic', () => {
  for (const [name, g] of Object.entries(games)) {
    let st = G.newGame(g.st.seed, 'Aster');
    for (const a of g.actions) st = G.advance(G.deserialize(G.serialize(st)), a).state;
    assert.equal(G.hash(st), G.hash(g.st), name);
    const again = play(name.split(':')[0], g.st.seed);
    assert.equal(G.hash(again.st), G.hash(g.st));
  }
});

test('at least 12 configurable events fire across the three games, of every type; the important ones carry a cause', () => {
  const fired = new Set(all.flatMap((g) => g.st.log.filter((e) => EVENTS.some((x) => x.id === e.id)).map((e) => e.id)));
  assert.ok(fired.size >= 12, `${fired.size} events fired: ${[...fired].join(', ')}`);
  assert.deepEqual([...new Set(EVENTS.filter((e) => fired.has(e.id)).map((e) => e.type))].sort(), ['district', 'faction', 'global', 'personal', 'targeted', 'tournament']);
  for (const g of all) for (const e of g.st.log.filter((x) => x.kind === 'consequence' || x.kind === 'sign')) assert.ok(e.cause && e.cause.length > 3, e.id);
});

test('several persistent rivals, places changed (navigation), a 1v1 combat extensible to teams', () => {
  for (const g of all) {
    assert.equal(Object.keys(g.st.competitors).length, 7);
    assert.ok(Object.values(g.st.competitors).every((c) => c.knownFacts.length > 0 || c.preparation > 20), 'each rival has a history');
  }
  const places = new Set(all.flatMap((g) => g.states.map((s) => s.place)));
  assert.ok(places.size >= 2, `places: ${[...places].join(', ')}`);
  const sh = all[0].sheets[0].sheet;
  assert.throws(() => sheetData({ ...sh, sides: [sh.sides[0], { fighters: [...sh.sides[1].fighters, ...sh.sides[1].fighters] }] }), /team formats/);
});
