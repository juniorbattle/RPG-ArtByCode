import { placeName, type GameState, type PlaceId, type SlotId } from '../simulation';
import { lang, num, shortName, skillName, tx, type TextKey } from '../narrative/text';
import { PEOPLE } from '../narrative/people';
import { POINTS } from '../narrative/roster';
import { CHAMPION_PURSE, V2_DAY_KIND, V2_DAYS } from '../tournament/v2calendar';
import { PURSES } from '../tournament/pool';
import { WORK } from '../simulation/v2work';
import { LAW, marksOf } from '../simulation/v2law';
import { CHALLENGERS, STAKE, STEAL_FINE } from '../simulation/v2town';
import { RUMOUR, STRONGROOM } from '../simulation/v2intel';
import { argChance, DISCOUNT } from '../simulation/v2barter';
import { fameTier, type FameTier } from '../simulation/v2react';
import { INJURY_HP, TRAIN_MAX } from '../simulation/v2gear';
import { REN_BASE, TRAIN_HP, TRAIN_POINT, VIGOUR_HP } from '../combat/stats';
import { AUTO_RULES } from '../combat/auto';
import { AUTO_COOLDOWN, AUTO_WEAPONS } from '../combat/autoData';
import { autoOrderView } from '../simulation/preview';
import { v2KitOf } from '../simulation/v2';
import { forgetLessons } from './duelTutorial';
import { arrowKeys, el, esc, fillFoot, footBtn, pickRow, scrollFade } from './style';
import { bindCap, keyCap } from '../input/caps';
import type { Act } from '../settings/keys';

/** The tutorial of the default game (the operator's request of 2026-11-09 and his sheet, journal Passes TU1 / TU2 / TU3): a tour of six bands over the live page
 *  at the start of every new game (TU-2, TU-9), each pointing at the real element; a guide of twelve chapters in the menu and on H, from which the tour is replayed
 *  (TU-7); eight hints, each shown once in this browser the first time its thing comes up (TU-3); one line once on a game begun before (TU-8). Its pictures come
 *  from the game as it runs, no image is baked (TU-4): the scene here, each place kept in picture as the player walks there, the real interface, the tournament
 *  drawn from the state; its numbers are read from the game's data as it shows them (TU-6); its texts are neutral, short, in the second person (TU-5), in the
 *  texts' table (`tut.*`), every key in a cap (`[E]` in a text: the gamepad's and the keyboard layout's caps follow). What was seen lives in the browser's storage,
 *  never in the save. It moves by fades only (TU-10: the reduced motion is the game's own setting, journal Passe RG2). A browser driven by a tool keeps today's
 *  flow (as the cutscenes: `navigator.webdriver`) unless the address asks for the tutorial (`tutorial=1`; `tutorial=0` turns it off). */

// ------------------------------------------------------------------------------------------------ what was seen, in the browser (never the save)

const SEEN_KEY = 'cite-du-tournoi.tutorial', PLACES_KEY = 'cite-du-tournoi.places';
interface Seen { hints: string[]; told?: boolean }
function readJson<T>(k: string, d: T): T { try { const v = localStorage.getItem(k); return v ? { ...d, ...JSON.parse(v) } : d; } catch { return d; } }
function writeJson(k: string, v: unknown): void { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* a private window: the tutorial forgets */ } }
const seenNow = (): Seen => readJson<Seen>(SEEN_KEY, { hints: [] });
export const hintSeen = (id: HintId): boolean => seenNow().hints.includes(id);
export function markHint(id: HintId): void { const s = seenNow(); if (!s.hints.includes(id)) s.hints.push(id); writeJson(SEEN_KEY, s); }
/** the guide has been shown or said once (TU-8: a game begun before hears it in one line) */
export const told = (): boolean => !!seenNow().told;
export function markTold(): void { writeJson(SEEN_KEY, { ...seenNow(), told: true }); }

/** whether this page shows the tutorial: the address's `tutorial`, else every browser a person uses (a tool's driven browser keeps today's flow) */
export function tutorialOn(params: URLSearchParams = new URLSearchParams(location.search)): boolean {
  const t = params.get('tutorial');
  return t === '1' || (t !== '0' && !navigator.webdriver);
}

/** TU-4: a place's picture, kept as the player walks there (a small WebP of the live scene, the latest visit's) */
export function keepPlace(place: PlaceId, snap: () => HTMLCanvasElement | null): void {
  try {
    const c = snap(); if (!c || !c.width) return;
    const w = 640, h = Math.round((w * c.height) / c.width), small = document.createElement('canvas');
    small.width = w; small.height = h;
    small.getContext('2d')!.drawImage(c, 0, 0, w, h);
    const url = small.toDataURL('image/webp', 0.72);
    if (!url.startsWith('data:image/')) return;
    writeJson(PLACES_KEY, { ...readJson<Record<string, string>>(PLACES_KEY, {}), [place]: url });
  } catch { /* the picture waits for the next visit */ }
}
const keptPlaces = (): Record<string, string> => readJson<Record<string, string>>(PLACES_KEY, {});

// ------------------------------------------------------------------------------------------------ texts: keys in caps, numbers from the data

/** the caps a text may hold: `[E]` talk, `[Q]` the list, `[Menu]` the menu (Esc, the pad's Start), `[M]` the map, `[Space]`, `[Enter]`, `[Back]` (Esc in a page),
 *  `[J]`, `[K]`, `[L]` the duel's attack, guard and dodge, `[Move]` the walk's four keys, `[Run]` the run. An action's cap shows the player's key, a fixed
 *  key's its name in the page's language (the remapping, journal Passe RM2: RM-6, RM-7; src/input/caps.ts) */
const hints = 'data-cap="hints"', arena = 'data-cap="arena"';
const CAPS: Record<string, () => string> = {
  E: () => bindCap('talk', hints), Q: () => bindCap('list', hints), Menu: () => keyCap('Esc', hints), M: () => bindCap('map', hints),
  Space: () => keyCap('Space'), Enter: () => keyCap('Enter'), Back: () => keyCap('Esc'),
  // the duel's keys (journal Passe TU4): the pad's buttons in the duel; in the duel played by the computer the attack's key is ×2 and the dodge's « Skip »
  // (journal Passe LC3, LC3-8: renamed at lot 5)
  J: () => bindCap('attack', arena), K: () => bindCap('guard', arena), L: () => bindCap('dodge', arena),
  Move: () => (['up', 'left', 'down', 'right'] as const).map((a) => bindCap(a, hints)).join(''), Run: () => bindCap('run', hints),
  // the order of the four moved on the match sheet and the skills page (journal Passe LC3): the player's left and right
  Left: () => bindCap('left'), Right: () => bindCap('right'),
  // the tactic's key on the skills page and the match sheet, and the hand's four in the duel (lot 2 of the second redesign, journal Passe SL3)
  C: () => keyCap('C'), Hand: () => (['skill1', 'skill2', 'skill3', 'skill4'] as const).map((a) => bindCap(a, arena)).join(''),
};
const CAP_TOKEN = /\[(E|Q|Menu|M|Space|Enter|Back|J|K|L|Move|Run|Left|Right|C|Hand)]/g;
/** a line of the table, its caps drawn and the rest escaped */
export const inline = (t: string): string => esc(t).replace(CAP_TOKEN, (_, k: string) => CAPS[k]());
/** a text of the table as paragraphs, its caps drawn and the rest escaped */
export function rich(t: string, first = ''): string {
  return t.split('\n').map((p, i) => `<p${i === 0 && first ? ` class="${first}"` : ''}>${inline(p)}</p>`).join('');
}
const pct = (x: number): number => Math.round(x * 100);
/** « 2, 4 and 5 » */
function list(xs: Array<string | number>): string { return xs.length < 2 ? String(xs[0] ?? '') : tx('tut.and', { a: xs.slice(0, -1).join(', '), b: xs[xs.length - 1] }); }
const daysOfKind = (...k: string[]): number[] => Object.entries(V2_DAY_KIND).filter(([, v]) => k.includes(v)).map(([d]) => +d);
const dayOf = (k: string): number => daysOfKind(k)[0];
const nameOf = (id: string): string => PEOPLE[id]?.name ?? id;
/** a place in a chapter's text: without its article in English (« the Arena Forecourt » read « Arena Forecourt »), with it in French, where the table finds it
 *  and the article meets the word before it (journal Passe RG4) */
/** the town's four jobs, with their employers (journal Passe ECO2) */
const jobsLine = (): string => tx('tut.money.jobs', { mara: nameOf('mara'), corvin: nameOf('corvin'), hilde: nameOf('hilde'), lio: nameOf('lio') });
const placeShort = (p: PlaceId): string => (lang() === 'fr' ? placeName(p, true) : placeName(p, true).replace(/^the /, ''));
/** the player's first bout's day */
const firstBout = (s: GameState): number => Math.min(...s.tournament.matches.filter((m) => m.a === 'player' || m.b === 'player').map((m) => m.day), dayOf('pool'));

// ------------------------------------------------------------------------------------------------ the tour (TU-2, TU-7, TU-9)

/** a band of the tour: its words, what it points at */
export const TOUR: Array<{ title: TextKey; body: TextKey; at?: 'status' | 'figs' | 'list' | 'menu' }> = [
  { title: 'tut.tour.welcome.title', body: 'tut.tour.welcome.body' }, { title: 'tut.tour.clock.title', body: 'tut.tour.clock.body', at: 'status' },
  { title: 'tut.tour.figs.title', body: 'tut.tour.figs.body', at: 'figs' }, { title: 'tut.tour.list.title', body: 'tut.tour.list.body', at: 'list' },
  { title: 'tut.tour.menu.title', body: 'tut.tour.menu.body', at: 'menu' }, { title: 'tut.tour.end.title', body: 'tut.tour.end.body' },
];
/** a band's text, its numbers from the game */
function tourText(s: GameState, k: TextKey): string {
  return k === 'tut.tour.figs.body' ? tx(k, { max: LAW.wanted }) : k === 'tut.tour.end.body' ? tx(k, { day: firstBout(s) }) : k === 'tut.tour.clock.body' ? tx(k, { slot: tx('ui.oneSlot') }) : tx(k);
}

export interface TourStep { title: TextKey; body: TextKey; target?: () => Element | null }

/** the tour: one band per step at the foot of the screen, the element it speaks of lit by a one-pixel rule and the rest of the screen veiled (the light appears
 *  at its place, it does not slide); Enter (A) goes on, Esc (B) leaves the tour. Resolves with whether it was seen to its end. */
export function runTour(s: GameState, steps: TourStep[]): Promise<boolean> {
  style();
  const spot = el('div', 'pm tu-spot');
  document.body.appendChild(spot);
  document.body.classList.add('tu-on');
  return new Promise((done) => {
    let i = 0, band: HTMLElement | null = null, since = 0;
    const finish = (seen: boolean): void => { document.body.classList.remove('tu-on'); band?.remove(); spot.remove(); window.removeEventListener('resize', place); done(seen); };
    const place = (): void => {
      const r = steps[i]?.target?.()?.getBoundingClientRect();
      spot.classList.remove('on');
      if (!r || !r.width) return;
      const pad = 8;
      Object.assign(spot.style, { left: `${r.left - pad}px`, top: `${r.top - pad}px`, width: `${r.width + 2 * pad}px`, height: `${r.height + 2 * pad}px` });
      void spot.offsetWidth; spot.classList.add('on');
    };
    const show = (): void => {
      band?.remove();
      const st = steps[i], last = i === steps.length - 1;
      band = el('div', 'pm pm-overlay pm-band tu-band');
      const card = el('div', 'pm-card'), body = el('div', 'pm-body');
      card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', tx(st.title));
      body.innerHTML = `<p class="tu-step">${tx('tut.tour.step', { n: i + 1, of: steps.length })}</p><h2 class="pm-h">${tx(st.title)}</h2>${rich(tourText(s, st.body))}`;
      // a key held from the page before (the news' Enter) does not press the band's first button: a press counts after 0.25 s
      const next = footBtn('Enter', last ? tx('tut.tour.end') : tx('tut.tour.next'), () => { if (performance.now() - since < 250) return; if (last) finish(true); else { i++; show(); } }, true);
      const skip = last ? null : footBtn('Esc', tx('tut.tour.skip'), () => finish(false));
      const foot = el('div', 'pm-foot'); fillFoot(foot, next, skip);
      card.append(body, foot); band.appendChild(card);
      band.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (skip) skip.click(); else { since = 0; next.click(); } } });
      document.body.appendChild(band);
      since = performance.now();
      next.focus({ preventScroll: true });
      place();
    };
    window.addEventListener('resize', place);
    show();
  });
}

/** the tour's light over a part of the screen that is not a band's own (the first duel's lessons, journal Passe LC5): a one-pixel rule round every element
 *  `sel` names (their union), the rest of the scene veiled; it appears at its place once the page has drawn, it does not slide. Returns its removal. */
export function spotlight(sel: string): () => void {
  style();
  const spot = el('div', 'pm tu-spot');
  document.body.appendChild(spot);
  let raf = 0;
  const place = (): void => {
    const rs = [...document.querySelectorAll(sel)].map((x) => x.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0);
    spot.classList.remove('on');
    if (!rs.length) return;
    const pad = 8, l = Math.min(...rs.map((r) => r.left)), t = Math.min(...rs.map((r) => r.top)), r = Math.max(...rs.map((x) => x.right)), b = Math.max(...rs.map((x) => x.bottom));
    Object.assign(spot.style, { left: `${l - pad}px`, top: `${t - pad}px`, width: `${r - l + 2 * pad}px`, height: `${b - t + 2 * pad}px` });
    void spot.offsetWidth; spot.classList.add('on');
  };
  raf = requestAnimationFrame(() => { raf = requestAnimationFrame(place); });
  window.addEventListener('resize', place);
  return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', place); spot.remove(); };
}

// ------------------------------------------------------------------------------------------------ the hints (TU-3, TU-8)

export type HintId = 'square' | 'shop' | 'steal' | 'mark' | 'eve' | 'challenge' | 'evening' | 'hurt' | 'guide' | 'poor' | 'vigour' | 'npcMark';
const HINT: Record<HintId, { title: TextKey; body: TextKey; chapter: string }> = {
  square: { title: 'tut.hint.square.title', body: 'tut.hint.square.body', chapter: 'places' },
  shop: { title: 'tut.hint.shop.title', body: 'tut.hint.shop.body', chapter: 'shops' },
  steal: { title: 'tut.hint.steal.title', body: 'tut.hint.steal.body', chapter: 'law' },
  mark: { title: 'tut.hint.mark.title', body: 'tut.hint.mark.body', chapter: 'law' },
  eve: { title: 'tut.hint.eve.title', body: 'tut.hint.eve.body', chapter: 'prepare' },
  challenge: { title: 'tut.hint.challenge.title', body: 'tut.hint.challenge.body', chapter: 'challenges' },
  evening: { title: 'tut.hint.evening.title', body: 'tut.hint.evening.body', chapter: 'intel' },
  hurt: { title: 'tut.hint.hurt.title', body: 'tut.hint.hurt.body', chapter: 'prepare' },
  guide: { title: 'tut.hint.guide.title', body: 'tut.hint.guide.body', chapter: 'tournament' },
  // a purchase refused for want of coins, the first time (the operator's ECO-7, journal Passe ECO2): where to work
  poor: { title: 'tut.hint.poor.title', body: 'tut.hint.poor.body', chapter: 'money' },
  // the operator's DB11-5 « Le dire partout » (journal Passe DB13): after the first bout won, how Ren's health grows
  vigour: { title: 'tut.hint.vigour.title', body: 'tut.hint.vigour.body', chapter: 'prepare' },
  // the first person marked on the scene (the operator's MK-11 « La liste, un conseil et une ligne du guide », journal Passe MK2): the diamond's three forms
  npcMark: { title: 'tut.hint.npcMark.title', body: 'tut.hint.npcMark.body', chapter: 'moving' },
};
function hintText(s: GameState, id: HintId, who?: string): string {
  const k = HINT[id].body;
  if (id === 'steal') return tx(k, { max: LAW.wanted });
  if (id === 'mark') return tx(k, { n: marksOf(s), max: LAW.wanted, hale: nameOf('hale') });
  if (id === 'challenge') return tx(k, { name: nameOf(who ?? '') });
  if (id === 'hurt') return tx(k, { wound: pct(INJURY_HP), anwen: nameOf('anwen') });
  if (id === 'eve') return tx(k, { odo: nameOf('odo'), room: STRONGROOM });
  if (id === 'evening') return tx(k, { lio: RUMOUR.lio.coins, stranger: RUMOUR.stranger.coins });
  if (id === 'poor') return tx(k, { pay: WORK.pay, jobs: jobsLine(), mara: nameOf('mara') });
  if (id === 'vigour') return tx(k, { n: VIGOUR_HP, train: TRAIN_HP });
  return tx(k);
}
export const hintChapter = (id: HintId): string => HINT[id].chapter;

/** a hint: a band falling from the top of the screen (the bands at the foot stay readable under it), Enter (A) « got it », Space (X) the guide's chapter, Esc
 *  closes too; the focus goes back where it was. Resolves with what was pressed. */
export function showHint(s: GameState, id: HintId, who?: string): Promise<'ok' | 'more'> {
  style();
  const back = document.activeElement as HTMLElement | null;
  const root = el('div', 'pm pm-overlay pm-band tu-hint'), card = el('div', 'pm-card'), body = el('div', 'pm-body');
  card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', tx(HINT[id].title));
  body.innerHTML = `<h2 class="pm-h">${tx(HINT[id].title)}</h2>${rich(hintText(s, id, who))}`;
  return new Promise((done) => {
    let since = 0;
    const end = (r: 'ok' | 'more', now = false): void => { if (!now && performance.now() - since < 250) return; root.remove(); back?.focus?.({ preventScroll: true }); done(r); };
    const ok = footBtn('Enter', tx('tut.hint.ok'), () => end('ok'), true), more = footBtn('Space', tx('tut.hint.more'), () => end('more'));
    const foot = el('div', 'pm-foot'); fillFoot(foot, ok, more);
    card.append(body, foot); root.appendChild(card);
    root.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); end(e.key === ' ' ? 'more' : 'ok', true); }
      else if (e.key.startsWith('Arrow')) e.stopPropagation();
    });
    document.body.appendChild(root);
    since = performance.now();
    ok.focus({ preventScroll: true });
  });
}

// ------------------------------------------------------------------------------------------------ the guide (TU-1, TU-4, TU-6, TU-7)

export interface GuideHost {
  state(): GameState;
  /** the live scene as an image (the page renders a frame and reads its canvas), or null */
  snapshot?(): string | null;
  /** the tour again, from the guide (TU-7) */
  replay?(): void;
}

type Fig = 'days' | 'moments' | 'scene' | 'places' | 'odds' | 'marks' | 'fame' | 'order' | 'none';
interface Chapter { id: string; title: TextKey; line: TextKey; body: TextKey; fig: Fig; keys?: 'explore' | 'duel' | 'all' }
export const CHAPTERS: Chapter[] = [
  { id: 'tournament', title: 'tut.ch.tournament.title', line: 'tut.ch.tournament.line', body: 'tut.ch.tournament.body', fig: 'days' },
  { id: 'time', title: 'tut.ch.time.title', line: 'tut.ch.time.line', body: 'tut.ch.time.body', fig: 'moments' },
  { id: 'moving', title: 'tut.ch.moving.title', line: 'tut.ch.moving.line', body: 'tut.ch.moving.body', fig: 'scene', keys: 'explore' },
  { id: 'places', title: 'tut.ch.places.title', line: 'tut.ch.places.line', body: 'tut.ch.places.body', fig: 'places' },
  { id: 'shops', title: 'tut.ch.shops.title', line: 'tut.ch.shops.line', body: 'tut.ch.shops.body', fig: 'odds' },
  { id: 'money', title: 'tut.ch.money.title', line: 'tut.ch.money.line', body: 'tut.ch.money.body', fig: 'none' },
  { id: 'law', title: 'tut.ch.law.title', line: 'tut.ch.law.line', body: 'tut.ch.law.body', fig: 'marks' },
  { id: 'challenges', title: 'tut.ch.challenges.title', line: 'tut.ch.challenges.line', body: 'tut.ch.challenges.body', fig: 'none' },
  { id: 'intel', title: 'tut.ch.intel.title', line: 'tut.ch.intel.line', body: 'tut.ch.intel.body', fig: 'none' },
  { id: 'renown', title: 'tut.ch.renown.title', line: 'tut.ch.renown.line', body: 'tut.ch.renown.body', fig: 'fame' },
  { id: 'prepare', title: 'tut.ch.prepare.title', line: 'tut.ch.prepare.line', body: 'tut.ch.prepare.body', fig: 'none' },
  { id: 'duel', title: 'tut.ch.duel.title', line: 'tut.ch.duel.line', body: 'tut.ch.duel.body', fig: 'order' },
  { id: 'keys', title: 'tut.ch.keys.title', line: 'tut.ch.keys.line', body: 'tut.ch.keys.body', fig: 'none', keys: 'all' },
];

/** a chapter's text, its numbers read from the game's data (TU-6) */
export function chapterText(s: GameState, c: Chapter): string {
  switch (c.id) {
    case 'tournament': return tx(c.body, { days: V2_DAYS, pool: list(daysOfKind('pool', 'cut')), win: POINTS.win, close: POINTS.close, loss: POINTS.loss, cut: dayOf('cut'), semis: dayOf('semis'), major: dayOf('major'), final: dayOf('final'), free: list(daysOfKind('free')) });
    // the ways out's chevrons (the operator's MK-15 « Une ligne du guide, pas de conseil », journal Passe MK5), a line after the chapter's text
    case 'places': return `${tx(c.body, { quay: placeShort('district'), a: placeShort('forecourt'), b: placeShort('training'), c: placeShort('lanterns') })}\n${tx('tut.ch.places.ways')}`;
    case 'shops': return tx(c.body, { mara: nameOf('mara'), hilde: nameOf('hilde'), corvin: nameOf('corvin'), pip: nameOf('pip'), bram: nameOf('bram') });
    case 'money': return tx(c.body, { jobs: jobsLine(), pay: WORK.pay, mara: nameOf('mara'), pool: PURSES.pool[0], poolL: PURSES.pool[1], semi: PURSES.semi[0], semiL: PURSES.semi[1], semiDay: dayOf('semis'), third: PURSES.third[0], thirdL: PURSES.third[1], majorDay: dayOf('major'), final: PURSES.final[0], finalL: PURSES.final[1], champ: CHAMPION_PURSE });
    case 'law': return tx(c.body, { day: STEAL_FINE.day, night: STEAL_FINE.night, max: LAW.wanted, fee: LAW.fee, hale: nameOf('hale') });
    case 'challenges': return tx(c.body, { names: list(Object.keys(CHALLENGERS).map(nameOf)), coins: STAKE.coins, name: STAKE.name, day: dayOf('semis') });
    case 'intel': return tx(c.body, { lio: RUMOUR.lio.coins, lioPct: pct(RUMOUR.lio.truth), stranger: RUMOUR.stranger.coins, odo: nameOf('odo'), room: STRONGROOM });
    // the duel played by the computer (lot 3, journal Passe LC5): the order of the four, the match sheet, the health of a bout (AUTO_RULES.hpScale, DB5)
    case 'prepare': return tx(c.body, { train: TRAIN_POINT, trainHp: TRAIN_HP, base: REN_BASE.hp, vigour: VIGOUR_HP, sessions: TRAIN_MAX, hp: AUTO_RULES.hpScale, wound: pct(INJURY_HP), anwen: nameOf('anwen') });
    // its numbers the duel's own (src/combat/auto.ts AUTO_RULES, src/combat/autoData.ts: the cooldown, the weapons' chains of blows)
    case 'duel': {
      const R = AUTO_RULES, hits = Object.values(AUTO_WEAPONS).map((w) => w.hits.length);
      return tx(c.body, { gain: R.ap.light, start: R.ap.start, max: R.ap.max, cool: AUTO_COOLDOWN, lo: Math.min(...hits), hi: Math.max(...hits), times: R.react.skillGuard, reduce: pct(R.guardReduce), stun: R.brk.stun, dmg: R.brk.dmg, form: pct(R.form) });
    }
    case 'renown': return tx(c.body, { hale: nameOf('hale'), parade: Math.max(...daysOfKind('free')) });
    case 'time': return tx(c.body, { slot: tx('ui.oneSlot') });
    // the marks over the heads and the plan in the corner (MK-11), a line after the chapter's text
    case 'moving': return `${tx(c.body)}\n${tx('tut.ch.moving.marks')}\n${tx('tut.ch.moving.todo')}`;
    default: return tx(c.body);
  }
}

/** the day's kind, as the board says it */
const KIND: Record<string, TextKey> = { arrival: 'tut.kind.arrival', pool: 'tut.kind.pool', free: 'tut.kind.free', cut: 'tut.kind.cut', semis: 'tut.kind.semis', major: 'tut.kind.major', final: 'tut.kind.final' };
const SLOT: Record<SlotId, TextKey> = { morning: 'tut.slot.morning', afternoon: 'tut.slot.afternoon', evening: 'tut.slot.evening' };
const FAME_WORD: Record<FameTier, TextKey> = { unknown: 'tut.fame.unknown', noticed: 'tut.fame.noticed', known: 'tut.fame.known', celebrated: 'tut.fame.celebrated' };

/** what illustrates a chapter: drawn from the state, or the live scene, or the places as the player saw them */
function figure(s: GameState, fig: Fig, here: () => string | null): string {
  if (fig === 'days') {
    const bouts = new Set(s.tournament.matches.filter((m) => m.a === 'player' || m.b === 'player').map((m) => m.day));
    return `<div class="tu-days" aria-hidden="true">${Array.from({ length: V2_DAYS }, (_, i) => {
      const d = i + 1, k = V2_DAY_KIND[d], bout = bouts.has(d) || k === 'semis' || k === 'major' || k === 'final';
      return `<div class="${d === s.day ? 'now' : bout ? 'bout' : ''}"><b>${d}</b><small>${tx(KIND[k])}</small></div>`;
    }).join('')}</div>`;
  }
  if (fig === 'moments') return `<div class="tu-row" aria-hidden="true">${(['morning', 'afternoon', 'evening'] as SlotId[]).map((k) => `<div class="${k === s.slot ? 'now' : ''}"><b>${tx(SLOT[k])}</b><small>${k === s.slot ? tx('tut.fig.now') : '&nbsp;'}</small></div>`).join('')}</div>`;
  if (fig === 'scene') { const u = here(); return u ? `<figure class="tu-fig"><img src="${u}" alt=""><figcaption>${tx('tut.fig.here')}</figcaption></figure>` : ''; }
  if (fig === 'places') {
    const kept = keptPlaces(), u = here();
    return `<div class="tu-places">${(['district', 'forecourt', 'training', 'lanterns'] as PlaceId[]).map((p) => {
      const img = p === s.place && u ? u : kept[p];
      return `<figure class="tu-fig${img ? '' : ' unseen'}">${img ? `<img src="${img}" alt="">` : `<span>${tx('tut.fig.unseen')}</span>`}<figcaption>${esc(shortName(placeName(p, true)))}</figcaption></figure>`;
    }).join('')}</div>`;
  }
  if (fig === 'odds') {
    const keeper = 'mara', rows: Array<[TextKey, number, number]> = [['tut.odds.name', argChance(s, 'name', keeper), DISCOUNT.name], ['tut.odds.friend', argChance(s, 'friend', keeper), DISCOUNT.friend], ['tut.odds.pair', argChance(s, 'pair', keeper), DISCOUNT.pair]];
    return `<div class="tu-odds"><p class="pm-sub">${tx('tut.fig.odds', { name: esc(nameOf(keeper)) })}</p>${rows.map(([k, c, d]) => `<div><span>${tx(k)}</span><b>${tx('tut.odds.value', { pct: pct(c), off: pct(d) })}</b></div>`).join('')}</div>`;
  }
  if (fig === 'marks') {
    const n = marksOf(s);
    return `<div class="tu-marks" aria-hidden="true">${Array.from({ length: LAW.wanted }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}<span>${tx('tut.fig.marks', { n, max: LAW.wanted })}</span></div>`;
  }
  if (fig === 'fame') {
    const t = fameTier(s);
    return `<div class="tu-row" aria-hidden="true"><div class="num"><b>${s.player.reputation}</b><small>${tx('ui.reputation')}</small></div>${(Object.keys(FAME_WORD) as FameTier[]).map((k) => `<div class="${k === t ? 'now' : ''}"><b>${tx(FAME_WORD[k])}</b><small>${k === t ? tx('tut.fig.you') : '&nbsp;'}</small></div>`).join('')}</div>`;
  }
  // the duel played by the computer (journal Passe LC5): the player's order of the four as the duel will follow it, each with its AP and its charge at Ren's
  // Speed, as the match sheet and the skills page show it (autoOrderView), then the light attack
  if (fig === 'order' && s.v2) {
    const rows = autoOrderView(s, [...v2KitOf(s).loadout]).map((o, i) => `<div><span>${i + 1}. ${esc(skillName(o.id))}</span><b>${tx('v2.skills.ap', { ap: o.ap })} · ${num(o.charge)} s</b></div>`).join('');
    return `<div class="tu-odds tu-order"><p class="pm-sub">${tx('ui.order.title')}</p>${rows}<div><span>${esc(tx('ui.skill.light'))}</span><b>${tx('ui.order.else')}</b></div></div>`;
  }
  return '';
}

/** the keys of a chapter: the exploring keys (the pad's in their place), the duel's, or all of them (the keyboard's shortcuts hidden on a gamepad) */
function keysHtml(which: 'explore' | 'duel' | 'all'): string {
  // the player's keys (the remapping, journal Passe RM2, RM-6): an action's cap, a fixed key's name
  const row = (cap: string, t: TextKey, cls = '') => `<div class="tu-k${cls}">${cap}<span>${inline(tx(t))}</span></div>`;
  const h = (x: Act) => bindCap(x, hints), a = (x: Act) => bindCap(x, arena), p = (k: string) => keyCap(k);
  const explore = row('', 'tut.key.walk') + row(h('talk'), 'tut.key.talk') + row(h('list'), 'tut.key.list') + row(keyCap('Esc', hints), 'tut.key.menu') + row(h('map'), 'tut.key.map');
  // the duel played by the computer (journal Passes LC3, LC5): the attack's key ×2, the dodge's « Skip », the pause; the guard's does nothing there (LC3-8:
  // the duel's actions renamed at lot 5)
  const duel = row(a('attack'), 'tut.key.attack') + row(a('dodge'), 'tut.key.dodge') + row(a('pause'), 'tut.key.pause');
  if (which === 'explore') return `<div class="tu-keys">${explore}</div>`;
  if (which === 'duel') return `<div class="tu-keys">${duel}</div>`;
  const pages = row(p('Enter'), 'tut.key.confirm') + row(p('Esc'), 'tut.key.back') + row(p('Space'), 'tut.key.space');
  const kb = (x: Act, t: TextKey) => row(bindCap(x), t, ' kb');
  const short = kb('journal', 'tut.key.journal') + kb('board', 'tut.key.board') + kb('skills', 'tut.key.skills') + kb('gear', 'tut.key.gear') + kb('settings', 'tut.key.settings') + kb('guide', 'tut.key.guide') + kb('mute', 'tut.key.mute');
  return `<p class="pm-sub">${tx('tut.keys.explore')}</p><div class="tu-keys">${explore}</div><p class="pm-sub">${tx('tut.keys.pages')}</p><div class="tu-keys">${pages}</div>`
    + `<p class="pm-sub kb">${tx('tut.keys.short')}</p><div class="tu-keys">${short}</div><p class="pm-sub">${tx('tut.keys.duel')}</p><div class="tu-keys">${duel}</div>`;
}

/** the guide's page: the chapters on the left, the chapter selected on the right (the journal's structure, journal Passe UM11); Space (X) replays the tour */
export function guidePage(host: GuideHost, close: () => void, first?: string): { root: HTMLElement; focus(): void } {
  style();
  const s = host.state(), root = el('div', 'pm pm-overlay'), card = el('div', 'pm-card pm-two pm-days tu-guide');
  card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', tx('tut.guide'));
  card.innerHTML = `<section class="pm-col"><header class="pm-head"><h2 class="pm-h">${tx('tut.guide')}</h2><p>${tx('tut.guide.sub')}</p></header><div class="pm-glist pm-grow"></div></section>`
    + `<section class="pm-col"><header class="pm-head"><h2 class="pm-h"></h2></header><div class="pm-detail pm-grow"></div><div class="pm-foot"></div></section>`;
  root.appendChild(card);
  const list = card.querySelector('.pm-glist') as HTMLElement, detail = card.querySelector('.pm-detail') as HTMLElement, title = card.querySelector('section:last-child .pm-h') as HTMLElement;
  const out = footBtn('Esc', tx('ui.close'), close), fit = scrollFade(detail);
  const replay = host.replay ? footBtn('Space', tx('tut.guide.replay'), () => { if (at.id === 'duel') { forgetLessons(); detail.insertAdjacentHTML('beforeend', `<p class="tu-done" role="status">${tx('tut.duel.again.done')}</p>`); fit(); } else host.replay!(); }) : null;
  fillFoot(card.querySelector('.pm-foot') as HTMLElement, replay, out);
  // the live scene, taken once when a chapter first asks for it
  let scene: string | null | undefined;
  const here = (): string | null => (scene === undefined ? (scene = host.snapshot?.() ?? null) : scene);
  let at: Chapter = CHAPTERS[0];
  const show = (c: Chapter): void => {
    at = c;
    // the duel's chapter: Space teaches the duel again at the next bout (journal Passe TU4); elsewhere it replays the tour
    if (replay) replay.querySelector('span')!.textContent = tx(c.id === 'duel' ? 'tut.duel.again' : 'tut.guide.replay');
    title.textContent = tx(c.title);
    detail.innerHTML = figure(s, c.fig, here) + rich(chapterText(s, c), 'tu-lead') + (c.keys ? keysHtml(c.keys) : '');
    detail.scrollTop = 0; fit();
  };
  const rows = CHAPTERS.map((c) => list.appendChild(pickRow(`<span>${tx(c.title)}<span class="why">${tx(c.line)}</span></span>`, { select: () => show(c), press: () => {} })));
  arrowKeys(list); scrollFade(list);
  // a window without the system's focus gets no focus event (the arrows move the focus all the same): the chapter follows the row the arrows reached
  list.addEventListener('keydown', (e) => {
    if (!e.key.startsWith('Arrow')) return;
    const i = rows.indexOf(document.activeElement as HTMLButtonElement);
    if (i >= 0 && CHAPTERS[i] !== at) { rows.forEach((r) => r.classList.toggle('on', r === rows[i])); show(CHAPTERS[i]); }
  });
  card.addEventListener('keydown', (e) => { if (e.key === ' ' && replay) { e.preventDefault(); e.stopPropagation(); replay.click(); } });
  const start = Math.max(0, CHAPTERS.findIndex((c) => c.id === first));
  // the first chapter is shown at once, focus event or not
  rows[start].classList.add('on'); show(CHAPTERS[start]);
  return { root, focus: () => { (rows[start] ?? out).focus(); } };
}

// ------------------------------------------------------------------------------------------------ the style (the design system's tokens, fades only)

const CSS = `
.tu-spot{position:fixed;z-index:29;pointer-events:none;border:1px solid var(--ds-accent);box-shadow:0 0 0 200vmax color-mix(in srgb,var(--ds-ink) 38%,transparent);opacity:0;transition:opacity .2s}
.tu-spot.on{opacity:1}
body.tu-on #pm-hints{z-index:41}
/* the light veils the scene and leaves the interface's texts as they are (its rule marks the element spoken of) */
.tu-band .pm-card,.tu-hint .pm-card{display:block;max-width:1620px}
.tu-band .tu-step{margin:0 0 4px;font-size:var(--ds-fs-small);color:var(--ds-muted)}
.tu-band .pm-h,.tu-hint .pm-h{margin:0 0 6px}
.tu-band p,.tu-hint p{max-width:820px}
.tu-band .pm-foot,.tu-hint .pm-foot{padding-top:14px}
.tu-band .pm-foot .out{margin-left:0}
.pm-overlay.pm-band.tu-band{animation:ds-fade .2s ease-out}
.pm-overlay.pm-band.tu-hint{inset:0 0 auto 0;z-index:42;padding:28px var(--ds-gutter) 72px;background:linear-gradient(to bottom,var(--ds-veil-strong) 0,var(--ds-veil) calc(100% - 72px),transparent 100%);animation:ds-fade .2s ease-out}
body.pm-full .pm-overlay.pm-band.tu-hint{background:linear-gradient(to bottom,var(--ds-ink) 0,var(--ds-ink) calc(100% - 72px),transparent 100%)}
.tu-fig{position:relative;margin:0 0 14px;aspect-ratio:16/9;max-height:34vh;overflow:hidden;border-top:1px solid var(--ds-line);border-bottom:1px solid var(--ds-line);background:var(--ds-veil-strong)}
.tu-fig img{display:block;width:100%;height:100%;object-fit:cover}
.tu-fig figcaption{position:absolute;left:0;right:0;bottom:0;padding:18px 12px 6px;font-size:var(--ds-fs-small);color:var(--ds-ivory);background:linear-gradient(to top,var(--ds-veil-strong) 0,var(--ds-veil-strong) 58%,transparent 100%)}
.tu-fig.unseen span{position:absolute;inset:0;display:grid;place-items:center;font-size:var(--ds-fs-small);color:var(--ds-muted)}
.tu-places{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:0 0 6px}
.tu-places .tu-fig{margin:0;max-height:none}
.tu-days,.tu-row{display:grid;gap:6px;margin:0 0 14px}
.tu-days{grid-template-columns:repeat(10,minmax(0,1fr))}
.tu-row{grid-auto-flow:column;grid-auto-columns:minmax(0,1fr)}
.tu-days div,.tu-row div{padding:8px 0 6px;border-top:2px solid var(--ds-line);text-align:center;min-width:0}
.tu-days div.bout{border-top-color:var(--ds-ivory)}
.tu-days div.now,.tu-row div.now{border-top-color:var(--ds-accent)}
.tu-days b{display:block;font:400 var(--ds-fs-fig)/1 var(--ds-title)}
.tu-row b{display:block;font:400 var(--ds-fs-label)/1.2 var(--ds-title);overflow-wrap:anywhere}
.tu-row .num b{font-size:var(--ds-fs-fig)}
.tu-row div.now b{color:var(--ds-accent)}
.tu-days small,.tu-row small{display:block;margin-top:4px;font-size:var(--ds-fs-small);color:var(--ds-muted);overflow-wrap:anywhere}
.tu-odds{margin:0 0 14px}
.tu-odds .pm-sub{margin:0 0 4px}
.tu-odds div{display:flex;justify-content:space-between;gap:16px;padding:6px 0;border-top:1px solid var(--ds-line)}
.tu-odds b{font-weight:400;white-space:nowrap}
.tu-marks{display:flex;align-items:center;gap:10px;margin:0 0 14px}
.tu-marks i{width:28px;height:28px;border:1px solid var(--ds-muted)}
.tu-marks i.on{background:var(--ds-accent);border-color:var(--ds-accent)}
.tu-marks span{margin-left:8px;font-size:var(--ds-fs-body);color:var(--ds-muted)}
.tu-keys{display:grid;grid-template-columns:minmax(0,1fr);gap:6px;margin:6px 0 10px}
.tu-k{display:grid;grid-template-columns:64px minmax(0,1fr);align-items:baseline;column-gap:14px}
.tu-k>kbd{justify-self:start}
.tu-k>span:only-child{grid-column:1 / 3}
.tu-k span{font-size:var(--ds-fs-body)}
.pm-col .pm-detail p.tu-done{color:var(--ds-accent)}
.pm-col .pm-detail p.tu-lead{font-size:var(--ds-fs-label);line-height:1.3;margin:0 0 8px}
.pm-detail p kbd,.tu-band p kbd,.tu-hint p kbd,.tu-k>span kbd{margin:0 2px}
body.pm-pad .tu-k.kb,body.pm-pad .pm-sub.kb{display:none}
/* a duel's lesson (journal Passes TU4, LC5): the duel's HUD stays over its band (the cards, the four, ×2 and « Skip » in sight, as the tour leaves the
   interface: the light veils the scene, its rule marks the element spoken of), its own veil at the foot gives way to the band's, its buttons wait */
body.tu-lesson #arena-hud{z-index:41}
body.tu-lesson #arena-hud .bot{visibility:hidden}
body.tu-lesson #ah-bar{pointer-events:none}
@media (max-width:700px){.tu-days{grid-template-columns:repeat(5,minmax(0,1fr))}.tu-fig{max-height:24vh}.tu-places{grid-template-columns:repeat(4,minmax(0,1fr))}.pm-overlay.pm-band.tu-hint{padding:12px 16px 40px}}
@media (max-height:480px) and (min-width:701px){.pm-overlay .pm-card.pm-two.tu-guide{display:grid;grid-template-columns:minmax(0,280px) minmax(0,1fr);column-gap:28px}.tu-guide .pm-col{min-height:0}.tu-fig{max-height:30vh}.tu-places{grid-template-columns:repeat(4,minmax(0,1fr))}}
`;
export function tutorialStyle(): void { style(); }
function style(): void { if (!document.getElementById('tu-css')) { const s = el('style'); s.id = 'tu-css'; s.textContent = CSS; document.head.appendChild(s); } }
