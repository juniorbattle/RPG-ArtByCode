import type { Rng } from '../core/rng';
import type { GameState, V2Rumour } from './state';
import type { ActionDef } from './actions';
import { isV2 } from './v2';
import { available } from './roles';
import { PLAYER_ID, RIVALS } from '../narrative/roster';
import { tx, type TextKey } from '../narrative/text';

/** The version 2's information and the sabotage's answers (lot L3; the operator's EV-11 « Observer tout adversaire, rumeurs, activité lisible » and EV-10
 *  « Une réponse par lieu, un effet lisible », journal Passe EV2; the audit's §§ 2-3, `briefs/audit-gameplay-ev1.md`). Three tiers of what the player can
 *  know of a rival, each at a place and an hour, each with its price:
 *  - free, on the tournament's board (T): what the town saw them do since yesterday, their public acts (drilling, buying gear, resting, drinking with
 *    another); their secret acts (watching the player, meeting a hood) are never seen there (`seenInTown`);
 *  - a few coins, a rumour of the next opponent: their health and their form (how hard they will hit: their preparation), from Lio's room on the festival
 *    square at any hour (3 coins, right two times in three: a room repeats what it hears), or from the hooded stranger on the quay at night (8 coins,
 *    never wrong, and he tells the secret acts too) (`rumour`);
 *  - a slot, watching them practise where they train (src/simulation/roles.ts `scout`, every rival of the pool in a version 2 game): their skills on the
 *    match sheet.
 *  And the second place Cassius reaches: the arena's lockers have their own answer, Clerk Odo's strongroom on the eve of a bout (`lockGear`, 5 coins), the
 *  quay's paid watch guarding the forge alone (src/events/v2catalog.ts); a strap cut and not stitched is said on the match sheet (`strapCut`) and found
 *  after the bout. Every number and text is « proposé ». Pure. */

export type RumourSrc = V2Rumour['src'];
/** the two sources (« proposé »): their price, where and when they are, how often they are right */
export const RUMOUR: Record<RumourSrc, { coins: number; truth: number }> = { lio: { coins: 3, truth: 2 / 3 }, stranger: { coins: 8, truth: 1 } };
const FORMS: readonly V2Rumour['form'][] = ['rusty', 'steady', 'sharp'];

/** a rival's form, by its preparation (src/tournament/pool.ts rivalMods: its blows 1 + preparation / 400): under 40 rusty (under a tenth harder), under 70 steady,
 *  then sharp (up to a quarter harder) */
export function formOf(preparation: number): V2Rumour['form'] { return preparation < 40 ? 'rusty' : preparation < 70 ? 'steady' : 'sharp'; }

/** the player's next bout's opponent (the board's « next »), or null once every bout is fought */
export function nextOpponent(s: GameState): string | null {
  const m = s.tournament.matches.find((x) => x.day >= s.day && !x.winner && (x.a === PLAYER_ID || x.b === PLAYER_ID));
  return m ? (m.a === PLAYER_ID ? m.b : m.a) : null;
}

/** a rival's off-screen acts since the start of yesterday (src/tournament/offscreen.ts writes each one, hidden from the journal) */
function actsOf(s: GameState, who: string): Array<{ act: string; text: string }> {
  return s.log.filter((e) => e.kind === 'offscreen' && e.cause === `offscreen:${who}` && e.day >= s.day - 1).map((e) => ({ act: e.id.slice(who.length + 1), text: e.text }));
}

/** the secret a rival keeps since yesterday: a meeting with a hood at night first, else watching the player */
export function secretOf(s: GameState, who: string): V2Rumour['secret'] {
  const acts = actsOf(s, who).map((a) => a.act);
  return acts.includes('plot') ? 'plot' : acts.includes('spy') ? 'spy' : undefined;
}

/** what a source says of a rival now: the stranger the truth, secrets included; Lio's room the truth two times in three, else a health and a form that are not */
export function rumourOf(s: GameState, who: string, src: RumourSrc, r: Rng): V2Rumour {
  const c = s.competitors[who], hp = (c?.healthState ?? 'fit') as V2Rumour['hp'], form = formOf(c?.preparation ?? 0);
  if (src === 'stranger') { const secret = secretOf(s, who); return { day: s.day, src, hp, form, ...(secret ? { secret } : {}) }; }
  if (r.next() < RUMOUR.lio.truth) return { day: s.day, src, hp, form };
  const others = FORMS.filter((f) => f !== form);
  return { day: s.day, src, hp: hp === 'fit' ? 'hurt' : 'fit', form: others[r.int(0, others.length - 1)] };
}

const HP: Record<V2Rumour['hp'], TextKey> = { fit: 'v2.rumour.hp.fit', hurt: 'v2.rumour.hp.hurt', injured: 'v2.rumour.hp.injured' };
const FORM: Record<V2Rumour['form'], TextKey> = { rusty: 'v2.rumour.form.rusty', steady: 'v2.rumour.form.steady', sharp: 'v2.rumour.form.sharp' };
const SECRET: Record<NonNullable<V2Rumour['secret']>, TextKey> = { spy: 'v2.rumour.secret.spy', plot: 'v2.rumour.secret.plot' };
const SRC: Record<RumourSrc, TextKey> = { lio: 'v2.heard.lio', stranger: 'v2.heard.stranger' };

/** what the rumour says, in a sentence */
export function rumourText(who: string, h: V2Rumour): string {
  const said = tx('v2.rumour.about', { name: RIVALS[who]?.name ?? who, hp: tx(HP[h.hp]), form: tx(FORM[h.form]) });
  return h.secret ? `${said} ${tx(SECRET[h.secret])}` : said;
}

/** the last rumour heard of a rival, with its source and day (the board, the match sheet), or null */
export function heardLine(s: GameState, who: string): string | null {
  const h = s.v2?.heard?.[who];
  return h ? tx('v2.heard.line', { src: tx(SRC[h.src]), day: h.day, said: rumourText(who, h) }) : null;
}

/** what the town saw a rival do since yesterday (the board): their public acts only, never the secret ones */
export function seenInTown(s: GameState, who: string): string {
  const name = RIVALS[who]?.name ?? who, acts = actsOf(s, who), parts: string[] = [];
  const n = acts.filter((a) => a.act === 'train').length;
  if (n) parts.push(n === 1 ? tx('v2.seen.train') : tx('v2.seen.trainN', { n }));
  if (acts.some((a) => a.act === 'buy')) parts.push(tx('v2.seen.buy'));
  if (acts.some((a) => a.act === 'rest')) parts.push(tx('v2.seen.rest'));
  // whom they drank with, read against the very words the off-screen log wrote (src/tournament/offscreen.ts)
  const drank: string[] = [], words: string[] = [];
  for (const a of acts.filter((x) => x.act === 'socialise')) {
    for (const o of Object.keys(RIVALS)) {
      if (o === who) continue;
      const other = RIVALS[o].name;
      if (a.text === tx('off.socialise', { name, other }) && !drank.includes(other)) drank.push(other);
      if (a.text === tx('off.socialiseWords', { name, other }) && !words.includes(other)) words.push(other);
    }
  }
  if (drank.length) parts.push(tx('v2.seen.drink', { names: drank.join(tx('v2.seen.and')) }));
  if (words.length) parts.push(tx('v2.seen.words', { names: words.join(tx('v2.seen.and')) }));
  return parts.length ? tx('v2.seen.line', { acts: parts.join(', ') }) : tx('v2.seen.none');
}

/** a bout tomorrow: the next day's bout of the player, or day 5, whose cut sets day 6's bout for all eight (nobody leaves the tournament) */
export function boutTomorrow(s: GameState): boolean {
  return s.day === 5 || s.tournament.matches.some((m) => m.day === s.day + 1 && !m.winner && (m.a === PLAYER_ID || m.b === PLAYER_ID));
}

/** a strap of the player's gear cut in the night and not stitched by Hilde: every blow 15 % harder today (src/simulation/v2gear.ts v2Mods) */
export function strapCut(s: GameState): boolean { return isV2(s) && !!s.flags[`tampered:${s.day}`] && !s.flags[`checked:${s.day}`]; }

/** Clerk Odo's fee for the strongroom (« proposé ») */
export const STRONGROOM = 5;

export type V2IntelAction = { type: 'rumour'; src: RumourSrc } | { type: 'lockGear' };

const PLACE: Record<RumourSrc, GameState['place']> = { lio: 'lanterns', stranger: 'district' };

export const V2_INTEL_ACTIONS: { [K in V2IntelAction['type']]: ActionDef<Extract<V2IntelAction, { type: K }>> & { by: string | ((a: Extract<V2IntelAction, { type: K }>) => string) | null } } = {
  rumour: {
    by: (a) => a.src,
    list: (s) => (isV2(s) ? (Object.keys(PLACE) as RumourSrc[]).filter((src) => PLACE[src] === s.place).map((src) => ({ type: 'rumour' as const, src })) : []),
    label: (s, a) => {
      const who = nextOpponent(s);
      return who ? tx(a.src === 'lio' ? 'v2.rumour.lioLabel' : 'v2.rumour.strangerLabel', { name: RIVALS[who].name, n: RUMOUR[a.src].coins }) : tx('v2.rumour.labelNone');
    },
    cost: () => 0,
    coins: (_s, a) => RUMOUR[a.src].coins,
    check: (s, a) => {
      if (!isV2(s)) return tx('v2.only');
      const away = available(s, a.src); if (away) return away;
      if (!nextOpponent(s)) return tx('v2.rumour.none');
      if (s.flags[`rumour:${a.src}:${s.day}`]) return tx(a.src === 'lio' ? 'v2.rumour.lioAsked' : 'v2.rumour.strangerAsked');
      return s.player.coins < RUMOUR[a.src].coins ? tx('v2.rumour.poor', { n: RUMOUR[a.src].coins }) : null;
    },
    apply: (s, a, r, emit) => {
      const who = nextOpponent(s)!, h = rumourOf(s, who, a.src, r);
      s.player.coins -= RUMOUR[a.src].coins; s.flags[`rumour:${a.src}:${s.day}`] = true;
      (s.v2!.heard ??= {})[who] = h;
      emit({ kind: 'action', id: `rumour:${a.src}`, cause: 'action:rumour', visible: true, text: tx(a.src === 'lio' ? 'v2.rumour.lioLog' : 'v2.rumour.strangerLog', { said: rumourText(who, h) }) });
    },
  },
  // the lockers' own answer (EV-10): the gear sleeps in the registrar's strongroom, the night before a bout
  lockGear: {
    by: 'odo',
    list: (s) => (isV2(s) && s.place === 'forecourt' ? [{ type: 'lockGear' }] : []),
    label: () => tx('v2.strongroom.label', { n: STRONGROOM }),
    cost: () => 0,
    coins: () => STRONGROOM,
    check: (s) => {
      if (!isV2(s)) return tx('v2.only');
      const away = available(s, 'odo'); if (away) return away;
      if (!boutTomorrow(s)) return tx('v2.strongroom.noBout');
      if (s.flags[`strongroom:${s.day}`]) return tx('v2.strongroom.done');
      return s.player.coins < STRONGROOM ? tx('v2.strongroom.poor', { n: STRONGROOM }) : null;
    },
    apply: (s, _a, _r, emit) => {
      s.player.coins -= STRONGROOM; s.flags[`strongroom:${s.day}`] = true;
      emit({ kind: 'action', id: 'strongroom', cause: 'action:lockGear', visible: true, text: tx('v2.strongroom.log') });
    },
  },
};
