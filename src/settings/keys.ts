/** The player's keys (the operator's remapping sheet, journal Passes RM1 / RM2, ten of ten at the recommendation). Pure: the actions a player may
 *  rebind and the moments they belong to, the starting keys of each keyboard, how a key pressed is named and kept, the swap of a key already taken,
 *  the keys the game and the browser keep, and the check of a stored table. The page's half (the events, the caps, the settings page) reads it.
 *  - RM-1 « Les actions du jeu, les touches des pages fixes »: walking (the four directions, run, talk, the list, the map, the six pages' shortcuts,
 *    mute) and the duel (attack, guard, dodge, pause); Esc, Enter, the pages' arrows and Space stay as they are;
 *  - RM-2 « Deux touches par action, celles d’aujourd’hui au départ »: two slots an action, today's keys at the start, at least one kept;
 *  - RM-3 « Le clavier seul ; la manette garde sa disposition »: the gamepad presses the game's own keys (untrusted events), read as QWERTY's;
 *  - RM-4 « Échanger les deux touches, une liste de touches réservées »: in one moment a key serves one action; the one that had it takes the old key;
 *  - RM-5 « Chaque clavier garde ses touches ; la ligne donne celles de départ »: a key kept by its place (`code`) and the letter it showed;
 *  - RM-9 « Dans les réglages du navigateur, jamais dans la sauvegarde »: each slot checked on reading, a broken one is its default. */

export type KeyLayout = 'qwerty' | 'azerty';
export type Act =
  | 'up' | 'left' | 'down' | 'right' | 'run' | 'talk' | 'list' | 'map'
  | 'journal' | 'board' | 'skills' | 'gear' | 'settings' | 'guide' | 'mute'
  | 'attack' | 'guard' | 'dodge' | 'pause' | 'skill1' | 'skill2' | 'skill3' | 'skill4';
/** where an action is heard: walking about (the town, the squares, Explore, with the list and the pages' shortcuts) or the duel */
export type Moment = 'walk' | 'duel';

/** the actions in the order the settings page shows them */
export const WALK_ACTS: readonly Act[] = ['up', 'down', 'left', 'right', 'run', 'talk', 'list', 'map', 'journal', 'board', 'skills', 'gear', 'settings', 'guide', 'mute'];
/** the duel's: ×2, the guard of the duel of before, « Skip », the pause, and the hand's four skills (the operator's SY-09 « Au prochain choix de Ren, une compétence en
 *  attente », journal Passe SY2: the first to the fourth of the four in their order) */
export const DUEL_ACTS: readonly Act[] = ['attack', 'guard', 'dodge', 'pause', 'skill1', 'skill2', 'skill3', 'skill4'];
/** the hand's actions, the first skill of the order to the fourth */
export const HAND_ACTS: readonly Act[] = ['skill1', 'skill2', 'skill3', 'skill4'];
export const ACTS: readonly Act[] = [...WALK_ACTS, ...DUEL_ACTS];
/** mute is heard everywhere: walking and in the duel */
export const momentsOf = (a: Act): readonly Moment[] => (a === 'mute' ? ['walk', 'duel'] : (DUEL_ACTS as readonly Act[]).includes(a) ? ['duel'] : ['walk']);
/** the walking actions Explore plays: a key bound to one of them takes over Explore's own tool keys (H the panel, F the forge; RM-4) */
export const EXPLORE_ACTS: readonly Act[] = ['up', 'down', 'left', 'right', 'run', 'talk'];

/** a key as kept: its place on the keyboard (`code`, normalised) and what it showed when chosen (`key`, lowercase for a character) */
export interface Slot { c: string; k: string }
export type Pair = readonly [Slot | null, Slot | null];
export type KeyTable = Readonly<Record<Act, Pair>>;
/** what the browser keeps: by keyboard, the actions changed from their starting keys */
export type StoredKeys = Partial<Record<KeyLayout, Partial<Record<Act, [Slot | null, Slot | null]>>>>;

const s = (c: string, k: string): Slot => ({ c, k });
/** today's keys on QWERTY (journal Passe RM1's inventory): the starting keys, and how the gamepad's keys and the tools' are read */
const QWERTY: KeyTable = {
  up: [s('KeyW', 'w'), s('ArrowUp', 'ArrowUp')], left: [s('KeyA', 'a'), s('ArrowLeft', 'ArrowLeft')],
  down: [s('KeyS', 's'), s('ArrowDown', 'ArrowDown')], right: [s('KeyD', 'd'), s('ArrowRight', 'ArrowRight')],
  run: [s('Shift', 'Shift'), null], talk: [s('KeyE', 'e'), s('Space', ' ')], list: [s('KeyQ', 'q'), null], map: [s('KeyM', 'm'), null],
  journal: [s('KeyJ', 'j'), null], board: [s('KeyT', 't'), null], skills: [s('KeyK', 'k'), null], gear: [s('KeyG', 'g'), null],
  settings: [s('KeyV', 'v'), null], guide: [s('KeyH', 'h'), null], mute: [s('KeyN', 'n'), null],
  // the hand's four on the top row's 1 to 4 (lot 2 of the second redesign, journal Passe SL3; § 25.5 « 1 à 4 au clavier »): the attack's second key, 1, of the
  // three-button duel of before, gives its place (in one moment a key serves one action, RM-4)
  attack: [s('KeyJ', 'j'), null], guard: [s('KeyK', 'k'), s('KeyB', 'b')], dodge: [s('KeyL', 'l'), s('KeyA', 'a')], pause: [s('Space', ' '), null],
  skill1: [s('Digit1', '1'), null], skill2: [s('Digit2', '2'), null], skill3: [s('Digit3', '3'), null], skill4: [s('Digit4', '4'), null],
};
/** today's keys on AZERTY (journal Passe RG3, RG-7): Z Q S D walk, A opens the list, M is where AZERTY prints it, the duel's A where AZERTY prints it */
const AZERTY: KeyTable = {
  ...QWERTY,
  up: [s('KeyW', 'z'), s('ArrowUp', 'ArrowUp')], left: [s('KeyA', 'q'), s('ArrowLeft', 'ArrowLeft')],
  list: [s('KeyQ', 'a'), null], map: [s('Semicolon', 'm'), null], dodge: [s('KeyL', 'l'), s('KeyQ', 'a')],
};
export const DEFAULT_KEYS: Readonly<Record<KeyLayout, KeyTable>> = Object.freeze({ qwerty: QWERTY, azerty: AZERTY });

// ---------------------------------------------------------------- a key pressed

/** a key's place, as kept: both Shift keys are one, a keypad digit is its digit (the top row's on AZERTY too), a key without a code takes one from its letter */
export function normCode(code: string, key: string): string {
  if (code === 'ShiftLeft' || code === 'ShiftRight') return 'Shift';
  if (/^Numpad\d$/.test(code) && /^\d$/.test(key)) return `Digit${key}`;
  if (code) return code;
  if (/^[a-z]$/i.test(key)) return `Key${key.toUpperCase()}`;
  if (/^\d$/.test(key)) return `Digit${key}`;
  if (key === ' ') return 'Space';
  return key;
}
/** what a key shows, as kept: a character in lowercase, a named key by its name */
export const labelOf = (key: string): string => (key.length === 1 ? key.toLowerCase() : key);

/** the keys a player may not choose (RM-4): the way out, the pages' action, focus, the function keys, the modifiers the browser and the system keep,
 *  Backspace that empties a slot (RM-8), the locks, and keys a browser cannot name */
const RESERVED_CODES = new Set(['Escape', 'Enter', 'NumpadEnter', 'Tab', 'Backspace', 'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight',
  'OSLeft', 'OSRight', 'ContextMenu', 'CapsLock', 'NumLock', 'ScrollLock', 'PrintScreen', 'Pause', 'Fn', 'FnLock', 'Unidentified', '']);
export function reserved(code: string, key = ''): boolean {
  return RESERVED_CODES.has(code) || /^F\d{1,2}$/.test(code) || ['Dead', 'Process', 'Unidentified', 'AltGraph', 'Escape', 'Enter', 'Tab', 'Backspace'].includes(key);
}

/** the id of a key held or pressed: a real key by its place (a code, capitalised), a key the gamepad or a tool presses by its QWERTY name (lowercase:
 *  the gamepad presses the game's own keys, RM-3, and the tools drive `actors.keys` with « w », « shift ») */
export function keyId(e: { code?: string; key: string; isTrusted?: boolean }): string {
  return e.isTrusted === false ? e.key.toLowerCase() : normCode(e.code ?? '', e.key);
}
const isCode = (id: string): boolean => /^[A-Z]/.test(id);

/** the actions of a moment that a key serves in a table (a QWERTY name: in today's QWERTY keys) */
export function actsOfId(id: string, moment: Moment, table: KeyTable): Act[] {
  const t = isCode(id) ? table : QWERTY;
  const hit = (sl: Slot | null) => !!sl && (isCode(id) ? sl.c === id : sl.k.toLowerCase() === id);
  return ACTS.filter((a) => momentsOf(a).includes(moment) && (hit(t[a][0]) || hit(t[a][1])));
}

/** the key an action shows: its first slot, else its second */
export const firstSlot = (p: Pair): Slot | null => p[0] ?? p[1];

// ---------------------------------------------------------------- the table

/** two actions of one moment on one key (an action's two slots on one key count too) */
export function conflicts(t: KeyTable): Array<{ code: string; moment: Moment; acts: Act[] }> {
  const out: Array<{ code: string; moment: Moment; acts: Act[] }> = [];
  for (const m of ['walk', 'duel'] as const) {
    const by = new Map<string, Act[]>();
    for (const a of ACTS) if (momentsOf(a).includes(m)) for (const sl of t[a]) if (sl) by.set(sl.c, [...(by.get(sl.c) ?? []), a]);
    for (const [code, acts] of by) if (acts.length > 1) out.push({ code, moment: m, acts });
  }
  return out;
}

const okSlot = (v: unknown): v is Slot => {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return typeof o.c === 'string' && /^[A-Za-z0-9]{1,24}$/.test(o.c) && typeof o.k === 'string' && o.k.length >= 1 && o.k.length <= 16 && !reserved(o.c, o.k);
};

/** a keyboard's table from what the browser kept (RM-9): every slot checked, a broken one is its default, an action left without a key its defaults;
 *  a table where two actions of one moment share a key goes back to the starting keys whole */
export function readKeys(stored: unknown, layout: KeyLayout): KeyTable {
  const d = DEFAULT_KEYS[layout];
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return d;
  const o = stored as Record<string, unknown>, t = { ...d } as Record<Act, Pair>;
  for (const a of ACTS) {
    const v = o[a];
    if (!Array.isArray(v) || v.length !== 2) continue;
    const pair = v.map((x, i) => (x === null ? null : okSlot(x) ? { c: x.c, k: x.k } : d[a][i])) as [Slot | null, Slot | null];
    t[a] = pair[0] || pair[1] ? pair : d[a];
  }
  return conflicts(t).length ? d : t;
}

const sameSlot = (a: Slot | null, b: Slot | null): boolean => (a === null ? b === null : !!b && a.c === b.c && a.k === b.k);

/** what to keep in the browser for a keyboard: the actions changed from their starting keys, or nothing */
export function toStored(t: KeyTable, layout: KeyLayout): Partial<Record<Act, [Slot | null, Slot | null]>> | undefined {
  const d = DEFAULT_KEYS[layout], out: Partial<Record<Act, [Slot | null, Slot | null]>> = {};
  for (const a of ACTS) if (!sameSlot(t[a][0], d[a][0]) || !sameSlot(t[a][1], d[a][1])) out[a] = [t[a][0], t[a][1]];
  return Object.keys(out).length ? out : undefined;
}

export type Rebind =
  | { ok: true; table: KeyTable; swaps: Array<{ act: Act; slot: 0 | 1; to: Slot | null }> }
  | { ok: false; why: 'reserved' | 'last' | 'clash'; act?: Act };

/** an action's slot given a key, or emptied (null). In one moment a key serves one action: the action that had it takes the slot's old key (RM-4);
 *  refused: a reserved key, an action left without any key (RM-2), a swap that would put two actions of one moment on one key (mute is heard in both) */
export function rebind(t: KeyTable, act: Act, slot: 0 | 1, key: Slot | null): Rebind {
  const cur = t[act], old = cur[slot], other = cur[1 - slot as 0 | 1];
  if (key === null) {
    if (!old) return { ok: true, table: t, swaps: [] };
    if (!other) return { ok: false, why: 'last', act };
    return { ok: true, table: { ...t, [act]: (slot === 0 ? [null, other] : [other, null]) as Pair }, swaps: [] };
  }
  if (reserved(key.c, key.k)) return { ok: false, why: 'reserved' };
  if (old && old.c === key.c) return { ok: true, table: t, swaps: [] };
  const next = { ...t } as Record<Act, Pair>, swaps: Array<{ act: Act; slot: 0 | 1; to: Slot | null }> = [];
  // the action's other slot held it: the two slots trade places
  const mine: [Slot | null, Slot | null] = [cur[0], cur[1]];
  mine[slot] = key;
  if (other && other.c === key.c) mine[1 - slot] = old;
  next[act] = mine;
  for (const b of ACTS) {
    if (b === act || !momentsOf(b).some((m) => momentsOf(act).includes(m))) continue;
    const p: [Slot | null, Slot | null] = [next[b][0], next[b][1]];
    let hit = false;
    for (const j of [0, 1] as const) if (p[j]?.c === key.c) { p[j] = old; hit = true; swaps.push({ act: b, slot: j, to: old }); }
    if (!hit) continue;
    if (!p[0] && !p[1]) return { ok: false, why: 'last', act: b };
    next[b] = p;
  }
  const bad = conflicts(next);
  if (bad.length) return { ok: false, why: 'clash', act: bad[0].acts.find((a) => a !== act) ?? bad[0].acts[0] };
  return { ok: true, table: next, swaps };
}
