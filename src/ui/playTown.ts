import { App } from '../app/App';
import { isV2, lookOf, townQuery, type GameState } from '../simulation';
import { go, installGameApi, type Boot } from './play';
import { TownUi } from './townUi';
import { esc, overlay } from './style';
import { tx } from '../narrative/text';
import { fontsReady, installDesign } from './design/system';
import { preloadPortraits } from './portraits';

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
  // a version 2 game's town flies the tournament's heraldry (journal Passe VP3); today's game keeps its banners
  if (isV2(st)) q.set('heraldry', 'tournament');
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
  const frame = () => { if (ui.modal) app.actors.keys.clear(); ui.update(); requestAnimationFrame(frame); };
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
