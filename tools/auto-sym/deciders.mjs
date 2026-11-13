// The ways of deciding Ren's skills, on the laboratory's duel: the tactic (one condition per skill, read in the order of the four), the hand (a command
// that leaves at Ren's next choice), and the measuring players (a hand that follows the cues, a careless hand, the one-step lookahead).
import { AU, symAuto, heavyWhen, SIM, h5 } from './lab.mjs';

const offensive = (a) => !a.ward && !a.boost && a.kind !== 'light' && a.base !== 'heavy';
const active = (e, t) => !!e && e.until > t;

/** the conditions a tactic line may hold (each reads only what the arena shows: the bars of charge, the gauges, the health, the AP) */
export const CONDS = {
  /** « Dès qu'elle est prête » */
  ready: () => true,
  /** « Quand l'adversaire est rompu » (and the skill lands before he rises) */
  broken: (v, x, s) => v.foe.broken && v.foe.stunEnd - v.t >= v.chargeOf(v.me, s),
  /** « Quand il charge un gros coup » (a ward: it covers the blow; an offensive skill: it lands while he is exposed) */
  incoming: (v, x, s) => { const f = v.foe; if (!f.act || f.act.kind === 'light') return false; const land = v.t + v.chargeOf(v.me, s); return s.ward ? f.at > land && f.at < land + s.ward.dur : f.at >= land; },
  /** « Quand ma jauge passe les deux tiers » */
  gauge: (v) => v.gauge(v.me) >= (2 / 3) * v.rules.gauge.max,
  /** « Quand mes PV passent sous la moitié » */
  hurt: (v) => v.me.hp / v.me.maxHp < 0.5,
  /** « Quand ses PV passent sous le tiers » */
  finish: (v) => v.foe.hp / v.foe.maxHp < 1 / 3,
  /** « Quand mes PA sont pleins » */
  full: (v) => v.me.ap >= v.rules.ap.max,
  /** « Quand une compétence offensive peut suivre » (a boost) */
  follow: (v, x, s) => x.skills.some((o) => offensive(o) && v.usable(o) && v.me.ap >= (o.ap ?? 0) + (s.ap ?? 0)),
  /** « Jamais » (kept for the hand) */
  never: () => false,
  /** the cues together: broken, or charging a big action it lands before */
  cue: (v, x, s) => CONDS.broken(v, x, s) || CONDS.incoming(v, x, s),
};
/** the automatic as a tactic (AU.playerDecider's own conditions): a ward against a blow it covers or past two thirds of the gauge, or to cover when an offensive
 *  can still be paid after it; a boost when an offensive can follow it or the opponent is broken; an offensive skill as soon as it is ready */
export function autoConds(x) { return x.skills.map((s) => (s.ward ? 'auto' : s.boost ? 'auto' : 'ready')); }

/** a tactic: `conds[i]` the condition of the i-th skill of the fighter's order ('auto' = the automatic's own rule for that skill). The first skill whose
 *  condition holds and that can go (AP, cooldown) is charged; else the base attacks (the heavy blow when the opponent cannot defend or the AP are full, else
 *  the light attack). `alsoFull`: an offensive skill held for its condition still goes when the AP are full (no AP lost) */
export function tactic(spec, { alsoFull = true } = {}) {
  return (v, x) => {
    const auto = AU.playerDecider(v, x), conds = typeof spec === 'function' ? spec(x) : spec;
    for (let i = 0; i < x.skills.length; i++) {
      const s = x.skills[i], c = conds[i] ?? 'ready';
      if (!v.usable(s)) continue;
      if (c === 'auto') { if (auto === s) return s; continue; }
      if (s.ward && active(v.me.ward, v.t)) continue;
      if (s.boost && active(v.me.boost, v.t)) continue;
      if (CONDS[c](v, x, s)) return s;
    }
    // at full AP (no AP lost): the first offensive skill of the order, or with 'cheap' the one that costs the least (the strongest kept for its signal)
    if (alsoFull && v.me.ap >= v.rules.ap.max) {
      const can = x.skills.filter((s) => offensive(s) && v.usable(s));
      const o = alsoFull === 'cheap' ? can.sort((a, b) => (a.ap ?? 0) - (b.ap ?? 0) || a.charge - b.charge)[0] : can[0];
      if (o && !(alsoFull === 'cheap' && x.heavy && v.usable(x.heavy))) return o;
    }
    if (x.heavy && heavyWhen(v, x)) return x.heavy;
    return x.light;
  };
}

/** a hand that follows the cues (the « attentive » player of the audit, on the tactic's rules): an offensive skill when the opponent is broken or charging a big
 *  action it lands before, else the base attacks while the AP gather; at full AP the first offensive skill goes; the wards and boosts by the automatic */
export const cueTactic = (x) => x.skills.map((s) => (s.ward || s.boost ? 'auto' : 'cue'));
export const cueHand = tactic(cueTactic, { alsoFull: true });

/** a careless hand: on top of the tactic, at each of Ren's choices with a skill that can go, one time in `p` it presses a skill drawn at random among those
 *  that can go (its own stream, never the duel's) */
export function careless(base, p = 0.25, seed = 1) {
  return (v, x) => {
    const r = h5(seed, Math.floor(v.t * 100), v.me.ap, v.me.n.acts, 9);
    const can = x.skills.filter((s) => v.usable(s));
    if (can.length && r < p) return can[Math.floor(h5(seed, Math.floor(v.t * 100), v.me.ap, v.me.n.acts, 10) * can.length)];
    return base(v, x);
  };
}

/** the one-step lookahead (the best a hand can do one choice at a time): at each of Ren's choices where a skill can go, each candidate (the base decider's
 *  choice, the light attack, the heavy blow, each skill that can go) is played out to the end with the base decider after it, on the same seed and the same
 *  draws (split streams), and the best end is kept (a win first, then the health shares). Works on one duel: `lookahead(A, B, seed, cfg)` returns the result. */
export function lookahead(A, B, seed, base, foeDecider, o = {}) {
  const forced = [], N = o.samples ?? 0;
  let from = [0, 0], t0 = 0;
  const play = (extra, salt) => {
    let k = 0;
    const d = (v, x) => { const i = k++; if (i < forced.length) return pick(x, forced[i]); if (i === forced.length && extra != null) return pick(x, extra); return base(v, x); };
    return SIM.duel(A, B, seed, { deciders: [d, foeDecider], streams: 'split', log: o.log, salt: salt ? { from, t: t0, v: salt } : undefined });
  };
  // with `samples`, a candidate is judged on the mean of N futures whose draws it cannot know (the actions not yet charged at the choice), not on the true one
  const judge = (c) => (N ? Array.from({ length: N }, (_, j) => score(play(c, 0x51ed27 + j * 0x9e3779b1))).reduce((a, b) => a + b, 0) / N : score(play(c)));
  const pick = (x, id) => (id === x.light.id ? x.light : x.heavy && id === x.heavy.id ? x.heavy : x.skills.find((s) => s.id === id));
  const score = (r) => ((r.winner ?? (r.hp[0] / r.maxHp[0] >= r.hp[1] / r.maxHp[1] ? 0 : 1)) === 0 ? 1 : 0) * 10 + r.hp[0] / r.maxHp[0] - r.hp[1] / r.maxHp[1];
  // walk the decisions: at each, collect the candidates through a probe decider that records the view's options
  for (let guard = 0; guard < 400; guard++) {
    let cands = null, auto = null;
    const k0 = forced.length;
    let k = 0;
    const probe = (v, x) => {
      const i = k++;
      if (i < k0) return pick(x, forced[i]);
      // (Ren is the first fighter) his next action and the rival's under way are unknown to the lookahead
      if (i === k0) { from = [v.me.n.acts, v.foe.n.acts - 1]; t0 = v.t; auto = base(v, x).id; const can = x.skills.filter((s) => v.usable(s)).map((s) => s.id); cands = can.length ? [...new Set([auto, x.light.id, ...(x.heavy ? [x.heavy.id] : []), ...can])] : null; }
      return base(v, x);
    };
    const r0 = SIM.duel(A, B, seed, { deciders: [probe, foeDecider], streams: 'split' });
    if (auto == null) return r0; // no decision left
    if (!cands) { forced.push(auto); continue; }
    let best = auto, bs = -Infinity;
    for (const c of cands) { const s = judge(c); if (s > bs + 1e-9) { bs = s; best = c; } }
    forced.push(best);
  }
  return play(null);
}
