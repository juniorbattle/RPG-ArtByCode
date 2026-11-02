/** The baked sound, loaded on demand (lot S1, journal Passe SN3; SA-8 « Elle bouge : cuit, avec manifeste », SA-17 « 12 Mo au plus »): a file of
 *  src/audio/baked/ reaches the game only through its manifest (art-lab/audio/manifests/, checked by `npm run art:validate`). The same sound comes in
 *  two formats, Opus in WebM and AAC in M4A (journal Passe SN1); each browser fetches the one it plays, the first time it is asked for, never before
 *  the first page. A file that fails leaves the sound without it: never an error on the page. None exists yet: the lots S2 to S4 bake them. */

// `?url`: nothing is fetched or bundled into the page's code, a file only when load() asks for it
const FILES = import.meta.glob('./baked/*.{webm,m4a}', { query: '?url', import: 'default' }) as Record<string, () => Promise<string>>;
const MIME: Record<string, string> = { webm: 'audio/webm; codecs="opus"', m4a: 'audio/mp4; codecs="mp4a.40.2"' };

/** the baked sounds this build holds */
export function bakedIds(files: Record<string, unknown> = FILES): string[] {
  return [...new Set(Object.keys(files).map((p) => p.replace(/^.*\//, '').replace(/\.[^.]+$/, '')))].sort();
}

/** the file of a sound that this browser plays: the first format it says it can, Opus before AAC. Pure */
export function pickFile(id: string, files: readonly string[], can: (mime: string) => boolean): string | null {
  for (const x of ['webm', 'm4a']) { const f = files.find((p) => p.endsWith(`/${id}.${x}`)); if (f && can(MIME[x])) return f; }
  return null;
}

export class AudioLoader {
  private got = new Map<string, Promise<AudioBuffer | null>>();
  constructor(private ctx: BaseAudioContext) {}

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
  async load(id: string): Promise<AudioBuffer | null> {
    const a = document.createElement('audio'), f = pickFile(id, Object.keys(FILES), (m) => a.canPlayType(m) !== '');
    return f ? this.url(await FILES[f]()) : null;
  }
}
