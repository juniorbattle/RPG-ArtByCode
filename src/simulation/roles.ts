import { clamp, type GameState } from './state';
import type { Emit } from './advance';
import type { ActionDef } from './actions';
import { PEOPLE, placeOf, presentAt } from '../narrative/people';
import { RIVALS } from '../narrative/roster';
import { tx, type TextKey } from '../narrative/text';
import { isV2 } from './v2';
import { V2_SKILL_ACTIONS } from './v2skills';
import { V2_GEAR_ACTIONS } from './v2gear';
import { V2_TOWN_ACTIONS } from './v2town';
import { V2_STORY_ACTIONS } from '../narrative/v2story';
import { V2_LAW_ACTIONS } from './v2law';
import { V2_BARTER_ACTIONS } from './v2barter';
import { V2_INTEL_ACTIONS } from './v2intel';

const V2_OFFERS = { ...V2_SKILL_ACTIONS, ...V2_GEAR_ACTIONS, ...V2_TOWN_ACTIONS, ...V2_STORY_ACTIONS, ...V2_LAW_ACTIONS, ...V2_BARTER_ACTIONS, ...V2_INTEL_ACTIONS };

/** The town's people in game roles (choice P4, journal Passe L4): the district's existing characters offer services, quests and clues;
 *  the forecourt's officials and the rivals offer care, sparring and scouting (choice K3: portraits and dialogues). Each action names who
 *  offers it (`by`), so a dialogue lists that person's options. Day and night change who is there and what is open (PROJECT § 8.1); a
 *  closed or lost service always leaves a designed alternative (GAMEPLAY § 10). English (choice K1). */

export type RoleAction =
  | { type: 'buy'; item: ShopItem }
  | { type: 'restock' }
  | { type: 'askPapers' }
  | { type: 'haul' }
  | { type: 'temper' }
  | { type: 'repair' }
  | { type: 'keepWatch' }
  | { type: 'buyInfo' }
  | { type: 'report' }
  | { type: 'register' }
  | { type: 'heal' }
  | { type: 'spar' }
  | { type: 'scout'; who: string }
  | { type: 'listen' }
  | { type: 'taunt' }
  | { type: 'confront' };

export type ShopItem = 'whetstone' | 'salve' | 'imported-blade';
export const ITEMS: Record<ShopItem, { name: string; price: number; about: string }> = {
  whetstone: { name: tx('item.whetstone.name'), price: 8, about: tx('item.whetstone.about') },
  salve: { name: tx('item.salve.name'), price: 10, about: tx('item.salve.about') },
  'imported-blade': { name: tx('item.imported-blade.name'), price: 30, about: tx('item.imported-blade.about') },
};

/** Mara's price: the list price, times the shop's factor (a shortage), minus her favour (a tenth) */
export function priceOf(st: GameState, item: ShopItem): number {
  const f = item === 'imported-blade' || item === 'whetstone' ? st.services.shopFactor : 1;
  return Math.round(ITEMS[item].price * f * (st.flags['discount:mara'] ? 0.9 : 1));
}

/** is this person there to talk to now (their hours, their place, and what the story did to them) */
export function available(st: GameState, who: string): string | null {
  const p = PEOPLE[who];
  if (!p || (p.v2 && !isV2(st))) return tx('avail.nobody');
  if (placeOf(p, isV2(st)) !== st.place) return tx('avail.notHere', { name: p.name });
  if (who === 'bram' && st.services.forge === 'sabotaged') return tx('avail.bramGone');
  // a person in the Cité some days only (a version 2 passer-by, lot L2a); today's people have no such days
  if (p.days && (st.day < p.days[0] || st.day > p.days[1])) return tx('avail.notNow', { name: p.name });
  return presentAt(p, st.place, st.slot, isV2(st)) ? null : tx('avail.notNow', { name: p.name });
}

const blade = (st: GameState) => st.player.items.includes('tempered-blade') || st.player.items.includes('imported-blade');
const day = (st: GameState) => st.slot !== 'evening';
const add = (s: GameState, who: string, n: number) => { s.town[who] = clamp((s.town[who] ?? 0) + n, -100, 100); };
const fact = (s: GameState, f: string) => { if (!s.facts.includes(f)) s.facts.push(f); };
type T = { [K in RoleAction['type']]: ActionDef<Extract<RoleAction, { type: K }>> & { by: string | ((a: Extract<RoleAction, { type: K }>) => string) } };

/** the rivals the player can watch train (at the forecourt, by day): the match sheet says so of them only (journal Passe EVL1) */
export const SCOUTED: readonly string[] = ['vessa', 'marek'];
/** a version 2 game (lot L3, the operator's EV-11 « Observer tout adversaire, rumeurs, activité lisible », journal Passe EV2): every rival of the pool, where
 *  and when they train (src/narrative/people.ts): Vessa and Marek on the forecourt and Orla and Ilse on the training ground by day, Cassius on the festival
 *  square at night, Rhosk and Tobin on the training ground by day from day 6; today's game keeps its two */
export const SCOUTED_V2: readonly string[] = ['vessa', 'marek', 'orla', 'ilse', 'cassius', 'rhosk', 'tobin'];
export const scoutable = (st: Pick<GameState, 'flags'>): readonly string[] => (isV2(st) ? SCOUTED_V2 : SCOUTED);
/** what an hour of a rival's practice shows in a version 2 game (« proposé »): the style their skills make; the skills' names go to the match sheet */
const SCOUT_HABIT: Record<string, TextKey> = {
  vessa: 'v2.scout.habit.vessa', marek: 'v2.scout.habit.marek', orla: 'v2.scout.habit.orla', ilse: 'v2.scout.habit.ilse',
  cassius: 'v2.scout.habit.cassius', rhosk: 'v2.scout.habit.rhosk', tobin: 'v2.scout.habit.tobin',
};
/** which chain of Cassius the player knows of (lot L3: the report and the confrontation say what was done, the forge or the gear) */
const forgeKnown = (st: GameState): boolean => ['forge-burned', 'saboteur-caught', 'culprit-named', 'saboteur-fled'].some((f) => st.facts.includes(f));

export const ROLE_ACTIONS: T = {
  // ---------------------------------------------------------------- Mara, the merchant: the shop (open by day), rumours, a good turn
  buy: {
    by: 'mara',
    // a version 2 game buys from the shops of its gear system (v2gear.ts: Mara's stall is its general store)
    list: (st) => (st.place === 'district' && !isV2(st) ? (Object.keys(ITEMS) as ShopItem[]).map((item) => ({ type: 'buy', item })) : []),
    label: (st, a) => tx('buy.label', { item: ITEMS[a.item].name, price: priceOf(st, a.item), about: ITEMS[a.item].about }),
    cost: () => 0,
    coins: (st, a) => priceOf(st, a.item),
    check: (st, a) => available(st, 'mara') ?? (!day(st) ? tx('buy.shut') : st.player.coins < priceOf(st, a.item) ? tx('buy.poor')
      : a.item === 'salve' && st.player.injury === 0 ? tx('buy.notHurt') : a.item === 'imported-blade' && blade(st) ? tx('buy.haveBlade')
        : a.item === 'whetstone' && st.player.items.includes('whetstone') ? tx('buy.haveStone') : null),
    apply: (s, a, _r, emit) => {
      const p = priceOf(s, a.item);
      s.player.coins -= p; add(s, 'mara', 3);
      if (a.item === 'salve') s.player.injury = Math.max(0, s.player.injury - 1); else s.player.items.push(a.item);
      emit({ kind: 'action', id: `buy:${a.item}`, cause: s.services.shopFactor > 1 && a.item !== 'salve' ? tx('buy.causePrices', { cause: s.services.shopCause }) : 'action:buy', visible: true,
        text: tx(a.item === 'salve' ? 'buy.logSalve' : 'buy.log', { item: ITEMS[a.item].name, price: p }) });
    },
  },
  restock: {
    by: 'mara',
    list: (st) => (st.place === 'district' ? [{ type: 'restock' }] : []),
    label: () => tx('restock.label'),
    cost: () => 1,
    check: (st) => available(st, 'mara') ?? (st.slot !== 'morning' ? tx('restock.morning') : st.flags['restocked'] === st.day ? tx('restock.done') : null),
    apply: (s, _a, _r, emit) => { s.player.coins += 6; add(s, 'mara', 15); s.flags.restocked = s.day; emit({ kind: 'action', id: 'restock', cause: 'action:restock', text: tx('restock.log'), visible: true }); },
  },
  // ---------------------------------------------------------------- the steel cargo (Tam, Sergeant Hale, Bram): the quest that changes a bout
  askPapers: {
    by: 'hale',
    list: (st) => (st.place === 'district' && st.quests.cargo === 'asked' ? [{ type: 'askPapers' }] : []),
    label: () => tx('askPapers.label'),
    cost: () => 0,
    check: (st) => available(st, 'hale') ?? (st.quests.cargo !== 'asked' ? tx('askPapers.none') : null),
    apply: (s, _a, _r, emit) => { s.quests.cargo = 'papers'; add(s, 'hale', 5); emit({ kind: 'action', id: 'papers', cause: 'quest:cargo', text: tx('askPapers.log'), visible: true }); },
  },
  haul: {
    by: 'tam',
    list: (st) => (st.place === 'district' && (st.quests.cargo === 'papers' || st.quests.cargo === 'asked') ? [{ type: 'haul' }] : []),
    label: () => tx('haul.label'),
    cost: () => 1,
    check: (st) => available(st, 'tam') ?? (st.quests.cargo === 'asked' ? tx('haul.held') : st.quests.cargo !== 'papers' ? tx('haul.none') : null),
    apply: (s, _a, _r, emit) => {
      s.quests.cargo = 'delivered'; s.player.coins += 8; add(s, 'tam', 15); add(s, 'bram', 10);
      const o = s.competitors.orla; if (o) o.relationships.player = clamp((o.relationships.player ?? 0) + 10, -100, 100);
      emit({ kind: 'action', id: 'haul', cause: 'quest:cargo', text: tx('haul.log'), visible: true });
    },
  },
  temper: {
    by: 'bram',
    list: (st) => (st.place === 'district' && st.quests.cargo === 'delivered' ? [{ type: 'temper' }] : []),
    label: () => tx('temper.label'),
    cost: () => 1,
    coins: () => 10,
    check: (st) => available(st, 'bram') ?? (st.services.forge === 'sabotaged' ? tx('temper.cold') : blade(st) ? tx('temper.haveBlade') : st.player.coins < 10 ? tx('temper.poor') : null),
    apply: (s, _a, _r, emit) => { s.player.coins -= 10; s.player.items.push('tempered-blade'); s.quests.cargo = 'done'; add(s, 'bram', 10); emit({ kind: 'action', id: 'temper', cause: 'quest:cargo', text: tx('temper.log'), visible: true }); },
  },
  repair: {
    by: 'forge',
    list: (st) => (st.place === 'district' && st.services.forge === 'sabotaged' ? [{ type: 'repair' }] : []),
    label: (st) => tx('repair.label', { cost: repairCost(st) }),
    cost: () => 1,
    coins: (st) => repairCost(st),
    check: (st) => (st.services.forge !== 'sabotaged' ? tx('repair.working') : !day(st) ? tx('repair.dark') : st.player.coins < repairCost(st) ? tx('repair.poor', { cost: repairCost(st) }) : null),
    apply: (s, _a, _r, emit) => {
      const c = repairCost(s);
      s.player.coins -= c; s.services.forge = 'repaired'; add(s, 'bram', 20);
      emit({ kind: 'consequence', id: 'forge-repaired', cause: 'action:repair', text: tx('repair.log', { orla: (s.competitors.orla?.relationships.player ?? 0) >= 20 ? tx('repair.logOrla') : '' }), visible: true });
    },
  },
  // ---------------------------------------------------------------- the watch (Wynn, Hale) and the informant: the sabotage's answers
  keepWatch: {
    by: 'wynn',
    list: (st) => (st.place === 'district' && st.slot === 'evening' ? [{ type: 'keepWatch' }] : []),
    label: () => tx('keepWatch.label'),
    cost: () => 1,
    check: (st) => available(st, 'wynn') ?? (st.slot !== 'evening' ? tx('keepWatch.night') : st.services.forge === 'sabotaged' ? tx('keepWatch.nothing') : null),
    apply: (s, _a, _r, emit) => { s.services.forgeWatch = true; s.flags.watched = s.day; emit({ kind: 'action', id: 'keep-watch', cause: 'action:keepWatch', text: tx('keepWatch.log'), visible: true }); },
  },
  buyInfo: {
    by: 'stranger',
    list: (st) => (st.place === 'district' ? [{ type: 'buyInfo' }] : []),
    label: () => tx('buyInfo.label'),
    cost: () => 0,
    coins: () => 10,
    check: (st) => available(st, 'stranger') ?? (st.player.coins < 10 ? tx('buyInfo.poor') : st.flags['culprit-known'] ? tx('buyInfo.told') : null),
    apply: (s, _a, _r, emit) => {
      s.player.coins -= 10;
      if (s.services.forge === 'sabotaged') {
        s.flags['culprit-known'] = 'cassius'; fact(s, 'culprit-named');
        emit({ kind: 'action', id: 'informant-names', cause: 'action:buyInfo', text: tx('buyInfo.names'), visible: true });
      } else {
        fact(s, 'informant-warning');
        // a version 2 game (lot L3, EV-10 « Une réponse par lieu »): the two places Cassius can reach, each with its own answer
        emit({ kind: 'action', id: 'informant-warns', cause: 'action:buyInfo', text: (s.competitors.cassius?.relationships.player ?? 0) <= -25 ? tx(isV2(s) ? 'v2.buyInfo.warn' : 'buyInfo.warn') : tx('buyInfo.quiet'), visible: true });
      }
    },
  },
  report: {
    by: 'hale',
    list: (st) => (st.place === 'district' && st.flags['culprit-known'] && !st.flags.reported ? [{ type: 'report' }] : []),
    label: () => tx('report.label'),
    cost: () => 0,
    check: (st) => available(st, 'hale') ?? (!st.flags['culprit-known'] ? tx('report.unknown') : st.flags.reported || st.facts.includes('saboteur-caught') ? tx('report.known') : null),
    apply: (s, _a, _r, emit) => {
      s.flags.reported = true; s.tournament.points.cassius -= 3; const c = s.competitors.cassius; if (c) c.reputation = clamp(c.reputation - 20);
      s.player.coins += 15; s.player.reputation = clamp(s.player.reputation + 5); add(s, 'hale', 10);
      // a version 2 game (lot L3, EV-10: « l'enquête mène à l'auteur et à une compensation »): the strap cut is paid for by the tournament's purse when the forge
      // was never touched
      emit({ kind: 'consequence', id: 'cassius-sanctioned', cause: 'action:report', text: tx(isV2(s) && !forgeKnown(s) ? 'v2.report.gearLog' : 'report.log'), visible: true });
    },
  },
  // ---------------------------------------------------------------- the forecourt: the registrar, the healer, Orla, the rivals
  register: {
    by: 'odo',
    list: (st) => (st.place === 'forecourt' && !st.flags.registered ? [{ type: 'register' }] : []),
    label: () => tx('register.label'),
    cost: () => 0,
    check: (st) => available(st, 'odo') ?? (st.flags.registered ? tx('register.done') : null),
    apply: (s, _a, _r, emit) => { s.flags.registered = true; s.player.reputation = clamp(s.player.reputation + 2); emit({ kind: 'action', id: 'register', cause: 'action:register', text: tx(isV2(s) ? 'v2.register.log' : 'register.log', { name: s.player.name }), visible: true }); },
  },
  heal: {
    by: 'anwen',
    list: (st) => (st.place === 'forecourt' ? [{ type: 'heal' }] : []),
    label: (st) => tx('heal.label', { price: st.flags['free-care'] ? tx('heal.free') : tx('heal.paid') }),
    cost: () => 1,
    coins: (st) => (st.flags['free-care'] ? 0 : 8),
    check: (st) => available(st, 'anwen') ?? (st.player.injury === 0 ? tx('heal.notHurt') : !st.flags['free-care'] && st.player.coins < 8 ? tx('heal.poor') : null),
    apply: (s, _a, _r, emit) => { if (!s.flags['free-care']) s.player.coins -= 8; s.player.injury = 0; emit({ kind: 'action', id: 'heal', cause: 'action:heal', text: tx('heal.log'), visible: true }); },
  },
  spar: {
    by: 'orla',
    // Orla trains at the version 2's training ground (lot V5)
    list: (st) => (st.place === placeOf(PEOPLE.orla, isV2(st)) ? [{ type: 'spar' }] : []),
    label: () => tx('spar.label'),
    cost: () => 1,
    check: (st) => available(st, 'orla') ?? (st.player.training >= 2 ? tx('spar.sharp') : null),
    apply: (s, _a, _r, emit) => {
      s.player.training++; const o = s.competitors.orla; if (o) o.relationships.player = clamp((o.relationships.player ?? 0) + 15, -100, 100);
      const friend = (o?.relationships.player ?? 0) >= 25;
      if (friend) fact(s, 'orla-recruitable');
      emit({ kind: 'action', id: 'spar', cause: 'action:spar', visible: true, text: friend ? tx('spar.friend') : tx('spar.log') });
    },
  },
  scout: {
    by: (a) => a.who,
    // a version 2 game (lot L3): every rival where they train, in the days they are in the Cité (Rhosk and Tobin from day 6)
    list: (st) => (isV2(st)
      ? SCOUTED_V2.filter((who) => placeOf(PEOPLE[who], true) === st.place && (!PEOPLE[who].days || st.day >= PEOPLE[who].days![0])).map((who) => ({ type: 'scout', who }))
      : st.place === 'forecourt' ? SCOUTED.map((who) => ({ type: 'scout', who })) : []),
    label: (st, a) => tx(isV2(st) ? 'v2.scout.label' : 'scout.label', { name: RIVALS[a.who].name }),
    cost: () => 1,
    check: (st, a) => (isV2(st) && !SCOUTED_V2.includes(a.who) ? tx('avail.nobody') : null) ?? available(st, a.who) ?? (st.facts.includes(`scouted:${a.who}`) ? tx('scout.known', { name: RIVALS[a.who].name }) : null),
    apply: (s, a, _r, emit) => {
      fact(s, `scouted:${a.who}`);
      const c = s.competitors[a.who]; if (c) c.relationships.player = clamp((c.relationships.player ?? 0) + (RIVALS[a.who].temper === 'proud' ? -5 : 2), -100, 100);
      // a version 2 game: what each rival's practice shows of the style their skills make (src/combat/v2duel.ts V2_FOES), the skills named on the match sheet
      const habit = isV2(s) ? tx(SCOUT_HABIT[a.who]) : RIVALS[a.who].name === 'Marek Varn' ? tx('scout.habitMarek') : tx('scout.habitOther');
      emit({ kind: 'action', id: `scout:${a.who}`, cause: 'action:scout', text: tx(isV2(s) ? 'v2.scout.log' : 'scout.log', { name: RIVALS[a.who].name, habit }), visible: true });
    },
  },
  // ---------------------------------------------------------------- Lantern Row at night (journal Passe L6): the tavern's talk, House Dree
  listen: {
    by: 'lio',
    list: (st) => (st.place === 'lanterns' ? [{ type: 'listen' }] : []),
    label: () => tx('listen.label'),
    cost: () => 1,
    check: (st) => available(st, 'lio') ?? (st.flags[`listened:${st.day}`] ? tx('listen.heard') : null),
    apply: (s, _a, _r, emit) => {
      s.flags[`listened:${s.day}`] = true; s.player.reputation = clamp(s.player.reputation + 3); fact(s, 'tavern-talk');
      const hostile = (s.competitors.cassius?.relationships.player ?? 0) <= -25;
      emit({ kind: 'action', id: 'listen', cause: 'action:listen', visible: true, text: hostile
        ? tx('listen.hostile')
        : tx('listen.log') });
    },
  },
  taunt: {
    by: 'cassius',
    list: (st) => (st.place === 'lanterns' && !st.flags.taunted ? [{ type: 'taunt' }] : []),
    label: () => tx('taunt.label'),
    cost: () => 0,
    check: (st) => available(st, 'cassius') ?? (st.flags.taunted ? tx('taunt.once') : null),
    apply: (s, _a, _r, emit) => {
      s.flags.taunted = true; s.player.reputation = clamp(s.player.reputation + 4);
      const c = s.competitors.cassius; if (c) c.relationships.player = clamp((c.relationships.player ?? 0) - 15, -100, 100);
      emit({ kind: 'action', id: 'taunt', cause: 'action:taunt', visible: true, text: tx('taunt.log') });
    },
  },
  confront: {
    by: 'cassius',
    list: (st) => (st.place === 'lanterns' && st.flags['culprit-known'] && !st.flags.confronted ? [{ type: 'confront' }] : []),
    // a version 2 game (lot L3): the saboteur of the gear as of the forge, before the festival square's crowd
    label: (st) => tx(isV2(st) && !forgeKnown(st) ? 'v2.confront.gearLabel' : 'confront.label'),
    cost: () => 0,
    check: (st) => available(st, 'cassius') ?? (!st.flags['culprit-known'] ? tx('confront.noProof') : st.flags.confronted ? tx('confront.heard') : null),
    apply: (s, _a, _r, emit) => {
      s.flags.confronted = true; s.player.reputation = clamp(s.player.reputation + 5);
      const c = s.competitors.cassius; if (c) c.reputation = clamp(c.reputation - 10);
      emit({ kind: 'consequence', id: 'cassius-shamed', cause: 'action:confront', visible: true, text: tx(isV2(s) && !forgeKnown(s) ? 'v2.confront.gearLog' : 'confront.log') });
    },
  },
};

/** the new bellows: 12 coins, 6 if Orla (a friend by now) lends her arms */
export function repairCost(st: GameState): number { return (st.competitors.orla?.relationships.player ?? 0) >= 20 ? 6 : 12; }

/** who offers an action (for the dialogue's options), or null for the player's own (rest, wait, moves) */
export function offeredBy(a: { type: string } & Record<string, unknown>): string | null {
  // the version 2's offers (its weapon master, its shops' keepers) after today's
  const d = (ROLE_ACTIONS as Record<string, { by: string | ((a: never) => string) }>)[a.type] ?? (V2_OFFERS as Record<string, { by: string | ((a: never) => string) | null }>)[a.type] ?? undefined;
  if (!d) return a.type === 'payWatch' ? 'hale' : null;
  return typeof d.by === 'function' ? (d.by as (a: unknown) => string)(a) : d.by;
}
