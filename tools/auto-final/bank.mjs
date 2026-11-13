// The workshop's bank of bouts (journal Passe CF1): every bout of a policy's whole games kept as what builds it (Ren's stats, levels, weapon, gear, the rival,
// its stage, round and preparation, the seed), so that a preparation (a kit, a tactic, the gear's effects) or a set of rules is replayed on the same bouts in
// milliseconds. The rival is rebuilt from the race in force (AUTO_RACE) at each replay. The feedback of a whole game (the vigour of a win, a purse that buys
// a piece) is left out: whole games judge in the end (measure.mjs).
import * as L from './lab.mjs';
const { AU, AD, AM, LAB, V2, ST } = L;

/** the bouts (not the challenges) of `policy`'s games on `seeds`, under the current model */
export function captureBank(seeds, policy = 'reference') {
  const P = LAB.POLICIES[policy], out = [];
  const wrap = { name: policy, skill: P.skill, choose: (st) => {
    const a = P.choose(st);
    if (a.type === 'fight') {
      const b = AM.autoBoutOf(st, 'bout'), c = st.competitors[b.foeId], kit = V2.v2KitOf(st), V2G = GEARMOD;
      out.push({
        seed: b.seed, gameSeed: st.seed, day: st.day, stage: b.stage, round: b.round, foeId: b.foeId, kitOf: b.foe.kitId, prep: c?.preparation ?? 20, foeHp: c ? POOL.rivalMods(c).hp : 1,
        ren: { stats: { hp: b.ren.hp / (V2G.v2Mods(st).hp || 1), atk: b.ren.atk, def: b.ren.def, end: b.ren.end, viv: b.ren.viv }, hpShare: V2G.v2Mods(st).hp, apStart: b.ren.apStart, taken: b.ren.taken, effect: V2G.v2Mods(st).effect, weapon: st.v2?.gear?.weapon ?? 'training-sword', gear: structuredClone(st.v2?.gear ?? null), kit: structuredClone(kit) },
      });
    }
    return a;
  } };
  for (const s of seeds) LAB.autoplay(s, wrap, 'Ren', 260, 'v2');
  return out;
}
const GEARMOD = await L.load('/src/simulation/v2gear.ts');
const POOL = await L.load('/src/tournament/pool.ts');

/** Ren of a banked bout, with a preparation on top: `kit` (loadout, levels, order, tactic), `gear` (the pieces worn: their effects; `stats` the points they change) */
export function renOf(e, p = {}) {
  const kit = p.kit ? { ...e.ren.kit, ...p.kit, levels: { ...e.ren.kit.levels, ...(p.kit.levels ?? {}) } } : e.ren.kit;
  const stats = p.stats ? p.stats(e.ren.stats, e) : e.ren.stats;
  const x = AD.autoRen(stats, kit, { weapon: p.weapon ?? e.ren.weapon, hpShare: e.ren.hpShare, apStart: e.ren.apStart, taken: e.ren.taken, effect: e.ren.effect });
  x.gear = p.gear ?? e.ren.gear; x.kitLevels = kit.levels;
  return x;
}
/** the rival of a banked bout at the race in force */
export function foeOf(e) {
  const f = AD.autoFoe(e.foeId, AD.autoRaceSheet(e.foeId, e.stage, e.round, { preparation: e.prep, hp: e.foeHp }));
  f.kitId = e.kitOf ?? e.foeId; return f;
}
/** replay the bank under the current model (setModel) with a preparation `p(e)` (or one for all): the wins by stage and by rival, and the duels' records */
export function replay(bank, p = () => ({}), o = {}) {
  const res = { stage: { 0: [0, 0], 1: [0, 0], 2: [0, 0] }, rival: {}, rows: [] };
  for (const e of bank) {
    if (o.filter && !o.filter(e)) continue;
    const prep = typeof p === 'function' ? p(e) : p, A = renOf(e, prep ?? {}), B = foeOf(e);
    const r = AU.autoDuel(A, B, e.seed, o.log ? { log: true } : {}), w = AU.autoWinner(r) === 0;
    res.stage[e.stage][1]++; if (w) res.stage[e.stage][0]++;
    const k = `${e.foeId}:${e.stage}`; (res.rival[k] ??= [0, 0])[1]++; if (w) res.rival[k][0]++;
    if (o.keep) res.rows.push({ e, r, w });
  }
  return res;
}
export const wr = (x) => (x && x[1] ? x[0] / x[1] : NaN);
