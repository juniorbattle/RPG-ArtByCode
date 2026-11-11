import type { GameState } from '../simulation';
import type { Todo } from '../simulation/v2todo';
import { PEOPLE } from '../narrative/people';
import { RIVALS } from '../narrative/roster';
import { tx } from '../narrative/text';
import { esc } from './style';
import { bindCap } from '../input/caps';
import { PHONE_QUERY } from './design/tokens';
import { MARK_WORD, installMarkCss, markGlyph } from './npcMarks';

/** What there is to do here, shown while the player walks (the operator's request of 2026-11-11, journal Passe LA1). DEV mock-ups for the decision sheet, in
 *  the design system's manner (direction A « Voile »: no box on the scene, a veil, one accent): `todo=count` the list's key says how many things there are
 *  to do; `todo=peek` the best two or three above it; `todo=new` the key lit with what is new; `todo=status` the count and the lines under the clock, top left.
 *  `:hold` keeps the lit state for a capture. What counts: src/simulation/v2todo.ts. */

export type TodoStyle = 'count' | 'peek' | 'new' | 'status';

const CSS = `
#pm-hints .pm-todo-n{font:400 var(--ds-fs-fig)/1 var(--ds-title);color:var(--ds-accent);margin-left:2px}
#pm-hints .pm-todo-w{color:var(--ds-muted);font-size:var(--ds-fs-small)}
#pm-hints .pm-btn.lit kbd{border-color:var(--ds-accent);color:var(--ds-accent)}
#pm-todo{right:0;bottom:0;z-index:28;max-width:min(620px,100vw);padding:56px 74px 92px 180px;text-align:right;background:radial-gradient(farthest-side at 100% 100%,var(--ds-veil-strong) 0,var(--ds-veil-strong) 40%,var(--ds-veil) 64%,transparent 100%);pointer-events:none}
#pm-todo h3{margin:0 0 6px;font:400 var(--ds-fs-small)/1.3 var(--ds-text);letter-spacing:.06em;text-transform:uppercase;color:var(--ds-muted)}
#pm-todo p{margin:4px 0;display:flex;gap:10px;justify-content:flex-end;align-items:baseline;font-size:var(--ds-fs-body);color:var(--ds-ivory);white-space:nowrap}
#pm-todo p .pm-mk{margin:0;align-self:center}
#pm-todo p .tag{color:var(--ds-muted);font-size:var(--ds-fs-small)}
#pm-todo p .tag.gain,#pm-todo p.bout{color:var(--ds-accent)}
#pm-todo p .tick{display:inline-block;width:12px;height:1px;align-self:center;background:var(--ds-ivory)}
#pm-todo p.more{color:var(--ds-muted);font-size:var(--ds-fs-small)}
#pm-todo.new{animation:ds-in .16s ease-out}
#pm-todo.new h3{color:var(--ds-accent)}
#pm-status .pm-todo-s{margin-top:12px;padding-top:10px;border-top:1px solid var(--ds-line);max-width:420px}
#pm-status .pm-todo-s .head{display:flex;gap:10px;align-items:baseline;font-size:var(--ds-fs-small);color:var(--ds-muted)}
#pm-status .pm-todo-s .head b{font:400 var(--ds-fs-fig)/1 var(--ds-title);color:var(--ds-accent)}
#pm-status .pm-todo-s p{margin:4px 0;display:flex;gap:10px;align-items:baseline;font-size:var(--ds-fs-small);color:var(--ds-ivory);white-space:nowrap}
#pm-status .pm-todo-s p .tag{color:var(--ds-muted)}
#pm-status .pm-todo-s p .tag.gain,#pm-status .pm-todo-s p.bout{color:var(--ds-accent)}
#pm-status .pm-todo-s p .pm-mk{margin:0;align-self:center}
#pm-status .pm-todo-s p .tick{display:inline-block;width:12px;height:1px;align-self:center;background:var(--ds-ivory)}
body.pm-talking #pm-todo,body.pm-full #pm-todo{visibility:hidden}
@media ${PHONE_QUERY}{
  #pm-todo{right:0;bottom:0;padding:44px 22px 60px 120px}
  #pm-todo p:nth-of-type(n+2):not(.more){display:none}
  #pm-status .pm-todo-s{margin-top:4px;padding-top:4px;border-top:0}
  #pm-status .pm-todo-s p{display:none}
}
@media (max-width:700px){#pm-todo{left:0;right:0;bottom:0;max-width:none;text-align:left;padding:30px 16px 60px;background:var(--ds-grad-b)}#pm-todo p{justify-content:flex-start}}
`;

export function installTodoCss(): void {
  installMarkCss();
  if (!document.getElementById('pm-todo-css')) { const st = document.createElement('style'); st.id = 'pm-todo-css'; st.textContent = CSS; document.head.appendChild(st); }
}

/** the DEV mock-up asked by the address (`todo=count|peek|new|status`, `:hold`), null without it or in a production build */
export function todoStyle(): { style: TodoStyle; hold: boolean } | null {
  if (!import.meta.env.DEV) return null;
  const v = new URLSearchParams(location.search).get('todo');
  const [style, hold] = (v ?? '').split(':');
  return style === 'count' || style === 'peek' || style === 'new' || style === 'status' ? { style, hold: hold === 'hold' } : null;
}

/** the opponent of the day's bout */
function boutFoe(s: GameState): string {
  const m = s.tournament.matches.find((x) => x.day === s.day && !x.winner && (x.a === 'player' || x.b === 'player'));
  return m ? RIVALS[m.a === 'player' ? m.b : m.a]?.name ?? '' : '';
}

/** one line of the list of things to do: its sign, its words, its tag */
export function todoLine(s: GameState, t: Todo): string {
  const tag = (txt: string, gain = false) => `<span class="tag${gain ? ' gain' : ''}">${esc(txt)}</span>`;
  if (t.kind === 'bout') return `<p class="bout"><span>${esc(t.what === 'challenge' ? tx('v2.challenge.enter') : tx('ui.todo.bout', { name: boutFoe(s) }))}</span></p>`;
  if (t.who) {
    const p = PEOPLE[t.who];
    return `<p><span class="pm-mk" data-kind="${t.kind}">${markGlyph(t.kind as 'item')}</span><span>${esc(tx('ui.todo.who', { name: p?.name ?? t.who, kind: tx(MARK_WORD[t.kind as 'item']) }))}</span>${t.gain ? tag(tx('ui.gainN', { n: t.gain }), true) : ''}</p>`;
  }
  const words = t.what === 'train' ? tx('ui.todo.train') : t.what === 'drill' ? tx('ui.todo.drill') : tx('ui.todo.repair');
  return `<p><span class="tick"></span><span>${esc(words)}</span>${t.slot ? tag(tx('ui.oneSlot')) : ''}</p>`;
}

/** the corner key's words: the list (or the bout) and how many things there are to do */
export function todoKey(label: string, n: number, bout: boolean): string {
  if (!n) return `${bindCap('list')}${label}`;
  if (bout) return `${bindCap('list')}${label}${n > 1 ? `<span class="pm-todo-w">${esc(tx('ui.todo.more', { n: n - 1 }))}</span>` : ''}`;
  return `${bindCap('list')}${label}<span class="pm-todo-n">${n}</span><span class="pm-todo-w">${esc(tx('ui.todo.word'))}</span>`;
}

/** the best two or three, above the corner key (`peek`, `new`) or under the clock (`status`) */
export function todoPeek(s: GameState, list: readonly Todo[], max: number, head: string): string {
  const shown = list.slice(0, max), rest = list.length - shown.length;
  return `<h3>${esc(head)}</h3>${shown.map((t) => todoLine(s, t)).join('')}${rest > 0 ? `<p class="more">${esc(tx('ui.todo.rest', { n: rest }))}</p>` : ''}`;
}
