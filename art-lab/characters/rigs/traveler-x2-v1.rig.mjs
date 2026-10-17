// Rig of traveler-x2-v1: idle (4 frames) and walk (6 frames) in the three runtime facings, cut out of three reconstructed views of the
// reference sheet 01-16's NPC 07, "Traveler (Male)" (front, back, profile: the sheet's 1st, 3rd and 4th views; pitch 1.8: at 1.775 the spiky hair makes the front 91 rows), one joint 64-colour palette. An ambient
// townsperson of the crowd (Pass 4A-tervicies, replaces a generated crowd variant), shown at the cast's presentation scale (0.9).
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/traveler-x2-v1.rig.mjs`.
import * as R from '../../../tools/art-lab/rig-engine.mjs';

export const id = 'traveler-x2-v1';

export const source = {
  sheet: 'art-lab/characters/reference/sources/merchant-district-night-npc-01-16.webp',
  pitch: 1.8,
  views: { down: '747,347,828,500', up: '902,348,983,501', side: '989,350,1055,502' },
  palette: { k: 64 },
  // the vertical closing only from row 48 down (the lesson of Pass 4A-unvicies: above it, it fills the background beside the neck with the
  // darkest colour; below, it restores the dark leg and boot outlines)
  options: { closingFrom: 48 },
};

/** thin vertical strands below row `from`: runs of >= 2 texels one texel wide (transparent on both sides), the reconstruction's closing
 *  tails between the legs and under the hem; then detached islands of fewer than 6 texels */
function cleanStrands(v, from = 60) {
  let o = R.clone(v);
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
/** soles on the foot row and the feet (the lowest three rows) centred on the anchor column 31.5 */
function align(v) {
  const b = R.bottom(v); let x0 = 64, x1 = 0;
  for (let y = b - 2; y <= b; y++) for (let x = 0; x < v.W; x++) if (R.opaque(v, x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
  return R.shift(v, Math.round(31.5 - (x0 + x1) / 2), R.FOOT - b);
}
/** one-texel slits from row `from` down (a transparent texel between two opaque ones in its row: a crease or a strap edge the flood fill
 *  took for background): they open into holes once the parts move apart; filled with the darker neighbour */
function closeSlits(v, from = 56) {
  const o = R.clone(v);
  for (let y = from; y < v.H; y++) for (let x = 1; x < v.W - 1; x++) {
    if (R.opaque(v, x, y) || !R.opaque(v, x - 1, y) || !R.opaque(v, x + 1, y)) continue;
    const a = R.get(v, x - 1, y), b = R.get(v, x + 1, y);
    R.put(o, x, y, R.oklab(a)[0] <= R.oklab(b)[0] ? a : b);
  }
  return o;
}
/** one boot of a profile view: the 9 columns from the toe of the front-most boot (both boots stand side by side in the view: taken
 *  together they read as one wide slab) */
function oneBoot(v, top) {
  let b0 = 64; for (let y = top; y < v.H; y++) for (let x = 0; x < v.W; x++) if (R.opaque(v, x, y)) b0 = Math.min(b0, x);
  return [b0, b0 + 8];
}

/** recorded edits: the profile mirrored to face left (the runtime's native side); thin strands and loose
 *  islands removed (cleanStrands), one-texel slits closed (closeSlits); soles on row 90, feet centred on the anchor column (align) */
const ERASE = {  };
// erasures in the ALIGNED view's coordinates (texels under the soles: the sheet's ground shadow, which align took for the soles; loose
// reconstruction remnants found by the blind critique), then aligned again
const BELOW = { down: R.rect(58, 63, 58, 64), up: R.rect(29, 84, 35, 89) };   // the strap's loose tail right of the pack; the dark shard between the legs
export function prepare(dir, v) {
  let o = dir === 'side' ? R.mirror(v) : v;
  if (ERASE[dir]) o = R.erase(o, ERASE[dir]);
  o = align(closeSlits(cleanStrands(o)));
  if (BELOW[dir]) o = align(R.erase(o, BELOW[dir]));
  return dir === 'side' ? o : liftLegs(o, P[dir].crotch + 2);
}
/** Pass 4A-tervicies (blind critique: a near-black shin read as a hole): the reconstruction left wide near-black areas inside the legs (a
 *  whole shin, the shadow under the coat); from `from` down, a texel in the view's darkest tones (OKLab L < 0.12) whose four neighbours are
 *  opaque takes the palette colour one step lighter (L + 0.1); the outline, on the silhouette's edge, stays */
function liftLegs(v, from) {
  const pal = R.paletteOf(v), up = R.darkener(pal, -0.1), o = R.clone(v);
  for (let y = from; y < v.H - 1; y++) for (let x = 1; x < v.W - 1; x++) {
    const c = R.get(v, x, y);
    if (c && R.oklab(c)[0] < 0.12 && R.opaque(v, x - 1, y) && R.opaque(v, x + 1, y) && R.opaque(v, x, y - 1) && R.opaque(v, x, y + 1)) R.put(o, x, y, up(c));
  }
  return o;
}

// ---- front / back: the approved guard's walk. The body (everything above the crotch, the coat included) bobs 2 rows and shifts its
// weight 1 texel, the coat's hem sways 2 texels; each lower leg (rows >= the crotch) is a rigid part drawn BEHIND the body, planted or
// lifted 3 / 5 / 3 rows (it slides up under the coat). The arms stay still (the approved merchant's choice; the arm swings were where the
// inherited defects of Pass 4A-duovicies came from). Profile: the dock worker's walk: two legs PAINTED in the view's own trouser ramp
// (sampled from the view, the far leg two steps darker), posed by IK from a hip under the coat, one boot of the view moved rigidly (a
// darker copy for the far leg); the near arm swings up to 2 texels, the texels it uncovers keep the body's colour behind them.
// Measured per view: the crotch row and the column between the legs; profile: the crotch, the boots' top row,
// the hip joint, the bone lengths, the leg widths (thigh, knee, ankle), the near arm's box, the box of trouser texels the leg ramp is
// sampled from (`legs`) and the box of the near boot (`bootRect`).
const P = { down: { crotch: 77, split: 32 }, up: { crotch: 81, split: 35, tail: [29, 81, 34, 88] }, side: { crotch: 78, bootTop: 86, legs: [28, 80, 39, 85], bootRect: [29, 86, 39, 90], hip: [33, 74], L: [7, 7.5], w: [11, 10, 9], arm: [26, 50, 40, 68] }, chin: { down: 35, up: 35, side: 35 } };
const CYCLE = [
  { x: 6, lift: 0, foot: 4 },     // 0 contact
  { x: 2, lift: 0, foot: 0 },     // 1 mid-stance
  { x: -2, lift: 0, foot: 0 },    // 2 push
  { x: -6, lift: 3, foot: -12 },  // 3 toe-off
  { x: -1, lift: 5, foot: -10 },  // 4 passing
  { x: 4, lift: 3, foot: 3 },     // 5 reach
];
const BOB = [2, 0, 1, 2, 0, 1];
const SWING = [3, 5, 3];
const SHIFT = [0, 1, 1, 0, -1, -1];
const HEM = [-1, -2, -2, 1, 2, 2];
/** Pass 4A-tervicies (blind critiques): a leg whose sole stands above row 90 in the front / back view (88-89, the drawn stance) is set down
 *  on row 90 for idle and walk alike (else the planted foot hopped a row at every step, and the idle popped into the walk); its top row is
 *  repeated over the rows this opens under the body */
function setDown(v, o) {
  const tail = o.tail ? R.rect(...o.tail) : () => false;
  let im = v;
  for (const j of [0, 1]) {
    const inLeg = (x, y) => y >= o.crotch && !tail(x, y) && (j ? x > o.split : x <= o.split);
    const l = R.cut(im, inLeg), down = R.FOOT - R.bottom(l), top = R.top(l);
    if (down <= 0) continue;
    const s = R.shift(l, 0, down);
    for (let x = 0; x < l.W; x++) if (R.opaque(l, x, top)) for (let g = 0; g < down; g++) R.put(s, x, top + g, R.get(l, x, top));
    im = R.over(R.erase(im, inLeg), s);
  }
  return im;
}
function frontBack(v, o, i) {
  const bob = BOB[i], swing = i < 3 ? 1 : 0, k = i % 3;   // frames 0-2: leg 1 (screen right) swings, 3-5: leg 0
  const tail = o.tail ? R.rect(...o.tail) : () => false;   // a coat tail hanging between the legs stays with the body
  const upper = R.cut(v, (x, y) => y < o.crotch || tail(x, y));
  const body = R.shift(R.shear(upper, o.crotch - 12, o.crotch, HEM[i]), SHIFT[i], bob);
  const legs = [0, 1].map((j) => {
    const l = R.cut(v, (x, y) => y >= o.crotch && !tail(x, y) && (j ? x > o.split : x <= o.split));
    return R.shift(l, j === swing && k === 1 ? (j ? -1 : 1) : 0, j === swing ? -SWING[k] : 0);
  });
  return R.over(...legs, body);
}
/** the trouser ramp of the profile: the colours of the trousers (the view's texels inside `legs` of the trousers' hue: within 40 degrees of
 *  the median hue of its chromatic texels, or near-neutral; their darkest fifth, creases and outline, left out), lightest first, five
 *  quantiles; the outline is the view's darkest colour. (A first version sampled whole rows from the crotch to the boots: the coat, bag and
 *  apron at those rows made brown or near-black legs; without the hue test one grey-mauve texel of the box took the traveller's mid band) */
function ramp(v, o) {
  const box = [], legs = R.rect(...o.legs);
  for (let y = 0; y < v.H; y++) for (let x = 0; x < v.W; x++) { const c = legs(x, y) && R.get(v, x, y); if (c) box.push(c); }
  const hue = (c) => { const q = R.oklab(c); return [Math.atan2(q[2], q[1]) * 180 / Math.PI, Math.hypot(q[1], q[2])]; };
  const hs = box.map(hue).filter(([, ch]) => ch > 0.015).map(([h]) => h).sort((a, b) => a - b), med = hs[Math.floor(hs.length / 2)];
  const cols = box.filter((c) => { const [h, ch] = hue(c); return ch <= 0.015 || Math.abs(((h - med + 540) % 360) - 180) < 40; });
  cols.sort((a, b) => R.oklab(b)[0] - R.oklab(a)[0]);
  cols.length = Math.ceil(cols.length * 0.8);
  const q = (t) => cols[Math.min(cols.length - 1, Math.floor(t * cols.length))];
  const all = R.paletteOf(v).sort((a, b) => R.oklab(a)[0] - R.oklab(b)[0]), dark = all[0], hex = (c) => '#' + c.map((n) => n.toString(16).padStart(2, '0')).join('');
  const near = [0.1, 0.3, 0.5, 0.7, 0.9].map(q), dk = R.darkener(R.paletteOf(v), 0.07), s = near.map(hex), far = near.map(dk).map(hex);   // far leg: the near ramp 0.07 OKLab darker (the second critiques: one grey for both shins, the legs merged)
  const T = [-0.5, 0.15, 0.5, 0.8, 1];
  return { near: { bands: T.map((t, i) => [t, s[i]]), outline: hex(dark), ow: 1 }, far: { bands: T.map((t, i) => [t, far[i]]), outline: hex(dark), ow: 1 } };
}
/** texels of `mask` take the colour of the nearest opaque texel outside it in their row towards +x (behind the arm), else keep their own */
function filled(im, mask) {
  const o = R.erase(im, mask);
  for (let y = 0; y < im.H; y++) for (let x = 0; x < im.W; x++) {
    if (!mask(x, y) || !R.opaque(im, x, y)) continue;
    let c = null;
    for (let k = 1; k <= 6 && !c; k++) if (!mask(x + k, y) && R.opaque(im, x + k, y)) c = R.get(im, x + k, y);
    R.put(o, x, y, c ?? R.get(im, x, y));
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
function sideFrame(v, o, i) {
  const { near: NEAR, far: FAR } = ramp(v, o);
  // the near boot: its box in the view (oneBoot's 9 columns from the front toe also took the far boot's toe or the ground shadow); the
  // ankle 3.5 columns in front of the heel
  const [b0, b1] = o.bootRect ? [o.bootRect[0], o.bootRect[2]] : oneBoot(v, o.bootTop), inBoot = o.bootRect ? R.rect(...o.bootRect) : (x, y) => y >= o.bootTop && x >= b0 && x <= b1;
  const boot = R.cut(v, inBoot), farBoot = R.recolour(boot, R.darkener(R.paletteOf(v), 0.13));   // 0.16 gave the traveller maroon shoes, 0.1 merged the two boots (blind critiques)
  const BOOT_ANKLE = [b1 - 3.5, o.bootTop + 1.5];
  const A = CYCLE[i], B = CYCLE[(i + 3) % 6], [L1, L2] = o.L;
  const reach = (a) => o.hip[1] + Math.sqrt(Math.max(0, ((L1 + L2) * 0.985) ** 2 - a.x * a.x));
  const drop = Math.max(BOB[i], ...[A, B].filter((a) => a.lift === 0).map((a) => Math.ceil(BOOT_ANKLE[1] - reach(a))));
  const hip = [o.hip[0], o.hip[1] + drop];
  const pose = (a, style, bt, lift = a.lift) => {
    const ankle = [o.hip[0] - a.x, BOOT_ANKLE[1] - lift], kn = R.knee(hip, ankle, L1, L2), im = R.blank();
    R.limb(im, { p: [[hip[0], hip[1] - 3], kn, ankle], w: o.w, ...style });
    return R.over(im, a.foot ? R.transform(bt, BOOT_ANKLE, ankle, a.foot) : R.shift(bt, Math.round(ankle[0] - BOOT_ANKLE[0]), Math.round(ankle[1] - BOOT_ANKLE[1])));
  };
  const near = pose(A, NEAR, boot), planted = A.lift === 0 ? near : pose(B, FAR, farBoot), fix = R.FOOT - R.bottom(planted);
  let far = pose(B, FAR, farBoot);
  if (B.lift > 0) for (let l = B.lift; R.bottom(far) + fix > R.FOOT && l < B.lift + 6; l += 0.5) far = pose(B, FAR, farBoot, l + 0.5);
  let nearL = near;
  if (A.lift > 0) for (let l = A.lift; R.bottom(nearL) + fix > R.FOOT && l < A.lift + 6; l += 0.5) nearL = pose(A, NEAR, boot, l + 0.5);
  const arm = R.rect(...o.arm);
  const body = filled(R.cut(v, (x, y) => y < o.crotch), arm);
  const armL = R.shear(R.cut(v, (x, y) => arm(x, y) && y < o.crotch), o.arm[1] + 6, o.arm[3], Math.round(A.x / 3));
  const im = R.over(far, nearL, R.shift(body, 0, drop), R.shift(armL, 0, drop));
  return despeckle(R.shift(im, 0, fix), (x, y) => y >= o.crotch - 4, 6);
}

export function frames(V) {
  const out = [];
  for (const dir of ['down', 'up', 'side']) {
    const o = P[dir], v = dir === 'side' ? V[dir] : setDown(V[dir], o);
    // idle: rest, rest, inhale, exhale with the head one frame late (rig-engine breath, as the approved cast)
    const [inhale, exhale] = R.breath(v, P.chin[dir], P.chin[dir] + 3, 62);
    [R.clone(v), R.clone(v), inhale, exhale].forEach((im, i) => out.push({ anim: 'idle', dir, i, im }));
    for (let i = 0; i < 6; i++) out.push({ anim: 'walk', dir, i, im: dir === 'side' ? sideFrame(v, o, i) : frontBack(v, o, i) });
  }
  return out;
}
