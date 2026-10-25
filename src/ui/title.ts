import { readSave } from './save';
import { cleanName } from '../simulation';
import { el, esc, injectStyle } from './style';

/** The title screen (choice P2, journal Passe L4): « New game » (it asks the player's name, choice K2), « Explore the district » (today's
 *  town at midday and the DEV panel: the operator's decision L7-6a, journal Passes D8 / D9) and « Continue » when a save exists. DOM, shown before anything is generated, over the
 *  loading screen; English (choice K1). Shown on the bare address only (main.ts), and forced by `?title=1`. Built from the design system (journal
 *  Passe UI3), in the night's tone (no day state is shown yet). */

export interface TitleChoice { explore: () => void }

const CSS = `
#title-screen{inset:0;z-index:60;display:grid;place-items:center;padding:16px;background:var(--ds-ink)}
#title-screen .wrap{width:min(640px,100%);text-align:center}
#title-screen .name{font:400 var(--ds-fs-pixel-huge)/1.2 var(--ds-pixel);letter-spacing:.08em;color:var(--ds-goldHi);text-shadow:0 var(--ds-px) 0 var(--ds-ink),0 calc(2 * var(--ds-px)) 0 var(--ds-goldLo);margin-bottom:6px}
#title-screen .tag{margin-bottom:24px}
#title-menu{width:min(460px,100%);margin:0 auto;padding:4px 8px;text-align:left}
#title-menu .pm-sub.line{display:block;text-transform:none;letter-spacing:.01em}
#title-menu input{width:100%;margin:6px 0 10px;padding:4px 8px;font:inherit;color:var(--ds-ivory);background:none;border:calc(4 * var(--ds-px)) solid transparent;border-image:var(--ds-f-btnHi) 4 fill / calc(4 * var(--ds-px)) stretch;image-rendering:pixelated}
#title-menu input::placeholder{color:var(--ds-muted)}
#title-menu .warn{color:var(--ds-amberHi)}
#title-screen .keys{margin-top:18px}
`;

export function showTitle(c: TitleChoice): void {
  injectStyle();
  if (!document.getElementById('pm-title-css')) { const st = document.createElement('style'); st.id = 'pm-title-css'; st.textContent = CSS; document.head.appendChild(st); }
  const save = readSave().state, root = el('div', 'pm');
  root.id = 'title-screen';
  root.innerHTML = `<div class="wrap">
    <div class="name">CITÉ DU TOURNOI</div>
    <div class="pm-sub tag">The pool of eight · a playable slice</div>
    <div class="pm-card" id="title-menu"></div>
    <p class="pm-sub keys">Keyboard: arrows or WASD to walk, E to talk</p></div>`;
  document.body.appendChild(root);
  const menu = root.querySelector('#title-menu')!;
  const menuButtons = (): void => {
    menu.innerHTML = '';
    const add = (id: string, label: string, sub: string, f: () => void, primary = false) => {
      const b = el('button', `pm-btn${primary ? ' primary' : ''}`, `<span>${esc(label)}<span class="pm-sub line">${esc(sub)}</span></span>`);
      b.dataset.id = id; b.addEventListener('click', f); menu.appendChild(b);
      return b;
    };
    const first = save ? add('continue', 'Continue', `${save.player.name} · day ${save.day}, ${save.slot}${save.over ? ' · the slice is over' : ''}`, () => location.assign('?play=1'), true) : null;
    add('new', 'New game', 'Enter the tournament under your own name', askName, !save);
    add('explore', 'Explore the district', 'The Merchant District at midday, free roaming', () => { root.remove(); c.explore(); });
    ((first ?? menu.querySelector('.pm-btn')) as HTMLButtonElement).focus();
  };
  const askName = (): void => {
    menu.innerHTML = `<h2 class="pm-h">New game</h2><label for="title-name" class="pm-sub">Your fighter's name</label>
      <input id="title-name" maxlength="20" autocomplete="off" spellcheck="false" placeholder="Ren">
      ${save ? '<p class="pm-sub warn">This replaces your saved game.</p>' : ''}`;
    const input = menu.querySelector('input') as HTMLInputElement;
    const go = el('button', 'pm-btn primary', 'Enter the Cité'), back = el('button', 'pm-btn', 'Back');
    const start = () => location.assign(`?play=1&new=1&name=${encodeURIComponent(cleanName(input.value))}`);
    go.addEventListener('click', start); back.addEventListener('click', menuButtons);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') start(); if (e.key === 'Escape') menuButtons(); });
    menu.append(go, back);
    input.focus();
  };
  menuButtons();
}
