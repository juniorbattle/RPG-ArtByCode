// The image generation tool, offline (journal Passe I1): no network and no real key. A fake fetch stands in for the OpenAI API; the
// oracles are written out here (prices, token tables, sizes), not read back through the tool.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as G from '../tools/art-lab/gen-image.mjs';

const KEY = 'sk-test-' + 'Zq9'.repeat(16);                          // a fake key: it must never appear in a written file or a printed line
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
function tinyPng(extra = []) {                                       // a 2 x 1 RGBA PNG, built by hand (an optional caBX chunk after IHDR)
  const crc = (buf) => { let c = ~0; for (const b of buf) { c ^= b; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); } return ~c >>> 0; };
  const chunk = (type, data) => { const t = Buffer.from(type, 'latin1'), l = Buffer.alloc(4), c = Buffer.alloc(4); l.writeUInt32BE(data.length); c.writeUInt32BE(crc(Buffer.concat([t, data]))); return Buffer.concat([l, t, data, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(2, 0); ihdr.writeUInt32BE(1, 4); ihdr[8] = 8; ihdr[9] = 6;
  const idat = Buffer.from('789c63600002000005000183', 'hex');
  return Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), chunk('IHDR', ihdr), ...extra.map(([t, d]) => chunk(t, d)), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}
function sandbox() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-image-'));
  fs.writeFileSync(path.join(root, 'ref.png'), tinyPng());
  fs.writeFileSync(path.join(root, 'tool.mjs'), 'tool bytes');
  return root;
}
function fakeApi({ status = 200, images = [tinyPng([['caBX', Buffer.from('jumbf')]])], usage = { input_tokens: 120, output_tokens: 6208, input_tokens_details: { text_tokens: 120, image_tokens: 0 } } } = {}) {
  const calls = [];
  const fetchFn = async (url, init) => {
    calls.push({ url, init });
    const body = status === 200 ? { created: 1792400000, data: images.map((b) => ({ b64_json: b.toString('base64') })), usage }
      : { error: { message: 'Your request was rejected by the safety system.' } };
    return { ok: status === 200, status, headers: new Map([['x-request-id', 'req_abc123'], ['openai-processing-ms', '41000']]), text: async () => JSON.stringify(body) };
  };
  return { fetchFn, calls };
}
const allText = (dir) => fs.readdirSync(dir, { recursive: true }).map((f) => path.join(dir, f)).filter((f) => fs.statSync(f).isFile()).map((f) => fs.readFileSync(f).toString('latin1')).join('\n');

test('the key: environment first, then a git-ignored .env.local; refused from a file git would commit', () => {
  const root = sandbox();
  assert.equal(G.readKey({ root, env: {}, isIgnored: () => true }), null);
  fs.writeFileSync(path.join(root, '.env.local'), `# local\nMINIMAX_API_KEY=other\nexport OPENAI_API_KEY="${KEY}"\n`);
  assert.equal(G.readKey({ root, env: {}, isIgnored: () => true }), KEY);
  assert.equal(G.readKey({ root, env: { OPENAI_API_KEY: ' sk-env ' }, isIgnored: () => true }), 'sk-env');
  assert.throws(() => G.readKey({ root, env: {}, isIgnored: () => false }), (e) => /not git-ignored/.test(e.message) && !e.message.includes(KEY));
  assert.deepEqual(G.parseEnvFile("A=1\n  # c\nB='two words'\nC=3 # note\nbad line\n"), { A: '1', B: 'two words', C: '3' });
  assert.equal(G.redact(`Bearer ${KEY} and ${KEY}`, KEY), 'Bearer [redacted] and [redacted]');
});

test('cost: the worst-case estimate and the cost from usage, against the published prices', () => {
  // gpt-image-1: text 5, image in 10, image out 40 USD / 1M tokens; high 1536x1024 = 6208 output tokens; a 100-byte prompt = 50 tokens worst case
  const prompt = 'x'.repeat(100);
  assert.equal(G.estimateCost({ model: 'gpt-image-1', prompt, n: 2, size: '1536x1024', quality: 'high', refs: 0 }), (2 * 6208 * 40 + 50 * 5) / 1e6);
  assert.equal(G.estimateCost({ model: 'gpt-image-1', prompt, n: 1, size: '1024x1024', quality: 'low', refs: 2 }), (272 * 40 + 50 * 5 + 2 * 8000 * 10) / 1e6);
  assert.equal(G.estimateCost({ model: 'gpt-image-1-mini', prompt, n: 1, size: '1024x1536', quality: 'medium', refs: 0 }), (1584 * 8 + 50 * 2) / 1e6);
  assert.equal(G.usageCost('gpt-image-1', { input_tokens: 1300, output_tokens: 4160, input_tokens_details: { text_tokens: 300, image_tokens: 1000 } }), (300 * 5 + 1000 * 10 + 4160 * 40) / 1e6);
  assert.equal(G.usageCost('gpt-image-1', { input_tokens: 200, output_tokens: 272 }), (200 * 5 + 272 * 40) / 1e6);   // no details: all text
  assert.equal(G.usageCost('gpt-image-1', null), null);
  // gpt-image-1.5: image in 8, image out 32, text out 10; gpt-image-2: image out 30, no published token table: 3 x the table as worst case
  assert.equal(G.estimateCost({ model: 'gpt-image-1.5', prompt, n: 1, size: '1024x1024', quality: 'high', refs: 1 }), (4160 * 32 + 50 * 5 + 8000 * 8) / 1e6);
  assert.equal(G.estimateCost({ model: 'gpt-image-2', prompt, n: 2, size: '1536x1024', quality: 'high', refs: 1 }), (2 * 3 * 6208 * 30 + 50 * 5 + 8000 * 8) / 1e6);
  assert.equal(G.usageCost('gpt-image-1.5', { input_tokens: 100, output_tokens: 1100, output_tokens_details: { image_tokens: 1000, text_tokens: 100 } }), (100 * 5 + 1000 * 32 + 100 * 10) / 1e6);
  assert.equal(G.usageCost('gpt-image-2', { input_tokens: 2100, output_tokens: 9000, input_tokens_details: { text_tokens: 100, image_tokens: 2000 } }), (100 * 5 + 2000 * 8 + 9000 * 30) / 1e6);
  assert.throws(() => G.planRequest({ task: 't', prompt: 'p', ref: [], model: 'gpt-image-2', fidelity: 'high' }), /takes no input_fidelity/);
  assert.throws(() => G.planRequest({ task: 't', prompt: 'p', ref: [], model: 'gpt-image-9' }), /no price/);
  assert.throws(() => G.planRequest({ task: 't', prompt: 'p', ref: [], size: '512x512' }), /--size/);
  assert.throws(() => G.planRequest({ task: 'Bad Name', prompt: 'p', ref: [] }), /--task/);
  assert.throws(() => G.planRequest({ task: 't', prompt: 'p', ref: [], n: 5 }), /--n/);
  assert.equal(G.capOf({}), 5); assert.equal(G.capOf({ cap: '2' }), 2); assert.equal(G.capOf({ cap: '50' }), 5);   // --cap only lowers
});

test('a generation: original bytes, an automatic record, the ledger settled from usage, the key nowhere but the header', async () => {
  const root = sandbox(), ledgerFile = path.join(root, 'ledger.json'), lines = [];
  const { fetchFn, calls } = fakeApi();
  const files = await G.generate({ task: 'hero-trial', prompt: 'A hero, three-quarter back.', ref: [], size: '1536x1024', quality: 'high' },
    { root, key: KEY, fetchFn, now: () => new Date('2026-10-19T12:00:00Z'), log: (s) => lines.push(s), ledgerFile, toolFile: path.join(root, 'tool.mjs') });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.openai.com/v1/images/generations');
  assert.equal(calls[0].init.headers.Authorization, `Bearer ${KEY}`);
  assert.deepEqual(JSON.parse(calls[0].init.body), { model: 'gpt-image-1', prompt: 'A hero, three-quarter back.', n: 1, size: '1536x1024', quality: 'high', background: 'opaque', output_format: 'png' });
  assert.equal(files.length, 1);
  const png = fs.readFileSync(files[0]), expected = tinyPng([['caBX', Buffer.from('jumbf')]]);
  assert.ok(png.equals(expected), 'the API bytes are kept unchanged');
  assert.equal(path.basename(files[0]), 'hero-trial-20261019T120000Z-1.png');
  const rec = JSON.parse(fs.readFileSync(files[0].replace(/\.png$/, '.source.json'), 'utf8'));
  assert.equal(rec.kind, 'generated-image'); assert.equal(rec.file, path.basename(files[0]));
  assert.equal(rec.sha256, sha(expected)); assert.equal(rec.bytes, expected.length);
  assert.equal(rec.generation.prompt, 'A hero, three-quarter back.');
  assert.equal(rec.generation.promptSha256, sha(Buffer.from('A hero, three-quarter back.')));
  assert.equal(rec.generation.response.requestId, 'req_abc123');
  assert.equal(rec.generation.response.created, new Date(1792400000 * 1000).toISOString());
  assert.equal(rec.generation.toolSha256, sha(Buffer.from('tool bytes')));
  assert.equal(rec.generation.costUsd.request.fromUsage, (120 * 5 + 6208 * 40) / 1e6);
  assert.match(rec.format, /^PNG 2 x 1, bit depth 8, colour type 6; chunks IHDR, caBX, IDAT, IEND$/);
  assert.match(rec.c2pa.presence, /^caBX chunk at offset 33, 17 B$/); assert.match(rec.c2pa.verification, /NOT VERIFIED/);
  assert.match(rec.status, /NON-CANONICAL/);
  const l = G.loadLedger(ledgerFile);
  assert.equal(l.tasks['hero-trial'].entries.length, 1);
  assert.equal(l.tasks['hero-trial'].entries[0].status, 'answered');
  assert.equal(G.spent(l, 'hero-trial'), (120 * 5 + 6208 * 40) / 1e6);
  assert.ok(!allText(root).includes(KEY), 'the key is in no written file');
  assert.ok(!lines.join('\n').includes(KEY), 'the key is in no printed line');
});

test('references go to the edits endpoint as image[] with their SHA-256 in the record', async () => {
  const root = sandbox(), ledgerFile = path.join(root, 'ledger.json');
  const { fetchFn, calls } = fakeApi();
  const files = await G.generate({ task: 'edit', prompt: 'Same character.', ref: ['ref.png'], quality: 'low' },
    { root, key: KEY, fetchFn, log: () => {}, ledgerFile, toolFile: path.join(root, 'tool.mjs') });
  assert.equal(calls[0].url, 'https://api.openai.com/v1/images/edits');
  const fd = calls[0].init.body;
  assert.ok(fd instanceof FormData);
  assert.equal(fd.get('model'), 'gpt-image-1'); assert.equal(fd.get('input_fidelity'), 'high'); assert.equal(fd.get('quality'), 'low');
  const img = fd.getAll('image[]'); assert.equal(img.length, 1);
  assert.ok(Buffer.from(await img[0].arrayBuffer()).equals(fs.readFileSync(path.join(root, 'ref.png'))));
  const rec = JSON.parse(fs.readFileSync(files[0].replace(/\.png$/, '.source.json'), 'utf8'));
  assert.deepEqual(rec.generation.references, [{ file: 'ref.png', sha256: sha(fs.readFileSync(path.join(root, 'ref.png'))), bytes: fs.statSync(path.join(root, 'ref.png')).size }]);
  // gpt-image-2 processes references at high fidelity itself: input_fidelity must not be sent
  const two = fakeApi();
  await G.generate({ task: 'edit2', prompt: 'Same character.', ref: ['ref.png'], model: 'gpt-image-2' }, { root, key: KEY, fetchFn: two.fetchFn, log: () => {}, ledgerFile, toolFile: path.join(root, 'tool.mjs') });
  assert.equal(two.calls[0].init.body.get('input_fidelity'), null); assert.equal(two.calls[0].init.body.get('model'), 'gpt-image-2');
});

test('records keep no machine path: a prompt file or a reference outside the repository is kept by its name only', async () => {
  const root = sandbox(), ledgerFile = path.join(root, 'ledger.json'), outside = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-image-outside-'));
  fs.writeFileSync(path.join(outside, 'midday.txt'), 'Daytime, a high sun.');
  fs.writeFileSync(path.join(outside, 'night.png'), tinyPng());
  fs.mkdirSync(path.join(root, 'prompts')); fs.writeFileSync(path.join(root, 'prompts', 'p.txt'), 'Inside.');
  assert.equal(G.planRequest({ task: 't', 'prompt-file': 'prompts/p.txt', ref: [] }, { root }).promptFile, 'prompts/p.txt');
  const { fetchFn } = fakeApi();
  const files = await G.generate({ task: 'day', 'prompt-file': path.join(outside, 'midday.txt'), ref: [path.join(outside, 'night.png'), 'ref.png'], quality: 'low' },
    { root, key: KEY, fetchFn, log: () => {}, ledgerFile, toolFile: path.join(root, 'tool.mjs') });
  const text = fs.readFileSync(files[0].replace(/\.png$/, '.source.json'), 'utf8'), rec = JSON.parse(text);
  assert.equal(rec.generation.promptFile, '(outside the repository) midday.txt');
  assert.deepEqual(rec.generation.references.map((r) => r.file), ['(outside the repository) night.png', 'ref.png']);
  for (const p of [outside, outside.split(path.sep).join('/'), os.tmpdir(), os.homedir()]) assert.ok(!text.includes(p), `the record holds no machine path (${p})`);
});

test('the cap: a request that would pass 5 USD for its task is refused before anything is sent; a dry run sends and writes nothing', async () => {
  const root = sandbox(), ledgerFile = path.join(root, 'ledger.json');
  G.saveLedger(ledgerFile, { version: 1, tasks: { big: { entries: [{ costUsd: 4.8, status: 'answered' }] } } });
  const { fetchFn, calls } = fakeApi();
  const deps = { root, key: KEY, fetchFn, log: () => {}, ledgerFile, toolFile: path.join(root, 'tool.mjs') };
  // high 1536x1024: 6208 x 40 / 1e6 = 0.248 USD > 0.2 left
  await assert.rejects(G.generate({ task: 'big', prompt: 'p', ref: [], size: '1536x1024', quality: 'high' }, deps), /refused.*cap of 5 USD/);
  await assert.rejects(G.generate({ task: 'big', prompt: 'p', ref: [], size: '1536x1024', quality: 'high', cap: '50' }, deps), /refused/);
  assert.equal(calls.length, 0);
  await G.generate({ task: 'big', prompt: 'p', ref: [], size: '1024x1024', quality: 'low' }, deps);   // 272 x 40 / 1e6 = 0.011 USD fits
  assert.equal(calls.length, 1);
  const before = fs.readFileSync(ledgerFile, 'utf8');
  assert.deepEqual(await G.generate({ task: 'other', prompt: 'p', ref: [], 'dry-run': true }, { ...deps, key: null }), []);
  assert.equal(calls.length, 1); assert.equal(fs.readFileSync(ledgerFile, 'utf8'), before);
  assert.ok(!fs.existsSync(path.join(root, G.OUT_DIR, 'other')));
});

test('failures: an HTTP error costs 0 and writes no image; no answer keeps the reservation; neither message shows the key', async () => {
  const root = sandbox(), ledgerFile = path.join(root, 'ledger.json');
  const deps = { root, key: KEY, log: () => {}, ledgerFile, toolFile: path.join(root, 'tool.mjs') };
  await assert.rejects(G.generate({ task: 'f', prompt: 'p', ref: [] }, { ...deps, fetchFn: fakeApi({ status: 400 }).fetchFn }), (e) => /HTTP 400: Your request was rejected/.test(e.message) && !e.message.includes(KEY));
  let l = G.loadLedger(ledgerFile);
  assert.equal(l.tasks.f.entries[0].costUsd, 0); assert.equal(l.tasks.f.entries[0].status, 'HTTP 400');
  assert.ok(!fs.existsSync(path.join(root, G.OUT_DIR, 'f')));
  const boom = async () => { throw new Error(`socket hang up (Authorization: Bearer ${KEY})`); };
  await assert.rejects(G.generate({ task: 'f', prompt: 'p', ref: [] }, { ...deps, fetchFn: boom }), (e) => /before an answer/.test(e.message) && !e.message.includes(KEY));
  l = G.loadLedger(ledgerFile);
  assert.equal(l.tasks.f.entries[1].costUsd, G.estimateCost({ model: 'gpt-image-1', prompt: 'p', n: 1, size: '1024x1024', quality: 'high', refs: 0 }));
  assert.ok(!allText(root).includes(KEY));
  await assert.rejects(G.generate({ task: 'f', prompt: 'p', ref: [] }, { ...deps, key: null, fetchFn: fakeApi().fetchFn }), /no OPENAI_API_KEY/);
  // an answer whose image cannot be kept is paid all the same: settled at its usage, never left « pending » at the worst case (journal Passe I2)
  await assert.rejects(G.generate({ task: 'f', prompt: 'p', ref: [] }, { ...deps, fetchFn: fakeApi({ images: [Buffer.from('not a png')] }).fetchFn }), /not a PNG/);
  l = G.loadLedger(ledgerFile);
  assert.equal(l.tasks.f.entries.length, 3);
  assert.match(l.tasks.f.entries[2].status, /^answered; images not kept: the API answered with something that is not a PNG$/);
  assert.equal(l.tasks.f.entries[2].costUsd, (120 * 5 + 6208 * 40) / 1e6);
  assert.ok(!fs.existsSync(`${ledgerFile}.lock`));
});

test('--archive copies a generated image byte for byte into the archived sources, never over an existing one', async () => {
  const root = sandbox(), ledgerFile = path.join(root, 'ledger.json');
  const [file] = await G.generate({ task: 'arch', prompt: 'p', ref: [] }, { root, key: KEY, fetchFn: fakeApi().fetchFn, log: () => {}, ledgerFile, toolFile: path.join(root, 'tool.mjs') });
  const rel = path.relative(root, file);
  const dst = G.archive({ archive: rel, name: 'hero-trial-a' }, { root, now: () => new Date('2026-10-19T13:00:00Z') });
  assert.ok(fs.readFileSync(dst).equals(fs.readFileSync(file)));
  const rec = JSON.parse(fs.readFileSync(dst.replace(/\.png$/, '.source.json'), 'utf8'));
  assert.equal(rec.file, 'hero-trial-a.png'); assert.equal(rec.sha256, sha(fs.readFileSync(dst))); assert.equal(rec.archived.from, path.basename(file));
  assert.throws(() => G.archive({ archive: rel, name: 'hero-trial-a' }, { root }), /never replaced/);
  // a record written before journal Passe D5 (an absolute prompt path, an outside reference): the archived copy keeps them by name only
  const recFile = file.replace(/\.png$/, '.source.json'), old = JSON.parse(fs.readFileSync(recFile, 'utf8'));
  old.generation.promptFile = path.join(os.tmpdir(), 'scratch', 'midday.txt').split(path.sep).join('/');
  old.generation.references = [{ file: '../../outside/night.png', sha256: 'x', bytes: 1 }];
  fs.writeFileSync(recFile, JSON.stringify(old, null, 2));
  const dst2 = G.archive({ archive: rel, name: 'hero-trial-c' }, { root });
  const text2 = fs.readFileSync(dst2.replace(/\.png$/, '.source.json'), 'utf8'), rec2 = JSON.parse(text2);
  assert.equal(rec2.generation.promptFile, '(outside the repository) midday.txt');
  assert.equal(rec2.generation.references[0].file, '(outside the repository) night.png');
  assert.deepEqual(rec2.archived.pathsKeptByName, ['generation.promptFile', 'generation.references[0].file']);
  assert.ok(!text2.includes(os.tmpdir().split(path.sep).join('/')) && !text2.includes('outside/night'), 'no outside path left');
  fs.appendFileSync(file, 'x');
  assert.throws(() => G.archive({ archive: rel, name: 'hero-trial-b' }, { root }), /does not match its record/);
});

// The ledger's lock (journal Passe I2; in journal Passe GA3, requests run in parallel left paid entries « pending » at their worst case and
// lost others). Request k sends the prompt `p<k>`; its answer says which request it is (`req_<k>`, also inside the image's bytes) and costs
// its own usage: the oracle of entry k is written out here.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const costOf = (k) => (120 * 5 + (1000 + k) * 40) / 1e6;            // gpt-image-1: text in 5, image out 40 USD / 1M tokens
const answerOf = (id, k) => ({ ok: true, status: 200, headers: new Map([['x-request-id', id]]),
  text: async () => JSON.stringify({ created: 1792400000, data: [{ b64_json: tinyPng([['tEXt', Buffer.from(`req ${id}`)]]).toString('base64') }],
    usage: { input_tokens: 120, output_tokens: 1000 + k, input_tokens_details: { text_tokens: 120, image_tokens: 0 } } }) });
function timedApi(delays, gate) {                                    // request k answers after delays[k] ms (after `gate` when given)
  const calls = [];
  const fetchFn = async (url, init) => {
    const k = Number(/^p(\d+)$/.exec(JSON.parse(init.body).prompt)[1]);
    calls.push({ k, at: Date.now() }); await gate; await sleep(delays[k] ?? 0); return answerOf(`req_${k}`, k);
  };
  return { fetchFn, calls };
}
const LOW = (k) => ({ prompt: `p${k}`, ref: [], size: '1024x1024', quality: 'low' });    // at most 272 x 40 + 5 = 0.010885 USD
const HIGH = (k) => ({ prompt: `p${k}`, ref: [], size: '1024x1024', quality: 'high' });  // at most 4160 x 40 + 5 = 0.166405 USD
/** the ledger after concurrent requests: each request once, answered at its own cost, its image kept under a name of its own */
function checkSettled(root, ledgerFile, expected) {
  const l = G.loadLedger(ledgerFile), seen = new Set(), files = new Set();
  for (const [task, { ids, earlier = 0 }] of Object.entries(expected)) {
    const fresh = l.tasks[task].entries.filter((e) => e.id);
    assert.equal(fresh.length, ids.length, `task ${task}: one entry per request (${fresh.map((e) => e.requestId).join(', ')})`);
    assert.equal(l.tasks[task].entries.length - fresh.length, earlier, `task ${task}: the earlier entries kept`);
    for (const e of fresh) {
      assert.equal(e.status, 'answered', `task ${task}: no entry left « ${e.status} »`);
      const k = Number(/^req_p?(\d+)$/.exec(e.requestId)?.[1]);
      assert.ok(ids.includes(e.requestId) && !seen.has(e.requestId), `request ${e.requestId} counted once, in its task`); seen.add(e.requestId);
      assert.equal(e.costUsd, costOf(k), `request ${e.requestId} settled at its own cost`);
      assert.equal(e.files.length, 1);
      const png = path.join(root, e.files[0]), rec = JSON.parse(fs.readFileSync(png.replace(/\.png$/, '.source.json'), 'utf8'));
      assert.ok(!files.has(png), `${e.files[0]}: an image name of its own`); files.add(png);
      assert.ok(fs.readFileSync(png).includes(Buffer.from(`req ${e.requestId}`)), `${e.files[0]} holds the image of ${e.requestId}`);
      assert.equal(rec.file, path.basename(png)); assert.equal(rec.generation.response.requestId, e.requestId);
    }
  }
  assert.ok(!fs.existsSync(`${ledgerFile}.lock`), 'the lock is released');
  assert.deepEqual(fs.readdirSync(path.dirname(ledgerFile)).filter((f) => f.includes('.lock')), [], 'no lock left aside');
  return l;
}

test('the ledger under its lock: requests at once, on one task and on two, each counted once at its cost, none left pending', async () => {
  const root = sandbox(), ledgerFile = path.join(root, 'scratch', 'ledger.json');
  G.saveLedger(ledgerFile, { version: 1, tasks: { alpha: { entries: [{ costUsd: 1, status: 'answered', note: 'an earlier request' }] } } });
  const api = timedApi([60, 10, 45, 0, 30, 15]);                      // sent 0..5, answered 3, 1, 5, 4, 2, 0
  // one fixed instant: the four requests of alpha share their second, their images a name stem; `pause` holds each step of the ledger 5 ms
  const deps = { root, key: KEY, fetchFn: api.fetchFn, log: () => {}, ledgerFile, toolFile: path.join(root, 'tool.mjs'), now: () => new Date('2026-11-07T12:00:00Z'), lock: { pause: () => sleep(5) } };
  const tasks = ['alpha', 'beta', 'alpha', 'alpha', 'beta', 'alpha'];
  const out = await Promise.all(tasks.map((task, k) => G.generate({ task, ...LOW(k) }, deps)));
  assert.equal(api.calls.length, 6);
  assert.deepEqual(out.map((f) => f.length), [1, 1, 1, 1, 1, 1]);
  const l = checkSettled(root, ledgerFile, { alpha: { ids: ['req_0', 'req_2', 'req_3', 'req_5'], earlier: 1 }, beta: { ids: ['req_1', 'req_4'] } });
  assert.equal(G.spent(l, 'alpha'), Math.round((1 + costOf(0) + costOf(2) + costOf(3) + costOf(5)) * 1e6) / 1e6);
  assert.equal(G.spent(l, 'beta'), Math.round((costOf(1) + costOf(4)) * 1e6) / 1e6);
  // the image of the request that took the second's name first keeps today's name; the three others carry their request's ledger id
  const names = fs.readdirSync(path.join(root, G.OUT_DIR, 'alpha')).filter((f) => f.endsWith('.png')).sort();
  assert.equal(names.length, 4); assert.ok(names.includes('alpha-20261107T120000Z-1.png'));
  for (const n of names.filter((f) => f !== 'alpha-20261107T120000Z-1.png')) assert.match(n, /^alpha-20261107T120000Z-[0-9a-f]{8}-1\.png$/);
});

test('the cap under the lock: two reservations at once never pass it together', async () => {
  const root = sandbox(), ledgerFile = path.join(root, 'ledger.json');
  G.saveLedger(ledgerFile, { version: 1, tasks: { big: { entries: [{ costUsd: 4.75, status: 'answered' }] } } });
  // no answer comes back before both reservations of « big » are made: a request settled at its real cost (lower than its estimate) would
  // leave room for the second one, which is the cap working, not two reservations at once
  let open; const api = timedApi([], new Promise((r) => { open = r; }));
  const deps = { root, key: KEY, fetchFn: api.fetchFn, log: () => {}, ledgerFile, toolFile: path.join(root, 'tool.mjs'), lock: { pause: () => sleep(10) } };
  // 4.75 + 0.166405 = 4.916405 fits; a second one would reach 5.08281: refused, before anything is sent. Another task is not held up.
  const runs = [G.generate({ task: 'big', ...HIGH(0) }, deps), G.generate({ task: 'big', ...HIGH(1) }, deps), G.generate({ task: 'small', ...HIGH(2) }, deps)];
  let rejected = 0; runs.forEach((p) => p.catch(() => { rejected++; }));
  for (let t = Date.now(); api.calls.length + rejected < 3; ) { assert.ok(Date.now() - t < 10000, 'the three requests are reserved or refused'); await sleep(2); }
  open();
  const out = await Promise.allSettled(runs);
  const refused = out.filter((r) => r.status === 'rejected');
  assert.equal(refused.length, 1, `one request of « big » refused (${out.map((r) => r.status).join(', ')})`);
  assert.match(refused[0].reason.message, /refused: task "big" would reach 5\.0828\d* USD, beyond its cap of 5 USD/);
  assert.notEqual(out[2].status, 'rejected', 'the other task goes on');
  assert.equal(api.calls.length, 2, 'the refused request sent nothing');
  const l = G.loadLedger(ledgerFile);
  assert.equal(l.tasks.big.entries.length, 2); assert.equal(l.tasks.small.entries.length, 1);
  assert.ok(G.spent(l, 'big') <= 5);
  assert.ok(l.tasks.big.entries.concat(l.tasks.small.entries).every((e) => e.status === 'answered'));
});

test('the lock holds across processes: four processes started at one instant each count once', async () => {
  const root = sandbox(), ledgerFile = path.join(root, 'scratch', 'ledger.json'), go = path.join(root, 'go');
  const tool = pathToFileURL(fileURLToPath(new URL('../tools/art-lab/gen-image.mjs', import.meta.url))).href;
  // each process: says it is ready, waits for the go file (they all start within a few ms), then one request whose answer takes 20 ms;
  // `pause` holds each step of the ledger 15 ms, so that four writers without the lock would overlap
  fs.writeFileSync(path.join(root, 'runner.mjs'), `import fs from 'node:fs';
import * as G from ${JSON.stringify(tool)};
const [root, ledgerFile, task, k, go, png64] = process.argv.slice(2), sleep = (ms) => new Promise((r) => setTimeout(r, ms)), id = 'req_p' + k;
fs.writeFileSync(go + '.ready-' + k, '');
while (!fs.existsSync(go)) await sleep(1);
const fetchFn = async () => { await sleep(20); return { ok: true, status: 200, headers: new Map([['x-request-id', id]]), text: async () => JSON.stringify({ created: 1792400000,
  data: [{ b64_json: png64 }], usage: { input_tokens: 120, output_tokens: 1000 + Number(k), input_tokens_details: { text_tokens: 120, image_tokens: 0 } } }) }; };
await G.generate({ task, prompt: 'p', ref: [], size: '1024x1024', quality: 'low' }, { root, key: process.env.GEN_TEST_KEY, fetchFn, log: () => {}, ledgerFile,
  toolFile: root + '/tool.mjs', lock: { pause: () => sleep(15) } });
`);
  const tasks = ['alpha', 'beta', 'alpha', 'beta'];
  const runs = tasks.map((task, k) => new Promise((resolve) => {
    const p = spawn(process.execPath, [path.join(root, 'runner.mjs'), root, ledgerFile, task, String(k), go, tinyPng([['tEXt', Buffer.from(`req req_p${k}`)]]).toString('base64')], { env: { ...process.env, GEN_TEST_KEY: KEY }, stdio: ['ignore', 'ignore', 'pipe'] });
    let err = ''; p.stderr.on('data', (d) => { err += d; });
    p.on('exit', (code) => resolve({ code, err }));
  }));
  for (let t = Date.now(); tasks.some((_, k) => !fs.existsSync(`${go}.ready-${k}`)); ) { assert.ok(Date.now() - t < 20000, 'the four processes start'); await sleep(5); }
  fs.writeFileSync(go, '');
  for (const r of await Promise.all(runs)) assert.equal(r.code, 0, r.err);
  checkSettled(root, ledgerFile, { alpha: { ids: ['req_p0', 'req_p2'] }, beta: { ids: ['req_p1', 'req_p3'] } });
});

test('a lock left by a dead process is broken; a live one makes a request wait, and give up before sending', async () => {
  const root = sandbox(), ledgerFile = path.join(root, 'ledger.json'), lockFile = `${ledgerFile}.lock`;
  const api = timedApi([]);
  const deps = { root, key: KEY, fetchFn: api.fetchFn, log: () => {}, ledgerFile, toolFile: path.join(root, 'tool.mjs') };
  // a lock an hour old: its process died holding it
  fs.writeFileSync(lockFile, JSON.stringify({ token: 'dead', pid: 1 }) + '\n'); const old = new Date(Date.now() - 3600e3); fs.utimesSync(lockFile, old, old);
  await G.generate({ task: 'a', ...LOW(0) }, { ...deps, lock: { waitMs: 3000 } });
  assert.equal(api.calls.length, 1); assert.ok(!fs.existsSync(lockFile));
  // a live lock: the request waits, then gives up without sending or writing; the lock is left to its holder
  fs.writeFileSync(lockFile, JSON.stringify({ token: 'alive', pid: 1 }) + '\n');
  const before = fs.readFileSync(ledgerFile, 'utf8');
  await assert.rejects(G.generate({ task: 'a', ...LOW(9) }, { ...deps, lock: { waitMs: 150 } }), /the ledger is locked by another request .*: nothing sent/);
  assert.equal(api.calls.length, 1); assert.equal(fs.readFileSync(ledgerFile, 'utf8'), before);
  assert.equal(JSON.parse(fs.readFileSync(lockFile, 'utf8')).token, 'alive');
  // released while a request waits: it goes on, and sends only after the release
  const waiting = G.generate({ task: 'a', ...LOW(1) }, { ...deps, lock: { waitMs: 5000 } });
  await sleep(80); const releasedAt = Date.now(); fs.rmSync(lockFile);
  await waiting;
  assert.equal(api.calls.length, 2); assert.ok(api.calls[1].at >= releasedAt, 'sent after the lock was released');
  const l = G.loadLedger(ledgerFile);
  assert.deepEqual(l.tasks.a.entries.map((e) => [e.requestId, e.status, e.costUsd]), [['req_0', 'answered', costOf(0)], ['req_1', 'answered', costOf(1)]]);
  assert.deepEqual(fs.readdirSync(root).filter((f) => f.includes('.lock')), []);
});

test('--root: another checkout of this repository (its key, ledger and scratch folder), refused when it is not one', () => {
  assert.equal(G.rootOf({}), G.ROOT);
  assert.equal(G.rootOf({ root: G.ROOT }), path.resolve(G.ROOT));
  const notRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-image-notrepo-'));
  assert.throws(() => G.rootOf({ root: notRepo }), /--root must be a checkout of this repository/);
  const fake = sandbox(); fs.mkdirSync(path.join(fake, 'tools', 'art-lab'), { recursive: true }); fs.writeFileSync(path.join(fake, 'tools', 'art-lab', 'gen-image.mjs'), '');
  assert.equal(G.rootOf({ root: fake }), path.resolve(fake));
  fs.writeFileSync(path.join(fake, '.env.local'), `OPENAI_API_KEY=${KEY}\n`);
  assert.equal(G.readKey({ root: G.rootOf({ root: fake }), env: {}, isIgnored: () => true }), KEY);
});
