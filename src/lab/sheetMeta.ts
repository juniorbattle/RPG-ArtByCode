/** Sprite-sheet metadata for the DEV-ONLY Character Lab (never imported by the game; the Aseprite JSON reader itself lives in src/characters/SheetMeta.ts).
 *  Reads the documented Aseprite CLI JSON (`--data sheet.json --format json-array|json-hash --list-tags`), or a plain grid. */

import type { SheetMeta, SheetFrame } from '../characters/SheetMeta';
export { parseAsepriteJson, type SheetMeta, type SheetFrame, type SheetTag } from '../characters/SheetMeta';

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
