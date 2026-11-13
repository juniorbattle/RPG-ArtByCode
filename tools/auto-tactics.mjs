// Ways of deciding a fighter's skills in the duel played by the computer, for the laboratory (tools/auto-lab.mjs `modes`, `autos`): the tactic of the second
// workshop (briefs/combat-auto.md § 25.5, SY-08: one condition per skill, read in the order of the four), and the measuring hands (random presses). Built on
// the game's own automatic (src/combat/auto.ts: autoSkillChoice, heavyWhen). Nothing in src/ reads this file.

/** a keyed draw in [0, 1) (the hands' own stream, never the duel's) */
function h(a, b, c, d) { let x = (a * 2654435761 + b * 40503 + c * 9973 + d * 31) >>> 0; x ^= x >>> 15; x = Math.imul(x, 2246822519) >>> 0; x ^= x >>> 13; x = Math.imul(x, 3266489917) >>> 0; x ^= x >>> 16; return (x >>> 0) / 4294967296; }
const active = (e, t) => !!e && e.until > t;

export function makeTactics(AU) {
  const offensive = (a) => !a.ward && !a.boost && a.kind === 'skill';
  /** the conditions a tactic line may hold (each reads only what the arena shows: the bars of charge, the gauges, the health, the AP) */
  const CONDS = {
    ready: () => true,
    broken: (v, x, s) => v.foe.broken && v.foe.stunEnd - v.t >= v.chargeOf(v.me, s),
    incoming: (v, x, s) => { const f = v.foe; if (!f.act || f.act.kind === 'light') return false; const land = v.t + v.chargeOf(v.me, s); return s.ward ? f.at > land && f.at < land + s.ward.dur : f.at >= land; },
    gauge: (v) => v.gauge(v.me) >= (2 / 3) * v.rules.gauge.max,
    hurt: (v) => v.me.hp / v.me.maxHp < 0.5,
    finish: (v) => v.foe.hp / v.foe.maxHp < 1 / 3,
    full: (v) => v.me.ap >= v.rules.ap.max,
    follow: (v, x, s) => x.skills.some((o) => offensive(o) && v.usable(o) && v.me.ap >= (o.ap ?? 0) + (s.ap ?? 0)),
    never: () => false,
    cue: (v, x, s) => CONDS.broken(v, x, s) || CONDS.incoming(v, x, s),
  };
  /** a tactic: `spec(x)` (or an array) the condition of each skill of the fighter's order ('auto' = the automatic's own rule for that skill); the first skill whose
   *  condition holds and that can go is charged; else, at full AP with `full` ('first' | 'cheap' | false), an offensive skill; else the base attacks */
  function tactic(spec, { full = 'first' } = {}) {
    return (v, x) => {
      const auto = AU.autoSkillChoice(v, x), conds = typeof spec === 'function' ? spec(x) : spec;
      for (let i = 0; i < x.skills.length; i++) {
        const s = x.skills[i], c = conds[i] ?? 'ready';
        if (!v.usable(s)) continue;
        if (c === 'auto') { if (auto === s) return s; continue; }
        if (s.ward && active(v.me.ward, v.t)) continue;
        if (s.boost && active(v.me.boost, v.t)) continue;
        if (CONDS[c](v, x, s)) return s;
      }
      if (full && v.me.ap >= v.rules.ap.max) {
        const can = x.skills.filter((s) => offensive(s) && v.usable(s));
        const o = full === 'cheap' ? can.sort((a, b) => (a.ap ?? 0) - (b.ap ?? 0) || a.charge - b.charge)[0] : can[0];
        if (o && !(full === 'cheap' && v.usable(x.heavy))) return o;
      }
      return AU.heavyWhen(v, x) ? x.heavy : x.light;
    };
  }
  /** a careless hand: on top of a decider, one time in `p` at a choice where a skill can go, a skill drawn among those that can go (`which`: 'all', 'supports',
   *  'offensive') */
  function careless(base, p = 0.25, seed = 7, which = 'all') {
    return (v, x) => {
      const r = h(seed, Math.floor(v.t * 100), v.me.ap, v.me.n.acts);
      const can = x.skills.filter((s) => v.usable(s) && (which === 'all' || (which === 'supports' ? !offensive(s) : offensive(s))));
      if (can.length && r < p) return can[Math.floor(h(seed + 1, Math.floor(v.t * 100), v.me.ap, v.me.n.acts) * can.length)];
      return base(v, x);
    };
  }
  const strongest = (x) => x.skills.filter(offensive).reduce((m, s) => ((s.power ?? 0) > (m?.power ?? -1) ? s : m), null);
  const cueSpec = (x) => x.skills.map((s) => (s.ward || s.boost ? 'auto' : 'cue'));
  /** the presets the laboratory measures */
  const MODES = {
    'automatique': null,
    'aux signaux, la première à PA pleins': tactic(cueSpec, { full: 'first' }),
    'aux signaux seulement': tactic(cueSpec, { full: false }),
    'aux signaux, la moins chère à PA pleins': tactic(cueSpec, { full: 'cheap' }),
    'la plus forte à la rupture': tactic((x) => x.skills.map((s) => (s.ward || s.boost ? 'auto' : s === strongest(x) ? 'broken' : 'ready'))),
    'la plus forte pour finir': tactic((x) => x.skills.map((s) => (s.ward || s.boost ? 'auto' : s === strongest(x) ? 'finish' : 'ready'))),
    'protections dès que prêtes': tactic((x) => x.skills.map((s) => (s.ward ? 'ready' : s.boost ? 'auto' : 'ready'))),
    'soutiens dès que prêts': tactic((x) => x.skills.map((s) => (s.boost ? 'ready' : s.ward ? 'auto' : 'ready'))),
    'soutiens jamais': tactic((x) => x.skills.map((s) => (s.boost ? 'never' : s.ward ? 'auto' : 'ready'))),
    'appuis au hasard (1 sur 4)': 'careless:0.25:all',
    'appuis au hasard (1 sur 2)': 'careless:0.5:all',
    'appuis au hasard, soutiens seuls (1 sur 4)': 'careless:0.25:supports',
    'appuis au hasard, offensives seules (1 sur 4)': 'careless:0.25:offensive',
  };
  /** a preset's decider on top of a base automatic */
  const deciderOf = (m, base) => (m == null ? base : typeof m === 'string' ? (() => { const [, p, w] = m.split(':'); return careless(base, +p, p === '0.5' ? 11 : 7, w); })() : m);
  return { CONDS, tactic, careless, strongest, cueSpec, MODES, deciderOf, offensive };
}
