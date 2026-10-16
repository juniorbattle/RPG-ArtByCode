# Deuxième PNJ original — la marchande : brief validé (2026-10-16)

**Statut : BRIEF VALIDÉ par l'opérateur (2026-10-16) ; production NON commencée.** On attend le PNG original de la marchande, que
l'opérateur fournira. Rien n'est généré, reconstruit ni dessiné ; aucun fichier d'art. Historique : proposition du 2026-10-16 (Passe
4A-terdecies, commit `2bc05a6`), décisions de l'opérateur le même jour (Passe 4A-quattuordecies, `JOURNAL.md`).

## 1. Décisions de l'opérateur (2026-10-16)
1. **Archétype : marchande adulte** du Merchant District. Pourquoi elle (proposition) : le rôle existe à l'étal du héros (comparaison au
   même endroit) et sa silhouette contraste au maximum avec celle du docker.
2. **Source : une seule figure originale**, entière, vue de face ; pas une planche de personnages.
3. **Prompt : le nouveau prompt de génération artistique de l'opérateur** (§ 6). Il remplace l'ébauche de la proposition. L'opérateur le
   fournit avec les images approuvées.
4. **Hauteur monde : 1,66 m pour commencer**, indépendamment de la densité 64 × 96 (la hauteur est une échelle de présentation par
   instance, pas une propriété de la texture ; c'est aussi la hauteur de la marchande générée, `HEIGHT.merchant`).
5. **Niveau de qualité : `dockworker-x2-v1`** ; référence stylistique : la planche PNJ 01-16 ; **aucun personnage existant n'est
   reproduit**.

**Correction de méthode (opérateur)** : ne pas forcer la génération initiale à respecter une grille de pixels parfaite si cela détériore
le modelé, les expressions et les matières. E2 a montré que la reconstruction ×2 peut préserver une illustration pixel art riche, et
qu'un nettoyage trop strict peut dégrader la qualité. **La grille 64 × 96, la rangée des pieds 90 et les marges transparentes sont des
contraintes de l'asset reconstruit, pas des exigences absolues pour l'illustration source.** (Elle remplace la règle de la proposition
« une source sans grille propre est régénérée, pas réparée ».)

## 2. Brief

**La figure** (d'après le prompt de l'opérateur, § 6) :
- Une femme adulte d'environ 35 à 40 ans, marchande d'un marché de canal (fantasy médiévale). Identité professionnelle, tenue modeste
  avec de la personnalité ; ni noble, ni aventurière.
- Proportions RPG stylisées, environ 3 à 3,5 têtes (v1 : ≈ 3,2). Silhouette élégante mais pratique, aux volumes naturels.
- Visage expressif et construit : yeux lisibles, sourcils discrets, petit nez, bouche fermée, expression retenue.
- Cheveux bruns relevés en chignon visible, quelques mèches dessinées une à une autour du visage.
- Vêtements : robe indigo / bleu ardoise, tablier de lin ivoire désaturé par-dessus, châle bleu-gris sourd sur les épaules ;
  **un seul** accent ambré, retenu (boucle de ceinture ou petit galon).
- Petite bourse de cuir tenue contre le tablier ; mains bien lisibles ; bottines de cuir.
- Pose : au repos, de face, neutre et réutilisable, bras naturels. Les deux bottines entièrement visibles, pieds sur la même ligne de sol.
- Cadrage : figure centrée, marges vides généreuses, fond neutre uni (pour l'extraction). Ni décor, ni objet hors de la bourse, ni ombre
  portée, ni effet de lumière, ni texte.
- Direction artistique verrouillée (`AGENTS.md`) : nuit dominée par l'indigo et l'ardoise, pierre froide en second, l'ambre comme seul
  accent chaud, l'ivoire désaturé pour les toiles et les hautes lumières.

**L'illustration source** : une image artistique de haute qualité, sans exigence de grille de pixels. Son modelé, ses expressions et ses
matières priment.

**L'asset reconstruit** (contraintes du chargeur, `checkBakedSheet`) :
- cadre 64 × 96 (densité ×2), pieds sur la rangée 90, figure d'au plus ≈ 88 texels de haut ;
- un anneau transparent d'un texel autour du cadre, alpha binaire ;
- hauteur monde de 1,66 m par l'échelle d'instance : `bakedscale` = 1,66 / (hauteur de la figure en texels × 0,0235 m).

## 3. Méthode, après réception du PNG (liste de l'opérateur)
1. **Conserver la source sans transformation.** Le PNG original tel que livré (téléchargé, pas copié-collé : un éventuel manifeste C2PA
   est conservé) est archivé à l'octet dans `reference/sources/`, avec sa fiche `.source.json`, avant tout travail ; `npm run
   art:validate` contrôle ensuite ses octets.
2. **Documenter la provenance.** La déclaration de l'opérateur est citée mot pour mot : outil, date, prompt effectivement utilisé,
   images jointes. Un manifeste C2PA éventuel est lu et décrit (présence, émetteur, générateur) ; sa signature ne se valide qu'avec
   `c2patool`, à installer seulement sur autorisation. Rien n'est inventé.
3. **Mesurer la source.** La mesure sert à régler la reconstruction, pas à refuser la source. On mesure la hauteur de la figure en
   pixels source, le pas des blocs s'il y en a, l'uniformité du fond et la ligne des pieds.
   - Une source sans grille régulière se reconstruit (comme en E2) ; ce n'est pas une raison de la régénérer.
   - Une régénération ne se décide que sur l'art lui-même (dessin, proportions, style), par l'opérateur.
4. **Reconstruire en ×2** avec `tools/art-lab/reconstruct-grid.mjs` : pleine couleur, puis 64 couleurs comme v1 (nombre à confirmer
   par la comparaison). Cadre 64 × 96, pieds sur la rangée 90. Les paramètres (recadrage, pas, phase) sont consignés et la chaîne se
   rejoue (`verify-provenance --rebuild`).
5. **Comparer visuellement avec `dockworker-x2-v1`.** Côte à côte, à même densité et même hauteur monde, à ×1 et agrandi au plus proche
   voisin, puis en scène.
6. **Au plus deux itérations Aseprite ciblées.** Seulement sur des défauts **nommés et localisés**, sans repeindre les volumes (leçons
   4A-quater et 4A-sexies). Les opérations sont enregistrées et rejouables (`replay-pixel-ops.mjs`). Une retouche qui ne gagne pas à
   l'aveugle est annulée.
7. **Valider dans Character Lab et dans le Merchant District.**
   - Character Lab : `character-lab.html`, `__lab.selfTest()`.
   - Merchant District : caméras A / B / C / D par le chemin partagé (`?baked=`), à 1,66 m, à côté de la marchande générée de l'étal
     et du héros.
   - Environnement, effets, caméras et reveal intacts.
8. **Mesurer stabilité et performances par le renderer partagé.**
   - Stabilité : marche `tools/art-lab/dynwalk.mjs` (pas fixe, horloge figée, contrôles négatifs), avec v1 comme témoin.
   - Performances : `tools/perf.mjs` entrelacé, et aucun appel de dessin en plus.
9. **Critique indépendante.** Un agent neuf juge à l'aveugle (étiquettes tirées au sort, clé hors de son champ), contre v1 et contre la
   source ; mon auto-critique est écrite avant de lire son verdict.
10. Paquet de provenance, manifeste (`approved: false`, `runtimeUse: "lab"`), preuves et journal ; puis arrêt pour la décision de
    l'opérateur.

## 4. Critères d'acceptation
- **Critique aveugle** : au moins égale à v1 sur chaque axe (silhouette, proportions, visage, mains, matières, palette, contours). Le
  modelé, l'expression et les matières de la source sont préservés.
- **Originalité** : aucun personnage des trois planches n'est reproduit. Vérification côte à côte avec la planche 01-16 n° 02 « Merchant
  (Female) », la planche complémentaire n° 03 « Spice Merchant » et n° 12 « Flower Seller », et la planche 17-24 n° 20 « Elegant Buyer ».
- **Rendu** : invariant de cadre accepté par le chargeur ; rendu identique quelle que soit la taille de l'atlas (adressage entier) ;
  aucun appel de dessin en plus.
- **Stabilité en mouvement** : dans la plage de v1 (churn médian par cadrage). La caméra A (≈ 1 px écran par texel) reste un point
  de QA.
- **Reproductibilité** : la chaîne se rejoue depuis la source archivée.

## 5. Hors périmètre et risques
**Hors périmètre** (opérateur) :
- aucune production de roster ;
- aucune nouvelle orientation ni animation ;
- aucun remplacement de la marchande existante ;
- `runtimeUse: "lab"` jusqu'à validation explicite ;
- pas de fusion de la branche dans `main` avant que la tâche artistique soit terminée et acceptée.

Remplacer la marchande du jeu (interactive, tournée vers le joueur) demanderait le repos dans trois orientations et la parole
(amendement B) : ce serait un contrat ultérieur.

**Risques** :
- **Grand facteur de réduction.** Une figure seule fera probablement de l'ordre de 1 000 px de haut dans la source (à mesurer à la
  livraison), soit ≈ 10-15 px source par texel (contre 1,775 pour v1). `reconstruct-grid.mjs` prend la médiane de 9 points dans la moitié centrale de chaque case. Validée sur
  des blocs de ≈ 3,5 px, cette méthode doit être mesurée sur cette source (comparaison avec une moyenne par case avant de choisir) :
  détail amolli ou moucheté possible. Une option de l'outil est de l'outillage de développement, pas du runtime.
- **Nettoyage trop strict** qui aplatit le modelé (4A-quater, 4A-sexies) : finition limitée aux défauts nommés.
- **Extraction** : un fond non uniforme ou des bords adoucis (cheveux, châle) compliquent l'alpha binaire. Le prompt demande un fond
  uni ; l'anneau transparent est contrôlé.
- **Pieds** : un ourlet qui masque la ligne des pieds, ou des bottines mal lisibles (contrôle de la rangée 90).
- **Scintillement en caméra A** : la bourse, la boucle ambrée et les mèches d'un texel (point de QA).
- **Dérive de style** face à v1 et au cast : critique aveugle et comparaison en scène.
- **Hauteur** : 1,66 m est un point de départ (« commencer à ») ; elle s'ajuste par l'échelle d'instance, sans toucher aux pixels.

## 6. Prompt de génération (opérateur, 2026-10-16 ; remplace l'ébauche)
Fourni par l'opérateur avec ses décisions ; le texte ci-dessous est cité tel quel. Le prompt effectivement utilisé et les images jointes à
la génération seront consignés tels que l'opérateur les déclarera à la livraison du PNG. L'ébauche précédente reste dans l'historique
Git (commit `2bc05a6`).

Pièces jointes préparées à la demande de l'opérateur (2026-10-16) : `dockworker-x2-v1` agrandi ×8 au plus proche voisin, sur fond
transparent ou sur gris neutre uni, dans `art-lab/characters/scratch/npc2-merchant/attachments/` (non versionnées ; empreintes et
paramètres au journal, Passe 4A-quattuordecies).

```text
Create an original, premium-quality pixel-art character reference for Cité du Tournoi — Merchant District at Night.
Character: An adult female merchant, approximately 35–40 years old, working at a medieval fantasy canal-side market.
Artistic target: Match the visual language and craftsmanship of our approved Merchant District NPC reference sheets, especially the quality established by our `dockworker-x2-v1` character. This is a standard NPC, but she must still look carefully designed, expressive, and artistically polished.
Character design:

* Stylized fantasy RPG proportions, approximately 3–3.5 heads tall.
* Elegant but practical silhouette, with natural body volumes.
* Expressive, carefully constructed face: readable eyes, subtle brows, small nose, restrained closed-mouth expression.
* Brown hair gathered into a visible bun, with a few individually designed locks framing the face.
* An indigo/slate-blue dress, layered with a desaturated ivory linen apron.
* A muted blue-grey shawl over the shoulders.
* One restrained warm amber accent on a belt buckle or small piece of decorative trim.
* Small leather coin purse held close to the apron.
* Clearly readable hands and leather ankle boots.
* Professional merchant identity, modest clothing with personality, not a noblewoman or adventurer.

Pixel-art craftsmanship:

* Rich illustrative pixel art with carefully orchestrated detail.
* Organic yet readable silhouette.
* Convincing fabric folds, clothing volume, layered materials, and soft directional form shading.
* Beautifully controlled colour ramps and selective dark outlines.
* Carefully composed pixel clusters, preserving subtle tonal nuances.
* Facial and material detail comparable to a high-quality hand-crafted fantasy RPG character sprite.
* Avoid mechanical stripes, flat clothing, pillow shading, excessive dithering, or randomly scattered noise.
* Do not reduce the visual quality to simplified generic chibi sprite art.
* Preserve the slightly painterly, refined pixel-art character of our approved reference.

Composition:

* Exactly ONE original character.
* Full body, standing idle, directly facing the viewer.
* Neutral, reusable stance, arms naturally positioned.
* Both boots fully visible, feet aligned to the same ground baseline.
* Character centred with generous empty margins.
* Plain, uniform neutral background suitable for later extraction.
* No environment, no props outside the held purse, no cast shadow, no lighting effects around the figure.
* No text, labels, frames, UI, or watermark.

Technical intention:
This is a high-quality artistic SOURCE image, not the final 64×96 runtime sprite.
It will later be reconstructed onto a 64×96 logical pixel grid, so prioritize excellent original character design, expressive facial construction, material shading, coherent proportions, and preservation of artistic volumes.
The final character must feel like a natural member of our premium HD-2D Merchant District, while retaining enough visual sophistication to increase the game's perceived production value.
Create an original design, not a reproduction of any existing character.
```
