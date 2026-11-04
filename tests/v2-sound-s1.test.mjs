// Lot S1 of the sound (journal Passes SN1 / SN3): the layers on one clock, the moves on the bar, the record kept between two pages, the duck's table, the
// baked sounds on demand; the engine's real behaviour is rendered by tools/audio/render.mjs (its `s1-` jobs) and proved over a real page change by
// tools/audio/page-proof.mjs. Here, the pure half and a recording context.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { load } from './load.mjs';

const S = await load('/src/audio/score.ts'), L = await load('/src/audio/layers.ts'), B = await load('/src/audio/baked.ts');
const src = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

/** a context that records what it is told */
function fakeCtx(now = 1) {
  const param = (value) => ({ value, events: [], setValueAtTime(v, t) { this.events.push(['set', v, t]); }, linearRampToValueAtTime(v, t) { this.events.push(['ramp', v, t]); }, setTargetAtTime(v, t, k) { this.events.push(['target', v, t, k]); }, cancelScheduledValues(t) { this.events.push(['cancel', t]); } });
  const sources = [], gains = [];
  return { currentTime: now, sources, gains,
    createBufferSource() { const s = { loop: false, connect() {}, start(...a) { s.started = a; }, stop(...a) { s.stopped = a; } }; sources.push(s); return s; },
    createGain() { const g = { gain: param(1), connect() {} }; gains.push(g); return g; } };
}
const stem = (seconds, sr = 48000) => ({ length: Math.round(seconds * sr), duration: seconds });

test('the layers: one clock, one offset, a sample-true loop; a level moves on the next bar; the loop\'s position; stems of one length only', () => {
  const c = fakeCtx(2), s = new L.LayerSet(c, [stem(9.6), stem(9.6), stem(9.6)], 1.2, {}, [1, 0, 0]);
  assert.equal(c.sources.length, 3);
  for (const x of c.sources) { assert.deepEqual(x.started, [2.1, 0]); assert.equal(x.loop, true); }
  assert.deepEqual(c.gains.map((g) => g.gain.value), [1, 0, 0]);
  assert.equal(s.start, 2.1); assert.ok(Math.abs(s.length - 9.6) < 1e-9);
  c.currentTime = 3.05;
  const at = s.level(1, 0.8);
  assert.ok(Math.abs(at - 3.3) < 1e-9, `the next bar: ${at}`);
  const ev = c.gains[1].gain.events; assert.deepEqual(ev[0], ['set', 0, at]); assert.equal(ev[1][1], 0.8); assert.ok(ev[1][2] > at);
  // the level it holds carries to the next move
  c.currentTime = 4; const at2 = s.level(1, 0.2); assert.equal(c.gains[1].gain.events[2][1], 0.8); assert.ok(at2 > 4);
  c.currentTime = 2.1 + 9.6 + 0.5; assert.ok(Math.abs(s.position() - 0.5) < 1e-9, 'it wraps');
  assert.throws(() => new L.LayerSet(fakeCtx(), [stem(9.6), stem(9)], 1.2, {}, [1, 1]), RangeError);
  assert.throws(() => new L.LayerSet(fakeCtx(), [], 1.2, {}, []), RangeError);
  // a piece taken up: every stem from the same offset, its position kept
  const d = fakeCtx(5), r = new L.LayerSet(d, [stem(9.6), stem(9.6)], 1.2, {}, [1, 1], 3.5);
  for (const x of d.sources) assert.deepEqual(x.started, [5.1, 3.5]);
  d.currentTime = 5.1; assert.ok(Math.abs(r.position() - 3.5) < 1e-9);
  r.stop(0.6); assert.ok(d.sources.every((x) => x.stopped[0] > 5.1 + 0.6));
  // the band's stems (journal Passe SN10): each looped on the span its decoder gave it, the loop started after an intro
  const e = fakeCtx(1), buf = (n, extra) => ({ length: n + extra, duration: (n + extra) / 48000, sampleRate: 48000 }), N = 48000 * 4;
  const q = new L.LayerSet(e, [buf(N, 0), buf(N, 1500)], 1, {}, [1, 0], 0, { at: 6, spans: [{ offset: 0, frames: N, rate: 48000 }, { offset: 1024, frames: N, rate: 48000 }] });
  assert.deepEqual(e.sources.map((x) => [x.loopStart, x.loopEnd, ...x.started]), [[0, 4, 6, 0], [1024 / 48000, 1024 / 48000 + 4, 6, 1024 / 48000]]);
  assert.equal(q.length, 4); e.currentTime = 5; assert.equal(q.position(), 0, 'nothing of the loop yet, the intro plays'); e.currentTime = 7.5; assert.ok(Math.abs(q.position() - 1.5) < 1e-9);
  assert.throws(() => new L.LayerSet(fakeCtx(), [buf(N, 0)], 1, {}, [1], 0, { spans: [{ offset: 1024, frames: N, rate: 48000 }] }), RangeError, 'a span past the buffer');
});

test('the grid: the next step after now, its margin, a start still to come', () => {
  assert.equal(S.nextBoundary(0.5, 0, 1), 1);
  assert.equal(S.nextBoundary(0.98, 0, 1, 0.03), 2, 'too close to the bar: the one after');
  assert.equal(S.nextBoundary(0.5, 3, 1), 3, 'before the start: the start');
  for (let t = 0; t < 30; t += 0.37) { const b = S.nextBoundary(t, 0.1, 1.2); assert.ok(b >= t + 0.03 - 1e-9 && b < t + 1.24); assert.ok(Math.abs(((b - 0.1) / 1.2) - Math.round((b - 0.1) / 1.2)) < 1e-9); }
});

test('the record between two pages: read back, checked, the same piece only, not after too long', () => {
  assert.equal(S.readNow(null), null); assert.equal(S.readNow('{oops'), null); assert.equal(S.readNow('{"key":3}'), null); assert.equal(S.readNow('{"key":"a","pos":-1,"at":1}'), null);
  const r = S.readNow('{"key":"band:nuit","pos":12.5,"heard":true,"at":1000}');
  assert.deepEqual(r, { key: 'band:nuit', pos: 12.5, heard: true, at: 1000 });
  assert.equal(S.readNow('{"key":"a","pos":1,"heard":"yes","at":1}').heard, false, 'only a true gesture');
  assert.equal(S.resumeAt(r, 'band:nuit', 30, 2000), 12.5);
  assert.equal(S.resumeAt(r, 'band:midi', 30, 2000), 0, 'another piece');
  assert.equal(S.resumeAt(r, 'band:nuit', 10, 2000), 2.5, 'inside its length');
  assert.equal(S.resumeAt(r, 'band:nuit', 30, 1000 + S.RESUME_MS + 1), 0, 'too long ago');
  assert.equal(S.resumeAt(null, 'x', 30, 0), 0);
});

test('the step back: the K.O. deepest and longest, each blow by its weight, the ambience by a share', () => {
  const d = S.DUCK;
  assert.ok(d.ko.db > d.break.db && d.break.db > d.heavy.db && d.heavy.db > d.hit.db && d.hit.db > d.guard.db);
  assert.ok(d.ko.hold > d.heavy.hold && d.ko.release > d.heavy.release);
  for (const v of Object.values(d)) assert.ok(v.attack < 0.05, 'in time with the blow');
  assert.ok(S.DUCK_AMBIENCE > 0 && S.DUCK_AMBIENCE < 1);
  for (const e of ['click', 'open', 'coin', 'step', 'tier']) assert.equal(d[e], undefined, `${e} leaves the music alone`);
});

test('the baked sounds: the band catalogue; the format a browser plays, Opus first; one fetch for a url; a file that fails is no error', async () => {
  const C = JSON.parse(src('src/audio/catalogue.json')).pieces, want = Object.values(C).flatMap((p) => [...p.files, ...(p.intro ? [p.intro.file] : [])]).sort();
  assert.deepEqual(B.bakedIds(), want, 'every file of the catalogue, nothing else');
  const files = ['./baked/theme.webm', './baked/theme.m4a', './baked/crowd.m4a'];
  assert.deepEqual(B.bakedIds(Object.fromEntries(files.map((f) => [f, 0]))), ['crowd', 'theme']);
  assert.equal(B.pickFile('theme', files, () => true), './baked/theme.webm');
  assert.equal(B.pickFile('theme', files, (m) => m.includes('mp4')), './baked/theme.m4a', 'a browser without Opus');
  assert.equal(B.pickFile('crowd', files, (m) => m.includes('webm')), null); assert.equal(B.pickFile('none', files, () => true), null);
  const real = globalThis.fetch, warn = console.warn; let calls = 0; console.warn = () => {};
  try {
    globalThis.fetch = async (u) => { calls++; if (u === 'bad') return { ok: false, status: 404 }; return { ok: true, arrayBuffer: async () => new ArrayBuffer(8) }; };
    const l = new B.AudioLoader({ decodeAudioData: async () => ({ duration: 1 }) });
    const [a, b] = await Promise.all([l.url('good'), l.url('good')]);
    assert.equal(a, b); assert.equal(calls, 1, 'one fetch'); assert.equal(await l.url('bad'), null);
    const broken = new B.AudioLoader({ decodeAudioData: async () => { throw new Error('undecodable'); } });
    assert.equal(await broken.url('good'), null);
  } finally { globalThis.fetch = real; console.warn = warn; }
});

test('the engine\'s rules: nothing without a gesture on this tab, the page\'s handle, today\'s game untouched', () => {
  const e = src('src/audio/Sound.ts'), p = src('src/ui/play.ts'), h = src('src/audio/hooks.ts');
  assert.match(e, /if \(this\.resume\?\.heard\) void this\.unlock\(\);/, 'only after a gesture on an earlier page');
  assert.match(e, /heard: this\.begun \|\| this\.resume\?\.heard === true/, 'heard means the sound ran');
  assert.match(e, /if \(this\.begun \|\| this\.ctx\?\.state !== 'running'\) return;/, 'a scene starts only on a running context');
  assert.match(e, /addEventListener\('pagehide'/); assert.match(e, /\.setValueAtTime|setTargetAtTime/);
  assert.match(h, /__soundLeave = \(\) => s\.leave\(\)/); assert.match(h, /querySelector\('\.pm-fade'\)/);
  // `go`: without the handle (today's game, the title) the page goes at once
  assert.match(p, /const wait: number = \(window as any\)\.__soundLeave\?\.\(\) \?\? 0;/);
  assert.match(p, /if \(wait > 0\) setTimeout\(\(\) => location\.assign\(playUrl\(params, extra\)\), wait\); else location\.assign\(playUrl\(params, extra\)\);/);
  assert.match(p, /if \(params\.has\('noreload'\)\) return;/);
  assert.doesNotMatch(src('src/ui/play.ts'), /audio\/Sound/, 'the page knows no engine');
});
