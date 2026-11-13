import { Rng } from '../core/rng';
import { hitFactor } from './stats';

/** The duel played by the computer (the operator's combat rules sheet, read back in journal Passe AC4; briefs/combat-auto.md, its § 17, then the second
 *  workshop's § 26, journal Passes SY1 / SY2): a TIMELINE where each fighter chooses an action, CHARGES it (the operator's « zone de charge/attente avant
 *  d'agir »: its time × 10 / its Speed, DB7-1) and it LEAVES, in one blow or an ENCHAÎNEMENT (AC-02), then chooses again. The two charges run at the same time;
 *  nothing cuts a charge (V2-2); a break pauses it (DB5-4, A3: a gauge of 70, stunned 10 s, the damage taken ×2).
 *  THE SAME RULES FOR EVERY FIGHTER (the operator's SY-01 « Les six changements : les mêmes règles pour tous », journal Passe SY2), Ren as his rivals: a light
 *  attack (its weapon's enchaînement), a heavy blow (SY-02, A3: a base attack outside the four skills, no AP, with its DB5-3 cooldown), its skills paid in AP
 *  (AC-03: +1 a light attack that lands, 1 at the start, 5 at most), each skill coming back 5 × its charge after it leaves (DB5-3, A3); the guard and the dodge
 *  drawn from the stats alone (AC-05 without the rivals' traits), the guard ×2 against a big action seen coming, a fighter charging anything but its light
 *  attack neither guards nor dodges; each fighter's form of the day ±15 % (AC-08); every health ×2 (DB5 held, AC-13); no riposte (AC-07, A3). One automatic
 *  plays every fighter in the order of its kit (AC-09, SY-01); an off-screen bout is the same duel (AC-18).
 *  ONE DRAW PER BLOW (SY-04 « Un tirage par coup »): a reaction's draw is keyed by the striker, its action's rank and the hit's rank, the initiative by the
 *  side, a decision's by the side and its rank: a choice changes only what follows from it. The forms come from their own stream.
 *  Pure: no DOM, no clock, no Math.random; the same seed gives the same duel. Every version 2 game plays it; today's game (`v2=0`) keeps its own duel. */

export type AutoKind = 'light' | 'heavy' | 'skill';
export type AutoFamily = 'offensive' | 'defensive' | 'support';
/** a ward (on oneself: the damage and the gauge one takes ×) or a boost (one's own blows' damage and gauge ×), for `dur` seconds */
export interface AutoEffect { dur: number; dmg: number; gauge: number }
/** an action on the timeline */
export interface AutoAction {
  id: string;
  /** 'light' a fighter's light attack: the only kind that does not expose its charger; 'heavy' its heavy blow; 'skill' one of its skills */
  kind: AutoKind;
  family?: AutoFamily;
  /** its charge (s) at Speed 10 (`AutoFighter.tempo`) */
  charge: number;
  /** its damage at equal Attack and Defence, before the form, a guard, a ward, a boost or a break */
  power?: number;
  /** what it adds to the target's gauge at Endurance 10 */
  gauge?: number;
  /** its cost in AP (the skills) */
  ap?: number;
  /** after it leaves, it waits this long before it can be chosen again (s; DB5-3) */
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
  /** the heavy blow (kind 'heavy': the finisher that may wound Ren, the game's V2B1-1) */
  heavy?: boolean;
}
/** who decides for a fighter: Ren (the player's side) or a rival; both play the same automatic unless `o.deciders` replaces one (a tactic, the laboratory) */
export type AutoBrain = 'player' | 'rival';
export interface AutoFighter {
  id: string;
  side: 'ren' | 'foe';
  hp: number; atk: number; def: number; end: number; viv: number;
  /** the Speed its charges are written at: 10 for every fighter (SY-01, the same tables) */
  tempo: number;
  /** AP added at the start (Ren's gear and a friend) */
  apStart?: number;
  /** the damage it takes × (the night's tampering) */
  taken?: number;
  light: AutoAction;
  /** its heavy blow (SY-02, A3): a base attack, no AP, its own cooldown */
  heavy: AutoAction;
  /** its skills in its order of priority (AC-09: Ren's four in the player's order; a rival's own) */
  skills: AutoAction[];
  /** its tactic (SY-08): one condition per skill of `skills`, in their order; absent = the automatic's ('auto' on every line) */
  tactic?: readonly AutoCond[];
  brain: AutoBrain;
}

/** The rules the operator kept (journal Passes AC4, SY2). */
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

/** one line of a duel's script (the arena shows it): t the time (s, two decimals), who the fighter's id; `s` (with `trace`) both fighters' state just after it,
 *  [AP of the first, gauge of the first, AP of the second, gauge of the second] (the gauge settled at that time, a broken one full) */
export interface AutoEvent { t: number; who: string; ev: 'charge' | 'ward' | 'boost' | 'hit' | 'guarded' | 'dodged' | 'break'; act?: string; at?: number; dmg?: number; hp?: number; hit?: number; s?: [number, number, number, number]; fx?: number }
export interface AutoCount { acts: number; skills: number; heavies: number; lights: number; dodged: number; guarded: number; hit: number; hits: number; breaks: number; dmg: number; dmgBroken: number; skillDmg: number; wasted: number }
export interface AutoResult {
  /** 0 or 1 by the K.O.; null past `maxT` (decide on the health shares: autoWinner) */
  winner: 0 | 1 | null;
  /** the blow that ended it: 'light', 'heavy' (a heavy blow) or 'skill' */
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

/** a keyed draw in [0, 1): the duel's seed and four numbers (SY-04: one draw per blow, its key the striker, its action's rank, the hit's rank, the purpose) */
export function autoDraw(seed: number, a: number, b: number, c: number, d: number): number {
  let x = (seed >>> 0) ^ Math.imul(a + 0x9e37, 0x85ebca6b) ^ Math.imul(b + 0x7f4a, 0xc2b2ae35) ^ Math.imul(c + 0x165667b1, 0x27d4eb2f) ^ Math.imul(d + 0x3c6ef372, 0x9e3779b1);
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b); x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35); x ^= x >>> 16;
  let t = (x + 0x6d2b79f5) >>> 0; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
/** the purposes of a keyed draw */
const DRAW = { dodge: 1, guard: 2, start: 3, decide: 4 } as const;

const ratio = (a: number, b: number): number => (2 * a) / Math.max(1e-6, a + b);
const zero = (): AutoCount => ({ acts: 0, skills: 0, heavies: 0, lights: 0, dodged: 0, guarded: 0, hit: 0, hits: 0, breaks: 0, dmg: 0, dmgBroken: 0, skillDmg: 0, wasted: 0 });

interface Combo { a: AutoAction; hits: readonly number[]; i: number; ap: boolean; k: number }
export interface AutoSide {
  i: 0 | 1; x: AutoFighter; hp: number; maxHp: number; ap: number; g: number; gT: number; broken: boolean; stunEnd: number; cd: Record<string, number>;
  ward: { until: number; dmg: number; gauge: number } | null; boost: { until: number; dmg: number; gauge: number } | null;
  act: AutoAction | null; at: number; pending: boolean; combo: Combo | null; comboAt: number; form: number; n: AutoCount; dec: number;
}

/** what a decider sees: the time, its side and the other, and the duel's own helpers */
export interface AutoView {
  t: number; me: AutoSide; foe: AutoSide; rules: AutoRules;
  usable(a: AutoAction): boolean;
  /** a side's gauge now */
  gauge(s: AutoSide): number;
  /** an action's charge for a side, at its Speed */
  chargeOf(s: AutoSide, a: AutoAction): number;
  /** a draw of this decision (keyed: SY-04) */
  rand(): number;
}
export type AutoDecider = (v: AutoView, x: AutoFighter) => AutoAction;
/** a press of the player's hand: at the duel's time `t` (s), one of the first fighter's skills */
export interface AutoCommand { t: number; skill: string }

/**
 * One duel. `seed` keys every draw (the reactions, the initiative, a decider's draws) and, from its own stream, the forms of the day. `o.log` keeps the script,
 * `o.trace` each of its events' state (the arena reads it); `o.rules` another set of rules (the laboratory); `o.deciders` replaces a brain's automatic (a
 * tactic, the laboratory); `o.commands` the player's presses (the hand, SY-09): the first fighter's skills pressed during the duel.
 */
export function autoDuel(A: AutoFighter, B: AutoFighter, seed: number, o: { rules?: AutoRules; log?: boolean; trace?: boolean; deciders?: Partial<Record<AutoBrain, AutoDecider>>; commands?: readonly AutoCommand[] } = {}): AutoResult {
  const R = o.rules ?? AUTO_RULES, s0 = seed >>> 0 || 1, log: AutoEvent[] | null = o.log ? [] : null;
  /** a line of the script, with both fighters' state just after it when traced */
  const put = (e: AutoEvent): void => { if (o.trace) e.s = [F[0].ap, +gaugeNow(F[0]).toFixed(2), F[1].ap, +gaugeNow(F[1]).toFixed(2)]; log!.push(e); };
  const mk = (x: AutoFighter, i: 0 | 1): AutoSide => {
    const hp = Math.round(x.hp * R.hpScale);
    return { i, x, hp, maxHp: hp, ap: R.ap.start + (x.apStart ?? 0), g: 0, gT: 0, broken: false, stunEnd: 0, cd: {}, ward: null, boost: null, act: null, at: 0, pending: false, combo: null, comboAt: 0, form: 1, n: zero(), dec: 0 };
  };
  const F: [AutoSide, AutoSide] = [mk(A, 0), mk(B, 1)];
  { const fm = autoFormsOf(s0, R); F[0].form = fm[0]; F[1].form = fm[1]; }
  const other = (f: AutoSide): AutoSide => (f === F[0] ? F[1] : F[0]);
  const speed = (f: AutoSide): number => f.x.tempo / Math.max(1, f.x.viv);
  let t = 0, over = false, winner: 0 | 1 | null = null, finisher: AutoResult['finisher'] = null, leadChanges = 0, lastLead = 0;
  const T = (): number => +t.toFixed(2);
  const gaugeNow = (f: AutoSide): number => (f.broken ? R.gauge.max : Math.max(0, f.g - R.gauge.decay * (t - f.gT)));
  const settle = (f: AutoSide): void => {
    if (f.broken && t >= f.stunEnd) { f.broken = false; f.g = 0; f.gT = f.stunEnd; }
    f.g = gaugeNow(f); f.gT = t;
  };
  const usable = (f: AutoSide, a: AutoAction): boolean => (a.ap ?? 0) <= f.ap && (!a.cooldown || (f.cd[a.id] ?? 0) <= t + 1e-9);
  const view = (f: AutoSide): AutoView => { let c = 0; const d = f.dec; return { t, me: f, foe: other(f), rules: R, usable: (a) => usable(f, a), gauge: gaugeNow, chargeOf: (g, a) => a.charge * speed(g), rand: () => autoDraw(s0, f.i, d, c++, DRAW.decide) }; };
  // the hand (the operator's SY-09 « Au prochain choix de Ren, une compétence en attente », journal Passe SY2): a skill pressed leaves at the first fighter's next
  // choice once its AP and its cooldown allow it, waiting until they do; one waits at a time, a later press replacing it; the tactic decides the rest. Nothing
  // before a press changes (one draw per blow, SY-04): the arena replays the duel from the press with the presses so far
  const cmds = [...(o.commands ?? [])].sort((a, b) => a.t - b.t);
  let cmdDone = -1;
  const pressed = (f: AutoSide): AutoAction | null => {
    if (f.i !== 0 || !cmds.length) return null;
    let k = -1;
    for (let j = 0; j < cmds.length && cmds[j].t <= t + 1e-9; j++) k = j;
    if (k <= cmdDone) return null;
    const a = f.x.skills.find((s) => s.id === cmds[k].skill);
    if (!a) { cmdDone = k; return null; }
    if (!usable(f, a)) return null;
    cmdDone = k; return a;
  };
  const decide = (f: AutoSide): AutoAction => { const p = pressed(f), a = p ?? (o.deciders?.[f.x.brain] ?? DECIDERS[f.x.brain])(view(f), f.x); f.dec++; return a; };

  function start(f: AutoSide, a: AutoAction): void {
    settle(f);
    if (a.ap) f.ap -= a.ap;
    if (a.cooldown) f.cd[a.id] = t + a.cooldown;
    f.act = a; f.at = t + a.charge * speed(f); f.n.acts++;
    if (a.kind === 'light') f.n.lights++; else if (a.kind === 'heavy') f.n.heavies++; else f.n.skills++;
    log && put({ t: T(), who: f.x.id, ev: 'charge', act: a.id, at: +f.at.toFixed(2) });
  }
  /** an action leaves: a ward or a boost takes hold; a blow strikes its first hit (true while an enchaînement goes on) */
  function land(f: AutoSide): boolean {
    const a = f.act!; f.act = null;
    settle(f); settle(other(f));
    if (a.ward) { f.ward = { until: t + a.ward.dur, dmg: a.ward.dmg, gauge: a.ward.gauge }; log && put({ t: T(), who: f.x.id, ev: 'ward', act: a.id }); return false; }
    if (a.boost) { f.boost = { until: t + a.boost.dur, dmg: a.boost.dmg, gauge: a.boost.gauge }; log && put({ t: T(), who: f.x.id, ev: 'boost', act: a.id }); return false; }
    f.combo = { a, hits: a.hits ?? [1], i: 0, ap: false, k: f.n.acts };
    hitOnce(f);
    if (over || !f.combo) return false;
    if (f.combo.i < f.combo.hits.length) { f.comboAt = t + (a.gap ?? 0.3); return true; }
    f.combo = null; return false;
  }
  /** one hit: the defender's reaction (its own keyed draws), the damage, the AP (once per light action), the gauge; a break pauses the target's charge and ends
   *  its enchaînement */
  function hitOnce(f: AutoSide): void {
    const c = f.combo!, a = c.a, share = c.hits[c.i], g = other(f); c.i++;
    settle(g);
    const exposed = R.exposed && ((!!g.act && g.act.kind !== 'light') || !!g.combo);
    let res: 'hit' | 'guarded' | 'dodged' = 'hit';
    if (!g.broken && !exposed) {
      if (autoDraw(s0, f.i, c.k, c.i, DRAW.dodge) < R.react.dodge * ratio(g.x.viv, f.x.viv)) res = 'dodged';
      else if (!a.pierce && autoDraw(s0, f.i, c.k, c.i, DRAW.guard) < Math.min(R.react.cap, R.react.guard * ratio(g.x.def, f.x.atk) * (a.kind === 'light' ? 1 : R.react.skillGuard))) res = 'guarded';
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
    // traced: whether the target's ward and the striker's boost weighed on this blow (the script's times are written to the hundredth: a blow within 5 ms of an
    // effect's end cannot be told from them; journal Passe SL3, the arena's gauge)
    log && put({ t: T(), who: f.x.id, ev: res, act: a.id, dmg, hp: g.hp, hit: c.i, ...(o.trace ? { fx: (wardOn ? 1 : 0) | (boostOn ? 2 : 0) } : {}) });
    if (g.hp <= 0) { over = true; winner = f === F[0] ? 0 : 1; finisher = a.kind; return; }
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
  const after = (f: AutoSide): void => { if (f.broken) { f.pending = true; f.at = f.stunEnd; } else start(f, decide(f)); };
  const leadNow = (): void => { const ld = Math.sign(F[0].hp / F[0].maxHp - F[1].hp / F[1].maxHp); if (ld && lastLead && ld !== lastLead) leadChanges++; if (ld) lastLead = ld; };

  // the initiative (each side its own keyed draw)
  for (const f of F) { f.at = autoDraw(s0, f.i, 0, 0, DRAW.start) * R.start; f.pending = true; }
  while (!over) {
    // the next event: a charge that leaves, an enchaînement's next hit, or a fighter free to choose (after its initiative or a stun); Ren first on a tie
    let next: AutoSide = F[0], nt = Infinity;
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

// --------------------------------------------------------------------------------------------------------------------------------- the automatic

const active = (e: { until: number } | null, t: number): boolean => !!e && e.until > t;
export const offensive = (a: AutoAction): boolean => !a.ward && !a.boost && a.kind === 'skill';

/** a fighter's strongest offensive skill (its power; the first of its order on a tie), the one its automatic keeps for the break (SL1-3) */
export function strongestOf(x: AutoFighter): AutoAction | null {
  let best: AutoAction | null = null;
  for (const s of x.skills) if (offensive(s) && (s.power ?? 0) > (best?.power ?? -1)) best = s;
  return best;
}
/** the opponent is broken long enough for this action to land before it stands up again */
export const brokenFor = (v: AutoView, a: AutoAction): boolean => v.foe.broken && v.foe.stunEnd - v.t >= v.chargeOf(v.me, a);

/** The automatic's skills (AC-09; the prototype's `autoSmartDecider`, journal Passe AC3), in the order of the fighter's skills (the first that holds):
 *  - a ward when the opponent charges a big action that would leave while the ward is up, or when its own gauge passes two thirds; a ward that covers (`cover`)
 *    also as soon as the AP left after it still pay an offensive skill, unless the opponent is broken;
 *  - a boost as soon as it is ready (one at a time): the operator's SY-07 asks the automatic to be worth the simple tactics and random presses, and the boost
 *    held for an offensive skill to follow was below both (journal Passe SL1: the boosts as soon as ready 90 % of titles against 36 %, random presses of the
 *    supports 69 %, the race unchanged);
 *  - an offensive skill as soon as it can pay it and it is ready, but the strongest kept for the break (the operator's SL1-3 « L’automatique garde la plus
 *    forte pour la rupture (au lot 2, la course recalée) », journal Passe SL2): it leaves when the opponent is broken long enough for it to land, or, the AP
 *    full and nothing else held, rather than lose them (the tactic the workshop measured: tools/auto-lab.mjs AUTOS.rupture);
 *  - else null (the base attacks decide). */
export function autoSkillChoice(v: AutoView, x: AutoFighter): AutoAction | null {
  return tacticChoice(v, x, null);
}

/** The conditions of a tactic (the operator's SY-08 « Une condition par compétence, l’ordre gardé », journal Passe SY2; briefs/combat-auto.md § 25.5): each of
 *  the four skills carries one, the order of the four stays the priority. 'auto' the automatic's own rule for that skill (a new game's tactic: every line
 *  'auto'); the others each read only what the arena shows (the bars of charge, the gauges, the health, the AP). */
export type AutoCond = 'auto' | 'ready' | 'broken' | 'incoming' | 'gauge' | 'hurt' | 'finish' | 'follow' | 'never';
export const AUTO_CONDS: readonly AutoCond[] = ['auto', 'ready', 'broken', 'incoming', 'gauge', 'hurt', 'finish', 'follow', 'never'];
/** whether a condition other than 'auto' holds for a skill now */
export function condHolds(c: AutoCond, v: AutoView, x: AutoFighter, s: AutoAction): boolean {
  const { me, foe, t } = v;
  switch (c) {
    case 'ready': return true;
    // the opponent broken long enough for it to land
    case 'broken': return brokenFor(v, s);
    // the opponent charging a big action: a ward up before it lands and still up when it does; any other skill leaving before it (it strikes him exposed)
    case 'incoming': {
      if (!foe.act || foe.act.kind === 'light') return false;
      const land = t + v.chargeOf(me, s);
      return s.ward ? foe.at > land && foe.at < land + s.ward.dur : foe.at >= land;
    }
    case 'gauge': return v.gauge(me) >= (2 / 3) * v.rules.gauge.max;
    case 'hurt': return me.hp / me.maxHp < 0.5;
    case 'finish': return foe.hp / foe.maxHp < 1 / 3;
    // an offensive skill can follow it (its AP left after this one, its cooldown ready)
    case 'follow': return x.skills.some((o) => o !== s && offensive(o) && v.usable(o) && me.ap >= (o.ap ?? 0) + (s.ap ?? 0));
    default: return false;
  }
}
/** The skill a fighter charges now by its tactic (`conds`, one per skill in its order; null or a missing line = 'auto'), the first whose condition holds and
 *  that it can pay (its AP, its cooldown), one ward and one boost at a time; else null (the base attacks decide). The automatic's rules ('auto'):
 *  - a ward when the opponent charges a big action that would leave while the ward is up, or when its own gauge passes two thirds; a ward that covers (`cover`)
 *    also as soon as the AP left after it still pay an offensive skill, unless the opponent is broken; the first ward it could raise is the one it weighs;
 *  - a boost as soon as it is ready: the operator's SY-07 asks the automatic to be worth the simple tactics and random presses, and the boost held for an
 *    offensive skill to follow was below both (journal Passe SL1: the boosts as soon as ready 90 % of titles against 36 %, random presses of the supports 69 %);
 *  - an offensive skill as soon as it can pay it and it is ready, but the strongest kept for the break (the operator's SL1-3 « L’automatique garde la plus
 *    forte pour la rupture (au lot 2, la course recalée) », journal Passe SL2): it leaves when the opponent is broken long enough for it to land, or, the AP
 *    full and nothing else held, rather than lose them (the tactic the workshop measured: tools/auto-lab.mjs AUTOS.rupture). */
export function tacticChoice(v: AutoView, x: AutoFighter, conds: readonly AutoCond[] | null | undefined): AutoAction | null {
  const { me, foe, t } = v, top = strongestOf(x);
  let wardTried = false;
  for (let i = 0; i < x.skills.length; i++) {
    const s = x.skills[i], c = conds?.[i] ?? 'auto';
    if (c === 'never' || !v.usable(s)) continue;
    if (s.ward) {
      if (active(me.ward, t)) continue;
      if (c !== 'auto') { if (condHolds(c, v, x, s)) return s; continue; }
      if (wardTried) continue;
      wardTried = true;
      const foeLeft = foe.act ? foe.at - t : 0, foeBig = !!foe.act && foe.act.kind !== 'light';
      if ((foeBig && foeLeft > v.chargeOf(me, s)) || v.gauge(me) >= (2 / 3) * v.rules.gauge.max) return s;
      if (s.cover && !foe.broken && x.skills.some((o) => offensive(o) && me.ap >= (s.ap ?? 0) + (o.ap ?? 0))) return s;
      continue;
    }
    if (s.boost) {
      if (active(me.boost, t)) continue;
      if (c === 'auto' || condHolds(c, v, x, s)) return s;
      continue;
    }
    if (c === 'auto' ? s !== top || brokenFor(v, s) : condHolds(c, v, x, s)) return s;
  }
  // the AP full: the strongest rather than lose them, when its line is the automatic's
  return top && (conds?.[x.skills.indexOf(top)] ?? 'auto') === 'auto' && me.ap >= v.rules.ap.max && v.usable(top) ? top : null;
}
/** The heavy blow's rule (SY-02, A3: « une attaque de base pour tous, avec sa recharge »): when the opponent cannot defend when it lands (broken for at least its
 *  charge, or charging an action that exposes it past that time), or when the AP are full and no skill can go; its cooldown ready */
export function heavyWhen(v: AutoView, x: AutoFighter): boolean {
  const { me, foe, t } = v;
  if (!v.usable(x.heavy)) return false;
  const tc = v.chargeOf(me, x.heavy), land = t + tc;
  if (foe.broken && foe.stunEnd - t >= tc) return true;
  if (foe.act && foe.act.kind !== 'light' && foe.at >= land) return true;
  return me.ap >= v.rules.ap.max;
}
/** The automatic every fighter plays (SY-01), by its tactic (SY-08; a fighter without one, every line 'auto'): its skills (tacticChoice), else its heavy blow
 *  (heavyWhen), else its light attack, which gains the AP. */
export const autoDecider: AutoDecider = (v, x) => tacticChoice(v, x, x.tactic) ?? (heavyWhen(v, x) ? x.heavy : x.light);

export const DECIDERS: Record<AutoBrain, AutoDecider> = { player: autoDecider, rival: autoDecider };
