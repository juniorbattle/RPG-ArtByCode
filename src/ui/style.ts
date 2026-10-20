/** The play mode's interface style (journal Passes L3 / L4): the game's own UI language, as the loading screen and the arena's HUD (night
 *  ink #05070d, ivory #d9c9a8, pale gold #f1d9a0 for titles, the lamps' amber #e9a64c as the only accent, Segoe UI with wide letter-spacing,
 *  no external font). DOM over the canvas, keyboard reachable, readable at phone size. */

const CSS = `
.pm{position:fixed;z-index:30;color:#d9c9a8;font:14px/1.45 "Segoe UI",system-ui,sans-serif;letter-spacing:.02em}
.pm *{box-sizing:border-box}
.pm-card{background:rgba(6,9,18,.93);border:1px solid rgba(233,166,76,.38);box-shadow:0 6px 24px rgba(0,0,0,.45)}
.pm-h{margin:0 0 6px;font-weight:400;font-size:13px;letter-spacing:.28em;text-transform:uppercase;color:#f1d9a0}
.pm-h::after{content:'';display:block;width:110px;height:2px;margin-top:5px;background:linear-gradient(90deg,#e9a64c,rgba(233,166,76,0))}
.pm-sub{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#9aa3b8}
.pm-btn{display:flex;align-items:center;gap:8px;width:100%;margin:3px 0;padding:7px 10px;text-align:left;font:inherit;font-size:13px;color:#efe3c4;background:linear-gradient(#131b2e,#0a0f1c);border:1px solid rgba(120,130,156,.4);border-radius:3px;cursor:pointer}
.pm-btn:hover:not(:disabled),.pm-btn:focus-visible{border-color:rgba(233,166,76,.9)}
.pm-btn:disabled{cursor:default;color:#6d7487;border-color:rgba(90,96,116,.25)}
.pm-btn .why{display:block;font-size:11px;color:#b0705a}
.pm-btn .cost{margin-left:auto;flex:none;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#e9a64c;border:1px solid rgba(233,166,76,.5);padding:1px 5px;border-radius:2px}
.pm-btn .cost.free{color:#8fa6c4;border-color:rgba(143,166,196,.45)}
.pm-btn.primary{border-color:#e9a64c;background:linear-gradient(#3a2a12,#1a1208);color:#f6e7c4}
.pm-btn kbd{flex:none;min-width:18px;padding:0 4px;font:700 11px/16px "Segoe UI",system-ui,sans-serif;text-align:center;color:#05070d;background:#d9c9a8;border-radius:2px}
.pm button:focus-visible,.pm input:focus-visible{outline:3px solid #f1d9a0;outline-offset:2px}
.pm-log p{margin:3px 0;font-size:12.5px;color:#cfc2a3}
.pm-log p.new{color:#f6e7c4}
.pm-overlay{position:fixed;inset:0;z-index:40;display:grid;place-items:center;background:rgba(5,7,13,.62);padding:16px}
.pm-overlay .pm-card{width:min(520px,100%);max-height:calc(100vh - 32px);overflow:auto;padding:18px 20px}
.pm-big{font-size:26px;letter-spacing:.3em;text-transform:uppercase;color:#f1d9a0;text-align:center;margin:6px 0 4px}
@media (max-width:640px){.pm{font-size:13px}.pm-btn{padding:9px 10px}}
@media (prefers-reduced-motion:reduce){.pm *{transition:none!important;animation:none!important}}
`;

export function injectStyle(): void {
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
  (card.querySelector('.pm-btn.primary') as HTMLButtonElement | null ?? card.querySelector('.pm-btn') as HTMLButtonElement | null)?.focus();
  return { root, done };
}
