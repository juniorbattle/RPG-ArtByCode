# Deuxième PNJ original — la marchande : brief validé (2026-10-16)

**Statut : BRIEF VALIDÉ par l'opérateur (2026-10-16). Première source (prompt V3) approuvée puis à RÉGÉNÉRER pour ses proportions
(§ 1, point 6) ; prompt V4 prêt (§ 6.4) ; on attend le nouveau PNG.** Le premier candidat `merchant-x2-v1` reste comme preuve (chaîne
complète, `runtimeUse: "lab"`). Historique : proposition du 2026-10-16 (Passe 4A-terdecies, commit `2bc05a6`), décisions de l'opérateur le
même jour (Passes 4A-quattuordecies et 4A-quindecies, `JOURNAL.md`).

## 1. Décisions de l'opérateur (2026-10-16)
1. **Archétype : marchande adulte** du Merchant District. Pourquoi elle (proposition) : le rôle existe à l'étal du héros (comparaison au
   même endroit) et sa silhouette contraste au maximum avec celle du docker.
2. **Source : une seule figure originale**, entière, vue de face ; pas une planche de personnages.
3. **Prompt : le nouveau prompt de génération artistique de l'opérateur** (§ 6). Il remplace l'ébauche de la proposition. L'opérateur le
   fournit avec les images approuvées.
4. **Hauteur monde : 1,66 m pour commencer**, indépendamment de la densité 64 × 96 (la hauteur est une échelle de présentation par
   instance, pas une propriété de la texture). **Correction (mesure du 2026-10-16)** : 1,66 m n'est que la valeur nominale
   `HEIGHT.merchant` de la marchande générée (ombre et bulle) ; sa figure **dessinée** mesure 1,88 m × 1,08 m (23 × 40 texels × 0,047 m).
5. **Niveau de qualité : `dockworker-x2-v1`** ; référence stylistique : la planche PNJ 01-16 ; **aucun personnage existant n'est
   reproduit**.
6. **Régénérer la source (opérateur, 2026-10-16)**, après comparaison en scène : « c'est surtout un problème de proportion ». La source V3
   est plus élancée que la base commune des PNJ, mesuré sur les sprites ×2 : tête (cheveux compris) 23 rangées sur 88 = 0,26 de la
   hauteur (≈ 3,8 têtes) contre 29 sur 89 = 0,33 (≈ 3,1 têtes) pour le docker ; largeur de tête 0,29 contre 0,35 ; épaules avec manches
   0,35 contre 0,40 ; largeur maximale 0,41 contre 0,48. La chaîne conserve exactement les proportions de la source (0,41 dans les deux) :
   la correction se fait à la source. Nouvelle génération : même personnage, proportions du docker (prompt V4, § 6.4).

**Correction de méthode (opérateur)** : ne pas forcer la génération initiale à respecter une grille de pixels parfaite si cela détériore
le modelé, les expressions et les matières. E2 a montré que la reconstruction ×2 peut préserver une illustration pixel art riche, et
qu'un nettoyage trop strict peut dégrader la qualité. **La grille 64 × 96, la rangée des pieds 90 et les marges transparentes sont des
contraintes de l'asset reconstruit, pas des exigences absolues pour l'illustration source.** (Elle remplace la règle de la proposition
« une source sans grille propre est régénérée, pas réparée ».)

## 2. Brief

**La figure** (d'après le prompt de l'opérateur, § 6) :
- Une femme adulte d'environ 35 à 40 ans, marchande d'un marché de canal (fantasy médiévale). Identité professionnelle, tenue modeste
  avec de la personnalité ; ni noble, ni aventurière.
- Proportions RPG stylisées, environ 3 à 3,5 têtes (docker v1 : ≈ 3,1, mesuré). Silhouette élégante mais pratique, aux volumes naturels.
  **Base commune (2026-10-16)** : les proportions du docker (§ 1, point 6), chiffrées dans le prompt V4.
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
  (Female) », n° 03 « Artisan (Female) » et n° 09 « Townswoman (Female) », la planche complémentaire n° 03 « Spice Merchant » et n° 12
  « Flower Seller », et la planche 17-24 n° 20 « Elegant Buyer ». La planche 01-16 n° 02 porte déjà la combinaison du brief (chignon brun,
  robe bleue, tablier ivoire, petite bourse ; plus coiffe blanche à volant, col blanc, manches bouffantes blanches), n° 03 le chignon, le
  tablier et la sacoche, n° 09 le fichu bleu clair sur les épaules et le tablier ivoire : c'est la comparaison décisive.
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

## 6. Prompts de génération (opérateur, 2026-10-16 ; remplacent l'ébauche)
Fournis par l'opérateur et cités tels quels : 6.1 avec ses décisions, 6.2 ensuite, écrit pour accompagner les images jointes. Le prompt
effectivement utilisé et les images jointes à la génération seront consignés tels que l'opérateur les déclarera à la livraison du PNG.
L'ébauche précédente reste dans l'historique Git (commit `2bc05a6`). Revue de 6.2 et ajouts proposés (non validés) : `JOURNAL.md`,
Passe 4A-quattuordecies.

Pièces jointes préparées à la demande de l'opérateur (2026-10-16) : `dockworker-x2-v1` agrandi ×8 au plus proche voisin, sur fond
transparent ou sur gris neutre uni, dans `art-lab/characters/scratch/npc2-merchant/attachments/` (non versionnées ; empreintes et
paramètres au journal, Passe 4A-quattuordecies).

### 6.1 Prompt artistique (fourni avec les décisions)

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

### 6.2 Prompt pour la génération avec images jointes (fourni ensuite)

```text
Use the attached reference images for style guidance only. Do not copy the attached character. Create a new original character.
Create an original premium-quality pixel-art character source image for Cité du Tournoi — Merchant District at Night.
Character
An adult female merchant, around 35–40 years old, working in a medieval fantasy canal-side market district.
Role and artistic intent
This is a standard NPC, not a key story character, but she must still feel artistically polished, expressive, and carefully designed.
She should match the overall visual quality and tone of the attached dockworker reference and Merchant District style references, while being clearly original.
Design requirements

* Full body, single character only
* Front-facing or very slightly turned, neutral standing pose
* Calm, readable expression
* Brown hair tied in a bun, with a few loose strands framing the face
* Indigo / slate-blue dress
* Desaturated ivory apron
* Muted blue-grey shawl over the shoulders
* Small leather coin purse or merchant pouch
* Leather ankle boots
* Modest, practical merchant outfit with personality
* She must read clearly as a market merchant, not a noble, adventurer, or guard

Visual quality target

* High-quality illustrative pixel art
* Carefully constructed face with readable eyes and subtle features
* Good clothing volume, fabric folds, layered materials
* Soft directional shading
* Controlled color ramps
* Clear silhouette
* Refined, premium look suited for an HD-2D fantasy RPG

Important constraints

* This must be an original character design
* Do not copy the dockworker’s pose, cap, clothing scheme, or identity
* Use the attached dockworker only as a quality benchmark
* The final image must remain simple enough to later reconstruct into a game sprite, but the source image itself should prioritize excellent artistic quality

Composition

* Plain neutral background
* No environment
* No UI
* No text
* No labels
* No watermark
* No shadow effects outside the figure
* Character centered with generous empty margins

Final goal
The result should feel like a natural citizen of the Merchant District, visually consistent with our world, but more refined and readable than a generic low-effort NPC.
```

### 6.3 Prompt V3, effectivement utilisé (déclaration de l'opérateur, 2026-10-16)

Réponse de l'opérateur : « V3 = le prompt v2 du brief (§ 6.2) suivi du bloc « Additional requirements » proposé au journal, sans autre
changement ». Images jointes : `dockworker-x2-v1-x8-neutral.png` seule (« Docker ×8 gris »). V3 = le texte du § 6.2, puis ce bloc :

```text
Additional requirements:
* Do not copy any character from the attached reference sheets, especially "02. Merchant (Female)", "03. Artisan (Female)" and "09. Townswoman (Female)": same world and quality, clearly different design; avoid their signature elements (white frilled cap or bonnet, white lace collar, puffed white sleeves).
* Adult proportions, approximately 3–3.5 heads tall; not chibi.
* One small warm amber accent only (belt buckle or trim); no other bright warm colour: hair, leather and skin stay muted.
* Clearly readable hands.
* Both boots fully visible, both feet on the same ground line.
* Background: one flat, uniform neutral colour; no gradient, no vignette, no floor, no cast shadow.
* Clean pixel clusters: no dithering, no scattered noise, no mechanical stripes, no pillow shading.
```

Résultat : la source approuvée `reference/sources/npc2-merchant-source-2026-10-16.png` (fiche `.source.json`). Elle s'écarte du brief
(tresse auburn au lieu du chignon, ni châle ni tablier, carnet d'inventaire) : l'opérateur l'a approuvée telle quelle.

### 6.4 Prompt V4 (proposé le 2026-10-16, à utiliser pour la régénération)

Images à joindre, dans cet ordre : **image 1** = la source approuvée V3 (`reference/sources/npc2-merchant-source-2026-10-16.png`, le PNG
d'origine) comme référence de **dessin** ; **image 2** = `dockworker-x2-v1-x8-neutral.png` comme référence de **proportions** et de
qualité. Rien d'autre : une planche jointe ajouterait des personnages à ne pas copier. Télécharger le résultat en PNG (bouton de
téléchargement, pas copier-coller).

```text
Redraw the attached merchant (image 1) as the same character, with the body proportions of the attached dockworker (image 2).

Keep from image 1 (the approved character design): an adult female merchant; auburn hair in a side braid with a small brass ring and a few loose strands framing the face; cream shirt with rolled sleeves; dark slate wrap vest with a diagonal leather strap and a small brass clasp; brown leather belt with a brass buckle; small leather belt pouch; an inventory ledger held against her side; slate-blue wrap skirt over a brown underskirt; brown leather ankle boots. Same colours, same calm expression, same props, same slightly turned standing pose.

Change only the proportions, to match image 2 (our common Merchant District NPC base):
* about 3 heads tall: the head, hair included, is one third of the total height (from the top of the hair to the soles);
* a large head: the head is about 0.35 of the total height wide, with big readable eyes like image 2;
* a sturdy build: shoulders with the sleeves about 0.40 of the total height wide; overall width with the arms about 0.45 to 0.48 of the height;
* short sturdy legs and boots, large readable hands, as in image 2;
* stylised RPG proportions, NOT realistic, elegant or slender proportions.

Do not copy the dockworker's clothes, cap, face or pose: image 2 is only the proportion and quality reference.

Composition and technique:
* exactly one character, full body, front view or very slightly turned, standing idle;
* both boots fully visible, both feet on the same ground line;
* a compact silhouette: no small gap of background between the jaw, the hair and the collar;
* plain, flat, uniform neutral grey background; no gradient, no vignette, no floor, no cast shadow; the character centred with generous empty margins;
* high-quality illustrative pixel art at the same quality as image 1: controlled colour ramps, clean pixel clusters, no dithering, no scattered noise, no mechanical stripes, no pillow shading;
* no text, labels, frames, UI or watermark.
```

Contrôle à la réception, avant toute reconstruction : mesurer sur la source la part de la tête (cible ≈ 0,33 de la hauteur), la largeur de
tête (≈ 0,35), les épaules (≈ 0,40) et la largeur maximale (≈ 0,45-0,48) ; conformité au dessin approuvé ; fond, pieds, poches de fond.
