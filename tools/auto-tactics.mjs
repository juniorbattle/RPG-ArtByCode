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
  /** the page's tactics (lot 2 of the second redesign, journal Passe SL3; SL1-4 « Le reprendre au lot 2, avant mon essai »): the game's own conditions and rule
   *  (src/combat/auto.ts tacticChoice, the conditions AUTO_CONDS_OF offers), a condition by family or by skill; 'auto' the automatic's own */
  const page = (by) => (v, x) => AU.tacticChoice(v, x, x.skills.map((s) => by(s, x))) ?? (AU.heavyWhen(v, x) ? x.heavy : x.light);
  const fam = (s) => (s.ward ? 'w' : s.boost ? 'b' : 'o');
  const PAGE = {
    'page : offensives à la rupture': page((s) => (fam(s) === 'o' ? 'broken' : 'auto')),
    'page : offensives quand il charge un gros coup': page((s) => (fam(s) === 'o' ? 'incoming' : 'auto')),
    'page : la plus forte à la rupture, les autres quand il charge': page((s, x) => (fam(s) !== 'o' ? 'auto' : s === AU.strongestOf(x) ? 'broken' : 'incoming')),
    'page : la plus forte pour finir': page((s, x) => (fam(s) === 'o' && s === AU.strongestOf(x) ? 'finish' : 'auto')),
    'page : offensives dès que prêtes': page((s) => (fam(s) === 'o' ? 'ready' : 'auto')),
    'page : protections quand il charge un gros coup': page((s) => (fam(s) === 'w' ? 'incoming' : 'auto')),
    'page : protections à la jauge': page((s) => (fam(s) === 'w' ? 'gauge' : 'auto')),
    'page : soutiens quand une offensive peut suivre': page((s) => (fam(s) === 'b' ? 'follow' : 'auto')),
    'page : soutiens à la rupture': page((s) => (fam(s) === 'b' ? 'broken' : 'auto')),
    'page : protections et soutiens dès que prêts': page((s) => (fam(s) === 'o' ? 'auto' : 'ready')),
    'page : les signaux partout': page((s) => (fam(s) === 'w' ? 'incoming' : fam(s) === 'b' ? 'follow' : 'broken')),
  };
  if (AU.tacticChoice) Object.assign(MODES, PAGE);
  // a rule at full AP for every tactic (SL1-4's remedy, measured in journal Passe SL3): nothing held and the AP full, (A) the first skill of the order whose line is
  // not « never » and that can go, or (B) the cheapest offensive skill whose line is not « never »; the automatic's own rule stays for its lines
  const fullA = (by) => (v, x) => { const c = x.skills.map((s) => by(s, x)), t = AU.tacticChoice(v, x, c); if (t) return t; if (v.me.ap >= v.rules.ap.max) { const s = x.skills.find((s, i) => c[i] !== 'never' && v.usable(s) && !(s.ward && v.me.ward && v.me.ward.until > v.t) && !(s.boost && v.me.boost && v.me.boost.until > v.t)); if (s) return s; } return AU.heavyWhen(v, x) ? x.heavy : x.light; };
  const fullB = (by) => (v, x) => { const c = x.skills.map((s) => by(s, x)), t = AU.tacticChoice(v, x, c); if (t) return t; if (v.me.ap >= v.rules.ap.max) { const s = x.skills.filter((s, i) => c[i] !== 'never' && offensive(s) && v.usable(s)).sort((a, b) => (a.ap ?? 0) - (b.ap ?? 0) || a.charge - b.charge)[0]; if (s) return s; } return AU.heavyWhen(v, x) ? x.heavy : x.light; };
  const SPECS = {
    'offensives à la rupture': (s) => (fam(s) === 'o' ? 'broken' : 'auto'),
    'offensives quand il charge': (s) => (fam(s) === 'o' ? 'incoming' : 'auto'),
    'soutiens quand une offensive peut suivre': (s) => (fam(s) === 'b' ? 'follow' : 'auto'),
    'soutiens à la rupture': (s) => (fam(s) === 'b' ? 'broken' : 'auto'),
    'protections quand il charge': (s) => (fam(s) === 'w' ? 'incoming' : 'auto'),
    'protections à la jauge': (s) => (fam(s) === 'w' ? 'gauge' : 'auto'),
    'les signaux partout': (s) => (fam(s) === 'w' ? 'incoming' : fam(s) === 'b' ? 'follow' : 'broken'),
    'tout comme l’automatique': () => 'auto',
  };
  if (AU.tacticChoice) for (const [n, by] of Object.entries(SPECS)) { MODES[`A pleins : ${n}`] = fullA(by); MODES[`B pleins : ${n}`] = fullB(by); }
  /** a preset's decider on top of a base automatic */
  const deciderOf = (m, base) => (m == null ? base : typeof m === 'string' ? (() => { const [, p, w] = m.split(':'); return careless(base, +p, p === '0.5' ? 11 : 7, w); })() : m);
  return { CONDS, tactic, careless, strongest, cueSpec, MODES, deciderOf, offensive };
}
