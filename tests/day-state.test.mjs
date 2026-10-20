// The day states (src/atmosphere/DayState.ts, journal Passes Y1, Y2, Y4): behind ?time=morning|midday|afternoon only (the night stays the default
// until the operator's review in game, decision J9); by day only the forge burns (J4); a midday sun, high but never vertical (the sun's shadow
// camera looks along it); a softer, lower morning sun in a cool haze, a low golden end-of-day sun (the operator's direction D6).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { load } from './load.mjs';

const { parseTime, litByDay, DAY, MORNING, AFTERNOON, LOOKS } = await load('/src/atmosphere/DayState.ts');
const { U } = await load('/src/atmosphere/SceneUniforms.ts');
const src = (f) => fs.readFileSync(f, 'utf8');
const q = (s) => new URLSearchParams(s);

test('parseTime: only ?time=morning, midday (alias day) and afternoon make the day; the night is the default', () => {
  assert.equal(parseTime(q('')), null);
  assert.equal(parseTime(q('seed=1842&camera=B&clean=1&rain=1')), null, 'other parameters do not make the day');
  assert.equal(parseTime(q('time=day')), 'midday');
  assert.equal(parseTime(q('time=midday')), 'midday');
  assert.equal(parseTime(q('time=night')), null);
  assert.equal(parseTime(q('time=morning')), 'morning');
  assert.equal(parseTime(q('time=afternoon')), 'afternoon');
  assert.equal(parseTime(q('time=evening')), null, 'the evening is the night (D6)');
  assert.equal(parseTime(q('time=Day')), null);
  assert.equal(parseTime(q('time=Morning')), null);
  assert.equal(parseTime(q('time')), null);
  // the day is a compile-time variant: the night's shaders hold no runtime day branch (a branch, even untaken, moved 1 / 255 on a few pixels)
  for (const f of ['src/atmosphere/Sky.ts', 'src/district/DistantCity.ts']) {
    assert.match(src(f), /#ifdef DAY/, f);
    assert.doesNotMatch(src(f), /uDay/, f);
  }
  assert.match(src('src/atmosphere/Sky.ts'), /defines: defines \? \{ \.\.\.defines \} : \{\}/);
  assert.match(src('src/app/App.ts'), /buildSky\(this\.look\?\.sky \?\? null\)/, 'the night builds the sky without defines');
  // midday keeps the shader of Passe Y2 exactly; the morning and the end of day add their own blocks, compiled only by them
  assert.deepEqual(DAY.sky, { DAY: 1 });
  assert.match(src('src/atmosphere/Sky.ts'), /#ifdef DAY_HAZE/);
  assert.match(src('src/atmosphere/Sky.ts'), /#ifdef DAY_SUN/);
  assert.deepEqual(Object.keys(LOOKS).sort(), ['afternoon', 'midday', 'morning']);
  assert.equal(LOOKS.midday, DAY);
  for (const [t, L] of Object.entries(LOOKS)) assert.equal(L.sky.DAY, 1, t + ': every day state compiles the day variant');
  assert.equal(new Set(Object.values(LOOKS).map((L) => L.label)).size, 3, 'three distinct HUD names');
});

test('litByDay: the forge burns by day (fire, embers, hot bar, the fill under its hood); lanterns, shop pools and candles are off', () => {
  const on = [
    { group: 'forge', kind: 'fire' }, { group: 'forge', kind: 'ember' }, { group: 'forge', kind: 'steady' },
    { group: 'static', kind: 'fire', tag: 'forge-fill' },
  ];
  const off = [
    { group: 'forge', kind: 'lantern' },                          // the forge's porch lanterns are lanterns
    { group: 'static', kind: 'lantern' }, { group: 'static', kind: 'candle' },
    { group: 'static', kind: 'window', tag: 'shop' },
  ];
  for (const l of on) assert.equal(litByDay(l), true, JSON.stringify(l));
  for (const l of off) assert.equal(litByDay(l), false, JSON.stringify(l));
  // the tags and groups it relies on are the generators' own
  assert.match(fs.readFileSync('src/architecture/BuildingGenerator.ts', 'utf8'), /tag: 'forge-fill'/);
  assert.match(fs.readFileSync('src/district/ForgeGenerator.ts', 'utf8'), /kind: 'fire'/);
});

test('the midday look: a high sun, never vertical; a blue sky and haze; the palette discipline of the night off (the midday track, D6)', () => {
  const d = DAY.sunDir, elev = Math.asin(d.y / d.length()) * 180 / Math.PI;
  assert.ok(Math.abs(d.length() - 1) < 1e-9, 'normalised');
  assert.ok(elev >= 45 && elev <= 70, `midday elevation ${elev.toFixed(1)} deg`);
  assert.ok(DAY.sunCol.r > DAY.sunCol.b, 'a warm-white sun');
  assert.equal(DAY.post.palette, 0, 'the palette discipline of the night would mute the blues');
  assert.ok(DAY.skyZenith.b > 2 * DAY.skyZenith.r, 'a deep blue zenith');
  for (const c of [DAY.skyAmb, DAY.fogColor, DAY.skyZenith]) assert.ok(c.b > c.r, 'slate / pale blue: cool');
  assert.ok(DAY.fogDensity < U.uFogDensity.value, 'a lighter haze than the night');
  assert.ok(DAY.glowEmissive < 0.5, 'the window glass is dim by day');
});

test('the morning and the end of day: a softer, lower morning sun in a cool haze; a low golden sun at the end of day (D6)', () => {
  const elev = (d) => Math.asin(d.y / d.length()) * 180 / Math.PI, mid = elev(DAY.sunDir);
  for (const L of [MORNING, AFTERNOON]) {
    assert.ok(Math.abs(L.sunDir.length() - 1) < 1e-9, 'normalised');
    assert.ok(elev(L.sunDir) >= 8 && elev(L.sunDir) < mid, L.label + ': lower than midday, never at the horizon');
    assert.ok(L.sunDir.z > 0, L.label + ': from the canal side, as on its track (the frontage lit, not backlit)');
    assert.equal(L.post.palette, 0, L.label + ': the night palette discipline off');
    assert.ok(L.glowEmissive < 0.5, L.label + ': lanterns and windows unlit (J4)');
  }
  assert.ok(elev(MORNING.sunDir) >= 20 && elev(MORNING.sunDir) <= 40, 'a morning sun not yet high');
  assert.ok(elev(AFTERNOON.sunDir) <= 22, 'a low end-of-day sun');
  assert.ok(AFTERNOON.sunDir.x > AFTERNOON.sunDir.z, 'at the far end of the canal, as on the late-afternoon track');
  // colours: a soft morning sun under a cool haze; a golden end-of-day sun and haze
  assert.ok(MORNING.sunCol.r < DAY.sunCol.r, 'the morning sun softer than midday');
  assert.ok(MORNING.fogColor.b > MORNING.fogColor.r && MORNING.skyAmb.b > MORNING.skyAmb.r, 'a cool morning haze');
  assert.ok(MORNING.fogDensity > DAY.fogDensity && MORNING.mist > DAY.mist, 'more haze and mist than midday');
  const c = AFTERNOON.sunCol;
  assert.ok(c.r > c.g && c.g > c.b && c.r > 2.5 * c.b, 'a golden sun');
  assert.ok(AFTERNOON.fogColor.r > AFTERNOON.fogColor.b, 'a warm haze');
  assert.ok(AFTERNOON.post.shadowTint.b > AFTERNOON.post.shadowTint.r, 'blue shadows against the warm light');
});
