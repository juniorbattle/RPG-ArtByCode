/** The baked sound, loaded on demand (lot S1, journal Passe SN3; SA-8 « Elle bouge : cuit, avec manifeste », SA-17 « 12 Mo au plus »): a file of
 *  src/audio/baked/ reaches the game only through its manifest (art-lab/audio/manifests/, checked by `npm run art:validate`). The same sound comes in
 *  two formats, Opus in WebM and AAC in M4A (journal Passe SN1); each browser fetches the one it plays, the first time it is asked for, never before
 *  the first page. A file that fails leaves the sound without it: never an error on the page. The band's catalogue is baked by
 *  tools/audio/band/bake.mjs (journal Passe SN10), its lengths in ./catalogue.json. */

import type { Format } from './align';
export type { Format } from './align';

// `?url`: nothing is fetched or bundled into the page's code, a file only when load() asks for it
const FILES = import.meta.glob('./baked/*.{webm,m4a}', { query: '?url', import: 'default' }) as Record<string, () => Promise<string>>;
const MIME: Record<Format, string> = { webm: 'audio/webm; codecs="opus"', m4a: 'audio/mp4; codecs="mp4a.40.2"' };

/** the baked sounds this build holds */
export function bakedIds(files: Record<string, unknown> = FILES): string[] {
  return [...new Set(Object.keys(files).map((p) => p.replace(/^.*\//, '').replace(/\.[^.]+$/, '')))].sort();
}

/** the files of a sound that this browser says it plays, Opus before AAC. Pure */
export function playable(id: string, files: readonly string[], can: (mime: string) => boolean): Array<{ file: string; format: Format }> {
  const out: Array<{ file: string; format: Format }> = [];
  for (const x of ['webm', 'm4a'] as const) { const f = files.find((p) => p.endsWith(`/${id}.${x}`)); if (f && can(MIME[x])) out.push({ file: f, format: x }); }
  return out;
}
/** the file of a sound that this browser plays: the first format it says it can, Opus before AAC. Pure */
export function pickFile(id: string, files: readonly string[], can: (mime: string) => boolean): string | null {
  return playable(id, files, can)[0]?.file ?? null;
}

export class AudioLoader {
  private got = new Map<string, Promise<AudioBuffer | null>>();
  /** a format that said it could and then could not decode (a browser may promise more than its decoder keeps): the next one is asked */
  private broken = new Set<Format>();
  constructor(private ctx: BaseAudioContext) {}

  /** a baked sound by its id, with the format it came in; the next format when the first does not decode */
  async decoded(id: string): Promise<{ buf: AudioBuffer; format: Format } | null> {
    const a = document.createElement('audio');
    for (const { file, format } of playable(id, Object.keys(FILES), (m) => a.canPlayType(m) !== '')) {
      if (this.broken.has(format)) continue;
      const buf = await this.url(await FILES[file]());
      if (buf) return { buf, format };
      this.broken.add(format);
    }
    return null;
  }

  /** a url to a buffer, once whatever the number of requests; null when it cannot be fetched or decoded */
  url(url: string): Promise<AudioBuffer | null> {
    let p = this.got.get(url);
    if (!p) {
      p = fetch(url).then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.arrayBuffer(); }).then((b) => this.ctx.decodeAudioData(b))
        .catch((e) => { console.warn(`sound: ${url} not loaded: ${(e as Error).message}`); return null; });
      this.got.set(url, p);
    }
    return p;
  }

  /** a baked sound by its id */
  async load(id: string): Promise<AudioBuffer | null> { return (await this.decoded(id))?.buf ?? null; }
}
