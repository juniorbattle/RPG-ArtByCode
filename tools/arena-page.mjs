// The arena prototype as an artifact page (journal Passe A1): the artifact service wraps a published file in its own document skeleton
// (doctype, head with charset and viewport, body), so the page drops its own and keeps the rest; `data-mode="hd2d"` (on the prototype's
// <body>, read by its CSS until the boot sets it) is set by a first inline script instead.
//   node tools/arena-page.mjs arena/arena.html <out.html>
import fs from 'node:fs';
const [src, out] = process.argv.slice(2);
if (!src || !out) throw new Error('usage: node tools/arena-page.mjs arena/arena.html <out.html>');
let s = fs.readFileSync(src, 'utf8');
const cut = (re, by = '') => { if (!re.test(s)) throw new Error(`anchor not found: ${re}`); s = s.replace(re, by); };
cut(/^<!DOCTYPE html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="[^"]*">\n/);
cut(/<\/style><\/head>\n<body data-mode="hd2d">\n/, '</style>\n<script>document.documentElement.lang = \'en\'; document.body.dataset.mode = \'hd2d\';</script>\n');
cut(/<\/script><\/body><\/html>\n$/, '</script>\n');
fs.writeFileSync(out, s);
console.log(`${out}: ${Buffer.byteLength(s)} bytes`);
