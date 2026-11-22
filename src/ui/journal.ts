import type { GameEvent, GameState } from '../simulation';
import { cap, said, tx, word, type TextKey } from '../narrative/text';
import { isV2 } from '../simulation/v2';
import { PEOPLE } from '../narrative/people';
import { PLAYER_ID, RIVALS } from '../narrative/roster';
import { matchId } from '../tournament/pool';
import { arrowKeys, closeLabel, el, esc, fillFoot, footBtn, pickRow, scrollFade } from './style';
import { QUEST, QUEST_IDS, QUESTS, REWARD, TITLE, questDeadline, questStep, type QuestId } from '../simulation/v2quests';
import { placeName } from '../simulation/state';

/** the « In progress » page of a version 2 game's journal (the operator's GP-09 « Quatre quêtes de ville et une page « En cours » », journal Passe GP2): every quest
 *  taken, the open ones first, each with what to do now (where, with whom), its deadline and what it gives; then the ones done and failed, with what came of them */
export interface QuestEntry { id: QuestId; state: 'open' | 'done' | 'failed'; title: string; step: string | null; place: string | null; deadline: string | null; reward: string }
export function questEntries(s: GameState): QuestEntry[] {
  if (!isV2(s)) return [];
  const out: QuestEntry[] = [];
  for (const id of QUEST_IDS) {
    const st = s.quests[id];
    if (!st) continue;
    const step = questStep(s, id), state = st === 'done' ? 'done' : st === 'failed' ? 'failed' : 'open';
    out.push({ id, state, title: tx(TITLE[id]), step: step?.text ?? null, place: step ? placeName(step.place, true) : null, deadline: questDeadline(s, id), reward: tx(REWARD[id], { atk: QUEST.wyrmAtk, hp: QUEST.draughtHp, cap: QUEST.treatiseCap }) });
  }
  const rank = { open: 0, done: 1, failed: 2 } as const;
  return out.sort((a, b) => rank[a.state] - rank[b.state]);
}
function questsHtml(s: GameState): string {
  const list = questEntries(s);
  if (!list.length) return `<p class="pm-sub">${esc(tx('ui.quests.empty'))}</p>`;
  return list.map((q) => `<p class="pm-sub">${esc(q.title)} · ${esc(tx(q.state === 'open' ? 'ui.quests.open' : q.state === 'done' ? 'ui.quests.done' : 'ui.quests.failed'))}</p>`
    + (q.step ? `<p class="pm-entry">${esc(q.step)}${q.deadline ? `<span class="why">${esc(tx('ui.quests.deadline', { when: q.deadline }))}</span>` : ''}</p>` : '')
    + `<p class="pm-entry">${esc(q.state === 'failed' ? tx('ui.quests.lost', { reward: q.reward }) : tx('ui.quests.gives', { reward: q.reward }))}</p>`).join('');
}
export const questsOpen = (s: GameState): number => questEntries(s).filter((q) => q.state === 'open').length;

/** what the « In progress » row says under its name: how many quests are open and how many failed (the operator's IA-09 « Tout dire là où le joueur décide », journal Passe IA2;
 *  C-20 of journal Passe IA1: after a failure the row read « all settled » and the failure was said in a card only) */
export function questSummary(list: QuestEntry[]): string {
  if (!list.length) return tx('ui.quests.none');
  const open = list.filter((q) => q.state === 'open').length, lost = list.filter((q) => q.state === 'failed').length;
  return [open === 0 ? (lost ? '' : tx('ui.quests.settled')) : open === 1 ? tx('ui.quests.one') : tx('ui.quests.count', { n: open }), lost === 1 ? tx('ui.quests.lostOne') : lost > 1 ? tx('ui.quests.lostN', { n: lost }) : ''].filter(Boolean).join(' · ');
}
export { QUESTS };

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

/** an action's cause in words (journal Passe EVL1): the simulation writes `action:<type>` */
const ACTION_WHY: Record<string, TextKey> = { steal: 'v2.why.steal', checkGear: 'v2.why.checkGear', recruit: 'v2.why.recruit', repair: 'v2.why.repair', report: 'v2.why.report', confront: 'v2.why.confront', confrontVessa: 'v2.why.confrontVessa', reportRhosk: 'v2.why.reportRhosk' };

/** the cause written under a consequence or a sign: a sentence stays as the simulation wrote it; in a version 2 game a code (`action:steal`,
 *  `challenge:orla`, `match:r2:player-vessa`) is said in words, or not at all (UM-R3 « Tous les retirer »: no developer's text on screen;
 *  journal Passe EVL1); the default game keeps its line as it was (an action's code shows there: a gap recorded in journal Passe EVL1) */
export function whyOf(s: GameState, cause: string): string | null {
  if (!isV2(s) || /\s/.test(cause)) return cause;
  const i = cause.indexOf(':'), kind = i < 0 ? cause : cause.slice(0, i), rest = i < 0 ? '' : cause.slice(i + 1);
  if (kind === 'action') return tx(ACTION_WHY[rest] ?? 'v2.why.action');
  if (kind === 'challenge') { const p = PEOPLE[rest]; return p ? tx('v2.why.challenge', { name: p.name }) : null; }
  if (kind === 'match') {
    const m = s.tournament.matches.find((x) => matchId(x) === rest), opp = !m ? null : m.a === PLAYER_ID ? m.b : m.b === PLAYER_ID ? m.a : null;
    return opp && RIVALS[opp] ? tx('v2.why.bout', { name: RIVALS[opp].name }) : null;
  }
  return null;
}

export function journalPage(s: GameState, close: () => void): { root: HTMLElement; focus(): void } {
  const days = journalDays(s), root = el('div', 'pm pm-overlay'), card = el('div', 'pm-card pm-two pm-days');
  card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', tx('ui.journal'));
  card.innerHTML = `<section class="pm-col"><header class="pm-head"><h2 class="pm-h">${tx('ui.journal')}</h2></header><div class="pm-glist pm-grow"></div></section>`
    + `<section class="pm-col"><header class="pm-head"><h2 class="pm-h"></h2></header><div class="pm-detail pm-grow"></div><div class="pm-foot"></div></section>`;
  root.appendChild(card);
  const list = card.querySelector('.pm-glist') as HTMLElement, detail = card.querySelector('.pm-detail') as HTMLElement, title = card.querySelector('section:last-child .pm-h') as HTMLElement;
  const out = footBtn('Esc', closeLabel(), close), fit = scrollFade(detail);
  fillFoot(card.querySelector('.pm-foot') as HTMLElement, out);
  const entry = (e: GameEvent): string => {
    const why = e.kind === 'consequence' || e.kind === 'sign' ? whyOf(s, said(e.cause, e.$c)) : null;
    return `<p class="pm-entry">${esc(said(e.text, e.$t))}${why !== null ? `<span class="why">${tx('ui.why', { cause: esc(why) })}</span>` : ''}</p>`;
  };
  const show = (d: JournalDay): void => {
    title.textContent = tx('ui.dayN', { day: d.day });
    detail.innerHTML = d.slots.map((x) => `<p class="pm-sub">${esc(cap(word(x.slot)))}</p>${x.entries.map(entry).join('')}`).join('');
    detail.scrollTop = 0; fit();
  };
  // a version 2 game: the quests in progress first (GP-09), opened first while one is open
  const quests = isV2(s) ? questEntries(s) : [], open = quests.filter((q) => q.state === 'open').length;
  const showQuests = (): void => { title.textContent = tx('ui.quests.title'); detail.innerHTML = questsHtml(s); detail.scrollTop = 0; fit(); };
  // the row says a failure too (the operator's IA-09 « Tout dire là où le joueur décide », journal Passe IA2; C-20 of journal Passe IA1: after a failure it read « all settled »)
  const qSub = questSummary(quests);
  const qRow = isV2(s) ? list.appendChild(pickRow(`<span>${tx('ui.quests.title')}<span class="why">${esc(qSub)}</span></span>`, { select: showQuests, press: () => {} })) : null;
  if (qRow) qRow.dataset.quests = '1';
  for (const d of days) list.appendChild(pickRow(`<span>${tx('ui.dayN', { day: d.day })}<span class="why">${esc(d.bout ? sentence(said(d.bout.text, d.bout.$t)) : tx(d.size === 1 ? 'ui.journal.one' : 'ui.journal.many', { n: d.size }))}</span></span>`, { select: () => show(d), press: () => {} }));
  if (qRow && open) { qRow.classList.add('on'); showQuests(); }
  if (!days.length && !qRow) detail.appendChild(el('p', 'pm-sub', tx('ui.journal.empty')));
  arrowKeys(list); scrollFade(list);
  // the « In progress » page first while a quest is open (Q-07), else the last day
  return { root, focus: () => { ((qRow && open ? qRow : list.querySelector('.pm-btn:not([data-quests])') ?? qRow) as HTMLElement | null ?? out).focus(); } };
}
