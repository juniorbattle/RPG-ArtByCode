// Rig of hero-x2-v1 (EXPERIMENTAL, not approved): the protagonist, idle (4 frames) and run (6 frames) in the three runtime facings, cut out of
// three reconstructed views of the operator's individual sheet v2 (prompt v2 of art-lab/characters/briefs/hero-proposal.md): its 1st (front),
// 6th (back) and 4th (profile, facing right: mirrored) idle views, one joint 64-colour palette. Pitch 5.3 sheet pixels per texel: figures of
// 85-87 rows, like the cast. The sheet's five run frames are not used as frames: their proportions are not the idle views' (chin to belt
// 11 rows against 24, figure 69 rows against 86; journal Pass H3), so the run is rigged from the idle profile. Shown in the scene, it was
// turned down by the operator (proportions, still arms, thighs too high; journal Pass H3): the thighs are fixed here, the rest waits for the
// v3 sheet (brief section 5), from which this id is rebuilt.
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/hero-x2-v1.rig.mjs`.
import * as R from '../../../tools/art-lab/rig-engine.mjs';

export const id = 'hero-x2-v1';

export const source = {
  sheet: 'art-lab/characters/reference/sources/hero-turnaround-v2-2026-10-18.png',
  pitch: 5.3,
  // the front view's crop stops 5 sheet pixels short of the 3/4 view's cape, which touches it
  views: { down: '24,50,292,510', up: '1393,51,1624,508', side: '820,50,1033,512' },
  palette: { k: 64 },
  // no cast-shadow rule (the sheet has none; its dark soles must stay); the vertical closing only from row 48 down (Pass 4A-unvicies);
  // background-grey cells enclosed by the figure cleared (the sheet's grey between the profile's boot shafts, halo texels on the hems)
  options: { holes: true, noShadow: true, closingFrom: 48 },
};

/** thin vertical strands below row `from` (runs of >= 2 texels one texel wide), then detached islands of fewer than 6 texels */
function cleanStrands(v, from = 60) {
  const o = R.clone(v);
  for (let x = 1; x < v.W - 1; x++) for (let y = from; y < v.H; y++) {
    if (!R.opaque(v, x, y) || R.opaque(v, x - 1, y) || R.opaque(v, x + 1, y)) continue;
    let e = y; while (e + 1 < v.H && R.opaque(v, x, e + 1) && !R.opaque(v, x - 1, e + 1) && !R.opaque(v, x + 1, e + 1)) e++;
    if (e > y) for (let k = y; k <= e; k++) R.put(o, x, k, null);
    y = e;
  }
  return despeckle(o, () => true, 6);
}
/** soles on the foot row and the feet (the lowest three rows) centred on the anchor column 31.5 */
function align(v) {
  const b = R.bottom(v); let x0 = 64, x1 = 0;
  for (let y = b - 2; y <= b; y++) for (let x = 0; x < v.W; x++) if (R.opaque(v, x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
  return R.shift(v, Math.round(31.5 - (x0 + x1) / 2), R.FOOT - b);
}
/** one-texel slits from row `from` down, filled with the darker neighbour */
function closeSlits(v, from = 56) {
  const o = R.clone(v);
  for (let y = from; y < v.H; y++) for (let x = 1; x < v.W - 1; x++) {
    if (R.opaque(v, x, y) || !R.opaque(v, x - 1, y) || !R.opaque(v, x + 1, y)) continue;
    const a = R.get(v, x - 1, y), b = R.get(v, x + 1, y);
    R.put(o, x, y, R.oklab(a)[0] <= R.oklab(b)[0] ? a : b);
  }
  return o;
}
/** loose texels: 4-connected islands of fewer than `min` texels inside `area` removed */
function despeckle(im, area, min = 6) {
  const o = R.clone(im), seen = new Uint8Array(im.W * im.H);
  for (let y = 0; y < im.H; y++) for (let x = 0; x < im.W; x++) {
    if (seen[y * im.W + x] || !R.opaque(im, x, y)) continue;
    const comp = [], st = [[x, y]]; seen[y * im.W + x] = 1;
    while (st.length) { const [a, b] = st.pop(); comp.push([a, b]); for (const [p, q] of [[a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]]) if (p >= 0 && q >= 0 && p < im.W && q < im.H && !seen[q * im.W + p] && R.opaque(im, p, q)) { seen[q * im.W + p] = 1; st.push([p, q]); } }
    if (comp.length < min && comp.every(([a, b]) => area(a, b))) for (const [a, b] of comp) R.put(o, a, b, null);
  }
  return o;
}
/** every texel of `im` moved horizontally by dx(x, y) (rows of a layer bent independently) */
function bend(im, dx) {
  const o = R.blank(im.W, im.H);
  for (let y = 0; y < im.H; y++) for (let x = 0; x < im.W; x++) if (R.opaque(im, x, y)) R.put(o, x + dx(x, y), y, R.get(im, x, y));
  return o;
}
export function prepare(dir, v) {
  const o = dir === 'side' ? R.mirror(v) : v;
  return align(closeSlits(cleanStrands(o)));
}

// ---- profile run (the operator's choice of a running stride, 2.5 m/s: brief section 4). The idle profile's upper body (cape, pouches,
// arms) leans 2 texels into the run and its cape's tail trails up to 4 texels behind; its legs are replaced by two legs PAINTED in the view's
// own ramps (the approved cast's method, Pass 4A-tervicies): the thigh in the trousers' ramp, the boot's shaft in the boot's ramp with its
// lighter turned-down cuff, posed by two-bone IK, and the view's own boot foot moved rigidly. The far leg is the same, darker. (A first
// version turned the view's own leg, cut out texel for texel, in three segments: the painting's busy boot texture broke up once rotated.)
// Six frames: contact, push, flight, contact, push, flight. The planted foot stays flat and moves exactly 9 texels between contact and push
// (the runtime's walkSlide, Stride.ts: the clock then reaches 2.5 m/s at x1.56 in B / D, under its x1.6 bound); in the flight frames no texel
// touches the foot row. The arms stay still (the approved merchant's choice: a swung gauntlet came loose from the sleeve).
// Measured on the prepared profile: the hip (under the pouches), the bone lengths (hip to the boot's cuff, cuff to the ankle), the legs to
// remove (`legs`: rows >= 66 left of the cape, the boots), the boxes the trousers' and the boot's ramps are sampled from, the boot's foot
// (`foot`, its ankle pivot) and the cape's tail.
const SIDE = {
  hip: [33, 64], L: [11.5, 11.5], w: { thigh: [10, 9, 8], shaft: [8, 9] },
  legs: (x, y) => (y >= 66 && y <= 73 && x <= 41) || (y === 74 && x <= 43) || (y >= 75 && x <= 44),
  trousers: [25, 66, 29, 73], boot: [26, 76, 32, 83], cuff: [25, 75, 34, 75],
  foot: (x, y) => y >= 84 && y <= 89 && x >= 19 && x <= 31, footPivot: [28, 85.5],
  cape: (x, y) => (y >= 46 && y <= 61 && x >= 47) || (y >= 62 && x >= 42),
};
const RUN = [
  { x: 5, lift: 0, foot: 0 },      // 0 contact (flat)
  { x: -4, lift: 0, foot: 0 },     // 1 push
  { x: -10, lift: 3, foot: -20 },  // 2 toe-off (flight)
  { x: -6, lift: 6, foot: -30 },   // 3 heel up behind
  { x: 3, lift: 6, foot: -10 },    // 4 knee forward, below the pouches
  { x: 8, lift: 2, foot: 5 },      // 5 reach (flight)
];
const BOB = [1, 1, 0, 1, 1, 0];
const CAPE = [2, 3, 4, 2, 3, 4];
const LEAN = 2;
const hex = (c) => '#' + c.map((n) => n.toString(16).padStart(2, '0')).join('');
/** the colours of the view inside a box, lightest first, their darkest fifth (creases, outline) left out: five quantiles */
function ramp(v, box) {
  const r = R.rect(...box), cols = [];
  for (let y = 0; y < v.H; y++) for (let x = 0; x < v.W; x++) { const c = r(x, y) && R.get(v, x, y); if (c) cols.push(c); }
  cols.sort((a, b) => R.oklab(b)[0] - R.oklab(a)[0]); cols.length = Math.ceil(cols.length * 0.8);
  return [0.1, 0.3, 0.5, 0.7, 0.9].map((t) => cols[Math.min(cols.length - 1, Math.floor(t * cols.length))]);
}
/** the leg styles: near and far (0.07 OKLab darker), shaded lightest at the front; the shaft is painted ankle -> knee (its flat far end is the
 *  cuff), so its bands run the other way */
function legStyles(v) {
  const pal = R.paletteOf(v), dk = R.darkener(pal, 0.07), outline = hex(pal.slice().sort((a, b) => R.oklab(a)[0] - R.oklab(b)[0])[0]);
  const tr = ramp(v, SIDE.trousers), bt = ramp(v, SIDE.boot), cuff = ramp(v, SIDE.cuff)[1];
  const make = (f) => ({
    thigh: { bands: [-0.5, 0.15, 0.5, 0.8, 1].map((t, i) => [t, hex(f(tr[i]))]), outline, ow: 1 },
    shaft: { bands: [-0.8, -0.5, -0.15, 0.5, 1].map((t, i) => [t, hex(f(bt[4 - i]))]), outline, ow: 1, endBands: [[2, hex(f(cuff))]], endOutline: outline },
  });
  return { near: make((c) => c), far: make(dk), dk: R.darkener(pal, 0.08) };
}
function sideFrame(v, i) {
  const st = legStyles(v), [L1, L2] = SIDE.L, P = SIDE.footPivot;
  const footN = R.cut(v, SIDE.foot), footF = R.recolour(footN, st.dk);
  const hip = [SIDE.hip[0], SIDE.hip[1] + BOB[i]];
  // a planted ankle stands the foot's sole (row 89 in the view) on row 90
  const leg = (style, foot, a, extra = 0) => {
    const ankle = [hip[0] - a.x, P[1] + 1 - a.lift - extra], kn = R.knee(hip, ankle, L1, L2), im = R.blank();
    R.limb(im, { p: [[hip[0], hip[1] - 3], kn, [kn[0] + (ankle[0] - kn[0]) * 0.3, kn[1] + (ankle[1] - kn[1]) * 0.3]], w: SIDE.w.thigh, ...style.thigh });
    R.limb(im, { p: [ankle, kn], w: SIDE.w.shaft, ...style.shaft });
    return R.over(im, a.foot ? R.transform(foot, P, ankle, a.foot) : R.shift(foot, Math.round(ankle[0] - P[0]), Math.round(ankle[1] - P[1])));
  };
  const posed = (style, foot, a) => {
    let e = 0, im = leg(style, foot, a);
    if (a.lift > 0) while (R.bottom(im) >= R.FOOT && e < 8) { e += 0.5; im = leg(style, foot, a, e); }
    return im;
  };
  const A = RUN[i], B = RUN[(i + 3) % 6];
  const nearL = posed(st.near, footN, A), farL = posed(st.far, footF, B);
  // upper body: the view without its legs; rows above the hips lean forward (-x), the cape's tail trails behind (+x)
  const body = R.erase(v, SIDE.legs), lean = (y) => (y >= 62 ? 0 : -Math.round((LEAN * (62 - Math.max(30, y))) / 32));
  const flutter = (y) => (y < 46 ? 0 : Math.round((CAPE[i] * (y - 46)) / 36));
  const capeL = bend(R.cut(body, SIDE.cape), (x, y) => lean(y) + flutter(y));
  const torso = bend(R.erase(body, SIDE.cape), (x, y) => lean(y));
  const down = (im) => R.shift(im, 0, BOB[i]);
  return despeckle(R.over(farL, down(capeL), nearL, down(torso)), (x, y) => y >= 60, 6);
}

// ---- front / back run: the body (everything above the legs, the cape's panels and lining included) bobs with the profile's rhythm and
// shifts its weight 1 texel, the cape's hem sways; each leg (trousers and boot, or the boot alone under the back of the cape) is a rigid
// part drawn BEHIND the body, planted or lifted (it slides up under the body), both lifted in the flight frames.
// Measured per view: the legs' texels (front: trousers between the cape's panels and lining, then the boots; back: the boots under the
// cape's hem), the row the cape's sway starts from (`hem`).
const FB = {
  down: { hem: 51, legs: [
    (x, y) => (y >= 67 && y <= 74 && x >= 20 && x <= 31) || (y >= 75 && y <= 77 && x >= 18 && x <= 29) || (y >= 78 && x >= 14 && x <= 30),
    (x, y) => (y >= 67 && y <= 74 && x >= 33 && x <= 44) || (y >= 75 && y <= 77 && x >= 34 && x <= 46) || (y >= 78 && x >= 33 && x <= 50 && (y >= 81 || x <= 46)),
  ] },
  up: { hem: 64, legs: [(x, y) => y >= 80 && x <= 28, (x, y) => y >= 80 && x >= 38] },
};
const LIFT = [0, 0, 3, 7, 9, 4];
const SHIFT = [0, 1, 1, 0, -1, -1];
const HEM = [-1, -2, -1, 1, 2, 1];
function frontBack(v, o, i) {
  const all = (x, y) => o.legs.some((m) => m(x, y));
  const body = R.shift(R.shear(R.erase(v, all), o.hem, 81, HEM[i]), SHIFT[i], BOB[i]);
  // leg 0 (screen left) takes the profile's near-leg rhythm, leg 1 three frames later
  const legs = o.legs.map((m, j) => R.shift(R.cut(v, m), 0, -LIFT[(i + 3 * j) % 6]));
  return R.over(...legs, body);
}

export function frames(V) {
  const out = [];
  for (const dir of ['down', 'up', 'side']) {
    const v = V[dir];
    // idle: rest, rest, inhale, exhale with the head one frame late (rig-engine breath, as the approved cast)
    const [inhale, exhale] = R.breath(v, 30, 33, 62);
    [R.clone(v), R.clone(v), inhale, exhale].forEach((im, i) => out.push({ anim: 'idle', dir, i, im }));
    for (let i = 0; i < 6; i++) out.push({ anim: 'walk', dir, i, im: dir === 'side' ? sideFrame(v, i) : frontBack(v, FB[dir], i) });
  }
  return out;
}
