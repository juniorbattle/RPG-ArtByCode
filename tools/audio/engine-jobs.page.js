// Page side of tools/audio/engine-proof.mjs: the engine's moves of lot S1 on test signals (journal Passe SN3), run by the real Sound.ts in harness.js.
(() => {
    // a whole number of periods in the buffer, so its loop closes
  const tone = (c, secs, hz, level) => { const n = Math.round(c.sampleRate * secs), turns = Math.round(secs * hz), b = c.createBuffer(2, n, c.sampleRate); for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = level * Math.sin(2 * Math.PI * turns * i / n); } return b; };
  // the test tones at the output level lot S1 measured them at: the music bus was 14.1 dB before the band (journal Passe SN10); a blow's reverberation stays under them
  const TONE = 0.01 * 10 ** ((14.1 - AUD.MIX.music) / 20);
  const click = (c, secs, at, level) => { const n = Math.round(c.sampleRate * secs), b = c.createBuffer(2, n, c.sampleRate); b.getChannelData(0)[at] = level; b.getChannelData(1)[at] = level; return b; };
  // a steady tone on the music bus; a heavy blow at 2 s, the K.O. at 5 s: the bus steps back and returns
  AUD_SCRIPTS.duck = (s, job, at) => { s.layers('proof', [tone(s.ctx, 2, 440, TONE)], 1, [1]); at(2, () => s.play('heavy')); at(5, () => s.play('ko')); };
  // three steady tones of 2.4 s, bars of 1.2 s: a level asked for between two bars moves on the next one
  AUD_SCRIPTS.layers = (s, job, at) => { const set = s.layers('proof', [tone(s.ctx, 2.4, 300, TONE), tone(s.ctx, 2.4, 700, TONE), tone(s.ctx, 2.4, 1500, TONE)], 1.2, [1, 0, 0]); at(1, () => set.level(1, 1, 0.02)); at(3, () => set.level(2, 1, 0.02)); };
  // three stems with one click each on the same sample: if they run together the clicks add up on one sample, loop after loop
  AUD_SCRIPTS.sync = (s) => { s.layers('proof', [0, 1, 2].map(() => click(s.ctx, 1.5, 1000, 0.004)), 1.5, [1, 1, 1]); };
  AUD_SCRIPTS.fade = (s, job, at) => { s.layers('proof', [tone(s.ctx, 2, 440, TONE)], 1, [1]); at(3, () => s.leave()); };
  // the band (journal Passe SN10): the opponent's sequence takes the lead out and brings the tension in, on the bar; the K.O. takes the music and gives its jingle
  AUD_SCRIPTS.mood = (s, job, at) => { at(19, () => s.duelEvent({ type: 'sequenceStart', who: 'marek', len: 3 })); at(25, () => s.duelEvent({ type: 'sequenceEnd', who: 'marek' })); };
  AUD_SCRIPTS.win = (s, job, at) => { at(6, () => s.duelEvent({ type: 'ko', who: 'marek' })); };
  AUD_SCRIPTS.lose = (s, job, at) => { at(6, () => s.duelEvent({ type: 'ko', who: 'ren' })); };
  AUD_SCRIPTS.window = (s, job, at) => { at(4, () => s.duelEvent({ type: 'windowOpen', who: 'marek', action: 'm_slash', dur: 0.22 })); };
  AUD_SCRIPTS.double =(s, job, at) => { at(19, () => s.duelEvent({ type: 'sequenceStart', who: 'marek', len: 1 })); at(19.2, () => s.duelEvent({ type: 'sequenceEnd', who: 'marek' })); };
  AUD_SCRIPTS.fanfare = (s, job, at) => { at(4, () => s.sting('fanfare')); };
  // lot 4 of the duel played by the computer (journal Passe LC6): Ren's charge of his fourth skill on a ladder of five, its release; x2 from a key then from the HUD; « Skip »
  AUD_SCRIPTS.lcCharge = (s, job, at) => { at(4, () => s.duelEvent({ type: 'chargeTier', who: 'ren', idx: 4, open: true })); at(6.5, () => s.duelEvent({ type: 'chargeRelease', who: 'ren', idx: 4, ok: true })); };
  AUD_SCRIPTS.lcSpeed = (s, job, at) => { at(2, () => s.duelEvent({ type: 'speed', on: true, quiet: false })); at(3, () => s.duelEvent({ type: 'speed', on: false, quiet: true })); };
  AUD_SCRIPTS.lcSkip = (s, job, at) => { at(19.5, () => s.duelEvent({ type: 'skip', secs: 0.22, quiet: true })); };
})();
