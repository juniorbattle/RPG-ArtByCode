# Héros premium — le protagoniste cuit : brief (2026-10-18)

**Statut : BRIEF, décisions de base prises par l'opérateur (2026-10-18) ; casting 1 reçu et tranché (§ 9) ; on attend la planche
individuelle (PNG d'origine) que l'opérateur génère avec le prompt v2 du § 5.** Aucun asset produit, aucun manifeste. Troisième point des
priorités de l'opérateur (journal, Passe M5) ; casting : journal, Passe H1.

## 1. Décisions de l'opérateur (2026-10-18)
1. **Base de dessin : « 01. Protagonist — Young Adventurer »** de la planche complémentaire de 14 personnages
   (`reference/sources/merchant-district-night-npc-character-reference-sheet.webp`, classée par l'opérateur le 16/10 « C, complémentaire :
   utile pour les personnages clés »). Réponse, mot pour mot : « 01 Protagonist (Recommandé) ».
2. **Vitesse : une foulée de course**, la vitesse de jeu ne change pas (2,5 m/s, × 1,7 avec Maj). Réponse, mot pour mot : « Foulée de
   course (Recommandé) ».
3. **Casting 1** (2026-10-18, § 9) : trois planches de personnages livrées par l'opérateur, traitées comme **propositions de casting, non
   canoniques** (sa note : un design est validé avant toute reconstruction, orientation ou animation ; le protagoniste d'abord, qui servira
   de référence de proportions et de qualité aux autres personnages clés). Réponses, mot pour mot : design du protagoniste « Planche 1
   (Recommandé) » ; pantalon « Foncé (Recommandé) » ; archivage des trois planches « Oui, à l'octet (Recommandé) ».

## 2. Pourquoi une nouvelle planche
- La planche complémentaire ne montre le protagoniste que sous **une** vue (trois-quarts). Une marche demande face, dos et profil à la
  même échelle, pris sur une planche multi-vues, jamais inventés depuis une seule vue (« Principes à garder », Personnages). Les PNJ de la
  distribution viennent des planches 01-16 et 17-24 (4 à 6 vues par personnage), découpées par leurs scripts de rig.
- La source n'est ni dessinée ni générée ici : l'opérateur la génère, comme les précédentes, et la livre **en fichier d'origine**.

## 3. Brief
**La figure** (d'après la vue 01 de la planche complémentaire, `scratch/hero-premium/attachments/design-01-protagonist-crop-x2.png`,
puis le casting 1, planche 1, retenu par l'opérateur : `scratch/hero-premium/attachments/casting1-p1-protagonist-views-x2.png`, § 9) :
- Un jeune aventurier, protagoniste ; cheveux bruns en épis, mèches sur le front ; yeux lisibles, expression calme et décidée.
- Cape bleu indigo à capuche rabattue, descendant sous le genou, bord effiloché ; petits points dorés aux épaules et motif brodé or le long
  de l'ourlet, le même devant et dos ; fermoir rond en laiton à l'encolure.
- Chemise lin écru, gilet / plastron de cuir brun, ceinture à boucle de laiton, sacoches et bourse à la ceinture, bandoulière.
- Gants de cuir à manchettes, pantalon gris-brun **foncé** bouffant dans toutes les vues, course comprise (opérateur, casting 1), bottes de
  cuir hautes à revers.
- Direction artistique verrouillée (`AGENTS.md`) : indigo / ardoise dominants, l'ambre (laiton, motif doré) comme seul accent chaud,
  l'ivoire désaturé pour le lin et les hautes lumières.

**Proportions** : celles de la base commune des PNJ (docker, Passe 4A-quindecies : tête cheveux compris ≈ 0,33 de la hauteur, largeur de tête
≈ 0,35, épaules ≈ 0,40, largeur maximale ≈ 0,45-0,48 hors cape). La vue 01 est un peu plus élancée (tête ≈ 0,29 de la hauteur, mesure
approximative sur la planche) : le prompt v1 demandait la base commune, à corriger par l'opérateur s'il veut un héros plus grand de silhouette.
**Casting 1 (§ 9)** : la planche 1 retenue a une tête ≈ 0,31 de la hauteur, dans la plage de la distribution mesurée de la même façon sur sa
planche source (docker 0,31, voyageur 0,34 ; réglette, ± 0,015 ; le 0,33 ci-dessus est mesuré sur l'export du docker) : le prompt v2 garde
les proportions de la planche 1 au lieu d'imposer un chiffre.
Hauteur monde : 1,78 m (`HEIGHT.player`), réglée par l'échelle d'instance.

**Vues demandées, même personnage, même échelle, même ligne de sol** : face (repos), dos (repos), profil (repos), et deux poses de course de
profil (contact jambes écartées ; passage, jambe d'appui sous le corps). Les poses de course servent de clés au script de rig : la foulée
doit être longue (§ 4). Prompt v2 : profils tournés **vers la droite**, comme la course du casting jointe (v1 : vers la gauche) ; le rig se
règle sur le sens mesuré sur la planche, avant tout miroir.

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

## 5. Prompt de la planche individuelle, v2 (à coller ; images jointes dans cet ordre)
Le prompt v1 (planche multi-vues d'après la seule vue 01, avec le docker en référence de proportions) n'a pas servi : le casting 1 (§ 9)
est venu d'un autre prompt, non déclaré. Le v1 reste dans l'historique git de ce fichier. Le v2 part du design retenu par l'opérateur.

Images à joindre : **image 1** = `scratch/hero-premium/attachments/casting1-p1-protagonist-views-x2.png` (les 6 vues de repos du
protagoniste, casting 1, planche 1, sans texte) ; **image 2** = `scratch/hero-premium/attachments/casting1-p1-run-x2.png` (ses 5 images de
course). Rien d'autre : le docker n'est plus joint (les proportions de l'image 1 sont déjà dans la plage de la distribution), et une planche
entière ajouterait des personnages à ne pas copier. Les deux images se refont depuis la planche archivée (§ 9).
Télécharger le résultat en PNG (bouton de téléchargement, pas copier-coller), et dire l'outil, la date et le prompt effectivement utilisé.

```text
Create a character turnaround sheet of ONE character: the protagonist shown in images 1 and 2, for Cité du Tournoi — Merchant District
at Night (HD-2D pixel art). Images 1 and 2 are our own casting references of this character: keep his design, colours and proportions;
this sheet makes him consistent across the views and more refined.

The character, identical in every view:
* a young male adventurer; brown spiky hair with locks over the forehead; readable dark eyes, calm determined expression;
* an indigo-blue hooded cloak, hood down, reaching below the knees, with a frayed hem; small gold dots on the shoulders and a gold
  embroidered motif along the hem, the same at the front and at the back; a round brass clasp at the collar;
* an ecru linen shirt, a brown leather vest and harness, a belt with a brass buckle, belt pouches and a small purse;
* brown leather gloves with cuffs;
* DARK grey-brown baggy trousers, the same dark colour in every view, including the running poses (image 2 shows them lighter: draw
  them dark);
* tall brown leather boots with turned-down cuffs.
Proportions exactly as in image 1: the head, hair included, about one third of the total height; stylised RPG proportions.

Views, all of the SAME character at the SAME scale, side by side on ONE row, all feet on the SAME ground line, generous empty space
between the views:
1. front view, standing idle;
2. back view, standing idle;
3. side view facing right, standing idle: a true profile, not a three-quarter view;
4. side view facing right, running: contact pose, legs spread in a long running stride, the front heel touching the ground, the cloak
   flowing behind as in image 2;
5. side view facing right, running: passing pose, the supporting leg under the body, the other knee raised.
The cloak, hair, straps and pouches must be consistent between the views; both feet fully visible in every view.

Technique and composition:
* premium illustrative pixel art, more refined than ordinary NPCs: a carefully constructed face, readable hands, convincing fabric
  folds, soft directional shading, controlled colour ramps, selective dark outlines;
* crisp square pixels of one uniform size across the whole sheet: no blur, no mixed pixel sizes, no dithering, no scattered noise, no
  mechanical stripes, no pillow shading;
* one amber accent family only (brass, gold embroidery); hair, leather and skin stay muted;
* plain, flat, uniform neutral grey background (not dark blue); no gradient, no vignette, no floor, no cast shadow;
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
- Fidèle au design retenu (casting 1, planche 1, opérateur) ; proportions de la planche 1, dans la plage de la distribution.
- En mouvement : glissement du pied d'appui ≈ 0 à 2,5 m/s en B / C / D ; aucun appel de dessin en plus ; rendu identique quelle que soit la
  taille de l'atlas.

## 8. Risques
- Une planche générée peut changer de personnage d'une vue à l'autre (cape, coiffure, sangles) : contrôle à la réception, régénération
  décidée par l'opérateur.
- La cape dépasse en largeur et flotte : en course, elle déborde du cadre 64 × 96 ; au besoin un pas de rééchantillonnage plus grossier
  (comme le garde, Passe 4A-duodevicies), présenté à l'échelle commune.
- Caméra A (≈ 0,5-1,6 px écran par texel) : motif doré et fermoir d'un texel (point de QA).
- Les planches du casting 1 sont des copies collées (WebP avec perte, fond bleu nuit proche de la cape indigo) : les pièces jointes du v2
  en héritent. La planche individuelle doit venir en PNG d'origine sur fond gris neutre (un fond proche de la cape la fait découper par le
  remplissage du fond, cf. `reconstruct-grid --bg-threshold`).

## 9. Casting 1 (2026-10-18) : trois planches, propositions non canoniques
**Reçu** : trois planches collées par l'opérateur dans la séance (WebP 1447 × 1087, avec perte), avec sa note : ce sont des références de
casting, pas des feuilles de production ; le protagoniste issu du « 01. Young Adventurer » se développe dans une planche individuelle
détaillée ; combattants du tournoi et personnages narratifs auront une finition supérieure aux PNJ ordinaires ; aucun ne devient canonique
sans validation de son design, avant toute reconstruction. Archivées à l'octet (décision de l'opérateur, § 1.3), chacune avec sa fiche :
- `reference/sources/tournament-roster-casting-2026-10-18-a.webp` : planche 1, « Main Characters & Tournament Roster », 19 entrées ;
- `reference/sources/tournament-roster-casting-2026-10-18-b.webp` : planche 2, seconde version de la même ;
- `reference/sources/main-characters-casting-2026-10-18.webp` : planche 3, « Personnages Principaux », 13 entrées (« 07 » en double, pas de
  « 10 »).
Provenance non déclarée (outil, date et prompt inconnus) : rien d'inventé dans les fiches.

**Le protagoniste, mesuré** (vue de face, réglette, ± 0,015 ; planches de revue non versionnées dans `scratch/hero-premium/casting-1/`) :

| Planche | Vues de repos | Course | Hauteur | Tête / hauteur | Constat |
|---|---|---|---|---|---|
| 1, « Young Adventurer » | 6 : face, deux 3/4 face, deux 3/4 dos, dos ; pas de vrai profil | 5 images, vers la droite | ≈ 146-148 px | 0,31 | fidèle au 01 d'origine ; pantalon foncé au repos, clair en course |
| 2 | 6, les mêmes | 5 images, vers la droite | ≈ 145 px | 0,32 | même design, expression fermée ; même écart de pantalon |
| 3, « Héros » | 4 : 3/4 face, presque profil, dos (grande fleur de lys), profil | 5 images, vers la droite ; jambes confuses aux images 3-4 | ≈ 136-141 px | 0,35 | variante chevaleresque : cape courte, spalière, tunique sombre ; en « 01b », la cape rouge devient grise dans la 4e vue |

Même lecture sur la planche source de la distribution : docker 0,31, voyageur 0,34 (≈ 155 px chacun ; les vues des PNJ y font 153 à
174 px). Les trois protagonistes sont dans la famille de proportions de la distribution ; le pas de reconstruction se règlera sur la planche
individuelle, comme pour chaque PNJ (1,775 à 2,0). Aucune grille de pixels régulière n'est sortie d'un spectre des gradients, mais la même
méthode n'en trouve pas non plus sur la planche 01-16 (pas connu : 1,775) : mesure non concluante.

**Ce que le v2 demande en plus de la planche 1** : un vrai profil au repos, le pantalon d'une seule couleur (foncé), le motif de la cape
cohérent devant et dos, un fond gris neutre, des pixels nets d'une seule taille.

**Le reste des trois planches** (tenues alternatives du protagoniste, combattants, personnages narratifs, PNJ importants) : propositions de
casting, non canoniques ; aucune production avant que l'opérateur valide leur design. Le protagoniste fini servira de référence de
proportions et de qualité.

**Originalité** : le v2 ne joint que le protagoniste lui-même. L'archétype (jeune aventurier, cheveux bruns en épis, cape bleue) est courant
dans le genre ; aucun personnage existant précis n'a été reconnu, sans vérification exhaustive des droits.
