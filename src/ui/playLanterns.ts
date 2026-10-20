import { PlaceApp } from '../world/PlaceApp';
import { lookOf, type GameState } from '../simulation';
import { go, installGameApi, type Boot } from './play';
import { TownUi } from './townUi';
import { el } from './style';

/** Lantern Row (choice P3, journal Passe L6): the slice's light third place, a mock-up built from the district's generators and seen from one
 *  fixed framing, always at night (its day look would be a new aspect, a decision prepared for the operator); the tavern's innkeeper by any
 *  hour, Cassius Dree at night (portraits and dialogues, choice K3). */
export async function startPlayLanterns(b: Boot, st0: GameState): Promise<void> {
  let st = st0;
  installGameApi(() => st, (s) => { st = s; }, (prev, next) => lookOf(prev) !== lookOf(next) || prev.place !== next.place || next.over !== prev.over);
  const q = new URLSearchParams();
  for (const k of ['fps', 'freeze', 'painters', 'gpuprof']) if (b.params.has(k)) q.set(k, b.params.get(k)!);
  const app = new PlaceApp({ canvas: b.canvas, params: q, onProgress: (l, f) => { b.label.textContent = `GENERATING ${l.toUpperCase()}`; b.bar.style.width = `${Math.round(f * 100)}%`; } });
  (window as any).__place = app;
  await app.init();
  b.loading.style.opacity = '0';
  setTimeout(() => b.loading.remove(), 900);
  (window as any).__stats = () => app.snapshot();
  const ui = new TownUi({ state: () => st, act: (a) => (window as any).__game.act(a), reload: (extra) => go(b.params, extra) }, st.log.length - 1);
  (window as any).__ui = ui;
  (window as any).__game.subscribe(() => ui.render());
  const tag = el('div', 'pm pm-sub', 'Lantern Row · a mock-up of the third place, built from the district\'s generators');
  tag.style.cssText = 'left:50%;bottom:10px;transform:translateX(-50%);opacity:.75;white-space:nowrap;pointer-events:none';
  document.body.appendChild(tag);
  app.start();
  let n = 0;
  const wait = () => { if (++n > 3) (window as any).__ready = true; else requestAnimationFrame(wait); };
  wait();
}
