import type { CombatSim, CombatEvent, FighterId, ActionId } from './CombatSim';
import type { TimeOfDay } from '../atmosphere/DayState';
import { fontsReady, installDesign } from '../ui/design/system';

/** The arena's HUD (journal Passe P1; the interface's design system since journal Passe UI3: direction C « Héraldique pixel », its tone
 *  following the arena's day state). From the prototype's lean HUD (pass 11 of its report): two fighter panels (portrait, name, health with a damage trail, Ren's
 *  action points), the action bar grouped as defence | attacks | techniques with costs, cooldowns and the reaction cue, floating damage,
 *  and with the full assistance only the attack alert and the reaction window's bar. Every DOM write goes through a cache. */

export type Assist = 'subtle' | 'full' | 'off';

/** built from the interface's design system (journal Passe UI3): the tone's colours (`--ds-*`), the code-painted nine-slice frames, the pixel
 *  font for titles, names, numbers and keys, the text font for words; no text under 16 px on a computer, 14 px on a phone (S4). The gauges stay
 *  in the palette (S3): the challenger's light blue, the opponent's amber. With the HUD hidden (`hud=0`, H), the KO and pause screens keep the
 *  look they had before the system, unchanged (journal Passe UI3: every hud=0 address at 0 px) */
const CSS = `
#arena-hud{position:fixed;inset:0;pointer-events:none;color:var(--ds-ivory);font:400 var(--ds-fs-body)/1.3 var(--ds-text);z-index:20;user-select:none;-webkit-user-select:none}
#arena-hud.off>*:not(#ah-ko):not(#ah-pause){opacity:0}
#arena-hud .top{position:absolute;left:0;right:0;top:0;height:150px;background:linear-gradient(color-mix(in srgb,var(--ds-ink) 62%,transparent),transparent)}
#ah-title{position:absolute;left:18px;top:12px;font:400 var(--ds-fs-pixel)/1.2 var(--ds-pixel);letter-spacing:.04em;color:var(--ds-goldHi);text-shadow:0 var(--ds-px) 0 var(--ds-ink),0 0 8px var(--ds-ink)}
#ah-title small{display:block;margin-top:2px;font:400 var(--ds-fs-small)/1.2 var(--ds-text);letter-spacing:.06em;color:var(--ds-ivory);text-shadow:0 1px 0 var(--ds-ink),0 0 6px var(--ds-ink)}
#ah-title::after{content:'';display:block;width:140px;height:var(--ds-px);margin-top:6px;background:var(--ds-gold);box-shadow:0 var(--ds-px) 0 var(--ds-goldLo)}
.ah-f{position:absolute;top:76px;display:flex;gap:8px;align-items:flex-start}
.ah-f.l{left:18px}.ah-f.r{right:18px;flex-direction:row-reverse;text-align:right}
.ah-port{width:calc(48px + 6 * var(--ds-px));height:calc(48px + 6 * var(--ds-px));flex:none;image-rendering:pixelated;border:calc(3 * var(--ds-px)) solid transparent;border-image:var(--ds-f-gauge) 3 fill / calc(3 * var(--ds-px)) stretch}
.ah-card{position:relative;width:min(27vw,330px);padding:0 4px 2px;border:calc(8 * var(--ds-px)) solid transparent;border-image:var(--ds-f-panel) 8 fill / calc(8 * var(--ds-px)) stretch;image-rendering:pixelated}
.ah-nm{display:flex;align-items:baseline;font:400 var(--ds-fs-pixel)/1.2 var(--ds-pixel);letter-spacing:.02em;color:var(--ds-ivory)}
.ah-nm span{margin-left:8px;font:400 var(--ds-fs-small)/1.2 var(--ds-text);letter-spacing:.04em;color:var(--ds-muted)}
.ah-nm em{margin-left:auto;font:400 var(--ds-fs-pixel)/1 var(--ds-pixel);font-style:normal;color:var(--ds-goldHi)}
.ah-f.r .ah-nm{flex-direction:row-reverse}.ah-f.r .ah-nm span{margin:0 8px 0 0}.ah-f.r .ah-nm em{margin:0 auto 0 0}
.ah-hp{position:relative;height:calc(8px + 6 * var(--ds-px));margin-top:4px;border:calc(3 * var(--ds-px)) solid transparent;border-image:var(--ds-f-gauge) 3 fill / calc(3 * var(--ds-px)) stretch;image-rendering:pixelated}
.ah-hp i,.ah-hp u{position:absolute;top:0;bottom:0;left:0}
.ah-f.r .ah-hp i,.ah-f.r .ah-hp u{left:auto;right:0}
.ah-hp u{background:var(--ds-goldHi);opacity:.85;transition:width .45s ease-in .35s}
.ah-hp i{background:repeating-linear-gradient(90deg,var(--ds-blue3) 0 6px,var(--ds-blue2) 6px 8px)}
.ah-f.r .ah-hp u{background:var(--ds-ivory)}
.ah-f.r .ah-hp i{background:repeating-linear-gradient(90deg,var(--ds-amber) 0 6px,var(--ds-amberLo) 6px 8px)}
.ah-pips{display:flex;gap:10px;margin-top:8px;padding-left:4px}
.ah-pips b{width:10px;height:10px;transform:rotate(45deg);border:var(--ds-px) solid var(--ds-amber);display:block;background:var(--ds-ink)}
.ah-pips b.on{background:var(--ds-amber);box-shadow:0 0 8px var(--ds-amber)}
.ah-pips b.gain{animation:ahg .4s}
@keyframes ahg{40%{transform:rotate(45deg) scale(1.5)}}
.ah-state{position:absolute;left:0;right:0;top:100%;margin-top:6px;padding:0 4px;font-size:var(--ds-fs-small);letter-spacing:.12em;text-transform:uppercase;color:var(--ds-goldHi);text-shadow:0 1px 0 var(--ds-ink),0 0 6px var(--ds-ink);opacity:0;transition:opacity .15s}
.ah-state.on{opacity:1}
/* the sub-label (« hold », « 1 AP », « breaks guard ») below the name, whole (the operator's decision P3, journal Passes UI1 / UI2): the key
   beside the name, the sub-label under them, both at the system's sizes */
#ah-bar{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);display:flex;gap:6px;pointer-events:auto;transition:opacity .15s}
.ah-sep{width:var(--ds-px);align-self:stretch;margin:8px 4px;background:var(--ds-gold);box-shadow:var(--ds-px) 0 0 var(--ds-goldLo)}
.ah-b{position:relative;display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto;column-gap:6px;align-items:center;min-width:104px;padding:2px 6px 2px 2px;text-align:left;font:inherit;color:var(--ds-ivory);background:none;border:calc(4 * var(--ds-px)) solid transparent;border-image:var(--ds-f-btnOff) 4 fill / calc(4 * var(--ds-px)) stretch;image-rendering:pixelated;cursor:pointer;overflow:hidden;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.ah-b.wide{min-width:132px}
.ah-b kbd{grid-row:1;grid-column:1;min-width:calc(20px + 6 * var(--ds-px));padding:0 2px;font:400 var(--ds-fs-pixel)/1.1 var(--ds-pixel);text-align:center;color:var(--ds-ink);border:calc(3 * var(--ds-px)) solid transparent;border-image:var(--ds-f-key) 3 fill / calc(3 * var(--ds-px)) stretch}
.ah-b b{grid-row:1;grid-column:2;font-size:var(--ds-fs-label);font-weight:700;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap;color:var(--ds-muted)}
.ah-b em{grid-row:2;grid-column:1 / span 2;margin-top:2px;font-size:var(--ds-fs-small);font-style:normal;color:var(--ds-muted);white-space:nowrap}
.ah-b.on{border-image-source:var(--ds-f-btn)}
.ah-b.on b{color:var(--ds-ivory)}.ah-b.on em{color:var(--ds-ivory)}
.ah-b em q{quotes:none}
.ah-b em q i{display:inline-block;width:8px;height:8px;margin:0 4px 1px 2px;transform:rotate(45deg);background:var(--ds-amber)}
.ah-b.noap b{color:var(--ds-muted)}.ah-b.noap em{color:var(--ds-amberHi)}
.ah-b .cd{position:absolute;left:0;right:0;bottom:0;height:0;background:color-mix(in srgb,var(--ds-ink) 80%,transparent)}
.ah-b s{position:absolute;inset:0;display:none;place-items:center;font:400 var(--ds-fs-pixel-big) var(--ds-pixel);text-decoration:none;color:var(--ds-ivory);text-shadow:0 var(--ds-px) 0 var(--ds-ink)}
.ah-b.cool s{display:grid}.ah-b.cool b,.ah-b.cool em{visibility:hidden}
.ah-b.open{border-image-source:var(--ds-f-btnAct);box-shadow:0 0 16px color-mix(in srgb,var(--ds-amber) 75%,transparent);animation:ahp .45s infinite alternate}
@keyframes ahp{to{transform:translateY(-4px)}}
.ah-b.warn{border-image-source:var(--ds-f-btnAct)}
.ah-b.active{border-image-source:var(--ds-f-btnHi);box-shadow:0 0 14px color-mix(in srgb,var(--ds-blue3) 50%,transparent)}
.ah-b.hit{animation:ahk .18s}.ah-b.deny{animation:ahd .25s}
@keyframes ahk{50%{transform:scale(.92)}}@keyframes ahd{25%{transform:translateX(-3px)}75%{transform:translateX(3px)}}
/* the reaction window's bar right above the action bar, its label on its left: the floor in front of the telegraph stays clear (the
   telegraph's contrast is read there, tools/arena-scene-check.mjs) */
#ah-wbar{position:absolute;left:50%;bottom:94px;width:min(460px,70vw);height:calc(8px + 6 * var(--ds-px));transform:translateX(-50%);border:calc(3 * var(--ds-px)) solid transparent;border-image:var(--ds-f-gauge) 3 fill / calc(3 * var(--ds-px)) stretch;image-rendering:pixelated;opacity:0}
#ah-wbar.on{opacity:1}
#ah-wbar i{position:absolute;left:0;top:0;bottom:0;width:100%;transform-origin:left center;background:var(--ds-amber);box-shadow:0 0 6px var(--ds-amber)}
#ah-wbar b{position:absolute;right:calc(100% + 14px);top:50%;transform:translateY(-50%);font-size:var(--ds-fs-small);font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--ds-ivory);text-shadow:0 1px 0 var(--ds-ink),0 0 6px var(--ds-ink);white-space:nowrap}
#ah-wbar b kbd{display:inline-block;margin-left:8px;padding:0 2px;font:400 var(--ds-fs-pixel)/1.1 var(--ds-pixel);letter-spacing:0;color:var(--ds-ink);border:calc(3 * var(--ds-px)) solid transparent;border-image:var(--ds-f-btnAct) 4 fill / calc(3 * var(--ds-px)) stretch;background:var(--ds-amber)}
#ah-alert{position:absolute;left:50%;top:27%;transform:translateX(-50%);display:flex;gap:12px;align-items:center;padding:0 14px 0 2px;border:calc(8 * var(--ds-px)) solid transparent;border-image:var(--ds-f-panel) 8 fill / calc(8 * var(--ds-px)) stretch;image-rendering:pixelated;opacity:0;transition:opacity .12s}
#ah-alert.on{opacity:1}
#ah-alert svg{width:40px;height:40px;shape-rendering:crispEdges}
#ah-alert svg path{fill:var(--ds-amberLo);stroke:var(--ds-amber)}
#ah-alert svg rect{fill:var(--ds-ivory)}
#ah-alert b{display:block;font:400 var(--ds-fs-pixel)/1.2 var(--ds-pixel);letter-spacing:.04em;color:var(--ds-goldHi)}
#ah-alert span{display:block;margin-top:2px;font-size:var(--ds-fs-small);letter-spacing:.12em;text-transform:uppercase;color:var(--ds-ivory)}
#ah-dmg div{position:absolute;transform:translate(-50%,0);font:400 var(--ds-fs-pixel-big)/1 var(--ds-pixel);letter-spacing:.02em;text-shadow:0 var(--ds-px) 0 var(--ds-ink),var(--ds-px) 0 0 var(--ds-ink),calc(-1 * var(--ds-px)) 0 0 var(--ds-ink),0 calc(-1 * var(--ds-px)) 0 var(--ds-ink),0 0 8px rgba(0,0,0,.5);animation:ahf 1.05s ease-out forwards;white-space:nowrap}
#ah-dmg .hit{color:var(--ds-ivory)}#ah-dmg .guarded{color:var(--ds-blue3);font-size:var(--ds-fs-pixel)}#ah-dmg .guardbreak{color:var(--ds-amber)}#ah-dmg .dodged{color:var(--ds-blue3);font-size:var(--ds-fs-pixel)}
#ah-dmg .ap{color:var(--ds-amber);font-size:var(--ds-fs-pixel)}#ah-dmg .stun{color:var(--ds-goldHi);font-size:var(--ds-fs-pixel)}
@keyframes ahf{0%{opacity:0;margin-top:6px}12%{opacity:1}100%{opacity:0;margin-top:-48px}}
#arena-hud.still #ah-dmg div{animation-delay:-.22s;animation-play-state:paused}
#ah-ko,#ah-pause{position:absolute;inset:0;display:none;place-items:center;background:rgba(5,7,13,.58);text-align:center;pointer-events:none}
#ah-ko.on,#ah-pause.on{display:grid}
#ah-ko b,#ah-pause b{display:block;font-weight:400;font-size:26px;letter-spacing:.34em;text-transform:uppercase;color:#f1d9a0}
#ah-ko b::after{content:'';display:block;width:180px;height:2px;margin:12px auto 0;background:linear-gradient(90deg,rgba(233,166,76,0),#e9a64c,rgba(233,166,76,0))}
#ah-ko span,#ah-pause span{display:block;margin-top:12px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#d9c9a8;opacity:.8}
#arena-hud.off #ah-ko,#arena-hud.off #ah-pause{color:#d9c9a8;font:14px/1.4 "Segoe UI",system-ui,sans-serif}
#arena-hud:not(.off) #ah-ko,#arena-hud:not(.off) #ah-pause{background:color-mix(in srgb,var(--ds-ink) 58%,transparent)}
#arena-hud:not(.off) #ah-ko b,#arena-hud:not(.off) #ah-pause b{font:400 var(--ds-fs-pixel-huge)/1.2 var(--ds-pixel);letter-spacing:.08em;text-transform:none;color:var(--ds-goldHi);text-shadow:0 var(--ds-px) 0 var(--ds-ink),0 calc(2 * var(--ds-px)) 0 var(--ds-goldLo)}
#arena-hud:not(.off) #ah-ko b::after{width:200px;height:var(--ds-px);background:var(--ds-gold);box-shadow:0 var(--ds-px) 0 var(--ds-goldLo)}
#arena-hud:not(.off) #ah-ko span,#arena-hud:not(.off) #ah-pause span{font-size:var(--ds-fs-small);letter-spacing:.12em;color:var(--ds-ivory);opacity:1}
#ah-rotate{position:absolute;inset:0;display:none;place-items:center;padding:24px;text-align:center;background:var(--ds-ink);pointer-events:auto}
#ah-rotate b{display:block;font:400 var(--ds-fs-pixel)/1.2 var(--ds-pixel);letter-spacing:.06em;color:var(--ds-goldHi)}
#ah-rotate span{display:block;margin-top:14px;font-size:var(--ds-fs-small);letter-spacing:.06em;color:var(--ds-ivory)}
@media (orientation:portrait) and (max-width:820px){#ah-rotate{display:grid}}
.ah-b .sn{display:none}
/* a laptop window: the short technique names, the labels at the smallest size, so the bar fits (1 196 px wide, measured) */
@media (max-width:1500px){.ah-b,.ah-b.wide{min-width:0}.ah-b b{font-size:var(--ds-fs-small);letter-spacing:.02em}.ah-b .fn{display:none}.ah-b .sn{display:inline}}
/* a narrow window or a phone (L3): the key over the name, the sub-labels away */
@media (max-width:1240px){#ah-bar{gap:4px}.ah-sep{margin:8px 2px}.ah-b,.ah-b.wide{min-width:0;grid-template-columns:auto;justify-items:center;padding:0 4px}.ah-b kbd{grid-row:1;grid-column:1;font-size:var(--ds-fs-small);min-width:calc(14px + 6 * var(--ds-px))}.ah-b b{grid-row:2;grid-column:1;font-size:var(--ds-fs-small);letter-spacing:0;text-transform:none}.ah-b em{display:none}.ah-b .fn{display:none}.ah-b .sn{display:inline}.ah-card{width:30vw}}
/* phone in landscape: the cards, the alert and the bars shrink so the duel stays in view */
@media (max-height:480px){#ah-title{display:none}#arena-hud .top{height:90px}.ah-f{top:6px}.ah-card,#ah-alert{border-width:calc(4 * var(--ds-px));border-image:var(--ds-f-btn) 4 fill / calc(4 * var(--ds-px)) stretch}.ah-card{width:min(30vw,250px)}.ah-port{width:calc(32px + 6 * var(--ds-px));height:calc(32px + 6 * var(--ds-px))}.ah-card{padding:0 2px}.ah-nm span{display:none}.ah-hp{height:calc(4px + 6 * var(--ds-px))}.ah-pips{margin-top:5px;gap:8px}.ah-pips b{width:8px;height:8px}
  #ah-alert{top:30%;padding:0 10px 0 0}#ah-alert svg{width:28px;height:28px}
  #ah-wbar{bottom:72px;width:min(380px,46vw);height:calc(4px + 6 * var(--ds-px))}#ah-bar{bottom:4px}.ah-state{margin-top:2px}}
#arena-hud button:focus-visible{outline:var(--ds-px) solid var(--ds-goldHi);outline-offset:var(--ds-px)}
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

  /** resolves once the system's fonts are loaded (ArenaApp.init waits for it) */
  readonly ready: Promise<void>;

  /** time: the arena's day state, the HUD's tone (the operator's decision L2; absent = the night) */
  constructor(sim: CombatSim, portraits: Record<FighterId, HTMLCanvasElement | null>, private t: ArenaTexts = TEXTS_FR, time: TimeOfDay | null = null) {
    installDesign(time);
    this.ready = fontsReady();
    if (!document.getElementById('arena-hud-css')) { const st = document.createElement('style'); st.id = 'arena-hud-css'; st.textContent = CSS; document.head.appendChild(st); }
    this.el = document.createElement('div'); this.el.id = 'arena-hud';
    const D = sim.D, buttons = bar(t).map((b) => {
      if (b === '|') return '<span class="ah-sep"></span>';
      const d = b.id === 'guard' || b.id === 'dodge' ? null : D.actions[b.id];
      const nm = b.name ?? d?.short ?? d?.name ?? b.id, label = b.short ? `<span class="fn">${nm}</span><span class="sn">${b.short}</span>` : nm, sub = b.sub ?? `<q>${'<i></i>'.repeat(d?.apCost ?? 0)}</q> ${d?.cooldown ?? 0} s`;
      return `<button class="ah-b${b.wide || (d && d.kind === 'tech') ? ' wide' : ''}${d && d.kind === 'tech' ? ' tech' : ''}" data-act="${b.id}" aria-label="${nm} (${b.key})"><kbd>${b.key}</kbd><b>${label}</b><em>${sub}</em><i class="cd"></i><s></s></button>`;
    }).join('');
    const card = (who: FighterId, side: 'l' | 'r', sub: string) => `<div class="ah-f ${side}" id="ah-${who}"><canvas class="ah-port" width="24" height="24" aria-hidden="true"></canvas><div class="ah-card"><div class="ah-nm">${D.fighters[who].name}<span>${sub}</span><em></em></div><div class="ah-hp" role="meter" aria-label="${t.health(D.fighters[who].name)}" aria-valuemin="0" aria-valuemax="${D.fighters[who].maxHp}"><u></u><i></i></div>${who === 'ren' ? `<div class="ah-pips" aria-label="${t.apLabel}">` + '<b></b>'.repeat(D.ap.max) + '</div>' : ''}<div class="ah-state"></div></div></div>`;
    this.el.innerHTML = `<div class="top"></div><div id="ah-title">${t.title}<small>${t.subtitle}</small></div>
      ${card('ren', 'l', t.subRen)}${card('marek', 'r', t.subMarek)}
      <div id="ah-alert"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 2l18 18-18 18L2 20z" stroke-width="2.4"/><rect x="18" y="9" width="4" height="14"/><rect x="18" y="26" width="4" height="4"/></svg><div><b></b><span></span></div></div>
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
