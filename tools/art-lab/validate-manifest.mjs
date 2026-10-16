// Provenance manifest validator for the Art Lab (no dependencies, never modifies anything).
//   node tools/art-lab/validate-manifest.mjs [--strict] [--json] [manifest.json ...]
// Default: every art-lab/characters/manifests/*.manifest.json, plus the documented example, plus an orphan scan
// (sources / exports that no manifest claims), plus the archived reference sheets of art-lab/characters/reference/sources/
// (each file must still match the SHA-256 and size of its <name>.source.json record). Exit 1 on errors (or on warnings with --strict).
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const MANIFEST_DIR = 'art-lab/characters/manifests';
export const EXAMPLE = 'art-lab/characters/manifest.example.json';
const SOURCE_DIR = 'art-lab/characters/source';
const EXPORT_DIR = 'art-lab/characters/exports';
const ARCHIVE_DIR = 'art-lab/characters/reference/sources';

export const STATUSES = ['planned', 'experimental', 'candidate', 'approved', 'rejected', 'superseded'];
const PIPELINES = ['aseprite-ai-artist', 'aseprite-manual', 'procedural', 'external', 'unknown'];
const RUNTIME_USES = ['none', 'lab', 'production'];
const REF_CATEGORIES = ['A', 'B', 'C', 'D'];
const TOP_KEYS = ['schemaVersion', 'id', 'kind', 'status', 'source', 'exports', 'generator', 'references', 'approved', 'approval', 'runtimeUse', 'notes'];

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string' && v.trim() !== '';
const posix = (p) => p.split(path.sep).join('/');

/** @returns {{errors: string[], warnings: string[]}} */
export function validateManifest(m, { file = '', root = ROOT, example = false } = {}) {
  const errors = [], warnings = [];
  const err = (s) => errors.push(s), warn = (s) => warnings.push(s);
  if (!isObj(m)) return { errors: ['manifest must be a JSON object'], warnings };

  const unknown = (o, allowed, where) => { for (const k of Object.keys(o)) if (!allowed.includes(k)) err(`${where}: unknown key "${k}"`); };
  unknown(m, TOP_KEYS, 'manifest');
  for (const k of TOP_KEYS.filter((k) => k !== 'approval' && k !== 'notes')) if (!(k in m)) err(`missing required key "${k}"`);

  if (m.schemaVersion !== 1) err('schemaVersion must be 1');
  if (typeof m.id !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(m.id)) err('id must be lowercase kebab-case (a-z, 0-9, "-")');
  else if (file && !example && path.basename(file) !== `${m.id}.manifest.json`) err(`file name must be "${m.id}.manifest.json"`);
  if (m.kind !== 'character') err('kind must be "character" (other kinds need an explicit, operator-approved task)');
  if (!STATUSES.includes(m.status)) err(`status must be one of: ${STATUSES.join(', ')}`);
  if (typeof m.approved !== 'boolean') err('approved must be true or false');
  if (!RUNTIME_USES.includes(m.runtimeUse)) err(`runtimeUse must be one of: ${RUNTIME_USES.join(', ')}`);
  if ('notes' in m && typeof m.notes !== 'string') err('notes must be a string');

  // repo-relative path rules; returns the path when it is usable
  const checkPath = (p, where, dir, exts) => {
    if (p === null) return null;
    if (typeof p !== 'string' || p === '') { err(`${where} must be a repo-relative path string or null`); return null; }
    if (p.includes('\\') || path.isAbsolute(p) || p.split('/').includes('..')) { err(`${where}: use a repo-relative forward-slash path without ".." ("${p}")`); return null; }
    if (!p.startsWith(`${dir}/`)) { err(`${where}: must live under ${dir}/ ("${p}")`); return null; }
    if (!exts.includes(path.extname(p).toLowerCase())) { err(`${where}: extension must be ${exts.join(' or ')} ("${p}")`); return null; }
    return p;
  };
  const source = 'source' in m ? checkPath(m.source, 'source', SOURCE_DIR, ['.aseprite', '.ase']) : null;
  let sheet = null, meta = null;
  if (!isObj(m.exports)) { if ('exports' in m) err('exports must be an object {sheet, metadata}'); }
  else {
    unknown(m.exports, ['sheet', 'metadata'], 'exports');
    sheet = checkPath(m.exports.sheet ?? null, 'exports.sheet', EXPORT_DIR, ['.png']);
    meta = checkPath(m.exports.metadata ?? null, 'exports.metadata', EXPORT_DIR, ['.json']);
  }

  const g = m.generator;
  if (!isObj(g)) { if ('generator' in m) err('generator must be an object {pipeline, version, model}'); }
  else {
    unknown(g, ['pipeline', 'version', 'model'], 'generator');
    if (!PIPELINES.includes(g.pipeline)) err(`generator.pipeline must be one of: ${PIPELINES.join(', ')}`);
    for (const k of ['version', 'model']) if (g[k] !== null && !isStr(g[k])) err(`generator.${k} must be a non-empty string or null`);
  }

  if (!Array.isArray(m.references)) { if ('references' in m) err('references must be an array'); }
  else m.references.forEach((r, i) => {
    const w = `references[${i}]`;
    if (!isObj(r)) return err(`${w} must be an object {category, label, path?, note?}`);
    unknown(r, ['category', 'label', 'path', 'note'], w);
    if (!REF_CATEGORIES.includes(r.category)) err(`${w}.category must be one of: ${REF_CATEGORIES.join(', ')}`);
    if (!isStr(r.label)) err(`${w}.label must be a non-empty string`);
    if (r.path != null) {
      if (typeof r.path !== 'string' || r.path.includes('\\') || path.isAbsolute(r.path) || r.path.split('/').includes('..')) err(`${w}.path must be a repo-relative forward-slash path or null`);
      else if (m.status !== 'planned' && !fs.existsSync(path.join(root, r.path))) err(`${w}.path does not exist: ${r.path}`);
    }
  });

  // approval contract: "approved" always means a named operator, a date, and status "approved"
  const ap = m.approval;
  if (m.approved === true) {
    if (m.status !== 'approved') err('approved: true requires status "approved"');
    if (!isObj(ap) || !isStr(ap.by) || !/^\d{4}-\d{2}-\d{2}$/.test(ap.date ?? '')) err('approved: true requires approval {by, date: YYYY-MM-DD}');
    else unknown(ap, ['by', 'date', 'note'], 'approval');
  } else if (m.approved === false) {
    if (m.status === 'approved') err('status "approved" requires approved: true');
    if (ap != null) err('approval must be absent or null while approved is false');
  }
  if (m.runtimeUse === 'production' && m.approved !== true) err('runtimeUse "production" requires approved: true (no generated output becomes canonical silently)');
  if (m.status === 'planned') {
    if (m.approved === true) err('a planned asset cannot be approved');
    if (m.runtimeUse !== 'none') err('a planned asset must have runtimeUse "none"');
  }
  if (isObj(g) && m.status === 'approved' && g.pipeline === 'unknown') err('an approved asset must have a known generator.pipeline');

  // files must exist once the asset is real (experimental and beyond)
  if (['experimental', 'candidate', 'approved'].includes(m.status) || m.runtimeUse !== 'none') {
    for (const [what, p] of [['source', source], ['exports.sheet', sheet], ['exports.metadata', meta]]) {
      if (p === null) err(`${what} is required once status is "${m.status}"`);
      else if (!fs.existsSync(path.join(root, p))) err(`${what} file does not exist: ${p}`);
    }
    if (isObj(g) && g.version == null) warn('generator.version is null: record the tool version that produced this asset');
  }
  return { errors, warnings };
}

/** Validate every manifest + the example, then scan for sources / exports that no manifest claims. */
export function validateAll({ root = ROOT } = {}) {
  const dir = path.join(root, MANIFEST_DIR);
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f) => `${MANIFEST_DIR}/${f}`) : [];
  const examplePath = path.join(root, EXAMPLE);
  const results = [], claimed = new Set(), ids = new Map();
  const run = (rel, example) => {
    const r = { file: rel, example, errors: [], warnings: [], id: null };
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) { r.errors.push('file not found'); return results.push(r); }
    let m;
    try { m = JSON.parse(fs.readFileSync(abs, 'utf8')); } catch (e) { r.errors.push(`invalid JSON: ${e.message}`); return results.push(r); }
    Object.assign(r, validateManifest(m, { file: rel, root, example }), { id: m?.id ?? null });
    if (!example && r.id) {
      if (ids.has(r.id)) r.errors.push(`duplicate id (also in ${ids.get(r.id)})`); else ids.set(r.id, rel);
      for (const p of [m.source, m.exports?.sheet, m.exports?.metadata]) if (typeof p === 'string') claimed.add(p);
    }
    results.push(r);
  };
  files.forEach((f) => run(f, false));
  if (fs.existsSync(examplePath)) run(EXAMPLE, true); else results.push({ file: EXAMPLE, example: true, id: null, errors: ['documented example is missing'], warnings: [] });

  const orphans = [];
  for (const [d, exts] of [[SOURCE_DIR, ['.aseprite', '.ase']], [EXPORT_DIR, ['.png', '.json']]]) {
    const abs = path.join(root, d);
    if (!fs.existsSync(abs)) continue;
    for (const f of fs.readdirSync(abs)) if (exts.includes(path.extname(f).toLowerCase()) && !claimed.has(`${d}/${f}`)) orphans.push(`${d}/${f}`);
  }

  // archived reference sheets: each file keeps the bytes named by its <name>.source.json record (never edited or re-encoded)
  const archived = [], sd = path.join(root, ARCHIVE_DIR);
  if (fs.existsSync(sd)) {
    const names = fs.readdirSync(sd).filter((f) => !f.startsWith('.')).sort(), REC = '.source.json';
    const base = (f) => f.replace(/\.[^.]*$/, '');
    for (const f of names.filter((n) => !n.endsWith(REC))) {
      const rec = base(f) + REC, a = { file: `${ARCHIVE_DIR}/${f}`, errors: [] };
      if (!names.includes(rec)) a.errors.push(`no record ${rec}`);
      else {
        let r = null;
        try { r = JSON.parse(fs.readFileSync(path.join(sd, rec), 'utf8')); } catch (e) { a.errors.push(`${rec}: invalid JSON: ${e.message}`); }
        if (r) {
          const b = fs.readFileSync(path.join(sd, f));
          if (r.file !== f) a.errors.push(`${rec} names "${r.file}"`);
          if (r.bytes !== b.length) a.errors.push(`${b.length} bytes, the record says ${r.bytes}`);
          if (r.sha256 !== crypto.createHash('sha256').update(b).digest('hex')) a.errors.push('SHA-256 differs from the record: the archived bytes changed');
        }
      }
      archived.push(a);
    }
    for (const rec of names.filter((n) => n.endsWith(REC)))
      if (!names.some((n) => !n.endsWith(REC) && base(n) + REC === rec)) archived.push({ file: `${ARCHIVE_DIR}/${rec}`, errors: ['record without its archived file'] });
  }
  const count = (k) => results.reduce((n, r) => n + r[k].length, 0);
  return { results, orphans, archived, manifests: results.filter((r) => !r.example).length,
    errors: count('errors') + archived.reduce((n, a) => n + a.errors.length, 0), warnings: count('warnings') + orphans.length };
}

function main() {
  const args = process.argv.slice(2), flags = new Set(args.filter((a) => a.startsWith('--')));
  const only = args.filter((a) => !a.startsWith('--'));
  let report;
  if (only.length) {
    const results = only.map((f) => {
      const rel = posix(path.relative(ROOT, path.resolve(f)));
      let m; try { m = JSON.parse(fs.readFileSync(path.resolve(f), 'utf8')); } catch (e) { return { file: rel, example: false, id: null, errors: [`cannot read / parse: ${e.message}`], warnings: [] }; }
      return { file: rel, example: rel === EXAMPLE, id: m?.id ?? null, ...validateManifest(m, { file: rel, example: rel === EXAMPLE }) };
    });
    report = { results, orphans: [], archived: [], manifests: results.length, errors: results.reduce((n, r) => n + r.errors.length, 0), warnings: results.reduce((n, r) => n + r.warnings.length, 0) };
  } else report = validateAll();

  if (flags.has('--json')) console.log(JSON.stringify(report, null, 2));
  else {
    for (const r of report.results) {
      console.log(`${r.errors.length ? 'FAIL' : 'OK  '} ${r.file}${r.example ? '  (documented example)' : ''}`);
      r.errors.forEach((e) => console.log(`       error: ${e}`));
      r.warnings.forEach((w) => console.log(`       warn:  ${w}`));
    }
    report.orphans.forEach((o) => console.log(`WARN ${o}  has no provenance manifest`));
    for (const a of report.archived) {
      console.log(`${a.errors.length ? 'FAIL' : 'OK  '} ${a.file}  (archived source${a.errors.length ? '' : ': SHA-256 and size match its record'})`);
      a.errors.forEach((e) => console.log(`       error: ${e}`));
    }
    console.log(`\n${report.manifests} manifest(s), ${report.archived.length} archived source(s), ${report.errors} error(s), ${report.warnings} warning(s)`);
  }
  process.exit(report.errors || (flags.has('--strict') && report.warnings) ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
