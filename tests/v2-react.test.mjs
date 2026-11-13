// Lot L5 of step 5, « la ville qui réagit » (journal Passe EVL9; the operator's choice EV-12 « Les places lisent le pouls, la célébrité compte », journal Passe
// EV2): Wynn of the watch at a robbed stall and the theft refused there; the passers-by on every place; the fame that sets who greets the hero and what the
// passers-by say, Sergeant Hale's marks first; the rivals' gestures by their stance; the squares' crowd by the excitement and the gatherings; the finalist's
// next bout before the final is drawn; Hale by day; today's game offering none of it. The oracles are the rules written out here (the days, the thresholds,
// the walkers who greet, the words each context says, the crowd's formula), not the code's.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';

const G = await load('/src/simulation/index.ts');
const W8 = await load('/src/simulation/v2watch.ts');
const RE = await load('/src/simulation/v2react.ts');
const D = await load('/src/narrative/dialogue.ts');
const B = await load('/src/ui/board.ts');
const CAL = await load('/src/tournament/v2calendar.ts');
const I = await load('/src/simulation/v2intel.ts');
const { tx } = await load('/src/narrative/text/index.ts');
const { computePulse } = await load('/src/tournament/pulse.ts');
const { PEOPLE } = await load('/src/narrative/people.ts');
const { RIVALS } = await load('/src/narrative/roster.ts');

const v2 = (name = 'day1-morning', seed) => { const s = G.namedState(name, seed); return s.flags.v2 === true ? s : G.makeV2(s); };
const act = (st, a) => { const r = G.advance(st, a); assert.ok(r.ok, `${a.type}: ${r.reason}`); return r.state; };
const opt = (st, pred) => G.actions(st).find((o) => pred(o.action));
const at = (st, day, slot, place = st.place) => { const s = structuredClone(st); s.day = day; s.slot = slot; s.place = place; s.pulse = computePulse(s); return s; };
const talks = (st) => G.actions(st).filter((o) => o.action.type === 'talk' && o.ok).map((o) => o.action.who).sort();
/** a state with a theft written in (the rules read the record: the oracles below give its days) */
const withTheft = (t, day = 1, slot = 'morning', place = 'district') => { const s = at(v2(), day, slot, place); s.v2.thefts = [t]; return s; };

// ------------------------------------------------------------------------------------------------ Wynn at the robbed stall

test('Wynn\'s days at a stall: caught by day, that day and the next; a stall forced at night, the two days after; found at dawn, that day; settled, unseen or a pocket, none', () => {
  const days = (t) => [1, 2, 3, 4, 5].filter((d) => W8.watchPost(withTheft(t, d))?.shop === 'mara');
  assert.deepEqual(days({ day: 2, from: 'mara', item: 'whetstone', seen: 'caught' }), [2, 3]);
  assert.deepEqual(days({ day: 2, from: 'mara', item: 'whetstone', seen: 'caught', night: true }), [3, 4]);
  assert.deepEqual(days({ day: 2, from: 'mara', item: 'whetstone', seen: 'found' }), [3]);
  assert.deepEqual(days({ day: 2, from: 'mara', item: 'whetstone', seen: 'caught', settled: true }), []);
  assert.deepEqual(days({ day: 2, from: 'mara', item: 'whetstone', seen: null }), []);
  // a passer-by's pocket has no stall
  assert.equal(W8.watchPost(withTheft({ day: 1, from: 'fenwick', item: 'river-charm', seen: 'caught' }, 1)), null);
  // each keeper's stall and place
  for (const [keeper, shop, place] of [['hilde', 'armourer', 'forecourt'], ['corvin', 'master', 'training'], ['pip', 'trinkets', 'lanterns']]) {
    assert.deepEqual(W8.watchPost(withTheft({ day: 1, from: keeper, item: 'x', seen: 'caught' }, 1)), { shop, keeper, place, day: 1 });
  }
  // the latest known theft wins
  const s = at(v2(), 2, 'morning'); s.v2.thefts = [{ day: 1, from: 'mara', item: 'a', seen: 'caught' }, { day: 2, from: 'pip', item: 'b', seen: 'caught' }];
  assert.equal(W8.watchPost(s).keeper, 'pip');
  // today's game: none
  const d = G.namedState('day1-morning'); d.v2 = { thefts: [{ day: 1, from: 'mara', item: 'a', seen: 'caught' }] };
  assert.equal(W8.watchPost(d), null);
});

test('a theft caught: Wynn stands at that stall (talked to there, gone from the quay), nobody steals from it that day and the next, the reason said; the other stalls open', () => {
  let s = v2('v2-watch-forecourt');
  assert.equal(s.slot, 'afternoon'); assert.equal(s.place, 'forecourt');
  assert.deepEqual(W8.watchPost(s), { shop: 'armourer', keeper: 'hilde', place: 'forecourt', day: 1 });
  assert.ok(talks(s).includes('wynn'));
  assert.equal(D.linesOf(s, 'wynn')[0], tx('v2.line.wynn.posted', { name: 'Hilde' }));
  // the stall is barred to the player today; tomorrow Wynn's watch says why
  assert.equal(opt(s, (a) => a.type === 'steal' && a.shop === 'armourer').reason, tx('v2.shop.barred'));
  const next = at(s, 2, 'morning');
  assert.equal(opt(next, (a) => a.type === 'steal' && a.shop === 'armourer').reason, tx('v2.steal.watched', { name: 'Hilde' }));
  assert.equal(W8.watchPost(at(s, 3, 'morning')), null);
  assert.ok(opt(at(s, 3, 'morning'), (a) => a.type === 'steal' && a.shop === 'armourer').ok);
  // not on the quay meanwhile; back there the day after
  const quay = at(s, 2, 'morning', 'district');
  assert.ok(!talks(quay).includes('wynn'));
  assert.equal(G.actions(quay).find((o) => o.action.type === 'talk' && o.action.who === 'wynn')?.reason, undefined, 'not offered on the quay');
  assert.ok(talks(at(s, 3, 'morning', 'district')).includes('wynn'));
  // another place's stall stays open to a theft
  assert.ok(opt(at(s, 2, 'morning', 'district'), (a) => a.type === 'steal' && a.shop === 'mara').ok);
  // Mara's: Wynn on the quay itself, and Hale says where his man is
  const q = v2('v2-watch-quay');
  assert.deepEqual(W8.watchPost(q), { shop: 'mara', keeper: 'mara', place: 'district', day: 1 });
  assert.ok(talks(q).includes('wynn'));
  assert.ok(D.linesOf(q, 'hale').includes(tx('v2.line.hale.posted', { name: 'Mara' })));
  // a restitution at Hale's settles the theft: Wynn goes back
  const settled = structuredClone(q); for (const t of settled.v2.thefts) t.settled = true;
  assert.equal(W8.watchPost(settled), null);
});

test('the passers-by: spoken to on every place of a version 2 game, by day and night; today\'s game keeps them on the quay', () => {
  for (const place of ['district', 'forecourt', 'training', 'lanterns']) for (const slot of ['morning', 'afternoon', 'evening']) {
    assert.ok(talks(at(v2(), 1, slot, place)).includes('folk'), `${place} ${slot}`);
  }
  const d = G.namedState('day1-morning');
  assert.ok(talks(d).includes('folk'));
  d.place = 'forecourt'; assert.ok(!talks(d).includes('folk'));
});

// ------------------------------------------------------------------------------------------------ the fame

test('the fame\'s tiers at their thresholds: 24 unknown, 25 noticed, 54 / 55 known, 79 / 80 celebrated', () => {
  const tier = (f) => RE.fameTier({ pulse: { playerFame: f } });
  assert.deepEqual([0, 24, 25, 54, 55, 79, 80, 100].map(tier), ['unknown', 'unknown', 'noticed', 'noticed', 'known', 'known', 'celebrated', 'celebrated']);
});

/** a version 2 state on day 3's morning (no bout of the player's today, yesterday's won), its fame and marks set */
const famed = (fame, marks = 0, day = 3, slot = 'morning') => { const s = at(v2('v2-tale-day3'), day, slot); s.pulse.playerFame = fame; s.v2.marks = marks; return s; };

test('who greets the hero: nobody unknown, one walker in four noticed, one in two known, everyone celebrated; a name in the ledger whispered by one in three, a wanted one avoided by all', () => {
  assert.equal(Array.from({ length: 12 }, (_, k) => RE.hailOf(famed(10), k)?.kind ?? '-').join(''), '------------');
  const greet = (s) => Array.from({ length: 12 }, (_, k) => (RE.hailOf(s, k)?.kind === 'hail' ? 1 : 0)).join('');
  assert.equal(greet(famed(30)), '100010001000');
  assert.equal(greet(famed(60)), '101010101010');
  assert.equal(greet(famed(90)), '111111111111');
  // the marks come before the fame
  const wary = Array.from({ length: 6 }, (_, k) => RE.hailOf(famed(90, 1), k)?.kind ?? '-');
  assert.deepEqual(wary, ['whisper', '-', '-', 'whisper', '-', '-']);
  const wanted = Array.from({ length: 6 }, (_, k) => RE.hailOf(famed(90, 3), k));
  assert.ok(wanted.every((h) => h.kind === 'avoid'));
  assert.deepEqual(wanted.map((h) => !!h.text), [true, false, false, true, false, false]);
  // the words follow the page's turn of greetings, not the walker: two greetings in turn never say the same, whoever gives them
  for (const [fame, marks, a, b] of [[30, 0, 0, 4], [60, 0, 0, 2], [90, 0, 5, 6], [90, 1, 0, 3]]) {
    const st = famed(fame, marks);
    assert.notEqual(RE.hailOf(st, a, 0).text, RE.hailOf(st, b, 1).text, `fame ${fame} marks ${marks}`);
    assert.equal(RE.hailOf(st, a, 0).text, RE.hailOf(st, b, 0).text);
  }
  // today's game: nobody
  const d = G.namedState('day2-dusk-won'); d.pulse.playerFame = 90;
  assert.equal(RE.hailOf(d, 0), null);
});

test('what the greeting says, by the day: a bout today (the bets when the public\'s pressure is 60 or more), one won or lost yesterday, one tomorrow, the final ahead, the crown', () => {
  // (every walker greets a celebrated player: walker k gives the page's k-th greeting)
  const words = (s, n = 4) => Array.from({ length: n }, (_, k) => RE.hailOf(s, k, k)?.text).filter(Boolean);
  const T = (k, v = {}) => tx(k, { name: 'Ren', ...v });
  // yesterday's bout won against Vessa Lark (v2-tale-day3)
  assert.deepEqual(words(famed(90)).slice(0, 2), [T('v2.hail.won1', { foe: 'Vessa Lark' }), T('v2.hail.won2')]);
  // a bout today: day 4, Orla Brask; the bets said at a pressure of 60
  const four = famed(90, 0, 4, 'morning');
  four.pulse.publicPressure = 59; assert.deepEqual(words(four).slice(0, 2), [T('v2.hail.boutToday'), T('v2.hail.boutToday2')]);
  four.pulse.publicPressure = 60; assert.deepEqual(words(four).slice(0, 2), [T('v2.hail.boutToday'), T('v2.hail.bets')]);
  // the evening of the bout day the bout is fought: the result is said (the morning after a lost one too)
  const lost = structuredClone(four); const m = lost.tournament.matches.find((x) => x.day === 4 && (x.a === 'player' || x.b === 'player')); m.winner = m.a === 'player' ? m.b : m.a;
  // (the morning of day 5 has its own bout: « good luck today » comes first; its evening, before the bout is fought, says yesterday's)
  const fiveAt = (slot) => { const x = at(lost, 5, slot); x.pulse.playerFame = 90; return x; };
  assert.equal(words(fiveAt('morning'))[0], T('v2.hail.boutToday'));
  assert.deepEqual(words(fiveAt('evening')).slice(0, 2), [T('v2.hail.lost1'), T('v2.hail.lost2', { foe: 'Orla Brask' })]);
  // the day before a bout (day 3's evening has yesterday's... day 3 itself says yesterday's win: day 3 with day 2 unfought would say tomorrow)
  const pre = famed(90, 0, 3, 'morning'); for (const x of pre.tournament.matches) if (x.day === 2) x.winner = null;
  pre.tournament.matches = pre.tournament.matches.filter((x) => x.day !== 2);
  assert.deepEqual(words(pre).slice(0, 2), [T('v2.hail.tomorrow1', { next: 'Orla Brask' }), T('v2.hail.tomorrow2')]);
  // the final ahead (a finalist on day 7, the final not drawn) and the crown
  const fin = v2('v2-famous-training'); fin.v2.marks = 0;
  assert.ok(CAL.pendingFinal(fin));
  // (day 7 still says the semi-final won yesterday; day 8's morning, the final not drawn yet, says the final and its other finalist)
  const seven = at(fin, 7, 'afternoon'); seven.pulse.playerFame = 90;
  assert.equal(words(seven)[0], T('v2.hail.won1', { foe: RIVALS[CAL.stageMatches(fin, 'semi').find((m) => m.a === 'player' || m.b === 'player').b === 'player' ? CAL.stageMatches(fin, 'semi').find((m) => m.a === 'player' || m.b === 'player').a : CAL.stageMatches(fin, 'semi').find((m) => m.a === 'player' || m.b === 'player').b].name }));
  const eight = at(fin, 8, 'morning'); eight.pulse.playerFame = 90;
  assert.deepEqual(words(eight).slice(0, 2), [T('v2.hail.final1'), T('v2.hail.final2', { next: RIVALS[CAL.pendingFinal(fin).foe].name })]);
  const crowned = structuredClone(eight); crowned.flags.champion = 'player';
  assert.deepEqual(words(crowned).slice(0, 2), [T('v2.hail.champion1'), T('v2.hail.champion2')]);
  // nothing of the kind: the fame's own words
  const none = famed(30, 0, 3, 'evening'); none.tournament.matches = none.tournament.matches.filter((x) => x.day !== 2 && x.day !== 4);
  assert.equal(RE.hailOf(none, 0).text, T('v2.hail.noticed1'));
  const known = structuredClone(none); known.pulse.playerFame = 60; assert.equal(RE.hailOf(known, 2, 1).text, T('v2.hail.known2'));
  const cel = structuredClone(none); cel.pulse.playerFame = 90; assert.equal(RE.hailOf(cel, 0).text, T('v2.hail.celebrated1'));
});

test('what the passers-by say when spoken to: the ledger first, then the fame; today\'s game keeps its words', () => {
  const first = (s) => D.linesOf(s, 'folk')[0];
  assert.equal(first(famed(10)), tx('v2.line.folk.unknown'));
  assert.equal(first(famed(30)), tx('v2.line.folk.noticed'));
  assert.equal(first(famed(60)), tx('v2.line.folk.known', { name: 'Ren' }));
  assert.equal(first(famed(90)), tx('v2.line.folk.celebrated', { name: 'Ren' }));
  assert.equal(first(famed(90, 2)), tx('v2.line.folk.wary'));
  assert.equal(first(famed(90, 3)), tx('v2.line.folk.wanted'));
  const d = G.namedState('day2-dusk-won');
  assert.ok(!D.linesOf(d, 'folk').some((l) => /v2|cousin|sister|ledger/.test(l)));
  assert.equal(D.linesOf(d, 'folk')[0], tx('line.folk.won', { name: 'Ren' }));
});

// ------------------------------------------------------------------------------------------------ the rivals' gestures

test('a rival standing shows its stance: a friend raises a hand, a respect nods, a grudge turns away, none otherwise; today\'s game none', () => {
  const s = v2('v2-famous-training');
  assert.deepEqual(RE.gestureOf(s, 'orla'), { kind: 'hail', text: tx('v2.gesture.friend', { name: 'Orla Brask' }) });
  assert.deepEqual(RE.gestureOf(s, 'vessa'), { kind: 'turn', text: tx('v2.gesture.grudge', { name: 'Vessa Lark' }) });
  // (Ilse: no stance in this state; Marek, beaten honourably there since the clash and the gauge of BL1-8 and BL1-9, nods: journal Passe BL1)
  assert.equal(RE.gestureOf(s, 'ilse'), null);
  const r = v2('v2-day7-training');
  assert.deepEqual(RE.gestureOf(r, 'orla'), { kind: 'nod', text: tx('v2.gesture.respect', { name: 'Orla Brask' }) });
  const d = G.namedState('day2-dusk-won'); d.competitors.orla.relationships.player = 40;
  assert.equal(RE.gestureOf(d, 'orla'), null);
});

// ------------------------------------------------------------------------------------------------ the squares read the pulse

test('a square\'s crowd: the moment\'s count, a walker each 12 points of excitement from 60, the gatherings (roar 3, market 3, parade 4), between 2 and 15', () => {
  const BASE = { morning: 5, midday: 12, afternoon: 8, night: 4 };
  const oracle = (s, base, extra) => Math.max(2, Math.min(15, base + Math.round((s.pulse.excitement - 60) / 12) + extra));
  // the forecourt: the morning plain, an afternoon of bouts gathers the Colosseum's crowd, an afternoon without none
  const f1 = at(v2(), 1, 'morning', 'forecourt'); assert.equal(RE.plazaCrowd(f1), oracle(f1, BASE.morning, 0)); assert.equal(RE.gatheringOf(f1), null);
  const f2 = at(v2(), 2, 'afternoon', 'forecourt'); assert.equal(RE.gatheringOf(f2), 'roar'); assert.equal(RE.plazaCrowd(f2), oracle(f2, BASE.midday, 3));
  const f3 = at(v2(), 3, 'afternoon', 'forecourt'); assert.equal(RE.gatheringOf(f3), null); assert.equal(RE.plazaCrowd(f3), oracle(f3, BASE.midday, 0));
  // the excitement moves it: 60 -> base, 72 -> +1, 30 -> -2 (never under 2), 100 -> +3
  for (const [e, add] of [[60, 0], [72, 1], [77, 1], [29, -3], [100, 3]]) { const s = structuredClone(f1); s.pulse.excitement = e; assert.equal(RE.plazaCrowd(s), Math.max(2, BASE.morning + add), `excitement ${e}`); }
  // the festival square: the night market's evening (its log entry today), the parade's evening (day 9), neither by day
  const night = act(act(v2(), { type: 'wait' }), { type: 'wait' });
  const sq = at(night, night.day, 'evening', 'lanterns');
  assert.equal(RE.gatheringOf(sq), sq.log.some((e) => e.id === 'night-market' && e.day === sq.day) ? 'market' : null);
  const market = structuredClone(sq); market.log.push({ day: market.day, slot: 'afternoon', kind: 'event', id: 'night-market', cause: '', text: '', visible: false });
  assert.equal(RE.gatheringOf(market), 'market'); assert.equal(RE.plazaCrowd(market), oracle(market, BASE.night, 3));
  const parade = at(v2(), 9, 'evening', 'lanterns'); assert.equal(RE.gatheringOf(parade), 'parade'); assert.equal(RE.plazaCrowd(parade), oracle(parade, BASE.night, 4));
  assert.equal(RE.gatheringOf(at(v2(), 9, 'afternoon', 'lanterns')), null);
  // the training ground: never a gathering; the cap at 15
  const tr = at(v2(), 6, 'afternoon', 'training'); assert.equal(RE.gatheringOf(tr), null);
  const big = structuredClone(f2); big.pulse.excitement = 100; assert.equal(RE.plazaCrowd(big), 15);
});

// ------------------------------------------------------------------------------------------------ the finalist's next bout; Hale by day

test('a finalist before the final is drawn: the board and the rumours name the final and the other semi-final\'s winner; « Your bouts are fought » only once every bout is', () => {
  const s = v2('v2-famous-training');
  const semis = CAL.stageMatches(s, 'semi'), other = semis.find((m) => m.a !== 'player' && m.b !== 'player').winner;
  assert.deepEqual(CAL.pendingFinal(s), { day: 10, foe: other });
  assert.equal(I.nextOpponent(s), other);
  assert.ok(B.deadline(s).includes(tx('v2.stage.final')) && B.deadline(s).includes('day 10'));
  assert.ok(!B.deadline(s).includes(tx('v2.board.fought')));
  // a rumour of the final's other finalist can be bought on day 7
  const lio = at(s, 7, 'afternoon', 'lanterns');
  const r = opt(lio, (a) => a.type === 'rumour' && a.src === 'lio');
  assert.ok(r.ok, r.reason);
  // a semi-final lost: the third place on day 8, no pending final
  const lost = structuredClone(s); const m = CAL.stageMatches(lost, 'semi').find((x) => x.a === 'player' || x.b === 'player'); m.winner = m.a === 'player' ? m.b : m.a;
  assert.equal(CAL.pendingFinal(lost), null);
  // once the final is drawn, it is the match itself
  const drawn = structuredClone(s); drawn.tournament.matches.push({ round: 6, a: 'player', b: other, winner: null, close: false, day: 10, seen: true, stage: 'final' });
  assert.equal(CAL.pendingFinal(drawn), null); assert.equal(I.nextOpponent(drawn), other);
  // today's game: nothing pending
  assert.equal(CAL.pendingFinal(G.namedState('slice-end')), null);
});

test('Sergeant Hale on a thin day says « after dark » by day in a version 2 game; the evening and today\'s game keep « tonight »', () => {
  const thin = (s) => { s.pulse.security = 40; return D.linesOf(s, 'hale')[0]; };
  assert.equal(thin(at(v2(), 1, 'morning', 'district')), tx('v2.line.hale.thinDay'));
  assert.equal(thin(at(v2(), 1, 'afternoon', 'district')), tx('v2.line.hale.thinDay'));
  assert.equal(thin(at(v2(), 1, 'evening', 'district')), tx('line.hale.thin'));
  const d = G.namedState('day1-morning'); assert.equal(thin(d), tx('line.hale.thin'));
});

test('today\'s game: no watch, no passers-by off the quay, no greeting, no gesture, the talk list as before', () => {
  for (const name of ['day1-morning', 'day2-dusk-won', 'forecourt-morning', 'lanterns-night', 'day3-afternoon']) {
    const s = G.namedState(name);
    assert.equal(W8.watchPost(s), null);
    assert.equal(RE.hailOf(s, 0), null);
    assert.equal(RE.gestureOf(s, 'vessa'), null);
    assert.deepEqual(G.actions(s).filter((o) => o.action.type === 'talk').map((o) => o.action.who), Object.values(PEOPLE).filter((p) => !p.v2 && p.place === s.place).map((p) => p.id), name);
  }
});
