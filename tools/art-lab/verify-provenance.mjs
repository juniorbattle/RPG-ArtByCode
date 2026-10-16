// Verify an Art Lab provenance pack (art-lab/characters/provenance/<id>/PROVENANCE.json): every listed repo file still has its
// recorded SHA-256. Optionally verify the external source sheet (not stored in the repo: storing it needs an operator approval) and
// re-run the whole chain: reconstruction -> palette -> recorded cleanup, compared pixel for pixel with the approved export.
//   node tools/art-lab/verify-provenance.mjs <provenance dir> [--sheet <path to the source sheet>] [--rebuild]
// --rebuild needs --sheet and Chrome / Edge (CHROME_PATH). Read-only for the repo: rebuild outputs go to the OS temp folder.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2), opt = {}, pos = [];
for (let i = 0; i < args.length; i++) { if (args[i] === '--rebuild') opt.rebuild = true; else if (args[i].startsWith('--')) opt[args[i].slice(2)] = args[++i]; else pos.push(args[i]); }
if (!pos[0]) { console.error('usage: node tools/art-lab/verify-provenance.mjs <provenance dir> [--sheet <path>] [--rebuild]'); process.exit(2); }
const dir = path.resolve(pos[0]), P = JSON.parse(fs.readFileSync(path.join(dir, 'PROVENANCE.json'), 'utf8'));
// text files are hashed with LF line endings (a Git checkout may turn them into CRLF); binaries are hashed as stored
const TEXT = ['.json', '.mjs', '.js', '.ts', '.md', '.txt'];
const sha = (f) => { let b = fs.readFileSync(f); if (TEXT.includes(path.extname(f).toLowerCase())) b = Buffer.from(b.toString('utf8').replace(/\r\n/g, '\n'), 'utf8'); return crypto.createHash('sha256').update(b).digest('hex'); };
let bad = 0;
for (const [rel, h] of Object.entries(P.files)) {
  const f = path.join(ROOT, rel);
  if (!fs.existsSync(f)) { console.log(`MISSING  ${rel}`); bad++; } else if (sha(f) !== h) { console.log(`CHANGED  ${rel}`); bad++; } else console.log(`ok       ${rel}`);
}
const sheet = P.source?.sheet;
if (opt.sheet) {
  if (sha(opt.sheet) !== sheet.sha256) { console.log(`SHEET    ${opt.sheet} does not match the recorded source sheet`); bad++; } else console.log(`ok       source sheet (${sheet.sha256.slice(0, 16)}...)`);
} else console.log(`skip     source sheet: not stored in the repo (${sheet?.storage ?? 'see PROVENANCE.json'}); pass --sheet to check it`);
// the operator's provenance record about the source (not hashed, not a cryptographic proof): reported as such
const declFile = path.join(dir, 'source-declaration.json');
if (fs.existsSync(declFile)) {
  const D = JSON.parse(fs.readFileSync(declFile, 'utf8'));
  if (D.subject?.sha256 !== sheet?.sha256) { console.log('DECL     source-declaration.json names another sheet than PROVENANCE.json'); bad++; }
  else {
    const last = D.declarations?.[D.declarations.length - 1] ?? D.declaration;
    console.log(`note     source: ${D.status ?? D.verification?.status} (${last?.by}, ${last?.date})`);
    if (D.rightsAndProduction) console.log(`note     rights / production: ${D.rightsAndProduction.rights}`);
  }
}
if (opt.rebuild) {
  if (!opt.sheet) { console.error('--rebuild needs --sheet'); process.exit(2); }
  const R = P.reconstruction, tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'artlab-rebuild-')), pre = path.join(tmp, 'x');
  const node = process.execPath, tool = (t) => path.join(ROOT, 'tools', 'art-lab', t);
  execFileSync(node, [tool('reconstruct-grid.mjs'), opt.sheet, R.crop.join(','), String(R.pitch), String(R.frame[0]), String(R.frame[1]), String(R.footRow), pre, `full,${R.paletteColours}`], { stdio: 'ignore' });
  for (const [v, rel] of [['full', R.outputs.full], [String(R.paletteColours), R.outputs.quantised]]) {
    const same = sha(`${pre}-${v}.png`) === sha(path.join(ROOT, rel)); if (!same) bad++; console.log(`${same ? 'ok      ' : 'DIFFERS '} rebuild ${v} == ${rel}`);
  }
  try { execFileSync(node, [tool('replay-pixel-ops.mjs'), `${pre}-${R.paletteColours}.png`, path.join(ROOT, P.cleanup.ops), path.join(tmp, 'clean.png'), '--expect', path.join(ROOT, P.cleanup.result)], { stdio: 'ignore' }); console.log(`ok       replayed cleanup == ${P.cleanup.result} (pixel for pixel)`); }
  catch { console.log(`DIFFERS  replayed cleanup != ${P.cleanup.result}`); bad++; }
}
console.log(bad ? `${bad} problem(s)` : `${P.id}: intact`); process.exit(bad ? 1 : 0);
