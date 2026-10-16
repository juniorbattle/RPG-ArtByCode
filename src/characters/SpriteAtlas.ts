import * as THREE from 'three';
import { FRAME_W, FRAME_H, renderFrame, posesFor, type CharSpec, type Dir, type Anim } from './SpriteGenerator';
import { Sprite, ramp, Layer } from './PixelPainter';
import { checkBakedSheet, DIRS, type BakedSheet } from './BakedSprites';

export interface FrameRect { u0: number; v0: number; u1: number; v1: number }

/** Bakes every character frame ONCE into a shared atlas (colour + emissive). The game's characters are 100% generated; baked (authored)
 *  sheets of any density k (frames 32k x 48k, see BakedSprites.ts) can join the same atlas, EXPERIMENTAL and DEV-flag only today. The
 *  generated cells keep their data rows (and bytes) whatever is added: baked blocks go in the rows above them. */
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
  /** height of the generated part: data rows [0, generatedHeight) hold exactly the bytes of an atlas without baked sheets */
  generatedHeight = 0;
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
    const W = cols * FRAME_W, H0 = rows * FRAME_H;
    // baked blocks: shelf-packed in image rows [0, top) (data rows [H0, H)), one shelf per density, in sheet / frame order
    const blocks: Array<{ s: BakedSheet; f: BakedSheet['frames'][number]; x: number; y: number }> = [];
    let top = 0;
    {
      let x = W, y = 0, shelf = 0, k = 0;
      for (const s of baked) {
        const errs = checkBakedSheet(s);
        if (errs.length) throw new Error(`baked sheet ${s.id}: ${errs.join('; ')}`);
        if (specs.some((p) => p.id === s.id) || baked.filter((b) => b.id === s.id).length > 1) throw new Error(`baked sheet ${s.id}: id already used`);
        const fw = FRAME_W * s.k, fh = FRAME_H * s.k;
        for (const f of s.frames) {
          if (s.k !== k || x + fw > W) { y += shelf; x = 0; shelf = fh; k = s.k; }
          blocks.push({ s, f, x, y }); x += fw;
        }
      }
      top = y + shelf;
    }
    const H = H0 + top;
    if (H > maxTextureSize) throw new Error(`sprite atlas ${W} x ${H} exceeds MAX_TEXTURE_SIZE ${maxTextureSize}`);
    const data = new Uint8ClampedArray(W * H * 4), em = new Uint8ClampedArray(W * H * 4);
    cells.forEach((c, idx) => {
      const cx = (idx % cols) * FRAME_W, cy = Math.floor(idx / cols) * FRAME_H + top;   // image-space row, below the baked shelves
      for (let y = 0; y < FRAME_H; y++) for (let x = 0; x < FRAME_W; x++) {
        const s = (y * FRAME_W + x) * 4;
        const d = ((H - 1 - (cy + y)) * W + (cx + x)) * 4; // flip rows: data row 0 is v=0
        data[d] = c.spr.rgba[s]; data[d + 1] = c.spr.rgba[s + 1]; data[d + 2] = c.spr.rgba[s + 2]; data[d + 3] = c.spr.rgba[s + 3];
        const e = c.spr.emis[y * FRAME_W + x];
        em[d] = e; em[d + 1] = e; em[d + 2] = e; em[d + 3] = 255;
      }
      a.frames.set(c.key, { u0: cx / W, u1: (cx + FRAME_W) / W, v1: 1 - cy / H, v0: 1 - (cy + FRAME_H) / H });
    });
    for (const { s, f, x: bx, y: by } of blocks) {
      const fw = FRAME_W * s.k, fh = FRAME_H * s.k;
      for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
        const src = (y * fw + x) * 4, d = ((H - 1 - (by + y)) * W + (bx + x)) * 4;
        data[d] = f.rgba[src]; data[d + 1] = f.rgba[src + 1]; data[d + 2] = f.rgba[src + 2]; data[d + 3] = f.rgba[src + 3];
        em[d + 3] = 255;   // a baked sheet has no emissive layer
      }
      a.frames.set(`${s.id}/${f.dir}/${f.anim}/${f.i}`, { u0: bx / W, u1: (bx + fw) / W, v1: 1 - by / H, v0: 1 - (by + fh) / H });
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
    const mk = (buf: Uint8ClampedArray, srgb: boolean) => {
      const t = new THREE.DataTexture(new Uint8Array(buf.buffer), W, H, THREE.RGBAFormat, THREE.UnsignedByteType);
      t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      // pixel art: nearest sampling (the sprite shader also addresses texel centres explicitly)
      t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
      t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true;
      return t;
    };
    a.texture = mk(data, true); a.emis = mk(em, false);
    a.width = W; a.height = H; a.rgba = data; a.generatedHeight = H0;
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
