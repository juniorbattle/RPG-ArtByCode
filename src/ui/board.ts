import { RIVALS, PLAYER_ID, ROUNDS, POINTS } from '../narrative/roster';
import type { GameState } from '../simulation';
import { esc } from './style';
import { tx } from '../narrative/text';
import { isV2 } from '../simulation/v2';
import { actOf, stageName } from '../tournament/v2calendar';

/** The tournament board (TOURNAMENT_MASTER_CONTRACT § 11, journal Passes L3 / L4): the phase, the next deadline, the pool's standings, the
 *  rivals still in the race, what a defeat costs and when the format changes, in plain words. */

export function standingsHtml(st: GameState, rows: Array<{ id: string; points: number; reputation: number }>): string {
  const tr = rows.map((r, i) => {
    const me = r.id === PLAYER_ID, c = st.competitors[r.id];
    const name = me ? st.player.name : RIVALS[r.id].name, hurt = c && c.healthState !== 'fit' ? ` <span class="pm-sub">${tx('ui.board.hurt')}</span>` : '';
    return `<tr${me ? ' class="me"' : ''}><td>${i + 1}.</td><td>${esc(name)}${hurt}</td><td class="pts"><span class="pm-num">${r.points}</span> ${tx('ui.board.pts')}</td></tr>`;
  }).join('');
  return `<table class="pm-table">${tr}</table>`;
}

export function boardHtml(st: GameState, rows: Array<{ id: string; points: number; reputation: number }>): string {
  if (isV2(st)) return v2BoardHtml(st, rows);
  const next = ROUNDS.find((r) => r.day >= st.day && !st.tournament.matches.some((m) => m.round === r.round && m.winner && (m.a === PLAYER_ID || m.b === PLAYER_ID)));
  const opp = next?.pairs.find((p) => p.includes(PLAYER_ID))?.find((x) => x !== PLAYER_ID);
  const deadline = next ? tx('ui.board.deadline', { round: next.round, name: RIVALS[opp!].name, epithet: RIVALS[opp!].epithet, day: next.day, today: next.day === st.day ? tx('ui.board.today') : '' }) : tx('ui.board.fought');
  const results = st.tournament.matches.filter((m) => m.winner).map((m) => `<p>${tx('ui.board.result', { round: m.round, winner: esc(m.winner === PLAYER_ID ? st.player.name : RIVALS[m.winner!].name), loser: esc((m.winner === m.a ? m.b : m.a) === PLAYER_ID ? st.player.name : RIVALS[m.winner === m.a ? m.b : m.a].name), close: m.close ? tx('ui.board.close') : '' })}</p>`).join('');
  return `<h2 class="pm-h">${tx('ui.board.title')}</h2>
    <p class="pm-sub">${tx('ui.board.phase')}</p>
    <p><b>${tx('ui.board.next')}</b> ${esc(deadline)}</p>
    ${standingsHtml(st, rows)}
    <p class="pm-sub pm-gap">${tx('ui.board.rules')}</p>
    <p>${tx('ui.board.points', { win: POINTS.win, close: POINTS.close, loss: POINTS.loss })}</p>
    <p>${tx('ui.board.after')}</p>
    ${results ? `<p class="pm-sub pm-gap">${tx('ui.board.results')}</p>${results}` : ''}`;
}

/** the version 2's board (journal Passe VP1): its ten days, not the slice's three: the act, the player's next bout of the pool or the bracket,
 *  the pool's standings (the bracket gives no points), the rules of the pool, the cut and the bracket, every result by its stage */
function v2BoardHtml(st: GameState, rows: Array<{ id: string; points: number; reputation: number }>): string {
  const who = (id: string) => esc(id === PLAYER_ID ? st.player.name : RIVALS[id].name);
  const m = st.tournament.matches.find((x) => x.day >= st.day && !x.winner && (x.a === PLAYER_ID || x.b === PLAYER_ID));
  const opp = m ? RIVALS[m.a === PLAYER_ID ? m.b : m.a] : null;
  const next = m && opp ? `${esc(stageName(m))}: ${esc(opp.name)}, ${esc(opp.epithet)} — day ${m.day}, afternoon${m.day === st.day ? tx('ui.board.today') : ''}` : tx('v2.board.fought');
  const act = actOf(st.day), done = st.tournament.matches.filter((x) => x.winner);
  const results = done.map((x) => `<p>${tx('v2.board.result', { stage: esc(stageName(x)), winner: who(x.winner!), loser: who(x.winner === x.a ? x.b : x.a), close: x.close ? tx('ui.board.close') : '' })}</p>`).join('');
  return `<h2 class="pm-h">${tx('ui.board.title')}</h2>
    <p class="pm-sub">${tx(act === 1 ? 'v2.board.act1' : act === 2 ? 'v2.board.act2' : 'v2.board.act3')}</p>
    <p><b>${tx('ui.board.next')}</b> ${next}</p>
    <p class="pm-sub pm-gap">${tx('ui.pool')}</p>
    ${standingsHtml(st, rows)}
    <p class="pm-sub pm-gap">${tx('v2.board.rules')}</p>
    <p>${tx('v2.board.points', { win: POINTS.win, close: POINTS.close, loss: POINTS.loss })}</p>
    <p>${tx('v2.board.cut')}</p>
    <p>${tx('v2.board.bracket')}</p>
    ${results ? `<p class="pm-sub pm-gap">${tx('ui.board.results')}</p>${results}` : ''}`;
}
