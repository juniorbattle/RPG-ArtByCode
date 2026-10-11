import * as THREE from 'three';
import { U } from '../atmosphere/SceneUniforms';
import { SURFACE_VERT, SURFACE_FRAG } from './ShaderChunks';
import { GROUND_VERT, GROUND_FRAG, WATER_FRAG, DECAL_FRAG } from './GroundShaders';
import type { Slot } from '../core/MeshBuilder';
import {
  paintAshlar, paintPlaster, paintTimber, paintRoofTiles, paintCloth, paintMetal, paintCobble, type TexSet, type RGB,
} from './TexturePainters';
import {
  makeWindowAtlas, makeShopAtlas, makeEmblemAtlas, makeDecalAtlas, makeLeafAtlas, makeBushCard, makeHalo, makeSmokePuff, makeSoftDot,
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

  static async build(renderer: THREE.WebGLRenderer, progress: (label: string, f: number) => void): Promise<MaterialLibrary> {
    const lib = new MaterialLibrary();
    lib.aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    await lib.init(progress);
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

  private async init(progress: (label: string, f: number) => void): Promise<void> {
    const steps: Array<[string, () => void]> = [];
    const T = (name: string, fn: () => void) => steps.push([name, () => { const t0 = performance.now(); fn(); this.timings[name] = performance.now() - t0; }]);
    const tex: Record<string, { albedo: THREE.Texture; nr: THREE.Texture }> = {};

    // cool stone / muted brick: base albedos stay near-neutral so per-building tints define a narrow slate band
    const stonePal: RGB[] = [[128, 132, 142], [110, 116, 128], [136, 136, 140], [98, 104, 118], [120, 122, 128]];
    const brickPal: RGB[] = [[104, 86, 82], [92, 78, 76], [112, 94, 88], [84, 72, 72], [100, 84, 80]];
    let ashlarSet!: TexSet;

    T('white/flat', () => {
      this.white = this.dataTex(new Uint8Array([255, 255, 255, 255]), 1, true);
      this.flatNR = this.dataTex(new Uint8Array([128, 128, 255, 170]), 1, false);
      this.white.generateMipmaps = false; this.white.minFilter = THREE.LinearFilter; this.flatNR.generateMipmaps = false; this.flatNR.minFilter = THREE.LinearFilter;
    });
    T('ashlar', () => {
      ashlarSet = paintAshlar(512, 101, { rows: 6, blockW: 0.3, rowVar: 0.28, widthVar: 0.4, offsetRows: false, palette: stonePal, mortar: [58, 60, 66], mortarW: 4.5, bevel: 7, moss: 0.08, chip: 0.5, streak: 0.8, crack: 0.8, normal: 3.4 });
      tex.stone = this.texPair(ashlarSet);
    });
    T('brick', () => { tex.brick = this.texPair(paintAshlar(512, 202, { rows: 15, blockW: 0.215, rowVar: 0.04, widthVar: 0.08, offsetRows: true, palette: brickPal, mortar: [120, 118, 116], mortarW: 2.6, bevel: 3, moss: 0.04, chip: 0.3, streak: 0.5, crack: 0.3, normal: 3.0 })); });
    T('plaster', () => {
      const under = paintAshlar(512, 303, { rows: 9, blockW: 0.22, rowVar: 0.35, widthVar: 0.55, offsetRows: false, palette: [[112, 112, 116], [96, 98, 104], [122, 120, 120]], mortar: [66, 66, 70], mortarW: 4, bevel: 5, moss: 0.03, chip: 0.6, streak: 0, crack: 0, normal: 3 });
      tex.plaster = this.texPair(paintPlaster(512, 404, { base: [178, 176, 172], alt: [152, 152, 154], crumble: 0.12, cracks: 1, stain: 0.8, underlying: under }));
    });
    T('timber', () => { tex.timber = this.texPair(paintTimber(512, 505, 'beam', [58, 52, 50], [74, 66, 62])); });
    T('planks', () => { tex.planks = this.texPair(paintTimber(512, 606, 'planks', [76, 68, 62], [96, 86, 78])); });
    T('roof', () => { tex.roof = this.texPair(paintRoofTiles(512, 707, [[84, 88, 98], [70, 74, 86], [96, 98, 106], [90, 92, 100], [78, 80, 92]], 9, 8)); });
    T('cloth', () => { tex.cloth = this.texPair(paintCloth(256, 808)); });
    T('metal', () => { tex.metal = this.texPair(paintMetal(256, 909)); });
    T('cobble', () => {
      const c = this.texPair(paintCobble(1024, 1001));
      tex.cobble = c;
    });
    T('canvas atlases', () => {
      this.halo = this.canvasTex(makeHalo(128), { mip: false, srgb: true });
      this.smoke = this.canvasTex(makeSmokePuff(128, 3), { mip: true });
      this.dot = this.canvasTex(makeSoftDot(32), { mip: false });
      this.leafAtlas = this.canvasTex(makeLeafAtlas(5), { mip: true });
      this.bushCard = this.canvasTex(makeBushCard(8, 256), { mip: true });
      tex.window = { albedo: this.canvasTex(makeWindowAtlas(21)), nr: this.flatNR };
      tex.shop = { albedo: this.canvasTex(makeShopAtlas(33)), nr: this.flatNR };
      tex.emblem = { albedo: this.canvasTex(makeEmblemAtlas()), nr: this.flatNR };
      tex.decal = { albedo: this.canvasTex(makeDecalAtlas(77)), nr: this.flatNR };
      tex.leaf = { albedo: this.leafAtlas, nr: this.flatNR };
      for (const k of ['window', 'shop', 'emblem', 'decal', 'leaf']) (tex[k].albedo as THREE.Texture).wrapS = (tex[k].albedo as THREE.Texture).wrapT = THREE.ClampToEdgeWrapping;
    });

    for (let i = 0; i < steps.length; i++) {
      progress(steps[i][0], i / steps.length);
      await nextFrame();
      steps[i][1]();
    }
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
