// The arena's day states (the operator's decision L7-2, « Oui, après la revue du jour (J9), par DayState », journal Passe AD1): the play mode's
// duel and forecourt take the slot's day state through ?time= (the duel's afternoon is midday); ?scene=arena without it stays the night. By day
// only the arena's fires burn (J4 transposed); the morning's and midday's suns keep their place against the moon, the end of day's low sun stands
// in the gate where the moon hangs at night.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { load } from './load.mjs';

const { arenaLitByDay, arenaSunDir, LOOKS } = await load('/src/atmosphere/DayState.ts');
const THREE = await load('/node_modules/three/build/three.module.js');
const G = await load('/src/simulation/index.ts');
const src = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const D = Math.PI / 180;

test('arenaQuery: the slot\'s day state for the duel and the forecourt; the night has none', () => {
  // the oracle: the slot of each named state, written out (src/simulation/named.ts), not lookOf
  const want = {
    'day1-morning': 'morning', 'forecourt-morning': 'morning', 'day2-morning': 'morning',
    'day2-afternoon': 'midday', 'day3-afternoon': 'midday',
    'day2-dusk-won': 'afternoon', 'day2-dusk-lost': 'afternoon', 'forecourt-dusk-lost': 'afternoon',
    'day1-evening': null, 'lanterns-night': null, 'trained-day1-evening': null,
  };
  for (const [name, t] of Object.entries(want)) {
    const q = G.arenaQuery(G.namedState(name));
    assert.equal(q.seed, '1842', name);
    assert.equal(q.time ?? null, t, name);
    assert.deepEqual(Object.keys(q).sort(), t ? ['seed', 'time'] : ['seed'], `${name}: nothing else changes the arena`);
  }
});

test('the duel and the forecourt build their arena from arenaQuery; the default ?scene=arena reads ?time= only through parseTime', () => {
  assert.match(src('src/ui/playArena.ts'), /const q = new URLSearchParams\(arenaQuery\(st\)\);/);
  assert.match(src('src/ui/playForecourt.ts'), /const q = new URLSearchParams\(\{ \.\.\.arenaQuery\(st\), hud: '0' \}\);/);
  const app = src('src/arena/ArenaApp.ts');
  assert.match(app, /const t = parseTime\(q\);\n {4}this\.look = t \? LOOKS\[t\] : null;/);
  assert.match(app, /this\.keyDir = t \? arenaSunDir\(t, MOON_DIR\) : MOON_DIR\.clone\(\);/);
  // the night's calls, as before the day (main eebbcd3): the sky, the moon's shadow box, the arena built without the coals apart
  assert.match(app, /buildSky\(this\.look\?\.sky \?\? null\)/);
  assert.match(app, /else this\.shadow\.update\(this\.renderer, this\.scene, new THREE\.Vector3\(0, 3\.5, -6\), MOON_DIR, 24, 9\);/);
  assert.match(app, /buildArena\(this\.lib, seed, \{ fireApart: !!this\.look \}\)/);
});

test('arenaLitByDay: the fires burn by day (braziers, the tunnels\' hearths); lanterns, lamp posts and the moon bounce are off', () => {
  assert.equal(arenaLitByDay({ kind: 'fire' }), true);
  for (const kind of ['lantern', 'steady', 'candle', 'flicker']) assert.equal(arenaLitByDay({ kind }), false, kind);
  // the arena's own lights (ArenaScene.ts): every 'fire' is a brazier or a hearth, every lantern is a lantern or a lamp post
  const scene = src('src/arena/ArenaScene.ts'), kinds = [...scene.matchAll(/lights\.push\(\{[^\n]*?kind: '([a-z]+)'/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(kinds)].sort(), ['fire', 'lantern', 'steady']);
  assert.equal(kinds.filter((k) => k === 'fire').length, 3, 'the tunnels\' hearth, the gate\'s braziers, the front braziers');
});

test('arenaSunDir: the state\'s elevation; morning and midday turned 97.5 deg from the district, the end of day in the moon\'s azimuth', () => {
  // the arena's moon, built here from its angles (ArenaApp: elevation 6.5 deg, azimuth 4 deg right of the gate's axis, -z)
  const moon = new THREE.Vector3(Math.sin(4 * D) * Math.cos(6.5 * D), Math.sin(6.5 * D), -Math.cos(4 * D) * Math.cos(6.5 * D));
  const az = (v) => Math.atan2(v.x, v.z) / D, el = (v) => Math.asin(v.y / v.length()) / D, wrap = (a) => ((a % 360) + 540) % 360 - 180;
  for (const t of ['morning', 'midday', 'afternoon']) {
    const s = arenaSunDir(t, moon), town = LOOKS[t].sunDir;
    assert.ok(Math.abs(s.length() - 1) < 1e-9, `${t}: unit`);
    assert.ok(Math.abs(el(s) - el(town)) < 1e-6, `${t}: elevation ${el(s)} vs ${el(town)}`);
    const wantAz = t === 'afternoon' ? az(moon) : az(town) + 97.5;
    assert.ok(Math.abs(wrap(az(s) - wantAz)) < 1e-6, `${t}: azimuth ${az(s)} vs ${wantAz}`);
  }
  // measured values: the end of day low (16 deg) in the gate (176 deg); midday high behind the right of the ring; the morning from the right
  assert.ok(Math.abs(az(arenaSunDir('afternoon', moon)) - 176) < 1e-6);
  assert.ok(el(arenaSunDir('afternoon', moon)) < 20 && el(arenaSunDir('midday', moon)) > 50);
  assert.ok(arenaSunDir('morning', moon).x > 0.6 && arenaSunDir('midday', moon).z < 0);
});
