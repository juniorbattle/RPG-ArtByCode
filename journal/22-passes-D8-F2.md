# Journal de bord — archive : passes D8, S3 et F2 (2026-10-20)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-10-24 (Passe UI2) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe D8 — La fiche d'arbitrages de la tranche jouable : les six décisions de la Passe L7 et six écarts, tranchés par l'opérateur (2026-10-20)

### Demande
- Séance locale lancée par la séance parente : rassembler sur une fiche d'arbitrages les six décisions préparées par la séance cloud (Passe
  L7), avec seulement les écarts E1 à E30 qui demandent vraiment une décision de l'opérateur ; chiffrer l'équilibrage avec
  `tools/tournament-lab.mjs` ; mettre en tête le budget GPU dès qu'il est mesuré ; consigner les choix mot pour mot, sans rien appliquer
  d'autre : chaque décision qui demande du travail devient une tâche à part, dans sa propre séance.
- Pendant la préparation, le dossier était sur la branche de la séance GPU (`relay-gpu-q4`) : ni branche, ni commit, ni navigateur, ni serveur ;
  seulement des lectures et des calculs en Node.
- Opérateur, mot pour mot : « arbitrages rempli ».
- Branche `decisions-d8` depuis `main` (`2c9f318`).

### La fiche — [OK] les choix se sont enregistrés
- Page privée https://claude.ai/artifact/NAcnnZAm6Vcu1CRtofLVFD, collection `decisions`, vide à chaque publication (relue par `list`) : version 1,
  puis 2 avec le budget de la Passe Q4, puis 3 avec celui de la Passe Q4b, qui le remplace (la série 2560 × 1440 et le démarrage, non refaits sans
  Firefox, y sont dits tels).
- **13 entrées** : les six décisions de la Passe L7, la sixième coupée en deux (le jour par défaut, le Gold Master), et six écarts : E24, E30,
  E1 / E16, E14 / E15, E11, E25. Les autres écarts sont faits, tranchés par la fiche de la Passe N2, ou sans décision (E19 : le contrat projet
  § 8.2 admet un Colisée « suggéré »). En tête : comment jouer la tranche (les points 1 à 5 de « À vérifier » de la Passe L7) et le budget GPU.
- Avant la première version, une écriture d'essai dans une autre collection (`probe`), supprimée aussitôt : la base de l'artefact répondait.
- **Relue après « arbitrages rempli » : 13 documents sur 13**, cliqués entre 21 h 50 et 21 h 57 UTC, trois notes. La fiche de la Passe D7 n'avait
  rien enregistré. Ce qui a changé cette fois :
  - la page attend le pont du visualiseur jusqu'à 10 s, contre 3 s dans le gabarit ;
  - chaque écriture est relue (`get`) avant d'afficher « Enregistré et relu » ; un échec s'affiche dans un bandeau ;
  - une copie des choix reste dans le navigateur, et les choix faits avant la connexion sont écrits dès qu'elle arrive.
  La cause de l'échec de la Passe D7 n'est pas prouvée pour autant.

### Le chiffrage de l'équilibrage pour la fiche (E28) — Node seul, scripts hors dépôt
- Le bot dans le `CombatSim` complet ; les réglages ne touchent que les points de vie et les dégâts de Vessa et de Marek, passés par
  `duelData` (`COMBAT_DATA` intact). « Préparé » : la lame trempée (+15 %) et deux entraînements (+10 %). Victoires du joueur en %, aux
  adresses 0 / 0,45 / 0,6 :

| Réglage | Vessa, nu | Vessa, préparé | Marek, nu | Marek, préparé |
|---|---|---|---|---|
| aujourd'hui (200 graines) | 68 / 91 / 97 | 100 / 100 / 100 | 67 / 87 / 92 | 90 / 99 / 100 |
| « modéré » : Vessa PV ×1,2 ; Marek PV ×1,25, dégâts ×1,1 (150 graines) | 35 / 70 / 79 | 81 / 96 / 99 | 23 / 57 / 67 | 61 / 80 / 88 |
| « disputé » : Vessa PV ×1,2, dégâts ×1,1 ; Marek PV ×1,25, dégâts ×1,25 | 19 / 55 / 61 | 68 / 95 / 98 | 13 / 43 / 51 | 37 / 66 / 74 |

- Parties entières du TournamentLab (50 graines ; `PROFILES` modifié en mémoire, donc les duels et les matchs hors écran) : duels gagnés % ·
  1re place % · forge brûlée % :

| Politique | aujourd'hui | « modéré » | « disputé » |
|---|---|---|---|
| idle | 74 · 6 · 96 | 34 · 0 · 58 | 18 · 0 · 34 |
| négligente | 85 · 22 · 98 | 53 · 12 · 76 | 43 · 4 · 68 |
| diligente | 97 · 36 · 18 | 72 · 14 · 32 | 54 · 6 · 28 |
| prudente | 99 · 24 · 0 | 79 · 20 · 8 | 62 · 18 · 10 |
| perdante | 0 · 0 · 0 | 0 · 0 · 0 | 0 · 0 · 0 |

- Contrôle : les chiffres « aujourd'hui » redonnent ceux de `tools/tournament-lab.mjs` (idle 74 %, diligente 97 %, prudente 99 %, négligente
  85 %, perdante 0 %). Un réglage uniforme des rivaux rendait Vessa (jour 2) plus dure que Marek (jour 3) : d'où des multiplicateurs par rival.
- Effet de bord mesuré : la chaîne de sabotage naît de la première victoire du joueur ; des duels plus durs la déclenchent moins.

### Les choix de l'opérateur, mot pour mot
« = » : la recommandation de la fiche est suivie ; « ≠ » : le choix diffère, et c'est lui qui fait foi.

| # | Décision | Choix de l'opérateur | Note de l'opérateur | |
|---|---|---|---|---|
| L7-1 | Vessa Lark, une combattante générée | « La garder pour la tranche » | — | = |
| L7-2 | L'arène reste de nuit à toute heure (E26) | « Oui, après la revue du jour (J9), par DayState » | — | = |
| L7-3 | Lantern Row, une maquette du troisième lieu (E27) | « La garder telle quelle pour la tranche » | — | = |
| L7-4 | Les duels sont-ils assez disputés ? (E28) | « Régler vers « modéré » (tâche à part) » | — | = |
| L7-5 | L'écran titre caché aux navigateurs pilotés (E29) | « Le garder » | — | = |
| L7-6a | Le jour par défaut (J9) | « Le jour devient le défaut d’« Explore the district » (tâche à part) » | — | ≠ |
| L7-6b | Le Gold Master | « Pas encore (RJ3 inchangé) » | — | = |
| E24 | Quel seuil pour le budget de performance ? | « Pas plus cher que la nuit B, à définition égale » | « Mais rien n'est confirme car il y a peut etre des zones plus grande et dense » | = |
| E30 | Jouer au toucher | « Hors tranche, plus tard » | — | = |
| E1 / E16 | Le combat au-delà de la tranche | « Écart consigné jusqu’à la phase d’équipe » | « Nous devons faire une tache entiere concernant le systeme de combat et la logique car c'est quelque chose de nouveau que seul moi a l'entiere comprehension » | = |
| E14 / E15 | Blender et glTF contre une ville générée par le code | « Amender le contrat : la génération par le code est la voie du projet » | — | ≠ |
| E11 | Ce que veut dire « décision A3 » | « A3 = ma décision citée mot pour mot au journal » | — | = |
| E25 | La version du contrat projet | « 1.2 : l’en-tête fait foi » | — | = |

- L7-4 : la séance cloud recommandait « régler après votre essai » ; l'option recommandée de la fiche, « modéré », venait du chiffrage
  ci-dessus. Les deux notes (E24, E1 / E16) précisent leur option sans la contredire.

### Ce qui change — [OK] consigné, rien appliqué
- **Dans `AGENTS.md`** (des règles changent) :
  - « décision A3 » : la décision explicite de l'opérateur, citée mot pour mot et datée dans une passe du journal (E11). Cette passe est donc la
    décision A3 du choix E14 / E15 ;
  - le contrat projet : la version 1.2 fait foi (E25) ; la génération par le code est la voie du projet (E14 / E15), le texte collé restant tel
    quel jusqu'à la tâche qui l'amende ; le combat sans tour reste un écart consigné jusqu'à la phase d'équipe (E1 / E16) ;
  - le budget de performance (E24), avec la note de l'opérateur ;
  - l'écran titre caché aux navigateurs pilotés, gardé par l'opérateur (L7-5) ; Vessa générée pour la tranche (L7-1) ; toujours pas Gold
    Master (L7-6b) ;
  - le jour décidé comme défaut d'« Explore the district » (L7-6a) : **la nuit reste le défaut jusqu'à la tâche qui l'applique**.
- **Sans travail** : L7-1, L7-3, L7-5, L7-6b, E11, E25, E30.
- **Tâches à part, chacune dans sa séance, une branche à la fois** :
  1. **L7-4** : régler Vessa et Marek vers « modéré » ; recaler la résolution hors écran (`PLAYER_EDGE`, `READ_AVAIL`, `RACE_SLOPE`, tolérance
     0,2) et les attentes des parties scriptées ; les chiffres ci-dessus comme point de départ.
  2. **L7-6a** : le jour comme défaut d'« Explore the district ». L'état à prendre se vérifie dans la tâche (midi, `time=day`, d'après la
     direction D6).
  3. **L7-2** : les états du jour pour l'arène (duel et parvis) par `DayState`. Condition de l'opérateur : « après la revue du jour (J9) ». Le
     choix L7-6a fait du jour le défaut, ce que J9 attendait ; la tâche suit celle du jour par défaut.
  4. **E14 / E15** : amender le texte du contrat projet. C'est le document de l'opérateur : la rédaction se fait avec lui.
  5. **E1 / E16** : la tâche « système de combat et sa logique » que demande la note de l'opérateur. Elle part de ses explications (« seul moi a
     l'entiere comprehension »), pas d'une proposition d'agent.

### Validation
- Documentation seule : typecheck, `npm test` **148 / 148**, build, `art:validate`.
- Journal : avec cette passe, les passes gardées font 60 040 octets dans la copie de travail (CRLF), à la limite d'environ 60 Ko ; l'archivage
  vient avec la passe suivante.

### Pensée
- Une fiche dont le pont du visualiseur arrive tard perd ses choix sans bruit. Attendre le pont plus longtemps, relire chaque écriture et dire
  l'échec en clair ont suffi ici (13 / 13), sans prouver la cause de la Passe D7.
- Une note qui ajoute une tâche ne contredit pas l'option cliquée : elle se consigne avec elle, et la tâche part à part.
- Un réglage d'équilibre se chiffre par adversaire et dans l'ordre du calendrier : un multiplicateur commun rendait le jour 2 plus dur que le
  jour 3.

## Passe S3 — Le liseré clair autour des sprites cuits : diagnostiqué (le liseré de sommet du shader, éclairé par le soleil), remède derrière `?spriteedge=` (2026-10-20)

### Demande
- Séance locale lancée par la séance parente. Signalement de l'opérateur, mot pour mot : « je remarque des contours blancs autour de nos sprites
  traavaille sur aseprite, peut etre les enlever ou les mettre de couleur noir afin qu''ils se fondent mieux au decors, car c'est tres visible
  surtout en journee ».
- Consigne : diagnostiquer avec des preuves (texels des feuilles, post-traitement, échantillonnage ; jour et nuit ; héros et PNJ), proposer un
  remède au rendu sans toucher les feuilles approuvées, montrer un avant / après (contour noir, contour retiré) ; le jeu par défaut ne change
  qu'après la décision de l'opérateur, prouvé à 0 px contre `main` figé d'ici là.
- Branche `sprite-edge-tone` depuis `main` (`96f362f`). Serveurs : `dev-strict` (:5186), `main` figé (`96f362f`, copie hors dépôt, :5187,
  entrée locale `frozen-main-edge`).

### Diagnostic — [OK] la cause est le liseré de sommet du shader des sprites
- **Les feuilles** (lecture des exports PNG, scripts hors dépôt) : les dix PNJ portent un contour d'auteur sombre ; clarté OKLab médiane des
  texels du bord 0,19-0,23 contre 0,33-0,49 à l'intérieur ; texels du bord plus clairs que 0,5 : 0,1 à 7 % (coiffes, manches, tabliers) ; gris
  neutre clair (reste de fond de planche) 0 à 2,9 %. Le héros `hero-x2-v4` : bord 0,29 contre 0,395, 4,7 % de gris neutre clair (son rig a déjà
  son `dehalo`). Les feuilles ne font pas un liseré clair.
- **Le post-traitement** (`tools/sprite-halo.mjs`, B, graine 1842, 4 s, `POST=` effet par effet ; puis la même image post coupé / actif,
  anneau intérieur de la silhouette) :
  - de jour (midi B), l'anneau hors silhouette reste faible (médiane 1,33 niveau, presque tout le DOF) et le post n'éclaircit le bord intérieur
    que de **0,8 niveau** (in-scatter 0,4, DOF 0,5, bloom 0) : **le post n'est pas la cause de jour** ;
  - de nuit, l'in-scatter éclaircit le bord comme l'intérieur (+15,7 contre +13,3 niveaux : la brume, protégée à 45 % sur les personnages,
    Passe S1) : un voile, pas un liseré propre au bord.
- **Le liseré de sommet** (`BODY_FRAG`, `col += uMoonCol * 0.22 * (1 - aU) * amt * sh` : le « liseré de lune » des texels du bord au-dessus
  desquels il n'y a rien, gardé à la Passe S2) : la nuit `uMoonCol` est la lune (0,30 / 0,38 / 0,55) ; **le jour, c'est le soleil** (`DayState`,
  midi 2,9 / 2,72 / 2,35), soit **+0,64 de lumière** sur chaque texel du haut des têtes, des épaules et des bras. Même image, `uEdge` à 0 :
  bord intérieur de midi B moyenne 102,6 → 88,9 niveaux, p90 200 → 164 ; 5 594 px changés (0,27 % de l'image), jusqu'à 215 niveaux. Au texel :
  la chevelure du voyageur cernée de points blancs, qui disparaissent (`sprite-e1/midday-B-heads-x5.png`). C'est la « frange bleutée » de la
  Passe S1 la nuit, et un liseré blanc le jour.
- **Une piste secondaire** : la variante « ash » des cheveux (rampe `#5a4e40` → `#d8c6a2`) recolore aussi le contour sombre de la chevelure
  (rang de clarté 0 → `#5a4e40`) : une citadine blonde n'a plus de contour sombre aux cheveux. Couverte par le contour noir ci-dessous.
- L'échantillonnage n'y est pour rien : texel au plus proche, cellule entière (Passe T1), alpha binaire.

### Remède — [OK] derrière `?spriteedge=`, jeu par défaut inchangé
- `SpriteRenderer.setEdgeMode` compile le shader des sprites avec des macros, seulement si le paramètre est là :
  - `spriteedge=norim` (« liseré retiré ») : une feuille cuite ne prend plus le liseré de sommet ; les sprites générés (le chat, les
    combattants de l'arène) le gardent ;
  - `spriteedge=dark` (« contour noir ») : pas de liseré, et l'anneau extérieur d'une feuille cuite (un texel dont un voisin en croix est
    transparent) garde 25 % de sa couleur (`EDGE_INK`, teinte gardée) ;
  - absent : le shader compile sans aucune des deux branches.
- `App` lit le paramètre ; le mode jouable le transporte dans la ville (`CARRY`, `CARRY_TOWN`). `AGENTS.md` : la ligne du paramètre.
- **[KO → corrigé]** première version : `#if SPRITE_EDGE == 2` sur une macro non définie ne compile pas en GLSL ES : sans paramètre, plus aucun
  personnage à l'écran (vu sur une capture avant toute preuve). Deux macros testées par `#ifdef` (`SPRITE_NORIM`, `SPRITE_DARK`).
- **[KO → compris]** une capture prise juste après un changement de macros montre la scène sans personnages : le programme recompilé n'est pas
  encore prêt (compilation parallèle, l'objet est sauté). Les variantes rendent une image de chauffe et attendent 1,5 s.

### Preuves
- **Jeu par défaut à 0 px contre `main` figé** (`tools/detshots.mjs`, 120 pas, seuil 0) : témoin de répétition (deux chargements de `main`)
  0 px ; nuit A, B, C, D avec personnages, B et D statiques, midi B et D, matin B, fin de journée C, joueur placé en A (`player=-12,2`) :
  **0 px les douze**. Sur la même page, `setEdgeMode(null)` après les autres modes : 0 px (le retour arrière recompile à l'identique).
- **Contrôle négatif** : la même comparaison voit `norim` (midi B : 17 622 px, jusqu'à 215 niveaux ; nuit : 5 056 px) et `dark` (30 786 /
  12 819 px), et la première version du shader (personnages absents).
- **L'arène par défaut** (`tools/arena-scene-shots.mjs`, `HOLD=1`, un moment de chauffe) : `charging` et `combo` à 0 px entre deux chargements
  de `main` et la branche ; `ko` varie entre chargements de `main` (2 701 px, jusqu'à 10 niveaux), la branche en est à 104 px d'un niveau. Un
  troisième chargement de `main` différait des deux autres sur les trois moments (jusqu'à 13 niveaux) : l'arène n'est pas déterministe d'un
  chargement à l'autre (comme `strike` / `heavyRen` à la Passe L6).
- **Mesure du remède** (bord intérieur, midi B) : `norim` moyenne 89,5, p90 167 (comme `uEdge` à 0) ; de nuit l'écart est faible (73,8 → 71,9) :
  la nuit, le liseré de lune est bleu sombre.
- **Avant / après** (même image, graine 1842, 120 pas ; aujourd'hui / liseré retiré / contour noir 0,25 / contour noir doux 0,40) :
  `screenshots/calibration/sprite-e1/` : `morning-B.png`, `midday-B.png`, `afternoon-B.png`, `night-B.png`, `midday-D.png`,
  `midday-B-heads-x5.png`.
- **Validation** : typecheck, `npm test` **148 / 148**, build, `art:validate` (18 manifestes, 21 sources, 0 erreur).

### Journal — [OK] archivage (passes gardées au-delà d'environ 60 Ko)
- Avant cette passe, les passes gardées faisaient 60 872 octets (la Passe D8 l'annonçait). L4, L5 et L6, closes (fusionnées), partent d'un seul
  bloc vers `journal/19-passes-L4-L6.md` (21 817 octets, SHA-256 `793ff78e2c9fe642…`). Preuve **8 / 8** (script hors dépôt, contre la copie de
  `JOURNAL.md` d'avant le déplacement : corps de l'archive égal au bloc ; L4-L6 contigus, suivis de L7 ; plus dans `JOURNAL.md` ; chacun dans un
  seul fichier de `journal/` ; `JOURNAL.md` inchangé à partir de L7 ; seules la phrase d'en-tête et une ligne d'index changent ; en-tête comme
  `journal/18` ; CRLF seuls). Contrôle négatif : un bit changé dans une copie de l'archive → 7 / 8.

### À décider par l'opérateur
- Le traitement du bord des feuilles cuites : aujourd'hui (rien), **liseré retiré** (`norim`), **contour noir** (`dark`, 25 %), ou un noir plus
  doux (40 %) ; et sa portée : le jour et la nuit, ou le jour seulement. Recommandation de la séance : le contour noir à 25 %, jour et nuit (il
  retire le liseré, couvre les texels clairs d'auteur et les cheveux « ash », et fond les personnages dans le décor de jour comme de nuit).
- Rien ne change au jeu par défaut avant sa réponse ; l'appliquer est une ligne (`App` : le mode par défaut), avec un nouveau PD.

### Pensée
- Un uniforme partagé change de sens avec l'état : `uMoonCol` est la lune la nuit et le soleil le jour. Tout effet écrit pour la lune (ici un
  liseré de 0,22) se remesure sous le soleil : à midi, sept fois la lune en luminance.
- Une macro de shader se teste par `#ifdef` : en GLSL ES, une macro absente dans une expression `#if` ne compile pas, et le seul symptôme est un
  objet qui ne se dessine plus.
- Avant d'accuser le post-traitement d'une auréole, couper chaque effet sur la même image et comparer le bord intérieur au reste du sprite :
  un voile uniforme n'est pas un liseré.

## Passe F2 — Les PNJ qui descendent l'écran : leur « face » est un trois-quarts tourné à gauche ; une règle préparée derrière `?npcfacing=` (2026-10-20)

### Demande
- Séance locale lancée par la séance parente. Signalement de l'opérateur, mot pour mot : « on a toujours ce probleme d'angle position de npcs
  lorsqu'il marche vers le bas de la zone du district merchant, et je pense que l'animation de marche vers la et l'aanimation de marche vers le
  bas sont similaire car ils ont les memes angles, il regarde vers la gauche et donc l'un avance vers la gauche ( ce qui est bon et coherent ) et
  l'autre marche vers le bas, ce qui 'est pas bon car cela donne une marche de travers car l'orientation du corps n'est pas bon il est cense
  marche droit vers le bas ».
- Consigne : mesurer (vue montrée quand le pas descend l'écran, angle du passage au profil, feuilles), proposer derrière un paramètre d'URL sans
  changer le défaut, chiffrer la glissade, montrer avant / après ; changer la règle des PNJ est la décision de l'opérateur (K9).
- Mesures et prototype d'abord hors dépôt (le dossier était sur la branche de la séance du liseré) ; puis branche `npc-facing-n1` depuis
  `main` (`70be38d`). Serveurs : `main` figé (copie hors dépôt, :5188) et la branche figée (copie hors dépôt, :5191), entrées locales
  `facing-frozen` / `facing-proto`.

### Les feuilles — [OK] ni tag ni miroir faux ; [KO] aucune vraie face pour les citadins
- `walk-down` ≠ `walk-side` sur les dix feuilles de PNJ (aucune image égale ; masques : 18 à 36 % d'écart contre le profil, 6 à 9 % contre
  `idle-down`).
- **Les cinq citadins** (artisane, voyageur, citadine, vieux marchand, coursier) : leur vue `down` est un **trois-quarts face léger tourné vers
  la gauche** (visage, regard, buste). Leurs planches (01-16, 17-24) ne dessinent **aucune vue de face** : les vues 1 et 2 regardent toutes deux
  à gauche (trois-quarts léger, trois-quarts marqué), les rigs ont pris la vue 1. Docker et capuche : presque de face ; garde : de face ; le
  héros a une vraie face et ses trois-quarts.
- L'opérateur a donc raison : la marche « vers le bas » de ces PNJ montre un corps tourné à gauche, comme leur profil.

### Mesures — [OK] (harnais de `tools/step-angles.mjs` étendu hors dépôt, 40 s, graine 1842)
- **Pas vers le bas de l'écran** : en A, B, C, presque tous partent **entre 50 et 90° de la verticale** (le quai se descend en diagonale), **tous
  montrés de profil** (la règle de l'écran passe au profil à 50°, revient à 40°). Sous 50° (peu de pas : A, midi), la « face » tournée à gauche,
  **y compris quand le pas va à droite** : regard contraire 2 % des pas en C et en B à midi, 3 % en A à midi. Un marcheur ne change pas de vue au
  milieu d'un trajet (segments droits). Le mode jouable fait les pas de la nuit B.
- Deux mesures par variante : la part des pas à 20-40° de l'axe de la vue montrée (celle de la Passe K9, axe vertical pour face / dos) et
  l'écart moyen à l'axe **dessiné** (la face des citadins comptée à 35° : une estimation sur les feuilles ; un regard contraire compte en entier).

| 40 s, 1842 | A | B | C | D | B midi | A midi | jeu (matin) |
|---|---|---|---|---|---|---|---|
| pas de travers (K9) — aujourd'hui | 55 % | 44 % | 66 % | 3 % | 48 % | 46 % | 44 % |
| `mirror` | 55 | 44 | 66 | 3 | 48 | 46 | — |
| `34` | 29 | 31 | 41 | 3 | 33 | 25 | 31 |
| `wide` | 26 | 21 | 21 | 3 | 19 | 22 | — |
| écart à l'axe dessiné — aujourd'hui | 26,2° | 20,4° | 22,3° | 7,4° | 24,9° | 24,4° | 20,4° |
| `mirror` | 26,2 | 20,4 | 20,8 | 7,4 | 24,3 | 23,8 | — |
| `34` | 24,6 | 20,4 | 20,6 | 7,4 | 20,6 | 23,0 | 20,4 |
| `wide` | 25,6 | 23,6 | 26,5 | 7,4 | 24,1 | 23,7 | — |
| regard contraire — aujourd'hui | 0 % | 0 % | 2 % | 0 % | 2 % | 3 % | 0 % |
| `mirror`, `34`, `wide` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

### Fait — [OK] `?npcfacing=`, défaut inchangé
- `BakedCast` : `frontLeft` sur les cinq citadins (leur `down` dessiné tourné à gauche), porté par `CastMember`.
- `ActorSystem.npcFacing` (`npcSideEdges`), PNJ seulement :
  - `mirror` : le `down` d'une feuille `frontLeft` retourné vers un pas qui va à droite, tenu à moins de 8° de la verticale ;
  - `34` : `mirror` + ce `down` gardé comme trois-quarts face jusqu'à 67,5° de la verticale pour un pas qui descend (± 5° tenus), profil
    au-delà ; les feuilles à vraie face et les pas qui montent gardent la règle de l'écran ;
  - `wide` : `34` + face / dos jusqu'à 60° (± 5°) pour tous.
- `App` lit le paramètre ; le mode jouable le transporte (`CARRY`, `CARRY_TOWN`). `AGENTS.md` : la ligne du paramètre.

### Preuves
- **Défaut à 0 px contre `main` figé** (`tools/detshots.mjs`, 300 pas) : témoin de répétition 0 px ; A, B, C, D, midi B et le mode jouable
  (`play=1&state=day1-morning`) avec personnages : **0 px (écart max 0)**. Contrôle `npcfacing=34` : A 479, B 2 969, C 6 881, midi B 3 782, jeu
  1 489 px (D 0 : aucun pas de D ne tombe dans le secteur changé). La grille des pas de la branche par défaut égale celle de `main` au caractère près.
- **Tests** (`tests/views.test.mjs` +1, oracle : l'angle du pas recalculé depuis la caméra, les bords écrits en degrés ; 360 caps × trois vues
  de départ) : absent = la règle de l'écran, la feuille `frontLeft` comme une autre ; `mirror` ne change que le miroir ; `34` et ses bords tenus,
  pour les seules feuilles `frontLeft` ; `wide`. **Six fautes injectées une à une, toutes attrapées** : `34` par défaut (attrapée après ajout de
  l'assertion du défaut : le premier test fixait toujours le mode), miroir inversé, bord sans tenue, `frontLeft` ignoré, `wide` décalé, miroir
  sans tenue.
- **Flipbooks** (avant / `34` / `wide`, synchronisés ; hors dépôt, montrés à l'opérateur) : B, le vieux marchand descend à 54° vers la gauche ;
  B, le voyageur à 52° vers la droite ; A midi, l'artisane à 13° vers la droite et à 60° vers la gauche. Images gardées :
  `screenshots/calibration/f2-npc-facing/` (`faces.png` : les faces des citadins tournées à gauche, le héros à gauche de l'image ;
  `B-frames.png` : le vieux marchand et le voyageur, avant / `34`).
- **Validation** : typecheck, `npm test` **149 / 149**, build, `art:validate` (18 manifestes, 21 sources, 0 erreur).

### À décider par l'opérateur (décision K9 : la règle des PNJ)
- Aujourd'hui (la règle de l'écran), `mirror`, `34` ou `wide`. **Recommandation de la séance : `34`** : un citadin qui descend montre son
  devant, tourné dans le sens de sa marche, et plus jamais un regard contraire ; son gain se lit sur la mesure K9, peu sur l'axe dessiné (la face
  n'est qu'un trois-quarts léger, les pas vont à 55-75°). `wide` fait monter l'écart à l'axe dessiné en B et C.
- **Voie de l'art (RH4)** : la vue 2 des planches (trois-quarts marqué, jamais utilisée) est une source de `downSide` pour les cinq citadins,
  sans génération ; ni vraie face ni trois-quarts dos. Une tâche de rig, une critique à l'aveugle et l'approbation de l'opérateur.

### Pensée
- Avant de régler une règle de vue, regarder ce que la feuille dessine vraiment : une « face » peut être un trois-quarts, et le meilleur
  secteur ne corrige pas un dessin tourné.
- Une mesure de glissade se rapporte à l'axe dessiné de la vue, pas à son nom : la mesure K9 (vertical pour toute face) et l'axe estimé
  n'ont pas dit la même chose ici ; les deux sont rapportés, et l'œil tranche sur les flipbooks.

