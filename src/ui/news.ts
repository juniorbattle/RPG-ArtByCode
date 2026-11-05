import type { GameState } from '../simulation';

/** What the player has been shown of the game's log, kept in the browser between pages (journal Passes L4, EVL1): a page that opens shows the
 *  news after it (the slot that ended, the night, the bouts), then counts them as shown. The quay has kept it since journal Passe L4; the version
 *  2's squares keep it too since journal Passe EVL1 (before, they started from the log's last entry, and the news of a slot ended on a square were
 *  lost). A version 2 page also counts as shown what an action that keeps the page shows at once (`keepSeen`), so a page opened later does not
 *  tell it again; the default game keeps its rule of journal Passe L4 (shown = what stood in the log when its page opened). */

export interface SeenStore { getItem(key: string): string | null; setItem(key: string, value: string): void }

const SEEN = 'cite-du-tournoi.seen';
const browserStore = (): SeenStore | null => { try { return localStorage; } catch { return null; } };

/** the last entry the player was shown, on a page that opens: what follows it is news; a page without storage shows the latest news */
export function seenBefore(st: GameState, store: SeenStore | null = browserStore()): number {
  let seen = -1;
  try { seen = Number(store?.getItem(SEEN) ?? -1); } catch { /* a page without storage shows the latest news */ }
  if (!(seen >= 0) || seen >= st.log.length) seen = Math.max(-1, st.log.length - 2);
  return seen;
}

/** everything in the log now counts as shown */
export function markSeen(st: GameState, store: SeenStore | null = browserStore()): void {
  try { store?.setItem(SEEN, String(st.log.length - 1)); } catch { /* a convenience only */ }
}

/** a version 2 page's actions: one that keeps the page has shown its news at once (the band, the bandeau, the page of the goods), so they count
 *  as shown; one that reloads (a slot that ends, a place left) leaves them to the page that opens */
export function keepSeen<R extends { ok: boolean; reload?: boolean }, A>(act: (a: A) => R, state: () => GameState, store: SeenStore | null = browserStore()): (a: A) => R {
  return (a) => { const r = act(a); if (r.ok && !r.reload) markSeen(state(), store); return r; };
}
