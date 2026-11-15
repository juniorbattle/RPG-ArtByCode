import type { GameEvent, GameState } from '../simulation';

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

/** the lines a news card shows (the operator's GP-11 « Corriger la lecture et ajouter le chapitre », journal Passe GP2: « les signes jamais coupés »): every sign
 *  and every consequence (a threat announced, what a sabotage or a quest did), then the latest of the other lines up to `max` in all, in the log's order; `rest`, the
 *  lines left to the journal (J). Before it the card kept the last eight lines, and a sign could fall out after a bout's afternoon */
export const NEWS_MAX = 8;
export function newsLines<E extends Pick<GameEvent, 'kind'>>(news: readonly E[], max = NEWS_MAX): { lines: E[]; rest: number } {
  const keep = new Set(news.filter((e) => e.kind === 'sign' || e.kind === 'consequence'));
  for (let i = news.length - 1; i >= 0 && keep.size < max; i--) keep.add(news[i]);
  const lines = news.filter((e) => keep.has(e));
  return { lines, rest: news.length - lines.length };
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
