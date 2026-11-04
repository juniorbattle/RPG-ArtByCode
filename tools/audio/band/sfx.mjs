// The duel's sounds and the arena's crowd rendered (lot S3, journal Passe SN15): art-lab/audio/sfx/duel.sfx.mjs (one sound per effect recipe, the duel's reading)
// and crowd.sfx.mjs (the crowd in code), each take a 16-bit WAV at 48 kHz, and sfx.json: lengths, the loudest 400 ms, true peaks, families.
//   node --max-old-space-size=8192 tools/audio/band/sfx.mjs <outDir> [id ...]
import fs from 'node:fs';
import path from 'node:path';
import { CUES, renderCue } from '../../../art-lab/audio/sfx/duel.sfx.mjs';
import { CROWD, renderCrowd } from '../../../art-lab/audio/sfx/crowd.sfx.mjs';
import { forgetNotes } from './instruments.mjs';
import { forgetHits } from './drums.mjs';
import { wavBytes, loudness, truePeak } from '../measure.mjs';
import { SR } from './dsp.mjs';

const args = process.argv.slice(2), out = path.resolve(args.find((a) => !a.startsWith('--')) ?? 'out-sfx'), only = args.filter((a) => !a.startsWith('--')).slice(1);
fs.mkdirSync(out, { recursive: true });
const meta = {}, t0 = Date.now();
const keep = (name, L, R, extra) => {
  fs.writeFileSync(path.join(out, `${name}.wav`), wavBytes([L, R], SR));
  const m = loudness([L, R], SR); meta[name] = { secs: +(L.length / SR).toFixed(3), momentary: +m.momentary.toFixed(1), lufs: +m.lufs.toFixed(1), tp: +truePeak([L, R]).toFixed(1), ...extra };
};
for (const id of Object.keys(CUES)) {
  if (only.length && !only.includes(id)) continue;
  // each sound from its own writing alone (journal Passe SN10): no note kept from another
  forgetNotes(); forgetHits();
  const c = renderCue(id);
  c.takes.forEach((x, k) => keep(c.takes.length > 1 ? `${id}-${k}` : id, x.L, x.R, { family: c.family, cue: id, take: k }));
}
for (const id of Object.keys(CROWD)) {
  if (only.length && !only.includes(id)) continue;
  const c = renderCrowd(id); keep(`crowd-${id}`, c.L, c.R, { family: 'crowd', cue: id, kind: c.kind });
}
fs.writeFileSync(path.join(out, 'sfx.json'), JSON.stringify(meta, null, 1));
for (const [k, v] of Object.entries(meta)) console.log(k.padEnd(18), `${v.secs.toFixed(2)} s`.padStart(8), `${v.momentary} LUFS(M)`.padStart(14), `${v.tp} dBTP`.padStart(11), v.family);
console.log(`${Object.keys(meta).length} files, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
