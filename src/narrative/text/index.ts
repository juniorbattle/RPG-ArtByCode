import { EN, type TextKey } from './en';

/** The game's texts gathered in tables (the operator's decision AV-4, « Anglais, textes rassemblés », journal Passes AV1 / V0): every sentence
 *  the simulation writes (actions, refusals, the log, the people's words) lives in a table of templates (`en.ts` for the English), so a
 *  translation is a table of the same keys, a task of its own. A template's `{name}` is replaced by the value given; a missing value throws (a
 *  text never shows its braces). Pure. */

export type { TextKey } from './en';
export type TextTable = Record<TextKey, string>;

/** the table in use: the English (the only one; another language is a task of its own) */
let TABLE: TextTable = EN;

/** a text of the table, its `{name}` slots filled */
export function tx(key: TextKey, vars?: Record<string, string | number>): string {
  const t = TABLE[key];
  if (t === undefined) throw new Error(`no text "${key}"`);
  return t.replace(/\{(\w+)\}/g, (_, k: string) => {
    const v = vars?.[k];
    if (v === undefined) throw new Error(`text "${key}": no value for {${k}}`);
    return String(v);
  });
}

/** the table's raw template (for tests and a translator's tools) */
export function template(key: TextKey): string { return TABLE[key]; }

/** swaps the table (tests; a later translation): the same keys only */
export function useTable(t: TextTable): void { TABLE = t; }
