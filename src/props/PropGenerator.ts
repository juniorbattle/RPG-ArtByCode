import * as THREE from 'three';
import { Rng } from '../core/rng';
import { SlotSet, SLOTS, mat, type V3, type Slot } from '../core/MeshBuilder';
import { atlasRect, quadFacing } from '../architecture/FacadeGrammar';
import { EMBLEM_CELLS, type EmblemKind } from '../materials/CanvasArt';

/** Small reusable prop generators. Each returns a SlotSet in local space (origin = base centre, +z = front),
 *  built from a deterministic Rng so every variant is reproducible. Repeated props are instanced. */

export type PropKind = 'barrel' | 'crate' | 'sack' | 'lantern' | 'lampPost' | 'bollard' | 'pot' | 'basket' | 'bush' | 'candle' | 'chalkboard' | 'hay' | 'planter' | 'stool' | 'bucket';

const rnd = (r: Rng, a: number, b: number) => r.range(a, b);
const iron: V3 = [1, 1, 1];

export function barrel(r: Rng, o: { open?: boolean; lying?: boolean } = {}): SlotSet {
  const S = new SlotSet();
  const R = rnd(r, 0.27, 0.34), H = rnd(r, 0.78, 0.98), bulge = rnd(r, 1.1, 1.22);
  const prof: Array<[number, number]> = [];
  const N = 8;
  for (let i = 0; i <= N; i++) { const t = i / N; prof.push([R * (1 + (bulge - 1) * Math.sin(Math.PI * t)) * (0.94 + 0.06 * Math.sin(Math.PI * t)), H * t]); }
  const tint: V3 = [rnd(r, 0.85, 1.15), rnd(r, 0.8, 1.05), rnd(r, 0.75, 1)];
  const build = () => {
    S.planks.lathe(prof, 14, { tint, aoY: [0.65, 1], uvTile: 1 });
    for (const t of [0.12, 0.34, 0.66, 0.88]) {
      const y = H * t, rr = R * (1 + (bulge - 1) * Math.sin(Math.PI * t)) * (0.94 + 0.06 * Math.sin(Math.PI * t));
      S.metal.lathe([[rr + 0.004, y - 0.03], [rr + 0.016, y - 0.022], [rr + 0.016, y + 0.022], [rr + 0.004, y + 0.03]], 14, { tint: iron });
    }
    if (o.open) {
      S.planks.lathe([[R * 0.96, H], [R * 0.85, H - 0.02]], 14, { tint: [0.7, 0.7, 0.7] });
      S.dark.lathe([[R * 0.85, H - 0.02], [0.001, H - 0.05]], 14, {});
    } else {
      S.planks.lathe([[R * 0.97, H], [0.001, H + 0.015]], 14, { tint: [tint[0] * 1.1, tint[1] * 1.1, tint[2] * 1.1], uvTile: 1 });
      S.planks.lathe([[R * 0.97, H], [R * 0.9, H + 0.012]], 14, { tint });
    }
  };
  if (o.lying) S.with(mat([0, R * 1.15, 0], rnd(r, 0, 6.28), 1, 0, Math.PI / 2), () => S.with(mat([0, -H / 2, 0]), build));
  else build();
  return S;
}

export function crate(r: Rng, o: { size?: number } = {}): SlotSet {
  const S = new SlotSet();
  const s = o.size ?? rnd(r, 0.52, 0.8);
  const hx = s * rnd(r, 0.9, 1.15), hy = s * rnd(r, 0.75, 1.0), hz = s * rnd(r, 0.9, 1.1);
  const tint: V3 = [rnd(r, 0.85, 1.15), rnd(r, 0.8, 1.05), rnd(r, 0.8, 1.0)];
  S.planks.boxMM(-hx / 2, 0, -hz / 2, hx / 2, hy, hz / 2, { tint, aoY: [0.6, 1], grain: 'x' });
  const p = 0.045;
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as Array<[number, number]>) {
    S.timber.boxMM(sx * hx / 2 - (sx > 0 ? p : 0) - (sx > 0 ? -0.012 : 0.012), 0, sz * hz / 2 - (sz > 0 ? p : 0) - (sz > 0 ? -0.012 : 0.012), sx * hx / 2 + (sx > 0 ? 0.012 : p), hy, sz * hz / 2 + (sz > 0 ? 0.012 : p), { tint: [tint[0] * 0.8, tint[1] * 0.8, tint[2] * 0.8], grain: 'y', ao: 0.9 });
  }
  for (const y of [0.0, hy - 0.05]) {
    S.timber.boxMM(-hx / 2 - 0.012, y, hz / 2 - 0.01, hx / 2 + 0.012, y + 0.05, hz / 2 + 0.018, { tint: [tint[0] * 0.8, tint[1] * 0.8, tint[2] * 0.8], grain: 'x' });
    S.timber.boxMM(-hx / 2 - 0.012, y, -hz / 2 - 0.018, hx / 2 + 0.012, y + 0.05, -hz / 2 + 0.01, { tint: [tint[0] * 0.8, tint[1] * 0.8, tint[2] * 0.8], grain: 'x' });
  }
  // diagonal brace on the front
  const ang = Math.atan2(hy - 0.1, hx - 0.1), len = Math.hypot(hx - 0.1, hy - 0.1);
  S.with(mat([0, hy / 2, hz / 2 + 0.01], 0, 1, 0, ang), () => S.timber.boxMM(-len / 2, -0.025, -0.012, len / 2, 0.025, 0.016, { tint: [tint[0] * 0.8, tint[1] * 0.8, tint[2] * 0.8], grain: 'x' }));
  return S;
}

export function sack(r: Rng, o: { sit?: boolean } = {}): SlotSet {
  const S = new SlotSet();
  const rx = rnd(r, 0.24, 0.32), ry = rnd(r, 0.3, 0.4), rz = rnd(r, 0.2, 0.28);
  const tint: V3 = [rnd(r, 0.6, 0.72), rnd(r, 0.53, 0.62), rnd(r, 0.43, 0.52)];
  const ph = r.range(0, 6);
  S.cloth.blob(0, ry * 0.95, 0, rx, ry, rz, 12, 9, { tint, ao: 0.85, lump: (nx, ny, nz) => 1 + 0.09 * Math.sin(nx * 5 + ph) * Math.cos(nz * 4 + ph * 0.5) - 0.12 * Math.max(0, -ny) });
  S.cloth.lathe([[rx * 0.38, ry * 1.75], [rx * 0.2, ry * 1.88], [rx * 0.34, ry * 2.02], [rx * 0.12, ry * 2.1]], 8, { tint: [tint[0] * 0.9, tint[1] * 0.9, tint[2] * 0.9] });
  S.timber.cylinder(rx * 0.22, ry * 1.62, ry * 1.7, 8, { tint: [0.7, 0.6, 0.5] });
  void o;
  return S;
}

export function lantern(r: Rng, o: { lit?: boolean } = {}): SlotSet {
  const S = new SlotSet();
  const lit = o.lit !== false;
  const w = 0.095, h = 0.27;
  // glowing glass core (uv in the bright middle of the warm window cell)
  const u = [0.06, 0.66, 0.2, 0.66, 0.2, 0.8, 0.06, 0.8];
  S.glow.box(0, h * 0.5 + 0.06, 0, w * 1.6, h, w * 1.6, { tint: lit ? [1, 1, 1] : [0.05, 0.05, 0.06], aux: [0, lit ? 1 : 0, r.next(), 0], uvs: u, skip: ['-y'] });
  // iron cage
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as Array<[number, number]>) {
    S.metal.boxMM(sx * w * 0.8 - 0.011, 0.045, sz * w * 0.8 - 0.011, sx * w * 0.8 + 0.011, h + 0.075, sz * w * 0.8 + 0.011, { tint: iron });
  }
  S.metal.boxMM(-w * 0.95, 0.03, -w * 0.95, w * 0.95, 0.065, w * 0.95, { tint: iron });
  S.metal.lathe([[w * 1.5, h + 0.075], [w * 1.0, h + 0.105], [w * 0.2, h + 0.17], [0.01, h + 0.2]], 4, { tint: iron });
  S.metal.lathe([[0.025, h + 0.2], [0.03, h + 0.225], [0.02, h + 0.245]], 6, { tint: iron });
  S.metal.sweep([[0, h + 0.24, 0], [0.0, h + 0.3, 0.0]], 0.012, 4, { tint: iron });
  return S;
}

/** Wrought-iron street lamp: tapered shaft, collars, curved arm with scroll, lantern hung at the end. */
export function lampPost(r: Rng, o: { height?: number; lit?: boolean } = {}): SlotSet {
  const S = new SlotSet();
  const H = o.height ?? rnd(r, 3.0, 3.4);
  S.stone.boxMM(-0.2, 0, -0.2, 0.2, 0.28, 0.2, { tint: [0.9, 0.9, 0.95], aoY: [0.6, 1] });
  S.stone.boxMM(-0.15, 0.28, -0.15, 0.15, 0.4, 0.15, { tint: [0.95, 0.95, 1], ao: 0.95 });
  S.metal.lathe([[0.1, 0.38], [0.07, 0.55], [0.05, 0.8], [0.04, H * 0.7], [0.032, H - 0.1]], 8, { tint: iron, aoY: [0.7, 1] });
  for (const y of [0.55, 1.1, H - 0.3]) S.metal.lathe([[0.05, y - 0.04], [0.085, y - 0.02], [0.085, y + 0.02], [0.05, y + 0.04]], 8, { tint: iron });
  // curved arm
  const path: V3[] = [];
  const reach = 0.52;
  for (let i = 0; i <= 10; i++) { const t = i / 10; path.push([reach * Math.sin(t * Math.PI * 0.5) * 1.0, H - 0.14 + 0.2 * Math.sin(t * Math.PI) * 0.8 - 0.05 * t, 0]); }
  S.metal.sweep(path, 0.02, 5, { tint: iron });
  // scroll
  const sc: V3[] = [];
  for (let i = 0; i <= 12; i++) { const t = i / 12, a = t * Math.PI * 1.7; sc.push([0.04 + 0.12 * (1 - t) * Math.cos(a) * 0.9, H - 0.55 + 0.12 * (1 - t) * Math.sin(a), 0]); }
  S.metal.sweep(sc, 0.011, 4, { tint: iron });
  S.metal.lathe([[0.0, H + 0.02], [0.05, H - 0.04], [0.05, H - 0.1]], 8, { tint: iron });
  // lantern hung from the arm end
  const L = lantern(r, o);
  S.with(mat([reach, H - 0.58, 0]), () => S.append(L));
  return S;
}

export function bollard(r: Rng): SlotSet {
  const S = new SlotSet();
  const k = rnd(r, 0.92, 1.1), h = rnd(r, 0.62, 0.78);
  const tint: V3 = [rnd(r, 0.8, 1), rnd(r, 0.8, 1), rnd(r, 0.85, 1.05)];
  S.stone.lathe([[0.2 * k, 0], [0.19 * k, 0.07], [0.15 * k, 0.1], [0.145 * k, h], [0.2 * k, h + 0.02], [0.2 * k, h + 0.1], [0.15 * k, h + 0.15], [0.07 * k, h + 0.2], [0.001, h + 0.22]], 8, { tint, aoY: [0.55, 1] });
  return S;
}
export function pot(r: Rng, o: { kind?: 'jar' | 'amphora' | 'bowl' } = {}): SlotSet {
  const S = new SlotSet();
  const kind = o.kind ?? r.pick(['jar', 'amphora', 'bowl'] as const);
  const t: V3 = [rnd(r, 0.92, 1.1), rnd(r, 0.74, 0.86), rnd(r, 0.6, 0.72)];
  const k = rnd(r, 0.85, 1.15);
  const prof: Array<[number, number]> = kind === 'amphora'
    ? [[0.001, 0], [0.07 * k, 0.01], [0.13 * k, 0.12], [0.16 * k, 0.3], [0.11 * k, 0.5], [0.06 * k, 0.6], [0.07 * k, 0.66], [0.09 * k, 0.7]]
    : kind === 'jar'
      ? [[0.001, 0], [0.09 * k, 0.01], [0.13 * k, 0.1], [0.14 * k, 0.2], [0.1 * k, 0.3], [0.08 * k, 0.34], [0.1 * k, 0.37]]
      : [[0.001, 0], [0.06 * k, 0.01], [0.15 * k, 0.1], [0.19 * k, 0.17]];
  S.plaster.lathe(prof, 10, { tint: t, aoY: [0.65, 1] });
  if (kind === 'amphora') for (const s of [-1, 1]) S.plaster.sweep([[s * 0.07 * k, 0.6, 0], [s * 0.15 * k, 0.55, 0], [s * 0.17 * k, 0.4, 0], [s * 0.15 * k, 0.28, 0]], 0.014, 4, { tint: t });
  return S;
}

export function basket(r: Rng, o: { fruit?: boolean } = {}): SlotSet {
  const S = new SlotSet();
  const R = rnd(r, 0.2, 0.28), H = rnd(r, 0.2, 0.3);
  S.timber.lathe([[R * 0.7, 0], [R, H * 0.5], [R * 1.05, H]], 10, { tint: [1.2, 0.95, 0.6], aoY: [0.7, 1] });
  S.timber.lathe([[R * 1.05, H], [R * 0.95, H - 0.02]], 10, { tint: [1.0, 0.8, 0.5] });
  if (o.fruit !== false) {
    const hue: V3[] = [[1.1, 0.72, 0.46], [0.95, 0.85, 0.62], [0.82, 0.72, 0.64], [1.0, 0.8, 0.5]];
    const c = r.pick(hue);
    for (let i = 0; i < 9; i++) { const a = r.range(0, 6.28), d = r.range(0, R * 0.7); S.cloth.blob(Math.cos(a) * d, H + 0.02, Math.sin(a) * d, 0.055, 0.05, 0.055, 6, 4, { tint: [c[0] * r.range(0.8, 1.1), c[1] * r.range(0.8, 1.1), c[2]] }); }
  }
  return S;
}

export function candle(): SlotSet {
  const S = new SlotSet();
  S.cloth.cylinder(0.018, 0, 0.12, 6, { tint: [1.2, 1.1, 0.9] });
  S.glow.box(0, 0.145, 0, 0.018, 0.04, 0.018, { tint: [1, 1, 1], aux: [0, 1, 0.3, 0], uvs: [0.06, 0.66, 0.2, 0.66, 0.2, 0.8, 0.06, 0.8] });
  return S;
}

export function stool(r: Rng): SlotSet {
  const S = new SlotSet();
  const h = rnd(r, 0.38, 0.5);
  S.timber.cylinder(0.2, h - 0.04, h, 8, { tint: [1, 0.9, 0.8] });
  for (let i = 0; i < 3; i++) { const a = (i / 3) * 6.28 + r.range(0, 1); S.timber.sweep([[Math.cos(a) * 0.17, h - 0.04, Math.sin(a) * 0.17], [Math.cos(a) * 0.23, 0, Math.sin(a) * 0.23]], 0.025, 5, { tint: [0.9, 0.85, 0.8] }); }
  return S;
}

export function bucket(r: Rng): SlotSet {
  const S = new SlotSet();
  const R = rnd(r, 0.15, 0.19), H = rnd(r, 0.25, 0.32);
  S.planks.lathe([[R * 0.8, 0], [R, H]], 10, { tint: [1, 0.9, 0.8], aoY: [0.7, 1] });
  S.metal.lathe([[R * 0.84, H * 0.25], [R * 0.86, H * 0.25 + 0.02]], 10, { tint: iron });
  S.metal.sweep(Array.from({ length: 9 }, (_, i) => { const a = (i / 8) * Math.PI; return [Math.cos(a) * R, H + Math.sin(a) * 0.14, 0] as V3; }), 0.007, 4, { tint: iron });
  return S;
}

export function chalkboard(r: Rng): SlotSet {
  const S = new SlotSet();
  const w = 0.62, h = 0.9;
  for (const s of [-1, 1]) S.with(mat([0, 0, 0]), () => {
    S.timber.boxMM(s * w * 0.5 - 0.025 + (s > 0 ? 0.0 : 0), 0, -0.2, s * w * 0.5 + 0.025, h, -0.17, { tint: [1, 0.9, 0.8], grain: 'y' });
  });
  S.with(mat([0, 0, 0.0], 0, 1, -0.2), () => {
    S.timber.boxMM(-w / 2, 0.02, -0.02, w / 2, h, 0.02, { tint: [0.9, 0.85, 0.8], grain: 'y' });
    S.dark.quad([-w / 2 + 0.04, 0.12, 0.022], [w / 2 - 0.04, 0.12, 0.022], [w / 2 - 0.04, h - 0.06, 0.022], [-w / 2 + 0.04, h - 0.06, 0.022], {});
    // chalk scribbles
    for (let i = 0; i < 6; i++) { const y = 0.2 + i * 0.1, x0 = -w / 2 + 0.1, x1 = x0 + r.range(0.15, 0.4); S.cloth.boxMM(x0, y, 0.023, x1, y + 0.012, 0.026, { tint: [1.8, 1.8, 1.7] }); }
  });
  return S;
}

export function hayBale(r: Rng): SlotSet {
  const S = new SlotSet();
  S.cloth.boxMM(-0.4, 0, -0.25, 0.4, 0.4, 0.25, { tint: [1.5, 1.2, 0.5], aoY: [0.6, 1] });
  S.timber.boxMM(-0.12, 0, -0.255, -0.1, 0.4, 0.255, { tint: [0.6, 0.5, 0.4] });
  S.timber.boxMM(0.1, 0, -0.255, 0.12, 0.4, 0.255, { tint: [0.6, 0.5, 0.4] });
  void r;
  return S;
}

export function planter(r: Rng): SlotSet {
  const S = new SlotSet();
  const w = rnd(r, 0.8, 1.2);
  S.planks.boxMM(-w / 2, 0, -0.22, w / 2, 0.34, 0.22, { tint: [0.8, 0.9, 0.8], aoY: [0.6, 1], grain: 'x' });
  S.dark.quad([-w / 2 + 0.03, 0.32, 0.19], [w / 2 - 0.03, 0.32, 0.19], [w / 2 - 0.03, 0.32, -0.19], [-w / 2 + 0.03, 0.32, -0.19], {});
  S.append(bush(r, { radius: 0.34, count: 26, y: 0.38, width: w }));
  return S;
}

/** Leafy clump built from alpha-cut leaf cards (leaf slot), cheap volume + sway. */
export function bush(r: Rng, o: { radius?: number; count?: number; y?: number; width?: number; hue?: V3 } = {}): SlotSet {
  const S = new SlotSet();
  const R = o.radius ?? 0.5, n = o.count ?? 40, y0 = o.y ?? 0;
  const hue = o.hue ?? [rnd(r, 0.6, 1.0), rnd(r, 0.9, 1.3), rnd(r, 0.5, 0.8)];
  const cells = 16;
  for (let i = 0; i < n; i++) {
    const a = r.range(0, 6.28), e = Math.acos(r.range(0.05, 1)), d = Math.cbrt(r.next()) * R;
    const px = Math.sin(e) * Math.cos(a) * d * (o.width ? o.width / (2 * R) : 1), py = y0 + Math.cos(e) * d * 0.8 + R * 0.35, pz = Math.sin(e) * Math.sin(a) * d;
    const size = r.range(0.2, 0.34);
    const c = Math.floor(r.next() * cells);
    const [u0, v0, u1, v1] = atlasRect(c % 4, Math.floor(c / 4), 4, 4, 0.002);
    const yaw = r.range(0, 6.28), pitch = r.range(-0.9, 0.9), roll = r.range(-0.6, 0.6);
    const lightness = 0.6 + 0.6 * (py - y0) / (R * 1.4 + 0.01);
    S.with(mat([px, py, pz], yaw, 1, pitch, roll), () => {
      S.leaf.quad([-size / 2, -size / 2, 0], [size / 2, -size / 2, 0], [size / 2, size / 2, 0], [-size / 2, size / 2, 0], { uvs: [u0, v0, u1, v0, u1, v1, u0, v1], tint: [hue[0] * lightness, hue[1] * lightness, hue[2] * lightness], ao: 0.5 + 0.5 * Math.min(1, (py - y0) / R), aux: [0.8 * Math.min(1, (py - y0) / R + 0.2), 0, r.next(), 0] });
    });
  }
  return S;
}


/** Two-wheeled merchant cart with a canvas hood, shafts and a small load. Origin = ground below the bed centre, +x = shafts. */
export function cart(r: Rng): SlotSet {
  const S = new SlotSet();
  const R = 0.52, bedY = 0.62, wood: V3 = [0.9, 0.8, 0.72];
  for (const s of [-1, 1]) {
    S.with(mat([0, R, s * 0.62]), () => {
      const rim: V3[] = [];
      for (let i = 0; i <= 24; i++) { const a = (i / 24) * Math.PI * 2; rim.push([Math.cos(a) * R, Math.sin(a) * R, 0]); }
      S.timber.sweep(rim, 0.045, 5, { tint: wood });
      S.metal.sweep(rim.map((p) => [p[0] * 1.04, p[1] * 1.04, p[2]] as V3), 0.012, 4, { tint: [1, 1, 1] });
      for (let k = 0; k < 8; k++) S.with(mat([0, 0, 0], 0, 1, 0, (k / 8) * Math.PI), () => S.timber.boxMM(-R, -0.03, -0.03, R, 0.03, 0.03, { tint: wood, grain: 'x' }));
      S.with(mat([0, 0, 0], 0, 1, Math.PI / 2), () => S.timber.cylinder(0.08, -0.08, 0.08, 8, { tint: wood }));
    });
  }
  S.timber.boxMM(-0.05, R - 0.03, -0.66, 0.05, R + 0.03, 0.66, { tint: wood, grain: 'z' });
  S.planks.boxMM(-1.0, bedY, -0.56, 0.95, bedY + 0.1, 0.56, { tint: [0.85, 0.75, 0.66], grain: 'x', aoY: [0.5, 1] });
  for (const z of [-0.56, 0.56]) S.planks.boxMM(-1.0, bedY + 0.1, z - 0.03, 0.95, bedY + 0.42, z + 0.03, { tint: [0.85, 0.75, 0.66], grain: 'x' });
  S.planks.boxMM(-1.0, bedY + 0.1, -0.56, -0.95, bedY + 0.42, 0.56, { tint: [0.85, 0.75, 0.66], grain: 'z' });
  for (const z of [-0.2, 0.2]) S.timber.boxMM(0.95, bedY + 0.02, z - 0.04, 2.35, bedY + 0.1, z + 0.04, { tint: wood, grain: 'x' });
  S.timber.boxMM(2.3, 0.0, -0.3, 2.4, bedY + 0.1, 0.3, { tint: wood });
  // canvas hood on timber ribs
  const arc = (x: number, rad: number, n = 10): V3[] => Array.from({ length: n + 1 }, (_, i) => { const a = (i / n) * Math.PI; return [x, bedY + 0.42 + Math.sin(a) * rad, Math.cos(a) * 0.54] as V3; });
  const ribs = 5;
  for (let i = 0; i <= ribs; i++) S.timber.sweep(arc(-0.95 + (i * 1.6) / ribs, 0.62), 0.02, 4, { tint: wood });
  const rows: V3[][] = [];
  for (let i = 0; i <= ribs; i++) rows.push(arc(-0.95 + (i * 1.6) / ribs, 0.64, 12));
  S.cloth.grid(rows, { tint: [0.85, 0.78, 0.62], flip: true, uvFn: (u, v) => [u * 2, v * 1.4], aux: [0.3, 0, r.next(), 0], ao: 0.9, swayFn: (_u, v) => 0.25 * Math.sin(v * Math.PI) });
  S.append(sack(r.fork('s1')), mat([0.55, bedY + 0.1, 0.1], 0.4));
  S.append(sack(r.fork('s2')), mat([0.3, bedY + 0.1, -0.25], 1.9, 0.9));
  return S;
}
/** Wooden street barrier (trestle): splayed A-frame legs, a top rail and a pale painted board (ivory catches
 *  the lantern light, so the barrier reads at a distance). Origin = ground centre, rail along local x, width w. */
export function trestle(r: Rng, w = 2.6): SlotSet {
  const S = new SlotSet();
  const wood: V3 = [0.84, 0.82, 0.84], paint: V3 = [0.9, 0.88, 0.84];
  for (const sx of [-1, 1]) {
    const x = sx * (w / 2 - 0.22);
    for (const sz of [-1, 1]) S.with(mat([x, 0.5, sz * 0.17], 0, 1, -sz * 0.34), () => S.timber.boxMM(-0.045, -0.53, -0.045, 0.045, 0.53, 0.045, { tint: wood, grain: 'y', aoY: [0.6, 1] }));
    S.timber.boxMM(x - 0.04, 0.42, -0.2, x + 0.04, 0.5, 0.2, { tint: wood, grain: 'z' });
  }
  S.timber.boxMM(-w / 2, 0.96, -0.06, w / 2, 1.08, 0.06, { tint: wood, grain: 'x', ao: 0.95 });
  S.plaster.boxMM(-w / 2 + 0.1, 0.6, -0.1, w / 2 - 0.1, 0.9, 0.1, { tint: [paint[0] * r.range(0.96, 1.04), paint[1], paint[2]], ao: 0.92 });
  return S;
}

/** Moored canal boat: lofted hull (outer + inner skin), thwarts, a mast whose yard carries the furled sail,
 *  a stern lantern post and a little cargo. Origin = waterline centre, +x = bow. Returns attachment points. */
export function boat(r: Rng): { S: SlotSet; lantern: V3; yard: V3; bow: V3; stern: V3 } {
  const S = new SlotSet();
  const L = 7.4, W = 2.3, N = 16;
  const paint: V3 = [0.48, 0.54, 0.68], inner: V3 = [0.36, 0.38, 0.44], wood: V3 = [0.8, 0.8, 0.86];
  const across: Array<[number, number]> = [[-1, 1], [-0.95, 0.12], [-0.62, -0.3], [0, -0.42], [0.62, -0.3], [0.95, 0.12], [1, 1]];
  const sec = (t: number) => ({ x: -L / 2 + L * t, w: (W / 2) * Math.pow(Math.sin(Math.PI * (0.1 + 0.9 * t)), 0.55), sheer: 0.6 + 0.32 * Math.pow(2 * t - 1, 2) });
  const ring = (t: number, k: number, dy: number): V3[] => { const s = sec(t); return across.map(([a, h]) => [s.x, (h > 0.5 ? s.sheer : h) + dy, a * s.w * k] as V3); };
  for (let i = 0; i < N; i++) {
    const A = ring(i / N, 1, 0), Bq = ring((i + 1) / N, 1, 0), Ai = ring(i / N, 0.92, 0.05), Bi = ring((i + 1) / N, 0.92, 0.05);
    for (let j = 0; j < across.length - 1; j++) {
      const c: V3 = [(A[j][0] + Bq[j + 1][0]) / 2, (A[j][1] + Bq[j + 1][1]) / 2, (A[j][2] + Bq[j + 1][2]) / 2];
      const out: V3 = [0, c[1] - 0.25, c[2]];
      quadFacing(S.planks, [A[j], Bq[j], Bq[j + 1], A[j + 1]], out, { tint: paint, grain: 'x', ao: 0.9 });
      quadFacing(S.planks, [Ai[j], Bi[j], Bi[j + 1], Ai[j + 1]], [-out[0], -out[1], -out[2]], { tint: inner, grain: 'x', ao: 0.6 });
    }
    // gunwale caps join the two skins
    for (const j of [0, across.length - 1]) quadFacing(S.timber, [A[j], Bq[j], Bi[j], Ai[j]], [0, 1, 0], { tint: wood, grain: 'x' });
  }
  // floorboards, thwarts, stem
  for (let i = 1; i < N - 1; i++) {
    const a = sec(i / N), b = sec((i + 1) / N);
    S.planks.quad([a.x, -0.12, -a.w * 0.62], [a.x, -0.12, a.w * 0.62], [b.x, -0.12, b.w * 0.62], [b.x, -0.12, -b.w * 0.62], { tint: inner, grain: 'x', ao: 0.55, flip: true });
  }
  for (const x of [-1.6, 0.25, 2.0]) { const w = sec((x + L / 2) / L).w * 0.9; S.planks.boxMM(x - 0.16, 0.34, -w, x + 0.16, 0.4, w, { tint: wood, grain: 'z', ao: 0.85 }); }
  S.timber.sweep([[L / 2 - 0.05, 0.5, 0], [L / 2 + 0.12, 1.0, 0], [L / 2 + 0.08, 1.25, 0]], 0.06, 5, { tint: wood });
  // mast, yard and furled sail (ivory canvas, the reference's pale accent)
  const mx = 0.9;
  const yardY = 5.7;
  // local part 1 = the rig (mast, yard, sail): the one piece of the boat that stands between the camera and the quay
  S.inPart(1, () => {
    S.with(mat([mx, yardY, 0], 0, 1, Math.PI / 2), () => S.timber.cylinder(0.05, -1.75, 1.75, 6, { tint: wood }));
    S.cloth.blob(mx + 0.06, yardY - 0.12, 0, 0.13, 0.17, 1.55, 8, 6, { tint: [0.66, 0.64, 0.6], ao: 0.85, lump: (nx, _ny, nz) => 1 + 0.12 * Math.sin(nz * 9 + nx * 3) });
    S.with(mat([mx, 0, 0]), () => S.timber.cylinder(0.085, -0.3, 6.5, 8, { tint: wood, r1: 0.06 }));
  });
  // stern lantern post
  const sx = -L / 2 + 0.5;
  S.timber.boxMM(sx - 0.05, 0.4, -0.05, sx + 0.05, 2.05, 0.05, { tint: wood, grain: 'y' });
  S.metal.boxMM(sx - 0.02, 1.98, -0.02, sx + 0.38, 2.02, 0.02, { tint: [1, 1, 1] });
  // a little cargo near the bow
  S.append(crate(r.fork('bc1')), mat([2.6, -0.12, -0.3], 0.3, 0.9));
  S.append(sack(r.fork('bs1')), mat([2.7, -0.12, 0.42], 1.1));
  S.append(barrel(r.fork('bb1'), { lying: true }), mat([-0.7, -0.12, 0.1], 0.2, 0.9));
  return { S, lantern: [sx + 0.36, 1.48, 0], yard: [mx - 0.14, yardY - 0.05, 0], bow: [L / 2 - 0.4, 0.75, 0], stern: [-L / 2 + 0.3, 0.75, 0] };
}

export function emblemRect(kind: EmblemKind): [number, number, number, number] {
  const idx = EMBLEM_CELLS[kind];
  return atlasRect(idx % 4, Math.floor(idx / 4), 4, 2, 0.01);
}

export const PROP_BUILDERS: Record<string, (r: Rng, v: number) => SlotSet> = {
  barrel: (r) => barrel(r), barrelOpen: (r) => barrel(r, { open: true }), barrelLying: (r) => barrel(r, { lying: true }),
  crate: (r) => crate(r), sack: (r) => sack(r), lantern: (r) => lantern(r), lanternDark: (r) => lantern(r, { lit: false }), lampPost: (r) => lampPost(r), bollard: (r) => bollard(r),
  pot: (r) => pot(r), basket: (r) => basket(r), planter: (r) => planter(r), stool: (r) => stool(r), bucket: (r) => bucket(r), hay: (r) => hayBale(r), chalkboard: (r) => chalkboard(r),
};

export interface PropInstance { pos: V3; yaw: number; scale?: number | V3; tint?: V3; pitch?: number; roll?: number }

/** Collects instances per prop prototype and emits InstancedMeshes sharing the district materials. */
export class InstanceBatch {
  private protos = new Map<string, { slots: Record<Slot, THREE.BufferGeometry | null>; inst: PropInstance[] }>();
  constructor(private seed: number, private variantsPerKind = 3) {}

  add(kind: string, inst: PropInstance, variantHint?: number): void {
    const v = variantHint ?? Math.floor(((Math.sin((inst.pos[0] * 12.9898 + inst.pos[2] * 78.233 + this.seed) * 43758.5453) % 1 + 1) % 1) * this.variantsPerKind);
    const key = `${kind}#${v}`;
    let p = this.protos.get(key);
    if (!p) {
      const S = PROP_BUILDERS[kind](new Rng(this.seed).fork(key), v);
      const slots = {} as Record<Slot, THREE.BufferGeometry | null>;
      for (const s of SLOTS) slots[s] = S.get(s).vertexCount > 0 ? S.get(s).toGeometry() : null;
      p = { slots, inst: [] };
      this.protos.set(key, p);
    }
    p.inst.push(inst);
  }

  get instanceCount(): number { let n = 0; for (const p of this.protos.values()) n += p.inst.length; return n; }

  build(mats: Record<Slot, THREE.ShaderMaterial>, castShadow: (m: THREE.Object3D, slot: Slot) => void): THREE.Group {
    const g = new THREE.Group();
    g.name = 'instanced-props';
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    for (const [key, p] of this.protos) {
      for (const s of SLOTS) {
        const geo = p.slots[s];
        if (!geo || !p.inst.length) continue;
        const im = new THREE.InstancedMesh(geo, mats[s], p.inst.length);
        im.name = `${key}:${s}`;
        const col = new THREE.Color();
        p.inst.forEach((it, i) => {
          e.set(it.pitch ?? 0, it.yaw, it.roll ?? 0, 'YXZ'); q.setFromEuler(e);
          const sc = it.scale ?? 1; const sv = typeof sc === 'number' ? [sc, sc, sc] : sc;
          m.compose(new THREE.Vector3(...it.pos), q, new THREE.Vector3(sv[0], sv[1], sv[2]));
          im.setMatrixAt(i, m);
          const t = it.tint ?? [1, 1, 1]; col.setRGB(t[0], t[1], t[2], THREE.LinearSRGBColorSpace);
          im.setColorAt(i, col);
        });
        im.instanceMatrix.needsUpdate = true;
        if (im.instanceColor) im.instanceColor.needsUpdate = true;
        im.frustumCulled = false;
        castShadow(im, s);
        g.add(im);
      }
    }
    return g;
  }

  dispose(): void { for (const p of this.protos.values()) for (const g of Object.values(p.slots)) g?.dispose(); this.protos.clear(); }
}
