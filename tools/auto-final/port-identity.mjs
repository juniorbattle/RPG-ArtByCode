// The port of the model « La Brute » proven identical to the laboratory (lot 1, journal Passe BL1; briefs/combat-brute-lot1-brief.md): the laboratory of the
// commit before the port (its tools/auto-final, `BK5`, on that commit's game sources: lab.mjs transforms the game it loads, so it is valid against that commit
// only) against the game as it is, on the same isolated duels (kits, levels, gears, rivals and generic fighters, stages, plans, presses) and on whole games of
// every policy (final state and fingerprint), at the same race. The laboratory's kit lookup is corrected in its copy (`kitOf` read the first rival skill of a
// fighter in its order, a ward or a support for every rival: its off-screen bouts fought every rival in Marek's style; journal Passe BL1).
//   node tools/auto-final/port-identity.mjs [--base=bd636ef] [--seeds=101..112] [--race=<file.json>]
// Node only (git, the repository's node_modules); a temporary folder outside the repository, removed after.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '../..');
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const base = arg('base', 'bd636ef'), seeds = arg('seeds', '101..112').split('..').map(Number), race = arg('race') ? path.resolve(arg('race')) : '';
const POLICIES = ['reference', 'planner', 'curious', 'diligent', 'idle'];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'brute-port-'));
const url = (f) => pathToFileURL(f).href;

/** the isolated duels both sides play */
const PARAMS = `
export const GEN = { aldric: 'marek', corra: 'orla' };
const RIVALS = ['vessa', 'tobin', 'cassius', 'orla', 'ilse', 'marek', 'rhosk'];
const kits = [['t1', 't4', 'd1', 's1'], ['t1', 't2', 't3', 't4'], ['k_sunder', 'k_feint', 't4', 'k_focus'], ['k_parry', 'k_feint', 't1', 't4'], ['k_iron', 'd1', 't4', 'k_cry'], ['t3', 'k_sunder', 't4', 'k_cry'], ['t2', 'k_feint', 't4', 's1']];
const gears = [{ weapon: 'training-sword', tier: 0, armour: null, acc: [null, null] }, { weapon: 'duelist-sabre', tier: 1, armour: 'padded-jack', acc: ['swift-boots', 'lucky-ribbon'] }, { weapon: 'imported-blade', tier: 2, armour: 'mail-shirt', acc: ['iron-ring', 'champion-token'] }, { weapon: 'imported-blade', tier: 0, armour: 'dock-leathers', acc: ['fervour-charm', null] }];
const tactics = [undefined, { 0: 'broken', 2: 'ready' }, { 1: 'incoming', 3: 'hurt' }, { 0: 'never', 1: 'follow' }];
export function* params(GEAR) {
  const viv = (g) => [g.weapon, g.armour, ...g.acc].reduce((n, id) => n + (id ? GEAR[id]?.fx?.viv ?? 0 : 0), 0);
  for (const [ki, loadout] of kits.entries()) for (const foe of [...RIVALS, ...Object.keys(GEN)]) for (let gi = 0; gi < gears.length; gi++) {
    const stage = (ki + gi + foe.length) % 3, g = gears[gi], lv = 1 + ((ki + gi) % 5);
    const levels = Object.fromEntries([...loadout, 'heavy'].map((id, j) => [id, 1 + ((lv + j) % 5)]));
    const tc = tactics[(ki + gi) % 4], tactic = tc ? Object.fromEntries(Object.entries(tc).map(([i, c]) => [loadout[i], c])) : undefined;
    const stats = { hp: 300 + 30 * gi, atk: 14 + gi, def: 11 + (ki % 4), end: 10 + (gi % 2) * 4, viv: 10 + viv(g) };
    for (const seed of [11 + gi, 4242 + ki * 7]) {
      const cmds = seed % 3 === 0 ? [{ t: 12, skill: loadout[1] }, { t: 40, skill: loadout[2] }] : undefined;
      yield { key: loadout.join('.') + '|' + foe + '|' + gi + '|' + seed, loadout, levels, tactic, stats, gear: g, pieceViv: viv(g), hpShare: gi === 3 ? 0.8 : 1, taken: ki === 2 ? 1.15 : 1, effect: g.acc.includes('fervour-charm') ? 1.3 : 1, foe, stage, round: stage === 0 ? ki % 3 : 0, prep: 20 + 15 * (ki % 5), seed, cmds };
    }
  }
}`;
const applyRace = (AD) => race ? `{ const r = JSON.parse(fs.readFileSync(${JSON.stringify(race)}, 'utf8')); Object.assign(${AD}.AUTO_RACE.norm, r.norm); ${AD}.AUTO_RACE.pool = [...r.pool]; Object.assign(${AD}.AUTO_RACE.stage, r.stage); }` : '';

/** the laboratory of the commit before, on its own sources */
const OLD = `import fs from 'node:fs';
const L = await import(${JSON.stringify(url(path.join(tmp, 'tools/auto-final/lab.mjs')))});
const { VARIANTS } = await import(${JSON.stringify(url(path.join(tmp, 'tools/auto-final/variants.mjs')))});
const { params } = await import(${JSON.stringify(url(path.join(tmp, 'params.mjs')))});
const out = { duels: {}, games: {} };
try {
  L.setModel(VARIANTS.BK5.cfg);
  ${applyRace('L.AD')}
  const { GENERICS } = await L.load('/src/narrative/generics.ts');
  for (const p of params(L.GE.GEAR)) {
    const A = L.AD.autoRen(p.stats, { loadout: p.loadout, levels: p.levels, ...(p.tactic ? { tactic: p.tactic } : {}) }, { weapon: p.gear.weapon, hpShare: p.hpShare, apStart: 0, taken: p.taken, effect: p.effect });
    A.gear = p.gear; A.kitLevels = p.levels;
    const G = GENERICS[p.foe];
    const B = G ? L.AD.autoFoe(p.foe, L.AD.autoGenericSheet(G.profile, G, p.stage, p.round), { kitOf: G.profile }) : L.AD.autoFoe(p.foe, L.AD.autoRaceSheet(p.foe, p.stage, p.round, { preparation: p.prep }));
    B.kitId = G ? G.profile : p.foe; B.stageAt = p.stage;
    const r = L.AU.autoDuel(A, B, p.seed, { log: true, commands: p.cmds });
    out.duels[p.key] = JSON.stringify({ log: r.log, t: r.t, hp: r.hp, maxHp: r.maxHp, winner: r.winner, leadChanges: r.leadChanges });
  }
  for (const pn of ${JSON.stringify(POLICIES)}) for (let s = ${seeds[0]}; s <= ${seeds[1]}; s++) { const g = L.LAB.autoplay(s, L.LAB.POLICIES[pn], 'Ren', 260, 'v2'); out.games[pn + ':' + s] = { hash: g.hash, state: JSON.stringify(g.state) }; }
} finally { L.setModel(null); await L.server.close(); }
fs.writeFileSync(${JSON.stringify(path.join(tmp, 'old.json'))}, JSON.stringify(out));
`;

try {
  // the commit before, its game and its laboratory, outside the repository
  const tar = execFileSync('git', ['-c', 'core.autocrlf=false', 'archive', base, 'src', 'tools/auto-final'], { cwd: ROOT, maxBuffer: 1 << 28 });
  fs.writeFileSync(path.join(tmp, 'base.tar'), tar);
  execFileSync('tar', ['-xf', 'base.tar'], { cwd: tmp });
  const lab = path.join(tmp, 'tools/auto-final/lab.mjs');
  let s = fs.readFileSync(lab, 'utf8');
  const fix = [
    ["import { createServer } from 'vite';", `import { createServer } from ${JSON.stringify(url(path.join(ROOT, 'node_modules/vite/dist/node/index.js')))};`],
    ["cacheDir: 'node_modules/.vite-test'", `cacheDir: ${JSON.stringify(path.join(tmp, '.vite').replace(/\\/g, '/'))}`],
    ["export const kitOf = (x) => x.kitId ?? KIT_OF[x.skills.find((s) => s.id.startsWith('m_'))?.id] ?? (x.side === 'ren' && x.id === 'ren' ? null : 'marek');",
      "export const kitOf = (x) => x.kitId ?? x.skills.map((s) => KIT_OF[s.id]).find(Boolean) ?? (x.side === 'ren' && x.id === 'ren' ? null : 'marek');"],
  ];
  for (const [a, b] of fix) { if (!s.includes(a)) throw new Error(`the laboratory of ${base} has no « ${a.slice(0, 60)} »`); s = s.replace(a, b); }
  fs.writeFileSync(lab, s);
  fs.writeFileSync(path.join(tmp, 'params.mjs'), PARAMS);
  fs.writeFileSync(path.join(tmp, 'old.mjs'), OLD);
  execFileSync(process.execPath, [path.join(tmp, 'old.mjs')], { stdio: 'inherit' });
  const old = JSON.parse(fs.readFileSync(path.join(tmp, 'old.json'), 'utf8'));

  // the game as it is
  const { createServer } = await import('vite');
  const server = await createServer({ root: ROOT, configFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-test', server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true } });
  try {
    const load = (f) => server.ssrLoadModule(f);
    const AU = await load('/src/combat/auto.ts'), AD = await load('/src/combat/autoData.ts'), GE = await load('/src/simulation/gear.ts'), LAB = await load('/src/tournament/lab.ts');
    const { GENERICS } = await load('/src/narrative/generics.ts');
    const { params } = await import(url(path.join(tmp, 'params.mjs')));
    if (race) { const r = JSON.parse(fs.readFileSync(race, 'utf8')); Object.assign(AD.AUTO_RACE.norm, r.norm); AD.AUTO_RACE.pool = [...r.pool]; Object.assign(AD.AUTO_RACE.stage, r.stage); }
    let n = 0, same = 0;
    const seen = {};
    for (const p of params(GE.GEAR)) {
      const A = AD.autoRen(p.stats, { loadout: p.loadout, levels: p.levels, ...(p.tactic ? { tactic: p.tactic } : {}) }, { weapon: p.gear.weapon, hpShare: p.hpShare, taken: p.taken, effect: p.effect, gear: [p.gear.weapon, p.gear.armour, ...p.gear.acc], pieceViv: p.pieceViv });
      const G = GENERICS[p.foe];
      const B = G ? AD.autoFoe(p.foe, AD.autoGenericSheet(G.profile, G, p.stage, p.round), { kitOf: G.profile, stage: p.stage }) : AD.autoFoe(p.foe, AD.autoRaceSheet(p.foe, p.stage, p.round, { preparation: p.prep }), { stage: p.stage });
      const r = AU.autoDuel(A, B, p.seed, { log: true, commands: p.cmds });
      for (const e of r.log) seen[e.ev] = (seen[e.ev] ?? 0) + 1;
      n++; if (JSON.stringify({ log: r.log, t: r.t, hp: r.hp, maxHp: r.maxHp, winner: r.winner, leadChanges: r.leadChanges }) === old.duels[p.key]) same++; else if (n - same <= 3) console.log(`duel différent : ${p.key}`);
    }
    console.log(`duels isolés : ${same} / ${n} identiques au laboratoire de ${base} (BK5), événement par événement (${Object.entries(seen).map(([k, v]) => `${k} ${v}`).join(', ')})`);
    let gs = 0, gn = 0;
    for (const pn of POLICIES) for (let s = seeds[0]; s <= seeds[1]; s++) {
      const g = LAB.autoplay(s, LAB.POLICIES[pn], 'Ren', 260, 'v2'), o = old.games[`${pn}:${s}`];
      gn++; if (o && o.hash === g.hash && o.state === JSON.stringify(g.state)) gs++; else console.log(`partie différente : ${pn} ${s}`);
    }
    console.log(`parties entières : ${gs} / ${gn} identiques (état final et empreinte)`);
    process.exitCode = same === n && gs === gn ? 0 : 1;
  } finally { await server.close(); }
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }
