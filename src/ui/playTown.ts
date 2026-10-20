import { App } from '../app/App';
import { actions, lookOf, placeName, standings, townQuery, type ActionOption, type GameState } from '../simulation';
import { go, installGameApi, type Boot } from './play';
import { boardHtml } from './board';
import { downloadSave, loadSaveFile, writeSave } from './save';
import { el, esc, injectStyle, overlay } from './style';

/** The city in the play mode (journal Passe L3, a first panel; the full interface comes with Passe L4): the frozen Merchant District as it
 *  is, its day state, forge and crowd taken from the game state (choice P4: game layers only), and a panel with the clock, the actions
 *  and their cost in slots, the journal, the tournament board and the save file. A significant action ends the slot: the new state is saved
 *  and the page reloads into the next slot's look. */

const CARRY_TOWN = ['fps', 'vis', 'viscache', 'painters', 'res', 'msaa', 'refl', 'camera', 'player', 'static', 'occ', 'freeze', 'gpuprof'];

export async function startPlayTown(b: Boot, st0: GameState, note?: string): Promise<void> {
  let st = st0;
  const q = new URLSearchParams(townQuery(st));
  for (const k of CARRY_TOWN) if (b.params.has(k)) q.set(k, b.params.get(k)!);
  const app = new App({ canvas: b.canvas, params: q, onProgress: (l, f) => { b.label.textContent = `GENERATING ${l.toUpperCase()}`; b.bar.style.width = `${Math.round(f * 100)}%`; } });
  (window as any).__app = app;
  installGameApi(() => st, (s) => { st = s; }, (prev, next) => lookOf(prev) !== lookOf(next) || prev.services.forge !== next.services.forge);
  await app.init();
  b.loading.style.opacity = '0';
  setTimeout(() => b.loading.remove(), 900);
  (window as any).__stats = () => app.snapshot();
  app.start();
  let n = 0;
  const wait = () => { if (++n > 3) (window as any).__ready = true; else requestAnimationFrame(wait); };
  wait();

  injectStyle();
  const panel = el('div', 'pm pm-card');
  panel.style.cssText = 'left:12px;top:12px;width:min(360px,calc(100vw - 24px));max-height:calc(100vh - 24px);overflow:auto;padding:12px 14px';
  document.body.appendChild(panel);
  const seen = st.log.length;
  if (note) void overlay(`<h2 class="pm-h">A new game</h2><p>${esc(note)}</p>`, [{ id: 'ok', label: 'Continue', primary: true }]).done;

  const render = (): void => {
    const opts = actions(st), cost = (o: ActionOption) => `<span class="cost${o.cost ? '' : ' free'}">${o.cost ? '1 slot' : 'free'}</span>`;
    const fight = st.slot === 'afternoon' && st.tournament.matches.some((m) => m.day === st.day && !m.winner && (m.a === 'player' || m.b === 'player'));
    const log = st.log.filter((e) => e.visible).slice(-6).map((e) => `<p class="${e.seq >= seen ? 'new' : ''}">${esc(e.text)}</p>`).join('');
    panel.innerHTML = `<h2 class="pm-h">Day ${st.day} · ${st.slot}</h2><p class="pm-sub">${esc(st.player.name)} · ${esc(placeName(st.place))}</p>
      <p>${st.player.coins} coins · reputation ${st.player.reputation}${st.player.injury ? ` · <span style="color:#e9a64c">hurt (${st.player.injury})</span>` : ''}</p>
      <div class="acts"></div><div class="pm-log">${log}</div><div class="tools"></div>`;
    const box = panel.querySelector('.acts')!;
    if (st.over) box.appendChild(el('p', '', 'The slice is over. To be continued.'));
    if (fight) {
      const x = el('button', 'pm-btn primary', 'Enter the arena <span class="cost">1 slot</span>');
      x.addEventListener('click', () => { writeSave(st); go(b.params, { scene: 'arena' }); });
      box.appendChild(x);
    }
    for (const o of opts) {
      const x = el('button', 'pm-btn', `<span>${esc(o.label)}${o.ok ? '' : `<span class="why">${esc(o.reason ?? '')}</span>`}</span>${cost(o)}`);
      x.disabled = !o.ok;
      x.addEventListener('click', () => act(o));
      box.appendChild(x);
    }
    const tools = panel.querySelector('.tools')!;
    for (const [label, f] of [['Tournament board', () => void overlay(boardHtml(st, standings(st)), [{ id: 'ok', label: 'Close', primary: true }]).done], ['Save to a file', () => downloadSave(st)], ['Load a file', () => pick()]] as const) {
      const x = el('button', 'pm-btn', esc(label)); x.addEventListener('click', f); tools.appendChild(x);
    }
  };
  const act = (o: ActionOption): void => {
    const r = (window as any).__game.act(o.action);
    if (!r.ok) return;
    if (r.reload) go(b.params); else render();
  };
  const pick = (): void => {
    const i = el('input'); i.type = 'file'; i.accept = 'application/json,.json';
    i.addEventListener('change', async () => {
      const f = i.files?.[0]; if (!f) return;
      try { st = await loadSaveFile(f); writeSave(st); go(b.params); } catch (e) { void overlay(`<p>${esc((e as Error).message)}</p>`, [{ id: 'ok', label: 'Close' }]).done; }
    });
    i.click();
  };
  render();
}
