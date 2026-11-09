import { readSave } from './save';
import { cleanName } from '../simulation';
import { arrowKeys, el, esc, injectStyle } from './style';
import { tx } from '../narrative/text';
import type { Look } from '../audio/score';
import { layout, onSettings, shownKey } from '../settings/settings';

/** The title screen (choice P2, journal Passe L4; the operator's decisions UM-R4 « La vraie ville derrière » and UM2-4 « Le titre d'abord, la ville apparaît
 *  derrière », journal Passe UM3): « New game » (it asks the player's name, choice K2; a version 2 game, the default game since the operator's decision
 *  of journal Passe VD1), « Explore the district » (the town at midday and the DEV panel: the operator's decision L7-6a, journal Passes D8 / D9; the
 *  version 2's look, gamepad and sound since VD-3, journal Passe VD2) and « Continue » when a save exists (a save of today's game marked « the earlier
 *  version », VD-2). It shows at once on the page's ink, before anything is generated; the town at midday comes up behind it (`live`), and its buttons
 *  answer from the start; its music, « titre », from the first key or click (VD-5). DOM, English (choice K1). Shown on the bare address only (main.ts),
 *  and forced by `?title=1`. Keys pressed on it stay on it: the town behind does not walk. */

/** the walking keys of the player's keyboard (journal Passe RG2, RG-7: WASD on QWERTY, ZQSD on AZERTY) */
const keysLine = (): string => tx('ui.title.keys', { move: ['w', 'a', 's', 'd'].map((k) => shownKey(k, layout())).join('') });

/** `look`: the day state of the town behind the screen (its ambience under the title's music) */
export interface TitleChoice { explore: () => void; look?: Look }

/** to another page once the title's music went down (the engine's fade; at once when it never started) */
function leaveTo(url: string): void {
  const wait: number = (window as { __soundLeave?: () => number }).__soundLeave?.() ?? 0;
  if (wait > 0) setTimeout(() => location.assign(url), wait); else location.assign(url);
}

const CSS = `
#title-screen{inset:0;z-index:60;background:var(--ds-ink);transition:background-color .9s}
#title-screen.live{background-color:transparent}
#title-screen:focus{outline:0}
#title-screen .wrap{position:absolute;left:0;right:0;bottom:0;display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,520px);column-gap:48px;align-items:end;padding:96px var(--ds-gutter) 48px;background:linear-gradient(to top,var(--ds-veil-strong) 0,var(--ds-veil) calc(100% - 96px),transparent 100%)}
#title-screen .wrap{animation:ds-in .24s ease-out}
#title-screen.under .wrap{visibility:hidden}
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
    <div><div class="name">Cité du Tournoi</div><div class="tag">${tx('ui.title.tag')}</div><p class="pm-sub keys">${keysLine()}</p></div>
    <div id="title-menu"></div></div>`;
  document.body.appendChild(root);
  // a change of keyboard (the settings, or the one the browser announces once asked) shows its keys at once
  onSettings(() => { const k = root.querySelector('.keys'); if (k) k.textContent = keysLine(); });
  // the title's music (the operator's VD-5 « Le titre joue « titre » au premier geste », journal Passe VD2; SA-16 waited for the version 2 to become
  // the default): the engine loaded on demand, nothing heard before the first key or click (the browsers' rule; the files fetched after it, SA-17),
  // then « titre » over the town's ambience; the new game's first page takes it up where it stands (SA-15), Explore turns to the town's piece
  const snd = import('../audio/Sound').then((m) => { const s = m.sound(); s.setScene('district', c.look ?? 'midday', false, 1842, { opening: true }); return s; });
  // keys pressed on the screen stay on it (the town behind does not walk, the engine's own listener does not hear them): a key starts the sound here
  root.addEventListener('keydown', (e) => { e.stopPropagation(); void snd.then((s) => s.unlock()); });
  const menu = root.querySelector('#title-menu')!;
  const menuButtons = (): void => {
    menu.innerHTML = '';
    const add = (id: string, label: string, sub: string, f: () => void, primary = false) => {
      const b = el('button', `pm-btn${primary ? ' primary' : ''}`, `<span>${esc(label)}<span class="why line">${esc(sub)}</span></span>`);
      b.dataset.id = id; b.addEventListener('click', f); menu.appendChild(b);
      return b;
    };
    // a save of today's game (no version 2 flag) is taken up as it is, marked « the earlier version »: « New game » opens the version 2 (the operator's
    // VD-2 « La reprendre, marquée « version d’avant » », journal Passe VD2)
    const earlier = save && save.flags.v2 !== true;
    const first = save ? add('continue', tx('ui.title.continue'), tx('ui.title.save', { name: save.player.name, day: save.day, slot: save.slot, over: (save.over ? (earlier ? tx('ui.title.over') : tx('v2.title.over')) : '') + (earlier ? tx('ui.title.earlier') : '') }), () => leaveTo('?play=1'), true) : null;
    add('new', tx('ui.title.new'), tx('ui.title.newSub'), askName, !save);
    // « Explore the district » leaves the title screen to the town, which the gamepad now walks (VD-3, journal Passe VD2: main.ts adds the walk to
    // the same layer) and where the town's piece takes over from « titre »
    add('explore', tx('ui.title.explore'), tx('ui.title.exploreSub'), () => { root.remove(); c.explore(); });
    // the settings (the operator's RG-1 « Une page « Réglages », quatre parties, titre et menu », journal Passe RG2): over the title, back to this button
    const set = add('settings', tx('set.open'), tx('set.openSub'), () => {
      void import('./settings').then((m) => {
        root.classList.add('under');
        const p = m.settingsPage({ close: () => { root.classList.remove('under'); set.focus(); } });
        document.body.appendChild(p.root); p.focus();
      });
    });
    ((first ?? menu.querySelector('.pm-btn')) as HTMLButtonElement).focus();
  };
  const askName = (): void => {
    menu.innerHTML = `<h2 class="pm-h">${tx('ui.title.new')}</h2><label for="title-name" class="pm-sub">${tx('ui.title.name')}</label>
      <input id="title-name" maxlength="20" autocomplete="off" spellcheck="false" placeholder="Ren">
      ${save ? `<p class="pm-sub warn">${tx('ui.title.replaces')}</p>` : ''}`;
    const input = menu.querySelector('input') as HTMLInputElement;
    const go = el('button', 'pm-btn primary', tx('ui.title.enter')), back = el('button', 'pm-btn', tx('ui.title.back'));
    // the gamepad's B goes back as this button does (journal Passe MN2: the keyboard's Esc answers in the field only)
    back.dataset.padBack = '';
    const start = () => leaveTo(`?play=1&new=1&name=${encodeURIComponent(cleanName(input.value))}`);
    go.addEventListener('click', start); back.addEventListener('click', menuButtons);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') start(); if (e.key === 'Escape') menuButtons(); });
    menu.append(go, back);
    input.focus();
  };
  // the gamepad navigates the title screen (the operator's MN-1 « La version 2 et la navigation de l’écran titre », journal Passe MN2): « New game » and
  // « Continue » open a version 2 game; its layer is loaded on demand and does nothing until a pad is used; its press tries to start the music (MN-10)
  void import('../input/PadInput').then((m) => m.installPad({ sound: () => snd }));
  menuButtons();
  arrowKeys(menu as HTMLElement);
  return { live: () => root.classList.add('live') };
}
