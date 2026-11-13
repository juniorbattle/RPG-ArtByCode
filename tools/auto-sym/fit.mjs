// The race fitted on the symmetric model (AC-16's way, LC1-1's slope kept: +15 % a round of the pool): each rival's pool factor so the reference of day 2 beats it
// 95 times in 100 (isolated duels), the bracket's and the final's on whole games of the reference (calibration seeds 1 to 80) for the semi-final's 65 % and the
// final's 50 % (AC-15); then the held-out seeds.   node tools/auto-sym/fit.mjs [--c=0.75] [--out=race.json] [--seeds=101..300] [--race=f (no fit)]
import fs from 'node:fs';
import * as L from './lab.mjs';
const { range, med, arg, AD } = L;
export const SYM = { ...L.GAME, streams: 'split', ap: 'pay', combo: 'weapon', table: 'ren', cadence: 1, cooldown: 'db53', traits: 'none', ai: 'auto', heavy: 'base', renHeavy: 'base', heavyCd: arg('heavycd', '0') === '1' };
const c = +arg('c', '0.75');
try {
  L.setModel({ ...SYM, cadence: c });
  let race;
  if (arg('race')) { race = JSON.parse(fs.readFileSync(arg('race'), 'utf8')); L.setRace(race); }
  // --pool=1,1.1,1.2 another slope of the pool (LC1-1's +15 % by default); with --race, the pool factors kept and the two stages refitted
  if (arg('pool')) { AD.AUTO_RACE.pool = arg('pool').split(',').map(Number); race = L.levelFit(0.95, [0.65, 0.5], range(arg('fitseeds', '1..80')), { keepNorm: !!arg('race') }); }
  else if (!arg('race')) race = L.levelFit(0.95, [0.65, 0.5], range(arg('fitseeds', '1..80')));
  if (arg('out')) fs.writeFileSync(arg('out'), JSON.stringify(race, null, 1));
  for (const id of L.RIVALS) { const sh = (s, r) => { const x = AD.autoRaceSheet(id, s, r); return `${Math.round(x.hp)} PV ${x.atk.toFixed(1)}/${x.def.toFixed(1)}/${x.end.toFixed(1)}/${x.viv}`; }; console.log(`  ${id.padEnd(8)} x${race.norm[id]} : poule ${sh(0, 0)} → ${sh(0, 2)} ; tableau ${sh(1)} ; finale ${sh(2)}`); }
  const seeds = range(arg('seeds', '101..300')), out = {};
  for (const pn of (arg('policies', 'reference,planner,curious,diligent,idle')).split(',')) {
    const G = L.gamesOf(pn, seeds, { rhythm: true }), B = G.bouts;
    console.log(L.gamesLine(G) + `  ; durées méd. ${med(B.map((b) => b.t)).toFixed(0)} s (p10 ${L.q(B.map((b) => b.t), 0.1).toFixed(0)}, p90 ${L.q(B.map((b) => b.t), 0.9).toFixed(0)}) ; comp. ${med(B.map((b) => b.n[0].skills))} ; ruptures ${(B.reduce((n, b) => n + b.n[1].breaks, 0) / B.length).toFixed(2)} / ${(B.reduce((n, b) => n + b.n[0].breaks, 0) / B.length).toFixed(2)} ; retournements ${(B.reduce((n, b) => n + b.turns, 0) / B.length).toFixed(1)}`);
    if (pn === 'reference') console.log(`          rythme : ${L.rhythmLine(B.map((b) => b.rh))}`);
    out[pn] = { titles: G.crowns / G.n, stageWins: G.stageWins, t: med(B.map((b) => b.t)) };
  }
  if (arg('json')) fs.writeFileSync(arg('json'), JSON.stringify({ c, race, out }, null, 1));
} finally { L.setModel(null); await L.server.close(); }
