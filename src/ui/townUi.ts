import { actions, placeName, standings, dusk, type Action, type ActionOption, type GameEvent, type GameState } from '../simulation';
import { offeredBy } from '../simulation/roles';
import { PEOPLE } from '../narrative/people';
import { linesOf } from '../narrative/dialogue';
import { RIVALS } from '../narrative/roster';
import { boardHtml, standingsHtml as standingsHtmlRows } from './board';
import { portraitUrl } from './portraits';
import { downloadSave, loadSaveFile, writeSave } from './save';
import { el, esc, injectStyle, overlay } from './style';

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
}

const CSS = `
#pm-status{left:12px;top:12px;width:min(330px,calc(100vw - 24px));padding:10px 13px}
#pm-status .clock{font-size:15px;letter-spacing:.28em;text-transform:uppercase;color:#f1d9a0}
#pm-status .next{margin-top:5px;font-size:12px;color:#e9c890}
#pm-bar{right:12px;top:12px;display:flex;gap:5px}
#pm-bar .pm-btn{width:auto;margin:0;padding:6px 9px;font-size:12px}
#pm-here{right:12px;top:56px;width:min(320px,calc(100vw - 24px));max-height:calc(100vh - 140px);overflow:auto;padding:10px 12px}
#pm-here.min .list{display:none}
.pm-btn .cost+.cost{margin-left:0}
#pm-prompt{left:50%;bottom:24px;transform:translateX(-50%);padding:7px 16px;border-radius:20px;background:rgba(8,12,22,.82);border:1px solid rgba(233,166,76,.5);color:#f6e7c4;font-size:13px;opacity:0;transition:opacity .2s;pointer-events:none;white-space:nowrap}
#pm-prompt.on{opacity:1}
#pm-toast{left:50%;top:12px;transform:translateX(-50%);width:min(520px,calc(100vw - 24px));padding:10px 14px;display:none}
#pm-toast.on{display:block}
.pm-dlg{display:flex;gap:14px;align-items:flex-start}
.pm-dlg img{width:84px;height:84px;flex:none;image-rendering:pixelated;border:2px solid #0a0d16;box-shadow:0 0 0 1px rgba(233,166,76,.55);background:linear-gradient(#24304c,#0b1020)}
.pm-dlg q{display:block;margin:4px 0;quotes:none;color:#efe3c4}
@media (max-width:700px){#pm-status{width:calc(100vw - 24px)}#pm-bar{top:auto;bottom:12px;right:12px;left:12px;justify-content:space-between}#pm-here{top:auto;bottom:56px;left:12px;right:12px;width:auto;max-height:38vh}#pm-prompt{bottom:auto;top:46%}.pm-dlg img{width:56px;height:56px}}
@media (max-height:480px){#pm-status{padding:6px 10px;width:300px}#pm-status .next{display:none}#pm-here{max-height:calc(100vh - 110px);top:48px;bottom:auto;width:300px;left:auto}#pm-bar{top:8px;bottom:auto;left:auto}}
`;

/** what an action takes, one tag per currency (the operator's decision P2, journal Passes UI1 / UI2): its coins (from the simulation, not
 *  the label), its slot; « free » only when it takes neither */
export function costTag(o: Pick<ActionOption, 'cost' | 'coins'>): string {
  const tags = [o.coins ? `${o.coins} coin${o.coins === 1 ? '' : 's'}` : '', o.cost ? '1 slot' : ''].filter(Boolean);
  return tags.length ? tags.map((t) => `<span class="cost">${t}</span>`).join('') : '<span class="cost free">free</span>';
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
    for (const [k, label, f] of [['M', 'Map', () => this.openMap()], ['J', 'Journal', () => this.openJournal()], ['T', 'Tournament', () => this.openBoard()], ['Esc', 'Menu', () => this.openMenu()]] as const) {
      const b = el('button', 'pm-btn', `<kbd>${k}</kbd>${label}`); b.addEventListener('click', f); this.bar.appendChild(b);
    }
    window.addEventListener('keydown', (e) => {
      if (e.repeat || (e.target instanceof HTMLInputElement)) return;
      const k = e.key.toLowerCase();
      if (this.modal) { if (k === 'escape') this.closeModal(); return; }
      if (k === 'm') this.openMap(); else if (k === 'j') this.openJournal(); else if (k === 't') this.openBoard(); else if (k === 'escape') this.openMenu();
    });
    this.render();
    // a phone's screen keeps the scene: the list opens from its title
    if (window.innerWidth < 700) this.here.classList.add('min');
    if (this.st.over) void this.showEnd(); else this.showNews();
  }

  /** the end of the slice: the pool after its second round, what the player's choices left in the Cité, what comes next */
  private async showEnd(): Promise<void> {
    const s = this.st, rows = standings(s), rank = rows.findIndex((r) => r.id === 'player') + 1, wins = s.tournament.matches.filter((m) => m.winner === 'player').length;
    const told: string[] = [];
    told.push(`${esc(s.player.name)} ends the pool's two rounds ${rank === 1 ? 'at its head' : `in ${rank}${rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th'} place`}: ${wins} win${wins === 1 ? '' : 's'}, ${s.tournament.points.player} points.`);
    told.push(s.facts.includes('saboteur-caught') ? 'Bram\'s forge stands, and Cassius Dree was caught paying for its ruin.'
      : s.facts.includes('forge-burned') ? (s.flags.reported ? 'The forge burned, but you named Cassius Dree to the watch.' : s.services.forge === 'repaired' ? 'The forge burned, and you helped Bram rebuild it.' : 'The forge burned. Who paid for it is still a whisper in the night.')
        : 'Nobody dared touch Bram\'s forge.');
    if (s.facts.includes('orla-recruitable')) told.push('Orla Brask will stand with you when the pool turns to teams.');
    else if (s.facts.includes('orla-introduced')) told.push('Orla Brask is looking for comrades for the team bouts to come.');
    told.push(rank <= 4 ? 'The best four go on to the transition phase: trials, and the first allies.' : 'Only the best four go on; the others will look for a team, or for revenge.');
    this.modal = true;
    const o = overlay(`<p class="pm-big">End of the slice</p><p class="pm-sub" style="text-align:center">Day 3 is over · to be continued</p>${told.map((t) => `<p>${t}</p>`).join('')}<p class="pm-sub">The pool</p>${standingsHtmlRows(s, rows)}`,
      [{ id: 'stay', label: 'Keep walking the district', primary: true }, { id: 'title', label: 'Back to the title screen' }]);
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
      this.prompt.innerHTML = p ? `<kbd style="padding:0 5px;margin-right:6px;color:#05070d;background:#d9c9a8;border-radius:2px">E</kbd>Talk to ${esc(p.name)}, ${esc(p.title)}` : '';
      this.prompt.classList.toggle('on', !!p && !this.modal);
    }
  }

  /** E (or Space) in the scene */
  interact(): void { if (!this.modal && this.near) this.openPerson(this.near); }

  render(): void {
    const s = this.st, P = s.player, m = s.tournament.matches.find((x) => x.day >= s.day && !x.winner && (x.a === 'player' || x.b === 'player'));
    const opp = m ? RIVALS[m.a === 'player' ? m.b : m.a] : null;
    const next = s.over ? 'The slice is over: to be continued.' : opp ? `Next bout: ${opp.name}, day ${m!.day} afternoon${m!.day === s.day ? (s.slot === 'afternoon' ? ' — now' : ' — today') : ''}` : 'Your bouts of the pool are fought.';
    const slotName = s.slot === 'evening' ? (dusk(s) ? 'evening · sunset' : 'evening') : s.slot;
    this.status.innerHTML = `<div class="clock">Day ${s.day} / 3 · ${slotName}</div><div class="pm-sub">${esc(P.name)} · ${esc(placeName(s.place))}</div>
      <div style="margin-top:4px">${P.coins} coins · reputation ${P.reputation} · ${P.injury ? `<span style="color:#e9a64c">${P.injury > 1 ? 'badly hurt' : 'hurt'}</span>` : 'fit'}${P.items.length ? ` · ${esc(P.items.map((i) => i.replace('-', ' ')).join(', '))}` : ''}</div>
      <div class="next">${esc(next)}</div>`;
    this.renderHere();
  }

  /** what to do here: the player's own actions and the place's (the people's are in their dialogues) */
  private renderHere(): void {
    const s = this.st, opts = actions(s).filter((o) => { const by = offeredBy(o.action as never); return o.action.type !== 'talk' && o.action.type !== 'move' && (by === null || by === 'forge'); });
    const fight = s.slot === 'afternoon' && s.tournament.matches.some((m) => m.day === s.day && !m.winner && (m.a === 'player' || m.b === 'player'));
    const people = actions(s).filter((o) => o.action.type === 'talk');
    this.here.innerHTML = `<h2 class="pm-h" style="cursor:pointer" tabindex="0" title="Show / hide">Here</h2><div class="list"></div>`;
    const list = this.here.querySelector('.list')!, h = this.here.querySelector('h2')!;
    h.addEventListener('click', () => this.here.classList.toggle('min'));
    if (fight) {
      const b = el('button', 'pm-btn primary', `<span>Enter the arena for your bout</span><span class="cost">1 slot</span>`);
      b.addEventListener('click', () => { writeSave(s); this.host.reload({ scene: 'arena' }); }); list.appendChild(b);
    }
    for (const o of opts) list.appendChild(this.optionButton(o));
    if (people.length) {
      list.appendChild(el('p', 'pm-sub', 'People here'));
      for (const o of people) {
        const who = (o.action as { who: string }).who, b = el('button', 'pm-btn', `<span>${esc(PEOPLE[who].name)}<span class="why" style="color:#9aa3b8">${o.ok ? esc(PEOPLE[who].title) : esc(o.reason ?? '')}</span></span>`);
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
    if (!r.ok) { void this.card(`<p>${esc(r.reason ?? 'You cannot do that.')}</p>`); return; }
    if (r.reload) { this.closeModal(); this.host.reload(); return; }
    this.render();
    const news = (r.events ?? []).filter((e) => e.visible);
    if (news.length) this.flash(news.map((e) => e.text));
  }

  private flash(lines: string[]): void {
    this.toast.innerHTML = lines.map((x) => `<p style="margin:3px 0">${esc(x)}</p>`).join('');
    this.toast.classList.add('on');
    clearTimeout((this.toast as any).t);
    (this.toast as any).t = setTimeout(() => this.toast.classList.remove('on'), 6500);
  }

  /** what happened since the player last looked (the slot that ended, the bouts, the night) */
  private showNews(): void {
    const news = this.st.log.filter((e) => e.visible && e.seq > this.seenSeq);
    if (!news.length) return;
    void this.card(`<h2 class="pm-h">${news.length > 1 ? 'Meanwhile in the Cité' : 'News'}</h2>${news.slice(-8).map((e) => `<p>${esc(e.text)}</p>`).join('')}`, 'Go on');
  }

  private async card(html: string, ok = 'Close'): Promise<string> {
    this.modal = true; this.prompt.classList.remove('on');
    const o = overlay(html, [{ id: 'ok', label: ok, primary: true }]);
    this.current = o.root;
    const r = await o.done;
    this.modal = false; this.current = null;
    return r;
  }
  private current: HTMLElement | null = null;
  private closeModal(): void { if (this.current) { this.current.remove(); this.current = null; } this.modal = false; }

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
    const root = el('div', 'pm pm-overlay'), card = el('div', 'pm-card');
    card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', p.name);
    card.innerHTML = `<div class="pm-dlg">${url ? `<img src="${url}" alt="">` : ''}<div><h2 class="pm-h">${esc(p.name)}</h2><p class="pm-sub">${esc(p.title)}</p>${lines.map((l) => `<q>${esc(l)}</q>`).join('')}</div></div>`;
    for (const o of opts) card.appendChild(this.optionButton(o, () => { if (this.current === root) this.openPerson(who); }));
    const leave = el('button', 'pm-btn', '<kbd>Esc</kbd>Leave');
    leave.addEventListener('click', () => this.closeModal());
    card.appendChild(leave);
    root.appendChild(card);
    document.body.appendChild(root);
    this.current = root;
    ((card.querySelector('.pm-btn:not(:disabled)') as HTMLButtonElement | null) ?? leave).focus();
  }

  private openMap(): void {
    const s = this.st, moves = actions(s).filter((o) => o.action.type === 'move');
    this.closeModal(); this.modal = true;
    const root = el('div', 'pm pm-overlay'), card = el('div', 'pm-card', `<h2 class="pm-h">The Cité</h2><p class="pm-sub">You are in ${esc(placeName(s.place))}. Walking between places takes no time.</p>`);
    for (const o of moves) card.appendChild(this.optionButton(o));
    const close = el('button', 'pm-btn', '<kbd>Esc</kbd>Close'); close.addEventListener('click', () => this.closeModal()); card.appendChild(close);
    root.appendChild(card); document.body.appendChild(root); this.current = root;
    ((card.querySelector('.pm-btn:not(:disabled)') as HTMLButtonElement) ?? close).focus();
  }

  private openJournal(): void {
    const s = this.st, facts = s.log.filter((e) => e.visible).slice(-30).reverse();
    this.closeModal();
    void this.card(`<h2 class="pm-h">Journal</h2>${facts.map((e) => `<p><span class="pm-sub">Day ${e.day} · ${e.slot}</span><br>${esc(e.text)}${e.kind === 'consequence' || e.kind === 'sign' ? `<br><span class="pm-sub" style="text-transform:none;letter-spacing:.02em">Why: ${esc(e.cause)}</span>` : ''}</p>`).join('')}`);
  }

  private openBoard(): void { this.closeModal(); void this.card(boardHtml(this.st, standings(this.st))); }

  private openMenu(): void {
    this.closeModal(); this.modal = true;
    const s = this.st, root = el('div', 'pm pm-overlay'), card = el('div', 'pm-card', `<h2 class="pm-h">Menu</h2><p class="pm-sub">The game saves itself after every action.</p>`);
    const add = (label: string, f: () => void) => { const b = el('button', 'pm-btn', esc(label)); b.addEventListener('click', f); card.appendChild(b); };
    add('Save to a file', () => downloadSave(s));
    add('Load a save file', () => {
      const i = el('input'); i.type = 'file'; i.accept = 'application/json,.json';
      i.addEventListener('change', async () => { const f = i.files?.[0]; if (!f) return; try { writeSave(await loadSaveFile(f)); this.host.reload(); } catch (e) { this.closeModal(); void this.card(`<p>${esc((e as Error).message)}</p>`); } });
      i.click();
    });
    add('Quit to the title screen', () => location.assign(location.pathname));
    add('Back to the game', () => this.closeModal());
    root.appendChild(card); document.body.appendChild(root); this.current = root;
    (card.querySelector('.pm-btn') as HTMLButtonElement).focus();
  }
}
