// The version 2's live scenes played in a browser (journal Passe EVL11; lot L6, the operator's EV-13 « Compléter les arcs, quatre scènes selon l’état » and the
// festival's FE-8): each named state given (DEV) opened on its square with `&cutscene=1`, its pending scene played to its end with E as a player does; every line
// heard is the line the state gives (src/narrative/v2story.ts, read in Node through the same modules), in order; each walker ends at its point; the scene is
// watched once; a capture of each line.
//   node tools/scenes-flow.mjs <outDir> <named state> [<named state> ...]   (BASE_URL: a DEV server, 5173 by default; W / H, CHROME_PATH / CHROME_ARGS / READY_MS as
//   tools/play-flow.mjs)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const [outDir, ...names] = process.argv.slice(2);
if (!outDir || !names.length) throw new Error('usage: node tools/scenes-flow.mjs <outDir> <named state> [...]');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', W = +(process.env.W || 1280), H = +(process.env.H || 720), READY = +(process.env.READY_MS || 600000);
fs.mkdirSync(outDir, { recursive: true });
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
let failed = 0;
const check = (ok, what) => { console.log(`${ok ? 'OK ' : 'KO '} ${what}`); if (!ok) failed++; };
const server = await createServer({ root: path.resolve(import.meta.dirname, '..'), configFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-test', server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true } });
const G = await server.ssrLoadModule('/src/simulation/index.ts');
const S = await server.ssrLoadModule('/src/narrative/v2story.ts');
const { tx } = await server.ssrLoadModule('/src/narrative/text/index.ts');
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', `--window-size=${W},${H}`, '--hide-scrollbars'], defaultViewport: { width: W, height: H, deviceScaleFactor: 1 }, protocolTimeout: READY });
const errors = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  const page = await b.newPage();
  page.on('pageerror', (e) => { errors.push(e.message); console.log('[pageerror]', e.message); });
  for (const name of names) {
    const st = G.namedState(name), scene = S.pendingScene(st);
    check(!!scene, `${name}: a scene pending (${scene?.id})`);
    if (!scene) continue;
    const want = scene.steps.filter((x) => 'say' in x && (!x.if || x.if(st))).map((x) => [S.speakerName(st, S.speakerOf(st, x)), x.line(st)]);
    const walks = scene.steps.filter((x) => 'walk' in x && (!x.if || x.if(st))).map((x) => [x.walk, x.to]);
    await page.goto(`${BASE}?play=1&state=${name}&vis=0&noreload=1&cutscene=1`, { waitUntil: 'load', timeout: READY });
    await page.waitForFunction('window.__ready === true || window.__error', { timeout: READY });
    // the news of the slot that ended come first (the scene waits until they are read, journal Passe EVL1): read and closed as a player does
    for (let i = 0; i < 40; i++) {
      const on = await page.evaluate((go) => { if (document.querySelector('.pm-scene')) return true; [...document.querySelectorAll('.pm .pm-btn')].find((x) => x.textContent.includes(go))?.click(); return false; }, tx('ui.goOn'));
      if (on) break;
      await sleep(250);
    }
    const heard = [];
    for (let i = 0; i < 80 && heard.length < want.length; i++) {
      const q = await page.evaluate(() => { const s = document.querySelector('.pm-scene'); return s ? [s.querySelector('h2')?.textContent ?? '', s.querySelector('q')?.textContent ?? ''] : null; });
      if (q && q[1] && q[1] !== heard.at(-1)?.[1]) { heard.push(q); await sleep(150); await page.screenshot({ path: path.join(outDir, `${name}-${heard.length}.png`) }); await page.keyboard.press('e'); }
      await sleep(250);
    }
    check(JSON.stringify(heard) === JSON.stringify(want), `${name}: ${scene.id}'s lines, speakers and words: ${JSON.stringify(heard.map(([w, l]) => `${w}: ${l.slice(0, 40)}`))}`);
    await page.waitForFunction(() => !document.querySelector('.pm-scene'), { timeout: 20000 }).catch(() => {});
    // the camera given back to the hero (a second), then the scene marked watched
    await page.waitForFunction((id) => window.__game.state().flags[`scene:${id}`] === true, { timeout: 10000 }, scene.id).catch(() => {});
    for (const [who, to] of walks) {
      const at = await page.evaluate((w) => (w === 'player' ? [window.__plaza.player.pos.x, window.__plaza.player.pos.z] : window.__plaza.spotOf(w)), who);
      check(!!at && Math.hypot(at[0] - to[0], at[1] - to[1]) < 0.3, `${name}: ${who} walked to ${to} (${at?.map((v) => v.toFixed(2))})`);
    }
    const s = await page.evaluate(() => window.__game.state());
    check(s.flags[`scene:${scene.id}`] === true, `${name}: ${scene.id} watched`);
  }
  check(errors.length === 0, `no page error (${errors.length})`);
} finally { await b.close(); await server.close(); }
console.log(failed ? `${failed} check(s) failed` : 'all checks passed');
process.exit(failed ? 1 : 0);
