// The harmful states (journal Passes GP4-1, GP4-2, briefs/combat-auto.md § 41; the operator's sheet https://claude.ai/artifact/DqsBjqLm1UQG4ChPC2EeRW): the game's states,
// its weapon families and protections (src/combat/autoData.ts) measured on its own duel (tools/auto-lab.mjs as a library), src/lab/states.ts changing the tables for one
// process. Node only. Nothing of the game reads it.
//   node tools/auto-states.mjs ac12 [--stage=0|1|2] [--seeds=1..60] [--base=armed|none] [--rows=a,b]
//       AC-12's test at equal level (every offensive technique at the Flash cut's level, every ultimate at the Thrust's) under the game's states (the rivals' states on
//       their weapon and signature, their resistances; --base=none: no state at all), each rival at its own level (the start kit with the imported blade, no protection,
//       at 85 / 65 / 50 % against it): the weapon families on the blade, with and without the counterpart (STATE_WEAPON_COUNTERPART), the protections (an armour ×0.5, an
//       accessory ×1), the signatures that carry a state, the training sword, the sabre, two calibration rows (±2 Attack); and the candidates of the short sheet (--rows)
//   node tools/auto-states.mjs price [--policy=planner] [--seeds=101..300] [--variants=a,b]
//       the policy's bouts of whole games replayed under each variant (the race in force; « aujourd’hui »: no state, the game before the construction)
//   node tools/auto-states.mjs games [--policies=planner,reference,curious] [--seeds=101..300] [--variant=<name>]
//       whole games under a variant: the stages, the titles, the durations
//   every command: --rules=<json> the states' numbers (over AUTO_RULES.states), --chances=venom:0.12,... the weapon families', --rivalChances=vessa:0.04,... a rival's weapon
import fs from 'node:fs';
process.argv.splice(2, 0, 'lib');
const LAB = await import('./auto-lab.mjs');
const cmd = process.argv[3];
const { AU, AD, range, med, pct, server } = LAB;
const S = await server.ssrLoadModule('/src/lab/states.ts'), GE = await server.ssrLoadModule('/src/simulation/gear.ts');
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const seedList = (s) => String(s).split(',').flatMap((p) => range(p));
const RIVALS = ['vessa', 'tobin', 'cassius', 'orla', 'ilse', 'marek', 'rhosk'];
const STAGE_DAY = { 0: 4, 1: 6, 2: 10 };
const TARGET = { 0: 0.85, 1: 0.65, 2: 0.5 };
const RULES = arg('rules') ? JSON.parse(arg('rules')) : undefined;
for (const kv of (arg('chances') ?? '').split(',').filter(Boolean)) { const [k, v] = kv.split(':'); AD.STATE_WEAPON_FAMILIES[k] = { ...AD.STATE_WEAPON_FAMILIES[k], chance: +v }; }
const RIVAL_CH = Object.fromEntries((arg('rivalChances') ?? '').split(',').filter(Boolean).map((kv) => { const [k, v] = kv.split(':'); return [k, { ...AD.AUTO_STYLES[k].inflict, chance: +v }]; }));
const BLADE = 'imported-blade', CP = AD.STATE_WEAPON_COUNTERPART;
/** the base: the game's states, --rivalChances changing a rival's weapon; --base=none no state at all */
const BASE = arg('base', 'armed') === 'none' ? { none: true } : { rivals: RIVAL_CH };
const W = (fam) => ({ weapon: { id: BLADE, inflict: AD.STATE_WEAPON_FAMILIES[fam] } });
const P = (r) => ({ resist: { id: BLADE, resist: r } });
/** the variants: what Ren carries on top of the base */
export const VARIANTS = {
  'lame': {},
  'lame envenimée': W('venom'), 'lame ardente': W('ember'), 'lame éblouissante': W('glare'), 'lame dentelée': W('serrated'),
  'cuir': P(AD.STATE_ARMOUR_FAMILIES.leather), 'matelassé': P(AD.STATE_ARMOUR_FAMILIES.padded), 'maille': P(AD.STATE_ARMOUR_FAMILIES.mail),
  'bézoard': P(AD.STATE_CHARM_FAMILIES.bezoar), 'salamandre': P(AD.STATE_CHARM_FAMILIES.salamander), 'capuche': P(AD.STATE_CHARM_FAMILIES.hood), 'garrot': P(AD.STATE_CHARM_FAMILIES.tourniquet),
};
for (const kv of (arg('candChances') ?? '').split(',').filter(Boolean)) { const [k, v] = kv.split(':'); AD.STATE_WEAPON_FAMILIES[k] = { ...AD.STATE_WEAPON_FAMILIES[k], chance: +v }; }
const WC = (fam) => ({ weapon: { id: BLADE, inflict: AD.STATE_WEAPON_FAMILIES[fam] } });
/** the two of the note on GE-1 the short sheet's GC-1 and GC-3 adopted, measured before their construction (the weakness, GC-2 « L’écarter », has no hook left; its rows are in the journal): a weapon of each family on the blade, with and without the counterpart */
export const CANDIDATES = {
  'maudite': { variant: WC('hex') }, 'engourdissante': { variant: WC('numb') },
  'maudite −2': { variant: WC('hex'), atk: CP }, 'engourdissante −2': { variant: WC('numb'), atk: CP },
};
const apply = (v) => S.applyStates({ ...BASE, ...v, ...(RULES ? { rules: RULES } : {}) });

/** isolated duels as tools/auto-lab.mjs duelsOf builds them (a reference Ren of the stage's day, the levels by rank, the weapon's effects and Speed), each rival at
 *  its level; `atk` Ren's Attack points added (a counterpart); the wins, the durations and each side's states' damage as a share of the other's health */
function duelSet({ stage, seeds, lv, loadout, weapon = BLADE, foes = RIVALS, atk = 0 }) {
  const R0 = LAB.weaponSwap(LAB.REF[STAGE_DAY[stage]], weapon), R = { ...R0, atk: R0.atk + atk }, race = AD.AUTO_RACE, out = {}, rd = stage === 0 ? AD.autoRound(STAGE_DAY[stage]) : 0;
  const rank = (id) => (AD.AUTO_SKILLS[id]?.family === 'offensive' && id !== 'heavy' ? (AD.skillRank(id) === 'ultimate' ? R.t4 : AD.skillRank(id) === 'technique' ? R.t1 : 1) : 1);
  const levels = Object.fromEntries([...loadout, 'heavy'].map((id) => [id, rank(id)]));
  for (const id of foes) {
    const keep = race.norm[id]; race.norm[id] = keep * (lv?.[id] ?? 1);
    const o = { w: 0, n: 0, t: [], mine: 0, theirs: 0 };
    try {
      for (const s of seeds) {
        const A = AD.autoRen(R, { loadout, levels }, { weapon: R.weapon, gear: [R.weapon], pieceViv: GE.GEAR[R.weapon]?.fx?.viv ?? 0 }), B = AD.autoFoe(id, AD.autoRaceSheet(id, stage, rd, { preparation: R.prep }), { stage });
        const r = AU.autoDuel(A, B, 7000 + s * 131 + stage * 7 + rd, {});
        o.n++; if (AU.autoWinner(r) === 0) o.w++; o.t.push(r.t);
        if (r.sn) { const sum = (x) => Object.values(x.dmg).reduce((a, b) => a + b, 0); o.mine += sum(r.sn[0]) / r.maxHp[1]; o.theirs += sum(r.sn[1]) / r.maxHp[0]; }
      }
    } finally { race.norm[id] = keep; }
    out[id] = o;
  }
  return out;
}
/** each rival's level where the start kit (the imported blade, no protection) wins the stage's target against it, under the base (AC-12's normalisation) */
function levels(stage, seeds) {
  const out = {}, R = AD.AUTO_RACE;
  apply({});
  try {
    for (const id of RIVALS) {
      const keep = R.norm[id]; let lo = 0.3, hi = 3;
      for (let i = 0; i < 12; i++) { const m = (lo + hi) / 2; R.norm[id] = keep * m; const o = duelSet({ stage, seeds, loadout: ['t1', 't4', 'd1', 's1'], foes: [id] })[id]; if (o.w / o.n > TARGET[stage]) lo = m; else hi = m; }
      R.norm[id] = keep; out[id] = (lo + hi) / 2;
    }
  } finally { S.resetStates(); }
  return out;
}
/** a row of the table: each rival at its level, a kit under a variant */
function row(stage, seeds, lv, { loadout = ['t1', 't4', 'd1', 's1'], weapon = BLADE, variant = {}, atk = 0 }) {
  const out = {}, t = []; let mine = 0, theirs = 0, n = 0;
  apply(variant);
  try {
    const D = duelSet({ stage, seeds, lv, loadout, weapon, atk });
    for (const id of RIVALS) { const o = D[id]; out[id] = o.w / o.n; t.push(...o.t); mine += o.mine; theirs += o.theirs; n += o.n; }
  } finally { S.resetStates(); }
  out.t = med(t); out.mine = mine / n; out.theirs = theirs / n;
  return out;
}
const line = (name, r) => `  ${name.padEnd(26)} ${RIVALS.map((id) => String(Math.round(100 * r[id])).padStart(4)).join('')}   moy. ${String(Math.round(100 * RIVALS.reduce((n, id) => n + r[id], 0) / RIVALS.length)).padStart(3)}   ${r.t.toFixed(0)} s   états : Ren ${(100 * r.mine).toFixed(1)} %, rival ${(100 * r.theirs).toFixed(1)} %`;
function ac12test(T, kits) {
  const good = {}, best = {};
  for (const id of RIVALS) { const b = Math.max(...kits.map((k) => T[k][id])); good[id] = kits.filter((k) => T[k][id] >= b - 0.1); best[id] = kits.filter((k) => T[k][id] >= b - 0.03); }
  return { good, dominates: kits.filter((k) => RIVALS.every((id) => best[id].includes(k))) };
}
export const ROWS = {
  'lame (départ)': {}, 'Atq +2 (étalon)': { atk: 2 }, 'Atq −2 (étalon)': { atk: -2 },
  'envenimée': { variant: W('venom') }, 'ardente': { variant: W('ember') }, 'éblouissante': { variant: W('glare') }, 'dentelée': { variant: W('serrated') },
  'envenimée −2': { variant: W('venom'), atk: CP }, 'ardente −2': { variant: W('ember'), atk: CP }, 'éblouissante −2': { variant: W('glare'), atk: CP }, 'dentelée −2': { variant: W('serrated'), atk: CP },
  'cuir': { variant: VARIANTS['cuir'] }, 'matelassé': { variant: VARIANTS['matelassé'] }, 'maille': { variant: VARIANTS['maille'] },
  'bézoard': { variant: VARIANTS['bézoard'] }, 'salamandre': { variant: VARIANTS['salamandre'] }, 'capuche': { variant: VARIANTS['capuche'] }, 'garrot': { variant: VARIANTS['garrot'] },
  'chute (brûle)': { loadout: ['t1', 'm_ironfall', 'd1', 's1'] }, 'frappe (aveugle)': { loadout: ['t1', 'm_smite', 'd1', 's1'] },
  'nord (saigne)': { loadout: ['t1', 't4', 'd1', 'm_cleave'] }, 'riposte (empoisonne)': { loadout: ['m_riposte', 't4', 'd1', 's1'] },
  'épée': { weapon: 'training-sword' }, 'sabre': { weapon: 'duelist-sabre' },
};
/** the choices compared by AC-12's test: the families with their counterpart, the protections, the signatures (the weapons and the calibration apart) */
const CHOICES = ['lame (départ)', 'envenimée −2', 'ardente −2', 'éblouissante −2', 'dentelée −2', 'cuir', 'matelassé', 'maille', 'bézoard', 'salamandre', 'capuche', 'garrot', 'chute (brûle)', 'frappe (aveugle)', 'nord (saigne)', 'riposte (empoisonne)'];
function ac12() {
  const stages = arg('stage') ? [+arg('stage')] : [0, 1, 2], seeds = range(arg('seeds', '1..60')), out = {};
  const rows = arg('rows') ? Object.fromEntries(arg('rows').split(',').map((k) => [k, ROWS[k] ?? CANDIDATES[k]]).filter(([, v]) => v)) : ROWS, choices = Object.keys(rows).filter((k) => CHOICES.includes(k) || CANDIDATES[k]);
  for (const stage of stages) {
    const lv = levels(stage, seeds), T = {};
    console.log(`étape ${stage} (la référence du jour ${STAGE_DAY[stage]}, ${seeds.length} graines, base ${arg('base', 'armed')}, chaque rival à son niveau : le kit de départ à la lame à ${Math.round(100 * TARGET[stage])} %) :\n  ${''.padEnd(26)} ${RIVALS.map((id) => id.slice(0, 4).padStart(4)).join('')}`);
    for (const [name, o] of Object.entries(rows)) { T[name] = row(stage, seeds, lv, o); console.log(line(name, T[name])); }
    const A = ac12test(T, choices.length ? choices : Object.keys(rows));
    console.log(`  bonnes réponses (à 10 points du meilleur) : ${RIVALS.map((id) => `${id} ${A.good[id].join('+')}`).join(' ; ')}`);
    console.log(`  domine partout : ${A.dominates.join(', ') || 'aucun'}`);
    out[stage] = { levels: lv, T, good: A.good, dominates: A.dominates };
  }
  if (arg('json')) fs.writeFileSync(arg('json'), JSON.stringify(out, null, 1));
}
/** a policy's bouts replayed under each variant (the bank of tools/auto-lab.mjs: Ren as the bout built him, his gear's effects with the variant's) */
function price() {
  const pn = arg('policy', 'planner'), bank = LAB.captureBank(seedList(arg('seeds', '101..300')), pn);
  const names = arg('variants') ? arg('variants').split(',') : ['aujourd’hui', ...Object.keys(VARIANTS)];
  // (a candidate's variant: its weapon on the blade, CANDIDATES)
  console.log(`${pn}, ${bank.length} combats : poule / tableau / finale (% gagnés), durée méd. par étape ; base ${arg('base', 'armed')} (« aujourd’hui » : sans aucun état, le jeu d'avant la construction)`);
  for (const name of names) {
    if (name === 'aujourd’hui') S.applyStates({ none: true }); else apply(VARIANTS[name] ?? CANDIDATES[name]?.variant ?? {});
    try {
      const w = [0, 0, 0], n = [0, 0, 0], t = [[], [], []];
      for (const e of bank) {
        const extra = AD.autoGearFx([BLADE]), ren = { ...e.ren, gfx: { ...(e.ren.gfx ?? {}), ...(extra.inflict ? { inflict: extra.inflict } : {}), ...(extra.resist ? { resist: extra.resist } : {}) } };
        const foe = AD.autoFoe(e.foeId, AD.autoRaceSheet(e.foeId, e.stage, e.round, { preparation: e.prep, hp: e.foeHp }), { stage: e.stage, ...(e.plan !== undefined ? { plan: e.plan } : {}) });
        const r = AU.autoDuel(ren, foe, e.seed); n[e.stage]++; if (AU.autoWinner(r) === 0) w[e.stage]++; t[e.stage].push(r.t);
      }
      console.log(`  ${name.padEnd(22)} ${[0, 1, 2].map((s) => String(pct(w[s], n[s])).padStart(4)).join(' /')}   ${[0, 1, 2].map((s) => med(t[s]).toFixed(0)).join(' / ')} s`);
    } finally { S.resetStates(); }
  }
}
function games() {
  const seeds = seedList(arg('seeds', '101..300')), name = arg('variant', 'lame'), v = VARIANTS[name] ?? CANDIDATES[name]?.variant, out = {};
  if (!v && name !== 'aujourd’hui') throw new Error(`no variant ${name}`);
  if (name === 'aujourd’hui') S.applyStates({ none: true }); else apply(v);
  try {
    for (const pn of arg('policies', 'planner,reference,curious').split(',')) {
      const G = LAB.gamesOf(pn, seeds); console.log(LAB.gamesLine(G));
      out[pn] = { titles: G.crowns / G.n, stageWins: G.stageWins, dur: [0, 1, 2].map((s) => med(G.bouts.filter((b) => b.kind === 'bout' && b.stage === s).map((b) => b.t))) };
    }
  } finally { S.resetStates(); }
  if (arg('json')) fs.writeFileSync(arg('json'), JSON.stringify(out, null, 1));
}

try {
  if (cmd === 'ac12') ac12();
  else if (cmd === 'price') price();
  else if (cmd === 'games') games();
  else console.log('commands: ac12 | price | games (see the header)');
} finally { await server.close(); }
