import type { Action, GameState } from '../simulation';
import { autoOrderView, figuresAgainst, nextLevel, skillFigures, type SkillFigures } from '../simulation/preview';
import type { AutoFighter } from '../combat/auto';
import { bindCap } from '../input/caps';
import { actsOf } from '../settings/settings';
import { v2KitOf } from '../simulation/v2';
import { RIVALS } from '../narrative/roster';
import { num, skillName, tx, type TextKey } from '../narrative/text';
import { PEOPLE } from '../narrative/people';
import { GENERICS } from '../narrative/generics';
import { SKILL_BOOK } from '../combat/skillbook';
import { AUTO_ROLES, AUTO_SKILLS, autoCondOf, autoCondsFor, autoKitFor, kitRankFault, skillRank } from '../combat/autoData';
import { AUTO_RULES, type AutoCond, type AutoRole } from '../combat/auto';
import { COND_TEXT } from '../simulation/v2skills';
import { figHtml, statsHtml } from './wares';
import { arrowKeys, el, esc, fillFoot, footBtn, pickRow, scrollFade } from './style';

/** The skills, and the match sheet that chooses them (journal Passe UM11, the audit of Passe UM10; the structure of the gear's page, journal Passe UM9): on the
 *  right the skills owned, a square marking the four brought, and for the line selected what the skill does and what its next level gives; on the left the
 *  hero or the opponent, and the order in which the automatic uses these four in the duel played by the computer (AC-09, lot 2, journal Passe LC3), each with
 *  its charge, then the light attack; the player's left and right keys (the pad's D-pad) move the skill selected earlier or later. The numbers are the duel's
 *  (src/simulation/preview.ts). The model « La Brute » (PB-1, journal Passe CF3) has no AP; since its lot 2 (briefs/combat-auto.md § 33.5) the page is the plan
 *  of combat: each skill's role, its uses in a bout and the gap between two, a condition per skill among its role's (C), the order of the four; the match sheet's
 *  plan is kept for its rival (`foe`: « un plan par rival », taken up when it is met again), the skills page's the general one. */
const ROLE: Record<AutoRole, TextKey> = {
  exploit: 'ui.role.exploit', punish: 'ui.role.punish', pierce: 'ui.role.pierce', breaker: 'ui.role.breaker', opener: 'ui.role.opener', interrupt: 'ui.role.interrupt',
  ward: 'ui.role.ward', parry: 'ui.role.parry', haste: 'ui.role.haste', slow: 'ui.role.slow', load: 'ui.role.load',
  finisher: 'ui.role.finisher', strip: 'ui.role.strip', evade: 'ui.role.evade', recover: 'ui.role.recover', sap: 'ui.role.sap',
};
/** a skill's role in the duel, in words (PB-1: « un rôle par compétence ») */
export const roleName = (id: string): string => { const r = AUTO_ROLES[id]?.role; return r ? tx(ROLE[r]) : ''; };

const FAMILY = { offensive: 'v2.family.offensive', defensive: 'v2.family.defensive', support: 'v2.family.support' } as const;
/** a skill's rank in words (the operator's SK-1 and SK-11 « Ces mots », journal Passe SK2: technique, super, ultimate) */
const RANK = { technique: 'ui.rank.technique', super: 'ui.rank.super', ultimate: 'ui.rank.ultimate' } as const;
export const rankName = (id: string): string => tx(RANK[skillRank(id)]);
/** what a line of the list says beside the level: an attack its rank, a defence or a support its family (a technique too) */
const tagOf = (id: string): string => { const f = SKILL_BOOK[id]?.family ?? 'offensive'; return f === 'offensive' ? rankName(id) : tx(FAMILY[f]); };
const pct = (k: number): number => Math.round(Math.abs(k - 1) * 100);
const cap = (t: string): string => t[0].toUpperCase() + t.slice(1);

/** what the skill does, in a sentence made of its numbers */
function doesWhat(f: SkillFigures): string {
  const both = (a: string, b: string): string => (a && b ? tx('ui.skill.both', { a, b }) : a || b);
  // a support says its role's effect (PB-1: the haste and the slow on the charges, the load on the next offensive action), a parry its window
  if (f.role === 'haste') return tx('ui.skill.haste', { dur: f.dur, pct: pct(AUTO_RULES.haste.k) });
  if (f.role === 'slow') return tx('ui.skill.slow', { dur: f.dur, pct: pct(AUTO_RULES.slow.k) });
  if (f.role === 'load' && f.boost) return tx('ui.skill.load', { dur: f.dur, what: both(tx('ui.skill.moreHit', { pct: pct(f.boost.damage) }), f.boost.resist !== 1 ? tx('ui.skill.moreGauge', { pct: pct(f.boost.resist) }) : '') });
  if (f.role === 'parry') return tx('ui.skill.parry', { dur: f.dur, open: AUTO_RULES.parry.open });
  if (f.ward) return tx('ui.skill.ward', { dur: f.dur, what: both(f.ward.damage !== 1 ? tx('ui.skill.lessHit', { pct: pct(f.ward.damage) }) : '', f.ward.resist !== 1 ? tx('ui.skill.lessGauge', { pct: pct(f.ward.resist) }) : '') });
  if (f.boost) return tx('ui.skill.boost', { dur: f.dur, what: both(f.boost.damage !== 1 ? tx('ui.skill.moreHit', { pct: pct(f.boost.damage) }) : '', f.boost.resist !== 1 ? tx('ui.skill.moreGauge', { pct: pct(f.boost.resist) }) : '') });
  // a skill that strikes several blows says so, their damage added up as the duel adds it (journal Passe CO2)
  return `${f.hits > 1 ? tx('ui.skill.strikes', { n: f.hits, damage: f.damage, gauge: f.gauge }) : tx('ui.skill.strike', { damage: f.damage, gauge: f.gauge })}${f.pierce ? ` ${tx('ui.skill.pierce')}` : ''}`;
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
    // its uses in a bout by its level and the gap between two (PB-2; lot 2 of « La Brute »)
    now.uses ? row(tx('ui.skill.uses'), now.uses, next?.uses) : '',
    now.gapS ? row(tx('ui.skill.gap'), now.gapS, next?.gapS, ' s') : '',
  ];
  return `<div class="pm-cmp"><span class="h"></span><span class="h">${next ? tx('ui.wares.now') : ''}</span><span class="h">${next ? cap(tx('v2.skills.level', { level })) : ''}</span><span class="h"></span>${rows.join('')}</div>`;
}

/** a skill's condition in the tactic (SY-08, lot 2 of the second redesign, journal Passe SL3): the plan kept for `foe` (its match sheet), else the general one */
const condOf = (s: GameState, id: string, foe?: string): AutoCond => autoCondOf(autoKitFor(v2KitOf(s), foe), id);
/** the automatic's rule for each role (PB-1, src/combat/auto.ts autoRole), spelt out */
const AUTO_TEXT: Record<AutoRole, TextKey> = {
  exploit: 'ui.skill.autoExploit', punish: 'ui.skill.autoOff', pierce: 'ui.skill.autoOff', breaker: 'ui.skill.autoOff', opener: 'ui.skill.autoOpener', interrupt: 'ui.skill.autoInterrupt',
  ward: 'ui.skill.autoWard', parry: 'ui.skill.autoParry', haste: 'ui.skill.autoHaste', slow: 'ui.skill.autoSlow', load: 'ui.skill.autoLoad',
  finisher: 'ui.skill.autoFinisher', strip: 'ui.skill.autoStrip', evade: 'ui.skill.autoEvade', recover: 'ui.skill.autoRecover', sap: 'ui.skill.autoOff',
};
/** when a skill leaves, said in a sentence: its condition, the automatic's own rule spelt out for its role */
function whenText(s: GameState, id: string, foe?: string): string {
  const c = condOf(s, id, foe);
  if (c !== 'auto') return tx('ui.skill.leaves', { cond: tx(COND_TEXT[c]) });
  return tx(AUTO_TEXT[AUTO_ROLES[id]?.role ?? 'punish']);
}

/** the order of the duel played by the computer: the four in the automatic's order with their uses and their conditions (the plan), then the light attack */
function orderHtml(s: GameState, ids: string[], foe?: string): string {
  return autoOrderView(s, ids, foe).map((t, i) => `<div class="row"><small>${tx('ui.order.uses', { n: t.uses, gap: num(t.gapS) })} · ${esc(tx(COND_TEXT[condOf(s, t.id, foe)]))}</small><b>${i + 1}. ${esc(skillName(t.id))}</b></div>`).join('')
    + `<div class="row"><small>${tx('ui.order.else')}</small><b>${esc(tx('ui.skill.light'))}</b></div>`;
}
/** whose plan the page sets: the rival's (kept for them, or begun from the general one) or the general one */
function planLine(s: GameState, foe: string | undefined, name: string | undefined): string {
  if (!foe || !name) return tx('ui.order.general');
  return tx(v2KitOf(s).plans?.[foe] ? 'ui.order.kept' : 'ui.order.fromGeneral', { name });
}

export interface SkillsHost {
  state(): GameState;
  act(a: Action): unknown;
  close(): void;
  /** the match sheet: the four are kept and the bout follows */
  enter?(): void;
  /** the match sheet's rival and their name: the plan set here is kept for them (lot 2 of « La Brute ») */
  foe?: string;
  foeName?: string;
  /** the two fighters the figures are reckoned for, when they are not the next bout's (the sheet of a challenge, GP-13) */
  vs?(): { ren: AutoFighter; foe: AutoFighter } | null;
  /** the foot's way in, when it is not the arena's (the sheet of a challenge: the sand), and the page's subtitle with it */
  enterLabel?: string;
  pickLabel?: string;
}

/** the page: `sheet` the match sheet's left side, the bout following; null the hero's skills */
export function skillsPage(host: SkillsHost, sheet: string | null): { root: HTMLElement; focus(): void } {
  const s = host.state(), kit = v2KitOf(s) as { loadout: string[]; levels: Record<string, number> }, chosen = new Set<string>(kit.loadout), owned = Object.keys(kit.levels).filter((k) => kit.levels[k] > 0);
  const root = el('div', 'pm pm-overlay'), card = el('div', 'pm-card pm-two pm-skills');
  card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', tx('v2.skills.title'));
  card.innerHTML = `<section class="pm-self${sheet === null ? '' : ' pm-match'}">${sheet === null ? `${figHtml(s)}<div class="pm-worn pm-ladder"></div><dl class="pm-stats">${statsHtml(s)}</dl>` : `<div class="pm-foe-side">${sheet}</div><div class="pm-stats pm-ladder2"></div>`}</section>`
    + `<section class="pm-goods"><header class="pm-ghead"><h2 class="pm-h">${tx('v2.skills.title')}<small>${sheet === null ? tx('v2.skills.sub') : host.pickLabel ?? tx(host.enter ? 'v2.skills.pick' : 'prep.sheet.pick')}</small></h2><div class="pm-purse"><b></b><small>${tx('ui.skill.of4')}</small></div></header><div class="pm-glist"></div><div class="pm-detail" aria-live="polite"></div><div class="pm-foot"></div></section>`;
  root.appendChild(card);
  const list = card.querySelector('.pm-glist') as HTMLElement, detail = card.querySelector('.pm-detail') as HTMLElement, foot = card.querySelector('.pm-foot') as HTMLElement;
  const fit = scrollFade(detail);
  // the match sheet's side (both fighters, then the order of the four) scrolls under its fade where the window is short (journal Passe LC4: 720 px)
  const side = card.querySelector('.pm-match') as HTMLElement | null, fitSide = side ? scrollFade(side) : null;
  const close = footBtn('Esc', tx('ui.close'), () => host.close());
  // the match sheet ahead of its bout (GP-12) has no way in: the plan set on it is kept for that rival until the day
  const go = sheet === null || !host.enter ? null : footBtn('Enter', host.enterLabel ?? tx('v2.skills.keep'), () => host.enter?.(), true);
  const four = (): string[] => { const was = v2KitOf(host.state()).loadout as string[]; return was.filter((x) => chosen.has(x)).concat([...chosen].filter((x) => !was.includes(x))); };
  // `refused`: why the skill selected cannot join the four (SK-2: one ultimate and one super at most)
  let now = '', full = false, refused = '';

  const foe = host.foe;
  const paint = (): void => {
    (card.querySelector('.pm-purse b') as HTMLElement).textContent = String(chosen.size);
    const ladder = card.querySelector('.pm-ladder'), wide = card.querySelector('.pm-ladder2');
    // the plan: the general one on the skills page, the rival's on the match sheet (kept for them), each skill's uses and its condition
    if (ladder) ladder.innerHTML = `<p class="pm-sub">${tx('ui.order.title')}</p>${orderHtml(host.state(), four())}`;
    if (wide) wide.innerHTML = `<p class="ttl">${esc(foe && host.foeName ? tx('ui.order.vs', { name: host.foeName }) : tx('ui.order.title'))}</p><p class="pm-sub">${esc(planLine(host.state(), foe, host.foeName))}</p>${autoOrderView(host.state(), four(), foe).map((t, i) => `<div><dt>${i + 1}. ${esc(skillName(t.id))}</dt><dd>${tx('ui.order.uses', { n: t.uses, gap: num(t.gapS) })}<br>${esc(tx(COND_TEXT[condOf(host.state(), t.id, foe)]))}</dd></div>`).join('')}<div><dt>${esc(tx('ui.skill.light'))}</dt><dd>${tx('ui.order.else')}</dd></div>`;
    if (go) go.disabled = chosen.size !== 4;
    const lv = kit.levels[now], st = host.state(), vs = host.vs?.() ?? null, f = skillFigures(st, now, lv, vs), up = nextLevel(st, now), k = SKILL_BOOK[now];
    // whom the skills page reckons its figures against (GP-12: the next opponent, no longer the pool's Marek)
    const against = sheet === null ? figuresAgainst(st) : null, vsLine = against ? tx('ui.skill.against', { name: RIVALS[against.foe]?.name ?? against.foe, day: against.day }) : '';
    // the next level: the practice sand's up to its cap, then Master Corvin's lesson (the operator's NC-11, journal Passe SK4)
    const said = !up ? tx('ui.skill.top') : up.by === 'lesson' ? tx('ui.skill.lesson', { level: up.level, price: up.price, day: up.day }) : tx('ui.skill.drill', { level: up.level });
    // a rival's signature says whom it was learnt from (SK-4), and a skill a fighter of the town teaches its teacher (NC-10: « Apprise de Lucan Rook »)
    const from = k?.signature ? RIVALS[k.signature]?.name ?? k.signature : k?.teacher ? PEOPLE[k.teacher]?.name ?? GENERICS[k.teacher]?.name ?? k.teacher : null;
    const sig = from ? tx('ui.skill.signature', { name: from }) : '';
    const on = chosen.has(now), movable = on && chosen.size === 4;
    // the tactic (SY-08): when a skill brought leaves, its condition chosen with C (the pad's Y)
    // when it leaves, and on the skills page whose plan that is (the general one; a rival's is set on its match sheet)
    const when = on ? `<p class="ab pm-when">${esc(whenText(st, now, foe))}</p>${sheet === null ? `<p class="what">${esc(planLine(st, undefined, undefined))}</p>` : ''}` : '';
    const role = roleName(now);
    detail.innerHTML = `<p class="nm">${esc(skillName(now))}</p><p class="what">${esc(cap(tx(FAMILY[k?.family ?? 'offensive'])))} · ${esc(rankName(now))}${role ? ` · ${esc(tx('ui.skill.role', { role }))}` : ''} · ${tx('v2.skills.level', { level: lv })}</p><p class="ab">${esc(doesWhat(f))}</p>${when}${cmpHtml(f, up ? skillFigures(st, now, up.level, vs) : null, up?.level ?? lv)}${vsLine ? `<p class="what">${esc(vsLine)}</p>` : ''}<p class="what">${esc(said)}</p>${sig ? `<p class="what">${esc(sig)}</p>` : ''}${full ? `<p class="no">${tx('ui.skill.full')}</p>` : ''}${refused ? `<p class="no">${esc(refused)}</p>` : ''}<p class="what">${esc(tx('ui.skill.rule'))}</p>`;
    fit();
    fillFoot(foot, footBtn('Space', tx(on ? 'ui.skill.leave' : 'ui.skill.bring'), toggle), on ? footBtn('C', tx('ui.skill.when'), cycle) : null, movable ? moveBtn('left') : null, movable ? moveBtn('right') : null, go, close);
  };
  /** the order of the four (AC-09): the skill selected one place earlier (left) or later (right), the game's at once (setOrder) */
  const ordered = (): string[] => autoOrderView(host.state(), four(), foe).map((t) => t.id);
  /** the order in sight under the side's fade (the keys that move it touched, whether it moves or not) */
  const showOrder = (): void => {
    const ladder = card.querySelector<HTMLElement>('.pm-ladder2');
    if (side && ladder) { const d = ladder.getBoundingClientRect().bottom - side.getBoundingClientRect().bottom; if (d > 0) side.scrollTop += d; fitSide?.(); }
  };
  const move = (by: -1 | 1): void => {
    showOrder();
    if (!chosen.has(now) || chosen.size !== 4) return;
    const o = ordered(), i = o.indexOf(now), j = i + by;
    if (i < 0 || j < 0 || j >= o.length) return;
    [o[i], o[j]] = [o[j], o[i]];
    host.act({ type: 'setOrder', skills: o, ...(foe ? { foe } : {}) });
    paint();
    showOrder();
    list.querySelector<HTMLElement>('.pm-btn.on')?.focus();
  };
  const moveBtn = (dir: 'left' | 'right'): HTMLButtonElement => {
    const b = el('button', 'pm-btn', `${bindCap(dir)}<span>${esc(tx(dir === 'left' ? 'ui.order.earlier' : 'ui.order.later'))}</span>`);
    b.addEventListener('click', () => move(dir === 'left' ? -1 : 1));
    return b;
  };
  list.addEventListener('keydown', (e) => {
    const a = actsOf(e, 'walk');
    if (!a.includes('left') && !a.includes('right')) return;
    e.preventDefault(); e.stopPropagation();
    if (!e.repeat) move(a.includes('left') ? -1 : 1);
  });
  /** the tactic (the operator's SY-08 « Une condition par compétence, l’ordre gardé », journal Passe SY2): the skill selected, if brought, takes the next condition its
   *  role offers (src/combat/autoData.ts autoCondsFor, lot 2 of « La Brute »), the game's at once (setTactic), for the match sheet's rival or the general plan */
  const cycle = (): void => {
    if (!chosen.has(now) || !(v2KitOf(host.state()).loadout as string[]).includes(now)) return;
    if (!AUTO_SKILLS[now]?.family) return;
    // the conditions of its role (PB-1, lot 2 of « La Brute »), the plan of the match sheet's rival or the general one
    const opts = autoCondsFor(now), c = condOf(host.state(), now, foe);
    host.act({ type: 'setTactic', skill: now, cond: opts[(opts.indexOf(c) + 1) % opts.length], ...(foe ? { foe } : {}) });
    paint();
    list.querySelector<HTMLElement>('.pm-btn.on')?.focus();
  };
  list.addEventListener('keydown', (e) => { if (e.key.toLowerCase() !== 'c' || e.ctrlKey || e.metaKey || e.altKey) return; e.preventDefault(); e.stopPropagation(); if (!e.repeat) cycle(); });
  const toggle = (): void => {
    // the foot's button is drawn again: the selection keeps the keyboard
    list.querySelector<HTMLElement>('.pm-btn.on')?.focus();
    full = !chosen.has(now) && chosen.size >= 4;
    // one ultimate and one super at most among the four (the operator's SK-2, journal Passe SK2): refused, and said why
    const fault = !chosen.has(now) && !full ? kitRankFault([...chosen, now]) : null;
    refused = fault ? tx(fault === 'ultimate' ? 'v2.loadout.ultimate' : 'v2.loadout.super') : '';
    if (chosen.has(now)) chosen.delete(now); else if (!full && !fault) chosen.add(now);
    list.querySelector('.pm-btn.on')?.setAttribute('aria-pressed', String(chosen.has(now)));
    // the four are the game's as soon as there are four: a page left by Esc keeps them too
    if (chosen.size === 4 && four().join() !== (v2KitOf(host.state()).loadout as string[]).join()) host.act({ type: 'setLoadout', skills: four() });
    paint();
  };
  for (const id of owned) {
    const lv = kit.levels[id];
    const b = pickRow(`<i class="pm-check"></i><span>${esc(skillName(id))}<span class="why">${tx('v2.skills.level', { level: lv })} · ${esc(tagOf(id))}</span></span><span class="cost"></span>`, { select: () => { now = id; full = false; refused = ''; paint(); }, press: toggle });
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
