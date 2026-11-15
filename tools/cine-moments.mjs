// The cinematics a duel of the arena's own page would play (journal Passe CI1, src/arena/cine.ts): the duel of `?scene=arena` (Ren of a new game, `foe`, `duelseed`,
// DEV `kit=`, `weapon=`) read by the rule; each moment's time, striker, skill, blows, damage, place. Node only: the times the clips of the sheet start from.
//   node tools/cine-moments.mjs [--foes=marek,vessa,...] [--seeds=1337] [--kit=t1,t4,d1,s1] [--weapon=] [--set=strong] [--land=hit] [--side=both] [--gap=20] [--max=]
import path from 'node:path';
import { createServer } from 'vite';

const ROOT = path.resolve(import.meta.dirname, '..');
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const server = await createServer({ root: ROOT, configFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-test', server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true } });
try {
  const V = await server.ssrLoadModule('/src/arena/autoView.ts'), C = await server.ssrLoadModule('/src/arena/cine.ts');
  const rule = { set: arg('set', 'strong'), land: arg('land', 'hit'), side: arg('side', 'both'), gap: +arg('gap', '20'), ...(arg('max') ? { max: +arg('max') } : {}), ko: arg('ko', '1') !== '0' };
  const kit = arg('kit') ? arg('kit').split(',') : undefined;
  for (const foe of arg('foes', 'marek,vessa,orla,cassius,ilse,rhosk,tobin').split(',')) for (const seed of arg('seeds', '1337').split(',').map(Number)) {
    const d = V.sceneAutoDuel(foe, seed, { weapon: arg('weapon') || null, loadout: kit });
    const ms = C.cineMoments(d.result, { ren: d.ren, marek: d.foe }, rule);
    console.log(`${foe} ${seed} (${d.result.t.toFixed(1)} s, ${d.result.winner === 0 ? 'Ren' : foe} wins): ${ms.map((m) => `${m.t.toFixed(2)} s ${m.who} ${m.action}×${m.hits} ${Math.round(m.damage)}${m.inBreak ? ' rupture' : m.inOpen ? ' faille' : ''}${m.ko ? ' K.O.' : ''}`).join(' ; ') || '—'}`);
  }
} finally { await server.close(); }
