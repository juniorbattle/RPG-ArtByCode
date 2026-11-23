/** The champion's master on the arena's sand (journal Passe CH-PNJ, the operator's complement of 2026-11-23, word for word « voila car visuellement on remarquera l'incoherence de
 *  sprite lorsquon defie ces pnjs ... le pnj et le combattant n'est pas le meme donc on doit integrer une coherence », and his answer on the question put to him, « PNJ en bordure +
 *  portraits (Recommandé) »): a keeper or a passer-by who is no fighter (src/narrative/champions.ts) stands at the right edge of the lists, behind their champion, in their own
 *  approved town sheet, watching the bout; no new image. The pure half: which sheet stands for whom and where they stand. The loader and the renderer: MasterCast.ts. */

/** the approved sheet each person stands as in town (the keepers' own, the passers-by's citizen of a square or townsperson of the quay: the same table as the portraits,
 *  src/characters/PlazaCast.ts plazaFaces, and the squares' ROLE_ARCHETYPE in src/world/PlazaApp.ts) */
export const MASTER_SHEET: Readonly<Record<string, string>> = {
  mara: 'merchant-x2-v2', hilde: 'hilde-x2-v2', corvin: 'corvin-x2-v2', pip: 'pip-x2-v2',
  edda: 'noble-x2-v1', sela: 'wayfarer-x2-v1', yselle: 'wayfarer-x2-v1',
  fenwick: 'older-merchant-x2-v1', garrick: 'older-merchant-x2-v1',
  nell: 'townswoman-x2-v1', hettie: 'townswoman-x2-v1', jory: 'courier-x2-v1', maud: 'artisan-x2-v1', dov: 'traveler-x2-v1',
};

/** where they stand: the right edge of the sand, behind and beside their champion (who stands at x = 2.15), turned to the ring (the townsfolk's front is a three-quarter to the
 *  left, BakedCast `frontLeft`: unmirrored, they look at the fighters); a little smaller than a fighter, as a bystander (« proposé ») */
export const MASTER_AT = { x: 4.9, z: -0.7, scale: 0.8, flip: false } as const;
