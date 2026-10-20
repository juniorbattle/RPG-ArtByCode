# Journal de bord — archive : passes H9, R1, D3, H10, K6, K7, K8, Z1, Z2, Z3 et Z4 (2026-10-19)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-10-19 (Passe Y4) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe H9 — Héros : le visage de `hero-x2-v3` retouché au texel (yeux ouverts, bouche, ombre des joues ; décision H1) (2026-10-19)

### Demande
- Opérateur, mot pour mot : « je valide pour le moment, quel est la suite ? », puis « Commence par la retouche du visage du héros v3
  (décision H1). ». Décision de la fiche (Passe D1) : H1 « Retouches d'abord (visage, palette) ».
- « je valide pour le moment » est lu comme un accord sur l'état du moment, pas comme l'approbation du héros, du pivot de A ni du suivi
  `?camfollow=screen` (dit à l'opérateur dans la séance).
- Branche `hero-face-h9` depuis `main` (`b5b42a6`).

### Constat de départ — sur les pixels des vues préparées
- **Face** : sous les cils (rangée 24), la pupille ne fait qu'une rangée et l'iris de la rangée 26 est brun moyen : l'œil se lit mi-clos.
  Entre la frange et les cils, une bande claire (rangée 23) fait paupière. Pas de bouche ; la peau est d'un ton (rangées 27-31).
- **Trois-quarts face** : l'œil proche est bâti de même, l'œil lointain d'un seul texel sombre ; pas de bouche.
- **Profil** : l'œil est blanc (la sclère, colonne 27, rangées 25-26) et l'iris réduit à un texel brun : un œil vide.
- La planche v4-b dessine de grands yeux et une petite bouche. Au pas de 3,4, la bouche (environ 2 px de haut) se fond dans la peau.

### Fait — [OK] 31 texels enregistrés dans le rig (`FACE`, appliqué par `prepare`)
- **Face (20)** :
  - pupille sur deux rangées (25-26), reflet du côté intérieur, iris éclairé (ambre) sur la rangée 27 ;
  - bouche de deux texels sur la rangée 30 ;
  - ombre le long des joues et du menton.
- **Trois-quarts face (8)** : l'œil proche comme ceux de la face ; la pupille de l'œil lointain sur deux rangées ; la bouche sous le nez.
- **Profil (3)** : l'iris sombre à l'avant de l'œil (la sclère gardée derrière) ; la bouche au contour.
- Couleurs de la palette commune seulement. **La palette ne change pas** (64 couleurs, le même ensemble) : la course de profil y est
  projetée, et une couleur perdue l'aurait changée.
- Choix faits sur des planches de variantes (×8, ×3, ×2) :
  - la couleur de la bouche : #a37e71, contre #b28f80 et #976947 ;
  - une ombre des joues plutôt qu'une rougeur ;
  - quatre variantes de l'œil de profil et quatre du trois-quarts.

### Preuves
- **Reconstruction** : export reconstruit avec Aseprite ; `--check` : identique ; `verify-provenance` : intact ; `art:validate` : 0 erreur.
- **Seuls les texels du visage changent**, image par image contre l'export de la Passe H8 :
  - repos et course de face : 20 texels par image ; de trois-quarts face : 8 ; repos de profil : 3 ;
  - course de profil, dos et trois-quarts dos : 0 ;
  - table d'images et JSON identiques ; opacité inchangée.
- **En scène** : captures déterministes, graine 1842, `cast=candidate&views=5`, 120 pas, la facette du joueur fixée avant le rendu ; la branche
  contre `main` figé (:5187).
  - En B et en D, face, trois-quarts et profil : 12 à 48 px changent, tous dans la tête du héros.
  - Dos : 0 px. Témoin de répétition : 0 px.
- **Production** (sans `cast=candidate`, `vis=0`, 300 pas) : A / B / C / D **0 px** contre `main` figé (écart max 0).
- **Validation** : typecheck, `npm test` 87 / 87, build.
- **Paquet** :
  - `revisions` : la Passe H9, la demande citée, les anciennes empreintes des exports et des vues ;
  - statut et chaîne mis à jour ;
  - manifeste : note ;
  - revue : `reviews/hero-x2-v3/07-h9-face-before-after-x8.png` et `08-h9-in-scene-before-after-x5.png`.

### Critique à l'aveugle — [OK] le visage gagne nettement
- **Méthode** de la Passe H8 :
  - un agent neuf, l'avant et l'après sous des étiquettes tirées au sort (la clé hors du dossier des images) ;
  - les mêmes planches : têtes ×8, repos ×3, courses ×3, recadrages en scène ×5 ;
  - le docker approuvé en référence ; l'auto-critique écrite avant le verdict.
- Le critique trouve seul que les deux ne diffèrent que par le visage (course de profil : 0 px).
- **Visage : 7 contre 5** pour la retouche, confiance 80 % ; l'écart est net à ×8 et en D, faible en B.
  - Moyenne : 7,3 contre 7,0. Tout l'écart vient du visage ; le reste est identique par construction.
  - Ce qu'il voit : des yeux ouverts (pupille, reflet, iris ambré) et une petite bouche, en B et en D, dans les trois facettes. Avant : des
    yeux fermés ou baissés sur un ovale vide.
- **Relevés, vérifiés sur les pixels** :
  - « les deux yeux de face sont construits différemment » : **faux**. Ils sont en miroir l'un de l'autre (pupille contre la sclère, reflet
    de l'autre côté) ;
  - « la pupille lointaine du trois-quarts sur le contour, qui peut se lire comme une encoche » : elle est à un texel du contour (colonne 25 ;
    peau en 24, contour en 23). C'est plausible à la taille du jeu : à juger en jeu ;
  - la bouche est grisâtre : « une tache » en B, où elle fait 2 à 4 px d'écran ;
  - les pupilles contrastées donnent un regard un peu fixe (un avis) ;
  - la peau reste plate : l'ombre est presque du ton de base, sans ombre sous la frange ;
  - l'œil du repos de profil diffère de celui de la course, qui vient de la planche v3. C'était déjà le cas avant (un œil blanc contre une
    rangée sombre).
- **Mon choix** : la retouche reste, puisqu'elle gagne nettement sur le point visé sans rien perdre ailleurs. Aucune retouche n'est empilée
  sans nouvelle critique : la couleur de la bouche et la pupille lointaine se jugent en jeu.

### Restes [?]
- La revue de l'opérateur en jeu : `npm run dev`, puis `?cast=candidate&views=5`. Rien n'est approuvé.
- Le volet « palette » de H1 n'est pas traité ici. Le critique donne 8 aux deux en palette.
- La course de profil garde le visage de la planche v3.
- Relevés communs, non traités : la course de face « sur place » (les jambes alternent peu), des mouchetures gris-bleu autour des mèches.

### Pensée
- Une retouche au texel d'une vue reconstruite se pose sur la vue préparée, s'enregistre dans le rig et reste dans la palette commune. Quand
  un autre cycle est projeté sur cette palette, on vérifie que l'ensemble des couleurs ne change pas.
- Un relevé de critique se vérifie sur les pixels avant d'être corrigé : ici, un relevé sur six était faux (les yeux en miroir).

## Passe R1 — Fiche de revue du district (jalon M1) publiée : onze décisions en attente (2026-10-19)

### Demande
- Opérateur, mot pour mot : « Okay interessant, quel est la suite ^ », puis « Prépare la fiche de revue (jalon M1) avec les décisions en
  attente. ». Décision M1 de l'opérateur (Passe D1) : « Appliquer, puis revue ».
- « Okay interessant » n'est pas pris pour une approbation.
- Branche `review-sheet-r1` depuis `main` (`6ca81e0`).

### Fait — [OK]
- **Page privée** : https://claude.ai/artifact/6URUh6P2VKXNxwCQq1RMsA.
  - Les choix sont enregistrés dans la collection `decisions`, qui est vide à la publication (relue).
  - La page et sa logique sont celles de la première fiche (Passe G1) ; le récapitulatif peut aussi se copier.
- **En tête** : comment revoir en jeu (`npm run dev`), avec trois adresses :
  - tout ensemble : `?cast=candidate&views=5&camfollow=screen&camA=,,,,,5.8,,` ;
  - le héros seul ;
  - le jeu tel qu'il est.
- **Onze décisions**, chacune avec son contexte, ses preuves, ma recommandation et ses options :
  - héros : RH1 le héros v3 en production ; RH2 les cinq vues par défaut ; RH3 le volet « palette » de H1 ; RH4 les trois-quarts des PNJ ;
  - caméras : RK1 le pivot de A à x 5,8 ; RK2 `?camfollow=screen` par défaut ; RK3 le recul de −445 px/s au bord de l'eau ;
  - gel : RG1 lancer le gel (T1, T2, T7) ;
  - jalon : RJ1 clore le district ; RJ2 la suite (état jour, autre quartier ou arène) ; RJ3 le Gold Master.
- **Preuves jointes** :
  - le visage avant / après, en scène et ×8 ;
  - les 60 images de l'export ×3 ;
  - la planche du pivot de A ;
  - deux flipbooks neufs en D (héros candidat, `KEYS=w` et `KEYS=s`, trois vues contre cinq). Sur 75 images, 74 diffèrent entre les deux
    variantes : la règle à cinq vues change bien ce que montre le héros en D.

### Restes [?]
- Attendre que l'opérateur dise la fiche remplie, puis relire `decisions`, consigner les choix mot pour mot et les appliquer, une branche
  par tâche.

### Pensée
- Une fiche de revue se construit après l'application des décisions précédentes : chaque point porte l'état prouvé du dépôt, et les
  adresses pour juger en jeu.

## Passe D3 — Fiche de revue remplie (jalon M1) : onze décisions de l'opérateur consignées (2026-10-19)

### Demande
- L'opérateur a collé dans la séance le récapitulatif de la fiche (https://claude.ai/artifact/6URUh6P2VKXNxwCQq1RMsA), qui commence par
  « Fiche de revue du district (M1) — mes choix : ».
- La collection `decisions`, lue vers 20 h 01 UTC, compte 11 documents. Ils sont identiques au récapitulatif collé, sans aucune note.
- Branche `decisions-d3` depuis `main` (`b235894`).

### Les choix, mot pour mot (l'option cliquée)

| | Décision | Choix |
|---|---|---|
| RH1 | Le héros en production | « Production » |
| RH2 | Les cinq vues par défaut | « Par défaut avec le héros » |
| RH3 | Le volet « palette » de ta décision H1 | « Fait » |
| RH4 | Les trois-quarts pour les PNJ | « Plus tard » |
| RK1 | Le pivot du cadrage A avancé de 0,8 m | « Appliquer 5,8 » |
| RK2 | Le suivi qui ne dépasse plus le joueur en D | « Adopter (avec la preuve) » |
| RK3 | Le recul de −445 px/s au bord de l'eau | « Diagnostiquer avant le gel » |
| RG1 | Lancer le gel du district | « Lancer le gel » |
| RJ1 | Clore le Merchant District | « Clore après le gel » |
| RJ2 | La suite après le district | « L'état jour » |
| RJ3 | Le statut Gold Master du district | « Pas encore » |

### À appliquer, une branche par tâche, dans cet ordre
1. RH1 et RH2 : `hero-x2-v3` en production, à la place du héros généré ; son manifeste approuvé avec la décision citée et datée ; la règle à
   cinq vues par défaut.
2. RK1 : le pivot de A à x 5,8 (le bake se refait, la preuve de visibilité suit).
3. RK2 : `?camfollow=screen` par défaut, après une preuve de visibilité en mouvement.
4. RK3 : le diagnostic du recul au bord de l'eau, avant le gel. Un correctif qui toucherait un cadrage approuvé est montré à l'opérateur
   avant d'être appliqué.
5. RG1 : le gel.
   - T1 : couper la passe « derrière » du bake.
   - T2 : corriger la géométrie (fissures, quai coplanaire), sans D ×4.
   - T7 : retirer l'ancienne rive opposée. Le fond change : il est montré avant / après, et la fusion attend l'accord de l'opérateur.
6. RJ1 : le district déclaré clos à la fin du gel.
7. RJ2 : l'état jour. D'abord une proposition de direction artistique, décidée avec l'opérateur avant tout code.

Rien à faire pour RH3, RH4 (les trois-quarts des PNJ restent « Plus tard ») et RJ3 (pas de Gold Master).

### Pensée
- Les choix se relisent dans la collection même quand l'opérateur colle le récapitulatif. Les deux concordent ici ; un écart serait reposé
  à l'opérateur avant d'agir.

## Passe H10 — Héros : `hero-x2-v3` en production, la règle à cinq vues par défaut (décisions RH1, RH2) (2026-10-19)

### Demande
- Décisions de l'opérateur (Passe D3), mot pour mot : RH1 « Production », RH2 « Par défaut avec le héros ».
- Branche `hero-production-h10` depuis `main` (`095e716`).

### Fait — [OK]
- **Approbation** : le manifeste passe à `status: approved`, `approved: true`, `runtimeUse: production`.
  - L'approbation cite la décision et sa date, et l'empreinte de l'export approuvé (`65788b0d…`, celui de la Passe H9).
  - Le paquet de provenance reçoit la même entrée dans `approvals`, son statut et la ligne des droits.
  - Droits : la planche v4-b, générée avec le compte OpenAI de l'opérateur, et sa planche v3 ; l'usage en production décidé par l'opérateur ;
    droits de tiers non vérifiés exhaustivement ; C2PA lu, non vérifié.
  - Pas de Gold Master (RJ3).
- **Distribution** : l'entrée du héros reste la **dernière** de `BakedCast`.
  - Ses 60 images viennent après les 322 des PNJ dans la texture cuite : la première colonne se remplit, la seconde s'ouvre (382 images sur
    les 672 garanties, Passe T1).
  - Chaque image des PNJ garde sa case.
- **Cinq vues par défaut** : `ActorSystem.views5 = true`. `?views=3` rend la règle à trois vues à tout sprite ; le paramètre `?views=5`
  disparaît. Elle ne s'applique qu'aux feuilles qui ont les deux trois-quarts : aujourd'hui, le héros seul.
- **Documents** : `AGENTS.md` (le principe de production, les paramètres `views`, `cast`), `art-lab/README.md`,
  `art-lab/characters/README.md` (tableau de la distribution).

### Preuves
- **Captures déterministes** : graine 1842, `clean=1&freeze=7.3&vis=0`, 300 pas, A / B / C / D ; la branche contre `main` figé
  (`095e716`, :5187).
  - **La production est exactement ce que l'opérateur a revu** : la branche par défaut contre `main` avec `?cast=candidate&views=5` donne
    **0 px** sur les quatre cadrages (écart max 0).
  - `?cast=generated` : **0 px** contre `main` ; l'ancienne distribution générée reste disponible.
  - Contre `main` par défaut, seul le joueur change : son sprite, son reflet, sa longue ombre de lune (A 14 602 px, B 31 963, C 33 071 ;
    D 0, le joueur hors champ).
  - Témoin de répétition : 0 px.
- **Bundle de production** (`npm run build`, servi par `vite preview` sur :5189) : le joueur porte `hero-x2-v3`, la règle à cinq vues est
  active, la texture cuite fait 2 048 de large.
  - **[?]** Le bundle et le serveur DEV ne donnent pas la même image à la même graine (B : 22 919 px), y compris avec `?cast=generated`
    (24 230 px). L'écart ne vient donc pas du héros ; sa cause n'est pas cherchée (piste : du code DEV qui tire dans `Math.random` à graine).
    Les preuves d'image se comparent sur le même type de serveur.
- **Glissement en mouvement** (`tools/foot-slip.mjs --secs=3 --keys=d`) : B −0,07, D −0,07. Ce sont les valeurs de la Passe H8, la
  quantification.
- **Tests** :
  - `tests/baked-atlas.test.mjs` réécrit : le héros est la dernière feuille de la production ; les PNJ gardent case et octets ; le héros
    remplit la dernière étagère de la première colonne puis la seconde ; 336 < 382 ≤ 672.
  - `tests/baked-cast.test.mjs` : le joueur entre dans la liste des rôles distribués.
  - `tests/stride.test.mjs` : `walkSlide` du héros, 14.
  - **Faute injectée** (le héros remis avant les citadins dans la liste) : attrapée.
  - typecheck, `npm test` 87 / 87, build, `art:validate` 0 erreur.
- **Références** : `screenshots/calibration/cam{A,B,C,D}-*.png` refaites (requêtes de `tools/screenshots.mjs`, capture déterministe, 120 pas,
  témoin 0 px). Contre les anciennes : 0,23 à 0,92 % des pixels, tous autour du joueur.

### Restes [?]
- Le chat reste généré.
- Relevés de la Passe H9, à suivre en jeu : la course de face « sur place », la bouche grisâtre en B, l'œil lointain du trois-quarts.
- Les trois-quarts des PNJ : « Plus tard » (RH4).

### Pensée
- Une approbation de production se prouve contre ce que l'opérateur a revu, sur la même base : la production d'après doit égaler, au pixel
  près, la revue d'avant (`?cast=candidate&views=5` sur `main`).
- Une feuille ajoutée en dernier ne déplace rien de ce qui la précède ; le test le dit par l'ordre et par les cases.

## Passe K6 — Caméras : le pivot de A avancé à x 5,8 (décision RK1) (2026-10-19)

### Demande
- Décision de l'opérateur (Passe D3), mot pour mot : RK1 « Appliquer 5,8 ».
- Branche `camera-pivotA-k6` depuis `main` (`3bef265`).

### Fait — [OK]
- `CameraGraph`, cadrage A : `home` x 5,0 → **5,8**, avec la décision en commentaire. Le reste de A (lacet, tangage, distance, focale, gains)
  ne change pas.
- Le bake se refait de lui-même : la clé du cache couvre les poses.
- `tests/camera-graph.test.mjs` : le test de B → A est durci.
  - Avec le pivot 5,8 : aucun recul, ni sur B → A ni sur A → B.
  - **Contrôle** : le même test, le pivot remis à 5,0 sur l'instance, doit voir le recul de la Passe K1 (plus de 15 px/s). Il le voit.

### Mesures
- **Graphe seul** (le harnais des tests : marche droite le long du quai à 2,5 m/s) :
  - B → A : **+20,7 px/s de recul (24 images) à 5,0 → aucune image de recul à 5,8** ; le joueur avance toujours, d'au moins 7 px/s.
  - A → B : inchangé, jamais de recul.
  - Le joueur finit la transition 18 px plus à gauche.
- **Dans le jeu** (`tools/camsim.mjs`, graine 1842, `static=1`, joueur guidé vers −12,5 / 0,5, puis le long du bord, z 1,6) :
  - `main` figé (`3bef265`) comme la branche : 0 image de recul au seuil de `camsim` (8 px/s).
  - Sans seuil, le joueur avance toujours à l'écran pendant B → A. Son avance la plus lente monte avec le pivot à 5,8 :
    - le héros de production (3,73 m/s) : 36 → 66 px/s ;
    - la distribution générée (2,5 m/s) : 27,5 → 40 px/s.
  - **[?] Constat** : le recul de +20,7 px/s n'existait que dans le harnais, où la marche est droite le long de x à 2,5 m/s. Dans le jeu, le
    guidage et l'échelle des personnages le couvraient déjà ; le recalage donne de la marge.
- **Visibilité** (`tools/viewport-proof.mjs --no-resize --no-controls`, trois graines × cinq formats, la même série) :
  - `main` figé : **8 contrôles en échec**, les écarts connus de la Passe G1 (au plus 3 px).
  - la branche : **13**. Les 8 mêmes, et 5 nouveaux, tous sur A ou AB, tous expliqués par `tools/vis-why.mjs` :
    - graine 1842, A en 1920 × 1080 (2 px) et en 2560 × 1080 (3 px), AB en 2560 × 1080 (7 px). Les parties manquées forcées, il reste
      **0 px** : ce sont des lanières plus fines qu'un pixel du bake (pièce 179, un toit du fond, 0 pixel de tuile même à ×8 ; pièce 515, une
      maison de la ville haute, 0 à la taille du bake). Intensité de 5 à 9 sur 255. C'est la classe de résidu connue (Passe 5b).
    - graine 7719, A, 2 px dans les deux formats (le même point de la scène, intensité 150). Les parties forcées, l'écart reste, et ce n'est
      pas l'ordre de dessin. Avec `msaa=8` : **0 px** ; avec `msaa=0`, l'écart se déplace (3 px ailleurs, intensité 44). C'est un seul
      échantillon MSAA à travers une fissure de la géométrie, pas le culling. Il est à reprendre avec les corrections de géométrie du gel
      (T2).
  - Tier 3 et poses du bake : 317 pièces sur 738 à la graine 1842 des deux côtés (1080p) ; le bake se refait (la clé change avec la pose
    de A).
- **Validation** : typecheck, `npm test` 87 / 87, build, `art:validate`.
- **Référence** : `screenshots/calibration/camA-establishing.png` refaite (requête de `tools/screenshots.mjs`, 120 pas, témoin 0 px).

### Pensée
- Un défaut mesuré dans un harnais se remesure dans le jeu avant d'en tirer le bénéfice d'un réglage : ici, la vitesse et le guidage du
  joueur réel le couvraient déjà. Le réglage reste celui que l'opérateur a choisi, et la mesure dit ce qu'il apporte vraiment.

## Passe K7 — Caméras : le suivi de D qui ne dépasse plus le joueur, par défaut (décision RK2), et sa preuve de visibilité en mouvement (2026-10-19)

### Demande
- Décision de l'opérateur (Passe D3), mot pour mot : RK2 « Adopter (avec la preuve) ». La preuve demandée : la visibilité des poses que le
  suivi retient, en mouvement (la Passe K5 ne l'avait prouvée que sur des poses fixes).
- Branche `camfollow-default-k7` depuis `main` (`7397ed7`).

### Fait — [OK]
- `CameraGraph.screenFollow = true` : le suivi de la Passe K5 est le défaut.
  - `?camfollow=off` rend l'ancien suivi, pour comparer ; `?camfollow=screen` ne change plus rien.
  - `AGENTS.md` : le paramètre, et le nouvel outil.
- **Nouvel outil, `tools/visproof-walk.mjs`** : la preuve de visibilité en mouvement.
  - La même marche déterministe tourne sur deux pages, le défaut élagué et `vis=0`, pas à pas en même temps : graine, `App.start`
    neutralisé, horloge figée, joueur guidé comme dans `camsim`.
  - Les deux pages sont rendues et capturées tous les N pas, puis comparées au pixel. Le contrôle vérifie aussi qu'elles n'ont pas divergé
    (cadrages actifs, position du joueur).
  - Une page de fond du même navigateur ne produit pas d'image (la capture tombait en délai dépassé) : chaque page passe au premier plan
    avant sa capture.
  - **Contrôle négatif** `--control` : la page élaguée ne dessine que les pièces de A. Résultat : 6 captures sur 6 diffèrent, jusqu'à
    11 028 px.

### Preuves
- **Visibilité en mouvement** (`main` figé `7397ed7`, :5187 ; tous les 6 pas, seuil 24). Sept marches : C → D, D → C, D → B au bord de
  l'eau, la diagonale en profondeur dans les deux sens, D vers l'est et vers l'ouest.
  - Ancien suivi : **926 captures, 0 écart**.
  - Suivi à l'écran : **926 captures, 1 écart d'1 pixel**. Diagonale, pas 282, D posé, joueur en 16,25 / −2,7 ; pixel (779, 213), dans le
    fond, écart 25 pour un seuil de 24. Image : `screenshots/calibration/known-issues/k7-walk-1px.png`.
  - **[?]** La pose posée de D au même endroit donne 0 px, sans pièce manquée (`vis-why`). La pose retenue par le suivi tombe entre deux
    échantillons du bake : c'est la classe connue des lanières vues seulement entre des poses échantillonnées. `vis-why` ne sait pas se
    placer à cette pose exacte, la cause n'est donc pas prouvée.
- **Le défaut est seulement inversé** : la sortie complète de `camsim` (les sept marches, JSON) est **identique à l'octet** dans les deux
  sens.
  - La branche par défaut contre `main` avec `?camfollow=screen`.
  - La branche avec `?camfollow=off` contre `main` par défaut.
- **Cadrages posés** (captures déterministes, 300 pas, A / B / C / D) : **0 px** contre `main`. Le joueur ne bouge pas, le suivi n'agit
  donc pas.
- **Marches** (`camsim`, le héros de production à 3,73 m/s ; images de recul au seuil de 8 px/s, ancien suivi → suivi à l'écran) :

| marche | ancien suivi | suivi à l'écran |
|---|---|---|
| C → D (8 / 1 vers 20 / 0,6) | 20 (−62 px/s) | **0** |
| D → C | 46 (−90 px/s) | **3** (−18 px/s) |
| D → B, au bord de l'eau | 52 (−34 px/s) | **0** |
| diagonale (8,5 / 2,2 vers 18,5 / −3) | 10 (−58 px/s) | **12 (−177 px/s)** |
| retour de la diagonale, D vers l'est / l'ouest | 0 | 0 |

- **[?] Une régression, expliquée : la diagonale, pendant C → D.**
  - Rejouée exactement (0 d'écart) dans le graphe seul, la marche se décompose ainsi.
    - Le joueur va en profondeur : son pas propre à l'écran est faible et vers la gauche, −2 à −18 px/s.
    - Le fondu ancré le glisse vers sa place de D, environ 200 px plus à droite.
  - Le foyer retenu par le suivi éloigne encore cette place, et la glissade va plus vite.
  - C'est le mécanisme du recul au bord de l'eau (RK3) : le fondu ancré glisse le joueur entre ses deux places sans regarder son pas propre.
    Il est traité avec RK3, avant le gel.
- **Tests** :
  - `tests/camera-graph.test.mjs` : le défaut attendu est le suivi à l'écran ;
  - typecheck, `npm test` 87 / 87, build, `art:validate`.

### Pensée
- La visibilité d'un suivi qui retient sa pose se prouve sur les poses qu'une vraie marche produit, les deux pages pas à pas en même temps,
  avec un contrôle qui doit échouer.
- Le gain d'un réglage se remesure avec le joueur de production : à 3,73 m/s, les chiffres de la Passe K5 (relevés à 2,5 m/s) changent, et
  une marche régresse.

## Passe K8 — Caméras : diagnostic du recul de −445 px/s au bord de l'eau (décision RK3) (2026-10-19)

### Demande
- Décision de l'opérateur (Passe D3), mot pour mot : RK3 « Diagnostiquer avant le gel ».
- Ordre de la Passe D3 : un correctif qui toucherait un cadrage approuvé est montré à l'opérateur avant d'être appliqué.
- Branche `diag-edge-k8` depuis `main` (`3f4f666`). Pas de code de jeu changé.

### Reproduction — [OK]
- `tools/camsim.mjs`, graine 1842, `static=1`, `d` tenue depuis C (9 / 0,6), sur `main` (`3bef265`, la production d'alors) :
  - avec le héros de production : **38 images de recul pendant C → B, jusqu'à −436 px/s** ;
  - avec la distribution générée : 41 images, −447 px/s, les chiffres de la Passe K5.

### Cause — [OK] décomposée
- **Méthode** : les positions enregistrées par `camsim` sont rejouées dans le graphe seul. La caméra rejouée est identique à celle du jeu
  (0 d'écart en lacet et en pivot). Puis, image par image, on sépare deux parts :
  - la part du joueur : son pas avec la caméra de l'image précédente ;
  - la part de la caméra : le joueur figé, la caméra qui change.
- **Deux effets s'ajoutent** :
  1. **Le joueur bute au bord de l'eau.** `d` dans C l'emmène surtout en profondeur, vers le canal. Arrêté à z = 3,99, il ne fait plus que
     glisser le long de x : sa part à l'écran tombe de +348 à +62 px/s.
  2. **Le fondu ancré le recentre.**
     - Le fondu glisse le joueur de sa place dans C à sa place dans B.
     - C laisse le joueur loin à droite, à environ +430 px du centre de l'écran : la longue focale suit peu.
     - B le garde vers +222 px : il suit x à 75 %.
     - Résultat : environ 210 px vers la gauche en 0,87 s. La part de la caméra culmine à **−498 px/s** ; le total, à **−436 px/s**.
- **Une fois B posé**, le joueur reste presque immobile à l'écran : B le suit (−62 px/s pour la caméra, +64 pour le joueur). Ce n'est
  donc pas un joueur bloqué, comme le supposait la Passe K5 : c'est B qui le suit.
- **Même mécanisme ailleurs** : la régression de la diagonale en profondeur pendant C → D (Passe K7) vient aussi du fondu ancré. Il glisse le
  joueur vers sa place dans D, environ 200 px à droite, alors que son pas propre va faiblement à gauche. Le fondu ancré interpole entre
  les deux places sans regarder le pas propre du joueur.
- **Deux mesures du recul** :
  - celle de `camsim` : le signe contre le mouvement du joueur projeté sur l'axe droit de la caméra ;
  - celle de la garde du suivi : contre le pas propre du joueur à l'écran.
  - Elles s'accordent au bord de l'eau, pas pour une marche vers la caméra (la fin de B → A).

### Première piste — [KO] insuffisante
- **Prototype**, dans une copie non versionnée du graphe : l'horloge du fondu ralentie (dichotomie) dès que l'avancer ferait reculer le joueur
  contre son pas propre. Les poses restent ainsi dans la famille que le bake échantillonne, un fondu à un poids donné.
- **Résultat, rejoué dans le graphe** :
  - bord de l'eau : 38 → 7 images de recul, mais un pire encore à −393 px/s, et la transition passe de 2,15 à 3,12 s ;
  - diagonale : 26 → 28 images.
- **Pourquoi c'est insuffisant** : à poids fixe, les deux places entre lesquelles le fondu interpole bougent elles-mêmes avec le joueur et
  le foyer. Ralentir l'horloge ne suffit donc pas.

### Options à décider par l'opérateur (aucune n'est appliquée)
1. **Un fondu ancré « continu à l'écran »** : il part de la place réelle du joueur à l'écran et ne la corrige vers la place du cadrage
   d'arrivée que dans le sens de son pas, ou quand il s'arrête.
   - Le joueur ne reculerait plus pendant aucune transition.
   - Une transition contre la marche durerait plus longtemps.
   - Les poses intermédiaires sortent de la famille échantillonnée : il faut la preuve de visibilité en mouvement (`tools/visproof-walk.mjs`).
2. **Rapprocher la place du joueur entre C et B au bord de l'eau** : régler le suivi de C ou la limite de sa zone côté canal. Cela change
   un cadrage approuvé.
3. **Laisser** : la glissade dure 0,87 s, seulement à la sortie de C par le bord de l'eau (et pendant C → D sur la diagonale).

### Pensée
- Un recul à l'écran se décompose avant d'être corrigé : la part du joueur (qui bute au bord) et la part de la caméra (le fondu qui
  recentre). « Bloqué » était une hypothèse, la décomposition a montré un suivi.
- Un remède sur une seule grandeur (l'horloge du fondu) ne suffit pas quand les deux bornes de l'interpolation bougent : une piste mesurée
  à « insuffisante » se consigne avec ses chiffres.

## Passe Z1 — Gel du district, T1 : la passe « derrière les occluders » du bake coupée par défaut (décisions T1, RG1) (2026-10-19)

### Demande
- Décisions de l'opérateur, mot pour mot : T1 « Garder jusqu'au gel » (Passe D1), RG1 « Lancer le gel » (Passe D3).
- Branche `freeze-t1-z1` depuis `main` (`a5b1e00`).

### Mesure d'abord — [OK]
- Bake neuf (`viscache=0`), `static=1`, graines 1842 / 7719 / 30417, en 1920 × 1080, 1280 × 720 et 2560 × 1080, avec les caméras d'aujourd'hui :
  transitions ancrées, pivot de A à 5,8, suivi de D.
  - **Pièces restaurées par la passe : 0 dans les neuf cas.** Le nombre de triangles est le même avec et sans elle.
  - **Coût** : bake de 280 à 375 ms avec la passe, de 189 à 213 ms sans elle, soit **90 à 160 ms gagnés** par bake neuf. Le cache rendait déjà
    le bake gratuit ensuite.
- Le test de charge `occtest=shopA,tall` (9 occluders au lieu de 2) avec la passe : elle tourne (2,5 millions de pixels comptés) et ne
  restaure rien non plus, comme en Passe B1.

### Fait — [OK]
- `App` : la passe ne tourne plus que sur demande, avec `?occbehind=1` (avant : `?occbehind=0` la sautait). Le commentaire dit quand la
  rejouer : à chaque changement de cadrage, d'occluder ou de composition, avec `tools/occ-inventory.mjs`.
- `AGENTS.md` : le paramètre, et le paragraphe du bake dans la section de l'occlusion.

### Preuves
- **Rendus élagués** (captures déterministes, graine 1842, `static=1&occ=0`, 60 pas), la branche contre `main` figé (`a5b1e00`) :
  - A, B, C, D : **0 px** ;
  - les quatre transitions figées (`blend=` AB, BC, CD, BD) : **0 px** ;
  - écart max 0.
- **Validation** : typecheck, `npm test` 87 / 87, build, `art:validate`.

### [KO → corrigé] procédure
- Le premier essai du commit a échoué : le script du journal ne trouvait pas son ancre, présente deux fois. Les étapes push / fusion / suppression
  de la branche venaient pourtant à la ligne suivante, sans lien `&&` avec lui : elles ont tourné.
- Effet : rien de perdu, puisque la branche n'avait aucun commit. `main` est resté à `a5b1e00` (« Already up to date ») ; la branche, vide, a été
  poussée puis supprimée ; les changements non commités sont restés dans la copie de travail. La branche est recréée, et le commit refait.
- C'est la faute des Passes M3 et K5 : une étape irréversible doit être liée par `&&` à la vérification de la précédente, jamais seulement
  posée à la ligne suivante. Et un texte qui porte des accents graves ne passe jamais par une commande `node -e` entre guillemets doubles :
  Bash les lit comme une substitution de commande (deuxième faute de cette passe, corrigée par un script écrit sans le shell).

### Pensée
- Une passe de sécurité se coupe sur une mesure faite avec la configuration d'aujourd'hui : les cadrages ont changé depuis la Passe B1. La
  passe reste disponible par un paramètre, avec la règle de la rejouer.

## Passe Z2 — Gel du district, T2 : les fissures de la géométrie fermées, le quai lointain sorti du plan des culées (décisions T2, RG1) ; journal H7-D2 archivé (2026-10-19)

### Demande
- Décisions de l'opérateur, mot pour mot : T2 « Géométrie au gel, pas de ×4 » (Passe D1), RG1 « Lancer le gel » (Passe D3). Reprise après une
  pause, mot pour mot : « tu peux reprendre ».
- Branche `freeze-t2-z2` depuis `main` (`d951ae4`). Ni D ×4 ni poses AB à w = 0,5 (décision T2).

### Première tentative — [KO] retirée
- Les panneaux de mur agrandis de 3 cm là où une poutre ou un poteau les couvre : des pièces qui se recouvrent au lieu d'un bord commun.
- Preuve de visibilité : **17 contrôles en échec contre 13 sur `main`**, et les deux fissures visées (graine 7719, A et C) restaient. Le code est
  remis comme sur `main`.

### Causes — [OK] trouvées pixel par pixel (les triangles qui couvrent le pixel, d'avant en arrière, et leurs bords)
- **7719 C** : une jonction en T dans `panelWithHole`. Les bandes sous et sur une ouverture couraient sur toute la largeur du panneau, et les
  coins des bandes latérales tombaient au milieu de leur bord (y = 6,631 pour cette fenêtre). Un échantillon MSAA y voyait le mur de derrière.
- **7719 A** : un étage plus étroit que celui du dessous (l'asymétrie de x0 / x1) laissait une marche de 8 mm entre les lisses latérales des
  deux étages, vue d'en haut. Elle mène dans la fente de 3 cm entre le dessous de l'encorbellement (y0 − 0,03) et les lisses basses de l'étage
  (y0), ouverte sur les côtés et devant.
- **Quai coplanaire** : le mur du quai lointain (`DistantCity`) était dans le plan des culées des ponts (z = QUAY_Z + 0,35) ; l'ordre de dessin
  décidait quelle face se montrait (classe de résidu de la Passe 5b).

### Fait — [OK]
- `panelWithHole` : neuf morceaux au plus autour d'une ouverture (les rangées du dessous et du dessus coupées aux verticales de l'ouverture).
  Chaque bord que deux morceaux partagent a les mêmes deux bouts. L'occlusion peinte d'une rangée ne varie qu'en y et les UV viennent de la
  position monde : la coupe ne change aucun pixel par elle-même.
- Sous chaque encorbellement (`BuildingGenerator`) :
  - une bande tournée vers le haut ferme la marche d'un étage en retrait, au niveau du dessous, cachée dans les lisses ;
  - trois bandes tournées vers l'extérieur (les deux côtés, le devant) ferment la fente de 3 cm. Elles partent des bords du dessous (les mêmes
    sommets : aucune jonction en T) et montent dans les lisses, qui cachent leur haut.
- Le mur du quai lointain recule de 2 cm derrière les culées (`QUAY_Z + 0,33`).
- **[KO] une idée écartée** : étendre le dessous de l'encorbellement à la largeur des deux étages. Il est tourné vers le bas : vu d'en haut, il
  ne ferme rien.
- **[KO → corrigé] les bandes descendaient 1,5 cm sous le dessous** (y0 − 0,045, pour qu'aucun bord ne tombe sur un autre). Les rendus
  canoniques y montraient une lèvre sombre le long de chaque encorbellement (1842 B : 3 426 px). Ramenées au bord du dessous : 2 450 px,
  seulement la fente qui était ouverte. Les deux fissures restent à 0 px.

### Preuves
- **`tools/vis-why.mjs`**, graine 7719, en 1920 × 1080 et 2560 × 1080 : A et C à **0 px**, D0 et D1 (sur `main` : A 2 px d'intensité 150 à
  155, C 1 px).
- **`tools/viewport-proof.mjs --no-resize --no-controls`** (trois graines × cinq formats), `main` figé (`d951ae4`, :5187) puis la branche,
  dans la même série :
  - `main` : **13 contrôles en échec**, ceux de la Passe K6 ;
  - la branche : **5, aucun nouveau**. Disparus : 7719 A et C (1080p et 2560 × 1080), 1842 BC (1080p et 2560 × 1080, 1 px chacun),
    30417 D lointain et CD en 720p (1 px chacun) : les fissures MSAA des Passes 5b, G1 et K6. Sur `main`, `vis-why` voit l'écart de
    30417 D lointain en 720p (1 px) sans pièce manquée ni ordre de dessin : un échantillon à travers une fissure ; 0 px sur la branche.
  - Restent, tous déjà sur `main` et de la classe connue : 1842 A (2 px en 1080p, 3 px en 2560 × 1080) et AB 2560 × 1080 (7 px), les lanières
    de la Passe K6 ; 1842 D lointain 2560 × 1080 (3 → 2 px) ; 30417 D lointain 665 × 1200 (1 px, la partie 73).
  - Pixels « order » inchangés (7719 BC 7, A en 720p 5, AB en 900 × 900 1).
- **Bake** (graine 1842, 1080p) : Tier 3 **317 → 330 pièces**, triangles dessinés 100 960 → 98 886. Les 13 pièces sont des murs latéraux
  d'étage (est ou ouest), une ou deux par maison, dans onze maisons. L'ablation (ci-dessous) les répartit : 6 cachées par le panneau en neuf
  morceaux, 7 par les bandes sous les encorbellements, aucune par le quai. Le bake ne les voyait qu'à travers les fissures fermées ; aucune ne
  manque à l'image (les deux preuves ci-dessus et ci-dessous). À la pose D lointaine de 30417 en 720p, `vis-why` en voit encore une (`tall`,
  mur est de l'étage 3) sur 1 pixel de son rendu d'identifiants à ×2, sans effet sur l'image (0 px) : la classe des lanières.
- **Rendus canoniques** (captures déterministes, culling actif, `static=1&occ=0`, 30 pas ; trois graines × A, B, C, D, D lointain et les quatre
  transitions figées) contre `main` figé : **0,019 à 0,143 % des pixels changent** (404 à 2 968 px).
  - **Ablation** : chaque correctif seul sur la branche, les deux autres fichiers remis comme sur `main` ; graines 1842 et 7719 × A, B, C, D, D
    lointain.
    - Le panneau en neuf morceaux : **6 à 44 px par vue** (écart max 76) : les échantillons des jonctions en T.
    - Les bandes sous les encorbellements : **425 à 2 726 px** (écart max 218), presque tout l'écart, dont les pixels forts (la fissure de
      7719 A, 150 ; en D, 197 et 218). C'est la fente fermée le long des encorbellements, un à deux pixels d'écran en B.
    - Le quai : **0 à 335 px, d'intensité 4 au plus** (le mur lointain reculé de 2 cm ; en B, au bord droit). Il ne change aucun pixel décidé
      par l'ordre dans ces vues : il retire une coplanarité, pas un écart mesuré aujourd'hui.
- **Visibilité en mouvement** (`tools/visproof-walk.mjs --every=6`), `main` figé puis la branche ; les sept marches de la Passe K7 et quatre
  par A, B et C (B → A, A → B, B → C, C → B au bord de l'eau) :
  - `main` : 836 captures, 1 écart d'1 px, celui de la Passe K7 (diagonale, pas 282) ;
  - la branche : **836 captures, 0 écart**. **[?]** L'écart de K7 disparaît avec les fissures : c'était sans doute un échantillon à travers
    l'une d'elles plutôt qu'une lanière ; non prouvé ;
  - contrôle négatif (`--control`, C → D) : 10 captures sur 33 diffèrent, jusqu'à 17 133 px.
- **[KO → corrigé] Passe Z1 : les références n'étaient pas refaites.** `screenshots/calibration/cam{A,B,C,D}-*.png` (requêtes de
  `tools/screenshots.mjs`, capture déterministe avec personnages, 120 pas) ne correspondaient plus à `main` (C : 13 990 px au seuil 24).
  - Cause : `main` avec `?occbehind=1` les redonne à 0 px. La passe « derrière » tirait dans le `Math.random` à graine du harnais ; la
    couper (Passe Z1) déplace les personnages et les particules des captures. La graine du district n'est pas touchée, et les rendus de la Passe Z1, sans
    personnages (`static=1`), ne pouvaient pas le voir.
  - Les quatre références sont refaites sur la branche (témoin de répétition 0 px). La branche contre `main` figé, mêmes captures : A 37 px,
    C 58 px au seuil 24.
- **Validation** : typecheck, `npm test` 87 / 87, build, `art:validate` 0 erreur.

### Journal — [OK] archivage (règle d'`AGENTS.md`, passes gardées au-delà d'environ 60 Ko)
- Les passes gardées faisaient 79 077 octets. H7, I1, G1, D1, O1, C2, K4, V5, H8, K5 et D2, toutes closes (branches fusionnées), partent d'un
  seul bloc, dans leur ordre et à l'octet, vers `journal/11-passes-H7-D2.md` : en-tête, ligne `---`, puis les 47 246 octets inchangés (SHA-256
  `47dc8ebe66b35fd1…`). La ligne d'index et la phrase d'en-tête sont mises à jour.
- **Preuve** (script hors dépôt, contre la copie de `JOURNAL.md` faite juste avant, les huit contrôles de la Passe D1) : **8 / 8**. Contrôle
  négatif : un mot changé dans une copie de l'archive → 6 / 8.

### Restes [?]
- T7, l'ancienne rive opposée : la tâche suivante du gel. Le fond change ; son avant / après est montré à l'opérateur avant la fusion
  (Passe D3).
- Les cinq écarts restants de `viewport-proof` sont des lanières plus fines qu'un pixel du bake : pas de ×4 (décision T2).

### Pensée
- Une fissure MSAA se cherche dans la topologie : un coin posé au milieu du bord d'une pièce voisine (jonction en T), ou une fente entre deux
  pièces qui ne se touchent pas. Faire se recouvrir les pièces ne la ferme pas (première tentative : 17 échecs) ; un bord commun aux mêmes
  sommets la ferme.
- Une pièce de fermeture se juge d'abord sur le rendu canonique : elle peut ajouter ce qu'on ne lui demandait pas (une lèvre de 1,5 cm sous
  chaque encorbellement). Fermer une fente change aussi le bake : ce qu'on ne voyait qu'à travers elle sort des pièces vues.
- Un changement qui retire des objets THREE (une passe du bake) déplace le `Math.random` à graine des captures avec personnages : ses preuves
  sans personnages ne le voient pas, et les références se refont dans la même passe.

## Passe Z3 — Gel du district, T7 : les tirages « en sec » de l'ancienne rive opposée gardés (décision de l'opérateur) (2026-10-19)

### Demande
- Décision de l'opérateur, mot pour mot : T7 « Retirer au gel » (Passe D1). Ordre de la Passe D3 : le fond change, son avant / après est
  montré à l'opérateur, et la fusion attend son accord.
- Branche `freeze-t7-z3` depuis `main` (`9b2c278`).

### Le retrait — essayé, montré, abandonné
- **Code** : les deux appels `row(...)` sans `meta` retirés de `DistantCity`, `meta` rendu obligatoire. typecheck, `npm test` 87 / 87.
- **Rendus canoniques** (captures déterministes, culling actif, `static=1&occ=0`, 30 pas ; trois graines × A, B, C, D, D lointain et les quatre
  transitions figées) contre `main` figé (`9b2c278`, :5187) : **0,5 à 7,2 % des pixels changent** dans les vues qui voient la ville lointaine
  (A, B, C, D, AB, BC, BD), 0,008 à 0,17 % en D lointain et en CD. Tout ce que le flux `r` tire après ces rangées prend d'autres tirages : le
  quartier derrière le front, les rangées du bassin, la ville haute.
- **À la graine canonique 1842, en A**, un grand mur clair sans fenêtres remplace sous le château l'étagement de maisons éclairées
  (`screenshots/calibration/z3-t7/1842-A-hillcity-x2.png`, ×2 ; le cadre entier : `1842-A-before-after.png`). Aux graines 7719 et 30417, la
  ville haute change mais reste étagée et éclairée.
- **Visibilité** (`tools/viewport-proof.mjs --no-resize --no-controls`, la même série) : `main` 5 contrôles en échec (ceux de la Passe Z2) ;
  le retrait 6, dont deux nouveaux, 30417 A et AB en 2560 × 1080 (5 et 2 px, intensité 7 au plus). `vis-why` : les pièces manquées forcées,
  **0 px** dans les deux cas. Ce sont des reflets de la ville moyenne et de la ville haute plus fins qu'un pixel du bake (tuile 0, ×8 > 0), la
  classe connue.
- Les planches ont été montrées à l'opérateur dans la séance, avec ma recommandation de garder les tirages.

### Décision de l'opérateur, mot pour mot
- « T7 : garde les tirages « en sec », le fond actuel reste. Consigne-le et passe à la clôture du district. »

### Fait — [OK]
- Le retrait n'est pas commité : `DistantCity` reste comme sur `main`. Un commentaire aux deux rangées cite la décision, pour que personne ne
  les retire sans l'opérateur. Aucun pixel ne change (un commentaire seul ; typecheck, build).
- Gardées comme pièces de la décision : les deux planches de A (`screenshots/calibration/z3-t7/`).
- **Validation** : typecheck, `npm test` 87 / 87, build, `art:validate` 0 erreur.

### Pensée
- Une dette qui ne coûte rien au rendu (des tirages rejoués sans rien dessiner) peut tenir l'image approuvée. La retirer redistribue tout ce
  qui suit dans le flux, et la graine canonique peut tomber sur pire. Un tel retrait se juge sur les images, à la graine canonique d'abord, puis
  aux autres.

## Passe Z4 — Jalon M1 clos : le Merchant District déclaré complet (décision RJ1) (2026-10-19)

### Demande
- Décision de l'opérateur (Passe D3), mot pour mot : RJ1 « Clore après le gel ». La fiche recommandait : « Le déclarer complet après le gel ».
- Opérateur, mot pour mot, après la Passe Z3 : « T7 : garde les tirages « en sec », le fond actuel reste. Consigne-le et passe à la clôture du
  district. »
- Branche `close-district-z4` depuis `main` (`d91a475`). Aucun code de jeu ne change.

### Le jalon M1 — [OK] appliqué, revu, gelé
- Première fiche (27 décisions, Passe D1), appliquée : O1, C2, K4, V5, H8, K5 ; S1 tranchée (Passe D2) ; visage du héros (Passe H9).
- Fiche de revue (onze décisions, Passes R1 / D3), appliquée :
  - le héros `hero-x2-v3` en production et la règle à cinq vues par défaut (Passe H10) ;
  - le pivot de A à x 5,8 (Passe K6) ;
  - le suivi de D qui ne dépasse plus le joueur, par défaut (Passe K7) ;
  - le recul au bord de l'eau diagnostiqué (Passe K8) ;
  - le gel : la passe « derrière » du bake coupée (Passe Z1), les fissures fermées (Passe Z2), les tirages « en sec » gardés (Passe Z3).
- **État à la clôture** (`main` `d91a475`) :
  - `tools/viewport-proof.mjs` (trois graines × cinq formats) : 5 contrôles en échec, tous des lanières plus fines qu'un pixel du bake (Passe
    Z2), sans D ×4 (décision T2) ;
  - visibilité en mouvement : 836 captures, 0 écart (Passe Z2) ;
  - références `screenshots/calibration/cam{A,B,C,D}-*.png` refaites sur le district gelé (Passe Z2 ; la Passe Z3 ne change aucun pixel) ;
  - typecheck, `npm test` 87 / 87, build, `art:validate` ; CI verte sur `9b2c278` et `d91a475`.
  - **[?] Non remesuré à la clôture** : le temps GPU. Dernière mesure : Passe G1 (10-12 ms en 1080p, 16-21 ms en 2560 × 1440, Radeon 780M).
    Depuis : le héros cuit en cinq vues, des bandes sous les encorbellements, moins de triangles dessinés (Passe Z2).

### Fait — [OK]
- `AGENTS.md` : une section « Status ». Le district est **complet** : son contenu, ses cadrages, sa distribution et son image restent tels
  quels, et tout changement est une nouvelle tâche décidée par l'opérateur. Il n'est **pas** Gold Master (RJ3 « Pas encore »).
- « À reprendre » § 0 : le jalon clos ; la suite (RJ2) et la décision qui reste (RK3).

### Préparé pour la suite (RJ2) — trois images de jour, non canoniques
- Pendant le gel, pour la proposition de direction artistique de l'état jour, trois images générées par `tools/art-lab/gen-image.mjs` (tâche
  `day-state-concepts`) : `gpt-image-2`, édition depuis `screenshots/calibration/camB-merchant.png` (la référence de la Passe H10),
  1536 × 1024, qualité haute ; une le matin (brumeux, froid), une à midi (bleu profond, beaucoup de pavois), une en fin d'après-midi (doré).
- Coût : 0,5334 $ sur 5 (trois requêtes, 0,18 $ chacune d'après la consommation). Fiches de provenance automatiques ; C2PA présent, non vérifié.
- Elles restent dans le dossier ignoré `art-lab/characters/scratch/generated/day-state-concepts/`, **non canoniques**, sans archivage.
- Réaction de l'opérateur, mot pour mot : « je trouve cela très intéressant. » Ce n'est pas un choix : elles entreront dans la proposition RJ2,
  décidée sur une fiche.

### Restes [?] — non bloquants, gardés dans « À reprendre »
- Décision de l'opérateur : le remède au recul du fondu ancré (Passe K8, options 1 à 3).
- Les résidus connus de la visibilité (§ 5), les restes des personnages (§ 1), la relecture de l'occlusion en mouvement (§ 2).

### Pensée
- Un jalon se clôt sur un état prouvé et daté : la dernière preuve de chaque sorte, et ce qui n'a pas été remesuré, dit comme tel. « Complet »
  n'est pas « Gold Master » : ce statut reste à l'opérateur.

