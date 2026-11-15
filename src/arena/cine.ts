import type { AutoFighter, AutoResult } from '../combat/auto';
import { AutoReplay, type ReplayEvent, type Seat } from './autoView';

/** The cinematics of the duel « La Brute » (the operator's request of 14/11/2026, word for word « dans notre combat, j'aimerai integrer animation runtime
 *  ( cinematics ) pour notre competences forts/ultimes qui touche totalement l'adversaire [...] », journal Passes CI1 / CI2): which of a duel's skills play one,
 *  read from its script by the arena's own replay (src/arena/autoView.ts: the same openings, breaks and totals the arena shows). Pure: the laboratory
 *  (`tools/auto-lab.mjs cinematics`) and the tests run it in Node; the arena plays a cinematic at each moment it returns (src/arena/cineDirector.ts).
 *  Presentation only: the duel, its script and its result never change. */

export { CINE_RULE, type CineLand, type CineRule, type CineTier, type CineTierRule } from './cineRule';
import { CINE_RULE as RULE, type CineRule, type CineTier } from './cineRule';

export interface CineMoment {
  tier: CineTier; who: Seat; to: Seat; action: string; role: string;
  /** the action's first and last blow on the duel's clock */
  t: number; end: number;
  hits: number; damage: number; inBreak: boolean; inOpen: boolean; ko: boolean;
  /** each blow: its time, its damage, the health it leaves its target */
  blows: Array<{ t: number; damage: number; hp: number }>;
}

/** every action of a skill of a tier that lands in full, in the order of the script (its tier's `land`, or a K.O. when `ko`; the rule's side; `max` and `gap`
 *  applied by `cinePick`) */
export function cineCandidates(result: AutoResult, fighters: { ren: AutoFighter; marek: AutoFighter }, rule: CineRule, evs: ReplayEvent[] = replayEvents(result, fighters)): CineMoment[] {
  const roleOf = (seat: Seat, id: string): string | undefined => [...fighters[seat].skills].find((a) => a.id === id)?.role;
  const out: CineMoment[] = [];
  // each fighter's action under way: the other fighter's blows may fall between two of its blows (Vessa's Lunge between two of a Tourbillon's three)
  const cur: Record<Seat, (Omit<CineMoment, 'tier'> & { all: boolean }) | null> = { ren: null, marek: null };
  const close = (seat: Seat): void => {
    const c = cur[seat]; cur[seat] = null;
    if (!c || !c.all || (rule.side === 'ren' && c.who !== 'ren')) return;
    const r = rule.tiers.find((x) => x.roles.includes(c.role));
    if (!r || !(r.land === 'hit' || c.inBreak || c.inOpen || (rule.ko && c.ko))) return;
    const { all, ...m } = c; void all; out.push({ tier: r.tier, ...m });
  };
  const other = (s: Seat): Seat => (s === 'ren' ? 'marek' : 'ren');
  for (const e of evs) {
    if (e.type === 'impact') {
      const from = e.from as Seat, id = String(e.action), first = !e.follow;
      if (first) { close(from); const role = roleOf(from, id); if (role) cur[from] = { who: from, to: e.to as Seat, action: id, role, t: e.t!, end: e.t!, hits: 0, damage: 0, inBreak: !!e.inBreak, inOpen: !!e.inOpen, ko: false, blows: [], all: true }; }
      const c = cur[from];
      if (c && c.action === id) { c.hits++; c.end = e.t!; c.damage += Number(e.damage) || 0; c.blows.push({ t: e.t!, damage: Number(e.damage) || 0, hp: Number(e.hp) }); if (e.result !== 'hit') c.all = false; }
    } else if (e.type === 'ko') { const k = cur[other(e.who as Seat)]; if (k) k.ko = true; close('ren'); close('marek'); }
    // what cuts an action: an interruption (`who` the one cut) or a parry (`to` the striker parried), a clash (both)
    else if (e.type === 'interrupt') { const k = cur[e.who as Seat]; if (k) k.all = false; close(e.who as Seat); }
    else if (e.type === 'parry') { const k = cur[e.to as Seat]; if (k) k.all = false; close(e.to as Seat); }
    else if (e.type === 'clash') { for (const k of [e.who, e.to] as Seat[]) { if (cur[k]) cur[k]!.all = false; close(k); } }
    else if (e.type === 'commandStart' && cur[e.who as Seat]) close(e.who as Seat);
  }
  close('ren'); close('marek');
  out.sort((x, y) => x.t - y.t);
  return out;
}

/** the moments the arena plays: the candidates under `max` and `gap`, the K.O.'s always when `ko` */
export function cinePick(cands: readonly CineMoment[], rule: Pick<CineRule, 'max' | 'gap' | 'ko'> & { tiers?: CineRule['tiers'] }): CineMoment[] {
  const out: CineMoment[] = [];
  const free = (m: CineMoment): boolean => !!rule.tiers?.find((x) => x.tier === m.tier)?.free;
  for (const m of cands) {
    const last = out[out.length - 1];
    if ((rule.ko && m.ko) || free(m)) { out.push(m); continue; }
    if (rule.max !== undefined && out.filter((x) => !free(x)).length >= rule.max) continue;
    if (rule.gap !== undefined && last && m.t - last.t < rule.gap) continue;
    out.push(m);
  }
  return out;
}

export const cineMoments = (result: AutoResult, fighters: { ren: AutoFighter; marek: AutoFighter }, rule: CineRule = RULE): CineMoment[] => cinePick(cineCandidates(result, fighters, rule), rule);

/** the replay's events over the whole script, each told at its line (the arena's own reading: the openings, the breaks, each blow's place and total) */
export function replayEvents(result: AutoResult, fighters: { ren: AutoFighter; marek: AutoFighter }): ReplayEvent[] {
  const rp = new AutoReplay(result, fighters), out: ReplayEvent[] = [...rp.drain()];
  const times = [...new Set(result.log!.map((e) => e.t))];
  for (const t of times) { if (rp.over) break; rp.step(Math.max(0, t - rp.t)); out.push(...rp.drain()); }
  if (!rp.over) { rp.step(rp.end - rp.t + 0.01); out.push(...rp.drain()); }
  return out;
}
