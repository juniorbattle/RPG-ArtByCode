# Journal de bord — archive : passes Y4, Y5, R3 et D7 (2026-10-19 → 2026-10-20)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-10-20 (Passe N3) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe Y4 — Le matin et la fin de journée d'après leurs pistes, derrière `?time=morning` et `?time=afternoon` (décision D6) ; la nuit et midi inchangés ; journal H9-Z4 archivé (2026-10-19)

### Demande
- À la fin de la Passe Y3, une question à l'opérateur : « Je garde la guirlande qui passe devant le héros en B ? ». Deux réponses proposées :
  « La garder » (recommandée : la garder telle quelle et passer au matin et à la fin de journée) et « La relever ou l'ôter ».
- Réponse de l'opérateur, mot pour mot : « okay go ».
- **Lue comme la réponse recommandée** : la guirlande reste telle quelle, et la tâche 3 de la Passe D6 commence, le matin et la fin de journée
  depuis leurs pistes.
- Branche `day-states-y4` depuis `main` (`ddadbaf`).

### Fait — [OK]
- **Les paramètres** :
  - `?time=morning` donne le matin, `?time=afternoon` la fin de journée ;
  - `midday` et son alias `day` ne changent pas ;
  - `evening` n'est pas un paramètre, puisque le soir est la nuit (D6) : il donne la nuit, comme toute autre valeur.
- **Deux tables, sur le modèle de midi** (`DayState.ts`, `MORNING` et `AFTERNOON`). Elles sont réglées en trois tours de captures contre leurs
  pistes, en B.
  - **Le matin** :
    - un soleil doux à 30°, venu du côté canal, couleur (2,3 ; 2,18 ; 1,95) ; une ambiance froide (0,4 ; 0,44 ; 0,52) ;
    - un horizon pâle bleuté (0,6 ; 0,68 ; 0,8) et un zénith (0,26 ; 0,38 ; 0,6) ;
    - la brume à 0,0045 et la brume basse à 0,25 (midi : 0,003 et 0,05) ;
    - des pavés humides de rosée (`uWet` 0,35), des toits bleu ardoise (0,72 ; 0,8 ; 1,05) ;
    - le grade : exposition 1,15, saturation et contraste 1,0.
  - **La fin de journée** :
    - un soleil bas (16°) au fond du canal, un peu côté canal, doré (3,3 ; 2,05 ; 0,95) ;
    - une ambiance (0,3 ; 0,32 ; 0,42) et un sol chaud ;
    - un horizon doré (0,95 ; 0,64 ; 0,34), un zénith (0,2 ; 0,32 ; 0,58), la brume à 0,004 ;
    - des toits d'ardoise (0,8 ; 0,82 ; 0,95) ;
    - le grade : exposition 1,22, saturation 1,25, contraste 1,05 ; des ombres bleues (0,94 ; 0,98 ; 1,08) et des hautes lumières chaudes
      (1,1 ; 0,98 ; 0,8).
  - **Comme à midi** : les lanternes, les fenêtres et les lueurs du lointain sont éteintes, la forge allumée (J4). Le pavois est tendu dans les
    trois états du jour (J6 « Le jour seulement ») ; la piste du matin en montre aussi.
- **Le ciel** : chaque état du jour compile la variante `DAY`.
  - Le matin y ajoute `DAY_HAZE` : le ciel et ses nuages voilés par la brume pâle.
  - La fin de journée y ajoute `DAY_SUN` : la lueur du soleil bas, et les nuages réchauffés vers lui.
  - Midi garde exactement `{ DAY: 1 }` : son shader est celui de la Passe Y2.
- **`App`** lit la table de l'état (`LOOKS`) au lieu de celle de midi. Le titre du HUD dit « Morning », « Midday » ou « End of day ».
- **Un choix de direction, le mien** : la lumière du matin vient du côté canal, comme sur sa piste. Elle ne vient pas d'un est cohérent avec
  le soleil de la fin de journée, au fond du canal. C'est écrit dans `AGENTS.md`.
- **Les tours** :
  1. le matin noyé de brume ; le front de la fin de journée à contre-jour, le soleil trop dans l'axe du canal ;
  2. la brume baissée ; le soleil de la fin de journée tourné vers le canal, ce qui éclaire le front ;
  3. plus doré ; l'eau du matin un peu plus sombre.

### Preuves
- **Nuit** (sans paramètre), contre `main` figé (`ddadbaf`, :5187), au **seuil 0** : **0 px partout** (écart max 0).
  - Graines 1842 et 7719 × A, B, C, D, D lointain et les quatre transitions figées (`static=1&occ=0`, 30 pas).
  - Les quatre références avec personnages (120 pas), la forge sabotée et l'orage.
- **Midi** (`?time=midday`), contre `main` figé, au seuil 0 : **0 px partout**.
  - Graine 1842 × A, B, C, D, D lointain (`static=1&occ=0`).
  - Les quatre références avec personnages.
- **Le matin et la fin de journée** :
  - témoins de répétition (deux chargements, B, 120 pas) : 0 px chacun ;
  - les captures des planches, faites au troisième tour, sont identiques à celles du code final (0 px en B).
- **Combinaisons**, toutes sans erreur de page (sortie de `detshots` relue) :
  - le matin et l'orage ;
  - la fin de journée et la forge sabotée ;
  - le matin à la graine 7719 ;
  - la fin de journée à la graine 7719 avec la neige ;
  - la fin de journée sous la pluie, en A.
- **Le titre du HUD**, sans `clean=1` : « Merchant District — Morning », « — Midday », « — End of day », « — Night ».
- **[KO → corrigé] la série interrompue** :
  - **Ce qui s'est passé** : les deux serveurs ont été arrêtés pendant la série (« stopped by the user », 03 h 55 UTC). C'était au moment où mon
    tour de séance se terminait, la série tournant encore en arrière-plan. Les 17 premières vues de nuit étaient faites (0 px) ; tout ce qui
    suivait a échoué, sur les deux serveurs (connexion refusée).
  - **Correction** : les serveurs ont été relancés, et le reste de la série a été rejoué en entier. Le tour n'a plus été rendu avant la fin de la
    série.
  - **[KO → corrigé] une preuve trop faible** : `detshots` affiche une erreur de page sans échouer, et la série jetait sa sortie. Le « ok » des
    combinaisons ne prouvait donc que le démarrage. Elles ont été rejouées en gardant la sortie ; c'est le résultat ci-dessus.
- **Tests** (`tests/day-state.test.mjs`, 4 tests) :
  - les paramètres, dont `evening` qui donne la nuit ;
  - midi garde le ciel `{ DAY: 1 }` ; chaque état compile `DAY` ;
  - le matin plus bas que midi, plus doux, dans une brume froide ; la fin de journée basse, au fond du canal, dorée, avec des ombres bleues ;
    les deux venus du côté canal (le front éclairé, pas à contre-jour).
  - **Quatre fautes injectées, attrapées**, avant la série de preuves et sans serveur qui mesure : `evening` lu comme la fin de journée ; la
    lueur du soleil dans le ciel de midi ; le soleil de la fin de journée derrière le front ; une brume du matin chaude. Le fichier est
    restauré à l'octet (`cmp`).
- **Validation** : typecheck, `npm test` 95 / 95, build, `art:validate`.
- **Planches pour l'opérateur** (`screenshots/calibration/y4-day-states/`) :
  - `B-morning-track-vs-game.png` et `B-end-of-day-track-vs-game.png` : la piste à côté du jeu, en B ;
  - `morning-ABCD.png` et `end-of-day-ABCD.png` : les quatre cadrages ;
  - `B-four-states.png` : le matin, midi, la fin de journée et la nuit, en B.

### Journal — [OK] archivage (règle d'`AGENTS.md`, passes gardées au-delà d'environ 60 Ko)
- Les passes gardées faisaient 80 019 octets.
- Les onze passes du jalon M1 partent d'un seul bloc, dans leur ordre et à l'octet : H9, R1, D3, H10, K6, K7, K8, Z1, Z2, Z3 et Z4, toutes closes
  (branches fusionnées).
  - Destination : `journal/12-passes-H9-Z4.md`, soit un en-tête, une ligne `---`, puis les 48 184 octets inchangés (SHA-256
    `b777643766f47c6b…`).
  - La ligne d'index et la phrase d'en-tête sont mises à jour.
- **Preuve** (script hors dépôt, contre la copie de `JOURNAL.md` faite juste avant, les huit contrôles de la Passe D1) : **8 / 8**. Contrôle
  négatif : un mot changé dans une copie de l'archive → 6 / 8.

### Restes [?]
- **À juger par l'opérateur en jeu** (J9) : `npm run dev`, puis `?time=morning` et `?time=afternoon`. Rien n'est approuvé, et la nuit reste
  le défaut.
- **Contre les pistes** :
  - l'eau du matin reste plus pâle, car elle reflète la brume ;
  - en fin de journée, les ombres longues sont moins marquées que sur la piste, et la lueur du fond est plus faible ;
  - sous le grade chaud, les intérieurs de boutique (0,35, comme à midi) se lisent allumés (en D).
- **À faire** (Passe D6) : la météo sur chaque état ; J7.
- **Non mesuré** : le temps GPU des états du jour.

### Pensée
- Une réponse brève (« okay go ») à une question à boutons se lit comme la réponse recommandée, et le journal dit que c'est une lecture.
- Un soleil rasant à contre-jour éteint un front entier. Le soleil d'une piste se lit sur la direction de ses ombres à l'écran et sur ce
  qu'il éclaire, pas seulement sur sa lueur.

## Passe Y5 — La météo sur chaque état : de jour, la couverture voile le soleil et grise le ciel (décision D6) ; la nuit et les jours clairs inchangés (2026-10-20)

### Demande
- Opérateur, mot pour mot : « Passe à la météo sur chaque état (matin, midi, fin de journée, nuit) : l'orage de jour voile le soleil, la pluie
  et la neige. » C'est la tâche 4 de la Passe D6.
- Branche `day-weather-y5` depuis `main` (`c4a19ce`).

### Constat de départ
- La météo (Passes W1-W3) écrivait les mêmes valeurs de jour que de nuit, avec trois défauts de jour :
  - le soleil restait net sous l'orage, et son ombre avec lui ;
  - la variante `DAY` du ciel recouvrait la couche nuageuse et l'éclair ;
  - le vent seul mouillait les pavés du jour (`uWet` remis à 1, la valeur de la nuit).
- La nuit, la météo est celle que l'opérateur a revue : elle ne change pas.

### Fait — [OK]
- **`Weather` reçoit `{ day, post }`** (`App.setWeather` passe `this.day` et les réglages du grade). Sans `day`, chaque valeur est celle des
  Passes W1-W3.
- **De jour, la couverture c** (`uCloud` = orage + 0,6 × pluie + 0,5 × neige, au plus 1) :
  - **voile le soleil** : sa couleur × (1 − 0,82 c), soit 18 % sous un orage plein ; son ombre faiblit avec lui ;
  - **grise l'ambiance** (vers sa luminance, 0,6 c) et la renforce un peu (le ciel couvert éclaire de partout) ;
  - **grise la brume de l'horizon et le zénith** (0,9 c), plus sombres sous l'orage ; l'orage épaissit la brume (× 1 + orage) ;
  - **baisse la saturation** du grade (× 1 − 0,35 c).
  - **[KO → corrigé]** au premier réglage, la brume gardait 20 % de son bleu sous l'orage de midi (0,8 c) : le test l'a vu, la planche aussi. Passée à 0,9 c.
- **Les pavés** : de jour, ils partent de la sécheresse de l'état. La pluie les mouille vers 1,3, la neige retire les flaques, le vent seul ne
  change rien.
- **L'éclair de jour** : le soleil voilé monte moins (× 1 + 1,2 f au lieu de 3 f), et la brume s'éclaircit vers un blanc froid au lieu de
  l'indigo pâle de la nuit, qui l'aurait assombrie.
- **Le ciel de jour** : une variante `DAY_WEATHER`, compilée seulement de jour et sous une couverture. Elle mêle au ciel de l'état une couche
  grise, dans le ton de la brume voilée, aux masses lentes plus sombres, et y dessine l'éclair pendant un flash.
  - Le tracé de l'éclair est celui de la nuit, recopié dans une fonction sous `#ifdef`, pour ne pas changer le code de la nuit.
  - `skyDefines` (`DayState.ts`) donne les défines : aucune la nuit ; ceux de l'état, plus `DAY_WEATHER` sous une couverture.
  - `App.setWeather` les met à jour quand la météo change en jouant (panneau DEV).
- **`dispose`** rend aussi, de jour, les couleurs voilées et la saturation, sauf celles qu'autre chose a changées entre-temps.
- **Les états gardent leur caractère** sous la météo : l'orage de la fin de journée reste plus chaud, celui du matin gris-bleu. La neige de la fin
  de journée garde une lumière dorée, puisque le soleil n'est voilé qu'à moitié.

### Preuves
- **Contre `main` figé** (`c4a19ce`, :5187), au **seuil 0** : **0 px partout** (écart max 0) ; aucune erreur de page, la sortie de `detshots`
  étant gardée et relue.
  - **La nuit claire** : graines 1842 et 7719 × A, B, C, D, D lointain et les quatre transitions figées (`static=1&occ=0`) ; les quatre
    références avec personnages et la forge sabotée.
  - **La nuit sous chaque météo** (B avec personnages) : `rain=1`, `snow=1`, `storm=1`, `wind=2`, `rain=0.5&snow=0.6`. Et en A, l'orage, avec
    et sans flash (forcé par `strike`).
  - **Le matin, midi et la fin de journée sans météo** : A, B, C, D (`static=1&occ=0`), et B avec personnages.
- **Les météos de jour** : témoins de répétition (deux chargements) à 0 px pour midi sous l'orage, le matin sous la pluie, la fin de journée sous
  la neige et sous l'orage.
- **Posé puis retiré en jouant** (`App.setWeather`, le chemin du panneau DEV) : un orage posé puis retiré redonne le jour clair à 0 px, à midi et
  en fin de journée. Contrôle : l'orage laissé posé change 97,4 % des pixels.
- **La série a été attendue dans le tour**, comme le demande le principe de la Passe Y4 : aucun serveur n'a été arrêté pendant.
- **Tests** :
  - `tests/weather.test.mjs` +1 : de jour, l'orage voile le soleil (au plus 20 %) et grise la brume, le zénith et l'ambiance ; la brume
    s'épaissit, la saturation baisse, la pluie mouille ; un flash éclaircit la brume du jour ; la pluie voile à moitié ; la neige retire les
    flaques ; le vent seul ne mouille pas ; `dispose` rend tout ; la nuit ne touche ni la lumière ni le grade, et garde sa formule des pavés.
  - `tests/day-state.test.mjs` +1 : `DAY_WEATHER` seulement de jour et sous une couverture ; le ciel de la nuit n'a jamais de défines.
  - **Six fautes injectées, attrapées**, sans série en cours : le voile la nuit aussi ; le vent seul qui mouille le jour ; `dispose` qui laisse
    le voile, ou la saturation ; un flash de jour qui assombrit la brume ; `DAY_WEATHER` sans météo. Les fichiers sont restaurés à l'octet.
- **Validation** : typecheck, `npm test` 97 / 97, build, `art:validate`.
- **Planches** (`screenshots/calibration/y5-day-weather/`) : `morning-weather.png`, `midday-weather.png`, `end-of-day-weather.png`. Chacune
  montre l'orage, la pluie et la neige en B, et l'orage pendant un flash en A.

### Restes [?]
- **À juger par l'opérateur en jeu** (J9) : `?time=midday&storm=1` et les autres combinaisons. Le panneau DEV (touche H, section
  « Weather ») change la météo en jouant.
- **Non faits** : la neige sur les personnages, les éclaboussures (Passe W1). Le soleil voilé garde la direction de son ombre ; seule sa force
  baisse.
- **Non mesuré** : le temps GPU (la variante `DAY_WEATHER` ajoute du bruit au ciel ; la précipitation coûte ce qu'elle coûtait la nuit).
- **À faire** (Passe D6) : J7, la foule du jour.

### Pensée
- Un effet écrit pour un état (la nuit) se généralise par une option qui ne change rien sans elle. Chaque nouvelle valeur passe par une
  branche du code de l'effet, jamais par une formule « générale » qui redonnerait la nuit à l'arrondi près.
- Un défaut de jour se trouve en relisant chaque valeur absolue qu'écrivait l'effet : `uWet` = 1 voulait dire « la nuit ».

## Passe R3 — La foule du jour (J7) : proposition chiffrée publiée sur une fiche ; le placement au-delà de huit préparé derrière `?crowd` (2026-10-20)

### Demande
- Opérateur, mot pour mot : « Prépare la proposition chiffrée de la foule du jour (J7), avec sa mesure GPU, pour que je décide. »
- C'est la tâche 5 de la Passe D6. Le choix J7 de la fiche de l'état jour était « Plus de monde le jour (note) », note vide (Passe D4).
- Branche `day-crowd-sheet-r3` depuis `main` (`78337cb`).

### Constat — [OK] le placement plafonnait la foule à huit
- Un promeneur naît à 3,2 m au moins de tout autre personnage, en 20 essais (`ActorSystem.populate`).
- Sur le quai réel (graine 1842), `?crowd=8` n'en plaçait que 7, et `?crowd=10` ou `?crowd=12` que 8. Le paramètre plafonnait sans le dire.
- Vu par un relevé de ce que chaque effectif montre à l'écran (harnais de `tools/step-angles.mjs`, script hors dépôt). La première version
  comptait les acteurs de détail « crowd », qui comprennent des PNJ placés à la main : elle compte maintenant le rôle `crowd`.

### Fait — [OK]
- **Préparé derrière `?crowd` seulement** : un promeneur sans place réessaie à 2,2 m, puis à 1,4 m, 20 essais chacun.
  - Sans `crowd`, le code ne passe jamais par là : ses tirages restent en place, de nuit comme de jour.
  - Avec un effectif qui tient à 3,2 m (5 aujourd'hui), rien ne change non plus.
  - Désormais, 8, 10 et 12 demandés sont tous placés.
- **Fiche privée** : https://claude.ai/artifact/EYTkeGc68zoUih9yziKjiB. Les choix sont enregistrés dans la collection `decisions`, vide à la
  publication (relue). Le style et la logique sont ceux des fiches des Passes R1 et R2.
  - En tête : comment voir en jeu (`?time=midday&crowd=12`, `?time=morning&crowd=6`, `?time=afternoon&crowd=9`) ; les deux tableaux de
    mesures ci-dessous.
  - **J7a, combien de promeneurs pour chaque état du jour.** Ma recommandation : matin 6, midi 12, fin de journée 9 (la note de l'opérateur à
    J1 : le matin les lève-tôt, midi le moment où beaucoup de choses se passent). Autres options : 8 / 12 / 10, 5 / 8 / 6, cinq partout.
  - **J7b, le placement resserré au-delà de huit.** Recommandé : l'accepter ; sinon, plafonner à huit.
  - Sept captures déterministes (300 pas, les promeneurs ont marché), en JPEG hors du dépôt : midi en B à 5, 8 et 12, en D à 5 et 12, le matin à
    6 et la fin de journée à 9.

### Mesures
- **À l'écran** (midi, 40 s de `App.update` à pas fixes, 4 relevés par seconde) :

| demandés | placés | B : à l'écran | B : paires qui se chevauchent | D : à l'écran (max) | D : paires |
|---|---|---|---|---|---|
| 5 (aujourd'hui) | 5 | 5 | 2,2 | 1,7 (3) | 0,26 |
| 8 | 8 | 8 | 4,7 | 2,5 (4) | 0,34 |
| 10 | 10 | 10 | 7,3 | 3,6 (5) | 0,46 |
| 12 | 12 | 12 | 8,6 | 4,0 (6) | 0,47 |

  - B voit tout le quai ; D n'en voit qu'une partie.
  - Une paire « se chevauche » quand deux silhouettes se recouvrent à l'écran (pieds à moins de 0,45 hauteur en travers et 0,5 en hauteur ;
    hauteur = 1,7 m projetés × l'échelle de l'acteur × celle du cadrage). C'est une approximation, pour comparer les effectifs entre eux.
- **GPU** (`tools/perf.mjs`, Radeon 780M, médiane de 5 tours entrelacés, **5 / 5 tours propres** au témoin de contention) :

| variante | 1920 × 1080 | 2560 × 1267 | JS `update` |
|---|---|---|---|
| nuit, 5, B | 10,07 ms | 14,44 ms | 0,51 ms |
| midi, 5, B | 9,03 | 13,16 | 0,53 |
| midi, 8, B | 8,84 | — | 0,55 |
| midi, 12, B | 8,81 | 12,93 | 0,58 |
| midi, 5, D | 8,15 | — | 0,52 |
| midi, 12, D | 8,22 | — | 0,60 |

  - **Entre 5 et 12 promeneurs, l'écart reste dans le bruit** (± 0,2 ms) : tous les personnages sont dessinés en un appel (113 appels en B dans
    tous les cas). Le JS paie 0,05 ms par image pour 7 promeneurs de plus.
  - **Le temps GPU du jour, non mesuré jusqu'ici** (Passes Y1-Y4) : midi coûte environ 1 ms de moins que la nuit (1,3 ms en 2560 × 1267). Il
    n'a que 4 lumières allumées sur 24.
- **[KO → corrigé] la première série GPU** (3 tours) ne valait pas pour deux raisons.
  - **Elle mesurait 8 promeneurs au plus** : c'est le plafond ci-dessus.
  - **Elle était en contention** : un processus Chrome étranger utilisait 25 à 42 % de l'adaptateur. À 2560 × 1267, midi n'avait aucun tour
    propre. C'était l'onglet du jeu que la séance avait ouvert dans son panneau navigateur (`preview_start`), qui rendait en arrière-plan.
    Une fois l'onglet fermé, la seconde série a eu 5 tours propres sur 5 pour chaque variante.

### Preuves
- **Le jeu sans `crowd` ne change pas** (captures déterministes avec personnages, contre `main` figé `78337cb` sur :5187, au **seuil 0**) :
  **0 px**, sans erreur de page.
  - La nuit : A, B, C (120 pas), D (300 pas).
  - Midi : B et D (300 pas).
- **`?crowd=5` ne change pas** : 0 px la nuit en B, à midi en B et en D (300 pas).
- **Contrôle** : `?crowd=12` à midi en B diffère de `main` (3,7 % des pixels), puisque `main` n'en plaçait que 8.
- **Tests** (`tests/crowd.test.mjs` +1) :
  - au-delà de ce que tient 3,2 m, le défaut s'arrête et garde 3,2 m entre ses promeneurs ;
  - `?crowd` en place plus de dix de plus, jamais à moins de 1,4 m, et le dernier palier sert ;
  - jusqu'au premier promeneur sans place, `?crowd` tire exactement ce que tire le défaut.
  - **Trois fautes injectées, attrapées** : le défaut qui se resserre aussi ; pas de resserrement ; un palier à 0,6 m. Le fichier est restauré
    à l'octet.
- **Validation** : typecheck, `npm test` 98 / 98, build, `art:validate`.

### Restes [?]
- **Attendre que l'opérateur dise la fiche remplie**, puis relire `decisions`, consigner les choix mot pour mot et les appliquer :
  - l'effectif de chaque état du jour devient son défaut ;
  - la nuit garde ses cinq promeneurs (le district est clos) ;
  - sans J7b, l'effectif plafonne à huit.
- **Restent ensuite** : la revue du jour par l'opérateur en jeu (J9) ; le remède RK3 (Passe K8).

### Pensée
- Un paramètre de nombre se vérifie contre ce qui est vraiment placé : 12 demandés en plaçaient 8, sans erreur ni message.
- Le panneau navigateur de la séance est un client du GPU comme un autre. Une mesure de temps se fait sans l'onglet du jeu qu'il garde ouvert.

## Passe D7 — La foule du jour (J7) : les choix de l'opérateur consignés et appliqués ; matin 6, midi 12, fin de journée 9 (2026-10-20)

### Demande
- Opérateur, mot pour mot : « La fiche de la foule du jour (J7) est remplie : relis mes choix, consigne-les et applique-les. »
- Branche `day-crowd-d7` depuis `main` (`5461086`).

### Les choix — [?] la fiche n'avait rien enregistré
- La collection `decisions` de la fiche (https://claude.ai/artifact/EYTkeGc68zoUih9yziKjiB) était **vide**, relue deux fois (`list` et
  `query`). Les choix cliqués ne s'y sont pas enregistrés ; la cause n'est pas connue (la page affiche « Enregistrement indisponible » quand
  elle ne reçoit pas la base).
- Je n'ai rien deviné. Les deux questions ont été reposées dans la séance, avec les mêmes options et les mêmes recommandations. Réponses de
  l'opérateur, mot pour mot (l'option choisie) :

| | Décision | Choix |
|---|---|---|
| J7a | Combien de promeneurs pour chaque état du jour ? (la nuit garde ses cinq) | « Matin 6, midi 12, fin 9 (Recommandé) » |
| J7b | Le placement resserré au-delà de huit promeneurs (2,2 puis 1,4 m entre deux naissances) ? | « Accepter (Recommandé) » |

### Fait — [OK]
- **`DayState`** : chaque état porte son effectif à la densité 1 (`crowd`), soit 6 le matin, 12 à midi et 9 en fin de journée.
- **`ActorSystem`** : `crowdBase`, que `App` règle de jour seulement.
  - Sans `?crowd`, de jour : round(crowdBase × densité) promeneurs, les cinq citadins à tour de rôle, comme la nuit avec ses cinq. Le curseur
    de densité du panneau garde son effet.
  - Le placement resserré de la Passe R3 vaut aussi de jour (J7b). La nuit n'y passe jamais : ses tirages restent en place.
  - `?crowd=<n>` garde la main sur l'effectif, de jour comme de nuit.
- Au-delà de cinq, chaque citadin revient avec l'une de ses variantes approuvées (Passe V1).
- **`AGENTS.md`** : les paramètres `time` et `crowd`, la section « Status » et J7 dans la direction du jour.

### Preuves
- **Contre `main` figé** (`5461086`, :5187), au **seuil 0**, captures déterministes avec personnages : **0 px**, sans erreur de page.
  - **La nuit** : les quatre références (120 pas), B et D à 300 pas, l'orage en B.
  - **Le jour avec `?crowd`** (l'effectif fixé par le paramètre) : midi en B avec `crowd=5` et `crowd=12`, le matin en D avec `crowd=6` (300 pas).
- **Le jour par défaut change**, comme voulu : midi en B, 2,5 % des pixels contre les cinq promeneurs de `main`. Témoin de répétition (fin de
  journée en B, deux chargements) : 0 px.
- **Promeneurs placés par défaut** (graine 1842, densité 1) : 6 le matin, 12 à midi, 9 en fin de journée, 5 la nuit.
- **Tests** :
  - `tests/crowd.test.mjs` +1 : de jour, round(base × densité) promeneurs à tour de rôle ; la densité les règle ; `?crowd` l'emporte ; au-delà
    de ce que tient 3,2 m, le jour resserre et la nuit non ; les cinq premiers du jour sont où sont les cinq de la nuit ; la nuit garde cinq.
  - `tests/day-state.test.mjs` +1 : 6, 12 et 9 ; `App` les donne aux acteurs de jour seulement.
  - **Cinq fautes injectées, attrapées** : l'effectif du jour ignoré ; pas de placement resserré de jour ; la nuit à douze ; `App` qui ne donne
    pas l'effectif ; un matin à huit. Les fichiers sont restaurés à l'octet.
  - **[KO → corrigé]** une apostrophe dans le titre d'un test (« state's ») cassait la chaîne entre apostrophes du fichier, une faute déjà faite
    dans cette séance. Titre réécrit.
- **Validation** : typecheck, `npm test` 100 / 100, build, `art:validate`.
- **Planche** : `screenshots/calibration/d7-day-crowd/B-four-states-crowd.png` (le matin, midi, la fin de journée et la nuit en B, 300 pas).

### Restes [?]
- **La revue du jour par l'opérateur en jeu** (J9) : les quatre états, la météo, le pavois, la foule. La nuit reste le défaut jusque-là.
- **Le remède RK3** (Passe K8) reste à décider.
- La fiche n'enregistre pas toujours ses choix : à la prochaine, je relirai la collection dès qu'un choix est fait, ou je demanderai le
  récapitulatif copié.

### Pensée
- Une fiche dite remplie dont la collection est vide ne se devine pas : les questions se reposent avec les mêmes options, et le journal dit
  d'où vient la réponse.

