import { actions, advance, hash, namedState, newGame, type Action, type GameState } from '../simulation';
import { readSave, writeSave } from './save';

/** The play mode's entry (journal Passe L3; `?play=1`, the tools' way in, and later the title screen's « New game » / « Continue »): the game
 *  state comes from the save (or a new game), and the page shows the scene of the state's place: the district (the town, App), or the
 *  arena for the day's bout (`&scene=arena`). Moving to another scene, or to another slot (whose day state changes the town's look), is a save
 *  then a reload: no scene ever changes its day state while it runs (choice G2).
 *  `window.__game` drives it for the proofs: `state()`, `actions()`, `act(action)` (the state saved; `reload` says whether the page would
 *  reload), `hash()`. */

export interface Boot { canvas: HTMLCanvasElement; params: URLSearchParams; label: HTMLElement; bar: HTMLElement; loading: HTMLElement }

/** the tools' parameters carried from the address into every play-mode page (measurements, captures, culling checks) */
const CARRY = ['fps', 'vis', 'viscache', 'painters', 'res', 'msaa', 'refl', 'camera', 'player', 'static', 'occ', 'freeze', 'gpuprof', 'noreload'];

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

export function startingState(params: URLSearchParams): { state: GameState; note?: string } {
  // DEV only: a named state (PROJECT § 10.3) for reviews and proofs
  if (import.meta.env.DEV && params.has('state')) return { state: namedState(params.get('state')!, Number(params.get('seed') ?? 1842) >>> 0, params.get('name') ?? 'Ren') };
  if (params.has('new')) return { state: newGame(Number(params.get('seed') ?? 1842) >>> 0, params.get('name') ?? 'Ren') };
  const r = readSave();
  if (r.state) return { state: r.state };
  return { state: newGame(1842, params.get('name') ?? 'Ren'), note: r.error };
}

/** the game API of a page: the current state, its actions, applying one (saved at once) */
export function installGameApi(get: () => GameState, set: (s: GameState) => void, after: (prev: GameState, next: GameState, a: Action) => boolean): void {
  (window as any).__game = {
    state: () => get(),
    hash: () => hash(get()),
    actions: () => actions(get()),
    act: (a: Action) => {
      const prev = get(), r = advance(prev, a);
      if (!r.ok) return { ok: false, reason: r.reason };
      set(r.state); writeSave(r.state);
      return { ok: true, events: r.events, reload: after(prev, r.state, a) };
    },
  };
}

export async function startPlay(b: Boot): Promise<void> {
  try {
    const { state, note } = startingState(b.params);
    writeSave(state);
    if (b.params.get('scene') === 'arena') await (await import('./playArena')).startPlayArena(b, state);
    else await (await import('./playTown')).startPlayTown(b, state, note);
  } catch (e: any) {
    console.error(e);
    b.label.textContent = 'ERROR: ' + (e?.message ?? e);
    (window as any).__error = String(e?.stack ?? e);
  }
}
