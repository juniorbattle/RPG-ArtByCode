import { actions, type Action, type ActionOption, type GameState } from '../simulation';
import { offeredBy } from '../simulation/roles';
import { GEAR, type GearSlot } from '../simulation/gear';
import { duelStats, preview, STAT_IDS, type Preview, type StatId } from '../simulation/preview';
import { itemAbout, itemName, weaponTier } from '../simulation/v2gear';
import { isV2 } from '../simulation/v2';
import { PEOPLE, titleOf } from '../narrative/people';
import { skillName, tx, type TextKey } from '../narrative/text';
import { SKILL_BOOK, skillAction } from '../combat/skillbook';
import { chargeTime } from '../combat/skills';
import { heroFigure, portraitUrl } from './portraits';
import { arrowKeys, el, esc } from './style';

/** The gear and the shops, one page (the operator's choice UM7-3 « Lot à part : héros, détail, comparaison », journal Passe UM9; direction A « Voile »): on
 *  the left the hero in large from the baked sheet, the places on the body and the numbers of a bout; on the right the list, and for the line selected
 *  what it changes before and after and what stays in the purse (src/simulation/preview.ts: the game's own action on a copy). G opens it on the bag, a
 *  keeper's dialogue on their goods, the bag under them. A line the player cannot take stays selectable: what it would change is what makes one save for it. */

const CSS = `
.pm-overlay .pm-card.pm-wares{display:grid;grid-template-columns:minmax(0,520px) minmax(0,1fr);column-gap:72px;width:min(1280px,100%);height:min(880px,calc(100vh - 64px));max-height:none;overflow:hidden;padding:6px 0 0;--hs:4}
.pm-self{display:grid;grid-template-columns:auto minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);column-gap:24px;align-content:start;min-height:0}
.pm-fig{grid-row:1;position:relative}
.pm-hero{display:block;transform:scaleX(-1);width:calc(var(--fw)*var(--hs)*1px);height:calc(var(--fh)*var(--hs)*1px);background-repeat:no-repeat;background-size:calc(var(--fn)*100%) 100%;image-rendering:pixelated;animation:pm-hero var(--fd) steps(var(--fn),end) infinite}
@keyframes pm-hero{to{background-position-x:calc(var(--fw)*var(--fn)*var(--hs)*-1px)}}
.pm-fig .pm-h{margin:6px 0 0;text-align:center;padding-top:6px;border-top:1px solid var(--ds-line)}
.pm-worn{grid-row:1;min-width:0;align-self:start}
.pm-worn .row{padding:8px 0 10px;border-top:1px solid var(--ds-line);min-width:0}
.pm-worn .row:first-child{border-top:0;padding-top:0}
.pm-worn .row small{display:block;font-size:var(--ds-fs-small);color:var(--ds-muted)}
.pm-worn .row b{display:block;font:400 var(--ds-fs-label)/1.2 var(--ds-title)}
.pm-worn .row span{display:block;font-size:var(--ds-fs-small);line-height:1.25;color:var(--ds-muted)}
.pm-worn .row.empty b{color:var(--ds-muted)}
.pm-worn .row.hit small,.pm-worn .row.hit b{color:var(--ds-accent)}
.pm-stats{grid-column:1 / 3;grid-row:2;margin:18px 0 0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:32px;align-content:start}
.pm-stats .ttl{grid-column:1 / 3;margin:0 0 4px;font:400 var(--ds-fs-label)/1.2 var(--ds-title)}
.pm-stats div{display:flex;justify-content:space-between;gap:12px;padding:5px 0;border-top:1px solid var(--ds-line);font-size:var(--ds-fs-small)}
.pm-stats dt{color:var(--ds-muted)}
.pm-stats dd{margin:0;white-space:nowrap}
.pm-goods{display:grid;grid-template-rows:auto minmax(0,1fr) auto auto;min-height:0;min-width:0}
.pm-ghead{display:flex;align-items:center;gap:16px;padding-bottom:12px}
.pm-ghead img{display:block;width:64px;height:64px;image-rendering:pixelated}
.pm-ghead .pm-h{margin:0}
.pm-ghead .pm-h small{display:block;margin-top:4px;font:400 var(--ds-fs-small)/1.2 var(--ds-text);color:var(--ds-muted)}
.pm-purse{margin-left:auto;text-align:right;white-space:nowrap}
.pm-purse b{display:block;font:400 var(--ds-fs-fig)/1 var(--ds-title)}
.pm-purse small{font-size:var(--ds-fs-small);color:var(--ds-muted)}
.pm-glist{overflow:auto;min-height:0;border-bottom:1px solid var(--ds-line)}
.pm-glist .pm-sub{margin:12px 0 4px}
.pm-glist .pm-sub:first-child{margin-top:0}
.pm-glist .pm-btn{padding:7px 0}
.pm-where{margin:0;max-width:640px;font-size:var(--ds-fs-body);line-height:1.35}
.pm-btn[aria-disabled=true]{color:var(--ds-muted);cursor:default}
.pm-btn[aria-disabled=true]:hover,.pm-btn[aria-disabled=true]:focus{color:var(--ds-muted)}
.pm-btn[aria-disabled=true]:hover .cost,.pm-btn[aria-disabled=true]:focus .cost{color:var(--ds-muted)}
.pm-btn.on{box-shadow:inset 3px 0 0 var(--ds-accent);padding-left:12px}
.pm-detail{min-height:236px;padding:14px 0 0}
.pm-detail .nm{margin:0;font:400 var(--ds-fs-label)/1.2 var(--ds-title)}
.pm-detail .what{margin:2px 0 0;font-size:var(--ds-fs-small);color:var(--ds-muted)}
.pm-detail .ab{margin:6px 0 0;font-size:var(--ds-fs-body);line-height:1.3}
.pm-detail .no{margin:10px 0 0;font-size:var(--ds-fs-body);color:var(--ds-accent)}
.pm-detail .news{margin:0 0 8px;font-size:var(--ds-fs-body);color:var(--ds-accent)}
.pm-cmp{display:grid;grid-template-columns:minmax(0,1fr) 92px 92px 64px;margin:10px 0 0;font-size:var(--ds-fs-body)}
.pm-cmp>*{padding:3px 0;border-top:1px solid var(--ds-line);text-align:right;white-space:nowrap}
.pm-cmp .l{text-align:left;color:var(--ds-muted)}
.pm-cmp .h{border-top:0;padding-top:0;font-size:var(--ds-fs-small);color:var(--ds-muted)}
.pm-cmp .v{color:var(--ds-muted)}
.pm-cmp .a{color:var(--ds-ivory)}
.pm-cmp .a.up{color:var(--ds-accent)}
.pm-cmp .m{font-size:var(--ds-fs-small);line-height:1.5;color:var(--ds-muted)}
.pm-cmp .m.up{color:var(--ds-accent)}
.pm-gfoot{display:grid;grid-template-columns:minmax(0,1fr) auto;column-gap:32px;align-items:baseline;padding-top:8px}
.pm-gfoot .pm-btn{width:auto;white-space:nowrap}
.pm-gfoot .pm-btn::before{display:none}
.pm-wares.still .pm-btn::before{animation:none}
@media (max-height:900px){.pm-overlay .pm-card.pm-wares{--hs:3;column-gap:56px;grid-template-columns:minmax(0,440px) minmax(0,1fr)}.pm-detail{min-height:216px}}
@media (max-height:640px){.pm-overlay .pm-card.pm-wares{--hs:2}.pm-stats{margin-top:10px}.pm-worn .row{padding:5px 0 6px}.pm-worn .row span{display:none}.pm-detail{min-height:196px}.pm-ghead img{width:48px;height:48px}}
@media (max-width:1000px){.pm-overlay .pm-card.pm-wares{column-gap:32px;grid-template-columns:minmax(0,1fr) minmax(0,1.2fr)}.pm-self{grid-template-columns:minmax(0,1fr)}.pm-fig{display:none}.pm-stats{grid-column:1}.pm-stats div{font-size:var(--ds-fs-small)}.pm-cmp{grid-template-columns:minmax(0,1fr) 72px 72px 56px}}
@media (max-width:700px){
  .pm-overlay .pm-card.pm-wares{display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);height:calc(100vh - 26px);row-gap:10px}
  .pm-self{display:block}
  .pm-fig,.pm-stats{display:none}
  .pm-worn{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:14px}
  .pm-worn .row,.pm-worn .row:first-child{padding:4px 0;border-top:1px solid var(--ds-line)}
  .pm-worn .row span{display:none}
  .pm-glist .pm-btn .why{display:block}
  .pm-ghead{padding-bottom:6px}
  .pm-ghead img{width:48px;height:48px}
  .pm-detail{min-height:0;padding-top:8px}
  .pm-cmp{grid-template-columns:minmax(0,1fr) 64px 64px 48px}
  .pm-gfoot{grid-template-columns:minmax(0,1fr) auto}
}
@media (max-height:480px) and (min-width:701px){
  .pm-overlay .pm-card.pm-wares{display:block;height:calc(100vh - 26px)}
  .pm-self{display:none}
  .pm-goods{height:100%;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);grid-template-rows:auto minmax(0,1fr) auto;column-gap:24px}
  .pm-ghead{grid-column:1 / 3;padding-bottom:4px}
  .pm-ghead img{width:48px;height:48px}
  .pm-glist{grid-column:1;grid-row:2}
  .pm-detail{grid-column:2;grid-row:2;min-height:0;overflow:auto;padding-top:0}
  .pm-gfoot{grid-column:1 / 3;grid-row:3;padding-top:4px}
  .pm-cmp{grid-template-columns:minmax(0,1fr) 64px 64px 48px;margin-top:4px}
}
`;

/** what an action takes, one tag per currency (the operator's decision P2, journal Passes UI1 / UI2): its coins (from the simulation, not
 *  the label), its slot; « free » only when it takes neither */
export function costTag(o: Pick<ActionOption, 'cost' | 'coins'>): string {
  const tags = [o.coins ? tx(o.coins === 1 ? 'ui.coin' : 'ui.coinsN', { n: o.coins }) : '', o.cost ? tx('ui.oneSlot') : ''].filter(Boolean);
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
}

const STAT_TEXT: Record<StatId, TextKey> = { hp: 'ui.stat.hp', blow: 'ui.stat.blow', taken: 'ui.stat.taken', ap: 'ui.stat.ap', charge: 'ui.stat.charge', gauge: 'ui.stat.gauge', effect: 'ui.stat.effect' };
const SLOT_TEXT: Record<GearSlot, TextKey> = { weapon: 'v2.gear.weapon', armour: 'v2.gear.armour', accessory: 'v2.gear.acc', consumable: 'ui.wares.consumable' };

/** the actions the goods hold, the keeper's bargain with them */
const WARE_TYPES = ['buy', 'shopBuy', 'upgradeWeapon', 'temper', 'buySkill'];
/** the refusals that say there is nothing more to get */
const DONE: TextKey[] = ['v2.shop.owned', 'buy.haveBlade', 'buy.haveStone', 'v2.buySkill.owned', 'v2.upgrade.max', 'temper.haveBlade'];
export const isWare = (o: ActionOption): boolean => WARE_TYPES.includes(o.action.type);
export const isGoods = (o: ActionOption): boolean => isWare(o) || o.action.type === 'haggle';

/** « a mail shirt » as a line's name */
const bare = (name: string): string => { const n = name.replace(/^an? /, ''); return n[0].toUpperCase() + n.slice(1); };

function statValue(id: StatId, v: number): string {
  return id === 'charge' ? `${v.toFixed(2)} s` : id === 'taken' || id === 'gauge' || id === 'effect' ? `${Math.round(v)} %` : `${Math.round(v)}`;
}

function goodsLine(s: GameState, o: ActionOption): Line {
  const a = o.action, done = !o.ok && DONE.some((k) => tx(k) === o.reason), base = { key: JSON.stringify(a), action: a, ok: o.ok, reason: o.reason, done, tag: done ? `<span class="cost">${tx('ui.wares.owned')}</span>` : costTag(o) };
  if (a.type === 'shopBuy' || a.type === 'buy') {
    const d = GEAR[a.item];
    return { ...base, name: bare(itemName(a.item)), sub: tx(SLOT_TEXT[d.slot]), about: itemAbout(a.item), verb: tx('ui.wares.buy', { n: o.coins ?? 0 }), list: d.price, price: o.coins };
  }
  if (a.type === 'buySkill') {
    const k = SKILL_BOOK[a.skill], act = skillAction(a.skill);
    return { ...base, plain: true, name: skillName(a.skill), sub: bare(tx(k.family === 'offensive' ? 'v2.family.offensive' : k.family === 'defensive' ? 'v2.family.defensive' : 'v2.family.support')), verb: tx('ui.wares.learn', { n: o.coins ?? 0 }),
      about: tx('ui.wares.skill', { ap: tx('v2.skills.ap', { ap: act.apCost ?? 0 }), charge: chargeTime(a.skill, 1) }) };
  }
  if (a.type === 'haggle') return { ...base, plain: true, name: tx('ui.wares.haggle'), sub: '', about: bare(o.label.match(/\((.*)\)/)?.[1] ?? o.label), verb: tx('ui.wares.haggle') };
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

function statsHtml(s: GameState): string {
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
  act(a: Action): { ok: boolean; reload?: boolean; events?: Array<{ visible: boolean; text: string }> };
  close(): void;
}

/** the page: `who` a keeper, their goods above the bag; null the bag alone */
export function waresPage(who: string | null, host: WaresHost): { root: HTMLElement; focus(): void } {
  if (!document.getElementById('pm-wares-css')) { const st = el('style'); st.id = 'pm-wares-css'; st.textContent = CSS; document.head.appendChild(st); }
  const root = el('div', 'pm pm-overlay'), card = el('div', 'pm-card pm-wares');
  const p = who ? PEOPLE[who] : null, title = p ? p.name : tx('v2.gear.title');
  card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', title);
  root.appendChild(card);
  // a held Enter from the dialogue must not buy the first line
  card.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.repeat) e.preventDefault(); });
  let keyNow = '', news: string[] = [];

  const draw = (): void => {
    const s = host.state(), all = who ? actions(s).filter((o) => offeredBy(o.action as never) === who && isGoods(o)) : [];
    const wares = all.filter((o) => o.action.type !== 'buySkill' && o.action.type !== 'haggle').map((o) => goodsLine(s, o)), taught = all.filter((o) => o.action.type === 'buySkill').map((o) => goodsLine(s, o));
    const bargain = all.filter((o) => o.action.type === 'haggle').map((o) => goodsLine(s, o)), bag = bagLines(s), lines = [...wares, ...taught, ...bargain, ...bag];
    const f = heroFigure(), url = who ? portraitUrl(who) : null;
    card.innerHTML = `<section class="pm-self">${f ? `<div class="pm-fig"><i class="pm-hero" style="--fw:${f.w};--fh:${f.h};--fn:${f.frames};--fd:${f.ms * f.frames}ms;background-image:url(${f.url})"></i><h2 class="pm-h">${esc(s.player.name)}</h2></div>` : ''}<div class="pm-worn">${wornHtml(s)}</div><dl class="pm-stats">${statsHtml(s)}</dl></section>`
      + `<section class="pm-goods"><header class="pm-ghead">${url ? `<img src="${url}" alt="">` : ''}<h2 class="pm-h">${esc(title)}${p ? `<small>${esc(titleOf(p, isV2(s)))}</small>` : ''}</h2><div class="pm-purse"><b>${s.player.coins}</b><small>${tx('ui.coins')}</small></div></header><div class="pm-glist"></div><div class="pm-detail" aria-live="polite"></div><div class="pm-gfoot"></div></section>`;
    const list = card.querySelector('.pm-glist') as HTMLElement, detail = card.querySelector('.pm-detail') as HTMLElement, foot = card.querySelector('.pm-gfoot') as HTMLElement;
    const close = el('button', 'pm-btn', `<kbd>Esc</kbd>${tx(who ? 'ui.leave' : 'ui.close')}`);
    close.addEventListener('click', () => host.close());
    const doIt = (l: Line): void => {
      if (!l.ok) return;
      const r = host.act(l.action);
      if (!r.ok || r.reload) return;
      news = (r.events ?? []).filter((e) => e.visible).map((e) => e.text); keyNow = l.key;
      card.classList.add('still'); draw();
    };
    const select = (l: Line, b: HTMLElement): void => {
      list.querySelectorAll('.pm-btn.on').forEach((x) => x.classList.remove('on')); b.classList.add('on');
      if (keyNow && l.key !== keyNow && lines.some((x) => x.key === keyNow)) news = [];
      keyNow = l.key;
      const v = l.done ? null : l.plain ? { ...preview(s, l.action), rows: [] } : preview(s, l.action);
      card.querySelectorAll('.pm-worn .row.hit').forEach((x) => x.classList.remove('hit'));
      if (v && v.slot !== null) card.querySelector(`.pm-worn [data-slot="${v.slot}"]`)?.classList.add('hit');
      const what = [...new Set([l.sub, v?.replaces ? tx('ui.wares.instead', { item: itemName(v.replaces) }) : '', v?.toBag ? tx('ui.wares.toBag') : ''])].filter(Boolean).join(' · ');
      const same = !!v && !l.plain && !v.rows.length && v.slot === null && !v.toBag && l.ok;
      const notes = [v?.tierLost ? tx('ui.wares.tierLost', { tier: v.tierLost }) : '', !l.done && l.list && l.price !== l.list ? tx('ui.wares.list', { n: l.list }) : '', same ? tx('ui.wares.same') : ''].filter(Boolean).join(' ');
      detail.innerHTML = `${news.map((n) => `<p class="news">${esc(n)}</p>`).join('')}<p class="nm">${esc(l.name)}</p>${what ? `<p class="what">${esc(what)}</p>` : ''}<p class="ab">${esc(l.about)}</p>${notes ? `<p class="what">${esc(notes)}</p>` : ''}${cmpHtml(l, v)}${l.ok ? '' : `<p class="no">${esc(l.reason ?? '')}</p>`}`;
      foot.replaceChildren(...(l.ok ? [Object.assign(el('button', 'pm-btn primary', `<kbd>Enter</kbd><span>${esc(l.verb)}</span>`), { onclick: () => doIt(l) })] : [el('span')]), close);
    };
    const add = (l: Line): void => {
      const b = el('button', 'pm-btn', `<span>${esc(l.name)}${l.sub ? `<span class="why">${esc(l.sub)}</span>` : ''}</span>${l.tag}`);
      b.setAttribute('aria-disabled', String(!l.ok));
      b.addEventListener('focus', () => select(l, b));
      b.addEventListener('mouseenter', () => b.focus({ preventScroll: true }));
      b.addEventListener('click', () => doIt(l));
      list.appendChild(b);
    };
    const head = (t: string): void => { list.appendChild(el('p', 'pm-sub', esc(t))); };
    wares.forEach(add);
    if (taught.length) { head(tx('ui.wares.teach')); taught.forEach(add); }
    if (bargain.length) { head(tx('ui.wares.talk', { name: p!.name })); bargain.forEach(add); }
    if (bag.length) { head(tx('v2.gear.bag')); bag.forEach(add); }
    arrowKeys(list);
    if (!lines.length) {
      list.append(el('p', 'pm-sub', tx('v2.gear.empty')), el('p', 'pm-where', tx('v2.gear.where')));
      foot.replaceChildren(el('span'), close);
    }
    // what was just taken may leave the list: the selection stays where it was, its news with it
    focus = () => { (list.querySelectorAll<HTMLElement>('.pm-btn')[Math.max(0, keyNow ? lines.findIndex((l) => l.key === keyNow) : lines.findIndex((l) => l.ok))] ?? close).focus(); };
    if (card.isConnected) focus();
  };
  let focus = (): void => {};
  draw();
  return { root, focus: () => focus() };
}
