import { DynamicSim, type DynActionId, type DynData, type DynEvent, type DynFighterId } from './dynamic';
import { HEAVY_AT } from './skills';

/** The three-button command and the charged attack (the operator's decision A3 of 26/10/2026, AV-5 « Oui, amender (A3), l'ancien schéma
 *  gardé pour comparer », with AV-6 « Garder les PA en plus de la charge », AV-7 « Comme Cyan, paliers successifs », AV-8 « Un niveau par
 *  compétence »; journal Passes AV1 / V1; briefs/combat-system.md § 4b): three buttons, guard (held), dodge, attack. The attack charges while it
 *  is held: a tap is the light attack; held ~2 s (HEAVY_AT), the heavy attack; then, tier after tier, the four skills the player brought, ranked
 *  by their charge time at their level; releasing launches the tier reached (as Cyan's Bushido). A skill still costs its action points: a tier
 *  whose AP are missing does not open (the release launches the best open tier reached), and the HUD shows it.
 *  The rules of the duel are DynamicSim's, unchanged (src/combat/dynamic.ts); this wraps it and turns the three buttons into its commands. What
 *  cuts a charge is « proposé » (journal Passe V1): a blow that lands unguarded on the player, the player's dodge, the player's break; a
 *  guarded blow keeps it (the guard can be held with the attack, and the gauge fills as always); the charge grows only while the player is free
 *  (idle or guarding: not while an action runs, pushed back or stunned); a release during the opponent's sequence is refused like any attack
 *  in the defence phase (G3) and the charge is lost. Pure, deterministic: the same inputs at the same steps give the same duel. */

export interface ChargeTier { id: DynActionId; at: number; ap: number }
export type ChargeEvent = { t?: number } & (
  | { type: 'chargeStart' }
  | { type: 'chargeTier'; idx: number; id: DynActionId; open: boolean }
  | { type: 'chargeCut'; why: 'hit' | 'dodge' | 'break' | 'down' }
  | { type: 'chargeRelease'; id: DynActionId; idx: number; held: number; ok: boolean }
);

/** the tiers of a loadout: the light attack (a tap), the heavy (HEAVY_AT), then the skills by their charge time (ties by their slot) */
export function chargeTiers(loadout: readonly DynActionId[], charge: Record<string, number>, D: DynData, heavyAt = HEAVY_AT): ChargeTier[] {
  const skills = loadout.map((id, i) => ({ id, i, at: Math.max(heavyAt + 0.25, charge[id] ?? Infinity) })).sort((a, b) => a.at - b.at || a.i - b.i);
  return [{ id: 'light', at: 0, ap: 0 }, { id: 'heavy', at: heavyAt, ap: 0 }, ...skills.map((s) => ({ id: s.id, at: s.at, ap: D.actions[s.id].apCost ?? 0 }))];
}

/** the duel's data under the three buttons: the four skills' charge times at their levels */
export interface ChargeData { tiers: ChargeTier[] }

export interface ChargeView {
  /** the attack is held */
  held: boolean;
  /** the charge so far (s) */
  t: number;
  tiers: ChargeTier[];
  /** the last tier its time has reached (0 = the light attack) */
  reached: number;
  /** each tier can open now (its AP are there) */
  open: boolean[];
  /** the tier a release would launch now (the best open tier reached) */
  launch: number;
}

export class ChargedDuel {
  readonly sim: DynamicSim;
  readonly tiers: ChargeTier[];
  private held = false;
  private hold = 0;
  private lastTier = 0;
  private seen = 0;
  private extra: ChargeEvent[] = [];

  constructor(D: DynData, tiers: ChargeTier[]) { this.sim = new DynamicSim(D); this.tiers = tiers; }

  // ---- the DuelSim face the arena reads (ArenaApp): the inner simulation's
  get D() { return this.sim.D; }
  get t() { return this.sim.t; }
  get over() { return this.sim.over; }
  get f() { return this.sim.f; }
  incoming() { return this.sim.incoming(); }
  command(who: DynFighterId, id: DynActionId) { return this.sim.command(who, id); }
  react(who: DynFighterId, type: 'dodge') { return this.sim.react(who, type); }
  setGuard(who: DynFighterId, on: boolean) { this.sim.setGuard(who, on); }
  /** scripted (the tools, the moments): the opponent's next sequence */
  forceSequence(plan: DynActionId[]) { return this.sim.forceSequence(plan); }
  reset(): void { this.sim.reset(); this.held = false; this.hold = 0; this.lastTier = 0; this.seen = 0; this.extra = []; }
  drain(): Array<DynEvent | ChargeEvent> { this.scan(); const e = [...this.sim.drain(), ...this.extra]; this.extra = []; this.seen = 0; return e; }
  hash(): string { return `${this.sim.hash()}|${this.held ? 1 : 0}:${this.hold.toFixed(3)}`; }

  private emit(e: ChargeEvent): void { e.t = this.sim.t; this.extra.push(e); }
  private free(): boolean { const s = this.sim.f.ren.state; return s === 'idle'; }

  /** what the player's charge is now (the HUD, the bot) */
  view(): ChargeView {
    const ap = this.sim.f.ren.ap, open = this.tiers.map((x) => ap >= x.ap);
    let reached = 0;
    for (let i = 0; i < this.tiers.length; i++) if (this.hold >= this.tiers[i].at) reached = i;
    let launch = 0;
    for (let i = reached; i >= 0; i--) if (open[i]) { launch = i; break; }
    return { held: this.held, t: this.hold, tiers: this.tiers, reached, open, launch };
  }

  /** the attack button: pressed starts a charge, released launches the tier reached */
  attack(down: boolean): void {
    const R = this.sim.f.ren;
    if (down) {
      if (this.held || this.sim.over || R.state === 'down' || R.state === 'stunned') return;
      this.held = true; this.hold = 0; this.lastTier = 0; this.emit({ type: 'chargeStart' });
      return;
    }
    if (!this.held) return;
    const v = this.view(), tier = this.tiers[v.launch];
    this.held = false; this.hold = 0; this.lastTier = 0;
    const r = this.sim.command('ren', tier.id);
    this.emit({ type: 'chargeRelease', id: tier.id, idx: v.launch, held: +v.t.toFixed(3), ok: r !== false });
  }

  /** a charge ends without a launch */
  private cut(why: 'hit' | 'dodge' | 'break' | 'down'): void {
    if (!this.held) return;
    this.held = false; this.hold = 0; this.lastTier = 0;
    this.emit({ type: 'chargeCut', why });
  }

  /** reads the events the inner simulation has written since the last look: what cuts the charge */
  private scan(): void {
    const ev = this.sim.events;
    for (; this.seen < ev.length; this.seen++) {
      const e = ev[this.seen];
      if (e.type === 'impact' && e.to === 'ren' && e.result === 'hit') this.cut('hit');
      else if (e.type === 'reactStart' && e.who === 'ren') this.cut('dodge');
      else if (e.type === 'stun' && e.who === 'ren') this.cut('break');
      else if (e.type === 'ko') this.cut('down');
    }
  }

  step(dt?: number): void {
    this.sim.step(dt);
    this.scan();
    if (this.held && this.free()) {
      this.hold += dt || this.sim.D.dt;
      const v = this.view();
      if (v.reached > this.lastTier) { this.lastTier = v.reached; this.emit({ type: 'chargeTier', idx: v.reached, id: this.tiers[v.reached].id, open: v.open[v.reached] }); }
    }
  }
}
