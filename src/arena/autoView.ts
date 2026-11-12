import { AUTO_RULES, autoDuel, type AutoAction, type AutoEvent, type AutoFighter, type AutoResult } from '../combat/auto';
import { autoFoe, autoRaceSheet, autoRen } from '../combat/autoData';
import { REN_BASE } from '../combat/stats';
import { V2_START_KIT } from '../combat/v2duel';
import { GENERICS } from '../narrative/generics';
import { autoGenericSheet } from '../combat/autoData';

/** The arena's side of the duel played by the computer (lot 2 of briefs/combat-auto.md § 17.3, journal Passe LC3): the duel is decided before the arena opens
 *  (src/combat/auto.ts, the game's own result), the arena plays its script. `AutoReplay` reads the script (`log`, with each event's state, `trace`) on the
 *  arena's clock and shows it as the presentation reads a duel (ArenaApp's `DuelSim`: each fighter's health, AP, state and animation, the events of today's
 *  duels: `impact`, `break`, `stun`, `effect`, `ko`), so that the approved combat sheets, the effects, the stands and the sound follow it without a new image;
 *  plus what the HUD of this duel shows (both charges on the timeline, both gauges, Ren's AP and four skills with their cooldowns). Pure: the tests run it in
 *  Node and check that it ends on the duel's own result. */

export type Seat = 'ren' | 'marek';
/** the animation the presentation reads (DynamicSim's names: strike, heavy, skillOff, skillDef, skillSup, dodge, block, hit, recover, ko, ready) */
export interface AutoAnim { name: string; t: number; dur: number; impactAt?: number; prep?: number; loop?: boolean; stunned?: boolean }
/** what a fighter shows: the presentation's `DuelFighter` and its current action (`act.def`: the sheets read a rival's skill family from it) */
export interface AutoSide {
  hp: number; maxHp: number; ap: number; state: 'idle' | 'acting' | 'stunned' | 'down'; stateT: number; guarding: boolean; anim: AutoAnim;
  act: { def: { id: string; kind: 'light' | 'heavy' | 'skill'; family?: string; anim: string }; t: number } | null;
}
/** a fighter's charge on the timeline: its action, when it began, when it leaves */
export interface AutoCharge { id: string; kind: 'light' | 'heavy' | 'skill'; family: 'offensive' | 'defensive' | 'support' | null; start: number; leave: number }

/** an event of the presentation (the shapes of today's DynEvent the arena, the effects, the stands and the sound already read) */
export type ReplayEvent = { type: string; t?: number } & Record<string, unknown>;

/** the wind-up the presentation draws before a blow lands (s): the strike's run-up, then its follow-through after the impact; a skill's longer */
export const WIND = { light: 0.2, heavy: 0.3, skill: 0.3, effect: 0.15, follow: 0.18, nextHit: 0.12, dodge: 0.32, block: 0.3, flinch: 0.22 };

const SEATS: Seat[] = ['ren', 'marek'];
const kindOf = (a: AutoAction): 'light' | 'heavy' | 'skill' => (a.heavy ? 'heavy' : a.kind === 'light' ? 'light' : a.kind === 'heavy' ? 'heavy' : 'skill');
const familyOf = (a: AutoAction): AutoCharge['family'] => (a.ward ? 'defensive' : a.boost ? 'support' : a.kind === 'light' ? null : a.family ?? 'offensive');
/** the clip a blow or an effect plays (dynamicView maps them onto the sheets' clips) */
const animOf = (a: AutoAction): string => (a.ward ? 'skillDef' : a.boost ? 'skillSup' : kindOf(a) === 'light' ? 'strike' : kindOf(a) === 'heavy' ? 'heavy' : 'skillOff');

interface State {
  side: AutoSide; charge: AutoCharge | null;
  /** the strike, an effect, a reaction or a flinch on screen: its animation's start and clip */
  strike: { name: string; t0: number; impactAt: number; dur: number } | null;
  react: { name: string; t0: number; impactAt: number; dur: number } | null;
  g: number; gT: number; broken: boolean; stunEnd: number;
  ward: { until: number; dur: number } | null; boost: { until: number; dur: number } | null;
  cd: Record<string, { until: number; dur: number }>;
  /** the opponent's sequence (a big action charged) told to the sound's layers (sequenceStart / sequenceEnd) */
  seq: boolean;
}

/** the HUD's reading of one fighter */
export interface AutoGauge {
  hp: number; maxHp: number; hpPct: number; ap: number;
  /** the gauge toward a break (0-100 % of DB5-4's 70), full while broken; the stun's seconds left */
  gaugePct: number; broken: boolean; stunLeft: number;
  ward: number; boost: number;
  charge: { id: string; kind: string; family: string | null; pct: number; left: number } | null;
}
export interface AutoHudModel {
  t: number; over: boolean; winner: Seat | null;
  ren: AutoGauge; marek: AutoGauge;
  /** Ren's four skills in his order: its AP, its cooldown's seconds left (DB5-3), whether it is the one charging */
  slots: Array<{ id: string; ap: number; family: string; cool: number; coolPct: number; charging: boolean; payable: boolean }>;
}

export class AutoReplay {
  /** the arena's step, and the fighters' names (the tools read them as a duel's data) */
  readonly D: { dt: number; fighters: Record<Seat, { name: string }> };
  t = 0;
  over = false;
  readonly f: Record<Seat, AutoSide>;
  readonly end: number;
  readonly winner: Seat;
  private s: Record<Seat, State>;
  private i = 0;
  private out: ReplayEvent[] = [];
  private acts: Record<Seat, Map<string, AutoAction>>;
  private ids: Record<string, Seat>;
  private koT = -1;

  constructor(readonly result: AutoResult, readonly fighters: { ren: AutoFighter; marek: AutoFighter }, names: Record<Seat, string> = { ren: 'Ren', marek: 'Marek' }) {
    this.D = { dt: 1 / 120, fighters: { ren: { name: names.ren }, marek: { name: names.marek } } };
    if (!result.log) throw new Error('the arena plays a duel\'s script: autoDuel(..., { log: true, trace: true })');
    this.acts = { ren: actionsOf(fighters.ren), marek: actionsOf(fighters.marek) };
    this.ids = { [fighters.ren.id]: 'ren', [fighters.marek.id]: 'marek' };
    const w = result.winner ?? (result.hp[0] / result.maxHp[0] >= result.hp[1] / result.maxHp[1] ? 0 : 1);
    this.winner = w === 0 ? 'ren' : 'marek';
    this.end = result.t;
    this.f = { ren: null!, marek: null! };
    this.s = { ren: null!, marek: null! };
    this.reset();
  }

  /** from the start of the duel */
  reset(): void {
    this.t = 0; this.i = 0; this.over = false; this.koT = -1; this.out = [];
    SEATS.forEach((seat, k) => {
      const x = this.fighters[seat], maxHp = this.result.maxHp[k];
      const side: AutoSide = { hp: maxHp, maxHp, ap: AUTO_RULES.ap.start + (x.apStart ?? 0), state: 'idle', stateT: 0, guarding: false, anim: { name: 'ready', t: 0, dur: 1, loop: true }, act: null };
      this.f[seat] = side;
      this.s[seat] = { side, charge: null, strike: null, react: null, g: 0, gT: 0, broken: false, stunEnd: 0, ward: null, boost: null, cd: {}, seq: false };
    });
    this.out.push({ type: 'reset' });
    this.refresh();
  }

  /** the arena's clock: every line of the script up to `t` */
  step(dt = this.D.dt): void {
    if (this.over && this.koT >= 0) { this.t += dt; this.refresh(); return; }
    this.t = Math.min(this.t + dt, this.end + 0.001);
    this.play(true);
    if (!this.over && this.t >= this.end) this.finish(true);
    this.refresh();
  }

  /** « Passer au résultat » (AC-13): every line left applied without its sounds and effects, then the end of the duel told */
  skip(): void {
    if (this.over) return;
    this.t = this.end;
    this.play(false);
    if (!this.over) this.finish(true);
    this.refresh();
  }

  drain(): ReplayEvent[] { const e = this.out; this.out = []; return e; }

  private play(tell: boolean): void {
    const log = this.result.log!;
    while (this.i < log.length && log[this.i].t <= this.t + 1e-9) {
      const e = log[this.i++];
      // what ran out before this line, then the line (the last blow of a duel skipped is still told: its K.O.)
      this.expire(e.t, tell);
      this.apply(e, tell || this.i === log.length);
      if (this.over) break;
    }
    this.expire(this.t, tell);
  }

  /** the stuns, wards and boosts that run out by `t`, in the order of the script (a line after a stun's end carries the state after it) */
  private expire(t: number, tell: boolean): void {
    for (const seat of SEATS) {
      const s = this.s[seat];
      if (s.broken && t >= s.stunEnd) { s.broken = false; s.g = 0; s.gT = s.stunEnd; if (tell) this.emit({ type: 'stunEnd', who: seat }); }
      if (s.ward && t >= s.ward.until) { s.ward = null; if (tell) this.emit({ type: 'wardEnd', who: seat }); }
      if (s.boost && t >= s.boost.until) { s.boost = null; if (tell) this.emit({ type: 'boostEnd', who: seat }); }
    }
  }

  private emit(e: ReplayEvent): void { this.out.push({ ...e, t: this.t }); }

  private apply(e: AutoEvent, tell: boolean): void {
    const seat = this.ids[e.who], s = this.s[seat], other: Seat = seat === 'ren' ? 'marek' : 'ren', o = this.s[other];
    if (e.s) { this.s.ren.side.ap = e.s[0]; this.s.ren.g = e.s[1]; this.s.ren.gT = e.t; this.s.marek.side.ap = e.s[2]; this.s.marek.g = e.s[3]; this.s.marek.gT = e.t; }
    const a = e.act ? this.acts[seat].get(e.act) : undefined;
    switch (e.ev) {
      case 'charge': {
        if (!a) throw new Error(`no action ${e.act} for ${e.who}`);
        s.charge = { id: a.id, kind: kindOf(a), family: familyOf(a), start: e.t, leave: e.at ?? e.t };
        if (a.cooldown) s.cd[a.id] = { until: e.t + a.cooldown, dur: a.cooldown };
        // the opponent charging a big action: its sequence, for the music's layers (the lead steps aside, the tension rises: rule F)
        if (seat === 'marek' && kindOf(a) !== 'light' && !a.ward && !a.boost) { s.seq = true; if (tell) this.emit({ type: 'sequenceStart', who: seat, len: 1 }); }
        if (tell) this.emit({ type: 'commandStart', who: seat, action: a.id, kind: kindOf(a), prep: Math.max(0, (e.at ?? e.t) - e.t), impactAt: 0, reactable: false, seqIdx: 0, seqLen: 0 });
        break;
      }
      case 'ward': case 'boost': {
        if (!a) break;
        const eff = a.ward ?? a.boost!, k = { until: e.t + eff.dur, dur: eff.dur };
        if (e.ev === 'ward') s.ward = k; else s.boost = k;
        s.strike = { name: animOf(a), t0: e.t - this.wind(s, WIND.effect), impactAt: this.wind(s, WIND.effect), dur: this.wind(s, WIND.effect) + 0.35 };
        s.charge = null;
        if (tell) this.emit({ type: 'effect', who: seat, action: a.id, family: e.ev === 'ward' ? 'defensive' : 'support', dur: eff.dur });
        break;
      }
      case 'hit': case 'guarded': case 'dodged': {
        if (!a) break;
        const first = (e.hit ?? 1) <= 1, kind = kindOf(a);
        const lead = first ? this.wind(s, kind === 'light' ? WIND.light : kind === 'heavy' ? WIND.heavy : WIND.skill) : WIND.nextHit;
        s.strike = { name: animOf(a), t0: e.t - lead, impactAt: lead, dur: lead + WIND.follow };
        if (first) s.charge = null;
        if (first && s.seq) { s.seq = false; if (tell) this.emit({ type: 'sequenceEnd', who: seat }); }
        if (e.ev === 'dodged') o.react = { name: 'dodge', t0: e.t - 0.06, impactAt: 0.06, dur: WIND.dodge };
        else if (e.ev === 'guarded') o.react = { name: 'block', t0: e.t, impactAt: 1e6, dur: WIND.block };
        else if (!o.broken) o.react = { name: 'hit', t0: e.t, impactAt: 0, dur: WIND.flinch };
        if (e.hp !== undefined) o.side.hp = e.hp;
        const dmg = e.dmg ?? 0;
        if (tell && e.ev === 'dodged' && other === 'ren') this.emit({ type: 'reactStart', who: other, kind: 'dodge', cost: 0, early: false });
        if (tell) this.emit({ type: 'impact', from: seat, to: other, action: a.id, kind, result: e.ev === 'hit' ? 'hit' : e.ev, damage: dmg, mitigated: 0, hp: o.side.hp, resist: o.g });
        if (e.hp !== undefined && e.hp <= 0) this.ko(other, true);
        break;
      }
      case 'break': {
        s.broken = true; s.stunEnd = e.t + AUTO_RULES.brk.stun; s.react = null;
        // its charge is paused the stun's length (the duel's own rule): its leave, already in the script, comes later
        if (tell) { this.emit({ type: 'break', who: seat }); this.emit({ type: 'stun', who: seat, dur: AUTO_RULES.brk.stun, why: 'break' }); }
        break;
      }
    }
  }

  /** a wind-up never longer than most of the charge it ends */
  private wind(s: State, w: number): number { const c = s.charge; return c ? Math.max(0.04, Math.min(w, 0.6 * (c.leave - c.start))) : w; }

  private ko(loser: Seat, tell: boolean): void {
    if (this.over) return;
    this.over = true; this.koT = this.t;
    const s = this.s[loser]; s.side.state = 'down'; s.charge = null; s.strike = null; s.react = null;
    for (const seat of SEATS) this.s[seat].charge = null;
    if (tell) this.emit({ type: 'ko', who: loser });
  }

  /** the script ends without a K.O. (past the duel's last second, decided on the health shares): the loser goes down all the same */
  private finish(tell: boolean): void { this.ko(this.winner === 'ren' ? 'marek' : 'ren', tell); }

  /** each fighter's state and animation now (the presentation's DynamicSim names) */
  private refresh(): void {
    const t = this.t;
    for (const seat of SEATS) {
      const s = this.s[seat], f = s.side, c = s.charge;
      if (f.state === 'down' || (this.over && this.koT >= 0 && seat !== this.winner)) { f.state = 'down'; f.anim = { name: 'ko', t: t - this.koT, dur: 0.9 }; f.act = null; continue; }
      if (s.broken && t < s.stunEnd) { f.state = 'stunned'; f.anim = { name: 'recover', t: t - (s.stunEnd - AUTO_RULES.brk.stun), dur: AUTO_RULES.brk.stun, stunned: true }; f.act = null; continue; }
      const r = s.react && t < s.react.t0 + s.react.dur ? s.react : null;
      const k = s.strike && t < s.strike.t0 + s.strike.dur && t >= s.strike.t0 ? s.strike : null;
      // the wind-up of the blow in charge: the strike drawn before its first hit lands
      const windUp = c && !k ? this.windUpOf(seat, c) : null;
      const strike = k ?? windUp;
      if (r && (r.name !== 'hit' || !strike)) { f.state = 'idle'; f.anim = { name: r.name, t: t - r.t0, dur: r.dur, impactAt: r.impactAt }; f.act = null; continue; }
      if (strike) {
        f.state = 'acting';
        f.anim = { name: strike.name, t: t - strike.t0, dur: strike.dur, impactAt: strike.impactAt, prep: 0 };
        f.act = { def: { id: c?.id ?? strike.name, kind: strike.name === 'strike' ? 'light' : strike.name === 'heavy' ? 'heavy' : 'skill', family: strike.name === 'skillDef' ? 'defensive' : strike.name === 'skillSup' ? 'support' : 'offensive', anim: strike.name }, t: t - strike.t0 };
        continue;
      }
      if (r) { f.state = 'idle'; f.anim = { name: r.name, t: t - r.t0, dur: r.dur, impactAt: r.impactAt }; f.act = null; continue; }
      // a rival charging a big action holds its wind-up's first frame (its telegraph): the sheets draw a rival's skill by its family
      if (c && seat === 'marek' && c.kind !== 'light') {
        const a = this.acts.marek.get(c.id)!, name = animOf(a), prep = Math.max(0, c.leave - c.start);
        f.state = 'acting';
        f.anim = { name, t: t - c.start, dur: prep + 0.4, impactAt: prep + 0.3, prep: prep + 1 };
        f.act = { def: { id: c.id, kind: c.kind, family: c.family ?? 'offensive', anim: name }, t: t - c.start };
        continue;
      }
      f.state = 'idle'; f.act = null;
      f.anim = { name: seat === 'marek' || f.ap >= 2 ? 'ready' : 'idle', t, dur: 1, loop: true };
    }
  }

  /** the strike drawn in the last moments of a charge, before its blow lands (or its ward or boost takes hold) */
  private windUpOf(seat: Seat, c: AutoCharge): State['strike'] {
    const a = this.acts[seat].get(c.id)!, lead = a.ward || a.boost ? WIND.effect : c.kind === 'light' ? WIND.light : c.kind === 'heavy' ? WIND.heavy : WIND.skill;
    const w = Math.max(0.04, Math.min(lead, 0.6 * (c.leave - c.start)));
    if (this.t < c.leave - w) return null;
    return { name: animOf(a), t0: c.leave - w, impactAt: w, dur: w + WIND.follow };
  }

  // ------------------------------------------------------------------------------------------------ what the presentation asks a duel

  /** the opponent's big action coming (the camera's push, its blade's light): its kind, its progress */
  incoming(): { kind: string; action: string; castProgress: number; windowOpen: boolean; name?: string } | null {
    const c = this.s.marek.charge;
    if (!c || c.kind === 'light' || c.family === 'defensive' || c.family === 'support' || this.over) return null;
    return { kind: c.kind, action: c.kind === 'heavy' ? 'm_heavy' : c.id, castProgress: Math.max(0, Math.min(1, (this.t - c.start) / Math.max(0.01, c.leave - c.start))), windowOpen: false };
  }
  /** Ren's charge as the sheets draw it (his own charge frames, low for the light attack, high for a skill), while no blow is drawn */
  chargeView(): { held: boolean; reached: number; waiting: number } {
    const c = this.s.ren.charge, f = this.f.ren;
    return { held: !!c && f.state === 'idle' && !this.over && !this.s.ren.react, reached: c && c.kind !== 'light' ? 1 : 0, waiting: -1 };
  }
  command(): boolean { return false; }
  react(): boolean { return false; }
  setGuard(): void { /* the duel is the computer's */ }

  /** the HUD's reading now */
  hud(): AutoHudModel {
    const g = (seat: Seat): AutoGauge => {
      const s = this.s[seat], f = s.side, c = s.charge, max = AUTO_RULES.gauge.max;
      const gauge = s.broken && this.t < s.stunEnd ? max : Math.max(0, s.g - AUTO_RULES.gauge.decay * (this.t - s.gT));
      return {
        hp: Math.max(0, Math.ceil(f.hp)), maxHp: f.maxHp, hpPct: pct(f.hp, f.maxHp), ap: f.ap,
        gaugePct: pct(gauge, max), broken: s.broken && this.t < s.stunEnd, stunLeft: s.broken ? Math.max(0, s.stunEnd - this.t) : 0,
        ward: s.ward ? Math.max(0, s.ward.until - this.t) : 0, boost: s.boost ? Math.max(0, s.boost.until - this.t) : 0,
        // a stun pauses the charge: the card says the stun, not a charge that does not move
        charge: c && !this.over && !(s.broken && this.t < s.stunEnd) ? { id: c.id, kind: c.kind, family: c.family, pct: pct(this.t - c.start, c.leave - c.start), left: Math.max(0, c.leave - this.t) } : null,
      };
    };
    const ren = this.s.ren;
    return {
      t: this.t, over: this.over, winner: this.over ? this.winner : null, ren: g('ren'), marek: g('marek'),
      slots: this.fighters.ren.skills.map((a) => {
        const cd = ren.cd[a.id], cool = cd ? Math.max(0, cd.until - this.t) : 0;
        return { id: a.id, ap: a.ap ?? 0, family: familyOf(a) ?? 'offensive', cool, coolPct: cd ? pct(cool, cd.dur) : 0, charging: ren.charge?.id === a.id, payable: (a.ap ?? 0) <= ren.side.ap };
      }),
    };
  }

  /** the time of the first line of the script that matches (a scripted moment of the captures), or -1 */
  timeOf(match: (e: AutoEvent) => boolean): number { const e = this.result.log!.find(match); return e ? e.t : -1; }
  /** the duel at `t` (a scripted moment): replayed from the start without its sounds and effects; its `reset` is told (the HUD and the effects clear what
   *  the duel before left: a K.O. screen) */
  seek(t: number): void {
    this.out = []; this.reset();
    const log = this.result.log!;
    this.t = Math.min(t, this.end);
    while (this.i < log.length && log[this.i].t <= this.t + 1e-9) { const e = log[this.i++]; this.expire(e.t, false); this.apply(e, false); if (this.over) break; }
    this.expire(this.t, false);
    this.refresh();
  }

  hash(): string {
    const h = (seat: Seat) => { const f = this.f[seat], s = this.s[seat]; return `${f.hp}:${f.ap}:${f.state}:${s.g.toFixed(2)}:${s.charge?.id ?? '-'}`; };
    return `${h('ren')};${h('marek')};${this.t.toFixed(3)};${this.i}`;
  }
}

const pct = (a: number, b: number): number => (b > 0 ? Math.max(0, Math.min(100, Math.round((a / b) * 1000) / 10)) : 0);
function actionsOf(x: AutoFighter): Map<string, AutoAction> {
  const m = new Map<string, AutoAction>();
  for (const a of [x.light, ...(x.combo ? [x.combo] : []), ...x.skills]) m.set(a.id, a);
  return m;
}

/** the arena's own page (`?scene=arena`, outside a game): Ren of a new game (his start, the four of the start kit at level 1, the training sword) against
 *  the pool's Marek (or `foe`, a rival's sheet in its own duel; DEV a generic fighter), a fixed seed; `seed` another duel */
export function sceneAutoDuel(foe = 'marek', seed = 1337): { result: AutoResult; ren: AutoFighter; foe: AutoFighter } {
  const ren = autoRen({ ...REN_BASE }, { loadout: V2_START_KIT.loadout, levels: V2_START_KIT.levels });
  const g = GENERICS[foe];
  const f = g ? autoFoe(foe, autoGenericSheet(g.profile, g, 0, 0), { kitOf: g.profile }) : autoFoe(foe, autoRaceSheet(foe, 0, 0));
  return { result: autoDuel(ren, f, seed, { log: true, trace: true }), ren, foe: f };
}
