import type { TimeOfDay } from '../atmosphere/DayState';
import { fontsReady, installDesign } from './design/system';

/** The loading screen (journal Passe UI4; the operator's decision C2-14 « Tâche à part », journal Passe C2F): shown before every scene (the
 *  town, the arena, the play mode's pages) while it is generated, built from the interface's design system (direction A « Voile », journal Passe
 *  UM1): the tone of the page's day state (L2), the name in the title font and the status in the text font (S1), the progress on a thin rule, no
 *  text under 16 px on a computer or 14 px on a phone (S4). Its content shows once both fonts are loaded (`ready`, `reveal`): never a fallback
 *  font, never a text popping in; the ink behind it is the page's from the first frame. */

const CSS = `
#loading{position:fixed;inset:0;z-index:50;display:grid;place-items:center;padding:16px;box-sizing:border-box;background:var(--ds-ink);color:var(--ds-muted);font:400 var(--ds-fs-small)/1.35 var(--ds-text);transition:opacity .8s}
#loading .wrap{width:min(420px,100%);text-align:center;animation:ds-fade .2s ease-out}
#loading.hold .wrap{visibility:hidden}
#loading .name{margin-bottom:18px;font:400 var(--ds-fs-title-big)/1.2 var(--ds-title);color:var(--ds-ivory)}
#ld-gauge{position:relative;height:2px;background:var(--ds-trough)}
#ld-bar{position:absolute;left:0;top:0;bottom:0;width:0;background:var(--ds-accent);transition:width .16s ease-out}
#ld-label{margin-top:10px;min-height:1.35em;overflow-wrap:anywhere}
#ld-label.err{color:var(--ds-accent)}
`;

export interface Loading {
  root: HTMLElement;
  /** the status line, the gauge's fill (its width in %): `progressOn` */
  label: HTMLElement; bar: HTMLElement;
  /** resolves once both fonts are loaded, or after a second without them (the scene never waits longer for its loading screen) */
  ready: Promise<void>;
  /** shows the content (the screen starts as the ink alone) */
  reveal(): void;
}

/** the screen over the page, in the tone of `time` (null = the night), its content held until `reveal` */
export function showLoading(time: TimeOfDay | null): Loading {
  if (!document.getElementById('ld-css')) { const st = document.createElement('style'); st.id = 'ld-css'; st.textContent = CSS; document.head.appendChild(st); }
  const root = document.createElement('div');
  root.id = 'loading'; root.className = 'hold';
  root.innerHTML = '<div class="wrap"><div class="name">CITÉ DU TOURNOI</div><div id="ld-gauge"><div id="ld-bar"></div></div><div id="ld-label"></div></div>';
  document.body.appendChild(root);
  const label = root.querySelector('#ld-label') as HTMLElement, bar = root.querySelector('#ld-bar') as HTMLElement;
  toneLoading(label, time);
  const ready = Promise.race([fontsReady(), new Promise<void>((r) => setTimeout(r, 1000))]);
  return { root, label, bar, ready, reveal: () => root.classList.remove('hold') };
}

/** the page's tone (`installDesign`) and the screen's opening line: the night, or the day */
export function toneLoading(label: HTMLElement, time: TimeOfDay | null): void {
  installDesign(time);
  // the page's language (journal Passe RG4: `<html lang>`, set before the screen; this screen stays free of the game's modules)
  const fr = document.documentElement?.lang === 'fr';
  if (!label.classList.contains('err')) label.textContent = time && time !== 'night' ? (fr ? 'On peint le jour…' : 'Painting the day…') : (fr ? 'On peint la nuit…' : 'Painting the night…');
}

/** a scene's progress: the gauge's fill; the status line stays the screen's own, no developer's word on it (UM-R3 « Tous les retirer »), the generator's
 *  phase kept in `data-phase` for tools/startup.mjs */
export function progressOn(label: HTMLElement, bar: HTMLElement): (phase: string, f: number) => void {
  return (phase, f) => { label.dataset.phase = phase; bar.style.width = `${Math.round(f * 100)}%`; };
}

/** a scene that failed to load says why on the screen (and to the tools, `window.__error`) */
export function loadingError(label: HTMLElement, e: any): void {
  console.error(e);
  label.classList.add('err');
  label.textContent = (document.documentElement?.lang === 'fr' ? 'ERREUR : ' : 'ERROR: ') + (e?.message ?? e);
  (window as any).__error = String(e?.stack ?? e);
}
