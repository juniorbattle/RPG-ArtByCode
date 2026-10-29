import { DynamicSim, type DynActionId, type DynData, type DynEvent, type DynFighterId } from './dynamic';
import { HEAVY_AT } from './skills';

/** The three-button command and the charged attack (the operator's decision A3 of 26/10/2026, AV-5 « Oui, amender (A3), l'ancien schéma
 *  gardé pour comparer », with AV-6 « Garder les PA en plus de la charge », AV-7 « Comme Cyan, paliers successifs », AV-8 « Un niveau par
 *  compétence »; journal Passes AV1 / V1; briefs/combat-system.md § 4b): three buttons, guard (held), dodge, attack. The attack charges while it
 *  is held: a tap is the light attack; held ~2 s (HEAVY_AT), the heavy attack; then, tier after tier, the four skills the player brought, ranked
 *  by their charge time at their level; releasing launches the tier reached (as Cyan's Bushido). A skill still costs its action points: a tier
 *  whose AP are missing does not open (the release launches the best open tier reached), and the HUD shows it.
 *  The rules of the duel are DynamicSim's, unchanged (src/combat/dynamic.ts); this wraps it and turns the three buttons into its commands.
 *  Nothing cuts a charge: the operator's decision V2-2 « Rien ne la coupe » (journal Passes FV3 / V2C1; the rule « proposé » of Passe V1, where
 *  an unguarded blow, the dodge, the break or the K.O. cut it, is gone). Its edge cases, each « proposé » (journal Passe V2C1), read as « rien »:
 *  - a blow received, guarded or not, and the player's own dodge keep the charge, which goes on growing (the guard, the dodge and the attack
 *    are three buttons: they can be held together);
 *  - the charge grows only while the player is free (idle, guarding or dodging: DynamicSim's 'idle'), as before: while an action runs, pushed
 *    back or stunned by a break, it is kept, not grown, and grows again once the player is free;
 *  - a release the duel cannot take now (the opponent's priority G3 / CB-4 through its whole sequence, the player stunned, pushed back or
 *    still in an action) is not lost: the tier reached waits and leaves at the first step the player can act (the best tier the AP still open,
 *    at most the one reached); a new press meanwhile starts a new charge, whose release waits behind it;
 *  - the K.O. ends the duel: a charge held or waiting ends with it, unlaunched (there is no one left to strike); nothing else ends a charge.
 *  Pure, deterministic: the same inputs at the same steps give the same duel. */

export interface ChargeTier { id: DynActionId; at: number; ap: number }
export type ChargeEvent = { t?: number } & (
  | { type: 'chargeStart' }
  | { type: 'chargeTier'; idx: number; id: DynActionId; open: boolean }
  /** released while the duel cannot take it (the opponent's sequence, a stun, a push back, an action running): the tier reached waits */
  | { type: 'chargeWait'; idx: number; id: DynActionId; held: number }
  /** a tier launched, at its release or once it has waited; `ok` false only if the duel refused it */
  | { type: 'chargeRelease'; id: DynActionId; idx: number; held: number; ok: boolean }
  /** the K.O.: the duel is over, and a charge held or waiting with it */
  | { type: 'chargeEnd'; why: 'over' }
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
  /** the released tier waiting for the duel to take it (the best tier the AP open now, at most the one reached at its release), or -1 */
  waiting: number;
}

export class ChargedDuel {
  readonly sim: DynamicSim;
  readonly tiers: ChargeTier[];
  private held = false;
  private hold = 0;
  private lastTier = 0;
  /** the releases the duel could not take yet, in their order: the tier reached and the charge's time at each */
  private waits: Array<{ reached: number; held: number }> = [];
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
  reset(): void { this.sim.reset(); this.held = false; this.hold = 0; this.lastTier = 0; this.waits = []; this.extra = []; }
  drain(): Array<DynEvent | ChargeEvent> { const e = [...this.sim.drain(), ...this.extra]; this.extra = []; return e; }
  hash(): string { return `${this.sim.hash()}|${this.held ? 1 : 0}:${this.hold.toFixed(3)}:${this.waits.map((w) => w.reached).join(',')}`; }

  private emit(e: ChargeEvent): void { e.t = this.sim.t; this.extra.push(e); }
  private free(): boolean { const s = this.sim.f.ren.state; return s === 'idle'; }
  /** the best tier at most `reached` whose AP are there now (the light attack costs none) */
  private bestOpen(reached: number): number {
    const ap = this.sim.f.ren.ap;
    for (let i = reached; i > 0; i--) if (ap >= this.tiers[i].ap) return i;
    return 0;
  }

  /** what the player's charge is now (the HUD, the bot) */
  view(): ChargeView {
    const ap = this.sim.f.ren.ap, open = this.tiers.map((x) => ap >= x.ap);
    let reached = 0;
    for (let i = 0; i < this.tiers.length; i++) if (this.hold >= this.tiers[i].at) reached = i;
    return { held: this.held, t: this.hold, tiers: this.tiers, reached, open, launch: this.bestOpen(reached), waiting: this.waits.length ? this.bestOpen(this.waits[0].reached) : -1 };
  }

  /** the attack button: pressed starts a charge, released launches the tier reached (or keeps it waiting until the duel can take it) */
  attack(down: boolean): void {
    const R = this.sim.f.ren;
    if (down) {
      if (this.held || this.sim.over || R.state === 'down' || R.state === 'stunned') return;
      this.held = true; this.hold = 0; this.lastTier = 0; this.emit({ type: 'chargeStart' });
      return;
    }
    if (!this.held) return;
    const v = this.view();
    this.held = false; this.hold = 0; this.lastTier = 0;
    if (!this.waits.length && this.sim.canUse('ren', this.tiers[v.launch].id)) { this.launch(v.launch, v.t); return; }
    this.waits.push({ reached: v.reached, held: v.t });
    this.emit({ type: 'chargeWait', idx: v.launch, id: this.tiers[v.launch].id, held: +v.t.toFixed(3) });
  }

  private launch(idx: number, held: number): void {
    const r = this.sim.command('ren', this.tiers[idx].id);
    this.emit({ type: 'chargeRelease', id: this.tiers[idx].id, idx, held: +held.toFixed(3), ok: r !== false });
  }

  step(dt?: number): void {
    this.sim.step(dt);
    // the K.O. ends the duel, and a charge with it; nothing else ends one
    if (this.sim.over) {
      if (this.held || this.waits.length) { this.held = false; this.hold = 0; this.lastTier = 0; this.waits = []; this.emit({ type: 'chargeEnd', why: 'over' }); }
      return;
    }
    // a tier that waited leaves as soon as the player can act
    if (this.waits.length) {
      const w = this.waits[0], idx = this.bestOpen(w.reached);
      if (this.sim.canUse('ren', this.tiers[idx].id)) { this.waits.shift(); this.launch(idx, w.held); }
    }
    if (this.held && this.free()) {
      this.hold += dt || this.sim.D.dt;
      const v = this.view();
      if (v.reached > this.lastTier) { this.lastTier = v.reached; this.emit({ type: 'chargeTier', idx: v.reached, id: this.tiers[v.reached].id, open: v.open[v.reached] }); }
    }
  }
}
