import { RIVALS, PLAYER_ID, ROUNDS, POINTS } from '../narrative/roster';
import type { GameState } from '../simulation';
import { esc } from './style';

/** The tournament board (TOURNAMENT_MASTER_CONTRACT § 11, journal Passes L3 / L4): the phase, the next deadline, the pool's standings, the
 *  rivals still in the race, what a defeat costs and when the format changes, in plain words. */

export function standingsHtml(st: GameState, rows: Array<{ id: string; points: number; reputation: number }>): string {
  const tr = rows.map((r, i) => {
    const me = r.id === PLAYER_ID, c = st.competitors[r.id];
    const name = me ? st.player.name : RIVALS[r.id].name, hurt = c && c.healthState !== 'fit' ? ' <span class="pm-sub">(hurt)</span>' : '';
    return `<tr${me ? ' style="color:#f6e7c4"' : ''}><td>${i + 1}.</td><td>${esc(name)}${hurt}</td><td style="text-align:right">${r.points} pts</td></tr>`;
  }).join('');
  return `<table style="width:100%;border-collapse:collapse;font-size:13px">${tr}</table>`;
}

export function boardHtml(st: GameState, rows: Array<{ id: string; points: number; reputation: number }>): string {
  const next = ROUNDS.find((r) => r.day >= st.day && !st.tournament.matches.some((m) => m.round === r.round && m.winner && (m.a === PLAYER_ID || m.b === PLAYER_ID)));
  const opp = next?.pairs.find((p) => p.includes(PLAYER_ID))?.find((x) => x !== PLAYER_ID);
  const deadline = next ? `Round ${next.round}: ${RIVALS[opp!].name}, ${RIVALS[opp!].epithet} — day ${next.day}, afternoon${next.day === st.day ? ' (today)' : ''}` : 'Your bouts of the pool are fought: the pool ends after the third day.';
  const results = st.tournament.matches.filter((m) => m.winner).map((m) => `<p>Round ${m.round}: ${esc(m.winner === PLAYER_ID ? st.player.name : RIVALS[m.winner!].name)} beat ${esc((m.winner === m.a ? m.b : m.a) === PLAYER_ID ? st.player.name : RIVALS[m.winner === m.a ? m.b : m.a].name)}${m.close ? ' (close)' : ''}</p>`).join('');
  return `<h2 class="pm-h">The tournament</h2>
    <p class="pm-sub">Phase I · the pool of eight</p>
    <p><b>Next:</b> ${esc(deadline)}</p>
    ${standingsHtml(st, rows)}
    <p class="pm-sub" style="margin-top:8px">Rules of the pool</p>
    <p>A win earns ${POINTS.win} points, a close defeat ${POINTS.close}, a defeat ${POINTS.loss}. A defeat costs points and reputation, sometimes a wound: it never ends your tournament.</p>
    <p>After the pool, the best four go on to the transition phase: trials and the first allies. Teams come later in the tournament. (The slice ends with the pool's second round.)</p>
    ${results ? `<p class="pm-sub" style="margin-top:8px">Results</p>${results}` : ''}`;
}
