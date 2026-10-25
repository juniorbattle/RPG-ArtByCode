import { ArenaApp } from '../arena/ArenaApp';
import { TEXTS_EN } from '../arena/ArenaHud';
import { DYN_TEXTS_EN } from '../arena/DynamicHud';
import { dynSheetData, dynSheetView, matchSheetFor, sheetData } from '../combat/match';
import { dynamicRules } from '../tournament/pool';
import { RIVALS } from '../narrative/roster';
import { ACTION_NAMES_EN } from '../narrative/texts';
import { arenaQuery, lookOf, standings, type GameState } from '../simulation';
import { go, installGameApi, type Boot } from './play';
import { writeSave } from './save';
import { esc, overlay } from './style';
import { standingsHtml } from './board';
import { fontsReady, installDesign } from './design/system';

/** The official bout (journal Passe L3; choice G1: the arena as it is, played from a match sheet): the day's opponent in Marek's seat, the
 *  player's name and preparation in Ren's, the English HUD (choice K1). A scouting report before the first blow; once the KO has had its
 *  moment, the result goes to the simulation (`fight`), the game is saved and the player returns to the city, at the end of day (G2).
 *  A game under the rules of the « tour par tour dynamique » (`flags.combat`, journal Passe C2) fights its bout in DynamicSim with its HUD,
 *  the discreet assistance for every bout and the scouting report at the preparation screen (CB-7). */

/** the preparation screen's keys under the new rules (the opponent's priority said in one line) */
const KEYS_DYNAMIC = '1 quick (+1 AP) · 2 heavy (prepared) · 3-6 your four skills (AP) · B hold to guard · A dodge (1 AP) · while your opponent attacks, only guard and dodge work · Space pause';

export async function startPlayArena(b: Boot, st0: GameState): Promise<void> {
  let st = st0;
  const sheet = matchSheetFor(st), m = st.tournament.matches.find((x) => x.day === st.day && (x.a === 'player' || x.b === 'player'));
  installGameApi(() => st, (s) => { st = s; }, (prev, next) => lookOf(prev) !== lookOf(next));
  // the interface's tone: the slot's day state, as the arena's (the afternoon's bout at midday)
  installDesign(lookOf(st));
  if (!sheet || st.slot !== 'afternoon' || m?.winner) {
    b.loading.remove();
    (window as any).__ready = true;
    await overlay(`<h2 class="pm-h">The arena</h2><p>${!sheet ? 'You have no bout today.' : m?.winner ? 'You have fought today.' : 'Your bout is in the afternoon.'}</p>`, [{ id: 'back', label: 'Return to the city', primary: true }]).done;
    go(b.params);
    return;
  }
  const opp = RIVALS[sheet.sides[1].fighters[0].id];
  // the slot's day state (the afternoon's bout at midday, journal Passe AD1)
  const q = new URLSearchParams(arenaQuery(st));
  for (const k of ['fps', 'freeze', 'painters', 'hud', 'gpuprof']) if (b.params.has(k)) q.set(k, b.params.get(k)!);
  const dyn = dynamicRules(st), view = dyn ? dynSheetView(sheet, opp.name, opp.id) : { assist: sheet.assist, intel: sheet.intel };
  if (dyn && b.params.has('dyn')) q.set('dyn', b.params.get('dyn')!);
  const texts = { ...(dyn ? DYN_TEXTS_EN : TEXTS_EN), subtitle: `Pool of eight · round ${sheet.round}`, subMarek: opp.epithet };
  const app = new ArenaApp({
    canvas: b.canvas, params: q,
    onProgress: (l, f) => { b.label.textContent = `GENERATING ${l.toUpperCase()}`; b.bar.style.width = `${Math.round(f * 100)}%`; },
    match: dyn
      ? { data: dynSheetData(sheet, ACTION_NAMES_EN), rules: 'dynamic', foe: opp.id, assist: view.assist, texts, onOver: (r) => void finish(r) }
      : { data: sheetData(sheet, ACTION_NAMES_EN), foe: opp.id, assist: sheet.assist, texts, onOver: (r) => void finish(r) },
  });
  (window as any).__arena = app;
  await app.init();
  b.loading.style.opacity = '0';
  setTimeout(() => b.loading.remove(), 900);
  (window as any).__stats = () => app.snapshot();
  // the bout waits for the player: the simulation holds (no pause screen) until « Fight »
  app.paused = true; app.moment = true;
  app.start();
  await fontsReady();
  let n = 0;
  const wait = () => { if (++n > 3) (window as any).__ready = true; else requestAnimationFrame(wait); };
  wait();
  const report = view.intel.length ? `<p class="pm-sub">Your scouting report</p>${view.intel.map((x) => `<p>${esc(x)}</p>`).join('')}` : '<p class="pm-sub">You have not watched this opponent train.</p>';
  const mods = sheet.sides[0].fighters[0].mods, prep = [mods.hp !== undefined && mods.hp < 1 ? `wounded: ${Math.round(mods.hp * 100)} % health` : '', mods.damage && mods.damage > 1 ? `+${Math.round((mods.damage - 1) * 100)} % damage (${st.player.items.length ? 'your blade' : ''}${st.player.items.length && st.player.training ? ', ' : ''}${st.player.training ? 'training' : ''})` : ''].filter(Boolean);
  await overlay(`<h2 class="pm-h">Round ${sheet.round} · day ${sheet.day}</h2><p class="pm-big">${esc(opp.name)}</p><p class="pm-sub pm-center">${esc(opp.epithet)}</p><p>${esc(opp.bio)}</p>${report}
    ${prep.length ? `<p class="pm-sub">Your preparation</p><p>${esc(prep.join(' · '))}</p>` : ''}
    <p class="pm-sub">Keys</p><p>${dyn ? KEYS_DYNAMIC : '1 quick · 2 heavy · 3-6 techniques · B hold to guard · A dodge in the window · Space pause'}</p>`, [{ id: 'fight', label: 'Fight', primary: true }]).done;
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
