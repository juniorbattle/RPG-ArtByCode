// The template's sword left behind another weapon (journal Passe PN1, the operator's report « on percoit l'epee presente parmi les autres armes »): for each frame of both templates,
// the texels of the sword's light steel (its own colours, which the mace, the axe's haft and the hammer never use) still in the frame once each weapon is drawn, and where.
// --band: every colour of the sword (its steel, the warm greys and creams of its shading, its dark edge) left on the old blade's band, past the grip (the operator's message
// of 2026-11-15, « des corrections d'affichages a prevoir sur les armes de nos pnjs »: the townswoman's brace kept the blade's upper rows, its outline and its creams).
// Exit 1 when any frame keeps one.
//   node tools/art-lab/npc-remnants.mjs [--weapon=mace] [--max=0] [--band]
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from '../../tests/load.mjs';

const args = process.argv.slice(2), opt = (n, d) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3) ?? d;
const weapons = opt('weapon', 'mace,hammer,dagger').split(','), max = Number(opt('max', '0')), band = args.includes('--band');
const NL = await load('/src/characters/NpcLook.ts'), NW = await load('/src/characters/NpcWeapons.ts'), FS = await load('/src/characters/FighterSkins.ts'), BD = await load('/src/characters/BakedDecode.ts');
let bad = 0;
for (const t of ['m', 'f']) {
  const id = NL.npcSheetId(t), s = NL.NPC_LOOK_FILE.sheets[id], meta = JSON.parse(fs.readFileSync(path.join(ROOT, `art-lab/characters/exports/${id}.json`), 'utf8'));
  const { fw, fh, frames } = FS.namedFrames(await BD.decodePng(new Uint8Array(fs.readFileSync(path.join(ROOT, `art-lab/characters/exports/${id}.png`)))), meta, true);
  const steel = new Set(s.weapon.steel.map((c) => parseInt(c, 16))), all = new Set([...s.weapon.steel, ...s.weapon.blade, ...s.weapon.edge].map((c) => parseInt(c, 16))), skin = new Set([...s.skin.skin, ...(s.skin.shade ?? [])].map((c) => parseInt(c, 16)));
  for (const w of weapons) for (const f of frames) {
    const o = NW.weaponFrame(f.rgba, f.rgba, fw, fh, f.name, s.weapon, w, skin), left = [];
    // the weapon's own steel (a dagger's blade) is drawn in other tones: the template's light steel left is the old sword
    const seg = s.weapon.frames[f.name] && NW.centreLine(f.rgba, fw, fh, s.weapon.frames[f.name], s.weapon), L = seg ? NW.lineOf(seg) : null;
    const near = (x, y) => { if (!L) return true; const sx = (x - L.hx) * L.dx + (y - L.hy) * L.dy, r = (x - L.hx) * L.nx + (y - L.hy) * L.ny; return band ? sx > 6 && sx <= L.len + 2 && Math.abs(r) <= 3.5 : sx >= -10 && sx <= L.len + 18 && Math.abs(r) <= (sx < 1.5 ? 11 : 5); };
    const look = band ? all : steel;
    for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) { const i = (y * fw + x) * 4; if (o[i + 3] >= 128 && look.has((o[i] << 16) | (o[i + 1] << 8) | o[i + 2]) && near(x, y) && !(f.rgba[i + 3] >= 128 && skin.has((f.rgba[i] << 16) | (f.rgba[i + 1] << 8) | f.rgba[i + 2]))) left.push([x, y]); }
    if (left.length > max) { bad++; const xs = left.map((p) => p[0]), ys = left.map((p) => p[1]); console.log(`${id} ${w.padEnd(6)} ${f.name.padEnd(12)} ${String(left.length).padStart(3)} texels of the old steel in [${Math.min(...xs)},${Math.min(...ys)}]-[${Math.max(...xs)},${Math.max(...ys)}]  line ${JSON.stringify(s.weapon.frames[f.name] ?? null)}`); }
  }
}
console.log(bad ? `${bad} frame(s) keep the old sword` : 'no frame keeps the old sword');
process.exitCode = bad ? 1 : 0;
