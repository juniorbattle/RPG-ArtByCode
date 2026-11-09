import { contextOf, duelCommands, edges, KEYS, navDir, padFamily, Repeater, rumbleOf, scrollOf, stepIndex, TAB, walkOf, type Dir, type PadContext, type PadFamily, type PadSnapshot } from './pad';
import { capKey, prompts } from './prompts';
import { tx } from '../narrative/text';

/** The console gamepad in the page (journal Passes MN1 / MN2; the operator's sheet, eleven of eleven: MN-1 « La version 2 et la navigation de
 *  l’écran titre », MN-2 to MN-11). One poller for the town, the squares, every page, the title screen and the arena's duel of a version 2 game:
 *  - it starts when the browser announces a pad (`gamepadconnected`) or holds one already, and reads whichever pad was used last; nothing runs
 *    without a pad, and nothing of the page changes until one is used;
 *  - the pad presses the keys the interface shows (src/input/pad.ts, `KEYS`): synthetic key events on the element in focus, so every page answers
 *    it through its own keyboard code; the walk goes to the scene as a vector (`walk`), the duel's commands to the arena (`duel`);
 *  - the caps show the pad's buttons while it was the last device used (src/input/prompts.ts), the keys again at a key press or a click;
 *  - the duel's hits make it rumble (MN-9, `rumbleOf`), its switch kept by the browser (`padSettings`); a line says when the sound waits for a
 *    click or a key (MN-10).
 *  Pure decisions live in pad.ts (the tests); this file only reads the pads and touches the DOM. */

export interface PadWalk { x: number; y: number; speed: number; run: boolean }
export interface PadHooks {
  /** walking about: the walk the pad asks for, null when it asks none */
  walk?(w: PadWalk | null): void;
  /** the version 2's duel: a command down or up (attack and guard held) */
  duel?(id: string, down: boolean): void;
  /** a page's shoulders: the menu's neighbouring page */
  tab?(dir: -1 | 1): void;
  /** the version 2's sound engine (loaded on demand by the page): whether it waits for a gesture, and the attempt to start it */
  sound?(): Promise<{ readonly asleep: boolean; unlock(): Promise<void> }>;
}

const SETTINGS = 'cite-du-tournoi.pad';
/** the pad's settings, per browser (MN-9: the vibration on by default) */
export function padSettings(): { vibration: boolean } {
  try { const v = JSON.parse(localStorage.getItem(SETTINGS) ?? '{}') as { vibration?: boolean }; return { vibration: v.vibration !== false }; } catch { return { vibration: true }; }
}
export function setPadSettings(s: { vibration: boolean }): void { try { localStorage.setItem(SETTINGS, JSON.stringify(s)); } catch { /* a convenience only */ } }

/** what counts as a modal page: the title screen, a sheet on the full-screen veil, a band at the foot of the screen (a dialogue, the list, the news) */
const MODALS = '#title-screen, .pm-overlay, .pm-talk';
const FOCUSABLE = 'button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])';
const shown = (e: Element): boolean => (e as HTMLElement).getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden';

const CSS = `#pm-padsound{left:50%;top:12px;transform:translateX(-50%);z-index:45;padding:8px 52px;white-space:nowrap;pointer-events:none;font-size:var(--ds-fs-small);color:var(--ds-ivory);background:var(--ds-grad-spot);opacity:0;transition:opacity .2s}
#pm-padsound.on{opacity:1}
@media (prefers-reduced-motion:reduce){#pm-padsound{transition:none}}`;

export class PadInput {
  private hooks: PadHooks = {};
  /** each pad's buttons at the last frame, by its index */
  private prev = new Map<number, boolean[]>();
  /** the pad used last */
  private active: number | null = null;
  /** the last device used, and the pad's family */
  mode: 'keys' | 'pad' = 'keys';
  family: PadFamily = 'xbox';
  private ctx: PadContext | null = null;
  private rep = new Repeater();
  private dir: Dir | null = null;
  private walking = false;
  private held = new Set<string>();
  private running = false;
  private last = 0;
  private sound: { readonly asleep: boolean; unlock(): Promise<void> } | null = null;
  private soundAsked = false;
  private line: HTMLElement | null = null;
  private lineAt = 0;
  /** a pad was seen on this page (the sound page shows the vibration's switch) */
  seen = false;
  /** what the pad did, for the proofs (the last 200) */
  readonly log: string[] = [];
  private off: Array<() => void> = [];

  constructor() {
    const on = (t: string, f: (e: Event) => void, capture = false): void => { addEventListener(t, f, capture); this.off.push(() => removeEventListener(t, f, capture)); };
    on('gamepadconnected', () => this.start());
    on('gamepaddisconnected', (e) => { const i = (e as GamepadEvent).gamepad?.index; if (i === undefined) return; this.prev.delete(i); if (i === this.active) { this.leave(); this.active = null; } });
    // the last device used: a key pressed or a click gives every cap its key back (the pad's own events are synthetic, never trusted)
    on('keydown', (e) => { if (e.isTrusted) this.use('keys'); }, true);
    on('pointerdown', (e) => { if (e.isTrusted) this.use('keys'); }, true);
    if (this.pads().length) this.start();
  }

  /** a page adds what it plays (the town its walk and its pages, the arena its duel) */
  merge(h: PadHooks): void { Object.assign(this.hooks, h); }

  /** the page goes away (the title screen's « Explore the district »): the caps given back, nothing listened to */
  dispose(): void { this.running = false; this.leave(); prompts().set(null); this.line?.remove(); for (const f of this.off) f(); this.off = []; if (current === this) current = null; }

  /** the duel's events: the player's hits make the pad rumble (MN-9) */
  duelEvents(evs: ReadonlyArray<{ type: string } & Record<string, unknown>>): void {
    if (this.mode !== 'pad' || !padSettings().vibration) return;
    for (const e of evs) { const r = rumbleOf(e as never); if (r) this.rumble(r); }
  }

  private rumble(r: { strong: number; weak: number; ms: number }): void {
    const p = this.pads().find((x) => x.index === this.active) as (Gamepad & { vibrationActuator?: { playEffect?(t: string, o: object): Promise<unknown> } }) | undefined;
    const act = p?.vibrationActuator;
    if (!act?.playEffect) return;
    this.note(`rumble ${r.strong}/${r.weak} ${r.ms}ms`);
    void act.playEffect('dual-rumble', { startDelay: 0, duration: r.ms, strongMagnitude: r.strong, weakMagnitude: r.weak }).catch(() => {});
  }

  private pads(): Gamepad[] {
    const g = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
    return [...(g ?? [])].filter((p): p is Gamepad => !!p && p.connected !== false);
  }

  private start(): void {
    this.seen = true;
    if (this.running) return;
    this.running = true; this.last = performance.now();
    const loop = (t: number): void => { if (!this.running) return; const dt = Math.min(0.1, Math.max(0, (t - this.last) / 1000)); this.last = t; this.frame(dt); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }

  private note(s: string): void { this.log.push(s); if (this.log.length > 200) this.log.shift(); }

  private use(mode: 'keys' | 'pad', family?: PadFamily): void {
    if (mode === 'keys') { if (this.mode === 'pad') { this.mode = 'keys'; this.leave(); this.ctx = null; prompts().set(null); this.note('keys'); } return; }
    if (this.mode !== 'pad' || this.family !== family) { this.mode = 'pad'; this.family = family ?? 'xbox'; prompts().set({ family: this.family, style: 'outline' }); this.note(`pad ${this.family}`); }
  }

  /** one frame: which pad speaks, the context, its commands */
  private frame(dt: number): void {
    const pads = this.pads();
    for (const p of pads) {
      const now = p.buttons.map((b) => b.pressed), was = this.prev.get(p.index) ?? [];
      const pressed = edges(was, now).down.length > 0, moved = Math.hypot(p.axes[0] ?? 0, p.axes[1] ?? 0) > 0.5 || Math.hypot(p.axes[2] ?? 0, p.axes[3] ?? 0) > 0.5;
      if (pressed || moved) {
        if (this.active !== null && this.active !== p.index) this.leave();
        this.active = p.index; this.use('pad', padFamily(p.id));
        if (pressed) this.wake();
      }
    }
    const p = pads.find((x) => x.index === this.active);
    const was = p ? this.prev.get(p.index) ?? [] : [];
    this.prev = new Map(pads.map((x) => [x.index, x.buttons.map((b) => b.pressed)]));
    this.soundLine(dt);
    if (!p || this.mode !== 'pad') { this.leave(); return; }
    const snap: PadSnapshot = { buttons: p.buttons.map((b) => b.pressed), axes: [...p.axes] };
    const ctx = this.context();
    if (ctx !== this.ctx) {
      const from = this.ctx;
      this.leave(); this.ctx = ctx; this.rep = new Repeater(); this.dir = null;
      // a direction held from one context into another (walking into a dialogue) does not walk its list until it is let go and pressed again;
      // the pad's first press on a page is a press
      if (from !== null) { this.dir = navDir(snap, null); this.rep.step(this.dir, 0); }
    }
    const down = edges(was, snap.buttons).down;
    if (ctx === 'explore') {
      const w = walkOf(snap);
      if (w || this.walking) { this.walking = !!w; this.hooks.walk?.(w); }
      for (const b of down) { const k = KEYS.explore[b as keyof typeof KEYS.explore]; if (k) this.press(document.body, k); }
    } else if (ctx === 'scene') {
      for (const b of down) { const k = KEYS.scene[b as keyof typeof KEYS.scene]; if (k) this.press(document.body, k); }
    } else if (ctx === 'duel') {
      for (const c of duelCommands(was, snap.buttons)) {
        if (c.down) this.held.add(c.id); else this.held.delete(c.id);
        this.note(`duel ${c.id} ${c.down ? 'down' : 'up'}`);
        this.hooks.duel?.(c.id, c.down);
      }
    } else if (ctx === 'page') {
      this.dir = navDir(snap, this.dir);
      for (const s of this.rep.step(this.dir, dt)) this.nav(s.dir, s.repeat);
      for (const b of down) {
        const k = KEYS.page[b as keyof typeof KEYS.page], t = TAB[b as keyof typeof TAB];
        if (k) this.pageKey(k); else if (t) { this.note(`tab ${t}`); this.hooks.tab?.(t); }
      }
      const dy = scrollOf(snap, dt);
      if (dy) this.scroll(dy);
    }
  }

  /** what the page shows decides where the pad speaks */
  private context(): PadContext | null {
    return contextOf({ scene: !!document.querySelector('.pm-scene'), modal: !!this.modal(), duel: !!this.hooks.duel, explore: !!this.hooks.walk });
  }

  /** the topmost modal page shown */
  private modal(): HTMLElement | null {
    const all = [...document.querySelectorAll<HTMLElement>(MODALS)].filter(shown);
    return all[all.length - 1] ?? null;
  }

  /** leaving a context: the walk stops, a held command is let go */
  private leave(): void {
    if (this.walking) { this.walking = false; this.hooks.walk?.(null); }
    for (const id of this.held) this.hooks.duel?.(id, false);
    this.held.clear();
  }

  /** a key pressed and released on an element, as the keyboard would; whether the page took it (preventDefault) */
  private press(t: EventTarget, key: string, init: KeyboardEventInit = {}): boolean {
    this.note(`key ${key === ' ' ? 'Space' : key}`);
    const code = key === ' ' ? 'Space' : key.length === 1 ? `Key${key.toUpperCase()}` : key;
    const d = new KeyboardEvent('keydown', { key, code, bubbles: true, cancelable: true, composed: true, ...init });
    t.dispatchEvent(d);
    t.dispatchEvent(new KeyboardEvent('keyup', { key, code, bubbles: true, cancelable: true, composed: true }));
    return d.defaultPrevented;
  }

  /** the element a page's key goes to: the one in focus inside the topmost page, else that page's first button, focused */
  private target(root: HTMLElement): { el: HTMLElement; fresh: boolean } {
    const a = document.activeElement as HTMLElement | null;
    if (a && a !== document.body && root.contains(a)) return { el: a, fresh: false };
    const first = this.focusables(root)[0] ?? root;
    first.focus?.();
    return { el: first, fresh: true };
  }

  private focusables(root: HTMLElement): HTMLElement[] { return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(shown); }

  /** A, B, X, Start on a page: the key the page answers, then what the keyboard's own default would do (a button pressed by Enter) */
  private pageKey(key: string): void {
    const root = this.modal(); if (!root) return;
    if (key === ' ') {
      // X presses the page's Space only where a cap shows it (the skills: bring, leave); elsewhere it does nothing
      // (a cap in a text, the tutorial's « [Space] bargains », is not a button: journal Passe TU3)
      const foot = [...root.querySelectorAll('kbd')].find((k) => capKey(k) === 'Space' && !!k.closest('button'))?.closest('button');
      if (foot && !(foot as HTMLButtonElement).disabled) { this.note('key Space'); foot.click(); }
      return;
    }
    const { el } = this.target(root);
    const took = this.press(el, key);
    if (key === 'Enter' && !took && (el instanceof HTMLButtonElement || el instanceof HTMLAnchorElement) && !(el as HTMLButtonElement).disabled) el.click();
    // the title screen's name: B goes back as its Back button does (the keyboard's Esc answers in the field only)
    if (key === 'Escape' && !took && root.id === 'title-screen' && !(el instanceof HTMLInputElement)) root.querySelector<HTMLElement>('[data-pad-back]')?.click();
  }

  /** the D-pad or the stick on a page: the page's arrows first (its lists), else the next or previous thing to press, a slider's value left and right */
  private nav(dir: Dir, repeat: boolean): void {
    const root = this.modal(); if (!root) return;
    const { el, fresh } = this.target(root);
    if (fresh) { this.note(`focus ${dir}`); return; }
    if ((dir === 'left' || dir === 'right') && el instanceof HTMLInputElement && el.type === 'range') {
      const step = Number(el.step) || 1, v = Math.min(Number(el.max || 100), Math.max(Number(el.min || 0), Number(el.value) + (dir === 'right' ? step : -step)));
      if (String(v) !== el.value) { el.value = String(v); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }
      this.note(`slider ${v}`);
      return;
    }
    const arrow = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }[dir];
    if (dir === 'up' || dir === 'down') { if (this.press(el, arrow, { repeat })) return; }
    const all = this.focusables(root), i = all.indexOf(el), next = all[stepIndex(all.length, i, dir === 'up' || dir === 'left' ? -1 : 1)];
    next?.focus(); this.note(`focus ${dir}`);
  }

  /** the right stick: the page's text beside its list (the detail), else whatever scrolls in it */
  private scroll(dy: number): void {
    const root = this.modal(); if (!root) return;
    const box = [...root.querySelectorAll<HTMLElement>('.pm-detail, .pm-scroll, .pm-body')].find((b) => b.scrollHeight > b.clientHeight + 1);
    if (box) box.scrollTop += dy;
  }

  /** a pad button: the sound tries to start (the browser may refuse a pad's press: MN-10) */
  private wake(): void {
    if (this.sound) { if (this.sound.asleep) void this.sound.unlock(); return; }
    if (this.soundAsked || !this.hooks.sound) return;
    this.soundAsked = true;
    void this.hooks.sound().then((s) => { this.sound = s; void s.unlock(); }).catch(() => {});
  }

  /** MN-10: a discreet line while the pad is used and the sound waits for a click or a key */
  private soundLine(dt: number): void {
    this.lineAt -= dt;
    if (this.lineAt > 0) return;
    this.lineAt = 0.5;
    const want = this.mode === 'pad' && !!this.sound?.asleep;
    if (want && !this.line) {
      if (!document.getElementById('pm-padsound-css')) { const st = document.createElement('style'); st.id = 'pm-padsound-css'; st.textContent = CSS; document.head.appendChild(st); }
      this.line = document.createElement('div'); this.line.id = 'pm-padsound'; this.line.className = 'pm'; this.line.setAttribute('role', 'status');
      this.line.textContent = tx('v2.pad.sound');
      document.body.appendChild(this.line);
      requestAnimationFrame(() => this.line?.classList.add('on'));
    }
    if (this.line) this.line.classList.toggle('on', want);
  }
}

let current: PadInput | null = null;
/** the page's pad (one per page), with what this page plays */
export function installPad(hooks: PadHooks = {}): PadInput {
  current ??= new PadInput();
  current.merge(hooks);
  (window as unknown as { __pad: PadInput }).__pad = current;
  return current;
}
/** the page's pad if one was installed */
export function pad(): PadInput | null { return current; }
