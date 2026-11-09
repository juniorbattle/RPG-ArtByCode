import type { Action, GameState } from '../simulation';
import { chargeLadder, nextLevel, skillFigures, type SkillFigures } from '../simulation/preview';
import { v2KitOf } from '../simulation/v2';
import { RIVALS } from '../narrative/roster';
import { num, skillName, tx } from '../narrative/text';
import { SKILL_BOOK } from '../combat/skillbook';
import { figHtml, statsHtml } from './wares';
import { arrowKeys, el, esc, fillFoot, footBtn, pickRow, scrollFade } from './style';

/** The skills, and the match sheet that chooses them (journal Passe UM11, the audit of Passe UM10; the structure of the gear's page, journal Passe UM9): on the
 *  right the skills owned, a square marking the four brought, and for the line selected what the skill does and what its next level gives; on the left the
 *  hero or the opponent, and the charge as these four make it, tier after tier. The numbers are the duel's (src/simulation/preview.ts). */

const FAMILY = { offensive: 'v2.family.offensive', defensive: 'v2.family.defensive', support: 'v2.family.support' } as const;
const pct = (k: number): number => Math.round(Math.abs(k - 1) * 100);
const cap = (t: string): string => t[0].toUpperCase() + t.slice(1);

/** what the skill does, in a sentence made of its numbers */
function doesWhat(f: SkillFigures): string {
  const both = (a: string, b: string): string => (a && b ? tx('ui.skill.both', { a, b }) : a || b);
  if (f.ward) return tx('ui.skill.ward', { dur: f.dur, what: both(f.ward.damage !== 1 ? tx('ui.skill.lessHit', { pct: pct(f.ward.damage) }) : '', f.ward.resist !== 1 ? tx('ui.skill.lessGauge', { pct: pct(f.ward.resist) }) : '') });
  if (f.boost) return tx('ui.skill.boost', { dur: f.dur, what: both(f.boost.damage !== 1 ? tx('ui.skill.moreHit', { pct: pct(f.boost.damage) }) : '', f.boost.resist !== 1 ? tx('ui.skill.moreGauge', { pct: pct(f.boost.resist) }) : '') });
  return `${tx('ui.skill.strike', { damage: f.damage, gauge: f.gauge })}${f.pierce ? ` ${tx('ui.skill.pierce')}` : ''}`;
}

/** the figures now and at the next level */
function cmpHtml(now: SkillFigures, next: SkillFigures | null, level: number): string {
  const row = (label: string, a: number, b: number | undefined, unit = ''): string => `<span class="l">${label}</span><span class="${next ? 'v' : 'a'}">${num(a)}${unit}</span><span class="a${b !== undefined && b !== a ? ' up' : ''}">${b === undefined ? '' : `${num(b)}${unit}`}</span><span class="m"></span>`;
  const rows = [
    now.power ? row(tx('ui.skill.power'), now.power, next?.power) : '',
    now.damage ? row(tx('ui.skill.damage'), now.damage, next?.damage) : '',
    now.gauge ? row(tx('ui.skill.gauge'), now.gauge, next?.gauge) : '',
    now.dur ? row(tx('ui.skill.length'), now.dur, next?.dur, ' s') : '',
    row(tx('ui.skill.charge'), now.charge, next?.charge, ' s'),
  ];
  return `<div class="pm-cmp"><span class="h"></span><span class="h">${next ? tx('ui.wares.now') : ''}</span><span class="h">${next ? cap(tx('v2.skills.level', { level })) : ''}</span><span class="h"></span>${rows.join('')}</div>`;
}

/** the charge, tier after tier */
function ladderHtml(s: GameState, ids: string[]): string {
  return chargeLadder(s, ids).map((t) => {
    const name = t.id === 'light' ? tx('ui.skill.light') : skillName(t.id);
    const when = t.id === 'light' ? tx('ui.skill.tap') : `${t.at} s${t.ap ? ` · ${tx('v2.skills.ap', { ap: t.ap })}` : ''}`;
    return `<div class="row"><small>${when}</small><b>${esc(name)}</b></div>`;
  }).join('');
}

export interface SkillsHost {
  state(): GameState;
  act(a: Action): unknown;
  close(): void;
  /** the match sheet: the four are kept and the bout follows */
  enter?(): void;
}

/** the page: `sheet` the match sheet's left side, the bout following; null the hero's skills */
export function skillsPage(host: SkillsHost, sheet: string | null): { root: HTMLElement; focus(): void } {
  const s = host.state(), kit = v2KitOf(s) as { loadout: string[]; levels: Record<string, number> }, chosen = new Set<string>(kit.loadout), owned = Object.keys(kit.levels).filter((k) => kit.levels[k] > 0);
  const root = el('div', 'pm pm-overlay'), card = el('div', 'pm-card pm-two pm-skills');
  card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', tx('v2.skills.title'));
  card.innerHTML = `<section class="pm-self">${sheet === null ? `${figHtml(s)}<div class="pm-worn pm-ladder"></div><dl class="pm-stats">${statsHtml(s)}</dl>` : `<div class="pm-foe-side">${sheet}</div><div class="pm-stats pm-ladder2"></div>`}</section>`
    + `<section class="pm-goods"><header class="pm-ghead"><h2 class="pm-h">${tx('v2.skills.title')}<small>${tx(sheet === null ? 'v2.skills.sub' : 'v2.skills.pick')}</small></h2><div class="pm-purse"><b></b><small>${tx('ui.skill.of4')}</small></div></header><div class="pm-glist"></div><div class="pm-detail" aria-live="polite"></div><div class="pm-foot"></div></section>`;
  root.appendChild(card);
  const list = card.querySelector('.pm-glist') as HTMLElement, detail = card.querySelector('.pm-detail') as HTMLElement, foot = card.querySelector('.pm-foot') as HTMLElement;
  const fit = scrollFade(detail);
  const close = footBtn('Esc', tx('ui.close'), () => host.close());
  const go = sheet === null ? null : footBtn('Enter', tx('v2.skills.keep'), () => host.enter?.(), true);
  const four = (): string[] => { const was = v2KitOf(host.state()).loadout as string[]; return was.filter((x) => chosen.has(x)).concat([...chosen].filter((x) => !was.includes(x))); };
  let now = '', full = false;

  const paint = (): void => {
    (card.querySelector('.pm-purse b') as HTMLElement).textContent = String(chosen.size);
    const ladder = card.querySelector('.pm-ladder'), wide = card.querySelector('.pm-ladder2');
    if (ladder) ladder.innerHTML = `<p class="pm-sub">${tx('ui.skill.ladder')}</p>${ladderHtml(host.state(), four())}`;
    if (wide) wide.innerHTML = `<p class="ttl">${tx('ui.skill.ladder')}</p>${chargeLadder(host.state(), four()).map((t) => `<div><dt>${esc(t.id === 'light' ? tx('ui.skill.light') : skillName(t.id))}</dt><dd>${t.id === 'light' ? tx('ui.skill.tap') : `${num(t.at)} s`}</dd></div>`).join('')}`;
    if (go) go.disabled = chosen.size !== 4;
    const lv = kit.levels[now], st = host.state(), f = skillFigures(st, now, lv), up = nextLevel(st, now), k = SKILL_BOOK[now];
    const said = !up ? tx('ui.skill.top') : up.by === 'drill' ? tx('ui.skill.drill', { level: up.level }) : tx('ui.skill.challenge', { name: RIVALS[up.teacher!].name });
    detail.innerHTML = `<p class="nm">${esc(skillName(now))}</p><p class="what">${esc(cap(tx(FAMILY[k?.family ?? 'offensive'])))} · ${tx('v2.skills.level', { level: lv })} · ${tx('v2.skills.ap', { ap: f.ap })}</p><p class="ab">${esc(doesWhat(f))}</p>${cmpHtml(f, up ? skillFigures(st, now, up.level) : null, up?.level ?? lv)}<p class="what">${esc(said)}</p>${full ? `<p class="no">${tx('ui.skill.full')}</p>` : ''}`;
    fit();
    const on = chosen.has(now);
    fillFoot(foot, footBtn('Space', tx(on ? 'ui.skill.leave' : 'ui.skill.bring'), toggle), go, close);
  };
  const toggle = (): void => {
    // the foot's button is drawn again: the selection keeps the keyboard
    list.querySelector<HTMLElement>('.pm-btn.on')?.focus();
    full = !chosen.has(now) && chosen.size >= 4;
    if (chosen.has(now)) chosen.delete(now); else if (!full) chosen.add(now);
    list.querySelector('.pm-btn.on')?.setAttribute('aria-pressed', String(chosen.has(now)));
    // the four are the game's as soon as there are four: a page left by Esc keeps them too
    if (chosen.size === 4 && four().join() !== (v2KitOf(host.state()).loadout as string[]).join()) host.act({ type: 'setLoadout', skills: four() });
    paint();
  };
  for (const id of owned) {
    const lv = kit.levels[id], k = SKILL_BOOK[id];
    const b = pickRow(`<i class="pm-check"></i><span>${esc(skillName(id))}<span class="why">${tx('v2.skills.level', { level: lv })} · ${tx(FAMILY[k?.family ?? 'offensive'])}</span></span><span class="cost">${tx('v2.skills.ap', { ap: skillFigures(s, id, lv).ap })}</span>`, { select: () => { now = id; full = false; paint(); }, press: toggle });
    b.setAttribute('aria-pressed', String(chosen.has(id)));
    list.appendChild(b);
  }
  arrowKeys(list); scrollFade(list);
  // the match sheet: Enter enters the arena, whatever line is selected; a held Enter from the list that led here does nothing
  if (go) card.addEventListener('keydown', (e) => { if (e.key !== 'Enter') return; e.preventDefault(); e.stopPropagation(); if (!e.repeat && !go.disabled) go.click(); });
  now = owned.find((id) => chosen.has(id)) ?? owned[0];
  paint();
  return { root, focus: () => { list.querySelector<HTMLElement>('.pm-btn')?.focus(); } };
}
