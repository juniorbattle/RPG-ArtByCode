import { tx, type TextKey } from '../narrative/text';
import type { DynData } from '../combat/dynamic';
import { el, fillFoot, footBtn } from './style';
import { rich, tutorialOn, tutorialStyle } from './tutorial';

/** The first duel's tutorial (the operator's request of 2026-11-09 and his sheet, TU-11 « Pendant le premier duel, figé à chaque première fois », lot 2 of TU-12,
 *  journal Passe TU4; written once the duel's rework was in main, journal Passe DB3): during a version 2 duel of a game, the fight is held the first time each thing
 *  comes up (the bout's start, a skill charged, an action point gained, the opponent's sequence, a blow filling its gauge, a break, the riposte) and a band at the
 *  foot of the screen says it, its numbers read from the duel's own data; Enter (A) takes the fight up again, Esc (B) skips the lessons left. Each lesson once in
 *  this browser (TU-9), its memory beside the tutorial's (never the save); the guide's « The duel » teaches them again at the next bout (TU-7). A browser driven by a
 *  tool keeps today's duel unless the address asks for it (`tutorial=1`). Fades only (TU-10). */

export type LessonId = 'start' | 'charge' | 'ap' | 'priority' | 'gauge' | 'break' | 'riposte';
const LESSON: Record<LessonId, { title: TextKey; body: TextKey }> = {
  start: { title: 'tut.duel.start.title', body: 'tut.duel.start.body' },
  charge: { title: 'tut.duel.charge.title', body: 'tut.duel.charge.body' },
  ap: { title: 'tut.duel.ap.title', body: 'tut.duel.ap.body' },
  priority: { title: 'tut.duel.priority.title', body: 'tut.duel.priority.body' },
  gauge: { title: 'tut.duel.gauge.title', body: 'tut.duel.gauge.body' },
  break: { title: 'tut.duel.break.title', body: 'tut.duel.break.body' },
  riposte: { title: 'tut.duel.riposte.title', body: 'tut.duel.riposte.body' },
};
export const LESSONS = Object.keys(LESSON) as LessonId[];
/** the opponent's gauge from which its lesson is said */
export const GAUGE_SHOWN = 30;

const KEY = 'cite-du-tournoi.duel-lessons';
function seen(): LessonId[] { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; } }
function mark(ids: LessonId[]): void { try { localStorage.setItem(KEY, JSON.stringify([...new Set([...seen(), ...ids])])); } catch { /* a private window forgets */ } }
/** the guide's « teach me again » (TU-7): the lessons said again at the next bout */
export function forgetLessons(): void { try { localStorage.removeItem(KEY); } catch { /* nothing to forget */ } }
export const lessonSeen = (id: LessonId): boolean => seen().includes(id);

/** a lesson's text, its numbers from the duel's data */
export function lessonText(id: LessonId, D: DynData): string {
  const k = LESSON[id].body;
  if (id === 'ap') return tx(k, { gain: D.actions.light?.apGain ?? 1, start: D.ap.start, max: D.ap.max });
  if (id === 'priority') return tx(k, { guard: Math.round(D.guard.reduce * 100) });
  if (id === 'break') return tx(k, { stun: D.resist.breakStun, times: D.resist.breakDamage });
  if (id === 'riposte') return tx(k, { n: D.ai.riposte?.after ?? 3 });
  return tx(k);
}

/** which first an event of the duel is (the player is `ren`, the opponent `marek`) */
export function lessonOf(e: { type: string } & Record<string, unknown>): LessonId | null {
  if (e.type === 'chargeTier' && (e.idx as number) >= 1) return 'charge';
  if (e.type === 'apGain' && e.who === 'ren') return 'ap';
  if (e.type === 'sequenceStart' && e.who === 'marek') return 'priority';
  // the gauge once it shows (a third of it filled): not on the first blow, which already teaches the action points
  if (e.type === 'impact' && e.from === 'ren' && e.to === 'marek' && e.result !== 'dodged' && (e.resist as number) >= GAUGE_SHOWN) return 'gauge';
  if (e.type === 'break' && e.who === 'marek') return 'break';
  if (e.type === 'riposte') return 'riposte';
  return null;
}

export interface CoachArena {
  /** the duel holds (no pause screen) while a lesson is read */
  hold(on: boolean): void;
  /** the duel's data (its numbers) */
  data(): DynData | null;
}

/** the coach of a duel: fed the duel's events, it holds the fight at a first and says it */
export class DuelCoach {
  private open: HTMLElement | null = null;
  private queue: LessonId[] = [];
  private off = false;
  constructor(private arena: CoachArena, params: URLSearchParams = new URLSearchParams(location.search)) { this.off = !tutorialOn(params); }

  /** the bout starts (after « Fight »): its first lesson */
  begin(): void { this.want('start'); }

  /** the duel's events as they come */
  onEvents(evs: ReadonlyArray<{ type: string } & Record<string, unknown>>): void { for (const e of evs) { const l = lessonOf(e); if (l) this.want(l); } }

  get reading(): boolean { return !!this.open; }

  private want(id: LessonId): void {
    if (this.off || lessonSeen(id) || this.queue.includes(id)) return;
    this.queue.push(id);
    if (!this.open) this.next();
  }

  private next(): void {
    const id = this.queue.shift(), D = this.arena.data();
    if (!id || !D) { this.open = null; document.body.classList.remove('tu-lesson'); this.arena.hold(false); return; }
    mark([id]);
    tutorialStyle(); document.body.classList.add('tu-lesson');
    this.arena.hold(true);
    const root = el('div', 'pm pm-overlay pm-band tu-band tu-duel'), card = el('div', 'pm-card'), body = el('div', 'pm-body');
    card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', tx(LESSON[id].title));
    body.innerHTML = `<p class="tu-step">${tx('tut.duel.step')}</p><h2 class="pm-h">${tx(LESSON[id].title)}</h2>${rich(lessonText(id, D))}`;
    const since = performance.now();
    const close = (skip: boolean): void => {
      if (!skip && performance.now() - since < 250) return;
      root.remove();
      if (skip) { mark(LESSONS); this.queue = []; }
      this.next();
    };
    const go = footBtn('Enter', tx('tut.duel.go'), () => close(false), true), skip = footBtn('Esc', tx('tut.duel.skip'), () => close(true));
    const foot = el('div', 'pm-foot'); fillFoot(foot, go, skip);
    card.append(body, foot); root.appendChild(card);
    // the duel's keys do not reach the fight while a lesson is read (the arena holds them); Esc skips, Enter fights on
    root.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); } });
    document.body.appendChild(root);
    this.open = root;
    go.focus({ preventScroll: true });
  }
}
