import { deserialize, serialize, type GameState } from '../simulation';

/** The play mode's save (journal Passe L3): one slot in the browser's localStorage, plus a file to keep or move it (GAMEPLAY § 13:
 *  « sauvegarde/chargement »). Every access is guarded: a private window or blocked storage makes the game say so instead of failing. */

const KEY = 'cite-du-tournoi.save';

export function readSave(): { state: GameState | null; error?: string } {
  let text: string | null = null;
  try { text = localStorage.getItem(KEY); } catch { return { state: null, error: 'The browser does not let this page keep a save (private window or blocked storage).' }; }
  if (!text) return { state: null };
  try { return { state: deserialize(text) }; } catch (e) { return { state: null, error: (e as Error).message }; }
}

export function hasSave(): boolean { return !!readSave().state; }

export function writeSave(st: GameState): boolean {
  try { localStorage.setItem(KEY, serialize(st)); return true; } catch { return false; }
}

export function clearSave(): void { try { localStorage.removeItem(KEY); } catch { /* nothing kept */ } }

/** the save as a file the player keeps */
export function downloadSave(st: GameState): void {
  const blob = new Blob([serialize(st)], { type: 'application/json' }), a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `cite-du-tournoi-day${st.day}-${st.slot}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** a save file chosen by the player, checked (format, version, content) before it replaces anything */
export async function loadSaveFile(file: File): Promise<GameState> { return deserialize(await file.text()); }
