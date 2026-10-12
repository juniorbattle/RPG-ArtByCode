/** Sprite-sheet metadata for the DEV-ONLY Character Lab (never imported by the game).
 *  Reads the documented Aseprite CLI JSON (`--data sheet.json --format json-array|json-hash --list-tags`), or a plain grid. */

export interface SheetFrame {
  name: string;
  /** rectangle inside the sheet image (origin top-left, pixels) */
  x: number; y: number; w: number; h: number;
  /** untrimmed frame box, and where the stored rectangle sits inside it (differs from 0,0 only when exported trimmed) */
  sw: number; sh: number; ox: number; oy: number;
  /** ms */
  duration: number;
}
export interface SheetTag { name: string; from: number; to: number; direction: string }
export interface SheetMeta { width: number; height: number; frames: SheetFrame[]; tags: SheetTag[]; source: string }

const num = (v: unknown, what: string): number => {
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`sheet metadata: ${what} must be a number`);
  return v;
};

export function parseAsepriteJson(json: any): SheetMeta {
  const raw = json?.frames;
  const list: Array<[string, any]> = Array.isArray(raw) ? raw.map((f: any, i: number) => [f.filename ?? String(i), f])
    : raw && typeof raw === 'object' ? Object.entries(raw) : [];
  if (!list.length) throw new Error('sheet metadata: no "frames" (expected Aseprite json-array or json-hash)');
  const width = num(json.meta?.size?.w, 'meta.size.w'), height = num(json.meta?.size?.h, 'meta.size.h');
  const frames = list.map(([name, f], i): SheetFrame => {
    if (f.rotated) throw new Error(`sheet metadata: frame ${i} is rotated, which the lab does not support`);
    const r = f.frame, sss = f.spriteSourceSize ?? { x: 0, y: 0, w: r?.w, h: r?.h }, ss = f.sourceSize ?? { w: r?.w, h: r?.h };
    const fr: SheetFrame = {
      name, x: num(r?.x, `frames[${i}].frame.x`), y: num(r?.y, `frames[${i}].frame.y`), w: num(r?.w, `frames[${i}].frame.w`), h: num(r?.h, `frames[${i}].frame.h`),
      sw: num(ss.w, `frames[${i}].sourceSize.w`), sh: num(ss.h, `frames[${i}].sourceSize.h`), ox: num(sss.x, `frames[${i}].spriteSourceSize.x`), oy: num(sss.y, `frames[${i}].spriteSourceSize.y`),
      duration: typeof f.duration === 'number' && f.duration > 0 ? f.duration : 100,
    };
    if (fr.x < 0 || fr.y < 0 || fr.x + fr.w > width || fr.y + fr.h > height) throw new Error(`sheet metadata: frame ${i} lies outside the ${width}x${height} sheet`);
    return fr;
  });
  const tags: SheetTag[] = (Array.isArray(json.meta?.frameTags) ? json.meta.frameTags : []).map((t: any) => ({
    name: String(t.name), from: num(t.from, 'frameTags.from'), to: num(t.to, 'frameTags.to'), direction: String(t.direction ?? 'forward'),
  })).filter((t: SheetTag) => t.from >= 0 && t.to < frames.length && t.from <= t.to);
  return { width, height, frames, tags, source: 'aseprite-json' };
}

/** plain grid fallback: `?frame=32x48` without any metadata file */
export function gridMeta(width: number, height: number, fw: number, fh: number): SheetMeta {
  const cols = Math.max(1, Math.floor(width / fw)), rows = Math.max(1, Math.floor(height / fh)), frames: SheetFrame[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) frames.push({ name: `grid ${frames.length}`, x: c * fw, y: r * fh, w: fw, h: fh, sw: fw, sh: fh, ox: 0, oy: 0, duration: 100 });
  return { width, height, frames, tags: [], source: `grid ${fw}x${fh}` };
}

/** frame indices of a tag (or every frame), in playback order for the forward / reverse / pingpong directions */
export function playOrder(meta: SheetMeta, tag: string): number[] {
  const t = meta.tags.find((x) => x.name === tag);
  const idx = t ? Array.from({ length: t.to - t.from + 1 }, (_, i) => t.from + i) : meta.frames.map((_, i) => i);
  if (t?.direction === 'reverse') return idx.reverse();
  if (t?.direction === 'pingpong' && idx.length > 2) return [...idx, ...idx.slice(1, -1).reverse()];
  return idx;
}
