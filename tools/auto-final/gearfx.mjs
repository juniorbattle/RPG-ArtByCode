// The gear's effects against each rival (journal Passe CF1): for each slot (the weapon, the armour, an accessory), every piece worn in place of Ren's own, its stat
// points and, with gearFx, its effect; on the cross duels of a stage (every Ren the reference brings there against each rival at that stage), the rivals at the
// level where the reference's automatic wins AC-15's aims. AC-12's test on the pieces of each slot (each rival two good answers, none at 3 points of the best
// against every rival), with and without the effects.
//   node tools/auto-final/gearfx.mjs --variant=<name> [--stages=1,2] [--cal=1..100]
import fs from 'node:fs';
import * as L from './lab.mjs';
import * as B from './bank.mjs';
import * as S from './search.mjs';
import { VARIANTS } from './variants.mjs';
import { seedsOf } from './measure.mjs';
import { levelBank } from './level.mjs';
const { RIVALS, GE, pct } = L;
export const SLOTS = {
  weapon: ['training-sword', 'imported-blade', 'duelist-sabre'],
  armour: [null, 'padded-jack', 'dock-leathers', 'mail-shirt'],
  accessory: [null, 'iron-ring', 'swift-boots', 'lucky-ribbon', 'fervour-charm', 'docker-wrap'],
};
const VIVK = +(process.argv.find((x) => x.startsWith('--vivk='))?.slice(7) ?? 1);
const fxOf = (id) => (id ? GE.GEAR[id]?.fx ?? {} : {});
/** a banked Ren wearing `piece` in `slot` in place of his own (for an accessory, in place of his first): his points moved, his gear changed */
export function swap(e, slot, piece) {
  const g = structuredClone(e.ren.gear ?? { weapon: 'training-sword', tier: 0, armour: null, acc: [null, null], bag: [] });
  const old = slot === 'weapon' ? g.weapon : slot === 'armour' ? g.armour : g.acc[0];
  if (slot === 'weapon') g.weapon = piece; else if (slot === 'armour') g.armour = piece; else g.acc[0] = piece;
  const a = fxOf(old), b = fxOf(piece), st = { ...e.ren.stats };
  for (const k of ['hp', 'atk', 'def', 'end', 'viv']) st[k] += k === 'viv' ? (b.viv ?? 0) * VIVK - (a.viv ?? 0) : (b[k] ?? 0) - (a[k] ?? 0);
  // the Speed points of every piece × VIVK: Ren's own worn ones too
  if (VIVK !== 1) for (const id of [g.weapon, g.armour, ...g.acc]) if (id !== piece) st.viv -= (1 - VIVK) * (fxOf(id).viv ?? 0);
  const effect = e.ren.effect / (a.effect ?? 1) * (b.effect ?? 1), apStart = Math.max(0, e.ren.apStart - (a.ap ?? 0) + (b.ap ?? 0));
  return { ...e, ren: { ...e.ren, stats: st, gear: g, weapon: g.weapon, effect, apStart } };
}
if (process.argv[1].endsWith('gearfx.mjs')) {
  const V = VARIANTS[L.arg('variant', 'G1')];
  try {
    L.setModel(V.cfg);
    const cal = B.captureBank(seedsOf(L.arg('cal', '1..100')));
    const f = levelBank(cal); console.log(`${V.about} ; niveaux ×${[0, 1, 2].map((s) => f[s].toFixed(2)).join(' / ×')}`);
    for (const stage of L.arg('stages', '1,2').split(',').map(Number)) {
      const cross = S.crossOf(cal, stage, 200);
      for (const [slot, pieces] of Object.entries(SLOTS)) {
        const T = {};
        for (const p of pieces) { T[p ?? '-'] = {}; for (const foe of RIVALS) { const X = cross(foe).map((e) => swap(e, slot, p)); T[p ?? '-'][foe] = S.winsOf(X, { kit: { loadout: X[0].ren.kit.loadout } }); } }
        console.log(`étape ${stage}, ${slot} (Ren porte la pièce à la place de la sienne ; victoires contre ${RIVALS.join(' / ')})`);
        for (const [p, row] of Object.entries(T)) console.log(`  ${p.padEnd(15)} ${RIVALS.map((id) => String(pct(row[id] * 100, 100)).padStart(4)).join('')}   moyenne ${pct(RIVALS.reduce((n, id) => n + row[id], 0) / RIVALS.length * 100, 100)}`);
        const keys = Object.keys(T), good = {}, best = {};
        for (const id of RIVALS) { const b = Math.max(...keys.map((k) => T[k][id])); good[id] = keys.filter((k) => T[k][id] >= b - 0.1); best[id] = keys.filter((k) => T[k][id] >= b - 0.03); }
        const dom = keys.filter((k) => RIVALS.every((id) => best[id].includes(k)));
        console.log(`  meilleures : ${RIVALS.map((id) => `${id} ${best[id].join('+')}`).join(' ; ')} ; domine : ${dom.join(', ') || 'aucune'}`);
      }
    }
  } finally { L.setModel(null); await L.server.close(); }
}
