import { tx, type TextKey } from '../narrative/text';
import { capOf } from '../input/glyphs';
import { BTN, type Btn, type PadFamily } from '../input/pad';
import {
  FPS_STEPS, keysOf, LANGS, layout, loadSettings, MSAA_STEPS, onSettings, QUALITY, QUALITY_STEPS, qualityOf, REFL_STEPS, RES_STEPS, saveKeys, saveSettings,
  type GameSettings, type Lang, type Layout, type Quality,
} from '../settings/settings';
import { DEFAULT_KEYS, labelOf, normCode, rebind, reserved, type Act, type KeyTable, type Slot } from '../settings/keys';
import { bindCap, fixedName, slotName } from '../input/caps';
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
.pm-keys td .why{display:block;font-size:var(--ds-fs-small);color:var(--ds-muted)}
.pm-keys tr.fixed td{color:var(--ds-muted)}
.pm-slot{display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;min-width:44px;height:34px;margin:2px 0 2px 6px;padding:0 10px;font:600 var(--ds-fs-small)/1 var(--ds-text);color:var(--ds-ivory);background:transparent;border:1px solid var(--ds-muted);border-radius:3px;cursor:pointer;white-space:nowrap}
.pm-slot:hover,.pm-slot:focus,.pm-slot.wait{border-color:var(--ds-accent);color:var(--ds-accent);outline:none}
.pm-slot.empty{color:var(--ds-muted)}
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
/** each action's line (the remapping sheet, journal Passe RM2) */
const ACT_LABEL: Record<Act, TextKey> = {
  up: 'set.keys.up', down: 'set.keys.down', left: 'set.keys.left', right: 'set.keys.right', run: 'set.keys.run', talk: 'set.keys.talk', list: 'set.keys.here', map: 'set.keys.map',
  journal: 'set.keys.journal', board: 'set.keys.board', skills: 'set.keys.skills', gear: 'set.keys.gear', settings: 'set.keys.settingsPage', guide: 'set.keys.guide', mute: 'set.keys.mute',
  attack: 'set.keys.attack', guard: 'set.keys.guard', dodge: 'set.keys.dodge', pause: 'set.keys.pause',
  skill1: 'set.keys.skill1', skill2: 'set.keys.skill2', skill3: 'set.keys.skill3', skill4: 'set.keys.skill4',
};
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
  /** a switch (its key's cap, html: src/input/caps.ts) */
  const toggle = (label: string, get: () => boolean, set: (v: boolean) => void, note = '', capHtml = ''): HTMLButtonElement => {
    const b = el('button', 'pm-btn', `<i class="pm-check"></i><span>${esc(label)}${note ? `<span class="why">${esc(note)}</span>` : ''}</span>${capHtml}`);
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
        toggle(tx('v2.sound.mute'), () => snd.settings.muted, (v) => snd.set({ muted: v }), '', bindCap('mute')),
      );
      // the page opened from the keyboard on this part lands on its first control
      if (pendingFocus) { pendingFocus = false; (detail.children[at]?.querySelector('input') as HTMLElement | null)?.focus(); }
      fit();
    });
  };

  // ---------------------------------------------------------------- the player's keys (the remapping sheet, journal Passes RM1 / RM2)
  /** the last change, said on its line (kept across the redraw the change causes) */
  let said: { at: string; text: string } | null = null;
  /** a slot waiting for its key: what ends the wait */
  let waiting: (() => void) | null = null;
  const stopWait = (): void => { waiting?.(); waiting = null; };
  const actLabel = (a: Act): string => tx(ACT_LABEL[a]);

  /** RM-8 « Dans la partie Contrôles, une ligne par action »: Enter or a click on a slot, then the key; Esc cancels, Backspace empties the slot; the key
   *  already taken in the same moment swapped (RM-4), the reserved keys refused, the change said on its line; the gamepad cannot give a key (RM-3) */
  const wait = (b: HTMLButtonElement): void => {
    stopWait();
    const act = b.dataset.act as Act, col = Number(b.dataset.col ?? 0) as 0 | 1;
    b.textContent = tx('set.keys.wait'); b.classList.add('wait');
    const cell = b.closest('tr')?.querySelector('td');
    cell?.querySelector('.why')?.remove();
    cell?.insertAdjacentHTML('beforeend', `<span class="why" role="status">${esc(tx('set.keys.wait.sub', { act: actLabel(act) }))}</span>`);
    fit();
    let swallow: string | null = null;
    const stop = (): void => { window.removeEventListener('keydown', onKey, true); document.removeEventListener('pointerdown', onPointer, true); waiting = null; };
    const cancel = (): void => { stop(); window.removeEventListener('keyup', onUp, true); said = null; redraw(); };
    const done = (text: string, table?: KeyTable): void => { said = { at: act, text }; stop(); if (table) saveKeys(table); else redraw(); };
    function onKey(e: KeyboardEvent): void {
      e.preventDefault(); e.stopImmediatePropagation();
      if (e.repeat) return;
      if (e.key === 'Escape') { cancel(); return; }
      if (!e.isTrusted) return;
      if (e.key === 'Backspace') {
        swallow = 'Backspace';
        const r = rebind(keysOf(), act, col, null);
        done(r.ok ? tx('set.keys.cleared', { act: actLabel(act) }) : tx('set.keys.last', { act: actLabel(act) }), r.ok ? r.table : undefined);
        return;
      }
      const sl: Slot = { c: normCode(e.code, e.key), k: labelOf(e.key) }, name = slotName(sl);
      swallow = sl.c;
      if (reserved(sl.c, sl.k)) { done(tx('set.keys.reserved', { key: name })); return; }
      const r = rebind(keysOf(), act, col, sl);
      if (!r.ok) { done(r.why === 'clash' ? tx('set.keys.clash', { key: name, other: actLabel(r.act ?? act) }) : r.why === 'last' ? tx('set.keys.last', { act: actLabel(r.act ?? act) }) : tx('set.keys.reserved', { key: name })); return; }
      const sw = r.swaps[0];
      done(!sw ? tx('set.keys.done', { key: name, act: actLabel(act) })
        : sw.to ? tx('set.keys.swapped', { key: name, act: actLabel(act), other: actLabel(sw.act), old: slotName(sw.to) })
          : tx('set.keys.emptied', { key: name, act: actLabel(act), other: actLabel(sw.act) }), r.table);
    }
    // the chosen key's release stays here too (Space released on the slot would press it again)
    function onUp(e: KeyboardEvent): void { if (swallow && normCode(e.code, e.key) === swallow) { e.preventDefault(); e.stopImmediatePropagation(); swallow = null; window.removeEventListener('keyup', onUp, true); } }
    function onPointer(e: PointerEvent): void { if (e.target !== b) cancel(); }
    window.addEventListener('keydown', onKey, true); window.addEventListener('keyup', onUp, true); document.addEventListener('pointerdown', onPointer, true);
    waiting = () => { stop(); window.removeEventListener('keyup', onUp, true); };
  };
  /** a slot's arrows: ← → its line's other slot (← on the first back to the parts), ↑ ↓ the same slot on the line above or below */
  const slotKey = (e: KeyboardEvent, b: HTMLButtonElement): void => {
    if (waiting) return;
    const col = Number(b.dataset.col ?? 0);
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault(); e.stopPropagation();
      if (e.key === 'ArrowLeft' && col === 0) { rows.get(shown)!.focus(); return; }
      b.closest('td')?.querySelector<HTMLElement>(`.pm-slot[data-col="${e.key === 'ArrowLeft' ? 0 : 1}"]`)?.focus();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); e.stopPropagation();
      const d = e.key === 'ArrowDown' ? 1 : -1, all = [...detail.querySelectorAll<HTMLElement>('button, input')];
      const same = all.filter((x) => x.classList.contains('pm-slot') && x.dataset.col === b.dataset.col), i = same.indexOf(b);
      const out = (x: HTMLElement) => !x.classList.contains('pm-slot');
      (same[i + d] ?? (d > 0 ? all.slice(all.indexOf(same[same.length - 1]) + 1).find(out) : all.slice(0, all.indexOf(same[0])).reverse().find(out)))?.focus();
    }
  };

  const controls = (padIn: typeof import('../input/PadInput') | null): void => {
    const lay = layout(), fam: PadFamily = padIn?.pad()?.family ?? 'xbox', keys = keysOf();
    detail.append(choice(tx('set.keyboard'), ['qwerty', 'azerty'] as const, () => layout(), (v) => { said = null; saveSettings({ keyboard: v }); }, (v) => LAYOUT_LABEL[v ?? 'qwerty'], tx('set.keyboard.sub')));
    if (padIn) detail.appendChild(toggle(tx('v2.sound.vibration'), () => padIn.padSettings().vibration, (v) => padIn.setPadSettings({ vibration: v })));
    detail.appendChild(note(tx('set.keys.rebind')));
    const table = (html: string) => { const t = el('table', 'pm-keys'); t.innerHTML = html; return t; };
    const why = (at: string) => (said?.at === at ? `<span class="why" role="status">${esc(said.text)}</span>` : '');
    const slot = (a: Act, i: 0 | 1) => {
      const sl = keys[a][i], name = slotName(sl);
      return `<button class="pm-slot${sl ? '' : ' empty'}" type="button" data-act="${a}" data-col="${i}" aria-label="${esc(tx('set.keys.slot', { act: actLabel(a), n: i + 1, key: name }))}">${esc(name)}</button>`;
    };
    // an action the player may rebind (RM-1): its two slots (RM-2) and the gamepad's buttons beside, which stay as they are (RM-3)
    const own = (a: Act, pd: string) => `<tr data-row="${a}"><td>${esc(actLabel(a))}${why(a)}</td><td class="k">${slot(a, 0)}${slot(a, 1)}</td><td class="p">${pd}</td></tr>`;
    // a fixed key (RM-1: Esc, Enter, the pages' arrows and Space), in grey, its name in the page's language (RM-7)
    const fixed = (label: TextKey, kb: string, pd: string) => `<tr class="fixed"><td>${esc(tx(label))}</td><td class="k">${kb}</td><td class="p">${pd}</td></tr>`;
    const via = `<span class="via">${esc(tx('set.keys.viaMenu'))}</span>`, walkPad = (b: Btn) => cap(fam, BTN.LS, b);
    detail.append(
      heading(tx('set.keys.walk')),
      table(own('up', walkPad(BTN.UP)) + own('down', walkPad(BTN.DOWN)) + own('left', walkPad(BTN.LEFT)) + own('right', walkPad(BTN.RIGHT))
        + own('run', cap(fam, BTN.B)) + own('talk', cap(fam, BTN.A)) + own('list', cap(fam, BTN.Y)) + fixed('set.keys.menu', key(fixedName('Esc')), cap(fam, BTN.START))
        + own('map', cap(fam, BTN.VIEW)) + (['journal', 'board', 'skills', 'gear', 'settings', 'guide', 'mute'] as const).map((a) => own(a, via)).join('')),
      heading(tx('set.keys.page')),
      table(fixed('set.keys.choose', key('↑', '↓'), cap(fam, BTN.UP, BTN.LS)) + fixed('set.keys.press', key(fixedName('Enter')), cap(fam, BTN.A))
        + fixed('set.keys.back', key(fixedName('Esc')), cap(fam, BTN.B)) + fixed('set.keys.space', key(fixedName('Space')), cap(fam, BTN.X))
        + fixed('set.keys.tab', '', cap(fam, BTN.LB, BTN.RB)) + fixed('set.keys.scroll', '', cap(fam, BTN.RS))),
      heading(tx('set.keys.duel')),
      // the duel played by the computer (journal Passe LC3; LC3-8 « Garder ainsi ; renommer au lot 5 », renamed in Passe CO1 at the operator's « corriger cela
      // en priorite »): the attack's key gives ×2, the dodge's « Skip », the guard's nothing (its line left out, as the guide's « Keys » chapter leaves it out)
      table(own('attack', cap(fam, BTN.X, BTN.RT)) + own('dodge', cap(fam, BTN.A)) + own('pause', cap(fam, BTN.START))
        // the hand (lot 2 of the second redesign): the four of the order, on the D-pad
        + own('skill1', cap(fam, BTN.UP)) + own('skill2', cap(fam, BTN.RIGHT)) + own('skill3', cap(fam, BTN.DOWN)) + own('skill4', cap(fam, BTN.LEFT))
        + fixed('set.keys.settings', key(fixedName('Esc')), cap(fam, BTN.Y))),
    );
    // « Default keys »: the shown keyboard's starting keys back (RM-5)
    const reset = el('button', 'pm-btn', `<span>${esc(tx('set.keys.default'))}<span class="why">${esc(tx('set.keys.default.sub', { layout: LAYOUT_LABEL[lay] }))}</span>${why('reset')}</span>`);
    reset.addEventListener('click', () => { said = { at: 'reset', text: tx('set.keys.reset', { layout: LAYOUT_LABEL[lay] }) }; saveKeys(DEFAULT_KEYS[lay], lay); });
    detail.appendChild(reset);
    for (const b of detail.querySelectorAll<HTMLButtonElement>('.pm-slot')) {
      b.addEventListener('click', () => wait(b));
      b.addEventListener('keydown', (e) => slotKey(e, b));
    }
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
    // a change said on its line belongs to its part (the remapping's messages, journal Passe RM3)
    if (sec !== shown) { said = null; stopWait(); }
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
  const close = (): void => { if (closed) return; closed = true; stopWait(); off(); window.removeEventListener('cdt-sound', onMute); document.removeEventListener('fullscreenchange', onFull); root.remove(); o.close(); };

  show(shown);
  return {
    root,
    focus: () => { const r = rows.get(shown)!; r.focus(); if (o.section) enter(); },
  };
}
