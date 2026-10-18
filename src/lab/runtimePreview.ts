/** DEV-ONLY in-scene preview of an exported Art Lab sheet (`?labsprite=<id>`), for judging a candidate sprite under the real
 *  Merchant District lighting, fog, DOF and reflections. Reached only through a dynamic import that `main.ts` guards with
 *  `import.meta.env.DEV`: the production build compiles the branch out (the bundle stays byte-identical) and never sees
 *  Art Lab files. It does not make anything canonical: everything is patched in memory for this page load only.
 *    ?labsprite=<id>            /art-lab/characters/exports/<id>.png + .json
 *                               - 32x48 frames (runtime format): replace every atlas cell of the actor spec
 *                               - larger frames (other pixel density): drawn by a second sprite renderer with the SAME shader,
 *                                 lights and edge treatment, at the same world-space size (density = frame height / 48)
 *    ?labsprite=-               keep the generated frames (placement only: the "before" image of a comparison)
 *    &labactor=porter           spec whose cells are replaced (default porter)
 *    &labtag=idle               tag whose frames are used, in order (default: first tag, else every frame)
 *    &labpos=x,z;x,z            stand the actor (and clones) still at these quay positions, facing the camera
 *    &labfoot=67                foot row of a larger frame (default: frame height - 3 x density)
 *    &labhd=1                   use the second renderer even for 32x48 frames (identical path for density comparisons)
 *    &labdetail=crowd           detail tier of the second renderer's actors (hero | mid | crowd: DOF protection; default mid)
 *    &labscale=0.93             per-actor scale of the second renderer's actors (default 1, a standard NPC)
 *    &labfollow=1               the first actor of the second renderer takes the player's place every frame (the player is
 *                               hidden): walk it with tools/walk.mjs through the framings and their blends
 *    &spritelight=sat,chroma,edge,vertMin,tone,overlay,unlit
 *                               override the character lighting treatment (all sprites, environment untouched); current
 *                               values are 0.8,0.62,1,0.72,0.18,0.55,0 — an empty field keeps the current value */
import * as THREE from 'three';
import type { App } from '../app/App';
import type { Actor } from '../characters/SpriteRenderer';
import { SpriteRenderer, PIXEL_WORLD } from '../characters/SpriteRenderer';
import { SpriteAtlas } from '../characters/SpriteAtlas';
import { FRAME_W, FRAME_H, FOOT_Y } from '../characters/SpriteGenerator';
import { parseAsepriteJson, playOrder } from './sheetMeta';

type W = Window & { __ready?: boolean; __labSprite?: unknown };

export function installLabSprite(app: App, params: URLSearchParams): void {
  const w = window as W;
  // hold the harness's `__ready` until the atlas is patched, so captures never show the generated frames by accident
  let ready = Boolean(w.__ready), patched = false;
  Object.defineProperty(w, '__ready', { configurable: true, get: () => ready && patched, set: (v: boolean) => { ready = v; } });
  const done = (info: unknown) => { w.__labSprite = info; patched = true; };
  const wait = () => (app.atlas && app.actors?.player ? patch(app, params).then(done, (e: Error) => done({ error: String(e.stack ?? e) })) : setTimeout(wait, 16));
  wait();
}

/** E3: the character lighting treatment of SpriteRenderer, exposed as uniforms (desaturation, ambient chroma, silhouette edge,
 *  bottom darkening, tone compression, readability overlay, and an unlit albedo mix for reference). */
const LIGHT_DEFAULT = [0.8, 0.62, 1, 0.72, 0.18, 0.55, 0];
function patchLighting(r: SpriteRenderer, cfg: number[]): void {
  const any = r as unknown as { bodyMat: THREE.ShaderMaterial; overlayMat: THREE.ShaderMaterial; overlayAmount: number };
  for (const m of [any.bodyMat, any.overlayMat]) {
    if (!m.fragmentShader.includes('uVertMin')) {
      m.fragmentShader = m.fragmentShader
        .replace('uniform float uEdge;', 'uniform float uEdge;\nuniform float uVertMin; uniform float uTone; uniform float uUnlit;')
        .replace('mix(0.72, 1.04, smoothstep(0.0, 0.45, vH))', 'mix(uVertMin, 1.04, smoothstep(0.0, 0.45, vH))')
        .replace('col = col / (1.0 + 0.18 * col);', 'col = col / (1.0 + uTone * col);\n  col = mix(col, albedo, uUnlit);');
      m.needsUpdate = true;
    }
  }
  const u = any.bodyMat.uniforms;   // the overlay material shares this uniforms object
  u.uSat.value = cfg[0]; u.uLightChroma.value = cfg[1]; u.uEdge.value = cfg[2];
  u.uVertMin = { value: cfg[3] }; u.uTone = { value: cfg[4] }; u.uUnlit = { value: cfg[6] };
  any.overlayMat.uniforms = u;
  any.overlayAmount = cfg[5];
}

async function loadSheet(id: string, params: URLSearchParams) {
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error(`labsprite "${id}" is not a manifest id`);
  const base = `/art-lab/characters/exports/${id}`;
  const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error(`cannot load ${base}.png`)); i.src = `${base}.png`; });
  const meta = parseAsepriteJson(await (await fetch(`${base}.json`)).json());
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const ctx = c.getContext('2d', { willReadFrequently: true })!; ctx.drawImage(img, 0, 0);
  const tag = params.get('labtag') ?? meta.tags[0]?.name ?? '';
  return { img, ctx, meta, tag, order: playOrder(meta, tag).map((i) => meta.frames[i]) };
}

async function patch(app: App, params: URLSearchParams): Promise<unknown> {
  const id = params.get('labsprite') ?? '-', spec = params.get('labactor') ?? 'porter';
  const atlas = app.atlas, info: Record<string, unknown> = { id, spec };
  if (!atlas.specs.has(spec)) throw new Error(`labactor "${spec}" is not in the atlas`);
  const pos = (params.get('labpos') ?? '').split(';').filter(Boolean).map((p) => p.split(',').map(Number));
  let hiDensity: { renderer: SpriteRenderer; actors: Actor[]; follow: boolean } | null = null;
  if (id !== '-') {
    const { ctx, tag, order } = await loadSheet(id, params);
    const fw = order[0].sw, fh = order[0].sh;
    if (order.some((f) => f.sw !== fw || f.sh !== fh)) throw new Error('labsprite frames must share one size');
    if (fw === FRAME_W && fh === FRAME_H && params.get('labhd') !== '1') {
      const em = (atlas.emis.image as { data: Uint8Array }).data;
      let cells = 0;
      for (const [key, r] of atlas.frames) {
        if (!key.startsWith(`${spec}/`)) continue;
        const f = order[Number(key.split('/')[3]) % order.length];
        const src = ctx.getImageData(f.x, f.y, f.w, f.h).data;
        const cx = Math.round(r.u0 * atlas.width), cy = Math.round((1 - r.v1) * atlas.height);
        for (let y = 0; y < FRAME_H; y++) for (let x = 0; x < FRAME_W; x++) {
          const d = ((atlas.height - 1 - (cy + y)) * atlas.width + cx + x) * 4;   // atlas rows are flipped (row 0 = v 0)
          const sx = x - f.ox, sy = y - f.oy, inside = sx >= 0 && sy >= 0 && sx < f.w && sy < f.h, s = (sy * f.w + sx) * 4;
          for (let k = 0; k < 4; k++) atlas.rgba[d + k] = inside ? src[s + k] : 0;
          em[d] = em[d + 1] = em[d + 2] = 0;
        }
        cells++;
      }
      atlas.texture.needsUpdate = true; atlas.emis.needsUpdate = true;
      Object.assign(info, { tag, frames: order.length, cells });
    } else {
      // other pixel density: a private atlas + a second renderer (same shader, lights, edge treatment); the world-space size is
      // that of a runtime character: density k = frame height / 48, metres per texel = PIXEL_WORLD / k
      const k = fh / FRAME_H, pw = PIXEL_WORLD / k, foot = params.has('labfoot') ? Number(params.get('labfoot')) : fh - Math.round((FRAME_H - FOOT_Y) * k);
      const n = order.length, W = fw * n, H = fh;
      const data = new Uint8ClampedArray(W * H * 4), em = new Uint8ClampedArray(W * H * 4);
      const pa = Object.create(SpriteAtlas.prototype) as SpriteAtlas;
      Object.assign(pa, { frames: new Map(), counts: new Map([['lab/idle', n]]), specs: new Map(), width: W, height: H, frameCount: n, rgba: data });
      order.forEach((f, i) => {
        const src = ctx.getImageData(f.x, f.y, f.w, f.h).data;
        for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
          const d = ((H - 1 - y) * W + i * fw + x) * 4, sx = x - f.ox, sy = y - f.oy, inside = sx >= 0 && sy >= 0 && sx < f.w && sy < f.h, s = (sy * f.w + sx) * 4;
          for (let c = 0; c < 4; c++) data[d + c] = inside ? src[s + c] : 0;
          em[d + 3] = 255;
        }
        pa.frames.set(`lab/down/idle/${i}`, { u0: (i * fw) / W, u1: ((i + 1) * fw) / W, v0: 0, v1: 1 });
      });
      const mk = (buf: Uint8ClampedArray, srgb: boolean) => { const t = new THREE.DataTexture(new Uint8Array(buf.buffer), W, H, THREE.RGBAFormat, THREE.UnsignedByteType); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true; return t; };
      pa.texture = mk(data, true); pa.emis = mk(em, false);
      const r2 = new SpriteRenderer(pa, 8);
      const sh = (r2 as unknown as { shared: { uWorldSize: { value: THREE.Vector2 }; uFootOffset: { value: number } } }).shared;
      sh.uWorldSize.value.set(fw * pw, fh * pw); sh.uFootOffset.value = (fh - foot) * pw;
      app.scene.add(r2.group);
      const detail = (params.get('labdetail') ?? 'mid') as Actor['detail'], scale = params.has('labscale') ? Number(params.get('labscale')) : 1;
      if (!['hero', 'mid', 'crowd'].includes(detail)) throw new Error(`labdetail "${detail}" is not hero | mid | crowd`);
      const actors: Actor[] = (pos.length ? pos : [[app.actors.player.pos.x + 1.2, app.actors.player.pos.z]]).map(([x, z], i) => ({
        id: 9000 + i, spec: 'lab', role: 'labpreview', detail, pos: new THREE.Vector3(x, 0, z), facing: 'down', dir: 'down', flip: false,
        anim: 'idle', t: i * 0.37, speed: 0, tint: [1, 1, 1], scale, height: 1.7, radius: 0.28,
      }));
      for (const a of app.actors.actors) if (a.spec === spec) a.hidden = true;   // the wandering actor would wander into the comparison
      const follow = params.get('labfollow') === '1';
      if (follow) app.actors.player.hidden = true;
      hiDensity = { renderer: r2, actors, follow };
      Object.assign(info, { tag, frames: n, density: k, frame: [fw, fh], foot, metresPerTexel: pw, detail, scale, follow });
      Object.defineProperty(info, 'group', { value: r2.group, enumerable: false });   // measurement tools toggle it to isolate the sprite's pixels
    }
  }
  // E3 lighting configuration (all character sprites; the environment is untouched)
  const sl = params.get('spritelight');
  if (sl !== null) {
    const cfg = LIGHT_DEFAULT.map((v, i) => { const s = sl.split(',')[i]; return s === undefined || s === '' ? v : Number(s); });
    patchLighting(app.sprites, cfg);
    if (hiDensity) patchLighting(hiDensity.renderer, cfg);
    info.spritelight = cfg;
  }
  if (hiDensity) {
    const { renderer, actors, follow } = hiDensity, update = app.update.bind(app);
    app.update = (dt: number) => {
      update(dt);
      for (const a of actors) { a.t += dt; a.pos.y = 0; }
      if (follow) actors[0].pos.set(app.actors.player.pos.x, 0, app.actors.player.pos.z);
      renderer.charScale = app.sprites.charScale;
      renderer.update(actors, app.lights, app.rig.camera, app.moonDir);
    };
    info.placed = actors.map((a) => [a.pos.x, a.pos.z]);
    return info;
  }
  if (pos.length) {
    const acts = app.actors;
    const pool = acts.actors.filter((a) => a.spec === spec && a !== acts.player);
    const placed = pos.map(([x, z]) => {
      const a = pool.shift() ?? acts.spawn(spec, 'labpreview', new THREE.Vector3(x, 0, z));
      a.pos.set(x, 0, z); a.behaviour = { kind: 'idle', seed: 1 }; a.anim = 'idle'; a.bubble = null;
      return a;
    });
    // keep facing the camera (the camera graph may still be settling on the first frames)
    const face = () => { const cam = app.rig.camera.position; for (const a of placed) acts.face(a, new THREE.Vector3(cam.x - a.pos.x, 0, cam.z - a.pos.z)); requestAnimationFrame(face); };
    face();
    info.placed = pos;
  }
  return info;
}
