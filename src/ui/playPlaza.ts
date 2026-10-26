import { PlazaApp } from '../world/PlazaApp';
import { lookOf, placeName, type GameState } from '../simulation';
import { playerMatch } from '../tournament/pool';
import { PLAZA_CROWD, PLAZA_OF, plazaPeople } from '../simulation/v2places';
import { PEOPLE } from '../narrative/people';
import { pendingScene } from '../narrative/v2story';
import { playCutscene } from './cutscene';
import { go, installGameApi, type Boot } from './play';
import { TownUi } from './townUi';
import { el } from './style';
import { tx } from '../narrative/text';
import { fontsReady, installDesign } from './design/system';
import { preloadPortraits } from './portraits';

/** The version 2's open places (lot V5, journal Passe V5): the Arena Forecourt, the Training Ground and the Festival Square (in place of
 *  Lantern Row's mock-up), each a square of src/world/Plazas.ts walked across in the slot's day state; the people there at this hour stand
 *  at their spots (E next to one opens the dialogue), the guards at the forecourt's gate, the hooded stranger on the square at night, the
 *  crowd walking between the square's points. */
export async function startPlayPlaza(b: Boot, st0: GameState): Promise<void> {
  let st = st0;
  installGameApi(() => st, (s) => { st = s; }, (prev, next) => lookOf(prev) !== lookOf(next) || prev.place !== next.place || next.over !== prev.over);
  const q = new URLSearchParams();
  for (const k of ['fps', 'freeze', 'painters', 'gpuprof', 'cast']) if (b.params.has(k)) q.set(k, b.params.get(k)!);
  const look = lookOf(st), kind = PLAZA_OF[st.place]!;
  // a cutscene of this moment (lot V6): its cast stands on the square even out of their hours
  const scene = pendingScene(st), people = plazaPeople(st);
  for (const id of scene?.cast ?? []) if (!people.includes(id)) people.push(id);
  const app = new PlazaApp({
    canvas: b.canvas, params: q, kind, time: look === 'night' ? null : look, people, crowd: PLAZA_CROWD[look],
    onProgress: (l, f) => { b.label.textContent = `GENERATING ${l.toUpperCase()}`; b.bar.style.width = `${Math.round(f * 100)}%`; },
  });
  (window as any).__plaza = app;
  installDesign(look);
  await app.init();
  b.loading.style.opacity = '0';
  setTimeout(() => b.loading.remove(), 900);
  (window as any).__stats = () => app.snapshot();
  const ui = new TownUi({
    state: () => st, act: (a) => (window as any).__game.act(a), reload: (extra) => go(b.params, extra),
    // only the people of the simulation talk (the guards and the stranger on a square are its extras)
    nearby: () => { const w = app.nearby(); return w && PEOPLE[w] ? w : null; },
    // P4 (lot V9): the camera turns to the person spoken to
    focus: (who) => { const at = who ? app.spotOf(who) : null; void app.lookAt(at, 9, 0); },
  }, st.log.length - 1);
  (window as any).__ui = ui;
  (window as any).__game.subscribe(() => ui.render());
  window.addEventListener('keydown', (e) => { const k = e.key.toLowerCase(); if ((k === 'e' || k === ' ') && !e.repeat) { e.preventDefault(); ui.interact(); } });
  const tag = el('div', 'pm pm-sub', tx('ui.plazaTag', { place: placeName(st.place, true) }));
  tag.id = 'pm-place-tag';
  document.body.appendChild(tag);
  const frame = () => { ui.update(); requestAnimationFrame(frame); };
  frame();
  app.start();
  // the version 2's sound (lot V8): the square's ambience and the day state's music, after the person's first gesture
  void import('../audio/Sound').then((m) => m.sound().setScene(kind, look, !!playerMatch(st) && st.slot === 'afternoon', st.seed));
  await Promise.all([fontsReady(), preloadPortraits()]);
  let n = 0;
  const wait = () => { if (++n > 3) (window as any).__ready = true; else requestAnimationFrame(wait); };
  wait();
  // a browser driven by a tool keeps today's flow (as the title screen: navigator.webdriver) unless the address asks for the scene (cutscene=1)
  const scenes = b.params.get('cutscene') === '1' || (!navigator.webdriver && b.params.get('cutscene') !== '0');
  if (scene && scenes) {
    await playCutscene(st, scene, { look: (at, dist, secs) => app.lookAt(at, dist, secs), walk: (who, to) => app.walkTo(who, to), lock: (on) => { app.locked = on; } });
    (window as any).__game.act({ type: 'watched', scene: scene.id });
  }
}
