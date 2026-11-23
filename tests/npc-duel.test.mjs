// Chantier 1 of the general gameplay audit, the NPC challenge and the theft (journal Passe PN1; the operator's sheet https://claude.ai/artifact/WyRKyZbsB1MMp8yMmAw8ho read back in
// journal Passe GP2): GP-01 « Les deux : se battre quand on est pris, et prendre de force », GP-02 « Les passants seulement », GP-03 « Gagné : on s’échappe sans amende (la pièce
// reste) », GP-04's note (the townsfolk fight themselves on a template, its skin, hair, clothes and weapons), GP-05 « Debout à leur place et à leur heure », GP-06 « Un passant par
// lieu et par moment (douze) », GP-07 « Choisir la pièce, la chance suit son prix », GP-08 « Le dire, et la restitution lève la bouderie ». The oracles are the decisions written out
// here, not the code's functions.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from './load.mjs';

const G = await load('/src/simulation/index.ts');
const T = await load('/src/simulation/v2town.ts');
const L = await load('/src/simulation/v2law.ts');
const B = await load('/src/simulation/v2barter.ts');
const P = await load('/src/narrative/people.ts');
const NF = await load('/src/narrative/npcFighters.ts');
const GEAR = await load('/src/simulation/gear.ts');
const PL = await load('/src/simulation/v2places.ts');
const AD = await load('/src/combat/autoData.ts');
const AM = await load('/src/combat/autoMatch.ts');
const NW = await load('/src/characters/NpcWeapons.ts');
const NL = await load('/src/characters/NpcLook.ts');
const FS = await load('/src/characters/FighterSkins.ts');
const BD = await load('/src/characters/BakedDecode.ts');
const TX = await load('/src/narrative/text/index.ts');
const TU = await load('/src/ui/tutorial.ts');

const v2 = (name = 'day1-morning') => G.makeV2(G.namedState(name));
const act = (st, a, rng) => { const r = G.advance(st, a, rng); assert.ok(r.ok, `${a.type}: ${r.reason}`); return r; };
const refused = (st, a, re) => { const r = G.advance(st, a); assert.equal(r.ok, false, `${a.type} should be refused`); if (re) assert.match(r.reason, re); return r.reason; };
const WIN = { next: () => 0, fork() { return this; } }, LOSE = { next: () => 0.999, fork() { return this; } };
const held = (st, id) => id === 'whetstone' ? st.player.items.includes('whetstone') : [st.v2.gear.weapon, st.v2.gear.armour, ...st.v2.gear.acc, ...st.v2.gear.bag].includes(id);
const outcome = (winner, finisher = null) => ({ winner, playerHp: winner === 'player' ? 100 : 0, playerMaxHp: 300, opponentHp: winner === 'player' ? 0 : 100, opponentMaxHp: 300, finisher });
const at = (st, place, slot, day) => { const s = structuredClone(st); s.place = place; s.slot = slot; if (day) s.day = day; return s; };

test('GP-07: a stall offers each of its pieces to steal (the salve aside, nothing already held), and the chance falls with the piece\'s price', () => {
  const st = at(v2(), 'district', 'morning');
  const steals = G.actions(st).filter((o) => o.action.type === 'steal' && o.action.shop === 'mara');
  const want = Object.values(GEAR.GEAR).filter((g) => GEAR.soldAt(g, 'mara', st.day) && g.id !== 'salve' && !held(st, g.id)).map((g) => g.id).sort();
  assert.deepEqual(steals.map((o) => o.action.item).sort(), want, 'one line per piece');
  // the rule written out: today's chance, less (price - 8) / 110 (« proposé »: the whetstone keeps today's chance)
  const base = (s) => Math.min(0.85, Math.max(0.05, (s.slot === 'evening' ? 0.6 : 0.3) + (60 - s.pulse.security) / 200 - (s.town.mara ?? 0) / 400 - (s.flags[`alert:${s.day}`] ? 0.15 : 0)));
  for (const item of want) {
    const p = GEAR.GEAR[item].price, rule = Math.min(0.85, Math.max(0.05, (st.slot === 'evening' ? 0.6 : 0.3) + (60 - st.pulse.security) / 200 - (st.town.mara ?? 0) / 400 - Math.max(0, p - 8) / 110));
    assert.ok(Math.abs(T.stealChance(st, 'mara', item) - rule) < 1e-9, `${item}: ${T.stealChance(st, 'mara', item)} vs ${rule}`);
  }
  assert.ok(Math.abs(T.stealChance(st, 'mara', 'whetstone') - base(st)) < 1e-9, 'the whetstone keeps today\'s chance');
  assert.ok(T.stealChance(st, 'mara', 'imported-blade') < T.stealChance(st, 'mara', 'whetstone'), 'a dearer piece, a lower chance');
  // the piece taken is the one chosen
  const got = act(st, { type: 'steal', shop: 'mara', item: 'dock-leathers' }, WIN).state;
  assert.ok(held(got, 'dock-leathers')); assert.equal(got.v2.thefts.at(-1).item, 'dock-leathers');
  refused(st, { type: 'steal', shop: 'mara', item: 'salve' });
  refused(st, { type: 'steal', shop: 'mara', item: 'mail-shirt' }, /not sold|sold/i);
});

test('GP-03: caught at a stall by day, the keeper holds the player: the fine waits, nothing else is done; paid, the cap; fought and won, no fine and the piece left; lost, doubled', () => {
  const st = at(v2(), 'district', 'morning'); st.player.coins = 60;
  const c = act(st, { type: 'steal', shop: 'mara', item: 'whetstone' }, LOSE).state;
  assert.deepEqual(c.v2.caught, { by: 'mara', from: 'mara', item: 'whetstone', fine: T.STEAL_FINE.day, shop: 'mara' });
  assert.equal(c.player.coins, 60, 'no coins taken before the answer'); assert.equal(c.v2.marks, 1, 'the mark written at once'); assert.ok(!held(c, 'whetstone'));
  // nothing else in between: every other action refused, its reason naming the one who holds the player
  for (const a of [{ type: 'wait' }, { type: 'move', to: 'forecourt' }, { type: 'talk', who: 'hale' }]) refused(c, a, /Mara/);
  // paid
  const paid = act(c, { type: 'payFine' }).state;
  assert.equal(paid.v2.caught, undefined); assert.equal(paid.player.coins, 60 - T.STEAL_FINE.day);
  // fought: a slot at the result; won, away without a fine, the whetstone left at the stall
  const f = act(c, { type: 'fightCatch' }).state;
  assert.equal(f.v2.caught, undefined); assert.deepEqual({ who: f.v2.challenge.who, kind: f.v2.challenge.kind }, { who: 'mara', kind: 'caught' });
  const won = act(f, { type: 'challengeResult', outcome: outcome('player') }).state;
  assert.equal(won.player.coins, 60, 'no fine'); assert.ok(!held(won, 'whetstone'), 'the piece stays where it was'); assert.equal(won.v2.marks, 1);
  assert.notEqual(won.slot, c.slot, 'the fight took the slot');
  const lost = act(f, { type: 'challengeResult', outcome: outcome('opponent') }).state;
  assert.equal(lost.player.coins, 60 - 2 * T.STEAL_FINE.day, 'the fine doubled');
  // a purse too thin pays what it holds (never a dead end)
  const poor = structuredClone(f); poor.player.coins = 7;
  assert.equal(act(poor, { type: 'challengeResult', outcome: outcome('opponent') }).state.player.coins, 0);
  // calling the fight off puts the fine back
  const off = act(f, { type: 'cancelChallenge' }).state;
  assert.deepEqual(off.v2.caught, c.v2.caught); assert.equal(off.v2.challenge, undefined);
});

test('GP-03: at night Wynn of the watch catches the thief at a forced shutter (the keeper is not there); a pocket, the passer-by themself', () => {
  const night = at(v2(), 'district', 'evening'); night.player.coins = 80;
  const c = act(night, { type: 'steal', shop: 'mara', item: 'whetstone' }, LOSE).state;
  assert.equal(c.v2.caught.by, 'wynn'); assert.equal(c.v2.caught.fine, T.STEAL_FINE.night); assert.equal(c.v2.caught.night, true);
  const f = act(c, { type: 'fightCatch' }).state;
  assert.equal(act(f, { type: 'challengeResult', outcome: outcome('opponent') }).state.player.coins, 80 - 2 * T.STEAL_FINE.night);
  const pk = at(v2(), 'district', 'evening'); pk.player.coins = 50;
  const p = act(pk, { type: 'pickpocket', who: 'fenwick' }, LOSE).state;
  assert.deepEqual({ by: p.v2.caught.by, fine: p.v2.caught.fine }, { by: 'fenwick', fine: 10 });
  assert.equal(act(p, { type: 'payFine' }).state.player.coins, 40);
});

test('GP-03: the fight is refused the afternoon of the player\'s bout (the fine is paid); the duel is the arena\'s, against the townsperson\'s own fighter', () => {
  const day2 = G.makeV2(G.namedState('v2-day2-afternoon'));
  const s = structuredClone(day2); s.v2.caught = { by: 'hilde', from: 'hilde', item: 'padded-jack', fine: 15, shop: 'armourer' };
  refused(s, { type: 'fightCatch' }); act(s, { type: 'payFine' });
  const m = at(v2(), 'district', 'morning'); m.v2.challenge = { who: 'mara', day: 1, kind: 'caught', caught: { by: 'mara', from: 'mara', item: 'whetstone', fine: 15, shop: 'mara' } };
  const b = AM.autoBoutOf(m, 'challenge');
  assert.ok(b, 'a duel against Mara'); assert.equal(b.foeId, 'mara');
  // a townsperson's kit: one technique, the brace; no super, no ultimate (no cinematic for a townsperson)
  for (const [w, k] of Object.entries(AD.AUTO_TOWN_KITS)) for (const sk of k.skills) assert.equal(AD.skillRank(sk.id), 'technique', `${w}: ${sk.id}`);
  assert.deepEqual(b.foe.skills.map((x) => x.id), AD.AUTO_TOWN_KITS[NF.NPC_FIGHTERS.mara.look.weapon].skills.map((x) => x.id));
});

test('GP-01 / GP-02: a passer-by\'s piece demanded by force, the passers-by only: won, the piece, a mark, the name -5 and their goodwill -30, a theft a restitution pays back; lost, 10 coins and the name -3', () => {
  const st = at(v2(), 'forecourt', 'morning'); st.player.coins = 40;
  const seizes = G.actions(st).filter((o) => o.action.type === 'seize').map((o) => o.action.who);
  assert.ok(seizes.length > 0 && seizes.every((w) => P.PEOPLE[w].passer), 'only passers-by'); assert.ok(seizes.includes('edda'));
  const s1 = act(st, { type: 'seize', who: 'edda' }).state;
  assert.deepEqual({ who: s1.v2.challenge.who, kind: s1.v2.challenge.kind }, { who: 'edda', kind: 'seize' });
  const won = act(s1, { type: 'challengeResult', outcome: outcome('player') }).state;
  const item = B.PASSERS.edda.item;
  assert.ok(held(won, item)); assert.equal(won.v2.passed.edda, 1); assert.equal(won.player.reputation, st.player.reputation - 5);
  assert.equal(won.town.edda, (st.town.edda ?? 0) - 30); assert.equal(won.v2.marks, 1);
  const t = won.v2.thefts.at(-1); assert.deepEqual({ from: t.from, item: t.item, seen: t.seen, seized: t.seized }, { from: 'edda', item, seen: 'found', seized: true });
  assert.ok(L.takenThefts(won).some((x) => x.item === item), 'a restitution gives it back');
  const lost = act(s1, { type: 'challengeResult', outcome: outcome('opponent') }).state;
  assert.equal(lost.player.coins, 40 - 10); assert.equal(lost.player.reputation, st.player.reputation - 3); assert.ok(!held(lost, item));
  // a heavy blow's knockdown wounds, as in an official bout; a light one never
  assert.equal(act(s1, { type: 'challengeResult', outcome: outcome('opponent', 'heavy') }).state.player.injury, 1);
  assert.equal(lost.player.injury, 0);
  // once a passer-by and a phase
  const again = structuredClone(lost); again.v2.challenge = undefined;
  refused(again, { type: 'seize', who: 'edda' }, /Edda/);
  const cup = structuredClone(again); cup.day = 6; assert.equal(G.advance(cup, { type: 'seize', who: 'edda' }).ok, true, 'again after the cut');
});

test('GP-04: every townsperson who can fight has a fighter on a template, its look in the file\'s ramps and a weapon of the list; no child among them', () => {
  const file = NL.NPC_LOOK_FILE, ramps = file.ramps;
  const fighters = new Set([...Object.values(GEAR.SHOPS).map((s) => s.keeper), T.CATCH_WATCH, ...Object.keys(B.PASSERS), 'vane', 'wick']); // the last two, the events' fighters (journal Passe QE2)
  for (const id of fighters) {
    const f = NF.NPC_FIGHTERS[id];
    assert.ok(f, `${id} fights on a template`);
    assert.ok(['m', 'f'].includes(f.look.template)); assert.ok(NW.NPC_WEAPONS.includes(f.look.weapon), `${id}: ${f.look.weapon}`);
    for (const m of ['skin', 'hair', 'cloak']) if (f.look[m]) assert.ok(ramps[m][f.look[m]], `${id}: ${m} ${f.look[m]}`);
    assert.ok(f.hp > 0 && f.hp < 1 && f.damage > 0 && f.damage < 1, `${id}: weaker than the rival it is drawn from`);
  }
  assert.deepEqual(new Set(Object.keys(NF.NPC_FIGHTERS)), fighters, 'nobody else');
  // each template's lines cover every frame, and the weapons the operator asked for (« epee, hache, marteau ») are among the list
  for (const t of ['m', 'f']) assert.equal(Object.keys(file.sheets[NL.npcSheetId(t)].weapon.frames).length, 34);
  for (const w of ['sword', 'axe', 'hammer']) assert.ok(NW.NPC_WEAPONS.includes(w));
});

test('GP-04: a weapon is drawn along the frame\'s line, the hands in front; the look recolours; production waits for the operator\'s approval', async () => {
  const id = NL.npcSheetId('m'), meta = JSON.parse(fs.readFileSync(path.join(ROOT, `art-lab/characters/exports/${id}.json`), 'utf8'));
  const { fw, fh, frames } = FS.namedFrames(await BD.decodePng(new Uint8Array(fs.readFileSync(path.join(ROOT, `art-lab/characters/exports/${id}.png`)))), meta, true);
  // the operator's art sheet (GA-M, GA-F « Production », GA-P « En production avec le chantier »): the file approved, his words quoted, each template's maps at their fingerprint
  assert.ok(NL.npcLooksApproved(), 'the looks approved by the operator');
  assert.match(NL.NPC_LOOK_FILE.approval.note, /GA-P « En production avec le chantier »/); assert.match(NL.NPC_LOOK_FILE.approval.note, /on percoit l'epee presente parmi les autres armes/);
  const prod = NL.npcSheetLook({ template: 'm', weapon: 'axe' }, frames, fw, fh, 'approved');
  assert.equal(typeof prod, 'function', 'approved: the look in production');
  assert.deepEqual(prod(0, frames[0].rgba), NL.npcSheetLook({ template: 'm', weapon: 'axe' }, frames, fw, fh, 'candidate')(0, frames[0].rgba), 'production draws what the review drew');
  // negative control: a file left unapproved puts nothing in production, and a map that is not the fingerprinted one is refused
  const was = { a: NL.NPC_LOOK_FILE.approved, fp: NL.NPC_LOOK_FILE.sheets[id].fingerprint };
  try {
    NL.NPC_LOOK_FILE.approved = false; assert.equal(NL.npcSheetLook({ template: 'm', weapon: 'axe' }, frames, fw, fh, 'approved'), null, 'not approved: nothing in production');
    NL.NPC_LOOK_FILE.approved = was.a; NL.NPC_LOOK_FILE.sheets[id].fingerprint = '00000000';
    assert.throws(() => NL.npcSheetLook({ template: 'm', weapon: 'axe' }, frames, fw, fh, 'approved'), /not the approved maps/);
  } finally { NL.NPC_LOOK_FILE.approved = was.a; NL.NPC_LOOK_FILE.sheets[id].fingerprint = was.fp; }
  const tone = NL.npcSheetLook({ template: 'm', skin: 'dark', hair: 'grey', cloak: 'wine', weapon: 'hammer' }, frames, fw, fh, 'candidate');
  const n = frames.findIndex((f) => f.name === 'idle.0'), out = tone(n, frames[n].rgba);
  let changed = 0; for (let i = 0; i < out.length; i += 4) if (out[i] !== frames[n].rgba[i] || out[i + 1] !== frames[n].rgba[i + 1]) changed++;
  assert.ok(changed > 300, `the look and the weapon change the frame (${changed} texels)`);
  // the same call, the same texels (deterministic)
  assert.deepEqual(tone(n, frames[n].rgba), out);
  // a hand on the hilt stays in front: no texel of the hands changes under any weapon
  const seg = NL.NPC_LOOK_FILE.sheets[id].weapon.frames['idle.0'], skin = new Set(NL.NPC_LOOK_FILE.sheets[id].skin.skin.map((c) => parseInt(c, 16)));
  const hands = NW.handsOf(frames[n].rgba, fw, fh, seg, skin);
  for (const w of NW.NPC_WEAPONS) {
    const o = NW.weaponFrame(frames[n].rgba, frames[n].rgba, fw, fh, 'idle.0', NL.NPC_LOOK_FILE.sheets[id].weapon, w, skin);
    for (let j = 0; j < hands.length; j++) if (hands[j]) assert.deepEqual([...o.slice(j * 4, j * 4 + 4)], [...frames[n].rgba.slice(j * 4, j * 4 + 4)], `${w}: a hand texel changed`);
  }
});

test('GA-W: the template\'s sword never shows behind another weapon (the operator\'s note « on percoit l\'epee presente parmi les autres armes » and his message « des corrections d\'affichages a prevoir sur les armes de nos pnjs »)', async () => {
  // in every frame of both templates, under each weapon, the sword's two light steels (which neither the mace, the hammer nor the dagger's drawn steel use) left near its line:
  // two texels at most (single texels by the hands); the townswoman's brace, where the blade crossed her face, none
  const LIGHT = new Set([0xeceef4, 0xbec4d0]);
  for (const t of ['m', 'f']) {
    const id = NL.npcSheetId(t), s = NL.NPC_LOOK_FILE.sheets[id], meta = JSON.parse(fs.readFileSync(path.join(ROOT, `art-lab/characters/exports/${id}.json`), 'utf8'));
    const { fw, fh, frames } = FS.namedFrames(await BD.decodePng(new Uint8Array(fs.readFileSync(path.join(ROOT, `art-lab/characters/exports/${id}.png`)))), meta, true);
    const skin = new Set([...s.skin.skin, ...(s.skin.shade ?? [])].map((c) => parseInt(c, 16)));
    for (const f of frames) {
      const L = NW.lineOf(NW.centreLine(f.rgba, fw, fh, s.weapon.frames[f.name], s.weapon));
      const near = (x, y) => { const sx = (x - L.hx) * L.dx + (y - L.hy) * L.dy, r = (x - L.hx) * L.nx + (y - L.hy) * L.ny; return sx >= -10 && sx <= L.len + 18 && Math.abs(r) <= (sx < 1.5 ? 11 : 5); };
      for (const w of ['mace', 'hammer', 'dagger']) {
        const o = NW.weaponFrame(f.rgba, f.rgba, fw, fh, f.name, s.weapon, w, skin);
        let left = 0;
        for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) { const i = (y * fw + x) * 4; if (o[i + 3] >= 128 && LIGHT.has((o[i] << 16) | (o[i + 1] << 8) | o[i + 2]) && near(x, y)) left++; }
        assert.ok(left <= (t === 'f' && f.name === 'skillDef.1' ? 0 : 2), `${id} ${f.name} under the ${w}: ${left} texels of the old sword`);
      }
    }
  }
  // the townswoman's brace (her report's frame): past the dagger, where the blade crossed her face, none of the colours the old blade left there (its steel, its outline 39384b, its
  // creams ccb2a1 and e5c6af); negative control, the frame's pinned line as it was (a texel low) and the sheet's colours without those three leave them
  {
    const id = NL.npcSheetId('f'), s = NL.NPC_LOOK_FILE.sheets[id], meta = JSON.parse(fs.readFileSync(path.join(ROOT, `art-lab/characters/exports/${id}.json`), 'utf8'));
    const { fw, fh, frames } = FS.namedFrames(await BD.decodePng(new Uint8Array(fs.readFileSync(path.join(ROOT, `art-lab/characters/exports/${id}.png`)))), meta, true);
    const skin = new Set([...s.skin.skin, ...(s.skin.shade ?? [])].map((c) => parseInt(c, 16))), f = frames.find((q) => q.name === 'skillDef.1'), pinned = s.weapon.frames['skillDef.1'];
    const OLD = new Set([0xeceef4, 0xbec4d0, 0x848a98, 0x39384b, 0xccb2a1, 0xe5c6af]);
    const count = (o, seg) => { const L = NW.lineOf(seg); let n = 0; for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) { const i = (y * fw + x) * 4, sx = (x - L.hx) * L.dx + (y - L.hy) * L.dy, r = (x - L.hx) * L.nx + (y - L.hy) * L.ny; if (sx >= 32 && sx <= L.len + 4 && Math.abs(r) <= 4 && o[i + 3] >= 128 && OLD.has((o[i] << 16) | (o[i + 1] << 8) | o[i + 2])) n++; } return n; };
    assert.equal(count(NW.weaponFrame(f.rgba, f.rgba, fw, fh, 'skillDef.1', s.weapon, 'dagger', skin), pinned), 0, 'the brace behind the dagger: nothing of the old blade');
    const before = { steel: s.weapon.steel, blade: s.weapon.blade.filter((c) => !['ccb2a1', 'e5c6af'].includes(c)), edge: s.weapon.edge.filter((c) => !['39384b', '53434a'].includes(c)) };
    const hands = NW.handsOf(f.rgba, fw, fh, pinned, skin), old = NW.drawWeapon(NW.eraseSword(f.rgba, fw, fh, pinned, before, hands), fw, fh, pinned, 'dagger', hands);
    assert.ok(count(old, pinned) >= 8, `negative control: the pinned line and the old colours leave the blade (${count(old, pinned)} texels)`);
  }
  // Master Corvin's note after a townsperson's duel names them (it said « 0 for garrick », found by tools/npc-duel-flow.mjs)
  const NB = await load('/src/ui/notebook.ts');
  // (since journal Passe CH-PNJ a keeper or a passer-by who is no fighter is named by their champion; Wynn and the events' fighters by their own names)
  for (const id of Object.keys(NF.NPC_FIGHTERS)) assert.equal(NB.fighterName(id), id === 'wynn' || NF.NPC_FIGHTERS[id].name ? (P.PEOPLE[id]?.name ?? NF.NPC_FIGHTERS[id].name) : `${P.PEOPLE[id].name}'s champion`, `${id}: named in the notebook`);
  // the weapon drawn at the common length: the man's brace, whose sword runs 91 texels from his left fist past his right hand, holds a hammer no longer than in the other frames
  const m = NL.NPC_LOOK_FILE.sheets[NL.npcSheetId('m')].weapon.frames['skillDef.1'];
  assert.deepEqual(m, [42, 209, 133, 209], 'the brace\'s line from the crossguard by his left fist to the tip');
});

test('GP-05: the six generic fighters stand at their place and hour (Tobin and Rhosk stay portraits)', () => {
  assert.deepEqual([...PL.STANDING_GENERICS].sort(), ['aldric', 'ambrose', 'corra', 'kell', 'lucan', 'piers']);
  const s = at(v2(), 'training', 'morning');
  assert.ok(PL.plazaPeople(s).includes('aldric')); assert.ok(!PL.plazaPeople(s).includes('tobin')); assert.ok(!PL.plazaPeople(s).includes('rhosk'));
  assert.ok(PL.plazaPeople(at(v2(), 'lanterns', 'morning')).includes('kell'));
  assert.ok(PL.plazaPeople(at(v2(), 'forecourt', 'evening')).includes('lucan'));
  assert.ok(!PL.plazaPeople(at(v2(), 'forecourt', 'morning')).includes('lucan'), 'Lucan by evening only');
  // their manifests quote the operator's approval for the squares
  for (const g of PL.STANDING_GENERICS) {
    const m = JSON.parse(fs.readFileSync(path.join(ROOT, `art-lab/characters/manifests/${g}-x2-v1.manifest.json`), 'utf8'));
    assert.match(m.notes, /Debout à leur place et à leur heure/, `${g}: GP-05 quoted`);
  }
});

test('GP-06: one passer-by at every place and every moment (twelve), each with a piece, a reason, a line and an argument; never a child', () => {
  const places = ['district', 'forecourt', 'training', 'lanterns'], slots = ['morning', 'afternoon', 'evening'];
  const passers = Object.values(P.PEOPLE).filter((p) => p.passer);
  for (const place of places) for (const slot of slots) {
    const here = passers.filter((p) => p.place === place && p.hours.includes(slot));
    assert.equal(here.length, 1, `${place} ${slot}: ${here.map((p) => p.id)}`);
  }
  assert.equal(passers.length, 10, 'ten people (Lady Edda and Sela keep their two moments)');
  for (const p of passers) {
    const b = B.PASSERS[p.id]; assert.ok(b && GEAR.GEAR[b.item], `${p.id}: a piece`);
    assert.ok(p.title.length > 0); assert.ok(TX.tx(b.soft.label, { pct: 50 }).length > 0); assert.ok(TX.tx(b.soft.won, { item: 'x', price: 1 }).length > 0);
  }
});

test('GP-08: a restitution lifts a passer-by\'s snub (the guide says the muscle, and when)', () => {
  const st = at(v2(), 'district', 'evening'); st.player.coins = 60;
  let s = act(st, { type: 'pickpocket', who: 'fenwick' }, LOSE).state;
  s = act(s, { type: 'payFine' }).state;
  assert.ok(s.flags['snub:fenwick']); assert.match(B.passerOpen(s, 'fenwick'), /nothing to do/);
  s = act(s, { type: 'restitute' }).state;
  assert.equal(s.flags['snub:fenwick'], undefined); assert.equal(B.passerOpen(s, 'fenwick'), null);
  // the guide as the game writes it: who the muscle is, from which goodwill she is hired, how many nights she waits; the fight of a thief caught and the piece taken by force
  const law = TU.CHAPTERS.find((c) => c.id === 'law'), guide = TU.chapterText(st, law);
  assert.match(guide, new RegExp(`brings down to -${-L.LAW.grudge} hires ${P.PEOPLE.corra.name}, who waits for you on the quay at night for ${L.LAW.waits} nights`));
  assert.match(guide, /or fight on the sand: by day the keeper or the passer-by is no fighter and sends their champion, a fighter in their service and in their colours; at night Wynn fights himself\. Won, you walk away without paying/); assert.match(guide, /demanded by force, on the sand, against their champion/);
  assert.match(guide, /a passer-by you robbed speaks to you again/);
});

test('GP-13 on the townsfolk\'s fights (the rebase on chantier 2, journal Passe GP3): the holder\'s fight and a piece demanded by force go through the short sheet, which says what a win and a loss settle', async () => {
  const EN = (await load('/src/narrative/text/en.ts')).EN, FR = (await load('/src/narrative/text/fr-texts.ts')).FR_TEXTS;
  const U = fs.readFileSync(path.join(ROOT, 'src/ui/townUi.ts'), 'utf8');
  // the band's fight opens the sheet, no straight way to the arena
  assert.match(U, /if \(o\.action\.type === 'fightCatch' && this\.st\.v2\?\.challenge\) this\.openChallengeSheet\(\);/);
  // its stake by kind, no skill to learn and no word of a challenge's vigour
  assert.match(U, /const teach = ch\.reprisal \|\| ch\.kind \? null : challengeSkill\(s, who\);/);
  assert.match(U, /ch\.kind === 'caught' && ch\.caught \? tx\('prep\.challenge\.caught', \{ item: itemName\(ch\.caught\.item\), fine: CAUGHT_LOST \* ch\.caught\.fine \}\)/);
  assert.match(U, /ch\.kind === 'seize' \? tx\('prep\.challenge\.seize', \{ item: itemName\(PASSERS\[who\]\?\.item \?\? ''\), name: masterName\(who\), n: SEIZE\.coinsLost \}\)/);
  for (const k of ['prep.challenge.caught', 'prep.challenge.seize']) { assert.ok(EN[k], k); assert.ok(FR[k], `${k} in French`); }
  // the words: GP-03 (won, no fine and the piece stays; lost, the fine doubled) and GP-01 (won, the piece and a mark; lost, 10 coins)
  assert.equal(TX.tx('prep.challenge.caught', { item: 'a whetstone', fine: 2 * T.STEAL_FINE.day }), `Won: you walk away without the fine, a whetstone where it was. Lost: the fine doubled, ${2 * T.STEAL_FINE.day} coins.`);
  assert.equal(T.CAUGHT_LOST, 2); assert.equal(T.SEIZE.coinsLost, 10);
  assert.match(TX.tx('prep.challenge.seize', { item: 'a lucky coin', name: 'Nell', n: 10 }), /^Won: a lucky coin is yours, with a mark in Sergeant Hale's ledger, and Nell will remember\. Lost: you leave 10 coins on the sand\.$/);
});
