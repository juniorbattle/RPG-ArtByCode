import { actions, placeName, standings, dusk, type Action, type ActionOption, type GameEvent, type GameState } from '../simulation';
import { offeredBy } from '../simulation/roles';
import { PEOPLE, titleOf } from '../narrative/people';
import { linesOf } from '../narrative/dialogue';
import { RIVALS } from '../narrative/roster';
import { boardHtml, standingsHtml as standingsHtmlRows } from './board';
import { portraitUrl } from './portraits';
import { downloadSave, loadSaveFile, writeSave } from './save';
import { arrowKeys, el, esc, injectStyle, overlay } from './style';
import { skillName, tx } from '../narrative/text';
import { isV2, v2KitOf } from '../simulation/v2';
import { stageName, v2EndLine, v2Ranking } from '../tournament/v2calendar';
import { SKILL_BOOK, skillAction } from '../combat/skillbook';
import { chargeTime } from '../combat/skills';
import { itemAbout, itemName, weaponTier } from '../simulation/v2gear';
import { opponentOf, playerMatch } from '../tournament/pool';
import { FOE_SKILLS, V2_FOES } from '../combat/v2duel';

/** The play mode's interface in a place (journal Passes L4 / UM3; choice K1: English; direction A « Voile »): exploring, the state and one prompt,
 *  nothing else (UM-R2): the day and the slot top left (the clock and the next deadline, TOURNAMENT § 11), the figures top right, E next to someone at
 *  the foot of the screen. A list opened by Q holds what can be done here, what it costs in slots (GAMEPLAY § 4) and the people to talk to; the day's
 *  bout keeps its prompt in the corner. One menu on Esc (UM-R1) leads to the map, the journal, the tournament, the version 2's skills, gear and sound,
 *  and the saves; M, J, T, K, G and V stay. The person's words stand in a band at the foot of the screen. DOM over the scene, keyboard reachable. */

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

/** on a computer: the state top left and the figures top right on their veils, the prompt at the foot, the list's and the menu's keys in the corner, the
 *  dialogue a band at the foot of the screen (P4 in every game: the person's face, name and words on the left, the choices on the right, the scene
 *  kept whole above it); on a phone (L3; touch stays out of the slice, E30): one line of state, the two buttons along the foot, the band at half the screen */
const CSS = `
#pm-veil-l,#pm-veil-r{position:fixed;top:0;z-index:29;pointer-events:none}
#pm-veil-l{left:0;width:min(820px,100vw);height:250px;background:radial-gradient(120% 130% at 0 0,var(--ds-veil) 0,var(--ds-veil-soft) 56%,transparent 100%)}
#pm-veil-r{right:0;width:620px;height:230px;background:radial-gradient(100% 100% at 100% 0,var(--ds-veil) 0,var(--ds-veil-soft) 42%,transparent 100%)}
#pm-status{left:44px;top:32px;max-width:calc(100vw - 88px);pointer-events:none}
#pm-status .clock{font:400 var(--ds-fs-title-big)/1.1 var(--ds-title);color:var(--ds-ivory)}
#pm-status .clock span{font-size:var(--ds-fs-fig);color:var(--ds-muted)}
#pm-status .ticks{display:flex;gap:6px;margin:12px 0 10px}
#pm-status .ticks i{width:30px;height:2px;background:var(--ds-line)}
#pm-status .ticks i.on{background:var(--ds-ivory)}
#pm-status .ticks i.cur{height:3px;background:var(--ds-accent)}
#pm-status .next{margin-top:2px;font-size:var(--ds-fs-small);color:var(--ds-muted)}
#pm-figs{right:44px;top:36px;display:flex;gap:32px;align-items:baseline;pointer-events:none}
#pm-figs b{display:block;font:400 var(--ds-fs-fig)/1 var(--ds-title)}
#pm-figs small{display:block;margin-top:4px;font-size:var(--ds-fs-small)}
#pm-figs .hurt b,#pm-figs .hurt small{color:var(--ds-accent)}
#pm-prompt{left:50%;bottom:44px;transform:translateX(-50%);display:flex;align-items:center;gap:12px;padding:14px 60px;color:var(--ds-ivory);font-size:var(--ds-fs-label);background:var(--ds-grad-spot);opacity:0;transition:opacity .2s;pointer-events:none;white-space:nowrap}
#pm-prompt.on{opacity:1}
#pm-hints{right:30px;bottom:30px;display:flex;gap:28px;align-items:center;padding:12px 44px;background:var(--ds-grad-spot)}
#pm-hints .pm-btn{width:auto;gap:10px;padding:0;border-top:0;font-size:var(--ds-fs-body);white-space:nowrap}
#pm-toast{left:0;right:0;top:0;padding:16px clamp(16px,24vw,460px) 30px;text-align:center;background:linear-gradient(to bottom,var(--ds-veil-strong) 62%,transparent 100%);display:none;pointer-events:none}
#pm-toast.on{display:block}
#pm-toast p{margin:2px 0}
.pm-talk{left:0;right:0;bottom:0;z-index:40;padding:72px var(--ds-gutter) 40px;background:linear-gradient(to top,var(--ds-veil-strong) 0,var(--ds-veil) calc(100% - 72px),transparent 100%)}
.pm-dlg{display:grid;grid-template-columns:96px minmax(0,620px) minmax(300px,1fr);column-gap:28px;align-items:start;max-width:1620px;margin:0 auto}
.pm-dlg .port{line-height:0}
.pm-dlg img{display:block;width:96px;height:96px;image-rendering:pixelated}
.pm-dlg .who{grid-column:2;min-width:0}
.pm-dlg .pm-h{margin:0}
.pm-dlg .pm-h small{margin-left:12px;font:400 var(--ds-fs-body)/1 var(--ds-text);color:var(--ds-muted)}
.pm-dlg .opts{grid-column:3;grid-row:1;min-width:0;max-height:min(46vh,420px);overflow:auto;border-bottom:1px solid var(--ds-line)}
.pm-dlg .opts .pm-sub{margin:12px 0 6px}
.pm-dlg.here{grid-template-columns:minmax(0,716px) minmax(300px,1fr);column-gap:28px}
.pm-dlg.here .who{grid-column:1}
.pm-dlg.here .opts{grid-column:2}
body.pm-talking #pm-prompt,body.pm-talking #pm-hints,body.pm-talking #pm-toast,body.pm-full #pm-status,body.pm-full #pm-figs,body.pm-full #pm-prompt,body.pm-full #pm-hints,body.pm-full #pm-veil-l,body.pm-full #pm-veil-r{visibility:hidden}
.pm-port{line-height:0}
.pm-port img{image-rendering:pixelated}
.pm-card input[type=range]{accent-color:var(--ds-accent);width:min(320px,100%)}
.pm-result .pm-big{text-align:center}
.pm-foe{display:flex;gap:14px;align-items:flex-start;margin:6px 0}
.pm-overlay .pm-card.pm-sheet{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:48px;width:min(1120px,100%)}
@media (max-width:900px){.pm-overlay .pm-card.pm-sheet{grid-template-columns:minmax(0,1fr);gap:14px}}
.pm-menu .pm-btn kbd{order:2;margin-left:auto}
.pm-slots{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px;margin:14px 0}
.pm-slot{padding-top:8px;border-top:1px solid var(--ds-line);min-width:0}
.pm-slot b{display:block;margin-top:2px;font-weight:400;font-size:var(--ds-fs-label)}
.pm-slot.empty b{color:var(--ds-muted)}
@media (max-width:1100px){
  .pm-dlg,.pm-dlg.here{grid-template-columns:64px minmax(0,1fr);column-gap:14px}
  .pm-dlg.here .who{grid-column:1 / 3}
  .pm-dlg img{width:64px;height:64px}
  .pm-dlg .opts,.pm-dlg.here .opts{grid-column:1 / 3;grid-row:auto;margin-top:12px;max-height:min(38vh,320px)}
}
@media (max-width:900px){.pm-slots{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:700px){
  #pm-veil-l{width:100vw;height:112px;background:var(--ds-grad-t)}
  #pm-veil-r{display:none}
  #pm-status{left:14px;top:10px;max-width:calc(100vw - 150px)}
  #pm-status .clock{font-size:var(--ds-fs-title)}
  #pm-status .ticks,#pm-status .next{display:none}
  #pm-status .where{font-size:var(--ds-fs-small)}
  #pm-figs{right:14px;top:14px;gap:14px}
  #pm-hints{left:0;right:0;bottom:0;justify-content:space-between;padding:26px 16px 12px;background:var(--ds-grad-b)}
  #pm-prompt{bottom:64px;padding:12px 40px;font-size:var(--ds-fs-small)}
  #pm-toast{padding:12px 16px 26px}
  .pm-talk{padding:64px 18px 16px;background:linear-gradient(to top,var(--ds-veil-strong) 0,var(--ds-veil) calc(100% - 64px),transparent 100%)}
  .pm-dlg,.pm-dlg.here{grid-template-columns:64px minmax(0,1fr);grid-template-rows:auto minmax(96px,1fr);column-gap:12px;max-height:calc(52vh - 80px)}
  .pm-dlg .pm-h small{display:block;margin:2px 0 0}
  .pm-dlg .pm-line{margin-top:4px}
  .pm-dlg .opts,.pm-dlg.here .opts{margin-top:10px;max-height:none;min-height:0}
  .pm-dlg .opts>.pm-btn:last-child{position:sticky;bottom:0;background:var(--ds-veil-strong)}
  .pm-btn .why{display:none}
}
@media (max-height:480px) and (min-width:701px){
  #pm-veil-l{height:110px;width:min(620px,100vw)}
  #pm-veil-r{height:90px}
  #pm-status{left:14px;top:8px}
  #pm-status .clock{font-size:var(--ds-fs-title)}
  #pm-status .ticks,#pm-status .next{display:none}
  #pm-figs{right:14px;top:10px;gap:18px}
  #pm-hints{right:6px;bottom:4px;padding:8px 26px;gap:18px}
  #pm-prompt{bottom:44px;padding:10px 44px}
  .pm-talk{padding:36px 16px 10px;background:linear-gradient(to top,var(--ds-veil-strong) 0,var(--ds-veil) calc(100% - 36px),transparent 100%)}
  .pm-dlg,.pm-dlg.here{grid-template-columns:64px minmax(0,1fr) minmax(0,1fr);column-gap:14px}
  .pm-dlg.here{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
  .pm-dlg.here .who{grid-column:1}
  .pm-dlg.here .opts{grid-column:2}
  .pm-dlg img{width:64px;height:64px}
  .pm-dlg .opts{grid-column:3;grid-row:1;margin-top:0;max-height:calc(100vh - 60px)}
  .pm-dlg .pm-line{margin-top:4px}
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
  return o.coins ? o.label.replace(new RegExp(` \\(${o.coins} coins?: ([^)]*)\\)`), ' · $1') : o.label;
}

export class TownUi {
  private veils = [el('div', 'pm-veil'), el('div', 'pm-veil')];
  private status = el('div', 'pm');
  private figs = el('div', 'pm');
  private hints = el('div', 'pm');
  private hereKey = el('button', 'pm-btn');
  private prompt = el('div', 'pm');
  private toast = el('div', 'pm');
  private shut = false;
  /** a dialogue, the list, the map, the journal, the board or the menu is open: the scene's keys are ignored */
  get modal(): boolean { return this.shut; }
  set modal(on: boolean) { this.shut = on; if (!on) document.body.classList.remove('pm-talking', 'pm-full'); }
  private near: string | null = null;

  constructor(private host: UiHost, private seenSeq: number) {
    injectStyle();
    if (!document.getElementById('pm-town-css')) { const st = document.createElement('style'); st.id = 'pm-town-css'; st.textContent = CSS; document.head.appendChild(st); }
    this.veils[0].id = 'pm-veil-l'; this.veils[1].id = 'pm-veil-r';
    this.status.id = 'pm-status'; this.figs.id = 'pm-figs'; this.hints.id = 'pm-hints'; this.prompt.id = 'pm-prompt'; this.toast.id = 'pm-toast';
    this.status.setAttribute('aria-live', 'polite');
    const menu = el('button', 'pm-btn', `<kbd>Esc</kbd>${tx('ui.menu')}`);
    this.hereKey.addEventListener('click', () => this.openHere()); menu.addEventListener('click', () => this.openMenu());
    this.hints.append(this.hereKey, menu);
    document.body.append(...this.veils, this.status, this.figs, this.hints, this.prompt, this.toast);
    window.addEventListener('keydown', (e) => {
      if (e.repeat || (e.target instanceof HTMLInputElement)) return;
      const k = e.key.toLowerCase();
      if (k === 'n' && isV2(this.st)) { void import('../audio/Sound').then((m) => { const s = m.sound(); s.set({ muted: !s.settings.muted }); if (this.current?.querySelector('input[type=range]')) void this.openSound(); }); return; }
      if (this.modal) { if (k === 'escape' || (k === 'q' && this.current?.dataset.here)) this.closeModal(); return; }
      if (k === 'q') this.openHere(); else if (k === 'm') this.openMap(); else if (k === 'j') this.openJournal(); else if (k === 't') this.openBoard(); else if (k === 'escape') this.openMenu();
      else if (k === 'k' && isV2(this.st)) this.openSkills(false); else if (k === 'g' && isV2(this.st)) this.openGear(); else if (k === 'v' && isV2(this.st)) void this.openSound();
    });
    this.render();
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
    this.modal = true; document.body.classList.add('pm-full');
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

  /** the day's bout, open now: its prompt stays on screen, the action in the list */
  private boutNow(): boolean {
    const s = this.st;
    return (s.slot === 'afternoon' && s.tournament.matches.some((m) => m.day === s.day && !m.winner && (m.a === 'player' || m.b === 'player'))) || !!s.v2?.challenge;
  }

  render(): void {
    const s = this.st, P = s.player, v2 = isV2(s), m = s.tournament.matches.find((x) => x.day >= s.day && !x.winner && (x.a === 'player' || x.b === 'player'));
    const opp = m ? RIVALS[m.a === 'player' ? m.b : m.a] : null;
    const when = m && m.day === s.day ? (s.slot === 'afternoon' ? tx('ui.next.now') : tx('ui.next.today')) : '';
    // the version 2 (journal Passe VP1): the bout's stage, the ten days' end
    const next = v2 ? (s.over ? tx('v2.over') : opp ? tx('v2.next.bout', { stage: stageName(m!), name: opp.name, day: m!.day, when }) : tx('v2.next.done'))
      : s.over ? tx('ui.next.over') : opp ? tx('ui.next.bout', { name: opp.name, day: m!.day, when }) : tx('ui.next.done');
    const slotName = s.slot === 'evening' ? (dusk(s) ? tx('ui.slot.sunset') : 'evening') : s.slot, days = v2 ? 10 : 3;
    const place = placeName(s.place, v2).replace(/^the /, '');
    this.status.setAttribute('aria-label', v2 ? tx('ui.clockV2', { day: s.day, slot: slotName }) : tx('ui.clock', { day: s.day, slot: slotName }));
    this.status.innerHTML = `<div class="clock">${tx('ui.clockDay', { day: s.day })} <span>${tx('ui.clockOf', { days })}</span></div>
      <div class="ticks">${Array.from({ length: days }, (_, i) => `<i class="${i + 1 < s.day ? 'on' : i + 1 === s.day ? 'cur' : ''}"></i>`).join('')}</div>
      <div class="where">${esc(slotName[0].toUpperCase() + slotName.slice(1))} · ${esc(place)}</div><div class="next">${esc(next)}</div>`;
    this.figs.innerHTML = `<div><b>${P.coins}</b><small>${tx('ui.coins')}</small></div><div><b>${P.reputation}</b><small>${tx('ui.reputation')}</small></div>${P.injury ? `<div class="hurt"><b>${P.injury}</b><small>${P.injury > 1 ? tx('ui.badlyHurt') : tx('ui.hurt')}</small></div>` : ''}`;
    const bout = this.boutNow();
    this.hereKey.className = `pm-btn${bout ? ' primary' : ''}`;
    this.hereKey.innerHTML = `<kbd>Q</kbd>${bout ? (s.v2?.challenge ? tx('v2.challenge.enter') : tx('ui.enterArena')) : tx('ui.here')}`;
    if (this.current?.dataset.here) this.openHere();
  }

  /** the list on demand (UM-R2, Q): what can be done here and now, the rest and the wait, the people; a band at the foot of the screen, as a dialogue */
  openHere(): void {
    const s = this.st, v2 = isV2(s), all = actions(s);
    // the place's actions open now (the version 2, P5), every one with its reason in today's game; the people's are in their dialogues
    const opts = all.filter((o) => { const by = offeredBy(o.action as never); return o.action.type !== 'talk' && o.action.type !== 'move' && (by === null || by === 'forge') && (!v2 || o.ok || o.action.type === 'rest' || o.action.type === 'wait'); });
    const fight = s.slot === 'afternoon' && s.tournament.matches.some((m) => m.day === s.day && !m.winner && (m.a === 'player' || m.b === 'player'));
    const people = all.filter((o) => o.action.type === 'talk');
    this.closeModal(); this.modal = true; this.prompt.classList.remove('on');
    document.body.classList.add('pm-talking');
    const root = el('div', 'pm pm-talk'), card = el('div', 'pm-dlg here'), list = el('div', 'opts');
    root.dataset.here = '1';
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', tx('ui.here'));
    card.innerHTML = `<div class="who"><h2 class="pm-h">${esc(placeName(s.place, v2).replace(/^the /, ''))}</h2><div class="pm-sub">${esc(s.player.name)}${s.player.items.length ? ` · ${esc(s.player.items.map((i) => i.replace('-', ' ')).join(', '))}` : ''}</div></div>`;
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
    for (const o of opts) list.appendChild(this.optionButton(v2 && (o.action.type === 'rest' || o.action.type === 'wait') ? { ...o, label: o.action.type === 'rest' ? tx('v2.self.rest') : tx('v2.self.wait') } : o));
    if (people.length) {
      list.appendChild(el('p', 'pm-sub', tx('ui.peopleHere')));
      for (const o of people) {
        const who = (o.action as { who: string }).who, b = el('button', 'pm-btn', `<span>${esc(PEOPLE[who].name)}<span class="why">${o.ok ? esc(PEOPLE[who].title) : esc(o.reason ?? '')}</span></span>`);
        b.disabled = !o.ok; b.addEventListener('click', () => this.openPerson(who)); list.appendChild(b);
      }
    }
    const close = el('button', 'pm-btn', `<kbd>Q</kbd>${tx('ui.close')}`);
    close.addEventListener('click', () => this.closeModal());
    list.appendChild(close); arrowKeys(list);
    card.appendChild(list); root.appendChild(card);
    document.body.appendChild(root); this.current = root;
    ((list.querySelector('.pm-btn:not(:disabled)') as HTMLButtonElement | null) ?? close).focus();
  }

  private optionButton(o: ActionOption, after?: () => void): HTMLButtonElement {
    const b = el('button', 'pm-btn', `<span>${esc(shortLabel(o))}${o.ok ? '' : `<span class="why">${esc(o.reason ?? '')}</span>`}</span>${costTag(o)}`);
    b.disabled = !o.ok;
    b.addEventListener('click', () => { this.run(o.action); after?.(); });
    return b;
  }

  /** applies an action: a reload for a new slot or place, otherwise the panels and the news */
  run(a: Action): void {
    const r = this.host.act(a);
    if (!r.ok) { void this.card(`<p>${esc(r.reason ?? tx('ui.cannot'))}</p>`, tx('ui.close'), true); return; }
    if (r.reload) { this.closeModal(); this.host.reload(); return; }
    this.render();
    // the dialogue that opens says who it is: « You meet Mara » stays in the journal, not on the screen (journal Passe UM1)
    const news = (r.events ?? []).filter((e) => e.visible && e.id !== 'meet');
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
    void this.card(`<h2 class="pm-h">${news.length > 1 ? tx('ui.meanwhile') : tx('ui.news')}</h2>${news.slice(-8).map((e) => `<p>${esc(e.text)}</p>`).join('')}`, tx('ui.goOn'), true);
  }

  /** `band`: what is read in passing, at the foot of the screen; else a page on the full-screen veil */
  private async card(html: string, ok = tx('ui.close'), band = false): Promise<string> {
    this.modal = true; this.prompt.classList.remove('on');
    if (!band) document.body.classList.add('pm-full');
    const o = overlay(html, [{ id: 'ok', label: ok, primary: true }], band);
    this.current = o.root;
    const r = await o.done;
    this.modal = false; this.current = null;
    return r;
  }
  private current: HTMLElement | null = null;
  private closeModal(): void { if (this.current) { this.current.remove(); this.current = null; } document.body.classList.remove('pm-talking'); if (this.modal) this.host.focus?.(null); this.modal = false; }

  openPerson(who: string): void {
    const s = this.st, p = PEOPLE[who];
    if (!p) return;
    const talk = actions(s).find((o) => o.action.type === 'talk' && (o.action as { who: string }).who === who);
    if (!talk?.ok) { void this.card(`<p>${esc(talk?.reason ?? `${p.name} is not here.`)}</p>`, tx('ui.close'), true); return; }
    this.run({ type: 'talk', who });
    const st = this.st, lines = linesOf(st, who), url = portraitUrl(who);
    const opts = actions(st).filter((o) => offeredBy(o.action as never) === who && !(o.action.type === 'scout' && (o.action as { who: string }).who !== who));
    this.closeModal();
    this.modal = true; this.prompt.classList.remove('on');
    // P4 (journal Passe UM1: every game): the dialogue at the foot of the screen, the scene kept visible (the version 2 turns it to the speaker)
    const root = el('div', 'pm pm-talk'), card = el('div', 'pm-dlg');
    if (isV2(st)) this.host.focus?.(who);
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', p.name);
    card.innerHTML = `${url ? `<span class="port"><img src="${url}" alt=""></span>` : ''}<div class="who"><h2 class="pm-h">${esc(p.name)}<small>${esc(titleOf(p, isV2(this.st)))}</small></h2><div class="pm-line">${lines.map((l) => `<q>${esc(l)}</q>`).join('')}</div></div>`;
    const list = el('div', 'opts');
    for (const o of opts) list.appendChild(this.optionButton(o, () => { if (this.current === root) this.openPerson(who); }));
    const leave = el('button', 'pm-btn', `<kbd>Esc</kbd>${tx('ui.leave')}`);
    leave.addEventListener('click', () => this.closeModal());
    list.appendChild(leave);
    arrowKeys(list);
    card.appendChild(list);
    root.appendChild(card);
    document.body.appendChild(root);
    document.body.classList.add('pm-talking');
    this.current = root;
    ((list.querySelector('.pm-btn:not(:disabled)') as HTMLButtonElement | null) ?? leave).focus();
  }

  /** the version 2's skills (lot V2): each owned skill with its level, its charge time, its AP and family; four chosen (the match sheet's
   *  preparation, CB-1 § 8); `enter`: the bout follows (the four applied, then the arena) */
  openSkills(enter: boolean): void {
    const s = this.st, kit = v2KitOf(s) as { loadout: string[]; levels: Record<string, number> }, chosen = new Set<string>(kit.loadout);
    this.page();
    const root = el('div', 'pm pm-overlay'), card = el('div', `pm-card${enter ? ' pm-sheet' : ''}`), list = enter ? el('div', 'pm-sk') : card;
    list.innerHTML = `<h2 class="pm-h">${tx('v2.skills.title')}</h2>${enter ? '' : `<p class="pm-sub">${tx('v2.skills.sub')}</p>`}`;
    card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', tx('v2.skills.title'));
    const go = el('button', 'pm-btn primary', `<span>${enter ? tx('v2.skills.keep') : tx('ui.close')}</span>`);
    const sync = () => { go.disabled = enter && chosen.size !== 4; };
    for (const id of Object.keys(kit.levels).filter((k) => kit.levels[k] > 0)) {
      const lv = kit.levels[id], fam = SKILL_BOOK[id]?.family ?? 'offensive', ap = skillAction(id).apCost ?? 0;
      const b = el('button', 'pm-btn', `<span>${esc(skillName(id))}<span class="why">${tx('v2.skills.level', { level: lv })} · ${tx(fam === 'offensive' ? 'v2.family.offensive' : fam === 'defensive' ? 'v2.family.defensive' : 'v2.family.support')} · ${tx('v2.skills.charge', { charge: chargeTime(id, lv) })}</span></span><span class="cost">${tx('v2.skills.ap', { ap })}</span>`);
      b.setAttribute('aria-pressed', String(chosen.has(id)));
      b.addEventListener('click', () => {
        if (chosen.has(id)) chosen.delete(id); else if (chosen.size < 4) chosen.add(id);
        b.setAttribute('aria-pressed', String(chosen.has(id))); sync();
      });
      list.appendChild(b);
    }
    if (enter) list.appendChild(el('p', 'pm-sub', tx('v2.skills.pick')));
    // P6 (lot V9): the match sheet, the opponent first
    if (enter) { card.appendChild(el('div', 'pm-foe-side', this.matchSheetHtml(s))); card.appendChild(list); }
    go.addEventListener('click', () => {
      const four = kit.loadout.filter((x) => chosen.has(x)).concat([...chosen].filter((x) => !kit.loadout.includes(x)));
      if (chosen.size === 4 && four.join() !== kit.loadout.join()) this.host.act({ type: 'setLoadout', skills: four });
      if (!enter) { this.closeModal(); return; }
      writeSave(this.st); this.closeModal(); this.host.reload({ scene: 'arena' });
    });
    list.appendChild(go); sync(); arrowKeys(card);
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
    return `<p class="pm-sub">${esc(stage)}</p><div class="pm-foe">${url ? `<span class="pm-port"><img src="${url}" alt="" width="64" height="64"></span>` : ''}<div><h2 class="pm-h">${esc(r.name)}</h2><p class="pm-sub">${esc(r.epithet)}</p></div></div><p>${esc(r.bio)}</p>`
      + `<p class="pm-sub">${esc(intel)}</p><p class="pm-sub">${esc(gear)}</p>${s.facts.includes('orla-recruited') ? `<p class="pm-sub">${tx('v2.sheet.ally')}</p>` : ''}`;
  }

  /** the version 2's gear (lot V3): the four slots side by side (the weapon and its tier, the armour, both accessories), and the bag (each owned piece
   *  worn by a click) */
  openGear(): void {
    const s = this.st, g = s.v2?.gear;
    if (!g) return;
    this.page();
    const slot = (label: string, id: string | null, extra = '') => `<div class="pm-slot${id ? '' : ' empty'}"><span class="pm-sub">${label}</span><b>${id ? `${esc(itemName(id))}${extra}` : '—'}</b>${id ? `<span class="pm-sub">${esc(itemAbout(id))}</span>` : ''}</div>`;
    const root = el('div', 'pm pm-overlay'), card = el('div', 'pm-card', `<h2 class="pm-h">${tx('v2.gear.title')}</h2><div class="pm-slots">${slot(tx('v2.gear.weapon'), g.weapon, ` · ${tx('v2.gear.tier', { tier: weaponTier(s) })}`)}${slot(tx('v2.gear.armour'), g.armour)}${slot(tx('v2.gear.acc'), g.acc[0])}${slot(tx('v2.gear.acc'), g.acc[1])}</div>`);
    card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', tx('v2.gear.title'));
    if (g.bag.length) card.appendChild(el('p', 'pm-sub', tx('v2.gear.bag')));
    for (const id of g.bag) {
      const b = el('button', 'pm-btn', `<span>${esc(tx('v2.equip.label', { item: itemName(id) }))}<span class="why">${esc(itemAbout(id))}</span></span>${costTag({ cost: 0, coins: 0 })}`);
      b.addEventListener('click', () => { this.run({ type: 'equip', item: id }); this.openGear(); });
      card.appendChild(b);
    }
    const close = el('button', 'pm-btn', `<kbd>Esc</kbd>${tx('ui.close')}`); close.addEventListener('click', () => this.closeModal()); card.appendChild(close);
    arrowKeys(card);
    root.appendChild(card); document.body.appendChild(root); this.current = root; close.focus();
  }

  /** the version 2's sound (lot V8): the volume, the music's share, the mute; the engine loaded on demand (src/audio/Sound.ts) */
  async openSound(): Promise<void> {
    const snd = (await import('../audio/Sound')).sound();
    this.page();
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
    this.page();
    const root = el('div', 'pm pm-overlay'), card = el('div', 'pm-card', `<h2 class="pm-h">${tx('ui.cite')}</h2><p class="pm-sub">${tx('ui.youAreIn', { place: esc(placeName(s.place, isV2(s))) })}</p>`);
    // the sheet says walking is free: no tag on each line (the audit of journal Passe UM1)
    for (const o of moves) { const b = this.optionButton(o); b.querySelector('.cost.free')?.remove(); card.appendChild(b); }
    const close = el('button', 'pm-btn', `<kbd>Esc</kbd>${tx('ui.close')}`); close.addEventListener('click', () => this.closeModal()); card.appendChild(close);
    arrowKeys(card);
    root.appendChild(card); document.body.appendChild(root); this.current = root;
    ((card.querySelector('.pm-btn:not(:disabled)') as HTMLButtonElement) ?? close).focus();
  }

  private openJournal(): void {
    const s = this.st, facts = s.log.filter((e) => e.visible).slice(-30).reverse();
    this.closeModal();
    void this.card(`<h2 class="pm-h">${tx('ui.journal')}</h2>${facts.map((e) => `<p><span class="pm-sub">${tx('ui.day', { day: e.day, slot: e.slot })}</span><br>${esc(e.text)}${e.kind === 'consequence' || e.kind === 'sign' ? `<br><span class="pm-sub why">${tx('ui.why', { cause: esc(e.cause) })}</span>` : ''}</p>`).join('')}`);
  }

  private openBoard(): void { this.closeModal(); void this.card(boardHtml(this.st, standings(this.st))); }

  /** a page on the full-screen veil takes the place of what was open */
  private page(): void { this.closeModal(); this.modal = true; this.prompt.classList.remove('on'); document.body.classList.add('pm-full'); }

  /** the one menu (UM-R1): every page with its key, then the saves */
  private openMenu(): void {
    this.page();
    const s = this.st, root = el('div', 'pm pm-overlay'), card = el('div', 'pm-card pm-menu', `<h2 class="pm-h">${tx('ui.menu')}</h2>`);
    const add = (label: string, f: () => void, key = '') => { const b = el('button', 'pm-btn', `<span>${esc(label)}</span>${key ? `<kbd>${key}</kbd>` : ''}`); b.addEventListener('click', f); card.appendChild(b); };
    add(tx('ui.map'), () => this.openMap(), 'M'); add(tx('ui.journal'), () => this.openJournal(), 'J'); add(tx('ui.tournament'), () => this.openBoard(), 'T');
    if (isV2(s)) { add(tx('v2.skills.view'), () => this.openSkills(false), 'K'); add(tx('v2.gear.view'), () => this.openGear(), 'G'); add(tx('v2.sound.view'), () => void this.openSound(), 'V'); }
    card.appendChild(el('p', 'pm-sub pm-gap', tx('ui.menu.saves')));
    add(tx('ui.menu.saveFile'), () => downloadSave(s));
    add(tx('ui.menu.loadFile'), () => {
      const i = el('input'); i.type = 'file'; i.accept = 'application/json,.json';
      i.addEventListener('change', async () => { const f = i.files?.[0]; if (!f) return; try { writeSave(await loadSaveFile(f)); this.host.reload(); } catch (e) { this.closeModal(); void this.card(`<p>${esc((e as Error).message)}</p>`); } });
      i.click();
    });
    add(tx('ui.menu.quit'), () => location.assign(location.pathname));
    add(tx('ui.menu.back'), () => this.closeModal(), 'Esc');
    arrowKeys(card);
    root.appendChild(card); document.body.appendChild(root); this.current = root;
    (card.querySelector('.pm-btn') as HTMLButtonElement).focus();
  }
}
