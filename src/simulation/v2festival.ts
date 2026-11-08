import { clamp, type GameState, type SlotId } from './state';
import type { ActionDef } from './actions';
import type { Emit } from './advance';
import { isV2 } from './v2';
import { available } from './roles';
import { fameTier, FAME, type FameTier } from './v2react';
import { marksOf, LAW } from './v2law';
import { FRIENDSHIP } from './v2rivals';
import { PLAYER_ID, RIVALS } from '../narrative/roster';
import { PEOPLE } from '../narrative/people';
import { tx, type TextKey } from '../narrative/text';

/** The version 2's festival (lot L6; the operator's EV-14 « Un festival le jour 9, conçu sur une fiche à part », and the festival's design sheet, journal Passe EVL11,
 *  nine of nine at the recommendation: FE-1 « La Lanterne de Tête » ... FE-9). The Cité's custom: on the eve of the final each of the eight fighters leads a cortege,
 *  and every person of the town carries a lantern behind the one they honour; the longest cortege opens the parade. One lantern, one person, with a reason said by
 *  that person and on the tournament's board (T): nothing hidden.
 *  - the crowd follows a fighter's renown (FE-2), at the greetings' tiers of lot L5: unknown none, noticed 3, known 6, celebrated 12 (the player's fame; a rival's
 *    reputation); one or two marks in Sergeant Hale's ledger send half the player's crowd away, wanted none;
 *  - the town's people one by one (FE-2, FE-4), each walking behind a rival they honour (Master Corvin and Sergeant Brann behind last year's champion, Sister Anwen
 *    and Brother Ambrose behind the Temple's knight, Tam and Bram behind the docks' own, Lio behind Vessa if she paid his room for her tale, Pip behind Tobin), or
 *    behind nobody, unless a reason to honour the player exists, a reason the game already shows (a keeper's regular, the cargo, the forge rebuilt, justice for
 *    Lady Edda's son, the hauberk, Marek beaten, a fighter beaten on the sand);
 *  - House Dree buys Cassius six lanterns, which go out once he is unmasked before the town; Rhosk walks alone;
 *  - three good turns on the festival square on day 9 (FE-3): the hall's lanterns hung in the morning (a slot), Brother Ambrose's flame carried in the afternoon (a
 *    slot), a round at Lio's (10 coins); each brings three lanterns;
 *  - the player may walk behind another rival instead (FE-6, the operator's L4-6 « Laisser ainsi » answered at the festival): the player's cortege joins theirs, the
 *    rival becomes a friend, the town remembers (+3 reputation), and the purse is given up;
 *  - at dusk (the end of day 9's afternoon) the parade's order is set; the one who opens it wins the Lanterns' Purse, 30 coins, +5 reputation, +10 fame, and a verse
 *    in Wren's song (FE-5); a rival who opens it gains the reputation;
 *  - the parade fills the way between the festival square and the forecourt that evening (FE-7); it is played live at dusk (FE-8, src/narrative/v2story.ts).
 *  Every number and text is « proposé ». Pure. */

export const FESTIVAL_DAY = 9;
/** the crowd's lanterns by a fighter's renown (the greetings' tiers of lot L5, src/simulation/v2react.ts FAME) */
export const CROWD_LANTERNS: Record<FameTier, number> = { unknown: 0, noticed: 3, known: 6, celebrated: 12 };
/** what each good turn brings, a round's price, House Dree's bought lanterns, the Lanterns' Purse and its fame and reputation, the town's thanks for a gift */
export const FEST = { deed: 3, round: 10, bought: 6, purse: 30, rep: 5, fame: 10, gift: 3, regular: 15, friendOfHouse: 10 } as const;

/** a renown's tier: the player's fame or a rival's reputation, at the same thresholds */
export const tierOf = (n: number): FameTier => (n >= FAME.celebrated ? 'celebrated' : n >= FAME.known ? 'known' : n >= FAME.noticed ? 'noticed' : 'unknown');

export type Deed = 'hang' | 'flame' | 'round';
/** the three good turns (FE-3): when, offered by whom, what they take */
export const DEEDS: Record<Deed, { slots: readonly SlotId[]; by: string; slot: number; coins: number }> = {
  hang: { slots: ['morning'], by: 'kell', slot: 1, coins: 0 },
  flame: { slots: ['afternoon'], by: 'ambrose', slot: 1, coins: 0 },
  round: { slots: ['morning', 'afternoon'], by: 'lio', slot: 0, coins: FEST.round },
};

/** the festival's state in a version 2 game: the good turns done, the rival the player walks behind, and once the parade's order is set at dusk, its leader and every
 *  cortege's lanterns */
export interface V2Festival { deeds?: Deed[]; behind?: string; leader?: string; lanterns?: Record<string, number> }

// ------------------------------------------------------------------------------------------------ the lanterns

/** one lantern or a group of them: who carries it (a person of the town, or null for the crowd, the porters, the pilgrims, Lio's regulars, House Dree's hirelings),
 *  how many, and why */
export interface Lantern { who: string | null; n: number; why: TextKey }

const goodwill = (s: GameState, who: string) => s.town[who] ?? 0;
const deed = (s: GameState, d: Deed) => !!s.v2?.festival?.deeds?.includes(d);
const hauberk = (s: GameState) => s.v2?.gear?.armour === 'knight-hauberk' || !!s.v2?.gear?.bag.includes('knight-hauberk');
const beatOnSand = (s: GameState, who: string) => s.log.some((e) => e.id === 'challenge:won' && e.cause === `challenge:${who}`);
const beatMarek = (s: GameState) => s.tournament.matches.some((m) => m.winner === PLAYER_ID && (m.a === 'marek' || m.b === 'marek')) || beatOnSand(s, 'marek');
/** justice for Lady Edda's son (lot L3): Cassius reported for a strap cut */
const justice = (s: GameState) => !!s.flags.reported && s.flags['culprit-known'] === 'cassius' && ['tamper-found', 'tamper-foiled', 'tamper-suffered'].some((f) => s.facts.includes(f));

/** how Cassius was unmasked before the town, the last way first: shamed on the festival square, reported to Hale, his man caught at the forge (null: not before the
 *  town; the culprit known to the player alone, by the stranger, Lady Edda or Odo's button, is no scandal yet) (lot L6: the scene `unmasked`, the bought lanterns) */
export function unmaskedHow(s: GameState): 'confronted' | 'reported' | 'caught' | null {
  return s.flags.confronted ? 'confronted' : s.flags.reported && s.flags['culprit-known'] === 'cassius' ? 'reported' : s.facts.includes('saboteur-caught') ? 'caught' : null;
}

/** the town's people (FE-2, FE-4): whom each honours, and the reason that would send their lantern behind the player (said by them and on the board) */
export const BEARERS: ReadonlyArray<{ who: string; rival: (s: GameState) => string | null; whyRival?: TextKey; you: (s: GameState) => boolean; whyYou: TextKey }> = [
  { who: 'corvin', rival: () => 'marek', whyRival: 'v2.fest.why.champion', you: (s) => goodwill(s, 'corvin') >= FEST.regular, whyYou: 'v2.fest.why.pupil' },
  { who: 'drill', rival: () => 'marek', whyRival: 'v2.fest.why.champion', you: () => false, whyYou: 'v2.fest.why.never' },
  { who: 'anwen', rival: () => 'ilse', whyRival: 'v2.fest.why.temple', you: () => false, whyYou: 'v2.fest.why.never' },
  { who: 'ambrose', rival: () => 'ilse', whyRival: 'v2.fest.why.temple', you: (s) => deed(s, 'flame'), whyYou: 'v2.fest.why.flame' },
  { who: 'tam', rival: () => 'orla', whyRival: 'v2.fest.why.docks', you: (s) => s.quests.cargo === 'delivered' || s.quests.cargo === 'done', whyYou: 'v2.fest.why.cargo' },
  { who: 'bram', rival: () => 'orla', whyRival: 'v2.fest.why.docks', you: (s) => s.services.forge === 'repaired', whyYou: 'v2.fest.why.forge' },
  { who: 'lio', rival: (s) => (s.v2?.lie ? 'vessa' : null), whyRival: 'v2.fest.why.paid', you: (s) => goodwill(s, 'lio') >= FEST.friendOfHouse || deed(s, 'round'), whyYou: 'v2.fest.why.house' },
  { who: 'pip', rival: () => 'tobin', whyRival: 'v2.fest.why.hopeful', you: (s) => goodwill(s, 'pip') >= FEST.regular, whyYou: 'v2.fest.why.regular' },
  { who: 'mara', rival: () => null, you: (s) => goodwill(s, 'mara') >= FEST.regular, whyYou: 'v2.fest.why.regular' },
  { who: 'hilde', rival: () => null, you: (s) => goodwill(s, 'hilde') >= FEST.regular, whyYou: 'v2.fest.why.regular' },
  { who: 'edda', rival: () => null, you: (s) => justice(s) || hauberk(s), whyYou: 'v2.fest.why.edda' },
  { who: 'aldric', rival: () => null, you: hauberk, whyYou: 'v2.fest.why.hauberk' },
  { who: 'lucan', rival: () => null, you: beatMarek, whyYou: 'v2.fest.why.marek' },
  { who: 'kell', rival: () => null, you: (s) => beatOnSand(s, 'kell'), whyYou: 'v2.fest.why.sand' },
  { who: 'piers', rival: () => null, you: (s) => beatOnSand(s, 'piers'), whyYou: 'v2.fest.why.sand' },
  { who: 'corra', rival: () => null, you: (s) => beatOnSand(s, 'corra'), whyYou: 'v2.fest.why.sand' },
];

/** whom a person of the town walks behind tonight (null: nobody), and why */
export function bearerOf(s: GameState, who: string): { behind: string | null; why: TextKey | null } {
  const b = BEARERS.find((x) => x.who === who);
  if (!b) return { behind: null, why: null };
  if (b.you(s)) return { behind: PLAYER_ID, why: b.whyYou };
  const r = b.rival(s);
  return r ? { behind: r, why: b.whyRival ?? null } : { behind: null, why: null };
}

/** the eight fighters, the player first */
export const FIGHTERS = (): string[] => [PLAYER_ID, ...Object.keys(RIVALS)];

/** every fighter's own cortege tonight, before the player's gift (FE-6): the crowd, the town's people, the good turns, House Dree's purse */
function ownCorteges(s: GameState): Record<string, Lantern[]> {
  const out: Record<string, Lantern[]> = Object.fromEntries(FIGHTERS().map((id) => [id, [] as Lantern[]]));
  // the crowd, by renown; Sergeant Hale's ledger first for the player
  const marks = marksOf(s), mine = CROWD_LANTERNS[fameTier(s)];
  const crowd = marks >= LAW.wanted ? 0 : marks > 0 ? Math.floor(mine / 2) : mine;
  if (crowd) out[PLAYER_ID].push({ who: null, n: crowd, why: marks > 0 ? 'v2.fest.why.crowdWary' : 'v2.fest.why.crowd' });
  for (const id of Object.keys(RIVALS)) { const n = CROWD_LANTERNS[tierOf(s.competitors[id]?.reputation ?? 0)]; if (n) out[id].push({ who: null, n, why: 'v2.fest.why.crowd' }); }
  // the town's people, one by one
  for (const b of BEARERS) { const { behind, why } = bearerOf(s, b.who); if (behind && why) out[behind].push({ who: b.who, n: 1, why }); }
  // the good turns' own groups: the hall's porters, two pilgrims with Brother Ambrose, two of Lio's regulars with him
  if (deed(s, 'hang')) out[PLAYER_ID].push({ who: null, n: FEST.deed, why: 'v2.fest.why.porters' });
  if (deed(s, 'flame')) out[PLAYER_ID].push({ who: null, n: FEST.deed - 1, why: 'v2.fest.why.pilgrims' });
  if (deed(s, 'round')) out[PLAYER_ID].push({ who: null, n: FEST.deed - 1, why: 'v2.fest.why.regulars' });
  // House Dree's purse, out once Cassius is unmasked before the town
  if (!unmaskedHow(s)) out.cassius.push({ who: null, n: FEST.bought, why: 'v2.fest.why.bought' });
  return out;
}

const count = (ls: Lantern[]) => ls.reduce((n, l) => n + l.n, 0);

/** tonight's corteges as they stand (the player's joined to the rival they walk behind, FE-6), each with its lanterns and their reasons */
export function corteges(s: GameState): Record<string, Lantern[]> {
  const out = ownCorteges(s), behind = s.v2?.festival?.behind;
  if (behind && out[behind]) { out[behind] = [...out[behind], ...out[PLAYER_ID].map((l) => ({ ...l }))]; out[PLAYER_ID] = []; }
  return out;
}

/** the parade's order: the most lanterns first; equal, the greater renown (the player's fame, a rival's reputation), then the roster's order */
export function paradeOrder(s: GameState): Array<{ id: string; n: number }> {
  const c = corteges(s), renown = (id: string) => (id === PLAYER_ID ? s.pulse.playerFame : s.competitors[id]?.reputation ?? 0), ids = FIGHTERS();
  return ids.map((id) => ({ id, n: count(c[id]) })).sort((a, b) => b.n - a.n || renown(b.id) - renown(a.id) || ids.indexOf(a.id) - ids.indexOf(b.id));
}

/** the lanterns a good turn would add to the player's cortege now (a round when Lio already walks behind the player brings his two regulars only) */
export function deedGain(s: GameState, d: Deed): number {
  if (deed(s, d)) return 0;
  const after = structuredClone(s); ((after.v2!.festival ??= {}).deeds ??= []).push(d);
  return count(ownCorteges(after)[PLAYER_ID]) - count(ownCorteges(s)[PLAYER_ID]);
}

/** the festival's day, before the parade's order is set */
export const festivalOn = (s: GameState): boolean => isV2(s) && s.day === FESTIVAL_DAY && s.slot !== 'evening' && !s.v2?.festival?.leader;

// ------------------------------------------------------------------------------------------------ dusk: the parade's order

/** the end of day 9's afternoon: the parade's order is set, the leader rewarded, a rival walked behind made a friend */
export function festivalDusk(s: GameState, emit: Emit): void {
  if (!isV2(s) || !s.v2 || s.day !== FESTIVAL_DAY || s.v2.festival?.leader) return;
  const order = paradeOrder(s), leader = order[0].id, f = (s.v2.festival ??= {});
  f.leader = leader; f.lanterns = Object.fromEntries(order.map((o) => [o.id, o.n]));
  const behind = f.behind;
  if (behind) {
    const c = s.competitors[behind]; if (c) c.relationships[PLAYER_ID] = clamp(Math.max((c.relationships[PLAYER_ID] ?? 0) + FRIENDSHIP, FRIENDSHIP), -100, 100);
    s.player.reputation = clamp(s.player.reputation + FEST.gift);
  }
  if (leader === PLAYER_ID) {
    s.player.coins += FEST.purse; s.player.reputation = clamp(s.player.reputation + FEST.rep);
    s.flags['pulse:playerFame'] = ((s.flags['pulse:playerFame'] as number) ?? 0) + FEST.fame;
  } else { const c = s.competitors[leader]; if (c) c.reputation = clamp(c.reputation + FEST.rep); }
  const n = order[0].n, name = leader === PLAYER_ID ? s.player.name : RIVALS[leader].name;
  emit({ kind: 'event', id: 'v2-lantern-lead', cause: tx('v2.fest.cause'), visible: true, text: leader === PLAYER_ID
    ? tx('v2.fest.lead.you', { n, purse: FEST.purse })
    : behind === leader ? tx('v2.fest.lead.gift', { name, n }) : tx('v2.fest.lead.rival', { name, n }) });
  if (behind && behind !== leader) emit({ kind: 'consequence', id: 'v2-lantern-gift', cause: tx('v2.fest.cause'), visible: true, text: tx('v2.fest.gift', { name: RIVALS[behind].name }) });
}

/** the parade fills the way between the festival square and the forecourt on its evening (FE-7) */
export function paradeBlocks(s: GameState, to: string): boolean {
  return isV2(s) && s.day === FESTIVAL_DAY && s.slot === 'evening' && ((s.place === 'lanterns' && to === 'forecourt') || (s.place === 'forecourt' && to === 'lanterns'));
}

// ------------------------------------------------------------------------------------------------ what people say, what the board reads

/** a person's word on the festival's day: whom their lantern walks behind tonight and why (null: nothing to say) */
export function festivalWords(s: GameState, who: string): string | null {
  if (!festivalOn(s)) return null;
  // Wren tells the custom; a rival says how long their cortege is
  if (who === 'bard') return tx('v2.fest.wren', { purse: FEST.purse });
  if (RIVALS[who]) {
    if (s.v2?.festival?.behind === who) return tx('v2.fest.rivalGift', { name: s.player.name });
    const n = count(corteges(s)[who]);
    return tx(who === 'rhosk' ? 'v2.fest.rivalAlone' : 'v2.fest.rivalCount', { n });
  }
  const b = BEARERS.find((x) => x.who === who);
  if (!b) return null;
  const { behind, why } = bearerOf(s, who);
  if (behind === PLAYER_ID) return tx('v2.fest.walksYou', { why: tx(why!) });
  // what would send the lantern behind the player, said by the person (Sergeant Brann and Sister Anwen: nothing)
  const unless = b.whyYou === 'v2.fest.why.never' ? tx('v2.fest.why.never') : tx('v2.fest.unless', { why: tx(b.whyYou) });
  if (behind) return tx('v2.fest.walksRival', { name: RIVALS[behind].name, why: tx(why!), unless });
  return tx('v2.fest.walksNone', { unless });
}

/** the board's line for a fighter (T) on the festival's day and after: tonight's lanterns and their reasons, or the parade's result */
export function festivalLine(s: GameState, id: string): string | null {
  if (!isV2(s) || s.day < FESTIVAL_DAY) return null;
  const f = s.v2?.festival, name = id === PLAYER_ID ? s.player.name : RIVALS[id]?.name ?? id;
  if (f?.leader) {
    const n = f.lanterns?.[id] ?? 0;
    if (id === PLAYER_ID && f.behind) return tx('v2.fest.board.gave', { name: RIVALS[f.behind].name });
    return f.leader === id ? tx('v2.fest.board.led', { n }) : tx('v2.fest.board.walked', { n });
  }
  if (s.day !== FESTIVAL_DAY) return null;
  if (id === PLAYER_ID && f?.behind) return tx('v2.fest.board.behind', { name: RIVALS[f.behind].name });
  const ls = corteges(s)[id] ?? [], n = count(ls);
  if (!n) return tx('v2.fest.board.none', { name });
  const parts = ls.map((l) => (l.who ? tx('v2.fest.board.person', { name: PEOPLE[l.who]?.name ?? l.who, why: tx(l.why) }) : tx('v2.fest.board.group', { n: l.n, why: tx(l.why) })));
  return tx('v2.fest.board.tonight', { n, list: parts.join('; ') });
}

// ------------------------------------------------------------------------------------------------ the actions

export type V2FestivalAction = { type: 'festDeed'; deed: Deed } | { type: 'walkBehind'; who: string } | { type: 'walkOwn'; who: string };

/** the rivals the player may walk behind (all but Cassius, FE-6) */
export const GIFTABLE = (): string[] => Object.keys(RIVALS).filter((id) => id !== 'cassius');

const DEED_LABEL: Record<Deed, TextKey> = { hang: 'v2.fest.deed.hang', flame: 'v2.fest.deed.flame', round: 'v2.fest.deed.round' };
const DEED_LOG: Record<Deed, TextKey> = { hang: 'v2.fest.deedLog.hang', flame: 'v2.fest.deedLog.flame', round: 'v2.fest.deedLog.round' };

export const V2_FESTIVAL_ACTIONS: { [K in V2FestivalAction['type']]: ActionDef<Extract<V2FestivalAction, { type: K }>> & { by: string | ((a: Extract<V2FestivalAction, { type: K }>) => string) } } = {
  festDeed: {
    by: (a) => DEEDS[a.deed].by,
    list: (s) => (festivalOn(s) && s.place === 'lanterns' ? (Object.keys(DEEDS) as Deed[]).filter((d) => DEEDS[d].slots.includes(s.slot)).map((d) => ({ type: 'festDeed', deed: d })) : []),
    label: (s, a) => tx(DEED_LABEL[a.deed], { n: deedGain(s, a.deed) }),
    cost: (_s, a) => DEEDS[a.deed].slot,
    coins: (_s, a) => DEEDS[a.deed].coins,
    check: (s, a) => (!isV2(s) ? tx('v2.only') : !festivalOn(s) ? tx('v2.fest.notToday') : !DEEDS[a.deed].slots.includes(s.slot) ? tx('v2.fest.notNow') : available(s, DEEDS[a.deed].by)
      ?? (deed(s, a.deed) ? tx('v2.fest.done') : s.player.coins < DEEDS[a.deed].coins ? tx('v2.fest.poor', { n: DEEDS[a.deed].coins }) : null)),
    apply: (s, a, _r, emit) => {
      const n = deedGain(s, a.deed);
      ((s.v2!.festival ??= {}).deeds ??= []).push(a.deed);
      s.player.coins -= DEEDS[a.deed].coins;
      emit({ kind: 'action', id: `fest:${a.deed}`, cause: 'action:festDeed', visible: true, text: tx(DEED_LOG[a.deed], { n }) });
    },
  },
  // FE-6: told to the rival in person, on the festival's day
  walkBehind: {
    by: (a) => a.who,
    list: (s) => (festivalOn(s) ? GIFTABLE().filter((id) => PEOPLE[id] && s.v2?.festival?.behind !== id && !available(s, id)).map((id) => ({ type: 'walkBehind', who: id })) : []),
    label: (_s, a) => tx('v2.fest.behindLabel', { name: RIVALS[a.who].name }),
    cost: () => 0,
    check: (s, a) => (!isV2(s) ? tx('v2.only') : !festivalOn(s) ? tx('v2.fest.notToday') : !GIFTABLE().includes(a.who) ? tx('v2.fest.notHim') : available(s, a.who) ?? (s.v2?.festival?.behind === a.who ? tx('v2.fest.already') : null)),
    apply: (s, a, _r, emit) => {
      (s.v2!.festival ??= {}).behind = a.who;
      emit({ kind: 'action', id: 'fest:behind', cause: 'action:walkBehind', visible: true, text: tx('v2.fest.behindLog', { name: RIVALS[a.who].name, n: count(corteges(s)[a.who]) }) });
    },
  },
  walkOwn: {
    // told to the same rival
    by: (a) => a.who,
    list: (s) => { const b = s.v2?.festival?.behind; return festivalOn(s) && b && !available(s, b) ? [{ type: 'walkOwn', who: b }] : []; },
    label: (_s, a) => tx('v2.fest.ownLabel', { name: RIVALS[a.who]?.name ?? '' }),
    cost: () => 0,
    check: (s, a) => (!isV2(s) ? tx('v2.only') : !festivalOn(s) ? tx('v2.fest.notToday') : s.v2?.festival?.behind !== a.who ? tx('v2.fest.own') : available(s, a.who)),
    apply: (s, _a, _r, emit) => { delete s.v2!.festival!.behind; emit({ kind: 'action', id: 'fest:own', cause: 'action:walkOwn', visible: true, text: tx('v2.fest.ownLog') }); },
  },
};
