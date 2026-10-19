# Journal de bord — Cité du Tournoi (Merchant District, nuit)

Objet : garder une trace honnête de ce qui a été fait, de ce qui a marché, de ce qui a raté et de **pourquoi**, pour que
la suite parte d'un état connu. À compléter à chaque passe (une entrée par passe, la plus récente en bas).

Légende : **[OK]** réussi · **[KO]** échec / impasse · **[?]** non résolu ou à surveiller · **Pensée** = raisonnement / leçon.

> Les passes 0 à S1b, H0, M6, V0 à V3, H1, M7, H2 à H4, H5 à P2 et H7 à D2 sont archivées **mot pour mot** dans `journal/` (Passes M3, M6, M7, H5, T1, B1, D1 et Z2) ; ce fichier garde les passes récentes,
> « À reprendre » et « Principes à garder ». Un renvoi à une passe archivée (« journal pass 6k », « JOURNAL, Passe 4A-0B ») se lit
> dans le fichier que donne l'index.

| Archive | Passes | Dates |
|---|---|---|
| [`journal/01-passes-0-4B.md`](journal/01-passes-0-4B.md) | 0, 1, 2 (+ « État à la fin de la passe 2 »), 3, 3b, 4B | 10/10 → 12/10 |
| [`journal/02-passes-4A-0A-4A-quindecies.md`](journal/02-passes-4A-0A-4A-quindecies.md) | 4A-0A, 4A-0B, 4A, 4A-bis, 4A-ter, 4A-quater, 4A-quinquies, 4A-sexies, 4A-septies, 4A-octies, 4A-nonies, 4A-decies, 4A-undecies, 4A-duodecies, 4A-terdecies, 4A-quattuordecies, 4A-quindecies | 12/10 → 16/10 |
| [`journal/03-passes-4A-sedecies-M2.md`](journal/03-passes-4A-sedecies-M2.md) | 4A-sedecies, 4A-septendecies, 4A-duodevicies, 4A-undevicies, 4A-vicies, 5, 4A-unvicies, 5b, 4A-duovicies, 4A-tervicies, M1, 4A-quatervicies, M2 | 16/10 → 17/10 |
| [`journal/04-passes-6-6k.md`](journal/04-passes-6-6k.md) | 6, 6b, 6c, 6d, 6e, 6f, 6g, 6h, 6i, 6j, 6k | 17/10 → 18/10 |
| [`journal/05-passes-M3-M4.md`](journal/05-passes-M3-M4.md) | M3, Q1, Q1b, M4 | 18/10 |
| [`journal/06-passes-M5-S1b.md`](journal/06-passes-M5-S1b.md) | M5, S1, S2, S1b | 18/10 |
| [`journal/07-passes-H0-M6.md`](journal/07-passes-H0-M6.md) | H0, M6 | 18/10 |
| [`journal/08-passes-V0-V3.md`](journal/08-passes-V0-V3.md) | V0, V1, V2, V3 | 18/10 |
| [`journal/09-passes-H1-H4.md`](journal/09-passes-H1-H4.md) | H1, M7, H2, H3, H4 | 18/10 → 19/10 |
| [`journal/10-passes-H5-P2.md`](journal/10-passes-H5-P2.md) | H5, F1, T1, H6, K1, W1, Q2, C1, W2, K2, K3, W3, B1, A1, A2, A3, P1, P2 | 19/10 |
| [`journal/11-passes-H7-D2.md`](journal/11-passes-H7-D2.md) | H7, I1, G1, D1, O1, C2, K4, V5, H8, K5, D2 | 19/10 |

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

## À reprendre (par priorité)

> Élaguée le 18/10 (Passe M3) : seul le travail ouvert reste, regroupé par thème ; ce qui est fait vit dans sa passe. Les anciens repères
> (-3 … 6) cités par les passes antérieures renvoient à la liste de `7086340` (`git show 7086340:JOURNAL.md`).

**0. Jalon M1 — décisions de la fiche de revue (Passe D3), à appliquer dans l'ordre de cette passe** :
le remède au recul du fondu ancré (diagnostic, Passe K8 : options 1 à 3 à décider par l'opérateur) ; gel (T7 ; T1 fait, Passe Z1 ; T2 fait, Passe Z2) ; district clos après le gel ;
puis l'état jour. Gold Master : « Pas encore » (RJ3). Fait : le héros en production et les cinq vues par défaut (Passe H10), le pivot de A
à 5,8 (Passe K6), le suivi de D par défaut (Passe K7).

**1. Distribution de personnages — décisions de l'opérateur, non traitées** (état de la distribution : `art-lab/characters/README.md`)
- **Variantes de PNJ** (demande de l'opérateur du 17/10, mot pour mot : « Par ailleurs a la suite de nos travaux de sprites NPC qui sont
  presque peuple partout sur le district Merchant, on creera par la suite des variantes de NPC avec couleur de cheveux et peau different pour
  amener plus de diversite au jeu »). Contraintes connues : la texture cuite garantissait 336 images et en porte 322 (dix feuilles,
  1024 × 2016 ; 672 garanties depuis la Passe T1) : une variante en feuille séparée ne rentre pas sans agrandir la texture ; la teinte aléatoire de la foule (± 10 % par canal
  sur tout le sprite) ne s'applique plus aux feuilles cuites (Passe 4A-tervicies). **Passes V1 / V2** : masques de matière, recoloration au
  rendu, approuvées pour la production le 18/10 (PNJ uniques en original). Passe V3 : trait rosé sous la bouche du voyageur et manches du forgeron
  (les « texels pâles à l'épaule ») corrigés dans les masques, approuvés le 18/10. Fait : deux variantes par personnage, PNJ uniques en
  original (approuvé le 18/10 ; vérifié en Passe D1). Reste : les images de frappe du forgeron presque sans masque (invisible tant qu'il est
  fixé à son original).
- **Mise en scène** :
  - La marchande reste immobile à son étal (décision de l'opérateur, Passe D2 : « S1 : la marchande reste immobile à son étal, comme
    aujourd'hui. Consigne-le. »).
  - Les deux gardes diffèrent déjà (variante 1 pour le second, approuvée le 18/10). Restent les lances.
  - Les cinq citadins : « Cinq par défaut » (Passe D1), appliqué (Passe C2).
- **Mouvement** (Passe S2 : cadence réglée sur la vitesse vue à l'écran, pieds plantés pour la foule et les gardes ; Passe V3 : docker
  régularisé, glissement ≈ 0 en B / C / D) : restes des critiques du docker, communs à ses deux cycles : pas d'attaque du talon, botte de
  passage posée sur celle d'appui (image 4), poussée faible ; cycle 3 + 3 sans double appui (hérité du garde) ; en A, l'horloge touche son
  plancher pour un profil qui va presque en profondeur. Bras immobiles des citadins en marche : pas une priorité, décision de l'opérateur du
  18/10, mot pour mot : « les bras immobiles des citadins quand ils marchent n'est pas une priorites dans notre strucutre HD-2D, ce n'est pas problematique ».
- **Fidèles aux planches, non changés exprès** : bonnet / sac de la marchande selon la vue ; costumes des citadins différents selon la vue
  (tablier, sac, chemise).
- **Lisibilité** : tête du marteau cuit peu lisible sur la lueur de l'enclume (Passe 4A-vicies).
- **Restes mineurs** relevés par les critiques : sections « Restent » des passes 4A-tervicies et 4A-quatervicies.
- **Contrat et sources** : C2 (PNG versionné + JSON, `runtime-integration-contract.md` section 11) proposé le 16/10, appliqué par la
  distribution de production, confirmé par l'opérateur (« Confirmé », Passe D1). Originaux des planches de référence des PNJ (01-16,
  17-24, planche complémentaire) à retrouver (l'opérateur s'en charge ; ceux du casting 1 sont archivés, Passe H2) ; droits de tiers non
  vérifiés exhaustivement ; signatures C2PA lues, jamais validées (`c2patool` non installé).
- **Héros premium** (Passes H0 à H4) : casting 1 tranché par l'opérateur (design de la planche 1, pantalon foncé, planches archivées avec
  leurs PNG d'origine) ; planche v2 archivée, héros `hero-x2-v1` construit au stade lab puis écarté par l'opérateur (proportions, bras
  immobiles, cuisses trop hautes ; « experimental ») ; décision, mot pour mot : « Planche v3 (Recommandé) » ; prompt v3 prêt
  (`briefs/hero-proposal.md` § 5, trois pièces jointes) ; déclinaisons au choix du joueur : « Une base + couleurs (Recommandé) » (Passe H4) ;
  deux lots d'images évalués, non validés (brief § 11) ; planche de base archivée, `hero-x2-v2` construit au stade lab, candidat non
  approuvé (Passe H5) ; décision de l'opérateur (Passe D1) : « Retouches d'abord (visage,
  palette) ». Texture cuite élargie
  (Passe T1 : 672 images garanties). Passe H6 : vitesse du héros cuit tirée de son cycle (3,73 m/s avec le rig préparé, Maj = sprint × 1,2),
  rig préparé (14 texels, vol, genoux à 5 texels) ; export reconstruit avec Aseprite (Passe H7 : `walkSlide` 14, `--check` identique,
  glissement ≈ 0). Décisions de la Passe D1 : « Source : la b » (planche v4-b), « Cinq vues, le héros d'abord », « Sprint ×1,2 », vues du
  côté droit « Ignorées » : appliquées en Passe H8 (`hero-x2-v3`, candidat en cinq vues, revue de l'opérateur en jeu) ; visage retouché au texel en Passe H9 (yeux
  ouverts, bouche, ombre des joues ; critique à l'aveugle : 7 contre 5 sur le visage) ; fiche de revue (Passe D3) : RH1 « Production »,
  RH2 « Par défaut avec le héros » : **en production depuis la Passe H10**, cinq vues par défaut ; RH3 « Fait », RH4 « Plus tard » (les trois-quarts des PNJ). Vues de trois-quarts : étude `briefs/three-quarter-views.md` (aucun trois-quarts dos sur la planche v3 ; Passe I1 :
  deux planches générées en huit vues, trois-quarts dos compris, archivées comme sources non canoniques). Plus tard : masques du héros pour ses
  déclinaisons, écran de choix (code de jeu). Le reste des planches du casting : propositions non canoniques, design à valider avant toute
  production.
- **Personnages clés et suite de l'art** : le chat reste généré (densité ×1 ; le héros est cuit depuis la Passe H10) ; ni personnage clé ni personnage **original** au
  même niveau ; E4 non lancée. Avant d'étendre : densité du cast (héros), liseré dépendant de la densité (liseré par sprite non implémenté),
  largeurs de texel inégales à ≈ 2 px / texel, cycle de marche en A. Décision ouverte : quelles planches étaient réellement rejetées (la
  consigne de 4A en parlait sans les montrer ; les trois planches archivées sont toutes classées comme références). Le modelé ×1,5 n'est
  plus la voie principale (Passes 4A-quater / quinquies).
- **Point de QA (pas une tâche)** : PNJ ×2 près de 1 px écran / texel (caméra A, PNJ lointains) : détails d'un texel qui clignotent ;
  surveiller à chaque nouveau PNJ. Mesuré en Passe S2 (graine 1842) : distribution ×2 à 0,35-0,78 px / texel en A, 0,65-1,68 en B, 0,97-2,02
  en C, 1,15-1,29 en D ; héros ×1 à 1,6 / 3,0 / 3,3 / 2,9.

**2. Occlusion du joueur (Passes 3 / 3b)**
- Un montant sombre de la bannière du bateau n'est pas découpé par le reveal et coupe le joueur ; la casquette tombe dans la bande tramée ;
  la trame « rampe » quand l'ellipse bouge. Ne rien changer sans inventaire visuel et technique (`tools/occ-inventory.mjs`) qui justifie un
  nouvel occluder.
- Relecture humaine en mouvement (style C, rayons 40–70 / 80–120 px, fondu 0,2 / 0,3 s) ; décider si les PNJ d'interaction doivent entrer
  dans le reveal ; la passe « derrière » : coupée au gel (Passe Z1 : aucune pièce restaurée sur trois graines en 720p, 1080p et 2560 × 1080 ; 90 à
  160 ms de bake gagnés), `?occbehind=1` pour la rejouer ; rejouer l'inventaire à chaque changement de zones de caméra ou de composition (bateau, lampadaires).

**3. `SpriteRenderer`** (Passe S1 : superposition retirée, masque de protection propre, auréole mesurée en mouvement ; Passe S1b : une seule
profondeur par sprite, le décor derrière un personnage ne le coupe plus ; l'enseigne devant le forgeron est voulue, opérateur, Passe H0) —
restent des décisions d'image : le bord des feuilles cuites ×2 (frange bleutée sur le contour d'auteur ; décision du 18/10 : contour d'auteur gardé, à faire au point 2) ;
la lisibilité du forgeron dans l'in-scatter de la forge (part des personnages 45 %, `known-issues/forge-smith-inscatter-C.png`) ; un halo placé
devant un personnage s'applique désormais entièrement (B : héros sous la lanterne, plus clair au visage).

**4. Zones de caméra** — validées par simulation (Passe 4B, `tools/camsim.mjs`), pas par de vrais joueurs : (a) D place toujours le joueur
**à droite** du centre (NDC +0,35 → +0,68), contrepartie de la continuité avec C ; (b) le long du bord de l'eau (z > 2,4) on passe **B → D**
sans traverser C ; (c) lacet max 0,96° / image en C ↔ D (≤ 0,55° ailleurs) ; (d) les transitions B → C vers l'ouest (−254 px/s) et B → A
(−131 px/s) font glisser le joueur à l'envers à l'écran (héritage de la passe 2, mesuré en 4B ; Passe K1 : B → A remesuré −139 px/s, C → B
0 ; **transitions ancrées partout préparées derrière `?camblend=anchored`** : B → A 0 image de recul au lieu de 14, pic +21 px/s au lieu de +181 ;
« Oui, par défaut » (Passe D1), appliqué (Passe K4) ; preuve de visibilité sur GPU faite, Passe G1 ; le reste demanderait de recaler le pivot de A :
« Cherche et montre-moi » : pivot de A x 5,8 trouvé, avant / après montré, Passe K5 ; RK1 « Appliquer 5,8 », Passe D3 : appliqué, Passe K6) ; (e) reculs du joueur à l'écran en cadrage posé C / D (−15 à
−39 px/s, Passe K1) : expliqués en Passes K2 / K3 (le pivot de D, qui suit 85 % du déplacement latéral, dépasse un joueur que sa marche en profondeur
ralentit à l'écran ; le suivi le long des axes de la caméra n'y change rien) ; suivi visant la vitesse à l'écran :
« Prototyper le suivi à l'écran » (Passe D1) : prototype `?camfollow=screen` (Passe K5 : 0 image de recul sur C ↔ D et D → B), RK2
« Adopter (avec la preuve) » (Passe D3) : par défaut depuis la Passe K7 (`?camfollow=off` : l'ancien suivi) ; (f) recul de −445 px/s pendant C → B au bord de l'eau (Passe K5), RK3
« Diagnostiquer avant le gel » (Passe D3) : expliqué en Passe K8 (le fondu ancré recentre le joueur qui bute au bord ; options à décider). Contrainte : la caméra de D reste
à z < ~18,5 (maisons de la rive opposée dès z = 19,8, invisibles de A/B/C) ; tout cadrage plus reculé exige de les retirer ou de les abaisser.

**5. Visibilité / culling**
- **Décision de l'opérateur (Passe D1)** : « Géométrie au gel, pas de ×4 » : les corrections de géométrie (fissures, quai coplanaire) au gel
  du district, faites en Passe Z2 ; ni D ×4 ni poses AB à w = 0,5 (maison 609).
- **Écarts connus de `viewport-proof`** (9 échecs en Passe 5b ; 8 avec l'ancrage, Passe G1 ; 13 avec le pivot de A à 5,8, Passe K6 ;
  **5 depuis le gel, Passe Z2** : les fissures MSAA sont fermées, 7719 A / C, 1842 BC, 30417 D lointain et CD en 720p) : des lanières plus fines
  qu'un pixel du bake (1842 A en 1080p et en 2560 × 1080, AB en 2560 × 1080 : pièces 179 et 515, Passe K6 ; 1842 D lointain 2560 × 1080 ;
  30417 D lointain 665 × 1200 : partie 73) ; maison 609 (30417 AB, plus en échec depuis l'ancrage de AB, Passe G1). Pixels « order » (30417 B 109 px, AB 31 px, A / BC 1 px en 720p) rapportés sans échouer. Tout nouvel écart :
  `tools/vis-why.mjs` avant de toucher au bake.
- **Écart hérité [?]** : 17 px d'étincelle dans le canal coupés par le bake (B, joueur 15,5 ; −2,7), `known-issues/pass2-vis-speck.png` ;
  Passe 5b (1842, 720p) : 6 px aujourd'hui ; 6 lanières forcées (reflets de maisons de la ville moyenne, murs est de `bg2` / `tall`) → 1 px,
  non élucidé.
- **Coût d'un bake neuf** : le cache (P5, Passe 6d) relit un bake en 36 ms au lieu de 337 ; un bake neuf reste ≈ 300 ms par pages (Passe 5,
  273 poses), génération ≈ 910 ms. Piste : n'échantillonner que les poses concernées quand seul un réglage de caméra change ; réduire CD / BD
  (168 poses sur 273) a coûté 4 pièces de Tier 3 en précision : seulement avec une preuve.
- **Ordre des classes de dessin** : 41 classes, A/B/C pondérés ×2 (D dessine ≈ tout : 98,8 k / 100,8 k). Si D s'alourdit (nouveau
  contenu), rejouer `planDraw` avec un autre poids ou séparer D dans un mesh à part (+ appels de dessin).

**6. Performances GPU (Passes 6 à 6k, plan P0-P9 terminé, tout accepté et fusionné)** — Restent [?] : la cause du ralentissement des
rappels rAF de la passe 6j (ni charge CPU ni charge GPU ; hypothèse : rafraîchissement dynamique de l'écran ou du pilote) ; une lecture de
vsync trop **basse** n'est pas corrigée par le contrôle en session (jamais observée). Non mesuré : autres navigateurs / GPU, cache de
shaders d'un profil persistant, 780M sans contention (fenêtre calme, témoin à l'appui). Écartés (mesurés, Passe 6) : pré-passage de
profondeur (≤ 0,75 ms en 1080p avant son propre coût), filtre de l'ombre de lune (≤ 4 %) ; FXAA, qui flouterait le pixel-art sans masque des
sprites.

**6b. Météo (Passes W1 / W2)** — pluie, neige, orage, vent derrière `?rain` / `?snow` / `?storm` / `?wind`, défaut inchangé (0 px), réglables
en jouant dans le panneau DEV (section « Weather »). Restent : le
jugement de l'opérateur en jeu et en mouvement (vent sur les bannières,
pluie qui tombe, éclairs), météo par défaut : « Nuit claire par défaut » (Passe D1) ; non faits : son (le jeu n'en a pas), éclaboussures
au sol, neige sur les personnages. Éclair dessiné dans le ciel : Passe W3.

**6c. Arène (Passes A1 à A3, P1, P2)** — **dans le jeu derrière `?scene=arena`** (Passe P1 : simulation portée et prouvée contre le
prototype, décor du district, combattants générés ×2, HUD au style du jeu ; la ville inchangée, 0 px ; Passe P2 : quatre critiques à
l'aveugle, de 6,5 / 7 à 7,5 / 5,5 contre le prototype). Jouable en artefact privé : https://claude.ai/artifact/EzSKUGk1jrCSxLENY5CC44 (à
republier avec `tools/arena-scene-page.mjs` après un changement). Le prototype `arena/arena.html` reste la référence de ses règles.
**Décisions de l'opérateur (Passe D1)** : entrée depuis la ville « Plus tard » ; combattants « Générés pour l'instant » ; nombres du combat
« Régler après essai » ; assistance « Discrète ». Temps GPU mesuré sur la 780M (Passe G1 : 9,3 ms en 1080p). **À voir sur sa machine** : cadence, lecture en mouvement,
la page publiée dans le visualiseur. Restes : visages des combattants (la grammaire du générateur), anneau de dalles peu visible (l'occlusion
de contact des surfaces l'assombrit au ras du sol), spectateurs debout, 23 sources de lumière sur 24, ralenti sous 20 images/s.

**6d. Jour et nuit (note de l'opérateur, Passe D1)** — mot pour mot : « Mais prend en compte que nous aurons un etat jour et nuit, et jour sera l'etat par defaut qui represente les evenements principaux du jeu : le deroule du tournoi ». Le jeu n'a aujourd'hui que la nuit (direction
artistique verrouillée d'`AGENTS.md`) ; un état jour demandera sa propre direction artistique, décidée avec l'opérateur, avant tout code. RJ2 « L'état jour » (Passe D3) :
c'est la suite après la clôture du district.

**7. Outillage, documentation, dette**
- **Port 5173** partagé avec un autre projet local et `vite.config.ts` sans `strictPort` : les outils peuvent photographier la mauvaise
  appli. Servir les baselines sur `:518x --strictPort` ; décision « strictPort » (Passe D1), appliquée (Passe O1).
- **Tests et CI — restes (Passe Q1)** : le libellé `ubuntu-latest` passe à Ubuntu 26 dès le 19/10 (« Épingler 24.04 », Passe D1, appliqué
  en Passe O1) ; les tests ne sont pas typés (`.mjs`, hors `tsconfig`). Fonctions pures et refus « images manquantes » : testés (Passe Q2).
- **Code mort mineur** (Passe M5) : des `void x;` qui taisent des paramètres, des types exportés sans usage hors de leur fichier.
- **Archivage du journal** : « Branche fusionnée suffit » (Passe D1, `AGENTS.md` mis à jour). Derniers archivages : H1-H4 (Passe B1), H5-P2
  (Passe D1), H7-D2 (Passe Z2) ; le prochain au-delà d'environ 60 Ko de passes gardées.
- **Dette** : l'ancienne rive opposée (`row(...)` en « sec ») rejoue ses tirages sans rien dessiner — « Retirer au gel » (Passe D1) : au gel
  du district, avec des captures du fond avant / après (la ville lointaine décale d'une graine).

## Principes à garder

> Dédoublonnés et regroupés le 18/10 (Passe M3 ; liste précédente : `git show 7086340:JOURNAL.md`). Ce qu'`AGENTS.md` dit déjà n'est pas
> recopié ici.

### Mesure et performances
- Mesurer d'abord, optimiser ensuite : minuteurs GPU, variantes entrelacées dans une seule session, base figée. Relever l'adaptateur
  réellement utilisé (`WEBGL_debug_renderer_info`) dans chaque mesure : un portable hybride rend sur l'iGPU par défaut, quoi que demande
  `powerPreference`. Mesurer à la définition de l'écran de l'opérateur (dpr compris), pas seulement en 1080p.
- Un temps GPU pris sur un poste partagé ne vaut qu'avec son témoin de contention (autres processus sur le même adaptateur) ; à défaut, le
  minimum des tours entrelacés est l'estimation sans contention. La traîne du temps d'image en headless n'est pas une mesure.
- Une première fois (programme, variante, dessin) se mesure par une sonde dédiée : aucune moyenne ne la voit. Un intervalle rAF ne
  s'attribue qu'avec un repère (le départ de la boucle, un `gl.finish()` chronométré) : le plus grand intervalle depuis le chargement est le
  plus long bloc synchrone, pas forcément la première image.
- Un travail de démarrage déplacé dans un Worker reste une fonction pure à graine fixe ; il se prouve à l'octet (empreinte de chaque sortie,
  ordre de création des objets qui tirent `Math.random`) et par ses pannes injectées ; le jeu démarre sans Worker (repli par job, chien de
  garde). Une sonde de démarrage observe dès le premier repère, pas depuis `DOMContentLoaded`.
- Une cadence se mesure dans une vraie fenêtre avec vsync (`tools/cadence.mjs`), une « surcharge » en watts (RAPL, SoC = boîtier − cœurs),
  pas en % d'occupation GPU. La vsync se sonde au repos (les rappels que le plafond saute) : la médiane ou le minimum des horodatages rAF de
  la boucle ne la retrouvent pas, leur grille (le plus grand intervalle dont ils sont tous multiples) si ; une grandeur qui peut changer
  pendant la session (le rythme des rappels de Chrome) se revérifie pendant la session, avec des échantillons qu'elle ne fausse pas (passe 6k).
- La cadence préfère la régularité au nombre d'images (choix de l'opérateur, `e60` puis `a60`) : quand le GPU ne tient plus son créneau, un
  pas plus long et régulier plutôt qu'un mélange ; le retour au pas court se vérifie par un essai.
- Une passe plein écran se paie d'abord en bande passante : réduire ses échantillons sans retirer la passe ne gagne rien sur une iGPU ; un
  effet « en demi-résolution » ne paie que si sa recomposition tient dans une passe qui existe déjà (passe 6j).
- Un nombre écrit par un script pour un autre programme s'écrit dans la culture invariante, et en entier quand c'est un compteur ; un
  lecteur qui reçoit l'illisible le dit (passe 6i).
- Un résultat calculé mis en cache se relit seulement pour les mêmes entrées exactes : la clé couvre tout ce qu'il lit (géométrie, poses,
  réglages, code du calcul, GPU) ; une entrée douteuse est un échec de cache, jamais un culling.
- Une allocation, un plafond matériel ou une texture partagée se dimensionne contre le minimum **garanti** par la norme (WebGL2 : 2 048),
  jamais la valeur de la machine de développement, et se vérifie (complétude du framebuffer, erreurs GL) ; une texture partagée se
  dimensionne pour la distribution entière, candidats compris, avant de les ajouter (l'adressage par case entière permet d'élargir sans
  changer une image).

- Sans GPU (séance cloud), le rendu logiciel (SwiftShader) sert les preuves d'image déterministes (0 px entre deux versions) et les compteurs
  (appels de dessin, triangles, surface couverte) ; jamais les temps : ceux-là se mesurent sur la machine de l'opérateur (Passe T1).
### Visibilité, rendu, caméras
- Toute coupe de géométrie se prouve par un diff d'images `static=1`, culling actif contre `vis=0`, avec `occ=0` : la phase du fondu de
  reveal entre deux régénérations fabrique de faux écarts (1 377 px sur B).
- La rastérisation dépend de la position d'une tuile dans sa cible : les comptes bruts ne se comparent qu'à mise en page égale ; la
  non-régression se prouve sur les masques et les images finales.
- Un écart élagué / `vis=0` s'explique **causalement** (`tools/vis-why.mjs` : pièce forcée → 0 px ; témoin d'ordre) avant de toucher au bake ;
  un pixel décidé par l'ordre de dessin (faces coplanaires) ou par un seul échantillon MSAA (fissure) ne dit rien du culling.
- Le bake échantillonne des points : monter sa résolution fait aussi perdre des pièces ; un supplément s'ajoute aux comptes (tuiles fines
  additives) et va là où la géométrie se présente de chant (D). Toute modification des masques replanifie les classes : prouver le rendu
  canonique contre une base figée, pas seulement contre `vis=0`.
- Le besoin d'une pièce se mesure **par jeu de poses** (stables et mélanges séparés) ; mélanger les deux fait dessiner en C stable ce que seul
  un mélange voit. Pondérer les cadrages historiques pour qu'un nouveau cadrage ne les alourdisse pas.
- Ne pas ajouter de contenu pour combler le vide ; dépenser la complexité là où la caméra la perçoit.
- Garder le déterminisme par graine : toute suppression de code doit préserver les tirages aléatoires.
- Un `discard` ne se paie que là où il sert : variante de matériau liée seulement pendant l'effet, sinon le matériau de slot d'origine ;
  « au repos » doit coûter exactement la passe précédente (mêmes appels de dessin, image pixel-identique).
- Ne taguer que ce que l'inventaire mesure (rayons caméra → joueur contre les vrais triangles), jamais ce que l'intuition suggère.
- Le DOF et le masque de protection (alpha de scène) sont des contrats : un effet qui écrit de l'alpha ne doit pas toucher ce canal. Tout ce
  qui est dessiné après la passe opaque garde l'alpha de destination (`maskSafeBlending`) : un canal-contrat se protège à l'écriture, pas en le
  réparant après coup ; un mode de mélange de bibliothèque se lit dans son code (prémultiplié ou non) avant d'être réécrit (Passe S1).
- Un échantillonnage « au plus proche » du matériel ne se rejoue pas par une formule : on retrouve le texel par sa valeur (Passe S1).
- Un nouveau cadrage se cherche **empiriquement** (`tools/camsearch.mjs`) et se valide en **marchant** (`tools/camsim.mjs`) : la vitesse du
  joueur à l'écran pendant la transition ne doit jamais changer de signe par rapport à sa marche ; une transition interpolée entre deux
  cadrages hérite de l'écart de position écran des deux, d'où l'ancrage (`blendPose`) + un cadrage cible calé sur la sortie du cadrage
  précédent.
- Une caméra qui recule traverse la géométrie qui est « derrière la caméra » des autres cadrages : vérifier z caméra contre ce qui est généré
  de ce côté (rive opposée).

- Un recul du joueur à l'écran se décompose avant d'être corrigé : part du joueur (caméra figée) et part de la caméra (joueur figé),
  vérifiées contre la mesure ; une hypothèse plausible non décomposée a coûté un prototype inutile (Passes K2 / K3).
- Un quad construit dans le shader (une traînée orientée par sa vitesse à l'écran) se dessine double face ; un « rien à l'écran » se vérifie
  d'abord au compteur d'appels de dessin, puis en agrandissant l'effet (Passe W1).
- Un effet « local » sommé sur beaucoup de sources se mesure loin d'elles (une traîne en 1 / d² négligeable pour une lanterne colore tout le
  cadre pour quatorze) ; une teinte se corrige après avoir coupé les effets un à un et mesuré (Passe A2).
- Un effet qui écrit des uniformes partagés garde leurs valeurs d'avant et les rend : sa preuve est « activé puis retiré = 0 px » (Passe W2) ;
  tant qu'aucun paramètre ne le demande, il ne crée rien (un objet THREE tire `Math.random`).
### Preuves
- Un défaut relevé sur une capture se vérifie dans la page avant de corriger l'image : il peut venir de la capture (Passe P2 : chiffres de
  dégâts retirés par leur minuterie avant la photo).
- Un port de logique se prouve contre l'original exécuté à côté (mêmes entrées, mêmes événements et même état à chaque pas), sur des
  entrées dont le test vérifie qu'elles atteignent chaque chemin ; des fautes injectées une à une doivent le faire échouer (Passe P1 : le
  script d'empreinte seul en laissait passer trois sur quatre).
- Une preuve doit pouvoir échouer : un contrôle négatif avant d'accepter « 0 écart » (Lab : `filter=linear` ; revue d'agent : un défaut
  planté qu'elle doit trouver à l'aveugle ; « 0 trou » : remplissage depuis le bord ; mesure de stabilité en mouvement : un cas connu
  mauvais qu'elle doit séparer, sinon elle ne vaut que comme indice et le jugement reste visuel). Un résultat « 0 » d'un outil se recoupe
  avec une valeur connue avant d'être cru. Un test unitaire aussi : des fautes injectées une à une, chacune attrapée ; son oracle est
  indépendant du code testé (pas d'aller-retour par lui) et ses données exercent les cas limites (égalités, bords), vérifiés par le test même
  (Passe Q1).
- Une preuve « pixel-identique » exige une capture déterministe : `Math.random` à graine, pas fixes, horloge figée, RNG internes remis à
  zéro, une chauffe par cadrage **et par origine** (serveur), et un témoin de répétition (deux chargements : 0 px) **avant** toute
  comparaison ; un écart d'un niveau sur 255 se traque par sondes de variantes du shader. Avec des personnages, la boucle du jeu ne doit
  jamais tourner hors du harnais (`App.start` neutralisé dès le chargement, Passe M5).
- Pendant une série de mesures ou de captures sur un serveur de développement, ne rien modifier ni reconstruire de ce qu'il sert (`src/`
  compris : rechargement HMR) ; recadrer une preuve par projection, jamais par supposition ; un masquage d'acteur se vérifie (base masquée
  contre base non masquée) : avec la distribution cuite, un acteur porte l'id de sa planche.
- Une auréole se mesure : ce que le post-traitement fait changer autour d'une silhouette, personnage présent / absent, image par image en
  mouvement, puis effet par effet (`tools/sprite-halo.mjs`, Passe S1).
- Une échelle écran se dérive du code caméra du jeu à la position réelle du joueur (`evalAnchor` + `applyPose`), jamais de la distance de
  pivot d'un cadrage.
- Ajouter des sprites ne doit rien changer aux autres : une texture qui ne grandit jamais pour les sprites validés, et pour les nouveaux un
  adressage par case entière (t ∈ [0, 1] × taille de case, plancher + clamp, lecture au centre du texel) qui ne dépend ni de la taille de
  l'atlas ni de la place de la case. Des octets identiques ne garantissent pas une image identique : `floor(vUv × taille)` départage les
  égalités exactes (bord de texel au centre d'un pixel) selon la taille de la texture, et une formule normalisée par la taille de la texture
  ne peut pas y être stable. Toute croissance d'atlas se prouve par un balayage d'échelles, pas par quelques captures.
- Plusieurs densités de sprites partagent un seul renderer si chaque densité *k* garde le même rectangle monde (cadre 32k × 48k, pieds à 45k) :
  la densité est une affaire d'atlas, la hauteur une affaire d'instance.

- Un serveur de mesure sert un instantané figé (copie hors dépôt), pas la copie de travail : on peut éditer pendant la série sans
  recharger les pages mesurées (Passes H6, K1).
- Passer du jour à la nuit inverse les contrastes : un repère « plus sombre que le sol » doit devenir « plus clair » ; un seuil chiffré
  (contraste du télégraphe) le voit, l'œil sur une capture non ; une critique d'art qui contredit le seuil garde sa teinte et prend la
  luminance ailleurs (Passes A1 / A2).
- Une propriété aléatoire se teste sur plusieurs tirages (dix éclairs, deux caps de caméra), un repli dans ses deux sens (±π) : un seul cas
  laisse passer une faute injectée (Passes Q2, W3).
### Personnages : art et critique
- La densité d'un sprite se choisit par la taille de son texel à l'écran dans le cadrage où il vit (l'arène : ×2 pour ≈ 3 px / texel en 1080p,
  comme les personnages de la ville), pas par celle de l'image source (Passe P1).
- Un personnage se juge **dans la scène** à chaque itération (aperçu `?labsprite`, avant / après au même endroit) et **à côté du cast
  existant** (héros compris : densité de texel, proportions et hauteur monde à la même profondeur), pas seulement agrandi ni contre la
  référence : lumière chaude, liseré et voisinage du cast changent la lecture.
- Une critique d'art voit l'image, lit à froid avant la consigne, cite des pixels et vérifie la passe précédente ; le score monte avec des
  preuves, pas avec des intentions. Critique à l'aveugle = étiquettes tirées au sort, clé hors du champ du critique, nouvel agent à chaque
  tour, auto-critique écrite **avant** de lire le verdict. Toute correction ou reprise (de rig comprise, comptée contre la planche
  précédente) repasse une critique à l'aveugle par un agent neuf : elle crée ses propres pertes ; une retouche qui ne gagne pas clairement à
  l'aveugle est annulée, pas empilée.
- Une métrique de propreté (pixels isolés, alternances) n'est pas une métrique de forme : seule une critique aveugle juge la lecture du volume.
- Le classement des références (cible / support / rejet) se fait **confirmer par l'opérateur avant de produire** ; on mesure une référence
  (grille, taille, couleurs) avant d'en déduire une contrainte de résolution ou de technique.
- Avant une génération, comparer le brief lui-même aux personnages des références qui seront jointes : une combinaison de traits peut
  déjà décrire un personnage existant ; la liste de contrôle d'originalité nomme ces personnages.
- Un modelé se peint par **masses** (3-4 valeurs par forme, plis rendus par le bord des aplats) ; une spécification pixel par pixel écrite en
  texte donne de la moucheture (alternances) ou des blocs. La forme vient d'abord de l'information de la source (densité, dégradés peints) :
  préserver sa qualité, puis une finition ciblée ; la finition par agent est fiable pour les défauts **nommés et localisés**, pas pour
  repeindre un volume.
- Les contraintes de l'asset reconstruit (cadre 64 × 96, pieds rangée 90, anneau transparent, alpha binaire) ne s'imposent pas à
  l'illustration source : on ne dégrade jamais le modelé, l'expression ou les matières d'une source pour obtenir une grille parfaite ; la
  mesure de la source règle la reconstruction, elle ne la refuse pas.
- Une hauteur de présentation se décide sur la figure **dessinée** (mesurée dans l'atlas), pas sur une valeur nominale du code ; une carrure
  ne se corrige pas par l'échelle : les proportions se chiffrent dans le prompt et se mesurent sur la source avant toute reconstruction.
- Un personnage plus grand que le cadre se rééchantillonne à un pas plus grossier et se présente à l'échelle commune : une densité de texel
  unique dans la scène prime sur la taille relative de la planche (écart chiffré et consigné).
- Les vues qu'il faut à une marche (face, dos, profil) se prennent sur une planche multi-vues de la même échelle, jamais inventées depuis une
  seule face ; la recette entière (recadrages, palette, retouches, animation) vit dans un script de rig rejouable au texel près.
- Une famille de personnages se produit par gabarit, mais chaque vue se mesure avant : sens du profil contre la planche (avant tout miroir),
  rangée basse de chaque jambe (l'ombre du sol de la planche décale toute une vue), boîte de la seule matière pour une gamme peinte (filtrée
  par sa teinte), boîte de la pièce pour une botte.
- Après toute reconstruction, chercher les bandes quasi noires de la fermeture verticale entre deux masses (nuque / épaules, entre les jambes)
  et les comparer à la planche, pas à la reconstruction : elles se lisent comme des cheveux ou des sangles qui n'existent pas. Remède retenu
  (4A-unvicies) : `reconstruct-grid --closing-from=48` : pas de fermeture au-dessus de la taille, gardée en dessous (elle y restaure les
  contours sombres des jambes et des bottes ; la couper partout les a perdus) ; compter avant / après le fond enclavé et les zones des pieds.
- Retouche ciblée : changer la **chroma** d'une zone fautive en gardant ses valeurs corrige sans repeindre ; ajouter une masse sombre crée un
  nouveau motif (ras-de-cou).
- La copie assombrie d'une pièce lointaine (botte, jambe) garde un plancher de clarté (jamais sous sa propre clarté ni sous un seuil) :
  une soustraction constante écrase les tons sombres au noir du contour. Deux pièces de même forme se séparent d'abord par la profondeur
  (la lointaine plus haut à l'écran) puis par la valeur, et une pièce déplacée se borne à ce qui la cache.
- Une pièce animée emporte son contour (une colonne de contour à deux texels de la peau, une rangée basse rangée dans un autre calque) ; ce
  qu'elle découvre prend ce qui est derrière elle dans le sens du mouvement (au-dessus pour ce qui descend, en dessous pour ce qui monte),
  jamais une couleur prise de côté hors de portée.
- Un mouvement destiné à se lire en jeu se dimensionne en pixels écran (2 texels à ~1,8 px / texel), pas en texels de la planche, et se fixe
  explicitement (rebond imposé de 2 rangées au contact) : il ne se déduit pas seulement de l'IK ; une affirmation de critique se mesure
  (rangées, texels) avant d'être corrigée.
- Une marche capturée se fait à **pas fixe** avec les **vraies entrées**, sur un itinéraire d'abord validé sans rendu (`camsim`) ; chaque
  image se rend avant d'être capturée ; un témoin (même art, autre densité, **même renderer**) sur le même trajet est la seule référence qui
  donne un sens aux chiffres de stabilité.
- La vue d'un personnage qui marche se tire de son pas projeté à l'écran (avec hystérésis), pas de l'angle de son cap avec l'axe de la
  caméra : sous un tangage de 8°, 20° de cap font déjà ~55° à l'écran. Un regard mis en scène (spawn, conversation) garde la règle monde.
- La cadence d'une marche cuite suit la vitesse que montrent ses pas : de profil, la vitesse le long de l'axe droit de la caméra (le seul
  axe où le sprite montre le glissement du pied), de face ou de dos la vitesse entière, sur la vitesse que dessine le cycle à l'échelle du
  cadrage ; un glissement se mesure dans cet axe, en mouvement (`tools/foot-slip.mjs`, Passe S2).
- Un personnage qui agit sur un objet (frappe, geste) regarde l'objet : son orientation se calcule depuis la géométrie (vecteur personnage →
  point d'action), jamais un angle choisi pour l'apparence ; un cycle qui n'existe que de profil en tire son côté écran dans tout cadrage.
- Un cycle synchronisé avec un effet (étincelles du marteau) garde son nombre d'images et l'image de l'impact ; le moteur n'a pas de durée
  par image.
- Un cycle cuit se règle sur la mesure du moteur (`walkSlide` : centre des appuis sur la rangée des pieds) : botte de contact à plat, pied
  arrière qui quitte la rangée au décollement ; une inclinaison ou une pointe qui traîne rendent le cycle irrégulier (Passe V3).
- Une mesure qu'avance un critique (dérive, rangées, texels) se vérifie sur les pixels de sa propre planche avant de peser son verdict ; une
  planche de critique reproduit l'avance réelle du jeu et se lit à 1:1 ; un désaccord qui persiste revient à l'opérateur, image en mouvement à
  l'appui (Passe V3).
- Une planche source se mesure contre la distribution avant toute construction (tête sur hauteur, largeur du visage, jambes, même lecture),
  et une « course » générée se vérifie contre les vues de repos (même échelle, même buste) avant d'être prise pour un cycle (Passe H3).
- Un membre ne s'anime que s'il est séparable dans la vue (bras détaché du buste : à demander à la source) ; une texture peinte chargée se
  fragmente une fois tournée, des membres peints dans les teintes de la vue restent lisibles (Passe H3).
- Le balancement d'un bras de profil se lit sur le bras proche, images alignées sur la tête (en course, un poing est toujours devant) ; une
  planche de casting choisit une direction, une source se juge à la taille de ses figures contre les 85 rangées du sprite (Passe H4).
- Une course dessinée en poses extrêmes se complète par cisaillement des jambes depuis la hanche, pied à plat ; le halo du fond d'une
  planche se mesure sur le contour et se retire au rig avant la critique (Passe H5).
- Un masque de matière se vérifie contre la planche de référence : des texels « oubliés » peuvent être la bonne matière et la zone autour la
  fausse (manches du forgeron, Passe V3) ; une ombre que les règles ne prennent pas se relève à la main (rectangle forcé), pas par une règle
  générale.

- La vitesse de jeu d'un personnage cuit suit son cycle dessiné (`walkSlide` × échelle × horloge visée) : changer l'enjambée change la
  vitesse, sans patin ; un glissement médian de quelques pour cent se vérifie contre la quantification (5 ou 6 pas de 1/60 s par image)
  avant d'être corrigé (Passe H6).
- Une planche « tournante » se mesure vue par vue (boîtes, orientation) avant d'en compter les vues de trois-quarts : deux dos ne font pas un
  trois-quarts dos (Passe H6).
- Une fiche d'arbitrages se bâtit sur l'état du dépôt (fichiers approuvés, code), pas sur « À reprendre » seul : une ligne restée à l'ancien
  état fait reposer une question déjà tranchée (Passe D1, V1 et S2). Une note qui contredit l'option cliquée suspend la décision.
### Provenance et approbations
- Rien d'externe ne devient « canon » en silence : un manifeste de provenance (`art-lab/characters/manifests`) avec approbation nommée et
  datée est la seule voie vers `runtimeUse: production`. Deux niveaux d'approbation distincts : *approved visual baseline*
  (`approved: true` + `runtimeUse: "lab"`) et *approved production asset* (`runtimeUse: "production"`, tâche explicite + droits confirmés).
  Une approbation de production ne s'écrit jamais au nom de l'opérateur : l'intégration se prépare derrière la porte du manifeste et
  l'opérateur l'ouvre. Une source aux droits non confirmés s'archive par empreinte, jamais par copie dans Git.
- Une approbation visuelle se fige tout de suite : empreintes SHA-256, paramètres, décisions datées, script de vérification ; un artefact
  approuvé ne vit pas seulement dans un dossier ignoré sans que l'opérateur le sache.
- La révision d'un asset approuvé se projette sur sa palette approuvée, épinglée en fichier (aucune couleur nouvelle), et s'inscrit à côté de
  l'approbation (demande citée, empreinte précédente, comptes de texels) ; la confirmation de l'opérateur se demande, elle ne se présume pas.
- Une provenance confirmée par l'opérateur se consigne **mot pour mot et datée**, distincte d'une vérification technique (C2PA) ; ce qui
  manque ne se déduit pas. L'absence d'original n'interdit pas à elle seule la production : droits et autorisation s'évaluent à part. Un
  statut remplacé se garde dans un historique, jamais effacé.
- Une image qui sert de référence se garde **dans son fichier d'origine** (PNG téléchargé, manifeste C2PA intact) dès le premier jour : une
  copie collée en séance est transcodée et perd toute provenance. Une correspondance visuelle se chiffre contre des témoins (elle-même = 0,
  planche sœur = 23) avant d'être affirmée ou exclue ; le numéro d'un fichier téléchargé ne dit pas quelle planche c'est (Passe H2).
- Un lecteur de métadonnées écrit pour l'occasion (C2PA) se valide d'abord sur un fichier aux valeurs déjà consignées ; une liaison dure
  recalculée prouve l'intégrité des octets liés au manifeste, pas la signature (Passe H2).
- Une source archivée se versionne **à l'octet** (empreinte et `cmp` avant commit, attribut binaire) avec une fiche : nature (copie ou
  original), provenance déclarée, droits, dérivés et commande de reconstruction ; jamais de faux original ni de métadonnée fabriquée ;
  `art:validate` revérifie ses octets contre la fiche à chaque passage, contrôle négatif à l'appui.
- Un outil figé par empreinte dans un paquet approuvé s'étend par options désactivées par défaut, prouvées par le `--rebuild` du paquet ;
  l'empreinte se met alors à jour avec une note de maintenance (ancienne valeur gardée).

### Outillage, documentation, processus
- Un outil externe de production d'art (Aseprite et son agent) n'étant jamais une dépendance (`AGENTS.md`), une passe d'outillage se prouve
  par un bundle `dist` identique au SHA-256 et 0 px de différence sur les quatre cadrages. Il s'installe épinglé (version exacte, tag,
  auto-update coupé), en portée locale, après lecture de son code d'installation et un dry-run ; jamais avec l'installeur « tout-en-un »
  d'amont s'il écrit hors de cette portée. Pour toute passe d'art : pont persistant, Aseprite relancé après lui, test de fumée
  `smoke-test/4a0b/` après toute mise à jour (`art-lab/README.md`).
- Ne jamais écrire « validé » pour un logiciel qu'on n'a pas exécuté : `art:doctor` affiche l'état réel (`NOT INSTALLED` est un état
  valide) ; « validé » appartient à un test de bout en bout (4A-0B).
- Le chargement des instructions d'agent se mesure (`/context` dans une session neuve) : jamais de `CLAUDE.md` dans un dossier parent d'un
  projet qui vit de son `AGENTS.md`.
- Un statut de README se réécrit à l'état courant, daté, avec un renvoi au journal pour l'historique ; « À reprendre » ne garde que l'ouvert :
  ce qui est fait en sort à la clôture de sa passe (Passe M3). De même pour les images : les références (`screenshots/calibration/`) se
  refont à chaque changement visible du jeu, les preuves des passes closes vivent dans l'historique git (Passe M5).
- Une autorisation de suppression vaut pour la liste et la taille annoncées ; ce qui manquait au décompte se redemande (Passe M5).
- Des fins de ligne se comptent en octets (node) : sous Git Bash, `sed -i` retire les CR et `grep` / `cat -A` ne les montrent pas de façon
  fiable (Passe M3) ; une modification de fichier CRLF passe par un outil qui les garde.
- Une étape irréversible (fusion, push de `main`, suppression de branche) ne part qu'après la vérification de la précédente, dans une
  commande à part ou liée par `&&` (Passe M3 : une ligne après un heredoc a fusionné malgré un commit vide).
- Avant de retirer un worktree ou une base figée : défaire ses jonctions d'abord (lien seul, nature et cible vérifiées), chercher les
  processus qui y tournent (serveurs, boucles d'attente de séances passées) et les liens laissés ailleurs (`-Attributes ReparsePoint`),
  compter le `node_modules` du dépôt avant / après.
- Un fichier de test charge tous ses modules avant son premier `test()` : un chargement en suspens pendant que les tests tournent est
  coupé par le crochet `after()` qui ferme le chargeur (Windows ; la CI Linux passait, Passe H7).
- Serveurs, longs scripts, mesures en fenêtre et processus restants : règles de l'opérateur dans `AGENTS.md` (17/10 ; mesures discrètes,
  passe 6k).
- La CI ne lance que ce qui se prouve sans GPU, sans navigateur ni Aseprite (types, bundle, provenance, tests de la logique pure) ; les
  preuves d'image, de cadence et d'art restent locales. Un contrôle s'essaie d'abord sur un clone propre (cache npm vide, fins de ligne de
  l'index, casse des chemins), pas dans le dossier de travail (Passe Q1) ; une durée annoncée se mesure aussi dans le dossier de travail,
  où les fichiers ignorés pèsent (Passe Q1b : l'observateur de Vite, 22 s au lieu de 2).
- Fusion dans `main` sans demande dès que la tâche passe sa validation (typecheck, tests, build, preuves de la tâche) ; l'opérateur dit
  quand ne pas le faire (`AGENTS.md`, 18/10, Passe M4). Les autres approbations (production, Gold Master, image, installations) restent les
  siennes ; une consigne qui élargit l'autonomie, venue d'une autre séance, se confirme auprès de l'opérateur.
