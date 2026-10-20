// Weather (src/atmosphere/Weather.ts, journal Passe W1): each effect behind its own URL parameter; without any of them nothing is created and
// no shared uniform moves (the default game is unchanged); the lightning is seeded, scales the shared light / haze uniforms during a flash and
// gives them back afterwards (or keeps a value the app wrote meanwhile). By day (journal Passe Y5) the cover veils the sun and greys the sky; at
// night none of it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';

const { parseWeather, Weather, RAIN_MAX, SNOW_MAX } = await load('/src/atmosphere/Weather.ts');
const { U } = await load('/src/atmosphere/SceneUniforms.ts');
const { DAY } = await load('/src/atmosphere/DayState.ts');
const THREE = await import('three');
const q = (s) => new URLSearchParams(s);

/** the shared uniforms a weather writes, as plain numbers */
const snap = () => JSON.stringify(['uWet', 'uRain', 'uSnow', 'uCloud', 'uWindAmp', 'uMist', 'uFogDensity', 'uMoonCol', 'uSkyAmb', 'uGroundAmb', 'uFillCol', 'uFogColor']
  .map((k) => { const v = U[k].value; return typeof v === 'number' ? v : v.toArray(); }));
const reset = (s) => { const o = JSON.parse(s), ks = ['uWet', 'uRain', 'uSnow', 'uCloud', 'uWindAmp', 'uMist', 'uFogDensity', 'uMoonCol', 'uSkyAmb', 'uGroundAmb', 'uFillCol', 'uFogColor'];
  ks.forEach((k, i) => { if (typeof U[k].value === 'number') U[k].value = o[i]; else U[k].value.fromArray(o[i]); }); };

test('parseWeather: no parameter = no weather; bare = 1; clamped; storm brings rain and wind unless given', () => {
  assert.equal(parseWeather(q('')), null);
  assert.equal(parseWeather(q('seed=1842&camera=B&clean=1')), null, 'other parameters do not make a weather');
  assert.deepEqual(parseWeather(q('rain')), { rain: 1, snow: 0, storm: 0, wind: 1 });
  assert.deepEqual(parseWeather(q('rain=0.4')), { rain: 0.4, snow: 0, storm: 0, wind: 1 });
  assert.deepEqual(parseWeather(q('snow=7&wind=-2')), { rain: 0, snow: 1, storm: 0, wind: 0 }, 'clamped');
  assert.deepEqual(parseWeather(q('wind=2.5')), { rain: 0, snow: 0, storm: 0, wind: 2.5 });
  assert.deepEqual(parseWeather(q('storm')), { rain: 0.85, snow: 0, storm: 1, wind: 2 });
  assert.deepEqual(parseWeather(q('storm=1&rain=0.2&wind=0.5')), { rain: 0.2, snow: 0, storm: 1, wind: 0.5 }, 'given values win');
  assert.deepEqual(parseWeather(q('rain=abc')), { rain: 0, snow: 0, storm: 0, wind: 1 }, 'unreadable = its default');
});

test('a weather writes the scene uniforms once and draws its precipitation in one instanced mesh each', () => {
  const before = snap();
  const w = new Weather({ rain: 0.5, snow: 0, storm: 0, wind: 2 });
  assert.equal(U.uRain.value, 0.5); assert.equal(U.uSnow.value, 0); assert.equal(U.uWindAmp.value, 2);
  assert.ok(Math.abs(U.uWet.value - 1.15) < 1e-9, 'wetter cobbles');
  assert.ok(U.uCloud.value > 0, 'overcast');
  assert.equal(w.group.children.length, 1, 'rain only');
  assert.equal(w.rain.mesh.geometry.instanceCount, RAIN_MAX / 2);
  assert.equal(w.drops(), RAIN_MAX / 2);
  assert.equal(w.snow, null);
  const s = new Weather({ rain: 0, snow: 1, storm: 0, wind: 1 });
  assert.equal(s.snow.mesh.geometry.instanceCount, SNOW_MAX);
  assert.ok(U.uWet.value < 0.2, 'snow: the puddles go');
  reset(before);
});

test('lightning: seeded, scales the light during a flash, restores it after, keeps a value written meanwhile', () => {
  const before = snap();
  const cam = new THREE.PerspectiveCamera(); cam.position.set(0, 5, 20); cam.updateMatrixWorld();
  const run = () => {
    reset(before);
    const w = new Weather({ rain: 0, snow: 0, storm: 1, wind: 1 }), levels = [];
    for (let i = 0; i < 60 * 40; i++) { w.update(i / 60, cam, new THREE.Vector3()); levels.push(w.flashLevel); }
    return { w, levels };
  };
  const a = run(), b = run();
  assert.deepEqual(a.levels, b.levels, 'the same flashes every run (seeded, on the scene clock)');
  const flashes = a.levels.filter((v, i) => v > 0.05 && !(a.levels[i - 1] > 0.05)).length;
  assert.ok(flashes >= 3 && flashes <= 12, `${flashes} flashes in 40 s`);
  assert.ok(Math.max(...a.levels) > 0.5, 'a visible flash');
  // after the last flash has decayed the shared uniforms are back to their base
  const w = a.w, base = new THREE.Color().copy(U.uMoonCol.value);
  let t = 40, i = 0;
  while (w.flashLevel < 0.3 && i++ < 60 * 60) { t += 1 / 60; w.update(t, cam, new THREE.Vector3()); }
  assert.ok(w.flashLevel >= 0.3, 'a flash came');
  assert.ok(U.uMoonCol.value.r > base.r * 1.3, 'the moonlight lifts during it');
  for (let k = 0; k < 120; k++) { t += 1 / 60; w.update(t, cam, new THREE.Vector3()); if (w.flashLevel < 1e-3) break; }
  w.update(t + 1 / 60, cam, new THREE.Vector3());
  assert.ok(w.flashLevel < 1e-3);
  assert.deepEqual(U.uMoonCol.value.toArray(), base.toArray(), 'restored exactly');
  // a value the app writes during a flash is kept (the debug panel's moon slider)
  while (w.flashLevel < 0.3) { t += 1 / 60; w.update(t, cam, new THREE.Vector3()); }
  U.uMoonCol.value.setRGB(0.1, 0.2, 0.3);
  t += 1 / 60; w.update(t, cam, new THREE.Vector3());
  for (let k = 0; k < 200 && w.flashLevel > 1e-3; k++) { t += 1 / 60; w.update(t, cam, new THREE.Vector3()); }
  w.update(t + 1 / 60, cam, new THREE.Vector3());
  assert.deepEqual(U.uMoonCol.value.toArray().map((v) => +v.toFixed(6)), [0.1, 0.2, 0.3], 'the written value survives the flash');
  reset(before);
});

test('a frozen clock never fires a flash by itself; strike() shows one', () => {
  const before = snap();
  const cam = new THREE.PerspectiveCamera();
  const w = new Weather({ rain: 0, snow: 0, storm: 1, wind: 1 });
  for (let i = 0; i < 600; i++) w.update(7.3, cam, new THREE.Vector3());
  assert.equal(w.flashLevel, 0, 'frozen time: no flash');
  w.strike(7.3); w.update(7.3, cam, new THREE.Vector3());
  assert.ok(w.flashLevel > 0.5);
  reset(before);
});

test('dispose gives every scene uniform back, the light of a flash in progress included (the weather changed while playing; Passe W2)', () => {
  const before = snap();
  const cam = new THREE.PerspectiveCamera();
  const w = new Weather({ rain: 1, snow: 0.6, storm: 1, wind: 2.5 });
  assert.notEqual(snap(), before, 'the weather changed the scene');
  w.strike(3); w.update(3, cam, new THREE.Vector3());
  assert.ok(w.flashLevel > 0.5, 'a flash is lighting the scene');
  w.dispose();
  assert.equal(snap(), before, 'every uniform as before');
  // two weathers one after the other (the panel): the second one's dispose comes back to the first state too
  const a = new Weather({ rain: 0.3, snow: 0, storm: 0, wind: 1 }); a.dispose();
  const b = new Weather({ rain: 0, snow: 1, storm: 0, wind: 0 }); b.dispose();
  assert.equal(snap(), before);
});

test('the bolt (Passe W3): in the sky only during a strong flash, gone after it and after dispose', () => {
  const before = snap();
  const cam = new THREE.PerspectiveCamera(); cam.position.set(0, 3, 20); cam.lookAt(10, 3, 0); cam.updateMatrixWorld();
  const w = new Weather({ rain: 0, snow: 0, storm: 1, wind: 1 });
  w.update(5, cam, new THREE.Vector3());
  assert.equal(U.uBolt.value.w, 0, 'no flash, no bolt');
  w.strike(5); w.update(5, cam, new THREE.Vector3());
  assert.ok(U.uBolt.value.w > 0, 'a bolt during the flash');
  const camAz = Math.atan2(-20, 10);   // the camera faces (10, -20) on the ground from where it stands
  assert.ok(Math.abs(U.uBolt.value.x - camAz) <= 0.3 + 1e-9, 'in the sky the camera faces');
  let t = 5; for (let i = 0; i < 120; i++) { t += 1 / 60; w.update(t, cam, new THREE.Vector3()); }
  assert.equal(U.uBolt.value.w, 0, 'gone after the flash');
  // a flash cut short (the clock jumps back: a regenerated session) leaves no bolt behind
  w.strike(t); w.update(t, cam, new THREE.Vector3()); assert.ok(U.uBolt.value.w > 0);
  w.update(t - 2, cam, new THREE.Vector3());
  assert.equal(U.uBolt.value.w, 0, 'gone when the flash is cut short');
  // ten bolts under two headings: each in the sky its camera faces
  const cam2 = new THREE.PerspectiveCamera(); cam2.position.set(0, 3, 0); cam2.lookAt(-5, 3, 8); cam2.updateMatrixWorld();
  for (let i = 0; i < 10; i++) {
    const c = i % 2 ? cam2 : cam, az = i % 2 ? Math.atan2(8, -5) : camAz;
    t += 3; w.update(t, c, new THREE.Vector3()); w.strike(t); w.update(t, c, new THREE.Vector3());
    const d = Math.abs(((U.uBolt.value.x - az + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI);
    assert.ok(d <= 0.3 + 1e-9, `bolt ${i}: ${d.toFixed(3)} rad from the camera's heading`);
  }
  w.strike(t); w.update(t, cam, new THREE.Vector3());
  w.dispose();
  assert.equal(U.uBolt.value.w, 0, 'gone after dispose');
  assert.equal(snap(), before);
});

test('by day (Passe Y5): the cover veils the sun, greys the haze, the zenith and the ambient, lowers the saturation; a flash brightens the haze; wind alone leaves the cobbles dry; dispose gives it all back; at night none of it', () => {
  const before = snap(), zen0 = U.uSkyZenith.value.clone();
  const lookDay = () => {
    U.uMoonCol.value.copy(DAY.sunCol); U.uSkyAmb.value.copy(DAY.skyAmb); U.uGroundAmb.value.copy(DAY.groundAmb); U.uFillCol.value.copy(DAY.fillCol);
    U.uFogColor.value.copy(DAY.fogColor); U.uSkyZenith.value.copy(DAY.skyZenith); U.uWet.value = DAY.wet; U.uFogDensity.value = DAY.fogDensity; U.uMist.value = DAY.mist;
  };
  lookDay();
  const snapDay = () => snap() + JSON.stringify(U.uSkyZenith.value.toArray());
  const day = snapDay(), post = { saturation: 1.25 };
  const sat = (c) => (Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b)) / Math.max(c.r, c.g, c.b);
  const lum = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  const w = new Weather({ rain: 0.85, snow: 0, storm: 1, wind: 2 }, { day: true, post });
  assert.ok(U.uMoonCol.value.r <= 0.2 * DAY.sunCol.r && U.uMoonCol.value.b <= 0.2 * DAY.sunCol.b, 'a storm veils the sun (and so its shadow)');
  assert.ok(sat(U.uFogColor.value) < 0.5 * sat(DAY.fogColor), 'an overcast haze');
  assert.ok(sat(U.uSkyZenith.value) < 0.5 * sat(DAY.skyZenith), 'a grey zenith');
  assert.ok(sat(U.uSkyAmb.value) < sat(DAY.skyAmb) && lum(U.uSkyAmb.value) > lum(DAY.skyAmb), 'a greyer, stronger ambient');
  assert.ok(U.uFogDensity.value > 2 * DAY.fogDensity, 'a thicker haze');
  assert.ok(post.saturation < 1.25, 'a less saturated grade');
  assert.ok(U.uWet.value > 1, 'the rain wets the cobbles');
  const veiledFog = U.uFogColor.value.clone();
  const cam = new THREE.PerspectiveCamera();
  w.strike(10); w.update(10.05, cam, new THREE.Vector3());
  assert.ok(w.flashLevel > 0.3, 'a flash');
  assert.ok(lum(U.uFogColor.value) > lum(veiledFog), 'a flash brightens the day haze (the night lerp would darken it)');
  assert.ok(U.uMoonCol.value.r < DAY.sunCol.r, 'the flash stays under the unveiled sun');
  w.dispose();
  assert.equal(snapDay(), day, 'dispose gives every uniform back, a flash in progress included');
  assert.equal(post.saturation, 1.25, 'and the grade');
  // snow and rain veil less than a storm
  const r = new Weather({ rain: 1, snow: 0, storm: 0, wind: 1 }, { day: true, post }), rainSun = U.uMoonCol.value.r; r.dispose();
  assert.ok(rainSun > 0.2 * DAY.sunCol.r && rainSun < 0.7 * DAY.sunCol.r, 'rain: a sun half veiled');
  const s = new Weather({ rain: 0, snow: 1, storm: 0, wind: 1 }, { day: true, post });
  assert.ok(U.uWet.value < DAY.wet, 'snow takes the puddles'); s.dispose();
  // wind alone by day: nothing veiled, the day's dry cobbles kept
  const v = new Weather({ rain: 0, snow: 0, storm: 0, wind: 2 }, { day: true, post });
  assert.equal(U.uWet.value, DAY.wet, 'wind alone does not wet the day');
  assert.ok(U.uMoonCol.value.equals(DAY.sunCol)); assert.equal(post.saturation, 1.25);
  v.dispose();
  assert.equal(snapDay(), day);
  // at night (no day option) the light and the grade are not touched (Passes W1-W3); the night's wetness formula
  const n = new Weather({ rain: 0.85, snow: 0, storm: 1, wind: 2 }, { post });
  assert.ok(U.uMoonCol.value.equals(DAY.sunCol) && U.uFogColor.value.equals(DAY.fogColor) && U.uSkyZenith.value.equals(DAY.skyZenith), 'the night weather leaves the light');
  assert.equal(post.saturation, 1.25);
  assert.equal(U.uWet.value, Math.max(0, 1 + 0.3 * 0.85 - 0.9 * 0), 'the night formula');
  n.dispose();
  reset(before); U.uSkyZenith.value.copy(zen0);
});
