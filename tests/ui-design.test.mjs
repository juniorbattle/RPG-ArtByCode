// The interface's design system (journal Passe UI3; the operator's sheet of Passe UI1: S1 fonts, S2 frames, S3 palette, S4 sizes, L2 tones).
// Oracles independent of the code under test: the fonts' bytes against the table of FONTS.md, WCAG's contrast formula written out here, the
// frames' pixels against the tone's own colours and their nine-slice rules (an edge stretched must be uniform along its length), the sources'
// CSS against the size and font rules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from './load.mjs';

const T = await load('/src/ui/design/tokens.ts');
const F = await load('/src/ui/design/frames.ts');
const P = await load('/src/ui/portraits.ts');

/** WCAG 2.x relative luminance and contrast, written out (not through tokens.contrast) */
const lin = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const L = (h) => { const [r, g, b] = hexRgb(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

test('S1: the embedded fonts are the files FONTS.md records, byte for byte, under the OFL', () => {
  const dir = path.join(ROOT, 'src/ui/fonts'), md = fs.readFileSync(path.join(dir, 'FONTS.md'), 'utf8');
  const rows = [...md.matchAll(/^\| `([^`]+)` \|.*\| ([\d ]+) \| `([0-9a-f]{64})` \|$/gm)].map((m) => ({ file: m[1], bytes: +m[2].replace(/ /g, ''), sha: m[3] }));
  assert.equal(rows.length, 5, 'five rows: three fonts, two licences');
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

test('S1: no system font in the play mode\'s screens; the arena\'s HUD names one only for its hidden-HUD screens (hud=0, unchanged)', () => {
  const files = [...fs.readdirSync(path.join(ROOT, 'src/ui')).filter((f) => f.endsWith('.ts')).map((f) => `src/ui/${f}`), 'src/ui/design/system.ts', 'src/arena/ArenaHud.ts'];
  for (const f of files) {
    const lines = fs.readFileSync(path.join(ROOT, f), 'utf8').split(/\r?\n/);
    lines.forEach((l, i) => {
      if (!/Segoe|system-ui|sans-serif|serif[;"'`]|monospace|Arial|Helvetica/.test(l)) return;
      assert.ok(f === 'src/arena/ArenaHud.ts' && l.startsWith('#arena-hud.off #ah-ko,#arena-hud.off #ah-pause{'), `${f}:${i + 1} names a system font`);
    });
  }
});

test('S3 / L2: four tones with the same tokens, colours of the palette only (no green, no red), every text pair readable', () => {
  const keys = Object.keys(T.TONES.night).sort();
  assert.deepEqual(Object.keys(T.TONES).sort(), ['afternoon', 'midday', 'morning', 'night']);
  for (const [name, tone] of Object.entries(T.TONES)) {
    assert.deepEqual(Object.keys(tone).sort(), keys, `${name}: the same tokens`);
    for (const [k, c] of Object.entries(tone)) {
      if (k === 'scrim') { assert.match(c, /^rgba\(/); continue; }
      assert.match(c, /^#[0-9a-f]{6}$/, `${name}.${k}`);
      // hue and saturation (HSL): blues and indigos 200-262, golds / ambers / ivories 20-60, near-neutral otherwise; never a saturated green or red
      const [r, g, b] = hexRgb(c).map((v) => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 2;
      const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
      let h = 0;
      if (d) h = mx === r ? 60 * (((g - b) / d) % 6) : mx === g ? 60 * ((b - r) / d + 2) : 60 * ((r - g) / d + 4);
      h = (h + 360) % 360;
      const blue = h >= 200 && h <= 262, warm = h >= 20 && h <= 60;
      assert.ok(blue || warm || s < 0.25, `${name}.${k} ${c}: hue ${h.toFixed(0)}, saturation ${s.toFixed(2)} outside the palette`);
    }
    // the text pairs the screens use (WCAG AA 4.5:1 at least; the reading pairs AAA 7:1)
    for (const [fg, bg, min] of [['ivory', 'blue1', 7], ['ivory', 'blue0', 7], ['parchInk', 'parch', 7], ['ink', 'ivory', 7], ['muted', 'blue1', 4.5], ['muted', 'blue0', 4.5],
      ['goldHi', 'blue1', 4.5], ['amberHi', 'blue1', 4.5], ['amberHi', 'ink', 4.5], ['blue3', 'ink', 4.5], ['ivory', 'amberLo', 4.5], ['goldHi', 'ink', 4.5]]) {
      const c = ratio(tone[fg], tone[bg]);
      assert.ok(c >= min, `${name}: ${fg} on ${bg} ${c.toFixed(2)}:1 < ${min}:1`);
      assert.ok(Math.abs(T.contrast(tone[fg], tone[bg]) - c) < 1e-9, 'tokens.contrast agrees with the formula');
    }
  }
  // L2: the tones differ (a day state changes the interface's tones)
  assert.notEqual(T.TONES.night.blue1, T.TONES.midday.blue1);
  assert.equal(T.toneOf(null), T.TONES.night);
  assert.equal(T.toneOf('morning'), T.TONES.morning);
});

test('S4: the type scale keeps 16 px on a computer and 14 px on a phone; no smaller literal size in the screens\' CSS', () => {
  assert.deepEqual(T.MIN_TEXT, { desktop: 16, phone: 14 });
  for (const d of ['desktop', 'phone']) for (const [k, v] of Object.entries(T.TYPE[d])) assert.ok(v >= T.MIN_TEXT[d], `${d}.${k} = ${v}`);
  // the pixel font's sizes keep its pixel whole (it is drawn on a tenth of its em)
  for (const d of ['desktop', 'phone']) for (const k of ['pixel', 'pixelBig', 'pixelHuge']) assert.equal(T.TYPE[d][k] % 10, 0, `${d}.${k}`);
  const files = [...fs.readdirSync(path.join(ROOT, 'src/ui')).filter((f) => f.endsWith('.ts')).map((f) => `src/ui/${f}`), 'src/arena/ArenaHud.ts'];
  for (const f of files) {
    fs.readFileSync(path.join(ROOT, f), 'utf8').split(/\r?\n/).forEach((l, i) => {
      // a font size written in px (font-size:Npx or the font shorthand's size) under 16, outside the frozen hidden-HUD screens of the arena
      for (const m of l.matchAll(/font(?:-size)?:[^;}]*?(\d+(?:\.\d+)?)px/g)) {
        if (+m[1] >= 16) continue;
        const frozen = f === 'src/arena/ArenaHud.ts' && /^#ah-ko (span|b),#ah-pause (span|b)\{|^#arena-hud\.off #ah-ko/.test(l);
        assert.ok(frozen, `${f}:${i + 1}: ${m[0]}`);
      }
    });
  }
});

test('S2: every frame is a nine-slice image of the tone\'s colours, its edges uniform along their length, its outline symmetric', () => {
  for (const [name, tone] of Object.entries(T.TONES)) {
    const palette = new Set(Object.values(tone).filter((c) => c.startsWith('#')));
    for (const kind of F.FRAME_KINDS) {
      const fr = F.paintFrame(kind, tone), { w, h, slice: s, rgba } = fr;
      assert.equal(w, 3 * s); assert.equal(h, 3 * s);
      const px = (x, y) => { const i = (y * w + x) * 4; return rgba[i + 3] ? '#' + [0, 1, 2].map((j) => rgba[i + j].toString(16).padStart(2, '0')).join('') : null; };
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const c = px(x, y), a = rgba[(y * w + x) * 4 + 3];
        assert.ok(a === 0 || a === 255, `${name} ${kind} (${x},${y}): binary alpha`);
        if (c) assert.ok(palette.has(c), `${name} ${kind} (${x},${y}) ${c}: a tone colour`);
        // the alpha mask is symmetric left / right and top / bottom (studs and notches in every corner)
        assert.equal(a, rgba[(y * w + (w - 1 - x)) * 4 + 3], `${name} ${kind}: mirrored alpha at (${x},${y})`);
        assert.equal(a, rgba[((h - 1 - y) * w + x) * 4 + 3], `${name} ${kind}: flipped alpha at (${x},${y})`);
      }
      // stretched slices: the top / bottom edges constant along x, the left / right edges along y, the centre one colour (the fill)
      for (let y = 0; y < s; y++) for (const yy of [y, h - 1 - y]) for (let x = s; x < 2 * s; x++) assert.equal(px(x, yy), px(s, yy), `${name} ${kind}: top/bottom edge row ${yy}`);
      for (let x = 0; x < s; x++) for (const xx of [x, w - 1 - x]) for (let y = s; y < 2 * s; y++) assert.equal(px(xx, y), px(xx, s), `${name} ${kind}: left/right edge column ${xx}`);
      const fill = px(s, s);
      assert.ok(fill, `${name} ${kind}: an opaque centre`);
      for (let y = s; y < 2 * s; y++) for (let x = s; x < 2 * s; x++) assert.equal(px(x, y), fill, `${name} ${kind}: uniform centre`);
      // the outline is the tone's ink, except the tags' coloured rims
      if (!kind.startsWith('tag')) assert.equal(px(s, 0), tone.ink, `${name} ${kind}: ink outline`);
    }
  }
  // the light comes from the top left: a panel's top rim is lighter than its bottom rim
  const p = F.paintFrame('panel', T.TONES.midday), at = (x, y) => '#' + [0, 1, 2].map((j) => p.rgba[(y * p.w + x) * 4 + j].toString(16).padStart(2, '0')).join('');
  assert.equal(at(12, 1), T.TONES.midday.goldHi); assert.equal(at(12, p.h - 2), T.TONES.midday.gold);
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
