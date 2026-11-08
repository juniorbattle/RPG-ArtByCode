import { hsv, linLum, maskFingerprint, type Ramp, type Rect } from './Variants';
import { frameSkin, recolor, type NamedFrame, type PaletteMask } from './FighterSkins';

/** Ren's look in a version 2 game (journal Passes PR1 / PR2; the operator, word for word: « par defaut je veux que le personnage est une couleur mate de peau
 *  des cheveux  hâlée et gris  et une cape soit aesoiaw ou ivoire », then « Yes, ivory cloak »): one Ren, tan skin, grey hair, an ivory cloak, a fixed variant
 *  recoloured once on the texels of his two approved sheets (hero-x2-v4 in town, on the squares, in the portraits; his combat sheet in the duel). The generic
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
  /** the colours the first `clear` rectangle of a frame protects (the eyes' and lashes' browns): the fringe crossing it, in other browns, is hair; absent = every
   *  colour (the other rectangles always protect every colour) */
  eyes?: string[];
  /** per frame name, rectangles whose every non-outline, non-skin texel is hair, whatever its colour */
  paint?: Record<string, Rect[]>;
  /** the smallest group of touching hair texels kept (8-connected; default 1) */
  minPart?: number;
  /** keeps the largest group and the groups with a texel within `join` texels (Chebyshev) of it, no chaining: a raised glove, a hilt or a strap in the head
   *  rectangle is a group apart from the hair (the combat sheet); absent = every group */
  join?: number;
  /** the hair grows out of its head rectangle through its own colours, 8-connected, at most `grow` steps (a spike or a nape past the rectangle in a fall, a
   *  knockout); never through the skin or a cleared rectangle; absent = the rectangle bounds the hair */
  grow?: number;
  /** the hair's contour colours (warm browns under the outline value): one of them in the head rectangle becomes hair when a hair texel touches it (4-connected)
   *  and no skin texel does (8-connected), two passes; a reddish contour round silver hair would read as a brown halo. The face's contour, next to the skin, stays */
  rim?: string[];
}
export interface HeroSheetLook {
  skin: PaletteMask;
  /** the skin grows from the face through its shared tones (`skin.shade`, 8-connected, outlines excluded): an ear or a jaw in shadow, drawn in tones the
   *  neighbour rule leaves alone, stays skin and is not taken for a lock of hair (the combat sheet); absent = no growth */
  skinFlood?: boolean;
  /** per frame name, rectangles where a hair colour (lit) is skin: the neck's shadow under the jaw, painted in the hair's browns between the neck and the hood
   *  (the combat sheet; written by tools/art-lab/hero-look.mjs from the face, read again on the grid) */
  neck?: Record<string, Rect[]>;
  hair: HairMask; cloak: HairMask; fingerprint?: string;
}
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
  const eyes = h.eyes ? new Set(h.eyes.map((c) => parseInt(c, 16))) : null;
  const cleared = (x: number, y: number, i: number) => !!clear?.some(([x0, y0, x1, y1], n) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && (n > 0 || !eyes || eyes.has(key(f.rgba, i))));
  const usable = (x: number, y: number, i: number) => f.rgba[i + 3] >= 128 && !skin[y * fw + x] && !cleared(x, y, i);
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
  if (h.join !== undefined) joinLargest(out, fw, fh, h.join);
  for (let step = 0; step < (h.grow ?? 0); step++) {
    const prev = out.slice();
    let added = 0;
    for (let y = 1; y < fh - 1; y++) for (let x = 1; x < fw - 1; x++) {
      const j = y * fw + x, i = j * 4;
      if (prev[j] || !colours.has(key(f.rgba, i)) || !usable(x, y, i) || !lit(i)) continue;
      if (prev[j - 1] || prev[j + 1] || prev[j - fw] || prev[j + fw] || prev[j - fw - 1] || prev[j - fw + 1] || prev[j + fw - 1] || prev[j + fw + 1]) { out[j] = 1; added++; }
    }
    if (!added) break;
  }
  if (h.rim?.length && head) {
    const rim = new Set(h.rim.map((c) => parseInt(c, 16)));
    for (let pass = 0; pass < 2; pass++) {
      const prev = out.slice();
      for (let y = Math.max(1, head[1]); y <= Math.min(fh - 2, head[3]); y++) for (let x = Math.max(1, head[0]); x <= Math.min(fw - 2, head[2]); x++) {
        const j = y * fw + x, i = j * 4;
        if (prev[j] || !rim.has(key(f.rgba, i)) || !usable(x, y, i)) continue;
        if (!(prev[j - 1] || prev[j + 1] || prev[j - fw] || prev[j + fw])) continue;
        let skinNear = false;
        for (let dy = -1; dy <= 1 && !skinNear; dy++) for (let dx = -1; dx <= 1; dx++) if (skin[j + dy * fw + dx]) { skinNear = true; break; }
        if (!skinNear) out[j] = 1;
      }
    }
  }
  if (paint) for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) { const i = (y * fw + x) * 4; if (inAny(paint, x, y) && usable(x, y, i) && lit(i)) out[y * fw + x] = 1; }
  return out;
}

/** keeps the largest 8-connected group of `m` and the groups with a texel within `join` texels of it (one step, no chaining) */
function joinLargest(m: Uint8Array, fw: number, fh: number, join: number): void {
  const label = new Int32Array(m.length).fill(-1), sizes: number[] = [];
  for (let j0 = 0; j0 < m.length; j0++) {
    if (!m[j0] || label[j0] >= 0) continue;
    const id = sizes.length, stack = [j0]; label[j0] = id; sizes.push(0);
    while (stack.length) {
      const j = stack.pop()!, x = j % fw, y = (j - x) / fw;
      sizes[id]++;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy, q = Y * fw + X; if (X >= 0 && Y >= 0 && X < fw && Y < fh && m[q] && label[q] < 0) { label[q] = id; stack.push(q); } }
    }
  }
  if (sizes.length < 2) return;
  const big = sizes.indexOf(Math.max(...sizes)), keep = new Set([big]);
  for (let j = 0; j < m.length; j++) {
    if (label[j] !== big) continue;
    const x = j % fw, y = (j - x) / fw;
    for (let Y = Math.max(0, y - join); Y <= Math.min(fh - 1, y + join); Y++) for (let X = Math.max(0, x - join); X <= Math.min(fw - 1, x + join); X++) { const l = label[Y * fw + X]; if (l >= 0) keep.add(l); }
  }
  for (let j = 0; j < m.length; j++) if (m[j] && !keep.has(label[j])) m[j] = 0;
}

/** a frame's materials: 0 none, 1 skin, 2 hair, 3 cloak, 4 the neck's shadow (skin, outside the skin's range: a hair brown in shadow would stretch it and lighten
 *  the face; it takes the ramp's darkest stops) (the skin first; a cloak colour is never hair or skin) */
export function frameMaterials(f: NamedFrame, fw: number, fh: number, s: HeroSheetLook): Uint8Array {
  const skin = frameSkin(f, fw, fh, s.skin);
  const neck = s.neck?.[f.name], shadow = new Uint8Array(fw * fh);
  if (neck) {
    const hairC = new Set(s.hair.colours.map((c) => parseInt(c, 16)));
    for (const [x0, y0, x1, y1] of neck) for (let y = Math.max(0, y0); y <= Math.min(fh - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(fw - 1, x1); x++) {
      const i = (y * fw + x) * 4;
      if (f.rgba[i + 3] >= 128 && hairC.has(key(f.rgba, i)) && hsv(f.rgba[i], f.rgba[i + 1], f.rgba[i + 2])[2] >= OUTLINE) { skin[y * fw + x] = 1; shadow[y * fw + x] = 1; }
    }
  }
  if (s.skinFlood) {
    const shade = new Set((s.skin.shade ?? []).map((c) => parseInt(c, 16))), clear = s.skin.clear?.[f.name], stack: number[] = [];
    for (let j = 0; j < skin.length; j++) if (skin[j]) stack.push(j);
    while (stack.length) {
      const j = stack.pop()!, x = j % fw, y = (j - x) / fw;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const X = x + dx, Y = y + dy, q = Y * fw + X, i = q * 4;
        if (X < 0 || Y < 0 || X >= fw || Y >= fh || skin[q] || f.rgba[i + 3] < 128 || !shade.has(key(f.rgba, i)) || hsv(f.rgba[i], f.rgba[i + 1], f.rgba[i + 2])[2] < OUTLINE || inAny(clear, X, Y)) continue;
        skin[q] = 1; stack.push(q);
      }
    }
  }
  const cloak = frameHair(f, fw, fh, s.cloak, skin), hair = frameHair(f, fw, fh, s.hair, skin), out = new Uint8Array(fw * fh);
  for (let j = 0; j < out.length; j++) out[j] = shadow[j] ? 4 : skin[j] ? 1 : cloak[j] ? 3 : hair[j] ? 2 : 0;
  return out;
}
/** the material maps of a sheet's frames, in sheet order */
export const sheetMaterials = (frames: readonly NamedFrame[], fw: number, fh: number, s: HeroSheetLook): Uint8Array[] => frames.map((f) => frameMaterials(f, fw, fh, s));
/** the fingerprint the file records (the NPCs' FNV-1a over the maps in sheet order) */
export const lookFingerprint = maskFingerprint;

/** each material's luminance range over the frames of one or more sheets (linear light), over its lit texels only: a contour texel taken with the hair
 *  (`rim`) or the cloak's fold (`outline`) takes the ramp's darkest stop and does not stretch the range; null for a material that never shows */
export function materialRanges(sheets: ReadonlyArray<{ frames: readonly NamedFrame[]; maps: Uint8Array[] }>): Record<HeroMaterial, [number, number] | null> {
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const { frames, maps } of sheets) frames.forEach((f, n) => { const m = maps[n]; for (let j = 0; j < m.length; j++) if (m[j] && m[j] < 4) { const i = j * 4; if (hsv(f.rgba[i], f.rgba[i + 1], f.rgba[i + 2])[2] < OUTLINE) continue; const L = linLum(f.rgba[i], f.rgba[i + 1], f.rgba[i + 2]), k = m[j] - 1; if (L < lo[k]) lo[k] = L; if (L > hi[k]) hi[k] = L; } });
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
    for (let j = 0; j < map.length; j++) mask[j] = map[j] === k + 1 || (k === 0 && map[j] === 4) ? 1 : 0;
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
