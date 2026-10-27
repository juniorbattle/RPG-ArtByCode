// The version 2's ways between places walked in the browser (journal Passe VP5, the operator's « entrées / sorties comme dans un final
// fantasy 9 »): for every way out of every place (the quay's two ends, the squares' side streets and quay gates), the page of a version 2 game
// at that place (a named state), the hero set in the way's lane (the quay: at its end) with the key toward it held; the screen must darken,
// the move be saved (the next place in the state) and the next page's address carry `arrive=<this place>`; that page opened, the hero must
// stand at its way in from here, inside its walk, and the way back must be among its tags. Captures each arrival (the interface hidden).
//   node tools/exits-proof.mjs <outDir>   (DEV server: named states; BASE_URL, W / H, CHROME_PATH / CHROME_ARGS / READY_MS as tools/detshots.mjs)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const [outDir] = process.argv.slice(2);
if (!outDir) throw new Error('usage: node tools/exits-proof.mjs <outDir>');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', W = +(process.env.W || 1280), H = +(process.env.H || 720), READY = +(process.env.READY_MS || 600000);
fs.mkdirSync(outDir, { recursive: true });
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', `--window-size=${W},${H}`, '--hide-scrollbars'], defaultViewport: { width: W, height: H, deviceScaleFactor: 1 }, protocolTimeout: READY });
let failed = 0, errors = 0;
const check = (ok, what) => { console.log(`${ok ? 'OK ' : 'KO '} ${what}`); if (!ok) failed++; };
// a version 2 game at each place (named states of src/simulation/named.ts), by day
const STATE = { district: 'v2-day1-morning', forecourt: 'v2-forecourt-midday', training: 'v2-training-midday', lanterns: 'v2-square-afternoon' };
const KEY = { west: 'a', east: 'd', south: 's' };
try {
  const page = await b.newPage();
  page.on('pageerror', (e) => { errors++; console.log('[pageerror]', e.message); });
  const open = async (q) => {
    await page.goto(`${BASE}${q}`, { waitUntil: 'load', timeout: READY });
    await page.waitForFunction('window.__ready === true || window.__error', { timeout: READY });
    check(!(await page.evaluate(() => window.__error ?? null)), `page ${q} ready`);
    await page.evaluate(() => { for (const b of document.querySelectorAll('.pm-overlay .pm-btn')) { b.click(); break; } });
  };
  // the ways of src/simulation/v2places.ts (V2_EXITS; tests/v2-exits.test.mjs holds this copy to it)
  const LIST = {
    district: [{ to: 'lanterns', side: 'west' }, { to: 'forecourt', side: 'east' }],
    forecourt: [{ to: 'lanterns', side: 'west' }, { to: 'training', side: 'east' }, { to: 'district', side: 'south' }],
    training: [{ to: 'forecourt', side: 'west' }],
    lanterns: [{ to: 'forecourt', side: 'east' }, { to: 'district', side: 'south' }],
  };
  for (const [place, exits] of Object.entries(LIST)) for (const e of exits) {
    await open(`?play=1&noreload=1&state=${STATE[place]}&name=Aster&vis=0&fps=off&cutscene=0`);
    // the hero in the way's lane (a square: past its end; the quay: at its end)
    const set = await page.evaluate(({ side, to }) => {
      if (window.__plaza) {
        const P = window.__plaza, x = P.place.exits.find((w) => w.to === to);
        const at = side === 'south' ? [0, 6.2] : [x.out.x0 > 0 ? x.out.x0 + 0.4 : x.out.x1 - 0.4, (x.lane.z0 + x.lane.z1) / 2];
        P.player.pos.set(at[0], 0, at[1]); return at;
      }
      const A = window.__app, x = side === 'east' ? 25.95 : -13.45;
      A.actors.player.pos.set(x, 0, 0.1); return [x, 0.1];
    }, e);
    await page.keyboard.down(KEY[e.side]);
    const go = await page.waitForFunction('window.__go', { timeout: 120000 }).then((h) => h.jsonValue()).catch(() => null);
    await page.keyboard.up(KEY[e.side]);
    const st = await page.evaluate(() => window.__game.state());
    const faded = await page.evaluate(() => +(document.querySelector('.pm-fade')?.style.opacity ?? 0));
    check(!!go && go.includes(`arrive=${place}`) && st.place === e.to && faded === 1, `${place} -> ${e.to} by its ${e.side} way (hero at ${set}): the screen dark, the move saved, ${go}`);
    if (!go) continue;
    // the next page: the hero at its way in from here
    await open(go.replace(/^\?/, '?'));
    const arr = await page.evaluate((from) => {
      if (window.__plaza) { const P = window.__plaza, w = P.place.exits.find((x) => x.to === from); return { at: [P.player.pos.x, P.player.pos.z], spawn: w?.spawn ?? null, back: window.__exits.state().map((t) => t.to) }; }
      const A = window.__app; return { at: [A.actors.player.pos.x, A.actors.player.pos.z], spawn: null, back: window.__exits?.state().map((t) => t.to) ?? [] };
    }, place);
    const near = arr.spawn ? Math.hypot(arr.at[0] - arr.spawn[0], arr.at[1] - arr.spawn[1]) < 0.05 : e.to === 'district' && (place === 'forecourt' ? arr.at[0] > 23 : arr.at[0] < -11);
    check(near && arr.back.includes(place), `${e.to}: arrived at the way in from ${place} (${arr.at.map((v) => v.toFixed(2))}), the way back among its tags (${arr.back})`);
    await page.addStyleTag({ content: '.pm{display:none!important}' });
    await page.screenshot({ path: path.join(outDir, `${place}-to-${e.to}.png`) });
  }
} finally { await b.close(); }
console.log(failed || errors ? `FAILED: ${failed} check(s), ${errors} page error(s)` : 'every way walked both ways');
process.exit(failed || errors ? 1 : 0);
