// The workshop's diagnostic of today's duel (journal Passe CF1): whole games of every policy (titles, stages), what decides the reference's bouts (the damage
// by source, the guard, the dodge, the AP lost at the cap, the boosts' and wards' time), and the weight of each layer of the preparation (the reference's own
// bouts replayed with one layer taken off: the gear's points, the training, the skills' levels, the vigour).
//   node tools/auto-final/diag.mjs [--seeds=101..300] [--json=f]
import fs from 'node:fs';
import * as L from './lab.mjs';
const { AU, AD, AM, GE, ST, RIVALS, range, med, mean, pct } = L;
const seeds = range(L.arg('seeds', '101..300')), out = {};
try {
  L.setModel(L.GAME);
  // 1. the policies
  console.log(`1. les politiques (${seeds.length} parties, graines ${seeds[0]}..${seeds[seeds.length - 1]})`);
  out.policies = {};
  for (const pn of ['reference', 'planner', 'curious', 'diligent', 'idle']) {
    const G = L.gamesOf(pn, seeds, { log: pn === 'reference' });
    console.log('  ' + L.gamesLine(G)); out.policies[pn] = L.summary(G);
    if (pn !== 'reference') continue;
    // 2. what decides the reference's bouts
    const by = { 0: [], 1: [], 2: [] };
    for (const b of G.bouts.filter((x) => x.kind === 'bout')) by[b.stage].push(b);
    console.log('2. ce qui décide les combats de la référence (par étape : poule, tableau, finale)');
    out.decide = {};
    for (const [s, B] of Object.entries(by)) {
      const acc = { ren: { light: 0, heavy: 0, skill: 0, broken: 0, guardedDmg: 0, all: 0 }, foe: { light: 0, heavy: 0, skill: 0, broken: 0, guardedDmg: 0, all: 0 }, apCap: [], boostUp: [], wardUp: [], skills: [], heavies: [], foeSkills: [], guardRate: [], dodgeRate: [], bigGuarded: [], bigExposed: [] };
      for (const b of B) {
        const log = b.log, T = b.t;
        let capT = 0, lastT = 0, lastAp = 0;
        const boostEnd = { ren: 0, foe: 0 }; let boostT = 0, wardT = 0;
        let bigN = 0, bigG = 0, bigX = 0;
        for (const e of log) {
          const side = e.who === 'ren' ? 'ren' : 'foe';
          if (e.s) { if (lastAp >= 5) capT += e.t - lastT; lastT = e.t; lastAp = e.s[0]; }
          if (e.ev === 'hit' || e.ev === 'guarded') {
            const kind = e.act === 'light' || e.act === 'm_light' ? 'light' : e.act === 'heavy' || e.act === 'm_heavy' ? 'heavy' : 'skill';
            acc[side][kind] += e.dmg; acc[side].all += e.dmg; if (e.ev === 'guarded') acc[side].guardedDmg += e.dmg;
          }
          if (side === 'ren' && (e.ev === 'hit' || e.ev === 'guarded' || e.ev === 'dodged') && e.hit === 1 && e.act !== 'light') { bigN++; if (e.ev === 'guarded') bigG++; }
        }
        // the boosts' and wards' share of the bout (Ren), from their events and their lengths
        const ren = b.n[0], foe = b.n[1];
        acc.apCap.push(capT / T);
        acc.skills.push(ren.skills); acc.heavies.push(ren.heavies); acc.foeSkills.push(foe.skills);
        const reacts = foe.hit + foe.guarded + foe.dodged; acc.guardRate.push(reacts ? foe.guarded / (foe.hit + foe.guarded + foe.dodged) : 0); acc.dodgeRate.push(reacts ? foe.dodged / reacts : 0);
        if (bigN) acc.bigGuarded.push(bigG / bigN);
        // broken damage
        acc.ren.broken += ren.dmgBroken; acc.foe.broken += foe.dmgBroken;
      }
      const sh = (o, k) => pct(o[k], o.all);
      const row = { bouts: B.length, ren: { light: sh(acc.ren, 'light'), heavy: sh(acc.ren, 'heavy'), skill: sh(acc.ren, 'skill'), broken: sh(acc.ren, 'broken'), guarded: sh(acc.ren, 'guardedDmg') }, foe: { light: sh(acc.foe, 'light'), heavy: sh(acc.foe, 'heavy'), skill: sh(acc.foe, 'skill'), broken: sh(acc.foe, 'broken') }, apCap: +(100 * mean(acc.apCap)).toFixed(0), skills: med(acc.skills), heavies: med(acc.heavies), foeSkills: med(acc.foeSkills), foeGuard: +(100 * mean(acc.guardRate)).toFixed(0), foeDodge: +(100 * mean(acc.dodgeRate)).toFixed(0), bigGuarded: +(100 * mean(acc.bigGuarded)).toFixed(0) };
      out.decide[s] = row;
      console.log(`  étape ${s} (${B.length} combats) : dégâts de Ren — attaque simple ${row.ren.light} %, coup puissant ${row.ren.heavy} %, compétences ${row.ren.skill} % ; pendant une rupture ${row.ren.broken} % ; gardés ${row.ren.guarded} %`);
      console.log(`             dégâts du rival — attaque simple ${row.foe.light} %, coup puissant ${row.foe.heavy} %, compétences ${row.foe.skill} %, pendant une rupture ${row.foe.broken} %`);
      console.log(`             Ren : ${row.skills} compétences et ${row.heavies} coups puissants par combat (médianes) ; ${row.apCap} % du combat aux PA pleins ; le rival garde ${row.foeGuard} % et esquive ${row.foeDodge} % des coups de Ren ; ${row.bigGuarded} % des grosses actions de Ren gardées`);
    }
    // 3. the layers of the preparation: the reference's own bouts replayed with one layer off
    console.log('3. le poids de chaque couche de préparation (les combats de la référence rejoués, une couche retirée)');
    const bouts = [];
    const P = L.LAB.POLICIES.reference;
    const wrap = { name: 'ref', skill: 0.6, choose: (st) => { const a = P.choose(st); if (a.type === 'fight') { const b = AM.autoBoutOf(st, 'bout'); bouts.push({ b, worn: GE.wornFx ? null : null, st: structuredClone(st) }); } return a; } };
    for (const s of seeds) L.LAB.autoplay(s, wrap, 'Ren', 260, 'v2');
    const V2G = await L.load('/src/simulation/v2gear.ts');
    const layers = {
      'tel quel': (st, b) => b.ren,
      'sans les points de l\'équipement': (st, b) => { const fx = V2G.wornFx(st); return { ...b.ren, hp: b.ren.hp - fx.hp, atk: b.ren.atk - fx.atk, def: b.ren.def - fx.def, end: b.ren.end - fx.end, viv: b.ren.viv - fx.viv }; },
      'sans l\'entraînement': (st, b) => { const r = { ...b.ren }; for (const k of V2G.trainedStats(st)) r[k] -= ST.trainGain(k); return r; },
      'compétences au niveau 1': (st, b) => AD.autoRen({ hp: b.ren.hp, atk: b.ren.atk, def: b.ren.def, end: b.ren.end, viv: b.ren.viv }, { loadout: V2G.gearOf ? L.V2.v2KitOf(st).loadout : [], levels: {} }, { weapon: st.v2?.gear?.weapon, apStart: b.ren.apStart }),
      'sans la vigueur des victoires': (st, b) => ({ ...b.ren, hp: b.ren.hp - ST.VIGOUR_HP * (st.v2?.wins ?? 0) }),
      'rien (Ren de départ)': (st, b) => AD.autoRen(ST.REN_BASE, { loadout: ['t1', 't4', 'd1', 's1'], levels: {} }, {}),
    };
    out.layers = {};
    for (const [name, f] of Object.entries(layers)) {
      const w = { 0: [0, 0], 1: [0, 0], 2: [0, 0] };
      for (const { b, st } of bouts) { const r = AU.autoDuel(f(st, b), b.foe, b.seed); w[b.stage][1]++; if (AU.autoWinner(r) === 0) w[b.stage][0]++; }
      out.layers[name] = Object.fromEntries(Object.entries(w).map(([k, v]) => [k, v[0] / v[1]]));
      console.log(`  ${name.padEnd(34)} poule ${pct(...w[0])} %  tableau ${pct(...w[1])} %  finale ${pct(...w[2])} %`);
    }
  }
  if (L.arg('json')) fs.writeFileSync(L.arg('json'), JSON.stringify(out, null, 1));
} finally { L.setModel(null); await L.server.close(); }
