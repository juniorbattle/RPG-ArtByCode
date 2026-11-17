/** The reading zone of a page and what scrolls it (the operator's IA-02 « Une règle commune à toutes les zones qui défilent », journal Passe IA2; A-02, C-04 and
 *  B-04 of journal Passe IA1: the guide's long chapters, a bout's result and the detail of K could be read with the wheel only; the pad's right stick scrolled the
 *  list in place of the text). One rule for every page that overflows:
 *  - the zone is the TEXT the page lets the player read beyond its edge: the detail beside a list first, then the page's body, then whatever else scrolls (a
 *    list alone), the first that overflows;
 *  - Page ↓ and Page ↑ scroll it by most of its height, Home and End go to its ends, the right stick scrolls it by its tilt (`PadInput`), the wheel as ever;
 *  - a small line says how, while there is more below (`more`, drawn by `moreHint`). No DOM here but what a page hands in: the tests give fakes. */

/** what counts as a modal page: the title screen, a sheet on the full-screen veil, a band at the foot of the screen (a dialogue, the list, the news) */
export const MODALS = '#title-screen, .pm-overlay, .pm-talk';

export interface Box { scrollHeight: number; clientHeight: number }
export interface Scroller extends Box { scrollTop: number }

/** the zones a page offers to read, most wanted first */
export const ZONES = ['.pm-detail', '.pm-body', '.pm-scroll'] as const;

const over = (b: Box): boolean => b.scrollHeight > b.clientHeight + 1;

/** the page's reading zone: the first overflowing box of the most wanted kind */
export function readingZone<T extends Box>(root: { querySelectorAll(sel: string): Iterable<T> }): T | null {
  for (const sel of ZONES) { const b = [...root.querySelectorAll(sel)].find(over); if (b) return b; }
  return null;
}

/** the keys that scroll a zone, and where each takes it (null: not a scrolling key): a page by most of the height, the ends */
export const SCROLL_KEYS = ['PageDown', 'PageUp', 'Home', 'End'] as const;
export function pageTarget(z: Scroller, key: string): number | null {
  const page = Math.max(40, Math.round(z.clientHeight * 0.85)), max = Math.max(0, z.scrollHeight - z.clientHeight);
  switch (key) {
    case 'PageDown': return Math.min(max, z.scrollTop + page);
    case 'PageUp': return Math.max(0, z.scrollTop - page);
    case 'Home': return 0;
    case 'End': return max;
    default: return null;
  }
}

/** whether there is more below the zone's edge (the hint's moment) */
export const moreBelow = (z: Scroller): boolean => z.scrollHeight - z.clientHeight - z.scrollTop > 1;

/** a shown modal page, the topmost */
const shown = (e: Element): boolean => (e as HTMLElement).getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden';
export function topModal(): HTMLElement | null {
  const all = [...document.querySelectorAll<HTMLElement>(MODALS)].filter(shown);
  return all[all.length - 1] ?? null;
}

let installed = false;
/** the keyboard's rule, installed once for the document (by the first page that scrolls): the topmost modal page's reading zone answers Page ↓, Page ↑, Home and
 *  End; a field keeps Home and End as its own, and a key a page already took is left to it */
export function installPageKeys(): void {
  if (installed || typeof document === 'undefined') return;
  installed = true;
  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.ctrlKey || e.altKey || e.metaKey || e.shiftKey || !(SCROLL_KEYS as readonly string[]).includes(e.key)) return;
    const t = e.target as HTMLElement | null;
    if ((e.key === 'Home' || e.key === 'End') && t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
    const root = topModal(); if (!root) return;
    const zone = readingZone<HTMLElement>(root); if (!zone) return;
    const to = pageTarget(zone, e.key); if (to === null) return;
    e.preventDefault();
    zone.scrollTo({ top: to, behavior: 'auto' });
  });
}
