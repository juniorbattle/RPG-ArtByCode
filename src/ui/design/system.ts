import pixelFont from '../fonts/PixelifySans-latin.woff2?url';
import textFont400 from '../fonts/AlegreyaSans-400-latin.woff2?url';
import textFont700 from '../fonts/AlegreyaSans-700-latin.woff2?url';
import type { TimeOfDay } from '../../atmosphere/DayState';
import { FRAME_KINDS, paintFrame, type FrameKind } from './frames';
import { PHONE_QUERY, TEXEL_PX, TYPE, toneOf, type Tone } from './tokens';

/** The interface's design system in the page (journal Passe UI3): the two embedded fonts (S1, `src/ui/fonts/FONTS.md`), the tone of the page's
 *  day state as CSS custom properties (L2, S3), the frames as nine-slice images (S2), the type scale with its phone sizes (S4) and the base
 *  components every screen of the play mode and the arena's HUD are built from. Installed only by those screens: the free-roaming town, its
 *  DEV panel and HUD, never load it. */

export const PIXEL = '"CdT Pixel"';
export const TEXT = '"CdT Text"';
/** the fonts' latin subset (the files hold no other glyph): any character outside it would fall back to a system font (S1: none); the
 *  text-size proof (tools/ui-text.mjs) checks every visible character against it */
export const LATIN_RANGE = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';

const FONTS = `
@font-face{font-family:${PIXEL};src:url(${pixelFont}) format('woff2');font-weight:400 700;font-display:block;unicode-range:${LATIN_RANGE}}
@font-face{font-family:${TEXT};src:url(${textFont400}) format('woff2');font-weight:400;font-display:block;unicode-range:${LATIN_RANGE}}
@font-face{font-family:${TEXT};src:url(${textFont700}) format('woff2');font-weight:700;font-display:block;unicode-range:${LATIN_RANGE}}`;

/** the base components (classes `ds-*`): a frame is a transparent border drawn by its nine-slice image at TEXEL_PX per texel */
const frameRule = (cls: string, kind: FrameKind, slice: number) =>
  `.${cls}{border:calc(${slice} * var(--ds-px)) solid transparent;border-image:var(--ds-f-${kind}) ${slice} fill / calc(${slice} * var(--ds-px)) stretch;image-rendering:pixelated}`;
const BASE = `
:root{--ds-px:${TEXEL_PX}px;--ds-text:${TEXT};--ds-pixel:${PIXEL};${sizes('desktop')}}
@media ${PHONE_QUERY}{:root{${sizes('phone')}}}
${frameRule('ds-panel', 'panel', 8)}
${frameRule('ds-parch', 'parch', 8)}
${frameRule('ds-btn', 'btn', 4)}
${frameRule('ds-tag', 'tag', 3)}
${frameRule('ds-key', 'key', 3)}
${frameRule('ds-gauge', 'gauge', 3)}
.ds-pixel{font-family:var(--ds-pixel);font-weight:400;letter-spacing:0;font-size:var(--ds-fs-pixel)}`;

function sizes(d: 'desktop' | 'phone'): string {
  const t = TYPE[d];
  return `--ds-fs-small:${t.small}px;--ds-fs-body:${t.body}px;--ds-fs-label:${t.label}px;--ds-fs-pixel:${t.pixel}px;--ds-fs-pixel-big:${t.pixelBig}px;--ds-fs-pixel-huge:${t.pixelHuge}px`;
}

const urls = new Map<string, string>();
/** a frame of a tone as a PNG data URL (painted once per tone) */
function frameUrl(kind: FrameKind, tone: Tone): string {
  const k = `${kind}|${tone.ink}|${tone.blue1}|${tone.gold}`;
  let u = urls.get(k);
  if (!u) {
    const f = paintFrame(kind, tone), c = document.createElement('canvas');
    c.width = f.w; c.height = f.h;
    c.getContext('2d')!.putImageData(new ImageData(f.rgba, f.w, f.h), 0, 0);
    u = c.toDataURL('image/png');
    urls.set(k, u);
  }
  return u;
}

function toneVars(tone: Tone): string {
  const v = Object.entries(tone).map(([k, c]) => `--ds-${k}:${c}`);
  for (const kind of FRAME_KINDS) v.push(`--ds-f-${kind}:url(${frameUrl(kind, tone)})`);
  return `:root{${v.join(';')}}`;
}

function styleTag(id: string): HTMLStyleElement {
  let st = document.getElementById(id) as HTMLStyleElement | null;
  if (!st) { st = document.createElement('style'); st.id = id; document.head.appendChild(st); }
  return st;
}

let tone: TimeOfDay | null = null, toned = false;
/** installs the fonts and the base components once, and the tone of the page's day state (null = the night); without an argument, the tone
 *  already set is kept (the night if none) */
export function installDesign(time?: TimeOfDay | null): void {
  if (!document.getElementById('ds-base')) styleTag('ds-base').textContent = FONTS + BASE;
  if (time === undefined && toned) return;
  tone = time ?? null; toned = true;
  styleTag('ds-tone').textContent = toneVars(toneOf(tone));
}

/** the page's tone (night when no screen set one) */
export function currentTone(): TimeOfDay { return tone ?? 'night'; }

/** resolves once both fonts are loaded (the pages wait for it before they say they are ready: a capture never shows a fallback) */
export function fontsReady(): Promise<void> {
  installDesign();
  return Promise.all([
    document.fonts.load(`20px ${PIXEL}`, 'A1'), document.fonts.load(`16px ${TEXT}`, 'Aa'), document.fonts.load(`700 16px ${TEXT}`, 'Aa'),
  ]).then(() => undefined);
}
