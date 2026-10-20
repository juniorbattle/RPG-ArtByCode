# Journal de bord — Cité du Tournoi (Merchant District, nuit)

Objet : garder une trace honnête de ce qui a été fait, de ce qui a marché, de ce qui a raté et de **pourquoi**, pour que
la suite parte d'un état connu. À compléter à chaque passe (une entrée par passe, la plus récente en bas).

Légende : **[OK]** réussi · **[KO]** échec / impasse · **[?]** non résolu ou à surveiller · **Pensée** = raisonnement / leçon.

> Les passes 0 à S1b, H0, M6, V0 à V3, H1, M7, H2 à H4, H5 à P2, H7 à D2, H9 à Z4, R2 à Y3, Y4 à D7 et K9 à H11 sont archivées **mot pour mot** dans `journal/` (Passes M3, M6, M7, H5, T1, B1, D1, Z2, Y4, K10, N3 et L2) ; ce fichier garde les passes récentes,
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

## Passe L0 — Séance cloud « version jouable » : mise en route (2026-10-20)

### Contrat de tâche (contrat projet § 11.3)
- **Objectif** : un environnement cloud prêt et consigné ; le relais local éprouvé ; `main` validé tel quel.
- **Entrées** : `main` `d129433` ; le brief `briefs/cloud-session-playable-brief.md`, le plan v4 et les trois contrats de `contracts/`.
- **Fichiers autorisés** : `JOURNAL.md`, `briefs/local-requests/`. **Interdits** : tout le reste (aucun code ne change).
- **Outputs** : la requête `000-handshake`, cette passe.
- **Critères d'acceptation** : `npm ci`, typecheck, `npm test`, build, `art:validate` verts ; `art:doctor` lu ; Chrome trouvé ou absent, dit ;
  une capture de fumée de `main` et son témoin de répétition (0 px).
- **Tests** : ceux du dépôt, inchangés. **Risques** : SwiftShader lent ; le relais sans réponse (repli : la séance continue sans lui).
- **Définition de terminé** : l'environnement consigné ici (machine, Node, navigateur, temps de démarrage logiciel), la requête poussée.

### Environnement — [OK]
- Conteneur Linux x64, 4 cœurs, 15 Go de mémoire, sans GPU. Node v22.22.0, npm 10.9.4. Branche imposée : `claude/pensive-pasteur-lbz4ji`.
- `npm ci` ; typecheck ; `npm test` **103 / 103** (14 s) ; build ; `art:validate` (18 manifestes, 21 sources, 0 erreur).
- `art:doctor` : Aseprite absent (état attendu), aucune intégration d'agent.
- **Chrome** : le Chromium 141 de Playwright, préinstallé (`/opt/pw-browsers/chromium`). Un enveloppeur hors dépôt
  (`exec /opt/pw-browsers/chromium --no-sandbox "$@"`) sert de `CHROME_PATH`, avec `CHROME_ARGS=--use-angle=swiftshader` (comme en Passe T1).
- **Copie figée de `main`** : `git -c core.autocrlf=false archive d129433` dans le dossier de travail de la séance, `node_modules/three` copié,
  servie sur :5187 par le Vite du dépôt avec une config hors dépôt sans import (`vite.config.ts` de la copie ne trouve pas `vite` hors du
  dépôt).

- **Capture de fumée de `main`** (`detshots`, 1280 × 720, `seed=1842&clean=1&camera=B&freeze=7.3`, 120 pas, personnages compris) et son
  témoin de répétition : deux chargements en parallèle, **0 px** (`diff.mjs` au seuil 0, et les deux PNG identiques à l'octet). Chaque
  chargement prend **162 s** en SwiftShader (deux en parallèle sur 4 cœurs), le bake compris.
- **[KO → corrigé]** `tools/diff.mjs` compte au seuil 24 par défaut : le seuil 0 du brief se passe en quatrième argument. Il lui faut aussi
  `CHROME_PATH` (il ouvre un navigateur pour décoder les PNG).

### Relais local — [?]
- Requête `briefs/local-requests/000-handshake.md` poussée (type « autre ») : l'état de la machine locale (Aseprite, clé OpenAI, GPU). Pas de
  réponse à la clôture de L0 ; la séance continue (le brief : une requête ne bloque jamais).

### Preuves
- Aucun fichier de `src/`, `tests/` ou `tools/` ne change. Validation : typecheck, `npm test` 103 / 103, build, `art:validate`.

### Pensée
- Un outil de preuve se relit avant d'en croire le « 0 % » : son seuil par défaut n'est pas forcément celui de la preuve.

## Passe L1 — Le cœur de jeu headless : état, actions, créneaux, journal causal, sauvegarde, empreinte, états nommés (2026-10-20)

### Contrat de tâche (contrat projet § 11.3)
- **Objectif** : un cœur de jeu pur, sans rendu : l'état de la partie, ses actions, les trois créneaux par jour, le journal causal, la
  sauvegarde versionnée et l'empreinte, les états nommés (contrat projet § 10.3).
- **Entrées** : plan § 6 et lot L1 ; contrat de gameplay §§ 4, 12, 14 (verrou 8) ; contrat projet §§ 10.2-10.4 ; `src/core/rng.ts`.
- **Fichiers autorisés** : `src/simulation/`, `src/narrative/`, `tests/game-core.test.mjs`, `JOURNAL.md`. **Interdits** : tout fichier atteint
  par le jeu par défaut (`src/main.ts` et ses imports), `src/arena/`, les outils.
- **Outputs** : `newGame`, `actions`, `advance(state, action, rng)`, `serialize` / `deserialize`, `hash`, `namedState`.
- **Critères d'acceptation** : même graine + même script = même empreinte (trois graines) ; une sauvegarde rechargée à chaque pas égale la
  partie continue ; une action mineure ne coûte aucun créneau, une importante en coûte un, une refusée ne touche pas l'état ; les modules du
  jeu purs ; le chemin par défaut n'importe aucun module du jeu.
- **Tests** : `tests/game-core.test.mjs`, trois fautes injectées au moins. **Risques** : une fuite de non-déterminisme ; un import du jeu
  dans le chemin par défaut.
- **Définition de terminé** : tests verts, fautes attrapées, fichiers rendus à l'octet, validation complète ; aucun fichier du défaut ne change
  (PD sans objet).

### Fait — [OK]
- **`src/simulation/`** :
  - `state.ts` : `GameState` (avec `schemaVersion`), les créneaux `morning | afternoon | evening`, trois jours, trois lieux (`district`,
    `forecourt`, `lanterns`). `CompetitorState` reprend mot pour mot l'interface du contrat du tournoi § 5 ; `TeamState` est seulement typé ;
    `WorldPulse` porte les huit champs du § 9. Les concurrents, le tournoi et le pouls sont remplis au lot L2.
  - `actions.ts` : une table d'actions. Chacune dit son coût (0 = mineure : parler, se déplacer entre les lieux ; 1 = importante : elle prend
    le créneau), son refus et sa raison lisible, et son effet. Pour L1 : `move`, `talk`, `rest`, `train`, `wait`.
  - `advance.ts` : `advance` ne modifie jamais son entrée (une copie) ; une action refusée rend le même objet sans événement. Une action
    importante termine le créneau (`endSlot`, qui accueillera le hors écran, le pouls et les événements en L2), puis l'horloge avance ; après
    le soir du jour 3, la tranche est finie.
  - L'aléatoire : `rngFor(state, label)`, un flux tiré de (graine, nombre d'actions appliquées, étiquette) seulement. Une partie reprise
    d'une sauvegarde tire donc la même suite que la partie continue.
  - `canonical.ts` : un JSON canonique (clés triées à chaque niveau) et une empreinte FNV-1a 64 bits.
  - La sauvegarde : le JSON canonique, avec son type, sa version de schéma et la version du contenu. Un fichier étranger, une version plus
    récente ou un état abîmé sont refusés avec une raison lisible ; la table des migrations est vide (contrat projet § 10.3).
  - `named.ts` : chaque état nommé est atteint par un script d'actions depuis une partie neuve, jamais en écrivant des champs : il est
    donc un état que le jeu peut atteindre.
- **`src/narrative/people.ts`** : les gens à qui parler, en anglais (choix K1). Les personnages du district gardent leur sprite (choix P4) ;
  les rivaux n'ont qu'un portrait et des dialogues (choix K3). Leurs heures de présence : le forgeron le jour, l'informateur la nuit (contrat
  projet § 8.1).

### Choix de la séance (consignés comme tels)
- Le nom du joueur (choix K2) : nettoyé (20 caractères au plus ; lettres, chiffres, espaces, apostrophes, tirets) ; « Ren » s'il est vide.
- Une sauvegarde porte aussi la version du contenu (`slice-1`) : un état fait avec d'autres tables est refusé, plutôt que lu de travers.
- L'empreinte est un FNV-1a 64 bits du texte canonique, calculé en deux moitiés de 32 bits, sans dépendance.

### Preuves
- **`tests/game-core.test.mjs`, 9 tests** :
  - la pureté : les fichiers de `src/simulation`, `tournament`, `combat`, `events` et `narrative` ne contiennent ni `three`, ni le DOM, ni
    `Math.random`, ni horloge, et n'importent que des modules purs (plus `src/core/rng.ts` et `src/arena/CombatSim.ts`). L'oracle lit le
    texte des fichiers, sans passer par le code testé ;
  - le chemin par défaut : depuis `src/main.ts`, les imports statiques n'atteignent aucun module du jeu ni `src/ui/` ;
  - le déterminisme, sur trois graines ; une sauvegarde rechargée à chaque pas égale la partie continue ;
  - les coûts des créneaux et les refus ; les heures de présence ;
  - les refus de la sauvegarde ;
  - l'empreinte contre une référence BigInt indépendante, et le vecteur publié de FNV-1a 64 (« a » → `af63dc4c8601ec8c`) ;
  - les états nommés.
  - **[KO → corrigé]** deux erreurs du test lui-même, pas du code : un `JSON.stringify` avec une liste de clés filtre aussi les objets
    imbriqués (la permutation des clés est maintenant récursive) ; une limite du nom à 18 caractères tronquait le cas du test.
- **Huit fautes injectées une à une, fichiers rendus à l'octet** : `advance` qui modifie son entrée, parler qui coûte un créneau, une
  version de sauvegarde plus récente acceptée, un `Math.random` dans un module du jeu, le JSON canonique sans tri, l'informateur présent le
  matin (attrapée une fois le test des heures ajouté), un import du jeu dans `src/main.ts` : **7 attrapées**.
  - **[?] La huitième passe** : `step` non compté. En L1, aucune action ne tire au sort, donc le flux n'a pas d'effet. Elle sera rejouée en
    L2.
- **Le jeu par défaut ne change pas** : aucun fichier suivi ne change (`git status` : seulement des fichiers neufs), et le bundle de production
  ne contient pas le module (`cite-du-tournoi-save` absent de `dist/`).
- **Validation** : typecheck, `npm test` **112 / 112**, build, `art:validate`.

### Pensée
- Un test de déterminisme ne vaut que pour ce qui tire au sort : un compteur qui ne nourrit que l'aléatoire ne se prouve qu'une fois
  l'aléatoire utilisé. La faute qui passe se consigne et se rejoue au lot suivant.
- Un état nommé atteint par un script d'actions, jamais par des champs écrits à la main, ne peut pas décrire un état impossible.

## Passe L2 — Le tournoi de la phase I, les concurrents hors écran, le pouls, dix-sept événements configurables, le TournamentLab (2026-10-20)

### Contrat de tâche (contrat projet § 11.3)
- **Objectif** : la poule à points (choix G3) de huit concurrents persistants, leur vie hors écran, les rivalités fondées sur des faits, le pouls
  de la ville, au moins douze événements configurables dont une chaîne de sabotage contrable, et le laboratoire du tournoi.
- **Entrées** : contrat du tournoi §§ 5-9, 11-13 ; contrat projet §§ 3.4, 9, 14 ; plan, lot L2 ; `CombatSim` (choix G1).
- **Fichiers autorisés** : `src/simulation/`, `src/tournament/`, `src/combat/`, `src/events/`, `src/narrative/`, `tests/`, `tools/tournament-lab.mjs`,
  `AGENTS.md` (la commande), `JOURNAL.md`. **Interdits** : `src/arena/` (`COMBAT_DATA`, `ARENA_SIM_HASH`), tout fichier du jeu par défaut.
- **Outputs** : la poule, le hors écran, le pouls, `src/events/`, `tools/tournament-lab.mjs`.
- **Critères d'acceptation** : la résolution simplifiée d'accord avec des duels complets dans la tolérance écrite à l'avance ; aucun
  participant oublié ; le laboratoire reproductible sur 50 graines ; la chaîne de sabotage déclenchée par ses causes, annoncée, contrée.
- **Tests** : `tests/tournament.test.mjs`, des fautes injectées. **Risques** : un modèle simplifié qui diverge du combat réel ; un concurrent
  qui ne fait rien ; un sabotage arbitraire.
- **Définition de terminé** : tests verts, fautes attrapées, laboratoire en CLI et dans `npm test`, validation complète, jeu par défaut intact.

### Fait — [OK]
- **La distribution** (`src/narrative/roster.ts`, en anglais) : le joueur et sept rivaux. Chacun a une identité, un style, des objectifs, des
  relations de départ, un tempérament et des couleurs de portrait :
  - Marek Varn, le champion (le Marek du prototype, nombre pour nombre) ;
  - Vessa Lark (enchaînements rapides) ; Orla Brask, des docks (le futur recrutable) ; Cassius Dree, noble, rival hostile (le saboteur) ;
  - Ilse Morrow, chevalière du Temple ; Tobin Fenn, le jeune ; Rhosk, le mercenaire du Nord.
  - Deux rondes : le joueur affronte Vessa le jour 2 et Marek le jour 3 ; tout le monde combat les deux jours. Victoire 3 points, défaite serrée
    1 point (le perdant garde un quart de sa vie), défaite 0. Personne n'est éliminé (choix G3).
- **Les profils de combat** (`src/combat/profiles.ts`) : chaque rival est une suite de nombres pour le siège ennemi de `CombatData` (santé,
  coup léger, coup lourd, enchaînements, repos). `duelData` en fait les données d'un duel ; `COMBAT_DATA` ne change pas. Le profil de Marek
  passé par `duelData` redonne l'empreinte `ARENA_SIM_HASH`.
- **La résolution hors écran** : une course aux dégâts tirée des mêmes nombres (dégâts par seconde de chaque kit, temps pour abattre l'autre,
  une logistique).
  - Trois constantes, réglées sur des graines de calibrage (1-40) : la part des lectures qui aboutissent (`READ_AVAIL` 0,5 : une esquive
    demande un point d'action, une garde un combattant au repos), la pente (3,2) et l'avance du kit du joueur (0,75 en logit : 3 points
    d'action au départ, techniques en tête).
  - Le kit du joueur est résolu par un petit bilan de temps (les coups légers gagnent des points, les techniques les dépensent au rythme de
    leurs recharges).
- **Un bot** (`src/combat/bot.ts`) joue le siège du joueur dans le `CombatSim` complet, avec une adresse de 0 à 1 et son propre flux
  aléatoire : 3 ms par duel en Node.
- **La fiche de match** (`src/combat/match.ts`) prend des listes de combattants par camp (écart E17) ; elle ne devient `CombatData` qu'en 1 contre
  1 et le dit sinon (« team formats (1v2) are outside the slice »). Elle porte ce que la préparation change : la blessure (−20 % de santé par
  niveau), une lame trempée (+15 % de dégâts), l'entraînement (+5 % par séance, deux au plus), et l'assistance `full` si l'adversaire a été
  observé.
- **Le hors écran** (`src/tournament/offscreen.ts`) : à chaque créneau, chaque rival choisit une activité (s'entraîner, se reposer, acheter,
  espionner, boire avec un autre, comploter), tirée selon son état, ses objectifs et l'heure, dans son propre flux. Chaque choix est journalisé
  (caché du joueur).
- **Les rivalités sur des faits** (contrat du tournoi § 7) : un rival fier qui perd en veut au vainqueur, un honorable le respecte.
- **Le pouls** (`src/tournament/pulse.ts`, les huit champs du § 9) : calculé à chaque créneau depuis l'état, plus les décalages durables que
  laissent les événements.
- **`src/events/`** : un langage de conditions et d'effets en données ; dix-sept événements des six types du contrat projet § 9.1.
  - La chaîne de sabotage (§ 3.4) : la rancune de Cassius (sa relation au joueur ≤ −25, née d'un fait : la première victoire du joueur) et la
    renommée du joueur ; deux signes (l'huile achetée chez Mara ; la silhouette vue par le guet), puis la tentative du soir.
  - Ses réponses (§ 9.3) : payer le guet (la tentative échoue, le coupable nommé, Cassius perd 3 points), un guet qui veille (l'auteur fuit) ;
    sinon la forge brûle, l'acier manque et la boutique augmente ses prix de 40 % (« boutique affectée par une conséquence »). Les autres
    réponses (enquêter, réparer, la lame de Mara) viennent avec le contenu du lot L5.
- **L'action `fight`** reçoit le résultat du duel de l'arène (ou du bot) ; l'après-midi d'un jour de match, aucune autre action importante
  n'est permise. **L'action `payWatch`** (mineure, le soir, 15 pièces).
- **TournamentLab** : `src/tournament/lab.ts` (parties automatiques avec une politique de joueur, participants oubliés, taux) et la CLI
  `tools/tournament-lab.mjs` (`--seeds`, `--policy`, `--state` / `--save` + `--days`, `--compare`, `--json`). 50 parties en 0,7 s.

### Choix de la séance (consignés comme tels)
- **[KO → changé] L'entraînement** : « +1 point d'action au départ » faisait **perdre** le bot (Vessa, 60 duels : 90 % de victoires sans
  entraînement, 62 % avec deux séances) ; il dépense tout d'entrée et n'a plus de point pour esquiver. L'entraînement donne maintenant +5 % de
  dégâts par séance, un effet qui ne peut que servir.
- Les nombres des rivaux sont provisoires (« Régler après essai », D1). **Constat** : le kit du joueur domine. Le bot gagne 65 à 100 % de ses
  duels selon l'adversaire et son adresse ; Marek, le plus dur, est battu à 68 % par un bot d'adresse 0.
- Le pouls est recalculé depuis l'état, pas accumulé : chaque valeur a des causes que le code nomme.

### Preuves
- **La résolution simplifiée contre les duels complets** : la tolérance, **0,2**, a été écrite dans le test avant le passage sur les graines
  tenues à part (101-140). Les sept profils à trois adresses (0 ; 0,5 ; 1), plus trois cas avec modificateurs : tous dans la tolérance
  (écart maximal de 0,14 sur les graines de calibrage).
- **`tests/tournament.test.mjs`, 11 tests** :
  - la résolution simplifiée, sur les graines tenues à part ;
  - les données de duel : le prototype intact, l'empreinte de l'arène tenue par le profil de Marek ;
  - la fiche de match, et son refus d'un format d'équipe ;
  - la poule : tous les combats joués, les points qui s'additionnent, personne d'éliminé ;
  - aucun participant oublié, sur 50 graines et deux politiques ;
  - les événements : au moins douze, des six types, chacun avec sa cause ; chacun se déclenche dans au moins une partie sur 60. Une exception
    déclarée : la faveur de Mara, qui attend les services du lot L5 ;
  - la chaîne de sabotage sur trois graines : les deux signes avant la nuit, la forge brûlée sans réponse et la boutique touchée, le coupable
    pris quand le guet est payé ; sans la cause (le premier duel perdu), ni signe ni tentative ;
  - une défaite coûte (un point pour une défaite serrée, une blessure après un coup lourd) sans éliminer ;
  - le laboratoire reproductible (deux passages sur 50 graines égaux), et sa CLI.
- **Sept fautes injectées une à une, fichiers rendus à l'octet, toutes attrapées** : la défaite serrée sans son point, un rival qui ne fait rien,
  le guet ignoré, une pente fausse, la nuit sans baisse de la sécurité, une défaite qui élimine, et `step` non compté (la faute passée en L1,
  attrapée maintenant que l'aléatoire sert).
- **Mesures du laboratoire** (50 graines, Node, à titre indicatif) :
  - politique « idle » (adresse 0,3) : 74 % de duels gagnés, la forge sabotée dans 96 % des parties, jamais contrée ;
  - « diligent » (adresse 0,6, guet payé) : 97 % de victoires, sabotages contrés dans 82 % des parties ; 0 participant oublié.
- **Le jeu par défaut ne change pas** : aucun fichier de `src/main.ts`, `src/app`, `src/arena`, `src/characters`, `src/district`, `src/debug` ne
  change (`git diff --stat`) ; le bundle ne contient pas le jeu.
- **Validation** : typecheck, `npm test` **123 / 123**, build, `art:validate`.

### Journal — [OK] archivage (passes gardées au-delà d'environ 60 Ko)
- Avec cette passe, les passes gardées faisaient 60 842 octets.
- K9, K10, K11 et H11, toutes closes (branches fusionnées), partent d'un seul bloc, dans leur ordre et à l'octet, vers
  `journal/15-passes-K9-H11.md` : en-tête, ligne `---`, puis les 23 873 octets inchangés (SHA-256 `734db47bf54ccf61…`). La ligne d'index et la
  phrase d'en-tête sont mises à jour. Restent N1 à N4, L0, L1 et L2 : 36 969 octets.
- **Preuve** (script hors dépôt, contre la copie de `JOURNAL.md` faite juste avant le déplacement) : **8 / 8**, les huit contrôles de la Passe
  D1 ; le huitième est ici « LF seuls, aucun CR » (le dépôt garde LF ; la Passe D1, sous Windows, contrôlait les CRLF de la copie de travail).
  Contrôle négatif : un mot changé dans une copie de l'archive → 7 / 8.

### Pensée
- Un modèle simplifié se règle sur des graines et se juge sur d'autres, avec une tolérance écrite avant ; ses constantes se nomment par ce qu'elles
  représentent (une lecture qui n'aboutit pas faute de point d'action), pas par le chiffre qui fait passer le test.
- Un bonus de jeu se vérifie sur le bot avant d'être gardé : un avantage nominal (des points d'action de plus) peut faire perdre.

## Passe L3 — Le duel officiel : l'arène pilotée par une fiche de match, Vessa générée, l'aller et retour ville → arène → ville (2026-10-20)

### Contrat de tâche (contrat projet § 11.3)
- **Objectif** : les deux duels de la tranche se jouent dans l'arène actuelle (choix G1), pilotée par une fiche de match ; le résultat revient
  à l'état ; on passe de la ville à l'arène et retour par une sauvegarde et un rechargement (choix G2).
- **Entrées** : plan, lot L3 ; `src/arena/` (Passe P1) ; le cœur des Passes L1 et L2 ; choix G1, G2, K1, K2.
- **Fichiers autorisés** : `src/arena/ArenaApp.ts`, `ArenaHud.ts`, `FighterArt.ts` (des options, défauts inchangés), `src/main.ts` (une entrée
  `?play=1` chargée à la demande), `src/ui/`, les modules du jeu, `tests/`, `tools/play-flow.mjs`, `JOURNAL.md`.
- **Interdits** : `COMBAT_DATA`, `CombatSim`, `ARENA_SIM_HASH` ; tout changement visible de `?scene=arena` et du jeu par défaut.
- **Outputs** : `ArenaMatch` ; la table de textes du HUD (`TEXTS_FR` par défaut, `TEXTS_EN`) ; Vessa (`FighterArt.VESSA`, `FOES`) ; `src/ui/play.ts`,
  `playArena.ts`, une première page de ville `playTown.ts` ; `?play=1`.
- **Critères d'acceptation** : les deux duels, gagnés et perdus, joués jusqu'au bout et appliqués ; la sauvegarde rechargée des deux côtés
  du changement de scène égale la partie continue ; `ARENA_SIM_HASH` et l'équivalence au prototype verts ; le PD à 0 px.
- **Tests** : `tests/play-duel.test.mjs` ; `tools/play-flow.mjs` dans le navigateur ; le PD. **Risques** : un écart de pixel de `?scene=arena`
  (textes, atlas) ; le chemin par défaut touché par `src/main.ts`.
- **Définition de terminé** : tests verts, fautes attrapées, parcours prouvé dans le navigateur, PD à 0 px, validation complète.

### Fait — [OK]
- **`ArenaApp`** prend une option `match` : les données du duel (une variante de `CombatData`, `src/combat/match.ts`), qui s'assoit dans le siège
  adverse, l'assistance gagnée par la préparation, la table de textes ; pas de recommencement (« R ») ; `onOver` une fois le KO montré
  (1,6 s). Sans l'option, rien ne change.
- **Le HUD** : ses mots dans une table. `TEXTS_FR`, le défaut, reprend mot pour mot ceux du prototype ; `TEXTS_EN` sert au mode jouable (choix
  K1). Les noms des actions viennent des données du duel : en anglais dans une fiche (`src/narrative/texts.ts`), et le libellé court
  « Estocade » du prototype tombe avec son nom français.
- **Vessa Lark**, le second adversaire : générée dans la grammaire de `FighterArt` (le rig du générateur, ses rampes, son contour, à ×2), plus
  légère que Marek, une lame à une main, une veste et une cape sarcelle ; elle bouge avec les images du héros, depuis le siège adverse
  (`FOES`). `buildArenaAtlas(seed, 5)` reste le même à l'octet.
- **Le mode jouable** (`?play=1`, chargé à la demande par `src/main.ts`) :
  - l'état vient de la sauvegarde (`localStorage`, et un fichier à garder ou recharger), ou d'une partie neuve (`&new=1&name=`) ; DEV :
    `&state=<état nommé>` ;
  - **la ville** : le district figé, son état du jour, sa forge, sa foule et sa météo tirés de l'état (`townQuery` : matin → `morning`,
    après-midi → `midday`, soir → la nuit ; au retour d'un duel, la fin de journée → `afternoon` jusqu'à « Let the night fall ») ; un premier
    panneau (l'horloge, les actions et leur coût, le journal, le tableau du tournoi, le fichier de sauvegarde) ;
  - **l'arène** : un rapport d'observation avant le premier coup, le duel, le résultat appliqué (`fight`), sauvegardé, puis le retour en ville ;
  - `window.__game` (l'état, les actions, `act`) pour les preuves ; `?noreload=1` garde la page et laisse l'adresse suivante dans
    `window.__go`.
- **Des états nommés** de duel : `day2-afternoon`, `day2-dusk-won`, `day2-dusk-lost`, `day3-afternoon`.

### Choix de la séance (consignés comme tels)
- **L'arène reste de nuit** pendant le duel de l'après-midi : elle n'a que cet aspect (choix G1 : « L'arène actuelle »). Lui donner le jour serait
  un changement d'aspect, préparé comme une décision (au bilan).
- Le rapport d'observation suspend la simulation (sans écran de pause) jusqu'à « Fight » : le premier coup ne part pas pendant la lecture.
- Le profil du siège adverse prend les images du héros pour Vessa : un personnage nouveau sans clips nouveaux. Sa silhouette reste proche de
  celle du héros ; une critique à l'aveugle, puis l'opérateur, en jugeront.

### Preuves
- **`tests/play-duel.test.mjs`, 5 tests** :
  - l'atlas de l'arène par défaut est celui de `main` `d129433` à l'octet (SHA-256 `f7bb50a0…`, calculé sur la copie figée) ; celui de Vessa
    ne change que les cases du siège adverse, et l'on y compte sa couleur sarcelle (≥ 200 texels sur l'image de repos ; Marek : 0) ;
  - `TEXTS_FR` reprend les mots du prototype, listés dans le test ; `TEXTS_EN` a les mêmes clés et aucun mot français ;
  - les deux duels (Vessa le jour 2, Marek le jour 3), gagnés et perdus, joués jusqu'au bout par le bot dans le `CombatSim` complet, leur
    résultat appliqué ; au retour, la fin de journée, puis la nuit ;
  - la sauvegarde rechargée des deux côtés du changement de scène égale la partie continue ;
  - les données de la fiche ne changent du prototype que les sièges et la préparation.
  - **Cinq fautes injectées une à une, fichiers rendus à l'octet** : Vessa par défaut, un mot français changé, le crépuscule oublié, le libellé
    court gardé, le mauvais aspect dans le siège adverse. **[KO → corrigé]** la cinquième passait d'abord (le test ne vérifiait que « autre
    que Marek ») ; l'oracle de la couleur sarcelle l'attrape.
- **Le PD**, contre `main` figé (`d129433`, :5187) et la branche figée (`0b823ef`, :5188), au **seuil 0**, sortie gardée et relue :
  - témoin de répétition (deux chargements de `main`, B avec personnages) : 0 px ;
  - nuit A, B, C, D (`static=1&occ=0`, 30 pas) et avec personnages (120 pas), midi en B : **0 px** les neuf ;
  - `?scene=arena`, cinq moments (`charging`, `window`, `combo`, `ko`, `strike`) avec la boucle tenue (`HOLD=1`) : **0 px**, témoin compris ;
  - `tools/arena-scene-check.mjs` sur la branche : **PASS** deux fois sur deux (empreinte égale au prototype, 42 rendus, contraste du
    télégraphe 6,9:1).
- **Le parcours dans le navigateur** (`tools/play-flow.mjs`, branche figée, SwiftShader) :
  - victoire contre Vessa (graine 1842, jour 2) et défaite contre Marek (graine 7719, jour 3) ;
  - à chaque fois : la ville rechargée depuis la sauvegarde garde le même état ; l'arène assoit le joueur nommé face au bon adversaire, HUD
    anglais ; le résultat est dans l'état ; la ville revient à la fin de journée (`afternoon`) ; **l'état final rejoué en Node a la même
    empreinte** que celui du navigateur ; 0 erreur de page.
- Une image gardée : `screenshots/calibration/l3-arena/vessa-vs-hero-combo-x2.png` (Vessa et le héros, moment `combo`, ×2) pour la critique à
  venir.

### [KO → corrigé] l'outillage sous SwiftShader
- **Le délai du protocole** : sous la charge (trois navigateurs), le bake bloque la page plus de 180 s, le délai par défaut de Puppeteer ;
  `detshots`, `arena-scene-check`, `arena-scene-shots` et `play-flow` prennent maintenant `READY_MS` comme `protocolTimeout`. Une première
  série de captures du PD a échoué entièrement ainsi ; elle a été arrêtée et refaite.
- **`arena-scene-shots` n'était pas déterministe ici** : la boucle de la page tourne entre le chargement et le premier moment, et y laisse sa
  trace (l'acclamation des spectateurs, les particules) ; en SwiftShader ce délai varie, d'où 18 % de pixels différents entre `main` et la
  branche, et même entre deux chargements de `main`. Avec `HOLD=1` (la boucle neutralisée, comme `detshots`) : 0 px. Le premier moment d'une
  page variait encore dans la barre d'actions (3 424 px, ses transitions CSS au premier affichage) : un moment de chauffe avant lui suffit.
- **`arena-scene-check` échouait sous la charge** : sa boucle vivante ne fait que 5 à 6 images en SwiftShader (une par seconde environ, le pas
  plafonné à 0,05 s), et la simulation n'avance qu'au-delà de la cinquième. Seul sur la machine, il passe sur `main` et sur la branche.
- **Le panneau de ville ne se redessine pas** quand on agit par `window.__game` : `play-flow` recharge la page depuis la sauvegarde avant
  d'entrer dans l'arène.

### Validation
- typecheck, `npm test` **128 / 128**, build, `art:validate`.

### Pensée
- Un outil réputé déterministe se revérifie sur une machine lente : sa boucle libre entre le chargement et la capture peut y écrire dans
  l'image. Le témoin de répétition le dit avant toute comparaison.
- Un échec d'outil sous la charge se rejoue seul avant d'être lu comme une régression : le même contrôle sur `main` figé départage.

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

## À reprendre (par priorité)

> Élaguée le 18/10 (Passe M3) : seul le travail ouvert reste, regroupé par thème ; ce qui est fait vit dans sa passe. Les anciens repères
> (-3 … 6) cités par les passes antérieures renvoient à la liste de `7086340` (`git show 7086340:JOURNAL.md`).

**0. Jalon M1 — clos (Passe Z4)** : le Merchant District est déclaré complet (décision RJ1) ; Gold Master : « Pas encore » (RJ3).
- **La suite, RJ2 « L'état jour »** : la direction artistique est décidée (fiche de la Passe R2, choix consignés en Passe D4 et dans
  `AGENTS.md`). Premier jet derrière `?time=day` (Passe Y1) ; midi d'après la piste de midi derrière `?time=midday` (Passe Y2), le pavois du tournoi de jour (Passe Y3), le matin et la fin de journée derrière `?time=morning` / `?time=afternoon` (Passe Y4), la météo sur chaque état (Passe Y5) ; la foule du jour (J7) décidée et appliquée (Passes R3 / D7 : matin 6, midi 12, fin de journée 9 ; la nuit garde cinq). Les tâches de la Passe D6 sont faites. Revue de l'opérateur en jeu (Passe K9) : tout est bien implémenté, la nuit reste le défaut pour le moment (J9). Orientation (Passe K10) : le héros selon la ligne de visée, les PNJ selon l'écran (décision K9). Les cycles de face et de dos du héros et son trois-quarts dos : `hero-x2-v4` (Passe K11, courses dessinées, gagnant à l'aveugle), en production depuis la Passe H11 (« Production : mets hero-x2-v4 en production à la place de hero-x2-v3. »). Ouverts : les trois-quarts des PNJ (RH4). Nouvelle direction de l'opérateur (Passe D6) : midi est la piste de midi ; quatre états (matin,
  midi, fin de journée, soir = la nuit), la météo sur chacun ; le pavois comme l'image. À appliquer dans l'ordre de la Passe D6 ; le jour par
  défaut seulement après la revue de l'opérateur en jeu (J9). Restes vus sur les captures : Passe Y1.
- **Décision de l'opérateur qui reste** : le remède au recul du fondu ancré (diagnostic, Passe K8 : options 1 à 3).

**0b. Version jouable — séance cloud (Passes N1 à N4)** : plan v4 `briefs/cloud-session-playable.md` (choix de la fiche au § 11 : écran
  titre par défaut, interface en anglais, nom choisi par le joueur, arène actuelle, poule à points, trois lieux dont un léger ; écarts avec le
  contrat projet au § 3b ; ses ajouts à la tranche au § 5 ; le relais local au § 4b) ; brief final `briefs/cloud-session-playable-brief.md` ;
  les trois contrats dans `contracts/`. **Séance lancée** (« go »), passes L0 à L7 en cours : L0 mise en route, L1 cœur headless
  (`src/simulation/`), L2 tournoi, événements et TournamentLab (`tools/tournament-lab.mjs`). Requête au relais : `000-handshake` (sans réponse à
  la Passe L2).

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
shaders d'un profil persistant, 780M sans contention (fenêtre calme, témoin à l'appui). Écartés (mesurés, Passe 6) : pré-passage de
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
  (Passe D1), H7-D2 (Passe Z2), H9-Z4 (Passe Y4), R2-Y3 (Passe K10) ; le prochain au-delà d'environ 60 Ko de passes gardées.

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
- Une première fois (programme, variante, dessin) se mesure par une sonde dédiée : aucune moyenne ne la voit. Un intervalle rAF ne
  s'attribue qu'avec un repère (le départ de la boucle, un `gl.finish()` chronométré) : le plus grand intervalle depuis le chargement est le
  plus long bloc synchrone, pas forcément la première image.
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
