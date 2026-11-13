// Lot 2 of the second combat redesign (briefs/combat-auto.md § 25.5, § 28.1; journal Passe SL3): the tactic (the operator's SY-08 « Une condition par compétence,
// l’ordre gardé »), the automatic keeping its strongest skill for the break (SL1-3), the hand (SY-09 « Au prochain choix de Ren, une compétence en attente »),
// an old save's heavy blow among the four (SL1-7). What is proved here, in Node:
// - the automatic is the tactic whose every line is 'auto': a fighter without a tactic and one with four 'auto' lines fight the same duel, event for event;
// - SL1-3: the strongest offensive skill leaves only on a break long enough for it to land, or at full AP when nothing else held;
// - each condition of a tactic against an oracle written from SY-08's words; 'never' never leaves by itself; the tactic is part of the game (setTactic);
// - the hand: a press changes nothing before it (one draw per blow), leaves at Ren's next choice once its AP and cooldown allow it, waits meanwhile, a later
//   press replacing it; the arena's replay swaps its script at the press, keeps every line it played, and ends on the new duel's result;
// - SL1-7: a save whose four held the heavy blow gives its place to the next skill owned, in the skills page's order; setLoadout refuses the heavy blow.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';

const AU = await load('/src/combat/auto.ts');
const AD = await load('/src/combat/autoData.ts');
const AV = await load('/src/arena/autoView.ts');
const ST = await load('/src/combat/stats.ts');
const G = await load('/src/simulation/index.ts');
const ADV = await load('/src/simulation/advance.ts');
const AM = await load('/src/combat/autoMatch.ts');

const RIVALS = Object.keys(ST.RIVAL_SHEETS);
const LV = { t1: 2, t2: 1, t3: 1, t4: 1, d1: 1, s1: 1, k_iron: 1, k_parry: 1, k_cry: 1, k_focus: 1, k_sunder: 1, k_feint: 1, heavy: 1 };
const renOf = (kit = {}) => AD.autoRen({ ...ST.REN_BASE, hp: 324, atk: 17, def: 15 }, { loadout: ['t1', 't4', 'd1', 's1'], levels: LV, ...kit }, { weapon: 'imported-blade' });
const foeOf = (id, stage = 0) => AD.autoFoe(id, AD.autoRaceSheet(id, stage, 1));
const line = (e) => [e.t, e.ev, e.who, e.act ?? '', e.dmg ?? '', e.hp ?? ''].join();

test('the automatic is the tactic of four « auto » lines', () => {
  for (const foe of RIVALS) for (const seed of [3, 41, 977]) {
    const a = AU.autoDuel(renOf(), foeOf(foe), seed, { log: true }), x = renOf();
    x.tactic = x.skills.map(() => 'auto');
    const b = AU.autoDuel(x, foeOf(foe), seed, { log: true });
    assert.deepEqual(b.log.map(line), a.log.map(line), `${foe} ${seed}`);
  }
  assert.equal(renOf().tactic, undefined, 'a kit without a tactic builds a fighter without one');
  assert.equal(renOf({ tactic: { t1: 'auto' } }).tactic, undefined, 'every line « auto »: none');
  assert.deepEqual(renOf({ tactic: { t4: 'broken', s1: 'follow' } }).tactic, ['auto', 'follow', 'broken', 'auto'], 'in the order of the four (wards, boosts, offensive from the strongest)');
  assert.deepEqual(renOf({ tactic: { d1: 'follow' } }).tactic, undefined, 'a condition its family does not take is the automatic\'s');
});

/** a hand-made view (the decision's inputs only) */
const side = (o = {}) => ({ ap: 3, hp: 100, maxHp: 100, g: 0, broken: false, stunEnd: 0, act: null, at: 0, ward: null, boost: null, ...o });
const view = (o = {}) => { const me = side(o.me), foe = side(o.foe); return { t: 10, me, foe, rules: AU.AUTO_RULES, usable: o.usable ?? ((a) => (a.ap ?? 0) <= me.ap), gauge: (s) => s.g, chargeOf: (_, a) => a.charge, rand: () => 0.5 }; };
const off = (id, power, ap = 2, charge = 2) => ({ id, kind: 'skill', family: 'offensive', power, ap, charge });
const fighter = (skills, tactic) => ({ skills, tactic, heavy: { id: 'heavy', kind: 'heavy', charge: 1, ap: 0 }, light: { id: 'light', kind: 'light', charge: 0.7 } });

test('SL1-3: the strongest offensive skill is kept for the break, or the AP full', () => {
  const t1 = off('t1', 50), t4 = off('t4', 90, 3, 4), x = fighter([t4, t1]);
  assert.equal(AU.strongestOf(x), t4);
  assert.equal(AU.autoSkillChoice(view({ me: { ap: 4 } }), x), t1, 'the strongest waits, the other goes');
  assert.equal(AU.autoSkillChoice(view({ me: { ap: 4 }, foe: { broken: true, stunEnd: 15 } }), x), t4, 'broken for 5 s: its 4 s charge lands');
  assert.equal(AU.autoSkillChoice(view({ me: { ap: 4 }, foe: { broken: true, stunEnd: 12 } }), x), t1, 'broken for 2 s: too short for it');
  assert.equal(AU.autoSkillChoice(view({ me: { ap: 3 }, usable: (a) => a === t4 }), x), null, 'the other not ready: it still waits');
  assert.equal(AU.autoSkillChoice(view({ me: { ap: 5 }, usable: (a) => a === t4 }), x), t4, 'the AP full and nothing else: rather than lose them');
});

test('a tactic\'s conditions, against SY-08\'s words', () => {
  const t1 = off('t1', 50), t4 = off('t4', 90, 3, 4), C = (c, o, s = t1, x = fighter([t1, t4])) => AU.condHolds(c, view(o), x, s);
  assert.ok(C('ready', {}));
  assert.ok(C('broken', { foe: { broken: true, stunEnd: 13 } }) && !C('broken', { foe: { broken: true, stunEnd: 11 } }), 'broken long enough for it to land');
  const big = { act: { id: 'm', kind: 'skill' }, at: 14 };
  assert.ok(C('incoming', { foe: big }) && !C('incoming', { foe: { ...big, at: 11 } }) && !C('incoming', { foe: { act: { id: 'l', kind: 'light' }, at: 14 } }), 'an offensive skill leaving before the big blow');
  const ward = { id: 'd1', kind: 'skill', family: 'defensive', ward: { dur: 5 }, ap: 2, charge: 2 };
  assert.ok(C('incoming', { foe: big }, ward) && !C('incoming', { foe: { ...big, at: 18 } }, ward), 'a ward up before the blow and still up when it lands');
  assert.ok(C('gauge', { me: { g: 47 } }) && !C('gauge', { me: { g: 46 } }), 'two thirds of 70');
  assert.ok(C('hurt', { me: { hp: 49 } }) && !C('hurt', { me: { hp: 50 } }));
  assert.ok(C('finish', { foe: { hp: 33 } }) && !C('finish', { foe: { hp: 34 } }));
  const boost = { id: 's1', kind: 'skill', family: 'support', boost: { dur: 12 }, ap: 2, charge: 2 };
  assert.ok(C('follow', { me: { ap: 4 } }, boost) && !C('follow', { me: { ap: 3 } }, boost), 'an offensive skill can follow it');
  assert.ok(!C('never', {}));
  const x = fighter([t1, t4], ['never', 'ready']);
  assert.equal(AU.tacticChoice(view({ me: { ap: 3 } }), x, x.tactic), t4, '« never » never leaves by itself');
  assert.equal(AU.tacticChoice(view({ me: { ap: 5 } }), fighter([t4, t1], ['finish', 'never']), ['finish', 'never']), null, 'no full-AP rule but the automatic\'s');
});

test('the tactic is part of the game: setTactic', () => {
  let st = G.makeV2(G.namedState('day1-morning'));
  const act = (a) => { const r = G.advance(st, a); assert.ok(r.ok, r.reason); st = r.state; return st; };
  assert.equal(st.v2.kit.tactic, undefined);
  const h0 = G.hash(st);
  act({ type: 'setTactic', skill: 't4', cond: 'finish' });
  assert.deepEqual(st.v2.kit.tactic, { t4: 'finish' });
  assert.notEqual(G.hash(st), h0, 'in the fingerprint');
  act({ type: 'setTactic', skill: 't4', cond: 'auto' });
  assert.equal(st.v2.kit.tactic, undefined, '« auto » gives the line back');
  assert.ok(!G.advance(st, { type: 'setTactic', skill: 'k_cry', cond: 'ready' }).ok, 'only one of the four');
  assert.ok(!G.advance(st, { type: 'setTactic', skill: 'd1', cond: 'follow' }).ok, 'only a condition its family takes');
});

test('the hand: nothing before the press changes, the skill leaves at the next choice that can pay it, one waits at a time', () => {
  for (const foe of ['marek', 'vessa', 'rhosk']) for (const seed of [5, 88]) {
    const A = renOf(), B = foeOf(foe), base = AU.autoDuel(A, B, seed, { log: true });
    for (const at of [8, 20.5, 47]) for (const sk of ['t1', 't4', 'd1', 's1']) {
      const r = AU.autoDuel(A, B, seed, { log: true, commands: [{ t: at, skill: sk }] });
      const before = (L) => L.filter((e) => e.t < at - 0.006).map(line);
      assert.deepEqual(before(r.log), before(base.log), `${foe} ${seed} ${sk} at ${at}: the lines before the press`);
      // the first charge of Ren after the press: the skill pressed if he could pay it then; never another skill while it waits and could leave
      const goes = r.log.find((e) => e.who === 'ren' && e.ev === 'charge' && e.t >= at - 0.006 && e.act === sk);
      if (r.winner !== null && r.log.at(-1).t > at + 60) assert.ok(goes, `${foe} ${seed} ${sk} at ${at}: it leaves within the minute`);
      // while it waits, his base attacks only: no other skill spends the AP it waits for
      if (goes) assert.ok(!r.log.some((e) => e.who === 'ren' && e.ev === 'charge' && e.t > at + 0.01 && e.t < goes.t && !['light', 'heavy'].includes(e.act)), `${foe} ${seed} ${sk} at ${at}: no other skill meanwhile`);
    }
    // a later press replaces the first: only the second leaves
    const two = AU.autoDuel(A, B, seed, { log: true, commands: [{ t: 30, skill: 't4' }, { t: 30.01, skill: 's1' }] });
    const first = two.log.find((e) => e.who === 'ren' && e.ev === 'charge' && e.t >= 30.01 && (e.act === 't4' || e.act === 's1'));
    assert.equal(first?.act, 's1', `${foe} ${seed}: the later press replaces the one waiting`);
  }
});

test('the hand in the arena: the replay swaps its script at the press and ends on the new duel', () => {
  for (const foe of ['marek', 'orla', 'cassius']) {
    const d = AV.sceneAutoDuel(foe, 1337), rp = new AV.AutoReplay(d.result, { ren: d.ren, marek: d.foe }), presses = [];
    for (let k = 0; k < 12 * 120; k++) rp.step();
    const played = d.result.log.slice(0, d.result.log.findIndex((e) => e.t > rp.t)).map(line);
    const t = +(Math.max(rp.t, rp.lastLineT() + 0.006) + 1e-6).toFixed(6), p = { t, skill: d.ren.skills[2].id };
    presses.push(p);
    const r = AU.autoDuel(d.ren, d.foe, d.seed, { log: true, trace: true, commands: presses });
    assert.ok(rp.replace(r, p), `${foe}: every line played kept`);
    assert.deepEqual(r.log.slice(0, played.length).map(line), played);
    assert.equal(rp.hud().slots[2].waiting, true, 'its line waits');
    let n = 0; while (!rp.over && n++ < 2e6) rp.step();
    assert.equal(rp.over, true);
    assert.equal(rp.end, r.t, 'the new duel\'s end');
    assert.equal(rp.winner, (r.winner ?? (r.hp[0] / r.maxHp[0] >= r.hp[1] / r.maxHp[1] ? 0 : 1)) === 0 ? 'ren' : 'marek');
    assert.deepEqual([rp.f.ren.hp, rp.f.marek.hp], [r.hp[0], r.hp[1]], `${foe}: the replay ends on the new duel's health`);
  }
});

test('SL1-7: the heavy blow out of the four of an old save; setLoadout refuses it', () => {
  const kit = { loadout: ['heavy', 't1', 'd1', 's1'], levels: { t1: 1, t4: 1, d1: 1, s1: 1, heavy: 1, k_cry: 1 }, order: ['d1', 'heavy', 's1', 't1'] };
  ADV.heavyOutOfFour(kit);
  assert.deepEqual(kit.loadout, ['k_cry', 't1', 'd1', 's1'], 'the next owned after it in the page\'s order, wrapping round');
  assert.deepEqual(kit.order, ['d1', 'k_cry', 's1', 't1'], 'at its place in the order');
  const k2 = { loadout: ['t1', 'heavy', 'd1', 's1'], levels: { t1: 1, t4: 1, d1: 1, s1: 1, heavy: 1 } };
  ADV.heavyOutOfFour(k2);
  assert.deepEqual(k2.loadout, ['t1', 't4', 'd1', 's1'], 'wrapping round to the first owned not brought');
  const st = G.makeV2(G.namedState('day1-morning'));
  st.v2.kit.loadout = ['heavy', 't1', 'd1', 's1'];
  const back = G.deserialize(G.serialize(st));
  assert.deepEqual(back.v2.kit.loadout, ['t4', 't1', 'd1', 's1'], 'read back from a save');
  assert.ok(!G.advance(back, { type: 'setLoadout', skills: ['heavy', 't1', 'd1', 's1'] }).ok, 'never one of the four again');
});

test('SY-10: the tactic\'s result written when the fight starts is the bout\'s if the page is left; outside the fingerprint; dropped once the bout is settled', () => {
  const st = G.namedState('v2-day2-afternoon'), o = AM.autoOutcome(st, 'bout');
  const outcome = { winner: o.winner, playerHp: o.playerHp, playerMaxHp: o.playerMaxHp, opponentHp: o.opponentHp, opponentMaxHp: o.opponentMaxHp, finisher: o.finisher };
  const h0 = G.hash(st);
  st.v2.$pending = { kind: 'bout', outcome };
  assert.equal(G.hash(st), h0, 'a « $ » key: not in the fingerprint');
  const back = G.deserialize(G.serialize(st));
  assert.deepEqual(back.v2.$pending, st.v2.$pending, 'kept by the save');
  const settled = G.settlePending(back), byHand = G.advance(G.namedState('v2-day2-afternoon'), { type: 'fight', outcome });
  assert.ok(byHand.ok);
  assert.equal(G.hash(settled), G.hash(byHand.state), 'the bout fought by its tactic, as « Skip » would');
  assert.equal(settled.v2.$pending, undefined);
  // the bout already settled: the result is dropped, nothing else changes
  const again = structuredClone(settled); again.v2.$pending = { kind: 'bout', outcome };
  assert.equal(G.hash(G.settlePending(again)), G.hash(settled));
  assert.equal(again.v2.$pending, undefined);
});
