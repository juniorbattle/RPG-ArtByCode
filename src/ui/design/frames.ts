import { rgb, type Tone } from './tokens';

/** The interface's frames (journal Passe UI3; the operator's decision S2, « Générés par le code (neuf tranches) »): pixel-art frames painted by
 *  code, one texel per pixel, cut in nine slices (CSS `border-image`) and shown TEXEL_PX CSS px per texel, on the sprites' texel grid. Every
 *  pixel is a colour of the page's tone (S3) or transparent. Pure: an RGBA buffer, painted the same in Node (tests) and in the page. */

export type FrameKind = 'panel' | 'parch' | 'btn' | 'btnHi' | 'btnAct' | 'btnOff' | 'tag' | 'tagFree' | 'key' | 'gauge';

export interface Frame { kind: FrameKind; w: number; h: number; slice: number; rgba: Uint8ClampedArray<ArrayBuffer> }

/** the tone's colour each frame paints at a texel's distance from the nearest edge (t = 0 the outline), top / left side first, then
 *  bottom / right where they differ (a light from the top left) */
type Ring = { tl: keyof Tone | null; br?: keyof Tone | null };
interface Spec { slice: number; rings: Ring[]; fill: keyof Tone; corner?: 'stud' | 'notch' | 'square' }

const SPECS: Record<FrameKind, Spec> = {
  // a royal blue panel in a gold border, a gold stud in each corner (status, « Here », cards, the arena's fighter cards)
  panel: { slice: 8, corner: 'stud', fill: 'blue1', rings: [{ tl: 'ink' }, { tl: 'goldHi', br: 'gold' }, { tl: 'gold' }, { tl: 'goldLo' }, { tl: 'ink' }, { tl: 'blue2', br: 'blue0' }] },
  // the parchment a dialogue or the board is written on: blue rim, gold line, shaded edge
  parch: { slice: 8, corner: 'square', fill: 'parch', rings: [{ tl: 'ink' }, { tl: 'blue2', br: 'blue1' }, { tl: 'blue1' }, { tl: 'gold' }, { tl: 'ink' }, { tl: 'parchLo' }] },
  // a button, its hover / focus (gold), the action (amber), unavailable (dim)
  btn: { slice: 4, corner: 'notch', fill: 'blue0', rings: [{ tl: 'ink' }, { tl: 'blue2', br: 'ink' }, { tl: 'blue0' }] },
  btnHi: { slice: 4, corner: 'notch', fill: 'blue0', rings: [{ tl: 'ink' }, { tl: 'goldHi', br: 'gold' }, { tl: 'goldLo' }] },
  btnAct: { slice: 4, corner: 'notch', fill: 'amberLo', rings: [{ tl: 'ink' }, { tl: 'amberHi', br: 'amber' }, { tl: 'amberLo' }] },
  btnOff: { slice: 4, corner: 'notch', fill: 'blue0', rings: [{ tl: 'ink' }, { tl: 'blue1', br: 'ink' }, { tl: 'blue0' }] },
  // a cost tag: amber for what is spent, light blue for « free »
  tag: { slice: 3, corner: 'notch', fill: 'ink', rings: [{ tl: 'amber' }, { tl: 'ink' }] },
  tagFree: { slice: 3, corner: 'notch', fill: 'ink', rings: [{ tl: 'blue3' }, { tl: 'ink' }] },
  // a keycap: ivory, its lower edge in shade
  key: { slice: 3, corner: 'notch', fill: 'ivory', rings: [{ tl: 'ink' }, { tl: 'ivory', br: 'parchLo' }] },
  // a gauge's trough
  gauge: { slice: 3, corner: 'notch', fill: 'blue0', rings: [{ tl: 'ink' }, { tl: 'gold', br: 'goldLo' }, { tl: 'ink' }] },
};

/** the stud of a panel's corner (7 x 7 texels, from the corner's outline): a gold diamond in ink (k), lit from the top left */
const STUD = [
  '...k...',
  '..kgk..',
  '.kgggk.',
  'kgggggk',
  '.kgggk.',
  '..kgk..',
  '...k...',
];

export function paintFrame(kind: FrameKind, tone: Tone): Frame {
  const sp = SPECS[kind], s = sp.slice, w = s * 3, h = s * 3, rgba = new Uint8ClampedArray(w * h * 4);
  const put = (x: number, y: number, key: keyof Tone | null) => {
    const i = (y * w + x) * 4;
    if (!key) { rgba[i + 3] = 0; return; }
    const [r, g, b] = rgb(tone[key]);
    rgba[i] = r; rgba[i + 1] = g; rgba[i + 2] = b; rgba[i + 3] = 255;
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const t = Math.min(x, y, w - 1 - x, h - 1 - y);
    // the nearest edge decides the side: top / left lit, bottom / right in shade (the corner's diagonal goes to the lit side)
    const br = (w - 1 - x < x && w - 1 - x <= y) || (h - 1 - y < y && h - 1 - y <= x);
    const ring = sp.rings[t];
    put(x, y, ring ? (br && ring.br !== undefined ? ring.br : ring.tl) : sp.fill);
  }
  // corners
  for (const [cx, cy, fx, fy] of [[0, 0, 1, 1], [w - 1, 0, -1, 1], [0, h - 1, 1, -1], [w - 1, h - 1, -1, -1]]) {
    if (sp.corner === 'notch') put(cx, cy, null);
    else if (sp.corner === 'square') for (let d = 0; d < 3; d++) for (let e = 0; e < 3; e++) put(cx + fx * d, cy + fy * e, d === 0 || e === 0 ? 'ink' : 'goldHi');
    else if (sp.corner === 'stud') {
      for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
        const c = STUD[y][x];
        if (c === '.') continue;
        // every stud keeps its light on the top left of the screen, mirrored or not: shaded by its texel's place in the stud
        const d = (fx > 0 ? x : 6 - x) + (fy > 0 ? y : 6 - y);
        put(cx + fx * x, cy + fy * y, c === 'k' ? 'ink' : d <= 4 ? 'goldHi' : d >= 8 ? 'goldLo' : 'gold');
      }
    }
  }
  return { kind, w, h, slice: s, rgba };
}

export const FRAME_KINDS = Object.keys(SPECS) as FrameKind[];
