import { App, type AppOptions } from './app/App';
import { parseTime, type TimeOfDay } from './atmosphere/DayState';
import { DebugPanel } from './debug/DebugPanel';
import { Hud } from './debug/Hud';
import { loadingError, progressOn, showLoading, toneLoading } from './ui/loading';
import { applyMotion, detectLayout, onSettings } from './settings/settings';
import { startLanguage } from './settings/language';

const canvas = document.getElementById('view') as HTMLCanvasElement;
const params = new URLSearchParams(location.search);

// the player's settings before anything shows (journal Passe RG2): the reduced motion, the game's own setting, off by default and never the system's
// (RG-5, the operator's rule of 2026-11-03), and the keyboard the browser announces (RG-7; a driven browser keeps QWERTY)
applyMotion(); onSettings(applyMotion); detectLayout();
// the language before anything shows (journal Passe RG4, RG-9: the browser's at the first launch, then the player's choice; English in a driven browser): at once
// for English, after the French table (loaded on demand) otherwise
const languageReady = startLanguage();
if (languageReady) await languageReady;

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
 *  closed, H opens it (the operator's decision P1, « Fermé par défaut, H l'ouvre », journal Passes UI1 / UI2). Since the version 2 is the default game
 *  (journal Passes VD1 / VD2) the town behind the title and Explore wear its look, Explore walks with a gamepad and plays the town's music (VD-3) */
function titleOverTown(m: typeof import('./ui/title')): void {
  if (!params.has('time')) params.set('time', 'midday');
  // the version 2's look behind the title and in Explore (the operator's VD-3 « Allure, manette et son de la version 2 », journal Passe VD2): Ren under his
  // look, the tournament's emblems, the arena on the far city, as a version 2 game's town sets them (src/ui/playTown.ts); the district's geometry unchanged
  for (const [k, v] of [['herolook', '1'], ['heraldry', 'tournament'], ['skyline', 'arena']]) if (!params.has(k)) params.set(k, v);
  toneLoading(label, parseTime(params));
  const look: TimeOfDay = parseTime(params) ?? 'night';
  let openHud: (() => void) | null = null, chosen = false;
  const screen = m.showTitle({ look, explore: () => { chosen = true; ld.reveal(); openHud?.(); exploreInputs(look); } });
  void ld.ready.then(() => startTown({ panelClosed: true, behindTitle: (hud) => { openHud = hud; if (chosen) hud(); else screen.live(); } }));
}

/** Explore's gamepad and sound (VD-3): the pad walks the hero as in a version 2 game's town, the district's piece of the hour takes over from the
 *  title's « titre »; both loaded on demand, the sound after a gesture (the engine the title screen made, SA-17) */
function exploreInputs(look: TimeOfDay): void {
  const snd = import('./audio/Sound').then((s) => { const e = s.sound(); e.setScene('district', look, false, Number(params.get('seed') ?? 1842) >>> 0); return e; });
  void import('./input/PadInput').then((p) => p.installPad({ walk: (w) => { const a = (window as { __app?: App }).__app; if (a) a.actors.pad = w; }, sound: () => snd }));
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
    // the town behind the title and Explore: no « … » bubble for good, E's short one goes with its timer (the operator's MK-1, journal Passe MK2)
    if (behindTitle) void import('./ui/bubbles').then((m) => { const tick = m.quietBubbles(app.actors); const f = () => { tick(); requestAnimationFrame(f); }; f(); });
    if (behindTitle) behindTitle(hud); else hud();
    app.start();
    let n = 0;
    const wait = () => { if (++n > 3) (window as any).__ready = true; else requestAnimationFrame(wait); };
    wait();
  }).catch((e) => loadingError(label, e));
}
