# Journal de bord — archive : passes AA1 et UI1 (2026-10-24)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-10-25 (Passe CB1) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe AA1 — Audit des sprites de l'arène (étape 1.1 de la feuille de route) : combattants, gradins, cadre ; fiche d'arbitrages (2026-10-24)

### Demande
- Séance locale lancée par la séance parente, le 21/10, reprise le 24/10 : l'audit des sprites de l'arène, étape 1.1 de
  `briefs/roadmap-2026-10.md` (combattants de `src/arena/FighterArt.ts`, gradins, place dans les textures, budget GPU, captures de jour et de nuit,
  comparaison avec `hero-x2-v4` et les PNJ cuits), puis une fiche d'arbitrages.
- Règles de la séance : ni branche ni commit, aucun fichier suivi modifié, aucune image générée ; serveur `dev-strict` (:5186) ; une autre séance
  d'audit (l'interface, :5187) travaillait dans le même dossier. Rapport, captures et cette passe dans le dossier de notes partagé
  (`arena-sprites-AA1/`) ; la séance parente versionne.
- `main` à `c431295` (Passe AD1), aucun changement de code depuis.

### Constats — [OK] mesurés
- **Le joueur change de dessin entre la ville et l'arène.** En ville, Aster est `hero-x2-v4` (Passe H11) ; au parvis et au duel, c'est Ren, le
  héros généré d'avant (`REN = { ...PLAYER }`) : grosse tête, profil, cape rouge, tunique bleue. Toute l'arène (Ren, Marek, Vessa, le public)
  suit l'ancienne grammaire du générateur.
- **Densité à l'écran** : un texel de combattant (×2, `CHAR_SCALE` 1,42) fait **3,9 px en 1080p** (mesuré dans la page, 3,89 ; calcul : distance
  14,97 m, champ 34°, texel 0,0334 m → 3,94). La distribution cuite ×2 de la ville : 0,65 à 1,68 px en B (Passe S2), environ 1,5 pour le héros.
  Une feuille ×2 du héros posée telle quelle dans le duel aurait des pixels environ 2,5 fois plus gros qu'en ville.
- **Le jeu d'images** (atlas à graine 1842, script hors dépôt) : clés `<id>/side/<clip>.<i>/0`, cases de 128 × 192 texels (64 × 96 à ×2, pieds
  rangée 180). Ren (et Vessa) : 12 clips, **29 images** ; Marek : 7 clips à lui, **17 images** (`block` et `victory` = `ready`, `dodge` = `hit`,
  `strike` et `skill` = `slash`). Boîtes maximales : Ren 96 × 103, Marek 110 × 115, Vessa 100 × 105. Palette du générateur sans palette épinglée :
  256 couleurs (Ren), 203 (Marek), 238 (Vessa).
- **Moments sans image propre** : trois techniques sur quatre jouent le même `skill` (Coup éclair, Fente perçante, Estocade), Tourbillon la
  taille `slash` ; Marek n'a ni garde, ni esquive, ni victoire à lui (quand Ren tombe, il reste en garde) ; aucun pas (élan, esquive et recul
  sont des glissements d'images fixes) ; la charge de Marek tient une image 0,75 s ; le K.O. s'arrête à genoux ; une seule vue, le profil, même
  au parvis quand le héros marche en profondeur (marche du générateur à ×1, doublée).
- **Au soleil** : Marek se lit en masse blanche (cheveux, barbe, plaque), son visage se perd ; le contour noir de S3b ne touche pas l'arène
  (sprites générés).
- **Ce qu'une feuille cuite doit fournir** : les mêmes clés et nombres d'images (ou `IMPACT_FRAME` / `clipFrame` mis à jour), le personnage tourné
  à gauche, des cases à la densité choisie, une couche émissive pour traînées et lame chauffée (ou des effets à part), la pointe de lame dans la
  silhouette (`reach`), un portrait de face, un manifeste approuvé. `hero-x2-v4` n'a que repos et marche (60 images).
- **Les gradins** : 25 spectateurs (rangs 0 et 1 : 11 + 14), près de la porte ; les cinq archétypes de foule générés de la ville, de face, repos
  et bouche ouverte (4 images chacun), peints à ×1 et doublés (20 cases) ; échelle 0,62, teinte froide fixe [0,5 ; 0,56 ; 0,74] de jour comme de
  nuit (bleu pâle à midi) ; acclamation = bouche ouverte + saut de 7 cm pendant 1,4 s ; 2,9 à 3,6 px par texel ; debout, même hauteur.
  **Coût** : 2,7 ms de peinture (Node, médiane de 5) ; **aucun appel de dessin en plus** (l'appel instancié des sprites, 96 instances au plus).
- **Le cadre** :
  - l'arène a **son propre atlas**, pas la texture cuite de la ville : duel contre Marek **2 048 × 960, 75 cases** ; contre Vessa 2 048 × 1 152,
    87 ; le parvis + 4 ; plafond garanti 160 cases (85 / 73 libres) ; à ×4, 40 cases par texture ;
  - la texture cuite de la ville : **382 images sur 672**, 290 libres ;
  - peinture de l'atlas : 126 ms (Marek), 140 ms (Vessa), 2,2 ms par image de combattant (Node, médiane de 5).
- **Budget GPU (E24)** : non remesuré (`main` inchangé depuis AD1 ; la séance de l'interface utilisait la même machine). Chiffres de la Passe AD1 :
  nuit B 10,02 ms en 1080p, arène de nuit 10,33 (min 9,20), de jour 8,56 à 8,93, duel du jour 2 8,74 ; en 2560 × 1440, arène 13,65 à 15,68 contre
  16,76. Le budget tient, avec peu de marge la nuit ; les sprites y sont deux appels instanciés.

### Captures
- `tools/arena-scene-shots.mjs` (`HOLD=1`, 1920 × 1080, `clean=1`, graine 1842) : nuit, midi, fin de journée × `calm`, `charging`, `combo`,
  `technique`, `dodge`, `block`, `guardbreak`, `heavyRen`, `ko` ; `tools/play-shots.mjs` : le duel contre Vessa (jour 2, midi), le parvis au matin et
  le soir ; `tools/detshots.mjs` : la ville en B, nuit et midi ; recadrages `tools/zoom.mjs` ×2 (combattants) et ×3 (public).
- **[KO → corrigé]** la comparaison ville / arène portait « BEFORE / AFTER » (écrits en dur par `tools/compare.mjs`) ; l'opérateur, mot pour mot :
  « comment ca avant / apres ? le district merchant est la version la plus avance niveau sprite personnages ». Refaite avec « La ville —
  référence » / « L'arène — aujourd'hui » (copie de l'outil hors dépôt, le dépôt intact).
- **[KO → compris]** une capture du parvis par l'état `day1-morning` avec `scene=arena` restait noire (pas de duel ce jour-là) ; l'état
  `forecourt-morning` la donne.
- Images à garder dans `screenshots/calibration/aa1-arena-sprites/` si la séance parente les versionne : `ville-reference-vs-arene-midi.png`,
  `forecourt-morning-1920x1080.png`, `fighters-ko-midday.png`, `crowd-right-midday.png`.

### La fiche — [OK] publiée, 6 choix sur 6 enregistrés et relus
- Page privée https://claude.ai/artifact/XZcegW4866uD7opjE6qKtP, collection `decisions` (vide à la publication, relue par `list`). Les
  protections de la Passe D8 : pont attendu 10 s, chaque écriture relue (`get`) avant « Enregistré et relu », copie locale, choix faits avant la
  connexion écrits à la connexion, échec dit dans un bandeau.
- Six entrées : AA1-1 Ren = `hero-x2-v4` ; AA1-2 feuilles cuites ou générateur amélioré ; AA1-3 densité des combattants cuits ; AA1-4 les
  spectateurs ; AA1-5 l'atelier combat, avant ou après ; AA1-6 retoucher les générés en attendant.

### Les choix de l'opérateur, mot pour mot
« = » : la recommandation de la fiche est suivie ; « ≠ » : le choix diffère, et c'est lui qui fait foi.

| # | Décision | Recommandation | Choix de l'opérateur | Note | |
|---|---|---|---|---|---|
| AA1-1 | Ren devient `hero-x2-v4` avec des animations de combat | « Oui : Ren = hero-x2-v4, feuille de combat à produire » | « Oui : Ren = hero-x2-v4, feuille de combat à produire » | — | = |
| AA1-2 | Feuilles cuites ou générateur amélioré | « Feuilles cuites (Ren, puis Marek, puis Vessa) » | « Feuilles cuites (Ren, puis Marek, puis Vessa) » | — | = |
| AA1-3 | Densité des combattants cuits | « Essai en scène ×2 contre ×4 d'abord » | « Essai en scène ×2 contre ×4 d'abord » | — | = |
| AA1-4 | Les spectateurs | « Les citadins cuits de la ville + variantes V1 » | « Les citadins cuits de la ville + variantes V1 » | — | = |
| AA1-5 | L'atelier combat, avant ou après | « Atelier avant les feuilles ; densité et public en attendant » | « Atelier avant les feuilles ; densité et public en attendant » | — | = |
| AA1-6 | Retoucher les générés en attendant | « Non, attendre les feuilles » | « Non, attendre les feuilles » | — | = |

- Relue après « La fiche des sprites de l'arène est remplie. » : **6 documents sur 6** dans `decisions`, cliqués le 25/10 entre 03 h 28 et 03 h 30
  UTC, aucune note ; chaque écriture relue par la page avant « Enregistré et relu ».
- **Ce qui suit, chacun dans sa séance, une branche à la fois** (rien n'est appliqué par cette passe) :
  1. **L'atelier « système de combat »** (E1 / E16, mené par l'opérateur) : il fixe la liste des animations ; les feuilles de combat l'attendent
     (AA1-5).
  2. **En attendant, l'essai de densité** (AA1-3) : `hero-x2-v4` dans le cadrage du duel, à ×2 tel quel et reconstruit à ×4 depuis sa planche,
     côte à côte, à juger à l'œil ; derrière un paramètre, le défaut inchangé à 0 px.
  3. **En attendant, le public** (AA1-4) : les cinq citadins cuits de la ville (repos de face) et leurs variantes V1 dans les gradins, saut
     d'acclamation sans nouvelle image ; une pose d'acclamation plus tard, par la chaîne et l'approbation de l'opérateur ; derrière un paramètre.
  4. **Après l'atelier** : la feuille de combat de Ren = `hero-x2-v4` (AA1-1), par la chaîne du héros (AA1-2), à la densité choisie ; puis Marek,
     puis Vessa (gardée générée jusque-là, L7-1).
  - Les combattants générés ne sont pas retouchés d'ici là (AA1-6).

### Restes [?]
- Rien n'est appliqué : chaque décision qui demande du travail part dans sa propre séance, une branche à la fois.
- `tools/compare.mjs` écrit « BEFORE / AFTER » en dur : des libellés en paramètre éviteraient l'erreur de cette passe (petite tâche d'outillage).
- Le budget GPU de l'arène est celui de la Passe AD1 ; à remesurer avec les premières feuilles cuites ou un public plus dense.

### Pensée
- Avant de juger un lieu, comparer ses personnages à la distribution de référence dans les mêmes conditions (même état du jour, même
  agrandissement) : l'écart de dessin et de densité se voit d'un coup d'œil, et il change l'ordre des décisions.
- La densité d'un sprite se mesure à l'écran dans le cadrage où il vit (Passe P1) ; une feuille approuvée ailleurs ne garde pas son aspect en
  changeant de cadrage.
- Un outil de comparaison nomme ce qu'il compare : une étiquette par défaut (« avant / après ») dit autre chose que l'image.

## Passe UI1 — L'audit de l'interface et sa ligne directrice : trois directions en images générées, une fiche d'arbitrages (étapes 2.1 et 2.2 de la feuille de route) (2026-10-24)

### Demande, mot pour mot
- Opérateur (feuille de route, Passe FR1) : « Puis UI/HUD car ce n'est vraiment pas optimale, mais on commencera par fait un audit et des passes
  visuels via des images references generes pour valider la ligne directrice, pour bien implementer. »
- Séance locale lancée par la séance parente le 21/10 ; interrompue, puis reprise le 24/10 sur « reprend ». Consignes : ni branche ni commit ;
  aucun fichier suivi modifié, sauf les images archivées et leurs `.source.json` ; serveur `dev-ui` sur :5187, jamais :5186 (séance d'audit de
  l'arène en parallèle).
- `main` = `c431295`. Serveur : entrée locale `dev-ui` ajoutée à `.claude/launch.json` (non suivi), le dépôt sur :5187 en `--strictPort`.

### L'audit — [OK] 45 captures, aucune erreur de page
- **Ordinateur 1920 × 1080, téléphone 375 × 812**, et 812 × 375 pour le paysage :
  - `tools/play-shots.mjs` : la ville au matin, à l'après-midi et le soir ; « Here » ouvert au téléphone ; le dialogue de Mara ; la carte ; le
    journal ; le tableau ; le menu ; les nouvelles ; le parvis et son dialogue ; Lantern Row ; la fiche de match ; la fin de la tranche ; le HUD de
    l'arène (`window` en aide complète, `combo`, `ko`) ;
  - un script hors dépôt : l'écran titre (`?title=1`, sans puis avec une vraie sauvegarde, et la saisie du nom) et la vue d'« Explore the district »
    (`?time=midday`).
- **[KO → compris]** `play-shots` ferme la première carte de la page (`.pm-overlay .pm-btn`) quand son JS ne contient pas « news ». Sur le duel,
  c'est la fiche de match : il cliquait « Fight » avant la capture. Refait avec `/*news*/0`.
- **Code lu** : `src/ui/*`, `src/arena/ArenaHud.ts`, `FloorUI.ts`, `src/main.ts`, `src/debug/Hud.ts`, `DebugPanel.ts`.
- **Constat** : un seul langage (encre de nuit à 93 %, ivoire, or pâle, ambre, Segoe UI espacé), fidèle à la nuit verrouillée, mais habillé
  comme une page web. Trois défauts principaux :
  1. une seule apparence, de nuit, à toute heure : l'UI ne lit pas `DayState` ;
  2. une hiérarchie de page web : texte de 10 à 13 px, « Here » sur un quart de l'écran avec les absents, la moitié de l'écran au téléphone,
     sous-libellés de la barre d'actions de l'arène rognés en 1080p (`overflow:hidden`) ;
  3. « Explore the district » s'ouvre sur le panneau DEV déplié, avec un second style de HUD (Palatino, mini-carte) ; `main.ts` le crée dès que
     `clean` est absent, donc aussi en production. C'est dans la décision L7-6a (« … and the DEV panel ») : une question, pas un correctif d'office.
- Autres relevés : « FREE » sur des achats payés en pièces (le coût montré est le créneau) ; le dialogue au centre cache celui qui parle ; le
  portrait du générateur ne ressemble pas au sprite cuit ; la carte n'est qu'une liste ; la fiche de match et la victoire sont du texte nu ; la
  sauvegarde ne se voit pas. Le détail écran par écran est dans le rapport.

### Les images de référence — [OK] 9 images, 1,61 $ sur 5 $
- `tools/art-lab/gen-image.mjs`, tâche `ui-directions`, `gpt-image-2`, `/images/edits`, qualité haute ; une capture du jeu **sans interface** en
  référence (`clean=1` en B, `hud=0` dans l'arène). Une première référence de la ville était le cadrage A, trop lointain : refaite en B
  (`camera=B&intro=0`).
- `--dry-run` d'abord : au pire 0,627 $ par image. **Coût réel : 0,1786 à 0,1793 $ par image, 1,6109 $ pour les neuf** (registre `--spent`).
- Trois directions, chacune sur la ville (dialogue de Mara, midi) et sur le duel de midi :
  - **A « Encre et laiton »** : l'interface actuelle affinée (encre, filets de laiton, serif gravée) ;
  - **B « Vélin du tournoi »** : parchemin ivoire, lettrines, écus ;
  - **C « Héraldique pixel »** : cadres en pixel art sur la grille des sprites, bleu royal, ivoire et or du tournoi, onglets en fanions.
  - En plus : B et C la nuit, et C au téléphone (1024 × 1536).
- **Archivées** (`--archive`, octets inchangés, avec leur `.source.json`) dans `art-lab/characters/reference/sources/` :
  `ui-direction-{a-town, a-arena, b-town, b-arena, c-town, c-arena, b-town-night, c-town-night, c-phone}-2026-10-24.png`. `npm run art:validate` :
  18 manifestes, 30 sources, 0 erreur. **Non canoniques**, et non commitées par cette séance.
- **[?] Ce que l'outil a ajouté** : la nuit, il a redessiné la scène et laissé le pavois, que J6 réserve au jour ; les trois directions dessinent
  de grands bustes illustrés, de l'art qui n'existe pas dans le jeu ; C met des jauges vertes et rouges, hors palette. Sur la fiche, chaque point
  est dit à côté de l'image.

### La fiche d'arbitrages — publiée
- Page privée https://claude.ai/artifact/7PeQMRJKDku4hdN5wuuC3y, collection `decisions`, relue vide après publication (`list`). Le script reprend
  ce qui a marché en Passe D8 : il attend le pont jusqu'à 10 s, relit chaque écriture (`get`) avant d'afficher « Enregistré et relu », garde
  une copie locale, et écrit à la connexion les choix faits avant elle.
- **14 entrées** :
  - **La ligne directrice** : L1 la direction (recommandée : C) ; L2 le jour et la nuit (un style, des tons qui suivent `DayState`) ; L3 le téléphone
    (avec le système de design, le toucher restant hors tranche, E30) ; L4 les portraits (le visage de la feuille cuite d'abord, des bustes plus
    tard).
  - **Les défauts à corriger en premier** : P1 le panneau DEV d'Explore (fermé par défaut, H l'ouvre) ; P2 « FREE » (en premier) ; P3 la barre
    rognée (en premier) ; P4 le dialogue, P5 « Here », P6 la fiche de match et la victoire (avec la direction choisie).
  - **Le système de design (2.3)** : S1 les polices (pixel pour les titres et un texte lisible, embarquées) ; S2 les cadres (générés par le code,
    en neuf tranches) ; S3 la palette (bleu, ivoire, or ; ambre pour l'action ; jauges dans la palette) ; S4 la taille minimale (16 px ordinateur,
    14 px téléphone).

### Les choix de l'opérateur, mot pour mot
- Opérateur, mot pour mot : « La fiche UI est remplie. » Collection `decisions` relue (`ArtifactData list`) : **14 documents sur 14**, cliqués le
  25/10 entre 03 h 44 et 03 h 48 UTC, une note. « = » : la recommandation de la fiche est suivie.

| # | Décision | Choix de l'opérateur | Note de l'opérateur | |
|---|---|---|---|---|
| L1 | La direction de l'interface | « C · Héraldique pixel » | — | = |
| L2 | Jour et nuit | « Un style, des tons qui suivent DayState » | — | = |
| L3 | Le téléphone | « Avec le système de design » | — | = |
| L4 | Les portraits | « Visage cuit d'abord, bustes plus tard » | — | = |
| P1 | Explore et le panneau DEV | « Fermé par défaut, H l'ouvre » | — | = |
| P2 | « FREE » sur les achats | « En premier » | — | = |
| P3 | La barre d'actions rognée | « En premier » | — | = |
| P4 | Le dialogue au centre | « Avec la direction choisie » | — | = |
| P5 | Le panneau « Here » | « Avec la direction choisie » | — | = |
| P6 | La fiche de match et la victoire | « Avec la direction choisie » | — | = |
| S1 | Les polices | « Pixel pour les titres + texte lisible » | — | = |
| S2 | Les cadres | « Générés par le code (neuf tranches) » | — | = |
| S3 | La palette | « Bleu, ivoire, or ; ambre pour l'action » | « Cela peut changer par la suite » | = |
| S4 | La taille du texte | « 16 px ordinateur, 14 px téléphone » | — | = |

### Ce qui en découle — [OK] consigné, rien appliqué par cette séance
- **La ligne directrice** de l'étape 2 est **C « Héraldique pixel »** : cadres en pixel art générés par le code (neuf tranches, densité des
  sprites), bleu royal, ivoire et or du tournoi, ambre pour l'action, jauges dans la palette (S3 provisoire, d'après la note de l'opérateur) ;
  un seul style dont les tons suivent `DayState` ; une police pixel embarquée pour les titres, chiffres et touches, et une police de texte lisible
  embarquée (licence libre) ; texte de 16 px au moins sur ordinateur, 14 px au téléphone ; une mise en page téléphone (bandeau, feuille de dialogue,
  onglets) dans le système de design, le toucher restant hors tranche (E30). Les images C (`ui-direction-c-*-2026-10-24`) sont la référence de
  direction, **non canoniques** : ni leurs bustes, ni leurs jauges vertes et rouges, ni la scène redessinée ne sont des cibles.
- **Portraits** : le visage de la feuille cuite de chaque personnage d'abord ; des bustes pour les personnages principaux plus tard, par la
  chaîne d'art (manifeste, critique, approbation), dans une tâche à part.
- **Tâches à part, chacune dans sa séance, une branche à la fois** :
  1. **« En premier »** (avant le système de design), une petite tâche : P2, une étiquette par monnaie (pièces, créneaux), « free » seulement
     quand rien n'est dépensé ; P3, les sous-libellés de la barre d'actions de l'arène lisibles en 1080p (change les pixels de `?scene=arena` :
     preuve contre `main` figé) ; P1, le panneau DEV fermé par défaut quand on arrive par le bouton « Explore the district », H l'ouvre (les adresses
     des outils inchangées, preuve à 0 px).
  2. **L'étape 2.3, le système de design** (S1 à S4, L2, L3, L4 en première partie), puis la mise en œuvre écran par écran avec captures avant /
     après, dont P4 (le dialogue en bas, le locuteur visible), P5 (« Here » réduit aux actions du lieu, les absents retirés) et P6 (la fiche de
     match, la victoire, le journal et le tableau).
- `AGENTS.md` (à mettre à jour par la séance qui versionne) : la ligne directrice de l'interface sous « Art direction », avec les règles S1 à S4
  et L2, et la note de l'opérateur sur la palette.

### Validation
- Aucun code touché. `npm run art:validate` : 0 erreur avec les neuf sources archivées. Serveur `dev-ui` arrêté à la fin de la séance.
- À versionner par la séance parente : les neuf PNG et leurs `.source.json`, et cette passe. Rapport et captures (hors dépôt) : dossier de notes
  partagé, `ui-audit/`.

### Pensée
- Une image de référence d'interface se demande sur une capture du jeu **sans interface** : avec l'ancienne interface en référence, le modèle
  la recopie.
- Un générateur d'images « redessine » ce qu'il n'a pas reçu l'ordre de garder (le pavois la nuit, des bustes illustrés) : chaque écart se dit à
  côté de l'image, avant que l'opérateur ne la prenne pour une cible.
- Un outil de capture qui ferme la première carte d'une page se lit avant de lui confier un écran fait d'une carte (la fiche de match).
- Ce qui ressemble à un bug (le panneau DEV d'Explore) se vérifie contre les décisions consignées avant d'être rangé parmi les défauts.

