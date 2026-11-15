/** The weapons a townsperson fights with (journal Passe PN1; the operator's GP-04 note « [...] avec des declinaisons de peau cheveux, couleur de vetement et armes
 *  etc... » and his message of 2026-11-15, word for word « propose des armes comme epee, hache, marteau etc... »). The two templates (npc-m-x3-combat, npc-f-x3-combat)
 *  were drawn with one short sword; in each frame its line is pinned in art-lab/characters/variants/npc.json (`weapon.frames`: the hilt end at the crossguard, the tip,
 *  written by tools/art-lab/npc-weapons.mjs and read again on the sheet). A weapon of the list is drawn along that line once, on the texels, when the sheet is installed:
 *  the sword's steel is erased (the body behind it filled from either side), then the weapon's grip, its blade or haft and its head; a skin texel (a hand on the hilt or
 *  on the flat) stays in front. Every shape and colour is « proposé » (the art sheet of chantier 1). Pure: no DOM, no randomness. */

import type { NpcWeapon } from '../narrative/npcFighters';
export type { NpcWeapon };
export const NPC_WEAPONS: readonly NpcWeapon[] = ['sword', 'axe', 'hammer', 'mace', 'dagger'];
/** a frame's weapon line: the hilt end (the crossguard) and the tip, texels of the frame */
export type WeaponSeg = readonly [number, number, number, number];
export interface WeaponSheet {
  /** the template sword's steel (6 hex digits): erased along the line */
  steel: string[];
  /** the warm greys the blade's shading took in the reconstruction (the town palette's cuffs and trousers): erased on the blade only, past the crossguard */
  blade: string[];
  /** the sword's dark edge colours: erased along the line only next to its steel */
  edge: string[];
  /** per frame name, the line (a frame without one holds no weapon) */
  frames: Record<string, WeaponSeg>;
}

type RGB = readonly [number, number, number];
/** the colours (« proposé »): the steel ramp of the combat sheets (lib/combat.mjs STEEL_RAMP and blade2's two lights), a wood ramp, an iron ramp, the outline */
const STEEL: readonly RGB[] = [[248, 233, 216], [230, 201, 183], [190, 196, 208], [132, 138, 152], [78, 82, 96]];
const WOOD: readonly RGB[] = [[156, 110, 70], [122, 82, 52], [90, 60, 40], [58, 38, 28]];
const IRON: readonly RGB[] = [[176, 180, 192], [124, 128, 142], [84, 88, 102], [54, 56, 68]];
const LEATHER: RGB = [70, 44, 34];
const INK: RGB = [30, 24, 28];

const key = (px: Uint8Array, i: number) => (px[i] << 16) | (px[i + 1] << 8) | px[i + 2];
const set = (px: Uint8Array, i: number, c: RGB) => { px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; px[i + 3] = 255; };

/** the line's frame: its unit direction, its length, and the side its edge (an axe's blade, a sword's dark row) faces: toward the opponent on the left for a raised or
 *  lowered weapon, below for a level one */
export function lineOf(seg: WeaponSeg): { hx: number; hy: number; dx: number; dy: number; len: number; nx: number; ny: number } {
  const [hx, hy, tx, ty] = seg, len = Math.max(1, Math.hypot(tx - hx, ty - hy)), dx = (tx - hx) / len, dy = (ty - hy) / len;
  let nx = -dy, ny = dx;
  if (Math.abs(nx) >= 0.35 ? nx > 0 : ny < 0) { nx = -nx; ny = -ny; }
  return { hx, hy, dx, dy, len, nx, ny };
}

/** where a texel lies against a frame's line: s along it from the crossguard, r across it */
function frameOf(seg: WeaponSeg) {
  const L = lineOf(seg);
  return { ...L, at: (x: number, y: number) => ({ s: (x - L.hx) * L.dx + (y - L.hy) * L.dy, r: (x - L.hx) * L.nx + (y - L.hy) * L.ny }) };
}
/** the zones of the old sword (texels): its blade past the crossguard, its crossguard across the line (its tips reach 10 texels out), its pommel behind the hand */
const BLADE = { s0: 1.5, w: 2.6, wide: 4.6 }, GUARD = { s0: -4, s1: 1.5, w: 11 }, POMMEL = { s0: -10, s1: -4, w: 3 }, GRIP = 5;

/** the hands on a frame's weapon (1 = a texel that stays in front): the skin's colours, except on the old blade past the grip (GRIP texels from the crossguard), where they are the
 *  blade's highlights the reconstruction gave the skin's lightest tones (the townswoman's palette has no cool greys) or a face the upright blade crossed (the guard: the blade in
 *  front of the face is erased there and the face filled back from either side) */
export function handsOf(orig: Uint8Array, fw: number, fh: number, seg: WeaponSeg, skin: ReadonlySet<number>): Uint8Array {
  const F = frameOf(seg), out = new Uint8Array(fw * fh);
  for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
    const i = (y * fw + x) * 4;
    if (orig[i + 3] < 128 || !skin.has(key(orig, i))) continue;
    const { s, r } = F.at(x, y);
    if (s > GRIP && s <= F.len + 2 && Math.abs(r) <= BLADE.w) continue;
    out[y * fw + x] = 1;
  }
  return out;
}

/** a pinned line set on the middle of the blade it follows (a new line, or the same): the pinned lines are whole texels and the finder's run can sit a texel off a blade seven
 *  texels wide (the townswoman's brace, its blade level across her face: the old sword's upper rows were left, the operator's message of 2026-11-15, word for word « des
 *  corrections d'affichages a prevoir sur les armes de nos pnjs »); the blade's texels of the sword's colours within 5 texels of the line, past the grip, give the mean offset across
 *  it, and the line moves by it, in half texels, 2 at most */
export function centreLine(orig: Uint8Array, fw: number, fh: number, seg: WeaponSeg, w: Pick<WeaponSheet, 'steel' | 'blade' | 'edge'>): WeaponSeg {
  const sword = new Set([...w.steel, ...w.blade, ...w.edge].map((c) => parseInt(c, 16))), F = frameOf(seg);
  const x0 = Math.max(0, Math.floor(Math.min(seg[0], seg[2]) - 6)), x1 = Math.min(fw - 1, Math.ceil(Math.max(seg[0], seg[2]) + 6));
  const y0 = Math.max(0, Math.floor(Math.min(seg[1], seg[3]) - 6)), y1 = Math.min(fh - 1, Math.ceil(Math.max(seg[1], seg[3]) + 6));
  let sum = 0, n = 0;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const i = (y * fw + x) * 4; if (orig[i + 3] < 128 || !sword.has(key(orig, i))) continue;
    const { s, r } = F.at(x, y); if (s <= GRIP || s > F.len || Math.abs(r) > 5) continue;
    sum += r; n++;
  }
  if (n < 6) return seg;
  const o = Math.max(-2, Math.min(2, Math.round((sum / n) * 2) / 2));
  return Math.abs(o) < 0.5 ? seg : [seg[0] + o * F.nx, seg[1] + o * F.ny, seg[2] + o * F.nx, seg[3] + o * F.ny];
}

/** the template's sword taken out of one frame (a new array): every texel of its blade's corridor but a hand; round its crossguard and its pommel, the texels of the sword's
 *  colours (its steel, the warm greys its shading took, its dark edge) and the outline that rings them; the outline along the blade where it touches it. Each texel taken is
 *  filled from the nearest texels on both sides (across the line for the blade and the pommel, along it for the crossguard, which lies across it) when the body lies on both
 *  sides, else left empty; then what is left round the line in thin threads (two neighbours or fewer) goes too. `hands`: handsOf */
export function eraseSword(rgba: Uint8Array, fw: number, fh: number, seg: WeaponSeg, w: Pick<WeaponSheet, 'steel' | 'blade' | 'edge'>, hands: Uint8Array): Uint8Array {
  const sword = new Set([...w.steel, ...w.blade, ...w.edge].map((c) => parseInt(c, 16))), edgeC = new Set(w.edge.map((c) => parseInt(c, 16))), steelC = new Set(w.steel.map((c) => parseInt(c, 16)));
  const F = frameOf(seg), { dx, dy, nx, ny, len } = F, out = Uint8Array.from(rgba), gone = new Uint8Array(fw * fh), along = new Uint8Array(fw * fh);
  const reach = len + 14, x0 = Math.max(0, Math.floor(F.hx - reach)), x1 = Math.min(fw - 1, Math.ceil(F.hx + reach)), y0 = Math.max(0, Math.floor(F.hy - reach)), y1 = Math.min(fh - 1, Math.ceil(F.hy + reach));
  const zone = (x: number, y: number): 'blade' | 'edge' | 'guard' | 'pommel' | null => {
    const { s, r } = F.at(x, y), ar = Math.abs(r);
    if (s >= BLADE.s0 && s <= len + 2 && ar <= BLADE.w) return 'blade';
    if (s >= BLADE.s0 && s <= len + 3 && ar <= BLADE.wide) return 'edge';
    if (s >= GUARD.s0 && s < GUARD.s1 && ar <= GUARD.w) return 'guard';
    if (s >= POMMEL.s0 && s < POMMEL.s1 && ar <= POMMEL.w) return 'pommel';
    return null;
  };
  const dark = (i: number) => Math.max(rgba[i], rgba[i + 1], rgba[i + 2]) < 70 || edgeC.has(key(rgba, i));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const j = y * fw + x, i = j * 4, z = zone(x, y);
    if (!z || z === 'edge' || rgba[i + 3] < 128 || hands[j]) continue;
    if (z === 'blade' || sword.has(key(rgba, i))) { gone[j] = 1; if (z === 'guard') along[j] = 1; }
  }
  // beside the blade, its colours only as far as they go on from it: a texel of the sword's colours whose neighbour toward the line was taken, unless that neighbour is the
  // blade's dark edge (past it lies the body: the townswoman's cuffs share the blade's creams)
  for (let pass = 0; pass < 3; pass++) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const j = y * fw + x, i = j * 4;
    if (gone[j] || zone(x, y) !== 'edge' || rgba[i + 3] < 128 || hands[j] || !sword.has(key(rgba, i))) continue;
    const r = F.at(x, y).r, X = Math.round(x - Math.sign(r) * nx), Y = Math.round(y - Math.sign(r) * ny);
    if (X < 0 || Y < 0 || X >= fw || Y >= fh) continue;
    const q = Y * fw + X;
    if (gone[q] && !dark(q * 4)) gone[j] = 1;
  }
  // past the line's end, the blade's tip as long as it goes on: a slice across the line (within 2.2 texels) holding a texel of the sword's colours or a light one (its highlights) is
  // taken, six slices in a row without one end it (a tip the finder's run stopped short of: the townswoman's highlights in her blouse's creams, a gap in a long lunge's blade)
  for (let k = Math.floor(len + 2.5), empty = 0; k <= len + 18 && empty < 6; k++) {
    let any = false;
    for (let r = -2; r <= 2; r++) {
      const x = Math.round(F.hx + k * dx + r * nx), y = Math.round(F.hy + k * dy + r * ny); if (x < 0 || y < 0 || x >= fw || y >= fh) continue;
      const j = y * fw + x, i = j * 4;
      if (rgba[i + 3] < 128 || hands[j] || gone[j]) continue;
      if (sword.has(key(rgba, i)) || Math.max(rgba[i], rgba[i + 1], rgba[i + 2]) >= 150) { gone[j] = 1; any = true; }
    }
    empty = any ? 0 : empty + 1;
  }
  // the outline that rings what was taken (a dark texel next to it, with no lit texel of the body beside it): the blade's dark edge, the crossguard's and the pommel's contour
  for (let pass = 0; pass < 3; pass++) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const j = y * fw + x, i = j * 4, z = zone(x, y) ?? (Math.abs(F.at(x, y).r) <= 5.6 && F.at(x, y).s >= 0 && F.at(x, y).s <= len + 18 ? 'edge' : null);
    if (gone[j] || !z || rgba[i + 3] < 128 || hands[j] || !dark(i)) continue;
    let n = 0, body = false;
    for (let v = -1; v <= 1; v++) for (let u = -1; u <= 1; u++) {
      const X = x + u, Y = y + v; if ((!u && !v) || X < 0 || Y < 0 || X >= fw || Y >= fh) continue;
      const q = Y * fw + X; if (gone[q]) n++; else if (rgba[q * 4 + 3] >= 128 && !dark(q * 4)) body = true;
    }
    if (n >= (pass ? 1 : 2) && !body) { gone[j] = 2; if (z === 'guard') along[j] = 1; }
  }
  // the shadow the blade cast on the body beside it: a texel next to what was taken, along the blade, darker than the texel past it (away from the line) by a clear step, is
  // taken too, twice outward (on the townswoman's dress the blade's lower edge was drawn in the dress's own shadows: filled from, it left a dark trail where the blade was)
  const lum = (i: number) => 0.3 * rgba[i] + 0.59 * rgba[i + 1] + 0.11 * rgba[i + 2];
  for (let pass = 0; pass < 2; pass++) {
    const add: number[] = [];
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const j = y * fw + x, i = j * 4;
      if (gone[j] || rgba[i + 3] < 128 || hands[j]) continue;
      const { s, r } = F.at(x, y);
      if (s < BLADE.s0 || s > len + 3 || Math.abs(r) < 1 || Math.abs(r) > BLADE.wide + 2) continue;
      if (!((x > 0 && gone[j - 1]) || (x < fw - 1 && gone[j + 1]) || (y > 0 && gone[j - fw]) || (y < fh - 1 && gone[j + fw]))) continue;
      const X = Math.round(x + Math.sign(r) * nx), Y = Math.round(y + Math.sign(r) * ny);
      if (X < 0 || Y < 0 || X >= fw || Y >= fh) continue;
      const q = Y * fw + X;
      if (gone[q] || rgba[q * 4 + 3] < 128 || hands[q]) continue;
      if (lum(i) + 15 < lum(q * 4)) add.push(j);
    }
    for (const j of add) gone[j] = 3;
  }
  // which texels taken the body fills: the body lies on both sides of it (across the line for the blade and the pommel, along it for the crossguard, which lies across it; a
  // guard texel with the blade taken toward the tip is looked at across too); the others are left empty (the blade against the background)
  const fill = new Uint8Array(fw * fh);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const j = y * fw + x;
    if (!gone[j]) continue;
    const [px, py] = along[j] ? [dx, dy] : [nx, ny];
    // a texel kept on that side, past the sword's light steel left there (a blade's warm greys and creams kept beside it are the body's: a cuff)
    const probe = (sx: number, sy: number, reach = 12): boolean => {
      for (let k = 1; k <= reach; k++) {
        const X = Math.round(x + sx * k), Y = Math.round(y + sy * k); if (X < 0 || Y < 0 || X >= fw || Y >= fh) return false;
        const q = Y * fw + X;
        if (gone[q] || (rgba[q * 4 + 3] >= 128 && steelC.has(key(rgba, q * 4)))) continue;
        return rgba[q * 4 + 3] >= 128;
      }
      return false;
    };
    let both = probe(px, py) && probe(-px, -py);
    if (!both && along[j]) both = probe(nx, ny, 12) && probe(-nx, -ny, 12);
    // and on three sides of four, up, down, left and right: a blade across the gap between the legs has a leg on either side of it, and the gap above and below it
    if (both) both = [probe(1, 0), probe(-1, 0), probe(0, 1), probe(0, -1)].filter(Boolean).length >= 3;
    const i = j * 4;
    out[i] = out[i + 1] = out[i + 2] = out[i + 3] = 0;
    if (both) fill[j] = 1;
  }
  // then filled from the body round it, ring by ring: each texel takes the colour most of its filled or kept neighbours have (the four nearest first), so the two sides meet in
  // the middle (the chin above a hilt, the hand beside it) instead of one texel drawn down a whole column
  for (let ring = 0, left = 1; ring < 24 && left; ring++) {
    const take: [number, number][] = [];
    left = 0;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const j = y * fw + x;
      if (fill[j] !== 1) continue;
      left++;
      const votes = new Map<number, number>();
      for (let v = -1; v <= 1; v++) for (let u = -1; u <= 1; u++) {
        const X = x + u, Y = y + v; if ((!u && !v) || X < 0 || Y < 0 || X >= fw || Y >= fh) continue;
        const q = Y * fw + X;
        if (fill[q] === 1 || out[q * 4 + 3] < 128 || (!gone[q] && steelC.has(key(out, q * 4)))) continue;
        const c = key(out, q * 4); votes.set(c, (votes.get(c) ?? 0) + (u && v ? 1 : 2));
      }
      let best = -1, n = 0;
      for (const [c, k] of votes) if (k > n || (k === n && c < best)) { best = c; n = k; }
      if (n >= 2) take.push([j, best]);
    }
    for (const [j, c] of take) { out[j * 4] = c >> 16; out[j * 4 + 1] = (c >> 8) & 255; out[j * 4 + 2] = c & 255; out[j * 4 + 3] = 255; fill[j] = 2; }
    if (!take.length) break;
  }
  const near = (x: number, y: number) => { const { s, r } = F.at(x, y); return s >= -11 && s <= len + 18 && Math.abs(r) <= (s < BLADE.s0 ? GUARD.w + 1 : 6); };
  for (let pass = 0; pass < 2; pass++) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const i = (y * fw + x) * 4;
    if (out[i + 3] < 128 || hands[y * fw + x] || !near(x, y)) continue;
    let n = 0;
    for (let v = -1; v <= 1; v++) for (let u = -1; u <= 1; u++) { const X = x + u, Y = y + v; if ((u || v) && X >= 0 && Y >= 0 && X < fw && Y < fh && out[(Y * fw + X) * 4 + 3] >= 128) n++; }
    if (n <= 2) out[i] = out[i + 1] = out[i + 2] = out[i + 3] = 0;
  }
  return out;
}

/** a weapon's texels in the line's frame: s along the line from the crossguard (texels), r across it toward the edge side; null outside the weapon. `len` the template
 *  sword's length in this frame */
function shape(kind: NpcWeapon, s: number, r: number, len: number): RGB | null {
  const grip = s >= -5 && s < -0.5 && Math.abs(r) <= 0.6;
  if (kind === 'sword' || kind === 'dagger') {
    const L = kind === 'sword' ? len : Math.max(9, Math.round(len * 0.5)), guard = kind === 'sword' ? 3 : 2;
    if (s >= -6.6 && s < -5.4 && Math.abs(r) <= 1.1) return STEEL[3];                  // the pommel
    if (grip) return LEATHER;
    if (s >= -0.5 && s < 0.6 && Math.abs(r) <= guard + 0.2) return STEEL[3];          // the crossguard
    const taper = Math.min(1, (L - s) / 3.5);                                         // the point: narrower over its last texels
    if (s >= 0.6 && s <= L) { if (r >= -1.05 * taper && r < 0) return STEEL[0]; if (r >= 0 && r < 0.95 * taper) return STEEL[1]; if (r >= 0.95 * taper && r < 1.9 * taper) return STEEL[4]; }
    return null;
  }
  const H = kind === 'mace' ? len * 0.8 : len * 0.95;                                  // the haft's end
  if (s >= -6 && s <= H && r >= -1.05 && r < 1.5) return r < 0 ? WOOD[0] : r < 0.95 ? WOOD[1] : WOOD[3];
  if (kind === 'axe') {
    // a bearded head on the edge side: wider toward its edge (a crescent), a small poll behind the haft
    const t = (r - 1.5) / 9, a = len * (0.74 - 0.16 * t), b = len * (0.95 + 0.06 * t);
    if (r >= 1.5 && r <= 10.5 && s >= a && s <= b) return r >= 9 ? STEEL[0] : r >= 5 ? STEEL[2] : STEEL[3];
    if (r < -1 && r >= -4 && s >= len * 0.8 && s <= len * 0.89) return IRON[2];
    return null;
  }
  if (kind === 'hammer') {
    // a square head across the haft's end, a lighter striking face, its lower side in shadow (its body a mid grey: the darker iron vanished on the townswoman's dress)
    if (s >= len * 0.76 && s <= len * 0.97 && Math.abs(r) <= 7.2) return s >= len * 0.93 ? IRON[0] : r >= 5.6 ? IRON[2] : IRON[1];
    return null;
  }
  // the mace: a round head at the haft's end with four flanges, lit from the upper left
  const c = len * 0.86, q = (s - c) ** 2 + r * r;
  if (q <= 30) return s - c < -1.5 && r < -0.5 ? IRON[0] : s - c + r > 3 ? IRON[2] : IRON[1];
  if ((Math.abs(r) <= 0.8 && Math.abs(Math.abs(s - c) - 6.5) <= 1) || (Math.abs(s - c) <= 0.8 && Math.abs(Math.abs(r) - 6.5) <= 1)) return IRON[3];
  return null;
}
/** the longest weapon drawn (texels from the crossguard): the man's brace holds the template's sword by its hilt and halfway up its blade, 91 texels end to end, where every
 *  other line is 26 to 55; the sword is erased whole, the weapon drawn at the common length (its head no larger than in the other frames) */
const DRAW_MAX = 56;
/** the parts of a weapon that take an outline (its head): every part but the blade and the haft */
const outlined = (kind: NpcWeapon, s: number, len: number): boolean => (kind === 'axe' || kind === 'hammer' ? s >= len * 0.55 : kind === 'mace' ? s >= len * 0.7 : false);

/** a weapon drawn along a frame's line (a new array). `hands`: the texels that stay in front (handsOf); the head's outline round it, on the body too (a head over the dress) */
export function drawWeapon(rgba: Uint8Array, fw: number, fh: number, seg: WeaponSeg, kind: NpcWeapon, hands: Uint8Array): Uint8Array {
  const L = lineOf(seg), { hx, hy, dx, dy, nx, ny } = L, len = Math.min(L.len, DRAW_MAX), out = Uint8Array.from(rgba), mine = new Uint8Array(fw * fh), head = new Uint8Array(fw * fh);
  const reach = len + 10, x0 = Math.max(0, Math.floor(hx - reach)), x1 = Math.min(fw - 1, Math.ceil(hx + reach)), y0 = Math.max(0, Math.floor(hy - reach)), y1 = Math.min(fh - 1, Math.ceil(hy + reach));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    // a texel's centre in the line's frame
    const s = (x - hx) * dx + (y - hy) * dy, r = (x - hx) * nx + (y - hy) * ny, c = shape(kind, s, r, len);
    if (!c) continue;
    const j = y * fw + x, i = j * 4;
    if (hands[j]) continue;
    set(out, i, c); mine[j] = 1; if (outlined(kind, s, len)) head[j] = 1;
  }
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const j = y * fw + x;
    if (mine[j] || hands[j]) continue;
    if ((x > 0 && head[j - 1]) || (x < fw - 1 && head[j + 1]) || (y > 0 && head[j - fw]) || (y < fh - 1 && head[j + fw])) set(out, j * 4, INK);
  }
  return out;
}

/** a frame with the template's sword replaced by `kind` (a new array), or the frame as it is when it holds no weapon or the weapon is the template's sword unchanged */
export function weaponFrame(rgba: Uint8Array, orig: Uint8Array, fw: number, fh: number, name: string, w: WeaponSheet, kind: NpcWeapon, skin: ReadonlySet<number>): Uint8Array {
  const pinned = w.frames[name];
  if (!pinned) return rgba;
  const seg = centreLine(orig, fw, fh, pinned, w), hands = handsOf(orig, fw, fh, seg, skin);
  return drawWeapon(eraseSword(rgba, fw, fh, seg, w, hands), fw, fh, seg, kind, hands);
}
