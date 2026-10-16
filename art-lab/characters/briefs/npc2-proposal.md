# Deuxième PNJ original — proposition (2026-10-16)

**Statut : PROPOSITION, rien n'est commencé** (aucune génération, aucune reconstruction, aucun fichier d'art). Cadre validé par
l'opérateur : source artistique originale, archétype distinct du docker, qualité au moins égale à `dockworker-x2-v1`, reconstruction ×2,
finition Aseprite limitée aux défauts réels, critique indépendante, validation en scène. Premier essai : artisane ou marchande.

## 1. Archétype — recommandation : la marchande

| | Marchande (recommandée) | Artisane (alternative) |
|---|---|---|
| Rôle dans le jeu | existe déjà (`merchant`, à l'étal du héros, PNJ interactif, 1,66 m) : comparaison directe au même endroit | absent du quartier aujourd'hui : pas de place de comparaison |
| Contraste avec le docker | maximal : robe + tablier, fichu ou châle, cheveux longs contre pantalon + casquette | moindre : tablier de cuir, souvent pantalon |
| Ce que l'essai teste | ourlet, plis de tissu, main qui tient un objet, coiffure en volume | outils, cuir, lumière chaude de la forge |
| Références de style (guides, pas de copie) | planche PNJ 01-16 n° 02 « Merchant (Female) » ; planche complémentaire n° 03 « Spice merchant », n° 12 « Flower seller » ; planche 17-24 n° 20 « Elegant Buyer » (costume) | planche PNJ 01-16 n° 03 « Artisan (Female) » |

## 2. Brief (marchande)
- Adulte (30-45 ans), droite, **au repos, vue de face** (comme v1), bras détendus ; une main tient un petit objet lisible contre le
  tablier (bourse) ; rien qui déborde largement de la silhouette.
- Costume dans la direction artistique verrouillée : robe indigo / ardoise, tablier ivoire désaturé, châle ou fichu froid, **un seul
  accent ambré** (boucle de ceinture ou galon) ; cheveux bruns en chignon visible de face ; bottines visibles sous l'ourlet.
- Visage au niveau de v1 (yeux, bouche fermée, lecture nette) ; mains et bottines lisibles.
- Technique : cadre **64 × 96**, pieds sur la rangée **90**, figure d'au plus ~88 texels de haut, anneau transparent d'un texel, alpha
  binaire (contrôlés par le chargeur). Hauteur de présentation ≈ **1,66 m** (échelle par instance, pas une propriété de la texture).

## 3. Méthode de création de la nouvelle source
1. Prompt validé par l'opérateur (ébauche § 6) ; **l'opérateur génère avec ChatGPT et télécharge le PNG d'origine** (pas de copier-coller :
   on garde le fichier tel que fourni, avec son C2PA s'il en porte un).
2. Archivage à l'octet dans `reference/sources/` + fiche `.source.json` (provenance déclarée, droits, date), avant tout travail.
3. Mesure de la source avant acceptation : pas de grille, phase, hauteur de la figure en « pixels d'art » (cible ≈ 88) ; une source sans
   grille propre est régénérée, pas réparée.
4. Reconstruction ×2 (`tools/art-lab/reconstruct-grid.mjs`) : pleine puis 64 couleurs ; paramètres consignés.
5. Critique à l'aveugle (agent neuf, étiquettes tirées au sort, auto-critique écrite avant) contre v1, même grille qu'en 4A.
6. Finition Aseprite sur défauts **nommés et localisés**, au plus deux itérations, opérations enregistrées et rejouables.
7. Validation en scène A-D par le chemin partagé (`?baked=`), à côté de la marchande générée de l'étal, puis marche `dynwalk` ;
   environnement intact.
8. Paquet de provenance, manifeste (`runtimeUse: "lab"`), preuves, journal ; arrêt pour décision de l'opérateur.

## 4. Critères d'acceptation
- Critique aveugle : au moins égale à v1 sur chaque axe (silhouette, proportions, visage, mains, matières, palette, contours).
- Invariant de cadre accepté par le chargeur ; rendu identique quelle que soit la taille de l'atlas (adressage entier).
- Stabilité en mouvement dans la plage de v1 (churn médian par cadrage) ; caméra A (≈ 1,1 px / texel) suivie comme point de QA.
- Chaîne reproductible : `verify-provenance --rebuild` depuis la source archivée.

## 5. Hors périmètre et risques
- Hors périmètre : autres orientations et animations, remplacement de PNJ de production, roster, héros. Remplacer la marchande du jeu
  (interactive, tournée vers le joueur) exigerait repos × 3 orientations + parole (amendement B) : contrat ultérieur.
- Risques : génération sans grille de pixels régulière (anticrénelage, pixels inégaux) ; figure trop petite ou trop grande ; dérive de
  style face à v1 ; ourlet qui masque la ligne des pieds ; objet tenu dont les détails d'un texel scintillent en caméra A.

## 6. Ébauche de prompt (à valider, en anglais pour le générateur)
> Pixel-art character for the game "Cité du Tournoi", Merchant District at night, in the same style, palette logic and rendering as our
> "NPC SPRITE PRODUCTION REFERENCE — 16 GENERIC TOWNSFOLK" sheet. One single original character: an adult woman merchant of the market
> quay (30-45), front view only, standing idle, full body, arms relaxed, one hand holding a small coin purse against her apron. Indigo /
> slate dress, desaturated ivory apron, a cool grey-blue shawl, brown hair in a bun visible from the front, one small amber accent (belt
> buckle or trim), visible boots. Clear readable face (eyes, closed mouth), readable hands. Strict pixel art on a regular pixel grid: no
> anti-aliasing, no blur, no gradients, no glow, no drop shadow; crisp dark outline; limited palette. The character is about 88 art pixels
> tall, each art pixel drawn as an identical square block. Plain flat single-colour background, no text, no label, no frame, empty margin
> around the character.

## 7. Décisions demandées
1. Archétype : marchande (recommandée) ou artisane.
2. Source : une figure seule de face à grande échelle (recommandé : grille plus nette) ou une planche au format de la série.
3. Prompt : valider ou ajuster.
4. Hauteur de présentation : ≈ 1,66 m.
