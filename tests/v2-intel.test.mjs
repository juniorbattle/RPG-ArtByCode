// Lot L3 of step 5 (journal Passe EVL5; the operator's EV-10 « Une réponse par lieu, un effet lisible » and EV-11 « Observer tout adversaire, rumeurs, activité
// lisible », journal Passe EV2): every rival watched where and when they train, a rumour of the next opponent from Lio's room (often right) or the hooded stranger
// (never wrong), what the town saw on the board, the arena's lockers with their own answer (Clerk Odo's strongroom) and the quay's watch guarding the forge
// alone, the strap cut said on the match sheet and found after the bout, Lady Edda naming the colours, the report's compensation; the curious player using them;
// today's game offering none of it. The oracles are the rules written out here (places and hours, the forms' thresholds, the calendar's eves), not the code's.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';

const G = await load('/src/simulation/index.ts');
const I = await load('/src/simulation/v2intel.ts');
const D = await load('/src/narrative/dialogue.ts');
const LAB = await load('/src/tournament/lab.ts');
const U = await load('/src/ui/townUi.ts');
const { EN } = await load('/src/narrative/text/en.ts');
const { tx } = await load('/src/narrative/text/index.ts');
const { RIVALS } = await load('/src/narrative/roster.ts');

const v2 = (name = 'day1-morning') => G.makeV2(G.namedState(name));
const act = (st, a, rng) => { const r = G.advance(st, a, rng); assert.ok(r.ok, `${a.type}: ${r.reason}`); return r; };
const opt = (st, pred) => G.actions(st).find((o) => pred(o.action));
const at = (st, day, slot, place) => { const s = structuredClone(st); s.day = day; s.slot = slot; s.place = place; return s; };
const SLOTS = ['morning', 'afternoon', 'evening'], PLACES = ['district', 'forecourt', 'training', 'lanterns'];
const WON = { winner: 'player', playerHp: 120, playerMaxHp: 200, opponentHp: 0, opponentMaxHp: 600, finisher: 'tech' };

/** where and when each rival trains in a version 2 game (src/narrative/people.ts, written out): the forecourt and the training ground by day, the festival square
 *  at night, Rhosk and Tobin from day 6 */
const PRACTICE = {
  vessa: { place: 'forecourt', slots: ['morning', 'afternoon'] }, marek: { place: 'forecourt', slots: ['morning', 'afternoon'] },
  orla: { place: 'training', slots: ['morning', 'afternoon'] }, ilse: { place: 'training', slots: ['morning', 'afternoon'] },
  cassius: { place: 'lanterns', slots: ['evening'] }, rhosk: { place: 'training', slots: ['morning', 'afternoon'], from: 6 }, tobin: { place: 'training', slots: ['morning', 'afternoon'], from: 6 },
};
/** a rival's form by its preparation (its blows 1 + preparation / 400): under 40 rusty, under 70 steady, then sharp */
const FORM = (p) => (p < 40 ? 'rusty' : p < 70 ? 'steady' : 'sharp');

// ------------------------------------------------------------------------------------------------- observing every rival (EV-11)

test('a version 2 game: every rival of the pool watched where and when they train, once each; the match sheet names their skills after', () => {
  const base = v2();
  for (let day = 1; day <= 10; day++) for (const slot of SLOTS) for (const place of PLACES) {
    const s = at(base, day, slot, place);
    for (const [who, p] of Object.entries(PRACTICE)) {
      const o = opt(s, (a) => a.type === 'scout' && a.who === who);
      const listed = p.place === place && day >= (p.from ?? 1), there = listed && p.slots.includes(slot);
      assert.equal(!!o, listed, `${who} listed day ${day} ${slot} at ${place}`);
      // the bout comes first on the afternoon of a bout of the player's (the pool's days 2, 4 and 5 in this state)
      if (o) assert.equal(o.ok, there && !(slot === 'afternoon' && [2, 4, 5].includes(day)), `${who} watchable day ${day} ${slot}: ${o.reason}`);
      if (o?.ok) assert.equal(o.cost, 1, 'a slot');
    }
  }
  // Orla on the training ground: the log tells her style, the fact is kept, the match sheet names her skills; once only
  const s = at(base, 3, 'morning', 'training');
  const r = act(s, { type: 'scout', who: 'orla' });
  assert.equal(r.events[0].text, tx('v2.scout.log', { name: 'Orla Brask', habit: EN['v2.scout.habit.orla'] }));
  assert.ok(r.state.facts.includes('scouted:orla'));
  assert.match(U.foeIntel(r.state, 'orla'), /Dockside Shoulder/);
  const again = opt(at(r.state, 3, 'afternoon', 'training'), (a) => a.type === 'scout' && a.who === 'orla');
  assert.equal(again.ok, false); assert.equal(again.reason, tx('scout.known', { name: 'Orla Brask' }));
  // Cassius at night on the festival square, behind the hall's stage
  const c = act(at(base, 4, 'evening', 'lanterns'), { type: 'scout', who: 'cassius' });
  assert.match(c.events[0].text, /stage/);
  // every rival has a habit of their own
  assert.equal(new Set(Object.keys(PRACTICE).map((w) => EN[`v2.scout.habit.${w}`])).size, 7);
});

test('today\'s game keeps its two rivals to watch, on the forecourt, with today\'s words', () => {
  const st = G.namedState('forecourt-morning');
  const scouts = G.actions(st).filter((o) => o.action.type === 'scout');
  assert.deepEqual(scouts.map((o) => o.action.who), ['vessa', 'marek']);
  assert.equal(scouts[0].label, tx('scout.label', { name: 'Vessa Lark' }));
  const r = act(st, { type: 'scout', who: 'vessa' });
  assert.equal(r.events[0].text, tx('scout.log', { name: 'Vessa Lark', habit: EN['scout.habitOther'] }));
  for (const place of ['district', 'lanterns']) assert.equal(G.actions({ ...structuredClone(st), place }).filter((o) => o.action.type === 'scout').length, 0, place);
});

// ------------------------------------------------------------------------------------------------- the rumours (EV-11)

test('a rumour of the next opponent: Lio\'s room on the festival square at every hour (3 coins), the stranger on the quay at night (8); once a day each', () => {
  const base = v2();
  for (const slot of SLOTS) for (const place of PLACES) {
    const s = at(base, 1, slot, place);
    const lio = opt(s, (a) => a.type === 'rumour' && a.src === 'lio'), str = opt(s, (a) => a.type === 'rumour' && a.src === 'stranger');
    assert.equal(!!lio, place === 'lanterns', `Lio ${slot} ${place}`); if (lio) { assert.ok(lio.ok, lio.reason); assert.equal(lio.coins, 3); assert.equal(lio.cost, 0); }
    assert.equal(!!str, place === 'district', `stranger ${slot} ${place}`); if (str) { assert.equal(str.ok, slot === 'evening', `stranger ${slot}: ${str.reason}`); assert.equal(str.coins, 8); }
  }
  // day 1: tomorrow's opponent is Vessa; the purse pays; once a day
  const s = at(base, 1, 'morning', 'lanterns'), o = opt(s, (a) => a.type === 'rumour' && a.src === 'lio');
  assert.equal(o.label, tx('v2.rumour.lioLabel', { name: 'Vessa Lark', n: 3 }));
  const r = act(s, { type: 'rumour', src: 'lio' });
  assert.equal(r.state.player.coins, s.player.coins - 3);
  assert.ok(r.state.v2.heard.vessa, 'kept, of Vessa');
  assert.equal(r.events[0].id, 'rumour:lio');
  const twice = opt(r.state, (a) => a.type === 'rumour' && a.src === 'lio'); assert.equal(twice.ok, false); assert.equal(twice.reason, EN['v2.rumour.lioAsked']);
  const tomorrow = opt(at(r.state, 2, 'morning', 'lanterns'), (a) => a.type === 'rumour' && a.src === 'lio'); assert.ok(tomorrow.ok, tomorrow.reason);
  // poor
  const poor = at(base, 1, 'evening', 'district'); poor.player.coins = 7;
  assert.equal(opt(poor, (a) => a.type === 'rumour' && a.src === 'stranger').reason, tx('v2.rumour.poor', { n: 8 }));
  // after the second bout, the next is Orla (the calendar's round 2)
  let w = v2('v2-day2-afternoon'); w = act(w, { type: 'fight', outcome: WON }).state; w.place = 'lanterns';
  assert.equal(I.nextOpponent(w), 'orla');
  // every bout fought: nobody left to ask about
  const done = structuredClone(w); for (const m of done.tournament.matches) if (m.a === 'player' || m.b === 'player') m.winner = 'player';
  assert.equal(opt(done, (a) => a.type === 'rumour').reason, EN['v2.rumour.none']);
  // today's game: none anywhere
  for (const name of ['day1-morning', 'lanterns-night', 'day1-evening']) assert.equal(G.actions(G.namedState(name)).filter((x) => x.action.type === 'rumour' || x.action.type === 'lockGear').length, 0, name);
});

test('the stranger is never wrong, secrets included; Lio\'s room is right two times in three, never tells a secret, and its lies change the health and the form', () => {
  const base = at(v2(), 3, 'evening', 'district');
  // Orla (the next opponent of day 3 is Orla, day 4) with a known state: hurt, preparation 75, she watched the player yesterday and met nobody in a hood
  base.competitors.orla.healthState = 'hurt'; base.competitors.orla.preparation = 75;
  base.log.push({ seq: base.log.length, day: 2, slot: 'evening', kind: 'offscreen', id: 'orla:spy', cause: 'offscreen:orla', text: 'Orla Brask watches the other fighters.', visible: false });
  assert.equal(I.nextOpponent(base), 'orla');
  const truth = { hp: 'hurt', form: FORM(75) };
  for (let k = 0; k < 40; k++) {
    const s = structuredClone(base); s.step = k;
    const h = act(s, { type: 'rumour', src: 'stranger' }).state.v2.heard.orla;
    assert.deepEqual({ hp: h.hp, form: h.form, secret: h.secret, src: h.src, day: h.day }, { ...truth, secret: 'spy', src: 'stranger', day: 3 });
  }
  // a meeting with a hood tells first; a secret older than yesterday is not told
  const plot = structuredClone(base); plot.log.push({ seq: plot.log.length, day: 3, slot: 'morning', kind: 'offscreen', id: 'orla:plot', cause: 'offscreen:orla', text: 'x', visible: false });
  assert.equal(act(plot, { type: 'rumour', src: 'stranger' }).state.v2.heard.orla.secret, 'plot');
  const old = structuredClone(base); old.day = 5; old.tournament.matches.find((m) => m.day === 4 && m.b === 'orla').winner = 'player';
  assert.equal(I.secretOf(old, 'orla'), undefined);
  // Lio's room over many evenings: right two times in three, never a secret; a lie flips the health and changes the form
  let right = 0; const n = 900;
  for (let k = 0; k < n; k++) {
    const s = structuredClone(base); s.place = 'lanterns'; s.step = k;
    const h = act(s, { type: 'rumour', src: 'lio' }).state.v2.heard.orla;
    assert.equal(h.secret, undefined, 'the room tells no secret');
    if (h.hp === truth.hp && h.form === truth.form) right++;
    else { assert.equal(h.hp, 'fit', 'a lie: the health flipped'); assert.notEqual(h.form, truth.form, 'a lie: another form'); }
  }
  assert.ok(Math.abs(right / n - 2 / 3) < 0.05, `right ${right} of ${n}`);
  // the words: the source and the day on the board and the match sheet
  const heard = act(base, { type: 'rumour', src: 'stranger' }).state;
  assert.equal(I.heardLine(heard, 'orla'), tx('v2.heard.line', { src: EN['v2.heard.stranger'], day: 3, said: `${tx('v2.rumour.about', { name: 'Orla Brask', hp: EN['v2.rumour.hp.hurt'], form: EN['v2.rumour.form.sharp'] })} ${EN['v2.rumour.secret.spy']}` }));
  assert.equal(I.heardLine(heard, 'vessa'), null);
});

test('the forms\' thresholds: their blows a tenth, then a sixth, then a quarter harder at most', () => {
  for (const p of [0, 20, 39, 40, 69, 70, 100]) assert.equal(I.formOf(p), FORM(p), String(p));
});

// ------------------------------------------------------------------------------------------------- what the town saw (EV-11)

test('the board says what the town saw a rival do since yesterday: the public acts counted from the log, never the secret ones', () => {
  const s = at(v2(), 3, 'afternoon', 'district'), name = 'Orla Brask';
  const push = (day, act, text) => s.log.push({ seq: s.log.length, day, slot: 'morning', kind: 'offscreen', id: `orla:${act}`, cause: 'offscreen:orla', text, visible: false });
  push(1, 'train', tx('off.train', { name }));   // the day before yesterday: not counted
  push(2, 'train', tx('off.train', { name })); push(3, 'train', tx('off.train', { name })); push(2, 'buy', tx('off.buy', { name }));
  push(2, 'socialise', tx('off.socialise', { name, other: 'Vessa Lark' })); push(3, 'socialise', tx('off.socialiseWords', { name, other: 'Rhosk' }));
  push(3, 'spy', tx('off.spy', { name })); push(3, 'plot', tx('off.plot', { name }));
  const line = I.seenInTown(s, 'orla');
  assert.equal(line, tx('v2.seen.line', { acts: [tx('v2.seen.trainN', { n: 2 }), EN['v2.seen.buy'], tx('v2.seen.drink', { names: 'Vessa Lark' }), tx('v2.seen.words', { names: 'Rhosk' })].join(', ') }));
  assert.doesNotMatch(line, /watch|hood|tannery/);
  assert.equal(I.seenInTown(at(v2(), 3, 'morning', 'district'), 'orla'), EN['v2.seen.none']);
  // over a whole game: every day, every rival, the drills said are the log's own, and no secret is ever said
  let st = v2();
  for (let i = 0; i < 40 && !st.over; i++) {
    for (const id of Object.keys(RIVALS)) {
      const said = I.seenInTown(st, id), trains = st.log.filter((e) => e.kind === 'offscreen' && e.id === `${id}:train` && e.day >= st.day - 1).length;
      assert.equal(said.includes(trains === 1 ? `: ${EN['v2.seen.train']}` : tx('v2.seen.trainN', { n: trains })) || trains === 0, true, `${id} day ${st.day}: ${said}`);
      assert.doesNotMatch(said, /watch|hood|tannery/, said);
    }
    const w = G.actions(st).find((o) => o.action.type === 'wait' && o.ok);
    st = act(st, w ? w.action : { type: 'fight', outcome: WON }).state;
  }
});

// ------------------------------------------------------------------------------------------------- the lockers' own answer (EV-10)

test('Clerk Odo\'s strongroom: on the forecourt by day, the eve of a bout of the player\'s (day 5 always: the cut sets day 6 for all eight), 5 coins, once a night', () => {
  const base = v2();
  // the eves the calendar gives: the pool's bouts on days 2, 4 and 5, everyone fights on day 6
  for (const [day, eve] of [[1, true], [2, false], [3, true], [4, true], [5, true]]) {
    for (const slot of SLOTS) {
      const o = opt(at(base, day, slot, 'forecourt'), (a) => a.type === 'lockGear');
      assert.ok(o, `listed day ${day} ${slot}`);
      assert.equal(o.ok, eve && slot !== 'evening', `day ${day} ${slot}: ${o.reason}`);
      if (!eve && slot !== 'evening') assert.equal(o.reason, EN['v2.strongroom.noBout']);
    }
  }
  for (const place of ['district', 'training', 'lanterns']) assert.equal(opt(at(base, 1, 'morning', place), (a) => a.type === 'lockGear'), undefined, place);
  const s = at(base, 1, 'afternoon', 'forecourt'), r = act(s, { type: 'lockGear' });
  assert.equal(r.state.player.coins, s.player.coins - 5); assert.equal(r.state.flags['strongroom:1'], true); assert.equal(r.events[0].text, EN['v2.strongroom.log']);
  assert.equal(opt(r.state, (a) => a.type === 'lockGear').reason, EN['v2.strongroom.done']);
  const poor = at(base, 1, 'morning', 'forecourt'); poor.player.coins = 4;
  assert.equal(opt(poor, (a) => a.type === 'lockGear').reason, tx('v2.strongroom.poor', { n: 5 }));
});

test('the quay\'s watch guards the forge alone, in its words, in every game', () => {
  for (const st of [v2('day1-evening'), G.namedState('day1-evening')]) {
    const o = opt(st, (a) => a.type === 'payWatch');
    assert.equal(o.label, EN['payWatch.label']);
    assert.equal(act(st, { type: 'payWatch' }).events[0].text, EN['payWatch.log']);
  }
  assert.doesNotMatch(EN['payWatch.label'] + EN['payWatch.log'], /locker/);
});

// ------------------------------------------------------------------------------------------------- the strap cut said, found, and its culprit (EV-10)

/** day 6, the semi-final's afternoon, the strap cut in the night (the event's effect) */
function cutDay6() {
  const s = v2('v2-day2-afternoon');
  s.day = 6; s.slot = 'afternoon'; s.place = 'forecourt';
  for (const m of s.tournament.matches) if (m.a === 'player' || m.b === 'player') m.winner = 'player';
  s.tournament.matches.push({ round: 4, a: 'player', b: 'marek', winner: null, close: false, day: 6, seen: true, stage: 'semi' }, { round: 4, a: 'vessa', b: 'orla', winner: 'vessa', close: false, day: 6, seen: false, stage: 'semi' },
    { round: 4, a: 'cassius', b: 'ilse', winner: 'cassius', close: false, day: 6, seen: false, stage: 'gate' }, { round: 4, a: 'rhosk', b: 'tobin', winner: 'rhosk', close: false, day: 6, seen: false, stage: 'gate' });
  s.facts.push('armour-asked', 'locker-open', 'gear-tampered'); s.flags['tamper-done'] = true; s.flags['tampered:6'] = true;
  return s;
}

test('a strap cut and not stitched: said on the match sheet\'s day, found after the bout (its culprit unknown), never once Hilde stitched it', () => {
  const s = cutDay6();
  assert.equal(I.strapCut(s), true);
  // Hilde before the bell (a minor action, allowed on the bout's afternoon): stitched, nothing found after
  const h = act(s, { type: 'checkGear' }).state;
  assert.equal(I.strapCut(h), false);
  assert.equal(act(h, { type: 'fight', outcome: WON }).events.some((e) => e.id === 'tamper:suffered'), false);
  // fought on: found when the gear comes off, the culprit not yet known
  const f = act(s, { type: 'fight', outcome: WON });
  const e = f.events.find((x) => x.id === 'tamper:suffered');
  assert.ok(e); assert.equal(e.kind, 'consequence'); assert.equal(e.text, EN['v2.tamper.suffered']);
  assert.ok(f.state.facts.includes('tamper-suffered')); assert.equal(f.state.flags['culprit-known'], undefined);
  // today's game: the same afternoon says nothing (it has no such sabotage)
  const today = cutDay6(); delete today.flags.v2; delete today.v2;
  assert.equal(I.strapCut(today), false);
});

test('Lady Edda: a sign once a servant asked Hilde about the straps; the witness who names House Dree once a strap was fought on; her word after the report', () => {
  const st = at(v2(), 4, 'morning', 'forecourt');
  assert.deepEqual(D.linesOf(st, 'edda'), [EN['v2.line.edda']]);
  st.facts.push('armour-asked');
  assert.deepEqual(D.linesOf(st, 'edda'), [EN['v2.line.edda'], EN['v2.line.edda.strap']]);
  // the strap fought on: talking to her names the colours, once
  const f = act(cutDay6(), { type: 'fight', outcome: WON }).state; f.day = 7; f.slot = 'morning';
  const t = act(f, { type: 'talk', who: 'edda' });
  const w = t.events.find((e) => e.id === 'edda:witness');
  assert.ok(w); assert.equal(w.text, EN['v2.edda.witness']); assert.equal(w.cause, EN['v2.edda.why']);
  assert.equal(t.state.flags['culprit-known'], 'cassius');
  assert.equal(act(t.state, { type: 'talk', who: 'edda' }).events.some((e) => e.id === 'edda:witness'), false, 'once');
  // without a strap fought on, she names nobody
  assert.equal(act(st, { type: 'talk', who: 'edda' }).state.flags['culprit-known'], undefined);
  // the report on the quay: the compensation for the gear, Cassius docked; then her word
  const q = structuredClone(t.state); q.place = 'district';
  const pts = q.tournament.points.cassius, coins = q.player.coins;
  const rep = act(q, { type: 'report' });
  assert.equal(rep.events[0].text, EN['v2.report.gearLog']); assert.equal(rep.state.tournament.points.cassius, pts - 3); assert.equal(rep.state.player.coins, coins + 15);
  const back = structuredClone(rep.state); back.place = 'forecourt';
  assert.ok(D.linesOf(back, 'edda').includes(EN['v2.line.edda.justice']));
});

test('the report and the confrontation say which chain they answer: the gear, or the forge as in today\'s game', () => {
  const gear = at(v2(), 7, 'evening', 'lanterns'); gear.flags['culprit-known'] = 'cassius'; gear.facts.push('tamper-found');
  assert.equal(opt(gear, (a) => a.type === 'confront').label, EN['v2.confront.gearLabel']);
  assert.equal(act(gear, { type: 'confront' }).events[0].text, EN['v2.confront.gearLog']);
  const forge = structuredClone(gear); forge.facts.push('forge-burned');
  assert.equal(opt(forge, (a) => a.type === 'confront').label, EN['confront.label']);
  forge.place = 'district'; assert.equal(act(forge, { type: 'report' }).events[0].text, EN['report.log']);
  // today's game keeps its words
  const today = G.namedState('lanterns-night'); today.flags['culprit-known'] = 'cassius';
  assert.equal(opt(today, (a) => a.type === 'confront').label, EN['confront.label']);
  // the stranger's warning, in a version 2 game, names both places and their answers
  const warn = at(v2(), 3, 'evening', 'district'); warn.competitors.cassius.relationships.player = -40;
  assert.equal(act(warn, { type: 'buyInfo' }).events[0].text, EN['v2.buyInfo.warn']);
  const old = G.namedState('day1-evening'); old.competitors.cassius.relationships.player = -40;
  assert.equal(act(old, { type: 'buyInfo' }).events[0].text, EN['buyInfo.warn']);
});

// ------------------------------------------------------------------------------------------------- the curious player (EV-16)

test('the curious player uses lot L3: its next opponent watched where they train, a rumour of tomorrow\'s, the strongroom after a sign at the lockers', () => {
  const seen = { scoutAway: 0, rumour: 0, strongroom: 0, foiled: 0, watchForGear: 0 };
  for (let seed = 1; seed <= 12; seed++) {
    const st = LAB.autoplay(seed, LAB.POLICIES.curious, undefined, undefined, 'v2').state;
    seen.scoutAway += st.log.filter((e) => /^scout:(orla|ilse|cassius|rhosk|tobin)$/.test(e.id)).length;
    seen.rumour += st.log.filter((e) => e.id === 'rumour:lio').length;
    seen.strongroom += st.log.filter((e) => e.id === 'strongroom').length;
    if (st.facts.includes('tamper-foiled')) seen.foiled++;
  }
  for (const [k, v] of Object.entries(seen)) if (k !== 'watchForGear') assert.ok(v > 0, `${k}: ${JSON.stringify(seen)}`);
});
