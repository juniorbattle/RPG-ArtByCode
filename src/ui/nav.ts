/** The arrows of a page of tiles, one rule for the gear page and the skills page (the operator's IA-06 « K comme G (flèches, réordonner à part, une ligne pour le mode) »,
 *  journal Passe IA2; B-02 and B-03 of journal Passe IA1: in the skills page only ↑ ↓ moved the keyboard, twelve presses from the first place to the first free tile, where
 *  the gear page takes one, and the pad's ← → moved a skill instead of the focus). The four arrows go to the control NEAREST in their direction over the whole page:
 *  from a place to the tiles under it and back, along the grid of tiles, up to the filters, along a row of places. The scoring is pure (boxes in, a control out: the
 *  tests give boxes), the page's half only reads the layout and moves the focus. */

export interface Rect { left: number; right: number; top: number; bottom: number }
export interface Cand<T> { el: T; r: Rect; col?: unknown }
export type ArrowKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';
export const ARROWS: readonly string[] = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

/** the control nearest to `cur` in the arrow's direction: first among those that share its row or column (their boxes overlap across the direction), then, for up and down
 *  only, among the others of its own column of the page; null when none lies that way */
export function pickNeighbour<T>(cur: Cand<T>, all: ReadonlyArray<Cand<T>>, key: string): T | null {
  const r = cur.r, w = r.right - r.left, h = r.bottom - r.top, cx = r.left + w / 2, cy = r.top + h / 2;
  const vert = key === 'ArrowUp' || key === 'ArrowDown', sign = key === 'ArrowDown' || key === 'ArrowRight' ? 1 : -1;
  let best: T | null = null, bs = Infinity;
  for (const pass of [0, 1]) {
    for (const x of all) {
      if (x.el === cur.el) continue;
      const q = x.r, dx = q.left + (q.right - q.left) / 2 - cx, dy = q.top + (q.bottom - q.top) / 2 - cy, along = vert ? dy * sign : dx * sign, across = vert ? dx : dy;
      if (along < (vert ? h : w) / 3) continue;
      const overlap = vert ? q.right > r.left - 4 && q.left < r.right + 4 : q.bottom > r.top - 4 && q.top < r.bottom + 4;
      if (pass === 0 && !overlap) continue;
      if (pass === 1 && vert && x.col !== cur.col) continue;
      const score = Math.abs(along) + 0.6 * Math.abs(across);
      if (score < bs) { bs = score; best = x.el; }
    }
    if (best) break;
  }
  return best;
}

/** at the end of a row of tiles, Right goes on to the next row's first tile and Left back to the last of the row before (reading order); null elsewhere */
export function wrapTile<T>(tiles: readonly T[], cur: T, key: string): T | null {
  if (key !== 'ArrowLeft' && key !== 'ArrowRight') return null;
  const j = tiles.indexOf(cur) + (key === 'ArrowRight' ? 1 : -1);
  return j >= 0 && j < tiles.length ? tiles[j] : null;
}

/** the page's half: the arrow moves the focus among `items` (default: every shown `[data-fk]` of the card); the control with the keyboard is the one `[data-fk]` holds;
 *  `col` names a control's column of the page, `rows` the selector of the grids whose rows read on (a row's end goes to the next); true when the focus moved */
export function arrowFocus(card: HTMLElement, key: string, o: { items?: () => HTMLElement[]; col?: (x: HTMLElement) => unknown; rows?: string } = {}): boolean {
  const all = (o.items ? o.items() : [...card.querySelectorAll<HTMLElement>('[data-fk]')]).filter((x) => x.offsetParent !== null);
  const fk = (document.activeElement as HTMLElement | null)?.closest<HTMLElement>('[data-fk]')?.dataset.fk ?? '';
  const cur = all.find((x) => x.dataset.fk === fk);
  if (!cur) { all[0]?.focus(); return !!all.length; }
  const cand = (x: HTMLElement): Cand<HTMLElement> => { const q = x.getBoundingClientRect(); return { el: x, r: { left: q.left, right: q.right, top: q.top, bottom: q.bottom }, col: o.col?.(x) }; };
  const to = pickNeighbour(cand(cur), all.map(cand), key) ?? (o.rows && cur.closest(o.rows) ? wrapTile(all.filter((x) => x.closest(o.rows!)), cur, key) : null);
  if (to) { to.focus(); return true; }
  return false;
}
