/** DEV-ONLY: the arena fighters' density trial (journal Passe AA2; the operator's decision AA1-3, « Essai en scène ×2 contre ×4 d'abord »).
 *  Ren takes the hero's baked sheet in the duel's own framing, so the density of the combat sheets is judged in the scene where they will
 *  live. Reached only through a dynamic import that `ArenaApp` guards with `import.meta.env.DEV`: production builds compile it out, and the
 *  arena without the parameter is untouched. Nothing becomes canonical: the sheet joins the arena's atlas for this page load.
 *    ?scene=arena&fighterdensity=x2      hero-x2-v4, the production hero, as it is (64 x 96 texels per 32 x 48 frame)
 *    ?scene=arena&fighterdensity=x3      hero-x3-trial, the same hero rebuilt at x3 (the middle density the trial prices; manifest `lab`)
 *    ?scene=arena&fighterdensity=x4      hero-x4-trial, the same hero rebuilt at x4 from its archived sheets by its chain (manifest `lab`)
 *    &fighterpose=idle|walk|idle.<i>|walk.<i>   what Ren shows: the idle cycle (default), the walk cycle in place, or one frame held
 *    &fighteredge=dark|rim               the baked sheet's edge: the town's dark outline (default), or the shader's crown rim of the moon / sun
 *                                        (the treatment before journal Passe S3b), to judge the hero against the arena's backlight at night
 *    ?scene=arena&fighterdensity=combat  hero-x3-combat, Ren's first COMBAT sheet at x3 (journal Passe RC1; manifest `lab`): cells of the arena
 *                                        (192 x 288 texels, feet on row 270), its frames take Ren's own keys (`ren/side/<clip>.<i>/0`), so the
 *                                        duel plays them on its moments; the clips it does not draw yet borrow its frames (dodge = hit, skill
 *                                        and slash = strike), the knockout plays its three frames (fall, knee, ground) on its own clock;
 *                                        &fighteredge=dark|rim|painted, painted = a one-texel cool rim painted into the texels on the sides the
 *                                        backlight catches (FighterArt's rimLight, the generated fighters' treatment) with the shader's crown rim;
 *                                        &fighterpose=<clip>.<i> holds one frame of the sheet through the duel
 *  The trial sheets carry idle and walk only (no combat frame: the archived sheets draw no sword), so Ren holds the chosen pose through every
 *  moment of the duel; Marek stays the generated x2 fighter, the in-scene reference of today's density. The hero keeps his town presentation
 *  scale (0.9, BakedCast) and, by default, the town's dark outline (`setEdgeMode('dark')`, journal Passe S3b). `window.__density` reports the sheet, the
 *  atlas cost and `measure()`, the on-screen size of a texel in the current pose. */
import * as THREE from 'three';
import { PIXEL_WORLD, type Actor, type SpriteRenderer } from '../characters/SpriteRenderer';
import type { ArenaSpriteSet } from '../arena/FighterArt';
import { CELL_W, CELL_H, CELL_FOOT } from '../arena/FighterArt';
import { FRAME_W, FRAME_H, FOOT_Y, type Anim } from '../characters/SpriteGenerator';
import { loadSheet, decodePng } from './bakedLoader';
import { hex } from '../characters/BakedDecode';
import { parseAsepriteJson } from '../characters/SheetMeta';

/** the sheet of each density */
export const DENSITY_SHEETS: Record<string, string> = { x2: 'hero-x2-v4', x3: 'hero-x3-trial', x4: 'hero-x4-trial' };
/** the hero's presentation scale in the town (BakedCast, hero entry): kept, so he stands to Marek as the generated Ren did */
const HERO_SCALE = 0.9;
/** the town's frame rates of a baked sheet's cycles (build-character.mjs RATE) */
const RATE: Record<string, number> = { idle: 1.7, walk: 7.5 };
/** the WebGL2 guarantee: the baked texture never exceeds it (packed as the town's, `packBaked`) */
const MAX = 2048;

export interface DensityTrial {
  id: string; k: number; scale: number;
  /** after the presentation chose Ren's frame: the hero's pose instead */
  present(ren: Actor, time: number): void;
  /** the renderer the arena built (the town's dark outline for baked sheets) */
  attach(sprites: SpriteRenderer, camera: THREE.Camera, renderWidth: () => number): void;
  info: Record<string, unknown>;
}

export async function installFighterDensity(set: ArenaSpriteSet, params: URLSearchParams): Promise<DensityTrial> {
  const d = params.get('fighterdensity') ?? '';
  if (d === COMBAT.param) return installCombat(set, params);
  const id = DENSITY_SHEETS[d];
  if (!id) throw new Error(`fighterdensity "${d}": x2 | x3 | x4`);
  const sheet = await loadSheet(id, undefined);
  const k = sheet.k, fw = FRAME_W * k, fh = FRAME_H * k;
  // an arena cell (CELL_W x CELL_H town pixels) at k texels per pixel, the hero's frame where FighterArt puts a town frame: feet on the foot row
  const cw = CELL_W * k, ch = CELL_H * k, ox = (CELL_W - FRAME_W) / 2 * k, oy = (CELL_FOOT - FOOT_Y) * k;
  const frames = sheet.frames.filter((f) => f.dir === 'side' && (f.anim === 'idle' || f.anim === 'walk'));
  const counts: Record<string, number> = {};
  for (const f of frames) counts[f.anim] = Math.max(counts[f.anim] ?? 0, f.i + 1);
  const cols = Math.floor(MAX / cw), rows = Math.ceil(frames.length / cols);
  const W = Math.min(frames.length, cols) * cw, H = rows * ch;
  if (H > MAX) throw new Error(`fighterdensity ${d}: ${frames.length} cells of ${cw} x ${ch} need ${W} x ${H}, beyond ${MAX}`);
  const data = new Uint8ClampedArray(W * H * 4), atlas = set.atlas;
  frames.forEach((f, n) => {
    const bx = (n % cols) * cw, by = H - (Math.floor(n / cols) + 1) * ch;   // data row 0 is the bottom of the texture
    for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
      const s = (y * fw + x) * 4, cy = oy + y, dd = ((by + ch - 1 - cy) * W + bx + ox + x) * 4;
      data[dd] = f.rgba[s]; data[dd + 1] = f.rgba[s + 1]; data[dd + 2] = f.rgba[s + 2]; data[dd + 3] = f.rgba[s + 3];
    }
    atlas.frames.set(`ren/side/h${f.anim}.${f.i}/0`, { u0: 0, v0: 0, u1: 0, v1: 0, cell: [bx, by, cw, ch] });
    atlas.counts.set(`ren/h${f.anim}.${f.i}`, 1);
  });
  const t = new THREE.DataTexture(new Uint8Array(data.buffer), W, H, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true;
  atlas.bakedTexture = t; atlas.bakedWidth = W; atlas.bakedHeight = H; atlas.bakedRgba = data;
  atlas.baked.set(id, { k, runtimeUse: sheet.runtimeUse, sha256: sheet.sha256, frames: frames.length });

  const edge = params.get('fighteredge') ?? 'dark';
  if (edge !== 'dark' && edge !== 'rim') throw new Error(`fighteredge "${edge}": dark | rim`);
  const pose = params.get('fighterpose') ?? 'idle';
  const m = /^(idle|walk)(?:\.(\d+))?$/.exec(pose);
  if (!m) throw new Error(`fighterpose "${pose}": idle | walk | idle.<i> | walk.<i>`);
  const anim = m[1], held = m[2] !== undefined ? Number(m[2]) : null;
  if (held !== null && held >= (counts[anim] ?? 0)) throw new Error(`fighterpose "${pose}": ${id} has ${counts[anim] ?? 0} ${anim} frames`);
  let camera: THREE.Camera | null = null, sprites: SpriteRenderer | null = null, ren: Actor | null = null, renderWidth: () => number = () => 0;
  const info: Record<string, unknown> = {
    id, k, sha256: sheet.sha256, runtimeUse: sheet.runtimeUse, scale: HERO_SCALE, frames: counts, pose, edge,
    cell: [cw, ch], texture: [W, H], cellsPerTexture: cols * Math.floor(MAX / ch), textureBytes: W * H * 4, bytesPerCell: cw * ch * 4,
  };
  Object.defineProperty(info, 'measure', {
    enumerable: false,
    /** device pixels of one texel across Ren's quad (horizontal: the billboard's right axis is level), and the quad's width */
    value: () => {
      if (!camera || !sprites || !ren) return null;
      const e = camera.matrixWorldInverse.elements, right = new THREE.Vector3(e[0], e[4], e[8]); right.y = 0; right.normalize();
      const half = (CELL_W * PIXEL_WORLD * sprites.charScale * ren.scale) / 2, mid = ren.pos.clone().add(new THREE.Vector3(0, 1, 0));
      const a = mid.clone().addScaledVector(right, -half).project(camera), b = mid.clone().addScaledVector(right, half).project(camera);
      const quadPx = (Math.abs(b.x - a.x) / 2) * renderWidth();
      return { quadPx, texelPx: quadPx / cw, k, scale: ren.scale, charScale: sprites.charScale };
    },
  });
  (window as Window & { __density?: unknown }).__density = info;
  return {
    id, k, scale: HERO_SCALE, info,
    attach(s, cam, width) {
      s.setEdgeMode(edge === 'dark' ? 'dark' : null);
      sprites = s; camera = cam; renderWidth = width;
    },
    present(a, time) {
      ren = a;
      a.anim = `h${anim}.${held ?? Math.floor(time * RATE[anim]) % counts[anim]}` as Anim;
      a.scale = HERO_SCALE;
    },
  };
}

/* ------------------------------------------------------------------ the combat sheet (journal Passe RC1) */

/** Ren's combat sheet and how the duel reads it */
export const COMBAT = {
  param: 'combat', id: 'hero-x3-combat',
  /** Ren's clips the sheet does not draw yet (they wait for the C2 decision sheet): the frames they borrow */
  borrow: { dodge: 'hit', skill: 'strike', slash: 'strike' } as Record<string, string>,
  /** the knockout's three frames on its own clock (briefs/combat-system.md § 14: 0 fall t < 0.25, 1 on one knee t < 0.6, 2 on the ground) */
  ko: [0.25, 0.6],
};
/** the knockout's frame `e` seconds after its first frame was asked */
export const koFrame = (e: number): number => (e < COMBAT.ko[0] ? 0 : e < COMBAT.ko[1] ? 1 : 2);
const LAB = '/art-lab/characters';
async function json(url: string): Promise<any> {
  const r = await fetch(url);
  // the dev server answers a missing file with the app's index.html (200): a non-JSON answer means "no such file"
  if (!r.ok || !(r.headers.get('content-type') ?? '').includes('json')) throw new Error(`cannot load ${url}: no such file`);
  return r.json();
}
/** FighterArt's rimLight on a cell (one texel; the moon behind: the top and back edges, a little of the front), painted into the texels */
export function paintRim(rgba: Uint8Array, W: number, H: number): number {
  const a = (x: number, y: number) => rgba[(y * W + x) * 4 + 3] > 0, rim: number[] = [];
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    if (!a(x, y)) continue;
    const up = !a(x, y - 1), back = !a(x + 1, y), front = !a(x - 1, y);
    if ((up || back) && a(x, y + 1) && a(x - 1, y)) rim.push(y * W + x, up && back ? 2 : 1);
    else if (front && a(x + 1, y) && a(x, y + 1)) rim.push(y * W + x, 0);
  }
  for (let i = 0; i < rim.length; i += 2) {
    const q = rim[i] * 4, k = rim[i + 1] === 2 ? 0.55 : rim[i + 1] === 1 ? 0.4 : 0.22;
    rgba[q] += (150 - rgba[q]) * k; rgba[q + 1] += (172 - rgba[q + 1]) * k; rgba[q + 2] += (226 - rgba[q + 2]) * k;
  }
  return rim.length / 2;
}

async function installCombat(set: ArenaSpriteSet, params: URLSearchParams): Promise<DensityTrial> {
  const id = COMBAT.id, man = await json(`${LAB}/manifests/${id}.manifest.json`), prov = await json(`${LAB}/provenance/${id}/PROVENANCE.json`);
  if (man.runtimeUse !== 'lab' && man.runtimeUse !== 'production') throw new Error(`${id}: manifest runtimeUse "${man.runtimeUse}" does not allow runtime use`);
  const bytes = new Uint8Array(await (await fetch(`${LAB}/exports/${id}.png`)).arrayBuffer());
  const sha256 = hex(await crypto.subtle.digest('SHA-256', bytes)), want = prov.files?.[`art-lab/characters/exports/${id}.png`];
  if (!want || sha256 !== want) throw new Error(`${id}: exported PNG SHA-256 ${sha256.slice(0, 12)}... does not match its provenance pack`);
  const img = await decodePng(bytes), meta = parseAsepriteJson(await json(`${LAB}/exports/${id}.json`));
  const cw = meta.frames[0].sw, ch = meta.frames[0].sh, k = ch / CELL_H, foot = CELL_FOOT * k;
  if (!Number.isInteger(k) || cw !== CELL_W * k) throw new Error(`${id}: frames of ${cw} x ${ch} are not the arena cell at an integer density`);
  const edge = params.get('fighteredge') ?? 'dark';
  if (edge !== 'dark' && edge !== 'rim' && edge !== 'painted') throw new Error(`fighteredge "${edge}": dark | rim | painted`);
  // the frames, one per tagged frame, checked as the town's loader checks a sheet (binary alpha, a transparent ring, on the foot row)
  const cells: Array<{ clip: string; i: number; rgba: Uint8Array }> = [];
  for (const t of meta.tags) {
    const [clip, dir] = t.name.split('-');
    if (dir !== 'side' || !clip) throw new Error(`${id}: tag "${t.name}" is not <clip>-side`);
    for (let n = t.from; n <= t.to; n++) {
      const f = meta.frames[n], rgba = new Uint8Array(cw * ch * 4);
      if (f.sw !== cw || f.sh !== ch) throw new Error(`${id}: frames must share one size`);
      for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) { const s0 = ((f.y + y) * img.w + f.x + x) * 4, d0 = ((f.oy + y) * cw + f.ox + x) * 4; for (let c = 0; c < 4; c++) rgba[d0 + c] = img.rgba[s0 + c]; }
      let last = -1, bad = 0;
      for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const al = rgba[(y * cw + x) * 4 + 3]; if (al && al !== 255) bad++; if (al < 128) continue; last = y; if (!x || !y || x === cw - 1 || y === ch - 1) bad++; }
      if (bad || last !== foot) throw new Error(`${id} ${t.name} ${n - t.from}: ${bad} texels off the frame contract, last row ${last} (foot ${foot})`);
      cells.push({ clip, i: n - t.from, rgba });
    }
  }
  const counts: Record<string, number> = {};
  for (const c of cells) counts[c.clip] = Math.max(counts[c.clip] ?? 0, c.i + 1);
  for (const [clip, n] of Object.entries(counts)) {
    const duel = clip === 'ko' ? 3 : set.clips.ren[clip]?.frames.length;
    if (duel !== undefined && duel !== n) throw new Error(`${id}: ${clip} has ${n} frames, the duel's clip ${duel}`);
  }
  const cols = Math.floor(MAX / cw), rows = Math.ceil(cells.length / cols), W = Math.min(cells.length, cols) * cw, H = rows * ch;
  if (H > MAX) throw new Error(`${id}: ${cells.length} cells of ${cw} x ${ch} need ${W} x ${H}, beyond ${MAX}`);
  const data = new Uint8ClampedArray(W * H * 4), atlas = set.atlas;
  let rimTexels = 0;
  cells.forEach((c, n) => {
    if (edge === 'painted') rimTexels += paintRim(c.rgba, cw, ch);
    const bx = (n % cols) * cw, by = H - (Math.floor(n / cols) + 1) * ch;   // data row 0 is the bottom of the texture
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const s0 = (y * cw + x) * 4, d0 = ((by + ch - 1 - y) * W + bx + x) * 4; for (let q = 0; q < 4; q++) data[d0 + q] = c.rgba[s0 + q]; }
    atlas.frames.set(`ren/side/${c.clip}.${c.i}/0`, { u0: 0, v0: 0, u1: 0, v1: 0, cell: [bx, by, cw, ch] });
    atlas.counts.set(`ren/${c.clip}.${c.i}`, 1);
    // how far forward of the body axis the frame reaches, in town pixels at the hero's scale (the duel's lunge reads it, as FighterArt's reach)
    let r = 0;
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) if (c.rgba[(y * cw + x) * 4 + 3] > 0) r = Math.max(r, (cw / 2 - x) / k);
    set.reach[`ren/${c.clip}.${c.i}`] = r * HERO_SCALE;
  });
  for (const [clip, from] of Object.entries(COMBAT.borrow)) {
    const n = set.clips.ren[clip]?.frames.length ?? 0;
    for (let i = 0; i < n; i++) {
      const j = Math.min(i, counts[from] - 1);
      atlas.frames.set(`ren/side/${clip}.${i}/0`, atlas.frames.get(`ren/side/${from}.${j}/0`)!); atlas.counts.set(`ren/${clip}.${i}`, 1);
      set.reach[`ren/${clip}.${i}`] = set.reach[`ren/${from}.${j}`];
    }
  }
  const t = new THREE.DataTexture(new Uint8Array(data.buffer), W, H, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true;
  atlas.bakedTexture = t; atlas.bakedWidth = W; atlas.bakedHeight = H; atlas.bakedRgba = data;
  atlas.baked.set(id, { k, runtimeUse: man.runtimeUse, sha256, frames: cells.length });

  // &fighterpose=<clip>.<i>: one frame of the sheet held through the duel (the sheet's frames side by side in the scene); absent = the duel's
  const check = (p: string) => { if (!atlas.frames.has(`ren/side/${p}/0`)) throw new Error(`fighterpose "${p}": ${id} has ${Object.entries(counts).map(([c, n]) => `${c}.0-${n - 1}`).join(', ')}`); return p; };
  let pose = params.get('fighterpose');
  if (pose !== null) check(pose);
  let camera: THREE.Camera | null = null, sprites: SpriteRenderer | null = null, ren: Actor | null = null, renderWidth: () => number = () => 0;
  let koFrom = -1;
  const info: Record<string, unknown> = {
    id, k, sha256, runtimeUse: man.runtimeUse, scale: HERO_SCALE, frames: counts, borrowed: COMBAT.borrow, edge, rimTexels, pose,
    cell: [cw, ch], texture: [W, H], cellsPerTexture: cols * Math.floor(MAX / ch), cellsUsed: cells.length, textureBytes: W * H * 4, bytesPerCell: cw * ch * 4,
  };
  Object.defineProperty(info, 'measure', {
    enumerable: false,
    /** device pixels of one texel across Ren's quad, and the frame shown */
    value: () => {
      if (!camera || !sprites || !ren) return null;
      const e = camera.matrixWorldInverse.elements, right = new THREE.Vector3(e[0], e[4], e[8]); right.y = 0; right.normalize();
      const half = (CELL_W * PIXEL_WORLD * sprites.charScale * ren.scale) / 2, mid = ren.pos.clone().add(new THREE.Vector3(0, 1, 0));
      const a = mid.clone().addScaledVector(right, -half).project(camera), b = mid.clone().addScaledVector(right, half).project(camera);
      const quadPx = (Math.abs(b.x - a.x) / 2) * renderWidth();
      return { quadPx, texelPx: quadPx / cw, k, scale: ren.scale, charScale: sprites.charScale, anim: ren.anim };
    },
  });
  /** captures: hold another frame (null = the duel's own) without reloading the page */
  Object.defineProperty(info, 'setPose', { enumerable: false, value: (p: string | null) => { pose = p === null ? null : check(p); info.pose = pose; if (ren && pose) ren.anim = pose as Anim; } });
  (window as Window & { __density?: unknown }).__density = info;
  return {
    id, k, scale: HERO_SCALE, info,
    attach(s, cam, width) {
      s.setEdgeMode(edge === 'dark' ? 'dark' : null);
      sprites = s; camera = cam; renderWidth = width;
    },
    present(a, time) {
      ren = a; a.scale = HERO_SCALE;
      if (pose !== null) { a.anim = pose as Anim; return; }
      // the knockout's third frame: the duel's clip has two; its clock is the time since the knockout's first frame was asked
      if (a.anim.startsWith('ko.')) { if (koFrom < 0) koFrom = time; a.anim = `ko.${koFrame(time - koFrom)}` as Anim; }
      else koFrom = -1;
    },
  };
}
