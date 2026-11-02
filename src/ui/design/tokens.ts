import type { TimeOfDay } from '../../atmosphere/DayState';

/** The interface's design tokens (journal Passes UI3 / UM1; the operator's sheet of Passe UM1, direction A « Voile »):
 *  - UM-S3 « Maintenir, allégée », the palette: ivory, ink and one accent, gold by day and amber at night; the blue and the gold no longer fill
 *    surfaces, the gauges stay inside the palette (no green, no red). The operator's note of Passe UI1 still holds, word for word: « Cela peut
 *    changer par la suite »: every colour of the interface comes from here, a change is a change of this file;
 *  - UM-L2 « Maintenir », one style whose tones follow the page's day state (`DayState`): the same tokens, four tones (the evening is the night);
 *    the ivory and the light grey do not change, the ink slides with the light;
 *  - UM-S4 « Maintenir », the text sizes: no text under 16 px on a computer, under 14 px on a phone.
 *  Pure data (the unit tests read it in Node). */

export interface Tone {
  /** the veils' ink, the darkest colour of the interface */
  ink: string;
  /** text, secondary text */
  ivory: string; muted: string;
  /** the one accent: what is selected, what can be acted on now */
  accent: string;
  /** a one-pixel rule, a gauge's empty track */
  line: string; trough: string;
  /** the backdrop behind a modal sheet */
  scrim: string;
}

const IVORY = '#f5f1e6', GREY = '#cfd2db', GOLD = '#f2c15a', AMBER = '#e9a64c';
const LINE = 'rgba(245,241,230,.28)', TROUGH = 'rgba(245,241,230,.22)';

/** night (the default, and the evening), morning, midday, the end of day */
export const TONES: Record<TimeOfDay, Tone> = {
  night: { ink: '#060914', ivory: IVORY, muted: GREY, accent: AMBER, line: LINE, trough: TROUGH, scrim: 'rgba(6,9,20,.62)' },
  morning: { ink: '#0b1122', ivory: IVORY, muted: GREY, accent: GOLD, line: LINE, trough: TROUGH, scrim: 'rgba(11,17,34,.55)' },
  midday: { ink: '#0b1020', ivory: IVORY, muted: GREY, accent: GOLD, line: LINE, trough: TROUGH, scrim: 'rgba(11,16,32,.55)' },
  afternoon: { ink: '#100d1e', ivory: IVORY, muted: GREY, accent: GOLD, line: LINE, trough: TROUGH, scrim: 'rgba(16,13,30,.55)' },
};

/** the veils' strength in % of ink, the screen's edge first (a plain ivory text needs at least 58 %, journal Passe UM1) */
export const VEIL = { strong: 92, mid: 84, soft: 66 } as const;

/** S4: the smallest text a page may show, by device class; the phone is a narrow (portrait) or short (landscape) window */
export const MIN_TEXT = { desktop: 16, phone: 14 } as const;
export const PHONE_QUERY = '(max-width:700px),(max-height:480px)';

/** the type scale (CSS px): the text font for sentences and labels, the title font for titles, names and numbers */
export const TYPE = {
  desktop: { small: 16, body: 18, label: 20, line: 24, fig: 30, title: 32, titleBig: 40, titleHuge: 56 },
  phone: { small: 14, body: 16, label: 16, line: 17, fig: 20, title: 24, titleBig: 26, titleHuge: 36 },
} as const;

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
