import { EN, type TextKey } from './en';

/** The game's texts gathered in tables (the operator's decision AV-4, « Anglais, textes rassemblés », journal Passes AV1 / V0): every sentence
 *  the simulation writes (actions, refusals, the log, the people's words) lives in a table of templates (`en.ts` for the English), so a
 *  translation is a table of the same keys, a task of its own. A template's `{name}` is replaced by the value given; a missing value throws (a
 *  text never shows its braces). Pure. */

export type { TextKey } from './en';
/** a language's table: every key of the English, and possibly the forms its grammar needs (`<key>|<form>`, e.g. `place.forecourt|to`) */
export type TextTable = Record<TextKey, string> & Partial<Record<string, string>>;

/** the table in use: the English by default, the French once chosen (journal Passe RG4) */
let TABLE: TextTable = EN;
let LANG: 'en' | 'fr' = 'en';
/** the language the game speaks now */
export const lang = (): 'en' | 'fr' => LANG;

/** what a text says, whatever its language (journal Passe RG4, RG-13 « Tout change, le journal déjà écrit compris »): its key and its values, a value
 *  that was itself a text kept as its own reference; a log line keeps one (`$t`) beside its English sentence, and is shown in the language chosen */
export interface TextRef { k: string; v?: Record<string, string | number | TextRef> }
export const isRef = (x: unknown): x is TextRef => !!x && typeof x === 'object' && typeof (x as TextRef).k === 'string';

/** the texts said lately and what they said (a bounded memory, oldest first): a value that is a text keeps its reference, a log line finds its own */
const SAID = new Map<string, TextRef>();
const SAID_MAX = 6000;
function remember(out: string, ref: TextRef): void {
  if (SAID.has(out)) SAID.delete(out);
  SAID.set(out, ref);
  if (SAID.size > SAID_MAX) SAID.delete(SAID.keys().next().value as string);
}
/** the reference of a text said lately (a log line, a cause, a refusal), or undefined: a sentence the tables did not write */
export function refOf(text: string): TextRef | undefined { return SAID.get(text); }

/** a template filled: `{name}` the value; `{name|form}` the form of a value that is a text (`<its key>|<form>` in the table, else the value itself); in
 *  French, the article of a value meets the word before it (à + le = au, de + les = des, de + a vowel = d’) */
function fill(key: string, t: string, vars?: Record<string, string | number>): string {
  let out = '', last = 0;
  for (const m of t.matchAll(/\{(\w+)(?:\|(\w+))?\}/g)) {
    out += t.slice(last, m.index); last = m.index! + m[0].length;
    const k = m[1], form = m[2], v = vars?.[k];
    if (v === undefined) throw new Error(`text "${key}": no value for {${k}}`);
    let s = typeof v === 'number' ? num(v) : String(v);
    if (form && LANG === 'fr' && TABLE !== EN && typeof v === 'string') s = word(s);
    if (form && form !== 'cap') { const r = SAID.get(s); const f = r ? TABLE[`${r.k}|${form}`] : undefined; if (r && f !== undefined) s = fill(`${r.k}|${form}`, f, plain(r.v)); }
    // in French, a value the code holds in English (a name, a place, a title) said through the table, then its article meets the word before it
    if (LANG === 'fr' && TABLE !== EN) { if (typeof v === 'string' && !form) s = word(s); [out, s] = contract(out, s); }
    // `{x|cap}`: a value at the head of a sentence (« le sergent Hale » → « Le sergent Hale »)
    if (form === 'cap' && s) s = s[0].toUpperCase() + s.slice(1);
    out += s;
  }
  return out + t.slice(last);
}
/** French contractions where a value comes after « à », « de » or « que » (journal Passe RG4): « à le Parvis » → « au Parvis », « de les lices » → « des
 *  lices », « de Orla » → « d’Orla » (an English h stays: « de Hale ») */
function contract(before: string, v: string): [string, string] {
  const m = /(^|[\s(«'’])(à|À|de|De|que|Que) $/.exec(before);
  if (!m) return [before, v];
  const w = m[2], head = before.slice(0, before.length - w.length - 1), cap = w[0] === w[0].toUpperCase();
  const lower = w.toLowerCase();
  if (lower === 'à' || lower === 'de') {
    const art = /^(le|les) /.exec(v);
    if (art) { const c = lower === 'à' ? (art[1] === 'le' ? 'au' : 'aux') : (art[1] === 'le' ? 'du' : 'des'); return [head + (cap ? c[0].toUpperCase() + c.slice(1) : c) + ' ', v.slice(art[0].length)]; }
  }
  if ((lower === 'de' || lower === 'que') && /^[aeiouyàâäéèêëîïôöûùüœAEIOUYÀÂÉÈÊÎÔÛŒ]/.test(v)) return [head + (cap ? w[0] : w[0].toLowerCase()) + (lower === 'de' ? '’' : 'u’'), v];
  return [before, v];
}
/** a reference's values as strings in the language in use: a value that was a text is said again, a name or a word through the table (`word`) */
function plain(v: TextRef['v']): Record<string, string | number> | undefined {
  if (!v) return undefined;
  const o: Record<string, string | number> = {};
  for (const [k, x] of Object.entries(v)) o[k] = isRef(x) ? render(x) : typeof x === 'string' ? word(x) : x;
  return o;
}

/** an English word or sentence the code holds outside the table (a person's name and title, a rival's epithet, an event's words) in the language in use:
 *  the table's `=<the English>` entry, else the English itself (journal Passe RG4) */
export function word(s: string): string { if (TABLE === EN || !s) return s; const t = TABLE[`=${s}`]; return t ?? s; }

/** a number as the language in use writes it: the French decimal comma (« 1,5 s »); `digits` fixed decimals */
export function num(v: number, digits?: number): string { const s = digits === undefined ? String(v) : v.toFixed(digits); return LANG === 'fr' && TABLE !== EN ? s.replace('.', ',') : s; }

/** names or texts listed in a sentence, each one a text of the table so that a page says the list in its language: « a, b and c » with `list.and`; with
 *  `list.last` the English keeps its commas (« a, b, c », as the log was written before the French, so the fingerprints stay) and the French says « a, b et c » */
export function joined(items: readonly string[], last: 'list.and' | 'list.last' = 'list.last'): string {
  return items.reduce((a, b, i) => (i === 0 ? b : tx(i === items.length - 1 ? last : 'list.comma', { a, b })), '');
}

/** a capital first letter */
export const cap = (s: string): string => (s ? s[0].toUpperCase() + s.slice(1) : s);
/** a name without its article, capitalised, in the language in use (a place in the status line: « Merchant District », « Quartier marchand ») */
export function shortName(s: string): string { return cap(word(s).replace(/^(the |le |la |les |l’|l')/i, '')); }

/** a data table's English fields read in the language in use (a person's name and title, a rival's epithet and story): each field becomes a getter
 *  through `word`, the code that reads it unchanged; the simulation, run in English, reads the English */
export function localize<T extends object>(o: T, fields: readonly string[]): T {
  for (const f of fields) {
    const raw = (o as Record<string, unknown>)[f];
    if (typeof raw === 'string') Object.defineProperty(o, f, { get: () => word(raw), enumerable: true, configurable: true });
  }
  return o;
}

/** a text of the table, its `{name}` slots filled */
export function tx(key: TextKey, vars?: Record<string, string | number>): string {
  const t = TABLE[key];
  if (t === undefined) throw new Error(`no text "${key}"`);
  const out = fill(key, t, vars);
  let v: TextRef['v'];
  if (vars) { v = {}; for (const [k, x] of Object.entries(vars)) { const r = typeof x === 'string' ? SAID.get(x) : undefined; v[k] = r ?? x; } }
  remember(out, v ? { k: key, v } : { k: key });
  return out;
}

/** the people who say « tu » to the player in French (RG-11 « Récit en vous, chaque personnage selon qui il est »; the translators' brief of journal Passe RG4) */
const SAYS_TU = new Set(['mara', 'tam', 'pip', 'lio', 'bram', 'orla', 'tobin', 'rhosk', 'kell', 'corra', 'fenwick', 'folk', 'wynn']);
/** a line a person says in their own register, where one table line serves several people (the Lanterns' parade): the table's `<key>|tu` when this
 *  person says « tu » to the player and the language has that form (the English has none: the line as it is) */
export function txBy(who: string, key: TextKey, vars?: Record<string, string | number>): string {
  const k = `${key}|tu`, t = SAYS_TU.has(who) ? TABLE[k] : undefined;
  if (t === undefined) return tx(key, vars);
  const out = fill(k, t, vars);
  let v: TextRef['v'];
  if (vars) { v = {}; for (const [n, x] of Object.entries(vars)) v[n] = (typeof x === 'string' ? SAID.get(x) : undefined) ?? x; }
  remember(out, v ? { k, v } : { k });
  return out;
}

/** what a reference says in the language in use (a key the table lacks gives its English) */
export function render(r: TextRef): string {
  if (!(r.k in TABLE)) return EN[r.k as TextKey] !== undefined ? fill(r.k, EN[r.k as TextKey], plain(r.v)) : r.k;
  return tx(r.k as TextKey, plain(r.v));
}

/** a sentence the simulation kept (a log line, a cause, a refusal) in the language shown: its English as it was written, or what its reference says in
 *  another language (journal Passe RG4, RG-13; a sentence without a reference, from a save made before, stays English) */
export function said(text: string, ref?: TextRef): string { return LANG === 'en' ? text : ref ? render(ref) : word(text); }

/** runs the simulation in English, whatever the language shown (journal Passe RG4): what it keeps in the state (the log, a cause) is the English the
 *  fingerprints were made with; its references let the pages say it in the language chosen */
let canonicalDepth = 0, shown: TextTable = EN;
export function inEnglish<T>(f: () => T): T {
  if (canonicalDepth++ === 0) { shown = TABLE; TABLE = EN; }
  try { return f(); } finally { if (--canonicalDepth === 0) TABLE = shown; }
}

/** the table's raw template (for tests and a translator's tools) */
export function template(key: TextKey): string { return TABLE[key]; }

/** swaps the table (tests; a later translation): the same keys only */
export function useTable(t: TextTable): void { TABLE = t; }

/** the language chosen (journal Passe RG4): its table, then every text says it (the French loaded on demand by the page, src/settings/language.ts) */
export function useLanguage(l: 'en' | 'fr', table: TextTable = EN): void { LANG = l; TABLE = l === 'en' ? EN : table; }

/** a skill's name (the catalogue's twelve, src/combat/skillbook.ts) */
const SKILL_KEYS: Record<string, TextKey> = {
  // the heavy attack, a skill since journal Passe CH1, keeps the name the charge's ladder gave it
  heavy: 'ui.skill.heavy', t1: 'skill.t1', t2: 'skill.t2', t3: 'skill.t3', t4: 'skill.t4', d1: 'skill.d1', s1: 'skill.s1',
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
  'river-pearl': ['gear.river-pearl.name', 'gear.river-pearl.about'], 'knight-hauberk': ['gear.knight-hauberk.name', 'gear.knight-hauberk.about'],
  'pilgrim-medal': ['gear.pilgrim-medal.name', 'gear.pilgrim-medal.about'],
};
export function itemText(id: string, part: 'name' | 'about'): string { const k = ITEM_KEYS[id]; return k ? tx(k[part === 'name' ? 0 : 1]) : id; }
