import { RIVALS, PLAYER_ID, ROUNDS, POINTS } from '../narrative/roster';
import type { GameState, MatchRecord } from '../simulation';
import { arrowKeys, el, esc, fillFoot, footBtn, pickRow, scrollFade } from './style';
import { portraitUrl } from './portraits';
import { tx } from '../narrative/text';
import { isV2 } from '../simulation/v2';
import { marksOf } from '../simulation/v2law';
import { actOf, pendingFinal, stageName } from '../tournament/v2calendar';
import { FOE_SKILLS, V2_FOES } from '../combat/v2duel';
import { heardLine, seenInTown } from '../simulation/v2intel';
import { stanceLine } from '../simulation/v2rivals';
import { festivalLine, FESTIVAL_DAY, FEST } from '../simulation/v2festival';

/** The tournament board (TOURNAMENT_MASTER_CONTRACT § 11, journal Passes L3 / L4 / UM11, the audit of Passe UM10; the structure of the gear's page, journal Passe
 *  UM9): on the left the phase, the next deadline and the pool's standings; on the right the fighter selected, the next opponent first: their bouts fought and
 *  to come; then what a defeat costs and when the format changes, in plain words. */

type Row = { id: string; points: number; reputation: number };

export function standingsHtml(st: GameState, rows: Row[]): string {
  const tr = rows.map((r, i) => {
    const me = r.id === PLAYER_ID, c = st.competitors[r.id];
    const name = me ? st.player.name : RIVALS[r.id].name, hurt = c && c.healthState !== 'fit' ? ` <span class="pm-sub">${tx('ui.board.hurt')}</span>` : '';
    return `<tr${me ? ' class="me"' : ''}><td>${i + 1}.</td><td>${esc(name)}${hurt}</td><td class="pts"><span class="pm-num">${r.points}</span> ${tx('ui.board.pts')}</td></tr>`;
  }).join('');
  return `<table class="pm-table">${tr}</table>`;
}

export interface Bout { m: MatchRecord; foe: string; won: boolean | null }

/** a fighter's bouts in the calendar's order, those fought and those to come */
export function boutsOf(st: GameState, id: string): Bout[] {
  return st.tournament.matches.filter((m) => m.a === id || m.b === id).sort((x, y) => x.day - y.day).map((m) => ({ m, foe: m.a === id ? m.b : m.a, won: m.winner ? m.winner === id : null }));
}

/** the player's next bout */
export function nextBout(st: GameState): MatchRecord | null {
  return st.tournament.matches.find((x) => x.day >= st.day && !x.winner && (x.a === PLAYER_ID || x.b === PLAYER_ID)) ?? null;
}

export function deadline(st: GameState): string {
  if (isV2(st)) {
    const m = nextBout(st), opp = m ? RIVALS[m.a === PLAYER_ID ? m.b : m.a] : null;
    if (m && opp) return `${esc(tx('v2.board.against', { stage: stageName(m), name: opp.name, epithet: opp.epithet }))}${tx('v2.board.when', { day: m.day })}${m.day === st.day ? tx('ui.board.today') : ''}`;
    // a finalist before the final is drawn (lot L5: « Your bouts are fought » was said on days 7 and 8)
    const f = pendingFinal(st), fo = f?.foe ? RIVALS[f.foe] : null;
    return f && fo ? `${esc(tx('v2.board.against', { stage: tx('v2.stage.final'), name: fo.name, epithet: fo.epithet }))}${tx('v2.board.when', { day: f.day })}` : tx('v2.board.fought');
  }
  const next = ROUNDS.find((r) => r.day >= st.day && !st.tournament.matches.some((m) => m.round === r.round && m.winner && (m.a === PLAYER_ID || m.b === PLAYER_ID)));
  const opp = next?.pairs.find((p) => p.includes(PLAYER_ID))?.find((x) => x !== PLAYER_ID);
  return next ? esc(tx('ui.board.deadline', { round: next.round, name: RIVALS[opp!].name, epithet: RIVALS[opp!].epithet, day: next.day, today: next.day === st.day ? tx('ui.board.today') : '' })) : tx('ui.board.fought');
}

/** the phase, then the rules */
export function phaseOf(st: GameState): string {
  if (!isV2(st)) return tx('ui.board.phase');
  const act = actOf(st.day);
  return tx(act === 1 ? 'v2.board.act1' : act === 2 ? 'v2.board.act2' : 'v2.board.act3');
}
export function rulesHtml(st: GameState): string {
  return isV2(st)
    ? `<p class="pm-sub">${tx('v2.board.rules')}</p><p>${tx('v2.board.points', { win: POINTS.win, close: POINTS.close, loss: POINTS.loss })}</p><p>${tx('v2.board.cut')}</p><p>${tx('v2.board.bracket')}</p>${st.day === FESTIVAL_DAY ? `<p>${tx('v2.fest.rule', { purse: FEST.purse, rep: FEST.rep, fame: FEST.fame })}</p>` : ''}`
    : `<p class="pm-sub">${tx('ui.board.rules')}</p><p>${tx('ui.board.points', { win: POINTS.win, close: POINTS.close, loss: POINTS.loss })}</p><p>${tx('ui.board.after')}</p>`;
}

const nameOf = (st: GameState, id: string): string => (id === PLAYER_ID ? st.player.name : RIVALS[id].name);

function boutHtml(st: GameState, b: Bout): string {
  const foe = nameOf(st, b.foe), close = b.m.close ? tx('ui.board.close') : '', stage = isV2(st) ? stageName(b.m) : tx('ui.board.round', { round: b.m.round });
  const said = b.won === null ? tx('ui.board.vs', { name: foe }) : b.won ? tx('ui.board.beat', { name: foe, close }) : tx('ui.board.lostTo', { name: foe, close });
  return `<div class="pm-bout${b.won === null ? ' next' : ''}"><span><b>${esc(said)}</b><small>${esc(stage)}</small></span><span class="d">${tx('ui.dayN', { day: b.m.day })}</span></div>`;
}

/** the fighter on the right */
function fighterHtml(st: GameState, id: string): { head: string; body: string } {
  const me = id === PLAYER_ID, r = me ? null : RIVALS[id], c = st.competitors[id], bouts = boutsOf(st, id), url = portraitUrl(id);
  const wins = bouts.filter((b) => b.won === true).length, losses = bouts.filter((b) => b.won === false).length;
  const sub = [r?.epithet ?? '', tx('ui.board.record', { wins, losses }), c && c.healthState !== 'fit' ? tx('ui.board.hurt') : ''].filter(Boolean).join(' · ');
  const foe = isV2(st) ? V2_FOES[id] : undefined, known = foe && st.facts.includes(`scouted:${id}`) ? tx('ui.arena.foeSkills', { name: r!.name, skills: foe.skills.list.map((k) => FOE_SKILLS[k.id].name).join(', ') }) : '';
  const fought = bouts.filter((b) => b.won !== null), ahead = bouts.filter((b) => b.won === null);
  // a version 2 game (lot L3, EV-11 « activité lisible »): what the town saw them do since yesterday, and the last rumour heard of them, with its source
  const heard = isV2(st) && r ? heardLine(st, id) : null, seen = isV2(st) && r ? seenInTown(st, id) : '';
  // lot L4 (EV-9 « Chaque rival se souvient »): what stands between you, and why
  const between = isV2(st) && r ? stanceLine(st, id) : null;
  // lot L6 (FE-4): tonight's lanterns behind them and why, on the festival's day; the parade's result after
  const lanterns = festivalLine(st, id);
  return {
    head: `<div class="pm-who">${url ? `<img src="${url}" alt="">` : ''}<h2 class="pm-h">${esc(nameOf(st, id))}<small>${esc(sub)}</small></h2><div class="pm-rec"><b>${st.tournament.points[id] ?? 0}</b><small>${tx('ui.board.pts')}</small></div></div>`,
    body: `${r ? `<p>${esc(r.bio)}</p>` : ''}${me ? nameHtml(st) : ''}${between ? `<p class="pm-entry">${esc(between)}</p>` : ''}${lanterns ? `<p class="pm-entry">${esc(lanterns)}</p>` : ''}${known ? `<p class="pm-entry">${esc(known)}</p>` : ''}${seen ? `<p class="pm-entry">${esc(seen)}</p>` : ''}${heard ? `<p class="pm-entry">${esc(heard)}</p>` : ''}${ahead.length ? `<p class="pm-sub">${tx('ui.board.ahead')}</p>${ahead.map((b) => boutHtml(st, b)).join('')}` : ''}${fought.length ? `<p class="pm-sub">${tx('ui.board.results')}</p>${fought.map((b) => boutHtml(st, b)).join('')}` : ''}${rulesHtml(st)}`,
  };
}

/** a version 2 game (lot L2a; the operator's question on EV-2, « on parle de reputation mais comment cela fonctionne ? », journal Passe EV2): the player's own
 *  line says what the two numbers are, apart, and what each opens and shuts; today's game shows nothing more */
function nameHtml(st: GameState): string {
  if (!isV2(st)) return '';
  return `<p class="pm-sub">${tx('ui.name.title')}</p><p>${esc(tx('ui.name.rep', { n: st.player.reputation }))}</p><p>${esc(tx('ui.name.sus', { n: marksOf(st) }))}</p>`;
}

export function boardPage(st: GameState, rows: Row[], close: () => void): { root: HTMLElement; focus(): void } {
  const root = el('div', 'pm pm-overlay'), card = el('div', 'pm-card pm-two');
  card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', tx('ui.board.title'));
  card.innerHTML = `<section class="pm-col"><header class="pm-head"><h2 class="pm-h">${tx('ui.board.title')}</h2><p>${esc(phaseOf(st))}</p><p class="nx"><b>${tx('ui.board.next')}</b> ${deadline(st)}</p></header><div class="pm-glist pm-grow"></div></section>`
    + `<section class="pm-col"><div class="pm-who-at"></div><div class="pm-detail pm-grow"></div><div class="pm-foot"></div></section>`;
  root.appendChild(card);
  const list = card.querySelector('.pm-glist') as HTMLElement, who = card.querySelector('.pm-who-at') as HTMLElement, detail = card.querySelector('.pm-detail') as HTMLElement;
  const out = footBtn('Esc', tx('ui.close'), close), fit = scrollFade(detail);
  fillFoot(card.querySelector('.pm-foot') as HTMLElement, out);
  const n = nextBout(st), first = n ? (n.a === PLAYER_ID ? n.b : n.a) : (pendingFinal(st)?.foe ?? PLAYER_ID);
  let start: HTMLElement | null = null;
  rows.forEach((r, i) => {
    const c = st.competitors[r.id], hurt = c && c.healthState !== 'fit' ? `<span class="why">${tx('ui.board.hurt')}</span>` : '';
    const b = pickRow(`<span class="rk">${i + 1}.</span><span>${esc(nameOf(st, r.id))}${r.id === PLAYER_ID ? `<span class="me">${tx('ui.board.you')}</span>` : ''}${hurt}</span><span class="cost">${r.points} ${tx('ui.board.pts')}</span>`, {
      select: () => { const f = fighterHtml(st, r.id); who.innerHTML = f.head; detail.innerHTML = f.body; detail.scrollTop = 0; fit(); }, press: () => {},
    });
    list.appendChild(b);
    if (r.id === first) start = b;
  });
  arrowKeys(list); scrollFade(list);
  return { root, focus: () => { (start ?? list.querySelector('.pm-btn') as HTMLElement | null ?? out).focus(); } };
}
