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

/** Space reads on (the operator's IA-02, « et Espace là où il ne fait rien d'autre », which journal Passe IA3 could not place: on a page with a list or a detail the keyboard is on a
 *  control that Space presses). Where it does nothing else is a card the keyboard has gone through to its foot (the news, a result, the end of the tournament): the focused
 *  button is the page's one action, which Enter presses as well, so Space reads the next page of the text while there is more below and presses the button once the text is read.
 *  Never on a page whose foot offers Space, never on a control inside the text or in a list, never typed, never from a pad's synthetic press. */
export function spaceReads(s: { trusted: boolean; field: boolean; footHasSpace: boolean; onFootButton: boolean; textZone: boolean; more: boolean }): boolean {
  return s.trusted && !s.field && !s.footHasSpace && s.onFootButton && s.textZone && s.more;
}

let installed = false;
/** the keyboard's rule, installed once for the document (by the first page that scrolls): the topmost modal page's reading zone answers Page ↓, Page ↑, Home and
 *  End; a field keeps Home and End as its own, and a key a page already took is left to it; Space (Shift + Space back) where it does nothing else (`spaceReads`) */
export function installPageKeys(): void {
  if (installed || typeof document === 'undefined') return;
  installed = true;
  let spaceTaken = false;
  // the press that read a page never presses the button on its release (Firefox clicks a button on the key's release)
  document.addEventListener('keyup', (e) => { if (e.key === ' ' && spaceTaken) { spaceTaken = false; e.preventDefault(); } }, true);
  document.addEventListener('keydown', (e) => {
    if (e.key === ' ' && !e.defaultPrevented && !e.ctrlKey && !e.altKey && !e.metaKey) {
      const t = e.target as HTMLElement | null, root = topModal();
      const zone = root ? readingZone<HTMLElement>(root) : null;
      if (root && zone && t && !e.repeat && spaceReads({
        trusted: e.isTrusted, field: ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || t.isContentEditable,
        footHasSpace: !!root.querySelector('.pm-foot kbd[data-key="Space"]'),
        onFootButton: !!t.closest('.pm-foot') && root.contains(t) && t.tagName === 'BUTTON',
        textZone: zone.matches('.pm-detail, .pm-body') && !zone.querySelector(':scope > .pm-btn'),
        more: moreBelow(zone) || (e.shiftKey && zone.scrollTop > 1),
      })) {
        const to = pageTarget(zone, e.shiftKey ? 'PageUp' : 'PageDown');
        if (to !== null) { e.preventDefault(); spaceTaken = true; zone.scrollTo({ top: to, behavior: 'auto' }); }
        return;
      }
    }
  }, true);
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
