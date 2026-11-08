import { PlazaApp } from '../world/PlazaApp';
import { lookOf, rainOf, type Action, type GameState } from '../simulation';
import { keepSeen, markSeen, seenBefore } from './news';
import { playerMatch } from '../tournament/pool';
import { PLAZA_OF, plazaPeople } from '../simulation/v2places';
import { gestureOf, hailOf, plazaBunting, plazaCrowd } from '../simulation/v2react';
import { RIVALS } from '../narrative/roster';
import { Hails } from './hails';
import { PEOPLE } from '../narrative/people';
import { pendingScene } from '../narrative/v2story';
import { playCutscene } from './cutscene';
import { go, installGameApi, type Boot } from './play';
import { TownUi } from './townUi';
import { fontsReady, installDesign } from './design/system';
import { progressOn } from './loading';
import { preloadPortraits } from './portraits';
import { ExitMarkers } from './exits';
import { ANNOUNCED } from '../audio/plan';
import { parseWeather } from '../atmosphere/Weather';

/** The version 2's open places (lot V5, journal Passe V5): the Arena Forecourt, the Training Ground and the Festival Square (in place of
 *  Lantern Row's mock-up), each a square of src/world/Plazas.ts walked across in the slot's day state; the people there at this hour stand
 *  at their spots (E next to one opens the dialogue), the guards at the forecourt's gate, the crowd walking between the square's points,
 *  the rain of a wet day (journal Passe VP1). */
export async function startPlayPlaza(b: Boot, st0: GameState): Promise<void> {
  let st = st0;
  installGameApi(() => st, (s) => { st = s; }, (prev, next) => lookOf(prev) !== lookOf(next) || prev.place !== next.place || next.over !== prev.over);
  const q = new URLSearchParams();
  for (const k of ['fps', 'freeze', 'painters', 'gpuprof', 'cast', 'static', 'vis', 'viscache', 'visstep', 'visfine', 'visscale', 'rain', 'snow', 'storm', 'wind', 'plazaframe', 'plazasun', 'plazafog', 'plazadof', 'plazabunting']) if (b.params.has(k)) q.set(k, b.params.get(k)!);
  // the day's weather, as the town's (src/simulation/look.ts): the rain front's wet day falls on the squares too
  const rain = rainOf(st); if (rain && !q.has('rain')) q.set('rain', rain);
  const look = lookOf(st), kind = PLAZA_OF[st.place]!;
  // a cutscene of this moment (lot V6): its cast stands on the square even out of their hours
  const scene = pendingScene(st), people = plazaPeople(st);
  for (const id of scene?.cast ?? []) if (!people.includes(id)) people.push(id);
  const app = new PlazaApp({
    canvas: b.canvas, params: q, kind, time: look === 'night' ? null : look, people, arriveFrom: b.params.get('arrive'),
    // lot L5 (EV-12 « Les places lisent le pouls »): the crowd follows the tournament's excitement as the quay's, and gathers where the town's ambiences are
    // (src/simulation/v2react.ts); its walkers are the town's passers-by
    crowd: plazaCrowd(st), folk: true,
    // the bunting by the festival (journal Passe FT1, L5-3): by day the squares' garlands hang by the tier of the pulse's festivity
    bunting: plazaBunting(st),
    onProgress: progressOn(b.label, b.bar),
  });
  (window as any).__plaza = app;
  installDesign(look);
  await app.init();
  b.loading.style.opacity = '0';
  setTimeout(() => b.loading.remove(), 900);
  (window as any).__stats = () => app.snapshot();
  // the news since the player last looked, as on the quay (journal Passe EVL1: the square started from the log's last entry, and the news of a
  // slot ended here were lost); what an action keeping the page shows at once counts as shown
  const ui = new TownUi({
    state: () => st, act: keepSeen((a: Action) => (window as any).__game.act(a), () => st), reload: (extra) => go(b.params, extra),
    // only the people of the simulation talk (the guards at the forecourt's gate are its extras)
    nearby: () => { const w = app.nearby(); return w && PEOPLE[w] ? w : null; },
    // P4 (lot V9): the camera turns to the person spoken to
    focus: (who) => { const at = who ? app.spotOf(who) : null; void app.lookAt(at, 9, 0); },
  }, seenBefore(st));
  markSeen(st);
  (window as any).__ui = ui;
  (window as any).__game.subscribe(() => ui.render());
  window.addEventListener('keydown', (e) => { const k = e.key.toLowerCase(); if ((k === 'e' || k === ' ') && !e.repeat) { e.preventDefault(); ui.interact(); } });
  // the ways out (journal Passe VP5): their tags as the hero comes near, the way walked through taken (the move saved, the next place's page
  // opened at the way in from this one)
  const from = st.place, ways = new ExitMarkers(app.place.exits.map((e) => ({ to: e.to, anchor: e.anchor })));
  (window as any).__exits = ways;
  const leave = (to: typeof from) => { const r = (window as any).__game.act({ type: 'move', to }); if (r.ok) go(b.params, { arrive: from }); else location.reload(); };
  // the gamepad (the operator's sheet of journal Passe MN2): its walk, its pages' shoulders, the sound it may wake; loaded on demand, it does
  // nothing until a pad is used
  void import('../input/PadInput').then((m) => m.installPad({ walk: (w) => { app.pad = w; }, tab: (d) => ui.tabPage(d), sound: () => import('../audio/Sound').then((s) => s.sound()) }));
  // lot L5 (EV-12, « la célébrité change [...] qui salue le héros »): the passers-by who greet or whisper as the hero passes, the rivals standing who show their
  // stance (src/ui/hails.ts); read from the state of the page's load (a reload after a slot reads the next)
  const hails = new Hails((k, n) => hailOf(st, k, n), (who) => (RIVALS[who] ? gestureOf(st, who) : null));
  (window as any).__hails = hails;
  let last = app.stepped;
  const frame = () => {
    const dt = app.stepped - last; last = app.stepped;
    if (ui.modal) { app.keys.clear(); app.pad = null; }
    ui.update(); ways.update(app.camera, app.player.pos, ui.modal ? null : app.exitTaken()?.to ?? null, leave);
    hails.update(app.locked ? 0 : dt, app.camera, app.player.pos, app.hailWalkers((who) => !!RIVALS[who]), ui.modal);
    requestAnimationFrame(frame);
  };
  frame();
  app.start();
  // the version 2's sound (lot V8): the square's ambience and the day state's music, after the person's first gesture
  void import('../audio/Sound').then((m) => m.sound().setScene(kind, look, !!playerMatch(st) && st.slot === 'afternoon', st.seed, {}, parseWeather(q)));
  // the casting's approved faces (journal Passe CA5)
  await Promise.all([fontsReady(), preloadPortraits((await import('../characters/PlazaCast')).plazaFaces())]);
  let n = 0;
  const wait = () => { if (++n > 3) (window as any).__ready = true; else requestAnimationFrame(wait); };
  wait();
  // a browser driven by a tool keeps today's flow (as the title screen: navigator.webdriver) unless the address asks for the scene (cutscene=1)
  const scenes = b.params.get('cutscene') === '1' || (!navigator.webdriver && b.params.get('cutscene') !== '0');
  if (scene && scenes) {
    // the news of the slot that ended come first: the scene waits until they are read (journal Passe EVL1; it would hide their band)
    await ui.newsRead;
    // the registrar's announcements open on the fanfare (SA-7 « Fanfare et texte », C-LIEUX, journal Passe SN10)
    if (ANNOUNCED.has(scene.id)) void import('../audio/Sound').then((m) => m.sound().sting('fanfare'));
    await playCutscene(st, scene, { look: (at, dist, secs) => app.lookAt(at, dist, secs), walk: (who, to) => app.walkTo(who, to), lock: (on) => { app.locked = on; } });
    (window as any).__game.act({ type: 'watched', scene: scene.id });
  }
}
