import * as THREE from 'three';
import { U, maskSafeBlending } from '../atmosphere/SceneUniforms';
import { COMMON_GLSL } from '../materials/ShaderChunks';
import { FRAME_W, FRAME_H, FOOT_Y, type Dir, type Anim } from './SpriteGenerator';
import type { SpriteAtlas, FrameRect } from './SpriteAtlas';
import type { LightRig, LightSource } from '../atmosphere/LightRig';
import { LAYER_NOREFLECT } from '../atmosphere/ShadowAndReflection';
import variantsFile from '../../art-lab/characters/variants/variants.json';
import { rampTable, type VariantsFile } from './Variants';

/** One shared pixel-art billboard per actor, rendered as 3D: depth-tested, lit by the scene's own light list,
 *  grounded by projected contact shadows. Readability rules:
 *   - nearest-texel sampling: every screen pixel shows exactly one authored texel (the sprite palette survives)
 *   - the anchor is snapped to the render-target pixel grid, so texel edges never crawl while actors / camera move
 *   - characters write a protection mask into the scene alpha; the DOF keeps them sharp while the set softens, the in-scatter keeps part of
 *     their contrast. Nothing drawn after them touches that alpha (maskSafeBlending), so no second pass of the characters is needed
 *   - a quiet silhouette treatment: lit-side edge lifted toward the key light (generated sprites only: a baked sheet keeps its authored
 *     outline), shadow-side edge cooler / darker */

export const PIXEL_WORLD = 0.047; // metres per sprite pixel
/** a sprite's depth: one card at its anchor, this many metres toward the camera (the body's half-thickness); < 0 = the quad's own depth */
export const SPRITE_DEPTH_CARD = 0.2;
/** walk (and carry) frames per second at the actor's animation clock; a baked walker's clock runs at its speed over the speed its cycle
 *  draws (ActorSystem.walkClock), so its planted foot stays on the ground */
export const WALK_CADENCE = 7.5;
/** ?spriteedge=dark: a baked sheet's outer texel ring keeps this share of its colour (journal Passe S3) */
export const EDGE_INK = 0.25;

export interface Actor {
  id: number;
  spec: string;
  /** the generated archetype a production baked sheet stands in for (`BakedCast.ts`): behaviours keyed on the archetype keep it */
  base?: string;
  role: string;
  detail: 'hero' | 'mid' | 'crowd';
  pos: THREE.Vector3;
  facing: Dir | 'left' | 'right';
  dir: Dir;
  flip: boolean;
  anim: Anim;
  t: number;
  speed: number;
  tint: [number, number, number];
  bubble?: 'dots' | 'exclaim' | null;
  scale: number;
  height: number;
  radius: number;
  hidden?: boolean;
  behaviour?: { kind: 'idle' | 'patrol' | 'wander' | 'work' | 'player'; waypoints?: THREE.Vector3[]; wait?: number; idx?: number; target?: THREE.Vector3 | null; seed: number };
  /** world-space facing (x, z); dir / flip are re-derived from it against the camera every frame */
  faceVec?: [number, number];
  /** faceVec is a walking heading: shown by its on-screen direction instead of the world rule (`ActorSystem.screenFacing`) */
  faceWalk?: boolean;
  /** flip to use if this animation only exists in the side view (e.g. the smith's hammer cycle) */
  sideFlip?: boolean;
  /** NPC variant of a baked sheet (Variants.ts): ramp rows (-1 = keep) and the sheet's luminance ranges of its masked hair / skin */
  variant?: { hair: number; skin: number; hairRange: [number, number] | null; skinRange: [number, number] | null };
  /** no contact or light shadows (an effect sprite: the arena's impact sparks, journal Passe P1) */
  noShadow?: boolean;
}

/** Baked (authored) frames live in their own texture and are addressed by their INTEGER cell (x0, y0 = bottom-left data texel, w, h):
 *  local texel = floor(t * cell size) with t in [0, 1] across the quad (t never depends on the atlas size or on where the cell is), clamped
 *  to the cell (a fragment on the quad's far edge never reads a neighbour), then sampled at the texel CENTRE (exact under nearest filtering
 *  for any texture size). Boundary policy: a texel edge exactly on a fragment centre goes to the higher texel, identically for every atlas.
 *  Reads outside the cell (silhouette neighbours) are transparent by definition. Generated frames keep their unchanged normalised path. */
export const BAKED_GLSL = /* glsl */ `
uniform sampler2D tBaked;
uniform vec2 uBakedSize;
vec2 bakedTexel(vec4 cell, vec2 t) { return cell.xy + clamp(floor(t * cell.zw), vec2(0.0), cell.zw - 1.0); }
vec4 bakedAt(vec2 texel) { return texture2D(tBaked, (texel + 0.5) / uBakedSize); }
float bakedAlpha(vec4 cell, vec2 texel) {
  vec2 l = texel - cell.xy;
  float a = bakedAt(texel).a;   // fetched unconditionally (no texture read inside a branch)
  return (l.x >= 0.0 && l.y >= 0.0 && l.x < cell.z && l.y < cell.w) ? a : 0.0;
}
`;

const BODY_VERT = /* glsl */ `
attribute vec2 corner;
attribute vec3 iPos;
attribute vec4 iUV;
attribute vec4 iTint;
attribute float iFlip;
attribute vec4 iFx; // dof protection, key-light side (-1 screen left .. +1 right), key warmth, edge amount
attribute vec4 iCell; // baked frames: integer cell (x0, y0, w, h) in the baked texture; w = 0 for generated frames
attribute vec4 iVarA; // NPC variant: hair ramp row, skin ramp row (-1 = keep), hair luminance range
attribute vec4 iVarB; // skin luminance range
uniform vec2 uWorldSize;
uniform float uFootOffset;
uniform vec3 uBillRight;
uniform vec3 uBillUp;
uniform float uClipY;
uniform float uCharScale;
uniform vec2 uResolution;
uniform float uDepthCard;
varying vec3 vWorld; varying vec3 vFeet; varying vec2 vUv; varying vec4 vTint; varying float vH; varying vec4 vFx; varying float vFlip;
varying vec2 vT; varying vec4 vCell; varying vec4 vVarA; varying vec4 vVarB;
void main(){
  vVarA = iVarA; vVarB = iVarB;
  float sc = iTint.w * uCharScale;
  vec3 wp = iPos + uBillRight * ((corner.x - 0.5) * uWorldSize.x * sc) + uBillUp * ((corner.y * uWorldSize.y - uFootOffset) * sc);
  vWorld = wp; vFeet = iPos; vTint = iTint; vH = corner.y; vFx = iFx; vFlip = iFlip;
  float cu = iFlip > 0.0 ? corner.x : 1.0 - corner.x;
  vUv = vec2(mix(iUV.x, iUV.z, cu), mix(iUV.y, iUV.w, corner.y));
  vT = vec2(cu, corner.y); vCell = iCell;
  vec4 clip = projectionMatrix * viewMatrix * vec4(wp, 1.0);
  // pixel stability: shift the whole sprite so its anchor lands on a pixel corner of the render target
  // (main pass only; the half-res mirror pass is rippled anyway)
  if (uClipY < -100.0) {
    vec4 ac = projectionMatrix * viewMatrix * vec4(iPos, 1.0);
    vec2 px = (ac.xy / ac.w * 0.5 + 0.5) * uResolution;
    clip.xy += (floor(px + 0.5) - px) / uResolution * 2.0 * clip.w;
    // depth: the whole sprite at ONE depth, its anchor's, pulled toward the camera by the body's half-thickness (uDepthCard, metres). The
    // quad leans back with the camera's pitch (tilt), so its top (the head) sat ~0.25 m deeper than the feet and props standing behind the
    // character covered it (a stall lantern 0.5 m behind the merchant hid her hair, journal Passe S1b); a flat quad also cut through posts
    // and walls right beside it, and through other characters. Geometry nearer than the card still hides the sprite (a counter in front).
    if (uDepthCard >= 0.0) {
      vec4 dc = projectionMatrix * viewMatrix * vec4(iPos + normalize(cameraPosition - iPos) * uDepthCard, 1.0);
      clip.z = dc.z / dc.w * clip.w;
    }
  }
  gl_Position = clip;
}
`;

const BODY_FRAG = /* glsl */ `
${COMMON_GLSL}
uniform sampler2D tAtlas;
uniform sampler2D tEmis;
uniform vec2 uAtlasSize;
uniform float uSat;
uniform float uLightChroma;
uniform float uEdge;
uniform sampler2D tRamps;
uniform float uRampRows;
${BAKED_GLSL}
varying vec3 vWorld; varying vec3 vFeet; varying vec2 vUv; varying vec4 vTint; varying float vH; varying vec4 vFx; varying float vFlip;
varying vec2 vT; varying vec4 vCell; varying vec4 vVarA; varying vec4 vVarB;
void main(){
  // nearest texel (the old sharp-bilinear sampled texel boundaries, blending every pixel with its neighbour)
  vec2 uv = (floor(vUv * uAtlasSize) + 0.5) / uAtlasSize;
  vec4 c = texture2D(tAtlas, uv);
  // baked frame: integer cell addressing (BAKED_GLSL); both paths are fetched, the instance picks one (no texture read in a branch)
  bool baked = vCell.z > 0.5;
  vec2 bt = bakedTexel(vCell, vT);
  vec4 cb = bakedAt(bt);
  if (baked) c = cb;
  if (c.a < 0.5) discard;
  // NPC variant: a baked texel's material is in its alpha (255 other, 254 hair, 253 skin); a masked texel takes the target ramp's colour
  // at its luminance rank within the sheet's range of that material (lighting is applied afterwards, as to any texel)
  float mat = floor(c.a * 255.0 + 0.5);
  float row = !baked ? -1.0 : mat == 254.0 ? vVarA.x : mat == 253.0 ? vVarA.y : -1.0;
  if (row >= 0.0) {
    vec2 r = mat == 254.0 ? vVarA.zw : vVarB.xy;
    float t = clamp((dot(c.rgb, vec3(0.2126, 0.7152, 0.0722)) - r.x) / max(r.y - r.x, 1e-4), 0.0, 1.0);
    c.rgb = texture2D(tRamps, vec2((t * 4.0 + 0.5) / 5.0, (row + 0.5) / uRampRows)).rgb;
  }
  float prot = 1.0 - vFx.x;
  if (vTint.r < 0.0) { gl_FragColor = vec4(applyFog(c.rgb * 1.15, vWorld), prot); return; }
  float em = texture2D(tEmis, uv).r;
  if (baked) em = 0.0;   // a baked sheet has no emissive layer
  vec3 V = normalize(cameraPosition - vWorld);
  vec3 N = normalize(V + vec3(0.0, 0.45, 0.0));
  vec3 albedo = c.rgb * vTint.rgb;
  // characters sit inside the scene palette: readable value contrast, slightly muted chroma
  albedo = mix(vec3(dot(albedo, vec3(0.3, 0.55, 0.15))), albedo, uSat);
  vec3 hemi = mix(uGroundAmb, uSkyAmb, 0.7);
  float sh = moonShadow(vFeet + vec3(0.0, 0.5, 0.0), vec3(0.0, 1.0, 0.0));
  vec3 moon = uMoonCol * (0.55 + 0.25 * N.y) * sh;
  vec3 diff, spec;
  lightSum(vWorld, N, V, 1.0, 0.7, diff, spec);
  // warm lights compress harder than on walls so a hero light (the forge fire) tints a character amber instead of
  // blowing its ramps out to white
  vec3 dl = diff / (1.0 + 0.95 * diff);
  // restrained light colour: the cool ambient / moon keep only part of their blue, the lamps most of their amber;
  // the sprite's own ramps carry the hue. A small cool floor keeps silhouettes legible in the darkest pockets.
  const vec3 LUM = vec3(0.3, 0.55, 0.15);
  vec3 amb = hemi * 1.25 + moon;
  amb = mix(vec3(dot(amb, LUM)), amb, uLightChroma);
  dl = mix(vec3(dot(dl, LUM)), dl, 0.85);
  vec3 light = amb + dl + vec3(0.012, 0.016, 0.026);
  float vert = mix(0.72, 1.04, smoothstep(0.0, 0.45, vH));
  vec3 col = albedo * light * vert;
  // silhouette: edge texels (a transparent neighbour) facing the key light lift toward it, edges facing away
  // cool and darken, the crown catches a thin moon rim; reads as separation, never as a cartoon line
  vec2 tx = vec2(vFlip / uAtlasSize.x, 0.0), ty = vec2(0.0, 1.0 / uAtlasSize.y);
  // neighbour alphas: the generated fetches as before; a baked frame swaps in its own (outside the cell = transparent)
  float nR = texture2D(tAtlas, uv + tx).a, nL = texture2D(tAtlas, uv - tx).a, nU = texture2D(tAtlas, uv + ty).a;
  float mR = bakedAlpha(vCell, bt + vec2(vFlip, 0.0)), mL = bakedAlpha(vCell, bt - vec2(vFlip, 0.0)), mU = bakedAlpha(vCell, bt + vec2(0.0, 1.0));
  if (baked) { nR = mR; nL = mL; nU = mU; }
  float aR = step(0.5, nR), aL = step(0.5, nL), aU = step(0.5, nU);
  float side = vFx.y, amt = vFx.w * uEdge;
  // a baked sheet keeps its authored outline: no lit-side lift (operator's decision, journal Passe S1); crown rim and shadow side stay
  float litEdge = baked ? 0.0 : (1.0 - (side >= 0.0 ? aR : aL)) * abs(side);
  float shdEdge = (1.0 - (side >= 0.0 ? aL : aR)) * abs(side);
  vec3 key = mix(uMoonCol * 1.6, vec3(1.0, 0.64, 0.34) * 0.9, vFx.z);
  col += key * (0.1 + 0.5 * dot(albedo, vec3(0.3, 0.55, 0.15))) * litEdge * amt;
#ifdef SPRITE_NORIM
  // ?spriteedge (journal Passe S3): the crown rim lights a baked sheet's top edge with uMoonCol, the sun by day (2.9: +0.64 on every top
  // edge texel, the white contour the operator saw), so a baked sheet takes none; generated sprites keep it
  if (!baked) col += uMoonCol * 0.22 * (1.0 - aU) * amt * sh;
#else
  col += uMoonCol * 0.22 * (1.0 - aU) * amt * sh;
#endif
  col *= 1.0 - shdEdge * amt * vec3(0.3, 0.26, 0.12);
  col = col / (1.0 + 0.18 * col);
#ifdef SPRITE_DARK
  // ?spriteedge=dark: a baked sheet's outer texel ring (any transparent 4-neighbour) darkened toward black, its hue kept
  float mD = bakedAlpha(vCell, bt - vec2(0.0, 1.0));
  float ring = baked ? 1.0 - aR * aL * aU * step(0.5, mD) : 0.0;
  col *= 1.0 - ring * (1.0 - EDGE_INK);
#endif
  col += albedo * em * 2.6;
  gl_FragColor = vec4(applyFog(col, vWorld), prot);
}
`;

const SHADOW_VERT = /* glsl */ `
attribute vec2 corner;
attribute vec3 iPos;
attribute vec4 iUV;
attribute vec4 iShadow; // dir.x, dir.z, length(m), alpha
attribute float iFlip;
attribute vec4 iCell;
uniform vec2 uWorldSize;
uniform float uFootOffset;
uniform vec3 uBillRight;
uniform float uCharScale;
varying vec2 vUv; varying float vAlpha; varying vec2 vLocal; varying float vBlob; varying float vFade;
varying vec2 vT; varying vec4 vCell;
void main(){
  bool blob = iShadow.z < 0.0;
  vec3 dir = vec3(iShadow.x, 0.0, iShadow.y);
  vec3 wp;
  float S = uCharScale;
  float h = (corner.y * uWorldSize.y - uFootOffset) * S;
  if (blob) {
    // contact ellipse aligned to the view: wide across the screen, shallow in depth
    vec2 q = (corner - vec2(0.5, 0.5)) * 2.0;
    vec3 fwd = vec3(-uBillRight.z, 0.0, uBillRight.x);
    wp = iPos + (uBillRight * q.x * 0.46 + fwd * q.y * 0.3) * S + vec3(0.0, 0.025, 0.0);
    vLocal = q;
  } else {
    wp = iPos + uBillRight * ((corner.x - 0.5) * uWorldSize.x * S) + dir * (max(h, 0.0) * iShadow.z) + vec3(0.0, 0.02, 0.0);
    vLocal = vec2(0.0);
  }
  float cu = iFlip > 0.0 ? corner.x : 1.0 - corner.x;
  vUv = vec2(mix(iUV.x, iUV.z, cu), mix(iUV.y, iUV.w, corner.y));
  vT = vec2(cu, corner.y); vCell = iCell;
  vAlpha = iShadow.w; vBlob = blob ? 1.0 : 0.0; vFade = 1.0 - corner.y * 0.7;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
}
`;
const SHADOW_FRAG = /* glsl */ `
uniform sampler2D tAtlas;
${BAKED_GLSL}
varying vec2 vUv; varying float vAlpha; varying vec2 vLocal; varying float vBlob; varying float vFade;
varying vec2 vT; varying vec4 vCell;
void main(){
  float a;
  float ga = texture2D(tAtlas, vUv).a, ba = bakedAt(bakedTexel(vCell, vT)).a;
  // blob: soft ambient-occlusion pool plus a tight dark core right under the feet (no floating)
  if (vBlob > 0.5) { float d = length(vLocal); a = min(1.0, (smoothstep(1.0, 0.15, d) * 0.72 + smoothstep(0.42, 0.0, d) * 0.4) * vAlpha); }
  else a = (vCell.z > 0.5 ? ba : ga) > 0.5 ? vAlpha * vFade : 0.0;
  if (a < 0.01) discard;
  gl_FragColor = vec4(0.012, 0.02, 0.05, a);
}
`;

export class SpriteRenderer {
  readonly group = new THREE.Group();
  private body: THREE.Mesh;
  private shadow: THREE.Mesh;
  /** NPC variant ramps: created only once an actor shows a variant (a texture's uuid draws from Math.random: created at boot it shifted
   *  every later draw, the NPCs' spawn phases included, journal Passe V1) */
  private ramps: { texture: THREE.DataTexture; rows: number } | null = null;
  private cap = 0;
  private attrs!: { pos: THREE.InstancedBufferAttribute; uv: THREE.InstancedBufferAttribute; tint: THREE.InstancedBufferAttribute; flip: THREE.InstancedBufferAttribute; fx: THREE.InstancedBufferAttribute; cell: THREE.InstancedBufferAttribute; varA: THREE.InstancedBufferAttribute; varB: THREE.InstancedBufferAttribute };
  private sattrs!: { pos: THREE.InstancedBufferAttribute; uv: THREE.InstancedBufferAttribute; sh: THREE.InstancedBufferAttribute; flip: THREE.InstancedBufferAttribute; cell: THREE.InstancedBufferAttribute };
  private bodyMat: THREE.ShaderMaterial;
  private shadowMat: THREE.ShaderMaterial;
  private readonly shared: { uWorldSize: { value: THREE.Vector2 }; uFootOffset: { value: number }; uBillRight: { value: THREE.Vector3 }; uBillUp: { value: THREE.Vector3 }; uCharScale: { value: number } };
  tilt = 0.85;
  shadowAlpha = 1;
  /** apparent character scale (driven by the camera graph: larger in the close framings) */
  charScale = 1;
  /** DOF protection per detail tier (1 = never blurred); the player and the interaction target are always 1 */
  protect = { hero: 1, mid: 1, crowd: 0.8 };

  /** baked sheets' silhouette edge (?spriteedge, journal Passe S3): 'norim' = no crown rim (the white contour by day), 'dark' = no rim and
   *  the outer texel ring darkened to `ink` x its colour; null = as before (the shader compiles without either branch) */
  setEdgeMode(mode: 'norim' | 'dark' | null, ink = EDGE_INK): void {
    const d = this.bodyMat.defines as Record<string, string | number>;
    // #ifdef only: an undefined macro in an #if expression does not compile in GLSL ES
    delete d.SPRITE_NORIM; delete d.SPRITE_DARK; delete d.EDGE_INK;
    if (mode) d.SPRITE_NORIM = '';
    if (mode === 'dark') { d.SPRITE_DARK = ''; d.EDGE_INK = ink.toFixed(3); }
    this.bodyMat.needsUpdate = true;
  }

  /** `frame`: the texel size of the atlas' cells and their foot row (the town's 32 x 48 frames by default; the arena's fighters use larger
   *  cells at the same texel size, journal Passe P1) */
  constructor(private atlas: SpriteAtlas, capacity = 48, frame: { w: number; h: number; foot: number } = { w: FRAME_W, h: FRAME_H, foot: FOOT_Y }) {
    this.shared = {
      uWorldSize: { value: new THREE.Vector2(frame.w * PIXEL_WORLD, frame.h * PIXEL_WORLD) },
      uFootOffset: { value: (frame.h - frame.foot) * PIXEL_WORLD },
      uBillRight: { value: new THREE.Vector3(1, 0, 0) },
      uBillUp: { value: new THREE.Vector3(0, 1, 0) },
      uCharScale: { value: 1 },
    };
    const shared = this.shared;
    // baked frames' texture (an atlas without baked sheets, e.g. the DEV preview's private one, gets a 1 x 1 transparent texture)
    const bt = atlas.bakedTexture ?? emptyBaked();
    const baked = { tBaked: { value: bt }, uBakedSize: { value: new THREE.Vector2(bt.image.width, bt.image.height) } };
    this.bodyMat = new THREE.ShaderMaterial({
      uniforms: { ...U, ...shared, ...baked, tAtlas: { value: atlas.texture }, tEmis: { value: atlas.emis }, uAtlasSize: { value: new THREE.Vector2(atlas.width, atlas.height) }, uSat: { value: 0.8 }, uLightChroma: { value: 0.62 }, uEdge: { value: 1 }, uDepthCard: { value: SPRITE_DEPTH_CARD }, tRamps: { value: bt }, uRampRows: { value: 1 } },
      vertexShader: BODY_VERT, fragmentShader: BODY_FRAG, side: THREE.DoubleSide,
    });
    this.shadowMat = new THREE.ShaderMaterial({
      uniforms: { ...shared, ...baked, tAtlas: { value: atlas.texture } },
      vertexShader: SHADOW_VERT, fragmentShader: SHADOW_FRAG, transparent: true, depthWrite: false, depthTest: true, side: THREE.DoubleSide,
      polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, ...maskSafeBlending('normal'),
    });
    this.body = new THREE.Mesh(new THREE.BufferGeometry(), this.bodyMat);
    this.shadow = new THREE.Mesh(new THREE.BufferGeometry(), this.shadowMat);
    this.body.frustumCulled = false; this.shadow.frustumCulled = false;
    this.shadow.layers.set(LAYER_NOREFLECT); this.shadow.renderOrder = 3;
    this.group.add(this.body, this.shadow);
    this.alloc(capacity);
  }

  private alloc(n: number): void {
    this.cap = n;
    const quad = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);
    const mkGeo = (inst: number) => {
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('corner', new THREE.BufferAttribute(quad, 2));
      g.setIndex([0, 1, 2, 0, 2, 3]);
      g.instanceCount = inst;
      return g;
    };
    const g = mkGeo(0);
    const mk = (size: number) => { const a = new THREE.InstancedBufferAttribute(new Float32Array(n * size), size); a.setUsage(THREE.DynamicDrawUsage); return a; };
    this.attrs = { pos: mk(3), uv: mk(4), tint: mk(4), flip: mk(1), fx: mk(4), cell: mk(4), varA: mk(4), varB: mk(4) };
    g.setAttribute('iVarA', this.attrs.varA); g.setAttribute('iVarB', this.attrs.varB);
    g.setAttribute('iPos', this.attrs.pos); g.setAttribute('iUV', this.attrs.uv); g.setAttribute('iTint', this.attrs.tint); g.setAttribute('iFlip', this.attrs.flip); g.setAttribute('iFx', this.attrs.fx); g.setAttribute('iCell', this.attrs.cell);
    this.body.geometry.dispose(); this.body.geometry = g;
    const sg = mkGeo(0);
    const sn = n * 5;
    const mk2 = (size: number) => { const a = new THREE.InstancedBufferAttribute(new Float32Array(sn * size), size); a.setUsage(THREE.DynamicDrawUsage); return a; };
    this.sattrs = { pos: mk2(3), uv: mk2(4), sh: mk2(4), flip: mk2(1), cell: mk2(4) };
    sg.setAttribute('iPos', this.sattrs.pos); sg.setAttribute('iUV', this.sattrs.uv); sg.setAttribute('iShadow', this.sattrs.sh); sg.setAttribute('iFlip', this.sattrs.flip); sg.setAttribute('iCell', this.sattrs.cell);
    this.shadow.geometry.dispose(); this.shadow.geometry = sg;
  }

  update(actors: Actor[], lights: LightRig, camera: THREE.Camera, moonDir: THREE.Vector3, target: Actor | null = null, player: Actor | null = null): void {
    if (actors.length * 2 > this.cap) this.alloc(Math.max(this.cap * 2, actors.length * 2));
    // billboard basis from the main camera (also used when rendering the planar reflection)
    const m = camera.matrixWorldInverse.elements;
    const right = new THREE.Vector3(m[0], m[4], m[8]); right.y = 0; right.normalize();
    const camUp = new THREE.Vector3(m[1], m[5], m[9]);
    const up = new THREE.Vector3(0, 1, 0).lerp(camUp, this.tilt).normalize();
    this.shared.uBillRight.value.copy(right); this.shared.uBillUp.value.copy(up);
    this.shared.uCharScale.value = this.charScale;
    const S = this.charScale;

    let bi = 0, si = 0;
    const a = this.attrs, s = this.sattrs;
    const putShadow = (act: Actor, fr: FrameRect, flip: boolean, dx: number, dz: number, len: number, alpha: number) => {
      if (alpha < 0.01) return;
      s.pos.setXYZ(si, act.pos.x, act.pos.y, act.pos.z);
      s.uv.setXYZW(si, fr.u0, fr.v0, fr.u1, fr.v1);
      setCell(s.cell, si, fr);
      s.sh.setXYZW(si, dx, dz, len, alpha * this.shadowAlpha);
      s.flip.setX(si, flip ? -1 : 1);
      si++;
    };
    const mh = Math.hypot(moonDir.x, moonDir.z) || 1;
    const moonSide = (moonDir.x * right.x + moonDir.z * right.z) / mh;
    for (const act of actors) {
      if (act.hidden) continue;
      // some cycles exist only in the side view (the smith's hammer) or not at all for an archetype: fall back
      // instead of silently dropping the character
      let fr = this.atlas.frame(act.spec, act.dir, act.anim, frameIndex(this.atlas, act)), flip = act.flip;
      if (!fr) { fr = this.atlas.frame(act.spec, 'side', act.anim, frameIndex(this.atlas, act)); flip = !!act.sideFlip; }
      if (!fr) { fr = this.atlas.frame(act.spec, act.dir, 'idle', 0); flip = act.flip; }
      if (!fr) continue;
      // shadow budget: contact blob + the two strongest warm lights + moon
      const cand: Array<{ l: LightSource; w: number }> = [];
      for (const l of lights.sources) {
        if (l.scale < 0.05) continue;
        const dx = act.pos.x - l.pos.x, dz = act.pos.z - l.pos.z;
        const d2 = dx * dx + dz * dz + (l.pos.y - 1) * (l.pos.y - 1);
        if (d2 > l.radius * l.radius) continue;
        cand.push({ l, w: (l.intensity * l.level * l.scale) / (1 + d2 * 0.25) });
      }
      cand.sort((p, q) => q.w - p.w);
      // silhouette key: the strongest warm light when one is close, otherwise the moon
      let side = moonSide * 0.8, warm = 0, edge = 0.55;
      if (cand.length && cand[0].w > 0.25) {
        const l = cand[0].l, hx = l.pos.x - act.pos.x, hz = l.pos.z - act.pos.z, hd = Math.hypot(hx, hz) || 1;
        side = THREE.MathUtils.clamp(((hx * right.x + hz * right.z) / hd) * 1.25, -1, 1);
        warm = Math.min(1, cand[0].w * 0.7);
        edge = Math.min(1, 0.55 + cand[0].w * 0.3);
      }
      const prot = act === player || act === target ? 1 : this.protect[act.detail];
      a.pos.setXYZ(bi, act.pos.x, act.pos.y + 0.01, act.pos.z);
      a.uv.setXYZW(bi, fr.u0, fr.v0, fr.u1, fr.v1);
      setCell(a.cell, bi, fr);
      a.tint.setXYZW(bi, act.tint[0], act.tint[1], act.tint[2], act.scale);
      a.flip.setX(bi, flip ? -1 : 1);
      a.fx.setXYZW(bi, prot, side, warm, edge);
      const vr = act.variant, hr = vr?.hairRange, sr = vr?.skinRange;
      if (vr && !this.ramps) { this.ramps = rampTexture(); this.bodyMat.uniforms.tRamps.value = this.ramps.texture; this.bodyMat.uniforms.uRampRows.value = this.ramps.rows; }
      a.varA.setXYZW(bi, vr && hr ? vr.hair : -1, vr && sr ? vr.skin : -1, hr?.[0] ?? 0, hr?.[1] ?? 1);
      a.varB.setXYZW(bi, sr?.[0] ?? 0, sr?.[1] ?? 1, 0, 0);
      bi++;
      if (act.noShadow) continue;
      s.pos.setXYZ(si, act.pos.x, act.pos.y, act.pos.z); s.uv.setXYZW(si, fr.u0, fr.v0, fr.u1, fr.v1); setCell(s.cell, si, fr); s.sh.setXYZW(si, 0, 0, -1, 0.85 * this.shadowAlpha); s.flip.setX(si, 1); si++;
      for (let k = 0; k < Math.min(2, cand.length); k++) {
        const l = cand[k].l;
        let dx = act.pos.x - l.pos.x, dz = act.pos.z - l.pos.z;
        const hd = Math.hypot(dx, dz) || 0.001;
        dx /= hd; dz /= hd;
        const lh = Math.max(l.pos.y, 1.9);
        const len = Math.min(2.6, (act.height * hd) / Math.max(0.6, lh - act.height * 0.9));
        putShadow(act, fr, flip, dx, dz, Math.max(0.35, len) / (act.height + 0.001) * 1.0, Math.min(0.6, cand[k].w * 0.32 + 0.1));
      }
      putShadow(act, fr, flip, -moonDir.x / mh, -moonDir.z / mh, (mh / Math.max(0.2, moonDir.y)) * 1.0, 0.16);
      if (act.bubble) {
        const bf = this.atlas.frames.get(`fx/bubble/${act.bubble}`);
        if (bf) {
          const bob = Math.sin(performance.now() * 0.004) * 0.04;
          a.pos.setXYZ(bi, act.pos.x, act.pos.y + act.height * S - 0.05 + bob, act.pos.z);
          a.uv.setXYZW(bi, bf.u0, bf.v0, bf.u1, bf.v1); setCell(a.cell, bi, bf); a.tint.setXYZW(bi, -1, -1, -1, 0.9); a.flip.setX(bi, 1); a.fx.setXYZW(bi, 1, 0, 0, 0); a.varA.setXYZW(bi, -1, -1, 0, 1); bi++;
        }
      }
    }
    a.pos.needsUpdate = a.uv.needsUpdate = a.tint.needsUpdate = a.flip.needsUpdate = a.fx.needsUpdate = a.cell.needsUpdate = a.varA.needsUpdate = a.varB.needsUpdate = true;
    s.pos.needsUpdate = s.uv.needsUpdate = s.sh.needsUpdate = s.flip.needsUpdate = s.cell.needsUpdate = true;
    (this.body.geometry as THREE.InstancedBufferGeometry).instanceCount = bi;
    (this.shadow.geometry as THREE.InstancedBufferGeometry).instanceCount = si;
  }
}

/** baked frames carry their integer cell; generated frames a zero cell (w = 0 selects the generated path in the shaders) */
function setCell(attr: THREE.InstancedBufferAttribute, i: number, fr: FrameRect): void {
  const c = fr.cell;
  if (c) attr.setXYZW(i, c[0], c[1], c[2], c[3]); else attr.setXYZW(i, 0, 0, 0, 0);
}

/** the variant ramps (Variants.ts, art-lab/characters/variants/variants.json) as a 5-stop x rows sRGB texture, linear along the stops */
function rampTexture(): { texture: THREE.DataTexture; rows: number } {
  const { rows } = rampTable(variantsFile as unknown as VariantsFile), n = Math.max(1, rows.length), data = new Uint8Array(5 * n * 4);
  rows.forEach((r, y) => r.forEach((h, x) => { const i = (y * 5 + x) * 4; data[i] = parseInt(h.slice(1, 3), 16); data[i + 1] = parseInt(h.slice(3, 5), 16); data[i + 2] = parseInt(h.slice(5, 7), 16); data[i + 3] = 255; }));
  const t = new THREE.DataTexture(data, 5, n, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.LinearFilter; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true;
  return { texture: t, rows: n };
}

let empty: THREE.DataTexture | null = null;
function emptyBaked(): THREE.DataTexture {
  if (!empty) { empty = new THREE.DataTexture(new Uint8Array(4), 1, 1, THREE.RGBAFormat, THREE.UnsignedByteType); empty.colorSpace = THREE.SRGBColorSpace; empty.magFilter = empty.minFilter = THREE.NearestFilter; empty.needsUpdate = true; }
  return empty;
}

export function frameIndex(atlas: SpriteAtlas, act: Actor): number {
  const n = atlas.counts.get(`${act.spec}/${act.anim}`) ?? 1;
  const rate = act.anim === 'walk' || act.anim === 'carry' ? WALK_CADENCE : act.anim === 'hammer' ? 5.5 : act.anim === 'talk' ? 4 : 1.7;
  return Math.floor(act.t * rate) % n;
}
