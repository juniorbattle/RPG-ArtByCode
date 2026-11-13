// The workshop's measures on whole games (journal Passe CF1): a set of rules with its race refitted as AC-16 does it (each rival's pool factor so that the
// reference of day 2 beats it 95 times in 100, the pool's slope given, the bracket's and the final's factors on whole games of the reference for AC-15's semi-final
// and final), then every policy's whole games on held-out seeds: the titles, the stages, the durations, the rhythm, the breaks.
// The laboratory's policies on top of the game's (src/tournament/lab.ts): `adaptive` the reference who also learns and buys skills and, at the match sheet,
// brings the kit and the tactic that answer the rival's style (a table learnt on calibration duels, search.mjs).
import fs from 'node:fs';
import * as L from './lab.mjs';
import * as B from './bank.mjs';
const { AU, AD, AM, LAB, V2, RIVALS, med, mean, pct } = L;

// ------------------------------------------------------------------------------------------------------------------------------- policies
const has = (st, a) => L.ADV.actions(st).some((o) => o.ok && JSON.stringify(o.action) === JSON.stringify(a));
const owned = (st, id) => (V2.v2KitOf(st).levels[id] ?? 0) > 0;
/** the adaptive player: the reference's day, and the skills of `learns` drilled (in place of a drill of the reference) and those of `buys` bought (when the purse
 *  keeps `reserve` after), at the training ground; `name` its label */
export function adaptive({ name = 'adaptive', base = 'reference', learns = [], buys = [], reserve = 15, from = 1 } = {}) {
  const P = LAB.POLICIES[base];
  return {
    name, skill: 0.6,
    choose: (st) => {
      const a = P.choose(st);
      if (st.day < from || st.slot === 'evening') return a;
      // what it wants at the training ground (a skill to learn, then one to buy), and only in place of a drill, a job or a walk (moves take no time: at the
      // training ground it does it at once, so that the reference's walk elsewhere never ping-pongs with this one)
      const there = st.place === 'training' ? st : { ...st, place: 'training' };
      let want = null;
      for (const k of learns) if (!want && !owned(st, k)) { const d = { type: 'drillSkill', skill: k }; if (has(there, d)) want = d; }
      for (const k of buys) if (!want && !owned(st, k)) { const b = { type: 'buySkill', skill: k }; if (has(there, b) && st.player.coins >= (SKB.SKILL_BOOK[k]?.price ?? 45) + reserve) want = b; }
      if (!want || !['drillSkill', 'work', 'move'].includes(a.type)) return a;
      if (st.place === 'training') return want;
      return has(st, { type: 'move', to: 'training' }) ? { type: 'move', to: 'training' } : a;
    },
  };
}
const SKB = await L.load('/src/combat/skillbook.ts');
export const policyOf = (p) => (typeof p === 'string' ? LAB.POLICIES[p] ?? null : p);

// ------------------------------------------------------------------------------------------------------------------------------- the race
/** each rival's pool factor: the reference's day-2 Rens (a bank) beat it `t0` of the time */
export function fitPool(bank2, t0 = 0.95) {
  const norm = {};
  for (const id of RIVALS) {
    let lo = 0.3, hi = 8;
    for (let i = 0; i < 13; i++) {
      const m = (lo + hi) / 2; AD.AUTO_RACE.norm[id] = m;
      let w = 0; for (const e of bank2) { const r = AU.autoDuel(B.renOf(e), B.foeOf({ ...e, foeId: id, kitOf: id, round: 0, stage: 0 }), e.seed); if (AU.autoWinner(r) === 0) w++; }
      if (w / bank2.length > t0) lo = m; else hi = m;
    }
    norm[id] = AD.AUTO_RACE.norm[id] = +((lo + hi) / 2).toFixed(3);
  }
  return norm;
}
/** the race of a set of rules (the current model): the pool factors on the day-2 bank, `pool` the slope, the stages' factors by bisection on whole games */
export function fitRace({ calSeeds, pool = [1, 1.075, 1.15], targets = [0.65, 0.5], policy = 'reference', steps = 8, quiet = false, kit = null }) {
  AD.AUTO_RACE.pool = [...pool];
  const bank = B.captureBank(calSeeds.slice(0, 120), typeof policy === 'string' ? policy : 'reference');
  const bank2 = bank.filter((e) => e.day === 2);
  const norm = fitPool(bank2);
  const P = policyOf(policy);
  const bis = (s, key, t, lo, hi) => { for (let i = 0; i < steps; i++) { const m = (lo + hi) / 2; AD.AUTO_RACE.stage[s] = m; const G = L.gamesOf(P, calSeeds); if (L.rate(G, key) > t) lo = m; else hi = m; if (!quiet) process.stderr.write(`  étape ${s} ×${m.toFixed(3)} : ${(100 * L.rate(G, key)).toFixed(0)} %\n`); } AD.AUTO_RACE.stage[s] = +((lo + hi) / 2).toFixed(3); };
  bis(1, 'semi', targets[0], 0.7, 3.2); bis(2, 'final', targets[1], 0.7, 4.5);
  return L.raceNow();
}

// ------------------------------------------------------------------------------------------------------------------------------- the judgement
/** the rhythm of a whole game's bouts: blows a minute, the silences, the blows to a break (each fighter's, from the start or its last break) */
export function rhythmOf(bouts) {
  const bpm = [], quiet = [], toBreak = { ren: [], foe: [] }, breaks = [];
  for (const b of bouts) {
    if (!b.log) continue;
    const blows = b.log.filter((e) => e.ev === 'hit' || e.ev === 'guarded' || e.ev === 'dodged');
    bpm.push((60 * blows.length) / b.t);
    let q = 0, p = 0; for (const e of blows) { if (e.t - p > 3) q += e.t - p; p = e.t; } quiet.push(q / b.t);
    const cnt = { ren: 0, foe: 0 }; let nb = 0;
    for (const e of b.log) { if (e.ev === 'hit' || e.ev === 'guarded') cnt[e.who === 'ren' ? 'foe' : 'ren']++; if (e.ev === 'break') { const k = e.who === 'ren' ? 'ren' : 'foe'; toBreak[k].push(cnt[k]); cnt[k] = 0; nb++; } }
    breaks.push(nb);
  }
  return { bpm: med(bpm), quiet: mean(quiet), toBreakRen: med(toBreak.ren), toBreakFoe: med(toBreak.foe), breaks: mean(breaks) };
}
/** every policy's whole games on `seeds` under the current model and race */
export function judge(policies, seeds, o = {}) {
  const out = {};
  for (const p of policies) {
    const P = policyOf(p), G = L.gamesOf(P, seeds, { log: !!o.rhythm && P.name === (o.rhythmOf ?? 'reference') });
    out[P.name] = { ...L.summary(G), line: L.gamesLine(G) };
    if (o.rhythm && P.name === (o.rhythmOf ?? 'reference')) out[P.name].rhythm = rhythmOf(G.bouts.filter((b) => b.kind === 'bout'));
    if (!o.quiet) console.log('  ' + out[P.name].line + (out[P.name].rhythm ? `\n             rythme ${out[P.name].rhythm.bpm.toFixed(1)} coups/min, silences > 3 s ${(100 * out[P.name].rhythm.quiet).toFixed(0)} %, rupture en ${out[P.name].rhythm.toBreakRen} coups (Ren) / ${out[P.name].rhythm.toBreakFoe} (rivaux), ${out[P.name].rhythm.breaks.toFixed(2)} ruptures par combat` : ''));
  }
  return out;
}
export const seedsOf = (s) => String(s).split(',').flatMap((p) => L.range(p));
