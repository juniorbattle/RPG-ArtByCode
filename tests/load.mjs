// Unit-test loader (journal pass Q1): src/ is written for the bundler (imports without extensions, TypeScript, named JSON imports,
// `?url`, `import.meta.env`), so the tests load it through Vite's SSR loader, already a dev dependency, rather than through Node alone
// (`--experimental-strip-types` stops at the first extensionless import). One server per test file: `node --test` runs each file in
// its own process. Its own cache folder, so a test run never rewrites the dev server's prebundled deps. No file watcher (journal
// pass Q1b): it crawled the whole root, ~18 000 ignored Art Lab scratch files included (10-22 s instead of ~1.5 s). `watch: null` needs
// `configFile: false`: merged with vite.config.ts (server port / host, build target: nothing the SSR loader uses), a null is dropped.
import path from 'node:path';
import { after } from 'node:test';
import { createServer } from 'vite';

export const ROOT = path.resolve(import.meta.dirname, '..');

let server = null;

/** a module of the repo by its root-relative path, e.g. load('/src/app/CameraGraph.ts') */
export async function load(file) {
  server ??= createServer({
    root: ROOT, configFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-test',
    server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true },
  });
  return (await server).ssrLoadModule(file);
}

after(async () => { if (server) await (await server).close(); });
