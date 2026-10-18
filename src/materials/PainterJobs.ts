import { paintAshlar, paintPlaster, paintTimber, paintRoofTiles, paintCloth, paintMetal, paintCobble, type TexSet, type RGB } from './TexturePainters';

/** The library's painted textures as named, self-contained jobs: fixed seeds and parameters, pure functions (no DOM, no Math.random), so
 *  a Web Worker and the main thread paint the same bytes (journal pass 6, P3). Imported by `painter.worker.ts` and by the main-thread
 *  fallback of `PainterPool.ts`. */

// cool stone / muted brick: base albedos stay near-neutral so per-building tints define a narrow slate band
const stonePal: RGB[] = [[128, 132, 142], [110, 116, 128], [136, 136, 140], [98, 104, 118], [120, 122, 128]];
const brickPal: RGB[] = [[104, 86, 82], [92, 78, 76], [112, 94, 88], [84, 72, 72], [100, 84, 80]];

export const PAINT_JOBS = {
  ashlar: () => paintAshlar(512, 101, { rows: 6, blockW: 0.3, rowVar: 0.28, widthVar: 0.4, offsetRows: false, palette: stonePal, mortar: [58, 60, 66], mortarW: 4.5, bevel: 7, moss: 0.08, chip: 0.5, streak: 0.8, crack: 0.8, normal: 3.4 }),
  brick: () => paintAshlar(512, 202, { rows: 15, blockW: 0.215, rowVar: 0.04, widthVar: 0.08, offsetRows: true, palette: brickPal, mortar: [120, 118, 116], mortarW: 2.6, bevel: 3, moss: 0.04, chip: 0.3, streak: 0.5, crack: 0.3, normal: 3.0 }),
  plaster: () => {
    const under = paintAshlar(512, 303, { rows: 9, blockW: 0.22, rowVar: 0.35, widthVar: 0.55, offsetRows: false, palette: [[112, 112, 116], [96, 98, 104], [122, 120, 120]], mortar: [66, 66, 70], mortarW: 4, bevel: 5, moss: 0.03, chip: 0.6, streak: 0, crack: 0, normal: 3 });
    return paintPlaster(512, 404, { base: [178, 176, 172], alt: [152, 152, 154], crumble: 0.12, cracks: 1, stain: 0.8, underlying: under });
  },
  timber: () => paintTimber(512, 505, 'beam', [58, 52, 50], [74, 66, 62]),
  planks: () => paintTimber(512, 606, 'planks', [76, 68, 62], [96, 86, 78]),
  roof: () => paintRoofTiles(512, 707, [[84, 88, 98], [70, 74, 86], [96, 98, 106], [90, 92, 100], [78, 80, 92]], 9, 8),
  cloth: () => paintCloth(256, 808),
  metal: () => paintMetal(256, 909),
  cobble: () => paintCobble(1024, 1001),
} satisfies Record<string, () => TexSet>;

export type PaintJob = keyof typeof PAINT_JOBS;

/** Messages between `PainterPool` and `painter.worker.ts`. */
export interface PaintRequest { id: number; job: PaintJob }
export type PaintReply =
  | { id: number; job: PaintJob; ms: number; size: number; albedo: Uint8ClampedArray; nr: Uint8ClampedArray }
  | { id: number; job: PaintJob; error: string };
