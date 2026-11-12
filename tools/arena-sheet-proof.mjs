// The combat sheets' proof (journal Passe CX4): each rival fights under its own sheet, in the version 2's duel, on the path production takes (src/arena/CombatCast.ts). For every rival, on a
// running DEV server (DEV `foe=<id>` on the arena's page): every scripted moment, then a simulated duel, each step's frame of both fighters must be a baked frame (a generated frame has no
// integer cell): no art of Marek's borrowed, no generated fighter beside a sheet; the HUD's face must be the baked one (32 x 32); which of the sheet's frames the duel showed is reported.
//   node tools/arena-sheet-proof.mjs [--secs=60] [--time=midday] [--q=<extra query>] [rival ...]     (--q=cast=generated: the negative control, it must fail; BASE_URL, CHROME_PATH / READY_MS as tools/detshots.mjs); exit 1 on a failure
import { createRequire } from 'node:module';
import fs from 'node:fs';
const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].filter(Boolean).find((p) => fs.existsSync(p));
const args = process.argv.slice(2), opt = (k, d) => args.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
const RIVALS = args.filter((a) => !a.startsWith('--')).length ? args.filter((a) => !a.startsWith('--')) : ['marek', 'vessa', 'orla', 'cassius', 'ilse', 'rhosk', 'tobin'];
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', SECS = +opt('secs', 60), TIME = opt('time', ''), Q = opt('q', '');
const MOMENTS = ['calm', 'charging', 'strike', 'prep', 'heavyRen', 'skillPrep', 'technique', 'ward', 'boost', 'combo', 'denied', 'window', 'block', 'guardHeavy', 'dodge', 'impact', 'pushed', 'foeBreak', 'broken', 'ko', 'koRen', 'chargeLight', 'chargeFirst', 'chargeSkill', 'chargeLocked', 'chargeGuard', 'chargeWait', 'released', 'foeSkill', 'foeSkillHit', 'foeWard', 'foeBoost'];
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--use-gl=angle', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--no-sandbox', '--window-size=1280,720', '--hide-scrollbars'] });
let bad = 0;
try {
  for (const foe of RIVALS) {
    const page = await b.newPage(), errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.evaluateOnNewDocument(`Object.defineProperty(window, '__arena', { configurable: true, get() { return undefined; }, set(v) { v.start = () => {}; Object.defineProperty(window, '__arena', { value: v, writable: true, configurable: true }); } })`);
    await page.goto(`${BASE}?scene=arena&v2=1&duel=charge&foe=${foe}&freeze=7.3${TIME ? `&time=${TIME}` : ''}${Q ? `&${Q}` : ''}`, { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction('window.__ready === true || window.__error', { timeout: +(process.env.READY_MS || 300000) });
    const err = await page.evaluate(() => window.__error); if (err) throw new Error(`${foe}: ${err}`);
    const r = await page.evaluate((moments, secs) => {
      const A = window.__arena, frames = A.set.atlas.frames, seen = { ren: new Set(), marek: new Set() }, off = [];
      const check = (where) => { for (const id of ['ren', 'marek']) { const anim = A.fighters[id].anim, f = frames.get(`${id}/side/${anim}/0`); seen[id].add(anim); if (!f || !f.cell) off.push(`${where}: ${id} ${anim}`); } };
      for (const m of moments) { A.jump(m); A.renderOnce(); check(m); }
      A.jump('calm');
      const d = A.sim, dt = d.D.dt, n = Math.round(secs / dt);
      d.f.marek.aiWait = 0;
      for (let i = 0; i < n; i++) {
        if (i % 90 === 0) d.attack(true); if (i % 90 === 8) d.attack(false);
        if (i % 1200 === 300) { d.attack(true); } if (i % 1200 === 620) d.attack(false);
        if (i % 600 === 400) d.setGuard('ren', true); if (i % 600 === 480) d.setGuard('ren', false);
        d.f.ren.hp = Math.max(d.f.ren.hp, 400); d.f.marek.hp = Math.max(d.f.marek.hp, 400);
        d.step(dt); d.drain(); A.time += dt; A.presentFighters(dt); check(`t ${(i * dt).toFixed(1)}`);
      }
      const P = A.set.portraits, counts = A.sheets?.info.counts.marek ?? {};
      return { off: off.slice(0, 12), nOff: off.length, ren: seen.ren.size, marek: [...seen.marek].sort(), face: [P.ren?.width, P.marek?.width], cells: A.sheets?.info.cells, texture: A.sheets?.info.texture, sheets: A.sheets?.info.sheets.map((s) => `${s.id} ${s.runtimeUse}`), held: Object.values(counts).reduce((x, y) => x + y, 0) };
    }, MOMENTS, SECS);
    const fail = r.nOff || r.face[1] !== 32 || !r.sheets || r.sheets.length !== 2 || errors.length;
    console.log(`${fail ? 'FAIL' : 'OK  '} ${foe.padEnd(8)} ${r.sheets?.join(', ')}; ${r.marek.length} of its ${r.held} frames shown, Ren ${r.ren}; ${r.cells} cells, texture ${r.texture}; faces ${r.face}; frames off the sheet ${r.nOff}${errors.length ? `; page errors: ${errors.slice(0, 2).join(' | ')}` : ''}`);
    if (r.nOff) console.log(`     ${r.off.join('; ')}`);
    if (fail) bad++;
    await page.close();
  }
} finally { await b.close(); }
process.exitCode = bad ? 1 : 0;
