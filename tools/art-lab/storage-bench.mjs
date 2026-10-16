// Contract amendment C: storage / loading of a baked sheet, measured on PRODUCTION builds (art-lab/characters/runtime-integration-contract.md).
// Three throw-away copies of the current tree (src, index.html, configs) in <workDir>, built with Vite and served with `vite preview`:
//   base   no baked asset (the game as today)
//   module C1: a generated TypeScript module (raw RGBA as base64 + frame table + SHA-256) imported statically
//   png    C2: the versioned Aseprite export (PNG + JSON) emitted as hashed assets, fetched and decoded at boot (exact decoder, SHA-256 check)
// (C3, a pre-baked atlas PNG of every baked frame, is C2 with one file instead of one per asset: identical for a single asset.)
// Measures: build time (median of N), bundle files raw / gzip, boot (asset ready ms, atlas build ms, time to __ready), JS heap, atlas size,
// draw calls, and that the decoded atlas bytes are identical between module and png.
//   node tools/art-lab/storage-bench.mjs <workDir> <id> [builds=3] [loads=3]
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { decodePng } from './png.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const [work, id, nb = '3', nl = '3'] = process.argv.slice(2);
if (!work || !id) { console.error('usage: node tools/art-lab/storage-bench.mjs <workDir> <id> [builds] [loads]'); process.exit(2); }
const VITE = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
const exp = path.join(ROOT, 'art-lab', 'characters', 'exports', id);
const png = fs.readFileSync(`${exp}.png`), meta = JSON.parse(fs.readFileSync(`${exp}.json`, 'utf8'));
const sha = crypto.createHash('sha256').update(png).digest('hex'), img = decodePng(png);
const f0 = meta.frames[0], fw = f0.sourceSize.w, fh = f0.sourceSize.h, k = fh / 48;

// the boot hook each variant adds to main.ts: build the sheet, time it, hand it to the App (no spawn: loading only)
const common = `
import type { BakedSheet } from './characters/BakedSprites';
const __t0 = performance.now();
function __sheet(rgba: Uint8Array, w: number): BakedSheet {
  const frames = ${JSON.stringify(meta.frames.map((f) => f.frame))}.map((r: { x: number; y: number }, i: number) => {
    const out = new Uint8Array(${fw * fh * 4});
    for (let y = 0; y < ${fh}; y++) out.set(rgba.subarray(((r.y + y) * w + r.x) * 4, ((r.y + y) * w + r.x + ${fw}) * 4), y * ${fw * 4});
    return { dir: 'down' as const, anim: 'idle' as const, i, rgba: out };
  });
  return { id: '${id}', runtimeUse: 'lab', sha256: '${sha}', k: ${k}, frames };
}
`;
const VARIANTS = {
  base: null,
  module: {
    files: { [`src/baked/${id}.baked.ts`]: `// GENERATED (storage bench C1): raw RGBA of ${id}.png, SHA-256 ${sha}\nexport default { w: ${img.W}, h: ${img.H}, rgba: '${img.rgba.toString('base64')}' };\n` },
    head: `import __baked from './baked/${id}.baked';${common}`,
    boot: `(async () => { const load = async () => { const bin = atob(__baked.rgba), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); return __sheet(u8, __baked.w); };
  (window as any).__benchLoad = load; const s = await load(); (window as any).__bench = { assetMs: performance.now() - __t0 }; return { sheets: [s], spawns: [] }; })()`,
  },
  png: {
    files: { [`src/baked/${id}.png`]: png, [`src/baked/${id}.json`]: JSON.stringify(meta) },
    head: `import __pngUrl from './baked/${id}.png?url';\nimport { decodePng as __decode } from './lab/bakedLoader';${common}`,
    boot: `(async () => { const load = async () => { const bytes = new Uint8Array(await (await fetch(__pngUrl)).arrayBuffer());
  const h = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map((v) => v.toString(16).padStart(2, '0')).join('');
  if (h !== '${sha}') throw new Error('baked PNG hash mismatch');
  const d = await __decode(bytes); return __sheet(d.rgba, d.w); };
  (window as any).__benchLoad = load; const s = await load(); (window as any).__bench = { assetMs: performance.now() - __t0 }; return { sheets: [s], spawns: [] }; })()`,
  },
};

const cp = (from, to) => { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.cpSync(from, to, { recursive: true }); };
const gz = (b) => zlib.gzipSync(b, { level: 9 }).length;
const report = { id, sha256: sha, sheetBytes: { png: png.length, json: Buffer.byteLength(JSON.stringify(meta)), rawRgba: img.rgba.length }, variants: {} };
fs.mkdirSync(work, { recursive: true });
for (const [name, v] of Object.entries(VARIANTS)) {
  const dir = path.join(work, name);
  fs.rmSync(dir, { recursive: true, force: true });
  for (const f of ['index.html', 'vite.config.ts', 'tsconfig.json', 'package.json', 'src']) cp(path.join(ROOT, f), path.join(dir, f));
  if (v) {
    for (const [f, c] of Object.entries(v.files)) { fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), c); }
    const mp = path.join(dir, 'src', 'main.ts'); let m = fs.readFileSync(mp, 'utf8');
    m = m.replace(/(import \{ Hud \} from '\.\/debug\/Hud';\r?\n)/, `$1${v.head}\n`);
    m = m.replace(/(const app = new App\(opts\);)/, `opts.baked = ${v.boot};\n$1`);
    if (!m.includes('opts.baked = (async')) throw new Error(`${name}: main.ts hook not inserted`);
    fs.writeFileSync(mp, m);
  }
  const times = [];
  for (let i = 0; i < Number(nb); i++) { const t = Date.now(); execFileSync(process.execPath, [VITE, 'build', '--logLevel', 'error'], { cwd: dir, stdio: 'pipe' }); times.push(Date.now() - t); }
  const files = [];
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else { const b = fs.readFileSync(p); files.push({ file: path.relative(path.join(dir, 'dist'), p).replace(/\\/g, '/'), bytes: b.length, gzip: gz(b) }); } } };
  walk(path.join(dir, 'dist'));
  const js = files.filter((f) => f.file.endsWith('.js'));
  report.variants[name] = { buildMs: times, buildMedianMs: [...times].sort((a, b) => a - b)[Math.floor(times.length / 2)], files,
    js: { bytes: js.reduce((s, f) => s + f.bytes, 0), gzip: js.reduce((s, f) => s + f.gzip, 0) }, all: { bytes: files.reduce((s, f) => s + f.bytes, 0), gzip: files.reduce((s, f) => s + f.gzip, 0) } };
  console.log(name, 'build ms', times.join(' '), 'js', report.variants[name].js);
}

// boot measurements on `vite preview` of each dist, interleaved, cache disabled (a first visit)
const servers = Object.keys(VARIANTS).map((name, i) => ({ name, port: 5191 + i, proc: spawn(process.execPath, [VITE, 'preview', '--port', String(5191 + i), '--strictPort', '--host', '127.0.0.1'], { cwd: path.join(work, name), stdio: 'ignore' }) }));
await new Promise((r) => setTimeout(r, 2500));
const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--use-gl=angle', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--no-sandbox', '--window-size=1920,1080', '--enable-precise-memory-info', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'], defaultViewport: { width: 1920, height: 1080 } });
try {
  for (let round = 0; round < Number(nl); round++) for (const s of servers) {
    const page = await browser.newPage(); await page.setCacheEnabled(false);
    page.on('pageerror', (e) => console.log('[pageerror]', s.name, e.message));
    await page.goto(`http://127.0.0.1:${s.port}/?clean=1&freeze=7.3&intro=0&camera=B&player=2,1.5`, { waitUntil: 'load' });
    await page.waitForFunction('window.__ready === true || !!window.__error', { timeout: 180000 });
    const r = await page.evaluate(async () => {
      const a = window.__app, at = a.atlas;
      const h = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(at.rgba.buffer)))].map((v) => v.toString(16).padStart(2, '0')).join('');
      a.render(); const calls = a.renderer.info.render.calls;
      // the loader alone, re-run 20 times on an idle page (the PNG comes from the HTTP cache after the first fetch): its own cost
      const iso = []; if (window.__benchLoad) for (let i = 0; i < 20; i++) { const t = performance.now(); await window.__benchLoad(); iso.push(performance.now() - t); }
      iso.sort((x, y) => x - y);
      return { error: window.__error ?? null, readyMs: performance.now(), atlasBuildMs: at.buildMs, atlas: [at.width, at.height], atlasSha: h.slice(0, 16), assetMs: window.__bench?.assetMs ?? null, loaderMedianMs: iso.length ? iso[10] : null, loaderMaxMs: iso.length ? iso[19] : null,
        heapMB: performance.memory ? performance.memory.usedJSHeapSize / 1048576 : null, drawCalls: calls,
        transfer: performance.getEntriesByType('resource').filter((e) => /\.(js|png|json)$/.test(e.name)).map((e) => ({ name: e.name.split('/').pop(), bytes: e.transferSize, ms: Math.round(e.duration) })) };
    });
    (report.variants[s.name].loads ??= []).push(r);
    console.log(s.name, round, JSON.stringify({ ...r, transfer: undefined }));
    await page.close();
  }
} finally { await browser.close(); for (const s of servers) s.proc.kill(); }
fs.writeFileSync(path.join(work, 'report.json'), JSON.stringify(report, null, 1));
console.log('report', path.join(work, 'report.json'));
