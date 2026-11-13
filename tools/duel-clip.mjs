// A short clip of the duel played by the computer, frame by frame (journal Passe SL3: the rhythm candidates of lot 2's sheet): the arena's own page, its loop held,
// stepped at `--fps` through its own update and render, each frame captured, then encoded by ffmpeg (FFMPEG or the PATH) into an MP4 (H.264, no sound) the
// sheet plays. The same seed and the same fighters on every candidate: only the rhythm changes.
//   node tools/duel-clip.mjs <out.mp4> "<extra query>" [--from=0] [--secs=20] [--fps=30] [--size=960x540]     (DEV server; BASE_URL, CHROME_PATH)
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const args = process.argv.slice(2), opt = (k, d) => args.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
const [out, extra = ''] = args.filter((a) => !a.startsWith('--'));
if (!out) { console.log('usage: node tools/duel-clip.mjs <out.mp4> "<extra query>" [--from=0] [--secs=20] [--fps=30] [--size=960x540]'); process.exit(1); }
const FPS = +opt('fps', 30), SECS = +opt('secs', 20), FROM = +opt('from', 0), [W, H] = opt('size', '960x540').split('x').map(Number);
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', FF = process.env.FFMPEG ?? 'ffmpeg';
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'duel-clip-'));
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--use-gl=angle', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--no-sandbox', `--window-size=${W},${H}`], defaultViewport: { width: W, height: H }, protocolTimeout: 600000 });
try {
  const page = await b.newPage();
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.evaluateOnNewDocument(() => Object.defineProperty(Navigator.prototype, 'getGamepads', { configurable: true, value: () => [] }));
  await page.evaluateOnNewDocument(`Object.defineProperty(window, '__arena', { configurable: true, get() { return undefined; }, set(v) { v.start = () => {}; Object.defineProperty(window, '__arena', { value: v, writable: true, configurable: true }); } });`);
  await page.goto(`${BASE}?scene=arena&vis=0&fps=off&tutorial=0${extra ? '&' + extra : ''}`, { waitUntil: 'load', timeout: 300000 });
  await page.waitForFunction('window.__ready === true || window.__error', { timeout: 300000 });
  await page.evaluate((from) => { const A = window.__arena; for (let t = 0; t < from; t += 1 / 60) A.update(1 / 60); }, FROM);
  const n = Math.round(SECS * FPS);
  for (let i = 0; i < n; i++) {
    const over = await page.evaluate((dt) => { const A = window.__arena; A.update(dt); A.render(); return A.auto?.over && A.auto.t - A.auto.end > 2; }, 1 / FPS);
    await page.screenshot({ path: path.join(tmp, `f${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 88 });
    if (over) break;
  }
  const info = await page.evaluate(() => ({ t: window.__arena.auto?.t, end: window.__arena.auto?.end }));
  execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(tmp, 'f%05d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', opt('crf', '26'), '-preset', 'slow', '-movflags', '+faststart', out]);
  console.log(`${out}: ${(fs.statSync(out).size / 1e6).toFixed(2)} MB, the duel at ${info.t?.toFixed(1)} s of ${info.end?.toFixed(1)} s`);
} finally { await b.close(); fs.rmSync(tmp, { recursive: true, force: true }); }
