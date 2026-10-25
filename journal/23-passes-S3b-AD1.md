# Journal de bord — archive : passes S3b, F3, D9, FR1 et AD1 (2026-10-20 → 2026-10-21)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-10-25 (Passe UI3) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe S3b — Le contour noir des sprites cuits par défaut, de jour et de nuit (décision de l'opérateur) (2026-10-20)

### Décision de l'opérateur, mot pour mot
- Après les avant / après de la Passe S3 (`screenshots/calibration/sprite-e1/`) : « Contour noir 25 %, de jour et de nuit : applique-le par
  défaut. » C'était la recommandation de la séance.
- Le dossier partagé était sur la branche de la séance de l'orientation des PNJ (`npc-facing-n1`, modifications non commitées des mêmes
  fichiers) : rien n'a été touché avant sa fusion (`9ac64d1`, Passe F2), annoncée par message. Branche `sprite-edge-default` depuis `main`
  (`9ac64d1`).

### Fait — [OK]
- `App` : le contour noir est le défaut (`setEdgeMode('dark')` : pas de liseré de sommet, anneau extérieur d'une feuille cuite à 25 % de sa
  couleur), de jour et de nuit, dans la ville et dans la ville du mode jouable. Pour comparer : `?spriteedge=rim` (le liseré d'avant, sans
  anneau sombre) et `?spriteedge=norim` (ni liseré ni anneau). Le shader ne change pas (Passe S3). L'arène, le parvis et Lantern Row ne
  passent pas par `App` : leurs sprites sont générés, inchangés.
- `AGENTS.md` : la ligne du paramètre, et une note du rendu des sprites (la silhouette des feuilles cuites, `#ifdef`, `uMoonCol` le jour).

### Preuves
- **Dans les deux sens, à 0 px** (`tools/detshots.mjs`, 120 pas, seuil 0 ; `main` figé `9ac64d1` sur :5187, la branche sur :5186) ; témoin de
  répétition (deux chargements de `main`) 0 px. Douze vues : nuit A, B, C, D, B statique, midi B et D, matin B, fin de journée C, joueur
  placé en A (`player=-12,2`), et le mode jouable (`play=1&state=day1-morning`, `play=1&state=day2-afternoon`) :
  - **le nouveau défaut = `main` avec `?spriteedge=dark`** : 0 px les douze ;
  - **`?spriteedge=rim` = `main` sans paramètre** (l'ancien rendu) : 0 px les douze ;
  - `?spriteedge=norim` (midi B) : 0 px contre `main` avec le même paramètre.
- **Contrôle** : le nouveau défaut contre `main` sans paramètre change 0,31 à 0,85 % des pixels la nuit (jusqu'à 134 niveaux), 1,18 à 1,69 %
  le jour (jusqu'à 219), 0,69 et 1,45 % dans le mode jouable ; 0 px sur la vue statique (sans personnages).
- **Références** `screenshots/calibration/cam{A,B,C,D}-*.png` refaites (requêtes de `tools/screenshots.mjs`, capture déterministe, 120 pas,
  témoin 0 px pour chacune) : contre les anciennes, 0,18 à 0,95 % des pixels, autour des personnages.
- **Validation** : typecheck, `npm test` **149 / 149**, build, `art:validate`.

### Pensée
- Une décision d'image qui change le défaut garde l'ancien rendu derrière un paramètre et se prouve dans les deux sens : le nouveau défaut égal
  à la variante approuvée de `main`, l'ancien paramètre égal au `main` d'avant, à 0 px.
- Un dossier partagé par deux séances se lit avant d'ouvrir une branche : la branche d'une autre séance, avec ses fichiers modifiés, attend
  sa fusion.

## Passe F3 — `npcfacing=34`, règle par défaut des PNJ (décision de l'opérateur) (2026-10-20)

### Décision, mot pour mot
- À la question « Quelle règle veux-tu par défaut pour les PNJ (décision K9) ? » (Passe F2), l'opérateur : « Applique npcfacing=34 comme règle
  par défaut des PNJ. »
- Branche `npc-facing-default-f3` depuis `main` (`22c4feb`, après la Passe S3b de la séance du liseré, qui tenait le dossier : la branche n'a été
  ouverte qu'à sa fusion). Serveurs : `main` figé `22c4feb` (copie hors dépôt, :5188) et la branche figée (copie hors dépôt, :5191).

### Fait — [OK]
- `ActorSystem.npcFacing` vaut `'34'` par défaut : le `down` des cinq citadins (dessiné tourné à gauche, Passe F2) est retourné vers un pas qui
  va à droite et gardé jusqu'à 67,5° de la verticale quand le pas descend l'écran ; les autres feuilles gardent la règle de l'écran (pour elles,
  `34` donne les mêmes bords, 50° / 40°, et aucun miroir de face) ; le héros garde la ligne de visée (K10).
- `?npcfacing=screen` : la règle de l'écran de la Passe F1 pour tous les PNJ (le jeu d'avant), pour comparer ; `mirror` et `wide` restent.
- `AGENTS.md` : la ligne du paramètre et la phrase des vues de marche.

### Preuves
- `tools/detshots.mjs`, 300 pas, graine 1842, seuil 0 ; témoin de répétition (deux chargements de `main`) 0 px :
  - **le défaut de la branche = `main` figé avec `?npcfacing=34`** : A, B, C, D, midi B et le mode jouable (`play=1&state=day1-morning`) :
    **0 px (écart max 0)** les six ;
  - **`?npcfacing=screen` sur la branche = le défaut de `main` figé** : les six à **0 px** ;
  - contrôle, le défaut de la branche contre celui de `main` : A 492, B 2 963, C 6 847, midi B 3 679, jeu 1 434 px ; D 0 (aucun pas de D dans le
    secteur changé, comme en Passe F2).
- **Tests** (`tests/views.test.mjs`) : `34` par défaut ; les tests qui supposaient la règle de l'écran pour un PNJ (feuilles sans `frontLeft`)
  passent tels quels. Faute injectée (le défaut remis à `''`) : attrapée.
- **Validation** : typecheck, `npm test` **149 / 149**, build, `art:validate`.

### Restes [?]
- La face des citadins reste un trois-quarts léger tourné à gauche : les pas qui descendent à 55-75° montrent une vue dessinée vers 35°. La
  voie de l'art (RH4) : la vue 2 des planches comme `downSide` des citadins (Passe F2), une tâche à part, critique à l'aveugle et approbation.
- Les trois-quarts dos des PNJ n'existent sur aucune planche.

### Pensée
- Une règle nouvelle qui ne touche que les feuilles marquées se pose en défaut sans risque pour les autres : sa preuve est double, nouveau
  défaut = ancien paramètre, ancien défaut = nouveau paramètre de retour.

## Passe D9 — Le jour devient le défaut d'« Explore the district » : midi, le bouton seul (décision L7-6a de l'opérateur) (2026-10-20)

### Décision et portée, mot pour mot
- Décision L7-6a (fiche de la Passe D8) : « Le jour devient le défaut d’« Explore the district » (tâche à part) ». Séance locale lancée par la
  séance de la fiche.
- Ce que la décision ne disait pas, demandé avant de coder ; réponses de l'opérateur (l'option choisie) :
  - « Quel état du jour devient le défaut d'« Explore the district » ? » → « Midi (Recommandé) » (J1 « Midi », direction D6) ;
  - « Jusqu'où va le défaut du jour ? » → « Le bouton seul (Recommandé) » : seul le bouton de l'écran titre ouvre le jour ; toute adresse à
    paramètres sans `time=` garde la nuit (outils, preuves, soir du mode jouable). L'autre option, « Toute la ville » (`time=` absent = le jour
    partout), aurait demandé `time=night` dans les outils et dans `townQuery` (`src/simulation/look.ts` : le soir du mode jouable compte sur
    « absent = la nuit »).
- Branche `day-default-explore` depuis `main` (`ffa127e`). Serveurs : `main` figé (`ffa127e`, copie hors dépôt, :5192) et la branche figée (la
  même copie avec `src/main.ts` et `src/ui/title.ts` de la branche, :5193), entrées locales `day-frozen-main` / `day-frozen-branch`.

### Fait — [OK]
- `src/main.ts` : le bouton appelle `exploreByDay()`, qui pose `time=midday` dans les paramètres de la page (sauf si l'adresse en nomme un), écrit
  « PAINTING THE DAY... » sous l'écran de chargement, puis lance `startTown()`, inchangé. L'adresse ne change pas : un rechargement redonne l'écran
  titre, comme avant. Le reste du fichier (écran de chargement, aiguillage, `startArena`, `startTown`) est inchangé ; seul `main.ts` lit
  `location.search` dans le chemin de la ville.
- `src/ui/title.ts` : le sous-titre du bouton, « The Merchant District at midday, free roaming » (« at night » avant).
- `?time=night` donne la nuit, comme `time=` absent (`parseTime` inchangé).
- **Audit des outils** : sous la portée choisie, aucun outil ne change. Les outils chargent des adresses à paramètres (la nuit sans `time=`), ou
  l'adresse nue dans un navigateur piloté (`navigator.webdriver` : pas d'écran titre, la ville de nuit). Seul `tools/title-proof.mjs` passe par
  le bouton : il compare maintenant « Explore » au `?time=midday` de `main` figé (`BASE_QUERY`, défaut `time=midday` ; `BASE_QUERY=` = l'adresse
  nue de `main`, la nuit : le contrôle négatif).
- `tests/town-roles.test.mjs` : le test « Explore the district » vérifie `showTitle({ explore: exploreByDay })`, le corps exact
  d'`exploreByDay`, et toujours `startTown`, `startArena` et l'écran de chargement à l'identique de `d129433`.
- `AGENTS.md` : le statut, le paramètre `title=`, le paramètre `time=`, la commande `title-proof`, la direction artistique (J9, L7-6a).
  `DayState.ts` : un commentaire.

### Preuves
- **La nuit à 0 px contre `main` figé** (`tools/detshots.mjs`, 120 pas, graine 1842, `clean=1`, 1920 × 1080, seuil 0) ; témoin de répétition
  (deux chargements de `main`, B) **0 px** d'abord. A, B, C, D, avec personnages et statiques (`static=1`), huit vues :
  - la branche avec `time=night` contre `main` sans paramètre : **0 px (écart max 0) les huit** ;
  - la branche sans `time=` contre `main` sans paramètre : **0 px les huit** (la portée « le bouton seul ») ;
  - contrôle : la branche avec `time=midday` en B contre la nuit de `main` : 99,43 % des pixels (jusqu'à 242 niveaux).
- **Le bouton** (`tools/title-proof.mjs`, navigateur non piloté, 1280 × 720) : boutons sans sauvegarde (`new`, `explore`) et avec (`continue`,
  `new`, `explore`), rien de généré derrière l'écran titre ; « Explore the district » contre `main` figé `?time=midday` : **0 px** ; contrôle
  négatif (`BASE_QUERY=`, l'adresse nue de `main`, la nuit) : 93,46 % des pixels (jusqu'à 238).
- Vu dans le panneau navigateur : le sous-titre, puis la ville à midi (HUD « Merchant District — Midday », panneau DEV, adresse vide).
- **Test** : quatre fautes injectées une à une dans `main.ts`, chacune attrapée (le bouton rendu à `startTown`, `morning` au lieu de `midday`,
  la garde `has('time')` retirée, un ajout dans `startTown`) ; le fichier rendu à l'octet (`cmp`).
- **Validation** : typecheck, `npm test` **149 / 149**, build, `art:validate` (18 manifestes, 21 sources, 0 erreur).

### Journal — [OK] archivage (passes gardées au-delà d'environ 60 Ko)
- Avant cette passe, les passes gardées faisaient 61 106 octets. L7, Q3 et L7b, closes (fusionnées), partent d'un seul bloc vers
  `journal/20-passes-L7-L7b.md` (19 157 octets, SHA-256 `6a0797ffefd57fab…`). Preuve **8 / 8** (script hors dépôt, contre la copie de
  `JOURNAL.md` d'avant le déplacement : corps de l'archive égal au bloc ; L7, Q3, L7b contigus, suivis de Q4 ; plus dans `JOURNAL.md` ; chacun
  dans un seul fichier de `journal/` ; `JOURNAL.md` inchangé à partir de Q4 ; seules la phrase d'en-tête et une ligne d'index changent ; en-tête
  comme `journal/19` ; CRLF seuls). Contrôle négatif : un bit changé dans une copie de l'archive → 7 / 8.

### Restes [?]
- L7-2 (les états du jour de l'arène) attendait cette tâche ; sa séance partage ce dossier.
- Non fait, hors portée : le mode jouable suit ses créneaux (inchangé) ; une adresse à paramètres sans `time=` reste la nuit.

### Pensée
- Une décision « par défaut » a une portée à trancher avant le code : un bouton, une adresse, ou tout ce qui lit l'adresse (outils, preuves, un
  autre mode qui compte sur l'absence du paramètre). La plus étroite qui dit la décision garde les preuves des passes passées valables.
- Un test qui fige un appel (`explore: startTown`) change avec la décision qu'il gardait : il garde ce qui ne doit pas bouger (`startTown`) et
  fige le nouvel appel, fautes injectées à l'appui.

## Passe FR1 — La feuille de route après la tranche jouable, versionnée (2026-10-20)

### Demande, mot pour mot
- Opérateur, la feuille de route en cinq points (citée en entier dans `briefs/roadmap-2026-10.md`), close par « On ne lance rien encore mais
  consolide le plan » ; puis « Le district en cours, c'est le parvis de l'arène (la place principale) : c'est lui à finaliser en premier. » ;
  enfin, une fois les séances L7-6a et L7-2 rendues : « Okay les sous-sessions sont finis avacons vers le plan consolide ».
- Branche `roadmap-fr1` depuis `main` (`ff4caa2`).

### Fait — [OK]
- `briefs/roadmap-2026-10.md` : le plan consolidé, dans l'ordre de l'opérateur. Étape 0, l'atelier « système de combat » (E1 / E16) avant les
  combattants ; étape 1, les sprites de l'arène (combattants, gradins) ; étape 2, l'interface (audit, images de référence, fiche, système de
  design) ; étape 3, les districts, le parvis d'abord, en places ouvertes ; étape 4, le peuplement (avec un plan de capacité de la texture des
  sprites) ; étape 5, le gameplay (événements, narration, cinématiques en direct). Les règles de fonctionnement et quatre questions ouvertes y sont.
- Aucun code ne change.

### Constat — [?]
- La séance L7-2 (les états du jour de l'arène) n'avait pas commencé : elle attendait la fusion de D9, que rien ne lui a signalée. Elle est la
  première tâche du plan, lancée après cette passe.

### Pensée
- Une séance qui attend la fusion d'une autre n'en est pas prévenue : la séance qui les a lancées le lui dit dès la fusion.

## Passe AD1 — L'arène du mode jouable prend l'état du jour par `DayState` : le duel à midi, le parvis selon son créneau (décision L7-2 de l'opérateur) (2026-10-21)

### Décision et départ, mot pour mot
- Décision L7-2 (fiche de la Passe D8) : « Oui, après la revue du jour (J9), par DayState ». Elle répond à l'écart E26 (l'arène de nuit à toute
  heure, Passe L7). Séance locale lancée par la séance de la fiche.
- Condition : commencer une fois la tâche du jour par défaut (L7-6a) fusionnée. Confirmation de l'opérateur, mot pour mot : « Oui : commence
  l'arène de jour (L7-2) dès que la tâche du jour par défaut est fusionnée dans main. » Fusion annoncée par la séance parente (D9 `ff4caa2`, puis
  FR1 `eebbcd3`), vérifiée sur `origin/main` avant d'ouvrir la branche.
- Branche `arena-day-l7-2` depuis `main` (`eebbcd3`). Serveurs : `dev-strict` (:5186), `main` figé (`eebbcd3`, copie hors dépôt, :5194) et la
  branche figée (la même copie avec les fichiers de la branche, :5195), entrées locales `arena-frozen-main` / `arena-frozen-branch`.

### Fait — [OK]
- **`ArenaApp`** lit `?time=morning|midday|afternoon` (`parseTime`, comme la ville) ; absent = la nuit, exactement comme avant. Un état du jour :
  - le ciel de l'état (`buildSky(look.sky)`), le soleil dans les uniformes de la lune, l'ambiance du ciel et du sol, la brume, `uWet`, la lueur
    chaude de la ville éteinte, l'étalonnage de l'état (comme `App.applyDay`) ;
  - J4 transposé (`arenaLitByDay`, `DayState.ts`) : les feux brûlent (braseros, foyers des tunnels), les lanternes, les lampadaires et le rebond
    de lune froid qui éclaire les combattants la nuit sont éteints (6 sources allumées sur 23) ; le verre des fenêtres et des lanternes baisse,
    les braises des braseros gardent leur lueur sur leur propre copie du matériau (`buildArena(..., { fireApart })` les met dans un maillage à
    part, seulement de jour) ; les boutiques des maisons baissent, leurs toits prennent la teinte de l'état ; la ville lointaine prend sa
    variante de jour (fenêtres éteintes) ;
  - l'ombre du soleil dans une boîte plus large (30 × 30 m : un soleil haut voit le sol et les gradins de dessus ; la boîte de la lune, 24 × 9,
    reste la nuit) ;
  - le traitement de silhouette des combattants générés (bord éclairé, liseré de sommet, côté ombre : tous en `uMoonCol`, le soleil le jour)
    garde sa force de nuit : `SpriteRenderer.setEdgeGain`, gain = luminance de la lune / luminance du soleil (0,11 à midi). Leçon de la Passe S3.
- **Le soleil de l'arène** (`arenaSunDir`) : chaque lieu a été composé autour de sa lune (Passe P1 : « Composition et lumière sont une seule
  décision ») :
  - le matin et midi gardent la place qu'ont leurs soleils par rapport à la lune du district, tournés de l'écart entre les deux lunes (97,5°) :
    midi haut (55°) derrière la droite de l'anneau, le matin de la droite à 30° ;
  - la fin de journée met son soleil bas (16°) là où la lune pend la nuit, dans la porte, comme sa piste (« at the far end of the canal (where the
    moon hangs at night) », `AFTERNOON`) : une bande dorée traverse le duel par la porte, le reste dans l'ombre des tours.
  - **[KO]** première règle, chaque soleil à sa place dans le cadre de B (57,5°) : le soleil bas de la fin de journée venait de derrière les
    gradins de droite, tout le sol dans leur ombre (une arène de nuit dorée). **[KO]** tourné depuis la lune (97,5°), il tombait encore sur la
    tour de droite.
- **Le mode jouable** : `arenaQuery` (`src/simulation/look.ts`, pure, à côté de `townQuery`) donne la graine et l'état du créneau ; le duel
  (`playArena.ts`, l'après-midi : midi) et le parvis (`playForecourt.ts` : le matin, midi, la fin de journée après un duel, la nuit) en partent.
- `AGENTS.md` : le statut et le paramètre `time=` de l'arène.

### Preuves
- **L'arène par défaut à 0 px contre `main` figé** (`tools/arena-scene-shots.mjs`, `HOLD=1`, 1280 × 720, seuil 0) : un moment de chauffe qui retire
  l'écran de chargement et coupe les transitions et animations CSS (le même JS des deux côtés), puis dix moments (`calm`, `charging`, `window`
  en aide complète, `combo`, `guardbreak`, `impact`, `technique`, `ko`, `strike`, `heavyRen`) :
  - témoin de répétition (deux chargements de `main`) : **0 px les dix** ; la branche : **0 px les dix** ;
  - la branche avec `time=night` contre `main` : **0 px les dix** ;
  - contrôle : la branche avec `time=midday` contre `main` : 90,6 à 90,9 % des pixels (jusqu'à 235 niveaux).
  - **[KO → compris]** sans ce moment de chauffe, deux chargements de `main` différaient entre eux (29 % des pixels sur `calm`, des traces sur
    `charging`, `window`, `impact`, `ko`) : la capture tombait pendant le fondu de 0,8 s de l'écran de chargement et les transitions du HUD.
- **La ville inchangée** (`tools/detshots.mjs`, 120 pas, seuil 0 ; `SpriteRenderer` et `DayState` sont partagés) : nuit B, midi B et le mode
  jouable (`play=1&state=day1-morning`) : témoin 0 px, branche **0 px**.
- **`tools/arena-scene-check.mjs`** sur la branche figée : **PASS** les quatre (défaut, `time=morning`, `time=midday`, `time=afternoon`) :
  empreinte de la simulation égale au prototype (`ARENA_SIM_HASH`), 42 rendus sans erreur, la boucle vivante avance et prend les touches.
  Contraste du télégraphe dans la fenêtre d'esquive (aide complète) :

| | nuit | matin | midi | fin de journée |
|---|---|---|---|---|
| contraste | 6,94:1 | 3,37:1 | 4,31:1 | 2,33:1 |
| deutéranopie | 7,15:1 | 3,43:1 | 4,44:1 | 2,32:1 |

  - Les contrastes s'inversent de jour (Passes A1 / A2) : la bande claire contre un sol éclairé. Le plus mince, la fin de journée, tient au-dessus
    de 2:1 : la bande dorée de la porte passe sous le télégraphe. **En jeu**, le télégraphe ne paraît que dans un duel, et les duels se jouent
    l'après-midi, donc à midi (4,31:1) ; le matin et la fin de journée ne s'y voient qu'au parvis, sans HUD ni télégraphe.
- **Dans le navigateur** (branche figée, `tools/play-shots.mjs`) : le duel du jour 2 (`day2-afternoon`, `scene=arena`) à midi ; le parvis au matin
  (1280 × 720 et 844 × 390), à la fin de journée (`forecourt-dusk-lost`) et le soir, la nuit (`trained-day1-evening`) ; 0 erreur de page.
  `tools/play-flow.mjs` : victoire contre Vessa (graine 1842, jour 2) et défaite contre Marek (7719, jour 3), le duel de jour joué jusqu'au bout,
  l'état final rejoué en Node avec la même empreinte, 0 erreur de page.
- **Tests** (`tests/arena-day.test.mjs`, 4) : `arenaQuery` sur onze états nommés (l'oracle : leur créneau écrit à la main, pas `lookOf`) ; les deux
  pages partent d'`arenaQuery` ; l'arène lit `time=` par `parseTime` et garde les appels de la nuit ; `arenaLitByDay` contre les sortes de lumière
  de `ArenaScene.ts` ; `arenaSunDir` contre une lune recalculée de ses angles (élévation de l'état, azimut +97,5° ou celui de la lune). **Six
  fautes injectées une à une, toutes attrapées**, fichiers rendus à l'octet : le duel sans `arenaQuery`, la fin de journée oubliée par
  `arenaQuery`, le rebond de lune allumé de jour, le soleil de la fin de journée tourné comme les autres, la boîte d'ombre de la nuit changée,
  le parvis sans `arenaQuery`.
- **Temps GPU** (`tools/perf.mjs`, la branche figée, Radeon 780M, témoin de contention à 15 %) — budget E24, « Pas plus cher que la nuit B, à
  définition égale » :

| ms de GPU | 1920 × 1080 : propre (tours) · minimum | 2560 × 1440 : propre (4 / 4 tours) |
|---|---|---|
| nuit B | 10,02 (1 / 5) · 10,02 | 16,76 |
| arène de nuit (`scene=arena`) | 10,33 (2 / 5) · 9,20 | 15,68 |
| arène, matin | 8,82 (3 / 5) · 8,39 | — |
| arène, midi | 8,56 (3 / 5) · 8,43 | — |
| arène, fin de journée | 8,93 (4 / 5) · 8,28 | — |
| duel du jour 2 (mode jouable, midi) | 8,74 (4 / 5) · 8,20 | 13,65 |
| parvis, matin | 8,56 (3 / 5) · 8,28 | 13,93 |
| parvis, fin de journée | 8,56 (3 / 5) · 8,25 | 13,90 |
| parvis, soir (nuit) | 8,82 (2 / 5) · 8,78 | — |

  - **Le budget tient** : toutes les pages de l'arène sous la nuit B, de jour 13 à 17 % de moins qu'elle ; le jour coûte moins que la nuit de
    l'arène (6 lumières sur 23 : in-scatter, bloom et reflets plus légers). 94 appels de dessin de jour contre 92 la nuit (le maillage des braises).
  - **[?] La série 1080p était chargée** : d'autres programmes (le processus GPU de l'application Claude, des Chrome d'autres séances) ont pris 17
    à 38 % de la 780M pendant les trois premiers tours ; les tours 4 et 5 étaient presque tous propres. Les valeurs propres et les minimums
    retrouvent la Passe Q4b (nuit B 10,57, arène 9,24) ; la série 2560 × 1440 a ses quatre tours propres.
- **Validation** : typecheck, `npm test` **153 / 153**, build, `art:validate` (18 manifestes, 21 sources, 0 erreur).
- Images gardées : `screenshots/calibration/ad1-arena/` (`arena-night-midday.png`, `arena-morning-afternoon.png`,
  `telegraph-midday-afternoon.png`, `play-duel-forecourt-morning.png`, `play-forecourt-dusk-night.png`).

### Journal — [OK] archivage (passes gardées au-delà d'environ 60 Ko)
- Cette passe écrite, les passes gardées faisaient 60 231 octets. Q4 et Q4b, closes (fusionnées), partent d'un seul bloc vers
  `journal/21-passes-Q4-Q4b.md` (10 332 octets, SHA-256 du bloc `2dbdd4bc2079c774…`) ; restent 49 899 octets. Preuve **8 / 8** (script hors
  dépôt, contre la copie de `JOURNAL.md` d'avant le déplacement : corps de l'archive égal au bloc ; Q4, Q4b contigus, suivis de D8 ; plus dans
  `JOURNAL.md` ; chacun dans un seul fichier de `journal/` ; `JOURNAL.md` inchangé à partir de D8 ; seules la phrase d'en-tête et une ligne
  d'index changent ; en-tête comme `journal/20` ; CRLF seuls). Contrôle négatif : un bit changé dans une copie de l'archive → 7 / 8.
  **[KO → corrigé]** la première version du sixième contrôle comparait les lignes à la même position alors qu'une ligne d'index s'insère :
  le contrôle a été corrigé, pas les fichiers.

### Restes [?]
- **La revue de l'opérateur en jeu** : le duel à midi, le parvis selon l'heure ; les choix de la séance à juger (le soleil de la fin de journée
  dans la porte, les braseros allumés de jour, le gain de silhouette).
- Le liseré froid **peint** dans les images des combattants (Passe P2, « la lune derrière le duel ») reste le même de jour ; les cheveux blancs de
  Marek se lisent clairs au soleil. Les sprites de l'arène se jugeront de jour comme de nuit à l'étape 1 de la feuille de route.
- Pas de météo dans l'arène (la ville du jour 3 peut pleuvoir, `townQuery`) ; Lantern Row reste de nuit (L7-3).
- L'artefact publié de l'arène (Passe P2) montre toujours la nuit : à republier avec `tools/arena-scene-page.mjs` si l'opérateur le veut.

### Pensée
- Un soleil se transpose d'un lieu à l'autre par ce autour de quoi chaque lieu a été composé (sa lune), pas par le cadre de la caméra : la règle
  du cadre a mis l'arène dans l'ombre de ses gradins.
- Un effet réglé pour la lune se remesure sous le soleil (Passe S3) ; quand il passe par un uniforme de gain, il se rapporte à la nuit par le
  rapport des luminances, sans recompiler.
- Un témoin de répétition qui échoue dit d'abord ce que la capture attrape d'autre que le rendu : un fondu de chargement, des transitions CSS.

