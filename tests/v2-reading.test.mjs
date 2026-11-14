// Lot L1 of step 5, the reading (the operator's choice EV-1 « Les corriger en premier (lot L1) », journal Passes EV1 / EV2 / EVL1): the six
// defects found playing the version 2, each corrected behind `flags.v2`, no rule changed. (1) the squares show the news of a slot that ended
// there, as the quay does; (2) an action's news stand in the band where it was taken (the list, a dialogue); (3) « free » only when nothing is
// spent, a challenge's slot counted though it is spent at its result; (4) a version 2 journal says a cause in words, never its code; (5) the
// match sheet says « scouting would tell you more » only of the rivals one can watch; (6) an unseen theft promises nothing that does not come.
// The oracles do not go through the code they test: the slot passed is read on the states, the rivals one can watch on the actions offered.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from './load.mjs';

const G = await load('/src/simulation/index.ts');
const L = await load('/src/tournament/lab.ts');
const N = await load('/src/ui/news.ts');
const J = await load('/src/ui/journal.ts');
const U = await load('/src/ui/townUi.ts');
const { EN } = await load('/src/narrative/text/en.ts');
const { ACTIONS } = await load('/src/simulation/actions.ts');
const { CHALLENGERS } = await load('/src/simulation/v2town.ts');
const { RIVALS } = await load('/src/narrative/roster.ts');
const { matchId } = await load('/src/tournament/pool.ts');

const src = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');
const v2 = (name) => G.namedState(name);
const WIN = { winner: 'player', playerHp: 900, playerMaxHp: 2200, opponentHp: 0, opponentMaxHp: 3000, finisher: 'heavy' };
const LOSS = { winner: 'opponent', playerHp: 0, playerMaxHp: 2200, opponentHp: 900, opponentMaxHp: 3000, finisher: 'heavy' };
/** the browser's storage, in memory */
const memory = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); } }; };
/** what a page that opens shows: the visible entries after the last one seen (TownUi.showNews) */
const shown = (st, seen) => st.log.filter((e) => e.visible && e.seq > seen);
/** a square's game API (src/ui/playPlaza.ts): the action applied, and whether the page reloads (another look, another place, the end) */
function squareApi(st0) {
  let st = st0;
  const act = (a) => {
    const prev = st, r = G.advance(prev, a);
    if (!r.ok) return { ok: false, reason: r.reason };
    st = r.state;
    return { ok: true, events: r.events, reload: G.lookOf(prev) !== G.lookOf(st) || prev.place !== st.place || prev.over !== st.over };
  };
  return { act, state: () => st };
}

// ------------------------------------------------------------------------------------------------- (1) the squares' news

test('(1) a square shows the news of a slot that ended there: « Wait » on the forecourt, the heralds on the page that opens', () => {
  const store = memory();
  // (lot L4, EV-8 « Hors des nouvelles »: the first afternoon's end tells only the night market, now out of the news; the first evening's end the heralds' day)
  for (const name of ['v2-forecourt-morning', 'v2-training-morning', 'v2-square-morning', 'v2-forecourt-night']) {
    const st = v2(name);
    // the page opens: what it shows, then counted as shown
    N.seenBefore(st, store); N.markSeen(st, store);
    const r = G.advance(st, { type: 'wait' });
    assert.ok(r.ok, `${name}: ${r.reason}`);
    const told = r.events.filter((e) => e.visible);
    assert.ok(told.length > 0, `${name}: the slot's end writes news`);
    // the next page (another look: a reload) shows every one of them
    const next = shown(r.state, N.seenBefore(r.state, store));
    for (const e of told) assert.ok(next.some((x) => x.seq === e.seq), `${name}: « ${e.text} » shown`);
    N.markSeen(r.state, store);
    // the defect, reproduced by the oracle: from the log's last entry, nothing is shown
    assert.equal(shown(r.state, r.state.log.length - 1).length, 0);
  }
  // the first afternoon on the forecourt: the night market opens at its end, its pulse kept, out of the news (EV-8)
  const mid = G.advance(v2('v2-forecourt-midday'), { type: 'wait' });
  assert.ok(mid.events.some((e) => e.id === 'night-market' && !e.visible) && !mid.events.some((e) => e.visible), 'the night market, out of the news');
});

test('(1) what an action keeping the page showed counts as shown; an action that reloads leaves its news to the next page; a walk tells nothing again', () => {
  const store = memory(), api = squareApi(v2('v2-forecourt-morning'));
  const act = N.keepSeen(api.act, api.state, store);
  N.seenBefore(api.state(), store); N.markSeen(api.state(), store);
  // a bargain put to Hilde at the moment of buying (lot L2a, EV-6): the page stays, its news shown in the band
  const haggle = G.actions(api.state()).find((o) => o.ok && o.action.type === 'bargain');
  assert.ok(haggle, 'a keeper to bargain with on the forecourt');
  const h = act(haggle.action);
  assert.ok(h.ok && !h.reload && h.events.some((e) => e.visible));
  // the slot ends: the page reloads
  const w = act({ type: 'wait' });
  assert.ok(w.ok && w.reload);
  const page2 = shown(api.state(), N.seenBefore(api.state(), store));
  for (const e of w.events.filter((x) => x.visible)) assert.ok(page2.some((x) => x.seq === e.seq), `« ${e.text} » shown on the next page`);
  for (const e of h.events.filter((x) => x.visible)) assert.ok(!page2.some((x) => x.seq === e.seq), `« ${e.text} » not told twice`);
  N.markSeen(api.state(), store);
  // a walk to the quay: nothing happened, nothing is told
  const m = act({ type: 'move', to: 'district' });
  assert.ok(m.ok && m.reload);
  assert.deepEqual(shown(api.state(), N.seenBefore(api.state(), store)).map((e) => e.text), []);
  // a page without storage shows the latest news, as the quay always did
  assert.equal(N.seenBefore(api.state(), null), api.state().log.length - 2);
});

test('(1) the wiring: the squares read and keep what was shown, as the quay; the default game\'s pages keep their rule', () => {
  const plaza = src('src/ui/playPlaza.ts'), town = src('src/ui/playTown.ts');
  assert.match(plaza, /new TownUi\(\{[\s\S]*?\}, seenBefore\(st\)\);\n\s*markSeen\(st\);/);
  assert.match(plaza, /act: keepSeen\(/);
  assert.doesNotMatch(plaza, /st\.log\.length - 1/);
  assert.match(town, /const seen = seenBefore\(st\)/);
  assert.match(town, /act: isV2\(st\) \? keepSeen\(act, \(\) => st\) : act/);
  assert.match(town, /\}, seen\);\n\s*markSeen\(st\);/);
  // a square's cutscene waits until the news are read (the scene would hide their band); the news card is that promise
  assert.match(plaza, /if \(scene && scenes\) \{[\s\S]*?await ui\.newsRead;[\s\S]*?await playCutscene\(/);
  const news = src('src/ui/townUi.ts').match(/private showNews\(\): void \{[\s\S]*?\n {2}\}/)[0];
  assert.equal((news.match(/this\.newsRead = this\.card\(/g) ?? []).length, 2);
  assert.doesNotMatch(news, /void this\.card\(/);
  // the slice's forecourt and Lantern Row (the default game) are not touched
  for (const f of ['src/ui/playForecourt.ts', 'src/ui/playLanterns.ts']) assert.match(src(f), /st\.log\.length - 1\)/, f);
});

// ------------------------------------------------------------------------------------------------- (2) the news in the band

test('(2) a version 2 game: an action taken in a band (the list, a dialogue) shows its news in that band; the default game keeps its bandeau', () => {
  const ui = src('src/ui/townUi.ts');
  // the bandeau is hidden while a band is open (the defect's cause), in both games
  assert.match(ui, /body\.pm-talking #pm-toast/);
  const run = ui.slice(ui.indexOf('  run(a: Action'), ui.indexOf('  private flash('));
  assert.match(run, /const inBand = isV2\(this\.st\) && news\.length > 0 && \(this\.opening \|\| document\.body\.classList\.contains\('pm-talking'\)\)/);
  assert.match(run, /if \(inBand\) this\.said\.push\(\.\.\.news\)/);
  assert.match(run, /if \(!inBand && news\.length\) this\.flash\(news\)/);
  // the list and the dialogue write what was said under the place or the person's words
  const here = ui.slice(ui.indexOf('  openHere(): void'), ui.indexOf('  private optionButton('));
  const person = ui.slice(ui.indexOf('  openPerson(who: string)'), ui.indexOf('  /** the version 2\'s skills'));
  assert.match(here, /<\/div>\$\{this\.saidHtml\(\)\}<\/div>`/);
  assert.match(person, /<\/div>\$\{this\.saidHtml\(\)\}<\/div>`/);
  assert.match(person, /this\.opening = true;\n\s*try \{ this\.run\(\{ type: 'talk', who \}\); \} finally \{ this\.opening = false; \}/);
  assert.match(ui, /\.pm-dlg \.who \.news\{[^}]*color:var\(--ds-accent\)/);
});

// ------------------------------------------------------------------------------------------------- (3) « free »

const tags = (html) => [...html.matchAll(/<span class="([^"]*)">([^<]*)<\/span>/g)].map((m) => m[2]);
const clock = (s) => `${s.day}:${s.slot}:${s.over}`;

test('(3) « free » only when nothing is spent: every option of a version 2 game, the slot read on the states, a challenge\'s at its result', () => {
  let n = 0, booked = 0;
  for (const name of Object.keys(G.NAMED_STATES).filter((k) => G.NAMED_STATES[k].v2)) for (const place of ['district', 'forecourt', 'lanterns', 'training']) {
    const st = structuredClone(v2(name)); st.place = place; st.player.coins = 200;
    for (const o of G.actions(st)) {
      if (!o.ok) continue;
      const r = G.advance(st, o.action);
      if (!r.ok) continue;
      let after = r.state;
      // a challenge booked: its slot passes when its result comes back (won or lost alike)
      if (after.v2?.challenge && !st.v2?.challenge) {
        booked++;
        for (const outcome of [WIN, LOSS]) assert.notEqual(clock(G.advance(after, { type: 'challengeResult', outcome }).state), clock(st), `${o.label}: its result`);
        after = G.advance(after, { type: 'challengeResult', outcome: WIN }).state;
      }
      const passed = clock(after) !== clock(st), t = tags(U.costTag(o));
      assert.equal(t.includes('1 slot'), passed, `${o.label} (${name}, ${place}): ${t.join(', ')}`);
      assert.equal(t.includes('free'), !passed && !o.coins, `${o.label} (${name}, ${place}): ${t.join(', ')}`);
      n++;
    }
  }
  assert.ok(booked >= 3, `challenges booked: ${booked}`);
  assert.ok(n > 300, `${n} options applied`);
  // the label no longer says the slot twice (rule P2: the price once, in its tag)
  for (const k of ['v2.challenge.labelCoins', 'v2.challenge.labelCoinsPlain', 'v2.challenge.labelName', 'v2.challenge.labelNamePlain']) assert.doesNotMatch(EN[k], /slot/);
  // the default game offers no booked slot: none of its options carries one
  for (const name of Object.keys(G.NAMED_STATES).filter((k) => !G.NAMED_STATES[k].v2)) for (const o of G.actions(G.namedState(name))) assert.ok(!('later' in o), `${name}: ${o.label}`);
});

// ------------------------------------------------------------------------------------------------- (4) the journal's causes

/** a code, as the simulation writes its causes: no space, a word and a colon (`action:steal`, `match:r1:player-vessa`, `new-game`) */
const CODE = /^[\w-]+(?::\S*)?$/;

test('(4) a version 2 journal says a cause in words or not at all, never its code; a sentence stays as written; the default game is unchanged', () => {
  const st = v2('v2-day2-afternoon'), causes = new Set(['new-game', 'clock', 'quest:cargo', 'tournament:cut', 'tournament:final', 'offscreen:vessa', 'match:nobody']);
  for (const t of Object.keys(ACTIONS)) causes.add(`action:${t}`);
  for (const w of Object.keys(CHALLENGERS)) causes.add(`challenge:${w}`);
  for (const m of st.tournament.matches) causes.add(`match:${matchId(m)}`);
  for (const c of causes) {
    const why = J.whyOf(st, c);
    if (why !== null) { assert.doesNotMatch(why, /[\w-]+:\S/, `${c} → ${why}`); assert.ok(/\s/.test(why), `${c} → ${why}: a sentence`); }
    // the default game keeps its line (the gap recorded in journal Passe EVL1)
    assert.equal(J.whyOf(G.namedState('day2-afternoon'), c), c);
  }
  // the bouts' causes name the opponent; the actions' a sentence of their own
  const mine = st.tournament.matches.find((m) => m.a === 'player' || m.b === 'player'), opp = mine.a === 'player' ? mine.b : mine.a;
  assert.equal(J.whyOf(st, `match:${matchId(mine)}`), `your bout against ${RIVALS[opp].name}`);
  assert.equal(J.whyOf(st, 'challenge:orla'), 'your challenge to Orla Brask');
  for (const t of ['steal', 'checkGear', 'recruit', 'repair', 'report', 'confront']) assert.equal(J.whyOf(st, `action:${t}`), EN[`v2.why.${t}`], t);
  // a sentence the events wrote stays word for word
  for (const c of ["Cassius's grudge, your fame and the night", 'the first sign, and a stretched watch']) assert.equal(J.whyOf(st, c), c);
});

test('(4) every consequence and sign of whole version 2 games reads without a code; a theft caught says why in words', () => {
  let n = 0;
  const check = (s) => { for (const e of s.log) if (e.visible && (e.kind === 'consequence' || e.kind === 'sign')) { const why = J.whyOf(s, e.cause); n++; if (why !== null) assert.doesNotMatch(why, CODE, `${e.id}: ${why}`); } };
  for (let seed = 1; seed <= 6; seed++) for (const p of ['diligent', 'idle']) check(L.autoplay(seed, L.POLICIES[p], 'Ren', 400, 'v2').state);
  // a thief, caught in the end (the lab's bot never steals)
  let caught = null;
  for (let seed = 1; seed <= 40 && !caught; seed++) {
    const r = G.advance(G.makeV2(G.newGame(seed, 'Ren')), { type: 'steal', shop: 'mara' });
    if (r.events.some((e) => e.id === 'steal:caught')) caught = r.state;
  }
  assert.ok(caught, 'a theft caught');
  const e = caught.log.find((x) => x.id === 'steal:caught');
  assert.equal(e.cause, 'action:steal');
  assert.equal(J.whyOf(caught, e.cause), EN['v2.why.steal']);
  check(caught);
  assert.ok(n > 50, `${n} entries read`);
});

// ------------------------------------------------------------------------------------------------- (5) the match sheet

test('(5) « scouting would tell you more » only of a rival one can watch train (read on the actions offered over a whole game); the others\' skills shown by the bout', () => {
  const watchable = new Set();
  let st = G.makeV2(G.newGame(1842, 'Ren'));
  for (let i = 0; i < 40 && !st.over; i++) {
    for (const place of ['district', 'forecourt', 'lanterns', 'training']) {
      const s = structuredClone(st); s.place = place;
      for (const o of G.actions(s)) if (o.action.type === 'scout' && o.ok) watchable.add(o.action.who);
    }
    // the day goes by, the bout won when it comes (the arena hands its result in)
    const w = G.actions(st).find((o) => o.action.type === 'wait' && o.ok), r = G.advance(st, w ? w.action : { type: 'fight', outcome: WIN });
    assert.ok(r.ok, `day ${st.day} ${st.slot}: ${r.reason}`);
    st = r.state;
  }
  assert.ok(watchable.size >= 1, `rivals one can watch: ${[...watchable]}`);
  const day2 = v2('v2-day2-afternoon');
  for (const id of Object.keys(RIVALS)) {
    const said = U.foeIntel(day2, id);
    // lot 3 of « La Brute » (the scouting by tiers): a rival not seen says how to learn its style
    assert.equal(/watch them at practice/.test(said), watchable.has(id), `${id}: ${said}`);
    assert.ok(said.includes(RIVALS[id].name), said);
    // once watched, the skills are named
    const seen = structuredClone(day2); seen.facts.push(`scouted:${id}`);
    assert.match(U.foeIntel(seen, id), /skills: /, id);
  }
});

// ------------------------------------------------------------------------------------------------- (6) the theft unseen

test('(6) an unseen theft promises nothing that does not come (the theft found out the next day is lot L2\'s, EV-2)', () => {
  assert.doesNotMatch(EN['v2.steal.ok'], /tonight|tomorrow|will|count/i);
  let ok = null;
  for (let seed = 1; seed <= 40 && !ok; seed++) {
    const r = G.advance(G.makeV2(G.newGame(seed, 'Ren')), { type: 'steal', shop: 'mara' });
    if (r.events.some((e) => e.id === 'steal:ok')) ok = r;
  }
  assert.ok(ok, 'a theft unseen');
  // and indeed nothing of the theft follows in the evening and the night after it
  let s = ok.state;
  const from = s.log.length;
  for (let i = 0; i < 3 && !s.over; i++) { const w = G.actions(s).find((o) => o.action.type === 'wait' && o.ok); if (!w) break; s = G.advance(s, w.action).state; }
  assert.ok(!s.log.slice(from).some((e) => /steal|theft/i.test(`${e.id} ${e.cause}`)), 'nothing follows the theft');
});
