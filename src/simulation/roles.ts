import { clamp, type GameState } from './state';
import type { Emit } from './advance';
import type { ActionDef } from './actions';
import { PEOPLE, presentAt } from '../narrative/people';
import { RIVALS } from '../narrative/roster';
import { tx } from '../narrative/text';

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
  if (!p) return tx('avail.nobody');
  if (p.place !== st.place) return tx('avail.notHere', { name: p.name });
  if (who === 'bram' && st.services.forge === 'sabotaged') return tx('avail.bramGone');
  return presentAt(p, st.place, st.slot) ? null : tx('avail.notNow', { name: p.name });
}

const blade = (st: GameState) => st.player.items.includes('tempered-blade') || st.player.items.includes('imported-blade');
const day = (st: GameState) => st.slot !== 'evening';
const add = (s: GameState, who: string, n: number) => { s.town[who] = clamp((s.town[who] ?? 0) + n, -100, 100); };
const fact = (s: GameState, f: string) => { if (!s.facts.includes(f)) s.facts.push(f); };
type T = { [K in RoleAction['type']]: ActionDef<Extract<RoleAction, { type: K }>> & { by: string | ((a: Extract<RoleAction, { type: K }>) => string) } };

export const ROLE_ACTIONS: T = {
  // ---------------------------------------------------------------- Mara, the merchant: the shop (open by day), rumours, a good turn
  buy: {
    by: 'mara',
    list: (st) => (st.place === 'district' ? (Object.keys(ITEMS) as ShopItem[]).map((item) => ({ type: 'buy', item })) : []),
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
        emit({ kind: 'action', id: 'informant-warns', cause: 'action:buyInfo', text: (s.competitors.cassius?.relationships.player ?? 0) <= -25 ? tx('buyInfo.warn') : tx('buyInfo.quiet'), visible: true });
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
      emit({ kind: 'consequence', id: 'cassius-sanctioned', cause: 'action:report', text: tx('report.log'), visible: true });
    },
  },
  // ---------------------------------------------------------------- the forecourt: the registrar, the healer, Orla, the rivals
  register: {
    by: 'odo',
    list: (st) => (st.place === 'forecourt' && !st.flags.registered ? [{ type: 'register' }] : []),
    label: () => tx('register.label'),
    cost: () => 0,
    check: (st) => available(st, 'odo') ?? (st.flags.registered ? tx('register.done') : null),
    apply: (s, _a, _r, emit) => { s.flags.registered = true; s.player.reputation = clamp(s.player.reputation + 2); emit({ kind: 'action', id: 'register', cause: 'action:register', text: tx('register.log', { name: s.player.name }), visible: true }); },
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
    list: (st) => (st.place === 'forecourt' ? [{ type: 'spar' }] : []),
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
    list: (st) => (st.place === 'forecourt' ? ['vessa', 'marek'].map((who) => ({ type: 'scout', who })) : []),
    label: (_, a) => tx('scout.label', { name: RIVALS[a.who].name }),
    cost: () => 1,
    check: (st, a) => available(st, a.who) ?? (st.facts.includes(`scouted:${a.who}`) ? tx('scout.known', { name: RIVALS[a.who].name }) : null),
    apply: (s, a, _r, emit) => {
      fact(s, `scouted:${a.who}`);
      const c = s.competitors[a.who]; if (c) c.relationships.player = clamp((c.relationships.player ?? 0) + (RIVALS[a.who].temper === 'proud' ? -5 : 2), -100, 100);
      emit({ kind: 'action', id: `scout:${a.who}`, cause: 'action:scout', text: tx('scout.log', { name: RIVALS[a.who].name, habit: RIVALS[a.who].name === 'Marek Varn' ? tx('scout.habitMarek') : tx('scout.habitOther') }), visible: true });
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
    label: () => tx('confront.label'),
    cost: () => 0,
    check: (st) => available(st, 'cassius') ?? (!st.flags['culprit-known'] ? tx('confront.noProof') : st.flags.confronted ? tx('confront.heard') : null),
    apply: (s, _a, _r, emit) => {
      s.flags.confronted = true; s.player.reputation = clamp(s.player.reputation + 5);
      const c = s.competitors.cassius; if (c) c.reputation = clamp(c.reputation - 10);
      emit({ kind: 'consequence', id: 'cassius-shamed', cause: 'action:confront', visible: true, text: tx('confront.log') });
    },
  },
};

/** the new bellows: 12 coins, 6 if Orla (a friend by now) lends her arms */
export function repairCost(st: GameState): number { return (st.competitors.orla?.relationships.player ?? 0) >= 20 ? 6 : 12; }

/** who offers an action (for the dialogue's options), or null for the player's own (rest, wait, moves) */
export function offeredBy(a: { type: string } & Record<string, unknown>): string | null {
  const d = (ROLE_ACTIONS as Record<string, { by: string | ((a: never) => string) }>)[a.type];
  if (!d) return a.type === 'payWatch' ? 'hale' : null;
  return typeof d.by === 'function' ? (d.by as (a: unknown) => string)(a) : d.by;
}
