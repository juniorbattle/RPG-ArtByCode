import * as THREE from 'three';
import { FRAME_W, FRAME_H, renderFrame, posesFor, type CharSpec, type Dir, type Anim } from './SpriteGenerator';
import { Sprite, ramp, Layer } from './PixelPainter';

export interface FrameRect { u0: number; v0: number; u1: number; v1: number }

/** Bakes every character frame ONCE into a shared atlas (colour + emissive). 100% generated, no imported pixel art. */
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

  static build(specs: CharSpec[]): SpriteAtlas {
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
    const mk = (buf: Uint8ClampedArray, srgb: boolean) => {
      const t = new THREE.DataTexture(new Uint8Array(buf.buffer), W, H, THREE.RGBAFormat, THREE.UnsignedByteType);
      t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false;
      t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true;
      return t;
    };
    a.texture = mk(data, true); a.emis = mk(em, false);
    a.width = W; a.height = H; a.rgba = data;
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
