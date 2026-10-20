# Journal de bord — archive : passes R2, D4, D5, Y1, D6, Y2, Z5 et Y3 (2026-10-19)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-10-20 (Passe K10) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe R2 — Fiche de l'état jour (RJ2) publiée : dix décisions de direction artistique (2026-10-19)

### Demande
- Opérateur, mot pour mot : « Prépare la fiche de l'état jour (RJ2) avec les trois images et les questions de direction artistique. »
  Décision RJ2 « L'état jour » (Passe D3).
- Branche `day-sheet-r2` depuis `main` (`7012ccf`). Aucun code de jeu.

### Fait — [OK]
- **Page privée** : https://claude.ai/artifact/End97NNMhHPxtynBGNXyYW. Les choix sont enregistrés dans la collection `decisions`, vide à la
  publication (relue). Le style et la logique sont ceux des fiches des Passes G1 et R1 ; le récapitulatif peut aussi se copier.
- **En tête, les trois pistes** : la même consigne depuis la capture de nuit du cadrage B, seule l'heure change ; leur statut non canonique ; ce
  qu'elles valent (lumière, palette, ciel, pavois) et ce qu'elles ne valent pas (l'outil a redessiné les personnages et des détails).
- **Dix décisions**, chacune avec son contexte, des images, ma recommandation et ses options :
  - lumière et palette : J1 l'heure par défaut (recommandé : le matin) ; J2 la palette (transposer la règle de la nuit) ; J3 le ciel et la
    brume (ciel pâle, brume légère) ; J4 les lumières de la ville (éteintes, la forge allumée) ;
  - le tournoi : J5 le pavoisement (aux points focaux) ; J6 le pavois la nuit aussi (le jour seulement) ; J7 la foule du jour (la même pour
    commencer) ;
  - jour et nuit : J8 le passage (deux états fixes) ; J9 quand le jour devient le défaut (après la revue de l'opérateur en jeu) ;
  - méthode : J10 les trois images (archiver la ou les pistes retenues, non canoniques).
- **Images de la page** : les trois pistes et deux captures de nuit (A, B), en JPEG de qualité 0,9 (2,2 Mo en tout, contre 14 Mo en PNG),
  hors du dépôt.
- **Vérification** : un rendu local à 1 280 px et à 400 px de large ; aucune erreur de page, pas de défilement horizontal.

### Restes [?]
- Attendre que l'opérateur dise la fiche remplie. Ensuite : relire `decisions`, consigner les choix mot pour mot, écrire la direction
  artistique du jour dans `AGENTS.md`, puis un premier jet derrière un paramètre, montré en captures aux quatre cadrages.

### Pensée
- Une fiche de direction artistique montre les pistes côte à côte avec l'état actuel. Elle dit aussi ce qu'une image générée vaut (la lumière,
  la palette) et ce qu'elle ne vaut pas (des personnages redessinés).

## Passe D4 — Fiche de l'état jour remplie (RJ2) : dix décisions de l'opérateur consignées ; deux pistes archivées (2026-10-19)

### Demande
- Opérateur, mot pour mot : « La fiche de l'état jour est remplie : relis mes choix, consigne-les et applique-les. »
- La fiche (https://claude.ai/artifact/End97NNMhHPxtynBGNXyYW), collection `decisions` : 10 documents, lus vers 00 h 45 UTC le 20/10.
- Branche `decisions-d4` depuis `main` (`233d9bb`).

### Les choix, mot pour mot (l'option cliquée ; la note quand il y en a une)

| | Décision | Choix | Note |
|---|---|---|---|
| J1 | L'heure par défaut | « Midi » | « je préfère midi car cela marque une vrai différence avec la nuit et sur le plan logique. c'est le moment où beaucoup de chose se passe. le matin c'est les levés-tot et les pre-preparation » |
| J2 | La palette du jour | « Transposer la règle de la nuit » | — |
| J3 | Le ciel et la brume | « Ciel pâle et brume légère » | — |
| J4 | Les lumières de la ville le jour | « Éteintes, la forge allumée » | — |
| J5 | Le pavoisement | « Aux points focaux » | — |
| J6 | Le pavois la nuit aussi ? | « Le jour seulement » | — |
| J7 | La foule du jour | « Plus de monde le jour (note) » | — (vide) |
| J8 | Le passage entre jour et nuit | « Deux états fixes » | — |
| J9 | Quand le jour devient le défaut | « Après ma revue en jeu » | — |
| J10 | Les trois images | « Archiver la ou les pistes retenues » | — |

### Lectures — dites à l'opérateur dans la séance
- **J1 avec J2 et J3** : la lumière de midi (soleil haut, ombres courtes et nettes), sous un ciel pâle voilé et une brume légère, dans la palette
  de la nuit transposée. Le ciel bleu saturé et les toits bleus de la piste de midi ne sont pas retenus : ils étaient l'option « Bleus saturés »
  de J2 et « Ciel bleu net » de J3, non choisies.
- **J7** : l'option demandait une note, laissée vide. Le nombre de promeneurs du jour n'est pas décidé ; il sera proposé avec sa mesure (temps
  GPU, lisibilité), pas inventé.
- **J10** : les pistes retenues sont **midi** (l'heure, J1) et **le matin**, qui illustrait sur la fiche la palette et le ciel choisis (J2,
  J3). La fin d'après-midi n'est pas archivée.

### Fait — [OK]
- **J10, archivage** (`tools/art-lab/gen-image.mjs --archive`, à l'octet, `cmp` identique), comme **références non canoniques** :
  - `art-lab/characters/reference/sources/day-state-midday-2026-10-19.png` (`8396a46cd599b114…`) : l'heure et la lumière ;
  - `day-state-morning-2026-10-19.png` (`eef6501cedf43717…`) : la palette, le ciel et la brume ;
  - chacune avec sa fiche de provenance (aucune clé dedans) ; `art:validate` : 16 sources, 0 erreur.
- **`AGENTS.md`**, direction artistique : un paragraphe « Day » avec ces décisions. La nuit reste l'état par défaut jusqu'à la revue de
  l'opérateur en jeu (J9).
- « À reprendre » § 0 et § 6d mis à jour.

### À appliquer ensuite, une branche par tâche
1. **Un premier jet du jour derrière un paramètre** (J9 : la nuit reste le défaut, 0 px sans le paramètre) : le soleil de midi et son ombre, le
   ciel pâle et la brume légère, la palette transposée (étalonnage, lumière, brouillard), lanternes et fenêtres éteintes, la forge allumée.
   Montré à l'opérateur en captures aux quatre cadrages.
2. **Le pavois du tournoi**, le jour seulement, aux points focaux (J5, J6) : des guirlandes en travers de la rue devant l'étal du héros et vers
   la forge, des bannières sur le pont et au mât du bateau (la recommandation de l'option choisie).
3. **J7** : une proposition chiffrée de la foule du jour, avec sa mesure, à décider par l'opérateur.
4. Le jour par défaut seulement après l'approbation de l'opérateur en jeu (J9) ; deux états fixes, sans cycle (J8).

### Pensée
- Des choix pris option par option se composent : une heure (J1), un ciel (J3) et une palette (J2) peuvent venir de pistes différentes. La
  lecture se dit à l'opérateur avant d'agir, avec l'option non choisie qui la justifie.
- Une option « (note) » cochée sans note ne donne pas son détail : il se propose, il ne se devine pas.

## Passe D5 — [KO → corrigé] un chemin machine commité dans deux fiches de provenance (Passe D4) ; l'outil d'images ne l'écrit plus (2026-10-19)

### Ce qui s'est passé
- Le commit de la Passe D4 (`304dfcb`, fusionné et poussé sur `main`) contenait, dans les fiches des deux pistes archivées
  (`day-state-midday-2026-10-19.source.json`, `-morning-`), un champ `promptFile` portant le chemin absolu du fichier de prompt, dans le
  dossier temporaire de la séance : il nomme l'utilisateur Windows et ce dossier. **Pas de secret** (ni clé ni jeton), mais la règle d'`AGENTS.md`
  interdit tout chemin machine dans un commit.
- **Deux causes** :
  - `tools/art-lab/gen-image.mjs` recopiait `--prompt-file` tel qu'on le donnait (et le chemin relatif d'une référence hors du dépôt) ;
  - ma commande lançait le scan des chemins puis le commit, séparés par `;` : le scan a trouvé les deux lignes, et le commit est parti quand
    même. C'est la faute des Passes M3, K5 et Z1 : une vérification qui doit arrêter une étape irréversible est liée à elle par `&&`.
- Le chemin a été vu à la sortie du scan, juste après le push. Rien d'autre n'en contient (`git grep` sur `art-lab`, `tools`, `tests`, `src`).

### Corrigé — [OK]
- **L'outil** : `recordPath` écrit un chemin relatif au dépôt (séparateurs `/`), ou seulement le nom du fichier, précédé de « (outside the
  repository) », quand il est hors du dépôt. Il sert au fichier de prompt et aux références.
- **Test** (`tests/gen-image.test.mjs`, +1) : un prompt et une référence hors du dépôt, une référence dedans ; la fiche écrite ne contient ni
  le dossier extérieur, ni le dossier temporaire, ni le dossier de l'utilisateur. **Contrôle négatif** : avec l'outil d'avant, ce test échoue
  (1 échec sur 8) ; avec le nouveau, 8 / 8.
- **Les deux fiches** : `promptFile` ramené au nom du fichier, avec une entrée `archived.corrections` datée qui dit ce qui a changé et
  pourquoi. Le prompt exact et son SHA-256 ne changent pas ; les images non plus. `art:validate` : 16 sources, 0 erreur.
- **L'historique n'est pas réécrit** : le chemin reste lisible dans `304dfcb`. Le retirer demanderait de réécrire `main` et de pousser en
  force, ce qui revient à l'opérateur ; c'est dit dans la séance.
- **Validation** : typecheck, `npm test` 88 / 88, build, `art:validate`.

### Pensée
- Un scan avant un commit est une porte, pas un affichage : il doit faire échouer la chaîne (`! git grep -q … && git commit …`), sinon il
  constate après coup.
- Un outil qui écrit une fiche de provenance n'y recopie jamais un chemin donné tel quel : il le rend relatif au dépôt, ou n'en garde que le
  nom.

## Passe Y1 — L'état jour : un premier jet derrière `?time=day`, la nuit inchangée (décisions J1 à J4, J8, J9) (2026-10-19)

### Demande
- Opérateur, mot pour mot : « La fiche de l'état jour est remplie : relis mes choix, consigne-les et applique-les. » Ordre de la Passe D4 :
  d'abord un premier jet derrière un paramètre, montré en captures aux quatre cadrages.
- Branche `day-state-y1` depuis `main` (`39316b9`).
- Avant le code, un agent a cartographié en lecture seule où vivent les valeurs « nuit » du moteur (lune, ambiance, ciel, brume, lumières,
  fenêtres, étalonnage, météo).

### Fait — [OK]
- **`src/atmosphere/DayState.ts`** :
  - `parseTime` : seul `?time=day` fait le jour ;
  - `DAY` : la table des valeurs du jour ;
  - `litByDay` : de jour, seule la forge brûle, c'est-à-dire son feu, ses braises, la barre chaude et le foyer sous sa hotte ; ses deux lanternes
    de porche sont des lanternes (J4).
- **`App`** (`?time=day` lu avant le ciel ; rien d'écrit sans lui) :
  - le soleil prend la place de la lune : sa direction et sa couleur, donc son ombre rendue à la génération, le liseré et l'ombre de contact des
    sprites ;
  - puis l'ambiance, la brume et le ciel, les pavés et l'étalonnage ;
  - le verre des fenêtres et des lanternes et les intérieurs de boutique faiblissent ; la forge garde sa lueur sur sa propre copie du matériau ;
  - les lumières éteintes passent à l'échelle 0, ce qui les retire de l'envoi, de l'in-scatter, des halos et des ombres de sprites.
- **Le ciel et la ville lointaine** : de jour, une variante compilée avec `#define DAY`, jamais une branche à l'exécution.
  - Le ciel devient pâle, voilé de nuages fins plus clairs que la brume ; ni lune, ni couronne, ni étoiles.
  - Les fenêtres, les lampes du pont et la lueur de rue du lointain s'éteignent.
- Le titre du HUD dit « Day » de jour.
- **Les valeurs du premier jet**, réglées en trois tours de captures :
  - le soleil à 55° de hauteur, venu de l'amont du canal, côté canal, couleur (2,6 ; 2,3 ; 1,8) ;
  - l'ambiance du ciel (0,34 ; 0,38 ; 0,45) ;
  - la brume à 0,006 (nuit : 0,013), la brume basse à 0,1 ;
  - le verre à 0,06 (nuit : 2,3), les boutiques à 0,35 (nuit : 1,9) ;
  - l'étalonnage : exposition 1,0, bloom 0,18 au seuil 3,0, vignette 0,22, palette 0,6, saturation 1,0, l'ombre moins bleue (0,96 ; 0,99 ; 1,1) ;
  - **mon choix, pas un choix de la fiche** : des pavés plus secs que la nuit (`uWet` 0,35 au lieu de 1).
  - Tour 1 : brume à 0,012, on lisait un matin brumeux ; tour 2 : brume baissée, mais une image lavande ; tour 3 : soleil plus chaud, ombre du
    grade moins bleue.

### [KO → corrigé] la nuit bougeait d'un niveau
- **Première version** : le jour était une branche `if (uDay > 0.0)` dans les shaders du ciel et du lointain, avec des facteurs qui valent 1 la
  nuit.
- **La preuve au seuil 0 l'a vu** : 2 et 3 px décalés d'1 / 255 en A (graines 1842 et 7719). Une branche non prise changeait la compilation.
- **Ma faute de preuve** : le premier passage comparait au seuil par défaut de `tools/diff.mjs` (24). C'est la colonne « max » qui a montré
  l'écart.
- **Corrigé** : le jour devient une variante compilée ; l'uniforme `uDay` est retiré. Cette première version sert de contrôle négatif : le même
  outil y voyait l'écart.
- **[?] L'arène** : sa capture (`tools/arena-scene-shots.mjs`) n'est pas reproductible : `main` contre `main`, 99,99 % des pixels diffèrent,
  jusqu'à 34. Elle ne prouve donc rien. Son matériau du lointain reste celui de `main` : sans `DAY`, la même source après le préprocesseur.

### Preuves
- **Nuit** (sans `?time=day`), contre `main` figé (`39316b9`, :5187), au **seuil 0**, **0 px partout** :
  - graines 1842 et 7719 × A, B, C, D, D lointain et les quatre transitions figées (`static=1&occ=0`, 30 pas) ;
  - les quatre références avec personnages (120 pas), la forge sabotée et l'orage.
- **Jour** : témoin de répétition (deux chargements) **0 px**.
  - Le jour final contre le troisième jet : 2 px d'écart d'1 niveau, car le mélange par `uDay = 1` a disparu.
  - Combinaisons sans erreur de page : jour et orage, jour et forge sabotée, jour à la graine 7719.
- **Tests** (`tests/day-state.test.mjs`, 3 tests) :
  - le paramètre ;
  - les lumières gardées et éteintes, sur les étiquettes des générateurs ;
  - la variante compilée (aucune branche `uDay`) ;
  - un soleil de midi ni trop bas ni vertical (la caméra de l'ombre regarde le long de lui), chaud contre une ambiance froide.
  - **Quatre fautes injectées, attrapées** : les lanternes de la forge gardées, toute valeur de `time` acceptée, `uDay` à 1 par défaut (avant
    son retrait), un soleil vertical.
- **Validation** : typecheck, `npm test` 91 / 91, build, `art:validate`.
- **Planches pour l'opérateur** : `screenshots/calibration/y1-day/{A,B,C,D}-night-day.png` (la nuit à gauche, le jour à droite, graine 1842).

### Restes [?]
- **La revue de l'opérateur en jeu** (J9) : `npm run dev`, puis `?time=day`. Rien n'est approuvé, et la nuit reste le défaut.
- **Pas encore faits** : le pavois du tournoi (J5, J6), la foule du jour (J7, nombre à proposer).
- **Vus sur les captures** :
  - les petites fumées de cheminée restent sombres (couleurs écrites pour la nuit) ;
  - le joint des pavés est très sombre en D ;
  - le verre des fenêtres se lit brun foncé (aucun reflet du ciel) ;
  - l'orage de jour pleut sous un soleil net : le ciel de jour ignore la couche de nuages, et les éclairs ne s'y dessinent pas.
- **Non mesurés** : le temps GPU du jour ; les autres graines aux quatre cadrages.

### Pensée
- Un état qui ne doit rien changer sans son paramètre se fait en variante compilée (`#define`), pas en branche à l'exécution : une branche non
  prise peut changer l'arrondi du code autour d'elle.
- Une preuve « 0 px » donne son seuil, et la colonne du maximum se lit : au seuil par défaut, un écart d'un niveau passe inaperçu.
- Une capture se recoupe avec son témoin de répétition avant de prouver quoi que ce soit (l'arène).

## Passe D6 — Le jour : la piste de midi est la cible ; quatre états, la météo sur chacun ; le pavois comme l'image (décisions de l'opérateur) (2026-10-19)

### Demande et décisions, mot pour mot
- Après les planches du premier jet (Passe Y1), l'opérateur joint une image et écrit : « le jour doit etre cette image joint puis nous aurons
  donc matin, midi (lancement du tournoi), fin de journnee(apres le tournoi),  soir avec les variances meteoroligiques qui doivent etre
  applicable »
- Deux questions lui sont posées dans la séance ; ses réponses (l'option choisie) :
  - « Le « soir » de ta liste, c'est la nuit actuelle (lune, lanternes allumées) ou un nouvel état entre la fin de journée et la nuit ? » →
    « La nuit actuelle (Recommandé) » ;
  - « Le pavois de midi : comme l'image (guirlandes tout le long du front et sur le mur du quai), ou aux points focaux comme tu l'avais choisi
    (J5) ? » → « Comme l'image (Recommandé) ».
- **L'image jointe est la piste de midi** (Passe Z4), réencodée en WebP : à la même taille que `day-state-midday-2026-10-19.png`, 0,38 % des
  pixels diffèrent au-delà de 24 (la compression). La référence reste le PNG archivé, aux octets de l'API.
- Branche `decisions-d6` depuis `main` (`e68e340`).

### Ce qui change
- **Midi est la piste de midi** : un ciel bleu profond aux nuages blancs, un soleil haut, des ombres courtes et nettes, des toits et des
  bannières d'un bleu franc, le pavois du tournoi tout le long du front, en travers de la rue et sur le mur du quai.
  - Cela remplace, pour midi, trois choix de la fiche (Passe D4) : J2 « Transposer la règle de la nuit », J3 « Ciel pâle et brume légère » et
    J5 « Aux points focaux ».
- **Quatre états fixes** au lieu de deux (J8 « Deux états fixes ») : le matin, midi (le lancement du tournoi), la fin de journée (après le
  tournoi) et le soir, qui est la nuit actuelle, close. **La météo** (pluie, neige, orage, vent) s'applique à chacun.
- **Restent** de la fiche :
  - J1 « Midi » : midi est l'heure du lancement ;
  - J4 « Éteintes, la forge allumée » ;
  - J6 « Le jour seulement » : le pavois n'est pas tendu la nuit ;
  - J7 « Plus de monde le jour » : le nombre est encore à proposer ;
  - J9 « Après ma revue en jeu » : la nuit reste le défaut ;
  - J10 : les pistes retenues sont archivées.
- **Références** : le matin et la fin de journée prennent les pistes du matin et de la fin d'après-midi.

### Fait — [OK]
- **J10, la fin de journée archivée** : `art-lab/characters/reference/sources/day-state-late-afternoon-2026-10-19.png` (`d3573d64247ae288…`),
  à l'octet (`cmp` identique), avec sa fiche ; `art:validate` : 17 sources, 0 erreur.
- **[KO → corrigé] avant l'archivage** : la fiche de cette piste, écrite avant la Passe D5, portait encore le chemin absolu de son prompt, et
  `--archive` l'aurait recopié.
  - L'outil garde maintenant par leur nom seul les chemins hors du dépôt d'une fiche ancienne (prompt, références) et le note
    (`archived.pathsKeptByName`).
  - Test étendu ; avec l'ancien outil, il échoue (1 échec sur 8). La fiche archivée ne porte aucun chemin machine.
- **`AGENTS.md`** : la direction du jour réécrite (quatre états, la cible de midi, les références, la météo sur chacun).
- « À reprendre » § 0 mis à jour.

### À appliquer ensuite, une branche par tâche
1. **Midi fidèle à l'image**, derrière `?time=` ; la nuit reste à 0 px. Les états sont nommés `morning`, `midday` et `afternoon` ;
   `day` reste un alias de midi ; absent ou `night` donne la nuit. Montré à l'opérateur en captures aux quatre cadrages.
2. Le pavois du tournoi, comme l'image, par jour seulement.
3. Le matin et la fin de journée, depuis leurs pistes.
4. La météo sur chaque état : l'orage de jour voile le soleil, la neige, la pluie.
5. J7 : une proposition chiffrée de la foule du jour.

### Pensée
- Une image jointe se compare d'abord aux pièces archivées : c'était la piste de midi réencodée, et la référence reste l'original.
- Une décision plus récente de l'opérateur remplace des choix de la fiche : la passe le dit choix par choix, et garde ceux qui restent.

## Passe Y2 — Midi d'après la piste de midi, derrière `?time=midday` (décision D6) ; la nuit inchangée (2026-10-19)

### Demande
- Décision de l'opérateur (Passe D6), mot pour mot : « le jour doit etre cette image joint ». C'est la tâche 1 de la Passe D6 : midi fidèle à
  l'image, montré en captures.
- Branche `day-midday-y2` depuis `main` (`cbe2158`).

### Fait — [OK]
- **`?time=midday`** fait midi, et `?time=day` en reste l'alias. Absent ou `night` donne la nuit. `morning` et `afternoon` ne sont pas encore
  construits : ils donnent la nuit, et le test le vérifie.
- **La table de midi** (`DayState.ts`), réglée en cinq tours de captures contre la piste :
  - un soleil blanc chaud (2,9 ; 2,72 ; 2,35), toujours à 55° ;
  - une ambiance neutre (0,38 ; 0,4 ; 0,45) et un sol chaud (0,38 ; 0,36 ; 0,32) ;
  - un horizon bleu (0,3 ; 0,52 ; 0,95), un zénith bleu profond (0,06 ; 0,2 ; 0,7) ;
  - la brume à 0,003 (nuit : 0,013), la brume basse à 0,05, les pavés presque secs (`uWet` 0,2) ;
  - le grade : exposition 1,24, **la discipline de palette de la nuit coupée** (0 : elle éteignait tous les bleus), saturation 1,25,
    contraste 1,05, ombres et hautes lumières presque neutres.
- **Les toits d'un bleu franc** : de jour, le multiplicateur d'albedo du matériau des toits (`uBase`, blanc la nuit) passe à
  (0,58 ; 0,74 ; 1,22). Les palettes des façades sont froides par construction (« palette de nuit retenue ») ; le plâtre retrouve son blanc par
  la lumière et le grade, pas par la géométrie.
- **Le ciel de midi** (variante `DAY`) : un bleu profond et des cumulus blancs bas sur l'horizon, éclairés dessus, plus gris dessous (bruit à
  quatre octaves).
- **Les tours** :
  1. trop d'horizon blanchâtre, des ombres bleues ;
  2. le ciel bleu et ses nuages, mais un plâtre bleuté ;
  3. le plâtre blanc ;
  4. les toits bleus ;
  5. plus clair.
- Les planches du premier jet (`screenshots/calibration/y1-day/`) sont retirées et remplacées par `y2-midday/`. Elles restent dans
  l'historique (`e68e340`).

### Preuves
- **Nuit** (sans paramètre), contre `main` figé (`cbe2158`, :5187), au **seuil 0**, **0 px partout** :
  - graines 1842 et 7719 × A, B, C, D, D lointain et les quatre transitions figées (`static=1&occ=0`) ;
  - les quatre références avec personnages, la forge sabotée et l'orage.
- **Midi** : témoin de répétition (deux chargements) 0 px.
- **Ordre de la preuve** : elle a tourné sur le code du 4e tour. Le 5e tour ne change que deux valeurs de la table de midi (le sol,
  l'exposition), qui n'est lue que de jour.
- **Tests** (`tests/day-state.test.mjs`) : le paramètre et son alias ; un zénith bleu profond ; la discipline de palette coupée à midi.
- **Validation** : typecheck, `npm test` 91 / 91, build, `art:validate`.
- **Planches** :
  - `screenshots/calibration/y2-midday/{A,B,C,D}-night-midday.png` (la nuit, puis midi) ;
  - `B-target-vs-midday.png` (la piste de midi à côté de midi en jeu, en B).

### Restes [?]
- **Contre la cible** :
  - les pavés et l'eau restent plus sombres ;
  - les nuages font une nappe plutôt que des cumulus détachés ;
  - le lointain (ville haute, rive opposée) garde ses toits gris : le matériau du lointain n'a pas la teinte des toits.
- **À faire** (Passe D6) : le pavois comme l'image ; le matin et la fin de journée ; la météo sur chaque état ; J7.
- **Signalé par l'opérateur dans la séance** : un trou dans la coque du bateau, côté caméra, près du poteau d'amarrage. Il se voit la nuit comme
  le jour, et ne vient pas du culling (0 px contre `vis=0`). C'est la tâche suivante.

### Pensée
- Une image cible se rejoint par la lumière, le ciel et le grade d'abord, puis par un seul réglage de matériau quand le reste ne suffit pas
  (les toits). Une palette d'albedo écrite pour la nuit se compense de jour par la lumière, sans toucher la géométrie, que la nuit prouvée
  partage.

## Passe Z5 — Le bateau : sa poupe était ouverte, un tableau arrière la ferme (signalement de l'opérateur) (2026-10-19)

### Demande
- Opérateur, mot pour mot, pendant la Passe Y2, une capture du bateau à l'appui : « d'ailleurs il y a aussi une imperfection que je veux
  signaler ddepuis un moment sur le bateau qui semble manquer une partie ».
- Le district est complet (Passe Z4) : tout changement est une tâche décidée par l'opérateur. Ce signalement en est une.
- Branche `fix-boat-z5` depuis `main` (`03f3e9d`), après la fusion de la Passe Y2.

### Cause — [OK] trouvée
- En B, le flanc de la coque, côté caméra, s'interrompait à hauteur du poteau de la lanterne de poupe : la poupe à gauche, le reste de la coque à
  droite, et l'eau entre les deux. Le défaut se voyait la nuit comme le jour.
- **Ce n'était pas le culling** : `vis=0` donne le même trou (1 px d'écart ailleurs dans l'image).
- **Les triangles du flanc existent** : les deux premières tranches, côté caméra, sont présentes, normales vers l'extérieur (relevé des
  triangles dans la boîte du bateau).
- **L'eau masquée, la cause se lit** : la coque lissée (`boat`, `PropGenerator`) finit à la poupe sur une section ouverte. La largeur de la
  coque y reste à 0,6 m, alors qu'elle tombe à 0 à la proue. Aucun tableau arrière ne fermait la poupe.
  - Les cadrages regardent vers l'amont, donc la poupe en face, et voyaient l'intérieur par l'ouverture : le plancher éclairé par la lanterne,
    puis l'eau. C'est le « morceau qui manque ».

### Fait — [OK]
- Un tableau arrière ferme la section de la poupe :
  - un éventail depuis le centre de la section (le contour est convexe) ;
  - peint dehors, tourné vers l'arrière ; la teinte intérieure dedans, tournée vers l'avant, 5 cm plus loin ;
  - un chapeau de bois sur son bord haut.
- Le sens de chaque triangle est calculé, pas supposé.
- Aucun tirage aléatoire de plus : le reste du district ne bouge pas.

### Preuves
- **Avant / après** (captures déterministes, graine 1842, B, 120 pas), `main` figé (`cbe2158`, :5187) contre la branche :
  - la nuit : 0,55 % des pixels changent (11 415 px), la poupe (jusqu'à 177) et le chatoiement du reflet du bateau sur l'eau et les pavés mouillés
    (la réflexion planaire) ;
  - l'eau masquée : la coque est fermée ;
  - planche : `screenshots/calibration/z5-boat/B-boat-before-after-x3.png`.
- **Visibilité** (`tools/viewport-proof.mjs --no-resize --no-controls`, trois graines × cinq formats, la même série) :
  - `main` et la branche : **les 5 mêmes contrôles en échec**, les lanières de la Passe Z2, aucun nouveau ;
  - Tier 3 330 pièces des deux côtés ; 16 triangles dessinés de plus (98 886 → 98 902), les deux éventails et le chapeau.
- **Références** refaites (témoin de répétition 0 px) :
  - `camA` (3 642 px, le bateau vu de loin) et `camB` (11 415 px) ;
  - `camC` (1 636 px d'un niveau, le reflet) ;
  - `camD` inchangée (0 px).
- **Validation** : typecheck, `npm test` 91 / 91, build, `art:validate`.

### Pensée
- Un « morceau qui manque » se cherche dans l'ordre : le culling (`vis=0`), les triangles (présents ? tournés ?), puis ce qui les cache ou ce
  qu'on voit à travers. En masquant l'eau, on a vu l'intérieur du bateau par une poupe jamais fermée.
- Une forme lissée entre des sections se ferme à ses bouts : une section de largeur non nulle est un trou.

## Passe Y3 — Le pavois du tournoi, de jour seulement, comme l'image (décisions D6 et J6) ; la nuit inchangée (2026-10-19)

### Demande
- Opérateur, mot pour mot : « Passe au pavois du tournoi comme sur l'image (guirlandes le long du front, en travers de la rue et sur le mur du
  quai), de jour seulement. »
- Décisions : D6 « Comme l'image » et J6 « Le jour seulement ».
- Branche `day-bunting-y3` depuis `main` (`c9485d1`).

### Fait — [OK]
- **`src/props/Bunting.ts`** : `garland` tend une corde avec une flèche parabolique et y suspend des fanions triangulaires, bleus et ivoire en
  alternance. Ils sont dans le matériau tissu (double face, vent), et la pointe seule se balance.
- **`buildBunting` place trois sortes de guirlandes** :
  - **le long du front** : une guirlande en travers de chaque maison du premier rang, en haut du premier étage, flèche 0,55 m ;
  - **en travers de la rue** : depuis l'accroche de façade la plus proche jusqu'au sommet de chaque lampadaire du quai jouable, flèche 0,45 m ;
  - **sur le mur du quai** : une rangée continue en festons de 2,4 m sous la margelle, devant la face du mur, de x −26 à 44. L'escalier de
    débarquement reste libre.
- **Les accroches** : deux nouvelles par maison (`BuildingGenerator`, étiquettes `left1` / `right1`), en haut du premier étage et devant son mur.
  Ce sont des données, sans tirage : les accroches existantes `left` / `right`, sous les combles, étaient trop hautes pour les cadrages.
- **De jour seulement** : `generate(..., { bunting })`, qu'`App` met à `this.day`. Rien n'est construit la nuit.
  - Le pavois est de la géométrie non suivie (pièce 0) : il n'est jamais coupé par le culling.
  - Aucun tirage aléatoire : la suite de la graine du district ne bouge pas.
- Les maisons du rang arrière (`bg*`) n'en portent pas.

### Preuves
- **Captures de midi** (graine 1842, A, B, C, D), et en B la piste de midi à côté de midi en jeu : guirlandes, fanions et rangée du quai lus
  comme sur l'image (`screenshots/calibration/y3-bunting/`). Les planches de la Passe Y2 (`y2-midday/`) sont remplacées ; elles restent dans
  l'historique (`03f3e9d`).
- **Nuit** (sans paramètre), contre `main` figé (`c9485d1`, :5187), au **seuil 0** : **0 px partout**.
  - Graines 1842 et 7719 × A, B, C, D, D lointain et les quatre transitions figées.
  - Les quatre références avec personnages, la forge sabotée et l'orage.
  - Témoin du jour : 0 px.
- **Tests** (`tests/bunting.test.mjs`, 3 tests) :
  - une guirlande n'a que les trois couleurs, et les fanions pendent sous la corde ;
  - le rang arrière n'a rien ; les accroches sont celles du premier étage, pas celles des combles ; la rangée du quai évite l'escalier ; une
    guirlande atteint le lampadaire ;
  - deux constructions sont identiques ; rien n'est construit sans `opts.bunting` ; aucun `Math.random`.
  - **Quatre fautes injectées, attrapées** : l'escalier non évité, le rang arrière gardé, les accroches des combles, des couleurs au hasard.
- **Validation** : typecheck, `npm test` 94 / 94, build, `art:validate`.

### [KO → corrigé] procédure
- J'ai injecté ces fautes dans `src/props/Bunting.ts` pendant que la preuve de nuit tournait sur le serveur de la branche. C'est contraire au
  principe : rien ne se modifie de ce qu'un serveur sert pendant une série.
- Le fichier a été restauré à l'octet (`cmp`). La série a donné 0 px sans capture en échec, mais elle a été relancée en entier sans aucune
  modification (le résultat ci-dessus vient de ce second passage).

### Restes [?]
- **À juger par l'opérateur** : en B, la guirlande qui descend vers le lampadaire de l'étal passe, par la perspective, devant la tête du héros
  et la bulle de la marchande quand ils sont à leur place de référence. Le révélateur d'occlusion ne protège pas le joueur du pavois.
- **À faire** (Passe D6) : le matin et la fin de journée ; la météo sur chaque état ; J7.
- **Non mesuré** : le temps GPU de midi avec le pavois.

### Pensée
- Un habillage qui n'existe que dans un état se construit seulement dans cet état, sans tirage : la nuit ne voit pas la différence (0 px), et
  le jour ne déplace rien d'autre.
- Une faute s'injecte quand aucun serveur ne mesure.

