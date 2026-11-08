import { clamp, slotNumber, type GameState } from './state';
import type { ActionDef } from './actions';
import type { Emit } from './advance';
import { isV2 } from './v2';
import { available } from './roles';
import { nextOpponent, formOf, rumourText } from './v2intel';
import { PLAYER_ID, RIVALS } from '../narrative/roster';
import { tx, type TextKey } from '../narrative/text';

/** The version 2's rivals who remember and act, and the town's services that the days move (lot L4; the operator's choices on the EV1 sheet, journal Passe EV2:
 *  EV-9 « Chaque rival se souvient ; deux autres agissent », EV-7 « Les suites des actions, puis un par lieu, puis le ciblé », with his note « il faut que cela puisse
 *  impacter la preparation du joueur en jouant sur cet aspect imprevisible »; the audit, `briefs/audit-gameplay-ev1.md` §§ 2-3). Each piece is tied to a person, a
 *  place and a moment of the ten days, and each touches the player's preparation:
 *  - memory: every rival's stance toward the player (a grudge, a respect, a friendship), from what happened between them, said on the tournament's board (T) with
 *    its causes (`stanceOf`, `stanceLine`), and in the words of those whose arc does not already say it (src/narrative/dialogue.ts);
 *  - Vessa Lark, the disinformation (the information): the evenings of the player's pool bouts while she resents losing to them, she pays Lio's room to say that
 *    the player's next opponent is hurt and rusty; the taverns tell it the next morning and Lio's room repeats it until that bout; Brother Ambrose saw her pay the
 *    rounds, the hooded stranger knows who paid; the answer, once known, is to say it to her face before the forecourt (`vessaTalks`, `confrontVessa`);
 *  - Rhosk, the intimidation (the training): out of the title while the player is in it, he takes the training sand on the free day before the player's next bout
 *    (the sign the night before: src/events/v2catalog.ts `v2-rhosk-offer`, Corra Dunmere); the answers: Orla still spars, a challenge won makes him leave it, and
 *    Sergeant Hale's word to the registrar (`sandTaken`, `reportRhosk`);
 *  - the places' services the days move: the training ground's sand shut the morning after a brawl at the barracks (its first `about` promised it, journal Passe
 *    VP1), Sister Anwen busy the evening a rival was hurt in the bouts (the event's text promised it) (`sandShut`, `anwenBusy`).
 *  Every number and text is « proposé ». Pure. */

// ------------------------------------------------------------------------------------------------ memory: the stances

export type Stance = 'grudge' | 'respect' | 'friend';
/** a rival resents the player from this low (Vessa after any defeat by the player: a proud loser falls 15), counts the player a friend from this high (Orla's
 *  recruitment's threshold) */
export const GRUDGE = -15, FRIENDSHIP = 25;
/** the rivals who may count the player a friend, in the order a warning names them (src/events/v2catalog.ts FRIENDS) */
export const FRIENDS = ['orla', 'ilse', 'tobin', 'marek'] as const;

/** a rival's stance toward the player: a grudge, a friendship, or the respect of an honourable or cold rival the player beat; null for none */
export function stanceOf(s: GameState, who: string): Stance | null {
  const c = s.competitors[who], r = RIVALS[who];
  if (!c || !r) return null;
  const rel = c.relationships[PLAYER_ID] ?? 0;
  if (rel <= GRUDGE) return 'grudge';
  if (rel >= FRIENDSHIP) return 'friend';
  return r.temper !== 'proud' && c.knownFacts.includes(`lost-to:${PLAYER_ID}`) ? 'respect' : null;
}

/** what a rival remembers of the player, in the order it happened: the bouts, the challenges, what the player did to them or for them */
export function memoryOf(s: GameState, who: string): string[] {
  const r = RIVALS[who], c = s.competitors[who];
  if (!r || !c) return [];
  const out: string[] = [], proud = r.temper === 'proud';
  for (const m of s.tournament.matches) {
    if (!m.winner || (m.a !== PLAYER_ID && m.b !== PLAYER_ID) || (m.a !== who && m.b !== who)) continue;
    if (m.winner === PLAYER_ID) out.push(tx(c.knownFacts.includes(`humbled-by:${PLAYER_ID}:${m.day}`) ? 'v2.memory.humbled' : 'v2.memory.beat', { day: m.day }));
    else out.push(tx('v2.memory.beatYou', { day: m.day }));
  }
  for (const e of s.log) {
    if (e.cause !== `challenge:${who}`) continue;
    if (e.id === 'challenge:won') out.push(tx('v2.memory.challengeWon', { day: e.day }));
    else if (e.id === 'challenge:lost') out.push(tx('v2.memory.challengeLost', { day: e.day }));
  }
  if (proud && s.facts.includes(`scouted:${who}`)) out.push(tx('v2.memory.watched'));
  if (who === 'cassius' && s.facts.includes('cassius-resents')) out.push(tx('v2.memory.rising'));
  if (who === 'cassius' && s.flags.taunted) out.push(tx('v2.memory.taunted'));
  if (who === 'vessa' && s.flags['confronted:vessa']) out.push(tx('v2.memory.confronted'));
  if (who === 'orla') {
    if (s.quests.cargo === 'delivered' || s.quests.cargo === 'done') out.push(tx('v2.memory.cargo'));
    const spars = s.log.filter((e) => e.id === 'spar').length;
    if (spars) out.push(tx(spars === 1 ? 'v2.memory.spar' : 'v2.memory.sparN', { n: spars }));
    if (s.facts.includes('orla-recruited')) out.push(tx('v2.memory.recruited'));
  }
  if (who === 'rhosk' && s.flags['reported:rhosk']) out.push(tx('v2.memory.reported'));
  return out;
}

const STANCE: Record<Stance, TextKey> = { grudge: 'v2.stance.grudge', respect: 'v2.stance.respect', friend: 'v2.stance.friend' };
/** the board's line (T): the rival's stance and its causes, or null when there is none */
export function stanceLine(s: GameState, who: string): string | null {
  const st = stanceOf(s, who);
  if (!st || !isV2(s)) return null;
  const why = memoryOf(s, who), name = RIVALS[who].name;
  const list = why.length <= 1 ? why.join('') : `${why.slice(0, -1).join(', ')}${tx('v2.seen.and')}${why[why.length - 1]}`;
  return why.length ? tx('v2.stance.line', { stance: tx(STANCE[st], { name }), why: list }) : `${tx(STANCE[st], { name })}.`;
}

/** what a rival says of the player beyond its arc (src/narrative/v2story.ts): Ilse, Tobin and Rhosk, whose arcs do not speak of what happened between you, and
 *  Marek's word as a friend; null when there is nothing to add */
const STANCE_WORDS: Record<string, Partial<Record<Stance, TextKey>>> = {
  ilse: { respect: 'v2.line.ilse.respect', friend: 'v2.line.ilse.friend' },
  tobin: { respect: 'v2.line.tobin.respect', friend: 'v2.line.tobin.friend' },
  rhosk: { respect: 'v2.line.rhosk.respect' },
  marek: { friend: 'v2.line.marek.friend' },
};
export function stanceWords(s: GameState, who: string): string | null {
  const st = stanceOf(s, who), k = st ? STANCE_WORDS[who]?.[st] : undefined;
  return isV2(s) && k ? tx(k) : null;
}

// ------------------------------------------------------------------------------------------------ Vessa Lark: the tale in Lio's room

/** the days whose evening Vessa can pay Lio's room: the evenings of the player's bouts in the pool, before the next one (the pool's rounds, days 2 and 4) */
export const LIE_EVENINGS: readonly number[] = [2, 4];
/** the tale she tells of the player's next opponent: hurt, and still rusty (« proposé »: a story to make the player drill less) */
export const TALE = { hp: 'hurt', form: 'rusty' } as const;

/** Vessa resents losing to the player: beaten by them, and her grudge (a proud loser falls 15) */
export const vessaResents = (s: GameState): boolean =>
  (s.competitors.vessa?.relationships[PLAYER_ID] ?? 0) <= GRUDGE && !!s.competitors.vessa?.knownFacts.includes(`lost-to:${PLAYER_ID}`);

/** the tale Lio's room repeats now, if any: of whom */
export function taleOf(s: GameState): string | null {
  const l = s.v2?.lie;
  return l && s.day >= l.from && s.day <= l.until ? l.who : null;
}

/** the end of a version 2 evening: Vessa's tale, if she resents the player and the player's next opponent is not already hurt and rusty (a true tale is no lie).
 *  The taverns tell it the next morning (the news dated there); her paying the rounds is seen in town (the board's « Seen in town »: an act of hers in the log) */
export function vessaTalks(s: GameState, emit: Emit): void {
  if (!isV2(s) || !s.v2 || !LIE_EVENINGS.includes(s.day) || !vessaResents(s) || s.flags['confronted:vessa']) return;
  const who = nextOpponent(s), c = who ? s.competitors[who] : undefined;
  if (!who || who === 'vessa' || !c) return;
  if (c.healthState !== 'fit' && formOf(c.preparation) === 'rusty') return;
  const m = s.tournament.matches.find((x) => !x.winner && x.day > s.day && ((x.a === PLAYER_ID && x.b === who) || (x.b === PLAYER_ID && x.a === who)));
  if (!m) return;
  s.v2.lie = { who, from: s.day + 1, until: m.day };
  emit({ kind: 'offscreen', id: 'vessa:lie', cause: 'offscreen:vessa', visible: false, text: tx('v2.lie.act', { name: RIVALS.vessa.name, other: RIVALS[who].name }) });
  emit({ day: s.day + 1, slot: 'morning', kind: 'event', id: 'v2-tavern-tale', cause: tx('v2.lie.cause'), visible: true, text: tx('v2.lie.word', { said: rumourText(who, { day: s.day + 1, src: 'lio', ...TALE }) }) });
}

// ------------------------------------------------------------------------------------------------ the training sand: the brawl, Rhosk

/** the training ground's sand shut this morning: the barracks brawled last night (src/events/v2catalog.ts v2-barracks-brawl, its `tomorrow: 'brawl'`) */
export const sandShut = (s: GameState): boolean => isV2(s) && s.slot === 'morning' && !!s.flags[`brawl:${s.day}`];
/** Rhosk stands on the training sand today (src/events/v2catalog.ts v2-rhosk-offer, its `tomorrow: 'sand'`), by day, until a challenge won or Hale's word clears it */
export const sandTaken = (s: GameState): boolean => isV2(s) && s.slot !== 'evening' && !!s.flags[`sand:${s.day}`] && !s.flags['sand-cleared'];
/** why the sand refuses a drill now, or null (the train and drill actions read it, src/simulation/actions.ts and v2skills.ts) */
export function sandRefusal(s: GameState): string | null {
  if (!isV2(s) || s.place !== 'training') return null;
  return sandTaken(s) ? tx('v2.sand.rhosk') : sandShut(s) ? tx('v2.sand.brawl') : null;
}

/** Sister Anwen is busy tonight: a rival was hurt in this afternoon's bouts (src/events/catalog.ts rival-injured: « Sister Anwen is busy tonight »); her care waits
 *  for the morning */
export const anwenBusy = (s: GameState): boolean => isV2(s) && s.slot === 'evening' && s.flags['ev:rival-injured'] === slotNumber(s) - 1;

// ------------------------------------------------------------------------------------------------ the answers

export type V2RivalAction = { type: 'confrontVessa' } | { type: 'reportRhosk' };

export const V2_RIVAL_ACTIONS: { [K in V2RivalAction['type']]: ActionDef<Extract<V2RivalAction, { type: K }>> & { by: string | null } } = {
  // Vessa's tale, said to her face before the forecourt's crowd once the player knows who paid for it (Brother Ambrose, the hooded stranger)
  confrontVessa: {
    by: 'vessa',
    list: (s) => (isV2(s) && s.place === 'forecourt' && s.facts.includes('vessa-lie-known') && !s.flags['confronted:vessa'] ? [{ type: 'confrontVessa' }] : []),
    label: () => tx('v2.lie.confrontLabel'),
    cost: () => 0,
    check: (s) => (!isV2(s) ? tx('v2.only') : available(s, 'vessa') ?? (!s.facts.includes('vessa-lie-known') ? tx('v2.lie.unknown') : s.flags['confronted:vessa'] ? tx('v2.lie.confronted') : null)),
    apply: (s, _a, _r, emit) => {
      const who = s.v2!.lie?.who;
      s.flags['confronted:vessa'] = s.day; delete s.v2!.lie;
      s.player.reputation = clamp(s.player.reputation + 3);
      const v = s.competitors.vessa; if (v) { v.reputation = clamp(v.reputation - 5); v.relationships[PLAYER_ID] = clamp((v.relationships[PLAYER_ID] ?? 0) - 5, -100, 100); }
      emit({ kind: 'consequence', id: 'vessa:confronted', cause: 'action:confrontVessa', visible: true, text: tx(who ? 'v2.lie.confrontLog' : 'v2.lie.confrontLogPast', { name: who ? RIVALS[who].name : '' }) });
    },
  },
  // Rhosk's plan told to Sergeant Hale, who sends word to the registrar: a fighter who bars the lists' sand to another breaks the tournament's peace
  reportRhosk: {
    by: 'hale',
    list: (s) => (isV2(s) && s.place === 'district' && s.facts.includes('rhosk-offer') && !s.flags['sand-cleared'] ? [{ type: 'reportRhosk' }] : []),
    label: () => tx('v2.sand.reportLabel'),
    cost: () => 0,
    check: (s) => (!isV2(s) ? tx('v2.only') : available(s, 'hale') ?? (!s.facts.includes('rhosk-offer') ? tx('v2.sand.unknown') : s.flags['sand-cleared'] ? tx('v2.sand.cleared') : null)),
    apply: (s, _a, _r, emit) => {
      s.flags['sand-cleared'] = true; s.flags['reported:rhosk'] = s.day;
      s.town.hale = clamp((s.town.hale ?? 0) + 3, -100, 100);
      const k = s.competitors.rhosk; if (k) k.reputation = clamp(k.reputation - 5);
      emit({ kind: 'consequence', id: 'rhosk:reported', cause: 'action:reportRhosk', visible: true, text: tx('v2.sand.reportLog') });
    },
  },
};
