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
 *  The sheets carry idle and walk only (no combat frame: the archived sheets draw no sword), so Ren holds the chosen pose through every
 *  moment of the duel; Marek stays the generated x2 fighter, the in-scene reference of today's density. The hero keeps his town presentation
 *  scale (0.9, BakedCast) and, by default, the town's dark outline (`setEdgeMode('dark')`, journal Passe S3b). `window.__density` reports the sheet, the
 *  atlas cost and `measure()`, the on-screen size of a texel in the current pose. */
import * as THREE from 'three';
import { PIXEL_WORLD, type Actor, type SpriteRenderer } from '../characters/SpriteRenderer';
import type { ArenaSpriteSet } from '../arena/FighterArt';
import { CELL_W, CELL_H, CELL_FOOT } from '../arena/FighterArt';
import { FRAME_W, FRAME_H, FOOT_Y, type Anim } from '../characters/SpriteGenerator';
import { loadSheet } from './bakedLoader';

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
