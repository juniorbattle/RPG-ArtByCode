import * as THREE from 'three';
import { FRAME_W, FRAME_H, renderFrame, posesFor, type CharSpec, type Dir, type Anim } from './SpriteGenerator';
import { Sprite, ramp, Layer } from './PixelPainter';
import { checkBakedSheet, DIRS, type BakedSheet } from './BakedSprites';

/** a generated frame: normalised UV rectangle in the generated texture; a baked frame: its integer cell in the baked texture
 *  (x0, y0 = bottom-left data texel, w, h), the UV fields unused */
export interface FrameRect { u0: number; v0: number; u1: number; v1: number; cell?: [number, number, number, number] }

/** width of the baked texture: 8 x2 frames per shelf */
const BW = 512;

/** Bakes every character frame ONCE into a shared atlas (colour + emissive). The game's characters are 100% generated. Baked (authored)
 *  sheets of any density k (frames 32k x 48k, see BakedSprites.ts; EXPERIMENTAL, DEV flag only today) go to a second texture of the same
 *  atlas, drawn by the same instanced meshes: adding them never changes the generated texture, so it can never change a generated sprite. */
export class SpriteAtlas {
  readonly frames = new Map<string, FrameRect>();
  readonly counts = new Map<string, number>();
  readonly specs = new Map<string, CharSpec>();
  texture!: THREE.DataTexture;
  emis!: THREE.DataTexture;
  width = 0; height = 0;
  frameCount = 0;
  buildMs = 0;
  rgba!: Uint8ClampedArray;
  /** baked sheets' texture (1 x 1 transparent when there is none) and its size / bytes */
  bakedTexture!: THREE.DataTexture;
  bakedWidth = 1; bakedHeight = 1;
  bakedRgba!: Uint8ClampedArray;
  /** baked sheets in this atlas, by manifest id */
  readonly baked = new Map<string, { k: number; runtimeUse: BakedSheet['runtimeUse']; sha256: string; frames: number }>();
  /** explicit front-idle aliases (contract amendment B): `spec/dir/idle` keys that show the front idle frame */
  readonly aliases: string[] = [];

  static build(specs: CharSpec[], baked: BakedSheet[] = [], maxTextureSize = 2048): SpriteAtlas {
    const t0 = performance.now();
    const a = new SpriteAtlas();
    const cols = 16;
    const cells: Array<{ key: string; spr: Sprite }> = [];
    for (const spec of specs) {
      a.specs.set(spec.id, spec);
      for (const anim of spec.anims) {
        const poses = posesFor(anim);
        a.counts.set(`${spec.id}/${anim}`, poses.length);
        const dirs: Dir[] = spec.kind === 'cat' ? ['side'] : anim === 'hammer' ? ['side'] : ['down', 'up', 'side'];
        for (const d of dirs) poses.forEach((p, i) => {
          if (spec.kind === 'cat') p = { ...p, tailPhase: anim === 'walk' ? (i % 2 ? 1 : -1) : i % 2 ? 2 : 0 };
          cells.push({ key: `${spec.id}/${d}/${anim}/${i}`, spr: renderFrame(spec, d, p) });
        });
      }
    }
    // speech bubbles (tiny, generated like everything else)
    cells.push({ key: 'fx/bubble/dots', spr: makeBubble('dots') }, { key: 'fx/bubble/exclaim', spr: makeBubble('exclaim') });
    a.frameCount = cells.length;
    const rows = Math.ceil(cells.length / cols);
    const W = cols * FRAME_W, H = rows * FRAME_H;
    const data = new Uint8ClampedArray(W * H * 4), em = new Uint8ClampedArray(W * H * 4);
    cells.forEach((c, idx) => {
      const cx = (idx % cols) * FRAME_W, cy = Math.floor(idx / cols) * FRAME_H;
      for (let y = 0; y < FRAME_H; y++) for (let x = 0; x < FRAME_W; x++) {
        const s = (y * FRAME_W + x) * 4;
        const d = ((H - 1 - (cy + y)) * W + (cx + x)) * 4; // flip rows: data row 0 is v=0
        data[d] = c.spr.rgba[s]; data[d + 1] = c.spr.rgba[s + 1]; data[d + 2] = c.spr.rgba[s + 2]; data[d + 3] = c.spr.rgba[s + 3];
        const e = c.spr.emis[y * FRAME_W + x];
        em[d] = e; em[d + 1] = e; em[d + 2] = e; em[d + 3] = 255;
      }
      a.frames.set(c.key, { u0: cx / W, u1: (cx + FRAME_W) / W, v1: 1 - cy / H, v0: 1 - (cy + FRAME_H) / H });
    });
    const mk = (buf: Uint8ClampedArray, w: number, h: number, srgb: boolean) => {
      const t = new THREE.DataTexture(new Uint8Array(buf.buffer), w, h, THREE.RGBAFormat, THREE.UnsignedByteType);
      t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      // pixel art: nearest sampling (the sprite shader also addresses texel centres explicitly)
      t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
      t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true;
      return t;
    };
    a.texture = mk(data, W, H, true); a.emis = mk(em, W, H, false);
    a.width = W; a.height = H; a.rgba = data;

    // baked sheets: their OWN texture, so the generated texture (its size, bytes and UVs) never changes whatever is added. Frames are
    // shelf-packed (one shelf per density, sheet / frame order); data row 0 is the bottom of the texture, a frame's bottom image row sits on
    // its shelf's first data row. A baked frame is addressed by its integer cell (x0, y0, w, h), never by normalised UVs (SpriteRenderer).
    const blocks: Array<{ s: BakedSheet; f: BakedSheet['frames'][number]; x: number; y: number }> = [];
    let x = BW, y = 0, shelf = 0, k = 0;
    for (const s of baked) {
      const errs = checkBakedSheet(s);
      if (errs.length) throw new Error(`baked sheet ${s.id}: ${errs.join('; ')}`);
      if (specs.some((p) => p.id === s.id) || baked.filter((b) => b.id === s.id).length > 1) throw new Error(`baked sheet ${s.id}: id already used`);
      const fw = FRAME_W * s.k, fh = FRAME_H * s.k;
      if (fw > BW) throw new Error(`baked sheet ${s.id}: frames wider than the baked texture (${BW})`);
      for (const f of s.frames) {
        if (s.k !== k || x + fw > BW) { y += shelf; x = 0; shelf = fh; k = s.k; }
        blocks.push({ s, f, x, y }); x += fw;
      }
    }
    const BH = Math.max(1, y + shelf), bw = blocks.length ? BW : 1;
    if (BH > maxTextureSize) throw new Error(`baked sprite texture ${BW} x ${BH} exceeds MAX_TEXTURE_SIZE ${maxTextureSize}`);
    const bdata = new Uint8ClampedArray(bw * BH * 4);
    for (const { s, f, x: bx, y: by } of blocks) {
      const fw = FRAME_W * s.k, fh = FRAME_H * s.k;
      for (let yy = 0; yy < fh; yy++) for (let xx = 0; xx < fw; xx++) {
        const src = (yy * fw + xx) * 4, d = ((by + fh - 1 - yy) * bw + (bx + xx)) * 4;   // image row yy -> data row (bottom-up)
        bdata[d] = f.rgba[src]; bdata[d + 1] = f.rgba[src + 1]; bdata[d + 2] = f.rgba[src + 2]; bdata[d + 3] = f.rgba[src + 3];
      }
      a.frames.set(`${s.id}/${f.dir}/${f.anim}/${f.i}`, { u0: 0, v0: 0, u1: 0, v1: 0, cell: [bx, by, fw, fh] });
    }
    for (const s of baked) {
      for (const f of s.frames) a.counts.set(`${s.id}/${f.anim}`, Math.max(a.counts.get(`${s.id}/${f.anim}`) ?? 0, f.i + 1));
      if (s.fallback === 'front-idle') {
        const n = a.counts.get(`${s.id}/idle`) ?? 0;
        for (const d of DIRS) {
          if (a.frames.has(`${s.id}/${d}/idle/0`)) continue;
          for (let i = 0; i < n; i++) a.frames.set(`${s.id}/${d}/idle/${i}`, a.frames.get(`${s.id}/down/idle/${i}`)!);
          a.aliases.push(`${s.id}/${d}/idle`);
        }
      }
      a.baked.set(s.id, { k: s.k, runtimeUse: s.runtimeUse, sha256: s.sha256, frames: s.frames.length });
    }
    a.bakedTexture = mk(bdata, bw, BH, true); a.bakedWidth = bw; a.bakedHeight = BH; a.bakedRgba = bdata;
    a.buildMs = performance.now() - t0;
    return a;
  }

  frame(id: string, dir: Dir, anim: Anim, i: number): FrameRect | undefined {
    return this.frames.get(`${id}/${dir}/${anim}/${i}`);
  }
}

function makeBubble(kind: 'dots' | 'exclaim'): Sprite {
  const S = new Sprite(FRAME_W, FRAME_H);
  const L = new Layer(FRAME_W, FRAME_H);
  L.rect(5, 27, 22, 12); L.rect(6, 26, 20, 14); L.poly([[12, 39], [16, 44], [17, 39]]);
  S.commit(L, ramp([246, 242, 232]), 'edge', { id: 1 });
  const dark: [number, number, number] = [60, 52, 68];
  if (kind === 'dots') { for (const x of [9, 14, 19]) S.rect(x, 31, 3, 3, dark); }
  else { S.rect(15, 28, 2, 6, [200, 50, 44]); S.rect(15, 35, 2, 2, [200, 50, 44]); }
  S.outline(0.35);
  return S;
}
