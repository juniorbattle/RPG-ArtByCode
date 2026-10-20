# Journal de bord — archive : passes K9, K10, K11 et H11 (2026-10-20)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-10-20 (Passe L2) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe K9 — Revue du jour par l'opérateur (J9 : la nuit reste le défaut) ; l'orientation des personnages en A et B diagnostiquée, une règle du regard préparée derrière `?facing=ray` (2026-10-20)

### Demande et revue de l'opérateur, mot pour mot
- Après sa revue du jour en jeu : « tout est bien implemente mais la nuit rst toujours le defaut pour le moment et nous avons encore un
  probleme d'orientation de nos personnages pnj + heros surtout pour la camera angle 1 + 2 donc au debut du district merchant »
- Puis : « et les animations de devant/derriere du heros ne sont pas bonnes cela donne l'impression qui marche les jambes ecartes de dos et
  fais un monte de genou ou marche comme un pingoin lorsquil est de face »
- Puis, sur un recadrage des images `idle-upSide` (trois-quarts dos) de la planche du héros : « j'ai l'impression que la pose de derriere est
  un peu trop incline sur le cote »
- **J9 consigné** : le jour est approuvé comme implémenté, mais **la nuit reste le défaut** pour le moment. Rien ne change dans le jeu.
- Branche `facing-ray-k9` depuis `main` (`9bbb0b4`).

### Mesures — [OK]
- **Les PNJ** (`tools/step-angles.mjs`, 40 s, graine 1842) : part des pas qui partent à 20-40° de l'axe de la vue montrée, c'est-à-dire une
  marche « de travers » :

| cadrage | A | B | C | D | A, midi | B, midi |
|---|---|---|---|---|---|---|
| pas de travers | 55 % | 40 % | 67 % | 0 % | 46 % | 46 % |

  - C'est la cause 2 de la Passe F1 : les PNJ n'ont que trois vues (face, dos, profil). Le choix de la vue n'est pas en faute ; les trois-quarts
    des PNJ sont « Plus tard » (RH4).
- **Le héros** (harnais hors dépôt : chaque touche tenue 2 s en A et en B, la vue montrée contre le pas à l'écran) : **0 vue hors de son
  secteur, 0 miroir faux.** La règle à cinq vues fait ce qu'elle dit.
  - **Mais en A, la touche « haut » le montre de trois-quarts dos puis de profil.** Au tangage de 2,5° de A, une marche le long de l'axe de la
    caméra, loin du centre du cadre, se voit comme une glissade vers le point de fuite, presque horizontale. La règle de l'écran (Passe F1)
    montre donc un profil pour un héros qui s'éloigne.

### Fait — [OK] une règle du regard, préparée pour la comparaison
- **`?facing=ray`** (`ActorSystem.facingRay`) : la vue d'une marche est choisie par l'angle entre le cap et la ligne de visée au sol (du
  marcheur vers la caméra), au lieu du pas à l'écran. Mêmes secteurs et mêmes miroirs ensuite.
  - S'éloigner montre le dos où que soit le marcheur dans le cadre.
  - **Le prix** : une marche en diagonale montre son trois-quarts pendant que le sprite glisse presque à l'horizontale à l'écran, et en A le dos
    glisse vers le point de fuite. C'est la « marche de travers » dont l'opérateur se plaignait en Passe F1 (un dos qui se déplace de côté).
  - Mesuré sur le héros : en A, « haut » montre le dos (70 images sur 120) au lieu du trois-quarts dos ; en B, la diagonale « haut + droite »
    montre le trois-quarts dos au lieu du profil en course.
- Le défaut est inchangé : la règle de l'écran.
- **Flipbooks** (hors dépôt, envoyés à l'opérateur) : le héros en A (« haut »), le héros en B (« haut + droite »), un PNJ en B, chaque fois les
  deux règles côte à côte, synchronisées. Une image en est gardée : `screenshots/calibration/k9-facing/A-B-hero-facing.png`.

### Les animations du héros — constat, rien de changé
- Les cycles `walk-down` et `walk-up` de `hero-x2-v3` (images 20 à 35 de l'export) viennent du rig des Passes H6 à H9.
  - De face, les pieds restent écartés et alternent peu, une jambe monte haut : c'est la « course de face sur place » et la « montée de genou »
    relevées dès les Passes F1 et H9.
  - De dos, les jambes restent écartées.
- La pose `idle-upSide` (trois-quarts dos) est presque un profil : la tête et la cape tournées de côté. Elle vient de la vue de trois-quarts dos
  de la planche v4-b.
- `hero-x2-v3` est en production (décision RH1) : une révision passe par une critique à l'aveugle et l'approbation de l'opérateur.

### Preuves
- **Le défaut ne change pas** : contre `main` figé (`9bbb0b4`, :5187), au seuil 0, captures avec personnages à 300 pas, A, B, C, D et midi
  en B : **0 px**. Contrôle : `?facing=ray` change 3 % des pixels en B.
- **Tests** (`tests/views.test.mjs` +1) : la règle de l'écran reste le défaut ; une marche le long de l'axe de la caméra, 16° hors du centre,
  qu'elle ne montre pas de dos, est montrée de dos par la règle du regard ; vers la caméra, la face ; en travers, le profil et son miroir ; à
  45°, le trois-quarts dos.
  - **[KO → corrigé]** le premier cas du test ne séparait pas les deux règles : une marche le long du rayon se voit verticale à l'écran, et les
    deux montraient le dos. Le cas qui les sépare est une marche parallèle à l'axe de la caméra, loin du centre (la touche « haut » en A).
  - **Trois fautes injectées, attrapées** : la règle du regard par défaut ; le miroir inversé ; l'éloignement lu comme un rapprochement.
- **Validation** : typecheck, `npm test` 101 / 101, build, `art:validate`.

### Décisions à demander à l'opérateur
1. **L'orientation** : garder la règle de l'écran, ou adopter la règle du regard (`?facing=ray`, à essayer en jeu).
2. **Les cycles de face et de dos du héros, et son trois-quarts dos** : une retouche au rig (jambes qui alternent, pieds rapprochés) ou une
   nouvelle planche de ces vues (outil d'images, plafond de 5 $), puis la reconstruction, la critique à l'aveugle et son approbation.
3. **Les trois-quarts des PNJ** (RH4 « Plus tard ») : c'est la seule réponse aux pas de travers des PNJ en A, B et C.

### Pensée
- Une vue « juste » a deux définitions qui divergent sous un tangage faible : la direction du corps (la ligne de visée) et le mouvement à
  l'écran (vers le point de fuite). Le choix entre les deux est perceptif : il se montre en mouvement et se décide par l'opérateur.
- Un test qui doit séparer deux règles se vérifie d'abord sur l'ancienne : son premier cas les donnait égales.

## Passe K10 — Le héros marche selon la ligne de visée, les PNJ selon l'écran (décision K9) ; les cycles du héros précisés par l'opérateur ; journal R2-Y3 archivé (2026-10-20)

### Demande et décision, mot pour mot
- À la question « Quelle règle d'orientation veux-tu garder ? » (Passe K9), l'opérateur : « Adopte la règle du regard pour le héros seulement ;
  les PNJ gardent la règle de l'écran jusqu'à leurs trois-quarts. »
- Pendant la passe, l'opérateur précise son signalement sur les cycles du héros : « en fait le probleme avec les anim devant/derriere du heros
  est qu'il semble marche  sans bouger les bras et a peine les gens alors que lors qu'il se deplace sur les cotes, il court et donc les bras
  bouge avec les jambes bref il y a une grosse difference d'animations »
- Branche `facing-hero-k10` depuis `main` (`a26cd6f`).

### Fait — [OK]
- `ActorSystem.facingRayPlayer` (vrai par défaut) : la vue de marche du joueur se choisit par la ligne de visée. Les PNJ gardent la règle de
  l'écran.
- Les paramètres de comparaison :
  - `?facing=screen` : tout le monde selon l'écran, le jeu d'avant ;
  - `?facing=ray` : tout le monde selon la ligne de visée.
- `AGENTS.md` : le paramètre `facing`.

### Preuves
- **Contre `main` figé** (`a26cd6f`, :5187), au seuil 0 :
  - **Captures avec personnages**, le héros à l'arrêt et les PNJ en marche (300 pas), A, B, C, D et midi en B : **0 px**.
  - **Les pas des PNJ** (`tools/step-angles.mjs`, 40 s) : identiques sur la branche et sur `main` (A : 55 % de pas de travers, B : 40 %).
- **Le héros en marche** (harnais des touches de la Passe K9, 2 s par touche) :
  - par défaut, en A, « haut » le montre de dos (70 images sur 120) ;
  - en B, « haut + droite » le montre de trois-quarts dos (120 sur 120) ;
  - avec `?facing=screen`, ses vues sont exactement celles de `main`, touche par touche.
- **Tests** (`tests/views.test.mjs` +1) :
  - par défaut, au même endroit et au même cap, le héros montre son dos, et le PNJ la vue de l'écran ;
  - `?facing=screen` rend au héros la vue du PNJ.
  - **Trois fautes injectées, attrapées** : la règle du héros coupée par défaut ; la ligne de visée pour tout marcheur ; le drapeau ignoré.
- **Validation** : typecheck, `npm test` 102 / 102, build, `art:validate`.

### Journal — [OK] archivage (passes gardées au-delà d'environ 60 Ko)
- Les passes gardées faisaient 61 907 octets.
- R2, D4, D5, Y1, D6, Y2, Z5 et Y3, toutes closes, partent d'un seul bloc, dans leur ordre et à l'octet, vers `journal/13-passes-R2-Y3.md` :
  en-tête, ligne `---`, puis les 31 835 octets inchangés (SHA-256 `43eb575f44010bf8…`). La ligne d'index et la phrase d'en-tête sont mises
  à jour.
- **Preuve** (les huit contrôles de la Passe D1, contre la copie faite juste avant) : **8 / 8**. Contrôle négatif : un mot changé → 6 / 8.

### Restes [?]
- **Les cycles de face et de dos du héros** : de profil il court (bras et jambes ensemble), de face et de dos il marche presque figé, sans
  bras. C'est l'écart que l'opérateur signale.
  - Remède proposé : faire courir la face et le dos comme le profil (une planche de course de face et de dos, avec l'outil d'images, ou un
    rig de course), avec le trois-quarts dos trop tourné de côté.
  - Puis la critique à l'aveugle et l'approbation de l'opérateur : `hero-x2-v3` est en production.
- **Les trois-quarts des PNJ** (RH4 « Plus tard ») : leurs pas de travers en A, B et C restent jusque-là.
- **Le remède RK3** (Passe K8).

### Pensée
- Un choix perceptif qui divise peut se trancher par personnage : le joueur, qui dirige le héros, attend son dos quand il le fait s'éloigner.
  Les PNJ, que l'on regarde passer, gardent la règle qui les fait glisser le moins.

## Passe K11 — Le héros court de face, de dos et de trois-quarts : candidat `hero-x2-v4` construit, critiqué à l'aveugle, montré avant la production (2026-10-20)

### Demande, mot pour mot
- Opérateur : « Refais les cycles de face et de dos du héros en course, comme le profil (bras et jambes), et corrige son trois-quarts dos trop
  tourné ; montre-moi avant la production. »
- Interrompu par « pause », repris par « tu peux reprendre ».
- Branche `hero-run-v4` depuis `main` (`08d9dc6`).

### Sources — [OK] deux planches générées, archivées non canoniques
- Deux requêtes à l'outil d'images (`gen-image.mjs`, gpt-image-2), deux images chacune, avec la planche v4-b et la planche v3 en références :
  **0,77 $** sur le plafond de 5 $ (tâche `hero-run-v4`).
  - Planche a : trois rangées de huit, la course de face, de dos et de trois-quarts dos (vers la gauche).
  - Planche b : la course de trois-quarts face (vers la gauche) ; quatre poses debout, dont un trois-quarts dos « surtout de dos ».
- Les quatre images sont archivées à l'octet avec leur fiche (`reference/sources/hero-run-v4-2026-10-20-a1|a2|b1|b2`), non canoniques.
- **Le pas de reconstruction se règle sur la tête** de `hero-x2-v3` (2,67 à 3,14 selon la planche).
- **Choix**, sur les reconstructions comparées vue par vue :
  - la face : a1 ;
  - le dos : a2, où les coudes et les poings sortent de la cape ;
  - le trois-quarts face : b1, où les jambes varient le plus ;
  - le trois-quarts dos : a1 ;
  - le trois-quarts dos debout : b2, la cape la plus large et aucun bord du visage.

### Fait — [OK] le candidat `hero-x2-v4`
- **Rig** `rigs/hero-x2-v4.rig.mjs` :
  - Repris de `hero-x2-v3` au texel : sa palette (son export, épinglé), ses quatre vues debout (face, trois-quarts face, profil, dos) et sa
    course de profil, recalculées par le rig de `hero-x2-v3` lui-même.
  - Le rig refuse tout fichier de `hero-x2-v3` (vues, export, rig) dont l'empreinte diffère de son paquet de provenance. Contrôle : une ligne
    ajoutée au rig de `hero-x2-v3` → refus.
  - **Nouveau** :
    - les quatre courses (face, dos, trois-quarts face, trois-quarts dos), huit images chacune, dessinées par l'outil (`drawnRun`) ;
    - le trois-quarts dos debout, reconstruit par la chaîne du build.
- **`drawnRun`** :
  - chaque figure est seule sur sa planche (les autres peintes du fond), avec son empreinte vérifiée ;
  - reconstruite au pas de la course ; une reconstruction rognée est une erreur ;
  - ramenée à la palette, nettoyée comme les vues ;
  - posée la tête sur une colonne pour tout le cycle, et levée de sa hauteur sur la planche au-dessus de la ligne de sol de la rangée.
- **Distribution** : une entrée candidate après le héros (`BakedCast.ts`), chargée seulement avec `?cast=candidate` (DEV), où elle remplace
  `hero-x2-v3`.
- **Documents** : le manifeste (`candidate`, `runtimeUse: lab`), le paquet de provenance et le README de l'Art Lab ; dans `AGENTS.md`, le
  paramètre `cast=candidate`.

### [KO → corrigé] trois défauts de placement, vus à la planche ou par les contrôles
1. **La cape rognée en silence.**
   - **Ce qui s'est passé** : la préparation de `hero-x2-v3` finit par `align`, qui centre les pieds sur la colonne d'ancrage. Dans une course,
     l'enjambée et la cape qui vole sont plus larges qu'en pose debout, et le décalage poussait la cape hors du cadre (planche : un bord
     droit vertical en trois-quarts dos).
   - **Correction** : le nettoyage seul (sans `align`), puis un placement compté : une image dont un texel sortirait du cadre est une erreur.
2. **Des images qui flottaient d'un texel.**
   - **Ce qui s'est passé** : la ligne de sol était la plus basse figure de la rangée. Les bases des planches varient de quelques pixels, et en
     trois-quarts le pied proche se pose plus bas que le lointain.
   - **Correction** : la base médiane de la rangée.
3. **La course de face plus large que le cadre.**
   - **Ce qui s'est passé** : au pas de la tête (2,67), la cape déployée mesure 64,4 texels.
   - **Correction** : un pas de 2,78 (62 texels, l'anneau du bord libre). Le coureur est 3 à 4 rangées plus bas que la pose debout ; le profil en
     course l'est déjà de 6 à 8.
- **Le prix du placement** : la cape qui vole décale la tête des courses par rapport à la pose debout. L'écart est de 3 texels de dos, 7 en
  trois-quarts dos et 10 en trois-quarts face ; le profil de production a déjà 11 texels d'écart.
- **[KO → corrigé]** `sed -i` a retiré les CR d'un fichier de test (principe de la Passe M3, encore oublié). Rendus par un script node.

### Preuves
- **Construction** :
  - `build-character --check` reconstruit à l'identique ;
  - une seconde construction redonne l'export à l'octet ;
  - `verify-provenance` : paquet intact.
- **Ce qui vient de `hero-x2-v3` est identique au texel** : les poses debout de face, de trois-quarts face, de profil et de dos, et la course de
  profil (`walk-side`). Diffèrent : le trois-quarts dos debout et les quatre courses.
- **Taille et vitesse** : celles de `hero-x2-v3`. La taille vient de la pose de face, la vitesse de la course de profil (`walkSlide` 14).
- **Tests** (`tests/baked-cast.test.mjs` +1) :
  - sans candidat, le jeu ne télécharge pas `hero-x2-v4` et garde `hero-x2-v3` ;
  - avec `?cast=candidate`, le joueur prend `hero-x2-v4`, à la même taille, vitesse et échelle, et tous les autres rôles gardent leur
    feuille.
  - **Deux fautes injectées, attrapées** : le candidat placé avant le héros ; le manifeste qui n'est plus candidat. Fichiers rendus à l'octet
    (`cmp`).
- **Contre `main` figé** (`08d9dc6`, :5187), au **seuil 0**, sortie de `detshots` gardée et relue :
  - **Captures avec personnages**, le héros à l'arrêt et les PNJ en marche (300 pas), A, B, C, D et midi en B : **0 px**.
  - **Le héros de production en course** (touches tenues 45 pas, horloge figée), en B, face, dos, trois-quarts face et trois-quarts dos :
    **0 px**. Témoin de répétition (deux chargements) : 0 px.
  - **Contrôle** : la même course de face avec `?cast=candidate` change 1,7 % des pixels. À l'arrêt de face (B, 300 pas), le candidat donne
    0 px, puisque cette pose est celle de `hero-x2-v3`.
  - Aucune erreur de page. La série a été attendue jusqu'au bout dans le tour (principe de la Passe Y4), et rien de ce que servaient les
    serveurs n'a changé pendant.
- **En jeu** : quatre flipbooks hors dépôt (B, `flipbook.mjs` avec les touches, v3 à côté de v4). Une image de chacun est gardée,
  `screenshots/calibration/k11-hero-run/B-runs-v3-v4.jpg` (en haut v3, en bas v4) ; v4 se lit en course dans les quatre vues.
- **Validation** : typecheck, `npm test` 103 / 103, build, `art:validate` (18 manifestes, 21 sources archivées).

### Critique à l'aveugle — [OK] v4 gagne les cinq séries
- Un agent neuf, sur des bandes ×3 et ×2 étiquetées au hasard, la clé hors de son dossier. Pour la face et le dos, un contrôle : le cycle de v4
  dans un ordre mélangé. Mon auto-critique a été écrite avant de lire son verdict.
- Notes sur 10 : course / énergie du profil / continuité / stabilité / fidélité aux poses debout.

| vue | v3 | v4 | contrôle |
|---|---|---|---|
| face | 2 / 1 / 6 / 9 / 9 | **7 / 6 / 7 / 7 / 8** | 7 / 6 / 6 / 5 / 7 |
| dos | 1 / 1 / 7 / 9 / 9 | **8 / 7 / 8 / 8 / 8** | 7 / 7 / 6 / 7 / 8 |
| trois-quarts face | 2 / 1 / 6 / 9 / 9 | **8 / 8 / 7 / 7 / 8** | — |
| trois-quarts dos | 2 / 1 / 7 / 9 / 8 | **8 / 8 / 7 / 8 / 8** | — |
| trois-quarts dos debout | 5 | **7** | — |

- Sur v3 debout de trois-quarts dos, on voit la joue, l'oreille et le bord du nez : « un profil avec une cape ». Sur v4, aucun bord du
  visage.
- **Le contrôle ne sépare qu'à moitié** : il finit dernier sur la continuité de dos (6 contre 8), mais de face il est à égalité avec v3 (6),
  juste sous v4 (7). Les images de face se ressemblent assez pour qu'un mélange se voie peu. La critique vaut donc sur la lecture des
  courses, et faiblement sur l'ordre des images de face.
- **Contre mon auto-critique** : comme prévu, v4 gagne. Les risques que j'avais nommés sont relevés : de face, les poings bougent peu ; en
  trois-quarts face, le bras proche reste devant. Le critique ajoute une dérive de 3 à 4 texels du bord gauche des cheveux aux images 7-8 du
  trois-quarts face. Mesuré : le centre de la tête ne bouge que de 0,7 texel sur le cycle ; ce sont les mèches.
- **Sa correction la plus utile** : de face, faire pomper les poings de 4 à 6 texels à l'opposé du genou.

### Présenté à l'opérateur
- Page privée : https://claude.ai/artifact/AS2T5okXxR8YoorM81Y2gW. Chaque vue, v3 à côté de v4, s'anime à 7,5 images par seconde ; la page
  donne aussi la critique et les limites.
- En jeu : `npm run dev`, puis `?cast=candidate`.

### Restes [?]
- **La décision de l'opérateur** : mettre `hero-x2-v4` en production (approbation de son manifeste, puis une passe de bascule), le reprendre,
  ou le laisser candidat.
- **De face, les bras pompent peu.** Le remède serait une nouvelle planche de face (l'outil d'images, 4,23 $ restants sur le plafond de la
  tâche), ou une retouche des poings au rig.
- **Non fait** : la critique en mouvement par l'opérateur (les flipbooks sont hors dépôt) ; les trois-quarts des PNJ (RH4) ; le remède RK3.

### Pensée
- Un recentrage hérité d'une autre chaîne (`align` des vues debout) peut rogner en silence ce qui déborde. Une pièce déplacée se compte avant
  et après, et la perte est une erreur.
- Une planche générée n'a pas de ligne de sol exacte. La médiane de la rangée sert de sol, jamais l'extrême.
- La largeur d'un dessin déployé (une cape qui vole) borne le pas de reconstruction autant que la tête.

## Passe H11 — `hero-x2-v4` en production à la place de `hero-x2-v3` (décision de l'opérateur) (2026-10-20)

### Décision, mot pour mot
- À la question « Je mets hero-x2-v4 en production ? » (fin de la Passe K11), l'opérateur : « Production : mets hero-x2-v4 en production à la
  place de hero-x2-v3. »
- Branche `hero-prod-h11` depuis `main` (`59711d2`).

### Fait — [OK]
- **`hero-x2-v4`** : manifeste `approved`, `runtimeUse: production`. Son approbation cite la décision, datée, avec l'empreinte de l'export
  approuvé (`06a7fab7…`, celui de la Passe K11, inchangé). Son paquet de provenance reçoit son approbation et la ligne des droits.
- **`hero-x2-v3`** : `superseded`, `runtimeUse: lab`. La règle des manifestes interdit une approbation sur un statut autre
  qu'`approved` ; son approbation du 19/10 est donc gardée mot pour mot dans ses notes, et dans l'historique de son paquet, avec la
  date du remplacement. Ses fichiers restent : ce sont les sources de `hero-x2-v4`, que son rig vérifie.
- **Distribution** (`BakedCast.ts`) : l'entrée du héros pointe sur `hero-x2-v4`, toujours en dernier (ses 60 images après celles des PNJ).
  L'entrée candidate disparaît. `?cast=candidate` ne charge plus rien de plus, et l'export de `hero-x2-v3` n'est plus dans le bundle.
- **Tests** :
  - l'atlas : le héros de production est `hero-x2-v4`, la dernière feuille ; les images des PNJ gardent leurs cases et leurs octets ;
  - `walkSlide` : `hero-x2-v4` à 14 ;
  - la distribution : le joueur prend `hero-x2-v4`, avec ou sans candidats, et le jeu ne télécharge jamais `hero-x2-v3`. Comparé à
    `hero-x2-v3`, chargé à part par une entrée de test, il a la même taille, la même vitesse et la même échelle.
  - **Deux fautes injectées, attrapées** : la distribution encore sur les fichiers de `hero-x2-v3` (4 tests en échec) ; `hero-x2-v4` qui n'est
    plus un asset de production (4 en échec). Fichiers rendus à l'octet (`cmp`).
- **Documents** : `AGENTS.md` (la distribution de production ; `?cast=candidate` : aucun aujourd'hui), les README de l'Art Lab.

### Preuves
- **Contre `main` figé** (`59711d2`, :5187), au **seuil 0**, sortie de `detshots` gardée et relue :
  - **Le défaut de la branche est le candidat que l'opérateur a vu** (`main` avec `?cast=candidate`) : **0 px** partout.
    - Debout, les PNJ en marche (300 pas) : A, B, C, D et midi en B.
    - En course (touches tenues 45 pas, horloge figée) : face, dos, trois-quarts face et trois-quarts dos en B, et la face en D.
  - **Contre le défaut de `main`, debout : 0 px.** La pose de face de `hero-x2-v4` est celle de `hero-x2-v3`, donc les références de
    `screenshots/calibration/` restent justes.
  - **Contre le défaut de `main`, en course** : seul le héros change. 1,7 % des pixels de face, 1,3 % de dos, 2,4 % en trois-quarts face,
    1,8 % en trois-quarts dos, 0,7 % de face en D.
  - **`?cast=generated`** : **0 px** en B et en D.
  - Témoin de répétition (deux chargements) : 0 px. Aucune erreur de page. La série a été attendue jusqu'au bout dans le tour.
  - **Le bundle de production** ne porte plus que `hero-x2-v4` (250 Ko) ; `hero-x2-v3` n'y est plus.
- **Validation** : typecheck, `npm test` 103 / 103, build, `art:validate` (18 manifestes, 0 erreur), `verify-provenance` des paquets de
  `hero-x2-v3` et `hero-x2-v4` intacts.

### Restes [?]
- **De face, les poings pompent peu** (critique de la Passe K11). Ce n'est pas demandé.
- **Les trois-quarts des PNJ** (RH4 « Plus tard ») ; **le remède RK3** (Passe K8) ; **J9** (la nuit reste le défaut).

### Pensée
- Un asset remplacé garde son approbation comme histoire. Le schéma l'interdit dans le champ `approval` d'un statut autre qu'`approved` ; elle
  vit donc mot pour mot dans ses notes et dans son paquet, sans être effacée ni présentée comme valide.
- La preuve d'une bascule de production, c'est le défaut de la branche contre l'ancien candidat de `main` (`?cast=candidate`) à 0 px : ce que
  l'opérateur a vu est ce qui part en production.

