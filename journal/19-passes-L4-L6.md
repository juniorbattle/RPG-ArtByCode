# Journal de bord — archive : passes L4, L5 et L6 (2026-10-20)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-10-20 (Passe S3) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe L4 — La ville jouable : les rôles des PNJ, les dialogues et leurs portraits, l'interface en anglais, l'écran titre par défaut (2026-10-20)

### Contrat de tâche (contrat projet § 11.3)
- **Objectif** : le jour 1 se joue dans la ville depuis l'écran titre ; les PNJ existants y tiennent des rôles de jeu ; l'interface montre
  l'horloge, l'échéance, le tableau, les dialogues, le journal et la sauvegarde ; l'écran titre entre dans le défaut (choix P2).
- **Entrées** : plan, lot L4 ; choix P2, P4, K1, K2, K3 ; les passes L1 à L3.
- **Fichiers autorisés** : `src/main.ts` (l'aiguillage de l'écran titre), `src/ui/`, `src/simulation/`, `src/narrative/`, `src/combat/match.ts`,
  `src/tournament/pool.ts`, `tests/`, `tools/` (des outils de preuve), `AGENTS.md`, `JOURNAL.md`.
- **Interdits** : le district (géométrie, cadrages, distribution, aspect : choix P4) ; `src/app/`, `src/characters/`, `src/arena/` ; la nuit
  reste le moment par défaut de « Explore the district » (J9).
- **Outputs** : `src/ui/title.ts`, `townUi.ts`, `portraits.ts`, `playForecourt.ts` ; `src/simulation/roles.ts` ; `src/narrative/dialogue.ts`.
- **Critères d'acceptation** : le PD à 0 px (toute adresse à paramètres, et « Explore the district » contre l'adresse nue de `main`) ; l'écran
  titre et ses trois boutons, « Continue » absent sans sauvegarde ; le jour 1 joué de bout en bout ; une fumée au clavier ; la reprise après
  un rechargement ; des captures à chaque créneau, sur ordinateur et à la taille d'un téléphone.
- **Tests** : `tests/town-roles.test.mjs` ; `tools/title-proof.mjs`, `tools/play-day.mjs`, `tools/play-shots.mjs` ; le PD. **Risques** : un outil
  qui charge l'adresse nue et trouve l'écran titre ; le chemin de « Explore the district » qui dévie.
- **Définition de terminé** : tests verts, fautes attrapées, preuves du navigateur passées, PD à 0 px, validation complète.

### Fait — [OK]
- **Les rôles** (`src/simulation/roles.ts`, chaque action dit qui l'offre) :
  - Mara : sa boutique, ouverte le jour (pierre à aiguiser +5 % au prochain duel, baume qui soigne un niveau, lame importée +15 %), ses prix
    multipliés par la pénurie et diminués de sa faveur ; l'aider à décharger ses caisses (le matin, un créneau) ;
  - la quête « The Steel Cargo » : Tam la propose, le sergent Hale signe la levée, on hisse la caisse (un créneau), Bram trempe la lame
    (un créneau, 10 pièces : +15 % au duel suivant) ;
  - les réponses au sabotage : veiller soi-même à la forge (le soir, un créneau : l'attaque échoue et le coupable est nommé), payer le guet,
    l'informateur la nuit (10 pièces : un avertissement, ou le nom du payeur après l'incendie), le rapport à Hale (Cassius perd 3 points, la
    guilde paie 15 pièces), rebâtir la forge avec Bram (12 pièces, 6 si Orla est une amie) ;
  - le parvis : signer le rôle (Odo), se faire soigner (Anwen, 8 pièces, gratuit après l'aumône d'Ilse), s'entraîner avec Orla (la recrue
    future), observer Vessa ou Marek (l'assistance `full` et deux lignes de renseignement au duel contre eux).
  - Le jour et la nuit : la boutique ferme la nuit, Bram ne travaille que le jour et disparaît d'une forge en ruine (son sprite aussi : le
    district le retire déjà), l'informateur ne parle que la nuit, on ne rebâtit pas dans le noir.
- **Les dialogues** (`src/narrative/dialogue.ts`) : des répliques choisies selon l'état (le créneau, le pouls, les faits, les quêtes, les
  résultats) ; la ville réagit aux duels, à l'incendie, aux querelles, à l'excitation (contrat du gameplay § 8).
- **L'interface** (`src/ui/townUi.ts`, en anglais) : l'horloge (jour / 3 · créneau), le nom, les pièces, la réputation, la santé, la prochaine
  échéance ; « Here » (ce qu'on peut faire ici, et son coût : « 1 slot » ou « free ») ; les gens présents ; l'invite « [E] Talk to … » près
  d'un PNJ (par son archétype dans la scène) ; le dialogue (portrait, répliques, options) ; la carte (M), le journal avec les causes (J), le
  tableau du tournoi (T), le menu (Échap : fichier de sauvegarde, rechargement, retour à l'écran titre) ; les nouvelles depuis la dernière
  visite ; l'écran de fin de la tranche. Au téléphone, la liste se replie sous son titre.
- **Les portraits** (`src/ui/portraits.ts`, choix K3) : l'image de face du générateur (tête et épaules, 24 × 24 texels) pour les gens du
  district (leurs archétypes), les rivaux (leurs couleurs du `roster`) et trois personnes sans sprite (Odo, Anwen, Lio : un portrait, aucun
  spawn).
- **Le parvis** (`src/ui/playForecourt.ts`) : l'arène vue des gradins, immobile, et l'interface ; il devient praticable au lot L6.
- **L'écran titre** (`src/ui/title.ts`) : « New game » (il demande le nom, choix K2 ; « Ren » en suggestion), « Explore the district », et
  « Continue » quand une sauvegarde existe. Il ne paraît que sur l'adresse nue, et `?title=1` le force.
- `window.__game.subscribe` : l'interface se redessine aussi quand un outil agit à sa place.

### Choix de la séance (consignés comme tels)
- **L'écran titre ne paraît pas dans un navigateur piloté** (`navigator.webdriver`), sauf avec `?title=1`. L'audit des outils de `tools/` qui
  chargent l'adresse nue (le brief, P2) : `perf` et `startup` ajoutent toujours `fps=off` ; `detshots`, `visproof`, `viewport-proof` exigent une
  requête ; mais `eval`, `screenshots`, `cadence`, `flipbook`, `foot-slip`, `step-angles` et `vsync-probe` atteignent l'adresse nue dès que leur
  requête est vide. Plutôt que de les modifier un à un (et ceux de l'opérateur), le jeu ne montre l'écran titre qu'à une personne.
- Dans le mode jouable, l'interrupteur DEV de la forge (F, et E devant la forge) est coupé : l'état de la forge est celui du jeu.
- Les actions des gens apparaissent dans leur dialogue ; « Here » garde celles du joueur (se reposer, laisser passer le temps, entrer dans
  l'arène, rebâtir la forge en ruine).
- Lantern Row reste fermé (« opens in a later build of the slice ») jusqu'au lot L6.
- **Le parvis de jour s'affiche de nuit** : il est l'arène, qui n'a que l'aspect de nuit (choix G1). Lui donner le jour serait un changement
  d'aspect : une décision préparée au bilan.

### Preuves
- **`tests/town-roles.test.mjs`, 7 tests** : la quête de la cargaison jusqu'aux données du duel (+15 %) ; la boutique (ouverte le jour, la
  pénurie, la faveur) ; le jour et la nuit (Bram, l'informateur, la forge en ruine) ; les réponses au sabotage (le guet tenu, le nom du payeur,
  le rapport, la réparation, la lame de Mara au prix de la pénurie) ; le parvis (le rôle, le soin payé ou gratuit, l'observation qui donne
  l'assistance et le renseignement, Orla) ; chaque personne a des répliques à chaque créneau où elle est là ; « Explore the district » : la
  fonction `startTown` et le chargement de `src/main.ts` sont ceux de `main` `d129433`, lus par `git show`.
  - **Huit fautes injectées une à une, toutes attrapées** : la levée oubliée, la pénurie sans effet, la boutique ouverte la nuit, Bram dans la
    ruine, le guet inutile, la lame ignorée au duel, l'observation sans assistance, l'écran titre qui lance l'arène.
- **Le PD**, contre `main` figé (`d129433`, :5187) et la branche figée (`d593537`, :5189), au **seuil 0** : témoin de répétition 0 px ; nuit A,
  B, C, D statiques et avec personnages, midi en B : **0 px** les neuf. `src/arena/` ne change pas dans ce lot.
- **L'écran titre** (`tools/title-proof.mjs`) : sur l'adresse nue, dans un navigateur qui ne se dit pas piloté, l'écran paraît avant toute
  génération ; « New game » et « Explore the district » sans sauvegarde, « Continue » en plus avec une sauvegarde. **« Explore the district »
  donne l'adresse nue de `main` figé à 0 px** (120 pas, personnages compris).
- **Le jour 1 dans le navigateur** (`tools/play-day.mjs`, graines 1842 sur le serveur de développement et 7719 sur la branche figée) : E près
  de Mara ouvre son dialogue (portrait, réplique, cinq options) ; la quête et le parvis par `window.__game` ; chaque rechargement depuis la
  sauvegarde garde l'état ; le deuxième matin atteint, l'horloge et l'échéance justes ; la partie rejouée en Node a la même empreinte ;
  0 erreur de page.
- **Les captures** (`tools/play-shots.mjs`) : le matin, midi, le crépuscule après un duel, la nuit et le parvis, en 1280 × 720, 390 × 844 et
  844 × 390 (17 images), et un dialogue au téléphone ; 0 erreur de page. Trois gardées dans `screenshots/calibration/l4-play/`.
- **[KO → corrigé]** sous SwiftShader, une image prend une à quatre secondes : l'invite n'était pas encore calculée quand l'outil appuyait sur
  E (il attend maintenant `__ui.near`) ; la navigation dépassait le délai par défaut de 30 s (les outils du mode jouable prennent `READY_MS`).
- **Validation** : typecheck, `npm test` **135 / 135**, build, `art:validate`.

### Pensée
- Un écran par défaut nouveau se protège par qui le regarde, pas seulement par l'adresse : un navigateur piloté garde le jeu d'avant, et
  chaque outil, celui de l'opérateur compris, reste juste sans modification.
- Une preuve de « même chemin » se lit dans le code de la version figée (`git show`) : l'oracle ne passe pas par le fichier modifié.

## Passe L5 — Le contenu des trois jours : trois parties scriptées jusqu'à la fin, la tranche cochée par un test (2026-10-20)

### Contrat de tâche (contrat projet § 11.3)
- **Objectif** : le déroulé des trois jours, joué de bout en bout par trois parties scriptées (prudente, négligente, perdante), et un test qui
  coche chaque exigence du gameplay § 13 et du contrat projet § 14 à partir de leurs événements.
- **Entrées** : plan, lot L5 ; les contenus des Passes L2 et L4 (rôles, quête, chaîne de sabotage, événements).
- **Fichiers autorisés** : `src/tournament/lab.ts`, `src/combat/bot.ts`, `src/events/catalog.ts`, `src/simulation/named.ts`, `tests/`,
  `tools/tournament-lab.mjs`, `JOURNAL.md`. **Interdits** : tout fichier du chemin par défaut.
- **Outputs** : `SCRIPTS` (trois parties), `tests/slice.test.mjs`, un événement de plus, `--policy=careful|careless|losing`.
- **Critères d'acceptation** : les trois parties atteignent la fin de la tranche sur trois graines ; le test coche les exigences ; le
  déterminisme ; la sauvegarde à chaque créneau.
- **Tests** : `tests/slice.test.mjs`, des fautes injectées. **Risques** : une partie « perdante » qui gagne (le kit du joueur domine) ; un
  événement jamais déclenché.
- **Définition de terminé** : tests verts, fautes attrapées, validation complète ; aucun fichier du défaut ne change (PD sans objet).

### Fait — [OK]
- **Le déroulé** (contenu des Passes L2 et L4, éprouvé ici) :
  - jour 1 : l'arrivée, les hérauts du Colisée, l'inscription, Tam et sa caisse, Orla, la première rumeur ;
  - jour 2 : le duel contre Vessa ; s'il est gagné, la rancune de Cassius et les deux signes ; le soir, la tentative contre la forge ;
  - jour 3 : la forge sauvée ou brûlée (le service perdu, la boutique plus chère, la réparation, la lame de Mara), le duel contre Marek, la
    réaction de la ville, l'écran de fin.
- **Trois parties scriptées** (`SCRIPTS`, `src/tournament/lab.ts`) : par créneau, des actions essayées dans l'ordre, puis le duel (le bot) ou
  le temps qui passe :
  - **prudente** (adresse 0,6) : la caisse, l'inscription, Orla, l'informateur, la lame trempée, le guet payé, l'observation de Marek ;
  - **négligente** (0,45) : aider Mara, rien d'autre ; la forge brûle ; la lame de Mara au prix de la pénurie ; l'informateur et le rapport ;
  - **perdante** : un joueur qui ne joue pas (adresse négative : ni coup, ni garde, ni esquive), blessé, soigné, battu deux fois.
- **Un événement de plus**, la clameur du Colisée les après-midi de combat (le Colisée « audible », contrat projet § 8.2) : dix-huit en tout.
- **La CLI** du laboratoire joue aussi les trois parties (`--policy=careful|careless|losing`).
- **Un état nommé** de fin de tranche (`slice-end`) ; l'écran de fin capturé, gardé dans `screenshots/calibration/l4-play/slice-end.png`.

### Choix de la séance (consignés comme tels)
- **[KO → changé] la partie perdante gagnait** : un bot d'adresse 0 gagne encore 65 à 100 % de ses duels (le kit du joueur domine, constat de la
  Passe L2). Une défaite déterministe vient d'un joueur qui ne joue pas. **À régler après essai** (D1) : l'équilibre des duels.
- La partie négligente aide Mara le premier matin : c'est ce qui déclenche sa faveur, le seul événement qu'aucune politique ne touchait ;
  l'exception déclarée en Passe L2 est retirée du test des événements.

### Preuves
- **`tests/slice.test.mjs`, 11 tests**, sur les trois parties × trois graines (1842, 7719, 30417) :
  - 3 jours, 9 créneaux, la fin de la tranche ; les quatre aspects (matin, midi, fin de journée, nuit), les services et les gens selon l'heure ;
  - 2 duels officiels 1 contre 1 par partie, gagnés et perdus selon les parties, jamais éliminatoires ;
  - la recrue future (Orla, présentée et prête dans la partie prudente) ;
  - la quête qui change un duel (la lame trempée : des dégâts plus hauts au duel suivant) ;
  - le sabotage contrable : les signes avant la tentative, déjoué par le guet, subi par la négligente, son auteur trouvé après ; aucune
    tentative contre un joueur qui n'inquiète personne ;
  - le service modifié (la forge) et la boutique touchée, avec sa cause et son alternative ;
  - les concurrents hors écran (chaque rival journalisé chaque jour, leur état changé, six combats sans le joueur) ;
  - la sauvegarde rechargée avant chaque action égale la partie ; le déterminisme ;
  - au moins douze événements configurables déclenchés, des six types, chacun avec sa cause ;
  - plusieurs rivaux persistants, un changement de lieu, un combat extensible (le format d'équipe refusé avec sa raison).
  - **Ce que le test ne coche pas** : le troisième lieu (il vient au lot L6 ; le test demande deux lieux d'ici là), les captures (Passe L4),
    le budget technique (lot L7, temps GPU au relais).
- **Cinq fautes injectées une à une, toutes attrapées** : le guet oublié de la partie prudente, la pénurie sans effet, le crépuscule perdu, un
  rival oublié, la recrue jamais prête.
- **Mesures** (CLI, 20 graines, Node, à titre indicatif) : prudente 100 % de duels gagnés, sabotage déjoué 20 fois sur 20 ; négligente 85 %, la
  forge brûlée 20 fois sur 20 ; perdante 0 %. 30 à 52 ms par partie.
- **Validation** : typecheck, `npm test` **146 / 146**, build, `art:validate`. Aucun fichier de `src/main.ts`, `src/app`, `src/arena`, `src/characters`, `src/district`, `src/debug` ni `src/ui` ne change (`git diff --stat`).

### Pensée
- Une partie « perdante » se scripte par ce que fait le joueur, pas par l'issue voulue : si le jeu la fait gagner, c'est une mesure de
  l'équilibre, à consigner, pas à masquer.

## Passe L6 — Les trois lieux : le parvis praticable, Lantern Row (une maquette), le passage de l'un à l'autre (2026-10-20)

### Contrat de tâche (contrat projet § 11.3)
- **Objectif** : trois lieux praticables (choix P3) : le district ; le parvis de l'arène rendu praticable ; un troisième lieu léger, bâti avec
  les générateurs du district, à cadrage fixe, annoncé comme une maquette ; on passe de l'un à l'autre par la carte, sans coût de créneau.
- **Entrées** : plan, lot L6 ; `ArenaScene.ts` (sa manière de bâtir avec les pièces du district) ; `BuildingGenerator`, `PropGenerator`,
  `Banners`, `DistantCity`.
- **Fichiers autorisés** : `src/arena/ArenaApp.ts`, `FighterArt.ts` (des options, défauts inchangés), `src/world/` (nouveau), `src/ui/`,
  `src/simulation/`, `src/tournament/lab.ts`, `tests/`, `JOURNAL.md`. **Interdits** : le district ; `?scene=arena` sans paramètre de jeu.
- **Outputs** : le mode parvis d'`ArenaApp` ; `src/world/LanternRow.ts`, `PlaceApp.ts` ; `src/ui/playLanterns.ts` ; les rôles de Lio et Cassius.
- **Critères d'acceptation** : l'arène par défaut à 0 px ; chaque lieu se charge sans erreur, sur ordinateur et téléphone ; la partie
  scriptée de L5 toujours verte, et passant par les trois lieux.
- **Tests** : `tests/town-roles.test.mjs` (+2), `tests/slice.test.mjs` (trois lieux) ; le PD de l'arène ; des captures. **Risques** : un écart
  de pixel de l'arène par défaut ; une scène neuve qui rend mal en SwiftShader.
- **Définition de terminé** : tests verts, fautes attrapées, PD de l'arène à 0 px, validation complète.

### Fait — [OK]
- **Le parvis praticable** : `ArenaApp` prend une option `forecourt` : pas de duel ; le héros marche sur le sable (flèches ou A / D, W / S),
  avec la marche de profil du générateur de la ville ajoutée à l'atlas (seulement dans ce mode) ; Marek s'entraîne près de l'anneau le jour.
  Quatre places sur le sable (la table d'Odo, le poteau d'Orla, Marek, le coin d'Anwen) : l'invite « E Talk to … » et le dialogue.
- **Lantern Row** (`src/world/LanternRow.ts`) : une rue de tavernes et de maisons de jeu, deux rangées de maisons de `createMerchantBuilding`
  face à face, des lanternes de papier tendues au-dessus de la rue, deux lampadaires à son entrée, tonneaux, caisses et tabourets aux portes,
  deux bannières (la chope, la balance), le bout de la rue fermé par la ville lointaine ; pavés mouillés à flaques. Vu d'un seul cadrage
  (`PlaceApp`, le rendu de la ville : matériaux, lumières, ciel, ombre de lune, reflet, post-traitement), jamais cuit, sans acteur. Un bandeau
  le dit : « a mock-up of the third place ».
- **Le jour et la nuit** : Lantern Row ne s'ouvre que le soir (« sleeps until dusk ») : un quartier qui vit la nuit (contrat projet § 8.1).
  Lio y fait écouter la taverne (un créneau : de la renommée, et la rumeur de House Dree si Cassius en veut au joueur) ; Cassius s'y laisse
  railler (sa rancune grandit : le joueur peut ainsi provoquer la chaîne de sabotage) ou dénoncer, une fois le coupable connu.
- **La partie prudente** passe par Lantern Row le premier soir : les trois lieux dans la même partie.

### [KO → corrigé] le sol de Lantern Row
- **Le sol se lisait comme un miroir pâle.** Une caméra presque rasante (4°) a d'abord été soupçonnée (le Fresnel du sol mouillé) : la baisser
  à 11° n'a rien changé. **La vraie cause** : le sol vit sur la couche de la passe principale (`LAYER_NOREFLECT`), que la caméra de `PlaceApp`
  n'activait pas ; on voyait le ciel sous l'horizon. Corrigé comme dans `ArenaApp`.

### Choix de la séance (consignés comme tels)
- Lantern Row n'a qu'un aspect, la nuit, et ne s'ouvre que le soir : une maquette d'un seul cadrage n'a pas d'état du jour à montrer.
- Le parvis reste l'arène sous son aspect de nuit (Passe L4).
- Au téléphone en portrait, le parvis ne montre que le centre de l'arène (son cadrage est fait pour le paysage, comme le duel, qui affiche alors
  « tournez l'appareil ») : en paysage, il se joue.

### Preuves
- **Tests** (`tests/town-roles.test.mjs` +2, `tests/slice.test.mjs`) : Lantern Row fermé le jour, ouvert le soir ; la raillerie (une seule fois,
  la rancune de Cassius −15), la dénonciation refusée sans preuve, permise avec ; l'écoute de la taverne prend la soirée ; l'atlas de marche
  n'existe qu'en mode parvis (le duel garde le sien) ; la partie prudente passe par les trois lieux.
  - **Quatre fautes injectées une à une, toutes attrapées** : Lantern Row ouvert le jour, la raillerie sans effet, l'atlas de marche par défaut
    (attrapée aussi par l'empreinte de l'atlas du duel, Passe L3), la partie prudente sans le troisième lieu.
- **Le PD de l'arène** (`main` figé :5187, branche figée `1d78eac` :5190, boucle tenue, un moment de chauffe) : `charging`, `window`, `combo`,
  `guardbreak`, `ko` à **0 px**, témoin compris. Pour `strike` et `heavyRen`, les deux chargements de `main` diffèrent entre eux de 107 à 162 px
  dans la barre d'actions (ses transitions CSS) ; la branche est **identique à 0 px** à l'un des deux.
- **`arena-scene-check`** : sans paramètre, la branche a échoué trois fois et `main` passé deux fois, sur la seule boucle vivante (5 images
  contre 6). Mesuré : sans saisie, la boucle de l'arène ne fait qu'**une ou deux images en 10 s** en headless SwiftShader, sur `main` comme
  sur la branche, alors qu'une image coûte 5 à 13 ms : la phase vivante du contrôle tombe ou non sur une image. Avec `fps=off`, **PASS** des
  deux côtés (6 images, empreinte égale au prototype).
- **Dans le navigateur** (branche figée) : Lantern Row et le parvis en 1280 × 720, 390 × 844 et 844 × 390, et le dialogue de Cassius, sans
  erreur de page ; la marche au clavier sur le parvis (`D` tenu : le héros avance, image de marche, l'invite d'Odo) ; le duel du jour 2 joué
  de bout en bout (`play-flow`, graine 30417), rejoué en Node à l'identique.
- Deux images gardées : `screenshots/calibration/l6-places/`.
- **Validation** : typecheck, `npm test` **148 / 148**, build, `art:validate`.

### Pensée
- Un bug de rendu se cherche d'abord dans ce que la caméra voit, pas dans l'éclairage : un sol absent laisse voir le ciel, qui ressemble à
  un miroir.
- Un contrôle qui échoue sur une branche et passe sur `main` ne prouve une régression qu'après avoir mesuré sa marge : ici, une ou deux images
  en dix secondes des deux côtés.

