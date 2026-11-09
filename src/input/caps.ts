import { tx, type TextKey } from '../narrative/text';
import { firstSlot, type Act, type Slot } from '../settings/keys';
import { keysOf, SETTINGS_EVENT } from '../settings/settings';

/** The key caps of the interface (the remapping sheet, journal Passe RM2): RM-6 « Toutes les touches affichées suivent, tutoriel compris » and RM-7
 *  « Les noms français : Espace, Entrée, Échap, Maj ». A cap of an action the player may rebind carries its action (`data-bind`) and shows the
 *  action's first key in the player's keys, redrawn at every change of the settings; a cap of a fixed key carries its English name (`data-key`, what
 *  the code and the gamepad's layer read) and shows its name in the page's language. While the gamepad is the last device used, src/input/prompts.ts
 *  draws its button in either: by the action, or by the key. */

const escHtml = (s: string): string => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** the named keys a player may choose, in the page's language (a character shows in capitals, any other name as the browser gives it) */
const NAMED: Record<string, TextKey> = {
  ' ': 'key.space', Shift: 'key.shift', ArrowUp: 'key.up', ArrowDown: 'key.down', ArrowLeft: 'key.left', ArrowRight: 'key.right',
  Delete: 'key.delete', Insert: 'key.insert', Home: 'key.home', End: 'key.end', PageUp: 'key.pageUp', PageDown: 'key.pageDown',
};
/** a kept key as a cap names it; an empty slot is a dash */
export function slotName(sl: Slot | null): string {
  if (!sl) return '—';
  const n = NAMED[sl.k];
  if (n) return tx(n);
  if (sl.k.length === 1) { const u = sl.k.toUpperCase(); return u.length === 1 ? u : sl.k; }
  return sl.k;
}
/** the fixed keys' names (their caps' `data-key` stays the English name) */
const FIXED: Record<string, TextKey> = { Esc: 'key.esc', Enter: 'key.enter', Space: 'key.space', Shift: 'key.shift' };
export const fixedName = (k: string): string => (FIXED[k] ? tx(FIXED[k]) : k);

/** the key an action shows: its first slot in the player's keys */
export const actName = (a: Act): string => slotName(firstSlot(keysOf()[a]));
/** an action's cap */
export const bindCap = (a: Act, attrs = ''): string => `<kbd data-bind="${a}"${attrs ? ` ${attrs}` : ''}>${escHtml(actName(a))}</kbd>`;
/** a fixed key's cap */
export const keyCap = (k: string, attrs = ''): string => `<kbd data-key="${escHtml(k)}"${attrs ? ` ${attrs}` : ''}>${escHtml(fixedName(k))}</kbd>`;

/** every action's cap shows the player's key again (a cap showing the gamepad's button keeps the key for when the keys come back) */
export function refreshCaps(root: ParentNode = document): void {
  for (const k of root.querySelectorAll<HTMLElement>('kbd[data-bind]')) {
    const name = actName(k.dataset.bind as Act);
    if (k.dataset.txt !== undefined) k.dataset.txt = name;
    else if (k.textContent !== name) k.textContent = name;
  }
}
if (typeof window !== 'undefined' && typeof document !== 'undefined') window.addEventListener(SETTINGS_EVENT, () => refreshCaps());
