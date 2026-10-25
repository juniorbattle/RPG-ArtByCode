// The density trial rigs of the arena's fighters (LAB, not approved, never in production; the operator's decision AA1-3, « Essai en scène ×2
// contre ×4 d'abord », journal Passe AA2): the production hero hero-x2-v4 rebuilt at density K (32K x 48K texels per frame, feet on row 45K)
// from the SAME archived sheets by the same chain, so the densities differ by their texel only. trialRig(K) is the recipe, every length of
// hero-x2-v3's rig scaled by S = K / 2 (rounded to the texel):
// - the profile idle: the v4-b turnaround's third figure (hero-x2-v3's crop), reconstructed at pitch 3.4 / S, mapped onto hero-x2-v4's palette
//   (pinned: its export), cleaned by hero-x2-v3's preparation; idle = rest, rest, inhale, exhale (rig-engine's breath, its lifts scaled);
// - the profile walk: the v3 sheet's eight run frames (hero-x2-v3's run row), reconstructed at the same pitch, then hero-x2-v3's run rig (split,
//   shear from the hip, the 14-texel stride, the flight), scaled.
// Only what the trial needs: the side idle and walk (the duel shows the profile). No combat pose: the archived sheets draw the hero without a
// sword, and no image is generated for this trial. Rigs: hero-x4-trial.rig.mjs, hero-x3-trial.rig.mjs; built by tools/art-lab/build-trial.mjs.
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as R from '../../../tools/art-lab/rig-engine.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const SHEET = 'art-lab/characters/reference/sources/hero-turnaround-v4-2026-10-19-b.png', PALETTE = 'art-lab/characters/exports/hero-x2-v4.png';
/** the turnaround and the palette the rigs read must be the files hero-x2-v3 / hero-x2-v4 were built from */
for (const [rel, want] of [[SHEET, '974a27d2d12c41d9f053711b6ec7bfa35bdf44d9ceb198f961bdbac3ffab791a'], [PALETTE, '06a7fab7c90ee0d83b97477c3276710bb217161c2be32b12ab4143c338c603f1']]) {
  const got = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');
  if (got !== want) throw new Error(`${rel}: SHA-256 ${got}, the rig expects ${want}`);
}
/** the run row's sheet (hero-x2-v3's RUN_SHEET), checked by its SHA-256 before use */
const RUN_SHEET = { path: 'art-lab/characters/reference/sources/hero-turnaround-v3-2026-10-19.png', sha256: 'a86cea282b5645ec4ab008dd0dc469f76d5105e792a12b62ec587758385d29a1' };

export function trialRig(K) {
const id = `hero-x${K}-trial`;
/** K / 2 times hero-x2-v3's texels per sheet pixel: every length of its rig scaled, rounded to the texel */
const S = K / 2, s = (v) => Math.round(v * S), s2 = (v) => Math.round(v * S * S);
const frame = { W: 32 * K, H: 48 * K, FOOT: 45 * K };
const { W: FW, FOOT } = frame;

const source = {
  sheet: SHEET,
  pitch: 3.4 / S,
  views: { side: '424,377,560,681' },
  palette: { from: PALETTE },
  options: { holes: true, noShadow: true, closingFrom: s(48) },
};

const chroma = (c) => { const [, a, b] = R.oklab(c); return Math.hypot(a, b); };
/** the v3 sheet's drop shadow (its run frames only): neutral greys on rows >= 78 S, flooded from outside */
function dropShadow(v) {
  const y0 = s(78), o = R.clone(v), isGrey = (x, y) => { const c = R.get(o, x, y); if (!c || y < y0) return false; const L = R.oklab(c)[0]; return chroma(c) < 0.03 && L > 0.3 && L < 0.62; };
  let changed = true;
  while (changed) {
    changed = false;
    for (let y = y0; y < o.H; y++) for (let x = 0; x < o.W; x++) {
      if (!isGrey(x, y)) continue;
      if ([[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].some(([p, q]) => q >= o.H || p < 0 || p >= o.W || !R.opaque(o, p, q))) { R.put(o, x, y, null); changed = true; }
    }
  }
  return o;
}
/** loose texels: 4-connected islands of fewer than `min` texels removed */
function despeckle(im, min) {
  const o = R.clone(im), seen = new Uint8Array(im.W * im.H);
  for (let y = 0; y < im.H; y++) for (let x = 0; x < im.W; x++) {
    if (seen[y * im.W + x] || !R.opaque(im, x, y)) continue;
    const comp = [], st = [[x, y]]; seen[y * im.W + x] = 1;
    while (st.length) { const [a, b] = st.pop(); comp.push([a, b]); for (const [p, q] of [[a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]]) if (p >= 0 && q >= 0 && p < im.W && q < im.H && !seen[q * im.W + p] && R.opaque(im, p, q)) { seen[q * im.W + p] = 1; st.push([p, q]); } }
    if (comp.length < min) for (const [a, b] of comp) R.put(o, a, b, null);
  }
  return o;
}
/** thin vertical strands below row 60 S (runs of >= 2 texels one texel wide), then detached islands (6 texels at x2: 24 here) */
function cleanStrands(v) {
  const o = R.clone(v);
  for (let x = 1; x < v.W - 1; x++) for (let y = s(60); y < v.H; y++) {
    if (!R.opaque(v, x, y) || R.opaque(v, x - 1, y) || R.opaque(v, x + 1, y)) continue;
    let e = y; while (e + 1 < v.H && R.opaque(v, x, e + 1) && !R.opaque(v, x - 1, e + 1) && !R.opaque(v, x + 1, e + 1)) e++;
    if (e > y) for (let k = y; k <= e; k++) R.put(o, x, k, null);
    y = e;
  }
  return despeckle(o, s2(6));
}
/** soles on the foot row and the feet (the lowest 3 S rows) centred on the anchor column */
function align(v) {
  const b = R.bottom(v); let x0 = FW, x1 = 0;
  for (let y = b - s(3) + 1; y <= b; y++) for (let x = 0; x < v.W; x++) if (R.opaque(v, x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
  return R.shift(v, Math.round((FW - 1) / 2 - (x0 + x1) / 2), FOOT - b);
}
/** one-texel slits from row 56 S down, filled with the darker neighbour */
function closeSlits(v) {
  const o = R.clone(v);
  for (let y = s(56); y < v.H; y++) for (let x = 1; x < v.W - 1; x++) {
    if (R.opaque(v, x, y) || !R.opaque(v, x - 1, y) || !R.opaque(v, x + 1, y)) continue;
    const a = R.get(v, x - 1, y), b = R.get(v, x + 1, y);
    R.put(o, x, y, R.oklab(a)[0] <= R.oklab(b)[0] ? a : b);
  }
  return o;
}
/** the sheet's grey background blended into the figure's border cells, peeled twice (hero-x2-v3's dehalo) */
function dehalo(v) {
  let o = R.clone(v);
  for (let pass = 0; pass < 2; pass++) {
    const n = R.clone(o);
    for (let y = 0; y < o.H; y++) for (let x = 0; x < o.W; x++) {
      const c = R.get(o, x, y); if (!c) continue;
      if (R.opaque(o, x + 1, y) && R.opaque(o, x - 1, y) && R.opaque(o, x, y + 1) && R.opaque(o, x, y - 1)) continue;
      const L = R.oklab(c)[0]; if (chroma(c) < 0.012 && L > 0.49 && L < 0.66) R.put(n, x, y, null);
    }
    o = n;
  }
  return o;
}
function prepare(dir, v) {
  return align(closeSlits(cleanStrands(dehalo(v))));
}

// ---- the v3 sheet's run frames, reconstructed at this rig's pitch and frame (hero-x2-v3's sheetRunFrames)
const RUN_ROW = { y0: 736, y1: 1022, seeds: [98, 282, 450, 620, 834, 1014, 1191, 1362].map((x) => [x, 790]), bg: [117, 119, 118], thr: 40 };
function sheetRunFrames() {
  const file = path.join(ROOT, RUN_SHEET.path), got = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  if (got !== RUN_SHEET.sha256) throw new Error(`${RUN_SHEET.path}: SHA-256 ${got}, the rig expects ${RUN_SHEET.sha256}`);
  const sh = R.load(file), { W, H } = sh, { y0, y1, bg, thr } = RUN_ROW;
  const fg = (x, y) => { const i = (y * W + x) * 4; return Math.max(Math.abs(sh.px[i] - bg[0]), Math.abs(sh.px[i + 1] - bg[1]), Math.abs(sh.px[i + 2] - bg[2])) > thr; };
  const lab = new Int8Array(W * H).fill(-1), q = [];
  for (const [k, [sx, sy]] of RUN_ROW.seeds.entries()) {
    let s = null; for (let r = 0; r < 40 && !s; r++) for (let dy = -r; dy <= r && !s; dy++) for (let dx = -r; dx <= r; dx++) if (fg(sx + dx, sy + dy)) { s = [sx + dx, sy + dy]; break; }
    lab[s[1] * W + s[0]] = k; q.push(s);
  }
  for (let h = 0; h < q.length; h++) {
    const [x, y] = q[h], k = lab[y * W + x];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const u = x + dx, v = y + dy; if (u < 0 || v < y0 || u >= W || v > y1 || lab[v * W + u] >= 0 || !fg(u, v)) continue; lab[v * W + u] = k; q.push([u, v]); }
  }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `artlab-${id}-run-`)), out = [];
  const ropt = ['--holes', `--closing-from=${source.options.closingFrom}`];
  try {
    for (let k = 0; k < RUN_ROW.seeds.length; k++) {
      const m = R.clone(sh), box = [W, H, -1, -1];
      for (let y = y0; y <= y1; y++) for (let x = 0; x < W; x++) {
        const l = lab[y * W + x]; if (l < 0) continue;
        if (l !== k) { const i = (y * W + x) * 4; m.px[i] = bg[0]; m.px[i + 1] = bg[1]; m.px[i + 2] = bg[2]; }
        else { box[0] = Math.min(box[0], x); box[1] = Math.min(box[1], y); box[2] = Math.max(box[2], x); box[3] = Math.max(box[3], y); }
      }
      const f = path.join(tmp, `run${k}.png`), pre = path.join(tmp, `run${k}`); R.save(f, m);
      execFileSync(process.execPath, [path.join(ROOT, 'tools/art-lab/reconstruct-grid.mjs'), f, box.join(','), String(source.pitch), String(frame.W), String(frame.H), String(frame.FOOT), pre, 'full', ...ropt], { stdio: 'ignore' });
      out.push(R.load(`${pre}-full.png`));
    }
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  return out;
}
function toPalette(im, pal) {
  const P = pal.map((c) => [c, R.oklab(c)]), memo = new Map();
  return R.recolour(im, (c) => { const k = c.join(','); if (!memo.has(k)) { const o = R.oklab(c); let best = null, bd = 1e9; for (const [p, q] of P) { const d = (q[0] - o[0]) ** 2 + (q[1] - o[1]) ** 2 + (q[2] - o[2]) ** 2; if (d < bd) { bd = d; best = p; } } memo.set(k, best); } return memo.get(k); });
}
/** the face: skin texels on rows top + 12 S .. top + 27 S; its front column (facing left) and chin row */
function face(im) {
  const t = R.top(im); let fx = 999, cy = -1;
  for (let y = t + s(12); y <= t + s(27); y++) for (let x = 0; x < im.W; x++) { const c = R.get(im, x, y); if (!c) continue; const [L, a, b] = R.oklab(c); if (L > 0.68 && a > 0.025 && b > 0.03) { fx = Math.min(fx, x); cy = Math.max(cy, y); } }
  return [fx, cy];
}
const isBlue = (c) => R.oklab(c)[2] < -0.035;
const isTrousers = (c) => { const [L, a, b] = R.oklab(c); return L >= 0.27 && Math.hypot(a, b) < 0.045 && b >= -0.035; };
/** the run frames facing left, shadowless, without the halo, on the palette, aligned on the face (hero-x2-v3's column 14 and row 37, doubled) */
function runFrames(pal) {
  return sheetRunFrames().map((im) => { const u = toPalette(dehalo(R.mirror(dropShadow(im))), pal), [fx, cy] = face(u); return R.shift(u, s(14) - fx, s(37) - cy); });
}
/** hero-x2-v3's split of a run frame into its upper body and its drawn legs, every row and column doubled */
function split(u) {
  const keep = new Uint8Array(u.W * u.H), st = [];
  for (let y = 0; y < s(58); y++) for (let x = 0; x < u.W; x++) { const c = R.get(u, x, y); if (c && !(y >= s(54) && x < s(24) && isTrousers(c))) keep[y * u.W + x] = 1; }
  for (let x = 0; x < u.W; x++) if (keep[(s(58) - 1) * u.W + x]) st.push([x, s(58) - 1]);
  while (st.length) {
    const [x, y] = st.pop();
    for (const [p, q] of [[x + 1, y], [x - 1, y], [x, y + 1]]) {
      if (q < s(58) || q > s(65) - 1 || p < s(18) || p > s(49) - 1 || keep[q * u.W + p]) continue;
      const c = R.get(u, p, q); if (!c || isTrousers(c)) continue;
      keep[q * u.W + p] = 1; st.push([p, q]);
    }
  }
  const upper = R.cut(u, (x, y) => { if (keep[y * u.W + x]) return true; const c = R.get(u, x, y); return !!c && isBlue(c); });
  return { upper, legs: pieces(R.cut(u, (x, y) => !R.opaque(upper, x, y)), s2(60)) };
}
function pieces(im, min) {
  const seen = new Uint8Array(im.W * im.H), o = R.blank(im.W, im.H);
  for (let y = 0; y < im.H; y++) for (let x = 0; x < im.W; x++) {
    if (seen[y * im.W + x] || !R.opaque(im, x, y)) continue;
    const st = [[x, y]], c = []; seen[y * im.W + x] = 1;
    while (st.length) { const [a, b] = st.pop(); c.push([a, b]); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const p = a + dx, q = b + dy; if (p < 0 || q < 0 || p >= im.W || q >= im.H || seen[q * im.W + p] || !R.opaque(im, p, q)) continue; seen[q * im.W + p] = 1; st.push([p, q]); } }
    if (c.length >= min) for (const [a, b] of c) R.put(o, a, b, R.get(im, a, b));
  }
  return o;
}
function footX(im) { const b = R.bottom(im); let a = 999, c = -1; for (let x = 0; x < im.W; x++) if (R.opaque(im, x, b)) { a = Math.min(a, x); c = Math.max(c, x); } return (a + c) / 2; }

// ---- hero-x2-v3's profile run, doubled: the planted foot moves 28 texels per frame (14 at x2), the flight 4 rows (2 at x2)
const RUN = [[2, 2, 0], [3, 3, 1], [4, 4, 2], [5, 4, 3], [6, 5, 0], [7, 6, 1], [8, 1, 2], [1, 1, 3]];
const STEP = { from: s(14), slide: s(14), hip: s(60), foot: s(6) };
const FLIGHT = s(2);
function sideRun(parts, i) {
  const [u, l, t] = RUN[i], P = parts[u - 1], L = parts[l - 1].legs;
  const legs = R.shear(L, STEP.hip, R.bottom(L) - STEP.foot, Math.round(STEP.from + STEP.slide * Math.min(t, 2) - footX(L)));
  const blue = (x, y) => { const c = R.get(P.upper, x, y); return !!c && isBlue(c); };
  const im = R.over(R.cut(P.upper, blue), legs, R.cut(P.upper, (x, y) => !blue(x, y)));
  return R.erase(despeckle(R.shift(im, 0, FOOT - R.bottom(legs) - (t === 3 ? FLIGHT : 0)), s2(4)), (x, y) => x === 0 || x === im.W - 1 || y === 0);
}
/** rig-engine's breath with its lifts doubled: inhale = the upper body one row higher from the chest (2 here), exhale = the head */
function breath(v, neck, chest, cutY) {
  const lower = R.cut(v, (x, y) => y >= cutY), upper = R.cut(v, (x, y) => y < cutY), all = () => true;
  return [R.over(lower, R.remapRows(upper, all, 0, cutY - 1, -s(1), cutY - 1, chest, s(4))), R.over(lower, R.remapRows(upper, all, 0, cutY - 1, -s(1), cutY - 1, neck, cutY - 1 - (neck + s(3))))];
}

function frames(V) {
  const out = [], v = V.side;
  const parts = runFrames(R.paletteOf(R.load(path.join(ROOT, source.palette.from)))).map(split);
  const [inhale, exhale] = breath(v, s(32), s(35), s(62));
  [R.clone(v), R.clone(v), inhale, exhale].forEach((im, i) => out.push({ anim: 'idle', dir: 'side', i, im }));
  for (let i = 0; i < 8; i++) out.push({ anim: 'walk', dir: 'side', i, im: sideRun(parts, i) });
  return out;
}
return { id, frame, source, prepare, frames };
}
