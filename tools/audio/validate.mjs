// The sound's provenance (SA-8 « Elle bouge : cuit, avec manifeste », journal Passes SN1 / SN3): a baked file reaches the game only through a manifest
// art-lab/audio/manifests/<id>.manifest.json. Run by `npm run art:validate`. Zero file is a valid state.
//   the licences: SA-13 « CC0, CC BY, MIT et nos sons »; no generated audio: SA-12 « Idéation seulement »; the weight: SA-17 « 12 Mo au plus », what
//   one player fetches, so one format's files (the same sound comes as Opus in WebM and as AAC in M4A, journal Passe SN1).
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const MANIFEST_DIR = 'art-lab/audio/manifests';
export const BAKED_DIR = 'src/audio/baked';
export const LICENCES = ['own', 'CC0-1.0', 'CC-BY-3.0', 'CC-BY-4.0', 'MIT'];
export const MAX_BYTES = 12 * 1024 * 1024;
const AUDIO = /\.(mp3|ogg|oga|opus|weba|webm|wav|m4a|aac|flac)$/i;
const KINDS = ['music', 'ambience', 'effect'], USES = ['none', 'lab', 'production'];
const isStr = (v) => typeof v === 'string' && v.trim() !== '';

export function validateAudio(root) {
  const errors = [], claimed = new Set(), weight = {}, dir = path.join(root, MANIFEST_DIR);
  const names = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.manifest.json')).sort() : [];
  for (const name of names) {
    const err = (e) => errors.push(`${MANIFEST_DIR}/${name}: ${e}`);
    let m; try { m = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')); } catch (e) { err(`invalid JSON: ${e.message}`); continue; }
    if (`${m.id}.manifest.json` !== name) err(`id "${m.id}" does not match the file name`);
    if (!KINDS.includes(m.kind)) err(`kind "${m.kind}"`);
    if (!USES.includes(m.runtimeUse)) err(`runtimeUse "${m.runtimeUse}"`);
    if (!LICENCES.includes(m.licence)) err(`licence "${m.licence}" is not one of SA-13's`);
    if (m.generatedByAi !== false) err('generatedByAi must be false (SA-12)');
    if (m.licence === 'own' && !isStr(m.score)) err('our own sound names the score that writes it');
    else if (m.licence === 'own' && !fs.existsSync(path.join(root, m.score))) err(`score ${m.score} is missing`);
    if (m.licence !== 'own' && !(Array.isArray(m.sources) && m.sources.length && m.sources.every((s) => isStr(s.url) && isStr(s.author) && s.licence === m.licence))) err('a third-party sound keeps its sources: url, author, licence');
    if (m.runtimeUse === 'production' && (m.approved !== true || !isStr(m.approval))) err('production needs the operator\'s approval, word for word');
    if (!Array.isArray(m.files) || !m.files.length) { err('no files'); continue; }
    for (const f of m.files) {
      const p = path.join(root, String(f.path));
      if (!String(f.path).startsWith(`${BAKED_DIR}/`)) err(`${f.path} is outside ${BAKED_DIR}`);
      if (!fs.existsSync(p)) { err(`${f.path} is missing`); continue; }
      const b = fs.readFileSync(p);
      if (b.length !== f.bytes) err(`${f.path}: ${b.length} bytes, the manifest says ${f.bytes}`);
      if (crypto.createHash('sha256').update(b).digest('hex') !== f.sha256) err(`${f.path}: the SHA-256 differs from the manifest`);
      if (m.runtimeUse === 'production') { claimed.add(f.path); const x = path.extname(f.path).toLowerCase(); weight[x] = (weight[x] ?? 0) + b.length; }
    }
  }
  const walk = (d) => { const p = path.join(root, d); if (!fs.existsSync(p)) return; for (const e of fs.readdirSync(p, { withFileTypes: true })) { const r = `${d}/${e.name}`; if (e.isDirectory()) walk(r); else if (AUDIO.test(e.name) && !claimed.has(r)) errors.push(`${r}: an audio file without a production manifest`); } };
  for (const d of ['src', 'public']) walk(d);
  for (const [x, b] of Object.entries(weight)) if (b > MAX_BYTES) errors.push(`${x}: ${b} bytes over SA-17's ${MAX_BYTES}`);
  return { manifests: names.length, errors, weight };
}
