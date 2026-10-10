import { Rng } from '../core/rng';
import { SlotSet, type V3 } from '../core/MeshBuilder';
import type { LightDef } from '../atmosphere/LightRig';
import type { EmblemKind, ShopKind, WindowKind } from '../materials/CanvasArt';

export type ShopType = 'smith' | 'apothecary' | 'tailor' | 'tavern' | 'guild' | 'general' | 'house';
export type RoofStyle = 'gable' | 'crooked' | 'hip' | 'gableFront' | 'leanto';

export interface BuildingParams {
  /** number of storeys (1..4) */
  floors: number;
  /** facade width in metres */
  width: number;
  depth?: number;
  /** 0..1: how much floors shift, bays vary and walls lean */
  asymmetry: number;
  /** 0..1: jetty overhang between floors */
  overhang: number;
  /** 0..1: density of the exposed timber frame */
  timberRatio: number;
  shopType: ShopType;
  roofStyle: RoofStyle;
  seed: number;
  /** multiplier on storey height */
  verticality?: number;
  /** multiplier on roof pitch / eave overhang */
  roofExaggeration?: number;
  stoneGround?: boolean;
  chimney?: boolean;
  balcony?: boolean;
  dormers?: number;
  /** open forge bay on the front-left of the ground floor */
  forgeBay?: boolean;
  /** 0..1 level of detail budget (distant buildings use less) */
  detail?: number;
  /** fraction of windows that are lit */
  lit?: number;
  palette?: PaletteName;
  roofTint?: V3;
  /** which side walls are visible (party walls skip detail) */
  sides?: { left: boolean; right: boolean };
}

/** Restrained night palette: every facade sits in a narrow cool band (slate / blue-grey / cool stone / ivory). */
export type PaletteName = 'slate' | 'ash' | 'mist' | 'ivory' | 'dusk' | 'stone' | 'shadow';

export interface Palette {
  plaster: V3; timber: V3; stone: V3; roof: V3; awning: V3; shutter: V3; trim: V3; brick: V3;
}

export type SocketKind = 'lamp' | 'banner' | 'sign' | 'prop' | 'smoke' | 'door' | 'stall' | 'forge' | 'bunting' | 'window';
export interface Socket {
  kind: SocketKind;
  pos: V3;
  dir: V3;
  width?: number;
  tag?: string;
}

export interface WindowInfo { pos: V3; dir: V3; kind: WindowKind; lit: boolean; floor: number }

export interface BuildingResult {
  slots: SlotSet;
  sockets: Socket[];
  lights: LightDef[];
  windows: WindowInfo[];
  colliders: Array<[number, number, number, number]>;
  params: BuildingParams;
  width: number; depth: number; height: number; ridgeY: number;
  shopType: ShopType;
  stats: { quads: number; windows: number; modules: Record<string, number> };
}

export class BuildCtx {
  readonly S = new SlotSet();
  readonly sockets: Socket[] = [];
  readonly lights: LightDef[] = [];
  readonly windows: WindowInfo[] = [];
  readonly colliders: Array<[number, number, number, number]> = [];
  readonly modules: Record<string, number> = {};
  constructor(readonly p: BuildingParams, readonly rng: Rng, readonly pal: Palette) {}

  count(name: string): void { this.modules[name] = (this.modules[name] ?? 0) + 1; }
  /** record a socket using the current frame (positions/directions are converted to building-local space) */
  socket(kind: SocketKind, pos: V3, dir: V3, extra: Partial<Socket> = {}): void {
    this.sockets.push({ kind, pos: this.S.plaster.world(pos), dir: this.S.plaster.worldDir(dir), ...extra });
  }
  light(def: LightDef): void {
    const p = this.S.plaster.world(def.pos);
    this.lights.push({ ...def, pos: p });
  }
  tint(base: V3, jitter = 0.06): V3 {
    const j = () => 1 + (this.rng.next() - 0.5) * 2 * jitter;
    return [base[0] * j(), base[1] * j(), base[2] * j()];
  }
}

export const shopToInterior: Record<ShopType, ShopKind> = { smith: 'smith', apothecary: 'apothecary', tailor: 'cloth', tavern: 'tavern', guild: 'tavern', general: 'tavern', house: 'tavern' };
export const shopToEmblem: Record<ShopType, EmblemKind> = { smith: 'anvil', apothecary: 'mortar', tailor: 'scissors', tavern: 'tankard', guild: 'scales', general: 'key', house: 'fleur' };
