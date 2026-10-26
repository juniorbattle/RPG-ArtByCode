import type { TimeOfDay } from '../atmosphere/DayState';
import { fontsReady, installDesign } from './design/system';

/** The loading screen (journal Passe UI4; the operator's decision C2-14 « Tâche à part », journal Passe C2F): shown before every scene (the
 *  town, the arena, the play mode's pages) while it is generated, built from the interface's design system (direction C « Héraldique pixel »,
 *  journal Passe UI3): the tone of the page's day state (L2), the name in the pixel font and the status in the text font (S1), the progress in
 *  a gauge frame painted by the code (S2), no text under 16 px on a computer or 14 px on a phone (S4). Its content shows once both fonts are
 *  loaded (`ready`, `reveal`): never a fallback font, never a text popping in; the ink behind it is the page's from the first frame. */

const CSS = `
#loading{position:fixed;inset:0;z-index:50;display:grid;place-items:center;padding:16px;box-sizing:border-box;background:var(--ds-ink);color:var(--ds-muted);font:400 var(--ds-fs-small)/1.35 var(--ds-text);letter-spacing:.06em;transition:opacity .8s}
#loading .wrap{width:min(420px,100%);text-align:center}
#loading.hold .wrap{visibility:hidden}
#loading .name{margin-bottom:18px;font:400 var(--ds-fs-pixel-huge)/1.2 var(--ds-pixel);letter-spacing:.08em;color:var(--ds-goldHi);text-shadow:0 var(--ds-px) 0 var(--ds-ink),0 calc(2 * var(--ds-px)) 0 var(--ds-goldLo)}
#ld-gauge{position:relative;box-sizing:border-box;height:calc(8px + 6 * var(--ds-px));border:calc(3 * var(--ds-px)) solid transparent;border-image:var(--ds-f-gauge) 3 fill / calc(3 * var(--ds-px)) stretch;image-rendering:pixelated}
#ld-bar{position:absolute;left:0;top:0;bottom:0;width:0;background:var(--ds-amber);box-shadow:inset 0 var(--ds-px) 0 var(--ds-amberHi)}
#ld-label{margin-top:10px;min-height:1.35em;overflow-wrap:anywhere}
#ld-label.err{letter-spacing:.01em;color:var(--ds-amberHi)}
`;

export interface Loading {
  root: HTMLElement;
  /** the status line (`GENERATING <phase>`), the gauge's fill (its width in %) */
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
  if (!label.classList.contains('err')) label.textContent = time && time !== 'night' ? 'PAINTING THE DAY…' : 'PAINTING THE NIGHT…';
}

/** a scene that failed to load says why on the screen (and to the tools, `window.__error`) */
export function loadingError(label: HTMLElement, e: any): void {
  console.error(e);
  label.classList.add('err');
  label.textContent = 'ERROR: ' + (e?.message ?? e);
  (window as any).__error = String(e?.stack ?? e);
}
