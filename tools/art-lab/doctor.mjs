// Character Art Toolchain doctor: `npm run art:doctor [-- --json]`.
// Read-only: inspects the environment, never installs, downloads or writes anything. "Aseprite not installed" is a valid
// state (exit 0). It never reports the integration as validated: only the 4A-0B smoke test can do that.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { validateAll, ROOT } from './validate-manifest.mjs';

const UPSTREAM_NPM = '@pebbly/aseprite-ai-artist';
const NEED_NODE = [22, 6];
const NEED_ASEPRITE = [1, 3];
const REQUIRED_DIRS = [
  'art-lab/characters/reference/A-runtime-baseline', 'art-lab/characters/reference/B-runtime-quality-targets', 'art-lab/characters/reference/C-sprite-quality',
  'art-lab/characters/source', 'art-lab/characters/exports', 'art-lab/characters/reviews', 'art-lab/characters/smoke-test', 'art-lab/characters/manifests',
];
const REQUIRED_FILES = [
  'art-lab/README.md', 'art-lab/characters/README.md', 'art-lab/characters/reference/README.md', 'art-lab/characters/manifest.example.json',
  'tools/art-lab/doctor.mjs', 'tools/art-lab/validate-manifest.mjs', 'tools/art-lab/make-contact-sheet.mjs', 'character-lab.html', 'src/lab/characterLab.ts',
];

/** "Aseprite 1.3.14-x64" -> {major, minor, patch, text} (null when the output is not an Aseprite banner) */
export function parseAsepriteVersion(out) {
  const m = /Aseprite\s+v?(\d+)\.(\d+)(?:\.(\d+))?(\S*)/i.exec(out ?? '');
  return m ? { major: +m[1], minor: +m[2], patch: m[3] ? +m[3] : 0, text: `${m[1]}.${m[2]}${m[3] ? `.${m[3]}` : ''}${m[4]}` } : null;
}
const atLeast = (v, [maj, min]) => v.major > maj || (v.major === maj && v.minor >= min);

function asepriteCandidates(env, home) {
  const exes = process.platform === 'win32' ? ['Aseprite.exe', 'aseprite.exe'] : ['aseprite', 'Aseprite'];
  const out = [];
  if (process.platform === 'win32') {
    const pf = [env.ProgramFiles, env['ProgramFiles(x86)']].filter(Boolean);
    for (const b of pf) out.push(path.join(b, 'Aseprite', 'Aseprite.exe'), path.join(b, 'Steam', 'steamapps', 'common', 'Aseprite', 'Aseprite.exe'));
    if (env.LOCALAPPDATA) out.push(path.join(env.LOCALAPPDATA, 'Programs', 'Aseprite', 'Aseprite.exe'));
  } else if (process.platform === 'darwin') {
    out.push('/Applications/Aseprite.app/Contents/MacOS/aseprite', path.join(home, 'Applications/Aseprite.app/Contents/MacOS/aseprite'),
      path.join(home, 'Library/Application Support/Steam/steamapps/common/Aseprite/Aseprite.app/Contents/MacOS/aseprite'));
  } else out.push(path.join(home, '.steam/steam/steamapps/common/Aseprite/aseprite'), path.join(home, '.local/share/Steam/steamapps/common/Aseprite/aseprite'), '/usr/bin/aseprite', '/usr/local/bin/aseprite');
  for (const d of (env.PATH ?? env.Path ?? '').split(path.delimiter).filter(Boolean)) for (const e of exes) out.push(path.join(d, e));
  return { out, exes };
}
const isFile = (p) => { try { return fs.statSync(p).isFile(); } catch { return false; } };
const isDir = (p) => { try { return fs.statSync(p).isDirectory(); } catch { return false; } };

/** ASEPRITE_PATH first (file, or folder holding the executable), then the standard / Steam locations and PATH. */
export function detectAseprite(env = process.env, home = os.homedir()) {
  const { out, exes } = asepriteCandidates(env, home);
  const r = { envDefined: Boolean(env.ASEPRITE_PATH), envValid: false, path: null, via: null, version: null, versionRaw: null, runnable: null };
  if (r.envDefined) {
    const p = env.ASEPRITE_PATH;
    const hit = isFile(p) ? p : isDir(p) ? exes.map((e) => path.join(p, e)).find(isFile) : null;
    // only a file that is named like Aseprite is ever executed (ASEPRITE_PATH=/bin/something is reported, not run)
    if (hit && /aseprite/i.test(path.basename(hit))) Object.assign(r, { envValid: true, path: hit, via: 'ASEPRITE_PATH' });
  }
  if (!r.path) { const hit = out.find(isFile); if (hit) Object.assign(r, { path: hit, via: 'standard location / PATH' }); }
  if (!r.path) return r;
  // `--noinapp` keeps a Steam build from registering "in game"; fall back to a plain `--version` if this build rejects it
  for (const args of [['--noinapp', '--version'], ['--version']]) {
    const p = spawnSync(r.path, args, { encoding: 'utf8', timeout: 10000, windowsHide: true });
    r.runnable = !p.error;
    r.versionRaw = `${p.stdout ?? ''}${p.stderr ?? ''}`.trim().split(/\r?\n/)[0] ?? '';
    r.version = parseAsepriteVersion(r.versionRaw);
    if (r.version) break;
  }
  return r;
}

const PLUGIN_ID = 'aseprite@aseprite-ai-artist', MARKETPLACE = 'aseprite-ai-artist';
const readJson = (f) => { try { return isFile(f) && fs.statSync(f).size < 8e6 ? JSON.parse(fs.readFileSync(f, 'utf8')) : null; } catch { return null; } };
const mentionsServer = (servers) => Object.keys(servers ?? {}).some((k) => /aseprite/i.test(k));

/** Aseprite's per-user config folders (where `install-extension` copies the Lua extension), most likely first. */
function asepriteConfigDirs(env, home) {
  if (process.platform === 'win32') return [path.join(env.APPDATA ?? path.join(home, 'AppData', 'Roaming'), 'Aseprite')];
  if (process.platform === 'darwin') return [path.join(home, 'Library', 'Application Support', 'Aseprite')];
  return [path.join(env.XDG_CONFIG_HOME ?? path.join(home, '.config'), 'aseprite'), path.join(home, '.aseprite')];
}

/** Local package, Claude Code plugin, Aseprite extension and other agent wiring. Reports names, scopes and versions only,
 *  never config contents. Configured is not validated: only the live smoke test (preflight -> draw -> export -> Lab) proves the link. */
export function detectAiArtist(root = ROOT, home = os.homedir(), env = process.env) {
  const pkgFile = path.join(root, 'node_modules', ...UPSTREAM_NPM.split('/'), 'package.json');
  let pkg = null;
  if (isFile(pkgFile)) pkg = readJson(pkgFile)?.version ?? 'unknown';
  // Claude Code plugin: the scope that enables it and the marketplace ref it is pinned to (Pass 4A-0B: local scope, tag v0.8.2)
  const plugin = [['local', path.join(root, '.claude', 'settings.local.json')], ['project', path.join(root, '.claude', 'settings.json')], ['user', path.join(home, '.claude', 'settings.json')]]
    .map(([scope, f]) => { const j = readJson(f), m = j?.extraKnownMarketplaces?.[MARKETPLACE]; return j?.enabledPlugins?.[PLUGIN_ID] ? { scope, ref: m?.source?.ref ?? null, autoUpdate: m?.autoUpdate ?? null } : null; })
    .filter(Boolean);
  const cacheDir = path.join(home, '.claude', 'plugins', 'cache', MARKETPLACE, 'aseprite');
  const cached = isDir(cacheDir) ? fs.readdirSync(cacheDir).filter((d) => isDir(path.join(cacheDir, d))) : [];
  const extension = asepriteConfigDirs(env, home).map((d) => readJson(path.join(d, 'extensions', 'aseprite-ai-artist', 'package.json'))?.version).find(Boolean) ?? null;
  // other agents' MCP wiring; ~/.claude.json counts only real mcpServers entries (it also keeps plugin usage counters by name)
  const claudeJson = path.join(home, '.claude.json'), cj = readJson(claudeJson);
  const configs = [
    [root, '.mcp.json'], [root, '.cursor/mcp.json'], [root, '.vscode/mcp.json'], [root, '.codex/config.toml'], [root, '.gemini/settings.json'], [root, '.devin/config.json'],
    [home, '.codex/config.toml'], [home, '.cursor/mcp.json'], [home, '.gemini/settings.json'], [home, '.codeium/windsurf/mcp_config.json'],
    [home, '.config/devin/config.json'], [home, '.config/opencode/opencode.json'],
  ].map(([b, f]) => path.join(b, f));
  const wired = configs.filter((f) => { try { return isFile(f) && fs.statSync(f).size < 8e6 && fs.readFileSync(f, 'utf8').includes('aseprite-ai-artist'); } catch { return false; } });
  if (cj && (mentionsServer(cj.mcpServers) || Object.values(cj.projects ?? {}).some((p) => mentionsServer(p?.mcpServers)))) wired.push(claudeJson);
  return { package: pkg, plugin, cached, extension, wired };
}

function git(args) { const p = spawnSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', timeout: 5000, windowsHide: true }); return p.status === 0 ? p.stdout.trim() : null; }

export function runDoctor() {
  const node = process.versions.node.split('.').map(Number);
  const nodeOk = node[0] > NEED_NODE[0] || (node[0] === NEED_NODE[0] && node[1] >= NEED_NODE[1]);

  let pkgName = null; try { pkgName = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).name; } catch { /* reported below */ }
  const repoProblems = [];
  if (pkgName !== 'cite-du-tournoi-hd2d') repoProblems.push('package.json missing or not this project');
  for (const f of ['AGENTS.md', 'JOURNAL.md']) if (!isFile(path.join(ROOT, f))) repoProblems.push(`${f} missing`);

  const missingDirs = REQUIRED_DIRS.filter((d) => !isDir(path.join(ROOT, d)));
  const missingFiles = REQUIRED_FILES.filter((f) => !isFile(path.join(ROOT, f)));
  const manifests = validateAll();
  const labProblems = [...missingDirs.map((d) => `missing folder ${d}`), ...missingFiles.map((f) => `missing file ${f}`),
    ...manifests.results.flatMap((r) => r.errors.map((e) => `${r.file}: ${e}`))];

  const ase = detectAseprite();
  const art = detectAiArtist();
  const aseOld = ase.version && !atLeast(ase.version, NEED_ASEPRITE);
  const configured = Boolean(art.package || art.plugin.length || art.extension || art.wired.length);
  const versionWarnings = [];
  if (art.extension && art.cached.length && !art.cached.includes(art.extension)) versionWarnings.push(`Aseprite extension ${art.extension} vs cached Claude plugin ${art.cached.join(', ')}: run install-extension for the plugin's version`);
  if (art.plugin.length > 1) versionWarnings.push(`${PLUGIN_ID} enabled in several scopes (${art.plugin.map((p) => p.scope).join(', ')}): keep it local only`);
  if (art.plugin.some((p) => p.scope !== 'local')) versionWarnings.push(`${PLUGIN_ID} enabled outside local scope: it would load in other projects / for other users`);

  const rows = [
    ['Node', nodeOk ? 'OK' : `OLD (${process.versions.node}; upstream needs >= ${NEED_NODE.join('.')})`],
    ['Repository', repoProblems.length ? 'FAIL' : 'OK'],
    ['Art Lab', labProblems.length ? 'FAIL' : 'OK'],
    ['Aseprite', !ase.path ? (ase.envDefined ? 'NOT INSTALLED (ASEPRITE_PATH invalid)' : 'NOT INSTALLED')
      : ase.version ? `${aseOld ? 'TOO OLD' : 'FOUND'} ${ase.version.text}` : 'FOUND (version unknown)'],
    ['Aseprite AI Artist', configured ? 'CONFIGURED (live link not tested by doctor)' : 'NOT CONFIGURED'],
  ];

  let status;
  if (repoProblems.length || labProblems.length) status = 'REPOSITORY NOT READY: fix the FAIL items above';
  else if (!ase.path) status = 'READY FOR 4A-0B AFTER ASEPRITE INSTALLATION';
  else if (aseOld) status = `ASEPRITE TOO OLD: 4A-0B needs Aseprite ${NEED_ASEPRITE.join('.')}+`;
  else if (!ase.version) status = `ASEPRITE FOUND, VERSION UNKNOWN: confirm it is ${NEED_ASEPRITE.join('.')}+ before 4A-0B`;
  else if (!configured) status = 'ASEPRITE FOUND: aseprite-ai-artist not configured (see art-lab/README.md, Pass 4A-0B)';
  else status = 'TOOLS CONFIGURED: doctor cannot prove the live link; the smoke test does (JOURNAL Passe 4A-0B), re-run it after any upgrade';

  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']), sha = git(['rev-parse', '--short', 'HEAD']);
  const yn = (b) => (b ? 'yes' : 'no');
  const details = [
    ['Node version', `v${process.versions.node}${nodeOk ? '' : ` (upstream aseprite-ai-artist needs >= ${NEED_NODE.join('.')})`}`],
    ['Project path', ROOT],
    ['Platform', `${process.platform} ${process.arch}`],
    ['Git', branch ? `${branch} @ ${sha}` : 'unavailable'],
    ['Aseprite detected', ase.path ? `yes: ${ase.path} (via ${ase.via})` : 'no'],
    ['ASEPRITE_PATH defined', ase.envDefined ? `yes${ase.envValid ? '' : ' (does not point to an Aseprite executable)'}` : 'no'],
    ['Aseprite version', ase.version ? ase.version.text : ase.path ? `unknown (${ase.versionRaw || 'no output'})` : 'n/a'],
    [`${UPSTREAM_NPM}`, art.package ? `yes: local node_modules, v${art.package} (not expected: the toolchain is the Claude plugin + extension)` : 'no (not a project dependency by design)'],
    ['Claude Code plugin', art.plugin.length ? art.plugin.map((p) => `${PLUGIN_ID} enabled (${p.scope}), marketplace ref ${p.ref ?? 'unpinned'}, auto-update ${p.autoUpdate === false ? 'off' : 'default'}`).join('; ') + `; cached ${art.cached.join(', ') || 'none'}` : 'not enabled'],
    ['Aseprite extension', art.extension ? `aseprite-ai-artist ${art.extension}` : 'not installed'],
    ['Other agent wiring', art.wired.length ? `mentioned in: ${art.wired.join(', ')}` : 'none found'],
    ['Art Lab folders', missingDirs.length || missingFiles.length ? `INVALID (${missingDirs.length + missingFiles.length} missing)` : 'valid'],
    ['Manifest schema / check', `${manifests.errors ? 'INVALID' : 'valid'}: ${manifests.manifests} manifest(s) + example, ${manifests.errors} error(s), ${manifests.warnings} warning(s)`],
    ['Character Lab', 'dev only: npm run dev, then /character-lab.html (absent from the production build)'],
  ];
  return { rows, status, details, problems: [...repoProblems, ...labProblems], warnings: [...versionWarnings, ...manifests.results.flatMap((r) => r.warnings.map((w) => `${r.file}: ${w}`)), ...manifests.orphans.map((o) => `${o}: no provenance manifest`)], ok: !repoProblems.length && !labProblems.length };
}

function main() {
  const rep = runDoctor();
  if (process.argv.includes('--json')) console.log(JSON.stringify(rep, null, 2));
  else {
    const dots = (label) => `${label} ${'.'.repeat(Math.max(3, 23 - label.length - 2))} `;
    console.log('Character Art Toolchain\n');
    for (const [k, v] of rep.rows) console.log(`${dots(k)}${v}`);
    console.log(`\nStatus:\n${rep.status}\n\nDetails`);
    for (const [k, v] of rep.details) console.log(`  ${k} ${'.'.repeat(Math.max(2, 30 - k.length - 1))} ${v}`);
    if (rep.problems.length) { console.log('\nProblems'); rep.problems.forEach((p) => console.log(`  - ${p}`)); }
    if (rep.warnings.length) { console.log('\nWarnings'); rep.warnings.forEach((w) => console.log(`  - ${w}`)); }
  }
  process.exit(rep.ok ? 0 : 1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
