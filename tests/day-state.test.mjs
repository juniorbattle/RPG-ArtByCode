// The day state (src/atmosphere/DayState.ts, journal Passe Y1): behind ?time=day only (the night stays the default until the operator's review
// in game, decision J9); by day only the forge burns (J4); a midday sun, high but never vertical (the sun's shadow camera looks along it), warm
// against a cool slate ambient and haze (J1, J2, J3).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { load } from './load.mjs';

const { parseTime, litByDay, DAY } = await load('/src/atmosphere/DayState.ts');
const { U } = await load('/src/atmosphere/SceneUniforms.ts');
const src = (f) => fs.readFileSync(f, 'utf8');
const q = (s) => new URLSearchParams(s);

test('parseTime: only ?time=midday (alias day) makes the day; the night is the default', () => {
  assert.equal(parseTime(q('')), null);
  assert.equal(parseTime(q('seed=1842&camera=B&clean=1&rain=1')), null, 'other parameters do not make the day');
  assert.equal(parseTime(q('time=day')), 'midday');
  assert.equal(parseTime(q('time=midday')), 'midday');
  assert.equal(parseTime(q('time=night')), null);
  assert.equal(parseTime(q('time=morning')), null, 'not built yet: the night');
  assert.equal(parseTime(q('time=Day')), null);
  assert.equal(parseTime(q('time')), null);
  // the day is a compile-time variant: the night's shaders hold no runtime day branch (a branch, even untaken, moved 1 / 255 on a few pixels)
  for (const f of ['src/atmosphere/Sky.ts', 'src/district/DistantCity.ts']) {
    assert.match(src(f), /#ifdef DAY/, f);
    assert.doesNotMatch(src(f), /uDay/, f);
  }
  assert.match(src('src/atmosphere/Sky.ts'), /defines: day \? \{ DAY: 1 \} : \{\}/);
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
