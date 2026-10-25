import type { TimeOfDay } from '../../atmosphere/DayState';

/** The interface's design tokens (journal Passe UI3; the operator's sheet of Passe UI1, direction C « Héraldique pixel »):
 *  - S3, the palette: the tournament's royal blue, ivory and gold, amber for the action, the gauges inside the palette (no green, no red). The
 *    operator's note, word for word: « Cela peut changer par la suite » — the palette is provisional: every colour of the interface comes from
 *    here, a change is a change of this file;
 *  - L2, one style whose tones follow the page's day state (`DayState`): the same tokens, four tones (the evening is the night);
 *  - S4, the text sizes: no text under 16 px on a computer, under 14 px on a phone.
 *  Pure data (the frames' painter and the unit tests read it in Node). */

export interface Tone {
  /** outlines, the darkest ink */
  ink: string;
  /** the deep blue (buttons, bars, gauge troughs), the panels' blue, the inner rim / hover blue, the light blue (the player's gauge) */
  blue0: string; blue1: string; blue2: string; blue3: string;
  /** text on blue, secondary text on blue */
  ivory: string; muted: string;
  /** the parchment (dialogue and reading panels), its shaded edge, the text written on it */
  parch: string; parchLo: string; parchInk: string;
  /** the heraldic gold of the frames: base, highlight, shadow */
  gold: string; goldHi: string; goldLo: string;
  /** the action's amber: base, highlight, the deep amber of an action button's fill */
  amber: string; amberHi: string; amberLo: string;
  /** the backdrop behind a modal card */
  scrim: string;
}

/** night (the default, and the evening), morning, midday (the tournament's launch: the most saturated), the end of day (warmer) */
export const TONES: Record<TimeOfDay, Tone> = {
  night: {
    ink: '#05070d', blue0: '#0a1330', blue1: '#101d45', blue2: '#2a4080', blue3: '#8fb0e0',
    ivory: '#e6dcc2', muted: '#a3aed0', parch: '#d9cdae', parchLo: '#b3a37f', parchInk: '#141a35',
    gold: '#b8913e', goldHi: '#e8c878', goldLo: '#5e4619', amber: '#e9a64c', amberHi: '#f6c77a', amberLo: '#5a3410',
    scrim: 'rgba(5,7,13,.62)',
  },
  morning: {
    ink: '#0a0f22', blue0: '#1a2a5e', blue1: '#233777', blue2: '#4660a8', blue3: '#c0d0ee',
    ivory: '#f1f0e8', muted: '#c2cce4', parch: '#ebe7d8', parchLo: '#c8c0a6', parchInk: '#18203e',
    gold: '#c8a656', goldHi: '#eed99a', goldLo: '#6c5622', amber: '#e8a04a', amberHi: '#f8c983', amberLo: '#5c3712',
    scrim: 'rgba(12,18,38,.5)',
  },
  midday: {
    ink: '#0a0f24', blue0: '#142c72', blue1: '#1c3b92', blue2: '#3d64c4', blue3: '#bcd2f4',
    ivory: '#f7efda', muted: '#c8d4f0', parch: '#f2e7c9', parchLo: '#d2c095', parchInk: '#151d46',
    gold: '#d9ab43', goldHi: '#f8dc8c', goldLo: '#76541a', amber: '#f0a33a', amberHi: '#ffd08a', amberLo: '#5e3610',
    scrim: 'rgba(10,16,40,.45)',
  },
  afternoon: {
    ink: '#0d0b1c', blue0: '#1b275f', blue1: '#263379', blue2: '#4c57a8', blue3: '#c6c9ee',
    ivory: '#f9e9cd', muted: '#c8c9e0', parch: '#f2dfbb', parchLo: '#d2b386', parchInk: '#211a3a',
    gold: '#dea644', goldHi: '#ffd98a', goldLo: '#7e4f18', amber: '#f39a3a', amberHi: '#ffc47e', amberLo: '#603210',
    scrim: 'rgba(16,12,34,.5)',
  },
};

/** S4: the smallest text a page may show, by device class; the phone is a narrow (portrait) or short (landscape) window */
export const MIN_TEXT = { desktop: 16, phone: 14 } as const;
export const PHONE_QUERY = '(max-width:700px),(max-height:480px)';

/** the type scale (CSS px): the readable text font for sentences, the pixel font for titles, numbers and keys (S1). The pixel font is drawn on
 *  a tenth of its em: 20 / 30 / 40 px keep its pixel 2 / 3 / 4 px wide */
export const TYPE = {
  desktop: { small: 16, body: 18, label: 18, pixel: 20, pixelBig: 30, pixelHuge: 40 },
  phone: { small: 14, body: 16, label: 15, pixel: 20, pixelBig: 20, pixelHuge: 30 },
} as const;

/** one texel of a frame, in CSS px (S2: the frames are drawn on the sprites' texel grid; a baked character's texel is about 1.5-2 px at 1080p) */
export const TEXEL_PX = 2;

/** sRGB hex -> [r, g, b] 0..255 */
export function rgb(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

/** WCAG 2 contrast ratio of two sRGB colours */
export function contrast(a: string, b: string): number {
  const lum = (h: string) => {
    const [r, g, bl] = rgb(h).map((c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const la = lum(a), lb = lum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** the tone of a page: its day state (`time=` parsed by `parseTime`; absent = the night) */
export function toneOf(time: TimeOfDay | null | undefined): Tone { return TONES[time ?? 'night']; }
