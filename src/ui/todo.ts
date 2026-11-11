import type { GameState } from '../simulation';
import { freshTodo, openedKey, seeTodo, todoHere, todoSeen, type Todo } from '../simulation/v2todo';
import { isV2 } from '../simulation/v2';
import { PEOPLE } from '../narrative/people';
import { RIVALS } from '../narrative/roster';
import { tx } from '../narrative/text';
import { bindCap } from '../input/caps';
import { PHONE_QUERY } from './design/tokens';
import { el, esc } from './style';
import { MARK_WORD, installMarkCss, markGlyph } from './npcMarks';

/** What there is to do here, shown while the player walks (the operator's request of 2026-11-11, journal Passe LA1; his LA1 sheet, journal Passe LA2: LA-1 « Le
 *  nombre toujours ; l’aperçu à l’arrivée et à chaque nouveauté, puis il s’efface », LA-2 « En bas à droite, au-dessus de la touche [Q] », LA-3 « La touche garde
 *  le combat, « · N de plus à faire » à côté ; pas d’aperçu », LA-4 « Le nombre et une ligne d’aperçu », LA-7 « L’aperçu part une fois la liste ouverte (ou après
 *  8 s) ; le nombre reste ; tout revient avec une nouveauté », LA-8 « Amender UM-R2 : la liste reste à la demande, un résumé s’ajoute à l’écran »). In the design
 *  system's manner (direction A « Voile »: no box on the scene, a veil rising from the corner, one accent): the list's key in the bottom right corner says how
 *  many things there are to do; above it, the first three, with the person's diamond (MK-3) and what a job pays, then « and N more in the list », on arriving
 *  and when something new comes up, the key in the accent meanwhile; gone once the list is opened or after 8 s. The day's bout keeps its key, the others counted
 *  beside it, no preview. A phone shows one line. What counts: src/simulation/v2todo.ts. A version 2 game's quay and squares; today's game and Explore never. */

const CSS = `
#pm-hints .pm-todo-n{font:400 var(--ds-fs-fig)/1 var(--ds-title);color:var(--ds-accent);margin-left:2px}
#pm-hints .pm-todo-w{color:var(--ds-muted);font-size:var(--ds-fs-small)}
#pm-hints .pm-btn.lit kbd{border-color:var(--ds-accent);color:var(--ds-accent)}
#pm-todo{right:0;bottom:0;z-index:28;max-width:min(620px,100vw);padding:56px 74px 92px 180px;text-align:right;background:radial-gradient(farthest-side at 100% 100%,var(--ds-veil-strong) 0,var(--ds-veil-strong) 58%,var(--ds-veil) 78%,transparent 100%);pointer-events:none;opacity:0;visibility:hidden;transition:opacity .3s,visibility 0s .3s}
#pm-todo.on{opacity:1;visibility:visible;transition:opacity .3s}
#pm-todo h3{margin:0 0 6px;font:600 var(--ds-fs-small)/1.3 var(--ds-text);letter-spacing:.06em;text-transform:uppercase;color:var(--ds-ivory)}
#pm-todo p{margin:4px 0;display:flex;gap:10px;justify-content:flex-end;align-items:baseline;font-size:var(--ds-fs-body);color:var(--ds-ivory);white-space:nowrap}
#pm-todo p .pm-mk{margin:0;align-self:center}
#pm-todo p .tag{color:var(--ds-muted);font-size:var(--ds-fs-small)}
#pm-todo p .tag.gain{color:var(--ds-accent)}
#pm-todo p .tick{display:inline-block;width:12px;height:1px;align-self:center;background:var(--ds-ivory)}
#pm-todo p.more{color:var(--ds-muted);font-size:var(--ds-fs-small)}
body.pm-talking #pm-todo,body.pm-full #pm-todo{visibility:hidden}
@media ${PHONE_QUERY}{
  #pm-todo{padding:44px 22px 60px 120px}
  #pm-todo p:nth-of-type(n+2):not(.more){display:none}
}
@media (max-height:480px) and (min-width:701px){#pm-hints{background:none}#pm-hints::before{content:'';position:absolute;inset:-18px -96px -10px;z-index:-1;pointer-events:none;background:radial-gradient(closest-side,var(--ds-veil-strong) 74%,transparent 100%)}}
@media (max-width:700px){#pm-todo{left:0;max-width:none;text-align:left;padding:30px 16px 60px;background:var(--ds-grad-b)}#pm-todo p{justify-content:flex-start}}
`;

/** how long the preview stays when nothing opens the list (LA-7) */
export const PREVIEW_MS = 8000;
/** the preview's lines (LA-1: the first three; a phone shows the first, LA-4) */
export const PREVIEW_LINES = 3;

function installTodoCss(): void {
  installMarkCss();
  if (!document.getElementById('pm-todo-css')) { const st = document.createElement('style'); st.id = 'pm-todo-css'; st.textContent = CSS; document.head.appendChild(st); }
}

/** the opponent of the day's bout */
function boutFoe(s: GameState): string {
  const m = s.tournament.matches.find((x) => x.day === s.day && !x.winner && (x.a === 'player' || x.b === 'player'));
  return m ? RIVALS[m.a === 'player' ? m.b : m.a]?.name ?? '' : '';
}

/** one line of the preview: its sign, its words, its tag */
export function todoLine(s: GameState, t: Todo): string {
  const tag = (txt: string, gain = false) => `<span class="tag${gain ? ' gain' : ''}">${esc(txt)}</span>`;
  if (t.kind === 'bout') return `<p><span>${esc(t.what === 'challenge' ? tx('v2.challenge.enter') : tx('ui.todo.bout', { name: boutFoe(s) }))}</span></p>`;
  if (t.who) {
    const k = t.kind as 'item' | 'event' | 'follow', p = PEOPLE[t.who];
    return `<p><span class="pm-mk" data-kind="${k}" role="img" aria-label="${esc(tx(MARK_WORD[k]))}">${markGlyph(k)}</span><span>${esc(tx('ui.todo.who', { name: p?.name ?? t.who, kind: tx(MARK_WORD[k]) }))}</span>${t.gain ? tag(tx('ui.gainN', { n: t.gain }), true) : ''}</p>`;
  }
  const words = t.what === 'train' ? tx('ui.todo.train') : t.what === 'drill' ? tx('ui.todo.drill') : tx('ui.todo.repair');
  return `<p><span class="tick" aria-hidden="true"></span><span>${esc(words)}</span>${t.slot ? tag(tx('ui.oneSlot')) : ''}</p>`;
}

/** the list's key: its words and how many things there are to do (LA-1); the day's bout keeps its words, the others beside it (LA-3) */
export function todoKey(label: string, list: readonly Todo[], bout: boolean): string {
  const n = list.length;
  if (bout) { const others = list.filter((t) => t.kind !== 'bout').length; return `${bindCap('list')}${label}${others ? `<span class="pm-todo-w">${esc(tx('ui.todo.more', { n: others }))}</span>` : ''}`; }
  return `${bindCap('list')}${label}${n ? `<span class="pm-todo-n">${n}</span><span class="pm-todo-w">${esc(tx('ui.todo.word'))}</span>` : ''}`;
}

/** the preview: the first three, then how many more the list holds */
export function todoPreview(s: GameState, list: readonly Todo[]): string {
  const shown = list.slice(0, PREVIEW_LINES), rest = list.length - shown.length;
  return `<h3>${esc(tx('ui.todo.title'))}</h3>${shown.map((t) => todoLine(s, t)).join('')}${rest > 0 ? `<p class="more">${esc(tx('ui.todo.rest', { n: rest }))}</p>` : ''}`;
}

/** The list's key and its preview on a version 2 page (the quay, a square): `render` each time the state changes, `arrive` once the page's welcome is done,
 *  `opened` when the list opens. */
export class TodoCue {
  private readonly box = el('div', 'pm');
  /** the keys the preview showed on this page */
  private readonly shown = new Set<string>();
  private ready = false;
  private timer = 0;
  private list: Todo[] = [];

  constructor(private readonly key: HTMLElement) {
    installTodoCss();
    this.box.id = 'pm-todo'; this.box.setAttribute('role', 'status'); this.box.setAttribute('aria-live', 'polite');
    document.body.appendChild(this.box);
  }

  /** the key's words; a new thing to do shows the preview once the page is ready (LA-7 « tout revient avec une nouveauté ») */
  render(s: GameState, label: string, bout: boolean): void {
    if (!isV2(s)) return;
    this.list = todoHere(s);
    this.key.innerHTML = todoKey(label, this.list, bout);
    if (bout) { this.hide(); return; }
    if (!this.ready) return;
    const fresh = freshTodo(this.list, new Set([...todoSeen(s), ...this.shown]));
    if (fresh.length) this.show(s); else if (!this.list.length) this.hide();
  }

  /** the page's welcome is done (the news read, a new game's tour): the preview on arriving, unless everything was seen in the list here at this moment already */
  arrive(s: GameState, bout: boolean): void {
    if (!isV2(s) || this.ready) return;
    this.ready = true;
    if (bout || !this.list.length) return;
    if (todoSeen(s).has(openedKey(s)) && !freshTodo(this.list, todoSeen(s)).length) { for (const t of this.list) this.shown.add(t.key); return; }
    this.show(s);
  }

  /** the list opens: what it holds is seen, kept with the game (outside its fingerprint); the preview leaves */
  opened(s: GameState): void {
    if (!isV2(s)) return;
    const list = todoHere(s);
    seeTodo(s, list);
    for (const t of list) this.shown.add(t.key);
    this.hide();
  }

  /** for the proofs: what the key and the preview say now */
  state(): { count: number; shown: boolean; lines: string[]; keys: string[] } {
    return { count: this.list.length, shown: this.box.classList.contains('on'), lines: [...this.box.querySelectorAll('p')].map((p) => p.textContent ?? ''), keys: this.list.map((t) => t.key) };
  }

  private show(s: GameState): void {
    for (const t of this.list) this.shown.add(t.key);
    this.box.innerHTML = todoPreview(s, this.list);
    this.box.classList.add('on'); this.key.classList.add('lit');
    clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.hide(), PREVIEW_MS);
  }

  private hide(): void {
    clearTimeout(this.timer);
    this.box.classList.remove('on'); this.key.classList.remove('lit');
  }
}
