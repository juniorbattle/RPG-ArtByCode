import { actions, placeName, standings, dusk, type Action, type ActionOption, type GameEvent, type GameState } from '../simulation';
import { offeredBy } from '../simulation/roles';
import { PEOPLE, titleOf } from '../narrative/people';
import { linesOf } from '../narrative/dialogue';
import { RIVALS } from '../narrative/roster';
import { boardHtml, standingsHtml as standingsHtmlRows } from './board';
import { portraitUrl } from './portraits';
import { downloadSave, loadSaveFile, writeSave } from './save';
import { el, esc, injectStyle, overlay } from './style';
import { skillName, tx } from '../narrative/text';
import { isV2, v2KitOf } from '../simulation/v2';
import { stageName, v2EndLine, v2Ranking } from '../tournament/v2calendar';
import { SKILL_BOOK, skillAction } from '../combat/skillbook';
import { chargeTime } from '../combat/skills';
import { itemAbout, itemName, weaponTier } from '../simulation/v2gear';
import { opponentOf, playerMatch } from '../tournament/pool';
import { FOE_SKILLS, V2_FOES } from '../combat/v2duel';

/** The play mode's interface in a place (journal Passe L4; choice K1: English): the clock and the next deadline (TOURNAMENT § 11), what
 *  the player can do here and what it costs in slots (GAMEPLAY § 4), the people to talk to (a portrait, their words, the options they
 *  offer), the journal of facts and events, the tournament board, the map of the city's places and the save menu. DOM over the scene,
 *  keyboard reachable (E talk, M map, J journal, T tournament, Esc menu or close), readable at phone size. */

export interface ActResult { ok: boolean; reason?: string; events?: GameEvent[]; reload?: boolean }
export interface UiHost {
  state(): GameState;
  act(a: Action): ActResult;
  /** the page must reload (another slot's look, another place): the state is saved already */
  reload(extra?: Record<string, string>): void;
  /** the person standing next to the player in the scene, if any (the district's actors) */
  nearby?(): string | null;
  /** the version 2's squares (P4, lot V9): the camera turns to the person spoken to (null: back to the hero) */
  focus?(who: string | null): void;
}

/** on a computer: the status panel top left, the bar top right, « Here » under it; on a phone (the operator's decision L3, « Avec le système de
 *  design »; touch stays out of the slice, E30): a strip along the top, tabs along the bottom (« Here » the first, its list a sheet above them),
 *  the dialogue and the other cards sheets at the bottom of the screen */
const CSS = `
#pm-status{left:12px;top:12px;width:min(390px,calc(100vw - 24px));padding:2px 6px}
#pm-status .clock{font:400 var(--ds-fs-pixel)/1.2 var(--ds-pixel);letter-spacing:.04em;color:var(--ds-goldHi);text-shadow:0 var(--ds-px) 0 var(--ds-ink)}
#pm-status .stats{margin-top:2px}
#pm-status .next{margin-top:4px;font-size:var(--ds-fs-small);color:var(--ds-goldHi)}
#pm-status .hurt{color:var(--ds-amberHi)}
#pm-bar{right:12px;top:12px;display:flex;gap:6px}
#pm-bar .pm-btn{width:auto;margin:0;padding:1px 6px 1px 2px}
#pm-bar .tab-here{display:none}
#pm-here{right:12px;top:78px;width:min(380px,calc(100vw - 24px));max-height:calc(100vh - 160px);overflow:auto;padding:2px 6px}
#pm-here.min .list{display:none}
.pm-btn .cost+.cost{margin-left:0}
#pm-prompt{left:50%;bottom:24px;transform:translateX(-50%);display:flex;align-items:center;gap:10px;padding:2px 10px 2px 2px;color:var(--ds-ivory);font-size:var(--ds-fs-label);border:calc(4 * var(--ds-px)) solid transparent;border-image:var(--ds-f-btnHi) 4 fill / calc(4 * var(--ds-px)) stretch;image-rendering:pixelated;opacity:0;transition:opacity .2s;pointer-events:none;white-space:nowrap}
#pm-prompt.on{opacity:1}
#pm-toast{left:50%;top:12px;transform:translateX(-50%);width:min(560px,calc(100vw - 24px));padding:2px 8px;display:none}
#pm-toast.on{display:block}
#pm-toast p{margin:4px 0}
#pm-place-tag{left:50%;bottom:10px;transform:translateX(-50%);opacity:.8;white-space:nowrap;pointer-events:none}
.pm-dlg{display:flex;gap:14px;align-items:flex-start}
.pm-dlg .port{flex:none;line-height:0;border:calc(3 * var(--ds-px)) solid transparent;border-image:var(--ds-f-gauge) 3 fill / calc(3 * var(--ds-px)) stretch;image-rendering:pixelated}
.pm-dlg img{width:96px;height:96px;image-rendering:pixelated}
.pm-dlg .who{flex:1;min-width:0}
.pm-parch q{display:block;margin:4px 0;quotes:none}
.pm-talk{place-items:end center;background:transparent;padding:0 16px 16px}
.pm-talk .pm-card{width:min(760px,100%);max-height:52vh}
.pm-card input[type=range]{accent-color:var(--ds-goldHi);width:min(320px,100%)}
@media (max-height:500px){.pm-talk{padding:0}.pm-talk .pm-card{max-height:82vh}}
#pm-status .pm-self{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap}
#pm-status .pm-self .pm-btn{flex:1 1 auto;margin:0;padding:2px 8px}
.pm-result .pm-big{text-align:center}
.pm-foe{display:flex;gap:12px;align-items:flex-start;margin:6px 0}
@media (max-width:700px){
  #pm-status{left:6px;right:6px;top:6px;width:auto;padding:0 4px}
  #pm-status .next{margin-top:0}
  #pm-bar{top:auto;bottom:6px;left:6px;right:6px;display:grid;grid-template-columns:repeat(5,1fr);gap:4px}
  #pm-bar .pm-btn{justify-content:center;padding:4px 0;font-size:var(--ds-fs-small)}
  #pm-bar .pm-btn kbd{display:none}
  #pm-bar .tab-here{display:flex}
  #pm-here{top:auto;bottom:62px;left:6px;right:6px;width:auto;max-height:46vh}
  #pm-here.min{display:none}
  #pm-prompt{bottom:auto;top:44%}
  #pm-toast{top:auto;bottom:62px}
  #pm-place-tag{bottom:62px;width:calc(100vw - 24px);white-space:normal;text-align:center}
  .pm-dlg img{width:64px;height:64px}
}
@media (max-height:480px) and (min-width:701px){
  #pm-status{left:6px;top:6px;width:380px;padding:0 4px}
  #pm-status .next{display:none}
  #pm-bar{top:auto;bottom:6px;right:6px;left:auto}
  #pm-bar .pm-btn{padding:0 6px 0 2px;font-size:var(--ds-fs-small)}
  #pm-bar .tab-here{display:flex}
  #pm-here{top:6px;right:6px;bottom:auto;width:340px;max-height:calc(100vh - 70px)}
  #pm-here.min{display:none}
  #pm-toast{top:auto;bottom:60px;width:min(560px,calc(100vw - 12px))}
  #pm-place-tag{bottom:60px}
  .pm-dlg img{width:48px;height:48px}
}
`;

/** what an action takes, one tag per currency (the operator's decision P2, journal Passes UI1 / UI2): its coins (from the simulation, not
 *  the label), its slot; « free » only when it takes neither */
export function costTag(o: Pick<ActionOption, 'cost' | 'coins'>): string {
  const tags = [o.coins ? tx(o.coins === 1 ? 'ui.coin' : 'ui.coinsN', { n: o.coins }) : '', o.cost ? tx('ui.oneSlot') : ''].filter(Boolean);
  return tags.length ? tags.map((t) => `<span class="cost">${t}</span>`).join('') : `<span class="cost free">${tx('ui.free')}</span>`;
}

export class TownUi {
  private status = el('div', 'pm pm-card');
  private bar = el('div', 'pm');
  private here = el('div', 'pm pm-card');
  private prompt = el('div', 'pm');
  private toast = el('div', 'pm pm-card');
  /** a dialogue, the map, the journal, the board or the menu is open: the scene's keys are ignored */
  modal = false;
  private near: string | null = null;

  constructor(private host: UiHost, private seenSeq: number) {
    injectStyle();
    if (!document.getElementById('pm-town-css')) { const st = document.createElement('style'); st.id = 'pm-town-css'; st.textContent = CSS; document.head.appendChild(st); }
    this.status.id = 'pm-status'; this.bar.id = 'pm-bar'; this.here.id = 'pm-here'; this.prompt.id = 'pm-prompt'; this.toast.id = 'pm-toast';
    this.status.setAttribute('aria-live', 'polite');
    document.body.append(this.status, this.bar, this.here, this.prompt, this.toast);
    // a phone's first tab: « Here », whose list is a sheet above the tabs (a computer shows the panel itself)
    const tab = el('button', 'pm-btn tab-here', tx('ui.here')); tab.addEventListener('click', () => this.here.classList.toggle('min')); this.bar.appendChild(tab);
    for (const [k, label, f] of [['M', tx('ui.map'), () => this.openMap()], ['J', tx('ui.journal'), () => this.openJournal()], ['T', tx('ui.tournament'), () => this.openBoard()], ['Esc', tx('ui.menu'), () => this.openMenu()]] as const) {
      const b = el('button', 'pm-btn', `<kbd>${k}</kbd>${label}`); b.addEventListener('click', f); this.bar.appendChild(b);
    }
    // the version 2: the skills (K), their levels and the four brought
    if (isV2(this.st)) {
      const b = el('button', 'pm-btn', `<kbd>K</kbd>${tx('v2.skills.view')}`); b.addEventListener('click', () => this.openSkills(false)); this.bar.insertBefore(b, this.bar.lastElementChild);
      const g = el('button', 'pm-btn', `<kbd>G</kbd>${tx('v2.gear.view')}`); g.addEventListener('click', () => this.openGear()); this.bar.insertBefore(g, this.bar.lastElementChild);
      const v = el('button', 'pm-btn', `<kbd>V</kbd>${tx('v2.sound.view')}`); v.addEventListener('click', () => void this.openSound()); this.bar.insertBefore(v, this.bar.lastElementChild);
    }
    window.addEventListener('keydown', (e) => {
      if (e.repeat || (e.target instanceof HTMLInputElement)) return;
      const k = e.key.toLowerCase();
      if (k === 'n' && isV2(this.st)) { void import('../audio/Sound').then((m) => { const s = m.sound(); s.set({ muted: !s.settings.muted }); if (this.current?.querySelector('input[type=range]')) void this.openSound(); }); return; }
      if (this.modal) { if (k === 'escape') this.closeModal(); return; }
      if (k === 'm') this.openMap(); else if (k === 'j') this.openJournal(); else if (k === 't') this.openBoard(); else if (k === 'escape') this.openMenu();
      else if (k === 'k' && isV2(this.st)) this.openSkills(false); else if (k === 'g' && isV2(this.st)) this.openGear(); else if (k === 'v' && isV2(this.st)) void this.openSound();
    });
    this.render();
    // a phone's screen keeps the scene: the list opens from its title
    if (window.innerWidth < 700) this.here.classList.add('min');
    if (this.st.over) void this.showEnd(); else this.showNews();
  }

  /** the end of the slice: the pool after its second round, what the player's choices left in the Cité, what comes next */
  private async showEnd(): Promise<void> {
    const s = this.st, rows = standings(s), rank = rows.findIndex((r) => r.id === 'player') + 1, wins = s.tournament.matches.filter((m) => m.winner === 'player').length;
    const told: string[] = [], v2 = isV2(s);
    // the version 2's ten days (lot V6): the final order's line
    if (v2) told.push(v2EndLine(s));
    else told.push(`${esc(s.player.name)} ends the pool's two rounds ${rank === 1 ? 'at its head' : `in ${rank}${rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th'} place`}: ${wins} win${wins === 1 ? '' : 's'}, ${s.tournament.points.player} points.`);
    told.push(s.facts.includes('saboteur-caught') ? tx('ui.end.forgeCaught')
      : s.facts.includes('forge-burned') ? (s.flags.reported ? tx('ui.end.forgeReported') : s.services.forge === 'repaired' ? tx('ui.end.forgeRepaired') : tx('ui.end.forgeWhisper'))
        : tx('ui.end.forgeSafe'));
    if (s.facts.includes('orla-recruitable')) told.push(tx('ui.end.orlaRecruit'));
    else if (s.facts.includes('orla-introduced')) told.push(tx('ui.end.orlaIntro'));
    if (!v2) told.push(rank <= 4 ? tx('ui.end.top4') : tx('ui.end.out'));
    this.modal = true;
    // the version 2's final order (the bracket's results first, then the pool's), with the pool's points
    const shown = v2 ? v2Ranking(s).map((id) => rows.find((r) => r.id === id)!) : rows;
    const o = overlay(`<p class="pm-big">${v2 ? tx('v2.end.title') : tx('ui.end.title')}</p><p class="pm-sub pm-center">${v2 ? tx('v2.end.sub') : tx('ui.end.sub')}</p>${told.map((t) => `<p>${t}</p>`).join('')}<p class="pm-sub">${v2 ? tx('v2.end.order') : tx('ui.pool')}</p>${standingsHtmlRows(s, shown)}`,
      [{ id: 'stay', label: tx('ui.end.stay'), primary: true }, { id: 'title', label: tx('ui.end.back') }]);
    this.current = o.root;
    const r = await o.done;
    this.modal = false; this.current = null;
    if (r === 'title') location.assign(location.pathname);
  }

  private get st(): GameState { return this.host.state(); }

  /** per frame: who stands next to the player (the prompt) */
  update(): void {
    const n = this.host.nearby?.() ?? null;
    if (n !== this.near) {
      this.near = n;
      const p = n ? PEOPLE[n] : null;
      this.prompt.innerHTML = p ? `<kbd>E</kbd>${tx('ui.talkTo', { name: esc(p.name), title: esc(titleOf(p, isV2(this.st))) })}` : '';
      this.prompt.classList.toggle('on', !!p && !this.modal);
    }
  }

  /** E (or Space) in the scene */
  interact(): void { if (!this.modal && this.near) this.openPerson(this.near); }

  render(): void {
    const s = this.st, P = s.player, m = s.tournament.matches.find((x) => x.day >= s.day && !x.winner && (x.a === 'player' || x.b === 'player'));
    const opp = m ? RIVALS[m.a === 'player' ? m.b : m.a] : null;
    const when = m && m.day === s.day ? (s.slot === 'afternoon' ? tx('ui.next.now') : tx('ui.next.today')) : '';
    // the version 2 (journal Passe VP1): the bout's stage, the ten days' end
    const next = isV2(s) ? (s.over ? tx('v2.over') : opp ? tx('v2.next.bout', { stage: stageName(m!), name: opp.name, day: m!.day, when }) : tx('v2.next.done'))
      : s.over ? tx('ui.next.over') : opp ? tx('ui.next.bout', { name: opp.name, day: m!.day, when }) : tx('ui.next.done');
    const slotName = s.slot === 'evening' ? (dusk(s) ? tx('ui.slot.sunset') : 'evening') : s.slot;
    this.status.innerHTML = `<div class="clock">${(isV2(s) ? tx('ui.clockV2', { day: s.day, slot: slotName }) : tx('ui.clock', { day: s.day, slot: slotName }))}</div><div class="pm-sub">${esc(P.name)} · ${esc(placeName(s.place, isV2(s)))}</div>
      <div class="stats"><span class="pm-num">${P.coins}</span> ${tx('ui.coins')} · ${tx('ui.reputation')} <span class="pm-num">${P.reputation}</span> · ${P.injury ? `<span class="hurt">${P.injury > 1 ? tx('ui.badlyHurt') : tx('ui.hurt')}</span>` : tx('ui.fit')}${P.items.length ? ` · ${esc(P.items.map((i) => i.replace('-', ' ')).join(', '))}` : ''}</div>
      <div class="next">${esc(next)}</div>`;
    if (isV2(s) && !s.over) {
      const row = el('div', 'pm-self');
      for (const o of actions(s).filter((x) => x.action.type === 'rest' || x.action.type === 'wait')) {
        const b = el('button', 'pm-btn', `<span>${o.action.type === 'rest' ? tx('v2.self.rest') : tx('v2.self.wait')}</span>${costTag(o)}`); b.disabled = !o.ok; b.title = o.ok ? o.label : o.reason ?? '';
        b.addEventListener('click', () => this.run(o.action)); row.appendChild(b);
      }
      this.status.appendChild(row);
    }
    this.renderHere();
  }

  /** what to do here: the player's own actions and the place's (the people's are in their dialogues) */
  private renderHere(): void {
    const s = this.st, v2 = isV2(s);
    // P5 (lot V9, the version 2): « Here » keeps the place's actions open now; the player's own (rest, wait) stand under the status
    const opts = actions(s).filter((o) => { const by = offeredBy(o.action as never); return o.action.type !== 'talk' && o.action.type !== 'move' && (by === null || by === 'forge') && (!v2 || (o.ok && o.action.type !== 'rest' && o.action.type !== 'wait')); });
    const fight = s.slot === 'afternoon' && s.tournament.matches.some((m) => m.day === s.day && !m.winner && (m.a === 'player' || m.b === 'player'));
    const people = actions(s).filter((o) => o.action.type === 'talk');
    this.here.innerHTML = `<h2 class="pm-h pm-toggle" tabindex="0" title="${tx('ui.showHide')}">${tx('ui.here')}</h2><div class="list"></div>`;
    const list = this.here.querySelector('.list')!, h = this.here.querySelector('h2')!;
    h.addEventListener('click', () => this.here.classList.toggle('min'));
    if (fight) {
      const b = el('button', 'pm-btn primary', `<span>${tx('ui.enterArena')}</span><span class="cost">${tx('ui.oneSlot')}</span>`);
      // the version 2: the match sheet chooses the four skills first (lot V2, journal Passe V2)
      b.addEventListener('click', () => { if (isV2(s)) { this.openSkills(true); return; } writeSave(s); this.host.reload({ scene: 'arena' }); }); list.appendChild(b);
    }
    // the version 2: a challenge waits on the sand (lot V4)
    if (s.v2?.challenge) {
      const b = el('button', 'pm-btn primary', `<span>${tx('v2.challenge.enter')}</span><span class="cost">${tx('ui.oneSlot')}</span>`);
      b.addEventListener('click', () => { writeSave(s); this.host.reload({ scene: 'arena', challenge: '1' }); }); list.appendChild(b);
    }
    for (const o of opts) list.appendChild(this.optionButton(o));
    if (people.length) {
      list.appendChild(el('p', 'pm-sub', tx('ui.peopleHere')));
      for (const o of people) {
        const who = (o.action as { who: string }).who, b = el('button', 'pm-btn', `<span>${esc(PEOPLE[who].name)}<span class="why${o.ok ? ' title' : ''}">${o.ok ? esc(PEOPLE[who].title) : esc(o.reason ?? '')}</span></span>`);
        b.disabled = !o.ok; b.addEventListener('click', () => this.openPerson(who)); list.appendChild(b);
      }
    }
  }

  private optionButton(o: ActionOption, after?: () => void): HTMLButtonElement {
    const b = el('button', 'pm-btn', `<span>${esc(o.label)}${o.ok ? '' : `<span class="why">${esc(o.reason ?? '')}</span>`}</span>${costTag(o)}`);
    b.disabled = !o.ok;
    b.addEventListener('click', () => { this.run(o.action); after?.(); });
    return b;
  }

  /** applies an action: a reload for a new slot or place, otherwise the panels and the news */
  run(a: Action): void {
    const r = this.host.act(a);
    if (!r.ok) { void this.card(`<p>${esc(r.reason ?? tx('ui.cannot'))}</p>`); return; }
    if (r.reload) { this.closeModal(); this.host.reload(); return; }
    this.render();
    const news = (r.events ?? []).filter((e) => e.visible);
    if (news.length) this.flash(news.map((e) => e.text));
  }

  private flash(lines: string[]): void {
    this.toast.innerHTML = lines.map((x) => `<p>${esc(x)}</p>`).join('');
    this.toast.classList.add('on');
    clearTimeout((this.toast as any).t);
    (this.toast as any).t = setTimeout(() => this.toast.classList.remove('on'), 6500);
  }

  /** what happened since the player last looked (the slot that ended, the bouts, the night) */
  private showNews(): void {
    const news = this.st.log.filter((e) => e.visible && e.seq > this.seenSeq);
    if (!news.length) return;
    // P6 (lot V9): back from a bout of the version 2, the result first, large
    const duel = isV2(this.st) ? news.find((e) => e.kind === 'match' && (e.id === 'player-won' || e.id === 'player-lost')) : undefined;
    if (duel) { void this.card(`<div class="pm-result"><p class="pm-big">${duel.id === 'player-won' ? tx('v2.result.won') : tx('v2.result.lost')}</p>${news.slice(-8).map((e) => `<p>${esc(e.text)}</p>`).join('')}</div>`, tx('ui.goOn')); return; }
    void this.card(`<h2 class="pm-h">${news.length > 1 ? tx('ui.meanwhile') : tx('ui.news')}</h2>${news.slice(-8).map((e) => `<p>${esc(e.text)}</p>`).join('')}`, tx('ui.goOn'));
  }

  private async card(html: string, ok = tx('ui.close')): Promise<string> {
    this.modal = true; this.prompt.classList.remove('on');
    const o = overlay(html, [{ id: 'ok', label: ok, primary: true }]);
    this.current = o.root;
    const r = await o.done;
    this.modal = false; this.current = null;
    return r;
  }
  private current: HTMLElement | null = null;
  private closeModal(): void { if (this.current) { this.current.remove(); this.current = null; } if (this.modal) this.host.focus?.(null); this.modal = false; }

  openPerson(who: string): void {
    const s = this.st, p = PEOPLE[who];
    if (!p) return;
    const talk = actions(s).find((o) => o.action.type === 'talk' && (o.action as { who: string }).who === who);
    if (!talk?.ok) { void this.card(`<p>${esc(talk?.reason ?? `${p.name} is not here.`)}</p>`); return; }
    this.run({ type: 'talk', who });
    const st = this.st, lines = linesOf(st, who), url = portraitUrl(who);
    const opts = actions(st).filter((o) => offeredBy(o.action as never) === who && !(o.action.type === 'scout' && (o.action as { who: string }).who !== who));
    this.closeModal();
    this.modal = true; this.prompt.classList.remove('on');
    // P4 (lot V9, the version 2): the dialogue at the bottom of the screen, the scene kept visible and turned to the speaker
    const root = el('div', isV2(st) ? 'pm pm-overlay pm-talk' : 'pm pm-overlay'), card = el('div', 'pm-card');
    if (isV2(st)) this.host.focus?.(who);
    card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', p.name);
    card.innerHTML = `<div class="pm-dlg">${url ? `<span class="port"><img src="${url}" alt=""></span>` : ''}<div class="who"><h2 class="pm-h">${esc(p.name)}</h2><p class="pm-sub">${esc(titleOf(p, isV2(this.st)))}</p></div></div><div class="pm-parch">${lines.map((l) => `<q>${esc(l)}</q>`).join('')}</div>`;
    for (const o of opts) card.appendChild(this.optionButton(o, () => { if (this.current === root) this.openPerson(who); }));
    const leave = el('button', 'pm-btn', `<kbd>Esc</kbd>${tx('ui.leave')}`);
    leave.addEventListener('click', () => this.closeModal());
    card.appendChild(leave);
    root.appendChild(card);
    document.body.appendChild(root);
    this.current = root;
    ((card.querySelector('.pm-btn:not(:disabled)') as HTMLButtonElement | null) ?? leave).focus();
  }

  /** the version 2's skills (lot V2): each owned skill with its level, its charge time, its AP and family; four chosen (the match sheet's
   *  preparation, CB-1 § 8); `enter`: the bout follows (the four applied, then the arena) */
  openSkills(enter: boolean): void {
    const s = this.st, kit = v2KitOf(s) as { loadout: string[]; levels: Record<string, number> }, chosen = new Set<string>(kit.loadout);
    this.closeModal(); this.modal = true; this.prompt.classList.remove('on');
    const root = el('div', 'pm pm-overlay'), card = el('div', 'pm-card', `<h2 class="pm-h">${tx('v2.skills.title')}</h2><p class="pm-sub">${tx('v2.skills.sub')}</p>`);
    card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', tx('v2.skills.title'));
    const go = el('button', 'pm-btn primary', `<span>${enter ? tx('v2.skills.keep') : tx('ui.close')}</span>`);
    const sync = () => { go.disabled = enter && chosen.size !== 4; };
    for (const id of Object.keys(kit.levels).filter((k) => kit.levels[k] > 0)) {
      const lv = kit.levels[id], fam = SKILL_BOOK[id]?.family ?? 'offensive', ap = skillAction(id).apCost ?? 0;
      const b = el('button', `pm-btn${chosen.has(id) ? ' primary' : ''}`, `<span>${esc(skillName(id))}<span class="why title">${tx('v2.skills.level', { level: lv })} · ${tx(fam === 'offensive' ? 'v2.family.offensive' : fam === 'defensive' ? 'v2.family.defensive' : 'v2.family.support')} · ${tx('v2.skills.charge', { charge: chargeTime(id, lv) })}</span></span><span class="cost">${tx('v2.skills.ap', { ap })}</span>`);
      b.setAttribute('aria-pressed', String(chosen.has(id)));
      b.addEventListener('click', () => {
        if (chosen.has(id)) chosen.delete(id); else if (chosen.size < 4) chosen.add(id);
        b.classList.toggle('primary', chosen.has(id)); b.setAttribute('aria-pressed', String(chosen.has(id))); sync();
      });
      card.appendChild(b);
    }
    if (enter) card.appendChild(el('p', 'pm-sub', tx('v2.skills.pick')));
    // P6 (lot V9): the match sheet, the opponent first
    if (enter) card.insertBefore(el('div', '', this.matchSheetHtml(s)), card.children[1] ?? null);
    go.addEventListener('click', () => {
      const four = kit.loadout.filter((x) => chosen.has(x)).concat([...chosen].filter((x) => !kit.loadout.includes(x)));
      if (chosen.size === 4 && four.join() !== kit.loadout.join()) this.host.act({ type: 'setLoadout', skills: four });
      if (!enter) { this.closeModal(); return; }
      writeSave(this.st); this.closeModal(); this.host.reload({ scene: 'arena' });
    });
    card.appendChild(go); sync();
    root.appendChild(card); document.body.appendChild(root); this.current = root;
    go.focus();
  }

  /** P6 (lot V9): the bout's stage, the opponent (face, name, style), what the player knows of their skills, the gear worn, an ally's advice */
  private matchSheetHtml(s: GameState): string {
    const m = playerMatch(s); if (!m) return '';
    const id = opponentOf(m), r = RIVALS[id], url = portraitUrl(id), g = s.v2?.gear;
    const stage = stageName(m);
    const intel = s.facts.includes(`scouted:${id}`) ? tx('ui.arena.foeSkills', { name: r.name, skills: (V2_FOES[id]?.skills.list ?? []).map((k) => FOE_SKILLS[k.id].name).join(', ') }) : tx('v2.sheet.unknown', { name: r.name });
    const gear = !g ? '' : g.armour ? tx('v2.sheet.gear', { weapon: itemName(g.weapon), tier: weaponTier(s), armour: itemName(g.armour) }) : tx('v2.sheet.gearBare', { weapon: itemName(g.weapon), tier: weaponTier(s) });
    return `<p class="pm-sub">${esc(stage)}</p><div class="pm-foe">${url ? `<span class="port"><img src="${url}" alt="" width="64" height="64"></span>` : ''}<div><h3 class="pm-h">${esc(r.name)}</h3><p class="pm-sub">${esc(r.epithet)}</p><p>${esc(r.bio)}</p></div></div>`
      + `<p class="pm-sub">${esc(intel)}</p><p class="pm-sub">${esc(gear)}</p>${s.facts.includes('orla-recruited') ? `<p class="pm-sub">${tx('v2.sheet.ally')}</p>` : ''}`;
  }

  /** the version 2's gear (lot V3): the weapon and its tier, the armour, both accessories, and the bag (each owned piece worn by a click) */
  openGear(): void {
    const s = this.st, g = s.v2?.gear;
    if (!g) return;
    this.closeModal(); this.modal = true; this.prompt.classList.remove('on');
    const row = (label: string, id: string | null, extra = '') => `<p><span class="pm-sub">${label}</span><br>${id ? `${esc(itemName(id))}${extra} <span class="pm-sub">${esc(itemAbout(id))}</span>` : tx('v2.gear.none')}</p>`;
    const root = el('div', 'pm pm-overlay'), card = el('div', 'pm-card', `<h2 class="pm-h">${tx('v2.gear.title')}</h2>${row(tx('v2.gear.weapon'), g.weapon, ` · ${tx('v2.gear.tier', { tier: weaponTier(s) })}`)}${row(tx('v2.gear.armour'), g.armour)}${row(tx('v2.gear.acc'), g.acc[0])}${row(tx('v2.gear.acc'), g.acc[1])}`);
    card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', tx('v2.gear.title'));
    if (g.bag.length) card.appendChild(el('p', 'pm-sub', tx('v2.gear.bag')));
    for (const id of g.bag) {
      const b = el('button', 'pm-btn', `<span>${esc(tx('v2.equip.label', { item: itemName(id) }))}<span class="why title">${esc(itemAbout(id))}</span></span>${costTag({ cost: 0, coins: 0 })}`);
      b.addEventListener('click', () => { this.run({ type: 'equip', item: id }); this.openGear(); });
      card.appendChild(b);
    }
    const close = el('button', 'pm-btn', `<kbd>Esc</kbd>${tx('ui.close')}`); close.addEventListener('click', () => this.closeModal()); card.appendChild(close);
    root.appendChild(card); document.body.appendChild(root); this.current = root; close.focus();
  }

  /** the version 2's sound (lot V8): the volume, the music's share, the mute; the engine loaded on demand (src/audio/Sound.ts) */
  async openSound(): Promise<void> {
    const snd = (await import('../audio/Sound')).sound();
    this.closeModal(); this.modal = true; this.prompt.classList.remove('on');
    const root = el('div', 'pm pm-overlay'), card = el('div', 'pm-card', `<h2 class="pm-h">${tx('v2.sound.title')}</h2><p class="pm-sub">${tx('v2.sound.sub')}</p>`);
    card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', tx('v2.sound.title'));
    const slider = (label: string, key: 'volume' | 'music') => {
      const p = el('p', '', `<label>${label}<br><input type="range" min="0" max="100" step="5" value="${Math.round(snd.settings[key] * 100)}" aria-label="${label}"></label>`);
      p.querySelector('input')!.addEventListener('input', (e) => snd.set({ [key]: +(e.target as HTMLInputElement).value / 100 }));
      card.appendChild(p);
    };
    slider(tx('v2.sound.volume'), 'volume'); slider(tx('v2.sound.music'), 'music');
    const mute = el('button', 'pm-btn', `<kbd>N</kbd>${snd.settings.muted ? tx('v2.sound.unmute') : tx('v2.sound.mute')}`);
    mute.addEventListener('click', () => { snd.set({ muted: !snd.settings.muted }); void this.openSound(); });
    card.appendChild(mute);
    const close = el('button', 'pm-btn', `<kbd>Esc</kbd>${tx('ui.close')}`); close.addEventListener('click', () => this.closeModal()); card.appendChild(close);
    root.appendChild(card); document.body.appendChild(root); this.current = root; close.focus();
  }

  private openMap(): void {
    const s = this.st, moves = actions(s).filter((o) => o.action.type === 'move');
    this.closeModal(); this.modal = true;
    const root = el('div', 'pm pm-overlay'), card = el('div', 'pm-card', `<h2 class="pm-h">${tx('ui.cite')}</h2><p class="pm-sub">${tx('ui.youAreIn', { place: esc(placeName(s.place, isV2(s))) })}</p>`);
    for (const o of moves) card.appendChild(this.optionButton(o));
    const close = el('button', 'pm-btn', `<kbd>Esc</kbd>${tx('ui.close')}`); close.addEventListener('click', () => this.closeModal()); card.appendChild(close);
    root.appendChild(card); document.body.appendChild(root); this.current = root;
    ((card.querySelector('.pm-btn:not(:disabled)') as HTMLButtonElement) ?? close).focus();
  }

  private openJournal(): void {
    const s = this.st, facts = s.log.filter((e) => e.visible).slice(-30).reverse();
    this.closeModal();
    void this.card(`<h2 class="pm-h">${tx('ui.journal')}</h2>${facts.map((e) => `<p><span class="pm-sub">${tx('ui.day', { day: e.day, slot: e.slot })}</span><br>${esc(e.text)}${e.kind === 'consequence' || e.kind === 'sign' ? `<br><span class="pm-sub why">${tx('ui.why', { cause: esc(e.cause) })}</span>` : ''}</p>`).join('')}`);
  }

  private openBoard(): void { this.closeModal(); void this.card(boardHtml(this.st, standings(this.st))); }

  private openMenu(): void {
    this.closeModal(); this.modal = true;
    const s = this.st, root = el('div', 'pm pm-overlay'), card = el('div', 'pm-card', `<h2 class="pm-h">${tx('ui.menu')}</h2><p class="pm-sub">${tx('ui.menu.saves')}</p>`);
    const add = (label: string, f: () => void) => { const b = el('button', 'pm-btn', esc(label)); b.addEventListener('click', f); card.appendChild(b); };
    add(tx('ui.menu.saveFile'), () => downloadSave(s));
    add(tx('ui.menu.loadFile'), () => {
      const i = el('input'); i.type = 'file'; i.accept = 'application/json,.json';
      i.addEventListener('change', async () => { const f = i.files?.[0]; if (!f) return; try { writeSave(await loadSaveFile(f)); this.host.reload(); } catch (e) { this.closeModal(); void this.card(`<p>${esc((e as Error).message)}</p>`); } });
      i.click();
    });
    add(tx('ui.menu.quit'), () => location.assign(location.pathname));
    add(tx('ui.menu.back'), () => this.closeModal());
    root.appendChild(card); document.body.appendChild(root); this.current = root;
    (card.querySelector('.pm-btn') as HTMLButtonElement).focus();
  }
}
