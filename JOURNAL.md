# Journal de bord — Cité du Tournoi (Merchant District, nuit)

Objet : garder une trace honnête de ce qui a été fait, de ce qui a marché, de ce qui a raté et de **pourquoi**, pour que
la suite parte d'un état connu. À compléter à chaque passe (une entrée par passe, la plus récente en bas).

Légende : **[OK]** réussi · **[KO]** échec / impasse · **[?]** non résolu ou à surveiller · **Pensée** = raisonnement / leçon.

> Les passes 0 à S1b, H0, M6, V0 à V3, H1, M7, H2 à H4, H5 à P2, H7 à D2, H9 à Z4, R2 à Y3, Y4 à D7, K9 à H11, N1 à N4, L0 à L3 sont archivées **mot pour mot** dans `journal/` (Passes M3, M6, M7, H5, T1, B1, D1, Z2, Y4, K10, N3, L2, L7 et Q4) ; ce fichier garde les passes récentes,
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
| [`journal/12-passes-H9-Z4.md`](journal/12-passes-H9-Z4.md) | H9, R1, D3, H10, K6, K7, K8, Z1, Z2, Z3, Z4 | 19/10 |
| [`journal/13-passes-R2-Y3.md`](journal/13-passes-R2-Y3.md) | R2, D4, D5, Y1, D6, Y2, Z5, Y3 | 19/10 → 20/10 |
| [`journal/14-passes-Y4-D7.md`](journal/14-passes-Y4-D7.md) | Y4, Y5, R3, D7 | 19/10 → 20/10 |
| [`journal/15-passes-K9-H11.md`](journal/15-passes-K9-H11.md) | K9, K10, K11, H11 | 20/10 |
| [`journal/16-passes-N1-N4.md`](journal/16-passes-N1-N4.md) | N1, N2, N3, N4 | 20/10 |
| [`journal/17-passes-L0-L1.md`](journal/17-passes-L0-L1.md) | L0, L1 | 20/10 |
| [`journal/18-passes-L2-L3.md`](journal/18-passes-L2-L3.md) | L2, L3 | 20/10 |

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

## Passe L7 — Bilan de la séance cloud « version jouable » : fusionné, mesures, à vérifier, décisions, écarts, reste à faire (2026-10-20)

### Contrat de tâche (contrat projet § 11.3)
- **Objectif** : la finition (robustesse, polissage, sans extension du périmètre, choix S1) et le bilan de la séance, comme la Passe B1.
- **Entrées** : les passes L0 à L6 ; le brief § 7 ; les requêtes `000` et `001` au relais.
- **Fichiers autorisés** : `JOURNAL.md`, `journal/`, `AGENTS.md`, `briefs/local-requests/`, des retouches de textes et de mise en page de
  `src/ui/` et `src/simulation/` (sans changer une règle), `tools/perf.mjs`. **Interdits** : le district, l'arène par défaut, toute règle de jeu.
- **Outputs** : la requête `001-gpu-budget` ; l'archivage N1-N4 ; cette passe ; « À reprendre », « Principes à garder », le statut d'`AGENTS.md`.
- **Critères d'acceptation** : typecheck, `npm test`, build, `art:validate` verts ; l'archivage prouvé (huit contrôles) ; aucun fichier du chemin
  par défaut touché.
- **Tests** : ceux du dépôt (148). **Risques** : un texte retouché qui casse une assertion de test (vérifié : 148 / 148).
- **Définition de terminé** : le bilan écrit, fusionné dans `main`, tous les serveurs et tâches de fond arrêtés.

### Cadre
- Séance cloud lancée sur le « go » de l'opérateur (brief `briefs/cloud-session-playable-brief.md`, plan v4 `briefs/cloud-session-playable.md`),
  sans GPU (SwiftShader), sans Aseprite, sans clé OpenAI ; opérateur absent : aucune décision réservée prise, chacune préparée ci-dessous.
- **Journal** : passes N1 à N4 (closes : `main` les porte depuis `d129433`) archivées d'un bloc, à l'octet, dans `journal/16-passes-N1-N4.md`
  (17 827 octets, SHA-256 `d9b1d4fed327c0a4…`) ; preuve **8 / 8** (script de la Passe T1 adapté, contre le `JOURNAL.md` de `0c6d4bf`, fait avant
  d'ajouter cette passe) ; contrôle négatif (un octet changé dans la copie) attrapé. Cette passe écrite, les passes gardées faisaient 65 563
  octets : L0 et L1 (closes, fusionnées) archivées à leur tour dans `journal/17-passes-L0-L1.md` (9 634 octets, SHA-256 du bloc
  `25d0773178f7099d…`), preuve **8 / 8** contre le `JOURNAL.md` d'avant ce second déplacement, contrôle négatif 7 / 8 (un octet changé dans
  l'archive) ; restent 55 929 octets de passes gardées.
- **Finition** (choix S1, sans changer une règle) : « next duel » → « next bout » dans le libellé et le refus de l'entraînement (le mot du reste
  de l'interface) ; l'écran titre élargi (le titre « CITÉ DU TOURNOI » tenait mal sur 420 px à 34 px de corps ; le menu reste à 420 px).

### Fusionné dans `main` (une tâche = une branche `claude/pensive-pasteur-lbz4ji`, avance rapide, CI verte sur chaque push de `main`)
| Passe | Commits | Contenu |
|---|---|---|
| L0 | `29135ca`, `55a653c` | environnement (Chromium 141 + SwiftShader, copie figée de `main` sur :5187), requête `000-handshake`, capture de fumée et témoin à 0 px |
| L1 | `4eb400c` | cœur headless `src/simulation/` : état nommé, actions, créneaux, journal causal, sauvegarde versionnée, empreinte FNV-64, états nommés |
| L2 | `124bd79` | poule à points de la phase I, sept rivaux persistants hors écran, pouls de la ville, 17 événements configurables (`src/events/`), chaîne de sabotage de la forge, `tools/tournament-lab.mjs` ; archivage K9-H11 |
| L3 | `0b823ef`, `0b75607`, `4fbebd5` | le duel officiel : l'arène pilotée par une fiche de match (listes de combattants, E17), Vessa générée, HUD anglais par table, `?play=1`, l'aller et retour ville → arène → ville |
| L4 | `d593537`, `8d05a33`, `7ca6dfd`, `79776d4` | la ville jouable : rôles des PNJ, dialogues et portraits, interface anglaise, cargaison d'acier, réponses au sabotage, l'écran titre sur l'adresse nue (« New game », « Continue », « Explore the district ») |
| L5 | `1e38914` | trois parties scriptées (prudente, négligente, perdante) jusqu'à la fin des trois jours ; `tests/slice.test.mjs` coche gameplay § 13 et projet § 14 ; la clameur du Colisée |
| L6 | `1d78eac`, `7b7a966` | le parvis praticable, Lantern Row (maquette de nuit bâtie avec les générateurs du district), trois lieux dans la même partie |
| L7 | `0c6d4bf`, (ce commit) | requête `001-gpu-budget`, `perf.mjs` pilote la page de Lantern Row ; finition ; archivage N1-N4 ; ce bilan |

- **Jeu par défaut inchangé** à chaque lot qui touchait un fichier du chemin par défaut (L3, L4, L6) : `detshots` contre `main` figé au seuil 0,
  témoin de répétition d'abord, nuit A / B / C / D (statique et personnages) et midi B : **0 px** ; les moments de l'arène par défaut : **0 px**
  (sauf `strike` / `heavyRen`, dont les deux chargements de `main` diffèrent entre eux dans la barre d'actions ; la branche égale l'un des
  deux) ; « Explore the district » depuis l'écran titre : **0 px** contre l'adresse nue de `main`. `npm test` : 103 → **148** tests ; chaque
  nouveau test a d'abord attrapé ses fautes injectées (au moins trois par lot).
- **CI** (GitHub Actions, lue par l'API) : verte sur chaque push de `main` (L0 à L6) et de la branche (une exécution annulée par un push
  plus récent, Passe L6).

### Ce qui est jouable, et comment
- `npm run dev`, puis l'adresse nue `http://127.0.0.1:5173/` dans un navigateur ouvert par une personne : l'écran titre. **New game** demande un
  nom (20 caractères au plus) ; **Continue** reprend la sauvegarde (localStorage ; le menu, Échap, l'écrit aussi dans un fichier et en relit un) ; **Explore the district**
  ouvre le jeu d'aujourd'hui, la nuit et son panneau DEV, à l'identique.
- La partie : **trois jours, neuf créneaux** (matin → `morning`, après-midi → `midday`, soir → la nuit ; `afternoon` en transition après un
  duel), dans **trois lieux** (le district, le parvis de l'arène, Lantern Row le soir), passés par la carte (M). Les gens du district parlent (E,
  portrait, mots, leurs services) ; une action majeure prend le créneau, la page se recharge dans l'aspect suivant (sauvegarde à chaque fois).
  **Deux duels officiels** : Vessa Lark l'après-midi du jour 2, Marek l'après-midi du jour 3, joués dans l'arène (clavier : 1-6, A esquive,
  B garde), leurs données tirées de la préparation (cargaison d'acier livrée : lame +15 % ; pierre à aiguiser ; entraînement ; blessures). Une
  défaite coûte des points, n'élimine jamais (G3). La chaîne de sabotage de la forge se déclenche sur conditions et se contre (guet payé, pistes
  achetées, dénonciation) ; la fin de la tranche donne le classement de la poule.
- Raccourcis : `?play=1&new=1&name=<n>&seed=<s>` (une partie neuve sans l'écran titre), `?title=0` / `?title=1`, et, sur le serveur DEV,
  `?play=1&state=<nom>` (les états nommés de `src/simulation/named.ts`).

### Mesures (cloud : compteurs, aucun temps GPU)
- **Rendu** (SwiftShader, 1280 × 720, bake actif ; `__stats()`) :
  | Page | Appels de dessin | Triangles | Lumières (à l'écran) |
  |---|---|---|---|
  | nuit B (défaut) | 107 | 212 166 (district 120 114, 58 instanciés) | 24 (24) |
  | jeu, matin | 107 | 214 186 | 24 (4 allumées : la forge, de jour) |
  | jeu, midi | 107 | 214 250 | 24 (4) |
  | duel / parvis / `?scene=arena` | 92 | 133 322 (arène 55 189, 21 instanciés) | 23 (21) |
  | Lantern Row | 106 | 188 522 (lieu 84 642, 27 instanciés) | 12 |
- **Cœur de jeu** (Node 22, 4 cœurs) : `advance` d'une action mineure 0,082 ms, d'une action majeure (fin de créneau, matchs hors écran,
  événements) 0,232 ms ; sauvegarde + relecture 0,524 ms ; sauvegarde de fin de tranche 23 313 octets ; une partie entière du TournamentLab 11 à
  52 ms.
- **TournamentLab** (`node tools/tournament-lab.mjs`) : politique « idle » 74 % de victoires (50 graines), sabotage réussi 96 % ; « diligent »
  97 %, sabotage déjoué 82 % ; parties scriptées (20 graines) : prudente 100 % de victoires, sabotage déjoué 20 / 20 ; négligente 85 %, forge
  brûlée 20 / 20 ; perdante 0 %.
- **Démarrage** : une page de la ville en SwiftShader prend 2 à 3 min (bake compris, deux pages en parallèle sur 4 cœurs) : un chiffre du
  rendu logiciel, sans rapport avec la machine de l'opérateur.
- **Temps GPU** : la requête `001` n'a pas reçu de réponse ; ils restent **à mesurer** (commande ci-dessous, point 2).

### Requêtes au relais local
| Requête | Objet | Statut |
|---|---|---|
| `000-handshake` | éprouver le relais ; état de la machine locale (Aseprite, clé OpenAI, GPU) | ouverte, sans réponse ; repli : la séance a continué sans relais |
| `001-gpu-budget` | temps GPU par passe des pages du mode jouable à côté de la nuit B, 1920 × 1080 (et 2560 × 1440), sur la 780M | ouverte, sans réponse ; repli appliqué : les compteurs ci-dessus, les temps à mesurer |

### Budget technique (contrat projet § 14, § 16 ; écart E24)
- Compteurs du cloud ci-dessus : le mode jouable dessine la ville avec les **mêmes appels** que la nuit par défaut (107) et ≈ 2 000 triangles de
  plus (le pavois de jour), l'arène 92 appels, Lantern Row 106 ; l'interface est du DOM, hors du rendu.
- Référence GPU connue : la nuit par défaut 10-12 ms en 1080p sur la 780M (Passe 6), l'arène 9,3 ms (Passe G1). Le budget des pages du mode
  jouable n'est **pas mesuré** : point 2 ci-dessous.

### À vérifier sur la machine de l'opérateur
1. **Jouer** la tranche à la main, depuis l'adresse nue : le ressenti (la lisibilité des choix, la longueur d'une journée, le rechargement à
   chaque créneau, environ le temps d'une génération), les deux duels au clavier, une partie qui laisse brûler la forge, « Continue » après
   avoir fermé l'onglet.
2. **Budget GPU** : la série de la requête `001` (`node tools/perf.mjs --secs=4 --warm=2.5 --rounds=3 --size=1920x1080 "night-B|…" …`, le texte
   complet dans `briefs/local-requests/001-gpu-budget.md`), puis `tools/cadence.mjs` sur une page du jeu ; `tools/startup.mjs` sur
   `play=1&state=day1-morning` (la génération à chaque créneau).
3. **L'équilibrage** (« Régler après essai », D1) : le kit du joueur domine (Passe L2 : un bot d'adresse 0 bat Marek à 68 %) ; juger en jouant
   si les duels demandent quelque chose.
4. **Preuves d'image sur GPU** : les PD ont été faits en SwiftShader ; `tools/arena-scene-check.mjs` sans `fps=off` (Passe L6 : en headless
   logiciel, la boucle de l'arène ne fait qu'une ou deux images en 10 s, sur `main` comme sur la branche) ; `npm run shots` des pages du jeu.
5. **Téléphone** : l'interface se lit à 390 × 844 (captures `screenshots/calibration/l4-play/`), mais la tranche se joue au clavier (aucune
   commande tactile de marche) ; le duel et le parvis veulent le paysage.

### Décisions préparées (réservées à l'opérateur ; recommandation de la séance)
1. **Vessa Lark, combattante générée** (`src/arena/FighterArt.ts`, l'atlas de l'arène par défaut inchangé à l'octet) : garder ou retoucher. Sa
   silhouette reste proche de celle du héros (elle prend ses images) ; capture `screenshots/calibration/l3-arena/vessa-vs-hero-combo-x2.png`.
   Recommandation : la garder pour la tranche, la juger en jeu ; une feuille cuite plus tard passerait par un manifeste approuvé.
2. **L'arène (duel et parvis) n'a que l'aspect de nuit**, même l'après-midi (choix G1, « L'arène actuelle ») : lui donner les états du jour
   serait un changement d'aspect. Recommandation : oui, après la revue du jour en jeu (J9), par la même voie que la ville (`DayState`).
3. **Lantern Row** reste une maquette d'un seul cadrage, de nuit, ouverte le soir (P3) ; captures `screenshots/calibration/l6-places/`.
   Recommandation : la garder telle quelle pour la tranche ; en faire un quartier praticable est une tâche à part.
4. **L'équilibrage des duels** (point 3 ci-dessus) : recommandation : régler après votre essai, avec `tools/tournament-lab.mjs` pour chiffrer.
5. **L'écran titre caché aux navigateurs pilotés** (`navigator.webdriver`, sauf `?title=1` ; choix de la séance, Passe L4) : il évite de changer
   une douzaine d'outils qui chargent l'adresse nue. Recommandation : le garder.
6. **Le jour par défaut** (J9) : « Explore the district » garde la nuit ; le mode jouable suit déjà les créneaux. Recommandation : rien avant
   votre revue en jeu. **Gold Master** : non (RJ3) ; la tranche ne le demande pas.

### Écarts consignés (non résolus par la séance)
- **E1 à E25** : tableau du plan (`briefs/cloud-session-playable.md` §§ 3, 3b), appliqués comme le plan le dit : E1 / E16 le combat sans tour
  (G1), E2 trois lieux dont un léger (P3), E3 trois créneaux sur quatre aspects (G2), E4 la nuit par défaut (J9), E5 / E6 / E12 le tournoi hors
  écran et le TournamentLab CLI (faits, L2), E7 la défaite non éliminatoire (G3, faite), E8 le nom du joueur (K2, fait ; pas d'art de combat
  du héros cuit), E9 l'interface en anglais (K1, faite), E10 / E11 les contrats et la « décision A3 » (non définie), E13 pas de festival, E14
  pas de Blender ni de glTF, E15 la ville générée au démarrage, E17 la fiche de match en listes (faite ; l'arène reste 1 contre 1), E18 les
  ajouts du § 5, E19 le Colisée suggéré (annonces, clameur), E20 aucun son, E21 le code neuf rangé selon le § 10.4, E22 les états nommés
  (faits), E23 un contrat de tâche par passe (fait), E24 le budget GPU mesuré en local, E25 la version du contrat projet (1.2 / 1.1).
- **Trouvés par la séance** :
  - **E26** : l'arène, duel et parvis, de nuit à toute heure (décision 2 ci-dessus), alors que le contrat projet § 8.1 veut le jour et la nuit
    visibles.
  - **E27** : Lantern Row n'a pas de profil de jour (fermée « until dusk ») ni d'identité de quartier complète (gameplay § 6) : une maquette.
  - **E28** : le tournoi veut des duels disputés ; le kit du joueur domine les nombres actuels (décision 4).
  - **E29** : le choix P2 (« l'écran titre sur l'adresse nue ») est appliqué aux seules personnes (décision 5).
  - **E30** : le projet § 14 demande des captures sur ordinateur et téléphone, faites ; la tranche ne se joue pas au toucher (point 5).

### Reste à faire
- Le relais : les réponses à `000` et `001`, puis recopier les temps GPU dans une passe.
- Les décisions 1 à 6 ; l'équilibrage après essai.
- Hors tranche (consignés, non commencés) : la phase d'équipe et le recrutement effectif (P1), le festival (E13), le son (E20), un quartier
  praticable de plus, l'art de combat du héros cuit, les commandes tactiles.

### Preuves
- Validation : typecheck, `npm test` **148 / 148**, build, `art:validate`. Aucun fichier du chemin par défaut touché par L7 (`src/ui/title.ts`
  ne paraît pas à un navigateur piloté ; `actions.ts` est un texte du mode jouable).
- Tous les serveurs (5173, 5187-5190) et toutes les tâches de fond de la séance arrêtés avant de finir.

### Pensée
- Une requête au relais est un pari sans échéance : son repli, écrit en même temps qu'elle, est ce que le bilan donne si la réponse ne vient pas.
- Un mode de jeu ajouté au-dessus d'un district figé se prouve en deux sens : le jeu neuf joué de bout en bout, et l'ancien chemin à 0 px.

## Passe Q3 — Reprise locale de la séance cloud : `main` validé sur la machine de l'opérateur, un test rendu indépendant des fins de ligne (2026-10-20)

### Demande, mot pour mot
- Opérateur : « Nos sous-sessions sont finis prendre les elements en compte puis si tout est bon archivons les »
- Branche `test-crlf-q3` depuis `main` (`1f217bc`).

### Constat à la reprise — [KO → corrigé]
- Le `main` local avait 16 commits de retard sur `origin/main` (les lots L0 à L7 de la séance cloud). Il est avancé en avance rapide ; la
  modification locale de `.gitignore` de l'opérateur reste en place.
- Sur cette machine (Windows), typecheck, build et `art:validate` passent, mais `npm test` donnait **147 / 148**.
- **Le test en échec** : « « Explore the district » runs today's town path… » (`tests/town-roles.test.mjs`). Il compare le texte de
  `startTown` lu sur le disque avec celui de `git show d129433:src/main.ts`. Sous Windows (`core.autocrlf`), le disque a des CRLF et
  `git show` donne les LF de l'index : le texte diffère par les seuls CR. Sur le runner Linux de la CI, les deux sont en LF, d'où la CI verte
  de la séance cloud.

### Fait — [OK]
- Le test ramène les deux textes aux LF avant de les comparer. Aucune règle et aucun fichier du jeu ne changent.

### Preuves
- `npm test` **148 / 148** sur la machine de l'opérateur ; typecheck, build, `art:validate` (18 manifestes, 21 sources, 0 erreur).
- **Faute injectée, attrapée** : un ajout dans le corps de `startTown` (`src/main.ts`) fait échouer le test (« startTown is unchanged »).
  Le fichier est rendu à l'octet (`cmp`).

### Restes [?]
- Les requêtes au relais `000-handshake` et `001-gpu-budget` sont restées ouvertes, sans réponse (Passe L7). Elles relèvent d'une séance
  locale.
- Les six décisions préparées par la séance cloud (Passe L7) et la tranche jouée à la main par l'opérateur.

### Pensée
- Un test qui compare un fichier du disque avec `git show` compare aussi les fins de ligne ; il se normalise des deux côtés. La CI Linux ne
  le voit pas, la machine Windows de l'opérateur si.

## Passe L7b — Retour de la séance cloud à la séance parente (2026-10-20)

### Demande, mot pour mot
- Opérateur, à la séance cloud : « feeback a  la session parente ».
- Branche `claude/pensive-pasteur-lbz4ji` recréée depuis `main` (`8ce21e5`, la Passe Q3 de la séance parente).

### Fait — [OK]
- La séance parente n'est pas joignable : aucune autre séance n'est atteignable d'ici, et une séance cloud n'écrit à aucune séance
  (`AGENTS.md`). Le retour est donc un fichier versionné : `briefs/cloud-session-playable-feedback.md`. Il contient :
  - l'état remis ;
  - ce qui reste ouvert pour une séance locale (les requêtes `000` / `001`, à traiter sur `main` puisque la séance cloud a fini) ;
  - la leçon de la Passe Q3 ;
  - un retour sur le plan et le brief, pour la prochaine séance cloud : ce qui a marché, ce qui a coûté du temps (SwiftShader, le crochet de
    fin de tour, les contrôles vivants en logiciel, l'écran titre contre les outils, le relais muet) et ce qu'il faudrait ajouter au brief.
- Vérifié pour ce retour : aucun autre test de la séance ne compare un fichier du disque avec `git show`. Les autres lectures du disque
  (`tests/game-core.test.mjs`) cherchent des motifs, indifférents aux fins de ligne, et la Passe Q3 compte 148 / 148 sous Windows.

### Preuves
- Documentation seule : typecheck, `npm test` 148 / 148, build, `art:validate`.

### Pensée
- Un retour à une séance qu'on ne peut pas joindre va là où elle lit déjà : le dépôt, à côté du brief qui l'a lancée.

## Passe Q4 — Relais local : les requêtes `000` (état de la machine) et `001` (temps GPU du mode jouable sur la 780M) répondues (2026-10-20)

### Demande
- Séance locale lancée par la séance parente : répondre sur cette machine aux deux requêtes du relais restées ouvertes (Passes L7, Q3), dans
  la section « Réponse » de chaque fichier de `briefs/local-requests/`.
- Branche `relay-gpu-q4` depuis `main` (`94aa82f`). La séance cloud étant close, tout a tourné sur `main` (même code de jeu que `7b7a966`).

### Requête `000` — [OK] répondue
- **Aseprite** : oui, 1.3.18.6-x64 (`art:doctor`) ; l'extension et le plugin Aseprite AI Artist 0.8.2 configurés, le lien vivant non testé.
- **Clé OpenAI** : présente, dans `.env.local` (ignoré par Git), absente de l'environnement. La présence vient de la fonction `readKey()` de
  l'outil, qui n'a affiché qu'un booléen : la valeur n'a été ni lue, ni affichée, ni recopiée. Registre des dépenses : trois tâches, 0,36 /
  0,53 / 0,77 $ sur 5 $.
- **GPU** : Chrome rend sur la Radeon 780M (ANGLE D3D11), pilote AMD 32.0.21030.14003 ; la RTX 4060 (pilote 32.0.15.7702) n'est prise
  qu'avec `--gpu=dgpu`. Chrome 155.0.8059.80 ; écran 2560 × 1600 à 165 Hz.

### Requête `001` — [OK] répondue, [?] mesurée sous contention
- **Conditions** : serveur DEV `dev-strict` (:5186) lancé par `preview_start`, son onglet fermé aussitôt, le panneau navigateur resté fermé ;
  chaque série en arrière-plan, attendue jusqu'au bout dans le tour ; témoin de contention au seuil de 15 %. La série 1080p en 5 tours, la
  série 2560 × 1440 en 3 tours.
- **[?] La contention** : le processus GPU d'un Firefox de l'opérateur (PID 10840, ouvert depuis le 19/10) a occupé **13 à 38 % de la 780M**
  pendant toute la séance (médiane 17 % sur un journal complet du témoin tenu pendant la série 1440p). Il n'a pas été touché. **Aucun tour
  n'est sans contention** : les tours « clean » ne sont que ceux où Firefox est resté entre 13 et 15 %. Les variantes étant entrelacées, la
  comparaison entre pages tient ; les temps absolus non.
- **Résultats** (ms de GPU, médiane des tours ; écart à la nuit B de la même série) :

| Page | 1920 × 1080 | 2560 × 1440 |
|---|---|---|
| nuit B (`seed=1842&clean=1&camera=B`) | 13,77 [13,44-16,45] | 22,25 [21,48-23,35] |
| jeu, matin (`day1-morning`) | 12,63 (−8 %) | 20,05 (−10 %) |
| jeu, midi (`day2-afternoon`) | 12,51 (−9 %) | 20,44 (−8 %) |
| jeu, fin de journée (`day2-dusk-won`) | 13,58 (−1 %) | 19,76 (−11 %) |
| duel (`scene=arena`, jour 2) | 12,82 (−7 %) | 20,82 (−6 %) |
| parvis (`forecourt-morning`) | 12,36 (−10 %) | 20,75 (−7 %) |
| Lantern Row (`lanterns-night`) | 12,52 (−9 %) | 20,68 (−7 %) |
| arène par défaut (`scene=arena`) | 13,01 (−5 %) | 21,02 (−6 %) |

- **Lecture** :
  - Chaque page du mode jouable coûte au plus ce que coûte la nuit par défaut dans la même série (−1 à −11 %). Les pages de jour gagnent leurs
    lumières éteintes (4 allumées sur 24) ; mêmes appels de dessin que la nuit (107), ≈ 2 000 triangles de plus (le pavois), comme le comptait
    le cloud (Passe L7).
  - Contre les références : la nuit B fait +3,0 ms en 1080p et +2,6 ms en 1440p de plus qu'à la Passe G1 (10,81 [9,88-10,95] et 19,65
    [18,60-20,04], tours propres), hors de la fourchette de la Passe 6 en 1080p (10-12 ms), dedans en 1440p (16-21 ms). L'arène garde son
    rapport à la ville : −6 % à la Passe G1 (9,30 contre 9,88 ms), −5 % ici.
  - **[?] Estimation non vérifiée** : si cet excès tient tout entier à Firefox et pèse autant sur chaque page, les pages du jeu tiendraient
    9,4 à 10,6 ms en 1080p et 17,2 à 18,2 ms en 1440p, dans le budget de la Passe 6. À remesurer Firefox fermé.
  - `js ren` suit le temps GPU sur toutes les pages : le rendu semble attendre le GPU dans ce harnais sans plafond (hypothèse, non vérifiée).
- **Cadence** (`tools/cadence.mjs`, fenêtre discrète, `max`, plafond `a60`) : 37 à 44 images/s sur la nuit B et trois pages de jeu, le plafond
  à 4 vsyncs ; à la Passe 6h, au calme 55,0 images/s à 3 vsyncs, sous une charge de +5,5 ms 41,6 images/s à 4 vsyncs. Aujourd'hui, la nuit
  comme le jeu sont dans le cas chargé.
- **Démarrage** (`tools/startup.mjs`, 1080p, 4 chargements, serveur DEV) : la page du premier matin est prête en 2,86 s [2,53-3,29], la
  nuit B en 2,66 s [2,44-2,79] ; le premier chargement de la session rate le cache du bake (bake 339 ms, prêt en 3,29 s), les suivants le
  relisent (bake 18-21 ms). C'est l'attente du joueur à chaque créneau, sur un serveur DEV. La bascule de la forge ne fait rien dans le mode
  jouable (0-0,2 ms), comme le veut la Passe L4.
- Les sorties complètes sont recopiées dans `briefs/local-requests/001-gpu-budget.md`.

### [KO → corrigé] `tools/perf.mjs` plantait au résumé sur Lantern Row
- Une première série 1080p de 3 tours a donné tous ses tours, puis le résumé s'est arrêté sur `play-lanterns` (`TypeError … reading
  'toFixed'`), sans écrire son JSON : la page de Lantern Row (`PlaceApp.snapshot()`) ne publie ni `textures` ni `textureMB`. La Passe L7 avait
  ajouté cette page à l'outil (`window.__place`) dans le cloud ; le résumé, lui, ne prévoyait pas une page sans ces compteurs.
- Correctif : le résumé affiche `-` pour un compteur absent (deux lignes, aucune mesure changée). La série refaite en 5 tours l'a traversé.

### Journal — [OK] archivage (passes gardées au-delà d'environ 60 Ko)
- Avant cette passe, les passes gardées faisaient 60 533 octets. L2 et L3, closes (fusionnées), partent d'un seul bloc, dans leur ordre et à
  l'octet, vers `journal/18-passes-L2-L3.md` : en-tête, ligne `---`, puis les 19 559 octets inchangés (SHA-256 `cd45c00274fccb6b…`). La ligne
  d'index et la phrase d'en-tête sont mises à jour.
- **Preuve** (script hors dépôt, contre la copie de `JOURNAL.md` faite juste avant le déplacement) : **9 / 9** (le corps de l'archive égal au
  bloc retiré ; un bloc contigu L2-L3 suivi de L4 ; chaque section dans un seul fichier de `journal/` et plus dans `JOURNAL.md` ; `JOURNAL.md`
  inchangé à partir de L4 ; seules la phrase d'en-tête et une ligne d'index changent ; l'en-tête de l'archive comme celui de `journal/17` ;
  CRLF seuls dans les deux fichiers de la copie de travail ; aucune autre archive touchée). Contrôle négatif : une lettre changée dans une copie
  de l'archive → 7 / 9.

### Validation
- typecheck, `npm test` **148 / 148**, build, `art:validate`.

### Restes [?]
- Les temps absolus : remesurer la série `001` (1080p au moins) et la cadence avec Firefox fermé, témoin à l'appui, avant de les tenir pour le
  budget du contrat projet § 14.

### Pensée
- Un témoin de contention qui ne descend jamais sous son seuil ne laisse aucun tour propre : un tour « clean » au seuil de 15 % peut porter
  13 % d'un autre programme. Un journal complet du témoin pendant la série le montre ; la comparaison entrelacée reste, les temps absolus non.
- Un outil étendu à une page nouvelle s'essaie jusqu'à sa dernière ligne, résumé compris, avant de partir au relais.

## Passe Q4b — Requête `001` : la série 1080p et la cadence remesurées, Firefox arrêté (2026-10-20)

### Demande, mot pour mot
- Opérateur : « Firefox est fermé : refais la série 001 en 1080p (et la cadence) avec le témoin, puis mets à jour la réponse et le journal. »
- Branche `relay-gpu-q4b` depuis `main` (`aeefedd`).

### Constat — [KO → réglé avec l'opérateur] le Firefox « fermé » tournait encore
- Le témoin, avant la série (16 h 59) : le processus `firefox` 10840 (lancé le 19/10 à 8 h 12) toujours vivant, à 30 % de la 780M.
- Question posée ; réponse de l'opérateur : « Arrête-le (PID 10840) ». Arrêté seul (`Stop-Process -Id 10840`), après avoir revérifié son nom et
  son heure de lancement ; il n'est plus reparu au témoin.
- Une autre séance (projet RPGCards, en cours) lançait des Chrome sans fenêtre, par à-coups jusqu'à 94 % de la 780M. Non touchée ; un journal
  complet du témoin (166 échantillons) dit quels tours sont **vraiment calmes** (aucun autre programme au-dessus de 5 % pendant le tour).

### Mesures — [OK]
- Même serveur DEV (:5186), même commande, 5 tours, aucun onglet du jeu ouvert, série et cadence attendues jusqu'au bout.

| 1920 × 1080 | tours calmes | minimum des 5 tours | écart à la nuit B (minimum) |
|---|---|---|---|
| nuit B | 10,72 ; 10,57 | 10,57 | — |
| jeu, matin | 8,74 | 8,74 | −17 % |
| jeu, midi | 9,08 | 9,08 | −14 % |
| jeu, fin de journée | — | 9,42 | −11 % |
| duel | — | 9,82 | −7 % |
| parvis | 9,19 | 9,02 | −15 % |
| Lantern Row | 9,30 | 9,30 | −12 % |
| arène par défaut | — | 9,24 | −13 % |

- **La nuit par défaut retrouve la Passe G1** (10,81 [9,88-10,95]) et la fourchette de la Passe 6 (10-12 ms) : les +3 ms de la Passe Q4 étaient
  la contention de Firefox.
- **Les pages du mode jouable tiennent le budget** : 8,7 à 9,8 ms en 1080p, toutes sous la nuit par défaut. L'arène : 9,24 ms (9,30 à la Passe
  G1). L'estimation de la Passe Q4 (9,4 à 10,6 ms) était un peu haute.
- **Cadence** (`tools/cadence.mjs`, `max`, `a60`) : **55,0 images/s, 3 vsyncs 100 %, aucun changement de pas**, nuit B et trois pages de jeu,
  deux tours ; SoC 30,5 à 39,4 W. C'est le cas calme de la Passe 6h (55,0 images/s à 3 vsyncs), contre 37-44 images/s sous Firefox.
- Les sorties complètes sont en tête de la réponse de `briefs/local-requests/001-gpu-budget.md`, la première mesure gardée dessous.

### Validation
- typecheck, `npm test` **148 / 148**, build, `art:validate`.

### Restes [?]
- Non refaits au calme : la série 2560 × 1440 (Passe Q4 : 19,8 à 20,8 ms pour les pages du jeu, sous Firefox) et le démarrage.
- Trois pages sans tour calme (fin de journée, duel, arène) : leur minimum est une borne haute.

### Pensée
- Une fenêtre fermée ne prouve pas un programme arrêté : un processus du navigateur peut rester vivant et tenir le GPU. Le témoin se relit
  juste avant la série, pas sur la parole d'un « c'est fermé ».

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

## À reprendre (par priorité)

> Élaguée le 18/10 (Passe M3) : seul le travail ouvert reste, regroupé par thème ; ce qui est fait vit dans sa passe. Les anciens repères
> (-3 … 6) cités par les passes antérieures renvoient à la liste de `7086340` (`git show 7086340:JOURNAL.md`).

**0. Jalon M1 — clos (Passe Z4)** : le Merchant District est déclaré complet (décision RJ1) ; Gold Master : « Pas encore » (RJ3).
- **La suite, RJ2 « L'état jour »** : la direction artistique est décidée (fiche de la Passe R2, choix consignés en Passe D4 et dans
  `AGENTS.md`). Premier jet derrière `?time=day` (Passe Y1) ; midi d'après la piste de midi derrière `?time=midday` (Passe Y2), le pavois du tournoi de jour (Passe Y3), le matin et la fin de journée derrière `?time=morning` / `?time=afternoon` (Passe Y4), la météo sur chaque état (Passe Y5) ; la foule du jour (J7) décidée et appliquée (Passes R3 / D7 : matin 6, midi 12, fin de journée 9 ; la nuit garde cinq). Les tâches de la Passe D6 sont faites. Revue de l'opérateur en jeu (Passe K9) : tout est bien implémenté, la nuit reste le défaut pour le moment (J9). Orientation (Passe K10) : le héros selon la ligne de visée, les PNJ selon l'écran (décision K9). Les cycles de face et de dos du héros et son trois-quarts dos : `hero-x2-v4` (Passe K11, courses dessinées, gagnant à l'aveugle), en production depuis la Passe H11 (« Production : mets hero-x2-v4 en production à la place de hero-x2-v3. »). Ouverts : les trois-quarts des PNJ (RH4). Nouvelle direction de l'opérateur (Passe D6) : midi est la piste de midi ; quatre états (matin,
  midi, fin de journée, soir = la nuit), la météo sur chacun ; le pavois comme l'image. À appliquer dans l'ordre de la Passe D6 ; le jour par
  défaut : décidé en Passe D8 (L7-6a, « Le jour devient le défaut d’« Explore the district » (tâche à part) »), la nuit restant le défaut
  jusqu'à sa tâche. Restes vus sur les captures : Passe Y1.
- **Décision de l'opérateur qui reste** : le remède au recul du fondu ancré (diagnostic, Passe K8 : options 1 à 3).

**0b. Version jouable — séance cloud (Passes N1 à N4, puis L0 à L7)** : plan v4 `briefs/cloud-session-playable.md`, brief
  `briefs/cloud-session-playable-brief.md`, contrats dans `contracts/`. **Séance close** : lots L0 à L7 fusionnés dans `main` ; bilan, mesures,
  décisions préparées et écarts E1 à E30 : **Passe L7**. Ouverts :
  - les requêtes au relais `000-handshake` et `001-gpu-budget` : répondues (Passes Q4, Q4b) ; au calme, les pages du jeu font 8,7 à 9,8 ms en
    1080p, sous la nuit par défaut (10,6 ms), et la cadence tient 55 images/s ; restent à refaire au calme la série 2560 × 1440 et le démarrage ;
  - la revue en jeu de l'opérateur et les six décisions de la Passe L7 : faites, tranchées sur la fiche de la Passe D8 avec six écarts
    (E24, E30, E1 / E16, E14 / E15, E11, E25). Restent les cinq tâches à part de la Passe D8 : l'équilibrage vers « modéré » (L7-4), le jour
    par défaut d'« Explore the district » (L7-6a), les états du jour de l'arène après lui (L7-2), l'amendement du contrat projet (E14 / E15,
    avec l'opérateur), la tâche « système de combat » (E1 / E16, avec l'opérateur) ;
  - hors tranche : phase d'équipe et recrutement effectif, festival, son, commandes tactiles, art de combat du héros cuit.

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
  RH2 « Par défaut avec le héros » : **en production depuis la Passe H10**, cinq vues par défaut ; RH3 « Fait », RH4 « Plus tard » (les trois-quarts des PNJ) ; Passe K11 : `hero-x2-v4`, courses de face, de dos et de trois-quarts dessinées ; **en production depuis la Passe H11** à la place de `hero-x2-v3` (remplacé). Vues de trois-quarts : étude `briefs/three-quarter-views.md` (aucun trois-quarts dos sur la planche v3 ; Passe I1 :
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
shaders d'un profil persistant, 780M sans contention (fenêtre calme, témoin à l'appui ; en 1080p, tours calmes de la Passe Q4b : nuit B 10,6-10,7 ms). Écartés (mesurés, Passe 6) : pré-passage de
profondeur (≤ 0,75 ms en 1080p avant son propre coût), filtre de l'ombre de lune (≤ 4 %) ; FXAA, qui flouterait le pixel-art sans masque des
sprites.

**6b. Météo (Passes W1 / W2)** — pluie, neige, orage, vent derrière `?rain` / `?snow` / `?storm` / `?wind`, défaut inchangé (0 px), réglables
en jouant dans le panneau DEV (section « Weather »). Restent : le
jugement de l'opérateur en jeu et en mouvement (vent sur les bannières,
pluie qui tombe, éclairs), météo par défaut : « Nuit claire par défaut » (Passe D1) ; non faits : son (le jeu n'en a pas), éclaboussures
au sol, neige sur les personnages. Éclair dessiné dans le ciel : Passe W3. De jour, la couverture voile le soleil et grise le ciel : Passe Y5.

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
c'est la suite, le district étant clos (Passe Z4) ; direction artistique décidée (Passe D4), deux pistes archivées comme références non canoniques.

**7. Outillage, documentation, dette**
- **Port 5173** partagé avec un autre projet local et `vite.config.ts` sans `strictPort` : les outils peuvent photographier la mauvaise
  appli. Servir les baselines sur `:518x --strictPort` ; décision « strictPort » (Passe D1), appliquée (Passe O1).
- **Tests et CI — restes (Passe Q1)** : le libellé `ubuntu-latest` passe à Ubuntu 26 dès le 19/10 (« Épingler 24.04 », Passe D1, appliqué
  en Passe O1) ; les tests ne sont pas typés (`.mjs`, hors `tsconfig`). Fonctions pures et refus « images manquantes » : testés (Passe Q2).
- **Code mort mineur** (Passe M5) : des `void x;` qui taisent des paramètres, des types exportés sans usage hors de leur fichier.
- **Archivage du journal** : « Branche fusionnée suffit » (Passe D1, `AGENTS.md` mis à jour). Derniers archivages : H1-H4 (Passe B1), H5-P2
  (Passe D1), H7-D2 (Passe Z2), H9-Z4 (Passe Y4), R2-Y3 (Passe K10), Y4-D7 (Passe N3), K9-H11 (Passe L2), N1-N4 et L0-L1 (Passe L7), L2-L3 (Passe Q4) ; le prochain au-delà d'environ 60 Ko de passes gardées.

## Principes à garder

> Dédoublonnés et regroupés le 18/10 (Passe M3 ; liste précédente : `git show 7086340:JOURNAL.md`). Ce qu'`AGENTS.md` dit déjà n'est pas
> recopié ici.

### Mesure et performances
- Mesurer d'abord, optimiser ensuite : minuteurs GPU, variantes entrelacées dans une seule session, base figée. Relever l'adaptateur
  réellement utilisé (`WEBGL_debug_renderer_info`) dans chaque mesure : un portable hybride rend sur l'iGPU par défaut, quoi que demande
  `powerPreference`. Mesurer à la définition de l'écran de l'opérateur (dpr compris), pas seulement en 1080p.
- Un temps GPU pris sur un poste partagé ne vaut qu'avec son témoin de contention (autres processus sur le même adaptateur) ; à défaut, le
  minimum des tours entrelacés est l'estimation sans contention. La traîne du temps d'image en headless n'est pas une mesure.
- Avant une mesure GPU, fermer l'onglet du jeu que la séance a ouvert dans son panneau navigateur : il rend en arrière-plan sur le même
  adaptateur (Passe R3 : 25 à 42 % d'un processus Chrome étranger, puis 5 tours propres sur 5 une fois fermé).
- Un tour « propre » au seuil du témoin n'est pas un tour sans contention : un programme qui reste juste sous le seuil (Passe Q4 : Firefox à
  13-15 % sous un seuil de 15 %) le charge encore. Un journal complet du témoin pendant la série le dit ; sans tour calme, seule la comparaison
  entrelacée se rapporte, pas les temps absolus.
- Une fenêtre fermée ne prouve pas un programme arrêté : le témoin se relit juste avant la série (Passe Q4b : un Firefox « fermé » tenait encore
  30 % de la 780M).
- Une première fois (programme, variante, dessin) se mesure par une sonde dédiée : aucune moyenne ne la voit. Un intervalle rAF ne
  s'attribue qu'avec un repère (le départ de la boucle, un `gl.finish()` chronométré) : le plus grand intervalle depuis le chargement est le
  plus long bloc synchrone, pas forcément la première image.
- Un mode de jeu ajouté au-dessus d'un contenu figé passe par ses propres paramètres et pages (`?play=1`, les états nommés) ; le chemin par
  défaut se prouve à 0 px à chaque lot qui touche un de ses fichiers, et le jeu neuf se prouve joué de bout en bout puis rejoué en Node
  (même empreinte) (Passes L3 à L6).
- Un contrôle vivant en rendu logiciel (une boucle qui tourne pendant N secondes) se mesure sur `main` avant d'accuser la branche (Passe L6).
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
- Une série de preuves en arrière-plan s'attend jusqu'au bout dans la séance : rendre le tour pendant qu'elle tourne a laissé arrêter ses
  serveurs (Passe Y4). Un « ok » d'outil dont la sortie est jetée ne prouve que son code de sortie : une erreur de page affichée sans échec
  se lit dans la sortie gardée.
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
- Une fiche attend le pont du visualiseur assez longtemps (10 s), relit chaque écriture avant d'afficher « enregistré » et dit l'échec en clair ;
  sa collection se relit dès que l'opérateur la dit remplie (Passes D7, D8).
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
