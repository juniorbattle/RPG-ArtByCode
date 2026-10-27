import { App } from '../app/App';
import { isV2, lookOf, townQuery, type GameState } from '../simulation';
import { go, installGameApi, type Boot } from './play';
import { TownUi } from './townUi';
import { esc, overlay } from './style';
import { tx } from '../narrative/text';
import { fontsReady, installDesign } from './design/system';
import { preloadPortraits } from './portraits';
import { ExitMarkers } from './exits';
import { WALK } from '../architecture/StreetComposer';
import { V2_EXITS } from '../simulation/v2places';

/** The city in the play mode (journal Passes L3 / L4): the frozen Merchant District as it is, its day state, forge, crowd and weather taken
 *  from the game state (choice P4: game layers only, no geometry, framing, cast or look change), and the play mode's interface over it.
 *  The district's people are found by their archetype next to the player (E to talk); the DEV forge switch (F, and E at the forge) is off:
 *  the forge's state is the game's. A significant action ends the slot: the state is saved and the page reloads into the next look. */

const CARRY_TOWN = ['fps', 'vis', 'viscache', 'painters', 'res', 'msaa', 'refl', 'camera', 'player', 'static', 'occ', 'freeze', 'gpuprof', 'spriteedge', 'npcfacing'];
/** the district's archetypes standing for the game's people (choice P4: their existing sprites) */
const PERSON_OF: Record<string, string> = { merchant: 'mara', blacksmith: 'bram', guardA: 'hale', guardB: 'wynn', hooded: 'stranger', porter: 'tam' };
const SEEN = 'cite-du-tournoi.seen';

export async function startPlayTown(b: Boot, st0: GameState, note?: string): Promise<void> {
  let st = st0;
  const q = new URLSearchParams(townQuery(st));
  for (const k of CARRY_TOWN) if (b.params.has(k)) q.set(k, b.params.get(k)!);
  // a version 2 game's town flies the tournament's heraldry (journal Passe VP3) and sees the arena over the far city (journal Passe VP8); today's
  // game keeps its banners and its cathedral
  if (isV2(st)) { q.set('heraldry', 'tournament'); q.set('skyline', 'arena'); }
  // arriving by a way in (journal Passe VP5): from the forecourt at the quay's east end past the guards, from the festival at its west end
  const arrive = isV2(st) ? b.params.get('arrive') : null;
  if (arrive === 'forecourt' && !b.params.has('player')) q.set('player', `${WALK.x1 - 1.4},0`);
  if (arrive === 'lanterns' && !b.params.has('player')) q.set('player', `${WALK.x0 + 1.2},0.6`);
  const app = new App({ canvas: b.canvas, params: q, onProgress: (l, f) => { b.label.textContent = `GENERATING ${l.toUpperCase()}`; b.bar.style.width = `${Math.round(f * 100)}%`; } });
  (window as any).__app = app;
  // the interface's tone follows the page's day state (the operator's decision L2, journal Passe UI3)
  installDesign(lookOf(st));
  installGameApi(() => st, (s) => { st = s; }, (prev, next) => lookOf(prev) !== lookOf(next) || prev.services.forge !== next.services.forge || prev.place !== next.place || next.over !== prev.over);
  await app.init();
  // the forge is the game's: the DEV switch of the free-roaming district is off in the play mode
  app.setForgeState = () => {};
  app.actors.onInteractForge = null;
  b.loading.style.opacity = '0';
  setTimeout(() => b.loading.remove(), 900);
  (window as any).__stats = () => app.snapshot();
  let seen = -1;
  try { seen = Number(localStorage.getItem(SEEN) ?? -1); } catch { /* a page without storage shows the latest news */ }
  if (!(seen >= 0) || seen >= st.log.length) seen = Math.max(-1, st.log.length - 2);
  const ui = new TownUi({
    state: () => st,
    act: (a) => (window as any).__game.act(a),
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
  try { localStorage.setItem(SEEN, String(st.log.length - 1)); } catch { /* a convenience only */ }
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
  const taken = () => {
    const p = app.actors.player.pos;
    if (ui.modal || app.actors.keys.size === 0) return null;
    const w = ways.find((e) => (e.side === 'east' ? p.x >= WALK.x1 - 0.15 && Math.abs(p.z) < 2.2 : p.x <= WALK.x0 + 0.15));
    return w?.to ?? null;
  };
  const leave = (to: typeof st.place) => { const from = st.place, r = (window as any).__game.act({ type: 'move', to }); if (r.ok) go(b.params, { arrive: from }); else location.reload(); };
  const frame = () => { if (ui.modal) app.actors.keys.clear(); ui.update(); markers?.update(app.rig.camera, app.actors.player.pos, taken(), leave); requestAnimationFrame(frame); };
  app.start();
  // the version 2's sound (lot V8): the district's ambience and the day state's music; today's game makes none
  if (isV2(st)) void import('../audio/Sound').then((m) => m.sound().setScene('district', lookOf(st), st.slot === 'afternoon', st.seed));
  frame();
  await Promise.all([fontsReady(), preloadPortraits()]);
  let n = 0;
  const wait = () => { if (++n > 3) (window as any).__ready = true; else requestAnimationFrame(wait); };
  wait();
  if (note) void overlay(`<h2 class="pm-h">${tx('ui.newGame')}</h2><p>${esc(note)}</p>`, [{ id: 'ok', label: tx('ui.continue'), primary: true }]).done;
}
