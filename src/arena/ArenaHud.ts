import type { CombatSim, CombatEvent, FighterId, ActionId } from './CombatSim';

/** The arena's HUD (journal Passe P1): DOM over the canvas, in the game's own UI language (the loading screen: night ink #05070d, ivory
 *  #d9c9a8, pale gold #f1d9a0 for titles, the lamps' amber #e9a64c as the only accent, Segoe UI with wide letter-spacing, no external
 *  font). From the prototype's lean HUD (pass 11 of its report): two fighter panels (portrait, name, health with a damage trail, Ren's
 *  action points), the action bar grouped as defence | attacks | techniques with costs, cooldowns and the reaction cue, floating damage,
 *  and with the full assistance only the attack alert and the reaction window's bar. Every DOM write goes through a cache. */

export type Assist = 'subtle' | 'full' | 'off';

const CSS = `
#arena-hud{position:fixed;inset:0;pointer-events:none;color:#d9c9a8;font:14px/1.4 "Segoe UI",system-ui,sans-serif;z-index:20;user-select:none;-webkit-user-select:none}
#arena-hud.off>*:not(#ah-ko):not(#ah-pause){opacity:0}
#arena-hud .top{position:absolute;left:0;right:0;top:0;height:120px;background:linear-gradient(rgba(5,7,13,.62),rgba(5,7,13,0))}
#ah-title{position:absolute;left:18px;top:12px;letter-spacing:.3em;text-transform:uppercase;font-size:13px;color:#f1d9a0;text-shadow:0 1px 0 #05070d,0 0 8px #05070d,0 0 14px #05070d}
#ah-title small{display:block;margin-top:3px;font-size:10px;letter-spacing:.16em;color:#d9c9a8;opacity:.75}
#ah-title::after{content:'';display:block;width:132px;height:2px;margin-top:6px;background:linear-gradient(90deg,#e9a64c,rgba(233,166,76,0))}
.ah-f{position:absolute;top:58px;display:flex;gap:10px;align-items:flex-start}
.ah-f.l{left:18px}.ah-f.r{right:18px;flex-direction:row-reverse;text-align:right}
.ah-port{width:52px;height:52px;flex:none;image-rendering:pixelated;border:2px solid #0a0d16;box-shadow:0 0 0 1px rgba(233,166,76,.55),0 3px 0 1px rgba(0,0,0,.45);background:linear-gradient(#24304c,#0b1020)}
.ah-f.r .ah-port{box-shadow:0 0 0 1px rgba(198,90,74,.6),0 3px 0 1px rgba(0,0,0,.45);background:linear-gradient(#34262c,#120c10)}
.ah-card{position:relative;width:min(25vw,280px);padding:6px 11px 8px;background:rgba(6,9,18,.95);border:1px solid rgba(233,166,76,.4)}
.ah-f.r .ah-card{border-color:rgba(198,90,74,.55)}
.ah-nm{display:flex;align-items:baseline;font-size:13px;letter-spacing:.22em;text-transform:uppercase;color:#efe3c4}
.ah-nm span{margin-left:8px;font-size:11px;letter-spacing:.12em;color:#9aa3b8}
.ah-nm em{margin-left:auto;font:700 12px/1 "Segoe UI",system-ui,sans-serif;font-style:normal;letter-spacing:.04em;color:#f3e9d2;font-variant-numeric:tabular-nums}
.ah-f.r .ah-nm{flex-direction:row-reverse}.ah-f.r .ah-nm span{margin:0 8px 0 0}.ah-f.r .ah-nm em{margin:0 auto 0 0}
.ah-hp{position:relative;height:15px;margin-top:4px;background:#141a28;border:2px solid #0a0d16;box-shadow:0 0 0 1px rgba(207,196,168,.6)}
.ah-hp i,.ah-hp u{position:absolute;top:0;bottom:0;left:0}
.ah-f.r .ah-hp i,.ah-f.r .ah-hp u{left:auto;right:0}
.ah-hp u{background:#e9a64c;opacity:.85;transition:width .45s ease-in .35s}
.ah-hp i{background:repeating-linear-gradient(90deg,#b4cbe8 0 6px,#7290bc 6px 8px)}
.ah-f.r .ah-hp i{background:repeating-linear-gradient(90deg,#c8604e 0 6px,#8a3428 6px 8px)}
.ah-pips{display:flex;gap:9px;margin-top:7px;padding-left:3px}
.ah-pips b{width:10px;height:10px;transform:rotate(45deg);border:1.5px solid rgba(233,166,76,.65);display:block}
.ah-pips b.on{background:#e9a64c;box-shadow:0 0 8px rgba(233,166,76,.8)}
.ah-pips b.gain{animation:ahg .4s}
@keyframes ahg{40%{transform:rotate(45deg) scale(1.5)}}
.ah-state{position:absolute;left:0;right:0;top:100%;margin-top:4px;padding:0 11px;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#f1d9a0;text-shadow:0 1px 2px #000,0 0 6px #05070d;opacity:0;transition:opacity .15s}
.ah-state.on{opacity:1}
/* 60 px: the sub-label (« hold », « 1 AP », « breaks guard ») below the name, whole (54 px cut its lower half: the operator's decision P3, journal
   Passes UI1 / UI2); the phone rules below keep their 48 / 42 px */
#ah-bar{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);display:flex;gap:5px;pointer-events:auto;transition:opacity .15s}
.ah-sep{width:2px;align-self:stretch;margin:6px 4px;background:rgba(233,166,76,.25)}
.ah-b{position:relative;width:80px;height:60px;padding:6px 7px 5px;text-align:left;font:inherit;color:#d9c9a8;background:linear-gradient(#131b2e,#0a0f1c);border:1.5px solid rgba(120,130,156,.35);border-radius:3px;cursor:pointer;overflow:hidden;transition:border-color .1s;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.ah-b.wide{width:118px}.ah-b.tech b{font-size:11px;letter-spacing:.04em}
.ah-b kbd{position:absolute;top:5px;right:6px;min-width:17px;padding:0 4px;font:700 11px/16px "Segoe UI",system-ui,sans-serif;text-align:center;color:#05070d;background:#d9c9a8;border-radius:2px}
.ah-b b{display:block;margin-top:15px;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;color:#7f889c}
.ah-b em{display:block;margin-top:2px;font-size:11px;font-style:normal;color:#858da0;white-space:nowrap}
.ah-b.on b{color:#f3e9d2}.ah-b.on em{color:#aab2c4}
.ah-b em q{quotes:none;color:#e9a64c;letter-spacing:1px}
.ah-b.on{border-color:rgba(233,166,76,.85)}
.ah-b.noap{border-color:rgba(90,96,116,.3)}.ah-b.noap b{color:#5d6577}.ah-b.noap em{color:#b0705a}.ah-b.noap kbd{background:#6c7488}
.ah-b .cd{position:absolute;left:0;right:0;bottom:0;height:0;background:rgba(5,8,18,.8)}
.ah-b s{position:absolute;inset:0;display:none;place-items:center;font:700 20px "Segoe UI",system-ui,sans-serif;text-decoration:none;color:#f3e9d2;text-shadow:0 1px 3px #000;font-variant-numeric:tabular-nums}
.ah-b.cool s{display:grid}.ah-b.cool b,.ah-b.cool em{visibility:hidden}
.ah-b.open{border-color:#e9a64c;background:linear-gradient(#3a2a12,#1a1208);box-shadow:0 0 16px rgba(233,166,76,.75);animation:ahp .45s infinite alternate}
.ah-b.open kbd{background:#e9a64c}
@keyframes ahp{to{transform:translateY(-4px)}}
.ah-b.warn{border-color:#d0714e;box-shadow:0 0 12px rgba(208,113,78,.6)}
.ah-b.active{border-color:#a9c4e8;background:linear-gradient(#1c2c4a,#0b1424);box-shadow:0 0 14px rgba(143,180,224,.5)}
.ah-b.hit{animation:ahk .18s}.ah-b.deny{animation:ahd .25s}
@keyframes ahk{50%{transform:scale(.92)}}@keyframes ahd{25%{transform:translateX(-3px)}75%{transform:translateX(3px)}}
#ah-wbar{position:absolute;left:50%;bottom:80px;width:min(440px,70vw);height:8px;transform:translateX(-50%);background:rgba(5,8,16,.9);border:1px solid rgba(233,166,76,.7);opacity:0}
#ah-wbar.on{opacity:1}
#ah-wbar i{position:absolute;left:0;top:0;bottom:0;width:100%;transform-origin:left center;background:#e9a64c;box-shadow:0 0 8px rgba(233,166,76,.8)}
#ah-wbar b{position:absolute;left:0;bottom:12px;font-size:11px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:#f3e3bf;text-shadow:0 1px 2px #000,0 0 6px #05070d;white-space:nowrap}
#ah-wbar b kbd{display:inline-block;margin-left:6px;padding:0 4px;font:700 11px/15px "Segoe UI",system-ui,sans-serif;color:#05070d;background:#e9a64c;border-radius:2px}
#ah-alert{position:absolute;left:50%;top:27%;transform:translateX(-50%);display:flex;gap:12px;align-items:center;padding:8px 22px 8px 10px;background:rgba(8,11,20,.94);border:1px solid rgba(208,113,78,.6);opacity:0;transition:opacity .12s}
#ah-alert.on{opacity:1}
#ah-alert svg{width:36px;height:36px}
#ah-alert b{display:block;font-size:17px;letter-spacing:.2em;text-transform:uppercase;color:#f1d9a0}
#ah-alert span{display:block;margin-top:2px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#f3e3bf}
#ah-dmg div{position:absolute;transform:translate(-50%,0);font-weight:800;font-size:22px;letter-spacing:.04em;text-shadow:0 2px 0 rgba(0,0,0,.6),0 0 8px rgba(0,0,0,.5);animation:ahf 1.05s ease-out forwards;white-space:nowrap;font-variant-numeric:tabular-nums}
#ah-dmg .hit{color:#f6e2b0}#ah-dmg .guarded{color:#a9c4e8;font-size:17px}#ah-dmg .guardbreak{color:#e9a64c;font-size:24px}#ah-dmg .dodged{color:#cfdcf0;font-size:16px;letter-spacing:.2em}
#ah-dmg .ap{color:#e9a64c;font-size:15px}#ah-dmg .stun{color:#f1d9a0;font-size:15px;letter-spacing:.2em}
@keyframes ahf{0%{opacity:0;margin-top:6px}12%{opacity:1}100%{opacity:0;margin-top:-48px}}
#arena-hud.still #ah-dmg div{animation-delay:-.22s;animation-play-state:paused}
#ah-ko,#ah-pause{position:absolute;inset:0;display:none;place-items:center;background:rgba(5,7,13,.58);text-align:center;pointer-events:none}
#ah-ko.on,#ah-pause.on{display:grid}
#ah-ko b,#ah-pause b{display:block;font-weight:400;font-size:26px;letter-spacing:.34em;text-transform:uppercase;color:#f1d9a0}
#ah-ko b::after{content:'';display:block;width:180px;height:2px;margin:12px auto 0;background:linear-gradient(90deg,rgba(233,166,76,0),#e9a64c,rgba(233,166,76,0))}
#ah-ko span,#ah-pause span{display:block;margin-top:12px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#d9c9a8;opacity:.8}
#ah-rotate{position:absolute;inset:0;display:none;place-items:center;padding:24px;text-align:center;background:#05070d;pointer-events:auto}
#ah-rotate b{display:block;font-weight:400;font-size:15px;letter-spacing:.3em;text-transform:uppercase;color:#f1d9a0}
#ah-rotate span{display:block;margin-top:14px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;opacity:.75}
@media (orientation:portrait) and (max-width:820px){#ah-rotate{display:grid}}
@media (max-width:900px){.ah-b{width:56px;height:48px}.ah-b.wide{width:72px}.ah-b em{display:none}.ah-b b{font-size:10px;margin-top:17px}.ah-b.tech b{font-size:9px}.ah-sep{margin:6px 2px}#ah-bar{gap:3px}.ah-card{width:30vw}}
.ah-b .sn{display:none}
@media (max-width:900px){.ah-b .fn{display:none}.ah-b .sn{display:inline}}
/* phone in landscape: the cards, the alert and the bars shrink so the duel stays in view */
@media (max-height:480px){#ah-title{display:none}.ah-f{top:8px}.ah-port{width:36px;height:36px}.ah-card{padding:4px 8px 5px}.ah-nm{font-size:11px}.ah-nm span{display:none}.ah-hp{height:11px}.ah-pips{margin-top:4px;gap:7px}.ah-pips b{width:8px;height:8px}
  #ah-alert{top:24%;padding:4px 14px 4px 6px}#ah-alert svg{width:24px;height:24px}#ah-alert b{font-size:12px}#ah-alert span{font-size:10px}
  #ah-wbar{bottom:58px;height:6px}#ah-wbar b{font-size:9px;bottom:9px}#ah-bar{bottom:6px}.ah-b{height:42px}.ah-b b{margin-top:14px}.ah-top{height:70px}}
button:focus-visible{outline:3px solid #f1d9a0;outline-offset:2px}
@media (prefers-reduced-motion:reduce){.ah-b.open,.ah-b.hit,.ah-b.deny,.ah-pips b.gain{animation:none}#ah-dmg div{animation-duration:.01s}}
`;

/** The HUD's words (journal Passe L3): `?scene=arena` keeps the prototype's French, word for word (TEXTS_FR, the default); the game's play
 *  mode passes the English table (choice K1, TEXTS_EN). The action names come from the duel's CombatData. */
export interface ArenaTexts {
  guard: string; hold: string; dodge: string; ap1: string; light: string; apGain: string; heavy: string; breaksGuard: string;
  shorts: [string, string, string, string];
  title: string; subtitle: string; subRen: string; subMarek: string; health: (name: string) => string; apLabel: string;
  window: string; restart: string; pause: string; resume: string; rotate: string;
  stunned: string; stunnedHit: string; down: string; guarding: string;
  alertHeavy: string; alertLight: string; reactNow: string;
  dodged: string; guarded: (n: number) => string; ap: (n: number) => string; guardBroken: string; stun: string;
  victory: string; defeat: string; isDown: (name: string) => string;
}
export const TEXTS_FR: ArenaTexts = {
  guard: 'Garde', hold: 'maintenir', dodge: 'Esquive', ap1: '1 PA', light: 'Rapide', apGain: '+1 PA', heavy: 'Puissante', breaksGuard: 'brise la garde',
  shorts: ['Éclair', 'Fente', 'Tourbillon', 'Estocade'],
  title: 'Cité du Tournoi', subtitle: 'Arène des champions', subRen: 'le héros', subMarek: 'le champion', health: (n) => `Santé de ${n}`, apLabel: 'Points d\'action',
  window: 'Fenêtre d\'esquive', restart: 'R pour recommencer', pause: 'Pause', resume: 'Espace pour reprendre', rotate: 'Tournez l\'appareil : l\'arène se joue en paysage',
  stunned: 'Étourdi', stunnedHit: 'Étourdi — frappez !', down: 'À terre', guarding: 'En garde',
  alertHeavy: 'Attaque puissante !', alertLight: 'Attaque !', reactNow: 'Réagissez maintenant',
  dodged: 'Esquive', guarded: (n) => `${n} garde`, ap: (n) => `+${n} PA`, guardBroken: 'Garde brisée', stun: 'Étourdi',
  victory: 'Victoire', defeat: 'Défaite', isDown: (n) => `${n} est à terre · R pour recommencer`,
};
/** the play mode's words (choice K1): an official bout, no restart */
export const TEXTS_EN: ArenaTexts = {
  guard: 'Guard', hold: 'hold', dodge: 'Dodge', ap1: '1 AP', light: 'Quick', apGain: '+1 AP', heavy: 'Heavy', breaksGuard: 'breaks guard',
  shorts: ['Flash', 'Lunge', 'Whirl', 'Thrust'],
  title: 'Cité du Tournoi', subtitle: 'Pool of eight · official bout', subRen: 'challenger', subMarek: 'opponent', health: (n) => `${n}'s health`, apLabel: 'Action points',
  window: 'Dodge window', restart: 'An official bout cannot be restarted', pause: 'Pause', resume: 'Space to resume', rotate: 'Turn your device: the arena plays in landscape',
  stunned: 'Stunned', stunnedHit: 'Stunned — strike!', down: 'Down', guarding: 'Guarding',
  alertHeavy: 'Heavy attack!', alertLight: 'Attack!', reactNow: 'React now',
  dodged: 'Dodged', guarded: (n) => `${n} guarded`, ap: (n) => `+${n} AP`, guardBroken: 'Guard broken', stun: 'Stunned',
  victory: 'Victory', defeat: 'Defeat', isDown: (n) => `${n} is down`,
};

/** the action bar: defence | attacks | techniques (the prototype's grouping and keys) */
const bar = (t: ArenaTexts): Array<'|' | { id: ActionId | 'guard' | 'dodge'; key: string; name?: string; short?: string; sub?: string; wide?: boolean }> => [
  { id: 'guard', key: 'B', name: t.guard, sub: t.hold, wide: true }, { id: 'dodge', key: 'A', name: t.dodge, sub: t.ap1 }, '|',
  { id: 'light', key: '1', name: t.light, sub: t.apGain }, { id: 'heavy', key: '2', name: t.heavy, sub: t.breaksGuard, wide: true }, '|',
  { id: 't1', key: '3', short: t.shorts[0] }, { id: 't2', key: '4', short: t.shorts[1] }, { id: 't3', key: '5', short: t.shorts[2] }, { id: 't4', key: '6', short: t.shorts[3] },
];

export class ArenaHud {
  readonly el: HTMLDivElement;
  private c = new Map<string, unknown>();
  private btn = new Map<string, HTMLButtonElement>();
  private q = <T extends Element>(s: string) => this.el.querySelector(s) as T;
  /** the caller's commands (keys and the action bar's buttons) */
  onAction: (id: string, down: boolean) => void = () => {};
  /** screen position (CSS px) of a fighter's head, for floating text */
  project: (who: FighterId) => { x: number; y: number } = () => ({ x: 0, y: 0 });

  constructor(sim: CombatSim, portraits: Record<FighterId, HTMLCanvasElement | null>, private t: ArenaTexts = TEXTS_FR) {
    if (!document.getElementById('arena-hud-css')) { const st = document.createElement('style'); st.id = 'arena-hud-css'; st.textContent = CSS; document.head.appendChild(st); }
    this.el = document.createElement('div'); this.el.id = 'arena-hud';
    const D = sim.D, buttons = bar(t).map((b) => {
      if (b === '|') return '<span class="ah-sep"></span>';
      const d = b.id === 'guard' || b.id === 'dodge' ? null : D.actions[b.id];
      const nm = b.name ?? d?.short ?? d?.name ?? b.id, label = b.short ? `<span class="fn">${nm}</span><span class="sn">${b.short}</span>` : nm, sub = b.sub ?? `<q>${'◆'.repeat(d?.apCost ?? 0)}</q> ${d?.cooldown ?? 0} s`;
      return `<button class="ah-b${b.wide || (d && d.kind === 'tech') ? ' wide' : ''}${d && d.kind === 'tech' ? ' tech' : ''}" data-act="${b.id}" aria-label="${nm} (${b.key})"><kbd>${b.key}</kbd><b>${label}</b><em>${sub}</em><i class="cd"></i><s></s></button>`;
    }).join('');
    const card = (who: FighterId, side: 'l' | 'r', sub: string) => `<div class="ah-f ${side}" id="ah-${who}"><canvas class="ah-port" width="24" height="24" aria-hidden="true"></canvas><div class="ah-card"><div class="ah-nm">${D.fighters[who].name}<span>${sub}</span><em></em></div><div class="ah-hp" role="meter" aria-label="${t.health(D.fighters[who].name)}" aria-valuemin="0" aria-valuemax="${D.fighters[who].maxHp}"><u></u><i></i></div>${who === 'ren' ? `<div class="ah-pips" aria-label="${t.apLabel}">` + '<b></b>'.repeat(D.ap.max) + '</div>' : ''}<div class="ah-state"></div></div></div>`;
    this.el.innerHTML = `<div class="top"></div><div id="ah-title">${t.title}<small>${t.subtitle}</small></div>
      ${card('ren', 'l', t.subRen)}${card('marek', 'r', t.subMarek)}
      <div id="ah-alert"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 2l18 18-18 18L2 20z" fill="#3a1812" stroke="#d0714e" stroke-width="2.4"/><rect x="18" y="9" width="4" height="14" fill="#f3e3bf"/><rect x="18" y="26" width="4" height="4" fill="#f3e3bf"/></svg><div><b></b><span></span></div></div>
      <div id="ah-dmg"></div><div id="ah-wbar" aria-hidden="true"><i></i><b>${t.window}<kbd>A</kbd></b></div><div id="ah-bar">${buttons}</div>
      <div id="ah-ko" role="status"><div><b></b><span>${t.restart}</span></div></div>
      <div id="ah-pause" role="status"><div><b>${t.pause}</b><span>${t.resume}</span></div></div>
      <div id="ah-rotate" role="alert"><div><b>${t.title}</b><span>${t.rotate}</span></div></div>`;
    document.body.appendChild(this.el);
    for (const who of ['ren', 'marek'] as FighterId[]) {
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

  /** a held moment (ArenaApp.jump): floating numbers stay at their shown state instead of starting their fade-in */
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

  /** per frame: the simulation's state to the DOM (cached writes only) */
  update(sim: CombatSim, assist: Assist, visible: boolean, paused: boolean): void {
    const R = sim.f.ren, M = sim.f.marek, inc = sim.incoming(), full = assist === 'full', up = !!inc && inc.windowOpen && full;
    this.cls('hud', this.el, 'off', !visible);
    for (const f of [R, M]) {
      const root = this.q(`#ah-${f.id}`), pct = Math.round((f.hp / f.maxHp) * 1000) / 10;
      this.set(`hp${f.id}`, pct, () => { (root.querySelector('.ah-hp i') as HTMLElement).style.width = `${pct}%`; (root.querySelector('.ah-hp u') as HTMLElement).style.width = `${pct}%`; root.querySelector('.ah-hp')!.setAttribute('aria-valuenow', String(Math.ceil(f.hp))); });
      this.set(`hpt${f.id}`, Math.ceil(f.hp), () => { root.querySelector('.ah-nm em')!.textContent = `${Math.ceil(f.hp)} / ${f.maxHp}`; });
      const t = this.t, st = f.state === 'stunned' ? (f.id === 'ren' ? t.stunned : t.stunnedHit) : f.state === 'down' ? t.down : f.guarding ? t.guarding : '';
      const se = root.querySelector('.ah-state')!;
      this.set(`st${f.id}`, st, () => { if (st) se.textContent = st; se.classList.toggle('on', !!st); });
    }
    this.el.querySelectorAll('#ah-ren .ah-pips b').forEach((u, k) => {
      const on = k < R.ap;
      this.set(`pip${k}`, on, () => { u.classList.toggle('on', on); if (on) { u.classList.remove('gain'); void (u as HTMLElement).offsetWidth; u.classList.add('gain'); } });
    });
    for (const id of ['light', 'heavy', 't1', 't2', 't3', 't4'] as ActionId[]) {
      const b = this.btn.get(id)!, d = sim.D.actions[id], cd = sim.cooldownLeft('ren', id);
      this.cls(id, b, 'on', sim.available('ren', id)); this.cls(id, b, 'noap', !sim.canAfford('ren', id)); this.cls(id, b, 'cool', cd > 0);
      if (d.cooldown) {
        const h = cd > 0 ? Math.round((cd / d.cooldown) * 100) : 0, s = cd > 0 ? String(Math.ceil(cd)) : '';
        this.set(`${id}h`, h, () => { (b.querySelector('.cd') as HTMLElement).style.height = `${h}%`; });
        this.set(`${id}s`, s, () => { b.querySelector('s')!.textContent = s; });
      }
    }
    // the dodge button never tells whether an attack is coming (only the full assistance lights it in the window)
    const dg = this.btn.get('dodge')!, gd = this.btn.get('guard')!;
    this.cls('dg', dg, 'on', R.ap >= 1); this.cls('dg', dg, 'noap', R.ap < 1); this.cls('dg', dg, 'open', up && sim.canReact('ren', 'dodge'));
    this.cls('gd', gd, 'on', R.state === 'idle'); this.cls('gd', gd, 'active', R.guarding); this.cls('gd', gd, 'warn', up && !!inc && inc.kind === 'heavy' && R.guarding);
    const wb = this.q<HTMLElement>('#ah-wbar');
    this.cls('wb', wb, 'on', up && !R.react);
    if (up) (wb.firstElementChild as HTMLElement).style.transform = `scaleX(${Math.max(0, inc!.windowRemaining / inc!.windowDur).toFixed(2)})`;
    const al = this.q<HTMLElement>('#ah-alert'), show = !!inc && full && visible;
    this.cls('al', al, 'on', show);
    if (show) {
      this.set('alT', inc!.action, () => { al.querySelector('b')!.textContent = inc!.action === 'm_heavy' ? this.t.alertHeavy : this.t.alertLight; });
      this.set('alS', inc!.windowOpen, () => { al.querySelector('span')!.textContent = inc!.windowOpen ? this.t.reactNow : ''; });
    }
    this.cls('pause', this.q('#ah-pause'), 'on', paused && !sim.over);
  }

  /** the events' feedback: floating numbers, denied commands, the KO screen */
  onEvents(evs: CombatEvent[], sim: CombatSim): void {
    const t = this.t;
    for (const e of evs) {
      if (e.type === 'impact') this.float(e.to, e.result === 'dodged' ? t.dodged : e.result === 'guarded' ? t.guarded(e.damage) : `-${e.damage}`, e.result);
      else if (e.type === 'apGain' && e.who === 'ren') this.float('ren', t.ap(e.amount), 'ap', -34);
      else if (e.type === 'stun') this.float(e.who, e.why === 'guardbreak' ? t.guardBroken : t.stun, 'stun', -34);
      else if (e.type === 'commandDenied' && e.who === 'ren') this.flash(e.action, 'deny');
      else if (e.type === 'reactDenied' && e.who === 'ren') this.flash('dodge', 'deny');
      else if (e.type === 'ko') { const ko = this.q('#ah-ko'); ko.querySelector('b')!.textContent = e.who === 'marek' ? t.victory : t.defeat; ko.querySelector('span')!.textContent = t.isDown(t === TEXTS_FR ? (e.who === 'marek' ? 'Marek' : 'Ren') : sim.D.fighters[e.who].name); ko.classList.add('on'); }
      else if (e.type === 'reset') { this.q('#ah-ko').classList.remove('on'); this.q('#ah-dmg').textContent = ''; }
    }
  }

  private float(who: FighterId, text: string, cls: string, dy = 26): void {
    const p = this.project(who), el = document.createElement('div');
    el.className = cls; el.textContent = text;
    el.style.left = `${Math.round(p.x)}px`; el.style.top = `${Math.round(p.y + dy)}px`;
    this.q('#ah-dmg').appendChild(el);
    // a held moment keeps its numbers until play resumes (still(false) clears them)
    setTimeout(() => { if (!this.el.classList.contains('still')) el.remove(); }, 1100);
  }
}
