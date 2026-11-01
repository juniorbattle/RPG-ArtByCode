// The duel's effects behind the DEV parameter `fx=new`, in the manner of RPGThreeJS (journal Passe FX2): the recipes are data the tests read here, the
// director plays them on a recording engine; the engine's materials keep the scene's mask, and nothing of it reaches the production path. Oracles are
// written here from the operator's decisions, not read from the code.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from './load.mjs';

const R = await load('/src/lab/fx/fxRecipes.ts');
const D = await load('/src/lab/fx/FxDirector.ts');
const K = await load('/src/combat/skillbook.ts');
const P = await load('/src/lab/fx/fxPalettes.ts');
const THREE = await load('three');

const STEP_KINDS = new Set(['slash', 'star', 'burst', 'ring', 'pillar', 'streak', 'bolt', 'shards', 'dome', 'orb', 'motes', 'smoke', 'glow', 'decal', 'light', 'converge', 'orbit', 'fissure', 'shake', 'flash', 'slowmo', 'speedLines', 'punch']);
const recipes = Object.values(R.RECIPES);

/** an engine that records what the director asks of it, run at once */
function recorder() {
  const calls = [], hooks = {};
  for (const h of ['shake', 'flash', 'slowmo', 'speedLines', 'punch', 'light']) hooks[h] = (...a) => calls.push([h, ...a]);
  const engine = new Proxy({ hooks, palette: (e) => P.FX_PALETTES[e], after: (_t, fn) => fn() }, {
    get: (t, k) => (k in t ? t[k] : (...a) => { calls.push([k, ...a]); return undefined; }),
  });
  return { engine, calls };
}
const unit = (x) => ({ position: new THREE.Vector3(x, 0, 0), height: 2.75 });

test('every recipe is well formed: known steps, known colours, a positive length, every step before its end', () => {
  assert.ok(recipes.length >= 30, `${recipes.length} recipes`);
  for (const r of recipes) {
    assert.equal(R.RECIPES[r.id], r);
    assert.ok(P.FX_PALETTES[r.element], `${r.id}: ${r.element}`);
    assert.ok(r.duration > 0 && r.steps.length > 0, r.id);
    for (const s of r.steps) {
      assert.ok(STEP_KINDS.has(s.kind), `${r.id}: ${s.kind}`);
      assert.ok(s.at >= 0 && s.at < r.duration, `${r.id}: ${s.kind} at ${s.at}`);
      if (s.element) assert.ok(P.FX_PALETTES[s.element], `${r.id}: ${s.element}`);
    }
  }
});

test('every action of the duel plays its own recipe: each skill of the book and each rival\'s has one, the plain blows each side theirs', () => {
  for (const id of [...Object.keys(K.SKILL_BOOK), 't1', 't2', 't3', 't4', 'd1', 's1']) assert.ok(R.RECIPES[id], `no recipe for ${id}`);
  const rivals = ['m_ironfall', 'm_bulwark', 'm_resolve', 'm_lunge', 'm_tempo', 'm_shoulder', 'm_brace', 'm_riposte', 'm_gild', 'm_smite', 'm_aegis', 'm_prayer', 'm_wild', 'm_grit', 'm_cleave', 'm_roar', 'm_hide'];
  for (const id of rivals) assert.ok(R.RECIPES[id], `no recipe for ${id}`);
  assert.equal(R.blowRecipe('light', 'light', 'ren').id, 'light');
  assert.equal(R.blowRecipe('heavy', 'heavy', 'ren').id, 'heavy');
  assert.equal(R.blowRecipe('m_slash', 'light', 'marek').id, 'm_slash');
  // an action with no recipe falls back on the plain blow of its weight and side
  assert.equal(R.blowRecipe('unknown', 'heavy', 'marek').id, 'm_heavy');
  assert.equal(R.blowRecipe('unknown', 'light', 'ren').id, 'light');
  assert.equal(R.effectRecipe('unknown', 'defensive').id, 'd1');
  assert.equal(R.effectRecipe('unknown', 'support').id, 's1');
});

test('slow motion on the K.O. only: the time of the duel never stops', () => {
  assert.deepEqual(recipes.filter((r) => r.steps.some((s) => s.kind === 'slowmo')).map((r) => r.id), ['ko']);
});

test('a shock ring appears once, on the blow: nothing circular fires after it', () => {
  for (const r of recipes) {
    const blow = r.steps.find((s) => s.kind === 'star')?.at ?? 0;
    assert.deepEqual(r.steps.filter((s) => s.kind === 'ring' && !s.p?.inward && s.at > blow + 0.16), [], r.id);
    assert.ok(r.steps.filter((s) => s.kind === 'ring' && !s.p?.inward).length <= 1, `${r.id}: two rings`);
  }
});

test('the night\'s accent: Ren\'s blows and the opponent\'s stay in the amber, a guard stays cold', () => {
  assert.equal(R.RECIPES.light.element, 'steel'); assert.equal(R.RECIPES.heavy.element, 'steel');
  assert.equal(R.RECIPES.m_slash.element, 'fire'); assert.equal(R.RECIPES.m_heavy.element, 'fire');
  assert.equal(R.RECIPES.guard.element, 'sky'); assert.equal(R.RECIPES.guardHeavy.element, 'sky');
});

test('the charge grows with its level, and the tiers map to its levels', () => {
  const particles = (id) => R.RECIPES[id].steps.filter((s) => s.kind === 'converge').reduce((n, s) => n + s.p.count, 0);
  assert.ok(particles('charge1') < particles('charge2') && particles('charge2') < particles('charge3'));
  assert.ok(R.RECIPES.charge3.steps.some((s) => s.kind === 'pillar') && !R.RECIPES.charge1.steps.some((s) => s.kind === 'pillar'));
  assert.deepEqual([0, 1, 2, 3, 4, 5].map((i) => R.chargeLevel(i, 6)), [0, 1, 2, 2, 3, 3]);
  assert.deepEqual([0, 1, 2, 3].map((i) => R.chargeLevel(i, 4)), [0, 1, 2, 3]);
  assert.deepEqual([0, 1, 2].map((i) => R.chargeLevel(i, 3)), [0, 1, 2]);
  assert.equal(R.chargeLevel(-1, 6), 0);
});

test('the director places a recipe on the fighters: the chest of the target, a cut mirrored with the blow, the contact before the guard', () => {
  const play = (id, from, to, contact) => { const { engine, calls } = recorder(); new D.FxDirector(engine).play(R.RECIPES[id], { source: unit(from), target: unit(to), contact }); return calls; };
  const right = play('light', -2, 2), left = play('m_slash', 2, -2);
  const star = right.find((c) => c[0] === 'impactStar'), cutR = right.find((c) => c[0] === 'slash'), cutL = left.find((c) => c[0] === 'slash');
  assert.equal(star[1].x, 2); assert.ok(Math.abs(star[1].y - 2.75 * 0.55) < 1e-9);
  assert.equal(cutR[3].flip, false); assert.equal(cutL[3].flip, true);
  // the contact stands before the guard, on the attacker's side, whichever side it is
  const g = play('guard', 2, -2, 0.7).find((c) => c[0] === 'impactStar'), h = play('guard', -2, 2, 1).find((c) => c[0] === 'impactStar');
  assert.ok(Math.abs(g[1].x - (-2 + 0.7)) < 1e-9); assert.ok(Math.abs(h[1].x - (2 - 1)) < 1e-9);
  // sparks are thrown on along the blow, and back from a guard
  assert.ok(right.find((c) => c[0] === 'burst')[3].direction.x > 0); assert.ok(left.find((c) => c[0] === 'burst')[3].direction.x < 0);
  assert.ok(play('guard', -2, 2, 1).find((c) => c[0] === 'burst')[3].direction.x < 0);
  // the light takes the palette's colour
  assert.equal(right.find((c) => c[0] === 'light')[2], P.FX_PALETTES.steel.light);
});

test('the engine keeps the scene\'s mask and the mirror pass: no raw blending, no THREE light, no flames nor sheets', () => {
  const src = fs.readFileSync(path.join(ROOT, 'src/lab/fx/FxEngine.ts'), 'utf8');
  assert.ok(!/THREE\.(Additive|Normal)Blending/.test(src), 'raw blending writes the alpha the DOF reads');
  assert.ok(!/new THREE\.(Point|Spot|Directional)Light/.test(src), 'a THREE light touches none of this renderer\'s shaders');
  assert.ok(!/MeshStandardMaterial/.test(src), 'a lit material stays black here');
  assert.ok(/LAYER_NOREFLECT/.test(src));
  assert.ok(!/this\.root\.add\((?!object\))/.test(src), 'every effect goes through put()');
  assert.ok(!/Math\.random\(/.test(src));
  // one NaN pixel blacks the whole frame through the bloom: the dome's two traps, atan(0, 0) at its apex and a negative base under pow
  assert.ok(!/atan\(vP\.z, vP\.x\)/.test(src), 'atan(0, 0)');
  assert.ok(/pow\(max\(0\.0, 1\.0 - abs\(dot\(vN, vV\)\)\)/.test(src), 'pow of a negative base');
});

test('a blow leaves the one who takes it readable: no star, ring or cut wider than the figure allows', () => {
  for (const r of recipes) for (const s of r.steps) {
    if (s.kind === 'star') assert.ok(s.p.size <= 3.4, `${r.id}: star ${s.p.size}`);
    if (s.kind === 'slash') assert.ok(s.p.size <= 4.4, `${r.id}: cut ${s.p.size}`);
    if (s.kind === 'ring') assert.ok(s.p.radius <= 3.2, `${r.id}: ring ${s.p.radius}`);
    if (s.kind === 'pillar') assert.ok(s.p.radius <= 0.45, `${r.id}: pillar ${s.p.radius}`);
  }
});

test('the lab is out of production: ArenaApp reaches it only behind import.meta.env.DEV, no effects package', () => {
  const app = fs.readFileSync(path.join(ROOT, 'src/arena/ArenaApp.ts'), 'utf8');
  const lines = app.split(/\r?\n/).filter((l) => /fxTrial|combatFx/.test(l) && !/^\s*(\/\*\*|\/\/|private declare)/.test(l));
  assert.ok(lines.length >= 5);
  for (const l of lines) assert.match(l, /import\.meta\.env\.DEV/, l);
  assert.ok(!fs.existsSync(path.join(ROOT, 'src/lab/fxPaint.ts')), 'the pixel effects are gone');
  for (const f of ['src/lab/combatFx.ts', 'src/lab/fx/FxEngine.ts', 'src/lab/fx/FxDirector.ts', 'src/lab/fx/fxRecipes.ts', 'src/lab/fx/fxPalettes.ts']) {
    for (const m of fs.readFileSync(path.join(ROOT, f), 'utf8').matchAll(/from '([^']+)'/g)) assert.ok(m[1] === 'three' || m[1].startsWith('.'), `${f} imports ${m[1]}`);
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  assert.ok(!Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).some((d) => /fx/i.test(d)));
});
