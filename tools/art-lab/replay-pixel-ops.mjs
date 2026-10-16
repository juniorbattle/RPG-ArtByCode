// Replay a recorded list of Aseprite AI Artist `draw` operations on a PNG, without Aseprite (Art Lab, development only).
// Supported ops (the ones the approved cleanups use): `pixels` (colour per point), `replace` (exact colour, optionally limited to a
// region), `clear` (region -> transparent). Proves that a cleaned sprite = base sprite + its recorded edits, pixel for pixel.
//   node tools/art-lab/replay-pixel-ops.mjs <base.png> <ops.json> <out.png> [--expect reference.png]
// ops.json: an array of ops, or an array of arrays (batches, applied in order). With --expect, exits 1 unless every RGBA pixel of the
// result equals the reference (file bytes may differ: PNG compression is not part of the contract). Needs Chrome / Edge (CHROME_PATH).
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
  .filter(Boolean).find((p) => fs.existsSync(p));
if (!exe) { console.error('No Chrome / Edge found: set CHROME_PATH.'); process.exit(2); }
const args = process.argv.slice(2), ei = args.indexOf('--expect'), expect = ei >= 0 ? args.splice(ei, 2)[1] : null;
const [baseF, opsF, outF] = args;
if (!outF) { console.error('usage: node tools/art-lab/replay-pixel-ops.mjs <base.png> <ops.json> <out.png> [--expect reference.png]'); process.exit(2); }
let ops = JSON.parse(fs.readFileSync(opsF, 'utf8')); if (Array.isArray(ops[0])) ops = ops.flat();
const uri = (f) => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
const browser = await puppeteer.launch({ executablePath: exe, headless: 'new' });
let code = 0;
try {
  const page = await browser.newPage();
  const r = await page.evaluate(async (base, ops, ref) => {
    const dec = async (s) => { const i = new Image(); await new Promise((res, rej) => { i.onload = res; i.onerror = rej; i.src = s; }); const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(i, 0, 0); return { c, g, d: g.getImageData(0, 0, i.width, i.height) }; };
    const { c, g, d } = await dec(base), W = d.width, H = d.height, px = d.data;
    const rgba = (h) => { h = h.replace('#', ''); return [0, 2, 4].map((o) => parseInt(h.slice(o, o + 2), 16)).concat(h.length >= 8 ? parseInt(h.slice(6, 8), 16) : 255); };
    const inR = (x, y, r) => !r || (x >= r.x && y >= r.y && x < r.x + r.width && y < r.y + r.height);
    let changed = 0; const unsupported = [];
    for (const op of ops) {
      if (op.kind === 'pixels') for (const p of op.points) { if (p.x < 0 || p.y < 0 || p.x >= W || p.y >= H) continue; const v = rgba(p.color ?? op.color), i = (p.y * W + p.x) * 4; for (let k = 0; k < 4; k++) px[i + k] = v[k]; changed++; }
      else if (op.kind === 'replace') { const f = rgba(op.from), t = rgba(op.to); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!inR(x, y, op.region)) continue; const i = (y * W + x) * 4; if (px[i + 3] && px[i] === f[0] && px[i + 1] === f[1] && px[i + 2] === f[2]) { for (let k = 0; k < 4; k++) px[i + k] = t[k]; changed++; } } }
      else if (op.kind === 'clear') { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (inR(x, y, op.region)) { const i = (y * W + x) * 4; px[i] = px[i + 1] = px[i + 2] = px[i + 3] = 0; changed++; } }
      else unsupported.push(op.kind);
    }
    g.putImageData(d, 0, 0);
    let mismatch = null;
    if (ref) { const R = (await dec(ref)).d.data; mismatch = 0; for (let i = 0; i < px.length; i += 4) { const a = px[i + 3], b = R[i + 3]; if (a !== b || (a && (px[i] !== R[i] || px[i + 1] !== R[i + 1] || px[i + 2] !== R[i + 2]))) mismatch++; } }
    return { W, H, changed, unsupported, mismatch, png: c.toDataURL('image/png').split(',')[1] };
  }, uri(baseF), ops, expect ? uri(expect) : null);
  fs.writeFileSync(outF, Buffer.from(r.png, 'base64'));
  if (r.unsupported.length) { console.error('unsupported ops:', [...new Set(r.unsupported)].join(', ')); code = 1; }
  console.log(JSON.stringify({ size: [r.W, r.H], opsApplied: ops.length, writes: r.changed, mismatchVsExpected: r.mismatch }));
  if (expect && r.mismatch !== 0) code = 1;
} finally { await browser.close(); }
process.exit(code);
