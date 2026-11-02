// Page side of tools/audio/engine-proof.mjs: the engine's moves of lot S1 on test signals (journal Passe SN3), run by the real Sound.ts in harness.js.
(() => {
    // a whole number of periods in the buffer, so its loop closes
  const tone = (c, secs, hz, level) => { const n = Math.round(c.sampleRate * secs), turns = Math.round(secs * hz), b = c.createBuffer(2, n, c.sampleRate); for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = level * Math.sin(2 * Math.PI * turns * i / n); } return b; };
  const click = (c, secs, at, level) => { const n = Math.round(c.sampleRate * secs), b = c.createBuffer(2, n, c.sampleRate); b.getChannelData(0)[at] = level; b.getChannelData(1)[at] = level; return b; };
  // a steady tone on the music bus; a heavy blow at 2 s, the K.O. at 5 s: the bus steps back and returns
  AUD_SCRIPTS.duck = (s, job, at) => { s.layers('proof', [tone(s.ctx, 2, 440, 0.01)], 1, [1]); at(2, () => s.play('heavy')); at(5, () => s.play('ko')); };
  // three steady tones of 2.4 s, bars of 1.2 s: a level asked for between two bars moves on the next one
  AUD_SCRIPTS.layers = (s, job, at) => { const set = s.layers('proof', [tone(s.ctx, 2.4, 300, 0.01), tone(s.ctx, 2.4, 700, 0.01), tone(s.ctx, 2.4, 1500, 0.01)], 1.2, [1, 0, 0]); at(1, () => set.level(1, 1, 0.02)); at(3, () => set.level(2, 1, 0.02)); };
  // three stems with one click each on the same sample: if they run together the clicks add up on one sample, loop after loop
  AUD_SCRIPTS.sync = (s) => { s.layers('proof', [0, 1, 2].map(() => click(s.ctx, 1.5, 1000, 0.004)), 1.5, [1, 1, 1]); };
  AUD_SCRIPTS.fade = (s, job, at) => { s.layers('proof', [tone(s.ctx, 2, 440, 0.01)], 1, [1]); at(3, () => s.leave()); };
})();
