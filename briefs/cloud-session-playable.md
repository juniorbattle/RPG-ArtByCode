# Plan de la séance cloud « Version jouable » — Cité du Tournoi

- **Version 4, 2026-10-20.** Quatre versions se sont succédé :
  - la version 1 (Passe N1), rédigée par la séance locale de planification avant la fiche d'arbitrages ;
  - la version 2 (Passe N2), qui consigne les choix de l'opérateur au § 11 ;
  - la version 3 (Passe N3), qui ajoute le contrat projet, reçu après la fiche : ses écarts (§ 3b), ses ajouts à la tranche (§ 5) et son
    architecture (§ 6) ;
  - la version 4 (Passe N4) : l'ordinateur local reste allumé, et une séance locale sert de relais (§ 4b).
- **Statut : décidé.** Chaque renvoi « [Xn] » désigne une décision de la fiche (§ 10). Le choix de l'opérateur est au § 11, mot pour mot ; là où
  il diffère de la recommandation du § 10, c'est le § 11 qui fait foi.
- **Autorité.** `AGENTS.md` (règles du dépôt) et `JOURNAL.md` ; les contrats maîtres de l'opérateur, dans `contracts/` (décision C1) :
  - `contracts/GAMEPLAY_MASTER_CONTRACT.md` (v1.0, 2026-10-02) ;
  - `contracts/TOURNAMENT_MASTER_CONTRACT.md` (v1.0, 2026-10-02) ;
  - `contracts/PROJECT_MASTER_CONTRACT.md` (« Version : 1.2 », 2026-10-02), que le contrat de gameplay cite comme son autorité supérieure.
    L'opérateur l'a collé dans la séance (décision C2, Passe N3).
  
  En cas de conflit entre ce plan et l'un de ces documents, le document l'emporte et le conflit est consigné.
- **Base** : `main` `8a707b9` (Passe H11) ; ce plan entre dans `main` en Passe N1 (`7ff0c23`), puis en version 2 en Passe N2.

## 1. But

Les mots de l'opérateur : « nous allons planifier notre grosse session cloud a effectuer des maintenant toujours avec le principe d'avoir une
version jouable en prenant en compte ce que nous avons fait dans la mesure du possible ( cloud n'a pas acces au services externe ) ».

La séance cloud doit livrer une **version jouable** qui fait vivre la boucle canonique du contrat de gameplay (§ 2) sur sa tranche verticale
(§ 13). Elle reprend au mieux le Merchant District, l'arène et les outils de preuve existants, sans aucun service externe.

## 2. L'existant, lu dans le code (`main` `8a707b9`)

### 2.1 La ville (`src/app`, `src/district`, `src/characters`, `src/atmosphere`)
- **Un seul quartier**, le Merchant District, de nuit par défaut. Il est complet et figé depuis la Passe Z4 (décision RJ1), sans être Gold
  Master (RJ3) : tout changement de son contenu, de ses cadrages, de sa distribution ou de son aspect est une nouvelle tâche que décide
  l'opérateur.
- **L'espace praticable** est le quai : x −13,5 → 26, z −3,2 → 4,05 (`WALK`, `StreetComposer.ts`), soit environ 40 × 7 m.
  - Quatre cadrages A / B / C / D (`CameraGraph.ts`), des fondus ancrés, le suivi retenu en D.
  - L'occlusion du joueur (`Occlusion.ts`) et la visibilité cuite (`Visibility.ts`, avec son cache `BakeCache.ts`).
- **Les interactions** (`ActorSystem.interact`) :
  - `E` ou Espace près d'un PNJ « mid » : une bulle « … » et l'animation de parole pendant 2,5 s. **Aucun texte de dialogue.**
  - Près de la forge (ou touche `F`) : le joueur sabote ou répare la forge. Il y a deux états, `NORMAL_FORGE` et `SABOTAGED_FORGE`, et chaque
    bascule reconstruit la géométrie et les lumières de la forge (`App.setForgeState`).
- **Les états du jour** (`?time=morning|midday|afternoon`, `DayState.ts`) ne sont lus **qu'au démarrage**, dans le constructeur d'`App` :
  changer d'état demande un rechargement. La météo (`?rain|snow|storm|wind`) se change en jouant (`App.setWeather`). La foule compte 5
  promeneurs la nuit, et 6 / 12 / 9 le matin, à midi et en fin de journée.
- **Le HUD** (`src/debug/Hud.ts` : titre, mini-carte, invite « [E] Talk ») est en anglais. Le panneau DEV s'affiche par défaut, sauf avec
  `clean=1`.
- **La distribution cuite** (`BakedCast.ts`) : dix PNJ approuvés (le docker, la marchande, le forgeron, deux gardes, l'inconnu encapuchonné,
  cinq citadins) et le héros `hero-x2-v4` (Passe H11). Le chat est généré.

### 2.2 L'arène (`src/arena`, `?scene=arena`)
- **Une scène à part**, chargée à la demande, sans entrée depuis la ville (décision D1 « Plus tard »).
- **Un seul duel** : Ren (avec la palette du héros généré) contre Marek (une IA à séquences). Les deux combattants sont **générés** à densité ×2
  (`FighterArt.ts`), vus de profil.
- **Les règles** (`CombatSim.ts`) sont un port du prototype `arena/arena.html`, prouvé par `tests/arena-sim.test.mjs` et l'empreinte
  `ARENA_SIM_HASH` :
  - **pas d'attente pour agir** : chaque action n'a qu'un temps de charge (léger 0,20 s, lourd 0,50 s) ;
  - des points d'action (5 au plus) ;
  - une garde tenue (−60 % de dégâts, brisée par un coup lourd) ;
  - une esquive (1 PA) dans la fenêtre de réaction de l'ennemi ;
  - quatre techniques avec recharge ;
  - un pas fixe de 1/120 s, déterministe.
- **Le HUD est en français** (`ArenaHud.ts`). L'assistance a trois niveaux (`subtle|full|off`) et les moments scriptés passent par `Presets.ts`
  et `__arena.jump`. Les nombres du combat sont à « Régler après essai » (D1).
- **`CombatSim` reçoit ses données au constructeur** (`CombatData`) ; les identités des combattants sont fixes (`ren` / `marek`).

### 2.3 Tests, CI, outils
- `npm test` : 103 tests (`node --test`, Passe H11), dont l'équivalence de l'arène avec le prototype.
- La CI GitHub (Node 22, `ubuntu-24.04`) lance le typecheck, le build, `art:validate` et les tests.
- **Preuves d'image déterministes** : `tools/detshots.mjs` (graine, pas fixes ; sans GPU, `CHROME_ARGS=--use-angle=swiftshader`, Passe T1).
  Pour l'arène : `tools/arena-scene-check.mjs`.
- Un générateur aléatoire pur, `src/core/rng.ts` (mulberry32, flux nommés par `fork`).
- **Le dépôt GitHub est public** (`juniorbattle/RPG-ArtByCode`) : tout ce qui est versionné est publié.

### 2.4 Ce qui n'existe pas
- un état de partie, des créneaux de temps, une économie, des quêtes, des dialogues écrits ;
- le tournoi : ses concurrents, son tableau, sa simulation hors écran, le `TournamentWorldPulse` ;
- la sauvegarde et le chargement, un menu titre, le passage de la ville à l'arène ;
- d'autres quartiers, le recrutement, une interface de jeu (hors du HUD de debug).

## 3. Écarts avec les contrats — signalés, non tranchés

| # | Contrat | Constat dans le dépôt | Décision liée |
|---|---|---|---|
| E1 | Gameplay § 1 : « combat tour par tour » | L'arène se joue en temps continu : pas d'attente, des temps de charge, une garde tenue, une esquive dans une fenêtre de réaction. Le rapport du prototype (`arena/source/runtime-bakeoff-report.txt`, passe 9) la présente comme le « nouveau design » de l'opérateur, venu après une version « Dynamic Turn-Based » à jauge. | G1 |
| E2 | Gameplay § 13 : « 3 quartiers minimum » ; § 6 : chacun avec une identité, une fonction, des opportunités, des risques, un profil jour / nuit | Un seul quartier, clos et figé | P3, P4 |
| E3 | Gameplay § 4 : trois créneaux (matin ; après-midi ; soirée / nuit) | Quatre états visuels (matin, midi, fin de journée, soir = nuit, décision D6), choisis au démarrage | G2 |
| E4 | Note de l'opérateur (Passe D1) : « jour sera l'etat par defaut […] le deroule du tournoi » | La nuit reste le défaut (J9) | P2 |
| E5 | Tournoi §§ 5, 6, 9, 12, 13 : concurrents persistants, hors écran, pouls de la ville, déterminisme, TournamentLab | Rien de tout cela n'existe | lots L1-L2 (la commande, sans décision) |
| E6 | Tournoi § 6 : les matchs non vus « du même modèle de stats/règles que les combats visibles » | Le modèle visible est `CombatSim`, en temps continu | dépend de G1 |
| E7 | Gameplay § 11 : une défaite non éliminatoire, une campagne jamais perdue sur une erreur | Le format de la phase I n'est pas défini | G3 |
| E8 | Le joueur | La ville montre le héros cuit `hero-x2-v4`, sans images de combat ; l'arène, un Ren généré de profil. Le nom du joueur n'est pas fixé. | K2 (l'art du héros en combat : plus tard, en local, avec Aseprite) |
| E9 | Lisibilité (gameplay § 8, tournoi § 11) | Le HUD de la ville est en anglais, dans `src/debug/` ; celui de l'arène en français | K1 |
| E10 | Hiérarchie des contrats | `PROJECT_MASTER_CONTRACT.md` absent ; contrats hors du dépôt | C1, C2 |
| E11 | Verrous : « décision A3 » | « A3 » n'est défini nulle part dans le dépôt. La Passe A3 du journal, sur l'arène, n'a rien à voir. | C3 |
| E12 | Tournoi : « Tournament Agent », « TournamentLab » | Aucun outil. TournamentLab sera une CLI headless (L2), sans agent. | — |
| E13 | Tournoi § 10 : un festival | Non requis par la tranche du gameplay § 13 | P1 |

## 3b. Écarts avec le contrat projet (reçu après la fiche, Passe N3) — signalés, non tranchés

Ces écarts sont postérieurs à la fiche. Le choix C3 s'y applique : aucun verrou n'est modifié, chaque écart est consigné. Les choix de la
fiche restent en vigueur.

| # | Contrat projet | Constat dans le dépôt | Effet sur la séance |
|---|---|---|---|
| E14 | « Décision canonique », §§ 10.1, 12.1 : la ville en 3D low-poly conçue dans Blender, « source d'autorité spatiale » ; glTF / GLB comme format 3D principal | Tout est généré par le code au démarrage (`AGENTS.md`) ; ni Blender ni glTF dans le dépôt. Le cloud n'a pas Blender. | Aucun asset Blender ; l'écart est consigné |
| E15 | § 15, non-objectif V1 : « génération runtime de la ville » | Le district et l'arène sont générés au démarrage ; le troisième lieu léger (P3) le serait aussi | P3 tel que choisi ; l'écart est consigné |
| E16 | § 1 : « RPG narratif au tour par tour » ; § 6.1 : « Le combat est un RPG tour par tour » | L'arène, sans attente pour agir (E1) | G1 tel que choisi ; l'écart E1 est confirmé par l'autorité supérieure |
| E17 | § 6.1 : un moteur de combat « conçu dès le départ pour supporter plusieurs combattants » ; § 14 : « combat 1v1 complet et extensible vers l’équipe » | `CombatSim` est fixé à deux combattants (`ren` / `marek`) | Choix technique sûr : l'interface de match côté jeu prend des listes de combattants ; l'arène reste 1v1, son empreinte ne change pas |
| E18 | § 14 : une tranche plus large que le gameplay § 13 | Voir les ajouts du § 5 | Ajoutés au périmètre (§ 5) |
| E19 | § 8.2 : le Colisée visible, audible ou suggéré depuis plusieurs quartiers | Le district montre un château sur la colline ; aucun Colisée. Le district est figé. | Suggéré par l'interface et les textes (annonces, clameurs) ; aucun changement du district |
| E20 | § 8.1 : la musique change avec le jour et la nuit ; § 10.4 : `audio/` | Le jeu n'a aucun son | Hors tranche ; l'écart est consigné |
| E21 | § 10.4 : une architecture conceptuelle (`core`, `simulation`, `tournament`, `combat`, `events`, `narrative`, `world`, `rendering`, `ui`, `audio`, `tools`) | `src/` suit ses propres dossiers (`app`, `district`, `characters`, `atmosphere`, `arena`…) | Choix technique sûr : le code neuf suit le § 10.4 ; les dossiers existants ne bougent pas (§ 6) |
| E22 | § 10.3 : des hooks de test pour charger des états nommés | Aucun | Ajouté au lot L1 |
| E23 | § 11.3 : chaque tâche autonome déclare son contrat (objectif, entrées, fichiers autorisés, éléments interdits, outputs, critères d'acceptation, tests, risques, définition de terminé) | Les lots du plan ont un contenu, des preuves et une fin | Chaque lot écrit son contrat de tâche en tête de sa passe (§ 7) |
| E24 | § 16 : une fonctionnalité finie « respecte le budget de performance » | Le cloud n'a pas de GPU | Des compteurs dans le cloud ; le budget est mesuré en local, après la séance (§ 12) |
| E25 | En-tête « Version : 1.2 », dernière ligne « PROJECT MASTER CONTRACT v1.1 » | — | Consigné tel quel, non corrigé |

La « décision A3 » des deux autres contrats n'est pas définie dans le contrat projet non plus. Son § 0 dit qu'« une modification d'un verrou
majeur doit être explicite, documentée dans un journal de décision et validée avant implémentation », ce qui rejoint C3.

Le § 4 (dix journées) place le deuxième match au jour 4. Ici, la tranche de trois jours met ses deux duels aux jours 2 et 3, comme le demande
son § 14 (« 3 jours, 9 créneaux et 2 combats officiels »).

## 4. Contraintes de la séance cloud (reprises dans le brief)

- **Aucun service externe dans le cloud.** Ni clé OpenAI ni clé MiniMax (`.env.local` n'est pas dans le dépôt), pas de web. Les images passent
  par le relais local (§ 4b).
- **Pas d'Aseprite dans le cloud.** Les nouveaux personnages passent d'abord par le générateur procédural du code (`SpriteGenerator.ts`,
  `FighterArt.ts`). Une feuille cuite se demande au relais ; elle reste candidate jusqu'à l'approbation de l'opérateur.
- **Pas de GPU dans le cloud.**
  - Aucune mesure de temps dans le cloud : SwiftShader ne sert qu'aux preuves d'image déterministes et aux compteurs (Passe T1). Les temps GPU
    se demandent au relais.
  - La présence de Chrome se vérifie au départ. En Passe T1, c'était le Chromium de Playwright, préinstallé, lancé par un enveloppeur hors
    dépôt avec `--no-sandbox` ; il fallait 154 s pour démarrer en 1280 × 720, dont 136 s de bake, et 25 s avec `vis=0`.
- **Personne à qui demander pendant la course.** L'ordinateur local reste allumé (§ 4b), mais l'opérateur ne répond pas à la séance cloud.
  - Le brief interdit de s'arrêter pour demander ou pour attendre.
  - Les décisions réservées à l'opérateur sont préparées, jamais prises :
    - les approbations de production d'un art ;
    - le Gold Master ;
    - le jour par défaut (J9) ;
    - tout changement du district clos ;
    - les cadrages A / B / C / D ;
    - les installations ;
    - les verrous des contrats (« décision A3 »).
  - Toute autre décision technique : l'option la plus sûre, consignée au journal comme **choix de la séance**, avec ses raisons.
- **Les règles Git d'`AGENTS.md`.**
  - Une seule branche de travail à la fois ; chaque commit poussé ; l'entrée du journal, en français, dans le même commit.
  - La validation (typecheck, `npm test`, build, `art:validate` et les preuves du lot) ouvre la fusion en avance rapide dans `main`.
  - Avant chaque commit, une analyse des secrets et des chemins machine. Jamais de force-push.
  - Le proxy de la séance cloud impose un seul nom de branche et refusait de supprimer la branche distante (Passes T1, H6). On fait donc une
    tâche à la fois sous ce nom, fusionnée, puis on recrée la branche depuis `main`.
- **Le jeu reste jouable après chaque fusion.**
  - `npm run dev` et le build marchent.
  - L'opérateur a choisi un écran titre par défaut [P2], qui propose « New game » ou « Explore the district » (§ 6).
    - « Explore the district » donne exactement le jeu de `8a707b9`.
    - Toute adresse qui porte déjà des paramètres (tous les outils et toutes les preuves) donne, elle aussi, le jeu de `8a707b9`, sans écran
      titre.
    - L'écran titre n'arrive dans le défaut qu'une fois que « New game » mène à au moins une journée complète (lot L4).
  - La nuit reste le moment par défaut quand on explore le district (J9).
  - `?scene=arena` sans paramètre de jeu reste inchangé : même `ARENA_SIM_HASH`, équivalence au prototype verte.

## 4b. Le relais local (Passe N4)

L'opérateur, mot pour mot : « Excellent, l'ordi local sera finalement ouvert donc session cloud poura communiquer avvec toi pour utiliser les outils externes comme aseprite ou open ai key ».

- **La séance locale de planification sert de relais** pour ce que le cloud n'a pas : Aseprite et `build-character`, la clé OpenAI
  (`gen-image.mjs`, une tâche `cloud-playable` plafonnée à 5 $ pour toute la séance), et le GPU de l'opérateur (`perf.mjs`, `cadence.mjs`,
  `startup.mjs`, les preuves de visibilité sur GPU).
- **Une séance cloud ne peut envoyer de message à aucune séance.** La séance locale, elle, peut lui en envoyer et lire son transcript. Le
  sens cloud → local passe donc par le dépôt.
- **Le protocole** (brief § 3b) :
  1. le cloud pousse une requête `briefs/local-requests/NNN-<sujet>.md` sur sa branche, puis continue son travail ;
  2. la séance locale surveille ses branches `claude/*` toutes les deux minutes environ ;
  3. elle exécute la requête et écrit la réponse dans le même fichier ;
  4. elle pousse ses propres commits au-dessus de la branche du cloud ;
  5. elle prévient le cloud par message ;
  6. le cloud tire sa branche (`git pull --rebase`, jamais de force-push) et intègre le résultat. Une requête sans réponse applique son repli.
- **Le relais ne prend aucune décision réservée.** Une feuille cuite reste candidate, une image reste non canonique, et rien n'est fusionné
  dans `main` par le relais. Si l'opérateur tranche une décision pendant la séance, la séance locale la transmet, citée mot pour mot.

## 5. Périmètre proposé de la version jouable [P1]

La tranche verticale du gameplay § 13, ramenée à ce que permet le cloud :

| Exigence § 13 | Ce que la tranche en fait | Ce qu'elle réutilise |
|---|---|---|
| 3 jours jouables | Jours 1 à 3, trois créneaux chacun, puis un écran de fin « à suivre » | `src/core/rng.ts` |
| 3 quartiers minimum | Recommandé [P3] : le district (exploration, services) ; le parvis de l'arène (inscription, entraînement, observation d'un rival) ; un troisième lieu léger, bâti avec les générateurs existants (un cadrage fixe, sans bake) | le district, `ArenaScene`, `BuildingGenerator`, `PropGenerator` |
| Alternance jour / nuit fonctionnelle | Chaque créneau a son état visuel [G2], et le passage se fait par un rechargement avec sauvegarde | `DayState`, `?time=` |
| 2 duels 1v1 officiels | L'arène pilotée par une fiche de match ; un second adversaire généré dans la grammaire de `FighterArt` | `CombatSim`, `ArenaApp`, `FighterArt` |
| 1 futur recrutable introduit | Un concurrent qui reste en ville après sa défaite (tournoi § 8), avec des faits et une relation ; recrutable plus tard | `CompetitorState` |
| 1 quête influençant un combat | Par exemple « La cargaison d'acier » pour le forgeron : une lame améliorée au duel 2. Ou l'observation d'un rival, qui révèle son style au duel. | données du match |
| 1 sabotage contrable | La forge, dont l'état `SABOTAGED_FORGE` existe. Au moins deux des leviers du gameplay § 9 : des indices, la prévention, la mitigation, l'identification de l'auteur. | `ForgeGenerator`, `setForgeState` |
| 1 service urbain modifié par une conséquence | La forge fermée ou réparée, avec une alternative conçue (la marchande, plus chère) (gameplay § 10) | la marchande, le forgeron |
| Concurrents qui avancent hors écran | Une activité par créneau ; des matchs simulés ; un tableau lu chaque matin | `CombatSim` (même modèle) |
| Sauvegarde / chargement | JSON versionné, dans `localStorage` et en fichier | — |
| Simulation headless déterministe | `node --test` et `tools/tournament-lab.mjs` | `tests/load.mjs` |

**Ajouts du contrat projet § 14** (Passe N3). Ils entrent dans le périmètre, puisque le contrat projet fait foi :

| Exigence du contrat projet § 14 | Ce que la tranche en fait |
|---|---|
| 3 jours, 9 créneaux, 2 combats officiels | Déjà au tableau ci-dessus |
| Plusieurs rivaux persistants minimum | Les sept concurrents de la poule (G3), persistants et hors écran |
| Combat 1v1 complet et extensible vers l’équipe | L'arène actuelle (G1) ; l'interface de match côté jeu prend des listes de combattants (E17) |
| Boutique affectée par une conséquence | La boutique de la marchande : prix et stock changent par une cause nommée (la forge sabotée, une pénurie) |
| Au moins 12 événements dynamiques configurables | `src/events/` : douze définitions au moins, en données (conditions, effets, cause, signes, réponses), des six types du § 9.1 |
| Une chaîne de sabotage contrable | La forge, déclenchée par des conditions (§ 3.4 : favori, rival hostile, sécurité faible) plutôt qu'à date fixe, avec des signes |
| Navigation et streaming / changement de quartier | La carte de la ville et le passage entre les trois lieux (P3), sans coût de créneau |
| Captures desktop et mobile | Des captures `detshots` en 1280 × 720 et à la taille d'un téléphone, en portrait et en paysage. Le jeu au toucher est hors tranche. |
| Budget technique mesuré | Dans le cloud, des compteurs (appels de dessin, triangles, coût de `advance` en Node, à titre indicatif) ; les temps GPU par le relais local, sur la 780M de l'opérateur (§ 4b), aux lots L4 et L7 |
| Le jour et la nuit qui modifient les possibilités (§ 8.1) | Les services, les présences actives et la sécurité changent avec le créneau (le forgeron ferme la nuit, l'inconnu ne parle que la nuit…) |

**Hors tranche** :
- le combat d'équipe (non requis par § 13) ; les phases II et III, seulement préparées dans les données ;
- le festival (tournoi § 10) [P1] ;
- le recrutement effectif (seulement introduit) ;
- tout personnage cuit nouveau ; l'art du héros en combat.

## 6. Architecture proposée (choix techniques de la séance, dans ce cadre)

- **Un cœur pur, rangé selon l'architecture du contrat projet** (§ 10.4, écart E21). Les dossiers existants ne bougent pas.
  - `src/simulation/` : l'état, `advance`, la sauvegarde.
  - `src/tournament/` : la poule, les concurrents, le hors écran, le pouls.
  - `src/combat/` : la fiche de match et l'adaptateur de `CombatSim`.
  - `src/events/` : les événements configurables.
  - `src/narrative/` : le contenu et les textes.
  
  Ces modules n'importent ni `three`, ni le DOM, ni `Math.random`, ni `Date.now`, ni `performance.now` ; un test parcourt leurs fichiers et
  échoue sur ces noms. L'interface (`src/ui/`) et le passage aux scènes restent à part.
  - `GameState` porte un `schemaVersion`.
  - `CompetitorState` reprend **exactement** l'interface du tournoi § 5 ; un `TeamState` agrégé est seulement typé.
  - `TournamentState`.
  - `WorldPulse` porte les huit champs du tournoi § 9.
  - Les services (`ServicesState`, la forge ouverte, sabotée ou fermée) et les quêtes.
  - Un journal d'événements, chacun avec sa cause (gameplay § 14, verrou 8).
- **Ses fonctions** : `newGame(seed, content)`, `actions(state)`, `advance(state, action, rng) → { state, events }` (contrat projet § 10.2),
  `endSlot(state)` (le hors écran et le pouls), `applyMatchResult`, `serialize`, `deserialize` et `hash`.
  - Les états nommés (§ 10.3), par exemple « day2-morning-favourite » ou « forge-sabotaged », servent aux tests, au laboratoire et à
    `?state=<nom>` (DEV).
  - Une action mineure (parler, consulter, se déplacer dans un quartier) ne consomme aucun créneau (gameplay § 4.2).
  - Choisir un quartier n'en consomme pas non plus.
- **L'aléatoire** : le `Rng` de `src/core/rng.ts`, en flux dérivés de (graine, jour, créneau, acteur). Une partie reprise d'une sauvegarde
  donne donc la même suite qu'une partie continue.
- **Le contenu en données** : `src/narrative/` (concurrents, quêtes, services, textes **en anglais** [K1]).
- **La présentation.**
  - **L'écran titre par défaut** [P2] : « New game », « Explore the district », et « Continue » quand une sauvegarde existe (sauvegarde et
    chargement, § 13).
    - C'est un écran DOM, affiché avant toute génération, dans le style de l'écran de chargement. Il ne paraît que sur l'adresse nue.
    - Une adresse qui porte déjà des paramètres démarre comme dans `8a707b9`. Les outils et les preuves n'en sont donc pas touchés ; chaque
      outil de `tools/` qui charge l'adresse nue est vérifié et adapté.
    - `?title=0` saute l'écran titre, `?title=1` le force (pour ses propres captures).
    - « Explore the district » lance le chemin de la ville d'aujourd'hui (`startTown`) tel quel : la nuit et le panneau DEV.
  - **« New game » demande le nom du joueur** [K2], puis lance le mode jouable. Le nom vit dans l'état de la partie ; l'arène l'affiche à la
    place de « Ren » en mode jouable. Une proposition par défaut dans le champ est un choix de la séance.
  - **`?play=1`** saute l'écran titre et entre en mode jouable : c'est l'entrée des outils et des preuves (`&name=` pour le nom).
  - **Une couche d'interface DOM, `src/ui/`, en anglais** [K1] : horloge, prochaine échéance, tableau du tournoi (tournoi § 11),
    dialogues, journal des faits, menu de sauvegarde.
    - En mode jouable, l'arène prend des libellés anglais par une table de textes.
    - `?scene=arena` seul garde son HUD français, au pixel près.
    - Le HUD de debug de la ville est déjà en anglais et ne change pas.
  - **La ville (`App`) et l'arène (`ArenaApp`)** gardent leur chemin hors du mode jouable.
  - On passe d'une scène à l'autre, et d'un état du jour à l'autre, par une sauvegarde puis un rechargement de page. Pas de changement à chaud
    de l'état du jour dans cette séance : il toucherait la nuit figée.
- **Le combat** : une fiche de match devient une variante de `CombatData` (adversaire, modificateurs du joueur, assistance). `COMBAT_DATA`
  et `ARENA_SIM_HASH` ne changent pas.
- **Le hors écran** : une résolution simplifiée, tirée des mêmes nombres. Un test la confronte à des combats complets dans `CombatSim`, un bot
  contre l'IA, sur N graines (tournoi § 6 : « du même modèle »).
- **Les outils** :
  - `tools/tournament-lab.mjs`, une CLI headless ;
  - `window.__game`, une API de pilotage pour les preuves (des actions, pas des touches) ;
  - des captures de l'interface avec `tools/detshots.mjs`.

## 7. Lots, dans l'ordre

Chaque lot suit le même cycle :
1. une branche ;
2. son travail ;
3. une passe au journal, dans le même commit ;
4. la validation : typecheck, `npm test`, build, `art:validate` et les preuves du lot ;
5. la fusion en avance rapide dans `main`.

**Le contrat de tâche** (contrat projet § 11.3, écart E23) : chaque lot commence par l'écrire, en tête de sa passe du journal. Il donne
l'objectif, les entrées, les fichiers autorisés, les éléments interdits, les outputs, les critères d'acceptation, les tests, les risques et
la définition de terminé (contrat projet § 16 : déclenchable dans le jeu réel, testé, sans erreur, preuve visuelle, reproductible,
documentation à jour ; le budget de performance est mesuré en local).

L'ordre met d'abord ce qui se prouve sans navigateur. Si la séance s'arrête en route, `main` garde des morceaux cohérents et jouables.

**Preuve « jeu par défaut inchangé » (PD)**. Elle vaut à chaque lot qui touche un fichier atteint par une adresse à paramètres, par « Explore the
district » ou, avant l'écran titre, par l'adresse nue :
- `detshots` contre une copie figée de `main`, servie sur un autre port, au **seuil 0** ;
- un témoin de répétition d'abord (deux chargements, 0 px) ;
- nuit : A, B, C, D, `static=1&occ=0`, 30 pas ; les quatre références avec personnages, 120 pas ;
- midi en B ;
- `tools/arena-scene-check.mjs` sans paramètre de jeu ;
- sortie gardée et relue (principe de la Passe Y4) ;
- dès l'écran titre : un test qui montre que « Explore the district » appelle le chemin de la ville d'aujourd'hui, sans autre paramètre ; et une
  capture qui passe par l'écran titre et ce bouton, égale à 0 px à l'adresse nue de `main` figé.

**Sans Chrome**, aucune preuve d'image n'est possible. Le lot ne modifie alors aucun fichier atteint par le chemin par défaut, hors une branche
gardée par le paramètre ou par l'écran titre. Il le montre (`git diff --stat`, et un test qui vérifie que le chemin par défaut n'importe aucun module du jeu), et la
preuve d'image est inscrite au bilan comme à refaire en local.

### L0 — Mise en route
- **Contenu** :
  - `npm ci` ; typecheck ; `npm test` ; build ; `art:validate` ; `art:doctor` (Aseprite absent, attendu).
  - Détection de Chrome, son enveloppeur hors dépôt, une capture de fumée de `main` et son témoin de répétition.
  - La lecture des trois contrats de `contracts/` (décisions C1, C2).
  - La requête `000-handshake` au relais local (§ 4b), qui éprouve le canal dans les deux sens.
  - L'archivage du journal si les passes gardées dépassent environ 60 Ko (environ 39 Ko au départ, après l'archivage de la Passe N3), avec les huit contrôles de la
    Passe D1.
- **Fin** : l'environnement est consigné dans la première passe de la séance (machine, Node, navigateur, temps de démarrage logiciel).

### L1 — Cœur de jeu headless (`src/simulation/` et ses voisins)
- **Contenu** :
  - l'état, les actions, les créneaux, le journal causal ;
  - la sauvegarde et le chargement (JSON stable, version de schéma, migration vide), l'empreinte ;
  - les états nommés (contrat projet § 10.3) ;
  - le test de pureté.
- **Preuves** (`tests/game-core.test.mjs`) :
  - la même graine et le même script d'actions donnent la même empreinte, sur trois graines au moins ; deux graines divergent ;
  - une sauvegarde à chaque créneau, rechargée puis poursuivie, égale la partie continue ;
  - une action mineure ne coûte aucun créneau, une action importante en coûte un, une action invalide est refusée sans toucher l'état ;
  - au moins trois fautes injectées, attrapées, fichiers rendus à l'octet.
- **Fin** : tests verts ; le chemin par défaut n'importe aucun module du jeu ; PD si un fichier du défaut change.

### L2 — Tournoi, phase I, et TournamentLab
- **Contenu** :
  - huit concurrents (le joueur et sept autres), chacun avec un profil de combat traduit en nombres de `CombatData` ;
  - le format de la phase I [G3] ;
  - les activités hors écran (tournoi § 6 : s'entraîner, acheter, se soigner, espionner, saboter…), choisies par tirage pondéré selon les
    objectifs et les relations ;
  - les rivalités fondées sur des faits (tournoi § 7) ;
  - les éliminés qui restent dans l'état (tournoi § 8) ;
  - le pouls de la ville (§ 9) après chaque créneau ;
  - `src/events/` : au moins douze événements configurables (contrat projet §§ 9, 14), chacun déclenché par ses conditions, avec sa cause ;
    pour un événement majeur, des signes et des réponses (§ 9.3) ;
  - `tools/tournament-lab.mjs` (tournoi § 13). Il charge un état ou une sauvegarde, accélère N jours et inspecte les concurrents. Il compare
    des graines et repère les participants oubliés (aucun événement depuis un jour). Il mesure la fréquence des éliminations et des blessures,
    et dit que la transition vers l'équipe est hors tranche. Sortie en texte et en `--json`.
- **Preuves** :
  - le laboratoire reproductible (deux passages identiques sur 50 graines) ;
  - aucun participant oublié ;
  - la résolution simplifiée d'accord avec les combats complets bot contre IA, dans une tolérance écrite à l'avance ;
  - des fautes injectées.
- **Fin** : tests verts en quelques secondes ; le laboratoire tourne aussi dans `npm test`, sur un petit nombre de graines.

### L3 — Le duel officiel : l'arène pilotée par le jeu
- **Contenu** :
  - la fiche de match : l'adversaire, l'équipement ou la blessure du joueur, l'information obtenue (par exemple l'assistance `full` ou le
    schéma de combo révélé) ;
  - un second adversaire généré (`FighterArt`, ×2), Marek gardé ;
  - le résultat rendu au jeu : victoire ou défaite, PV perdus → blessure, réputation, faits de rivalité ;
  - l'aller et le retour ville → arène → ville, par sauvegarde et rechargement.
- **Preuves** :
  - les deux duels, gagnés et perdus, par des entrées scriptées (`__arena`), avec leur résultat appliqué à l'état ;
  - la sauvegarde rechargée de part et d'autre du changement de scène ;
  - `ARENA_SIM_HASH` inchangé, l'équivalence au prototype verte ;
  - le PD de l'arène ; les captures du nouvel adversaire (SwiftShader).
- **Fin** : les deux duels se jouent de bout en bout en headless.

### L4 — La ville jouable (le Merchant District en mode jouable), puis l'écran titre
- **Contenu** :
  - l'interface de jeu en anglais [K1] : jour et créneau, prochaine échéance, tableau (phase, prochain adversaire, rivaux en course,
    conséquence d'une défaite, quand et pourquoi le format change), dialogues écrits, journal des faits, menu ;
  - le nom choisi par le joueur [K2] ;
  - **l'écran titre par défaut** [P2], dès que « New game » mène à une journée complète, comme le décrit le § 6 ;
  - les PNJ existants dans des rôles de jeu [P4] : la marchande (boutique, rumeurs), le forgeron (amélioration, service sabotable), les gardes
    (sécurité, guet), l'inconnu (indices, suspect), le docker (une quête), les citadins (rumeurs selon le pouls) ;
  - la réaction visible de la ville (gameplay § 8, sans écran de debug) : l'effectif de la foule selon l'excitation, l'état de la forge, les
    rumeurs ;
  - ni le panneau DEV ni le HUD de debug en mode jouable.
- **Preuves** :
  - le PD : chaque adresse à paramètres, et « Explore the district », à 0 px ;
  - l'écran titre sur l'adresse nue ; ses trois boutons, et « Continue » absent sans sauvegarde ;
  - des captures du mode jouable à chaque créneau, sur ordinateur et à la taille d'un téléphone (portrait et paysage, contrat projet § 14) ;
  - le jour 1 joué de bout en bout par `__game`, et une fumée au clavier (`E` sur la marchande) ;
  - la sauvegarde reprise après un rechargement.
- **Fin** : le jour 1 se joue dans la ville, depuis l'écran titre.

### L5 — Le contenu des trois jours
- **Contenu** :
  - le déroulé des trois jours :
    - jour 1 : l'arrivée, l'inscription, le premier rival, la quête, le futur recrutable ;
    - jour 2 : le duel 1, puis des indices et la menace sur la forge le soir ;
    - jour 3 : la forge sabotée ou sauvée (le service modifié), le duel 2, la réaction de la ville, la fin de tranche ;
  - l'échec qui ouvre des réponses (gameplay § 11) : la défaite [G3], la blessure suivie de soin ou de repos ;
  - la boutique affectée par une conséquence ; la chaîne de sabotage déclenchée par des conditions ;
  - les services et les présences qui changent avec le jour et la nuit (contrat projet § 8.1) ;
  - le Colisée suggéré par les annonces et les clameurs (§ 8.2).
- **Preuves** :
  - trois parties scriptées complètes (« prévoyante », « négligente », « perdante ») jusqu'à l'écran de fin ;
  - un test qui coche chaque exigence du gameplay § 13 et du contrat projet § 14 à partir des événements ;
  - le déterminisme ; la sauvegarde à chaque créneau.
- **Fin** : les listes du gameplay § 13 et du contrat projet § 14 sont cochées par le test (le budget GPU excepté, mesuré en local).

### L6 — Les autres lieux [P3]
- **Contenu** :
  - le parvis de l'arène, rendu praticable hors du combat ;
  - un troisième lieu léger, avec un cadrage fixe, sans bake, bâti avec les modules du district ;
  - le passage d'un lieu à l'autre par une carte de la ville (sans coût de créneau) ;
  - les activités de L5 déplacées dans leur lieu.
- **Preuves** : le PD ; des captures de chaque lieu à chaque état ; la partie scriptée de L5 toujours verte.
- **Fin** : trois lieux praticables (ou le nombre décidé).

### L7 — Finition et bilan
- **Contenu** :
  - la lisibilité, le clavier et le focus (écran titre compris) ;
  - la relecture des textes anglais ;
  - les compteurs du budget technique (appels de dessin, triangles par lieu et par écran ; le coût de `advance` en Node) ;
  - une passe de bilan au journal, comme la Passe B1 : ce qui est fusionné, les mesures, ce qui reste à vérifier sur la machine de
    l'opérateur, les décisions préparées, le reste à faire.
- **Fin** : le bilan est fusionné, et le dernier message de la séance le résume.

## 8. Ce qui est réutilisé

| Existant | Usage dans la version jouable |
|---|---|
| Merchant District : rendu, cadrages, occlusion, visibilité, distribution cuite | Le quartier principal, inchangé ; on ajoute des couches de jeu [P4] |
| `DayState`, `?time=`, la foule du jour, le pavois | Les créneaux du jour [G2] |
| `Weather` | La météo d'un jour (option de contenu) |
| `ForgeGenerator`, `setForgeState` | Le sabotage contrable et le service modifié |
| `ActorSystem.interact`, la bulle de parole | Le point d'entrée des dialogues écrits |
| `CombatSim`, `ArenaApp`, `ArenaHud`, `FighterArt`, `Presets` | Les duels officiels, le second adversaire, la résolution hors écran |
| `src/core/rng.ts` | L'aléatoire du cœur de jeu |
| `tests/load.mjs`, `node --test`, la CI | Les tests du cœur et du laboratoire |
| `tools/detshots.mjs`, `tools/arena-scene-check.mjs` | Le PD et les captures |
| Le protocole cloud des images (`AGENTS.md`) | Une requête écrite si un visuel manque |

## 9. Risques

| Risque | Parade |
|---|---|
| Pas de Chrome dans le conteneur | Le mode « sans image » du § 7 ; les preuves d'image sont inscrites comme à refaire en local |
| SwiftShader lent (154 s de démarrage avec le bake en Passe T1) | Peu de poses ; `vis=0` pour les captures du mode jouable, jamais pour le PD |
| Ni ressenti ni équilibrage sans joueur humain | Des bots et des nombres provisoires ; le réglage de l'opérateur après essai (D1) ; le bilan le dit |
| Le volume de contenu (textes, quêtes) et la qualité du troisième lieu | La tranche minimale d'abord (L5 avant L6) ; les lieux légers sont annoncés comme tels |
| Fuites de non-déterminisme (`Math.random`, horloge, objets THREE) | Le test de pureté des modules du jeu ; des empreintes |
| Changer le district figé ou l'arène sans le vouloir | Le PD à 0 px ; l'empreinte de l'arène |
| L'écran titre par défaut bloque un outil ou une preuve qui charge l'adresse nue (`__app` jamais créé) | L'écran titre seulement sur l'adresse nue ; `?title=0` ; chaque outil de `tools/` vérifié avant la fusion qui l'active |
| Le proxy Git (un nom de branche imposé, pas de suppression distante) | Une tâche à la fois sous ce nom (Passes T1, H6) |
| Le journal au-delà d'environ 60 Ko | Archivage avec ses huit contrôles (L0 ou en route) |
| Un contexte compacté pendant une longue séance | Relire ce plan, `AGENTS.md` et les dernières passes du journal après chaque compactage |
| Dépôt public | Les contrats et les textes sont publiés une fois versionnés [C1] |
| L'autorité supérieure absente (`PROJECT_MASTER_CONTRACT.md`) | Un conflit entre documents est consigné, jamais tranché |
| Des sauvegardes rendues invalides par une version suivante | `schemaVersion` et un refus lisible ; la migration plus tard |
| Le relais local lent ou indisponible (machine en veille, séance arrêtée) | Une requête ne bloque jamais ; chacune porte son repli ; le bilan liste les requêtes et leur statut |
| Deux séances qui poussent sur la même branche | Le relais pousse seulement ses propres commits, au-dessus ; le cloud tire avant de pousser et avant chaque fusion ; jamais de force-push |

## 10. Décisions préparées pour l'opérateur (fiche d'arbitrages)

Ces décisions ont été posées sur la fiche le 2026-10-20, chacune avec sa recommandation (entre parenthèses ci-dessous) ; le détail est sur la
fiche. **Les choix de l'opérateur sont au § 11.**

- **C1** — Où ranger les deux contrats (et le contrat projet) dans le dépôt, qui est public ? (`contracts/` à la racine, cité par `AGENTS.md`.)
- **C2** — `PROJECT_MASTER_CONTRACT.md` : le fournir, ou avancer sans lui ? (Le fournir avant le lancement ; sinon, avancer sans lui en
  consignant les conflits.)
- **C3** — Les verrous et la « décision A3 » : que désigne A3, et comment la séance les traite-t-elle ? (Aucun verrou modifié, chaque écart
  consigné ; A3 défini par l'opérateur.)
- **P1** — Le périmètre de la tranche. (Le § 13 entier, ramené au cloud, comme au § 5 ; pas de festival.)
- **P2** — Le démarrage : la version jouable par défaut, ou derrière un paramètre ? (Derrière `?play=1`, le jeu par défaut inchangé.)
- **P3** — Le nombre de quartiers. (Trois lieux : le district, le parvis de l'arène, un troisième lieu léger.)
- **P4** — Ce que le mode jouable peut ajouter au district clos. (Des couches de jeu seulement : interface, dialogues, rôles des PNJ existants,
  états de la forge et du jour ; ni géométrie, ni cadrage, ni distribution, ni aspect.)
- **G1** — Le modèle de combat. (L'arène actuelle pour la tranche, l'écart E1 consigné, le contrat inchangé.)
- **G2** — Les créneaux et les états visuels. (Matin → `morning`, après-midi → `midday`, soirée / nuit → la nuit ; la fin de journée comme
  transition au retour d'un duel.)
- **G3** — Le format de la phase I dans la tranche. (Une poule à points : une défaite coûte, mais n'élimine pas.)
- **K1** — La langue de l'interface. (Le français.)
- **K2** — Le joueur. (« Ren », le nom du prototype, provisoire.)
- **K3** — Les rivaux en ville. (Des portraits et des dialogues, sans nouveau sprite en ville.)
- **S1** — Si tout est fait avant la fin de la séance. (Finition et robustesse, puis le bilan ; aucune extension de périmètre.)

## 11. Décisions consignées

**Source.** La fiche d'arbitrages, page privée https://claude.ai/artifact/RvECCuX3UHykYMbnPzctY7, collection `decisions`, relue le
2026-10-20 : 14 documents sur 14, cliqués entre 07 h 35 et 07 h 42 UTC, sans aucune note. L'opérateur a ensuite écrit dans la séance, mot pour
mot : « La fiche d'arbitrages est remplie : relis mes choix, consigne-les et écris le brief final. »

**Les choix** (« = » : la recommandation de la fiche est suivie ; « ≠ » : le choix diffère, et c'est lui qui fait foi) :

| # | Décision | Choix de l'opérateur, mot pour mot | |
|---|---|---|---|
| C1 | Où ranger les deux contrats maîtres dans le dépôt ? | « contracts/ à la racine (versionnés, donc publiés) » | = |
| C2 | `PROJECT_MASTER_CONTRACT.md` | « Je le fournis avant le lancement » | = |
| C3 | Les verrous des contrats et la « décision A3 » | « Aucun verrou modifié, écarts consignés » | = |
| P1 | Le périmètre de la tranche | « Le § 13 entier, ramené au cloud (plan § 5) » | = |
| P2 | La version jouable démarre-t-elle par défaut ? | « Un écran titre par défaut : Nouvelle partie ou Explorer le district » | ≠ |
| P3 | Combien de quartiers dans la tranche ? | « Trois lieux, dont un léger » | = |
| P4 | Ce que le mode jouable peut ajouter au district figé | « Couches de jeu seulement » | = |
| G1 | Le modèle de combat | « L'arène actuelle, écart consigné » | = |
| G2 | Les trois créneaux et les quatre états du jour | « Matin, midi, nuit ; la fin de journée en transition » | = |
| G3 | Le format de la phase I dans la tranche | « Poule à points » | = |
| K1 | La langue de l'interface du jeu | « Anglais » | ≠ |
| K2 | Le nom du joueur | « Un nom choisi par le joueur » | ≠ |
| K3 | Les rivaux en ville | « Portraits et dialogues » | = |
| S1 | Si tout est fait avant la fin de la séance | « Finition, puis le bilan » | = |

**Ce que les trois choix « ≠ » changent dans ce plan** (version 2) :
- **P2**, l'écran titre par défaut :
  - § 4 et § 6 : l'écran titre sur l'adresse nue seulement ; « Explore the district » et toute adresse à paramètres donnent le jeu de
    `8a707b9` ; `?play=1` pour les outils ; `?title=0|1`.
  - Lot L4 : l'écran titre arrive dans le défaut dès qu'une journée complète se joue.
  - § 7 : le PD passe aussi par l'écran titre.
  - Le district et la nuit restent ce qu'ils sont quand on l'explore (J9, RJ1).
- **K1**, l'anglais : l'interface et les textes du mode jouable sont en anglais, l'arène y compris en mode jouable. `?scene=arena` seul garde son
  HUD français. Le journal, les contrats et ce plan restent en français.
- **K2**, le nom choisi : « New game » demande le nom du joueur ; l'arène l'affiche en mode jouable.

**Le contrat projet** (C2) : collé par l'opérateur dans la séance après la fiche, versionné tel quel dans `contracts/PROJECT_MASTER_CONTRACT.md`
(Passe N3). Ses écarts sont au § 3b, ses ajouts au § 5 ; aucun choix de la fiche n'est changé.

**L'ordinateur local reste allumé** (Passe N4). L'opérateur a écrit, mot pour mot, « Excellent, l'ordi local sera finalement ouvert donc session cloud poura communiquer avvec toi pour utiliser les outils externes comme aseprite ou open ai key ». La séance locale sert de relais (§ 4b). Aucun
choix de la fiche ne change.

**Ce qui reste à l'opérateur avant le lancement** : dire « go ».

**Écarts consignés, non tranchés** (C3, G1) :
- E1, le combat « tour par tour » du contrat contre l'arène sans attente : la tranche se joue avec l'arène actuelle, et le contrat ne change
  pas.
- Tout autre écart que la séance rencontre se consigne au journal, sans toucher aux verrous.

## 12. Après la séance : à faire sur la machine de l'opérateur

- **Jouer** la version jouable : le ressenti, l'équilibrage des duels (« Régler après essai »), la lisibilité.
- **Reprendre** les requêtes que le relais n'aura pas pu traiter, avec les mesures GPU qui manqueraient.
- **Approuver ou non** les feuilles cuites et les images candidates (manifestes).
- **Arbitrer** les décisions préparées et listées au bilan.
