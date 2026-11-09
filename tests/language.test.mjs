// The French (the operator's sheet of journal Passe RG2, RG-9 to RG-15; built in journal Passe RG4): the French table holds every key of the English with
// the same slots and key caps; the simulation runs in English whatever the language shown (a game played with the French chosen keeps the fingerprint
// and the save of the same game in English, its log lines carrying their references outside the fingerprint); every line a whole game writes is said in
// French from its reference (RG-13 « Tout change, le journal déjà écrit compris »), its braces filled, no English left; the French grammar the
// templates need (à + le = au, de + les = des, de + a vowel = d’), its decimal comma; the language chosen: the browser's then the player's, English in a
// driven browser (RG-9); the English untouched when English is chosen.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';

const T = await load('/src/narrative/text/index.ts');
const { EN } = await load('/src/narrative/text/en.ts');
const { FR } = await load('/src/narrative/text/fr.ts');
const { FR_TEXTS } = await load('/src/narrative/text/fr-texts.ts');
const G = await load('/src/simulation/index.ts');
const L = await load('/src/tournament/lab.ts');
const S = await load('/src/settings/settings.ts');

const marks = (s) => [...s.matchAll(/\{(\w+)(?:\|\w+)?\}/g)].map((m) => m[1]).sort().join(',');
const caps = (s) => [...s.matchAll(/\[(\w+)\]/g)].map((m) => m[1]).sort().join(',');
const inFrench = (f) => { T.useLanguage('fr', FR); try { return f(); } finally { T.useLanguage('en'); } };

test('the French table: every key of the English, written (not the English left), with the same slots and the same key caps', () => {
  for (const k of Object.keys(EN)) {
    assert.ok(k in FR_TEXTS, `no French for "${k}"`);
    assert.equal(marks(FR_TEXTS[k]), marks(EN[k]), `slots of "${k}"`);
    assert.equal(caps(FR_TEXTS[k]), caps(EN[k]), `key caps of "${k}"`);
  }
  // a sentence left in English: the same words as the English, longer than a name or a figure
  const same = Object.keys(EN).filter((k) => FR_TEXTS[k] === EN[k] && /[a-z]{4,} [a-z]{3,}/.test(EN[k]));
  assert.deepEqual(same, [], 'texts left in English');
  // the words the code holds outside the table (`=<English>`) and the grammar's forms (`<key>|<form>`) name an English word or a key
  for (const k of Object.keys(FR_TEXTS).filter((k) => k.includes('|'))) assert.ok(k.split('|')[0] in EN, `form of an unknown key: ${k}`);
});

test('a game played in French keeps the fingerprint and the save of the same game in English (the simulation runs in English)', () => {
  for (const [seed, policy] of [[3, 'diligent'], [11, 'curious']]) {
    const en = L.autoplay(seed, L.POLICIES[policy], 'Ren', 600, 'v2');
    const fr = inFrench(() => L.autoplay(seed, L.POLICIES[policy], 'Ren', 600, 'v2'));
    assert.equal(fr.hash, en.hash, `seed ${seed} ${policy}: fingerprint`);
    assert.equal(G.serialize(fr.state), G.serialize(en.state), `seed ${seed} ${policy}: the save`);
    // the log keeps its English sentences (the save above), the references beside them outside the fingerprint
    // a line without a reference is a sentence of the events' data, said through the table (`=<English>`), or a cause the journal names by its id
    for (const e of fr.state.log) {
      if (!e.$t) assert.ok(`=${e.text}` in FR, `a line neither referenced nor in the table: ${e.text}`);
      if (e.cause && !e.$c) assert.ok(`=${e.cause}` in FR || /^[a-z0-9-]+(:|$)/.test(e.cause), `a cause neither referenced nor in the table: ${e.cause}`);
    }
  }
  // a new game in French: its arrival line English, the same fingerprint
  const fresh = () => { const s = G.newGame(5, 'Ren'); G.makeV2(s); return G.serialize(s); };
  assert.equal(inFrench(fresh), fresh());
});

test('every line of whole games said in French from its reference: the slots filled, no English left', () => {
  const runs = [[3, 'diligent'], [11, 'curious'], [7, 'idle']].map(([seed, p]) => L.autoplay(seed, L.POLICIES[p], 'Ren', 600, 'v2'));
  const english = /\b(the|and|with|of|you|your|his|her|from|to|day|is|was)\b/i;
  let n = 0;
  inFrench(() => {
    for (const r of runs) for (const e of r.state.log) {
      for (const [text, ref] of [[e.text, e.$t], [e.cause, e.$c]]) {
        if (!text) continue;
        const fr = T.said(text, ref);
        n++;
        assert.ok(!/[{}]/.test(fr), `braces left: ${fr}`);
        if (ref || `=${text}` in FR) assert.ok(!english.test(fr.replace(/\b(Ren|Hale|Odo|Lio|Pip|Wren|Orla|Vessa|Marek|Cassius|Ilse|Rhosk|Tobin|Mara|Bram|Hilde|Corvin)\b/g, '')), `English left: « ${fr} » (${text})`);
      }
    }
  });
  assert.ok(n > 500, `lines said: ${n}`);
  // English chosen: the lines as they were written
  for (const e of runs[0].state.log) assert.equal(T.said(e.text, e.$t), e.text);
});

test('the French grammar the templates need: the contractions where a value comes after à, de or que, the head capital, the decimal comma', () => {
  const table = { ...FR, 't.a': 'Aller à {p}.', 't.de': 'Le prix de {p}.', 't.que': 'Plus fort que {p}.', 't.cap': '{p|cap} attend.', 't.n': '{n} s' };
  T.useLanguage('fr', table);
  try {
    assert.equal(T.tx('t.a', { p: 'le Parvis' }), 'Aller au Parvis.');
    assert.equal(T.tx('t.a', { p: 'les lices' }), 'Aller aux lices.');
    assert.equal(T.tx('t.a', { p: 'la halle' }), 'Aller à la halle.');
    assert.equal(T.tx('t.de', { p: 'les lices' }), 'Le prix des lices.');
    assert.equal(T.tx('t.de', { p: 'le sabre' }), 'Le prix du sabre.');
    assert.equal(T.tx('t.de', { p: 'Orla' }), 'Le prix d’Orla.');
    assert.equal(T.tx('t.que', { p: 'Orla' }), 'Plus fort qu’Orla.');
    assert.equal(T.tx('t.cap', { p: 'le sergent Hale' }), 'Le sergent Hale attend.');
    assert.equal(T.tx('t.n', { n: 1.5 }), '1,5 s');
    assert.equal(T.num(0.25, 2), '0,25');
  } finally { T.useLanguage('en'); }
  assert.equal(T.num(1.5), '1.5');
  // a name the code holds in English said through the table (`=<English>`), unknown words kept
  inFrench(() => { assert.equal(T.word('morning'), 'matin'); assert.equal(T.word('Ren'), 'Ren'); });
  assert.equal(T.word('morning'), 'morning');
});

test('the language chosen: the player\'s choice, else the browser\'s among the languages written, English in a driven browser (RG-9)', () => {
  assert.deepEqual([...S.LANGS], ['en', 'fr']);
  const none = { ...S.DEFAULT_SETTINGS };
  assert.equal(S.langOf(none, 'fr-FR', false), 'fr');
  assert.equal(S.langOf(none, 'fr-CA', false), 'fr');
  assert.equal(S.langOf(none, 'de-DE', false), 'en');
  assert.equal(S.langOf(none, 'fr-FR', true), 'en');
  assert.equal(S.langOf({ ...none, lang: 'fr' }, 'en-US', true), 'fr');
  assert.equal(S.langOf({ ...none, lang: 'en' }, 'fr-FR', false), 'en');
});
