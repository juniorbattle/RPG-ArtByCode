// The listening variants of lot S3 (journal Passe SN13, the sheet briefs/fiche-son-couches.html): the fights' music and its layers.
//   node tools/audio/render.mjs <out> --scripts=tools/audio/layer-jobs.mjs --only=probe,L-   then   node tools/audio/layer-clips.mjs <out> <site>
// Each job: the music bus alone, the same window of the same duel of the bot, the loop started where the game would be at the window's start.
import fs from 'node:fs';
import path from 'node:path';
const out = path.resolve(process.argv.slice(2).find((a) => !a.startsWith('--')));
const duels = JSON.parse(fs.readFileSync(path.join(out, 'duels.json'), 'utf8'));
const CAT = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, '../../src/audio/catalogue.json'), 'utf8')).pieces;
const W = 60, SECS = 90;
const maxHpOf = (evs) => { const m = {}; for (const e of evs) if (e.type === 'impact' && m[e.to] === undefined) m[e.to] = e.hp + e.damage; return m; };
const job = (name, piece, foe, o = {}) => {
  const evs = duels[foe].evs, p = CAT[piece], loop = p.frames / 48000, pos = (((W - 0.1 - p.intro.loopAt / 48000) % loop) + loop) % loop;
  return { name, secs: SECS, scene: { place: 'arena', look: 'night', music: { bout: piece, maxHp: maxHpOf(evs) } }, stem: 'music', events: evs, from: W, pre: evs.filter((e) => e.t < W), settle: true, keepKey: `band:${piece}`, keepPos: pos, report: '__report', ...o };
};
export const jobs = [
  // the defect: two moves asked for the same bar line
  { name: 'probe-double', secs: 3.6, stem: 'music', script: 'double' },
  // the duel (Marek, the bot at skill 0.6): today in the game, the engine untouched
  job('L-duel-today', 'duel', 'marek', { script: 'spy' }),
  job('L-duel-today-noduck', 'duel', 'marek', { script: 'noduck' }),
  job('L-duel-all', 'duel', 'marek', { script: 'policy', policy: 'all', noDuck: true }),
  job('L-duel-melody', 'duel', 'marek', { script: 'policy', policy: 'melody', noDuck: true }),
  job('L-duel-calm', 'duel', 'marek', { script: 'policy', policy: 'calm', noDuck: true }),
  job('L-duel-arc', 'duel', 'marek', { script: 'policy', policy: 'arc', noDuck: true }),
  job('L-duel-soft', 'duel', 'marek', { script: 'policy', policy: 'soft', noDuck: true }),
  // the rival (Orla's duel) and the finale (Vessa's), every layer held
  job('L-rival-all', 'rival', 'orla', { script: 'policy', policy: 'all', noDuck: true }),
  job('L-finale-all', 'finale', 'vessa', { script: 'policy', policy: 'all', noDuck: true }),
  job('L-rival-today', 'rival', 'orla', { script: 'noduck' }),
  job('L-finale-today', 'finale', 'vessa', { script: 'noduck' }),
];
