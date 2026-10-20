import { ArenaApp } from '../arena/ArenaApp';
import { lookOf, type GameState } from '../simulation';
import { go, installGameApi, type Boot } from './play';
import { TownUi } from './townUi';

/** The Arena Forecourt (journal Passe L4, until Passe L6 makes it walkable): the arena's sand seen from the stands, still, with no bout on
 *  it, and the play mode's interface: the registrar, the healer, Orla and the rivals (portraits and dialogues, choice K3), training and
 *  scouting. */
export async function startPlayForecourt(b: Boot, st0: GameState): Promise<void> {
  let st = st0;
  installGameApi(() => st, (s) => { st = s; }, (prev, next) => lookOf(prev) !== lookOf(next) || prev.place !== next.place || next.over !== prev.over);
  const q = new URLSearchParams({ seed: '1842', hud: '0' });
  for (const k of ['fps', 'freeze', 'painters', 'gpuprof']) if (b.params.has(k)) q.set(k, b.params.get(k)!);
  const app = new ArenaApp({ canvas: b.canvas, params: q, onProgress: (l, f) => { b.label.textContent = `GENERATING ${l.toUpperCase()}`; b.bar.style.width = `${Math.round(f * 100)}%`; } });
  (window as any).__arena = app;
  await app.init();
  // nobody fights on the forecourt: the simulation holds, without the pause screen
  app.paused = true; app.moment = true;
  b.loading.style.opacity = '0';
  setTimeout(() => b.loading.remove(), 900);
  (window as any).__stats = () => app.snapshot();
  const ui = new TownUi({ state: () => st, act: (a) => (window as any).__game.act(a), reload: (extra) => go(b.params, extra) }, st.log.length - 1);
  (window as any).__ui = ui;
  (window as any).__game.subscribe(() => ui.render());
  app.start();
  let n = 0;
  const wait = () => { if (++n > 3) (window as any).__ready = true; else requestAnimationFrame(wait); };
  wait();
}
