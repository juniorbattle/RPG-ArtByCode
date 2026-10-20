import { ArenaApp } from '../arena/ArenaApp';
import { TEXTS_EN } from '../arena/ArenaHud';
import { matchSheetFor, sheetData } from '../combat/match';
import { RIVALS } from '../narrative/roster';
import { ACTION_NAMES_EN } from '../narrative/texts';
import { lookOf, standings, type GameState } from '../simulation';
import { go, installGameApi, type Boot } from './play';
import { writeSave } from './save';
import { esc, overlay } from './style';
import { standingsHtml } from './board';

/** The official bout (journal Passe L3; choice G1: the arena as it is, played from a match sheet): the day's opponent in Marek's seat, the
 *  player's name and preparation in Ren's, the English HUD (choice K1). A scouting report before the first blow; once the KO has had its
 *  moment, the result goes to the simulation (`fight`), the game is saved and the player returns to the city, at the end of day (G2). */

export async function startPlayArena(b: Boot, st0: GameState): Promise<void> {
  let st = st0;
  const sheet = matchSheetFor(st), m = st.tournament.matches.find((x) => x.day === st.day && (x.a === 'player' || x.b === 'player'));
  installGameApi(() => st, (s) => { st = s; }, (prev, next) => lookOf(prev) !== lookOf(next));
  if (!sheet || st.slot !== 'afternoon' || m?.winner) {
    b.loading.remove();
    (window as any).__ready = true;
    await overlay(`<h2 class="pm-h">The arena</h2><p>${!sheet ? 'You have no bout today.' : m?.winner ? 'You have fought today.' : 'Your bout is in the afternoon.'}</p>`, [{ id: 'back', label: 'Return to the city', primary: true }]).done;
    go(b.params);
    return;
  }
  const opp = RIVALS[sheet.sides[1].fighters[0].id];
  const q = new URLSearchParams({ seed: '1842' });
  for (const k of ['fps', 'freeze', 'painters', 'hud', 'gpuprof']) if (b.params.has(k)) q.set(k, b.params.get(k)!);
  const app = new ArenaApp({
    canvas: b.canvas, params: q,
    onProgress: (l, f) => { b.label.textContent = `GENERATING ${l.toUpperCase()}`; b.bar.style.width = `${Math.round(f * 100)}%`; },
    match: {
      data: sheetData(sheet, ACTION_NAMES_EN), foe: opp.id, assist: sheet.assist,
      texts: { ...TEXTS_EN, subtitle: `Pool of eight · round ${sheet.round}`, subMarek: opp.epithet },
      onOver: (r) => void finish(r),
    },
  });
  (window as any).__arena = app;
  await app.init();
  b.loading.style.opacity = '0';
  setTimeout(() => b.loading.remove(), 900);
  (window as any).__stats = () => app.snapshot();
  // the bout waits for the player: the simulation holds (no pause screen) until « Fight »
  app.paused = true; app.moment = true;
  app.start();
  let n = 0;
  const wait = () => { if (++n > 3) (window as any).__ready = true; else requestAnimationFrame(wait); };
  wait();
  const report = sheet.intel.length ? `<p class="pm-sub">Your scouting report</p>${sheet.intel.map((x) => `<p>${esc(x)}</p>`).join('')}` : '<p class="pm-sub">You have not watched this opponent train.</p>';
  const mods = sheet.sides[0].fighters[0].mods, prep = [mods.hp !== undefined && mods.hp < 1 ? `wounded: ${Math.round(mods.hp * 100)} % health` : '', mods.damage && mods.damage > 1 ? `+${Math.round((mods.damage - 1) * 100)} % damage (${st.player.items.length ? 'your blade' : ''}${st.player.items.length && st.player.training ? ', ' : ''}${st.player.training ? 'training' : ''})` : ''].filter(Boolean);
  await overlay(`<h2 class="pm-h">Round ${sheet.round} · day ${sheet.day}</h2><p class="pm-big">${esc(opp.name)}</p><p style="text-align:center" class="pm-sub">${esc(opp.epithet)}</p><p>${esc(opp.bio)}</p>${report}
    ${prep.length ? `<p class="pm-sub">Your preparation</p><p>${esc(prep.join(' · '))}</p>` : ''}
    <p class="pm-sub">Keys</p><p>1 quick · 2 heavy · 3-6 techniques · B hold to guard · A dodge in the window · Space pause</p>`, [{ id: 'fight', label: 'Fight', primary: true }]).done;
  app.paused = false; app.moment = false;

  async function finish(r: { winner: 'ren' | 'marek'; hp: Record<string, number>; maxHp: Record<string, number>; finisher: string | null }): Promise<void> {
    const outcome = { winner: r.winner === 'ren' ? 'player' : 'opponent', playerHp: r.hp.ren, playerMaxHp: r.maxHp.ren, opponentHp: r.hp.marek, opponentMaxHp: r.maxHp.marek, finisher: r.finisher };
    (window as any).__outcome = outcome;
    const res = (window as any).__game.act({ type: 'fight', outcome });
    if (!res.ok) { console.error(res.reason); return; }
    writeSave(st);
    const won = r.winner === 'ren', lines = (res.events as Array<{ visible: boolean; text: string; kind: string }>).filter((e) => e.visible && (e.kind === 'match' || e.kind === 'consequence')).map((e) => `<p>${esc(e.text)}</p>`).join('');
    await overlay(`<p class="pm-big">${won ? 'Victory' : 'Defeat'}</p>${lines}<p class="pm-sub">The pool</p>${standingsHtml(st, standings(st))}`, [{ id: 'back', label: 'Return to the city', primary: true }]).done;
    go(b.params);
  }
}
