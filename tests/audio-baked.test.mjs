// The gate of a baked sound (SA-8, SA-12, SA-13, SA-17; tools/audio/validate.mjs, journal Passe SN3): zero file is a valid state; a file without a
// manifest, a licence outside the list, a generated sound, changed bytes or the weight over 12 MB are refused. The repository itself holds none yet.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MAX_BYTES, validateAudio } from '../tools/audio/validate.mjs';

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

test('the repository: zero audio file, zero manifest, nothing to refuse', () => {
  assert.deepEqual(validateAudio(ROOT).errors, []);
  assert.equal(validateAudio(ROOT).manifests, 0);
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
