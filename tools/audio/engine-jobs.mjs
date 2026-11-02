// The jobs of tools/audio/engine-proof.mjs (journal Passe SN3): tools/audio/render.mjs --scripts=tools/audio/engine-jobs.mjs
const scene = { place: 'district', look: 'morning' };
const now = (pos) => JSON.stringify({ key: 'tune:1842:morning', pos, heard: true, at: Date.now() });
export const jobs = [
  { name: 's1-duck', secs: 8.5, script: 'duck', stem: 'music' },
  { name: 's1-layers', secs: 5, script: 'layers', stem: 'music' },
  { name: 's1-sync', secs: 5, script: 'sync', stem: 'music' },
  { name: 's1-fade', secs: 5, stem: 'music', script: 'fade' },
  { name: 's1-tune', secs: 13, scene, stem: 'music' },
  { name: 's1-resume', secs: 8, scene, stem: 'music', keep: ['cdt-v2-sound-now', now(5)] },
  { name: 's1-other', secs: 8, scene, stem: 'music', keep: ['cdt-v2-sound-now', JSON.stringify({ key: 'tune:1842:night', pos: 5, heard: true, at: Date.now() })] },
];
