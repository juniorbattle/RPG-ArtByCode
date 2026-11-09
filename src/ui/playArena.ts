import { ArenaApp } from '../arena/ArenaApp';
import { TEXTS_EN } from '../arena/ArenaHud';
import { DYN_TEXTS_EN } from '../arena/DynamicHud';
import { challengeSheetFor, dynSheetData, dynSheetView, matchSheetFor, sheetData, v2SheetData } from '../combat/match';
import { V2_FOES, FOE_SKILLS } from '../combat/v2duel';
import { isV2, v2KitOf } from '../simulation/v2';
import { v2Mods } from '../simulation/v2gear';
import { dynamicRules } from '../tournament/pool';
import { stageName } from '../tournament/v2calendar';
import { GENERICS } from '../narrative/generics';
import { boutPiece } from '../audio/plan';
import { RIVALS } from '../narrative/roster';
import { ACTION_NAMES_EN } from '../narrative/texts';
import { said, tx, type TextRef } from '../narrative/text';
import { arenaQuery, lookOf, standings, type GameState } from '../simulation';
import { go, installGameApi, type Boot } from './play';
import { writeSave } from './save';
import { esc, overlay } from './style';
import { standingsHtml } from './board';
import { fontsReady, installDesign } from './design/system';
import { progressOn } from './loading';
import { DuelCoach } from './duelTutorial';

/** The official bout (journal Passe L3; choice G1: the arena as it is, played from a match sheet): the day's opponent in Marek's seat, the
 *  player's name and preparation in Ren's, the English HUD (choice K1). A scouting report before the first blow; once the KO has had its
 *  moment, the result goes to the simulation (`fight`), the game is saved and the player returns to the city, at the end of day (G2).
 *  A game under the rules of the « tour par tour dynamique » (`flags.combat`, journal Passe C2) fights its bout in DynamicSim with its HUD,
 *  the discreet assistance for every bout and the scouting report at the preparation screen (CB-7). */

export async function startPlayArena(b: Boot, st0: GameState): Promise<void> {
  let st = st0;
  // the version 2: a challenge in town is fought on the same sand (lot V4), from its own sheet
  const challenge = b.params.get('challenge') === '1' && isV2(st) ? challengeSheetFor(st) : null;
  const sheet = challenge ?? matchSheetFor(st), m = challenge ? undefined : st.tournament.matches.find((x) => x.day === st.day && (x.a === 'player' || x.b === 'player'));
  installGameApi(() => st, (s) => { st = s; }, (prev, next) => lookOf(prev) !== lookOf(next));
  // the interface's tone: the slot's day state, as the arena's (the afternoon's bout at midday)
  installDesign(lookOf(st));
  if (!sheet || (!challenge && (st.slot !== 'afternoon' || m?.winner))) {
    b.loading.remove();
    (window as any).__ready = true;
    await overlay(`<h2 class="pm-h">${tx('ui.arena.title')}</h2><p>${!sheet ? tx('ui.arena.noBout') : m?.winner ? tx('ui.arena.fought') : tx('ui.arena.afternoon')}</p>`, [{ id: 'back', label: tx('ui.arena.back'), primary: true }]).done;
    go(b.params);
    return;
  }
  // a generic fighter of the version 2 (lot L2b): its name and epithet from its own table, the arena's generated fighter in its seat until its sheets
  const fid = sheet.sides[1].fighters[0].id, opp = RIVALS[fid] ?? { id: fid, name: GENERICS[fid].name, epithet: GENERICS[fid].epithet };
  const reprisal = !!challenge && !!st.v2?.challenge?.reprisal;
  // the slot's day state (the afternoon's bout at midday, journal Passe AD1)
  const q = new URLSearchParams(arenaQuery(st));
  for (const k of ['fps', 'freeze', 'painters', 'hud', 'gpuprof', 'input', 'fx']) if (b.params.has(k)) q.set(k, b.params.get(k)!);
  const dyn = dynamicRules(st), v2 = isV2(st), view = dyn ? dynSheetView(sheet, opp.name, opp.id) : { assist: sheet.assist, intel: sheet.intel };
  // the version 2 (journal Passe V1): scouting also names the opponent's skills (C3), announced in the duel by the light alert
  if (v2 && view.intel.length) view.intel.push(tx('ui.arena.foeSkills', { name: opp.name, skills: (V2_FOES[opp.id]?.skills.list ?? []).map((k) => FOE_SKILLS[k.id].name).join(', ') }));
  const v2d = v2 ? v2SheetData(sheet, ACTION_NAMES_EN, v2KitOf(st), v2Mods(st)) : null;
  if (dyn && b.params.has('dyn')) q.set('dyn', b.params.get('dyn')!);
  const texts = { ...(dyn ? DYN_TEXTS_EN : TEXTS_EN), subtitle: challenge ? tx(reprisal ? 'v2.challenge.reprisal' : 'v2.challenge.title') : v2 && m ? stageName(m) : tx('ui.arena.subtitle', { round: sheet.round }), subMarek: opp.epithet };
  const app = new ArenaApp({
    canvas: b.canvas, params: q,
    onProgress: progressOn(b.label, b.bar),
    match: v2d
      // a challenge or a reprisal in town (lot L2b, EV-5 « L’arène aux gradins vides »): the stands empty, no crowd, the lists' piece of the band
      ? { data: v2d.data, tiers: v2d.tiers, rules: 'v2', foe: opp.id, assist: view.assist, texts, piece: challenge ? 'lices' : boutPiece(m?.stage), ...(challenge ? { empty: true } : {}), onOver: (r) => void finish(r) }
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
  // one preparation screen (journal Passe UM4): the version 2's is its match sheet in the town, here its stage and the name; today's game keeps its report
  // here, in the band at the foot of the screen, the fighters in view; the command bar says the keys
  const gate = `<p class="pm-sub">${challenge ? tx(reprisal ? 'v2.challenge.reprisal' : 'v2.challenge.title') : v2 && m ? tx('v2.arena.round', { stage: stageName(m), day: sheet.day }) : tx('ui.arena.round', { round: sheet.round, day: sheet.day })}</p><h2 class="pm-h">${esc(opp.name)}</h2><p class="pm-sub">${esc(opp.epithet)}</p>`;
  await overlay(v2 && !challenge ? gate : `${gate}${report}${prep.length ? `<p class="pm-sub">${tx('ui.arena.prep')}</p><p>${esc(prep.join(' · '))}</p>` : ''}`, [{ id: 'fight', label: tx('ui.arena.fight'), primary: true }], true).done;
  app.paused = false; app.moment = false;
  // the first duel's tutorial (journal Passe TU4, TU-11): a version 2 duel holds the first time each thing comes up, a lesson read at the foot of the screen
  if (v2) {
    const coach = new DuelCoach({ hold: (on) => app.holdForLesson(on), data: () => app.dyn?.D ?? null }, b.params);
    (window as any).__coach = coach;
    app.onDuelEvents = (evs) => coach.onEvents(evs);
    coach.begin();
  }

  async function finish(r: { winner: 'ren' | 'marek'; hp: Record<string, number>; maxHp: Record<string, number>; finisher: string | null }): Promise<void> {
    const outcome = { winner: r.winner === 'ren' ? 'player' : 'opponent', playerHp: r.hp.ren, playerMaxHp: r.maxHp.ren, opponentHp: r.hp.marek, opponentMaxHp: r.maxHp.marek, finisher: r.finisher };
    (window as any).__outcome = outcome;
    const res = (window as any).__game.act(challenge ? { type: 'challengeResult', outcome } : { type: 'fight', outcome });
    if (!res.ok) { console.error(res.reason); return; }
    writeSave(st);
    const won = r.winner === 'ren', lines = (res.events as Array<{ visible: boolean; text: string; kind: string; $t?: TextRef }>).filter((e) => e.visible && (e.kind === 'match' || e.kind === 'consequence' || (!!challenge && e.kind === 'action'))).map((e) => `<p>${esc(said(e.text, e.$t))}</p>`).join('');
    await overlay(`<p class="pm-big">${won ? tx('ui.arena.victory') : tx('ui.arena.defeat')}</p>${lines}<p class="pm-sub">${tx('ui.pool')}</p>${standingsHtml(st, standings(st))}`, [{ id: 'back', label: tx('ui.arena.back'), primary: true }]).done;
    go(b.params);
  }
}
