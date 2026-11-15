// The cinematics of the duel « La Brute » (journal Passes CI1 / CI2; the operator's sheet https://claude.ai/artifact/2Ut19phdR8vySTVzAU1a98; since journal Passe SK2 the
// skills' structure's https://claude.ai/artifact/2KKiD7u2rzxtWc6NE9CfVX, SK-5: an ultimate every time it lands in full, outside the cap): the rule against his choices,
// the moments the arena plays against an oracle written from the duel's script and the decided rules alone (never from the replay that src/arena/cine.ts reads), the
// blows a cinematic tells against the replay's own, the beats and the framings against CI-1's note and CI-8, the guide's line.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from './load.mjs';

const C = await load('/src/arena/cine.ts'), V = await load('/src/arena/autoView.ts'), D = await load('/src/arena/cineDirector.ts');
const { AUTO_RULES } = await load('/src/combat/auto.ts');
const RIVALS = ['marek', 'vessa', 'orla', 'cassius', 'ilse', 'rhosk', 'tobin'];
const KITS = [undefined, ['t3', 't4', 'k_sunder', 's1'], ['t1', 't4', 'k_feint', 'k_parry']];
const DUELS = [];
for (const foe of RIVALS) for (const seed of [1337, 1, 2]) for (const kit of KITS) { const d = V.sceneAutoDuel(foe, seed, { loadout: kit }); DUELS.push({ foe, seed, kit, d, F: { ren: d.ren, marek: d.foe } }); }

/** the oracle: every action of a skill from the script alone (its charge, its blows until the striker's next charge), cut by an interruption, a parry or a clash; the
 *  target's break (its line, its stun) and its openings by the duel's rules (an opener's first blow landing, an interruption, a parry, a big action dodged); the tier of
 *  the decided rule */
function oracle({ d, F }) {
  const log = d.result.log, ids = { [F.ren.id]: 'ren', [F.marek.id]: 'marek' }, other = (s) => (s === 'ren' ? 'marek' : 'ren');
  const skill = (seat, id) => F[seat].skills.find((a) => a.id === id), kindOf = (seat, id) => (id === F[seat].light.id ? 'light' : id === F[seat].heavy.id ? 'heavy' : 'skill');
  const st = { ren: { open: 0, stunEnd: -1 }, marek: { open: 0, stunEnd: -1 } }, cur = { ren: null, marek: null }, out = [];
  const close = (seat) => {
    const a = cur[seat]; cur[seat] = null;
    if (!a || !a.blows.length || a.cut || a.blows.some((b) => b.ev !== 'hit')) return;
    const role = skill(seat, a.id)?.role, ko = a.blows[a.blows.length - 1].hp <= 0;
    // an ultimate (an exploit) every time it lands in full (SK-5, journal Passe SK2: in an opening, a break or neither)
    if (role === 'exploit') out.push({ tier: 'ultra', who: seat, action: a.id, t: a.blows[0].t, ko });
    if (role === 'breaker') out.push({ tier: 'super', who: seat, action: a.id, t: a.blows[0].t, ko });
  };
  for (const e of log) {
    const seat = ids[e.who], o = other(seat);
    if (e.ev === 'charge') { close(seat); cur[seat] = { id: e.act, blows: [], cut: false }; continue; }
    if (e.ev === 'break') { st[seat].stunEnd = e.t + (e.dur ?? AUTO_RULES.brk.stun); continue; }
    if (e.ev === 'interrupt' || e.ev === 'parry') { if (cur[o]) cur[o].cut = true; close(o); st[o].open = Math.max(st[o].open, e.t + (e.ev === 'interrupt' ? AUTO_RULES.interrupt.open : AUTO_RULES.parry.open)); continue; }
    if (e.ev === 'clash') { if (cur[seat]) cur[seat].cut = true; close(seat); if (!e.beat) { if (cur[o]) cur[o].cut = true; close(o); } continue; }
    if (e.ev !== 'hit' && e.ev !== 'guarded' && e.ev !== 'dodged') { if (e.ev === 'ward' || e.ev === 'boost') close(seat); continue; }
    const a = cur[seat]; if (!a || a.id !== e.act) continue;
    const first = !a.blows.length, broken = e.t < st[o].stunEnd - 1e-9;
    if (first) { a.inBreak = broken; a.inOpen = !broken && st[o].open > e.t + 1e-9; }
    a.blows.push({ t: e.t, ev: e.ev, hp: e.hp ?? 1 });
    if (first && e.ev !== 'dodged' && skill(seat, e.act)?.role === 'opener') st[o].open = Math.max(st[o].open, e.t + AUTO_RULES.opener);
    if (first && e.ev === 'dodged' && kindOf(seat, e.act) !== 'light' && AUTO_RULES.whiff) st[seat].open = Math.max(st[seat].open, e.t + AUTO_RULES.whiff);
  }
  close('ren'); close('marek');
  return out.sort((x, y) => x.t - y.t);
}

test('the rule is the operator’s: the ultras (exploitations) every time they land in full, outside the cap (SK-5), the supers (breakers) when every blow lands, both fighters, 3 supers a bout at most, 20 s apart, the K.O. always', () => {
  // the Finishing Blow, an ultimate of the role « finish » since journal Passe SK4 (NC-3, NC-9), plays as the exploits
  assert.deepEqual(JSON.parse(JSON.stringify(C.CINE_RULE)), { tiers: [{ tier: 'ultra', roles: ['exploit', 'finisher'], land: 'hit', free: true }, { tier: 'super', roles: ['breaker'], land: 'hit' }], side: 'both', max: 3, gap: 20, ko: true });
  // the comment's lines joined (a quote may run over two of them)
  const cineRule = fs.readFileSync(path.join(ROOT, 'src/arena/cineRule.ts'), 'utf8').replace(/\r?\n\s*\*\s*/g, ' ');
  for (const w of ['« Les ultimes seules (les exploitations) »', '« Et seulement dans une faille ou une rupture »', '« Super : chaque coup touche (Recommended) »', '« Les deux combattants »', '« Au plus 3, 20 s entre deux, le K.O. toujours »', '« si c\'est la competences ultime alors la cinematique doit se jouer en tout temps, des lors que\'elle reussit »', '« Sans plafond pour les ultimes ; les supers 3 au plus, 20 s entre deux »', '« Garder la règle »', '« Sa cinématique se joue à chaque réussite, comme toute ultime (SK-5) »']) assert.ok(cineRule.includes(w), `quoted word for word: ${w}`);
});

test('each moment against the oracle written from the script: the actions that land in full, their tier, their striker, their first blow, on 63 duels', () => {
  const seen = { ultra: 0, super: 0, ren: 0, marek: 0, ko: 0, multi: 0, open: 0, brk: 0 };
  for (const x of DUELS) {
    const got = C.cineCandidates(x.d.result, x.F, { ...C.CINE_RULE, max: undefined, gap: undefined }), want = oracle(x);
    assert.deepEqual(got.map((m) => ({ tier: m.tier, who: m.who, action: m.action, t: m.t, ko: m.ko })), want, `${x.foe} ${x.seed} ${x.kit ?? 'start'}`);
    for (const m of got) { seen[m.tier]++; seen[m.who]++; if (m.ko) seen.ko++; if (m.hits > 1) seen.multi++; if (m.inOpen) seen.open++; if (m.inBreak) seen.brk++; }
  }
  for (const [k, n] of Object.entries(seen)) assert.ok(n > 0, `${k} reached (${JSON.stringify(seen)})`);
});

test('a skill tried and failed never plays one: a guarded, dodged, parried, interrupted or clashed action; an exploitation landing in full plays, in an opening or a break or not (SK-5)', () => {
  let failed = 0, outside = 0;
  for (const x of DUELS) {
    const ms = C.cineCandidates(x.d.result, x.F, { ...C.CINE_RULE, max: undefined, gap: undefined }), all = C.cineCandidates(x.d.result, x.F, { tiers: [{ tier: 'ultra', roles: ['exploit', 'breaker'], land: 'hit' }], side: 'both' });
    const evs = C.replayEvents(x.d.result, x.F);
    for (const e of evs) if (e.type === 'impact' && !e.follow && e.result !== 'hit' && ms.some((m) => m.who === e.from && m.t === e.t)) failed++;
    // every exploitation landing in full is a candidate, outside an opening too
    assert.deepEqual(ms.filter((m) => m.tier === 'ultra').map((m) => m.t), all.filter((m) => m.role === 'exploit').map((m) => m.t), `${x.foe} ${x.seed}`);
    outside += ms.filter((m) => m.tier === 'ultra' && !m.inBreak && !m.inOpen && !m.ko).length;
  }
  assert.equal(failed, 0);
  assert.ok(outside > 0, 'exploitations landing in full outside an opening exist, and play theirs');
});

test('the pick: every ultimate (SK-5); the supers 3 a bout at most, 20 s after any cinematic; the K.O. always', () => {
  const m = (t, ko = false, tier = 'super') => ({ tier, who: 'ren', to: 'marek', action: tier === 'ultra' ? 't4' : 't3', role: tier === 'ultra' ? 'exploit' : 'breaker', t, end: t, hits: 1, damage: 1, inBreak: false, inOpen: false, ko, blows: [] });
  assert.deepEqual(C.cinePick([m(10), m(25), m(31), m(60), m(90), m(120)], C.CINE_RULE).map((x) => x.t), [10, 31, 60]);
  assert.deepEqual(C.cinePick([m(10), m(31), m(60), m(90), m(95, true)], C.CINE_RULE).map((x) => x.t), [10, 31, 60, 95]);
  // the ultimates outside the cap: each plays, and counts for the supers\' 20 s, not for their 3
  const u = (t) => m(t, false, 'ultra');
  assert.deepEqual(C.cinePick([u(5), u(12), m(20), m(30), u(40), m(55), m(80), m(110), u(111)], C.CINE_RULE).map((x) => x.t), [5, 12, 40, 80, 110, 111]);
  for (const x of DUELS) {
    const ms = C.cineMoments(x.d.result, x.F), sup = ms.filter((y) => !y.ko && y.tier === 'super');
    assert.ok(sup.length <= 3);
    for (const s of sup) { const prev = ms.filter((y) => y.t < s.t).pop(); assert.ok(!prev || s.t - prev.t >= 20, `${x.foe} ${x.seed}: a super ${s.t} after ${prev?.t}`); }
    assert.deepEqual(ms.filter((y) => y.tier === 'ultra').map((y) => y.t), C.cineCandidates(x.d.result, x.F, C.CINE_RULE).filter((y) => y.tier === 'ultra').map((y) => y.t), 'every ultimate plays');
  }
});

test('the arena’s own page: Ren’s Thrust in Marek’s break and outside an opening (ultras, SK-5), Rhosk’s Northern cleave (super), the Thrust that ends the bout against Ilse', () => {
  const one = (foe, seed, kit) => { const d = V.sceneAutoDuel(foe, seed, { loadout: kit }); return C.cineMoments(d.result, { ren: d.ren, marek: d.foe }).map((m) => `${m.t.toFixed(2)} ${m.tier} ${m.who} ${m.action}×${m.hits}${m.inBreak ? ' break' : m.inOpen ? ' open' : ''}${m.ko ? ' ko' : ''}`); };
  assert.deepEqual(one('marek', 1337), ['62.35 ultra ren t4×1 break', '106.46 ultra ren t4×1']);
  assert.deepEqual(one('rhosk', 1337), ['15.21 super marek m_cleave×1', '96.39 ultra ren t4×1 break']);
  assert.deepEqual(one('ilse', 2), ['81.14 ultra ren t4×1 break', '118.24 ultra ren t4×1 ko']);
  assert.deepEqual(one('rhosk', 1337, ['t3', 't4', 'k_sunder', 's1']), ['6.07 super ren t3×3', '32.83 super marek m_cleave×1', '106.82 ultra ren t4×1 break']);
  // a rival's signature in Ren's four (journal Passe SK2): Marek's Iron Fall in his break, Ren's ultimate
  assert.deepEqual(one('marek', 1337, ['t1', 'm_ironfall', 'd1', 's1']).slice(0, 1), ['60.18 ultra ren m_ironfall×1 break']);
});

test('what a cinematic tells is the duel’s own: its blows, their damage and health against the replay’s impacts of that action, its total the arena’s number', () => {
  for (const x of DUELS) {
    const evs = C.replayEvents(x.d.result, x.F);
    for (const m of C.cineMoments(x.d.result, x.F)) {
      const imp = evs.filter((e) => e.type === 'impact' && e.from === m.who && e.action === m.action && e.t >= m.t - 1e-9 && e.t <= m.end + 1e-9);
      assert.deepEqual(m.blows, imp.map((e) => ({ t: e.t, damage: e.damage, hp: e.hp })), `${x.foe} ${m.t}`);
      assert.equal(m.damage, imp[imp.length - 1].total);
    }
  }
});

test('the beats: an ultra 3.5 s watched, a super 2.2 s; one white frame an ultra, none for a super or under the reduced motion; the calm ultra without a dash', () => {
  const w = (k) => +D.cineWall(D.CINE_BEATS[k]).toFixed(2);
  assert.equal(w('ultra'), 3.46); assert.equal(w('super'), 2.2); assert.equal(w('ultraCalm'), 2.55); assert.equal(w('superCalm'), 1.72);
  assert.ok(D.WHITE_FRAME <= 1 / 3 / 3, 'one flash, under three a second');
  assert.equal(D.CINE_BEATS.ultraCalm.dash, 0); assert.equal(D.CINE_BEATS.ultraCalm.stop, 0); assert.equal(D.CINE_BEATS.superCalm.stop, 0);
  assert.equal(D.CINE_BEATS.ultra.lift > 0 && D.CINE_BEATS.super.lift === 0, true, 'only an ultra lifts a black');
  assert.deepEqual(D.beatsOf('ultra', true), D.CINE_BEATS.ultraCalm); assert.deepEqual(D.beatsOf('super', false), D.CINE_BEATS.super);
});

test('CI-1’s note: an ultra sees both fighters whole, the zoom slight; a super eases the arena’s framing in a little', () => {
  const S = D.STAGE, W = D.ULTRA_VIEW, half = (dist) => dist * Math.tan((W.fov / 2) * Math.PI / 180) * (16 / 9);
  // the stage from the striker's mark to the one struck thrown, a fighter's half-width on each side, inside the frame at every distance the cinematic takes
  const span = S.from + S.to + S.throw + 2 * 1.1;
  for (const dist of [W.dist, W.gatherDist, W.blowDist - 0.6]) assert.ok(2 * half(dist) >= span, `${dist} m sees ${(2 * half(dist)).toFixed(1)} m against ${span.toFixed(1)}`);
  assert.ok(W.gatherDist / W.dist >= 0.85 && (W.blowDist - 0.6) / W.dist >= 0.8, 'a slight zoom only');
  assert.ok(D.SUPER_PUSH.dist / 15.6 <= 0.15, 'a super eases in by 15 % at most');
});

test('the guide says the cinematics with the rule’s numbers, in English and in French; the guide loads the rule alone, not the replay', async () => {
  const T = await load('/src/narrative/text/index.ts'), { FR } = await load('/src/narrative/text/fr.ts');
  const slots = { cool: 5, lo: 1, hi: 3, times: 2, glo: 30, ghi: 70, stun: 10, dmg: 1.4, form: 15, open: 25, opener: 4, cut: 6, parry: 6, whiff: 2.5, w: 0.3, cmax: C.CINE_RULE.max, cgap: C.CINE_RULE.gap };
  assert.match(T.tx('tut.ch.duel.body', slots), /An ultimate that lands in full plays its cinematic in the black, a super its own in the arena; 3 supers a bout at most, 20 seconds apart\. \[L\] cuts one, \[J\] plays it twice as fast/s);
  T.useLanguage('fr', FR);
  try { assert.match(T.tx('tut.ch.duel.body', slots), /Une ultime qui touche pleinement joue sa cinématique dans le noir, une super la sienne dans l’arène ; au plus 3 supers par combat, 20 secondes entre deux\. \[L\] en coupe une, \[J\] la joue deux fois plus vite/s); } finally { T.useLanguage('en'); }
  const tut = fs.readFileSync(path.join(ROOT, 'src/ui/tutorial.ts'), 'utf8');
  assert.match(tut, /from '\.\.\/arena\/cineRule'/); assert.doesNotMatch(tut, /from '\.\.\/arena\/(cine|autoView)'/);
  assert.doesNotMatch(fs.readFileSync(path.join(ROOT, 'src/arena/cineRule.ts'), 'utf8'), /^import /m, 'data alone');
});

test('the arena plays them in every duel played by the computer on its sheets (CI-9), the DEV parameters compiled out, the duel’s result its own', () => {
  const a = fs.readFileSync(path.join(ROOT, 'src/arena/ArenaApp.ts'), 'utf8');
  assert.match(a, /const cq = import\.meta\.env\.DEV \? this\.opts\.params\.get\('cine'\) : null;/);
  assert.match(a, /if \(this\.auto && this\.sheets && this\.combatFx && cq !== 'off'\)/);
  // the K.O. told by the arena once the cinematic gives it back, from the duel's own result (onOver reads `this.auto.result`)
  assert.match(a, /if \(r\) m\.onOver\(\{ winner: this\.auto!\.winner, hp: \{ ren: r\.hp\[0\], marek: r\.hp\[1\] \}/);
  assert.match(a, /this\.cineRun = new this\.cineMod\.CineRun\(m, host, this\.reducedMotion \|\| this\.cineCalm, this\.cineBack!\);/, 'the reduced motion is the game’s own setting');
});
