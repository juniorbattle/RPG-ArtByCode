import * as THREE from 'three';
import type { App } from '../app/App';
import { U } from '../atmosphere/SceneUniforms';
import { CANONICAL_SEED, GENERATOR_VERSION } from '../core/rng';
import type { DistrictConfig } from '../district/MerchantDistrictGenerator';
import type { ForgeState } from '../district/ForgeGenerator';

/** Art-direction panel: structural sliders regenerate the district (deterministically), look sliders are live. */

const CSS = `
#adp{position:fixed;right:10px;top:10px;width:272px;max-height:calc(100vh - 20px);overflow:auto;background:rgba(8,12,22,.84);backdrop-filter:blur(6px);color:#cdd6e6;font:11.5px/1.35 "Segoe UI",system-ui,sans-serif;border:1px solid rgba(233,166,76,.28);border-radius:8px;padding:8px 10px 10px;z-index:30;user-select:none}
#adp h1{font-size:12px;letter-spacing:.14em;margin:2px 0 6px;color:#f1d9a0;display:flex;justify-content:space-between;align-items:center}
#adp h2{font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:#e9a64c;margin:10px 0 4px;cursor:pointer;display:flex;justify-content:space-between}
#adp .row{display:grid;grid-template-columns:104px 1fr 38px;gap:6px;align-items:center;margin:2px 0}
#adp input[type=range]{width:100%;accent-color:#e9a64c;height:14px}
#adp input[type=number],#adp select{width:100%;background:#101828;color:#e8eefc;border:1px solid #2b3a58;border-radius:4px;padding:2px 4px;font:inherit}
#adp input[type=color]{width:100%;height:20px;border:0;background:none;padding:0}
#adp button{background:#1b2742;color:#f3e3bf;border:1px solid #3b4d78;border-radius:4px;padding:3px 7px;font:inherit;cursor:pointer;margin:2px 3px 2px 0}
#adp button:hover{background:#27375c}
#adp .val{text-align:right;color:#8fa3c8;font-variant-numeric:tabular-nums}
#adp .stats{font-variant-numeric:tabular-nums;color:#9fb4d8;white-space:pre;font-size:11px}
#adp .sec.collapsed .body{display:none}
#adp .hint{opacity:.55;font-size:10.5px;margin-top:6px}
`;

export class DebugPanel {
  readonly el: HTMLDivElement;
  private statsEl!: HTMLDivElement;
  private seedInput!: HTMLInputElement;
  private pending: number | null = null;

  constructor(private app: App) {
    const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
    this.el = document.createElement('div'); this.el.id = 'adp';
    document.body.appendChild(this.el);
    this.build();
    window.addEventListener('keydown', (e) => { if (e.key.toLowerCase() === 'h' && !(e.target instanceof HTMLInputElement)) this.el.style.display = this.el.style.display === 'none' ? '' : 'none'; });
    app.onRegenerate.push(() => { this.seedInput.value = String(app.config.seed); });
  }

  private section(title: string, open = true): HTMLDivElement {
    const sec = document.createElement('div'); sec.className = 'sec' + (open ? '' : ' collapsed');
    const h = document.createElement('h2'); h.innerHTML = `<span>${title}</span><span>▾</span>`;
    const body = document.createElement('div'); body.className = 'body';
    h.onclick = () => sec.classList.toggle('collapsed');
    sec.append(h, body); this.el.appendChild(sec);
    return body;
  }

  private slider(parent: HTMLElement, label: string, min: number, max: number, step: number, get: () => number, set: (v: number) => void, structural = false): void {
    const row = document.createElement('div'); row.className = 'row';
    const l = document.createElement('span'); l.textContent = label;
    const input = document.createElement('input'); input.type = 'range'; input.min = String(min); input.max = String(max); input.step = String(step); input.value = String(get());
    const val = document.createElement('span'); val.className = 'val'; val.textContent = (+get()).toFixed(step < 0.1 ? 2 : 1);
    input.oninput = () => {
      const v = parseFloat(input.value); val.textContent = v.toFixed(step < 0.1 ? 2 : 1);
      set(v);
      if (structural) this.debounceRegen();
    };
    row.append(l, input, val); parent.appendChild(row);
  }

  private debounceRegen(): void {
    if (this.pending) clearTimeout(this.pending);
    this.pending = window.setTimeout(() => { this.app.regenerate(); this.pending = null; }, 220);
  }

  private button(parent: HTMLElement, label: string, fn: () => void): void { const b = document.createElement('button'); b.textContent = label; b.onclick = fn; parent.appendChild(b); }

  private build(): void {
    const a = this.app, cfg = a.config;
    const title = document.createElement('h1'); title.innerHTML = `<span>ART DIRECTION</span><span style="opacity:.5;font-size:10px">gen v${GENERATOR_VERSION}</span>`; this.el.appendChild(title);

    // ---- seed
    const s = this.section('Seed & generation');
    const row = document.createElement('div'); row.className = 'row'; row.style.gridTemplateColumns = '104px 1fr';
    const l = document.createElement('span'); l.textContent = 'scene seed';
    this.seedInput = document.createElement('input'); this.seedInput.type = 'number'; this.seedInput.value = String(cfg.seed);
    this.seedInput.onchange = () => a.regenerate({ seed: (parseInt(this.seedInput.value, 10) || 1) >>> 0 });
    row.append(l, this.seedInput); s.appendChild(row);
    this.button(s, 'Regenerate', () => a.regenerate({ seed: (parseInt(this.seedInput.value, 10) || CANONICAL_SEED) >>> 0 }));
    this.button(s, 'Random Seed', () => { a.randomSeed(); });
    this.button(s, `Reset Canonical (${CANONICAL_SEED})`, () => { a.resetSeed(); });

    // ---- forge state
    const f = this.section('Forge state');
    const sel = document.createElement('select');
    for (const v of ['NORMAL_FORGE', 'SABOTAGED_FORGE']) { const o = document.createElement('option'); o.value = v; o.textContent = v; sel.appendChild(o); }
    sel.value = cfg.forgeState; sel.onchange = () => a.setForgeState(sel.value as ForgeState);
    f.appendChild(sel);
    a.onRegenerate.push(() => { sel.value = a.config.forgeState; });
    this.button(f, 'Toggle (F / E near forge)', () => a.setForgeState(a.config.forgeState === 'NORMAL_FORGE' ? 'SABOTAGED_FORGE' : 'NORMAL_FORGE'));

    // ---- layout
    const g = this.section('Procedural layout (regenerates)');
    const C = <K extends keyof DistrictConfig>(k: K) => ({ get: () => cfg[k] as number, set: (v: number) => { (cfg[k] as number) = v; } });
    this.slider(g, 'building density', 0.4, 1.6, 0.05, C('buildingDensity').get, C('buildingDensity').set, true);
    this.slider(g, 'asymmetry', 0, 1, 0.05, C('asymmetry').get, C('asymmetry').set, true);
    this.slider(g, 'verticality', 0.8, 1.4, 0.05, C('verticality').get, C('verticality').set, true);
    this.slider(g, 'roof exaggeration', 0.5, 1.8, 0.05, C('roofExaggeration').get, C('roofExaggeration').set, true);
    this.slider(g, 'timber ratio', 0, 1, 0.05, C('timberRatio').get, C('timberRatio').set, true);
    this.slider(g, 'lit windows', 0.1, 1, 0.05, C('litWindows').get, C('litWindows').set, true);
    this.slider(g, 'prop density', 0, 1.6, 0.05, C('propDensity').get, C('propDensity').set, true);
    this.slider(g, 'NPC density', 0, 2, 0.1, C('npcDensity').get, (v) => { cfg.npcDensity = v; if (a.district) { a.actors.populate(a.district, v, cfg.seed); } });

    // ---- lighting
    const li = this.section('Lighting');
    this.slider(li, 'lantern intensity', 0, 2.5, 0.05, () => a.lights.lanternGain, (v) => { a.lights.lanternGain = v; });
    this.slider(li, 'warm-light gain', 0, 2.5, 0.05, () => a.lights.warmGain, (v) => { a.lights.warmGain = v; });
    this.slider(li, 'moon intensity', 0, 2.5, 0.05, () => a.moonGain, (v) => { a.setMoonGain(v); });
    const ambRow = document.createElement('div'); ambRow.className = 'row'; ambRow.style.gridTemplateColumns = '104px 1fr';
    const al = document.createElement('span'); al.textContent = 'ambient colour';
    const ac = document.createElement('input'); ac.type = 'color'; ac.value = '#' + a.ambientBase.getHexString();
    ac.oninput = () => a.setAmbientColor(new THREE.Color(ac.value));
    ambRow.append(al, ac); li.appendChild(ambRow);
    this.slider(li, 'ambient level', 0.2, 3, 0.05, () => a.ambientLevel, (v) => a.setAmbientLevel(v));
    this.slider(li, 'wetness / puddles', 0, 1.3, 0.05, () => U.uWet.value, (v) => { U.uWet.value = v; });

    // ---- atmosphere
    const at = this.section('Atmosphere');
    this.slider(at, 'fog density', 0, 0.04, 0.001, () => U.uFogDensity.value, (v) => { U.uFogDensity.value = v; });
    this.slider(at, 'ground mist', 0, 1, 0.05, () => U.uMist.value, (v) => { U.uMist.value = v; });
    this.slider(at, 'smoke amount', 0, 2, 0.05, () => a.particles.smokeAmount, (v) => { a.particles.smokeAmount = v; });
    this.slider(at, 'spark / ember gain', 0, 2, 0.05, () => a.particles.intensity, (v) => { a.particles.intensity = v; });
    this.slider(at, 'wind (cloth / leaves)', 0, 3, 0.05, () => U.uWindAmp.value, (v) => { U.uWindAmp.value = v; });

    // ---- post
    const p = this.section('Post FX');
    const P = a.post.params;
    this.slider(p, 'depth of field', 0, 1.5, 0.05, () => P.dofStrength, (v) => { P.dofStrength = v; });
    this.slider(p, 'tilt-shift', 0, 1.5, 0.05, () => P.tiltStrength, (v) => { P.tiltStrength = v; });
    this.slider(p, 'focus distance', 20, 70, 0.5, () => P.dofFocus, (v) => { P.dofFocus = v; });
    this.slider(p, 'bloom', 0, 2, 0.05, () => P.bloomStrength, (v) => { P.bloomStrength = v; });
    this.slider(p, 'bloom threshold', 0.3, 2, 0.05, () => P.bloomThreshold, (v) => { P.bloomThreshold = v; });
    this.slider(p, 'exposure', 0.4, 2, 0.02, () => P.exposure, (v) => { P.exposure = v; });
    this.slider(p, 'saturation', 0.4, 1.6, 0.02, () => P.saturation, (v) => { P.saturation = v; });
    this.slider(p, 'vignette', 0, 0.8, 0.02, () => P.vignette, (v) => { P.vignette = v; });
    this.slider(p, 'render scale', 0.5, 1.5, 0.05, () => P.renderScale, (v) => { P.renderScale = v; a.resize(); });

    // ---- camera
    const c = this.section('Camera', false);
    this.slider(c, 'pitch (deg)', 15, 55, 0.5, () => THREE.MathUtils.radToDeg(a.rig.pitch), (v) => { a.rig.pitch = THREE.MathUtils.degToRad(v); });
    this.slider(c, 'yaw (deg)', 0, 70, 0.5, () => THREE.MathUtils.radToDeg(a.rig.yaw), (v) => { a.rig.yaw = THREE.MathUtils.degToRad(v); });
    this.slider(c, 'distance', 22, 70, 0.5, () => a.rig.dist, (v) => { a.rig.dist = v; });
    this.slider(c, 'lens fov', 12, 40, 0.5, () => a.rig.fov, (v) => { a.rig.fov = v; });
    this.slider(c, 'lens shift', -0.4, 0.6, 0.01, () => a.rig.shiftY, (v) => { a.rig.shiftY = v; });

    // ---- toggles
    const t = this.section('Quality toggles', false);
    const toggle = (label: string, get: () => boolean, set: (v: boolean) => void) => {
      const r = document.createElement('label'); r.style.cssText = 'display:flex;gap:6px;align-items:center;margin:2px 0';
      const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = get(); cb.onchange = () => set(cb.checked);
      r.append(cb, label); t.appendChild(r);
    };
    toggle('moon shadows', () => U.uShadowOn.value > 0.5, (v) => { U.uShadowOn.value = v ? 1 : 0; });
    toggle('planar reflections', () => a.reflection.enabled, (v) => { a.reflection.enabled = v; });
    toggle('depth of field', () => a.post.dofEnabled, (v) => { a.post.dofEnabled = v; });
    toggle('bloom', () => a.post.bloomEnabled, (v) => { a.post.bloomEnabled = v; });
    toggle('sprite tilt (billboard lean)', () => a.sprites.tilt > 0.5, (v) => { a.sprites.tilt = v ? 0.85 : 0; });

    // ---- perf
    const pf = this.section('Performance');
    this.statsEl = document.createElement('div'); this.statsEl.className = 'stats'; pf.appendChild(this.statsEl);
    const hint = document.createElement('div'); hint.className = 'hint'; hint.textContent = 'WASD / arrows move · Shift run · E interact · F toggle forge · H hide panel'; this.el.appendChild(hint);
  }

  update(): void {
    const s = this.app.snapshot();
    this.statsEl.textContent =
      `FPS ${s.fps.toFixed(0)}   frame ${s.frameMs.toFixed(1)} ms (cpu ${s.cpuMs.toFixed(1)})\n` +
      `draw calls ${s.drawCalls}   triangles ${(s.triangles / 1000).toFixed(1)}k\n` +
      `textures ${s.textures}   tex mem ~${s.textureMB.toFixed(0)} MB\n` +
      `geometries ${s.geometries}   lights ${s.lights}   actors ${s.actors}\n` +
      `generate ${s.generatorMs.toFixed(0)} ms   buildings ${s.district.buildings}   windows ${s.district.windows}\n` +
      `internal ${s.resolution}`;
  }
}
