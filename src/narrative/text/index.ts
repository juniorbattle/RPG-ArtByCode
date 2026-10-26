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

/** a skill's name (the catalogue's twelve, src/combat/skillbook.ts) */
const SKILL_KEYS: Record<string, TextKey> = {
  t1: 'skill.t1', t2: 'skill.t2', t3: 'skill.t3', t4: 'skill.t4', d1: 'skill.d1', s1: 'skill.s1',
  k_sunder: 'skill.k_sunder', k_feint: 'skill.k_feint', k_iron: 'skill.k_iron', k_parry: 'skill.k_parry', k_cry: 'skill.k_cry', k_focus: 'skill.k_focus',
};
export function skillName(id: string): string { const k = SKILL_KEYS[id]; return k ? tx(k) : id; }

/** an item's name and what it does (the version 2's gear, src/simulation/gear.ts) */
const ITEM_KEYS: Record<string, [TextKey, TextKey]> = {
  'training-sword': ['gear.training-sword.name', 'gear.training-sword.about'], 'imported-blade': ['gear.imported-blade.name', 'gear.imported-blade.about'],
  'duelist-sabre': ['gear.duelist-sabre.name', 'gear.duelist-sabre.about'], 'padded-jack': ['gear.padded-jack.name', 'gear.padded-jack.about'],
  'mail-shirt': ['gear.mail-shirt.name', 'gear.mail-shirt.about'], 'dock-leathers': ['gear.dock-leathers.name', 'gear.dock-leathers.about'],
  'lucky-ribbon': ['gear.lucky-ribbon.name', 'gear.lucky-ribbon.about'], 'iron-ring': ['gear.iron-ring.name', 'gear.iron-ring.about'],
  'swift-boots': ['gear.swift-boots.name', 'gear.swift-boots.about'], 'fervour-charm': ['gear.fervour-charm.name', 'gear.fervour-charm.about'],
  'docker-wrap': ['gear.docker-wrap.name', 'gear.docker-wrap.about'], 'champion-token': ['gear.champion-token.name', 'gear.champion-token.about'],
  whetstone: ['gear.whetstone.name', 'gear.whetstone.about'], salve: ['gear.salve.name', 'gear.salve.about'],
};
export function itemText(id: string, part: 'name' | 'about'): string { const k = ITEM_KEYS[id]; return k ? tx(k[part === 'name' ? 0 : 1]) : id; }
