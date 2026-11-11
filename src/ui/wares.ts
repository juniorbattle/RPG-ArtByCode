import { actions, type Action, type ActionOption, type GameState } from '../simulation';
import { offeredBy } from '../simulation/roles';
import { GEAR, type GearSlot } from '../simulation/gear';
import { duelStats, preview, STAT_IDS, type Preview, type StatId } from '../simulation/preview';
import { itemAbout, itemName, weaponTier } from '../simulation/v2gear';
import { PASSERS } from '../simulation/v2barter';
import { isV2 } from '../simulation/v2';
import { PEOPLE, titleOf } from '../narrative/people';
import { num, said, skillName, tx, type TextKey, type TextRef } from '../narrative/text';
import { SKILL_BOOK, skillAction } from '../combat/skillbook';
import { chargeTime } from '../combat/skills';
import { heroFigure, portraitUrl } from './portraits';
import { arrowKeys, el, esc, fillFoot, footBtn, pickRow, scrollFade } from './style';

/** The gear and the shops, one page (the operator's choice UM7-3 « Lot à part : héros, détail, comparaison », journal Passe UM9; direction A « Voile »): on
 *  the left the hero in large from the baked sheet, the places on the body and the numbers of a bout; on the right the list, and for the line selected
 *  what it changes before and after and what stays in the purse (src/simulation/preview.ts: the game's own action on a copy). G opens it on the bag, a
 *  keeper's dialogue on their goods, the bag under them. A line the player cannot take stays selectable: what it would change is what makes one save for it. */

/** what an action takes, one tag per currency (the operator's decision P2, journal Passes UI1 / UI2): its coins (from the simulation, not
 *  the label), its slot; « free » only when it takes neither */
export function costTag(o: Pick<ActionOption, 'cost' | 'coins' | 'later' | 'gain'>): string {
  // a slot booked now and spent later (a challenge's) is a slot spent: « free » never (journal Passe EVL1)
  // what it pays, first (a version 2 game's jobs and resale: the operator's ECO-7, journal Passe ECO2)
  const tags = [o.gain ? tx('ui.gainN', { n: o.gain }) : '', o.coins ? tx(o.coins === 1 ? 'ui.coin' : 'ui.coinsN', { n: o.coins }) : '', o.cost || o.later ? tx('ui.oneSlot') : ''].filter(Boolean);
  if (o.gain) return tags.map((t, i) => `<span class="cost${i === 0 ? ' gain' : ''}">${t}</span>`).join('');
  return tags.length ? tags.map((t) => `<span class="cost">${t}</span>`).join('') : `<span class="cost free">${tx('ui.free')}</span>`;
}

/** the option's words without its price: the cost tag says it (the fiche of journal Passe UM1: « 20 coins » written twice); the label stays the
 *  simulation's, the same in the journal */
export function shortLabel(o: Pick<ActionOption, 'label' | 'coins'>): string {
  return o.coins ? o.label.replace(new RegExp(` \\(${o.coins} coins?(?:: ([^)]*))?\\)`), (_, about?: string) => (about ? ` · ${about}` : '')) : o.label;
}

/** a line of the list */
interface Line {
  key: string; action: Action; name: string; sub: string; tag: string; ok: boolean; reason?: string; about: string; verb: string;
  /** a skill or a word with the keeper: no number of the sheet to compare */
  plain?: boolean;
  /** owned, or as fine as it gets: there is no « after » to read */
  done?: boolean;
  /** the list price, and today's */
  list?: number; price?: number;
  /** a version 2 piece's bargains (lot L2a, EV-6): the arguments one can put to its seller, each its chance */
  args?: Line[];
}

const STAT_TEXT: Record<StatId, TextKey> = { hp: 'ui.stat.hp', atk: 'stat.atk', def: 'stat.def', end: 'stat.end', viv: 'stat.viv', blow: 'ui.stat.blow', taken: 'ui.stat.taken', ap: 'ui.stat.ap', charge: 'ui.stat.charge', gauge: 'ui.stat.gauge', effect: 'ui.stat.effect' };
const SLOT_TEXT: Record<GearSlot, TextKey> = { weapon: 'v2.gear.weapon', armour: 'v2.gear.armour', accessory: 'v2.gear.acc', consumable: 'ui.wares.consumable' };

/** the actions the goods hold; a version 2 bargain (lot L2a) is put to a piece of them */
const WARE_TYPES = ['buy', 'shopBuy', 'upgradeWeapon', 'temper', 'buySkill', 'barter'];
const isArg = (o: ActionOption): boolean => o.action.type === 'bargain' || (o.action.type === 'barter' && !!o.action.arg);
/** the refusals that say there is nothing more to get */
const DONE: TextKey[] = ['v2.shop.owned', 'buy.haveBlade', 'buy.haveStone', 'v2.buySkill.owned', 'v2.upgrade.max', 'temper.haveBlade'];
export const isWare = (o: ActionOption): boolean => WARE_TYPES.includes(o.action.type) && !isArg(o);
export const isGoods = (o: ActionOption): boolean => isWare(o) || isArg(o);

/** « a mail shirt » as a line's name */
// a name without its article, capitalised (« a whetstone » → « Whetstone », « une pierre à aiguiser » → « Pierre à aiguiser »)
const bare = (name: string): string => { const n = name.replace(/^(?:an? |une? |des |les? |la |l’)/, ''); return n[0].toUpperCase() + n.slice(1); };

export function statValue(id: StatId, v: number): string {
  // a version 2 game's stats (DB7-7): a whole number, or one decimal (the gear's half points)
  if (id === 'atk' || id === 'def' || id === 'end' || id === 'viv') return Math.abs(v - Math.round(v)) < 0.05 ? `${Math.round(v)}` : num(v, 1);
  return id === 'charge' ? `${num(v, 2)} s` : id === 'taken' || id === 'gauge' || id === 'effect' ? `${Math.round(v)} %` : `${Math.round(v)}`;
}

function goodsLine(s: GameState, o: ActionOption): Line {
  // a passer-by's piece once it has gone (lot L2a): nothing more to get from them
  const a = o.action, done = (!o.ok && DONE.some((k) => tx(k) === o.reason)) || (a.type === 'barter' && s.v2?.passed?.[a.who] !== undefined), base = { key: JSON.stringify(a), action: a, ok: o.ok, reason: o.reason, done, tag: done ? `<span class="cost">${tx('ui.wares.owned')}</span>` : costTag(o) };
  if (a.type === 'shopBuy' || a.type === 'buy') {
    const d = GEAR[a.item];
    return { ...base, name: bare(itemName(a.item)), sub: tx(SLOT_TEXT[d.slot]), about: itemAbout(a.item), verb: tx('ui.wares.buy', { n: o.coins ?? 0 }), list: d.price, price: o.coins };
  }
  if (a.type === 'buySkill') {
    const k = SKILL_BOOK[a.skill], act = skillAction(a.skill);
    return { ...base, plain: true, name: skillName(a.skill), sub: bare(tx(k.family === 'offensive' ? 'v2.family.offensive' : k.family === 'defensive' ? 'v2.family.defensive' : 'v2.family.support')), verb: tx('ui.wares.learn', { n: o.coins ?? 0 }),
      about: tx('ui.wares.skill', { ap: tx('v2.skills.ap', { ap: act.apCost ?? 0 }), charge: chargeTime(a.skill, 1) }) };
  }
  // a passer-by's piece (lot L2a): bought at their price
  if (a.type === 'barter' && !a.arg) {
    const item = PASSERS[a.who].item, d = GEAR[item];
    return { ...base, name: bare(itemName(item)), sub: tx(SLOT_TEXT[d.slot]), about: itemAbout(item), verb: tx('ui.wares.buy', { n: o.coins ?? 0 }), list: d.price, price: o.coins };
  }
  // an argument (lot L2a): its words and chance, what it costs if it works
  if (a.type === 'bargain' || a.type === 'barter') return { ...base, plain: true, name: o.label.replace(/ \(\d+ %\)$/, ''), sub: o.label.match(/\((\d+ %)\)$/)?.[1] ?? '', about: '', verb: tx('ui.wares.argue'), price: o.coins };
  // the forge's work: the sentence is the simulation's, its price in the tag
  const [said, about = ''] = shortLabel(o).split(' · ');
  return { ...base, name: a.type === 'upgradeWeapon' && s.v2?.gear ? tx('ui.wares.raise', { item: bare(itemName(s.v2.gear.weapon)), tier: weaponTier(s) + 1 }) : said, sub: tx('ui.wares.forge'), about, verb: tx('ui.wares.order', { n: o.coins ?? 0 }) };
}

/** what is in the bag, a line per place it can take: with both accessories on, the player chooses which one it replaces */
function bagLines(s: GameState): Line[] {
  const g = s.v2?.gear;
  if (!g) return [];
  return g.bag.flatMap((id) => {
    const acc = GEAR[id]?.slot === 'accessory' && g.acc[0] && g.acc[1], places: Array<0 | 1 | undefined> = acc ? [0, 1] : [undefined];
    return places.map((slot) => {
      const action = { type: 'equip' as const, item: id, ...(slot === undefined ? {} : { slot }) };
      return { key: JSON.stringify(action), action, name: bare(itemName(id)), sub: slot === undefined ? tx(SLOT_TEXT[GEAR[id].slot]) : tx('ui.wares.instead', { item: itemName(g.acc[slot]!) }), tag: '', ok: true, about: itemAbout(id), verb: tx('ui.wares.wear') };
    });
  });
}

function wornHtml(s: GameState): string {
  const g = s.v2?.gear;
  if (!g) {
    const held = s.player.items.map((i) => bare(itemName(i))).join(', ');
    return `<div class="row${held ? '' : ' empty'}"><small>${tx('ui.wares.carry')}</small><b>${esc(held || tx('ui.wares.nothing'))}</b></div>`;
  }
  const row = (slot: string, label: string, id: string | null, more = '') => `<div class="row${id ? '' : ' empty'}" data-slot="${slot}"><small>${label}</small><b>${id ? esc(bare(itemName(id))) : '—'}</b>${id ? `<span>${esc(more || itemAbout(id))}</span>` : ''}</div>`;
  const tier = weaponTier(s), stone = s.player.items.includes('whetstone');
  return row('weapon', tx('v2.gear.weapon'), g.weapon, tier ? tx('v2.gear.tier', { tier }) : '') + row('armour', tx('v2.gear.armour'), g.armour) + row('0', tx('v2.gear.acc'), g.acc[0]) + row('1', tx('v2.gear.acc'), g.acc[1])
    + (stone ? row('stone', tx('v2.gear.next'), 'whetstone') : '');
}

/** the hero in large, from the baked sheet, and his name */
export function figHtml(s: GameState): string {
  const f = heroFigure();
  return f ? `<div class="pm-fig"><i class="pm-hero" style="--fw:${f.w};--fh:${f.h};--fn:${f.frames};--fd:${f.ms * f.frames}ms;background-image:url(${f.url})"></i><h2 class="pm-h">${esc(s.player.name)}</h2></div>` : '';
}

export function statsHtml(s: GameState): string {
  const st = duelStats(s);
  return `<p class="ttl">${tx('ui.stat.title')}</p>${STAT_IDS.filter((id) => st[id] !== undefined).map((id) => `<div><dt>${tx(STAT_TEXT[id])}</dt><dd>${statValue(id, st[id]!)}</dd></div>`).join('')}`;
}

function cmpHtml(l: Line, p: Preview | null): string {
  const purse = l.action.type !== 'equip' && p && p.coins[0] !== p.coins[1];
  if (!p || (!p.rows.length && !purse)) return '';
  const rows = p.rows.map((r) => `<span class="l">${tx(STAT_TEXT[r.id])}</span><span class="v">${statValue(r.id, r.now)}</span><span class="a${r.better ? ' up' : ''}">${statValue(r.id, r.after)}</span><span class="m${r.better ? ' up' : ''}">${tx(r.better ? 'ui.wares.better' : 'ui.wares.worse')}</span>`);
  if (purse) rows.push(`<span class="l">${tx('ui.wares.purse')}</span><span class="v">${p.coins[0]}</span><span class="a">${p.coins[1] < 0 ? tx('ui.wares.short', { n: -p.coins[1] }) : p.coins[1]}</span><span class="m"></span>`);
  return `<div class="pm-cmp"><span class="h"></span><span class="h">${tx('ui.wares.now')}</span><span class="h">${tx('ui.wares.after')}</span><span class="h"></span>${rows.join('')}</div>`;
}

export interface WaresHost {
  state(): GameState;
  /** applies an action; false: the page is left (a new slot reloads it) */
  act(a: Action): { ok: boolean; reload?: boolean; events?: Array<{ visible: boolean; text: string; $t?: TextRef }> };
  close(): void;
  /** a piece out of reach for want of coins was pressed (the tutorial's hint, journal Passe ECO2) */
  poor?(): void;
}

/** the page: `who` a keeper, their goods above the bag; null the bag alone */
export function waresPage(who: string | null, host: WaresHost): { root: HTMLElement; focus(): void } {
  const root = el('div', 'pm pm-overlay'), card = el('div', 'pm-card pm-two pm-wares');
  const p = who ? PEOPLE[who] : null, title = p ? p.name : tx('v2.gear.title');
  card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', title);
  root.appendChild(card);
  // a held Enter from the dialogue must not buy the first line
  card.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.repeat) e.preventDefault(); });
  let keyNow = '', news: string[] = [];

  const draw = (): void => {
    const s = host.state(), all = who ? actions(s).filter((o) => offeredBy(o.action as never) === who && isGoods(o)) : [];
    // a piece's arguments go with it (lot L2a): the shop's piece by its item, the passer-by's own
    const argsOf = (a: Action): Line[] => all.filter((o) => isArg(o) && (a.type === 'shopBuy' ? o.action.type === 'bargain' && o.action.item === a.item : a.type === 'barter' && o.action.type === 'barter' && o.action.who === a.who)).map((o) => goodsLine(s, o));
    const wares = all.filter((o) => isWare(o) && o.action.type !== 'buySkill').map((o) => { const l = goodsLine(s, o), args = argsOf(o.action); return args.length ? { ...l, args } : l; }), taught = all.filter((o) => o.action.type === 'buySkill').map((o) => goodsLine(s, o));
    // the piece's arguments are drawn again from the state: a bargain refused since shows its reason
    if (mode) mode = wares.find((l) => l.key === mode!.key) ?? null;
    const bag = bagLines(s), lines = mode ? mode.args! : [...wares, ...taught, ...bag];
    const url = who ? portraitUrl(who) : null;
    card.innerHTML = `<section class="pm-self">${figHtml(s)}<div class="pm-worn">${wornHtml(s)}</div><dl class="pm-stats">${statsHtml(s)}</dl></section>`
      + `<section class="pm-goods"><header class="pm-ghead">${url ? `<img src="${url}" alt="">` : ''}<h2 class="pm-h">${esc(title)}${p ? `<small>${esc(titleOf(p, isV2(s)))}</small>` : ''}</h2><div class="pm-purse"><b>${s.player.coins}</b><small>${tx('ui.coins')}</small></div></header><div class="pm-glist"></div><div class="pm-detail" aria-live="polite"></div><div class="pm-foot"></div></section>`;
    const list = card.querySelector('.pm-glist') as HTMLElement, detail = card.querySelector('.pm-detail') as HTMLElement, foot = card.querySelector('.pm-foot') as HTMLElement;
    const close = footBtn('Esc', tx(who ? 'ui.leave' : 'ui.close'), () => host.close()), fit = scrollFade(detail);
    const doIt = (l: Line): void => {
      if (!l.ok) { if ((l.price ?? 0) > host.state().player.coins) host.poor?.(); return; }
      const r = host.act(l.action);
      if (!r.ok || r.reload) return;
      // an argument put: back to the goods, on the piece it was for
      news = (r.events ?? []).filter((e) => e.visible).map((e) => said(e.text, e.$t)); keyNow = mode ? mode.key : l.key; mode = null;
      card.classList.add('still'); draw();
    };
    // the bargain (lot L2a): the piece's arguments in the list, Esc back to the goods
    const haggle = (l: Line): void => { mode = l; keyNow = ''; news = []; draw(); };
    const back = footBtn('Esc', tx('ui.wares.back'), () => { const k = mode!.key; mode = null; keyNow = k; draw(); });
    const select = (l: Line): void => {
      if (keyNow && l.key !== keyNow && lines.some((x) => x.key === keyNow)) news = [];
      keyNow = l.key;
      const v = l.done ? null : l.plain ? { ...preview(s, l.action), rows: [] } : preview(s, l.action);
      card.querySelectorAll('.pm-worn .row.hit').forEach((x) => x.classList.remove('hit'));
      if (v && v.slot !== null) card.querySelector(`.pm-worn [data-slot="${v.slot}"]`)?.classList.add('hit');
      const what = [...new Set([l.sub, v?.replaces ? tx('ui.wares.instead', { item: itemName(v.replaces) }) : '', v?.toBag ? tx('ui.wares.toBag') : ''])].filter(Boolean).join(' · ');
      const same = !!v && !l.plain && !v.rows.length && v.slot === null && !v.toBag && l.ok;
      const notes = [v?.tierLost ? tx('ui.wares.tierLost', { tier: v.tierLost }) : '', !l.done && l.list && l.price !== l.list ? tx('ui.wares.list', { n: l.list }) : '', same ? tx('ui.wares.same') : ''].filter(Boolean).join(' ');
      if (mode) {
        // an argument: its chance, what it costs if it works against the piece's price, and what failing costs
        detail.innerHTML = `<p class="nm">${esc(l.name)}</p><p class="what">${esc(tx('ui.wares.chance', { pct: l.sub }))}</p><p class="ab">${esc(tx('ui.wares.ifWon', { n: l.price ?? 0, list: mode.price ?? 0 }))}</p><p class="what">${esc(tx('ui.wares.ifLost'))}</p>${l.ok ? '' : `<p class="no">${esc(l.reason ?? '')}</p>`}`;
        fillFoot(foot, l.ok ? footBtn('Enter', l.verb, () => doIt(l), true) : null, back);
        fit();
        return;
      }
      const argNo = l.args && !l.args.some((x) => x.ok) ? l.args.find((x) => x.reason)?.reason : undefined;
      detail.innerHTML = `${news.map((n) => `<p class="news">${esc(n)}</p>`).join('')}<p class="nm">${esc(l.name)}</p>${what ? `<p class="what">${esc(what)}</p>` : ''}<p class="ab">${esc(l.about)}</p>${notes ? `<p class="what">${esc(notes)}</p>` : ''}${cmpHtml(l, v)}${l.ok ? '' : `<p class="no">${esc(l.reason ?? '')}</p>`}${l.ok && argNo && argNo !== l.reason ? `<p class="what">${esc(argNo)}</p>` : ''}`;
      fillFoot(foot, l.ok ? footBtn('Enter', l.verb, () => doIt(l), true) : null, l.ok && l.args?.some((x) => x.ok) ? footBtn('Space', tx('ui.wares.haggle'), () => haggle(l)) : null, close);
      fit();
    };
    const add = (l: Line): void => { list.appendChild(pickRow(`<span>${esc(l.name)}${l.sub ? `<span class="why">${esc(l.sub)}</span>` : ''}</span>${l.tag}`, { off: !l.ok, select: () => select(l), press: () => doIt(l) })); };
    const head = (t: string): void => { list.appendChild(el('p', 'pm-sub', esc(t))); };
    if (mode) { head(tx('ui.wares.bargainFor', { item: mode.name })); mode.args!.forEach(add); }
    else {
      wares.forEach(add);
      if (taught.length) { head(tx('ui.wares.teach')); taught.forEach(add); }
      if (bag.length) { head(tx('v2.gear.bag')); bag.forEach(add); }
    }
    arrowKeys(list); scrollFade(list);
    if (!lines.length) {
      list.append(el('p', 'pm-sub', tx('v2.gear.empty')), el('p', 'pm-where', tx('v2.gear.where')));
      fillFoot(foot, close);
    }
    // what was just taken may leave the list: the selection stays where it was, its news with it
    focus = () => { (list.querySelectorAll<HTMLElement>('.pm-btn')[Math.max(0, keyNow ? lines.findIndex((l) => l.key === keyNow) : lines.findIndex((l) => l.ok))] ?? close).focus(); };
    if (card.isConnected) focus();
  };
  let focus = (): void => {};
  let mode: Line | null = null;
  // Space puts an argument (the foot's cap; a pad's X): never the row's own press, which buys
  card.addEventListener('keydown', (e) => { if (e.key !== ' ') return; e.preventDefault(); if (e.repeat) return; [...card.querySelectorAll<HTMLButtonElement>('.pm-foot .pm-btn')].find((b) => (b.querySelector('kbd')?.dataset.key ?? b.querySelector('kbd')?.textContent) === 'Space')?.click(); });
  card.addEventListener('keyup', (e) => { if (e.key === ' ') e.preventDefault(); });
  draw();
  return { root, focus: () => focus() };
}
