// How a browser decodes the baked files (journal Passe SN10): each file of src/audio/baked/ decoded by the browser's decodeAudioData at 48 kHz, against ffmpeg's own
// decode of the same file (which honours Opus's pre-skip and the M4A's edit list) and the catalogue's length: the frames it gives more or less, where the sound
// starts (the codec's delay left in, or not), and where the engine (src/audio/align.ts) starts it: `alignLoop` on a loop, `startOf` on an intro or a jingle with
// what the loops showed of the format. Then the same alignment on decodes that keep the delays (ffmpeg told to ignore them), as a decoder that does not honour
// them gives: each loop's true start must be found. Exit 1 when the engine misses a start by more than a sample, or a decode fails.
//   node tools/audio/decode-proof.mjs [--browser=chrome|edge|firefox] [name ...]      (FFMPEG or the PATH; CHROME_PATH / FIREFOX_PATH)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
import { build } from 'vite';

const ROOT = path.resolve(import.meta.dirname, '..', '..'), BAKED = path.join(ROOT, 'src/audio/baked'), args = process.argv.slice(2);
const browser = args.find((a) => a.startsWith('--browser='))?.slice(10) ?? 'chrome', names = args.filter((a) => !a.startsWith('--'));
const ffmpeg = process.env.FFMPEG ?? 'ffmpeg', cat = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/audio/catalogue.json'), 'utf8'));
const frames = {}, loops = new Set();
for (const p of Object.values(cat.pieces)) { for (const f of p.files) { frames[f] = p.frames; if (p.kind !== 'once') loops.add(f); } if (p.intro) frames[p.intro.file] = p.intro.frames; }
// the duel's sounds and the crowd (journal Passe SN16): each take its length, the murmur a loop
for (const e of Object.values(cat.sfx ?? {})) e.files.forEach((f, k) => { frames[f] = e.frames[k]; if (e.loop) loops.add(f); });
const idOf = (f) => f.replace(/\.[^.]+$/, ''), fmtOf = (f) => (f.endsWith('.webm') ? 'webm' : 'm4a');
// the loops first: what they show of a format's delays starts the intros and the jingles
const files = fs.readdirSync(BAKED).filter((f) => /\.(webm|m4a)$/.test(f) && (!names.length || names.some((n) => f.startsWith(n)))).sort((a, b) => (loops.has(idOf(b)) - loops.has(idOf(a))) || a.localeCompare(b));
const W = 24000;

// the engine's pure alignment, bundled for the page and for Node
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'decode-proof-'));
fs.writeFileSync(path.join(tmp, 'entry.ts'), `export * from '${ROOT.replaceAll('\\', '/')}/src/audio/align';\n`);
await build({ root: ROOT, configFile: false, logLevel: 'error', cacheDir: path.join(tmp, '.vite'), publicDir: false, build: { write: true, outDir: path.join(tmp, 'out'), emptyOutDir: true, minify: false, lib: { entry: path.join(tmp, 'entry.ts'), formats: ['iife', 'es'], name: 'ALIGN', fileName: (f) => `align.${f === 'es' ? 'mjs' : 'js'}` } } });
const align = fs.readFileSync(path.join(tmp, 'out', 'align.js'), 'utf8').replace(/\bvar ALIGN\b/, 'window.ALIGN'), A = await import(pathToFileURL(path.join(tmp, 'out', 'align.mjs')).href);

/** a stereo f32 decode by ffmpeg, as a buffer the alignment reads; `raw`: the codec's delays kept (the M4A's edit list ignored, Opus's pre-skip not applied) */
function decode(file, raw = false) {
  const extra = raw ? (file.endsWith('.m4a') ? ['-ignore_editlist', '1'] : ['-flags2', '+skip_manual']) : [];
  const x = new Float32Array(execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', ...extra, '-i', file, '-f', 'f32le', '-ac', '2', '-ar', '48000', 'pipe:1'], { maxBuffer: 1 << 30 }).buffer.slice(0));
  const n = x.length / 2, ch = [new Float32Array(n), new Float32Array(n)]; for (let i = 0; i < n; i++) { ch[0][i] = x[2 * i]; ch[1][i] = x[2 * i + 1]; }
  return { length: n, sampleRate: 48000, numberOfChannels: 2, getChannelData: (c) => ch[c] };
}
/** where ffmpeg's decode starts in another: the lag of the best match over the first half second (a sound shorter than that, the interface's click of lot S2,
 *  matched over what it has: past its end both read silence) */
function lagOf(head, ref) {
  let best = 0, lag = 0;
  for (let k = -256; k <= 4096; k++) { let s = 0, e1 = 0, e2 = 0; for (let i = 2048; i < W - 4096; i += 2) { const x = head[i + k] ?? 0, y = ref[i] ?? 0; s += x * y; e1 += x * x; e2 += y * y; } const c = s / Math.sqrt(e1 * e2 + 1e-20); if (c > best) { best = c; lag = k; } }
  return { lag, best };
}

let failed = 0;
const server = http.createServer((req, res) => {
  if (req.url === '/') { res.setHeader('content-type', 'text/html'); res.end('<!doctype html><title>decode</title>'); return; }
  const f = path.join(BAKED, decodeURIComponent(req.url.slice(1)));
  if (!f.startsWith(BAKED) || !fs.existsSync(f)) { res.statusCode = 404; res.end(); return; }
  res.setHeader('content-type', f.endsWith('.webm') ? 'audio/webm' : 'audio/mp4'); res.end(fs.readFileSync(f));
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const exe = browser === 'firefox' ? [process.env.FIREFOX_PATH, 'C:/Program Files/Mozilla Firefox/firefox.exe', '/usr/bin/firefox'] : browser === 'edge' ? ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'] : [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'];
const b = await puppeteer.launch({ browser: browser === 'firefox' ? 'firefox' : 'chrome', executablePath: exe.filter(Boolean).find((p) => fs.existsSync(p)), headless: true, args: browser === 'firefox' ? [] : ['--no-sandbox'] });
try {
  const page = await b.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.addScriptTag({ content: align });
  console.log(await b.version());
  const known = {};
  for (const f of files) {
    const id = idOf(f), n = frames[id], fmt = fmtOf(f), loop = loops.has(id);
    const r = await page.evaluate(async (url, n, W, loop, fmt, known) => {
      try {
        const ab = await (await fetch(url)).arrayBuffer(), c = new OfflineAudioContext(2, 48000, 48000), buf = await c.decodeAudioData(ab), d = buf.getChannelData(0);
        const a = loop ? window.ALIGN.alignLoop(buf, n, 48000, fmt) : { offset: window.ALIGN.startOf(buf, n, 48000, fmt, known[fmt]), how: 'start' };
        return { ok: true, len: buf.length, head: Array.from(d.subarray(0, W)), offset: a.offset, how: a.how };
      } catch (e) { return { ok: false, error: String(e) }; }
    }, `/${f}`, n, W, loop, fmt, known);
    if (!r.ok) { failed++; console.log(`KO ${f}: ${r.error}`); continue; }
    if (loop && known[fmt] === undefined) known[fmt] = r.offset;
    const { lag, best } = lagOf(Float32Array.from(r.head), decode(path.join(BAKED, f)).getChannelData(0)), ok = Math.abs(r.offset - lag) <= 1 && best > 0.9;
    if (!ok) failed++;
    console.log(`${ok ? 'OK' : 'KO'} ${f.padEnd(22)} frames ${n}, browser ${r.len} (${r.len - n >= 0 ? '+' : ''}${r.len - n}), the sound starts at ${lag} (match ${best.toFixed(4)}), the engine starts it at ${r.offset} (${r.how})`);
  }
} finally { await b.close(); server.close(); }

// decodes that keep the delays: the true start is the codec's delay; the engine must find it on every loop
for (const f of files.filter((x) => loops.has(idOf(x)))) {
  const id = idOf(f), fmt = fmtOf(f), raw = decode(path.join(BAKED, f), true), clean = decode(path.join(BAKED, f)).getChannelData(0), { lag } = lagOf(raw.getChannelData(0).subarray(0, W), clean), a = A.alignLoop(raw, frames[id], 48000, fmt);
  const ok = a.offset === lag; if (!ok) failed++;
  console.log(`${ok ? 'OK' : 'KO'} kept delays: ${f.padEnd(22)} ${raw.length - frames[id]} samples more, the true start ${lag}, the engine aligns at ${a.offset} (${a.how})`);
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log(failed ? `\nFAILED ${failed}` : '\nall files aligned');
if (failed) process.exitCode = 1;
