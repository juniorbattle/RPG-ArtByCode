/** The duel of the « tour par tour dynamique » (lot C1 of briefs/combat-system.md § 15, journal Passe C1): the rules the operator gave in the
 *  combat workshop (Passe CB1, the specification's §§ 1-8 and its decisions CB-1 to CB-11), as a pure simulation. Behind a parameter (CB-10):
 *  the arena of today keeps `src/arena/CombatSim.ts` (the prototype's rules, its fingerprint `ARENA_SIM_HASH`); nothing here reaches it. No
 *  sprites, meshes, cameras or DOM; deterministic, fixed timestep, an event stream the presentation (C2) will read.
 *  Rules (numbers are starting points « à régler » at the operator's trial, after C2):
 *   - time never stops [G1]; the light attack is instant, the heavy attack and the skills start with an automatic preparation [G2];
 *   - action points (AP): 1 at the start (CB-5), 5 at most; the skills and the dodge spend them, a light attack that connects gains 1, the
 *     heavy neither gains nor spends; no cooldown [G4, G5]; a regain over time exists as a setting, off (`ap.regen` = 0, § 11);
 *   - the opponent alternates sequences (a combo, a single light, a single heavy) and pauses whose length follows its level [G1]; through a
 *     whole sequence, gaps included (CB-4), it has the priority: the player can only guard or dodge, an attack he tries does not leave [G3];
 *   - « repoussé » (CB-3): a player's action that has not landed when a sequence starts is cancelled, its AP given back; the player is pushed
 *     back and takes that sequence's first blow; an action that has landed ends normally;
 *   - guard: held, -60 % damage, no AP [G1, CB-5], never broken outright: a heavy blow fills the gauge faster, on a guard too [G5];
 *   - one resistance gauge per fighter, one rule [G3]: every blow that lands fills it, guarded ones too [G2], the heavy more; time empties it
 *     slowly [G4]; full, it breaks the fighter: stunned 5-10 s, slightly more damage taken, then back to zero [G3, G5];
 *   - four skill slots (families offensive / defensive / support [G1]) chosen before the duel [G2]: today's four techniques are offensive
 *     (Tourbillon loses its interrupt, § 5), a defensive skill (a ward: less damage and resistance taken for a while) and a support skill (a
 *     boost: more damage and resistance dealt for a while) join them; their effects are this session's proposal, to the trial (a heal without a
 *     cooldown was tried and dropped: the action points a light attack gains made its holder unbeatable, journal Passe C1);
 *   - the duel ends at the K.O. and only there [G4]. */

export type DynFighterId = 'ren' | 'marek';
export type DynKind = 'light' | 'heavy' | 'skill';
export type SkillFamily = 'offensive' | 'defensive' | 'support';
export type DynActionId = 'light' | 'heavy' | 't1' | 't2' | 't3' | 't4' | 'd1' | 's1' | 'm_slash' | 'm_heavy';
export type DynState = 'idle' | 'acting' | 'recovering' | 'pushed' | 'stunned' | 'down';

export interface DynActionDef {
  id: DynActionId; owner: DynFighterId; name: string; short?: string; kind: DynKind; family?: SkillFamily;
  /** the automatic preparation before the swing (s; 0 = instant) */
  prep: number;
  /** from the end of the preparation to the impact: the blow lands, or the skill's effect takes hold */
  impactAt: number;
  follow: number; recover: number; damage: number;
  /** what the blow adds to its target's resistance gauge when it lands (hit or guarded) */
  resist: number;
  apCost?: number; apGain?: number; ignoreGuard?: boolean; reactable?: boolean; windowDur?: number;
  /** a defensive skill's protection: for `dur` s, the damage and the resistance its holder takes are multiplied by these */
  ward?: { dur: number; damage: number; resist: number };
  /** a support skill's boost: for `dur` s, the damage and the resistance its holder's blows deal are multiplied by these */
  boost?: { dur: number; damage: number; resist: number };
  anim: string;
}

export interface DynData {
  dt: number;
  /** regen: one AP every `regen` s (0 = none, the specification's default) */
  ap: { max: number; start: number; regen: number };
  windowBuffer: number; reactLinger: number; dodgeMin: number; flinch: number; bufferTime: number;
  guard: { raiseTime: number; reduce: number };
  /** the gauge: its size, what time takes off per second, the share a guarded blow adds, the break's stun and damage multiplier */
  resist: { max: number; decay: number; guard: number; breakStun: number; breakDamage: number };
  /** the opponent: its level sets its pauses (`restByLevel`); `afterStun` = its wait before the next sequence once a stun ends */
  ai: { seed: number; start: number; afterStun: number; level: number; comboGap: [number, number]; comboLen: [number, number]; weights: { combo: number; singleLight: number; singleHeavy: number }; light: DynActionId; heavy: DynActionId };
  /** the pauses between sequences per level (s): shorter as the level rises, « presque le combat full actif » [G1] */
  restByLevel: Record<number, [number, number]>;
  fighters: Record<DynFighterId, { name: string; maxHp: number; usesAp?: boolean; ai?: boolean }>;
  /** the player's four skill slots, chosen before the duel [G2] */
  loadout: DynActionId[];
  actions: Record<DynActionId, DynActionDef>;
  reactions: { dodge: { apCost: number } };
}

/** the four slots' size; the skills of the catalogue fill them */
export const SKILL_SLOTS = 4;

export const DYNAMIC_DATA: DynData = {
  dt: 1 / 120,
  ap: { max: 5, start: 1, regen: 0 },
  windowBuffer: 0.15,
  reactLinger: 0.28,
  dodgeMin: 0.45,
  flinch: 0.28,
  bufferTime: 0.20,
  guard: { raiseTime: 0.10, reduce: 0.60 },
  resist: { max: 100, decay: 1.8, guard: 1, breakStun: 6, breakDamage: 1.2 },
  ai: { seed: 1337, start: 1.0, afterStun: 1.0, level: 3, comboGap: [0.25, 0.42], comboLen: [2, 4], weights: { combo: 0.6, singleLight: 0.2, singleHeavy: 0.2 }, light: 'm_slash', heavy: 'm_heavy' },
  restByLevel: { 1: [8, 12], 2: [6, 10], 3: [5, 9], 4: [3.5, 6.5], 5: [2, 4] },
  fighters: {
    ren: { name: 'Ren', maxHp: 2200, usesAp: true },
    marek: { name: 'Marek', maxHp: 8000, ai: true },
  },
  loadout: ['t1', 't4', 'd1', 's1'],
  actions: {
    light: { id: 'light', owner: 'ren', name: 'Attaque rapide', kind: 'light', prep: 0, impactAt: 0.20, follow: 0.16, recover: 0.22, damage: 10, resist: 3, apGain: 1, anim: 'strike' },
    heavy: { id: 'heavy', owner: 'ren', name: 'Attaque puissante', kind: 'heavy', prep: 0.34, impactAt: 0.16, follow: 0.30, recover: 0.30, damage: 26, resist: 8, anim: 'heavy' },
    t1: { id: 't1', owner: 'ren', name: 'Coup éclair', kind: 'skill', family: 'offensive', prep: 0.30, impactAt: 0.16, follow: 0.26, recover: 0.12, damage: 22, resist: 6, apCost: 2, anim: 'skillOff' },
    t2: { id: 't2', owner: 'ren', name: 'Fente perçante', kind: 'skill', family: 'offensive', prep: 0.40, impactAt: 0.18, follow: 0.26, recover: 0.12, damage: 20, resist: 5, apCost: 2, ignoreGuard: true, anim: 'skillOff' },
    t3: { id: 't3', owner: 'ren', name: 'Tourbillon', kind: 'skill', family: 'offensive', prep: 0.50, impactAt: 0.20, follow: 0.28, recover: 0.14, damage: 28, resist: 20, apCost: 3, anim: 'skillOff' },
    t4: { id: 't4', owner: 'ren', name: 'Estocade du champion', short: 'Estocade', kind: 'skill', family: 'offensive', prep: 0.70, impactAt: 0.24, follow: 0.34, recover: 0.16, damage: 58, resist: 10, apCost: 4, anim: 'skillOff' },
    d1: { id: 'd1', owner: 'ren', name: 'Rempart', kind: 'skill', family: 'defensive', prep: 0.30, impactAt: 0.10, follow: 0.20, recover: 0.10, damage: 0, resist: 0, apCost: 2, ward: { dur: 6, damage: 0.6, resist: 0.5 }, anim: 'skillDef' },
    s1: { id: 's1', owner: 'ren', name: 'Ferveur', kind: 'skill', family: 'support', prep: 0.50, impactAt: 0.10, follow: 0.20, recover: 0.10, damage: 0, resist: 0, apCost: 3, boost: { dur: 8, damage: 1.25, resist: 1.5 }, anim: 'skillSup' },
    m_slash: { id: 'm_slash', owner: 'marek', name: 'Taille', kind: 'light', prep: 0, impactAt: 0.30, follow: 0.22, recover: 0.10, damage: 20, resist: 6, reactable: true, windowDur: 0.22, anim: 'strike' },
    m_heavy: { id: 'm_heavy', owner: 'marek', name: 'Coup puissant', kind: 'heavy', prep: 0, impactAt: 0.75, follow: 0.35, recover: 0.25, damage: 60, resist: 16, reactable: true, windowDur: 0.42, anim: 'heavy' },
  },
  reactions: { dodge: { apCost: 1 } },
};

/** what a fighter's sprite shows: the clip, its clock and length, the impact time inside it (the preparation held before it) */
export interface DynAnimState { name: string; t: number; dur: number; impactAt?: number; prep?: number; loop?: boolean; stunned?: boolean; guard?: boolean }

export type DynImpactResult = 'hit' | 'dodged' | 'guarded';
/** the event stream (`drain`): every event carries the simulation time `t` */
export type DynEvent = { t?: number } & (
  | { type: 'reset' }
  | { type: 'guardUp' | 'guardDown'; who: DynFighterId }
  | { type: 'apSpend' | 'apGain'; who: DynFighterId; amount: number; ap: number; why?: 'regen' }
  | { type: 'commandStart'; who: DynFighterId; action: DynActionId; kind: DynKind; prep: number; impactAt: number; reactable: boolean; seqIdx: number; seqLen: number }
  | { type: 'commandDenied'; who: DynFighterId; action: DynActionId; why: 'state' | 'ap' | 'busy' | 'defense' | 'slot' }
  | { type: 'pushed'; who: DynFighterId; action: DynActionId; refund: number; ap: number }
  | { type: 'reactDenied'; who: DynFighterId; kind: string; why: string }
  | { type: 'reactStart'; who: DynFighterId; kind: string; cost: number; early: boolean }
  | { type: 'reactEnd'; who: DynFighterId; kind: string }
  | { type: 'sequenceStart'; who: DynFighterId; len: number }
  | { type: 'sequenceEnd'; who: DynFighterId }
  | { type: 'break'; who: DynFighterId }
  | { type: 'stun'; who: DynFighterId; dur: number; why: string }
  | { type: 'stunEnd'; who: DynFighterId }
  | { type: 'impact'; from: DynFighterId; to: DynFighterId; action: DynActionId; kind: DynKind; result: DynImpactResult; damage: number; mitigated: number; hp: number; resist: number }
  | { type: 'effect'; who: DynFighterId; action: DynActionId; family: SkillFamily; dur: number }
  | { type: 'wardEnd' | 'boostEnd'; who: DynFighterId }
  | { type: 'ko'; who: DynFighterId }
  | { type: 'windowOpen'; who: DynFighterId; action: DynActionId; dur: number }
  | { type: 'windowClose'; who: DynFighterId; action: DynActionId }
);

export interface DynFighter {
  id: DynFighterId; name: string; hp: number; maxHp: number; ap: number; usesAp: boolean; state: DynState; stateT: number;
  act: { def: DynActionDef; t: number; impacted: boolean; windowOpened: boolean } | null;
  recoverLeft: number; recoverDur: number; stunLeft: number; stunDur: number; flinch: number;
  react: { type: 'dodge'; tStart: number; impactAbs: number; until: number } | null;
  guardHeld: boolean; guarding: boolean; guardT: number; buffer: { id: DynActionId; until: number } | null;
  /** the resistance gauge; `broken` while its break's stun lasts (the gauge held full, then back to zero) */
  resist: number; broken: boolean;
  ward: { left: number; dur: number; damage: number; resist: number } | null;
  boost: { left: number; dur: number; damage: number; resist: number } | null;
  /** the AP regain's clock (only with `ap.regen` > 0) */
  apClock: number;
  /** the opponent: its sequence (`inSeq` from the first blow's start to the end of the last one, gaps included: the player's defence) */
  plan: DynActionId[]; seqLen: number; seqIdx: number; inSeq: boolean; resting: boolean; aiWait: number;
  anim: DynAnimState | null; lastAction: DynActionId | null;
}

export interface DynIncoming {
  from: DynFighterId; action: DynActionId; name: string; kind: DynKind; t: number; impactAt: number; castProgress: number;
  windowOpensAt: number; windowDur: number; windowOpen: boolean; windowRemaining: number; windowProgress: number; timeToImpact: number;
}

const IDS: DynFighterId[] = ['ren', 'marek'];
/** an action's impact time from its start: its preparation, then its swing */
export const impactTime = (d: DynActionDef): number => d.prep + d.impactAt;

/** the data's own checks: four distinct skills of the player in the slots, a pause range for the opponent's level */
export function checkDynData(D: DynData): void {
  const L = D.loadout;
  if (L.length !== SKILL_SLOTS || new Set(L).size !== L.length) throw new Error(`loadout: ${SKILL_SLOTS} distinct skills, got ${L.join(', ')}`);
  for (const id of L) { const a = D.actions[id]; if (!a || a.owner !== 'ren' || a.kind !== 'skill' || !a.family) throw new Error(`loadout: "${id}" is not one of the player's skills`); }
  const r = D.restByLevel[D.ai.level];
  if (!r || !(r[0] > 0 && r[1] >= r[0])) throw new Error(`no pause range for the opponent's level ${D.ai.level}`);
}

export class DynamicSim {
  t = 0;
  tick = 0;
  over = false;
  events: DynEvent[] = [];
  f = {} as Record<DynFighterId, DynFighter>;
  private ar = 1;

  constructor(readonly D: DynData = DYNAMIC_DATA) { checkDynData(D); this.reset(); }

  reset(): void {
    const D = this.D; this.t = 0; this.events = []; this.tick = 0; this.over = false; this.f = {} as Record<DynFighterId, DynFighter>;
    for (const id of IDS) {
      const d = D.fighters[id];
      this.f[id] = {
        id, name: d.name, hp: d.maxHp, maxHp: d.maxHp, ap: d.usesAp ? D.ap.start : 0, usesAp: !!d.usesAp, state: 'idle', stateT: 0, act: null,
        recoverLeft: 0, recoverDur: 0, stunLeft: 0, stunDur: 0, flinch: 0, react: null, guardHeld: false, guarding: false, guardT: 0, buffer: null,
        resist: 0, broken: false, ward: null, boost: null, apClock: 0,
        plan: [], seqLen: 0, seqIdx: 0, inSeq: false, resting: false, aiWait: D.ai.start, anim: null, lastAction: null,
      };
    }
    this.ar = (D.ai.seed >>> 0) || 1; this.refreshAnims(); this.emit({ type: 'reset' });
  }

  /** deterministic opponent randomness (mulberry32), independent of any other random use */
  private rand(): number { let t = (this.ar += 0x6D2B79F5) >>> 0; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  private rr(range: [number, number]): number { return range[0] + (range[1] - range[0]) * this.rand(); }
  /** the opponent's pause after a sequence: drawn in its level's range */
  restRange(): [number, number] { return this.D.restByLevel[this.D.ai.level]; }
  private newSequence(): DynActionId[] {
    const A = this.D.ai, W = A.weights, x = this.rand() * (W.combo + W.singleLight + W.singleHeavy);
    let plan: DynActionId[];
    if (x < W.combo) { const n = A.comboLen[0] + Math.floor(this.rand() * (A.comboLen[1] - A.comboLen[0] + 1)); plan = []; for (let i = 0; i < n - 1; i++) plan.push(A.light); plan.push(A.heavy); }
    else if (x < W.combo + W.singleLight) plan = [A.light]; else plan = [A.heavy];
    return plan;
  }
  private emit(e: DynEvent): void { e.t = this.t; this.events.push(e); }
  drain(): DynEvent[] { const e = this.events; this.events = []; return e; }
  private set(f: DynFighter, s: DynState): void { f.state = s; f.stateT = 0; }
  private other(f: DynFighter): DynFighter { return this.f[f.id === 'ren' ? 'marek' : 'ren']; }

  // ---- player-side queries
  /** the opponent is in a sequence: the player's defence phase (CB-4: from its first blow's start to the end of its last, gaps included) */
  inSequence(): boolean { return this.f.marek.inSeq; }
  canAfford(who: DynFighterId, id: DynActionId): boolean { const f = this.f[who], a = this.D.actions[id]; return !!(f && a && f.ap >= (a.apCost || 0)); }
  /** a skill the player brought: one of the four slots */
  inLoadout(id: DynActionId): boolean { return this.D.actions[id]?.kind !== 'skill' || this.D.loadout.includes(id); }
  /** can this action start right now? */
  canUse(who: DynFighterId, id: DynActionId): boolean {
    const f = this.f[who], a = this.D.actions[id]; if (!f || !a || a.owner !== who || this.over) return false;
    return f.state === 'idle' && this.canAfford(who, id) && (who !== 'ren' || (this.inLoadout(id) && !this.inSequence()));
  }
  /** usable soon (brought, affordable), ignoring the current busy state and the defence phase: for the HUD */
  available(who: DynFighterId, id: DynActionId): boolean {
    const f = this.f[who], a = this.D.actions[id]; if (!f || !a || this.over) return false;
    return f.state !== 'down' && f.state !== 'stunned' && this.canAfford(who, id) && (who !== 'ren' || this.inLoadout(id));
  }
  private start(f: DynFighter, a: DynActionDef): void {
    if (f.guarding) { f.guarding = false; f.guardT = 0; this.emit({ type: 'guardDown', who: f.id }); }
    f.buffer = null; f.ap -= (a.apCost || 0);
    f.act = { def: a, t: 0, impacted: false, windowOpened: false }; f.lastAction = a.id; this.set(f, 'acting');
    if (a.apCost) this.emit({ type: 'apSpend', who: f.id, amount: a.apCost, ap: f.ap });
    this.emit({ type: 'commandStart', who: f.id, action: a.id, kind: a.kind, prep: a.prep, impactAt: impactTime(a), reactable: !!a.reactable, seqIdx: f.seqIdx || 0, seqLen: f.seqLen || 0 });
  }
  command(who: DynFighterId, actionId: DynActionId): boolean | 'buffered' {
    const f = this.f[who], a = this.D.actions[actionId];
    const deny = (why: 'state' | 'ap' | 'busy' | 'defense' | 'slot') => { this.emit({ type: 'commandDenied', who, action: actionId, why }); return false; };
    if (!f || !a || a.owner !== who || this.over || f.state === 'down' || f.state === 'stunned' || f.state === 'pushed') return deny('state');
    if (who === 'ren' && !this.inLoadout(actionId)) return deny('slot');
    // the opponent's priority (G3, CB-4): through its whole sequence, an attack the player tries does not leave
    if (who === 'ren' && this.inSequence()) return deny('defense');
    if (!this.canAfford(who, actionId)) return deny('ap');
    if (f.state === 'idle') { this.start(f, a); return true; }
    if (this.busyLeft(f) > this.D.bufferTime) return deny('busy');
    f.buffer = { id: actionId, until: this.t + this.D.bufferTime }; return 'buffered';
  }
  private busyLeft(f: DynFighter): number {
    if (f.state === 'acting') { const d = f.act!.def; return Math.max(0, impactTime(d) + d.follow + d.recover - f.act!.t); }
    if (f.state === 'recovering') return Math.max(0, f.recoverLeft);
    return 0;
  }
  setGuard(who: DynFighterId, on: boolean): void { const f = this.f[who]; if (f) f.guardHeld = !!on; }
  /** debug / scripted: the opponent's next sequence is this plan, started at the next step (it must be idle, outside a sequence) */
  forceSequence(plan: DynActionId[]): boolean {
    const m = this.f.marek; if (this.over || m.state !== 'idle' || m.inSeq || !plan.length) return false;
    m.plan = [...plan]; m.seqLen = plan.length; m.seqIdx = 0; m.aiWait = 0; return true;
  }

  /** the incoming reactable attack, if any */
  incoming(): DynIncoming | null {
    const m = this.f.marek; if (!m.act || !m.act.def.reactable || m.act.impacted) return null;
    const d = m.act.def, t = m.act.t, hit = impactTime(d), wd = d.windowDur!, wOpen = hit - wd;
    return {
      from: 'marek', action: d.id, name: d.name, kind: d.kind, t, impactAt: hit, castProgress: Math.min(1, t / hit),
      windowOpensAt: wOpen, windowDur: wd, windowOpen: t >= wOpen, windowRemaining: Math.max(0, hit - t),
      windowProgress: Math.max(0, Math.min(1, (t - wOpen) / wd)), timeToImpact: hit - t,
    };
  }
  canReact(who: DynFighterId, type: 'dodge'): boolean {
    const f = this.f[who], R = this.D.reactions[type], inc = this.incoming(); if (!f || !R || !inc || this.over || f.react) return false;
    if (f.state !== 'idle' && f.state !== 'recovering') return false;
    return f.ap >= R.apCost && inc.t >= inc.windowOpensAt - this.D.windowBuffer;
  }
  react(who: DynFighterId, type: 'dodge'): boolean {
    const f = this.f[who], R = this.D.reactions[type], inc = this.incoming();
    const deny = (why: string) => { this.emit({ type: 'reactDenied', who, kind: type, why }); return false; };
    if (!f || !R || this.over || f.state === 'down') return deny('state');
    if (f.react) return deny('busy'); if (!inc) return deny('none');
    if (f.state !== 'idle' && f.state !== 'recovering') return deny('state');
    if (inc.t < inc.windowOpensAt - this.D.windowBuffer) return deny('early');
    if (f.ap < R.apCost) return deny('ap');
    f.ap -= R.apCost; const impactAbs = this.t + inc.timeToImpact;
    f.react = { type, tStart: this.t, impactAbs, until: Math.max(this.t + this.D.dodgeMin, impactAbs + this.D.reactLinger) };
    this.emit({ type: 'apSpend', who, amount: R.apCost, ap: f.ap }); this.emit({ type: 'reactStart', who, kind: type, cost: R.apCost, early: !inc.windowOpen }); return true;
  }

  /** the opponent starts a sequence: the player's defence phase begins; a player's action that has not landed is cancelled (CB-3) */
  private sequenceStart(m: DynFighter): void {
    m.inSeq = true; this.emit({ type: 'sequenceStart', who: m.id, len: m.seqLen });
    const r = this.other(m); r.buffer = null;
    if (r.state === 'acting' && !r.act!.impacted) {
      const a = r.act!.def, refund = a.apCost || 0;
      r.ap = Math.min(this.D.ap.max, r.ap + refund); r.act = null; this.set(r, 'pushed');
      this.emit({ type: 'pushed', who: r.id, action: a.id, refund, ap: r.ap });
    }
  }
  private sequenceEnd(m: DynFighter): void { if (!m.inSeq) return; m.inSeq = false; this.emit({ type: 'sequenceEnd', who: m.id }); }

  private stun(f: DynFighter, dur: number, why: string): void {
    f.act = null; f.react = null; f.buffer = null; f.guarding = false; f.stunLeft = f.stunDur = dur;
    if (f.id === 'marek') { f.plan = []; f.seqLen = 0; f.seqIdx = 0; this.sequenceEnd(f); }
    this.set(f, 'stunned'); this.emit({ type: 'stun', who: f.id, dur, why });
  }
  private resolve(attacker: DynFighter): void {
    const D = this.D, a = attacker.act!.def, target = this.other(attacker); attacker.act!.impacted = true;
    if (a.ward || a.boost) { this.effect(attacker, a); return; }
    if (target.state === 'down') return;
    let result: DynImpactResult = 'hit', dmg = 0, mit = 0;
    if (target.react && this.t <= target.react.until && target.react.type === 'dodge') result = 'dodged';
    else {
      if (target.guarding && target.guardT >= D.guard.raiseTime && !a.ignoreGuard) { mit = D.guard.reduce; result = 'guarded'; }
      let k = 1 - mit;
      if (attacker.boost) k *= attacker.boost.damage;
      if (target.ward) k *= target.ward.damage;
      if (target.broken) k *= D.resist.breakDamage;
      dmg = Math.round(a.damage * k);
    }
    if (dmg > 0) target.hp = Math.max(0, target.hp - dmg);
    if (result === 'hit') target.flinch = D.flinch;
    // the gauge: every blow that lands, guarded ones too (a guarded blow adds `resist.guard` of it); held full while its break lasts
    if (result !== 'dodged' && !target.broken) {
      const add = a.resist * (result === 'guarded' ? D.resist.guard : 1) * (attacker.boost ? attacker.boost.resist : 1) * (target.ward ? target.ward.resist : 1);
      target.resist = Math.min(D.resist.max, target.resist + add);
    }
    let gained = 0; if (attacker.usesAp && a.apGain && result !== 'dodged') { const before = attacker.ap; attacker.ap = Math.min(D.ap.max, attacker.ap + a.apGain); gained = attacker.ap - before; }
    this.emit({ type: 'impact', from: attacker.id, to: target.id, action: a.id, kind: a.kind, result, damage: dmg, mitigated: mit, hp: target.hp, resist: target.resist });
    if (gained) this.emit({ type: 'apGain', who: attacker.id, amount: gained, ap: attacker.ap });
    // pushed back (CB-3): the blow it was caught by is received; the player is free again
    if (target.state === 'pushed') this.set(target, 'idle');
    if (target.hp <= 0) { this.set(target, 'down'); target.act = null; target.guarding = false; target.ward = null; target.boost = null; if (target.id === 'marek') this.sequenceEnd(target); this.over = true; this.emit({ type: 'ko', who: target.id }); return; }
    if (!target.broken && target.resist >= D.resist.max) { target.broken = true; this.emit({ type: 'break', who: target.id }); this.stun(target, D.resist.breakStun, 'break'); }
  }
  /** a defensive skill's ward, a support skill's boost: on its holder, for their time (cast again, they start over) */
  private effect(f: DynFighter, a: DynActionDef): void {
    const e = (a.ward ?? a.boost)!, timed = { left: e.dur, dur: e.dur, damage: e.damage, resist: e.resist };
    if (a.ward) f.ward = timed; else f.boost = timed;
    this.emit({ type: 'effect', who: f.id, action: a.id, family: a.family!, dur: e.dur });
  }

  /** a fighter just became free: run the queued action, or let the opponent schedule */
  private free(f: DynFighter): void {
    f.act = null; this.set(f, 'idle');
    if (f.id === 'marek') { if (f.plan.length) { f.aiWait = this.rr(this.D.ai.comboGap); f.resting = false; } else { f.aiWait = this.rr(this.restRange()); f.resting = true; f.seqLen = 0; f.seqIdx = 0; } }
    if (f.buffer && f.buffer.until >= this.t) { const id = f.buffer.id, a = this.D.actions[id]; f.buffer = null; if (a && this.canUse(f.id, id)) this.start(f, a); } else f.buffer = null;
  }
  /** the opponent's next blow: a new sequence when its plan is empty (its first blow opens the player's defence) */
  private aiNext(m: DynFighter): void {
    if (!m.plan.length) { m.plan = this.newSequence(); m.seqLen = m.plan.length; m.seqIdx = 0; }
    m.resting = false; m.seqIdx++;
    if (m.seqIdx === 1) this.sequenceStart(m);
    this.start(m, this.D.actions[m.plan.shift()!]);
  }

  step(dt?: number): void {
    const D = this.D; dt = dt || D.dt; this.t += dt; this.tick++;
    for (const id of IDS) {
      const f = this.f[id]; f.stateT += dt; if (f.flinch > 0) f.flinch = Math.max(0, f.flinch - dt);
      // time empties the gauge, slowly [G4]; a broken fighter's stays full until its stun ends
      if (!f.broken && f.resist > 0) f.resist = Math.max(0, f.resist - D.resist.decay * dt);
      if (f.ward) { f.ward.left -= dt; if (f.ward.left <= 0) { f.ward = null; this.emit({ type: 'wardEnd', who: id }); } }
      if (f.boost) { f.boost.left -= dt; if (f.boost.left <= 0) { f.boost = null; this.emit({ type: 'boostEnd', who: id }); } }
      if (f.usesAp && D.ap.regen > 0 && f.state !== 'down' && !this.over) { f.apClock += dt; if (f.apClock >= D.ap.regen) { f.apClock -= D.ap.regen; if (f.ap < D.ap.max) { f.ap++; this.emit({ type: 'apGain', who: id, amount: 1, ap: f.ap, why: 'regen' }); } } }
      if (f.react && this.t > f.react.until) { this.emit({ type: 'reactEnd', who: id, kind: f.react.type }); f.react = null; }
      const g = f.guardHeld && f.state === 'idle' && !this.over; if (g !== f.guarding) { f.guarding = g; this.emit({ type: g ? 'guardUp' : 'guardDown', who: id }); } f.guardT = f.guarding ? f.guardT + dt : 0;
      switch (f.state) {
        case 'idle':
          if (f.buffer) { if (f.buffer.until < this.t) f.buffer = null; else if (this.canUse(id, f.buffer.id)) { const ba = D.actions[f.buffer.id]; f.buffer = null; this.start(f, ba); break; } }
          if (id === 'marek' && !this.over) { f.aiWait -= dt; if (f.aiWait <= 0) this.aiNext(f); }
          break;
        case 'stunned':
          f.stunLeft -= dt;
          if (f.stunLeft <= 0) { if (f.broken) { f.broken = false; f.resist = 0; } this.emit({ type: 'stunEnd', who: id }); this.set(f, 'idle'); if (id === 'marek') { f.aiWait = D.ai.afterStun; f.resting = true; } }
          break;
        case 'pushed':
          // held until the blow it was caught by lands (resolve); released if that blow can no longer come
          if (!this.other(f).act || this.other(f).act!.impacted) this.set(f, 'idle');
          break;
        case 'acting': {
          const a = f.act!, d = a.def, hit = impactTime(d); a.t += dt;
          if (d.reactable && !a.windowOpened && a.t >= hit - d.windowDur!) { a.windowOpened = true; this.emit({ type: 'windowOpen', who: id, action: d.id, dur: d.windowDur! }); }
          if (!a.impacted && a.t >= hit) { this.resolve(f); if (d.reactable) this.emit({ type: 'windowClose', who: id, action: d.id }); }
          // `f.state` can change inside resolve (a KO, a break)
          if ((f.state as DynState) === 'acting' && a.t >= hit + d.follow) {
            if (id === 'marek' && !f.plan.length) this.sequenceEnd(f);
            f.recoverLeft = f.recoverDur = d.recover; this.set(f, 'recovering');
          }
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
    for (const id of IDS) {
      const f = this.f[id];
      let an: DynAnimState;
      if (f.state === 'down') an = { name: 'ko', t: f.stateT, dur: 0.9 };
      else if (f.state === 'stunned') an = { name: 'recover', t: f.stateT, dur: f.stunDur, stunned: true };
      else if (f.state === 'pushed') an = { name: 'hit', t: f.stateT, dur: this.D.flinch };
      else if (f.react) an = { name: f.react.type, t: this.t - f.react.tStart, dur: f.react.until - f.react.tStart, impactAt: f.react.impactAbs - f.react.tStart };
      else if (f.state === 'acting') { const d = f.act!.def; an = { name: d.anim, t: f.act!.t, dur: impactTime(d) + d.follow, impactAt: impactTime(d), prep: d.prep }; }
      else if (f.guarding) an = { name: 'block', t: f.guardT, dur: 1e6, impactAt: 1e6, guard: true };
      else if (f.flinch > 0) an = { name: 'hit', t: this.D.flinch - f.flinch, dur: this.D.flinch };
      else if (id === 'marek' && f.resting) an = { name: 'idle', t: this.t, dur: 1, loop: true };
      else if (id === 'marek' || f.ap >= 2) an = { name: 'ready', t: this.t, dur: 1, loop: true };
      else an = { name: 'idle', t: this.t, dur: 1, loop: true };
      f.anim = an;
    }
  }

  advance(secs: number, cb?: (s: DynamicSim) => boolean | void): boolean { const n = Math.round(secs / this.D.dt); for (let i = 0; i < n; i++) { this.step(this.D.dt); if (cb && cb(this) === true) return true; } return false; }
  advanceUntil(cond: (s: DynamicSim) => boolean, max?: number): boolean { const n = Math.round((max || 30) / this.D.dt); for (let i = 0; i < n; i++) { if (cond(this)) return true; this.step(this.D.dt); } return cond(this); }
  hash(): string {
    let s = '';
    for (const id of IDS) { const f = this.f[id]; s += f.hp + ':' + f.ap + ':' + f.state + ':' + f.stateT.toFixed(3) + ':' + f.resist.toFixed(3) + ':' + (f.ward ? f.ward.left.toFixed(3) : '-') + ':' + (f.boost ? f.boost.left.toFixed(3) : '-') + ';'; }
    return s + this.t.toFixed(3);
  }
}

/** a fixed input script (300 s from a reset: every action of the loadout, attacks tried in the defence phase, guard, dodges in the windows,
 *  resets at each K.O.); the simulation's fingerprint is its final hash, DYNAMIC_SIM_HASH. A regression pin for the presentation (C2): the
 *  rules themselves are proved by tests/combat-dynamic.test.mjs against oracles written in the test. */
export function runDynamicFingerprint(sim: DynamicSim, onEvents?: (e: DynEvent[]) => void): void {
  const dt = sim.D.dt; let nextAct = 0.5, n = 0;
  const ids: DynActionId[] = ['light', 'light', 'heavy', 't1', 'light', 'd1', 'light', 't4', 's1', 'light', 'heavy'];
  for (let i = 0; i < Math.round(300 / dt); i++) {
    const inc = sim.incoming();
    if (inc && inc.windowOpen && inc.kind === 'heavy') sim.react('ren', 'dodge');
    sim.setGuard('ren', !!(inc && inc.kind === 'light'));
    if (sim.t >= nextAct) { sim.command('ren', ids[n++ % ids.length]); nextAct += 0.45; }
    sim.step(dt); const ev = sim.drain(); onEvents?.(ev); if (sim.over) sim.reset();
  }
}

/** the hash `runDynamicFingerprint` leaves on DYNAMIC_DATA (recorded when the rules were written, journal Passe C1) */
export const DYNAMIC_SIM_HASH = '1687:1:idle:0.483:0.000:-:-;4989:0:idle:1.500:61.275:-:-;300.000';
