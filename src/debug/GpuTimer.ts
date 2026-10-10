/** Per-pass GPU timing (EXT_disjoint_timer_query_webgl2). Passes are timed sequentially (queries cannot nest);
 *  results arrive a few frames late and are smoothed. Off by default: enable with ?gpuprof=1 or `perf.gpu.enabled`. */
export class GpuTimer {
  enabled = false;
  /** smoothed GPU milliseconds per pass name */
  readonly ms: Record<string, number> = {};
  private ext: { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number } | null;
  private cur: { name: string; q: WebGLQuery } | null = null;
  private pending: Array<{ name: string; q: WebGLQuery }> = [];
  private free: WebGLQuery[] = [];

  constructor(private gl: WebGL2RenderingContext) {
    this.ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  }

  get available(): boolean { return !!this.ext; }

  begin(name: string): void {
    if (!this.enabled || !this.ext) return;
    this.end();
    const q = this.free.pop() ?? this.gl.createQuery()!;
    this.gl.beginQuery(this.ext.TIME_ELAPSED_EXT, q);
    this.cur = { name, q };
  }

  end(): void {
    if (!this.cur || !this.ext) return;
    this.gl.endQuery(this.ext.TIME_ELAPSED_EXT);
    this.pending.push(this.cur);
    this.cur = null;
  }

  /** collect finished queries (call once per frame, after the last end()) */
  poll(): void {
    if (!this.ext) return;
    const gl = this.gl;
    const disjoint = gl.getParameter(this.ext.GPU_DISJOINT_EXT);
    while (this.pending.length) {
      const p = this.pending[0];
      if (!gl.getQueryParameter(p.q, gl.QUERY_RESULT_AVAILABLE)) break;
      this.pending.shift();
      const v = gl.getQueryParameter(p.q, gl.QUERY_RESULT) / 1e6;
      if (!disjoint) this.ms[p.name] = this.ms[p.name] === undefined ? v : this.ms[p.name] + (v - this.ms[p.name]) * 0.06;
      this.free.push(p.q);
    }
  }

  total(): number { return Object.values(this.ms).reduce((a, b) => a + b, 0); }
}
