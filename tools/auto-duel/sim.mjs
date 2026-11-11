// The combat workshop's prototype (journal Passe AC1, briefs/combat-auto.md): a duel played by the computer on a TIMELINE. Not the game: a
// measuring model for the operator's decision sheet; the construction, after his choices, ports what he keeps to src/combat/.
// The operator's direction (journal Passes AU3 / AU5, word for word there): duels fought by the computer, the player prepares; « un zone de
// charge/attente avant d'agir » accorded with the AP; « une ligne de temps mais les PA sont essentiels pour l'usage des competences sauf si on a un
// meilleur choix »; the guard and the dodge from the five stats; a semi-auto where the player chooses when to launch the skills.
// The loop, one rule for both fighters: choose an action -> CHARGE it (the visible wait, its time x 10 / Speed for Ren, x kit Speed / Speed for a
// rival: DB7-1) -> it LANDS -> choose again. Nothing cuts a charge (V2-2); a break pauses it (DB5-4: stunned 10 s, the damage taken x2, a gauge of
// 70). Every rule the sheet asks about is a switch of RULES. Event-driven, continuous time, deterministic from the seed. Pure: no DOM, no clock.

/** the prototype's rules; every value « proposé », each switch a card of the sheet */
export const RULES = {
  /** the light attack: its charge at Speed 10 (s), the AP it gains when it lands (hit or guarded: DB-3) */
  light: { charge: 1.2, ap: 1 },
  /** the AP (card « Les PA »): 'kept' = +1 a light landed, the skills pay, start 1 (CB-5), max 5 (C2-3); 'none' = no AP, the skills by their
   *  cooldown alone; 'time' = +1 AP every `every` s, the light gains none */
  ap: { mode: 'kept', start: 1, max: 5, every: 3 },
  /** DB5-3 « 5 × le temps de charge » (A3): a skill comes back k x its charge time at level 1 after it leaves (0 = none) */
  cooldownK: 5,
  /** DB5-4 « 10 s, ×2, jauge de 70 » (A3); decay per second (today's: 1.8 x 70/100 x 0.5, DB11-1); a guarded blow x2 to the guarder's gauge (DB9) */
  gauge: { max: 70, decay: 0.63, guardMul: 2 },
  brk: { stun: 10, dmg: 2 },
  /** the guard takes 80 % off (DB5-2) */
  guardReduce: 0.8,
  /** the defence (card « La garde et l'esquive »): 'stats' = a reaction drawn on every blow, the dodge by Speed, the guard by Defence (each
   *  against the attacker's Speed / Attack, the damage formula's shape: base x 2·a / (a + b)); 'alert' = the skills seen coming are guarded,
   *  never a light, no dodge; 'none' = no reaction (only the wards of the skills and the gear) */
  defence: 'stats',
  /** `skillGuard`: the guard chance against a skill or a heavy blow (seen coming: its charge shows) x this, at most 0.9; 1 = the same as a light */
  react: { dodge: 0.12, guard: 0.35, skillGuard: 1 },
  /** a fighter charging a skill (anything but its light attack) neither guards nor dodges: the charge's price (card « La zone de charge ») */
  exposed: true,
  /** every health x k (the duration's lever, card « La durée »); the win rates move little with it (the ratios hold) */
  hpScale: 1,
  /** the start: each fighter's first charge begins after a draw in [0, start] s (the initiative) */
  start: 0.6,
  /** the share of chance (card « La part du hasard »): `form` = each fighter's form of the day, drawn before the bout and shown (its blows x 1 ± form);
   *  `crit` = a blow's chance to be a critical (x critMul, shown on the blow); 0 = the stats alone (the reactions' draws average out over a duel) */
  luck: { form: 0, crit: 0, critMul: 1.5 },
  maxT: 1200,
};

/** mulberry32 */
export function rng(seed) { let a = seed >>> 0 || 1; return () => { let t = (a += 0x6D2B79F5) >>> 0; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export const hitFactor = (atk, def) => (2 * atk) / Math.max(1e-6, atk + def);
const ratio = (a, b) => (2 * a) / Math.max(1e-6, a + b);

/**
 * A fighter: { id, name, side: 'ren' | 'foe', hp, atk, def, end, viv, tempo (the Speed its charges are written at: 10 for Ren, its kit's for a
 * rival), apStart (extra AP), taken (damage taken x), actions: { light, skills[] }, decider, ai }.
 * An action: { id, name, kind: 'light' | 'heavy' | 'skill', family, charge (s at `tempo`), power, gauge, ap, cooldown, pierce, ward: { dur, dmg,
 * gauge }, boost: { dur, dmg, gauge }, weight (a rival's) }.
 */
export function duel(A, B, seed, R = RULES, o = {}) {
  const rand = rng(seed), F = [mk(A), mk(B)], log = o.log ? [] : null;
  // the form of the day: drawn from its own stream, so the duel's other draws stay the same with or without it
  { const fr = rng((seed ^ 0x9e3779b9) >>> 0); for (const f of F) f.form = 1 + (R.luck?.form ?? 0) * (2 * fr() - 1); }
  function mk(x) {
    return { x, hp: Math.round(x.hp * R.hpScale), maxHp: Math.round(x.hp * R.hpScale), ap: R.ap.mode === 'none' ? 0 : R.ap.start + (x.apStart ?? 0), apT: 0, g: 0, gT: 0, broken: false, stunEnd: 0, cd: {}, ward: null, boost: null, act: null, at: 0, startT: 0, n: { acts: 0, skills: 0, lights: 0, dodged: 0, guarded: 0, hit: 0, breaks: 0, dmg: 0, dmgBroken: 0, skillDmg: 0, wasted: 0 } };
  }
  const other = (f) => (f === F[0] ? F[1] : F[0]);
  const speed = (f) => (f.x.tempo ?? 10) / Math.max(1, f.x.viv);
  let t = 0, over = false, winner = null, winIdx = null, finisher = null, lead = [], leadChanges = 0, lastLead = 0;
  const gaugeNow = (f) => { if (f.broken) return R.gauge.max; return Math.max(0, f.g - R.gauge.decay * (t - f.gT)); };
  const settle = (f) => { if (f.broken && t >= f.stunEnd) { f.broken = false; f.g = 0; f.gT = f.stunEnd; } f.g = gaugeNow(f); f.gT = t; if (R.ap.mode === 'time') { while (f.apT + R.ap.every <= t) { f.apT += R.ap.every; f.ap = Math.min(R.ap.max, f.ap + 1); } } };
  const affordable = (f, a) => R.ap.mode === 'none' || (a.ap ?? 0) <= f.ap;
  const ready = (f, a) => !a.cooldown || !R.cooldownK || (f.cd[a.id] ?? 0) <= t + 1e-9;
  const usable = (f, a) => affordable(f, a) && ready(f, a);
  const view = (f) => ({ t, me: f, foe: other(f), usable: (a) => usable(f, a), gauge: gaugeNow, R, rand, chargeOf: (g, a) => a.charge * speed(g), left: (g) => (g.act ? g.at - t : 0) });

  function start(f, a) {
    settle(f);
    if (R.ap.mode !== 'none' && a.ap) f.ap -= a.ap;
    if (a.cooldown && R.cooldownK) f.cd[a.id] = t + a.cooldown;
    f.act = a; f.startT = t; f.at = t + a.charge * speed(f); f.n.acts++;
    if (a.kind === 'light') f.n.lights++; else f.n.skills++;
    log?.push({ t: +t.toFixed(2), who: f.x.id, ev: 'charge', act: a.id, at: +f.at.toFixed(2) });
  }
  function choose(f) {
    const a = f.x.decider(view(f), f.x);
    start(f, a);
  }
  function land(f) {
    const a = f.act, g = other(f); f.act = null;
    settle(f); settle(g);
    if (a.ward) { f.ward = { until: t + a.ward.dur, dmg: a.ward.dmg, gauge: a.ward.gauge }; log?.push({ t: +t.toFixed(2), who: f.x.id, ev: 'ward', act: a.id }); return; }
    if (a.boost) { f.boost = { until: t + a.boost.dur, dmg: a.boost.dmg, gauge: a.boost.gauge }; log?.push({ t: +t.toFixed(2), who: f.x.id, ev: 'boost', act: a.id }); return; }
    const exposed = R.exposed && g.act && g.act.kind !== 'light';
    let res = 'hit';
    if (!g.broken && !exposed) {
      if (R.defence === 'stats') {
        if (rand() < R.react.dodge * ratio(g.x.viv, f.x.viv)) res = 'dodged';
        else if (!a.pierce && rand() < Math.min(0.9, R.react.guard * ratio(g.x.def, f.x.atk) * (a.kind === 'light' ? 1 : R.react.skillGuard ?? 1))) res = 'guarded';
      } else if (R.defence === 'alert' && a.kind !== 'light' && !a.pierce) res = 'guarded';
    }
    if (g.x.dodgeBonus && res === 'hit' && !g.broken && !exposed && rand() < g.x.dodgeBonus) res = 'dodged';
    if (res === 'dodged') { g.n.dodged++; if (a.kind !== 'light') f.n.wasted++; log?.push({ t: +t.toFixed(2), who: f.x.id, ev: 'dodged', act: a.id }); return; }
    const wardOn = g.ward && g.ward.until > t, boostOn = f.boost && f.boost.until > t;
    let k = hitFactor(f.x.atk, g.x.def) * (res === 'guarded' ? 1 - R.guardReduce : 1) * (g.x.taken ?? 1) * f.form;
    if (R.luck?.crit && rand() < R.luck.crit) { k *= R.luck.critMul; f.n.crits = (f.n.crits ?? 0) + 1; }
    if (boostOn) k *= f.boost.dmg; if (wardOn) k *= g.ward.dmg; if (g.broken) k *= R.brk.dmg;
    const dmg = Math.max(1, Math.round(a.power * k));
    g.hp = Math.max(0, g.hp - dmg); f.n.dmg += dmg; if (g.broken) f.n.dmgBroken += dmg; if (a.kind !== 'light') f.n.skillDmg += dmg;
    if (res === 'guarded') g.n.guarded++; else g.n.hit++;
    if (a.kind === 'light' && R.ap.mode === 'kept') f.ap = Math.min(R.ap.max, f.ap + R.light.ap);
    log?.push({ t: +t.toFixed(2), who: f.x.id, ev: res, act: a.id, dmg, hp: g.hp });
    if (g.hp <= 0) { over = true; winner = f.x.id; winIdx = F.indexOf(f); finisher = a.kind === 'light' ? 'light' : a.heavy ? 'heavy' : 'skill'; return; }
    if (!g.broken) {
      const add = a.gauge * (10 / Math.max(1, g.x.end)) * (res === 'guarded' ? R.gauge.guardMul : 1) * (boostOn ? f.boost.gauge : 1) * (wardOn ? g.ward.gauge : 1);
      g.g = Math.min(R.gauge.max, gaugeNow(g) + add); g.gT = t;
      if (g.g >= R.gauge.max) {
        g.broken = true; g.stunEnd = t + R.brk.stun; g.n.breaks++;
        // the break pauses the charge in progress (nothing cuts it, V2-2): it lands the stun's length later
        if (g.act) g.at += R.brk.stun;
        log?.push({ t: +t.toFixed(2), who: g.x.id, ev: 'break' });
      }
    }
  }

  // the initiative
  for (const f of F) { t = 0; f.at = rand() * R.start; f.pending = true; }
  while (!over) {
    // the next event: a charge that lands, or a fighter free to choose (after its initiative or a stun with no charge)
    let next = null, nt = Infinity;
    for (const f of F) { const ft = f.pending ? Math.max(f.at, f.broken ? f.stunEnd : 0) : f.at; if (ft < nt - 1e-12) { nt = ft; next = f; } }
    t = nt;
    if (t > R.maxT) break;
    if (next.pending) { next.pending = false; settle(next); choose(next); continue; }
    land(next);
    if (over) break;
    // the lead (a turn of the duel: who has the larger share of health)
    const ld = Math.sign(F[0].hp / F[0].maxHp - F[1].hp / F[1].maxHp);
    if (ld && lastLead && ld !== lastLead) leadChanges++; if (ld) lastLead = ld;
    // a stunned fighter chooses its next action when the stun ends (its action landed before the break)
    if (next.broken) { next.pending = true; next.at = next.stunEnd; } else choose(next);
  }
  const [a, b] = F;
  return { winner, winIdx, finisher, t: +t.toFixed(2), hp: [a.hp, b.hp], maxHp: [a.maxHp, b.maxHp], n: [a.n, b.n], leadChanges, log };
}

// ------------------------------------------------------------------------------------------------- the deciders (card « Trois façons de décider »)

/** the automatic: the bot's order of today (bot.ts pickTier): the ward when its own gauge passes half, the boost when it has none, the strongest
 *  offensive skill it can pay, else the light attack */
export function autoDecider(v, x) {
  const { me } = v, S = x.actions.skills, g = v.gauge(me);
  const ok = (a) => v.usable(a);
  let a = S.find((s) => s.ward && ok(s) && g >= 0.5 * v.R.gauge.max && !(me.ward && me.ward.until > v.t));
  if (a) return a;
  a = S.find((s) => s.boost && ok(s) && !(me.boost && me.boost.until > v.t));
  if (a) return a;
  const off = S.filter((s) => !s.ward && !s.boost && ok(s)).sort((p, q) => q.power - p.power);
  return off[0] ?? x.actions.light;
}

/** the semi-automatic, played by a player who reads the timeline (« semi » since journal Passe AC1's second measure): the defensive and the
 *  support as the automatic; an offensive skill as soon as a window shows (the opponent broken for most of its charge, or charging a heavy blow
 *  or a skill long enough: exposed, it will neither guard nor dodge), else held while the lights gather the AP, and cast anyway once the AP are
 *  full (a player never sits on full AP) */
export function semiGoodDecider(v, x) {
  const { me, foe } = v, S = x.actions.skills, ok = (a) => v.usable(a), g = v.gauge(me);
  const mine = (a) => v.chargeOf(me, a);
  const foeLeft = foe.act ? foe.at - v.t : 0, foeBig = foe.act && foe.act.kind !== 'light';
  const stunLeft = foe.broken ? foe.stunEnd - v.t : 0;
  const ward = S.find((s) => s.ward && ok(s) && !(me.ward && me.ward.until > v.t));
  if (ward && (g >= 0.5 * v.R.gauge.max || (foeBig && foeLeft > mine(ward)))) return ward;
  const boost = S.find((s) => s.boost && ok(s) && !(me.boost && me.boost.until > v.t));
  if (boost) return boost;
  const off = S.filter((s) => !s.ward && !s.boost && ok(s)).sort((p, q) => q.power - p.power);
  if (!off.length) return x.actions.light;
  for (const s of off) if (stunLeft >= 0.8 * mine(s) || (foeBig && foeLeft >= mine(s))) return s;
  if (v.R.ap.mode === 'none' || me.ap >= v.R.ap.max) return off[0];
  return x.actions.light;
}

/** the old semi model (journal Passe AC1's first measure): a skill only in a window, never on full AP; kept to show what waiting too long costs */
export function semiWaitDecider(v, x) {
  const { me, foe } = v, S = x.actions.skills, ok = (a) => v.usable(a);
  const mine = (a) => v.chargeOf(me, a);
  const foeLeft = foe.act ? foe.at - v.t : 0, foeBig = foe.act && foe.act.kind !== 'light';
  const stunLeft = foe.broken ? foe.stunEnd - v.t : 0;
  const ward = S.find((s) => s.ward && ok(s) && !(me.ward && me.ward.until > v.t));
  if (ward && foeBig && foeLeft > mine(ward)) return ward;
  const off = S.filter((s) => !s.ward && !s.boost && ok(s)).sort((p, q) => q.power - p.power);
  for (const s of off) if (stunLeft >= 0.8 * mine(s) || (foeBig && foeLeft >= mine(s))) return s;
  const boost = S.find((s) => s.boost && ok(s) && !(me.boost && me.boost.until > v.t));
  if (boost && v.gauge(foe) >= 0.6 * v.R.gauge.max) return boost;
  return x.actions.light;
}

/** the semi-automatic, played carelessly: a skill when the player happens to press it (each choice, a third of the time when one is ready) */
export function semiCarelessDecider(v, x) {
  const S = x.actions.skills.filter((s) => v.usable(s));
  if (S.length && v.rand() < 0.33) return S[Math.floor(v.rand() * S.length)];
  return x.actions.light;
}

/** a rival's AI (C3's habits, one rule): a skill of its own when one is ready (its share `chance`, by weight), else its heavy blow by its share,
 *  else its light attack; the ward of its kit when its gauge passes half */
export function rivalDecider(v, x) {
  const { me } = v, S = x.actions.skills, ok = (a) => v.usable(a), g = v.gauge(me);
  const ward = S.find((s) => s.ward && ok(s) && g >= 0.5 * v.R.gauge.max && !(me.ward && me.ward.until > v.t));
  if (ward) return ward;
  const sk = S.filter((s) => !s.heavy && ok(s) && !(s.boost && me.boost && me.boost.until > v.t));
  if (sk.length && v.rand() < (x.ai?.chance ?? 0.3)) {
    let r = v.rand() * sk.reduce((n, s) => n + (s.weight ?? 1), 0);
    for (const s of sk) { r -= s.weight ?? 1; if (r <= 0) return s; }
    return sk[sk.length - 1];
  }
  const heavy = S.find((s) => s.heavy && ok(s));
  if (heavy && v.rand() < (x.ai?.heavy ?? 0.25)) return heavy;
  return x.actions.light;
}

export const DECIDERS = { auto: autoDecider, semi: semiGoodDecider, wait: semiWaitDecider, careless: semiCarelessDecider, rival: rivalDecider };
