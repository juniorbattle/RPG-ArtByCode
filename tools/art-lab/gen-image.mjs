// Image generation through the OpenAI Images API (journal Passe I1; rule "Image generation" in AGENTS.md). The operator's approval, word
// for word (2026-10-19): « Oui : fais créer l'outil de génération d'images par la séance du héros, avec un plafond de 5 $ par tâche, la
// provenance enregistrée automatiquement et la règle dans AGENTS.md. »
// - Plain Node (fetch, FormData, Blob): no dependency.
// - The API key comes from OPENAI_API_KEY or, failing that, from `.env.local` at the repo root, which must be git-ignored (checked before
//   reading it). It is sent in the Authorization header and nowhere else: never printed, logged, or written to a record, the ledger or an
//   error message (every line this tool prints goes through `redact`).
// - Every image keeps the API's bytes unchanged (the decoded PNG), next to an automatic `<name>.source.json`: model, endpoint, parameters,
//   the exact prompt and its SHA-256, each reference's SHA-256 and size, the request id, dates, usage, estimated and actual cost. The PNG's
//   C2PA chunk (caBX) is located, never verified.
// - A git-ignored ledger (art-lab/characters/scratch/gen-image-ledger.json) keeps each task's spend. A request is reserved in it at its
//   worst-case estimate BEFORE it is sent and refused if that would take its task beyond the cap (5 USD; --cap may only lower it); the
//   answer replaces the reservation by the cost of its usage. An HTTP error is not billed (0); a request that got no answer keeps its
//   reservation.
// - The ledger is read and written only under its lock, `<ledger>.lock`, a file created exclusively (journal Passe I2, the operator's GA3-S3
//   « Une tâche à part »; in journal Passe GA3, requests run in parallel overwrote each other's entries). Each step reads the ledger as it is
//   on disk under that lock and writes it back before releasing it: the reservation, where the cap is checked against every reservation
//   already there, then the settlement. Never a copy taken before the request was sent. The lock is held for that read and that write only
//   (milliseconds), never across a request: a waiter gives up after LOCK_WAIT_MS (nothing sent), and a lock older than LOCK_STALE_MS was left
//   by a process that died holding it and is broken.
// - Two requests of one task in the same second keep both their images: a name already taken gets the request's ledger id.
// - Generated images are NON-CANONICAL until the operator approves them. `--archive` copies one, byte for byte, into the archived sources
//   (art-lab/characters/reference/sources/, checked by `npm run art:validate`) with its record.
//   node tools/art-lab/gen-image.mjs --task=<kebab-name> (--prompt="..." | --prompt-file=<f.txt>) [--ref=<image> ...] [--n=1]
//        [--size=1024x1024|1536x1024|1024x1536] [--quality=low|medium|high] [--model=gpt-image-1] [--background=opaque|transparent|auto]
//        [--fidelity=high|low] [--out=<dir>] [--cap=<usd>] [--dry-run]
//   node tools/art-lab/gen-image.mjs --list-models                      (the account's image models; costs nothing)
//   node tools/art-lab/gen-image.mjs --spent                            (the ledger, per task)
//   node tools/art-lab/gen-image.mjs --archive=<generated.png> --name=<new-base-name>
// - --root=<checkout>: the checkout of this repository whose git-ignored .env.local, ledger and scratch folder a generation (or --spent) uses, and against
//   which its relative paths resolve: a git worktree has no .env.local (journal Passe GA1). --archive always copies into the checkout this tool runs from.
//   MiniMax was added for one trial and removed on the operator's decision (GA-S2 « Le retirer de l’outil », journal Passe GA2).
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const API = 'https://api.openai.com/v1';
export const CAP_USD = 5;                                          // the operator's cap per task: raise it only on the operator's decision
export const LEDGER = 'art-lab/characters/scratch/gen-image-ledger.json';
export const OUT_DIR = 'art-lab/characters/scratch/generated';
export const ARCHIVE_DIR = 'art-lab/characters/reference/sources';
// USD per million tokens, standard Images API prices as OpenAI's pricing page gave them on 2026-10-19 (text input, text output where the
// model has one, image input, image output); the account's invoice is authoritative. `outTokens`: "table" = OpenAI's published output-token
// table below (the models before gpt-image-2); "ceiling" = no published table, the estimate takes CEILING x that table as its worst case and
// the answer's usage settles the ledger. `fidelity`: the model takes `input_fidelity` (gpt-image-2 processes every reference at high
// fidelity and must not be sent it). A model missing here is refused (no cost estimate, no cap).
export const MODELS = {
  'gpt-image-1': { textIn: 5, imageIn: 10, imageOut: 40, outTokens: 'table', fidelity: true },
  'gpt-image-1-mini': { textIn: 2, imageIn: 2.5, imageOut: 8, outTokens: 'table', fidelity: false },
  'gpt-image-1.5': { textIn: 5, textOut: 10, imageIn: 8, imageOut: 32, outTokens: 'table', fidelity: false },
  'gpt-image-2': { textIn: 5, imageIn: 8, imageOut: 30, outTokens: 'ceiling', fidelity: false },
};
export const PRICE_TABLE = 'gen-image.mjs model table of 2026-10-19 (OpenAI pricing page, standard tier, USD per 1M tokens)';
// Output tokens of one image per quality and size (OpenAI's published table for the models before gpt-image-2).
export const OUT_TOKENS = {
  low: { '1024x1024': 272, '1024x1536': 408, '1536x1024': 400 },
  medium: { '1024x1024': 1056, '1024x1536': 1584, '1536x1024': 1568 },
  high: { '1024x1024': 4160, '1024x1536': 6240, '1536x1024': 6208 },
};
export const CEILING = 3;                                          // worst case for a model without a published table: 3 x the table
export const REF_TOKENS_MAX = 8000;                                // worst case per reference image (high input fidelity) for the estimate
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const round6 = (x) => Math.round(x * 1e6) / 1e6;

/** every string this tool prints or stores goes through this: the key never leaves the Authorization header */
export const redact = (s, key) => (key ? String(s).split(key).join('[redacted]') : String(s));

/** KEY=VALUE lines of a dotenv file (comments, blank lines, `export ` and quotes handled); only the values, never echoed */
export function parseEnvFile(text) {
  const out = {};
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    else v = v.replace(/\s+#.*$/, '');
    out[m[1]] = v;
  }
  return out;
}

/** the key from the environment, else from `.env.local` (refused unless git ignores it); null when absent */
export function readKey({ root = ROOT, env = process.env, isIgnored = gitIgnores } = {}) {
  if (env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim()) return env.OPENAI_API_KEY.trim();
  const f = path.join(root, '.env.local');
  if (!fs.existsSync(f)) return null;
  if (!isIgnored(root, '.env.local')) throw new Error('.env.local is not git-ignored: refusing to read a key from a file that could be committed');
  const v = parseEnvFile(fs.readFileSync(f, 'utf8')).OPENAI_API_KEY;
  return v && v.trim() ? v.trim() : null;
}
function gitIgnores(root, rel) { return spawnSync('git', ['check-ignore', '-q', rel], { cwd: root }).status === 0; }

export function parseArgs(argv) {
  const o = { ref: [] };
  for (const a of argv) {
    const m = /^--([a-z-]+)(?:=(.*))?$/s.exec(a);
    if (!m) throw new Error(`unexpected argument: ${a}`);
    const k = m[1], v = m[2] ?? true;
    if (k === 'ref') o.ref.push(v); else o[k] = v;
  }
  return o;
}

/** the request this tool would send, checked; throws on anything it cannot price or would not send */
/** a path as a record keeps it: relative to the repository with '/' separators, or only the file's name when it lies outside the repository
 *  (a machine path is never written into a record, journal Passe D5) */
export function recordPath(p, root = ROOT) {
  const abs = path.resolve(root, p), rel = path.relative(root, abs);
  return rel && !rel.startsWith('..') && !path.isAbsolute(rel) ? rel.split(path.sep).join('/') : `(outside the repository) ${path.basename(abs)}`;
}

export function planRequest(o, { root = ROOT } = {}) {
  if (typeof o.task !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(o.task)) throw new Error('--task=<kebab-case name> is required (the ledger and the cap are per task)');
  const prompt = typeof o.prompt === 'string' ? o.prompt : typeof o['prompt-file'] === 'string' ? fs.readFileSync(path.resolve(root, o['prompt-file']), 'utf8') : null;
  if (!prompt || !prompt.trim()) throw new Error('--prompt="..." or --prompt-file=<file> is required');
  const model = o.model ?? 'gpt-image-1', price = MODELS[model];
  if (!price) throw new Error(`model "${model}" has no price in the tool's table: refused (known: ${Object.keys(MODELS).join(', ')})`);
  const n = Number(o.n ?? 1), size = o.size ?? '1024x1024', quality = o.quality ?? 'high', background = o.background ?? 'opaque';
  if (!Number.isInteger(n) || n < 1 || n > 4) throw new Error('--n must be 1 to 4');
  if (!OUT_TOKENS[quality]) throw new Error(`--quality must be one of ${Object.keys(OUT_TOKENS).join(', ')}`);
  if (!OUT_TOKENS[quality][size]) throw new Error(`--size must be one of ${Object.keys(OUT_TOKENS[quality]).join(', ')}`);
  if (!['opaque', 'transparent', 'auto'].includes(background)) throw new Error('--background must be opaque, transparent or auto');
  const refs = o.ref.map((r) => {
    const abs = path.resolve(root, r), bytes = fs.readFileSync(abs), ext = path.extname(abs).toLowerCase();
    const mime = { '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' }[ext];
    if (!mime) throw new Error(`reference ${r}: PNG, WebP or JPEG only`);
    return { file: recordPath(abs, root), abs, sha256: sha(bytes), bytes: bytes.length, mime, data: bytes };
  });
  if (o.fidelity !== undefined && !price.fidelity) throw new Error(`--fidelity: ${model} takes no input_fidelity`);
  const fidelity = refs.length && price.fidelity ? (o.fidelity ?? 'high') : null;
  if (fidelity && !['high', 'low'].includes(fidelity)) throw new Error('--fidelity must be high or low');
  const parameters = { n, size, quality, background, output_format: 'png', ...(fidelity ? { input_fidelity: fidelity } : {}) };
  const endpoint = refs.length ? `${API}/images/edits` : `${API}/images/generations`;
  return { task: o.task, model, prompt, promptSha256: sha(Buffer.from(prompt, 'utf8')), promptFile: typeof o['prompt-file'] === 'string' ? recordPath(o['prompt-file'], root) : null, refs, parameters, endpoint,
    price, estimateUsd: estimateCost({ model, prompt, n, size, quality, refs: refs.length }) };
}

/** worst-case cost of a request, USD: every output image at the table's tokens (x CEILING without a published table), the prompt at one
 *  token per 2 bytes, each reference at REF_TOKENS_MAX */
export function estimateCost({ model, prompt, n, size, quality, refs }) {
  const p = MODELS[model]; if (!p) throw new Error(`no price for model "${model}"`);
  const out = OUT_TOKENS[quality]?.[size]; if (!out) throw new Error(`no output tokens for ${quality} ${size}`);
  const text = Math.ceil(Buffer.byteLength(prompt, 'utf8') / 2), k = p.outTokens === 'table' ? 1 : CEILING;
  return round6((n * out * k * p.imageOut + text * p.textIn + refs * REF_TOKENS_MAX * p.imageIn) / 1e6);
}

/** cost of an answered request from its usage; null when the usage does not say enough. Output tokens are image tokens unless the usage
 *  splits them (a text part is priced at the model's text output price) */
export function usageCost(model, usage) {
  const p = MODELS[model];
  if (!p || !usage || typeof usage.output_tokens !== 'number') return null;
  const d = usage.input_tokens_details ?? {}, inTok = usage.input_tokens ?? 0;
  const imgIn = d.image_tokens ?? 0, txtIn = d.text_tokens ?? Math.max(0, inTok - imgIn);
  const od = usage.output_tokens_details ?? {}, txtOut = od.text_tokens ?? 0, imgOut = od.image_tokens ?? usage.output_tokens - txtOut;
  return round6((txtIn * p.textIn + imgIn * p.imageIn + imgOut * p.imageOut + txtOut * (p.textOut ?? p.imageOut)) / 1e6);
}

export function loadLedger(file) {
  if (!fs.existsSync(file)) return { version: 1, tasks: {} };
  const l = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (l?.version !== 1 || typeof l.tasks !== 'object') throw new Error(`${file}: not a ledger of this tool`);
  return l;
}
export function saveLedger(file, l) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(l, null, 2) + '\n'); }

// The ledger's lock (journal Passe I2). `fs.openSync(lock, 'wx')` creates the file only if it does not exist, atomically, across processes.
export const LOCK_WAIT_MS = 30000;                                 // a request waits this long for the ledger, then gives up before sending
export const LOCK_STALE_MS = 15000;                                // a lock this old outlived its process: the tool holds it for milliseconds
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BUSY = new Set(['EEXIST', 'EPERM', 'EACCES', 'EBUSY']);       // Windows answers EPERM while a released lock is still being deleted
function readLock(lock) {                                          // { text, mtimeMs } of the lock file, or null when it is gone or unreadable
  try { return { mtimeMs: fs.statSync(lock).mtimeMs, text: fs.readFileSync(lock, 'utf8') }; } catch { return null; }
}
/** a lock whose holder died: renamed aside (of two processes breaking it, one rename wins), deleted if it is still the lock judged stale,
 *  given back otherwise (a fresh lock taken between our reading and our renaming) */
function breakStale(lock, seen) {
  const aside = `${lock}.stale-${process.pid}-${crypto.randomUUID()}`;
  try { fs.renameSync(lock, aside); } catch { return; }
  let text = null; try { text = fs.readFileSync(aside, 'utf8'); } catch { /* judged below */ }
  if (text !== seen) { try { fs.linkSync(aside, lock); } catch { /* another process holds a new lock already */ } }
  fs.rmSync(aside, { force: true });
}
async function lockLedger(file, { waitMs = LOCK_WAIT_MS, staleMs = LOCK_STALE_MS } = {}) {
  const lock = `${file}.lock`, token = crypto.randomUUID(), t0 = Date.now();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  for (let attempt = 0, code; ; attempt++) {
    try {
      const fd = fs.openSync(lock, 'wx');
      try { fs.writeSync(fd, JSON.stringify({ token, pid: process.pid, since: new Date().toISOString() }) + '\n'); } finally { fs.closeSync(fd); }
      return { lock, token };
    } catch (e) { if (!BUSY.has(e?.code)) throw e; code = e.code; }
    const held = readLock(lock);
    if (held && Date.now() - held.mtimeMs > staleMs) { breakStale(lock, held.text); continue; }
    if (Date.now() - t0 > waitMs) throw new Error(`the ledger is locked by another request (${path.basename(lock)}, ${code}, waited ${Math.round((Date.now() - t0) / 1000)} s): nothing sent`);
    await sleep(Math.min(40, 2 + 2 * attempt) * (0.5 + Math.random()));
  }
}
function unlockLedger({ lock, token }) {                           // only our own lock: one broken as stale belongs to its new holder
  const held = readLock(lock);
  let mine = false; try { mine = JSON.parse(held?.text ?? 'null')?.token === token; } catch { /* not ours */ }
  if (mine) fs.rmSync(lock, { force: true, maxRetries: 20, retryDelay: 5 });
}
/** `fn` (synchronous) on the ledger as it is on disk, under its lock; the ledger is written back before the lock is released, unless `fn`
 *  throws or `write` is false. `pause` (tests only) is awaited between the read and the write: it widens the window in which a writer that
 *  skipped the lock would overwrite another. Returns { ledger, value } */
export async function withLedger(file, fn, { write = true, pause, ...lockOpts } = {}) {
  const held = await lockLedger(file, lockOpts);
  try {
    const ledger = loadLedger(file), value = fn(ledger);
    if (pause) await pause();
    if (write) saveLedger(file, ledger);
    return { ledger, value };
  } finally { unlockLedger(held); }
}
export const spent = (l, task) => round6((l.tasks[task]?.entries ?? []).reduce((s, e) => s + e.costUsd, 0));
export const capOf = (o) => Math.min(CAP_USD, o.cap !== undefined ? Number(o.cap) : CAP_USD);

/** PNG facts for the record: size, depth, colour type, chunk list, where the C2PA chunk (caBX) is */
export function pngInfo(buf) {
  const SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buf.length < 33 || !buf.subarray(0, 8).equals(SIG)) return null;
  const chunks = [], c2pa = [];
  let p = 8;
  while (p + 12 <= buf.length) {
    const len = buf.readUInt32BE(p), type = buf.toString('latin1', p + 4, p + 8);
    if (!chunks.includes(type)) chunks.push(type);
    if (type === 'caBX') c2pa.push({ offset: p, bytes: len + 12 });
    p += 12 + len;
    if (type === 'IEND') break;
  }
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), bitDepth: buf[24], colourType: buf[25], interlaced: buf[28] === 1, chunks, c2pa };
}

const stamp = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');

/** one request: reserve in the ledger, send, keep each image and its record, settle the ledger. Returns the written files. `lock`: the
 *  ledger lock's options (waitMs, staleMs; pause, for the tests) */
export async function generate(o, { root = ROOT, key, fetchFn = globalThis.fetch, now = () => new Date(), log = console.log, ledgerFile = path.join(root, LEDGER), toolFile = fileURLToPath(import.meta.url), lock = {} } = {}) {
  const say = (s) => log(redact(s, key));
  const plan = planRequest(o, { root }), cap = capOf(o);
  if (!(cap > 0)) throw new Error('--cap must be a positive number (at most the operator\'s cap)');
  say(`${plan.endpoint.replace(API, '')}  ${plan.model}  ${JSON.stringify(plan.parameters)}  prompt ${plan.prompt.length} chars sha256 ${plan.promptSha256.slice(0, 16)}…  refs ${plan.refs.length}`);
  const dryRun = Boolean(o['dry-run']);
  if (!dryRun && !key) throw new Error('no OPENAI_API_KEY (environment or git-ignored .env.local)');
  const requestedAt = now(), entry = { id: crypto.randomUUID(), date: requestedAt.toISOString(), model: plan.model, endpoint: plan.endpoint, parameters: plan.parameters,
    promptSha256: plan.promptSha256, refs: plan.refs.map((r) => r.sha256), estimateUsd: plan.estimateUsd, costUsd: plan.estimateUsd, status: 'pending', files: [] };
  // the reservation, under the ledger's lock: the cap against what the ledger holds now, other processes' reservations included
  await withLedger(ledgerFile, (l) => {
    const before = spent(l, plan.task);
    say(`task "${plan.task}": spent ${before.toFixed(4)} USD of ${cap} ; this request at most ${plan.estimateUsd.toFixed(4)} USD`);
    if (before + plan.estimateUsd > cap + 1e-9) throw new Error(`refused: task "${plan.task}" would reach ${(before + plan.estimateUsd).toFixed(4)} USD, beyond its cap of ${cap} USD`);
    if (!dryRun) (l.tasks[plan.task] ??= { entries: [] }).entries.push({ ...entry });   // reserved before sending: a crash keeps the worst case
  }, { ...lock, write: !dryRun });
  if (dryRun) { say('dry run: nothing sent, nothing written'); return []; }
  // the settlement, under the lock again: this entry, found by its id in the ledger as it is now, takes what the answer says
  const settle = (fields) => withLedger(ledgerFile, (l) => {
    Object.assign(entry, fields);
    const entries = (l.tasks[plan.task] ??= { entries: [] }).entries, mine = entries.find((e) => e.id === entry.id);
    if (mine) Object.assign(mine, fields);
    else entries.push({ ...entry, note: 'its reservation was no longer in the ledger at the settlement: added back' });
    return spent(l, plan.task);
  }, lock);

  let res;
  try {
    const headers = { Authorization: `Bearer ${key}` };
    let body;
    if (plan.refs.length) {
      body = new FormData();
      body.append('model', plan.model); body.append('prompt', plan.prompt);
      for (const [k, v] of Object.entries(plan.parameters)) body.append(k, String(v));
      for (const r of plan.refs) body.append('image[]', new Blob([r.data], { type: r.mime }), path.basename(r.file));
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify({ model: plan.model, prompt: plan.prompt, ...plan.parameters });
    }
    res = await fetchFn(plan.endpoint, { method: 'POST', headers, body });
  } catch (e) {
    await settle({ status: 'no answer (reservation kept)' });
    throw new Error(redact(`request failed before an answer: ${e?.message ?? e}`, key));
  }
  const requestId = res.headers?.get?.('x-request-id') ?? null, processingMs = Number(res.headers?.get?.('openai-processing-ms')) || null;
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch { /* reported below */ }
  if (!res.ok) {
    await settle({ status: `HTTP ${res.status}`, costUsd: 0, requestId });
    throw new Error(redact(`HTTP ${res.status}: ${json?.error?.message ?? text.slice(0, 300)}`, key));
  }
  const data = Array.isArray(json?.data) ? json.data : [];
  const actual = usageCost(plan.model, json?.usage), files = [];
  const answered = { status: 'answered', requestId, usage: json?.usage ?? null, costUsd: actual ?? plan.estimateUsd, files };
  const outDir = path.resolve(root, o.out ?? path.join(OUT_DIR, plan.task)), written = [];
  try {
    fs.mkdirSync(outDir, { recursive: true });
    const toolSha256 = sha(fs.readFileSync(toolFile));
    data.forEach((d, i) => {
      if (typeof d?.b64_json !== 'string') return;
      const bytes = Buffer.from(d.b64_json, 'base64'), info = pngInfo(bytes);
      if (!info) throw new Error('the API answered with something that is not a PNG');
      // a name another request of this task took in the same second is never overwritten: this request's ledger id goes into the name
      const stem = `${plan.task}-${stamp(requestedAt)}`, file = claimFile(outDir, [`${stem}-${i + 1}`, `${stem}-${entry.id.slice(0, 8)}-${i + 1}`], bytes);
      const base = path.basename(file, '.png');
      const record = {
        kind: 'generated-image',
        file: `${base}.png`, sha256: sha(bytes), bytes: bytes.length,
        format: `PNG ${info.width} x ${info.height}, bit depth ${info.bitDepth}, colour type ${info.colourType}${info.interlaced ? ', interlaced' : ''}; chunks ${info.chunks.join(', ')}`,
        status: 'NON-CANONICAL: generated, awaiting the operator\'s review (AGENTS.md, "Image generation")',
        generation: {
          tool: 'tools/art-lab/gen-image.mjs', toolSha256,
          endpoint: `POST ${plan.endpoint}`, model: plan.model, parameters: plan.parameters,
          prompt: plan.prompt, promptSha256: plan.promptSha256, ...(plan.promptFile ? { promptFile: plan.promptFile } : {}),
          references: plan.refs.map((r) => ({ file: r.file, sha256: r.sha256, bytes: r.bytes })),
          image: `${i + 1} of ${data.length}`, task: plan.task,
          requestedAt: requestedAt.toISOString(),
          response: { requestId, created: typeof json.created === 'number' ? new Date(json.created * 1000).toISOString() : null, processingMs,
            ...(typeof d.revised_prompt === 'string' ? { revisedPrompt: d.revised_prompt } : {}) },
          usage: json.usage ?? null,
          costUsd: { request: { estimate: plan.estimateUsd, fromUsage: actual }, prices: plan.price, priceTable: PRICE_TABLE,
            estimateBasis: plan.price.outTokens === 'table' ? 'the published output-token table of OpenAI' : `no published output-token table: ${CEILING} x the earlier models' table as the worst case`,
            note: 'computed by this tool from the response usage and its price table; the account\'s invoice is authoritative' },
        },
        c2pa: { presence: info.c2pa.length ? info.c2pa.map((c) => `caBX chunk at offset ${c.offset}, ${c.bytes} B`).join('; ') : 'no caBX chunk',
          verification: 'NOT VERIFIED: located only, no C2PA validator is installed' },
        rights: 'generated through the OpenAI API with the operator\'s account (its terms apply); third-party rights not verified; any canonical or production use needs the operator\'s decision',
        notInvented: 'Every field comes from the request this tool sent and the API\'s answer; nothing is inferred.',
      };
      fs.writeFileSync(path.join(outDir, `${base}.source.json`), redact(JSON.stringify(record, null, 2), key) + '\n');
      files.push(path.relative(root, file).split(path.sep).join('/'));
      written.push(file);
    });
  } catch (e) {                                                       // the request is paid even when its images cannot be kept
    await settle({ ...answered, status: `answered; images not kept: ${redact(e?.message ?? e, key)}` });
    throw e;
  }
  const { value: total } = await settle(answered);
  say(`answered: ${written.length} image(s), request ${requestId ?? '?'}, cost ${entry.costUsd.toFixed(4)} USD${actual === null ? ' (estimate: no usage in the answer)' : ''}; task now ${total.toFixed(4)} USD`);
  for (const f of written) say(`  ${path.relative(root, f)}`);
  return written;
}

/** writes `bytes` under the first of `stems` (+ .png) that does not exist yet, created exclusively; refuses when all are taken */
function claimFile(dir, stems, bytes) {
  for (const s of stems) {
    const f = path.join(dir, `${s}.png`);
    try { fs.writeFileSync(f, bytes, { flag: 'wx' }); return f; } catch (e) { if (e?.code !== 'EEXIST') throw e; }
  }
  throw new Error(`${stems.join('.png, ')}.png exist already: the image is not written over another`);
}

/** copy a generated image byte for byte into the archived sources, with its record (renamed, the copy noted) */
export function archive(o, { root = ROOT, now = () => new Date() } = {}) {
  const src = path.resolve(root, o.archive), name = o.name;
  if (typeof name !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) throw new Error('--name=<kebab-case base name> is required');
  const rec = JSON.parse(fs.readFileSync(src.replace(/\.png$/, '.source.json'), 'utf8')), bytes = fs.readFileSync(src);
  if (rec.kind !== 'generated-image' || rec.sha256 !== sha(bytes) || rec.bytes !== bytes.length) throw new Error('the image does not match its record: not archived');
  const dir = path.join(root, ARCHIVE_DIR), dst = path.join(dir, `${name}.png`);
  if (fs.existsSync(dst)) throw new Error(`${path.relative(root, dst)} exists: an archived source is never replaced`);
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(src, dst);
  if (sha(fs.readFileSync(dst)) !== rec.sha256) throw new Error('copy differs from the original');
  // a record written before journal Passe D5 may hold a path outside the repository: the archived copy keeps it by its name only
  const outside = (p) => typeof p === 'string' && (/^([A-Za-z]:)?[\\/]/.test(p) || p.split(/[\\/]/).includes('..'));
  const byName = (p) => `(outside the repository) ${p.split(/[\\/]/).pop()}`;
  const gen = rec.generation ? { ...rec.generation } : null, kept = [];
  if (gen && outside(gen.promptFile)) { gen.promptFile = byName(gen.promptFile); kept.push('generation.promptFile'); }
  if (gen && Array.isArray(gen.references)) gen.references = gen.references.map((r, i) => (outside(r.file) ? (kept.push(`generation.references[${i}].file`), { ...r, file: byName(r.file) }) : r));
  const out = { ...rec, ...(gen ? { generation: gen } : {}), file: `${name}.png`, archived: { date: now().toISOString().slice(0, 10), from: rec.file, rule: 'copied byte for byte by gen-image.mjs --archive; never edited, re-encoded or replaced', ...(kept.length ? { pathsKeptByName: kept } : {}) } };
  fs.writeFileSync(path.join(dir, `${name}.source.json`), JSON.stringify(out, null, 2) + '\n');
  return dst;
}

/** the checkout a generation uses: this one, or --root (another checkout of this repository, its own tool file there) */
export function rootOf(o) {
  if (o.root === undefined) return ROOT;
  const r = path.resolve(String(o.root));
  if (!fs.existsSync(path.join(r, 'tools', 'art-lab', 'gen-image.mjs'))) throw new Error('--root must be a checkout of this repository');
  return r;
}

async function main() {
  const o = parseArgs(process.argv.slice(2)), root = rootOf(o);
  if (o.spent) {
    const { ledger: l } = await withLedger(path.join(root, LEDGER), () => {}, { write: false });
    for (const [t, v] of Object.entries(l.tasks)) console.log(`${t.padEnd(32)} ${spent(l, t).toFixed(4)} USD of ${CAP_USD}  (${v.entries.length} request(s))`);
    return;
  }
  if (o.archive) { console.log(`archived: ${path.relative(ROOT, archive(o))}`); return; }
  const key = o['dry-run'] ? null : readKey({ root });
  if (o['list-models']) {
    if (!key) throw new Error('no OPENAI_API_KEY');
    const res = await fetch(`${API}/models`, { headers: { Authorization: `Bearer ${key}` } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ids = (await res.json()).data.map((m) => m.id).filter((id) => /image|dall/i.test(id)).sort();
    for (const id of ids) console.log(`${id}${MODELS[id] ? '' : '   (no price in the tool: refused)'}`);
    return;
  }
  await generate(o, { root, key });
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((e) => { console.error(String(e?.message ?? e)); process.exit(1); });
}
