// The renders of lot S5 (journal Passe SN21): the whole sound as a game plays it, page after page. Each page is one job of tools/audio/render.mjs; a page
// leaves as the game leaves it (`leave()`: its fade, the music's place kept for the tab) and the next job takes the tab's record up (`carry`), so the music
// resumes across pages where the engine would resume it. tools/audio/mix-listen.mjs joins the pages with the load between them and measures the whole.
//   node tools/audio/render.mjs <out> --scripts=tools/audio/mix-jobs.mjs --only=J-,D-,S-
// The duels are the bot's whole duels of render.mjs (duels.json in <out>): Vessa's won at midday under the duel's piece, Orla's won under the rival's, Marek's
// lost under the finale's. Nothing here is the game's code.
import fs from 'node:fs';
import path from 'node:path';

const out = path.resolve(process.argv.slice(2).find((a) => !a.startsWith('--')));
const duels = JSON.parse(fs.readFileSync(path.join(out, 'duels.json'), 'utf8'));
const maxHpOf = (evs) => { const m = {}; for (const e of evs) if (e.type === 'impact' && m[e.to] === undefined) m[e.to] = e.hp + e.damage; return m; };
/** a walk: a step every 0.27 s (the hero at 3.73 m/s, a step a metre: src/audio/hooks.ts) from `a` to `b` seconds */
const walk = (a, b) => { const l = []; for (let t = a; t < b; t += 0.27) l.push({ t: +t.toFixed(2), play: 'step' }); return l; };
/** a page of a place: its scene, what the player does on it, and its way out at `leave` (the job runs on past it for the fade) */
const page = (name, place, look, leave, o = {}) => ({
  name, secs: leave + 0.6, scene: { place, look, ...(o.bout ? { bout: true } : {}), ...(o.music ? { music: o.music } : {}) }, script: 'mix', settle: true, carry: !o.first,
  rseed: o.rseed ?? 11, events2: [...(o.events ?? []), { t: leave, leave: true }], report: '__mixReport',
});
/** a duel page: the bot's duel from `lead` seconds after the page opens, the K.O. and its jingle, then the way out */
const duelPage = (name, foe, look, piece, o = {}) => {
  const d = duels[foe], lead = o.lead ?? 2, end = d.res.t + lead + (o.after ?? 14);
  return { name, secs: end + 0.6, scene: { place: 'arena', look, music: { bout: piece, maxHp: maxHpOf(d.evs) } }, script: 'mix', settle: true, carry: !o.first, rseed: 21,
    events: d.evs.map((e) => ({ ...e, t: e.t + lead })), events2: [{ t: end, leave: true }], report: '__mixReport' };
};

export const jobs = [
  // ---- a morning: a new game's first page in town (the title's piece), a walk, the interface; the forecourt and the registrar's fanfare; the lists; the town again
  page('J1-1-district', 'district', 'morning', 46, { first: true, music: { opening: true }, events: [...walk(6, 18), { t: 21, play: 'open' }, { t: 23, play: 'click' }, { t: 25, play: 'click' }, { t: 28, play: 'coin' }, { t: 31, play: 'click' }, ...walk(34, 45)] }),
  page('J1-2-forecourt', 'forecourt', 'morning', 40, { events: [{ t: 4, sting: 'fanfare' }, ...walk(22, 30), { t: 33, play: 'click' }, ...walk(35, 39.5)] }),
  page('J1-3-training', 'training', 'morning', 34, { events: [...walk(3, 14), { t: 18, play: 'open' }, { t: 20, play: 'click' }, { t: 22, play: 'denied' }, ...walk(25, 33.5)] }),
  page('J1-4-district', 'district', 'morning', 30, { events: [...walk(2, 12), ...walk(20, 29.5)] }),
  // ---- a bout's afternoon: the forecourt under the cheers, the whole duel (Vessa, won) and its jingle, the town at the end of the day
  page('J2-1-forecourt', 'forecourt', 'midday', 34, { first: true, bout: true, events: [...walk(4, 16), { t: 22, play: 'click' }, ...walk(26, 33.5)] }),
  duelPage('J2-2-duel', 'vessa', 'midday', 'duel'),
  page('J2-3-district', 'district', 'afternoon', 34, { events: [...walk(5, 15), { t: 20, play: 'open' }, { t: 22, play: 'click' }, ...walk(25, 33.5)] }),
  // ---- an evening: the night's piece in town, on the forecourt (taken up where it stood), the hall's waltz, the lists (the night's piece again)
  page('J3-1-district', 'district', 'night', 40, { first: true, events: [...walk(5, 20), ...walk(30, 39.5)] }),
  page('J3-2-forecourt', 'forecourt', 'night', 32, { events: [...walk(3, 14), ...walk(22, 31.5)] }),
  page('J3-3-festival', 'festival', 'night', 34, { events: [...walk(3, 14), { t: 18, play: 'open' }, { t: 21, play: 'click' }, ...walk(25, 33.5)] }),
  page('J3-4-training', 'training', 'night', 30, { events: [...walk(3, 14), ...walk(20, 29.5)] }),
  // ---- the two other whole duels, alone: Orla won under the rival's piece, Marek lost under the finale's (night)
  duelPage('D-orla-rival', 'orla', 'midday', 'rival', { first: true }),
  duelPage('D-marek-finale', 'marek', 'night', 'finale', { first: true }),
  // ---- Vessa's duel in its parts: the music alone (the jingle with it), the crowd alone, the duel's sounds alone (their room's return with them)
  { ...duelPage('D-vessa-music', 'vessa', 'midday', 'duel', { first: true }), mute: ['fx', 'ambience', 'ui'] },
  { ...duelPage('D-vessa-crowd', 'vessa', 'midday', 'duel', { first: true }), mute: ['music', 'fx', 'ui'] },
  { ...duelPage('D-vessa-fx', 'vessa', 'midday', 'duel', { first: true }), mute: ['music', 'ambience', 'ui'] },
  // ---- the stings over their pages, and the interface and the steps over each page's music (the pages as the player hears them)
  page('S-fanfare-forecourt', 'forecourt', 'morning', 26, { first: true, events: [{ t: 6, sting: 'fanfare' }] }),
  page('S-ui-district-midday', 'district', 'midday', 20, { first: true, events: [{ t: 6, play: 'click' }, { t: 8, play: 'open' }, { t: 10, play: 'coin' }, { t: 12, play: 'denied' }, ...walk(14, 19.5)] }),
  page('S-ui-festival-night', 'festival', 'night', 20, { first: true, events: [{ t: 6, play: 'click' }, { t: 8, play: 'open' }, { t: 10, play: 'coin' }, { t: 12, play: 'denied' }, ...walk(14, 19.5)] }),
  page('S-ui-training-midday', 'training', 'midday', 20, { first: true, events: [{ t: 6, play: 'click' }, { t: 8, play: 'open' }, { t: 10, play: 'coin' }, { t: 12, play: 'denied' }, ...walk(14, 19.5)] }),
];
// ---- the sheet's proposals against today, the same window: Vessa's duel from 118 s for 45 s (the events from there, the music from its loop's start), the
// arena's crowd as it is and carved at 500 Hz, where it covers the fights' music; three refusals over the town at midday, as they are and 6 dB up
const carve = (name, o = {}) => ({ ...duelPage(name, 'vessa', 'midday', 'duel', { first: true }), secs: 45, from: 118, events: duels.vessa.evs, events2: [], ...o });
jobs.push(carve('P-crowd-today'), carve('P-crowd-carved', { carve: { f: 500, q: 1, db: -5 } }));
jobs.push(carve('P-crowd-today-alone', { mute: ['music', 'fx', 'ui'] }), carve('P-crowd-carved-alone', { mute: ['music', 'fx', 'ui'], carve: { f: 500, q: 1, db: -5 } }));
const refusals = [{ t: 4, play: 'denied' }, { t: 7, play: 'denied' }, { t: 9.5, play: 'click' }, { t: 10.5, play: 'denied' }];
jobs.push(page('P-denied-today', 'district', 'midday', 14, { first: true, events: refusals }), { ...page('P-denied-up', 'district', 'midday', 14, { first: true, events: refusals }), ui: { denied: 0.58 } });
jobs.push({ ...page('P-denied-today-alone', 'district', 'midday', 14, { first: true, events: refusals }), mute: ['music', 'ambience'] }, { ...page('P-denied-up-alone', 'district', 'midday', 14, { first: true, events: refusals }), mute: ['music', 'ambience'], ui: { denied: 0.58 } });
// each of those pages in its two parts: the events alone (the music and the place taken out) and the page alone (no event): what the event brings over what it
// plays on, window by window (tools/audio/mix-listen.mjs)
for (const j of jobs.filter((x) => x.name.startsWith('S-ui-'))) {
  jobs.push({ ...j, name: `${j.name}-alone`, mute: ['music', 'ambience'] });
  jobs.push({ ...j, name: `${j.name}-page`, events2: j.events2.filter((e) => e.leave) });
}
