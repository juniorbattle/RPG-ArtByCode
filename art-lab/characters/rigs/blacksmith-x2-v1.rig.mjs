// Rig of blacksmith-x2-v1: idle (4 frames) and walk (6 frames) in the three runtime facings, plus the forge's side-only hammer cycle (4 frames),
// cut out of three reconstructed views of the reference sheet's NPC 04, "Blacksmith Helper (Male)" (front, back, profile: the sheet's 1st, 3rd
// and 4th views, the dock worker's pitch, one joint 64-colour palette). The sheet shows him without a tool: the hammer is PAINTED in the
// palette's iron (bandana greys) and wood (apron browns). Deterministic: `node tools/art-lab/build-character.mjs <this file>`.
import { fileURLToPath } from 'node:url';
import * as R from '../../../tools/art-lab/rig-engine.mjs';

export const id = 'blacksmith-x2-v1';

export const source = {
  sheet: 'art-lab/characters/reference/sources/merchant-district-night-npc-01-16.webp',
  pitch: 1.775,
  views: { down: '1089,117,1170,271', up: '1257,114,1339,272', side: '1348,119,1407,272' },
  // the approved sheet's 64 colours (archived in the pack by the 2026-10-17 revision, which changed the closing: a new k-means would
  // have moved every colour); every view is mapped onto them
  palette: { from: 'art-lab/characters/provenance/blacksmith-x2-v1/palette.png' },
  // the vertical closing only from row 48 down (reconstruct-grid --closing-from=48): above, it
  // filled the background beside the jaw and the neck with its darkest colour (black strokes that read as long hair); below, it
  // restores the dark leg and boot outlines the flood fill takes for background
  options: { closingFrom: 48 },
};

const hexOf = (c) => '#' + c.map((x) => x.toString(16).padStart(2, '0')).join('');

/** recorded edits of the reconstructed views. Front: the background pocket between the legs (reconstructed as a dark block, x 29-34 rows
 *  77-82) and a two-texel closing tail under the left boot removed, then moved 2 rows down (soles on row 90). Back: the closing seam between
 *  the legs (x 30) removed. Profile: mirrored to face left; the far leg's fragments in front of the near leg (a thin shin and the toe of a
 *  boot, both broken by the reconstruction) and a closing strip under the apron removed, the gap in the near boot's instep outline (x 28,
 *  rows 85-86) closed with the outline's colour, then moved 1 texel left (boots centred on the anchor column). (Until the 2026-10-17
 *  revision, the closing strips beside the jaw and the neck were cut back here; there is no closing above row 48 any more.) */
export function prepare(dir, v) {
  if (dir === 'down') return R.shift(R.erase(v, R.or(R.rect(29, 77, 34, 82), R.rect(24, 89, 24, 90))), 0, 2);
  if (dir === 'up') return R.erase(v, R.rect(30, 79, 30, 84));
  const m = R.erase(R.mirror(v), R.or(R.rect(16, 79, 28, 84), R.rect(16, 85, 24, 89), R.rect(20, 74, 21, 77)));
  const c = hexOf(R.get(m, 27, 85));
  return R.shift(R.patch(m, [{ x: 28, y: 85, c }, { x: 28, y: 86, c }]), -1, 0);
}

/** an arm: per row, the span of the skin texels of rows y-1..y+1 inside x0..x1, y0..y1, widened by one texel (the outline), and by `outer`
 *  more on the side away from the body (`inward` = +1: the arm's outer side is -x) where the outline runs two texels from the skin */
function skinSpans(v, x0, x1, y0, y1, outer = 0, inward = 1) {
  const skin = (x, y) => { const c = R.get(v, x, y); if (!c || x < x0 || x > x1) return false; const o = R.oklab(c); return o[0] > 0.6 && Math.hypot(o[1], o[2]) > 0.035; };
  const span = new Map();
  for (let y = y0; y <= y1; y++) {
    let a = 1e9, b = -1;
    for (let yy = Math.max(y0, y - 1); yy <= Math.min(y1, y + 1); yy++) for (let x = x0; x <= x1; x++) if (skin(x, yy)) { a = Math.min(a, x); b = Math.max(b, x); }
    if (b >= 0) span.set(y, [Math.max(x0, a - 1 - (inward > 0 ? outer : 0)), Math.min(x1, b + 1 + (inward < 0 ? outer : 0))]);
  }
  return (x, y) => { const sp = span.get(y); return !!sp && x >= sp[0] && x <= sp[1]; };
}
/** front / back arm swing: the arm's texels between rows y0 (elbow) and y1 (fist bottom) are stretched (dy > 0, forward) or squeezed (dy < 0,
 *  back) by |dy| rows, the fist (the last `fist` rows) rigid, and moved dx texels; texels the arm uncovers take the torso texel next to them
 *  (towards `inward`, up to 2 texels), or become transparent outside the silhouette */
function swingArm(v, m, y0, y1, dy, dx, inward, fist) {
  const inArm = (x, y) => m(x, y) && y >= y0 && y <= y1;
  const arm = R.cut(v, inArm), base = R.erase(v, inArm);
  for (let y = y0; y <= y1; y++) for (let x = 0; x < v.W; x++) {
    if (!inArm(x, y) || !R.opaque(v, x, y)) continue;
    for (let k = 1; k <= 2; k++) { const x2 = x + inward * k; if (!inArm(x2, y) && R.opaque(v, x2, y)) { R.put(base, x, y, R.get(v, x2, y)); break; } }
  }
  return R.over(base, R.shift(R.remapRows(arm, () => true, y0, y1, y0, y1 + dy, 0, fist), dx, 0));
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

/** loose texels: 4-connected islands of fewer than `min` texels lying entirely inside `area` are removed (RotSprite turns and overlapping
 *  boots leave a few around the feet) */
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

// ---- gait: the dock worker's timing (6 frames at 7.5 frames / s, one step = 3 frames) and ankle cycle (13 texels per step); the body is
// lowest on the contact frames, 2 rows below the passing frames (2-texel amplitudes: one-texel moves do not read at ~1.8 screen px / texel)
const CYCLE = [
  { x: 6.5, lift: 0, foot: 4 },    // 0 contact: heel strike in front
  { x: 2.2, lift: 0, foot: 0 },    // 1 mid-stance
  { x: -2.2, lift: 0, foot: 0 },   // 2 push
  { x: -6.5, lift: 3, foot: -12 }, // 3 toe-off behind
  { x: -1, lift: 6, foot: -10 },   // 4 passing: foot lifted under the body, toe down
  { x: 4.5, lift: 3, foot: 3 },    // 5 reach
];
const BOB = [2, 0, 1, 2, 0, 1];

// ---- side (facing left): legs PAINTED in the view's trouser ramp and posed by two-bone IK (the profile shows them merged): the near leg on
// the lit steps, the far one two steps darker so the two never merge; the boot is the view's own (shaft and foot, rows >= 81), moved
// rigidly and turned a little on heel strike / toe-off. The apron hangs in front of the legs and the tool pouch behind: both trail the near
// leg by one frame (up to 3 / 2 texels at the hem); the near arm swings 2 texels against the near leg.
const J = { hip: [31.5, 66.5], knee: [32, 74], ankle: [32.5, 81.5] };
const NEAR = { bands: [[-0.5, '#584a4f'], [0.2, '#4c4758'], [0.55, '#483f48'], [0.8, '#3d3540'], [1, '#322c36']], outline: '#0a0002', ow: 1 };
const FAR = { bands: [[-0.5, '#3d3540'], [0.2, '#322c36'], [0.55, '#27212b'], [0.8, '#211516'], [1, '#19191f']], outline: '#0a0002', ow: 1 };
const APRON = R.and(R.rect(15, 60, 24, 74), (x, y) => y >= 66 || x <= 22);
const POUCH = (x, y) => x >= 38 && y >= 54 && y <= 70;
let SIDE_ARM = null;
/** the vest the moved arm uncovers: its lit front, mid and shaded back tones, one step darker below the chest */
function vestFill(v, m) {
  const span = new Map();
  for (let y = 0; y < v.H; y++) for (let x = 0; x < v.W; x++) if (m(x, y) && R.opaque(v, x, y)) { const s = span.get(y) ?? [x, x]; span.set(y, [Math.min(s[0], x), Math.max(s[1], x)]); }
  return R.recolour(v, (c, x, y) => {
    if (!m(x, y)) return c;
    const [a, b] = span.get(y), low = y >= 57;
    return R.hex(x <= a + 1 ? (low ? '#4c4758' : '#584a4f') : x >= b - 1 ? (low ? '#322c36' : '#3d3540') : (low ? '#3d3540' : '#4c4758'));
  });
}
function sideFrame(v, i) {
  const boot = R.cut(v, (x, y) => y >= 81 && x >= 23), farBoot = R.recolour(boot, R.darkener(R.paletteOf(v), 0.16));
  const A = CYCLE[i], B = CYCLE[(i + 3) % 6], P = CYCLE[(i + 5) % 6];   // P: the near leg one frame earlier (the cloth trails it)
  const l1 = Math.hypot(J.knee[0] - J.hip[0], J.knee[1] - J.hip[1]), l2 = Math.hypot(J.ankle[0] - J.knee[0], J.ankle[1] - J.knee[1]);
  const reach = (a) => J.hip[1] + Math.sqrt(Math.max(0, ((l1 + l2) * 0.985) ** 2 - a.x * a.x));
  // the IK needs a 1-row drop on the passing frames already: the profile's bob is the shared one plus that row
  const drop = Math.max(BOB[i] + 1, ...[A, B].filter((a) => a.lift === 0).map((a) => Math.ceil(J.ankle[1] - reach(a))));
  const hip = [J.hip[0], J.hip[1] + drop];
  const pose = (a, style, bt, lift = a.lift) => {
    const ankle = [J.hip[0] - a.x, J.ankle[1] - lift], k = R.knee(hip, ankle, l1, l2), o = R.blank();
    R.limb(o, { p: [[hip[0], hip[1] - 3], k, ankle], w: [14, 12, 11], ...style });
    return R.over(o, a.foot ? R.transform(bt, J.ankle, ankle, a.foot) : R.shift(bt, Math.round(ankle[0] - J.ankle[0]), Math.round(ankle[1] - J.ankle[1])));
  };
  const near = pose(A, NEAR, boot), planted = A.lift === 0 ? near : pose(B, FAR, farBoot), fix = R.FOOT - R.bottom(planted);
  let far = pose(B, FAR, farBoot);
  if (B.lift > 0) for (let l = B.lift; R.bottom(far) + fix > R.FOOT && l < B.lift + 6; l += 0.5) far = pose(B, FAR, farBoot, l + 0.5);
  let nearL = near;
  if (A.lift > 0) for (let l = A.lift; R.bottom(nearL) + fix > R.FOOT && l < A.lift + 6; l += 0.5) nearL = pose(A, NEAR, boot, l + 0.5);
  const torso = vestFill(R.cut(v, (x, y) => y < 66 || APRON(x, y)), (x, y) => SIDE_ARM(x, y) && y >= 46);
  const cloth = R.over(R.cut(torso, (x, y) => !APRON(x, y) && !POUCH(x, y)), R.shear(R.cut(torso, POUCH), 54, 70, Math.round(P.x / 3.5)),
    R.shear(R.cut(torso, APRON), 62, 74, -Math.round(P.x / 2.2)));
  const body = closeGaps(cloth, (x, y) => y >= 54 && y <= 74, 3, 1);
  const arm = R.shear(R.cut(v, SIDE_ARM), 46, 64, Math.round(A.x / 3.2));   // up to 2 texels at the fist, against the near leg
  const im = R.over(far, nearL, R.shift(body, 0, drop), R.shift(arm, 0, drop));
  return despeckle(R.shift(im, 0, fix), (x, y) => y >= 74);
}

// ---- front (down) / back (up): the dock worker's remap. The body bobs 2 rows; each leg is remapped between its hip band (below the apron in
// front, below the belt behind) and its foot row, the swing leg lifted 3 / 5 / 3 rows; the forearms and fists swing three rows (two in
// between, and one texel inwards forward) against the legs; in front the apron's hem sways 2 texels, trailing the weight shift.
const SWING = [3, 5, 3];
const ARM = [1, 0, -0.5, -1, 0, 0.5];   // how far forward arm 1 (screen right) is; arm 0 is the opposite
const HEM = [-1, -2, -2, 1, 2, 2];
const FB = {
  down: { hipY: 74, top: 2, apron: [64, 75], legs: [{ cols: (x) => x <= 31, foot: 90, bottom: 6, inward: 1 }, { cols: (x) => x >= 32, foot: 89, bottom: 5, inward: -1 }],
    arms: [{ box: [6, 20, 44, 64], y0: 48, y1: 63, fist: 9, inward: 1 }, { box: [44, 56, 44, 64], y0: 48, y1: 63, fist: 9, inward: -1 }] },
  up: { hipY: 66, top: 2, apron: null, legs: [{ cols: (x) => x <= 30, foot: 90, bottom: 9, inward: 1 }, { cols: (x) => x >= 31, foot: 90, bottom: 9, inward: -1 }],
    arms: [{ box: [8, 19, 44, 67], y0: 52, y1: 66, fist: 8, inward: 1, outer: 1 }, { box: [45, 56, 44, 67], y0: 52, y1: 66, fist: 8, inward: -1, outer: 1 }] },
};
// Pass 4A-duovicies (back walk): the arm masks take the outer outline column (two texels from the skin: it stayed put, a detached arm
// outline hanging below the rising fist), and the fist's bottom row (66 = hipY) goes with the arm, not with the leg below it (it stayed
// on the leg, the small tabs under the fist)
function frontBack(v, o, i) {
  const bob = BOB[i], swing = i < 3 ? 1 : 0, k = i % 3;   // frames 0-2: leg 1 (screen right) swings, 3-5: leg 0
  const masks = o.arms.map((a) => skinSpans(v, a.box[0], a.box[1], a.box[2], a.box[3], a.outer ?? 0, a.inward));
  const inArms = (x, y) => o.arms.some((a, j) => masks[j](x, y) && y >= a.y0 && y <= a.y1);
  let upper = R.cut(v, (x, y) => y < o.hipY || inArms(x, y));
  // the legs' copy of the view: an arm texel at or below hipY (it moves with the arm) leaves the leg texel under it in its column (the leg
  // continues up under the fist), else nothing (the fist hung beyond the hip)
  const vLegs = R.clone(v);
  o.arms.forEach((a, j) => { for (let y = o.hipY; y <= a.y1; y++) for (let x = 0; x < v.W; x++) {
    if (!masks[j](x, y) || !R.opaque(v, x, y)) continue;
    let c = null; for (let k = 1; k <= 2 && !c; k++) if (!inArms(x, y + k) && R.opaque(v, x, y + k)) c = R.get(v, x, y + k);
    R.put(vLegs, x, y, c);
  } });
  o.arms.forEach((a, j) => {
    const fwd = j ? ARM[i] : -ARM[i], dy = Math.sign(fwd) * Math.round(3 * Math.abs(fwd)), dx = fwd >= 1 ? a.inward : 0;
    if (dy) upper = swingArm(upper, masks[j], a.y0, a.y1, dy, dx, a.inward, a.fist);
  });
  if (o.apron) upper = R.shear(upper, o.apron[0], o.apron[1], HEM[i]);
  const body = R.shift(upper, 0, bob);
  const legs = o.legs.map((L, j) => {
    const foot = L.foot - (j === swing ? SWING[k] : 0);
    const src = R.cut(vLegs, (x, y) => y >= o.hipY && L.cols(x));
    return R.shift(R.remapRows(src, L.cols, o.hipY, L.foot, o.hipY + bob, foot, o.top, L.bottom), j === swing && k === 1 ? L.inward : 0, 0);
  });
  return R.over(...legs, body);
}

// ---- hammer (side only, the forge's work cycle: 4 frames at 5.5 frames / s; the strike lands on frame 2, when the forge throws its sparks).
// Keys: 0 lift (the hammer comes up in front at chin height, elbow bent), 1 wind-up (the arm back at shoulder height, the forearm up behind
// the neck, the hammer head over the back of the head: the arm does not cross the face or the headband; the body leans back 2 texels),
// 2 strike (arm forward and down, the head below the fist on the anvil; the upper body leans 3 texels forward and drops 2 rows), 3 bounce
// (the head comes up off the anvil, wrist bent): the hammer stays on one side of the body from frame to frame, except the strike itself. The near arm is two segments
// (upper arm about the shoulder, forearm about the elbow, RotSprite), outlined where it crosses the body; the texels it uncovers take the
// vest's tones. The hammer is PAINTED: head in the palette's iron greys, handle in its dark wood browns, a dark rim.
const SHOULDER = [31, 39], ELBOW = [31, 51], FIST = [28, 61.5];
const IRON = ['#8b828d', '#656071', '#4c4758', '#0e0d14'], WOOD = ['#694236', '#4c322e', '#321f20', '#170409'];
/** upper = absolute angle of the upper arm (deg from straight down, + = forward), fore = of the forearm, handle = of the hammer handle;
 *  lean = texels the head moves forward (- = forward, the hips stay), drop = rows the upper body comes down */
const HAMMER = [
  { upper: 25, fore: 150, handle: 115, lean: 0, drop: 0 },    // 0 lift
  { upper: -100, fore: 170, handle: 190, lean: 2, drop: 0 },  // 1 wind-up
  { upper: 25, fore: 65, handle: 70, lean: -3, drop: 2 },     // 2 strike
  { upper: 20, fore: 70, handle: 112, lean: -1, drop: 1 },    // 3 bounce
];
function paintHammer(grip, deg, L = 11) {
  const t = (deg * Math.PI) / 180, d = [-Math.sin(t), Math.cos(t)], n = [d[1], -d[0]], lay = R.blank(), rim = R.blank();
  for (let y = 0; y < lay.H; y++) for (let x = 0; x < lay.W; x++) {
    const px = x + 0.5 - grip[0], py = y + 0.5 - grip[1], a = px * d[0] + py * d[1], b = px * n[0] + py * n[1];
    if (Math.abs(a - L) <= 3 && Math.abs(b) <= 4.4) R.put(lay, x, y, R.hex(a - L < -1.4 ? IRON[0] : a - L > 1.4 ? IRON[2] : IRON[1]));
    else if (a >= 0 && a < L - 3 && Math.abs(b) <= 1.1) R.put(lay, x, y, R.hex(b < -0.3 ? WOOD[0] : b > 0.3 ? WOOD[2] : WOOD[1]));
  }
  const iron = new Set(IRON.slice(0, 3));
  for (let y = 0; y < lay.H; y++) for (let x = 0; x < lay.W; x++) {
    if (R.opaque(lay, x, y)) continue;
    const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([p, q]) => R.get(lay, x + p, y + q)).filter(Boolean);
    if (nb.length) R.put(rim, x, y, R.hex(nb.some((c) => iron.has(hexOf(c))) ? IRON[3] : WOOD[3]));
  }
  return R.over(rim, lay);
}
/** a one-texel dark rim around a layer (drawn under it) */
function rimmed(layer, colour) {
  const rim = R.blank();
  for (let y = 0; y < layer.H; y++) for (let x = 0; x < layer.W; x++) {
    if (R.opaque(layer, x, y)) continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([p, q]) => R.opaque(layer, x + p, y + q))) R.put(rim, x, y, R.hex(colour));
  }
  return R.over(rim, layer);
}
const deg = (a, b) => (Math.atan2(-(b[0] - a[0]), b[1] - a[1]) * 180) / Math.PI;
function hammerFrame(v, h) {
  const arm = SIDE_ARM, upperArm = R.cut(v, (x, y) => arm(x, y) && y <= 53), foreArm = R.cut(v, (x, y) => arm(x, y) && y >= 50);
  const elbow = R.mapPoint(ELBOW, SHOULDER, SHOULDER, h.upper - deg(SHOULDER, ELBOW));
  const fist = R.mapPoint(FIST, ELBOW, elbow, h.fore - deg(ELBOW, FIST));
  const limb = R.over(R.transform(upperArm, SHOULDER, SHOULDER, h.upper - deg(SHOULDER, ELBOW)), R.transform(foreArm, ELBOW, elbow, h.fore - deg(ELBOW, FIST)));
  const up = (x, y) => y < 66;
  const top = R.over(R.cut(vestFill(v, arm), up), paintHammer(fist, h.handle), rimmed(limb, '#0e0d14'));
  // lean: the top row moves `lean` texels, row 66 does not; the upper body drops `drop` rows
  const leaned = R.shift(R.shear(top, 0, 66, -h.lean), h.lean, h.drop);
  return R.over(R.cut(v, (x, y) => !up(x, y)), leaned);
}

export function frames(V) {
  SIDE_ARM = skinSpans(V.side, 22, 39, 37, 65);
  const out = [];
  for (const dir of ['down', 'up', 'side']) {
    const v = V[dir];
    // idle: rest, rest, inhale, exhale with the head one frame late (rig-engine breath, as the approved cast; chin rows: front 39, back 36,
    // profile 35)
    const [inhale, exhale] = R.breath(v, { down: 39, up: 36, side: 35 }[dir]);
    [R.clone(v), R.clone(v), inhale, exhale].forEach((im, i) => out.push({ anim: 'idle', dir, i, im }));
    for (let i = 0; i < 6; i++) out.push({ anim: 'walk', dir, i, im: dir === 'side' ? sideFrame(v, i) : frontBack(v, FB[dir], i) });
  }
  HAMMER.forEach((h, i) => out.push({ anim: 'hammer', dir: 'side', i, im: hammerFrame(V.side, h) }));
  return snapToViews(out, V);
}
