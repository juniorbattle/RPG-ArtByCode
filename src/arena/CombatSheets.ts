import * as THREE from 'three';
import { PIXEL_WORLD, type Actor, type SpriteRenderer } from '../characters/SpriteRenderer';
import type { Anim } from '../characters/SpriteGenerator';
import { decodePng, sha256 } from '../characters/BakedDecode';
import { parseAsepriteJson } from '../characters/SheetMeta';
import { CELL_FOOT, CELL_H, CELL_W, type ArenaSpriteSet } from './FighterArt';

/** The fighters' baked combat sheets in the arena (journal Passes RC1, RC2, CX1): cells of the arena at x3 (192 x 288 texels, feet on row 270, facing left) in place of the
 *  generated frames, by their keys `<seat>/side/<clip>.<i>/0`: the duel plays them on its moments (sheetFrame). Ren and the rival of the bout share one texture: a page of 2048 holds
 *  70 full cells, Ren's 39 and a rival's 34 are 73, so the top rows every frame leaves empty are not stored (TRIM): cells of 255 rows, 80 a page, the same pixels. */

/** the seats of a duel (the simulation's ids) */
export type Seat = 'ren' | 'marek';
/** the hero's presentation scale in the town (BakedCast, hero entry): a rival at x3 keeps it too, one texel the same size on both sides */
const SCALE = 0.9;
/** the WebGL2 guarantee: the baked texture never exceeds it (packed as the town's, `packBaked`) */
const MAX = 2048;
/** the top town pixels of the arena's cell that no frame uses (a blade raised overhead stays under them): dropped from the quad and from the texture alike */
export const TRIM = 11;
/** the sprites' frame in a page of baked sheets: the quad loses its empty top, the feet keep their place */
export const SHEET_FRAME = { w: CELL_W, h: CELL_H - TRIM, foot: CELL_FOOT - TRIM };

/** the sheets in the arena's light (the operator's lot sheet, journal Passe CX2): by day its sun bleaches them, steel and hair into one white (CX-L1 « 0,65 »); at night armour and boots sink
 *  into the cobbles (CX-L2 « 1,3 ») */
export const DAY_SHADE = 0.65, NIGHT_SHADE = 1.3;
/** the shade of the page's day state: the night = no `time` or `time=night` */
export const shadeFor = (time: string | null): number => (!time || time === 'night' ? NIGHT_SHADE : DAY_SHADE);

/** how the duel reads a sheet */
export const COMBAT = {
  /** the duel's clips of today that the CB-2 list renames (briefs/combat-system.md § 14: `skill` becomes `skillOff`; Tourbillon's `slash`
   *  becomes an offensive skill): they play the offensive family's frames, on its own cut (sheetFrame) */
  renamed: { skill: 'skillOff', slash: 'skillOff' } as Record<string, string>,
  /** the knockout's three frames on its own clock (briefs/combat-system.md § 14: 0 fall t < 0.25, 1 on one knee t < 0.6, 2 on the ground) */
  ko: [0.25, 0.6],
  /** the charge's loops (§ 14), frames per second: low 0.8 s, high 0.6 s */
  chargeRate: 2.5, chargeHiRate: 2 / 0.6,
};
/** the edge by the page's day state (RC1-2 « Liseré peint la nuit, contour noir de jour »): the night = no `time` or `time=night` */
export const edgeFor = (time: string | null): 'painted' | 'dark' => (!time || time === 'night' ? 'painted' : 'dark');
/** the knockout's frame `e` seconds after its first frame was asked */
export const koFrame = (e: number): number => (e < COMBAT.ko[0] ? 0 : e < COMBAT.ko[1] ? 1 : 2);
/** the skill families' frame counts (§ 14), and the offensive family's impact frame */
export const SKILL_FRAMES: Record<string, number> = { skillOff: 4, skillDef: 3, skillSup: 3 };
const SKILL_IMPACT = 2;
/** a skill's family (DynActionDef) -> the sheet's clip */
export const FAMILY_CLIP: Record<string, string> = { offensive: 'skillOff', defensive: 'skillDef', support: 'skillSup' };
/** what the sheet reads of the simulation's animation (CombatSim and DynamicSim both have it) */
export interface SimAnim { name: string; t: number; dur?: number; impactAt?: number; prep?: number }
/** the sheet's frame for a moment of the duel (briefs/combat-system.md § 14), from the frame the duel chose (`<clip>.<i>`: today's clips,
 *  and dynamicView's on the new moments) and the simulation's animation. Today's techniques and the offensive skills play `skillOff`: 0 the
 *  preparation, held while it lasts (without one, the first half of the run-up), 1 the surge, 2 the strike until the impact + 0.12 s
 *  (today's `skill` cut), 3 the follow-through. A defensive or support skill (dynamicView shows the guard or the raised blade) plays its own
 *  family: 0 the preparation until the impact, 1 the effect through the follow-through (the animation's `dur`; without it 0.12 s), 2 the
 *  return in the recovery. Every other clip is the sheet's own, frame for frame
 *  (the same counts as the duel's); the duel over, its victory. The knockout's third frame is koFrame's. `family`: a rival's skill plays
 *  its family's clip under another animation's name (v2duel.ts) */
export function sheetFrame(chosen: string, an: SimAnim | null, over: boolean, family: string | null = null): string {
  const clip = chosen.slice(0, chosen.indexOf('.'));
  if (!an) return chosen;
  const t = an.t, ia = an.impactAt ?? 0, prep = an.prep ?? 0, fam = family ?? an.name;
  if (COMBAT.renamed[clip] || (!over && family === 'skillOff')) return `skillOff.${t < prep || (!prep && t < ia * 0.5) ? 0 : t < ia - 0.04 ? 1 : t < ia + 0.12 ? 2 : 3}`;
  if (!over && (fam === 'skillDef' || fam === 'skillSup')) return `${fam}.${t < ia ? 0 : t < (an.dur ?? ia + 0.12) ? 1 : 2}`;
  return chosen;
}
/** the charge's frame: the guard held over it; the attack held, low until the heavy attack's tier is passed, high from a skill's tier on (§ 14, tier 0 the light attack, 1 the heavy) */
export function chargeFrame(guarding: boolean, reached: number, time: number): string {
  if (guarding) return 'chargeGuard.0';
  return reached >= 2 ? `chargeHi.${Math.floor(time * COMBAT.chargeHiRate) % 2}` : `charge.${Math.floor(time * COMBAT.chargeRate) % 2}`;
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

/** a sheet to install: its export, its pinned SHA-256 (its provenance pack), who sits where */
export interface SheetSource { seat: Seat; id: string; png: Uint8Array; json: unknown; sha256: string; runtimeUse: string }
/** `push`: how far the cell moved the frame's body behind its axis to hold the blade (texels, the JSON's meta.pushed, build-combat.mjs) */
interface Cell { seat: Seat; clip: string; i: number; rgba: Uint8Array; push: number }

/** the frames of one sheet, checked as the town's loader checks a sheet: one cell size, binary alpha, a transparent ring, on the foot row, nothing in the trimmed rows */
async function cellsOf(s: SheetSource, rim: boolean): Promise<{ cells: Cell[]; k: number; rimTexels: number }> {
  const got = await sha256(s.png);
  if (got !== null && got !== s.sha256) throw new Error(`${s.id}: exported PNG SHA-256 ${got.slice(0, 12)}... does not match its provenance pack`);
  const img = await decodePng(s.png), meta = parseAsepriteJson(s.json), pushed: Record<string, number> = (s.json as { meta?: { pushed?: Record<string, number> } }).meta?.pushed ?? {};
  const cw = meta.frames[0].sw, ch = meta.frames[0].sh, k = ch / CELL_H, foot = CELL_FOOT * k, cut = TRIM * k;
  if (!Number.isInteger(k) || cw !== CELL_W * k) throw new Error(`${s.id}: frames of ${cw} x ${ch} are not the arena cell at an integer density`);
  const cells: Cell[] = [];
  let rimTexels = 0;
  for (const t of meta.tags) {
    const [clip, dir] = t.name.split('-');
    if (dir !== 'side' || !clip) throw new Error(`${s.id}: tag "${t.name}" is not <clip>-side`);
    for (let n = t.from; n <= t.to; n++) {
      const f = meta.frames[n], rgba = new Uint8Array(cw * ch * 4);
      if (f.sw !== cw || f.sh !== ch) throw new Error(`${s.id}: frames must share one size`);
      for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) { const s0 = ((f.y + y) * img.w + f.x + x) * 4, d0 = ((f.oy + y) * cw + f.ox + x) * 4; for (let c = 0; c < 4; c++) rgba[d0 + c] = img.rgba[s0 + c]; }
      let last = -1, bad = 0, high = 0;
      for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const al = rgba[(y * cw + x) * 4 + 3]; if (al && al !== 255) bad++; if (al < 128) continue; last = y; if (y < cut) high++; if (!x || !y || x === cw - 1 || y === ch - 1) bad++; }
      if (bad || last !== foot) throw new Error(`${s.id} ${t.name} ${n - t.from}: ${bad} texels off the frame contract, last row ${last} (foot ${foot})`);
      if (high) throw new Error(`${s.id} ${t.name} ${n - t.from}: ${high} texels above row ${cut}, the rows no frame may use`);
      if (rim) rimTexels += paintRim(rgba, cw, ch);
      cells.push({ seat: s.seat, clip, i: n - t.from, rgba, push: pushed[`${clip}.${n - t.from}`] ?? 0 });
    }
  }
  return { cells, k, rimTexels };
}

/** the frame a clip the sheet does not hold falls back on (§ 14: `block`, `dodge` and the families only when the rival has them): never a generated frame beside the sheet's */
const FALLBACK = (clip: string): string => (clip === 'dodge' ? 'hit' : 'ready');

export interface InstalledSheets {
  /** the sprites' frame of this page */
  frame: { w: number; h: number; foot: number };
  /** after the presentation chose the fighters' frames: each one's sheet frame */
  present(fighters: Record<Seat, Actor>, time: number, sim: { over: boolean; f: Record<Seat, any> }, charge: { held: boolean; reached: number } | null): void;
  /** the renderer the arena built (its edge mode for the sheets) */
  attach(sprites: SpriteRenderer): void;
  info: { sheets: Array<{ seat: Seat; id: string; frames: number; runtimeUse: string }>; counts: Record<Seat, Record<string, number>>; texture: [number, number]; cells: number; cellsPerPage: number; bytes: number; edge: string; rimTexels: number };
}

/** the sheets in the set's atlas: one baked texture, their frames on the seats' keys, each frame's reach measured, the generated cells that stay (the crowd, the former effects) cut
 *  like the quad; a `pose` holds one frame of Ren's through the duel (a lab's review) */
export async function installSheets(set: ArenaSpriteSet, sheets: SheetSource[], edge: 'painted' | 'dark' | 'rim', hold?: { pose: () => string | null; shade?: number }): Promise<InstalledSheets> {
  const lists = await Promise.all(sheets.map((s) => cellsOf(s, edge === 'painted')));
  const cells = lists.flatMap((l) => l.cells), k = lists[0].k;
  if (lists.some((l) => l.k !== k)) throw new Error('the sheets of a duel share one density');
  const cw = CELL_W * k, ch = CELL_H * k, cut = TRIM * k, sh = ch - cut, cols = Math.floor(MAX / cw), rowsMax = Math.floor(MAX / sh), rows = Math.ceil(cells.length / cols);
  if (rows > rowsMax) throw new Error(`${cells.length} cells of ${cw} x ${sh} are more than a page of ${MAX} holds (${cols * rowsMax})`);
  const W = Math.min(cells.length, cols) * cw, H = rows * sh, data = new Uint8ClampedArray(W * H * 4), atlas = set.atlas;
  const counts: Record<Seat, Record<string, number>> = { ren: {}, marek: {} }, pushes: Record<string, number> = {};
  // the generated frames that stay are drawn on the shorter quad: their cells lose the same share at the top (several keys can share one rectangle)
  const seen = new Set<object>();
  for (const f of atlas.frames.values()) { if (seen.has(f)) continue; seen.add(f); f.v1 -= (f.v1 - f.v0) * (TRIM / CELL_H); }
  cells.forEach((c, n) => {
    const bx = (n % cols) * cw, by = H - (Math.floor(n / cols) + 1) * sh;   // data row 0 is the bottom of the texture
    for (let y = cut; y < ch; y++) for (let x = 0; x < cw; x++) { const s0 = (y * cw + x) * 4, d0 = ((by + ch - 1 - y) * W + bx + x) * 4; for (let q = 0; q < 4; q++) data[d0 + q] = c.rgba[s0 + q]; }
    atlas.frames.set(`${c.seat}/side/${c.clip}.${c.i}/0`, { u0: 0, v0: 0, u1: 0, v1: 0, cell: [bx, by, cw, sh] });
    atlas.counts.set(`${c.seat}/${c.clip}.${c.i}`, 1);
    counts[c.seat][c.clip] = Math.max(counts[c.seat][c.clip] ?? 0, c.i + 1);
    // how far forward of the body the frame reaches, in town pixels at the presentation's scale (the duel's lunge reads it, as FighterArt's reach)
    let r = 0;
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) if (c.rgba[(y * cw + x) * 4 + 3] > 0) r = Math.max(r, (cw / 2 - x) / k);
    set.reach[`${c.seat}/${c.clip}.${c.i}`] = (r + c.push / k) * SCALE;
    pushes[`${c.seat}/${c.clip}.${c.i}`] = c.push / k;
  });
  for (const s of sheets) {
    const need: Record<string, number> = { idle: 2, ready: 2, strike: 3, heavy: 4, hit: 2, recover: 2, ko: 3, victory: 2 };
    for (const [clip, n] of Object.entries(need)) if (counts[s.seat][clip] !== n) throw new Error(`${s.id}: ${clip} has ${counts[s.seat][clip] ?? 0} frames, the duel plays ${n}`);
    // today's techniques lunge as far as the offensive skill's strike reaches (the duel measures the reach on its clip's impact frame)
    for (const [clip, to] of Object.entries(COMBAT.renamed)) if (counts[s.seat][to]) set.clips[s.seat][clip]?.frames.forEach((_, i) => { set.reach[`${s.seat}/${clip}.${i}`] = set.reach[`${s.seat}/${to}.${SKILL_IMPACT}`]; });
  }
  const t = new THREE.DataTexture(new Uint8Array(data.buffer), W, H, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true;
  atlas.bakedTexture = t; atlas.bakedWidth = W; atlas.bakedHeight = H; atlas.bakedRgba = data;
  sheets.forEach((s, i) => atlas.baked.set(s.id, { k, runtimeUse: s.runtimeUse as never, sha256: s.sha256, frames: lists[i].cells.length }));

  const seats = sheets.map((s) => s.seat), koFrom: Record<string, number> = { ren: -1, marek: -1 };
  let charScale = 1;
  /** the frame the fighter shows: its body back on its place when the cell moved it (the sprite forward by as much) */
  const shade = hold?.shade ?? 1;
  const show = (a: Actor, seat: Seat, fr: string) => { a.anim = fr as Anim; a.tint = [a.tint[0] * shade, a.tint[1] * shade, a.tint[2] * shade]; a.pos.x += (seat === 'ren' ? 1 : -1) * (pushes[`${seat}/${fr}`] ?? 0) * PIXEL_WORLD * charScale * SCALE; };
  return {
    frame: SHEET_FRAME,
    attach(s) { s.setEdgeMode(edge === 'dark' ? 'dark' : null); charScale = s.charScale; },
    present(fighters, time, sim, charge) {
      for (const seat of seats) {
        const a = fighters[seat], f = sim.f[seat], held = seat === 'ren' ? hold?.pose() ?? null : null;
        a.scale = SCALE;
        if (held !== null) { show(a, seat, held); continue; }
        // the knockout's third frame: the duel's clip has two; its clock is the time since the knockout's first frame was asked
        if (a.anim.startsWith('ko.')) { if (koFrom[seat] < 0) koFrom[seat] = time; show(a, seat, `ko.${koFrame(time - koFrom[seat])}`); continue; }
        koFrom[seat] = -1;
        if (seat === 'ren' && charge?.held && f.state === 'idle' && counts.ren.charge) { show(a, seat, chargeFrame(!!f.guarding, charge.reached, time)); continue; }
        const def = f.state === 'acting' ? f.act?.def : null, family = def?.kind === 'skill' && seat !== 'ren' ? FAMILY_CLIP[def.family] ?? null : null;
        const fr = sheetFrame(a.anim, f.anim, sim.over, family), clip = fr.slice(0, fr.indexOf('.'));
        show(a, seat, counts[seat][clip] ? fr : `${FALLBACK(clip)}.${Math.min(Number(fr.slice(fr.indexOf('.') + 1)), 1)}`);
      }
    },
    info: {
      sheets: sheets.map((s, i) => ({ seat: s.seat, id: s.id, frames: lists[i].cells.length, runtimeUse: s.runtimeUse })), counts, texture: [W, H], cells: cells.length, cellsPerPage: cols * rowsMax,
      bytes: W * H * 4, edge, rimTexels: lists.reduce((a, l) => a + l.rimTexels, 0),
    },
  };
}

/** the faces the HUD shows beside a sheet (L4 « Visage cuit d'abord, bustes plus tard »): each fighter's town sheet, front idle, head and shoulders, 32 x 32 texels */
export async function bakedFaces(set: ArenaSpriteSet, foe: string): Promise<void> {
  const [{ plazaFaces }, { castSource }, { sheetFrames }, { faceCrop }] = await Promise.all([import('../characters/PlazaCast'), import('../characters/BakedCast'), import('../characters/BakedDecode'), import('../ui/portraits')]);
  const faces: Array<[Seat, { id: string; png: string; json: unknown; sha256: string } | null]> = [['ren', { id: 'hero-x2-v4', ...castSource('hero-x2-v4')! }], ['marek', plazaFaces()[foe] ?? null]];
  for (const [seat, src] of faces) {
    if (!src) continue;
    const bytes = new Uint8Array(await (await fetch(src.png)).arrayBuffer()), got = await sha256(bytes);
    if (got !== null && got !== src.sha256) throw new Error(`${src.id}: SHA-256 does not match its provenance pack`);
    const { k, frames } = sheetFrames(src.id, await decodePng(bytes), src.json), front = frames.find((f) => f.dir === 'down' && f.anim === 'idle' && f.i === 0);
    if (!front) throw new Error(`${src.id}: no front idle frame`);
    const fw = 32 * k, crop = faceCrop(front.rgba, fw, 48 * k), c = document.createElement('canvas');
    c.width = c.height = crop.size;
    const img = new ImageData(crop.size, crop.size);
    for (let y = 0; y < crop.size; y++) for (let x = 0; x < crop.size; x++) { const s = ((crop.y + y) * fw + crop.x + x) * 4, d = (y * crop.size + x) * 4; for (let j = 0; j < 4; j++) img.data[d + j] = front.rgba[s + j]; }
    c.getContext('2d')!.putImageData(img, 0, 0);
    set.portraits[seat] = c;
  }
}

/** device pixels of one texel across an actor's quad at this camera */
export function texelPixels(a: Actor, sprites: SpriteRenderer, camera: THREE.Camera, renderWidth: number, cw: number): { quadPx: number; texelPx: number } {
  const e = camera.matrixWorldInverse.elements, right = new THREE.Vector3(e[0], e[4], e[8]); right.y = 0; right.normalize();
  const half = (CELL_W * PIXEL_WORLD * sprites.charScale * a.scale) / 2, mid = a.pos.clone().add(new THREE.Vector3(0, 1, 0));
  const p = mid.clone().addScaledVector(right, -half).project(camera), q = mid.clone().addScaledVector(right, half).project(camera);
  const quadPx = (Math.abs(q.x - p.x) / 2) * renderWidth;
  return { quadPx, texelPx: quadPx / cw };
}
