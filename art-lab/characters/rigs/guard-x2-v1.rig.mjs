// Rig of guard-x2-v1: idle (4 frames) and walk (6 frames) in the three runtime facings, cut out of three reconstructed views of the reference
// sheet's NPC 06, "City Guard (Male)" (front, back, profile: the sheet's 1st, 3rd and 4th views, one joint 64-colour palette). The helmet makes
// him ~10 % taller than the dock worker on the sheet: at the dock worker's pitch (1.775) the figure is 96-98 rows and does not fit the 90 rows
// above the foot row, so the sheet is resampled at 1.95 (figure 87-89 rows; one pitch for the two tall figures, the hooded passerby too). He is
// shown at the cast's presentation scale (0.9): his texels are the dock worker's size on screen and he is ~10 % smaller than the sheet's
// unified scale would make him (2.04 m -> 1.86 m, helmet included). Deterministic: `node tools/art-lab/build-character.mjs <this file>`.
import * as R from '../../../tools/art-lab/rig-engine.mjs';

export const id = 'guard-x2-v1';

export const source = {
  sheet: 'art-lab/characters/reference/sources/merchant-district-night-npc-01-16.webp',
  pitch: 1.95,
  views: { down: '385,330,461,504', up: '548,334,622,505', side: '633,334,692,506' },
  palette: { k: 64 },
};

/** after a part is moved away from its neighbour, close the transparent gaps (<= `max` texels) left inside a row of `area`, with the colour of
 *  the texel on the gap's `from` side (+1 = right, -1 = left) */
function closeGaps(im, area, max = 3, from = 1) {
  const o = R.clone(im);
  for (let y = 0; y < im.H; y++) for (let x = 1; x < im.W - 1; x++) {
    if (R.opaque(im, x, y) || !area(x, y) || !R.opaque(im, x - 1, y)) continue;
    let e = x; while (e < im.W && !R.opaque(im, e, y) && e - x < max) e++;
    if (e < im.W && R.opaque(im, e, y)) { const c = R.get(im, from > 0 ? e : x - 1, y); for (let k = x; k < e; k++) R.put(o, k, y, c); }
  }
  return o;
}

/** recorded edits of the reconstructed views. Front: closing tails between the legs (x 29-30, rows 80-83), under the cape (row 80) and under
 *  the left boot (20, 90) removed, then moved 1 row down (soles on row 90). Back: a closing tail between the legs removed; the background
 *  slit between the cape and the right arm's edge (x 40-42, rows 36-50, it made the edge read as a loose strand) closed with the cape's
 *  colour. Profile: mirrored to face left, moved 1 texel right and 2 rows down (legs centred on the anchor column, soles on row 90), the cape
 *  tail's one-texel thread (x 45-48, rows 83-86: it reads as a loose strand once the tail sways) removed. */
export function prepare(dir, v) {
  if (dir === 'down') return R.shift(R.erase(v, R.or(R.rect(29, 80, 30, 83), R.rect(44, 80, 48, 80), R.rect(20, 90, 20, 90))), 0, 1);
  if (dir === 'up') return closeGaps(R.erase(v, R.rect(31, 81, 31, 82)), R.rect(39, 36, 43, 50), 3, -1);
  return R.erase(R.shift(R.mirror(v), 1, 2), R.rect(45, 83, 48, 86));
}

/** front / back arm swing: the arm's texels between rows y0 and y1 (the fist last, `fist` rows rigid) are stretched (dy > 0) or squeezed
 *  (dy < 0) by |dy| rows and moved dx texels; a texel the arm uncovers takes what lies just outside the arm (up to 3 texels away, away from
 *  the body), else becomes transparent */
function swingArm(v, m, y0, y1, dy, dx, inward, fist) {
  const inArm = (x, y) => m(x, y) && y >= y0 && y <= y1;
  const arm = R.cut(v, inArm), base = R.erase(v, inArm);
  for (let y = y0; y <= y1; y++) for (let x = 0; x < v.W; x++) {
    if (!inArm(x, y) || !R.opaque(v, x, y)) continue;
    for (let k = 1; k <= 3; k++) { const x2 = x - inward * k; if (!inArm(x2, y) && R.opaque(v, x2, y)) { R.put(base, x, y, R.get(v, x2, y)); break; } }
  }
  return R.over(base, R.shift(R.remapRows(arm, () => true, y0, y1, y0, y1 + dy, 0, fist), dx, 0));
}

/** loose texels: 4-connected islands of fewer than `min` texels lying entirely inside `area` are removed (RotSprite turns, sheared cloth
 *  tips and overlapping boots leave a few around the feet) */
function despeckle(im, area, min = 4) {
  const o = R.clone(im), seen = new Uint8Array(im.W * im.H);
  for (let y = 0; y < im.H; y++) for (let x = 0; x < im.W; x++) {
    if (seen[y * im.W + x] || !R.opaque(im, x, y)) continue;
    const comp = [], st = [[x, y]]; seen[y * im.W + x] = 1;
    while (st.length) { const [a, b] = st.pop(); comp.push([a, b]); for (const [p, q] of [[a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]]) if (p >= 0 && q >= 0 && p < im.W && q < im.H && !seen[q * im.W + p] && R.opaque(im, p, q)) { seen[q * im.W + p] = 1; st.push([p, q]); } }
    if (comp.length < min && comp.every(([a, b]) => area(a, b))) for (const [a, b] of comp) R.put(o, a, b, null);
  }
  return o;
}

// ---- gait (the dock worker's timing: 6 frames at 7.5 frames / s, one step = 3 frames); the body is lowest on the contact frames, 2 rows
// below the passing frames (2-texel amplitudes: one-texel moves do not read at ~1.8 screen px / texel)
const CYCLE = [
  { x: 6, lift: 0, foot: 4 },     // 0 contact
  { x: 2, lift: 0, foot: 0 },     // 1 mid-stance
  { x: -2, lift: 0, foot: 0 },    // 2 push
  { x: -6, lift: 3, foot: -12 },  // 3 toe-off
  { x: -1, lift: 5, foot: -10 },  // 4 passing
  { x: 4, lift: 3, foot: 3 },     // 5 reach
];
const BOB = [2, 0, 1, 2, 0, 1];

// ---- side (facing left): the tabard covers the thighs; below it the two legs (greaves) are PAINTED in the view's grey ramp and posed by IK
// (the near leg on the lit steps, the far one two steps darker), the view's rear boot (the near one) moved rigidly, a darker copy for the far
// leg. The tabard's front panel and the cape's tail behind trail the near leg by one frame (2 / 3 texels at the hem); the near arm swings.
const J = { hip: [32, 74] }, L1 = 7, L2 = 7.5, BOOT_ANKLE = [36.5, 87.5];   // the rear boot's ankle point, in the view
const NEAR = { bands: [[-0.5, '#7a6d75'], [0.15, '#645964'], [0.5, '#524a59'], [0.8, '#433d4b'], [1, '#312b36']], outline: '#040207', ow: 1 };
const FAR = { bands: [[-0.5, '#4e434e'], [0.15, '#433d4b'], [0.5, '#3a3443'], [0.8, '#312b36'], [1, '#26202b']], outline: '#040207', ow: 1 };
const CAPE = (x, y) => y >= 62 && y <= 86 && x >= 40;          // the cape's tail, behind
const LEGS = (x, y) => y >= 78 && !CAPE(x, y);                 // the source's legs (both boots), replaced by the painted ones
const PANEL = (x, y) => y >= 64 && y <= 77 && x <= 28;         // the tabard's front panel
const SIDE_ARM = R.rect(29, 47, 41, 68);                       // elbow, bracer and fist of the near arm
/** texels of `mask` take the colour of the nearest opaque texel outside it in their row, towards +x (what the swinging arm uncovers) */
function filled(im, mask) {
  const o = R.erase(im, mask);
  for (let y = 0; y < im.H; y++) for (let x = 0; x < im.W; x++) {
    if (!mask(x, y) || !R.opaque(im, x, y)) continue;
    for (let k = 1; k <= 6; k++) if (!mask(x + k, y) && R.opaque(im, x + k, y)) { R.put(o, x, y, R.get(im, x + k, y)); break; }
  }
  return o;
}
function sideFrame(v, i) {
  const boot = R.cut(v, (x, y) => y >= 87 && x >= 30), farBoot = R.recolour(boot, R.darkener(R.paletteOf(v), 0.16));
  const A = CYCLE[i], B = CYCLE[(i + 3) % 6], P = CYCLE[(i + 5) % 6];   // P: the near leg one frame earlier (the cloth trails it)
  const reach = (a) => J.hip[1] + Math.sqrt(Math.max(0, ((L1 + L2) * 0.985) ** 2 - a.x * a.x));
  const drop = Math.max(BOB[i], ...[A, B].filter((a) => a.lift === 0).map((a) => Math.ceil(BOOT_ANKLE[1] - reach(a))));
  const hip = [J.hip[0], J.hip[1] + drop];
  const pose = (a, style, bt, lift = a.lift) => {
    const ankle = [J.hip[0] - a.x, BOOT_ANKLE[1] - lift], k = R.knee(hip, ankle, L1, L2), o = R.blank();
    R.limb(o, { p: [[hip[0], hip[1] - 3], k, ankle], w: [11, 10, 9], ...style });
    // the boot's ankle point lands on the leg's end
    return R.over(o, a.foot ? R.transform(bt, BOOT_ANKLE, ankle, a.foot) : R.shift(bt, Math.round(ankle[0] - BOOT_ANKLE[0]), Math.round(ankle[1] - BOOT_ANKLE[1])));
  };
  const near = pose(A, NEAR, boot), planted = A.lift === 0 ? near : pose(B, FAR, farBoot), fix = R.FOOT - R.bottom(planted);
  let far = pose(B, FAR, farBoot);
  if (B.lift > 0) for (let l = B.lift; R.bottom(far) + fix > R.FOOT && l < B.lift + 6; l += 0.5) far = pose(B, FAR, farBoot, l + 0.5);
  let nearL = near;
  if (A.lift > 0) for (let l = A.lift; R.bottom(nearL) + fix > R.FOOT && l < A.lift + 6; l += 0.5) nearL = pose(A, NEAR, boot, l + 0.5);
  const torso = filled(R.cut(v, (x, y) => !LEGS(x, y) && !PANEL(x, y) && !CAPE(x, y)), SIDE_ARM);
  const cloth = R.over(torso, R.shear(R.cut(v, PANEL), 68, 77, -Math.round(P.x / 3)), R.shear(R.cut(v, CAPE), 68, 86, Math.round(P.x / 2)));
  const body = closeGaps(cloth, (x, y) => y >= 64 && y <= 86, 3, -1);
  const arm = R.shear(R.cut(v, SIDE_ARM), 55, 68, Math.round(A.x / 3));
  const im = R.over(far, nearL, R.shift(body, 0, drop), R.shift(arm, 0, drop));
  return despeckle(R.shift(im, 0, fix), (x, y) => y >= 74, 6);
}

// ---- front (down) / back (up): the tabard / cape hangs to row 80 and covers the thighs, so each lower leg (rows >= 81) is a rigid part drawn
// BEHIND it, planted or lifted 3 / 5 / 3 rows (it slides up under the hem, like the merchant's boots); the body bobs 2 rows and shifts its
// weight over the planted leg; the hem sways 2 texels trailing the weight shift and lifts one row on the swing side at passing; the fists
// swing three rows (two in between, and one texel inwards forward).
const SWING = [3, 5, 3];
const SHIFT = [0, 1, 1, 0, -1, -1];
const HEM = [-1, -2, -2, 1, 2, 2];
const ARM = [1, 0, -0.5, -1, 0, 0.5];
const FB = {
  down: { split: 31, hem: [62, 80], arms: [{ m: R.rect(12, 47, 20, 65), y0: 47, y1: 65, fist: 7, inward: 1 }, { m: R.rect(40, 47, 46, 65), y0: 47, y1: 65, fist: 7, inward: -1 }] },
  up: { split: 31, hem: [58, 80], arms: [{ m: R.rect(10, 50, 19, 69), y0: 50, y1: 69, fist: 7, inward: 1 }, { m: R.rect(44, 50, 53, 69), y0: 50, y1: 69, fist: 7, inward: -1 }] },
};
function frontBack(v, o, i) {
  const bob = BOB[i], swing = i < 3 ? 1 : 0, k = i % 3;   // frames 0-2: leg 1 (screen right) swings, 3-5: leg 0
  const half = swing ? (x) => x > o.split : (x) => x <= o.split;
  let upper = R.cut(v, (x, y) => y <= 80);
  o.arms.forEach((a, j) => {
    const fwd = j ? ARM[i] : -ARM[i], dy = Math.sign(fwd) * Math.round(3 * Math.abs(fwd)), dx = fwd >= 1 ? a.inward : 0;
    if (dy) upper = swingArm(upper, a.m, a.y0, a.y1, dy, dx, a.inward, a.fist);
  });
  upper = R.movePart(upper, (x, y) => y >= 74 && y <= 80 && half(x), 0, k === 1 ? -1 : 0, swing ? -1 : 1, 0);
  upper = R.shear(upper, o.hem[0], o.hem[1], HEM[i]);
  const body = R.shift(upper, SHIFT[i], bob);
  const legs = [0, 1].map((j) => {
    const l = R.cut(v, (x, y) => y >= 81 && (j ? x > o.split : x <= o.split));
    return R.shift(l, j === swing && k === 1 ? (j ? -1 : 1) : 0, j === swing ? -SWING[k] : 0);
  });
  return R.over(...legs, body);
}

export function frames(V) {
  const out = [];
  for (const dir of ['down', 'up', 'side']) {
    const v = V[dir];
    // idle: rest, rest, inhale, exhale with the head one frame late (rig-engine breath, as the approved cast; chin rows: front 35, back 35,
    // profile 34)
    const [inhale, exhale] = R.breath(v, { down: 35, up: 35, side: 34 }[dir], 46, 64);
    [R.clone(v), R.clone(v), inhale, exhale].forEach((im, i) => out.push({ anim: 'idle', dir, i, im }));
    for (let i = 0; i < 6; i++) out.push({ anim: 'walk', dir, i, im: dir === 'side' ? sideFrame(v, i) : frontBack(v, FB[dir], i) });
  }
  return out;
}
