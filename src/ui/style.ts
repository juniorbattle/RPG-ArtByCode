import { installDesign } from './design/system';
import { PHONE_QUERY } from './design/tokens';

/** The play mode's interface style, built from the design system (journal Passes UI3 / UM1, direction A « Voile »): the tone's colours (`--ds-*`,
 *  src/ui/design/tokens.ts), sheets of ink without a frame, one-pixel rules between the rows, square corners, keys in outline, no drop shadow;
 *  the embedded title font for titles, names and numbers and the embedded text font for sentences, no text under 16 px on a computer or 14 px on
 *  a phone. DOM over the canvas, keyboard reachable. On a phone (L3) a modal sheet stands at the bottom of the screen. */

const CSS = `
.pm{position:fixed;z-index:30;color:var(--ds-ivory);font:400 var(--ds-fs-body)/1.35 var(--ds-text);font-variant-numeric:tabular-nums}
.pm,.pm *{box-sizing:border-box;scrollbar-color:var(--ds-muted) transparent;scrollbar-width:thin}
.pm-h{margin:0 0 8px;font:400 var(--ds-fs-title)/1.1 var(--ds-title);color:var(--ds-ivory)}
.pm-sub{font-size:var(--ds-fs-small);color:var(--ds-muted)}
.pm-num{font:400 var(--ds-fs-label)/1 var(--ds-title);color:var(--ds-ivory)}
.pm-btn{display:flex;align-items:baseline;gap:12px;width:100%;margin:0;padding:9px 0;text-align:left;font:inherit;font-size:var(--ds-fs-label);line-height:1.25;color:var(--ds-ivory);background:none;border:0;border-top:1px solid var(--ds-line);border-radius:0;outline:0;cursor:pointer}
.pm-btn:hover:not(:disabled),.pm-btn:focus{color:var(--ds-accent)}
.pm-btn:disabled{cursor:default;color:var(--ds-muted)}
.pm-btn .why{display:block;font-size:var(--ds-fs-small);color:var(--ds-muted)}
.pm-btn .cost{margin-left:auto;flex:none;font-size:var(--ds-fs-body);white-space:nowrap;color:var(--ds-muted)}
.pm-btn:hover:not(:disabled) .cost,.pm-btn:focus .cost,.pm-btn.primary .cost{color:var(--ds-accent)}
.pm-btn.primary{color:var(--ds-accent)}
.pm-btn:hover:not(:disabled) kbd,.pm-btn:focus kbd,.pm-btn.primary kbd{border-color:var(--ds-accent)}
.pm input:focus-visible{outline:1px solid var(--ds-accent);outline-offset:1px}
.pm-line{margin:8px 0 0;font-size:var(--ds-fs-line);line-height:1.35}
.pm-line q{display:block;margin:0 0 6px;quotes:none}
.pm-overlay{position:fixed;inset:0;z-index:40;display:grid;place-items:center;background:var(--ds-veil);padding:16px}
.pm-overlay .pm-card{width:min(680px,100%);max-height:calc(100vh - 32px);overflow:auto;padding:0 4px}
.pm-overlay .pm-card p{margin:6px 0}
.pm-overlay .pm-acts{margin-top:14px}
.pm-overlay.pm-band{inset:auto 0 0 0;display:block;padding:72px var(--ds-gutter) 40px;background:linear-gradient(to top,var(--ds-veil-strong) 0,var(--ds-veil) calc(100% - 72px),transparent 100%)}
.pm-band .pm-card{display:grid;grid-template-columns:minmax(0,1fr) minmax(220px,300px);gap:28px;width:auto;max-width:1620px;margin:0 auto;overflow:visible;padding:0}
.pm-band .pm-acts{margin-top:0;border-bottom:1px solid var(--ds-line)}
.pm-big{font:400 var(--ds-fs-title-big)/1.2 var(--ds-title);color:var(--ds-ivory);text-align:center;margin:6px 0 4px}
.pm-btn[aria-pressed=true]{color:var(--ds-accent);box-shadow:inset 3px 0 0 var(--ds-accent);padding-left:12px}
.pm-table{width:100%;border-collapse:collapse}
.pm-table td{padding:6px 4px;border-top:1px solid var(--ds-line)}
.pm-table tr.me{color:var(--ds-accent)}
.pm-table tr.me .pm-num{color:var(--ds-accent)}
.pm-table td.pts{text-align:right;white-space:nowrap}
.pm-gap{margin-top:12px!important}
.pm-center{text-align:center}
.pm-toggle{cursor:pointer}
@media ${PHONE_QUERY}{.pm-overlay{place-items:end center;padding:12px 18px 14px}.pm-overlay .pm-card{width:100%;max-height:calc(100vh - 26px)}.pm-overlay.pm-band{padding:48px 18px 14px;background:linear-gradient(to top,var(--ds-veil-strong) 0,var(--ds-veil) calc(100% - 48px),transparent 100%)}.pm-band .pm-card{grid-template-columns:minmax(0,1fr);gap:10px}}
.pm-overlay{animation:ds-fade .16s ease-out}
.pm-overlay .pm-card{animation:ds-in .16s ease-out}
.pm-overlay.pm-band,.pm-talk{animation:ds-rise .2s ease-out}
.pm-overlay.pm-band .pm-card{animation:none}
.pm-btn{position:relative}
.pm-btn::before{content:'';position:absolute;left:0;right:0;top:-1px;height:1px;background:var(--ds-line);transform-origin:left center;animation:ds-rule .24s ease-out backwards}
.pm-btn{border-top-color:transparent}
.pm-btn:nth-of-type(2)::before{animation-delay:.03s}.pm-btn:nth-of-type(3)::before{animation-delay:.06s}.pm-btn:nth-of-type(4)::before{animation-delay:.09s}.pm-btn:nth-of-type(n+5)::before{animation-delay:.12s}
@media (prefers-reduced-motion:reduce){.pm,.pm *,.pm *::before,.pm *::after{transition:none!important;animation:none!important}}
`;

export function injectStyle(): void {
  installDesign();
  if (document.getElementById('pm-css')) return;
  const st = document.createElement('style');
  st.id = 'pm-css'; st.textContent = CSS;
  document.head.appendChild(st);
}

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', html = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

export const esc = (s: string): string => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** the up and down arrows walk a list of options (the buttons that can be pressed), around its ends; the keyboard's Tab keeps working */
export function arrowKeys(list: HTMLElement): void {
  list.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const all = [...list.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
    if (!all.length) return;
    e.preventDefault(); e.stopPropagation();
    const i = all.indexOf(document.activeElement as HTMLButtonElement), down = e.key === 'ArrowDown';
    all[i < 0 ? (down ? 0 : all.length - 1) : (i + (down ? 1 : -1) + all.length) % all.length].focus();
  });
}

/** a modal page over the scene, on a full-screen veil, or `band`: a band at the foot of the screen, the scene kept above it (what is read in
 *  passing, the news); resolves with the id of the button pressed */
export function overlay(html: string, buttons: Array<{ id: string; label: string; primary?: boolean }>, band = false): { root: HTMLElement; done: Promise<string> } {
  injectStyle();
  const root = el('div', `pm pm-overlay${band ? ' pm-band' : ''}`), card = el('div', 'pm-card', `<div class="pm-body">${html}</div>`), acts = el('div', 'pm-acts');
  card.setAttribute('role', 'dialog');
  card.appendChild(acts); arrowKeys(acts);
  root.appendChild(card);
  const done = new Promise<string>((res) => {
    for (const b of buttons) {
      const x = el('button', `pm-btn${b.primary ? ' primary' : ''}`, esc(b.label));
      x.dataset.id = b.id;
      x.addEventListener('click', () => { root.remove(); res(b.id); });
      acts.appendChild(x);
    }
  });
  document.body.appendChild(root);
  // the sheet opens at its top (a long journal is read from its title), its button focused
  (card.querySelector('.pm-btn.primary') as HTMLButtonElement | null ?? card.querySelector('.pm-btn') as HTMLButtonElement | null)?.focus({ preventScroll: true });
  return { root, done };
}
