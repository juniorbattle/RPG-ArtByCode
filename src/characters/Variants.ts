import type { BakedFrame } from './BakedSprites';
import type { Dir } from './SpriteGenerator';

/** NPC variants (journal Passes V0 / V1): hair and skin recoloured on the SAME baked sheet, at render time, through a material mask.
 *  The mask is a pure function of the approved sheet and of its per-sheet zones (no new image, no change to the export): on each facing's
 *  idle frame 0 (its reference view), coarse zones in texel coordinates (hair, skin: face and hands) and colour rules inside them pick the
 *  texels (outlines stay "other"); every other frame of that facing takes, texel by texel, the material of the nearest texel of the SAME
 *  colour in the reference view within PROPAGATE texels (rig frames move parts by a few texels). The variants file the operator approves
 *  records each sheet's mask fingerprint, checked at load: the masks shown are exactly the masks approved.
 *  Material: 0 = other, 1 = hair, 2 = skin. */
/** x0, y0, x1, y1, inclusive, texels of the sheet (y down); a skin zone may add its minimum saturation (default 0.22: the hands, next to
 *  linen sleeves; a face zone can go lower, its pale highlights stay skin) */
export type Rect = [number, number, number, number] | [number, number, number, number, number];
export interface FacingZones { hair?: Rect[]; skin?: Rect[] }
export interface MaskSettings {
  zones: Partial<Record<Dir, FacingZones>>;
  /** hair colour rule: 'warm' (hue 345-45 deg, saturation >= 0.25) or 'any' (grey / white / blond hair: every non-outline texel of the zone) */
  hair?: 'warm' | 'any';
  /** highest HSV value a hair texel may have (default 0.95): under a light bonnet, dark hair stops before the cream shades */
  hairMax?: number;
  /** colours (6 hex digits) never recoloured: an accessory that matches a rule inside a zone */
  exclude?: string[];
}

export const PROPAGATE = 3;
const OUTLINE = 0.25;   // HSV value below which a texel is an outline: never recoloured

export function hsv(r: number, g: number, b: number): [number, number, number] {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, mx ? d / mx : 0, mx / 255];
}
const isSkin = (h: number, s: number, v: number, sMin: number) => h >= 5 && h <= 45 && s >= sMin && s <= 0.55 && v >= 0.55;   // linen and canvas stay under 0.22
const isWarmHair = (h: number, s: number, v: number, vMax = 0.95) => (h >= 345 || h <= 45) && s >= 0.25 && v >= OUTLINE && v <= vMax;
const inAny = (rs: Rect[] | undefined, x: number, y: number) => !!rs?.some(([x0, y0, x1, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1);
/** the lowest minimum saturation of the skin zones containing (x, y), or null outside them */
const skinMin = (rs: Rect[] | undefined, x: number, y: number) => { let m: number | null = null; for (const r of rs ?? []) if (x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3]) m = Math.min(m ?? 1, r[4] ?? 0.22); return m; };

/** the reference view's material map (zones + colour rules) */
function referenceMask(f: BakedFrame, fw: number, fh: number, z: FacingZones, s: MaskSettings, ex: Set<number>): Uint8Array {
  const out = new Uint8Array(fw * fh);
  const hairMax = s.hairMax ?? 0.95;
  const hairRule = (h: number, sat: number, v: number) => v <= hairMax && (s.hair === 'any' || isWarmHair(h, sat, v, hairMax));
  // per colour: how often it is hair outside the face (hair zone, no skin zone) and how often it sits where the two zones overlap. A colour
  // met as hair outside the face more often than in the overlap is hair there too: a fringe over the forehead (red hair shares its light
  // tones with the skin: the skin rule turned the traveler's fringe into skin, journal Passe V2)
  const hairOnly = new Map<number, number>(), overlap = new Map<number, number>();
  for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
    const i = (y * fw + x) * 4;
    if (f.rgba[i + 3] < 128 || !inAny(z.hair, x, y)) continue;
    const r = f.rgba[i], g = f.rgba[i + 1], b = f.rgba[i + 2], c = (r << 16) | (g << 8) | b, [h, sat, v] = hsv(r, g, b);
    if (skinMin(z.skin, x, y) !== null) overlap.set(c, (overlap.get(c) ?? 0) + 1);
    else if (v >= OUTLINE && hairRule(h, sat, v)) hairOnly.set(c, (hairOnly.get(c) ?? 0) + 1);
  }
  for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
    const i = (y * fw + x) * 4;
    if (f.rgba[i + 3] < 128) continue;
    const r = f.rgba[i], g = f.rgba[i + 1], b = f.rgba[i + 2];
    if (ex.has((r << 16) | (g << 8) | b)) continue;
    const [h, sat, v] = hsv(r, g, b);
    if (v < OUTLINE) continue;
    const sMin = skinMin(z.skin, x, y), inHair = inAny(z.hair, x, y), c = (r << 16) | (g << 8) | b;
    if (sMin !== null && inHair && hairRule(h, sat, v) && (hairOnly.get(c) ?? 0) >= (overlap.get(c) ?? 0)) out[y * fw + x] = 1;
    else if (sMin !== null && isSkin(h, sat, v, sMin)) out[y * fw + x] = 2;
    else if (inHair && hairRule(h, sat, v)) out[y * fw + x] = 1;
  }
  // fill (twice): a non-outline texel the rules missed but its material surrounds takes that material: lips, pale highlights, the saturated
  // shade of a jaw or an ear, a light lock in the hair (they stayed light or orange on a dark variant, journal Passe V1); a bonnet or a
  // sleeve beside the zone is not enclosed and stays
  for (let pass = 0; pass < 2; pass++) {
    const prev = out.slice();
    for (let y = 1; y < fh - 1; y++) for (let x = 1; x < fw - 1; x++) {
      const j = y * fw + x, i = j * 4;
      if (prev[j] || f.rgba[i + 3] < 128) continue;
      const r = f.rgba[i], g = f.rgba[i + 1], b = f.rgba[i + 2];
      const val = hsv(r, g, b)[2];
      if (ex.has((r << 16) | (g << 8) | b) || val < OUTLINE) continue;
      let ns = 0, nh = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const m = prev[j + dy * fw + dx]; if (m === 2) ns++; else if (m === 1) nh++; }
      if (ns >= 4 && skinMin(z.skin, x, y) !== null) out[j] = 2;
      else if (nh >= 5 && inAny(z.hair, x, y) && val <= hairMax) out[j] = 1;
    }
  }
  return out;
}

/** materials of every frame of a sheet (frames in sheet order; each mask row-major from the top, the frame's size) */
export function sheetMasks(frames: readonly BakedFrame[], fw: number, fh: number, s: MaskSettings): Uint8Array[] {
  const ex = new Set((s.exclude ?? []).map((h) => parseInt(h, 16)));
  const refs = new Map<Dir, { f: BakedFrame; m: Uint8Array }>();
  for (const dir of ['down', 'up', 'side'] as Dir[]) {
    const z = s.zones[dir], f = frames.find((q) => q.dir === dir && q.anim === 'idle' && q.i === 0);
    if (z && f) refs.set(dir, { f, m: referenceMask(f, fw, fh, z, s, ex) });
  }
  const key = (px: Uint8Array, i: number) => (px[i + 3] < 128 ? -1 : (px[i] << 16) | (px[i + 1] << 8) | px[i + 2]);
  return frames.map((f) => {
    const ref = refs.get(f.dir);
    if (!ref) return new Uint8Array(fw * fh);
    if (ref.f === f) return ref.m;
    const out = new Uint8Array(fw * fh);
    for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
      const c = key(f.rgba, (y * fw + x) * 4);
      if (c < 0) continue;
      // the nearest reference texel of the same colour (Chebyshev rings), its material
      let found = -1;
      for (let r = 0; r <= PROPAGATE && found < 0; r++)
        for (let dy = -r; dy <= r && found < 0; dy++) for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const X = x + dx, Y = y + dy;
          if (X < 0 || Y < 0 || X >= fw || Y >= fh) continue;
          if (key(ref.f.rgba, (Y * fw + X) * 4) === c) { found = ref.m[Y * fw + X]; break; }
        }
      if (found > 0) out[y * fw + x] = found;
    }
    return out;
  });
}

/** FNV-1a 32-bit over the masks of a sheet's frames in their sheet order: the fingerprint the approved variants file records */
export function maskFingerprint(masks: Uint8Array[]): string {
  let h = 0x811c9dc5;
  for (const m of masks) for (let i = 0; i < m.length; i++) { h ^= m[i]; h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}

// ---------------------------------------------------------------- colours: ramps and the per-sheet source ranges
/** a target ramp: 5 sRGB stops, dark to light; a masked texel takes the colour at its luminance rank within its sheet's source range */
export type Ramp = string[];
export interface VariantDef { hair?: string; skin?: string }
export interface SheetVariants { mask: MaskSettings; fingerprint?: string; variants: VariantDef[]; /** the variant (0 = original) an archetype always shows, e.g. { guardB: 1 } */ fixed?: Record<string, number> }
export interface VariantsFile { approved: boolean; approval?: { by: string; date: string; note?: string } | null; ramps: { hair: Record<string, Ramp>; skin: Record<string, Ramp> }; sheets: Record<string, SheetVariants> }

const toLin = (u: number) => { const c = u / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
/** linear-light luminance of an sRGB texel (the shader compares the same quantity: the baked texture is sampled as sRGB) */
export const linLum = (r: number, g: number, b: number) => 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);

/** the luminance range of a material over a sheet's frames ([lo, hi]; null without that material) */
export function materialRange(frames: readonly BakedFrame[], masks: Uint8Array[], mat: 1 | 2): [number, number] | null {
  let lo = Infinity, hi = -Infinity;
  frames.forEach((f, n) => { const m = masks[n]; for (let j = 0; j < m.length; j++) if (m[j] === mat) { const i = j * 4, L = linLum(f.rgba[i], f.rgba[i + 1], f.rgba[i + 2]); if (L < lo) lo = L; if (L > hi) hi = L; } });
  return lo <= hi ? [lo, hi] : null;
}

/** which variant an actor shows (0 = the original): fixed by the operator for a sheet, otherwise from the actor's id (no RNG draw) */
export function variantOf(id: number, count: number, fixed?: number): number {   // fixed: from SheetVariants.fixed[archetype]
  if (fixed !== undefined) return Math.max(0, Math.min(count, fixed));
  return (Math.imul(id, 2654435761) >>> 0) % (count + 1);
}

/** the ramps of a variants file as texture rows: hair ramps first, then skin; name -> row */
export function rampTable(file: Pick<VariantsFile, 'ramps'>): { rows: Ramp[]; hair: Record<string, number>; skin: Record<string, number> } {
  const rows: Ramp[] = [], hair: Record<string, number> = {}, skin: Record<string, number> = {};
  for (const [n, r] of Object.entries(file.ramps?.hair ?? {})) { hair[n] = rows.length; rows.push(r); }
  for (const [n, r] of Object.entries(file.ramps?.skin ?? {})) { skin[n] = rows.length; rows.push(r); }
  return { rows, hair, skin };
}
