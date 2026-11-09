// The version 2 duel after the operator's first trial (his sheet of 2026-11-09, journal Passes DB2 / DB3): duels of 3 to 4 minutes (DB-1, A3), the
// opponent's riposte at the third light attack of its pause, never in its break (DB-2, A3, his note « mais cela ne s'applique pas si l'adversaire
// est en rupture/break. »), +1 AP a light attack kept (DB-3), the skills x4 (DB-4), the gauge by the skills and a break x2 for 8 s (DB-5, A3), the
// charge times kept (DB-6), the rivals recalibrated (DB-7), in the default game (DB-8). Oracles written from the decisions, not read from the code.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';

const C = await load('/src/combat/charge.ts');
const V = await load('/src/combat/v2duel.ts');
const D = await load('/src/combat/dynamic.ts');
const B = await load('/src/combat/bot.ts');
const K = await load('/src/combat/skills.ts');
const Rng = (await load('/src/core/rng.ts')).Rng;

const duel = (foe = 'marek') => V.v2DuelData(foe, { seed: 1337, playerName: 'Ren', opponentName: foe });
/** a fresh charged duel, the opponent in a long pause (its next sequence 20 s away) */
function fresh(foe) { const d = duel(foe), c = new C.ChargedDuel(d.data, d.tiers); c.sim.f.marek.aiWait = 20; c.sim.f.marek.resting = true; return c; }
const steps = (c, secs, evs = []) => { for (let i = 0; i < Math.round(secs / c.D.dt); i++) { c.step(c.D.dt); evs.push(...c.drain()); } return evs; };
/** a tap, then the time its light attack takes to end (impact, follow, recovery) */
const tap = (c, evs = []) => { c.attack(true); c.step(); c.attack(false); evs.push(...c.drain()); const L = c.D.actions.light; return steps(c, L.impactAt + L.follow + L.recover + 0.05, evs); };

test('the numbers of the sheet (journal Passe DB3): the skills x4 and twice the gauge, the light attack\'s gauge 2, the break 8 s and x2 for both, the riposte at 3', () => {
  assert.equal(V.V2_SKILL_HIT, 4); assert.equal(V.V2_SKILL_GAUGE, 2); assert.equal(V.V2_LIGHT_GAUGE, 2);
  assert.deepEqual(V.V2_BREAK, { stun: 8, damage: 2 }); assert.deepEqual(V.V2_RIPOSTE, { after: 3, delay: 0.3 });
  const d = duel().data;
  assert.deepEqual([d.resist.breakStun, d.resist.breakDamage], [8, 2], 'one rule for both fighters (G3)');
  assert.deepEqual(d.ai.riposte, { after: 3, delay: 0.3 });
  // the light attack: today's damage and +1 AP (DB-3), its gauge 2 (3 before)
  assert.deepEqual([d.actions.light.damage, d.actions.light.apGain, d.actions.light.resist], [D.DYNAMIC_DATA.actions.light.damage, 1, 2]);
  // the charge times of CH-1 kept (DB-6)
  assert.deepEqual(duel().tiers.map((t) => t.at), [0, K.chargeTime('d1', 1), K.chargeTime('t1', 1), K.chargeTime('s1', 1), K.chargeTime('t4', 1)]);
  // Ren 2 750 (2 200 x 1.25), the Thrust 672 against Marek's 11 520 (5.8 % of his bar)
  assert.equal(d.fighters.ren.maxHp, 2750);
  assert.equal(d.actions.t4.damage, Math.round(58 * 3.4 * 0.85) * 4);
  // today's game and C2's duel keep their own: no riposte, the break of C2-9
  assert.equal(D.DYNAMIC_DATA.ai.riposte, undefined); assert.deepEqual([D.DYNAMIC_DATA.resist.breakStun, D.DYNAMIC_DATA.resist.breakDamage], [6, 1.2]);
});

test('the riposte (DB-2): at the third light attack landed in its pause the opponent\'s sequence starts 0.3 s later; two do nothing; guarded ones count', () => {
  // two taps: the pause goes on
  let c = fresh(), evs = [];
  tap(c, evs); tap(c, evs);
  evs = steps(c, 2, evs);
  assert.ok(!evs.some((e) => e.type === 'sequenceStart' || e.type === 'riposte'), 'two light attacks: no riposte');
  // the third: its sequence 0.3 s after it lands
  tap(c, evs = []);
  steps(c, 1, evs);
  const third = evs.find((e) => e.type === 'impact' && e.from === 'ren' && e.action === 'light'), seq = evs.find((e) => e.type === 'sequenceStart');
  assert.ok(third && seq, JSON.stringify(evs.map((e) => e.type)));
  assert.ok(evs.some((e) => e.type === 'riposte' && e.who === 'marek' && e.lights === 3));
  assert.ok(Math.abs(seq.t - third.t - 0.3) < 0.03, `the sequence ${(seq.t - third.t).toFixed(3)} s after the third light attack`);
  // guarded light attacks count (they land on it)
  c = fresh(); evs = [];
  // (its guard held by hand before each tap: its own defence of C3 lets it go after the blow it waited for)
  for (let i = 0; i < 3; i++) { c.sim.f.marek.guardHeld = true; c.sim.f.marek.guardUntil = 0; steps(c, 0.15, evs); tap(c, evs); }
  steps(c, 1, evs);
  assert.equal(evs.filter((e) => e.type === 'impact' && e.from === 'ren' && e.result === 'guarded').length, 3);
  assert.ok(evs.some((e) => e.type === 'sequenceStart'), 'three guarded light attacks: the riposte');
  // the count starts again after each sequence: two before it, one after, nothing
  c = fresh(); evs = [];
  tap(c, evs); tap(c, evs); c.sim.forceSequence(['m_slash']); steps(c, 2, evs);
  c.sim.f.marek.aiWait = 20; evs = [];
  tap(c, evs); steps(c, 2, evs);
  assert.ok(!evs.some((e) => e.type === 'riposte'), 'the count starts again after a sequence');
});

test('never in its break (the operator\'s note on DB-2): light attacks on a broken opponent draw no riposte, and the count starts again after its stun', () => {
  const c = fresh(), evs = [];
  // break it: its gauge to the brink, a light attack fills it
  c.sim.f.marek.resist = c.D.resist.max - 1;
  tap(c, evs);
  assert.ok(evs.some((e) => e.type === 'break' && e.who === 'marek'));
  // five light attacks in its stun: no riposte, no sequence
  for (let i = 0; i < 5; i++) tap(c, evs);
  assert.ok(c.sim.f.marek.broken, 'still broken');
  assert.ok(!evs.some((e) => e.type === 'riposte' || e.type === 'sequenceStart'));
  // its stun ends: two more light attacks are not enough (the count starts again), the third is
  steps(c, c.sim.f.marek.stunLeft + 0.05, evs);
  c.sim.f.marek.aiWait = 20; const after = [];
  tap(c, after); tap(c, after); steps(c, 0.5, after);
  assert.ok(!after.some((e) => e.type === 'riposte'), 'two after the stun: nothing');
  tap(c, after); steps(c, 0.6, after);
  assert.ok(after.some((e) => e.type === 'riposte'), 'the third after the stun: the riposte');
});

test('the break (DB-5): 8 s stunned, every blow it takes doubled, for either fighter; the skills fill the gauge twice as much', () => {
  const c = fresh(), evs = [];
  c.sim.f.marek.resist = c.D.resist.max - 1;
  tap(c, evs);
  const stun = evs.find((e) => e.type === 'stun' && e.who === 'marek');
  assert.equal(stun.dur, 8);
  const hit = tap(c, []).find((e) => e.type === 'impact' && e.from === 'ren');
  assert.equal(hit.damage, c.D.actions.light.damage * 2, 'a light attack on a broken opponent: twice its damage');
  // the player's own break: the same rule
  const p = fresh(); p.sim.f.ren.resist = p.D.resist.max - 1; p.sim.forceSequence(['m_slash']);
  const pe = steps(p, 1.5);
  assert.equal(pe.find((e) => e.type === 'stun' && e.who === 'ren')?.dur, 8);
  // what a blow adds to the opponent's gauge: a skill twice today's share (x its level), the light attack 2
  const d = duel().data;
  assert.equal(d.actions.t1.resist, D.DYNAMIC_DATA.actions.t1.resist * 2 * 2, 'the Flash cut: x2 for its charge (V2_POWER), x2 the gauge');
  assert.equal(d.actions.light.resist, 2);
});

test('the duel\'s shape (DB-1, DB-2, DB-4; tools/duel-balance.mjs): 3 to 4 minutes, the skills most of the damage; a spammer of the light attack loses, three light attacks a pause', () => {
  let t = 0, n = 0, skills = 0, all = 0;
  for (const foe of ['orla', 'cassius', 'marek']) for (let i = 1; i <= 4; i++) {
    const d = V.v2DuelData(foe, { seed: 3000 + i, playerName: 'Ren', opponentName: foe });
    const r = B.runV2BotDuel(d.data, d.tiers, { skill: 0.5, seed: 40 + i, observe: (evs) => { for (const e of evs) if (e.type === 'impact' && e.from === 'ren') { all += e.damage; if (e.action !== 'light') skills += e.damage; } } });
    assert.ok(r.winner, 'a K.O.'); t += r.t; n++;
  }
  assert.ok(t / n / 60 >= 2.8 && t / n / 60 <= 4.5, `average ${(t / n / 60).toFixed(2)} min`);
  assert.ok(skills / all >= 0.8, `the skills ${Math.round((100 * skills) / all)} % of the damage`);
  // the spammer: taps whenever free between the opponent's sequences, guards every sequence, dodges the heavy blows with its AP
  const d = V.v2DuelData('orla', { seed: 3001, playerName: 'Ren', opponentName: 'orla' }), c = new C.ChargedDuel(d.data, d.tiers), rng = new Rng(7);
  let down = false, lights = 0, max = 0, broken = false;
  while (!c.over && c.t < 900) {
    const inc = c.incoming();
    if (inc && inc.windowOpen && inc.kind !== 'light' && rng.next() < 0.6) c.react('ren', 'dodge');
    c.setGuard('ren', c.sim.inSequence());
    if (down) { c.attack(false); down = false; } else if (!c.sim.inSequence() && c.sim.f.ren.state === 'idle') { c.attack(true); down = true; }
    c.step();
    for (const e of c.drain()) {
      if (e.type === 'break' && e.who === 'marek') broken = true;
      if (e.type === 'stunEnd' && e.who === 'marek') { broken = false; lights = 0; }
      if (e.type === 'sequenceStart') lights = 0;
      if (e.type === 'impact' && e.from === 'ren' && e.action === 'light' && !broken) max = Math.max(max, ++lights);
    }
  }
  assert.equal(c.sim.f.ren.state, 'down', 'the spammer loses');
  assert.ok(max <= 3, `at most three light attacks in a pause outside a break: ${max}`);
});
