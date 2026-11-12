// The version 2's spectators (journal Passe PU1, the operator's sheet briefs/fiche-public-gradins.html, PU-1 to PU-8): the seats, who sits where, the
// variants, the breathing clocks, the reactions against the crowd's sound, the production gate of the five sheets and their approval, and the wiring that
// keeps today's arena on its generated spectators.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from './load.mjs';

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const json = (rel) => JSON.parse(read(rel));
const S = await load('/src/arena/stands.ts');
const SC = await load('/src/arena/ArenaScene.ts');
const sfx = await load('/src/audio/sfx.ts');
const C = await load('/src/combat/charge.ts');
const A = await load('/src/arena/v2Arena.ts');

const DEG = Math.PI / 180;
const TOWNSFOLK = ['artisan-x2-v1', 'traveler-x2-v1', 'townswoman-x2-v1', 'older-merchant-x2-v1', 'courier-x2-v1'];
/** no draw from Math.random while `fn` runs */
const noRandom = (fn) => { const r = Math.random; Math.random = () => { throw new Error('Math.random drawn'); }; try { return fn(); } finally { Math.random = r; } };

test('PU-2 « Dense : 88 places »: 88 seats on the four tiers, from the gate towers to 60 deg each side, the same at every call, no draw', () => {
  const a = noRandom(() => S.standsSeats()), b = S.standsSeats();
  assert.equal(a.length, 88);
  assert.deepEqual(a, b);
  const { ARC, TIER, GATE_HALF, TOWER_W } = SC;
  // the oracle: the wall's own geometry (ArenaScene), each seat's angle and radius read back from its position
  const from = Math.asin(GATE_HALF / ARC.r) + Math.asin(TOWER_W / ARC.r);
  assert.ok(from > 30 * DEG && from < 33 * DEG, 'the towers end near 32 deg');
  const perTier = {};
  for (const s of a) {
    const ang = Math.atan2(s.x - ARC.cx, ARC.cz - s.z), r = Math.hypot(s.x - ARC.cx, ARC.cz - s.z);
    assert.equal(Math.sign(ang), s.side, 'each seat on its wing');
    assert.ok(Math.abs(ang) >= from - 1e-9 && Math.abs(ang) <= 60 * DEG + 1e-9, `angle ${(ang / DEG).toFixed(1)}`);
    const r0 = ARC.r + ARC.thick + s.tier * TIER.depth;
    assert.ok(r > r0 && r < r0 + TIER.depth, 'on its tier, not over its edge');
    assert.ok(Math.abs(s.y - (TIER.base + (s.tier + 1) * TIER.rise)) < 1e-9, 'on its tier\'s height');
    (perTier[`${s.side}/${s.tier}`] ??= []).push(Math.abs(ang) * r);
  }
  assert.equal(Object.keys(perTier).length, 8, 'every tier of both wings has spectators');
  for (const [k, arc] of Object.entries(perTier)) {
    arc.sort((p, q) => p - q);
    for (let i = 1; i < arc.length; i++) assert.ok(arc[i] - arc[i - 1] > 0.3, `${k}: two spectators ${(arc[i] - arc[i - 1]).toFixed(2)} m apart`);
  }
});

test('PU-1 / PU-4: the five townsfolk and their approved variants spread over the seats by the seat alone, no draw', () => {
  const seats = S.standsSeats(), counts = [2, 2, 2, 2, 2];
  assert.deepEqual([...S.STANDS_SHEETS], TOWNSFOLK);
  const who = noRandom(() => seats.map((_, i) => S.seatOf(i, counts)));
  assert.deepEqual(who, seats.map((_, i) => S.seatOf(i, counts)), 'the same at every call');
  const bySheet = [0, 0, 0, 0, 0], byVariant = [0, 0, 0];
  for (const w of who) { bySheet[w.sheet]++; byVariant[w.variant]++; assert.ok(w.variant >= 0 && w.variant <= 2); }
  for (const n of bySheet) assert.ok(n === 17 || n === 18, `each townsperson 17 or 18 times in 88: ${bySheet}`);
  // five neighbours of a block are five different people
  for (let b = 0; b + 5 <= who.length; b += 5) assert.equal(new Set(who.slice(b, b + 5).map((w) => w.sheet)).size, 5, `block ${b / 5}`);
  for (const n of byVariant) assert.ok(n >= 15, `the original and both variants each at least fifteen times: ${byVariant}`);
  // fifteen looks: every sheet in every variant
  assert.equal(new Set(who.map((w) => `${w.sheet}/${w.variant}`)).size, 15);
  // the breathing clocks: each its own rate in [0.85, 1.15] and phase
  const rates = seats.map((_, i) => S.breathRate(i));
  for (const r of rates) assert.ok(r >= 0.85 && r <= 1.15);
  assert.ok(new Set(rates.map((r) => r.toFixed(3))).size > 80, 'the clocks differ');
  assert.ok(Math.abs(S.STANDS.scale - 0.62 * 0.9) < 1e-12, 'the generated spectators\' scale x the cast\'s');
});

test('PU-5 « Calquée sur la foule sonore »: the stands react on exactly the moments the crowd\'s sound plays, and only on them', () => {
  // the decision's own list (independent of the code): a roar on the K.O., a gasp on a break, a cheer on Ren's own techniques, an « oh » on the other heavy blows that land
  const own = new Set(['t1', 't2', 't3', 't4', 'k_sunder', 'k_feint']);
  const expected = (e) => (e.type === 'ko' ? 'roar' : e.type === 'break' ? 'gasp' : e.type === 'impact' && e.result === 'hit' && (e.kind === 'heavy' || e.kind === 'skill') ? (e.from === 'ren' && own.has(e.action) ? 'cheer' : 'oh') : null);
  const cases = [
    { type: 'ko', who: 'marek' }, { type: 'break', who: 'ren' }, { type: 'reset' }, { type: 'chargeTier', idx: 1, open: true },
    { type: 'impact', from: 'ren', to: 'marek', kind: 'skill', action: 't2', result: 'hit', damage: 300 },
    { type: 'impact', from: 'ren', to: 'marek', kind: 'heavy', action: 'heavy', result: 'hit', damage: 200 },
    { type: 'impact', from: 'marek', to: 'ren', kind: 'heavy', action: 'm_heavy', result: 'hit', damage: 200 },
    { type: 'impact', from: 'marek', to: 'ren', kind: 'skill', action: 'm_ironfall', result: 'hit', damage: 300 },
    { type: 'impact', from: 'ren', to: 'marek', kind: 'light', action: 'light', result: 'hit', damage: 60 },
    { type: 'impact', from: 'marek', to: 'ren', kind: 'heavy', action: 'm_heavy', result: 'guarded', damage: 0 },
    { type: 'impact', from: 'marek', to: 'ren', kind: 'heavy', action: 'm_heavy', result: 'dodged', damage: 0 },
  ];
  for (const e of cases) assert.equal(S.reactionOf(e), expected(e), JSON.stringify(e));
  // a whole charged duel (the arena check's fixed script): every event, the stands' reaction is the sound's, and all four moments are reached
  const s = A.sceneV2Duel('charge'), d = new C.ChargedDuel(s.data, s.tiers), seen = {};
  A.runV2Fingerprint(d, (evs) => { for (const e of evs) { const r = S.reactionOf(e); assert.equal(r, sfx.crowdOf(e)); assert.equal(r, expected(e)); if (r) seen[r] = (seen[r] ?? 0) + 1; } });
  for (const r of ['roar', 'gasp', 'cheer', 'oh']) assert.ok(seen[r] > 0, `the duel reaches ${r}: ${JSON.stringify(seen)}`);
});

test('the share of the stands a moment moves, when each seat starts, and its pose', () => {
  const n = 88, at = 12.5;
  const share = (s) => [...Array(n).keys()].filter((i) => S.takes(i, at, s) !== null).length;
  assert.equal(share(1), n); assert.equal(share(0), 0);
  for (const r of ['roar', 'gasp', 'cheer', 'oh']) {
    const k = share(S.REACTION[r].share) / n;
    assert.ok(Math.abs(k - S.REACTION[r].share) < 0.17, `${r}: ${k.toFixed(2)} of the stands for ${S.REACTION[r].share}`);
  }
  assert.deepEqual({ roar: S.REACTION.roar.share, gasp: S.REACTION.gasp.share, cheer: S.REACTION.cheer.share, oh: S.REACTION.oh.share }, { roar: 1, gasp: 0.75, cheer: 0.8, oh: 0.45 });
  for (let i = 0; i < n; i++) { const t = S.takes(i, at, 1); assert.ok(t >= at && t < at + 0.35, 'a seat starts within 0.35 s'); }
  // poses: hops up to 9 cm (the roar) or 7, a small one for the « oh », the gasp's start then the breath held; nothing outside its length or before it
  for (const r of ['roar', 'gasp', 'cheer', 'oh']) {
    let top = 0;
    for (let dt = 0; dt < S.REACTION[r].len; dt += 0.01) { const p = S.reactionPose(r, dt, 1); top = Math.max(top, p.dy); assert.ok(p.dy >= 0); assert.equal(p.hold, r === 'gasp'); }
    assert.ok(top > 0.03 && top <= 0.09 + 1e-9, `${r} lifts ${top.toFixed(3)} m`);
    assert.deepEqual(S.reactionPose(r, S.REACTION[r].len + 0.01, 1), { dy: 0, hold: false });
    assert.deepEqual(S.reactionPose(r, -0.01, 1), { dy: 0, hold: false });
  }
  assert.deepEqual(S.reactionPose(null, 0.2, 1), { dy: 0, hold: false });
  assert.equal(S.REACTION.roar.len, 3);
});

test('PU-8: the five sheets are approved for production, with their approved variants, and their packs carry the operator\'s approval word for word', () => {
  const variants = json('art-lab/characters/variants/variants.json');
  assert.equal(variants.approved, true);
  for (const id of TOWNSFOLK) {
    const m = json(`art-lab/characters/manifests/${id}.manifest.json`), p = json(`art-lab/characters/provenance/${id}/PROVENANCE.json`);
    assert.equal(m.approved, true); assert.equal(m.runtimeUse, 'production');
    assert.equal(variants.sheets[id].variants.length, 2, `${id}: two approved variants`);
    assert.match(variants.sheets[id].fingerprint, /^[0-9a-f]{8}$/);
    const a = p.approvals.find((x) => /Passe PU1/.test(x.scope ?? ''));
    assert.ok(a, `${id}: the approval of journal Passe PU1`);
    assert.equal(a.decision, '« Approuver : en production dans les gradins de la version 2, avec les choix de cette fiche »');
    assert.match(m.notes, /Passe PU1/);
  }
});

test('PU-7 « Derrière la version 2 seulement »: StandsCast is reached by a version 2 duel only, on demand; cast=generated and today\'s arena keep the generated spectators', () => {
  const app = read('src/arena/ArenaApp.ts');
  const calls = app.split('\n').filter((l) => l.includes("await import('./StandsCast')"));
  assert.equal(calls.length, 1, 'one dynamic import');
  const at = app.indexOf("await import('./StandsCast')"), guard = app.lastIndexOf('if (', at);
  // (a bout on the empty stands, a challenge or a reprisal in town, lot L2b, EV-5: no stands, and no generated spectators either)
  // a duel under the version 2's rules: the three buttons of before or the duel played by the computer (lot 2, journal Passe LC3: v2Rules)
  assert.match(app.slice(guard, at), /v2Rules\(this\.rules\) && !this\.opts\.forecourt && !this\.opts\.match\?\.empty && this\.opts\.params\.get\('cast'\) !== 'generated'/);
  assert.match(app, /for \(const st of this\.stands \|\| this\.opts\.match\?\.empty \? \[\] : this\.arena\.stands\)/, 'the generated spectators only without the stands, never on the empty stands');
  // no static import of the stands anywhere in src
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
  for (const f of walk(path.join(ROOT, 'src')).filter((f) => /\.ts$/.test(f))) {
    const t = fs.readFileSync(f, 'utf8');
    if (/^import[^;]*['"]\.\/StandsCast['"]/m.test(t)) assert.fail(`${f} imports StandsCast statically`);
    if (/^import[^;]*['"](\.\/|\.\.\/arena\/)stands['"]/m.test(t)) assert.ok(f.endsWith('StandsCast.ts'), `${f} imports stands.ts`);
  }
  // the stands draw no new image: their sheets are the town's approved exports, nothing generated, no lab module left
  assert.ok(!fs.existsSync(path.join(ROOT, 'src/lab/arenaCrowd.ts')), 'the prototype of the sheet is gone');
  assert.match(read('src/arena/StandsCast.ts'), /loadProductionCast\(false, 'approved'/);
});
