// The game's arena scene as a page to publish as an artifact (journal Passe P2): a production build with relative paths into <outDir>, and
// <outDir>/arena-page.html, the page itself without its document skeleton (the artifact service adds its own: doctype, head with charset and
// viewport, body). The service hands no query string to the page, so a first inline script sets `?scene=arena` on its own URL
// (history.replaceState) before the game's module reads it; the game itself is unchanged. Publish the page with every file of <outDir>/assets
// as supporting files (published path `assets/<name>`).
//   node tools/arena-scene-page.mjs <outDir>
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'vite';

const out = process.argv[2];
if (!out) throw new Error('usage: node tools/arena-scene-page.mjs <outDir>');
const root = path.resolve(import.meta.dirname, '..');
await build({ root, base: './', logLevel: 'warn', build: { outDir: path.resolve(out), emptyOutDir: true, target: 'es2022', chunkSizeWarningLimit: 1200 } });
const html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
const src = html.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/)?.[1];
const style = html.match(/<style>([^<]*)<\/style>/)?.[1];
if (!src || !style) throw new Error('index.html: module script or style not found');
const page = `<title>Arène des Champions</title>
<style>:root{color-scheme:dark}${style}</style>
<canvas id="view"></canvas>
<script>try { if (!/[?&]scene=/.test(location.search)) history.replaceState(history.state, '', location.pathname + '?scene=arena' + location.hash); } catch (e) { console.warn('scene=arena not set', e); }</script>
<script type="module" src="${src.replace(/^\.\//, '')}"></script>
`;
fs.writeFileSync(path.join(out, 'arena-page.html'), page);
const assets = fs.readdirSync(path.join(out, 'assets'));
console.log(`${path.join(out, 'arena-page.html')}: ${Buffer.byteLength(page)} bytes; ${assets.length} supporting files in assets/`);
