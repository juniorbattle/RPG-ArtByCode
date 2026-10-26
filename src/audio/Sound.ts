import { ambienceOf, EFFECTS, hz, readSettings, tune, type Ambience, type Effect, type Look, type SoundPlace, type SoundSettings } from './score';

/** The version 2's sound engine (lot V8, journal Passe V8): Web Audio only, every sound made by the code from src/audio/score.ts. Nothing
 *  starts before a gesture of the person (the browsers' rule: the context is created, or resumed, on the first key or click); the volume,
 *  the music's share and the mute are kept in the browser (a convenience: a blocked storage gives the defaults). Only the version 2's
 *  pages create it. */

const KEY = 'cdt-v2-sound';

export class Sound {
  ctx: AudioContext | null = null;
  settings: SoundSettings;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private fxBus: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private stops: Array<() => void> = [];
  private want: { place: SoundPlace; look: Look; boutDay: boolean; seed: number } | null = null;

  constructor() {
    let stored: string | null = null;
    try { stored = localStorage.getItem(KEY); } catch { /* storage blocked: the defaults */ }
    this.settings = readSettings(stored);
    const start = () => { void this.unlock(); };
    window.addEventListener('pointerdown', start, { once: false });
    window.addEventListener('keydown', start, { once: false });
  }

  /** the first gesture: the context, its buses, the noise buffer, then the ambience and the music asked for so far */
  async unlock(): Promise<void> {
    if (this.ctx) { if (this.ctx.state === 'suspended') await this.ctx.resume().catch(() => {}); return; }
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const c = this.ctx = new Ctx();
    this.master = c.createGain(); this.master.connect(c.destination);
    this.musicBus = c.createGain(); this.musicBus.connect(this.master);
    this.fxBus = c.createGain(); this.fxBus.connect(this.master);
    const n = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = n.getChannelData(0);
    let x = 0x12345;
    for (let i = 0; i < d.length; i++) { x = (x * 1103515245 + 12345) & 0x7fffffff; d[i] = x / 0x3fffffff - 1; }
    this.noise = n;
    this.apply();
    if (this.want) this.setScene(this.want.place, this.want.look, this.want.boutDay, this.want.seed);
  }

  set(p: Partial<SoundSettings>): void {
    Object.assign(this.settings, p);
    try { localStorage.setItem(KEY, JSON.stringify(this.settings)); } catch { /* not kept */ }
    this.apply();
  }
  private apply(): void {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime, s = this.settings;
    this.master.gain.setTargetAtTime(s.muted ? 0 : s.volume, t, 0.05);
    this.musicBus!.gain.setTargetAtTime(s.music * 0.6, t, 0.05);
    this.fxBus!.gain.setTargetAtTime(1, t, 0.05);
  }

  /** an effect now */
  play(e: Effect, gain = 1): void {
    const c = this.ctx; if (!c || !this.fxBus || this.settings.muted) return;
    const t0 = c.currentTime + 0.005;
    for (const v of EFFECTS[e]) {
      const t = t0 + (v.delay ?? 0), g = c.createGain();
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v.gain * gain, t + v.attack); g.gain.exponentialRampToValueAtTime(0.0001, t + v.attack + v.decay);
      let src: AudioScheduledSourceNode, out: AudioNode = g;
      if (v.wave === 'noise') {
        const b = c.createBufferSource(); b.buffer = this.noise; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = v.q ?? 1;
        f.frequency.setValueAtTime(v.f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, v.f1), t + v.attack + v.decay);
        b.connect(f); f.connect(g); src = b;
      } else {
        const o = c.createOscillator(); o.type = v.wave; o.frequency.setValueAtTime(v.f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, v.f1), t + v.attack + v.decay);
        o.connect(g); src = o;
      }
      out.connect(this.fxBus); src.start(t); src.stop(t + v.attack + v.decay + 0.05);
    }
  }

  /** the place's ambience and the day state's music (replacing what played) */
  setScene(place: SoundPlace, look: Look, boutDay = false, seed = 1842): void {
    this.want = { place, look, boutDay, seed };
    const c = this.ctx; if (!c) return;
    for (const s of this.stops) s(); this.stops = [];
    this.ambience(ambienceOf(place, look, boutDay));
    if (place !== 'arena') this.music(seed, look);
  }

  private ambience(a: Ambience): void {
    const c = this.ctx!, bus = this.fxBus!;
    for (const b of a.beds) {
      const src = c.createBufferSource(); src.buffer = this.noise; src.loop = true;
      const f = c.createBiquadFilter(); f.type = b.kind === 'wind' ? 'lowpass' : 'bandpass'; f.frequency.value = b.freq; f.Q.value = b.q;
      const g = c.createGain(); g.gain.value = b.gain;
      const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.07 + b.sway * 0.1; lg.gain.value = b.gain * b.sway; lfo.connect(lg); lg.connect(g.gain);
      src.connect(f); f.connect(g); g.connect(bus); src.start(); lfo.start();
      this.stops.push(() => { src.stop(); lfo.stop(); g.disconnect(); });
    }
    for (const call of a.calls) {
      let alive = true, timer = 0;
      const next = () => {
        if (!alive) return;
        this.call(call.kind, call.gain);
        const [lo, hi] = call.every; timer = window.setTimeout(next, (lo + Math.random() * (hi - lo)) * 1000);
      };
      timer = window.setTimeout(next, call.every[0] * 500);
      this.stops.push(() => { alive = false; clearTimeout(timer); });
    }
  }

  /** one sparse call of an ambience */
  private call(kind: string, gain: number): void {
    const c = this.ctx!, t = c.currentTime, g = c.createGain(); g.connect(this.fxBus!);
    const tone = (f0: number, f1: number, at: number, dur: number, wave: OscillatorType = 'sine', v = gain) => {
      const o = c.createOscillator(), e = c.createGain(); o.type = wave; o.frequency.setValueAtTime(f0, t + at); o.frequency.exponentialRampToValueAtTime(f1, t + at + dur);
      e.gain.setValueAtTime(0, t + at); e.gain.linearRampToValueAtTime(v, t + at + 0.01); e.gain.exponentialRampToValueAtTime(0.0001, t + at + dur);
      o.connect(e); e.connect(g); o.start(t + at); o.stop(t + at + dur + 0.02);
    };
    if (kind === 'bird') for (let i = 0; i < 3; i++) tone(2800 + i * 300, 3600 + i * 200, i * 0.11, 0.08);
    else if (kind === 'cricket') for (let i = 0; i < 4; i++) tone(4300, 4200, i * 0.06, 0.03, 'square', gain * 0.5);
    else if (kind === 'hammer') { tone(1500, 1400, 0, 0.18, 'triangle'); tone(2300, 2200, 0, 0.1, 'triangle', gain * 0.5); }
    else if (kind === 'cheer') tone(400, 600, 0, 1.2, 'sawtooth', gain * 0.3);
    else if (kind === 'lute') for (let i = 0; i < 3; i++) this.pluck(hz(57 + [0, 7, 12][i]), t + i * 0.18, gain);
  }

  private pluck(f: number, t: number, v: number, bus: AudioNode = this.fxBus!): void {
    const c = this.ctx!, o = c.createOscillator(), o2 = c.createOscillator(), e = c.createGain(), lp = c.createBiquadFilter();
    o.type = 'triangle'; o2.type = 'sawtooth'; o.frequency.value = f; o2.frequency.value = f * 1.002; lp.type = 'lowpass'; lp.frequency.setValueAtTime(f * 6, t); lp.frequency.exponentialRampToValueAtTime(f * 1.5, t + 0.6);
    e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(v, t + 0.005); e.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    const m = c.createGain(); m.gain.value = 0.25; o2.connect(m); m.connect(lp); o.connect(lp); lp.connect(e); e.connect(bus);
    o.start(t); o2.start(t); o.stop(t + 1.3); o2.stop(t + 1.3);
  }

  /** the tune of the day state, looped with a bar of silence between the turns */
  private music(seed: number, look: Look): void {
    const c = this.ctx!, { notes, drone, length } = tune(seed, look);
    let alive = true, timer = 0;
    const turn = () => {
      if (!alive) return;
      const t0 = c.currentTime + 0.1;
      for (const n of notes) this.pluck(hz(n.midi), t0 + n.t, 0.12 * n.vel, this.musicBus!);
      for (const n of drone) {
        const o = c.createOscillator(), e = c.createGain(); o.type = 'sine'; o.frequency.value = hz(n.midi);
        e.gain.setValueAtTime(0, t0 + n.t); e.gain.linearRampToValueAtTime(0.05 * n.vel, t0 + n.t + 0.4); e.gain.linearRampToValueAtTime(0, t0 + n.t + n.dur);
        o.connect(e); e.connect(this.musicBus!); o.start(t0 + n.t); o.stop(t0 + n.t + n.dur + 0.05);
      }
      timer = window.setTimeout(turn, (length + 60 / 70 * 4) * 1000);
    };
    turn();
    this.stops.push(() => { alive = false; clearTimeout(timer); });
  }
}

let shared: Sound | null = null;
/** the page's one sound engine (created on demand by a version 2 page) */
export function sound(): Sound { return (shared ??= new Sound()); }
