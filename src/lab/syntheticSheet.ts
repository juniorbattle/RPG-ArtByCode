import { FRAME_W, FRAME_H, FOOT_Y } from '../characters/SpriteGenerator';

/** A tiny synthetic TEST sheet for the dev-only Character Lab. It is NOT character art: a flat "test dummy" built to expose
 *  texture-filtering and scale errors: 4 frames of FRAME_W x FRAME_H in a horizontal strip, in the shape of an Aseprite
 *  `--format json-array --list-tags` export (a hand-written fixture, NOT a real Aseprite export).
 *   - magenta pixels in the 4 frame corners: cropped / shifted frames show immediately
 *   - a 6x6 one-pixel checker: any bilinear blending turns it grey
 *   - 50 % alpha pixels: transparency / blending path
 *   - everything else alpha 0: the neutral background must show through untouched
 *   - the boots end on the row above FOOT_Y, the runtime's foot line */
const FRAMES = 4;
type RGB = [number, number, number];
const OUTLINE: RGB = [14, 18, 32], MID: RGB = [62, 78, 122], LIT: RGB = [96, 116, 168], DARK: RGB = [38, 48, 84];
const BOOT: RGB = [58, 44, 48], SKIN: RGB = [214, 172, 140], AMBER: RGB = [233, 166, 76], IVORY: RGB = [232, 226, 206], MAGENTA: RGB = [255, 0, 255];

export interface SyntheticSheet { rgba: Uint8ClampedArray<ArrayBuffer>; width: number; height: number; json: unknown }

export function makeSyntheticSheet(): SyntheticSheet {
  const W = FRAME_W * FRAMES, H = FRAME_H;
  const rgba = new Uint8ClampedArray(W * H * 4);
  for (let f = 0; f < FRAMES; f++) drawFrame(rgba, W, f * FRAME_W, f);
  const frames = Array.from({ length: FRAMES }, (_, i) => ({
    filename: `synthetic ${i}.aseprite`, frame: { x: i * FRAME_W, y: 0, w: FRAME_W, h: FRAME_H }, rotated: false, trimmed: false,
    spriteSourceSize: { x: 0, y: 0, w: FRAME_W, h: FRAME_H }, sourceSize: { w: FRAME_W, h: FRAME_H }, duration: i % 2 ? 160 : 240,
  }));
  const json = {
    frames,
    meta: {
      app: 'synthetic (hand-written fixture, not Aseprite)', version: '0', image: 'synthetic.png', format: 'RGBA8888', size: { w: W, h: H }, scale: '1',
      frameTags: [{ name: 'idle', from: 0, to: 1, direction: 'forward' }, { name: 'walk', from: 0, to: 3, direction: 'forward' }],
    },
  };
  return { rgba, width: W, height: H, json };
}

function drawFrame(px: Uint8ClampedArray, W: number, x0: number, f: number): void {
  const set = (x: number, y: number, c: RGB, a = 255) => {
    if (x < 0 || x >= FRAME_W || y < 0 || y >= FRAME_H) return;
    const i = (y * W + x0 + x) * 4; px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; px[i + 3] = a;
  };
  const rect = (x: number, y: number, w: number, h: number, c: RGB) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(x + i, y + j, c); };
  const alphaAt = (x: number, y: number) => (x < 0 || x >= FRAME_W || y < 0 || y >= FRAME_H ? 0 : px[(y * W + x0 + x) * 4 + 3]);

  const bob = f % 2;                      // body bob
  const stepL = f === 1 ? 2 : 0, stepR = f === 3 ? 2 : 0;      // lifted foot on the walk frames
  const swing = f === 1 ? -1 : f === 3 ? 1 : 0;               // arm swing
  rect(11, 31 + bob, 4, FOOT_Y - 31 - bob - stepL, DARK); rect(17, 31 + bob, 4, FOOT_Y - 31 - bob - stepR, DARK);    // legs / boots (end on row FOOT_Y - 1)
  rect(11, FOOT_Y - 3 - stepL, 4, 3, BOOT); rect(17, FOOT_Y - 3 - stepR, 4, 3, BOOT);
  rect(10, 16 + bob, 12, 15, MID); rect(10, 16 + bob, 2, 15, LIT); rect(20, 16 + bob, 2, 15, DARK);                    // torso, lit left / shadow right
  rect(10, 25 + bob, 12, 1, AMBER);                                                                                   // belt: the one warm accent
  rect(7, 17 + bob + swing, 3, 11, MID); rect(22, 17 + bob - swing, 3, 11, MID);                                      // arms
  rect(7, 28 + bob + swing, 3, 2, SKIN); rect(22, 28 + bob - swing, 3, 2, SKIN);                                      // hands
  rect(12, 8 + bob, 8, 8, SKIN); rect(12, 8 + bob, 8, 2, IVORY);                                                      // head + hair line

  // 1 px outline around the silhouette (4-neighbourhood), drawn into transparent pixels only
  const edge: Array<[number, number]> = [];
  for (let y = 0; y < FRAME_H; y++) for (let x = 0; x < FRAME_W; x++) {
    if (alphaAt(x, y) === 0 && (alphaAt(x - 1, y) || alphaAt(x + 1, y) || alphaAt(x, y - 1) || alphaAt(x, y + 1))) edge.push([x, y]);
  }
  for (const [x, y] of edge) set(x, y, OUTLINE);

  for (const [x, y] of [[0, 0], [FRAME_W - 1, 0], [0, FRAME_H - 1], [FRAME_W - 1, FRAME_H - 1]]) set(x, y, MAGENTA);   // frame corner markers
  for (let j = 0; j < 6; j++) for (let i = 0; i < 6; i++) set(3 + i, 4 + j, (i + j) % 2 ? [0, 0, 0] : [255, 255, 255]);   // one-pixel checker
  for (let j = 0; j < 2; j++) for (let i = 0; i < 4; i++) set(25 + i, 5 + j, AMBER, 128);                                 // 50 % alpha block
}
