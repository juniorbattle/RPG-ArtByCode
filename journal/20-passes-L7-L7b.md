# Journal de bord — archive : passes L7, Q3 et L7b (2026-10-20)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-10-20 (Passe D9) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

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

