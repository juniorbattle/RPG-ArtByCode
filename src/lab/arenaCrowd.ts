/** DEV-ONLY: the stands' spectators drawn by APPROVED baked sheets, for the operator's decision sheet (the operator's request of 2026-11-04, word for
 *  word: « il faudra travailler nos pnjs publics dans les gradins pendant le combat car ils sont encore concu en code generique »; journal Passe PU1).
 *  Reached only through a dynamic import that `ArenaApp` guards with `import.meta.env.DEV`: production builds compile it out, and the arena without
 *  the parameter is untouched. Nothing is baked, approved or made canonical: the sheets are the production cast's own exports, loaded through the
 *  production gate (approved manifests, SHA-256 against their provenance packs, the approved variants file and its mask fingerprints), into a
 *  renderer of their own for this page load.
 *    ?crowdlab=town|plaza|mix   the five townsfolk of the district (and their two approved colour variants each) / the squares' five citizens / both
 *    &crowdseat=today|medium|dense  today's 25 seats (the arena's own, ArenaScene) / every tier near the gate, a seat every ~0.85 m, one in three
 *                               left empty / a seat every ~0.55 m, one in five empty (seats of the lab's own, no RNG draw)
 *    &crowdvar=0                no colour variants (the originals only)
 *    &crowdreact=today|sound    today's reaction (a share of the stands hops on every blow) / the crowd's sound of lots S3 / S5 (`crowdOf`: a roar on
 *                               the K.O., a gasp on a break, a cheer on Ren's own heavy blows and skills, an « oh » on the rival's)
 *    &crowdsit=1                every spectator set lower, behind the riser in front of it: the riser hides the legs (seated, no new image)
 *    &crowdscale=<k>            the spectators' presentation scale (absent: the generated spectators' 0.62 x the cast's 0.9)
 *    &crowdshade=<k>            their shade in the arena's light (absent: the combat sheets' rule, CX-L1 / CX-L2)
 *  `window.__crowd` reports the sheets, the seats, the texture and the reactions. */
import * as THREE from 'three';
import { SpriteRenderer, type Actor } from '../characters/SpriteRenderer';
import { SpriteAtlas } from '../characters/SpriteAtlas';
import { castEntries, loadProductionCast, type CastMember } from '../characters/BakedCast';
import { plazaCastEntries } from '../characters/PlazaCast';
import type { BakedSheet } from '../characters/BakedSprites';
import { variantOf } from '../characters/Variants';
import type { LightRig } from '../atmosphere/LightRig';
import { ARC, GATE_HALF } from '../arena/ArenaScene';
import { crowdOf } from '../audio/sfx';

const TOWN = ['artisan-x2-v1', 'traveler-x2-v1', 'townswoman-x2-v1', 'older-merchant-x2-v1', 'courier-x2-v1'];
const PLAZA = ['vendor-x2-v1', 'wayfarer-x2-v1', 'noble-x2-v1', 'errand-boy-x2-v1', 'girl-x2-v1'];
/** the stands' tiers (ArenaScene's TIER, read here: the lab adds no export to the arena) */
const TIER = { n: 4, depth: 0.95, rise: 0.6, base: 2.6 };

type Reaction = 'roar' | 'gasp' | 'cheer' | 'oh' | 'hit';
interface Seat { pos: [number, number, number]; tier: number }

const hash = (n: number): number => { let h = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b) >>> 0; h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35) >>> 0; h ^= h >>> 16; return (h >>> 0) / 4294967296; };

/** every tier filled near the gate: the arena's wall segments (ArenaScene: 18 a wing from the towers to 78 deg), the seated arc up to 60 deg, a seat
 *  every ~0.55 m with a hash-chosen gap one time in five; no RNG draw (the arena's build is untouched) */
function denseSeats(step = 0.55, gap = 0.2): Seat[] {
  const out: Seat[] = [];
  const gateTheta = Math.asin(GATE_HALF / ARC.r), wallFrom = gateTheta + Math.asin(2.8 / ARC.r), wallTo = (78 * Math.PI) / 180;
  let n = 0;
  for (const side of [-1, 1]) for (let k = 0; k < TIER.n; k++) {
    const r = ARC.r + ARC.thick + k * TIER.depth + TIER.depth * 0.45, hk = TIER.base + (k + 1) * TIER.rise;
    const a0 = wallFrom, a1 = (60 * Math.PI) / 180, len = (a1 - a0) * r, m = Math.floor(len / step);
    for (let s = 0; s < m; s++) {
      n++;
      if (hash(n * 7 + 1) < gap) continue;
      const t = a0 + (a1 - a0) * ((s + 0.5 + (hash(n * 7 + 2) - 0.5) * 0.4) / m);
      out.push({ pos: [ARC.cx + r * Math.sin(side * t), hk, ARC.cz - r * Math.cos(side * t)], tier: k });
    }
  }
  return out;
}

export interface CrowdLab {
  group: THREE.Group;
  actors: Actor[];
  onEvents(evs: Array<{ type: string } & Record<string, unknown>>, t: number): void;
  update(t: number, lights: LightRig, camera: THREE.Camera, keyDir: THREE.Vector3): void;
  info: Record<string, unknown>;
}

export async function installCrowdLab(params: URLSearchParams, stands: Seat[], opts: { charScale: number; edgeGain: number; shade: number }): Promise<CrowdLab> {
  const src = params.get('crowdlab') || 'town';
  if (!['town', 'plaza', 'mix'].includes(src)) throw new Error(`crowdlab "${src}": town, plaza or mix`);
  const ids = src === 'town' ? TOWN : src === 'plaza' ? PLAZA : [...TOWN, ...PLAZA];
  const entries = [...castEntries(false), ...plazaCastEntries()].filter((e, i, all) => ids.includes(e.manifest.id) && all.findIndex((q) => q.manifest.id === e.manifest.id) === i);
  const { sheets, cast } = await loadProductionCast(false, params.get('crowdvar') === '0' ? 'off' : 'approved', undefined, entries);
  // the idle frames alone (the spectators never walk): a smaller texture, the materials kept with their frames
  const idle: BakedSheet[] = sheets.map((s) => {
    const keep = s.frames.map((f, i) => (f.anim === 'idle' ? i : -1)).filter((i) => i >= 0);
    return { ...s, frames: keep.map((i) => s.frames[i]), ...(s.materials ? { materials: keep.map((i) => s.materials![i]) } : {}) };
  });
  const atlas = SpriteAtlas.build([], idle);
  const members = new Map<string, CastMember>();
  for (const m of cast.values()) members.set(m.id, m);
  const renderer = new SpriteRenderer(atlas, 256);
  renderer.charScale = opts.charScale;
  renderer.protect.crowd = 0.35;
  // the town's rule for its baked people (journal Passe S3b, « Contour noir 25 %, de jour et de nuit »)
  renderer.setEdgeMode('dark');
  renderer.setEdgeGain(opts.edgeGain);

  const seatMode = params.get('crowdseat') ?? 'today';
  const seats = seatMode === 'dense' ? denseSeats() : seatMode === 'medium' ? denseSeats(0.85, 1 / 3) : stands;
  const sit = params.get('crowdsit') === '1' ? 0.42 : 0;
  const scale = params.has('crowdscale') ? +params.get('crowdscale')! : 0.62 * 0.9;
  const shade = params.has('crowdshade') ? +params.get('crowdshade')! : opts.shade;
  const react = params.get('crowdreact') === 'sound' ? 'sound' : 'today';
  const order = ids.filter((id) => members.has(id));
  const actors: Actor[] = seats.map((st, i) => {
    const h = hash(i * 31 + 5), id = order[Math.floor(hash(i * 31 + 9) * order.length)], m = members.get(id)!;
    const vs = m.variants, v = vs ? variantOf(400 + i, vs.list.length) : 0, row = v > 0 ? vs!.list[v - 1] : null;
    return {
      id: 400 + i, spec: id, role: 'fan', detail: 'crowd', pos: new THREE.Vector3(st.pos[0], st.pos[1] - sit, st.pos[2]), facing: 'down', dir: 'down',
      // the townsfolk's front is drawn turned to the left (BakedCast `frontLeft`): each wing looks toward the ring
      flip: m.frontLeft ? st.pos[0] < 0 : h > 0.5,
      anim: 'idle', t: h * 10, speed: 0, tint: [shade, shade, shade], scale, height: m.height * scale, radius: 0.3,
      ...(row && vs ? { variant: { hair: row[0], skin: row[1], hairRange: vs.hair, skinRange: vs.skin } } : {}),
    };
  });
  const base = actors.map((a) => a.pos.y), rate = actors.map((_, i) => 0.85 + hash(i * 13 + 3) * 0.3);
  const start = actors.map(() => -10), kind: Array<Reaction | null> = actors.map(() => null);
  const counts: Record<string, number> = {};
  const fire = (r: Reaction, share: number, t: number) => {
    counts[r] = (counts[r] ?? 0) + 1;
    actors.forEach((_, i) => { const h = hash(i * 977 + Math.floor(t * 120) * 131); if (h < share) { start[i] = t + h * 0.35; kind[i] = r; } });
  };
  const group = new THREE.Group(); group.name = 'crowd-lab'; group.add(renderer.group);
  const lab: CrowdLab = {
    group, actors,
    onEvents(evs, t) {
      for (const e of evs) {
        if (react === 'sound') {
          const c = crowdOf(e);
          if (c === 'roar') fire('roar', 1, t); else if (c === 'gasp') fire('gasp', 0.75, t); else if (c === 'cheer') fire('cheer', 0.8, t); else if (c === 'oh') fire('oh', 0.45, t);
        } else if (e.type === 'impact') {
          const heavy = e.kind === 'heavy' || (e.damage as number) >= 20;
          fire('hit', e.result === 'hit' && heavy ? 0.9 : e.result === 'guardbreak' ? 0.8 : e.result === 'hit' ? 0.35 : 0.2, t);
        } else if (e.type === 'ko') fire('roar', 1, t); else if (e.type === 'break') fire('hit', 0.8, t);
        if (e.type === 'reset') start.fill(-10);
      }
    },
    update(t, lights, camera, keyDir) {
      actors.forEach((a, i) => {
        const c = start[i], r = kind[i], dt = t - c;
        // the reactions: hops (today's 1.4 s; a cheer 1.6 s, the roar 3 s of repeated hops), the gasp a start upward then still, the « oh » one small hop
        const len = r === 'roar' ? 3 : r === 'gasp' ? 0.9 : r === 'oh' ? 0.5 : r === 'cheer' ? 1.6 : 1.4;
        const on = dt >= 0 && dt < len;
        let dy = 0;
        if (on && (r === 'roar' || r === 'cheer' || r === 'hit')) dy = Math.max(0, Math.sin(dt * 9 * rate[i])) * (r === 'roar' ? 0.09 : 0.07);
        else if (on && r === 'oh') dy = Math.max(0, Math.sin(dt * 6.3)) * 0.04;
        else if (on && r === 'gasp') dy = dt < 0.12 ? 0.04 * (dt / 0.12) : 0.04 * Math.exp(-(dt - 0.12) * 3);
        a.pos.y = base[i] + dy;
        // the gasp holds the breath (the idle frame held); otherwise each spectator breathes on its own clock
        a.t = on && r === 'gasp' ? Math.floor(c * 1.7) / 1.7 : t * rate[i] + i * 0.37;
      });
      renderer.update(actors, lights, camera, keyDir);
    },
    info: {
      source: src, sheets: idle.map((s) => ({ id: s.id, frames: s.frames.length, variants: members.get(s.id)?.variants?.list.length ?? 0 })), seats: seats.length, sit, scale, shade, react,
      texture: [atlas.bakedWidth, atlas.bakedHeight], textureMB: (atlas.bakedWidth * atlas.bakedHeight * 4) / 1048576, counts,
    },
  };
  (window as unknown as { __crowd: CrowdLab }).__crowd = lab;
  return lab;
}
