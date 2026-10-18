// Exact PNG decoding of the baked exports (decodePng, src/characters/BakedDecode.ts): inflate + unfilter, nothing else touches the
// bytes. PNGs built here with node:zlib, one scanline per filter type, must come back byte for byte.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { load, ROOT } from './load.mjs';

const { decodePng } = await load('/src/characters/BakedDecode.ts');

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
function chunk(type, data) {
  const b = Buffer.alloc(12 + data.length);
  b.writeUInt32BE(data.length, 0); b.write(type, 4, 'latin1'); Buffer.from(data).copy(b, 8);
  b.writeUInt32BE(zlib.crc32(b.subarray(4, 8 + data.length)) >>> 0, 8 + data.length);
  return b;
}
/** an 8-bit RGBA PNG of `px`, scanline y filtered with filters[y]; the zlib stream split over `idats` IDAT chunks */
function encode(w, h, px, filters, { idats = 1, depth = 8, colour = 6, interlace = 0 } = {}) {
  const st = w * 4, raw = [];
  for (let y = 0; y < h; y++) {
    const f = filters[y], out = Buffer.alloc(st + 1);
    out[0] = f;
    for (let i = 0; i < st; i++) {
      const a = i >= 4 ? px[y * st + i - 4] : 0, b = y ? px[(y - 1) * st + i] : 0, c = i >= 4 && y ? px[(y - 1) * st + i - 4] : 0;
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      out[i + 1] = (px[y * st + i] - [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][f]) & 255;
    }
    raw.push(out);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = depth; ihdr[9] = colour; ihdr[12] = interlace;
  const z = zlib.deflateSync(Buffer.concat(raw)), cut = Math.ceil(z.length / idats), parts = [];
  for (let k = 0; k < idats; k++) parts.push(chunk('IDAT', z.subarray(k * cut, (k + 1) * cut)));
  return new Uint8Array(Buffer.concat([SIGNATURE, chunk('IHDR', ihdr), chunk('tEXt', Buffer.from('Comment\0test')), ...parts, chunk('IEND', Buffer.alloc(0))]));
}
/** a well-mixed hash of the byte index (neighbouring bytes uncorrelated) */
const mix = (i, seed) => { let h = Math.imul(i ^ seed ^ ((i ^ seed) >>> 16), 0x45d9f3b); h = Math.imul(h ^ (h >>> 16), 0x45d9f3b); return (h ^ (h >>> 16)) >>> 0; };
const pixels = (w, h, seed) => Uint8Array.from({ length: w * h * 4 }, (_, i) => mix(i, seed) & 255);

/** bytes where Paeth's predictor ties between b and c (b != c): its a, b, c order then decides the byte */
function paethTies(w, h, px, filters) {
  let n = 0;
  for (let y = 1; y < h; y++) if (filters[y] === 4) for (let i = 4; i < w * 4; i++) {
    const a = px[y * w * 4 + i - 4], b = px[(y - 1) * w * 4 + i], c = px[(y - 1) * w * 4 + i - 4];
    const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
    if (pb === pc && pb < pa && b !== c) n++;
  }
  return n;
}

test('the five filter types (None, Sub, Up, Average, Paeth) decode byte for byte', async () => {
  const w = 16, h = 10, filters = [0, 1, 2, 3, 4, 4, 3, 2, 1, 0];
  // noisy pixels, and four evenly spaced values like pixel art, where Paeth's predictor ties
  const flat = Uint8Array.from({ length: w * h * 4 }, (_, i) => 64 * (mix(i, 3) & 3));
  assert.ok(paethTies(w, h, flat, filters) > 0, 'the flat pattern exercises Paeth ties');
  for (const px of [pixels(w, h, 1), flat]) {
    const r = await decodePng(encode(w, h, px, filters));
    assert.deepEqual([r.w, r.h], [w, h]);
    assert.deepEqual(r.rgba, px);
  }
});

test('every filter on a first scanline (no row above) and a one-pixel width', async () => {
  for (const f of [0, 1, 2, 3, 4]) {
    const px = pixels(1, 3, f);
    assert.deepEqual((await decodePng(encode(1, 3, px, [f, f, f]))).rgba, px, `filter ${f}`);
  }
});

test('IDAT split over several chunks, ancillary chunks skipped', async () => {
  const w = 16, h = 12, px = pixels(w, h, 7);
  assert.deepEqual((await decodePng(encode(w, h, px, Array.from({ length: h }, (_, y) => y % 5), { idats: 5 }))).rgba, px);
});

test('refused: not a PNG, not 8-bit RGBA, interlaced', async () => {
  await assert.rejects(decodePng(new Uint8Array(Buffer.from('GIF89a......'))), /not a PNG/);
  const px = pixels(2, 2, 3);
  await assert.rejects(decodePng(encode(2, 2, px, [0, 0], { colour: 2 })), /8-bit RGBA/);
  await assert.rejects(decodePng(encode(2, 2, px, [0, 0], { depth: 16 })), /8-bit RGBA/);
  await assert.rejects(decodePng(encode(2, 2, px, [0, 0], { interlace: 1 })), /not interlaced/);
});

/** reference decoder, written from the PNG specification independently of decodePng: node:zlib inflate + the five unfilters */
function referenceDecode(bytes) {
  const w = bytes.readUInt32BE(16), h = bytes.readUInt32BE(20), idat = [];
  for (let o = 8; o < bytes.length; o += 12 + bytes.readUInt32BE(o)) if (bytes.toString('latin1', o + 4, o + 8) === 'IDAT') idat.push(bytes.subarray(o + 8, o + 8 + bytes.readUInt32BE(o)));
  const raw = zlib.inflateSync(Buffer.concat(idat)), st = w * 4, out = new Uint8Array(st * h);
  for (let y = 0; y < h; y++) for (let i = 0; i < st; i++) {
    const a = i >= 4 ? out[y * st + i - 4] : 0, b = y > 0 ? out[(y - 1) * st + i] : 0, c = i >= 4 && y > 0 ? out[(y - 1) * st + i - 4] : 0;
    const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
    const pred = [0, a, b, Math.floor((a + b) / 2), pa <= pb && pa <= pc ? a : pb <= pc ? b : c][raw[y * (st + 1)]];
    out[y * st + i] = (raw[y * (st + 1) + 1 + i] + pred) % 256;
  }
  return { w, h, rgba: out };
}

test('every committed export decodes like the reference decoder', async () => {
  const dir = path.join(ROOT, 'art-lab/characters/exports');
  const pngs = fs.readdirSync(dir).filter((f) => f.endsWith('.png')).sort();
  assert.ok(pngs.length >= 10);
  for (const f of pngs) {
    const bytes = fs.readFileSync(path.join(dir, f)), r = await decodePng(new Uint8Array(bytes)), ref = referenceDecode(bytes);
    assert.deepEqual([r.w, r.h], [ref.w, ref.h], f);
    assert.ok(Buffer.from(r.rgba).equals(Buffer.from(ref.rgba)), `${f}: same RGBA bytes`);
  }
});
