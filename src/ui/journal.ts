import type { GameEvent, GameState } from '../simulation';
import { tx } from '../narrative/text';
import { arrowKeys, el, esc, fillFoot, footBtn, pickRow, scrollFade } from './style';

/** The journal (journal Passe UM11, the audit of Passe UM10; the structure of the gear's page, journal Passe UM9): the days on the left, what happened on the day
 *  selected on the right, moment by moment, the day's date said once. */

export interface JournalDay { day: number; slots: Array<{ slot: string; entries: GameEvent[] }>; size: number; bout: GameEvent | null }

/** what the player was told, by day, the last day first and each day in its order */
export function journalDays(s: GameState): JournalDay[] {
  const days = new Map<number, JournalDay>();
  for (const e of s.log) {
    if (!e.visible) continue;
    const d = days.get(e.day) ?? { day: e.day, slots: [], size: 0, bout: null };
    days.set(e.day, d);
    const last = d.slots[d.slots.length - 1], sl = last?.slot === e.slot ? last : { slot: e.slot, entries: [] };
    if (sl !== last) d.slots.push(sl);
    sl.entries.push(e); d.size++;
    if (e.kind === 'match' && (e.id === 'player-won' || e.id === 'player-lost')) d.bout = e;
  }
  return [...days.values()].sort((a, b) => b.day - a.day);
}

const sentence = (t: string): string => /^.*?[.!?](?=\s|$)/.exec(t)?.[0] ?? t;

export function journalPage(s: GameState, close: () => void): { root: HTMLElement; focus(): void } {
  const days = journalDays(s), root = el('div', 'pm pm-overlay'), card = el('div', 'pm-card pm-two pm-days');
  card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', tx('ui.journal'));
  card.innerHTML = `<section class="pm-col"><header class="pm-head"><h2 class="pm-h">${tx('ui.journal')}</h2></header><div class="pm-glist pm-grow"></div></section>`
    + `<section class="pm-col"><header class="pm-head"><h2 class="pm-h"></h2></header><div class="pm-detail pm-grow"></div><div class="pm-foot"></div></section>`;
  root.appendChild(card);
  const list = card.querySelector('.pm-glist') as HTMLElement, detail = card.querySelector('.pm-detail') as HTMLElement, title = card.querySelector('section:last-child .pm-h') as HTMLElement;
  const out = footBtn('Esc', tx('ui.close'), close), fit = scrollFade(detail);
  fillFoot(card.querySelector('.pm-foot') as HTMLElement, out);
  const entry = (e: GameEvent): string => `<p class="pm-entry">${esc(e.text)}${e.kind === 'consequence' || e.kind === 'sign' ? `<span class="why">${tx('ui.why', { cause: esc(e.cause) })}</span>` : ''}</p>`;
  const show = (d: JournalDay): void => {
    title.textContent = tx('ui.dayN', { day: d.day });
    detail.innerHTML = d.slots.map((x) => `<p class="pm-sub">${esc(x.slot[0].toUpperCase() + x.slot.slice(1))}</p>${x.entries.map(entry).join('')}`).join('');
    detail.scrollTop = 0; fit();
  };
  for (const d of days) list.appendChild(pickRow(`<span>${tx('ui.dayN', { day: d.day })}<span class="why">${esc(d.bout ? sentence(d.bout.text) : tx(d.size === 1 ? 'ui.journal.one' : 'ui.journal.many', { n: d.size }))}</span></span>`, { select: () => show(d), press: () => {} }));
  if (!days.length) detail.appendChild(el('p', 'pm-sub', tx('ui.journal.empty')));
  arrowKeys(list); scrollFade(list);
  return { root, focus: () => { (list.querySelector('.pm-btn') as HTMLElement | null ?? out).focus(); } };
}
