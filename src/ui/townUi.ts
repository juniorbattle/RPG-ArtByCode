import { actions, placeName, standings, dusk, type Action, type ActionOption, type GameEvent, type GameState } from '../simulation';
import { offeredBy, scoutable } from '../simulation/roles';
import { heardLine, strapCut } from '../simulation/v2intel';
import { sandRefusal } from '../simulation/v2rivals';
import { watchPost } from '../simulation/v2watch';
import { PEOPLE, titleOf } from '../narrative/people';
import { linesOf } from '../narrative/dialogue';
import { RIVALS } from '../narrative/roster';
import { boardPage, standingsHtml as standingsHtmlRows } from './board';
import { journalPage } from './journal';
import { portraitUrl, portraitsReady } from './portraits';
import { downloadSave, loadSaveFile, writeSave } from './save';
import { arrowKeys, el, esc, footBtn, footOf, injectStyle, overlay, pageShell, scrollFade } from './style';
import { newsLines } from './news';
import { ENCOUNTERS, encounterOf } from '../simulation/v2encounter';
import { NPC_FIGHTERS } from '../narrative/npcFighters';
import { QUEST } from '../simulation/v2questData';
import { skillsPage } from './skills';
import { cap, itemText, lang, num, said, shortName, skillName, tx, word, type TextKey, type TextRef } from '../narrative/text';
import { groupHere } from './listModel';
import { isV2 } from '../simulation/v2';
import { pendingFinal, stageName, v2EndLine, v2Ranking } from '../tournament/v2calendar';
import { healthParts, itemName, weaponTier } from '../simulation/v2gear';
import { duelStats } from '../simulation/preview';
import { VIGOUR_HP, hitFactor } from '../combat/stats';
import { marksOf } from '../simulation/v2law';
import { peopleMarks } from '../simulation/v2marks';
import { MARK_WORD, installMarkCss, markGlyph } from './npcMarks';
import { opponentOf, playerMatch } from '../tournament/pool';
import { FOE_SKILLS, V2_FOES } from '../combat/v2duel';
import { matchSheetFor } from '../combat/match';
import { autoBoutOf, autoForms, autoNextBout, autoReactions, type NextBout } from '../combat/autoMatch';
import { GENERICS } from '../narrative/generics';
import { CAUGHT_LOST, SEIZE, STAKE } from '../simulation/v2town';
import { PASSERS } from '../simulation/v2barter';
import { challengeSkill, levelOf } from '../simulation/v2skills';
import { AUTO_RULES, type AutoAction, type AutoFighter } from '../combat/auto';
import { AUTO_STYLES, autoResistsOf, autoStatesOf } from '../combat/autoData';
import { roleName } from './skills';
import { bare, costTag, isGoods, isWare, shortLabel, waresPage } from './wares';
import { gearPage } from './gearPage';
import { tabTo } from '../input/pad';
import { guidePage, hintChapter, hintSeen, markHint, markTold, runTour, showHint, told, TOUR, type HintId } from './tutorial';
import { settingsPage, type SettingsSection } from './settings';
import { TodoCue } from './todo';
import { actsOf, onSettings } from '../settings/settings';
import type { Act } from '../settings/keys';
import { bindCap, keyCap } from '../input/caps';
import { leavePage } from './curtain';
import { notebookPage, adviceText } from './notebook';
import { hasFought, resistListText, scoutLines, scoutTier, stateListText, styleText } from '../simulation/v2scout';
import { rehearsalFresh, rehearsalOf } from '../simulation/v2prep';
import { notesOf } from '../simulation/v2notes';

/** the menu's pages a gamepad's shoulders walk through (journal Passe MN2, MN-4) */
type MenuPage = 'map' | 'journal' | 'board' | 'notebook' | 'skills' | 'gear' | 'settings';

/** The play mode's interface in a place (journal Passes L4 / UM3; choice K1: English; direction A « Voile »): exploring, the state and one prompt,
 *  nothing else (UM-R2): the day and the slot top left (the clock and the next deadline, TOURNAMENT § 11), the figures top right, E next to someone at
 *  the foot of the screen. A list opened by Q holds what can be done here, what it costs in slots (GAMEPLAY § 4) and the people to talk to; the day's
 *  bout keeps its prompt in the corner. One menu on Esc (UM-R1) leads to the map, the journal, the tournament, the version 2's skills, gear and sound,
 *  and the saves; M, J, T, K, G and V stay. The person's words stand in a band at the foot of the screen. DOM over the scene, keyboard reachable. */

export interface ActResult { ok: boolean; reason?: string; $reason?: TextRef; events?: GameEvent[]; reload?: boolean }
export interface UiHost {
  state(): GameState;
  act(a: Action): ActResult;
  /** the page must reload (another slot's look, another place): the state is saved already */
  reload(extra?: Record<string, string>): void;
  /** the person standing next to the player in the scene, if any (the district's actors) */
  nearby?(): string | null;
  /** the version 2's squares (P4, lot V9): the camera turns to the person spoken to (null: back to the hero) */
  focus?(who: string | null): void;
  /** the live scene as an image, for the guide (journal Passe TU1) */
  snapshot?(): string | null;
  /** the tutorial's tour and hints on this page (journal Passe TU3: off in a browser driven by a tool unless the address asks for them) */
  tutorial?: boolean;
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
#pm-prompt{left:50%;bottom:44px;transform:translate(-50%,8px);display:flex;align-items:center;gap:12px;padding:14px 60px;color:var(--ds-ivory);font-size:var(--ds-fs-label);background:var(--ds-grad-spot);opacity:0;transition:opacity .16s,transform .16s;pointer-events:none;white-space:nowrap}
#pm-prompt.on{opacity:1;transform:translate(-50%,0)}
#pm-hints{right:30px;bottom:30px;display:flex;gap:28px;align-items:center;padding:12px 44px;background:var(--ds-grad-spot)}
#pm-hints .pm-btn{width:auto;gap:10px;padding:0;border-top:0;font-size:var(--ds-fs-body);white-space:nowrap}
#pm-hints .pm-btn::before{display:none}
#pm-status .ticks i{transform-origin:left center;animation:ds-rule .24s ease-out backwards}
#pm-toast{left:0;right:0;top:0;padding:16px clamp(16px,24vw,460px) 30px;text-align:center;background:linear-gradient(to bottom,var(--ds-veil-strong) 62%,transparent 100%);display:none;pointer-events:none}
#pm-toast.on{display:block;animation:ds-fade .16s ease-out}
#pm-toast p{margin:2px 0}
.pm-talk{left:0;right:0;bottom:0;z-index:40;padding:72px var(--ds-gutter) 40px;background:linear-gradient(to top,var(--ds-veil-strong) 0,var(--ds-veil) calc(100% - 72px),transparent 100%)}
.pm-dlg{display:grid;grid-template-columns:96px minmax(0,620px) minmax(300px,1fr);column-gap:28px;align-items:start;max-width:1620px;margin:0 auto}
.pm-dlg .port{line-height:0}
.pm-dlg img{display:block;width:96px;height:96px;image-rendering:pixelated}
.pm-dlg .who{grid-column:2;min-width:0}
.pm-dlg .pm-h{margin:0}
.pm-dlg .pm-h small{margin-left:12px;font:400 var(--ds-fs-body)/1 var(--ds-text);color:var(--ds-muted)}
.pm-dlg .side{grid-column:3;grid-row:1;min-width:0;display:flex;flex-direction:column;max-height:min(46vh,420px)}
.pm-dlg .opts{flex:0 1 auto;border-bottom:1px solid var(--ds-line)}
.pm-dlg .opts .pm-sub{margin:12px 0 6px}
.pm-dlg.here{grid-template-columns:minmax(0,716px) minmax(300px,1fr);column-gap:28px}
.pm-dlg.here .who{grid-column:1}
.pm-dlg.here .side{grid-column:2}
.pm-dlg .who .news{margin:10px 0 0;font-size:var(--ds-fs-body);color:var(--ds-accent)}
body.pm-talking #pm-prompt,body.pm-talking #pm-hints,body.pm-talking #pm-toast,body.pm-full #pm-status,body.pm-full #pm-figs,body.pm-full #pm-prompt,body.pm-full #pm-hints,body.pm-full #pm-veil-l,body.pm-full #pm-veil-r{visibility:hidden}
.pm-port{line-height:0}
.pm-port img{image-rendering:pixelated}
.pm-result .pm-big{text-align:center}
.pm-foe{display:flex;gap:14px;align-items:flex-start;margin:6px 0}
.pm-foe-side{grid-column:1 / 3;grid-row:1;min-width:0}
.pm-self.pm-match{display:block;padding-right:6px}
.pm-self.pm-match .pm-ladder2{margin-top:14px}
.pm-foe-side p{margin:6px 0}
.pm-foe-side .pm-warn{color:var(--ds-accent)}
.pm-ladder>.pm-sub{margin:0 0 6px}
.pm-menu .pm-body .pm-btn kbd{order:2;margin-left:auto}
@media (max-width:1100px){
  .pm-dlg,.pm-dlg.here{grid-template-columns:64px minmax(0,1fr);column-gap:14px}
  .pm-dlg.here .who{grid-column:1 / 3}
  .pm-dlg img{width:64px;height:64px}
  .pm-dlg .side,.pm-dlg.here .side{grid-column:1 / 3;grid-row:auto;margin-top:12px;max-height:min(38vh,320px)}
}
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
  .pm-dlg .side,.pm-dlg.here .side{margin-top:10px;max-height:none;min-height:0}
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
  .pm-dlg.here .side{grid-column:2}
  .pm-dlg img{width:64px;height:64px}
  .pm-dlg .side{grid-column:3;grid-row:1;margin-top:0;max-height:calc(100vh - 60px)}
  .pm-dlg .pm-line{margin-top:4px}
}
/* a phone held sideways, narrow and short (568 x 320; IA-03, B-21, C-06, journal Passe IA5): the answers stand beside the words, in a box that scrolls and keeps the focused line in view
   (they were stacked under them, off the screen: the player saw the question and none of its answers) */
@media (max-height:480px) and (max-width:700px){
  .pm-talk{padding:28px 16px 10px;background:linear-gradient(to top,var(--ds-veil-strong) 0,var(--ds-veil) calc(100% - 28px),transparent 100%)}
  .pm-dlg,.pm-dlg.here{grid-template-columns:52px minmax(0,1fr) minmax(0,1.12fr);grid-template-rows:auto;column-gap:12px;max-height:none;align-items:start}
  .pm-dlg.here{grid-template-columns:minmax(0,1fr) minmax(0,1.12fr)}
  .pm-dlg img{width:52px;height:52px}
  .pm-dlg .who,.pm-dlg.here .who{min-width:0}
  .pm-dlg .who{grid-column:2}
  .pm-dlg.here .who{grid-column:1}
  .pm-dlg .side,.pm-dlg.here .side{grid-column:3;grid-row:1;margin-top:0;max-height:min(214px,calc(100vh - 44px));min-height:0}
  .pm-dlg.here .side{grid-column:2}
  .pm-dlg .pm-line{margin-top:2px}
  .pm-dlg .pm-line q{margin:0 0 4px}
  .pm-dlg .opts .pm-btn{padding:6px 0}
  .pm-dlg .pm-h small{display:inline;margin:0 0 0 8px}
  .pm-dlg .who .news{margin:4px 0 0}
  .pm-dlg .opts .pm-sub{margin:8px 0 4px}
}
`;

export { costTag, shortLabel };

/** the match sheet's word on the opponent's skills (lot V9): named once the player watched them train; « scouting would tell you more » only of the
 *  rivals one can watch (`scoutable`: today's game Vessa and Marek, journal Passe EVL1; a version 2 game every rival of the pool since lot L3), the others' skills
 *  shown by the bout itself */
export function foeIntel(s: GameState, id: string): string {
  const name = RIVALS[id].name;
  if (isV2(s)) return scoutLines(s, id).join(' ');
  if (s.facts.includes(`scouted:${id}`)) return tx('ui.arena.foeSkills', { name, skills: (V2_FOES[id]?.skills.list ?? []).map((k) => FOE_SKILLS[k.id].name).join(', ') });
  return scoutable(s).includes(id) ? tx('v2.sheet.unknown', { name }) : tx('v2.sheet.unseen', { name });
}

/** a fighter's name: a person of the town, a fighter of the town, a rival */
const fighterName = (who: string): string => PEOPLE[who]?.name ?? NPC_FIGHTERS[who]?.name ?? GENERICS[who]?.name ?? RIVALS[who]?.name ?? who;

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
  /** the things to do here (a version 2 game, journal Passe LA2) */
  readonly todo: TodoCue | null = null;
  private near: string | null = null;
  /** the prompt as last written (the person near and their mark): rewritten when either changes */
  private nearKey = '';

  constructor(private host: UiHost, private seenSeq: number) {
    injectStyle();
    if (!document.getElementById('pm-town-css')) { const st = document.createElement('style'); st.id = 'pm-town-css'; st.textContent = CSS; document.head.appendChild(st); }
    this.veils[0].id = 'pm-veil-l'; this.veils[1].id = 'pm-veil-r';
    this.status.id = 'pm-status'; this.figs.id = 'pm-figs'; this.hints.id = 'pm-hints'; this.prompt.id = 'pm-prompt'; this.toast.id = 'pm-toast';
    this.status.setAttribute('aria-live', 'polite');
    const menu = el('button', 'pm-btn', `${keyCap('Esc')}${tx('ui.menu')}`);
    this.hereKey.addEventListener('click', () => this.openHere()); menu.addEventListener('click', () => this.openMenu());
    this.hints.append(this.hereKey, menu);
    // a version 2 game: the list's key counts what there is to do here, its preview above it (the operator's LA1 sheet, journal Passe LA2)
    if (isV2(host.state())) this.todo = new TodoCue(this.hereKey);
    document.body.append(...this.veils, this.status, this.figs, this.hints, this.prompt, this.toast);
    window.addEventListener('keydown', (e) => {
      if (e.repeat || (e.target instanceof HTMLInputElement && e.key !== 'Escape')) return;
      // the player's keys (the remapping, journal Passe RM2: each action by the key the player gave it, RM-1; Esc stays the menu's)
      const acts = actsOf(e, 'walk'), is = (a: Act): boolean => acts.includes(a), escape = e.key === 'Escape';
      if (is('mute') && isV2(this.st)) { void import('../audio/Sound').then((m) => { const s = m.sound(); s.set({ muted: !s.settings.muted }); window.dispatchEvent(new Event('cdt-sound')); }); return; }
      if (this.modal) { if (escape || (is('list') && this.current?.dataset.here)) this.leave(); return; }
      if (is('list')) this.openHere(); else if (is('map')) this.openMap(); else if (is('journal')) this.openJournal(); else if (is('board')) this.openBoard(); else if (escape) this.openMenu();
      else if (is('skills') && isV2(this.st)) this.openSkills(false); else if (is('gear') && isV2(this.st)) this.openGear(); else if (is('settings') && isV2(this.st)) this.openSettings('sound');
      else if (is('guide') && isV2(this.st)) this.openGuide();
    });
    this.render();
    // a change of keys shows them at once (the list's cap: the player's key, Q or A at the start)
    onSettings(() => this.render());
    if (this.st.over) void this.showEnd(); else this.showNews();
    // the preview on arriving, once the news are read (a page with the tutorial: once its welcome is done)
    if (!host.tutorial) void this.newsRead.then(() => this.todo?.arrive(this.st, this.boutNow()));
    // a costly event of the town asks its answer once the news are read (GP-10, src/simulation/v2encounter.ts)
    void this.newsRead.then(() => { if (encounterOf(this.st) && !this.modal) this.openEncounter(); });
  }

  /** the answer to a costly event of the town (the operator's GP-10 « Le lieu et le choix », journal Passe GP2): the dialogue's band, the event's words, its answers; Esc
   *  lets it be (its cost stands; the answers stay in the list until the next slot ends) */
  openEncounter(): void {
    const st = this.st, e = encounterOf(st);
    if (!e) return;
    const opts = actions(st).filter((o) => o.action.type === 'answer');
    const ev = [...st.log].reverse().find((x) => x.visible && x.id === (e === 'sharps' ? 'v2-card-sharps' : 'pickpockets'));
    this.closeModal();
    this.modal = true; this.prompt.classList.remove('on');
    const root = el('div', 'pm pm-talk'), card = el('div', 'pm-dlg'), side = el('div', 'side');
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', tx('v2.encounter.title'));
    root.dataset.encounter = e;
    card.innerHTML = `<div class="who"><h2 class="pm-h">${esc(tx('v2.encounter.title'))}</h2><div class="pm-line">${ev ? `<p>${esc(said(ev.text, ev.$t))}</p>` : ''}</div></div>`;
    const list = el('div', 'opts');
    // the answer's words in the bandeau once the band is gone
    for (const o of opts) list.appendChild(this.optionButton(o, () => { const lines = this.said.splice(0); this.closeModal(); if (o.action.type === 'answer' && o.action.how === 'fight' && this.st.v2?.challenge) this.openChallengeSheet(); else if (lines.length) this.flash(lines); }, false));
    const leave = footBtn('Esc', tx('ui.leave'), () => this.closeModal());
    side.append(list, footOf(leave)); arrowKeys(side);
    card.appendChild(side); root.appendChild(card);
    document.body.appendChild(root); document.body.classList.add('pm-talking');
    this.current = root; scrollFade(list);
    ((list.querySelector('.pm-btn:not(:disabled)') as HTMLButtonElement | null) ?? leave).focus();
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
    if (r === 'title') leavePage(location.pathname);
  }

  private get st(): GameState { return this.host.state(); }

  /** per frame: who stands next to the player (the prompt) */
  update(): void {
    const n = this.host.nearby?.() ?? null;
    // a version 2 game: the person's mark said in words near them (the operator's MK-3 « la sorte dite dans l’invite de près », journal Passe MK2)
    const mk = n ? peopleMarks(this.st).get(n) ?? null : null, key = `${n}|${mk}`;
    if (key !== this.nearKey) {
      this.near = n; this.nearKey = key;
      const p = n ? PEOPLE[n] : null;
      const talk = p ? tx('ui.talkTo', { name: esc(p.name), title: esc(titleOf(p, isV2(this.st))) }) : '';
      this.prompt.innerHTML = p ? `${bindCap('talk')}${mk ? tx('ui.talkToMark', { talk, kind: tx(MARK_WORD[mk]) }) : talk}` : '';
      this.prompt.classList.toggle('on', !!p && !this.modal);
    }
  }

  /** E (or Space) in the scene */
  interact(): void { if (!this.modal && this.near) this.openPerson(this.near); }
  /** a page or a dialogue is open: the squares' talk key (E and Space) leaves the keyboard to it (the operator's CM-01: Space did nothing on a square's skills page, journal Passe CM2) */
  get pageOpen(): boolean { return !!this.modal; }

  /** the day's bout, open now: its prompt stays on screen, the action in the list */
  private boutNow(): boolean {
    const s = this.st;
    return (s.slot === 'afternoon' && s.tournament.matches.some((m) => m.day === s.day && !m.winner && (m.a === 'player' || m.b === 'player'))) || !!s.v2?.challenge;
  }

  render(): void {
    // caught (journal Passe PN1): the band of the one who holds the player, whatever was open
    if (this.st.v2?.caught && this.current?.dataset.caught !== '1') queueMicrotask(() => { if (this.st.v2?.caught && this.current?.dataset.caught !== '1') this.openCaught(); });
    const s = this.st, P = s.player, v2 = isV2(s), m = s.tournament.matches.find((x) => x.day >= s.day && !x.winner && (x.a === 'player' || x.b === 'player'));
    const opp = m ? RIVALS[m.a === 'player' ? m.b : m.a] : null;
    const when = m && m.day === s.day ? (s.slot === 'afternoon' ? tx('ui.next.now') : tx('ui.next.today')) : '';
    // the version 2 (journal Passe VP1): the bout's stage, the ten days' end
    // (a finalist before the final is drawn, lot L5: the other semi-final's winner, src/tournament/v2calendar.ts pendingFinal)
    const fin = v2 && !opp ? pendingFinal(s) : null, fo = fin?.foe ? RIVALS[fin.foe] : null;
    const next = v2 ? (s.over ? tx('v2.over') : opp ? tx('v2.next.bout', { stage: stageName(m!), name: opp.name, day: m!.day, when }) : fo ? tx('v2.next.bout', { stage: tx('v2.stage.final'), name: fo.name, day: fin!.day, when: '' }) : tx('v2.next.done'))
      : s.over ? tx('ui.next.over') : opp ? tx('ui.next.bout', { name: opp.name, day: m!.day, when }) : tx('ui.next.done');
    const slotName = s.slot === 'evening' ? (dusk(s) ? tx('ui.slot.sunset') : 'evening') : s.slot, days = v2 ? 10 : 3;
    const place = shortName(placeName(s.place, v2));
    this.status.setAttribute('aria-label', v2 ? tx('ui.clockV2', { day: s.day, slot: slotName }) : tx('ui.clock', { day: s.day, slot: slotName }));
    this.status.innerHTML = `<div class="clock">${tx('ui.clockDay', { day: s.day })} <span>${tx('ui.clockOf', { days })}</span></div>
      <div class="ticks">${Array.from({ length: days }, (_, i) => `<i class="${i + 1 < s.day ? 'on' : i + 1 === s.day ? 'cur' : ''}"></i>`).join('')}</div>
      <div class="where">${esc(cap(word(slotName)))} · ${esc(place)}</div><div class="next">${esc(next)}</div>`;
    // a version 2 game (lot L2a, EV-2; L2-2 « Des marques »): the marks of Hale's ledger beside the reputation, only once there is one (two numbers apart)
    const sus = v2 ? marksOf(s) : 0;
    this.figs.innerHTML = `<div><b>${P.coins}</b><small>${tx('ui.coins')}</small></div><div><b>${P.reputation}</b><small>${tx('ui.reputation')}</small></div>${sus > 0 ? `<div class="hurt"><b>${sus}/3</b><small>${tx('ui.marks')}</small></div>` : ''}${P.injury ? `<div class="hurt"><b>${P.injury}</b><small>${P.injury > 1 ? tx('ui.badlyHurt') : tx('ui.hurt')}</small></div>` : ''}`;
    if (this.welcomed && v2 && (sus > 0 || P.injury > 0)) { if (sus > 0) this.hint('mark'); if (P.injury > 0) this.hint('hurt'); }
    const bout = this.boutNow();
    this.hereKey.className = `pm-btn${bout ? ' primary' : ''}`;
    this.hereKey.innerHTML = `${bindCap('list')}${bout ? (s.v2?.challenge ? this.sandLabel(s) : tx('ui.enterArena')) : tx('ui.here')}`;
    // the things to do here, counted on the list's key (the operator's LA-1, LA-3, journal Passe LA2: src/ui/todo.ts)
    this.todo?.render(s, bout ? (s.v2?.challenge ? this.sandLabel(s) : tx('ui.enterArena')) : tx('ui.here'), bout);
    if (this.current?.dataset.here) this.openHere();
  }

  /** the sand's door: a challenge, or a reprisal's muscle waiting there (lot L2b) */
  private sandLabel(s: GameState): string {
    const c = s.v2?.challenge, name = esc(PEOPLE[c?.who ?? '']?.name ?? NPC_FIGHTERS[c?.who ?? '']?.name ?? c?.who ?? '');
    // a thief's fight, a passer-by's piece demanded (journal Passe PN1)
    return c?.reprisal ? tx('v2.reprisal.enter', { name }) : c?.kind === 'caught' ? tx('v2.caught.enter', { name }) : c?.kind === 'seize' ? tx('v2.seize.enter', { name }) : c?.kind === 'encounter' ? tx('v2.encounter.enter', { name }) : tx('v2.challenge.enter');
  }

  /** caught (journal Passe PN1, the operator's GP-03 « Gagné : on s’échappe sans amende (la pièce reste) »): the one who caught the player holds them, a band with their face, the
   *  fine paid now or fought on the sand; nothing else until it is settled (the simulation refuses the rest, caughtRule) */
  openCaught(): void {
    const s = this.st, c = s.v2?.caught;
    if (!c) return;
    const opts = actions(s).filter((o) => o.action.type === 'payFine' || o.action.type === 'fightCatch');
    this.closeModal(); this.modal = true; this.prompt.classList.remove('on');
    document.body.classList.add('pm-talking');
    const root = el('div', 'pm pm-talk'), card = el('div', 'pm-dlg'), side = el('div', 'side'), list = el('div', 'opts');
    root.dataset.caught = '1';
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', PEOPLE[c.by]?.name ?? c.by);
    const url = portraitUrl(c.by);
    card.innerHTML = `${url ? `<span class="port"><img src="${url}" alt=""></span>` : ''}<div class="who"><h2 class="pm-h">${esc(PEOPLE[c.by]?.name ?? c.by)}</h2><div class="pm-line"><q>${esc(tx(c.night ? 'v2.caught.holdNight' : 'v2.caught.hold', { item: itemName(c.item), fine: c.fine }))}</q></div></div>`;
    for (const o of opts) list.appendChild(this.optionButton(o, () => { if (o.action.type === 'fightCatch' && this.st.v2?.challenge) this.openChallengeSheet(); }));
    side.append(list); arrowKeys(side); card.appendChild(side); root.appendChild(card);
    document.body.appendChild(root); this.current = root; scrollFade(list);
    (list.querySelector('.pm-btn:not(:disabled)') as HTMLButtonElement | null)?.focus();
    // opened on the page's first frame, before the baked faces are painted (a keeper on a square: found by tools/npc-duel-flow.mjs): drawn again with the face
    if (!url) void portraitsReady().then(() => { if (this.current === root && portraitUrl(c.by)) this.openCaught(); });
  }

  /** the list on demand (UM-R2, Q): what can be done here and now, the rest and the wait, the people; a band at the foot of the screen, as a dialogue */
  openHere(): void {
    const s = this.st, v2 = isV2(s), all = actions(s);
    // the place's actions open now (the version 2, P5), every one with its reason in today's game; the people's are in their dialogues; a version 2 game also
    // shows the drill the sand refuses, with its reason (lot L4: the morning after a brawl, Rhosk on it), and the stall Wynn watches (lot L5), so the player reads why
    const watched = (o: ActionOption) => o.action.type === 'steal' && watchPost(s)?.shop === (o.action as { shop: string }).shop;
    const opts = all.filter((o) => { const by = offeredBy(o.action as never); return o.action.type !== 'talk' && o.action.type !== 'move' && (by === null || by === 'forge') && (!v2 || o.ok || o.action.type === 'rest' || o.action.type === 'wait' || (o.action.type === 'train' && !!sandRefusal(s)) || watched(o)); });
    const fight = s.slot === 'afternoon' && s.tournament.matches.some((m) => m.day === s.day && !m.winner && (m.a === 'player' || m.b === 'player'));
    const people = all.filter((o) => o.action.type === 'talk');
    this.closeModal(); this.modal = true; this.prompt.classList.remove('on');
    document.body.classList.add('pm-talking');
    // what the list holds to do is seen (the operator's LA-7, journal Passe LA2): kept with the game, outside its fingerprint; the preview leaves
    if (this.todo) { this.todo.opened(s); writeSave(s); }
    const root = el('div', 'pm pm-talk'), card = el('div', 'pm-dlg here'), side = el('div', 'side'), list = el('div', 'opts');
    root.dataset.here = '1';
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', tx('ui.here'));
    card.innerHTML = `<div class="who"><h2 class="pm-h">${esc(shortName(placeName(s.place, v2)))}</h2><div class="pm-sub">${esc(s.player.name)}${s.player.items.length ? ` · ${esc(s.player.items.map((i) => (lang() === 'en' ? i.replace('-', ' ') : itemText(i, 'name'))).join(', '))}` : ''}</div>${this.saidHtml()}</div>`;
    if (fight) {
      const b = el('button', 'pm-btn primary', `<span>${tx('ui.enterArena')}</span><span class="cost">${tx('ui.oneSlot')}</span>`);
      // the version 2: the match sheet chooses the four skills first (lot V2, journal Passe V2)
      b.addEventListener('click', () => { if (isV2(s)) { this.openMatchSheet(); return; } writeSave(s); this.host.reload({ scene: 'arena' }); }); list.appendChild(b);
    }
    // the version 2: a challenge waits on the sand (lot V4); its short sheet first (the operator's GP-13 « Une fiche courte avant un défi », journal Passe GP2)
    if (s.v2?.challenge) {
      const b = el('button', 'pm-btn primary', `<span>${this.sandLabel(s)}</span><span class="cost">${tx('ui.oneSlot')}</span>`);
      b.addEventListener('click', () => this.openChallengeSheet(() => this.openHere())); list.appendChild(b);
    }
    const line = (o: ActionOption): HTMLButtonElement => this.optionButton(v2 && (o.action.type === 'rest' || o.action.type === 'wait') ? { ...o, label: o.action.type === 'rest' ? tx('v2.self.rest') : tx('v2.self.wait') } : o);
    // a version 2 game's list by groups (IA-04, src/ui/listModel.ts): the answer an encounter waits for under its own title, what the place is for, the people, then
    // the time to pass and the theft each under a title of its own, never the first line; today's game keeps its list as it was
    const g = groupHere(opts), title = (key: TextKey): void => { list.appendChild(el('p', 'pm-sub', tx(key))); };
    const tail = (grp: 'time' | 'steal', key: TextKey): void => {
      if (!g[grp].length) return;
      title(key);
      for (const o of g[grp]) { const b = line(o); b.dataset.group = grp; list.appendChild(b); }
    };
    if (v2) {
      if (g.answer.length) { title('v2.encounter.title'); for (const o of g.answer) list.appendChild(line(o)); }
      for (const o of g.do) list.appendChild(line(o));
    } else for (const o of opts) list.appendChild(line(o));
    const away = (o: ActionOption) => !o.ok && o.reason === tx('avail.notNow', { name: PEOPLE[(o.action as { who: string }).who].name }), here = people.filter((o) => !away(o)), gone = people.filter(away);
    if (here.length) {
      list.appendChild(el('p', 'pm-sub', tx('ui.peopleHere')));
      for (const o of here) {
        // the person's mark beside their name (the operator's MK-11 « La liste, un conseil et une ligne du guide », journal Passe MK2)
        const who = (o.action as { who: string }).who, mk = o.ok ? peopleMarks(s).get(who) : undefined;
        if (mk) installMarkCss();
        const b = el('button', 'pm-btn', `<span>${mk ? `<span class="pm-mk" data-kind="${mk}" role="img" aria-label="${esc(tx(MARK_WORD[mk]))}">${markGlyph(mk)}</span>` : ''}${esc(PEOPLE[who].name)}<span class="why">${o.ok ? esc(PEOPLE[who].title) : esc(o.reason ?? '')}</span></span>`);
        b.disabled = !o.ok; b.addEventListener('click', () => this.openPerson(who)); list.appendChild(b);
      }
    }
    if (gone.length) list.appendChild(el('p', 'pm-sub', tx('ui.away', { names: esc(gone.map((o) => PEOPLE[(o.action as { who: string }).who].name).join(', ')) })));
    if (v2) { tail('time', 'ui.group.time'); tail('steal', 'ui.group.steal'); }
    const close = footBtn('Esc', tx('ui.close'), () => this.closeModal());
    side.append(list, footOf(close)); arrowKeys(side); card.appendChild(side); root.appendChild(card);
    document.body.appendChild(root); this.current = root; scrollFade(list);
    // opens on the first useful line (IA-04): the bout, a challenge, the answer, what the place is for, a person; a version 2 game's list never opens on the time to pass
    // nor on the theft (today's game keeps its first enabled line)
    ((list.querySelector(v2 ? '.pm-btn:not(:disabled):not([data-group])' : '.pm-btn:not(:disabled)') as HTMLButtonElement | null) ?? close).focus();
    // the first theft the list offers (journal Passe TU3, TU-3)
    if (opts.some((o) => o.ok && o.action.type === 'steal')) this.hint('steal');
  }

  /** `gate`: asked first (a sale: IA-07); it is given what the click does once it is answered */
  private optionButton(o: ActionOption, after?: () => void, tag = true, gate?: (go: () => void, line: HTMLButtonElement) => void): HTMLButtonElement {
    const b = el('button', 'pm-btn', `<span>${esc(shortLabel(o))}${o.ok ? '' : `<span class="why">${esc(o.reason ?? '')}</span>`}</span>${tag ? costTag(o) : ''}`);
    b.disabled = !o.ok;
    b.addEventListener('click', () => { const go = (): void => { this.run(o.action); after?.(); }; if (gate) gate(go, b); else go(); });
    return b;
  }

  /** a sale in a dialogue asks before it sells (the operator's IA-07 « Toute vente demande, les messages disent le port et la vente », journal Passe IA2; B-08 of journal
   *  Passe IA1: « Sell X to Mara » sold at one Enter where the gear page and its Sell panel ask): the line is replaced by the question, as the gear page words it; Enter sells,
   *  Esc or the second line keeps the piece and gives the dialogue back. The press that opened the question never answers it (a breath of 0.4 s) */
  private askSale(o: ActionOption, list: HTMLElement, root: HTMLElement, go: () => void, line: HTMLButtonElement): void {
    const item = (o.action as { item: string }).item, n = o.gain ?? 0, saved = [...list.children], at = performance.now();
    const q = el('p', 'pm-sub', esc(tx('ui.gear.confirm', { item: bare(itemName(item)), n }))), what = el('p', 'pm-sub', esc(tx('ui.gear.confirmWhat')));
    const yes = el('button', 'pm-btn primary', `<span>${esc(tx('ui.wares.sell', { n }))}</span>`), keep = el('button', 'pm-btn', `<span>${esc(tx('ui.gear.keep'))}</span>`);
    const back = (): void => { root.removeEventListener('keydown', esc1, true); list.replaceChildren(...saved); line.focus(); };
    const esc1 = (e: KeyboardEvent): void => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); back(); } };
    root.addEventListener('keydown', esc1, true);
    yes.addEventListener('click', () => { if (performance.now() - at < 400) return; root.removeEventListener('keydown', esc1, true); go(); });
    keep.addEventListener('click', back);
    list.replaceChildren(q, what, yes, keep);
    yes.focus();
  }

  /** applies an action: a reload for a new slot or place, otherwise the panels and the news */
  run(a: Action, quiet = false): ActResult {
    const r = this.host.act(a);
    if (!r.ok) { void this.card(`<p>${esc(r.reason ? said(r.reason, r.$reason) : tx('ui.cannot'))}</p>`, tx('ui.close'), true); return r; }
    if (r.reload) { this.closeModal(); this.host.reload(); return r; }
    // the dialogue that opens says who it is: « You meet Mara » stays in the journal, not on the screen (journal Passe UM1)
    const news = quiet ? [] : (r.events ?? []).filter((e) => e.visible && e.id !== 'meet').map((e) => said(e.text, e.$t));
    // a version 2 game (journal Passe EVL1): with a band open (the list, a dialogue) the news stand in it, under the place or the person's words,
    // where the player is reading (the bandeau at the top is hidden while a band is open); today's game keeps its bandeau
    const inBand = isV2(this.st) && news.length > 0 && (this.opening || document.body.classList.contains('pm-talking'));
    if (inBand) this.said.push(...news);
    this.render();
    if (!inBand && news.length) this.flash(news);
    return r;
  }
  /** a version 2 game: the news of an action taken in a band, shown by the band that opens next (the list again, the person's dialogue) */
  private said: string[] = [];
  /** a dialogue is opening: its first word's news go into it */
  private opening = false;
  private saidHtml(): string { const h = this.said.map((t) => `<p class="news" role="status">${esc(t)}</p>`).join(''); this.said = []; return h; }

  private flash(lines: string[]): void {
    this.toast.innerHTML = lines.map((x) => `<p>${esc(x)}</p>`).join('');
    this.toast.classList.add('on');
    clearTimeout((this.toast as any).t);
    (this.toast as any).t = setTimeout(() => this.toast.classList.remove('on'), 6500);
  }

  /** the news shown as the page opened, read (closed); at once when there were none: a version 2 square's cutscene waits for it (journal Passe EVL1) */
  newsRead: Promise<unknown> = Promise.resolve();

  /** what happened since the player last looked (the slot that ended, the bouts, the night) */
  private showNews(): void {
    const news = this.st.log.filter((e) => e.visible && e.seq > this.seenSeq);
    if (!news.length) return;
    // P6 (lot V9): back from a bout of the version 2, the result first, large
    const duel = isV2(this.st) ? news.find((e) => e.kind === 'match' && (e.id === 'player-won' || e.id === 'player-lost')) : undefined;
    // the operator's DB11-5 « Le dire partout » (journal Passe DB13): a bout of the tournament won says the vigour it gives and the health of the next bout; a challenge
    // won that it gives none (GP-14 « La vigueur pour les combats du tournoi seulement (décision A3 : précise DB7-4) », journal Passe GP2)
    const won = isV2(this.st) && news.some((e) => e.id === 'player-won'), sand = isV2(this.st) && !won && news.some((e) => e.id === 'challenge:won');
    const vigour = won ? `<p class="pm-vigour">${esc(tx('v2.result.vigour', { n: VIGOUR_HP, hp: duelStats(this.st).hp ?? 0, k: num(AUTO_RULES.hpScale) }))}</p>`
      : sand ? `<p class="pm-vigour">${esc(tx('v2.result.noVigour'))}</p>` : '';
    // a version 2 game never cuts a sign or a consequence (GP-11, src/ui/news.ts newsLines), the rest left to the journal; today's game keeps its last eight lines
    const { lines, rest } = isV2(this.st) ? newsLines(news) : { lines: news.slice(-8), rest: 0 };
    const body = lines.map((e) => `<p>${esc(said(e.text, e.$t))}</p>`).join('') + (rest > 0 ? `<p class="pm-sub">${esc(tx('ui.news.rest', { n: rest }))}</p>` : '');
    if (duel) { this.newsRead = this.card(`<div class="pm-result"><p class="pm-big">${duel.id === 'player-won' ? tx('v2.result.won') : tx('v2.result.lost')}</p>${body}${vigour}</div>`, tx('ui.goOn')); return; }
    this.newsRead = this.card(`<h2 class="pm-h">${news.length > 1 ? tx('ui.meanwhile') : tx('ui.news')}</h2>${body}${vigour}`, tx('ui.goOn'), true);
  }

  /** `band`: what is read in passing, at the foot of the screen; else a page on the full-screen veil */
  private async card(html: string, ok = tx('ui.close'), band = false): Promise<string> {
    this.modal = true; this.prompt.classList.remove('on');
    if (!band) document.body.classList.add('pm-full');
    const o = overlay(html, [{ id: 'ok', label: ok, primary: ok !== tx('ui.close') }], band);
    this.current = o.root;
    const r = await o.done;
    this.modal = false; this.current = null;
    return r;
  }
  private current: HTMLElement | null = null;
  private closeModal(): void { if (this.current) { this.current.remove(); this.current = null; } document.body.classList.remove('pm-talking'); if (this.modal) this.host.focus?.(null); this.modal = false; this.back = null; this.shownPage = null; }
  /** the menu's page shown now (a gamepad's shoulders go to its neighbour: journal Passe MN2, MN-4) */
  private shownPage: MenuPage | null = null;
  /** a version 2 game's gamepad, LB / RB on one of the menu's pages: the page before or after it, in the menu's order (MN-4) */
  tabPage(dir: -1 | 1): void {
    const pages: MenuPage[] = isV2(this.st) ? ['map', 'journal', 'board', 'notebook', 'skills', 'gear', 'settings'] : ['map', 'journal', 'board'];
    const to = tabTo(pages, this.shownPage, dir);
    if (to === 'map') this.openMap(); else if (to === 'journal') this.openJournal(); else if (to === 'board') this.openBoard(); else if (to === 'notebook') this.openNotebook();
    else if (to === 'skills') this.openSkills(false); else if (to === 'gear') this.openGear(); else if (to === 'settings') this.openSettings();
  }
  /** where Esc leads from a page opened from a dialogue */
  private back: (() => void) | null = null;
  private leave(): void { const b = this.back; this.closeModal(); b?.(); }

  openPerson(who: string): void {
    const s = this.st, p = PEOPLE[who];
    if (!p) return;
    const talk = actions(s).find((o) => o.action.type === 'talk' && (o.action as { who: string }).who === who);
    if (!talk?.ok) { this.said = []; void this.card(`<p>${esc(talk?.reason ?? tx('avail.notHere', { name: p.name }))}</p>`, tx('ui.close'), true); return; }
    this.opening = true;
    try { this.run({ type: 'talk', who }); } finally { this.opening = false; }
    const st = this.st, lines = linesOf(st, who), url = portraitUrl(who);
    const opts = actions(st).filter((o) => offeredBy(o.action as never) === who && !(o.action.type === 'scout' && (o.action as { who: string }).who !== who));
    const goods = opts.some(isWare);
    this.closeModal();
    this.modal = true; this.prompt.classList.remove('on');
    // P4 (journal Passe UM1: every game): the dialogue at the foot of the screen, the scene kept visible (the version 2 turns it to the speaker)
    const root = el('div', 'pm pm-talk'), card = el('div', 'pm-dlg'), side = el('div', 'side');
    if (isV2(st)) this.host.focus?.(who);
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', p.name);
    card.innerHTML = `${url ? `<span class="port"><img src="${url}" alt=""></span>` : ''}<div class="who"><h2 class="pm-h">${esc(p.name)}<small>${esc(titleOf(p, isV2(this.st)))}</small></h2><div class="pm-line">${lines.map((l) => `<q>${esc(l)}</q>`).join('')}</div>${this.saidHtml()}</div>`;
    const list = el('div', 'opts');
    if (goods) { const b = el('button', 'pm-btn', `<span>${tx(who === 'bram' ? 'ui.wares.seeForge' : 'ui.wares.see')}</span>`); b.addEventListener('click', () => this.openShop(who)); list.appendChild(b); }
    // Master Corvin keeps his notebook (lot 3 of « La Brute »): Esc back to him
    // (his rehearsal first among his offers, then his notebook)
    const again = () => { if (this.current === root) this.openPerson(who); }, first = opts.filter((o) => o.action.type === 'rehearse');
    for (const o of first) list.appendChild(this.optionButton(o, again));
    if (who === 'corvin' && isV2(st)) { const b = el('button', 'pm-btn', `<span>${tx('nb.see')}</span>`); b.addEventListener('click', () => { this.openNotebook(); this.back = () => this.openPerson(who); }); list.appendChild(b); }
    // the plan against the next opponent, which his rehearsal plays (GP-12 « La fiche dès que l’adversaire est connu »)
    const nb = who === 'corvin' && isV2(st) ? autoNextBout(st) : null;
    if (nb) { const b = el('button', 'pm-btn', `<span>${esc(tx('prep.sheet.corvin', { name: fighterName(nb.foeId) }))}</span>`); b.addEventListener('click', () => this.openMatchSheet(() => this.openPerson(who))); list.appendChild(b); }
    // a sale asks first (IA-07, B-08)
    for (const o of opts) if ((!goods || !isGoods(o)) && !first.includes(o)) list.appendChild(this.optionButton(o, again, true, o.action.type === 'sell' ? (go, line) => this.askSale(o, list, root, go, line) : undefined));
    const leave = footBtn('Esc', tx('ui.leave'), () => this.closeModal());
    side.append(list, footOf(leave)); arrowKeys(side);
    card.appendChild(side);
    root.appendChild(card);
    document.body.appendChild(root);
    document.body.classList.add('pm-talking');
    this.current = root; scrollFade(list);
    ((list.querySelector('.pm-btn:not(:disabled)') as HTMLButtonElement | null) ?? leave).focus();
    // the first challenge a person accepts (journal Passe TU3, TU-3)
    if (opts.some((o) => o.ok && o.action.type === 'challenge')) this.hint('challenge', who);
  }

  /** the version 2's skills (lot V2; the page, journal Passe UM11, src/ui/skills.ts); `enter`: the match sheet (openMatchSheet since GP-12) */
  openSkills(enter: boolean): void {
    if (enter) { this.openMatchSheet(); return; }
    this.page();
    this.show(skillsPage({ state: () => this.st, act: (a) => this.host.act(a), close: () => this.closeModal() }, null));
    this.shownPage = 'skills';
  }

  /** the match sheet of the player's next bout, from the moment the opponent is known (the operator's GP-12 « La fiche dès que l’adversaire est connu », journal Passe
   *  GP2): the bout's afternoon it enters the arena; before it, the plan set on it is kept for that rival and Master Corvin's rehearsal plays it; `back` where Esc leads */
  openMatchSheet(back?: () => void): void {
    const s = this.st, nb = isV2(s) ? autoNextBout(s) : null;
    if (!nb) return;
    const enter = nb.today && s.slot === 'afternoon';
    this.page();
    this.show(skillsPage({
      state: () => this.st, act: (a) => this.host.act(a), close: () => this.leave(),
      // the plan set on the match sheet is kept for its rival (lot 2 of « La Brute »)
      foe: nb.foeId, foeName: fighterName(nb.foeId),
      enter: enter ? () => { writeSave(this.st); this.closeModal(); this.host.reload({ scene: 'arena' }); } : undefined,
    }, this.matchSheetHtml(s, nb)));
    this.back = back ?? null;
  }

  /** the short sheet before a fight on the sand (the operator's GP-13 « Une fiche courte avant un défi », journal Passe GP2): the opponent, both fighters as the duel
   *  builds them, whose model a fighter of the town fights on, what is at stake and what a win gives, and a plan for them, kept for them; Enter goes onto the sand.
   *  Any fight waiting on the sand (`s.v2.challenge`: a challenge, a reprisal's muscle, the holder of a theft caught and a passer-by's piece demanded by force, journal
   *  Passe PN1) takes it */
  openChallengeSheet(back?: () => void): void {
    const s = this.st, ch = isV2(s) ? s.v2?.challenge : undefined;
    if (!ch) return;
    this.page();
    this.show(skillsPage({
      state: () => this.st, act: (a) => this.host.act(a), close: () => this.leave(),
      foe: ch.who, foeName: fighterName(ch.who), enterLabel: tx('prep.challenge.go'), pickLabel: tx('prep.challenge.pick'),
      vs: () => { const b = autoBoutOf(this.st, 'challenge'); return b ? { ren: b.ren, foe: b.foe } : null; },
      enter: () => { writeSave(this.st); this.closeModal(); this.host.reload({ scene: 'arena', challenge: '1' }); },
    }, this.challengeSheetHtml(s)));
    this.back = back ?? null;
  }

  /** GP-13's sheet: the head, the opponent, their model, the table, what the player knows, the stake and what a win gives */
  private challengeSheetHtml(s: GameState): string {
    const ch = s.v2?.challenge; if (!ch) return '';
    const who = ch.who, g = GENERICS[who], r = RIVALS[who], name = fighterName(who), url = portraitUrl(who), b = autoBoutOf(s, 'challenge');
    const title = r?.epithet ?? g?.epithet ?? (PEOPLE[who] ? titleOf(PEOPLE[who], true) : '');
    // a fighter of the town fights on a rival's model (src/narrative/generics.ts), now said (GP-13: « que rien ne dit »)
    const model = g && RIVALS[g.profile] ? RIVALS[g.profile] : null, like = model ? tx('prep.challenge.like', { name, rival: model.name }) : '';
    // what the player knows of their way of fighting: a rival's scouting; a fighter of the town's style once fought (its model's kit)
    const known = r ? scoutLines(s, who) : g && model && hasFought(s, who) ? [styleText(g.profile, name)] : [];
    // a townsperson's fight (journal Passe PN1): what a win and a loss settle, no skill to learn
    const teach = ch.reprisal || ch.kind ? null : challengeSkill(s, who);
    const stake = ch.kind === 'caught' && ch.caught ? tx('prep.challenge.caught', { item: itemName(ch.caught.item), fine: CAUGHT_LOST * ch.caught.fine })
      : ch.kind === 'seize' ? tx('prep.challenge.seize', { item: itemName(PASSERS[who]?.item ?? ''), name, n: SEIZE.coinsLost })
      : ch.kind === 'encounter' && ch.encounter ? (ch.encounter.quest ? tx('prep.challenge.sharps', { price: QUEST.sharpsPrice }) : tx('prep.challenge.encounter', { n: ENCOUNTERS[ch.encounter.id].coins }))
      : ch.reprisal ? tx('prep.challenge.reprisal') : ch.stake === 'coins' ? tx('prep.challenge.stakeCoins', { n: STAKE.coins, back: 2 * STAKE.coins }) : tx('prep.challenge.stakeName', { n: STAKE.name });
    const win = teach ? tx(levelOf(s, teach) > 0 ? 'prep.challenge.raise' : 'prep.challenge.teach', { skill: skillName(teach) }) : '';
    const vs = b ? this.autoVsHtml(b.ren, b.foe, autoForms(b), name, known.length > 0 && (!r || scoutTier(s, who) >= 1)) : '';
    return `<p class="pm-sub">${esc(tx(ch.kind === 'caught' ? 'v2.caught.title' : ch.kind === 'seize' ? 'v2.seize.title' : ch.kind === 'encounter' ? 'v2.encounter.fightTitle' : ch.reprisal ? 'v2.challenge.reprisal' : 'v2.challenge.title'))} · ${esc(tx('ui.dayN', { day: s.day }))}</p><div class="pm-foe">${url ? `<span class="pm-port"><img src="${url}" alt="" width="64" height="64"></span>` : ''}<div><h2 class="pm-h">${esc(name)}</h2><p class="pm-sub">${esc(title)}</p></div></div>`
      + (like ? `<p class="pm-sub">${esc(like)}</p>` : '') + vs + known.map((l) => `<p class="pm-sub">${esc(l)}</p>`).join('')
      + `<p class="pm-sub">${esc(stake)}</p>${win ? `<p class="pm-sub">${esc(win)}</p>` : ''}${ch.reprisal || ch.kind ? '' : `<p class="pm-sub">${esc(tx('v2.result.noVigour'))}</p>`}<p class="pm-sub">${esc(tx('auto.sheet.note', { k: num(AUTO_RULES.hpScale) }))}</p>`;
  }

  /** P6 (lot V9): the bout's stage, the opponent (face, name, style), what the player knows of their skills, the gear worn, an ally's advice; since GP-12 the next bout's,
   *  from the moment its opponent is known (`nb`: its fighters as the duel would build them now, its form of the day said on the day) */
  private matchSheetHtml(s: GameState, nb: NextBout): string {
    const id = nb.foeId, r = RIVALS[id], url = portraitUrl(id), g = s.v2?.gear;
    const stage = nb.match ? stageName(nb.match) : tx('v2.stage.final');
    const heard = heardLine(s, id), strap = nb.today && strapCut(s);
    // the duel played by the computer (lot 2, journal Passe LC3): what decides it, side by side (briefs/combat-auto.md § 7: « les stats des deux, les chances de
    // garde et d'esquive, la préparation du rival, sa forme du jour »), the numbers the duel itself will play (autoBoutOf: the same fighters); ahead of the day, as
    // the duel would build them now (GP-12), the form of the day drawn on the day
    const b = nb, vs = this.autoVsHtml(b.ren, b.foe, b.seed !== null ? autoForms({ seed: b.seed }) : null, r.name, scoutTier(s, id) >= 1);
    const ahead = nb.today && s.slot === 'afternoon' ? '' : tx('prep.sheet.ahead', { day: nb.day, name: r.name });
    // what the player knows of the rival (lot 3 of « La Brute », the scouting by tiers: its style, its plan, its kit), the last rehearsal against its shadow and
    // Master Corvin's last note on it (src/simulation/v2scout.ts, v2prep.ts)
    const known = scoutLines(s, id), reh = rehearsalOf(s, id), last = notesOf(s, id)[0];
    const rehLine = reh ? (rehearsalFresh(s, reh) ? tx('prep.sheet.rehearsal', { wins: reh.wins, n: reh.n, name: r.name }) : tx('prep.sheet.rehearsalOld', { wins: reh.wins, n: reh.n })) : '';
    const noteLine = last ? tx('prep.sheet.note', { name: r.name, advice: adviceText(last.advice, id) }) : '';
    const prep = b && b.prep >= 0.05 ? tx('auto.sheet.prep', { name: r.name, n: num(+b.prep.toFixed(1)) }) : '';
    // the operator's DB11-5 « Le dire partout » (journal Passe DB13): where Ren's health comes from
    const hp = healthParts(s);
    const from = [tx('v2.sheet.hp.base', { n: hp.base }), hp.vigour ? tx('v2.sheet.hp.vigour', { n: hp.vigour, per: VIGOUR_HP }) : '', hp.gear ? tx('v2.sheet.hp.gear', { n: hp.gear }) : '',
      hp.train ? tx('v2.sheet.hp.train', { n: hp.train }) : '', hp.draught ? tx('v2.sheet.hp.draught', { n: hp.draught }) : '', hp.wound ? tx('v2.sheet.hp.wound', { n: hp.wound }) : ''].filter(Boolean).join(', ') + '.';
    const gear = !g ? '' : g.armour ? tx('v2.sheet.gear', { weapon: itemName(g.weapon), tier: weaponTier(s), armour: itemName(g.armour) }) : tx('v2.sheet.gearBare', { weapon: itemName(g.weapon), tier: weaponTier(s) });
    return `<p class="pm-sub">${esc(stage)} · ${esc(tx('ui.dayN', { day: nb.day }))}</p>${ahead ? `<p class="pm-sub">${esc(ahead)}</p>` : ''}<div class="pm-foe">${url ? `<span class="pm-port"><img src="${url}" alt="" width="64" height="64"></span>` : ''}<div><h2 class="pm-h">${esc(r.name)}</h2><p class="pm-sub">${esc(r.epithet)}</p></div></div><p>${esc(r.bio)}</p>`
      + vs + (prep ? `<p class="pm-sub pm-fstats">${esc(prep)}</p>` : '') + known.map((l) => `<p class="pm-sub">${esc(l)}</p>`).join('') + (rehLine ? `<p class="pm-sub">${esc(rehLine)}</p>${s.v2?.kit.mode === 'manual' ? `<p class="pm-sub">${esc(tx('prep.sheet.rehearsalHand'))}</p>` : ''}` : '') + (noteLine ? `<p class="pm-sub">${esc(noteLine)}</p>` : '') + `<p class="pm-sub">${esc(tx('auto.sheet.note', { k: num(AUTO_RULES.hpScale) }))}</p><p class="pm-sub">${esc(tx('auto.sheet.hpWhy'))}</p><p class="pm-sub">${esc(from)}</p>`
      + `${heard ? `<p class="pm-sub">${esc(heard)}</p>` : ''}<p class="pm-sub">${esc(gear)}</p>${strap ? `<p class="pm-sub pm-warn">${esc(tx('v2.sheet.strap'))}</p>` : ''}${s.facts.includes('orla-recruited') ? `<p class="pm-sub">${tx('v2.sheet.ally')}</p>` : ''}`;
  }

  /** the two fighters side by side as the duel played by the computer reads them: the health of the bout (each one's doubled, DB5), the four stats, the form of the
   *  day (AC-08), the dodge and the guard each has against the other (AC-05, the duel's own formulas, the traits in them) */
  private autoVsHtml(ren: AutoFighter, foe: AutoFighter, formOf: [number, number] | null, foeName: string, foeKnown = true): string {
    // ahead of the bout's day its form of the day is not drawn yet (GP-12): « on the day », the blows' shares without it
    const form: [number, number] = formOf ?? [1, 1];
    const pc = (k: number) => tx('auto.sheet.pct', { n: Math.round(k * 100) });
    const signed = (f: number) => `${f >= 1 ? '+' : '−'}${pc(Math.abs(f - 1))}`;
    const rr = autoReactions(ren, foe), fr = autoReactions(foe, ren), n1 = (x: number) => num(+x.toFixed(1));
    // a blow's share of the other's bar as the duel strikes it (src/combat/auto.ts hitOnce: each hit its share of the power, at least 1; the Attack against the Defence,
    // the target's share taken, the striker's form), clean: no guard, no break, no opening
    const bar = (a: AutoAction, att: AutoFighter, def: AutoFighter, f: number): string => {
      const k = hitFactor(att.atk, def.def) * (def.taken ?? 1) * f, dmg = (a.hits ?? [1]).reduce((n, sh) => n + Math.max(1, Math.round((a.power ?? 0) * sh * k)), 0);
      return tx('auto.sheet.pct', { n: +((100 * dmg) / Math.max(1, def.hp * AUTO_RULES.hpScale)).toFixed(1) });
    };
    const rows: Array<[string, string, string]> = [
      [tx('auto.sheet.hp'), String(Math.round(ren.hp * AUTO_RULES.hpScale)), String(Math.round(foe.hp * AUTO_RULES.hpScale))],
      [tx('stat.atk'), n1(ren.atk), n1(foe.atk)], [tx('stat.def'), n1(ren.def), n1(foe.def)], [tx('stat.end'), n1(ren.end), n1(foe.end)], [tx('stat.viv'), n1(ren.viv), n1(foe.viv)],
      [tx('auto.sheet.form'), formOf ? signed(form[0]) : tx('prep.sheet.formDay'), formOf ? signed(form[1]) : tx('prep.sheet.formDay')],
      [tx('auto.sheet.dodge'), pc(rr.dodge), pc(fr.dodge)],
      [tx('auto.sheet.guard'), `${pc(rr.guard)} · ${pc(rr.guardSkill)}`, `${pc(fr.guard)} · ${pc(fr.guardSkill)}`],
      // BL1-10 (« Garder ; le dire au lot 2 sur la fiche de match »): what one light attack (its blows together, § 35.6) and one heavy blow take from the other's bar
      [tx('auto.sheet.lightRow'), bar(ren.light, ren, foe, form[0]), bar(foe.light, foe, ren, form[1])],
      [tx('auto.sheet.heavyRow'), bar(ren.heavy, ren, foe, form[0]), bar(foe.heavy, foe, ren, form[1])],
      // the harmful states each puts on the other and resists (the operator's GE-8 « Ainsi », journal Passe GP4-2): the opponent's read from the scouting (its style, tier 1)
      [tx('auto.sheet.states'), stateListText(autoStatesOf(ren)) || '—', foeKnown ? stateListText(autoStatesOf(foe)) || '—' : '?'],
      [tx('auto.sheet.resist'), resistListText(autoResistsOf(ren)) || '—', foeKnown ? resistListText(autoResistsOf(foe)) || '—' : '?'],
    ];
    return `<table class="pm-vs"><thead><tr><th></th><th>${esc(tx('auto.sheet.you'))}</th><th>${esc(foeName)}</th></tr></thead><tbody>${rows.map(([l, a, c]) => `<tr><td>${esc(l)}</td><td>${esc(a)}</td><td>${esc(c)}</td></tr>`).join('')}</tbody></table>`;
  }

  /** the version 2's gear (lot V3) and the bag: the page of the shops without a keeper (src/ui/wares.ts, UM7-3) */
  openGear(): void { if (this.st.v2?.gear) { this.openWares(null); this.shownPage = 'gear'; } }

  /** a keeper's goods, from their dialogue (UM7-3); Esc goes back to them */
  openShop(who: string): void { this.openWares(who); this.back = () => this.openPerson(who); }

  private openWares(who: string | null): void {
    this.page();
    // a version 2 game's gear and goods: four places and a catalogue of tiles (the operator's request of 16/11/2026, journal Passes EP1 to EP3); today's game keeps the former page
    const host = { state: () => this.st, act: (a: Action) => this.run(a, true), close: () => this.leave(), poor: () => this.hint('poor') };
    this.show(isV2(this.st) && this.st.v2?.gear ? gearPage(who, host) : waresPage(who, host));
    // a keeper's goods, the first time (journal Passe TU3, TU-3: bargaining)
    if (who) this.hint('shop');
  }

  /** the settings (journal Passe RG2, RG-1: the four parts, in place of lot V8's sound page; V opens it on the sound): graphics, sound, controls, language */
  openSettings(section?: SettingsSection): void {
    this.page();
    this.show(settingsPage({ section, close: () => this.closeModal() }));
    this.shownPage = 'settings';
  }

  private openMap(): void {
    const s = this.st, moves = actions(s).filter((o) => o.action.type === 'move');
    this.page();
    const { root, card, body, foot } = pageShell(tx('ui.cite'));
    body.innerHTML = `<h2 class="pm-h">${tx('ui.cite')}</h2><p class="pm-sub">${tx('ui.youAreIn', { place: esc(placeName(s.place, isV2(s))) })}</p>`;
    // the sheet says walking is free: no tag on each line (the audit of journal Passe UM1)
    for (const o of moves) { const b = this.optionButton(o); b.querySelector('.cost.free')?.remove(); body.appendChild(b); }
    const close = footBtn('Esc', tx('ui.close'), () => this.closeModal()); foot.appendChild(close); close.classList.add('out');
    arrowKeys(card);
    document.body.appendChild(root); this.current = root; this.shownPage = 'map';
    ((card.querySelector('.pm-btn:not(:disabled)') as HTMLButtonElement) ?? close).focus();
  }

  /** the guide (journal Passe TU1, src/ui/tutorial.ts): a page of the menu, H */
  openGuide(first?: string): void {
    this.page();
    this.show(guidePage({ state: () => this.st, snapshot: this.host.snapshot, replay: () => void this.tour() }, () => this.closeModal(), first));
    markTold();
  }

  /** the tour over the live page (journal Passe TU1): the scene's keys held while a band shows */
  async tour(): Promise<boolean> {
    this.closeModal(); this.modal = true; this.prompt.classList.remove('on');
    const hint = (i: number) => () => this.hints.children[i] ?? null;
    const at = { status: () => this.status, figs: () => this.figs, list: hint(0), menu: hint(1) };
    const seen = await runTour(this.st, TOUR.map((s) => ({ title: s.title, body: s.body, target: s.at ? at[s.at] : undefined })));
    this.modal = false; markTold();
    return seen;
  }

  /** the tutorial's hints (journal Passe TU3, TU-3): each once in this browser, one after another, over what is open; Space (X) opens its chapter of the guide */
  private hintsQ: Promise<void> = Promise.resolve();
  /** the page's welcome is done: a mark or a wound shows its hint from then on (never over the news or the tour) */
  private welcomed = false;
  /** a person's mark shows on the scene for the first time (the operator's MK-11, journal Passe MK2): its hint, once the page's welcome is done */
  markShown(): boolean { if (!this.welcomed || this.modal) return false; this.hint('npcMark'); return true; }
  hint(id: HintId, who?: string): void {
    if (!this.host.tutorial || !isV2(this.st) || hintSeen(id)) return;
    markHint(id);
    this.hintsQ = this.hintsQ.then(async () => {
      const was = this.modal, near = this.prompt.classList.contains('on');
      this.modal = true; this.prompt.classList.remove('on');
      const r = await showHint(this.st, id, who);
      if (r === 'more') { this.openGuide(hintChapter(id)); return; }
      // the page or band under the hint keeps its state (the setter clears the bands' classes only when nothing was open)
      if (!was) { this.modal = false; if (near) this.prompt.classList.add('on'); }
    });
  }

  /** what a page shows once it is ready (journal Passe TU3): a new game's tour (TU-2, TU-9), else the line of a game begun before (TU-8), then the hints this
   *  moment calls for (TU-3); waits for the news to be read */
  async welcome(fresh: boolean): Promise<void> {
    if (!this.host.tutorial || !isV2(this.st)) return;
    await this.newsRead;
    if (fresh) await this.tour();
    else if (!told()) { this.hint('guide'); markTold(); }
    this.welcomed = true;
    this.todo?.arrive(this.st, this.boutNow());
    this.momentHints();
  }

  /** the hints of the moment: the eve of a bout, the evening, a wound, a mark (and the square's, given by the square's page) */
  momentHints(): void {
    const s = this.st, next = s.tournament.matches.filter((m) => !m.winner && (m.a === 'player' || m.b === 'player')).map((m) => m.day).sort((x, y) => x - y)[0];
    // the afternoon only: its strongroom and its sand are shut in the evening (journal Passe CO2)
    if (next === s.day + 1 && s.slot === 'afternoon') this.hint('eve');
    if (s.slot === 'evening') this.hint('evening');
    if (s.player.injury > 0) this.hint('hurt');
    if (marksOf(s) > 0) this.hint('mark');
    if ((s.v2?.wins ?? 0) > 0) this.hint('vigour');
    // Master Corvin's first note (lot 3 of « La Brute »): where his notebook is
    if (s.v2?.$notes?.length) this.hint('notebook');
  }

  private openJournal(): void { this.page(); this.show(journalPage(this.st, () => this.closeModal())); this.shownPage = 'journal'; }

  /** Master Corvin's notebook (lot 3 of « La Brute », src/ui/notebook.ts): Enter or Space watches a rehearsed bout again in the arena, nothing of the game changed */
  openNotebook(first?: string): void {
    this.page();
    this.show(notebookPage(this.st, () => this.leave(), (which) => { writeSave(this.st); this.closeModal(); this.host.reload({ scene: 'arena', review: which }); }, first));
    this.shownPage = 'notebook';
  }

  private openBoard(): void {
    this.page();
    // the next opponent's match sheet from their line (GP-12), Esc back to the board
    this.show(boardPage(this.st, standings(this.st), () => this.closeModal(), isV2(this.st) && autoNextBout(this.st) ? () => this.openMatchSheet(() => this.openBoard()) : undefined));
    this.shownPage = 'board';
  }

  private show(p: { root: HTMLElement; focus(): void }): void { document.body.appendChild(p.root); this.current = p.root; p.focus(); }

  /** a page on the full-screen veil takes the place of what was open */
  private page(): void { this.closeModal(); this.modal = true; this.prompt.classList.remove('on'); document.body.classList.add('pm-full'); }

  /** the one menu (UM-R1): every page with its key, then the saves */
  private openMenu(): void {
    this.page();
    const s = this.st, { root, card, body, foot } = pageShell(tx('ui.menu'), 'pm-menu');
    body.innerHTML = `<h2 class="pm-h">${tx('ui.menu')}</h2>`;
    // each page's key: the player's (the remapping, journal Passe RM2, RM-6)
    const add = (label: string, f: () => void, act: Act | '' = '') => { const b = el('button', 'pm-btn', `<span>${esc(label)}</span>${act ? bindCap(act) : ''}`); b.addEventListener('click', f); body.appendChild(b); };
    add(tx('ui.map'), () => this.openMap(), 'map'); add(tx('ui.journal'), () => this.openJournal(), 'journal'); add(tx('ui.tournament'), () => this.openBoard(), 'board');
    // Master Corvin's notebook (lot 3 of « La Brute »): a line of its own, no key
    if (isV2(s)) add(tx('nb.open'), () => this.openNotebook());
    // the match sheet of the next bout (GP-12 « La fiche dès que l’adversaire est connu »)
    const nb = isV2(s) ? autoNextBout(s) : null;
    if (nb) add(tx('prep.sheet.menu', { name: fighterName(nb.foeId), day: nb.day }), () => this.openMatchSheet());
    if (isV2(s)) { add(tx('v2.skills.view'), () => this.openSkills(false), 'skills'); add(tx('v2.gear.view'), () => this.openGear(), 'gear'); add(tx('set.open'), () => this.openSettings(), 'settings'); }
    // the guide (journal Passe TU3, TU-7): a line of its own
    if (isV2(s)) add(tx('tut.guide'), () => this.openGuide(), 'guide');
    body.appendChild(el('p', 'pm-sub pm-gap', tx('ui.menu.saves')));
    add(tx('ui.menu.saveFile'), () => downloadSave(s));
    add(tx('ui.menu.loadFile'), () => {
      const i = el('input'); i.type = 'file'; i.accept = 'application/json,.json';
      i.addEventListener('change', async () => { const f = i.files?.[0]; if (!f) return; try { writeSave(await loadSaveFile(f)); this.host.reload(); } catch (e) { this.closeModal(); void this.card(`<p>${esc((e as Error).message)}</p>`); } });
      i.click();
    });
    add(tx('ui.menu.quit'), () => leavePage(location.pathname));
    const back = footBtn('Esc', tx('ui.menu.back'), () => this.closeModal()); foot.appendChild(back); back.classList.add('out');
    arrowKeys(card);
    document.body.appendChild(root); this.current = root;
    (card.querySelector('.pm-btn') as HTMLButtonElement).focus();
  }
}
