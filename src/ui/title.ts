import { readSave } from './save';
import { cleanName } from '../simulation';
import { arrowKeys, el, esc, injectStyle } from './style';
import { tx } from '../narrative/text';

/** The title screen (choice P2, journal Passe L4; the operator's decisions UM-R4 « La vraie ville derrière » and UM2-4 « Le titre d'abord, la ville apparaît
 *  derrière », journal Passe UM3): « New game » (it asks the player's name, choice K2), « Explore the district » (today's town at midday and the
 *  DEV panel: the operator's decision L7-6a, journal Passes D8 / D9) and « Continue » when a save exists. It shows at once on the page's ink, before
 *  anything is generated; the town at midday comes up behind it (`live`), and its buttons answer from the start. DOM, English (choice K1). Shown
 *  on the bare address only (main.ts), and forced by `?title=1`. Keys pressed on it stay on it: the town behind does not walk. */

export interface TitleChoice { explore: () => void }

const CSS = `
#title-screen{inset:0;z-index:60;background:var(--ds-ink);transition:background-color .9s}
#title-screen.live{background-color:transparent}
#title-screen:focus{outline:0}
#title-screen .wrap{position:absolute;left:0;right:0;bottom:0;display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,520px);column-gap:48px;align-items:end;padding:96px var(--ds-gutter) 48px;background:linear-gradient(to top,var(--ds-veil-strong) 0,var(--ds-veil) calc(100% - 96px),transparent 100%)}
#title-screen .wrap{animation:ds-in .24s ease-out}
#title-screen .name{font:400 var(--ds-fs-title-huge)/1.05 var(--ds-title);color:var(--ds-ivory)}
#title-screen .tag{margin-top:8px;font-size:var(--ds-fs-label);color:var(--ds-ivory)}
#title-screen .keys{margin:6px 0 0}
#title-menu{min-width:0;background:none;border-bottom:1px solid var(--ds-line)}
#title-menu .pm-h{padding-bottom:6px}
#title-menu .line{display:block;color:var(--ds-muted)}
#title-menu .pm-btn:hover .line,#title-menu .pm-btn:focus .line,#title-menu .pm-btn.primary .line{color:inherit}
#title-menu input{width:100%;margin:6px 0 10px;padding:8px 10px;font:inherit;color:var(--ds-ivory);background:none;border:1px solid var(--ds-line);border-radius:0}
#title-menu input::placeholder{color:var(--ds-muted)}
#title-menu .warn{color:var(--ds-accent)}
@media (max-width:900px){#title-screen .wrap{grid-template-columns:minmax(0,1fr);row-gap:18px;padding:72px 18px 18px}}
`;

/** `live()`: the town stands behind the screen, the ink fades out */
export function showTitle(c: TitleChoice): { live(): void } {
  injectStyle();
  if (!document.getElementById('pm-title-css')) { const st = document.createElement('style'); st.id = 'pm-title-css'; st.textContent = CSS; document.head.appendChild(st); }
  const save = readSave().state, root = el('div', 'pm');
  root.id = 'title-screen'; root.tabIndex = -1;
  root.innerHTML = `<div class="wrap">
    <div><div class="name">Cité du Tournoi</div><div class="tag">${tx('ui.title.tag')}</div><p class="pm-sub keys">${tx('ui.title.keys')}</p></div>
    <div id="title-menu"></div></div>`;
  document.body.appendChild(root);
  root.addEventListener('keydown', (e) => e.stopPropagation());
  const menu = root.querySelector('#title-menu')!;
  const menuButtons = (): void => {
    menu.innerHTML = '';
    const add = (id: string, label: string, sub: string, f: () => void, primary = false) => {
      const b = el('button', `pm-btn${primary ? ' primary' : ''}`, `<span>${esc(label)}<span class="why line">${esc(sub)}</span></span>`);
      b.dataset.id = id; b.addEventListener('click', f); menu.appendChild(b);
      return b;
    };
    const first = save ? add('continue', tx('ui.title.continue'), tx('ui.title.save', { name: save.player.name, day: save.day, slot: save.slot, over: save.over ? (save.flags.v2 === true ? tx('v2.title.over') : tx('ui.title.over')) : '' }), () => location.assign('?play=1'), true) : null;
    add('new', tx('ui.title.new'), tx('ui.title.newSub'), askName, !save);
    add('explore', tx('ui.title.explore'), tx('ui.title.exploreSub'), () => { root.remove(); c.explore(); });
    ((first ?? menu.querySelector('.pm-btn')) as HTMLButtonElement).focus();
  };
  const askName = (): void => {
    menu.innerHTML = `<h2 class="pm-h">${tx('ui.title.new')}</h2><label for="title-name" class="pm-sub">${tx('ui.title.name')}</label>
      <input id="title-name" maxlength="20" autocomplete="off" spellcheck="false" placeholder="Ren">
      ${save ? `<p class="pm-sub warn">${tx('ui.title.replaces')}</p>` : ''}`;
    const input = menu.querySelector('input') as HTMLInputElement;
    const go = el('button', 'pm-btn primary', tx('ui.title.enter')), back = el('button', 'pm-btn', tx('ui.title.back'));
    const start = () => location.assign(`?play=1&new=1&name=${encodeURIComponent(cleanName(input.value))}`);
    go.addEventListener('click', start); back.addEventListener('click', menuButtons);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') start(); if (e.key === 'Escape') menuButtons(); });
    menu.append(go, back);
    input.focus();
  };
  menuButtons();
  arrowKeys(menu as HTMLElement);
  return { live: () => root.classList.add('live') };
}
