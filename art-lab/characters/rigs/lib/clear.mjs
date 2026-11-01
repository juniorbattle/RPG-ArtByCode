// The casting's second recipe (journal Passe CA4, the operator's note: « cela manque clairement de clarte et de nettete »): a figure redrawn on a clean generated sheet, far larger
// than the sprite, reconstructed on three views, one joint palette. The body at the pitch of its height; the head at a finer pitch from the same source, so an
// enlarged head holds real detail where the first recipe (standing.mjs) could only stretch its texels: `head` is how much larger, `chin` the share of the figure it covers.
// `walk`: the side walk drawn on the sheet, same recipe frame by frame; front and back walk as the approved guard. `build-character.mjs` drives it like any rig.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as R from '../../../../tools/art-lab/rig-engine.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');

function reconstruct(sheet, box, pitch) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'artlab-clear-')), pre = path.join(dir, 'r');
  execFileSync(process.execPath, [path.join(ROOT, 'tools/art-lab/reconstruct-grid.mjs'), path.join(ROOT, sheet), box, String(pitch), String(R.FW), String(R.FH), String(R.FOOT), pre, 'full', '--closing-from=48', '--no-shadow'], { stdio: 'ignore' });
  const im = R.load(`${pre}-full.png`);
  fs.rmSync(dir, { recursive: true, force: true });
  return im;
}
/** the figure alone: its largest connected part, the others removed unless they reach `keep` texels */
function largest(v, keep = 120) {
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
const span = (v, y0, y1) => { let a = 64, b = -1; for (let y = y0; y < y1; y++) for (let x = 0; x < v.W; x++) if (R.opaque(v, x, y)) { a = Math.min(a, x); b = Math.max(b, x); } return [a, b]; };
/** the colours of `from` on the view's palette */
function onPalette(im, pal) {
  const memo = new Map();
  return R.recolour(im, (c) => { const k = c.join(); if (!memo.has(k)) { const q = R.oklab(c); let best = pal[0], d = 1e9; for (const e of pal) { const t = R.oklab(e), n = (t[0] - q[0]) ** 2 + (t[1] - q[1]) ** 2 + (t[2] - q[2]) ** 2; if (n < d) { d = n; best = e; } } memo.set(k, best); } return memo.get(k); });
}
/** the rows above the chin rebuilt from the source at pitch / k, chin on chin, head centred on head */
function fineHead(body, sheet, box, pitch, k, chinShare) {
  const [x0, y0, x1, y1] = box.split(',').map(Number), top = `${x0},${y0},${x1},${Math.round(y0 + (y1 - y0) * 0.5)}`;
  const fine = onPalette(largest(reconstruct(sheet, top, pitch / k)), R.paletteOf(body));
  const t0 = R.top(body), chin = t0 + Math.round((R.FOOT - t0) * chinShare), f0 = R.top(fine), chinF = f0 + (chin - t0) * k;
  const [a, b] = span(body, t0, chin), [c, d] = span(fine, f0, Math.round(chinF)), dx = (a + b) / 2 - (c + d) / 2, o = R.erase(body, (x, y) => y < chin);
  for (let y = f0; y < chinF && y < R.FH; y++) for (let x = 0; x < R.FW; x++) {
    const col = R.get(fine, x, y); if (!col) continue;
    const X = Math.round(x + dx), Y = Math.round(y - chinF + chin);
    if (Y < 1) throw new Error(`head above the frame (row ${Y}): lower \`rows\``);
    if (X > 0 && X < R.FW - 1) R.put(o, X, Y, col);
  }
  return o;
}
/** soles on the foot row, the feet on the anchor column, the figure inside the frame's ring */
function align(v) {
  const b = R.bottom(v); let x0 = 64, x1 = 0;
  for (let y = b - 2; y <= b; y++) for (let x = 0; x < v.W; x++) if (R.opaque(v, x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
  const dx = Math.round(31.5 - (x0 + x1) / 2), [l, r] = span(v, 0, v.H);
  return R.shift(v, Math.max(1 - l, Math.min(62 - r, dx)), R.FOOT - b);
}

// ---- front and back: the approved guard's walk
const BOB = [2, 0, 1, 2, 0, 1], SWING = [3, 5, 3], SHIFT = [0, 1, 1, 0, -1, -1], HEM = [-1, -2, -2, 1, 2, 2];
function frontBack(v, o, i) {
  const swing = i < 3 ? 1 : 0, k = i % 3;
  const body = R.shift(R.shear(R.cut(v, (x, y) => y < o.crotch), o.crotch - 12, o.crotch, HEM[i]), SHIFT[i], BOB[i]);
  const legs = [0, 1].map((j) => R.shift(R.cut(v, (x, y) => y >= o.crotch && (j ? x > o.split : x <= o.split)), j === swing && k === 1 ? (j ? -1 : 1) : 0, j === swing ? -SWING[k] : 0));
  return R.over(...legs, body);
}

export function clearRig({ id, sheet, views, rows = 84, head = 1, chin = 0.28, k = 48, walk = null }) {
  const h = (box) => { const b = box.split(',').map(Number); return b[3] - b[1]; }, pitch = +(h(views.down) / rows).toFixed(3);
  const source = { sheet, pitch, views, palette: { k }, options: { closingFrom: 48, noShadow: true } };
  const prepare = (dir, v) => {
    const o = largest(v);
    return align(head > 1 ? fineHead(o, sheet, views[dir], pitch, head, chin) : o);
  };
  const frames = (V) => {
    const out = [], pal = R.paletteOf(V.down, V.up, V.side);
    for (const dir of ['down', 'up', 'side']) {
      const v = V[dir], top = R.top(v), hh = R.FOOT - top, neck = top + Math.round(hh * 0.33), mid = top + Math.round(hh * 0.5);
      const [inhale, exhale] = R.breath(v, neck, neck + 3, mid);
      [R.clone(v), R.clone(v), inhale, exhale].forEach((im, i) => out.push({ anim: 'idle', dir, i, im }));
      if (walk && dir !== 'side') for (let i = 0; i < 6; i++) out.push({ anim: 'walk', dir, i, im: frontBack(v, walk[dir], i) });
    }
    if (walk) walk.boxes.forEach((box, i) => {
      const p = +(h(box) / rows).toFixed(3), v = onPalette(largest(reconstruct(walk.sheet, box, p)), pal), f = head > 1 ? fineHead(v, walk.sheet, box, p, head, chin) : v, top = R.top(f), [l, r] = span(f, top, top + 40);
      const c = R.erase(R.shift(f, Math.round(31.5 - (l + r) / 2), R.FOOT - R.bottom(f)), (x) => x <= 0 || x >= R.FW - 1);
      out.push({ anim: 'walk', dir: 'side', i, im: largest(c) });
    });
    return out;
  };
  return { id, source, prepare, frames };
}
