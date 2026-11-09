import { parseFrameCap, type FrameCapMode } from '../app/FrameCap';

/** The player's settings (the operator's sheet of journal Passe RG2, fifteen of fifteen at the recommendation): the graphics a player can change
 *  (RG-3, RG-4), the reduced motion (RG-5, the operator's rule of 2026-11-03: a setting of the game, off by default, never read from the system), the
 *  keyboard's layout (RG-7) and the language (RG-9). Kept in the browser (`cite-du-tournoi.settings`) and read by every scene at its start and at
 *  every change (`cdt-settings`). The sound's volumes stay in the sound engine's own record (src/audio/score.ts), the gamepad's vibration in the
 *  pad's (src/input/PadInput.ts). Nothing stored = today's game, to the pixel: the defaults are the operator's choices of journal Passes 6e to 6h.
 *  An address's own parameter (`res=`, `msaa=`, `refl=`, `fps=`, the tools and the proofs) wins over a stored setting. Pure, but for the storage. */

export type ResSetting = 'native' | 1440 | 1080 | 900 | 720;
export type MsaaSetting = 0 | 2 | 4 | 8;
export type ReflSetting = 0.25 | 0.5 | 1;
/** frames per second: 30, 60 (today's adaptive cap) or 0, none */
export type FpsSetting = 30 | 60 | 0;
export type Layout = 'qwerty' | 'azerty';
export type Lang = 'en' | 'fr';

export interface GameSettings {
  res: ResSetting; msaa: MsaaSetting; refl: ReflSetting; fps: FpsSetting;
  /** depth of field and bloom: on by default, the look of the game depends on them (RG-4) */
  dof: boolean; bloom: boolean;
  reducedMotion: boolean;
  /** null: the keyboard the browser announces, else the language's (RG-7) */
  keyboard: Layout | null;
  /** null: the browser's language at the first launch (RG-9) */
  lang: Lang | null;
}

export const DEFAULT_SETTINGS: Readonly<GameSettings> = Object.freeze({ res: 'native', msaa: 4, refl: 0.5, fps: 60, dof: true, bloom: true, reducedMotion: false, keyboard: null, lang: null });

export const RES_STEPS: readonly ResSetting[] = ['native', 1440, 1080, 900, 720];
export const MSAA_STEPS: readonly MsaaSetting[] = [0, 2, 4, 8];
export const REFL_STEPS: readonly ReflSetting[] = [0.25, 0.5, 1];
export const FPS_STEPS: readonly FpsSetting[] = [30, 60, 0];

/** the « Quality » line (RG-3): each tier sets the resolution, the anti-aliasing and the water's reflection; « high » is today's default */
export type Quality = 'low' | 'medium' | 'high' | 'ultra';
export const QUALITY: Readonly<Record<Quality, Pick<GameSettings, 'res' | 'msaa' | 'refl'>>> = Object.freeze({
  low: { res: 720, msaa: 0, refl: 0.25 },
  medium: { res: 1080, msaa: 2, refl: 0.25 },
  high: { res: 'native', msaa: 4, refl: 0.5 },
  ultra: { res: 'native', msaa: 8, refl: 1 },
});
export const QUALITY_STEPS: readonly Quality[] = ['low', 'medium', 'high', 'ultra'];

/** the tier the settings make, or null when they make none (« custom ») */
export function qualityOf(s: Pick<GameSettings, 'res' | 'msaa' | 'refl'>): Quality | null {
  return QUALITY_STEPS.find((q) => QUALITY[q].res === s.res && QUALITY[q].msaa === s.msaa && QUALITY[q].refl === s.refl) ?? null;
}

const one = <T>(steps: readonly T[], v: unknown, d: T): T => (steps.includes(v as T) ? (v as T) : d);

/** a stored record read back, every field checked: a broken or unknown value is its default */
export function readSettings(text: string | null): GameSettings {
  let o: Record<string, unknown> = {};
  try { const v = JSON.parse(text ?? 'null'); if (v && typeof v === 'object' && !Array.isArray(v)) o = v; } catch { /* the defaults */ }
  const d = DEFAULT_SETTINGS, flag = (v: unknown, def: boolean) => (typeof v === 'boolean' ? v : def);
  return {
    res: one(RES_STEPS, o.res, d.res), msaa: one(MSAA_STEPS, o.msaa, d.msaa), refl: one(REFL_STEPS, o.refl, d.refl), fps: one(FPS_STEPS, o.fps, d.fps),
    dof: flag(o.dof, d.dof), bloom: flag(o.bloom, d.bloom), reducedMotion: flag(o.reducedMotion, d.reducedMotion),
    keyboard: o.keyboard === 'qwerty' || o.keyboard === 'azerty' ? o.keyboard : null,
    lang: o.lang === 'en' || o.lang === 'fr' ? o.lang : null,
  };
}

// ---------------------------------------------------------------- the graphics a scene applies

export interface ResCap { pixels: number; filter: 'smooth' | 'pixelated' }
export interface Graphics { resCap: ResCap | null; msaa: number; refl: number; frameCap: FrameCapMode; dof: boolean; bloom: boolean }

/** today's frame cap (journal pass 6h: `a60`, chosen by the operator on 2026-10-18) */
export const DEFAULT_FRAME_CAP: FrameCapMode = { kind: 'adaptive', fps: 60 };

/** what a scene renders with: an address's own parameter first (the tools, the proofs, journal Passes 6e to 6h), then the stored setting */
export function graphicsFrom(params: URLSearchParams, s: GameSettings): Graphics {
  const rm = params.get('res')?.match(/^(\d{3,4})p(?::(px|pixelated|smooth))?$/);
  const resCap: ResCap | null = rm ? { pixels: Math.round((+rm[1] * +rm[1] * 16) / 9), filter: rm[2] === 'px' || rm[2] === 'pixelated' ? 'pixelated' : 'smooth' }
    : params.has('res') || s.res === 'native' ? null : { pixels: Math.round((s.res * s.res * 16) / 9), filter: 'smooth' };
  const ms = Number(params.get('msaa')), msaa = params.has('msaa') && [0, 2, 4, 8].includes(ms) ? ms : s.msaa;
  const rf = Number(params.get('refl')), refl = rf > 0 && rf <= 1 ? rf : s.refl;
  const frameCap = parseFrameCap(params.get('fps')) ?? (s.fps === 0 ? { kind: 'off' } : s.fps === 30 ? { kind: 'even', fps: 30 } : DEFAULT_FRAME_CAP);
  return { resCap, msaa, refl, frameCap, dof: s.dof, bloom: s.bloom };
}

/** the pixel ratio a scene renders at under a resolution cap (journal pass 6, P6): above the budget, smaller, and the browser scales the canvas up */
export function capRatio(w: number, h: number, dpr: number, cap: ResCap | null): number {
  return dpr * (cap ? Math.min(1, Math.sqrt(cap.pixels / (w * dpr * h * dpr))) : 1);
}

// ---------------------------------------------------------------- the keyboard (RG-7)

/** whether the browser is driven by a tool (the proofs keep today's keyboard and language, as the bare address keeps the night district there) */
export const driven = (): boolean => typeof navigator !== 'undefined' && navigator.webdriver === true;

/** the layout a language suggests when the browser does not announce its keyboard: French of France, Belgium, Luxembourg, Monaco types on AZERTY */
export function layoutOfLanguage(lang: string | undefined): Layout {
  return /^fr(-(fr|be|lu|mc))?$/i.test(lang ?? '') ? 'azerty' : 'qwerty';
}

/** the layout the browser's keyboard map announces (Chrome, Edge): the key at the place of QWERTY's Q types an « a » on AZERTY */
export function layoutOfMap(map: { get(code: string): string | undefined } | null): Layout | null {
  const q = map?.get('KeyQ')?.toLowerCase(), w = map?.get('KeyW')?.toLowerCase();
  return q === 'a' && w === 'z' ? 'azerty' : q === 'q' ? 'qwerty' : null;
}

/** the game's key for a key typed (RG-7): on AZERTY, Z, Q, S, D walk where QWERTY's W, A, S, D do, and A opens the list where QWERTY's Q does; the
 *  other letters of the game are the same on both keyboards. A key the gamepad presses (`trusted` false: src/input/PadInput.ts) is already the
 *  game's key. Lowercase, as the game reads them. */
export function gameKey(key: string, layout: Layout, trusted = true): string {
  const k = key.toLowerCase();
  if (layout !== 'azerty' || !trusted) return k;
  return k === 'z' ? 'w' : k === 'q' ? 'a' : k === 'a' ? 'q' : k === 'w' ? 'z' : k;
}

/** the key a player presses for one of the game's keys, as a cap shows it (uppercase) */
export function shownKey(key: string, layout: Layout): string {
  const k = key.toLowerCase(), t = layout !== 'azerty' ? k : k === 'w' ? 'z' : k === 'a' ? 'q' : k === 'q' ? 'a' : k === 'z' ? 'w' : k;
  return t.length === 1 ? t.toUpperCase() : key;
}

// ---------------------------------------------------------------- the language (RG-9)

/** the languages the game is written in (the French comes with the second lot of journal Passe RG2) */
export const LANGS: readonly Lang[] = ['en'];

/** the language the game speaks: the player's choice, else the browser's (French when it is, among the languages written), English in a driven browser */
export function langOf(s: GameSettings, browser: string | undefined, isDriven: boolean): Lang {
  if (s.lang && LANGS.includes(s.lang)) return s.lang;
  if (isDriven) return 'en';
  const b = (browser ?? '').slice(0, 2).toLowerCase() as Lang;
  return LANGS.includes(b) ? b : 'en';
}

// ---------------------------------------------------------------- the record in the browser

const KEY = 'cite-du-tournoi.settings';
/** the event every scene listens to: the settings changed (detail: the new settings) */
export const SETTINGS_EVENT = 'cdt-settings';

let cached: GameSettings | null = null;
export function loadSettings(): GameSettings {
  if (cached) return cached;
  let t: string | null = null;
  try { t = localStorage.getItem(KEY); } catch { /* storage blocked: the defaults */ }
  return (cached = readSettings(t));
}

/** changes some settings: kept, then told to every scene */
export function saveSettings(patch: Partial<GameSettings>): GameSettings {
  const s = (cached = { ...loadSettings(), ...patch });
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* not kept: this page only */ }
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: s }));
  return s;
}

/** a scene's handler for every change of the settings; returns its removal */
export function onSettings(f: (s: GameSettings) => void): () => void {
  const h = (e: Event) => f((e as CustomEvent<GameSettings>).detail ?? loadSettings());
  window.addEventListener(SETTINGS_EVENT, h);
  return () => window.removeEventListener(SETTINGS_EVENT, h);
}

// ---------------------------------------------------------------- what follows the settings in the page

let detected: Layout | null = null;
/** the keyboard the game reads now: the player's choice, else the one the browser announced, else the language's; QWERTY in a driven browser */
export function layout(s: GameSettings = loadSettings()): Layout {
  if (s.keyboard) return s.keyboard;
  if (driven()) return 'qwerty';
  return detected ?? layoutOfLanguage(typeof navigator !== 'undefined' ? navigator.language : undefined);
}

/** asks the browser for its keyboard once (Chrome and Edge answer; the others leave the language's guess) */
export function detectLayout(): void {
  type KeyboardApi = { getLayoutMap?: () => Promise<{ get(code: string): string | undefined }> };
  const kb = (typeof navigator !== 'undefined' ? (navigator as unknown as { keyboard?: KeyboardApi }).keyboard : undefined);
  if (driven() || !kb?.getLayoutMap) return;
  void kb.getLayoutMap().then((m) => {
    const l = layoutOfMap(m);
    if (l && l !== detected) { detected = l; if (!loadSettings().keyboard) window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: loadSettings() })); }
  }).catch(() => { /* refused: the language's guess stays */ });
}

/** the game's key for a key event (RG-7) */
export const keyOf = (e: KeyboardEvent): string => gameKey(e.key, layout(), e.isTrusted);

/** the reduced motion on the page (RG-5): a class on the document that the interface's styles read (`html.cdt-reduced`), never the system's
 *  setting; the fades stay */
export function applyMotion(s: GameSettings = loadSettings()): void {
  if (typeof document !== 'undefined') document.documentElement.classList.toggle('cdt-reduced', s.reducedMotion);
}
export const reducedMotion = (): boolean => loadSettings().reducedMotion;
