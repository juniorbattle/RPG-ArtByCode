// The ways of deciding on whole games under a set of rules (journal Passe CF1; SL1-4's measure of journal Passe SL3, again): the reference's games, Ren's way of
// deciding replaced in his own bouts: the automatic, the page's tactics for every rival (one condition by family), random presses.
//   node tools/auto-final/modes.mjs --variant=<name> [--race=f.json] [--seeds=101..300] [--json=f]
import fs from 'node:fs';
import * as L from './lab.mjs';
import { VARIANTS } from './variants.mjs';
import { seedsOf, judge } from './measure.mjs';
const { SIM } = L;
const fam = (s) => (s.ward ? 'w' : s.boost ? 'b' : 'o');
const page = (by) => () => (v, x) => SIM.tacticChoice(v, x, x.skills.map((s) => by(s, x))) ?? (SIM.heavyWhen(v, x) ? x.heavy : x.light);
const h = (a, b, c) => { let z = (a * 2654435761 + b * 40503 + c * 9973) >>> 0; z ^= z >>> 15; z = Math.imul(z, 2246822519) >>> 0; z ^= z >>> 13; return (z >>> 0) / 4294967296; };
const careless = (p, seed = 7) => () => (v, x) => { const can = x.skills.filter((s) => v.usable(s)); if (can.length && h(seed, Math.floor(v.t * 100), v.me.n.acts) < p) return can[Math.floor(h(seed + 1, Math.floor(v.t * 100), v.me.n.acts) * can.length)]; return SIM.autoDecider(v, x); };
export const MODES = {
  'automatique': null,
  'offensives à la rupture': page((s) => (fam(s) === 'o' ? 'broken' : 'auto')),
  'offensives quand il charge un gros coup': page((s) => (fam(s) === 'o' ? 'incoming' : 'auto')),
  'offensives quand il se protège': page((s) => (fam(s) === 'o' ? 'warded' : 'auto')),
  'offensives quand sa jauge passe les deux tiers': page((s) => (fam(s) === 'o' ? 'foeGauge' : 'auto')),
  'la plus forte pour finir': page((s, x) => (fam(s) === 'o' && s === SIM.strongestOf(x) ? 'finish' : 'auto')),
  'offensives dès que prêtes': page((s) => (fam(s) === 'o' ? 'ready' : 'auto')),
  'protections quand il charge un gros coup': page((s) => (fam(s) === 'w' ? 'incoming' : 'auto')),
  'protections à la jauge': page((s) => (fam(s) === 'w' ? 'gauge' : 'auto')),
  'protections dès que prêtes': page((s) => (fam(s) === 'w' ? 'ready' : 'auto')),
  'soutiens quand une offensive peut suivre': page((s) => (fam(s) === 'b' ? 'follow' : 'auto')),
  'soutiens à la rupture': page((s) => (fam(s) === 'b' ? 'broken' : 'auto')),
  'soutiens jamais': page((s) => (fam(s) === 'b' ? 'never' : 'auto')),
  'appuis au hasard (1 sur 4)': careless(0.25),
  'appuis au hasard (1 sur 2)': careless(0.5, 11),
};
if (process.argv[1].endsWith('modes.mjs')) {
  const V = VARIANTS[L.arg('variant', 'P1')], seeds = seedsOf(L.arg('seeds', '101..300')), out = {};
  try {
    L.setModel(V.cfg);
    if (L.arg('race')) { const r = JSON.parse(fs.readFileSync(L.arg('race'), 'utf8')); Object.assign(L.AD.AUTO_RACE.norm, r.norm); L.AD.AUTO_RACE.pool = r.pool; Object.assign(L.AD.AUTO_RACE.stage, r.stage); }
    console.log(`${V.about} ; ${seeds.length} parties de la référence`);
    const only = L.arg('only') ? L.arg('only').split(',') : null;
    for (const [name, m] of Object.entries(MODES)) {
      if (only && !only.some((o) => name.includes(o))) continue;
      L.setModel(V.cfg, m ? { player: m } : {});
      const J = judge(['reference'], seeds, { quiet: true }).reference;
      console.log(`  ${name.padEnd(48)} ${J.line.slice(11)}`); out[name] = J;
    }
    if (L.arg('json')) fs.writeFileSync(L.arg('json'), JSON.stringify(out, null, 1));
  } finally { L.setModel(null); await L.server.close(); }
}
