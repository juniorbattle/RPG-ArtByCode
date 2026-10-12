// Labelled review contact sheet of an exported sprite sheet (PNG + Aseprite JSON), nearest-neighbour on a neutral background.
//   node tools/art-lab/make-contact-sheet.mjs <sheet.png> [meta.json] [--out file.png] [--scale 4] [--cols 8] [--frame 32x48]
//                                             [--bg neutral|dark|light|#rrggbb] [--caption "text"]
// Metadata is Aseprite's `--data sheet.json --format json-array|json-hash --list-tags`; without it, --frame WxH slices a grid (or
// the whole image is one frame). One row per tag (frames outside every tag go to "untagged"). Default output:
// art-lab/characters/reviews/<sheet name>-contact.png. Needs Chrome / Edge (CHROME_PATH), like the other tools; no new dependency.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2), pos = [], opt = {};
for (let i = 0; i < args.length; i++) { if (args[i].startsWith('--')) opt[args[i].slice(2)] = args[++i]; else pos.push(args[i]); }
const [sheetArg, metaArg] = pos;
if (!sheetArg) { console.error('usage: node tools/art-lab/make-contact-sheet.mjs <sheet.png> [meta.json] [--out f.png] [--scale 4] [--cols 8] [--frame WxH] [--bg neutral|dark|light|#rrggbb] [--caption "text"]'); process.exit(2); }
const sheetPath = path.resolve(sheetArg);
if (!fs.existsSync(sheetPath)) { console.error(`sheet not found: ${sheetArg}`); process.exit(2); }
const scale = Math.max(1, Math.round(Number(opt.scale ?? 4))), cols = Math.max(1, Math.round(Number(opt.cols ?? 8)));
const BGS = { neutral: '#808080', dark: '#14171f', light: '#d6d6d6' };
const bg = BGS[opt.bg ?? 'neutral'] ?? (/^#[0-9a-f]{6}$/i.test(opt.bg ?? '') ? opt.bg : null);
if (!bg) { console.error('--bg must be neutral, dark, light or #rrggbb'); process.exit(2); }
const out = path.resolve(opt.out ?? path.join('art-lab', 'characters', 'reviews', `${path.basename(sheetPath, path.extname(sheetPath))}-contact.png`));

const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
  .filter(Boolean).find((p) => fs.existsSync(p));
if (!exe) { console.error('No Chrome/Edge found. Set CHROME_PATH.'); process.exit(2); }

const meta = metaArg ? JSON.parse(fs.readFileSync(path.resolve(metaArg), 'utf8')) : null;
const png = `data:image/png;base64,${fs.readFileSync(sheetPath).toString('base64')}`;
const caption = opt.caption ?? '';

const browser = await puppeteer.launch({ executablePath: exe, headless: 'new' });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 600 });
  await page.setContent('<!doctype html><body style="margin:0"><canvas id="c"></canvas></body>');
  const info = await page.evaluate(async (uri, meta, o) => {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('cannot decode the PNG')); i.src = uri; });
    // --- frames + tags (Aseprite json-array / json-hash, or a grid) ---
    let frames = [], tags = [];
    if (meta) {
      const raw = Array.isArray(meta.frames) ? meta.frames.map((f, i) => [f.filename ?? String(i), f]) : Object.entries(meta.frames ?? {});
      if (!raw.length) throw new Error('metadata has no "frames" (expected Aseprite json-array or json-hash)');
      frames = raw.map(([name, f]) => {
        const r = f.frame, s = f.sourceSize ?? { w: r.w, h: r.h }, ss = f.spriteSourceSize ?? { x: 0, y: 0 };
        if (f.rotated) throw new Error('rotated frames are not supported');
        return { name, x: r.x, y: r.y, w: r.w, h: r.h, sw: s.w, sh: s.h, ox: ss.x, oy: ss.y, ms: f.duration ?? 100 };
      });
      tags = (meta.meta?.frameTags ?? []).map((t) => ({ name: t.name, from: t.from, to: t.to, dir: t.direction ?? 'forward' }));
      if (meta.meta?.size && (meta.meta.size.w !== img.width || meta.meta.size.h !== img.height)) throw new Error(`metadata says ${meta.meta.size.w}x${meta.meta.size.h}, the PNG is ${img.width}x${img.height}`);
    } else {
      const g = /^(\d+)x(\d+)$/.exec(o.frame ?? ''), fw = g ? +g[1] : img.width, fh = g ? +g[2] : img.height;
      for (let r = 0; r + fh <= img.height; r += fh) for (let c = 0; c + fw <= img.width; c += fw) frames.push({ name: `frame ${frames.length}`, x: c, y: r, w: fw, h: fh, sw: fw, sh: fh, ox: 0, oy: 0, ms: 0 });
    }
    // --- rows: one per tag, then the untagged frames ---
    const rows = [], tagged = new Set();
    for (const t of tags) { const idx = []; for (let i = t.from; i <= t.to && i < frames.length; i++) { idx.push(i); tagged.add(i); } rows.push({ title: `${t.name}  (${t.dir}, frames ${t.from}-${t.to})`, idx }); }
    const rest = frames.map((_, i) => i).filter((i) => !tagged.has(i));
    if (rest.length) rows.push({ title: tags.length ? 'untagged' : `all frames (${frames.length})`, idx: rest });
    const lines = rows.flatMap((r) => { const l = []; for (let i = 0; i < r.idx.length; i += o.cols) l.push({ title: i ? '' : r.title, idx: r.idx.slice(i, i + o.cols) }); return l; });
    // --- layout ---
    const cw = Math.max(...frames.map((f) => f.sw)) * o.scale, ch = Math.max(...frames.map((f) => f.sh)) * o.scale;
    const PAD = 16, GAP = 10, HEAD = 22, LABEL = 18, FOOT = 40;
    const usedCols = Math.max(...lines.map((l) => l.idx.length));
    const W = Math.max(PAD * 2 + usedCols * cw + (usedCols - 1) * GAP, 360), H = PAD + lines.length * (HEAD + ch + LABEL + GAP) + FOOT + (o.caption ? 22 : 0);
    const cv = document.getElementById('c'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    const dark = (parseInt(o.bg.slice(1, 3), 16) * 0.3 + parseInt(o.bg.slice(3, 5), 16) * 0.59 + parseInt(o.bg.slice(5, 7), 16) * 0.11) < 110;
    const ink = dark ? '#e8e2ce' : '#10131a', faint = dark ? 'rgba(255,255,255,.14)' : 'rgba(0,0,0,.22)';
    g.fillStyle = o.bg; g.fillRect(0, 0, W, H); g.font = '13px Consolas, monospace'; g.textBaseline = 'top';
    let y = PAD;
    for (const l of lines) {
      g.fillStyle = ink; g.fillText(l.title, PAD, y + 2); y += HEAD;
      l.idx.forEach((fi, k) => {
        const f = frames[fi], x = PAD + k * (cw + GAP);
        g.fillStyle = faint; g.fillRect(x, y, cw, 1); g.fillRect(x, y + ch - 1, cw, 1); g.fillRect(x, y, 1, ch); g.fillRect(x + cw - 1, y, 1, ch);
        g.drawImage(img, f.x, f.y, f.w, f.h, x + f.ox * o.scale, y + f.oy * o.scale, f.w * o.scale, f.h * o.scale);
        g.fillStyle = ink; g.fillText(`#${fi}${f.ms ? `  ${f.ms} ms` : ''}`, x, y + ch + 3);
      });
      y += ch + LABEL + GAP;
    }
    g.fillStyle = ink; g.fillText(`${img.width}x${img.height} sheet, ${frames.length} frame(s), ${o.scale}x nearest, bg ${o.bg}${meta ? '' : ' (no metadata)'}`, PAD, H - FOOT + 8);
    if (o.caption) g.fillText(o.caption, PAD, H - FOOT + 28);
    return { W, H, frames: frames.length, rows: lines.length, sheet: `${img.width}x${img.height}` };
  }, png, meta, { scale, cols, bg, frame: opt.frame, caption });
  await page.setViewport({ width: Math.min(info.W, 16000), height: Math.min(info.H, 16000) });
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await (await page.$('#c')).screenshot({ path: out });
  console.log(`wrote ${path.relative(process.cwd(), out)}  (${info.W}x${info.H}, ${info.frames} frame(s) in ${info.rows} row(s), sheet ${info.sheet}, ${scale}x)`);
} catch (e) { console.error(`make-contact-sheet: ${e.message}`); process.exitCode = 1; }
finally { await browser.close(); }
