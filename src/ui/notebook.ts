import { RIVALS } from '../narrative/roster';
import { GENERICS } from '../narrative/generics';
import { num, tx, word } from '../narrative/text';
import type { GameState } from '../simulation';
import type { Advice, BoutNote, NoteSum } from '../combat/autoNotes';
import { anySkillName, nextBoutOf, scoutLines, scoutTier, tierWord } from '../simulation/v2scout';
import { rehearsalFresh, rehearsalOf, type Rehearsal } from '../simulation/v2prep';
import { notesOf } from '../simulation/v2notes';
import { arrowKeys, el, esc, fillFoot, footBtn, pickRow, scrollFade } from './style';
import { portraitUrl } from './portraits';

/** Master Corvin's notebook (lot 3 of « La Brute », the operator's PB-4 « Toutes », briefs/combat-auto.md § 33.5; the board's structure, src/ui/board.ts): on the left
 *  the rivals, the next opponent first, each with what the player knows of them (the scouting's tier, src/simulation/v2scout.ts); on the right the one selected:
 *  what is known of their style, their plan and their kit, the last rehearsal against their shadow and the two bouts to watch again (Enter a win, Space a loss), and
 *  Master Corvin's notes on the bouts and challenges against them (src/combat/autoNotes.ts), each with his advice. Opened from the menu and from Master Corvin. */

/** a fighter's name, a rival's or a generic fighter's */
export const fighterName = (id: string): string => RIVALS[id]?.name ?? (GENERICS[id] ? word(GENERICS[id].name) : id);

/** an advice in words */
export function adviceText(a: Advice, foe: string): string {
  const name = fighterName(foe), skill = a.skill ? anySkillName(a.skill) : '', foeSkill = a.foeSkill ? anySkillName(a.foeSkill) : '';
  switch (a.k) {
    case 'feint': return foeSkill ? tx('advice.feint', { skill, foe: name, foeSkill, n: a.n ?? 0, of: a.of ?? 0 }) : tx('advice.feintAny', { skill, n: a.n ?? 0, of: a.of ?? 0 });
    case 'exploit': return tx('advice.exploit', { skill, n: a.n ?? 0, of: a.of ?? 0 });
    case 'dodged': return tx('advice.dodged', { foe: name, n: a.n ?? 0 });
    case 'foeSkill': return tx('advice.foeSkill', { foe: name, foeSkill, pct: a.pct ?? 0 });
    case 'unspent': return tx('advice.unspent', { skill, n: a.n ?? 0 });
    case 'noOpen': return tx('advice.noOpen');
    case 'keep': return tx('advice.keep', { foe: name });
    default: return tx('advice.rehearse', { foe: name });
  }
}

/** shares of a total, in whole per cents */
const shares = (xs: readonly number[]): number[] => { const t = xs.reduce((a, b) => a + b, 0); return xs.map((x) => (t > 0 ? Math.round((100 * x) / t) : 0)); };
/** a length in minutes and seconds */
const timeOf = (t: number): string => { const s = Math.round(t); return tx('note.time', { m: Math.floor(s / 60), s: String(s % 60).padStart(2, '0') }); };

/** a note's lines: the result and its length, Ren's damage by source, the openings, the uses, the advice */
export function noteLines(n: BoutNote): string[] {
  const name = fighterName(n.foe), [a, b, c] = shares(n.dmg), total = n.dmg[0] + n.dmg[1] + n.dmg[2];
  const used = n.skills.reduce((x, s) => x + s.used, 0), max = n.skills.reduce((x, s) => x + s.max, 0), wasted = n.skills.reduce((x, s) => x + s.void, 0);
  return [
    tx(n.kind === 'challenge' ? 'note.head.challenge' : 'note.head.bout', { day: n.day, result: tx(n.won ? 'note.won' : 'note.lost'), time: timeOf(n.t) }),
    tx('note.dmg', { a, b, c }),
    tx('note.open', { x: n.open[0], y: n.open[1], name, p: total > 0 ? Math.round((100 * n.inOpen) / total) : 0 }),
    wasted ? tx('note.usesVoid', { used, max, n: wasted }) : tx('note.uses', { used, max }),
    tx('note.advice', { advice: adviceText(n.advice, n.foe) }),
  ];
}

/** a rehearsal's lines: when, its chances and how the shadow played, the damage and openings on average, the advice seen most often */
export function rehearsalLines(r: Rehearsal, sum: NoteSum = r.sum): string[] {
  const [a, b, c] = shares(sum.dmg);
  return [
    tx('nb.rehearsal.line', { day: r.day, slot: word(r.slot), wins: r.wins, n: r.n, how: tx(r.tier >= 2 ? 'nb.rehearsal.byPlan' : 'nb.rehearsal.byStyle') }),
    tx('nb.rehearsal.dmg', { a, b, c, x: num(+sum.open[0].toFixed(1)), y: num(+sum.open[1].toFixed(1)) }),
    tx('nb.rehearsal.advice', { n: sum.often, of: sum.n, advice: adviceText(sum.advice, r.foe) }),
  ];
}

/** the fighters of the notebook: the rivals (the next opponent first), then the generic fighters met in a challenge */
function fightersOf(st: GameState): string[] {
  const next = nextBoutOf(st)?.foe, rivals = Object.keys(RIVALS).filter((id) => !!st.competitors[id]);
  const met = [...new Set((st.v2?.$notes ?? []).map((n) => n.foe))].filter((id) => !RIVALS[id] && GENERICS[id]);
  return [...(next && rivals.includes(next) ? [next] : []), ...rivals.filter((id) => id !== next), ...met];
}

/** what the page shows of a fighter: its head and its body, and the rehearsal's bouts that can be watched again */
function fighterHtml(st: GameState, id: string): { head: string; body: string; watch: { win: boolean; loss: boolean } } {
  const name = fighterName(id), url = portraitUrl(id), next = nextBoutOf(st)?.foe === id, r = rehearsalOf(st, id), fresh = !!r && rehearsalFresh(st, r);
  const sub = [RIVALS[id]?.epithet ?? (GENERICS[id] ? word(GENERICS[id].epithet) : ''), next ? tx('nb.next') : ''].filter(Boolean).join(' · ');
  const known = `<p class="pm-sub">${tx('nb.known')}</p>${scoutLines(st, id).map((l) => `<p>${esc(l)}</p>`).join('')}`;
  const reh = next || r ? `<p class="pm-sub">${tx('nb.rehearsal')}</p>${r ? rehearsalLines(r).map((l) => `<p class="pm-entry">${esc(l)}</p>`).join('') + (fresh ? '' : `<p class="pm-entry">${esc(tx('nb.stale'))}</p>`) : `<p>${esc(tx('nb.noRehearsal'))}</p>`}` : '';
  const notes = notesOf(st, id);
  const book = `<p class="pm-sub">${tx('nb.notes')}</p>${notes.length ? notes.map((n) => `<div class="pm-entry">${noteLines(n).map((l) => `<p>${esc(l)}</p>`).join('')}</div>`).join('') : `<p>${esc(tx('nb.noNotes'))}</p>`}`;
  return {
    head: `<div class="pm-who">${url ? `<img src="${url}" alt="">` : ''}<h2 class="pm-h">${esc(name)}<small>${esc(sub)}</small></h2></div>`,
    body: known + reh + book,
    watch: { win: next && !!r && r.seeds.win !== undefined, loss: next && !!r && r.seeds.loss !== undefined },
  };
}

export function notebookPage(st: GameState, close: () => void, watch: (which: 'win' | 'loss') => void, first?: string): { root: HTMLElement; focus(): void } {
  const root = el('div', 'pm pm-overlay pm-notebook'), card = el('div', 'pm-card pm-two');
  card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', tx('nb.title'));
  card.innerHTML = `<section class="pm-col"><header class="pm-head"><h2 class="pm-h">${tx('nb.title')}</h2><p>${esc(tx('nb.sub'))}</p></header><div class="pm-glist pm-grow"></div></section>`
    + `<section class="pm-col"><div class="pm-who-at"></div><div class="pm-detail pm-grow"></div><div class="pm-foot"></div></section>`;
  root.appendChild(card);
  const list = card.querySelector('.pm-glist') as HTMLElement, who = card.querySelector('.pm-who-at') as HTMLElement, detail = card.querySelector('.pm-detail') as HTMLElement, foot = card.querySelector('.pm-foot') as HTMLElement;
  const out = footBtn('Esc', tx('ui.close'), close), fit = scrollFade(detail);
  const win = footBtn('Enter', tx('nb.watchWin'), () => watch('win'), true), loss = footBtn('Space', tx('nb.watchLoss'), () => watch('loss'));
  let can = { win: false, loss: false };
  const show = (id: string): void => {
    const f = fighterHtml(st, id); who.innerHTML = f.head; detail.innerHTML = f.body; detail.scrollTop = 0; fit(); can = f.watch;
    fillFoot(foot, can.win ? win : null, can.loss ? loss : null, out);
  };
  const ids = fightersOf(st), next = nextBoutOf(st)?.foe;
  let start: HTMLElement | null = null;
  for (const id of ids) {
    const tier = RIVALS[id] ? `<span class="cost">${esc(tierWord(scoutTier(st, id)))}</span>` : '';
    const b = pickRow(`<span>${esc(fighterName(id))}${id === next ? `<span class="me">${tx('nb.next')}</span>` : ''}</span>${tier}`, { select: () => show(id), press: () => {} });
    list.appendChild(b);
    if (id === (first ?? next) || (!start && !first && !next)) start = b;
  }
  fillFoot(foot, out);
  // Enter watches a win, Space a loss (the pad's A and X press them); a button of the foot keeps its own key
  root.addEventListener('keydown', (e) => {
    if (e.repeat || (e.target instanceof HTMLElement && foot.contains(e.target))) return;
    if (e.key === ' ' || e.key === 'Enter') e.preventDefault();
    if (e.key === ' ' && can.loss) watch('loss');
    else if (e.key === 'Enter' && can.win) watch('win');
  });
  arrowKeys(list); scrollFade(list);
  return { root, focus: () => { (start ?? list.querySelector('.pm-btn') as HTMLElement | null ?? out).focus(); } };
}
