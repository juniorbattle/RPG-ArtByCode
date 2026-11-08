import { App } from '../app/App';
import { isV2, lookOf, townQuery, type Action, type GameState } from '../simulation';
import { keepSeen, markSeen, seenBefore } from './news';
import { go, installGameApi, type Boot } from './play';
import { TownUi } from './townUi';
import { esc, overlay } from './style';
import { tx } from '../narrative/text';
import { fontsReady, installDesign } from './design/system';
import { progressOn } from './loading';
import { preloadPortraits } from './portraits';
import { ExitMarkers } from './exits';
import { WALK } from '../architecture/StreetComposer';
import { V2_EXITS } from '../simulation/v2places';
import { parseWeather } from '../atmosphere/Weather';
import * as THREE from 'three';
import { watchPost } from '../simulation/v2watch';
import { hailOf } from '../simulation/v2react';
import { Hails, type HailWalker } from './hails';

/** The city in the play mode (journal Passes L3 / L4): the frozen Merchant District as it is, its day state, forge, crowd and weather taken
 *  from the game state (choice P4: game layers only, no geometry, framing, cast or look change), and the play mode's interface over it.
 *  The district's people are found by their archetype next to the player (E to talk); the DEV forge switch (F, and E at the forge) is off:
 *  the forge's state is the game's. A significant action ends the slot: the state is saved and the page reloads into the next look. */

const CARRY_TOWN = ['fps', 'vis', 'viscache', 'painters', 'res', 'msaa', 'refl', 'camera', 'player', 'static', 'occ', 'freeze', 'gpuprof', 'spriteedge', 'npcfacing'];
/** the district's archetypes standing for the game's people (choice P4: their existing sprites) */
const PERSON_OF: Record<string, string> = { merchant: 'mara', blacksmith: 'bram', guardA: 'hale', guardB: 'wynn', hooded: 'stranger', porter: 'tam' };
/** where Wynn stands from Mara at her stall when he watches it (m, lot L5): beside her, on the quay side */
const WYNN_AT: [number, number] = [1.15, 0.55];

export async function startPlayTown(b: Boot, st0: GameState, note?: string): Promise<void> {
  let st = st0;
  const q = new URLSearchParams(townQuery(st));
  for (const k of CARRY_TOWN) if (b.params.has(k)) q.set(k, b.params.get(k)!);
  // a version 2 game's town flies the tournament's heraldry (journal Passe VP3) and sees the arena over the far city (journal Passe VP8); today's
  // game keeps its banners and its cathedral
  if (isV2(st)) { q.set('heraldry', 'tournament'); q.set('skyline', 'arena'); }
  // and Ren under his look (journal Passe PR3, HeroLookCast: the approved look; DEV, the address's `herolook` review); today's game keeps today's Ren
  if (isV2(st)) q.set('herolook', '1');
  // and takes the address's weather as the squares do (lot S2: heard as well as seen); today's game keeps only the day's rain
  if (isV2(st)) for (const k of ['rain', 'snow', 'storm', 'wind']) if (b.params.has(k)) q.set(k, b.params.get(k)!);
  // arriving by a way in (journal Passe VP5): from the forecourt at the quay's east end past the guards, from the festival at its west end
  const arrive = isV2(st) ? b.params.get('arrive') : null;
  if (arrive === 'forecourt' && !b.params.has('player')) q.set('player', `${WALK.x1 - 1.4},0`);
  if (arrive === 'lanterns' && !b.params.has('player')) q.set('player', `${WALK.x0 + 1.2},0.6`);
  const app = new App({ canvas: b.canvas, params: q, onProgress: progressOn(b.label, b.bar) });
  (window as any).__app = app;
  // the interface's tone follows the page's day state (the operator's decision L2, journal Passe UI3)
  installDesign(lookOf(st));
  installGameApi(() => st, (s) => { st = s; }, (prev, next) => lookOf(prev) !== lookOf(next) || prev.services.forge !== next.services.forge || prev.place !== next.place || next.over !== prev.over);
  await app.init();
  // lot L5 (EV-12, « un garde se poste à l’étal le jour d’un vol »): a version 2 game's Wynn leaves the barrier for Mara's stall the days a theft there keeps him,
  // and is not on the quay while he watches a stall on a square (src/simulation/v2watch.ts); the district's cast and draws as they are, his sprite moved or hidden
  const post = watchPost(st);
  if (post) {
    const wynn = app.actors.actors.find((a) => (a.base ?? a.spec) === 'guardB'), mara = app.actors.actors.find((a) => (a.base ?? a.spec) === 'merchant');
    if (wynn && post.place !== 'district') wynn.hidden = true;
    else if (wynn && mara) { wynn.pos.set(mara.pos.x + WYNN_AT[0], 0, mara.pos.z + WYNN_AT[1]); app.actors.face(wynn, new THREE.Vector3(0, 0, 1)); }
  }
  // the forge is the game's: the DEV switch of the free-roaming district is off in the play mode
  app.setForgeState = () => {};
  app.actors.onInteractForge = null;
  b.loading.style.opacity = '0';
  setTimeout(() => b.loading.remove(), 900);
  (window as any).__stats = () => app.snapshot();
  const seen = seenBefore(st), act = (a: Action) => (window as any).__game.act(a);
  const ui = new TownUi({
    state: () => st,
    // a version 2 game counts as shown what an action keeping the page showed at once (journal Passe EVL1); today's game keeps its rule
    act: isV2(st) ? keepSeen(act, () => st) : act,
    reload: (extra) => go(b.params, extra),
    nearby: () => {
      const p = app.actors.player;
      let best: string | null = null, bd = 2.6 * 2.6;
      for (const a of app.actors.actors) {
        if (a === p || a.hidden) continue;
        const base = a.base ?? a.spec, who = PERSON_OF[base] ?? (base.startsWith('crowd') ? 'folk' : null);
        if (!who) continue;
        const d = (a.pos.x - p.pos.x) ** 2 + (a.pos.z - p.pos.z) ** 2;
        if (d < bd) { bd = d; best = who; }
      }
      return best;
    },
  }, seen);
  markSeen(st);
  (window as any).__ui = ui;
  (window as any).__game.subscribe(() => ui.render());
  // E / Space next to someone opens their dialogue (the district's bubble stays: its « ... » is the town's own)
  const interact = app.actors.interact.bind(app.actors);
  app.actors.interact = () => { interact(); ui.interact(); };
  // a version 2 game's ways out (journal Passe VP5): the quay's west end to the Festival Square, its east end past the guards' barrier to the
  // Arena Forecourt; walked into with a key held, the move saved and the square's page opened at its way in from the quay
  const END: Record<string, [number, number, number]> = { west: [WALK.x0 - 0.1, 2.6, 0.4], east: [WALK.x1 + 0.3, 2.6, 0] };
  const ways = isV2(st) ? V2_EXITS.district.map((e) => ({ ...e, anchor: END[e.side] })) : [];
  const markers = ways.length ? new ExitMarkers(ways.map((w) => ({ to: w.to, anchor: w.anchor }))) : null;
  if (markers) (window as any).__exits = markers;
  // a version 2 game plays with a gamepad too (the operator's sheet of journal Passe MN2): its walk, its pages' shoulders, the sound it may wake;
  // loaded on demand, it does nothing until a pad is used; today's game reads none
  if (isV2(st)) void import('../input/PadInput').then((m) => m.installPad({ walk: (w) => { app.actors.pad = w; }, tab: (d) => ui.tabPage(d), sound: () => import('../audio/Sound').then((s) => s.sound()) }));
  const taken = () => {
    const p = app.actors.player.pos;
    // walked into with a key held, or the gamepad's walk
    if (ui.modal || (app.actors.keys.size === 0 && !app.actors.pad)) return null;
    const w = ways.find((e) => (e.side === 'east' ? p.x >= WALK.x1 - 0.15 && Math.abs(p.z) < 2.2 : p.x <= WALK.x0 + 0.15));
    return w?.to ?? null;
  };
  const leave = (to: typeof st.place) => { const from = st.place, r = (window as any).__game.act({ type: 'move', to }); if (r.ok) go(b.params, { arrive: from }); else location.reload(); };
  // lot L5 (EV-12, « la célébrité change [...] qui salue le héros »): a version 2 game's passers-by greet or whisper as the hero passes (src/ui/hails.ts), on the
  // scene's own clock (a proof's frozen page never steps); today's game has none
  const hails = isV2(st) ? new Hails((k, n) => hailOf(st, k, n), () => null) : null;
  if (hails) (window as any).__hails = hails;
  const walkers = (): HailWalker[] => app.actors.actors.filter((a) => a.role === 'crowd' && !a.hidden).map((a, k) => ({
    key: k, pos: a.pos, height: a.height, stop: (secs) => { const b = a.behaviour; if (b) b.wait = Math.max(b.wait ?? 0, secs); }, face: (dx, dz) => app.actors.face(a, new THREE.Vector3(dx, 0, dz)),
  }));
  let last = app.simTime;
  const frame = () => {
    if (ui.modal) { app.actors.keys.clear(); app.actors.pad = null; }
    ui.update(); markers?.update(app.rig.camera, app.actors.player.pos, taken(), leave);
    if (hails) { const dt = app.simTime - last; last = app.simTime; hails.update(dt, app.rig.camera, app.actors.player.pos, walkers(), ui.modal); }
    requestAnimationFrame(frame);
  };
  app.start();
  // the version 2's sound (lot V8): the district's ambience and its piece of the band (journal Passe SN10: a new game's first page opens on the title); today's game makes none
  if (isV2(st)) void import('../audio/Sound').then((m) => m.sound().setScene('district', lookOf(st), st.slot === 'afternoon', st.seed, { opening: b.params.has('new') }, parseWeather(q)));
  frame();
  // a version 2 game: the casting's approved faces (journal Passe CA3)
  await Promise.all([fontsReady(), preloadPortraits(isV2(st) ? { ...(await import('../characters/PlazaCast')).plazaFaces(), player: (await import('../characters/HeroLookCast')).heroPortrait() } : undefined)]);
  let n = 0;
  const wait = () => { if (++n > 3) (window as any).__ready = true; else requestAnimationFrame(wait); };
  wait();
  if (note) void overlay(`<h2 class="pm-h">${tx('ui.newGame')}</h2><p>${esc(note)}</p>`, [{ id: 'ok', label: tx('ui.continue'), primary: true }]).done;
}
