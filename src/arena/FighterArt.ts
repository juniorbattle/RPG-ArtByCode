import * as THREE from 'three';
import { Sprite, Layer, ramp, mixRGB, type RGB } from '../characters/PixelPainter';
import { makeRig, palette, renderFrame, posesFor, PLAYER, crowdVariants, type CharSpec, type Dir } from '../characters/SpriteGenerator';
import { SpriteAtlas } from '../characters/SpriteAtlas';

/** The arena's fighters (journal Passe P1), painted by the game's own sprite generator rules: the same paper-doll rig and proportions
 *  (makeRig), the same hue-shifted ramps (palette), shading modes and selective outline, the hero's palette for Ren (he IS the game's
 *  generated hero, PLAYER) and a new archetype for Marek in the same grammar. What the town's generator does not have is a sword in hand:
 *  this side-view combat painter adds a posable profile (lean, crouch, stance, bent knees and elbows) holding a blade at any angle, swing
 *  smears and blade glow (the sprites' emissive layer), so a duel reads in silhouette.
 *  Frames are cells of 64 x 96 texels at the town's texel size (PIXEL_WORLD): room for a swing around a 32 x 48 character whose feet sit
 *  on row 90 (the town frame's foot row 45, offset by 16 x 45). They go through the town's SpriteRenderer (lighting, contact and light
 *  shadows, fog, DOF protection) with its frame size set to the cell's. A baked sheet approved later for the fighters can take their
 *  place through the same keys (`<id>/side/<clip>.<i>/0`). */

export const CELL_W = 64;
export const CELL_H = 96;
export const CELL_FOOT = 90;
/** where a 32 x 48 town frame sits in a cell */
const OX = 16, OY = CELL_FOOT - 45;

type Pal = ReturnType<typeof palette>;
type P2 = [number, number];

/** the champion: older, taller and broader than the hero, white hair and beard, steel plate under a crimson tabard and cloak */
export const MAREK: CharSpec = {
  id: 'marek', detail: 'hero', scale: 1.18, build: 1.35, skin: [208, 152, 120], hair: [172, 176, 192], hairStyle: 'long', beard: [112, 110, 124],
  top: [88, 98, 122], topStyle: 'coat', trim: [210, 172, 92], apron: [150, 40, 50], trousers: [56, 50, 66], boots: [50, 42, 50], belt: [84, 56, 40],
  cape: [44, 48, 70], capeLining: [24, 26, 40], sword: true, eye: [38, 32, 44], anims: ['idle'], accessory: 'none',
};
/** the hero of the district, with his sword out */
export const REN: CharSpec = { ...PLAYER, id: 'ren', skin: [232, 184, 148], anims: ['idle'] };

export interface FighterLook { spec: CharSpec; blade: number; bladeW: number; armor: boolean; smear: 'ivory' | 'ember'; /** a long hairstyle's tail down the back (px) */ tail?: number }
export const LOOKS: Record<'ren' | 'marek', FighterLook> = {
  ren: { spec: REN, blade: 15, bladeW: 2, armor: false, smear: 'ivory' },
  marek: { spec: MAREK, blade: 20, bladeW: 3, armor: true, smear: 'ember', tail: 6 },
};

/** a combat pose in the painter's space: the character faces LEFT (forward = -x, up = -y), as the town's side view does */
export interface CPose {
  /** shoulders forward of the hips (px) */
  lean?: number;
  /** hips lowered (px), knees bend to keep the feet planted */
  crouch?: number;
  bob?: number;
  /** feet: x from the body axis (negative = forward) and lift (px) */
  front?: P2; back?: P2;
  /** kneeling: the back knee on the ground at this x from the body axis */
  kneel?: number;
  /** the sword hand, from the near shoulder (px) */
  hand: P2;
  /** the far hand: on the grip ('hilt'), at an offset from the far shoulder, or hanging */
  hand2?: P2 | 'hilt';
  /** blade angle (degrees): 0 forward, 90 up, 180 back, -90 down */
  blade: number;
  bladeBehind?: boolean;
  /** blade emissive (0-255) */
  glow?: number;
  /** a swing arc (angles as the blade's, around the near shoulder) or a thrust streak (`line` px behind the tip) */
  smear?: { a0: number; a1: number; r?: number; w?: number; squash?: number } | { line: number; w?: number };
  /** head lowered (px) */
  head?: number;
  cape?: number;
  mouth?: boolean; blink?: boolean;
}

const D2R = Math.PI / 180;
const dirOf = (a: number): P2 => [-Math.cos(a * D2R), -Math.sin(a * D2R)];
const add = (a: P2, b: P2, k = 1): P2 => [a[0] + b[0] * k, a[1] + b[1] * k];
const dark = (c: RGB, k = 0.35): RGB => mixRGB(c, [14, 14, 36], k);

/** the frames' density: 2 texels per town pixel, as the production cast's baked sheets (64 x 96 per 32 x 48 frame): on screen the
 *  fighters keep the texel size the town's characters have in their framings */
export const FIGHTER_K = 2;

/** a layer whose shapes are given in town pixels (the generator's coordinates) and drawn at k texels per pixel */
class KLayer {
  constructor(readonly raw: Layer, readonly k: number) {}
  rect(x: number, y: number, w: number, h: number): this { this.raw.rect(x * this.k, y * this.k, w * this.k, h * this.k); return this; }
  ellipse(cx: number, cy: number, rx: number, ry: number): this { this.raw.ellipse(cx * this.k, cy * this.k, rx * this.k, ry * this.k); return this; }
  poly(pts: P2[]): this { this.raw.poly(pts.map(([x, y]) => [x * this.k, y * this.k] as P2)); return this; }
  line(x0: number, y0: number, x1: number, y1: number, th = 1): this { this.raw.line(x0 * this.k, y0 * this.k, x1 * this.k, y1 * this.k, th * this.k); return this; }
}

/** the town generator's drawing calls at k texels per pixel: shapes scale, shading and the outline stay one texel wide (finer, as an
 *  authored x2 sheet); `px` is a k x k block, `dot` a single texel (eye glints, the blade's edge) */
class Pen {
  constructor(readonly S: Sprite, readonly k: number) {}
  layer(): KLayer { return new KLayer(this.S.layer(), this.k); }
  commit(L: KLayer, colors: RGB[], mode: Parameters<Sprite['commit']>[2] = 'edge', o: Parameters<Sprite['commit']>[3] = {}): void {
    const k = this.k, cloth = mode === 'cloth' && k > 1;
    // cloth at k > 1: the town's fold pattern (a darker column every few pixels) at its own pixel spacing, one texel wide, instead of
    // the per-texel pattern (which turned into pinstripes)
    this.S.commit(L.raw, colors, cloth ? 'edge' : mode, { ...o, cx: o.cx !== undefined ? o.cx * k : undefined, cy: o.cy !== undefined ? o.cy * k : undefined, rx: o.rx !== undefined ? o.rx * k : undefined, ry: o.ry !== undefined ? o.ry * k : undefined });
    if (!cloth) return;
    const b = L.raw.bounds(); if (!b) return;
    const S = this.S, mid = colors[2], id = o.id ?? 0;
    for (let j = b[1] + 3 * k; j <= b[3]; j++) for (let i = b[0]; i <= b[2]; i++) {
      if (!L.raw.get(i, j) || i % k !== 0 || (Math.floor(i / k) * 7 + id * 3) % 5 !== 0) continue;
      const q = (j * S.w + i) * 4;
      if (S.rgba[q] === mid[0] && S.rgba[q + 1] === mid[1] && S.rgba[q + 2] === mid[2]) S.px(i, j, colors[1]);
    }
  }
  rect(x: number, y: number, w: number, h: number, c: RGB, em = 0): void { this.S.rect(x * this.k, y * this.k, w * this.k, h * this.k, c, em); }
  px(x: number, y: number, c: RGB): void { this.S.rect(Math.round(x) * this.k, Math.round(y) * this.k, this.k, this.k, c); }
  dot(x: number, y: number, c: RGB): void { this.S.px(Math.floor(x * this.k), Math.floor(y * this.k), c); }
}

/** a two-segment limb from `a` to `b` (segments l1, l2): the joint bends toward `side` (a direction the joint prefers) */
function joint(a: P2, b: P2, l1: number, l2: number, side: P2): P2 {
  const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1e-3;
  if (d >= l1 + l2 - 0.01) return [a[0] + dx * (l1 / (l1 + l2)), a[1] + dy * (l1 / (l1 + l2))];
  const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d), perp = Math.sqrt(Math.max(0, l1 * l1 - along * along));
  const ux = dx / d, uy = dy / d;
  let px = -uy, py = ux;
  if (px * side[0] + py * side[1] < 0) { px = -px; py = -py; }
  return [a[0] + ux * along + px * perp, a[1] + uy * along + py * perp];
}

const SMEAR: Record<'ivory' | 'ember', RGB[]> = {
  ivory: [[176, 176, 172], [222, 214, 192], [246, 240, 222]],
  ember: [[176, 84, 46], [228, 136, 64], [252, 196, 120]],
};

/** one combat frame of a fighter: a cell of CELL_W x CELL_H town pixels at `k` texels per pixel */
export function paintFighter(look: FighterLook, p: CPose, k = FIGHTER_K): Sprite {
  const S = new Sprite(CELL_W * k, CELL_H * k), P = new Pen(S, k);
  const spec = look.spec, pal = palette(spec), R = makeRig(spec);
  const cx = R.cx + OX, FOOT = CELL_FOOT, legTop = R.legTop + OY, torsoTop = R.torsoTop + OY;
  const lean = p.lean ?? 0, yo = (p.crouch ?? 0) - (p.bob ?? 0);
  const bw = Math.round(9 * (spec.build ?? 1));
  const sh = torsoTop + yo;                       // shoulder line
  const hipY = legTop - 1 + yo;
  const sx = cx - lean;                           // shoulders' axis
  const tTop = sx - bw / 2 + 0.5, tHip = cx - bw / 2 + 0.5;
  const hem = (spec.topStyle === 'coat' ? legTop + 4 : legTop + 1) + yo;
  const shoulderN: P2 = [sx - 0.5, sh + 1.6], shoulderF: P2 = [sx + 1.2, sh + 1.2];
  const hand = add(shoulderN, p.hand);
  const d = dirOf(p.blade), n: P2 = [-d[1], d[0]];
  let L = P.layer();

  // ---- cloak behind (trails to +x, flares with motion)
  if (spec.cape) {
    const fl = (p.cape ?? 0) + Math.max(0, -lean) * 0.6, long = look.armor ? 6 : 0;
    L = P.layer();
    L.poly([[tTop + bw - 1, sh + 1], [tTop + bw + 1, sh], [tHip + bw + 5 + fl, legTop + 3 + yo - fl * 0.4 + long], [tHip + bw + 3 + fl * 1.3, legTop + 7 + yo - fl * 0.5 + long], [tHip + bw - 2, legTop + 5 + yo + long]]);
    P.commit(L, pal.cape, 'cloth', { id: 5 });
  }
  // ---- sword behind the body (wind-ups)
  const sword = () => drawSword(P, look, pal, hand, d, n, p.glow ?? 0);
  if (p.bladeBehind) sword();
  // ---- far arm
  {
    const fh: P2 = p.hand2 === 'hilt' ? add(hand, d, -2.4) : p.hand2 ? add(shoulderF, p.hand2) : [shoulderF[0] + 1 + lean * 0.3, shoulderF[1] + 8.5];
    const el = joint(shoulderF, fh, 4.6, 4.6, [0.4, 1]);
    L = P.layer(); L.line(shoulderF[0], shoulderF[1], el[0], el[1], 3.2); L.line(el[0], el[1], fh[0], fh[1], 2.8); P.commit(L, ramp(dark(spec.top, 0.3)), 'flat', { id: 15 });
    L = P.layer(); L.ellipse(fh[0], fh[1], 1.7, 1.7); P.commit(L, look.armor ? ramp(dark([150, 156, 170], 0.3)) : ramp(dark(spec.skin, 0.25)), 'sphere', { id: 16, bands: 3 });
  }
  // ---- legs: hips over the body axis, feet planted, knees bend forward
  const legLen = R.legLen, l1 = (legLen - 2) / 2 + 0.6;
  const legsDef: Array<{ foot: P2; far: boolean }> = [
    { foot: p.back ?? [2.5, 0], far: true },
    { foot: p.front ?? [-2.5, 0], far: false },
  ];
  for (const lg of legsDef) {
    const hip: P2 = [cx - 0.6 + (lg.far ? 0.8 : -0.4), hipY + 0.5];
    const tr = lg.far ? ramp(dark(spec.trousers)) : pal.trousers, bt = lg.far ? ramp(dark(spec.boots)) : pal.boots;
    if (lg.far && p.kneel !== undefined) {
      // kneeling: the knee on the ground, the shin flat behind it, the boot's toe down
      const knee: P2 = [cx + p.kneel, FOOT - 2.2], ankle: P2 = [cx + p.kneel + 6, FOOT - 2];
      L = P.layer(); L.line(hip[0], hip[1], knee[0], knee[1], 4.4); L.line(knee[0], knee[1], ankle[0], ankle[1], 3.8); P.commit(L, tr, 'edge', { id: 1 });
      L = P.layer(); L.rect(ankle[0] - 1, FOOT - 4, 4.2, 4); P.commit(L, bt, 'two', { id: 2 });
      continue;
    }
    const ankle: P2 = [cx + lg.foot[0], FOOT - 3 - lg.foot[1]];
    const knee = joint(hip, ankle, l1, l1, [-1, 0]);
    L = P.layer(); L.line(hip[0], hip[1], knee[0], knee[1], 4.4); L.line(knee[0], knee[1], ankle[0], ankle[1], 4.0); P.commit(L, tr, 'edge', { id: 1 });
    const sole = FOOT - lg.foot[1];
    L = P.layer(); L.rect(ankle[0] - 2.1 - 1.8, sole - 3.5, 4.2 + 1.8, 3.5); P.commit(L, bt, 'two', { id: 2 });
    if (spec.detail === 'hero') P.rect(ankle[0] - 2.1, sole - 4, 4.2, 0.5, bt[3]);
  }
  // ---- torso (leans from the hips)
  L = P.layer();
  const coat = spec.topStyle === 'coat' ? 1 : 0;
  L.poly([[tTop, sh + 1.5], [tTop + 1.5, sh], [tTop + bw - 1.5, sh], [tTop + bw, sh + 1.5], [tHip + bw + coat, hem], [tHip - coat, hem]]);
  P.commit(L, look.armor ? ramp(spec.top) : pal.top, look.armor ? 'edge' : 'cloth', { id: 10 });
  if (look.armor) {
    // plate lines across the chest, then the crimson tabard over the plate, falling below the belt; gold hem
    for (const yy of [sh + 3.5, sh + 7]) P.rect(tTop + 0.6 + (yy - sh) * (tHip - tTop) / Math.max(1, hem - sh), yy, bw - 1.2, 0.5, ramp(spec.top)[1]);
    L = P.layer(); L.poly([[tTop + 0.5, sh + 3], [tTop + bw * 0.45, sh + 3], [tHip + bw * 0.48, hem + 5], [tHip - 0.5, hem + 5]]);
    P.commit(L, pal.apron, 'cloth', { id: 12 });
    P.rect(tHip - 0.5, hem + 4, bw * 0.48 + 1, 1, pal.trim[2]);
  } else P.rect(tHip + 0.5, hem - 1, bw - 1, 0.5, pal.trim[2]);
  L = P.layer(); L.rect(tHip, legTop - 2 + yo, bw, 2); P.commit(L, pal.belt, 'two', { id: 13 });
  P.rect(tHip + 0.5, legTop - 2 + yo, 1.5, 2, pal.gold[3]);
  if (spec.satchel) { L = P.layer(); L.rect(cx + 2, legTop - 5 + yo, 6, 6); P.commit(L, ramp([140, 96, 56]), 'edge', { id: 41 }); P.rect(cx + 2.5, legTop - 4.5 + yo, 5, 0.5, ramp([140, 96, 56])[3]); P.dot(cx + 6, legTop - 3 + yo, pal.gold[3]); L = P.layer(); L.line(sx + 2, sh + 1, cx + 6, legTop - 3 + yo, 1.4); P.commit(L, pal.belt, 'flat', { id: 40 }); }
  // the empty scabbard at the hip
  if (!look.armor) { L = P.layer(); L.line(cx + 2, legTop - 1 + yo, cx + 7, legTop + 7 + yo * 0.5, 1.7); P.commit(L, pal.belt, 'flat', { id: 43 }); }
  if (spec.scarf) { L = P.layer(); L.rect(sx - 4, sh - 1, 8, 2.4); P.commit(L, pal.scarf, 'cloth', { id: 14 }); }
  // ---- head in profile (follows the shoulders)
  drawHead(P, spec, pal, R.headRx, R.headRy, sx - 0.5, R.headCy + OY + yo + (p.head ?? 0), p, look.tail ?? 12);
  // ---- sword, then the near arm over its grip
  if (!p.bladeBehind) sword();
  {
    const el = joint(shoulderN, hand, 4.6, 4.6, [0.5, 1]);
    L = P.layer(); L.line(shoulderN[0], shoulderN[1], el[0], el[1], 3.4); L.line(el[0], el[1], hand[0], hand[1], 3.0); P.commit(L, look.armor ? ramp(spec.top) : pal.top, look.armor ? 'edge' : 'cloth', { id: 15 });
    if (!look.armor) { const c = add(el, [hand[0] - el[0], hand[1] - el[1]], 0.62); L = P.layer(); L.line(c[0] - 0.4, c[1], c[0] + 0.6, c[1] + 0.4, 1.6); P.commit(L, pal.trim, 'flat', { id: 18 }); }
    L = P.layer(); L.ellipse(hand[0], hand[1], 1.8, 1.8); P.commit(L, look.armor ? ramp([150, 156, 170]) : pal.skin, 'sphere', { id: 16, bands: 3 });
    if (look.armor) { L = P.layer(); L.ellipse(shoulderN[0] + 0.5, shoulderN[1] - 0.2, 3.4, 2.8); P.commit(L, ramp([138, 146, 164]), 'sphere', { id: 17, bands: 4 }); }
  }
  S.outline(0.36);
  rimLight(S);
  // ---- motion: smears behind the silhouette (never over it), lit by the emissive layer
  if (p.smear) {
    const cols = SMEAR[look.smear], em = look.smear === 'ember' ? 150 : 120;
    if ('line' in p.smear) smearLine(S, k, add(hand, d, look.blade + 1), d, p.smear.line, p.smear.w ?? 3, cols, em);
    else smearArc(S, k, shoulderN, p.smear.r ?? look.blade + 7, p.smear.a0, p.smear.a1, p.smear.w ?? 4, p.smear.squash ?? 1, cols, em);
  }
  return S;
}

function drawSword(P: Pen, look: FighterLook, pal: Pal, hand: P2, d: P2, n: P2, glow: number): void {
  const S = P.S, k = P.k;
  let L = P.layer();
  const a = add(hand, d, -3), b = add(hand, d, 1);
  L.line(a[0], a[1], b[0], b[1], 1.6); P.commit(L, pal.belt, 'flat', { id: 50 });
  L = P.layer(); L.ellipse(a[0] - d[0] * 0.6, a[1] - d[1] * 0.6, 0.9, 0.9); P.commit(L, pal.gold, 'sphere', { id: 53, bands: 3 });
  const g = add(hand, d, 1.6), gw = look.armor ? 3.4 : 2.6;
  L = P.layer(); L.line(g[0] + n[0] * gw, g[1] + n[1] * gw, g[0] - n[0] * gw, g[1] - n[1] * gw, 1.6); P.commit(L, pal.gold, 'edge', { id: 51 });
  const b0 = add(hand, d, 2.4), b1 = add(hand, d, look.blade), tip = add(hand, d, look.blade + 1.8);
  L = P.layer(); L.line(b0[0], b0[1], b1[0], b1[1], look.bladeW); L.line(b1[0], b1[1], tip[0], tip[1], look.bladeW * 0.55);
  // a glowing blade warms toward ivory-amber
  const steel = glow > 0 ? ramp(mixRGB([186, 194, 210], [250, 226, 170], Math.min(1, glow / 255))) : ramp([186, 194, 212]);
  P.commit(L, steel, 'edge', { id: 52, em: glow || undefined });
  // the fuller and the edge that catches the light: thin lines along the blade (one texel at k = 2)
  const len = look.blade - 3;
  for (const [off, col] of [[n[1] < 0 ? 0.5 : -0.5, glow > 0 ? [255, 246, 222] as RGB : pal.metal[4]], [0, glow > 0 ? [240, 214, 160] as RGB : pal.metal[1]]] as Array<[number, RGB]>) {
    if (k < 2 && off === 0) continue;
    const e0 = add(add(hand, d, 3.2), n, off);
    for (let q = 0; q <= len; q += 0.5 / k) {
      const pt = add(e0, d, q), x = Math.floor(pt[0] * k), y = Math.floor(pt[1] * k);
      if (S.getA(x, y) > 0) { S.px(x, y, col); if (glow) S.emis[y * S.w + x] = Math.min(255, glow + 40); }
    }
  }
}

function drawHead(P: Pen, spec: CharSpec, pal: Pal, rx: number, ry: number, hx: number, hy: number, p: CPose, tail: number): void {
  let L = P.layer();
  L.ellipse(hx, hy, rx - 0.4, ry); L.rect(hx - rx - 0.2, hy + 1.3, 1.0, 1.4);
  // the key from above (the moon and the lamps on their posts), not from the face: the skin keeps its own tone, the cheek and jaw their
  // shadow, the crown the light (lit from the front, the face was all highlight: a pale mask, critique of Passe P1)
  P.commit(L, pal.skin, 'sphere', { id: 20, bands: 4, cx: hx - 0.5, cy: hy, rx, ry, light: [0.15, -0.95] });
  const eye = spec.eye ?? [34, 28, 52];
  if (p.blink) P.rect(hx - 4.5, hy + 2, 2, 1, eye);
  else { P.rect(hx - 4.6, hy + 0.3, 2.2, 3.4, eye); P.rect(hx - 5.0, hy, 2.8, 0.5, mixRGB(eye, [10, 8, 20], 0.5)); P.dot(hx - 4.5, hy + 0.8, [255, 255, 255]); P.dot(hx - 3.9, hy + 2.8, mixRGB(eye, [120, 140, 190], 0.5)); }
  P.rect(hx - 5.6, hy - 2.2 + (p.blink ? 1 : 0), 3.4, 1.2, mixRGB(pal.hair[0], [20, 16, 30], 0.35));
  P.px(hx - rx - 0.2, hy + 2.5, pal.skin[3]);
  if (p.mouth) P.rect(hx - 4.2, hy + 4.4, 1.6, 2, [120, 40, 48]); else P.rect(hx - 4, hy + 4.8, 1.6, 0.5, pal.skin[0]);
  P.rect(hx - 2.5, hy + 3, 1.5, 1, mixRGB(spec.skin, [240, 120, 120], 0.4));
  if (spec.beard) { L = P.layer(); L.poly([[hx - 5.5, hy + 3], [hx + 1, hy + 2], [hx + 3, hy + 6], [hx - 1, hy + 9.8], [hx - 5.2, hy + 7.6]]); P.commit(L, pal.beard, 'sphere', { id: 4, bands: 4, cx: hx - 1.5, cy: hy + 5, rx: 4.5, ry: 4 }); if (p.mouth) P.rect(hx - 4.2, hy + 4.6, 1.6, 1.4, [70, 30, 40]); }
  const top = hy - ry;
  const hp: P2[] = [[-6.3, -2.4], [-5.4, -6.3], [-2.6, -8.4], [2, -8.9], [5.6, -7], [7.5, -2.6], [7.3, 3.4], [4.8, 4.8], [3, 2], [0.8, -0.8], [-1.8, -1.5], [-4, -1.2], [-5.6, -0.6]];
  L = P.layer(); L.poly(hp.map(([x, y]) => [hx + x, hy + y] as P2));
  if (spec.hairStyle === 'long') L.poly([[hx + 2, hy], [hx + 8, hy - 1], [hx + 8.6, hy + tail], [hx + 2.4, hy + tail - 1]]);
  // spikes swept back (upright, in profile they read as ears, critique of Passe P2)
  if (spec.hairStyle === 'spiky') L.poly([[hx - 5.6, hy - 4.6], [hx - 5.8, top - 2.2], [hx - 2.6, top - 0.6], [hx - 0.6, top - 3.4], [hx + 2.2, top - 0.4], [hx + 5.6, top - 2.6], [hx + 5.2, hy - 6.2], [hx + 8.6, hy - 4.4], [hx + 7.2, hy - 2.2]]);
  P.commit(L, pal.hair, 'sphere', { id: 3, bands: 4, cx: hx + 0.5, cy: hy - 3.5, rx, ry });
  // strands: a few lighter locks catch the moon (the hero detail of the town's generator)
  if (P.k >= 2) for (const [dx, dy, l] of [[-3, -6.4, 2.2], [0.6, -7.4, 2.6], [3.8, -5.6, 2], [5.6, -1.5, 2.4]] as Array<[number, number, number]>) {
    const Lr = P.layer(); Lr.line(hx + dx, hy + dy, hx + dx + 0.8, hy + dy + l, 0.5); P.commit(Lr, [pal.hair[3], pal.hair[3], pal.hair[4], pal.hair[4], pal.hair[4]], 'flat', { id: 6 });
  }
}

/** the moon behind the duel: the silhouette's top and back edges (the outline texels with transparency above or behind, +x) take a cool
 *  rim, so dark capes and armour detach from the dark stone (critique of Passe P2); one texel, painted in the frame */
function rimLight(S: Sprite): void {
  const W = S.w, H = S.h, a = (x: number, y: number) => S.getA(x, y) > 0, rim: number[] = [];
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    if (!a(x, y)) continue;
    const up = !a(x, y - 1), back = !a(x + 1, y), front = !a(x - 1, y);
    if ((up || back) && a(x, y + 1) && a(x - 1, y)) rim.push(y * W + x, up && back ? 2 : 1);
    else if (front && a(x + 1, y) && a(x, y + 1)) rim.push(y * W + x, 0);
  }
  for (let i = 0; i < rim.length; i += 2) {
    const q = rim[i] * 4, k = rim[i + 1] === 2 ? 0.55 : rim[i + 1] === 1 ? 0.4 : 0.22;
    S.rgba[q] += (150 - S.rgba[q]) * k; S.rgba[q + 1] += (172 - S.rgba[q + 1]) * k; S.rgba[q + 2] += (226 - S.rgba[q + 2]) * k;
  }
}

/** an arc band behind the silhouette (only on transparent texels), thin where the swing began, dithered at its tail; geometry in town
 *  pixels, drawn at k */
function smearArc(S: Sprite, k: number, c0: P2, r0: number, a0: number, a1: number, w0: number, squash: number, cols: RGB[], em: number): void {
  const span = a1 - a0, c: P2 = [c0[0] * k, c0[1] * k], r = r0 * k, w = w0 * k;
  for (let j = Math.floor(c[1] - r - 1); j <= Math.ceil(c[1] + r + 1); j++) for (let i = Math.floor(c[0] - r - 1); i <= Math.ceil(c[0] + r + 1); i++) {
    if (i < 0 || j < 0 || i >= S.w || j >= S.h || S.getA(i, j) > 0) continue;
    const dx = i + 0.5 - c[0], dy = (j + 0.5 - c[1]) / squash, rho = Math.hypot(dx, dy);
    let ang = Math.atan2(-dy, -dx) / D2R;
    let t = (ang - a0) / span;
    if (t < 0 || t > 1) { ang += span > 0 ? 360 : -360; t = (ang - a0) / span; }
    if (t < 0 || t > 1) continue;
    const width = Math.max(1, w * (0.12 + 0.88 * t * t));
    if (rho > r || rho < r - width) continue;
    const q = (r - rho) / width;
    S.px(i, j, t > 0.75 ? (q < 0.45 ? cols[2] : cols[1]) : q < 0.5 ? cols[1] : cols[0]);
    S.emis[j * S.w + i] = Math.round(em * (0.4 + 0.6 * t));
  }
}

/** a thrust streak: a band trailing `len` px behind the tip along the blade, tapering backwards */
function smearLine(S: Sprite, k: number, tip0: P2, d: P2, len0: number, w0: number, cols: RGB[], em: number): void {
  const tip: P2 = [tip0[0] * k, tip0[1] * k], len = len0 * k, w = w0 * k;
  const x0 = Math.min(tip[0], tip[0] - d[0] * len) - w, x1 = Math.max(tip[0], tip[0] - d[0] * len) + w;
  const y0 = Math.min(tip[1], tip[1] - d[1] * len) - w, y1 = Math.max(tip[1], tip[1] - d[1] * len) + w;
  for (let j = Math.floor(y0); j <= Math.ceil(y1); j++) for (let i = Math.floor(x0); i <= Math.ceil(x1); i++) {
    if (i < 0 || j < 0 || i >= S.w || j >= S.h || S.getA(i, j) > 0) continue;
    const vx = i + 0.5 - tip[0], vy = j + 0.5 - tip[1], along = -(vx * d[0] + vy * d[1]), across = Math.abs(vx * d[1] - vy * d[0]);
    if (along < 0 || along > len) continue;
    const t = 1 - along / len, half = (w / 2) * (0.3 + 0.7 * t);
    if (across > half) continue;
    S.px(i, j, across < half * 0.45 ? cols[2] : t > 0.5 ? cols[1] : cols[0]);
    S.emis[j * S.w + i] = Math.round(em * (0.4 + 0.6 * t));
  }
}

/* ------------------------------------------------------------------ clips */

/** a clip: its frames' poses (or painted sprites), and how a frame is picked from the simulation's clip clock */
export interface Clip { frames: CPose[]; loop?: number }

const REN_CLIPS: Record<string, Clip> = {
  idle: { loop: 1.7, frames: [
    { front: [-2.5, 0], back: [2.5, 0], hand: [-2.5, 8.5], blade: -62 },
    { front: [-2.5, 0], back: [2.5, 0], hand: [-2.5, 8], blade: -60, bob: 1 },
  ] },
  ready: { loop: 1.7, frames: [
    { lean: 1, crouch: 1.5, front: [-4.5, 0], back: [4, 0], hand: [-5, 5.5], blade: 32 },
    { lean: 1, crouch: 1, front: [-4.5, 0], back: [4, 0], hand: [-5, 5], blade: 35, bob: 0.5 },
  ] },
  strike: { frames: [
    { lean: -1, crouch: 1, front: [-4, 0], back: [4, 0], hand: [1.5, -1], blade: 122, cape: 1 },
    { lean: 3, crouch: 2.5, front: [-6.5, 0], back: [5.5, 0], hand: [-8, 4.5], blade: -18, smear: { a0: 122, a1: -18, w: 4 }, mouth: true },
    { lean: 2, crouch: 2, front: [-6, 0], back: [5, 0], hand: [-6, 8.5], blade: -55 },
  ] },
  heavy: { frames: [
    { lean: -2, crouch: 1, front: [-4, 0], back: [4.5, 0], hand: [0.5, -11], hand2: 'hilt', blade: 140, bladeBehind: true, cape: 1 },
    { lean: -3, crouch: 2.5, front: [-4.5, 0], back: [5, 0], hand: [1.5, -12], hand2: 'hilt', blade: 158, bladeBehind: true, glow: 90, cape: 2 },
    { lean: 4, crouch: 4, front: [-7.5, 0], back: [6.5, 0], hand: [-7, 7], hand2: 'hilt', blade: -46, smear: { a0: 70, a1: -46, r: 17, w: 6 }, mouth: true },
    { lean: 3, crouch: 3.5, front: [-7, 0], back: [6, 0], hand: [-5.5, 10.5], hand2: 'hilt', blade: -80 },
  ] },
  skill: { frames: [
    { lean: -1, crouch: 2.5, front: [-4.5, 0], back: [5, 0], hand: [3.5, 5.5], blade: 4, glow: 200, cape: 1 },
    { lean: 5, crouch: 3, front: [-8.5, 0], back: [7.5, 0], hand: [-11, 4], blade: 2, glow: 255, smear: { line: 18, w: 3.5 }, cape: 3, mouth: true },
    { lean: 3, crouch: 2, front: [-7.5, 0], back: [6.5, 0], hand: [-8.5, 6], blade: -12, glow: 110 },
  ] },
  slash: { frames: [
    { lean: -1, crouch: 1.5, front: [-4.5, 0], back: [4.5, 0], hand: [3.5, 2], blade: 176, bladeBehind: true, cape: 1 },
    { lean: 3, crouch: 2.5, front: [-6.5, 0], back: [6, 0], hand: [-8.5, 3], blade: 8, glow: 140, smear: { a0: 176, a1: 8, w: 5, squash: 0.55 }, cape: 2 },
    { lean: 2, crouch: 2, front: [-6, 0], back: [5.5, 0], hand: [-6.5, 7], blade: -28 },
  ] },
  block: { frames: [
    { lean: -1, crouch: 2, front: [-3.5, 0], back: [4.5, 0], hand: [-5, 2.5], hand2: [-3.2, 6], blade: 82 },
    { lean: -2.5, crouch: 2.5, front: [-3, 0], back: [5, 0], hand: [-4, 3], hand2: [-2.4, 6.5], blade: 78, mouth: true },
  ] },
  dodge: { frames: [
    { lean: -4, crouch: 4, front: [-2.5, 2], back: [6, 0], hand: [2, 5], blade: 150, bladeBehind: true, cape: 4 },
    { lean: -2, crouch: 3, front: [-3.5, 0], back: [5, 0], hand: [-1.5, 6.5], blade: 22, cape: 2 },
  ] },
  hit: { frames: [
    { lean: -4, crouch: 1, front: [-2, 0], back: [3.5, 0], hand: [1, -1], blade: 62, head: 1, mouth: true, blink: true, cape: 2 },
    { lean: -2, crouch: 1.5, front: [-2.5, 0], back: [3.5, 0], hand: [0, 6], blade: 40 },
  ] },
  recover: { loop: 2.5, frames: [
    { lean: 2, crouch: 3, front: [-2.5, 0], back: [3, 0], hand: [-2, 11], blade: -82, head: 2, blink: true },
    { lean: 2.5, crouch: 3.5, front: [-2.5, 0], back: [3, 0], hand: [-2, 11], blade: -84, head: 2.5 },
  ] },
  victory: { loop: 1.4, frames: [
    { lean: -1, front: [-3, 0], back: [3.5, 0], hand: [-1.5, -11.5], blade: 92, glow: 70, cape: 2, mouth: true },
    { lean: -1, front: [-3, 0], back: [3.5, 0], hand: [-1.5, -11], blade: 93, glow: 110, cape: 3, bob: 1, mouth: true },
  ] },
  ko: { frames: [
    { lean: 3, crouch: 6, front: [-3.5, 0], back: [4, 0], hand: [-4, 11.5], blade: -88, head: 2, blink: true },
    { lean: 3, crouch: 8.5, front: [-4.5, 0], kneel: 1.5, hand: [-5, 9.5], blade: -90, head: 3, blink: true },
  ] },
};

const MAREK_CLIPS: Record<string, Clip> = {
  idle: { loop: 1.4, frames: [
    { front: [-2.5, 0], back: [3, 0], hand: [-3, 9.5], hand2: 'hilt', blade: -75 },
    { front: [-2.5, 0], back: [3, 0], hand: [-3, 9], hand2: 'hilt', blade: -74, bob: 1 },
  ] },
  ready: { loop: 1.4, frames: [
    { lean: 1, crouch: 1.5, front: [-5, 0], back: [4.5, 0], hand: [-4, 6], hand2: 'hilt', blade: 48 },
    { lean: 1, crouch: 1, front: [-5, 0], back: [4.5, 0], hand: [-4, 5.5], hand2: 'hilt', blade: 50, bob: 0.5 },
  ] },
  slash: { frames: [
    { lean: -1.5, crouch: 1.5, front: [-4.5, 0], back: [5, 0], hand: [3, 0], hand2: 'hilt', blade: 168, bladeBehind: true, cape: 1 },
    { lean: 3, crouch: 3, front: [-7, 0], back: [6.5, 0], hand: [-8.5, 4], hand2: 'hilt', blade: 2, smear: { a0: 168, a1: 2, w: 5, squash: 0.6 }, cape: 2, mouth: true },
    { lean: 2, crouch: 2.5, front: [-6.5, 0], back: [6, 0], hand: [-6, 8], hand2: 'hilt', blade: -40 },
  ] },
  heavy: { frames: [
    { lean: -2, crouch: 1.5, front: [-4.5, 0], back: [5, 0], hand: [0.5, -12], hand2: 'hilt', blade: 118, bladeBehind: true, cape: 1 },
    { lean: -3.5, crouch: 3, front: [-5, 0], back: [5.5, 0], hand: [2, -13], hand2: 'hilt', blade: 150, bladeBehind: true, glow: 150, cape: 2, mouth: true },
    { lean: 4.5, crouch: 5, front: [-8.5, 0], back: [7, 0], hand: [-8, 7], hand2: 'hilt', blade: -42, smear: { a0: 70, a1: -42, r: 22, w: 7 }, mouth: true },
    { lean: 3.5, crouch: 4.5, front: [-8, 0], back: [6.5, 0], hand: [-6, 11], hand2: 'hilt', blade: -82 },
  ] },
  hit: { frames: [
    { lean: -3.5, crouch: 1, front: [-2, 0], back: [3.5, 0], hand: [2.5, 4], hand2: 'hilt', blade: 110, bladeBehind: true, head: 1, mouth: true, blink: true, cape: 2 },
    { lean: -1.5, crouch: 1.5, front: [-2.5, 0], back: [3.5, 0], hand: [-2, 7], hand2: 'hilt', blade: 30 },
  ] },
  recover: { loop: 2.2, frames: [
    { lean: 2.5, crouch: 3.5, front: [-3, 0], back: [3.5, 0], hand: [-3, 11.5], hand2: 'hilt', blade: -86, head: 2, blink: true },
    { lean: 3, crouch: 4, front: [-3, 0], back: [3.5, 0], hand: [-3, 11.5], hand2: 'hilt', blade: -88, head: 2.5 },
  ] },
  ko: { frames: [
    { lean: 3, crouch: 6, front: [-4, 0], back: [4.5, 0], hand: [-4.5, 11.5], hand2: 'hilt', blade: -88, head: 2, blink: true },
    { lean: 3.5, crouch: 9, front: [-5, 0], kneel: 1.5, hand: [-5.5, 9], hand2: 'hilt', blade: -90, head: 3.5, blink: true },
  ] },
};
// Marek has no guard or dodge of his own: borrow the ready stance if the presentation ever asks
MAREK_CLIPS.block = MAREK_CLIPS.ready; MAREK_CLIPS.victory = MAREK_CLIPS.ready; MAREK_CLIPS.dodge = MAREK_CLIPS.hit; MAREK_CLIPS.strike = MAREK_CLIPS.slash; MAREK_CLIPS.skill = MAREK_CLIPS.slash;

export const CLIPS: Record<'ren' | 'marek', Record<string, Clip>> = { ren: REN_CLIPS, marek: MAREK_CLIPS };

/** the frame of a clip at its clock (`t`, s) given its impact time: wind-ups until the impact, the strike frame around it, the
 *  follow-through after; loops at their own rate */
export function clipFrame(clip: string, n: number, t: number, impactAt = 0, loopRate = 0): number {
  if (loopRate > 0) return Math.floor(t * loopRate) % n;
  const at = impactAt;
  switch (clip) {
    case 'strike': return t < at * 0.85 ? 0 : t < at + 0.07 ? 1 : 2;
    case 'heavy': return t < at * 0.45 ? 0 : t < at - 0.03 ? 1 : t < at + 0.11 ? 2 : 3;
    case 'skill': return t < at - 0.04 ? 0 : t < at + 0.12 ? 1 : 2;
    case 'slash': return t < at * 0.8 ? 0 : t < at + 0.09 ? 1 : 2;
    case 'dodge': return t < 0.2 ? 0 : 1;
    case 'hit': return t < 0.12 ? 0 : 1;
    case 'ko': return t < 0.25 ? 0 : 1;
    case 'block': return 0;
    default: return 0;
  }
}

/* ------------------------------------------------------------------ effects */

const FX_IVORY: RGB[] = [[196, 186, 160], [240, 228, 200], [255, 250, 236]];
const FX_AMBER: RGB[] = [[200, 110, 50], [240, 168, 84], [255, 220, 150]];

/** an impact burst: rays from the centre, growing and thinning over the frames (cell centre at the torso height) */
function paintSpark(frame: number, cols: RGB[], em: number, rays = 8, k = FIGHTER_K): Sprite {
  const S = new Sprite(CELL_W * k, CELL_H * k), P = new Pen(S, k), c: P2 = [32, 70];
  const r0 = [2, 4, 6][frame], r1 = [5, 8, 10][frame], th = [1.6, 1.2, 0.8][frame];
  const L = P.layer();
  for (let q = 0; q < rays; q++) {
    const a = (q / rays) * Math.PI * 2 + (q % 2 ? 0.2 : 0), rr = r1 * (q % 2 ? 0.65 : 1);
    L.line(c[0] + Math.cos(a) * r0, c[1] + Math.sin(a) * r0, c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr, th);
  }
  if (frame === 0) L.ellipse(c[0], c[1], 3.2, 3.2);
  P.commit(L, [cols[0], cols[1], cols[2], cols[2], cols[2]], 'edge', { id: 60, em });
  return S;
}

/** a guard flash: a bright crescent in front of the guarding fighter (faces left like the fighters) */
function paintGuardFlash(frame: number, k = FIGHTER_K): Sprite {
  const S = new Sprite(CELL_W * k, CELL_H * k);
  smearArc(S, k, [36, 70], [11, 13, 14][frame], 125, 235, [3, 2.4, 1.6][frame], 1, frame ? FX_IVORY : [[170, 188, 214], [214, 226, 240], [246, 250, 255]], 170);
  return S;
}

/* ------------------------------------------------------------------ the arena's atlas */

export interface ArenaSpriteSet {
  atlas: SpriteAtlas; clips: typeof CLIPS; crowd: CharSpec[]; portraits: Record<'ren' | 'marek', HTMLCanvasElement | null>;
  /** how far forward of the body axis a fighter frame reaches (texels: its blade tip in a strike), by `<id>/<clip>.<i>` */
  reach: Record<string, number>;
}

/** every fighter frame, the spectators (the town's crowd archetypes, front view) and the effects, in cells of 64 x 96, as a SpriteAtlas
 *  the town's SpriteRenderer draws (frame keys `<id>/<dir>/<anim>/<i>`; a fighter frame is its own one-frame anim `<clip>.<i>`) */
export function buildArenaAtlas(seed: number, crowdCount = 5): ArenaSpriteSet {
  const cells: Array<{ key: string; spr: Sprite }> = [];
  const reach: Record<string, number> = {};
  for (const id of ['ren', 'marek'] as const) {
    for (const [clip, c] of Object.entries(CLIPS[id])) {
      if (Object.entries(CLIPS[id]).find(([, v]) => v === c)![0] !== clip) continue;   // a borrowed clip: aliased below
      c.frames.forEach((p, i) => {
        const spr = paintFighter(LOOKS[id], p);
        let r = 0;
        for (let y = 0; y < spr.h; y++) for (let x = 0; x < spr.w; x++) if (spr.rgba[(y * spr.w + x) * 4 + 3] > 0) r = Math.max(r, (spr.w / 2 - x) / FIGHTER_K);
        reach[`${id}/${clip}.${i}`] = r;
        cells.push({ key: `${id}/side/${clip}.${i}/0`, spr });
      });
    }
  }
  const crowd = crowdVariants(seed, crowdCount).map((s, i) => ({ ...s, id: `fan${s.id.slice(5)}`, ...(s.hairStyle === 'bald' ? { hairStyle: (i % 2 ? 'cap' : 'beret') as CharSpec['hairStyle'] } : {}) }));
  for (const spec of crowd) for (const anim of ['idle', 'talk'] as const) posesFor(anim).forEach((p, i) => cells.push({ key: `${spec.id}/down/${anim}/${i}`, spr: inCell(renderFrame(spec, 'down', p)) }));
  for (let f = 0; f < 3; f++) {
    cells.push({ key: `fx/side/spark.${f}/0`, spr: paintSpark(f, FX_IVORY, 140) });
    cells.push({ key: `fx/side/ember.${f}/0`, spr: paintSpark(f, FX_AMBER, 160, 10) });
    cells.push({ key: `fx/side/guard.${f}/0`, spr: paintGuardFlash(f) });
  }
  const cw = CELL_W * FIGHTER_K, ch = CELL_H * FIGHTER_K, cols = 16, rows = Math.ceil(cells.length / cols), W = cols * cw, H = rows * ch;
  const data = new Uint8ClampedArray(W * H * 4), em = new Uint8ClampedArray(W * H * 4);
  const a = new SpriteAtlas();
  cells.forEach((c, idx) => {
    const x0 = (idx % cols) * cw, y0 = Math.floor(idx / cols) * ch;
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
      const s = (y * cw + x) * 4, d = ((H - 1 - (y0 + y)) * W + (x0 + x)) * 4;
      data[d] = c.spr.rgba[s]; data[d + 1] = c.spr.rgba[s + 1]; data[d + 2] = c.spr.rgba[s + 2]; data[d + 3] = c.spr.rgba[s + 3];
      const e = c.spr.emis[y * cw + x]; em[d] = em[d + 1] = em[d + 2] = e; em[d + 3] = 255;
    }
    a.frames.set(c.key, { u0: x0 / W, u1: (x0 + cw) / W, v1: 1 - y0 / H, v0: 1 - (y0 + ch) / H });
  });
  for (const k of a.frames.keys()) { const [id, , anim] = k.split('/'); a.counts.set(`${id}/${anim}`, (a.counts.get(`${id}/${anim}`) ?? 0) + 1); }
  // borrowed clips: alias their keys
  for (const id of ['ren', 'marek'] as const) for (const [clip, c] of Object.entries(CLIPS[id])) {
    const src = Object.entries(CLIPS[id]).find(([, v]) => v === c)![0];
    if (src === clip) continue;
    c.frames.forEach((_, i) => { a.frames.set(`${id}/side/${clip}.${i}/0`, a.frames.get(`${id}/side/${src}.${i}/0`)!); a.counts.set(`${id}/${clip}.${i}`, 1); reach[`${id}/${clip}.${i}`] = reach[`${id}/${src}.${i}`]; });
  }
  const mk = (buf: Uint8ClampedArray, srgb: boolean) => {
    const t = new THREE.DataTexture(new Uint8Array(buf.buffer), W, H, THREE.RGBAFormat, THREE.UnsignedByteType);
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true;
    return t;
  };
  a.texture = mk(data, true); a.emis = mk(em, false); a.width = W; a.height = H; a.rgba = data; a.frameCount = cells.length;
  return { atlas: a, clips: CLIPS, crowd, portraits: { ren: portrait(REN), marek: portrait(MAREK) }, reach };
}

/** a 32 x 48 town frame placed in a cell (feet on the cell's foot row), each town pixel a k x k block: the spectators keep the town's
 *  generated look */
function inCell(s: Sprite, k = FIGHTER_K): Sprite {
  const S = new Sprite(CELL_W * k, CELL_H * k);
  for (let y = 0; y < s.h * k; y++) for (let x = 0; x < s.w * k; x++) {
    const sx = Math.floor(x / k), sy = Math.floor(y / k), q = (sy * s.w + sx) * 4, d = ((y + OY * k) * S.w + x + OX * k) * 4;
    S.rgba[d] = s.rgba[q]; S.rgba[d + 1] = s.rgba[q + 1]; S.rgba[d + 2] = s.rgba[q + 2]; S.rgba[d + 3] = s.rgba[q + 3];
    S.emis[(y + OY * k) * S.w + x + OX * k] = s.emis[sy * s.w + sx];
  }
  return S;
}

/** the HUD portrait: the front view's head and shoulders (the town generator's own front frame), 24 x 24 texels on a canvas */
function portrait(spec: CharSpec, dir: Dir = 'down'): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const s = renderFrame({ ...spec, anims: ['idle'] }, dir, posesFor('idle')[0]);
  const R = makeRig(spec), y0 = Math.max(0, Math.round(R.headCy - R.headRy - 5)), x0 = 4, n = 24;
  const c = document.createElement('canvas'); c.width = c.height = n;
  const ctx = c.getContext('2d')!, img = ctx.createImageData(n, n);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const k = ((y + y0) * s.w + x + x0) * 4, d = (y * n + x) * 4;
    if (y + y0 >= s.h) continue;
    img.data[d] = s.rgba[k]; img.data[d + 1] = s.rgba[k + 1]; img.data[d + 2] = s.rgba[k + 2]; img.data[d + 3] = s.rgba[k + 3];
  }
  ctx.putImageData(img, 0, 0);
  return c;
}
