// The decision sheet's picture (journal Passe AC1): a real duel of the prototype on its timeline, as an SVG. Usage:
//   node tools/auto-duel/timeline-picture.mjs lib <seed> <seconds> <out.svg> --set=<the curve, as auto-duel-lab.mjs takes it>
const L = await import('../auto-duel-lab.mjs');
const { renFighter, foeFighter, KIT } = await import('./kits.mjs');
const { duel, RULES, DECIDERS } = await import('./sim.mjs');
import fs from 'node:fs';
const M = L.M, kit = { loadout: ['t1','t4','d1','s1'], levels: { t1: 1, t4: 1, d1: 1, s1: 1, heavy: 1 } };
const A = renFighter(M, { hp: 324, atk: 14, def: 14, end: 10, viv: 9.5 }, kit, { decider: DECIDERS.auto, lightCharge: RULES.light.charge });
const B = foeFighter(M, 'orla', 0, { sheet: L.sheetAt('orla', 0), mods: { damage: 1 }, preparation: 63, decider: DECIDERS.rival });
const seed = +(process.argv[3] || 11);
const r = duel(A, B, seed, RULES, { log: true });
const T0 = 0, T1 = +(process.argv[4] || 48), W = 1200, H = 350, x0 = 92, x1 = W - 24, sx = (t) => x0 + (t - T0) / (T1 - T0) * (x1 - x0);
const lane = { ren: 96, orla: 224 }, names = { ren: 'Ren', orla: 'Orla' };
const fr = { light: 'Attaque simple', t1: 'Taille éclair', t4: 'Estoc', d1: 'Rempart', s1: 'Ferveur', m_light: 'Attaque simple', m_heavy: 'Coup puissant', m_shoulder: 'Coup d’épaule', m_brace: 'Arc-boutement' };
const col = (a) => a === 'light' || a === 'm_light' ? '#9aa3b2' : a === 'd1' || a === 'm_brace' ? '#3b7fb0' : a === 's1' ? '#b07a1d' : '#c4511d';
let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Segoe UI, Arial, sans-serif"><rect width="${W}" height="${H}" rx="10" fill="#ffffff"/>`;
svg += `<text x="20" y="30" font-size="17" font-weight="700" fill="#1d2129">Un duel du prototype sur sa ligne de temps : Ren contre Orla (poule, jour 4), les ${T1} premières secondes</text>`;
for (let t = 0; t <= T1; t += 6) svg += `<line x1="${sx(t)}" y1="52" x2="${sx(t)}" y2="${H - 60}" stroke="#e6e9ee"/><text x="${sx(t)}" y="${H - 44}" font-size="13" fill="#5b6270" text-anchor="middle">${t} s</text>`;
for (const [k, y] of Object.entries(lane)) svg += `<text x="20" y="${y + 6}" font-size="16" font-weight="700" fill="#1d2129">${names[k]}</text><line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="#d9dde4" stroke-width="1"/>`;
// charges: from 'charge' event to its landing; a break pushes the landing
const open = {};
const ev = r.log.filter((e) => e.t <= T1 + 8);
for (const e of ev) {
  if (e.ev === 'charge') open[e.who] = e;
  if (e.ev === 'break') { const y = lane[e.who]; svg += `<rect x="${sx(e.t)}" y="${y - 30}" width="${Math.max(0, Math.min(sx(e.t + RULES.brk.stun), x1) - sx(e.t))}" height="60" fill="#c4511d" opacity="0.10"/><text x="${sx(e.t) + 4}" y="${y + 46}" font-size="12" fill="#c4511d" font-weight="700">rompu 10 s (dégâts ×2)</text>`; }
}
for (const e of ev.filter((e) => e.ev === 'charge')) {
  const y = lane[e.who], a = sx(e.t), b = Math.min(sx(e.at), x1); if (a >= x1) continue;
  const big = e.act !== 'light' && e.act !== 'm_light';
  svg += `<rect x="${a}" y="${y - (big ? 14 : 8)}" width="${Math.max(1, b - a - 2)}" height="${big ? 28 : 16}" rx="4" fill="${col(e.act)}" opacity="${big ? 0.9 : 0.55}"/>`;
  if (big && b - a > 12 + 7.2 * (fr[e.act] ?? e.act).length) svg += `<text x="${a + 6}" y="${y + 5}" font-size="12.5" fill="#fff" font-weight="700">${fr[e.act] ?? e.act}</text>`;
}
const mark = { hit: ['#1d2129', 'touché'], guarded: ['#3b5fb0', 'gardé'], dodged: ['#2f7d45', 'esquivé'] };
for (const e of ev.filter((e) => mark[e.ev] && e.t <= T1)) {
  const y = lane[e.who === 'ren' ? 'orla' : 'ren'], x = sx(e.t), [c, w] = mark[e.ev], big = e.act !== 'light' && e.act !== 'm_light';
  svg += `<path d="M${x} ${y + (e.who === 'ren' ? -36 : 36)} L${x} ${y + (e.who === 'ren' ? -20 : 20)}" stroke="${c}" stroke-width="${big ? 2.5 : 1.2}" marker-end="url(#ar)"/>`;
  if (big) svg += `<text x="${x}" y="${y + (e.who === 'ren' ? -40 : 50)}" font-size="12" fill="${c}" text-anchor="middle" font-weight="700">${w}${e.dmg ? ' −' + e.dmg : ''}</text>`;
}
svg = svg.replace('<rect width', `<defs><marker id="ar" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L6 3 L0 6 z" fill="#1d2129"/></marker></defs><rect width`);
svg += `<text x="20" y="${H - 22}" font-size="12.5" fill="#5b6270">Une barre = une action en charge (la zone d’attente) ; elle part à son bout droit. Gris : attaque simple (+1 PA). Rouge : compétence offensive ou coup puissant. Bleu : défensive. Ocre : soutien.</text><text x="20" y="${H - 6}" font-size="12.5" fill="#5b6270">Flèche : le coup qui part sur l’autre (touché, gardé, esquivé). Pendant sa propre charge rouge, on ne garde pas : Ren prend 2 × 33 en chargeant l’Estoc. (prototype, courbe B, graine ${seed})</text></svg>`;
fs.writeFileSync(process.argv[5], svg);
console.log(r.winner, r.t, JSON.stringify(r.n.map((n) => ({ acts: n.acts, skills: n.skills, dodged: n.dodged, guarded: n.guarded, hit: n.hit, breaks: n.breaks }))));
console.log(ev.filter(e=>e.t<=T1).map(e=>`${e.t} ${e.who} ${e.ev} ${e.act??''} ${e.dmg??''}`).join('\n'));
await M.server.close();
