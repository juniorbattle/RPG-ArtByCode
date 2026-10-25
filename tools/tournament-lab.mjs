// TournamentLab (TOURNAMENT_MASTER_CONTRACT § 13, journal Passe L2): the tournament headless, from the game's own pure modules
// (src/tournament/lab.ts). No browser, no GPU.
//   node tools/tournament-lab.mjs [--seeds=1..50 | --seeds=1842,7719] [--policy=idle|diligent|careful|careless|losing] [--json=out.json]
//       many games: the player's rate of wins and injuries, the rivals' injuries, eliminations, upsets, sabotages, events fired, the
//       forgotten participants (no log entry about them in a day), the team transition (outside the slice)
//   node tools/tournament-lab.mjs --state=<named state> | --save=<file.json> [--days=N] [--policy=..]
//       load a state (a named state of src/simulation/named.ts, or a save file), play N more days with the policy, inspect the competitors
//   node tools/tournament-lab.mjs --compare=1842,7719 [--policy=..]   two seeds side by side: standings and results
//   --rules=dynamic (any of the above): the games under the rules of the « tour par tour dynamique » (src/combat/dynamic.ts, journal Passe C1),
//       their duels in DynamicSim and their off-screen matches in the same rules' race; absent = the arena of today
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';

const ROOT = path.resolve(import.meta.dirname, '..');
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
// the same loader as the unit tests (tests/load.mjs: Vite's SSR loader, its own cache, no watcher), without node:test
const server = await createServer({ root: ROOT, configFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-test', server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true } });
try {
  const L = await server.ssrLoadModule('/src/tournament/lab.ts');
  const G = await server.ssrLoadModule('/src/simulation/index.ts');
  const T = await server.ssrLoadModule('/src/tournament/pool.ts');
  const { RIVALS } = await server.ssrLoadModule('/src/narrative/roster.ts');
  // a policy (idle, diligent) or one of the slice's scripted games (careful, careless, losing; a script restarts its plan with each new game)
  const pn = arg('policy', 'diligent'), policy = L.POLICIES[pn] ?? L.SCRIPTS[pn]?.();
  if (!policy) throw new Error(`no policy "${pn}" (known: ${[...Object.keys(L.POLICIES), ...Object.keys(L.SCRIPTS)].join(', ')})`);
  const out = arg('json'), rules = arg('rules', 'classic');
  if (rules !== 'classic' && rules !== 'dynamic') throw new Error(`no rules "${rules}" (known: classic, dynamic)`);
  const table = (st) => T.standings(st).map((r, i) => `  ${String(i + 1).padStart(2)}. ${(r.id === 'player' ? st.player.name : RIVALS[r.id].name).padEnd(14)} ${String(r.points).padStart(2)} pts  rep ${String(r.reputation).padStart(3)}${r.id === 'player' ? '' : `  ${st.competitors[r.id].healthState.padEnd(7)} prep ${st.competitors[r.id].preparation}`}`).join('\n');

  if (arg('state') || arg('save')) {
    let st = arg('save') ? G.deserialize(fs.readFileSync(arg('save'), 'utf8')) : G.namedState(arg('state'));
    if (rules === 'dynamic') st.flags.combat = 'dynamic';
    const target = st.day + +(arg('days', '0'));
    while (!st.over && st.day < target) { const r = G.advance(st, policy.choose(st)); if (!r.ok) throw new Error(r.reason); st = r.state; }
    console.log(`day ${st.day} ${st.slot}${st.over ? ' (slice over)' : ''}, hash ${G.hash(st)}\n${table(st)}`);
    console.log('pulse', JSON.stringify(st.pulse));
    console.log('forgotten', JSON.stringify(L.forgotten(st)));
    if (out) fs.writeFileSync(out, JSON.stringify({ state: st, forgotten: L.forgotten(st) }, null, 1));
  } else if (arg('compare')) {
    const runs = arg('compare').split(',').map(Number).map((s) => L.autoplay(s, policy, undefined, undefined, rules));
    for (const g of runs) {
      console.log(`seed ${g.seed} (${policy.name}), hash ${g.hash}\n${table(g.state)}`);
      for (const m of g.state.tournament.matches) console.log(`  round ${m.round}: ${m.a} vs ${m.b} -> ${m.winner}${m.close ? ' (close)' : ''}`);
    }
    if (out) fs.writeFileSync(out, JSON.stringify(runs.map((g) => ({ seed: g.seed, hash: g.hash, standings: T.standings(g.state) })), null, 1));
  } else {
    const spec = arg('seeds', '1..50'), m = spec.match(/^(\d+)\.\.(\d+)$/);
    const seeds = m ? Array.from({ length: +m[2] - +m[1] + 1 }, (_, i) => +m[1] + i) : spec.split(',').map(Number);
    const t0 = performance.now(), r = L.labReport(seeds, policy, rules), ms = performance.now() - t0;
    console.log(`${r.seeds} games, policy ${r.policy}, rules ${r.rules}, ${ms.toFixed(0)} ms (${(ms / r.seeds).toFixed(1)} ms / game, Node, indicative)`);
    console.log('rates', JSON.stringify(r.rates));
    console.log('forgotten participants', r.forgotten);
    console.log('events fired (games)', JSON.stringify(r.eventCounts));
    console.log('team transition:', r.teamTransition);
    if (out) fs.writeFileSync(out, JSON.stringify(r, null, 1));
  }
} finally { await server.close(); }
