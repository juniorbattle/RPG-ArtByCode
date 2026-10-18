import * as THREE from 'three';
import { applyPose } from '../app/CameraRig';
import { bakeVisibility, bakeCodeFingerprint, SETS, WIN_MAX, BAKE_PAGE, type BakeOptions, type BakePose, type BehindPass, type VisResult } from './Visibility';
import type { VisSet } from '../app/CameraGraph';

/** Visibility bake cache (journal pass 6, P5). A bake is a pure function of its inputs on a given GPU: the ID geometry it renders (every
 *  part's triangles), the poses and frame, the player-reveal windows of the behind pass, the bake options and page cap, the bake's own
 *  code (shaders, counting, pose placement) and the GPU / driver that rasterises it. The key hashes ALL of them (64 bits), so a cached
 *  result is only ever read back for the exact inputs it was baked from; anything else (another seed, frame, camera tuning, a code
 *  change, another GPU) is a miss and bakes. Results live in memory for the session and in localStorage across loads (a few entries,
 *  least recently used dropped); an unreadable, malformed or incomplete entry is a miss, and a failed bake is never stored: the rule
 *  "a doubtful bake never culls" holds. `?viscache=0` bakes and stores nothing; `?viscache=verify` always bakes and compares with the
 *  stored entry (cache: verify-ok / verify-mismatch / verify-miss). The DEV negative controls (`?visfail=`) bypass the cache. */

export type BakeCacheMode = 'on' | 'off' | 'verify';

const STORE_PREFIX = 'hd2d.visbake.';
const STORE_INDEX = 'hd2d.visbake.index';
const STORE_MAX = 6;
const FORMAT = 1;
const memory = new Map<string, VisResult>();

/** 64-bit hash (two independent 32-bit FNV-1a / murmur-mixed lanes) over numbers, strings and typed arrays, in a fixed order */
class Hash64 {
  private a = 0x811c9dc5; private b = 0x9e3779b9;
  private word(w: number): void {
    this.a = Math.imul(this.a ^ w, 0x01000193);
    let k = Math.imul(w, 0xcc9e2d51); k = (k << 15) | (k >>> 17); k = Math.imul(k, 0x1b873593);
    this.b ^= k; this.b = (this.b << 13) | (this.b >>> 19); this.b = (Math.imul(this.b, 5) + 0xe6546b64) | 0;
  }
  private readonly f64 = new Float64Array(1); private readonly f64w = new Uint32Array(this.f64.buffer);
  num(x: number): this { this.f64[0] = x; this.word(this.f64w[0]); this.word(this.f64w[1]); return this; }
  str(s: string): this { this.num(s.length); for (let i = 0; i < s.length; i++) this.word(s.charCodeAt(i)); return this; }
  arr(v: ArrayLike<number> & { buffer: ArrayBufferLike; byteOffset: number; byteLength: number; BYTES_PER_ELEMENT: number }): this {
    this.num(v.byteLength); this.num(v.BYTES_PER_ELEMENT);
    if (v.byteOffset % 4) { const b = new Uint8Array(v.buffer, v.byteOffset, v.byteLength); for (let i = 0; i < b.length; i++) this.word(b[i]); return this; }
    const n = v.byteLength >> 2, w = new Uint32Array(v.buffer, v.byteOffset, n);
    for (let i = 0; i < n; i++) this.word(w[i]);
    const rest = new Uint8Array(v.buffer, v.byteOffset + n * 4, v.byteLength - n * 4);
    for (let i = 0; i < rest.length; i++) this.word(rest[i]);
    return this;
  }
  hex(): string { return (this.a >>> 0).toString(16).padStart(8, '0') + (this.b >>> 0).toString(16).padStart(8, '0'); }
}

/** every mesh of an ID scene, in scene order: its world matrix, the material's side and kind, and the geometry the bake rasterises */
function hashScene(h: Hash64, scene: THREE.Scene): void {
  scene.updateMatrixWorld(true);
  let n = 0;
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    n++;
    h.str(o.type).num(m.visible ? 1 : 0).num(m.frustumCulled ? 1 : 0).num(o.layers.mask);
    for (const e of m.matrixWorld.elements) h.num(e);
    const mat = m.material as THREE.ShaderMaterial;
    h.num(mat.side).str(mat.fragmentShader ?? '').str(mat.vertexShader ?? '');
    const g = m.geometry as THREE.BufferGeometry;
    for (const name of Object.keys(g.attributes).sort()) {
      const at = g.attributes[name] as THREE.BufferAttribute;
      h.str(name).num(at.itemSize).arr(at.array as Float32Array);
    }
    if (g.index) h.str('index').arr(g.index.array as Uint32Array);
    h.num(g.drawRange.start).num(g.drawRange.count);
  });
  h.num(n);
}

export interface BakeInputs {
  renderer: THREE.WebGLRenderer; scene: THREE.Scene; nParts: number; poses: BakePose[]; aspect: number; waterY: number; behind?: BehindPass; opts: BakeOptions;
}

/** the cache key of a bake: see the module comment */
export function bakeKey(i: BakeInputs): string {
  const h = new Hash64();
  const gl = i.renderer.getContext() as WebGL2RenderingContext;
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const vp = gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array;
  h.num(FORMAT).str(THREE.REVISION).str(bakeCodeFingerprint())
    .str(String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)))
    .num(i.renderer.capabilities.maxTextureSize).num(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) as number).num(vp[0]).num(vp[1])
    .num(i.renderer.extensions.has('EXT_float_blend') ? 1 : 0)
    .num(i.nParts).num(i.aspect).num(i.waterY).str(JSON.stringify(i.opts)).num(BAKE_PAGE);
  // poses: every field, full precision (the bake places its cameras from them)
  for (const p of i.poses) {
    h.str(p.set);
    for (const k of Object.keys(p.pose).sort()) h.str(k).num((p.pose as unknown as Record<string, number>)[k]);
    h.num(p.player ? p.player[0] : NaN).num(p.player ? p.player[1] : NaN);
  }
  hashScene(h, i.scene);
  if (i.behind) {
    // the reveal windows the behind pass opens, computed as the bake does for each main tile (pose camera at the bake's widened field)
    h.str('behind');
    hashScene(h, i.behind.scene);
    const cam = new THREE.PerspectiveCamera(34, i.aspect, 1.5, 900);
    for (const p of i.poses) {
      applyPose(cam, p.pose, i.aspect, 1.06);
      const wins = i.behind.windowsFor(cam, p).slice(0, WIN_MAX);
      h.num(wins.length);
      for (const w of wins) for (const x of w) h.num(x);
    }
  }
  return h.hex();
}

const pack = (v: VisResult) => {
  const n = v.counts[SETS[0]].length, parts = v.behind ? 2 : 1, all = new Uint32Array(n * SETS.length * parts);
  SETS.forEach((s, k) => { all.set(v.counts[s], k * n); if (v.behind) all.set(v.behind[s], (SETS.length + k) * n); });
  let bin = ''; const bytes = new Uint8Array(all.buffer);
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return { n, data: btoa(bin), sum: new Hash64().arr(all).hex() };
};

/** a stored entry back into a result, or null when it is unreadable, malformed or fails the bake's own sanity check */
function unpack(raw: string, nParts: number, poses: BakePose[], wantBehind: boolean): VisResult | null {
  try {
    const e = JSON.parse(raw);
    if (e.format !== FORMAT || e.n !== nParts + 1 || e.hasBehind !== wantBehind) return null;
    const bin = atob(e.data), bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const parts = wantBehind ? 2 : 1;
    if (bytes.length !== e.n * SETS.length * parts * 4) return null;
    const all = new Uint32Array(bytes.buffer);
    if (new Hash64().arr(all).hex() !== e.sum) return null;
    const counts = {} as Record<VisSet, Uint32Array>, behind = wantBehind ? ({} as Record<VisSet, Uint32Array>) : undefined;
    SETS.forEach((s, k) => { counts[s] = all.slice(k * e.n, (k + 1) * e.n); if (behind) behind[s] = all.slice((SETS.length + k) * e.n, (SETS.length + k + 1) * e.n); });
    // the bake's own check: every set that has poses counted pixels
    if (SETS.some((s) => poses.some((p) => p.set === s) && !counts[s].some((c) => c > 0))) return null;
    return { counts, behind, poses: e.poses, ms: 0, split: { render: 0, readback: 0, decode: 0 }, pages: e.pages, page: e.page, targetBytes: e.targetBytes };
  } catch { return null; }
}

const storage = (): Storage | null => { try { return window.localStorage; } catch { return null; } };

function load(key: string, i: BakeInputs): VisResult | null {
  const mem = memory.get(key);
  if (mem) return mem;
  const st = storage();
  let raw: string | null = null;
  try { raw = st?.getItem(STORE_PREFIX + key) ?? null; } catch { raw = null; }
  if (!raw) return null;
  const v = unpack(raw, i.nParts, i.poses, !!i.behind);
  if (!v) { try { st?.removeItem(STORE_PREFIX + key); } catch { /* storage unavailable */ } return null; }
  memory.set(key, v);
  touch(key);
  return v;
}

function touch(key: string): void {
  const st = storage();
  if (!st) return;
  try {
    let idx: string[] = [];
    try { idx = JSON.parse(st.getItem(STORE_INDEX) ?? '[]'); } catch { idx = []; }
    idx = [key, ...idx.filter((k) => k !== key)];
    for (const old of idx.slice(STORE_MAX)) st.removeItem(STORE_PREFIX + old);
    st.setItem(STORE_INDEX, JSON.stringify(idx.slice(0, STORE_MAX)));
  } catch { /* storage full or unavailable: the memory cache still works */ }
}

function save(key: string, v: VisResult): void {
  memory.set(key, v);
  const st = storage();
  if (!st) return;
  try {
    const p = pack(v);
    st.setItem(STORE_PREFIX + key, JSON.stringify({ format: FORMAT, n: p.n, hasBehind: !!v.behind, data: p.data, sum: p.sum, poses: v.poses, pages: v.pages, page: v.page, targetBytes: v.targetBytes }));
    touch(key);
  } catch { /* quota: memory only */ }
}

/** a private copy of a cached result (its arrays are never shared between two districts) */
const copy = (v: VisResult): VisResult => ({
  ...v,
  counts: Object.fromEntries(SETS.map((s) => [s, v.counts[s].slice()])) as Record<VisSet, Uint32Array>,
  behind: v.behind ? (Object.fromEntries(SETS.map((s) => [s, v.behind![s].slice()])) as Record<VisSet, Uint32Array>) : undefined,
  page: [v.page[0], v.page[1]],
});

const sameCounts = (a: VisResult, b: VisResult) =>
  SETS.every((s) => a.counts[s].length === b.counts[s].length && a.counts[s].every((x, k) => x === b.counts[s][k])
    && (!a.behind || (!!b.behind && a.behind[s].every((x, k) => x === b.behind![s][k]))));

/** bakeVisibility through the cache (same arguments and result; `cache` / `keyMs` say what happened). Throws what the bake throws. */
export function bakeVisibilityCached(i: BakeInputs, mode: BakeCacheMode = 'on'): VisResult {
  if (mode === 'off' || i.opts.fail) return { ...bakeVisibility(i.renderer, i.scene, i.nParts, i.poses, i.aspect, i.waterY, i.behind, i.opts), cache: 'off' };
  const t0 = performance.now();
  const key = bakeKey(i);
  const keyMs = performance.now() - t0;
  const stored = load(key, i);
  if (stored && mode === 'on') return { ...copy(stored), ms: performance.now() - t0, split: { render: 0, readback: 0, decode: performance.now() - t0 - keyMs }, cache: 'hit', keyMs };
  const v = bakeVisibility(i.renderer, i.scene, i.nParts, i.poses, i.aspect, i.waterY, i.behind, i.opts);
  const cache = mode === 'verify' ? (stored ? (sameCounts(v, stored) ? 'verify-ok' : 'verify-mismatch') : 'verify-miss') : 'miss';
  if (cache === 'verify-mismatch') console.error('visibility bake cache: a stored result differs from a fresh bake of the same key; the fresh one is kept');
  save(key, copy(v));
  return { ...v, cache, keyMs };
}
