import { Rng, mix32, hashString } from '../core/rng';
import type { GameState, V2State } from './state';
import type { ActionDef } from './actions';
import type { Emit } from './advance';
import { isV2 } from './v2';
import { STAT_CARDS, cardGain, type CardStat } from '../combat/stats';
import { skillName, tx, type TextKey } from '../narrative/text';

/** The winner's card (the operator's CL-2 « Version légère : deux cartes par victoire (stat, niveau de compétence, bourse) », the sheet
 *  https://claude.ai/artifact/3j8cNwctXgmVRB5BHK39td, journal Passe CL1; his note, word for word: « mais a determiner si on se limite que a 2 par victoire ? pk pas + ? »):
 *  after each bout of the tournament the player wins, the game offers a few cards, drawn by the game's seed, and the player takes one (or `picks` of them): a lasting
 *  point of a stat, a level of one of the skills he brings, or the bout's purse again; after a challenge won in town, three cards of stats alone (the operator's CV-3). Nothing here is a talent (CL-1 « Les abandonner : les pièces d’équipement
 *  suffisent »). The numbers of the offer are « proposés », measured in the laboratory (journal Passe CV1: `tools/auto-cards.mjs`).
 *  The state: `V2State.cards` (absent until a bout is won, so a game that never wins one keeps its fingerprint): the offers waiting, oldest first, the cards taken
 *  and the lasting points. An offer waits as long as it must (it blocks nothing; the list Q says it), and the same seed draws the same cards. Pure. */

export type CardKind = 'stat' | 'skill' | 'purse';
/** a card: a lasting point of a stat, a skill of the four a level higher, a purse (coins) */
export type V2Card = { k: 'stat'; stat: CardStat } | { k: 'skill'; skill: string } | { k: 'purse'; coins: number };
/** what a won bout offered: its day, its rival and stage (`pool` for a round of the pool), the cards, and the cards still to take from them */
export interface V2CardOffer { day: number; foe: string; stage: string; cards: V2Card[]; picks: number }
export interface V2Cards { offers: V2CardOffer[]; taken: string[]; stats: Partial<Record<CardStat, number>> }

/** the offer's numbers (« proposés », measured: briefs/combat-auto.md § 45): `offered` the cards drawn after a win, `picks` how many of them the player takes, `purse`
 *  the purse card's coins as a share of the bout's own purse, `levelCap` the level a skill card cannot take a skill beyond (the training's, `TRAIN_CAP`: the levels above
 *  are Master Corvin's lessons), `stages` the bouts that offer (not the final, which no bout follows) */
export const CARD_RULES = {
  offered: 3, picks: 1, purse: 0.5, levelCap: 3,
  /** a challenge won in town offers this many cards of stats alone (the operator's CV-3 « Aussi les défis gagnés en ville », his note « mais uniquement 3 cartes de la famille des
   *  stats », journal Passe CV3): a challenge already gives its own skill and stake */
  challengeOffered: 3,
  stages: ['pool', 'semi', 'gate', 'third', 'gateFinal'] as string[],
};

/** a card's id: what an action names, and what the state keeps of the cards taken */
export const cardId = (c: V2Card): string => (c.k === 'stat' ? `stat:${c.stat}` : c.k === 'skill' ? `skill:${c.skill}` : `purse:${c.coins}`);
/** a card from its id, or null */
export function cardOf(id: string): V2Card | null {
  const [k, v] = id.split(':');
  if (k === 'stat' && (STAT_CARDS as readonly string[]).includes(v)) return { k: 'stat', stat: v as CardStat };
  if (k === 'skill' && /^[a-z0-9_-]{1,32}$/.test(v ?? '')) return { k: 'skill', skill: v };
  if (k === 'purse' && /^\d{1,4}$/.test(v ?? '')) return { k: 'purse', coins: +v };
  return null;
}
const KIND_ORDER: Record<CardKind, number> = { stat: 0, skill: 1, purse: 2 };
/** the cards in the order a page shows them: a stat, a skill, the purse (a second of a kind after the first of each) */
const sortCards = (cs: V2Card[]): V2Card[] => cs.map((c, i) => ({ c, i })).sort((a, b) => KIND_ORDER[a.c.k] - KIND_ORDER[b.c.k] || a.i - b.i).map((x) => x.c);

/** the cards a game holds (a read that creates nothing) */
export const cardsOf = (s: Pick<GameState, 'v2'>): V2Cards | undefined => s.v2?.cards;
/** the lasting points a stat has from cards (src/simulation/v2gear.ts v2Stats adds them) */
export const cardStat = (s: Pick<GameState, 'v2'>, k: string): number => (s.v2?.cards?.stats as Record<string, number> | undefined)?.[k] ?? 0;

/** the skills of the four the player brings that a card can raise: owned, in the loadout, under the card's level cap (the heavy blow and the light attack are no part of
 *  the four) */
export function raisable(s: Pick<GameState, 'v2'>): string[] {
  const k = s.v2?.kit;
  return k ? k.loadout.filter((id) => id !== 'heavy' && id !== 'light' && (k.levels[id] ?? 0) > 0 && (k.levels[id] ?? 0) < CARD_RULES.levelCap) : [];
}
/** a card still has an effect now: a skill card whose skill reached the cap meanwhile has none */
export const cardLive = (s: Pick<GameState, 'v2'>, c: V2Card): boolean => (c.k === 'skill' ? raisable(s).includes(c.skill) : true);
/** the offer the player answers now: the oldest with a card that still has an effect */
export function pendingOffer(s: Pick<GameState, 'v2'>): V2CardOffer | null {
  return (s.v2?.cards?.offers ?? []).find((o) => o.picks > 0 && o.cards.some((c) => cardLive(s, c))) ?? null;
}
/** the number of cards waiting to be taken (the list's count, the hint) */
export const cardsWaiting = (s: Pick<GameState, 'v2'>): number => (s.v2?.cards?.offers ?? []).reduce((n, o) => n + (o.picks > 0 && o.cards.some((c) => cardLive(s, c)) ? 1 : 0), 0);

/** the cards a bout won draws: from the game's seed and its step (a stream of its own: nothing else of the game is drawn from it, so the offer changes no other draw),
 *  one of each kind first in an order the stream shuffles, then a second round of the kinds for more cards than there are kinds; `coins` the purse card's coins (0: none) */
export function drawCards(s: GameState, n: number, coins: number): V2Card[] {
  const rng = new Rng(mix32(mix32(s.seed, s.step), hashString('cards')));
  const pool: Record<CardKind, V2Card[]> = {
    stat: STAT_CARDS.map((stat) => ({ k: 'stat', stat })),
    skill: raisable(s).map((skill) => ({ k: 'skill', skill })),
    purse: coins > 0 ? [{ k: 'purse', coins }] : [],
  };
  const kinds = (['stat', 'skill', 'purse'] as CardKind[]).filter((k) => pool[k].length);
  rng.shuffle(kinds);
  const out: V2Card[] = [];
  while (out.length < n && kinds.some((k) => pool[k].length)) {
    for (const k of kinds) {
      if (out.length >= n) break;
      if (pool[k].length) out.push(pool[k].splice(Math.floor(rng.next() * pool[k].length), 1)[0]);
    }
  }
  return sortCards(out);
}

/** the cards a challenge won in town draws: stat cards alone, `n` of the four stats, by the same stream (a challenge is another step, so another draw) */
export function drawStatCards(s: GameState, n: number): V2Card[] {
  const rng = new Rng(mix32(mix32(s.seed, s.step), hashString('cards')));
  const stats = [...STAT_CARDS];
  rng.shuffle(stats);
  return stats.slice(0, n).sort((a, b) => STAT_CARDS.indexOf(a) - STAT_CARDS.indexOf(b)).map((stat) => ({ k: 'stat' as const, stat }));
}

/** a challenge won in town (the voluntary challenge to a fighter, src/simulation/v2town.ts applyChallenge; not a thief caught, a piece taken by force, a reprisal or an event's
 *  fight): the offer of its stat cards (the operator's CV-3 answer, journal Passe CV3: « Trois cartes de stat, on en prend une »; « Les défis lancés à un combattant »), said in the log */
export function offerChallengeCards(s: GameState, foe: string, emit: Emit): void {
  if (!isV2(s) || !s.v2 || CARD_RULES.challengeOffered <= 0) return;
  const cards = drawStatCards(s, CARD_RULES.challengeOffered);
  if (!cards.length) return;
  const c = (s.v2.cards ??= { offers: [], taken: [], stats: {} });
  c.offers.push({ day: s.day, foe, stage: 'challenge', cards, picks: Math.min(CARD_RULES.picks, cards.length) });
  emit({ kind: 'consequence', id: 'cards:offered', cause: `challenge:${foe}`, visible: true, text: tx(CARD_RULES.picks > 1 ? 'v2.card.offeredN' : 'v2.card.offered', { n: cards.length, picks: Math.min(CARD_RULES.picks, cards.length) }) });
}

/** a bout of the tournament won: the offer waiting for the player's pick (src/tournament/pool.ts applyPlayerDuel); `stage` the bout's (`pool` for a round of the pool) and
 *  `coins` the purse the bout paid. Nothing in today's game, nothing after the final. Said in the log */
export function offerCards(s: GameState, foe: string, stage: string, coins: number, emit: Emit): void {
  if (!isV2(s) || !s.v2 || !CARD_RULES.stages.includes(stage) || CARD_RULES.offered <= 0) return;
  const cards = drawCards(s, CARD_RULES.offered, Math.round(coins * CARD_RULES.purse));
  if (!cards.length) return;
  const c = (s.v2.cards ??= { offers: [], taken: [], stats: {} });
  c.offers.push({ day: s.day, foe, stage, cards, picks: Math.min(CARD_RULES.picks, cards.length) });
  emit({ kind: 'consequence', id: 'cards:offered', cause: `match:${s.day}`, visible: true, text: tx(CARD_RULES.picks > 1 ? 'v2.card.offeredN' : 'v2.card.offered', { n: cards.length, picks: Math.min(CARD_RULES.picks, cards.length) }) });
}

/** the stats' names and the line a stat card says (keys written whole: tests/texts.test.mjs) */
export const CARD_STAT_NAME: Record<CardStat, TextKey> = { atk: 'stat.atk', def: 'stat.def', end: 'stat.end', viv: 'stat.viv' };
const CARD_STAT_LINE: Record<CardStat, TextKey> = { atk: 'v2.card.line.atk', def: 'v2.card.line.def', end: 'v2.card.line.end', viv: 'v2.card.line.viv' };

/** a card's title in words (a tile's, a list's line): `skillName` for a skill, the stat's name for a stat */
export function cardTitle(s: Pick<GameState, 'v2'>, c: V2Card): string {
  if (c.k === 'stat') return tx('v2.card.title.stat', { stat: tx(CARD_STAT_NAME[c.stat]), n: cardGain(c.stat) });
  if (c.k === 'skill') return tx('v2.card.title.skill', { skill: skillName(c.skill), level: (s.v2?.kit.levels[c.skill] ?? 0) + 1 });
  return tx('v2.card.title.purse', { n: c.coins });
}
/** a card's line under its title: what it does */
export function cardLine(s: Pick<GameState, 'v2'>, c: V2Card): string {
  if (c.k === 'stat') return tx(CARD_STAT_LINE[c.stat], { n: cardGain(c.stat) });
  if (c.k === 'skill') return tx('v2.card.line.skill', { skill: skillName(c.skill), from: s.v2?.kit.levels[c.skill] ?? 0, level: (s.v2?.kit.levels[c.skill] ?? 0) + 1 });
  return tx('v2.card.line.purse', { n: c.coins });
}

/** the card taken: its effect on the state and what the log says */
export function applyCard(s: GameState, c: V2Card, emit: Emit): void {
  const v2 = s.v2 as V2State;
  if (c.k === 'stat') {
    const cs = (v2.cards ??= { offers: [], taken: [], stats: {} });
    cs.stats[c.stat] = (cs.stats[c.stat] ?? 0) + cardGain(c.stat);
    emit({ kind: 'action', id: 'cards:stat', cause: 'action:takeCard', visible: true, text: tx('v2.card.took.stat', { stat: tx(CARD_STAT_NAME[c.stat]), n: cardGain(c.stat) }) });
  } else if (c.k === 'skill') {
    v2.kit.levels[c.skill] = Math.min(CARD_RULES.levelCap, (v2.kit.levels[c.skill] ?? 0) + 1);
    emit({ kind: 'action', id: 'cards:skill', cause: 'action:takeCard', visible: true, text: tx('v2.card.took.skill', { skill: skillName(c.skill), level: v2.kit.levels[c.skill] }) });
  } else {
    s.player.coins += c.coins;
    emit({ kind: 'action', id: 'cards:purse', cause: 'action:takeCard', visible: true, text: tx('v2.card.took.purse', { n: c.coins }) });
  }
}

export type V2CardAction = { type: 'takeCard'; card: string };

/** the card actions: one line per card of the offer waiting, no slot (a minor action: the card is taken where the player stands, the result page's or the list's) */
export const V2_CARD_ACTIONS: { [K in V2CardAction['type']]: ActionDef<Extract<V2CardAction, { type: K }>> } = {
  takeCard: {
    list: (s) => (isV2(s) ? (pendingOffer(s)?.cards.filter((c) => cardLive(s, c)).map((c) => ({ type: 'takeCard' as const, card: cardId(c) })) ?? []) : []),
    label: (s, a) => { const c = cardOf(a.card); return c ? tx('v2.card.label', { card: cardTitle(s, c) }) : a.card; },
    cost: () => 0,
    check: (s, a) => {
      if (!isV2(s)) return tx('v2.only');
      const o = pendingOffer(s), c = cardOf(a.card);
      if (!o) return tx('v2.card.none');
      if (!c || !o.cards.some((x) => cardId(x) === a.card)) return tx('v2.card.notOffered');
      return cardLive(s, c) ? null : tx('v2.card.maxed', { skill: c.k === 'skill' ? skillName(c.skill) : '', cap: CARD_RULES.levelCap });
    },
    apply: (s, a, _r, emit) => {
      const o = pendingOffer(s)!, c = cardOf(a.card)!;
      applyCard(s, c, emit);
      const cs = (s.v2!.cards ??= { offers: [], taken: [], stats: {} });
      cs.taken.push(a.card);
      o.cards = o.cards.filter((x) => cardId(x) !== a.card);
      o.picks--;
      // an offer with nothing left to take, or nothing that still has an effect, is over
      cs.offers = cs.offers.filter((x) => x.picks > 0 && x.cards.some((y) => cardLive(s, y)));
    },
  },
};
