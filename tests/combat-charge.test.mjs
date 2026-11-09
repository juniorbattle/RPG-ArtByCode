// The version 2's duel (lot V1, journal Passe V1): the three-button command and the charged attack « comme Cyan » (the operator's decision A3 /
// AV-5, with AV-6 the AP kept, AV-7 successive tiers, AV-8 a level per skill), and lot C3 (the opponents' guard, dodge and 2 to 4 skills; the
// balance toward « modéré »; the bot and the off-screen race refitted). Oracles are written here from the rules' text, not read from the code.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from './load.mjs';

const C = await load('/src/combat/charge.ts');
const K = await load('/src/combat/skills.ts');
const V = await load('/src/combat/v2duel.ts');
const D = await load('/src/combat/dynamic.ts');
const B = await load('/src/combat/bot.ts');
const P = await load('/src/combat/profiles.ts');
const A = await load('/src/arena/v2Arena.ts');
const DV = await load('/src/arena/dynamicView.ts');
const G = await load('/src/simulation/index.ts');
const L = await load('/src/tournament/lab.ts');
const ST = await load('/src/combat/stats.ts');

/** the four brought with the heavy attack among them (a skill since journal Passe CH1) */
const HK = { loadout: ['heavy', 't1', 'd1', 's1'], levels: { heavy: 1, t1: 1, d1: 1, s1: 1 } };
const duel = (foe = 'marek', kit) => V.v2DuelData(foe, { seed: 1337, playerName: 'Ren', opponentName: 'Marek', kit });
/** a fresh charged duel, the opponent held off (its first sequence never starts) unless asked */
function fresh(o = {}) {
  const d = duel(o.foe, o.kit), c = new C.ChargedDuel(d.data, d.tiers);
  if (!o.live) c.sim.f.marek.aiWait = 1e9;
  if (o.ap !== undefined) c.sim.f.ren.ap = o.ap;
  return c;
}
const steps = (c, secs) => { for (let i = 0; i < Math.round(secs / c.D.dt); i++) { c.step(c.D.dt); } };
const lastRelease = (evs) => evs.filter((e) => e.type === 'chargeRelease').at(-1);

test('the tiers (journal Passe CH1): a tap the light attack, then the four skills by their charge time at their level (ties by their slot); the heavy attack only when brought', () => {
  // the times: 0.85 of journal Passe V1's, rounded to 0.05 s (Rampart 3.5 -> 3.0, Flash cut 4 -> 3.4, Fervour 5 -> 4.25, Thrust 9 -> 7.65)
  const d = duel();
  assert.deepEqual(d.tiers.map((t) => t.id), ['light', 'd1', 't1', 's1', 't4']);
  assert.deepEqual(d.tiers.map((t) => t.at), [0, 3, 3.4, 4.25, 7.65]);
  assert.deepEqual(d.tiers.map((t) => t.ap), [0, 2, 2, 3, 4]);
  assert.ok(!d.tiers.some((t) => t.id === 'heavy'), 'no tier of its own for the heavy attack');
  // the levels change the order: Rampart at level 1 (3.0 s) behind Flash cut at level 5 (3.0 x 0.85 = 2.55 s); the Thrust at level 3 (7.4 x 0.85)
  const k = V.v2DuelData('marek', { seed: 1, playerName: 'R', opponentName: 'M', kit: { loadout: ['t1', 't4', 'd1', 's1'], levels: { t1: 5, t4: 3, d1: 1, s1: 1 } } });
  assert.deepEqual(k.tiers.map((t) => [t.id, t.at]), [['light', 0], ['t1', 2.55], ['d1', 3], ['s1', 4.25], ['t4', 6.3]]);
  // the heavy attack brought: a skill of 1 AP at 2 s x 0.85, shorter by level (level 3: 1.7 x 0.85)
  const h = duel('marek', HK);
  assert.deepEqual(h.tiers.map((t) => [t.id, t.at, t.ap]), [['light', 0, 0], ['heavy', 1.7, 1], ['d1', 3, 2], ['t1', 3.4, 2], ['s1', 4.25, 3]]);
  assert.equal(duel('marek', { ...HK, levels: { ...HK.levels, heavy: 3 } }).tiers[1].at, 1.45);
  // a tie keeps the slots' order; no floor any more (the old one: 0.25 s after the heavy's tier)
  const tie = C.chargeTiers(['t2', 't1'], { t1: 4, t2: 4 }, d.data);
  assert.deepEqual(tie.map((t) => t.id), ['light', 't2', 't1']);
  assert.equal(C.chargeTiers(['t1'], { t1: 1 }, d.data)[1].at, 1);
  assert.equal(K.HEAVY_AT, undefined, 'the heavy tier\'s hold is gone');
});

test('the charge: released at the tier reached; a tier whose AP are missing does not open, the best open tier below is launched (AV-6)', () => {
  // [hold (s), AP at the start, the action launched]: the oracle from the rule (the last tier reached whose AP are there)
  // the default four (Rampart 3 s, Flash cut 3.4, Fervour 4.25, Thrust 7.65), then the heavy attack brought (1.7 s, 1 AP): a game without AP has the
  // light attack alone until a light blow lands (journal Passe CH1)
  const cases = [[0.05, 1, 'light'], [2.05, 5, 'light'], [2.9, 5, 'light'], [3.05, 2, 'd1'], [3.05, 1, 'light'], [3.5, 2, 't1'], [3.5, 1, 'light'], [4.3, 2, 't1'], [4.3, 3, 's1'], [7.7, 5, 't4'], [7.7, 3, 's1'], [12, 4, 't4'],
    [1.6, 5, 'light', HK], [1.75, 1, 'heavy', HK], [1.75, 0, 'light', HK], [3.05, 1, 'heavy', HK], [3.05, 2, 'd1', HK], [5, 0, 'light', HK]];
  for (const [hold, ap, want, kit] of cases) {
    const c = fresh({ ap, kit });
    c.attack(true); steps(c, hold);
    const v = c.view();
    assert.equal(v.tiers[v.launch].id, want, `held ${hold} s with ${ap} AP: the view launches ${want}`);
    c.attack(false);
    const r = lastRelease(c.drain());
    assert.equal(r.id, want, `held ${hold} s with ${ap} AP`);
    assert.equal(c.sim.f.ren.act?.def.id, want);
    assert.equal(c.sim.f.ren.ap, ap - (c.D.actions[want].apCost ?? 0), 'the skill paid its AP');
  }
});

/** steps until `pred` (or `secs`), every event kept */
function until(c, pred, secs = 12) { const evs = []; for (let i = 0; i < secs / c.D.dt && !pred(evs); i++) { c.step(); evs.push(...c.drain()); } return evs; }
const ended = (evs) => evs.some((e) => e.type === 'chargeEnd' || e.type === 'chargeCut');

test('nothing cuts a charge (V2-2 « Rien ne la coupe », journal Passe V2C1): a blow received guarded or not, the player\'s dodge, the break keep it', () => {
  // an unguarded blow: the charge is held through it and goes on growing (the player stays free)
  let c = fresh(); c.attack(true); steps(c, 0.3); c.sim.forceSequence(['m_heavy']);
  let evs = until(c, (e) => e.some((x) => x.type === 'impact' && x.to === 'ren'));
  assert.equal(evs.find((e) => e.type === 'impact' && e.to === 'ren').result, 'hit');
  assert.ok(!ended(evs), 'no end');
  let t0 = c.view().t; steps(c, 0.5);
  assert.ok(c.view().held && c.view().t > t0 + 0.45, `held and growing after the hit: ${t0} -> ${c.view().t}`);
  // a guarded blow: kept, and the charge grows under the guard
  c = fresh(); c.attack(true); c.setGuard('ren', true); steps(c, 0.3);
  c.sim.forceSequence(['m_slash']);
  evs = until(c, () => false, 2);
  assert.ok(evs.some((e) => e.type === 'impact' && e.to === 'ren' && e.result === 'guarded'));
  assert.ok(!ended(evs));
  assert.ok(c.view().held && c.view().t > 2.2, `held under the guard: ${c.view().t}`);
  // the player's dodge: kept, and the charge grows through the dodge
  c = fresh({ ap: 3 }); c.attack(true); c.sim.forceSequence(['m_heavy']);
  until(c, () => c.incoming()?.windowOpen, 3);
  t0 = c.view().t;
  assert.ok(c.react('ren', 'dodge'), 'the dodge taken with a charge held');
  evs = until(c, (e) => e.some((x) => x.type === 'impact' && x.to === 'ren'));
  assert.equal(evs.find((e) => e.type === 'impact' && e.to === 'ren').result, 'dodged');
  assert.ok(!ended(evs));
  assert.ok(c.view().held && c.view().t > t0 + 0.1, `held and growing through the dodge: ${t0} -> ${c.view().t}`);
  // the break: kept, not grown while stunned (the charge grows while the player is free), and growing again after
  c = fresh(); c.attack(true); steps(c, 0.5); c.sim.f.ren.resist = c.D.resist.max - 1; c.sim.forceSequence(['m_slash']);
  evs = until(c, (e) => e.some((x) => x.type === 'stun' && x.who === 'ren'), 3);
  assert.ok(evs.some((e) => e.type === 'stun' && e.who === 'ren'), 'the player broke');
  t0 = c.view().t; steps(c, 1);
  assert.equal(c.sim.f.ren.state, 'stunned');
  assert.ok(c.view().held && Math.abs(c.view().t - t0) < 1e-9, `kept and still while stunned: ${t0} -> ${c.view().t}`);
  evs = until(c, (e) => e.some((x) => x.type === 'stunEnd' && x.who === 'ren'), 12);
  assert.ok(!ended(evs));
  t0 = c.view().t; steps(c, 0.5);
  assert.ok(c.view().held && c.view().t > t0 + 0.45, `growing again once free: ${t0} -> ${c.view().t}`);
  // the charge grows only while the player is free: not while its action runs
  c = fresh(); c.command('ren', 'light'); c.attack(true); c.step();
  assert.equal(c.view().t, 0, 'acting: no charge');
  steps(c, 1.5);
  assert.ok(c.view().t > 0.5 && c.view().t < 1.5, `charged once free: ${c.view().t}`);
});

test('a release the duel cannot take waits (V2-2, journal Passe V2C1): the opponent\'s sequence, a stun; it leaves the first step the player can act', () => {
  // in the opponent's sequence (its priority, G3 / CB-4): no command tried, no action until the sequence ends, then the tier reached
  let c = fresh({ kit: HK }); c.attack(true); steps(c, 1.9); c.sim.forceSequence(['m_slash', 'm_heavy']); steps(c, 0.05); c.drain();
  assert.ok(c.sim.inSequence());
  c.attack(false); let evs = c.drain();
  assert.deepEqual(evs.filter((e) => e.type.startsWith('charge')).map((e) => [e.type, e.id]), [['chargeWait', 'heavy']]);
  assert.ok(!evs.some((e) => e.type === 'commandDenied'), 'nothing refused');
  assert.equal(c.view().held, false); assert.equal(c.view().waiting, 1);
  // the HUD: the strip stays, the waiting tier shown as the one that leaves
  const hm = A.chargeHudModel(c.view());
  assert.ok(hm.waiting && !hm.held); assert.equal(hm.launch, 'heavy'); assert.equal(hm.toNext, 0);
  assert.deepEqual(hm.tiers.map((t) => t.state).slice(0, 3), ['ahead', 'launch', 'locked']);
  evs = until(c, (e) => e.some((x) => x.type === 'chargeRelease'), 8);
  const end = evs.findIndex((e) => e.type === 'sequenceEnd'), rel = evs.findIndex((e) => e.type === 'chargeRelease');
  assert.ok(end >= 0 && rel > end, 'launched after the sequence ends');
  assert.ok(!evs.slice(0, end).some((e) => e.type === 'commandStart' && e.who === 'ren'), 'no action of the player in the sequence');
  assert.ok(evs[rel].ok && evs[rel].id === 'heavy' && Math.abs(evs[rel].held - 1.95) < 0.02, JSON.stringify(evs[rel]));
  assert.equal(c.sim.f.ren.act?.def.id, 'heavy'); assert.equal(c.view().waiting, -1); assert.equal(c.sim.f.ren.ap, 0, 'the heavy attack paid its AP');
  assert.ok(Math.abs(evs[rel].t - evs[end].t) < 0.05, 'at the first step the player can act');
  // stunned: waits for the stun's end
  c = fresh({ ap: 2 }); c.attack(true); steps(c, 4.1); c.sim.f.ren.resist = c.D.resist.max - 1; c.sim.forceSequence(['m_slash']);
  until(c, (e) => e.some((x) => x.type === 'stun' && x.who === 'ren'), 3);
  c.attack(false); evs = c.drain();
  assert.equal(evs.find((e) => e.type === 'chargeWait')?.id, 't1');
  evs = until(c, (e) => e.some((x) => x.type === 'chargeRelease'), 12);
  assert.ok(evs.findIndex((e) => e.type === 'stunEnd') < evs.findIndex((e) => e.type === 'chargeRelease'));
  assert.equal(c.sim.f.ren.act?.def.id, 't1'); assert.equal(c.sim.f.ren.ap, 0, 'the skill paid its AP when it left');
  // its AP gone meanwhile (a dodge costs one): the best tier still open, at most the one reached (Flash cut 2 AP -> the heavy)
  c = fresh({ ap: 2, kit: HK }); c.attack(true); steps(c, 4.1); c.sim.forceSequence(['m_heavy']); steps(c, 0.05);
  c.attack(false); assert.equal(c.drain().find((e) => e.type === 'chargeWait')?.id, 't1');
  until(c, () => c.incoming()?.windowOpen, 3); assert.ok(c.react('ren', 'dodge')); assert.equal(c.sim.f.ren.ap, 1);
  assert.equal(A.chargeHudModel(c.view()).launch, 'heavy', 'the HUD shows the tier that will leave');
  evs = until(c, (e) => e.some((x) => x.type === 'chargeRelease'), 8);
  assert.equal(evs.find((e) => e.type === 'chargeRelease').id, 'heavy');
  // a new press while a tier waits starts a new charge; one release waits at most (journal Passe DB1): a tap released behind the waiting heavy
  // is dropped, the heavy alone leaves
  c = fresh({ kit: HK }); c.attack(true); steps(c, 1.8); c.sim.forceSequence(['m_slash', 'm_slash', 'm_slash']); steps(c, 0.05);
  c.attack(false); c.attack(true); steps(c, 0.1); c.attack(false);
  evs = c.drain(); assert.deepEqual(evs.filter((e) => e.type === 'chargeWait').map((e) => e.id), ['heavy']);
  evs = until(c, (e) => e.some((x) => x.type === 'chargeRelease'), 12); steps(c, 3); evs.push(...c.drain());
  assert.deepEqual(evs.filter((e) => e.type === 'chargeRelease').map((e) => [e.id, e.ok]), [['heavy', true]]);
  // a higher tier released while a tap waits takes its place
  c = fresh({ kit: HK }); c.sim.forceSequence(['m_slash', 'm_slash', 'm_slash']); steps(c, 0.05);
  c.attack(true); c.step(); c.attack(false); c.attack(true); steps(c, 1.8);
  assert.ok(c.sim.inSequence(), 'still the opponent\'s sequence');
  c.attack(false); evs = c.drain();
  assert.deepEqual(evs.filter((e) => e.type === 'chargeWait').map((e) => e.id), ['light', 'heavy']);
  assert.equal(c.view().waiting, 1);
  evs = until(c, (e) => e.some((x) => x.type === 'chargeRelease'), 12); steps(c, 3); evs.push(...c.drain());
  assert.deepEqual(evs.filter((e) => e.type === 'chargeRelease').map((e) => [e.id, e.ok]), [['heavy', true]]);
  // a release the duel can take leaves at once, as before (the tap is the light attack)
  c = fresh(); c.attack(true); c.step(); c.attack(false);
  assert.deepEqual(c.drain().filter((e) => e.type.startsWith('charge')).map((e) => e.type), ['chargeStart', 'chargeRelease']);
  assert.equal(c.sim.f.ren.act?.def.id, 'light');
});

test('taps in a row never pile up (journal Passe DB1, the operator\'s report of 2026-11-09: light attacks repeated without end and no key answered)', () => {
  // twelve taps of the attack button, 40 ms down and 80 ms apart, while the light attacks run: then the guard held and a dodge
  const c = fresh(), dt = c.D.dt, lights = [];
  const run = (s) => { for (let i = 0; i < Math.round(s / dt); i++) { c.step(dt); for (const e of c.drain()) if (e.type === 'chargeRelease') lights.push(c.t); } };
  run(0.2);
  for (let k = 0; k < 12; k++) { c.attack(true); run(0.04); c.attack(false); run(0.08); }
  const last = c.t;
  // the player keeps attacking as fast as the light attack goes, never faster: one release waits at most
  assert.ok(lights.length <= 4, `${lights.length} light attacks for 12 taps in ${last.toFixed(2)} s`);
  // after the last tap, at most the one waiting light attack leaves, at once; then the guard held rises
  c.setGuard('ren', true); let guard = -1;
  for (let i = 0; i < Math.round(6 / dt) && guard < 0; i++) { c.step(dt); for (const e of c.drain()) { if (e.type === 'chargeRelease') lights.push(c.t); if (e.type === 'guardUp') guard = c.t; } }
  assert.ok(lights.every((t) => t <= last + 0.7), `a light attack left ${(lights.at(-1) - last).toFixed(2)} s after the last tap`);
  assert.ok(guard > 0 && guard - last < 1.2, `the guard rose ${(guard - last).toFixed(2)} s after the last tap`);
  // and a dodge answers the next blow
  c.setGuard('ren', false); c.sim.f.ren.ap = 2; c.sim.f.marek.aiWait = 0.1; c.sim.forceSequence(['m_heavy']);
  until(c, () => c.incoming()?.windowOpen, 4);
  assert.ok(c.react('ren', 'dodge'), 'the dodge answers');
});

test('the K.O. ends the duel and the charge with it, unlaunched (V2-2, journal Passe V2C1)', () => {
  // the player down with a charge held
  let c = fresh(); c.attack(true); steps(c, 0.3); c.sim.f.ren.hp = 1; c.sim.forceSequence(['m_slash']);
  let evs = until(c, (e) => e.some((x) => x.type === 'ko'), 3);
  assert.ok(evs.some((e) => e.type === 'ko' && e.who === 'ren'));
  steps(c, 0.2); evs.push(...c.drain());
  assert.deepEqual(evs.filter((e) => e.type === 'chargeEnd').map((e) => e.why), ['over']);
  assert.equal(c.view().held, false); assert.equal(c.view().waiting, -1);
  assert.ok(!evs.some((e) => e.type === 'chargeRelease'));
  // the opponent down while a released tier waits behind the player's own action: it never leaves
  c = fresh(); c.sim.f.marek.hp = 1; c.command('ren', 'light'); c.attack(true); c.step(); c.attack(false);
  assert.equal(c.drain().find((e) => e.type === 'chargeWait')?.id, 'light');
  evs = until(c, (e) => e.some((x) => x.type === 'ko'), 3); steps(c, 0.5); evs.push(...c.drain());
  assert.ok(evs.some((e) => e.type === 'ko' && e.who === 'marek'));
  assert.deepEqual(evs.filter((e) => e.type === 'chargeEnd').map((e) => e.why), ['over']);
  assert.ok(!evs.some((e) => e.type === 'chargeRelease'));
});

test('a level per skill (AV-8): its power and its charge time; no level of the player (PROJECT § 7)', () => {
  const base = D.DYNAMIC_DATA.actions.t4;
  for (let lv = 1; lv <= 5; lv++) {
    const a = K.atLevel(base, lv);
    assert.equal(a.damage, Math.round(base.damage * (1 + 0.1 * (lv - 1))));
    assert.ok(K.chargeTime('t4', lv) <= 10 && K.chargeTime('t4', lv) >= 5);
    if (lv > 1) assert.ok(K.chargeTime('t4', lv) < K.chargeTime('t4', lv - 1));
  }
  assert.equal(K.clampLevel(9), 5); assert.equal(K.clampLevel(0), 1);
  assert.equal(K.atLevel(D.DYNAMIC_DATA.actions.d1, 3).ward.dur, +(6 * 1.2).toFixed(2));
  assert.throws(() => K.chargeTime('nope', 1), /no skill/);
  const st = G.makeV2(G.newGame(1842, 'Ren'));
  assert.ok(!('level' in st.player), 'no level of the player');
});

test('the three buttons: the heavy and the skills lose their automatic preparation (the charge is it); input=keys keeps the C2 command on the same opponent', () => {
  const c = duel(), k = V.v2DuelData('marek', { seed: 1337, playerName: 'Ren', opponentName: 'Marek', input: 'keys' });
  for (const id of ['heavy', 't1', 't4', 'd1', 's1']) { assert.equal(c.data.actions[id].prep, 0, id); assert.equal(k.data.actions[id].prep, D.DYNAMIC_DATA.actions[id].prep, id); }
  assert.deepEqual(k.data.ai.defense, c.data.ai.defense);
  assert.deepEqual(k.data.ai.skills, c.data.ai.skills);
  // a skill of 1 AP under the three buttons, free under the old scheme; since journal Passe DB8 every blow's damage from the fighters' stats (Ren
  // 10 against Marek's Defence 13: x 20/23), what it adds to the gauge by Marek's Endurance 12 (x 10/12): tests/duel-stats.test.mjs
  const kr = (2 * 10) / (10 + 13), ke = 10 / 12;
  assert.equal(c.data.actions.light.damage, Math.round(6 * kr)); assert.equal(c.data.actions.light.resist, +(0.5 * ke).toFixed(2));
  assert.equal(c.data.actions.heavy.damage, Math.round(120 * (K.chargeTime('heavy', 1) / K.chargeTime('t4', 1)) * kr)); assert.equal(c.data.actions.heavy.resist, +(32 * ke).toFixed(2));
  assert.equal(c.data.actions.t4.damage, Math.round(120 * kr)); assert.equal(c.data.actions.d1.ward.dur, 9);
  assert.equal(c.data.actions.heavy.apCost, 1); assert.ok(!k.data.actions.heavy.apCost); assert.equal(c.data.actions.heavy.family, 'offensive');
  // the old scheme with the heavy attack among the four: the C2 command, the heavy at level 1 as today, under the duel's weights of journal Passe DB3
  const kh = V.v2DuelData('marek', { seed: 1337, playerName: 'Ren', opponentName: 'Marek', input: 'keys', kit: HK });
  assert.deepEqual(kh.data.actions.heavy, { ...D.DYNAMIC_DATA.actions.heavy, family: 'offensive', damage: Math.round(120 * (K.chargeTime('heavy', 1) / K.chargeTime('t4', 1)) * kr), resist: +(16 * ke).toFixed(2), cooldown: +(5 * K.chargeTime('heavy', 1)).toFixed(3) });
  const q = (s) => new URLSearchParams(s);
  assert.equal(A.v2Input(q('v2=1')), 'charge'); assert.equal(A.v2Input(q('v2=1&input=keys')), 'keys');
  assert.equal(DV.arenaRules(q('scene=arena&v2=1')), 'v2'); assert.equal(DV.arenaRules(q('scene=arena&v2')), 'v2');
  assert.equal(DV.arenaRules(q('scene=arena&v2=0')), 'classic'); assert.equal(DV.arenaRules(q('scene=arena&v2=0&combat=dynamic')), 'dynamic');
  assert.equal(DV.arenaRules(q(''), { rules: 'v2' }), 'v2');
  // the keys: the attack is none of the forecourt's walking keys (WASD, the arrows); the attack and the guard are held
  for (const k2 of Object.keys(A.V2_KEYS).filter((x) => A.V2_KEYS[x] === 'attack')) assert.ok(!['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k2), k2);
  assert.deepEqual(new Set(Object.values(A.V2_HELD)), new Set(['attack', 'guard']));
  assert.equal(A.V2_PAD[2], 'attack'); assert.equal(A.V2_PAD[1], 'guard'); assert.equal(A.V2_PAD[0], 'dodge');
});

test('C3: the opponents\' defence in their pauses (guard, dodge of the heavy and the skills only) and their 2 to 4 skills, each paced; today\'s opponents unchanged', () => {
  // guard: every attack of the player read, the light guarded
  let d = duel(); d.data.ai.defense = { guard: 1, dodge: 0 };
  let s = new D.DynamicSim(d.data); s.f.marek.aiWait = 1e9; s.command('ren', 'light');
  let ev = []; for (let i = 0; i < 1 / s.D.dt; i++) { s.step(); ev.push(...s.drain()); }
  assert.equal(ev.find((e) => e.type === 'impact' && e.to === 'marek')?.result, 'guarded');
  // dodge: the heavy dodged, the light never (dodge 1, guard 0: the light lands)
  d = duel(); d.data.ai.defense = { guard: 0, dodge: 1 };
  for (const [id, want] of [['heavy', 'dodged'], ['light', 'hit']]) {
    s = new D.DynamicSim(d.data); s.f.marek.aiWait = 1e9; s.command('ren', id); ev = [];
    for (let i = 0; i < 1.5 / s.D.dt; i++) { s.step(); ev.push(...s.drain()); }
    assert.equal(ev.find((e) => e.type === 'impact' && e.to === 'marek')?.result, want, id);
  }
  // skills: 2 to 4 per rival, Tobin none of the defence, the « sophisticated » with one
  for (const [id, f] of Object.entries(V.V2_FOES)) {
    assert.ok(f.skills.list.length >= 2 && f.skills.list.length <= 4, id);
    for (const k of f.skills.list) { const a = V.FOE_SKILLS[k.id]; assert.ok(a && a.owner === 'marek' && a.kind === 'skill' && ['offensive', 'defensive', 'support'].includes(a.family), k.id); assert.ok(k.cooldown >= 10); }
    assert.ok(f.skills.list.some((k) => V.FOE_SKILLS[k.id].family === 'offensive'), `${id} has an offensive skill`);
  }
  assert.equal(V.V2_FOES.tobin.defense, undefined);
  for (const id of ['marek', 'vessa', 'cassius', 'ilse']) assert.ok(V.V2_FOES[id].defense.guard + V.V2_FOES[id].defense.dodge >= 0.3, id);
  // a skill comes back no sooner than its cooldown: over 10 minutes of the opponent's sequences
  s = new D.DynamicSim(duel('marek').data); const seen = {};
  for (let i = 0; i < 600 / s.D.dt; i++) {
    s.f.ren.hp = 99999; s.step();
    for (const e of s.drain()) if (e.type === 'commandStart' && e.who === 'marek' && e.kind === 'skill') { if (seen[e.action] !== undefined) assert.ok(e.t - seen[e.action] >= V.V2_FOES.marek.skills.list.find((k) => k.id === e.action).cooldown - 1e-6, e.action); seen[e.action] = e.t; }
  }
  assert.ok(Object.keys(seen).length >= 2, `skills used: ${Object.keys(seen)}`);
  // today's opponents keep their stream: the rules' fingerprint on DYNAMIC_DATA
  const f = new D.DynamicSim(D.DYNAMIC_DATA); D.runDynamicFingerprint(f);
  assert.equal(f.hash(), D.DYNAMIC_SIM_HASH);
});

test('the balance toward « modéré » (L7-4, CB-11; « proposé »): a staircase by the bot\'s skill, Marek the hardest, duels of 3 to 4 minutes (the operator\'s DB-1 « 3 à 4 minutes », decision A3 of 2026-11-09, journal Passe DB3; 5 to 10 [G5] before)', () => {
  const rate = (foe, skill, n = 6) => {
    let w = 0, t = 0;
    for (let i = 1; i <= n; i++) { const d = V.v2DuelData(foe, { seed: 3000 + i, playerName: 'Ren', opponentName: foe }); const r = B.runV2BotDuel(d.data, d.tiers, { skill, seed: 40 + i }); assert.ok(r.winner, `${foe}: a K.O.`); if (r.winner === 'player') w++; t += r.t; }
    return { w: w / n, min: t / n / 60 };
  };
  const strong = rate('orla', 0.9), weak = rate('orla', 0.2), m6 = rate('marek', 0.6), o6 = rate('orla', 0.6), m2 = rate('marek', 0.2);
  assert.ok(strong.w >= 0.8, `orla at 0.9: ${strong.w}`);
  assert.ok(weak.w <= 0.35, `orla at 0.2: ${weak.w}`);
  assert.ok(m2.w <= 0.2, `marek at 0.2: ${m2.w}`);
  assert.ok(m6.w < o6.w, `marek at 0.6 (${m6.w}) is harder than orla (${o6.w})`);
  // the pool's bouts with the start kit (journal Passe DB8): about 2 minutes, a losing weak player falling sooner; the operator's « en 2 et 5 min » (A3)
  // is a reference, the bracket's and the final's bouts longer (tools/duel-balance.mjs)
  for (const r of [strong, weak, m6, o6, m2]) assert.ok(r.min >= 1.2 && r.min <= 5, `duel length ${r.min.toFixed(1)} min`);
});

test('the harder rivals (journal Passes VP4, V2C2) under V2-2 « Rien ne la coupe » (journal Passe V2C1): whole version 2 games on seeds 1..12, a staircase by the player\'s skill and preparation', () => {
  // recalibrated with the fighters' stats of journal Passes DB8 / DB9 (the operator's DB4-5 « Recaler pour garder six sur dix »): the rivals' blows x 0.72 of the DB7 sheet's
  assert.deepEqual([ST.POWER.foeLight, ST.POWER.foeHeavy, ST.POWER.foeSkill], [4.032, 12.096, 18.144]);
  const S = Array.from({ length: 12 }, (_, i) => i + 1);
  const at = (skill) => ({ name: `diligent-${skill}`, skill, choose: (st) => { const a = L.POLICIES.diligent.choose(st); return a.type === 'fight' ? { type: 'fight', outcome: L.botOutcome(st, skill) } : a; } });
  const idle = L.labReport(S, L.POLICIES.idle, 'v2'), prepared = L.labReport(S, L.POLICIES.diligent, 'v2'), expert = L.labReport(S, at(0.9), 'v2');
  // the player who only fights wins nothing; the prepared player of average skill about six bouts in ten, makes the cut, rarely the crown; the
  // expert nine in ten and the crown in about two games in three: Passe VP4's staircase, which V2-2 had lifted (85 bouts in 100, journal Passe
  // V2C1), found again by the rivals' harder blows and health (the operator's « Oui, recaler », journal Passe V2C2)
  // since the fighters' stats (journal Passes DB8 / DB9) a player who only fights wins a little at the pool, as the DB7 sheet's weak player (17 %); a fifth at most
  assert.ok(idle.rates.playerWins <= 0.25, `idle ${idle.rates.playerWins}`);
  assert.ok(prepared.rates.playerWins >= 0.5 && prepared.rates.playerWins <= 0.75, `prepared ${prepared.rates.playerWins}`);
  assert.ok(prepared.v2.madeCut >= 0.75 && prepared.v2.champion <= 0.15, `prepared ${JSON.stringify(prepared.v2)}`);
  // since the fighters' stats (journal Passes DB8 / DB9) the final is the epic of DB7-6 (PV x 2.5 and stats): the lab's players never drill their skills,
  // and at level 1 Marek is not beaten in the final even at 0.9 (a player at level 3 beats him seven times in ten at 0.6: tools/duel-balance.mjs); the
  // expert still wins most of its bouts and reaches the final
  assert.ok(expert.rates.playerWins >= 0.7 && expert.v2.finalist >= 0.2, `expert ${expert.rates.playerWins} ${JSON.stringify(expert.v2)}`);
  assert.ok(idle.rates.playerWins < prepared.rates.playerWins && prepared.rates.playerWins < expert.rates.playerWins, 'the staircase');
});

test('the off-screen race of the version 2 agrees with full duels on held-out seeds (81..120: the kill within 15 %, the damage within 12 %), and decides the version 2\'s off-screen bouts', () => {
  for (const foe of ['tobin', 'orla', 'vessa', 'marek']) {
    let kill = 0, dps = 0, n = 0;
    for (let i = 81; i <= 120; i++) {
      const d = V.v2DuelData(foe, { seed: 5000 + i, playerName: 'Ren', opponentName: foe });
      d.data.fighters.ren.maxHp = 1e7;
      const r = B.runV2BotDuel(d.data, d.tiers, { skill: 0.5, seed: 900 + i });
      kill += r.t; dps += (r.playerMaxHp - r.playerHp) / r.t; n++;
    }
    const R = V.V2_RACERS[foe];
    // the kill within 15 % (journal Passe DB9: Vessa's dodge makes hers skewed, 13 % on these seeds), the damage within 12 %
    assert.ok(Math.abs(kill / n - R.kill) / R.kill < 0.15, `${foe} kill ${(kill / n).toFixed(0)} vs ${R.kill}`);
    assert.ok(Math.abs(dps / n - R.dps) / R.dps < 0.12, `${foe} dps ${(dps / n).toFixed(2)} vs ${R.dps}`);
  }
  // the champion is the strongest of the race, the farm boy the weakest
  const str = (id) => V.V2_RACERS[id].kill * V.V2_RACERS[id].dps;
  for (const id of Object.keys(V.V2_RACERS)) { assert.ok(str('marek') >= str(id), id); assert.ok(str('tobin') <= str(id), id); }
  // a version 2 game's off-screen bout: the race of the version 2; the same game without the flag: today's dynamic race
  const pool = fs.readFileSync(path.join(ROOT, 'src/tournament/pool.ts'), 'utf8');
  assert.match(pool, /const p = isV2\(s\)\s*\? raceWinChance\(v2RacerOf\(A\.id, rivalMods\(A\)\), v2RacerOf\(B\.id, rivalMods\(B\)\), 0, V2_RACE_SLOPE\)/);
  const a = L.autoplay(7, L.POLICIES.idle, 'Ren', 200, 'v2'), b = L.autoplay(7, L.POLICIES.idle, 'Ren', 200, 'dynamic');
  assert.notEqual(G.hash(a.state), G.hash(b.state));
  assert.equal(L.autoplay(7, L.POLICIES.idle, 'Ren', 200, 'v2').hash, a.hash, 'deterministic');
});

test('the HUD\'s reading of the charge: each tier reached, the one a release launches, the next and the charge toward it, the tiers the AP lock', () => {
  const c = fresh({ ap: 2 });
  let m = A.chargeHudModel(c.view());
  assert.equal(m.held, false); assert.equal(m.toNext, 0);
  assert.deepEqual(m.tiers.map((t) => t.state), ['ahead', 'ahead', 'ahead', 'locked', 'locked']);
  c.attack(true); steps(c, 1.5);
  m = A.chargeHudModel(c.view());
  assert.deepEqual(m.tiers.map((t) => t.state), ['launch', 'next', 'ahead', 'locked', 'locked']);
  assert.ok(Math.abs(m.toNext - 50) <= 1, `half way to Rampart: ${m.toNext}`);
  steps(c, 2.1);
  m = A.chargeHudModel(c.view());
  assert.deepEqual(m.tiers.map((t) => t.state), ['reached', 'reached', 'launch', 'locked', 'locked']);
  assert.equal(m.launch, 't1');
  steps(c, 5);
  m = A.chargeHudModel(c.view());
  assert.equal(m.launch, 't1', 'past Fervour and the Thrust, both locked: the Flash cut');
  assert.equal(m.toNext, 100);
  // the moments of the charge run to their end
  for (const [name, p] of Object.entries(A.V2_PRESETS)) { const d = fresh({ live: true }); const t = A.runV2Script(d, p.script); assert.ok(t < 59, `${name} ends (${t})`); }
  // the waiting tier's moment (V2-2, journal Passe V2C1): the first tier released in the sequence, still waiting, the strip showing it
  const w = fresh({ live: true }); A.runV2Script(w, A.V2_PRESETS.chargeWait.script);
  assert.ok(w.sim.inSequence()); assert.equal(w.view().waiting, 1); assert.equal(A.chargeHudModel(w.view()).launch, 'd1');
  // the first tier's moment (the heavy attack's before journal Passe CH1): the first skill reached and open
  const f1 = fresh({ live: true }); A.runV2Script(f1, A.V2_PRESETS.chargeFirst.script);
  assert.equal(f1.view().reached, 1); assert.equal(f1.view().launch, 1);
});

test('the charged duel\'s fingerprint: its fixed script on the scene\'s duel gives V2_SIM_HASH, which the arena check replays in the page', () => {
  const s = A.sceneV2Duel('charge'), d = new C.ChargedDuel(s.data, s.tiers), n = {};
  const count = (k) => { n[k] = (n[k] ?? 0) + 1; };
  A.runV2Fingerprint(d, (evs, held) => {
    for (const e of evs) {
      if (held && e.type === 'impact' && e.to === 'ren') count(`held-${e.result}`);
      if (held && e.type === 'reactStart' && e.who === 'ren') count('held-dodge');
      if (held && e.type === 'stun' && e.who === 'ren') count('held-break');
      if (e.type === 'chargeWait') count('wait');
      if (e.type === 'chargeRelease') count(e.ok ? 'release' : 'refused');
      if (e.type === 'chargeEnd') count('end');
      if (e.type === 'chargeCut') count('cut');
    }
  });
  assert.equal(d.hash(), A.V2_SIM_HASH);
  // the script reaches every path of V2-2 (journal Passe V2C1): blows guarded and not, dodges and a break on a charge held, releases that wait,
  // the K.O. with a charge; nothing cut, nothing refused
  for (const k of ['held-hit', 'held-guarded', 'held-dodge', 'held-break', 'wait', 'release', 'end']) assert.ok(n[k] > 0, `${k}: ${JSON.stringify(n)}`);
  assert.ok(!n.cut && !n.refused, JSON.stringify(n));
  const tool = fs.readFileSync(path.join(ROOT, 'tools/arena-scene-check.mjs'), 'utf8');
  assert.ok(tool.includes(`const V2_HASH = '${A.V2_SIM_HASH}';`), 'the tool pins the same hash');
  // and replays the same script in the page: its holds are runV2Fingerprint's (journal Passe CH1: the tool kept the old ones, its page hash failed)
  const holdsOf = (src) => src.match(/holds = (\[[^\]]+\])/)[1];
  assert.equal(holdsOf(tool), holdsOf(fs.readFileSync(path.join(ROOT, 'src/arena/v2Arena.ts'), 'utf8')));
});

test('the version 2 reaches the arena and the play mode only through its flag; today\'s duels are untouched', () => {
  const app = fs.readFileSync(path.join(ROOT, 'src/arena/ArenaApp.ts'), 'utf8');
  assert.match(app, /else if \(this\.rules === 'v2'\) \{ const v = makeV2Duel\(/);
  const pa = fs.readFileSync(path.join(ROOT, 'src/ui/playArena.ts'), 'utf8');
  // the actions' names in the page's language since journal Passe RG4 (`actionNames()`: ACTION_NAMES_EN through the table's `word`)
  assert.match(pa, /const v2d = v2 \? v2SheetData\(sheet, actionNames\(\), v2KitOf\(st\), v2Mods\(st\)\) : null;/);
  assert.match(pa, /const actionNames = \(\): Record<string, string> => Object\.fromEntries\(Object\.entries\(ACTION_NAMES_EN\)\.map\(\(\[k, v\]\) => \[k, word\(v\)\]\)\);/);
  // a version 2 game's bout is the version 2's: its data and tiers come from the sheet, its kit the player's
  const st = G.makeV2(G.namedState('day2-afternoon'));
  const lab = L.botOutcome(st, 0.6);
  assert.ok(lab.winner === 'player' || lab.winner === 'opponent');
  // today's dynamic profiles and data unchanged by the version 2's (no shared object mutated)
  const before = JSON.stringify(P.DYN_PROFILES) + JSON.stringify(D.DYNAMIC_DATA);
  V.v2DuelData('marek', { seed: 1, playerName: 'a', opponentName: 'b' }); V.v2DuelData('vessa', { seed: 2, playerName: 'a', opponentName: 'b', input: 'keys' });
  assert.equal(JSON.stringify(P.DYN_PROFILES) + JSON.stringify(D.DYNAMIC_DATA), before);
});
