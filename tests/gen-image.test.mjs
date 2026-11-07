// The image generation tool, offline (journal Passe I1): no network and no real key. A fake fetch stands in for the OpenAI API; the
// oracles are written out here (prices, token tables, sizes), not read back through the tool.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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

// MiniMax (journal Passe GA1, the operator's « Utilise MiniMax »): its API reference and price read on 2026-11-06, written out here as the oracle
const MKEY = 'mm-test-' + 'Wx7'.repeat(16);
function tinyJpeg() {                                                // markers only: SOI, an APP11 segment, SOF0 (height 2, width 3), EOI
  return Buffer.from('ffd8' + 'ffeb0006' + '6a756d62' + 'ffc0001108' + '0002' + '0003' + '03' + '011100021100031100' + 'ffd9', 'hex');
}
function fakeMinimax({ status = 200, code = 0, msg = 'success', images = [tinyJpeg(), tinyPng()], ok = String(images.length), failed = '0' } = {}) {
  const calls = [];
  const fetchFn = async (url, init) => {
    calls.push({ url, init });
    const body = { id: 'trace_mm_1', data: { image_base64: code === 0 ? images.map((b) => b.toString('base64')) : [] }, metadata: { success_count: ok, failed_count: failed }, base_resp: { status_code: code, status_msg: msg } };
    return { ok: status === 200, status, headers: new Map(), text: async () => JSON.stringify(body) };
  };
  return { fetchFn, calls };
}

test('MiniMax: its key by its own name; the request checked against its API reference; the estimate at 0.0035 USD an image', () => {
  const root = sandbox();
  fs.writeFileSync(path.join(root, '.env.local'), `OPENAI_API_KEY=${KEY}\nMINIMAX_API_KEY="${MKEY}"\n`);
  assert.equal(G.keyNameOf('image-01'), 'MINIMAX_API_KEY'); assert.equal(G.keyNameOf('gpt-image-2'), 'OPENAI_API_KEY');
  assert.equal(G.readKey({ root, env: {}, isIgnored: () => true, name: 'MINIMAX_API_KEY' }), MKEY);
  assert.equal(G.readKey({ root, env: {}, isIgnored: () => true }), KEY);
  assert.equal(G.readKey({ root, env: { MINIMAX_API_KEY: 'mm-env' }, isIgnored: () => true, name: 'MINIMAX_API_KEY' }), 'mm-env');
  fs.writeFileSync(path.join(root, 'face.jpg'), tinyJpeg()); fs.writeFileSync(path.join(root, 'sheet.webp'), 'RIFF');
  const p = G.planRequest({ task: 'mm', prompt: 'A knight.', ref: ['ref.png'], model: 'image-01', n: 4, size: '1536x1024', seed: '7' }, { root });
  assert.equal(p.endpoint, 'https://api.minimax.io/v1/image_generation');
  assert.deepEqual(p.parameters, { n: 4, width: 1536, height: 1024, response_format: 'base64', prompt_optimizer: false, seed: 7, subject_reference: 'character' });
  assert.equal(p.estimateUsd, 4 * 0.0035);
  assert.equal(G.planRequest({ task: 'mm', prompt: 'p', ref: [], model: 'image-01', region: 'china' }, { root }).endpoint, 'https://api.minimaxi.com/v1/image_generation');
  assert.deepEqual(G.planRequest({ task: 'mm', prompt: 'p', ref: [], model: 'image-01' }, { root }).parameters, { n: 1, width: 1024, height: 1024, response_format: 'base64', prompt_optimizer: false });
  const bad = (o, re) => assert.throws(() => G.planRequest({ task: 'mm', prompt: 'p', ref: [], model: 'image-01', ...o }, { root }), re);
  bad({ ref: ['ref.png', 'face.jpg'] }, /at most one reference/);
  bad({ ref: ['sheet.webp'] }, /PNG or JPEG only/);
  bad({ prompt: 'x'.repeat(1501) }, /at most 1500 characters/);
  bad({ size: '504x1024' }, /--size/); bad({ size: '2056x1024' }, /--size/); bad({ size: '1530x1024' }, /--size/); bad({ size: '1532x1024' }, /--size/);
  bad({ n: 10 }, /--n must be 1 to 9/); bad({ quality: 'high' }, /--quality: MiniMax takes none/); bad({ region: 'eu' }, /--region/); bad({ seed: '1.5' }, /--seed/);
  assert.ok(G.planRequest({ task: 'mm', prompt: 'x'.repeat(1500), ref: [], model: 'image-01', size: '2048x512', n: 9 }, { root }));
  assert.throws(() => G.planRequest({ task: 'mm', prompt: 'p', ref: [], model: 'image-01-live' }, { root }), /no price/);
});

test('MiniMax: the JSON request with its one reference as a data URL, the bytes of the answer kept (JPEG or PNG), the cost by the images counted, no key anywhere', async () => {
  const root = sandbox(), ledgerFile = path.join(root, 'ledger.json'), lines = [];
  const { fetchFn, calls } = fakeMinimax();
  const files = await G.generate({ task: 'mm-trial', prompt: 'A knight, four views.', ref: ['ref.png'], model: 'image-01', n: 2, size: '1536x1024' },
    { root, key: MKEY, fetchFn, now: () => new Date('2026-11-06T12:00:00Z'), log: (s) => lines.push(s), ledgerFile, toolFile: path.join(root, 'tool.mjs') });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.minimax.io/v1/image_generation');
  assert.equal(calls[0].init.headers.Authorization, `Bearer ${MKEY}`); assert.equal(calls[0].init.headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(calls[0].init.body), { model: 'image-01', prompt: 'A knight, four views.', n: 2, width: 1536, height: 1024, response_format: 'base64', prompt_optimizer: false,
    subject_reference: [{ type: 'character', image_file: `data:image/png;base64,${fs.readFileSync(path.join(root, 'ref.png')).toString('base64')}` }] });
  assert.deepEqual(files.map((f) => path.basename(f)), ['mm-trial-20261106T120000Z-1.jpg', 'mm-trial-20261106T120000Z-2.png']);
  assert.ok(fs.readFileSync(files[0]).equals(tinyJpeg())); assert.ok(fs.readFileSync(files[1]).equals(tinyPng()));
  const rec = JSON.parse(fs.readFileSync(files[0].replace(/\.jpg$/, '.source.json'), 'utf8'));
  assert.equal(rec.format, 'JPEG 3 x 2'); assert.equal(rec.sha256, sha(tinyJpeg())); assert.equal(rec.generation.provider, 'MiniMax');
  assert.equal(rec.generation.response.requestId, 'trace_mm_1'); assert.deepEqual(rec.generation.response.metadata, { success_count: 2, failed_count: 0 });
  assert.equal(rec.generation.costUsd.request.fromCount, 2 * 0.0035); assert.match(rec.c2pa.presence, /^APP11 segment at offset 2, 8 B$/);
  assert.equal(rec.generation.references[0].file, 'ref.png'); assert.match(rec.rights, /MiniMax API/);
  assert.equal(G.spent(G.loadLedger(ledgerFile), 'mm-trial'), 2 * 0.0035);
  // a blocked image is not paid: one image answered of two asked
  await G.generate({ task: 'mm-trial', prompt: 'p', ref: [], model: 'image-01', n: 2 }, { root, key: MKEY, fetchFn: fakeMinimax({ images: [tinyJpeg()], ok: '1', failed: '1' }).fetchFn, log: (s) => lines.push(s), ledgerFile, toolFile: path.join(root, 'tool.mjs') });
  assert.equal(G.spent(G.loadLedger(ledgerFile), 'mm-trial'), 3 * 0.0035);
  assert.ok(lines.some((l) => /1 blocked by its content safety/.test(l)));
  assert.ok(!allText(root).includes(MKEY), 'the key is in no written file'); assert.ok(!lines.join('\n').includes(MKEY), 'the key is in no printed line');
});

test('MiniMax: a status other than 0 (no balance, a refused prompt) or an HTTP error costs 0 and writes nothing; the cap holds; a .jpg archives byte for byte', async () => {
  const root = sandbox(), ledgerFile = path.join(root, 'ledger.json');
  const deps = { root, key: MKEY, log: () => {}, ledgerFile, toolFile: path.join(root, 'tool.mjs') };
  await assert.rejects(G.generate({ task: 'mf', prompt: 'p', ref: [], model: 'image-01' }, { ...deps, fetchFn: fakeMinimax({ code: 1008, msg: 'insufficient balance' }).fetchFn }), (e) => /MiniMax status 1008: insufficient balance/.test(e.message) && !e.message.includes(MKEY));
  await assert.rejects(G.generate({ task: 'mf', prompt: 'p', ref: [], model: 'image-01' }, { ...deps, fetchFn: fakeMinimax({ status: 500 }).fetchFn }), /HTTP 500/);
  const l = G.loadLedger(ledgerFile);
  assert.deepEqual(l.tasks.mf.entries.map((e) => [e.status, e.costUsd]), [['MiniMax 1008', 0], ['HTTP 500', 0]]);
  assert.ok(!fs.existsSync(path.join(root, G.OUT_DIR, 'mf')));
  await assert.rejects(G.generate({ task: 'mf', prompt: 'p', ref: [], model: 'image-01' }, { ...deps, key: null, fetchFn: fakeMinimax().fetchFn }), /no MINIMAX_API_KEY/);
  G.saveLedger(ledgerFile, { version: 1, tasks: { full: { entries: [{ costUsd: 4.99, status: 'answered' }] } } });
  const { fetchFn, calls } = fakeMinimax();
  await assert.rejects(G.generate({ task: 'full', prompt: 'p', ref: [], model: 'image-01', n: 3 }, { ...deps, fetchFn }), /refused/);   // 3 x 0.0035 > 0.01 left
  assert.equal(calls.length, 0);
  const [jpg] = await G.generate({ task: 'arch', prompt: 'p', ref: [], model: 'image-01', n: 1 }, { ...deps, fetchFn: fakeMinimax({ images: [tinyJpeg()] }).fetchFn });
  const dst = G.archive({ archive: path.relative(root, jpg), name: 'knight-clear-a' }, { root });
  assert.equal(path.basename(dst), 'knight-clear-a.jpg'); assert.ok(fs.readFileSync(dst).equals(tinyJpeg()));
  assert.equal(JSON.parse(fs.readFileSync(dst.replace(/\.jpg$/, '.source.json'), 'utf8')).file, 'knight-clear-a.jpg');
});
