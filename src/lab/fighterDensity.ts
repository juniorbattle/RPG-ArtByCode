/** DEV-ONLY: Ren's combat sheet in the duel (journal Passe RC1; before it, the density trial of journal Passe AA2, whose sheets and values
 *  x2 / x3 / x4 were removed by the operator's decision RC1-4 « Les retirer, garder fighterdensity=combat »). The sheet is judged in the scene
 *  where it will live. Reached only through a dynamic import that `ArenaApp` guards with `import.meta.env.DEV`: production builds compile it
 *  out, and the arena without the parameter is untouched. Nothing becomes canonical: the sheet joins the arena's atlas for this page load.
 *    ?scene=arena&fighterdensity=combat  hero-x3-combat, Ren's COMBAT sheet at x3 (manifest `lab`; its 34 frames of the CB-2 list since
 *                                        journal Passe RC2, the first 22 in Passe RC1): cells of the arena (192 x 288 texels, feet on row 270),
 *                                        its frames take Ren's own keys (`ren/side/<clip>.<i>/0`), so the duel plays them on its moments
 *                                        (sheetFrame: today's techniques and the offensive skills play `skillOff`, Rampart `skillDef`, Fervour
 *                                        `skillSup`), the knockout its three frames (fall, knee, ground) on its own clock
 *    &fighteredge=dark|rim|painted       the sheet's edge; absent = the operator's decision RC1-2 « Liseré peint la nuit, contour noir de
 *                                        jour »: painted at night (a one-texel cool rim painted into the texels on the sides the backlight
 *                                        catches, FighterArt's rimLight, the generated fighters' treatment, with the shader's crown rim), the
 *                                        town's dark outline by day (`time=`); rim = the shader's crown rim alone
 *    &fighterpose=<clip>.<i>             holds one frame of the sheet through the duel
 *  Marek stays the generated x2 fighter. The hero keeps his town presentation scale (0.9, BakedCast). `window.__density` reports the sheet,
 *  the atlas cost, `measure()` (the on-screen size of a texel) and `setPose()`. */
import * as THREE from 'three';
import { PIXEL_WORLD, type Actor, type SpriteRenderer } from '../characters/SpriteRenderer';
import type { ArenaSpriteSet } from '../arena/FighterArt';
import { CELL_W, CELL_H, CELL_FOOT } from '../arena/FighterArt';
import type { Anim } from '../characters/SpriteGenerator';
import { decodePng } from './bakedLoader';
import { hex } from '../characters/BakedDecode';
import { parseAsepriteJson } from '../characters/SheetMeta';

/** the hero's presentation scale in the town (BakedCast, hero entry): kept, so he stands to Marek as the generated Ren did */
const HERO_SCALE = 0.9;
/** the WebGL2 guarantee: the baked texture never exceeds it (packed as the town's, `packBaked`) */
const MAX = 2048;

export interface DensityTrial {
  id: string; k: number; scale: number;
  /** after the presentation chose Ren's frame: the sheet's frame for that moment (sheetFrame, from the simulation's animation and whether
   *  the duel is over), the knockout's clock, a held pose */
  present(ren: Actor, time: number, an: SimAnim | null, over: boolean): void;
  /** the renderer the arena built (its edge mode for the sheet) */
  attach(sprites: SpriteRenderer, camera: THREE.Camera, renderWidth: () => number): void;
  info: Record<string, unknown>;
}

export async function installFighterDensity(set: ArenaSpriteSet, params: URLSearchParams): Promise<DensityTrial> {
  const d = params.get('fighterdensity') ?? '';
  if (d !== COMBAT.param) throw new Error(`fighterdensity "${d}": combat`);
  return installCombat(set, params);
}

/* ------------------------------------------------------------------ the combat sheet (journal Passe RC1) */

/** Ren's combat sheet and how the duel reads it */
export const COMBAT = {
  param: 'combat', id: 'hero-x3-combat',
  /** the duel's clips of today that the CB-2 list renames (briefs/combat-system.md § 14: `skill` becomes `skillOff`; Tourbillon's `slash`
   *  becomes an offensive skill): they play the offensive family's frames, on its own cut (sheetFrame) */
  renamed: { skill: 'skillOff', slash: 'skillOff' } as Record<string, string>,
  /** the knockout's three frames on its own clock (briefs/combat-system.md § 14: 0 fall t < 0.25, 1 on one knee t < 0.6, 2 on the ground) */
  ko: [0.25, 0.6],
};
/** the edge by the page's day state (RC1-2 « Liseré peint la nuit, contour noir de jour »): the night = no `time` or `time=night` */
export const edgeFor = (time: string | null): 'painted' | 'dark' => (!time || time === 'night' ? 'painted' : 'dark');
/** the knockout's frame `e` seconds after its first frame was asked */
export const koFrame = (e: number): number => (e < COMBAT.ko[0] ? 0 : e < COMBAT.ko[1] ? 1 : 2);
/** the skill families' frame counts (§ 14), and the offensive family's impact frame */
export const SKILL_FRAMES: Record<string, number> = { skillOff: 4, skillDef: 3, skillSup: 3 };
const SKILL_IMPACT = 2;
/** what the sheet reads of the simulation's animation (CombatSim and DynamicSim both have it) */
export interface SimAnim { name: string; t: number; dur?: number; impactAt?: number; prep?: number }
/** the sheet's frame for a moment of the duel (briefs/combat-system.md § 14), from the frame the duel chose (`<clip>.<i>`: today's clips,
 *  and dynamicView's on the new moments) and the simulation's animation. Today's techniques and the offensive skills play `skillOff`: 0 the
 *  preparation, held while it lasts (without one, the first half of the run-up), 1 the surge, 2 the strike until the impact + 0.12 s
 *  (today's `skill` cut), 3 the follow-through. A defensive or support skill (dynamicView shows the guard or the raised blade) plays its own
 *  family: 0 the preparation until the impact, 1 the effect through the follow-through (the animation's `dur`; without it 0.12 s), 2 the
 *  return in the recovery. Every other clip is the sheet's own, frame for frame
 *  (the same counts as the duel's); the duel over, its victory. The knockout's third frame is koFrame's. */
export function sheetFrame(chosen: string, an: SimAnim | null, over: boolean): string {
  const clip = chosen.slice(0, chosen.indexOf('.'));
  if (!an) return chosen;
  const t = an.t, ia = an.impactAt ?? 0, prep = an.prep ?? 0;
  if (COMBAT.renamed[clip]) return `${COMBAT.renamed[clip]}.${t < prep || (!prep && t < ia * 0.5) ? 0 : t < ia - 0.04 ? 1 : t < ia + 0.12 ? 2 : 3}`;
  if (!over && (an.name === 'skillDef' || an.name === 'skillSup')) return `${an.name}.${t < ia ? 0 : t < (an.dur ?? ia + 0.12) ? 1 : 2}`;
  return chosen;
}
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
  const edge = params.get('fighteredge') ?? edgeFor(params.get('time'));
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
  // every frame sheetFrame can ask for is the sheet's own: the duel's clips (the renamed ones by their new name, the knockout's three), the
  // three skill families
  const need: Record<string, number> = { ...SKILL_FRAMES };
  for (const [clip, c] of Object.entries(set.clips.ren)) if (!COMBAT.renamed[clip]) need[clip] = clip === 'ko' ? 3 : c.frames.length;
  for (const [clip, n] of Object.entries(need)) if (counts[clip] !== n) throw new Error(`${id}: ${clip} has ${counts[clip] ?? 0} frames, the duel plays ${n}`);
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
  // today's techniques lunge as far as the offensive skill's strike reaches (the duel measures the reach on its clip's impact frame)
  for (const [clip, to] of Object.entries(COMBAT.renamed)) set.clips.ren[clip]?.frames.forEach((_, i) => { set.reach[`ren/${clip}.${i}`] = set.reach[`ren/${to}.${SKILL_IMPACT}`]; });
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
    id, k, sha256, runtimeUse: man.runtimeUse, scale: HERO_SCALE, frames: counts, renamed: COMBAT.renamed, edge, rimTexels, pose,
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
    present(a, time, an, over) {
      ren = a; a.scale = HERO_SCALE;
      if (pose !== null) { a.anim = pose as Anim; return; }
      // the knockout's third frame: the duel's clip has two; its clock is the time since the knockout's first frame was asked
      if (a.anim.startsWith('ko.')) { if (koFrom < 0) koFrom = time; a.anim = `ko.${koFrame(time - koFrom)}` as Anim; return; }
      koFrom = -1;
      a.anim = sheetFrame(a.anim, an, over) as Anim;
    },
  };
}
