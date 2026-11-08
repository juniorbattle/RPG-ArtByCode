import { hsv, linLum, maskFingerprint, type Rect, type Ramp } from './Variants';
import { parseAsepriteJson } from './SheetMeta';

/** The generic fighters' skin variants (journal Passe GS1; the operator's request, word for word: « J'aimerai avoir de la diversite de couleur des
 *  personnages generiques generes en utilisant aseprite pour faire ces corrections ( exactement comme nous avons fait avec les pnjs ) car les personnages
 *  combattants ont tous la meme couleur de peau »). The NPCs' way (journal Passes V0 to V3, Variants.ts): the approved sheet and its export stay as they
 *  are; a material mask, a pure function of the sheet and of settings recorded in a variants file, picks the skin; a masked texel takes the target ramp's
 *  colour at its luminance rank within the sheet's range of skin (the sprite shader's formula, BODY_FRAG); the file reaches production only approved by
 *  the operator, with each sheet's mask fingerprint, checked at load.
 *  What differs from the NPCs, and why: a combat sheet's poses move the head and the hands far from the idle frame (a knockout lies on the ground), so the
 *  NPCs' propagation from each facing's idle frame (3 texels) cannot follow them. A fighter's sheets share one palette (the combat sheet pins its town
 *  sheet's, journal Passes CX1 / GA1): the mask is written by colour. `skin` lists the palette's colours that are skin wherever they stand; `shade` the
 *  colours skin shares with something else (hair, leather, a staff's gold), taken only where skin surrounds them; `force` / `clear`, per frame, the
 *  rectangles corrected by hand where a colour rule cannot tell (read on the sheet in Aseprite). Only the skin: the hair, the clothes and the outlines
 *  never change. Each fighter shows ONE variant, fixed by the operator (`fixed`), on its town sheet's face (the portraits, the duel's HUD) and on its
 *  combat sheet; the recolouring is done once, on the texels, when the sheet is installed (the combat page's painted rim is painted after it). */

/** a frame and its name: `<dir>/<anim>.<i>` on a town sheet, `<clip>.<i>` on a combat sheet */
export interface NamedFrame { name: string; rgba: Uint8Array }
export interface PaletteMask {
  /** colours (6 hex digits) that are skin wherever they stand */
  skin: string[];
  /** colours found on skin alone (`skin` lists them too): a group of touching `skin` texels counts only if it holds at least `minCore` of them (default 1);
   *  a light tone the face shares with a cloak's highlights (Lucan, Piers) stays skin on the face and leaves the cloak. Absent: every group counts */
  core?: string[];
  minCore?: number;
  /** colours of what skin may border (a cloak, the hair, a lantern): a group whose bordering texels are at least `foreignShare` (default 0.5) of these
   *  colours is a highlight of that material, not skin */
  foreign?: string[];
  foreignShare?: number;
  /** a group counts only if one of its texels lies within `radius` texels of a colour of `colours` (a face lies under its hair; Lucan's gauntlets show no hand) */
  near?: { colours: string[]; radius: number };
  /** a group smaller than this share of the frame's largest group is dropped (a fighter whose only skin is the face: Lucan, in gauntlets) */
  relative?: number;
  /** colours skin shares with another material: skin only where at least 4 of the 8 neighbours are skin (two passes) */
  shade?: string[];
  /** the smallest group of touching skin texels kept (8-connected, before the fill): a few skin-coloured texels in the hair or on a boot's highlight
   *  stand apart from the face, the hands and the body (default 1: every texel kept) */
  minPart?: number;
  /** a group of skin texels lying entirely in the bottom `feet` rows of the frame's figure (its lowest opaque row upward) is a boot's highlight, not skin */
  feet?: number;
  /** per frame name, `minPart` and `feet` of its own: a figure lying or on all fours puts its face and its hands in the bottom rows, a cheek between locks of
   *  hair is a small group (`ko.1`, `ko.2`) */
  frames?: Record<string, { minPart?: number; feet?: number }>;
  /** per frame name, rectangles (x0, y0, x1, y1 inclusive, texels of the frame, y down) where a `shade` colour is skin without its neighbours (a face in
   *  shadow, read on the sheet: nothing else in the rectangle, neither hair nor cloth nor an outline, changes) */
  force?: Record<string, Rect[]>;
  /** per frame name, rectangles never skin (a colour rule that catches a staff, a strap, a lip of the hair) */
  clear?: Record<string, Rect[]>;
}
export interface FighterSheetSkin { mask: PaletteMask; fingerprint?: string }
export interface FighterSkin {
  /** the fighter's sheets: its town sheet (`<id>-x2-v1`, the face) and its combat sheet (`<id>-x3-combat`) */
  sheets: Record<string, FighterSheetSkin>;
  /** the candidate skins (ramp names of the file), in the order the line-up shows them */
  variants: string[];
  /** the variant the fighter shows (1-based into `variants`; 0 or absent = the original) */
  fixed?: number;
}
export interface FighterSkinsFile {
  approved: boolean;
  approval?: { by: string; date: string; note?: string } | null;
  ramps: { skin: Record<string, Ramp> };
  fighters: Record<string, FighterSkin>;
}

const OUTLINE = 0.25;   // the NPCs' rule (Variants.ts): an HSV value below it is an outline, never recoloured
const key = (px: Uint8Array, i: number) => (px[i] << 16) | (px[i + 1] << 8) | px[i + 2];
const inAny = (rs: Rect[] | undefined, x: number, y: number) => !!rs?.some(([x0, y0, x1, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1);

/** a sheet cut into its frames, in sheet order, each named by its tag (`idle-down` -> `down/idle.<i>`, `<clip>-side` on a combat sheet -> `<clip>.<i>`) */
export function namedFrames(img: { w: number; h: number; rgba: Uint8Array }, json: unknown, combat: boolean): { fw: number; fh: number; frames: NamedFrame[] } {
  const meta = parseAsepriteJson(json), fw = meta.frames[0].sw, fh = meta.frames[0].sh, frames: NamedFrame[] = [];
  if (meta.width !== img.w || meta.height !== img.h) throw new Error(`JSON says ${meta.width}x${meta.height}, PNG is ${img.w}x${img.h}`);
  for (const t of meta.tags) {
    const [a, d] = t.name.split('-');
    for (let n = t.from; n <= t.to; n++) {
      const f = meta.frames[n], rgba = new Uint8Array(fw * fh * 4);
      if (f.sw !== fw || f.sh !== fh) throw new Error('frames must share one size');
      for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) { const s0 = ((f.y + y) * img.w + f.x + x) * 4, d0 = ((f.oy + y) * fw + f.ox + x) * 4; for (let c = 0; c < 4; c++) rgba[d0 + c] = img.rgba[s0 + c]; }
      frames.push({ name: combat ? `${a}.${n - t.from}` : `${d}/${a}.${n - t.from}`, rgba });
    }
  }
  return { fw, fh, frames };
}

/** the skin of one frame (1 = skin, 0 = other), row-major from the top */
export function frameSkin(f: NamedFrame, fw: number, fh: number, s: PaletteMask): Uint8Array {
  const skin = new Set(s.skin.map((h) => parseInt(h, 16))), shade = new Set((s.shade ?? []).map((h) => parseInt(h, 16)));
  const out = new Uint8Array(fw * fh), force = s.force?.[f.name], clear = s.clear?.[f.name];
  const usable = (x: number, y: number, i: number) => f.rgba[i + 3] >= 128 && hsv(f.rgba[i], f.rgba[i + 1], f.rgba[i + 2])[2] >= OUTLINE && !inAny(clear, x, y);
  for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
    const j = y * fw + x, i = j * 4;
    if (usable(x, y, i) && (skin.has(key(f.rgba, i)) || (inAny(force, x, y) && shade.has(key(f.rgba, i))))) out[j] = 1;
  }
  const own = s.frames?.[f.name], feet = own?.feet ?? s.feet ?? 0, minPart = own?.minPart ?? s.minPart ?? 1;
  const core = s.core?.length ? new Set(s.core.map((h) => parseInt(h, 16))) : null;
  const groups: GroupRules = { core, minCore: s.minCore ?? 1, foreign: s.foreign?.length ? new Set(s.foreign.map((h) => parseInt(h, 16))) : null, share: s.foreignShare ?? 0.5, near: s.near ? nearMap(f, fw, fh, s.near) : null };
  if (minPart > 1 || feet || core || groups.foreign || groups.near || s.relative) {
    let low = -1;
    for (let j = 0; j < fw * fh; j++) if (f.rgba[j * 4 + 3] >= 128) low = (j - (j % fw)) / fw;
    dropSmall(out, f.rgba, fw, fh, minPart, force, feet ? low - feet + 1 : Infinity, groups);
    if (s.relative) keepLargest(out, fw, fh, s.relative, force);
  }
  for (let pass = 0; pass < 2; pass++) {
    const prev = out.slice();
    for (let y = 1; y < fh - 1; y++) for (let x = 1; x < fw - 1; x++) {
      const j = y * fw + x, i = j * 4;
      if (prev[j] || !shade.has(key(f.rgba, i)) || !usable(x, y, i)) continue;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) n += prev[j + dy * fw + dx];
      if (n >= 4) out[j] = 1;
    }
  }
  return out;
}

/** clears the 8-connected groups of skin smaller than `min` texels, and those whose every texel is at or below row `floor` (a group touching a forced
 *  rectangle stays) */
interface GroupRules { core: Set<number> | null; minCore: number; foreign: Set<number> | null; share: number; near: Uint8Array | null }
/** the texels within `radius` (Chebyshev) of an anchor colour */
function nearMap(f: NamedFrame, fw: number, fh: number, n: { colours: string[]; radius: number }): Uint8Array {
  const anchor = new Set(n.colours.map((h) => parseInt(h, 16))), out = new Uint8Array(fw * fh);
  for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
    const i = (y * fw + x) * 4;
    if (f.rgba[i + 3] < 128 || !anchor.has(key(f.rgba, i))) continue;
    for (let Y = Math.max(0, y - n.radius); Y <= Math.min(fh - 1, y + n.radius); Y++) for (let X = Math.max(0, x - n.radius); X <= Math.min(fw - 1, x + n.radius); X++) out[Y * fw + X] = 1;
  }
  return out;
}
function dropSmall(m: Uint8Array, rgba: Uint8Array, fw: number, fh: number, min: number, force: Rect[] | undefined, floor: number, g: GroupRules): void {
  const seen = new Uint8Array(m.length), stack: number[] = [], part: number[] = [];
  for (let j0 = 0; j0 < m.length; j0++) {
    if (!m[j0] || seen[j0]) continue;
    stack.push(j0); seen[j0] = 1; part.length = 0;
    let kept = false, top = fh, cores = 0, border = 0, alien = 0, close = false;
    while (stack.length) {
      const j = stack.pop()!, x = j % fw, y = (j - x) / fw;
      part.push(j);
      if (y < top) top = y;
      if (g.core?.has(key(rgba, j * 4))) cores++;
      if (g.near?.[j]) close = true;
      if (inAny(force, x, y)) kept = true;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const X = x + dx, Y = y + dy, q = Y * fw + X;
        if (X < 0 || Y < 0 || X >= fw || Y >= fh || seen[q]) continue;
        if (!m[q]) { if (g.foreign && rgba[q * 4 + 3] >= 128) { border++; if (g.foreign.has(key(rgba, q * 4))) alien++; } continue; }
        seen[q] = 1; stack.push(q);
      }
    }
    const drop = part.length < min || top >= floor || (g.core !== null && cores < g.minCore) || (g.foreign !== null && border > 0 && alien / border >= g.share) || (g.near !== null && !close);
    if (!kept && drop) for (const j of part) m[j] = 0;
  }
}

/** clears the groups smaller than `share` x the largest group's size (a group touching a forced rectangle stays) */
function keepLargest(m: Uint8Array, fw: number, fh: number, share: number, force: Rect[] | undefined): void {
  const label = new Int32Array(m.length).fill(-1), sizes: number[] = [], forced: boolean[] = [];
  for (let j0 = 0; j0 < m.length; j0++) {
    if (!m[j0] || label[j0] >= 0) continue;
    const id = sizes.length, stack = [j0]; label[j0] = id; sizes.push(0); forced.push(false);
    while (stack.length) {
      const j = stack.pop()!, x = j % fw, y = (j - x) / fw;
      sizes[id]++;
      if (inAny(force, x, y)) forced[id] = true;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy, q = Y * fw + X; if (X >= 0 && Y >= 0 && X < fw && Y < fh && m[q] && label[q] < 0) { label[q] = id; stack.push(q); } }
    }
  }
  const big = Math.max(0, ...sizes);
  for (let j = 0; j < m.length; j++) if (m[j] && sizes[label[j]] < share * big && !forced[label[j]]) m[j] = 0;
}

/** the masks of a sheet's frames, in sheet order */
export const sheetSkin = (frames: readonly NamedFrame[], fw: number, fh: number, s: PaletteMask): Uint8Array[] => frames.map((f) => frameSkin(f, fw, fh, s));
/** the fingerprint the variants file records (the NPCs' FNV-1a over the masks in sheet order, Variants.ts) */
export const skinFingerprint = maskFingerprint;

/** the luminance range of the skin over a sheet's frames (linear light), or null without skin */
export function skinRange(frames: readonly NamedFrame[], masks: Uint8Array[]): [number, number] | null {
  let lo = Infinity, hi = -Infinity;
  frames.forEach((f, n) => { const m = masks[n]; for (let j = 0; j < m.length; j++) if (m[j]) { const i = j * 4, L = linLum(f.rgba[i], f.rgba[i + 1], f.rgba[i + 2]); if (L < lo) lo = L; if (L > hi) hi = L; } });
  return lo <= hi ? [lo, hi] : null;
}

const toLin = (u: number) => { const c = u / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const toSrgb = (l: number) => Math.round(255 * Math.min(1, Math.max(0, l <= 0.0031308 ? 12.92 * l : 1.055 * l ** (1 / 2.4) - 0.055)));

/** the sprite shader's recolouring (SpriteRenderer BODY_FRAG): a masked texel's luminance rank t in the sheet's range, the ramp's 5 stops sampled at
 *  t x 4 with linear filtering in linear light (an sRGB texture is filtered after decoding), back to sRGB; a new array, the frame untouched */
export function recolor(rgba: Uint8Array, mask: Uint8Array, range: [number, number], ramp: Ramp): Uint8Array {
  const stops = ramp.map((h) => [1, 3, 5].map((o) => toLin(parseInt(h.slice(o, o + 2), 16))));
  const out = Uint8Array.from(rgba), span = Math.max(range[1] - range[0], 1e-4);
  for (let j = 0; j < mask.length; j++) {
    if (!mask[j]) continue;
    const i = j * 4, t = Math.min(1, Math.max(0, (linLum(rgba[i], rgba[i + 1], rgba[i + 2]) - range[0]) / span)) * 4;
    const a = Math.min(3, Math.floor(t)), w = t - a;
    for (let c = 0; c < 3; c++) out[i + c] = toSrgb(stops[a][c] * (1 - w) + stops[a + 1][c] * w);
  }
  return out;
}

/** what a sheet shows: per frame its texels recoloured to the fighter's variant, or null when the sheet keeps its original */
export interface SheetTone { ramp: string; range: [number, number]; masks: Uint8Array[]; fingerprint: string }

/** the tone of one sheet of a fighter, through the gate: an approved file applies its fixed variant only to masks of the approved fingerprint (a
 *  mismatch throws); `candidate` (DEV review) applies a file whatever its approval, and `variant` (1-based) overrides the fixed one. Null = the original. */
export function sheetTone(file: FighterSkinsFile, who: string, sheetId: string, frames: readonly NamedFrame[], fw: number, fh: number, mode: 'approved' | 'candidate' = 'approved', variant?: number): SheetTone | null {
  if (mode === 'approved' && !(file.approved === true && !!file.approval?.by && !!file.approval?.date)) return null;
  const f = file.fighters[who], sv = f?.sheets[sheetId];
  if (!f || !sv) return null;
  const v = mode === 'candidate' && variant !== undefined ? variant : f.fixed ?? 0;
  const name = v > 0 ? f.variants[v - 1] : undefined;
  if (!name) return null;
  const ramp = file.ramps.skin[name];
  if (!ramp) throw new Error(`${sheetId}: no skin ramp "${name}"`);
  const masks = sheetSkin(frames, fw, fh, sv.mask), fp = skinFingerprint(masks);
  if (mode === 'approved' && sv.fingerprint !== fp) throw new Error(`${sheetId}: skin masks ${fp} are not the approved masks ${sv.fingerprint}`);
  const range = skinRange(frames, masks);
  return range ? { ramp: name, range, masks, fingerprint: fp } : null;
}

/** a frame of a toned sheet (its index in the sheet's order), recoloured */
export const toneFrame = (file: FighterSkinsFile, tone: SheetTone, n: number, rgba: Uint8Array): Uint8Array => recolor(rgba, tone.masks[n], tone.range, file.ramps.skin[tone.ramp]);
