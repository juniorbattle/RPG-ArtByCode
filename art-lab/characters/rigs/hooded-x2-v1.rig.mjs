// Rig of hooded-x2-v1: idle (4 frames) and walk (6 frames) in the three runtime facings, cut out of three reconstructed views of the reference
// sheet's NPC 13, "Hooded Passerby (Male)" (front, back, profile: the sheet's 1st, 3rd and 4th views, one joint 64-colour palette). Like the
// guard, the hood makes him ~10 % taller than the dock worker on the sheet: resampled at 1.95 (figure 86-87 rows) and shown at the cast's
// presentation scale (0.9: the dock worker's texel size on screen, ~10 % smaller than the sheet's unified scale). His cloak is a navy close to
// the sheet's background: the reconstruction runs with a background threshold of 16 (reconstruct-grid --bg-threshold; the default 26 cut
// transparent slits into the back of the cloak). Deterministic: `node tools/art-lab/build-character.mjs <this file>`.
import { fileURLToPath } from 'node:url';
import * as R from '../../../tools/art-lab/rig-engine.mjs';

export const id = 'hooded-x2-v1';

export const source = {
  sheet: 'art-lab/characters/reference/sources/merchant-district-night-npc-01-16.webp',
  pitch: 1.95,
  views: { down: '31,818,113,988', up: '204,818,282,989', side: '294,818,355,991' },
  // the approved sheet's 64 colours (archived in the pack by the 2026-10-17 revision, which changed the closing: a new k-means would
  // have moved every colour); every view is mapped onto them
  palette: { from: 'art-lab/characters/provenance/hooded-x2-v1/palette.png' },
  // the vertical closing only from row 48 down (reconstruct-grid --closing-from=48): above, it
  // filled the background beside the neck, under the hood with its darkest colour (black strokes that read as long hair); below, it
  // restores the dark leg and boot outlines the flood fill takes for background
  options: { bgThreshold: 16, closingFrom: 48 },
};

/** recorded edits of the reconstructed views. Front: the closing strip between the legs (x 30-32) and the closing tails under the boots (rows
 *  87-90) removed, then moved 4 rows down (soles on row 90). Back: a one-row tail under the left boot and a closing strip between the legs
 *  removed, then moved 3 rows down. Profile: mirrored to face left, closing tails under the far boot (rows 89-90) removed. */
export function prepare(dir, v) {
  if (dir === 'down') return R.shift(R.erase(v, R.or(R.rect(30, 77, 32, 90), R.rect(33, 87, 40, 90))), 0, 4);
  if (dir === 'up') return R.shift(R.erase(v, R.or(R.rect(24, 88, 26, 88), R.rect(33, 79, 34, 82))), 0, 3);
  return R.erase(R.mirror(v), R.rect(21, 89, 29, 90));
}

/** after a cloth part is sheared away from the body, close the transparent gaps (<= `max` texels) it leaves inside a row of `area`, with the
 *  colour of the texel on the gap's `from` side (+1 = right, -1 = left) */
function closeGaps(im, area, max = 3, from = 1) {
  const o = R.clone(im);
  for (let y = 0; y < im.H; y++) for (let x = 1; x < im.W - 1; x++) {
    if (R.opaque(im, x, y) || !area(x, y) || !R.opaque(im, x - 1, y)) continue;
    let e = x; while (e < im.W && !R.opaque(im, e, y) && e - x < max) e++;
    if (e < im.W && R.opaque(im, e, y)) { const c = R.get(im, from > 0 ? e : x - 1, y); for (let k = x; k < e; k++) R.put(o, k, y, c); }
  }
  return o;
}
/** a hand swing: the texels of `m` between rows y0 and y1 move dy rows (rigid); a texel the hand uncovers takes what lies just outside it
 *  (towards -inward, up to 3 texels), else the texel on its inner side, else becomes transparent. A hand moved down (dy > 0) first fills the
 *  dy rows it uncovers at the top of its mask, column by column, with the texel just above the mask: the sleeve continues down (Pass
 *  4A-duovicies: they took the hand's dark outline from the side, a smear, or stayed transparent, a 2 x 2 hole in front walk 2-3) */
function swingPart(v, m, y0, y1, dy, inward) {
  const inPart = (x, y) => m(x, y) && y >= y0 && y <= y1;
  const part = R.cut(v, inPart), base = R.erase(v, inPart);
  for (let y = y0; y <= y1; y++) for (let x = 0; x < v.W; x++) {
    if (!inPart(x, y) || !R.opaque(v, x, y)) continue;
    if (dy > 0) { let t = y; while (inPart(x, t - 1)) t--; if (y - t < dy && R.opaque(v, x, t - 1)) { R.put(base, x, y, R.get(v, x, t - 1)); continue; } }
    const look = [...[1, 2, 3].map((k) => x - inward * k), ...[1, 2, 3].map((k) => x + inward * k)];
    for (const x2 of look) if (!inPart(x2, y) && R.opaque(v, x2, y)) { R.put(base, x, y, R.get(v, x2, y)); break; }
  }
  return R.over(base, R.shift(part, 0, dy));
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

/** enclosed pinholes (transparent components of at most `max` texels the background flood fill from the frame's border does not reach)
 *  take the darkest colour around them, the outline's: a one- or two-texel gap in an outline seam (an arm against the body, a hand against
 *  the cloak) lets the scene show through the sprite on a few walk / swing frames */
function fillPinholes(im, max = 2) {
  const o = R.clone(im), W = im.W, H = im.H, bg = new Uint8Array(W * H), seen = new Uint8Array(W * H), st = [];
  const N = (a, b) => [[a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]];
  for (let x = 0; x < W; x++) st.push([x, 0], [x, H - 1]);
  for (let y = 0; y < H; y++) st.push([0, y], [W - 1, y]);
  while (st.length) { const [x, y] = st.pop(); if (x < 0 || y < 0 || x >= W || y >= H || bg[y * W + x] || R.opaque(im, x, y)) continue; bg[y * W + x] = 1; st.push(...N(x, y)); }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (bg[y * W + x] || seen[y * W + x] || R.opaque(im, x, y)) continue;
    const comp = [], q = [[x, y]]; seen[y * W + x] = 1;
    while (q.length) { const [a, b] = q.pop(); comp.push([a, b]); for (const [p, r] of N(a, b)) if (!seen[r * W + p] && !R.opaque(im, p, r)) { seen[r * W + p] = 1; q.push([p, r]); } }
    if (comp.length > max) continue;
    for (const [a, b] of comp) { let best = null, bl = 2; for (const [p, r] of N(a, b)) { const c = R.get(im, p, r); if (c && R.oklab(c)[0] < bl) { bl = R.oklab(c)[0]; best = c; } } if (best) R.put(o, a, b, best); }
  }
  return o;
}

/** last pass on every frame: detached islands of fewer than 6 texels removed (parts moved by the walk or the swing can leave a few loose
 *  texels: the fragments beside the blacksmith's fists in the first build), enclosed pinholes filled (fillPinholes), then the painted parts' colours snapped to the views'
 *  palette (palette.png): every texel not in it takes the nearest palette colour (OKLab), so no new colour reaches the sheet */
function snapToViews(out, V) {
  for (const f of out) f.im = fillPinholes(despeckle(f.im, () => true, 6));
  const pal = R.paletteOf(R.load(fileURLToPath(new URL('../provenance/' + id + '/palette.png', import.meta.url)))), keys = new Set(pal.map((c) => c.join(','))), lab = pal.map(R.oklab), memo = new Map();
  const near = (c) => { const k = c.join(','); if (keys.has(k)) return c; if (memo.has(k)) return memo.get(k); const q = R.oklab(c); let bi = 0, bd = 1e9;
    lab.forEach((p, i) => { const d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2; if (d < bd) { bd = d; bi = i; } }); memo.set(k, pal[bi]); return pal[bi]; };
  for (const f of out) f.im = R.recolour(f.im, near);
  return out;
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

// ---- side (facing left): the cloak covers the thighs; the two legs below it are PAINTED in the view's trouser ramp and posed by IK (the near
// leg on the lit steps, the far one two steps darker), the view's near boot moved rigidly, a darker copy for the far leg. The coat's front edge
// and the cloak's tail behind trail the near leg by one frame (2 / 3 texels at the hem); the arms stay under the cloak.
const J = { hip: [32, 77] }, L1 = 6, L2 = 6.5, BOOT_ANKLE = [35, 86.5];   // the near boot's ankle point, in the view
const NEAR = { bands: [[-0.5, '#463b4b'], [0.15, '#3c3443'], [0.5, '#362d39'], [0.8, '#292539'], [1, '#252134']], outline: '#07070a', ow: 1 };
const FAR = { bands: [[-0.5, '#292539'], [0.15, '#252134'], [0.5, '#211d2f'], [0.8, '#1d1a2a'], [1, '#15161f']], outline: '#07070a', ow: 1 };
const TAIL = (x, y) => y >= 66 && y <= 88 && x >= 42;          // the cloak's tail, behind
const LEGS = (x, y) => y >= 81 && !TAIL(x, y);                 // the source's legs (both boots), replaced by the painted ones
const FRONT = (x, y) => y >= 64 && y <= 80 && x <= 27;         // the coat's front edge
function sideFrame(v, i) {
  const boot = R.cut(v, (x, y) => y >= 85 && x >= 30 && x <= 42), farBoot = R.recolour(boot, R.darkener(R.paletteOf(v), 0.16));
  const A = CYCLE[i], B = CYCLE[(i + 3) % 6], P = CYCLE[(i + 5) % 6];   // P: the near leg one frame earlier (the cloth trails it)
  const reach = (a) => J.hip[1] + Math.sqrt(Math.max(0, ((L1 + L2) * 0.985) ** 2 - a.x * a.x));
  const drop = Math.max(BOB[i], ...[A, B].filter((a) => a.lift === 0).map((a) => Math.ceil(BOOT_ANKLE[1] - reach(a))));
  const hip = [J.hip[0], J.hip[1] + drop];
  const pose = (a, style, bt, lift = a.lift) => {
    const ankle = [J.hip[0] - a.x, BOOT_ANKLE[1] - lift], k = R.knee(hip, ankle, L1, L2), o = R.blank();
    R.limb(o, { p: [[hip[0], hip[1] - 3], k, ankle], w: [11, 10, 9], ...style });
    return R.over(o, a.foot ? R.transform(bt, BOOT_ANKLE, ankle, a.foot) : R.shift(bt, Math.round(ankle[0] - BOOT_ANKLE[0]), Math.round(ankle[1] - BOOT_ANKLE[1])));
  };
  const near = pose(A, NEAR, boot), planted = A.lift === 0 ? near : pose(B, FAR, farBoot), fix = R.FOOT - R.bottom(planted);
  let far = pose(B, FAR, farBoot);
  if (B.lift > 0) for (let l = B.lift; R.bottom(far) + fix > R.FOOT && l < B.lift + 6; l += 0.5) far = pose(B, FAR, farBoot, l + 0.5);
  let nearL = near;
  if (A.lift > 0) for (let l = A.lift; R.bottom(nearL) + fix > R.FOOT && l < A.lift + 6; l += 0.5) nearL = pose(A, NEAR, boot, l + 0.5);
  const torso = R.cut(v, (x, y) => !LEGS(x, y) && !FRONT(x, y) && !TAIL(x, y));
  const cloth = R.over(torso, R.shear(R.cut(v, FRONT), 70, 80, -Math.round(P.x / 3)), R.shear(R.cut(v, TAIL), 68, 88, Math.round(P.x / 2)));
  const body = closeGaps(cloth, (x, y) => y >= 64 && y <= 88, 3, -1);
  const im = R.over(far, nearL, R.shift(body, 0, drop));
  return despeckle(R.shift(im, 0, fix), (x, y) => y >= 74, 6);
}

// ---- front (down) / back (up): the coat / cloak hangs to row 80 and covers the thighs, so each lower leg is a rigid part drawn BEHIND it,
// planted or lifted 3 / 5 / 3 rows (it slides up under the hem); the body bobs 2 rows and shifts its weight over the planted leg; the cloak's
// lower half sways 2 texels trailing the weight shift and its hem lifts one row on the swing side at passing; in front the hands at the
// cloak's opening swing three rows (two in between).
const SWING = [3, 5, 3];
const SHIFT = [0, 1, 1, 0, -1, -1];
const HEM = [-1, -2, -2, 1, 2, 2];
const HAND = [1, 0, -0.5, -1, 0, 0.5];
const FB = {
  down: { hem: 80, split: 31, sway: [60, 80], hands: [{ m: R.rect(12, 57, 21, 66), y0: 57, y1: 66, inward: 1 }, { m: R.rect(36, 60, 46, 70), y0: 60, y1: 70, inward: -1 }] },
  up: { hem: 81, split: 32, sway: [52, 81], hands: [] },
};
function frontBack(v, o, i) {
  const bob = BOB[i], swing = i < 3 ? 1 : 0, k = i % 3;   // frames 0-2: leg 1 (screen right) swings, 3-5: leg 0
  const half = swing ? (x) => x > o.split : (x) => x <= o.split;
  let upper = R.cut(v, (x, y) => y <= o.hem);
  o.hands.forEach((a, j) => {
    const fwd = j ? HAND[i] : -HAND[i], dy = Math.sign(fwd) * Math.round(3 * Math.abs(fwd));
    const skin = (x, y) => { const c = R.get(v, x, y); if (!c || !a.m(x, y)) return false; const q = R.oklab(c); return q[0] > 0.55 && Math.hypot(q[1], q[2]) > 0.04; };
    const m = (x, y) => skin(x, y) || [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([p, q]) => skin(x + p, y + q));
    if (dy) upper = swingPart(upper, m, a.y0, a.y1, dy, a.inward);
  });
  upper = R.movePart(upper, (x, y) => y >= o.hem - 6 && y <= o.hem && half(x), 0, k === 1 ? -1 : 0, swing ? -1 : 1, 0);
  upper = R.shear(upper, o.sway[0], o.sway[1], HEM[i]);
  const body = R.shift(upper, SHIFT[i], bob);
  const legs = [0, 1].map((j) => {
    const l = R.cut(v, (x, y) => y > o.hem && (j ? x > o.split : x <= o.split));
    return R.shift(l, j === swing && k === 1 ? (j ? -1 : 1) : 0, j === swing ? -SWING[k] : 0);
  });
  return R.over(...legs, body);
}

export function frames(V) {
  const out = [];
  for (const dir of ['down', 'up', 'side']) {
    const v = V[dir];
    // idle: rest, rest, inhale, exhale with the head one frame late (rig-engine breath, as the approved cast; chin rows: front 37, back 37,
    // profile 35)
    const [inhale, exhale] = R.breath(v, { down: 37, up: 37, side: 35 }[dir], 46, 64);
    [R.clone(v), R.clone(v), inhale, exhale].forEach((im, i) => out.push({ anim: 'idle', dir, i, im }));
    for (let i = 0; i < 6; i++) out.push({ anim: 'walk', dir, i, im: dir === 'side' ? sideFrame(v, i) : frontBack(v, FB[dir], i) });
  }
  return snapToViews(out, V);
}
