import { Rng } from '../core/rng';
import { hitFactor } from './stats';

/** The duel played by the computer: the model « La Brute » (the operator's PB-1 « Construire ce modèle », decision A3 of 13/11/2026, journal Passe CF3;
 *  briefs/combat-auto.md §§ 32-33, the laboratory's `BK5`, tools/auto-final/), on the timeline of the first redesign (journal Passe AC4) and the same rules for
 *  every fighter (SY-01). Each fighter chooses an action, CHARGES it (its time × 10 / its Speed, DB7-1) and it LEAVES, in one blow or an ENCHAÎNEMENT
 *  (AC-02), then chooses again; the two charges run at the same time; nothing cuts a charge (V2-2) but an interruption; a break pauses it (DB5-4 with RY-3:
 *  a gauge of 70 broken after 22.5 blows by default, stunned 10 s, the damage taken ×1.4).
 *  TWO LAYERS. The continuous one, automatic: the light attack (its weapon's enchaînement), the heavy blow (SY-02, A3: a base attack with its DB5-3 cooldown,
 *  « 5 × le temps de charge »), the guard and the dodge drawn from the stats (the guard takes 30 to 70 % off by the Defence against the Attack, DB5-2 changed
 *  by PB-1), a fighter charging anything but its light attack neither guarding nor dodging. The flashes: the four skills, NO AP (AC-03 changed by PB-1),
 *  each a number of USES per duel by its level (the operator's PB-2 « 2, 2, 3, 3, 4 selon le niveau »; a rival's 1, 2, 3 at the pool, the bracket, the final)
 *  and a GAP between two uses, fast, medium or long by its type (DB5-3 changed for the skills by PB-1); a ROLE each (exploit, punish, pierce, breaker, opener,
 *  interrupt, ward, parry, haste, slow, load), decided by the PLAN (a condition per skill, SY-08, in the order of the four, AC-09), the automatic playing the
 *  general plan (SL1-3 changed by PB-1). The OPENING (« la faille »): a fighter open neither guards nor dodges and takes ×1.25, opened by an opener (Sunder,
 *  5 s), an interrupt (the Feint on a big action charged, 6 s, its use lost, 1 s before it acts again), a parry (a big blow taken in its 3 s window, 6 s,
 *  no counter-blow: AC-07) or a big action dodged (2.5 s). Each rival its STYLE under the same rules (its pieces' guard and dodge, its heavy blow, its plan).
 *  The gear's effects on top of its points (`gfx`). Each fighter's form of the day ±15 % (AC-08). An off-screen bout is the same duel (AC-18).
 *  ONE DRAW PER BLOW (SY-04): a reaction's draw is keyed by the striker, its action's rank and the hit's rank, the initiative by the side, a decision's by the
 *  side and its rank. Pure: no DOM, no clock, no Math.random; the same seed gives the same duel. Every version 2 game plays it; today's game (`v2=0`) keeps
 *  its own duel. Proven the laboratory's `BK5`, event for event (tests/combat-auto.test.mjs, tools/auto-final/port-identity.mjs). */

export type AutoKind = 'light' | 'heavy' | 'skill';
export type AutoFamily = 'offensive' | 'defensive' | 'support';
/** what a skill does in the duel (PB-1; briefs/combat-auto.md § 32.2, the laboratory's BRUTE_ROLES) */
export type AutoRole = 'exploit' | 'punish' | 'pierce' | 'breaker' | 'opener' | 'interrupt' | 'ward' | 'parry' | 'haste' | 'slow' | 'load';
/** a ward (on oneself: the damage and the gauge one takes ×) or a support's effect, for `dur` seconds */
export interface AutoEffect { dur: number; dmg: number; gauge: number }
/** an action on the timeline */
export interface AutoAction {
  id: string;
  /** 'light' a fighter's light attack: the only kind that does not expose its charger; 'heavy' its heavy blow; 'skill' one of its skills */
  kind: AutoKind;
  family?: AutoFamily;
  /** its charge (s) at Speed 10 (`AutoFighter.tempo`) */
  charge: number;
  /** its damage at equal Attack and Defence, before the form, a guard, a ward, an opening, a load or a break */
  power?: number;
  /** what it adds to the target's gauge at Endurance 10, in blows of the default count (RY-3): a light attack's hit 1; a skill's whole, shared over its hits */
  gauge?: number;
  /** after its charge begins, it waits this long before it can be chosen again (s): the heavy blow's DB5-3 cooldown, a skill's gap between two uses */
  cooldown?: number;
  /** it ignores the guard (the Thrust of Fente, the Feint) */
  pierce?: boolean;
  /** an enchaînement: each hit's share of the power and of the gauge, `gap` s apart (AC-02); one hit by default */
  hits?: readonly number[];
  gap?: number;
  /** a ward's effect; a support's (`boost`: the haste, the slow and the load's length, its family 'support') */
  ward?: AutoEffect;
  boost?: AutoEffect;
  /** the heavy blow (kind 'heavy': the finisher that may wound Ren, the game's V2B1-1) */
  heavy?: boolean;
  /** a skill's role (PB-1) and its uses per duel by its level (PB-2) */
  role?: AutoRole;
  uses?: number;
  /** it cannot be dodged (Tourbillon, Rhosk's cleave); it goes through a ward too (the Thrust of Fente, Cassius's riposte) */
  undodge?: boolean;
  pierceWard?: boolean;
}
/** who decides for a fighter: Ren (the player's side) or a rival; both play the same automatic unless `o.deciders` replaces one (the laboratory) */
export type AutoBrain = 'player' | 'rival';
/** the gear's effects a fighter wears on top of its stat points (briefs/combat-auto.md § 31.4, the laboratory's GEAR_FX): the sabre's last cut through the
 *  guard, a blow's weight on the gauge, the light attack's charge, a guarded blow's weight on one's own gauge, the light blows' damage taken, the dodge and the
 *  guard ×, one's break shorter, the cooldowns and gaps shorter, the first charge of the duel at once */
export interface AutoGearFx { lastPierce?: boolean; gauge?: number; lightCharge?: number; guardGauge?: number; lightTaken?: number; dodge?: number; guardChance?: number; stun?: number; cd?: number; firstFast?: boolean }
/** a rival's style (PB-1, the laboratory's BRUTE_STYLES): its pieces' dodge and guard ×, its heavy blow as soon as it is ready ('ready', a brawler's) */
export interface AutoStyle { dodge: number; guard: number; heavy?: 'ready' }
export interface AutoFighter {
  id: string;
  side: 'ren' | 'foe';
  hp: number; atk: number; def: number; end: number; viv: number;
  /** the Speed its charges are written at: 10 for every fighter (SY-01, the same tables) */
  tempo: number;
  /** the damage it takes × (the night's tampering) */
  taken?: number;
  light: AutoAction;
  /** its heavy blow (SY-02, A3): a base attack, its own cooldown */
  heavy: AutoAction;
  /** its skills in its order of priority (AC-09: Ren's four in the player's order; a rival's own) */
  skills: AutoAction[];
  /** its plan (SY-08): one condition per skill of `skills`, in their order; absent = the automatic's ('auto' on every line) */
  tactic?: readonly AutoCond[];
  brain: AutoBrain;
  /** the effects of the gear it wears (Ren's) */
  gfx?: AutoGearFx;
  /** a rival's style */
  style?: AutoStyle;
}

/** The rules (the operator's decisions; the model's numbers, the laboratory's BRUTE of `BK5`). */
export const AUTO_RULES = {
  /** the break: a gauge of 70 (DB5-4) that breaks after `blows` blows by default for every fighter (the operator's RY-3 and its note, decision A3 of 13/11/2026,
   *  journal Passe SL3: « les ruptures devraient etre equivalente par default concernant le nombre de coup necessaire pour etre en rupture, par exemple
   *  20-25coups »): a light attack's hit one blow, a skill's or a heavy blow's its weight (AutoAction.gauge) shared over its hits; then the target's Endurance
   *  (× 10 / End), a guard (× guardMul, DB9), a ward, a load, the striker's gear; `decay` per second; stunned 10 s, the damage taken × 1.4 (« x1,4 durant 10s
   *  pour chacun ») */
  gauge: { max: 70, blows: 22.5, decay: 0.16, guardMul: 2 },
  brk: { stun: 10, dmg: 1.4 },
  /** the guard takes `base` × 2·Def / (Def + the attacker's Atk) off, between `lo` and `hi` (DB5-2 changed by PB-1: « −30 à −70 % selon les stats ») */
  guard: { base: 0.5, lo: 0.3, hi: 0.7 },
  /** the reactions (AC-05): the dodge 12 % × 2·Spd / (Spd + the attacker's Spd); the guard 35 % × 2·Def / (Def + the attacker's Atk), ×2 against a skill or a
   *  heavy blow seen coming (its charge shows), at most 90 %; a rival's style and the gear's effects × */
  react: { dodge: 0.12, guard: 0.35, skillGuard: 2, cap: 0.9 },
  /** a fighter charging anything but its light attack, or striking its own enchaînement, neither guards nor dodges (AC-05, « la charge qui expose ») */
  exposed: true,
  /** every health × 3.48: DB5's « en 2 et 5 min » held (AC-13's ×2), × 1.2 the model's (fewer skills, each heavier), × 1.45 for the operator's durations of SL1-2
   *  (A3: « la poule environ 2min, le tableau 2-4min , la finale 3-4min max »; journal Passe BL1) */
  hpScale: 3.48,
  /** each fighter's first charge begins after a draw in [0, start] s */
  start: 1.8,
  /** the form of the day: each fighter's blows × 1 ± form, drawn before the bout from its own stream, said on the match sheet (AC-08) */
  form: 0.15,
  /** a duel this long ends on the health shares */
  maxT: 1200,
  /** the opening (« la faille »): the damage taken ×, neither guard nor dodge; a big action dodged opens its striker this long (s) */
  open: { dmg: 1.25 }, whiff: 2.5,
  /** the roles: an exploit × in an opening, a break or on a fighter charging a big action, × `lo` else; a punish × on a fighter charging a big action; an
   *  opener's opening (s: 5, the laboratory's 8 shortened at AC-12's test, journal Passe BL1); an interrupt's opening and the stagger before the interrupted one acts again; a parry's window and the striker's opening; the
   *  haste's and the slow's charges × and lengths; a load's × on the next offensive action and its window */
  exploit: { hi: 2, lo: 0.6 }, punish: 1.7, opener: 5, interrupt: { open: 6, stagger: 1 }, parry: { open: 6, dur: 3 },
  haste: { k: 0.7, dur: 15 }, slow: { k: 1.4, dur: 12 }, load: { dmg: 2, gauge: 1.5, dur: 15 },
  /** the light attack's charge × (fewer skills: the light fills the time; RY-1's forty blows a minute kept) */
  lightCharge: 1.35,
  /** the automatic: past this share of either health, a skill held for its moment leaves (a use never spent is lost); « au début »: the first `early` s */
  late: 0.5, early: 15,
};
export type AutoRules = typeof AUTO_RULES;

/** one line of a duel's script (the arena shows it): t the time (s, two decimals), who the fighter's id. With `trace`: `s` both fighters' gauge just after it
 *  ([the first's, the second's], settled at that time, a broken one full); on a blow, `g` its target's gauge right after it (full when it broke) and `fx`
 *  whether the target's ward (1) weighed on it; on a break, `dur` its stun (s). 'parry': `who` parried the blow `act`; 'interrupt': `who` cut the action
 *  `act` its opponent charged. */
export interface AutoEvent { t: number; who: string; ev: 'charge' | 'ward' | 'boost' | 'hit' | 'guarded' | 'dodged' | 'break' | 'parry' | 'interrupt'; act?: string; at?: number; dmg?: number; hp?: number; hit?: number; s?: [number, number]; g?: number; fx?: number; dur?: number }
export interface AutoCount { acts: number; skills: number; heavies: number; lights: number; dodged: number; guarded: number; hit: number; hits: number; breaks: number; dmg: number; dmgBroken: number; skillDmg: number; wasted: number; opened: number; interrupts: number; parried: number }
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

/** what one hit adds to its target's gauge before a guard, a ward, a load or the striker's gear (RY-3, A3): a light attack's hit one blow of the `blows` the gauge
 *  holds, a skill's or a heavy blow's its weight shared over its hits; × 10 / the target's Endurance */
export function autoGaugeHit(a: Pick<AutoAction, 'kind' | 'gauge'>, share: number, end: number, R: Pick<AutoRules, 'gauge'> = AUTO_RULES): number {
  return (R.gauge.max / R.gauge.blows) * (a.gauge ?? 0) * (a.kind === 'light' ? 1 : share) * (10 / Math.max(1, end));
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
const zero = (): AutoCount => ({ acts: 0, skills: 0, heavies: 0, lights: 0, dodged: 0, guarded: 0, hit: 0, hits: 0, breaks: 0, dmg: 0, dmgBroken: 0, skillDmg: 0, wasted: 0, opened: 0, interrupts: 0, parried: 0 });

interface Load { until: number; dmg: number; gauge: number }
interface Combo { a: AutoAction; hits: readonly number[]; i: number; k: number; load: Load | null }
export interface AutoSide {
  i: 0 | 1; x: AutoFighter; hp: number; maxHp: number; g: number; gT: number; broken: boolean; stunEnd: number; cd: Record<string, number>;
  ward: { until: number; dmg: number; gauge: number; parry: boolean } | null;
  act: AutoAction | null; at: number; pending: boolean; combo: Combo | null; comboAt: number; form: number; n: AutoCount; dec: number;
  /** the gear's effects worn; a load waiting for the next offensive action; each skill's uses spent; the opening's end; the haste's and the slow's ends */
  gfx: AutoGearFx; next: Load | null; used: Record<string, number>; openUntil: number; hasteUntil: number; slowUntil: number;
}

/** what a decider sees: the time, its side and the other, and the duel's own helpers */
export interface AutoView {
  t: number; me: AutoSide; foe: AutoSide; rules: AutoRules;
  usable(a: AutoAction): boolean;
  /** a side's gauge now */
  gauge(s: AutoSide): number;
  /** an action's charge for a side, at its Speed, its haste or slow */
  chargeOf(s: AutoSide, a: AutoAction): number;
  /** a draw of this decision (keyed: SY-04) */
  rand(): number;
}
export type AutoDecider = (v: AutoView, x: AutoFighter) => AutoAction;
/** a press of the player's hand: at the duel's time `t` (s), one of the first fighter's skills */
export interface AutoCommand { t: number; skill: string }

/**
 * One duel. `seed` keys every draw (the reactions, the initiative, a decider's draws) and, from its own stream, the forms of the day. `o.log` keeps the script,
 * `o.trace` its gauges (the arena reads them); `o.rules` another set of rules (the laboratory); `o.deciders` replaces a brain's automatic (the laboratory);
 * `o.commands` the player's presses (the hand, SY-09): the first fighter's skills pressed during the duel.
 */
export function autoDuel(A: AutoFighter, B: AutoFighter, seed: number, o: { rules?: AutoRules; log?: boolean; trace?: boolean; deciders?: Partial<Record<AutoBrain, AutoDecider>>; commands?: readonly AutoCommand[] } = {}): AutoResult {
  const R = o.rules ?? AUTO_RULES, s0 = seed >>> 0 || 1, log: AutoEvent[] | null = o.log ? [] : null;
  /** a line of the script, with both fighters' gauge just after it when traced */
  const put = (e: AutoEvent): void => { if (o.trace) e.s = [+gaugeNow(F[0]).toFixed(2), +gaugeNow(F[1]).toFixed(2)]; log!.push(e); };
  const mk = (x: AutoFighter, i: 0 | 1): AutoSide => {
    const hp = Math.round(x.hp * R.hpScale);
    return { i, x, hp, maxHp: hp, g: 0, gT: 0, broken: false, stunEnd: 0, cd: {}, ward: null, act: null, at: 0, pending: false, combo: null, comboAt: 0, form: 1, n: zero(), dec: 0, gfx: x.gfx ?? {}, next: null, used: {}, openUntil: 0, hasteUntil: 0, slowUntil: 0 };
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
  // a skill with a use left and its gap run out; a base attack its cooldown run out
  const usable = (f: AutoSide, a: AutoAction): boolean => (a.kind !== 'skill' || (f.used[a.id] ?? 0) < (a.uses ?? Infinity)) && (!a.cooldown || (f.cd[a.id] ?? 0) <= t + 1e-9);
  // an action's charge: its time at the fighter's Speed, the light attack's × (its gear's and the rules'), the haste and the slow on it (the laboratory's order)
  const chargeFor = (f: AutoSide, a: AutoAction): number => a.charge * speed(f) * (a.kind === 'light' ? (f.gfx.lightCharge ?? 1) * R.lightCharge : 1) * ((f.hasteUntil > t ? R.haste.k : 1) * (f.slowUntil > t ? R.slow.k : 1));
  const view = (f: AutoSide): AutoView => { let c = 0; const d = f.dec; return { t, me: f, foe: other(f), rules: R, usable: (a) => usable(f, a), gauge: gaugeNow, chargeOf: chargeFor, rand: () => autoDraw(s0, f.i, d, c++, DRAW.decide) }; };
  // the hand (the operator's SY-09 « Au prochain choix de Ren, une compétence en attente », journal Passe SY2): a skill pressed leaves at the first fighter's next
  // choice once it is usable (a use left, its gap run out), waiting until it is, his base attacks meanwhile; one waits at a time, a later press replacing it.
  // Nothing before a press changes (one draw per blow, SY-04): the arena replays the duel from the press with the presses so far
  const cmds = [...(o.commands ?? [])].sort((a, b) => a.t - b.t);
  let cmdDone = -1;
  const pressed = (f: AutoSide): AutoAction | null => {
    if (f.i !== 0 || !cmds.length) return null;
    let k = -1;
    for (let j = 0; j < cmds.length && cmds[j].t <= t + 1e-9; j++) k = j;
    if (k <= cmdDone) return null;
    const a = f.x.skills.find((s) => s.id === cmds[k].skill);
    if (!a) { cmdDone = k; return null; }
    if (!usable(f, a)) return heavyWhen(view(f), f.x) ? f.x.heavy : f.x.light;
    cmdDone = k; return a;
  };
  const decide = (f: AutoSide): AutoAction => { const p = pressed(f), a = p ?? (o.deciders?.[f.x.brain] ?? DECIDERS[f.x.brain])(view(f), f.x); f.dec++; return a; };

  function start(f: AutoSide, a: AutoAction): void {
    settle(f);
    if (a.kind === 'skill') f.used[a.id] = (f.used[a.id] ?? 0) + 1;
    if (a.cooldown) f.cd[a.id] = t + a.cooldown * (f.gfx.cd ?? 1);
    let ch = chargeFor(f, a);
    // the swift boots: the duel's first charge at once
    if (f.gfx.firstFast && f.n.acts === 0) ch = 0;
    f.act = a; f.at = t + ch; f.n.acts++;
    if (a.kind === 'light') f.n.lights++; else if (a.kind === 'heavy') f.n.heavies++; else f.n.skills++;
    log && put({ t: T(), who: f.x.id, ev: 'charge', act: a.id, at: +f.at.toFixed(2) });
  }
  /** an action leaves: a support or a ward takes hold; a blow strikes its first hit (true while an enchaînement goes on) */
  function land(f: AutoSide): boolean {
    const a = f.act!; f.act = null;
    settle(f); settle(other(f));
    if (a.role === 'haste' || a.role === 'slow' || a.role === 'load') {
      if (a.role === 'haste') f.hasteUntil = t + R.haste.dur;
      else if (a.role === 'slow') other(f).slowUntil = t + R.slow.dur;
      else f.next = { until: t + R.load.dur, dmg: R.load.dmg, gauge: R.load.gauge };
      log && put({ t: T(), who: f.x.id, ev: 'boost', act: a.id }); return false;
    }
    if (a.ward) { f.ward = { until: t + a.ward.dur, dmg: a.ward.dmg, gauge: a.ward.gauge, parry: a.role === 'parry' }; log && put({ t: T(), who: f.x.id, ev: 'ward', act: a.id }); return false; }
    // a load waiting: spent by the first offensive action (a skill or the heavy blow) that leaves, in its window
    let load: Load | null = null;
    if (f.next && a.kind !== 'light') { if (f.next.until > t) load = f.next; f.next = null; }
    f.combo = { a, hits: a.hits ?? [1], i: 0, k: f.n.acts, load };
    hitOnce(f);
    if (over || !f.combo) return false;
    if (f.combo.i < f.combo.hits.length) { f.comboAt = t + (a.gap ?? 0.3); return true; }
    f.combo = null; return false;
  }
  /** one hit: the defender's reaction (its own keyed draws), a parry, the damage, the roles' effects, the gauge; a break pauses the target's charge and ends
   *  its enchaînement */
  function hitOnce(f: AutoSide): void {
    const c = f.combo!, a = c.a, share = c.hits[c.i], g = other(f); c.i++;
    settle(g);
    const exposed = R.exposed && ((!!g.act && g.act.kind !== 'light') || !!g.combo);
    const lastPierce = !!f.gfx.lastPierce && a.kind === 'light' && c.i === c.hits.length;
    const open = g.openUntil > t, st = g.x.style;
    let res: 'hit' | 'guarded' | 'dodged' = 'hit';
    if (!g.broken && !exposed && !open) {
      if (!a.undodge && autoDraw(s0, f.i, c.k, c.i, DRAW.dodge) < R.react.dodge * ratio(g.x.viv, f.x.viv) * (g.gfx.dodge ?? 1) * (st?.dodge ?? 1)) res = 'dodged';
      else if (!a.pierce && !lastPierce && autoDraw(s0, f.i, c.k, c.i, DRAW.guard) < Math.min(R.react.cap, R.react.guard * ratio(g.x.def, f.x.atk) * (a.kind === 'light' ? 1 : R.react.skillGuard) * (g.gfx.guardChance ?? 1) * (st?.guard ?? 1))) res = 'guarded';
    }
    if (res === 'dodged') {
      g.n.dodged++; if (a.kind !== 'light') f.n.wasted++;
      // a big action dodged leaves its striker open (the whiff)
      if (a.kind !== 'light' && c.i === 1 && R.whiff) { f.openUntil = Math.max(f.openUntil, t + R.whiff); g.n.opened++; }
      log && put({ t: T(), who: f.x.id, ev: 'dodged', act: a.id }); return;
    }
    const wardOn = !!g.ward && g.ward.until > t;
    // a parry (a ward of the parry role) takes a big blow and leaves its striker open, the rest of its enchaînement lost (no counter-blow: AC-07)
    if (wardOn && g.ward!.parry && a.kind !== 'light' && c.i === 1) {
      f.openUntil = Math.max(f.openUntil, t + R.parry.open); c.i = c.hits.length; g.n.parried++; g.n.opened++;
      log && put({ t: T(), who: g.x.id, ev: 'parry', act: a.id }); return;
    }
    const red = Math.min(R.guard.hi, Math.max(R.guard.lo, R.guard.base * ratio(g.x.def, f.x.atk)));
    let k = hitFactor(f.x.atk, g.x.def) * (res === 'guarded' ? 1 - red : 1) * (g.x.taken ?? 1) * f.form;
    if (c.load) k *= c.load.dmg;
    if (wardOn) k *= g.ward!.dmg;
    if (g.broken) k *= R.brk.dmg;
    if (open) k *= R.open.dmg;
    if (a.role === 'exploit') k *= open || g.broken || exposed ? R.exploit.hi : R.exploit.lo;
    if (a.role === 'punish' && exposed) k *= R.punish;
    // a piercer through the ward: its × taken back (the laboratory's order of the operations, to the bit)
    if (wardOn && a.pierceWard) k /= g.ward!.dmg;
    if (a.kind === 'light' && g.gfx.lightTaken) k *= g.gfx.lightTaken;
    const dmg = Math.max(1, Math.round((a.power ?? 0) * share * k));
    g.hp = Math.max(0, g.hp - dmg); f.n.dmg += dmg; if (g.broken) f.n.dmgBroken += dmg; if (a.kind !== 'light') f.n.skillDmg += dmg;
    if (res === 'guarded') g.n.guarded++; else g.n.hit++;
    f.n.hits++;
    const line: AutoEvent | null = log ? { t: T(), who: f.x.id, ev: res, act: a.id, dmg, hp: g.hp, hit: c.i, ...(o.trace ? { fx: wardOn ? 1 : 0 } : {}) } : null;
    if (line) put(line);
    if (g.hp <= 0) { over = true; winner = f === F[0] ? 0 : 1; finisher = a.kind; return; }
    // an opener leaves the opponent open; an interrupt cancels the big action it charges (its use spent), staggers and opens it
    if (c.i === 1 && a.role === 'opener') { g.openUntil = Math.max(g.openUntil, t + R.opener); f.n.opened++; }
    if (c.i === 1 && a.role === 'interrupt' && g.act && g.act.kind !== 'light' && !g.combo && !g.broken) {
      log && put({ t: T(), who: f.x.id, ev: 'interrupt', act: g.act.id });
      g.act = null; g.pending = true; g.at = t + R.interrupt.stagger; g.openUntil = Math.max(g.openUntil, t + R.interrupt.open); f.n.interrupts++; f.n.opened++;
    }
    if (!g.broken) {
      const gm = res === 'guarded' ? g.gfx.guardGauge ?? R.gauge.guardMul : 1;
      addGauge(g, autoGaugeHit(a, share, g.x.end, R) * gm * (c.load ? c.load.gauge : 1) * (wardOn ? g.ward!.gauge : 1) * (f.gfx.gauge ?? 1));
    }
    if (line && o.trace) line.g = +gaugeNow(g).toFixed(2);
  }
  function addGauge(g: AutoSide, add: number): void {
    g.g = Math.min(R.gauge.max, gaugeNow(g) + add); g.gT = t;
    if (g.g >= R.gauge.max) {
      const stun = R.brk.stun * (g.gfx.stun ?? 1);
      g.broken = true; g.stunEnd = t + stun; g.n.breaks++;
      // the break pauses the charge under way (nothing cuts it, V2-2): it leaves the stun's length later; it ends an enchaînement under way
      if (g.act) g.at += stun;
      if (g.combo) { g.combo = null; g.pending = true; g.at = g.stunEnd; }
      log && put({ t: T(), who: g.x.id, ev: 'break', ...(o.trace ? { dur: stun } : {}) });
    }
  }
  const after = (f: AutoSide): void => { if (f.broken) { f.pending = true; f.at = f.stunEnd; } else start(f, decide(f)); };
  const leadNow = (): void => { const ld = Math.sign(F[0].hp / F[0].maxHp - F[1].hp / F[1].maxHp); if (ld && lastLead && ld !== lastLead) leadChanges++; if (ld) lastLead = ld; };

  // the initiative (each side its own keyed draw)
  for (const f of F) { f.at = autoDraw(s0, f.i, 0, 0, DRAW.start) * R.start; f.pending = true; }
  while (!over) {
    // the next event: a charge that leaves, an enchaînement's next hit, or a fighter free to choose (after its initiative, a stun or an interruption); Ren
    // first on a tie
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

// --------------------------------------------------------------------------------------------------------------------------------- the plan and the automatic

const active = (e: { until: number } | null, t: number): boolean => !!e && e.until > t;
/** an offensive skill: neither a ward nor a support */
export const offensive = (a: AutoAction): boolean => !a.ward && !a.boost && a.kind === 'skill';

/** the opponent is broken long enough for this action to land before it stands up again */
export const brokenFor = (v: AutoView, a: AutoAction): boolean => v.foe.broken && v.foe.stunEnd - v.t >= v.chargeOf(v.me, a);

/** The conditions of a plan (the operator's SY-08 « Une condition par compétence, l’ordre gardé », journal Passe SY2, kept by PB-1 with « dans une faille » and
 *  « au début »): each of the four skills carries one, the order of the four stays the priority. 'auto' the automatic's own rule for that skill's role (a new
 *  game's plan: every line 'auto'); the others each read only what the arena shows (the bars of charge, the gauges, the health, a ward, an opening, the time). */
export type AutoCond = 'auto' | 'ready' | 'broken' | 'incoming' | 'gauge' | 'hurt' | 'finish' | 'follow' | 'open' | 'start' | 'foeGauge' | 'warded' | 'never';
export const AUTO_CONDS: readonly AutoCond[] = ['auto', 'ready', 'broken', 'incoming', 'gauge', 'hurt', 'finish', 'follow', 'open', 'start', 'foeGauge', 'warded', 'never'];
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
    // the opponent's gauge past two thirds, not broken
    case 'foeGauge': return !foe.broken && v.gauge(foe) >= (2 / 3) * v.rules.gauge.max;
    // the opponent under a ward still up when it lands
    case 'warded': return active(foe.ward, t + v.chargeOf(me, s));
    // « dans une faille »: the opponent open (or broken) long enough for it to land
    case 'open': return brokenFor(v, s) || foe.openUntil - t >= v.chargeOf(me, s);
    // « au début »: the duel's first seconds
    case 'start': return t < v.rules.early;
    case 'hurt': return me.hp / me.maxHp < 0.5;
    case 'finish': return foe.hp / foe.maxHp < 1 / 3;
    // another offensive skill, or the heavy blow, can follow it
    case 'follow': return x.skills.some((o) => o !== s && offensive(o) && v.usable(o)) || v.usable(x.heavy);
    default: return false;
  }
}
/** a skill's effect still running (a ward up, a haste, the opponent slowed, a load waiting): not raised again */
function running(v: AutoView, s: AutoAction): boolean {
  const { me, foe, t } = v;
  if (s.ward) return active(me.ward, t);
  if (s.role === 'haste') return me.hasteUntil > t;
  if (s.role === 'slow') return foe.slowUntil > t;
  if (s.role === 'load') return !!me.next && me.next.until > t;
  return false;
}
/** an interrupt lands while the opponent still charges a big action (and before it leaves) */
const interruptible = (v: AutoView, s: AutoAction): boolean => { const { me, foe, t } = v; if (!foe.act || foe.act.kind === 'light' || foe.combo || foe.broken) return false; return foe.at > t + v.chargeOf(me, s); };
/** The automatic's rule for a skill by its role (the 'auto' line of a plan): the general plan measured for every rival (PB-1, the laboratory's `plan: 'general'`,
 *  journal Passe CF2) — the exploit in an opening or a break, or to finish (under a quarter), or Ren nearly down; the punish as soon as it is ready; the haste when
 *  hurt (« blessé » alone: the general plan's « or at the opponent's break » cost the planner, journal Passe BL1); the slow on a big action coming or late in the duel (past half of either health: a use never spent is lost); the load when
 *  something can follow it; the opener when something can profit from it; the interrupt on a big action it can cut; the parry on a big action coming; the ward
 *  on a big action it can be up for, or its own gauge past two thirds; the piercer and the breaker as soon as they are ready. */
export function autoRole(v: AutoView, x: AutoFighter, s: AutoAction): boolean {
  const { me, foe, t } = v, L = v.rules.late, late = foe.hp / foe.maxHp < L || me.hp / me.maxHp < L;
  switch (s.role) {
    case 'exploit': return condHolds('open', v, x, s) || foe.hp / foe.maxHp < 0.25 || me.hp / me.maxHp < L * 0.6;
    case 'punish': return true;
    case 'haste': return me.hp / me.maxHp < 0.5;
    case 'slow': return condHolds('incoming', v, x, s) || late;
    case 'load': return condHolds('follow', v, x, s);
    case 'opener': return x.skills.some((o) => o !== s && (o.role === 'exploit' || o.role === 'load') && v.usable(o)) || v.usable(x.heavy) || !x.skills.some((o) => o.role === 'exploit');
    case 'interrupt': return interruptible(v, s);
    case 'parry': return condHolds('incoming', v, x, s);
    case 'ward': {
      const foeLeft = foe.act ? foe.at - t : 0, foeBig = !!foe.act && foe.act.kind !== 'light';
      return (foeBig && foeLeft > v.chargeOf(me, s)) || v.gauge(me) >= (2 / 3) * v.rules.gauge.max;
    }
    default: return true;
  }
}
/** The skill a fighter charges now by its plan (`conds`, one per skill in its order; null or a missing line = 'auto'): the first usable, its effect not running,
 *  whose condition holds; else null (the base attacks decide). */
export function planChoice(v: AutoView, x: AutoFighter, conds: readonly AutoCond[] | null | undefined): AutoAction | null {
  for (let i = 0; i < x.skills.length; i++) {
    const s = x.skills[i], c = conds?.[i] ?? 'auto';
    if (c === 'never' || !v.usable(s) || running(v, s)) continue;
    if (c === 'auto' ? autoRole(v, x, s) : condHolds(c, v, x, s)) return s;
  }
  return null;
}
/** the automatic's skill (every line 'auto') */
export function autoSkillChoice(v: AutoView, x: AutoFighter): AutoAction | null {
  return planChoice(v, x, null);
}
/** The heavy blow's rule (SY-02, A3: « une attaque de base pour tous, avec sa recharge »), its cooldown ready: when the opponent cannot defend when it lands
 *  (broken for at least its charge, charging an action that exposes it past that time, or open that long), or as soon as it is ready for a brawler's style */
export function heavyWhen(v: AutoView, x: AutoFighter): boolean {
  const { me, foe, t } = v;
  if (!v.usable(x.heavy)) return false;
  const tc = v.chargeOf(me, x.heavy), land = t + tc;
  if (foe.broken && foe.stunEnd - t >= tc) return true;
  if (foe.act && foe.act.kind !== 'light' && foe.at >= land) return true;
  return foe.openUntil - t >= tc || me.x.style?.heavy === 'ready';
}
/** The automatic every fighter plays (SY-01), by its plan (SY-08; a fighter without one, every line 'auto'): its skills (planChoice), else its heavy blow
 *  (heavyWhen), else its light attack. */
export const autoDecider: AutoDecider = (v, x) => planChoice(v, x, x.tactic) ?? (heavyWhen(v, x) ? x.heavy : x.light);

export const DECIDERS: Record<AutoBrain, AutoDecider> = { player: autoDecider, rival: autoDecider };
