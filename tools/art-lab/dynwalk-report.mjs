// Aggregate dynwalk runs into one table (markdown) + report.json: per run x tracked actor x framing (blends grouped as "blend").
// node tools/art-lab/dynwalk-report.mjs <outDir> [run ...]   (default: every run folder of outDir); writes <outDir>/report.json
import fs from 'node:fs';
import path from 'node:path';
const here = path.resolve(process.argv[2] ?? '.');
const runs = process.argv.slice(3).length ? process.argv.slice(3) : fs.readdirSync(here).filter((d) => fs.existsSync(path.join(here, d, 'log.json')));
const q = (s, p) => s[Math.min(s.length - 1, Math.floor(s.length * p))];
const rows = [], out = {};
for (const run of runs) {
  const log = JSON.parse(fs.readFileSync(path.join(here, run, 'log.json'), 'utf8'));
  const actors = [...new Set(log.flatMap((r) => r.actors.map((a) => a.ti)))];
  out[run] = { frames: log.length, blendFrames: log.filter((r) => r.blending).length, revealFrames: log.filter((r) => r.occ > 0).length, retries: log.reduce((s, r) => s + r.actors.reduce((t, a) => t + (a.retries ?? 0), 0), 0),
    glitches: log.reduce((s, r) => s + r.actors.filter((a) => a.glitch).length, 0), groups: {} };
  for (const ti of actors) {
    const by = {};
    for (const r of log) { const a = r.actors.find((x) => x.ti === ti); if (!a || !a.vis || a.glitch) continue; (by[r.blending ? 'blend' : r.target] ??= []).push(a); }
    for (const [g, arr] of Object.entries(by)) {
      const c = arr.filter((a) => a.churn != null), ch = c.map((a) => 100 * a.churn).sort((x, y) => x - y), sh = c.map((a) => 100 * a.shape).sort((x, y) => x - y), rd = arr.map((a) => a.ringDarkPct).filter((v) => v != null).sort((x, y) => x - y);
      const rec = { run, actor: ti, group: g, frames: arr.length, ppt: [Math.min(...arr.map((a) => a.ppt)), Math.max(...arr.map((a) => a.ppt))].map((v) => +v.toFixed(2)), hpx: [Math.min(...arr.map((a) => a.h)), Math.max(...arr.map((a) => a.h))],
        churnMed: ch.length ? +q(ch, 0.5).toFixed(1) : null, churnP90: ch.length ? +q(ch, 0.9).toFixed(1) : null, churnMax: ch.length ? +ch[ch.length - 1].toFixed(1) : null,
        shapeMed: sh.length ? +q(sh, 0.5).toFixed(1) : null, shapeP90: sh.length ? +q(sh, 0.9).toFixed(1) : null, ringDarkMed: rd.length ? q(rd, 0.5) : null };
      rows.push(rec); out[run].groups[`a${ti}:${g}`] = rec;
    }
  }
}
fs.writeFileSync(path.join(here, 'report.json'), JSON.stringify(out, null, 1));
console.log('| run | PNJ | cadrage | images | px/texel | hauteur px | churn méd / p90 / max % | silhouette méd / p90 % | contour sombre méd % |');
console.log('|---|---|---|---|---|---|---|---|---|');
for (const r of rows) console.log(`| ${r.run} | ${r.actor} | ${r.group} | ${r.frames} | ${r.ppt.join('-')} | ${r.hpx.join('-')} | ${r.churnMed} / ${r.churnP90} / ${r.churnMax} | ${r.shapeMed} / ${r.shapeP90} | ${r.ringDarkMed} |`);
for (const [run, o] of Object.entries(out)) console.log(`${run}: ${o.frames} images, ${o.blendFrames} en transition, ${o.revealFrames} avec reveal actif, ${o.retries} recaptures, ${o.glitches} images écartées`);
