# Plan de la séance cloud « Version jouable » — Cité du Tournoi

- **Version 1, 2026-10-20.** Rédigée par la séance locale de planification (journal, Passe N1), avant la fiche d'arbitrages.
- **Statut : proposé.** Chaque renvoi « [Xn] » désigne une décision de l'opérateur, posée sur la fiche (§ 10). Les choix seront consignés au
  § 11 et au journal **avant** l'écriture du brief final et le lancement.
- **Autorité.** `AGENTS.md` (règles du dépôt) et `JOURNAL.md` ; les deux contrats maîtres de l'opérateur :
  - le contrat de gameplay (*Gameplay Master Contract* v1.0, 2026-10-02) ;
  - le contrat du tournoi (*Tournament Master Contract* v1.0, 2026-10-02).
  
  Ils ne sont pas encore dans le dépôt [C1]. `PROJECT_MASTER_CONTRACT.md`, que le contrat de gameplay cite comme son autorité supérieure, est
  absent [C2]. En cas de conflit entre ce plan et l'un de ces documents, le document l'emporte et le conflit est consigné.
- **Base** : `main` `8a707b9` (Passe H11).

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

## 4. Contraintes de la séance cloud (reprises dans le brief)

- **Aucun service externe.**
  - Ni clé OpenAI ni clé MiniMax (`.env.local` n'est pas dans le dépôt), donc pas d'outil d'images ; pas de web.
  - Une demande d'image suit le protocole cloud d'`AGENTS.md` (« Image generation ») : une requête écrite dans un fichier suivi, que la séance
    locale traitera plus tard.
- **Pas d'Aseprite.** Aucune nouvelle feuille cuite, aucun `build-character`. Les nouveaux personnages passent par le générateur
  procédural du code (`SpriteGenerator.ts`, `FighterArt.ts`) et ne deviennent jamais une production cuite en silence.
- **Pas de GPU.**
  - Aucune mesure de temps : SwiftShader ne sert qu'aux preuves d'image déterministes et aux compteurs (Passe T1).
  - La présence de Chrome se vérifie au départ. En Passe T1, c'était le Chromium de Playwright, préinstallé, lancé par un enveloppeur hors
    dépôt avec `--no-sandbox` ; il fallait 154 s pour démarrer en 1280 × 720, dont 136 s de bake, et 25 s avec `vis=0`.
- **Personne à qui demander** : l'opérateur éteint son ordinateur.
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
  - Sans paramètre, le jeu par défaut reste celui de `8a707b9` tant que l'opérateur n'a pas décidé autrement [P2].
  - `?scene=arena` sans paramètre de jeu reste inchangé : même `ARENA_SIM_HASH`, équivalence au prototype verte.

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

**Hors tranche** :
- le combat d'équipe (non requis par § 13) ; les phases II et III, seulement préparées dans les données ;
- le festival (tournoi § 10) [P1] ;
- le recrutement effectif (seulement introduit) ;
- tout personnage cuit nouveau ; l'art du héros en combat.

## 6. Architecture proposée (choix techniques de la séance, dans ce cadre)

- **`src/game/`, un cœur pur.** Il n'importe ni `three`, ni le DOM, ni `Math.random`, ni `Date.now`, ni `performance.now`. Un test parcourt
  ses fichiers et échoue sur ces noms.
  - `GameState` porte un `schemaVersion`.
  - `CompetitorState` reprend **exactement** l'interface du tournoi § 5 ; un `TeamState` agrégé est seulement typé.
  - `TournamentState`.
  - `WorldPulse` porte les huit champs du tournoi § 9.
  - Les services (`ServicesState`, la forge ouverte, sabotée ou fermée) et les quêtes.
  - Un journal d'événements, chacun avec sa cause (gameplay § 14, verrou 8).
- **Ses fonctions** : `newGame(seed, content)`, `actions(state)`, `apply(state, action) → { state, events }`, `endSlot(state)` (le hors écran et
  le pouls), `applyMatchResult`, `serialize`, `deserialize` et `hash`.
  - Une action mineure (parler, consulter, se déplacer dans un quartier) ne consomme aucun créneau (gameplay § 4.2).
  - Choisir un quartier n'en consomme pas non plus.
- **L'aléatoire** : le `Rng` de `src/core/rng.ts`, en flux dérivés de (graine, jour, créneau, acteur). Une partie reprise d'une sauvegarde
  donne donc la même suite qu'une partie continue.
- **Le contenu en données** : `src/game/content/` (concurrents, quêtes, services, textes en français [K1]).
- **La présentation.**
  - Un mode jouable derrière un paramètre (nom proposé : `?play=1`) [P2].
  - Une couche d'interface DOM, `src/game/ui/` : horloge, prochaine échéance, tableau du tournoi (tournoi § 11), dialogues, journal des faits,
    menu de sauvegarde.
  - La ville (`App`) et l'arène (`ArenaApp`) gardent leur chemin sans le paramètre.
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

L'ordre met d'abord ce qui se prouve sans navigateur. Si la séance s'arrête en route, `main` garde des morceaux cohérents et jouables.

**Preuve « jeu par défaut inchangé » (PD)**, à chaque lot qui touche un fichier atteint sans paramètre :
- `detshots` contre une copie figée de `main`, servie sur un autre port, au **seuil 0** ;
- un témoin de répétition d'abord (deux chargements, 0 px) ;
- nuit : A, B, C, D, `static=1&occ=0`, 30 pas ; les quatre références avec personnages, 120 pas ;
- midi en B ;
- `tools/arena-scene-check.mjs` sans paramètre de jeu ;
- sortie gardée et relue (principe de la Passe Y4).

**Sans Chrome**, aucune preuve d'image n'est possible. Le lot ne modifie alors aucun fichier atteint par le chemin par défaut, hors une branche
gardée par le paramètre. Il le montre (`git diff --stat`, et un test qui vérifie que le chemin par défaut n'importe pas `src/game/`), et la
preuve d'image est inscrite au bilan comme à refaire en local.

### L0 — Mise en route
- **Contenu** :
  - `npm ci` ; typecheck ; `npm test` ; build ; `art:validate` ; `art:doctor` (Aseprite absent, attendu).
  - Détection de Chrome, son enveloppeur hors dépôt, une capture de fumée de `main` et son témoin de répétition.
  - Les contrats dans le dépôt selon [C1].
  - L'archivage du journal si les passes gardées dépassent environ 60 Ko (elles font 49,8 Ko au départ), avec les huit contrôles de la
    Passe D1.
- **Fin** : l'environnement est consigné dans la première passe de la séance (machine, Node, navigateur, temps de démarrage logiciel).

### L1 — Cœur de jeu headless (`src/game/`)
- **Contenu** :
  - l'état, les actions, les créneaux, le journal causal ;
  - la sauvegarde et le chargement (JSON stable, version de schéma, migration vide), l'empreinte ;
  - le test de pureté.
- **Preuves** (`tests/game-core.test.mjs`) :
  - la même graine et le même script d'actions donnent la même empreinte, sur trois graines au moins ; deux graines divergent ;
  - une sauvegarde à chaque créneau, rechargée puis poursuivie, égale la partie continue ;
  - une action mineure ne coûte aucun créneau, une action importante en coûte un, une action invalide est refusée sans toucher l'état ;
  - au moins trois fautes injectées, attrapées, fichiers rendus à l'octet.
- **Fin** : tests verts ; le chemin par défaut n'importe rien de `src/game/` ; PD si un fichier du défaut change.

### L2 — Tournoi, phase I, et TournamentLab
- **Contenu** :
  - huit concurrents (le joueur et sept autres), chacun avec un profil de combat traduit en nombres de `CombatData` ;
  - le format de la phase I [G3] ;
  - les activités hors écran (tournoi § 6 : s'entraîner, acheter, se soigner, espionner, saboter…), choisies par tirage pondéré selon les
    objectifs et les relations ;
  - les rivalités fondées sur des faits (tournoi § 7) ;
  - les éliminés qui restent dans l'état (tournoi § 8) ;
  - le pouls de la ville (§ 9) après chaque créneau ;
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

### L4 — La ville jouable (le Merchant District sous le paramètre jouable)
- **Contenu** :
  - l'interface de jeu en français [K1] : jour et créneau, prochaine échéance, tableau (phase, prochain adversaire, rivaux en course,
    conséquence d'une défaite, quand et pourquoi le format change), dialogues écrits, journal des faits, menu ;
  - les PNJ existants dans des rôles de jeu [P4] : la marchande (boutique, rumeurs), le forgeron (amélioration, service sabotable), les gardes
    (sécurité, guet), l'inconnu (indices, suspect), le docker (une quête), les citadins (rumeurs selon le pouls) ;
  - la réaction visible de la ville (gameplay § 8, sans écran de debug) : l'effectif de la foule selon l'excitation, l'état de la forge, les
    rumeurs ;
  - ni le panneau DEV ni le HUD de debug en mode jouable.
- **Preuves** :
  - le PD (le défaut à 0 px) ;
  - des captures du mode jouable à chaque créneau ;
  - le jour 1 joué de bout en bout par `__game`, et une fumée au clavier (`E` sur la marchande) ;
  - la sauvegarde reprise après un rechargement.
- **Fin** : le jour 1 se joue dans la ville.

### L5 — Le contenu des trois jours
- **Contenu** :
  - le déroulé des trois jours :
    - jour 1 : l'arrivée, l'inscription, le premier rival, la quête, le futur recrutable ;
    - jour 2 : le duel 1, puis des indices et la menace sur la forge le soir ;
    - jour 3 : la forge sabotée ou sauvée (le service modifié), le duel 2, la réaction de la ville, la fin de tranche ;
  - l'échec qui ouvre des réponses (gameplay § 11) : la défaite [G3], la blessure suivie de soin ou de repos.
- **Preuves** :
  - trois parties scriptées complètes (« prévoyante », « négligente », « perdante ») jusqu'à l'écran de fin ;
  - un test qui coche chaque exigence du § 13 à partir des événements ;
  - le déterminisme ; la sauvegarde à chaque créneau.
- **Fin** : la liste du § 13 est cochée par le test.

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
  - l'écran titre selon [P2], la lisibilité, le clavier et le focus ;
  - la relecture des textes ;
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
| Fuites de non-déterminisme (`Math.random`, horloge, objets THREE) | Le test de pureté de `src/game/` ; des empreintes |
| Changer le district figé ou l'arène sans le vouloir | Le PD à 0 px ; l'empreinte de l'arène |
| Le proxy Git (un nom de branche imposé, pas de suppression distante) | Une tâche à la fois sous ce nom (Passes T1, H6) |
| Le journal au-delà d'environ 60 Ko | Archivage avec ses huit contrôles (L0 ou en route) |
| Un contexte compacté pendant une longue séance | Relire ce plan, `AGENTS.md` et les dernières passes du journal après chaque compactage |
| Dépôt public | Les contrats et les textes sont publiés une fois versionnés [C1] |
| L'autorité supérieure absente (`PROJECT_MASTER_CONTRACT.md`) | Un conflit entre documents est consigné, jamais tranché |
| Des sauvegardes rendues invalides par une version suivante | `schemaVersion` et un refus lisible ; la migration plus tard |

## 10. Décisions préparées pour l'opérateur (fiche d'arbitrages)

Chaque décision a sa recommandation entre parenthèses ; le détail est sur la fiche.

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

Vide jusqu'à la fiche. Les choix de l'opérateur s'y inscrivent mot pour mot, datés, avant le brief final.

## 12. Après la séance : à faire sur la machine de l'opérateur

- **Jouer** la version jouable : le ressenti, l'équilibrage des duels (« Régler après essai »), la lisibilité.
- **Mesurer le GPU** du mode jouable et de l'arène pilotée (`tools/perf.mjs`, `tools/cadence.mjs`) ; vérifier la visibilité si un lieu en
  dépend.
- **Traiter les demandes d'images** que la séance aura écrites, puis les art cuits éventuels (Aseprite, manifestes, approbations).
- **Arbitrer** les décisions préparées et listées au bilan.
