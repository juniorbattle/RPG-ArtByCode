import { driven, LANGS, langOf, loadSettings, saveSettings, type Lang } from './settings';

/** The language of the page (the operator's sheet of journal Passe RG2: RG-9 « La langue du navigateur, puis le choix gardé », RG-10 « Réglages et ligne de
 *  l’écran titre », RG-14): chosen before anything shows; English is the tables' own default, so nothing is loaded for it (the free-roaming district's static
 *  imports stay free of the game's modules), the French table and the text module come on demand; `<html lang>` follows. A change made later is kept and
 *  applied by reloading the page (a game saves after every action), or at the next page in a duel (src/ui/settings.ts). */

let current: Lang = 'en';
export const pageLang = (): Lang => current;

/** the page's language set: at once for English (nothing to load), after the French table otherwise */
export function startLanguage(): Promise<void> | null {
  // an address's own `lang=` first (the tools and the proofs, as `res=` and the others), then the player's choice, the browser's, English when driven
  const asked = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('lang') : null;
  const l = asked && (LANGS as readonly string[]).includes(asked) ? (asked as Lang) : langOf(loadSettings(), typeof navigator !== 'undefined' ? navigator.language : undefined, driven());
  if (l === 'en') return null;
  return Promise.all([import('../narrative/text'), import('../narrative/text/fr')])
    .then(([text, fr]) => { text.useLanguage('fr', fr.FR); current = 'fr'; document.documentElement.setAttribute('lang', 'fr'); })
    .catch((e) => { console.error('language: the French table could not be loaded', e); });
}

/** a page that speaks English whatever the choice (today's game, `v2=0`: RG-14 « v2=0 et le panneau DEV en anglais »), its table swapped by its caller */
export function pageInEnglish(): void { current = 'en'; document.documentElement.setAttribute('lang', 'en'); }

/** the player's choice: kept, then the page reloaded to speak it (`reload` false: kept for the next page) */
export function chooseLanguage(l: Lang, reload = true): void {
  saveSettings({ lang: l });
  if (reload && l !== current) location.reload();
}
