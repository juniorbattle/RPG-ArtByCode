/** The arena's combat simulation (journal Passe P1): a TypeScript port of the published prototype's `CombatSimulation v2`
 *  (`arena/arena.html`, the `CombatLib` script), rule for rule and in the same arithmetic order, so the same inputs give the same
 *  state (`tests/arena-sim.test.mjs` runs both on one input script and compares their hashes and event streams). Pure logic: no
 *  sprites, meshes, cameras or DOM; deterministic, fixed timestep, an event stream the presentation reads.
 *  Rules (the prototype's numbers, placeholders to tune):
 *   - no waiting time to act: an action only has a charge time (impactAt), light ~ instant, heavy = 2.5 x light;
 *   - action points (AP): max 5, start 3; a light attack gains 1 AP when it connects, a heavy neither gains nor spends;
 *   - guard: hold to reduce damage by 60 %, costs no AP; a heavy hit on a guarding fighter stuns it (guard break);
 *   - dodge: costs 1 AP, pressed inside the enemy's reaction window;
 *   - techniques (4): 2+ AP, nearly instant, each with a cooldown;
 *   - the enemy has no AP: it plays sequences (a combo of 2-4 hits ending on a heavy, a single light or a single heavy), then rests. */

export type FighterId = 'ren' | 'marek';
export type ActionKind = 'light' | 'heavy' | 'tech';
export type ActionId = 'light' | 'heavy' | 't1' | 't2' | 't3' | 't4' | 'm_slash' | 'm_heavy';
export type FighterState = 'idle' | 'acting' | 'recovering' | 'stunned' | 'down';

export interface ActionDef {
  id: ActionId; owner: FighterId; name: string; short?: string; kind: ActionKind;
  impactAt: number; follow: number; recover: number; damage: number;
  apCost?: number; apGain?: number; cooldown?: number; anim: string;
  stunsGuard?: boolean; ignoreGuard?: boolean; stun?: number; reactable?: boolean; windowDur?: number;
}

export interface CombatData {
  dt: number;
  ap: { max: number; start: number };
  windowBuffer: number; reactLinger: number; flinch: number; bufferTime: number;
  guard: { raiseTime: number; reduce: number; breakStun: number; stunChance: number };
  ai: { seed: number; start: number; rest: [number, number]; comboGap: [number, number]; comboLen: [number, number]; weights: { combo: number; singleLight: number; singleHeavy: number }; light: ActionId; heavy: ActionId };
  fighters: Record<FighterId, { name: string; maxHp: number; usesAp?: boolean; ai?: boolean }>;
  techOrder: ActionId[];
  actions: Record<ActionId, ActionDef>;
  reactions: { dodge: { apCost: number } };
}

export const COMBAT_DATA: CombatData = {
  dt: 1 / 120,
  ap: { max: 5, start: 3 },
  windowBuffer: 0.15,
  reactLinger: 0.28,
  flinch: 0.28,
  bufferTime: 0.20,
  guard: { raiseTime: 0.10, reduce: 0.60, breakStun: 2.4, stunChance: 1.0 },
  ai: { seed: 1337, start: 1.0, rest: [5, 10], comboGap: [0.25, 0.42], comboLen: [2, 4], weights: { combo: 0.6, singleLight: 0.2, singleHeavy: 0.2 }, light: 'm_slash', heavy: 'm_heavy' },
  fighters: {
    ren: { name: 'Ren', maxHp: 200, usesAp: true },
    marek: { name: 'Marek', maxHp: 800, ai: true },
  },
  techOrder: ['t1', 't2', 't3', 't4'],
  actions: {
    light: { id: 'light', owner: 'ren', name: 'Attaque rapide', kind: 'light', impactAt: 0.20, follow: 0.16, recover: 0.22, damage: 10, apCost: 0, apGain: 1, anim: 'strike' },
    heavy: { id: 'heavy', owner: 'ren', name: 'Attaque puissante', kind: 'heavy', impactAt: 0.50, follow: 0.30, recover: 0.30, damage: 26, apCost: 0, apGain: 0, anim: 'heavy', stunsGuard: true },
    t1: { id: 't1', owner: 'ren', name: 'Coup éclair', kind: 'tech', impactAt: 0.16, follow: 0.26, recover: 0.12, damage: 22, apCost: 2, cooldown: 4, anim: 'skill' },
    t2: { id: 't2', owner: 'ren', name: 'Fente perçante', kind: 'tech', impactAt: 0.18, follow: 0.26, recover: 0.12, damage: 20, apCost: 2, cooldown: 6, anim: 'skill', ignoreGuard: true },
    t3: { id: 't3', owner: 'ren', name: 'Tourbillon', kind: 'tech', impactAt: 0.20, follow: 0.28, recover: 0.14, damage: 28, apCost: 3, cooldown: 9, anim: 'slash', stun: 1.0 },
    t4: { id: 't4', owner: 'ren', name: 'Estocade du champion', short: 'Estocade', kind: 'tech', impactAt: 0.24, follow: 0.34, recover: 0.16, damage: 58, apCost: 4, cooldown: 14, anim: 'skill' },
    m_slash: { id: 'm_slash', owner: 'marek', name: 'Taille', kind: 'light', impactAt: 0.30, follow: 0.22, recover: 0.10, damage: 16, anim: 'slash', reactable: true, windowDur: 0.22 },
    m_heavy: { id: 'm_heavy', owner: 'marek', name: 'Coup puissant', kind: 'heavy', impactAt: 0.75, follow: 0.35, recover: 0.25, damage: 48, anim: 'heavy', reactable: true, windowDur: 0.42, stunsGuard: true },
  },
  reactions: { dodge: { apCost: 1 } },
};

/** what a fighter's sprite shows: the clip, its clock and length, the impact time inside it */
export interface AnimState { name: string; t: number; dur: number; impactAt?: number; loop?: boolean; stunned?: boolean; guard?: boolean }

export type ImpactResult = 'hit' | 'dodged' | 'guarded' | 'guardbreak';
/** the event stream (`drain`): every event carries the simulation time `t` */
export type CombatEvent = { t?: number } & (
  | { type: 'reset' }
  | { type: 'guardUp' | 'guardDown'; who: FighterId }
  | { type: 'apSpend' | 'apGain'; who: FighterId; amount: number; ap: number }
  | { type: 'commandStart'; who: FighterId; action: ActionId; cast: number; kind: ActionKind; reactable: boolean; instant: boolean; seqIdx: number; seqLen: number; comboStart: boolean }
  | { type: 'commandDenied'; who: FighterId; action: ActionId; why: 'state' | 'ap' | 'cooldown' | 'busy' }
  | { type: 'reactDenied'; who: FighterId; kind: string; why: string }
  | { type: 'reactStart'; who: FighterId; kind: string; cost: number; early: boolean }
  | { type: 'reactEnd'; who: FighterId; kind: string }
  | { type: 'stun'; who: FighterId; dur: number; why: string }
  | { type: 'stunEnd'; who: FighterId }
  | { type: 'impact'; from: FighterId; to: FighterId; action: ActionId; kind: ActionKind; result: ImpactResult; damage: number; mitigated: number; hp: number }
  | { type: 'ko'; who: FighterId }
  | { type: 'techReady'; who: FighterId; action: ActionId }
  | { type: 'windowOpen'; who: FighterId; action: ActionId; dur: number }
  | { type: 'windowClose'; who: FighterId; action: ActionId }
);

export interface Fighter {
  id: FighterId; name: string; hp: number; maxHp: number; ap: number; usesAp: boolean; state: FighterState; stateT: number;
  act: { def: ActionDef; t: number; impacted: boolean; windowOpened: boolean } | null;
  recoverLeft: number; recoverDur: number; stunLeft: number; stunDur: number; flinch: number;
  react: { type: 'dodge'; tStart: number; impactAbs: number; until: number; fromState: FighterState } | null;
  guardHeld: boolean; guarding: boolean; guardT: number; cd: Partial<Record<ActionId, number>>; buffer: { id: ActionId; until: number } | null;
  plan: ActionId[]; seqLen: number; seqIdx: number; resting: boolean; aiWait: number; anim: AnimState | null; lastAction: ActionId | null;
}

export interface Incoming {
  from: FighterId; action: ActionId; name: string; kind: ActionKind; t: number; impactAt: number; castProgress: number;
  windowOpensAt: number; windowDur: number; windowOpen: boolean; windowRemaining: number; windowProgress: number; timeToImpact: number;
}

export class CombatSim {
  t = 0;
  tick = 0;
  over = false;
  events: CombatEvent[] = [];
  f = {} as Record<FighterId, Fighter>;
  private ar = 1;
  /** the prototype's guard-break chance generator: seeded lazily by the first step, never reset (as there) */
  private rng = 0;

  constructor(readonly D: CombatData = COMBAT_DATA) { this.reset(); }

  reset(): void {
    const D = this.D; this.t = 0; this.events = []; this.tick = 0; this.over = false; this.f = {} as Record<FighterId, Fighter>;
    for (const id of Object.keys(D.fighters) as FighterId[]) {
      const d = D.fighters[id], cd: Partial<Record<ActionId, number>> = {};
      D.techOrder.forEach((k) => { cd[k] = 0; });
      this.f[id] = {
        id, name: d.name, hp: d.maxHp, maxHp: d.maxHp, ap: d.usesAp ? D.ap.start : 0, usesAp: !!d.usesAp, state: 'idle', stateT: 0, act: null,
        recoverLeft: 0, recoverDur: 0, stunLeft: 0, stunDur: 0, flinch: 0, react: null, guardHeld: false, guarding: false, guardT: 0, cd, buffer: null,
        plan: [], seqLen: 0, seqIdx: 0, resting: false, aiWait: D.ai.start, anim: null, lastAction: null,
      };
    }
    this.ar = (D.ai.seed >>> 0) || 1; this.refreshAnims(); this.emit({ type: 'reset' });
  }

  /** deterministic enemy randomness (mulberry32), independent of any other random use */
  private rand(): number { let t = (this.ar += 0x6D2B79F5) >>> 0; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  private rr(range: [number, number]): number { return range[0] + (range[1] - range[0]) * this.rand(); }
  private newSequence(): ActionId[] {
    const A = this.D.ai, W = A.weights, x = this.rand() * (W.combo + W.singleLight + W.singleHeavy);
    let plan: ActionId[];
    if (x < W.combo) { const n = A.comboLen[0] + Math.floor(this.rand() * (A.comboLen[1] - A.comboLen[0] + 1)); plan = []; for (let i = 0; i < n - 1; i++) plan.push(A.light); plan.push(A.heavy); }
    else if (x < W.combo + W.singleLight) plan = [A.light]; else plan = [A.heavy];
    return plan;
  }
  private emit(e: CombatEvent): void { e.t = this.t; this.events.push(e); }
  drain(): CombatEvent[] { const e = this.events; this.events = []; return e; }
  private set(f: Fighter, s: FighterState): void { f.state = s; f.stateT = 0; }
  private other(f: Fighter): Fighter { return this.f[f.id === 'ren' ? 'marek' : 'ren']; }

  // ---- player-side queries
  cooldownLeft(who: FighterId, id: ActionId): number { const f = this.f[who]; return f && f.cd[id] ? f.cd[id]! : 0; }
  canAfford(who: FighterId, id: ActionId): boolean { const f = this.f[who], a = this.D.actions[id]; return !!(f && a && f.ap >= (a.apCost || 0)); }
  /** can this action start right now? */
  canUse(who: FighterId, id: ActionId): boolean {
    const f = this.f[who], a = this.D.actions[id]; if (!f || !a || a.owner !== who || this.over) return false;
    return f.state === 'idle' && this.canAfford(who, id) && !(a.cooldown && f.cd[id]! > 0);
  }
  /** usable soon (affordable, off cooldown), ignoring the current busy state: used by the HUD */
  available(who: FighterId, id: ActionId): boolean {
    const f = this.f[who], a = this.D.actions[id]; if (!f || !a || this.over) return false;
    return f.state !== 'down' && f.state !== 'stunned' && this.canAfford(who, id) && !(a.cooldown && f.cd[id]! > 0);
  }
  private start(f: Fighter, a: ActionDef): void {
    if (f.guarding) { f.guarding = false; f.guardT = 0; this.emit({ type: 'guardDown', who: f.id }); }
    f.buffer = null; f.ap -= (a.apCost || 0); if (a.cooldown) f.cd[a.id] = a.cooldown;
    f.act = { def: a, t: 0, impacted: false, windowOpened: false }; f.lastAction = a.id; this.set(f, 'acting');
    if (a.apCost) this.emit({ type: 'apSpend', who: f.id, amount: a.apCost, ap: f.ap });
    this.emit({ type: 'commandStart', who: f.id, action: a.id, cast: a.impactAt, kind: a.kind, reactable: !!a.reactable, instant: a.impactAt <= 0.25, seqIdx: f.seqIdx || 0, seqLen: f.seqLen || 0, comboStart: f.id === 'marek' && f.seqLen > 1 && f.seqIdx === 1 });
  }
  command(who: FighterId, actionId: ActionId): boolean | 'buffered' {
    const f = this.f[who], a = this.D.actions[actionId];
    if (!f || !a || a.owner !== who || this.over || f.state === 'down' || f.state === 'stunned') { this.emit({ type: 'commandDenied', who, action: actionId, why: 'state' }); return false; }
    if (!this.canAfford(who, actionId)) { this.emit({ type: 'commandDenied', who, action: actionId, why: 'ap' }); return false; }
    if (a.cooldown && f.cd[actionId]! > 0) { this.emit({ type: 'commandDenied', who, action: actionId, why: 'cooldown' }); return false; }
    if (f.state === 'idle') { this.start(f, a); return true; }
    if (this.busyLeft(f) > this.D.bufferTime) { this.emit({ type: 'commandDenied', who, action: actionId, why: 'busy' }); return false; }
    f.buffer = { id: actionId, until: this.t + this.D.bufferTime }; return 'buffered';
  }
  private busyLeft(f: Fighter): number {
    if (f.state === 'acting') { const d = f.act!.def; return Math.max(0, d.impactAt + d.follow + d.recover - f.act!.t); }
    if (f.state === 'recovering') return Math.max(0, f.recoverLeft);
    return 0;
  }
  /** debug / scripted: start an action ignoring AP, cooldown and state */
  forceAction(who: FighterId, actionId: ActionId): boolean {
    const f = this.f[who], a = this.D.actions[actionId]; if (!f || !a || f.state === 'down') return false;
    f.act = null; f.react = null; f.stunLeft = 0; f.buffer = null; f.state = 'idle'; const ap = f.ap; f.ap = 99; this.start(f, a); f.ap = ap; return true;
  }
  refill(who: FighterId): void { const f = this.f[who]; if (!f || f.state === 'down') return; f.ap = this.D.ap.max; for (const k of Object.keys(f.cd) as ActionId[]) f.cd[k] = 0; }
  setGuard(who: FighterId, on: boolean): void { const f = this.f[who]; if (f) f.guardHeld = !!on; }

  /** the incoming reactable attack, if any */
  incoming(): Incoming | null {
    const m = this.f.marek; if (!m.act || !m.act.def.reactable || m.act.impacted) return null;
    const d = m.act.def, t = m.act.t, wd = d.windowDur!, wOpen = d.impactAt - wd;
    return {
      from: 'marek', action: d.id, name: d.name, kind: d.kind, t, impactAt: d.impactAt, castProgress: Math.min(1, t / d.impactAt),
      windowOpensAt: wOpen, windowDur: wd, windowOpen: t >= wOpen, windowRemaining: Math.max(0, d.impactAt - t),
      windowProgress: Math.max(0, Math.min(1, (t - wOpen) / wd)), timeToImpact: d.impactAt - t,
    };
  }
  canReact(who: FighterId, type: 'dodge'): boolean {
    const f = this.f[who], R = this.D.reactions[type], inc = this.incoming(); if (!f || !R || !inc || this.over || f.react) return false;
    if (f.state !== 'idle' && f.state !== 'recovering') return false;
    return f.ap >= R.apCost && inc.t >= inc.windowOpensAt - this.D.windowBuffer;
  }
  react(who: FighterId, type: 'dodge'): boolean {
    const f = this.f[who], R = this.D.reactions[type], inc = this.incoming();
    const deny = (why: string) => { this.emit({ type: 'reactDenied', who, kind: type, why }); return false; };
    if (!f || !R || this.over || f.state === 'down') return deny('state');
    if (f.react) return deny('busy'); if (!inc) return deny('none');
    if (f.state !== 'idle' && f.state !== 'recovering') return deny('state');
    if (inc.t < inc.windowOpensAt - this.D.windowBuffer) return deny('early');
    if (f.ap < R.apCost) return deny('ap');
    f.ap -= R.apCost; const impactAbs = this.t + inc.timeToImpact;
    f.react = { type, tStart: this.t, impactAbs, until: Math.max(this.t + 0.45, impactAbs + this.D.reactLinger), fromState: f.state };
    this.emit({ type: 'apSpend', who, amount: R.apCost, ap: f.ap }); this.emit({ type: 'reactStart', who, kind: type, cost: R.apCost, early: !inc.windowOpen }); return true;
  }

  private stun(f: Fighter, dur: number, why: string): void {
    f.act = null; f.react = null; f.buffer = null; f.guarding = false; f.stunLeft = f.stunDur = dur; if (f.id === 'marek') { f.plan = []; f.seqLen = 0; f.seqIdx = 0; } this.set(f, 'stunned');
    this.emit({ type: 'stun', who: f.id, dur, why });
  }
  private resolve(attacker: Fighter): void {
    const D = this.D, a = attacker.act!.def, target = this.other(attacker); attacker.act!.impacted = true; if (target.state === 'down') return;
    let result: ImpactResult = 'hit', dmg = a.damage, mit = 0;
    if (target.react && this.t <= target.react.until && target.react.type === 'dodge') { result = 'dodged'; dmg = 0; }
    else if (target.guarding && target.guardT >= D.guard.raiseTime && !a.ignoreGuard) {
      mit = D.guard.reduce; dmg = Math.round(a.damage * (1 - mit)); result = 'guarded';
      if (a.stunsGuard && this.chance(D.guard.stunChance)) result = 'guardbreak';
    }
    if (dmg > 0) target.hp = Math.max(0, target.hp - dmg);
    if (result === 'hit') target.flinch = D.flinch;
    let gained = 0; if (attacker.usesAp && a.apGain && result !== 'dodged') { const before = attacker.ap; attacker.ap = Math.min(D.ap.max, attacker.ap + a.apGain); gained = attacker.ap - before; }
    this.emit({ type: 'impact', from: attacker.id, to: target.id, action: a.id, kind: a.kind, result, damage: dmg, mitigated: mit, hp: target.hp });
    if (gained) this.emit({ type: 'apGain', who: attacker.id, amount: gained, ap: attacker.ap });
    if (target.hp <= 0) { this.set(target, 'down'); target.act = null; target.guarding = false; this.over = true; this.emit({ type: 'ko', who: target.id }); return; }
    if (result === 'guardbreak') this.stun(target, D.guard.breakStun, 'guardbreak');
    else if (result === 'hit' && a.stun) this.stun(target, a.stun, 'technique');
  }
  private chance(p: number): boolean { if (p >= 1) return true; this.rng = (this.rng * 1103515245 + 12345) & 0x7fffffff; return (this.rng / 0x7fffffff) < p; }

  /** a fighter just became free: run the queued action, or let the AI schedule */
  private free(f: Fighter): void {
    f.act = null; this.set(f, 'idle');
    if (f.id === 'marek') { if (f.plan.length) { f.aiWait = this.rr(this.D.ai.comboGap); f.resting = false; } else { f.aiWait = this.rr(this.D.ai.rest); f.resting = true; f.seqLen = 0; f.seqIdx = 0; } }
    if (f.buffer && f.buffer.until >= this.t) { const id = f.buffer.id, a = this.D.actions[id]; f.buffer = null; if (a && this.canUse(f.id, id)) this.start(f, a); } else f.buffer = null;
  }

  step(dt?: number): void {
    const D = this.D; dt = dt || D.dt; this.t += dt; this.tick++; this.rng = this.rng || 12345;
    for (const id of Object.keys(this.f) as FighterId[]) {
      const f = this.f[id]; f.stateT += dt; if (f.flinch > 0) f.flinch = Math.max(0, f.flinch - dt);
      for (const k of Object.keys(f.cd) as ActionId[]) if (f.cd[k]! > 0) { f.cd[k] = Math.max(0, f.cd[k]! - dt); if (f.cd[k] === 0) this.emit({ type: 'techReady', who: id, action: k }); }
      if (f.react && this.t > f.react.until) { this.emit({ type: 'reactEnd', who: id, kind: f.react.type }); f.react = null; }
      const g = f.guardHeld && f.state === 'idle' && !this.over; if (g !== f.guarding) { f.guarding = g; this.emit({ type: g ? 'guardUp' : 'guardDown', who: id }); } f.guardT = f.guarding ? f.guardT + dt : 0;
      switch (f.state) {
        case 'idle':
          if (f.buffer) { if (f.buffer.until < this.t) f.buffer = null; else if (this.canUse(id, f.buffer.id)) { const ba = D.actions[f.buffer.id]; f.buffer = null; this.start(f, ba); break; } }
          if (id === 'marek' && !this.over) { f.aiWait -= dt; if (f.aiWait <= 0) { if (!f.plan.length) { f.plan = this.newSequence(); f.seqLen = f.plan.length; f.seqIdx = 0; } f.resting = false; f.seqIdx++; this.start(f, D.actions[f.plan.shift()!]); } }
          break;
        case 'stunned':
          f.stunLeft -= dt; if (f.stunLeft <= 0) { this.emit({ type: 'stunEnd', who: id }); this.set(f, 'idle'); if (id === 'marek') { f.aiWait = this.rr(this.D.ai.rest); f.resting = true; } }
          break;
        case 'acting': {
          const a = f.act!, d = a.def; a.t += dt;
          if (d.reactable && !a.windowOpened && a.t >= d.impactAt - d.windowDur!) { a.windowOpened = true; this.emit({ type: 'windowOpen', who: id, action: d.id, dur: d.windowDur! }); }
          if (!a.impacted && a.t >= d.impactAt) { this.resolve(f); if (d.reactable) this.emit({ type: 'windowClose', who: id, action: d.id }); }
          // `f.state` can change inside resolve (a KO); the prototype re-reads it here
          if ((f.state as FighterState) === 'acting' && a.t >= d.impactAt + d.follow) { f.recoverLeft = f.recoverDur = d.recover; this.set(f, 'recovering'); }
          break;
        }
        case 'recovering':
          f.recoverLeft -= dt; if (f.recoverLeft <= 0) this.free(f);
          break;
      }
    }
    this.refreshAnims();
  }

  private refreshAnims(): void {
    for (const id of Object.keys(this.f) as FighterId[]) {
      const f = this.f[id];
      let an: AnimState;
      if (f.state === 'down') an = { name: 'ko', t: f.stateT, dur: 0.9 };
      else if (f.state === 'stunned') an = { name: 'recover', t: f.stateT, dur: f.stunDur, stunned: true };
      else if (f.react) an = { name: f.react.type, t: this.t - f.react.tStart, dur: f.react.until - f.react.tStart, impactAt: f.react.impactAbs - f.react.tStart };
      else if (f.state === 'acting') { const d = f.act!.def; an = { name: d.anim, t: f.act!.t, dur: d.impactAt + d.follow, impactAt: d.impactAt }; }
      else if (f.guarding) an = { name: 'block', t: f.guardT, dur: 1e6, impactAt: 1e6, guard: true };
      else if (f.flinch > 0) an = { name: 'hit', t: this.D.flinch - f.flinch, dur: this.D.flinch };
      else if (id === 'marek' && f.resting) an = { name: 'idle', t: this.t, dur: 1, loop: true };
      else if (id === 'marek' || f.ap >= 2) an = { name: 'ready', t: this.t, dur: 1, loop: true };
      else an = { name: 'idle', t: this.t, dur: 1, loop: true };
      f.anim = an;
    }
  }

  advance(secs: number, cb?: (s: CombatSim) => boolean | void): boolean { const n = Math.round(secs / this.D.dt); for (let i = 0; i < n; i++) { this.step(this.D.dt); if (cb && cb(this) === true) return true; } return false; }
  advanceUntil(cond: (s: CombatSim) => boolean, max?: number): boolean { const n = Math.round((max || 30) / this.D.dt); for (let i = 0; i < n; i++) { if (cond(this)) return true; this.step(this.D.dt); } return cond(this); }
  hash(): string {
    let s = '';
    for (const id of Object.keys(this.f) as FighterId[]) { const f = this.f[id]; s += f.hp + ':' + f.ap + ':' + f.state + ':' + f.stateT.toFixed(3) + ':' + (Object.keys(f.cd) as ActionId[]).map((k) => f.cd[k]!.toFixed(2)).join(',') + ';'; }
    return s + this.t.toFixed(3);
  }
}

/** the fixed input script of `tools/arena-check.mjs` (120 s from a reset: attacks, guard, dodges in the windows); the simulation's
 *  fingerprint is its final hash. The prototype's recorded value: ARENA_SIM_HASH. */
export function runFingerprintScript(sim: { D: { dt: number }; t: number; over: boolean; incoming(): { windowOpen: boolean; kind: string } | null; react(w: 'ren', k: 'dodge'): unknown; setGuard(w: 'ren', on: boolean): void; command(w: 'ren', id: ActionId): unknown; step(dt: number): void; drain(): unknown[]; reset(): void }, onEvents?: (e: unknown[]) => void): void {
  const dt = sim.D.dt; let nextAct = 0.5, n = 0;
  for (let i = 0; i < Math.round(120 / dt); i++) {
    const inc = sim.incoming();
    if (inc && inc.windowOpen && inc.kind === 'heavy') sim.react('ren', 'dodge');
    sim.setGuard('ren', !!(inc && inc.kind === 'light' && !inc.windowOpen));
    if (sim.t >= nextAct) { const ids: ActionId[] = ['light', 'light', 'heavy', 't1', 'light', 't2', 't3', 't4']; sim.command('ren', ids[n++ % ids.length]); nextAct += 0.7; }
    sim.step(dt); const ev = sim.drain(); onEvents?.(ev); if (sim.over) sim.reset();
  }
}

/** the prototype's simulation hash after `runFingerprintScript` (tools/arena-check.mjs on arena/arena.html, journal Passe A1) */
export const ARENA_SIM_HASH = '152:1:idle:20.233:0.00,0.00,0.00,0.00;800:0:idle:5.283:0.00,0.00,0.00,0.00;20.233';
