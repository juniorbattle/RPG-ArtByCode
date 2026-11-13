// The second combat workshop's laboratory: the game's duel played by the computer, measured with the same rules for Ren and the rivals, and with the skills
// decided automatically, by gambits or by hand. Node only; nothing in src/ reads it. The game is loaded through Vite's SSR loader with ONE transform of the
// laboratory: `autoDuel` (src/combat/auto.ts) asks `globalThis.__symDuel` first, so whole games of the TournamentLab (the player's bouts, his challenges and the
// off-screen bouts) play the laboratory's duel (sim.mjs); without the hook, the game's own.
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';
import { makeSim, h5 } from './sim.mjs';

export const ROOT = path.resolve(import.meta.dirname, '../..');
const hook = {
  name: 'sym-hook', enforce: 'post',
  transform(code, id) {
    if (!id.replace(/\\/g, '/').endsWith('/src/combat/auto.ts')) return null;
    if (!code.includes('export function autoDuel(')) throw new Error('autoDuel not found');
    return code.replace('export function autoDuel(', 'export function autoDuel(...__a) { const h = globalThis.__symDuel; return h ? h(__a, autoDuelGame) : autoDuelGame(...__a); }\nfunction autoDuelGame(');
  },
};
export const server = await createServer({ root: ROOT, configFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-test', plugins: [hook], server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true } });
const load = (f) => server.ssrLoadModule(f);
export const AU = await load('/src/combat/auto.ts'), AD = await load('/src/combat/autoData.ts'), AM = await load('/src/combat/autoMatch.ts');
export const LAB = await load('/src/tournament/lab.ts'), ST = await load('/src/combat/stats.ts'), SK = await load('/src/combat/skills.ts'), V2 = await load('/src/simulation/v2.ts');
const RNG = await load('/src/core/rng.ts'), GE = await load('/src/simulation/gear.ts');
export const RIVALS = Object.keys(ST.RIVAL_SHEETS);
export const SIM = makeSim({ Rng: RNG.Rng, hitFactor: ST.hitFactor, AUTO_RULES: AU.AUTO_RULES, autoFormsOf: AU.autoFormsOf });

// ------------------------------------------------------------------------------------------------------------------------------- helpers
export const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
export const range = (s) => { const m = String(s).match(/^(\d+)\.\.(\d+)$/); return m ? Array.from({ length: +m[2] - +m[1] + 1 }, (_, i) => +m[1] + i) : String(s).split(',').map(Number); };
export const q = (a, p) => { if (!a.length) return NaN; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
export const med = (a) => q(a, 0.5);
export const pct = (w, n) => (n ? Math.round((100 * w) / n) : NaN);
const offensive = (a) => !a.ward && !a.boost && a.kind !== 'light' && a.base !== 'heavy';
const active = (e, t) => !!e && e.until > t;

// ------------------------------------------------------------------------------------------------------------------------------- the rivals' kits
const KIT_OF = Object.fromEntries(Object.entries(AD.AUTO_FOES).map(([k, K]) => [K.skills[0].id, k]));
/** the kit a rival fighter fights with (its first skill of its own names it) */
export const kitOf = (x) => KIT_OF[x.skills.find((s) => !s.heavy)?.id] ?? 'marek';
/** the rivals' weapons in the symmetric model: their combo's blows made their light attack's enchaînement, at the training sword's total (2 × 0.55) */
export const SYM_WEAPONS = Object.fromEntries(Object.entries(AD.AUTO_FOES).map(([k, K]) => [k, { hits: Array(K.combo.n).fill(+(1.1 / K.combo.n).toFixed(4)), gap: K.combo.gap }]));

/** the default configuration: the game's own duel (the inventory switches one thing at a time from it) */
export const GAME = { streams: 'one', ap: 'none', combo: 'game', cadence: 0.5, table: 'game', cooldown: 'game', traits: 'game', ai: 'game', heavy: 'skill', renHeavy: 'skill', foeAp: 2, heavyAp: 1, renAi: 'auto' };

/** a rival's actions under a configuration: today's (autoFoeActions, `table: 'game'` at the cadence) or Ren's tables (`table: 'ren'`: the light 1.2 s, the heavy
 *  Ren's heavy attack at level 1, a skill's power by its charge as Ren's, DB5-1), the combo or the weapon, the AP, the cooldowns */
export function foeActions(kit, cfg) {
  const K = AD.AUTO_FOES[kit], c = cfg.cadence, P = ST.POWER, n = K.combo.n, GS = 0.25;
  let light, combo = null, heavy;
  const skills = [];
  if (cfg.table === 'game') {
    const cL = K.light * c, pl = P.foeLight * c;
    light = { id: 'm_light', kind: 'light', charge: cL, power: pl, gauge: pl * 0.1, ap: 0 };
    const cp = pl * 0.75 * n;
    combo = { id: 'm_combo', kind: 'light', charge: +(cL * 1.4).toFixed(2), power: cp, gauge: cp * 0.1, ap: 0, hits: Array(n).fill(1 / n), gap: K.combo.gap };
    heavy = { id: 'm_heavy', kind: 'skill', heavy: true, charge: K.light * c * 1.6, power: P.foeHeavy * c, gauge: P.foeHeavy * c * GS, ap: 0 };
    for (const s of K.skills) {
      const a = { id: s.id, kind: 'skill', family: s.family, charge: s.charge * c, ap: 0, cooldown: s.cooldown, weight: s.weight };
      if (s.ward) a.ward = { ...s.ward }; else if (s.boost) a.boost = { ...s.boost };
      else { a.power = P.foeSkill * (s.charge / 3.5) * c; a.gauge = a.power * GS * (s.gaugeK ?? 1); }
      skills.push(a);
    }
  } else {
    // Ren's tables (c scales every charge and power, as the cadence does: 1 = the catalogue's)
    light = { id: 'm_light', kind: 'light', charge: AD.AUTO_LIGHT.charge * c, power: P.light * c, gauge: P.light * 0.1 * c, ap: 0 };
    const hp = AD.autoPower('heavy', 1);
    heavy = { id: 'm_heavy', kind: 'skill', heavy: true, charge: AD.autoCharge('heavy', 1) * c, power: hp * c, gauge: hp * GS * c, ap: 0 };
    for (const s of K.skills) {
      const a = { id: s.id, kind: 'skill', family: s.family, charge: s.charge * c, ap: 0, cooldown: s.cooldown, weight: s.weight };
      if (s.ward) a.ward = { ...s.ward }; else if (s.boost) a.boost = { ...s.boost };
      else { a.power = ST.POWER.thrust * (s.charge / AD.autoCharge('t4', 1)) * c; a.gauge = a.power * GS * (s.gaugeK ?? 1); }
      skills.push(a);
    }
    if (cfg.combo === 'game') { const cp = light.power * 0.75 * n; combo = { id: 'm_combo', kind: 'light', charge: +(light.charge * 1.4).toFixed(2), power: cp, gauge: cp * 0.1, ap: 0, hits: Array(n).fill(1 / n), gap: K.combo.gap }; }
  }
  if (cfg.combo === 'weapon') { const W = SYM_WEAPONS[kit]; light = { ...light, hits: W.hits, gap: W.gap }; combo = null; }
  if (cfg.ap === 'pay') { heavy.ap = cfg.heavyAp; for (const s of skills) s.ap = cfg.foeAp; }
  if (cfg.cooldown === 'db53') { heavy.cooldown = AD.AUTO_COOLDOWN * heavy.charge; for (const s of skills) s.cooldown = AD.AUTO_COOLDOWN * s.charge; }
  if (cfg.heavy === 'base') { heavy = { ...heavy, base: 'heavy', ap: 0, cooldown: cfg.heavyCd ? AD.AUTO_COOLDOWN * heavy.charge : 0 }; return { light, combo, heavy, skills, ai: { ...K.ai } }; }
  return { light, combo, heavy: null, skills: [heavy, ...skills], ai: { ...K.ai } };
}

/** Ren's heavy attack as a base action (the symmetric model): his heavy attack at its level, no AP, no cooldown */
function renHeavy(x, cd = false) {
  const brought = x.skills.find((s) => s.id === 'heavy');
  const a = brought ? { ...brought } : AD.autoSkill('heavy', 1);
  return { ...a, base: 'heavy', ap: 0, cooldown: cd ? AD.AUTO_COOLDOWN * AD.autoCharge('heavy', 1) : 0 };
}

/** the game's fighters (autoRen / autoFoe, as a bout or an off-screen bout builds them) under a configuration */
export function convert(x, cfg) {
  if (x.brain === 'player') {
    const y = { ...x };
    if (cfg.renHeavy === 'base') { y.heavy = renHeavy(x, !!cfg.heavyCd); y.skills = x.skills.filter((s) => s.id !== 'heavy'); }
    // the common cadence (the symmetric model: Ren's tables for everyone, every charge and power × c, the cooldowns with the charges; the effects' lengths kept)
    if (cfg.table === 'ren' && cfg.cadence !== 1) {
      const c = cfg.cadence, sc = (a) => (a ? { ...a, charge: a.charge * c, ...(a.power != null ? { power: a.power * c, gauge: a.gauge * c } : {}), ...(a.cooldown ? { cooldown: a.cooldown * c } : {}) } : a);
      y.light = sc(y.light); y.heavy = sc(y.heavy); y.skills = y.skills.map(sc);
    }
    return y;
  }
  const kit = kitOf(x), A = foeActions(kit, cfg), y = { ...x, ...A };
  if (cfg.table === 'ren') y.tempo = 10;
  if (cfg.traits === 'none') { y.dodgeBonus = 0; y.guardBonus = 0; }
  if (cfg.ai === 'auto') y.skills = symOrder(y.skills);
  return y;
}
/** a fighter's order for the automatic (Ren's default rule, autoDefaultOrder): the wards, the boosts, then the offensive skills from the strongest */
export function symOrder(skills) {
  const off = skills.filter((s) => !s.ward && !s.boost).map((s, i) => ({ s, i })).sort((a, b) => (b.s.power ?? 0) - (a.s.power ?? 0) || a.i - b.i).map((z) => z.s);
  return [...skills.filter((s) => s.ward), ...skills.filter((s) => s.boost), ...off];
}

// ------------------------------------------------------------------------------------------------------------------------------- the deciders
/** the symmetric automatic: the game's automatic for the skills (AU.playerDecider, in the fighter's order), then the base attacks: the heavy blow when the
 *  opponent cannot defend when it lands (broken for at least its charge, or charging an action that exposes it past that time) or when the AP are full and no
 *  skill can go; else the light attack */
export function heavyWhen(v, x) {
  const { me, foe, t } = v; if (!x.heavy || !v.usable(x.heavy)) return false;
  const tc = v.chargeOf(me, x.heavy), land = t + tc;
  if (foe.broken && foe.stunEnd - t >= tc) return true;
  if (foe.act && foe.act.kind !== 'light' && foe.at >= land) return true;
  return me.ap >= v.rules.ap.max;
}
export const symAuto = (v, x) => { const d = AU.playerDecider(v, x); if (d !== x.light) return d; return heavyWhen(v, x) ? x.heavy : x.light; };
/** today's automatic with a base heavy attack (light otherwise) */
export const deciderOf = (x, cfg) => {
  if (x.brain === 'player') return cfg.renDecider ?? (cfg.renHeavy === 'base' ? symAuto : AU.playerDecider);
  if (cfg.ai === 'auto') return cfg.heavy === 'base' ? symAuto : AU.playerDecider;
  return cfg.heavy === 'base' ? ((v, y) => { const d = AU.rivalDecider(v, y); return d === y.light && heavyWhen(v, y) ? y.heavy : d; }) : AU.rivalDecider;
};

// ------------------------------------------------------------------------------------------------------------------------------- the hook
let CFG = null;
export const setModel = (cfg) => { CFG = cfg; globalThis.__symDuel = cfg ? (args, game) => run(args, game, cfg) : undefined; };
/** a duel of the game under the laboratory's configuration ('game': the game's own duel) */
export function run([A, B, seed, o = {}], game, cfg) {
  if (cfg === 'game') return game(A, B, seed, o);
  const X = convert(A, cfg), Y = convert(B, cfg);
  if (cfg.renMode && A.brain === 'player') return cfg.renMode(X, Y, seed, deciderOf(A, cfg), deciderOf(B, cfg), { log: o.log || cfg.log });
  return SIM.duel(X, Y, seed, { deciders: [deciderOf(A, cfg), deciderOf(B, cfg)], streams: cfg.streams, rules: o.rules, log: o.log || cfg.log, trace: o.trace });
}

// ------------------------------------------------------------------------------------------------------------------------------- the rhythm
const BIG = (e) => !['light', 'm_light', 'm_combo'].includes(e.act) && (e.hit ?? 1) === 1;
export function rhythmOf(r) {
  const blows = r.log.filter((e) => e.ev === 'hit' || e.ev === 'guarded' || e.ev === 'dodged'), ts = blows.map((e) => e.t);
  let longest = 0, quiet = 0;
  for (let i = 0, p = 0; i < ts.length; p = ts[i], i++) { const d = ts[i] - p; longest = Math.max(longest, d); if (d > 3) quiet += d; }
  const big = blows.filter(BIG).map((e) => e.t), bigGaps = []; for (let i = 1; i < big.length; i++) bigGaps.push(big[i] - big[i - 1]);
  return { t: r.t, perMin: (ts.length / r.t) * 60, longest, quiet: quiet / r.t, bigGaps };
}
export const rhythmLine = (R) => `${R.length} duels, ${med(R.map((x) => x.perMin)).toFixed(0)} coups/min, plus long silence méd. ${med(R.map((x) => x.longest)).toFixed(1)} s, silences > 3 s ${(100 * med(R.map((x) => x.quiet))).toFixed(1)} %, entre deux grosses actions ${med(R.flatMap((x) => x.bigGaps)).toFixed(1)} s`;

// ------------------------------------------------------------------------------------------------------------------------------- whole games
/** whole games of a policy under the current model: the stages won, the titles, the player's bouts (their length, skills, rhythm) */
export function gamesOf(pn, seeds, { rhythm = false } = {}) {
  const P = LAB.POLICIES[pn]; if (!P) throw new Error(`no policy ${pn}`);
  const bouts = [];
  const keep = globalThis.__symDuel;
  if (rhythm && keep) globalThis.__symDuel = (args, game) => { const r = keep([args[0], args[1], args[2], { ...(args[3] ?? {}), log: true }], game); if (args[0].brain === 'player') bouts.push({ t: r.t, n: r.n, won: (r.winner ?? 0) === 0, rh: rhythmOf(r), turns: r.leadChanges }); return r; };
  let crowns = 0; const stageWins = {}, skipped = [];
  try {
    for (const s of seeds) {
      // a policy that chooses an action the game refuses (the curious player in a parade's street, under other bout results) is skipped and counted
      let st; try { st = LAB.autoplay(s, P, 'Ren', 260, 'v2').state; } catch (e) { if (!/refused action/.test(String(e))) throw e; skipped.push(s); continue; }
      const mine = st.tournament.matches.filter((m) => m.a === 'player' || m.b === 'player');
      if (st.flags.champion === 'player') crowns++;
      for (const m of mine) { const k = m.stage ?? `pool-j${m.day}`; (stageWins[k] ??= { w: 0, n: 0 }).n++; if (m.winner === 'player') stageWins[k].w++; }
    }
  } finally { globalThis.__symDuel = keep; }
  return { pn, n: seeds.length - skipped.length, crowns, stageWins, bouts, skipped };
}
export const rate = (G, keys) => { let w = 0, n = 0; for (const k of keys) { const v = G.stageWins[k]; if (v) { w += v.w; n += v.n; } } return n ? w / n : NaN; };
export function gamesLine(G) {
  const r = (k) => pct(G.stageWins[k]?.w ?? 0, G.stageWins[k]?.n ?? 0);
  return `${G.pn.padEnd(9)} titres ${pct(G.crowns, G.n)} %  j2 ${r('pool-j2')} j4 ${r('pool-j4')} j5 ${r('pool-j5')}  demi ${r('semi')}  3e ${r('third')}  finale ${r('final')} % (${G.stageWins.final?.n ?? 0})${G.skipped?.length ? `  [${G.skipped.length} partie(s) sautée(s) : action refusée]` : ''}`;
}

// ------------------------------------------------------------------------------------------------------------------------------- isolated duels
/** the isolated duels' reference (tools/auto-lab.mjs REF: the reference player's median Ren by day) */
export const REF = {
  2: { hp: 300, atk: 17, def: 11, end: 10, viv: 10, weapon: 'imported-blade', t1: 1, t4: 1, prep: 37 },
  4: { hp: 324, atk: 17, def: 17, end: 10, viv: 9, weapon: 'imported-blade', t1: 2, t4: 1, prep: 61 },
  5: { hp: 384, atk: 16, def: 16, end: 10, viv: 9, weapon: 'imported-blade', t1: 2, t4: 1, prep: 64 },
  6: { hp: 408, atk: 18, def: 16, end: 10, viv: 9, weapon: 'imported-blade', t1: 2, t4: 1, prep: 85 },
  10: { hp: 432, atk: 22, def: 17, end: 14, viv: 9, weapon: 'imported-blade', t1: 3, t4: 3, prep: 100 },
};
export function weaponSwap(R, weapon) {
  if (!weapon || weapon === R.weapon) return R;
  const fx = (w) => GE.GEAR[w]?.fx ?? {}, a = fx(R.weapon), b = fx(weapon), out = { ...R, weapon };
  for (const key of ['hp', 'atk', 'def', 'end', 'viv']) out[key] = +(R[key] + ((b[key] ?? 0) - (a[key] ?? 0))).toFixed(2);
  return out;
}
/** isolated duels through the hook: a reference Ren of a day against rivals at a stage and round */
export function duelsOf({ day = 4, loadout = ['t1', 't4', 'd1', 's1'], weapon, foes = RIVALS, seeds = range('1..60'), stage, round, levels, order, renDecider, log = false }) {
  const R = weaponSwap(REF[day], weapon), st = stage ?? (day >= 10 ? 2 : day >= 6 ? 1 : 0), rd = round ?? (st === 0 ? AD.autoRound(day) : 0);
  const lv = levels ?? Object.fromEntries([...loadout, 'heavy'].map((id) => [id, id === 't1' ? R.t1 : id === 't4' ? R.t4 : 1]));
  const rows = [], keep = CFG;
  if (renDecider && CFG && CFG !== 'game') setModel({ ...CFG, renDecider });
  try {
    for (const id of foes) {
      const o = { id, w: 0, n: 0, t: [], rh: [], res: [] };
      for (const s of seeds) {
        const A = AD.autoRen(R, { loadout, levels: lv, order }, { weapon: R.weapon }), B = AD.autoFoe(id, AD.autoRaceSheet(id, st, rd, { preparation: R.prep }));
        const r = AU.autoDuel(A, B, 7000 + s * 131 + st * 7 + rd, { log });
        o.n++; if (AU.autoWinner(r) === 0) o.w++; o.t.push(r.t); if (log) o.rh.push(rhythmOf(r)); o.res.push(r);
      }
      rows.push(o);
    }
  } finally { if (renDecider) setModel(keep); }
  return rows;
}

// ------------------------------------------------------------------------------------------------------------------------------- the race
/** each rival's pool factor so the reference of day 2 beats it `t0` of the time (isolated duels), then the bracket's and the final's on whole games of the
 *  reference (calibration seeds) for the semi-final's and the final's targets (AC-15); the pool's rounds as the game's (+15 %, LC1-1) */
export function levelFit(t0, targets, fitSeeds, { keepNorm = false, quiet = false } = {}) {
  if (!keepNorm) for (const id of RIVALS) {
    let lo = 0.2, hi = 5;
    for (let i = 0; i < 13; i++) { const m = (lo + hi) / 2; AD.AUTO_RACE.norm[id] = m; const r = duelsOf({ day: 2, foes: [id], seeds: range('1..60') })[0]; if (r.w / r.n > t0) lo = m; else hi = m; }
    AD.AUTO_RACE.norm[id] = +((lo + hi) / 2).toFixed(3);
  }
  const bis = (s, key, t, lo, hi) => { for (let i = 0; i < 9; i++) { const m = (lo + hi) / 2; AD.AUTO_RACE.stage[s] = m; if (rate(gamesOf('reference', fitSeeds), [key]) > t) lo = m; else hi = m; } AD.AUTO_RACE.stage[s] = +((lo + hi) / 2).toFixed(3); };
  bis(1, 'semi', targets[0], 0.5, 4); bis(2, 'final', targets[1], 0.5, 6);
  const L = { norm: { ...AD.AUTO_RACE.norm }, pool: [...AD.AUTO_RACE.pool], stage: { ...AD.AUTO_RACE.stage } };
  if (!quiet) console.log(`la course : ${JSON.stringify(L)}`);
  return L;
}
export const GAME_RACE = JSON.parse(JSON.stringify({ norm: AD.AUTO_RACE.norm, pool: AD.AUTO_RACE.pool, stage: AD.AUTO_RACE.stage }));
export const setRace = (L) => { Object.assign(AD.AUTO_RACE.norm, L.norm); AD.AUTO_RACE.pool = L.pool ?? AD.AUTO_RACE.pool; Object.assign(AD.AUTO_RACE.stage, L.stage); };
export { h5 };
