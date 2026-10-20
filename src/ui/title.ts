import { readSave } from './save';
import { cleanName } from '../simulation';
import { el, esc, injectStyle } from './style';

/** The title screen (choice P2, journal Passe L4): « New game » (it asks the player's name, choice K2), « Explore the district » (today's
 *  game, untouched: the night and the DEV panel) and « Continue » when a save exists. DOM, shown before anything is generated, over the
 *  loading screen; English (choice K1). Shown on the bare address only (main.ts), and forced by `?title=1`. */

export interface TitleChoice { explore: () => void }

export function showTitle(c: TitleChoice): void {
  injectStyle();
  const save = readSave().state, root = el('div', 'pm');
  root.id = 'title-screen';
  root.style.cssText = 'inset:0;z-index:60;display:grid;place-items:center;padding:16px;background:radial-gradient(ellipse at 50% 38%,#121a2e 0%,#05070d 70%)';
  root.innerHTML = `<div style="width:min(420px,100%);text-align:center">
    <div style="font-size:clamp(22px,6vw,34px);letter-spacing:.32em;color:#f1d9a0;margin-bottom:4px">CITÉ DU TOURNOI</div>
    <div class="pm-sub" style="margin-bottom:26px">The pool of eight · a playable slice</div>
    <div class="pm-card" style="padding:16px 18px;text-align:left" id="title-menu"></div>
    <p class="pm-sub" style="margin-top:18px;opacity:.7">Keyboard: arrows or WASD to walk, E to talk</p></div>`;
  document.body.appendChild(root);
  const menu = root.querySelector('#title-menu')!;
  const menuButtons = (): void => {
    menu.innerHTML = '';
    const add = (id: string, label: string, sub: string, f: () => void, primary = false) => {
      const b = el('button', `pm-btn${primary ? ' primary' : ''}`, `<span>${esc(label)}<span class="pm-sub" style="display:block;text-transform:none;letter-spacing:.02em">${esc(sub)}</span></span>`);
      b.dataset.id = id; b.addEventListener('click', f); menu.appendChild(b);
      return b;
    };
    const first = save ? add('continue', 'Continue', `${save.player.name} · day ${save.day}, ${save.slot}${save.over ? ' · the slice is over' : ''}`, () => location.assign('?play=1'), true) : null;
    add('new', 'New game', 'Enter the tournament under your own name', askName, !save);
    add('explore', 'Explore the district', 'The Merchant District at night, free roaming', () => { root.remove(); c.explore(); });
    ((first ?? menu.querySelector('.pm-btn')) as HTMLButtonElement).focus();
  };
  const askName = (): void => {
    menu.innerHTML = `<h2 class="pm-h">New game</h2><label for="title-name" class="pm-sub">Your fighter's name</label>
      <input id="title-name" maxlength="20" autocomplete="off" spellcheck="false" placeholder="Ren" style="width:100%;margin:6px 0 10px;padding:8px 10px;font:inherit;font-size:15px;color:#f6e7c4;background:#0b1020;border:1px solid rgba(233,166,76,.6);border-radius:3px">
      ${save ? '<p class="pm-sub" style="color:#e9a64c">This replaces your saved game.</p>' : ''}`;
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

