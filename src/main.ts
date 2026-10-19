import { App, type AppOptions } from './app/App';
import { DebugPanel } from './debug/DebugPanel';
import { Hud } from './debug/Hud';

const canvas = document.getElementById('view') as HTMLCanvasElement;
const params = new URLSearchParams(location.search);

const loading = document.createElement('div');
loading.style.cssText = 'position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#05070d;color:#d9c9a8;font:14px/1.6 "Segoe UI",system-ui,sans-serif;letter-spacing:.14em;z-index:50;transition:opacity .8s';
loading.innerHTML = '<div style="font-size:22px;letter-spacing:.3em;margin-bottom:14px;color:#f1d9a0">CITÉ DU TOURNOI</div><div id="ld-label" style="opacity:.7">PAINTING THE NIGHT...</div><div style="width:260px;height:2px;background:#1a2132;margin-top:14px"><div id="ld-bar" style="height:100%;width:0;background:#e9a64c"></div></div>';
document.body.appendChild(loading);
const label = loading.querySelector('#ld-label') as HTMLElement, bar = loading.querySelector('#ld-bar') as HTMLElement;

// ?scene=arena: the arena of the Cité du Tournoi (journal Passe P1), loaded on demand; without it the town runs exactly as before
if (params.get('scene') === 'arena') void startArena();
else startTown();

async function startArena(): Promise<void> {
  const onProgress = (l: string, f: number) => { label.textContent = `GENERATING ${l.toUpperCase()}`; bar.style.width = `${Math.round(f * 100)}%`; };
  try {
    const { ArenaApp } = await import('./arena/ArenaApp');
    const app = new ArenaApp({ canvas, params, onProgress });
    (window as any).__arena = app;
    await app.init();
    loading.style.opacity = '0';
    setTimeout(() => loading.remove(), 900);
    (window as any).__stats = () => app.snapshot();
    app.start();
    let n = 0;
    const wait = () => { if (++n > 3) (window as any).__ready = true; else requestAnimationFrame(wait); };
    wait();
  } catch (e: any) { console.error(e); label.textContent = 'ERROR: ' + (e?.message ?? e); (window as any).__error = String(e?.stack ?? e); }
}

function startTown(): void {
  const opts: AppOptions = {
    canvas, params,
    onProgress: (l, f) => { label.textContent = `GENERATING ${l.toUpperCase()}`; bar.style.width = `${Math.round(f * 100)}%`; },
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
    if (!params.has('clean')) {
      const panel = new DebugPanel(app); const hud = new Hud(app);
      let tick = 0;
      const loop = () => { hud.update(); if ((tick++ % 12) === 0) panel.update(); requestAnimationFrame(loop); };
      loop();
      window.addEventListener('keydown', (e) => { if (e.key.toLowerCase() === 'h') hud.setMapRight(panel.el.style.display === 'none' ? 14 : 300); });
    }
    app.start();
    let n = 0;
    const wait = () => { if (++n > 3) (window as any).__ready = true; else requestAnimationFrame(wait); };
    wait();
  }).catch((e) => { console.error(e); label.textContent = 'ERROR: ' + (e?.message ?? e); (window as any).__error = String(e?.stack ?? e); });
}
