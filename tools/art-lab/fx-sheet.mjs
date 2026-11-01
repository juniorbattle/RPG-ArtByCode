// Review sheet of the duel's effects (src/lab/fxPaint.ts, journal Passe FX1), from the pure painters, no browser: each effect's frames in a row,
// nearest-neighbour, on the arena's night stone and on its midday sand; the core as it is, the glow added.
//   node tools/art-lab/fx-sheet.mjs <out.png> [night|morning|midday|afternoon] [scale=3] [seed=1842]
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';
import { encodePng } from './png.mjs';
const [out, time = 'night', scale = '3', seed = '1842'] = process.argv.slice(2);
if (!out) throw new Error('usage: node tools/art-lab/fx-sheet.mjs <out.png> [time] [scale] [seed]');
const root = path.resolve(import.meta.dirname, '../..');
const s = await createServer({ root, configFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-test', server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true } });
try {
  const P = await s.ssrLoadModule('/src/lab/fxPaint.ts'), T = await s.ssrLoadModule('/src/ui/design/tokens.ts');
  const byDay = time !== 'night', R = P.fxRamp(T.TONES[time], byDay), k = +scale, pad = 4;
  const rows = [];
  for (const [id, d] of Object.entries(P.FX)) for (let l = 1; l <= d.levels; l++) rows.push({ id, d, l });
  const W = Math.max(...rows.map((r) => r.d.ms.length * (r.d.w + pad))) * k + pad * k, H = rows.reduce((n, r) => n + r.d.h + pad, pad) * k;
  const rgba = Buffer.alloc(W * H * 4), bg = byDay ? [186, 164, 128] : [26, 30, 48];
  for (let i = 0; i < W * H; i++) { rgba[i * 4] = bg[0]; rgba[i * 4 + 1] = bg[1]; rgba[i * 4 + 2] = bg[2]; rgba[i * 4 + 3] = 255; }
  let y0 = pad;
  for (const { id, d, l } of rows) {
    d.ms.forEach((_, f) => {
      const c = d.paint(f, +seed, R, l), x0 = pad + f * (d.w + pad);
      for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) {
        const q = (y * c.w + x) * 4, core = c.rgba[q + 3] === 255, add = !core && c.rgba[q] + c.rgba[q + 1] + c.rgba[q + 2] > 0;
        if (!core && !add) continue;
        for (let b = 0; b < k; b++) for (let a = 0; a < k; a++) {
          const p = (((y0 + y) * k + b) * W + (x0 + x) * k + a) * 4;
          for (let ch = 0; ch < 3; ch++) rgba[p + ch] = core ? c.rgba[q + ch] : Math.min(255, rgba[p + ch] + c.rgba[q + ch] * 0.4);
        }
      }
    });
    y0 += d.h + pad;
  }
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  fs.writeFileSync(out, encodePng(W, H, rgba));
  console.log(out, `${W} x ${H}`, Object.keys(P.FX).length, 'effects');
} finally { await s.close(); }
