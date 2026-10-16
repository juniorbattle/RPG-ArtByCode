// Proof harness for the EXPERIMENTAL shared atlas / baked sprites (art-lab/characters/runtime-integration-contract.md v3, tests 1-3).
// Every capture is deterministic: Math.random is seeded before the page loads, and after boot the app loop is taken over: the actors and
// particles are re-populated from the same seed, then stepped at a fixed 1/60 s (performance.now frozen during the steps) and rendered once.
//   node tools/art-lab/baked-proof.mjs atlas  <out.json> "label|baseUrl|query" ...
//        colour / emissive SHA-256 of the atlas (whole + generated rows), sizes, aliases
//   node tools/art-lab/baked-proof.mjs shots  <outDir> "<view>~<view>" "label|baseUrl|query" ...
//        a 1920x1080 capture per view (a view = extra query, e.g. camera=B&player=2,1.5), every variant compared with the first one
//   node tools/art-lab/baked-proof.mjs parade <outDir> "label|baseUrl|query[|uvbug]" ...
//        every generated frame drawn by the production SpriteRenderer in a screen grid, 3 scales x 3 batches; compared with the first
//        variant. `uvbug` = negative control on generated UVs, `cellbug` on baked cells (must differ). PARADE_BAKED=<id> parades that baked
//        sheet instead of the generated frames; PARADE_SCALES=a,b,c overrides the 3 scales
//   node tools/art-lab/baked-proof.mjs actors <out.json> "label|baseUrl|query" ...
//        test 6: the actors right after a re-populate (spec, role, position, scale, tint, behaviour), compared with the first variant:
//        every seeded character must be identical; authored ones may only be appended
//   node tools/art-lab/baked-proof.mjs selftest <out.json> "baseUrl|query" <id> <export.png>
//   node tools/art-lab/baked-proof.mjs rules <out.json> <baseUrl>
//        amendment B: boots that must fail with an explicit error, boots that must work, and the sheet checks on crafted sheets
//        test 2: baked block in the main atlas vs the export decoded here, CPU bytes + GPU sampling (+ negative controls)
// Options (env): STEPS=90 (fixed steps before a capture), HIDE=porter (hide that spec after each re-populate, both paths).
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { decodePng, encodePng } from './png.mjs';
const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const [mode, out, ...rest] = process.argv.slice(2);
const STEPS = Number(process.env.STEPS ?? 90), HIDE = process.env.HIDE ?? '', NOSHADOW = process.env.NOSHADOW === '1';

/** pixel diff: count of pixels whose RGB differ, max channel delta, bounding box; writes an amplified diff image when out is given */
function diff(a, b, outFile) {
  if (a.W !== b.W || a.H !== b.H) return { sizeMismatch: true };
  let n = 0, max = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; const img = Buffer.alloc(a.W * a.H * 4);
  for (let i = 0; i < a.W * a.H; i++) { const d = Math.max(Math.abs(a.rgba[i * 4] - b.rgba[i * 4]), Math.abs(a.rgba[i * 4 + 1] - b.rgba[i * 4 + 1]), Math.abs(a.rgba[i * 4 + 2] - b.rgba[i * 4 + 2]));
    const g = a.rgba[i * 4 + 1] >> 2; img[i * 4] = img[i * 4 + 1] = img[i * 4 + 2] = g; img[i * 4 + 3] = 255;
    if (d) { n++; max = Math.max(max, d); const x = i % a.W, y = Math.floor(i / a.W); x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); img[i * 4] = 255; img[i * 4 + 1] = 40; img[i * 4 + 2] = 40; } }
  if (n && outFile) fs.writeFileSync(outFile, encodePng(a.W, a.H, img));
  return { pixels: n, maxDelta: max, box: n ? [x0, y0, x1 - x0 + 1, y1 - y0 + 1] : null };
}

const SEED_SCRIPT = `(() => { let s = 1;
  const rnd = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  Math.random = rnd; window.__reseed = (v) => { s = v | 0; }; })();`;

async function open(browser, base, query) {
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.evaluateOnNewDocument(SEED_SCRIPT);
  await page.goto(`${base}?${query}`, { waitUntil: 'load' });
  await page.waitForFunction('window.__ready === true || !!window.__error', { timeout: 180000 });
  const err = await page.evaluate(() => window.__error ?? window.__baked?.error ?? null);
  if (err) throw new Error(`${base}?${query}: ${err}`);
  // the loading screen fades out over the canvas for 0.8 s after boot: wait until main.ts removed it
  await page.waitForFunction(() => ![...document.body.children].some((e) => e.textContent?.includes('PAINTING') || e.textContent?.includes('GENERATING')), { timeout: 10000 });
  await page.evaluate((HIDE, NOSHADOW) => {
    const a = window.__app;
    if (!a.__u) { a.__u = a.update.bind(a); a.__r = a.render.bind(a); a.update = () => {}; a.render = () => {}; }
    window.__settle = (steps) => {
      window.__reseed(1842);
      a.actors.populate(a.district, a.config.npcDensity, a.config.seed);
      if (HIDE) for (const x of a.actors.actors) if (x.spec === HIDE) x.hidden = true;
      a.particles.clear(); a.particles.setEmitters(a.district.emitters);
      a.particles.rng = new a.particles.rng.constructor(99);   // the particles' own RNG keeps running between page loads otherwise
      a.simTime = 0; a.graph.snap(a.actors.player.pos, a.rig);
      const now = performance.now; performance.now = () => 1000;
      try { for (let i = 0; i < steps; i++) { a.__u(1 / 60); if (HIDE) for (const x of a.actors.actors) if (x.spec === HIDE) x.hidden = true; }
        // NOSHADOW=1: hide the character shadow meshes (main renderer and the old preview's own) to isolate the sprite bodies
        if (NOSHADOW) for (const g of [a.sprites.group, window.__labSprite?.group]) if (g) g.children[1].visible = false;
        a.__r(); } finally { performance.now = now; }
    };
  }, HIDE, NOSHADOW);
  return page;
}
const shot = async (page) => decodePng(Buffer.from(await page.screenshot({ type: 'png' })));
const launch = () => puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--use-gl=angle', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--no-sandbox', '--window-size=1920,1080', '--hide-scrollbars', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'], defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 } });
const parseVariant = (s) => { const [label, base, query, flag] = s.split('|'); return { label, base, query, flag }; };

const browser = await launch();
try {
  // warm-up: the first page of a browser session renders differently (measured: thousands of px in the sky / smoke area against every
  // later load, while later loads agree with each other), so one throw-away load precedes every measurement
  if (mode === 'shots' || mode === 'parade') { const w0 = parseVariant(mode === 'shots' ? rest[1] : rest[0]); const p = await open(browser, w0.base, w0.query); await p.evaluate((s) => window.__settle(s), STEPS); await p.screenshot({ type: 'png' }); await p.close(); }
  if (mode === 'atlas') {
    const res = [];
    for (const v of rest.map(parseVariant)) {
      const page = await open(browser, v.base, v.query);
      res.push({ label: v.label, ...(await page.evaluate(async () => {
        const at = window.__app.atlas, W = at.width, H = at.height, H0 = at.generatedHeight ?? H;
        const h = async (u8) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', u8))].map((x) => x.toString(16).padStart(2, '0')).join('');
        const col = new Uint8Array(at.rgba.buffer), em = at.emis.image.data;
        const gen = (buf) => buf.subarray(0, W * H0 * 4);
        return { size: [W, H], generatedHeight: H0, frames: at.frames.size, colour: await h(col), emissive: await h(em), generatedColour: await h(gen(col)), generatedEmissive: await h(gen(em)), aliases: at.aliases ?? null, baked: at.baked ? Object.fromEntries(at.baked) : null, bakedTexture: at.bakedRgba ? [at.bakedWidth, at.bakedHeight, (await h(new Uint8Array(at.bakedRgba.buffer))).slice(0, 16)] : null };
      })) });
      await page.close();
    }
    fs.writeFileSync(out, JSON.stringify(res, null, 1)); console.log(JSON.stringify(res, null, 1));
  } else if (mode === 'shots') {
    const views = rest[0].split('~').filter(Boolean), variants = rest.slice(1).map(parseVariant), rep = [];
    fs.mkdirSync(out, { recursive: true });
    for (const view of views) {
      let ref = null; const tag = view.replace(/[^a-z0-9]+/gi, '_');
      // per-view warm-up: the FIRST load of a framing in a browser session differs from every later one (measured on camera A: 69 634 px,
      // the same against every later load, which agree with each other); a throw-away load of that view comes first
      // (one warm-up per distinct server: the effect is per origin — measured on camera A with two servers)
      for (const w0 of [...new Map(variants.map((v) => [v.base, v])).values()]) { const p = await open(browser, w0.base, `${w0.query}&${view}`); await p.evaluate((s) => window.__settle(s), STEPS); await p.screenshot({ type: 'png' }); await p.close(); }
      for (const v of variants) {
        const page = await open(browser, v.base, `${v.query}&${view}`);
        await page.evaluate((s) => window.__settle(s), STEPS);
        const img = await shot(page); await page.close();
        fs.writeFileSync(path.join(out, `${tag}__${v.label}.png`), encodePng(img.W, img.H, img.rgba));
        if (!ref) { ref = img; rep.push({ view, variant: v.label, reference: true }); continue; }
        const d = diff(ref, img, path.join(out, `${tag}__${v.label}__diff.png`));
        rep.push({ view, variant: v.label, vs: variants[0].label, ...d }); console.log(view, v.label, JSON.stringify(d));
      }
    }
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(rep, null, 1));
  } else if (mode === 'parade') {
    const variants = rest.map(parseVariant), rep = []; fs.mkdirSync(out, { recursive: true });
    const refs = [];
    for (const v of variants) {
      const page = await open(browser, v.base, v.query);
      await page.evaluate((s) => window.__settle(s), STEPS);
      const n = await page.evaluate((flag, bakedId) => {
        const a = window.__app, at = a.atlas, H = at.height, H0 = at.generatedHeight ?? H, top = H - H0;
        // PARADE_BAKED=<id>: that baked sheet's frames, repeated (48 copies, alternate flips); otherwise the generated frames only
        // (baked keys hold an id with a dash; fx bubbles are generated too)
        const keys = bakedId ? Array.from({ length: 48 }, (_, i) => [...at.frames.keys()].filter((k) => k.startsWith(bakedId + '/down/'))[i % Math.max(1, [...at.frames.keys()].filter((k) => k.startsWith(bakedId + '/down/')).length)])
          : [...at.frames.keys()].filter((k) => !at.baked || !at.baked.has(k.split('/')[0])).filter((k) => !k.startsWith('test-'));
        // negative controls: uvbug = generated UVs normalised by a wrong height (5d10a37 layout) or, with a fixed generated texture, shifted
        // by one texel row; cellbug = baked cells one row off
        if (flag === 'uvbug') for (const k of new Set(keys)) { const r = at.frames.get(k);
          if (top) { const cy0 = (1 - r.v1) * H - top; at.frames.set(k, { ...r, v1: 1 - cy0 / H0, v0: 1 - (cy0 + 48) / H0 }); }
          else at.frames.set(k, { ...r, v1: r.v1 + 1 / H, v0: r.v0 + 1 / H }); }
        if (flag === 'cellbug') for (const k of new Set(keys)) { const r = at.frames.get(k); if (r.cell) at.frames.set(k, { ...r, cell: [r.cell[0], r.cell[1] + 1, r.cell[2], r.cell[3]] }); }
        window.__keys = keys; return keys.length;
      }, v.flag ?? '', process.env.PARADE_BAKED ?? '');
      let bi = 0;
      const SCALES = (process.env.PARADE_SCALES ?? '0.7,1.15,1.9').split(',').map(Number);   // e.g. a dense sweep for texel-edge ties
      for (const scale of SCALES) for (let batch = 0; batch < 3; batch++) {
        await page.evaluate((scale, batch) => {
          const a = window.__app, at = a.atlas, keys = window.__keys, V = a.rig.camera.position.constructor, cam = a.rig.camera;
          const per = Math.ceil(keys.length / 3), list = keys.slice(batch * per, (batch + 1) * per);
          const cols = 16, rows = Math.ceil(list.length / cols), W = innerWidth, H = innerHeight;
          const rates = { walk: 7.5, carry: 7.5, hammer: 5.5, talk: 4, idle: 1.7 };
          const actors = list.map((k, i) => {
            const [spec, dir, anim, fi] = k.split('/');   // a baked id never contains '/'
            // screen-grid anchor -> ground point (y = 0) under it
            const sx = ((i % cols) + 0.5) / cols * 2 - 1, sy = 1 - (Math.floor(i / cols) + 0.85) / rows * 1.7;
            const p0 = new V(sx, sy, 0.2).unproject(cam), p1 = new V(sx, sy, 0.9).unproject(cam), t = -p0.y / (p1.y - p0.y);
            const pos = p0.clone().add(p1.clone().sub(p0).multiplyScalar(t));
            const isBubble = spec === 'fx';
            return { id: 50000 + i, spec: isBubble ? 'player' : spec, role: 'parade', detail: 'mid', pos, facing: 'down', dir: isBubble ? 'down' : dir, flip: i % 2 === 1, anim: isBubble ? 'idle' : anim,
              t: isBubble ? 0 : (Number(fi) + 0.5) / rates[anim], speed: 0, tint: [1, 1, 1], scale, height: 1.7, radius: 0.3, bubble: isBubble ? fi : null };
          });
          for (const x of a.actors.actors) x.hidden = true;
          const now = performance.now; performance.now = () => 1000;   // the speech-bubble bob reads the clock
          try { a.sprites.update(actors, a.lights, cam, a.moonDir, null, null); a.__r(); } finally { performance.now = now; }
        }, scale, batch);
        const img = await shot(page);
        fs.writeFileSync(path.join(out, `p${bi}__${v.label}.png`), encodePng(img.W, img.H, img.rgba));
        if (!refs[bi]) { refs[bi] = img; rep.push({ variant: v.label, render: bi, scale, batch, frames: n, reference: true }); }
        else { const d = diff(refs[bi], img, path.join(out, `p${bi}__${v.label}__diff.png`)); rep.push({ variant: v.label, render: bi, scale, batch, frames: n, ...d }); console.log(v.label, bi, JSON.stringify(d)); }
        bi++;
      }
      await page.close();
    }
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(rep, null, 1));
  } else if (mode === 'actors') {
    const lists = [];
    for (const v of rest.map(parseVariant)) {
      const page = await open(browser, v.base, v.query);
      const list = await page.evaluate(() => {
        const a = window.__app; window.__reseed(1842); a.actors.populate(a.district, a.config.npcDensity, a.config.seed);
        return a.actors.actors.map((x) => ({ spec: x.spec, role: x.role, x: +x.pos.x.toFixed(6), z: +x.pos.z.toFixed(6), scale: +x.scale.toFixed(6), tint: x.tint.map((t) => +t.toFixed(6)), kind: x.behaviour?.kind ?? null, anim: x.anim, detail: x.detail }));
      });
      await page.close(); lists.push({ label: v.label, list });
    }
    const ref = lists[0].list, res = lists.map(({ label, list }) => {
      const seeded = list.filter((x) => x.role !== 'baked'), authored = list.filter((x) => x.role === 'baked');
      const same = seeded.length === ref.length && seeded.every((x, i) => JSON.stringify(x) === JSON.stringify(ref[i]));
      const appended = authored.length === 0 || list.slice(-authored.length).every((x) => x.role === 'baked');
      return { label, actors: list.length, seeded: seeded.length, authored: authored.length, seededIdentical: same, authoredAppendedLast: appended, authoredList: authored };
    });
    fs.writeFileSync(out, JSON.stringify({ res, reference: ref }, null, 1)); console.log(JSON.stringify(res));
  } else if (mode === 'rules') {
    const base = rest[0], Q = 'clean=1&freeze=7.3&intro=0&camera=B&player=2,1.5&baked=dockworker-x2-v1';
    const boots = [
      ['interactive NPC (mid), no fallback declared -> refused', `${Q}&bakedpos=6,1.5`, 'error'],
      ['crowd NPC, never turned, no fallback -> allowed (front idle is all it needs)', `${Q}&bakedpos=6,1.5&bakeddetail=crowd`, 'ok'],
      ['crowd NPC with a facing, no fallback -> refused', `${Q}&bakedpos=6,1.5&bakeddetail=crowd&bakedface=1.2`, 'error'],
      ['interactive NPC, explicit front-idle fallback (lab, immobile) -> allowed, aliases listed', `${Q}&bakedpos=6,1.5&bakedfallback=front-idle`, 'ok'],
      ['unknown fallback keyword -> refused', `${Q}&bakedpos=6,1.5&bakedfallback=any`, 'error'],
      ['?baked together with ?labsprite -> refused', `${Q}&labsprite=dockworker-x2-v1`, 'error'],
      ['lab asset without a provenance pack (porter-gm-v1) -> refused (no hash to check)', 'clean=1&freeze=7.3&intro=0&baked=porter-gm-v1', 'error'],
      ['unknown manifest id -> refused', 'clean=1&freeze=7.3&intro=0&baked=no-such-sprite', 'error'],
    ];
    const res = [];
    for (const [what, q, expect] of boots) {
      const page = await browser.newPage(); page.on('pageerror', () => {});
      await page.goto(`${base}?${q}`, { waitUntil: 'load' });
      await page.waitForFunction('window.__ready === true || !!window.__error || !!window.__baked?.error', { timeout: 180000 });
      const r = await page.evaluate(() => ({ error: window.__error ?? window.__baked?.error ?? null, aliases: window.__baked?.aliases ?? null, actors: window.__app?.actors?.actors?.filter((a) => a.role === 'baked').map((a) => a.dir) ?? null }));
      await page.close();
      const got = r.error ? 'error' : 'ok';
      const first = r.error ? String(r.error).split(String.fromCharCode(10))[0] : null;
      res.push({ what, expect, got, pass: got === expect, error: first, aliases: r.aliases, authoredDirs: r.actors });
      console.log(got === expect ? 'PASS' : 'FAIL', what, '|', first ?? JSON.stringify(r.aliases));
    }
    // the sheet checks themselves, on crafted sheets (module loaded from the dev server)
    const page = await browser.newPage();
    await page.goto(`${base}?clean=1&freeze=7.3&intro=0`, { waitUntil: 'load' }); await page.waitForFunction('window.__ready === true', { timeout: 180000 });
    const checks = await page.evaluate(async () => {
      const m = await import('/src/characters/BakedSprites.ts');
      const fw = 64, fh = 96, frame = (mut) => { const rgba = new Uint8Array(fw * fh * 4); for (let y = 4; y <= 90; y++) for (let x = 20; x < 44; x++) rgba[(y * fw + x) * 4 + 3] = 255; mut?.(rgba); return rgba; };
      const sheet = (o) => ({ id: 'test-x', runtimeUse: 'lab', sha256: 's', k: 2, frames: [{ dir: 'down', anim: 'idle', i: 0, rgba: frame() }], ...o });
      const cases = {
        valid: sheet({}),
        semiAlpha: sheet({ frames: [{ dir: 'down', anim: 'idle', i: 0, rgba: frame((r) => { r[(50 * fw + 30) * 4 + 3] = 128; }) }] }),
        opaqueBorder: sheet({ frames: [{ dir: 'down', anim: 'idle', i: 0, rgba: frame((r) => { r[(50 * fw + 0) * 4 + 3] = 255; }) }] }),
        feetBelowRow90: sheet({ frames: [{ dir: 'down', anim: 'idle', i: 0, rgba: frame((r) => { r[(92 * fw + 30) * 4 + 3] = 255; }) }] }),
        idleFloating: sheet({ frames: [{ dir: 'down', anim: 'idle', i: 0, rgba: frame((r) => { for (let x = 20; x < 44; x++) r[(90 * fw + x) * 4 + 3] = 0; }) }] }),
        wrongSize: sheet({ frames: [{ dir: 'down', anim: 'idle', i: 0, rgba: new Uint8Array(64 * 90 * 4) }] }),
        unevenCounts: sheet({ frames: [{ dir: 'down', anim: 'walk', i: 0, rgba: frame() }, { dir: 'down', anim: 'walk', i: 1, rgba: frame() }, { dir: 'side', anim: 'walk', i: 0, rgba: frame() }, { dir: 'down', anim: 'idle', i: 0, rgba: frame() }] }),
        fallbackInProduction: sheet({ runtimeUse: 'production', fallback: 'front-idle' }),
      };
      const out = {}; for (const [k, s] of Object.entries(cases)) out[k] = m.checkBakedSheet(s);
      out.requiredWander = m.requiredFrames('wander', { faced: false, interactive: false, talk: false }).map((p) => p.join('/'));
      out.requiredStaticCrowd = m.requiredFrames('idle', { faced: false, interactive: false, talk: false }).map((p) => p.join('/'));
      out.requiredInteractive = m.requiredFrames('idle', { faced: false, interactive: true, talk: false }).map((p) => p.join('/'));
      return out;
    });
    await page.close();
    fs.writeFileSync(out, JSON.stringify({ boots: res, checks }, null, 1)); console.log(JSON.stringify(checks, null, 1));
  } else if (mode === 'selftest') {
    const [bq, id, png] = rest, [base, query] = bq.split('|');
    const img = decodePng(fs.readFileSync(png));
    const page = await open(browser, base, query);
    const r = await page.evaluate((id, b64) => window.__baked.selfTest(id, b64), id, img.rgba.toString('base64'));
    r.export = { file: png, size: [img.W, img.H] };
    fs.writeFileSync(out, JSON.stringify(r, null, 1)); console.log(JSON.stringify(r, null, 1));
  } else throw new Error(`unknown mode ${mode}`);
} finally { await browser.close(); }
