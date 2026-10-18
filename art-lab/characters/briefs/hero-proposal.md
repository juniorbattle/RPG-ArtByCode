# Héros premium — le protagoniste cuit : brief (2026-10-18)

**Statut : BRIEF, décisions de base prises par l'opérateur (2026-10-18) ; on attend la planche source (PNG d'origine) que l'opérateur
génère avec le prompt du § 5.** Aucun asset produit, aucun manifeste. Troisième point des priorités de l'opérateur (journal, Passe M5).

## 1. Décisions de l'opérateur (2026-10-18)
1. **Base de dessin : « 01. Protagonist — Young Adventurer »** de la planche complémentaire de 14 personnages
   (`reference/sources/merchant-district-night-npc-character-reference-sheet.webp`, classée par l'opérateur le 16/10 « C, complémentaire :
   utile pour les personnages clés »). Réponse, mot pour mot : « 01 Protagonist (Recommandé) ».
2. **Vitesse : une foulée de course**, la vitesse de jeu ne change pas (2,5 m/s, × 1,7 avec Maj). Réponse, mot pour mot : « Foulée de
   course (Recommandé) ».

## 2. Pourquoi une nouvelle planche
- La planche complémentaire ne montre le protagoniste que sous **une** vue (trois-quarts). Une marche demande face, dos et profil à la
  même échelle, pris sur une planche multi-vues, jamais inventés depuis une seule vue (« Principes à garder », Personnages). Les PNJ de la
  distribution viennent des planches 01-16 et 17-24 (4 à 6 vues par personnage), découpées par leurs scripts de rig.
- La source n'est ni dessinée ni générée ici : l'opérateur la génère, comme les précédentes, et la livre **en fichier d'origine**.

## 3. Brief
**La figure** (d'après la vue 01 de la planche complémentaire, `scratch/hero-premium/attachments/design-01-protagonist-crop-x2.png`) :
- Un jeune aventurier, protagoniste ; cheveux bruns en épis, mèches sur le front ; yeux lisibles, expression calme et décidée.
- Cape bleu indigo à capuche rabattue, bord effiloché, motif doré discret ; fermoir rond en laiton à l'encolure.
- Chemise lin écru, gilet / plastron de cuir brun, ceinture à boucle de laiton, sacoches et bourse à la ceinture, bandoulière.
- Gants de cuir à manchettes, pantalon gris-brun bouffant, bottes de cuir hautes à revers.
- Direction artistique verrouillée (`AGENTS.md`) : indigo / ardoise dominants, l'ambre (laiton, motif doré) comme seul accent chaud,
  l'ivoire désaturé pour le lin et les hautes lumières.

**Proportions** : celles de la base commune des PNJ (docker, Passe 4A-quindecies : tête cheveux compris ≈ 0,33 de la hauteur, largeur de tête
≈ 0,35, épaules ≈ 0,40, largeur maximale ≈ 0,45-0,48 hors cape). La vue 01 est un peu plus élancée (tête ≈ 0,29 de la hauteur, mesure
approximative sur la planche) : le prompt demande la base commune, à corriger par l'opérateur s'il veut un héros plus grand de silhouette.
Hauteur monde : 1,78 m (`HEIGHT.player`), réglée par l'échelle d'instance.

**Vues demandées, même personnage, même échelle, même ligne de sol** : face (repos), dos (repos), profil (repos), et deux poses de course de
profil (contact jambes écartées ; passage, jambe d'appui sous le corps). Les poses de course servent de clés au script de rig : la foulée
doit être longue (§ 4).

**L'illustration source** prime : modelé, expression, matières ; la grille 64 × 96 n'est qu'une contrainte de l'asset reconstruit.

## 4. L'asset reconstruit et le runtime (contraintes mesurées)
- Cadre 64 × 96 (densité ×2, comme toute la distribution), pieds sur la rangée 90, anneau transparent d'un texel, alpha binaire
  (`checkBakedSheet`) ; animations : repos et marche (course) dans les trois vues ; `talk` facultatif.
- Densité : le héros généré ×1 est aujourd'hui à 2,9-3,3 px écran par texel en B / C / D contre 0,65-2,0 pour la distribution ×2 autour de
  lui (Passe S2) : le héros cuit à ×2 a la même densité que ses voisins.
- **Foulée** : la cadence d'une marche cuite suit la vitesse vue à l'écran (`ActorSystem.walkClock`, Passe S2), bornée à × 1,6 de 7,5
  images / s. À 2,5 m/s et à l'échelle × 1,12 des cadrages B / D, le pied d'appui doit reculer d'environ **9 texels par image** dans le cycle
  de profil (la distribution : 4-4,5), soit une course légère ; mesuré par `tools/art-lab/stride.mjs` sur l'export, prouvé en mouvement par
  `tools/foot-slip.mjs`. Avec Maj (4,25 m/s), la borne × 1,6 laissera glisser : à décider à la livraison (borne relevée pour le héros, ou
  cycle de course plus long).
- Entrée de production : `BakedCast.ts` avec `replaces: ['player']`, seulement après approbation de l'opérateur (manifeste `approved: true`,
  `runtimeUse: "production"`). D'ici là : `runtimeUse: "lab"`, aperçu `?baked=` / `cast=candidate` en DEV.

## 5. Prompt de la planche source (à coller ; images jointes dans cet ordre)
Images à joindre : **image 1** = `scratch/hero-premium/attachments/design-01-protagonist-crop-x2.png` (le personnage : référence de
**dessin**) ; **image 2** = `scratch/hero-premium/attachments/quality-dockworker-x2-v2-front-side-back-x6-neutral.png` (référence de
**proportions, de format des vues et de qualité**). Rien d'autre : une planche jointe ajouterait des personnages à ne pas copier.
Télécharger le résultat en PNG (bouton de téléchargement, pas copier-coller), et dire l'outil, la date et le prompt effectivement utilisé.

```text
Create a character turnaround sheet of the character in image 1, for Cité du Tournoi — Merchant District at Night: the game's protagonist,
a young adventurer. Same character design as image 1: brown spiky hair with locks over the forehead, readable eyes, calm determined
expression; an indigo-blue hooded cloak with a frayed hem, a subtle gold pattern and a round brass clasp at the collar; an ecru linen shirt,
a brown leather vest, a belt with a brass buckle, belt pouches and a small purse, a shoulder strap; leather gloves with cuffs; baggy grey-brown
trousers; tall leather boots with turned-down cuffs. Same colours.

Body proportions of image 2 (our common NPC base), not those of image 1:
* about 3 heads tall: the head, hair included, is one third of the total height (top of the hair to the soles);
* a large head, about 0.35 of the total height wide, with big readable eyes like image 2;
* shoulders with the sleeves about 0.40 of the height wide; short sturdy legs and boots; large readable hands;
* stylised RPG proportions, not realistic or slender.
Do not copy image 2's clothes, cap, face or pose: it is only the proportion, view-format and quality reference.

Views, all of the SAME character at the SAME scale, side by side on ONE row, all feet on the SAME ground line, generous empty space between
the views:
1. front view, standing idle;
2. back view, standing idle;
3. side view (profile, facing left), standing idle;
4. side view (facing left), running: contact pose, legs spread in a long running stride, front heel touching the ground;
5. side view (facing left), running: passing pose, the supporting leg under the body, the other knee raised.
The cloak, hair and straps must be consistent between the views; both feet fully visible in every view.

Technique and composition:
* high-quality illustrative pixel art at the quality of image 2: controlled colour ramps, selective dark outlines, clean pixel clusters,
  convincing fabric folds and soft directional shading; no dithering, no scattered noise, no mechanical stripes, no pillow shading;
* one amber accent family only (brass, gold pattern); hair, leather and skin stay muted;
* plain, flat, uniform neutral grey background; no gradient, no vignette, no floor, no cast shadow;
* no text, labels, numbers, frames, UI or watermark.
```

## 6. Méthode, après réception (celle des PNJ, journal Passes 4A-quindecies à 4A-tervicies)
1. Archiver la source **à l'octet** dans `reference/sources/` avec sa fiche `.source.json` (provenance déclarée par l'opérateur, citée mot
   pour mot ; un manifeste C2PA éventuel décrit ; droits ; rien d'inventé), avant tout travail ; `art:validate` contrôle ses octets.
2. Mesurer la source (hauteur des figures, pas des blocs, fond, lignes des pieds, proportions contre la base commune).
3. Script de rig `rigs/hero-x2-v1.rig.mjs` : vues face / dos / profil reconstruites ×2 (`build-character.mjs`), palette commune, repos et
   course de profil sur les clés 4-5, face / dos sur la même foulée ; recette rejouable (`--check`).
4. Contrôles : `checkBakedSheet`, `stride.mjs` (≈ 9 texels par image), Character Lab, scène A-D à côté de la distribution (densité, hauteur
   monde), `foot-slip.mjs` et `flipbook.mjs` en mouvement, `perf.mjs`.
5. Critique à l'aveugle par un agent neuf (étiquettes tirées au sort, clé hors de son champ ; auto-critique écrite avant le verdict) ; au plus
   deux retouches ciblées, chacune recritiquée.
6. Paquet de provenance, manifeste `approved: false`, `runtimeUse: "lab"` ; captures à l'opérateur ; **arrêt pour sa décision**. La
   production et tout statut de Gold Master sont les siens.

## 7. Critères d'acceptation
- Critique aveugle au moins égale à `dockworker-x2-v2` sur chaque axe (silhouette, proportions, visage, mains, matières, palette, contours).
- Fidèle au design 01 (opérateur) ; proportions dans la base commune.
- En mouvement : glissement du pied d'appui ≈ 0 à 2,5 m/s en B / C / D ; aucun appel de dessin en plus ; rendu identique quelle que soit la
  taille de l'atlas.

## 8. Risques
- Une planche générée peut changer de personnage d'une vue à l'autre (cape, coiffure, sangles) : contrôle à la réception, régénération
  décidée par l'opérateur.
- La cape dépasse en largeur et flotte : en course, elle déborde du cadre 64 × 96 ; au besoin un pas de rééchantillonnage plus grossier
  (comme le garde, Passe 4A-duodevicies), présenté à l'échelle commune.
- Caméra A (≈ 0,5-1,6 px écran par texel) : motif doré et fermoir d'un texel (point de QA).
