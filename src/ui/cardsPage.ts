import type { GameState } from '../simulation/state';
import type { Action } from '../simulation/actions';
import { cardId, cardLine, cardLive, cardTitle, pendingOffer, type V2Card, type V2CardOffer } from '../simulation/v2cards';
import { said, tx, type TextKey, type TextRef } from '../narrative/text';
import { el, esc, fillFoot, footBtn } from './style';

/** The winner's card on the page (the operator's CL-2, journal Passe CV1; src/simulation/v2cards.ts): after a bout won, the cards the game drew sit in a row of tiles on the
 *  result page, in the skills page's drawing (`sk-tile`); the arrows move between them (the pad's D-pad too), Enter or Space or a click takes one, the number keys the
 *  nth; « Decide later » (Esc) leaves them waiting in the list. With more than one pick the row is drawn again from what is left. Pure DOM, the game's `act` given. */

const KIND: Record<V2Card['k'], TextKey> = { stat: 'ui.card.kind.stat', skill: 'ui.card.kind.skill', purse: 'ui.card.kind.purse' };

/** one tile per live card of the offer (a title, what it does, its kind), `pick` called with the card's id */
export function cardRow(s: GameState, offer: V2CardOffer, pick: (id: string) => void): HTMLElement {
  const row = el('div', 'pm-glist sk-tiles pm-cardrow');
  row.setAttribute('role', 'group'); row.setAttribute('aria-label', tx('ui.card.title'));
  const live = offer.cards.filter((c) => cardLive(s, c));
  live.forEach((c, i) => {
    const b = el('button', 'sk-tile cd-tile', `<span class="st">${esc(tx(KIND[c.k]))}</span><b>${esc(cardTitle(s, c))}</b><small>${esc(cardLine(s, c))}</small>`);
    b.dataset.kind = c.k; b.dataset.card = cardId(c); b.dataset.n = String(i + 1);
    b.addEventListener('click', () => pick(cardId(c)));
    row.appendChild(b);
  });
  // the four arrows go along the row (a row is one line on a wide window, several on a narrow one: the nearest in the arrow's direction is the neighbour in the grid)
  row.addEventListener('keydown', (e) => {
    const tiles = [...row.querySelectorAll<HTMLButtonElement>('button')], at = tiles.indexOf(document.activeElement as HTMLButtonElement);
    if (!tiles.length) return;
    const n = /^[1-9]$/.test(e.key) ? +e.key - 1 : -1;
    if (n >= 0 && n < tiles.length) { e.preventDefault(); e.stopPropagation(); tiles[n].click(); return; }
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    e.preventDefault(); e.stopPropagation();
    tiles[((at < 0 ? (step > 0 ? -1 : 0) : at) + step + tiles.length) % tiles.length].focus();
  });
  return row;
}

type ActFn = (a: Action) => { ok: boolean; reason?: string; $reason?: TextRef; events?: Array<{ visible: boolean; text: string; $t?: TextRef }> };

/** the result page's cards (src/ui/playArena.ts): fills `slot` with the offer's row and takes the picks one after another through `act`; once the cards are taken the
 *  foot's way out (`later`, the overlay's own button: Esc, « Decide later ») gives way to « Back », which clicks it */
export function mountCards(opts: { slot: HTMLElement; foot: HTMLElement; later: HTMLButtonElement; state: () => GameState; act: ActFn; backLabel: string; onTaken?: () => void }): void {
  const { slot, foot, later, state, act } = opts;
  let left = true;
  later.addEventListener('click', () => { left = false; });
  const done = (): void => {
    if (!left) return;
    const back = footBtn('Enter', opts.backLabel, () => later.click(), true);
    fillFoot(foot, back); back.focus();
  };
  const draw = (said1: string[]): void => {
    const s = state(), offer = pendingOffer(s);
    slot.replaceChildren();
    const lines = said1.map((t) => el('p', 'pm-sub', esc(t)));
    if (!offer) { slot.append(...lines); opts.onTaken?.(); done(); return; }
    const title = el('p', 'pm-sub', esc(tx(offer.picks > 1 ? 'ui.card.chooseN' : 'ui.card.choose', offer.picks > 1 ? { n: offer.picks } : undefined)));
    const row = cardRow(s, offer, (id) => {
      const r = act({ type: 'takeCard', card: id });
      if (!r.ok) { draw([...said1, r.reason ? said(r.reason, r.$reason) : tx('ui.cannot')]); return; }
      draw([...said1, ...(r.events ?? []).filter((e) => e.visible).map((e) => said(e.text, e.$t))]);
    });
    slot.append(...lines, title, row);
    // the first tile has the keyboard; on a short window (a phone held sideways) the row is brought to the top of the page, the result's lines above it scrolled away
    const short = typeof matchMedia === 'function' && matchMedia('(max-height: 480px)').matches;
    (row.querySelector('button') as HTMLButtonElement | null)?.focus({ preventScroll: !short });
    if (short) slot.scrollIntoView({ block: 'start' });
  };
  draw([]);
}
