// The gate of a baked sound (SA-8, SA-12, SA-13, SA-17; tools/audio/validate.mjs, journal Passe SN3): zero file is a valid state; a file without a
// manifest, a licence outside the list, a generated sound, changed bytes or the weight over 12 MB are refused. The repository holds the band's catalogue (journal
// Passe SN10), and the engine finds a loop's start in what a browser decoded (src/audio/align.ts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MAX_BYTES, validateAudio } from '../tools/audio/validate.mjs';
import { load } from './load.mjs';

const A = await load('/src/audio/align.ts');

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const put = (root, p, data) => { const f = path.join(root, p); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, data); };
function world(over = {}, data = Buffer.from('opus bytes')) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'audio-gate-'));
  put(root, 'src/audio/baked/theme.webm', data); put(root, 'art-lab/audio/scores/theme.mjs', '// a score');
  const m = { id: 'theme', kind: 'music', licence: 'own', score: 'art-lab/audio/scores/theme.mjs', generatedByAi: false, approved: true, approval: '« Validé »', runtimeUse: 'production',
    files: [{ path: 'src/audio/baked/theme.webm', bytes: data.length, sha256: crypto.createHash('sha256').update(data).digest('hex') }], ...over };
  put(root, 'art-lab/audio/manifests/theme.manifest.json', JSON.stringify(m));
  return root;
}
const has = (r, re) => assert.ok(r.errors.some((e) => re.test(e)), `${re} in ${JSON.stringify(r.errors)}`);

test('the repository: the band\'s catalogue baked (journal Passe SN10), every file under its manifest, our own, R-SUITE quoted word for word, each format under 12 MB', () => {
  const r = validateAudio(ROOT), C = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/audio/catalogue.json'), 'utf8')).pieces, dir = path.join(ROOT, 'art-lab/audio/manifests');
  assert.deepEqual(r.errors, []); assert.equal(r.manifests, 14);
  for (const x of ['.webm', '.m4a']) assert.ok(r.weight[x] > 8e6 && r.weight[x] <= MAX_BYTES, `${x}: ${r.weight[x]} bytes`);
  for (const f of fs.readdirSync(dir)) {
    const m = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')), p = C[m.id], names = [...p.files, ...(p.intro ? [p.intro.file] : [])];
    assert.equal(m.licence, 'own'); assert.equal(m.generatedByAi, false); assert.equal(m.score, `art-lab/audio/scores/${m.id}.score.mjs`);
    assert.ok(m.approval.includes('R-SUITE « Cuire et brancher dans la version 2 »') && m.decisions.includes('C-LIEUX « Valider ce plan » (journal Passe SN8)'), `${m.id}: the operator's words`);
    if (['midi', 'duel', 'rival', 'finale'].includes(m.id)) assert.ok(m.approval.includes('« Revenir à l’ancienne version »'), `${m.id}: the version SN7 wrote, kept by ear`);
    assert.deepEqual(m.files.map((x) => x.path).sort(), names.flatMap((n) => [`src/audio/baked/${n}.m4a`, `src/audio/baked/${n}.webm`]).sort(), `${m.id}: the catalogue's files, both formats`);
    for (const x of m.files) assert.equal(x.frames, x.role === 'intro' ? p.intro.frames : p.frames, `${x.path}: its length`);
  }
});

/** a circle of `n` samples (whole periods and a noise smoothed round the circle) laid in a decoded buffer after `lead` samples of a decoder's priming and
 *  followed by `pad` samples of padding, as a decoder that keeps them gives */
function decoded(n, lead, pad, seed = 7, echo = false) {
  let r = seed; const rnd = () => { r = (Math.imul(r, 1103515245) + 12345) & 0x7fffffff; return r / 0x3fffffff - 1; };
  const noise = Float32Array.from({ length: n }, rnd), x = new Float32Array(n);
  for (let i = 0; i < n; i++) { let s = 0; for (let k = -6; k <= 6; k++) s += noise[(i + k + n) % n]; x[i] = 0.3 * Math.sin(2 * Math.PI * 41 * i / n) + 0.2 * Math.sin(2 * Math.PI * 977 * i / n) + 0.04 * s; }
  const ch = [0, 1].map(() => { const d = new Float32Array(lead + n + pad); for (let i = 0; i < lead; i++) d[i] = echo ? x[n - lead + i] : 0.02 * rnd(); d.set(x, lead); return d; });
  return { length: lead + n + pad, sampleRate: 48000, numberOfChannels: 2, getChannelData: (c) => ch[c] };
}

test('a loop\'s start in what a decoder gave (journal Passe SN10): exact, or after the codec\'s delay it kept, found by its join', () => {
  const n = 48000 * 2;
  assert.deepEqual(A.alignLoop(decoded(n, 0, 0), n, 48000, 'webm'), { offset: 0, how: 'exact' });
  assert.deepEqual(A.alignLoop(decoded(n, 336, 143), n, 48000, 'webm'), { offset: 336, how: 'seam' }, 'Opus\'s pre-skip kept');
  assert.deepEqual(A.alignLoop(decoded(n, 1024, 700), n, 48000, 'm4a'), { offset: 1024, how: 'seam' }, 'the AAC\'s priming kept');
  assert.deepEqual(A.alignLoop(decoded(n, 2112, 300), n, 48000, 'm4a'), { offset: 2112, how: 'seam' }, 'Apple\'s convention');
  assert.equal(A.alignLoop(decoded(n, 0, 700), n, 48000, 'm4a').offset, 0, 'the priming dropped, the padding kept');
  for (const seed of [1, 2, 3, 4, 5]) assert.equal(A.alignLoop(decoded(n, 1024, 900, seed), n, 48000, 'm4a').offset, 1024, `draw ${seed}`);
  // a priming that runs on from the loop's end (the join cannot tell): a frame or more over the length says the delay was kept
  assert.equal(A.alignLoop(decoded(n, 1024, 700, 7, true), n, 48000, 'm4a').offset, 1024, 'the length decides'); assert.equal(A.alignLoop(decoded(n, 336, 700, 7, true), n, 48000, 'webm').offset, 336);
  // the join: closed on the circle, a step elsewhere
  const b = decoded(n, 1024, 700); assert.ok(A.seamScore(b, 1024, n) * 5 < A.seamScore(b, 0, n), `${A.seamScore(b, 1024, n).toFixed(2)} against ${A.seamScore(b, 0, n).toFixed(1)}`);
  // an intro or a jingle: at 0 when exact, else where the format's loops started, if the length allows
  assert.equal(A.startOf(decoded(n, 0, 0), n, 48000, 'm4a', 1024), 0); assert.equal(A.startOf(decoded(n, 1024, 700), n, 48000, 'm4a', 1024), 1024);
  assert.equal(A.startOf(decoded(n, 0, 700), n, 48000, 'm4a', 1024), 0, 'the delay would run past the end'); assert.equal(A.startOf(decoded(n, 1024, 700), n, 48000, 'm4a'), 0, 'nothing known');
});

test('a baked sound with its manifest passes, our own or under CC0', () => {
  assert.deepEqual(validateAudio(world()).errors, []);
  const cc0 = { licence: 'CC0-1.0', score: undefined, sources: [{ url: 'https://example.org/crowd', author: 'A. Recordist', licence: 'CC0-1.0' }] };
  assert.deepEqual(validateAudio(world(cc0)).errors, []);
});

test('what the gate refuses, each on its own', () => {
  has(validateAudio(world({ licence: 'CC-BY-NC-4.0' })), /SA-13/);
  has(validateAudio(world({ generatedByAi: true })), /SA-12/);
  has(validateAudio(world({ approved: false })), /approval/);
  has(validateAudio(world({ approval: '' })), /approval/);
  has(validateAudio(world({ score: 'art-lab/audio/scores/none.mjs' })), /score/);
  has(validateAudio(world({ licence: 'CC-BY-4.0', sources: [] })), /sources/);
  has(validateAudio(world({ files: [{ path: 'public/theme.webm', bytes: 1, sha256: 'x' }] })), /outside|missing/);
  const changed = world(); fs.writeFileSync(path.join(changed, 'src/audio/baked/theme.webm'), 'other bytes'); has(validateAudio(changed), /bytes|SHA-256/);
  const orphan = world(); put(orphan, 'public/crowd.ogg', 'x'); has(validateAudio(orphan), /public\/crowd\.ogg/);
  const lab = world({ runtimeUse: 'lab' }); has(validateAudio(lab), /without a production manifest/);
  has(validateAudio(world({}, Buffer.alloc(MAX_BYTES + 1))), /SA-17/);
});

test('the weight counts what one player fetches: one format, not both', () => {
  const data = Buffer.alloc(8 * 1024 * 1024), sha = crypto.createHash('sha256').update(data).digest('hex'), root = world({ files: [{ path: 'src/audio/baked/theme.webm', bytes: data.length, sha256: sha }, { path: 'src/audio/baked/theme.m4a', bytes: data.length, sha256: sha }] }, data);
  put(root, 'src/audio/baked/theme.m4a', data);
  assert.deepEqual(validateAudio(root).errors, []);
});
