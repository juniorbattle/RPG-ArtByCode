// The interface's design system (journal Passes UI3 / UM1, direction A « Voile »: S1 fonts, S3 palette lightened, S4 sizes, L2 tones; S2's frames
// lifted). Oracles independent of the code under test: the fonts' bytes against the table of FONTS.md, WCAG's contrast formula written out here,
// the sources' CSS against the size, font and shape rules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from './load.mjs';

const T = await load('/src/ui/design/tokens.ts');
const P = await load('/src/ui/portraits.ts');

/** WCAG 2.x relative luminance and contrast, written out (not through tokens.contrast) */
const lin = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const L = (h) => { const [r, g, b] = hexRgb(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

test('S1: the embedded fonts are the files FONTS.md records, byte for byte, under the OFL', () => {
  const dir = path.join(ROOT, 'src/ui/fonts'), md = fs.readFileSync(path.join(dir, 'FONTS.md'), 'utf8');
  const rows = [...md.matchAll(/^\| `([^`]+)` \|.*\| ([\d ]+) \| `([0-9a-f]{64})` \|$/gm)].map((m) => ({ file: m[1], bytes: +m[2].replace(/ /g, ''), sha: m[3] }));
  assert.equal(rows.length, 4, 'four rows: two fonts, two licences');
  for (const r of rows) {
    const b = fs.readFileSync(path.join(dir, r.file));
    assert.equal(b.length, r.bytes, `${r.file}: size`);
    assert.equal(crypto.createHash('sha256').update(b).digest('hex'), r.sha, `${r.file}: SHA-256`);
    if (r.file.endsWith('.woff2')) assert.equal(b.subarray(0, 4).toString('latin1'), 'wOF2', `${r.file}: a WOFF2 file`);
    else assert.match(b.toString('utf8'), /SIL Open Font License, Version 1\.1/, `${r.file}: the OFL`);
  }
  // every file of the folder is in the table (nothing embedded without its record)
  for (const f of fs.readdirSync(dir)) if (f !== 'FONTS.md') assert.ok(rows.some((r) => r.file === f), `${f} recorded`);
});

test('S1: no system font in the play mode\'s screens and the arena\'s HUD', () => {
  const files = [...fs.readdirSync(path.join(ROOT, 'src/ui')).filter((f) => f.endsWith('.ts')).map((f) => `src/ui/${f}`), 'src/ui/design/system.ts', 'src/arena/ArenaHud.ts', 'src/debug/Hud.ts', 'index.html'];
  for (const f of files) {
    const lines = fs.readFileSync(path.join(ROOT, f), 'utf8').split(/\r?\n/);
    lines.forEach((l, i) => {
      assert.ok(!/Segoe|system-ui|sans-serif|serif[;"'`]|monospace|Arial|Helvetica/.test(l), `${f}:${i + 1} names a system font`);
    });
  }
});

test('S3 / L2: four tones with the same tokens, ivory, ink and one accent (no green, no red), every text pair readable', () => {
  const keys = Object.keys(T.TONES.night).sort();
  assert.deepEqual(Object.keys(T.TONES).sort(), ['afternoon', 'midday', 'morning', 'night']);
  for (const [name, tone] of Object.entries(T.TONES)) {
    assert.deepEqual(Object.keys(tone).sort(), keys, `${name}: the same tokens`);
    for (const [k, c] of Object.entries(tone)) {
      if (k === 'scrim' || k === 'line' || k === 'trough') { assert.match(c, /^rgba\(/); continue; }
      assert.match(c, /^#[0-9a-f]{6}$/, `${name}.${k}`);
      // hue and saturation (HSL): the inks' blues 200-262, the accents' golds and ambers 20-60, near-neutral otherwise; never a saturated green or red
      const [r, g, bl] = hexRgb(c).map((v) => v / 255), mx = Math.max(r, g, bl), mn = Math.min(r, g, bl), d = mx - mn, l = (mx + mn) / 2;
      const sat = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
      let h = 0;
      if (d) h = mx === r ? 60 * (((g - bl) / d) % 6) : mx === g ? 60 * ((bl - r) / d + 2) : 60 * ((r - g) / d + 4);
      h = (h + 360) % 360;
      const blue = h >= 200 && h <= 262, warm = h >= 20 && h <= 60;
      assert.ok(blue || warm || sat < 0.25, `${name}.${k} ${c}: hue ${h.toFixed(0)}, saturation ${sat.toFixed(2)} outside the palette`);
    }
    // on the ink itself (a veil only lowers these: tools/ui-contrast.mjs measures them over the live scene)
    for (const [fg, min] of [['ivory', 7], ['muted', 7], ['accent', 7]]) {
      const c = ratio(tone[fg], tone.ink);
      assert.ok(c >= min, `${name}: ${fg} on ink ${c.toFixed(2)}:1 < ${min}:1`);
      assert.ok(Math.abs(T.contrast(tone[fg], tone.ink) - c) < 1e-9, 'tokens.contrast agrees with the formula');
    }
    // the text stays ivory and grey, the accent gold by day and amber at night (UM-S3)
    assert.equal(tone.ivory, T.TONES.night.ivory);
    assert.equal(tone.muted, T.TONES.night.muted);
    assert.equal(tone.accent, name === 'night' ? '#e9a64c' : '#f2c15a', `${name}: its accent`);
  }
  // L2: the ink slides with the light
  assert.equal(new Set(Object.values(T.TONES).map((t) => t.ink)).size, 4);
  assert.equal(T.toneOf(null), T.TONES.night);
  assert.equal(T.toneOf('morning'), T.TONES.morning);
  // a plain text needs a veil of 58 % at least (journal Passe UM1): the softest is above it
  assert.ok(T.VEIL.soft >= 58 && T.VEIL.mid > T.VEIL.soft && T.VEIL.strong > T.VEIL.mid);
});

test('S4: the type scale keeps 16 px on a computer and 14 px on a phone; no smaller literal size in the screens\' CSS', () => {
  assert.deepEqual(T.MIN_TEXT, { desktop: 16, phone: 14 });
  for (const d of ['desktop', 'phone']) for (const [k, v] of Object.entries(T.TYPE[d])) assert.ok(v >= T.MIN_TEXT[d], `${d}.${k} = ${v}`);
  const files = [...fs.readdirSync(path.join(ROOT, 'src/ui')).filter((f) => f.endsWith('.ts')).map((f) => `src/ui/${f}`), 'src/arena/ArenaHud.ts'];
  for (const f of files) {
    fs.readFileSync(path.join(ROOT, f), 'utf8').split(/\r?\n/).forEach((l, i) => {
      // a font size written in px (font-size:Npx or the font shorthand's size) under 16
      for (const m of l.matchAll(/font(?:-size)?:[^;}]*?(\d+(?:\.\d+)?)px/g)) assert.ok(+m[1] >= 16, `${f}:${i + 1}: ${m[0]}`);
    });
  }
});

test('UM2-3: the digits of the title font come from the text font; UM-R1, UM-R2: one menu, the list on demand, the bout\'s prompt', () => {
  const S = fs.readFileSync(path.join(ROOT, 'src/ui/design/system.ts'), 'utf8'), U = fs.readFileSync(path.join(ROOT, 'src/ui/townUi.ts'), 'utf8');
  assert.match(S, /font-family:\$\{TITLE\};src:url\(\$\{textFont\}\)[^}]*unicode-range:\$\{DIGITS\}/);
  assert.match(S, /DIGITS = 'U\+0030-0039'/);
  // no bar of keys and no panel on the scene: the state, the prompt, the list's and the menu's keys
  assert.ok(!/pm-bar|pm-here/.test(U), 'the former bar and panel are gone');
  for (const key of ["k === 'q'", "k === 'm'", "k === 'j'", "k === 't'", "k === 'k'", "k === 'g'", "k === 'v'", "k === 'escape'"]) assert.ok(U.includes(key), key);
  // the menu shows the shortcuts
  for (const k of ['M', 'J', 'T', 'K', 'G', 'V']) assert.match(U, new RegExp(`, '${k}'\\)`), `the menu's ${k}`);
  assert.match(U, /tx\('ui\.enterArena'\)\) : tx\('ui\.here'\)/, 'the bout keeps its prompt');
});

test('UM-T2, lot 2: one sign for an alert, the K.O. alone on the screen, the tiers only while charging, one preparation screen', () => {
  const A = fs.readFileSync(path.join(ROOT, 'src/arena/ArenaHud.ts'), 'utf8'), D = fs.readFileSync(path.join(ROOT, 'src/arena/DynamicHud.ts'), 'utf8'), P = fs.readFileSync(path.join(ROOT, 'src/ui/playArena.ts'), 'utf8');
  assert.ok(!A.includes('ah-title') && !D.includes('ah-title'), 'no title on the duel');
  assert.match(D, /#arena-hud\.al #ah-phase\{opacity:0\}/);
  assert.match(A, /#arena-hud\.ko>\*:not\(#ah-ko\)\{opacity:0\}/);
  assert.match(D, /#ah-tiers\{[^}]*opacity:0/);
  assert.match(D, /#ah-tiers\.on\{opacity:1\}/);
  assert.ok(!/ui\.arena\.keys/.test(P), 'no paragraph of keys');
  assert.match(P, /v2 && !challenge \? gate/, 'the version 2\'s gate: its stage and the name');
});

test('UM-R3, UM-R5: no developer\'s word on screen, Explore in the system, no minimap', () => {
  const en = fs.readFileSync(path.join(ROOT, 'src/narrative/text/en.ts'), 'utf8').split(/\r?\n/).filter((l) => !/^\s*\/\//.test(l)).join('\n');
  for (const w of [/\bslice\b/i, /mock-up/i, /first build/i, /provisional/i]) assert.ok(!w.test(en.replace(/'clock\.sliceOver'/, '')), `en.ts: ${w}`);
  const src = ['src/main.ts', 'src/ui/loading.ts', 'src/ui/playTown.ts', 'src/ui/playPlaza.ts', 'src/ui/playArena.ts', 'src/ui/playForecourt.ts', 'src/ui/playLanterns.ts'].map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
  assert.ok(!src.includes('GENERATING'), 'no generator phase on the loading screen');
  const hud = fs.readFileSync(path.join(ROOT, 'src/debug/Hud.ts'), 'utf8');
  assert.ok(!/canvas|drawMap|minimap\b.*=|Palatino|Georgia/.test(hud.replace(/\/\*\*[\s\S]*?\*\//g, '')), 'the HUD: no minimap, no font of its own');
  assert.match(hud, /var\(--ds-title\)/);
});

test('UM-T2, lot 5: the moves are the direction\'s and they yield to reduced motion', () => {
  const S = fs.readFileSync(path.join(ROOT, 'src/ui/design/system.ts'), 'utf8'), St = fs.readFileSync(path.join(ROOT, 'src/ui/style.ts'), 'utf8'), A = fs.readFileSync(path.join(ROOT, 'src/arena/ArenaHud.ts'), 'utf8');
  // a fade and a slide of 8 px in 160 ms, a rule traced from the left, a band rising from the edge
  assert.match(S, /@keyframes ds-in\{from\{opacity:0;transform:translateY\(8px\)\}\}/);
  assert.match(S, /@keyframes ds-rule\{from\{transform:scaleX\(0\)\}\}/);
  assert.match(St, /\.pm-overlay \.pm-card\{animation:ds-in \.16s ease-out\}/);
  assert.match(St, /\.pm-talk\{animation:ds-rise/);
  assert.match(St, /transform-origin:left center;animation:ds-rule/);
  // no motion for a reader who asked for none
  assert.match(St, /prefers-reduced-motion:reduce\)\{\.pm,\.pm \*,\.pm \*::before,\.pm \*::after\{transition:none!important;animation:none!important\}\}/);
  assert.match(A, /prefers-reduced-motion:reduce\)\{[^\n]*#ah-ko\.on b[^\n]*\{animation:none\}/);
});

test('UM-S2: no frame left: no border image, no texel grid, no pixel font, no pixelated box; only the faces and the hero\'s figure keep their pixels', () => {
  assert.ok(!fs.existsSync(path.join(ROOT, 'src/ui/design/frames.ts')), 'frames.ts is gone');
  const files = [...fs.readdirSync(path.join(ROOT, 'src/ui')).filter((f) => f.endsWith('.ts')).map((f) => `src/ui/${f}`), 'src/ui/design/system.ts', 'src/ui/design/tokens.ts', 'src/arena/ArenaHud.ts', 'src/arena/DynamicHud.ts'];
  for (const f of files) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    for (const banned of ['border-image', '--ds-f-', '--ds-px', '--ds-pixel', 'Pixelify', 'Alegreya', '--ds-gold', '--ds-blue', '--ds-parch', '--ds-amber', 'drop-shadow']) assert.ok(!src.includes(banned), `${f}: ${banned}`);
    for (const l of src.split(/\r?\n/)) if (l.includes('image-rendering:pixelated')) assert.match(l, /^(\.pm-port img|\s*\.pm-dlg img|\.ah-port|\.pm-hero|\.pm-ghead img|\.pm-who img)/,`${f}: pixelated outside a face: ${l.slice(0, 60)}`);
  }
});

test('the dialogue: a band at the foot of the screen in every game, the price said once', async () => {
  const src = fs.readFileSync(path.join(ROOT, 'src/ui/townUi.ts'), 'utf8');
  assert.match(src, /el\('div', 'pm pm-talk'\)/, 'the band, with no version 2 condition');
  const U = await load('/src/ui/townUi.ts');
  assert.equal(U.shortLabel({ label: 'Buy a whetstone (8 coins: +5 % damage at your next bout)', coins: 8 }), 'Buy a whetstone · +5 % damage at your next bout');
  assert.equal(U.shortLabel({ label: 'Have Bram temper your blade in the Wyrmsteel (10 coins: +15 % damage)', coins: 10 }), 'Have Bram temper your blade in the Wyrmsteel · +15 % damage');
  assert.equal(U.shortLabel({ label: 'Have Hilde check every strap of your gear (5 coins)', coins: 5 }), 'Have Hilde check every strap of your gear');
  // another amount, no coins: the words stay
  assert.equal(U.shortLabel({ label: 'Buy a whetstone (8 coins: +5 %)', coins: 9 }), 'Buy a whetstone (8 coins: +5 %)');
  assert.equal(U.shortLabel({ label: 'Help Mara unload her morning crates (+6 coins, her goodwill)', coins: 0 }), 'Help Mara unload her morning crates (+6 coins, her goodwill)');
});

test('L4: a baked face is cropped around the figure\'s head, from its top row', () => {
  // a 64 x 96 frame: a head 12 texels wide at x 30..41 from row 20, a body below it wider and off-centre
  const fw = 64, fh = 96, rgba = new Uint8Array(fw * fh * 4);
  const fill = (x0, x1, y0, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) rgba[(y * fw + x) * 4 + 3] = 255; };
  fill(30, 41, 20, 31); fill(10, 50, 32, 90);
  // head centre (30 + 42) / 2 = 36 -> x 36 - 16 = 20; top 20 - 2 = 18
  assert.deepEqual(P.faceCrop(rgba, fw, fh), { x: 20, y: 18, size: 32 });
  // clamped inside the frame: a head at the left edge, at the top
  const r2 = new Uint8Array(fw * fh * 4);
  for (let y = 0; y < 10; y++) for (let x = 0; x < 6; x++) r2[(y * fw + x) * 4 + 3] = 255;
  assert.deepEqual(P.faceCrop(r2, fw, fh), { x: 0, y: 0, size: 32 });
});
