// The town's quests and the events' place and answer (the operator's sheet https://claude.ai/artifact/9QYryPbxZZo5Dx456KJJJD, journal Passe QE2, ten of ten at the
// recommendation: Q-01 « Adopter ces quatre quêtes », Q-02 « Attaque +1, en plus des paliers, tout de suite », Q-03 « Ainsi : +45 de santé, une fois », Q-04 « Ainsi :
// un niveau, jusqu’au 4 », Q-05 « Ainsi, avec « se battre » une fois le chantier 1 fusionné », Q-06 « Ne pas recaler maintenant, revérifier après le rebase », Q-07
// « Ainsi », Q-08 « Ces trois, à leur lieu », Q-09 « Ainsi », Q-10 « Construire, prouver, fusionner après le chantier 1 »; the general gameplay sheet's GP-09
// « Quatre quêtes de ville et une page « En cours » », GP-10 « Le lieu et le choix », GP-11 « Corriger la lecture et ajouter le chapitre », journal Passe GP2). The
// oracles are the decisions written out here: who asks, where, when, what each step costs and gives, when a quest fails and what it costs; read through the game's
// own actions and refusals.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';

const G = await load('/src/simulation/index.ts');
const Q = await load('/src/simulation/v2quests.ts');
const VG = await load('/src/simulation/v2gear.ts');
const ENC = await load('/src/simulation/v2encounter.ts');
const OFF = await load('/src/simulation/v2offers.ts');
const ENG = await load('/src/events/engine.ts');
const { EVENTS } = await load('/src/events/catalog.ts');
const { V2_EVENTS } = await load('/src/events/v2catalog.ts');
const { computePulse } = await load('/src/tournament/pulse.ts');
const J = await load('/src/ui/journal.ts');
const NEWS = await load('/src/ui/news.ts');
const TODO = await load('/src/ui/todo.ts');
const TUT = await load('/src/ui/tutorial.ts');
const T = await load('/src/narrative/text/index.ts');
const FR = (await load('/src/narrative/text/fr-texts.ts')).FR_TEXTS;

const v2 = (name = 'day1-morning') => G.makeV2(G.namedState(name));
const at = (st, place, slot, day) => { const s = structuredClone(st); s.place = place; if (slot) s.slot = slot; if (day) s.day = day; return s; };
const act = (st, a) => { const r = G.advance(st, a); assert.ok(r.ok, `${a.type}: ${r.reason}`); return r.state; };
const refused = (st, a, re) => { const r = G.advance(st, a); assert.ok(!r.ok, `${a.type} should be refused`); if (re) assert.match(r.reason, re); };
const has = (st, type, ok = true) => G.actions(st).some((o) => o.action.type === type && o.ok === ok);
const inFrench = (f) => { T.useLanguage('fr', FR); try { return f(); } finally { T.useLanguage('en'); } };
/** the slot passes (a wait), in place */
const pass = (st) => act(st, { type: 'wait' });
/** a rng whose every draw passes an event's chance */
const lucky = { fork: () => ({ next: () => 0, fork: () => lucky.fork() }) };

test('Q-01: four quests, a place each, each asked by someone who is there on its days; talking takes it, for nothing; today\'s game keeps its cargo', () => {
  assert.deepEqual(Q.QUEST_IDS, ['cargo', 'herbs', 'treatise', 'sharps']);
  assert.deepEqual(Q.QUEST_IDS.map((id) => [Q.QUESTS[id].place, Q.QUESTS[id].giver, Q.QUESTS[id].offer]),
    [['district', 'tam', [1, 3]], ['forecourt', 'anwen', [2, 5]], ['training', 'corvin', [3, 7]], ['lanterns', 'lio', [2, 8]]]);
  const st = v2();
  assert.equal(Q.questOffered(st, 'tam'), 'cargo'); assert.equal(Q.questOffered(st, 'anwen'), null, 'Anwen from day 2');
  const s = act(st, { type: 'talk', who: 'tam' });
  assert.equal(s.quests.cargo, 'asked'); assert.equal(s.player.coins, st.player.coins); assert.equal(s.slot, st.slot, 'taking a quest spends nothing');
  assert.ok(s.log.some((e) => e.id === 'quest:cargo' && e.visible));
  assert.equal(Q.questOffered(at(st, 'district', 'morning', 4), 'tam'), null, 'the cargo after day 3: gone');
  assert.equal(Q.questOffered(at(st, 'forecourt', 'morning', 2), 'anwen'), 'herbs');
  assert.equal(Q.questOffered(at(st, 'training', 'morning', 3), 'corvin'), 'treatise');
  assert.equal(Q.questOffered(at(st, 'lanterns', 'evening', 2), 'lio'), 'sharps');
  // today's game (v2=0): the cargo offered as before, none of the other three
  const old = G.namedState('day1-morning'), o = act(old, { type: 'talk', who: 'tam' });
  assert.equal(o.quests.cargo, 'asked'); assert.equal(Q.questOffered(at(old, 'forecourt', 'morning', 2), 'anwen'), null);
});

test('Q-01: a quest fails at its deadline\'s end: the giver\'s goodwill -10, a rival +25 preparation (one visible Attack point), said; a quest never taken costs nothing', () => {
  let st = at(act(v2(), { type: 'talk', who: 'tam' }), 'district', 'afternoon', 3);
  // the control: the same state, the quest not taken (the same draws: the rivals train off screen meanwhile)
  const control = structuredClone(st); delete control.quests.cargo;
  const tam = st.town.tam ?? 0, x = pass(control).competitors.cassius.preparation;
  st = pass(st);
  assert.equal(st.quests.cargo, 'failed');
  assert.equal(st.competitors.cassius.preparation, Math.min(100, x + 25)); assert.equal(st.town.tam, tam - 10);
  const line = st.log.find((e) => e.id === 'quest:cargo:failed');
  assert.ok(line && line.visible && line.kind === 'consequence' && /House Dree/.test(line.text));
  // never taken: nothing
  let n = at(v2(), 'district', 'afternoon', 3);
  n = pass(n); assert.equal(n.quests.cargo, undefined); assert.ok(!n.log.some((e) => e.id.endsWith(':failed')));
});

test('Q-02: the steel cargo — Hale\'s release, the crate hauled by day before dusk on day 3 (a slot, +8), Bram\'s temper (a slot, 10): Attack +1 on top of the forge\'s tiers, even the last', () => {
  let st = act(v2(), { type: 'talk', who: 'tam' });
  refused(st, { type: 'haul' }, /Hale/);
  st = act(st, { type: 'askPapers' }); assert.equal(st.quests.cargo, 'papers'); assert.equal(st.slot, 'morning', 'the release takes no slot');
  const c0 = st.player.coins; st = act(st, { type: 'haul' });
  assert.equal(st.quests.cargo, 'delivered'); assert.equal(st.player.coins, c0 + 8); assert.equal(st.slot, 'afternoon');
  const burnt = structuredClone(st); burnt.services.forge = 'sabotaged'; refused(burnt, { type: 'temper' });
  const a0 = VG.v2Stats(st).atk, c1 = st.player.coins; st = act(st, { type: 'temper' });
  assert.equal(st.quests.cargo, 'done'); assert.equal(st.player.coins, c1 - 10); assert.equal(VG.v2Stats(st).atk - a0, 1, 'Attack +1');
  assert.equal(Q.QUEST.wyrmAtk, 1);
  // even the last tier: the forge's three, then the Wyrmsteel beyond them
  st.v2.gear.tier = 3; assert.equal(VG.weaponTier(st), 3); const top = structuredClone(st); top.player.items = top.player.items.filter((i) => i !== 'tempered-blade');
  assert.equal(VG.v2Stats(st).atk - VG.v2Stats(top).atk, 1);
  // the deadline: the crate not hauled by dusk on day 3 (its afternoon's end)
  let late = act(act(at(v2(), 'district', 'morning', 3), { type: 'talk', who: 'tam' }), { type: 'askPapers' });
  late = pass(late); assert.equal(late.quests.cargo, 'papers', 'the morning of day 3: still open');
  late = act(late, { type: 'haul' }); assert.equal(late.quests.cargo, 'delivered', 'hauled in the last afternoon: in time');
});

test('Q-03: Sister Anwen\'s herbs — Fenwick\'s river moss on the quay at night (5), the draught brewed with her by day (a slot) before the end of day 5: +45 health once, drunk by the next bout or challenge', () => {
  let st = act(at(v2(), 'forecourt', 'morning', 2), { type: 'talk', who: 'anwen' });
  assert.equal(st.quests.herbs, 'asked');
  refused(at(st, 'district', 'morning'), { type: 'buyHerbs' }, /Fenwick/);
  st = at(st, 'district', 'evening');
  const c0 = st.player.coins; st = act(st, { type: 'buyHerbs' });
  assert.equal(st.player.coins, c0 - 5); assert.equal(st.quests.herbs, 'herbs'); assert.equal(st.slot, 'evening', 'no slot');
  refused(at(st, 'forecourt', 'evening'), { type: 'brewDraught' }, /daylight/);
  const hp0 = VG.v2Stats(at(st, 'forecourt', 'morning', 3)).hp;
  st = act(at(st, 'forecourt', 'morning', 3), { type: 'brewDraught' });
  assert.equal(st.quests.herbs, 'done'); assert.equal(st.flags.draught, true); assert.equal(VG.v2Stats(st).hp - hp0, 45); assert.equal(VG.healthParts(st).draught, 45);
  // drunk by the next bout: the day-4 bout
  let b = at(st, 'forecourt', 'afternoon', 4);
  b = act(b, { type: 'fight', outcome: { winner: 'player', playerHp: 100, playerMaxHp: 1000, opponentHp: 0, opponentMaxHp: 1000, finisher: null } });
  assert.equal(b.flags.draught, 'drunk'); assert.equal(VG.healthParts(b).draught, 0);
  // the deadline: the end of day 5, Ilse strengthened
  let f = act(at(v2(), 'forecourt', 'evening', 5), { type: 'talk', who: 'anwen' }); const fc = structuredClone(f); delete fc.quests.herbs;
  const ilse = pass(fc).competitors.ilse.preparation;
  f = pass(f); assert.equal(f.quests.herbs, 'failed'); assert.equal(f.competitors.ilse.preparation, Math.min(100, ilse + 25));
});

test('Q-04: Master Corvin\'s treatise — bought back from Pip on the festival square (15) before the end of day 7, studied with him by day (a slot): a skill a level up, to 4 at most', () => {
  let st = act(at(v2(), 'training', 'morning', 3), { type: 'talk', who: 'corvin' });
  assert.equal(st.quests.treatise, 'asked');
  refused(at(st, 'lanterns', 'morning'), { type: 'buyTreatise' }, /Pip/);
  st = at(st, 'lanterns', 'afternoon'); const c0 = st.player.coins; st = act(st, { type: 'buyTreatise' });
  assert.equal(st.player.coins, c0 - 15); assert.equal(st.quests.treatise, 'bought');
  st = at(st, 'training', 'morning', 4); st.v2.kit.levels.t1 = 3;
  const offered = G.actions(st).filter((o) => o.action.type === 'studyTreatise').map((o) => o.action.skill);
  assert.ok(offered.includes('t1') && !offered.includes('heavy'), offered.join());
  st = act(st, { type: 'studyTreatise', skill: 't1' });
  assert.equal(st.v2.kit.levels.t1, 4, 'past the training\'s 3'); assert.equal(st.quests.treatise, 'done');
  const four = structuredClone(st); four.quests.treatise = 'bought';
  assert.ok(!G.actions(four).some((o) => o.action.type === 'studyTreatise' && o.action.skill === 't1'), 'a skill at 4: never past it');
  // the deadline: the end of day 7, Vessa strengthened; once bought, the study waits
  let f = act(at(v2(), 'training', 'afternoon', 7), { type: 'talk', who: 'corvin' }); f = at(f, 'training', 'evening'); const fc = structuredClone(f); delete fc.quests.treatise;
  const vessa = pass(fc).competitors.vessa.preparation;
  f = pass(f); assert.equal(f.quests.treatise, 'failed'); assert.equal(f.competitors.vessa.preparation, Math.min(100, vessa + 25));
});

test('Q-05: Lio\'s card sharps — paid off (15) or faced with the watch Hale lends (refused with a mark), at night on the square; done, their event gone and Lio\'s word on each next opponent\'s plan; failed, his evening job gone', () => {
  let st = act(at(v2(), 'lanterns', 'evening', 2), { type: 'talk', who: 'lio' });
  assert.equal(st.quests.sharps, 'asked');
  refused(at(st, 'lanterns', 'afternoon'), { type: 'faceSharps', how: 'pay' }, /night/);
  refused(st, { type: 'faceSharps', how: 'watch' }, /watchman/);
  const marked = at(st, 'district', 'morning', 3); marked.v2.marks = 1; refused(marked, { type: 'askWatch' }, /ledger/);
  let w = act(at(st, 'district', 'morning', 3), { type: 'askWatch' }); assert.equal(w.quests.sharps, 'watch');
  w = act(at(w, 'lanterns', 'evening'), { type: 'faceSharps', how: 'watch' });
  assert.equal(w.quests.sharps, 'done'); assert.ok(w.facts.includes('sharps-gone'));
  const c0 = st.player.coins, p = act(st, { type: 'faceSharps', how: 'pay' });
  assert.equal(p.player.coins, c0 - 15); assert.equal(p.quests.sharps, 'done');
  // their event no longer strikes
  const ev = V2_EVENTS.find((e) => e.id === 'v2-card-sharps'), sq = structuredClone(p);
  sq.flags['pulse:festivity'] = 100; sq.flags['pulse:security'] = -100;
  assert.ok(!ENG.eligible(ev, sq, computePulse(sq)), 'the sharps gone');
  // Lio's word, the eve of a bout: the plan of the next opponent (day 3's evening, the bout of day 4)
  let eve = at(p, 'lanterns', 'evening', 3); eve = pass(eve);
  const foe = eve.tournament.matches.find((m) => m.day === 4 && (m.a === 'player' || m.b === 'player'));
  const id = foe.a === 'player' ? foe.b : foe.a;
  assert.ok(eve.facts.includes(`scouted2:${id}`), 'the second tier of the scouting'); assert.ok(eve.log.some((e) => e.id === `quest:sharps:word:${id}`));
  // failed: the end of day 8, Lio's tables shut
  let f = act(at(v2(), 'lanterns', 'evening', 8), { type: 'talk', who: 'lio' }); f = pass(f);
  assert.equal(f.quests.sharps, 'failed');
  refused(at(f, 'lanterns', 'evening', 9), { type: 'work', job: 'tables' }, /no longer needs/);
});

test('Q-07: the journal\'s « In progress » page: every quest taken, the open first, its step, where and with whom, its deadline and what it gives; then done and failed', () => {
  const st = G.makeV2(G.namedState('v2-quests-day3'));
  const e = J.questEntries(st);
  assert.deepEqual(e.map((q) => [q.id, q.state]), [['cargo', 'open'], ['herbs', 'open'], ['treatise', 'open'], ['sharps', 'open']]);
  assert.match(e[0].step, /temper/); assert.equal(e[0].deadline, null, 'the crate delivered: nothing can fail any more');
  assert.match(e[1].step, /Anwen/); assert.match(e[1].deadline, /day 5/); assert.match(e[1].reward, /\+45 health/);
  assert.match(e[2].step, /Pip/); assert.match(e[2].deadline, /day 7/); assert.match(e[2].reward, /level 4/);
  assert.match(e[0].reward, /Attack \+1/);
  const done = structuredClone(st); done.quests.cargo = 'done'; done.quests.sharps = 'failed';
  assert.deepEqual(J.questEntries(done).map((q) => [q.id, q.state]), [['herbs', 'open'], ['treatise', 'open'], ['cargo', 'done'], ['sharps', 'failed']]);
  assert.deepEqual(J.questEntries(G.namedState('day1-morning')), [], 'today\'s game: no page');
  inFrench(() => { assert.match(J.questEntries(st)[1].title, /Sœur Anwen/); assert.match(J.questEntries(st)[1].deadline, /jour 5/); });
});

test('GP-11 / Q-07: the news card never cuts a sign nor a consequence; the watch\'s and the strongroom\'s diamonds only after a sign; the list says what; the guide\'s chapter', () => {
  const ln = (k, i) => ({ kind: k, id: `e${i}` });
  const news = [ln('sign', 0), ...Array.from({ length: 10 }, (_, i) => ln('event', i + 1)), ln('consequence', 11)];
  const { lines, rest } = NEWS.newsLines(news);
  assert.ok(lines.includes(news[0]) && lines.includes(news[11]), 'the sign and the consequence kept'); assert.equal(lines.length, 8); assert.equal(rest, 4);
  assert.deepEqual(lines.map((e) => e.id), [...lines].sort((a, b) => news.indexOf(a) - news.indexOf(b)).map((e) => e.id), 'in the log\'s order');
  // the daily guards: marked once a sign was seen
  const st = v2();
  assert.ok(!OFF.markWorthy(st, 'payWatch') && !OFF.markWorthy(st, 'lockGear'));
  assert.ok(OFF.markWorthy({ ...st, facts: ['lamp-oil'] }, 'payWatch')); assert.ok(OFF.markWorthy({ ...st, facts: ['armour-asked'] }, 'lockGear'));
  assert.ok(!OFF.markWorthy({ ...st, facts: ['armour-asked'], flags: { ...st.flags, 'tamper-done': true } }, 'lockGear'), 'the chain struck: no more');
  // the list says what
  assert.equal(TODO.offerWhat('quest:cargo', 'event'), 'a quest: The Steel Cargo');
  assert.equal(TODO.offerWhat('haul', 'follow'), 'The Steel Cargo: the next step');
  assert.equal(TODO.offerWhat('work', 'item'), 'a paid job'); assert.equal(TODO.offerWhat('challenge', 'event'), 'a challenge on the sand');
  inFrench(() => assert.equal(TODO.offerWhat('quest:herbs', 'event'), 'une quête : Les simples de Sœur Anwen'));
  // the guide: « Events and sabotage », its numbers the game's
  const ch = TUT.CHAPTERS.find((c) => c.id === 'events');
  assert.ok(ch); const text = TUT.chapterText(st, ch);
  assert.match(text, /In progress/); assert.match(text, /strongroom on the eve of your bout \(5 coins\)/); assert.doesNotMatch(text, /[{}]/);
});

test('Q-08: the cutpurse strikes on the quay\'s market only, the card sharps by the festival square\'s stage only, the bookmakers\' punter pays at the forecourt only; today\'s game everywhere', () => {
  const here = (st, places) => ENG.holds({ here: places }, st, computePulse(st));
  const st = v2();
  assert.ok(here(at(st, 'district'), ['district']) && !here(at(st, 'lanterns'), ['district']));
  assert.ok(here(at(G.namedState('day1-morning'), 'lanterns'), ['district']), 'today\'s game: always');
  const pick = EVENTS.find((e) => e.id === 'pickpockets'), sharps = V2_EVENTS.find((e) => e.id === 'v2-card-sharps'), book = V2_EVENTS.find((e) => e.id === 'v2-bookmakers');
  const ripe = (s) => { s.flags['pulse:festivity'] = 100; s.flags['pulse:security'] = -100; return s; };
  assert.ok(ENG.eligible(pick, ripe(at(st, 'district', 'afternoon')), computePulse(ripe(at(st, 'district', 'afternoon')))));
  assert.ok(!ENG.eligible(pick, ripe(at(st, 'forecourt', 'afternoon')), computePulse(ripe(at(st, 'forecourt', 'afternoon')))));
  assert.ok(ENG.eligible(sharps, ripe(at(st, 'lanterns', 'evening')), computePulse(ripe(at(st, 'lanterns', 'evening')))));
  assert.ok(!ENG.eligible(sharps, ripe(at(st, 'district', 'evening')), computePulse(ripe(at(st, 'district', 'evening')))));
  // the bookmakers: the coins at the forecourt, the name alone elsewhere
  const away = at(st, 'district', 'morning'), there = at(st, 'forecourt', 'morning'), p = computePulse(st);
  assert.deepEqual(book.outcomes.find((o) => !o.when || ENG.holds(o.when, there, p)).effects.find((e) => 'coins' in e), { coins: 10 });
  assert.ok(!book.outcomes.find((o) => !o.when || ENG.holds(o.when, away, p)).effects.some((e) => 'coins' in e));
});

test('Q-09: a costly event takes its cost, then asks: the sharps let be or refused (the coins back, the name and Lio\'s goodwill), the cutpurse let go; never blocking; over after the next slot', () => {
  const st = ripe(at(v2(), 'lanterns', 'evening', 2));
  function ripe(s) { s.flags['pulse:festivity'] = 100; s.flags['pulse:security'] = -100; return s; }
  const s = structuredClone(st), c0 = s.player.coins;
  ENG.runEvents(s, computePulse(s), () => ({}), lucky, V2_EVENTS.filter((e) => e.id === 'v2-card-sharps'));
  assert.equal(s.player.coins, c0 - 5, 'the cost taken as before'); assert.equal(ENC.encounterOf(s), 'sharps');
  assert.deepEqual(G.actions(s).filter((o) => o.action.type === 'answer').map((o) => o.action.how), ['pay', 'refuse', 'fight']);
  assert.ok(has(s, 'talk'), 'nothing blocked: the rest stays open');
  const r = act(s, { type: 'answer', how: 'refuse' });
  assert.equal(r.player.coins, c0); assert.equal(r.player.reputation, Math.max(0, s.player.reputation - 2)); assert.equal(r.town.lio, (s.town.lio ?? 0) - 2); assert.equal(ENC.encounterOf(r), null);
  const pay = act(s, { type: 'answer', how: 'pay' }); assert.equal(pay.player.coins, c0 - 5);
  assert.equal(ENC.encounterOf(at(s, 'district')), null, 'answered on its place only');
  // over once the slot that follows ends (the event fired at the end of day 2's evening: it waits through day 3's morning)
  const later = structuredClone(s); later.day = 3; later.slot = 'morning';
  assert.equal(ENC.encounterOf(later), 'sharps'); assert.equal(ENC.encounterOf(pass(later)), null);
  // the cutpurse: let go, or fought
  const q = ripe(at(v2(), 'district', 'afternoon', 1));
  ENG.runEvents(q, computePulse(q), () => ({}), lucky, EVENTS.filter((e) => e.id === 'pickpockets'));
  assert.equal(ENC.encounterOf(q), 'cutpurse'); assert.deepEqual(G.actions(q).filter((o) => o.action.type === 'answer').map((o) => o.action.how), ['pay', 'fight']);
  // today's game: no encounter
  const old = ripe(at(G.namedState('day1-morning'), 'district', 'afternoon'));
  ENG.runEvents(old, computePulse(old), () => ({}), lucky, EVENTS.filter((e) => e.id === 'pickpockets'));
  assert.equal(old.v2, undefined);
});

const outcome = (winner, finisher = null) => ({ winner, playerHp: winner === 'player' ? 100 : 0, playerMaxHp: 300, opponentHp: winner === 'player' ? 0 : 100, opponentMaxHp: 300, finisher });
const result = (st, o) => act(st, { type: 'challengeResult', outcome: o });

test('Q-05: « se battre » — the event fight is the bout on the sand of chantier 1 (a slot, the bout first): won the coins it took back, lost as many taken again; called off, the answer waits again', () => {
  const ripe = (s) => { s.flags['pulse:festivity'] = 100; s.flags['pulse:security'] = -100; return s; };
  const s = ripe(at(v2(), 'lanterns', 'evening', 2)), c0 = s.player.coins;
  ENG.runEvents(s, computePulse(s), () => ({}), lucky, V2_EVENTS.filter((e) => e.id === 'v2-card-sharps'));
  const o = G.actions(s).find((x) => x.action.type === 'answer' && x.action.how === 'fight');
  assert.ok(o.ok, o.reason); assert.equal(o.later, 1, 'a slot booked for the result'); assert.equal(o.cost, 0);
  const f = act(s, { type: 'answer', how: 'fight' });
  assert.equal(ENC.encounterOf(f), null); assert.deepEqual({ who: f.v2.challenge.who, kind: f.v2.challenge.kind }, { who: 'vane', kind: 'encounter' });
  const won = result(f, outcome('player')); assert.equal(won.player.coins, c0, 'the 5 coins back'); assert.notEqual(won.slot, s.slot, 'the fight took the slot');
  const lost = result(f, outcome('opponent')); assert.equal(lost.player.coins, c0 - 10, 'the 5 coins taken again');
  const wounded = result(f, outcome('opponent', 'heavy')); assert.equal(wounded.player.injury, s.player.injury + 1, 'a heavy knock-down wounds as every town duel');
  const off = act(f, { type: 'cancelChallenge' }); assert.equal(off.v2.challenge, undefined); assert.equal(ENC.encounterOf(off), 'sharps', 'the answer waits again');
  // the cutpurse: Wick Sallow, 4 coins
  const q = ripe(at(v2(), 'district', 'afternoon', 1)), q0 = q.player.coins;
  ENG.runEvents(q, computePulse(q), () => ({}), lucky, EVENTS.filter((e) => e.id === 'pickpockets'));
  const qf = act(q, { type: 'answer', how: 'fight' }); assert.equal(qf.v2.challenge.who, 'wick');
  assert.equal(result(qf, outcome('player')).player.coins, q0); assert.equal(result(qf, outcome('opponent')).player.coins, q0 - 8);
  // the bout comes first: day 2's afternoon
  const bout = ripe(at(v2(), 'forecourt', 'afternoon', 2)); bout.v2.encounter = { id: 'sharps', day: 2, slot: 'afternoon', place: 'forecourt' };
  refused(bout, { type: 'answer', how: 'fight' }, /bout is this afternoon/i);
});

test('Q-05: the card sharps fought on the sand — won, they leave and the quest is done (Lio +10); lost, they take 15 coins and the quest stays open; called off, nothing changed', () => {
  const st = act(at(v2(), 'lanterns', 'evening', 2), { type: 'talk', who: 'lio' }); st.player.coins = 60;
  const o = G.actions(st).find((x) => x.action.type === 'faceSharps' && x.action.how === 'fight');
  assert.ok(o.ok, o.reason); assert.equal(o.later, 1); assert.equal(o.cost, 0); assert.equal(o.coins, 0);
  const f = act(st, { type: 'faceSharps', how: 'fight' }); assert.equal(f.v2.challenge.who, 'vane'); assert.equal(f.quests.sharps, 'asked');
  const won = result(f, outcome('player'));
  assert.equal(won.quests.sharps, 'done'); assert.ok(won.facts.includes('sharps-gone')); assert.equal(won.town.lio, (st.town.lio ?? 0) + 10); assert.equal(won.player.coins, 60);
  const lost = result(f, outcome('opponent'));
  assert.equal(lost.quests.sharps, 'asked'); assert.equal(lost.player.coins, 45); assert.equal(lost.v2.challenge, undefined);
  const poor = structuredClone(f); poor.player.coins = 9; assert.equal(result(poor, outcome('opponent')).player.coins, 0, 'never a dead end');
  const off = act(f, { type: 'cancelChallenge' }); assert.equal(off.quests.sharps, 'asked'); assert.equal(off.v2.challenge, undefined); assert.equal(ENC.encounterOf(off), null);
  refused(f, { type: 'faceSharps', how: 'pay' }, /./);
});

test('the words in both languages: each quest\'s name and offer, the encounter\'s answers, the « In progress » page', () => {
  const names = { cargo: ['The Steel Cargo', 'La cargaison d’acier'], herbs: ['Sister Anwen\'s Herbs', 'Les simples de Sœur Anwen'], treatise: ['Master Corvin\'s Treatise', 'Le traité de maître Corvin'], sharps: ['Lio\'s Card Sharps', 'Les tricheurs de Lio'] };
  for (const [id, [en, fr]] of Object.entries(names)) { assert.equal(T.tx(Q.TITLE[id]), en); assert.equal(inFrench(() => T.tx(Q.TITLE[id])), fr); }
  assert.equal(inFrench(() => T.tx('ui.quests.title')), 'En cours'); assert.equal(T.tx('ui.quests.title'), 'In progress');
  assert.match(inFrench(() => T.tx('v2.encounter.sharps.refuse', { n: 5, rep: 2 })), /5 pièces reprises.*−2 de réputation/);
  assert.match(inFrench(() => T.tx('v2.encounter.won', { name: 'Marrow Vane', n: 5 })), /Marrow Vane sur le sable/);
});
