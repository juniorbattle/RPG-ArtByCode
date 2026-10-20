/** Canonical JSON (object keys sorted at every level) and the state's fingerprint: two states are the same game when their canonical
 *  texts are equal; the hash is a 64-bit FNV-1a of that text, printed as 16 hex digits. Pure. */

export function canonical(v: unknown): string {
  if (v === null || typeof v !== 'object') {
    if (typeof v === 'number' && !Number.isFinite(v)) throw new Error(`canonical: a non-finite number (${v}) cannot be saved`);
    return JSON.stringify(v);
  }
  if (Array.isArray(v)) return `[${v.map((x) => canonical(x === undefined ? null : x)).join(',')}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o).filter((k) => o[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${canonical(o[k])}`).join(',')}}`;
}

/** FNV-1a 64-bit over the UTF-16 code units, in two 32-bit halves (no BigInt in the hot path) */
export function fnv64(s: string): string {
  let h0 = 0x84222325, h1 = 0xcbf29ce4;
  for (let i = 0; i < s.length; i++) {
    h0 ^= s.charCodeAt(i);
    // multiply the 64-bit (h1:h0) by the FNV prime 0x100000001b3
    const l0 = h0 & 0xffff, l1 = h0 >>> 16, m0 = h1 & 0xffff, m1 = h1 >>> 16;
    let a0 = l0 * 0x1b3, a1 = l1 * 0x1b3 + (a0 >>> 16), a2 = m0 * 0x1b3 + (a1 >>> 16), a3 = m1 * 0x1b3 + (a2 >>> 16);
    a2 = (a2 & 0xffff) + l0 * 0x100; a3 += (a2 >>> 16) + l1 * 0x100;
    h0 = ((a1 & 0xffff) << 16 | (a0 & 0xffff)) >>> 0;
    h1 = ((a3 & 0xffff) << 16 | (a2 & 0xffff)) >>> 0;
  }
  return h1.toString(16).padStart(8, '0') + h0.toString(16).padStart(8, '0');
}
