import { clamp, type GameState, type V2EncounterFight } from './state';
import type { ActionDef } from './actions';
import type { Emit } from './advance';
import { isV2 } from './v2';
import { QUEST } from './v2questData';
import { keepOutcomeNote } from './v2notes';
import type { DuelOutcome } from '../tournament/pool';
import { npcFighterName } from '../narrative/npcFighters';
import { playerMatch } from '../tournament/pool';
import { tx, type TextKey } from '../narrative/text';

/** The answers to a costly event of the town (the operator's GP-10 « Le lieu et le choix », journal Passe GP2: « un événement de quartier ne frappe que là où il est »,
 *  « un événement qui coûte propose une réponse : payer, refuser, ou se battre »). The event strikes where the player is (src/events/engine.ts, the condition `here`)
 *  and takes its cost as before; its outcome opens an encounter (`encounter`), which the page asks at once and which the player may answer on that place until the
 *  slot that follows ends (then the cost stands):
 *  - the card sharps of the festival square at night (5 coins taken): pay, or refuse (the coins back, but they shout « welsher » across the square: the name and Lio's
 *    goodwill), or fight their leader;
 *  - the cutpurse of the quay's market in the afternoon (4 coins taken): let him go, or chase him and fight.
 *  « Fight » is the bout on the sand of chantier 1 (GP-03 « pris sur le fait », the operator's Q-05 « Ainsi, avec « se battre » une fois le chantier 1 fusionné »,
 *  journal Passe QE2), a slot, never the afternoon of the player's bout: the fighter, a townsfolk template in their own look (src/narrative/npcFighters.ts), the rule
 *  of GP-03: won, the cost given back; lost, the cost taken again (and a wound by a heavy knock-down, as every town duel). Pure. */

export type EncounterId = 'cutpurse' | 'sharps';
export type Answer = 'pay' | 'refuse' | 'fight';

/** each encounter's price (taken by the event), its answers, what a refusal costs (« proposé », on the operator's sheet) and who fights for it (NPC_FIGHTERS) */
export const ENCOUNTERS: Record<EncounterId, { coins: number; answers: readonly Answer[]; foe: string; refuse?: { reputation: number; goodwill: [string, number] } }> = {
  sharps: { coins: 5, answers: ['pay', 'refuse', 'fight'], foe: 'vane', refuse: { reputation: -2, goodwill: ['lio', -2] } },
  cutpurse: { coins: 4, answers: ['pay', 'fight'], foe: 'wick' },
};

/** the encounter waiting for an answer here, if any (it waits on its place only) */
export function encounterOf(s: Pick<GameState, 'v2' | 'place'>): EncounterId | null {
  const e = s.v2?.encounter;
  return e && e.place === s.place ? e.id : null;
}
/** the slot that followed the encounter ends: it is over, its cost stands (src/simulation/advance.ts passSlot, before the slot's events) */
export function expireEncounter(s: GameState): void {
  const e = s.v2?.encounter;
  if (e && (s.day !== e.day || s.slot !== e.slot)) delete s.v2!.encounter;
}

export type V2EncounterAction = { type: 'answer'; how: Answer };

const LABEL: Record<EncounterId, Partial<Record<Answer, TextKey>>> = {
  sharps: { pay: 'v2.encounter.sharps.pay', refuse: 'v2.encounter.sharps.refuse', fight: 'v2.encounter.sharps.fight' },
  cutpurse: { pay: 'v2.encounter.cutpurse.pay', fight: 'v2.encounter.cutpurse.fight' },
};
const LOG: Record<EncounterId, Partial<Record<Answer, TextKey>>> = {
  sharps: { pay: 'v2.encounter.sharps.payLog', refuse: 'v2.encounter.sharps.refuseLog' },
  cutpurse: { pay: 'v2.encounter.cutpurse.payLog' },
};
/** the bout of the afternoon comes first, as for a thief's fight (GP-03) */
const boutToday = (s: GameState): boolean => { const m = playerMatch(s); return !!m && s.slot === 'afternoon' && !m.winner; };
const nameOfFoe = (id: string): string => npcFighterName(id) ?? id;

export const V2_ENCOUNTER_ACTIONS: { answer: ActionDef<V2EncounterAction> & { by: null } } = {
  answer: {
    by: null,
    list: (s) => { const e = encounterOf(s); return isV2(s) && e ? ENCOUNTERS[e].answers.map((how) => ({ type: 'answer' as const, how })) : []; },
    label: (s, a) => { const e = encounterOf(s); return e && LABEL[e][a.how] ? tx(LABEL[e][a.how]!, { n: ENCOUNTERS[e].coins, rep: -(ENCOUNTERS[e].refuse?.reputation ?? 0) }) : tx('v2.encounter.none'); },
    cost: () => 0,
    later: (_s, a) => (a.how === 'fight' ? 1 : 0),
    check: (s, a) => { const e = encounterOf(s); return !isV2(s) ? tx('v2.only') : !e || !ENCOUNTERS[e].answers.includes(a.how) ? tx('v2.encounter.none')
      : a.how === 'fight' && boutToday(s) ? tx('refuse.boutFirst') : a.how === 'fight' && s.v2?.challenge ? tx('v2.challenge.pending') : null; },
    apply: (s, a, _r, emit) => {
      const e = encounterOf(s)!, def = ENCOUNTERS[e], from = s.v2!.encounter!;
      delete s.v2!.encounter;
      if (a.how === 'fight') {
        s.v2!.challenge = { who: def.foe, day: s.day, kind: 'encounter', encounter: { id: from.id, day: from.day, slot: from.slot, place: from.place } };
        emit({ kind: 'action', id: `encounter:${e}:fight`, cause: 'action:answer', visible: true, text: tx('v2.encounter.fightLog', { name: nameOfFoe(def.foe) }) });
        return;
      }
      if (a.how === 'refuse' && def.refuse) {
        s.player.coins += def.coins;
        s.player.reputation = clamp(s.player.reputation + def.refuse.reputation);
        const [who, n] = def.refuse.goodwill; s.town[who] = clamp((s.town[who] ?? 0) + n, -100, 100);
      }
      emit({ kind: 'action', id: `encounter:${e}:${a.how}`, cause: 'action:answer', visible: true, text: tx(LOG[e][a.how] ?? 'v2.encounter.none', { n: def.coins }) });
    },
  },
};

/** the fight of an event's answer, or of Lio's quest, settled (src/simulation/v2town.ts applyChallenge): an event's, won the coins it took given back, lost as many taken again;
 *  Lio's quest, won the sharps gone (the quest done, Lio's goodwill as a payment gives it), lost the quest's price taken and the quest open; a heavy knock-down wounds as in every town duel */
export function applyEncounterFight(s: GameState, ch: NonNullable<NonNullable<GameState['v2']>['challenge']>, o: DuelOutcome, emit: Emit): void {
  const e = ch.encounter as V2EncounterFight, won = o.winner === 'player', foe = nameOfFoe(ch.who);
  keepOutcomeNote(s, o, 'challenge');
  if (e.quest) {
    if (won) {
      s.quests.sharps = 'done'; s.facts.push('sharps-gone'); s.town.lio = clamp((s.town.lio ?? 0) + QUEST.doneGoodwill, -100, 100);
      emit({ kind: 'consequence', id: 'quest:sharps:fought', cause: 'quest:sharps', visible: true, text: tx('v2.quest.sharps.fightWon', { name: foe }) });
    } else {
      const n = Math.min(QUEST.sharpsPrice, s.player.coins); s.player.coins -= n;
      emit({ kind: 'consequence', id: 'quest:sharps:beaten', cause: 'quest:sharps', visible: true, text: tx('v2.quest.sharps.fightLost', { name: foe, n }) });
    }
  } else {
    const n = ENCOUNTERS[e.id].coins;
    if (won) s.player.coins += n; else s.player.coins = Math.max(0, s.player.coins - n);
    emit({ kind: 'consequence', id: won ? `encounter:${e.id}:won` : `encounter:${e.id}:lost`, cause: 'action:answer', visible: true, text: tx(won ? 'v2.encounter.won' : 'v2.encounter.lost', { name: foe, n }) });
  }
  if (!won && o.finisher === 'heavy') {
    s.player.injury = Math.min(2, s.player.injury + 1);
    emit({ kind: 'consequence', id: 'player-injured', cause: 'action:answer', visible: true, text: tx('duel.injured') });
  }
}
