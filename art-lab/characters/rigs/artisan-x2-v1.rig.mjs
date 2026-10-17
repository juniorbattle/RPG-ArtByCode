// Rig of artisan-x2-v1: idle (4 frames) and walk (6 frames) in the three runtime facings, cut out of three reconstructed views of the
// reference sheet 01-16's NPC 03, "Artisan (Female)" (front, back, profile: the sheet's 1st, 3rd and 4th views), one joint 64-colour palette. An ambient
// townsperson of the crowd (Pass 4A-tervicies, replaces a generated crowd variant), shown at the cast's presentation scale (0.9).
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/artisan-x2-v1.rig.mjs`.
import * as R from '../../../tools/art-lab/rig-engine.mjs';

export const id = 'artisan-x2-v1';

export const source = {
  sheet: 'art-lab/characters/reference/sources/merchant-district-night-npc-01-16.webp',
  pitch: 1.775,
  views: { down: '744,118,806,273', up: '892,116,955,274', side: '974,124,1036,274' },
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

/** recorded edits: the profile kept as drawn (unlike the other townsfolk, NPC 03's 4th view on the sheet already faces left, the
 *  runtime's native side: mirroring it made her walk backwards); thin strands and loose islands removed (cleanStrands), one-texel slits
 *  closed (closeSlits); soles on row 90, feet centred on the anchor column (align) */
const ERASE = {  };
export function prepare(dir, v) {
  let o = v;
  if (ERASE[dir]) o = R.erase(o, ERASE[dir]);
  return align(closeSlits(cleanStrands(o)));
}

// ---- the approved merchant's walk (6 frames at 7.5 frames / s, one step = 3 frames): the body (dress included) bobs one row at contact and
// shifts its weight 1 texel over the planted boot (2 in the merchant's), the hem lags behind; each boot is a rigid part drawn BEHIND the dress, planted on row
// 90 or lifted (it slides partly up under the hem). The arms stay still (as the approved merchant's). Measured per view: the last dress
// row (hem), the column between the boots (split); profile: the hip column (the boot: oneBoot).
const P = { down: { hem: 83, split: 30 }, up: { hem: 80, split: 31 }, side: { hem: 84, bootW: 12, stub: [37, 41], hipX: 31 }, chin: { down: 37, up: 37, side: 37 } };
const BOB = [1, 0, 0, 1, 0, 0];
const SWING = [1, 3, 1];                      // lift of the swing boot on frames 0..2 of its swing
const SHIFT = [0, 1, 1, 0, -1, -1];           // weight shift over the planted boot (the merchant's 2 texels read as a sideways slide: blind critique)
const HEM = [-1, -2, -2, 1, 2, 2];            // the hem lags behind the weight shift (texels at the hem)
function frontBack(v, o, i) {
  const bob = BOB[i], swing = i < 3 ? 0 : 1, k = i % 3;   // frames 0-2: boot 0 (screen left) swings, 3-5: boot 1
  // the swing leg's knee lifts the hem on its side by one row at passing
  const half = swing ? (x) => x > o.split : (x) => x <= o.split;
  const dress = R.movePart(R.cut(v, (x, y) => y <= o.hem), (x, y) => y >= o.hem - 7 && half(x), 0, k === 1 ? -1 : 0, swing ? -1 : 1, 0);
  const body = R.shift(R.shear(dress, o.hem - 15, o.hem, HEM[i]), SHIFT[i], bob);
  const boots = [0, 1].map((j) => {
    const b = R.cut(v, (x, y) => y > o.hem && (j ? x > o.split : x <= o.split));
    return R.shift(b, j === swing && k === 1 ? (j ? -1 : 1) : 0, R.FOOT - (j === swing ? SWING[k] : 0) - R.bottom(b));
  });
  const im = R.over(...boots, body);
  // a gap of one or two rows between the hem and a boot (a boot set down to row 90, the body up) takes the boot's top row: its dark shaft
  // goes up under the hem (the lesson of Pass 4A-duovicies: a shoe floating under the hem)
  for (const bt of boots) { const t = R.top(bt); if (t < 3) continue;
    for (let x = 0; x < im.W; x++) { if (!R.opaque(bt, x, t)) continue; let g = 1; while (g <= 3 && !R.opaque(im, x, t - g)) g++;
      if (g >= 2 && g <= 3 && R.opaque(body, x, t - g)) for (let k2 = 1; k2 < g; k2++) R.put(im, x, t - k2, R.get(bt, x, t)); } }
  return im;
}
// profile (facing left): one boot of the view (oneBoot; this view's near shoe is 12 columns wide, `bootW`) and a darker copy for the far one,
// placed by the dock worker's ankle cycle (+ = forward), its ankle (3.5 columns in front of the heel) under the hip column; the hem shears
// forward with the near leg; the far boot's top row, at the hem (`stub`), is not part of the body
const CYCLE = [{ x: 7, lift: 0 }, { x: 2.3, lift: 0 }, { x: -2.3, lift: 0 }, { x: -7, lift: 1 }, { x: -1, lift: 3 }, { x: 4.5, lift: 1 }];
function sideFrame(v, o, i) {
  const [b0] = oneBoot(v, o.hem + 1), b1 = b0 + (o.bootW ?? 9) - 1;
  const boot = R.cut(v, (x, y) => y > o.hem && x >= b0 && x <= b1), far = R.recolour(boot, R.darkener(R.paletteOf(v), 0.1));
  const A = CYCLE[i], B = CYCLE[(i + 3) % 6], bob = BOB[i];
  let cut = R.cut(v, (x, y) => y <= o.hem); if (o.stub) cut = R.erase(cut, R.rect(o.stub[0], o.hem, o.stub[1], o.hem));
  const body = R.shift(R.shear(cut, o.hem - 15, o.hem, -Math.round(A.x / 3.5)), 0, bob);
  const place = (b, a) => R.shift(b, Math.round(o.hipX - a.x - (b1 - 3.5)), -a.lift);
  return R.over(place(far, B), place(boot, A), body);
}

export function frames(V) {
  const out = [];
  for (const dir of ['down', 'up', 'side']) {
    const v = V[dir], o = P[dir];
    // idle: rest, rest, inhale, exhale with the head one frame late (rig-engine breath, as the approved cast)
    const [inhale, exhale] = R.breath(v, P.chin[dir], P.chin[dir] + 3, 62);
    [R.clone(v), R.clone(v), inhale, exhale].forEach((im, i) => out.push({ anim: 'idle', dir, i, im }));
    for (let i = 0; i < 6; i++) out.push({ anim: 'walk', dir, i, im: dir === 'side' ? sideFrame(v, o, i) : frontBack(v, o, i) });
  }
  return out;
}
