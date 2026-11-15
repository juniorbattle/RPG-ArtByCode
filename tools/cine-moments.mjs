// The cinematics a duel of the arena's own page plays (journal Passes CI1 / CI2, src/arena/cine.ts, the operator's rule CINE_RULE): the duel of `?scene=arena` (Ren of
// a new game, `foe`, `duelseed`, DEV `kit=`, `weapon=`); each moment's time, tier, striker, skill, blows, damage, place. Node only: where the clips and the proofs start.
//   node tools/cine-moments.mjs [--foes=marek,vessa,...] [--seeds=1337] [--kit=t1,t4,d1,s1] [--weapon=] [--sk1]
//   --sk1: the workshop of journal Passe SK1 as the page's DEV `cine=sk1` (src/lab/skillStructure.ts: its rule, the rivals' signatures for `--kit`, the openers' weight)
import path from 'node:path';
import { createServer } from 'vite';

const ROOT = path.resolve(import.meta.dirname, '..');
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const server = await createServer({ root: ROOT, configFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-test', server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true } });
try {
  const V = await server.ssrLoadModule('/src/arena/autoView.ts'), C = await server.ssrLoadModule('/src/arena/cine.ts');
  const kit = arg('kit') ? arg('kit').split(',') : undefined, sk1 = process.argv.includes('--sk1');
  const rule = sk1 ? (await server.ssrLoadModule('/src/lab/skillStructure.ts')).CINE_RULE_SK1 : undefined;
  if (sk1) (await server.ssrLoadModule('/src/lab/skillStructure.ts')).applySk1();
  for (const foe of arg('foes', 'marek,vessa,orla,cassius,ilse,rhosk,tobin').split(',')) for (const seed of arg('seeds', '1337').split(',').map(Number)) {
    const d = V.sceneAutoDuel(foe, seed, { weapon: arg('weapon') || null, loadout: kit });
    const ms = C.cineMoments(d.result, { ren: d.ren, marek: d.foe }, rule);
    console.log(`${foe} ${seed} (${d.result.t.toFixed(1)} s, ${d.result.winner === 0 ? 'Ren' : foe} wins): ${ms.map((m) => `${m.t.toFixed(2)} s ${m.tier} ${m.who} ${m.action}×${m.hits} ${Math.round(m.damage)}${m.inBreak ? ' rupture' : m.inOpen ? ' faille' : ''}${m.ko ? ' K.O.' : ''}`).join(' ; ') || '—'}`);
  }
} finally { await server.close(); }
