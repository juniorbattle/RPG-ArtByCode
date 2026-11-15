import { clamp, type GameState } from './state';
import type { ActionDef } from './actions';
import { isV2 } from './v2';
import { tx, type TextKey } from '../narrative/text';

/** The answers to a costly event of the town (the operator's GP-10 « Le lieu et le choix », journal Passe GP2: « un événement de quartier ne frappe que là où il est »,
 *  « un événement qui coûte propose une réponse : payer, refuser, ou se battre »). The event strikes where the player is (src/events/engine.ts, the condition `here`)
 *  and takes its cost as before; its outcome opens an encounter (`encounter`), which the page asks at once and which the player may answer on that place until the
 *  slot that follows ends (then the cost stands):
 *  - the card sharps of the festival square at night (5 coins taken): pay, or refuse (the coins back, but they shout « welsher » across the square: the name and Lio's
 *    goodwill), or fight their leader;
 *  - the cutpurse of the quay's market in the afternoon (4 coins taken): let him go, or chase him and fight.
 *  « Fight » is the bout of GP-03 (« pris sur le fait »), built by the first workshop (journal Passe GP2): wired once it is merged. Pure. */

export type EncounterId = 'cutpurse' | 'sharps';
export type Answer = 'pay' | 'refuse' | 'fight';

/** each encounter's price (taken by the event), its answers, and what a refusal costs (« proposé », on the operator's sheet) */
export const ENCOUNTERS: Record<EncounterId, { coins: number; answers: readonly Answer[]; refuse?: { reputation: number; goodwill: [string, number] } }> = {
  sharps: { coins: 5, answers: ['pay', 'refuse'], refuse: { reputation: -2, goodwill: ['lio', -2] } },
  cutpurse: { coins: 4, answers: ['pay'] },
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

export const V2_ENCOUNTER_ACTIONS: { answer: ActionDef<V2EncounterAction> & { by: null } } = {
  answer: {
    by: null,
    list: (s) => { const e = encounterOf(s); return isV2(s) && e ? ENCOUNTERS[e].answers.map((how) => ({ type: 'answer' as const, how })) : []; },
    label: (s, a) => { const e = encounterOf(s); return e && LABEL[e][a.how] ? tx(LABEL[e][a.how]!, { n: ENCOUNTERS[e].coins }) : tx('v2.encounter.none'); },
    cost: () => 0,
    check: (s, a) => { const e = encounterOf(s); return !isV2(s) ? tx('v2.only') : !e || !ENCOUNTERS[e].answers.includes(a.how) ? tx('v2.encounter.none') : null; },
    apply: (s, a, _r, emit) => {
      const e = encounterOf(s)!, def = ENCOUNTERS[e];
      delete s.v2!.encounter;
      if (a.how === 'refuse' && def.refuse) {
        s.player.coins += def.coins;
        s.player.reputation = clamp(s.player.reputation + def.refuse.reputation);
        const [who, n] = def.refuse.goodwill; s.town[who] = clamp((s.town[who] ?? 0) + n, -100, 100);
      }
      emit({ kind: 'action', id: `encounter:${e}:${a.how}`, cause: 'action:answer', visible: true, text: tx(LOG[e][a.how] ?? 'v2.encounter.none', { n: def.coins }) });
    },
  },
};
