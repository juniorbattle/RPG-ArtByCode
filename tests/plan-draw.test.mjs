// Draw order of the visibility classes (planDraw, src/district/Visibility.ts): each framing or blend draws one prefix of the classes, so
// the prefix must hold every class it needs (else a visible part vanishes), and the order minimises the weighted triangles drawn.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';

const { planDraw, cfgMask, ALL_MASK } = await load('/src/district/Visibility.ts');

// the configurations the planner weighs (A / B / C and their blends count double, AGENTS.md "Visibility-driven generation")
const CONFIGS = [[['A'], 2], [['B'], 2], [['C'], 2], [['D'], 1], [['A', 'B'], 2], [['B', 'C'], 2], [['C', 'D'], 1], [['B', 'D'], 1]];

/** deterministic class histograms: n distinct non-zero need masks with triangle counts */
function histogram(n, seed) {
  let s = seed >>> 0;
  const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  const m = new Map([[ALL_MASK, 500 + Math.floor(rnd() * 5000)]]);
  while (m.size < n) m.set(1 + Math.floor(rnd() * ALL_MASK), 1 + Math.floor(rnd() * 3000));
  return m;
}

const hiFor = (order, cm) => { for (let k = order.length - 1; k >= 0; k--) if (order[k] & cm) return k + 1; return 0; };
const cost = (order, tris) => CONFIGS.reduce((c, [ids, w]) => c + w * order.slice(0, hiFor(order, cfgMask(ids))).reduce((t, m) => t + tris.get(m), 0), 0);

function assertSafe(tris, plan) {
  const masks = [...tris.keys()].filter((m) => m !== 0);
  assert.deepEqual([...plan.order].sort((a, b) => a - b), masks.sort((a, b) => a - b), 'order = a permutation of the non-zero masks');
  assert.equal(plan.classOfMask(0), plan.order.length, 'hidden parts (mask 0) are the class after the last');
  for (const [ids] of CONFIGS) {
    const cm = cfgMask(ids), hi = plan.hiOf(ids), name = ids.join('');
    for (const m of masks) if (m & cm) assert.ok(plan.classOfMask(m) < hi, `${name} draws class ${m.toString(2)} it needs`);
    assert.ok(hi === 0 || plan.order[hi - 1] & cm, `${name}: the prefix ends on a class it needs`);
    assert.equal(plan.drawnOf(ids), plan.order.slice(0, hi).reduce((t, m) => t + tris.get(m), 0), `${name}: drawnOf = the prefix's triangles`);
  }
  for (const [ids] of CONFIGS) assert.ok(plan.classOfMask(ALL_MASK) < plan.hiOf(ids), 'untracked geometry is drawn everywhere');
}

function permutations(a) {
  if (a.length <= 1) return [a];
  return a.flatMap((x, i) => permutations([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p]));
}

test('cfgMask: a framing covers its own set, a blend also covers the sets between its ends', () => {
  const bit = (s) => 1 << ['A', 'B', 'C', 'D', 'AB', 'BC', 'CD', 'BD'].indexOf(s);
  assert.equal(cfgMask(['D']), bit('D'));
  assert.equal(cfgMask(['A', 'B']), bit('A') | bit('B') | bit('AB'));
  assert.equal(cfgMask(['B', 'D']), bit('B') | bit('D') | bit('BD'));
  assert.equal(cfgMask(['A', 'B', 'C', 'D']), ALL_MASK);
});

test('few classes (exhaustive search): safe prefixes and the optimal weighted cost', () => {
  for (const [n, seed] of [[1, 1], [3, 2], [5, 3], [6, 4], [8, 5]]) {
    const tris = histogram(n, seed), plan = planDraw(tris);
    assertSafe(tris, plan);
    const best = Math.min(...permutations([...tris.keys()]).map((o) => cost(o, tris)));
    assert.equal(cost(plan.order, tris), best, `n=${n}: optimal`);
  }
});

test('many classes (local search): safe prefixes, a local optimum no worse than its most-shared-first start', () => {
  for (const [n, seed] of [[9, 6], [20, 7], [41, 8], [80, 9]]) {
    const tris = histogram(n, seed), plan = planDraw(tris), c0 = cost(plan.order, tris);
    assertSafe(tris, plan);
    const pop = (m) => { let c = 0; for (; m; m &= m - 1) c++; return c; };
    const start = [...tris.keys()].sort((a, b) => pop(b) - pop(a) || b - a);
    assert.ok(c0 <= cost(start, tris), `n=${n}`);
    // the search's move: take one class out and put it elsewhere; none may lower the cost of the order it returns
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const t = plan.order.slice(), [m] = t.splice(i, 1);
      t.splice(j, 0, m);
      if (cost(t, tris) < c0) assert.fail(`n=${n}: moving class ${i} to ${j} lowers the cost`);
    }
  }
});

test('deterministic: same classes, same order, whatever the insertion order; mask 0 is ignored', () => {
  for (const [n, seed] of [[6, 10], [30, 11]]) {
    const tris = histogram(n, seed), a = planDraw(tris).order;
    const shuffled = new Map([[0, 999], ...[...tris].reverse()]);
    assert.deepEqual(planDraw(shuffled).order, a);
    assert.deepEqual(planDraw(tris).order, a);
  }
});
