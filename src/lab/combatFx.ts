/** DEV-ONLY: the duel's own pixel-art effects in the arena (journal Passe FX1): `?scene=arena&fx=new`. Reached only through a dynamic import that
 *  `ArenaApp` guards with `import.meta.env.DEV`: production builds compile it out, and the arena without the parameter is untouched. Nothing here
 *  is canonical: the operator decides effect by effect on the sheet of journal Passe FX1.
 *  The effects are painted once at boot (fxPaint.ts: pure functions, the tone of the page's day state) into their own small texture, and drawn
 *  on the x3 grid of the combat sheets in two draws, only while one plays: their core in the opaque pass (depth and protection mask as the
 *  sprites, so the depth of field keeps it sharp), their glow added after it (`maskSafeBlending`). The day's sparks, rings and aura replace the
 *  three old `spark` / `ember` / `guard` frames, which stay in the atlas: without the parameter nothing changes.
 *  `window.__fx`: the atlas' size and paint time; `show(id, frame, who, level)` holds a frame, `all()` holds one of each (the cost's worst case),
 *  `clear()`; `measure()` the on-screen size of a texel. */
import * as THREE from 'three';
import { U, maskSafeBlending } from '../atmosphere/SceneUniforms';
import { LAYER_NOREFLECT } from '../atmosphere/ShadowAndReflection';
import { PIXEL_WORLD, type Actor } from '../characters/SpriteRenderer';
import { parseTime } from '../atmosphere/DayState';
import { toneOf } from '../ui/design/tokens';
import { FX, chargeLevel, fxKey, fxRamp, paintFxAtlas, type FxId } from './fxPaint';
import type { FighterId } from '../arena/CombatSim';
import type { ChargeView } from '../combat/charge';

/** the arena's character scale (ArenaApp) and the hero's in the town (fighterDensity.ts); a texel of the combat sheets at x3 in the world */
const CHAR_SCALE = 1.42, HERO_SCALE = 0.9;
export const FX_TEXEL = (PIXEL_WORLD * CHAR_SCALE * HERO_SCALE) / 3;
/** the height the effects stand at, how far before the body a blow lands (on the sword's arc, at the contact), their place before the fighters and
 *  behind them (m) */
const BODY_Y = 1.62, HIT_OUT = 0.32, FRONT_Z = 0.45, BEHIND_Z = -0.32;
/** how far before the guard the crescent stands, at the blades' contact (Ren holds his sword close, Marek at arm's length) */
const GUARD_OUT: Record<FighterId, number> = { ren: 0.45, marek: 0.82 };
const CAP = 24;

const VERT = /* glsl */ `
attribute vec2 corner;
attribute vec3 iPos;
attribute vec4 iUV;
attribute vec3 iSize;
uniform vec3 uFxRight; uniform vec3 uFxUp; uniform float uClipY; uniform vec2 uResolution; uniform float uFxBack;
varying vec2 vUv;
void main(){
  float cu = iSize.z > 0.0 ? corner.x : 1.0 - corner.x;
  vUv = vec2(mix(iUV.x, iUV.z, cu), mix(iUV.w, iUV.y, corner.y));
  vec3 wp = iPos + uFxRight * ((corner.x - 0.5) * iSize.x) + uFxUp * ((corner.y - 0.5) * iSize.y);
  vec4 clip = projectionMatrix * viewMatrix * vec4(wp, 1.0);
  // the anchor on a pixel of the render target, as the sprites (main pass only)
  if (uClipY < -100.0) {
    vec4 ac = projectionMatrix * viewMatrix * vec4(iPos, 1.0);
    vec2 px = (ac.xy / ac.w * 0.5 + 0.5) * uResolution;
    clip.xy += (floor(px + 0.5) - px) / uResolution * 2.0 * clip.w;
  }
  // the glow's depth behind the fighters (the same place on screen): their silhouette stays whole, it lights the air around them
  if (uFxBack > 0.0) {
    vec4 dc = projectionMatrix * viewMatrix * vec4(iPos + normalize(iPos - cameraPosition) * uFxBack, 1.0);
    clip.z = dc.z / dc.w * clip.w;
  }
  gl_Position = clip;
}`;
const CORE_FRAG = /* glsl */ `
uniform sampler2D tFx; uniform float uFxGain; uniform float uFxMatte;
varying vec2 vUv;
void main(){
  vec4 c = texture2D(tFx, vUv);
  if (c.a < 0.5) discard;
  gl_FragColor = vec4(c.rgb * (c.a > 0.998 ? uFxGain : uFxMatte), 0.0);
}`;
const GLOW_FRAG = /* glsl */ `
uniform sampler2D tFx; uniform float uFxGlow;
varying vec2 vUv;
void main(){
  vec4 c = texture2D(tFx, vUv);
  if (c.a > 0.5 || c.r + c.g + c.b < 0.004) discard;
  gl_FragColor = vec4(c.rgb * uFxGlow, 1.0);
}`;

interface Live { id: FxId; level: number; age: number; x: number; z: number; y: number; flip: boolean; held?: number }

export interface FxTrial {
  /** the duel's events: what plays */
  onEvents(evs: ReadonlyArray<{ type: string } & Record<string, any>>, fighters: Record<FighterId, Actor>): void;
  /** every presentation step */
  present(dt: number, camera: THREE.Camera, fighters: Record<FighterId, Actor>, charge: ChargeView | null): void;
  info: Record<string, unknown>;
}

export function installCombatFx(scene: THREE.Scene, params: URLSearchParams): FxTrial {
  if (params.get('fx') !== 'new') throw new Error(`fx "${params.get('fx')}": new`);
  const t0 = performance.now(), time = parseTime(params), byDay = !!time;
  const seed = (parseInt(params.get('seed') ?? '1842', 10) >>> 0) || 1842;
  const A = paintFxAtlas(fxRamp(toneOf(time), byDay), seed), paintMs = performance.now() - t0;
  const tex = new THREE.DataTexture(new Uint8Array(A.rgba.buffer), A.width, A.height, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.needsUpdate = true;

  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('corner', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), 2));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const mk = (name: string, n: number) => { const a = new THREE.InstancedBufferAttribute(new Float32Array(CAP * n), n); a.setUsage(THREE.DynamicDrawUsage); g.setAttribute(name, a); return a; };
  const pos = mk('iPos', 3), uv = mk('iUV', 4), size = mk('iSize', 3);
  const shared = { tFx: { value: tex }, uFxRight: { value: new THREE.Vector3(1, 0, 0) }, uFxUp: { value: new THREE.Vector3(0, 1, 0) }, uClipY: U.uClipY, uResolution: U.uResolution };
  const gain = byDay ? 1.15 : 1.5, matte = byDay ? 0.7 : 0.45, glow = byDay ? 0.18 : 0.5;
  const coreMat = new THREE.ShaderMaterial({ uniforms: { ...shared, uFxGain: { value: gain }, uFxMatte: { value: matte }, uFxBack: { value: 0 } }, vertexShader: VERT, fragmentShader: CORE_FRAG, side: THREE.DoubleSide });
  const glowMat = new THREE.ShaderMaterial({ uniforms: { ...shared, uFxGlow: { value: glow }, uFxBack: { value: 1.4 } }, vertexShader: VERT, fragmentShader: GLOW_FRAG, side: THREE.DoubleSide, transparent: true, depthWrite: false, depthTest: true, ...maskSafeBlending('additive') });
  const core = new THREE.Mesh(g, coreMat), halo = new THREE.Mesh(g, glowMat);
  core.frustumCulled = halo.frustumCulled = false;
  core.name = 'fx:core'; halo.name = 'fx:glow';
  core.layers.set(LAYER_NOREFLECT); halo.layers.set(LAYER_NOREFLECT); halo.renderOrder = 6;
  scene.add(core, halo);
  g.instanceCount = 0;

  let live: Live[] = [], aura: Live | null = null, popAge = -1, held: Live[] | null = null, cam: THREE.Camera | null = null;
  const put = (i: number, key: string, x: number, y: number, z: number, flip: boolean) => {
    const c = A.cells.get(key)!;
    pos.setXYZ(i, x, y, z);
    uv.setXYZW(i, c[0] / A.width, c[1] / A.height, (c[0] + c[2]) / A.width, (c[1] + c[3]) / A.height);
    size.setXYZ(i, c[2] * FX_TEXEL, c[3] * FX_TEXEL, flip ? -1 : 1);
  };
  /** the frame an effect shows at its age, -1 once over */
  const frameAt = (id: FxId, age: number): number => { const ms = FX[id].ms; let s = 0; for (let f = 0; f < ms.length; f++) { s += ms[f] / 1000; if (age < s) return f; } return -1; };
  /** the cell's centre over the ground, for an effect standing on it */
  const centreY = (id: FxId, y: number): number => { const d = FX[id]; return d.foot === null ? y : (d.h / 2 - (d.h - d.foot)) * FX_TEXEL; };
  const blow = (id: FxId, tgt: Actor, who: FighterId) => {
    const dir = who === 'ren' ? 1 : -1;   // toward the attacker
    live.push({ id, level: 1, age: 0, x: tgt.pos.x + dir * (id === 'guard' ? GUARD_OUT[who] : HIT_OUT), y: BODY_Y, z: FRONT_Z, flip: who === 'ren' });
  };
  const hold = (l: Live[]) => { held = l; };
  const trial: FxTrial = {
    onEvents(evs, F) {
      for (const e of evs) {
        if (e.type === 'impact') {
          const tgt = F[e.to as FighterId], who = e.to as FighterId, heavy = e.kind === 'heavy' || e.damage >= 20;
          if (e.result === 'hit') blow(heavy ? 'hitHeavy' : 'hitLight', tgt, who);
          else if (e.result === 'guarded') blow('guard', tgt, who);
          else if (e.result === 'guardbreak') blow('break', tgt, who);
        } else if (e.type === 'break') blow('break', F[e.who as FighterId], e.who);
        else if (e.type === 'ko') { const a = F[e.who as FighterId]; live.push({ id: 'ko', level: 1, age: 0, x: a.pos.x, y: 0, z: FRONT_Z, flip: e.who === 'ren' }); }
        else if (e.type === 'chargeTier') { if (e.open) popAge = 0; }
        // a skill's own effect, on the one who cast it: the crescent toward the opponent, or the charge's level 2 once through (no blow landed: no star)
        else if (e.type === 'effect') {
          const a = F[e.who as FighterId];
          if (e.family === 'defensive') blow('guard', a, e.who); else live.push({ id: 'charge', level: 2, age: 0, x: a.pos.x, y: 0, z: a.pos.z + BEHIND_Z, flip: !!a.flip });
        }
        else if (e.type === 'reset') { live = []; aura = null; popAge = -1; }
      }
    },
    present(dt, camera, F, charge) {
      cam = camera;
      const m = camera.matrixWorldInverse.elements;
      shared.uFxRight.value.set(m[0], m[4], m[8]); shared.uFxUp.value.set(m[1], m[5], m[9]);
      for (const l of live) l.age += dt;
      live = live.filter((l) => frameAt(l.id, l.age) >= 0);
      if (popAge >= 0) popAge += dt;
      let n = 0;
      if (held) for (const l of held) { put(n++, fxKey(l.id, l.held!, l.level), l.x, centreY(l.id, l.y), l.z, l.flip); }
      else {
        for (const l of live) { if (n < CAP) put(n++, fxKey(l.id, frameAt(l.id, l.age), l.level), l.x, centreY(l.id, l.y), l.z, l.flip); }
        // the aura of the tier a release launches now, or of the one that waits (rules of V2-2): behind the fighter
        const idx = charge ? (charge.held ? charge.launch : charge.waiting) : -1, level = charge ? chargeLevel(idx, charge.tiers.length) : 0;
        if (level > 0 && !F.ren.hidden && n < CAP) {
          if (!aura) aura = { id: 'charge', level, age: 0, x: 0, y: 0, z: 0, flip: !!F.ren.flip };
          aura.level = level; aura.age += dt;
          const ms = FX.charge.ms, poping = popAge >= 0 && popAge < (ms[0] + ms[1]) / 1000;
          const f = poping ? (popAge < ms[0] / 1000 ? 0 : 1) : 2 + (Math.floor(aura.age / (ms[2] / 1000)) % 4);
          put(n++, fxKey('charge', f, level), F.ren.pos.x, centreY('charge', 0), F.ren.pos.z + BEHIND_Z, !!F.ren.flip);
        } else aura = null;
      }
      g.instanceCount = n;
      core.visible = halo.visible = n > 0;
      pos.needsUpdate = uv.needsUpdate = size.needsUpdate = true;
    },
    info: { atlas: [A.width, A.height], bytes: A.width * A.height * 4, paintMs: +paintMs.toFixed(1), frames: A.cells.size, texel: FX_TEXEL, gain, matte, glow, effects: Object.keys(FX) },
  };
  const at = (who: FighterId): number => (who === 'ren' ? -2.15 : 2.15);
  Object.assign(window, { __fx: {
    ...trial.info,
    show: (id: FxId, frame: number, who: FighterId = 'marek', level = 1) => {
      const d = FX[id], foot = d.foot !== null;
      hold([{ id, level, age: 0, held: frame, x: at(who) + (foot ? 0 : (who === 'ren' ? 1 : -1) * (id === 'guard' ? GUARD_OUT[who] : HIT_OUT)), y: foot ? 0 : BODY_Y, z: id === 'charge' ? BEHIND_Z : FRONT_Z, flip: who === 'ren' }]);
    },
    all: () => hold((Object.keys(FX) as FxId[]).map((id, i) => { const d = FX[id]; return { id, level: d.levels, age: 0, held: Math.floor(d.ms.length / 2), x: -3 + i * 1.2, y: d.foot !== null ? 0 : BODY_Y, z: FRONT_Z, flip: false }; })),
    clear: () => { held = null; },
    /** device pixels of one texel at the fighters' depth */
    measure: () => {
      if (!cam) return null;
      const a = new THREE.Vector3(0, BODY_Y, FRONT_Z).project(cam), b = new THREE.Vector3(FX_TEXEL * 100, BODY_Y, FRONT_Z).project(cam);
      return (Math.abs(b.x - a.x) / 2 * (U.uResolution.value as THREE.Vector2).x) / 100;
    },
  } });
  return trial;
}
