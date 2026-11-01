// The duel's own effects behind the DEV parameter `fx=new` (journal Passe FX1): the painters are pure, the frames hold to the technique (dither, never
// transparency; the page's ramp only; the x3 grid's cells), the runtime plays the right effect on each event of the duel, and nothing of it reaches
// the production bundle's path. Oracles are written here from the brief, not read from the code.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from './load.mjs';

const P = await load('/src/lab/fxPaint.ts');
const T = await load('/src/ui/design/tokens.ts');

const TIMES = ['night', 'morning', 'midday', 'afternoon'];
const ramp = (t) => P.fxRamp(T.TONES[t], t !== 'night');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
/** every frame of every effect: [id, level, frame, cell] */
function* frames(R, seed = 1842) {
  for (const [id, d] of Object.entries(P.FX)) for (let l = 1; l <= d.levels; l++) for (let f = 0; f < d.ms.length; f++) yield [id, l, f, d.paint(f, seed, R, l)];
}

test('at most six effects, four to eight frames each, the charge in three levels', () => {
  const ids = Object.keys(P.FX);
  assert.ok(ids.length <= 6, `${ids.length} effects`);
  assert.deepEqual([...ids].sort(), ['break', 'charge', 'guard', 'hitHeavy', 'hitLight', 'ko']);
  for (const [id, d] of Object.entries(P.FX)) assert.ok(d.ms.length >= 4 && d.ms.length <= 8, `${id}: ${d.ms.length} frames`);
  assert.equal(P.FX.charge.levels, 3);
  for (const id of ids.filter((x) => x !== 'charge')) assert.equal(P.FX[id].levels, 1);
});

test('a painter is a pure function of (frame, seed, ramp): same bytes, Math.random never drawn; another seed differs', () => {
  const real = Math.random;
  Math.random = () => { throw new Error('Math.random drawn'); };
  try {
    const R = ramp('night'), a = [...frames(R)].map(([, , , c]) => sha(c.rgba)), b = [...frames(R)].map(([, , , c]) => sha(c.rgba));
    assert.deepEqual(a, b);
    const list = [...frames(R)], other = [...frames(R, 7719)].map(([, , , c]) => sha(c.rgba));
    // each effect's flight comes from the seed: at least two of its frames change with it
    for (const id of Object.keys(P.FX)) assert.ok(list.filter(([x], i) => x === id && a[i] !== other[i]).length >= 2, `${id} ignores its seed`);
  } finally { Math.random = real; }
});

test('a frame is drawn, on its own cell, and never empty', () => {
  for (const t of TIMES) for (const [id, l, f, c] of frames(ramp(t))) {
    assert.equal(c.w, P.FX[id].w); assert.equal(c.h, P.FX[id].h);
    let core = 0;
    for (let i = 3; i < c.rgba.length; i += 4) if (c.rgba[i] >= 254) core++;
    assert.ok(core > 0, `${t} ${id}.${l}.${f}: no core texel`);
  }
});

test('dither, never transparency: a texel is a core, a matte core, a glow or nothing', () => {
  for (const t of TIMES) for (const [id, l, f, c] of frames(ramp(t))) for (let i = 0; i < c.rgba.length; i += 4) {
    const a = c.rgba[i + 3];
    assert.ok(a === 0 || a === 254 || a === 255, `${t} ${id}.${l}.${f}: alpha ${a}`);
  }
});

test('the colours are the tone\'s tokens, the night\'s warm accent is the amber alone', () => {
  const hex = (r, g, b) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
  for (const t of TIMES) {
    const tone = T.TONES[t], allowed = new Set(Object.values(tone).filter((v) => v.startsWith('#')));
    for (const [id, l, f, c] of frames(ramp(t))) for (let i = 0; i < c.rgba.length; i += 4) {
      if (!c.rgba[i + 3] && !(c.rgba[i] + c.rgba[i + 1] + c.rgba[i + 2])) continue;
      const h = hex(c.rgba[i], c.rgba[i + 1], c.rgba[i + 2]);
      assert.ok(allowed.has(h), `${t} ${id}.${l}.${f}: ${h} is no token`);
    }
  }
  const N = T.TONES.night, night = new Set();
  for (const [, , , c] of frames(ramp('night'))) for (let i = 0; i < c.rgba.length; i += 4) if (c.rgba[i + 3] || c.rgba[i] + c.rgba[i + 1] + c.rgba[i + 2]) night.add(hex(c.rgba[i], c.rgba[i + 1], c.rgba[i + 2]));
  for (const warm of [N.gold, N.goldHi, N.goldLo, N.parch, N.parchLo]) assert.ok(!night.has(warm), `${warm} at night`);
  assert.ok(night.has(N.amber) && night.has(N.amberHi), 'the amber is there');
});

test('the ink closes the solid shapes, day and night, never a lone texel nor the matte dust', () => {
  for (const t of ['night', 'midday']) {
    const R = ramp(t), inks = (c, i) => c.rgba[i + 3] === 255 && c.rgba[i] === R.ink[0] && c.rgba[i + 1] === R.ink[1] && c.rgba[i + 2] === R.ink[2];
    const inkOf = (c) => { let n = 0; for (let i = 0; i < c.rgba.length; i += 4) if (inks(c, i)) n++; return n; };
    assert.ok(inkOf(P.paintHitHeavy(1, 1842, R)) > 40, `${t}: the star is closed`);
    // the heavy blow's last frame is a dithered ring and sparks: no ink would outweigh them
    assert.ok(inkOf(P.paintHitHeavy(4, 1842, R)) <= 3, `${t}: a dying ring takes no ink`);
    // the dust's last frames: matte, no ink around it
    const ko = P.paintKo(6, 1842, R), matte = [...Array(ko.rgba.length / 4).keys()].filter((i) => ko.rgba[i * 4 + 3] === 254).length;
    assert.ok(matte > 0, 'the dust is matte'); assert.equal(inkOf(ko), 0, `${t}: the dust takes no ink`);
  }
});

test('by day what is dying stays light: no amberLo, no deep blue on the sand', () => {
  for (const t of ['morning', 'midday', 'afternoon']) {
    const tone = T.TONES[t], R = ramp(t), dark = [tone.amberLo, tone.blue0, tone.blue1, tone.goldLo].map((h) => T.rgb(h).join());
    for (const [id, l, f, c] of frames(R)) for (let i = 0; i < c.rgba.length; i += 4) {
      if (!c.rgba[i + 3] && !(c.rgba[i] + c.rgba[i + 1] + c.rgba[i + 2])) continue;
      assert.ok(!dark.includes([c.rgba[i], c.rgba[i + 1], c.rgba[i + 2]].join()), `${t} ${id}.${l}.${f}`);
    }
  }
});

test('the dust goes in no pattern: its texels leave no 4 x 4 grid', () => {
  const R = ramp('midday'), c = P.paintKo(5, 1842, R), byCell = new Array(16).fill(0);
  for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) if (c.rgba[(y * c.w + x) * 4 + 3] === 254) byCell[(y & 3) * 4 + (x & 3)]++;
  const total = byCell.reduce((a, b) => a + b, 0), most = Math.max(...byCell), least = Math.min(...byCell);
  assert.ok(total > 100); assert.ok(least > 0 && most / least < 2, `the dust's texels by Bayer cell: ${byCell}`);
});

test('no frame ends empty, and the last frame of a blow is small: the orphans are cut', () => {
  const R = ramp('night'), core = (c) => { let n = 0; for (let i = 3; i < c.rgba.length; i += 4) if (c.rgba[i] >= 254) n++; return n; };
  for (const id of ['hitLight', 'hitHeavy', 'break']) {
    const d = P.FX[id], n = d.ms.length, last = core(d.paint(n - 1, 1842, R)), peak = Math.max(...d.ms.map((_, f) => core(d.paint(f, 1842, R))));
    assert.ok(last >= 12, `${id}: ${last} texels in its last frame`); assert.ok(last < peak * 0.7, `${id}: ${last} of ${peak}`);
  }
});

test('the charge\'s aura loops: its four frames turn back on themselves, a level is more than the one below', () => {
  const R = ramp('night'), cover = (c) => { let n = 0; for (let i = 3; i < c.rgba.length; i += 4) if (c.rgba[i] >= 254) n++; return n; };
  const [a, b, c, d] = [2, 3, 4, 5].map((f) => sha(P.paintCharge(f, 1842, R, 2).rgba));
  assert.equal(new Set([a, b, c, d]).size, 4);
  // the motes rise a fixed 8 rows a frame, from the last frame back to the first too: no jump at the seam (read on the texels, above the ground ring)
  const motes = (f) => { const s = new Set(), c = P.paintCharge(f, 1842, R, 1); for (let y = 0; y < 136; y++) for (let x = 0; x < c.w; x++) if (c.rgba[(y * c.w + x) * 4 + 3] >= 254) s.add(y * c.w + x); return s; };
  const fit = (from, to, rows) => { const A = motes(from), B = motes(to), w = P.FX.charge.w; let n = 0; for (const k of A) if (B.has(k - rows * w) || B.has(k - rows * w - 1) || B.has(k - rows * w + 1)) n++; return n / A.size; };
  const best = (from, to) => { let b = 0, s = 0; for (let r = 1; r < 32; r++) { const q = fit(from, to, r); if (q > b) { b = q; s = r; } } return s; };
  for (const [from, to] of [[2, 3], [3, 4], [4, 5], [5, 2]]) assert.equal(best(from, to), 8, `frames ${from} to ${to}`);
  const lv = [1, 2, 3].map((l) => cover(P.paintCharge(3, 1842, R, l)));
  assert.ok(lv[0] < lv[1] && lv[1] < lv[2], `coverage by level: ${lv}`);
  // level 1 stays cold, the amber comes at level 2
  const hasAmber = (l) => { const c = P.paintCharge(3, 1842, R, l); const hot = R.hot[1]; for (let i = 0; i < c.rgba.length; i += 4) if (c.rgba[i + 3] && c.rgba[i] === hot[0] && c.rgba[i + 1] === hot[1] && c.rgba[i + 2] === hot[2]) return true; return false; };
  assert.equal(hasAmber(1), false); assert.equal(hasAmber(2), true);
});

test('the tiers map to the charge\'s levels', () => {
  // the light attack has no aura, the heavy is level 1; four skills: two at level 2, two at level 3
  assert.deepEqual([0, 1, 2, 3, 4, 5].map((i) => P.chargeLevel(i, 6)), [0, 1, 2, 2, 3, 3]);
  // two skills: one of each; one skill: level 2; no skill: only the heavy
  assert.deepEqual([0, 1, 2, 3].map((i) => P.chargeLevel(i, 4)), [0, 1, 2, 3]);
  assert.deepEqual([0, 1, 2].map((i) => P.chargeLevel(i, 3)), [0, 1, 2]);
  assert.deepEqual([0, 1].map((i) => P.chargeLevel(i, 2)), [0, 1]);
  assert.equal(P.chargeLevel(-1, 6), 0);
});

test('the atlas holds every frame in the texture WebGL2 guarantees, each cell apart and its bytes there', () => {
  for (const t of TIMES) {
    const A = P.paintFxAtlas(ramp(t), 1842);
    assert.ok(A.width <= 2048 && A.height <= 2048, `${A.width} x ${A.height}`);
    assert.equal(A.rgba.length, A.width * A.height * 4);
    const seen = [];
    for (const [key, [x, y, w, h]] of A.cells) {
      assert.ok(x >= 0 && y >= 0 && x + w <= A.width && y + h <= A.height, key);
      for (const [a, b, c, d] of seen) assert.ok(x + w <= a || a + c <= x || y + h <= b || b + d <= y, `${key} overlaps`);
      seen.push([x, y, w, h]);
    }
    for (const [id, l, f, c] of frames(ramp(t))) {
      const [x, y, w] = A.cells.get(P.fxKey(id, f, l));
      for (const j of [0, Math.floor(c.h / 2), c.h - 1]) {
        const a = A.rgba.subarray(((y + j) * A.width + x) * 4, ((y + j) * A.width + x + w) * 4), b = c.rgba.subarray(j * w * 4, (j + 1) * w * 4);
        assert.deepEqual(Buffer.from(a), Buffer.from(b), `${t} ${id}.${l}.${f} row ${j}`);
      }
    }
  }
});

test('the runtime is out of production: ArenaApp reaches it only behind import.meta.env.DEV, the painters import nothing of a third party', () => {
  const app = fs.readFileSync(path.join(ROOT, 'src/arena/ArenaApp.ts'), 'utf8');
  const lines = app.split(/\r?\n/).filter((l) => /fxTrial|combatFx/.test(l) && !/^\s*(\/\*\*|\/\/|private declare)/.test(l));
  assert.ok(lines.length >= 4);
  for (const l of lines) assert.match(l, /import\.meta\.env\.DEV/, l);
  for (const f of ['src/lab/fxPaint.ts', 'src/lab/combatFx.ts']) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    assert.ok(!/pixelfx/i.test(src), `${f} names a third party`);
    assert.ok(!/Math\.random\(/.test(src), `${f} draws Math.random`);
    for (const m of src.matchAll(/from '([^']+)'/g)) assert.ok(m[1] === 'three' || m[1].startsWith('.'), `${f} imports ${m[1]}`);
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  assert.ok(!Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).some((d) => /fx/i.test(d)), 'no effects package');
});
