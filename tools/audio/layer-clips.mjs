// The sheet's excerpts from the renders of tools/audio/layer-jobs.mjs (journal Passe SN13): each one at -20.5 LUFS (BS.1770) with a 2 s fade out, in MP3 through
// ffmpeg (FFMPEG or the PATH), and a timeline of its three layers with the opponent's sequences, the heavy charges and the stuns under them.
//   node tools/audio/layer-clips.mjs <render dir> <site dir>   -> <site dir>/audio/*.mp3, *.svg
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const R = path.resolve(process.argv[2]), OUT = path.join(path.resolve(process.argv[3]), 'audio');
fs.mkdirSync(OUT, { recursive: true });
const FF = process.env.FFMPEG ?? 'ffmpeg';
const { loudness, truePeak } = await import('./measure.mjs');
const meta = JSON.parse(fs.readFileSync(path.join(R, 'meta.json'), 'utf8')), duels = JSON.parse(fs.readFileSync(path.join(R, 'duels.json'), 'utf8'));
const W = 60, SECS = 90;
const FOE = { duel: 'marek', rival: 'orla', finale: 'vessa' };
const rows = [];
for (const name of Object.keys(meta).filter((k) => k.startsWith('L-'))) {
  const f32 = path.join(R, 'raw', name + '.f32'), b = fs.readFileSync(f32), x = new Float32Array(b.buffer, b.byteOffset, b.length / 4), n = x.length / 2;
  const L = new Float32Array(n), Rr = new Float32Array(n); for (let i = 0; i < n; i++) { L[i] = x[2 * i]; Rr[i] = x[2 * i + 1]; }
  const ld = loudness([L, Rr], 48000), tp = truePeak ? truePeak([L, Rr]) : null;
  const mp3 = path.join(OUT, name.slice(2) + '.mp3');
  execFileSync(FF, ['-y', '-loglevel', 'error', '-f', 'f32le', '-ar', '48000', '-ac', '2', '-i', f32, '-af', `volume=${(-20.5 - ld.lufs).toFixed(2)}dB,afade=t=out:st=${SECS - 2}:d=2`, '-c:a', 'libmp3lame', '-b:a', '160k', '-map_metadata', '-1', mp3]);
  // the timeline
  const piece = name.split('-')[1], foe = FOE[piece], evs = duels[foe].evs.filter((e) => e.t >= W && e.t < W + SECS).map((e) => ({ ...e, t: e.t - W }));
  const moves = meta[name].after?.moves ?? [];
  const lanes = [[1, []], [1, []], [0, []]];
  // the first moves (start levels) come before any event: the engine starts at [1,1,0]
  const t0 = 0.1;
  const levelAt = (i) => { const pts = [[0, i === 2 ? 0 : 1]]; let held = pts[0][1]; for (const [t, li, v, ramp] of moves.filter((m) => m[1] === i).sort((a, b) => a[0] - b[0])) { pts.push([t, held], [t + ramp, v]); held = v; } pts.push([SECS, held]); return pts; };
  const Wd = 820, H = 272, padL = 86, padR = 10, top = 10, laneH = 52, gap = 14, X = (t) => padL + (Wd - padL - padR) * Math.min(1, Math.max(0, t / SECS));
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Wd} ${H}" font-family="Segoe UI, sans-serif" font-size="16"><rect width="${Wd}" height="${H}" fill="#f7f7f5"/>`;
  // opponent's sequences, heavy charges held, stuns
  let seqA = null, chA = null, stA = null; const marks = [];
  for (const e of evs) {
    if (e.type === 'sequenceStart' && e.who !== 'ren') seqA = e.t; if (e.type === 'sequenceEnd' && e.who !== 'ren' && seqA !== null) { marks.push(['seq', seqA, e.t]); seqA = null; }
    if (e.type === 'chargeTier' && e.open && e.idx >= 1 && chA === null) chA = e.t; if (e.type === 'chargeRelease' && chA !== null) { marks.push(['ch', chA, e.t]); chA = null; }
    if (e.type === 'stun') stA = e.t; if (e.type === 'stunEnd' && stA !== null) { marks.push(['st', stA, e.t]); stA = null; }
  }
  const names = ['riff', 'mélodie', 'tension'], col = ['#5b6270', '#3b5fb0', '#c4511d'];
  for (let i = 0; i < 3; i++) {
    const y0 = top + i * (laneH + gap), pts = levelAt(i);
    svg += `<text x="6" y="${y0 + laneH / 2 + 5}" fill="#1d2129">${names[i]}</text><rect x="${padL}" y="${y0}" width="${Wd - padL - padR}" height="${laneH}" fill="#e6e8ec"/>`;
    const poly = pts.map(([t, v]) => `${X(t).toFixed(1)},${(y0 + laneH - v * laneH).toFixed(1)}`).join(' ');
    svg += `<polygon points="${X(0)},${y0 + laneH} ${poly} ${X(SECS)},${y0 + laneH}" fill="${col[i]}" fill-opacity="0.75"/>`;
  }
  const yM = top + 3 * (laneH + gap) + 2;
  for (const [k, a, z] of marks) { const c = k === 'seq' ? '#1d2129' : k === 'ch' ? '#a7801a' : '#2f7d45', yy = yM + (k === 'seq' ? 0 : k === 'ch' ? 13 : 26); svg += `<rect x="${X(a).toFixed(1)}" y="${yy}" width="${Math.max(1.5, X(z) - X(a)).toFixed(1)}" height="8" fill="${c}"/>`; }
  svg += `<text x="6" y="${yM + 8}" font-size="13" fill="#1d2129">adversaire</text><text x="6" y="${yM + 21}" font-size="13" fill="#7a5c10">charge</text><text x="6" y="${yM + 34}" font-size="13" fill="#2f7d45">étourdi</text>`;
  for (let s = 0; s <= SECS; s += 15) svg += `<text x="${X(s) - (s ? 10 : 0)}" y="${H - 2}" font-size="13" fill="#5b6270">${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}</text>`;
  svg += '</svg>';
  fs.writeFileSync(path.join(OUT, name.slice(2) + '.svg'), svg);
  const per = [0, 0, 0]; for (const m of moves) per[m[1]]++;
  rows.push({ name, lufs: +ld.lufs.toFixed(1), lra: +ld.lra.toFixed(1), tp: tp != null ? +(+tp).toFixed(1) : null, moves: per, doubles: meta[name].after?.doubles ?? 0, seqs: marks.filter((m) => m[0] === 'seq').length, charges: marks.filter((m) => m[0] === 'ch').length, kb: Math.round(fs.statSync(mp3).size / 1024) });
}
console.table(rows);
fs.writeFileSync(path.join(OUT, '..', 'rows.json'), JSON.stringify(rows, null, 1));
