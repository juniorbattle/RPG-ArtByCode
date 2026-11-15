import type { AutoFighter, AutoResult } from '../combat/auto';
import { AutoReplay, type ReplayEvent, type Seat } from './autoView';

/** The cinematics of the duel « La Brute » (the operator's request of 14/11/2026, word for word « dans notre combat, j'aimerai integrer animation runtime
 *  ( cinematics ) pour notre competences forts/ultimes qui touche totalement l'adversaire [...] », journal Passe CI1): which of a duel's skills land in full,
 *  read from its script by the arena's own replay (src/arena/autoView.ts: the same openings, breaks and totals the arena shows). Pure: the laboratory
 *  (`tools/auto-lab.mjs cinematics`) and the tests run it in Node; the arena plays a cinematic at each moment it returns. Presentation only: the duel, its script
 *  and its result never change. */

/** which skills may play one: `ultimate` the exploits (the Thrust; Marek's Iron fall, Ilse's Smite: the heaviest single blows, the long gap), `strong` and the
 *  breakers (Tourbillon; Rhosk's Northern cleave, Tobin's Wild blow), `all` every offensive skill */
export type CineSet = 'ultimate' | 'strong' | 'all';
/** when it lands « totalement »: `hit` every blow of the action lands (neither guarded, dodged, parried, interrupted nor lost in a clash); `open` and in an
 *  opening or a break; `ko` the blow that ends the bout */
export type CineLand = 'hit' | 'open' | 'ko';
export interface CineRule {
  set: CineSet; land: CineLand;
  /** whose skills: Ren's alone, or both fighters' */
  side: 'ren' | 'both';
  /** at most this many a bout (the first ones), and at least `gap` seconds of the duel between two */
  max?: number; gap?: number;
  /** the blow that ends the bout always plays one when it is a skill of the set, whatever `max` and `gap` */
  ko?: boolean;
}
export const CINE_ROLES: Record<CineSet, readonly string[]> = {
  ultimate: ['exploit'],
  strong: ['exploit', 'breaker'],
  all: ['exploit', 'breaker', 'punish', 'pierce', 'opener', 'interrupt'],
};

export interface CineMoment {
  who: Seat; to: Seat; action: string; role: string;
  /** the action's first and last blow on the duel's clock */
  t: number; end: number;
  hits: number; damage: number; inBreak: boolean; inOpen: boolean; ko: boolean;
  /** each blow: its time, its damage, the health it leaves its target */
  blows: Array<{ t: number; damage: number; hp: number }>;
}

/** every offensive skill of the duel that lands in full, in the order of the script (the rule's set, land and side; `max`, `gap` and `ko` applied by `cinePick`) */
export function cineCandidates(result: AutoResult, fighters: { ren: AutoFighter; marek: AutoFighter }, rule: Pick<CineRule, 'set' | 'land' | 'side'>): CineMoment[] {
  const evs = replayEvents(result, fighters), roles = CINE_ROLES[rule.set];
  const roleOf = (seat: Seat, id: string): string | undefined => [...fighters[seat].skills].find((a) => a.id === id)?.role;
  const out: CineMoment[] = [];
  let cur: (CineMoment & { all: boolean }) | null = null;
  const close = (): void => {
    if (cur && cur.all && roles.includes(cur.role) && (rule.side === 'both' || cur.who === 'ren') && (rule.land === 'hit' || (rule.land === 'open' ? cur.inBreak || cur.inOpen : cur.ko))) {
      const { all, ...m } = cur; void all; out.push(m);
    }
    cur = null;
  };
  for (const e of evs) {
    if (e.type === 'impact') {
      const from = e.from as Seat, id = String(e.action), first = !e.follow;
      if (first) { close(); const role = roleOf(from, id); if (role) cur = { who: from, to: e.to as Seat, action: id, role, t: e.t!, end: e.t!, hits: 0, damage: 0, inBreak: !!e.inBreak, inOpen: !!e.inOpen, ko: false, blows: [], all: true }; }
      if (cur && cur.who === from && cur.action === id) { cur.hits++; cur.end = e.t!; cur.damage += Number(e.damage) || 0; cur.blows.push({ t: e.t!, damage: Number(e.damage) || 0, hp: Number(e.hp) }); if (e.result !== 'hit') cur.all = false; }
    } else if (e.type === 'ko') { if (cur) cur.ko = true; close(); }
    // what cuts an action: an interruption or a parry of its striker, a clash
    else if (e.type === 'interrupt' || e.type === 'parry' || e.type === 'clash') { if (cur) cur.all = false; close(); }
    else if (e.type === 'commandStart' && cur && e.who === cur.who) close();
  }
  close();
  return out;
}

/** the moments the arena plays: the candidates under `max` and `gap`, the K.O.'s always when `ko` */
export function cinePick(cands: readonly CineMoment[], rule: CineRule): CineMoment[] {
  const out: CineMoment[] = [];
  for (const m of cands) {
    const last = out[out.length - 1];
    if (rule.ko && m.ko) { out.push(m); continue; }
    if (rule.max !== undefined && out.length >= rule.max) continue;
    if (rule.gap !== undefined && last && m.t - last.t < rule.gap) continue;
    out.push(m);
  }
  return out;
}

export const cineMoments = (result: AutoResult, fighters: { ren: AutoFighter; marek: AutoFighter }, rule: CineRule): CineMoment[] => cinePick(cineCandidates(result, fighters, rule), rule);

/** the replay's events over the whole script, each told at its line (the arena's own reading: the openings, the breaks, each blow's place and total) */
export function replayEvents(result: AutoResult, fighters: { ren: AutoFighter; marek: AutoFighter }): ReplayEvent[] {
  const rp = new AutoReplay(result, fighters), out: ReplayEvent[] = [...rp.drain()];
  const times = [...new Set(result.log!.map((e) => e.t))];
  for (const t of times) { if (rp.over) break; rp.step(Math.max(0, t - rp.t)); out.push(...rp.drain()); }
  if (!rp.over) { rp.step(rp.end - rp.t + 0.01); out.push(...rp.drain()); }
  return out;
}
