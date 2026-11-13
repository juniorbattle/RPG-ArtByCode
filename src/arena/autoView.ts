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

/** the form of the day's sign (the operator's LC6-7 « Les deux signes », journal Passe LC7; AC-08): told once at the start of the bout for a fighter whose blows are
 *  × 1.05 and more (« up ») or × 0.95 and less (« down »), Ren's then the opponent's; nothing between */
export const FORM_SIGN_FROM = 0.05;
export const FORM_AT: Readonly<Record<Seat, number>> = { ren: 0.35, marek: 0.75 };
export const formSignOf = (form: number): 'up' | 'down' | null => (form >= 1 + FORM_SIGN_FROM - 1e-9 ? 'up' : form <= 1 - FORM_SIGN_FROM + 1e-9 ? 'down' : null);

/** the wind-up the presentation draws before a blow lands (s): the strike's run-up, then its follow-through after the impact; a skill's longer */
export const WIND = { light: 0.2, heavy: 0.3, skill: 0.3, effect: 0.15, follow: 0.18, nextHit: 0.12, dodge: 0.32, block: 0.3, flinch: 0.22 };

const SEATS: Seat[] = ['ren', 'marek'];
const kindOf = (a: AutoAction): 'light' | 'heavy' | 'skill' => (a.heavy ? 'heavy' : a.kind === 'light' ? 'light' : a.kind === 'heavy' ? 'heavy' : 'skill');
const familyOf = (a: AutoAction): AutoCharge['family'] => (a.ward ? 'defensive' : a.boost ? 'support' : a.kind === 'light' ? null : a.family ?? 'offensive');
/** the clip a blow or an effect plays (dynamicView maps them onto the sheets' clips) */
const animOf = (a: AutoAction): string => (a.ward ? 'skillDef' : a.boost ? 'skillSup' : kindOf(a) === 'light' ? 'strike' : kindOf(a) === 'heavy' ? 'heavy' : 'skillOff');

/** a blow, an effect or a reaction drawn on screen, read from the whole script before the duel plays (journal Passe LC4): its clip, when its animation
 *  starts, its impact in it, its length; `follow`: an enchaînement's next blow (its run-up within the gap since the one before) */
export interface AutoWindow { name: string; t0: number; impactAt: number; dur: number; follow?: boolean; id: string; kind: 'light' | 'heavy' | 'skill'; family: string }

interface State {
  side: AutoSide; charge: AutoCharge | null;
  g: number; gT: number; broken: boolean; stunEnd: number;
  /** a ward or a boost under way: until when, its length, what it does to the gauge (the ward on the gauge one takes, the boost on the gauge one gives) */
  ward: { until: number; dur: number; gauge: number } | null; boost: { until: number; dur: number; gauge: number } | null;
  cd: Record<string, { until: number; dur: number }>;
  /** the opponent's sequence (a big action charged) told to the sound's layers (sequenceStart / sequenceEnd) */
  seq: boolean;
  /** Ren charging a skill: its tier on the ladder of his four (`AutoReplay.tierOf`, 0 none), told as the charge's tier (lot 4, journal Passe LC6) */
  tier: number;
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
  /** the form's sign told, by fighter (once a bout; passed over by « Skip » and a moment sought) */
  private formTold: Partial<Record<Seat, boolean>> = {};
  /** each fighter's blows and effects, and its reactions to the other's, in the order they start (`windowsOf`) */
  readonly wins: Record<Seat, AutoWindow[]>;
  readonly reacts: Record<Seat, AutoWindow[]>;
  /** the charge's ladder as the duel of before built it (src/combat/charge.ts): the light attack at 0, then Ren's four skills by their charge time, the shortest
   *  first; `tiers` its length. Ren charging a skill tells its tier (`chargeTier`), so that the charge's sounds and effects of lot S3 and FX play at the level
   *  they played when that skill was released (src/audio/sfx.ts, src/arena/fx/fxRecipes.ts: `chargeLevel`), and the music's rule F hears « la charge » */
  readonly tiers: number;
  private ladder = new Map<string, number>();

  constructor(readonly result: AutoResult, readonly fighters: { ren: AutoFighter; marek: AutoFighter }, names: Record<Seat, string> = { ren: 'Ren', marek: 'Marek' }) {
    this.D = { dt: 1 / 120, fighters: { ren: { name: names.ren }, marek: { name: names.marek } } };
    if (!result.log) throw new Error('the arena plays a duel\'s script: autoDuel(..., { log: true, trace: true })');
    [...fighters.ren.skills].map((a, k) => ({ a, k })).sort((x, y) => x.a.charge - y.a.charge || x.k - y.k).forEach(({ a }, r) => this.ladder.set(a.id, r + 1));
    this.tiers = 1 + fighters.ren.skills.length;
    this.acts = { ren: actionsOf(fighters.ren), marek: actionsOf(fighters.marek) };
    this.ids = { [fighters.ren.id]: 'ren', [fighters.marek.id]: 'marek' };
    const w = result.winner ?? (result.hp[0] / result.maxHp[0] >= result.hp[1] / result.maxHp[1] ? 0 : 1);
    this.winner = w === 0 ? 'ren' : 'marek';
    this.end = result.t;
    ({ wins: this.wins, reacts: this.reacts } = windowsOf(result.log, this.ids, this.acts));
    this.f = { ren: null!, marek: null! };
    this.s = { ren: null!, marek: null! };
    this.reset();
  }

  /** from the start of the duel */
  reset(): void {
    this.t = 0; this.i = 0; this.over = false; this.koT = -1; this.out = []; this.formTold = {};
    SEATS.forEach((seat, k) => {
      const x = this.fighters[seat], maxHp = this.result.maxHp[k];
      const side: AutoSide = { hp: maxHp, maxHp, ap: AUTO_RULES.ap.start + (x.apStart ?? 0), state: 'idle', stateT: 0, guarding: false, anim: { name: 'ready', t: 0, dur: 1, loop: true }, act: null };
      this.f[seat] = side;
      this.s[seat] = { side, charge: null, g: 0, gT: 0, broken: false, stunEnd: 0, ward: null, boost: null, cd: {}, seq: false, tier: 0 };
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
    this.forms(tell);
  }

  /** the form of the day's sign of each fighter whose time has come (FORM_AT), told once; under « Skip » or a seek only marked */
  private forms(tell: boolean): void {
    SEATS.forEach((seat, k) => {
      if (this.formTold[seat] || this.t < FORM_AT[seat] - 1e-9) return;
      this.formTold[seat] = true;
      const sign = formSignOf(this.result.form[k]);
      if (tell && sign && !this.over) this.emit({ type: 'formSign', who: seat, sign, form: this.result.form[k] });
    });
  }

  /** the stuns, wards and boosts that run out by `t`, in the order of the script (a line after a stun's end carries the state after it) */
  private expire(t: number, tell: boolean): void {
    for (const seat of SEATS) {
      const s = this.s[seat];
      if (s.broken && t >= s.stunEnd) {
        s.broken = false; s.g = 0; s.gT = s.stunEnd;
        if (tell) this.emit({ type: 'stunEnd', who: seat });
        // Ren's charge, paused by the stun (the duel's rule), goes on: its breath again, without its tier's note (lot 4)
        if (tell && s.tier && s.charge) this.emit({ type: 'chargeHold', who: seat, idx: s.tier });
      }
      if (s.ward && t >= s.ward.until) { s.ward = null; if (tell) this.emit({ type: 'wardEnd', who: seat }); }
      if (s.boost && t >= s.boost.until) { s.boost = null; if (tell) this.emit({ type: 'boostEnd', who: seat }); }
    }
  }

  private emit(e: ReplayEvent): void { this.out.push({ ...e, t: this.t }); }

  private apply(e: AutoEvent, tell: boolean): void {
    const seat = this.ids[e.who], s = this.s[seat], other: Seat = seat === 'ren' ? 'marek' : 'ren', o = this.s[other], apWas = s.side.ap;
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
        // Ren charging a skill: its tier reached at once (the charge's note, its breath while it fills, the music's tension: lot 4, journal Passe LC6); his light
        // attack is the ladder's 0, as before (nothing)
        s.tier = seat === 'ren' ? this.tierOf(a.id) : 0;
        if (tell && s.tier) this.emit({ type: 'chargeTier', who: seat, action: a.id, idx: s.tier, open: true, prep: Math.max(0, (e.at ?? e.t) - e.t) });
        break;
      }
      case 'ward': case 'boost': {
        if (!a) break;
        const eff = a.ward ?? a.boost!, k = { until: e.t + eff.dur, dur: eff.dur, gauge: eff.gauge };
        if (e.ev === 'ward') s.ward = k; else s.boost = k;
        s.charge = null;
        this.release(seat, tell);
        if (tell) this.emit({ type: 'effect', who: seat, action: a.id, family: e.ev === 'ward' ? 'defensive' : 'support', dur: eff.dur });
        break;
      }
      case 'hit': case 'guarded': case 'dodged': {
        if (!a) break;
        // an action's first blow ends its charge (its later blows, an enchaînement's, come after it)
        const first = !!s.charge, kind = kindOf(a);
        s.charge = null;
        if (first) this.release(seat, tell);
        if (first && s.seq) { s.seq = false; if (tell) this.emit({ type: 'sequenceEnd', who: seat }); }
        if (e.hp !== undefined) o.side.hp = e.hp;
        // the gauge this blow fills, as the duel fills it right after writing the blow's line (its trace is the gauge before it: src/combat/auto.ts, hitOnce): the
        // HUD shows it at the blow, not one line later (journal Passe LC5's note, fixed in lot 4 on the presentation's side; the duel and its script unchanged)
        if (e.ev !== 'dodged' && !o.broken && (e.hp ?? 1) > 0) {
          const share = (a.hits ?? [1])[(e.hit ?? 1) - 1] ?? 1, end = this.fighters[other].end;
          const add = (a.gauge ?? 0) * share * (10 / Math.max(1, end)) * (e.ev === 'guarded' ? AUTO_RULES.gauge.guardMul : 1) * (s.boost ? s.boost.gauge : 1) * (o.ward ? o.ward.gauge : 1);
          o.g = Math.min(AUTO_RULES.gauge.max, Math.max(0, o.g - AUTO_RULES.gauge.decay * (e.t - o.gT)) + add); o.gT = e.t;
        }
        const dmg = e.dmg ?? 0;
        if (tell && e.ev === 'dodged' && other === 'ren') this.emit({ type: 'reactStart', who: other, kind: 'dodge', cost: 0, early: false });
        // `follow`: an enchaînement's next blow (not its action's first); `apGain`: the AP its striker gained by it (a light attack that lands, once per
        // action); the first duel's tutorial reads them (lot 3, src/ui/duelTutorial.ts), the arena, the effects, the stands and the sound do not
        if (tell) this.emit({ type: 'impact', from: seat, to: other, action: a.id, kind, result: e.ev === 'hit' ? 'hit' : e.ev, damage: dmg, mitigated: 0, hp: o.side.hp, resist: o.g, follow: !first, apGain: Math.max(0, s.side.ap - apWas) });
        if (e.hp !== undefined && e.hp <= 0) this.ko(other, true);
        break;
      }
      case 'break': {
        s.broken = true; s.stunEnd = e.t + AUTO_RULES.brk.stun;
        // its charge is paused the stun's length (the duel's own rule): its leave, already in the script, comes later
        if (tell) { this.emit({ type: 'break', who: seat }); this.emit({ type: 'stun', who: seat, dur: AUTO_RULES.brk.stun, why: 'break' }); }
        break;
      }
    }
  }

  /** Ren's tier for a skill (0 his light attack or a rival's action) */
  tierOf(id: string): number { return this.ladder.get(id) ?? 0; }

  /** the action charged leaves: Ren's skill tells its release (the charge's whip and its light, lot S3 and FX) */
  private release(seat: Seat, tell: boolean): void {
    const s = this.s[seat], idx = s.tier;
    s.tier = 0;
    if (tell && idx) this.emit({ type: 'chargeRelease', who: seat, idx, ok: true });
  }

  private ko(loser: Seat, tell: boolean): void {
    if (this.over) return;
    this.over = true; this.koT = this.t;
    const s = this.s[loser]; s.side.state = 'down'; s.charge = null;
    for (const seat of SEATS) { this.s[seat].charge = null; this.s[seat].tier = 0; }
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
      // its blow or effect up to its impact (a blow lands drawn), else a reaction (a dodge, a block; a flinch only while it strikes nothing), else the blow's
      // follow-through: each drawn from its window, its run-up begun before it lands
      const r = this.at(this.reacts[seat], t), strike = this.at(this.wins[seat], t), landing = !!strike && t - strike.t0 <= strike.impactAt + 0.04;
      if (r && !landing && (r.name !== 'hit' || !strike)) { f.state = 'idle'; f.anim = { name: r.name, t: t - r.t0, dur: r.dur, impactAt: r.impactAt }; f.act = null; continue; }
      if (strike) {
        f.state = 'acting';
        f.anim = { name: strike.name, t: t - strike.t0, dur: strike.dur, impactAt: strike.impactAt, prep: 0 };
        f.act = { def: { id: strike.id, kind: strike.kind, family: strike.family, anim: strike.name }, t: t - strike.t0 };
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

  /** the latest window begun by `t`, while it lasts */
  private at(list: AutoWindow[], t: number): AutoWindow | null {
    let lo = 0, hi = list.length - 1, k = -1;
    while (lo <= hi) { const m = (lo + hi) >> 1; if (list[m].t0 <= t + 1e-9) { k = m; lo = m + 1; } else hi = m - 1; }
    return k >= 0 && t < list[k].t0 + list[k].dur ? list[k] : null;
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
    return { held: !!c && f.state === 'idle' && !this.over && !this.at(this.reacts.ren, this.t), reached: c && c.kind !== 'light' ? 1 : 0, waiting: -1 };
  }
  /** Ren's charge as the effects' breath reads it (src/arena/fx/combatFx.ts, the charge held: the charged command's ChargeView): while he charges a skill, not
   *  stunned, the duel not over; null else */
  chargeFx(): { held: boolean; launch: number; waiting: number; tiers: { length: number } } | null {
    const s = this.s.ren;
    return s.tier && s.charge && !this.over && !(s.broken && this.t < s.stunEnd) ? { held: true, launch: s.tier, waiting: -1, tiers: { length: this.tiers } } : null;
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
    this.forms(false);
    this.refresh();
  }

  hash(): string {
    const h = (seat: Seat) => { const f = this.f[seat], s = this.s[seat]; return `${f.hp}:${f.ap}:${f.state}:${s.g.toFixed(2)}:${s.charge?.id ?? '-'}`; };
    return `${h('ren')};${h('marek')};${this.t.toFixed(3)};${this.i}`;
  }
}

const pct = (a: number, b: number): number => (b > 0 ? Math.max(0, Math.min(100, Math.round((a / b) * 1000) / 10)) : 0);
/** every blow, effect and reaction of the script, before the duel plays: a blow's run-up starts before it lands (the replay never draws a lunge from its
 *  impact on), an action's first blow winds up over at most 60 % of its charge, an enchaînement's next blow over at most 80 % of the gap since the one
 *  before (its lunge kept), never before the end of the striker's own stun; a dodge starts 0.1 s before the blow it avoids */
export function windowsOf(log: AutoEvent[] | undefined, ids: Record<string, Seat>, acts: Record<Seat, Map<string, AutoAction>>): { wins: Record<Seat, AutoWindow[]>; reacts: Record<Seat, AutoWindow[]> } {
  const wins: Record<Seat, AutoWindow[]> = { ren: [], marek: [] }, reacts: Record<Seat, AutoWindow[]> = { ren: [], marek: [] };
  const charge: Record<Seat, { start: number; leave: number } | null> = { ren: null, marek: null };
  const prevHit: Record<Seat, number> = { ren: -1e9, marek: -1e9 }, stunEnd: Record<Seat, number> = { ren: -1e9, marek: -1e9 };
  for (const e of log ?? []) {
    const seat = ids[e.who]; if (!seat) continue;
    const other: Seat = seat === 'ren' ? 'marek' : 'ren';
    if (e.ev === 'charge') { charge[seat] = { start: e.t, leave: e.at ?? e.t }; continue; }
    if (e.ev === 'break') { stunEnd[seat] = e.t + AUTO_RULES.brk.stun; continue; }
    const a = e.act ? acts[seat].get(e.act) : undefined; if (!a) continue;
    const c = charge[seat], len = c ? Math.max(0, c.leave - c.start) : Infinity, free = e.t - stunEnd[seat];
    // at least 0.04 s, never begun in the striker's own stun (a charge paused by a break can leave a moment after it: the run-up then as short as that)
    const cap = (w: number): number => (free > 0 ? Math.min(Math.max(0.04, w), free) : Math.max(0.04, w));
    const kind = kindOf(a), id = a.id;
    if (e.ev === 'ward' || e.ev === 'boost') {
      const lead = cap(Math.min(WIND.effect, 0.6 * len));
      wins[seat].push({ name: animOf(a), t0: e.t - lead, impactAt: lead, dur: lead + 0.35, id, kind, family: e.ev === 'ward' ? 'defensive' : 'support' });
      charge[seat] = null; continue;
    }
    const first = !!c;
    const lead = first ? cap(Math.min(kind === 'light' ? WIND.light : kind === 'heavy' ? WIND.heavy : WIND.skill, 0.6 * len)) : cap(Math.min(WIND.nextHit, 0.8 * (e.t - prevHit[seat])));
    wins[seat].push({ name: animOf(a), t0: e.t - lead, impactAt: lead, dur: lead + WIND.follow, ...(first ? {} : { follow: true }), id, kind, family: familyOf(a) ?? 'offensive' });
    prevHit[seat] = e.t; charge[seat] = null;
    if (e.ev === 'dodged') reacts[other].push({ name: 'dodge', t0: e.t - 0.1, impactAt: 0.1, dur: WIND.dodge, id: 'dodge', kind: 'light', family: 'defensive' });
    else if (e.ev === 'guarded') reacts[other].push({ name: 'block', t0: e.t, impactAt: 1e6, dur: WIND.block, id: 'block', kind: 'light', family: 'defensive' });
    else reacts[other].push({ name: 'hit', t0: e.t, impactAt: 0, dur: WIND.flinch, id: 'hit', kind: 'light', family: 'defensive' });
  }
  for (const seat of SEATS) { wins[seat].sort((x, y) => x.t0 - y.t0); reacts[seat].sort((x, y) => x.t0 - y.t0); }
  return { wins, reacts };
}

function actionsOf(x: AutoFighter): Map<string, AutoAction> {
  const m = new Map<string, AutoAction>();
  for (const a of [x.light, x.heavy, ...x.skills]) m.set(a.id, a);
  return m;
}

/** the arena's own page (`?scene=arena`, outside a game): Ren of a new game (his start, the four of the start kit at level 1, the training sword) against
 *  the pool's Marek (or `foe`, a rival's sheet in its own duel; DEV a generic fighter), a fixed seed; `seed` another duel; DEV `o` another weapon or four skills
 *  (the proofs of the gauge's enchaînements, journal Passe LC7) */
export function sceneAutoDuel(foe = 'marek', seed = 1337, o: { weapon?: string | null; loadout?: readonly string[] } = {}): { result: AutoResult; ren: AutoFighter; foe: AutoFighter } {
  const loadout = o.loadout?.length ? [...o.loadout] : V2_START_KIT.loadout;
  const ren = autoRen({ ...REN_BASE }, { loadout, levels: o.loadout?.length ? Object.fromEntries(loadout.map((id) => [id, 1])) : V2_START_KIT.levels }, o.weapon ? { weapon: o.weapon } : {});
  const g = GENERICS[foe];
  const f = g ? autoFoe(foe, autoGenericSheet(g.profile, g, 0, 0), { kitOf: g.profile }) : autoFoe(foe, autoRaceSheet(foe, 0, 0));
  return { result: autoDuel(ren, f, seed, { log: true, trace: true }), ren, foe: f };
}
