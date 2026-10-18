// Side-by-side motion review (journal Passe S2): the same deterministic run (seeded Math.random, App.start a no-op, 1/60 s steps) on
// several servers or queries, a crop that follows one actor, every `every` steps, into ONE self-contained HTML page that plays the
// variants in sync (play / pause, frame step, speed). For judging a walk in motion: feet against the ground, cadence, facing changes.
//   node tools/flipbook.mjs <out.html> "<actor spec prefix>" <fromStep> <toStep> [every=2] [crop=WxH] [zoom=2] "label|<full url>" ...
import { createRequire } from 'node:module';
import fs from 'node:fs';
const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const SEED = `(() => { let s = 1842; Math.random = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();`;
const HOLD = `Object.defineProperty(window, '__app', { configurable: true, get() { return undefined; }, set(v) { v.start = () => {}; Object.defineProperty(window, '__app', { value: v, writable: true, configurable: true }); } });`;
const [out, who, fromS, toS, ...rest] = process.argv.slice(2);
const opts = rest.filter((a) => !a.includes('|')), vars = rest.filter((a) => a.includes('|')).map((a) => { const [label, url] = a.split('|'); return { label, url }; });
const every = +(opts[0] ?? 2), [CW, CH] = (opts[1] ?? '360x300').split('x').map(Number), zoom = +(opts[2] ?? 2);
if (!out || !who || !vars.length) throw new Error('usage: node tools/flipbook.mjs <out.html> "<spec prefix>" <from> <to> [every] [WxH] [zoom] "label|url" ...');
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--use-gl=angle', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--no-sandbox', '--window-size=1920,1080', '--hide-scrollbars'], defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 } });
const tracks = [];
try {
  for (const v of vars) {
    const page = await b.newPage(); page.on('pageerror', (e) => console.log('[pageerror]', e.message));
    await page.evaluateOnNewDocument(SEED); await page.evaluateOnNewDocument(HOLD);
    await page.goto(v.url, { waitUntil: 'load' }); await page.waitForFunction('window.__ready === true', { timeout: 180000 });
    await new Promise((r) => setTimeout(r, 1200));
    await page.evaluate((who) => {
      const a = window.__app, u = a.update.bind(a), r = a.render.bind(a);
      let clock = 0; const frozen = (fn) => { const n = performance.now; performance.now = () => clock; try { return fn(); } finally { performance.now = n; } };
      window.__fb = {
        step(n) { for (let i = 0; i < n; i++) { clock += 1000 / 60; frozen(() => u(1 / 60)); } },
        shot() { frozen(() => r()); const act = a.actors.actors.find((x) => x.spec.startsWith(who)); if (!act) return null;
          const p = act.pos.clone().project(a.rig.camera); return { x: (p.x + 1) / 2 * innerWidth, y: (1 - p.y) / 2 * innerHeight, dir: act.dir, anim: act.anim, flip: act.flip }; },
      };
    }, who);
    await page.evaluate((n) => window.__fb.step(n), +fromS);
    const frames = [];
    for (let s = +fromS; s < +toS; s += every) {
      const st = await page.evaluate(() => window.__fb.shot());
      if (!st) { frames.push(null); await page.evaluate((n) => window.__fb.step(n), every); continue; }
      const clip = { x: Math.max(0, Math.min(1920 - CW, Math.round(st.x - CW / 2))), y: Math.max(0, Math.min(1080 - CH, Math.round(st.y - CH * 0.8))), width: CW, height: CH };
      frames.push({ img: await page.screenshot({ clip, type: 'jpeg', quality: 90, encoding: 'base64' }), info: `${st.dir}${st.flip ? ' (flip)' : ''} ${st.anim}` });
      await page.evaluate((n) => window.__fb.step(n), every);
    }
    tracks.push({ label: v.label, frames });
    await page.close();
    console.log(v.label, frames.length, 'frames');
  }
} finally { await b.close(); }
const data = JSON.stringify(tracks.map((t) => ({ label: t.label, frames: t.frames.map((f) => (f ? [f.img, f.info] : null)) })));
fs.writeFileSync(out, `<!doctype html><meta charset="utf-8"><title>Flipbook</title>
<style>body{background:#0b0e16;color:#d9c9a8;font:13px system-ui;margin:16px}.row{display:flex;gap:12px;flex-wrap:wrap}figure{margin:0}img{width:${CW * zoom}px;height:${CH * zoom}px;image-rendering:pixelated;display:block;max-width:100%}
figcaption{padding:4px 0}button{background:#1a2132;color:#d9c9a8;border:1px solid #334;padding:4px 10px;margin-right:6px}</style>
<p>${who} — steps ${fromS}..${toS} every ${every} (1/60 s each); <button id=pp>pause</button><button id=st>step</button> speed <select id=sp><option value=1>1x</option><option value=0.5>0.5x</option><option value=0.25>0.25x</option></select> <span id=fi></span></p>
<div class=row id=row></div>
<script>const T=${data};const row=document.getElementById('row');const imgs=T.map(t=>{const f=document.createElement('figure');const i=document.createElement('img');const c=document.createElement('figcaption');f.append(i,c);row.append(f);return {i,c,t};});
let k=0,play=true,acc=0,last=performance.now();const n=Math.max(...T.map(t=>t.frames.length));
function show(){imgs.forEach(({i,c,t})=>{const f=t.frames[k%t.frames.length];if(f){i.src='data:image/jpeg;base64,'+f[0];c.textContent=t.label+' — '+f[1];}else c.textContent=t.label+' — (not on screen)';});document.getElementById('fi').textContent='frame '+(k+1)+' / '+n;}
function tick(now){const sp=+document.getElementById('sp').value;if(play){acc+=(now-last)*sp;const per=1000*${every}/60;while(acc>=per){acc-=per;k=(k+1)%n;}show();}last=now;requestAnimationFrame(tick);}
document.getElementById('pp').onclick=e=>{play=!play;e.target.textContent=play?'pause':'play';};document.getElementById('st').onclick=()=>{play=false;document.getElementById('pp').textContent='play';k=(k+1)%n;show();};show();requestAnimationFrame(tick);</script>`);
console.log('wrote', out, (fs.statSync(out).size / 1048576).toFixed(1), 'MB');
