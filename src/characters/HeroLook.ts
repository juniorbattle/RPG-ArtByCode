import { hsv, linLum, maskFingerprint, type Ramp, type Rect } from './Variants';
import { frameSkin, recolor, type NamedFrame, type PaletteMask } from './FighterSkins';

/** Ren's look in a version 2 game (journal Passes PR1 / PR2; the operator, word for word: « par defaut je veux que le personnage est une couleur mate de peau
 *  des cheveux  hâlée et gris  et une cape soit aesoiaw ou ivoire », then « Yes, ivory cloak »): one Ren, tan skin, grey hair, an ivory cloak, a fixed variant
 *  recoloured once on the texels of his two approved sheets (hero-x2-v4 in town, on the squares, in the portraits; hero-x3-combat in the duel). The generic
 *  fighters' way (journal Passes GS1 / GS2, FighterSkins.ts): the sheets and their exports stay as they are; a material map, a pure function of the sheet and of
 *  settings recorded in art-lab/characters/variants/hero.json, picks the skin, the hair and the cloak; a masked texel takes the target ramp's colour at its
 *  luminance rank (the sprite shader's formula); the file reaches production only approved by the operator, each sheet's material fingerprint checked at load.
 *  - the skin and the cloak have colours of their own (three skin tones; the cloak's blues): FighterSkins' palette mask, as for the generic fighters;
 *  - the hair has none (its browns are the gloves', the straps' and the boots'): a hair colour counts only inside the frame's head rectangle (`head`, written
 *    by tools/art-lab/hero-look.mjs from the figure and corrected by hand), less the rectangles `clear` (the eyes and brows, a hilt by the head), plus `paint`;
 *  - the ranges are pinned in the file (one per material, over both sheets): the town sprite and the fighter take the same colour for the same texel.
 *  Outlines (HSV value under 0.25) never change. Today's game never loads this module: its callers are the version 2's pages only. */

export type HeroMaterial = 'skin' | 'hair' | 'cloak';
export const MATERIALS: readonly HeroMaterial[] = ['skin', 'hair', 'cloak'];

export interface HairMask {
  /** the material's colours (6 hex digits): the hair's only inside the frame's head rectangle */
  colours: string[];
  /** per frame name, the head rectangle (x0, y0, x1, y1 inclusive, texels of the frame, y down); absent (the cloak) = the whole frame */
  head?: Record<string, Rect>;
  /** listed colours count even under the outline value (the cloak's deepest fold, 23263f, sits at 0.247); default false */
  outline?: boolean;
  /** per frame name, rectangles never hair (the eyes and the brows, a hilt or a glove by the head) */
  clear?: Record<string, Rect[]>;
  /** per frame name, rectangles whose every non-outline, non-skin texel is hair, whatever its colour */
  paint?: Record<string, Rect[]>;
  /** the smallest group of touching hair texels kept (8-connected; default 1) */
  minPart?: number;
}
export interface HeroSheetLook { skin: PaletteMask; hair: HairMask; cloak: HairMask; fingerprint?: string }
export interface HeroLookFile {
  approved: boolean;
  approval?: { by: string; date: string; note?: string } | null;
  ramps: Record<HeroMaterial, Record<string, Ramp>>;
  /** the look Ren shows: a ramp name per material (absent = that material keeps its texels) */
  look: Partial<Record<HeroMaterial, string>>;
  /** each material's luminance range over both sheets (linear light), pinned */
  ranges: Record<HeroMaterial, [number, number]>;
  sheets: Record<string, HeroSheetLook>;
}

const OUTLINE = 0.25;
const key = (px: Uint8Array, i: number) => (px[i] << 16) | (px[i + 1] << 8) | px[i + 2];
const inAny = (rs: Rect[] | undefined, x: number, y: number) => !!rs?.some(([x0, y0, x1, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1);

/** the hair (or the cloak) of one frame (1 = the material), the skin already found left out */
export function frameHair(f: NamedFrame, fw: number, fh: number, h: HairMask, skin: Uint8Array): Uint8Array {
  const colours = new Set(h.colours.map((c) => parseInt(c, 16))), out = new Uint8Array(fw * fh), clear = h.clear?.[f.name], paint = h.paint?.[f.name];
  const head: Rect | undefined = h.head ? h.head[f.name] : [0, 0, fw - 1, fh - 1];
  const lit = (i: number) => hsv(f.rgba[i], f.rgba[i + 1], f.rgba[i + 2])[2] >= OUTLINE;
  const usable = (x: number, y: number, i: number) => f.rgba[i + 3] >= 128 && !skin[y * fw + x] && !inAny(clear, x, y);
  if (head) for (let y = Math.max(0, head[1]); y <= Math.min(fh - 1, head[3]); y++) for (let x = Math.max(0, head[0]); x <= Math.min(fw - 1, head[2]); x++) {
    const i = (y * fw + x) * 4;
    if (usable(x, y, i) && colours.has(key(f.rgba, i)) && (h.outline || lit(i))) out[y * fw + x] = 1;
  }
  const min = h.minPart ?? 1;
  if (min > 1) {
    const seen = new Uint8Array(out.length), stack: number[] = [], part: number[] = [];
    for (let j0 = 0; j0 < out.length; j0++) {
      if (!out[j0] || seen[j0]) continue;
      stack.push(j0); seen[j0] = 1; part.length = 0;
      while (stack.length) {
        const j = stack.pop()!, x = j % fw, y = (j - x) / fw;
        part.push(j);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy, q = Y * fw + X; if (X >= 0 && Y >= 0 && X < fw && Y < fh && out[q] && !seen[q]) { seen[q] = 1; stack.push(q); } }
      }
      if (part.length < min && !part.some((j) => inAny(paint, j % fw, (j - (j % fw)) / fw))) for (const j of part) out[j] = 0;
    }
  }
  if (paint) for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) { const i = (y * fw + x) * 4; if (inAny(paint, x, y) && usable(x, y, i) && lit(i)) out[y * fw + x] = 1; }
  return out;
}

/** a frame's materials: 0 none, 1 skin, 2 hair, 3 cloak (the skin first; a cloak colour is never hair or skin) */
export function frameMaterials(f: NamedFrame, fw: number, fh: number, s: HeroSheetLook): Uint8Array {
  const skin = frameSkin(f, fw, fh, s.skin), cloak = frameHair(f, fw, fh, s.cloak, skin), hair = frameHair(f, fw, fh, s.hair, skin), out = new Uint8Array(fw * fh);
  for (let j = 0; j < out.length; j++) out[j] = skin[j] ? 1 : cloak[j] ? 3 : hair[j] ? 2 : 0;
  return out;
}
/** the material maps of a sheet's frames, in sheet order */
export const sheetMaterials = (frames: readonly NamedFrame[], fw: number, fh: number, s: HeroSheetLook): Uint8Array[] => frames.map((f) => frameMaterials(f, fw, fh, s));
/** the fingerprint the file records (the NPCs' FNV-1a over the maps in sheet order) */
export const lookFingerprint = maskFingerprint;

/** each material's luminance range over the frames of one or more sheets (linear light), null for a material that never shows */
export function materialRanges(sheets: ReadonlyArray<{ frames: readonly NamedFrame[]; maps: Uint8Array[] }>): Record<HeroMaterial, [number, number] | null> {
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const { frames, maps } of sheets) frames.forEach((f, n) => { const m = maps[n]; for (let j = 0; j < m.length; j++) if (m[j]) { const i = j * 4, L = linLum(f.rgba[i], f.rgba[i + 1], f.rgba[i + 2]), k = m[j] - 1; if (L < lo[k]) lo[k] = L; if (L > hi[k]) hi[k] = L; } });
  const r = (k: number): [number, number] | null => (lo[k] <= hi[k] ? [lo[k], hi[k]] : null);
  return { skin: r(0), hair: r(1), cloak: r(2) };
}

/** a frame recoloured to a look (a new array; the frame untouched): each material at its pinned range on its ramp */
export function recolorLook(rgba: Uint8Array, map: Uint8Array, file: Pick<HeroLookFile, 'ramps' | 'ranges'>, look: Partial<Record<HeroMaterial, string>>): Uint8Array {
  let out: Uint8Array = rgba;
  MATERIALS.forEach((m, k) => {
    const name = look[m];
    if (!name) return;
    const ramp = file.ramps[m][name];
    if (!ramp) throw new Error(`hero look: no ${m} ramp "${name}"`);
    const mask = new Uint8Array(map.length);
    for (let j = 0; j < map.length; j++) mask[j] = map[j] === k + 1 ? 1 : 0;
    out = recolor(out, mask, file.ranges[m], ramp);
  });
  return out;
}

/** the gate: a function giving frame n of the sheet under Ren's look, or null when the sheet keeps its texels. `approved` (production) applies an approved file's
 *  look only to maps of the approved fingerprint (a mismatch throws); `candidate` (the DEV review) applies the file whatever its approval, `look` overriding it */
export function sheetLook(file: HeroLookFile, sheetId: string, frames: readonly NamedFrame[], fw: number, fh: number, mode: 'approved' | 'candidate' = 'approved', look?: Partial<Record<HeroMaterial, string>>): ((n: number, rgba: Uint8Array) => Uint8Array) | null {
  if (mode === 'approved' && !(file.approved === true && !!file.approval?.by && !!file.approval?.date)) return null;
  const s = file.sheets[sheetId];
  if (!s) return null;
  const want = mode === 'candidate' && look ? look : file.look;
  if (!MATERIALS.some((m) => want[m])) return null;
  const maps = sheetMaterials(frames, fw, fh, s), fp = lookFingerprint(maps);
  if (mode === 'approved' && s.fingerprint !== fp) throw new Error(`${sheetId}: hero look maps ${fp} are not the approved maps ${s.fingerprint}`);
  return (n, rgba) => recolorLook(rgba, maps[n], file, want);
}
