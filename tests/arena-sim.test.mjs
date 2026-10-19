// The arena's combat simulation in the game (src/arena/CombatSim.ts, journal Passe P1) against the prototype it was ported from: the
// prototype's own `CombatLib` script, read out of arena/arena.html and run here, plays the same fixed input script (120 s of attacks,
// guard, dodges in the windows, resets at each KO); the two must give the same event stream, step for step, and the same final hash,
// the one tools/arena-check.mjs records for the prototype (ARENA_SIM_HASH).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from './load.mjs';

const { CombatSim, COMBAT_DATA, runFingerprintScript, ARENA_SIM_HASH } = await load('/src/arena/CombatSim.ts');

/** the prototype's CombatLib, evaluated from the archived page's script (the block runs `module.exports = api` when given a module) */
function prototypeLib() {
  const html = fs.readFileSync(path.join(ROOT, 'arena/arena.html'), 'utf8');
  const a = html.indexOf('/* ===== CombatSimulation v2'), b = html.indexOf('})(typeof window !== \'undefined\' ? window : globalThis);', a);
  assert.ok(a > 0 && b > a, 'CombatLib block not found in arena/arena.html');
  const module = { exports: {} };
  new Function('module', html.slice(a, b) + '})(globalThis);')(module);
  return module.exports;
}

test('the ported simulation and the prototype give the same events and the same hash on the fingerprint script', () => {
  const lib = prototypeLib();
  const ours = new CombatSim(), theirs = new lib.CombatSim();
  const evA = [], evB = [];
  runFingerprintScript(ours, (e) => evA.push(...e));
  runFingerprintScript(theirs, (e) => evB.push(...e));
  assert.equal(evA.length, evB.length);
  for (let i = 0; i < evA.length; i++) assert.deepEqual(evA[i], evB[i], `event ${i}`);
  assert.equal(theirs.hash(), ARENA_SIM_HASH);
  assert.equal(ours.hash(), ARENA_SIM_HASH);
});

// The fingerprint script never holds the guard through an impact nor queues a command (a fault injected there passed it): a second
// script, seeded pseudo-random inputs over 300 s (every command at random times, denied ones included, guard held for random spans,
// dodges early, in and after the windows, forced actions, refills, resets), compares the two implementations on those paths too.
function fuzzScript(sim, seed, onEvents, onState) {
  let s = seed >>> 0;
  const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const ids = ['light', 'heavy', 't1', 't2', 't3', 't4', 'm_slash'];
  let guardUntil = -1;
  for (let i = 0; i < Math.round(300 / sim.D.dt); i++) {
    const r = rnd();
    if (r < 0.012) sim.command('ren', ids[Math.floor(rnd() * ids.length)]);
    else if (r < 0.016) sim.react('ren', 'dodge');
    else if (r < 0.019) guardUntil = sim.t + rnd() * 1.5;
    else if (r < 0.0192) sim.forceAction('marek', rnd() < 0.5 ? 'm_heavy' : 'm_slash');
    else if (r < 0.0193) sim.refill('ren');
    sim.setGuard('ren', sim.t < guardUntil);
    sim.step(sim.D.dt); onEvents(sim.drain()); onState?.(state(sim));
    if (sim.over && rnd() < 0.02) sim.reset();
  }
}

/** everything a step leaves in a fighter, the presentation's clip included (the flinch, the guard timer: not in the hash or the events) */
const state = (sim) => ['ren', 'marek'].map((id) => { const f = sim.f[id], a = f.anim; return `${f.hp}|${f.ap}|${f.state}|${f.stateT.toFixed(6)}|${f.flinch.toFixed(6)}|${f.guarding}|${f.guardT.toFixed(6)}|${f.aiWait.toFixed(6)}|${a.name}|${a.t.toFixed(6)}|${a.dur.toFixed(6)}`; }).join(';');

test('the two implementations agree on seeded random inputs (guard through impacts, queued commands, stuns, refills)', () => {
  const lib = prototypeLib();
  for (const seed of [1, 1842, 77777]) {
    const ours = new CombatSim(), theirs = new lib.CombatSim(), evA = [], evB = [], stA = [], stB = [];
    fuzzScript(ours, seed, (e) => evA.push(...e), (x) => stA.push(x));
    fuzzScript(theirs, seed, (e) => evB.push(...e), (x) => stB.push(x));
    for (let i = 0; i < stA.length; i++) if (stA[i] !== stB[i]) assert.fail(`seed ${seed}, step ${i}: ${stA[i]} != ${stB[i]}`);
    assert.equal(evA.length, evB.length, `seed ${seed}`);
    for (let i = 0; i < evA.length; i++) assert.deepEqual(evA[i], evB[i], `seed ${seed}, event ${i}`);
    assert.equal(ours.hash(), theirs.hash());
    // the script must reach the paths it is for
    const kinds = new Set(evA.map((e) => e.type === 'impact' ? `impact:${e.result}` : e.type === 'commandDenied' ? `denied:${e.why}` : e.type));
    for (const k of ['impact:hit', 'impact:guarded', 'impact:guardbreak', 'impact:dodged', 'stun', 'ko', 'denied:busy', 'denied:ap', 'denied:cooldown', 'reactDenied', 'techReady'])
      assert.ok(kinds.has(k), `seed ${seed}: the script never reached ${k}`);
  }
});

test('the ported rules are the prototype\'s numbers', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(COMBAT_DATA)), JSON.parse(JSON.stringify(prototypeLib().DATA)));
});

test('a dodge in the window avoids a heavy hit; a guard reduces a light one by 60 %; a heavy breaks the guard', () => {
  const s = new CombatSim();
  // Marek's first sequence starts at 1 s; script it instead: a heavy now, dodge as the window opens
  s.forceAction('marek', 'm_heavy');
  assert.ok(s.advanceUntil(() => s.incoming()?.windowOpen === true, 2));
  assert.equal(s.react('ren', 'dodge'), true);
  s.advanceUntil(() => s.f.marek.act?.impacted !== false, 2);
  const ev = s.drain().filter((e) => e.type === 'impact');
  assert.equal(ev.at(-1).result, 'dodged');
  assert.equal(s.f.ren.hp, 200);
  assert.equal(s.f.ren.ap, 2);
  // guard against a light slash
  s.advanceUntil(() => s.f.marek.state === 'idle', 3);
  s.setGuard('ren', true); s.advance(0.2);
  s.forceAction('marek', 'm_slash');
  s.advanceUntil(() => s.f.marek.act?.impacted === true || s.f.marek.state !== 'acting', 2);
  const g = s.drain().filter((e) => e.type === 'impact').at(-1);
  assert.equal(g.result, 'guarded'); assert.equal(g.damage, Math.round(16 * 0.4));
  // a heavy on the guard: guard break, stunned
  s.advanceUntil(() => s.f.marek.state === 'idle', 3);
  s.forceAction('marek', 'm_heavy');
  s.advanceUntil(() => s.f.ren.state === 'stunned', 2);
  assert.equal(s.f.ren.state, 'stunned');
  assert.equal(s.drain().filter((e) => e.type === 'impact').at(-1).result, 'guardbreak');
});
