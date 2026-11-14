import { ArenaApp } from '../arena/ArenaApp';
import { TEXTS_EN } from '../arena/ArenaHud';
import { DYN_TEXTS_EN, DYN_TEXTS_FR_GAME } from '../arena/DynamicHud';
import { challengeSheetFor, dynSheetData, dynSheetView, matchSheetFor, sheetData } from '../combat/match';
import { autoOutcome } from '../combat/autoMatch';
import { AUTO_TEXTS_EN, AUTO_TEXTS_FR } from '../arena/AutoHud';
import { isV2 } from '../simulation/v2';
import { duelStats } from '../simulation/preview';
import { VIGOUR_HP } from '../combat/stats';
import { dynamicRules } from '../tournament/pool';
import { stageName } from '../tournament/v2calendar';
import { GENERICS } from '../narrative/generics';
import { boutPiece } from '../audio/plan';
import { RIVALS } from '../narrative/roster';
import { ACTION_NAMES_EN } from '../narrative/texts';

/** the actions' names in the page's language (journal Passe RG4: the English through the table's `word`) */
const actionNames = (): Record<string, string> => Object.fromEntries(Object.entries(ACTION_NAMES_EN).map(([k, v]) => [k, word(v)]));
import { lang, said, tx, word, type TextRef } from '../narrative/text';
import { arenaQuery, lookOf, standings, type GameState } from '../simulation';
import { go, installGameApi, type Boot } from './play';
import { writeSave } from './save';
import { esc, overlay } from './style';
import { standingsHtml } from './board';
import { fontsReady, installDesign } from './design/system';
import { progressOn } from './loading';
import { DuelCoach } from './duelTutorial';
import { boutNote } from '../combat/autoNotes';
import { fighterName, noteLines } from './notebook';
import { REHEARSAL, reviewOf } from '../simulation/v2prep';

/** The official bout (journal Passe L3; choice G1: the arena as it is, played from a match sheet): the day's opponent in Marek's seat, the
 *  player's name and preparation in Ren's, the English HUD (choice K1). A scouting report before the first blow; once the KO has had its
 *  moment, the result goes to the simulation (`fight`), the game is saved and the player returns to the city, at the end of day (G2).
 *  A game under the rules of the « tour par tour dynamique » (`flags.combat`, journal Passe C2) fights its bout in DynamicSim with its HUD,
 *  the discreet assistance for every bout and the scouting report at the preparation screen (CB-7). A version 2 game's bout or challenge is the duel played by
 *  the computer (lot 2 of briefs/combat-auto.md, journal Passe LC3): decided here from the game's state (src/combat/autoMatch.ts), the arena plays its script, ×2 and
 *  « Skip » at hand, and the game takes the result the duel gave. */

export async function startPlayArena(b: Boot, st0: GameState): Promise<void> {
  let st = st0;
  // a rehearsed bout watched again (lot 3 of « La Brute », src/simulation/v2prep.ts): nothing of the game changes
  const review = b.params.get('review');
  if ((review === 'win' || review === 'loss') && isV2(st)) { await startReview(b, st, review); return; }
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
  // the version 2: the duel played by the computer, decided from the state now (the same duel the match sheet prepared), its script for the arena
  const ao = v2 ? autoOutcome(st, challenge ? 'challenge' : 'bout', { log: true }) : null;
  if (dyn && b.params.has('dyn')) q.set('dyn', b.params.get('dyn')!);
  const texts = { ...(v2 ? (lang() === 'fr' ? AUTO_TEXTS_FR : AUTO_TEXTS_EN) : dyn ? (lang() === 'fr' ? DYN_TEXTS_FR_GAME : DYN_TEXTS_EN) : TEXTS_EN), subtitle: challenge ? tx(reprisal ? 'v2.challenge.reprisal' : 'v2.challenge.title') : v2 && m ? stageName(m) : tx('ui.arena.subtitle', { round: sheet.round }), subMarek: opp.epithet };
  const app = new ArenaApp({
    canvas: b.canvas, params: q,
    onProgress: progressOn(b.label, b.bar),
    match: ao
      // a challenge or a reprisal in town (lot L2b, EV-5 « L’arène aux gradins vides »): the stands empty, no crowd, the lists' piece of the band
      ? { rules: 'auto', auto: { result: ao.duel, ren: ao.bout.ren, foe: ao.bout.foe, names: { ren: st.player.name, marek: opp.name } }, foe: opp.id, assist: 'subtle', texts, piece: challenge ? 'lices' : boutPiece(m?.stage), ...(challenge ? { empty: true } : {}), onOver: (r) => void finish(r) }
      : dyn
      ? { data: dynSheetData(sheet, actionNames()), rules: 'dynamic', foe: opp.id, assist: view.assist, texts, onOver: (r) => void finish(r) }
      : { data: sheetData(sheet, actionNames()), foe: opp.id, assist: sheet.assist, texts, onOver: (r) => void finish(r) },
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
  await overlay(v2 ? gate : `${gate}${report}${prep.length ? `<p class="pm-sub">${tx('ui.arena.prep')}</p><p>${esc(prep.join(' · '))}</p>` : ''}`, [{ id: 'fight', label: tx('ui.arena.fight'), primary: true }], true).done;
  app.paused = false; app.moment = false;
  // SY-10 (the operator's « Le résultat de la tactique écrit à l’ouverture », journal Passe SY2): the fight under way, the result the tactic gives is the bout's if the
  // page is left before its end (applied at the next page, src/ui/play.ts settlePending); the bout's own result replaces it at its end (finish)
  if (ao && st.v2) {
    st.v2.$pending = { kind: challenge ? 'challenge' : 'bout', outcome: { winner: ao.winner, playerHp: ao.playerHp, playerMaxHp: ao.playerMaxHp, opponentHp: ao.opponentHp, opponentMaxHp: ao.opponentMaxHp, finisher: ao.finisher } };
    writeSave(st);
  }
  // the first duel's tutorial (TU-11), written for the duel played by the computer (lot 3, journal Passe LC5; the three-button duel's of journal Passe TU4 went
  // with lot 2): the replay holds the first time each thing comes up in the script, a lesson read at the foot of the screen, its numbers this bout's
  if (ao) {
    const duel = { ren: ao.bout.ren, foe: ao.bout.foe, form: ao.duel.form, names: { ren: st.player.name, marek: opp.name } };
    const coach = new DuelCoach({ hold: (on) => app.holdForLesson(on), data: () => duel }, b.params);
    (window as any).__coach = coach;
    app.onDuelEvents = (evs, t) => coach.onEvents(evs, t);
    coach.begin();
  }

  async function finish(r: { winner: 'ren' | 'marek'; hp: Record<string, number>; maxHp: Record<string, number>; finisher: string | null }): Promise<void> {
    // Master Corvin's note (lot 3 of « La Brute »): read from the duel the arena played (the presses of the hand in it), handed in with the result
    const note = ao && !reprisal ? boutNote(app.auto?.result ?? ao.duel, ao.bout.ren, ao.bout.foe, { day: st.day, foe: ao.bout.foeId, kind: challenge ? 'challenge' : 'bout' }) : undefined;
    const outcome = { winner: r.winner === 'ren' ? 'player' : 'opponent', playerHp: r.hp.ren, playerMaxHp: r.maxHp.ren, opponentHp: r.hp.marek, opponentMaxHp: r.maxHp.marek, finisher: r.finisher, ...(note ? { note } : {}) };
    (window as any).__outcome = outcome;
    if (st.v2) delete st.v2.$pending;
    const res = (window as any).__game.act(challenge ? { type: 'challengeResult', outcome } : { type: 'fight', outcome });
    if (!res.ok) { console.error(res.reason); return; }
    writeSave(st);
    const won = r.winner === 'ren', lines = (res.events as Array<{ visible: boolean; text: string; kind: string; $t?: TextRef }>).filter((e) => e.visible && (e.kind === 'match' || e.kind === 'consequence' || (!!challenge && e.kind === 'action'))).map((e) => `<p>${esc(said(e.text, e.$t))}</p>`).join('');
    // the operator's DB11-5 « Le dire partout » (journal Passe DB13): a version 2 bout won (a reprisal adds none) says the vigour it gives and the health of the next bout
    const vigour = won && v2 && !reprisal ? `<p class="pm-vigour">${esc(tx('v2.result.vigour', { n: VIGOUR_HP, hp: duelStats(st).hp ?? 0 }))}</p>` : '';
    const corvin = note ? `<p class="pm-sub">${tx('note.title')}</p>${noteLines(note).slice(1).map((l) => `<p>${esc(l)}</p>`).join('')}` : '';
    await overlay(`<p class="pm-big">${won ? tx('ui.arena.victory') : tx('ui.arena.defeat')}</p>${lines}${vigour}${corvin}<p class="pm-sub">${tx('ui.pool')}</p>${standingsHtml(st, standings(st))}`, [{ id: 'back', label: tx('ui.arena.back'), primary: true }]).done;
    go(b.params);
  }
}

/** a rehearsed bout watched again (lot 3 of « La Brute », the proposition's « tu revois deux combats »): the shadow bout as rehearsed (src/simulation/v2prep.ts reviewOf),
 *  played by the arena on the empty stands with « Skip » and ×2 at hand; its end says the result and Master Corvin's reading of it, and the player goes back to the
 *  training ground; nothing of the game changes (no action, no save). A set-up changed since the rehearsal plays nothing: the bout would not be the one rehearsed. */
async function startReview(b: Boot, st: GameState, which: 'win' | 'loss'): Promise<void> {
  installGameApi(() => st, () => {}, () => false);
  installDesign(lookOf(st));
  const rv = reviewOf(st, which), name = rv ? fighterName(rv.foeId) : '';
  if (!rv || rv.stale) {
    b.loading.remove();
    (window as any).__ready = true;
    await overlay(`<h2 class="pm-h">${tx('nb.rehearsal')}</h2><p>${esc(rv ? tx('prep.review.stale', { name }) : tx('prep.review.none'))}</p>`, [{ id: 'back', label: tx('prep.review.back'), primary: true }]).done;
    go(b.params);
    return;
  }
  const r0 = rv, opp = RIVALS[rv.foeId], q = new URLSearchParams(arenaQuery(st));
  for (const k of ['fps', 'freeze', 'painters', 'hud', 'gpuprof', 'input', 'fx']) if (b.params.has(k)) q.set(k, b.params.get(k)!);
  const texts = { ...(lang() === 'fr' ? AUTO_TEXTS_FR : AUTO_TEXTS_EN), subtitle: tx('prep.review.title', { name }), subMarek: opp?.epithet ?? '' };
  (window as any).__review = { which, seed: rv.seed, foe: rv.foeId };
  const app = new ArenaApp({
    canvas: b.canvas, params: q, onProgress: progressOn(b.label, b.bar),
    match: { rules: 'auto', auto: { result: rv.result, ren: rv.ren, foe: rv.foe, names: { ren: st.player.name, marek: name } }, foe: rv.foeId, assist: 'subtle', texts, piece: 'lices', empty: true, onOver: (r) => void end(r) },
  });
  (window as any).__arena = app;
  await app.init();
  b.loading.style.opacity = '0';
  setTimeout(() => b.loading.remove(), 900);
  (window as any).__stats = () => app.snapshot();
  app.paused = true; app.moment = true;
  app.start();
  await fontsReady();
  let n = 0;
  const wait = () => { if (++n > 3) (window as any).__ready = true; else requestAnimationFrame(wait); };
  wait();
  await overlay(`<p class="pm-sub">${esc(tx('prep.review.title', { name }))}</p><h2 class="pm-h">${esc(name)}</h2><p class="pm-sub">${esc(tx('prep.review.note', { n: REHEARSAL.n }))}</p>`, [{ id: 'fight', label: tx('ui.arena.fight'), primary: true }], true).done;
  app.paused = false; app.moment = false;
  async function end(r: { winner: 'ren' | 'marek' }): Promise<void> {
    const note = boutNote(app.auto?.result ?? r0.result, r0.ren, r0.foe, { day: st.day, foe: r0.foeId, kind: 'rehearsal' });
    (window as any).__reviewOutcome = { winner: r.winner === 'ren' ? 'player' : 'opponent' };
    const lines = noteLines(note).slice(1).map((l) => `<p>${esc(l)}</p>`).join('');
    await overlay(`<p class="pm-big">${tx(r.winner === 'ren' ? 'prep.review.won' : 'prep.review.lost')}</p><p class="pm-sub">${esc(tx('prep.review.note', { n: REHEARSAL.n }))}</p><p class="pm-sub">${tx('note.title')}</p>${lines}`, [{ id: 'back', label: tx('prep.review.back'), primary: true }]).done;
    go(b.params);
  }
}
