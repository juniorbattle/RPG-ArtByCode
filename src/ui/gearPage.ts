import { actions, type Action, type GameState } from '../simulation';
import { offeredBy } from '../simulation/roles';
import { preview, type Preview } from '../simulation/preview';
import { itemName, weaponTier, wornAt, type WornPlace } from '../simulation/v2gear';
import { PASSERS } from '../simulation/v2barter';
import { PEOPLE, titleOf } from '../narrative/people';
import { said, tx, type TextKey } from '../narrative/text';
import { portraitUrl } from './portraits';
import { HAND, KIND_TEXT, PLACES, bagOf, hitPlacesFor, kindOfId, kindOfPlace, ownedOf as owned, pieceOfLine, placeId, placeViews, sellersOf, sellListOf, statusOf, subOf, wearAction, type Kind, type Own, type PlaceView } from './gearModel';
import { bare, cmpHtml, figHtml, goodsLine, insteadOf, isArg, isGoods, isWare, pieceAbout, sellOf, statsHtml, type Line, type WaresHost } from './wares';
import { closeLabel, el, esc, fillFoot, footBtn, scrollFade } from './style';
import { arrowFocus } from './nav';

/** The gear and the keepers' goods, made again for the operator's request of 16/11/2026 (« il faudra faire pareil pour les equipements afin d'avoir un aspect intuitif et
 *  manipulable pour gerer nos armes/armure/accessoires », journal Passes EP1 to EP3; the sheet https://claude.ai/artifact/Q2F5qVfX6u6vL2Sp1aKQa1, PE-1 to PE-10 read back ten of
 *  ten at the recommendation) in the look of the skills page (src/ui/skills.ts):
 *  PE-2 « A » the hero and his four places on the left (a weapon, an armour, two accessories, in the same drawing as the skills' four places), a catalogue of tiles on the
 *  right, the detail and the foot below it; PE-3 each place says its kind, its piece, its points, with « Remove » and, where Mara buys it, « Sell »; PE-4 a free place is
 *  dashed and says what can go there and what the bag holds for it, or who sells it; PE-5 one catalogue of everything owned, a piece worn marked, a click wears or removes;
 *  PE-6 Space and Enter wear or remove (in a shop Space stays « Haggle » on an article), a sale has its button, C (the pad's Y) and a confirmation, and the operator's note
 *  « Je veux un panel Achat/Vente lors que nous sommes dans le shop Mara »: Mara's goods have two panels, Buy and Sell; PE-7 the section « Worn » is gone (the places are the
 *  worn pieces); PE-8 a keeper's goods in tiles above what is owned, a click or Enter buys; PE-9 the short phone keeps the four places on top, the list on the left, the
 *  detail on the right and the foot below. The rules stay the game's own (`equip`, `unequip`, `sell`, `shopBuy`, the bargain; src/simulation/preview.ts gives the before and
 *  after on a copy of the state): the page holds none of its own. Today's game (`v2=0`) keeps the former page (src/ui/wares.ts). */

type Filter = 'all' | Kind;
type Panel = 'buy' | 'sell';
const KIND_PLURAL: Record<Kind, TextKey> = { weapon: 'ui.gear.weapons', armour: 'ui.gear.armours', accessory: 'ui.gear.accessories' };
const FITS: Record<Kind, TextKey> = { weapon: 'ui.gear.fits.weapon', armour: 'ui.gear.fits.armour', accessory: 'ui.gear.fits.accessory' };
export function gearPage(who: string | null, host: WaresHost): { root: HTMLElement; focus(): void } {
  const s0 = host.state();
  const root = el('div', 'pm pm-overlay'), card = el('div', 'pm-card pm-two pm-wares pm-gear');
  const p = who ? PEOPLE[who] : null, title = p ? p.name : tx('v2.gear.title'), resale = who !== null && offeredBy({ type: 'sell', item: HAND } as never) === who;
  card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', title);
  card.innerHTML = `<section class="pm-self">${figHtml(s0)}<div class="gp-casebox"><p class="sk-lab gp-lab">${esc(tx('ui.gear.places'))}</p><div class="gp-cases" role="group" aria-label="${esc(tx('ui.gear.places'))}"></div></div><dl class="pm-stats"></dl></section>`
    + `<section class="pm-goods"><header class="pm-ghead"></header><div class="sk-bar"></div><div class="pm-glist sk-tiles gp-tiles"></div><div class="pm-detail" aria-live="polite"></div><div class="pm-foot"></div></section>`;
  root.appendChild(card);
  const q = <T extends HTMLElement>(s: string): T => card.querySelector(s) as T;
  const head = q('.pm-ghead'), casesEl = q('.gp-cases'), statsEl = q('.pm-stats'), bar = q('.sk-bar'), tiles = q('.gp-tiles'), detail = q('.pm-detail'), foot = q('.pm-foot');
  const fit = scrollFade(detail); scrollFade(tiles);
  const close = footBtn('Esc', who ? tx('ui.leave') : closeLabel(), () => host.close());

  /** what the page holds besides the game: the control selected, an accessory waiting for its place (`armed`: both are taken), a piece waiting for the sale's confirmation
   *  (`ask`, its key), the kind shown in the catalogue, the panel (Mara's), a bargain open on a piece of the goods, the line said under the title */
  const S: { sel: string; armed: string | null; ask: string | null; filter: Filter; panel: Panel; mode: string | null; msg: string } = { sel: '', armed: null, ask: null, filter: 'all', panel: 'buy', mode: null, msg: '' };

  // ---- what the game holds
  /** the keeper's goods as lines: a piece's bargains go with it (lot L2a) */
  const goodsOf = (s: GameState): { wares: Line[]; taught: Line[] } => {
    const all = who ? actions(s).filter((o) => offeredBy(o.action as never) === who && isGoods(o)) : [];
    const argsOf = (a: Action): Line[] => all.filter((o) => isArg(o) && (a.type === 'shopBuy' ? o.action.type === 'bargain' && o.action.item === a.item : a.type === 'barter' && o.action.type === 'barter' && o.action.who === a.who)).map((o) => goodsLine(s, o));
    const wares = all.filter((o) => isWare(o) && o.action.type !== 'buySkill').map((o) => { const l = goodsLine(s, o), args = argsOf(o.action); return args.length ? { ...l, args } : l; });
    return { wares, taught: all.filter((o) => o.action.type === 'buySkill').map((o) => goodsLine(s, o)) };
  };
  /** the places the selected control's piece would take (a place itself takes none: it is not a piece) */
  const hitPlaces = (s: GameState, fk: string): WornPlace[] => {
    if (fk.startsWith('case:')) return [];
    const own = fk.startsWith('tile:') || fk.startsWith('sell:') ? owned(s).find((o) => o.key === fk.slice(fk.indexOf(':') + 1)) : null;
    if (own) return hitPlacesFor(s, own.id, own.place);
    const l = fk.startsWith('good:') ? goodsOf(s).wares.find((x) => x.key === fk.slice(5)) : null, id = l ? pieceOfLine(l) : null;
    return id ? hitPlacesFor(s, id, null) : [];
  };

  // ---- the gestures
  /** what a purchase did to the body, which the game's log does not say (B-11): the piece is worn at once, the one it replaces goes to the bag, or both places were taken */
  const worn = (pv: Preview | null): string => (!pv ? '' : pv.toBag ? tx('ui.gear.boughtBag') : pv.slot === null ? '' : pv.replaces ? tx('ui.gear.boughtSwap', { old: bare(itemName(pv.replaces)) }) : tx('ui.gear.boughtWorn'));
  const run = (a: Action): boolean => {
    const pv = a.type === 'shopBuy' ? preview(host.state(), a) : null;
    const r = host.act(a);
    if (!r.ok || r.reload) return false;
    S.msg = [...(r.events ?? []).filter((e) => e.visible).map((e) => said(e.text, e.$t)), worn(pv)].filter(Boolean).join(' ');
    card.classList.add('still');
    return true;
  };
  const focusKey = (): string => (document.activeElement as HTMLElement | null)?.closest<HTMLElement>('[data-fk]')?.dataset.fk ?? '';
  /** the keyboard back on a control after a repaint, the catalogue scrolled only as far as it takes to show it (a plain focus() would centre it) */
  const refocus = (k: string): void => {
    const b = card.querySelector<HTMLElement>(`[data-fk="${CSS.escape(k)}"]`) ?? card.querySelector<HTMLElement>('.gp-tiles [data-fk]') ?? card.querySelector<HTMLElement>('[data-fk]');
    if (!b) return;
    b.focus({ preventScroll: true }); b.scrollIntoView({ block: 'nearest' });
  };

  // ---- the parts
  const paintHead = (s: GameState): void => {
    const url = who ? portraitUrl(who) : null;
    head.innerHTML = `${url ? `<img src="${url}" alt="">` : ''}<h2 class="pm-h">${esc(title)}${p ? `<small>${esc(titleOf(p, true))}</small>` : ''}</h2>`
      + (resale ? `<div class="sk-modebox gp-panels" role="group" aria-label="${esc(tx('ui.gear.panel'))}"><button type="button" class="gp-seg" data-fk="panel:buy" aria-pressed="${S.panel === 'buy'}">${esc(tx('ui.gear.buy'))}</button><button type="button" class="gp-seg" data-fk="panel:sell" aria-pressed="${S.panel === 'sell'}">${esc(tx('ui.gear.sell'))}</button></div>` : '')
      + `<div class="pm-purse"><b>${s.player.coins}</b><small>${tx('ui.coins')}</small></div>`;
  };
  const paintStats = (s: GameState): void => { statsEl.innerHTML = statsHtml(s); };
  /** one of the four places as the model (src/ui/gearModel.ts) shows it: a free place, the hand's own sword, or a piece with its Remove button and, where Mara can buy it, its Sell */
  const caseHtml = (v: PlaceView, hit: WornPlace[]): string => {
    const { place, kind, id, hand } = v, armed = S.armed !== null && typeof place === 'number', fk = `case:${place}`;
    const kindName = tx(KIND_TEXT[kind]), cls = `sk-slot gp-case${armed ? ' armed' : ''}${hit.includes(place) ? ' hit' : ''}`;
    if (!id) {
      return `<div class="${cls} free"><button class="pm-btn sk-main" type="button" data-fk="${fk}"><span class="gp-k">${esc(kindName)}</span><b>${esc(armed ? tx('ui.gear.placeN', { n: (place as number) + 1 }) : tx('ui.gear.free'))}</b><small>${esc(tx(FITS[kind]))}</small><small class="hint">${esc(v.bag ? tx('ui.gear.bagN', { n: v.bag }) : tx('ui.gear.soldBy', { who: v.sellers }))}</small></button></div>`;
    }
    const tier = v.tier ? tx('v2.gear.tier', { tier: v.tier }) : '';
    return `<div class="${cls}${hand ? ' hand' : ''}"><button class="pm-btn sk-main" type="button" data-fk="${fk}" aria-label="${esc(`${kindName}: ${bare(itemName(id))}`)}"><span class="gp-k">${esc(kindName)}${tier ? `<i>${esc(tier)}</i>` : ''}</span><b>${esc(bare(itemName(id)))}</b><small>${esc(v.points || tx('ui.gear.noPoints'))}</small></button>`
      + (hand ? '' : `<span class="sk-ctl"><button type="button" tabindex="-1" data-rm="${place}">${esc(tx('ui.gear.remove'))}</button>${v.sale !== null ? `<button type="button" tabindex="-1" class="sell" data-sell="${place}">${esc(tx('ui.gear.sellBtn', { n: v.sale }))}</button>` : ''}</span>`) + '</div>';
  };
  /** the places the selected piece would take light up, the places themselves left as they are (the keyboard may be on one) */
  const markHit = (s: GameState): void => { const hit = hitPlaces(s, S.sel); casesEl.querySelectorAll<HTMLElement>('.gp-case').forEach((c, i) => c.classList.toggle('hit', hit.includes(PLACES[i]))); };
  const paintCases = (s: GameState): void => { const hit = hitPlaces(s, S.sel); casesEl.innerHTML = placeViews(s).map((v) => caseHtml(v, hit)).join(''); };
  const filterBtn = (k: Filter, label: string): string => `<button class="pm-btn sk-chipf" type="button" data-fk="filter:${k}" aria-pressed="${S.filter === k}">${esc(label)}</button>`;
  const paintBar = (s: GameState): void => {
    const n = owned(s).length;
    const lab = S.armed ? tx('ui.gear.pick', { name: bare(itemName(S.armed)) }) : S.mode ? '' : resale && S.panel === 'sell' ? tx('ui.gear.sellBar', { n: sellList(s).length }) : who ? tx('ui.gear.shopBar') : tx('ui.gear.owned', { n });
    bar.innerHTML = `<span class="sk-lab${S.armed ? ' say' : ''}" role="status">${esc(lab)}</span>${S.mode ? '' : `<span class="sk-filters">${filterBtn('all', tx('ui.sk.all'))}${(['weapon', 'armour', 'accessory'] as Kind[]).map((k) => filterBtn(k, tx(KIND_PLURAL[k]))).join('')}</span>`}`;
  };
  const tile = (fk: string, name: string, sub: string, st: string, o: { pressed?: boolean; off?: boolean } = {}): string => `<button class="pm-btn sk-tile${o.off ? ' warn' : ''}" type="button" data-fk="${esc(fk)}" aria-pressed="${!!o.pressed}"><b>${esc(name)}</b><small>${esc(sub)}</small><span class="st">${st}</span></button>`;
  const sub2 = (t: string): string => `<p class="pm-sub gp-sub">${esc(t)}</p>`;
  const sellList = sellListOf;
  const keep = (id: string): boolean => S.filter === 'all' || kindOfId(id) === S.filter;
  const paintTiles = (s: GameState): void => {
    const own = owned(s), { wares, taught } = goodsOf(s), parts: string[] = [];
    const mode = S.mode ? wares.find((l) => l.key === S.mode) ?? null : null;
    if (!mode) S.mode = null;
    if (mode) {
      parts.push(sub2(tx('ui.wares.bargainFor', { item: mode.name })));
      for (const a of mode.args ?? []) parts.push(tile(`arg:${a.key}`, a.name, a.sub, a.tag, { off: !a.ok }));
    } else if (resale && S.panel === 'sell') {
      const list = sellList(s).filter(({ o }) => keep(o.id));
      if (!list.length) parts.push(`<p class="sk-lab gp-empty">${esc(tx('ui.gear.sellNone'))}</p>`);
      for (const { o, sale } of list) parts.push(tile(`sell:${o.key}`, bare(itemName(o.id)), subOf(o.id), `<span>${o.place !== null ? esc(tx('ui.gear.wornTag')) : ''}</span><span class="cost">${esc(tx('ui.coinsN', { n: sale.n }))}</span>`, { pressed: o.place !== null, off: !sale.ok }));
    } else {
      const shown = wares.filter((l) => { const id = pieceOfLine(l); return id ? keep(id) : S.filter === 'all'; });
      if (shown.length) {
        parts.push(sub2(tx('ui.gear.here')));
        for (const l of shown) {
          const id = pieceOfLine(l), short = !l.ok && !l.done && (l.price ?? 0) > s.player.coins ? `<em>${esc(tx('ui.wares.short', { n: (l.price ?? 0) - s.player.coins }))}</em>` : '';
          parts.push(tile(`good:${l.key}`, l.name, id ? subOf(id) : l.sub, `<span>${l.tag}</span>${short}`, { off: !l.ok }));
        }
      }
      if (taught.length && S.filter === 'all') { parts.push(sub2(tx('ui.wares.teach'))); for (const l of taught) parts.push(tile(`good:${l.key}`, l.name, l.sub, l.tag, { off: !l.ok })); }
      const mine = own.filter((o) => keep(o.id));
      if (who && (own.length || shown.length)) parts.push(sub2(tx('ui.gear.yours', { n: own.length })));
      for (const o of mine) parts.push(tile(`tile:${o.key}`, bare(itemName(o.id)), subOf(o.id), esc(statusOf(s, o)), { pressed: o.place !== null }));
      if (!own.length && !shown.length && !taught.length) parts.push(`<p class="sk-lab gp-empty">${esc(tx('v2.gear.empty'))}</p><p class="pm-where">${esc(tx('v2.gear.where'))}</p>`);
    }
    tiles.innerHTML = parts.join('');
  };

  /** what is selected, from the game as it is now */
  type Pick = { kind: 'case'; place: WornPlace } | { kind: 'tile'; o: Own } | { kind: 'sell'; o: Own } | { kind: 'good'; l: Line } | { kind: 'arg'; l: Line } | null;
  const resolve = (s: GameState, fk: string): Pick => {
    if (fk.startsWith('case:')) { const v = fk.slice(5); return { kind: 'case', place: v === 'weapon' || v === 'armour' ? v : (+v as 0 | 1) }; }
    if (fk.startsWith('tile:') || fk.startsWith('sell:')) { const o = owned(s).find((x) => x.key === fk.slice(5)); return o ? (fk.startsWith('tile:') ? { kind: 'tile', o } : { kind: 'sell', o }) : null; }
    if (fk.startsWith('good:')) { const { wares, taught } = goodsOf(s), l = [...wares, ...taught].find((x) => x.key === fk.slice(5)); return l ? { kind: 'good', l } : null; }
    if (fk.startsWith('arg:')) { const m = goodsOf(s).wares.find((x) => x.key === S.mode); const l = m?.args?.find((x) => x.key === fk.slice(4)); return l ? { kind: 'arg', l } : null; }
    return null;
  };
  const saleOf = (s: GameState, pk: Pick): Line['sell'] => (!pk ? undefined : pk.kind === 'case' ? (placeId(s, pk.place) && placeId(s, pk.place) !== HAND ? sellOf(s, placeId(s, pk.place)!, pk.place) : undefined) : pk.kind === 'tile' || pk.kind === 'sell' ? sellOf(s, pk.o.id, pk.o.place ?? undefined) : undefined);

  const paintDetail = (): void => {
    const s = host.state(), fk = S.sel, pk = resolve(s, fk);
    const news = S.msg ? `<p class="news">${esc(S.msg)}</p>` : '', nm = (t: string): string => `<p class="nm">${esc(t)}</p>`, what = (t: string): string => (t ? `<p class="what">${esc(t)}</p>` : '');
    if (S.ask) {
      const o = owned(s).find((x) => x.key === S.ask), sale = o ? sellOf(s, o.id, o.place ?? undefined) : undefined;
      if (o && sale) { detail.innerHTML = `<div class="gp-confirm">${nm(tx('ui.gear.confirm', { item: itemName(o.id), n: sale.n }))}${what(tx('ui.gear.confirmWhat'))}</div>`; fit(); return; }
    }
    if (!pk) { detail.innerHTML = S.msg ? news : fk.startsWith('filter:') || fk.startsWith('panel:') ? '' : detail.innerHTML; if (!fk) detail.innerHTML = S.msg ? news : ''; fit(); return; }
    if (pk.kind === 'arg') {
      const m = goodsOf(s).wares.find((x) => x.key === S.mode);
      detail.innerHTML = `${nm(pk.l.name)}${what(tx('ui.wares.chance', { pct: pk.l.sub }))}<p class="ab">${esc(tx('ui.wares.ifWon', { n: pk.l.price ?? 0, list: m?.price ?? 0 }))}</p>${what(tx('ui.wares.ifLost'))}${pk.l.ok ? '' : `<p class="no">${esc(pk.l.reason ?? '')}</p>`}`;
      fit(); return;
    }
    if (pk.kind === 'good') {
      const l = pk.l, id = pieceOfLine(l), v = l.done ? null : l.plain ? { ...preview(s, l.action), rows: [] } : preview(s, l.action);
      const same = !!v && !l.plain && !v.rows.length && v.slot === null && !v.toBag && l.ok;
      const wh = [...new Set([l.sub, v?.replaces ? insteadOf(s, v.replaces) : '', v?.toBag ? tx('ui.wares.toBag') : ''])].filter(Boolean).join(' · ');
      const notes = [!l.done && l.list && l.price !== l.list ? tx('ui.wares.list', { n: l.list }) : '', same ? tx('ui.wares.same') : ''].filter(Boolean).join(' ');
      const argNo = l.args && !l.args.some((x) => x.ok) ? l.args.find((x) => x.reason)?.reason : undefined;
      detail.innerHTML = `${news}${nm(l.name)}${what(wh)}<p class="ab">${esc(id ? pieceAbout(s, id) : l.about)}</p>${what(notes)}${cmpHtml({ action: l.action }, v)}${l.ok ? '' : `<p class="no">${esc(l.reason ?? '')}</p>`}${l.ok && argNo && argNo !== l.reason ? what(argNo) : ''}`;
      fit(); return;
    }
    if (pk.kind === 'case') {
      const id = placeId(s, pk.place), kind = kindOfPlace(pk.place);
      // an accessory waiting for its place: the after of putting it there
      if (S.armed && typeof pk.place === 'number') {
        const a: Action = { type: 'equip', item: S.armed, slot: pk.place }, v = preview(s, a);
        detail.innerHTML = `${nm(bare(itemName(S.armed)))}${what(`${tx(KIND_TEXT.accessory)} · ${insteadOf(s, wornAt(s, pk.place) ?? '')}`)}<p class="ab">${esc(pieceAbout(s, S.armed))}</p>${cmpHtml({ action: a }, v)}`;
        fit(); return;
      }
      if (!id) {
        const n = bagOf(s, kind).length;
        detail.innerHTML = `${nm(tx('ui.gear.free'))}${what(tx(FITS[kind]))}${what(n ? tx('ui.gear.bagN', { n }) : tx('ui.gear.soldBy', { who: sellersOf(kind) }))}`;
        fit(); return;
      }
      const a: Action = { type: 'unequip', slot: pk.place }, v = id === HAND ? null : preview(s, a), sale = saleOf(s, pk);
      detail.innerHTML = `${news}${nm(bare(itemName(id)))}${what(`${tx(KIND_TEXT[kind])} · ${tx('ui.gear.wornTag').replace(/^• /, '')}${pk.place === 'weapon' && weaponTier(s) ? ` · ${tx('v2.gear.tier', { tier: weaponTier(s) })}` : ''}`)}<p class="ab">${esc(pieceAbout(s, id))}</p>${what(sale?.ok ? tx('ui.wares.sellHalf') : sale ? tx('ui.gear.noSale', { why: sale.reason ?? '' }) : '')}${cmpHtml({ action: a }, v)}`;
      fit(); return;
    }
    // a piece of the bag or the body, in the catalogue or on Mara's selling panel
    const o = pk.o, worn = o.place !== null, sale = saleOf(s, pk);
    let v = null, ac: Action | null = null;
    if (pk.kind === 'sell') { if (sale?.ok) { ac = sale.action; v = preview(s, ac); } }
    else if (worn) { ac = { type: 'unequip', slot: o.place! }; v = preview(s, ac); }
    else { ac = wearAction(s, o.id); v = ac ? preview(s, ac) : null; }
    const wh = pk.kind === 'sell' ? [tx(KIND_TEXT[kindOfId(o.id)]), worn ? tx('ui.gear.wornTag').replace(/^• /, '') : ''].filter(Boolean).join(' · ') : `${tx(KIND_TEXT[kindOfId(o.id)])} · ${worn ? tx('ui.gear.wornTag').replace(/^• /, '') : statusOf(s, o)}`;
    const none = !ac && pk.kind === 'tile' ? tx('ui.gear.chooseFirst') : '';
    detail.innerHTML = `${news}${nm(bare(itemName(o.id)))}${what(wh)}<p class="ab">${esc(pieceAbout(s, o.id))}</p>${what(none)}${pk.kind === 'tile' && sale ? what(sale.ok ? tx('ui.wares.sellHalf') : tx('ui.gear.noSale', { why: sale.reason ?? '' })) : ''}${ac ? cmpHtml({ action: ac }, v) : ''}${pk.kind === 'sell' && sale && !sale.ok ? `<p class="no">${esc(sale.reason ?? '')}</p>` : ''}`;
    fit();
  };

  const paintFoot = (): void => {
    const s = host.state(), fk = S.sel, pk = resolve(s, fk), sale = saleOf(s, pk);
    const wear = (): HTMLElement => footBtn('Space', S.armed ? tx('ui.gear.putHere') : pk && (pk.kind === 'case' ? placeId(s, pk.place) && placeId(s, pk.place) !== HAND : pk.kind === 'tile' && pk.o.place !== null) ? tx('ui.wares.takeOff') : pk?.kind === 'case' ? tx('ui.gear.show') : tx('ui.wares.wear'), () => activate(S.sel, 'space'));
    const sellBtn = (): HTMLElement | null => (sale?.ok && !S.armed ? footBtn('C', tx('ui.wares.sell', { n: sale.n }), () => askSell()) : null);
    if (S.ask) { fillFoot(foot, footBtn('Enter', tx('ui.gear.sellIt'), () => confirmSell(), true), footBtn('Esc', tx('ui.gear.keep'), () => { S.ask = null; paint(); })); return; }
    if (pk?.kind === 'arg') { fillFoot(foot, pk.l.ok ? footBtn('Enter', pk.l.verb, () => activate(S.sel, 'enter'), true) : null, footBtn('Esc', tx('ui.wares.back'), () => leaveMode()), null); return; }
    if (pk?.kind === 'good') {
      const l = pk.l, haggle = l.args?.some((x) => x.ok);
      fillFoot(foot, l.ok ? footBtn('Enter', l.verb, () => activate(S.sel, 'enter'), true) : null, haggle ? footBtn('Space', tx('ui.wares.haggle'), () => haggleOn(l)) : null, close);
      return;
    }
    if (pk?.kind === 'sell') { fillFoot(foot, sale?.ok ? footBtn('Enter', tx('ui.wares.sell', { n: sale.n }), () => activate(S.sel, 'enter'), true) : null, close); return; }
    if (pk && (pk.kind === 'case' || pk.kind === 'tile') && !(pk.kind === 'tile' && !pk.o.place && !wearAction(s, pk.o.id) && !S.armed && false)) { fillFoot(foot, wear(), sellBtn(), close); return; }
    if (fk.startsWith('filter:') || fk.startsWith('panel:')) { fillFoot(foot, footBtn('Space', tx('ui.sk.choose'), () => activate(S.sel, 'space')), close); return; }
    fillFoot(foot, close);
  };

  /** every part drawn again, the control that had the keyboard keeping it */
  function paint(keep?: string): void {
    const s = host.state(), fk = keep ?? focusKey();
    if (fk) S.sel = fk;
    paintHead(s); paintStats(s); paintCases(s); paintBar(s); paintTiles(s);
    if (fk) refocus(fk);
    const now = focusKey();
    if (now) { S.sel = now; card.querySelector<HTMLElement>(`[data-fk="${CSS.escape(now)}"]`)?.classList.add('on'); }
    markHit(s); paintDetail(); paintFoot();
  }

  // ---- the gestures
  const askSell = (): void => {
    const s = host.state(), pk = resolve(s, S.sel), sale = saleOf(s, pk);
    if (S.armed || !pk || !sale?.ok || !(pk.kind === 'case' || pk.kind === 'tile' || pk.kind === 'sell')) return;
    const o = pk.kind === 'case' ? owned(s).find((x) => x.place === pk.place) : pk.o;
    if (!o) return;
    S.ask = o.key; S.msg = ''; paintDetail(); paintFoot();
  };
  const confirmSell = (): void => {
    const s = host.state(), o = owned(s).find((x) => x.key === S.ask), sale = o ? sellOf(s, o.id, o.place ?? undefined) : undefined;
    S.ask = null;
    if (!o || !sale?.ok) { paint(); return; }
    if (!run(sale.action)) { paint(); return; }
    // the piece has left: the selection goes to the first thing left on the panel
    paint(resale && S.panel === 'sell' ? '' : `case:${o.place ?? 'weapon'}`);
  };
  const leaveMode = (): void => { const k = S.mode; S.mode = null; S.msg = ''; paint(k ? `good:${k}` : ''); };
  const haggleOn = (l: Line): void => { S.mode = l.key; S.msg = ''; paint(''); card.querySelector<HTMLElement>('[data-fk^="arg:"]')?.focus(); };
  /** wear or remove a piece, a click or Space or Enter (PE-5, PE-6) */
  function activate(fk: string, via: 'click' | 'space' | 'enter'): void {
    const s = host.state();
    if (fk.startsWith('panel:')) { S.panel = fk.slice(6) as Panel; S.msg = ''; S.armed = null; S.ask = null; paint(fk); return; }
    if (fk.startsWith('filter:')) { S.filter = fk.slice(7) as Filter; paint(fk); return; }
    const pk = resolve(s, fk);
    if (!pk) return;
    S.ask = null;
    if (pk.kind === 'arg') { if (!pk.l.ok) return; const key = S.mode; if (run(pk.l.action)) { S.mode = null; paint(key ? `good:${key}` : ''); } return; }
    if (pk.kind === 'good') {
      // in a shop Space stays « Haggle » on an article (PE-6); a click or Enter buys (PE-8)
      if (via === 'space') { if (pk.l.args?.some((x) => x.ok)) haggleOn(pk.l); return; }
      if (!pk.l.ok) { if ((pk.l.price ?? 0) > s.player.coins) host.poor?.(); return; }
      if (run(pk.l.action)) paint(`good:${pk.l.key}`);
      return;
    }
    if (pk.kind === 'sell') { S.sel = fk; askSell(); return; }
    if (pk.kind === 'case') {
      const id = placeId(s, pk.place);
      // an accessory waiting for its place goes here, replacing what is here
      if (S.armed && typeof pk.place === 'number') {
        const item = S.armed, a = wearAction(s, item, pk.place);
        S.armed = null;
        if (a && run(a)) paint(`tile:${item}`); else paint(fk);
        return;
      }
      if (S.armed) { S.armed = null; S.msg = ''; paint(fk); return; }
      if (!id) {
        // a free place: the catalogue shows what fits it
        S.filter = kindOfPlace(pk.place); S.msg = '';
        const first = bagOf(s, S.filter)[0];
        paint(first ? `tile:${owned(s).find((o) => o.id === first && o.place === null)?.key ?? first}` : fk);
        return;
      }
      if (id === HAND) { S.msg = ''; paint(fk); return; }
      if (run({ type: 'unequip', slot: pk.place })) paint(fk);
      return;
    }
    // a piece of the catalogue: worn → take off; in the bag → wear (an accessory with both places taken asks which one it replaces)
    const o = pk.o;
    if (o.place !== null) { if (run({ type: 'unequip', slot: o.place })) paint(`tile:${o.key}`); return; }
    const a = wearAction(s, o.id);
    if (!a) { S.armed = o.id; S.msg = ''; paint('case:0'); return; }
    if (run(a)) paint(`tile:${o.key}`);
  }

  card.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('button');
    if (!b) return;
    const s = host.state();
    if (b.dataset.rm !== undefined) { const v = b.dataset.rm, place = (v === 'weapon' || v === 'armour' ? v : +v) as WornPlace; if (run({ type: 'unequip', slot: place })) paint(`case:${v}`); return; }
    if (b.dataset.sell !== undefined) { S.sel = `case:${b.dataset.sell}`; askSell(); card.querySelector<HTMLElement>(`[data-fk="case:${b.dataset.sell}"]`)?.focus({ preventScroll: true }); void s; return; }
    const fk = b.dataset.fk; if (fk) activate(fk, 'click');
  });
  card.addEventListener('focusin', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-fk]');
    if (!b) return;
    card.querySelectorAll('[data-fk].on').forEach((x) => x.classList.remove('on')); b.classList.add('on');
    if (b.dataset.fk === S.sel) return;
    S.sel = b.dataset.fk!; S.msg = ''; if (S.ask) S.ask = null;
    // a piece's places light up (the kind it takes), and its detail is read
    markHit(host.state()); paintDetail(); paintFoot();
  });
  // the pointer selects what it moves over; a pointer parked while the page is drawn again is not a move (Chrome sends it again to what is now under it)
  let px = -1, py = -1;
  card.addEventListener('mousemove', (e) => {
    if (e.clientX === px && e.clientY === py) return;
    px = e.clientX; py = e.clientY;
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-fk]');
    if (b && document.activeElement !== b) b.focus({ preventScroll: true });
  });
  /** the arrows go to the control nearest in their direction, over the whole page: from a place to the tiles and back, along the grid of tiles, up to the filters (src/ui/nav.ts, one rule for this page and the skills page: IA-06) */
  const go = (key: string): boolean => arrowFocus(card, key, { col: (x) => x.closest('.pm-self, .pm-goods'), rows: '.gp-tiles' });
  card.addEventListener('keydown', (e) => {
    // a held Enter from the dialogue must not buy the first line
    if (e.key === 'Enter' && e.repeat) { e.preventDefault(); return; }
    const fk = focusKey();
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault(); e.stopPropagation();
      go(e.key);
      return;
    }
    if (e.key === ' ') { e.preventDefault(); e.stopPropagation(); if (!e.repeat && fk && !S.ask) activate(fk, 'space'); return; }
    if (e.key === 'Enter') {
      e.preventDefault(); e.stopPropagation();
      if (e.repeat) return;
      if (S.ask) { confirmSell(); return; }
      if (fk) activate(fk, 'enter');
      return;
    }
    if (e.key === 'Escape') {
      // the innermost thing first: a sale waiting for its confirmation, an accessory waiting for its place, a bargain
      if (S.ask) { S.ask = null; e.preventDefault(); e.stopPropagation(); paint(); return; }
      if (S.armed) { S.armed = null; S.msg = ''; e.preventDefault(); e.stopPropagation(); paint(); return; }
      if (S.mode) { e.preventDefault(); e.stopPropagation(); leaveMode(); }
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    if (e.key.toLowerCase() === 'c') { e.preventDefault(); e.stopPropagation(); askSell(); return; }
    if ((e.key === 'Delete' || e.key === 'Backspace') && fk.startsWith('case:')) { e.preventDefault(); e.stopPropagation(); activate(fk, 'enter'); }
  });
  card.addEventListener('keyup', (e) => { if (e.key === ' ') e.preventDefault(); });

  // the first selection: the first article one can buy, else the first piece owned, else the first place
  const first = (): string => {
    const s = host.state(), { wares } = goodsOf(s), w = wares.find((l) => l.ok) ?? wares[0], o = owned(s)[0];
    return w ? `good:${w.key}` : o ? `tile:${o.key}` : 'case:weapon';
  };
  S.sel = first();
  paint(S.sel);
  return { root, focus: () => { refocus(S.sel); } };
}
