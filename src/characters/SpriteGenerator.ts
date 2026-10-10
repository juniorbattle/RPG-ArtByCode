import { Rng } from '../core/rng';
import { Sprite, Layer, ramp, skinRamp, mixRGB, hsl, type RGB } from './PixelPainter';

/** Procedural HD-2D character generator: a parametric paper-doll painted on an integer pixel grid,
 *  with hue-shifted ramps, selective outlines and a deliberate DETAIL HIERARCHY:
 *  hero (player) > mid (important NPCs) > crowd (ambient). */

export const FRAME_W = 32;
export const FRAME_H = 48;
export const FOOT_Y = 45;
export type Dir = 'down' | 'up' | 'side';
export type Anim = 'idle' | 'walk' | 'hammer' | 'talk' | 'carry';
export type Detail = 'hero' | 'mid' | 'crowd';

export type HairStyle = 'spiky' | 'short' | 'long' | 'bun' | 'bald' | 'cap' | 'helmet' | 'beret' | 'bandana' | 'hood' | 'kerchief';
export type TopStyle = 'tunic' | 'coat' | 'dress' | 'robe' | 'jerkin' | 'apronShirt';
export type Accessory = 'none' | 'satchel' | 'hammer' | 'basket' | 'spear' | 'crate' | 'lantern' | 'broom' | 'staff' | 'sack';

export interface CharSpec {
  id: string;
  detail: Detail;
  kind?: 'human' | 'cat';
  scale?: number;
  build?: number; // torso width factor
  skin: RGB; hair: RGB; hairStyle: HairStyle;
  top: RGB; topStyle: TopStyle; trim?: RGB; apron?: RGB; trousers: RGB; boots: RGB; belt?: RGB;
  cape?: RGB; capeLining?: RGB; hat?: RGB; scarf?: RGB; beard?: RGB;
  accessory?: Accessory; sword?: boolean; satchel?: boolean;
  eye?: RGB; hooded?: boolean; blush?: boolean;
  anims: Anim[];
}

interface Pose { bob: number; legPhase: number; lift: number; arm: number; sway: number; mouth: boolean; strike: number; blink: boolean; tailPhase: number }

export const clamp8 = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
const lighten = (c: RGB, k: number): RGB => [clamp8(c[0] * k), clamp8(c[1] * k), clamp8(c[2] * k)];

export function posesFor(anim: Anim): Pose[] {
  const base: Pose = { bob: 0, legPhase: 0, lift: 0, arm: 0, sway: 0, mouth: false, strike: 0, blink: false, tailPhase: 0 };
  switch (anim) {
    case 'idle': return [{ ...base }, { ...base, bob: 1, sway: 1, arm: 0.5 }];
    case 'talk': return [{ ...base, mouth: true, arm: 1.5 }, { ...base, bob: 1, arm: -0.5 }];
    case 'walk': return [
      { ...base, legPhase: 1, arm: -1, sway: 1, lift: 0 },
      { ...base, legPhase: 0, bob: 1, arm: 0, sway: 0, lift: 1 },
      { ...base, legPhase: -1, arm: 1, sway: -1 },
      { ...base, legPhase: 0, bob: 1, arm: 0, sway: 0, lift: -1 },
    ];
    case 'carry': return [
      { ...base, legPhase: 1, sway: 1 }, { ...base, bob: 1, lift: 1 }, { ...base, legPhase: -1, sway: -1 }, { ...base, bob: 1, lift: -1 },
    ];
    case 'hammer': return [
      { ...base, strike: 0, bob: 0 }, { ...base, strike: 1, bob: 0 }, { ...base, strike: 2, bob: 1 }, { ...base, strike: 3, bob: 0 },
    ];
  }
}

interface Rig { legLen: number; torsoH: number; legTop: number; torsoTop: number; headRx: number; headRy: number; headCy: number; torsoW: number; cx: number }
function makeRig(spec: CharSpec): Rig {
  const s = spec.scale ?? 1;
  const legLen = Math.round(11 * s), torsoH = Math.round(13 * s);
  const legTop = FOOT_Y - legLen, torsoTop = legTop - torsoH + 1;
  const headRx = (spec.detail === 'crowd' ? 6.6 : 7.3) * (s < 1 ? 0.95 + 0.05 * s : 1), headRy = (spec.detail === 'crowd' ? 6.2 : 6.8) * (s < 1 ? 1 : 1);
  return { legLen, torsoH, legTop, torsoTop, headRx, headRy, headCy: torsoTop - headRy + 1.8, torsoW: Math.round(12 * (spec.build ?? 1)), cx: 16 };
}

function palette(spec: CharSpec) {
  return {
    skin: skinRamp(spec.skin), hair: ramp(spec.hair), top: ramp(spec.top), trim: ramp(spec.trim ?? lighten(spec.top, 1.5)), apron: ramp(spec.apron ?? spec.top),
    trousers: ramp(spec.trousers), boots: ramp(spec.boots), belt: ramp(spec.belt ?? [96, 64, 40]), cape: ramp(spec.cape ?? spec.top), lining: ramp(spec.capeLining ?? [220, 200, 170]),
    hat: ramp(spec.hat ?? spec.hair), scarf: ramp(spec.scarf ?? [220, 190, 130]), beard: ramp(spec.beard ?? spec.hair), metal: ramp([156, 162, 176]), wood: ramp([120, 82, 52]), gold: ramp([220, 176, 70]),
  };
}

type P = ReturnType<typeof palette>;

function drawHairFront(S: Sprite, spec: CharSpec, R: Rig, pal: P, yo: number): void {
  const { cx, headCy, headRx, headRy } = R;
  const hy = headCy + yo;
  const style = spec.hairStyle;
  const top = hy - headRy;
  const detail = spec.detail;
  if (style === 'bald') return;
  let L = S.layer();
  if (style === 'hood') {
    L.ellipse(cx, hy - 0.5, headRx + 1.6, headRy + 1.8); S.commit(L, pal.hat, 'cloth', { id: 7 });
    L = S.layer(); L.ellipse(cx, hy + 1.2, headRx - 2.4, headRy - 2.2); S.commit(L, ramp([14, 12, 22]), 'flat', { id: 8 });
    return;
  }
  if (style === 'helmet' || style === 'cap') {
    const col = pal.hat;
    L = S.layer(); L.ellipse(cx, hy - 1.6, headRx + 0.6, headRy - 0.8); L.rect(cx - headRx - 0.6, hy - 3, headRx * 2 + 1.2, 2.4);
    S.commit(L, col, 'sphere', { id: 7, bands: 4, cx, cy: hy - 3, rx: headRx, ry: headRy });
    // brim
    L = S.layer(); L.rect(cx - headRx - 1.5, hy - 2.6, headRx * 2 + 3, 2); S.commit(L, ramp(mixRGB(spec.hat ?? spec.hair, [30, 24, 20], 0.35)), 'two', { id: 9 });
    if (style === 'helmet') { L = S.layer(); L.rect(cx - 0.8, top - 0.6, 1.6, headRy); S.commit(L, pal.metal, 'flat', { id: 9 }); }
    return;
  }
  if (style === 'beret') {
    L = S.layer(); L.ellipse(cx + 1, hy - 4.2, headRx + 1, 3.6); S.commit(L, pal.hat, 'sphere', { id: 7, bands: 3 });
    L = S.layer(); L.rect(cx - 5.5, hy - 2, 11, 1.6); S.commit(L, pal.hair, 'two', { id: 9 });
    return;
  }
  if (style === 'kerchief') {
    L = S.layer(); L.ellipse(cx, hy - 2, headRx + 0.8, headRy - 1.2); L.rect(cx - headRx - 0.8, hy - 2.5, headRx * 2 + 1.6, 2); S.commit(L, pal.hat, 'cloth', { id: 7 });
    L = S.layer(); L.rect(cx + headRx - 1, hy - 2, 3, 6); S.commit(L, pal.hat, 'flat', { id: 7 });
    return;
  }
  // hair mass: a crown ellipse with the face area cut out under a jagged fringe, sideburns kept
  const fringeY = (x: number): number => {
    const k = Math.floor(x - cx + 9);
    const teeth = style === 'spiky' ? [0, 1.6, 0.4, 1.8, 0.2, 1.4, 0.6, 1.6, 0.2] : style === 'short' ? [0.4, 0.8, 0.4, 0.9, 0.5, 0.8, 0.4, 0.6, 0.4] : [0.2, 1.0, 0.5, 1.2, 0.4, 1.0, 0.6, 1.0, 0.2];
    return hy - 1.7 + teeth[Math.max(0, Math.min(teeth.length - 1, k % teeth.length))] * (detail === 'crowd' ? 0.6 : 1);
  };
  if (style === 'long') {
    L = S.layer(); L.rect(cx - headRx - 1.2, hy - 3, 3.2, 17); L.rect(cx + headRx - 2, hy - 3, 3.2, 17);
    L.cut((x, y) => y > hy + 12.5 - Math.abs(x + 0.5 - cx) * 0.2); S.commit(L, pal.hair, 'edge', { id: 3 });
  }
  L = S.layer(); L.ellipse(cx, hy - 3.2, headRx + 1.0, headRy - 0.4);
  if (style === 'bun') L.ellipse(cx, top - 1.4, 3.6, 3.2);
  if (style === 'spiky') {
    L.poly([[cx - headRx - 1, hy - 2.5], [cx - headRx + 0.2, top - 3.4], [cx - 3.8, top - 0.6], [cx - 2.2, top - 4.6], [cx, top - 1.2], [cx + 2.2, top - 4.8], [cx + 3.8, top - 0.6], [cx + headRx - 0.2, top - 3.6], [cx + headRx + 1, hy - 2.5]]);
  }
  L.cut((x, y) => (Math.abs(x + 0.5 - cx) < headRx - 1.8 && y > fringeY(x)) || y > hy + 2.5);
  S.commit(L, pal.hair, 'sphere', { id: 3, bands: 4, cx, cy: hy - 4.4, rx: headRx + 1, ry: headRy - 0.5 });
  if (detail === 'hero') for (const [dx, dy] of [[-3, -6.2], [1, -7], [4, -5]]) S.px(Math.round(cx + dx), Math.round(hy + dy), pal.hair[4]);
}


function drawFaceFront(S: Sprite, spec: CharSpec, R: Rig, pal: P, pose: Pose, yo: number): void {
  const { cx, headCy } = R;
  const hy = Math.round(headCy + yo);
  const eye = spec.eye ?? [34, 28, 52];
  if (spec.hooded) {
    S.px(cx - 3, hy + 1, [210, 232, 255]); S.px(cx + 2, hy + 1, [210, 232, 255]); S.emis[(hy + 1) * S.w + cx - 3] = 120; S.emis[(hy + 1) * S.w + cx + 2] = 120;
    return;
  }
  const ey = hy + 1;
  const eyeH = spec.detail === 'hero' ? 3 : spec.detail === 'mid' ? 2 : 2;
  if (pose.blink) { S.rect(cx - 4, ey + 1, 2, 1, eye); S.rect(cx + 2, ey + 1, 2, 1, eye); }
  else {
    S.rect(cx - 4, ey, 2, eyeH, eye); S.rect(cx + 2, ey, 2, eyeH, eye);
    if (spec.detail !== 'crowd') { S.px(cx - 4, ey, [255, 255, 255]); S.px(cx + 2, ey, [255, 255, 255]); }
  }
  if (spec.detail !== 'crowd') {
    const bc = pal.hair[1];
    S.rect(cx - 5, ey - 2, 3, 1, bc); S.rect(cx + 2, ey - 2, 3, 1, bc);
    if (spec.blush !== false) { S.px(cx - 5, ey + eyeH, mixRGB(spec.skin, [240, 120, 120], 0.45)); S.px(cx + 4, ey + eyeH, mixRGB(spec.skin, [240, 120, 120], 0.45)); }
  }
  const my = ey + eyeH + 1;
  if (pose.mouth) { S.rect(cx - 1, my, 2, 2, [120, 40, 48]); }
  else S.rect(cx - 1, my, 2, 1, pal.skin[0]);
  if (spec.beard && spec.hairStyle !== 'hood') {
    const L = S.layer(); L.poly([[cx - 6.5, hy + 3], [cx + 6.5, hy + 3], [cx + 5, hy + 8.5], [cx, hy + 10.5], [cx - 5, hy + 8.5]]);
    L.rect(cx - 2, hy + 5, 4, 0); S.commit(L, pal.beard, 'sphere', { id: 4, bands: 3 });
    S.rect(cx - 1, my - 1, 2, 1, pal.skin[1]);
  }
}

function drawFront(S: Sprite, spec: CharSpec, dir: 'down' | 'up', pose: Pose, pal: P): void {
  const R = makeRig(spec), { cx, legTop, torsoTop } = R;
  const back = dir === 'up';
  const yo = -pose.bob;
  const tw = R.torsoW, tx0 = cx - tw / 2;
  const dress = spec.topStyle === 'dress' || spec.topStyle === 'robe';
  const hem = spec.topStyle === 'robe' ? FOOT_Y - 2 : spec.topStyle === 'dress' ? legTop + 7 : spec.topStyle === 'coat' ? legTop + 4 : legTop + 1;
  let L: Layer;

  // --- cape (behind in front view, in front of the body from behind)
  const capeSway = pose.sway * 0.8;
  const drawCape = () => {
    if (!spec.cape) return;
    L = S.layer();
    L.poly([[tx0 - 1, torsoTop + yo], [tx0 + tw + 1, torsoTop + yo], [tx0 + tw + 3.5 + capeSway, legTop + 6], [tx0 - 3.5 + capeSway, legTop + 6]]);
    S.commit(L, back ? pal.cape : pal.lining, 'cloth', { id: 5 });
    if (back && spec.detail === 'hero') { for (const x of [cx - 3, cx + 1, cx + 5]) S.rect(x + capeSway * 0.5, torsoTop + 5 + yo, 1, 9, pal.cape[1]); }
  };
  if (!back) drawCape();

  // --- legs (hidden under dress, still show boots)
  const legW = spec.detail === 'crowd' ? 4 : 4.4;
  const legs: Array<[number, number]> = [[cx - 3.4, pose.legPhase === 1 ? 1 : pose.legPhase === -1 ? 0 : pose.lift > 0 ? 2 : 0], [cx + 3.4, pose.legPhase === -1 ? 1 : pose.legPhase === 1 ? 0 : pose.lift < 0 ? 2 : 0]];
  for (let i = 0; i < 2; i++) {
    const [lx, lift] = legs[i];
    const adj = pose.legPhase === 1 && i === 0 ? 1 : pose.legPhase === -1 && i === 1 ? 1 : 0; // forward foot lower & wider
    const bottom = FOOT_Y - lift + (adj ? 0 : 0);
    const x0 = lx - legW / 2 + (i === 0 ? -adj * 0.5 : adj * 0.5);
    if (!dress || spec.topStyle === 'dress') {
      L = S.layer(); L.rect(x0, legTop - 1, legW, bottom - legTop - 3 + 1); S.commit(L, pal.trousers, 'edge', { id: 1 });
    }
    L = S.layer(); L.rect(x0 - 0.4, bottom - 3.5, legW + 0.8 + (i === 0 ? 0.6 : 0), 3.5); if (i === 1) L.rect(x0 + 0.4, bottom - 3.5, legW + 0.8, 3.5);
    S.commit(L, pal.boots, 'two', { id: 2 });
    if (spec.detail === 'hero') S.rect(x0, bottom - 4.2, legW, 1, pal.boots[3]);
  }

  // --- torso
  L = S.layer();
  const sh = torsoTop + yo;
  if (dress) L.poly([[tx0, sh + 1], [tx0 + 1, sh], [tx0 + tw - 1, sh], [tx0 + tw, sh + 1], [tx0 + tw - 0.5, legTop - 2 + yo], [tx0 + tw + 3, hem], [tx0 - 3, hem], [tx0 + 0.5, legTop - 2 + yo]]);
  else L.poly([[tx0, sh + 1.5], [tx0 + 1.5, sh], [tx0 + tw - 1.5, sh], [tx0 + tw, sh + 1.5], [tx0 + tw + (spec.topStyle === 'coat' ? 1.5 : 0), hem], [tx0 - (spec.topStyle === 'coat' ? 1.5 : 0), hem]]);
  S.commit(L, pal.top, 'cloth', { id: 10 });
  if (back && spec.cape) drawCape();
  if (!back) {
    // trim + neckline
    if (spec.detail !== 'crowd') {
      L = S.layer(); L.poly([[cx - 3, sh], [cx + 3, sh], [cx, sh + 4]]); S.commit(L, pal.skin, 'flat', { id: 11 });
      S.rect(cx - 4, sh, 1, 2, pal.trim[2]); S.rect(cx + 3, sh, 1, 2, pal.trim[2]);
    }
    if (spec.apron) { L = S.layer(); L.rect(cx - 4.5, sh + 3, 9, hem - sh - 2); S.commit(L, pal.apron, 'cloth', { id: 12 }); S.rect(cx - 4, sh + 2, 1, 2, pal.apron[1]); S.rect(cx + 3, sh + 2, 1, 2, pal.apron[1]); }
  }
  if (spec.topStyle === 'jerkin' || spec.topStyle === 'tunic') { if (spec.detail === 'hero') { S.rect(tx0 + 1, hem - 1, tw - 2, 1, pal.trim[2]); } }
  // belt
  if (spec.belt || spec.topStyle === 'tunic' || spec.topStyle === 'coat' || spec.topStyle === 'jerkin') {
    L = S.layer(); L.rect(tx0, legTop - 2 + yo, tw, 2); S.commit(L, pal.belt, 'two', { id: 13 });
    if (!back) S.rect(cx - 1, legTop - 2 + yo, 2, 2, pal.gold[3]);
  }
  if (spec.topStyle === 'dress' && !back) { S.rect(cx - 1, legTop - 3 + yo, 2, 1, pal.trim[3]); }

  // --- scarf at the neck
  if (spec.scarf) { L = S.layer(); L.rect(cx - 5, sh - 1, 10, 2.4); S.commit(L, pal.scarf, 'cloth', { id: 14 }); }

  // --- arms
  const sw = pose.arm;
  for (const side of [-1, 1]) {
    const ax = side < 0 ? tx0 - 3 : tx0 + tw;
    const swing = side < 0 ? sw : -sw;
    const ay = sh + 1 + yo * 0 + Math.round(swing * 0.8);
    L = S.layer(); L.rect(ax, ay, 3, 9 - Math.round(Math.abs(swing) * 0.4)); S.commit(L, pal.top, 'cloth', { id: 15 });
    L = S.layer(); L.ellipse(ax + 1.5, ay + 9.4 - Math.round(Math.abs(swing) * 0.4), 1.7, 1.7); S.commit(L, pal.skin, 'sphere', { id: 16, bands: 3 });
    if (spec.topStyle !== 'robe' && spec.detail !== 'crowd') S.rect(ax, ay + 7, 3, 1, pal.trim[2]);
  }

  // --- accessories behind the head
  accessoryBack(S, spec, R, pal, pose, dir, yo);

  // --- head
  const hy = R.headCy + yo;
  L = S.layer(); L.ellipse(cx, hy, R.headRx, R.headRy); L.rect(cx - R.headRx - 0.5, hy - 0.5, 1.2, 3); L.rect(cx + R.headRx - 0.7, hy - 0.5, 1.2, 3);
  if (!back) S.commit(L, pal.skin, 'sphere', { id: 20, bands: 4, cx, cy: hy + 1, rx: R.headRx + 0.5, ry: R.headRy + 0.5 });
  else S.commit(L, pal.hair, 'sphere', { id: 3, bands: 4 });
  if (!back) {
    drawFaceFront(S, spec, R, pal, pose, yo);
    drawHairFront(S, spec, R, pal, yo);
  } else {
    // back of the head: hair covers all, hat on top
    if (spec.hairStyle === 'hood') { L = S.layer(); L.ellipse(cx, hy - 0.5, R.headRx + 1.6, R.headRy + 1.8); S.commit(L, pal.hat, 'cloth', { id: 7 }); }
    else if (spec.hairStyle === 'cap' || spec.hairStyle === 'helmet') { L = S.layer(); L.ellipse(cx, hy - 1, R.headRx + 0.6, R.headRy - 0.2); S.commit(L, pal.hat, 'sphere', { id: 7 }); if (spec.hairStyle === 'helmet') S.rect(cx - 0.6, hy - R.headRy, 1.2, R.headRy, pal.metal[3]); }
    else if (spec.hairStyle === 'beret') { L = S.layer(); L.ellipse(cx + 1, hy - 4.2, R.headRx + 1, 3.6); S.commit(L, pal.hat, 'sphere', { id: 7, bands: 3 }); }
    else if (spec.hairStyle === 'long') { L = S.layer(); L.ellipse(cx, hy, R.headRx + 0.9, R.headRy + 0.6); L.rect(cx - R.headRx, hy, R.headRx * 2, 12); S.commit(L, pal.hair, 'edge', { id: 3 }); }
    else if (spec.hairStyle === 'spiky') { L = S.layer(); L.ellipse(cx, hy, R.headRx + 0.6, R.headRy + 0.4); L.poly([[cx - 7, hy - 3], [cx - 6, hy - 10], [cx - 3, hy - 7], [cx, hy - 10.5], [cx + 3, hy - 7], [cx + 6, hy - 10], [cx + 7, hy - 3]]); S.commit(L, pal.hair, 'sphere', { id: 3, bands: 4 }); }
    else if (spec.hairStyle === 'bun') { L = S.layer(); L.ellipse(cx, hy - 0.5, R.headRx + 0.6, R.headRy); L.ellipse(cx, hy - R.headRy - 1.5, 3.4, 3); S.commit(L, pal.hair, 'sphere', { id: 3 }); }
  }
  accessoryFront(S, spec, R, pal, pose, dir, yo);
}

function drawSide(S: Sprite, spec: CharSpec, pose: Pose, pal: P): void {
  const R = makeRig(spec), { cx, legTop, torsoTop } = R;
  const yo = -pose.bob;
  const bw = Math.round(9 * (spec.build ?? 1));
  const tx0 = cx - bw / 2 + 0.5;
  const dress = spec.topStyle === 'dress' || spec.topStyle === 'robe';
  const hem = spec.topStyle === 'robe' ? FOOT_Y - 2 : spec.topStyle === 'dress' ? legTop + 7 : spec.topStyle === 'coat' ? legTop + 4 : legTop + 1;
  let L: Layer;
  const sh = torsoTop + yo;

  // --- cape trailing behind (screen-right)
  if (spec.cape) {
    L = S.layer();
    const sway = pose.sway * 1.4 + (pose.legPhase !== 0 ? 1.5 : 0);
    L.poly([[tx0 + bw - 1, sh + 1], [tx0 + bw + 1, sh], [tx0 + bw + 5 + sway, legTop + 3], [tx0 + bw + 3 + sway * 1.4, legTop + 7], [tx0 + bw - 2, legTop + 5]]);
    S.commit(L, pal.cape, 'cloth', { id: 5 });
  }
  // --- far arm (behind torso)
  const swing = pose.arm;
  L = S.layer(); L.rect(cx - 1.5 + swing * 1.2, sh + 2, 3, 8); S.commit(L, ramp(mixRGB(spec.top, [20, 20, 40], 0.3)), 'flat', { id: 15 });
  // --- legs
  const forward = pose.legPhase;
  const legs: Array<{ x: number; lift: number; far: boolean }> = [
    { x: cx - 0.8 + (forward === 1 ? -3 : forward === -1 ? 2.2 : -0.6), lift: forward === 1 ? 0 : forward === -1 ? 2 : pose.lift > 0 ? 2 : 0, far: true },
    { x: cx - 0.8 + (forward === 1 ? 2.2 : forward === -1 ? -3 : 0.6), lift: forward === -1 ? 0 : forward === 1 ? 2 : pose.lift < 0 ? 2 : 0, far: false },
  ];
  for (const lg of legs) {
    const legW = 4.2, bottom = FOOT_Y - lg.lift;
    const tr = lg.far ? ramp(mixRGB(spec.trousers, [14, 14, 36], 0.35)) : pal.trousers;
    const bt = lg.far ? ramp(mixRGB(spec.boots, [14, 14, 36], 0.35)) : pal.boots;
    if (spec.topStyle !== 'robe') { L = S.layer(); L.rect(lg.x - legW / 2, legTop - 1, legW, bottom - legTop - 2); S.commit(L, tr, 'edge', { id: 1 }); }
    L = S.layer(); L.rect(lg.x - legW / 2 - 1.8, bottom - 3.5, legW + 1.8, 3.5); S.commit(L, bt, 'two', { id: 2 });
  }
  // --- torso
  L = S.layer();
  if (dress) L.poly([[tx0, sh + 1], [tx0 + 1, sh], [tx0 + bw - 1, sh], [tx0 + bw, sh + 1], [tx0 + bw + 1, legTop], [tx0 + bw + 3, hem], [tx0 - 3, hem], [tx0 - 1, legTop]]);
  else L.poly([[tx0, sh + 1.5], [tx0 + 1.5, sh], [tx0 + bw - 1.5, sh], [tx0 + bw, sh + 1.5], [tx0 + bw + (spec.topStyle === 'coat' ? 1 : 0), hem], [tx0 - (spec.topStyle === 'coat' ? 1 : 0), hem]]);
  S.commit(L, pal.top, 'cloth', { id: 10 });
  if (spec.apron) { L = S.layer(); L.rect(tx0 - 1.5, sh + 3, 3.5, hem - sh - 2); S.commit(L, pal.apron, 'cloth', { id: 12 }); }
  if (spec.belt || spec.topStyle === 'tunic' || spec.topStyle === 'coat' || spec.topStyle === 'jerkin') { L = S.layer(); L.rect(tx0, legTop - 2 + yo, bw, 2); S.commit(L, pal.belt, 'two', { id: 13 }); }
  if (spec.scarf) { L = S.layer(); L.rect(cx - 4, sh - 1, 8, 2.4); S.commit(L, pal.scarf, 'cloth', { id: 14 }); }
  // --- near arm
  L = S.layer(); L.rect(cx - 1.5 - swing * 1.2, sh + 1.5, 3.4, 8.4); S.commit(L, pal.top, 'cloth', { id: 15 });
  L = S.layer(); L.ellipse(cx - 0.2 - swing * 1.2, sh + 10.6, 1.8, 1.8); S.commit(L, pal.skin, 'sphere', { id: 16, bands: 3 });
  S.rect(cx - 1.5 - swing * 1.2, sh + 8, 3.4, 1, pal.trim[2]);
  accessorySide(S, spec, R, pal, pose, yo, swing);
  // --- head in profile (facing left)
  const hy = R.headCy + yo, hx = cx - 0.5;
  L = S.layer(); L.ellipse(hx, hy, R.headRx - 0.4, R.headRy); L.rect(hx - R.headRx - 0.6, hy + 1, 1.6, 2);
  S.commit(L, pal.skin, 'sphere', { id: 20, bands: 4, cx: hx - 1, cy: hy + 1, rx: R.headRx, ry: R.headRy });
  const eye = spec.eye ?? [34, 28, 52];
  if (spec.hooded) { S.px(Math.round(hx - 4), Math.round(hy + 1), [210, 232, 255]); S.emis[Math.round(hy + 1) * S.w + Math.round(hx - 4)] = 120; }
  else {
    S.rect(hx - 4.5, hy + 0.5, 2, spec.detail === 'hero' ? 3 : 2, eye);
    if (spec.detail !== 'crowd') { S.px(Math.round(hx - 4.5), Math.round(hy + 0.5), [255, 255, 255]); S.rect(hx - 5.5, hy - 2, 3, 1, pal.hair[1]); }
    S.px(Math.round(hx - R.headRx - 0.2), Math.round(hy + 2.5), pal.skin[3]);
    S.rect(hx - 4, hy + 4.8, 1.6, 1, pal.skin[0]);
    if (spec.detail !== 'crowd') S.px(Math.round(hx - 2), Math.round(hy + 3.2), mixRGB(spec.skin, [240, 120, 120], 0.4));
    if (spec.beard && spec.hairStyle !== 'hood') { L = S.layer(); L.poly([[hx - 5.5, hy + 3], [hx + 1, hy + 2], [hx + 3, hy + 6], [hx - 1, hy + 9.5], [hx - 5, hy + 7.5]]); S.commit(L, pal.beard, 'sphere', { id: 4, bands: 3 }); }
  }
  // hair / hat in profile
  const top = hy - R.headRy;
  switch (spec.hairStyle) {
    case 'bald': break;
    case 'hood': L = S.layer(); L.ellipse(hx + 0.8, hy - 0.5, R.headRx + 1.4, R.headRy + 1.8); L.rect(hx + 2, hy, 5, 12); S.commit(L, pal.hat, 'cloth', { id: 7 }); L = S.layer(); L.ellipse(hx - 3.2, hy + 1.2, 3.2, 3.8); S.commit(L, ramp([14, 12, 22]), 'flat', { id: 8 }); if (!spec.hooded) break; S.px(Math.round(hx - 4), Math.round(hy + 1), [210, 232, 255]); break;
    case 'cap': case 'helmet': L = S.layer(); L.ellipse(hx + 0.4, hy - 1.8, R.headRx, R.headRy - 0.8); L.rect(hx - R.headRx - 1.8, hy - 3.2, R.headRx * 2 + 1.8, 2.2); S.commit(L, pal.hat, 'sphere', { id: 7, bands: 4, cx: hx, cy: hy - 3, rx: R.headRx, ry: R.headRy }); if (spec.hairStyle === 'helmet') S.rect(hx - 0.6, top - 0.5, 1.2, 5, pal.metal[3]); break;
    case 'beret': L = S.layer(); L.ellipse(hx + 1, hy - 4.2, R.headRx + 1, 3.6); S.commit(L, pal.hat, 'sphere', { id: 7, bands: 3 }); break;
    case 'kerchief': L = S.layer(); L.ellipse(hx + 0.4, hy - 2, R.headRx, R.headRy - 1.4); L.rect(hx + 2, hy - 1, 5, 6); S.commit(L, pal.hat, 'cloth', { id: 7 }); break;
    default: {
      // hair in profile: a mass over the top and back, hairline in front, ear gap, nape
      const hp: Array<[number, number]> = [[-6.3, -2.4], [-5.4, -6.3], [-2.6, -8.4], [2, -8.9], [5.6, -7], [7.5, -2.6], [7.3, 3.4], [4.8, 4.8], [3, 2], [0.8, -0.8], [-1.8, -1.5], [-4, -1.2], [-5.6, -0.6]];
      L = S.layer(); L.poly(hp.map(([x, y]) => [hx + x, hy + y] as [number, number]));
      if (spec.hairStyle === 'long') L.poly([[hx + 2, hy], [hx + 8, hy - 1], [hx + 8, hy + 14], [hx + 2, hy + 13]] as Array<[number, number]>);
      if (spec.hairStyle === 'bun') L.ellipse(hx + 3.4, top - 1.2, 3.2, 3);
      if (spec.hairStyle === 'spiky') L.poly([[hx - 5.4, hy - 5], [hx - 4.6, top - 3.4], [hx - 1.8, top - 0.8], [hx - 0.2, top - 4.6], [hx + 2.2, top - 0.8], [hx + 4.6, top - 3.8], [hx + 6.2, hy - 4]]);
      S.commit(L, pal.hair, 'sphere', { id: 3, bands: 4, cx: hx + 0.5, cy: hy - 3.5, rx: R.headRx, ry: R.headRy });
    }
  }
  if (spec.accessory === 'lantern' && spec.detail !== 'crowd') { /* drawn in accessorySide */ }
}

function accessoryBack(S: Sprite, spec: CharSpec, R: Rig, pal: P, pose: Pose, dir: 'down' | 'up', yo: number): void {
  const { cx, torsoTop, legTop } = R;
  if (spec.accessory === 'spear' || spec.accessory === 'staff' || spec.accessory === 'broom') {
    const x = cx + 9.5;
    let L = S.layer(); L.rect(x, torsoTop - 12 + yo, 1.6, FOOT_Y - torsoTop + 10 - 1); S.commit(L, pal.wood, 'two', { id: 30 });
    if (spec.accessory === 'spear') { L = S.layer(); L.poly([[x + 0.8, torsoTop - 19 + yo], [x + 3.2, torsoTop - 12 + yo], [x - 1.6, torsoTop - 12 + yo]]); S.commit(L, pal.metal, 'edge', { id: 31 }); }
    if (spec.accessory === 'broom') { L = S.layer(); L.poly([[x - 2.4, FOOT_Y - 6], [x + 4, FOOT_Y - 6], [x + 5, FOOT_Y - 1], [x - 3.4, FOOT_Y - 1]]); S.commit(L, ramp([190, 150, 70]), 'cloth', { id: 32 }); }
  }
  if (spec.sword && dir === 'up') { const L = S.layer(); L.line(cx + 5, legTop - 1, cx - 3, legTop + 9, 1.8); S.commit(L, pal.metal, 'flat', { id: 33 }); }
  void pose;
}

function accessoryFront(S: Sprite, spec: CharSpec, R: Rig, pal: P, pose: Pose, dir: 'down' | 'up', yo: number): void {
  const { cx, torsoTop, legTop } = R;
  const back = dir === 'up';
  let L: Layer;
  if (spec.satchel) {
    if (!back) { L = S.layer(); L.line(cx + 5.5, torsoTop + 1 + yo, cx - 4.5, legTop - 2 + yo, 1.5); S.commit(L, pal.belt, 'flat', { id: 40 }); L = S.layer(); L.rect(cx + 3, legTop - 4 + yo, 6, 6); S.commit(L, ramp([140, 96, 56]), 'edge', { id: 41 }); S.px(cx + 6, legTop - 2 + yo, pal.gold[3]); }
    else { L = S.layer(); L.rect(cx - 8.5, legTop - 5 + yo, 6, 6); S.commit(L, ramp([140, 96, 56]), 'edge', { id: 41 }); }
  }
  if (spec.sword && !back) { L = S.layer(); L.rect(cx - 9, legTop - 3 + yo, 2, 2.6); S.commit(L, pal.gold, 'flat', { id: 42 }); L = S.layer(); L.line(cx - 9, legTop - 1 + yo, cx - 12, legTop + 8, 1.6); S.commit(L, pal.belt, 'flat', { id: 43 }); }
  if (spec.accessory === 'crate') { L = S.layer(); L.rect(cx - 7, torsoTop + 4 + yo, 14, 9); S.commit(L, ramp([150, 106, 62]), 'edge', { id: 44 }); S.rect(cx - 7, torsoTop + 8 + yo, 14, 1, ramp([150, 106, 62])[1]); if (!back) { S.rect(cx - 8, torsoTop + 8 + yo, 3, 3, pal.skin[2]); S.rect(cx + 5, torsoTop + 8 + yo, 3, 3, pal.skin[2]); } }
  if (spec.accessory === 'sack') { L = S.layer(); L.ellipse(cx + (back ? 0 : 5), torsoTop + 2 + yo, 7, 6); S.commit(L, ramp([180, 150, 100]), 'sphere', { id: 45, bands: 3 }); }
  if (spec.accessory === 'basket' && !back) { L = S.layer(); L.ellipse(cx + 8, legTop - 2 + yo, 4.5, 3.4); S.commit(L, ramp([170, 120, 60]), 'sphere', { id: 46, bands: 3 }); S.rect(cx + 5, legTop - 5 + yo, 6, 1, pal.wood[1]); S.px(cx + 6, legTop - 4 + yo, [200, 60, 50]); S.px(cx + 9, legTop - 4 + yo, [220, 180, 60]); }
  if (spec.accessory === 'hammer' && !back) { L = S.layer(); L.line(cx + 9.5, legTop - 7 + yo, cx + 9.5, legTop + 2, 1.6); S.commit(L, pal.wood, 'flat', { id: 47 }); L = S.layer(); L.rect(cx + 7, legTop - 10 + yo, 6, 4); S.commit(L, pal.metal, 'edge', { id: 48 }); }
  if (spec.accessory === 'lantern' && !back) { S.rect(cx + 9, legTop - 3 + yo, 1, 3, pal.wood[2]); L = S.layer(); L.rect(cx + 7.5, legTop + yo, 4, 5); S.commit(L, ramp([255, 190, 90]), 'flat', { id: 49, em: 255 }); }
  void pose;
}

function accessorySide(S: Sprite, spec: CharSpec, R: Rig, pal: P, pose: Pose, yo: number, swing: number): void {
  const { cx, torsoTop, legTop } = R;
  let L: Layer;
  const sh = torsoTop + yo;
  if (spec.sword) { L = S.layer(); L.line(cx + 2, legTop - 1 + yo, cx + 7, legTop + 7, 1.7); S.commit(L, pal.belt, 'flat', { id: 43 }); L = S.layer(); L.rect(cx + 0.5, legTop - 3 + yo, 2.4, 2.4); S.commit(L, pal.gold, 'flat', { id: 42 }); }
  if (spec.satchel) { L = S.layer(); L.rect(cx - 2 + 4, legTop - 5 + yo, 6, 6); S.commit(L, ramp([140, 96, 56]), 'edge', { id: 41 }); L = S.layer(); L.line(cx + 2, sh + 1, cx + 6, legTop - 3 + yo, 1.4); S.commit(L, pal.belt, 'flat', { id: 40 }); }
  if (spec.accessory === 'spear' || spec.accessory === 'staff' || spec.accessory === 'broom') {
    const x = cx - 4 - swing * 1.2;
    L = S.layer(); L.rect(x, sh - 12, 1.6, FOOT_Y - sh + 11); S.commit(L, pal.wood, 'two', { id: 30 });
    if (spec.accessory === 'spear') { L = S.layer(); L.poly([[x + 0.8, sh - 19], [x + 3.2, sh - 12], [x - 1.6, sh - 12]]); S.commit(L, pal.metal, 'edge', { id: 31 }); }
    if (spec.accessory === 'broom') { L = S.layer(); L.poly([[x - 2.4, FOOT_Y - 6], [x + 4, FOOT_Y - 6], [x + 5, FOOT_Y - 1], [x - 3.4, FOOT_Y - 1]]); S.commit(L, ramp([190, 150, 70]), 'cloth', { id: 32 }); }
    L = S.layer(); L.ellipse(x + 0.8, sh + 10.5, 1.8, 1.8); S.commit(L, pal.skin, 'sphere', { id: 16, bands: 3 });
  }
  if (spec.accessory === 'hammer') {
    const k = pose.strike;
    const ang = [-0.3, -1.5, -2.4, -0.8][k] ?? -0.3;
    const hx = cx - 2, hyy = sh + 8;
    L = S.layer(); const ex = hx + Math.cos(ang) * 9, ey = hyy + Math.sin(ang) * -9 * -1; L.line(hx, hyy, hx - 5 + 0 * ex, hyy - 8 * (k === 1 ? 1 : k === 2 ? -0.1 : 0.6) + 3, 1.6); S.commit(L, pal.wood, 'flat', { id: 47 });
    L = S.layer(); const hhx = hx - 5, hhy = hyy - 8 * (k === 1 ? 1 : k === 2 ? -0.1 : 0.6) + 3; L.rect(hhx - 3, hhy - 2.5, 6, 4.5); S.commit(L, pal.metal, 'edge', { id: 48 });
    void ey;
  }
  if (spec.accessory === 'basket') { L = S.layer(); L.ellipse(cx - 4, legTop - 2 + yo, 4.5, 3.4); S.commit(L, ramp([170, 120, 60]), 'sphere', { id: 46, bands: 3 }); S.px(cx - 5, legTop - 5 + yo, [200, 60, 50]); }
  if (spec.accessory === 'crate') { L = S.layer(); L.rect(cx - 10, sh + 4, 11, 9); S.commit(L, ramp([150, 106, 62]), 'edge', { id: 44 }); S.rect(cx - 10, sh + 8, 11, 1, ramp([150, 106, 62])[1]); S.rect(cx - 6, sh + 9, 3, 3, pal.skin[2]); }
  if (spec.accessory === 'sack') { L = S.layer(); L.ellipse(cx + 4, sh + 2, 6.5, 6); S.commit(L, ramp([180, 150, 100]), 'sphere', { id: 45, bands: 3 }); }
  if (spec.accessory === 'lantern') { S.rect(cx - 8, legTop - 3 + yo, 1, 3, pal.wood[2]); L = S.layer(); L.rect(cx - 9.5, legTop + yo, 4, 5); S.commit(L, ramp([255, 190, 90]), 'flat', { id: 49, em: 255 }); }
}

function drawCat(S: Sprite, pose: Pose): void {
  const col = ramp([34, 32, 44]);
  const yo = 0;
  let L = S.layer();
  const by = FOOT_Y - 6 - yo;
  // sitting body + legs
  L.ellipse(15, by + 1, 5.6, 5); S.commit(L, col, 'sphere', { id: 1, bands: 3 });
  L = S.layer(); L.rect(11, by + 3, 3, 3); L.rect(16, by + 3, 3, 3); S.commit(L, col, 'flat', { id: 1 });
  // head
  L = S.layer(); L.ellipse(10.5, by - 4, 3.6, 3.2); L.poly([[7.4, by - 6], [8.2, by - 9], [10, by - 6.6]]); L.poly([[11, by - 6.6], [12.8, by - 9], [13.6, by - 6]]); S.commit(L, col, 'sphere', { id: 2, bands: 3 });
  // tail curl swishing
  const t = pose.tailPhase;
  L = S.layer(); L.line(20, by + 4, 24 + t, by + 1, 1.8); L.line(24 + t, by + 1, 24 + t * 1.6, by - 3 - t, 1.6); S.commit(L, col, 'flat', { id: 3 });
  S.px(9, by - 4, [250, 220, 60]); S.px(12, by - 4, [250, 220, 60]);
  S.emis[(by - 4) * S.w + 9] = 200; S.emis[(by - 4) * S.w + 12] = 200;
  S.px(10, by - 2, [200, 120, 130]);
}

/** Render one frame. detail level strips features rather than just scaling, to keep a clear hierarchy. */
export function renderFrame(spec: CharSpec, dir: Dir, pose: Pose): Sprite {
  const S = new Sprite(FRAME_W, FRAME_H);
  if (spec.kind === 'cat') { drawCat(S, pose); S.outline(0.4); return S; }
  const pal = palette(spec);
  if (dir === 'side') drawSide(S, spec, pose, pal); else drawFront(S, spec, dir, pose, pal);
  S.outline(spec.detail === 'hero' ? 0.36 : spec.detail === 'mid' ? 0.42 : 0.5);
  return S;
}

/* ------------------------------------------------------------------ archetypes */
export const PLAYER: CharSpec = {
  id: 'player', detail: 'hero', skin: [244, 204, 168], hair: [200, 84, 40], hairStyle: 'spiky',
  top: [46, 98, 140], topStyle: 'tunic', trim: [226, 180, 80], trousers: [92, 70, 58], boots: [96, 60, 38], belt: [128, 82, 44],
  cape: [148, 46, 54], capeLining: [226, 204, 176], scarf: [222, 204, 160], satchel: true, sword: true, eye: [52, 36, 40], anims: ['idle', 'walk'], accessory: 'none',
};
export const BLACKSMITH: CharSpec = {
  id: 'blacksmith', detail: 'mid', build: 1.25, skin: [214, 160, 124], hair: [70, 46, 34], beard: [92, 56, 38], hairStyle: 'bandana', hat: [112, 64, 56],
  top: [98, 70, 62], topStyle: 'apronShirt', apron: [88, 62, 44], trousers: [62, 54, 62], boots: [52, 40, 36], belt: [60, 44, 34], accessory: 'hammer', anims: ['idle', 'walk', 'hammer'],
};
export const MERCHANT_WOMAN: CharSpec = {
  id: 'merchant', detail: 'mid', skin: [244, 210, 178], hair: [120, 68, 46], hairStyle: 'long', top: [150, 106, 96], topStyle: 'dress', apron: [230, 218, 192], trousers: [120, 80, 70], boots: [90, 60, 44], trim: [250, 230, 200],
  accessory: 'basket', anims: ['idle', 'walk', 'talk'], blush: true,
};
export const GUARD_A: CharSpec = {
  id: 'guardA', detail: 'mid', skin: [226, 180, 146], hair: [84, 62, 44], hairStyle: 'cap', hat: [70, 80, 98], top: [122, 102, 64], topStyle: 'jerkin', trim: [180, 160, 100], trousers: [74, 66, 66], boots: [70, 50, 38], belt: [92, 64, 40],
  accessory: 'spear', anims: ['idle', 'walk'],
};
export const GUARD_B: CharSpec = {
  id: 'guardB', detail: 'mid', skin: [214, 170, 136], hair: [60, 52, 50], hairStyle: 'helmet', hat: [138, 146, 160], top: [72, 92, 126], topStyle: 'coat', trim: [200, 180, 110], trousers: [60, 62, 74], boots: [58, 46, 40], belt: [96, 70, 44],
  accessory: 'spear', anims: ['idle', 'walk'],
};
export const HOODED: CharSpec = {
  id: 'hooded', detail: 'mid', skin: [200, 170, 160], hair: [40, 30, 50], hairStyle: 'hood', hat: [62, 48, 86], hooded: true, top: [66, 52, 92], topStyle: 'robe', trim: [110, 90, 140], trousers: [40, 34, 56], boots: [34, 28, 40],
  accessory: 'staff', anims: ['idle', 'walk'], satchel: false,
};
export const PORTER: CharSpec = {
  id: 'porter', detail: 'crowd', scale: 0.93, build: 1.1, skin: [226, 178, 140], hair: [90, 64, 40], hairStyle: 'beret', hat: [96, 76, 70], top: [176, 134, 74], topStyle: 'tunic', trousers: [78, 70, 66], boots: [70, 52, 40],
  accessory: 'crate', anims: ['idle', 'carry'],
};
export const CAT: CharSpec = { id: 'cat', detail: 'crowd', kind: 'cat', skin: [0, 0, 0], hair: [0, 0, 0], hairStyle: 'bald', top: [0, 0, 0], topStyle: 'tunic', trousers: [0, 0, 0], boots: [0, 0, 0], anims: ['idle', 'walk'] };

/** Seeded crowd variants: same simple template, different palettes/hair so the street feels populated without spending detail budget. */
export function crowdVariants(seed: number, count: number): CharSpec[] {
  const r = new Rng(seed).fork('crowd');
  const out: CharSpec[] = [];
  for (let i = 0; i < count; i++) {
    const fem = r.bool(0.45);
    const skinT = r.range(0, 1);
    const skin: RGB = [clamp8(248 - skinT * 60), clamp8(212 - skinT * 70), clamp8(180 - skinT * 70)];
    const hairHue = r.pick([22, 30, 38, 12, 50]);
    // crowd wears the city: slate, indigo, undyed wool and weathered leather
    const topHue = r.pick([210, 222, 200, 28, 36, 230, 190]);
    out.push({
      id: `crowd${i}`, detail: 'crowd', scale: r.range(0.9, 1.0), build: r.range(0.92, 1.1), skin,
      hair: hsl(hairHue, r.range(30, 60), r.range(16, 34)), hairStyle: fem ? r.pick<HairStyle>(['bun', 'long', 'kerchief']) : r.pick<HairStyle>(['short', 'cap', 'beret', 'bald']),
      hat: hsl(topHue + 10, 22, 30), top: hsl(topHue, r.range(16, 32), r.range(30, 44)), topStyle: fem ? 'dress' : r.pick<TopStyle>(['tunic', 'jerkin', 'coat']),
      trousers: hsl(r.range(20, 40), 18, r.range(22, 32)), boots: [64, 48, 38], apron: fem && r.bool(0.5) ? [226, 214, 190] : undefined,
      accessory: r.pick<Accessory>(['none', 'none', 'none', 'sack', 'basket', 'lantern']), anims: ['idle', 'walk'],
    });
  }
  return out;
}
