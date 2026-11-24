// The strength of the player's sabotage measured before it is fixed (the operator's SB-3 « Le laboratoire mesure et te montre le chiffre avant de le fixer », journal Passes
// CL2 / SB1 / SB2 / SB3, briefs/combat-auto.md § 44). Node only, nothing in src/ reads this file: the strap cut on the eve of a bracket bout (SB-1) is modelled by what the duel
// already has, `AutoFighter.taken` (the damage a fighter takes ×), before the game has the action itself.
//   node tools/auto-sabotage.mjs duel [--seeds=1..150] [--ks=0,0.05,0.1,0.15,0.2,0.3,0.4] [--by-rival]
//       isolated duels (tools/auto-lab.mjs `duelsOf`'s reference Ren of day 6 against the seven rivals at the bracket, of day 10 at the final): the player's chance with the
//       rival's strap cut at ×(1 + k), against what a training point or a piece of gear gives (the unit of comparison: a win point), and against the rival's grudge
//       (its preparation + 15, SA-5), and the duels' length
//   node tools/auto-sabotage.mjs games [--policies=planner,reference,curious] [--seeds=101..300] [--ks=0.1,0.15,0.2,0.3] [--eves=5,7,9] [--p=1] [--seen=1]
//       whole games of the TournamentLab (the default game): the player's every bracket bout whose eve is in `--eves` (the bout of day 6, 8, 10) has its rival's strap cut at
//       ×(1 + k) with the chance `--p` (a number, or a list « 5:0.9,7:0.7,9:0.5 » by eve); a cut that fails is a sabotage seen: nothing cut, the rival's preparation + 15 (SA-5,
//       `--grudge`, on by default) and half the bout's purse (SA-4, `--seen`, on by default). Control row: k = 0. The titles, the stages won, the length
//       `--costs=1` also spends what the sabotage costs (SA-1): on each eve the slot-costing action the policy chose at the morning of the eve, the evening before and the evening of the
//       eve is replaced by a wait, `--tool=8` coins at the evening before (× the stage's price), `--acc=0` coins for an accomplice at the evening of the eve
//   a second gesture, the blunted blade (the operator's idea of 24/11/2026: « le sabotage peut aussi passer par l'arme afin de la rendre emousse et donc infliger moins de degats »): in `games`
//       `--bladepct=15,20,25` the rival's Attack lowered by that share, `--blades=1,2,3` by that many points (their blows weigh 2·Att/(Att+Def)) instead of the strap, `--dull=1` also taking the state their weapon carries off (a rival's
//       `gfx.inflict`: Vessa's bleeding, Tobin's blinding, Cassius's poison, Marek's burn); in `duel` the rows « lame émoussée » and the two gestures together; the same chance, costs, grudge and half purse
//   every command: --seeds=a..b or a,b,c (default 101..300, the held-out seeds of the race's fit)
process.argv.splice(2, 0, 'lib');
const AL = await import('./auto-lab.mjs');
const { range, med, pct, server: LS } = AL;
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';

const ROOT = path.resolve(import.meta.dirname, '..');
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const flag = (k, d) => (arg(k, d ? '1' : '0') !== '0');
const command = process.argv.find((x, i) => i > 2 && !x.startsWith('--') && x !== 'lib');
const seeds = range(arg('seeds', command === 'duel' ? '1..150' : '101..300'));
const out = {};

// ------------------------------------------------------------------------------------------------------------------------------- isolated duels
const AU = AL.AU, AD = AL.AD, GE = await LS.ssrLoadModule('/src/simulation/gear.ts'), ST = AL.ST;
const RIVALS = Object.keys(ST.RIVAL_SHEETS);

/** the reference Ren of a day of REF, a rival at its stage, one variant: the strap (`taken` of the rival), a stat of Ren's, the rival's preparation */
function duels(day, v) {
  const R = AL.REF[day], stage = day >= 10 ? 2 : day >= 6 ? 1 : 0, round = stage === 0 ? AD.autoRound(day) : 0;
  const loadout = ['t1', 't4', 'd1', 's1'], lv = Object.fromEntries([...loadout, 'heavy'].map((id) => [id, id === 't1' ? R.t1 : id === 't4' ? R.t4 : 1]));
  const rows = [];
  for (const id of RIVALS) {
    const o = { id, w: 0, n: 0, t: [] };
    for (const s of seeds) {
      const me = { ...R }; for (const [k, d] of Object.entries(v.ren ?? {})) me[k] = +(me[k] + d).toFixed(2);
      const A = AD.autoRen(me, { loadout, levels: lv }, { weapon: R.weapon, gear: [R.weapon], pieceViv: GE.GEAR[R.weapon]?.fx?.viv ?? 0 });
      const B = AD.autoFoe(id, AD.autoRaceSheet(id, stage, round, { preparation: R.prep + (v.prep ?? 0) }), { stage });
      if (v.taken) B.taken = (B.taken ?? 1) * v.taken;
      if (v.foeAtk) B.atk = Math.max(1, B.atk + v.foeAtk);
      if (v.foeAtkMul) B.atk = Math.max(1, B.atk * v.foeAtkMul);
      if (v.dull && B.gfx?.inflict) B.gfx = { ...B.gfx, inflict: undefined };
      const r = AU.autoDuel(A, B, 7000 + s * 131 + stage * 7 + round);
      o.n++; if (AU.autoWinner(r) === 0) o.w++; o.t.push(r.t);
    }
    rows.push(o);
  }
  return rows;
}
const mean = (rows) => rows.reduce((n, r) => n + r.w / r.n, 0) / rows.length;
const dur = (rows) => med(rows.flatMap((r) => r.t));

if (command === 'duel') {
  const ks = arg('ks', '0,0.05,0.1,0.15,0.2,0.3,0.4').split(',').map(Number);
  for (const day of [6, 10]) {
    const stage = day >= 10 ? 'la finale (jour 10, étape 2)' : 'le tableau (jour 6, étape 1)';
    console.log(`\nRen de la référence du jour ${day} contre les sept rivaux, ${stage}, ${seeds.length} duels chacun`);
    const base = mean(duels(day, {}));
    const row = (label, v) => {
      const rows = duels(day, v), m = mean(rows);
      console.log(`  ${label.padEnd(34)} gagnés ${(100 * m).toFixed(1).padStart(5)} %  (${m >= base ? '+' : ''}${(100 * (m - base)).toFixed(1)} points)  durée méd. ${dur(rows).toFixed(0)} s`
        + (flag('by-rival') ? `\n      ${rows.map((r) => `${r.id} ${pct(r.w, r.n)}`).join('  ')}` : ''));
      (out[day] ??= {})[label] = { win: m, t: dur(rows), by: Object.fromEntries(rows.map((r) => [r.id, r.w / r.n])) };
    };
    row('témoin', {});
    for (const k of ks.filter((x) => x > 0)) row(`sangle coupée : dégâts reçus ×${(1 + k).toFixed(2)}`, { taken: 1 + k });
    for (const n of [1, 2, 3, 4]) row(`Ren +${n} Attaque`, { ren: { atk: n } });
    for (const n of [1, 2, 4]) row(`Ren +${n} Défense`, { ren: { def: n } });
    for (const n of [20, 40, 80]) row(`Ren +${n} PV`, { ren: { hp: n } });
    for (const n of [15, 30]) row(`rancune : préparation du rival +${n}`, { prep: n });
    for (const n of [1, 2, 3, 4]) row(`rancune : le rival +${n} Attaque`, { foeAtk: n });
    for (const n of [1, 2, 3, 4]) row(`lame émoussée : le rival −${n} Attaque`, { foeAtk: -n });
    for (const n of [1, 2, 3, 4]) row(`lame émoussée −${n} et son état retiré`, { foeAtk: -n, dull: true });
    for (const p of [10, 15, 20, 25]) row(`lame émoussée : l'Attaque du rival −${p} %`, { foeAtkMul: 1 - p / 100 });
    for (const p of [10, 15, 20]) row(`lame −${p} % et son état retiré`, { foeAtkMul: 1 - p / 100, dull: true });
    row('sangle ×1,15 et lame −2 (les deux)', { taken: 1.15, foeAtk: -2 });
  }
}

// ------------------------------------------------------------------------------------------------------------------------------- whole games
/** a second server, for the games only: two laboratory hooks inserted at load (the game's source is untouched): the player's bout of a bracket day, once its two fighters are built
 *  (`__sab`), and what the bout pays (`__sabHalf`); both read `globalThis.__sabCfg` and are inert without it */
const GS = command === 'games' ? await createServer({
  root: ROOT, configFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-test', server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true },
  plugins: [{
    name: 'sabotage-lab', enforce: 'pre',
    transform(code, id) {
      const f = id.split('?')[0].replace(/\\/g, '/');
      if (f.endsWith('/src/combat/autoMatch.ts')) {
        const a = '    return { ren, foe, prep: npc || g || !c ? 0 : autoPrepPoints(c.preparation + grudge) };';
        if (!code.includes(a)) throw new Error('sabotage-lab: autoMatch.ts moved');
        return code.replace(a, `    globalThis.__sab?.(st, o.id, stage, round, foe, o2);\n${a}`);
      }
      if (f.endsWith('/src/tournament/pool.ts')) {
        const a = '  return halved ? Math.floor((won ? p[0] : p[1]) / 2) : won ? p[0] : p[1];';
        if (!code.includes(a)) throw new Error('sabotage-lab: pool.ts moved');
        return code.replace(a, '  { const v = halved ? Math.floor((won ? p[0] : p[1]) / 2) : won ? p[0] : p[1]; return globalThis.__sabHalf?.(s, m) ? Math.floor(v / 2) : v; }');
      }
      return null;
    },
  }],
}) : null;

if (command === 'games') {
  const LAB = await GS.ssrLoadModule('/src/tournament/lab.ts'), AD2 = await GS.ssrLoadModule('/src/combat/autoData.ts'), POOL = await GS.ssrLoadModule('/src/tournament/pool.ts');
  const ks = arg('ks', '0.1,0.15,0.2,0.3').split(',').map(Number), eves = arg('eves', '5,7,9').split(',').map(Number);
  const pSpec = arg('p', '1'), pBy = {};
  for (const e of [5, 7, 9]) pBy[e] = pSpec.includes(':') ? +(pSpec.split(',').map((x) => x.split(':')).find(([d]) => +d === e)?.[1] ?? 0) : +pSpec;
  const lockSpec = arg('locked', ''), lockBy = {};
  for (const part of lockSpec.split(',').filter(Boolean)) { const [e, who] = part.split(':'); lockBy[+e] = who === '*' ? '*' : who.split('+'); }
  const lockedAt = (eve, opp) => !!lockBy[eve] && (lockBy[eve] === '*' || lockBy[eve].includes(opp));
  const blades = arg('blades', '').split(',').filter(Boolean).map(Number), bladePct = arg('bladepct', '').split(',').filter(Boolean).map(Number), dull = flag('dull', false);
  const useSeen = flag('seen', true), grudge = flag('grudge', true), GRUDGE_PREP = +arg('prep', '15'), costs = flag('costs', false), TOOL = +arg('tool', '8'), ACC = +arg('acc', '0');
  const hash01 = (seed, day) => { let h = (seed ^ 0x9e3779b9) >>> 0; h = Math.imul(h ^ (day * 0x85ebca6b), 0xc2b2ae35) >>> 0; h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d) >>> 0; h ^= h >>> 12; return (h >>> 0) / 4294967296; };
  const eveOf = (day) => day - 1;
  const bracketMatch = (st) => st.tournament.matches.find((x) => x.day === st.day && !x.winner && x.stage && (x.a === 'player' || x.b === 'player'));
  const oppOf = (m) => (m.a === 'player' ? m.b : m.a);
  const cuts = (st, cfg) => { const m = bracketMatch(st); return !!m && cfg.eves.includes(eveOf(st.day)) && !lockedAt(eveOf(st.day), oppOf(m)) && hash01(st.seed, st.day) < cfg.pBy[eveOf(st.day)]; };
  const seen = (st, cfg) => { const m = bracketMatch(st); return !!m && cfg.eves.includes(eveOf(st.day)) && !lockedAt(eveOf(st.day), oppOf(m)) && hash01(st.seed, st.day) >= cfg.pBy[eveOf(st.day)]; };
  const ADV = await GS.ssrLoadModule('/src/simulation/advance.ts');
  /** the three slots of SA-1 on the eve E of a bracket bout (day E + 1): the morning of day E (the casing), the evening before (the tool, on the quay), the evening of day E (the night) */
  const sabSlot = (st, cfg) => {
    for (const E of cfg.eves) {
      const has = E === 5 || st.tournament.matches.some((m) => m.day === E + 1 && m.stage && (m.a === 'player' || m.b === 'player'));
      if (!has) continue;
      if (st.day === E && st.slot === 'morning') return { E, kind: 'case' };
      if (st.day === E && st.slot === 'evening') { const m = st.tournament.matches.find((x) => x.day === E + 1 && x.stage && (x.a === 'player' || x.b === 'player')); if (m && lockedAt(E, oppOf(m))) return null; return { E, kind: 'act' }; }
      if (st.day === E - 1 && st.slot === 'evening') return { E, kind: 'equip' };
    }
    return null;
  };
  /** the shops' stage price (EQ-7) on what is bought the evening before / on the eve */
  const price = (day) => (day >= 9 ? 1.3 : day >= 6 ? 1.15 : 1);
  const withCosts = (P, cfg) => (!cfg.costs ? P : { name: P.name, skill: P.skill, choose: (st) => {
    const a = P.choose(st), s = sabSlot(st, cfg);
    if (!s || a.type === 'fight') return a;
    const o = ADV.actions(st).find((x) => JSON.stringify(x.action) === JSON.stringify(a));
    if (!o || o.cost <= 0) return a;
    if (s.kind === 'equip') st.player.coins = Math.max(0, st.player.coins - Math.round(cfg.tool * price(st.day)));
    if (s.kind === 'act') st.player.coins = Math.max(0, st.player.coins - Math.round(cfg.acc * price(st.day)));
    return { type: 'wait' };
  } });
  const run = (pn, cfg) => {
    const P = withCosts(LAB.POLICIES[pn], cfg), R = { pn, n: 0, skipped: 0, crowns: 0, finals: 0, cut: 0, stageWins: {}, dur: { 1: [], 2: [] }, coins: [], tried: 0, cutOk: 0, seenN: 0 };
    globalThis.__sabCfg = cfg.k > 0 || cfg.blade > 0 || cfg.bladeMul < 1 ? cfg : undefined;
    globalThis.__sab = (st, foeId, stage, round, foe, o2) => {
      if (!globalThis.__sabCfg || !o2?.hand) return;
      const m = bracketMatch(st); if (!m || (m.a === 'player' ? m.b : m.a) !== foeId) return;
      if (cuts(st, cfg)) {
        if (cfg.k > 0) foe.taken = (foe.taken ?? 1) * (1 + cfg.k);
        if (cfg.blade > 0) foe.atk = Math.max(1, foe.atk - cfg.blade);
        if (cfg.bladeMul < 1) foe.atk = Math.max(1, foe.atk * cfg.bladeMul);
        if (cfg.dull && foe.gfx?.inflict) foe.gfx = { ...foe.gfx, inflict: undefined };
      }
      else if (seen(st, cfg) && cfg.grudge) {
        const c = st.competitors[foeId];
        Object.assign(foe, AD2.autoFoe(foeId, AD2.autoRaceSheet(foeId, stage, round, { preparation: (c?.preparation ?? 0) + cfg.prep, hp: POOL.rivalMods(c).hp }), { stage, plan: c?.plan }));
      }
    };
    globalThis.__sabHalf = (s, m) => !!globalThis.__sabCfg && cfg.half && !!m.stage && (m.a === 'player' || m.b === 'player') && s.day === m.day && seen(s, cfg);
    try {
      for (const seed of seeds) {
        let st;
        try { st = LAB.autoplay(seed, P, 'Ren', 320, 'auto').state; } catch (e) { if (!/refused action|did not finish/.test(String(e))) throw e; R.skipped++; continue; }
        R.n++;
        const mine = st.tournament.matches.filter((m) => m.a === 'player' || m.b === 'player');
        if (st.flags.champion === 'player') R.crowns++;
        if (mine.some((m) => m.stage === 'final')) R.finals++;
        if (mine.some((m) => m.stage === 'semi')) R.cut++;
        for (const m of mine) { const k = m.stage ?? `pool-j${m.day}`; (R.stageWins[k] ??= { w: 0, n: 0 }).n++; if (m.winner === 'player') R.stageWins[k].w++; }
        for (const n of st.v2?.$notes ?? []) if (n.kind === 'bout' && n.day >= 6) R.dur[n.day <= 9 ? 1 : 2].push(n.t);
        R.coins.push(st.player.coins);
      }
    } finally { globalThis.__sabCfg = undefined; globalThis.__sab = undefined; globalThis.__sabHalf = undefined; }
    return R;
  };
  const sw = (R, keys) => { let w = 0, n = 0; for (const k of keys) { const v = R.stageWins[k]; if (v) { w += v.w; n += v.n; } } return n ? Math.round((100 * w) / n) : NaN; };
  const line = (label, R) => `${label.padEnd(38)} titres ${String(pct(R.crowns, R.n)).padStart(3)} %  finale ${String(pct(R.finals, R.n)).padStart(3)} %  demi ${String(pct(R.cut, R.n)).padStart(3)} %  `
    + `demi gagnée ${String(sw(R, ['semi'])).padStart(3)} %  3e place ${String(sw(R, ['third'])).padStart(3)} %  Porte ${String(sw(R, ['gate'])).padStart(3)} %  finale gagnée ${String(sw(R, ['final'])).padStart(3)} %  `
    + `durée tableau ${R.dur[1].length ? med(R.dur[1]).toFixed(0) : '-'} s, finale ${R.dur[2].length ? med(R.dur[2]).toFixed(0) : '-'} s  pièces fin ${med(R.coins)}`;
  for (const pn of arg('policies', 'planner,reference,curious').split(',')) {
    console.log(`\n${pn} : ${seeds.length} parties tenues à part${useSeen ? '' : ', sans la peine'}${grudge ? '' : ', sans la rancune'}`);
    (out[pn] ??= {});
    if (flag('control', true)) {
      const t0 = performance.now(), C = run(pn, { k: 0, eves, pBy, half: false, grudge: false, prep: 0, costs: false, tool: 0, acc: 0 });
      console.log(`  ${line('témoin (aucune sangle)', C)}  (${((performance.now() - t0) / 1000).toFixed(0)} s)`); out[pn].control = C;
    }
    for (const n of blades) {
      const R = run(pn, { k: 0, blade: n, dull, eves, pBy, half: useSeen, grudge, prep: GRUDGE_PREP, costs, tool: TOOL, acc: ACC });
      const lab = `lame émoussée −${n} Attaque${dull ? ' + état retiré' : ''}, veilles ${eves.join('+')}, réussite ${pSpec}${lockSpec ? `, gardés ${lockSpec}` : ''}${costs ? `, 3 créneaux + ${TOOL}${ACC ? ` + ${ACC}` : ''} p.` : ''}`;
      console.log(`  ${line(lab, R)}`); out[pn][lab] = R;
    }
    for (const p of bladePct) {
      const R = run(pn, { k: 0, blade: 0, bladeMul: 1 - p / 100, dull, eves, pBy, half: useSeen, grudge, prep: GRUDGE_PREP, costs, tool: TOOL, acc: ACC });
      const lab = `lame émoussée : Attaque du rival −${p} %${dull ? ' + état retiré' : ''}, veilles ${eves.join('+')}, réussite ${pSpec}${costs ? `, 3 créneaux + ${TOOL}${ACC ? ` + ${ACC}` : ''} p.` : ''}`;
      console.log(`  ${line(lab, R)}`); out[pn][lab] = R;
    }
    for (const k of blades.length || bladePct.length ? [] : ks) {
      const R = run(pn, { k, eves, pBy, half: useSeen, grudge, prep: GRUDGE_PREP, costs, tool: TOOL, acc: ACC });
      const lab = `sangle ×${(1 + k).toFixed(2)}, veilles ${eves.join('+')}, réussite ${pSpec}${lockSpec ? `, gardés ${lockSpec}` : ''}${costs ? `, 3 créneaux + ${TOOL}${ACC ? ` + ${ACC}` : ''} p.` : ''}`;
      console.log(`  ${line(lab, R)}`); out[pn][lab] = R;
    }
  }
  await GS.close();
}

if (arg('json')) fs.writeFileSync(arg('json'), JSON.stringify(out, null, 1));
await LS.close();
