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
import { AUTO_ROLES, autoCondOf, autoCondsFor, autoKitFor, kitRankFault, skillRank } from '../combat/autoData';
import { AUTO_RULES, type AutoCond, type AutoRole } from '../combat/auto';
import { COND_TEXT } from '../simulation/v2skills';
import { el, esc, fillFoot, footBtn, scrollFade } from './style';
import { ARROWS, arrowFocus } from './nav';

/** The skills, and the match sheet that chooses them (journal Passe UM11, the audit of Passe UM10; the structure of the gear's page, journal Passe UM9), made again for the
 *  operator's request of 15/11/2026 (« il faut que ce soit intuitif », journal Passes CM1, CM2; the sheet https://claude.ai/artifact/KKxYTXc7z2Tvm1rhwYwC6J) in the look of the
 *  sheet's mock-up (the operator: « Ce n'est pas plutot un visuel comme cela pour la gestion des competences ? »):
 *  CM-02 « A · Quatre places et un catalogue »: the four places in a row of cards in the order the duel uses them (the plan's order, AC-09), each with its skill, its level, its
 *  uses and its condition (CM-04: the role's conditions listed, the current one marked), and below them every skill owned as a tile, a filter by family, each tile saying « place
 *  2 », « free » or why it cannot come (CM-05: one ultimate and one super at most, said before any click). A click or Enter on a skill puts it in a place (when the four are taken
 *  it asks which one it replaces) and on a place takes it out (the place stays free on the screen until another skill comes: Esc keeps the one that was there; the game keeps
 *  four skills, so a replacement is one move); Space does the same on a match sheet, where Enter enters the arena; the A and D keys (the pad's LT and RT) move a place earlier or later (CM-03; the four arrows walk the page as the gear page's, IA-06);
 *  C lists the conditions. The mode, auto or manual (CM-07, CM-08), is one switch at the top right: in manual the places show their key and no condition (CM-12: the plan is kept,
 *  not read). The heavy blow is a base attack since SY-02 and is no skill to bring (CM-01). The skills page is the hero's alone (the whole width); the match sheet's plan is kept
 *  for its rival (`foe`: « un plan par rival », taken up when it is met again) beside the rival's sheet, the skills page's the general one. The numbers are the duel's
 *  (src/simulation/preview.ts). */
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
  /** the match sheet's rival and their name: the plan set here is kept for them (lot 2 of « La Brute ») */
  foe?: string;
  foeName?: string;
  /** the two fighters the figures are reckoned for, when they are not the next bout's (the sheet of a challenge, GP-13) */
  vs?(): { ren: AutoFighter; foe: AutoFighter } | null;
  /** the foot's way in, when it is not the arena's (the sheet of a challenge: the sand), and the page's subtitle with it */
  enterLabel?: string;
  pickLabel?: string;
}

type Filter = 'all' | 'offensive' | 'defensive' | 'support';

/** the page: `sheet` the match sheet's left side, the bout following; null the hero's skills */
export function skillsPage(host: SkillsHost, sheet: string | null): { root: HTMLElement; focus(): void } {
  const foe = host.foe;
  const s0 = host.state(), owned = Object.keys(v2KitOf(s0).levels).filter((k) => (v2KitOf(s0).levels[k] ?? 0) > 0 && k !== 'heavy');
  const solo = sheet === null;
  const root = el('div', 'pm pm-overlay'), card = el('div', `pm-card pm-two pm-skills${solo ? ' pm-solo' : ''}`);
  card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', tx('v2.skills.title'));
  // the skills page is the hero's alone, the whole width; the match sheet keeps the rival's sheet on its left
  card.innerHTML = (solo ? '' : `<section class="pm-self pm-match"><div class="pm-foe-side">${sheet}</div></section>`)
    + `<section class="pm-goods"><header class="pm-ghead"><h2 class="pm-h">${tx('v2.skills.title')}${solo || !host.foeName ? '' : `<span class="sk-foe">${esc(host.foeName)}</span>`}<small>${solo ? tx('v2.skills.sub') : host.pickLabel ?? tx(host.enter ? 'v2.skills.pick' : 'prep.sheet.pick')}</small></h2><div class="sk-modebox"><span class="sk-lab">${esc(tx('ui.sk.mode'))}</span><button class="sk-mode" type="button" data-fk="mode"></button></div></header>`
    + `<p class="sk-lab sk-places-lab"></p><div class="sk-places"></div><div class="sk-note"></div><div class="sk-bar"></div><div class="pm-glist sk-tiles"></div><div class="pm-detail" aria-live="polite"></div><div class="pm-foot"></div></section>`;
  root.appendChild(card);
  const q = <T extends HTMLElement>(s: string): T => card.querySelector(s) as T;
  const places = q('.sk-places'), note = q('.sk-note'), tiles = q('.sk-tiles'), bar = q('.sk-bar'), placesLab = q('.sk-places-lab');
  const detail = q('.pm-detail'), foot = q('.pm-foot'), modeBtn = q<HTMLButtonElement>('.sk-mode');
  const fit = scrollFade(detail), side = card.querySelector('.pm-match') as HTMLElement | null;
  if (side) scrollFade(side);
  scrollFade(tiles);
  const close = footBtn('Esc', tx('ui.close'), () => host.close());
  // the match sheet ahead of its bout (GP-12) has no way in: the plan set on it is kept for that rival until the day. On a sheet Enter enters the arena; Space places and removes
  const go = solo || !host.enter ? null : footBtn('Enter', host.enterLabel ?? tx('v2.skills.keep'), () => host.enter?.(), true);

  /** what the page holds besides the game: the skill selected, a skill waiting for its place (`pick`, the four being taken), a place emptied on the screen (`free`: the game still
   *  holds its skill until another comes), the place whose conditions are listed, the family shown in the catalogue, the line said under the places */
  const S: { sel: string; pick: string | null; free: number | null; conds: number | null; filter: Filter; msg: string } = { sel: '', pick: null, free: null, conds: null, filter: 'all', msg: '' };
  const manual = (): boolean => v2KitOf(host.state()).mode === 'manual';
  const four = (): string[] => autoOrderView(host.state(), v2KitOf(host.state()).loadout as string[], foe).map((t) => t.id);
  const lvOf = (id: string): number => v2KitOf(host.state()).levels[id] ?? 1;
  const famOf = (id: string): 'offensive' | 'defensive' | 'support' => SKILL_BOOK[id]?.family ?? 'offensive';
  /** where a skill stands: its place (0 to 3) or -1 */
  const placeOf = (id: string): number => four().indexOf(id);
  /** why a skill cannot be one of these four (SK-2, said before any click: CM-05), or '' */
  const rankMsg = (id: string, of: string[], except = -1): string => {
    const r = skillRank(id);
    if (r === 'technique') return '';
    const at = of.findIndex((x, i) => i !== except && x !== id && skillRank(x) === r);
    return at < 0 ? '' : tx('ui.sk.rankTaken', { rank: tx(RANK[r]).toLowerCase(), name: skillName(of[at]), n: at + 1 });
  };
  const said = (m: string): void => { S.msg = m; };
  const focusKey = (): string => (document.activeElement as HTMLElement | null)?.closest<HTMLElement>('[data-fk]')?.dataset.fk ?? '';
  const refocus = (k: string): void => { (card.querySelector<HTMLElement>(`[data-fk="${CSS.escape(k)}"]`) ?? card.querySelector<HTMLElement>('[data-fk]'))?.focus({ preventScroll: false }); };

  /** the game's four and their order, in one move: `next` the ids by place; the order is set as the places show it (the newcomer takes the leaver's place) */
  const apply = (next: string[]): boolean => {
    const now = four();
    if (next.join() === now.join()) return true;
    if (next.some((id) => !now.includes(id))) {
      const r = host.act({ type: 'setLoadout', skills: next }) as { ok?: boolean } | undefined;
      if (r && r.ok === false) return false;
    }
    host.act({ type: 'setOrder', skills: next, ...(foe ? { foe } : {}) });
    return true;
  };
  /** a skill into a place (a free place, or the one it replaces) */
  const place = (id: string, at: number): void => {
    const now = four(), next = [...now]; next[at] = id;
    const fault = kitRankFault(next);
    if (fault) { said(rankMsg(id, next, at) || tx(fault === 'ultimate' ? 'v2.loadout.ultimate' : 'v2.loadout.super')); return; }
    if (!apply(next)) { said(tx('v2.loadout.four')); return; }
    S.sel = id; S.pick = null; S.free = null; said(tx('ui.sk.placed', { name: skillName(id), n: at + 1 }));
  };
  const move = (k: number, by: -1 | 1): void => {
    const o = four(), j = k + by;
    if (j < 0 || j >= o.length) return;
    [o[k], o[j]] = [o[j], o[k]];
    host.act({ type: 'setOrder', skills: o, ...(foe ? { foe } : {}) });
    S.free = null; S.pick = null; said('');
    paint(`slot:${j}`);
  };
  const setCond = (k: number, cond: AutoCond): void => {
    const id = four()[k];
    host.act({ type: 'setTactic', skill: id, cond, ...(foe ? { foe } : {}) });
    S.conds = null; said('');
    paint(`slot:${k}`);
  };

  // ---- the parts
  const paintMode = (): void => {
    const m = manual();
    modeBtn.innerHTML = `<span class="${m ? '' : 'on'}">${esc(tx('v2.mode.auto'))}</span><span class="${m ? 'on' : ''}">${esc(tx('v2.mode.manual'))}</span>`;
    modeBtn.setAttribute('aria-label', `${tx('ui.sk.mode')}: ${tx(m ? 'v2.mode.manual' : 'v2.mode.auto')}`);
    modeBtn.setAttribute('aria-pressed', String(m));
    placesLab.textContent = tx(m ? 'ui.sk.placesManual' : 'ui.sk.placesAuto');
  };
  const slotHtml = (id: string | null, k: number): string => {
    const m = manual(), n = m ? bindCap(`skill${k + 1}` as 'skill1') : String(k + 1);
    if (id === null) {
      const was = S.free === k ? four()[k] : '';
      return `<div class="sk-slot free"><button class="pm-btn sk-main" type="button" data-fk="slot:${k}" data-skill="${esc(was)}"><span class="n">${n}</span><b>${esc(tx('ui.sk.free'))}</b><small>${esc(tx('ui.sk.freeHint', { name: skillName(was) }))}</small></button></div>`;
    }
    const t = autoOrderView(host.state(), v2KitOf(host.state()).loadout as string[], foe).find((x) => x.id === id);
    const meta = `${cap(tx(FAMILY[famOf(id)]))} · ${rankName(id)} · ${tx('v2.skills.level', { level: lvOf(id) })} · ${tx('ui.order.uses', { n: t?.uses ?? 0, gap: num(t?.gapS ?? 0) })}`;
    const cond = m ? tx('ui.sk.byHand') : tx('ui.sk.cond', { cond: tx(COND_TEXT[condOf(host.state(), id, foe)]) });
    return `<div class="sk-slot${S.pick !== null ? ' armed' : ''}"><button class="pm-btn sk-main" type="button" data-fk="slot:${k}" data-skill="${esc(id)}" aria-label="${k + 1}. ${esc(skillName(id))} · ${esc(meta)} · ${esc(cond)}"><span class="n">${n}</span><b>${esc(skillName(id))}</b><small>${esc(meta)}</small></button>`
      + (m ? `<p class="cd">${esc(cond)}</p>` : `<button type="button" tabindex="-1" class="cd chip" data-cd="${k}" title="${esc(cond)}"><span class="pre">${esc(tx('ui.sk.cond', { cond: '\u0001' }).split('\u0001')[0])}</span>${esc(tx(COND_TEXT[condOf(host.state(), id, foe)]))}</button>`)
      + `<span class="sk-ctl"><button type="button" tabindex="-1" data-mv="${k}:-1" aria-label="${esc(tx('ui.order.earlier'))}"${k === 0 ? ' disabled' : ''}>‹</button><button type="button" tabindex="-1" data-mv="${k}:1" aria-label="${esc(tx('ui.order.later'))}"${k === 3 ? ' disabled' : ''}>›</button><button type="button" tabindex="-1" data-rm="${k}">${esc(tx('ui.sk.remove'))}</button></span></div>`;
  };
  const condsHtml = (k: number): string => {
    const id = four()[k], cur = condOf(host.state(), id, foe);
    return `<div class="sk-conds" role="group" aria-label="${esc(tx('ui.sk.condTitle', { name: skillName(id) }))}"><p class="pm-sub">${esc(tx('ui.sk.condTitle', { name: skillName(id) }))}</p>${autoCondsFor(id).map((c) => `<button class="pm-btn" type="button" data-fk="cond:${c}" data-cond="${c}" aria-pressed="${c === cur}"><i class="pm-check"></i><span>${esc(tx(COND_TEXT[c]))}</span></button>`).join('')}</div>`;
  };
  const paintPlaces = (): void => {
    const o = four();
    places.innerHTML = o.map((id, k) => slotHtml(S.free === k ? null : id, k)).join('') + (S.conds !== null && !manual() && S.free === null ? condsHtml(S.conds) : '');
  };
  const paintNote = (): void => {
    const pend = S.pick !== null ? tx('ui.sk.pick', { name: skillName(S.pick) }) : S.msg;
    // the line under the places: what was just done, else what the mode is (B-18: the switch was explained nowhere)
    const lines = [pend ? `<p class="sk-say" role="status">${esc(pend)}</p>` : `<p class="sk-say sk-modeline" role="status">${esc(tx(manual() ? 'ui.sk.modeManual' : 'ui.sk.modeAuto'))}</p>`];
    // a match sheet says whose plan it sets; every page says what is always the automatic's and the rank rule (CM-05, CM-07)
    if (!solo && !manual()) lines.push(`<p>${esc(planLine(host.state(), foe, host.foeName))}</p>`);
    lines.push(`<p class="sk-legend">${esc(tx('ui.sk.legend'))} ${esc(tx('ui.sk.alwaysLine', { list: [tx('ui.skill.light'), skillName('heavy'), tx('ui.sk.guard'), tx('ui.sk.dodge')].join(', ') }))}</p>`);
    note.innerHTML = lines.join('');
  };
  const paintBar = (): void => {
    const f = (k: Filter, label: string): string => `<button class="pm-btn sk-chipf" type="button" data-fk="filter:${k}" aria-pressed="${S.filter === k}">${esc(label)}</button>`;
    bar.innerHTML = `<span class="sk-lab">${esc(tx('ui.sk.owned', { n: owned.length }))}</span><span class="sk-filters">${f('all', tx('ui.sk.all'))}${f('offensive', cap(tx(FAMILY.offensive)))}${f('defensive', cap(tx(FAMILY.defensive)))}${f('support', cap(tx(FAMILY.support)))}</span>`;
  };
  const paintTiles = (): void => {
    const o = four();
    tiles.innerHTML = owned.filter((id) => S.filter === 'all' || famOf(id) === S.filter).map((id) => {
      const at = o.indexOf(id), why = at < 0 ? rankMsg(id, S.free !== null ? o.map((x, i) => (i === S.free ? '' : x)) : o) : '';
      const st = at >= 0 ? tx('ui.sk.inPlace', { n: at + 1 }) : why || tx('ui.sk.tileFree');
      return `<button class="pm-btn sk-tile${why ? ' warn' : ''}" type="button" data-fk="tile:${esc(id)}" data-skill="${esc(id)}" aria-pressed="${at >= 0}"><b>${esc(skillName(id))}</b><small><span class="fam">${esc(cap(tx(FAMILY[famOf(id)])))} · </span>${esc(`${rankName(id)} · ${tx('v2.skills.level', { level: lvOf(id) })}`)}</small><span class="st">${esc(st)}</span></button>`;
    }).join('');
  };
  const paintDetail = (): void => {
    const st = host.state(), id = S.sel || owned[0];
    if (!id) { detail.innerHTML = ''; return; }
    const lv = lvOf(id), vs = host.vs?.() ?? null, f = skillFigures(st, id, lv, vs), up = nextLevel(st, id), k = SKILL_BOOK[id];
    // whom the skills page reckons its figures against (GP-12: the next opponent, no longer the pool's Marek)
    const against = solo ? figuresAgainst(st) : null, vsLine = against ? tx('ui.skill.against', { name: RIVALS[against.foe]?.name ?? against.foe, day: against.day }) : '';
    // the next level: the practice sand's up to its cap, then Master Corvin's lesson (the operator's NC-11, journal Passe SK4)
    const next = !up ? tx('ui.skill.top') : up.by === 'lesson' ? tx('ui.skill.lesson', { level: up.level, price: up.price, day: up.day }) : tx('ui.skill.drill', { level: up.level });
    // a rival's signature says whom it was learnt from (SK-4), and a skill a fighter of the town teaches its teacher (NC-10: « Apprise de Lucan Rook »)
    const from = k?.signature ? RIVALS[k.signature]?.name ?? k.signature : k?.teacher ? PEOPLE[k.teacher]?.name ?? GENERICS[k.teacher]?.name ?? k.teacher : null;
    const sig = from ? tx('ui.skill.signature', { name: from }) : '';
    const when = placeOf(id) >= 0 ? `<p class="ab pm-when">${esc(manual() ? tx('ui.sk.handDetail') : whenText(st, id, foe))}</p>` : '';
    const role = roleName(id);
    detail.innerHTML = `<p class="nm">${esc(skillName(id))}</p><p class="what">${esc(cap(tx(FAMILY[k?.family ?? 'offensive'])))} · ${esc(rankName(id))}${role ? ` · ${esc(tx('ui.skill.role', { role }))}` : ''} · ${tx('v2.skills.level', { level: lv })}</p><p class="ab">${esc(doesWhat(f))}</p>${when}${cmpHtml(f, up ? skillFigures(st, id, up.level, vs) : null, up?.level ?? lv)}${vsLine ? `<p class="what">${esc(vsLine)}</p>` : ''}<p class="what">${esc(next)}</p>${sig ? `<p class="what">${esc(sig)}</p>` : ''}`;
    fit();
  };
  const slotOf = (fk: string): number => (/^slot:\d$/.test(fk) ? +fk.slice(5) : -1);
  const moveBtn = (dir: 'left' | 'right'): HTMLButtonElement => {
    const b = el('button', 'pm-btn', `${bindCap(dir, `data-pad-btn="${dir === 'left' ? 'LT' : 'RT'}"`)}<span>${esc(tx(dir === 'left' ? 'ui.order.earlier' : 'ui.order.later'))}</span>`);
    b.addEventListener('click', () => { const k = slotOf(focusKey()); if (k >= 0) move(k, dir === 'left' ? -1 : 1); });
    return b;
  };
  const paintFoot = (): void => {
    const fk = focusKey(), onSlot = /^slot:/.test(fk), onCond = /^cond:/.test(fk), onTile = fk.startsWith('tile:');
    // what Space does on the control that has the keyboard: switch the mode, take a place's skill out, place a skill (or take it out again), choose a condition, a family
    const verb = fk === 'mode' ? 'ui.sk.switch' : onSlot ? (S.free === slotOf(fk) ? 'ui.sk.keepHere' : 'ui.sk.remove') : onCond || fk.startsWith('filter:') ? 'ui.sk.choose' : onTile && placeOf(fk.slice(5)) >= 0 ? 'ui.sk.remove' : 'ui.sk.place';
    fillFoot(foot, footBtn('Space', tx(verb as TextKey), () => activate(focusKey())), onSlot && !manual() ? footBtn('C', tx('ui.skill.when'), () => openConds()) : null,
      onSlot ? moveBtn('left') : null, onSlot ? moveBtn('right') : null, go, close);
    if (go) go.disabled = S.free !== null;
  };
  /** every part drawn again, the control that had the keyboard keeping it (`keep`, else the one focused now) */
  function paint(keep?: string): void {
    const fk = keep ?? focusKey();
    paintMode(); paintPlaces(); paintNote(); paintBar(); paintTiles(); paintDetail(); paintFoot();
    if (fk) refocus(fk);
    paintFoot();
  }

  // ---- the gestures (CM-03)
  function activate(fk: string): void {
    if (fk === 'mode') { host.act({ type: 'setMode', mode: manual() ? 'auto' : 'manual' }); S.conds = null; paint('mode'); return; }
    if (fk.startsWith('filter:')) { S.filter = fk.slice(7) as Filter; paint(fk); return; }
    if (fk.startsWith('cond:')) { if (S.conds !== null) setCond(S.conds, fk.slice(5) as AutoCond); return; }
    if (fk.startsWith('slot:')) {
      const k = +fk.slice(5);
      if (S.pick !== null) { place(S.pick, k); paint(`slot:${k}`); return; }
      if (S.free === k) { S.free = null; said(''); paint(`slot:${k}`); return; }
      // a place taken out: free on the screen, its skill kept by the game until another comes (Esc keeps it)
      const was = four()[k];
      S.free = k; S.pick = null; S.conds = null; said(tx('ui.sk.freed', { n: k + 1, name: skillName(was) })); paint(`slot:${k}`);
      return;
    }
    if (fk.startsWith('tile:')) {
      const id = fk.slice(5), at = placeOf(id);
      S.sel = id;
      if (at >= 0) { S.free = at; S.pick = null; said(''); paint(`slot:${at}`); return; }
      if (S.free !== null) { const k = S.free; place(id, k); paint(`slot:${placeOf(id) >= 0 ? placeOf(id) : k}`); return; }
      S.pick = id; S.conds = null; said(''); paint('slot:0');
    }
  }
  function openConds(): void {
    const k = slotOf(focusKey());
    if (k < 0 || manual()) return;
    S.conds = k; S.pick = null; S.free = null; said(''); paint();
    card.querySelector<HTMLElement>('.sk-conds [aria-pressed=true]')?.focus();
  }
  card.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('button');
    if (!b) return;
    if (b.dataset.mv) { const [k, by] = b.dataset.mv.split(':').map(Number); move(k, by as -1 | 1); return; }
    if (b.dataset.rm) { activate(`slot:${b.dataset.rm}`); return; }
    if (b.dataset.cd) { refocus(`slot:${b.dataset.cd}`); openConds(); return; }
    const fk = b.dataset.fk; if (fk) activate(fk);
  });
  card.addEventListener('focusin', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-fk]');
    if (!b) return;
    card.querySelectorAll('.pm-btn.on').forEach((x) => x.classList.remove('on')); b.classList.add('on');
    if (b.dataset.skill) { S.sel = b.dataset.skill; paintDetail(); }
    paintFoot();
  });
  card.addEventListener('mouseover', (e) => { const b = (e.target as HTMLElement).closest<HTMLElement>('.pm-btn[data-fk]'); if (b && document.activeElement !== b) b.focus({ preventScroll: true }); });
  const ctrls = (): HTMLElement[] => (S.conds !== null && !manual() ? [...card.querySelectorAll<HTMLElement>('.sk-conds [data-fk]')] : [...card.querySelectorAll<HTMLElement>('[data-fk]')]);
  card.addEventListener('keydown', (e) => {
    const fk = focusKey(), a = actsOf(e, 'walk');
    // the four arrows go to the control nearest in their direction, as on the gear page (IA-06, src/ui/nav.ts: from a place to the tile under it in one press); a place is
    // moved earlier or later by its own keys, below
    if (ARROWS.includes(e.key)) {
      e.preventDefault(); e.stopPropagation();
      arrowFocus(card, e.key, { items: ctrls, rows: '.sk-tiles' });
      return;
    }
    // Space places or removes everywhere (the squares' own handler no longer takes it from a page), and on a sheet Enter enters the arena
    if (e.key === ' ') { e.preventDefault(); e.stopPropagation(); if (!e.repeat && fk) activate(fk); return; }
    if (e.key === 'Enter') {
      if (fk.startsWith('cond:')) { e.preventDefault(); e.stopPropagation(); if (!e.repeat) activate(fk); return; }
      if (go) { e.preventDefault(); e.stopPropagation(); if (!e.repeat && !go.disabled) go.click(); }
      else { e.preventDefault(); e.stopPropagation(); if (!e.repeat && fk) activate(fk); }
      return;
    }
    if (e.key === 'Escape') {
      // the innermost thing first: the list of conditions, a skill waiting for its place, a place emptied (its skill stays)
      if (S.conds !== null) { const k = S.conds; S.conds = null; e.preventDefault(); e.stopPropagation(); paint(`slot:${k}`); return; }
      if (S.pick !== null) { S.pick = null; said(''); e.preventDefault(); e.stopPropagation(); paint(); return; }
      if (S.free !== null) { const k = S.free; S.free = null; said(''); e.preventDefault(); e.stopPropagation(); paint(`slot:${k}`); }
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    const k = slotOf(fk);
    if (k >= 0 && S.free === null && !e.key.startsWith('Arrow') && (a.includes('left') || a.includes('right'))) { e.preventDefault(); e.stopPropagation(); move(k, a.includes('left') ? -1 : 1); return; }
    if (k >= 0 && (e.key === 'Delete' || e.key === 'Backspace')) { e.preventDefault(); e.stopPropagation(); activate(fk); return; }
    if (e.key.toLowerCase() === 'c' && k >= 0) { e.preventDefault(); e.stopPropagation(); openConds(); }
  });
  card.addEventListener('keyup', (e) => { if (e.key === ' ') e.preventDefault(); });

  S.sel = four().find(Boolean) ?? owned[0] ?? '';
  paint();
  return { root, focus: () => { refocus('slot:0'); } };
}
