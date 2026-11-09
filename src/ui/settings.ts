import { tx, type TextKey } from '../narrative/text';
import { capOf } from '../input/glyphs';
import { BTN, type Btn, type PadFamily } from '../input/pad';
import {
  FPS_STEPS, LANGS, layout, loadSettings, MSAA_STEPS, onSettings, QUALITY, QUALITY_STEPS, qualityOf, REFL_STEPS, RES_STEPS, saveSettings, shownKey,
  type GameSettings, type Lang, type Layout, type Quality,
} from '../settings/settings';
import { el, esc, fillFoot, footBtn, injectStyle, pickRow, scrollFade } from './style';
import { chooseLanguage, pageLang } from '../settings/language';

/** The settings page (the operator's sheet of journal Passe RG2: RG-1 « Une page « Réglages », quatre parties, titre et menu », RG-2 « Depuis la pause du
 *  duel aussi »): built as the journal, the four parts on the left (graphics, sound, controls, language), their settings on the right, one foot with
 *  Esc. Opened by the title screen, the menu (Esc) in place of its « Sound » line, V on the sound, and the duel's pause. Every change is kept at once
 *  and every scene follows it without a reload (src/settings/). The keyboard: the arrows walk the parts, Enter or → enters one, ↑ ↓ walk its settings,
 *  ← → change a choice or a slider, ↑ at the top goes back to the parts; the gamepad presses the same keys (src/input/PadInput.ts). */

export type SettingsSection = 'graphics' | 'sound' | 'controls' | 'language';
const SECTIONS: readonly SettingsSection[] = ['graphics', 'sound', 'controls', 'language'];

export interface SettingsOptions {
  section?: SettingsSection;
  close(): void;
  /** the duel's pause: a new language is kept for the next page (a bout is not reloaded) */
  inDuel?: boolean;
}

const CSS = `
.pm-overlay.pm-set-root{z-index:70}
.pm-settings .pm-detail{padding-right:4px}
.pm-settings .pm-detail>.pm-sub{margin:14px 0 2px}
.pm-settings .pm-detail>.pm-sub:first-child{margin-top:0}
.pm-settings .pm-detail .pm-btn,.pm-settings .pm-detail label{min-height:44px}
.pm-settings .pm-btn .val{margin-left:auto;flex:none;white-space:nowrap;color:var(--ds-muted)}
.pm-settings .pm-btn .val::before{content:'\\2039';margin-right:10px}
.pm-settings .pm-btn .val::after{content:'\\203A';margin-left:10px}
.pm-settings .pm-btn:focus .val,.pm-settings .pm-btn:hover .val{color:var(--ds-accent)}
.pm-settings .pm-btn kbd{margin-left:auto}
.pm-settings .pm-detail p.note{margin:2px 0 8px;font-size:var(--ds-fs-small);color:var(--ds-muted)}
.pm-settings .pm-detail label{padding-top:9px;border-top:1px solid var(--ds-line)}
.pm-keys{width:100%;border-collapse:collapse;margin:2px 0 6px}
.pm-keys td{padding:6px 0;border-top:1px solid var(--ds-line);vertical-align:middle;font-size:var(--ds-fs-body)}
.pm-keys td.k{text-align:right;white-space:nowrap;padding-left:12px}
.pm-keys td.p{text-align:right;white-space:nowrap;padding-left:16px;width:1%}
.pm-key{display:inline-block;box-sizing:border-box;min-width:30px;margin-left:4px;padding:0 8px;font:600 var(--ds-fs-small)/26px var(--ds-text);text-align:center;border:1px solid var(--ds-muted);border-radius:3px}
.pm-cap{display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;min-width:40px;height:28px;margin-left:4px;padding:0 8px;font:600 var(--ds-fs-small)/26px var(--ds-text);border:1px solid var(--ds-muted);border-radius:13px;vertical-align:middle}
.pm-cap.round{width:28px;min-width:28px;padding:0;border-radius:50%}
.pm-cap .pad-l{display:block;line-height:26px}
.pm-cap .pad-s{display:block}
.pm-keys .via{font-size:var(--ds-fs-small);color:var(--ds-muted)}
@media (max-height:480px) and (min-width:701px){.pm-overlay .pm-card.pm-two.pm-settings{display:grid;grid-template-columns:minmax(0,230px) minmax(0,1fr);column-gap:28px}.pm-settings .pm-glist .why{display:none}.pm-settings .pm-col .pm-head p{display:none}.pm-settings .pm-col .pm-head{padding-bottom:6px}}
`;

function style(): void {
  injectStyle();
  if (!document.getElementById('pm-settings-css')) { const s = document.createElement('style'); s.id = 'pm-settings-css'; s.textContent = CSS; document.head.appendChild(s); }
}

/** the labels of each choice */
const RES_LABEL = (v: GameSettings['res']): string => (v === 'native' ? tx('set.res.native') : `${v}p`);
const MSAA_LABEL = (v: number): string => (v === 0 ? tx('set.off') : `${v}×`);
const REFL_LABEL: Record<number, TextKey> = { 0.25: 'set.refl.quarter', 0.5: 'set.refl.half', 1: 'set.refl.full' };
const FPS_LABEL = (v: number): string => (v === 0 ? tx('set.fps.none') : String(v));
const QUALITY_LABEL: Record<Quality, TextKey> = { low: 'set.quality.low', medium: 'set.quality.medium', high: 'set.quality.high', ultra: 'set.quality.ultra' };
const LAYOUT_LABEL: Record<Layout, string> = { qwerty: 'QWERTY', azerty: 'AZERTY' };
const LANG_LABEL: Record<Lang, string> = { en: 'English', fr: 'Français' };
const SECTION_KEY: Record<SettingsSection, [TextKey, TextKey]> = {
  graphics: ['set.graphics', 'set.graphics.sub'], sound: ['set.sound', 'set.sound.sub'], controls: ['set.controls', 'set.controls.sub'], language: ['set.language', 'set.language.sub'],
};

/** a pad's button as its cap (the design system's keycap; a span, so the prompts' observer leaves it as it is) */
const cap = (family: PadFamily, ...bs: Btn[]): string => bs.map((b) => { const c = capOf(family, b); return `<span class="pm-cap ${c.shape}" title="${esc(c.label)}">${c.html}</span>`; }).join('');
const key = (...ks: string[]): string => ks.map((k) => `<span class="pm-key">${esc(k)}</span>`).join('');

export function settingsPage(o: SettingsOptions): { root: HTMLElement; focus(): void } {
  style();
  // above the title screen (z 60) when opened from it
  const root = el('div', 'pm pm-overlay pm-set-root'), card = el('div', 'pm-card pm-two pm-days pm-settings');
  card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', tx('set.title'));
  card.innerHTML = `<section class="pm-col"><header class="pm-head"><h2 class="pm-h">${tx('set.title')}</h2></header><div class="pm-glist pm-grow"></div></section>`
    + `<section class="pm-col"><header class="pm-head"><h2 class="pm-h"></h2><p></p></header><div class="pm-detail pm-grow"></div><div class="pm-foot"></div></section>`;
  root.appendChild(card);
  const list = card.querySelector('.pm-glist') as HTMLElement, detail = card.querySelector('.pm-detail') as HTMLElement;
  const head = card.querySelector('section:last-child .pm-head') as HTMLElement, title = head.querySelector('.pm-h') as HTMLElement, sub = head.querySelector('p') as HTMLElement;
  const out = footBtn('Esc', tx('ui.close'), () => close());
  fillFoot(card.querySelector('.pm-foot') as HTMLElement, out);
  const fit = scrollFade(detail);
  let shown: SettingsSection = o.section ?? 'graphics';
  const rows = new Map<SettingsSection, HTMLButtonElement>();

  // ---------------------------------------------------------------- the controls of the right column
  /** a choice among steps: ← → change it, Enter the next */
  const choice = <T>(label: string, steps: readonly T[], get: () => T | null, set: (v: T) => void, name: (v: T | null) => string, note = ''): HTMLButtonElement => {
    const b = el('button', 'pm-btn');
    const draw = () => { b.innerHTML = `<span>${esc(label)}${note ? `<span class="why">${esc(note)}</span>` : ''}</span><span class="val">${esc(name(get()))}</span>`; };
    const step = (d: number) => { const i = steps.indexOf(get() as T), n = steps.length; set(steps[i < 0 ? (d > 0 ? 0 : n - 1) : (((i + d) % n) + n) % n]); draw(); };
    b.addEventListener('click', () => step(1));
    b.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); step(e.key === 'ArrowRight' ? 1 : -1); } });
    b.dataset.ctl = 'choice'; draw();
    return b;
  };
  /** a switch */
  const toggle = (label: string, get: () => boolean, set: (v: boolean) => void, note = '', kbd = ''): HTMLButtonElement => {
    const b = el('button', 'pm-btn', `<i class="pm-check"></i><span>${esc(label)}${note ? `<span class="why">${esc(note)}</span>` : ''}</span>${kbd ? `<kbd>${kbd}</kbd>` : ''}`);
    b.setAttribute('aria-pressed', String(get()));
    b.addEventListener('click', () => { set(!get()); b.setAttribute('aria-pressed', String(get())); });
    b.dataset.ctl = 'toggle';
    return b;
  };
  /** a slider from 0 to 100 */
  const slider = (label: string, get: () => number, set: (v: number) => void): HTMLElement => {
    const v = Math.round(get() * 100), p = el('label', '', `${esc(label)}<b>${v}</b><input type="range" min="0" max="100" step="5" value="${v}" aria-label="${esc(label)}" style="--v:${v}%">`);
    const i = p.querySelector('input')!;
    i.addEventListener('input', () => { i.style.setProperty('--v', `${i.value}%`); p.querySelector('b')!.textContent = i.value; set(+i.value / 100); });
    return p;
  };
  const heading = (t: string) => el('p', 'pm-sub', esc(t));
  const note = (t: string) => el('p', 'note', esc(t));

  // ---------------------------------------------------------------- the parts
  const graphics = (): void => {
    const s = () => loadSettings();
    detail.append(
      choice(tx('set.quality'), QUALITY_STEPS, () => qualityOf(s()), (q) => saveSettings(QUALITY[q]), (q) => (q ? tx(QUALITY_LABEL[q]) : tx('set.quality.custom'))),
      choice(tx('set.res'), RES_STEPS, () => s().res, (v) => saveSettings({ res: v }), (v) => RES_LABEL(v ?? 'native')),
      choice(tx('set.msaa'), MSAA_STEPS, () => s().msaa, (v) => saveSettings({ msaa: v }), (v) => MSAA_LABEL(v ?? 4)),
      choice(tx('set.refl'), REFL_STEPS, () => s().refl, (v) => saveSettings({ refl: v }), (v) => tx(REFL_LABEL[v ?? 0.5])),
      choice(tx('set.fps'), FPS_STEPS, () => s().fps, (v) => saveSettings({ fps: v }), (v) => FPS_LABEL(v ?? 60)),
      toggle(tx('set.dof'), () => s().dof, (v) => saveSettings({ dof: v })),
      toggle(tx('set.bloom'), () => s().bloom, (v) => saveSettings({ bloom: v })),
      note(tx('set.look')),
      toggle(tx('set.motion'), () => s().reducedMotion, (v) => saveSettings({ reducedMotion: v }), tx('set.motion.sub')),
    );
    if (document.fullscreenEnabled) detail.appendChild(toggle(tx('set.fullscreen'), () => !!document.fullscreenElement, (v) => { void (v ? document.documentElement.requestFullscreen() : document.exitFullscreen()).catch(() => {}); }));
  };

  const sound = (): void => {
    detail.appendChild(note(tx('v2.sound.sub')));
    void import('../audio/Sound').then((m) => {
      if (shown !== 'sound' || !root.isConnected) return;
      const snd = m.sound(), at = detail.childElementCount;
      const set = (k: 'volume' | 'music' | 'ambience' | 'effects') => (v: number) => snd.set({ [k]: v });
      detail.append(
        slider(tx('set.volume'), () => snd.settings.volume, set('volume')),
        slider(tx('v2.sound.music'), () => snd.settings.music, set('music')),
        slider(tx('set.ambience'), () => snd.settings.ambience, set('ambience')),
        slider(tx('set.effects'), () => snd.settings.effects, set('effects')),
        toggle(tx('v2.sound.mute'), () => snd.settings.muted, (v) => snd.set({ muted: v }), '', 'N'),
      );
      // the page opened from the keyboard on this part lands on its first control
      if (pendingFocus) { pendingFocus = false; (detail.children[at]?.querySelector('input') as HTMLElement | null)?.focus(); }
      fit();
    });
  };

  const controls = (padIn: typeof import('../input/PadInput') | null): void => {
    const lay = layout(), fam: PadFamily = padIn?.pad()?.family ?? 'xbox', k = (x: string) => shownKey(x, lay);
    detail.append(choice(tx('set.keyboard'), ['qwerty', 'azerty'] as const, () => layout(), (v) => saveSettings({ keyboard: v }), (v) => LAYOUT_LABEL[v ?? 'qwerty'], tx('set.keyboard.sub')));
    if (padIn) detail.appendChild(toggle(tx('v2.sound.vibration'), () => padIn.padSettings().vibration, (v) => padIn.setPadSettings({ vibration: v })));
    const table = (rows: Array<[TextKey, string, string]>) => {
      const t = el('table', 'pm-keys');
      t.innerHTML = rows.map(([label, kb, pd]) => `<tr><td>${esc(tx(label))}</td><td class="k">${kb}</td><td class="p">${pd}</td></tr>`).join('');
      return t;
    };
    const via = `<span class="via">${esc(tx('set.keys.viaMenu'))}</span>`;
    detail.append(
      heading(tx('set.keys.walk')),
      table([
        // « Arrows » in words: ← and → are outside the fonts' subset (LATIN_RANGE holds ↑ and ↓ only)
        ['set.keys.move', key(k('w'), k('a'), k('s'), k('d'), tx('set.keys.arrows')), cap(fam, BTN.LS, BTN.UP)],
        ['set.keys.run', key('Shift'), cap(fam, BTN.B)],
        ['set.keys.talk', key(k('e')), cap(fam, BTN.A)],
        ['set.keys.here', key(k('q')), cap(fam, BTN.Y)],
        ['set.keys.menu', key('Esc'), cap(fam, BTN.START)],
        ['set.keys.map', key(k('m')), cap(fam, BTN.VIEW)],
        ['set.keys.pages', key(k('j'), k('t'), k('k'), k('g'), k('v'), k('h')), via],
        ['set.keys.mute', key(k('n')), via],
      ]),
      heading(tx('set.keys.page')),
      table([
        ['set.keys.choose', key('↑', '↓'), cap(fam, BTN.UP, BTN.LS)],
        ['set.keys.press', key('Enter'), cap(fam, BTN.A)],
        ['set.keys.back', key('Esc'), cap(fam, BTN.B)],
        ['set.keys.space', key('Space'), cap(fam, BTN.X)],
        ['set.keys.tab', '', cap(fam, BTN.LB, BTN.RB)],
        ['set.keys.scroll', '', cap(fam, BTN.RS)],
      ]),
      heading(tx('set.keys.duel')),
      table([
        ['set.keys.attack', key('J'), cap(fam, BTN.X, BTN.RT)],
        ['set.keys.guard', key('K'), cap(fam, BTN.B, BTN.LT)],
        ['set.keys.dodge', key('L'), cap(fam, BTN.A)],
        ['set.keys.pause', key('Space'), cap(fam, BTN.START)],
        ['set.keys.settings', key('Esc'), cap(fam, BTN.Y)],
      ]),
    );
  };

  const language = (): void => {
    for (const l of LANGS) {
      // one language at a time: the choice marks its line and unmarks the other (in a duel the page stays, so both are redrawn)
      const b = toggle(LANG_LABEL[l], () => (loadSettings().lang ?? pageLang()) === l, () => {
        chooseLanguage(l, !o.inDuel);
        for (const x of detail.querySelectorAll<HTMLElement>('[data-lang]')) x.setAttribute('aria-pressed', String(x.dataset.lang === l));
      });
      b.setAttribute('lang', l); b.dataset.lang = l;
      detail.appendChild(b);
    }
    // in a duel the bout goes on in its language, the next page speaks the new one
    if (o.inDuel) detail.appendChild(note(tx('set.language.later')));
  };

  // ---------------------------------------------------------------- the page
  let pendingFocus = false;
  const show = (sec: SettingsSection): void => {
    shown = sec;
    const [t, s] = SECTION_KEY[sec];
    title.textContent = tx(t); sub.textContent = tx(s);
    detail.replaceChildren();
    if (sec === 'graphics') graphics();
    else if (sec === 'sound') sound();
    else if (sec === 'language') language();
    else {
      controls(null);
      // the gamepad's own family and vibration, once its layer is loaded (a page without a pad keeps the Xbox's caps)
      void import('../input/PadInput').then((m) => { if (shown === 'controls' && root.isConnected) { const f = document.activeElement; const at = [...detail.querySelectorAll('button')].indexOf(f as HTMLButtonElement); detail.replaceChildren(); controls(m); if (at >= 0) (detail.querySelectorAll('button')[at] as HTMLElement | undefined)?.focus(); fit(); } });
    }
    detail.scrollTop = 0; fit();
  };
  /** the part drawn again (a choice that changes another: the quality and its three settings), the focus kept on the same control */
  const redraw = (): void => {
    const all = (): HTMLElement[] => [...detail.querySelectorAll<HTMLElement>('button, input')];
    const at = all().indexOf(document.activeElement as HTMLElement);
    show(shown);
    if (at >= 0) all()[at]?.focus();
  };
  const enter = (): void => {
    const first = detail.querySelector<HTMLElement>('button, input');
    if (first) first.focus(); else pendingFocus = true;
  };

  for (const sec of SECTIONS) {
    const [t, s] = SECTION_KEY[sec];
    const row = pickRow(`<span>${esc(tx(t))}<span class="why">${esc(tx(s))}</span></span>`, { select: () => { if (shown !== sec || !detail.childElementCount) show(sec); }, press: enter });
    row.dataset.section = sec;
    row.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); enter(); } });
    rows.set(sec, row); list.appendChild(row);
  }
  // the parts: ↑ ↓ walk them around their ends
  list.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault(); e.stopPropagation();
    const i = SECTIONS.indexOf(shown), n = SECTIONS.length, next = SECTIONS[(i + (e.key === 'ArrowDown' ? 1 : -1) + n) % n];
    rows.get(next)!.focus();
  });
  // a part's settings: ↑ ↓ walk them (a slider's own ↑ ↓ included), ↑ at the top back to the parts, ← on a switch too
  detail.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement;
    const all = [...detail.querySelectorAll<HTMLElement>('button, input')], i = all.indexOf(t);
    if (i < 0) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); e.stopPropagation();
      if (e.key === 'ArrowUp' && i === 0) { rows.get(shown)!.focus(); return; }
      all[Math.min(all.length - 1, Math.max(0, i + (e.key === 'ArrowDown' ? 1 : -1)))].focus();
    } else if (e.key === 'ArrowLeft' && t.dataset.ctl === 'toggle') { e.preventDefault(); e.stopPropagation(); rows.get(shown)!.focus(); }
  });
  // the way out answers Esc here (the title screen and the duel have no page listener of their own)
  root.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } });
  // a change made elsewhere (N mutes, another page) is drawn again
  const off = onSettings(() => { if (root.isConnected && shown !== 'sound') redraw(); });
  const onMute = () => { if (root.isConnected && shown === 'sound') void import('../audio/Sound').then((m) => detail.querySelector('kbd')?.closest('button')?.setAttribute('aria-pressed', String(m.sound().settings.muted))); };
  window.addEventListener('cdt-sound', onMute);
  const onFull = () => { if (root.isConnected && shown === 'graphics') redraw(); };
  document.addEventListener('fullscreenchange', onFull);
  let closed = false;
  const close = (): void => { if (closed) return; closed = true; off(); window.removeEventListener('cdt-sound', onMute); document.removeEventListener('fullscreenchange', onFull); root.remove(); o.close(); };

  show(shown);
  return {
    root,
    focus: () => { const r = rows.get(shown)!; r.focus(); if (o.section) enter(); },
  };
}
