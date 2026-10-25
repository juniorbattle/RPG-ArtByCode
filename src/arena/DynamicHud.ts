import type { DynamicSim, DynEvent, DynActionId, DynFighterId } from '../combat/dynamic';
import type { TimeOfDay } from '../atmosphere/DayState';
import { fontsReady, installDesign } from '../ui/design/system';
import { CSS, TEXTS_EN, TEXTS_FR, type ArenaTexts, type Assist } from './ArenaHud';
import { dynHudModel, type DynGauge } from './dynamicView';

/** The HUD of the « tour par tour dynamique » (lot C2, journal Passe C2), behind its parameter (CB-10). Built on the arena HUD's rules
 *  (ArenaHud.ts, the interface's design system: direction C « Héraldique pixel », its tone following the arena's day state, the embedded fonts,
 *  no text under 16 px on a computer or 14 px on a phone) with what the specification asks it to read (§ 9, CB-6 « Comme recommandé »):
 *  - both fighters' health and resistance gauge; the opponent's is its « barre de break »; a broken gauge stays full while its stun drains;
 *  - the player's action points and four skills, each with its cost and family (offensive, defensive, support), no cooldown;
 *  - the opponent's priority (CB-4): through its whole sequence the attacks are locked, guard and dodge stay; a discreet sign says so;
 *  - the player's preparation (the heavy attack and the skills: the delay before they leave) and the effects running (Rempart, Ferveur);
 *  - the assistance (CB-7): discreet by default with the light sign of the opponent's sequence; « full » adds today's alert, the dodge
 *    window's bar and the floor telegraph; « off » removes the signs, never the player's own state. Every DOM write goes through a cache. */

export interface DynTexts extends ArenaTexts {
  resist: string; breakBar: string; brokenTag: (s: number) => string;
  defense: (foe: string) => string; defenseHint: string; foeBroken: (foe: string) => string; youBroken: string;
  pushed: string; refund: (n: number) => string; denied: string; breakFloat: string;
  heavySub: string; families: Record<string, string>; skillShorts: Partial<Record<DynActionId, string>>; preparing: string;
  wardTag: (s: number) => string; boostTag: (s: number) => string; wardOn: string; boostOn: string;
}
export const DYN_TEXTS_FR: DynTexts = {
  ...TEXTS_FR,
  resist: 'Résistance', breakBar: 'Break', brokenTag: (s) => `Brisé · ${s} s`,
  defense: (f) => `${f} attaque`, defenseHint: 'Garde ou esquive', foeBroken: (f) => `${f} brisé — frappez !`, youBroken: 'Résistance brisée',
  pushed: 'Repoussé', refund: (n) => `${n} PA rendus`, denied: 'Défense !', breakFloat: 'Brisé !',
  heavySub: 'préparée', families: { offensive: 'offensive', defensive: 'défense', support: 'soutien' },
  skillShorts: { t1: 'Éclair', t2: 'Fente', t3: 'Tourbillon', t4: 'Estocade', d1: 'Rempart', s1: 'Ferveur' }, preparing: 'Préparation',
  wardTag: (s) => `Rempart ${s} s`, boostTag: (s) => `Ferveur ${s} s`, wardOn: 'Rempart', boostOn: 'Ferveur',
};
export const DYN_TEXTS_EN: DynTexts = {
  ...TEXTS_EN,
  resist: 'Resistance', breakBar: 'Break', brokenTag: (s) => `Broken · ${s} s`,
  defense: (f) => `${f} attacks`, defenseHint: 'Guard or dodge', foeBroken: (f) => `${f} broken — strike!`, youBroken: 'Resistance broken',
  pushed: 'Pushed back', refund: (n) => `${n} AP back`, denied: 'Defend!', breakFloat: 'Broken!',
  heavySub: 'prepared', families: { offensive: 'offence', defensive: 'defence', support: 'support' },
  skillShorts: { t1: 'Flash', t2: 'Lunge', t3: 'Whirl', t4: 'Thrust', d1: 'Rampart', s1: 'Fervour' }, preparing: 'Preparing',
  wardTag: (s) => `Rampart ${s} s`, boostTag: (s) => `Fervour ${s} s`, wardOn: 'Rampart', boostOn: 'Fervour',
};

/** the additions to the arena HUD's rules: the resistance gauges, the effect tags, the phase sign, the locked and preparing buttons */
const DYN_CSS = `
#arena-hud .ah-rs{display:flex;align-items:center;gap:8px;margin-top:4px}
#arena-hud .ah-f.r .ah-rs{flex-direction:row-reverse}
#arena-hud .ah-rs>span{flex:none;font-size:var(--ds-fs-small);letter-spacing:.04em;color:var(--ds-muted);white-space:nowrap}
#arena-hud .ah-rb{position:relative;flex:1;height:calc(4px + 6 * var(--ds-px));border:calc(3 * var(--ds-px)) solid transparent;border-image:var(--ds-f-gauge) 3 fill / calc(3 * var(--ds-px)) stretch;image-rendering:pixelated}
#arena-hud .ah-rb i,#arena-hud .ah-rb s{position:absolute;top:0;bottom:0;left:0;text-decoration:none}
#arena-hud .ah-f.r .ah-rb i,#arena-hud .ah-f.r .ah-rb s{left:auto;right:0}
#arena-hud .ah-rb i{background:repeating-linear-gradient(90deg,var(--ds-goldHi) 0 4px,var(--ds-gold) 4px 6px)}
#arena-hud .ah-rb s{background:color-mix(in srgb,var(--ds-ink) 55%,transparent)}
#arena-hud .ah-rs.brk>span{color:var(--ds-amberHi)}
#arena-hud .ah-rs.brk .ah-rb i{background:var(--ds-amberHi);box-shadow:0 0 8px var(--ds-amber);animation:ahbrk .5s infinite alternate}
@keyframes ahbrk{to{opacity:.55}}
#arena-hud .ah-tags{display:flex;gap:6px;margin-top:6px;min-height:0}
#arena-hud .ah-f.r .ah-tags{justify-content:flex-end}
#arena-hud .ah-tags b{display:none;padding:0 4px;font:400 var(--ds-fs-small)/1.2 var(--ds-text);font-weight:700;letter-spacing:.04em;color:var(--ds-ink);border:calc(3 * var(--ds-px)) solid transparent;border-image:var(--ds-f-key) 3 fill / calc(3 * var(--ds-px)) stretch;image-rendering:pixelated;white-space:nowrap}
#arena-hud .ah-tags b.on{display:block}
#ah-phase{position:absolute;left:50%;top:84px;transform:translateX(-50%);padding:0 12px;text-align:center;white-space:nowrap;border:calc(4 * var(--ds-px)) solid transparent;border-image:var(--ds-f-btnAct) 4 fill / calc(4 * var(--ds-px)) stretch;image-rendering:pixelated;opacity:0;transition:opacity .12s}
#ah-phase.on{opacity:1}
#arena-hud.dyn #ah-wbar:not(.on){visibility:hidden}
#ah-phase.calm{border-image-source:var(--ds-f-btnHi)}
#ah-phase b{display:block;font:400 var(--ds-fs-pixel)/1.2 var(--ds-pixel);letter-spacing:.04em;color:var(--ds-goldHi);text-shadow:0 var(--ds-px) 0 var(--ds-ink)}
#ah-phase span{display:block;font-size:var(--ds-fs-small);line-height:1.2;letter-spacing:.1em;text-transform:uppercase;color:var(--ds-ivory)}
#ah-phase.nudge{animation:ahd .25s}
.ah-b.lock{border-image-source:var(--ds-f-btnOff)}
.ah-b.lock b,.ah-b.lock em{color:var(--ds-muted);opacity:.7}
.ah-b.lock kbd{opacity:.6}
.ah-b.prep{border-image-source:var(--ds-f-btnHi)}
.ah-b .pg{position:absolute;left:0;bottom:0;height:calc(2 * var(--ds-px));width:0;background:var(--ds-amber);box-shadow:0 0 6px var(--ds-amber)}
@media (max-width:1500px){.ah-b .fam{display:none}}
/* a narrow window: the cards widen (30vw), the sign leaves the top for the dodge window's place above the bar (the bar takes it when it shows) */
@media (max-width:1240px){#ah-phase{top:auto;bottom:94px}#arena-hud.wb #ah-phase{opacity:0}}
@media (max-height:480px){#arena-hud .ah-rs>span{display:none}#arena-hud .ah-rb{height:calc(2px + 6 * var(--ds-px))}#arena-hud .ah-rs{margin-top:3px}#arena-hud .ah-tags{margin-top:3px}#ah-phase{top:auto;bottom:72px;padding:0 8px;border-width:calc(3 * var(--ds-px))}#arena-hud.wb #ah-phase{opacity:0}#ah-phase b{font-size:var(--ds-fs-small)}#ah-phase span{display:none}}
@media (prefers-reduced-motion:reduce){#arena-hud .ah-rs.brk .ah-rb i,#ah-phase.nudge{animation:none}}
`;

type BarItem = '|' | { id: string; key: string; name: string; short?: string; sub: string; wide?: boolean };

export class DynamicHud {
  readonly el: HTMLDivElement;
  private c = new Map<string, unknown>();
  private btn = new Map<string, HTMLButtonElement>();
  private q = <T extends Element>(s: string) => this.el.querySelector(s) as T;
  onAction: (id: string, down: boolean) => void = () => {};
  project: (who: DynFighterId) => { x: number; y: number } = () => ({ x: 0, y: 0 });
  readonly ready: Promise<void>;

  constructor(sim: DynamicSim, portraits: Record<DynFighterId, HTMLCanvasElement | null>, private t: DynTexts = DYN_TEXTS_FR, time: TimeOfDay | null = null) {
    installDesign(time);
    this.ready = fontsReady();
    if (!document.getElementById('arena-hud-css')) { const st = document.createElement('style'); st.id = 'arena-hud-css'; st.textContent = CSS; document.head.appendChild(st); }
    if (!document.getElementById('arena-dyn-css')) { const st = document.createElement('style'); st.id = 'arena-dyn-css'; st.textContent = DYN_CSS; document.head.appendChild(st); }
    this.el = document.createElement('div'); this.el.id = 'arena-hud'; this.el.classList.add('dyn');
    const D = sim.D, A = D.actions;
    const diamonds = (n: number) => `<q>${'<i></i>'.repeat(n)}</q>`;
    const items: BarItem[] = [
      { id: 'guard', key: 'B', name: t.guard, sub: t.hold, wide: true }, { id: 'dodge', key: 'A', name: t.dodge, sub: t.ap1 }, '|',
      { id: 'light', key: '1', name: t.light, sub: t.apGain }, { id: 'heavy', key: '2', name: t.heavy, sub: t.heavySub, wide: true }, '|',
      ...D.loadout.map((id, i) => ({ id, key: String(3 + i), name: A[id].short ?? A[id].name, short: t.skillShorts[id] ?? A[id].short ?? A[id].name, sub: `${diamonds(A[id].apCost ?? 0)} <span class="fam">${t.families[A[id].family ?? ''] ?? ''}</span>`, wide: true })),
    ];
    const buttons = items.map((b) => {
      if (b === '|') return '<span class="ah-sep"></span>';
      const label = b.short ? `<span class="fn">${b.name}</span><span class="sn">${b.short}</span>` : b.name;
      return `<button class="ah-b${b.wide ? ' wide' : ''}" data-act="${b.id}" aria-label="${b.name} (${b.key})"><kbd>${b.key}</kbd><b>${label}</b><em>${b.sub}</em><i class="pg"></i></button>`;
    }).join('');
    const card = (who: DynFighterId, side: 'l' | 'r', sub: string) => `<div class="ah-f ${side}" id="ah-${who}"><canvas class="ah-port" width="24" height="24" aria-hidden="true"></canvas><div class="ah-card"><div class="ah-nm">${D.fighters[who].name}<span>${sub}</span><em></em></div><div class="ah-hp" role="meter" aria-label="${t.health(D.fighters[who].name)}" aria-valuemin="0" aria-valuemax="${D.fighters[who].maxHp}"><u></u><i></i></div><div class="ah-rs" role="meter" aria-label="${who === 'ren' ? t.resist : t.breakBar}" aria-valuemin="0" aria-valuemax="100"><span>${who === 'ren' ? t.resist : t.breakBar}</span><div class="ah-rb"><i></i><s></s></div></div>${who === 'ren' ? `<div class="ah-pips" aria-label="${t.apLabel}">` + '<b></b>'.repeat(D.ap.max) + '</div>' : ''}<div class="ah-tags"><b class="wd"></b><b class="bs"></b></div><div class="ah-state"></div></div></div>`;
    this.el.innerHTML = `<div class="top"></div><div id="ah-title">${t.title}<small>${t.subtitle}</small></div>
      ${card('ren', 'l', t.subRen)}${card('marek', 'r', t.subMarek)}
      <div id="ah-phase" role="status"><b></b><span></span></div>
      <div id="ah-alert"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 2l18 18-18 18L2 20z" stroke-width="2.4"/><rect x="18" y="9" width="4" height="14"/><rect x="18" y="26" width="4" height="4"/></svg><div><b></b><span></span></div></div>
      <div id="ah-dmg"></div><div id="ah-wbar" aria-hidden="true"><i></i><b>${t.window}<kbd>A</kbd></b></div><div id="ah-bar">${buttons}</div>
      <div id="ah-ko" role="status"><div><b></b><span>${t.restart}</span></div></div>
      <div id="ah-pause" role="status"><div><b>${t.pause}</b><span>${t.resume}</span></div></div>
      <div id="ah-rotate" role="alert"><div><b>${t.title}</b><span>${t.rotate}</span></div></div>`;
    document.body.appendChild(this.el);
    for (const who of ['ren', 'marek'] as DynFighterId[]) {
      const src = portraits[who], cv = this.q<HTMLCanvasElement>(`#ah-${who} .ah-port`);
      if (src) { const x = cv.getContext('2d')!; x.imageSmoothingEnabled = false; if (who === 'marek') { x.translate(24, 0); x.scale(-1, 1); } x.drawImage(src, 0, 0); }
    }
    this.el.querySelectorAll<HTMLButtonElement>('.ah-b').forEach((b) => {
      const id = b.dataset.act!;
      this.btn.set(id, b);
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); this.onAction(id, true); this.flash(id); });
      if (id === 'guard') for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) b.addEventListener(ev, () => this.onAction(id, false));
    });
  }

  still(on: boolean): void {
    this.el.classList.toggle('still', on);
    if (!on) this.q('#ah-dmg').textContent = '';
  }

  flash(id: string, cls: 'hit' | 'deny' = 'hit'): void {
    const b = this.btn.get(id); if (!b) return;
    b.classList.remove(cls); void b.offsetWidth; b.classList.add(cls);
  }

  private set(k: string, v: unknown, apply: () => void): void { if (this.c.get(k) !== v) { this.c.set(k, v); apply(); } }
  private cls(k: string, el: Element, c: string, on: boolean): void { this.set(`${k}|${c}`, on, () => el.classList.toggle(c, on)); }

  private gauge(id: DynFighterId, g: DynGauge, stateText: string): void {
    const root = this.q(`#ah-${id}`);
    this.set(`hp${id}`, g.hpPct, () => { (root.querySelector('.ah-hp i') as HTMLElement).style.width = `${g.hpPct}%`; (root.querySelector('.ah-hp u') as HTMLElement).style.width = `${g.hpPct}%`; root.querySelector('.ah-hp')!.setAttribute('aria-valuenow', String(g.hp)); });
    this.set(`hpt${id}`, g.hp, () => { root.querySelector('.ah-nm em')!.textContent = `${g.hp} / ${g.maxHp}`; });
    const rs = root.querySelector('.ah-rs')!;
    this.set(`rs${id}`, g.resistPct, () => { (rs.querySelector('i') as HTMLElement).style.width = `${g.resistPct}%`; rs.setAttribute('aria-valuenow', String(Math.round(g.resistPct))); });
    // a broken gauge: held full, the stun's time left drawn over it, its label the time left
    const stun = g.broken ? Math.round(100 - g.stunPct) : 0;
    this.set(`rss${id}`, stun, () => { (rs.querySelector('s') as HTMLElement).style.width = `${stun}%`; });
    this.cls(`rsb${id}`, rs, 'brk', g.broken);
    const label = g.broken ? this.t.brokenTag(Math.ceil(g.stunLeft)) : id === 'ren' ? this.t.resist : this.t.breakBar;
    this.set(`rsl${id}`, label, () => { rs.querySelector('span')!.textContent = label; });
    const wd = root.querySelector('.ah-tags .wd')!, bs = root.querySelector('.ah-tags .bs')!;
    const w = g.ward > 0 ? this.t.wardTag(Math.ceil(g.ward)) : '', b = g.boost > 0 ? this.t.boostTag(Math.ceil(g.boost)) : '';
    this.set(`wd${id}`, w, () => { wd.textContent = w; wd.classList.toggle('on', !!w); });
    this.set(`bs${id}`, b, () => { bs.textContent = b; bs.classList.toggle('on', !!b); });
    const se = root.querySelector('.ah-state')!;
    this.set(`st${id}`, stateText, () => { if (stateText) se.textContent = stateText; se.classList.toggle('on', !!stateText); });
  }

  /** per frame: the simulation's state to the DOM (cached writes only) */
  update(sim: DynamicSim, assist: Assist, visible: boolean, paused: boolean): void {
    const M = dynHudModel(sim), R = sim.f.ren, F = sim.f.marek, t = this.t, inc = sim.incoming(), full = assist === 'full', up = !!inc && inc.windowOpen && full;
    this.cls('hud', this.el, 'off', !visible);
    const renSt = R.state === 'stunned' ? t.stunned : R.state === 'down' ? t.down : R.state === 'pushed' ? t.pushed : M.prep ? t.preparing : R.guarding ? t.guarding : '';
    const foeSt = F.state === 'stunned' ? t.stunned : F.state === 'down' ? t.down : '';
    this.gauge('ren', M.ren, renSt); this.gauge('marek', M.marek, foeSt);
    this.el.querySelectorAll('#ah-ren .ah-pips b').forEach((u, k) => {
      const on = k < M.ap;
      this.set(`pip${k}`, on, () => { u.classList.toggle('on', on); if (on) { u.classList.remove('gain'); void (u as HTMLElement).offsetWidth; u.classList.add('gain'); } });
    });
    for (const [id, st] of Object.entries(M.buttons)) {
      const b = this.btn.get(id); if (!b) continue;
      this.cls(id, b, 'on', st === 'on'); this.cls(id, b, 'noap', st === 'noap'); this.cls(id, b, 'lock', st === 'locked');
    }
    // the action in its preparation: its button lit, the delay filling along its foot
    for (const id of ['heavy', ...sim.D.loadout]) {
      const b = this.btn.get(id)!, p = M.prep && M.prep.action === id ? M.prep.pct : -1;
      this.cls(`${id}p`, b, 'prep', p >= 0);
      const w = Math.max(0, Math.round(p));
      this.set(`${id}pg`, w, () => { (b.querySelector('.pg') as HTMLElement).style.width = `${w}%`; });
    }
    const dg = this.btn.get('dodge')!, gd = this.btn.get('guard')!;
    this.cls('dg', dg, 'open', up && sim.canReact('ren', 'dodge'));
    this.cls('gd', gd, 'active', M.guarding); this.cls('gd', gd, 'warn', up && !!inc && inc.kind === 'heavy' && R.guarding);
    for (const id of ['d1', 's1'] as DynActionId[]) { const b = this.btn.get(id); if (b) this.cls(`${id}a`, b, 'active', id === 'd1' ? M.ren.ward > 0 : M.ren.boost > 0); }
    // the priority's sign (CB-4): the opponent's sequence, its break, the player's (not with the assistance off)
    const ph = this.q<HTMLElement>('#ah-phase'), foe = sim.D.fighters.marek.name.split(' ')[0];
    const sign = assist === 'off' || !visible ? '' : M.phase === 'defense' ? 'defense' : M.phase === 'foeBroken' ? 'foeBroken' : M.phase === 'broken' ? 'broken' : '';
    this.cls('ph', ph, 'on', !!sign); this.cls('phc', ph, 'calm', sign === 'foeBroken');
    this.set('phT', sign, () => {
      if (!sign) return;
      ph.querySelector('b')!.textContent = sign === 'defense' ? t.defense(foe) : sign === 'foeBroken' ? t.foeBroken(foe) : t.youBroken;
      ph.querySelector('span')!.textContent = sign === 'defense' ? t.defenseHint : '';
    });
    const wb = this.q<HTMLElement>('#ah-wbar');
    this.cls('wb', wb, 'on', up && !R.react);
    // on a phone the sign sits where the dodge window's bar does: the bar, when it shows (full assistance), takes its place
    this.cls('wbroot', this.el, 'wb', up && !R.react);
    if (up) (wb.firstElementChild as HTMLElement).style.transform = `scaleX(${Math.max(0, inc!.windowRemaining / inc!.windowDur).toFixed(2)})`;
    const al = this.q<HTMLElement>('#ah-alert'), show = !!inc && full && visible;
    this.cls('al', al, 'on', show);
    if (show) {
      this.set('alT', inc!.action, () => { al.querySelector('b')!.textContent = inc!.action === 'm_heavy' ? t.alertHeavy : t.alertLight; });
      this.set('alS', inc!.windowOpen, () => { al.querySelector('span')!.textContent = inc!.windowOpen ? t.reactNow : ''; });
    }
    this.cls('pause', this.q('#ah-pause'), 'on', paused && !sim.over);
  }

  /** the events' feedback: floating numbers, the break, a push back and its points given back, a denied command, the KO screen */
  onEvents(evs: DynEvent[], sim: DynamicSim): void {
    const t = this.t;
    for (const e of evs) {
      if (e.type === 'impact') this.float(e.to, e.result === 'dodged' ? t.dodged : e.result === 'guarded' ? t.guarded(e.damage) : `-${e.damage}`, e.result);
      else if (e.type === 'apGain' && e.who === 'ren') this.float('ren', t.ap(e.amount), 'ap', -34);
      else if (e.type === 'break') this.float(e.who, t.breakFloat, 'guardbreak', -34);
      else if (e.type === 'effect') this.float(e.who, e.family === 'defensive' ? t.wardOn : t.boostOn, 'ap', -34);
      else if (e.type === 'pushed' && e.who === 'ren') { this.float('ren', e.refund ? `${t.pushed} · ${t.refund(e.refund)}` : t.pushed, 'stun', -34); this.flash(e.action, 'deny'); }
      else if (e.type === 'commandDenied' && e.who === 'ren') { this.flash(e.action, 'deny'); if (e.why === 'defense') { const ph = this.q<HTMLElement>('#ah-phase'); ph.classList.remove('nudge'); void ph.offsetWidth; ph.classList.add('nudge'); } }
      else if (e.type === 'reactDenied' && e.who === 'ren') this.flash('dodge', 'deny');
      else if (e.type === 'ko') { const ko = this.q('#ah-ko'); ko.querySelector('b')!.textContent = e.who === 'marek' ? t.victory : t.defeat; ko.querySelector('span')!.textContent = t.isDown(sim.D.fighters[e.who].name); ko.classList.add('on'); }
      else if (e.type === 'reset') { this.q('#ah-ko').classList.remove('on'); this.q('#ah-dmg').textContent = ''; }
    }
  }

  private float(who: DynFighterId, text: string, cls: string, dy = 26): void {
    const p = this.project(who), el = document.createElement('div');
    el.className = cls; el.textContent = text;
    el.style.left = `${Math.round(p.x)}px`; el.style.top = `${Math.round(p.y + dy)}px`;
    this.q('#ah-dmg').appendChild(el);
    setTimeout(() => { if (!this.el.classList.contains('still')) el.remove(); }, 1100);
  }
}
