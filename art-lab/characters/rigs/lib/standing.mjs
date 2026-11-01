// A person who only stands (journal Passes CA1 / CA2, the operator's T1 « Debout, sauf Marek et Orla »): idle (4 frames) in the three runtime
// facings, 12 frames, cut out of three reconstructed views of a reference sheet, one joint palette. No walk: the rig's recipe is the crop of each
// view (`views`), the pitch, which views are mirrored to face left (the runtime's native side) and the recorded erasures (`erase`, in the aligned view's
// coordinates, `[x0, y0, x1, y1]` boxes). `build-character.mjs` drives it like any rig.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as R from '../../../../tools/art-lab/rig-engine.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');

/** the figure alone: its largest connected part, the others (a neighbouring view's edge, the ground shadow's specks) removed unless they reach `keep` texels */
function largest(v, keep = 200) {
  const comps = [], seen = new Uint8Array(v.W * v.H);
  for (let y = 0; y < v.H; y++) for (let x = 0; x < v.W; x++) {
    if (seen[y * v.W + x] || !R.opaque(v, x, y)) continue;
    const comp = [], st = [[x, y]]; seen[y * v.W + x] = 1;
    while (st.length) { const [a, b] = st.pop(); comp.push([a, b]); for (const [p, q] of [[a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]]) if (p >= 0 && q >= 0 && p < v.W && q < v.H && !seen[q * v.W + p] && R.opaque(v, p, q)) { seen[q * v.W + p] = 1; st.push([p, q]); } }
    comps.push(comp);
  }
  comps.sort((a, b) => b.length - a.length);
  const o = R.clone(v);
  comps.forEach((c, i) => { if (i && c.length < keep) for (const [a, b] of c) R.put(o, a, b, null); });
  return o;
}
/** the sheet's ground shadow under the soles: in the lowest rows, what stands wider than the legs eight to twelve rows above them, then the rows under the
 *  soles that hold only near-black, low-chroma texels */
function deshadow(v, floor, reach = 9) {
  const o = R.clone(v); let b = R.bottom(o), x0 = 64, x1 = -1;
  for (let y = b - 12; y <= b - 8; y++) for (let x = 0; x < v.W; x++) if (R.opaque(o, x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
  for (let y = b - 6; y <= b; y++) for (let x = 0; x < v.W; x++) if (R.opaque(o, x, y) && (x < x0 - 2 || x > x1 + 2)) R.put(o, x, y, null);
  for (let guard = 0; guard < 8; guard++) {
    b = R.bottom(o); let n = 0, dark = 0;
    for (let x = 0; x < v.W; x++) { const c = R.get(o, x, b); if (!c) continue; n++; const q = R.oklab(c); if ((q[0] < 0.27 && Math.hypot(q[1], q[2]) < 0.05) || (q[0] < 0.6 && Math.hypot(q[1], q[2]) < 0.02)) dark++; }
    if (n && dark / n < 0.75) break;
    for (let x = 0; x < v.W; x++) R.put(o, x, b, null);
  }
  // the grey sheet's darkest shadow under a hem: near-black, low-chroma texels of the lowest rows (the rig's `floor`)
  if (floor) { b = R.bottom(o); for (let y = b - 6; y <= b; y++) for (let x = 0; x < v.W; x++) { const c = R.get(o, x, y); if (!c) continue; const q = R.oklab(c); if (q[0] < 0.24 && Math.hypot(q[1], q[2]) < 0.06) R.put(o, x, y, null); } }
  // the grey sheet's shadow left between the feet: low-chroma mid greys of the lowest rows, reached from the frame's outside
  const grey = (x, y) => { const c = R.get(o, x, y); if (!c) return false; const q = R.oklab(c); return q[0] > 0.3 && q[0] < (reach > 9 ? 0.52 : 0.62) && Math.hypot(q[1], q[2]) < 0.03; };
  b = R.bottom(o);
  for (let pass = 0; pass < 12; pass++) for (let y = b - reach; y <= b; y++) for (let x = 1; x < v.W - 1; x++) if (grey(x, y) && (!R.opaque(o, x - 1, y) || !R.opaque(o, x + 1, y) || (y < v.H - 1 && !R.opaque(o, x, y + 1)))) R.put(o, x, y, null);
  return o;
}
/** the silhouette's loose texels (the blind critique of journal Passe CA2: « points flottants », « bords hachés »): a texel held by at most one
 *  of its four neighbours goes, and one-texel-wide vertical strands standing free on both sides, two passes */
function tidy(v) {
  let o = R.clone(v);
  for (let pass = 0; pass < 2; pass++) {
    const n = R.clone(o);
    for (let y = 1; y < v.H - 1; y++) for (let x = 1; x < v.W - 1; x++) {
      if (!R.opaque(o, x, y)) continue;
      const c = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([a, b]) => R.opaque(o, x + a, y + b)).length;
      if (c <= 1 && y < R.bottom(o)) R.put(n, x, y, null);
    }
    for (let x = 1; x < v.W - 1; x++) for (let y = 24; y < v.H; y++) {
      if (!R.opaque(n, x, y) || R.opaque(n, x - 1, y) || R.opaque(n, x + 1, y)) continue;
      let e = y; while (e + 1 < v.H && R.opaque(n, x, e + 1) && !R.opaque(n, x - 1, e + 1) && !R.opaque(n, x + 1, e + 1)) e++;
      if (e - y >= 2) for (let k = y; k <= e; k++) R.put(n, x, k, null);
      y = e;
    }
    o = n;
  }
  return o;
}
/** the head enlarged (the operator's note on the lot sheet: « des differences de proportions »; the operator's answer « Agrandir les têtes », journal Passe CA3): the
 *  rows above the chin scaled by k from the chin's centre, nearest texel, the rest of the figure kept; the cast's heads are 29 to 36 texels wide, the
 *  figures of the combat casting 23 to 28 */
function bigHead(v, chinFrac, k) {
  const top = R.top(v), H = R.FOOT - top, chin = top + Math.round(H * chinFrac); let a = 64, b = -1;
  for (let y = top; y < chin; y++) for (let x = 0; x < R.FW; x++) if (R.opaque(v, x, y)) { a = Math.min(a, x); b = Math.max(b, x); }
  const cx = (a + b) / 2, o = R.erase(v, (x, y) => y < chin - 1), newTop = Math.round(chin - (chin - top) * k);
  if (newTop < 1) throw new Error(`head enlarged above the frame (row ${newTop}): raise the pitch`);
  for (let y = newTop; y < chin; y++) for (let x = 1; x < R.FW - 1; x++) {
    const sx = Math.round(cx + (x - cx) / k), sy = Math.round(chin + (y - chin) / k), c = sy < chin ? R.get(v, sx, sy) : null;
    if (c) R.put(o, x, y, c);
  }
  return o;
}
/** gold embroidery and emblems out of a cloth (the operator's note « enleve les signes/emblemes », answer « Fleurs de lys et emblèmes »): inside each box, a gold
 *  texel takes the nearest texel of its row that is not gold; the gold borders, outside the boxes, stay */
function deEmblem(v, boxes) {
  const gold = (c) => { const q = R.oklab(c); return q[2] > 0.05 && q[1] > -0.03 && q[1] < 0.1 && q[0] > 0.32; };
  const o = R.clone(v);
  for (const [x0, y0, x1, y1] of boxes) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const c = R.get(v, x, y); if (!c || !gold(c)) continue;
    let f = null; for (let d = 1; d <= 16 && !f; d++) for (const e of [x - d, x + d]) { const n = R.get(v, e, y); if (n && !gold(n) && R.oklab(n)[0] > 0.2) { f = n; break; } }
    if (f) R.put(o, x, y, f);
  }
  return o;
}
/** a large emblem on a plain cloth: its gold gone, its pale ghost stayed, so each row of the box takes the median light of the cloth four columns either side
 *  of it, its own row and the next (the first version copied the texel at the box's edge, often a fold's shadow: « bloc sombre carré », the third critique) */
function plainCloth(v, boxes) {
  const o = R.clone(v);
  for (const [x0, y0, x1, y1] of boxes) for (let y = y0; y <= y1; y++) {
    const near = [];
    for (const yy of [y - 1, y, y + 1]) for (const x of [x0 - 4, x0 - 3, x0 - 2, x0 - 1, x1 + 1, x1 + 2, x1 + 3, x1 + 4]) { const c = R.get(v, x, yy); if (c && R.oklab(c)[0] > 0.3) near.push(c); }
    if (!near.length) continue;
    near.sort((p, q) => R.oklab(p)[0] - R.oklab(q)[0]);
    const c = near[Math.floor(near.length * 0.6)];
    for (let x = x0; x <= x1; x++) if (R.opaque(v, x, y)) R.put(o, x, y, c);
  }
  return o;
}
/** soles on the foot row and the feet (the lowest three rows) centred on the anchor column 31.5 */
function align(v) {
  const b = R.bottom(v); let x0 = 64, x1 = 0;
  for (let y = b - 2; y <= b; y++) for (let x = 0; x < v.W; x++) if (R.opaque(v, x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
  const dx = Math.round(31.5 - (x0 + x1) / 2); let l = 64, r = -1;
  for (let y = 0; y < v.H; y++) for (let x = 0; x < v.W; x++) if (R.opaque(v, x, y)) { l = Math.min(l, x); r = Math.max(r, x); }
  // a cape or a pack wider on one side: the figure stays inside the frame's ring, its feet a little off the anchor
  return R.shift(v, Math.max(1 - l, Math.min(62 - r, dx)), R.FOOT - b);
}

// ---- a person who also walks (Marek, Orla, in their cutscenes). Profile: the frames the sheet draws (`walk.boxes`, its side walk row, smaller than
// its idle row: `walk.pitch`), reconstructed one by one and mapped onto the views' palette. Front and back: the approved guard's walk, legs lifted under
// a body that bobs, with the crotch row and the column between the legs measured per view.
const BOB = [2, 0, 1, 2, 0, 1], SWING = [3, 5, 3], SHIFT = [0, 1, 1, 0, -1, -1], HEM = [-1, -2, -2, 1, 2, 2];
function frontBack(v, o, i) {
  const swing = i < 3 ? 1 : 0, k = i % 3;
  const body = R.shift(R.shear(R.cut(v, (x, y) => y < o.crotch), o.crotch - 12, o.crotch, HEM[i]), SHIFT[i], BOB[i]);
  const legs = [0, 1].map((j) => R.shift(R.cut(v, (x, y) => y >= o.crotch && (j ? x > o.split : x <= o.split)), j === swing && k === 1 ? (j ? -1 : 1) : 0, j === swing ? -SWING[k] : 0));
  return R.over(...legs, body);
}
/** the side walk's frames, reconstructed in a temporary folder, on the views' palette, facing left, the body (rows above the legs) on the anchor */
function sideWalk(sheet, walk, options, pal) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'artlab-walk-')), near = new Map();
  const map = (c) => { const k = c.join(); if (!near.has(k)) { const q = R.oklab(c); let best = pal[0], d = 1e9; for (const e of pal) { const t = R.oklab(e), n = (t[0] - q[0]) ** 2 + (t[1] - q[1]) ** 2 + (t[2] - q[2]) ** 2; if (n < d) { d = n; best = e; } } near.set(k, best); } return near.get(k); };
  const opts = [...(options.bgThreshold ? [`--bg-threshold=${options.bgThreshold}`] : []), ...(options.closingFrom ? [`--closing-from=${options.closingFrom}`] : [])];
  const made = walk.boxes.map((box, i) => {
    const pre = path.join(dir, `w${i}`);
    execFileSync(process.execPath, [path.join(ROOT, 'tools/art-lab/reconstruct-grid.mjs'), path.join(ROOT, sheet), box, String(walk.pitch), String(R.FW), String(R.FH), String(R.FOOT), pre, 'full', ...opts], { stdio: 'ignore' });
    return R.recolour(tidy(deshadow(largest(walk.mirror ? R.mirror(R.load(`${pre}-full.png`)) : R.load(`${pre}-full.png`)), true, 20)), map);
  });
  fs.rmSync(dir, { recursive: true, force: true });
  return (walk.order ?? [0, 1, 2, 3, 4, 5]).map((i) => {
    const v = made[i], top = R.top(v); let l = 64, r = -1;
    for (let y = top; y < top + 45; y++) for (let x = 0; x < v.W; x++) if (R.opaque(v, x, y)) { l = Math.min(l, x); r = Math.max(r, x); }
    // on the body, what passes the frame's ring cut off: a neighbouring frame's cape touching this one, on a row that overlaps
    const c = R.erase(R.shift(v, Math.round(31.5 - (l + r) / 2), R.FOOT - R.bottom(v)), (x) => x <= 0 || x >= R.FW - 1);
    return walk.head ? bigHead(largest(c), walk.head.chin ?? 0.3, walk.head.k) : largest(c);
  });
}

export function standing({ id, sheet, pitch, views, mirror = [], options = { closingFrom: 48 }, k = 64, erase = {}, chest = 0.5, floor = false, walk = null, pocket = null, head = null, emblem = {}, plain = {} }) {
  const source = { sheet, pitch, views, palette: { k }, options };
  const prepare = (dir, v) => {
    // `pocket`: the sheet's background colour enclosed between the legs (the second blind critique's « tampon gris »), a colour of the palette; only for a
    // figure whose legs hold no steel of the same grey
    const raw = pocket ? R.erase(v, (x, y) => { const c = y >= 60 && R.get(v, x, y); return !!c && Math.abs(c[0] - pocket[0]) + Math.abs(c[1] - pocket[1]) + Math.abs(c[2] - pocket[2]) <= 6; }) : v;
    let o = align(deshadow(largest(mirror.includes(dir) ? R.mirror(raw) : raw), floor));
    for (const b of erase[dir] ?? []) o = R.erase(o, R.rect(...b));
    o = align(largest(tidy(o)));
    if (emblem[dir]) o = deEmblem(o, emblem[dir]);
    if (plain[dir]) o = plainCloth(o, plain[dir]);
    return head ? bigHead(o, head.chin ?? 0.3, head.k) : o;
  };
  const frames = (V) => {
    const out = [];
    for (const dir of ['down', 'up', 'side']) {
      const v = V[dir], top = R.top(v), h = R.FOOT - top, neck = top + Math.round(h * 0.33), mid = top + Math.round(h * chest);
      const [inhale, exhale] = R.breath(v, neck, neck + 3, mid);
      [R.clone(v), R.clone(v), inhale, exhale].forEach((im, i) => out.push({ anim: 'idle', dir, i, im }));
      if (walk && dir !== 'side') for (let i = 0; i < 6; i++) out.push({ anim: 'walk', dir, i, im: frontBack(v, walk[dir], i) });
    }
    if (walk) sideWalk(sheet, walk, options, R.paletteOf(V.down, V.up, V.side)).forEach((im, i) => out.push({ anim: 'walk', dir: 'side', i, im }));
    return out;
  };
  return { id, source, prepare, frames };
}
