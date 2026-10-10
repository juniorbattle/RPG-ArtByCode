import { Rng } from '../core/rng';
import { mat, type V3, type Slot } from '../core/MeshBuilder';
import { BuildCtx, type BuildingParams, type BuildingPart, type BuildingResult, type Palette, type PaletteName } from './Types';
import {
  PZ, BEAM_BACK, BEAM_FRONT, beam, brace, panelWithHole, qz, windowModule, doorModule, shopOpening, balcony, hangingSign, lampBracket, frameStuds,
  pickWindowKind, shopTypeAwning, shopToInterior, shopToEmblem,
} from './FacadeGrammar';
import { buildRoof, addDormers, chimney, type RoofSpec } from './RoofGenerator';

/** MerchantDistrictBuildingGenerator: deterministic, grammar-driven timber-and-stone merchant houses.
 *  The art direction lives in the rules: jettied upper floors, leaning posts, stone plinth and quoins,
 *  heavy roof overhangs, asymmetric bays and a lived-in shopfront. */

/** shutter / door paints: all desaturated slate and weathered timber, no saturated accents (the amber light is the accent) */
const PAINT = {
  natural: [0.82, 0.82, 0.86] as V3, slate: [0.62, 0.74, 1.0] as V3, indigo: [0.5, 0.6, 1.12] as V3, ash: [0.9, 0.94, 1.02] as V3,
};

function makePalette(name: PaletteName, rng: Rng): Palette {
  const base: Record<PaletteName, { plaster: V3; roof: V3 }> = {
    slate: { plaster: [0.8, 0.88, 1.04], roof: [0.84, 0.9, 1.06] },
    ash: { plaster: [0.9, 0.93, 0.98], roof: [0.88, 0.92, 1.02] },
    mist: { plaster: [0.84, 0.9, 1.0], roof: [0.8, 0.88, 1.04] },
    ivory: { plaster: [1.0, 0.98, 0.94], roof: [0.86, 0.9, 1.0] },
    dusk: { plaster: [0.78, 0.82, 0.98], roof: [0.78, 0.84, 1.04] },
    stone: { plaster: [0.88, 0.9, 0.94], roof: [0.9, 0.92, 1.0] },
    /** foreground framing masses: darker so they frame the shot instead of competing with it */
    shadow: { plaster: [0.5, 0.55, 0.68], roof: [0.7, 0.76, 0.9] },
  };
  const b = base[name];
  const j = (v: V3, a: number): V3 => [v[0] * (1 + (rng.next() - 0.5) * a), v[1] * (1 + (rng.next() - 0.5) * a), v[2] * (1 + (rng.next() - 0.5) * a)];
  const shutter = rng.weighted([PAINT.slate, PAINT.indigo, PAINT.natural, PAINT.ash], [3, 2, 3, 1]);
  return {
    plaster: j(b.plaster, 0.04), timber: j([0.86, 0.86, 0.9], 0.08), stone: j([0.96, 0.98, 1.04], 0.06), roof: j(b.roof, 0.05),
    awning: [0.3, 0.32, 0.38], shutter, trim: [1, 1, 1], brick: j([0.92, 0.92, 0.96], 0.06),
  };
}

interface Floor { k: number; y0: number; y1: number; x0: number; x1: number; zF: number }
interface Bay { x0: number; x1: number; kind: 'window' | 'door' | 'shop' | 'blank' | 'balcony' | 'arch' | 'open' }

function splitBays(rng: Rng, x0: number, x1: number, target: number, minW = 1.15): number[] {
  const W = x1 - x0;
  const n = Math.max(1, Math.round(W / target));
  const w: number[] = []; let s = 0;
  for (let i = 0; i < n; i++) { const v = 0.8 + rng.next() * 0.45; w.push(v); s += v; }
  const b = [x0]; let acc = x0;
  for (let i = 0; i < n; i++) { acc += (w[i] / s) * W; b.push(acc); }
  b[n] = x1;
  if (n > 1 && (b[1] - b[0] < minW || b[n] - b[n - 1] < minW)) return splitBays(rng.fork(1), x0, x1, target + 0.4, minW);
  return b;
}

export function createMerchantBuilding(input: BuildingParams): BuildingResult {
  const rng = new Rng(input.seed);
  const p: BuildingParams = {
    verticality: 1, roofExaggeration: 1, detail: 1, lit: 0.66, dormers: 0, ...input,
    depth: input.depth ?? Math.min(8, Math.max(5, input.width * 0.95)),
    sides: input.sides ?? { left: true, right: true },
  };
  const pal = makePalette(p.palette ?? rng.pick<PaletteName>(['slate', 'ash', 'mist', 'ivory', 'dusk', 'stone']), rng.fork('pal'));
  pal.awning = shopTypeAwning(new BuildCtx(p, rng.fork('aw'), pal), p.shopType);
  if (p.roofTint) pal.roof = p.roofTint;
  const ctx = new BuildCtx(p, rng.fork('mod'), pal);
  const S = ctx.S;
  const W = p.width, D = p.depth!;
  const vert = p.verticality!;
  const forge = !!p.forgeBay;
  const hG = (forge ? 3.75 : p.shopType === 'house' ? 2.8 : 3.15) * vert;
  const hU = 2.55 * vert;
  const asym = p.asymmetry;
  const detail = p.detail!;

  // ---------------------------------------------------------------- volumes
  const floors: Floor[] = [];
  let y = 0, zF = 0;
  for (let k = 0; k < p.floors; k++) {
    const h = k === 0 ? hG : hU * (0.95 + rng.next() * 0.1);
    let x0 = -W / 2, x1 = W / 2;
    if (k > 0) {
      const dl = (rng.next() - 0.45) * asym * 0.9, dr = (rng.next() - 0.45) * asym * 0.9;
      x0 = floors[0].x0 + dl; x1 = floors[0].x1 + dr;
      if (x1 - x0 < W * 0.7) { x0 = -W * 0.35; x1 = W * 0.35; }
      zF += p.overhang * (0.28 + rng.next() * 0.26);
    }
    floors.push({ k, y0: y, y1: y + h, x0, x1, zF });
    y += h;
  }
  const top = floors[floors.length - 1];

  // ---------------------------------------------------------------- walls
  const wallLayout = (F: Floor): Bay[] => {
    const r = ctx.rng;
    if (F.k > 0) {
      const b = splitBays(r, F.x0, F.x1, 1.95);
      const bays: Bay[] = [];
      for (let i = 0; i < b.length - 1; i++) bays.push({ x0: b[i], x1: b[i + 1], kind: r.bool(0.12 + (1 - p.timberRatio) * 0.05) && b[i + 1] - b[i] > 1.3 ? 'blank' : 'window' });
      if (p.balcony && F.k === 1) { const wide = bays.map((q, i) => [q, i] as const).filter(([q]) => q.x1 - q.x0 > 1.5); if (wide.length) wide[Math.floor(r.next() * wide.length)][0].kind = 'balcony'; }
      return bays;
    }
    // ground floor
    const bays: Bay[] = [];
    if (forge) {
      const bayW = Math.min(4.2, W * 0.58);
      const rest = F.x1 - bayW - F.x0, dw = Math.min(1.3, rest * 0.42);
      bays.push({ x0: F.x0, x1: F.x0 + dw + 0.4, kind: 'window' });
      bays.push({ x0: F.x0 + dw + 0.4, x1: F.x1 - bayW, kind: 'door' });
      bays.push({ x0: F.x1 - bayW, x1: F.x1, kind: 'open' });
      return bays;
    }
    const doorW = p.shopType === 'guild' ? 1.7 : 1.2;
    const hasShop = p.shopType !== 'house' && p.shopType !== 'guild';
    const shopW = hasShop ? Math.min(3.6, Math.max(2.3, W * 0.46)) : 0;
    let rest = W - shopW - doorW;
    const nWin = Math.max(0, Math.floor(rest / 1.5));
    const shopLeft = r.bool();
    const seq: Array<{ w: number; kind: Bay['kind'] }> = [];
    const wins: Array<{ w: number; kind: Bay['kind'] }> = [];
    for (let i = 0; i < nWin; i++) wins.push({ w: rest / nWin, kind: 'window' });
    if (!nWin) rest = 0;
    const doorBay = { w: doorW + (nWin ? 0 : (W - shopW - doorW)), kind: (p.shopType === 'guild' ? 'arch' : 'door') as Bay['kind'] };
    if (p.shopType === 'guild' || !hasShop) {
      const half = Math.ceil(nWin / 2);
      seq.push(...wins.slice(0, half), doorBay, ...wins.slice(half));
    } else if (shopLeft) seq.push({ w: shopW, kind: 'shop' }, doorBay, ...wins);
    else seq.push(...wins, doorBay, { w: shopW, kind: 'shop' });
    let acc = F.x0;
    const sumW = seq.reduce((a, s) => a + s.w, 0);
    for (const s of seq) { const w = (s.w / sumW) * (F.x1 - F.x0); bays.push({ x0: acc, x1: acc + w, kind: s.kind }); acc += w; }
    return bays;
  };

  /** Build the wall in the current wall-local frame. x spans xa..xb, plane z=0. `edge` (side walls) names the
   *  end that meets the street front: the corner post, rails and plinth that cap the frontage there go into the
   *  front part, so the visibility bake judges the side wall by its own faces only. */
  const buildWall = (F: Floor, role: 'front' | 'side' | 'back', xa: number, xb: number, visible: boolean, edge?: { part: number; at: 'a' | 'b' }) => {
    const r = ctx.rng;
    const t = ctx.tint(pal.plaster, 0.04);
    const groundStone = F.k === 0 && (p.stoneGround || forge);
    const wallSlot: Slot = groundStone ? 'stone' : 'plaster';
    const wallTint = groundStone ? pal.stone : t;
    const plinth = F.k === 0 && !groundStone && role !== 'back' ? 0.95 : 0;
    const railH = 0.15;
    const y0 = F.y0, y1 = F.y1;
    const atEdge = (fn: () => void) => (edge ? S.inPart(edge.part, fn) : fn());
    // floor rails
    atEdge(() => {
      beam(ctx, xa, y0, BEAM_BACK, xb, y0 + (F.k > 0 ? 0.24 : 0.12), BEAM_FRONT + (F.k > 0 ? 0.03 : 0), pal.timber, 'timber', 0.85);
      beam(ctx, xa, y1 - railH, BEAM_BACK, xb, y1, BEAM_FRONT, pal.timber, 'timber', 0.95);
    });
    if (!visible || role === 'back') {
      qz(S.get(wallSlot), xa, y0, xb, y1, PZ, [0.8, 0.8, 0.95, 0.95], wallTint);
      const n = Math.max(1, Math.round((xb - xa) / 2.2));
      for (let i = 0; i <= n; i++) {
        const x = xa + ((xb - xa) * i) / n, post = () => beam(ctx, x - 0.07, y0, BEAM_BACK, x + 0.07, y1, BEAM_FRONT, pal.timber);
        if ((edge?.at === 'a' && i === 0) || (edge?.at === 'b' && i === n)) atEdge(post); else post();
      }
      return;
    }
    let bays: Bay[];
    if (role === 'front') bays = wallLayout(F);
    else {
      const b = splitBays(r, xa, xb, F.k === 0 ? 2.2 : 2.0, 1.0);
      bays = [];
      for (let i = 0; i < b.length - 1; i++) bays.push({ x0: b[i], x1: b[i + 1], kind: r.bool(F.k === 0 ? 0.35 : 0.7) ? 'window' : 'blank' });
    }
    // posts
    for (let i = 0; i < bays.length; i++) {
      const bx = bays[i].x0;
      const corner = i === 0;
      const post = () => beam(ctx, bx - (corner ? 0.0 : 0.07), y0, BEAM_BACK - (corner ? 0.03 : 0), bx + (corner ? 0.22 : 0.07), y1, BEAM_FRONT + (corner ? 0.03 : 0), pal.timber, 'timber', 0.9);
      if (corner && edge?.at === 'a') atEdge(post); else post();
    }
    const lastPost = () => beam(ctx, bays[bays.length - 1].x1 - 0.22, y0, BEAM_BACK - 0.03, bays[bays.length - 1].x1, y1, BEAM_FRONT + 0.03, pal.timber, 'timber', 0.9);
    if (edge?.at === 'b') atEdge(lastPost); else lastPost();
    const py0 = y0 + (F.k > 0 ? 0.24 : 0.12) + plinth * (F.k === 0 ? 1 : 0) - (plinth > 0 ? 0.12 : 0), py1 = y1 - railH;
    const floorH = y1 - y0;
    for (const bay of bays) {
      const bx0 = bay.x0 + (bay === bays[0] ? 0.22 : 0.07), bx1 = bay.x1 - (bay === bays[bays.length - 1] ? 0.22 : 0.07);
      const bw = bx1 - bx0, cx = (bx0 + bx1) / 2;
      const lit = r.bool(p.lit!);
      if (bay.kind === 'open') {
        // handled by the forge builder; plinth stone only
        continue;
      }
      if (bay.kind === 'shop') {
        const hole = shopOpening(ctx, bx0, bx1, y0 + 0.02, Math.min(2.35, floorH - 0.75), { interior: shopToInterior[p.shopType], awningTint: pal.awning, stripes: p.shopType !== 'smith' && r.bool(0.55), slotWall: wallSlot });
        panelWithHole(ctx, wallSlot, bx0, hole[3] + 0.3, bx1, py1, null, wallTint, 0.8);
        // flank walls beside the opening
        continue;
      }
      if (bay.kind === 'door' || bay.kind === 'arch') {
        const dh = bay.kind === 'arch' ? Math.min(2.7, floorH - 0.5) : Math.min(2.15, floorH - 0.6);
        const hole = doorModule(ctx, cx - bw * (bay.kind === 'arch' ? 0.42 : 0.4), cx + bw * (bay.kind === 'arch' ? 0.42 : 0.4), y0, dh, { open: r.bool(p.shopType === 'guild' ? 0.7 : 0.25), double: bay.kind === 'arch', arched: bay.kind === 'arch' });
        panelWithHole(ctx, wallSlot, bx0, y0, bx1, py1, hole, wallTint);
        continue;
      }
      if (bay.kind === 'balcony') {
        const dh = 1.95, hole: [number, number, number, number] = [cx - 0.42, y0 + 0.1, cx + 0.42, y0 + 0.1 + dh];
        panelWithHole(ctx, wallSlot, bx0, py0, bx1, py1, hole, wallTint);
        S.glow.quad([hole[0], hole[1], PZ - 0.16], [hole[2], hole[1], PZ - 0.16], [hole[2], hole[3], PZ - 0.16], [hole[0], hole[3], PZ - 0.16], { uvs: [0.0, 0.5, 0.25, 0.5, 0.25, 1, 0, 1], tint: [1, 1, 1], aux: [0, 1, r.next(), 0], ao: 1 });
        beam(ctx, hole[0] - 0.08, hole[1], BEAM_BACK, hole[0], hole[3] + 0.1, BEAM_FRONT, pal.timber);
        beam(ctx, hole[2], hole[1], BEAM_BACK, hole[2] + 0.08, hole[3] + 0.1, BEAM_FRONT, pal.timber);
        beam(ctx, hole[0] - 0.08, hole[3], BEAM_BACK, hole[2] + 0.08, hole[3] + 0.12, BEAM_FRONT, pal.timber);
        balcony(ctx, bx0 + 0.05, bx1 - 0.05, y0 + 0.1);
        continue;
      }
      if (bay.kind === 'blank') {
        panelWithHole(ctx, wallSlot, bx0, py0, bx1, py1, null, wallTint, 0.84);
        frameStuds(ctx, bx0, py0, bx1, py1, p.timberRatio);
        continue;
      }
      // window bay(s)
      const sizeW = Math.min(0.95, Math.max(0.55, bw * 0.5));
      const wh = (1.05 + r.next() * 0.2) * Math.min(1.1, vert);
      const sill = py0 + (py1 - py0) * 0.34 + (F.k === 0 ? 0.0 : 0.04);
      const wy = Math.min(sill, py1 - wh - 0.25);
      const pair = bw > 2.5;
      const centers = pair ? [cx - bw * 0.25, cx + bw * 0.25] : [cx];
      const stoneTrim = groundStone;
      const holes: Array<[number, number, number, number]> = [];
      for (const c of centers) {
        const kind = pickWindowKind(ctx, lit, groundStone && r.bool(0.5));
        const sh = detail > 0.6 ? r.weighted<'none' | 'open' | 'closed'>(['none', 'open', 'closed'], [0.55, 0.3, 0.15]) : 'none';
        holes.push(windowModule(ctx, c, wy, sizeW, wh, { kind, shutters: sh, flowerbox: false, trim: stoneTrim ? 'stone' : 'timber', floor: F.k }, wallSlot));
      }
      // panel with (up to) two holes: split at the middle
      if (holes.length === 1) panelWithHole(ctx, wallSlot, bx0, py0, bx1, py1, holes[0], wallTint, 0.84, 0.62);
      else {
        const mid = (bx0 + bx1) / 2;
        panelWithHole(ctx, wallSlot, bx0, py0, mid, py1, holes[0], wallTint, 0.84, 0.62);
        panelWithHole(ctx, wallSlot, mid, py0, bx1, py1, holes[1], wallTint, 0.84, 0.62);
      }
      if (!groundStone) frameStuds(ctx, bx0, py0, bx1, wy, p.timberRatio, undefined);
      if (!groundStone && p.timberRatio > 0.55 && detail > 0.5) brace(ctx, bx0, py1 - 0.02, bx0 + 0.55, py1 - 0.55, 0.09);
    }
    // stone plinth under the whole timber ground floor (skips shop & door)
    if (plinth > 0) atEdge(() => {
      let xc = xa;
      const gaps = bays.filter((b) => b.kind === 'shop' || b.kind === 'door').sort((a, b) => a.x0 - b.x0);
      const seg = (a: number, b: number) => { if (b - a > 0.05) S.stone.boxMM(a, 0, PZ - 0.03, b, plinth, BEAM_FRONT + 0.05, { tint: pal.stone, aoY: [0.55, 0.95] }); };
      for (const g of gaps) { seg(xc, g.x0 + (g.kind === 'shop' ? 0.0 : 0.07)); xc = g.x1 - (g.kind === 'shop' ? 0.0 : 0.07); }
      seg(xc, xb);
      S.stone.boxMM(xa, plinth - 0.02, PZ - 0.04, xb, plinth + 0.07, BEAM_FRONT + 0.09, { tint: pal.stone, ao: 0.95 });
    });
  };

  // ---------------------------------------------------------------- assemble floors
  // every wall of every floor is its own visibility part: the district's camera-graph bake keeps only the parts
  // an authored view (or a blend between views) can see. Back walls are not generated at all: every authored
  // camera stands on the canal side of the frontage, and they face away from the moon (no shadow either).
  const parts: BuildingPart[] = [];
  const part = (role: BuildingPart['role'], floor: number) => { parts.push({ role, floor }); return parts.length; };
  const floorParts: Array<{ left: number; right: number; front: number }> = [];
  for (const F of floors) {
    const front = F.zF;
    const fp = { front: part('front', F.k), left: part('left', F.k), right: part('right', F.k) };
    floorParts.push(fp);
    S.frame.part = fp.front;
    S.with(mat([0, 0, front]), () => buildWall(F, 'front', F.x0, F.x1, true));
    S.inPart(fp.left, () => S.with(mat([F.x0, 0, 0], -Math.PI / 2), () => buildWall(F, 'side', -D, front, p.sides!.left && detail > 0.2, { part: fp.front, at: 'b' })));
    S.inPart(fp.right, () => S.with(mat([F.x1, 0, 0], Math.PI / 2), () => buildWall(F, 'side', forge && F.k === 0 ? Math.min(D - 1, 3.4) : -front, D, p.sides!.right && detail > 0.2, { part: fp.front, at: 'a' })));
    // (the skipped back wall's single random draw is kept so every seed still produces the same buildings)
    ctx.tint(pal.plaster, 0.04);
    if (F.k > 0) {
      const low = floors[F.k - 1];
      // underside of the jetty + joist ends + knee braces
      S.planks.quad([F.x0, F.y0 - 0.03, F.zF], [F.x1, F.y0 - 0.03, F.zF], [F.x1, F.y0 - 0.03, -D], [F.x0, F.y0 - 0.03, -D], { tint: [0.35, 0.3, 0.28], ao: 0.5, flip: true });
      const jet = F.zF - low.zF;
      // joist ends + knee braces only on the hero frontages: micro-detail is spent where the eye lands
      if (jet > 0.12 && detail > 0.6) {
        const n = Math.round((F.x1 - F.x0) / 0.55);
        for (let i = 0; i <= n; i++) {
          const x = F.x0 + ((F.x1 - F.x0) * i) / n;
          S.timber.boxMM(x - 0.05, F.y0 - 0.2, low.zF - 0.05, x + 0.05, F.y0 - 0.02, F.zF + 0.01, { tint: pal.timber, grain: 'z', ao: 0.6 });
        }
        for (const x of [F.x0 + 0.1, F.x1 - 0.1]) {
          const a = [x, F.y0 - 0.95, low.zF - 0.02] as V3, b = [x, F.y0 - 0.1, F.zF] as V3;
          const len = Math.hypot(b[1] - a[1], b[2] - a[2]), ang = Math.atan2(b[2] - a[2], b[1] - a[1]);
          S.with(mat([x, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], 0, 1, ang), () => {
            S.timber.boxMM(-0.05, -len / 2, -0.06, 0.05, len / 2, 0.06, { tint: pal.timber, grain: 'y', ao: 0.8 });
          });
        }
      }
    }
    S.frame.part = 0;
  }

  // ---------------------------------------------------------------- corner quoins (stone corners read as authored)
  /** stone corner blocks alternating long/short faces; dx/dz = direction from the corner into the wall */
  const quoin = (cx: number, cz: number, y0: number, y1: number, dx: number, dz: number) => {
    let i = 0;
    for (let y = y0; y < y1 - 0.1; y += 0.34, i++) {
      const longX = i % 2 === 0;
      const ax = longX ? 0.46 : 0.26, az = longX ? 0.26 : 0.46;
      const hh = Math.min(0.32, y1 - y);
      const j = 0.97 + ctx.rng.next() * 0.06;
      const xa = dx > 0 ? cx - 0.09 : cx - ax, xb = dx > 0 ? cx + ax : cx + 0.09;
      const za = dz > 0 ? cz - 0.09 : cz - az, zb = dz > 0 ? cz + az : cz + 0.09;
      S.stone.boxMM(xa, y, za, xb, y + hh * j, zb, { tint: ctx.tint(pal.stone, 0.12), ao: 0.95 });
    }
  };
  const g0 = floors[0];
  const quoinTop = p.stoneGround || forge ? g0.y1 : Math.min(g0.y1, 1.0 + (rng.bool(0.5) ? hG : 0));
  const { front: front0, left: left0, right: right0 } = floorParts[0];
  if (detail > 0.55) {
    S.inPart(front0, () => { quoin(g0.x0, g0.zF, 0, quoinTop, 1, -1); quoin(g0.x1, g0.zF, 0, quoinTop, -1, -1); });
    if (p.sides!.left) S.inPart(left0, () => quoin(g0.x0, -D, 0, quoinTop * 0.8, 1, 1));
    if (p.sides!.right) S.inPart(right0, () => quoin(g0.x1, -D, 0, quoinTop * 0.8, -1, 1));
  }

  // ---------------------------------------------------------------- forge bay (static architecture)
  S.frame.part = forge ? part('forge', 0) : 0;
  const forgeInfo = forge ? buildForgeBay(ctx, g0, D, hG) : null;
  S.frame.part = part('roof', floors.length - 1);

  // ---------------------------------------------------------------- roof
  const pitchBase = p.roofStyle === 'leanto' ? 21 : p.roofStyle === 'hip' ? 36 : 39 + rng.range(-3, 6);
  const pitch = (pitchBase * Math.PI) / 180 * (0.82 + 0.18 * p.roofExaggeration!);
  const ex = p.roofExaggeration!;
  const roofSpec: RoofSpec = {
    style: p.roofStyle, x0: top.x0, x1: top.x1, zF: top.zF, zB: -D, yBase: top.y1, pitch: Math.min(1.25, pitch),
    ohF: forge ? 0.4 : (0.45 + rng.next() * 0.3) * ex, ohB: 0.4 * ex, ohS: (0.3 + rng.next() * 0.2) * ex,
    crook: p.roofStyle === 'crooked' ? 0.55 + asym * 0.6 : asym * 0.22,
  };
  const roof = buildRoof(ctx, roofSpec);
  if (p.roofStyle === 'gable' || p.roofStyle === 'crooked') addDormers(ctx, roof, roofSpec, p.dormers ?? 0);

  // ---------------------------------------------------------------- chimney
  if (p.chimney) {
    const cx = forge ? forgeInfo!.hx : top.x0 + (top.x1 - top.x0) * (0.2 + rng.next() * 0.6);
    const cz = forge ? forgeInfo!.hz - 0.05 : roof.zMid;
    const yb = forge ? 2.4 : roof.heightAt(cx, cz) - 0.4;
    chimney(ctx, cx, cz, yb, forge ? roof.heightAt(cx, cz) + 1.5 : roof.ridgeY + 0.9 + rng.next() * 0.5, forge ? 1.2 : 0.75 + rng.next() * 0.2, forge ? 1.0 : 0.7, forge || rng.bool(0.45));
  }

  // ---------------------------------------------------------------- shopfront dressing (sign, banners, lamps)
  S.frame.part = front0;
  S.with(mat([0, 0, g0.zF]), () => {
    const bays = ctx.rng.fork('dress');
    void bays;
    const sx = g0.x0 + (g0.x1 - g0.x0) * (0.2 + rng.next() * 0.6);
    if (p.shopType !== 'house') hangingSign(ctx, sx, hG - 0.55, 1.1, shopToEmblem[p.shopType]);
    if (floors.length > 1 && detail > 0.6) {
      const f1 = floors[1];
      lampBracket(ctx, f1.x1 - 0.5 - rng.next() * 0.3, f1.y0 + 1.3, 0.55, 'upper');
    }
    // banner pole / wall banner sockets on upper facade
    const bf = floors[Math.min(1, floors.length - 1)];
    ctx.socket('banner', [bf.x0 + 0.65 + rng.next() * 0.3, bf.y1 - 0.3, 0.05 + (bf.zF - g0.zF)], [0, 0, 1], { tag: p.shopType, width: 1.3 });
    ctx.socket('bunting', [g0.x0, top.y1 - 0.6, top.zF - g0.zF + 0.05], [0, 0, 1], { tag: 'left' });
    ctx.socket('bunting', [g0.x1, top.y1 - 0.6, top.zF - g0.zF + 0.05], [0, 0, 1], { tag: 'right' });
  });
  ctx.colliders.push([g0.x0 - 0.05, -D, g0.x1 + 0.05, 0.1]);
  S.frame.part = 0;

  const bounds = { w: W, d: D, h: roof.ridgeY };
  return {
    slots: S, parts, sockets: ctx.sockets, lights: ctx.lights, windows: ctx.windows, colliders: ctx.colliders, params: p,
    width: bounds.w, depth: bounds.d, height: bounds.h, ridgeY: roof.ridgeY, shopType: p.shopType,
    stats: { quads: S.triCount() / 2, windows: ctx.windows.length, modules: ctx.modules },
  };
}

/** Open forge bay (on the camera-facing right side so the fire is visible): stone hearth with brick hood, heavy lintel,
 *  porch posts under the deep lean-to eave. State-dependent props live in ForgeGenerator. */
function buildForgeBay(ctx: BuildCtx, g0: Floor, D: number, hG: number): { hx: number; hz: number; bx0: number; bx1: number; bayD: number } {
  const S = ctx.S, pal = ctx.pal;
  const bx1 = g0.x1, bx0 = g0.x1 - Math.min(4.2, (g0.x1 - g0.x0) * 0.58);
  const cx = (bx0 + bx1) / 2, bayD = Math.min(D - 0.5, 3.2);
  ctx.count('forgebay');
  // interior: dark slab, back wall, the left partition (right side stays open to the street)
  S.dark.quad([bx0, 0.03, 0], [bx1, 0.03, 0], [bx1, 0.03, -bayD], [bx0, 0.03, -bayD], { ao: 1 });
  S.stone.quad([bx1, 0, -bayD], [bx0, 0, -bayD], [bx0, hG, -bayD], [bx1, hG, -bayD], { tint: [0.6, 0.57, 0.57], ao: [0.45, 0.45, 0.8, 0.8] });
  S.stone.quad([bx0, 0, 0], [bx0, 0, -bayD], [bx0, hG, -bayD], [bx0, hG, 0], { tint: [0.55, 0.55, 0.55], ao: [0.6, 0.35, 0.5, 0.7], flip: true });
  // hearth: stone base, brick hood funnel
  const hx = cx + 0.3, hz = -bayD + 0.75, hw = 1.8;
  S.stone.boxMM(hx - hw / 2, 0, hz - 0.75, hx + hw / 2, 0.92, hz + 0.7, { tint: pal.stone, aoY: [0.6, 1] });
  S.stone.boxMM(hx - hw / 2 - 0.08, 0.92, hz - 0.77, hx + hw / 2 + 0.08, 1.04, hz + 0.78, { tint: pal.stone, ao: 0.95 });
  const hood = (y0: number, y1: number, a0: number, a1: number) => {
    const P0 = [[hx - a0, hz + 0.7], [hx + a0, hz + 0.7], [hx + a0, hz - 0.7], [hx - a0, hz - 0.7]];
    const P1 = [[hx - a1, hz + 0.1], [hx + a1, hz + 0.1], [hx + a1, hz - 0.5], [hx - a1, hz - 0.5]];
    for (let i = 1; i < 4; i++) { // i = 0 is the open mouth facing the street
      const a = P0[i], b = P0[(i + 1) % 4], c = P1[(i + 1) % 4], d = P1[i];
      S.brick.quad([a[0], y0, a[1]], [b[0], y0, b[1]], [c[0], y1, c[1]], [d[0], y1, d[1]], { tint: pal.brick, ao: [0.4, 0.4, 0.95, 0.95], flip: true });
    }
    S.dark.quad([hx - a1 * 1.0, y1, hz - 0.5], [hx + a1, y1, hz - 0.5], [hx + a1, y1, hz + 0.1], [hx - a1, y1, hz + 0.1], { ao: 1 });
  };
  hood(1.04, 2.5, hw / 2, 0.5);
  ctx.socket('forge', [hx, 1.0, hz + 0.65], [0, 0, 1], { tag: 'hearth' });
  ctx.socket('forge', [hx - 0.35, 0, hz + 1.55], [0, 0, 1], { tag: 'anvil' });
  ctx.socket('forge', [bx0 + 0.45, 0, -1.2], [1, 0, 0], { tag: 'rack' });
  ctx.socket('forge', [bx1 - 0.55, 0, -2.0], [-1, 0, 0], { tag: 'trough' });
  ctx.socket('prop', [cx, 0, 2.2], [0, 0, 1], { tag: 'forge-yard', width: bx1 - bx0 });
  // heavy lintel + stone pier at the partition + porch posts under the lean-to eave
  beam(ctx, bx0 - 0.12, 2.95, -0.12, bx1, 3.3, 0.16, pal.timber);
  S.stone.boxMM(bx0 - 0.12, 0, -0.12, bx0 + 0.3, 3.0, 0.22, { tint: pal.stone, aoY: [0.6, 1] });
  const pz = 0.22;
  for (const x of [bx0 + 0.35, bx1 - 0.25]) {
    beam(ctx, x - 0.12, 0.28, pz - 0.12, x + 0.12, 2.95, pz + 0.12, pal.timber);
    S.stone.boxMM(x - 0.2, 0, pz - 0.2, x + 0.2, 0.28, pz + 0.2, { tint: pal.stone, ao: 0.9 });
    ctx.S.with(mat([x, 2.95, 0]), () => { beam(ctx, -0.07, -0.2, 0.0, 0.07, 0.0, pz, pal.timber); });
    brace(ctx, x, 2.2, x, 2.95, 0.11);
  }
  beam(ctx, bx0 + 0.1, 2.88, pz - 0.1, bx1, 3.1, pz + 0.1, pal.timber);
  ctx.colliders.push([bx0 + 0.15, pz - 0.2, bx0 + 0.55, pz + 0.2], [bx1 - 0.45, pz - 0.2, bx1 - 0.05, pz + 0.2]);
  ctx.light({ pos: [cx, 2.3, 1.2], color: [1.0, 0.5, 0.2], intensity: 1.2, radius: 6, kind: 'fire', priority: 5, tag: 'forge-fill' });
  return { hx, hz, bx0, bx1, bayD };
}
export { shopToEmblem };
