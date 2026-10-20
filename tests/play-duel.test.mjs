// The official bout (journal Passe L3): the arena driven by a match sheet. The arena's default (`?scene=arena`) keeps its atlas byte for byte
// and its French words; the play mode seats Vessa or Marek in the opponent's seat with the English words; both bouts of the slice, won and
// lost, played to their end in the arena's full simulation, their result applied through `fight`, the save reloaded on both sides of the
// scene change equal to the continued game.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { load } from './load.mjs';

const F = await load('/src/arena/FighterArt.ts');
const H = await load('/src/arena/ArenaHud.ts');
const { COMBAT_DATA, CombatSim } = await load('/src/arena/CombatSim.ts');
const G = await load('/src/simulation/index.ts');
const { matchSheetFor, sheetData } = await load('/src/combat/match.ts');
const { runBotDuel } = await load('/src/combat/bot.ts');
const { ACTION_NAMES_EN } = await load('/src/narrative/texts.ts');

const sha = (a) => crypto.createHash('sha256').update(Buffer.from(a.buffer, a.byteOffset, a.byteLength)).digest('hex');

test('the arena\'s default atlas is the one of main before the play mode; Vessa\'s changes only the opponent\'s cells', () => {
  // SHA-256 of buildArenaAtlas(1842, 5).atlas.rgba on main d129433 (journal Passe L3)
  const base = F.buildArenaAtlas(1842, 5);
  assert.equal(sha(base.atlas.rgba), 'f7bb50a056243a197b867057084973369b9d3a8b3f76d4b3be5cac797225dc13');
  assert.equal(sha(F.buildArenaAtlas(1842, 5, 'marek').atlas.rgba), sha(base.atlas.rgba));
  const v = F.buildArenaAtlas(1842, 5, 'vessa');
  const names = new Set(['ko', 'recover', 'dodge', 'block', 'hit', 'idle', 'ready', 'victory', ...Object.values(COMBAT_DATA.actions).map((d) => d.anim)]);
  for (const n of names) for (let i = 0; i < v.clips.marek[n].frames.length; i++) assert.ok(v.atlas.frames.get(`marek/side/${n}.${i}/0`), `vessa ${n}.${i}`);
  const cell = (set, key) => { const f = set.atlas.frames.get(key), W = set.atlas.width, H = set.atlas.height, x0 = Math.round(f.u0 * W), y0 = Math.round((1 - f.v1) * H), w = Math.round((f.u1 - f.u0) * W), h = Math.round((f.v1 - f.v0) * H), out = []; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out.push(set.atlas.rgba[((H - 1 - (y0 + y)) * W + x0 + x) * 4 + 3]); return sha(Uint8Array.from(out)); };
  assert.equal(cell(v, 'ren/side/strike.1/0'), cell(base, 'ren/side/strike.1/0'), 'the hero\'s cells are the same');
  assert.notEqual(cell(v, 'marek/side/idle.0/0'), cell(base, 'marek/side/idle.0/0'), 'the opponent\'s cells are Vessa\'s');
  // Vessa wears teal (her top and cape: green and blue well above red), Marek none: counted on the painted texels
  const teal = (set, key) => { const f = set.atlas.frames.get(key), W = set.atlas.width, H = set.atlas.height, x0 = Math.round(f.u0 * W), y0 = Math.round((1 - f.v1) * H), w = Math.round((f.u1 - f.u0) * W), h = Math.round((f.v1 - f.v0) * H); let n = 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const q = ((H - 1 - (y0 + y)) * W + x0 + x) * 4, [r, g, b, a] = set.atlas.rgba.slice(q, q + 4); if (a && g - r >= 30 && b - r >= 30) n++; } return n; };
  assert.ok(teal(v, 'marek/side/idle.0/0') >= 200, `Vessa's teal texels: ${teal(v, 'marek/side/idle.0/0')}`);
  assert.ok(teal(base, 'marek/side/idle.0/0') < 50, 'Marek wears no teal');
});

test('?scene=arena keeps the prototype\'s French words; the play mode\'s table is complete and English', () => {
  const fr = H.TEXTS_FR;
  // the prototype HUD's strings, as written in src/arena/ArenaHud.ts on main d129433
  assert.deepEqual([fr.guard, fr.hold, fr.dodge, fr.ap1, fr.light, fr.apGain, fr.heavy, fr.breaksGuard, ...fr.shorts], ['Garde', 'maintenir', 'Esquive', '1 PA', 'Rapide', '+1 PA', 'Puissante', 'brise la garde', 'Éclair', 'Fente', 'Tourbillon', 'Estocade']);
  assert.deepEqual([fr.title, fr.subtitle, fr.subRen, fr.subMarek, fr.health('Ren'), fr.apLabel, fr.window, fr.restart, fr.pause, fr.resume, fr.rotate], ['Cité du Tournoi', 'Arène des champions', 'le héros', 'le champion', 'Santé de Ren', 'Points d\'action', 'Fenêtre d\'esquive', 'R pour recommencer', 'Pause', 'Espace pour reprendre', 'Tournez l\'appareil : l\'arène se joue en paysage']);
  assert.deepEqual([fr.stunned, fr.stunnedHit, fr.down, fr.guarding, fr.alertHeavy, fr.alertLight, fr.reactNow, fr.dodged, fr.guarded(4), fr.ap(1), fr.guardBroken, fr.stun, fr.victory, fr.defeat, fr.isDown('Marek')], ['Étourdi', 'Étourdi — frappez !', 'À terre', 'En garde', 'Attaque puissante !', 'Attaque !', 'Réagissez maintenant', 'Esquive', '4 garde', '+1 PA', 'Garde brisée', 'Étourdi', 'Victoire', 'Défaite', 'Marek est à terre · R pour recommencer']);
  assert.deepEqual(Object.keys(H.TEXTS_EN).sort(), Object.keys(fr).sort());
  const words = Object.values(H.TEXTS_EN).map((v) => (typeof v === 'function' ? v('X') : Array.isArray(v) ? v.join(' ') : v)).join(' | ');
  for (const w of ['Garde', 'Esquive', 'Étourdi', 'recommencer', 'Fenêtre', 'à terre']) assert.ok(!words.includes(w), `French word left: ${w}`);
  for (const id of Object.keys(COMBAT_DATA.actions)) assert.ok(ACTION_NAMES_EN[id], id);
  assert.equal(COMBAT_DATA.actions.t4.short, 'Estocade', 'the prototype data keep their short names');
});

/** the bout's outcome from the arena's full simulation, the bot at this skill */
function outcome(st, skill) {
  const sh = matchSheetFor(st), d = sheetData(sh, ACTION_NAMES_EN), r = runBotDuel(d, { skill, seed: sh.seed });
  assert.equal(d.actions.t4.name, 'Thrust'); assert.equal(d.actions.t4.short, undefined);
  return { winner: r.winner === 'player' ? 'player' : 'opponent', playerHp: r.playerHp, playerMaxHp: r.playerMaxHp, opponentHp: r.opponentHp, opponentMaxHp: r.opponentMaxHp, finisher: r.finisher };
}
/** a skill and a preparation that give the wanted result in this bout (the duels are deterministic: found by search) */
function find(st, want) {
  for (const skill of [1, 0.8, 0.6, 0.4, 0.2, 0]) for (const inj of [0, 1, 2]) {
    const s = structuredClone(st); s.player.injury = Math.max(s.player.injury, inj);
    const o = outcome(s, skill);
    if (o.winner === want) return { st: s, o };
  }
  throw new Error(`no ${want} found`);
}

test('both bouts of the slice, won and lost, played to the end in the arena simulation and applied to the state', () => {
  for (const want of ['player', 'opponent']) {
    for (const [name, opp] of [['day2-afternoon', 'vessa'], ['day3-afternoon', 'marek']]) {
      const st0 = G.namedState(name, 1842, 'Aster');
      const sh = matchSheetFor(st0);
      assert.equal(sh.sides[1].fighters[0].id, opp);
      const { st, o } = find(st0, want);
      const before = st.tournament.points.player, r = G.advance(st, { type: 'fight', outcome: o });
      assert.ok(r.ok, r.reason);
      const m = r.state.tournament.matches.find((x) => x.day === st.day && x.a === 'player');
      assert.equal(m.winner, want === 'player' ? 'player' : opp);
      assert.equal(r.state.tournament.points.player - before, want === 'player' ? 3 : m.close ? 1 : 0);
      assert.deepEqual([r.state.slot, G.lookOf(r.state)], ['evening', 'afternoon'], 'back from the bout: the end of day');
      const n = G.advance(r.state, { type: 'nightfall' }).state;
      assert.equal(G.lookOf(n), 'night');
    }
  }
});

test('the save, reloaded on both sides of the scene change, equals the continued game', () => {
  const st = G.namedState('day2-afternoon', 7719, 'Aster');
  const o = outcome(st, 0.6);
  const continued = G.advance(st, { type: 'fight', outcome: o }).state;
  // the town saves, the arena page reads, plays, saves; the town page reads again
  const inArena = G.deserialize(G.serialize(st));
  const back = G.deserialize(G.serialize(G.advance(inArena, { type: 'fight', outcome: outcome(inArena, 0.6) }).state));
  assert.equal(G.hash(back), G.hash(continued));
  assert.equal(G.serialize(back), G.serialize(continued));
});

test('the match sheet\'s data keep the opponent\'s numbers and the player\'s preparation, and change nothing else of the prototype', () => {
  const st = G.namedState('day2-afternoon');
  const d = sheetData(matchSheetFor(st));
  assert.equal(d.fighters.marek.name, 'Vessa Lark'); assert.equal(d.fighters.marek.maxHp, 600);
  assert.equal(d.dt, COMBAT_DATA.dt); assert.deepEqual(d.guard, COMBAT_DATA.guard); assert.deepEqual(d.reactions, COMBAT_DATA.reactions);
  const sim = new CombatSim(d); sim.advance(5);
  assert.ok(sim.t > 4.9);
});
