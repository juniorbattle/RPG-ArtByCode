/** DEV-ONLY in-scene preview of an exported Art Lab sheet (`?labsprite=<id>`), for judging a candidate sprite under the real
 *  Merchant District lighting, fog, DOF and reflections. Reached only through a dynamic import that `main.ts` guards with
 *  `import.meta.env.DEV`: the production build compiles the branch out (the bundle stays byte-identical) and never sees
 *  Art Lab files. It does not make anything canonical: the atlas cells are patched in memory for this page load only.
 *    ?labsprite=<id>            /art-lab/characters/exports/<id>.png + .json replace every atlas cell of the actor spec
 *    ?labsprite=-               keep the generated frames (placement only: the "before" image of a comparison)
 *    &labactor=porter           spec whose cells are replaced (default porter)
 *    &labtag=idle               tag whose frames are used, in order (default: first tag, else every frame)
 *    &labpos=x,z;x,z            stand the actor (and clones) still at these quay positions, facing the camera */
import * as THREE from 'three';
import type { App } from '../app/App';
import { FRAME_W, FRAME_H } from '../characters/SpriteGenerator';
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

async function patch(app: App, params: URLSearchParams): Promise<unknown> {
  const id = params.get('labsprite') ?? '-', spec = params.get('labactor') ?? 'porter';
  const atlas = app.atlas, info: Record<string, unknown> = { id, spec };
  if (!atlas.specs.has(spec)) throw new Error(`labactor "${spec}" is not in the atlas`);
  if (id !== '-') {
    if (!/^[a-z0-9-]+$/.test(id)) throw new Error(`labsprite "${id}" is not a manifest id`);
    const base = `/art-lab/characters/exports/${id}`;
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error(`cannot load ${base}.png`)); i.src = `${base}.png`; });
    const meta = parseAsepriteJson(await (await fetch(`${base}.json`)).json());
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d', { willReadFrequently: true })!; ctx.drawImage(img, 0, 0);
    const tag = params.get('labtag') ?? meta.tags[0]?.name ?? '';
    const order = playOrder(meta, tag).map((i) => meta.frames[i]);
    if (order.some((f) => f.sw !== FRAME_W || f.sh !== FRAME_H)) throw new Error(`labsprite frames must be ${FRAME_W}x${FRAME_H} (runtime format)`);
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
  }
  const pos = (params.get('labpos') ?? '').split(';').filter(Boolean).map((p) => p.split(',').map(Number));
  if (pos.length) {
    const acts = app.actors;
    const pool = acts.actors.filter((a) => a.spec === spec && a !== acts.player);
    const placed = pos.map(([x, z], i) => {
      const a = pool[i] ?? acts.spawn(spec, 'labpreview', new THREE.Vector3(x, 0, z));
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
