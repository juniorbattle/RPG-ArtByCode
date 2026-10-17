// Cut-out rig for baked pixel-art characters (Art Lab, development only; never a runtime / build step). Deterministic, no browser.
// A rig script (art-lab/characters/rigs/<id>.rig.mjs) cuts one reconstructed view into parts (masks in texel coordinates), moves them
// per frame (integer offsets, row remaps, articulated legs) and composites them: every output texel is a texel of the view, never a new
// colour, except where the script asks for a darker palette colour (the far leg). Rotations use the RotSprite principle: the part is
// enlarged x8 with Scale2x (EPX) three times, so straight edges and diagonals survive, then sampled at each rotated texel centre.
// Coordinates: x right, y DOWN, texel (x, y) covers [x, x+1) x [y, y+1). An angle is in degrees, positive = clockwise on screen (a
// downward limb then swings towards -x, i.e. FORWARD for a figure facing left, the native side view of the runtime).
import fs from 'node:fs';
import { decodePng, encodePng } from './png.mjs';

export const FW = 64, FH = 96, FOOT = 90;

export function load(file) { const { W, H, rgba } = decodePng(fs.readFileSync(file)); return { W, H, px: Uint8Array.from(rgba) }; }
export function save(file, im) { fs.writeFileSync(file, encodePng(im.W, im.H, Buffer.from(im.px))); }
export function blank(W = FW, H = FH) { return { W, H, px: new Uint8Array(W * H * 4) }; }
export function clone(im) { return { W: im.W, H: im.H, px: Uint8Array.from(im.px) }; }
export const opaque = (im, x, y) => x >= 0 && y >= 0 && x < im.W && y < im.H && im.px[(y * im.W + x) * 4 + 3] >= 128;
export function get(im, x, y) { if (!opaque(im, x, y)) return null; const i = (y * im.W + x) * 4; return [im.px[i], im.px[i + 1], im.px[i + 2]]; }
export function put(im, x, y, c) {
  if (x < 0 || y < 0 || x >= im.W || y >= im.H) return; const i = (y * im.W + x) * 4;
  if (!c) { im.px[i] = im.px[i + 1] = im.px[i + 2] = im.px[i + 3] = 0; return; }
  im.px[i] = c[0]; im.px[i + 1] = c[1]; im.px[i + 2] = c[2]; im.px[i + 3] = 255;
}
export const hex = (h) => [1, 3, 5].map((o) => parseInt(h.slice(o, o + 2), 16));

// ---------------------------------------------------------------- masks: (x, y) => boolean on texel coordinates (inclusive rects)
export const rect = (x0, y0, x1, y1) => (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
export const poly = (pts) => (x, y) => {
  const px = x + 0.5, py = y + 0.5; let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
export const or = (...m) => (x, y) => m.some((f) => f(x, y));
export const and = (...m) => (x, y) => m.every((f) => f(x, y));
export const not = (m) => (x, y) => !m(x, y);
export const pts = (list) => { const s = new Set(list.map(([x, y]) => `${x},${y}`)); return (x, y) => s.has(`${x},${y}`); };

/** texels of `im` inside `mask`, as a layer of the same size */
export function cut(im, mask) { const o = blank(im.W, im.H); for (let y = 0; y < im.H; y++) for (let x = 0; x < im.W; x++) if (mask(x, y) && opaque(im, x, y)) put(o, x, y, get(im, x, y)); return o; }
export function erase(im, mask) { const o = clone(im); for (let y = 0; y < im.H; y++) for (let x = 0; x < im.W; x++) if (mask(x, y)) put(o, x, y, null); return o; }
/** integer move */
export function shift(im, dx, dy) { const o = blank(im.W, im.H); for (let y = 0; y < im.H; y++) for (let x = 0; x < im.W; x++) if (opaque(im, x, y)) put(o, x + dx, y + dy, get(im, x, y)); return o; }
/** draw layers in order (later ones on top) */
export function over(...layers) { const o = blank(layers[0].W, layers[0].H); for (const l of layers) for (let y = 0; y < l.H; y++) for (let x = 0; x < l.W; x++) if (opaque(l, x, y)) put(o, x, y, get(l, x, y)); return o; }
/** horizontal mirror of the whole frame */
export function mirror(im) { const o = blank(im.W, im.H); for (let y = 0; y < im.H; y++) for (let x = 0; x < im.W; x++) if (opaque(im, x, y)) put(o, im.W - 1 - x, y, get(im, x, y)); return o; }

/** Vertical remap of the texels of `im` inside the column set `cols(x)` between rows [y0, y1] (source) onto [n0, n1] (destination):
 *  rows [y0, y0 + top) and (y1 - bottom, y1] are rigid (moved, not resampled), the middle band is stretched or squeezed by nearest row.
 *  Returns a layer holding only the remapped texels. */
export function remapRows(im, cols, y0, y1, n0, n1, top, bottom) {
  const o = blank(im.W, im.H), srcMid = [y0 + top, y1 - bottom], dstMid = [n0 + top, n1 - bottom];
  const srcRow = (ny) => {
    if (ny < dstMid[0]) return y0 + (ny - n0);
    if (ny > dstMid[1]) return y1 - (n1 - ny);
    const span = dstMid[1] - dstMid[0], sspan = srcMid[1] - srcMid[0];
    return span <= 0 ? srcMid[0] : srcMid[0] + Math.round(((ny - dstMid[0]) * sspan) / span);
  };
  for (let ny = n0; ny <= n1; ny++) { const sy = srcRow(ny); for (let x = 0; x < im.W; x++) if (cols(x) && opaque(im, x, sy)) put(o, x, ny, get(im, x, sy)); }
  return o;
}

/** Moves the texels of `im` inside `mask` by (dx, dy). A texel the part uncovers takes the colour of the nearest opaque texel outside the
 *  part in its row, searched towards `toward` (+1 = +x, -1 = -x) up to `reach` texels; none = transparent (it was silhouette). */
export function movePart(im, mask, dx, dy, toward, reach = 3) {
  const fill = erase(im, mask);
  for (let y = 0; y < im.H; y++) for (let x = 0; x < im.W; x++) {
    if (!mask(x, y) || !opaque(im, x, y)) continue;
    for (let k = 1; k <= reach; k++) { const x2 = x + toward * k; if (!mask(x2, y) && opaque(im, x2, y)) { put(fill, x, y, get(im, x2, y)); break; } }
  }
  return over(fill, shift(cut(im, mask), dx, dy));
}

/** Breath with overlap (idle frames 2 and 3): inhale = rows [chest, cut - 5] stretched by one row, everything above one row up; exhale =
 *  the shoulders back down while the head (rows < neck) stays one row up a frame longer (neck rows stretched). Rows >= `cut` never move. */
export function breath(v, neck, chest = 44, cutY = 62) {
  const lower = cut(v, (x, y) => y >= cutY), upper = cut(v, (x, y) => y < cutY), all = () => true;
  return [over(lower, remapRows(upper, all, 0, cutY - 1, -1, cutY - 1, chest, 4)), over(lower, remapRows(upper, all, 0, cutY - 1, -1, cutY - 1, neck, cutY - 1 - (neck + 3)))];
}

/** horizontal shear of a layer: rows y0..y1 move by round(amp * (y - y0) / (y1 - y0)) (rows below y1 by amp) */
export function shear(im, y0, y1, amp) {
  const o = blank(im.W, im.H);
  for (let y = 0; y < im.H; y++) { const d = y < y0 ? 0 : y > y1 ? amp : Math.round((amp * (y - y0)) / Math.max(1, y1 - y0)); for (let x = 0; x < im.W; x++) if (opaque(im, x, y)) put(o, x + d, y, get(im, x, y)); }
  return o;
}

// ---------------------------------------------------------------- RotSprite-style rotation
function key(px, i) { return px[i + 3] < 128 ? -1 : (px[i] << 16) | (px[i + 1] << 8) | px[i + 2]; }
/** Scale2x (EPX) of a key grid */
function scale2x(k, W, H) {
  const o = new Int32Array(W * H * 4), W2 = W * 2, g = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? -1 : k[y * W + x]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const P = g(x, y), A = g(x, y - 1), B = g(x + 1, y), C = g(x - 1, y), D = g(x, y + 1);
    o[(2 * y) * W2 + 2 * x] = C === A && C !== D && A !== B ? A : P;
    o[(2 * y) * W2 + 2 * x + 1] = A === B && A !== C && B !== D ? B : P;
    o[(2 * y + 1) * W2 + 2 * x] = D === C && D !== B && C !== A ? C : P;
    o[(2 * y + 1) * W2 + 2 * x + 1] = B === D && B !== A && D !== C ? D : P;
  }
  return o;
}
/** x8 EPX enlargement of a layer (keys: -1 = transparent, else 0xRRGGBB) */
export function up8(im) {
  let k = new Int32Array(im.W * im.H), W = im.W, H = im.H;
  for (let i = 0; i < W * H; i++) k[i] = key(im.px, i * 4);
  for (let s = 0; s < 3; s++) { k = scale2x(k, W, H); W *= 2; H *= 2; }
  return { k, W, H };
}
/** Rigid transform of a layer: the source point `pivot` lands on `to`, rotated by `deg`. Inverse mapping on the x8 EPX image. */
export function transform(im, pivot, to, deg, big = up8(im)) {
  const o = blank(im.W, im.H), t = (-deg * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t);
  for (let y = 0; y < im.H; y++) for (let x = 0; x < im.W; x++) {
    const dx = x + 0.5 - to[0], dy = y + 0.5 - to[1];
    const sx = pivot[0] + dx * c - dy * s, sy = pivot[1] + dx * s + dy * c;
    const ux = Math.floor(sx * 8), uy = Math.floor(sy * 8);
    if (ux < 0 || uy < 0 || ux >= big.W || uy >= big.H) continue;
    const v = big.k[uy * big.W + ux]; if (v < 0) continue;
    put(o, x, y, [(v >> 16) & 255, (v >> 8) & 255, v & 255]);
  }
  return o;
}
/** forward map of a point by the same transform */
export function mapPoint(p, pivot, to, deg) { const t = (deg * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t), dx = p[0] - pivot[0], dy = p[1] - pivot[1]; return [to[0] + dx * c - dy * s, to[1] + dx * s + dy * c]; }

/** Articulated leg. `src` = the leg's texels (a layer), joints in source coordinates: hip, knee, ankle (points, not texels).
 *  Segments: thigh = source rows <= knee.y + overlap, shin = rows in [knee.y - overlap, ankle.y + overlap], foot = rows >= ankle.y.
 *  Pose: hip destination, thigh angle, shin angle and foot angle (all ABSOLUTE, from the vertical). Drawn foot, shin, thigh (thigh on top). */
export function leg(src, j, pose, overlap = 2) {
  const seg = (lo, hi) => cut(src, (x, y) => y + 0.5 >= lo && y + 0.5 <= hi);
  const thigh = seg(-1e9, j.knee[1] + overlap), shin = seg(j.knee[1] - overlap, j.ankle[1] + overlap), foot = seg(j.ankle[1], 1e9);
  const knee = mapPoint(j.knee, j.hip, pose.hip, pose.thigh), ankle = mapPoint(j.ankle, j.knee, knee, pose.shin);
  const layers = [transform(foot, j.ankle, ankle, pose.foot), transform(shin, j.knee, knee, pose.shin), transform(thigh, j.hip, pose.hip, pose.thigh)];
  return { layer: over(...layers), knee, ankle };
}

/** angle of the vector a -> b from the downward vertical, degrees, + = towards -x (forward for a figure facing left) */
export const angleOf = (a, b) => (Math.atan2(-(b[0] - a[0]), b[1] - a[1]) * 180) / Math.PI;
/** Two-bone IK: knee position for a hip `h`, an ankle target `t`, bone lengths l1 / l2; the knee bends towards -x (forward). The target
 *  is pulled in to 99.5 % of the reach when the leg cannot reach it. */
export function knee(h, t, l1, l2) {
  let dx = t[0] - h[0], dy = t[1] - h[1], d = Math.hypot(dx, dy);
  const max = (l1 + l2) * 0.995; if (d > max) { dx *= max / d; dy *= max / d; d = max; }
  const a = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)))), ux = dx / d, uy = dy / d;
  // rotate the hip -> target direction by a, choosing the side whose knee lies further towards -x
  const r = (s) => [h[0] + l1 * (ux * Math.cos(s * a) - uy * Math.sin(s * a)), h[1] + l1 * (ux * Math.sin(s * a) + uy * Math.cos(s * a))];
  const k1 = r(1), k2 = r(-1);
  return k1[0] < k2[0] ? k1 : k2;
}
/** Leg posed by its ankle: IK knee, then `leg` with the rotations that bring each bone from its source angle to its posed angle. */
export function legTo(src, j, hip, ankle, footDeg, overlap = 2) {
  const l1 = Math.hypot(j.knee[0] - j.hip[0], j.knee[1] - j.hip[1]), l2 = Math.hypot(j.ankle[0] - j.knee[0], j.ankle[1] - j.knee[1]);
  const k = knee(hip, ankle, l1, l2);
  const thigh = angleOf(hip, k) - angleOf(j.hip, j.knee), shin = angleOf(k, ankle) - angleOf(j.knee, j.ankle);
  // `leg` rotates clockwise for +deg; angleOf is + towards -x, which IS clockwise for a downward bone: same sign
  return leg(src, j, { hip, thigh, shin, foot: footDeg }, overlap);
}

/** A limb painted in the figure's own palette (for limbs the source view only shows merged, e.g. two legs in a profile): a chain of
 *  tapered segments (points p[i], widths w[i]) with round inner joints and a flat far end. Shading across the limb by the signed distance
 *  to its axis (+ = towards the limb's right-hand normal: the BACK of a downward limb of a figure facing left): `bands` = [[s, colour]...]
 *  sorted by s, the first band whose s >= the texel's value wins. Edge texels (within `ow` texels of the outside) take `outline`.
 *  `endBands` = [[t, colour]] paints the last part of the chain (t = distance in texels from the far end) instead, e.g. a cuff. */
export function limb(o, { p, w, bands, outline, ow = 2, endBands = [], endOutline = null }) {
  const W = o.W, H = o.H, mask = new Int8Array(W * H).fill(-1), col = new Array(W * H);
  let total = 0; const segs = [];
  for (let i = 0; i + 1 < p.length; i++) { const L = Math.hypot(p[i + 1][0] - p[i][0], p[i + 1][1] - p[i][1]); segs.push({ a: p[i], b: p[i + 1], wa: w[i], wb: w[i + 1], L, start: total }); total += L; }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const P = [x + 0.5, y + 0.5]; let best = null;
    segs.forEach((s, k) => {
      const dx = s.b[0] - s.a[0], dy = s.b[1] - s.a[1], t0 = ((P[0] - s.a[0]) * dx + (P[1] - s.a[1]) * dy) / (s.L * s.L);
      const last = k === segs.length - 1;
      if (last && t0 > 1) return;                                                  // flat far end
      const t = Math.max(0, Math.min(1, t0)), cx = s.a[0] + dx * t, cy = s.a[1] + dy * t, half = (s.wa + (s.wb - s.wa) * t) / 2;
      const d = Math.hypot(P[0] - cx, P[1] - cy); if (d > half) return;
      const nx = dy / s.L, ny = -dx / s.L, side = ((P[0] - cx) * nx + (P[1] - cy) * ny) / half;
      const along = s.start + t * s.L;
      if (!best || d / half < best.r) best = { r: d / half, side, fromEnd: total - along };
    });
    if (!best) continue;
    const eb = endBands.find(([t]) => best.fromEnd <= t);
    mask[y * W + x] = 1; col[y * W + x] = { c: eb ? eb[1] : (bands.find(([sv]) => best.side <= sv) ?? bands[bands.length - 1])[1], end: !!eb };
  }
  const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H && mask[y * W + x] > 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!inside(x, y)) continue;
    let edge = false;
    for (let dy = -ow; dy <= ow && !edge; dy++) for (let dx = -ow; dx <= ow && !edge; dx++) if (Math.abs(dx) + Math.abs(dy) <= ow && !inside(x + dx, y + dy)) edge = true;
    const e = col[y * W + x];
    put(o, x, y, hex(edge ? (e.end && endOutline ? endOutline : outline) : e.c));
  }
  return o;
}

/** lowest opaque row of a layer (-1 if empty) */
export function bottom(im) { for (let y = im.H - 1; y >= 0; y--) for (let x = 0; x < im.W; x++) if (opaque(im, x, y)) return y; return -1; }
export function top(im) { for (let y = 0; y < im.H; y++) for (let x = 0; x < im.W; x++) if (opaque(im, x, y)) return y; return -1; }

// ---------------------------------------------------------------- palette helpers
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
export const oklab = ([r, g, b]) => { const R = lin(r), G = lin(g), B = lin(b); const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B), m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B), s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B); return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s]; };
export function paletteOf(...ims) { const m = new Map(); for (const im of ims) for (let y = 0; y < im.H; y++) for (let x = 0; x < im.W; x++) { const c = get(im, x, y); if (c) m.set(c.join(','), c); } return [...m.values()].sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]); }
/** every colour -> the palette colour nearest to it once darkened by dL in OKLab lightness (hue and chroma kept) */
export function darkener(pal, dL) {
  const pl = pal.map(oklab), memo = new Map();
  return (c) => { const k = c.join(','); if (memo.has(k)) return memo.get(k); const q = oklab(c); q[0] -= dL; let bi = 0, bd = 1e9; pl.forEach((p, i) => { const d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2; if (d < bd) { bd = d; bi = i; } }); memo.set(k, pal[bi]); return pal[bi]; };
}
export function recolour(im, fn) { const o = blank(im.W, im.H); for (let y = 0; y < im.H; y++) for (let x = 0; x < im.W; x++) { const c = get(im, x, y); if (c) put(o, x, y, fn(c, x, y)); } return o; }

/** recorded pixel edits: [{x, y, c: "#rrggbb" | null}] */
export function patch(im, list) { const o = clone(im); for (const p of list) put(o, p.x, p.y, p.c ? hex(p.c) : null); return o; }

// ---------------------------------------------------------------- frame checks (BakedSprites.checkBakedSheet, section 3 of the contract)
export function check(name, im, anim) {
  const err = []; let ring = 0, last = -1, semi = 0;
  for (let y = 0; y < im.H; y++) for (let x = 0; x < im.W; x++) {
    const a = im.px[(y * im.W + x) * 4 + 3]; if (a && a !== 255) semi++; if (a < 128) continue;
    last = y; if (!x || !y || x === im.W - 1 || y === im.H - 1) ring++;
  }
  if (semi) err.push(`${semi} semi-transparent texels`);
  if (ring) err.push(`${ring} texels on the border ring`);
  if (last > FOOT) err.push(`last opaque row ${last} below the foot row ${FOOT}`);
  if (anim === 'idle' && last !== FOOT) err.push(`idle frame must stand on row ${FOOT} (last row ${last})`);
  if (err.length) throw new Error(`${name}: ${err.join('; ')}`);
}
