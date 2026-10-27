// A recording 2D canvas for the unit tests (journal Passe VP3): `document.createElement('canvas')` gives a canvas whose context logs every call
// and every style it is given, in order, so a painter's output can be compared without a browser (the same calls on the same canvas = the
// same bytes). Gradients log their stops and stand in the log by their creation index.
import crypto from 'node:crypto';

export function recordingDocument() {
  const log = [];
  let grads = 0;
  const val = (v) => (v && typeof v === 'object' && '__grad' in v ? `grad#${v.__grad}` : typeof v === 'number' ? Number(v.toPrecision(12)) : v);
  const ctx = new Proxy({}, {
    get(o, k) {
      if (k in o) return o[k];
      if (k === 'createLinearGradient' || k === 'createRadialGradient') return (...a) => { const g = { __grad: grads++, addColorStop: (t, c) => log.push(['stop', g.__grad, t, c]) }; log.push([k, g.__grad, ...a.map(val)]); return g; };
      if (k === 'getImageData') return (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h });
      if (k === 'createImageData') return (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h });
      if (k === 'measureText') return (t) => ({ width: String(t).length * 6 });
      return (...a) => { log.push([k, ...a.map(val)]); };
    },
    set(o, k, v) { log.push(['set', k, val(v)]); return true; },
  });
  const document = {
    createElement: (tag) => {
      const c = { tag, getContext: () => ctx };
      return new Proxy(c, { set(o, k, v) { log.push(['canvas', k, v]); o[k] = v; return true; } });
    },
  };
  return { document, log, hash: () => crypto.createHash('sha256').update(JSON.stringify(log)).digest('hex') };
}
