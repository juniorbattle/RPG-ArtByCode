// The sound across a real page change (lot S1, journal Passe SN3; the fiche's SA-15: « le comportement exact du navigateur reste à tester sur une vraie
// navigation »): a version 2 game on a DEV server, Chrome under its real autoplay rule. Nothing before a gesture; a gesture starts the sound; the
// hero walks through a way out, the sound goes down with the screen, the next page takes the music up where it was, by itself if the browser allows
// it, else on the next gesture. A tab that never gave a gesture stays silent. Exit 1 on a failure.
//   node tools/audio/page-proof.mjs     (BASE_URL, W / H, CHROME_PATH / CHROME_ARGS / READY_MS as tools/detshots.mjs)
// puppeteer's evaluate runs with userGesture: true, so it counts as a gesture (journal Passe SN3): the page under test is read by a probe written in at
// its loading, through the console, and no evaluate touches it. A real window, off-screen as tools/cadence.mjs.
import { createRequire } from 'node:module';
import fs from 'node:fs';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', W = +(process.env.W || 1280), H = +(process.env.H || 720), READY = +(process.env.READY_MS || 300000);
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
const b = await puppeteer.launch({ executablePath: exe, headless: false, args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', '--window-position=-3000,0', `--window-size=${W + 40},${H + 140}`, '--autoplay-policy=document-user-activation-required', '--no-first-run', '--no-default-browser-check', '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'], defaultViewport: { width: W, height: H } });
let failed = 0, errors = 0;
const check = (ok, what) => { console.log(`${ok ? 'OK ' : 'KO '} ${what}`); if (!ok) failed++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const Q = 'play=1&name=Aster&vis=0&fps=off&cutscene=0';

/** the page's state, written to the console every 150 ms; `witness`: a context made at the loading, without any gesture, and its state */
const probe = (witness) => `(() => { let w = null; const log = () => { const s = window.__sound; if (${witness} && !w) w = new AudioContext(); console.log('PROBE ' + JSON.stringify({ ready: window.__ready === true, error: window.__error ?? null, sound: !!s, ctx: s?.ctx?.state ?? null, now: s?.nowPlaying?.() ?? null, db: s?.ctx ? s.meter() : null, fading: !!document.querySelector('.pm-fade'), witness: w?.state ?? null })); }; setInterval(log, 150); })();`;
async function watched(witness = false) {
  const page = await b.newPage(), st = { last: null, fade: null };
  page.on('pageerror', (e) => { errors++; console.log('[pageerror]', e.message); });
  page.on('console', (m) => { const t = m.text(); if (t.startsWith('PROBE ')) { st.last = JSON.parse(t.slice(6)); if (st.last.fading && !st.fade) st.fade = st.last; } else if (m.type() === 'error') console.log('[console]', t); });
  await page.evaluateOnNewDocument(probe(witness));
  return { page, st, until: async (f, ms = READY) => { const t = Date.now(); while (Date.now() - t < ms) { if (st.last && f(st.last)) return st.last; await wait(50); } return st.last; } };
}

try {
  const { page, st, until } = await watched();
  await page.goto(`${BASE}?${Q}&state=v2-forecourt-morning`, { waitUntil: 'load', timeout: READY });
  await until((s) => s.ready && s.sound);
  check(!st.last.error, `the page is ready (${st.last.error ?? 'no error'})`);
  await wait(800);
  check(st.last.ctx === null, `before any gesture there is no context (${st.last.ctx})`);
  await page.mouse.click(W / 2, H / 2);
  await until((s) => s.ctx === 'running', 10000);
  await wait(4000);
  const s1 = st.last;
  check(s1.now?.key === 'tune:1842:morning' && s1.now.pos > 3 && s1.now.pos < 6, `the gesture started the sound: ${s1.ctx}, ${s1.now?.key} at ${s1.now?.pos?.toFixed(2)} s`);
  check(s1.db > -60, `it is heard: ${s1.db?.toFixed(1)} dB at the output`);

  // the way out to the training ground, the hero set in its lane (an evaluate on the first page: a gesture was already given), the key held; the real location.assign
  await page.evaluate(() => { const P = window.__plaza, x = P.place.exits.find((w) => w.to === 'training'); P.player.pos.set(x.out.x0 > 0 ? x.out.x0 + 0.4 : x.out.x1 - 0.4, 0, (x.lane.z0 + x.lane.z1) / 2); });
  const nav = page.waitForNavigation({ waitUntil: 'load', timeout: READY });
  await page.keyboard.down('d');
  await nav;
  const left = st.fade;
  await page.keyboard.up('d');
  st.last = null;
  await until((s) => s.ready && s.sound);
  await wait(2500);
  const s2 = st.last;
  console.log(`   next page, ${s2.ctx === 'running' ? 'no gesture needed' : `the browser holds it (${s2.ctx})`}`);
  let gesture = false;
  if (s2.ctx !== 'running') { await page.mouse.click(W / 2, H / 2); await until((s) => s.ctx === 'running', 10000); gesture = true; await wait(2500); }
  const s3 = st.last;
  check(s3.ctx === 'running', `the sound runs on the next page${gesture ? ' after a gesture' : ' without one'}`);
  check(s3.now?.key === left?.now?.key, `the same piece on the next page: ${s3.now?.key}`);
  check(left && s3.now?.pos > left.now.pos && s3.now.pos < left.now.pos + 5, `taken up where it was: left near ${left?.now?.pos?.toFixed(2)} s, at ${s3.now?.pos?.toFixed(2)} s after some 2.5 s here`);
  check(s3.db > -60, `heard again after the fade: ${s3.db?.toFixed(1)} dB`);
  await page.close();

  // the negative control and the witness: a new tab where nothing touches the page: no record, no engine context; a context made there does not run
  const f = await watched(true);
  await f.page.goto(`${BASE}?${Q}&state=v2-forecourt-morning`, { waitUntil: 'load', timeout: READY });
  await f.until((s) => s.ready && s.sound);
  await wait(1200);
  check(f.st.last.ctx === null, `a tab without a gesture stays silent (${f.st.last.ctx})`);
  check(f.st.last.witness === 'suspended', `the autoplay rule is on: a context made without a gesture stays ${f.st.last.witness}`);
  await f.page.close();
} finally { await b.close(); }
check(errors === 0, `no page error (${errors})`);
console.log(failed ? `\nFAILED ${failed}` : '\nall checks passed');
if (failed) process.exitCode = 1;
