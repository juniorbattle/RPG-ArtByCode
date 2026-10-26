import type { TimeOfDay } from '../atmosphere/DayState';
import { actions, advance, hash, lookOf, makeV2, namedState, newGame, wantsV2, type Action, type GameState } from '../simulation';
import { loadingError, toneLoading } from './loading';
import { readSave, writeSave } from './save';

/** The play mode's entry (journal Passe L3; `?play=1`, the tools' way in, and later the title screen's « New game » / « Continue »): the game
 *  state comes from the save (or a new game), and the page shows the scene of the state's place: the district (the town, App), or the
 *  arena for the day's bout (`&scene=arena`). Moving to another scene, or to another slot (whose day state changes the town's look), is a save
 *  then a reload: no scene ever changes its day state while it runs (choice G2).
 *  `window.__game` drives it for the proofs: `state()`, `actions()`, `act(action)` (the state saved; `reload` says whether the page would
 *  reload), `hash()`, `subscribe(f)`. */

export interface Boot { canvas: HTMLCanvasElement; params: URLSearchParams; label: HTMLElement; bar: HTMLElement; loading: HTMLElement }

/** the tools' parameters carried from the address into every play-mode page (measurements, captures, culling checks) */
const CARRY = ['fps', 'vis', 'viscache', 'painters', 'res', 'msaa', 'refl', 'camera', 'player', 'static', 'occ', 'freeze', 'gpuprof', 'noreload', 'spriteedge', 'npcfacing', 'dyn'];

/** the address of a play-mode page, the carried parameters kept */
export function playUrl(params: URLSearchParams, extra: Record<string, string> = {}): string {
  const q = new URLSearchParams({ play: '1' });
  for (const k of CARRY) if (params.has(k)) q.set(k, params.get(k)!);
  for (const [k, v] of Object.entries(extra)) q.set(k, v);
  return `?${q.toString()}`;
}

/** goes to another play-mode page (after the state is saved); `?noreload=1` keeps the page, for harnesses that read the save */
export function go(params: URLSearchParams, extra: Record<string, string> = {}): void {
  (window as any).__go = playUrl(params, extra);
  if (!params.has('noreload')) location.assign(playUrl(params, extra));
}

/** `&combat=dynamic` on a new game (or a named state): the game is played under the rules of the « tour par tour dynamique »
 *  (`flags.combat`, src/tournament/pool.ts `dynamicRules`; journal Passes C1 / C2), its duels in the arena's DynamicSim and its off-screen
 *  matches in their race; the flag lives in the save. Behind this parameter until the operator's trial (CB-10); absent = the game of today */
export function withRules(s: GameState, params: URLSearchParams): GameState {
  if (params.get('combat') === 'dynamic') s.flags.combat = 'dynamic';
  // `&v2=1`: the version 2 (src/simulation/v2.ts, the operator's decision AV-2), the dynamic rules with it; absent = the game of today
  if (wantsV2((k) => params.get(k))) makeV2(s);
  return s;
}

export function startingState(params: URLSearchParams): { state: GameState; note?: string } {
  // DEV only: a named state (PROJECT § 10.3) for reviews and proofs
  if (import.meta.env.DEV && params.has('state')) return { state: withRules(namedState(params.get('state')!, Number(params.get('seed') ?? 1842) >>> 0, params.get('name') ?? 'Ren'), params) };
  if (params.has('new')) return { state: withRules(newGame(Number(params.get('seed') ?? 1842) >>> 0, params.get('name') ?? 'Ren'), params) };
  const r = readSave();
  if (r.state) return { state: r.state };
  return { state: newGame(1842, params.get('name') ?? 'Ren'), note: r.error };
}

/** the game API of a page: the current state, its actions, applying one (saved at once) */
export function installGameApi(get: () => GameState, set: (s: GameState) => void, after: (prev: GameState, next: GameState, a: Action) => boolean): void {
  const subs: Array<() => void> = [];
  (window as any).__game = {
    /** the page's interface redraws after any action, its own or a harness's */
    subscribe: (f: () => void) => { subs.push(f); },
    state: () => get(),
    hash: () => hash(get()),
    actions: () => actions(get()),
    act: (a: Action) => {
      const prev = get(), r = advance(prev, a);
      if (!r.ok) return { ok: false, reason: r.reason };
      set(r.state); writeSave(r.state);
      for (const f of subs) f();
      return { ok: true, events: r.events, reload: after(prev, r.state, a) };
    },
  };
}

/** the interface's tone of the page a state opens (each page installs the same): the slot's look (the arena's bout, the forecourt, the
 *  town), Lantern Row the night's */
export function pageTone(params: URLSearchParams, s: GameState): TimeOfDay {
  return params.get('scene') !== 'arena' && s.place === 'lanterns' ? 'night' : lookOf(s);
}

export async function startPlay(b: Boot): Promise<void> {
  try {
    const { state, note } = startingState(b.params);
    // the loading screen takes the tone of the page it opens (journal Passe UI4), before its first frame
    toneLoading(b.label, pageTone(b.params, state));
    writeSave(state);
    if (b.params.get('scene') === 'arena') await (await import('./playArena')).startPlayArena(b, state);
    else if (state.place === 'forecourt') await (await import('./playForecourt')).startPlayForecourt(b, state);
    else if (state.place === 'lanterns') await (await import('./playLanterns')).startPlayLanterns(b, state);
    else await (await import('./playTown')).startPlayTown(b, state, note);
  } catch (e: any) { loadingError(b.label, e); }
}
