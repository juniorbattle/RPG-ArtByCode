import { clamp, type GameState } from './state';
import type { Emit } from './advance';
import type { ActionDef } from './actions';
import { PEOPLE, presentAt } from '../narrative/people';
import { RIVALS } from '../narrative/roster';

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
  whetstone: { name: 'a whetstone', price: 8, about: '+5 % damage at your next bout' },
  salve: { name: 'a healing salve', price: 10, about: 'heals one level of injury at once' },
  'imported-blade': { name: 'an imported blade', price: 30, about: '+15 % damage, for good' },
};

/** Mara's price: the list price, times the shop's factor (a shortage), minus her favour (a tenth) */
export function priceOf(st: GameState, item: ShopItem): number {
  const f = item === 'imported-blade' || item === 'whetstone' ? st.services.shopFactor : 1;
  return Math.round(ITEMS[item].price * f * (st.flags['discount:mara'] ? 0.9 : 1));
}

/** is this person there to talk to now (their hours, their place, and what the story did to them) */
export function available(st: GameState, who: string): string | null {
  const p = PEOPLE[who];
  if (!p) return 'Nobody by that name.';
  if (p.place !== st.place) return `${p.name} is not here.`;
  if (who === 'bram' && st.services.forge === 'sabotaged') return 'Bram\'s forge is a ruin; he is nowhere to be seen.';
  return presentAt(p, st.place, st.slot) ? null : `${p.name} is not around at this hour.`;
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
    label: (st, a) => `Buy ${ITEMS[a.item].name} (${priceOf(st, a.item)} coins: ${ITEMS[a.item].about})`,
    cost: () => 0,
    coins: (st, a) => priceOf(st, a.item),
    check: (st, a) => available(st, 'mara') ?? (!day(st) ? 'Mara\'s stall is shut for the night.' : st.player.coins < priceOf(st, a.item) ? 'You cannot afford it.'
      : a.item === 'salve' && st.player.injury === 0 ? 'You are not hurt.' : a.item === 'imported-blade' && blade(st) ? 'You already carry a fine blade.'
        : a.item === 'whetstone' && st.player.items.includes('whetstone') ? 'You have a whetstone.' : null),
    apply: (s, a, _r, emit) => {
      const p = priceOf(s, a.item);
      s.player.coins -= p; add(s, 'mara', 3);
      if (a.item === 'salve') s.player.injury = Math.max(0, s.player.injury - 1); else s.player.items.push(a.item);
      emit({ kind: 'action', id: `buy:${a.item}`, cause: s.services.shopFactor > 1 && a.item !== 'salve' ? `the shop's prices (${s.services.shopCause})` : 'action:buy', visible: true,
        text: `You buy ${ITEMS[a.item].name} from Mara for ${p} coins${a.item === 'salve' ? ' and dress your wound' : ''}.` });
    },
  },
  restock: {
    by: 'mara',
    list: (st) => (st.place === 'district' ? [{ type: 'restock' }] : []),
    label: () => 'Help Mara unload her morning crates (+6 coins, her goodwill)',
    cost: () => 1,
    check: (st) => available(st, 'mara') ?? (st.slot !== 'morning' ? 'Mara\'s crates come in the morning.' : st.flags['restocked'] === st.day ? 'Her crates are unloaded.' : null),
    apply: (s, _a, _r, emit) => { s.player.coins += 6; add(s, 'mara', 15); s.flags.restocked = s.day; emit({ kind: 'action', id: 'restock', cause: 'action:restock', text: 'You haul Mara\'s crates up from the quay. She counts six coins into your hand, and smiles.', visible: true }); },
  },
  // ---------------------------------------------------------------- the steel cargo (Tam, Sergeant Hale, Bram): the quest that changes a bout
  askPapers: {
    by: 'hale',
    list: (st) => (st.place === 'district' && st.quests.cargo === 'asked' ? [{ type: 'askPapers' }] : []),
    label: () => 'Ask for the release papers of Tam\'s crate',
    cost: () => 0,
    check: (st) => available(st, 'hale') ?? (st.quests.cargo !== 'asked' ? 'You have no papers to ask for.' : null),
    apply: (s, _a, _r, emit) => { s.quests.cargo = 'papers'; add(s, 'hale', 5); emit({ kind: 'action', id: 'papers', cause: 'quest:cargo', text: 'Sergeant Hale stamps the release: « Wyrmsteel for Bram? Then the quay will be proud of you. »', visible: true }); },
  },
  haul: {
    by: 'tam',
    list: (st) => (st.place === 'district' && (st.quests.cargo === 'papers' || st.quests.cargo === 'asked') ? [{ type: 'haul' }] : []),
    label: () => 'Haul the Wyrmsteel crate to Bram\'s forge with Tam (+8 coins)',
    cost: () => 1,
    check: (st) => available(st, 'tam') ?? (st.quests.cargo === 'asked' ? 'The watch holds the crate: Sergeant Hale must sign its release.' : st.quests.cargo !== 'papers' ? 'There is no crate to haul.' : null),
    apply: (s, _a, _r, emit) => {
      s.quests.cargo = 'delivered'; s.player.coins += 8; add(s, 'tam', 15); add(s, 'bram', 10);
      const o = s.competitors.orla; if (o) o.relationships.player = clamp((o.relationships.player ?? 0) + 10, -100, 100);
      emit({ kind: 'action', id: 'haul', cause: 'quest:cargo', text: 'You and Tam roll the Wyrmsteel crate to the forge. Bram whistles: « With this I could temper your blade. » Tam\'s cousin Orla will hear of it.', visible: true });
    },
  },
  temper: {
    by: 'bram',
    list: (st) => (st.place === 'district' && st.quests.cargo === 'delivered' ? [{ type: 'temper' }] : []),
    label: () => 'Have Bram temper your blade in the Wyrmsteel (10 coins: +15 % damage)',
    cost: () => 1,
    coins: () => 10,
    check: (st) => available(st, 'bram') ?? (st.services.forge === 'sabotaged' ? 'The forge is cold.' : blade(st) ? 'You already carry a fine blade.' : st.player.coins < 10 ? 'You cannot pay Bram (10 coins).' : null),
    apply: (s, _a, _r, emit) => { s.player.coins -= 10; s.player.items.push('tempered-blade'); s.quests.cargo = 'done'; add(s, 'bram', 10); emit({ kind: 'action', id: 'temper', cause: 'quest:cargo', text: 'Bram folds the Wyrmsteel into your blade through the afternoon heat. It rings like a bell.', visible: true }); },
  },
  repair: {
    by: 'forge',
    list: (st) => (st.place === 'district' && st.services.forge === 'sabotaged' ? [{ type: 'repair' }] : []),
    label: (st) => `Help Bram rebuild the forge (${repairCost(st)} coins)`,
    cost: () => 1,
    coins: (st) => repairCost(st),
    check: (st) => (st.services.forge !== 'sabotaged' ? 'The forge is working.' : !day(st) ? 'Bram will not rebuild in the dark.' : st.player.coins < repairCost(st) ? `You cannot buy the new bellows (${repairCost(st)} coins).` : null),
    apply: (s, _a, _r, emit) => {
      const c = repairCost(s);
      s.player.coins -= c; s.services.forge = 'repaired'; add(s, 'bram', 20);
      emit({ kind: 'consequence', id: 'forge-repaired', cause: 'action:repair', text: `You and Bram${(s.competitors.orla?.relationships.player ?? 0) >= 20 ? ', with Orla\'s strong arms,' : ''} hang new bellows and scrape the pitch from the hearth. By the end of the slot the forge breathes again.`, visible: true });
    },
  },
  // ---------------------------------------------------------------- the watch (Wynn, Hale) and the informant: the sabotage's answers
  keepWatch: {
    by: 'wynn',
    list: (st) => (st.place === 'district' && st.slot === 'evening' ? [{ type: 'keepWatch' }] : []),
    label: () => 'Keep watch at the forge yourself tonight',
    cost: () => 1,
    check: (st) => available(st, 'wynn') ?? (st.slot !== 'evening' ? 'The watch is kept at night.' : st.services.forge === 'sabotaged' ? 'There is nothing left to guard.' : null),
    apply: (s, _a, _r, emit) => { s.services.forgeWatch = true; s.flags.watched = s.day; emit({ kind: 'action', id: 'keep-watch', cause: 'action:keepWatch', text: 'You sit in the shadow of Bram\'s forge with Wynn, a lantern shuttered at your feet.', visible: true }); },
  },
  buyInfo: {
    by: 'stranger',
    list: (st) => (st.place === 'district' ? [{ type: 'buyInfo' }] : []),
    label: () => 'Pay the hooded stranger for what he knows (10 coins)',
    cost: () => 0,
    coins: () => 10,
    check: (st) => available(st, 'stranger') ?? (st.player.coins < 10 ? 'He wants ten coins.' : st.flags['culprit-known'] ? 'He has told you all he knows.' : null),
    apply: (s, _a, _r, emit) => {
      s.player.coins -= 10;
      if (s.services.forge === 'sabotaged') {
        s.flags['culprit-known'] = 'cassius'; fact(s, 'culprit-named');
        emit({ kind: 'action', id: 'informant-names', cause: 'action:buyInfo', text: 'The stranger pockets the coins: « The man with the pitch drank on House Dree\'s silver. Cassius wanted your blade cold. Tell the watch, if you like. »', visible: true });
      } else {
        fact(s, 'informant-warning');
        emit({ kind: 'action', id: 'informant-warns', cause: 'action:buyInfo', text: (s.competitors.cassius?.relationships.player ?? 0) <= -25 ? '« Someone with a noble\'s purse wants the quay\'s forge cold before your next bout. Guard it at night. »' : '« The pool is quiet, champion. Too quiet. Come back when you have made enemies. »', visible: true });
      }
    },
  },
  report: {
    by: 'hale',
    list: (st) => (st.place === 'district' && st.flags['culprit-known'] && !st.flags.reported ? [{ type: 'report' }] : []),
    label: () => 'Report Cassius Dree to the watch',
    cost: () => 0,
    check: (st) => available(st, 'hale') ?? (!st.flags['culprit-known'] ? 'You do not know who did it.' : st.flags.reported || st.facts.includes('saboteur-caught') ? 'The watch already knows.' : null),
    apply: (s, _a, _r, emit) => {
      s.flags.reported = true; s.tournament.points.cassius -= 3; const c = s.competitors.cassius; if (c) c.reputation = clamp(c.reputation - 20);
      s.player.coins += 15; s.player.reputation = clamp(s.player.reputation + 5); add(s, 'hale', 10);
      emit({ kind: 'consequence', id: 'cassius-sanctioned', cause: 'action:report', text: 'Hale takes your report to the tournament marshals. Cassius Dree is docked three points; the smiths\' guild pays you 15 coins for the forge.', visible: true });
    },
  },
  // ---------------------------------------------------------------- the forecourt: the registrar, the healer, Orla, the rivals
  register: {
    by: 'odo',
    list: (st) => (st.place === 'forecourt' && !st.flags.registered ? [{ type: 'register' }] : []),
    label: () => 'Sign the pool\'s roll',
    cost: () => 0,
    check: (st) => available(st, 'odo') ?? (st.flags.registered ? 'You have signed.' : null),
    apply: (s, _a, _r, emit) => { s.flags.registered = true; s.player.reputation = clamp(s.player.reputation + 2); emit({ kind: 'action', id: 'register', cause: 'action:register', text: `Clerk Odo writes « ${s.player.name} » eighth on the roll of the pool: two bouts, on the second and the third day.`, visible: true }); },
  },
  heal: {
    by: 'anwen',
    list: (st) => (st.place === 'forecourt' ? [{ type: 'heal' }] : []),
    label: (st) => `Let Sister Anwen treat your wounds (${st.flags['free-care'] ? 'free, the Temple pays' : '8 coins'})`,
    cost: () => 1,
    coins: (st) => (st.flags['free-care'] ? 0 : 8),
    check: (st) => available(st, 'anwen') ?? (st.player.injury === 0 ? 'You are not hurt.' : !st.flags['free-care'] && st.player.coins < 8 ? 'You cannot pay the healer (8 coins).' : null),
    apply: (s, _a, _r, emit) => { if (!s.flags['free-care']) s.player.coins -= 8; s.player.injury = 0; emit({ kind: 'action', id: 'heal', cause: 'action:heal', text: 'Sister Anwen cleans and binds your wounds, and makes you sit out the hour. You are whole again.', visible: true }); },
  },
  spar: {
    by: 'orla',
    list: (st) => (st.place === 'forecourt' ? [{ type: 'spar' }] : []),
    label: () => 'Spar with Orla Brask (training, and a friend)',
    cost: () => 1,
    check: (st) => available(st, 'orla') ?? (st.player.training >= 2 ? 'You are as sharp as training can make you before the next bout.' : null),
    apply: (s, _a, _r, emit) => {
      s.player.training++; const o = s.competitors.orla; if (o) o.relationships.player = clamp((o.relationships.player ?? 0) + 15, -100, 100);
      const friend = (o?.relationships.player ?? 0) >= 25;
      if (friend) fact(s, 'orla-recruitable');
      emit({ kind: 'action', id: 'spar', cause: 'action:spar', visible: true, text: friend ? 'You and Orla trade blows until the sand is churned. « When the pool turns to teams, look for me on the quay. »' : 'You spar with Orla on the practice sand. She hits like a falling crate.' });
    },
  },
  scout: {
    by: (a) => a.who,
    list: (st) => (st.place === 'forecourt' ? ['vessa', 'marek'].map((who) => ({ type: 'scout', who })) : []),
    label: (_, a) => `Watch ${RIVALS[a.who].name} train (your next bout against them: their heavy blow shows on the floor)`,
    cost: () => 1,
    check: (st, a) => available(st, a.who) ?? (st.facts.includes(`scouted:${a.who}`) ? `You know ${RIVALS[a.who].name}'s habits.` : null),
    apply: (s, a, _r, emit) => {
      fact(s, `scouted:${a.who}`);
      const c = s.competitors[a.who]; if (c) c.relationships.player = clamp((c.relationships.player ?? 0) + (RIVALS[a.who].temper === 'proud' ? -5 : 2), -100, 100);
      emit({ kind: 'action', id: `scout:${a.who}`, cause: 'action:scout', text: `You watch ${RIVALS[a.who].name} drill for an hour: ${RIVALS[a.who].name === 'Marek Varn' ? 'he winds up his great blow for an age, and rests long after it' : 'her cuts come in strings of three to five, then she breathes'}.`, visible: true });
    },
  },
  // ---------------------------------------------------------------- Lantern Row at night (journal Passe L6): the tavern's talk, House Dree
  listen: {
    by: 'lio',
    list: (st) => (st.place === 'lanterns' ? [{ type: 'listen' }] : []),
    label: () => 'Spend the evening on a tavern bench, listening (the rivals\' habits, some fame)',
    cost: () => 1,
    check: (st) => available(st, 'lio') ?? (st.flags[`listened:${st.day}`] ? 'You have heard tonight\'s talk.' : null),
    apply: (s, _a, _r, emit) => {
      s.flags[`listened:${s.day}`] = true; s.player.reputation = clamp(s.player.reputation + 3); fact(s, 'tavern-talk');
      const hostile = (s.competitors.cassius?.relationships.player ?? 0) <= -25;
      emit({ kind: 'action', id: 'listen', cause: 'action:listen', visible: true, text: hostile
        ? 'Over the third ale a drunk docker brags that House Dree pays well for « a fire, or a fall ». The bench goes quiet when Cassius walks in.'
        : 'The tavern talks of nothing but the pool: Marek rests long after his great blow, Vessa never stops cutting, Rhosk drinks alone. A few raise a cup to you.' });
    },
  },
  taunt: {
    by: 'cassius',
    list: (st) => (st.place === 'lanterns' && !st.flags.taunted ? [{ type: 'taunt' }] : []),
    label: () => 'Mock Cassius Dree before the tavern (fame, and a dangerous enemy)',
    cost: () => 0,
    check: (st) => available(st, 'cassius') ?? (st.flags.taunted ? 'Once was enough.' : null),
    apply: (s, _a, _r, emit) => {
      s.flags.taunted = true; s.player.reputation = clamp(s.player.reputation + 4);
      const c = s.competitors.cassius; if (c) c.relationships.player = clamp((c.relationships.player ?? 0) - 15, -100, 100);
      emit({ kind: 'action', id: 'taunt', cause: 'action:taunt', visible: true, text: 'You toast « the best purse in the pool, and the worst sword ». The tavern roars; Cassius Dree smiles, and does not forget.' });
    },
  },
  confront: {
    by: 'cassius',
    list: (st) => (st.place === 'lanterns' && st.flags['culprit-known'] && !st.flags.confronted ? [{ type: 'confront' }] : []),
    label: () => 'Name Cassius Dree as the forge\'s saboteur, before the whole tavern',
    cost: () => 0,
    check: (st) => available(st, 'cassius') ?? (!st.flags['culprit-known'] ? 'You have no proof.' : st.flags.confronted ? 'He has heard it.' : null),
    apply: (s, _a, _r, emit) => {
      s.flags.confronted = true; s.player.reputation = clamp(s.player.reputation + 5);
      const c = s.competitors.cassius; if (c) c.reputation = clamp(c.reputation - 10);
      emit({ kind: 'consequence', id: 'cassius-shamed', cause: 'action:confront', visible: true, text: 'You name him. The tavern turns its back on Cassius Dree; tomorrow the whole Cité will know who pays for fires.' });
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
