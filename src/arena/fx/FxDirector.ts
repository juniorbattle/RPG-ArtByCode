import * as THREE from 'three';
import type { FxEngine } from './FxEngine';
import type { FxElement } from './fxPalettes';
import type { FxAnchor, FxRecipe, FxStep } from './fxRecipes';

/** Plays a duel's recipes on the FX engine, resolving anchors per step. Ported from RPGThreeJS (dev@5cc6119e, src/combat/fx/FxDirector.ts, journal
 *  Passe FX2): a duel has no grid, no area and no field finale, so what is left is the timeline and the anchors, with one anchor of its own, the
 *  contact of the blades before the guard. Hooks that are this arena's (`speedLines`, `punch`) take the recipe's numbers. */

export interface FxUnitRef {
  /** feet position in world space */
  position: THREE.Vector3;
  /** visible figure height (world units) */
  height: number;
}

export interface FxPlayContext {
  source: FxUnitRef;
  target: FxUnitRef;
  /** how far before the target the blades meet (m) */
  contact?: number;
}

export class FxDirector {
  constructor(private readonly engine: FxEngine) {}

  play(recipe: FxRecipe, ctx: FxPlayContext): void {
    for (const step of recipe.steps) this.engine.after(step.at, () => this.run(step, recipe, ctx));
  }

  /** a blow going toward -x mirrors its cuts */
  private mirror(ctx: FxPlayContext): boolean { return ctx.target.position.x < ctx.source.position.x; }

  private anchor(anchor: FxAnchor | undefined, ctx: FxPlayContext): THREE.Vector3 {
    const { source: src, target: tgt } = ctx;
    const toward = Math.sign(src.position.x - tgt.position.x) || 1, contact = tgt.position.clone().add(new THREE.Vector3(toward * (ctx.contact ?? 0.8), 0, 0.2));
    switch (anchor) {
      case 'source': return src.position.clone();
      case 'sourceChest': return src.position.clone().add(new THREE.Vector3(0, src.height * 0.55, 0));
      case 'sourceGround': return new THREE.Vector3(src.position.x, 0.02, src.position.z);
      case 'target': return tgt.position.clone();
      case 'targetGround': return new THREE.Vector3(tgt.position.x, 0.02, tgt.position.z);
      case 'contact': return contact.setY(tgt.height * 0.55);
      case 'contactGround': return contact.setY(0.02);
      case 'sky': return tgt.position.clone().add(new THREE.Vector3(-1.8, 12, -3));
      case 'targetChest':
      default: return tgt.position.clone().add(new THREE.Vector3(0, tgt.height * 0.55, 0));
    }
  }

  private run(step: FxStep, recipe: FxRecipe, ctx: FxPlayContext): void {
    const p = step.p ?? {}, engine = this.engine, hooks = engine.hooks;
    const num = (key: string, fallback: number) => (typeof p[key] === 'number' ? (p[key] as number) : fallback);
    const element: FxElement = step.element ?? recipe.element, mirror = this.mirror(ctx);
    switch (step.kind) {
      case 'shake': hooks.shake(num('magnitude', 0.2), num('duration', 0.2)); return;
      case 'flash': hooks.flash(engine.palette(element).core, num('opacity', 0.1), num('duration', 0.18)); return;
      case 'slowmo': hooks.slowmo(num('scale', 0.35), num('duration', 0.3)); return;
      case 'speedLines': hooks.speedLines(num('duration', 0.8), engine.palette(element).body); return;
      case 'punch': hooks.punch?.(this.anchor(step.anchor, ctx), num('duration', 0.45), num('amount', 1) > 0.95); return;
      default: break;
    }
    const at = this.anchor(step.anchor, ctx);
    const to = () => this.anchor(step.to, ctx);
    switch (step.kind) {
      case 'slash': engine.slash(at, element, { size: num('size', 3.5), angle: mirror ? -num('angle', 0) : num('angle', 0), duration: num('duration', 0.3), flip: (p.flip === true) !== mirror, thickness: num('thickness', 0.8) }); break;
      case 'star': engine.impactStar(at, element, num('size', 2.2), num('duration', 0.28)); break;
      case 'burst': {
        const along = new THREE.Vector3(Math.sign(ctx.target.position.x - ctx.source.position.x) || 1, 0.1, 0.25).normalize();
        const direction = p.spray === 'through' ? along : p.spray === 'back' ? along.clone().setX(-along.x) : undefined;
        engine.burst(at, element, { count: num('count', 24), speed: num('speed', 4.5), up: num('up', 1.8), gravity: num('gravity', 6), size: num('size', 0.11), life: num('life', 0.7), spread: num('spread', 0.2), cone: num('cone', 1), direction });
        break;
      }
      case 'ring': engine.ring(at, element, { radius: num('radius', 2.6), duration: num('duration', 0.5), ground: p.ground !== false, from: num('from', 0.15), inward: p.inward === true }); break;
      case 'pillar': engine.pillar(at, element, { radius: num('radius', 0.8), height: num('height', 9), duration: num('duration', 0.8) }); break;
      case 'streak': engine.streak(at, to(), element, { width: num('width', 0.35), duration: num('duration', 0.25) }); break;
      case 'bolt': engine.bolt(at, element, { from: step.to ? to() : undefined, duration: num('duration', 0.35), width: num('width', 0.08) }); break;
      case 'shards': engine.shards(at, element, { count: num('count', 7), radius: num('radius', 1.2), height: num('height', 2), duration: num('duration', 0.9) }); break;
      case 'dome': engine.dome(at, element, { radius: num('radius', 1.8), duration: num('duration', 1) }); break;
      case 'orb': engine.orb(at, element, { radius: num('radius', 1.8), duration: num('duration', 0.5), implode: p.implode === true }); break;
      case 'motes': engine.motes(at, element, { count: num('count', 22), radius: num('radius', 0.9), rise: num('rise', 2.6) }); break;
      case 'smoke': engine.smoke(at.y < 0.3 ? at.clone().setY(0.5) : at, { count: num('count', 14), spread: num('spread', 0.5), size: num('size', 0.8), life: num('life', 1.2) }); break;
      case 'glow': engine.glow(at, element, num('size', 3), num('duration', 0.5)); break;
      case 'decal': engine.decal(at, element, { radius: num('radius', 1.6) }); break;
      case 'converge': engine.converge(at, element, { count: num('count', 30), radius: num('radius', 3), duration: num('duration', 0.7), height: num('height', 2.4), size: num('size', 0.11) }); break;
      case 'orbit': engine.orbit(at, element, { count: num('count', 12), radius: num('radius', 1.3), duration: num('duration', 1), rise: num('rise', 2.2), spin: num('spin', 4.2), size: num('size', 0.11) }); break;
      case 'fissure': engine.fissure(at, element, { radius: num('radius', 3.4), duration: num('duration', 1.2) }); break;
      case 'light': engine.light(at.y < 0.4 ? at.clone().setY(1.4) : at, engine.palette(element).light, num('intensity', 14), num('duration', 0.5), num('distance', 9)); break;
      default: break;
    }
  }
}
