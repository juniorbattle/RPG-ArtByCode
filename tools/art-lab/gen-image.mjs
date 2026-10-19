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
// - Generated images are NON-CANONICAL until the operator approves them. `--archive` copies one, byte for byte, into the archived sources
//   (art-lab/characters/reference/sources/, checked by `npm run art:validate`) with its record.
//   node tools/art-lab/gen-image.mjs --task=<kebab-name> (--prompt="..." | --prompt-file=<f.txt>) [--ref=<image> ...] [--n=1]
//        [--size=1024x1024|1536x1024|1024x1536] [--quality=low|medium|high] [--model=gpt-image-1] [--background=opaque|transparent|auto]
//        [--fidelity=high|low] [--out=<dir>] [--cap=<usd>] [--dry-run]
//   node tools/art-lab/gen-image.mjs --list-models                      (the account's image models; costs nothing)
//   node tools/art-lab/gen-image.mjs --spent                            (the ledger, per task)
//   node tools/art-lab/gen-image.mjs --archive=<generated.png> --name=<new-base-name>
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
    return { file: path.relative(root, abs).split(path.sep).join('/'), abs, sha256: sha(bytes), bytes: bytes.length, mime, data: bytes };
  });
  if (o.fidelity !== undefined && !price.fidelity) throw new Error(`--fidelity: ${model} takes no input_fidelity`);
  const fidelity = refs.length && price.fidelity ? (o.fidelity ?? 'high') : null;
  if (fidelity && !['high', 'low'].includes(fidelity)) throw new Error('--fidelity must be high or low');
  const parameters = { n, size, quality, background, output_format: 'png', ...(fidelity ? { input_fidelity: fidelity } : {}) };
  const endpoint = refs.length ? `${API}/images/edits` : `${API}/images/generations`;
  return { task: o.task, model, prompt, promptSha256: sha(Buffer.from(prompt, 'utf8')), promptFile: o['prompt-file'] ?? null, refs, parameters, endpoint,
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

/** one request: reserve in the ledger, send, keep each image and its record, settle the ledger. Returns the written files. */
export async function generate(o, { root = ROOT, key, fetchFn = globalThis.fetch, now = () => new Date(), log = console.log, ledgerFile = path.join(root, LEDGER), toolFile = fileURLToPath(import.meta.url) } = {}) {
  const say = (s) => log(redact(s, key));
  const plan = planRequest(o, { root }), cap = capOf(o);
  if (!(cap > 0)) throw new Error('--cap must be a positive number (at most the operator\'s cap)');
  const ledger = loadLedger(ledgerFile), before = spent(ledger, plan.task);
  say(`${plan.endpoint.replace(API, '')}  ${plan.model}  ${JSON.stringify(plan.parameters)}  prompt ${plan.prompt.length} chars sha256 ${plan.promptSha256.slice(0, 16)}…  refs ${plan.refs.length}`);
  say(`task "${plan.task}": spent ${before.toFixed(4)} USD of ${cap} ; this request at most ${plan.estimateUsd.toFixed(4)} USD`);
  if (before + plan.estimateUsd > cap + 1e-9) throw new Error(`refused: task "${plan.task}" would reach ${(before + plan.estimateUsd).toFixed(4)} USD, beyond its cap of ${cap} USD`);
  if (o['dry-run']) { say('dry run: nothing sent, nothing written'); return []; }
  if (!key) throw new Error('no OPENAI_API_KEY (environment or git-ignored .env.local)');

  const requestedAt = now(), entry = { date: requestedAt.toISOString(), model: plan.model, endpoint: plan.endpoint, parameters: plan.parameters,
    promptSha256: plan.promptSha256, refs: plan.refs.map((r) => r.sha256), estimateUsd: plan.estimateUsd, costUsd: plan.estimateUsd, status: 'pending', files: [] };
  (ledger.tasks[plan.task] ??= { entries: [] }).entries.push(entry);
  saveLedger(ledgerFile, ledger);                                     // reserved before sending: a crash keeps the worst case

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
    entry.status = 'no answer (reservation kept)'; saveLedger(ledgerFile, ledger);
    throw new Error(redact(`request failed before an answer: ${e?.message ?? e}`, key));
  }
  const requestId = res.headers?.get?.('x-request-id') ?? null, processingMs = Number(res.headers?.get?.('openai-processing-ms')) || null;
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch { /* reported below */ }
  if (!res.ok) {
    entry.status = `HTTP ${res.status}`; entry.costUsd = 0; entry.requestId = requestId; saveLedger(ledgerFile, ledger);
    throw new Error(redact(`HTTP ${res.status}: ${json?.error?.message ?? text.slice(0, 300)}`, key));
  }
  const data = Array.isArray(json?.data) ? json.data : [];
  const actual = usageCost(plan.model, json?.usage);
  entry.status = 'answered'; entry.requestId = requestId; entry.usage = json?.usage ?? null; entry.costUsd = actual ?? plan.estimateUsd;
  const outDir = path.resolve(root, o.out ?? path.join(OUT_DIR, plan.task)); fs.mkdirSync(outDir, { recursive: true });
  const toolSha256 = sha(fs.readFileSync(toolFile)), written = [];
  data.forEach((d, i) => {
    if (typeof d?.b64_json !== 'string') return;
    const bytes = Buffer.from(d.b64_json, 'base64'), info = pngInfo(bytes);
    if (!info) throw new Error('the API answered with something that is not a PNG');
    const base = `${plan.task}-${stamp(requestedAt)}-${i + 1}`, file = path.join(outDir, `${base}.png`);
    fs.writeFileSync(file, bytes);
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
    entry.files.push(path.relative(root, file).split(path.sep).join('/'));
    written.push(file);
  });
  saveLedger(ledgerFile, ledger);
  say(`answered: ${written.length} image(s), request ${requestId ?? '?'}, cost ${entry.costUsd.toFixed(4)} USD${actual === null ? ' (estimate: no usage in the answer)' : ''}; task now ${spent(ledger, plan.task).toFixed(4)} USD`);
  for (const f of written) say(`  ${path.relative(root, f)}`);
  return written;
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
  const out = { ...rec, file: `${name}.png`, archived: { date: now().toISOString().slice(0, 10), from: rec.file, rule: 'copied byte for byte by gen-image.mjs --archive; never edited, re-encoded or replaced' } };
  fs.writeFileSync(path.join(dir, `${name}.source.json`), JSON.stringify(out, null, 2) + '\n');
  return dst;
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  if (o.spent) {
    const l = loadLedger(path.join(ROOT, LEDGER));
    for (const [t, v] of Object.entries(l.tasks)) console.log(`${t.padEnd(32)} ${spent(l, t).toFixed(4)} USD of ${CAP_USD}  (${v.entries.length} request(s))`);
    return;
  }
  if (o.archive) { console.log(`archived: ${path.relative(ROOT, archive(o))}`); return; }
  const key = o['dry-run'] ? null : readKey();
  if (o['list-models']) {
    if (!key) throw new Error('no OPENAI_API_KEY');
    const res = await fetch(`${API}/models`, { headers: { Authorization: `Bearer ${key}` } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ids = (await res.json()).data.map((m) => m.id).filter((id) => /image|dall/i.test(id)).sort();
    for (const id of ids) console.log(`${id}${MODELS[id] ? '' : '   (no price in the tool: refused)'}`);
    return;
  }
  await generate(o, { key });
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((e) => { console.error(String(e?.message ?? e)); process.exit(1); });
}
