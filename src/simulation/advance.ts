import { Rng, mix32, hashString } from '../core/rng';
import { DAYS, SLOTS, SCHEMA_VERSION, clone, slotIndex, slotName, type GameEvent, type GameState } from './state';
import { canonical, fnv64 } from './canonical';
import { ACTIONS, type Action, type ActionDef } from './actions';
import { endSlot } from './slot';
import { initialState, CONTENT_ID } from './content';
import { playerMatch } from '../tournament/pool';
import { computePulse } from '../tournament/pulse';
import { tx } from '../narrative/text';
import { daysOf, v2AfterSlot } from '../tournament/v2calendar';

/** The simulation's entry points (PROJECT_MASTER_CONTRACT § 10.2, journal Passe L1):
 *  - `newGame(seed, name)`: the slice's first morning;
 *  - `actions(state)`: what the player can do now, each with its cost in slots (0 = minor: talking, consulting, moving between places,
 *    GAMEPLAY § 4.2) and why an unavailable one is refused;
 *  - `advance(state, action, rng)` -> `{ state, events }`: never mutates its input; a refused action returns the same state and no event;
 *    a major action (cost 1) ends the slot: the competitors act off screen, the pulse and the events are computed (`endSlot`), and the
 *    clock moves to the next slot (after day 3's evening the slice is over);
 *  - `serialize` / `deserialize`: the save, canonical JSON with its schema version; `hash`: the state's fingerprint.
 *  Randomness: `rngFor(state, label)`, a stream derived from (seed, step, label) only, so a reloaded save draws what the continued game
 *  draws (tests/game-core.test.mjs). */

export interface Advance { state: GameState; events: GameEvent[]; ok: boolean; reason?: string }
/** cost: the slots it takes (0 or 1); coins: what it takes from the purse (0 = nothing) */
export interface ActionOption { action: Action; label: string; cost: number; coins: number; ok: boolean; reason?: string }

export function newGame(seed: number, name = 'Ren'): GameState {
  return initialState(seed >>> 0, cleanName(name));
}

/** the player's name as typed (choice K2): trimmed, at most 20 characters, letters, digits, spaces, apostrophes and dashes */
export function cleanName(s: string): string {
  const n = s.replace(/[^\p{L}\p{N} '\-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 20).trim();
  return n || 'Ren';
}

/** a random stream of this state (seed, actions applied so far) and a label (the system or actor drawing) */
export function rngFor(st: Pick<GameState, 'seed' | 'step'>, label: string): Rng {
  return new Rng(mix32(mix32(st.seed, st.step), hashString(label)));
}

export function actions(st: GameState): ActionOption[] {
  const out: ActionOption[] = [];
  if (st.over) return out;
  for (const def of Object.values(ACTIONS) as ActionDef[]) for (const a of def.list(st)) out.push(option(st, def, a));
  return out;
}

/** refusals that hold for every significant action: on a match afternoon, the bout comes first */
function slotRule(st: GameState, def: ActionDef, a: Action): string | null {
  if (a.type === 'fight' || def.cost(st, a) === 0) return null;
  const m = playerMatch(st);
  return m && st.slot === 'afternoon' && !m.winner ? tx('refuse.boutFirst') : null;
}

function option(st: GameState, def: ActionDef, a: Action): ActionOption {
  const reason = def.check(st, a) ?? slotRule(st, def, a);
  return { action: a, label: def.label(st, a), cost: def.cost(st, a), coins: def.coins?.(st, a) ?? 0, ok: reason === null, ...(reason !== null ? { reason } : {}) };
}

export function advance(st: GameState, action: Action, rng?: Rng): Advance {
  if (st.over) return { state: st, events: [], ok: false, reason: st.flags.v2 === true ? tx('v2.over') : tx('refuse.over') };
  const def = ACTIONS[action.type] as ActionDef | undefined;
  if (!def) return { state: st, events: [], ok: false, reason: tx('refuse.unknown', { type: action.type }) };
  const reason = def.check(st, action) ?? slotRule(st, def, action);
  if (reason !== null) return { state: st, events: [], ok: false, reason };
  const s = clone(st), events: GameEvent[] = [];
  const r = rng ?? rngFor(st, `action:${action.type}`);
  const emit = (e: Omit<GameEvent, 'seq' | 'day' | 'slot'> & Partial<Pick<GameEvent, 'day' | 'slot'>>): GameEvent => {
    const ev: GameEvent = { seq: s.log.length, day: e.day ?? s.day, slot: e.slot ?? s.slot, kind: e.kind, id: e.id, cause: e.cause, text: e.text, visible: e.visible };
    s.log.push(ev); events.push(ev);
    return ev;
  };
  const cost = def.cost(st, action);
  def.apply(s, action, r, emit);
  s.step++;
  if (cost > 0) passSlot(s, emit, `action:${action.type}`);
  return { state: s, events, ok: true };
}

export type Emit = (e: Omit<GameEvent, 'seq' | 'day' | 'slot'> & Partial<Pick<GameEvent, 'day' | 'slot'>>) => GameEvent;

/** the slot ends: the world moves (off screen, pulse, events), then the clock */
function passSlot(s: GameState, emit: Emit, cause: string): void {
  endSlot(s, emit, rngFor(s, 'slot'));
  // the version 2's bracket (lot V6): the cut, the major match, the final, the champion, once the day's bouts are fought
  v2AfterSlot(s, s.slot, emit);
  const i = slotIndex(s.slot);
  if (i < SLOTS.length - 1) s.slot = SLOTS[i + 1];
  else if (s.day < daysOf(s)) { s.day++; s.slot = 'morning'; }
  else { s.over = true; emit({ kind: 'slot', id: 'slice-over', cause, text: s.flags.v2 === true ? tx('v2.over') : tx('clock.sliceOver'), visible: true }); return; }
  s.pulse = computePulse(s);
  emit({ kind: 'slot', id: `slot:${s.day}:${s.slot}`, cause, text: tx('clock.slot', { day: s.day, slot: slotName(s.slot) }), visible: false });
}


// ---------------------------------------------------------------------------------------------------------------- saves

export interface SaveFile { kind: 'cite-du-tournoi-save'; schemaVersion: number; content: string; state: GameState }

export function serialize(st: GameState): string {
  const f: SaveFile = { kind: 'cite-du-tournoi-save', schemaVersion: SCHEMA_VERSION, content: st.content, state: st };
  return canonical(f);
}

/** migrations by source version (PROJECT § 10.3: « migrations de sauvegarde prévues »): none yet, version 1 is the first */
const MIGRATIONS: Record<number, (s: GameState) => GameState> = {};

/** a save back to a state; throws an Error with a readable reason for anything else (another file, a newer version, a broken state) */
export function deserialize(text: string): GameState {
  let f: SaveFile;
  try { f = JSON.parse(text) as SaveFile; } catch { throw new Error('This file is not a save: it is not JSON.'); }
  if (!f || f.kind !== 'cite-du-tournoi-save' || typeof f.schemaVersion !== 'number' || !f.state) throw new Error('This file is not a Cité du Tournoi save.');
  let st = f.state, v = f.schemaVersion;
  if (v > SCHEMA_VERSION) throw new Error(`This save comes from a newer version of the game (save format ${v}, this game reads ${SCHEMA_VERSION}).`);
  while (v < SCHEMA_VERSION) {
    const m = MIGRATIONS[v];
    if (!m) throw new Error(`This save's format (${v}) can no longer be read.`);
    st = m(st); v++;
  }
  if (st.schemaVersion !== v || st.content !== CONTENT_ID || !SLOTS.includes(st.slot) || !(st.day >= 1 && st.day <= (st.flags ? daysOf(st) : DAYS)) || !st.player) {
    throw new Error('This save is damaged or was made with other content.');
  }
  return st;
}

export function hash(st: GameState): string { return fnv64(canonical(st)); }
