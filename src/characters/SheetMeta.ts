/** Aseprite CLI sheet metadata (`--data sheet.json --format json-array|json-hash --list-tags`): read by the baked character loader of the game
 *  (src/characters/BakedDecode.ts) and by the DEV-only Character Lab (src/lab/sheetMeta.ts re-exports it). */

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

