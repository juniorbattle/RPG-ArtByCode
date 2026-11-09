import type { GameState } from '../simulation';
import { tx, type TextKey } from '../narrative/text';
import { V2_DAY_KIND, V2_DAYS } from '../tournament/v2calendar';
import { arrowKeys, el, esc, fillFoot, footBtn, pickRow, scrollFade } from './style';

/** The guide of the game (the operator's request of 2026-11-09, journal Passe TU1): a short tour over the live town at the start of a new game, each
 *  step a band at the foot of the screen pointing at the real element (the clock, the figures, the list, the menu), and a guide in the menu (H), its
 *  chapters on the left and the chapter selected on the right, illustrated by the game itself: the live scene, the real interface, the tournament's
 *  days drawn from the state. Every word lives in the texts' table (`tut.*`). Direction A « Voile »: no box on the scene, one-pixel rules, the fades of
 *  the design system. */

export interface GuideHost {
  state(): GameState;
  /** the live scene as an image (the page renders a frame and reads its canvas), or null */
  snapshot?(): string | null;
}

const CSS = `
.tu-spot{position:fixed;z-index:39;pointer-events:none;border:1px solid var(--ds-accent);box-shadow:0 0 0 200vmax color-mix(in srgb,var(--ds-ink) 38%,transparent);transition:left .24s ease-out,top .24s ease-out,width .24s ease-out,height .24s ease-out,opacity .16s;animation:ds-fade .24s ease-out}
.tu-band .pm-card{display:block;max-width:1620px}
body.tu-on #pm-hints{z-index:41}
.tu-band .tu-step{margin:0 0 4px;font-size:var(--ds-fs-small);color:var(--ds-muted)}
.tu-band .pm-h{margin:0 0 6px}
.tu-band p{max-width:760px}
.tu-band .pm-foot{padding-top:14px}
.tu-fig{position:relative;margin:0 0 14px;aspect-ratio:16/9;max-height:36vh;overflow:hidden;border-top:1px solid var(--ds-line);border-bottom:1px solid var(--ds-line);background:var(--ds-veil-strong)}
.tu-fig img{display:block;width:100%;height:100%;object-fit:cover}
.tu-fig figcaption{position:absolute;left:0;right:0;bottom:0;padding:22px 12px 8px;font-size:var(--ds-fs-small);color:var(--ds-ivory);background:linear-gradient(to top,var(--ds-veil-strong) 0,transparent 100%)}
.tu-days{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:6px;margin:0 0 14px}
.tu-days div{padding:8px 0 6px;border-top:2px solid var(--ds-line);text-align:center}
.tu-days div.bout{border-top-color:var(--ds-ivory)}
.tu-days div.now{border-top-color:var(--ds-accent)}
.tu-days b{display:block;font:400 var(--ds-fs-fig)/1 var(--ds-title)}
.tu-days small{display:block;margin-top:4px;font-size:var(--ds-fs-small);color:var(--ds-muted);overflow-wrap:anywhere}
.tu-keys{display:grid;grid-template-columns:auto minmax(0,1fr);gap:6px 16px;align-items:baseline;margin:10px 0 0}
.tu-keys span{font-size:var(--ds-fs-body)}
.pm-col .pm-detail p.tu-lead{font-size:var(--ds-fs-label);line-height:1.3;margin:0 0 8px}
@media (max-width:700px){.tu-days{grid-template-columns:repeat(5,minmax(0,1fr))}.tu-fig{max-height:26vh}}
`;
function style(): void { if (!document.getElementById('tu-css')) { const s = el('style'); s.id = 'tu-css'; s.textContent = CSS; document.head.appendChild(s); } }

/** the day's kind, as the board says it */
const KIND: Record<string, TextKey> = { arrival: 'tut.kind.arrival', pool: 'tut.kind.pool', free: 'tut.kind.free', cut: 'tut.kind.cut', semis: 'tut.kind.semis', major: 'tut.kind.major', final: 'tut.kind.final' };

/** the ten days drawn from the game: each day's kind, the player's bouts, today */
function daysHtml(s: GameState): string {
  const bouts = new Set(s.tournament.matches.filter((m) => m.a === 'player' || m.b === 'player').map((m) => m.day));
  return `<div class="tu-days" aria-hidden="true">${Array.from({ length: V2_DAYS }, (_, i) => {
    const d = i + 1, k = V2_DAY_KIND[d];
    return `<div class="${d === s.day ? 'now' : bouts.has(d) || k === 'semis' || k === 'major' || k === 'final' ? 'bout' : ''}"><b>${d}</b><small>${tx(KIND[k])}</small></div>`;
  }).join('')}</div>`;
}

/** a chapter of the guide: its title and line in the list, its text, what illustrates it */
interface Chapter { id: string; title: TextKey; line: TextKey; body: TextKey; fig: 'scene' | 'days' | 'none'; keys?: Array<[string, TextKey]> }
export const CHAPTERS: Chapter[] = [
  { id: 'tournament', title: 'tut.ch.tournament.title', line: 'tut.ch.tournament.line', body: 'tut.ch.tournament.body', fig: 'days' },
  { id: 'time', title: 'tut.ch.time.title', line: 'tut.ch.time.line', body: 'tut.ch.time.body', fig: 'days' },
  { id: 'moving', title: 'tut.ch.moving.title', line: 'tut.ch.moving.line', body: 'tut.ch.moving.body', fig: 'scene', keys: [['E', 'tut.key.talk'], ['Q', 'tut.key.list'], ['Esc', 'tut.key.menu'], ['M', 'tut.key.map']] },
];

/** the guide's page: the chapters on the left, the chapter selected on the right (the journal's structure, journal Passe UM11) */
export function guidePage(host: GuideHost, close: () => void, first?: string): { root: HTMLElement; focus(): void } {
  style();
  const s = host.state(), root = el('div', 'pm pm-overlay'), card = el('div', 'pm-card pm-two pm-days');
  card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', tx('tut.guide'));
  card.innerHTML = `<section class="pm-col"><header class="pm-head"><h2 class="pm-h">${tx('tut.guide')}</h2><p>${tx('tut.guide.sub')}</p></header><div class="pm-glist pm-grow"></div></section>`
    + `<section class="pm-col"><header class="pm-head"><h2 class="pm-h"></h2></header><div class="pm-detail pm-grow"></div><div class="pm-foot"></div></section>`;
  root.appendChild(card);
  const list = card.querySelector('.pm-glist') as HTMLElement, detail = card.querySelector('.pm-detail') as HTMLElement, title = card.querySelector('section:last-child .pm-h') as HTMLElement;
  const out = footBtn('Esc', tx('ui.close'), close), fit = scrollFade(detail);
  fillFoot(card.querySelector('.pm-foot') as HTMLElement, out);
  let scene: string | null | undefined;
  const show = (c: Chapter): void => {
    title.textContent = tx(c.title);
    let fig = '';
    if (c.fig === 'days') fig = daysHtml(s);
    else if (c.fig === 'scene') { if (scene === undefined) scene = host.snapshot?.() ?? null; if (scene) fig = `<figure class="tu-fig"><img src="${scene}" alt=""><figcaption>${tx('tut.fig.here')}</figcaption></figure>`; }
    const body = tx(c.body).split('\n').map((p, i) => `<p${i === 0 ? ' class="tu-lead"' : ''}>${esc(p)}</p>`).join('');
    const keys = c.keys ? `<div class="tu-keys">${c.keys.map(([k, t]) => `<kbd>${k}</kbd><span>${tx(t)}</span>`).join('')}</div>` : '';
    detail.innerHTML = fig + body + keys;
    detail.scrollTop = 0; fit();
  };
  for (const c of CHAPTERS) list.appendChild(pickRow(`<span>${tx(c.title)}<span class="why">${tx(c.line)}</span></span>`, { select: () => show(c), press: () => {} }));
  arrowKeys(list); scrollFade(list);
  const start = Math.max(0, CHAPTERS.findIndex((c) => c.id === first));
  return { root, focus: () => { (list.querySelectorAll<HTMLElement>('.pm-btn')[start] ?? out).focus(); } };
}

/** a step of the tour: what it points at (an element of the page, or nothing), its words */
export interface TourStep { title: TextKey; body: TextKey; target?: () => Element | null }

/** the tour of a new game's first page (journal Passe TU1) */
export const TOUR: Array<{ title: TextKey; body: TextKey; at?: 'status' | 'figs' | 'list' | 'menu' }> = [
  { title: 'tut.tour.welcome.title', body: 'tut.tour.welcome.body' }, { title: 'tut.tour.clock.title', body: 'tut.tour.clock.body', at: 'status' },
  { title: 'tut.tour.figs.title', body: 'tut.tour.figs.body', at: 'figs' }, { title: 'tut.tour.list.title', body: 'tut.tour.list.body', at: 'list' },
  { title: 'tut.tour.menu.title', body: 'tut.tour.menu.body', at: 'menu' }, { title: 'tut.tour.end.title', body: 'tut.tour.end.body' },
];

/** the tour: one band per step at the foot of the screen, the element it speaks of lit by a one-pixel rule and the rest of the screen veiled; Enter (A)
 *  goes on, Esc (B) leaves the tour. Resolves with whether it was seen to its end. */
export function runTour(steps: TourStep[]): Promise<boolean> {
  style();
  const spot = el('div', 'pm tu-spot');
  spot.style.opacity = '0';
  document.body.appendChild(spot);
  return new Promise((done) => {
    let i = 0, band: HTMLElement | null = null;
    document.body.classList.add('tu-on');
    const finish = (seen: boolean): void => { document.body.classList.remove('tu-on'); band?.remove(); spot.remove(); window.removeEventListener('resize', place); done(seen); };
    const place = (): void => {
      const t = steps[i]?.target?.(), r = t?.getBoundingClientRect();
      if (!r || !r.width) { spot.style.opacity = '0'; return; }
      const pad = 8;
      Object.assign(spot.style, { left: `${r.left - pad}px`, top: `${r.top - pad}px`, width: `${r.width + 2 * pad}px`, height: `${r.height + 2 * pad}px`, opacity: '1' });
    };
    const show = (): void => {
      band?.remove();
      const st = steps[i], last = i === steps.length - 1;
      band = el('div', 'pm pm-overlay pm-band tu-band');
      const card = el('div', 'pm-card'), body = el('div', 'pm-body');
      card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', tx(st.title));
      body.innerHTML = `<p class="tu-step">${tx('tut.tour.step', { n: i + 1, of: steps.length })}</p><h2 class="pm-h">${tx(st.title)}</h2>${tx(st.body).split('\n').map((p) => `<p>${esc(p)}</p>`).join('')}`;
      const next = footBtn('Enter', last ? tx('tut.tour.end') : tx('tut.tour.next'), () => { if (last) finish(true); else { i++; show(); } }, true);
      const skip = last ? null : footBtn('Esc', tx('tut.tour.skip'), () => finish(false));
      const foot = el('div', 'pm-foot'); fillFoot(foot, next, skip);
      card.append(body, foot); band.appendChild(card);
      band.addEventListener('keydown', (e) => { if (e.key === 'Escape' && skip) { e.preventDefault(); e.stopPropagation(); skip.click(); } });
      document.body.appendChild(band);
      next.focus({ preventScroll: true });
      place();
    };
    window.addEventListener('resize', place);
    show();
  });
}
