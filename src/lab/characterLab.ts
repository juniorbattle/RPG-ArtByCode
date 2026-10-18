import * as THREE from 'three';
import { FRAME_H, FOOT_Y } from '../characters/SpriteGenerator';
import { PIXEL_WORLD } from '../characters/SpriteRenderer';
import { CameraGraph, CAM_IDS, type CamId } from '../app/CameraGraph';
import { applyPose } from '../app/CameraRig';
import { makeSyntheticSheet } from './syntheticSheet';
import { parseAsepriteJson, gridMeta, playOrder, type SheetMeta, type SheetFrame } from './sheetMeta';

/** DEV-ONLY Character Lab: shows one exported PNG sprite sheet through Three.js with the same texture rules as the game
 *  (nearest sampling, no mipmaps, clamp, straight alpha), on a neutral background, at 1x, 4x and the real runtime scale.
 *  Reached only through /character-lab.html (a separate Vite page): the game's entry (index.html -> main.ts) never imports
 *  it, so it is absent from the production bundle. It has no Aseprite dependency: by default it draws a synthetic test sheet.
 *   ?sheet=<png url>&meta=<json url>   a real export (Aseprite --sheet / --data, json-array or json-hash)
 *   ?sheet=<png url>&frame=32x48       plain grid instead of metadata
 *   &cam=A|B|C|D  &h=1080  &bg=neutral|dark|light  &tag=walk  &play=0  &foot=45  &guide=0 */

const BGS: Record<string, string> = { neutral: '#808080', dark: '#14171f', light: '#d6d6d6' };
const params = new URLSearchParams(location.search);
const pick = <T extends string>(v: string | null, ok: readonly T[], d: T): T => (ok.includes(v as T) ? (v as T) : d);

const st = {
  bg: pick(params.get('bg'), Object.keys(BGS), 'neutral'),
  cam: pick(params.get('cam')?.toUpperCase() ?? null, CAM_IDS, 'B') as CamId,
  renderH: Number(params.get('h')) || 1080,
  tag: params.get('tag') ?? '',
  play: params.get('play') !== '0',
  guide: params.get('guide') !== '0',
  foot: params.has('foot') ? Number(params.get('foot')) : null as number | null,
  step: 0,      // index inside the current play order
  t: 0,         // ms spent on the current frame
};

/** one reference player position per framing: the authored review positions of `npm run shots` (A = the spawn point) */
const REF_POS: Record<CamId, [number, number]> = { A: [-7.5, 1.8], B: [-4.6, 0.6], C: [9.6, 1.0], D: [24, 1.2] };
const BILLBOARD_TILT = 0.85;      // mirrors SpriteRenderer.tilt (billboard lean toward the camera's up)
const graph = new CameraGraph();

/** Screen pixels per sprite pixel in the game for a player standing at the framing's reference position, at a 16:9 render of
 *  height `renderH`. Uses the game's own camera code (`evalAnchor` + `applyPose`) and the SpriteRenderer sizing rule: a texel is
 *  PIXEL_WORLD metres x the framing's character scale, measured along the billboard's up vector. The player is 21-31 m from the
 *  camera depending on the framing (not `dist`), so the pivot distance alone would be wrong by up to ~45 % (framing A). */
export const runtimeScale = (cam: CamId, renderH: number): number => {
  const [x, z] = REF_POS[cam], aspect = 16 / 9, pose = graph.evalAnchor(cam, x, z), c = new THREE.PerspectiveCamera();
  applyPose(c, pose, aspect);
  const m = c.matrixWorldInverse.elements, feet = new THREE.Vector3(x, 0.01, z);
  const up = new THREE.Vector3(0, 1, 0).lerp(new THREE.Vector3(m[1], m[5], m[9]), BILLBOARD_TILT).normalize();
  const a = feet.clone().project(c), b = feet.clone().add(up).project(c);
  return PIXEL_WORLD * pose.charScale * Math.hypot((b.x - a.x) * 0.5 * renderH * aspect, (b.y - a.y) * 0.5 * renderH);
};

interface Panel { name: string; scale: number; left: number; bottom: number; frame: SheetFrame; quad: THREE.Mesh }
interface Loaded { label: string; tex: THREE.Texture; meta: SheetMeta; image: HTMLImageElement }

const canvas = document.getElementById('lab') as HTMLCanvasElement;
const hud = document.getElementById('hud') as HTMLElement;
const overlay = document.getElementById('labels') as HTMLElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(window.devicePixelRatio || 1);
const scene = new THREE.Scene();
let camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1, 1);
let W = 1, H = 1;
let loaded: Loaded | null = null;
let panels: Panel[] = [];
let guide: THREE.Mesh | null = null;
let atlas: THREE.Mesh | null = null;
let atlasBox = { x: 0, y: 0, w: 0, h: 0 };

const quad = (map: THREE.Texture | null, color = 0xffffff): THREE.Mesh => {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(8), 2));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map, color, transparent: true, depthTest: false, depthWrite: false }));
  m.frustumCulled = false;
  return m;
};
/** rectangle of the sheet image (pixels, origin top-left) -> this quad's UVs */
const setUv = (m: THREE.Mesh, x: number, y: number, w: number, h: number, tw: number, th: number): void => {
  const a = m.geometry.getAttribute('uv') as THREE.BufferAttribute, u0 = x / tw, u1 = (x + w) / tw, vt = 1 - y / th, vb = 1 - (y + h) / th;
  a.setXY(0, u0, vb); a.setXY(1, u1, vb); a.setXY(2, u1, vt); a.setXY(3, u0, vt); a.needsUpdate = true;
};
const place = (m: THREE.Mesh, x: number, y: number, w: number, h: number): void => { m.position.set(x, y, 0); m.scale.set(w, h, 1); };

/** the pixel-art texture contract (same as SpriteAtlas): nearest, no mips, clamp, sRGB colour, straight alpha */
const NEGATIVE_CONTROL = params.get('filter') === 'linear';     // deliberately WRONG filtering: the self-test must then fail
const pixelTexture = (t: THREE.Texture): THREE.Texture => {
  const f = NEGATIVE_CONTROL ? THREE.LinearFilter : THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace; t.magFilter = f; t.minFilter = f;
  t.generateMipmaps = false; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true;
  return t;
};
const loadImage = (url: string): Promise<HTMLImageElement> => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error(`cannot load ${url}`)); i.src = url; });

async function loadSource(): Promise<Loaded> {
  const sheetUrl = params.get('sheet');
  if (!sheetUrl) {
    // synthetic round trip: RGBA in code -> canvas -> PNG blob -> decoded <img> -> GPU texture, exactly like a file on disk
    const s = makeSyntheticSheet();
    const c = document.createElement('canvas'); c.width = s.width; c.height = s.height;
    c.getContext('2d')!.putImageData(new ImageData(s.rgba, s.width, s.height), 0, 0);
    const blob: Blob = await new Promise((r) => c.toBlob((b) => r(b!), 'image/png'));
    const image = await loadImage(URL.createObjectURL(blob));
    return { label: 'synthetic test sheet (generated by code, NOT Aseprite)', tex: pixelTexture(new THREE.Texture(image)), meta: parseAsepriteJson(s.json), image };
  }
  const image = await loadImage(sheetUrl);
  const metaUrl = params.get('meta'), grid = /^(\d+)x(\d+)$/.exec(params.get('frame') ?? '');
  const meta = metaUrl ? parseAsepriteJson(await (await fetch(metaUrl)).json())
    : grid ? gridMeta(image.width, image.height, +grid[1], +grid[2]) : gridMeta(image.width, image.height, image.width, image.height);
  if (meta.width !== image.width || meta.height !== image.height) throw new Error(`metadata says ${meta.width}x${meta.height}, the PNG is ${image.width}x${image.height}`);
  return { label: sheetUrl, tex: pixelTexture(new THREE.Texture(image)), meta, image };
}

const order = (): number[] => playOrder(loaded!.meta, st.tag);
const currentFrame = (): SheetFrame => loaded!.meta.frames[order()[st.step % order().length]];
const footOf = (f: SheetFrame): number => st.foot ?? (f.sh === FRAME_H ? FOOT_Y : f.sh);

function build(): void {
  if (!loaded) return;
  for (const o of [...scene.children]) { scene.remove(o); (o as THREE.Mesh).geometry?.dispose(); }
  overlay.innerHTML = '';
  const dpr = renderer.getPixelRatio();
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  const buf = renderer.getDrawingBufferSize(new THREE.Vector2()); W = buf.x; H = buf.y;
  camera = new THREE.OrthographicCamera(0, W, H, 0, -1, 1);   // 1 world unit = 1 device pixel, origin bottom-left
  renderer.setClearColor(new THREE.Color(BGS[st.bg]));
  const { tex, meta } = loaded;
  const f0 = currentFrame(), rt = runtimeScale(st.cam, st.renderH);
  const defs: Array<[string, number]> = [['1x', 1], ['4x nearest', 4], [`runtime, Camera ${st.cam}: ${rt.toFixed(2)}x @ ${st.renderH}p`, rt]];

  // all panels share one foot line, snapped to the device pixel grid (the game snaps the sprite anchor the same way)
  const baseline = Math.round(H * 0.42);
  let x = 48;
  panels = defs.map(([name, scale]) => {
    const q = quad(tex); scene.add(q);
    const p: Panel = { name, scale, left: 0, bottom: 0, frame: f0, quad: q };
    const boxW = f0.sw * scale;
    p.left = x; x = Math.round(x + boxW + 64);
    const label = document.createElement('div'); label.className = 'lbl'; label.textContent = name;
    label.style.left = `${p.left / dpr}px`; label.style.top = `${(H - baseline + 12) / dpr}px`; overlay.appendChild(label);
    return p;
  });
  if (st.guide) { guide = quad(null, 0xffffff); (guide.material as THREE.MeshBasicMaterial).opacity = 0.35; guide.position.set(0, baseline - 1, 0); guide.scale.set(W, 1, 1); scene.add(guide); } else guide = null;

  const sc = meta.width * 2 + 32 <= W ? 2 : 1;
  atlas = quad(tex); setUv(atlas, 0, 0, meta.width, meta.height, meta.width, meta.height);
  atlasBox = { x: 16, y: H - 16 - meta.height * sc, w: meta.width * sc, h: meta.height * sc };
  place(atlas, atlasBox.x, atlasBox.y, atlasBox.w, atlasBox.h); scene.add(atlas);
  const al = document.createElement('div'); al.className = 'lbl'; al.textContent = `sheet ${meta.width}x${meta.height} @${sc}x - ${meta.frames.length} frame(s)`;
  al.style.left = `${atlasBox.x / dpr}px`; al.style.top = `${(H - atlasBox.y + 4) / dpr}px`; overlay.appendChild(al);
  const hl = document.createElement('div'); hl.id = 'hl'; overlay.appendChild(hl);
  layoutFrame(baseline);
}

/** position every panel for the current frame */
function layoutFrame(baseline = Math.round(H * 0.42)): void {
  if (!loaded) return;
  const f = currentFrame(), { meta } = loaded, foot = footOf(f), dpr = renderer.getPixelRatio();
  for (const p of panels) {
    p.frame = f;
    const boxBottom = baseline - (f.sh - foot) * p.scale;              // untrimmed box, anchored by its foot line
    p.left = Math.round(p.left);
    p.bottom = boxBottom + (f.sh - f.oy - f.h) * p.scale;
    place(p.quad, p.left + f.ox * p.scale, p.bottom, f.w * p.scale, f.h * p.scale);
    setUv(p.quad, f.x, f.y, f.w, f.h, meta.width, meta.height);
  }
  const hl = document.getElementById('hl');
  if (hl) {
    const sc = atlasBox.w / meta.width;
    Object.assign(hl.style, { left: `${(atlasBox.x + f.x * sc) / dpr - 1}px`, top: `${(H - atlasBox.y - atlasBox.h + f.y * sc) / dpr - 1}px`, width: `${(f.w * sc) / dpr}px`, height: `${(f.h * sc) / dpr}px` });
  }
}

function render(): void { renderer.render(scene, camera); }

function updateHud(): void {
  if (!loaded) return;
  const f = currentFrame(), idx = order()[st.step % order().length], m = loaded.meta;
  const rt = CAM_IDS.map((c) => `${c} ${runtimeScale(c, st.renderH).toFixed(2)}`).join(' | ');
  hud.querySelector('#info')!.textContent =
`source   ${loaded.label}
metadata ${m.source}; ${m.frames.length} frame(s), tags: ${m.tags.map((t) => t.name).join(', ') || 'none'}
frame    ${idx}  ${f.name}  ${f.w}x${f.h}${f.sw !== f.w || f.sh !== f.h ? ` (box ${f.sw}x${f.sh})` : ''}  ${f.duration} ms  ${st.play ? 'playing' : 'paused'}
texture  ${NEGATIVE_CONTROL ? 'LINEAR (negative control: this is the WRONG filter)' : 'nearest'} / no mipmaps / clamp / sRGB, straight alpha
runtime  screen px per sprite px @ ${st.renderH}p: ${rt}
units    device pixels (browser zoom 100%)`;
}

let last = performance.now();
function tick(now: number): void {
  const dt = now - last; last = now;
  if (loaded && st.play) {
    st.t += dt;
    for (let n = 0; n < 8 && st.t >= currentFrame().duration; n++) { st.t -= currentFrame().duration; st.step = (st.step + 1) % order().length; }
    layoutFrame(); updateHud();
  }
  render();
  requestAnimationFrame(tick);
}

function buildControls(): void {
  const opt = (vals: string[], cur: string) => vals.map((v) => `<option value="${v}"${v === cur ? ' selected' : ''}>${v || 'all frames'}</option>`).join('');
  const tags = ['', ...loaded!.meta.tags.map((t) => t.name)];
  if (!tags.includes(st.tag)) st.tag = loaded!.meta.tags.find((t) => t.name === 'walk') ? 'walk' : '';
  hud.querySelector('#ctl')!.innerHTML =
    `tag <select id="s-tag">${opt(tags, st.tag)}</select> camera <select id="s-cam">${opt(CAM_IDS, st.cam)}</select> background <select id="s-bg">${opt(Object.keys(BGS), st.bg)}</select>
     <button id="b-play">play / pause</button> <span class="hint">space = play, arrows = step</span>`;
  const on = (id: string, fn: (v: string) => void) => document.getElementById(id)!.addEventListener('change', (e) => { fn((e.target as HTMLSelectElement).value); });
  on('s-tag', (v) => { st.tag = v; st.step = 0; st.t = 0; layoutFrame(); updateHud(); });
  on('s-cam', (v) => { st.cam = v as CamId; build(); updateHud(); });
  on('s-bg', (v) => { st.bg = v; build(); });
  document.getElementById('b-play')!.addEventListener('click', () => { st.play = !st.play; updateHud(); });
}

window.addEventListener('keydown', (e) => {
  if (!loaded || (e.target as HTMLElement).tagName === 'SELECT') return;
  if (e.key === ' ') { st.play = !st.play; e.preventDefault(); }
  else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { st.play = false; const n = order().length; st.step = (st.step + (e.key === 'ArrowRight' ? 1 : n - 1)) % n; layoutFrame(); }
  else return;
  updateHud();
});
window.addEventListener('resize', () => { build(); updateHud(); });

// ---------------------------------------------------------------------------------------------------------------------------
// Self-test: proves the exported sprite reaches the screen texel-for-texel (nearest filtering, correct scale, transparency).
// For every pixel of every panel it recomputes which texel the rasteriser should have sampled and compares the frame buffer
// with the decoded PNG composited over the background. Opaque and fully transparent texels must match within 1/255
// (sRGB round trip); 50 % alpha texels within 4/255. Pixels exactly on a texel boundary are skipped (rasteriser tie).
function selfTest() {
  if (!loaded) throw new Error('lab not ready');
  const keep = { play: st.play, step: st.step, t: st.t };
  st.play = false; st.step = 0; st.t = 0; layoutFrame();
  if (guide) guide.visible = false;      // the foot guide is an overlay, not part of the sprite
  render();

  const src = document.createElement('canvas'); src.width = loaded.image.width; src.height = loaded.image.height;
  const sctx = src.getContext('2d', { willReadFrequently: true })!; sctx.drawImage(loaded.image, 0, 0);
  const sdata = sctx.getImageData(0, 0, src.width, src.height).data;
  const out = document.createElement('canvas'); out.width = W; out.height = H;
  const octx = out.getContext('2d', { willReadFrequently: true })!; octx.drawImage(canvas, 0, 0);
  const odata = octx.getImageData(0, 0, W, H).data;
  const bg = new THREE.Color(BGS[st.bg]).getHex(), bgc = [(bg >> 16) & 255, (bg >> 8) & 255, bg & 255];

  const results = panels.map((p) => {
    const f = p.frame, w = f.w * p.scale, h = f.h * p.scale, left = p.quad.position.x, bottom = p.quad.position.y;
    let pixels = 0, skipped = 0, bad = 0, maxDelta = 0, maxSemi = 0, opaque = 0, clear = 0, semi = 0;
    const examples: string[] = [];
    for (let py = Math.max(0, Math.floor(H - bottom - h) - 2); py < Math.min(H, Math.ceil(H - bottom) + 2); py++) {
      for (let px = Math.max(0, Math.floor(left) - 2); px < Math.min(W, Math.ceil(left + w) + 2); px++) {
        const cx = px + 0.5, gy = H - py - 0.5;
        let want: number[], tol = 1, kind = 'clear';
        if (cx < left || cx >= left + w || gy < bottom || gy >= bottom + h) want = bgc;
        else {
          const fx = (cx - left) / p.scale, fy = (bottom + h - gy) / p.scale;
          if (Math.abs(fx - Math.round(fx)) < 2e-3 || Math.abs(fy - Math.round(fy)) < 2e-3) { skipped++; continue; }
          const si = ((f.y + Math.floor(fy)) * src.width + f.x + Math.floor(fx)) * 4, a = sdata[si + 3] / 255;
          want = [0, 1, 2].map((k) => Math.round(sdata[si + k] * a + bgc[k] * (1 - a)));
          if (a === 1) { kind = 'opaque'; } else if (a === 0) { kind = 'clear'; } else { kind = 'semi'; tol = 4; }
        }
        const oi = (py * W + px) * 4, d = Math.max(Math.abs(odata[oi] - want[0]), Math.abs(odata[oi + 1] - want[1]), Math.abs(odata[oi + 2] - want[2]));
        pixels++; if (kind === 'opaque') opaque++; else if (kind === 'semi') semi++; else clear++;
        if (kind === 'semi') maxSemi = Math.max(maxSemi, d); else maxDelta = Math.max(maxDelta, d);
        if (d > tol) { bad++; if (examples.length < 4) examples.push(`(${px},${py}) got ${odata[oi]},${odata[oi + 1]},${odata[oi + 2]} want ${want.join(',')}`); }
      }
    }
    return { panel: p.name, scale: +p.scale.toFixed(3), pixels, opaque, clear, semi, skipped, mismatches: bad, maxDeltaOpaqueOrClear: maxDelta, maxDeltaSemi: maxSemi, examples };
  });

  // the GL state behind the texture, read back from the driver (not just three's flags)
  const gl = renderer.getContext() as WebGL2RenderingContext;
  const handle = (renderer.properties.get(loaded.tex) as { __webglTexture?: WebGLTexture }).__webglTexture;
  let filter = { mag: 'unknown', min: 'unknown', mipmapsRequested: loaded.tex.generateMipmaps };
  if (handle) {
    const prev = gl.getParameter(gl.TEXTURE_BINDING_2D); gl.bindTexture(gl.TEXTURE_2D, handle);
    const name = (v: number) => (v === gl.NEAREST ? 'NEAREST' : v === gl.LINEAR ? 'LINEAR' : String(v));
    filter = { ...filter, mag: name(gl.getTexParameter(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER)), min: name(gl.getTexParameter(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER)) };
    gl.bindTexture(gl.TEXTURE_2D, prev); renderer.resetState();
  }
  if (guide) guide.visible = true;
  Object.assign(st, keep); layoutFrame(); render();
  const passed = filter.mag === 'NEAREST' && filter.min === 'NEAREST' && results.every((r) => r.mismatches === 0 && r.pixels > 0);
  return { passed, filter, background: BGS[st.bg], devicePixelRatio: renderer.getPixelRatio(), canvas: `${W}x${H}`, results };
}

async function main(): Promise<void> {
  try {
    loaded = await loadSource();
    buildControls(); build(); updateHud(); render();
    (window as any).__lab = { state: st, selfTest, runtimeScale, panels: () => panels.map((p) => ({ name: p.name, scale: p.scale, left: p.quad.position.x, bottom: p.quad.position.y })) };
    requestAnimationFrame(tick);
    let n = 0; const wait = () => { if (++n > 3) (window as any).__ready = true; else requestAnimationFrame(wait); }; wait();
  } catch (e) {
    hud.querySelector('#info')!.textContent = `ERROR: ${(e as Error).message}`;
    (window as any).__labError = String((e as Error).stack ?? e); (window as any).__ready = true;
  }
}
void main();
