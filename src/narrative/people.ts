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
  orla: { id: 'orla', name: 'Orla Brask', title: 'a pool fighter from the docks', place: 'forecourt', hours: DAY, rival: 'orla' },
  vessa: { id: 'vessa', name: 'Vessa Lark', title: 'the Quickblade', place: 'forecourt', hours: DAY, rival: 'vessa' },
  marek: { id: 'marek', name: 'Marek Varn', title: 'the Iron Gate, last year\'s champion', place: 'forecourt', hours: DAY, rival: 'marek' },
  cassius: { id: 'cassius', name: 'Cassius Dree', title: 'a noble in the pool', place: 'lanterns', hours: NIGHT, rival: 'cassius' },
  lio: { id: 'lio', name: 'Lio', title: 'the lantern-row innkeeper', place: 'lanterns', hours: ALL },
};

/** is this person there to talk to, at this place and slot? (the content can add conditions: the blacksmith leaves a sabotaged forge) */
export function presentAt(p: Person, place: PlaceId, slot: SlotId): boolean { return p.place === place && p.hours.includes(slot); }
