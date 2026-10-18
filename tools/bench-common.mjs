// Shared plumbing of the GPU measurement tools (tools/perf.mjs, tools/startup.mjs, tools/overdraw.mjs): browser launch on a chosen
// adapter, the adapter's name, and the contention witness (tools/gpu-witness.ps1, Windows only).
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium']
  .filter(Boolean).find((p) => fs.existsSync(p));

/** Chrome on a hybrid laptop renders on the integrated GPU (the game's powerPreference 'high-performance' does not switch it):
 *  gpu = 'dgpu' adds --force_high_performance_gpu. vsync off + uncapped rAF: otherwise frame times quantise to the display's buckets. */
export async function launch(gpu = 'igpu', extra = []) {
  if (!exe) throw new Error('No Chrome/Edge found. Set CHROME_PATH.');
  const args = ['--use-gl=angle', '--use-angle=d3d11', '--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--no-sandbox', '--window-size=3840,2160',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-gpu-vsync', '--disable-frame-rate-limit', ...extra];
  if (gpu === 'dgpu') args.push('--force_high_performance_gpu');
  return puppeteer.launch({ executablePath: exe, headless: 'new', args, defaultViewport: null });
}

/** The maximised window's viewport on the dev laptop (2560 x 1600 panel at 175 %: 1463 x 724 CSS px, 2560 x 1267 rendered), as the visible
 *  runs of journal passes 6c-6j measured it: what an off-screen window emulates for `max`. */
export const MAX_VIEWPORT = { width: 1463, height: 724, deviceScaleFactor: 1.75 };

/** A headed Chrome window with vsync and the frame-rate limit left on (tools/cadence.mjs, journal pass 6 P4): the delivered cadence on the
 *  real display. Occlusion tracking and backgrounding off so a covered window keeps rendering. By default (journal pass 6k, the operator's
 *  request) it is discreet: placed off-screen, never brought to front, and the tools emulate MAX_VIEWPORT for `max`; `visible` puts the
 *  maximised window on the desktop as before. */
export async function launchHeaded(gpu = 'igpu', extra = [], { visible = false } = {}) {
  if (!exe) throw new Error('No Chrome/Edge found. Set CHROME_PATH.');
  const place = visible ? ['--start-maximized'] : ['--window-position=-3000,0', '--window-size=1480,860'];
  const args = ['--use-gl=angle', '--use-angle=d3d11', '--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--no-sandbox', ...place,
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
    '--disable-features=CalculateNativeWinOcclusion', '--no-first-run', '--no-default-browser-check', ...extra];
  if (gpu === 'dgpu') args.push('--force_high_performance_gpu');
  return puppeteer.launch({ executablePath: exe, headless: false, args, defaultViewport: null });
}

/** this browser's own GPU process id, asked to the browser itself (CDP SystemInfo, no system process scan), so the witness can tell
 *  this run's load from anybody else's */
export async function gpuPid(browser) {
  const p = await browser.newPage(); await p.goto('about:blank'); await p.close();
  try {
    const s = await browser.target().createCDPSession();
    const { processInfo } = await s.send('SystemInfo.getProcessInfo');
    await s.detach();
    const g = processInfo.find((x) => /gpu/i.test(x.type));
    return g ? String(g.id) : null;
  } catch { return null; }
}

export async function adapterOf(page) {
  return page.evaluate(() => {
    const gl = document.createElement('canvas').getContext('webgl2'); const e = gl?.getExtension('WEBGL_debug_renderer_info');
    const s = e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : '?'; gl?.getExtension('WEBGL_lose_context')?.loseContext(); return s;
  });
}

/** starts the contention witness; returns { samples(), stop() } (no-op off Windows or with enabled = false) */
export function witness(enabled = process.platform === 'win32') {
  if (!enabled || process.platform !== 'win32') return { samples: () => [], stop: () => {} , on: false };
  const file = path.join(os.tmpdir(), `gpu-witness-${process.pid}-${Date.now()}.log`);
  const ps1 = path.join(path.dirname(fileURLToPath(import.meta.url)), 'gpu-witness.ps1');
  const child = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ps1, '-Out', file, '-Secs', '7200'], { stdio: 'ignore' });
  const samples = () => {
    if (!fs.existsSync(file)) return [];
    return fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean).map((l) => {
      const [t, ...ps] = l.split(' ');
      return { t: +t, ps: ps.map((p) => { const m = p.match(/^(\d+)@(\d*):(\d+):(.*)$/); return m ? { pid: m[1], phys: m[2], u: +m[3], name: m[4] } : null; }).filter(Boolean) };
    });
  };
  return { on: true, samples, stop: () => { try { child.kill(); } catch {} try { fs.unlinkSync(file); } catch {} } };
}

/** starts the package energy witness (tools/energy-witness.ps1, Windows RAPL counters); returns { samples(), stop(), on } */
export function energyWitness(enabled = process.platform === 'win32') {
  if (!enabled || process.platform !== 'win32') return { samples: () => [], stop: () => {}, on: false };
  const file = path.join(os.tmpdir(), `energy-witness-${process.pid}-${Date.now()}.log`);
  const ps1 = path.join(path.dirname(fileURLToPath(import.meta.url)), 'energy-witness.ps1');
  const child = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ps1, '-Out', file, '-Secs', '7200'], { stdio: 'ignore' });
  // a line that does not parse is reported once and left out (journal pass 6i: "1,011E+15" turned every power into NaN, silently)
  let warned = false;
  const parse = (l) => {
    const [t, ms, pkg, cores] = l.split(' ').map(Number);
    if ([t, ms, pkg, cores].every(Number.isFinite)) return { t, ms, pkg, cores };
    if (!warned) { warned = true; console.log(`[energy-witness] unparsable sample "${l}": left out`); }
    return null;
  };
  const samples = () => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean).map(parse).filter(Boolean) : []);
  return { on: true, samples, stop: () => { try { child.kill(); } catch {} try { fs.unlinkSync(file); } catch {} } };
}

/** mean package and SoC (package minus cores) power, W, between the first and last energy samples inside [t0, t1] (epoch ms) */
export function meanPower(samples, t0, t1) {
  const s = samples.filter((x) => x.t >= t0 && x.t <= t1 && x.ms > 0);
  if (s.length < 2) return { pkg: NaN, soc: NaN, secs: 0 };
  const a = s[0], b = s.at(-1), dt = (b.ms - a.ms) / 1000, pWh = 3.6e-9;
  return { pkg: ((b.pkg - a.pkg) * pWh) / dt, soc: ((b.pkg - b.cores - (a.pkg - a.cores)) * pWh) / dt, secs: dt };
}

/** foreign GPU use inside [t0, t1] (epoch ms) on the adapter this run uses: other processes above thr % (the desktop compositor excluded) */
export function foreignUse(samples, t0, t1, mine, thr = 15) {
  const all = samples.filter((s) => s.t >= t0 - 1500 && s.t <= t1);
  const phys = new Set(all.flatMap((s) => s.ps.filter((p) => p.pid === mine).map((p) => p.phys)));
  const out = [];
  for (const s of all) {
    const by = {};
    for (const p of s.ps) if (p.pid !== mine && p.name !== 'dwm' && (!phys.size || phys.has(p.phys))) by[p.pid] = { u: (by[p.pid]?.u ?? 0) + p.u, name: p.name };
    for (const [pid, v] of Object.entries(by)) if (v.u > thr) out.push(`${v.name}:${pid}:${v.u}%`);
  }
  return [...new Set(out)];
}

/** the URL with the frame cap off unless it sets one (`fps=`): the GPU and boot probes measure the uncapped loop (the game defaults to
 *  `e60` since journal pass 6c, `a60` since pass 6h; tools/cadence.mjs measures what the player sees instead) */
export const uncapped = (url) => (/[?&]fps=/.test(url) ? url : `${url}${url.includes('?') ? '&' : '?'}fps=off`);

export const quantile =(xs, p) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : NaN; };
export const mean = (xs) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
