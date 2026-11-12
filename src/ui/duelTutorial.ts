import { tx, type TextKey } from '../narrative/text';
import { AUTO_RULES, type AutoFighter } from '../combat/auto';
import { AUTO_COOLDOWN } from '../combat/autoData';
import { autoReactions } from '../combat/autoMatch';
import { el, fillFoot, footBtn } from './style';
import { rich, spotlight, tutorialOn, tutorialStyle } from './tutorial';

/** The first duel's tutorial (the operator's request of 2026-11-09 and his sheet, TU-11 « Pendant le premier duel, figé à chaque première fois »; journal Passe
 *  TU4 for the three-button duel of before), written again for the duel played by the computer (lot 3 of briefs/combat-auto.md § 17.3, journal Passe LC5): in a
 *  version 2 game's bout the replay of the duel's script is held the first time each thing comes up in it, and a band at the foot of the screen says it, the
 *  element of the HUD it speaks of lit as the tour lights its own (TU-2, TU-9). The moments: the duel that plays itself and the order of the four (the bout's
 *  start), a skill charged and its bar, a chain of blows, an action point gained, a guard or a dodge, a skill or a heavy blow landing (the form of the day), a
 *  gauge a third full, a break, ×2 and « Skip » (once the bout has run a while). Every number is the duel's own (src/combat/auto.ts, autoData.ts, the bout's
 *  two fighters and their forms; TU-6). Enter (A) takes the bout up again, Esc (B) skips the lessons left. Each lesson once in this browser (TU-9), its memory
 *  beside the tutorial's (never the save); the guide's « The duel » teaches them again at the next bout (TU-7). A browser driven by a tool keeps the bout
 *  without them unless the address asks for it (`tutorial=1`). Fades only (TU-10; the reduced motion is the game's setting, RG-5). */

export type LessonId = 'start' | 'charge' | 'combo' | 'ap' | 'react' | 'form' | 'gauge' | 'break' | 'speed';
/** an event of the duel's replay (src/arena/autoView.ts: `commandStart`, `impact`, `break`, `ko`...) */
export type DuelEvent = { type: string } & Record<string, unknown>;
const LESSON: Record<LessonId, { title: TextKey; body: TextKey; lit?: (e?: DuelEvent) => string }> = {
  start: { title: 'tut.duel.start.title', body: 'tut.duel.start.body', lit: () => '#ah-bar .ah-b.slot' },
  charge: { title: 'tut.duel.charge.title', body: 'tut.duel.charge.body', lit: () => '#ah-ren .ah-ch' },
  combo: { title: 'tut.duel.combo.title', body: 'tut.duel.combo.body' },
  ap: { title: 'tut.duel.ap.title', body: 'tut.duel.ap.body', lit: () => '#ah-ren .ah-pips' },
  react: { title: 'tut.duel.react.title', body: 'tut.duel.react.body' },
  form: { title: 'tut.duel.form.title', body: 'tut.duel.form.body' },
  gauge: { title: 'tut.duel.gauge.title', body: 'tut.duel.gauge.body', lit: (e) => `#ah-${e?.to === 'ren' ? 'ren' : 'marek'} .ah-rs` },
  break: { title: 'tut.duel.break.title', body: 'tut.duel.break.body', lit: (e) => `#ah-${e?.who === 'ren' ? 'ren' : 'marek'} .ah-rs` },
  speed: { title: 'tut.duel.speed.title', body: 'tut.duel.speed.body', lit: () => '#ah-bar .ah-b.ctl' },
};
export const LESSONS = Object.keys(LESSON) as LessonId[];
/** the share of the break gauge (DB5-4's 70) from which its lesson is said: a third, as the duel of before said it */
export const GAUGE_SHARE = 1 / 3;
/** ×2 and « Skip » are said once the bout has run this long (s on the duel's clock): when the first things have been seen and the bout goes on */
export const SPEED_AT = 20;

/** the lessons' memory: a key of its own (the three-button duel's lessons of journal Passe TU4 were kept under `cite-du-tournoi.duel-lessons`; a browser that
 *  saw those hears these) */
const KEY = 'cite-du-tournoi.auto-lessons', OLD_KEY = 'cite-du-tournoi.duel-lessons';
function seen(): LessonId[] { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; } }
function mark(ids: LessonId[]): void { try { localStorage.setItem(KEY, JSON.stringify([...new Set([...seen(), ...ids])])); } catch { /* a private window forgets */ } }
/** the guide's « teach me again » (TU-7): the lessons said again at the next bout */
export function forgetLessons(): void { try { localStorage.removeItem(KEY); localStorage.removeItem(OLD_KEY); } catch { /* nothing to forget */ } }
export const lessonSeen = (id: LessonId): boolean => seen().includes(id);

/** what a lesson's numbers are read from: the bout's two fighters as the duel built them (Ren first), their forms of the day, their names */
export interface LessonDuel { ren: AutoFighter; foe: AutoFighter; form: readonly [number, number]; names: { ren: string; marek: string } }

const pct = (x: number): number => Math.round(x * 100);
/** a form of the day as the match sheet says it (« +14 », « −5 ») */
const signed = (f: number): string => `${f >= 1 ? '+' : '−'}${Math.round(Math.abs(f - 1) * 100)}`;

/** a lesson's text, its numbers from the duel (TU-6) */
export function lessonText(id: LessonId, d: LessonDuel): string {
  const k = LESSON[id].body, R = AUTO_RULES, foe = d.names.marek;
  switch (id) {
    case 'start': return tx(k, { n: d.ren.skills.length });
    // Ren's light attack's charge at his Speed (DB7-1: × 10 / Speed)
    case 'charge': return tx(k, { light: +((d.ren.light.charge * d.ren.tempo) / Math.max(1, d.ren.viv)).toFixed(2), viv: +d.ren.viv.toFixed(1) });
    case 'combo': return tx(k, { n: d.ren.light.hits?.length ?? 1 });
    case 'ap': return tx(k, { gain: R.ap.light, start: R.ap.start + (d.ren.apStart ?? 0), max: R.ap.max, cool: AUTO_COOLDOWN });
    case 'react': {
      const rr = autoReactions(d.ren, d.foe), fr = autoReactions(d.foe, d.ren);
      return tx(k, { times: R.react.skillGuard, reduce: pct(R.guardReduce), foe, rd: pct(rr.dodge), rg: pct(rr.guard), rgs: pct(rr.guardSkill), fd: pct(fr.dodge), fg: pct(fr.guard) });
    }
    case 'form': return tx(k, { max: pct(R.form), you: signed(d.form[0]), them: signed(d.form[1]), foe });
    case 'gauge': return tx(k, { mul: R.gauge.guardMul });
    case 'break': return tx(k, { stun: R.brk.stun, times: R.brk.dmg });
    default: return tx(k);
  }
}

/** which firsts an event of the duel's replay is (the player is `ren`, the opponent `marek`), in the order they are said */
export function lessonsOf(e: DuelEvent): LessonId[] {
  const out: LessonId[] = [];
  // Ren charges a skill (its bar in the accent, its slot lit at the foot)
  if (e.type === 'commandStart' && e.who === 'ren' && e.kind !== 'light') out.push('charge');
  else if (e.type === 'impact') {
    if (e.from === 'ren' && Number(e.apGain) > 0) out.push('ap');
    if (e.follow === true) out.push('combo');
    if (e.result === 'guarded' || e.result === 'dodged') out.push('react');
    // a skill or a heavy blow that lands: the biggest number of the bout so far, the form in it
    if (e.kind !== 'light' && e.result === 'hit') out.push('form');
    // the target's gauge as the HUD shows it at this blow, this blow's share in it (the replay's `resist`, lot 4), a third full
    if (e.result !== 'dodged' && Number(e.resist) >= AUTO_RULES.gauge.max * GAUGE_SHARE) out.push('gauge');
  } else if (e.type === 'break') out.push('break');
  return out;
}
/** the lesson the duel's clock opens */
export const lessonAt = (t: number): LessonId | null => (t >= SPEED_AT ? 'speed' : null);

export interface CoachArena {
  /** the duel holds (no pause screen) while a lesson is read */
  hold(on: boolean): void;
  /** the bout's fighters (its numbers) */
  data(): LessonDuel | null;
}

/** the coach of a duel: fed the replay's events and clock, it holds the bout at a first and says it */
export class DuelCoach {
  private open: HTMLElement | null = null;
  private queue: Array<{ id: LessonId; e?: DuelEvent }> = [];
  /** what this bout has said (a private window keeps nothing in the browser: nothing is said twice all the same) */
  private said = new Set<LessonId>();
  private off = false;
  private ended = false;
  private unspot: (() => void) | null = null;
  constructor(private arena: CoachArena, params: URLSearchParams = new URLSearchParams(location.search)) { this.off = !tutorialOn(params); }

  /** the bout starts (after « Fight »): its first lesson */
  begin(): void { this.want('start'); }

  /** the replay's events of a step, and the duel's clock after it */
  onEvents(evs: ReadonlyArray<DuelEvent>, t?: number): void {
    if (this.ended || this.off) return;
    // the bout's last blow (its K.O.): nothing holds it, the result follows
    if (evs.some((e) => e.type === 'ko')) { this.ended = true; this.queue = []; return; }
    for (const e of evs) for (const id of lessonsOf(e)) this.want(id, e);
    const at = t === undefined ? null : lessonAt(t);
    if (at) this.want(at);
  }

  get reading(): boolean { return !!this.open; }

  private want(id: LessonId, e?: DuelEvent): void {
    if (this.off || this.ended || this.said.has(id) || lessonSeen(id) || this.queue.some((q) => q.id === id)) return;
    this.queue.push({ id, e });
    if (!this.open) this.next();
  }

  private next(): void {
    this.unspot?.(); this.unspot = null;
    const q = this.queue.shift(), D = this.arena.data();
    if (!q || !D) { this.open = null; document.body.classList.remove('tu-lesson'); this.arena.hold(false); return; }
    const { id, e } = q;
    mark([id]); this.said.add(id);
    tutorialStyle(); document.body.classList.add('tu-lesson');
    this.arena.hold(true);
    const root = el('div', 'pm pm-overlay pm-band tu-band tu-duel'), card = el('div', 'pm-card'), body = el('div', 'pm-body');
    card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', tx(LESSON[id].title));
    body.innerHTML = `<p class="tu-step">${tx('tut.duel.step')}</p><h2 class="pm-h">${tx(LESSON[id].title)}</h2>${rich(lessonText(id, D))}`;
    const since = performance.now();
    const close = (skip: boolean): void => {
      if (!skip && performance.now() - since < 250) return;
      window.removeEventListener('resize', lift);
      root.remove();
      if (skip) { mark(LESSONS); for (const l of LESSONS) this.said.add(l); this.queue = []; }
      this.next();
    };
    const go = footBtn('Enter', tx('tut.duel.go'), () => close(false), true), skip = footBtn('Esc', tx('tut.duel.skip'), () => close(true));
    const foot = el('div', 'pm-foot'); fillFoot(foot, go, skip);
    card.append(body, foot); root.appendChild(card);
    // the duel's keys do not reach the bout while a lesson is read (the arena holds them); Esc skips, Enter goes on
    root.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); close(true); } });
    // the band's words above the HUD's foot (the four, ×2 and « Skip » stay in sight over it, as the tour leaves the interface)
    const lift = (): void => { const r = document.getElementById('ah-bar')?.getBoundingClientRect(); root.style.paddingBottom = r && r.height ? `${Math.round(window.innerHeight - r.top + 14)}px` : ''; };
    window.addEventListener('resize', lift);
    document.body.appendChild(root);
    lift();
    this.open = root;
    // the element spoken of lit once the HUD has drawn this moment
    const sel = LESSON[id].lit?.(e);
    if (sel) this.unspot = spotlight(sel);
    go.focus({ preventScroll: true });
  }
}
