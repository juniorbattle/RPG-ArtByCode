import type { TimeOfDay } from '../atmosphere/DayState';
import { fontsReady, installDesign } from '../ui/design/system';
import { CSS } from './ArenaHud';
import { DYN_CSS, DYN_TEXTS_EN, DYN_TEXTS_FR_GAME, type DynTexts } from './DynamicHud';
import type { AutoGauge, AutoHudModel, AutoReplay, ReplayEvent, Seat } from './autoView';
import { skillName, tx, word } from '../narrative/text';
import { FOE_SKILLS } from '../combat/v2duel';
import { actName, bindCap, keyCap } from '../input/caps';
import { keysOf, onSettings } from '../settings/settings';
import { firstSlot } from '../settings/keys';

/** The HUD of the duel played by the computer (lot 2 of briefs/combat-auto.md § 17.3, journal Passe LC3): « deux barres de charge, les PV, les jauges, les PA,
 *  les quatre compétences et leurs recharges, ×2 et « Passer » » (§ 17.3). Built on the arena HUD's rules (ArenaHud.ts and DynamicHud.ts: direction A
 *  « Voile », the tone following the arena's day state, the embedded fonts, no text under 16 px on a computer or 14 px on a phone): each fighter's card holds
 *  its health, its gauge toward a break (DB5-4), its wards and boosts, and what it charges now on the timeline with the charge filling; Ren's card his AP;
 *  the foot of the screen Ren's four skills in his order (AC-09), each with its AP and its cooldown (DB5-3), the one charging lit; then ×2 and « Skip » (AC-13,
 *  « Garder DB5 : PV ×2, avec ×2 et Passer »). The player does nothing in the duel: the keys are the duel's own (the remapping, journal Passe RM3), the attack's
 *  key for ×2, the dodge's for « Skip », the pause's to pause; every DOM write goes through a cache. */

export interface AutoTexts extends DynTexts {
  speed: string; speedSub: string; speedOn: string; skip: string; skipSub: string;
  charging: (name: string) => string; order: string; secs: (n: number) => string; waiting: string; clash: string;
}
const EN_EXTRA = { speed: '×2', speedSub: 'twice as fast', speedOn: 'back to ×1', skip: 'Skip', skipSub: 'to the result', charging: (n: string) => `Charging ${n}`, order: 'Your order', secs: (n: number) => `${n} s`, waiting: 'At your next choice', clash: 'Clash' };
const FR_EXTRA = { speed: '×2', speedSub: 'deux fois plus vite', speedOn: 'retour à ×1', skip: 'Passer', skipSub: 'au résultat', charging: (n: string) => `Charge : ${n}`, order: 'Votre ordre', secs: (n: number) => `${n} s`, waiting: 'À votre prochain choix', clash: 'Entrechoc' };
export const AUTO_TEXTS_EN: AutoTexts = { ...DYN_TEXTS_EN, ...EN_EXTRA, restart: 'An official bout cannot be restarted' };
export const AUTO_TEXTS_FR: AutoTexts = { ...DYN_TEXTS_FR_GAME, ...FR_EXTRA };

/** the additions to the arena HUD's rules: each card's charge on the timeline, the foot's four skills in their order, ×2 and « Skip » */
const AUTO_CSS = `
#ah-pause .pad-only{display:none}
body.cdt-settings #ah-pause>div{visibility:hidden}
#ah-pause .ah-set{pointer-events:auto;display:inline-flex;align-items:center;gap:10px;margin-top:18px;padding:4px 0;font:inherit;font-size:var(--ds-fs-small);color:var(--ds-ivory);background:none;border:0;cursor:pointer}
#ah-pause .ah-set:hover,#ah-pause .ah-set:focus{color:var(--ds-accent);outline:0}
body.pm-pad #ah-pause .pad-only{display:flex;justify-content:center;align-items:center;gap:10px}
body.pm-pad #ah-pause .kb{display:none}
/* the cards are taller than the other duels' (the gauge, the charge and its name on their own line, the state under them): the top veil reaches lower (journal Passe LC4: « Stunned » at 3.7:1 at the end of day) */
#arena-hud.auto .top{height:min(300px,42vh)}
#arena-hud .ah-ch{display:flex;flex-direction:column;align-items:flex-start;gap:4px;margin-top:8px}
#arena-hud .ah-f.r .ah-ch{align-items:flex-end}
#arena-hud .ah-ch>span{min-height:1.3em;font-size:var(--ds-fs-small);line-height:1.3;color:var(--ds-muted);white-space:nowrap}
#arena-hud .ah-ch.big>span{color:var(--ds-accent)}
#arena-hud .ah-cb{position:relative;align-self:stretch;height:3px;background:var(--ds-trough)}
#arena-hud .ah-cb i{position:absolute;top:0;bottom:0;left:0;width:0;background:var(--ds-muted)}
#arena-hud .ah-f.r .ah-cb i{left:auto;right:0}
#arena-hud .ah-ch.big .ah-cb i{background:var(--ds-accent)}
#arena-hud .ah-ch.off{visibility:hidden}
#arena-hud.auto #ah-bar{gap:10px}
.ah-b.slot{grid-template-columns:auto 1fr;cursor:pointer}
.ah-b.slot.waiting{box-shadow:inset 0 0 0 1px var(--ds-accent)}.ah-b.slot.waiting b{color:var(--ds-accent)}
.ah-b.slot .ord{grid-row:1 / span 2;grid-column:1;font:400 var(--ds-fs-label)/1 var(--ds-title);color:var(--ds-muted);min-width:14px;text-align:center}
.ah-b.slot b{color:var(--ds-ivory)}
.ah-b.slot.charging b,.ah-b.slot.charging .ord{color:var(--ds-accent)}
.ah-b.slot.cooling b{color:var(--ds-muted)}
.ah-b.slot.noap em{color:var(--ds-accent)}
.ah-b.slot em .cdn{display:none;font-variant-numeric:tabular-nums}
.ah-b.slot.cooling em .cdn{display:inline}.ah-b.slot.cooling em q,.ah-b.slot.cooling em .fam{display:none}
.ah-b.slot .cdv{position:absolute;left:0;bottom:0;height:3px;width:0;background:var(--ds-muted)}
.ah-b.ctl b{color:var(--ds-ivory)}
.ah-b.ctl.active b,.ah-b.ctl.active em{color:var(--ds-accent)}
#arena-hud .ah-b.ctl.active kbd{border-color:var(--ds-accent);color:var(--ds-accent)}
@media (max-width:1240px){.ah-b.slot .ord{grid-row:1;margin-bottom:2px}}
@media (max-height:480px){#arena-hud .ah-ch{margin-top:3px;gap:2px}}
`;

export class AutoHud {
  readonly el: HTMLDivElement;
  private c = new Map<string, unknown>();
  private btn = new Map<string, HTMLButtonElement>();
  private q = <T extends Element>(s: string) => this.el.querySelector(s) as T;
  onAction: (id: string, down: boolean) => void = () => {};
  project: (who: Seat) => { x: number; y: number } = () => ({ x: 0, y: 0 });
  readonly ready: Promise<void>;
  private names: Record<Seat, string>;

  /** the pause's keyboard line: the words while Space pauses, else the player's key and the words after it (the remapping, journal Passe RM2) */
  private resumeLine(): string { return firstSlot(keysOf().pause)?.c === 'Space' ? this.t.resume : `${actName('pause')} ${this.t.resumePad ?? ''}`.trim(); }

  /** `name(id)`: an action's name in the page's language (Ren's skills, a rival's skills and blows) */
  constructor(replay: AutoReplay, portraits: Record<Seat, HTMLCanvasElement | null>, names: Record<Seat, string>, private name: (id: string) => string, private t: AutoTexts = AUTO_TEXTS_EN, time: TimeOfDay | null = null) {
    installDesign(time);
    this.ready = fontsReady();
    this.names = names;
    for (const [id, css] of [['arena-hud-css', CSS], ['arena-dyn-css', DYN_CSS], ['arena-auto-css', AUTO_CSS]] as const) {
      if (!document.getElementById(id)) { const st = document.createElement('style'); st.id = id; st.textContent = css; document.head.appendChild(st); }
    }
    this.el = document.createElement('div'); this.el.id = 'arena-hud'; this.el.classList.add('dyn', 'auto');
    const M = replay.hud();
    const slots = M.slots.map((s, i) => `<button class="ah-b slot wide" type="button" tabindex="-1" data-slot="${s.id}" aria-label="${i + 1}. ${this.name(s.id)}"><span class="ord">${bindCap(`skill${i + 1}` as 'skill1')}</span><b>${this.name(s.id)}</b><em><span class="fam">${t.families[s.family] ?? ''}</span><span class="cdn"></span></em><i class="pg"></i><i class="cdv"></i></button>`).join('');
    const ctl = (id: 'speed' | 'skip', act: 'attack' | 'dodge', label: string, sub: string) => `<button class="ah-b ctl wide" type="button" data-act="${id}" aria-label="${label} (${actName(act)})">${bindCap(act)}<b>${label}</b><em>${sub}</em></button>`;
    const card = (who: Seat, side: 'l' | 'r', sub: string) => `<div class="ah-f ${side}" id="ah-${who}" aria-label="${names[who]}, ${sub}"><canvas class="ah-port" width="24" height="24" aria-hidden="true"></canvas><div class="ah-card"><div class="ah-nm">${names[who]}<em></em></div><div class="ah-hp" role="meter" aria-label="${t.health(names[who])}" aria-valuemin="0" aria-valuemax="${M[who].maxHp}"><u></u><i></i></div><div class="ah-rs" role="meter" aria-label="${t.breakBar}" aria-valuemin="0" aria-valuemax="100"><span>${t.breakBar}</span><div class="ah-rb"><i></i><s></s></div></div><div class="ah-ch off" aria-live="off"><span></span><div class="ah-cb"><i></i></div></div><div class="ah-tags"><b class="wd"></b><b class="bs"></b></div><div class="ah-state"></div></div></div>`;
    this.el.setAttribute('aria-label', t.subtitle);
    this.el.innerHTML = `<div class="top"></div><div class="bot"></div>
      ${card('ren', 'l', t.subRen)}${card('marek', 'r', t.subMarek)}
      <div id="ah-dmg"></div><div id="ah-bar" aria-label="${t.order}">${slots}<span class="ah-sep"></span>${ctl('speed', 'attack', t.speed, t.speedSub)}${ctl('skip', 'dodge', t.skip, t.skipSub)}</div>
      <div id="ah-ko" role="status"><div><b></b><span></span></div></div>
      <div id="ah-pause" role="status"><div><b>${t.pause}</b><span class="kb">${this.resumeLine()}</span><span class="pad-only">${bindCap('pause')}${t.resumePad ?? ''}</span><button class="ah-set" type="button">${keyCap('Esc')}${tx('set.title')}</button></div></div>
      <div id="ah-rotate" role="alert"><div><b>${t.title}</b><span>${t.rotate}</span></div></div>`;
    document.body.appendChild(this.el);
    onSettings(() => { const kb = this.el.querySelector('#ah-pause .kb'); if (kb) kb.textContent = this.resumeLine(); });
    this.el.querySelector('#ah-pause .ah-set')?.addEventListener('click', () => window.dispatchEvent(new Event('cdt-open-settings')));
    for (const who of ['ren', 'marek'] as Seat[]) {
      const src = portraits[who], cv = this.q<HTMLCanvasElement>(`#ah-${who} .ah-port`);
      // a whole number of pixels per texel (L4): 2 or 1 times a baked 32 px face, 3 or 2 times a generated 24 px one
      if (src) { cv.width = src.width; cv.height = src.height; if (src.width > 24) { cv.style.setProperty('--ah-s', `${2 * src.width}px`); cv.style.setProperty('--ah-n', `${src.width}px`); } const x = cv.getContext('2d')!; x.imageSmoothingEnabled = false; if (who === 'marek') { x.translate(src.width, 0); x.scale(-1, 1); } x.drawImage(src, 0, 0); }
    }
    this.el.querySelectorAll<HTMLButtonElement>('.ah-b.ctl').forEach((b) => {
      const id = b.dataset.act!;
      this.btn.set(id, b);
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); this.onAction(id, true); this.flash(id); });
    });
    // the hand (SY-09): a click on a skill's line presses it, as its key does
    this.el.querySelectorAll<HTMLButtonElement>('.ah-b.slot').forEach((b, i) => {
      this.btn.set(`slot:${b.dataset.slot}`, b); this.btn.set(`skill${i + 1}`, b);
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); this.onAction(`skill${i + 1}`, true); this.flash(`skill${i + 1}`); });
    });
  }

  still(on: boolean): void {
    this.el.classList.toggle('still', on);
    if (!on) this.q('#ah-dmg').textContent = '';
  }

  flash(id: string): void {
    const b = this.btn.get(id === 'attack' ? 'speed' : id === 'dodge' ? 'skip' : id); if (!b) return;
    b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit');
  }

  private set(k: string, v: unknown, apply: () => void): void { if (this.c.get(k) !== v) { this.c.set(k, v); apply(); } }
  private cls(k: string, el: Element, c: string, on: boolean): void { this.set(`${k}|${c}`, on, () => el.classList.toggle(c, on)); }

  private card(id: Seat, g: AutoGauge, stateText: string): void {
    const root = this.q(`#ah-${id}`), t = this.t;
    this.set(`hp${id}`, g.hpPct, () => { (root.querySelector('.ah-hp i') as HTMLElement).style.width = `${g.hpPct}%`; (root.querySelector('.ah-hp u') as HTMLElement).style.width = `${g.hpPct}%`; root.querySelector('.ah-hp')!.setAttribute('aria-valuenow', String(g.hp)); });
    this.set(`hpt${id}`, g.hp, () => { root.querySelector('.ah-nm em')!.textContent = `${g.hp} / ${g.maxHp}`; });
    const rs = root.querySelector('.ah-rs')!, gp = Math.round(g.gaugePct);
    this.set(`rs${id}`, gp, () => { (rs.querySelector('i') as HTMLElement).style.width = `${gp}%`; rs.setAttribute('aria-valuenow', String(gp)); });
    const stun = g.broken ? Math.round(100 - (100 * g.stunLeft) / Math.max(0.01, g.stunDur)) : 0;
    this.set(`rss${id}`, stun, () => { (rs.querySelector('s') as HTMLElement).style.width = `${stun}%`; });
    this.cls(`rsb${id}`, rs, 'brk', g.broken);
    const label = g.broken ? t.brokenTag(Math.ceil(g.stunLeft)) : t.breakBar;
    this.set(`rsl${id}`, label, () => { rs.querySelector('span')!.textContent = label; });
    const wd = root.querySelector('.ah-tags .wd')!, bs = root.querySelector('.ah-tags .bs')!;
    const w = g.ward > 0 ? `${t.wardOn} ${Math.ceil(g.ward)} s` : '', b = g.boost > 0 ? `${t.boostOn} ${Math.ceil(g.boost)} s` : '';
    this.set(`wd${id}`, w, () => { wd.textContent = w; wd.classList.toggle('on', !!w); });
    this.set(`bs${id}`, b, () => { bs.textContent = b; bs.classList.toggle('on', !!b); });
    // the charge on the timeline: what it charges, filling until it leaves (a skill or a heavy blow in the accent)
    const ch = root.querySelector('.ah-ch')!, c = g.charge, big = !!c && c.kind !== 'light';
    this.cls(`cho${id}`, ch, 'off', !c);
    this.cls(`chb${id}`, ch, 'big', big);
    const nm = c ? t.charging(this.name(c.id)) : '';
    this.set(`chn${id}`, nm, () => { ch.querySelector('span')!.textContent = nm; });
    const w2 = c ? Math.round(c.pct) : 0;
    this.set(`chw${id}`, w2, () => { (ch.querySelector('i') as HTMLElement).style.width = `${w2}%`; });
    const se = root.querySelector('.ah-state')!;
    this.set(`st${id}`, stateText, () => { if (stateText) se.textContent = stateText; se.classList.toggle('on', !!stateText); });
  }

  /** per frame: the replay's state to the DOM (cached writes only) */
  update(M: AutoHudModel, visible: boolean, paused: boolean, fast: boolean, over: boolean): void {
    const t = this.t;
    this.cls('hud', this.el, 'off', !visible);
    this.card('ren', M.ren, M.ren.broken ? t.stunned : over && M.winner === 'marek' ? t.down : '');
    this.card('marek', M.marek, M.marek.broken ? t.stunned : over && M.winner === 'ren' ? t.down : '');
    for (const s of M.slots) {
      const b = this.btn.get(`slot:${s.id}`); if (!b) continue;
      this.cls(`c${s.id}`, b, 'charging', s.charging);
      this.cls(`k${s.id}`, b, 'cooling', s.cool > 0 && !s.charging);
      this.cls(`a${s.id}`, b, 'noap', !s.usable && s.cool <= 0 && !s.charging);
      this.cls(`w${s.id}`, b, 'waiting', s.waiting);
      const cd = s.cool > 0 && !s.charging ? Math.ceil(s.cool) : 0;
      this.set(`cd${s.id}|${s.waiting}`, cd, () => { (b.querySelector('em .cdn') as HTMLElement).textContent = cd ? t.secs(cd) : ''; b.title = s.waiting ? t.waiting : cd ? t.secs(cd) : ''; });
      const cw = cd ? Math.round(s.coolPct) : 0;
      this.set(`cw${s.id}`, cw, () => { (b.querySelector('.cdv') as HTMLElement).style.width = `${cw}%`; });
      const pg = s.charging && M.ren.charge ? Math.round(M.ren.charge.pct) : 0;
      this.set(`pg${s.id}`, pg, () => { (b.querySelector('.pg') as HTMLElement).style.width = `${pg}%`; });
    }
    const sp = this.btn.get('speed')!;
    this.cls('fast', sp, 'active', fast);
    const sub = fast ? t.speedOn : t.speedSub;
    this.set('spsub', sub, () => { sp.querySelector('em')!.textContent = sub; });
    for (const id of ['speed', 'skip']) this.cls(`on${id}`, this.btn.get(id)!, 'on', !over);
    this.cls('pause', this.q('#ah-pause'), 'on', paused && !over);
  }

  /** the events' feedback: floating numbers, a dodge, a guard, a break, a ward or a boost taking hold, the K.O. screen */
  onEvents(evs: ReplayEvent[]): void {
    const t = this.t;
    for (const e of evs) {
      if (e.type === 'impact') this.float(e.to as Seat, e.result === 'dodged' ? t.dodged : e.result === 'guarded' ? t.guarded(e.damage as number) : `-${e.damage}`, e.result as string);
      else if (e.type === 'clash') { this.float(e.who as Seat, t.clash, 'guarded'); this.float(e.to as Seat, t.clash, 'guarded'); }
      else if (e.type === 'break') this.float(e.who as Seat, t.breakFloat, 'guardbreak', -34);
      else if (e.type === 'effect') this.float(e.who as Seat, e.family === 'defensive' ? t.wardOn : t.boostOn, 'ap', -34);
      else if (e.type === 'ko') { const ko = this.q('#ah-ko'); ko.querySelector('b')!.textContent = e.who === 'marek' ? t.victory : t.defeat; ko.querySelector('span')!.textContent = t.isDown(this.names[e.who as Seat]); ko.classList.add('on'); this.el.classList.add('ko'); }
      else if (e.type === 'reset') { this.q('#ah-ko').classList.remove('on'); this.el.classList.remove('ko'); this.q('#ah-dmg').textContent = ''; }
    }
  }

  private float(who: Seat, text: string, cls: string, dy = 26): void {
    const p = this.project(who), el = document.createElement('div');
    el.className = cls; el.textContent = text;
    el.style.left = `${Math.round(p.x)}px`; el.style.top = `${Math.round(p.y + dy)}px`;
    this.q('#ah-dmg').appendChild(el);
    setTimeout(() => { if (!this.el.classList.contains('still')) el.remove(); }, 1100);
  }
}

/** an action's name on the cards and the foot (the page's language): Ren's light attack and his skills, a rival's blows and skills */
export function autoActionName(id: string, _t?: unknown): string {
  if (id === 'light' || id === 'm_light') return tx('auto.light');
  if (id === 'm_heavy') return tx('auto.heavy');
  const foe = FOE_SKILLS[id];
  return foe ? word(foe.name) : skillName(id);
}
