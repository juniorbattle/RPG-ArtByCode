# Journal de bord — archive : passes N1, N2, N3 et N4 (2026-10-20)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-10-20 (Passe L7) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe N1 — Planification de la séance cloud « version jouable » : inventaire du code, écarts avec les contrats maîtres, plan v1 (2026-10-20)

### Demande
- Séance lancée par la séance de la Passe H11. Les mots de l'opérateur, mot pour mot : « nous allons planifier notre grosse session cloud a
  effectuer des maintenant toujours avec le principe d'avoir une version jouable en prenant en compte ce que nous avons fait dans la mesure
  du possible ( cloud n'a pas acces au services externe ) ». Sa règle : « a partir de maintenant chaque nouvelle tache sera lance sur une
  nouvelle session ».
- La tâche : planifier avec l'opérateur une longue séance cloud autonome, qui livre une version jouable guidée par ses deux contrats
  maîtres, le gameplay v1.0 et le tournoi v1.0 (2026-10-02). Ils ont été transmis dans la séance ; ils ne sont pas dans le dépôt.
  - La séance cloud n'est lancée qu'une fois le plan validé, et sur le « go » de l'opérateur.
  - Cette séance planifie seulement : elle ne code pas la version jouable.
- Branche `cloud-plan-n1` depuis `main` (`8a707b9`), dans un worktree (`.claude/worktrees/cloud-plan-n1`) : le dossier partagé avec les
  autres séances reste sur `main`.

### Fait — [OK]
- **L'inventaire, lu dans le code** (§ 2 du plan) :
  - **La ville** : un seul quartier, clos ; le quai praticable fait environ 40 × 7 m (`WALK`).
    - Les interactions se limitent à deux : la bulle « … » des PNJ (2,5 s, sans texte) et la bascule de la forge (`NORMAL_FORGE` /
      `SABOTAGED_FORGE`).
    - L'état du jour n'est lu qu'au démarrage (constructeur d'`App`) ; la météo, elle, se change en jouant.
    - Le HUD de la ville est en anglais, dans `src/debug/`, et le panneau DEV s'affiche par défaut.
  - **L'arène** : une scène à part, un seul duel (Ren contre Marek), en temps continu. `CombatSim` reçoit ses données au constructeur.
  - **Ce qui n'existe pas** : un état de partie, les créneaux, l'économie, les quêtes, les dialogues écrits, le tournoi, la sauvegarde, un
    menu, le passage de la ville à l'arène.
- **Treize écarts avec les contrats** (§ 3 du plan), signalés sans être tranchés. Le premier :
  - le contrat de gameplay dit « combat tour par tour » ;
  - l'arène se joue sans attente : des temps de charge, une garde tenue, une esquive dans une fenêtre de réaction ;
  - le rapport du prototype (`arena/source/runtime-bakeoff-report.txt`, passe 9) présente ces règles comme le « nouveau design » de
    l'opérateur, venu après une version « Dynamic Turn-Based » à jauge.
- **Le plan v1**, `briefs/cloud-session-playable.md` : le périmètre (la tranche du gameplay § 13, ramenée au cloud), l'architecture (un cœur
  pur `src/game/`, le mode jouable derrière un paramètre), huit lots L0 à L7 avec leur critère de fin et leurs preuves headless, ce qui est
  réutilisé, les risques et quatorze décisions préparées.
- **Mon choix d'emplacement** : `briefs/` à la racine. Les briefs existants vivent dans `art-lab/characters/briefs/`, mais ce sont des
  briefs d'art ; un brief de séance qui touche tout le jeu va à la racine, sous le même nom de dossier.
- **Constat** : le dépôt GitHub est public (`"visibility": "public"`, lu par l'API publique). Tout fichier versionné est publié, contrats
  compris (décision C1).
- **Le journal** : les passes gardées font 49 769 octets. Pas d'archivage.

### Preuves
- Document seulement : aucun fichier de `src/`, `tests/` ou `tools/` ne change.
- **Validation** : typecheck, `npm test` 103 / 103, build, `art:validate`.

### Restes [?]
- **La fiche d'arbitrages** (décisions C1-C3, P1-P4, G1-G3, K1-K3, S1), puis les choix consignés mot pour mot au § 11 du plan et au
  journal, puis le brief final et le lancement sur le « go ».
- **Trois points que seul l'opérateur peut lever** : les contrats hors du dépôt ; `PROJECT_MASTER_CONTRACT.md` absent ; la « décision A3 »
  des verrous, définie nulle part dans le dépôt.

### Pensée
- Un écart entre un contrat et le code se montre avec sa source des deux côtés : la clause, le fichier, la passe du prototype. Il reste à
  l'opérateur. « Tour par tour » et « pas d'attente pour agir » ne se tranchent pas par l'agent.
- Un dossier partagé entre séances ne change pas de branche : la branche de tâche vit dans un worktree.

## Passe N2 — Fiche de la séance cloud : les choix de l'opérateur consignés ; contrats versionnés ; plan v2 et brief final (2026-10-20)

### Demande
- Opérateur, mot pour mot : « La fiche d'arbitrages est remplie : relis mes choix, consigne-les et écris le brief final. »
- Branche `cloud-plan-n1` (celle de la Passe N1, fusionnée et gardée pour cette suite de la même tâche), dans son worktree.

### Les choix — [OK] relus dans la fiche
- La fiche : https://claude.ai/artifact/RvECCuX3UHykYMbnPzctY7, collection `decisions`. Elle contient 14 documents sur 14, cliqués entre
  07 h 35 et 07 h 42 UTC, sans note. Cette fois, l'enregistrement a marché (en Passe D7, la collection était restée vide).
- Les choix, mot pour mot :

| # | Décision | Choix de l'opérateur | Recommandation suivie ? |
|---|---|---|---|
| C1 | Où ranger les contrats | « contracts/ à la racine (versionnés, donc publiés) » | oui |
| C2 | `PROJECT_MASTER_CONTRACT.md` | « Je le fournis avant le lancement » | oui |
| C3 | Les verrous, la « décision A3 » | « Aucun verrou modifié, écarts consignés » | oui |
| P1 | Le périmètre de la tranche | « Le § 13 entier, ramené au cloud (plan § 5) » | oui |
| P2 | Le démarrage | « Un écran titre par défaut : Nouvelle partie ou Explorer le district » | **non** (recommandé : derrière `?play=1`) |
| P3 | Les quartiers | « Trois lieux, dont un léger » | oui |
| P4 | Le district clos en mode jouable | « Couches de jeu seulement » | oui |
| G1 | Le modèle de combat | « L'arène actuelle, écart consigné » | oui |
| G2 | Les créneaux et les états du jour | « Matin, midi, nuit ; la fin de journée en transition » | oui |
| G3 | La phase I | « Poule à points » | oui |
| K1 | La langue de l'interface | « Anglais » | **non** (recommandé : le français) |
| K2 | Le nom du joueur | « Un nom choisi par le joueur » | **non** (recommandé : « Ren », provisoire) |
| K3 | Les rivaux en ville | « Portraits et dialogues » | oui |
| S1 | Si tout est fait avant la fin | « Finition, puis le bilan » | oui |

### Fait — [OK]
- **`contracts/`** (décision C1) : `GAMEPLAY_MASTER_CONTRACT.md` et `TOURNAMENT_MASTER_CONTRACT.md`.
  - Leur texte est celui que la séance de la Passe H11 a transmis. Seule la mise en forme change : un paragraphe par section, l'en-tête en
    titre, l'interface `CompetitorState` en bloc de code.
  - Chacun porte sa provenance. L'en-tête entre parenthèses peut être un résumé fait par la séance de transmission ; l'original de
    l'opérateur fait foi.
  - **Le dépôt est public** : les contrats sont publiés, comme le dit le libellé du choix.
- **`AGENTS.md`** : une section « Master contracts ». Elle donne où vivent les contrats, la règle de C3 (aucun verrou modifié sans l'opérateur,
  un écart consigné au journal) et le renvoi au plan et au brief.
- **Le plan v2** (`briefs/cloud-session-playable.md`) :
  - le § 11 porte les choix, et ce que les trois choix « non » changent ;
  - P2 :
    - l'écran titre ne paraît que sur l'adresse nue ;
    - « Explore the district » et toute adresse à paramètres donnent le jeu d'aujourd'hui ;
    - `?play=1` sert aux outils, `?title=0|1` à sauter ou forcer l'écran ;
    - l'écran titre n'entre dans le défaut qu'au lot L4, quand « New game » mène à une journée complète ;
    - la PD passe aussi par l'écran titre ; un risque ajouté : un outil qui charge l'adresse nue ;
  - K1 : l'interface et les textes du mode jouable en anglais, l'arène comprise par une table de textes. `?scene=arena` seul garde son HUD
    français.
  - K2 : « New game » demande le nom.
- **Le brief final**, `briefs/cloud-session-playable-brief.md`. Il est autonome, versionné pour être relu après un compactage, et il servira
  de texte de lancement. Il couvre :
  - la pleine autonomie et les décisions réservées ;
  - l'ordre de lecture et la mission, avec les quatorze choix ;
  - l'environnement : ni service externe, ni Aseprite, ni GPU, Chrome à vérifier, aucune dépendance ajoutée ;
  - Git, les preuves, le journal (passes L0 à L7), la fin.

### Preuves
- Documents seulement : aucun fichier de `src/`, `tests/` ou `tools/` ne change.
- **Validation** : typecheck, `npm test` 103 / 103, build, `art:validate`.

### Restes [?]
- **Avant le lancement** : l'opérateur fournit `PROJECT_MASTER_CONTRACT.md` (C2), qui sera versionné dans `contracts/`. Puis il dit « go ».
- La séance cloud partira de `main` tel qu'il est poussé.

### Pensée
- Une fiche se relit telle qu'elle est enregistrée, choix par choix. Trois choix diffèrent de la recommandation : chacun se reporte dans les
  sections du plan qu'il touche, pas seulement dans le tableau des décisions.
- Un écran titre par défaut change l'adresse nue, que des outils chargent peut-être. Le borner à l'adresse nue, avec une porte de sortie
  (`?title=0`), garde intactes toutes les preuves existantes.

## Passe N3 — Le contrat projet versionné ; ses écarts avec le dépôt et ses ajouts à la tranche ; plan v3 et brief à jour (2026-10-20)

### Demande
- Décision C2 : « Je le fournis avant le lancement ». L'opérateur, mot pour mot : « Je colle PROJECT_MASTER_CONTRACT.md dans mon prochain
  message. » Il l'a collé dans le message suivant.
- Interrompu pendant l'analyse, repris sur « continue ».
- Branche `cloud-plan-n1`, dans son worktree.

### Fait — [OK]
- **`contracts/PROJECT_MASTER_CONTRACT.md`** : le texte collé, recopié tel quel, sans mise en forme ajoutée, sous un commentaire de
  provenance.
- **Deux points relevés, non corrigés** :
  - l'en-tête dit « Version : 1.2 », la dernière ligne « PROJECT MASTER CONTRACT v1.1 » ;
  - la « décision A3 » des deux autres contrats n'y est pas définie. Son § 0 demande qu'une modification d'un verrou majeur soit
    « explicite, documentée dans un journal de décision et validée avant implémentation », ce qui rejoint C3.
- **Douze écarts avec le dépôt**, E14 à E25 (§ 3b du plan), signalés sans être tranchés. Les plus lourds :
  - **E14** : la ville en 3D low-poly conçue dans Blender, « source d'autorité spatiale », et glTF / GLB comme format principal. Le dépôt
    génère tout par le code au démarrage, et le cloud n'a pas Blender.
  - **E15** : la « génération runtime de la ville » est un non-objectif V1 ; or le district, l'arène et le troisième lieu de P3 sont générés.
  - **E16** : le combat « RPG tour par tour » (§§ 1, 6.1), qui confirme l'écart E1 depuis l'autorité supérieure.
  - **E17** : un moteur de combat extensible à plusieurs combattants ; `CombatSim` est fixé à deux.
- **Ses ajouts à la tranche** (son § 14, plus large que le gameplay § 13), entrés au périmètre (§ 5 du plan) :
  - plusieurs rivaux persistants ; une boutique affectée par une conséquence ; au moins douze événements dynamiques configurables ;
  - une chaîne de sabotage déclenchée par des conditions ; le changement de quartier ;
  - des captures sur ordinateur et sur mobile ; un budget technique mesuré (des compteurs dans le cloud, les temps GPU en local) ;
  - le jour et la nuit qui changent les services et les présences (§ 8.1).
- **Choix techniques sûrs, les miens, consignés comme tels** :
  - le code neuf suit son architecture (§ 10.4 : `src/simulation/`, `tournament/`, `combat/`, `events/`, `narrative/`, `ui/`) ; les dossiers
    existants ne bougent pas ;
  - `advance(state, action, rng)` (§ 10.2) ; des états nommés pour les tests (§ 10.3) ;
  - chaque lot s'ouvre sur son contrat de tâche (§ 11.3) ;
  - l'interface de match côté jeu prend des listes de combattants, et l'arène reste 1v1.
- **Aucun choix de la fiche ne change.** P3 reste « Trois lieux, dont un léger », malgré E15 ; G1 reste l'arène actuelle, malgré E16.
- **Les documents** :
  - plan v3 : l'en-tête, le § 3b, les ajouts du § 5, le § 6, les lots L1, L2, L4, L5, L7 et le § 11 ;
  - le brief final : le paragraphe « Le contrat projet », la lecture des écarts E1 à E25, la pureté des nouveaux modules, le contrat de
    tâche par passe, le bilan ;
  - `AGENTS.md` : la ligne du contrat projet dans « Master contracts ».

### Journal — [OK] archivage (règle d'`AGENTS.md`, passes gardées au-delà d'environ 60 Ko)
- Les passes gardées faisaient 63 342 octets, après l'ajout de cette passe.
- Y4, Y5, R3 et D7, toutes closes (branches fusionnées), partent d'un seul bloc, dans leur ordre et à l'octet, vers
  `journal/14-passes-Y4-D7.md` : en-tête, ligne `---`, puis les 25 598 octets inchangés (SHA-256 `9325b955dbd0805a…`).
- La ligne d'index et la phrase d'en-tête sont mises à jour. Restent K9, K10, K11, H11, N1, N2 et N3 : 37 744 octets.
- **Preuve** (script hors dépôt, contre la copie de `JOURNAL.md` faite juste avant le déplacement) : **8 / 8**, les huit contrôles de la
  Passe D1. Le compte rendu ajouté ensuite à cette passe reste hors de la comparaison. Contrôle négatif : un mot changé dans une copie de
  l'archive → 7 / 8.

### Preuves
- Documents seulement : aucun fichier de `src/`, `tests/` ou `tools/` ne change.
- **Validation** : typecheck, `npm test` 103 / 103, build, `art:validate`.

### Restes [?]
- **Le « go » de l'opérateur**, puis le lancement de la séance cloud depuis `main` poussé.
- **Les écarts E14 et E15 touchent la direction même du projet** (Blender contre génération par le code). Ils restent à l'opérateur, après
  la séance.

### Pensée
- Un contrat reçu après une fiche peut agrandir le périmètre sans contredire un choix. Ses exigences entrent alors au plan, et ses écarts
  se consignent à côté des choix, qui restent en vigueur. Un écart de direction (l'outil source de la ville) ne se règle pas dans une
  séance de construction.

## Passe N4 — L'ordinateur local reste allumé : un relais local pour Aseprite, la clé OpenAI et le GPU ; plan v4 et brief à jour (2026-10-20)

### Demande
- À la question « Je lance la séance cloud ? », l'opérateur a d'abord répondu : « Pas encore : je veux d'abord revoir un point du plan ou du
  brief. »
- Puis, mot pour mot : « Excellent, l'ordi local sera finalement ouvert donc session cloud poura communiquer avvec toi pour utiliser les
  outils externes comme aseprite ou open ai key ».
- Branche `cloud-plan-n1`, dans son worktree.

### Constat — [OK] une limite du canal
- **Une séance cloud ne peut envoyer de message à aucune autre séance.** C'est la description de l'outil de messagerie. La séance locale, elle,
  peut lui écrire et lire son transcript.
- Le sens cloud → local passe donc par le dépôt. C'est déjà le protocole des images d'`AGENTS.md` (« Image generation ») : une requête dans
  un fichier suivi, sur la branche du cloud.

### Fait — [OK]
- **Le protocole du relais** (brief § 3b, plan § 4b) :
  - le cloud pousse `briefs/local-requests/NNN-<sujet>.md` (type, lot, base, demande, entrées, sorties, repli, statut), puis continue ;
  - la séance locale surveille les branches `claude/*` toutes les deux minutes environ ;
  - elle exécute la requête, écrit la réponse dans le même fichier et pousse ses propres commits au-dessus de la branche du cloud ;
  - elle prévient le cloud par message ; le cloud tire sa branche (`git pull --rebase`, jamais de force-push) ;
  - une requête ne bloque jamais le cloud : chacune porte son repli ;
  - au lot L0, une requête `000-handshake` éprouve le canal dans les deux sens.
- **Mes choix, sûrs** :
  - toutes les images de la séance sous une seule tâche, `cloud-playable`, plafonnée à 5 $. Le plafond par tâche d'`AGENTS.md` ne doit pas
    devenir 5 $ par requête ; le relever reste la décision de l'opérateur.
  - Une feuille cuite construite par le relais reste candidate (`runtimeUse: lab`). Le relais ne prend aucune décision réservée et ne
    fusionne rien dans `main`.
- **Le budget technique** (contrat projet § 14) est désormais mesurable : les temps GPU sur la 780M, par le relais, aux lots L4 et L7.
- **Les documents** :
  - le brief : le § 0 (autonomie et relais), le § 3 (limites du cloud), le § 3b (le protocole), Git et le bilan ;
  - le plan v4 : l'en-tête, le § 4, le § 4b, le budget du § 5, deux risques, les § 11 et 12 ;
  - `AGENTS.md` : une règle « Cloud relay » sous « Image generation ».
  - Avant le lancement, une coquille du brief corrigée : son § 1 nommait encore « le plan v2 ».
- **Essai du guet** : un passage de la boucle (`git fetch` des branches `claude/*`, liste de `briefs/local-requests/`) tourne d'ici sans
  erreur. Aucune branche `claude/*` n'existe aujourd'hui.

### Preuves
- Documents seulement : aucun fichier de `src/`, `tests/` ou `tools/` ne change.
- **Validation** : typecheck, `npm test` 103 / 103, build, `art:validate`.

### Restes [?]
- **Le « go » de l'opérateur.** Ensuite :
  1. le lancement ;
  2. le guet des requêtes, réarmé à chaque expiration (30 min au plus) ;
  3. la machine et l'application gardées éveillées pendant la course.
- **Non éprouvé avant le lancement** : le message de la séance locale vers la séance cloud. C'est la requête `000-handshake` qui le
  prouvera.

### Pensée
- Un canal se décrit dans ses deux sens avant d'être promis. Ici, l'un est un message, l'autre un fichier poussé, et le protocole se règle sur
  le sens le plus faible.

