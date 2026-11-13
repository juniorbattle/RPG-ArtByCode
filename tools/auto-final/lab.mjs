// The final combat workshop's laboratory (journal Passe CF1, briefs/combat-auto.md § 31). The game is loaded through Vite's SSR loader with TWO transforms of
// the laboratory, nothing else changed:
//   - `autoDuel` (src/combat/auto.ts) asks `globalThis.__finalDuel` first, so every duel of a whole game (the player's bouts, his challenges, the off-screen
//     bouts) plays the workshop's copy (sim.mjs) under a configuration; without the hook, the game's own;
//   - `autoBoutOf` (src/combat/autoMatch.ts) asks `globalThis.__finalKit` for the kit Ren brings (the match sheet's choices of a laboratory policy that
//     adapts to its rival) and leaves on the fighters what the copy reads (Ren's gear and levels, the rival's kit).
// Node only; nothing in src/ reads it.
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';
import { makeSim, GAME, TERRAIN, CD_CLASS, BOOST_NEXT, STYLE_TACTIC } from './sim.mjs';

export const ROOT = path.resolve(import.meta.dirname, '../..');
const hook = {
  name: 'final-hook', enforce: 'pre',
  transform(code, id) {
    const f = id.replace(/\\/g, '/');
    if (f.endsWith('/src/combat/auto.ts')) {
      if (!code.includes('export function autoDuel(')) throw new Error('autoDuel not found');
      return code.replace('export function autoDuel(', 'export function autoDuel(...__a) { const h = globalThis.__finalDuel; return h ? h(__a, autoDuelGame) : autoDuelGame(...__a); }\nfunction autoDuelGame(');
    }
    if (f.endsWith('/src/combat/autoMatch.ts')) {
      const a = 'const ren = autoRen(autoRenStats(st), v2KitOf(st), {', b = 'return { ren, foe, foeId: o.id,';
      if (!code.includes(a) || !code.includes(b)) throw new Error('autoBoutOf not found');
      return code
        .replace(a, 'const __k = globalThis.__finalKit ? globalThis.__finalKit(st, o.id, v2KitOf(st), g ? g.profile : o.id) : v2KitOf(st);\n  const ren = autoRen(autoRenStats(st), __k, {')
        .replace(b, 'ren.gear = st.v2?.gear; ren.kitLevels = __k.levels; foe.kitId = g ? g.profile : o.id;\n  ' + b);
    }
    return null;
  },
};
export const server = await createServer({ root: ROOT, configFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-test', plugins: [hook], server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true } });
const load = (f) => server.ssrLoadModule(f);
export const AU = await load('/src/combat/auto.ts'), AD = await load('/src/combat/autoData.ts'), AM = await load('/src/combat/autoMatch.ts');
export const LAB = await load('/src/tournament/lab.ts'), ST = await load('/src/combat/stats.ts'), V2 = await load('/src/simulation/v2.ts'), ADV = await load('/src/simulation/advance.ts');
export const GE = await load('/src/simulation/gear.ts'), SK = await load('/src/combat/skills.ts');
export const RIVALS = Object.keys(ST.RIVAL_SHEETS);
export const SIM = makeSim({ hitFactor: ST.hitFactor, AUTO_RULES: AU.AUTO_RULES, autoFormsOf: AU.autoFormsOf, autoDraw: AU.autoDraw });
export { GAME, TERRAIN, CD_CLASS, BOOST_NEXT, STYLE_TACTIC };

// ------------------------------------------------------------------------------------------------------------------------------- helpers
export const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
export const range = (s) => { const m = String(s).match(/^(\d+)\.\.(\d+)$/); return m ? Array.from({ length: +m[2] - +m[1] + 1 }, (_, i) => +m[1] + i) : String(s).split(',').map(Number); };
export const q = (a, p) => { if (!a.length) return NaN; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
export const med = (a) => q(a, 0.5);
export const pct = (w, n) => (n ? Math.round((100 * w) / n) : NaN);
export const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);

/** the rival kit a fighter fights with (its first skill of its own names it; a generic fighter its rival's) */
const KIT_OF = Object.fromEntries(Object.entries(AD.AUTO_FOES).map(([k, K]) => [K.skills[0].id, k]));
export const kitOf = (x) => x.kitId ?? KIT_OF[x.skills.find((s) => s.id.startsWith('m_'))?.id] ?? (x.side === 'ren' && x.id === 'ren' ? null : 'marek');

// ------------------------------------------------------------------------------------------------------------------------------- the model
let MODEL = null;
export const model = () => MODEL;
/** play every duel of the game by the copy under `cfg` (null: the game's own duel) */
export function setModel(cfg, o = {}) {
  MODEL = cfg;
  // o.player: a decider for Ren in his own bouts (a laboratory's way of deciding: a tactic for every rival, random presses)
  globalThis.__finalDuel = cfg ? (a, game) => SIM.duel(prep(a[0], cfg), prep(a[1], cfg), a[2], o.player && a[0].id === 'ren' ? { ...(a[3] ?? {}), deciders: { player: o.player(cfg) } } : a[3] ?? {}, cfg) : undefined;
}
/** a fighter under a configuration: its actions re-tagged (terrain, parry, next), its cooldowns by `cd`, a rival's tactic by its style; GAME leaves it as it is */
export function prep(x, cfg) {
  if (cfg === GAME || (cfg.cd === 'game' && !cfg.terrain && !cfg.parry && cfg.boost !== 'next' && !cfg.styles && !cfg.retag && !cfg.vivK && !cfg.powerOf)) return x;
  const lv = (a) => (x.kitLevels?.[a.id] ?? 1);
  const re = (a) => {
    const b = { ...a };
    if (cfg.terrain && TERRAIN[a.id]) b.terrain = TERRAIN[a.id];
    if (cfg.parry && a.ward && (cfg.parryOf ? cfg.parryOf[a.id] : true)) b.parry = true;
    if (cfg.boost === 'next' && a.boost && (cfg.nextOf ?? BOOST_NEXT)[a.id]) { b.next = true; if (cfg.nextBoost) b.boost = { ...a.boost, ...cfg.nextBoost }; }
    if (cfg.retag) Object.assign(b, cfg.retag(b, x) ?? {});
    if (cfg.powerOf?.[a.id] && b.power) b.power *= cfg.powerOf[a.id];
    if (a.cooldown || a.kind === 'heavy') {
      if (cfg.cd === 'level') b.cooldown = 5 * a.charge;
      else if (cfg.cd === 'tiers') { const c = CD_CLASS[a.id] ?? 'M'; b.cooldown = cfg.tiers[c] * (1 - (cfg.cdLevel ?? 0) * (lv(a) - 1)); }
    }
    return b;
  };
  const y = { ...x, light: re(x.light), heavy: re(x.heavy), skills: x.skills.map(re) };
  // the Speed points of the pieces Ren wears × vivK (the gear's table: AC-11 doubled them)
  if (cfg.vivK && x.gear) y.viv = x.viv - (1 - cfg.vivK) * [x.gear.weapon, x.gear.armour, ...(x.gear.acc ?? [])].reduce((n, id) => n + (id ? GE.GEAR[id]?.fx?.viv ?? 0 : 0), 0);
  if (cfg.styles && x.brain === 'rival') {
    const k = kitOf(x), S = (cfg.styleTable ?? STYLE_TACTIC)[k];
    if (S) y.tactic = y.skills.map((s) => S[s.id] ?? 'auto');
  }
  return y;
}

// ------------------------------------------------------------------------------------------------------------------------------- whole games
/** a policy's whole games under the current model: the stages won, the titles, every bout of the player (its duel's result and counts) */
export function gamesOf(pn, seeds, o = {}) {
  const P = typeof pn === 'string' ? LAB.POLICIES[pn] : pn; if (!P) throw new Error(`no policy ${pn}`);
  const bouts = [];
  const wrap = { name: P.name, skill: P.skill, choose: (st) => {
    const a = P.choose(st);
    if (a.type === 'fight' || a.type === 'challengeResult') {
      const kind = a.type === 'fight' ? 'bout' : 'challenge', out = AM.autoOutcome(st, kind, { log: !!o.log }), r = out.duel;
      bouts.push({ kind, day: st.day, stage: out.bout.stage, foe: out.bout.foeId, kit: out.bout.foe.kitId, won: out.winner === 'player', t: r.t, n: r.n, hp: r.hp, maxHp: r.maxHp, turns: r.leadChanges, log: o.log ? r.log : null, ren: { hp: out.bout.ren.hp, atk: out.bout.ren.atk, def: out.bout.ren.def, end: out.bout.ren.end, viv: out.bout.ren.viv }, foeSheet: { hp: out.bout.foe.hp, atk: out.bout.foe.atk, def: out.bout.foe.def, end: out.bout.foe.end, viv: out.bout.foe.viv } });
      return { ...a, outcome: { winner: out.winner, playerHp: out.playerHp, playerMaxHp: out.playerMaxHp, opponentHp: out.opponentHp, opponentMaxHp: out.opponentMaxHp, finisher: out.finisher } };
    }
    return a;
  } };
  let crowns = 0, skipped = 0; const stageWins = {}, states = [];
  for (const s of seeds) {
    let st; try { st = LAB.autoplay(s, wrap, 'Ren', 260, 'v2').state; } catch (e) { if (!/refused action/.test(String(e))) throw e; skipped++; continue; }
    if (o.keepStates) states.push(st);
    const mine = st.tournament.matches.filter((m) => m.a === 'player' || m.b === 'player');
    if (st.flags.champion === 'player') crowns++;
    for (const m of mine) { const k = m.stage ?? `pool-j${m.day}`; (stageWins[k] ??= { w: 0, n: 0 }).n++; if (m.winner === 'player') stageWins[k].w++; }
  }
  return { pn: P.name, n: seeds.length - skipped, crowns, stageWins, bouts, skipped, states };
}
export const rate = (G, keys) => { let w = 0, n = 0; for (const k of [].concat(keys)) { const v = G.stageWins[k]; if (v) { w += v.w; n += v.n; } } return n ? w / n : NaN; };
export function gamesLine(G) {
  const B = G.bouts.filter((b) => b.kind === 'bout'), r = (k) => pct(G.stageWins[k]?.w ?? 0, G.stageWins[k]?.n ?? 0);
  const d = (s) => med(B.filter((b) => b.stage === s).map((b) => b.t));
  return `${String(G.pn).padEnd(10)} titres ${String(pct(G.crowns, G.n)).padStart(3)} %  j2 ${r('pool-j2')} j4 ${r('pool-j4')} j5 ${r('pool-j5')}  demi ${r('semi')}  3e ${r('third')}  finale ${r('final')} (${G.stageWins.final?.n ?? 0})  durées ${[0, 1, 2].map((s) => Math.round(d(s))).join(' / ')} s`;
}
export const summary = (G) => ({ titles: G.crowns / G.n, j2: rate(G, 'pool-j2'), j4: rate(G, 'pool-j4'), j5: rate(G, 'pool-j5'), semi: rate(G, 'semi'), third: rate(G, 'third'), final: rate(G, 'final'), n: G.n, finals: G.stageWins.final?.n ?? 0, dur: [0, 1, 2].map((s) => med(G.bouts.filter((b) => b.kind === 'bout' && b.stage === s).map((b) => b.t))) });

/** the race (AUTO_RACE) saved and given back around fn */
export function withRace(race, fn) {
  const R = AD.AUTO_RACE, keep = JSON.stringify({ norm: R.norm, pool: R.pool, stage: R.stage });
  if (race) { Object.assign(R.norm, race.norm ?? {}); if (race.pool) R.pool = [...race.pool]; Object.assign(R.stage, race.stage ?? {}); }
  try { return fn(); } finally { const k = JSON.parse(keep); Object.assign(R.norm, k.norm); R.pool = k.pool; Object.assign(R.stage, k.stage); }
}
export const raceNow = () => ({ norm: { ...AD.AUTO_RACE.norm }, pool: [...AD.AUTO_RACE.pool], stage: { ...AD.AUTO_RACE.stage } });

/** a kit chooser of the match sheet (globalThis.__finalKit): (st, foeId, kit, kitOfFoe) → the kit Ren brings */
export function setKitChooser(f) { globalThis.__finalKit = f ?? undefined; }

export { load };
