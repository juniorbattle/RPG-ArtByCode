// The gear's catalogue measured on the game's own duel (the general gameplay audit's chantier 5, GP-18 « Revoir le catalogue »; journal Passe GP5-1; Node only, nothing in
// `src/` reads it). AC-12's test for the pieces: every piece of a slot worn in place of the standard outfit's, against each rival at the stage, the rivals at the level where
// the standard outfit wins the stage's target (85 / 65 / 50 %), each piece's value (win points over the empty slot) and the rivals it answers; no piece may be dominated
// (another piece of its slot at least as good against every rival and no dearer) nor dominate (at least as good as every other piece against every rival).
//   node tools/auto-gear.mjs table [--stage=0,1,2] [--seeds=1..40] [--slot=weapon,armour,accessory] [--catalogue=game|draft]
//   node tools/auto-gear.mjs price  — the coins a win point costs in today's catalogue (the rate the draft's prices are read at)
//   --catalogue=game: the game's own pieces (src/simulation/gear.ts); draft: the game's pieces with `tools/gear-catalogue.mjs` laid over them
import fs from 'node:fs';
process.argv.splice(2, 0, 'lib');
const LAB = await import('./auto-lab.mjs');
const { AU, AD, range, med, pct, server } = LAB;
const GE = await server.ssrLoadModule('/src/simulation/gear.ts');
const ST = await server.ssrLoadModule('/src/combat/stats.ts');
const cmd = process.argv[3];
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const RIVALS = Object.keys(ST.RIVAL_SHEETS);
const STAGE_DAY = { 0: 4, 1: 6, 2: 10 }, TARGET = { 0: 0.85, 1: 0.65, 2: 0.5 };
/** Ren bare, as the reference's whole games make him by stage, the forge's tiers in his Attack (the reference's median stats minus the points of the outfit it wears: the blade, the mail shirt, the wrap, the ring) */
const BARE = { 0: { hp: 369, atk: 14, def: 10, end: 10, viv: 10 }, 1: { hp: 372, atk: 13, def: 10, end: 10, viv: 10 }, 2: { hp: 396, atk: 18, def: 11, end: 10, viv: 10 } };
/** the standard outfit by stage (the planner's, the DB7 curve's): what the rivals are levelled against */
const STANDARD = { 0: ['imported-blade', null, null, null], 1: ['imported-blade', 'mail-shirt', 'docker-wrap', null], 2: ['imported-blade', 'mail-shirt', 'docker-wrap', 'iron-ring'] };
const KIT = ['t1', 't4', 'd1', 's1'];

// the draft catalogue over the game's tables, for this process only
const KEEP = { gear: structuredClone(GE.GEAR), fx: structuredClone(AD.AUTO_GEAR_FX), weapons: structuredClone(AD.AUTO_WEAPONS) };
export let DRAFT = {};
if (arg('catalogue', 'game') === 'draft') {
  DRAFT = (await import('./gear-catalogue.mjs')).CATALOGUE;
  for (const p of Object.values(DRAFT)) {
    const old = GE.GEAR[p.id];
    GE.GEAR[p.id] = { id: p.id, slot: p.slot, price: p.price, fx: p.fx ?? old?.fx ?? {}, ...(p.shop ?? old?.shop ? { shop: p.shop ?? old.shop } : {}), ...(p.from ? { from: p.from } : {}) };
    // the game's effects of the piece are kept; the draft's `gfx` merges over them, a state family on top (a counterpart of Attack is in `fx`)
    if (p.gfx || p.inflict || p.resist) AD.AUTO_GEAR_FX[p.id] = { ...(AD.AUTO_GEAR_FX[p.id] ?? {}), ...(p.gfx ?? {}) };
    if (p.shape) AD.AUTO_WEAPONS[p.id] = p.shape;
    if (p.inflict) AD.AUTO_GEAR_FX[p.id].inflict = AD.STATE_WEAPON_FAMILIES[p.inflict];
    if (p.resist) AD.AUTO_GEAR_FX[p.id].resist = { ...(AD.AUTO_GEAR_FX[p.id].resist ?? {}), ...p.resist };
  }
}
const fxOf = (id) => (id ? GE.GEAR[id]?.fx ?? {} : {});

/** a Ren by stage wearing `outfit` = [weapon, armour, acc0, acc1] (the points of every piece on his bare stats, as v2Stats adds them; the effects through autoGearFx) */
function renOf(stage, outfit) {
  const st = { ...BARE[stage] }, pieces = outfit.filter(Boolean);
  let pv = 0, effect = 1;
  for (const id of pieces) { const f = fxOf(id); for (const k of ['hp', 'atk', 'def', 'end', 'viv']) st[k] += f[k] ?? 0; pv += f.viv ?? 0; if (f.effect) effect *= f.effect; }
  const w = outfit[0] ?? 'training-sword', levels = { t1: [2, 2, 3][stage], t4: [1, 1, 3][stage], d1: 1, s1: 1, heavy: 1 };
  return AD.autoRen(st, { loadout: KIT, levels }, { weapon: w, effect, gear: pieces, pieceViv: pv });
}
const prepOf = { 0: 66, 1: 89, 2: 100 };
function duels(stage, outfit, seeds, foes = RIVALS, norm = {}) {
  const race = AD.AUTO_RACE, out = {};
  for (const id of foes) {
    const keep = race.norm[id]; race.norm[id] = keep * (norm[id] ?? 1);
    let w = 0, n = 0;
    try {
      const rd = stage === 0 ? AD.autoRound(STAGE_DAY[stage]) : 0;
      for (const s of seeds) {
        const A = renOf(stage, outfit), B = AD.autoFoe(id, AD.autoRaceSheet(id, stage, rd, { preparation: prepOf[stage] }), { stage });
        const r = AU.autoDuel(A, B, 7000 + s * 131 + stage * 7 + rd, {}); n++; if (AU.autoWinner(r) === 0) w++;
      }
    } finally { race.norm[id] = keep; }
    out[id] = w / n;
  }
  return out;
}
/** each rival's level where the standard outfit wins the stage's target (AC-12's normalisation) */
function levels(stage, seeds) {
  const out = {};
  for (const id of RIVALS) {
    let lo = 0.3, hi = 3;
    for (let i = 0; i < 11; i++) { const m = (lo + hi) / 2; if (duels(stage, STANDARD[stage], seeds, [id], { [id]: m })[id] > TARGET[stage]) lo = m; else hi = m; }
    out[id] = (lo + hi) / 2;
  }
  return out;
}
const SLOT_OF = { weapon: 0, armour: 1, accessory: 2 };
// an accessory is measured alone (the other place empty: a piece worn twice is no outfit), a weapon or an armour in place of the standard outfit's
const wear = (stage, slot, piece) => { const o = [...STANDARD[stage]]; o[SLOT_OF[slot]] = piece; if (slot === 'accessory') o[3] = null; return o; };
/** the pieces of a slot, the empty one first (the empty slot is the baseline; the weapon's is the training sword) */
function piecesOf(slot) { return [slot === 'weapon' ? 'training-sword' : null, ...Object.values(GE.GEAR).filter((g) => g.slot === slot && g.id !== 'training-sword' && g.id !== 'champion-token').map((g) => g.id)]; }
const mean = (r) => RIVALS.reduce((n, id) => n + r[id], 0) / RIVALS.length;
const line = (name, r, base, price) => `  ${(name ?? '—').padEnd(18)} ${String(price ?? '').padStart(4)}  ${RIVALS.map((id) => String(Math.round(100 * r[id])).padStart(4)).join('')}   moy. ${String(Math.round(100 * mean(r))).padStart(3)}   gain ${(100 * (mean(r) - mean(base))).toFixed(1).padStart(6)}${price ? `   ${((100 * (mean(r) - mean(base))) / price).toFixed(2)}/pièce` : ''}${GE.GEAR[name]?.from ? '   (fin de tournoi, jour ' + GE.GEAR[name].from + ')' : ''}`;

function table() {
  const stages = arg('stage', '0,1,2').split(',').map(Number), seeds = range(arg('seeds', '1..40')), slots = arg('slot', 'weapon,armour,accessory').split(',');
  const out = {};
  for (const stage of stages) {
    const lv = levels(stage, seeds), norm = lv;
    console.log(`\nétape ${stage} (jour ${STAGE_DAY[stage]}, ${seeds.length} graines, rivaux à leur niveau : l'équipement standard ${STANDARD[stage].filter(Boolean).join(' + ') || '—'} à ${Math.round(100 * TARGET[stage])} %) : niveaux ${RIVALS.map((id) => `${id.slice(0, 4)} ${lv[id].toFixed(2)}`).join(' ')}`);
    console.log(`  ${''.padEnd(18)} ${'prix'.padStart(4)}  ${RIVALS.map((id) => id.slice(0, 4).padStart(4)).join('')}`);
    for (const slot of slots) {
      const T = {}, names = piecesOf(slot);
      for (const p of names) T[p ?? '—'] = duels(stage, wear(stage, slot, p), seeds, RIVALS, norm);
      const base = T[names[0] ?? '—'];
      console.log(` ${slot}`);
      for (const p of names) console.log(line(p, T[p ?? '—'], base, p ? GE.GEAR[p]?.price : ''));
      // AC-12's test on the slot: the good answers (within 10 points of the best against a rival), the pieces never one, the dominators and the dominated (price taken in)
      const keys = names.filter((p) => p && !GE.GEAR[p]?.from), ends = names.filter((p) => p && GE.GEAR[p]?.from), good = {}, best = {};
      for (const id of RIVALS) { const b = Math.max(...keys.map((k) => T[k][id])); good[id] = keys.filter((k) => T[k][id] >= b - 0.1); best[id] = keys.filter((k) => T[k][id] >= b - 0.03); }
      const never = keys.filter((k) => RIVALS.every((id) => !good[id].includes(k)));
      const dominator = keys.filter((k) => RIVALS.every((id) => best[id].includes(k)));
      const dominated = keys.filter((k) => keys.some((o) => o !== k && RIVALS.every((id) => T[o][id] >= T[k][id] - 0.02) && (GE.GEAR[o].price <= GE.GEAR[k].price) && RIVALS.some((id) => T[o][id] > T[k][id] + 0.0)));
      console.log(`  réponses (à 10 points du meilleur) : ${RIVALS.map((id) => `${id.slice(0, 4)} ${good[id].join('+')}`).join(' ; ')}`);
      console.log(`  (les pièces de fin de tournoi hors du test : ${ends.join(', ') || 'aucune'})`);
      console.log(`  jamais une bonne réponse : ${never.join(', ') || 'aucune'} ; domine partout : ${dominator.join(', ') || 'aucune'} ; dominée (autre pièce aussi bonne et pas plus chère) : ${dominated.join(', ') || 'aucune'}`);
      out[`${stage}:${slot}`] = { T, good, never, dominator, dominated };
    }
  }
  if (arg('json')) fs.writeFileSync(arg('json'), JSON.stringify(out, null, 1));
}
try {
  if (cmd === 'table') table();
  else console.log('commands: table (see the header)');
} finally { await server.close(); }
