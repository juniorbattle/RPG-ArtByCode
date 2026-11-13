/** The console gamepad, its pure half (journal Passe MN1): the browser's Gamepad API with the standard mapping (an Xbox pad's layout, which
 *  Chrome and Firefox give PlayStation and most other pads too), the family a pad's id names (its prompts: Xbox letters, PlayStation symbols,
 *  Nintendo letters by position), the stick's dead zone, and what each button does in each context of the game. The page's half (the poller,
 *  the synthetic keys, the prompts in the DOM) is src/input/PadInput.ts; these functions and tables run in Node for the tests. */

/** the standard mapping's buttons (https://w3c.github.io/gamepad/#remapping): the face buttons by position, bottom, right, left, top */
export const BTN = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, VIEW: 8, START: 9, LS: 10, RS: 11, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15, HOME: 16 } as const;
export type Btn = (typeof BTN)[keyof typeof BTN];

export type PadFamily = 'xbox' | 'ps' | 'nintendo';

/** the family a pad's id names: Chrome writes « DualSense Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6) », Firefox
 *  « 054c-0ce6-DualSense Wireless Controller »; Sony's vendor 054c, Nintendo's 057e, or the name. Any other pad shows the standard mapping's
 *  own letters, the Xbox ones (Microsoft's 045e among them) */
export function padFamily(id: string): PadFamily {
  const s = id.toLowerCase(), vendor = (v: string) => new RegExp(`(^|[^0-9a-f])${v}([^0-9a-f]|$)`).test(s);
  if (vendor('054c') || /dualsense|dualshock|playstation|\bps[345]\b/.test(s)) return 'ps';
  if (vendor('057e') || /nintendo|pro controller|joy-?con/.test(s)) return 'nintendo';
  return 'xbox';
}

/** the radial dead zone, rescaled: under `dead` nothing, then 0..1 out to the rim (a stick never reaches exactly 1 on every angle) */
export function deadZone(x: number, y: number, dead = DEAD): { x: number; y: number; mag: number } {
  const m = Math.hypot(x, y);
  if (!(m > dead)) return { x: 0, y: 0, mag: 0 };
  const mag = Math.min(1, (m - dead) / (1 - dead - RIM)), k = mag / m;
  return { x: x * k, y: y * k, mag };
}
/** the stick's dead zone and the rim counted as full tilt */
export const DEAD = 0.22, RIM = 0.06;
/** the slowest walk a stick asks for, as a share of the walking speed (a slight tilt walks slowly, full tilt walks at the keyboard's speed) */
export const SLOWEST = 0.3;
/** full tilt runs, when the run is not on a button (MN-2's alternative) */
export const RUN_TILT = 0.96;

export interface PadSnapshot { buttons: boolean[]; axes: number[] }

/** the walk a pad asks for: x to the screen's right, y up the screen (away from the camera), 0..1 its speed as a share of the walk; the
 *  D-pad walks at full speed, else the left stick through its dead zone (from SLOWEST to 1); `run` B held, or full tilt with `tiltRuns` */
export function walkOf(p: PadSnapshot, tiltRuns = false): { x: number; y: number; speed: number; run: boolean } | null {
  const b = p.buttons, dx = (b[BTN.RIGHT] ? 1 : 0) - (b[BTN.LEFT] ? 1 : 0), dy = (b[BTN.UP] ? 1 : 0) - (b[BTN.DOWN] ? 1 : 0);
  if (dx || dy) { const n = Math.hypot(dx, dy); return { x: dx / n, y: dy / n, speed: 1, run: tiltRuns ? false : !!b[BTN.B] }; }
  const s = deadZone(p.axes[0] ?? 0, -(p.axes[1] ?? 0));
  if (!s.mag) return null;
  const n = Math.hypot(s.x, s.y);
  return { x: s.x / n, y: s.y / n, speed: SLOWEST + (1 - SLOWEST) * s.mag, run: tiltRuns ? s.mag >= RUN_TILT : !!b[BTN.B] };
}

/** where the game listens: walking about (`explore`), a page, a list or a dialogue (`page`), a cutscene's line (`scene`), the duel (`duel`) */
export type PadContext = 'explore' | 'page' | 'scene' | 'duel';
/** the context a page is in, from what it shows: a cutscene's line, a modal page (a list, a dialogue, a sheet, the title screen), else the duel or
 *  walking about when the page plays them (null: the pad does nothing here) */
export function contextOf(s: { scene: boolean; modal: boolean; duel: boolean; explore: boolean }): PadContext | null {
  return s.scene ? 'scene' : s.modal ? 'page' : s.duel ? 'duel' : s.explore ? 'explore' : null;
}

/** the keys a button presses for the page, by context: the pad presses the keys the interface shows, so every page answers it through its own
 *  keyboard code (MN-3, MN-4, MN-6). Exploring: A talks (E), Y the list (Q), Start the menu (Esc), View the map (M). A page: A its action
 *  (Enter), B the way out (Esc), X Space (the skills: bring, leave), Start the way out too. A cutscene: A the next line, Start skips */
export const KEYS: Record<Exclude<PadContext, 'duel'>, Partial<Record<Btn, string>>> = {
  explore: { [BTN.A]: 'e', [BTN.Y]: 'q', [BTN.START]: 'Escape', [BTN.VIEW]: 'm' },
  // Y: C, a skill's condition in the tactic (the skills page and the match sheet, lot 2 of the second redesign, journal Passe SL3)
  page: { [BTN.A]: 'Enter', [BTN.B]: 'Escape', [BTN.X]: ' ', [BTN.Y]: 'c', [BTN.START]: 'Escape' },
  scene: { [BTN.A]: 'Enter', [BTN.START]: 'Escape' },
};
/** a page's shoulders (MN-4): the menu's neighbouring page, before and after */
export const TAB: Partial<Record<Btn, -1 | 1>> = { [BTN.LB]: -1, [BTN.RB]: 1 };

/** the next item of a list of `n` from item `i` (-1: none yet) by `delta`, around its ends: none yet goes to the first (forward) or the last */
export function stepIndex(n: number, i: number, delta: number): number {
  if (n <= 0) return -1;
  if (i < 0 || i >= n) return delta >= 0 ? 0 : n - 1;
  return (((i + delta) % n) + n) % n;
}

/** the page a shoulder opens among the menu's pages (MN-4), from the one shown (null: none of them, nothing opens) */
export function tabTo<T>(pages: readonly T[], shown: T | null, dir: -1 | 1): T | null {
  const i = shown === null ? -1 : pages.indexOf(shown);
  return i < 0 ? null : pages[stepIndex(pages.length, i, dir)];
}

/** the version 2's duel (MN-5): X or RT attack (held: the charge), B or LT guard (held), A dodge, Start pause, View the scene page's restart;
 *  the triggers let a charge and the guard be held together while the thumb stays on the dodge. Today's V2_PAD (X, B, A) is kept whole in it */
export const DUEL: Partial<Record<Btn, string>> = { [BTN.X]: 'attack', [BTN.RT]: 'attack', [BTN.B]: 'guard', [BTN.LT]: 'guard', [BTN.A]: 'dodge', [BTN.START]: 'pause', [BTN.VIEW]: 'reset', [BTN.Y]: 'settings',
  // the hand (lot 2 of the second redesign, journal Passe SL3; § 25.5 « la croix de la manette »): the D-pad's up, right, down, left the first to the fourth skill of the order
  [BTN.UP]: 'skill1', [BTN.RIGHT]: 'skill2', [BTN.DOWN]: 'skill3', [BTN.LEFT]: 'skill4' };
/** the duel's commands held down while their button is (any of their buttons) */
export const HELD = new Set(['attack', 'guard']);

/** the buttons pressed and released between two snapshots */
export function edges(prev: readonly boolean[], now: readonly boolean[]): { down: number[]; up: number[] } {
  const down: number[] = [], up: number[] = [];
  for (let i = 0; i < Math.max(prev.length, now.length); i++) { if (now[i] && !prev[i]) down.push(i); else if (!now[i] && prev[i]) up.push(i); }
  return { down, up };
}

/** the duel's commands between two snapshots: a held command goes down when the first of its buttons is pressed and up when the last is let go
 *  (X and RT both on the attack: letting one go while the other holds does not launch the charge) */
export function duelCommands(prev: readonly boolean[], now: readonly boolean[], map: Partial<Record<Btn, string>> = DUEL): Array<{ id: string; down: boolean }> {
  const out: Array<{ id: string; down: boolean }> = [], held = (snap: readonly boolean[], id: string) => Object.entries(map).some(([b, x]) => x === id && !!snap[+b]);
  const seen = new Set<string>();
  for (const [b, id] of Object.entries(map) as Array<[string, string]>) {
    const i = +b;
    if (HELD.has(id)) {
      if (seen.has(id)) continue;
      seen.add(id);
      const was = held(prev, id), is = held(now, id);
      if (is !== was) out.push({ id, down: is });
    } else if (now[i] && !prev[i]) out.push({ id, down: true });
  }
  return out;
}

export type Dir = 'up' | 'down' | 'left' | 'right';
/** the direction a page reads from the D-pad, else the left stick past half tilt (its dominant axis), held until it falls back under 0.35 */
export function navDir(p: PadSnapshot, prev: Dir | null): Dir | null {
  const b = p.buttons;
  if (b[BTN.UP]) return 'up'; if (b[BTN.DOWN]) return 'down'; if (b[BTN.LEFT]) return 'left'; if (b[BTN.RIGHT]) return 'right';
  const x = p.axes[0] ?? 0, y = p.axes[1] ?? 0, m = Math.max(Math.abs(x), Math.abs(y));
  if (m < (prev ? 0.35 : 0.5)) return null;
  return Math.abs(y) >= Math.abs(x) ? (y < 0 ? 'up' : 'down') : (x < 0 ? 'left' : 'right');
}

/** a held direction repeats as a held key does: once at once, again after REPEAT_AFTER, then every REPEAT_EVERY seconds */
export const REPEAT_AFTER = 0.4, REPEAT_EVERY = 0.12;
export class Repeater {
  private dir: Dir | null = null;
  private wait = 0;
  /** `dt` seconds later, the direction now held: the steps to take (0, 1, or more on a long frame), the first one not a repeat */
  step(dir: Dir | null, dt: number): Array<{ dir: Dir; repeat: boolean }> {
    if (dir !== this.dir) { this.dir = dir; this.wait = REPEAT_AFTER; return dir ? [{ dir, repeat: false }] : []; }
    if (!dir) return [];
    this.wait -= dt;
    const out: Array<{ dir: Dir; repeat: boolean }> = [];
    while (this.wait <= 0 && out.length < 4) { out.push({ dir, repeat: true }); this.wait += REPEAT_EVERY; }
    return out;
  }
  get held(): Dir | null { return this.dir; }
}

/** the right stick scrolls a page's detail (the text beside a list, which the D-pad does not reach): px per second at full tilt */
export const SCROLL_SPEED = 900;
export function scrollOf(p: PadSnapshot, dt: number): number { const y = deadZone(0, p.axes[3] ?? 0).y; return y * SCROLL_SPEED * dt; }

/** where a key's cap stands in the interface: the exploring hints (#pm-hints), a cutscene's row, the arena's HUD, the menu's list of pages, elsewhere */
export type CapPlace = 'hints' | 'scene' | 'arena' | 'menu' | 'other';

/** the button a key's cap shows when the pad was the last device used: the keys the pad presses (KEYS, DUEL), in the place the cap stands;
 *  'hide' for a keyboard shortcut the pad reaches through the menu (the menu's J, T, K, G, V; N the mute); null for a cap left as it is */
export function capButton(key: string, where: CapPlace): Btn | 'hide' | null {
  const k = key.trim();
  if (where === 'arena') return ({ J: BTN.X, K: BTN.B, L: BTN.A, R: BTN.VIEW, Space: BTN.START, Esc: BTN.Y } as Record<string, Btn>)[k] ?? null;
  if (k === 'Esc') return where === 'hints' || where === 'scene' ? BTN.START : BTN.B;
  if (k === 'E' || k === 'Enter') return BTN.A;
  if (k === 'Space') return BTN.X;
  if (k === 'C') return BTN.Y;
  // the list's key: Q on QWERTY, A on AZERTY (journal Passe RG2, RG-7)
  if (k === 'Q' || k === 'A') return BTN.Y;
  if (k === 'M') return BTN.VIEW;
  if (where === 'menu' || k === 'N') return 'hide';
  return null;
}

/** the button an action's cap shows (the remapping, journal Passe RM2: RM-6, a cap keeps its action whatever key the player gave it): the walk's directions
 *  on the D-pad, run B held, talk A, the list Y, the map View; in the duel attack X, guard B, dodge A, pause Start; the pages' shortcuts hidden in the menu
 *  (the pad reaches them through it) and left as keys elsewhere, mute hidden everywhere, as their letters were (`capButton`) */
export function bindButton(act: string, where: CapPlace): Btn | 'hide' | null {
  switch (act) {
    case 'up': return BTN.UP; case 'down': return BTN.DOWN; case 'left': return BTN.LEFT; case 'right': return BTN.RIGHT;
    case 'run': return BTN.B; case 'talk': return BTN.A; case 'list': return BTN.Y; case 'map': return BTN.VIEW;
    case 'attack': return BTN.X; case 'guard': return BTN.B; case 'dodge': return BTN.A; case 'pause': return BTN.START;
    case 'skill1': return BTN.UP; case 'skill2': return BTN.RIGHT; case 'skill3': return BTN.DOWN; case 'skill4': return BTN.LEFT;
    case 'mute': return 'hide';
    default: return where === 'menu' ? 'hide' : null;
  }
}

/** the vibration on the player's hits in the duel (MN-9): strength 0..1 and length in ms, by what happened to Ren; nothing for a blow guarded */
export function rumbleOf(e: { type: string; to?: string; result?: string; kind?: string; damage?: number; hp?: number }): { strong: number; weak: number; ms: number } | null {
  if (e.type !== 'impact' || e.to !== 'ren') return null;
  if ((e.hp ?? 1) <= 0) return { strong: 0.8, weak: 0.6, ms: 420 };
  if (e.result === 'guardbreak') return { strong: 0.7, weak: 0.5, ms: 260 };
  if (e.result !== 'hit') return null;
  const heavy = e.kind === 'heavy' || (e.damage ?? 0) >= 20;
  return heavy ? { strong: 0.55, weak: 0.4, ms: 200 } : { strong: 0, weak: 0.35, ms: 110 };
}
