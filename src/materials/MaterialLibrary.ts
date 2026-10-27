import * as THREE from 'three';
import { U, maskSafeBlending } from '../atmosphere/SceneUniforms';
import { SURFACE_VERT, SURFACE_FRAG } from './ShaderChunks';
import { GROUND_VERT, GROUND_FRAG, WATER_FRAG, DECAL_FRAG } from './GroundShaders';
import type { Slot } from '../core/MeshBuilder';
import type { TexSet } from './TexturePainters';
import type { PaintJob } from './PainterJobs';
import { paintAll } from './PainterPool';
import {
  makeWindowAtlas, makeShopAtlas, makeEmblemAtlas, emblemAtlasRows, makeDecalAtlas, makeLeafAtlas, makeBushCard, makeHalo, makeSmokePuff, makeSoftDot,
} from './CanvasArt';

export interface SurfaceParams {
  tile: number | [number, number];
  base?: [number, number, number];
  rough: number; normal: number; spec: number; contact: number; breakup: number;
  dirt?: [number, number, number]; emissive?: number; wrap?: number; trans?: number;
}

const nextFrame = () => new Promise<void>((r) => setTimeout(r, 0));

export class MaterialLibrary {
  readonly slot = {} as Record<Slot, THREE.ShaderMaterial>;
  ground!: THREE.ShaderMaterial;
  water!: THREE.ShaderMaterial;
  readonly textures: THREE.Texture[] = [];
  halo!: THREE.CanvasTexture; smoke!: THREE.CanvasTexture; dot!: THREE.CanvasTexture;
  leafAtlas!: THREE.CanvasTexture; bushCard!: THREE.CanvasTexture;
  private aniso = 8;
  private flatNR!: THREE.DataTexture;
  private white!: THREE.DataTexture;
  groundMask!: THREE.DataTexture;
  timings: Record<string, number> = {};
  /** Painting jobs that left their worker for the main thread, and why (empty = every worker answered; `PainterPool`). */
  painterFallbacks: string[] = [];

  /** `painters`: texture workers (0 = paint on the main thread, `?painters=main`). */
  static async build(renderer: THREE.WebGLRenderer, progress: (label: string, f: number) => void, painters: number): Promise<MaterialLibrary> {
    const lib = new MaterialLibrary();
    lib.aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    await lib.init(progress, painters);
    return lib;
  }

  private track<T extends THREE.Texture>(t: T): T { this.textures.push(t); return t; }

  private dataTex(data: Uint8ClampedArray | Uint8Array, size: number, srgb: boolean): THREE.DataTexture {
    const t = new THREE.DataTexture(new Uint8Array(data.buffer, data.byteOffset, data.byteLength), size, size, THREE.RGBAFormat, THREE.UnsignedByteType);
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true; t.anisotropy = this.aniso; t.needsUpdate = true;
    return this.track(t);
  }

  private canvasTex(c: HTMLCanvasElement, opts: { mip?: boolean; repeat?: boolean; srgb?: boolean } = {}): THREE.CanvasTexture {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = opts.srgb === false ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    t.generateMipmaps = opts.mip !== false;
    t.minFilter = opts.mip !== false ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
    t.anisotropy = this.aniso;
    if (opts.repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return this.track(t);
  }

  private texPair(s: TexSet) { return { albedo: this.dataTex(s.albedo, s.size, true), nr: this.dataTex(s.nr, s.size, false) }; }

  private surface(albedo: THREE.Texture, nr: THREE.Texture, p: SurfaceParams, defines: Record<string, string | number> = {}, side: THREE.Side = THREE.FrontSide): THREE.ShaderMaterial {
    const tile = Array.isArray(p.tile) ? p.tile : [p.tile, p.tile];
    const base = p.base ?? [1, 1, 1];
    const dirt = p.dirt ?? [0.5, 0.5, 0.46];
    return new THREE.ShaderMaterial({
      uniforms: {
        ...U,
        tAlbedo: { value: albedo }, tNR: { value: nr },
        uTile: { value: new THREE.Vector2(tile[0], tile[1]) },
        uBase: { value: new THREE.Color(base[0], base[1], base[2]) },
        uRough: { value: p.rough }, uNormalAmt: { value: p.normal }, uSpecAmt: { value: p.spec },
        uContact: { value: p.contact }, uBreakup: { value: p.breakup }, uDirt: { value: new THREE.Vector3(...dirt) },
        uEmissive: { value: p.emissive ?? 0 }, uWrap: { value: p.wrap ?? 0.3 }, uTrans: { value: p.trans ?? 0 },
      },
      vertexShader: SURFACE_VERT, fragmentShader: SURFACE_FRAG, defines, side,
    });
  }

  private async init(progress: (label: string, f: number) => void, painters: number): Promise<void> {
    const tex: Record<string, { albedo: THREE.Texture; nr: THREE.Texture }> = {};
    const t0 = performance.now();
    progress('white/flat', 0);
    // Every THREE texture is created in the pre-P3 order (white, flat, painted pairs, canvas atlases): texture ids, uuids (Math.random)
    // and `textures` stay what they were. Only the painting moved (journal pass 6, P3).
    this.white = this.dataTex(new Uint8Array([255, 255, 255, 255]), 1, true);
    this.flatNR = this.dataTex(new Uint8Array([128, 128, 255, 170]), 1, false);
    this.white.generateMipmaps = false; this.white.minFilter = THREE.LinearFilter; this.flatNR.generateMipmaps = false; this.flatNR.minFilter = THREE.LinearFilter;

    // painted textures: in Web Workers, longest first (PainterPool); `?painters=main` (0) keeps the pre-P3 main-thread order
    const order: PaintJob[] = painters > 0
      ? ['cobble', 'plaster', 'ashlar', 'brick', 'planks', 'timber', 'roof', 'metal', 'cloth']
      : ['ashlar', 'brick', 'plaster', 'timber', 'planks', 'roof', 'cloth', 'metal', 'cobble'];
    const painting = paintAll(order, painters, (job, done) => progress(job, done / (order.length + 1)));
    // the canvas atlases (DOM canvases) paint on the main thread meanwhile
    await nextFrame();
    const tc = performance.now();
    const art = {
      halo: makeHalo(128), smoke: makeSmokePuff(128, 3), dot: makeSoftDot(32), leaf: makeLeafAtlas(5), bush: makeBushCard(8, 256),
      window: makeWindowAtlas(21), shop: makeShopAtlas(33), emblem: makeEmblemAtlas(emblemAtlasRows()), decal: makeDecalAtlas(77),
    };
    this.timings['canvas atlases'] = performance.now() - tc;
    const painted = await painting;
    Object.assign(this.timings, painted.ms);
    this.timings['paint wall'] = performance.now() - t0;
    this.timings['paint workers'] = painted.workers;
    this.painterFallbacks = painted.fallbacks;

    const P = painted.sets;
    tex.stone = this.texPair(P.ashlar);
    tex.brick = this.texPair(P.brick);
    tex.plaster = this.texPair(P.plaster);
    tex.timber = this.texPair(P.timber);
    tex.planks = this.texPair(P.planks);
    tex.roof = this.texPair(P.roof);
    tex.cloth = this.texPair(P.cloth);
    tex.metal = this.texPair(P.metal);
    tex.cobble = this.texPair(P.cobble);
    this.halo = this.canvasTex(art.halo, { mip: false, srgb: true });
    this.smoke = this.canvasTex(art.smoke, { mip: true });
    this.dot = this.canvasTex(art.dot, { mip: false });
    this.leafAtlas = this.canvasTex(art.leaf, { mip: true });
    this.bushCard = this.canvasTex(art.bush, { mip: true });
    tex.window = { albedo: this.canvasTex(art.window), nr: this.flatNR };
    tex.shop = { albedo: this.canvasTex(art.shop), nr: this.flatNR };
    tex.emblem = { albedo: this.canvasTex(art.emblem), nr: this.flatNR };
    tex.decal = { albedo: this.canvasTex(art.decal), nr: this.flatNR };
    tex.leaf = { albedo: this.leafAtlas, nr: this.flatNR };
    for (const k of ['window', 'shop', 'emblem', 'decal', 'leaf']) (tex[k].albedo as THREE.Texture).wrapS = (tex[k].albedo as THREE.Texture).wrapT = THREE.ClampToEdgeWrapping;

    progress('materials', 0.95);
    await nextFrame();

    const S = (t: { albedo: THREE.Texture; nr: THREE.Texture }, p: SurfaceParams, d: Record<string, string | number> = {}, side: THREE.Side = THREE.FrontSide) => this.surface(t.albedo, t.nr, p, d, side);
    this.slot.plaster = S(tex.plaster, { tile: 2.4, rough: 0.92, normal: 1.0, spec: 0.06, contact: 1, breakup: 0.38, dirt: [0.46, 0.46, 0.42], wrap: 0.4 });
    this.slot.timber = S(tex.timber, { tile: 1.0, rough: 0.8, normal: 1.1, spec: 0.14, contact: 0.8, breakup: 0.3, dirt: [0.55, 0.55, 0.5], wrap: 0.3 });
    this.slot.planks = S(tex.planks, { tile: 1.0, rough: 0.8, normal: 1.0, spec: 0.12, contact: 0.8, breakup: 0.3, dirt: [0.55, 0.55, 0.5], wrap: 0.3 });
    this.slot.stone = S(tex.stone, { tile: 2.0, rough: 0.82, normal: 1.25, spec: 0.2, contact: 1, breakup: 0.4, dirt: [0.42, 0.48, 0.38], wrap: 0.3 });
    this.slot.brick = S(tex.brick, { tile: 1.0, rough: 0.85, normal: 1.1, spec: 0.12, contact: 0.8, breakup: 0.35, dirt: [0.5, 0.48, 0.44], wrap: 0.3 });
    this.slot.roof = S(tex.roof, { tile: 1.6, rough: 0.66, normal: 1.35, spec: 0.55, contact: 0, breakup: 0.3, wrap: 0.25 });
    this.slot.cloth = S(tex.cloth, { tile: 0.8, rough: 0.92, normal: 0.7, spec: 0.03, contact: 0.2, breakup: 0.25, wrap: 0.5, trans: 0.55 }, { DOUBLE: 1, WIND: 1 }, THREE.DoubleSide);
    this.slot.metal = S(tex.metal, { tile: 0.5, rough: 0.5, normal: 0.8, spec: 1.3, contact: 0.3, breakup: 0.2, wrap: 0.2 });
    this.slot.banner = S(tex.emblem, { tile: 1, rough: 0.9, normal: 0.5, spec: 0.03, contact: 0, breakup: 0.0, wrap: 0.5, trans: 0.6 }, { DOUBLE: 1, WIND: 1 }, THREE.DoubleSide);
    this.slot.glow = S(tex.window, { tile: 1, rough: 1, normal: 0, spec: 0, contact: 0, breakup: 0, emissive: 2.3 }, { GLOW: 1 });
    this.slot.shop = S(tex.shop, { tile: 1, rough: 1, normal: 0, spec: 0, contact: 0, breakup: 0, emissive: 1.9 }, { GLOW: 1 });
    this.slot.leaf = S(tex.leaf, { tile: 1, rough: 0.8, normal: 0, spec: 0.05, contact: 0.3, breakup: 0.5, wrap: 0.6, trans: 0.3 }, { LEAF: 1, WIND: 1, DOUBLE: 1 }, THREE.DoubleSide);
    this.slot.dark = this.surface(this.white, this.flatNR, { tile: 1, base: [0.035, 0.03, 0.035], rough: 0.9, normal: 0, spec: 0, contact: 0, breakup: 0 });

    this.groundMask = this.dataTex(new Uint8Array([0, 80, 0, 255]), 1, false);
    this.groundMask.generateMipmaps = false; this.groundMask.minFilter = THREE.LinearFilter; this.groundMask.wrapS = this.groundMask.wrapT = THREE.ClampToEdgeWrapping;
    this.ground = new THREE.ShaderMaterial({
      uniforms: { ...U, tCobble: { value: tex.cobble.albedo }, tCobbleNR: { value: tex.cobble.nr }, tGroundMask: { value: this.groundMask }, uGroundRect: { value: new THREE.Vector4(-30, -20, 60, 40) } },
      vertexShader: GROUND_VERT, fragmentShader: GROUND_FRAG,
    });
    this.water = new THREE.ShaderMaterial({ uniforms: { ...U }, vertexShader: GROUND_VERT, fragmentShader: WATER_FRAG });
    const decal = this.surface(tex.decal.albedo, this.flatNR, { tile: 1, rough: 0.5, normal: 0, spec: 0, contact: 0, breakup: 0 });
    this.slot.decal = new THREE.ShaderMaterial({
      uniforms: { ...U, tDecal: { value: tex.decal.albedo } },
      vertexShader: SURFACE_VERT, fragmentShader: DECAL_FRAG, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      ...maskSafeBlending('normal'),
    });
    decal.dispose();
    progress('ready', 1);
  }

  private occCache = new Map<string, THREE.ShaderMaterial>();
  /** Occludable twin of a slot material (player occlusion reveal): same programme plus the localized discard, sharing
   *  every uniform with the slot material by reference. `instanced` takes the occluder index from gl_InstanceID
   *  (+ uOccBase) instead of a per-vertex attribute. Only occludable draws ever use it. */
  occVariant(slot: Slot, instanced: boolean): THREE.ShaderMaterial {
    const key = `${slot}${instanced ? '#i' : ''}`;
    let m = this.occCache.get(key);
    if (!m) {
      const b = this.slot[slot];
      m = new THREE.ShaderMaterial({
        uniforms: instanced ? { ...b.uniforms, uOccBase: { value: 0 } } : b.uniforms,
        vertexShader: b.vertexShader, fragmentShader: b.fragmentShader, defines: { ...b.defines, [instanced ? 'OCC_INST' : 'OCC']: 1 }, side: b.side,
      });
      m.name = `occ:${key}`;
      this.occCache.set(key, m);
    }
    return m;
  }

  /** Approximate GPU memory held by library textures (with mips). */
  textureBytes(): number {
    let b = 0;
    for (const t of this.textures) {
      const img: any = t.image;
      const w = img?.width ?? 1, h = img?.height ?? 1;
      b += w * h * 4 * (t.generateMipmaps ? 1.333 : 1);
    }
    return b;
  }

  all(): THREE.ShaderMaterial[] {
    return [...Object.values(this.slot), this.ground, this.water];
  }
}
