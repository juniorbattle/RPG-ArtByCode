import { installDesign } from './design/system';
import { PHONE_QUERY } from './design/tokens';

/** The play mode's interface style, built from the design system (journal Passe UI3; direction C « Héraldique pixel », the operator's sheet of
 *  Passe UI1): the tone's colours (`--ds-*`, src/ui/design/tokens.ts), the code-painted nine-slice frames (panel, parchment, buttons, tags,
 *  keycaps), the embedded pixel font for titles, numbers and keys and the embedded text font for sentences, no text under 16 px on a computer
 *  or 14 px on a phone. DOM over the canvas, keyboard reachable. On a phone (L3) a modal card is a sheet at the bottom of the screen. */

const CSS = `
.pm{position:fixed;z-index:30;color:var(--ds-ivory);font:400 var(--ds-fs-body)/1.35 var(--ds-text);letter-spacing:.01em}
.pm,.pm *{box-sizing:border-box;scrollbar-color:var(--ds-gold) var(--ds-blue0);scrollbar-width:thin}
.pm-card{border:calc(8 * var(--ds-px)) solid transparent;border-image:var(--ds-f-panel) 8 fill / calc(8 * var(--ds-px)) stretch;image-rendering:pixelated;filter:drop-shadow(0 var(--ds-px) 0 var(--ds-ink)) drop-shadow(0 calc(3 * var(--ds-px)) 0 rgba(0,0,0,.28))}
.pm-h{margin:0 0 8px;font:400 var(--ds-fs-pixel)/1.2 var(--ds-pixel);letter-spacing:.04em;color:var(--ds-goldHi);text-shadow:0 var(--ds-px) 0 var(--ds-ink)}
.pm-h::after{content:'';display:block;width:120px;height:var(--ds-px);margin-top:6px;background:var(--ds-gold);box-shadow:0 var(--ds-px) 0 var(--ds-goldLo)}
.pm-sub{font-size:var(--ds-fs-small);letter-spacing:.06em;text-transform:uppercase;color:var(--ds-muted)}
.pm-num{font:400 var(--ds-fs-pixel)/1 var(--ds-pixel);letter-spacing:0;color:var(--ds-goldHi)}
.pm-btn{display:flex;align-items:center;gap:10px;width:100%;margin:4px 0;padding:3px 6px;text-align:left;font:inherit;font-size:var(--ds-fs-label);line-height:1.25;color:var(--ds-ivory);background:none;border:calc(4 * var(--ds-px)) solid transparent;border-image:var(--ds-f-btn) 4 fill / calc(4 * var(--ds-px)) stretch;image-rendering:pixelated;cursor:pointer}
.pm-btn:hover:not(:disabled),.pm-btn:focus-visible{border-image-source:var(--ds-f-btnHi)}
.pm-btn:disabled{cursor:default;color:var(--ds-muted);border-image-source:var(--ds-f-btnOff)}
.pm-btn .why{display:block;font-size:var(--ds-fs-small);color:var(--ds-amberHi)}
.pm-btn .cost{margin-left:auto;flex:none;padding:0 3px;font:400 var(--ds-fs-pixel)/1.1 var(--ds-pixel);letter-spacing:0;white-space:nowrap;color:var(--ds-amberHi);border:calc(3 * var(--ds-px)) solid transparent;border-image:var(--ds-f-tag) 3 fill / calc(3 * var(--ds-px)) stretch}
.pm-btn .cost.free{color:var(--ds-blue3);border-image-source:var(--ds-f-tagFree)}
.pm-btn.primary{border-image-source:var(--ds-f-btnAct);color:var(--ds-ivory)}
.pm-btn.primary:hover,.pm-btn.primary:focus-visible{border-image-source:var(--ds-f-btnHi)}
.pm kbd{flex:none;display:inline-block;min-width:calc(20px + 6 * var(--ds-px));padding:0 2px;font:400 var(--ds-fs-pixel)/1.1 var(--ds-pixel);letter-spacing:0;text-align:center;color:var(--ds-ink);border:calc(3 * var(--ds-px)) solid transparent;border-image:var(--ds-f-key) 3 fill / calc(3 * var(--ds-px)) stretch;image-rendering:pixelated}
.pm button:focus-visible,.pm input:focus-visible{outline:var(--ds-px) solid var(--ds-goldHi);outline-offset:var(--ds-px)}
.pm-parch{margin:6px 0 8px;padding:4px 8px;color:var(--ds-parchInk);border:calc(8 * var(--ds-px)) solid transparent;border-image:var(--ds-f-parch) 8 fill / calc(8 * var(--ds-px)) stretch;image-rendering:pixelated}
.pm-parch .pm-sub{color:var(--ds-parchInk);opacity:.8}
.pm-overlay{position:fixed;inset:0;z-index:40;display:grid;place-items:center;background:var(--ds-scrim);padding:16px}
.pm-overlay .pm-card{width:min(600px,100%);max-height:calc(100vh - 32px);overflow:auto;padding:8px 12px}
.pm-overlay .pm-card p{margin:6px 0}
.pm-big{font:400 var(--ds-fs-pixel-huge)/1.2 var(--ds-pixel);letter-spacing:.06em;color:var(--ds-goldHi);text-align:center;margin:6px 0 4px;text-shadow:0 var(--ds-px) 0 var(--ds-ink),0 calc(2 * var(--ds-px)) 0 var(--ds-goldLo)}
.pm-btn .why.title{color:var(--ds-muted)}
.pm-sub.why{text-transform:none;letter-spacing:.01em}
.pm-table{width:100%;border-collapse:collapse}
.pm-table td{padding:2px 4px}
.pm-table tr.me{color:var(--ds-goldHi)}
.pm-table td.pts{text-align:right;white-space:nowrap}
.pm-gap{margin-top:12px!important}
.pm-center{text-align:center}
.pm-toggle{cursor:pointer}
@media ${PHONE_QUERY}{.pm-overlay{place-items:end center;padding:0}.pm-overlay .pm-card{width:100%;max-height:82vh}}
@media (prefers-reduced-motion:reduce){.pm *{transition:none!important;animation:none!important}}
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

/** a modal card over the scene; resolves with the id of the button pressed */
export function overlay(html: string, buttons: Array<{ id: string; label: string; primary?: boolean }>): { root: HTMLElement; done: Promise<string> } {
  injectStyle();
  const root = el('div', 'pm pm-overlay'), card = el('div', 'pm-card', html);
  card.setAttribute('role', 'dialog');
  root.appendChild(card);
  const done = new Promise<string>((res) => {
    for (const b of buttons) {
      const x = el('button', `pm-btn${b.primary ? ' primary' : ''}`, esc(b.label));
      x.dataset.id = b.id;
      x.addEventListener('click', () => { root.remove(); res(b.id); });
      card.appendChild(x);
    }
  });
  document.body.appendChild(root);
  // the card opens at its top (a long journal is read from its title), its button focused
  (card.querySelector('.pm-btn.primary') as HTMLButtonElement | null ?? card.querySelector('.pm-btn') as HTMLButtonElement | null)?.focus({ preventScroll: true });
  return { root, done };
}
