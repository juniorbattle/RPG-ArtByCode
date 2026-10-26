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

test('the tiers: a tap the light attack, 2 s the heavy, then the four skills by their charge time at their level (ties by their slot)', () => {
  const d = duel();
  assert.deepEqual(d.tiers.map((t) => t.id), ['light', 'heavy', 'd1', 't1', 's1', 't4']);
  assert.deepEqual(d.tiers.map((t) => t.at), [0, 2, 3.5, 4, 5, 9]);
  assert.deepEqual(d.tiers.map((t) => t.ap), [0, 0, 2, 2, 3, 4]);
  // the levels change the order: Rampart at level 1 (3.5 s) behind Flash cut at level 5 (3.0 s)
  const k = V.v2DuelData('marek', { seed: 1, playerName: 'R', opponentName: 'M', kit: { loadout: ['t1', 't4', 'd1', 's1'], levels: { t1: 5, t4: 3, d1: 1, s1: 1 } } });
  assert.deepEqual(k.tiers.map((t) => [t.id, t.at]), [['light', 0], ['heavy', 2], ['t1', 3], ['d1', 3.5], ['s1', 5], ['t4', 7.4]]);
  // a tie keeps the slots' order; a skill never comes before the heavy (at least 0.25 s after it)
  const tie = C.chargeTiers(['t2', 't1'], { t1: 4, t2: 4 }, d.data);
  assert.deepEqual(tie.map((t) => t.id), ['light', 'heavy', 't2', 't1']);
  assert.equal(C.chargeTiers(['t1'], { t1: 1 }, d.data)[2].at, 2.25);
});

test('the charge: released at the tier reached; a tier whose AP are missing does not open, the best open tier below is launched (AV-6)', () => {
  // [hold (s), AP at the start, the action launched]: the oracle from the rule (the last tier reached whose AP are there)
  const cases = [[0.05, 1, 'light'], [1.9, 5, 'light'], [2.05, 0, 'heavy'], [3.6, 5, 'd1'], [3.6, 1, 'heavy'], [4.1, 2, 't1'], [5.2, 2, 't1'], [5.2, 3, 's1'], [9.2, 5, 't4'], [9.2, 3, 's1'], [12, 4, 't4']];
  for (const [hold, ap, want] of cases) {
    const c = fresh({ ap });
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

test('what cuts a charge (« proposé »): an unguarded blow, the player\'s dodge, the player\'s break; a guarded blow keeps it; a release in the defence phase is refused', () => {
  // an unguarded blow
  let c = fresh({ live: true });
  c.attack(true);
  let evs = [];
  for (let i = 0; i < 12 / c.D.dt && !evs.some((e) => e.type === 'chargeCut'); i++) { c.step(); evs.push(...c.drain()); }
  assert.equal(evs.find((e) => e.type === 'chargeCut')?.why, 'hit');
  assert.ok(evs.findIndex((e) => e.type === 'impact' && e.to === 'ren' && e.result === 'hit') < evs.findIndex((e) => e.type === 'chargeCut'));
  assert.equal(c.view().held, false);
  // a guarded blow keeps it, and the charge grows under the guard
  c = fresh(); c.attack(true); c.setGuard('ren', true); steps(c, 0.3);
  c.sim.forceSequence(['m_slash']); evs = [];
  for (let i = 0; i < 2 / c.D.dt; i++) { c.step(); evs.push(...c.drain()); }
  assert.ok(evs.some((e) => e.type === 'impact' && e.to === 'ren' && e.result === 'guarded'));
  assert.ok(!evs.some((e) => e.type === 'chargeCut'));
  assert.ok(c.view().held && c.view().t > 2.2, `held under the guard: ${c.view().t}`);
  // a release while the opponent attacks: refused (G3), the charge lost, no action
  c = fresh(); c.attack(true); steps(c, 2.2); c.sim.forceSequence(['m_slash', 'm_heavy']); steps(c, 0.05);
  assert.ok(c.sim.inSequence());
  c.attack(false); evs = c.drain();
  assert.equal(lastRelease(evs).ok, false);
  assert.ok(evs.some((e) => e.type === 'commandDenied' && e.why === 'defense'));
  assert.equal(c.view().held, false);
  // the player's dodge
  c = fresh({ ap: 3 }); c.attack(true); c.sim.forceSequence(['m_heavy']);
  for (let i = 0; i < 3 / c.D.dt && !(c.incoming()?.windowOpen); i++) c.step();
  c.react('ren', 'dodge'); c.step(); evs = c.drain();
  assert.equal(evs.find((e) => e.type === 'chargeCut')?.why, 'dodge');
  // the player's break
  c = fresh(); c.attack(true); c.sim.f.ren.resist = c.D.resist.max - 1; c.sim.forceSequence(['m_slash']); evs = [];
  for (let i = 0; i < 2 / c.D.dt; i++) { c.step(); evs.push(...c.drain()); }
  assert.ok(evs.some((e) => e.type === 'chargeCut' && (e.why === 'break' || e.why === 'hit')));
  // the charge grows only while the player is free: not while its action runs
  c = fresh(); c.command('ren', 'light'); c.attack(true); c.step();
  assert.equal(c.view().t, 0, 'acting: no charge');
  steps(c, 1.5);
  assert.ok(c.view().t > 0.5 && c.view().t < 1.5, `charged once free: ${c.view().t}`);
});

test('a level per skill (AV-8): its power and its charge time; no level of the player (PROJECT § 7)', () => {
  const base = D.DYNAMIC_DATA.actions.t4;
  for (let lv = 1; lv <= 5; lv++) {
    const a = K.atLevel(base, lv);
    assert.equal(a.damage, Math.round(base.damage * (1 + 0.1 * (lv - 1))));
    assert.ok(K.chargeTime('t4', lv) <= 10 && K.chargeTime('t4', lv) >= 6);
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
  // a charged blow pays for its hold; the light attack keeps today's numbers
  assert.equal(c.data.actions.light.damage, D.DYNAMIC_DATA.actions.light.damage);
  assert.ok(c.data.actions.heavy.damage > 2 * D.DYNAMIC_DATA.actions.heavy.damage);
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

test('the balance toward « modéré » (L7-4, CB-11; « proposé »): a staircase by the bot\'s skill, Marek the hardest, duels of 5 to 13 minutes', () => {
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
  for (const r of [strong, weak, m6, o6, m2]) assert.ok(r.min >= 5 && r.min <= 13, `duel length ${r.min.toFixed(1)} min`);
});

test('the off-screen race of the version 2 agrees with full duels on held-out seeds (tolerance 12 %), and decides the version 2\'s off-screen bouts', () => {
  for (const foe of ['tobin', 'orla', 'vessa', 'marek']) {
    let kill = 0, dps = 0, n = 0;
    for (let i = 21; i <= 26; i++) {
      const d = V.v2DuelData(foe, { seed: 5000 + i, playerName: 'Ren', opponentName: foe });
      d.data.fighters.ren.maxHp = 1e7;
      const r = B.runV2BotDuel(d.data, d.tiers, { skill: 0.5, seed: 900 + i });
      kill += r.t; dps += (r.playerMaxHp - r.playerHp) / r.t; n++;
    }
    const R = V.V2_RACERS[foe];
    assert.ok(Math.abs(kill / n - R.kill) / R.kill < 0.12, `${foe} kill ${(kill / n).toFixed(0)} vs ${R.kill}`);
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
  assert.deepEqual(m.tiers.map((t) => t.state), ['ahead', 'ahead', 'ahead', 'ahead', 'locked', 'locked']);
  c.attack(true); steps(c, 1.0);
  m = A.chargeHudModel(c.view());
  assert.deepEqual(m.tiers.map((t) => t.state), ['launch', 'next', 'ahead', 'ahead', 'locked', 'locked']);
  assert.ok(Math.abs(m.toNext - 50) <= 1, `half way to the heavy: ${m.toNext}`);
  steps(c, 4.2);
  m = A.chargeHudModel(c.view());
  assert.deepEqual(m.tiers.map((t) => t.state), ['reached', 'reached', 'reached', 'launch', 'locked', 'locked']);
  assert.equal(m.launch, 't1');
  steps(c, 5);
  m = A.chargeHudModel(c.view());
  assert.equal(m.launch, 't1', 'past Fervour and the Thrust, both locked: the Flash cut');
  assert.equal(m.toNext, 100);
  // the moments of the charge run to their end
  for (const [name, p] of Object.entries(A.V2_PRESETS)) { const d = fresh({ live: true }); const t = A.runV2Script(d, p.script); assert.ok(t < 59, `${name} ends (${t})`); }
});

test('the charged duel\'s fingerprint: its fixed script on the scene\'s duel gives V2_SIM_HASH, which the arena check replays in the page', () => {
  const s = A.sceneV2Duel('charge'), d = new C.ChargedDuel(s.data, s.tiers);
  A.runV2Fingerprint(d);
  assert.equal(d.hash(), A.V2_SIM_HASH);
  const tool = fs.readFileSync(path.join(ROOT, 'tools/arena-scene-check.mjs'), 'utf8');
  assert.ok(tool.includes(`const V2_HASH = '${A.V2_SIM_HASH}';`), 'the tool pins the same hash');
});

test('the version 2 reaches the arena and the play mode only through its flag; today\'s duels are untouched', () => {
  const app = fs.readFileSync(path.join(ROOT, 'src/arena/ArenaApp.ts'), 'utf8');
  assert.match(app, /else if \(this\.rules === 'v2'\) \{ const v = makeV2Duel\(/);
  const pa = fs.readFileSync(path.join(ROOT, 'src/ui/playArena.ts'), 'utf8');
  assert.match(pa, /const v2d = v2 \? v2SheetData\(sheet, ACTION_NAMES_EN, v2KitOf\(st\)\) : null;/);
  // a version 2 game's bout is the version 2's: its data and tiers come from the sheet, its kit the player's
  const st = G.makeV2(G.namedState('day2-afternoon'));
  const lab = L.botOutcome(st, 0.6);
  assert.ok(lab.winner === 'player' || lab.winner === 'opponent');
  // today's dynamic profiles and data unchanged by the version 2's (no shared object mutated)
  const before = JSON.stringify(P.DYN_PROFILES) + JSON.stringify(D.DYNAMIC_DATA);
  V.v2DuelData('marek', { seed: 1, playerName: 'a', opponentName: 'b' }); V.v2DuelData('vessa', { seed: 2, playerName: 'a', opponentName: 'b', input: 'keys' });
  assert.equal(JSON.stringify(P.DYN_PROFILES) + JSON.stringify(D.DYNAMIC_DATA), before);
});
