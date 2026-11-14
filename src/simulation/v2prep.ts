import type { GameState, SlotId } from './state';
import type { ActionDef } from './actions';
import type { Emit } from './advance';
import { isV2 } from './v2';
import { available } from './roles';
import { sandRefusal } from './v2rivals';
import { canonical, fnv64 } from './canonical';
import { hashString, mix32 } from '../core/rng';
import { PLAYER_ID, RIVALS } from '../narrative/roster';
import { tx } from '../narrative/text';
import { autoDuel, autoWinner, type AutoCond, type AutoFighter, type AutoResult } from '../combat/auto';
import { autoFightersFor } from '../combat/autoMatch';
import { autoRound } from '../combat/autoData';
import { boutNote, sumNotes, type BoutNote, type NoteSum } from '../combat/autoNotes';
import { nextBoutOf, scoutTier, type ScoutTier } from './v2scout';
import type { Stage } from '../combat/stats';

/** The preparation of a bout (lot 3 of « La Brute », the operator's PB-4 « Toutes », briefs/combat-auto.md § 33.5):
 *  - the rehearsal (the proposition's « Au terrain d'entraînement, un créneau : trente combats contre l'ombre du rival repéré, avec ton kit et ton plan. Tu lis tes
 *    chances et tu revois deux combats »): Master Corvin plays the next opponent's shadow, the duel itself thirty times on seeds of its own, with the player's kit, gear
 *    and the plan kept for that rival; the shadow plays the rival's skills by their roles once its style is known (tier 1), its own plan once that is (tier 2,
 *    src/simulation/v2scout.ts); the chances, a win and a loss to watch again, and the notebook's reading of the thirty;
 *  - Master Corvin's notebook: a note after each bout and challenge (src/combat/autoNotes.ts), kept with the game outside its fingerprint.
 *  Pure. */

/** the rehearsal's bouts (the proposition's thirty) */
export const REHEARSAL = { n: 30 };

export interface Rehearsal {
  foe: string; day: number; slot: SlotId; n: number; wins: number; tier: ScoutTier;
  /** the bout's set-up when it was rehearsed (both fighters as the duel took them): a review needs the same */
  key: string;
  /** a won and a lost bout of the thirty, by their seed, to watch again */
  seeds: { win?: number; loss?: number };
  sum: NoteSum;
}

/** the shadow bout of the player's next bout: Ren as he would fight it now, the rival at its stage, its plan by what the player knows of it (tier 1: each skill by its
 *  role's automatic; tier 2: its own conditions); null without a next bout */
export function shadowBout(s: GameState): { ren: AutoFighter; foe: AutoFighter; foeId: string; stage: Stage; round: number; tier: ScoutTier } | null {
  const n = nextBoutOf(s);
  if (!n) return null;
  const tier = scoutTier(s, n.foe), round = n.stage === 0 ? autoRound(n.day) : 0, f = autoFightersFor(s, n.foe, n.stage, round);
  const foe: AutoFighter = tier >= 2 ? f.foe : { ...f.foe, tactic: f.foe.skills.map((): AutoCond => 'auto') };
  return { ren: f.ren, foe, foeId: n.foe, stage: n.stage, round, tier };
}
/** a set-up's key (both fighters, canonical) */
export const shadowKey = (b: { ren: AutoFighter; foe: AutoFighter }): string => fnv64(canonical({ ren: b.ren, foe: b.foe }));

/** the rehearsal's seeds: its own, by the game, the rival, the day and the slot (never the real bout's: src/combat/match.ts mixes the match's id) */
export function rehearsalSeeds(s: GameState, foe: string): number[] {
  const base = mix32(s.seed, hashString(`rehearse:${foe}:${s.day}:${s.slot}`));
  return Array.from({ length: REHEARSAL.n }, (_, i) => mix32(base, i + 1) >>> 0 || 1);
}

/** the rehearsal now: the thirty bouts and what they say */
export function runRehearsal(s: GameState): Rehearsal | null {
  const b = shadowBout(s);
  if (!b) return null;
  const notes: BoutNote[] = [], seeds: Rehearsal['seeds'] = {};
  for (const seed of rehearsalSeeds(s, b.foeId)) {
    const r = autoDuel(b.ren, b.foe, seed, { log: true }), won = autoWinner(r) === 0;
    if (won && seeds.win === undefined) seeds.win = seed;
    if (!won && seeds.loss === undefined) seeds.loss = seed;
    notes.push(boutNote(r, b.ren, b.foe, { day: s.day, foe: b.foeId, kind: 'rehearsal' }));
  }
  const sum = sumNotes(notes);
  return { foe: b.foeId, day: s.day, slot: s.slot, n: notes.length, wins: sum.wins, tier: b.tier, key: shadowKey(b), seeds, sum };
}

/** a rehearsed bout to watch again (`win` or `loss`), as the arena plays it; `stale` when the set-up changed since (the plan, the gear, the training, what is known
 *  of the rival): the bout would not be the one rehearsed */
export function reviewOf(s: GameState, which: 'win' | 'loss'): { result: AutoResult; ren: AutoFighter; foe: AutoFighter; foeId: string; seed: number; stale: boolean } | null {
  const b = shadowBout(s), r = b ? s.v2?.$rehearsals?.[b.foeId] : undefined, seed = r?.seeds[which];
  if (!b || !r || seed === undefined) return null;
  return { result: autoDuel(b.ren, b.foe, seed, { log: true, trace: true }), ren: b.ren, foe: b.foe, foeId: b.foeId, seed, stale: shadowKey(b) !== r.key };
}

/** the last rehearsal against a rival, while it still is the bout to come (null after that bout, or never rehearsed) */
export function rehearsalOf(s: GameState, foe: string): Rehearsal | null {
  const r = s.v2?.$rehearsals?.[foe];
  if (!r) return null;
  const fought = s.tournament.matches.some((m) => !!m.winner && m.day >= r.day && ((m.a === PLAYER_ID && m.b === foe) || (m.b === PLAYER_ID && m.a === foe)));
  return fought ? null : r;
}
/** the rehearsal still matches the bout as it would be fought now */
export const rehearsalFresh = (s: GameState, r: Rehearsal): boolean => { const b = shadowBout(s); return !!b && b.foeId === r.foe && shadowKey(b) === r.key; };


export type V2PrepAction = { type: 'rehearse' };

export const V2_PREP_ACTIONS: { [K in V2PrepAction['type']]: ActionDef<Extract<V2PrepAction, { type: K }>> & { by: string | null } } = {
  rehearse: {
    by: 'corvin',
    list: (s) => (isV2(s) && s.place === 'training' ? [{ type: 'rehearse' }] : []),
    label: (s) => { const n = nextBoutOf(s); return n ? tx('prep.rehearse.label', { name: RIVALS[n.foe]?.name ?? n.foe, n: REHEARSAL.n }) : tx('prep.rehearse.labelNone'); },
    cost: () => 1,
    check: (s) => {
      if (!isV2(s)) return tx('v2.only');
      const away = available(s, 'corvin'); if (away) return away;
      if (s.slot === 'evening') return tx('train.closed');
      const sand = sandRefusal(s); if (sand) return sand;
      const n = nextBoutOf(s);
      if (!n) return tx('prep.rehearse.none');
      if (s.slot === 'afternoon' && n.day === s.day) return tx('refuse.boutFirst');
      return scoutTier(s, n.foe) < 1 ? tx('prep.rehearse.unseen', { name: RIVALS[n.foe]?.name ?? n.foe }) : null;
    },
    apply: (s, _a, _r, emit: Emit) => {
      const r = runRehearsal(s)!;
      (s.v2!.$rehearsals ??= {})[r.foe] = r;
      emit({ kind: 'action', id: 'rehearse', cause: 'action:rehearse', visible: true, text: tx(r.tier >= 2 ? 'prep.rehearse.logPlan' : 'prep.rehearse.log', { name: RIVALS[r.foe]?.name ?? r.foe, wins: r.wins, n: r.n }) });
    },
  },
};
