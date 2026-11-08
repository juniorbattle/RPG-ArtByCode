import type { GameState } from './state';
import { isV2 } from './v2';
import { lookOf } from './look';
import { marksOf, LAW } from './v2law';
import { PLAZA_CROWD, PLAZA_OF } from './v2places';
import { stanceOf } from './v2rivals';
import { nextOpponent } from './v2intel';
import { playerMatch } from '../tournament/pool';
import { pendingFinal } from '../tournament/v2calendar';
import { PLAYER_ID, RIVALS } from '../narrative/roster';
import { tx, type TextKey } from '../narrative/text';

/** The town that reacts (lot L5 of step 5; the operator's choice EV-12 « Les places lisent le pouls, la célébrité compte », journal Passe EV2, its recommendation
 *  word for word: « Les places lisent le pouls comme le quai (la foule, les fanions, une boutique aux volets fermés). La célébrité change ce que disent les passants
 *  et qui salue le héros, et un garde se poste à l’étal le jour d’un vol. Tout cela avec les sprites et les décors déjà approuvés : rien de neuf sans fiche. »).
 *  Three readings of the state, each seen on the pages with the sprites the town already shows:
 *  - the squares' crowd follows the tournament's excitement as the quay's does (src/simulation/look.ts townQuery), and gathers where the town's ambiences are,
 *    which lot L4 took out of the news (EV-8): the forecourt on an afternoon of bouts (the Colosseum's roar), the festival square on the night market's evenings
 *    and the parade's (`plazaCrowd`);
 *  - the player's fame (the pulse's `playerFame`, which nothing read: the audit, `briefs/audit-gameplay-ev1.md` § 2) sets who greets the hero in passing and what
 *    they say, by the day's news (a bout won, a bout ahead, the final); before a bout of the player's, the public's pressure (`publicPressure`) is said too;
 *    Sergeant Hale's marks come first: a name in his ledger is whispered about, a wanted one avoided (`hailOf`);
 *  - a rival standing on a square shows its stance toward the player (lot L4, `stanceOf`): a friend raises a hand, a beaten rival who respects the player
 *    nods, one who holds a grudge turns away (`gestureOf`).
 *  The watch posted at a robbed stall: src/simulation/v2watch.ts. Nothing here changes the state: the pages read it. Every number and text is « proposé ». Pure. */

// ------------------------------------------------------------------------------------------------ the squares read the pulse

/** the bounds of a square's crowd: a square is smaller than the quay, and its points hold groups (src/world/Plazas.ts PLAZA_GATHER) */
export const PLAZA_CROWD_MIN = 2, PLAZA_CROWD_MAX = 15;
/** what the town's ambiences add where they are: the Colosseum's roar on the forecourt, the night market and the parade on the festival square */
export const GATHER = { roar: 3, market: 3, parade: 4 } as const;

/** what gathers a square's crowd now, if anything (said by the pages' proofs and the tests) */
export function gatheringOf(s: GameState): keyof typeof GATHER | null {
  const kind = PLAZA_OF[s.place];
  if (kind === 'forecourt' && s.slot === 'afternoon' && s.tournament.matches.some((m) => m.day === s.day)) return 'roar';
  if (kind === 'festival' && s.slot === 'evening' && s.day === 9) return 'parade';
  // the night market opens as the sun goes down (src/events/catalog.ts night-market, read at the end of the afternoon: its log entry is today's)
  if (kind === 'festival' && s.slot === 'evening' && s.log.some((e) => e.id === 'night-market' && e.day === s.day)) return 'market';
  return null;
}

/** a square's crowd: the moment's count (src/simulation/v2places.ts PLAZA_CROWD) moved by the excitement as the quay's (a walker each 12 points from 60), and what
 *  gathers it */
export function plazaCrowd(s: GameState): number {
  const g = gatheringOf(s);
  const n = PLAZA_CROWD[lookOf(s)] + Math.round((s.pulse.excitement - 60) / 12) + (g ? GATHER[g] : 0);
  return Math.max(PLAZA_CROWD_MIN, Math.min(PLAZA_CROWD_MAX, n));
}

// ------------------------------------------------------------------------------------------------ the fame: who greets the hero, and what they say

export type FameTier = 'unknown' | 'noticed' | 'known' | 'celebrated';
/** the fame from which the passers-by notice the player, know them, celebrate them (the pulse's playerFame: the reputation and what the events added; a
 *  prepared player ends the ten days between 60 and 100, journal Passe EVL9) */
export const FAME = { noticed: 25, known: 55, celebrated: 80 } as const;
export function fameTier(s: Pick<GameState, 'pulse'>): FameTier {
  const f = s.pulse.playerFame;
  return f >= FAME.celebrated ? 'celebrated' : f >= FAME.known ? 'known' : f >= FAME.noticed ? 'noticed' : 'unknown';
}
/** one walker in how many greets, by the fame (0: none) */
export const GREET_EVERY: Record<FameTier, number> = { unknown: 0, noticed: 4, known: 2, celebrated: 1 };
/** a name in Sergeant Hale's ledger: one walker in three whispers; a wanted one (three marks): everyone steps aside, one in three says why */
export const WARY_EVERY = 3;
/** the public's pressure from which a passer-by says the bets on a bout day */
export const PRESSURE_SAID = 60;

export type HailKind = 'hail' | 'whisper' | 'avoid';
export interface Hail { kind: HailKind; text: string }

const pick = (keys: readonly TextKey[], k: number) => keys[k % keys.length];

/** the player's bout fought today or yesterday: its foe and whether it was won */
function lastBout(s: GameState): { foe: string; won: boolean } | null {
  const m = [...s.tournament.matches].reverse().find((x) => x.winner && (x.a === PLAYER_ID || x.b === PLAYER_ID) && x.day >= s.day - 1 && x.day <= s.day);
  return m ? { foe: RIVALS[m.a === PLAYER_ID ? m.b : m.a]?.name ?? '', won: m.winner === PLAYER_ID } : null;
}

/** what the k-th walker of a page does as the hero passes (k: its order on the page), or null: nothing; its words the n-th of the page's greetings (two walkers
 *  side by side never say the same words in turn). Pure and fixed for a state, a walker and its turn. */
export function hailOf(s: GameState, k: number, n = 0): Hail | null {
  if (!isV2(s)) return null;
  const marks = marksOf(s), name = s.player.name;
  // a wanted name: the passers-by step aside (one in three says why); a name in the ledger: one in three whispers, the others go by
  if (marks >= LAW.wanted) return { kind: 'avoid', text: k % WARY_EVERY === 0 ? tx(pick(['v2.hail.avoid1', 'v2.hail.avoid2'], n)) : '' };
  if (marks > 0) return k % WARY_EVERY === 0 ? { kind: 'whisper', text: tx(pick(['v2.hail.whisper1', 'v2.hail.whisper2'], n)) } : null;
  const every = GREET_EVERY[fameTier(s)];
  if (!every || k % every !== 0) return null;
  const j = n, crowned = s.flags.champion === PLAYER_ID, b = lastBout(s), today = playerMatch(s), fin = pendingFinal(s);
  const vars = { name, foe: b?.foe ?? '', next: RIVALS[nextOpponent(s) ?? '']?.name ?? '' };
  let keys: readonly TextKey[];
  if (crowned) keys = ['v2.hail.champion1', 'v2.hail.champion2'];
  else if (today && !today.winner && s.slot !== 'evening') keys = s.pulse.publicPressure >= PRESSURE_SAID ? ['v2.hail.boutToday', 'v2.hail.bets'] : ['v2.hail.boutToday', 'v2.hail.boutToday2'];
  else if (b) keys = b.won ? ['v2.hail.won1', 'v2.hail.won2'] : ['v2.hail.lost1', 'v2.hail.lost2'];
  else if (fin || stageOfNext(s) === 'final') keys = ['v2.hail.final1', 'v2.hail.final2'];
  else if (playerMatch(s, s.day + 1)) keys = ['v2.hail.tomorrow1', 'v2.hail.tomorrow2'];
  else keys = TIER_HAILS[fameTier(s) as Exclude<FameTier, 'unknown'>];
  return { kind: 'hail', text: tx(pick(keys, j), vars) };
}
const TIER_HAILS: Record<Exclude<FameTier, 'unknown'>, readonly TextKey[]> = {
  noticed: ['v2.hail.noticed1', 'v2.hail.noticed2'], known: ['v2.hail.known1', 'v2.hail.known2'], celebrated: ['v2.hail.celebrated1', 'v2.hail.celebrated2'],
};
const stageOfNext = (s: GameState) => s.tournament.matches.find((x) => x.day >= s.day && !x.winner && (x.a === PLAYER_ID || x.b === PLAYER_ID))?.stage ?? null;

// ------------------------------------------------------------------------------------------------ the rivals on the squares: their stance seen

export type GestureKind = 'hail' | 'nod' | 'turn';
export interface Gesture { kind: GestureKind; text: string }
const GESTURE: Record<NonNullable<ReturnType<typeof stanceOf>>, [GestureKind, TextKey]> = {
  friend: ['hail', 'v2.gesture.friend'], respect: ['nod', 'v2.gesture.respect'], grudge: ['turn', 'v2.gesture.grudge'],
};
/** what a rival standing on a square does as the hero passes: its stance toward the player, seen (lot L4), or null */
export function gestureOf(s: GameState, who: string): Gesture | null {
  const st = isV2(s) ? stanceOf(s, who) : null;
  if (!st) return null;
  const [kind, key] = GESTURE[st];
  return { kind, text: tx(key, { name: RIVALS[who].name }) };
}
