import titleFont from '../fonts/Marcellus-latin.woff2?url';
import textFont from '../fonts/SourceSans3-latin.woff2?url';
import type { TimeOfDay } from '../../atmosphere/DayState';
import { PHONE_QUERY, TYPE, VEIL, toneOf } from './tokens';

/** The interface's design system in the page (journal Passes UI3 / UM1, direction A « Voile »): the two embedded fonts (UM-S1, `src/ui/fonts/FONTS.md`),
 *  the tone of the page's day state as CSS custom properties (UM-L2, UM-S3), the veils (gradients rising from the edge of the screen: UM-S2 took
 *  the frames away), the type scale with its phone sizes (UM-S4) and the keycaps. The loading screen installs it on every page (journal Passe
 *  UI4); the free-roaming town's HUD uses it too (UM-R5, journal Passe UM6), its DEV panel stays a tool of its own. */

export const TITLE = '"CdT Title"';
export const TEXT = '"CdT Text"';
/** the fonts' latin subset (the files hold no other glyph): any character outside it would fall back to a system font (S1: none); the
 *  text-size proof (tools/ui-text.mjs) checks every visible character against it */
export const LATIN_RANGE = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';

/** UM2-3 « Chiffres en Source Sans 3 » (journal Passe UM3): a digit set in the title font is the text font's (Marcellus' « 10 » reads « IO ») */
export const DIGITS = 'U+0030-0039';

const FONTS = `
@font-face{font-family:${TITLE};src:url(${titleFont}) format('woff2');font-weight:400;font-display:block;unicode-range:${LATIN_RANGE}}
@font-face{font-family:${TEXT};src:url(${textFont}) format('woff2');font-weight:200 900;font-display:block;unicode-range:${LATIN_RANGE}}
@font-face{font-family:${TITLE};src:url(${textFont}) format('woff2');font-weight:400;font-display:block;unicode-range:${DIGITS}}`;

const veil = (pc: number) => `color-mix(in srgb,var(--ds-ink) ${pc}%,transparent)`;

/** the veils as custom properties: `--ds-veil-*` a flat ink, `--ds-grad-b` / `-t` a band rising from the bottom / falling from the top of the
 *  screen, `--ds-grad-spot` the pool under one short text; the keycap in outline */
const BASE = `
:root{--ds-text:${TEXT};--ds-title:${TITLE};${sizes('desktop')};
--ds-veil-strong:${veil(VEIL.strong)};--ds-veil:${veil(VEIL.mid)};--ds-veil-soft:${veil(VEIL.soft)};
--ds-grad-b:linear-gradient(to top,var(--ds-veil-strong) 0,var(--ds-veil) 66%,transparent 100%);
--ds-grad-t:linear-gradient(to bottom,var(--ds-veil) 55%,transparent 100%);
--ds-grad-spot:radial-gradient(closest-side,var(--ds-veil-strong) 68%,transparent 100%);
--ds-gutter:clamp(16px,7.8vw,150px)}
@media ${PHONE_QUERY}{:root{${sizes('phone')}}}
@keyframes ds-in{from{opacity:0;transform:translateY(8px)}}
@keyframes ds-fade{from{opacity:0}}
@keyframes ds-rise{from{opacity:0;transform:translateY(32px)}}
@keyframes ds-rule{from{transform:scaleX(0)}}
.pm kbd,#arena-hud kbd,#ex-prompt kbd{flex:none;display:inline-block;box-sizing:border-box;min-width:30px;padding:0 8px;font:600 var(--ds-fs-small)/26px var(--ds-text);text-align:center;color:inherit;background:none;border:1px solid var(--ds-muted);border-radius:3px}`;

function sizes(d: 'desktop' | 'phone'): string {
  const t = TYPE[d];
  return `--ds-fs-small:${t.small}px;--ds-fs-body:${t.body}px;--ds-fs-label:${t.label}px;--ds-fs-line:${t.line}px;--ds-fs-fig:${t.fig}px;--ds-fs-title:${t.title}px;--ds-fs-title-big:${t.titleBig}px;--ds-fs-title-huge:${t.titleHuge}px;--ds-fs-display:${t.display}px`;
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
  styleTag('ds-tone').textContent = `:root{${Object.entries(toneOf(tone)).map(([k, c]) => `--ds-${k}:${c}`).join(';')}}`;
}

/** the page's tone (night when no screen set one) */
export function currentTone(): TimeOfDay { return tone ?? 'night'; }

/** resolves once both fonts are loaded (the pages wait for it before they say they are ready: a capture never shows a fallback) */
export function fontsReady(): Promise<void> {
  installDesign();
  return Promise.all([
    document.fonts.load(`32px ${TITLE}`, 'A1'), document.fonts.load(`16px ${TEXT}`, 'Aa'), document.fonts.load(`700 16px ${TEXT}`, 'Aa'),
  ]).then(() => undefined);
}
