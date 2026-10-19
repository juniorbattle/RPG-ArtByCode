import { FRAME_H, type Dir, type Anim } from './SpriteGenerator';
import { parseAsepriteJson } from './SheetMeta';
import type { BakedFrame, BakedSheet } from './BakedSprites';

/** Exact decoding of a baked character export (Aseprite sheet PNG + JSON array), shared by the game's production cast
 *  (`BakedCast.ts`) and the DEV harness (`src/lab/bakedLoader.ts`): no browser image decoder, so no colour management and no
 *  premultiplied alpha touch the bytes. */

const ANIMS: Anim[] = ['idle', 'walk', 'hammer', 'talk', 'carry'], DIRS: Dir[] = ['down', 'up', 'side', 'downSide', 'upSide'];

export const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((v) => v.toString(16).padStart(2, '0')).join('');

/** SHA-256 of the bytes (WebCrypto; null where it is unavailable: a non-secure http origin) */
export async function sha256(bytes: Uint8Array): Promise<string | null> {
  if (!globalThis.crypto?.subtle) return null;
  return hex(await crypto.subtle.digest('SHA-256', bytes as BufferSource));
}

/** Exact PNG decode (8-bit RGBA, non-interlaced): inflate + unfilter, nothing else touches the bytes. */
export async function decodePng(bytes: Uint8Array): Promise<{ w: number; h: number; rgba: Uint8Array }> {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (dv.getUint32(0) !== 0x89504e47) throw new Error('not a PNG');
  let o = 8, w = 0, h = 0; const idat: Uint8Array[] = [];
  while (o < bytes.length) {
    const n = dv.getUint32(o), t = String.fromCharCode(...bytes.subarray(o + 4, o + 8)), d = bytes.subarray(o + 8, o + 8 + n);
    if (t === 'IHDR') {
      w = dv.getUint32(o + 8); h = dv.getUint32(o + 12);
      if (d[8] !== 8 || d[9] !== 6 || d[12] !== 0) throw new Error(`PNG must be 8-bit RGBA, not interlaced (depth ${d[8]}, colour type ${d[9]}, interlace ${d[12]})`);
    } else if (t === 'IDAT') idat.push(d);
    o += 12 + n;
  }
  const raw = new Uint8Array(await new Response(new Blob(idat as BlobPart[]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
  const st = w * 4, px = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (st + 1)], r = y * (st + 1) + 1;
    for (let x = 0; x < st; x++) {
      const a = x >= 4 ? px[y * st + x - 4] : 0, u = y ? px[(y - 1) * st + x] : 0, c = x >= 4 && y ? px[(y - 1) * st + x - 4] : 0;
      let v = raw[r + x];
      if (f === 1) v += a; else if (f === 2) v += u; else if (f === 3) v += (a + u) >> 1;
      else if (f === 4) { const p = a + u - c, pa = Math.abs(p - a), pb = Math.abs(p - u), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? u : c; }
      px[y * st + x] = v & 255;
    }
  }
  return { w, h, rgba: px };
}

/** A decoded export -> the frames of a baked sheet. Aseprite tags name `<anim>-<dir>` (e.g. `walk-side`); an untagged sheet is read as
 *  front idle frames (down/idle/0..n-1). The density k comes from the frame height (48k). */
export function sheetFrames(id: string, img: { w: number; h: number; rgba: Uint8Array }, json: unknown): { k: number; frames: BakedFrame[] } {
  const meta = parseAsepriteJson(json);
  if (meta.width !== img.w || meta.height !== img.h) throw new Error(`${id}: JSON says ${meta.width}x${meta.height}, PNG is ${img.w}x${img.h}`);
  const fw = meta.frames[0].sw, fh = meta.frames[0].sh, k = fh / FRAME_H;
  const cut = (i: number): Uint8Array => {
    const f = meta.frames[i], out = new Uint8Array(fw * fh * 4);
    if (f.sw !== fw || f.sh !== fh) throw new Error(`${id}: frames must share one size`);
    for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
      const s = ((f.y + y) * img.w + f.x + x) * 4, d = ((f.oy + y) * fw + f.ox + x) * 4;
      out[d] = img.rgba[s]; out[d + 1] = img.rgba[s + 1]; out[d + 2] = img.rgba[s + 2]; out[d + 3] = img.rgba[s + 3];
    }
    return out;
  };
  const frames: BakedFrame[] = [];
  if (!meta.tags.length) meta.frames.forEach((_, i) => frames.push({ dir: 'down', anim: 'idle', i, rgba: cut(i) }));
  else for (const t of meta.tags) {
    const [anim, dir] = t.name.split('-') as [Anim, Dir];
    if (!ANIMS.includes(anim) || !DIRS.includes(dir)) throw new Error(`${id}: tag "${t.name}" is not <anim>-<dir> (${ANIMS.join('|')} - ${DIRS.join('|')})`);
    for (let i = t.from; i <= t.to; i++) frames.push({ dir, anim, i: i - t.from, rgba: cut(i) });
  }
  return { k, frames };
}

/** height in texel rows of the figure in a frame: its highest opaque texel down to the foot row (`foot` = FOOT_Y * k) */
export function figureRows(f: BakedFrame, fw: number, foot: number): number {
  for (let i = 3; i < f.rgba.length; i += 4) if (f.rgba[i] >= 128) return foot - Math.floor((i >> 2) / fw);
  return 0;
}

export type { BakedSheet };
