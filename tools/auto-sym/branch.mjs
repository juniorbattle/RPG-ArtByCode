// One choice changed, how far it carries: Ren of a new game (the start kit) against the seven rivals in the pool's first round; at the first offensive skill
// the automatic casts past the middle of the duel, a light attack instead (one choice held); how often the winner changes and how much of the script before
// that choice stays the same, with one stream (the game) and with the split streams.
import * as L from './lab.mjs';
const { AD, ST, RIVALS, range, med, arg } = L;
const V2D = await L.server.ssrLoadModule('/src/combat/v2duel.ts');
const offensive = (a) => !a.ward && !a.boost && a.kind !== 'light' && a.base !== 'heavy';
export function branch(cfg, seeds) {
  let duels = 0, changed = 0, flips = 0, prefixSame = 0, dLen = [];
  for (const id of RIVALS) for (const seed of seeds) {
    const A0 = AD.autoRen({ ...ST.REN_BASE }, { loadout: V2D.V2_START_KIT.loadout, levels: V2D.V2_START_KIT.levels }), B0 = AD.autoFoe(id, AD.autoRaceSheet(id, 0, 0));
    const A = L.convert(A0, cfg), B = L.convert(B0, cfg), dA = L.deciderOf(A0, cfg), dB = L.deciderOf(B0, cfg);
    let count = 0; const off = [];
    const base = L.SIM.duel(A, B, seed, { log: true, streams: cfg.streams, deciders: [(v, x) => { const d = dA(v, x); if (offensive(d)) off.push(count); count++; return d; }, dB] });
    const k = off.find((i) => i >= count / 2) ?? off[off.length - 1]; if (k == null) continue;
    let i = 0, did = false;
    const forced = (v, x) => { const d = dA(v, x); if (i++ === k && offensive(d)) { did = true; return x.light; } return d; };
    const r = L.SIM.duel(A, B, seed, { log: true, streams: cfg.streams, deciders: [forced, dB] });
    duels++; if (!did) continue; changed++;
    const w = (x) => x.winner ?? (x.hp[0] / x.maxHp[0] >= x.hp[1] / x.maxHp[1] ? 0 : 1);
    if (w(base) !== w(r)) flips++;
    // the script after the held choice: how many of the rival's later reactions to Ren's blows and of its own choices are the same (the duel's local effect)
    const ev = (x, t0) => x.log.filter((e) => e.t > t0 && e.who !== 'ren').map((e) => `${e.ev}:${e.act}`);
    const tk = base.log.filter((e) => e.who === 'ren' && e.ev === 'charge')[k]?.t ?? 0;
    const a = ev(base, tk).slice(0, 20), b = ev(r, tk).slice(0, 20); let same = 0; for (let j = 0; j < Math.min(a.length, b.length); j++) if (a[j] === b[j]) same++;
    prefixSame += same / Math.max(1, Math.min(a.length, b.length)); dLen.push(Math.abs(r.t - base.t));
  }
  return { duels, changed, flips: flips / changed, rivalSame: prefixSame / changed, dLen: med(dLen) };
}
const seeds = range(arg('seeds', '1..30'));
try {
  const SYM = { ...L.GAME, streams: 'split', ap: 'pay', combo: 'weapon', table: 'ren', cadence: 0.75, cooldown: 'db53', traits: 'none', ai: 'auto', heavy: 'base', renHeavy: 'base' };
  for (const [name, cfg] of Object.entries({ 'jeu, un seul flux': L.GAME, 'jeu, tirages séparés': { ...L.GAME, streams: 'split' }, 'symétrique, un seul flux': { ...SYM, streams: 'one' }, 'symétrique, tirages séparés': SYM, 'symétrique, lourd rechargé': { ...SYM, heavyCd: true } })) {
    const b = branch(cfg, seeds);
    console.log(`${name.padEnd(28)} ${b.changed} duels changés ; le vainqueur change dans ${(100 * b.flips).toFixed(1)} % ; les 20 actions et réactions du rival qui suivent, les mêmes à ${(100 * b.rivalSame).toFixed(0)} % ; durée déplacée de ${b.dLen.toFixed(1)} s (méd.)`);
  }
} finally { await L.server.close(); }
