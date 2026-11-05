// The gamepad (journal Passe MN2; the operator's sheet MN-1 to MN-11): its pure half against oracles written here, from the standard mapping and
// the sheet's tables (not from the code tested): the pad's family by the ids Chrome and Firefox give, the dead zone and the walk (MN-2), the keys a
// button presses in each context (MN-3, MN-4, MN-6), the duel's held commands with today's V2_PAD kept whole (MN-5), the pages' navigation and
// its repeat, every key cap the version 2's interface writes given a button or hidden, the glyphs inside the fonts' subset or drawn (MN-7, MN-8),
// the rumble (MN-9), and the wiring: the layer loaded on demand by the version 2's pages and the title screen only, today's arena reading its
// own pad as before.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from './load.mjs';

const P = await load('/src/input/pad.ts');
const G = await load('/src/input/glyphs.ts');
const { V2_PAD, V2_KEYS } = await load('/src/arena/v2Arena.ts');
const src = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');
const close = (a, b, e = 1e-9) => Math.abs(a - b) <= e;

/** the standard mapping, written from https://w3c.github.io/gamepad/#remapping */
const STD = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, VIEW: 8, START: 9, LS: 10, RS: 11, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15, HOME: 16 };
const snap = (down = [], axes = [0, 0, 0, 0]) => { const b = Array(17).fill(false); for (const i of down) b[i] = true; return { buttons: b, axes }; };

test('the buttons are the standard mapping\'s', () => {
  assert.deepEqual({ ...P.BTN }, STD);
});

test('the family by the ids Chrome and Firefox give', () => {
  const ids = {
    'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)': 'xbox',
    'Xbox 360 Controller (XInput STANDARD GAMEPAD)': 'xbox',
    '045e-02ea-Microsoft X-Box One S pad': 'xbox',
    'DualSense Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)': 'ps',
    'Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 09cc)': 'ps',
    '054c-0ce6-DualSense Wireless Controller': 'ps',
    'Pro Controller (STANDARD GAMEPAD Vendor: 057e Product: 2009)': 'nintendo',
    '057e-2009-Pro Controller': 'nintendo',
    'USB Gamepad (STANDARD GAMEPAD Vendor: 0079 Product: 0011)': 'xbox',
    '8BitDo SN30 Pro (Vendor: 2dc8 Product: 6101)': 'xbox',
    '': 'xbox',
  };
  for (const [id, f] of Object.entries(ids)) assert.equal(P.padFamily(id), f, id);
  // a product number that happens to contain 054c is not Sony's vendor
  assert.equal(P.padFamily('Some pad (Vendor: 1234 Product: 054c1)'), 'xbox');
});

test('the dead zone: nothing inside, rescaled to 1 at the rim, the direction kept', () => {
  assert.deepEqual(P.deadZone(0.1, -0.15), { x: 0, y: 0, mag: 0 });
  assert.equal(P.deadZone(P.DEAD, 0).mag, 0);
  assert.equal(P.deadZone(1, 0).mag, 1);
  assert.equal(P.deadZone(0, 1 - P.RIM).mag, 1);
  let last = 0;
  for (let m = P.DEAD + 0.01; m <= 1; m += 0.01) {
    const s = P.deadZone(m * Math.cos(1.1), m * Math.sin(1.1));
    assert.ok(s.mag >= last - 1e-12 && s.mag > 0 && s.mag <= 1, `monotone at ${m}`);
    assert.ok(close(Math.atan2(s.y, s.x), 1.1, 1e-9), 'the direction kept');
    last = s.mag;
  }
});

test('the walk (MN-2): the D-pad at full speed, the stick from 30 % to 1, B held runs', () => {
  assert.equal(P.walkOf(snap()), null);
  const right = P.walkOf(snap([STD.RIGHT]));
  assert.deepEqual(right, { x: 1, y: 0, speed: 1, run: false });
  const diag = P.walkOf(snap([STD.UP, STD.LEFT]));
  assert.ok(close(diag.x, -Math.SQRT1_2) && close(diag.y, Math.SQRT1_2) && diag.speed === 1);
  // the stick: up the screen is a negative axis 1
  const up = P.walkOf(snap([], [0, -1, 0, 0]));
  assert.ok(close(up.x, 0) && close(up.y, 1) && up.speed === 1 && !up.run);
  const slight = P.walkOf(snap([], [P.DEAD + 0.001, 0, 0, 0]));
  assert.ok(slight.speed >= 0.3 && slight.speed < 0.31, `the slowest walk ${slight.speed}`);
  assert.equal(P.walkOf(snap([], [0.5 * P.DEAD, 0, 0, 0])), null);
  assert.equal(P.walkOf(snap([STD.B], [1, 0, 0, 0])).run, true);
  assert.equal(P.walkOf(snap([STD.B], [0.5, 0, 0, 0]), true).run, false);
  assert.equal(P.walkOf(snap([], [1, 0, 0, 0]), true).run, true);
  // the D-pad wins over the stick
  assert.deepEqual(P.walkOf(snap([STD.DOWN], [1, 0, 0, 0])), { x: 0, y: -1, speed: 1, run: false });
});

test('the keys each button presses (MN-3, MN-4, MN-6), as the sheet\'s tables say', () => {
  assert.deepEqual({ ...P.KEYS.explore }, { [STD.A]: 'e', [STD.Y]: 'q', [STD.START]: 'Escape', [STD.VIEW]: 'm' });
  assert.deepEqual({ ...P.KEYS.page }, { [STD.A]: 'Enter', [STD.B]: 'Escape', [STD.X]: ' ', [STD.START]: 'Escape' });
  assert.deepEqual({ ...P.KEYS.scene }, { [STD.A]: 'Enter', [STD.START]: 'Escape' });
  assert.deepEqual({ ...P.TAB }, { [STD.LB]: -1, [STD.RB]: 1 });
  // the pages answer those keys: the town's interface, the squares and the district hear e / q / m / Escape, a cutscene Enter and Escape
  const town = src('src/ui/townUi.ts'), plaza = src('src/ui/playPlaza.ts'), scene = src('src/ui/cutscene.ts');
  for (const k of ["k === 'q'", "k === 'm'", "k === 'escape'"]) assert.ok(town.includes(k), k);
  assert.ok(plaza.includes("k === 'e'"));
  assert.ok(scene.includes("k === 'escape'") && scene.includes("k === 'enter'"));
});

test('the duel (MN-5): X or RT attack, B or LT guard, both held; A dodge, Start pause; today\'s V2_PAD kept whole', () => {
  const D = P.DUEL;
  assert.deepEqual({ ...D }, { [STD.X]: 'attack', [STD.RT]: 'attack', [STD.B]: 'guard', [STD.LT]: 'guard', [STD.A]: 'dodge', [STD.START]: 'pause', [STD.VIEW]: 'reset' });
  for (const [b, id] of Object.entries(V2_PAD)) assert.equal(D[b], id, `V2_PAD ${b}`);
  // the keyboard's held keys stay the held commands
  assert.deepEqual([...new Set(Object.values({ j: V2_KEYS.j, k: V2_KEYS.k }))].sort(), [...P.HELD].sort());
  const run = (seq) => { const out = []; let prev = snap().buttons; for (const down of seq) { const now = snap(down).buttons; out.push(...P.duelCommands(prev, now).map((c) => `${c.id}${c.down ? '+' : '-'}`)); prev = now; } return out.join(' '); };
  assert.equal(run([[STD.X], [STD.X], []]), 'attack+ attack-');
  // X then RT: letting X go keeps the charge, letting RT go launches it
  assert.equal(run([[STD.X], [STD.X, STD.RT], [STD.RT], []]), 'attack+ attack-');
  assert.equal(run([[STD.LT], [STD.LT, STD.B], [STD.B], []]), 'guard+ guard-');
  // the charge and the guard held together, the dodge pressed with the thumb
  assert.equal(run([[STD.RT], [STD.RT, STD.LT], [STD.RT, STD.LT, STD.A], [STD.RT, STD.LT], [STD.LT], []]), 'attack+ guard+ dodge+ attack- guard-');
  // the dodge, the pause and the restart on their press only
  assert.equal(run([[STD.A], [STD.A], [], [STD.START], [], [STD.VIEW]]), 'dodge+ pause+ reset+');
});

test('the pages\' navigation: the D-pad, the stick past half tilt held till 0.35, the repeat of a held direction', () => {
  assert.equal(P.navDir(snap([STD.DOWN]), null), 'down');
  assert.equal(P.navDir(snap([], [0, -0.6, 0, 0]), null), 'up');
  assert.equal(P.navDir(snap([], [0.45, 0, 0, 0]), null), null);
  assert.equal(P.navDir(snap([], [0.45, 0, 0, 0]), 'right'), 'right');
  assert.equal(P.navDir(snap([], [0.3, 0, 0, 0]), 'right'), null);
  assert.equal(P.navDir(snap([], [-0.7, 0.5, 0, 0]), null), 'left');
  const r = new P.Repeater(), steps = [];
  steps.push(...r.step('down', 0.016));
  for (let t = 0; t < 1.0; t += 0.02) steps.push(...r.step('down', 0.02));
  // once at once, again after 0.4 s, then every 0.12 s: 1 + floor((1.0 - 0.4) / 0.12) + 1 = 7 in the first second (± 1 for the frame's grid)
  assert.equal(steps[0].repeat, false);
  assert.ok(steps.slice(1).every((s) => s.repeat));
  assert.ok(steps.length >= 6 && steps.length <= 7, `${steps.length} steps`);
  assert.deepEqual(r.step(null, 0.02), []);
  assert.deepEqual(r.step('up', 0.02), [{ dir: 'up', repeat: false }]);
  // a long frame repeats at most four times
  assert.ok(r.step('up', 5).length <= 4);
  assert.equal(P.stepIndex(5, 4, 1), 0);
  assert.equal(P.stepIndex(5, 0, -1), 4);
  assert.equal(P.stepIndex(5, -1, 1), 0);
  assert.equal(P.stepIndex(5, -1, -1), 4);
  assert.equal(P.stepIndex(0, 0, 1), -1);
  const pages = ['map', 'journal', 'board', 'skills', 'gear', 'sound'];
  assert.equal(P.tabTo(pages, 'journal', 1), 'board');
  assert.equal(P.tabTo(pages, 'map', -1), 'sound');
  assert.equal(P.tabTo(pages, 'sound', 1), 'map');
  assert.equal(P.tabTo(pages, null, 1), null);
  assert.equal(P.tabTo(pages, 'menu', 1), null);
  assert.equal(P.contextOf({ scene: true, modal: true, duel: true, explore: true }), 'scene');
  assert.equal(P.contextOf({ scene: false, modal: true, duel: true, explore: true }), 'page');
  assert.equal(P.contextOf({ scene: false, modal: false, duel: true, explore: false }), 'duel');
  assert.equal(P.contextOf({ scene: false, modal: false, duel: false, explore: true }), 'explore');
  assert.equal(P.contextOf({ scene: false, modal: false, duel: false, explore: false }), null);
});

test('every key cap the version 2\'s interface writes shows a pad button or hides', () => {
  // the caps written by the play mode's pages (<kbd>X</kbd>, footBtn('X', ...), the menu's shortcuts) and by the version 2's duel HUD
  const ui = fs.readdirSync(path.join(ROOT, 'src/ui')).filter((f) => f.endsWith('.ts')).map((f) => src(`src/ui/${f}`)).join('\n');
  const keys = new Set();
  for (const m of ui.matchAll(/<kbd>([^<$]+)<\/kbd>/g)) keys.add(m[1]);
  for (const m of ui.matchAll(/footBtn\('([^']+)'/g)) keys.add(m[1]);
  for (const m of ui.matchAll(/, '([A-Z])'\);/g)) keys.add(m[1]);
  for (const m of ui.matchAll(/b\.primary \? '([^']+)' : '([^']+)'/g)) { keys.add(m[1]); keys.add(m[2]); }
  assert.deepEqual([...keys].sort(), ['E', 'Enter', 'Esc', 'G', 'J', 'K', 'M', 'N', 'Q', 'Space', 'T', 'V'].sort());
  const B = STD;
  const want = { E: B.A, Enter: B.A, Esc: B.B, Space: B.X, Q: B.Y, N: 'hide' };
  for (const [k, b] of Object.entries(want)) assert.equal(P.capButton(k, 'other'), b, k);
  assert.equal(P.capButton('Esc', 'hints'), B.START);
  assert.equal(P.capButton('Esc', 'scene'), B.START);
  assert.equal(P.capButton('E', 'scene'), B.A);
  for (const k of ['J', 'T', 'K', 'G', 'V']) assert.equal(P.capButton(k, 'menu'), 'hide', k);
  assert.equal(P.capButton('M', 'menu'), B.VIEW);
  // the version 2's duel: its bar's K, L, J, the dodge window's L, the pause's Space
  const hud = src('src/arena/DynamicHud.ts'), charge = hud.match(/const items: BarItem\[\] = ct \? \[([\s\S]*?)\] :/)[1];
  const bar = [...charge.matchAll(/key: '([^']+)'/g)].map((m) => m[1]);
  assert.deepEqual(bar, ['K', 'L', 'J']);
  assert.ok(hud.includes("<kbd>${charge ? 'L' : 'A'}</kbd>") && hud.includes('<kbd>Space</kbd>'));
  assert.deepEqual(['K', 'L', 'J', 'Space'].map((k) => P.capButton(k, 'arena')), [B.B, B.A, B.X, B.START]);
  // each shows the button that does it in the duel
  for (const k of ['K', 'L', 'J']) assert.equal(P.DUEL[P.capButton(k, 'arena')], V2_KEYS[k.toLowerCase()], k);
});

test('the glyphs (MN-7, MN-8): every button for every family, text inside the fonts\' subset, the rest drawn', () => {
  const range = src('src/ui/design/system.ts').match(/LATIN_RANGE = '([^']+)'/)[1].split(',').map((r) => r.trim().replace('U+', '').split('-').map((h) => parseInt(h, 16)));
  const inSubset = (c) => range.some(([a, b = a]) => c >= a && c <= b);
  const names = { xbox: ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'View', 'Menu'], ps: ['Cross', 'Circle', 'Square', 'Triangle', 'L1', 'R1', 'L2', 'R2', 'Create', 'Options'], nintendo: ['B', 'A', 'Y', 'X', 'L', 'R', 'ZL', 'ZR', 'Minus', 'Plus'] };
  for (const f of ['xbox', 'ps', 'nintendo']) {
    for (let b = 0; b <= 15; b++) {
      const c = G.capOf(f, b);
      assert.ok(c.html.length > 0 && c.label.length > 0, `${f} ${b}`);
      const text = c.html.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, '');
      for (const ch of text) assert.ok(inSubset(ch.codePointAt(0)), `${f} ${b}: ${ch} outside the subset`);
      if (b <= 9) assert.equal(c.label, names[f][b], `${f} ${b}`);
    }
    // the face buttons round, the shoulders pills
    for (let b = 0; b <= 3; b++) assert.equal(G.capOf(f, b).shape, 'round');
    for (let b = 4; b <= 7; b++) assert.equal(G.capOf(f, b).shape, 'pill');
  }
  for (let b = 0; b <= 3; b++) { assert.ok(G.capOf('ps', b).html.includes('<svg')); assert.ok(!G.capOf('xbox', b).html.includes('<svg')); }
  for (const f of ['xbox', 'ps']) for (const b of [STD.START, STD.VIEW]) assert.ok(G.capOf(f, b).html.includes('<svg'), `${f} ${b} drawn`);
  // MN-7 « Contour, sans couleur »: the outline carries no colour; the brands' only in the style the sheet set aside
  for (let b = 0; b <= 15; b++) assert.equal(G.capOf('xbox', b).colour, undefined);
  assert.ok(G.capOf('xbox', 0, 'colour').colour);
  // the drawn glyphs use the current colour only
  assert.ok(!/#[0-9a-f]{3,6}/i.test(G.PAD_CSS) && /currentColor/.test(G.capOf('ps', 1).html));
});

test('the rumble (MN-9): the player\'s hits, stronger for a heavy blow, a broken guard and the K.O.; nothing for a blow guarded or given', () => {
  assert.equal(P.rumbleOf({ type: 'impact', to: 'marek', result: 'hit', damage: 90, hp: 100 }), null);
  assert.equal(P.rumbleOf({ type: 'impact', to: 'ren', result: 'guarded', damage: 10, hp: 100 }), null);
  assert.equal(P.rumbleOf({ type: 'impact', to: 'ren', result: 'dodged', hp: 100 }), null);
  assert.equal(P.rumbleOf({ type: 'charge', to: 'ren' }), null);
  const light = P.rumbleOf({ type: 'impact', to: 'ren', result: 'hit', kind: 'light', damage: 8, hp: 100 }), heavy = P.rumbleOf({ type: 'impact', to: 'ren', result: 'hit', kind: 'heavy', damage: 40, hp: 100 });
  const broken = P.rumbleOf({ type: 'impact', to: 'ren', result: 'guardbreak', damage: 20, hp: 100 }), ko = P.rumbleOf({ type: 'impact', to: 'ren', result: 'hit', damage: 40, hp: 0 });
  const power = (r) => r.strong + r.weak;
  assert.ok(power(light) < power(heavy) && power(heavy) < power(broken) && power(broken) < power(ko));
  assert.ok(light.ms < heavy.ms && ko.ms >= 400);
  for (const r of [light, heavy, broken, ko]) assert.ok(r.strong <= 1 && r.weak <= 1 && r.ms > 0 && r.ms <= 500);
});

test('the wiring: loaded on demand by the version 2\'s pages and the title screen only; today\'s arena reads its own pad as before', () => {
  const files = fs.readdirSync(path.join(ROOT, 'src'), { recursive: true }).filter((f) => /\.ts$/.test(f)).map((f) => f.replace(/\\/g, '/'));
  const users = files.filter((f) => /import\(['"][./]*input\/PadInput['"]\)|from ['"][./]*input\/PadInput['"]/.test(src(`src/${f}`))).sort();
  assert.deepEqual(users, ['arena/ArenaApp.ts', 'ui/playPlaza.ts', 'ui/playTown.ts', 'ui/title.ts', 'ui/townUi.ts']);
  for (const f of users) assert.ok(!/^import [^;]*from '[^']*input\/PadInput'/m.test(src(`src/${f}`)), `${f}: no static import`);
  assert.ok(/if \(isV2\(st\)\) void import\('\.\.\/input\/PadInput'\)/.test(src('src/ui/playTown.ts')), 'the town: a version 2 game only');
  assert.ok(/if \(this\.charge\) void import\('\.\.\/input\/PadInput'\)/.test(src('src/arena/ArenaApp.ts')), 'the arena: the version 2\'s charged duel only');
  const poll = src('src/arena/ArenaApp.ts').match(/private pollPad\(\): void \{([\s\S]*?)\n  \}/)[1];
  assert.ok(/if \(this\.charge\) return;/.test(poll) && /navigator\.getGamepads/.test(poll) && /pads && pads\[0\]/.test(poll), 'pollPad kept for the other arenas');
  // the review's glyphs on the DEV server only
  assert.ok(/import\.meta\.env\.DEV && params\.has\('padglyph'\)/.test(src('src/main.ts')));
  // the pad's walk is read only when no movement key asks for one
  assert.ok(/return !kx && !ky \? this\.pad : null;/.test(src('src/characters/ActorSystem.ts')));
  assert.ok(/const pw = !kx && !kz \? this\.pad : null/.test(src('src/world/PlazaApp.ts')));
});
