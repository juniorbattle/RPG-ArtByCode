// The balance of the skills and the weapons in the duel played by the computer, against the test of AC-12 (the operator's « Équilibrer avec ce test : chaque
// adversaire a ses réponses, rien ne domine »; SY-06 « Le refaire au premier lot, avec le test de AC-12 »): a coordinate search over the data of the skills
// and the weapons only (the rules decided are kept), on calibration seeds, each stage's table rival by rival (tools/auto-lab.mjs kits --norm=rival). Prints each
// accepted step and the final numbers as --set lines. Node only; nothing in src/ reads it.
//   node tools/auto-balance.mjs [--seeds=1..40] [--sweeps=3] [--stages=0,1,2] [--start=<set lines>]
process.argv.splice(2, 0, 'lib');
const LAB = await import('./auto-lab.mjs');
const { applySets, kitsTableByRival, ac12, KITS, range, server } = LAB;
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const RIVALS = ['vessa', 'tobin', 'cassius', 'orla', 'ilse', 'marek', 'rhosk'], WEAPONS = ['épée', 'lame', 'sabre'];

/** the test's violations at a stage: a rival with fewer than two good answers (within 10 points of its best kit), a kit within 3 points of the best against all, a
 *  weapon the best (within 3 points) against fewer than three rivals */
function violations(T) {
  const A = ac12(T); let v = 0;
  for (const id of RIVALS) v += Math.max(0, 2 - A.good[id].length);
  v += 3 * A.dominates.length;
  for (const w of WEAPONS) { let n = 0; for (const id of RIVALS) { const b = Math.max(...WEAPONS.map((x) => T[x][id])); if (T[w][id] >= b - 0.03) n++; } v += Math.max(0, 3 - n); }
  // a soft term: the kits' averages close together (the spread over 1 point = 100 %)
  const kits = Object.keys(KITS).filter((k) => !WEAPONS.includes(k)), avg = kits.map((k) => RIVALS.reduce((s, id) => s + T[k][id], 0) / RIVALS.length);
  return v + (Math.max(...avg) - Math.min(...avg));
}
const seeds = range(arg('seeds', '1..40')), stages = arg('stages', '0,1,2').split(',').map(Number);
const score = () => stages.reduce((s, st) => s + violations(kitsTableByRival(st, seeds)), 0);

/** the knobs: a path in the tables and its candidate values */
const KNOBS = [
  ['SKILLS.t1.powerK', [0.8, 1, 1.25, 1.5, 1.8]], ['SKILLS.t2.powerK', [0.8, 1, 1.25, 1.5, 1.8]], ['SKILLS.t3.powerK', [0.8, 1, 1.25, 1.5, 1.8]],
  ['SKILLS.t4.powerK', [0.8, 1, 1.25, 1.5, 1.8]], ['SKILLS.k_sunder.powerK', [0.8, 1, 1.25, 1.5, 1.8]], ['SKILLS.k_feint.powerK', [0.8, 1, 1.25, 1.5]],
  ['SKILLS.d1.ward.dmg', [0.3, 0.4, 0.5, 0.6, 0.7]], ['SKILLS.k_iron.ward.dmg', [0.2, 0.3, 0.4, 0.5, 0.6]], ['SKILLS.k_parry.ward.dmg', [0.05, 0.2, 0.4]],
  ['SKILLS.s1.boost.dmg', [1.3, 1.5, 1.8, 2.1]], ['SKILLS.k_cry.boost.dmg', [1.6, 1.9, 2.3, 2.7]], ['SKILLS.k_focus.boost.dmg', [1.2, 1.5, 1.8]],
  ['WEAPONS.training-sword.hits', ['[0.55,0.55]', '[0.65,0.65]', '[0.75,0.75]', '[0.85,0.85]']],
  ['WEAPONS.imported-blade.hits', ['[0.62,0.62]', '[0.7,0.7]', '[0.78,0.78]']],
  ['WEAPONS.duelist-sabre.hits', ['[0.17,0.17,0.17]', '[0.2,0.2,0.2]', '[0.23,0.23,0.23]', '[0.27,0.27,0.27]']],
];
const get = (path) => { const p = path.split('.'), T = { SKILLS: LAB.AD.AUTO_SKILLS, WEAPONS: LAB.AD.AUTO_WEAPONS }; let o = T[p[0]]; for (const k of p.slice(1)) o = o?.[k]; return o; };
try {
  if (arg('start')) applySets(arg('start'));
  let best = score(); console.log(`départ : ${best.toFixed(3)}`);
  const cur = Object.fromEntries(KNOBS.map(([p]) => [p, JSON.stringify(get(p) ?? 1)]));
  for (let sweep = 0; sweep < +arg('sweeps', '3'); sweep++) {
    let moved = false;
    for (const [p, vals] of KNOBS) {
      const keep = cur[p];
      for (const v of vals) {
        const sv = typeof v === 'string' ? v : String(v);
        if (sv === keep) continue;
        applySets(`${p}=${sv}`);
        const s = score();
        if (s < best - 1e-6) { best = s; cur[p] = sv; moved = true; console.log(`  ${p}=${sv} → ${best.toFixed(3)}`); }
        else applySets(`${p}=${cur[p]}`);
      }
      applySets(`${p}=${cur[p]}`);
    }
    console.log(`tour ${sweep + 1} : ${best.toFixed(3)}`);
    if (!moved) break;
  }
  console.log('--set=' + Object.entries(cur).map(([p, v]) => `${p}=${v}`).join(','));
  for (const st of stages) { const T = kitsTableByRival(st, seeds), A = ac12(T); console.log(`étape ${st} : violations ${violations(T).toFixed(3)} ; ${RIVALS.map((id) => `${id} ${A.good[id].join('+')}`).join(' ; ')} ; domine ${A.dominates.join(',') || 'aucun'}`); }
} finally { await server.close(); }
