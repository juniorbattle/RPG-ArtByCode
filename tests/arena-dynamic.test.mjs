// The arena of the « tour par tour dynamique » (lot C2 of briefs/combat-system.md, journal Passe C2): which rules a page plays (the parameter,
// CB-10: absent = the arena of today), the keys of the four slots, the trial's settings in the address, today's clips on the new moments
// (§ 14: the preparation held on the first frame), what the HUD reads of the simulation (CB-6: both gauges, the « barre de break », the AP, the
// four skills and their cost; CB-4: the attacks locked through the opponent's whole sequence, guard and dodge kept), every scripted moment
// reaching its state, the HUD's words inside the embedded fonts, and the play mode's game under the new rules (its flag, CB-7's assistance).
// Oracles are written here from the specification's words, never read back from the code under test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from './load.mjs';

const V = await load('/src/arena/dynamicView.ts');
const { DYN_PRESETS, runDynScript } = await load('/src/arena/DynPresets.ts');
const { DynamicSim, DYNAMIC_DATA, runDynamicFingerprint } = await load('/src/combat/dynamic.ts');
const F = await load('/src/arena/FighterArt.ts');
const { DYN_TEXTS_FR, DYN_TEXTS_EN } = await load('/src/arena/DynamicHud.ts');
const { LATIN_RANGE } = await load('/src/ui/design/system.ts');
const { withRules } = await load('/src/ui/play.ts');
const { matchSheetFor, dynSheetView, sheetData } = await load('/src/combat/match.ts');
const { dynamicRules } = await load('/src/tournament/pool.ts');
const G = await load('/src/simulation/index.ts');

const D0 = DYNAMIC_DATA, A0 = D0.actions;
const q = (s) => new URLSearchParams(s);

test('the rules of a page: today\'s arena unless the parameter (or the play mode\'s game) asks for the new ones', () => {
  assert.equal(V.arenaRules(q('')), 'classic');
  assert.equal(V.arenaRules(q('scene=arena')), 'classic');
  assert.equal(V.arenaRules(q('scene=arena&combat=classic')), 'classic');
  assert.equal(V.arenaRules(q('scene=arena&combat=Dynamic')), 'classic');
  assert.equal(V.arenaRules(q('scene=arena&combat=dynamic')), 'dynamic');
  // a play-mode bout: the game's flag decides, never the address
  assert.equal(V.arenaRules(q('combat=dynamic'), {}), 'classic');
  assert.equal(V.arenaRules(q(''), { rules: 'dynamic' }), 'dynamic');
});

test('the keys: 1 light, 2 heavy, 3-6 the four slots in their order, A dodge, B guard; the gamepad\'s shoulders and triggers the slots', () => {
  const lo = ['t2', 'd1', 't3', 's1'], k = V.dynKeys(lo);
  assert.deepEqual([k['1'], k['2'], k['3'], k['4'], k['5'], k['6'], k.a, k.b, k.r, k[' ']], ['light', 'heavy', 't2', 'd1', 't3', 's1', 'dodge', 'guard', 'reset', 'pause']);
  assert.equal(k['7'], undefined);
  assert.ok(!Object.values(k).includes('t1') && !Object.values(k).includes('t4'), 'a skill left out of the slots has no key');
  const p = V.dynPad(D0.loadout);
  assert.deepEqual([p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7], p[8], p[9]], ['dodge', 'guard', 'light', 'heavy', ...D0.loadout, 'reset', 'pause']);
});

test('the trial\'s settings: each key changes its number and nothing else; out of range or unknown is refused; the data given stays as it was', () => {
  const before = JSON.stringify(D0);
  const same = V.tuneDyn(D0, ''); assert.notEqual(same, D0); assert.equal(JSON.stringify(same), before);
  assert.equal(JSON.stringify(V.tuneDyn(D0, null)), before);
  const cases = [
    ['apMax:4', (d) => { d.ap.max = 4; }], ['apStart:3', (d) => { d.ap.start = 3; }], ['apRegen:7', (d) => { d.ap.regen = 7; }], ['apRegen:0', (d) => { d.ap.regen = 0; }],
    ['gauge:150', (d) => { d.resist.max = 150; }], ['decay:3.5', (d) => { d.resist.decay = 3.5; }], ['stun:8', (d) => { d.resist.breakStun = 8; }],
    ['breakDmg:1.5', (d) => { d.resist.breakDamage = 1.5; }], ['guard:0.5', (d) => { d.guard.reduce = 0.5; }], ['level:5', (d) => { d.ai.level = 5; }],
    ['foeHp:5000', (d) => { d.fighters.marek.maxHp = 5000; }], ['renHp:3000', (d) => { d.fighters.ren.maxHp = 3000; }],
    ['apMax:3,apStart:2', (d) => { d.ap.max = 3; d.ap.start = 2; }],
  ];
  for (const [spec, tw] of cases) { const want = JSON.parse(before); tw(want); assert.deepEqual(V.tuneDyn(D0, spec), want, spec); }
  for (const bad of ['apMax:9', 'apMax:2', 'gauge:10', 'stun:20', 'breakDmg:3', 'level:0', 'level:6', 'apRegen:1', 'apRegen:-1', 'foo:1', 'gauge:', 'gauge', 'gauge:abc', 'apStart:5,apMax:4']) assert.throws(() => V.tuneDyn(D0, bad), /dyn:/, bad);
  assert.equal(JSON.stringify(D0), before);
  // the tuned data is playable: a duel starts with it
  const s = new DynamicSim(V.tuneDyn(D0, 'apStart:3,level:5,gauge:60'));
  assert.equal(s.f.ren.ap, 3); assert.deepEqual(s.restRange(), D0.restByLevel[5]);
});

test('today\'s clips on the new moments: the preparation holds the first frame; defence and support show their effect from the impact', () => {
  assert.equal(V.dynClip('skillOff'), 'skill'); assert.equal(V.dynClip('skillDef'), 'block'); assert.equal(V.dynClip('skillSup'), 'victory');
  for (const n of ['strike', 'heavy', 'block', 'dodge', 'hit', 'recover', 'ko', 'idle', 'ready']) assert.equal(V.dynClip(n), n);
  // the heavy attack (§ 14: 0 preparation held through the delay · 1 armed, its last 0.16 s · 2 strike until impact + 0.11 · 3 follow-through)
  const H = A0.heavy, ia = H.prep + H.impactAt, an = (t) => ({ name: 'heavy', t, dur: ia + H.follow, impactAt: ia, prep: H.prep });
  for (let t = 0; t < 1; t += 0.005) {
    const want = t < H.prep ? 0 : t < ia - 0.03 ? 1 : t < ia + 0.11 ? 2 : 3;
    assert.equal(V.dynClipFrame('heavy', 'heavy', 4, an(t)), want, `heavy at ${t.toFixed(3)}`);
  }
  // an offensive skill: the first frame (its glow) through the preparation, then today's frames around the impact
  for (const id of ['t1', 't2', 't3', 't4']) {
    const a = A0[id], i2 = a.prep + a.impactAt;
    for (let t = 0; t < i2 + 0.4; t += 0.01) {
      const want = t < a.prep ? 0 : F.clipFrame('skill', 3, t, i2);
      assert.equal(V.dynClipFrame('skillOff', 'skill', 3, { name: 'skillOff', t, dur: i2 + a.follow, impactAt: i2, prep: a.prep }), want, `${id} at ${t.toFixed(2)}`);
    }
  }
  for (const [src, clip, id] of [['skillDef', 'block', 'd1'], ['skillSup', 'victory', 's1']]) {
    const a = A0[id], i2 = a.prep + a.impactAt;
    for (let t = 0; t < i2 + 0.4; t += 0.01) assert.equal(V.dynClipFrame(src, clip, 2, { name: src, t, dur: i2 + a.follow, impactAt: i2, prep: a.prep }, 1.4), t < i2 ? 0 : 1, `${id} at ${t.toFixed(2)}`);
  }
  // without a preparation (the light attack, the opponent's blows, the loops): today's clipFrame, frame for frame
  for (const [clip, n, ia2, loop] of [['strike', 3, 0.2, 0], ['heavy', 4, 0.75, 0], ['hit', 2, 0, 0], ['ready', 2, 0, 1.7], ['recover', 2, 0, 2.5]]) {
    for (let t = 0; t < 2; t += 0.013) assert.equal(V.dynClipFrame(clip, clip, n, { name: clip, t, dur: 1, impactAt: ia2 }, loop), F.clipFrame(clip, n, t, ia2, loop), `${clip} ${t}`);
  }
  // every clip a duel asks for exists in today's sets (Ren, Marek, Vessa) once mapped
  const names = new Set(), sim = new DynamicSim();
  runDynamicFingerprint(sim, () => { for (const id of ['ren', 'marek']) names.add(sim.f[id].anim.name); });
  for (const p of Object.values(DYN_PRESETS)) { const s = new DynamicSim(); runDynScript(s, p.script, () => { s.drain(); for (const id of ['ren', 'marek']) names.add(s.f[id].anim.name); }); }
  for (const n of ['skillOff', 'skillDef', 'skillSup', 'heavy', 'strike', 'block', 'dodge', 'hit', 'recover', 'ko']) assert.ok(names.has(n), `the duels reach ${n}`);
  for (const n of names) {
    assert.ok(F.CLIPS.ren[V.dynClip(n)], `Ren has ${n}`);
    assert.ok(F.CLIPS.marek[V.dynClip(n)], `Marek has ${n}`);
    assert.ok(F.FOES.vessa.clips[V.dynClip(n)], `Vessa has ${n}`);
  }
});

test('the HUD\'s reading at every step of a duel: both gauges, the break, the AP, the slots and their cost, the attacks locked through a sequence', () => {
  const sim = new DynamicSim(), seen = new Set(), D = sim.D;
  let steps = 0;
  const check = () => {
    const m = V.dynHudModel(sim), R = sim.f.ren, M = sim.f.marek, inSeq = M.inSeq;
    steps++;
    const phase = sim.over ? 'over' : R.state === 'stunned' ? 'broken' : M.state === 'stunned' ? 'foeBroken' : inSeq ? 'defense' : 'open';
    assert.equal(m.phase, phase); seen.add(phase);
    assert.equal(m.ap, R.ap); assert.equal(m.apMax, D.ap.max);
    for (const [id, f] of [['ren', R], ['marek', M]]) {
      const g = m[id];
      assert.equal(g.hp, Math.ceil(f.hp)); assert.equal(g.maxHp, f.maxHp);
      assert.ok(Math.abs(g.hpPct - (100 * f.hp) / f.maxHp) <= 0.05 + 1e-9, `hp% ${id}`);
      if (f.broken && f.state === 'stunned') { assert.equal(g.resistPct, 100); assert.ok(g.broken); assert.ok(Math.abs(g.stunPct - (100 * f.stunLeft) / f.stunDur) <= 0.05 + 1e-9); seen.add(`broken:${id}`); }
      else { assert.ok(!g.broken); assert.ok(Math.abs(g.resistPct - (100 * f.resist) / D.resist.max) <= 0.05 + 1e-9, `resist% ${id} ${g.resistPct} ${f.resist}`); }
    }
    assert.deepEqual(m.slots.map((x) => [x.id, x.cost, x.family]), D.loadout.map((id) => [id, D.actions[id].apCost, D.actions[id].family]));
    const free = !sim.over && R.state !== 'down' && R.state !== 'stunned';
    for (const id of ['light', 'heavy', ...D.loadout]) {
      const cost = D.actions[id].apCost ?? 0, b = m.buttons[id];
      if (!free) assert.equal(b, 'off', id);
      else if (R.ap < cost) assert.equal(b, 'noap', id);
      // CB-4: through the opponent's whole sequence, gaps included, no attack and no skill is offered
      else if (inSeq) { assert.equal(b, 'locked', id); seen.add('locked'); }
      else if (R.state === 'idle' || R.state === 'acting' || R.state === 'recovering') assert.equal(b, 'on', id);
    }
    // the defence stays: the guard and the dodge are never locked by a sequence
    assert.notEqual(m.buttons.guard, 'locked'); assert.notEqual(m.buttons.dodge, 'locked');
    if (inSeq && free && R.state !== 'pushed') { assert.equal(m.buttons.guard, 'on'); if (R.ap >= 1) assert.equal(m.buttons.dodge, 'on'); seen.add('defend'); }
    // the preparation: the heavy attack and the skills, from their start to the end of their delay, as its share of the delay
    const a = R.state === 'acting' ? R.act : null;
    if (a && a.t < a.def.prep) { assert.equal(m.prep.action, a.def.id); assert.ok(Math.abs(m.prep.pct - (100 * a.t) / a.def.prep) <= 0.05 + 1e-9); seen.add(`prep:${a.def.kind}`); }
    else assert.equal(m.prep, null);
    if (R.ward) { assert.ok(Math.abs(m.ren.ward - R.ward.left) < 1e-9); seen.add('ward'); } else assert.equal(m.ren.ward, 0);
    if (R.boost) { assert.ok(Math.abs(m.ren.boost - R.boost.left) < 1e-9); seen.add('boost'); } else assert.equal(m.ren.boost, 0);
  };
  runDynamicFingerprint(sim, check);
  for (const p of Object.values(DYN_PRESETS)) { sim.reset(); runDynScript(sim, p.script, () => { sim.drain(); check(); }); }
  for (const k of ['open', 'defense', 'foeBroken', 'broken', 'over', 'broken:ren', 'broken:marek', 'locked', 'defend', 'prep:heavy', 'prep:skill', 'ward', 'boost']) assert.ok(seen.has(k), `reached ${k}`);
  assert.ok(steps > 30000);
});

test('every scripted moment reaches its state (the captures, the text measurement and the trial guide rely on them)', () => {
  const want = {
    calm: (s) => !s.inSequence() && s.f.ren.state === 'idle' && s.f.marek.aiWait > 1e6,
    charging: (s) => s.t >= 0.6,
    strike: (s, ev) => ev.some((e) => e.type === 'impact' && e.from === 'ren' && e.action === 'light' && e.result === 'hit'),
    prep: (s) => s.f.ren.act?.def.id === 'heavy' && s.f.ren.act.t < A0.heavy.prep,
    heavyRen: (s) => s.f.ren.act?.def.id === 'heavy' && s.f.ren.act.t >= A0.heavy.prep && !s.f.ren.act.impacted,
    skillPrep: (s) => s.f.ren.act?.def.id === 't4' && s.f.ren.act.t < A0.t4.prep,
    technique: (s, ev) => ev.some((e) => e.type === 'impact' && e.action === 't4' && e.result === 'hit'),
    ward: (s, ev) => !!s.f.ren.ward && ev.some((e) => e.type === 'effect' && e.family === 'defensive'),
    boost: (s, ev) => !!s.f.ren.boost && ev.some((e) => e.type === 'effect' && e.family === 'support'),
    combo: (s) => s.inSequence() && s.f.marek.seqLen === 3 && s.f.marek.seqIdx === 1,
    denied: (s, ev) => s.inSequence() && ev.some((e) => e.type === 'commandDenied' && e.who === 'ren' && e.why === 'defense'),
    window: (s) => { const i = s.incoming(); return !!i && i.windowOpen && i.action === 'm_heavy'; },
    block: (s, ev) => ev.some((e) => e.type === 'impact' && e.to === 'ren' && e.result === 'guarded' && e.action === 'm_slash'),
    guardHeavy: (s, ev) => ev.some((e) => e.type === 'impact' && e.to === 'ren' && e.result === 'guarded' && e.action === 'm_heavy') && s.f.ren.state !== 'stunned',
    dodge: (s, ev) => ev.some((e) => e.type === 'impact' && e.to === 'ren' && e.result === 'dodged'),
    impact: (s, ev) => ev.some((e) => e.type === 'impact' && e.to === 'ren' && e.result === 'hit' && e.action === 'm_heavy'),
    // the push of the scripted sequence, not of the opponent's own first one (at ai.start)
    pushed: (s, ev) => s.f.ren.state === 'pushed' && ev.some((e) => e.type === 'pushed' && e.action === 't4' && e.refund === A0.t4.apCost && e.t < D0.ai.start),
    foeBreak: (s, ev) => s.f.marek.state === 'stunned' && s.f.marek.broken && ev.some((e) => e.type === 'break' && e.who === 'marek'),
    broken: (s, ev) => s.f.ren.state === 'stunned' && s.f.ren.broken && ev.some((e) => e.type === 'break' && e.who === 'ren'),
    ko: (s) => s.over && s.f.marek.state === 'down',
    koRen: (s) => s.over && s.f.ren.state === 'down',
  };
  assert.deepEqual(Object.keys(DYN_PRESETS).sort(), Object.keys(want).sort());
  for (const [name, p] of Object.entries(DYN_PRESETS)) {
    const s = new DynamicSim(), ev = [];
    const end = runDynScript(s, p.script, () => ev.push(...s.drain()));
    assert.ok(end < 30, `${name} ends in time (${end})`);
    assert.ok(want[name](s, ev), name);
  }
});

test('the HUD\'s words, French and English, stay inside the embedded fonts\' subset', () => {
  const ranges = LATIN_RANGE.split(',').map((r) => r.trim().replace('U+', '').split('-').map((h) => parseInt(h, 16))).map(([a, b]) => [a, b ?? a]);
  const inside = (c) => ranges.some(([a, b]) => c >= a && c <= b);
  for (const T of [DYN_TEXTS_FR, DYN_TEXTS_EN]) {
    const words = [];
    for (const v of Object.values(T)) {
      if (typeof v === 'string') words.push(v);
      else if (typeof v === 'function') words.push(v(7), v('Marek'));
      else if (Array.isArray(v)) words.push(...v);
      else words.push(...Object.values(v));
    }
    for (const w of words) for (const ch of w) assert.ok(inside(ch.codePointAt(0)), `"${ch}" (U+${ch.codePointAt(0).toString(16)}) in "${w}"`);
  }
});

test('the play mode: &combat=dynamic marks a new game, its bouts take the discreet assistance (CB-7); without it the game of today', () => {
  const g0 = G.newGame(1842, 'Aster'), g1 = withRules(G.newGame(1842, 'Aster'), q('play=1&new=1&combat=dynamic'));
  assert.equal(G.hash(withRules(G.newGame(1842, 'Aster'), q('play=1&new=1'))), G.hash(g0));
  assert.equal(G.hash(withRules(G.newGame(1842, 'Aster'), q('play=1&new=1&combat=classic'))), G.hash(g0));
  assert.equal(g1.flags.combat, 'dynamic'); assert.ok(dynamicRules(g1)); assert.ok(!dynamicRules(g0));
  // the day 2 bout, scouted: today the full assistance; under the new rules the discreet one and a report for the preparation screen
  let st = G.namedState('day2-afternoon', 1842, 'Aster');
  st = { ...st, facts: [...st.facts, `scouted:${G.namedState('day2-afternoon', 1842, 'Aster').tournament.matches.find((m) => m.day === 2 && (m.a === 'player' || m.b === 'player')).b}`] };
  const sh = matchSheetFor(st);
  assert.equal(sh.assist, 'full'); assert.equal(sh.intel.length, 2);
  const v = dynSheetView(sh, 'Vessa Lark', sh.sides[1].fighters[0].id);
  assert.equal(v.assist, 'subtle'); assert.equal(v.intel.length, 2);
  assert.ok(!/floor/.test(v.intel.join(' ')), 'no floor telegraph promised');
  const un = matchSheetFor(G.namedState('day2-afternoon', 1842, 'Aster'));
  assert.deepEqual(dynSheetView(un, 'Vessa Lark', 'vessa'), { assist: 'subtle', intel: [] });
  // the sheet of today is untouched by the view
  assert.equal(JSON.stringify(sheetData(sh)), JSON.stringify(sheetData(matchSheetFor(st))));
});

test('the arena of today stays the default: its modules never load the new rules, and only the arena page picks them by its parameter', () => {
  const imports = (f) => [...fs.readFileSync(path.join(ROOT, f), 'utf8').matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);
  for (const f of ['CombatSim.ts', 'Presets.ts', 'ArenaHud.ts', 'FighterArt.ts', 'ArenaScene.ts', 'FloorUI.ts']) assert.ok(!imports(`src/arena/${f}`).some((i) => /combat\/(dynamic|bot)|DynamicHud|DynPresets|dynamicView/.test(i)), f);
  const app = fs.readFileSync(path.join(ROOT, 'src/arena/ArenaApp.ts'), 'utf8');
  // one place creates the new simulation, under the rules the page was given
  assert.equal(app.match(/new DynamicSim\(/g).length, 1);
  assert.match(app, /this\.rules = arenaRules\(opts\.params, opts\.match\);\s*if \(this\.rules === 'dynamic'\) this\.sim = this\.dyn = new DynamicSim\(/);
  assert.match(app, /else this\.sim = this\.classic = new CombatSim\(opts\.match\?\.data as CombatData \| undefined\);/);
});
