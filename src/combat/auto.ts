import { Rng } from '../core/rng';
import { hitFactor } from './stats';

/** The duel played by the computer (the operator's combat rules sheet, read back in journal Passe AC4; briefs/combat-auto.md, its § 17 first; lot 1 of
 *  the construction, journal Passe AL-1 to come): a TIMELINE where each fighter, Ren as his rivals, chooses an action, CHARGES it (the operator's « zone de
 *  charge/attente avant d'agir »: its time × the Speed its kit was written at / its Speed now, DB7-1) and it LEAVES, in one blow or an ENCHAÎNEMENT (AC-02),
 *  then chooses again. The two charges run at the same time; nothing cuts a charge (V2-2); a break pauses it (DB5-4, A3: a gauge of 70, stunned 10 s, the
 *  damage taken ×2). The AP stay (AC-03: +1 a light attack that lands, the skills pay, 1 at the start, 5 at most), each skill comes back 5 × its charge time
 *  after it leaves (DB5-3, A3: its `cooldown`); the guard and the dodge are reactions drawn from the stats, the guard ×2 against a skill seen coming, a
 *  fighter charging a skill neither guards nor dodges, the rivals keep their traits (AC-05); each fighter's form of the day ±15 % (AC-08); every health ×2
 *  (DB5 held, AC-13); no riposte (AC-07, A3). The automatic that places its supports plays Ren in the order of his four skills (AC-09); the rivals' AI
 *  plays them; an off-screen bout is the same duel, the AI on both sides (AC-18).
 *  Ported from the workshop's measuring prototype (tools/auto-duel/sim.mjs, journal Passes AC1 to AC3) with the rules the operator kept; the same
 *  fighters and the same seed give the prototype's own duel, event for event (tests/combat-auto.test.mjs). Pure: no DOM, no clock, no Math.random; the
 *  same seed gives the same duel. Every version 2 game plays it since lot 2 (journal Passe LC3); today's game (`v2=0`) keeps its own duel. */

export type AutoKind = 'light' | 'heavy' | 'skill';
export type AutoFamily = 'offensive' | 'defensive' | 'support';
/** a ward (on oneself: the damage and the gauge one takes ×) or a boost (one's own blows' damage and gauge ×), for `dur` seconds */
export interface AutoEffect { dur: number; dmg: number; gauge: number }
/** an action on the timeline */
export interface AutoAction {
  id: string;
  /** 'light' a fighter's light attack (and a rival's combo of light blows): the only kind that does not expose its charger; 'heavy' Ren's heavy attack */
  kind: AutoKind;
  family?: AutoFamily;
  /** its charge (s) at the Speed its fighter's kit was written at (`AutoFighter.tempo`) */
  charge: number;
  /** its damage at equal Attack and Defence, before the form, a guard, a ward, a boost or a break */
  power?: number;
  /** what it adds to the target's gauge at Endurance 10 */
  gauge?: number;
  /** its cost in AP (Ren's skills) */
  ap?: number;
  /** after it leaves, it waits this long before it can be chosen again (s; DB5-3 for Ren's skills, a rival's own) */
  cooldown?: number;
  /** it ignores the guard (Fente, Feinte) */
  pierce?: boolean;
  /** an enchaînement: each hit's share of the power and of the gauge, `gap` s apart (AC-02); one hit by default */
  hits?: readonly number[];
  gap?: number;
  ward?: AutoEffect;
  boost?: AutoEffect;
  /** a ward the automatic raises to cover (as soon as it is ready and the AP left still pay an offensive skill, the opponent not broken), not only against a blow
   *  seen coming */
  cover?: boolean;
  /** a rival's skill: its weight among the skills it may choose */
  weight?: number;
  /** a rival's heavy blow (chosen by its own share), Ren's heavy attack (the finisher that may wound him: the game's V2B1-1) */
  heavy?: boolean;
}
/** who decides for a fighter: the automatic that places its supports (Ren), or a rival's AI */
export type AutoBrain = 'player' | 'rival';
export interface AutoFighter {
  id: string;
  side: 'ren' | 'foe';
  hp: number; atk: number; def: number; end: number; viv: number;
  /** the Speed its charges are written at (10 for Ren; a rival's kit's, KIT_VIV) */
  tempo: number;
  /** AP added at the start (Ren's gear and a friend) */
  apStart?: number;
  /** the damage it takes × (the night's tampering) */
  taken?: number;
  /** a rival's trait added to its dodge and to its guard (AC-05) */
  dodgeBonus?: number;
  guardBonus?: number;
  light: AutoAction;
  /** Ren: his four skills in his order of priority (AC-09); a rival: its heavy blow and its own skills */
  skills: AutoAction[];
  /** a rival's chain of light blows */
  combo?: AutoAction | null;
  /** a rival's habits: the share of its choices a ready skill takes, its heavy blow's, its combo's among its light blows */
  ai?: { chance: number; heavy: number; combo: number };
  brain: AutoBrain;
}

/** The rules the operator kept (journal Passe AC4); every number of the prototype's complete model (briefs/combat-auto.md § 16.1). */
export const AUTO_RULES = {
  /** the AP: 1 at the start (CB-5), 5 at most (C2-3), +1 a light attack that lands, hit or guarded (DB-3), once per action (AC-03) */
  ap: { start: 1, max: 5, light: 1 },
  /** DB5-4 « 10 s, ×2, jauge de 70 » (A3); the gauge's decay per second (today's 1.8 a gauge of 100, × 70 / 100, half as fast since DB11-1); a guarded
   *  blow fills the guarder's gauge ×2 (DB9) */
  gauge: { max: 70, decay: 0.63, guardMul: 2 },
  brk: { stun: 10, dmg: 2 },
  /** the guard takes 80 % off (DB5-2's « garde à −80 % », one rule for both) */
  guardReduce: 0.8,
  /** the reactions (AC-05): the dodge 12 % × 2·Spd / (Spd + the attacker's Spd); the guard 35 % × 2·Def / (Def + the attacker's Atk), ×2 against a skill or a
   *  heavy blow seen coming (its charge shows), at most 90 % */
  react: { dodge: 0.12, guard: 0.35, skillGuard: 2, cap: 0.9 },
  /** a fighter charging anything but its light attack, or striking its own enchaînement, neither guards nor dodges (AC-05, « la charge qui expose ») */
  exposed: true,
  /** every health × 2: DB5's « en 2 et 5 min » held (AC-13) */
  hpScale: 2,
  /** each fighter's first charge begins after a draw in [0, start] s */
  start: 0.6,
  /** the form of the day: each fighter's blows × 1 ± form, drawn before the bout from its own stream, said on the match sheet (AC-08) */
  form: 0.15,
  /** a duel this long ends on the health shares */
  maxT: 1200,
};
export type AutoRules = typeof AUTO_RULES;

/** one line of a duel's script (the arena shows it, lot 2): t the time (s, two decimals), who the fighter's id; `s` (with `trace`) both fighters' state just after
 *  it, [AP of the first, gauge of the first, AP of the second, gauge of the second] (the gauge settled at that time, a broken one full) */
export interface AutoEvent { t: number; who: string; ev: 'charge' | 'ward' | 'boost' | 'hit' | 'guarded' | 'dodged' | 'break'; act?: string; at?: number; dmg?: number; hp?: number; hit?: number; s?: [number, number, number, number] }
export interface AutoCount { acts: number; skills: number; lights: number; dodged: number; guarded: number; hit: number; hits: number; breaks: number; dmg: number; dmgBroken: number; skillDmg: number; wasted: number }
export interface AutoResult {
  /** 0 or 1 by the K.O.; null past `maxT` (decide on the health shares: autoWinner) */
  winner: 0 | 1 | null;
  /** the blow that ended it: 'light', 'heavy' (a heavy blow or Ren's heavy attack) or 'skill' */
  finisher: 'light' | 'heavy' | 'skill' | null;
  t: number;
  hp: [number, number]; maxHp: [number, number];
  /** each fighter's form of the day (its blows ×) */
  form: [number, number];
  n: [AutoCount, AutoCount];
  /** how many times the lead in health share changed hands */
  leadChanges: number;
  log: AutoEvent[] | null;
}

/** the winner by the K.O., or on the health shares past `maxT` (the first fighter on a tie) */
export const autoWinner = (r: Pick<AutoResult, 'winner' | 'hp' | 'maxHp'>): 0 | 1 => r.winner ?? (r.hp[0] / r.maxHp[0] >= r.hp[1] / r.maxHp[1] ? 0 : 1);

const ratio = (a: number, b: number): number => (2 * a) / Math.max(1e-6, a + b);
const zero = (): AutoCount => ({ acts: 0, skills: 0, lights: 0, dodged: 0, guarded: 0, hit: 0, hits: 0, breaks: 0, dmg: 0, dmgBroken: 0, skillDmg: 0, wasted: 0 });

interface Combo { a: AutoAction; hits: readonly number[]; i: number; ap: boolean }
interface Side {
  x: AutoFighter; hp: number; maxHp: number; ap: number; g: number; gT: number; broken: boolean; stunEnd: number; cd: Record<string, number>;
  ward: { until: number; dmg: number; gauge: number } | null; boost: { until: number; dmg: number; gauge: number } | null;
  act: AutoAction | null; at: number; pending: boolean; combo: Combo | null; comboAt: number; form: number; n: AutoCount;
}

/** what a decider sees: the time, its side and the other, and the duel's own helpers */
export interface AutoView {
  t: number; me: Side; foe: Side; rules: AutoRules;
  usable(a: AutoAction): boolean;
  /** a side's gauge now */
  gauge(s: Side): number;
  /** an action's charge for a side, at its Speed */
  chargeOf(s: Side, a: AutoAction): number;
  /** the duel's own draw (a rival's AI) */
  rand(): number;
}
export type AutoDecider = (v: AutoView, x: AutoFighter) => AutoAction;

/**
 * One duel. `seed` decides every draw (the reactions, the rivals' choices, the initiative) and, from its own stream, the forms of the day. `o.log` keeps
 * the script, `o.trace` each of its events' state (the arena reads it); `o.rules` another set of rules (the laboratory); `o.deciders` replaces a brain (the
 * laboratory).
 */
export function autoDuel(A: AutoFighter, B: AutoFighter, seed: number, o: { rules?: AutoRules; log?: boolean; trace?: boolean; deciders?: Partial<Record<AutoBrain, AutoDecider>> } = {}): AutoResult {
  const R = o.rules ?? AUTO_RULES, s0 = seed >>> 0 || 1, rng = new Rng(s0), rand = () => rng.next(), log: AutoEvent[] | null = o.log ? [] : null;
  /** a line of the script, with both fighters' state just after it when traced */
  const put = (e: AutoEvent): void => { if (o.trace) e.s = [F[0].ap, +gaugeNow(F[0]).toFixed(2), F[1].ap, +gaugeNow(F[1]).toFixed(2)]; log!.push(e); };
  const mk = (x: AutoFighter): Side => {
    const hp = Math.round(x.hp * R.hpScale);
    return { x, hp, maxHp: hp, ap: R.ap.start + (x.apStart ?? 0), g: 0, gT: 0, broken: false, stunEnd: 0, cd: {}, ward: null, boost: null, act: null, at: 0, pending: false, combo: null, comboAt: 0, form: 1, n: zero() };
  };
  const F: [Side, Side] = [mk(A), mk(B)];
  // the form of the day, from its own stream: the duel's other draws stay the same with or without it
  { const fm = autoFormsOf(s0, R); F[0].form = fm[0]; F[1].form = fm[1]; }
  const other = (f: Side): Side => (f === F[0] ? F[1] : F[0]);
  const speed = (f: Side): number => f.x.tempo / Math.max(1, f.x.viv);
  let t = 0, over = false, winner: 0 | 1 | null = null, finisher: AutoResult['finisher'] = null, leadChanges = 0, lastLead = 0;
  const T = (): number => +t.toFixed(2);
  const gaugeNow = (f: Side): number => (f.broken ? R.gauge.max : Math.max(0, f.g - R.gauge.decay * (t - f.gT)));
  const settle = (f: Side): void => {
    if (f.broken && t >= f.stunEnd) { f.broken = false; f.g = 0; f.gT = f.stunEnd; }
    f.g = gaugeNow(f); f.gT = t;
  };
  const usable = (f: Side, a: AutoAction): boolean => (a.ap ?? 0) <= f.ap && (!a.cooldown || (f.cd[a.id] ?? 0) <= t + 1e-9);
  const view = (f: Side): AutoView => ({ t, me: f, foe: other(f), rules: R, usable: (a) => usable(f, a), gauge: gaugeNow, chargeOf: (g, a) => a.charge * speed(g), rand });
  const decide = (f: Side): AutoAction => (o.deciders?.[f.x.brain] ?? DECIDERS[f.x.brain])(view(f), f.x);

  function start(f: Side, a: AutoAction): void {
    settle(f);
    if (a.ap) f.ap -= a.ap;
    if (a.cooldown) f.cd[a.id] = t + a.cooldown;
    f.act = a; f.at = t + a.charge * speed(f); f.n.acts++;
    if (a.kind === 'light') f.n.lights++; else f.n.skills++;
    log && put({ t: T(), who: f.x.id, ev: 'charge', act: a.id, at: +f.at.toFixed(2) });
  }
  /** an action leaves: a ward or a boost takes hold; a blow strikes its first hit (true while an enchaînement goes on) */
  function land(f: Side): boolean {
    const a = f.act!; f.act = null;
    settle(f); settle(other(f));
    if (a.ward) { f.ward = { until: t + a.ward.dur, dmg: a.ward.dmg, gauge: a.ward.gauge }; log && put({ t: T(), who: f.x.id, ev: 'ward', act: a.id }); return false; }
    if (a.boost) { f.boost = { until: t + a.boost.dur, dmg: a.boost.dmg, gauge: a.boost.gauge }; log && put({ t: T(), who: f.x.id, ev: 'boost', act: a.id }); return false; }
    f.combo = { a, hits: a.hits ?? [1], i: 0, ap: false };
    hitOnce(f);
    if (over || !f.combo) return false;
    if (f.combo.i < f.combo.hits.length) { f.comboAt = t + (a.gap ?? 0.3); return true; }
    f.combo = null; return false;
  }
  /** one hit: the defender's reaction, the damage, the AP (once per light action), the gauge; a break pauses the target's charge and ends its enchaînement */
  function hitOnce(f: Side): void {
    const c = f.combo!, a = c.a, share = c.hits[c.i], g = other(f); c.i++;
    settle(g);
    const exposed = R.exposed && ((!!g.act && g.act.kind !== 'light') || !!g.combo);
    let res: 'hit' | 'guarded' | 'dodged' = 'hit';
    if (!g.broken && !exposed) {
      if (rand() < R.react.dodge * ratio(g.x.viv, f.x.viv) + (g.x.dodgeBonus ?? 0)) res = 'dodged';
      else if (!a.pierce && rand() < Math.min(R.react.cap, R.react.guard * ratio(g.x.def, f.x.atk) * (a.kind === 'light' ? 1 : R.react.skillGuard) + (g.x.guardBonus ?? 0))) res = 'guarded';
    }
    if (res === 'dodged') { g.n.dodged++; if (a.kind !== 'light') f.n.wasted++; log && put({ t: T(), who: f.x.id, ev: 'dodged', act: a.id }); return; }
    const wardOn = !!g.ward && g.ward.until > t, boostOn = !!f.boost && f.boost.until > t;
    let k = hitFactor(f.x.atk, g.x.def) * (res === 'guarded' ? 1 - R.guardReduce : 1) * (g.x.taken ?? 1) * f.form;
    if (boostOn) k *= f.boost!.dmg;
    if (wardOn) k *= g.ward!.dmg;
    if (g.broken) k *= R.brk.dmg;
    const dmg = Math.max(1, Math.round((a.power ?? 0) * share * k));
    g.hp = Math.max(0, g.hp - dmg); f.n.dmg += dmg; if (g.broken) f.n.dmgBroken += dmg; if (a.kind !== 'light') f.n.skillDmg += dmg;
    if (res === 'guarded') g.n.guarded++; else g.n.hit++;
    f.n.hits++;
    if (a.kind === 'light' && !c.ap) { c.ap = true; f.ap = Math.min(R.ap.max, f.ap + R.ap.light); }
    log && put({ t: T(), who: f.x.id, ev: res, act: a.id, dmg, hp: g.hp, hit: c.i });
    if (g.hp <= 0) { over = true; winner = f === F[0] ? 0 : 1; finisher = a.kind === 'light' ? 'light' : a.heavy ? 'heavy' : 'skill'; return; }
    if (!g.broken) {
      const add = (a.gauge ?? 0) * share * (10 / Math.max(1, g.x.end)) * (res === 'guarded' ? R.gauge.guardMul : 1) * (boostOn ? f.boost!.gauge : 1) * (wardOn ? g.ward!.gauge : 1);
      g.g = Math.min(R.gauge.max, gaugeNow(g) + add); g.gT = t;
      if (g.g >= R.gauge.max) {
        g.broken = true; g.stunEnd = t + R.brk.stun; g.n.breaks++;
        // the break pauses the charge under way (nothing cuts it, V2-2): it leaves the stun's length later; it ends an enchaînement under way
        if (g.act) g.at += R.brk.stun;
        if (g.combo) { g.combo = null; g.pending = true; g.at = g.stunEnd; }
        log && put({ t: T(), who: g.x.id, ev: 'break' });
      }
    }
  }
  const after = (f: Side): void => { if (f.broken) { f.pending = true; f.at = f.stunEnd; } else start(f, decide(f)); };
  const leadNow = (): void => { const ld = Math.sign(F[0].hp / F[0].maxHp - F[1].hp / F[1].maxHp); if (ld && lastLead && ld !== lastLead) leadChanges++; if (ld) lastLead = ld; };

  // the initiative
  for (const f of F) { f.at = rand() * R.start; f.pending = true; }
  while (!over) {
    // the next event: a charge that leaves, an enchaînement's next hit, or a fighter free to choose (after its initiative or a stun); Ren first on a tie
    let next: Side = F[0], nt = Infinity;
    for (const f of F) { const ft = f.combo ? f.comboAt : f.pending ? Math.max(f.at, f.broken ? f.stunEnd : 0) : f.at; if (ft < nt - 1e-12) { nt = ft; next = f; } }
    t = nt;
    if (t > R.maxT) break;
    if (next.combo) {
      hitOnce(next); if (over) break; leadNow();
      if (next.combo && next.combo.i < next.combo.hits.length) { next.comboAt = t + (next.combo.a.gap ?? 0.3); continue; }
      if (next.combo) { next.combo = null; after(next); }
      continue;
    }
    if (next.pending) { next.pending = false; settle(next); start(next, decide(next)); continue; }
    const inCombo = land(next);
    if (over) break;
    leadNow();
    if (!inCombo) after(next);
  }
  return { winner, finisher, t: T(), hp: [F[0].hp, F[1].hp], maxHp: [F[0].maxHp, F[1].maxHp], form: [F[0].form, F[1].form], n: [F[0].n, F[1].n], leadChanges, log };
}

/** the forms of the day a duel of this seed draws, before it (AC-08: said on the match sheet), from their own stream: the duel's other draws stay the same
 *  with or without them */
export function autoFormsOf(seed: number, R: Pick<AutoRules, 'form'> = AUTO_RULES): [number, number] {
  const s0 = seed >>> 0 || 1, fr = new Rng((s0 ^ 0x9e3779b9) >>> 0 || 1);
  return [1 + R.form * (2 * fr.next() - 1), 1 + R.form * (2 * fr.next() - 1)];
}

// --------------------------------------------------------------------------------------------------------------------------------- the deciders

const active = (e: { until: number } | null, t: number): boolean => !!e && e.until > t;

/** The automatic that places its supports (AC-09; the prototype's `autoSmartDecider`, journal Passe AC3), in the order of the player's skills (Ren's
 *  `skills`: the first that holds, AC-09 « le joueur règle ses quatre compétences et leur ordre »):
 *  - a ward when the opponent charges a heavy blow or a skill that would leave while the ward is up, or when its own gauge passes two thirds; a ward that
 *    covers (`cover`) also as soon as the AP left after it still pay an offensive skill, unless the opponent is broken;
 *  - a boost when the opponent is broken, or when an offensive skill ready now can follow it (its AP after the boost's);
 *  - an offensive skill as soon as it can pay it and it is ready;
 *  - else the light attack, which gains the AP. */
export const playerDecider: AutoDecider = (v, x) => {
  const { me, foe, t } = v, g = v.gauge(me), foeLeft = foe.act ? foe.at - t : 0, foeBig = !!foe.act && foe.act.kind !== 'light';
  let wardTried = false, boostTried = false;
  for (const s of x.skills) {
    if (!v.usable(s)) continue;
    if (s.ward) {
      // the first ward it could raise is the one it weighs (one ward at a time)
      if (wardTried || active(me.ward, t)) continue;
      wardTried = true;
      if ((foeBig && foeLeft > v.chargeOf(me, s)) || g >= (2 / 3) * v.rules.gauge.max) return s;
      if (s.cover && !foe.broken && x.skills.some((o) => offensive(o) && me.ap >= (s.ap ?? 0) + (o.ap ?? 0))) return s;
      continue;
    }
    if (s.boost) {
      if (boostTried || active(me.boost, t)) continue;
      boostTried = true;
      if (foe.broken || x.skills.some((o) => offensive(o) && v.usable(o) && me.ap >= (o.ap ?? 0) + (s.ap ?? 0))) return s;
      continue;
    }
    return s;
  }
  return x.light;
};
const offensive = (a: AutoAction): boolean => !a.ward && !a.boost && a.kind !== 'light';

/** A rival's AI (C3's habits, the prototype's `rivalDecider`): its ward when its gauge passes half; a skill of its own when one is ready, by its share
 *  `chance` and its skills' weights; else its heavy blow by its share; else a combo by its share of its light blows; else its light attack. */
export const rivalDecider: AutoDecider = (v, x) => {
  const { me, t } = v, S = x.skills, g = v.gauge(me);
  const ward = S.find((s) => s.ward && v.usable(s) && g >= 0.5 * v.rules.gauge.max && !active(me.ward, t));
  if (ward) return ward;
  const sk = S.filter((s) => !s.heavy && v.usable(s) && !(s.boost && active(me.boost, t)));
  if (sk.length && v.rand() < (x.ai?.chance ?? 0.3)) {
    let r = v.rand() * sk.reduce((n, s) => n + (s.weight ?? 1), 0);
    for (const s of sk) { r -= s.weight ?? 1; if (r <= 0) return s; }
    return sk[sk.length - 1];
  }
  const heavy = S.find((s) => s.heavy && v.usable(s));
  if (heavy && v.rand() < (x.ai?.heavy ?? 0.25)) return heavy;
  if (x.combo && v.rand() < (x.ai?.combo ?? 0)) return x.combo;
  return x.light;
};

export const DECIDERS: Record<AutoBrain, AutoDecider> = { player: playerDecider, rival: rivalDecider };
