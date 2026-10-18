// Walk stride of the production cast's baked sheets (journal Passe S2), with the runtime's own measure (src/characters/Stride.ts walkSlide):
// the planted foot's slide per frame in the side-view walk cycle, the ground speed the cycle draws (m/s at character scale 1, the
// WALK_CADENCE frames / s and the cast's 0.9 scale), and per framing scale the walker's animation clock (ActorSystem.walkClock) with the
// foot slip it leaves at the game's walking speeds (crowd 0.95, porter 0.9, others 0.8 m/s) for a walk straight across the screen.
//   node tools/art-lab/stride.mjs [--json=out.json]
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';

const ROOT = path.resolve(import.meta.dirname, '../..');
const jsonOut = process.argv.slice(2).find((a) => a.startsWith('--json='))?.slice(7);
const server = await createServer({ root: ROOT, configFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-test', server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true } });
const out = [];
try {
  const { decodePng, sheetFrames } = await server.ssrLoadModule('/src/characters/BakedDecode.ts');
  const { walkSlide } = await server.ssrLoadModule('/src/characters/Stride.ts');
  const { PIXEL_WORLD, WALK_CADENCE } = await server.ssrLoadModule('/src/characters/SpriteRenderer.ts');
  const ROLE = { 'dockworker-x2-v2': ['porter', 0.9] }, CROWD = ['artisan', 'traveler', 'townswoman', 'older-merchant', 'courier'];
  const ids = fs.readdirSync(path.join(ROOT, 'art-lab/characters/manifests')).filter((f) => f.endsWith('.manifest.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'art-lab/characters/manifests', f), 'utf8'))).filter((m) => m.runtimeUse === 'production').map((m) => m.id).sort();
  for (const id of ids) {
    const img = await decodePng(new Uint8Array(fs.readFileSync(path.join(ROOT, `art-lab/characters/exports/${id}.png`))));
    const { k, frames } = sheetFrames(id, img, JSON.parse(fs.readFileSync(path.join(ROOT, `art-lab/characters/exports/${id}.json`), 'utf8')));
    const slide = walkSlide(frames, k), ws = slide === null ? null : slide * WALK_CADENCE * (PIXEL_WORLD / k) * 0.9;
    const speed = ROLE[id]?.[1] ?? (CROWD.some((c) => id.startsWith(c)) ? 0.95 : 0.8);
    const per = Object.fromEntries([['A', 1], ['B/D', 1.12], ['C', 1.15]].map(([n, cs]) => {
      const clock = ws ? Math.min(1.6, Math.max(0.75, speed / (ws * cs))) : 1;
      return [n, { clock: +clock.toFixed(2), slipBefore: ws ? +((speed - ws * cs) / speed).toFixed(2) : null, slipAfter: ws ? +((speed - ws * cs * clock) / speed).toFixed(2) : null }];
    }));
    out.push({ id, k, slideTexels: slide, walkSpeed: ws === null ? null : +ws.toFixed(3), speed, per });
  }
} finally { await server.close(); }
for (const r of out) console.log(`${r.id.padEnd(22)} slide ${r.slideTexels} texels/frame  draws ${r.walkSpeed} m/s  walks ${r.speed}  ` +
  Object.entries(r.per).map(([n, p]) => `${n}: clock x${p.clock} slip ${Math.round(100 * p.slipBefore)}% -> ${Math.round(100 * p.slipAfter)}%`).join('  '));
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(out, null, 1));
