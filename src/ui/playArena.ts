import { ArenaApp } from '../arena/ArenaApp';
import { TEXTS_EN } from '../arena/ArenaHud';
import { DYN_TEXTS_EN } from '../arena/DynamicHud';
import { dynSheetData, dynSheetView, matchSheetFor, sheetData, v2SheetData } from '../combat/match';
import { V2_FOES, FOE_SKILLS } from '../combat/v2duel';
import { isV2, v2KitOf } from '../simulation/v2';
import { dynamicRules } from '../tournament/pool';
import { RIVALS } from '../narrative/roster';
import { ACTION_NAMES_EN } from '../narrative/texts';
import { tx } from '../narrative/text';
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
const KEYS_DYNAMIC = tx('ui.arena.keysDynamic');

export async function startPlayArena(b: Boot, st0: GameState): Promise<void> {
  let st = st0;
  const sheet = matchSheetFor(st), m = st.tournament.matches.find((x) => x.day === st.day && (x.a === 'player' || x.b === 'player'));
  installGameApi(() => st, (s) => { st = s; }, (prev, next) => lookOf(prev) !== lookOf(next));
  // the interface's tone: the slot's day state, as the arena's (the afternoon's bout at midday)
  installDesign(lookOf(st));
  if (!sheet || st.slot !== 'afternoon' || m?.winner) {
    b.loading.remove();
    (window as any).__ready = true;
    await overlay(`<h2 class="pm-h">${tx('ui.arena.title')}</h2><p>${!sheet ? tx('ui.arena.noBout') : m?.winner ? tx('ui.arena.fought') : tx('ui.arena.afternoon')}</p>`, [{ id: 'back', label: tx('ui.arena.back'), primary: true }]).done;
    go(b.params);
    return;
  }
  const opp = RIVALS[sheet.sides[1].fighters[0].id];
  // the slot's day state (the afternoon's bout at midday, journal Passe AD1)
  const q = new URLSearchParams(arenaQuery(st));
  for (const k of ['fps', 'freeze', 'painters', 'hud', 'gpuprof', 'input']) if (b.params.has(k)) q.set(k, b.params.get(k)!);
  const dyn = dynamicRules(st), v2 = isV2(st), view = dyn ? dynSheetView(sheet, opp.name, opp.id) : { assist: sheet.assist, intel: sheet.intel };
  // the version 2 (journal Passe V1): scouting also names the opponent's skills (C3), announced in the duel by the light alert
  if (v2 && view.intel.length) view.intel.push(tx('ui.arena.foeSkills', { name: opp.name, skills: (V2_FOES[opp.id]?.skills.list ?? []).map((k) => FOE_SKILLS[k.id].name).join(', ') }));
  const v2d = v2 ? v2SheetData(sheet, ACTION_NAMES_EN, v2KitOf(st)) : null;
  if (dyn && b.params.has('dyn')) q.set('dyn', b.params.get('dyn')!);
  const texts = { ...(dyn ? DYN_TEXTS_EN : TEXTS_EN), subtitle: tx('ui.arena.subtitle', { round: sheet.round }), subMarek: opp.epithet };
  const app = new ArenaApp({
    canvas: b.canvas, params: q,
    onProgress: (l, f) => { b.label.textContent = `GENERATING ${l.toUpperCase()}`; b.bar.style.width = `${Math.round(f * 100)}%`; },
    match: v2d
      ? { data: v2d.data, tiers: v2d.tiers, rules: 'v2', foe: opp.id, assist: view.assist, texts, onOver: (r) => void finish(r) }
      : dyn
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
  const report = view.intel.length ? `<p class="pm-sub">${tx('ui.arena.report')}</p>${view.intel.map((x) => `<p>${esc(x)}</p>`).join('')}` : `<p class="pm-sub">${tx('ui.arena.noReport')}</p>`;
  const mods = sheet.sides[0].fighters[0].mods, prep = [mods.hp !== undefined && mods.hp < 1 ? tx('ui.arena.wounded', { pct: Math.round(mods.hp * 100) }) : '', mods.damage && mods.damage > 1 ? tx('ui.arena.damage', { pct: Math.round((mods.damage - 1) * 100), why: `${st.player.items.length ? tx('ui.arena.blade') : ''}${st.player.items.length && st.player.training ? ', ' : ''}${st.player.training ? tx('ui.arena.training') : ''}` }) : ''].filter(Boolean);
  await overlay(`<h2 class="pm-h">${tx('ui.arena.round', { round: sheet.round, day: sheet.day })}</h2><p class="pm-big">${esc(opp.name)}</p><p class="pm-sub pm-center">${esc(opp.epithet)}</p><p>${esc(opp.bio)}</p>${report}
    ${prep.length ? `<p class="pm-sub">${tx('ui.arena.prep')}</p><p>${esc(prep.join(' · '))}</p>` : ''}
    <p class="pm-sub">${tx('ui.arena.keys')}</p><p>${v2 && b.params.get('input') !== 'keys' ? tx('ui.arena.keysV2') : dyn ? KEYS_DYNAMIC : tx('ui.arena.keysClassic')}</p>`, [{ id: 'fight', label: tx('ui.arena.fight'), primary: true }]).done;
  app.paused = false; app.moment = false;

  async function finish(r: { winner: 'ren' | 'marek'; hp: Record<string, number>; maxHp: Record<string, number>; finisher: string | null }): Promise<void> {
    const outcome = { winner: r.winner === 'ren' ? 'player' : 'opponent', playerHp: r.hp.ren, playerMaxHp: r.maxHp.ren, opponentHp: r.hp.marek, opponentMaxHp: r.maxHp.marek, finisher: r.finisher };
    (window as any).__outcome = outcome;
    const res = (window as any).__game.act({ type: 'fight', outcome });
    if (!res.ok) { console.error(res.reason); return; }
    writeSave(st);
    const won = r.winner === 'ren', lines = (res.events as Array<{ visible: boolean; text: string; kind: string }>).filter((e) => e.visible && (e.kind === 'match' || e.kind === 'consequence')).map((e) => `<p>${esc(e.text)}</p>`).join('');
    await overlay(`<p class="pm-big">${won ? tx('ui.arena.victory') : tx('ui.arena.defeat')}</p>${lines}<p class="pm-sub">${tx('ui.pool')}</p>${standingsHtml(st, standings(st))}`, [{ id: 'back', label: tx('ui.arena.back'), primary: true }]).done;
    go(b.params);
  }
}
