// The two combat modes (the operator's request of 15/11/2026, journal Passes CM1, CM2; the sheet https://claude.ai/artifact/KKxYTXc7z2Tvm1rhwYwC6J): auto (the plan, the gambit,
// launches the skills) or manual (the player does; the light attack, the heavy blow, the guard and the dodge stay the automatic's), no semi-automatic. What is proved here, in Node:
// - CM-07: a press changes nothing for a fighter that is not in manual mode; a hand fighter launches no skill by itself; « Skip » gives the rest of the bout to the plan from that
//   moment (`handOff`), the lines before it untouched;
// - CM-08: the mode is the kit's (`setMode`), absent = auto, in the fingerprint only when manual, kept by the save; a bout's Ren is a hand fighter in manual, the rehearsal's
//   and the previews' are not;
// - CM-02: a skill that replaces another takes its place in every order kept (the general plan's and each rival's); the heavy blow stays refused;
// - CM-13 (it changed SY-10): a duel the player leaves before its end is lost, whole, in both modes, never wounding;
// - CM-12 / CM-10: the words, in both languages (« Off: never in auto », « the auto plays on »).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';

const AU = await load('/src/combat/auto.ts');
const AD = await load('/src/combat/autoData.ts');
const AM = await load('/src/combat/autoMatch.ts');
const ST = await load('/src/combat/stats.ts');
const G = await load('/src/simulation/index.ts');
const V2 = await load('/src/simulation/v2.ts');
const T = await load('/src/narrative/text/index.ts');
const { EN } = await load('/src/narrative/text/en.ts');
const { FR } = await load('/src/narrative/text/fr.ts');

const LV = { t1: 2, t2: 1, t3: 1, t4: 1, d1: 1, s1: 1, k_iron: 1, k_parry: 1, k_cry: 1, k_focus: 1, k_sunder: 1, k_feint: 1, heavy: 1 };
const renOf = (kit = {}) => AD.autoRen({ ...ST.REN_BASE, hp: 324, atk: 17, def: 15 }, { loadout: ['t1', 't4', 'd1', 's1'], levels: LV, ...kit }, { weapon: 'imported-blade' });
const foeOf = (id, stage = 0) => AD.autoFoe(id, AD.autoRaceSheet(id, stage, 1));
const line = (e) => [e.t, e.ev, e.who, e.act ?? '', e.dmg ?? '', e.hp ?? ''].join();
const skillCharges = (log) => log.filter((e) => e.who === 'ren' && e.ev === 'charge' && !['light', 'heavy'].includes(e.act));

test('no semi-automatic (CM-07): a press changes nothing for a fighter that is not in manual mode', () => {
  for (const foe of ['marek', 'vessa', 'rhosk']) for (const seed of [5, 88]) {
    const A = renOf({ tactic: { t4: 'ready' } }), B = foeOf(foe), base = AU.autoDuel(A, B, seed, { log: true });
    const pressed = AU.autoDuel(A, B, seed, { log: true, commands: [{ t: 8, skill: 'd1' }, { t: 20, skill: 's1' }, { t: 47, skill: 't4' }] });
    assert.deepEqual(pressed.log.map(line), base.log.map(line), `${foe} ${seed}: the auto ignores the hand`);
    assert.ok(skillCharges(base.log).length > 0, `${foe} ${seed}: the plan launches skills by itself`);
  }
});

test('the manual mode: a hand fighter launches no skill by itself, its base attacks are the automatic\'s; a press launches the skill', () => {
  for (const foe of ['marek', 'vessa', 'rhosk']) for (const seed of [5, 88]) {
    const H = { ...renOf({ tactic: { t4: 'ready' } }), hand: true }, B = foeOf(foe), none = AU.autoDuel(H, B, seed, { log: true });
    assert.equal(skillCharges(none.log).length, 0, `${foe} ${seed}: no press, no skill, whatever the plan`);
    assert.ok(none.log.some((e) => e.who === 'ren' && e.ev === 'charge' && e.act === 'light'), 'the light attack is the automatic\'s');
    const one = AU.autoDuel(H, B, seed, { log: true, commands: [{ t: 12, skill: 'd1' }] });
    assert.ok(skillCharges(one.log).some((e) => e.act === 'd1' && e.t >= 12 - 0.006), `${foe} ${seed}: the skill pressed leaves`);
  }
});

test('« Skip » in manual: from the hand-off the plan launches the skills, the lines before are the hand\'s, untouched', () => {
  for (const foe of ['marek', 'vessa', 'rhosk']) for (const seed of [5, 88]) {
    const H = { ...renOf(), hand: true }, B = foeOf(foe), none = AU.autoDuel(H, B, seed, { log: true }), T0 = 25;
    const off = AU.autoDuel(H, B, seed, { log: true, handOff: T0 });
    assert.deepEqual(off.log.filter((e) => e.t < T0 - 0.006).map(line), none.log.filter((e) => e.t < T0 - 0.006).map(line), `${foe} ${seed}: before the hand-off nothing changes`);
    assert.ok(skillCharges(off.log).some((e) => e.t >= T0 - 0.01), `${foe} ${seed}: after it the plan launches skills`);
  }
});

test('setMode: auto or manual, in the kit, in the fingerprint only when manual; the bout\'s Ren is a hand fighter in manual, the rehearsal\'s and the previews\' are not', () => {
  let st = G.makeV2(G.namedState('day1-morning'));
  const act = (a) => { const r = G.advance(st, a); assert.ok(r.ok, r.reason); st = r.state; return st; };
  assert.equal(st.v2.kit.mode, undefined, 'a new game is in auto');
  act({ type: 'setMode', mode: 'auto' });
  assert.ok(!('mode' in st.v2.kit), 'auto is the absence of the key: the kit and the fingerprint of a game that never touches the mode');
  act({ type: 'setMode', mode: 'manual' });
  assert.equal(st.v2.kit.mode, 'manual');
  const noKey = structuredClone(st); delete noKey.v2.kit.mode;
  assert.notEqual(G.hash(st), G.hash(noKey), 'manual decides the duel: in the fingerprint');
  assert.equal(G.deserialize(G.serialize(st)).v2.kit.mode, 'manual', 'kept by the save');
  assert.equal(V2.v2KitOf(st).mode, 'manual');
  assert.ok(!G.advance(st, { type: 'setMode', mode: 'semi' }).ok, 'no third mode');
  assert.ok(!G.advance(G.namedState('day1-morning'), { type: 'setMode', mode: 'manual' }).ok, 'a version 2 game only');
  act({ type: 'setMode', mode: 'auto' });
  assert.ok(!('mode' in st.v2.kit), 'back to auto: the key is gone again');
  const d = G.namedState('v2-day2-afternoon');
  assert.equal(AM.autoBoutOf(d).ren.hand, undefined, 'auto: the plan');
  d.v2.kit.mode = 'manual';
  const b = AM.autoBoutOf(d);
  assert.equal(b.ren.hand, true, 'manual: the bout\'s Ren is a hand fighter');
  assert.equal(AM.autoFightersFor(d, b.foeId, b.stage, b.round).ren.hand, undefined, 'the rehearsal and the previews play the plan');
  assert.equal(skillCharges(AM.autoOutcome(d, 'bout', { log: true }).duel.log).length, 0, 'no press, no skill');
});

test('a skill that replaces another takes its place in every order kept (the general plan\'s and each rival\'s); the heavy blow is still refused', () => {
  let st = G.makeV2(G.namedState('day1-morning'));
  const act = (a) => { const r = G.advance(st, a); assert.ok(r.ok, r.reason); st = r.state; return st; };
  st.v2.kit.levels.k_cry = 1;
  act({ type: 'setOrder', skills: ['d1', 's1', 't4', 't1'] });
  act({ type: 'setOrder', skills: ['t1', 't4', 's1', 'd1'], foe: 'vessa' });
  act({ type: 'setLoadout', skills: ['t1', 't4', 'd1', 'k_cry'] });
  assert.deepEqual(st.v2.kit.order, ['d1', 'k_cry', 't4', 't1'], 'the newcomer at the leaver\'s place in the general order');
  assert.deepEqual(st.v2.kit.plans.vessa.order, ['t1', 't4', 'k_cry', 'd1'], 'and in a rival\'s plan');
  assert.ok(!G.advance(st, { type: 'setLoadout', skills: ['heavy', 't4', 'd1', 'k_cry'] }).ok);
});

test('CM-13 (it changed SY-10): a duel the page leaves before its end is LOST, whole, in both modes, and never wounds', () => {
  const st = G.namedState('v2-day2-afternoon'), o = AM.autoOutcome(st, 'bout');
  const outcome = AM.leftOutcome(o);
  assert.deepEqual(outcome, { winner: 'opponent', playerHp: 0, playerMaxHp: o.playerMaxHp, opponentHp: o.opponentMaxHp, opponentMaxHp: o.opponentMaxHp, finisher: null }, 'a whole defeat, no finisher');
  const h0 = G.hash(st);
  st.v2.$pending = { kind: 'bout', outcome };
  assert.equal(G.hash(st), h0, 'a « $ » key: not in the fingerprint');
  const back = G.deserialize(G.serialize(st));
  assert.deepEqual(back.v2.$pending, st.v2.$pending, 'kept by the save');
  const settled = G.settlePending(back), byHand = G.advance(G.namedState('v2-day2-afternoon'), { type: 'fight', outcome });
  assert.ok(byHand.ok);
  assert.equal(G.hash(settled), G.hash(byHand.state), 'the bout is lost as a defeat played to its end would be');
  const mine = (x) => x.tournament.matches.find((m) => m.day === 2 && (m.a === 'player' || m.b === 'player'));
  assert.notEqual(mine(settled).winner, 'player', 'the opponent won');
  assert.ok(!settled.player.wounded && !JSON.stringify(settled.facts).includes('wound'), 'no wound: only a heavy knock-down wounds');
  assert.equal(settled.v2.$pending, undefined);
  const m = G.namedState('v2-day2-afternoon'); m.v2.kit.mode = 'manual';
  assert.deepEqual(AM.leftOutcome(AM.autoOutcome(m, 'bout')), outcome, 'the result written does not depend on the mode');
});

test('the words: « Off: never in auto » (CM-12), « the auto plays on » (CM-10), both languages, the modes named', () => {
  assert.equal(EN['auto.cond.never'], 'Off: never in auto');
  assert.equal(FR['auto.cond.never'], 'Désactivée : jamais en auto');
  assert.equal(EN['auto.skip.hand'], 'the auto plays on');
  assert.equal(FR['auto.skip.hand'], 'l’auto finit le combat');
  assert.deepEqual([EN['v2.mode.auto'], EN['v2.mode.manual'], FR['v2.mode.auto'], FR['v2.mode.manual']], ['Auto', 'Manual', 'Auto', 'Manuel']);
  assert.ok(!/rend/.test(FR['auto.skip.hand']), 'no « rend »: the operator doubted the word');
  assert.match(EN['v2.arena.leaveLoses'], /defeat/); assert.match(FR['v2.arena.leaveLoses'], /défaite/);
  assert.ok(T, 'the text module loads');
});
