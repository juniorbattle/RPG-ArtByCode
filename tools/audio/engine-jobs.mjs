// The jobs of tools/audio/engine-proof.mjs (journal Passes SN3 / SN10): tools/audio/render.mjs --scripts=tools/audio/engine-jobs.mjs
const scene = { place: 'district', look: 'morning' };
const now = (key, pos) => JSON.stringify({ key, pos, heard: true, at: Date.now() });
export const jobs = [
  { name: 's1-duck', secs: 8.5, script: 'duck', stem: 'music' },
  { name: 's1-layers', secs: 5, script: 'layers', stem: 'music' },
  { name: 's1-sync', secs: 5, script: 'sync', stem: 'music' },
  { name: 's1-fade', secs: 5, stem: 'music', script: 'fade' },
  // the band (journal Passe SN10): the morning's piece, taken up where the last page left it, or from its start when the record names another piece
  { name: 's1-tune', secs: 13, scene, stem: 'music' },
  { name: 's1-resume', secs: 8, scene, stem: 'music', keep: ['cdt-v2-sound-now', now('band:matin', 5)] },
  { name: 's1-other', secs: 8, scene, stem: 'music', keep: ['cdt-v2-sound-now', now('band:nuit', 5)] },
  // the duel's intro, then its loop; the waltz across its loop's turn
  { name: 'sn-intro', secs: 10, scene: { place: 'arena', look: 'night', music: { bout: 'duel' } }, stem: 'music' },
  { name: 'sn-seam', secs: 45, scene: { place: 'festival', look: 'midday' }, stem: 'music' },
  // the layers following the duel: the opponent's sequence from 19 s to 25 s; the K.O. at 6 s, the opponent's, then the hero's. The duel's tension rests from the
  // loop's third bar to its eighth (8.4 to 16.7 s here): a level read there is no reading (journal Passe SN13), the sequences come after it
  { name: 'sn-mood', secs: 32,scene: { place: 'arena', look: 'night', music: { bout: 'duel' } }, stem: 'music', script: 'mood', settle: true },
  { name: 'sn-win', secs: 11, scene: { place: 'arena', look: 'night', music: { bout: 'duel' } }, stem: 'music', script: 'win', settle: true },
  { name: 'sn-lose', secs: 11, scene: { place: 'arena', look: 'night', music: { bout: 'duel' } }, stem: 'music', script: 'lose', settle: true },
  // the opponent's sequence from 19 s to 19.2 s, over before the bar line its moves were asked for (journal Passe SN13): the layers hold, no drop
  // the arena's crowd in place of its rumble (journal Passe SN16): its murmur alone, across its loop's turn; the dodge window's bell at 4 s, played as baked
  { name: 'sn-crowd', secs: 20, scene: { place: 'arena', look: 'night', music: { bout: 'duel' } }, stem: 'fx', settle: true },
  { name: 'sn-window', secs: 7, scene: { place: 'arena', look: 'night', music: { bout: 'duel' } }, stem: 'fx', script: 'window', settle: true },
  { name: 'sn-double', secs: 22, scene:{ place: 'arena', look: 'night', music: { bout: 'duel' } }, stem: 'music', script: 'double', settle: true },
  // the fanfare at 4 s over the morning's piece, which steps back under it
  { name: 'sn-fanfare', secs: 12, scene, stem: 'music', script: 'fanfare', settle: true },
  // lot 4 of the duel played by the computer (journal Passe LC6), on the empty stands (no crowd, the duel's own sounds): Ren charges his fourth skill at 4 s (the
  // tier's note, a breath every 0.6 s), it leaves at 6.5 s (the whip, the breath stops); x2 at 2 s from a key (the click), at 3 s from the HUD's button (quiet);
  // « Skip » at 19.5 s: the music down over the curtain's 0.22 s (the empty stands: the crowd's way reaches the output in the music's stem, journal Passe LC6)
  { name: 'lc-charge', secs: 9, scene: { place: 'arena', look: 'night', music: { bout: 'duel', tiers: 5, empty: true } }, stem: 'fx', script: 'lcCharge', settle: true },
  { name: 'lc-speed', secs: 5, scene: { place: 'arena', look: 'night', music: { bout: 'duel', tiers: 5, empty: true } }, stem: 'fx', script: 'lcSpeed', settle: true },
  { name: 'lc-skip', secs: 22, scene: { place: 'arena', look: 'night', music: { bout: 'duel', tiers: 5, empty: true } }, stem: 'music', script: 'lcSkip', settle: true },
];
