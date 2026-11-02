// The casting's citizens (journal Passe CA6, the operator's « Cuire »): five walkers of the crowd cut out of the NPC 01-16 sheet, the first cast's own sheet and chain (its 1st,
// 3rd and 4th views, one joint 64-colour palette), so they keep the clarity the operator asked of the first generations. Children stand lower than adults: a coarser pitch, the
// same texel on screen. The walks are the first cast's, one recipe per costume (6 frames at 7.5 frames / s, one step = 3 frames; the arms stay still, the operator's note of
// 2026-10-18): `legs`, the guard's (the body bobs 2 rows, each leg a rigid part drawn behind it); `dress`, the artisan's (the dress bobs 1 row, the boots move under its hem);
// `gown`, a dress to the ground and no foot to see (the skirt sways and its hem rises over the swinging leg). In profile a leg leans from its top row, its boot rigid, the far
// one a darker copy. `build-character.mjs` drives it like any rig.
import * as R from '../../../../tools/art-lab/rig-engine.mjs';

const SHEET = 'art-lab/characters/reference/sources/merchant-district-night-npc-01-16.webp';

/** thin vertical strands below row `from`, the reconstruction's closing tails between the legs and under the hem; then detached islands of fewer than 6 texels */
function cleanStrands(v, from = 60) {
  const o = R.clone(v);
  for (let x = 1; x < v.W - 1; x++) for (let y = from; y < v.H; y++) {
    if (!R.opaque(v, x, y) || R.opaque(v, x - 1, y) || R.opaque(v, x + 1, y)) continue;
    let e = y; while (e + 1 < v.H && R.opaque(v, x, e + 1) && !R.opaque(v, x - 1, e + 1) && !R.opaque(v, x + 1, e + 1)) e++;
    if (e > y) for (let k = y; k <= e; k++) R.put(o, x, k, null);
    y = e;
  }
  const seen = new Uint8Array(o.W * o.H);
  for (let y = 0; y < o.H; y++) for (let x = 0; x < o.W; x++) {
    if (seen[y * o.W + x] || !R.opaque(o, x, y)) continue;
    const comp = [], st = [[x, y]]; seen[y * o.W + x] = 1;
    while (st.length) { const [a, b] = st.pop(); comp.push([a, b]); for (const [p, q] of [[a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]]) if (p >= 0 && q >= 0 && p < o.W && q < o.H && !seen[q * o.W + p] && R.opaque(o, p, q)) { seen[q * o.W + p] = 1; st.push([p, q]); } }
    if (comp.length < 6) for (const [a, b] of comp) R.put(o, a, b, null);
  }
  return o;
}
/** one-texel slits from row `from` down: they open into holes once the parts move apart; filled with the darker neighbour */
function closeSlits(v, from = 56) {
  const o = R.clone(v);
  for (let y = from; y < v.H; y++) for (let x = 1; x < v.W - 1; x++) {
    if (R.opaque(v, x, y) || !R.opaque(v, x - 1, y) || !R.opaque(v, x + 1, y)) continue;
    const a = R.get(v, x - 1, y), b = R.get(v, x + 1, y);
    R.put(o, x, y, R.oklab(a)[0] <= R.oklab(b)[0] ? a : b);
  }
  return o;
}
/** the sheet's ground shadow: the dark texels reached from outside through dark texels alone, in the rows from `from` down; the ring next to what stays is kept, the figure's outline */
function noGround(v, from = 74, dark = 0.235) {
  const isDark = (x, y) => { const c = R.get(v, x, y); return !!c && R.oklab(c)[0] < dark; }, gone = new Uint8Array(v.W * v.H), st = [];
  const near = (x, y) => [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].filter(([a, b]) => a >= 0 && b >= from && a < v.W && b < v.H);
  for (let y = from; y < v.H; y++) for (let x = 0; x < v.W; x++) if (isDark(x, y) && near(x, y).some(([a, b]) => !R.opaque(v, a, b))) { gone[y * v.W + x] = 1; st.push([x, y]); }
  while (st.length) { const [x, y] = st.pop(); for (const [a, b] of near(x, y)) if (!gone[b * v.W + a] && isDark(a, b)) { gone[b * v.W + a] = 1; st.push([a, b]); } }
  const o = R.clone(v);
  for (let y = from; y < v.H; y++) for (let x = 0; x < v.W; x++) if (gone[y * v.W + x] && !near(x, y).some(([a, b]) => R.opaque(v, a, b) && !gone[b * v.W + a])) R.put(o, x, y, null);
  return o;
}
/** soles on the foot row and the feet (the lowest three rows) centred on the anchor column 31.5 */
function align(v) {
  const b = R.bottom(v); let x0 = 64, x1 = 0;
  for (let y = b - 2; y <= b; y++) for (let x = 0; x < v.W; x++) if (R.opaque(v, x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
  return R.shift(v, Math.round(31.5 - (x0 + x1) / 2), R.FOOT - b);
}

const BOB = { legs: [2, 0, 1, 2, 0, 1], dress: [1, 0, 0, 1, 0, 0] }, SWING = { legs: [3, 5, 3], dress: [1, 3, 1] };
const SHIFT = [0, 1, 1, 0, -1, -1], HEM = [-1, -2, -2, 1, 2, 2];   // the weight over the planted foot; the hem lags behind it
/** the dock worker's ankle in profile (+ = forward) */
const CYCLE = [{ x: 7, lift: 0 }, { x: 2.3, lift: 0 }, { x: -2.3, lift: 0 }, { x: -7, lift: 1 }, { x: -1, lift: 3 }, { x: 4.5, lift: 1 }];

/** a leg drawn standing above the foot row is set down on it, idle and walk alike (else the planted foot hops a row at every step); its top row is repeated over the rows this opens */
function setDown(v, o) {
  let im = v;
  for (const j of [0, 1]) {
    const inLeg = (x, y) => y >= o.crotch && (j ? x > o.split : x <= o.split), l = R.cut(im, inLeg), down = R.FOOT - R.bottom(l), top = R.top(l);
    if (down <= 0) continue;
    const s = R.shift(l, 0, down);
    for (let x = 0; x < l.W; x++) if (R.opaque(l, x, top)) for (let g = 0; g < down; g++) R.put(s, x, top + g, R.get(l, x, top));
    im = R.over(R.erase(im, inLeg), s);
  }
  return im;
}
/** near-black areas inside the legs (the first cast's lesson: they read as holes, Pass 4A-tervicies): from `from` down, a texel in the darkest tones whose four neighbours are opaque takes the palette colour one step lighter; the outline, on the silhouette's edge, stays */
function liftLegs(v, from) {
  const up = R.darkener(R.paletteOf(v), -0.1), o = R.clone(v);
  for (let y = from; y < v.H - 1; y++) for (let x = 1; x < v.W - 1; x++) { const c = R.get(v, x, y); if (c && R.oklab(c)[0] < 0.27 && R.opaque(v, x - 1, y) && R.opaque(v, x + 1, y) && R.opaque(v, x, y - 1) && R.opaque(v, x, y + 1)) R.put(o, x, y, up(c)); }
  return o;
}
/** the guard's walk: above `crotch` the body, below it two rigid legs planted or lifted; `stride` scales the lift (a child's step) */
function legsFrontBack(v, o, i, stride) {
  const swing = i < 3 ? 1 : 0, k = i % 3;
  const body = R.shift(R.shear(R.cut(v, (x, y) => y < o.crotch), o.crotch - 12, o.crotch, HEM[i]), SHIFT[i], BOB.legs[i]);
  const legs = [0, 1].map((j) => R.shift(R.cut(v, (x, y) => y >= o.crotch && (j ? x > o.split : x <= o.split)), j === swing && k === 1 ? (j ? -1 : 1) : 0, j === swing ? -Math.round(SWING.legs[k] * stride) : 0));
  return R.over(...legs, body);
}
/** the artisan's walk: the dress down to `hem`, the boots under it; a gap between the hem and a boot takes the boot's top row */
function dressFrontBack(v, o, i) {
  const swing = i < 3 ? 0 : 1, k = i % 3, half = swing ? (x) => x > o.split : (x) => x <= o.split;
  const dress = R.movePart(R.cut(v, (x, y) => y <= o.hem), (x, y) => y >= o.hem - 7 && half(x), 0, k === 1 ? -1 : 0, swing ? -1 : 1, 0);
  const body = R.shift(R.shear(dress, o.hem - 15, o.hem, HEM[i]), SHIFT[i], BOB.dress[i]);
  const boots = [0, 1].map((j) => { const b = R.cut(v, (x, y) => y > o.hem && (j ? x > o.split : x <= o.split)); return R.shift(b, j === swing && k === 1 ? (j ? -1 : 1) : 0, R.FOOT - (j === swing ? SWING.dress[k] : 0) - R.bottom(b)); });
  const im = R.over(...boots, body);
  for (const bt of boots) {
    const t = R.top(bt); if (t < 3) continue;
    for (let x = 0; x < im.W; x++) { if (!R.opaque(bt, x, t)) continue; let g = 1; while (g <= 3 && !R.opaque(im, x, t - g)) g++; if (g >= 2 && g <= 3 && R.opaque(body, x, t - g)) for (let n = 1; n < g; n++) R.put(im, x, t - n, R.get(bt, x, t)); }
  }
  return im;
}
/** a dress to the ground, no foot to read a step by (the first blind critique: « she will slide »): the skirt below `waist` swings twice the weight's shift, the hem rises over the swinging leg, two rows at passing, the body bobs one row */
function gownFront(v, o, i) {
  const swing = i < 3 ? 0 : 1, k = i % 3, half = swing ? (x) => x > o.split : (x) => x <= o.split;
  const lift = k === 1 ? 2 : 1, rows = (x, y) => y >= R.FOOT - 3 && half(x);
  const skirt = R.cut(v, (x, y) => y >= o.waist);
  const hem = R.over(R.erase(skirt, rows), R.shift(R.cut(skirt, rows), 0, -lift));
  return R.over(R.shift(R.shear(hem, o.waist, R.FOOT, HEM[i] * 2), SHIFT[i], 0), R.shift(R.cut(v, (x, y) => y < o.waist), SHIFT[i], BOB.dress[i]));
}
/** in profile: the skirt trails behind the walker and kicks forward twice a cycle, the hem's leading edge rises at passing */
function gownSide(v, o, i) {
  const k = i % 3, trail = [3, 1, -2][k];
  const skirt = R.cut(v, (x, y) => y >= o.waist && !(k === 2 && y >= R.FOOT - 1 && x < o.split));
  return R.over(R.shear(skirt, o.waist, R.FOOT, trail), R.shift(R.cut(v, (x, y) => y < o.waist), 0, BOB.dress[i]));
}
/** profile (facing left): the near leg below `hem` (columns `leg`) and a darker copy for the far one, placed by the ankle cycle with their foot under the hip column, each
 *  leaning from its top row to `bootTop` (at or above the hem: the boot moves whole); `stride` scales the cycle (a child's step) */
function sideFrame(v, o, i, kind, stride) {
  const near = R.cut(v, (x, y) => y > o.hem && x >= o.leg[0] && x <= o.leg[1]), far = R.recolour(near, R.darkener(R.paletteOf(v), 0.06));
  const A = CYCLE[i], B = CYCLE[(i + 3) % 6], c = (o.leg[0] + o.leg[1]) / 2;
  const body = R.cut(v, (x, y) => y <= o.hem);
  const top = R.shift(kind === 'dress' ? R.shear(body, o.hem - 15, o.hem, -Math.round((A.x * stride) / 3.5)) : body, 0, BOB[kind][i]);
  const place = (l, a) => R.shift(R.shear(l, o.hem, o.bootTop, Math.round(-a.x * stride)), Math.round(o.hipX - c), -a.lift);
  return R.over(place(far, B), place(near, A), top);
}

/** the rectangle of the front view in the profile, its cut side under the near arm (the second blind critique: a closed edge cut it off from him, « it floats ») */
function carried(V, { box: [x0, y0, x1, y1], at: [X, Y], arm }) {
  const part = R.blank(), nearArm = R.cut(V.side, (x, y) => x >= arm && y >= y0 - 12 && y <= y1 + 4);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const c = R.get(V.down, x, y); if (c) R.put(part, x - x0 + X, y - y0 + Y, c); }
  return R.over(V.side, part, nearArm);
}
/** `walk`: the costume's recipe; `P`: its measures per view (journal Passe CA6; `lift`: the row `liftLegs` starts at), `chin` the chin row and `breath` the row the idle's breath stops at, `stride` a child's shorter step,
 *  `carry`: what the sheet shows from the front only, a rectangle of the front view set into the profile (`at`: its left top there) under the near arm (the columns from `arm`, the first blind critique: « the crate vanishes »),
 *  `loose`: rectangles of texels to drop in the aligned view, `closingFrom`: the vertical closing's first row (below the hair on a child: above, it draws a strand from the hair to the skirt) */
export function citizenRig({ id, pitch, views, walk, P, chin = 37, breath = 62, stride = 1, carry = null, loose = {}, closingFrom = 48 }) {
  const source = { sheet: SHEET, pitch, views, palette: { k: 64 }, options: { closingFrom, noShadow: true } };
  const prepare = (dir, v) => {
    let o = align(closeSlits(cleanStrands(noGround(dir === 'side' ? R.mirror(v) : v))));
    for (const r of loose[dir] ?? []) o = R.erase(o, R.rect(...r));
    if (P[dir].lift) o = liftLegs(o, P[dir].lift);
    return walk === 'legs' && dir !== 'side' ? setDown(o, P[dir]) : o;
  };
  const frames = (V0) => {
    const out = [], V = carry ? { ...V0, side: carried(V0, carry) } : V0;
    for (const dir of ['down', 'up', 'side']) {
      const v = V[dir], o = P[dir], [inhale, exhale] = R.breath(v, chin, chin + 3, breath);
      [R.clone(v), R.clone(v), inhale, exhale].forEach((im, i) => out.push({ anim: 'idle', dir, i, im }));
      for (let i = 0; i < 6; i++) out.push({ anim: 'walk', dir, i, im: walk === 'gown' ? (dir === 'side' ? gownSide(v, o, i) : gownFront(v, o, i)) : dir === 'side' ? sideFrame(v, o, i, walk, stride) : walk === 'legs' ? legsFrontBack(v, o, i, stride) : dressFrontBack(v, o, i) });
    }
    return out;
  };
  return { id, source, prepare, frames };
}
