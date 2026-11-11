import { clamp, type GameState, type PlaceId } from './state';
import type { ActionDef } from './actions';
import type { SlotId } from './state';
import { isV2 } from './v2';
import { GEAR } from './gear';
import { gearOf, itemName, shopOpen } from './v2gear';
import { unsettled, wanted } from './v2law';
import { available } from './roles';
import { tx, type TextKey } from '../narrative/text';

/** The money of a version 2 game (the operator's sheet of journal Passe ECO2: the request of 2026-11-10, word for word « On doit aussi pouvoir trouver le
 *  moyen de gagner de l'argent pour financer notre equipement et preparer nos prochains combats car ils semble dur de gagner de l'argent par moment »):
 *  - the town's jobs (ECO-2 « Un travail par lieu et par jour (jusqu’à trois par jour) », ECO-3 « 10 pièces »): one job a place, at its moment, at someone's
 *    who is there, once a day each; a slot, 10 coins, the employer's goodwill as Mara's crates gave it before (her crates are the quay's job: 6 coins in
 *    today's game, `restock`, 10 here);
 *  - the resale (ECO-6 « Mara rachète à moitié prix ce qui est dans le sac, jamais un objet volé »): Mara buys what lies in the bag, by day, without a slot, at
 *    half its list price; never a piece of a theft not settled with Sergeant Hale.
 *  The purses by stage (ECO-4) are the bout's own (src/tournament/pool.ts `boutPurse`). Pure. */

export type JobId = 'crates' | 'pads' | 'armour' | 'tables';
export interface JobDef { place: PlaceId; slot: SlotId; by: string; label: TextKey; log: TextKey }
/** the four jobs: a place each, its moment, its employer (ECO-2) */
export const JOBS: Record<JobId, JobDef> = {
  crates: { place: 'district', slot: 'morning', by: 'mara', label: 'v2.work.label.crates', log: 'v2.work.log.crates' },
  pads: { place: 'training', slot: 'morning', by: 'corvin', label: 'v2.work.label.pads', log: 'v2.work.log.pads' },
  armour: { place: 'forecourt', slot: 'afternoon', by: 'hilde', label: 'v2.work.label.armour', log: 'v2.work.log.armour' },
  tables: { place: 'lanterns', slot: 'evening', by: 'lio', label: 'v2.work.label.tables', log: 'v2.work.log.tables' },
};
/** a job's pay (ECO-3 « 10 pièces ») and the goodwill it earns (Mara's crates' of before) */
export const WORK = { pay: 10, goodwill: 15 } as const;
const WHEN: Record<SlotId, TextKey> = { morning: 'v2.work.when.morning', afternoon: 'v2.work.when.afternoon', evening: 'v2.work.when.evening' };

/** the job of a place, if it has one */
export const jobAt = (place: PlaceId): JobId | null => (Object.keys(JOBS) as JobId[]).find((j) => JOBS[j].place === place) ?? null;
/** has this job been done today */
export const workedToday = (s: GameState, job: JobId): boolean => s.flags[`work:${job}`] === s.day;

/** what Mara gives for a piece of the bag (ECO-6): half its list price, rounded down */
export const resaleOf = (item: string): number => Math.floor((GEAR[item]?.price ?? 0) / 2);
/** a piece of a theft not settled (ECO-6: « jamais un objet volé ») */
const stolen = (s: GameState, item: string): boolean => unsettled(s).some((t) => t.item === item);

export type V2WorkAction =
  | { type: 'work'; job: JobId }
  | { type: 'sell'; item: string };

export const V2_WORK_ACTIONS: { [K in V2WorkAction['type']]: ActionDef<Extract<V2WorkAction, { type: K }>> & { by: string | ((a: Extract<V2WorkAction, { type: K }>) => string) } } = {
  work: {
    by: (a) => JOBS[a.job].by,
    list: (s) => { if (!isV2(s)) return []; const j = jobAt(s.place); return j ? [{ type: 'work', job: j }] : []; },
    label: (_s, a) => tx(JOBS[a.job].label),
    cost: () => 1,
    gain: () => WORK.pay,
    check: (s, a) => {
      if (!isV2(s)) return tx('v2.only');
      const j = JOBS[a.job];
      if (!j) return tx('v2.work.none');
      if (s.place !== j.place) return tx('v2.work.none');
      if (s.slot !== j.slot) return tx(WHEN[j.slot]);
      if (workedToday(s, a.job)) return tx('v2.work.done');
      if (wanted(s)) return tx('v2.work.wanted');
      return available(s, j.by);
    },
    apply: (s, a, _r, emit) => {
      const j = JOBS[a.job];
      s.player.coins += WORK.pay; s.town[j.by] = clamp((s.town[j.by] ?? 0) + WORK.goodwill, -100, 100); s.flags[`work:${a.job}`] = s.day;
      emit({ kind: 'action', id: `work:${a.job}`, cause: 'action:work', text: tx(j.log, { n: WORK.pay }), visible: true });
    },
  },
  sell: {
    by: 'mara',
    list: (s) => (!isV2(s) || s.place !== 'district' ? [] : [...new Set(s.v2?.gear?.bag ?? [])].filter((i) => resaleOf(i) > 0).map((item) => ({ type: 'sell' as const, item }))),
    label: (_s, a) => tx('v2.sell.label', { item: itemName(a.item) }),
    cost: () => 0,
    gain: (_s, a) => resaleOf(a.item),
    check: (s, a) => {
      if (!isV2(s)) return tx('v2.only');
      const o = shopOpen(s, 'mara'); if (o) return o;
      if (!(s.v2?.gear?.bag ?? []).includes(a.item)) return tx('v2.sell.notInBag');
      if (resaleOf(a.item) <= 0) return tx('v2.sell.worthless');
      if (stolen(s, a.item)) return tx('v2.sell.stolen');
      return available(s, 'mara');
    },
    apply: (s, a, _r, emit) => {
      const g = gearOf(s), n = resaleOf(a.item);
      g.bag.splice(g.bag.indexOf(a.item), 1); s.player.coins += n;
      emit({ kind: 'action', id: `sell:${a.item}`, cause: 'action:sell', text: tx('v2.sell.log', { item: itemName(a.item), n }), visible: true });
    },
  },
};
