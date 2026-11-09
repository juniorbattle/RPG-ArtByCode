import type { App } from '../app/App';
import { keysOf } from '../settings/settings';
import { firstSlot } from '../settings/keys';

/** the talk key's cap (the remapping, journal Passe RM2, RM-6): the player's key; named here, the free district loading no text table */
function talkCap(): string {
  const k = firstSlot(keysOf().talk)?.k ?? 'e', fr = document.documentElement.lang === 'fr';
  const name = k === ' ' ? (fr ? 'Espace' : 'Space') : k === 'Shift' ? (fr ? 'Maj' : 'Shift') : k.length === 1 ? k.toUpperCase() : k;
  return `<kbd data-bind="talk">${name.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)}</kbd>`;
}

/** The free-roaming town's HUD in the design system (UM-R5 « Dans le système, sans mini-carte », journal Passe UM6): the place and the hour on their veil,
 *  the interaction's prompt at the foot of the screen. The tone and the fonts are the page's (the loading screen installs them). The DEV panel stays
 *  a tool of its own. */

const CSS = `
#ex-veil{position:fixed;left:0;top:0;z-index:19;width:min(640px,100vw);height:180px;background:radial-gradient(120% 130% at 0 0,var(--ds-veil) 0,var(--ds-veil-soft) 56%,transparent 100%);pointer-events:none}
#ex-title{position:fixed;left:44px;top:32px;z-index:20;color:var(--ds-ivory);font:400 var(--ds-fs-title-big)/1.1 var(--ds-title);pointer-events:none}
#ex-title div{margin-top:6px;font:400 var(--ds-fs-body)/1.35 var(--ds-text)}
#ex-prompt{position:fixed;left:50%;bottom:44px;z-index:20;transform:translateX(-50%);display:flex;align-items:center;gap:12px;padding:14px 60px;color:var(--ds-ivory);font:400 var(--ds-fs-label)/1.35 var(--ds-text);white-space:nowrap;background:var(--ds-grad-spot);opacity:0;transition:opacity .16s;pointer-events:none}
`;

export class Hud {
  private veil = document.createElement('div');
  private title = document.createElement('div');
  private state: HTMLElement;
  private prompt = document.createElement('div');
  private shown = '';

  constructor(private app: App) {
    if (!document.getElementById('ex-css')) { const st = document.createElement('style'); st.id = 'ex-css'; st.textContent = CSS; document.head.appendChild(st); }
    this.veil.id = 'ex-veil'; this.title.id = 'ex-title'; this.prompt.id = 'ex-prompt';
    // Explore's words in the page's language (journal Passe RG4: `<html lang>`; this HUD stays free of the game's modules)
    const fr = document.documentElement.lang === 'fr', DAY_FR: Record<string, string> = { Midday: 'Midi', Morning: 'Matin', 'End of day': 'Fin de journée' };
    this.title.innerHTML = fr ? `Quartier marchand<div>${app.dayLabel ? DAY_FR[app.dayLabel] ?? app.dayLabel : 'Nuit'} <span></span></div>` : `Merchant District<div>${app.dayLabel ?? 'Night'} <span></span></div>`;
    this.state = this.title.querySelector('span')!;
    document.body.append(this.veil, this.title, this.prompt);
  }

  setVisible(v: boolean): void { this.veil.style.display = this.title.style.display = this.prompt.style.display = v ? '' : 'none'; }

  update(): void {
    const a = this.app, near = a.actors?.nearForge, t = a.actors?.interactTarget;
    const fr = document.documentElement.lang === 'fr';
    this.state.textContent = a.config.forgeState === 'SABOTAGED_FORGE' ? (fr ? '· la forge a été sabotée' : '· the forge has been sabotaged') : '';
    const msg = near ? (a.config.forgeState === 'NORMAL_FORGE' ? (fr ? 'Saboter la forge' : 'Sabotage the forge') : (fr ? 'Réparer la forge' : 'Restore the forge')) : t ? (fr ? 'Parler' : 'Talk') : '';
    if (msg === this.shown) return;
    this.shown = msg;
    if (msg) this.prompt.innerHTML = `${talkCap()}${msg}`;
    this.prompt.style.opacity = msg ? '1' : '0';
  }
}
