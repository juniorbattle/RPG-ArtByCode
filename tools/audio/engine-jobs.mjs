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
  // the layers following the duel: the opponent's sequence from 8 s to 14 s; the K.O. at 6 s, the opponent's, then the hero's
  { name: 'sn-mood', secs: 20, scene: { place: 'arena', look: 'night', music: { bout: 'duel' } }, stem: 'music', script: 'mood', settle: true },
  { name: 'sn-win', secs: 11, scene: { place: 'arena', look: 'night', music: { bout: 'duel' } }, stem: 'music', script: 'win', settle: true },
  { name: 'sn-lose', secs: 11, scene: { place: 'arena', look: 'night', music: { bout: 'duel' } }, stem: 'music', script: 'lose', settle: true },
  // the fanfare at 4 s over the morning's piece, which steps back under it
  { name: 'sn-fanfare', secs: 12, scene, stem: 'music', script: 'fanfare', settle: true },
];
