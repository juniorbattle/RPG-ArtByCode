// The inventory of the rules that differ between Ren and the rivals: each difference brought to Ren's rule, alone, the race left as the game fits it. Whole
// games of the reference player (held-out seeds) and isolated duels of the reference of day 4 against the seven rivals.
//   node tools/auto-sym/inventory.mjs [--seeds=101..300] [--only=a,b] [--json=f]
import fs from 'node:fs';
import * as L from './lab.mjs';
const { RIVALS, range, med, pct, arg } = L;
const G = L.GAME;
export const VARIANTS = {
  'jeu': {},
  'tirages séparés': { streams: 'split' },
  'E1 PA payés par les rivaux': { ap: 'pay' },
  'E2 pas de combo, l’arme': { combo: 'weapon' },
  'E3a cadence ×1': { cadence: 1 },
  'E3b tables de Ren (cadence ×0,5)': { table: 'ren' },
  'E3c tables de Ren, cadence ×1': { table: 'ren', cadence: 1 },
  'E4 recharge 5 × la charge': { cooldown: 'db53' },
  'E5 sans traits': { traits: 'none' },
  'E6 l’automatique (PA gratuits)': { ai: 'auto' },
  'E6+E1 l’automatique, PA payés': { ai: 'auto', ap: 'pay' },
  'tout (coup lourd compétence)': { streams: 'split', ap: 'pay', combo: 'weapon', table: 'ren', cadence: 1, cooldown: 'db53', traits: 'none', ai: 'auto' },
  'tout (coup lourd de base)': { streams: 'split', ap: 'pay', combo: 'weapon', table: 'ren', cadence: 1, cooldown: 'db53', traits: 'none', ai: 'auto', heavy: 'base', renHeavy: 'base' },
};
const seeds = range(arg('seeds', '101..300')), only = arg('only') ? arg('only').split(',') : null, out = {};
try {
  for (const [name, v] of Object.entries(VARIANTS)) {
    if (only && !only.some((o) => name.startsWith(o))) continue;
    const cfg = { ...G, ...v };
    L.setModel(cfg);
    const Gm = L.gamesOf('reference', seeds);
    const rows = L.duelsOf({ day: 4, seeds: range('1..60'), log: true });
    const R = rows.flatMap((r) => r.res), avg = rows.reduce((n, r) => n + r.w / r.n, 0) / rows.length;
    const perMin = (f) => med(R.map((r) => (f(r) / r.t) * 60)).toFixed(1);
    const line = `${name.padEnd(36)} ${L.gamesLine(Gm).slice(10)} | duels j4 ${Math.round(100 * avg)} % (${rows.map((r) => `${r.id.slice(0, 3)} ${pct(r.w, r.n)}`).join(' ')}) ; ${med(R.map((r) => r.t)).toFixed(0)} s ; par min. : comp. Ren ${perMin((r) => r.n[0].skills)}, rival comp. ${perMin((r) => r.n[1].skills)} dont lourds ${perMin((r) => r.n[1].heavies)}, rival coups ${perMin((r) => r.n[1].hits)} ; dégâts du rival sur Ren exposé ${Math.round(100 * R.reduce((n, r) => n + r.n[1].dmgExposed, 0) / R.reduce((n, r) => n + r.n[1].dmg, 0))} %`;
    console.log(line);
    out[name] = { titles: Gm.crowns / Gm.n, stageWins: Gm.stageWins, day4: Object.fromEntries(rows.map((r) => [r.id, r.w / r.n])), day4avg: avg, t: med(R.map((r) => r.t)) };
  }
  if (arg('json')) fs.writeFileSync(arg('json'), JSON.stringify(out, null, 1));
} finally { L.setModel(null); await L.server.close(); }
