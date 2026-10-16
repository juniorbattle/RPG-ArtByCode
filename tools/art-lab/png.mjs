// Minimal PNG codec for the Art Lab tools (no dependency): 8-bit RGB / RGBA, non-interlaced. Exact: no colour management.
import zlib from 'node:zlib';

export function decodePng(buf) {
  let o = 8, W = 0, H = 0, ct = 0; const idat = [];
  while (o < buf.length) { const n = buf.readUInt32BE(o), t = buf.toString('ascii', o + 4, o + 8), d = buf.subarray(o + 8, o + 8 + n);
    if (t === 'IHDR') { W = d.readUInt32BE(0); H = d.readUInt32BE(4); ct = d[9]; if (d[8] !== 8 || d[12] !== 0) throw new Error('PNG: 8-bit, non-interlaced only'); }
    if (t === 'IDAT') idat.push(d); o += 12 + n; }
  const bpp = ct === 6 ? 4 : ct === 2 ? 3 : 0; if (!bpp) throw new Error(`PNG colour type ${ct} not supported`);
  const raw = zlib.inflateSync(Buffer.concat(idat)), st = W * bpp, px = Buffer.alloc(W * H * bpp);
  for (let y = 0; y < H; y++) { const f = raw[y * (st + 1)], r = y * (st + 1) + 1;
    for (let x = 0; x < st; x++) { const a = x >= bpp ? px[y * st + x - bpp] : 0, u = y ? px[(y - 1) * st + x] : 0, c = x >= bpp && y ? px[(y - 1) * st + x - bpp] : 0;
      let v = raw[r + x]; if (f === 1) v += a; else if (f === 2) v += u; else if (f === 3) v += (a + u) >> 1; else if (f === 4) { const p = a + u - c, pa = Math.abs(p - a), pb = Math.abs(p - u), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? u : c; }
      px[y * st + x] = v & 255; } }
  const rgba = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) { rgba[i * 4] = px[i * bpp]; rgba[i * 4 + 1] = px[i * bpp + 1]; rgba[i * 4 + 2] = px[i * bpp + 2]; rgba[i * 4 + 3] = bpp === 4 ? px[i * bpp + 3] : 255; }
  return { W, H, rgba };
}
export function encodePng(W, H, rgba) {
  const crc = (b) => { let c = ~0; for (const v of b) { c ^= v; for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1; } return ~c >>> 0; };
  const chunk = (t, d) => { const h = Buffer.alloc(8); h.writeUInt32BE(d.length); h.write(t, 4, 'ascii'); const c = Buffer.alloc(4); c.writeUInt32BE(crc(Buffer.concat([Buffer.from(t, 'ascii'), d]))); return Buffer.concat([h, d, c]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(W); ih.writeUInt32BE(H, 4); ih[8] = 8; ih[9] = 6;
  const raw = Buffer.alloc(H * (W * 4 + 1)); for (let y = 0; y < H; y++) rgba.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw, { level: 6 })), chunk('IEND', Buffer.alloc(0))]);
}
