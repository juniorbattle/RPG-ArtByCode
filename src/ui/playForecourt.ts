import { ArenaApp } from '../arena/ArenaApp';
import { lookOf, type GameState } from '../simulation';
import { go, installGameApi, type Boot } from './play';
import { TownUi } from './townUi';

/** The Arena Forecourt (journal Passes L4 / L6): the arena's sand outside the bouts, walkable (the hero walks it, arrows or A / D, W / S),
 *  Marek drilling by the ring by day; the registrar's table, the practice post where Orla trains and the healer's corner are spots on
 *  the sand (E to talk); the other rivals are portraits and dialogues (choice K3). */
const SPOTS: Array<{ x: number; who: string }> = [{ x: -5.6, who: 'odo' }, { x: -2.0, who: 'orla' }, { x: 3.0, who: 'marek' }, { x: 5.8, who: 'anwen' }];
export async function startPlayForecourt(b: Boot, st0: GameState): Promise<void> {
  let st = st0;
  installGameApi(() => st, (s) => { st = s; }, (prev, next) => lookOf(prev) !== lookOf(next) || prev.place !== next.place || next.over !== prev.over);
  const q = new URLSearchParams({ seed: '1842', hud: '0' });
  for (const k of ['fps', 'freeze', 'painters', 'gpuprof']) if (b.params.has(k)) q.set(k, b.params.get(k)!);
  const app = new ArenaApp({ canvas: b.canvas, params: q, onProgress: (l, f) => { b.label.textContent = `GENERATING ${l.toUpperCase()}`; b.bar.style.width = `${Math.round(f * 100)}%`; }, forecourt: { marek: st.slot !== 'evening' } });
  (window as any).__arena = app;
  await app.init();
  // nobody fights on the forecourt: the simulation holds, without the pause screen
  app.paused = true; app.moment = true;
  b.loading.style.opacity = '0';
  setTimeout(() => b.loading.remove(), 900);
  (window as any).__stats = () => app.snapshot();
  const ui = new TownUi({
    state: () => st, act: (a) => (window as any).__game.act(a), reload: (extra) => go(b.params, extra),
    nearby: () => SPOTS.find((p) => Math.abs(app.walkerX - p.x) < 1.1)?.who ?? null,
  }, st.log.length - 1);
  (window as any).__ui = ui;
  (window as any).__game.subscribe(() => ui.render());
  window.addEventListener('keydown', (e) => { const k = e.key.toLowerCase(); if ((k === 'e' || k === ' ') && !e.repeat) { e.preventDefault(); ui.interact(); } });
  const frame = () => { ui.update(); requestAnimationFrame(frame); };
  frame();
  app.start();
  let n = 0;
  const wait = () => { if (++n > 3) (window as any).__ready = true; else requestAnimationFrame(wait); };
  wait();
}
