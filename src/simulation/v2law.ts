import type { Rng } from '../core/rng';
import { clamp, type GameState, type V2Theft } from './state';
import type { ActionDef } from './actions';
import type { Emit } from './advance';
import { isV2 } from './v2';
import { GEAR } from './gear';
import { gearOf, itemName } from './v2gear';
import { PEOPLE, presentAt } from '../narrative/people';
import { PLAYER_ID } from '../narrative/roster';
import { tx } from '../narrative/text';
import { GENERICS, MUSCLE } from '../narrative/generics';
import type { DuelOutcome } from '../tournament/pool';

/** The watch and the thefts of a version 2 game (lot L2a; the operator's choice EV-2 « Un soupçon qui dure, une sortie par la restitution »,
 *  with his note « Mais il peut aussi avoir une possibilite de combat et de represaille reelle, d'ailleurs on parle de reputation mais comment
 *  cela fonctionne ? », journal Passes EV2 / EVL2; simplified by his L2-2 « Des marques (Recommandé) », after his note « la version de octopath
 *  traveler est parait plus simple », journal Passe EVL4). Two numbers apart: the reputation is the name the Cité gives (the tournament and the town
 *  read it); the marks are Sergeant Hale's ledger, one per theft caught or found by its owner at the next dawn. At three marks the watch searches the
 *  player at dawn and the stallholders will not sell, until the player returns or pays what was taken at Sergeant Hale's, a way out that is always
 *  open (a purse too thin hauls for the watch the rest of the slot). The registrar warns once; a second theft caught costs a point of the pool.
 *  Every number is « proposé ». Pure. */

export const LAW = {
  /** the marks from which the watch searches the player at dawn and the stallholders refuse to sell (L2-2 « Des marques »: three) */
  wanted: 3,
  /** the chance an owner finds an unseen theft at the next dawn: a stall counted, a forced shutter, a passer-by's pocket */
  foundChance: 0.6, foundNight: 0.85, foundPocket: 0.5,
  /** the watch's fine at a dawn search, Hale's fee on a restitution, the registrar's fine for a second theft caught after the pool */
  searchFine: 10, fee: 5, registrarFine: 15,
  /** the reprisal (lot L2b): a robbed owner whose goodwill falls this low pays the muscle; the nights it waits; what paying it off costs, what it takes when
   *  it is ignored or beats the player */
  grudge: -30, waits: 2, payOff: 20, takes: 20,
} as const;

/** the marks in Sergeant Hale's ledger */
export const marksOf = (s: Pick<GameState, 'v2'>): number => s.v2?.marks ?? 0;
/** the watch wants a word: searches at dawn, the stalls shut to the player (lot L2a) */
export const wanted = (s: GameState): boolean => isV2(s) && marksOf(s) >= LAW.wanted;
/** one more mark (the ledger holds three: more changes nothing) */
export function mark(s: GameState): void { s.v2!.marks = Math.min(LAW.wanted, marksOf(s) + 1); }

export const unsettled = (s: Pick<GameState, 'v2'>): V2Theft[] => (s.v2?.thefts ?? []).filter((t) => !t.settled);
/** the thefts not settled whose piece was taken: a theft caught on the spot took nothing (journal Passe CO2, AU-08 « chaque règle alignée sur ce que le jeu dit »:
 *  a restitution billed it at its list price, and a copy bought later was « returned », seized at dawn and refused at the resale) */
export const takenThefts = (s: Pick<GameState, 'v2'>): V2Theft[] => unsettled(s).filter((t) => t.seen !== 'caught');
/** who a theft robbed, by name (a keeper, a passer-by) */
export const victimName = (id: string): string => PEOPLE[id]?.name ?? id;

/** does the player hold this piece (the whetstone among the items, the rest worn or in the bag) */
export function holds(s: GameState, id: string): boolean {
  if (id === 'whetstone') return s.player.items.includes('whetstone');
  const g = s.v2?.gear;
  return !!g && (g.weapon === id || g.armour === id || g.acc.includes(id) || g.bag.includes(id));
}
/** gives a held piece back (a weapon worn leaves the training sword in the hand) */
export function giveBack(s: GameState, id: string): void {
  if (id === 'whetstone') { s.player.items.splice(s.player.items.indexOf('whetstone'), 1); return; }
  const g = gearOf(s), b = g.bag.indexOf(id);
  if (b >= 0) { g.bag.splice(b, 1); return; }
  if (g.armour === id) g.armour = null;
  else if (g.acc[0] === id) g.acc[0] = null;
  else if (g.acc[1] === id) g.acc[1] = null;
  else if (g.weapon === id) { const t = g.bag.indexOf('training-sword'); if (t >= 0) g.bag.splice(t, 1); g.weapon = 'training-sword'; g.tier = 0; }
}

/** a theft recorded; caught, a mark in the ledger (an unseen one leaves none until its owner finds it) */
export function recordTheft(s: GameState, t: V2Theft): void {
  (s.v2!.thefts ??= []).push(t);
  if (t.seen === 'caught') mark(s);
}

/** the registrar's word on a theft caught: a warning the first time, then a point of the pool while the pool is fought (days 1 to 5), a fine
 *  after it (« proposé »: the pool's points no longer count once the cut is made) */
export function registrarOnCatch(s: GameState, emit: Emit): void {
  const v = s.v2!;
  if (!v.warned) { v.warned = true; emit({ kind: 'consequence', id: 'registrar:warn', cause: tx('v2.law.causeRules'), visible: true, text: tx('v2.law.warn', { fine: LAW.registrarFine }) }); return; }
  if (s.day <= 5) {
    s.tournament.points[PLAYER_ID] = (s.tournament.points[PLAYER_ID] ?? 0) - 1;
    emit({ kind: 'consequence', id: 'registrar:point', cause: tx('v2.law.causeRules'), visible: true, text: tx('v2.law.point') });
    return;
  }
  const fine = Math.min(LAW.registrarFine, s.player.coins);
  s.player.coins -= fine;
  emit({ kind: 'consequence', id: 'registrar:fine', cause: tx('v2.law.causeRules'), visible: true, text: tx('v2.law.registrarFine', { fine }) });
}

const add = (s: GameState, who: string, n: number) => { s.town[who] = clamp((s.town[who] ?? 0) + n, -100, 100); };
/** the items named in a sentence, « a, b and c » (texts of the table, so that a page says them in its language, journal Passe RG4) */
const names = (ids: string[]): string => ids.map(itemName).reduce((a, b, i, all) => (i === 0 ? b : tx(i === all.length - 1 ? 'list.and' : 'list.comma', { a, b })), '');

/** dawn after a version 2 day (called when its evening ends, the next day ahead): the owners count what they had, then the watch searches a
 *  player it wants. The news are dated the next morning, where the player reads them. */
export function v2Dawn(s: GameState, emit: Emit, rng: Rng): void {
  if (!isV2(s) || !s.v2) return;
  const at = { day: s.day + 1, slot: 'morning' as const };
  // the owners count: each theft of the day nobody saw, one chance each
  for (const t of s.v2.thefts ?? []) {
    if (t.day !== s.day || t.seen !== null || t.settled) continue;
    const pocket = !!PEOPLE[t.from]?.passer, p = pocket ? LAW.foundPocket : t.night ? LAW.foundNight : LAW.foundChance;
    if (rng.next() >= p) continue;
    t.seen = 'found'; mark(s); add(s, t.from, -10);
    emit({ ...at, kind: 'consequence', id: 'theft:found', cause: tx('v2.law.causeFound', { name: victimName(t.from) }), visible: true,
      text: tx(pocket ? 'v2.law.foundPocket' : t.night ? 'v2.law.foundNight' : 'v2.law.found', { name: victimName(t.from), item: itemName(t.item) }) });
  }
  // the reprisal (lot L2b): the muscle a robbed owner paid takes what it came for once its nights are over; a new grudge pays it
  const muscle = GENERICS[MUSCLE].name, r = s.v2.reprisal;
  if (r && s.day >= r.until) {
    const fine = Math.min(LAW.takes, s.player.coins), back = takenThefts(s).filter((t) => t.from === r.by && holds(s, t.item));
    s.player.coins -= fine; for (const t of back) { giveBack(s, t.item); t.settled = true; }
    add(s, r.by, 10); delete s.v2.reprisal;
    emit({ ...at, kind: 'consequence', id: 'reprisal:taken', cause: tx('v2.reprisal.cause', { name: victimName(r.by) }), visible: true, text: tx(back.length ? 'v2.reprisal.takenBack' : 'v2.reprisal.taken', { muscle, name: victimName(r.by), fine, items: names(back.map((t) => t.item)) }) });
  } else if (!r) {
    const sore = (s.v2.thefts ?? []).find((t) => t.day === s.day && t.seen !== null && !t.settled && (s.town[t.from] ?? 0) <= LAW.grudge);
    if (sore) {
      s.v2.reprisal = { by: sore.from, until: s.day + LAW.waits };
      emit({ ...at, kind: 'consequence', id: 'reprisal:hired', cause: tx('v2.reprisal.cause', { name: victimName(sore.from) }), visible: true, text: tx('v2.reprisal.hired', { muscle, name: victimName(sore.from) }) });
    }
  }
  // the watch searches a player it wants: what is still held of the thefts goes back, and a fine
  if (!wanted(s)) return;
  const back = takenThefts(s).filter((t) => holds(s, t.item));
  if (!back.length) return;
  for (const t of back) { giveBack(s, t.item); t.settled = true; add(s, t.from, 5); }
  const fine = Math.min(LAW.searchFine, s.player.coins);
  s.player.coins -= fine;
  emit({ ...at, kind: 'consequence', id: 'theft:search', cause: tx('v2.law.causeSearch'), visible: true, text: tx('v2.law.search', { items: names(back.map((t) => t.item)), fine }) });
}

// ------------------------------------------------------------------------------------------------ the way out: Sergeant Hale's ledger

/** what a restitution asks: the pieces still held go back, the others are paid at their list price, and Hale's fee */
export function restitution(s: GameState): { back: string[]; coins: number } {
  const open = unsettled(s), taken = takenThefts(s), back = taken.filter((t) => holds(s, t.item)).map((t) => t.item);
  const paid = taken.filter((t) => !holds(s, t.item)).reduce((n, t) => n + (GEAR[t.item]?.price ?? 0), 0);
  return { back, coins: open.length || marksOf(s) > 0 ? paid + LAW.fee : 0 };
}

/** the reprisal's bout (lot L2b, the operator's note on EV-2): won, the muscle leaves for good and the name gains a little; lost, the owner's pieces still held
 *  go back, the purse pays, and a heavy blow's knockdown wounds as in an official bout (V2B1-1, « A. K.O. par un coup puissant ») (« proposé ») */
export function applyReprisal(s: GameState, o: DuelOutcome, emit: Emit): void {
  const r = s.v2!.reprisal, muscle = GENERICS[MUSCLE].name, by = r?.by ?? '';
  delete s.v2!.reprisal;
  if (o.winner === 'player') {
    s.player.reputation = clamp(s.player.reputation + 2);
    emit({ kind: 'consequence', id: 'reprisal:won', cause: tx('v2.reprisal.cause', { name: victimName(by) }), visible: true, text: tx('v2.reprisal.won', { muscle, name: victimName(by) }) });
    return;
  }
  const fine = Math.min(LAW.takes, s.player.coins), back = takenThefts(s).filter((t) => t.from === by && holds(s, t.item));
  s.player.coins -= fine; for (const t of back) { giveBack(s, t.item); t.settled = true; }
  add(s, by, 10);
  emit({ kind: 'consequence', id: 'reprisal:lost', cause: tx('v2.reprisal.cause', { name: victimName(by) }), visible: true, text: tx(back.length ? 'v2.reprisal.lostBack' : 'v2.reprisal.lost', { muscle, name: victimName(by), fine, items: names(back.map((t) => t.item)) }) });
  if (o.finisher === 'heavy') {
    s.player.injury = Math.min(2, s.player.injury + 1);
    emit({ kind: 'consequence', id: 'player-injured', cause: tx('v2.reprisal.cause', { name: victimName(by) }), visible: true, text: tx('duel.injured') });
  }
}

/** the muscle is there to be met (its place and hour: the quay at night) */
const muscleHere = (s: GameState): string | null => {
  const p = PEOPLE[MUSCLE];
  return !s.v2?.reprisal ? tx('v2.reprisal.none') : s.place !== p.place || !presentAt(p, s.place, s.slot, true) ? tx('avail.notNow', { name: p.name }) : null;
};

export type V2LawAction = { type: 'restitute' } | { type: 'workDebt' } | { type: 'faceMuscle' } | { type: 'payMuscle' };

/** what a slot of work for the watch pays off (the town's paid jobs, ECO-3 « 10 pièces »: the operator's CO-3 « Un créneau par tranche de 10 pièces manquantes ») */
export const DEBT_SLOT = 10;
/** the slots a shortfall takes to work off, the first one spent with the restitution itself */
export const debtSlots = (short: number): number => Math.max(1, Math.ceil(short / DEBT_SLOT));
const haleHere = (s: GameState): string | null => (s.place !== 'district' || !presentAt(PEOPLE.hale, s.place, s.slot, true) ? tx('avail.notNow', { name: PEOPLE.hale.name }) : null);

export const V2_LAW_ACTIONS: { [K in V2LawAction['type']]: ActionDef<Extract<V2LawAction, { type: K }>> & { by: string | null } } = {
  // the reprisal (lot L2b): the muscle on the quay at night, faced on the sand (the stands empty) or paid off
  faceMuscle: {
    by: MUSCLE,
    list: (s) => (isV2(s) && s.v2?.reprisal && s.place === PEOPLE[MUSCLE].place ? [{ type: 'faceMuscle' }] : []),
    label: (s) => tx('v2.reprisal.face', { muscle: GENERICS[MUSCLE].name, name: victimName(s.v2?.reprisal?.by ?? '') }),
    cost: () => 0,
    later: () => 1,
    check: (s) => (!isV2(s) ? tx('v2.only') : muscleHere(s) ?? (s.v2?.challenge ? tx('v2.challenge.pending') : null)),
    apply: (s, _a, _r, emit) => { s.v2!.challenge = { who: MUSCLE, day: s.day, reprisal: true }; emit({ kind: 'action', id: 'reprisal:faced', cause: 'action:faceMuscle', visible: true, text: tx('v2.reprisal.faced', { muscle: GENERICS[MUSCLE].name }) }); },
  },
  payMuscle: {
    by: MUSCLE,
    list: (s) => (isV2(s) && s.v2?.reprisal && s.place === PEOPLE[MUSCLE].place ? [{ type: 'payMuscle' }] : []),
    label: (s) => tx('v2.reprisal.pay', { muscle: GENERICS[MUSCLE].name, name: victimName(s.v2?.reprisal?.by ?? '') }),
    cost: () => 0,
    coins: () => LAW.payOff,
    check: (s) => (!isV2(s) ? tx('v2.only') : muscleHere(s) ?? (s.v2?.challenge ? tx('v2.challenge.pending') : s.player.coins < LAW.payOff ? tx('buy.poor') : null)),
    apply: (s, _a, _r, emit) => {
      const by = s.v2!.reprisal!.by;
      s.player.coins -= LAW.payOff; add(s, by, 15); delete s.v2!.reprisal;
      emit({ kind: 'consequence', id: 'reprisal:paid', cause: 'action:payMuscle', visible: true, text: tx('v2.reprisal.paid', { muscle: GENERICS[MUSCLE].name, name: victimName(by), n: LAW.payOff }) });
    },
  },
  // a restitution's shortfall worked off at Sergeant Hale's, 10 coins a slot (the operator's CO-3, journal Passe CO3); the last load wipes the name from his ledger
  workDebt: {
    by: 'hale',
    list: (s) => (isV2(s) && s.place === 'district' && (s.v2?.debt ?? 0) > 0 ? [{ type: 'workDebt' }] : []),
    label: (s) => tx('v2.law.workDebt', { n: s.v2?.debt ?? 0, slot: DEBT_SLOT }),
    cost: () => 1,
    check: (s) => (!isV2(s) ? tx('v2.only') : haleHere(s) ?? (!(s.v2?.debt ?? 0) ? tx('v2.law.clean') : null)),
    apply: (s, _a, _r, emit) => {
      const left = Math.max(0, (s.v2!.debt ?? 0) - DEBT_SLOT);
      if (left > 0) { s.v2!.debt = left; emit({ kind: 'action', id: 'debt:worked', cause: 'action:workDebt', visible: true, text: tx('v2.law.debtLeft', { n: left }) }); return; }
      delete s.v2!.debt; s.v2!.marks = 0;
      emit({ kind: 'consequence', id: 'debt:done', cause: 'action:workDebt', visible: true, text: tx('v2.law.debtDone') });
    },
  },
  restitute: {
    by: 'hale',
    // (a debt being worked off has its own action: workDebt)
    list: (s) => (isV2(s) && s.place === 'district' && !s.v2?.debt && (marksOf(s) > 0 || unsettled(s).length > 0) ? [{ type: 'restitute' }] : []),
    label: (s) => {
      const r = restitution(s), short = r.coins > s.player.coins;
      return tx(short ? 'v2.law.restituteShort' : r.back.length ? 'v2.law.restituteBack' : 'v2.law.restitute', { items: names(r.back), n: short ? s.player.coins : r.coins, slots: debtSlots(r.coins - s.player.coins) });
    },
    // a purse too thin: Hale sets the player to haul for the watch, one slot for every 10 coins missing, the first one now (the operator's CO-3, journal Passe CO3;
    // a single slot cleared any shortfall before, a full purse paying all of it); the way out is always open
    cost: (s) => (restitution(s).coins > s.player.coins ? 1 : 0),
    coins: (s) => Math.min(restitution(s).coins, s.player.coins),
    check: (s) => (!isV2(s) ? tx('v2.only') : haleHere(s) ?? (s.v2?.debt ? tx('v2.law.inDebt', { n: s.v2.debt }) : marksOf(s) <= 0 && !unsettled(s).length ? tx('v2.law.clean') : null)),
    apply: (s, _a, _r, emit) => {
      const r = restitution(s), short = r.coins > s.player.coins, paid = Math.min(r.coins, s.player.coins);
      for (const t of unsettled(s)) {
        if (t.seen !== 'caught' && holds(s, t.item)) giveBack(s, t.item);
        t.settled = true; add(s, t.from, 5);
        // a passer-by's piece goes back to its owner, who holds it again
        if (s.v2!.passed?.[t.from] !== undefined) delete s.v2!.passed[t.from];
      }
      // the owners paid, no muscle waits any more (lot L2b); a shortfall beyond the slot spent now stays owed, the ledger keeping the name until it is worked off
      const left = short ? Math.max(0, r.coins - paid - DEBT_SLOT) : 0;
      s.player.coins -= paid; add(s, 'hale', 5); delete s.v2!.reprisal;
      if (left > 0) s.v2!.debt = left; else s.v2!.marks = 0;
      emit({ kind: 'consequence', id: 'theft:settled', cause: 'action:restitute', visible: true, text: tx(!short ? 'v2.law.settled' : left > 0 ? 'v2.law.settledDebt' : 'v2.law.settledShort', { n: paid, left }) });
    },
  },
};
