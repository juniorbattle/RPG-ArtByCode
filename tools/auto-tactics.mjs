// Ways of deciding a fighter's skills in the duel played by the computer, for the laboratory (tools/auto-lab.mjs `modes`, `autos`): the tactic of the second
// workshop (briefs/combat-auto.md § 25.5, SY-08: one condition per skill, read in the order of the four), the page's own tactics (a condition by family or by skill,
// only those the page offers the skill) and the measuring hands (random presses). Built on the game's own plan (src/combat/auto.ts: planChoice, condHolds, autoRole,
// heavyWhen; src/combat/autoData.ts: autoCondsFor). Nothing in src/ reads this file.
// Kept to the game as it is (journal Passe OP1): since the model « La Brute » (journal Passe BL1) the duel has no AP, and since lot 2 (journal Passe BL2) its plan is `planChoice`,
// a condition per skill among its role's. The former file read `AU.tacticChoice` and the AP (both gone): it skipped the modes that needed them and measured the others
// against a duel without the rule they named (« à PA pleins » played as the same tactic three times). So no mode here speaks of AP any more, the page's modes keep
// to the lines the page offers a skill (its role's, or its family's; one the page refuses is the automatic's, as the game's `autoCondOf` makes it), and a function of the
// game that is gone stops the laboratory with its name (tests/auto-tactics.test.mjs) instead of being skipped.

/** a keyed draw in [0, 1) (the hands' own stream, never the duel's) */
function h(a, b, c, d) { let x = (a * 2654435761 + b * 40503 + c * 9973 + d * 31) >>> 0; x ^= x >>> 15; x = Math.imul(x, 2246822519) >>> 0; x ^= x >>> 13; x = Math.imul(x, 3266489917) >>> 0; x ^= x >>> 16; return (x >>> 0) / 4294967296; }

/** `AU` the game's src/combat/auto.ts, `AD` its src/combat/autoData.ts (both as the laboratory loads them) */
export function makeTactics(AU, AD) {
  for (const f of ['planChoice', 'condHolds', 'autoRole', 'autoSkillChoice', 'heavyWhen', 'offensive', 'autoDecider', 'DECIDERS']) if (typeof AU?.[f] === 'undefined') throw new Error(`tools/auto-tactics.mjs: src/combat/auto.ts exports no ${f} any more`);
  for (const f of ['autoCondsFor', 'AUTO_CONDS_OF']) if (typeof AD?.[f] === 'undefined') throw new Error(`tools/auto-tactics.mjs: src/combat/autoData.ts exports no ${f} any more`);
  const offensive = AU.offensive;
  /** a skill's family as the plan's page sorts it: 'w' a ward or a defensive skill, 'b' a boost or a support, 'o' the rest */
  const fam = (s) => (s.ward || s.family === 'defensive' ? 'w' : s.boost || s.family === 'support' ? 'b' : 'o');
  /** the line this file adds to the game's conditions: 'cue', the workshop's two signs (the opponent broken long enough for the skill to land, or charging a big action it
   *  can be ready for); every other line is the game's own (src/combat/auto.ts AUTO_CONDS) */
  const holds = (c, v, x, s) => (c === 'cue' ? AU.condHolds('broken', v, x, s) || AU.condHolds('incoming', v, x, s) : AU.condHolds(c, v, x, s));
  /** a tactic: `spec(x)` (or an array) the line of each skill of the fighter's order ('auto' = the automatic's own rule for the skill's role, a missing line too); the plan's
   *  choice by the game's `planChoice` (the first skill usable, its effect not running, whose line holds), else the base attacks as the automatic's */
  function tactic(spec) {
    return (v, x) => {
      const lines = typeof spec === 'function' ? spec(x) : spec;
      const conds = x.skills.map((s, i) => { const c = lines[i] ?? 'auto'; return c === 'cue' ? (holds('cue', v, x, s) ? 'ready' : 'never') : c; });
      return AU.planChoice(v, x, conds) ?? (AU.heavyWhen(v, x) ? x.heavy : x.light);
    };
  }
  /** a careless hand: on top of a decider, one time in `p` at a choice where a skill can go, a skill drawn among those that can go (`which`: 'all', 'supports',
   *  'offensive') */
  function careless(base, p = 0.25, seed = 7, which = 'all') {
    return (v, x) => {
      const r = h(seed, Math.floor(v.t * 100), v.me.dec, v.me.n.acts);
      const can = x.skills.filter((s) => v.usable(s) && (which === 'all' || (which === 'supports' ? !offensive(s) : offensive(s))));
      if (can.length && r < p) return can[Math.floor(h(seed + 1, Math.floor(v.t * 100), v.me.dec, v.me.n.acts) * can.length)];
      return base(v, x);
    };
  }
  const strongest = (x) => x.skills.filter(offensive).reduce((m, s) => ((s.power ?? 0) > (m?.power ?? -1) ? s : m), null);
  const cueSpec = (x) => x.skills.map((s) => (s.ward || s.boost ? 'auto' : 'cue'));
  /** the presets the laboratory measures */
  const MODES = {
    'automatique': null,
    'aux signaux': tactic(cueSpec),
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
  /** the page's tactics (lot 2 of the second redesign, journal Passe SL3; SL1-4 « Le reprendre au lot 2, avant mon essai »): the game's own conditions and rule, a line by
   *  family or by skill, `legal` keeping to what the page offers a skill (its role's conditions, or its family's for a plan written before: `autoCondOf`), 'auto' the automatic's own */
  const legal = (s, c) => (c === 'auto' || AD.autoCondsFor(s.id).includes(c) || AD.AUTO_CONDS_OF[s.family]?.includes(c) ? c : 'auto');
  const page = (by) => tactic((x) => x.skills.map((s) => legal(s, by(s, x))));
  const PAGE = {
    // the control: every line the automatic's, which is the automatic (the first two rows of a `modes` run must be equal, as tools/auto-manual.mjs's)
    'page : tout comme l’automatique (le contrôle)': page(() => 'auto'),
    'page : offensives à la rupture': page((s) => (fam(s) === 'o' ? 'broken' : 'auto')),
    'page : offensives quand il charge un gros coup': page((s) => (fam(s) === 'o' ? 'incoming' : 'auto')),
    'page : la plus forte à la rupture, les autres quand il charge': page((s, x) => (fam(s) !== 'o' ? 'auto' : s === strongest(x) ? 'broken' : 'incoming')),
    'page : la plus forte pour finir': page((s, x) => (fam(s) === 'o' && s === strongest(x) ? 'finish' : 'auto')),
    'page : offensives dès que prêtes': page((s) => (fam(s) === 'o' ? 'ready' : 'auto')),
    'page : protections quand il charge un gros coup': page((s) => (fam(s) === 'w' ? 'incoming' : 'auto')),
    'page : protections à la jauge': page((s) => (fam(s) === 'w' ? 'gauge' : 'auto')),
    'page : soutiens quand une offensive peut suivre': page((s) => (fam(s) === 'b' ? 'follow' : 'auto')),
    'page : soutiens à la rupture': page((s) => (fam(s) === 'b' ? 'broken' : 'auto')),
    'page : protections et soutiens dès que prêts': page((s) => (fam(s) === 'o' ? 'auto' : 'ready')),
    'page : les signaux partout': page((s) => (fam(s) === 'w' ? 'incoming' : fam(s) === 'b' ? 'follow' : 'broken')),
  };
  Object.assign(MODES, PAGE);
  /** a preset's decider on top of a base automatic */
  const deciderOf = (m, base) => (m == null ? base : typeof m === 'string' ? (() => { const [, p, w] = m.split(':'); return careless(base, +p, p === '0.5' ? 11 : 7, w); })() : m);
  return { tactic, page, legal, fam, careless, strongest, cueSpec, MODES, deciderOf, offensive };
}
