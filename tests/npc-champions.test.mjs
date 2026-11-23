// The champions of the townsfolk (journal Passe CH-PNJ; the operator's request of 2026-11-23, word for word « concernant les combats potentiels contre les pnjs passants non-combattants...
// on a integre des combattants generiques mais cela manque de coherence car les combattants ne sont pas les passants que nous defions/volons... donc on devrait clairement dire que
// ce sont des combattants au services des pnjs qui decide de se battre contre toi quand tu entres en interactions pour voler/defier avec ces pnjs ... et donc cela doit se resentir dans
// le dialogue mais aussi sur les UI ( representant de ... _). »): a keeper robbed at their stall by day and a passer-by robbed or pressed for their piece are no fighters; the one who
// stands on the sand is their champion. Presentation only: the state, the stakes, the slot and the rules are the ones of journal Passe PN1, the text and the labels are new.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from './load.mjs';

const G = await load('/src/simulation/index.ts');
const T = await load('/src/simulation/v2town.ts');
const B = await load('/src/simulation/v2barter.ts');
const P = await load('/src/narrative/people.ts');
const NF = await load('/src/narrative/npcFighters.ts');
const CH = await load('/src/narrative/champions.ts');
const TX = await load('/src/narrative/text/index.ts');
const FRT = (await load('/src/narrative/text/fr.ts')).FR;
const EN = (await load('/src/narrative/text/en.ts')).EN;
const FR_TEXTS = (await load('/src/narrative/text/fr-texts.ts')).FR_TEXTS;

const v2 = (name = 'day1-morning') => G.makeV2(G.namedState(name));
const act = (st, a, rng) => { const r = G.advance(st, a, rng); assert.ok(r.ok, `${a.type}: ${r.reason}`); return r; };
const LOSE = { next: () => 0.999, fork() { return this; } };
const outcome = (winner) => ({ winner, playerHp: winner === 'player' ? 100 : 0, playerMaxHp: 300, opponentHp: winner === 'player' ? 0 : 100, opponentMaxHp: 300, finisher: null });
const at = (st, place, slot, day) => { const s = structuredClone(st); s.place = place; s.slot = slot; if (day) s.day = day; return s; };
const texts = (r) => r.events.filter((e) => e.visible).map((e) => e.text).join('\n');
const inFrench = (f) => { TX.useLanguage('fr', FRT); try { return f(); } finally { TX.useLanguage('en'); } };

const KEEPERS = ['mara', 'hilde', 'corvin', 'pip'];
const PASSERS = Object.keys(NF.NPC_FIGHTERS).filter((id) => P.PEOPLE[id]?.passer);

test('who has a champion: the keepers who sell and the passers-by who are no fighters; never Wynn of the watch, the events\' fighters, the fighters of the town or the rivals', () => {
  for (const id of [...KEEPERS, ...PASSERS]) assert.equal(CH.masterOf(id), id, `${id} fights through a champion`);
  assert.equal(PASSERS.length, 10, 'the twelve place-moments of GP-06 are ten people');
  for (const id of ['wynn', 'vane', 'wick', 'aldric', 'corra', 'ambrose', 'lucan', 'piers', 'kell', 'orla', 'marek', 'vessa']) assert.equal(CH.masterOf(id), null, `${id} fights as themselves`);
  // every fighter of the townsfolk with no name of their own, but Wynn, is one
  for (const [id, n] of Object.entries(NF.NPC_FIGHTERS)) assert.equal(CH.masterOf(id) === id, !n.name && id !== 'wynn', id);
});

test('the champion\'s name and the line under it, in English and in French (by their template\'s gender)', () => {
  assert.equal(CH.championName('mara'), 'Mara\'s champion'); assert.equal(CH.championTitle('mara'), 'Representing Mara');
  assert.equal(CH.championName('edda'), `${P.PEOPLE.edda.name}'s champion`); assert.equal(CH.championTitle('edda'), `Representing ${P.PEOPLE.edda.name}`);
  assert.equal(CH.championHead('mara'), 'Mara\'s champion'); assert.equal(CH.foeLabel('wynn', 'Wynn'), 'Wynn'); assert.equal(CH.foeLabel('vane', 'Marrow Vane'), 'Marrow Vane'); assert.equal(CH.foeLabel('mara', 'Mara'), 'Mara\'s champion');
  inFrench(() => {
    assert.equal(NF.NPC_FIGHTERS.mara.look.template, 'f'); assert.equal(NF.NPC_FIGHTERS.corvin.look.template, 'm');
    assert.match(CH.championName('mara'), /^la championne de /); assert.match(CH.championTitle('mara'), /^Représentante de /);
    assert.match(CH.championName('corvin'), /^le champion de /); assert.match(CH.championTitle('corvin'), /^Représentant de /);
    assert.equal(CH.championName('mara'), `la championne de ${P.PEOPLE.mara.name}`); assert.match(CH.championHead('corvin'), /^Le champion de /);
  });
  for (const k of ['champion.ofM', 'champion.ofF', 'champion.repM', 'champion.repF']) { assert.ok(EN[k], k); assert.ok(FR_TEXTS[k], `${k} in French`); assert.match(EN[k], /\{master\}/); assert.match(FR_TEXTS[k], /\{master\}/); }
});

test('caught at a stall by day: the keeper calls their champion, before the duel (the band, the buttons, the log) and after it (won, lost); the fine is the keeper\'s', () => {
  const st = at(v2(), 'district', 'morning'); st.player.coins = 60;
  const r0 = act(st, { type: 'steal', shop: 'mara', item: 'whetstone' }, LOSE), c = r0.state;
  assert.match(texts(r0), /Mara catches your wrist.*Pay Mara the fine, 15 coins, or face Mara's champion on the sand\./);
  const labels = G.actions(c).map((o) => o.label);
  assert.ok(labels.includes('Pay Mara the fine (15 coins)'), 'the fine is paid to the keeper');
  assert.ok(labels.includes('Face Mara\'s champion on the sand (won: no fine; lost: 30 coins)'), labels.join(' | '));
  const r1 = act(c, { type: 'fightCatch' }); assert.match(texts(r1), /You will not pay: Mara's champion steps forward for Mara and takes you to the sand\./);
  const won = act(r1.state, { type: 'challengeResult', outcome: outcome('player') });
  assert.match(texts(won), /You beat Mara's champion on the sand: Mara lets you walk away without a fine, and a whetstone stays where it was\./);
  const lost = act(r1.state, { type: 'challengeResult', outcome: outcome('opponent') });
  assert.match(texts(lost), /Mara's champion beats you on the sand: Mara takes the fine, doubled, 30 coins\./);
  // nothing else changed: the state keys the fight by the person, the same stake and the same results as before
  assert.deepEqual({ who: r1.state.v2.challenge.who, kind: r1.state.v2.challenge.kind }, { who: 'mara', kind: 'caught' });
  assert.equal(won.state.player.coins, 60); assert.equal(lost.state.player.coins, 30);
  // the same in French
  inFrench(() => {
    const l = G.actions(c).map((o) => o.label);
    assert.ok(l.some((x) => /^Affronter la championne de .* sur le sable \(gagné : pas d’amende/.test(x)), l.join(' | '));
    assert.ok(l.some((x) => /^Payer l’amende à /.test(x)));
  });
});

test('a pocket picked and caught: the passer-by cries thief and sends their champion; the night\'s catch is Wynn of the watch himself, as before', () => {
  const pk = at(v2(), 'district', 'evening'); pk.player.coins = 50;
  const r = act(pk, { type: 'pickpocket', who: 'fenwick' }, LOSE), name = P.PEOPLE.fenwick.name;
  assert.match(texts(r), new RegExp(`${name} grabs your sleeve and cries thief.*Pay ${name} the fine, 10 coins, or face ${name}'s champion on the sand\\.`));
  assert.ok(G.actions(r.state).some((o) => o.label === `Face ${name}'s champion on the sand (won: no fine; lost: 20 coins)`));
  const night = at(v2(), 'district', 'evening'); night.player.coins = 80;
  const c = act(night, { type: 'steal', shop: 'mara', item: 'whetstone' }, LOSE);
  assert.match(texts(c), /Wynn of the watch catches you.*face him on the sand/);
  const f = act(c.state, { type: 'fightCatch' });
  assert.match(texts(f), /You will not pay: Wynn takes you to the sand\./); assert.ok(!/champion/.test(texts(f)));
  assert.match(texts(act(f.state, { type: 'challengeResult', outcome: outcome('opponent') })), /^Wynn beats you on the sand: the fine is doubled, 50 coins\./m);
});

test('a piece demanded by force: the passer-by\'s champion steps forward; won, the passer-by gives it up; lost, they keep it', () => {
  const st = at(v2(), 'forecourt', 'morning'); st.player.coins = 40;
  const name = P.PEOPLE.edda.name, item = TX.itemText(B.PASSERS.edda.item, 'name');
  const l = G.actions(st).find((o) => o.action.type === 'seize' && o.action.who === 'edda').label;
  assert.equal(l, `Demand ${item} from ${name} by force (a duel on the sand against ${name}'s champion)`);
  const r = act(st, { type: 'seize', who: 'edda' });
  assert.match(texts(r), new RegExp(`You demand ${item} from ${name}, your blade drawn\\. ${name}'s champion steps forward to answer for them: on the sand\\.`));
  const won = act(r.state, { type: 'challengeResult', outcome: outcome('player') });
  assert.match(texts(won), new RegExp(`You beat ${name}'s champion: ${name} gives up ${item}\\. The town saw it: a mark in Sergeant Hale's ledger, and ${name} will remember\\.`));
  const lost = act(r.state, { type: 'challengeResult', outcome: outcome('opponent') });
  assert.match(texts(lost), new RegExp(`${name}'s champion beats you off and ${name} keeps the piece; you leave 10 coins on the sand\\.`));
  // asked again in the same phase: the champion has fought already
  const again = structuredClone(lost.state); again.place = 'forecourt'; again.slot = 'afternoon';
  const why = G.advance(again, { type: 'seize', who: 'edda' }); assert.equal(why.ok, false); assert.match(why.reason, new RegExp(`^${name}'s champion has already fought you`));
  assert.deepEqual({ who: r.state.v2.challenge.who, kind: r.state.v2.challenge.kind }, { who: 'edda', kind: 'seize' });
});

test('the pages say it: the sheet before the sand (the champion\'s name, « Representing … », the master in the stake), the arena\'s gate and HUD name, the notebook, the guide', () => {
  const U = fs.readFileSync(path.join(ROOT, 'src/ui/townUi.ts'), 'utf8'), A = fs.readFileSync(path.join(ROOT, 'src/ui/playArena.ts'), 'utf8'), N = fs.readFileSync(path.join(ROOT, 'src/ui/notebook.ts'), 'utf8');
  // the sheet: the foe's name is the champion's, the line where a title stands « Representing X », the stake names the master (who remembers), the door of the sand the champion
  assert.match(U, /const foeName = \(who: string\): string => \(masterOf\(who\) \? championName\(who\) : fighterName\(who\)\);/);
  assert.match(U, /const title = masterOf\(who\) \? championTitle\(who\) : /);
  assert.match(U, /name = masterOf\(who\) \? championHead\(who\) : foeName\(who\), url = portraitUrl\(who\)/);
  assert.match(U, /foe: ch\.who, foeName: foeName\(ch\.who\)/);
  assert.match(U, /c\?\.who && masterOf\(c\.who\) \? championName\(c\.who\)/);
  // the arena: the name the HUD, the DuelCoach and the gate overlay read (opp), its epithet the line « Representing X »
  assert.match(A, /masterOf\(fid\) \? \{ id: fid, name: championHead\(fid\), epithet: championTitle\(fid\) \}/);
  // the gate before the sand says which fight it is (« Caught in the act », « Taken by force »), not « A challenge » for every one
  assert.match(A, /const gate = `<p class="pm-sub">\$\{challenge \? tx\(reprisal \? 'v2\.challenge\.reprisal' : townKind === 'caught' \? 'v2\.caught\.title' : townKind === 'seize' \? 'v2\.seize\.title'/);
  // a long name keeps one line in the HUD (« Lady Edda's champion » wrapped and pushed the health figure under its bar), the figure never wraps
  const H = fs.readFileSync(path.join(ROOT, 'src/arena/ArenaHud.ts'), 'utf8'), AH = fs.readFileSync(path.join(ROOT, 'src/arena/AutoHud.ts'), 'utf8');
  assert.match(H, /\.ah-nm\.long\{font-size:calc\(var\(--ds-fs-title\) \* 0\.78\)\}/); assert.match(H, /\.ah-nm em\{[^}]*white-space:nowrap;flex:none/);
  assert.match(H, /\.ah-nm\.xlong\{font-size:calc\(var\(--ds-fs-title\) \* 0\.62\)\}/);
  assert.match(AH, /class="ah-nm\$\{names\[who\]\.length > 22 \? ' xlong' : names\[who\]\.length > 16 \? ' long' : ''\}"/);
  // Master Corvin's notebook names the champion
  assert.match(N, /masterOf\(id\) \? championName\(id\)/);
  // the sheet of a challenge names them too (the match sheet's fighter)
  assert.match(fs.readFileSync(path.join(ROOT, 'src/combat/match.ts'), 'utf8'), /name: masterOf\(ch\.who\) \? championName\(ch\.who\)/);
});

test('every new text is in both tables with the same slots, and no state key or rule changed (the fight is still keyed by the person)', () => {
  const slots = (s) => [...s.matchAll(/\{(\w+)(?:\|\w+)?\}/g)].map((m) => m[1]).sort().join();
  for (const k of ['v2.caught.fightLogFor', 'v2.caught.wonFor', 'v2.caught.lostFor', 'v2.steal.caughtBy', 'v2.pocket.caughtBy', 'v2.seize.label', 'v2.seize.oncePool', 'v2.seize.onceCup', 'v2.seize.log', 'v2.seize.won', 'v2.seize.lost'])
    assert.equal(slots(FR_TEXTS[k]), slots(EN[k]), k);
  for (const k of ['v2.caught.fightLogFor', 'v2.caught.wonFor', 'v2.caught.lostFor']) assert.match(EN[k], /\{champion\}/);
  assert.equal(T.STAKE.coins, 10); assert.equal(T.STEAL_FINE.day, 15); assert.equal(T.CAUGHT_LOST, 2); assert.equal(T.SEIZE.coinsLost, 10);
});

test('the champion\'s master stands at the edge of the lists in their own approved town sheet, no new image (the operator\'s « PNJ en bordure + portraits », journal Passe CH-PNJ)', async () => {
  const MS = await load('/src/arena/master.ts');
  // every person who has a champion has a sheet, and every sheet is an approved production one (manifest, provenance pack): the sheets the portraits and the squares already use
  const masters = Object.keys(NF.NPC_FIGHTERS).filter((id) => CH.masterOf(id) === id).sort();
  assert.deepEqual(Object.keys(MS.MASTER_SHEET).sort(), masters, 'one sheet for each of the fourteen');
  assert.equal(masters.length, 14);
  for (const [who, id] of Object.entries(MS.MASTER_SHEET)) {
    const mf = JSON.parse(fs.readFileSync(path.join(ROOT, `art-lab/characters/manifests/${id}.manifest.json`), 'utf8'));
    assert.equal(mf.approved, true, `${who}: ${id} approved`); assert.equal(mf.runtimeUse, 'production', `${who}: ${id} in production`);
    assert.ok(fs.existsSync(path.join(ROOT, `art-lab/characters/exports/${id}.png`)), `${who}: ${id} exported`);
  }
  // the table the operator approved the sheets by: the keepers' own, the passers-by as the squares and the portraits show them
  assert.deepEqual(MS.MASTER_SHEET, { mara: 'merchant-x2-v2', hilde: 'hilde-x2-v2', corvin: 'corvin-x2-v2', pip: 'pip-x2-v2', edda: 'noble-x2-v1', sela: 'wayfarer-x2-v1', yselle: 'wayfarer-x2-v1', fenwick: 'older-merchant-x2-v1', garrick: 'older-merchant-x2-v1', nell: 'townswoman-x2-v1', hettie: 'townswoman-x2-v1', jory: 'courier-x2-v1', maud: 'artisan-x2-v1', dov: 'traveler-x2-v1' });
  // at the right edge of the sand, beyond both fighters' places (Ren -2.15, the champion 2.15), turned to the ring, smaller than a fighter
  assert.ok(MS.MASTER_AT.x > 2.15 + 1.5 && MS.MASTER_AT.x < 6.4 && !MS.MASTER_AT.flip && MS.MASTER_AT.scale < 1);
  // the pages: the arena builds the master only for a match that names one, in a version 2 duel, beside the stands' own cast; the page names one only for a town fight of a champion
  const A = fs.readFileSync(path.join(ROOT, 'src/arena/ArenaApp.ts'), 'utf8'), PA = fs.readFileSync(path.join(ROOT, 'src/ui/playArena.ts'), 'utf8'), AH = fs.readFileSync(path.join(ROOT, 'src/arena/AutoHud.ts'), 'utf8');
  assert.match(A, /if \(this\.opts\.match\?\.master && v2Rules\(this\.rules\) && this\.opts\.params\.get\('cast'\) !== 'generated'\)/);
  assert.match(A, /this\.master\?\.update\(this\.sim\.t, this\.lights, this\.camera, this\.keyDir\)/); assert.match(A, /this\.stands\?\.group, this\.master\?\.group/);
  assert.match(PA, /if \(challenge && masterOf\(fid\) && isV2\(st\)\) \{ await preloadPortraits/);
  // the card says « Representing X » with their face, under the champion's name
  assert.match(AH, /who === 'marek' && rep \? `<div class="ah-rep">/);
  assert.match(fs.readFileSync(path.join(ROOT, 'src/arena/ArenaHud.ts'), 'utf8'), /\.ah-rep\{display:flex;[^}]*font:400 var\(--ds-fs-small\)/);
});

test('the card\'s face is the champion\'s own (the operator\'s « le portrait du combattant ne semble pas etre le bon pour les combattants representant des pnjs »): the head of the fighter on the sand, not another person\'s face', () => {
  const C = fs.readFileSync(path.join(ROOT, 'src/arena/CombatCast.ts'), 'utf8');
  // a townsperson's fighter takes their face from their own idle frame on the template, in their look, after the town sheet's face (the person's, or a generated stranger's: white hair for Mara) was drawn
  assert.match(C, /await bakedFaces\(set, foe\);\n?\r?\s*\/\/[^\n]*\n\s*if \(npc && rival\) \{ const face = await npcFace\(rival\); if \(face\) set\.portraits\.marek = face; \}/);
  // the head is found on the template's own frame (a weapon over the head does not move it), the window read from the recoloured frame, 24 texels at one pixel in three, mirrored for the HUD's own mirror
  assert.match(C, /const raw = frames\[n\]\.rgba, shown = src\.recolor \? src\.recolor\('idle\.0', raw\) : raw, S = 72, opaque = /);
  assert.match(C, /d = \(y \* \(S \/ 3\) \+ \(S \/ 3 - 1 - x\)\) \* 4/);
  assert.match(C, /\(oy \+ 3 \* y \+ 1\) \* fw \+ ox \+ 3 \* x \+ 1/);
});
