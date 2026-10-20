import type { App } from '../app/App';

/** Title card + procedural minimap (drawn from the generated layout, rotated with the camera) + interaction prompt. */

export class Hud {
  private title: HTMLDivElement;
  private prompt: HTMLDivElement;
  private map: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private frame = 0;
  private S = 148;

  constructor(private app: App) {
    this.title = document.createElement('div');
    this.title.style.cssText = 'position:fixed;left:22px;top:16px;color:#f1e6cf;font:600 21px/1.1 "Palatino Linotype","Book Antiqua",Georgia,serif;letter-spacing:.04em;text-shadow:0 2px 8px #000,0 0 18px rgba(0,0,0,.8);z-index:20;pointer-events:none';
    this.title.innerHTML = 'Cité du Tournoi<div style="font:400 13.5px/1.5 \'Segoe UI\',system-ui,sans-serif;letter-spacing:.06em;opacity:.85;margin-top:3px">Merchant District — ' + (app.day ? 'Day' : 'Night') + ' <span id="hud-state" style="opacity:.6"></span></div>';
    document.body.appendChild(this.title);
    this.prompt = document.createElement('div');
    this.prompt.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);padding:6px 16px;border-radius:20px;background:rgba(8,12,22,.7);border:1px solid rgba(233,166,76,.4);color:#f6e7c4;font:13px "Segoe UI",system-ui,sans-serif;letter-spacing:.05em;z-index:20;opacity:0;transition:opacity .25s;pointer-events:none';
    document.body.appendChild(this.prompt);
    this.map = document.createElement('canvas');
    this.map.width = this.map.height = this.S * 2;
    this.map.style.cssText = `position:fixed;right:300px;top:12px;width:${this.S}px;height:${this.S}px;z-index:20;pointer-events:none;filter:drop-shadow(0 2px 8px #000)`;
    this.ctx = this.map.getContext('2d')!;
    document.body.appendChild(this.map);
  }

  setVisible(v: boolean): void { this.title.style.display = this.prompt.style.display = this.map.style.display = v ? '' : 'none'; }
  setMapRight(px: number): void { this.map.style.right = `${px}px`; }

  update(): void {
    const a = this.app;
    const st = this.title.querySelector('#hud-state') as HTMLElement;
    st.textContent = a.config.forgeState === 'SABOTAGED_FORGE' ? '· the forge has been sabotaged' : '';
    const near = a.actors?.nearForge;
    const t = a.actors?.interactTarget;
    const msg = near ? (a.config.forgeState === 'NORMAL_FORGE' ? '[E] Sabotage the forge' : '[E] Restore the forge') : t ? '[E] Talk' : '';
    this.prompt.textContent = msg; this.prompt.style.opacity = msg ? '1' : '0';
    if ((this.frame++ & 3) === 0) this.drawMap();
  }

  private drawMap(): void {
    const a = this.app, d = a.district, c = this.ctx, S = this.S * 2, R = S / 2;
    if (!d) return;
    c.clearRect(0, 0, S, S);
    c.save(); c.beginPath(); c.arc(R, R, R - 4, 0, Math.PI * 2); c.clip();
    c.fillStyle = '#0c1424'; c.fillRect(0, 0, S, S);
    // centred on the player so the long quay reads; rotated so "away from camera" is up
    const sc = 4.4, yaw = a.rig.yaw;
    const pp = a.actors?.player?.pos;
    const cx = pp ? pp.x + 4 : 4, cz = pp ? pp.z - 1 : 0;
    const cs = Math.cos(yaw), sn = Math.sin(yaw);
    // world -> map: rotate so "away from camera" is up the map
    const P = (x: number, z: number): [number, number] => {
      const dx = x - cx, dz = z - cz;
      const sx = dx * cs - dz * sn, sd = dx * sn + dz * cs;
      return [R + sx * sc, R + sd * sc];
    };
    const quad = (pts: Array<[number, number]>, fill: string, stroke?: string) => {
      c.beginPath(); pts.forEach(([x, z], i) => { const [mx, my] = P(x, z); i ? c.lineTo(mx, my) : c.moveTo(mx, my); }); c.closePath();
      c.fillStyle = fill; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = 2; c.stroke(); }
    };
    quad([[-34, -18], [60, -18], [60, 4.6], [-34, 4.6]], '#2b3550');
    quad([[-34, 4.6], [60, 4.6], [60, 15.5], [-34, 15.5]], '#143a5e');
    const w = d.walk;
    quad([[w.x0, w.z0], [w.x1, w.z0], [w.x1, w.z1], [w.x0, w.z1]], '#3a4562');
    for (const col of d.colliders) {
      if (col.kind === 'rect' && col.x1 - col.x0 > 1.2) quad([[col.x0, col.z0], [col.x1, col.z0], [col.x1, col.z1], [col.x0, col.z1]], '#6b5a48', '#2a2118');
    }
    for (const l of d.lights) { const [mx, my] = P(l.pos[0], l.pos[2]); c.fillStyle = l.group === 'forge' ? '#ff8c3a' : '#ffd27a'; c.beginPath(); c.arc(mx, my, 3.4, 0, 7); c.fill(); }
    for (const act of a.actors?.actors ?? []) {
      if (act === a.actors.player) continue;
      const [mx, my] = P(act.pos.x, act.pos.z); c.fillStyle = act.detail === 'crowd' ? '#8aa0c8' : '#e8e0d0'; c.beginPath(); c.arc(mx, my, 3.4, 0, 7); c.fill();
    }
    const p = a.actors?.player;
    if (p) { const [mx, my] = P(p.pos.x, p.pos.z); c.fillStyle = '#ff5a4a'; c.beginPath(); c.moveTo(mx, my - 8); c.lineTo(mx + 6, my + 6); c.lineTo(mx - 6, my + 6); c.closePath(); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.stroke(); }
    c.restore();
    c.strokeStyle = '#d9b46a'; c.lineWidth = 5; c.beginPath(); c.arc(R, R, R - 4, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 1.5; c.beginPath(); c.arc(R, R, R - 9, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#f3dfae'; c.font = '600 20px Georgia,serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const [nx, ny] = [R + Math.sin(-yaw + Math.PI) * (R - 20) * 0 + 0, 18];
    c.fillText('N', nx, ny);
  }
}
