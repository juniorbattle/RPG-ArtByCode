// Lot S3 of the sound (journal Passes SN15 / SN16): the duel's sounds, one for each of the arena's effect recipes, and the arena's crowd; heard on the sheet
// briefs/fiche-son-duel.html, baked and played in the version 2 since S3-SUITE « Cuire et brancher dans la version 2 ce qui est validé ». Here: the bank and the
// recipes one to one, a sound the same bytes each time, the baked files under their manifests, which sound plays for which event (src/audio/sfx.ts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { load } from './load.mjs';

const R = await load('/src/arena/fx/fxRecipes.ts'), S = await load('/src/audio/sfx.ts'), SC = await load('/src/audio/score.ts');
const { CUES, renderCue } = await import('../art-lab/audio/sfx/duel.sfx.mjs');
const { CROWD } = await import('../art-lab/audio/sfx/crowd.sfx.mjs');
const { PLACE_CUES } = await import('../art-lab/audio/sfx/places.sfx.mjs');
const CAT = JSON.parse(fs.readFileSync(new URL('../src/audio/catalogue.json', import.meta.url), 'utf8'));
const MDIR = new URL('../art-lab/audio/manifests/', import.meta.url), MANIFESTS = fs.readdirSync(MDIR).map((f) => JSON.parse(fs.readFileSync(new URL(f, MDIR), 'utf8')));
// the duel's reading, silent until now (the audit, « Lecture du duel : Muet »), a blow missed and an order refused: sounds without an effect recipe
const READING = ['threat', 'window', 'dodge', 'stun', 'pushed', 'whiff', 'denied'];

test('one sound for each effect recipe of the duel, and the reading\'s five; the crowd\'s murmur and its four reactions', () => {
  const recipes = Object.keys(R.RECIPES).sort(), cues = Object.keys(CUES);
  assert.deepEqual(cues.filter((id) => !READING.includes(id)).sort(), recipes, 'every recipe has its sound, no sound without a recipe');
  for (const id of READING) assert.ok(CUES[id], id);
  assert.deepEqual(Object.keys(CROWD).sort(), ['bed', 'cheer', 'gasp', 'oh', 'roar']);
  for (const [id, [family, secs, takes]] of Object.entries(CUES)) { assert.ok(['blow', 'ko', 'ren', 'rival', 'charge', 'read', 'ward', 'boost'].includes(family), id); assert.ok(secs > 0 && secs <= 3 && takes >= 1 && takes <= 3, id); }
});

test('a sound is its writing alone: the same bytes twice, its takes different, its level set, no sample past full scale', () => {
  const a = renderCue('light'), b = renderCue('light');
  assert.equal(a.takes.length, 3);
  for (let k = 0; k < 3; k++) { assert.deepEqual(a.takes[k].L, b.takes[k].L); assert.deepEqual(a.takes[k].R, b.takes[k].R); }
  assert.notDeepEqual(a.takes[0].L, a.takes[1].L, 'two takes, two draws');
  for (const id of ['light', 'window', 'ko']) for (const t of renderCue(id).takes) { let peak = 0; for (const x of [t.L, t.R]) for (const v of x) peak = Math.max(peak, Math.abs(v)); assert.ok(peak > 0.01 && peak < 1, `${id}: peak ${peak}`); }
});

test('the baked bank: every sound and every take in the catalogue, in a manifest of the operator\'s sheet, in both formats', () => {
  const table = CAT.sfx;
  // the duel's bank and the crowd (lot S3), the interface (lot S2, journal Passe SN19)
  assert.deepEqual(Object.keys(table).sort(), [...Object.keys(CUES), ...Object.keys(CROWD).map((c) => `crowd-${c}`), ...Object.keys(PLACE_CUES)].sort());
  const claimed = new Map(); for (const m of MANIFESTS) for (const f of m.files) claimed.set(f.path, m);
  for (const [id, e] of Object.entries(table)) {
    assert.equal(e.files.length, e.frames.length, id); assert.equal(e.files.length, id.startsWith('crowd-') ? 1 : (CUES[id] ?? PLACE_CUES[id])[2], `${id}: its takes`);
    for (const [k, f] of e.files.entries()) for (const x of ['webm', 'm4a']) {
      const m = claimed.get(`src/audio/baked/${f}.${x}`); assert.ok(m, `${f}.${x} under a manifest`);
      assert.equal(m.files.find((g) => g.path.endsWith(`/${f}.${x}`)).frames, e.frames[k]); assert.match(m.approval, e.family === 'interface' ? /S2-SUITE « Cuire et brancher dans la version 2 ce qui est validé »/ : /S3-SUITE « Cuire et brancher dans la version 2 ce qui est validé »/);
    }
  }
  assert.equal(table['crowd-bed'].loop, true); assert.ok(Object.entries(table).every(([id, e]) => id === 'crowd-bed' || !e.loop));
});

test('which sound plays for which event of a duel: the sheet\'s mapping (tools/audio/sfx-jobs.page.js), the effect\'s tiers', () => {
  const ids = (e, tiers = 6) => S.sfxOf(e, tiers).map((c) => c.id);
  const hit = (o) => ({ type: 'impact', result: 'hit', damage: 10, ...o });
  assert.deepEqual(ids(hit({ from: 'ren', to: 'marek', action: 'light', kind: 'light' })), ['light']);
  assert.deepEqual(ids(hit({ from: 'ren', to: 'marek', action: 'heavy', kind: 'heavy' })), ['heavy']);
  assert.deepEqual(ids(hit({ from: 'marek', to: 'ren', action: 'light', kind: 'light' })), ['m_slash'], 'a rival\'s plain blow, whatever its action\'s name');
  assert.deepEqual(ids(hit({ from: 'marek', to: 'ren', action: 'm_heavy', kind: 'heavy' })), ['m_heavy']);
  for (const a of ['t1', 't2', 't3', 't4', 'k_sunder', 'k_feint', 'm_ironfall', 'm_lunge', 'm_shoulder', 'm_riposte', 'm_smite', 'm_wild', 'm_cleave']) assert.deepEqual(ids(hit({ from: a.startsWith('m_') ? 'marek' : 'ren', to: 'x', action: a, kind: 'skill' })), [a]);
  assert.deepEqual(ids(hit({ from: 'marek', to: 'ren', action: 'm_slash', kind: 'light', result: 'dodged' })), ['whiff']);
  assert.deepEqual(ids(hit({ from: 'marek', to: 'ren', action: 'm_slash', kind: 'light', result: 'guarded' })), ['guard']);
  assert.deepEqual(ids(hit({ from: 'marek', to: 'ren', action: 'm_ironfall', kind: 'skill', result: 'guarded' })), ['guardHeavy']);
  assert.deepEqual(ids(hit({ from: 'ren', to: 'marek', action: 'heavy', kind: 'heavy', result: 'guardbreak' })), ['break']);
  assert.deepEqual(ids({ type: 'effect', who: 'marek', action: 'm_resolve', family: 'support' }), ['m_resolve']);
  assert.deepEqual(ids({ type: 'effect', who: 'ren', action: 'unknown', family: 'defensive' }), ['d1']);
  assert.deepEqual(ids({ type: 'effect', who: 'ren', action: 'unknown', family: 'support' }), ['s1']);
  for (const [t, want] of [['break', ['break']], ['stun', ['stun']], ['ko', ['ko']], ['pushed', ['pushed']]]) assert.deepEqual(ids({ type: t, who: 'marek' }), want);
  assert.deepEqual(ids({ type: 'windowOpen', who: 'marek' }), ['window']); assert.deepEqual(ids({ type: 'windowOpen', who: 'ren' }), []);
  assert.deepEqual(ids({ type: 'reactStart', who: 'ren', kind: 'dodge' }), ['dodge']); assert.deepEqual(ids({ type: 'reactStart', who: 'marek' }), []);
  assert.deepEqual(ids({ type: 'sequenceStart', who: 'marek' }), ['threat']); assert.deepEqual(ids({ type: 'sequenceStart', who: 'ren' }), []);
  assert.deepEqual(ids({ type: 'commandDenied', who: 'ren' }), ['denied']); assert.deepEqual(ids({ type: 'commandDenied', who: 'marek' }), []);
  assert.deepEqual(ids({ type: 'chargeRelease', idx: 1, ok: true }), ['release']); assert.deepEqual(ids({ type: 'chargeRelease', idx: 0, ok: true }), []); assert.deepEqual(ids({ type: 'chargeRelease', idx: 2, ok: false }), []);
  assert.deepEqual(ids({ type: 'guardUp', who: 'ren' }), []); assert.deepEqual(ids({ type: 'reactDenied', who: 'ren' }), []);
  // the tiers counted as the effect counts them: src/arena/fx/fxRecipes.ts's own chargeLevel, an oracle outside src/audio
  for (let tiers = 2; tiers <= 9; tiers++) for (let idx = -1; idx <= tiers; idx++) {
    const want = R.chargeLevel(idx, tiers);
    assert.equal(S.chargeLevel(idx, tiers), want, `${idx} of ${tiers}`);
    assert.deepEqual(ids({ type: 'chargeTier', idx, open: true }, tiers), want ? [`charge${want}`] : []);
  }
  assert.deepEqual(ids({ type: 'chargeTier', idx: 3, open: false }), [], 'a tier the AP close stays silent, as its effect');
  for (const id of ['light', 'heavy', 'm_slash', 'm_heavy', 'whiff', 'guard', 'guardHeavy', 'break', 'stun', 'ko', 'pushed', 'window', 'dodge', 'threat', 'denied', 'release', 'charge1', 'charge2', 'charge3', 'hold1', 'hold2', 'hold3', 'd1', 's1']) assert.ok(CAT.sfx[id], id);
});

test('the dips under the blows as today (S3-BAISSE « Garder les baisses »), how each sound varies, the crowd, the charge\'s breath, the sheet\'s levels', () => {
  const duck = (e) => S.sfxOf(e, 6).map((c) => c.duck ?? null);
  assert.deepEqual(duck({ type: 'impact', from: 'ren', to: 'marek', action: 'light', kind: 'light', result: 'hit', damage: 10 }), ['hit']);
  assert.deepEqual(duck({ type: 'impact', from: 'ren', to: 'marek', action: 'light', kind: 'light', result: 'hit', damage: 25 }), ['heavy'], 'the rule before: 20 damage or more is heavy');
  assert.deepEqual(duck({ type: 'impact', from: 'ren', to: 'marek', action: 't1', kind: 'skill', result: 'hit', damage: 10 }), ['heavy']);
  assert.deepEqual(duck({ type: 'impact', from: 'marek', to: 'ren', action: 'm_slash', kind: 'light', result: 'guarded' }), ['guard']);
  assert.deepEqual(duck({ type: 'impact', from: 'marek', to: 'ren', action: 'm_slash', kind: 'light', result: 'dodged' }), [null]);
  assert.deepEqual(duck({ type: 'break', who: 'marek' }), ['break']); assert.deepEqual(duck({ type: 'ko', who: 'marek' }), ['ko']);
  for (const id of ['light', 'heavy', 'm_slash', 'm_heavy', 'guard', 'guardHeavy', 'whiff']) assert.equal(S.varyOf(id), 'pitch', id);
  for (const id of ['threat', 'window', 'dodge', 'stun', 'pushed', 'charge1', 'charge3', 'hold2', 'release', 'denied']) assert.equal(S.varyOf(id), 'none', id);
  for (const id of ['t4', 'm_smite', 'd1', 's1', 'break', 'ko']) assert.equal(S.varyOf(id), 'level', `${id}: tuned on the motif, its pitch kept`);
  const hit = (o) => ({ type: 'impact', result: 'hit', ...o });
  assert.equal(S.crowdOf(hit({ from: 'ren', action: 't4', kind: 'skill' })), 'cheer'); assert.equal(S.crowdOf(hit({ from: 'ren', action: 'heavy', kind: 'heavy' })), 'oh');
  assert.equal(S.crowdOf(hit({ from: 'marek', action: 'm_ironfall', kind: 'skill' })), 'oh'); assert.equal(S.crowdOf(hit({ from: 'ren', action: 'light', kind: 'light' })), null);
  assert.equal(S.crowdOf(hit({ from: 'ren', action: 't4', kind: 'skill', result: 'guarded' })), null); assert.equal(S.crowdOf({ type: 'break' }), 'gasp'); assert.equal(S.crowdOf({ type: 'ko' }), 'roar');
  let h = 0; const step = (e) => (h = S.holdOf(e, 6, h));
  assert.equal(step({ type: 'chargeTier', idx: 0, open: true }), 0, 'the light blow: no breath'); assert.equal(step({ type: 'chargeTier', idx: 1, open: true }), 1);
  assert.equal(step({ type: 'apGain' }), 1); assert.equal(step({ type: 'chargeTier', idx: 5, open: true }), 3); assert.equal(step({ type: 'chargeTier', idx: 5, open: false }), 3);
  assert.equal(step({ type: 'chargeRelease', idx: 5, ok: true }), 0); step({ type: 'chargeTier', idx: 1, open: true }); assert.equal(step({ type: 'stun', who: 'marek' }), 1); assert.equal(step({ type: 'stun', who: 'ren' }), 0);
  assert.equal(S.SFX_TRIM, -10.7); assert.ok(Math.abs(S.CROWD_TRIM - (0.7 - SC.MIX.ambience)) < 1e-9); assert.equal(S.REACT_QUIET, 2.6); assert.equal(S.HOLD_EVERY, 0.6); assert.equal(S.THREAT_QUIET, 1);
});
