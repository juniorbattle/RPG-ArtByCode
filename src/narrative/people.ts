import { localize } from './text';
import type { PlaceId, SlotId } from '../simulation/state';

/** The people the player can talk to (journal Passes L1 / L4 / L5): the district's existing characters in game roles (choice P4: no new
 *  sprite, no new spawn; `sprite` is the archetype the town already spawns, matched by the town layer), the forecourt's officials and the
 *  rivals, who appear in town as portraits and dialogues only (choice K3). English texts (choice K1). Pure data. */

export interface Person {
  id: string; name: string; title: string;
  place: PlaceId;
  /** the town archetype standing for this person (ActorSystem spec / base), when the district shows one */
  sprite?: string;
  /** the slots this person can be talked to (GAMEPLAY § 6, PROJECT § 8.1: day and night change who is present) */
  hours: readonly SlotId[];
  /** a rival's competitor id (portrait + dialogue only, choice K3) */
  rival?: string;
  /** a person of the version 2 only (src/simulation/v2.ts): today's game never lists them */
  v2?: boolean;
  /** where and when a person of today's game stands in a version 2 game (lot V5: the training ground, the festival square) */
  v2at?: { place?: PlaceId; hours?: readonly SlotId[]; title?: string };
  /** a passer-by of the version 2 who holds a piece one can buy, bargain for or steal (lot L2a, the operator's note on EV-6) */
  passer?: boolean;
  /** the days a person is in the Cité (absent: every day) */
  days?: readonly [number, number];
  /** a person met by portrait and words only on a square (no sheet stands there: a generic fighter until its art, Tobin and Rhosk, lot L2b) */
  generic?: boolean;
}

const DAY: readonly SlotId[] = ['morning', 'afternoon'];
const ALL: readonly SlotId[] = ['morning', 'afternoon', 'evening'];
const NIGHT: readonly SlotId[] = ['evening'];

export const PEOPLE: Record<string, Person> = {
  mara: { id: 'mara', name: 'Mara', title: 'the merchant', place: 'district', sprite: 'merchant', hours: ALL },
  bram: { id: 'bram', name: 'Bram', title: 'the blacksmith', place: 'district', sprite: 'blacksmith', hours: DAY },
  hale: { id: 'hale', name: 'Sergeant Hale', title: 'of the quay watch', place: 'district', sprite: 'guardA', hours: ALL },
  wynn: { id: 'wynn', name: 'Wynn', title: 'a guard', place: 'district', sprite: 'guardB', hours: ALL },
  stranger: { id: 'stranger', name: 'The hooded stranger', title: 'an informant', place: 'district', sprite: 'hooded', hours: NIGHT },
  tam: { id: 'tam', name: 'Tam', title: 'the porter', place: 'district', sprite: 'porter', hours: DAY },
  folk: { id: 'folk', name: 'Townsfolk', title: 'passers-by', place: 'district', sprite: 'crowd', hours: ALL },
  odo: { id: 'odo', name: 'Clerk Odo', title: 'the tournament registrar', place: 'forecourt', hours: DAY },
  anwen: { id: 'anwen', name: 'Sister Anwen', title: 'the arena healer', place: 'forecourt', hours: ALL },
  orla: { id: 'orla', name: 'Orla Brask', title: 'a pool fighter from the docks', place: 'forecourt', hours: DAY, rival: 'orla', v2at: { place: 'training' } },
  vessa: { id: 'vessa', name: 'Vessa Lark', title: 'the Quickblade', place: 'forecourt', hours: DAY, rival: 'vessa' },
  marek: { id: 'marek', name: 'Marek Varn', title: 'the Iron Gate, last year\'s champion', place: 'forecourt', hours: DAY, rival: 'marek' },
  cassius: { id: 'cassius', name: 'Cassius Dree', title: 'a noble in the pool', place: 'lanterns', hours: NIGHT, rival: 'cassius' },
  lio: { id: 'lio', name: 'Lio', title: 'the lantern-row innkeeper', place: 'lanterns', hours: ALL, v2at: { title: 'the festival square\'s innkeeper' } },
  // the version 2 (journal Passe V2): the weapon master, at the training ground (lot V5)
  corvin: { id: 'corvin', name: 'Master Corvin', title: 'the weapon master', place: 'training', hours: DAY, v2: true },
  // the version 2's shops (journal Passe V3): the armourer by the arena's gate, the trinket seller who opens at dusk
  hilde: { id: 'hilde', name: 'Hilde', title: 'the armourer', place: 'forecourt', hours: DAY, v2: true },
  pip: { id: 'pip', name: 'Pip', title: 'a trinket seller', place: 'lanterns', hours: ['afternoon', 'evening'], v2: true },
  // the version 2 (journal Passe V4): the temple knight, who takes a challenge at the training ground by day (lot V5)
  ilse: { id: 'ilse', name: 'Ilse Morrow', title: 'of the Temple, a pool fighter', place: 'training', hours: DAY, rival: 'ilse', v2: true },
  // the version 2's districts (lot V5): the training ground's drill master, the festival square's bard
  drill: { id: 'drill', name: 'Sergeant Brann', title: 'the drill master', place: 'training', hours: DAY, v2: true },
  bard: { id: 'bard', name: 'Wren', title: 'the festival\'s bard', place: 'lanterns', hours: ['afternoon', 'evening'], v2: true },
  // the version 2's passers-by (lot L2a, the operator's note on EV-6: « marchander avec les passants pour obtenir un objet qui possede au lieu de le
  // voler »), each a walker of the place's crowd with a piece of their own (src/simulation/v2barter.ts PASSERS), « proposé »: the river trader whose
  // barge ties up at dusk until it leaves after the major match, the mother of a knight who lost the qualifiers, a pilgrim who walks on after the parade
  fenwick: { id: 'fenwick', name: 'Fenwick', title: 'a river trader', place: 'district', hours: NIGHT, v2: true, passer: true, days: [1, 7] },
  edda: { id: 'edda', name: 'Lady Edda', title: 'a knight\'s mother', place: 'forecourt', hours: DAY, v2: true, passer: true },
  sela: { id: 'sela', name: 'Sela', title: 'a pilgrim on the road south', place: 'lanterns', hours: ['afternoon', 'evening'], v2: true, passer: true, days: [1, 9] },
  // the version 2's generic fighters (lot L2b, the operator's note on EV-4 and « En ville, structure gardée (Recommandé) », journal Passes EV2 / EVL3): the
  // qualifiers' losers, held before Ren came, who stayed in the Cité (src/narrative/generics.ts); portrait and words only until their sheets (art sheet)
  aldric: { id: 'aldric', name: 'Ser Aldric Venn', title: 'a knight out in the qualifiers', place: 'training', hours: DAY, v2: true, generic: true },
  corra: { id: 'corra', name: 'Corra Dunmere', title: 'a staff for hire on the quay', place: 'district', hours: NIGHT, v2: true, generic: true },
  ambrose: { id: 'ambrose', name: 'Brother Ambrose', title: 'a lantern-bearer of the hill shrines', place: 'lanterns', hours: ['afternoon', 'evening'], v2: true, generic: true },
  // three more (GA-P1 to GA-P3 « Oui, ainsi », journal Passes GA2 / GA3): the swordmaster Marek beat, who drills before the arena's gate at dusk; the spear champion who
  // guards the barges on the quay by day; the bare-handed fighter on the market hall's steps in the morning
  lucan: { id: 'lucan', name: 'Lucan Rook', title: 'a swordmaster out in the qualifiers', place: 'forecourt', hours: NIGHT, v2: true, generic: true },
  piers: { id: 'piers', name: 'Piers Calloway', title: 'a spear champion guarding the barges', place: 'district', hours: DAY, v2: true, generic: true },
  kell: { id: 'kell', name: 'Kell Barrow', title: 'a bare-handed fighter for a few coins', place: 'lanterns', hours: ['morning'], v2: true, generic: true },
  // the pool's two who had no place in town (« Portrait seulement », casting R-ville, journal Passe CA1): on the training ground, a challenge after the cut
  // for whoever is out of the title (lot L2b, EV-4 « Les trois, puis les éliminés à partir du jour 6 »); there from the first day since lot L6 (EV-13 « une réplique par
  // acte pour Rhosk et Tobin »: their first act's line is said on the sand; L2b had them in town from day 6)
  tobin: { id: 'tobin', name: 'Tobin Fenn', title: 'the Hopeful, of the pool', place: 'training', hours: DAY, rival: 'tobin', v2: true, generic: true },
  rhosk: { id: 'rhosk', name: 'Rhosk', title: 'the Northman, of the pool', place: 'training', hours: DAY, rival: 'rhosk', v2: true, generic: true },
};

// names and titles read in the language shown (journal Passe RG4); the simulation, run in English, reads the English
for (const p of Object.values(PEOPLE)) { localize(p, ['name', 'title']); if (p.v2at) localize(p.v2at, ['title']); }

/** where a person stands in this game (a version 2 game moves some of today's people: lot V5) */
export function placeOf(p: Person, v2: boolean): PlaceId { return (v2 && p.v2at?.place) || p.place; }

/** what this person is called in this game (a version 2 game's festival square stands in Lantern Row's place: journal Passe VP1) */
export function titleOf(p: Person, v2: boolean): string { return (v2 && p.v2at?.title) || p.title; }

/** is this person there to talk to, at this place and slot? (the content can add conditions: the blacksmith leaves a sabotaged forge) */
export function presentAt(p: Person, place: PlaceId, slot: SlotId, v2 = false): boolean { return placeOf(p, v2) === place && ((v2 && p.v2at?.hours) || p.hours).includes(slot); }
