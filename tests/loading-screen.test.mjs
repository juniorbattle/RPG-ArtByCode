// The loading screen in the interface's design system (journal Passe UI4; the operator's decision C2-14 « Tâche à part », journal Passe C2F).
// Oracles independent of the code under test: the tones' colours read from tokens.ts's table, the opening lines and the pages' tones written
// out here from the rules (night = the evening; Lantern Row is the night's page; the other pages take the slot's look), the sources' CSS
// against the system's rules. The screen runs on a small fake document (no browser): what it appends, where, and when its content shows.
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from './load.mjs';

/** a fake document: elements with ids, classes, text and style; innerHTML creates the children named by id; fonts.load is the test's */
const registry = new Map();
class El {
  constructor(tag) { this.tagName = tag.toUpperCase(); this.id = ''; this.className = ''; this.textContent = ''; this.style = {}; this.children = []; this.parent = null; this.byId = new Map(); }
  get classList() {
    const list = () => this.className.split(/\s+/).filter(Boolean);
    return { add: (c) => { if (!list().includes(c)) this.className = [...list(), c].join(' '); }, remove: (c) => { this.className = list().filter((x) => x !== c).join(' '); }, contains: (c) => list().includes(c) };
  }
  set innerHTML(html) { for (const m of html.matchAll(/id="([^"]+)"/g)) { const e = new El('div'); e.id = m[1]; this.byId.set(m[1], e); } this.html = html; }
  get innerHTML() { return this.html; }
  querySelector(sel) { return sel.startsWith('#') ? this.byId.get(sel.slice(1)) ?? null : null; }
  appendChild(e) { e.parent = this; this.children.push(e); if (e.id) registry.set(e.id, e); for (const [id, c] of e.byId) registry.set(id, c); return e; }
  getContext() { return { putImageData() {} }; }
  toDataURL() { return 'data:image/png;base64,'; }
}
let fontLoad = () => Promise.resolve();
globalThis.ImageData = class { constructor(d, w, h) { this.data = d; this.width = w; this.height = h; } };
globalThis.window = globalThis;
globalThis.document = {
  head: new El('head'), body: new El('body'), fonts: { load: (...a) => fontLoad(...a) },
  createElement: (t) => new El(t), getElementById: (id) => registry.get(id) ?? null,
};

const T = await load('/src/ui/design/tokens.ts');
const LD = await load('/src/ui/loading.ts');
const PLAY = await load('/src/ui/play.ts');
const SIM = await load('/src/simulation/index.ts');

const reset = () => { registry.clear(); document.head.children.length = 0; document.body.children.length = 0; fontLoad = () => Promise.resolve(); };
const toneCss = () => document.getElementById('ds-tone').textContent;
const quiet = (f) => { const e = console.error; console.error = () => {}; try { return f(); } finally { console.error = e; } };

test('the screen opens over the page in the tone of the address\'s day state, its opening line, its content held until reveal', () => {
  for (const [time, tone, line] of [[null, 'night', 'PAINTING THE NIGHT…'], ['night', 'night', 'PAINTING THE NIGHT…'], ['morning', 'morning', 'PAINTING THE DAY…'],
    ['midday', 'midday', 'PAINTING THE DAY…'], ['afternoon', 'afternoon', 'PAINTING THE DAY…']]) {
    reset();
    const ld = LD.showLoading(time);
    assert.equal(ld.root.id, 'loading');
    assert.equal(ld.root.parent, document.body, 'over the page');
    assert.ok(document.getElementById('ld-css'), 'its CSS installed');
    // the tone: every colour of tokens.ts's tone, none of another (the inks differ in every tone)
    for (const [k, c] of Object.entries(T.TONES[tone])) assert.ok(toneCss().includes(`--ds-${k}:${c}`), `${time}: --ds-${k}`);
    for (const other of Object.keys(T.TONES)) if (other !== tone) assert.ok(!toneCss().includes(`--ds-ink:${T.TONES[other].ink};`), `${time}: not the ${other} ink`);
    assert.equal(ld.label.textContent, line, `${time}: the opening line`);
    assert.equal(ld.label, ld.root.querySelector('#ld-label')); assert.equal(ld.bar, ld.root.querySelector('#ld-bar'));
    assert.ok(ld.root.classList.contains('hold'), `${time}: the content held (the ink alone)`);
    ld.reveal();
    assert.ok(!ld.root.classList.contains('hold'), `${time}: shown`);
  }
  // a later tone (the play mode's page, « Explore the district ») changes the tone and the opening line
  reset();
  const ld = LD.showLoading(null);
  LD.toneLoading(ld.label, 'midday');
  assert.ok(toneCss().includes(`--ds-ink:${T.TONES.midday.ink}`));
  assert.equal(ld.label.textContent, 'PAINTING THE DAY…');
  LD.toneLoading(ld.label, 'night');
  assert.equal(ld.label.textContent, 'PAINTING THE NIGHT…');
});

test('ready waits for both fonts (the pixel and the text font, regular and bold), and never more than a second', async (t) => {
  reset();
  const asked = [], pending = [];
  fontLoad = (spec) => { asked.push(spec); return new Promise((r) => pending.push(r)); };
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let done = false;
  LD.showLoading(null).ready.then(() => { done = true; });
  assert.deepEqual([...asked].sort(), ['16px "CdT Text"', '20px "CdT Pixel"', '700 16px "CdT Text"']);
  // loaded: ready, before any time passes
  pending.forEach((r) => r());
  await new Promise((r) => setImmediate(r));
  assert.ok(done, 'ready once the fonts are loaded');
  // never loaded: ready after one second, not before
  reset();
  fontLoad = () => new Promise(() => {});
  let late = false;
  LD.showLoading(null).ready.then(() => { late = true; });
  t.mock.timers.tick(999);
  await new Promise((r) => setImmediate(r));
  assert.ok(!late, 'not before a second');
  t.mock.timers.tick(1);
  await new Promise((r) => setImmediate(r));
  assert.ok(late, 'after a second without the fonts');
});

test('a scene that fails says why on the screen, in its own colour, and keeps it through a tone change', () => {
  reset();
  const ld = LD.showLoading('midday');
  quiet(() => LD.loadingError(ld.label, new Error('dyn: unknown setting "bogus"')));
  assert.equal(ld.label.textContent, 'ERROR: dyn: unknown setting "bogus"');
  assert.ok(ld.label.classList.contains('err'));
  assert.match(window.__error, /unknown setting "bogus"/);
  LD.toneLoading(ld.label, 'night');
  assert.equal(ld.label.textContent, 'ERROR: dyn: unknown setting "bogus"', 'the error stays');
  quiet(() => LD.loadingError(ld.label, 'plain'));
  assert.equal(ld.label.textContent, 'ERROR: plain');
  delete window.__error;
});

test('the play mode\'s screen takes the tone of the page it opens: the slot\'s look, Lantern Row the night\'s', () => {
  const q = (s) => new URLSearchParams(s);
  // oracle from the rules: morning -> morning, afternoon (the bout) -> midday, the evening after the bout -> the end of day, then the night
  for (const [name, query, tone] of [['day1-morning', '', 'morning'], ['forecourt-morning', '', 'morning'], ['day2-afternoon', 'scene=arena', 'midday'],
    ['day2-afternoon', '', 'midday'], ['day2-dusk-won', '', 'afternoon'], ['forecourt-dusk-lost', '', 'afternoon'], ['day1-evening', '', 'night'],
    ['lanterns-night', '', 'night']]) {
    const s = SIM.namedState(name, 1842, 'Ren');
    assert.equal(PLAY.pageTone(q(query), s), tone, `${name} ${query}`);
  }
  // Lantern Row at the end of day is still the night's page; the arena's bout follows the slot wherever the save stands
  const dusk = SIM.namedState('day2-dusk-won', 1842, 'Ren');
  assert.equal(SIM.lookOf(dusk), 'afternoon');
  assert.equal(PLAY.pageTone(q(''), { ...dusk, place: 'lanterns' }), 'night');
  assert.equal(PLAY.pageTone(q('scene=arena'), { ...dusk, place: 'lanterns' }), 'afternoon');
});

test('the screen\'s sources: tokens of the design system only, no screen of its own left in main.ts', () => {
  const src = fs.readFileSync(path.join(ROOT, 'src/ui/loading.ts'), 'utf8');
  const css = src.match(/const CSS = `([\s\S]*?)`;/)[1];
  // colours: the tone's custom properties, no literal colour (hex, rgb, a named colour)
  assert.ok(!/(?<![\w-])#[0-9a-f]{3,8}(?![\w-])/i.test(css), 'no hex colour');
  assert.ok(!/\brgba?\(|\bhsla?\(|:\s*(white|black|gold|orange)\b/i.test(css), 'no other literal colour');
  for (const m of css.matchAll(/(?:^|[;{])\s*(color|background|text-shadow|box-shadow)\s*:\s*([^;}]+)/g)) assert.match(m[2], /var\(--ds-/, `${m[1]}: ${m[2]}`);
  // fonts: the two embedded families through their tokens, sizes from the type scale only
  for (const m of css.matchAll(/font(?:-family)?\s*:\s*([^;}]+)/g)) {
    assert.match(m[1], /var\(--ds-(text|pixel)\)/, `a font of the system: ${m[1]}`);
    assert.match(m[1], /var\(--ds-fs-[a-z-]+\)/, `a size of the scale: ${m[1]}`);
  }
  assert.ok(!/font-size\s*:/.test(css.replace(/font-size:var\(--ds-fs-[a-z-]+\)/g, '')), 'every font-size from the scale');
  // the gauge is the system's frame
  assert.match(css, /#ld-gauge\{[^}]*border-image:var\(--ds-f-gauge\)/);
  // main.ts builds no screen of its own any more (its one inline style left is the DEV sprite sheet's, ?sprites)
  const main = fs.readFileSync(path.join(ROOT, 'src/main.ts'), 'utf8');
  assert.ok(!/Segoe|system-ui|sans-serif|innerHTML|z-index:50|ld-label|ld-bar/i.test(main), 'main.ts: no screen of its own');
  assert.match(main, /showLoading\(parseTime\(params\)\)/, 'main.ts: the screen in the address\'s day state');
});
