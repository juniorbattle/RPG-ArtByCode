// The duel of the « tour par tour dynamique » (src/combat/dynamic.ts, lot C1 of briefs/combat-system.md, journal Passe C1): every rule of the
// specification checked against an oracle written here from the rule's own words (impact = start + preparation + swing; the gauge's gain,
// decay and break; the AP's start, gain, cap and costs; the defence phase; the « repoussé »; the K.O. alone; the pauses per level), the
// duels' length with the reference bot, the bot itself, the off-screen resolution against full duels on held-out seeds, a game played under
// the new rules, and the arena of today left untouched (the rules sit behind their parameter, CB-10).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from './load.mjs';

const Dy = await load('/src/combat/dynamic.ts');
const { DynamicSim, DYNAMIC_DATA, DYNAMIC_SIM_HASH, runDynamicFingerprint, checkDynData, SKILL_SLOTS } = Dy;
const { runDynamicBotDuel } = await load('/src/combat/bot.ts');
const P = await load('/src/combat/profiles.ts');
const { COMBAT_DATA } = await load('/src/arena/CombatSim.ts');
const { matchSheetFor, sheetData, dynSheetData } = await load('/src/combat/match.ts');
const L = await load('/src/tournament/lab.ts');
const T = await load('/src/tournament/pool.ts');
const G = await load('/src/simulation/index.ts');
const { Rng } = await load('/src/core/rng.ts');

const D0 = DYNAMIC_DATA, dt = D0.dt, A0 = D0.actions;
const clone = (tw) => { const d = JSON.parse(JSON.stringify(D0)); tw?.(d); return d; };
/** the opponent never starts a sequence by itself (scripted with forceSequence), nor after one or after a stun */
const quiet = (tw) => clone((d) => { d.ai.start = 1e6; d.ai.afterStun = 1e6; d.restByLevel[d.ai.level] = [1e6, 1e6]; tw?.(d); });
/** steps until `cond`, collecting the events; fails if it is never reached */
function until(sim, cond, max = 30, onStep) {
  const ev = [];
  for (let i = 0; i < Math.round(max / dt) && !cond(sim, ev); i++) { onStep?.(sim); sim.step(); ev.push(...sim.drain()); }
  assert.ok(cond(sim, ev), 'condition not reached');
  return ev;
}
function run(sim, secs, onStep) { const ev = []; for (let i = 0; i < Math.round(secs / dt); i++) { onStep?.(sim); sim.step(); ev.push(...sim.drain()); } return ev; }
const near = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol + 1e-9, `${what}: ${a} vs ${b} (±${tol})`);
const impactOf = (ev, from) => ev.find((e) => e.type === 'impact' && e.from === from);

test('the data: four distinct skills in the slots, today\'s four techniques offensive, a defensive and a support skill, no cooldown, 1 AP at the start', () => {
  assert.equal(SKILL_SLOTS, 4);
  assert.equal(D0.loadout.length, 4); assert.equal(new Set(D0.loadout).size, 4);
  for (const id of D0.loadout) assert.equal(A0[id].kind, 'skill', id);
  // the four techniques of today (COMBAT_DATA t1..t4) keep their names, damage and AP, ranked offensive [G1]; Tourbillon loses its stun (§ 5)
  for (const id of ['t1', 't2', 't3', 't4']) {
    assert.equal(A0[id].family, 'offensive', id);
    assert.equal(A0[id].name, COMBAT_DATA.actions[id].name); assert.equal(A0[id].damage, COMBAT_DATA.actions[id].damage); assert.equal(A0[id].apCost, COMBAT_DATA.actions[id].apCost);
  }
  const fam = (f) => Object.values(A0).filter((a) => a.owner === 'ren' && a.family === f);
  assert.ok(fam('defensive').length >= 1 && fam('support').length >= 1, 'a defensive and a support skill');
  for (const a of Object.values(A0)) { assert.ok(!('cooldown' in a), `${a.id} has no cooldown [G5]`); assert.ok(!('stun' in a) && !('stunsGuard' in a), `${a.id} stuns nobody outright`); }
  // AP: 1 at the start (CB-5), 5 at most [G4]; the light and heavy attacks cost nothing, the skills and the dodge cost AP
  assert.equal(D0.ap.start, 1); assert.equal(D0.ap.max, 5); assert.equal(D0.ap.regen, 0);
  assert.ok(!A0.light.apCost && !A0.heavy.apCost && A0.light.apGain === 1 && !A0.heavy.apGain);
  for (const a of Object.values(A0)) if (a.kind === 'skill') assert.ok(a.apCost > 0, a.id);
  assert.ok(D0.reactions.dodge.apCost > 0);
  // the break: 5 to 10 s stunned, slightly more damage [G3]; the guard -60 % (CB-5)
  assert.ok(D0.resist.breakStun >= 5 && D0.resist.breakStun <= 10); assert.ok(D0.resist.breakDamage > 1 && D0.resist.breakDamage <= 1.3);
  assert.equal(D0.guard.reduce, 0.6);
  // refusals of the data's own checks
  assert.throws(() => checkDynData(clone((d) => { d.loadout = ['t1', 't2', 't3']; })), /4 distinct skills/);
  assert.throws(() => checkDynData(clone((d) => { d.loadout = ['t1', 't1', 't2', 't3']; })), /4 distinct skills/);
  assert.throws(() => checkDynData(clone((d) => { d.loadout = ['t1', 't2', 't3', 'light']; })), /not one of the player's skills/);
  assert.throws(() => checkDynData(clone((d) => { d.loadout = ['t1', 't2', 't3', 'm_heavy']; })), /not one of the player's skills/);
  assert.throws(() => new DynamicSim(clone((d) => { d.ai.level = 9; })), /no pause range/);
  assert.doesNotThrow(() => checkDynData(D0));
});

test('the light attack is instant; the heavy attack and the skills wait their automatic preparation [G2]', () => {
  assert.equal(A0.light.prep, 0);
  assert.ok(A0.heavy.prep > 0); for (const a of Object.values(A0)) if (a.kind === 'skill') assert.ok(a.prep > 0, a.id);
  const sim = new DynamicSim(quiet()); sim.drain(); sim.f.ren.ap = 5;
  for (const id of ['light', 'heavy', 't1', 't4']) {
    until(sim, (s) => s.f.ren.state === 'idle', 5);
    const t0 = sim.t; assert.equal(sim.command('ren', id), true, id);
    const start = sim.drain().find((e) => e.type === 'commandStart');
    assert.equal(start.t, t0, `${id} starts when pressed`); assert.equal(start.prep, A0[id].prep);
    if (A0[id].prep > 0) { sim.step(); assert.equal(sim.f.ren.anim.prep, A0[id].prep, `${id}: the clip holds its preparation`); }
    const ev = until(sim, (s, e) => !!impactOf(e, 'ren'), 3);
    near(impactOf(ev, 'ren').t - t0, A0[id].prep + A0[id].impactAt, dt, `${id}: impact = start + preparation + swing`);
    sim.f.ren.ap = 5;
  }
});

test('action points: 1 at the start, +1 per light that lands, 5 at most; the skills and the dodge spend them; no cooldown; no regain by default', () => {
  const sim = new DynamicSim(quiet()); sim.drain();
  assert.equal(sim.f.ren.ap, 1);
  const seen = [];
  for (let i = 0; i < 5; i++) { until(sim, (s) => s.f.ren.state === 'idle', 3); sim.command('ren', 'light'); until(sim, (s, e) => !!impactOf(e, 'ren'), 3); seen.push(sim.f.ren.ap); }
  assert.deepEqual(seen, [2, 3, 4, 5, 5]);
  // a skill costs its AP and can be cast again at once
  until(sim, (s) => s.f.ren.state === 'idle', 3);
  assert.equal(sim.command('ren', 't1'), true); assert.equal(sim.f.ren.ap, 5 - A0.t1.apCost);
  until(sim, (s) => s.f.ren.state === 'idle', 3);
  assert.equal(sim.command('ren', 't1'), true, 'no cooldown'); assert.equal(sim.f.ren.ap, 5 - 2 * A0.t1.apCost);
  until(sim, (s) => s.f.ren.state === 'idle', 3);
  assert.equal(sim.command('ren', 't4'), false); assert.equal(sim.drain().at(-1).why, 'ap');
  // the dodge costs its AP
  sim.f.ren.ap = 2; sim.forceSequence(['m_heavy']);
  until(sim, (s) => s.incoming()?.windowOpen === true, 3);
  assert.equal(sim.react('ren', 'dodge'), true); assert.equal(sim.f.ren.ap, 2 - D0.reactions.dodge.apCost);
  assert.equal(impactOf(until(sim, (s, e) => !!impactOf(e, 'marek'), 3), 'marek').result, 'dodged');
  // no regain with time by default; the setting gives one every `regen` s, up to the cap
  const idle = new DynamicSim(quiet()); run(idle, 60); assert.equal(idle.f.ren.ap, 1);
  const regen = new DynamicSim(quiet((d) => { d.ap.regen = 5; })); regen.drain();
  const ev = run(regen, 12); assert.equal(regen.f.ren.ap, 1 + 2); assert.ok(ev.filter((e) => e.type === 'apGain').every((e) => e.why === 'regen'));
  run(regen, 30); assert.equal(regen.f.ren.ap, D0.ap.max);
  // the slots: a skill the player did not bring is refused
  const other = new DynamicSim(quiet()); other.f.ren.ap = 5; other.drain();
  assert.equal(other.command('ren', 't2'), false); assert.equal(other.drain().at(-1).why, 'slot');
  const four = new DynamicSim(quiet((d) => { d.loadout = ['t1', 't2', 't3', 't4']; })); four.f.ren.ap = 5; four.drain();
  assert.equal(four.command('ren', 'd1'), false); assert.equal(four.drain().at(-1).why, 'slot');
  assert.equal(four.command('ren', 't2'), true);
});

test('the gauge: every blow that lands fills it, guarded ones too, the heavy more; time empties it slowly; full, it breaks and then starts from zero', () => {
  const R = D0.resist;
  // a light, then time alone
  const sim = new DynamicSim(quiet()); sim.drain();
  sim.command('ren', 'light'); until(sim, (s, e) => !!impactOf(e, 'ren'), 3);
  near(sim.f.marek.resist, A0.light.resist, R.decay * dt, 'a light adds its resistance');
  const r0 = sim.f.marek.resist; run(sim, 1); near(sim.f.marek.resist, r0 - R.decay * 1, R.decay * dt, 'time empties it');
  run(sim, 100); assert.equal(sim.f.marek.resist, 0, 'never below zero');
  // the heavy fills it more
  assert.ok(A0.heavy.resist > A0.light.resist && A0.m_heavy.resist > A0.m_slash.resist);
  sim.command('ren', 'heavy'); until(sim, (s, e) => !!impactOf(e, 'ren'), 3);
  near(sim.f.marek.resist, A0.heavy.resist, R.decay * dt, 'a heavy adds its resistance');
  // a blow on the guard fills the guardian's gauge too, by the same rule; a dodged one does not
  const g = new DynamicSim(quiet()); g.drain(); g.setGuard('ren', true); run(g, 0.3);
  g.forceSequence(['m_slash']); const e1 = impactOf(until(g, (s, e) => !!impactOf(e, 'marek'), 3), 'marek');
  assert.equal(e1.result, 'guarded'); near(g.f.ren.resist, A0.m_slash.resist * R.guard, R.decay * dt, 'guarded blow');
  assert.ok(g.f.ren.resist > 0);
  const h = new DynamicSim(quiet()); h.drain(); h.forceSequence(['m_slash']); assert.equal(impactOf(until(h, (s, e) => !!impactOf(e, 'marek'), 3), 'marek').result, 'hit');
  near(h.f.ren.resist, A0.m_slash.resist, R.decay * dt, 'a blow that hits');
  const d = new DynamicSim(quiet()); d.drain(); d.f.ren.ap = 1; d.forceSequence(['m_heavy']); until(d, (s) => s.incoming()?.windowOpen === true, 3); d.react('ren', 'dodge');
  assert.equal(impactOf(until(d, (s, e) => !!impactOf(e, 'marek'), 3), 'marek').result, 'dodged'); assert.equal(d.f.ren.resist, 0);
  // full: the break, a stun of breakStun s with damage x breakDamage, the gauge held full, then zero
  const b = new DynamicSim(quiet()); b.drain(); b.f.marek.resist = R.max - A0.light.resist / 2;
  b.command('ren', 'light'); const ev = until(b, (s, e) => e.some((x) => x.type === 'break'), 3);
  const brk = ev.find((x) => x.type === 'break'), st = ev.find((x) => x.type === 'stun');
  assert.equal(brk.who, 'marek'); assert.equal(st.why, 'break'); assert.equal(st.dur, R.breakStun); assert.equal(b.f.marek.state, 'stunned');
  until(b, (s) => s.f.ren.state === 'idle', 3); b.command('ren', 'light');
  const hit = impactOf(until(b, (s, e) => !!impactOf(e, 'ren'), 3), 'ren');
  assert.equal(hit.damage, Math.round(A0.light.damage * R.breakDamage), 'slightly more damage while broken');
  assert.equal(b.f.marek.resist, R.max, 'held full during its stun');
  const end = until(b, (s, e) => e.some((x) => x.type === 'stunEnd'), 12).find((x) => x.type === 'stunEnd');
  near(end.t - brk.t, R.breakStun, 2 * dt, 'the stun lasts breakStun');
  assert.equal(b.f.marek.resist, 0); assert.equal(b.f.marek.state, 'idle'); assert.equal(b.f.marek.broken, false);
  // after the break, a hit deals its plain damage again
  until(b, (s) => s.f.ren.state === 'idle', 3); b.command('ren', 'light');
  assert.equal(impactOf(until(b, (s, e) => !!impactOf(e, 'ren'), 3), 'ren').damage, A0.light.damage);
  // one rule for both: the player breaks the same way
  const p = new DynamicSim(quiet()); p.drain(); p.f.ren.resist = R.max - 1; p.forceSequence(['m_slash']);
  const pe = until(p, (s, e) => e.some((x) => x.type === 'break'), 3);
  assert.equal(pe.find((x) => x.type === 'break').who, 'ren'); assert.equal(p.f.ren.state, 'stunned');
  run(p, R.breakStun + 0.1); assert.equal(p.f.ren.resist, 0); assert.notEqual(p.f.ren.state, 'stunned');
});

test('the guard: -60 % damage, never broken outright: a heavy blow on it is guarded and fills the gauge faster [G5]', () => {
  const sim = new DynamicSim(quiet()); sim.drain(); sim.setGuard('ren', true); run(sim, 0.3);
  sim.forceSequence(['m_heavy']);
  const ev = until(sim, (s, e) => !!impactOf(e, 'marek'), 3), hit = impactOf(ev, 'marek');
  assert.equal(hit.result, 'guarded'); assert.equal(hit.damage, Math.round(A0.m_heavy.damage * (1 - 0.6)));
  run(sim, 1);
  assert.notEqual(sim.f.ren.state, 'stunned'); assert.ok(!ev.some((e) => e.type === 'stun'));
  assert.ok(sim.f.ren.resist > A0.m_slash.resist, 'more than a light');
});

test('the opponent\'s priority (CB-4): through its whole sequence, gaps included, the player\'s attacks do not leave; guard and dodge still work', () => {
  const sim = new DynamicSim(quiet()); sim.drain(); sim.f.ren.ap = 5;
  sim.forceSequence(['m_slash', 'm_slash', 'm_heavy']);
  let denied = 0, gaps = 0, inSeq = 0, guarded = 0, starts = 0, lastStart = null;
  const ev = until(sim, (s, e) => e.some((x) => x.type === 'sequenceEnd'), 6, (s) => {
    if (!s.inSequence()) return;
    inSeq++;
    if (s.f.marek.state === 'idle') gaps++;
    for (const id of ['light', 'heavy', 't1']) { assert.equal(s.command('ren', id), false); if (s.drain().at(-1).why === 'defense') denied++; }
    s.setGuard('ren', true);
  });
  for (const e of ev) { if (e.type === 'commandStart' && e.who === 'ren') starts++; if (e.type === 'commandStart' && e.who === 'marek') lastStart = e; if (e.type === 'impact' && e.from === 'marek' && e.result === 'guarded') guarded++; }
  assert.ok(inSeq > 100 && gaps > 10, `the sequence and its gaps were visited (${inSeq} steps, ${gaps} in gaps)`);
  assert.equal(denied, 3 * inSeq, 'every attack tried in the sequence is refused for the defence');
  assert.equal(starts, 0, 'none left');
  assert.ok(guarded >= 2, 'the guard works in it');
  // the phase ends with the last blow: its start + impact + follow
  near(ev.find((e) => e.type === 'sequenceEnd').t - lastStart.t, A0.m_heavy.impactAt + A0.m_heavy.follow, dt, 'sequence end');
  sim.setGuard('ren', false); run(sim, 0.05);
  assert.equal(sim.command('ren', 'light'), true, 'after the sequence the player attacks again');
});

test('the « repoussé » (CB-3): an action that has not landed when a sequence starts is cancelled, its AP given back, and the first blow is received', () => {
  // a skill in its preparation
  const sim = new DynamicSim(quiet()); sim.drain(); sim.f.ren.ap = 3;
  assert.equal(sim.command('ren', 't1'), true); assert.equal(sim.f.ren.ap, 1);
  sim.forceSequence(['m_slash']); sim.setGuard('ren', true);
  const ev = until(sim, (s, e) => !!impactOf(e, 'marek'), 3);
  const pushed = ev.find((e) => e.type === 'pushed');
  assert.ok(pushed, 'pushed back'); assert.equal(pushed.action, 't1'); assert.equal(pushed.refund, A0.t1.apCost);
  assert.equal(sim.f.ren.ap, 3, 'its AP given back');
  assert.ok(!impactOf(ev, 'ren'), 'the skill never landed');
  const blow = impactOf(ev, 'marek'); assert.equal(blow.result, 'hit', 'the first blow is received (no guard)'); assert.equal(blow.damage, A0.m_slash.damage);
  assert.equal(sim.f.ren.state, 'idle', 'free again after it');
  // a heavy in its preparation: cancelled, nothing to give back
  const hv = new DynamicSim(quiet()); hv.drain(); hv.command('ren', 'heavy'); hv.forceSequence(['m_heavy']);
  const he = until(hv, (s, e) => !!impactOf(e, 'marek'), 3);
  assert.equal(he.find((e) => e.type === 'pushed').refund, 0); assert.ok(!impactOf(he, 'ren'));
  // pushed back, the player can neither guard nor dodge that blow
  const pd = new DynamicSim(quiet()); pd.drain(); pd.f.ren.ap = 3; pd.command('ren', 'heavy'); pd.forceSequence(['m_heavy']);
  const pde = until(pd, (s, e) => !!impactOf(e, 'marek'), 3, (s) => { s.setGuard('ren', true); s.react('ren', 'dodge'); });
  assert.equal(impactOf(pde, 'marek').result, 'hit'); assert.equal(pd.f.ren.ap, 3);
  // an action that has landed ends normally
  const ok = new DynamicSim(quiet()); ok.drain(); ok.command('ren', 'light'); until(ok, (s, e) => !!impactOf(e, 'ren'), 3);
  assert.equal(ok.f.ren.state, 'acting'); ok.forceSequence(['m_slash']);
  const oe = until(ok, (s) => s.f.ren.state === 'idle', 3);
  assert.ok(!oe.some((e) => e.type === 'pushed'), 'no pushback'); assert.equal(ok.f.ren.ap, 2, 'its AP gained stays');
  // a queued command does not survive the sequence's start
  const q = new DynamicSim(quiet()); q.drain(); q.command('ren', 'light');
  until(q, (s) => s.f.ren.state === 'recovering' && s.f.ren.recoverLeft <= D0.bufferTime, 3); assert.equal(q.command('ren', 'light'), 'buffered');
  q.forceSequence(['m_slash']); const qe = run(q, 1.5);
  assert.equal(qe.filter((e) => e.type === 'commandStart' && e.who === 'ren').length, 0);
});

test('the K.O. ends the duel, and only it: no time limit, nothing acts after it [G4]', () => {
  const sim = new DynamicSim(clone((d) => { d.fighters.ren.maxHp = 1e9; }));
  run(sim, 700);
  assert.equal(sim.over, false, 'past ten minutes the duel goes on'); assert.ok(sim.f.ren.hp < 1e9 && sim.f.ren.hp > 0);
  const k = new DynamicSim(quiet()); k.drain(); k.f.marek.hp = 5; k.command('ren', 'light');
  const ev = until(k, (s) => s.over, 3);
  assert.equal(ev.find((e) => e.type === 'ko').who, 'marek'); assert.equal(k.f.marek.state, 'down'); assert.equal(k.f.marek.hp, 0);
  assert.equal(k.command('ren', 'light'), false); assert.equal(k.drain().at(-1).why, 'state');
});

test('the opponent\'s pauses follow its level: drawn in the level\'s range, shorter as the level rises', () => {
  const means = [];
  for (const level of [1, 2, 3, 4, 5]) {
    const [r0, r1] = D0.restByLevel[level];
    const sim = new DynamicSim(clone((d) => { d.ai.level = level; d.ai.seed = 77 + level; d.fighters.ren.maxHp = 1e9; }));
    const rests = []; let restFrom = null;
    for (let i = 0; i < Math.round(600 / dt); i++) {
      const was = sim.f.marek.resting; sim.step();
      if (!was && sim.f.marek.resting) restFrom = sim.t;
      for (const e of sim.drain()) if (e.type === 'sequenceStart' && restFrom !== null) { rests.push(e.t - restFrom); restFrom = null; }
    }
    assert.ok(rests.length >= 30, `level ${level}: ${rests.length} pauses`);
    for (const r of rests) assert.ok(r >= r0 - dt && r <= r1 + 2 * dt, `level ${level}: a pause of ${r} s outside [${r0}, ${r1}]`);
    means.push(rests.reduce((a, b) => a + b, 0) / rests.length);
  }
  for (let i = 1; i < means.length; i++) assert.ok(means[i] < means[i - 1], `level ${i + 1} pauses shorter: ${means.map((m) => m.toFixed(2))}`);
  assert.ok(means[4] < 3.5, '« presque le combat full actif » at the top level');
});

test('the ward (defensive) and the boost (support): their multipliers for their time, on their holder', () => {
  const w = A0.d1.ward, b = A0.s1.boost;
  const sim = new DynamicSim(quiet()); sim.drain(); sim.f.ren.ap = 5;
  sim.command('ren', 'd1'); const fx = until(sim, (s, e) => e.some((x) => x.type === 'effect'), 3).find((x) => x.type === 'effect');
  assert.equal(fx.family, 'defensive'); assert.equal(fx.dur, w.dur);
  run(sim, 0.4); sim.forceSequence(['m_slash']);
  const hit = impactOf(until(sim, (s, e) => !!impactOf(e, 'marek'), 3), 'marek');
  assert.equal(hit.damage, Math.round(A0.m_slash.damage * w.damage)); near(sim.f.ren.resist, A0.m_slash.resist * w.resist, D0.resist.decay * dt, 'ward on the gauge');
  const end = until(sim, (s, e) => e.some((x) => x.type === 'wardEnd'), 8).find((x) => x.type === 'wardEnd');
  near(end.t - fx.t, w.dur, 2 * dt, 'the ward lasts its time');
  // the boost
  const s2 = new DynamicSim(quiet()); s2.drain(); s2.f.ren.ap = 5;
  s2.command('ren', 's1'); const bx = until(s2, (s, e) => e.some((x) => x.type === 'effect'), 3).find((x) => x.type === 'effect');
  assert.equal(bx.family, 'support');
  until(s2, (s) => s.f.ren.state === 'idle', 3); s2.command('ren', 'light');
  const bl = impactOf(until(s2, (s, e) => !!impactOf(e, 'ren'), 3), 'ren');
  assert.equal(bl.damage, Math.round(A0.light.damage * b.damage)); near(s2.f.marek.resist, A0.light.resist * b.resist, D0.resist.decay * dt, 'boost on the gauge');
  const be = until(s2, (s, e) => e.some((x) => x.type === 'boostEnd'), 10).find((x) => x.type === 'boostEnd');
  near(be.t - bx.t, b.dur, 2 * dt, 'the boost lasts its time');
  until(s2, (s) => s.f.ren.state === 'idle', 3); s2.command('ren', 'light');
  assert.equal(impactOf(until(s2, (s, e) => !!impactOf(e, 'ren'), 3), 'ren').damage, A0.light.damage);
});

test('duels of 5 to 10 minutes: the reference bot against every profile ends each at a K.O., the median between 5 and 10 minutes', () => {
  for (const id of Object.keys(P.DYN_PROFILES)) {
    const ts = [];
    for (let seed = 1; seed <= 8; seed++) {
      const r = runDynamicBotDuel(P.dynDuelData(P.DYN_PROFILES[id], { seed: 500 + seed, playerName: 'P', opponentName: id }), { skill: P.REFERENCE_SKILL, seed });
      assert.ok(r.winner, `${id}, seed ${seed}: ended by a K.O.`); assert.ok(r.playerHp === 0 || r.opponentHp === 0);
      ts.push(r.t);
    }
    ts.sort((a, b) => a - b); const med = (ts[3] + ts[4]) / 2;
    assert.ok(med >= 300 && med <= 600, `${id}: median ${(med / 60).toFixed(1)} min`);
  }
});

test('the bot: a duel replays from (data, skill, seed); skill wins duels; a negative skill does not play', () => {
  const d = P.dynDuelData(P.DYN_PROFILES.vessa, { seed: 4242, playerName: 'P', opponentName: 'Vessa' });
  const a = runDynamicBotDuel(d, { skill: 0.5, seed: 9 }), b = runDynamicBotDuel(d, { skill: 0.5, seed: 9 }), c = runDynamicBotDuel(d, { skill: 0.5, seed: 10 });
  assert.deepEqual(a, b); assert.notEqual(a.hash, c.hash);
  let hi = 0, lo = 0;
  for (let seed = 1; seed <= 10; seed++) {
    const dd = P.dynDuelData(P.DYN_PROFILES.vessa, { seed: 600 + seed, playerName: 'P', opponentName: 'Vessa' });
    if (runDynamicBotDuel(dd, { skill: 0.6, seed }).winner === 'player') hi++;
    if (runDynamicBotDuel(dd, { skill: 0, seed }).winner === 'player') lo++;
  }
  assert.ok(hi >= 9 && lo <= 1, `skill 0.6 won ${hi} / 10, skill 0 ${lo} / 10`);
  const idle = runDynamicBotDuel(d, { skill: -1, seed: 1 });
  assert.equal(idle.winner, 'opponent'); assert.equal(idle.opponentHp, idle.opponentMaxHp, 'never struck');
});

/** written before the held-out run (journal Passe C1): the simplified win chance within 0.2 of the full duels' win rate, per profile and skill */
const TOLERANCE = 0.2;
const HELD_OUT = Array.from({ length: 40 }, (_, i) => 101 + i);
function fullRate(profile, skill, mods = {}) {
  let w = 0;
  for (const seed of HELD_OUT) {
    const d = P.dynDuelData(P.DYN_PROFILES[profile], { seed: 9000 + seed * 11, playerName: 'P', opponentName: profile, player: mods.player, enemy: mods.enemy });
    if (runDynamicBotDuel(d, { skill, seed }).winner === 'player') w++;
  }
  return w / HELD_OUT.length;
}

test('the off-screen resolution of the new rules agrees with full duels in DynamicSim (held-out seeds, tolerance 0.2)', () => {
  const cases = [];
  for (const id of Object.keys(P.DYN_PROFILES)) for (const s of [0, 0.5, 1]) cases.push([id, s]);
  // where the duels turn (journal Passe C1): Marek, Vessa and Rhosk near their thresholds
  for (const [id, s] of [['marek', 0.4], ['marek', 0.45], ['vessa', 0.2], ['vessa', 0.3], ['rhosk', 0.2], ['rhosk', 0.3]]) cases.push([id, s]);
  // with the preparation's modifiers: an injury, a tempered blade and training, a well-prepared opponent
  for (const [id, s, m] of [['marek', 0.6, { player: { hp: 0.8 } }], ['vessa', 0.1, { player: { damage: 1.15 } }], ['marek', 0.3, { player: { damage: 1.265 } }], ['rhosk', 0.45, { enemy: { damage: 1.25, hp: 1.1 } }]]) cases.push([id, s, m]);
  const rows = [];
  for (const [id, s, m = {}] of cases) {
    const full = fullRate(id, s, m), pred = P.dynPlayerWinChance(P.DYN_PROFILES[id], s, m.player, m.enemy);
    rows.push(`${id}@${s}${m.player || m.enemy ? ' ' + JSON.stringify(m) : ''}: full ${full.toFixed(2)} pred ${pred.toFixed(2)}`);
    assert.ok(Math.abs(full - pred) <= TOLERANCE, rows.at(-1));
  }
  // the grid reaches both outcomes and the turning region
  const fulls = rows.map((r) => +r.match(/full ([\d.]+)/)[1]);
  assert.ok(fulls.some((f) => f === 0) && fulls.some((f) => f === 1) && fulls.some((f) => f > 0.15 && f < 0.85), rows.join('\n'));
});

test('the duel data: DYNAMIC_DATA untouched, Marek\'s profile is the default duel, the preparation changes only its seat', () => {
  const before = JSON.stringify(D0);
  const m = P.dynDuelData(P.DYN_PROFILES.marek, { seed: D0.ai.seed, playerName: D0.fighters.ren.name, opponentName: D0.fighters.marek.name });
  assert.deepEqual(m, JSON.parse(before), 'the default duel is Marek\'s profile');
  const sim = new DynamicSim(m); runDynamicFingerprint(sim); assert.equal(sim.hash(), DYNAMIC_SIM_HASH);
  const d = P.dynDuelData(P.DYN_PROFILES.vessa, { seed: 7, playerName: 'Aster', opponentName: 'Vessa Lark', player: { hp: 0.8, damage: 1.15, ap: 2 }, enemy: { damage: 1.1, hp: 0.9 }, loadout: ['t2', 't3', 'd1', 's1'], names: { light: 'Quick strike' } });
  assert.equal(JSON.stringify(D0), before);
  assert.equal(d.fighters.ren.maxHp, Math.round(D0.fighters.ren.maxHp * 0.8)); assert.equal(d.fighters.ren.name, 'Aster');
  assert.equal(d.fighters.marek.maxHp, Math.round(P.DYN_PROFILES.vessa.maxHp * 0.9)); assert.equal(d.ai.level, P.DYN_PROFILES.vessa.level);
  assert.equal(d.actions.light.damage, Math.round(10 * 1.15)); assert.equal(d.actions.m_slash.damage, Math.round(P.DYN_PROFILES.vessa.light.damage * 1.1));
  assert.equal(d.ap.start, Math.min(D0.ap.max, D0.ap.start + 2)); assert.deepEqual(d.loadout, ['t2', 't3', 'd1', 's1']); assert.equal(d.actions.light.name, 'Quick strike');
  assert.throws(() => P.dynDuelData(P.DYN_PROFILES.vessa, { seed: 7, playerName: 'A', opponentName: 'B', loadout: ['t1'] }), /4 distinct skills/);
  // every profile has a level whose pauses exist, its kit and health
  for (const p of Object.values(P.DYN_PROFILES)) { assert.ok(D0.restByLevel[p.level], p.id); assert.ok(p.maxHp > 0 && p.light.damage > 0 && p.heavy.damage > p.light.damage, p.id); }
});

test('the fingerprint: the fixed script on DYNAMIC_DATA gives DYNAMIC_SIM_HASH, twice the same events', () => {
  const a = new DynamicSim(), b = new DynamicSim(), ea = [], eb = [];
  runDynamicFingerprint(a, (e) => ea.push(...e)); runDynamicFingerprint(b, (e) => eb.push(...e));
  assert.equal(a.hash(), DYNAMIC_SIM_HASH); assert.deepEqual(ea, eb);
  const kinds = new Set(ea.map((e) => e.type === 'commandDenied' ? `denied:${e.why}` : e.type));
  for (const k of ['pushed', 'denied:defense', 'break', 'effect', 'reactStart', 'sequenceStart', 'sequenceEnd', 'wardEnd']) assert.ok(kinds.has(k), `the script reaches ${k}`);
});

test('a game under the new rules (flags.combat): its duels in DynamicSim, its off-screen matches in their race; without the flag, the game of today', () => {
  let st = G.namedState('day2-morning'); st = G.advance(st, { type: 'wait' }).state;
  const sh = matchSheetFor(st), classic = L.botOutcome(st, 0.5);
  st.flags.combat = 'dynamic';
  const dyn = L.botOutcome(st, 0.5), ref = runDynamicBotDuel(dynSheetData(sh), { skill: 0.5, seed: sh.seed ^ 0x5bd1e995 });
  assert.equal(dyn.opponentMaxHp, dynSheetData(sh).fighters.marek.maxHp); assert.equal(classic.opponentMaxHp, sheetData(sh).fighters.marek.maxHp);
  assert.ok(dyn.opponentMaxHp > 5 * classic.opponentMaxHp, 'the health of the new rules');
  assert.deepEqual([dyn.winner, dyn.playerHp, dyn.opponentHp], [ref.winner, ref.playerHp, ref.opponentHp]);
  // the off-screen matches of the day: each winner drawn against the new rules' race (recomputed here from the racers)
  const s2 = structuredClone(st), log = [];
  T.playOffscreenMatches(s2, (e) => log.push(e), new Rng(5));
  let n = 0;
  for (const m of s2.tournament.matches.filter((x) => x.day === st.day && !x.seen)) {
    const A = st.competitors[m.a], B = st.competitors[m.b];
    const p = P.raceWinChance(P.dynRacerOf(P.DYN_PROFILES[A.combatProfile], T.rivalMods(A)), P.dynRacerOf(P.DYN_PROFILES[B.combatProfile], T.rivalMods(B)), 0, P.DYN_RACE_SLOPE);
    assert.equal(m.winner, new Rng(5).fork(T.matchId(m)).next() < p ? m.a : m.b, T.matchId(m)); n++;
  }
  assert.equal(n, 3);
  // whole games: the flag stays, every duel ends at a K.O.; without it, the game of today (frozen main c784e04: idle, seed 7)
  const g = L.autoplay(7, L.POLICIES.idle, 'Ren', 200, 'dynamic');
  assert.equal(g.state.flags.combat, 'dynamic'); assert.notEqual(g.hash, 'fe80e2a7c5dd3666');
  assert.equal(L.autoplay(7, L.POLICIES.idle).hash, 'fe80e2a7c5dd3666');
  assert.equal(L.autoplay(12, L.SCRIPTS.careful()).hash, 'fff4c51dd69cec8a');
});

test('the arena of today is untouched: nothing it loads imports the new rules; the classic race keeps its slope', () => {
  const imports = (f) => [...fs.readFileSync(path.join(ROOT, f), 'utf8').matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);
  for (const f of fs.readdirSync(path.join(ROOT, 'src/arena'))) assert.ok(!imports(`src/arena/${f}`).some((i) => /combat\/(dynamic|bot)/.test(i)), f);
  const a = { hp: 600, dps: 9 }, b = { hp: 700, dps: 7.5 }, ta = b.hp / a.dps, tb = a.hp / b.dps;
  assert.equal(P.raceWinChance(a, b), 1 / (1 + Math.exp(-(3.2 * Math.log(tb / ta)))));
  assert.equal(P.RACE_SLOPE, 3.2);
});
