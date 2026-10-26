// The version 2's coherence outside combat (journal Passe VP1): its ten days told as they are (the board, the clerk, the townsfolk, the
// refusals, the bracket's defeats), the events in their order (the heralds and the Colosseum's roar on the days of bouts, the signs strictly
// before the attempt they announce), the bracket giving no pool points, the festival square's people and its rain, the TournamentLab's
// policy on the version 2's places. Today's game keeps today's words and events (its lab output is the frozen main's: journal Passe VP1).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { load } from './load.mjs';

const G = await load('/src/simulation/index.ts');
const E = await load('/src/events/engine.ts');
const CAT = await load('/src/events/catalog.ts');
const V = await load('/src/events/v2catalog.ts');
const C = await load('/src/tournament/v2calendar.ts');
const POOL = await load('/src/tournament/pool.ts');
const D = await load('/src/narrative/dialogue.ts');
const P = await load('/src/narrative/people.ts');
const B = await load('/src/ui/board.ts');
const L = await load('/src/tournament/lab.ts');
const VS = await load('/src/simulation/v2skills.ts');
const { slotNumber, POINTS } = { ...(await load('/src/simulation/state.ts')), ...(await load('/src/narrative/roster.ts')) };
const { Rng } = await load('/src/core/rng.ts');
const { computePulse } = await load('/src/tournament/pulse.ts');

const v2 = (name = 'day1-morning') => G.makeV2(G.namedState(name));
const byId = Object.fromEntries([...CAT.EVENTS, ...V.V2_EVENTS].map((e) => [e.id, e]));
const run = (s, ids) => { const out = []; E.runEvents(s, s.pulse, (e) => { out.push(e); return e; }, new Rng(1), ids.map((id) => byId[id])); return out.map((e) => e.id); };
const games = Object.fromEntries([1, 7, 30].map((seed) => [seed, L.autoplay(seed, L.POLICIES.idle, 'Ren', 600, 'v2')]));
const diligent = L.autoplay(4, L.POLICIES.diligent, 'Ren', 600, 'v2');

test('the signs come strictly before the attempt they announce: a slot at least between each, to answer them', () => {
  // firedBefore: an event of an earlier slot, never of this one
  const s = v2(); s.day = 4; s.slot = 'afternoon';
  assert.equal(E.holds({ firedBefore: 'x' }, s, s.pulse), false);
  s.flags['ev:x'] = slotNumber(s); assert.equal(E.holds({ firedBefore: 'x' }, s, s.pulse), false);
  s.flags['ev:x'] = slotNumber(s) - 1; assert.equal(E.holds({ firedBefore: 'x' }, s, s.pulse), true);
  // the chain in one slot: only the first sign; the next slot the second; the attempt only after both, the night before a bout of the bracket
  const c = v2(); c.competitors.cassius.relationships.player = -40; c.day = 4; c.slot = 'afternoon'; c.tournament.points.player = 9;
  assert.deepEqual(run(c, ['v2-sign-armourer', 'v2-sign-locker', 'v2-gear-tamper']), ['v2-sign-armourer']);
  c.slot = 'evening'; assert.deepEqual(run(c, ['v2-sign-armourer', 'v2-sign-locker', 'v2-gear-tamper']), ['v2-sign-locker']);
  c.day = 5; c.tournament.matches.push({ round: 4, a: 'player', b: 'marek', winner: null, close: false, day: 6, seen: true, stage: 'semi' });
  assert.deepEqual(run(c, ['v2-sign-armourer', 'v2-sign-locker', 'v2-gear-tamper']), ['v2-gear-tamper']);
  // whole games: wherever the attempt came, both signs came in earlier slots
  let attempts = 0;
  for (const g of [...Object.values(games), diligent, L.autoplay(40, L.POLICIES.idle, 'Ren', 600, 'v2')]) {
    const at = (id) => { const e = g.state.log.find((x) => x.id === id); return e ? slotNumber(e) : null; };
    const t = at('v2-gear-tamper'); if (t === null) continue;
    attempts++; assert.ok(at('v2-sign-armourer') < at('v2-sign-locker') && at('v2-sign-locker') < t, `seed ${g.seed}`);
  }
  assert.ok(attempts >= 1, 'an attempt among the games');
});

test('the bracket gives no pool points; a defeat there says what it costs there', () => {
  for (const g of [...Object.values(games), diligent]) {
    const st = g.state, exp = Object.fromEntries(Object.keys(st.tournament.points).map((id) => [id, 0]));
    for (const m of st.tournament.matches) if (m.winner && !m.stage) { exp[m.winner] += POINTS.win; exp[m.winner === m.a ? m.b : m.a] += m.close ? POINTS.close : POINTS.loss; }
    // the marshals dock Cassius three points when his hireling is caught at the forge, or when he is reported
    if (st.facts.includes('saboteur-caught')) exp.cassius -= 3;
    if (st.flags.reported) exp.cassius -= 3;
    assert.deepEqual(st.tournament.points, exp, `seed ${g.seed}`);
    assert.ok(st.tournament.matches.some((m) => m.stage && m.winner), 'bracket bouts were fought');
  }
  const lose = (stage) => {
    const s = v2(); s.day = 6; s.slot = 'afternoon'; s.tournament.matches.push({ round: 4, a: 'player', b: 'marek', winner: null, close: false, day: 6, seen: true, stage });
    const before = { ...s.tournament.points }, out = [];
    POOL.applyPlayerDuel(s, { winner: 'opponent', playerHp: 0, playerMaxHp: 100, opponentHp: 60, opponentMaxHp: 100, finisher: 'light' }, (e) => out.push(e));
    assert.deepEqual(s.tournament.points, before, `${stage}: no points`);
    return out.find((e) => e.id === 'player-lost').text;
  };
  assert.match(lose('semi'), /third place/); assert.match(lose('gate'), /Gate final is gone/); assert.match(lose('final'), /in the final/); assert.match(lose('third'), /last bout/);
  for (const st of ['semi', 'gate', 'final', 'third', 'gateFinal']) assert.doesNotMatch(lose(st), /pool/);
  // a defeat in the pool keeps the pool's words
  const p = v2(); p.day = 2; p.slot = 'afternoon'; const out = [];
  POOL.applyPlayerDuel(p, { winner: 'opponent', playerHp: 0, playerMaxHp: 100, opponentHp: 60, opponentMaxHp: 100, finisher: 'light' }, (e) => out.push(e));
  assert.match(out[0].text, /The pool goes on/);
});

test('the heralds and the Colosseum\'s roar on the days of bouts only; the calendar\'s line stirs the town in their place', () => {
  const at = (s, day, slot) => { s.day = day; s.slot = slot; s.flags = { ...s.flags }; delete s.flags['ev:heralds']; delete s.flags['ev:colosseum-roar']; s.pulse = computePulse(s); return s; };
  const eligible = (s, id) => E.eligible(byId[id], s, s.pulse);
  // a version 2 game: the heralds on the first morning only; the roar on an afternoon with bouts the player does not fight
  assert.ok(eligible(at(v2(), 1, 'morning'), 'heralds')); assert.ok(!eligible(at(v2(), 2, 'morning'), 'heralds'));
  for (const d of [3, 7, 9]) assert.ok(!eligible(at(v2(), d, 'afternoon'), 'colosseum-roar'), `free day ${d}`);
  assert.ok(eligible(at(v2(), 4, 'afternoon'), 'colosseum-roar'));
  const fin = at(v2(), 10, 'afternoon'); fin.tournament.matches.push({ round: 6, a: 'player', b: 'marek', winner: null, close: false, day: 10, seen: true, stage: 'final' });
  assert.ok(!eligible(fin, 'colosseum-roar'), 'the final is the player\'s own');
  const br = at(v2(), 6, 'afternoon'); br.tournament.matches.push({ round: 4, a: 'orla', b: 'vessa', winner: null, close: false, day: 6, seen: false, stage: 'semi' });
  assert.match(byId['colosseum-roar'].outcomes.find((o) => !o.when || E.holds(o.when, br, br.pulse)).text, /bracket/);
  // today's game: every morning's heralds, every afternoon's roar from the second day, today's words
  const d = G.namedState('day1-morning');
  assert.ok(eligible(at(G.namedState('day1-morning'), 2, 'morning'), 'heralds') && eligible(at(G.namedState('day1-morning'), 3, 'afternoon'), 'colosseum-roar'));
  assert.match(byId['colosseum-roar'].outcomes.find((o) => !o.when || E.holds(o.when, d, d.pulse)).text, /the pool's other bouts/);
  // the calendar's line at nightfall: +3 excitement, as the heralds' morning
  const s = v2(); s.slot = 'evening'; const before = s.flags['pulse:excitement'] ?? 0;
  C.v2AfterSlot(s, 'evening', () => {}); assert.equal(s.flags['pulse:excitement'], before + 3);
  // over whole games: never a heralds' line after the first day, never a roar on a free day
  for (const g of Object.values(games)) for (const e of g.state.log) {
    if (e.id === 'heralds') assert.equal(e.day, 1);
    if (e.id === 'colosseum-roar') assert.ok(![3, 7, 9].includes(e.day), `roar on day ${e.day}`);
  }
});

test('the ten days told as they are: the board, the clerk, the registry, the end, the people\'s words', () => {
  const s = v2(), html = B.boardHtml(s, POOL.standings(s)).replace(/<[^>]+>/g, ' ');
  assert.match(html, /semi-finals/); assert.match(html, /Gate/); assert.doesNotMatch(html, /slice|transition phase/i);
  assert.match(B.boardHtml(G.namedState('day1-morning'), []).replace(/<[^>]+>/g, ' '), /The slice ends with the pool's second round/, 'today\'s board unchanged');
  assert.match(D.linesOf(s, 'odo')[0], /three rounds/); s.flags.registered = true; assert.match(D.linesOf(s, 'odo')[0], /two, four and five/);
  s.day = 6; assert.match(D.linesOf(s, 'odo')[0], /Gate/);
  const r = v2(); r.place = 'forecourt'; const reg = G.advance(r, { type: 'register' }); assert.ok(reg.ok, reg.reason); assert.match(reg.events[0].text, /three bouts/);
  const over = v2(); over.over = true; assert.equal(G.advance(over, { type: 'wait' }).reason, 'The tournament is over.');
  assert.equal(G.advance({ ...G.namedState('day1-morning'), over: true }, { type: 'wait' }).reason, 'The slice is over.');
  // the festival square's innkeeper, Lantern Row's in today's game
  assert.equal(P.titleOf(P.PEOPLE.lio, true), 'the festival square\'s innkeeper'); assert.equal(P.titleOf(P.PEOPLE.lio, false), P.PEOPLE.lio.title);
  // beaten on the second day, Vessa still has eight days to answer; the townsfolk speak of the bracket after the pool
  const ve = v2(); ve.day = 3; ve.tournament.matches.find((m) => m.day === 2 && m.a === 'player').winner = 'player';
  assert.doesNotMatch(D.linesOf(ve, 'vessa').join(' '), /next year/i);
  assert.match(D.linesOf({ ...G.namedState('day1-morning'), day: 3, tournament: ve.tournament }, 'vessa')[0], /Next year/, 'today\'s line');
  const fo = v2(); fo.day = 7; assert.doesNotMatch(D.linesOf(fo, 'folk').join(' '), /pool isn't over|roar/);
  // Corvin's « rich » line when the purse pays the Whirlwind at today's price
  const co = v2(); co.place = 'training'; co.player.reputation = 50; co.player.coins = VS.skillPrice(co, 't3');
  assert.ok(co.player.coins < 45); assert.match(D.linesOf(co, 'corvin')[0], /Whirlwind/);
  // a brawl at the barracks: the drill master speaks of it the next morning, not before, not after
  const br = v2(); br.day = 4; br.slot = 'evening'; br.place = 'training'; br.flags['pulse:security'] = -30; br.pulse = computePulse(br);
  const fired = []; E.runEvents(br, br.pulse, (e) => fired.push(e.id), { fork: () => ({ next: () => 0 }) }, [byId['v2-barracks-brawl']]);
  assert.deepEqual(fired, ['v2-barracks-brawl']);
  assert.doesNotMatch(D.linesOf(br, 'drill')[0], /black eyes/); br.day = 5; br.slot = 'morning'; assert.match(D.linesOf(br, 'drill')[0], /black eyes/);
  br.day = 6; assert.doesNotMatch(D.linesOf(br, 'drill')[0], /black eyes/);
  // the festival square shows no hooded extra; the card sharps play by its stage
  assert.ok(V.V2_EVENTS.find((e) => e.id === 'v2-card-sharps').outcomes.every((o) => /by the stage/.test(o.text)));
  // every text a version 2 game shows over three whole games (the log, the people's words, the labels and the refusals)
  const words = /slice|lantern row|lantern-row|next year|two rounds|days two and three|two bouts|to be continued/i;
  for (const g of [...Object.values(games), diligent]) {
    for (const e of g.state.log) if (e.visible) assert.doesNotMatch(e.text, words, `${e.id}: ${e.text}`);
  }
});

test('the rain of the wet day falls on the squares too; the squares\' renderer takes the town\'s weather', () => {
  const s = v2(); s.flags.weather = 'rain'; s.day = 3;
  assert.equal(G.rainOf(s), '0.6'); assert.equal(G.townQuery(s).rain, '0.6');
  s.day = 4; assert.equal(G.rainOf(s), null); assert.equal(G.townQuery(s).rain, undefined);
  const page = fs.readFileSync(new URL('../src/ui/playPlaza.ts', import.meta.url), 'utf8');
  assert.match(page, /const rain = rainOf\(st\); if \(rain && !q\.has\('rain'\)\) q\.set\('rain', rain\);/);
  const app = fs.readFileSync(new URL('../src/world/PlazaApp.ts', import.meta.url), 'utf8');
  assert.match(app, /const wp = parseWeather\(q\);/); assert.match(app, /new Weather\(wp, \{ day: !!this\.look, post: this\.post\.params \}\)/);
  assert.match(app, /this\.weather\?\.update\(this\.time, this\.camera, this\.player\.pos\);/);
});

test('the TournamentLab\'s diligent player in a version 2 game: the training ground\'s sand, Hilde\'s armour, the healer, the watch', () => {
  const ids = diligent.state.log.map((e) => e.id);
  assert.ok(ids.includes('shop:padded-jack'), 'armour bought'); assert.ok(diligent.state.v2.gear.armour);
  assert.ok(diligent.state.log.some((e) => e.id === 'train' || /practice sand/.test(e.text)), 'trained');
  assert.ok(ids.filter((i) => i === 'pay-watch').length >= 5, 'the watch paid');
  // today's game: today's policy (its lab output is main's, journal Passe VP1)
  const d = L.autoplay(4, L.POLICIES.diligent);
  assert.ok(!d.state.log.some((e) => e.id.startsWith('shop:')));
});
