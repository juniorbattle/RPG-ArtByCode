import { App, type AppOptions } from './app/App';
import { parseTime } from './atmosphere/DayState';
import { DebugPanel } from './debug/DebugPanel';
import { Hud } from './debug/Hud';
import { loadingError, progressOn, showLoading, toneLoading } from './ui/loading';

const canvas = document.getElementById('view') as HTMLCanvasElement;
const params = new URLSearchParams(location.search);

// the loading screen in the design system, in the tone of the address's day state (journal Passe UI4; the play mode sets its page's tone)
const ld = showLoading(parseTime(params)), { label, bar, root: loading } = ld;

// ?play=1: the game's play mode (journal Passe L3), loaded on demand; the title screen (choice P2, journal Passe L4) on the bare address only,
// in a browser no automation drives (navigator.webdriver: every tool and proof keeps today's game), or forced by ?title=1, with the town
// at midday coming up behind it (titleOverTown); ?scene=arena: the arena of the Cité du Tournoi (journal Passe P1), loaded on
// demand; any other address runs the town exactly as before (no time= = the night). Every scene starts once the loading screen shows
// (its fonts loaded); the play mode's page sets its tone in the same task as the reveal
const title = params.get('title') === '1' || (location.search === '' && !navigator.webdriver);
// DEV only, the review of journal Passe MN1: every key cap as a pad's button (?padglyph=xbox|ps|nintendo[:style]); compiled out of production builds
if (import.meta.env.DEV && params.has('padglyph')) void import('./input/prompts').then((m) => m.reviewPrompts(params));
const fail = (e: unknown) => { ld.reveal(); loadingError(label, e); };
if (params.has('play')) void Promise.all([import('./ui/play'), ld.ready]).then(([m]) => { ld.reveal(); return m.startPlay({ canvas, params, label, bar, loading }); }).catch(fail);
else if (title) void import('./ui/title').then(titleOverTown);
else void ld.ready.then(() => { ld.reveal(); if (params.get('scene') === 'arena') void startArena(); else startTown(); });

/** The title at once, the town coming up behind it (UM-R4, UM2-4, journal Passe UM3). « Explore the district » opens the day: midday (the operator's
 *  decision L7-6a, « Le jour devient le défaut d’« Explore the district » », with midday and the button alone as its scope, journal Passes D8 / D9):
 *  the town below with ?time=midday's params, the address unchanged (a reload shows the title screen again); every address with parameters keeps the
 *  night without time= (tools, proofs, the play mode). Pressed before the town stands, the loading screen shows until it does. Its DEV panel starts
 *  closed, H opens it (the operator's decision P1, « Fermé par défaut, H l'ouvre », journal Passes UI1 / UI2) */
function titleOverTown(m: typeof import('./ui/title')): void {
  if (!params.has('time')) params.set('time', 'midday');
  toneLoading(label, parseTime(params));
  let openHud: (() => void) | null = null, chosen = false;
  const screen = m.showTitle({ explore: () => { chosen = true; ld.reveal(); openHud?.(); } });
  void ld.ready.then(() => startTown({ panelClosed: true, behindTitle: (hud) => { openHud = hud; if (chosen) hud(); else screen.live(); } }));
}

async function startArena(): Promise<void> {
    try {
    const { ArenaApp } = await import('./arena/ArenaApp');
    const app = new ArenaApp({ canvas, params, onProgress: progressOn(label, bar) });
    (window as any).__arena = app;
    await app.init();
    loading.style.opacity = '0';
    setTimeout(() => loading.remove(), 900);
    (window as any).__stats = () => app.snapshot();
    app.start();
    let n = 0;
    const wait = () => { if (++n > 3) (window as any).__ready = true; else requestAnimationFrame(wait); };
    wait();
  } catch (e: any) { loadingError(label, e); }
}

/** panelClosed: the DEV panel starts hidden, as after H (« Explore the district » only); every other address opens it as before. behindTitle: the
 *  town stands behind the title screen, its HUD waits for « Explore the district » (the function it is handed) */
function startTown({ panelClosed = false, behindTitle }: { panelClosed?: boolean; behindTitle?: (hud: () => void) => void } = {}): void {
  const opts: AppOptions = {
    canvas, params,
    onProgress: progressOn(label, bar),
  };
  // DEV only: EXPERIMENTAL baked sheets in the shared atlas (?baked=<id>, see src/lab/bakedLoader.ts); compiled out of production builds
  if (import.meta.env.DEV && params.has('baked')) opts.baked = import('./lab/bakedLoader').then((m) => m.loadBaked(params));
  const app = new App(opts);
  (window as any).__app = app;
  // DEV only: in-scene preview of an exported Art Lab sheet (?labsprite=<id>, see src/lab/runtimePreview.ts); compiled out of production builds
  if (import.meta.env.DEV && params.has('labsprite')) void import('./lab/runtimePreview').then((m) => m.installLabSprite(app, params));
  if (import.meta.env.DEV && opts.baked) void import('./lab/bakedLoader').then((m) => m.installBakedHarness(app, params, opts.baked as Promise<import('./lab/bakedLoader').BakedLoad>));

  function showSpriteSheet(): void {
    const a = app.atlas;
    const scale = parseInt(params.get('sheetScale') ?? '5', 10);
    const c = document.createElement('canvas');
    c.width = a.width; c.height = a.height;
    const ctx = c.getContext('2d')!;
    const img = ctx.createImageData(a.width, a.height);
    for (let y = 0; y < a.height; y++) for (let x = 0; x < a.width; x++) {
      const s = ((a.height - 1 - y) * a.width + x) * 4, d = (y * a.width + x) * 4;
      img.data[d] = a.rgba[s]; img.data[d + 1] = a.rgba[s + 1]; img.data[d + 2] = a.rgba[s + 2]; img.data[d + 3] = a.rgba[s + 3];
    }
    ctx.putImageData(img, 0, 0);
    c.style.cssText = `position:fixed;left:0;top:0;width:${a.width * scale}px;height:${a.height * scale}px;image-rendering:pixelated;background:#2a3040;z-index:40;transform-origin:0 0`;
    document.body.appendChild(c);
  }

  app.init().then(() => {
    if (params.get('sprites')) showSpriteSheet();
    loading.style.opacity = '0';
    setTimeout(() => loading.remove(), 900);
    (window as any).__stats = () => app.snapshot();
    const hud = () => {
      if (params.has('clean')) return;
      const panel = new DebugPanel(app); const hud = new Hud(app);
      if (panelClosed) panel.el.style.display = 'none';
      let tick = 0;
      const loop = () => { hud.update(); if ((tick++ % 12) === 0) panel.update(); requestAnimationFrame(loop); };
      loop();
    };
    if (behindTitle) behindTitle(hud); else hud();
    app.start();
    let n = 0;
    const wait = () => { if (++n > 3) (window as any).__ready = true; else requestAnimationFrame(wait); };
    wait();
  }).catch((e) => loadingError(label, e));
}
