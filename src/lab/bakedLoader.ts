/** DEV-ONLY loader + test harness for EXPERIMENTAL baked sheets in the SHARED atlas and renderer
 *  (`art-lab/characters/runtime-integration-contract.md`, v3: amendments A-C). Reached only through dynamic imports that `main.ts` guards
 *  with `import.meta.env.DEV`: production builds compile it out. Nothing becomes canonical: the sheet joins the atlas for this page load.
 *    ?baked=<id>[,<id>]        /art-lab/characters/exports/<id>.png + .json; the PNG's SHA-256 must match provenance/<id>/PROVENANCE.json
 *                              and the manifest must allow runtime use (`lab` or `production`). Decoded byte-exact by our own PNG decoder
 *                              (no browser colour management, no premultiplied alpha). Aseprite tags name `<anim>-<dir>` (e.g.
 *                              `walk-side`); an untagged sheet is read as front idle frames (down/idle/0..n-1).
 *    &bakedpos=x,z;x,z         authored spawns of the first id (absent: loaded into the atlas but NOT spawned — test 1b)
 *    &bakedscale=0.9           per-actor scale (presentation; default 1)
 *    &bakedheight=1.7          metres for shadows / bubble (default: the figure's height in the sheet x scale)
 *    &bakeddetail=mid          hero | mid | crowd (default mid)
 *    &bakedface=<rad>          world facing (absent: never turned, always the front view)
 *    &bakedfallback=front-idle EXPLICIT front-idle aliases for missing idle facings: lab assets with an immobile behaviour only (amendment B)
 *    &bakedhide=porter         hide every actor of that spec (the old preview hid the porter the same way)
 *    &bakedfollow=1            the first authored actor takes the hidden player's place every frame (dynamic walks)
 *    &bakedsynthetic=N         TEST ONLY: N extra synthetic x2 frames (a dummy sheet) to grow the atlas towards its ceiling (amendment A) */
import * as THREE from 'three';
import type { App } from '../app/App';
import type { Actor } from '../characters/SpriteRenderer';
import { PIXEL_WORLD } from '../characters/SpriteRenderer';
import { FRAME_W, FRAME_H, FOOT_Y, type Dir, type Anim } from '../characters/SpriteGenerator';
import { checkBakedSheet, type BakedSheet, type BakedFrame, type AuthoredSpawn } from '../characters/BakedSprites';
import { parseAsepriteJson } from './sheetMeta';

type W = Window & { __ready?: boolean; __baked?: unknown };
const ROOT = '/art-lab/characters';
const ANIMS: Anim[] = ['idle', 'walk', 'hammer', 'talk', 'carry'], DIRS: Dir[] = ['down', 'up', 'side'];

const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((v) => v.toString(16).padStart(2, '0')).join('');
async function getJson(url: string): Promise<any> {
  const r = await fetch(url);
  // the dev server answers a missing file with the app's index.html (200): a non-JSON answer means "no such file"
  if (!r.ok || !(r.headers.get('content-type') ?? '').includes('json')) throw new Error(`cannot load ${url}: no such file`);
  return r.json();
}

/** Exact PNG decode (8-bit RGBA, non-interlaced): inflate + unfilter, nothing else touches the bytes. */
export async function decodePng(bytes: Uint8Array): Promise<{ w: number; h: number; rgba: Uint8Array }> {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (dv.getUint32(0) !== 0x89504e47) throw new Error('not a PNG');
  let o = 8, w = 0, h = 0; const idat: Uint8Array[] = [];
  while (o < bytes.length) {
    const n = dv.getUint32(o), t = String.fromCharCode(...bytes.subarray(o + 4, o + 8)), d = bytes.subarray(o + 8, o + 8 + n);
    if (t === 'IHDR') {
      w = dv.getUint32(o + 8); h = dv.getUint32(o + 12);
      if (d[8] !== 8 || d[9] !== 6 || d[12] !== 0) throw new Error(`PNG must be 8-bit RGBA, not interlaced (depth ${d[8]}, colour type ${d[9]}, interlace ${d[12]})`);
    } else if (t === 'IDAT') idat.push(d);
    o += 12 + n;
  }
  const raw = new Uint8Array(await new Response(new Blob(idat as BlobPart[]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
  const st = w * 4, px = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (st + 1)], r = y * (st + 1) + 1;
    for (let x = 0; x < st; x++) {
      const a = x >= 4 ? px[y * st + x - 4] : 0, u = y ? px[(y - 1) * st + x] : 0, c = x >= 4 && y ? px[(y - 1) * st + x - 4] : 0;
      let v = raw[r + x];
      if (f === 1) v += a; else if (f === 2) v += u; else if (f === 3) v += (a + u) >> 1;
      else if (f === 4) { const p = a + u - c, pa = Math.abs(p - a), pb = Math.abs(p - u), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? u : c; }
      px[y * st + x] = v & 255;
    }
  }
  return { w, h, rgba: px };
}

/** One manifest id -> a validated BakedSheet (hash, manifest gate, frame invariant). */
async function loadSheet(id: string, fallback: BakedSheet['fallback']): Promise<BakedSheet & { decodeMs: number }> {
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error(`baked "${id}" is not a manifest id`);
  const man = await getJson(`${ROOT}/manifests/${id}.manifest.json`);
  if (man.runtimeUse !== 'lab' && man.runtimeUse !== 'production') throw new Error(`${id}: manifest runtimeUse "${man.runtimeUse}" does not allow runtime use`);
  const prov = await getJson(`${ROOT}/provenance/${id}/PROVENANCE.json`);
  const want = prov.files?.[`art-lab/characters/exports/${id}.png`];
  const t0 = performance.now();
  const bytes = new Uint8Array(await (await fetch(`${ROOT}/exports/${id}.png`)).arrayBuffer());
  const sha256 = hex(await crypto.subtle.digest('SHA-256', bytes));
  if (!want || sha256 !== want) throw new Error(`${id}: exported PNG SHA-256 ${sha256.slice(0, 12)}... does not match its provenance pack`);
  const img = await decodePng(bytes);
  const decodeMs = performance.now() - t0;
  const meta = parseAsepriteJson(await getJson(`${ROOT}/exports/${id}.json`));
  if (meta.width !== img.w || meta.height !== img.h) throw new Error(`${id}: JSON says ${meta.width}x${meta.height}, PNG is ${img.w}x${img.h}`);
  const fw = meta.frames[0].sw, fh = meta.frames[0].sh, k = fh / FRAME_H;
  const cut = (i: number): Uint8Array => {
    const f = meta.frames[i], out = new Uint8Array(fw * fh * 4);
    if (f.sw !== fw || f.sh !== fh) throw new Error(`${id}: frames must share one size`);
    for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
      const s = ((f.y + y) * img.w + f.x + x) * 4, d = ((f.oy + y) * fw + f.ox + x) * 4;
      out[d] = img.rgba[s]; out[d + 1] = img.rgba[s + 1]; out[d + 2] = img.rgba[s + 2]; out[d + 3] = img.rgba[s + 3];
    }
    return out;
  };
  const frames: BakedFrame[] = [];
  if (!meta.tags.length) meta.frames.forEach((_, i) => frames.push({ dir: 'down', anim: 'idle', i, rgba: cut(i) }));
  else for (const t of meta.tags) {
    const [anim, dir] = t.name.split('-') as [Anim, Dir];
    if (!ANIMS.includes(anim) || !DIRS.includes(dir)) throw new Error(`${id}: tag "${t.name}" is not <anim>-<dir> (${ANIMS.join('|')} - ${DIRS.join('|')})`);
    for (let i = t.from; i <= t.to; i++) frames.push({ dir, anim, i: i - t.from, rgba: cut(i) });
  }
  return { id, runtimeUse: man.runtimeUse, sha256, k, frames, fallback, decodeMs };
}

/** TEST ONLY (amendment A): a dummy x2 sheet of n valid frames, to push the atlas height towards its ceiling. */
function syntheticSheet(n: number): BakedSheet {
  const k = 2, fw = FRAME_W * k, fh = FRAME_H * k, frames: BakedFrame[] = [];
  for (let i = 0; i < n; i++) {
    const rgba = new Uint8Array(fw * fh * 4);
    for (let y = 8; y <= FOOT_Y * k; y++) for (let x = 20; x < 44; x++) { const d = (y * fw + x) * 4; rgba[d] = (i * 37 + x * 5) & 255; rgba[d + 1] = (y * 3) & 255; rgba[d + 2] = 200; rgba[d + 3] = 255; }
    frames.push({ dir: 'down', anim: 'idle', i, rgba });
  }
  return { id: 'test-synthetic', runtimeUse: 'lab', sha256: 'synthetic', k, frames };
}

export interface BakedLoad { sheets: BakedSheet[]; spawns: AuthoredSpawn[]; report: Record<string, unknown> }

export async function loadBaked(params: URLSearchParams): Promise<BakedLoad> {
  if (params.has('labsprite')) throw new Error('?baked and ?labsprite are exclusive (the old preview patches the atlas itself)');
  const ids = (params.get('baked') ?? '').split(',').filter(Boolean);
  const fb = params.get('bakedfallback');
  if (fb !== null && fb !== 'front-idle') throw new Error(`bakedfallback "${fb}": only front-idle exists`);
  const sheets: Array<BakedSheet & { decodeMs?: number }> = [];
  for (const id of ids) sheets.push(await loadSheet(id, fb === 'front-idle' ? 'front-idle' : undefined));
  const syn = Number(params.get('bakedsynthetic') ?? 0);
  if (syn > 0) sheets.push(syntheticSheet(syn));
  for (const s of sheets) { const e = checkBakedSheet(s); if (e.length) throw new Error(`${s.id}: ${e.join('; ')}`); }
  const pos = (params.get('bakedpos') ?? '').split(';').filter(Boolean).map((p) => p.split(',').map(Number));
  const first = sheets[0], detail = (params.get('bakeddetail') ?? 'mid') as Actor['detail'];
  if (!['hero', 'mid', 'crowd'].includes(detail)) throw new Error(`bakeddetail "${detail}" is not hero | mid | crowd`);
  const scale = params.has('bakedscale') ? Number(params.get('bakedscale')) : 1;
  let height = Number(params.get('bakedheight'));
  if (first && !params.has('bakedheight')) {
    // the figure's own height: from its highest opaque texel of the front idle frame down to the foot line
    const f = first.frames.find((x) => x.dir === 'down' && x.anim === 'idle')!, fw = FRAME_W * first.k;
    let top = FOOT_Y * first.k; for (let i = 3; i < f.rgba.length; i += 4) if (f.rgba[i] >= 128) { top = Math.floor((i >> 2) / fw); break; }
    height = (FOOT_Y * first.k - top) * (PIXEL_WORLD / first.k) * scale;
  }
  const facing = params.has('bakedface') ? Number(params.get('bakedface')) : undefined;
  if (fb === 'front-idle' && first && first.runtimeUse !== 'lab') throw new Error('front-idle fallback is for lab assets only');
  const spawns: AuthoredSpawn[] = first ? pos.map(([x, z]) => ({ spec: first.id, pos: [x, z], facing, scale, height, detail, behaviour: 'idle', role: 'baked' })) : [];
  return { sheets, spawns, report: { ids, decodeMs: sheets.map((s) => s.decodeMs ?? 0), synthetic: syn, scale, height, detail, facing: facing ?? null, fallback: fb } };
}

/** After init: hide / follow options, a report on `window.__baked`, and test hooks (visibility toggle, test-2 self-test). */
export function installBakedHarness(app: App, params: URLSearchParams, load: Promise<BakedLoad>): void {
  const w = window as W;
  let ready = Boolean(w.__ready), done = false;
  Object.defineProperty(w, '__ready', { configurable: true, get: () => ready && done, set: (v: boolean) => { ready = v; } });
  const fail = (e: unknown) => { w.__baked = { error: String((e as Error)?.stack ?? e) }; done = true; };
  load.then((ld) => {
    const wait = () => {
      if (!app.atlas || !app.actors?.player) { setTimeout(wait, 16); return; }
      try { install(app, params, ld); done = true; } catch (e) { fail(e); }
    };
    wait();
  }, fail);
}

function install(app: App, params: URLSearchParams, ld: BakedLoad): void {
  const w = window as W, acts = app.actors, hide = params.get('bakedhide'), follow = params.get('bakedfollow') === '1';
  const authored = () => acts.actors.filter((a) => a.role === 'baked');
  let visible = true;
  const apply = () => {
    for (const a of acts.actors) if (hide && a.spec === hide) a.hidden = true;
    for (const a of authored()) a.hidden = !visible;
    if (follow) acts.player.hidden = true;
  };
  // after the actors moved (player included), before the camera graph and the sprite instances read their positions
  const upd = acts.update.bind(acts);
  acts.update = (dt: number, el: number) => {
    upd(dt, el); apply();
    const f = authored()[0];
    if (follow && f) f.pos.set(acts.player.pos.x, acts.player.pos.y, acts.player.pos.z);
  };
  apply();
  const first = ld.sheets[0], atlas = app.atlas;
  const info: Record<string, unknown> = {
    ...ld.report, atlas: { width: atlas.width, height: atlas.height, generatedHeight: atlas.generatedHeight, frames: atlas.frames.size },
    baked: Object.fromEntries(atlas.baked), aliases: atlas.aliases, follow, hide,
    frame: first ? [FRAME_W * first.k, FRAME_H * first.k] : null, metresPerTexel: first ? PIXEL_WORLD / first.k : null,
    placed: authored().map((a) => [a.pos.x, a.pos.z]),
  };
  if (atlas.aliases.length) console.warn(`[baked] explicit front-idle aliases: ${atlas.aliases.join(', ')}`);
  // measurement tools isolate the sprite's own pixels: render with / without the authored actors, no time step in between
  const refresh = () => app.sprites.update(acts.actors, app.lights, app.rig.camera, app.moonDir, acts.interactTarget, acts.player);
  Object.defineProperties(info, {
    setVisible: { enumerable: false, value: (v: boolean) => { visible = v; apply(); refresh(); } },
    selfTest: { enumerable: false, value: (id: string, expectB64?: string) => selfTest(app, id, expectB64) },
  });
  w.__baked = info;
}

/** Test 2: the baked block inside the MAIN atlas. CPU: atlas bytes == the expected export bytes (decoded independently by the caller).
 *  GPU: the block drawn through the renderer's own texel addressing (`floor(uv * size) + 0.5`, nearest) at several scales into an sRGB
 *  target, read back and compared texel for texel. Negative controls: a one-row offset (an off-by-one frame table), and uncentred linear
 *  sampling. (A wrong atlas height is NOT a valid control: the nearest re-quantisation of the snapped coordinate cancels it — measured.) */
function selfTest(app: App, id: string, expectB64?: string): Record<string, unknown> {
  const atlas = app.atlas, r = atlas.frames.get(`${id}/down/idle/0`), k = atlas.baked.get(id)?.k;
  if (!r || !k) throw new Error(`${id} is not a baked sheet of this atlas`);
  const fw = FRAME_W * k, fh = FRAME_H * k, W = atlas.width, H = atlas.height;
  const bx = Math.round(r.u0 * W), by = Math.round((1 - r.v1) * H);   // image-space block corner
  const cpu = new Uint8Array(fw * fh * 4);
  for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) for (let c = 0; c < 4; c++) cpu[(y * fw + x) * 4 + c] = atlas.rgba[((H - 1 - (by + y)) * W + bx + x) * 4 + c];
  let cpuMismatch: number | null = null;
  if (expectB64) { const e = Uint8Array.from(atob(expectB64), (ch) => ch.charCodeAt(0)); cpuMismatch = 0; for (let i = 0; i < cpu.length; i++) if (cpu[i] !== e[i]) cpuMismatch++; }
  const renderer = app.renderer;
  const run = (scale: number, mode: 'exact' | 'offByOne' | 'linear') => {
    const ow = Math.round(fw * scale), oh = Math.round(fh * scale);
    const rt = new THREE.WebGLRenderTarget(ow, oh, { colorSpace: THREE.SRGBColorSpace, depthBuffer: false });
    const tex = mode === 'linear' ? atlas.texture.clone() : atlas.texture;
    if (mode === 'linear') { tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter; tex.needsUpdate = true; }
    const mat = new THREE.ShaderMaterial({
      uniforms: { tAtlas: { value: tex }, uAtlasSize: { value: new THREE.Vector2(W, H) }, uRect: { value: new THREE.Vector4(r.u0, r.v0, r.u1, r.v1) }, uSnap: { value: mode === 'linear' ? 0 : 1 }, uRow: { value: mode === 'offByOne' ? 1 : 0 } },
      vertexShader: 'varying vec2 vUv; uniform vec4 uRect; void main(){ vUv = mix(uRect.xy, uRect.zw, uv); gl_Position = vec4(position.xy * 2.0, 0.0, 1.0); }',
      fragmentShader: 'uniform sampler2D tAtlas; uniform vec2 uAtlasSize; uniform float uSnap; uniform float uRow; varying vec2 vUv; void main(){ vec2 uv = uSnap > 0.5 ? (floor(vUv * uAtlasSize) + vec2(0.5, 0.5 + uRow)) / uAtlasSize : vUv; gl_FragColor = texture2D(tAtlas, uv); }',
      depthTest: false, depthWrite: false,
    });
    const scene = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat));
    const prevRt = renderer.getRenderTarget(), prevColor = renderer.getClearColor(new THREE.Color()), prevClear = renderer.getClearAlpha(), prevAuto = renderer.autoClear;
    renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.autoClear = true; renderer.render(scene, cam);
    const out = new Uint8Array(ow * oh * 4); renderer.readRenderTargetPixels(rt, 0, 0, ow, oh, out);
    renderer.setRenderTarget(prevRt); renderer.setClearColor(prevColor, prevClear); renderer.autoClear = prevAuto;
    let bad = 0, checked = 0, skipped = 0;
    for (let py = 0; py < oh; py++) for (let px = 0; px < ow; px++) {
      const fx = (px + 0.5) * fw / ow, fy = (py + 0.5) * fh / oh;   // read-back row 0 = bottom of the frame (target size is rounded)
      if (Math.abs(fx - Math.round(fx)) < 2e-3 || Math.abs(fy - Math.round(fy)) < 2e-3) { skipped++; continue; }   // exactly on a texel edge
      const tx = Math.floor(fx), ty = fh - 1 - Math.floor(fy), s = (ty * fw + tx) * 4, o = (py * ow + px) * 4;
      checked++;
      if (cpu[s + 3] < 128 && out[o + 3] < 128) continue;   // transparent texel: its colour is never shown (alpha-tested)
      if (cpu[s] !== out[o] || cpu[s + 1] !== out[o + 1] || cpu[s + 2] !== out[o + 2] || cpu[s + 3] !== out[o + 3]) bad++;
    }
    rt.dispose(); mat.dispose(); if (mode === 'linear') tex.dispose();
    return { scale, mode, pixels: ow * oh, checked, skipped, mismatches: bad };
  };
  const scales = [1, 2, 3, 2.37];
  return {
    id, block: [bx, by, fw, fh], atlas: [W, H], cpuBytes: cpu.length, cpuMismatch,
    exact: scales.map((s) => run(s, 'exact')), negative: [run(2, 'offByOne'), run(2.37, 'linear')],
  };
}
