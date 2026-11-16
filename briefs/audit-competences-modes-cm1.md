# Les compétences intuitives et les deux modes de combat : constat, mesures, propositions (Passe CM1, 15/11/2026)

Rapport de l'atelier CM1. Sa fiche d'arbitrages : https://claude.ai/artifact/KKxYTXc7z2Tvm1rhwYwC6J (`briefs/fiche-competences-modes.html`, quinze cartes CM-01 à CM-15). **Rien du jeu par défaut n'a changé** : cette passe ajoute un outil de laboratoire (`tools/auto-manual.mjs`), ce rapport, la fiche et une passe du journal.

## 1. La demande de l'opérateur (15/11/2026, mot pour mot)

« Je veux aussi consolider certains aspects... deja je trouve que la configuration de nos equipements et surtout competences n'est pas optimale. j'ai eu du mal a activer/desactiver les competences possedees, il faut que ce soit intuitif, sinon que dans les combats on va proposer deux mode... mode auto ou les competences sont actifs automatiquement  tout en respectant le systeme de gambit mais l'autre mode serait manuelle ou les competences sont activable par le joueur ( seul les attaques simple/fort, garde/esquive reste automatique ) donc plus de semi-auto avec les competences qui se lance auto meme si on peut lancer aussi nous meme »

## 2. Ce que fait le jeu aujourd'hui

### 2.1 Les trois façons de décider (le code)
- **Un seul décideur** pour Ren, `autoDecider` (`src/combat/auto.ts`, `DECIDERS.player`) : à chaque choix de Ren, `planChoice` prend la première compétence de l'ordre des quatre qui peut partir (une utilisation restante, son délai écoulé, son effet pas déjà actif) et dont la condition tient ; sinon le coup puissant (`heavyWhen`) ; sinon l'attaque simple. Les conditions (`AutoCond`, treize : `auto`, `ready`, `broken`, `incoming`, `gauge`, `hurt`, `finish`, `follow`, `open`, `start`, `foeGauge`, `warded`, `never`) sont le gambit ; `auto` est la règle de rôle de l'automatique (`autoRole`). La tactique est `kit.tactic` (le plan général) ou `kit.plans[rival]` (un plan gardé par rival, BL2), réglée par `setTactic` / `setOrder`.
- **La main** (SY-09, SL3) : `autoDuel(..., { commands })` (`src/combat/auto.ts:305-317`). Un appui nomme une compétence de Ren à un instant ; au prochain choix de Ren elle part si elle est utilisable (sinon les attaques de base, l'appui reste en attente) ; un appui en attente est remplacé par le suivant. `ArenaApp.press(i)` (`src/arena/ArenaApp.ts:472`) refait le duel depuis le début avec tous les appuis (`AutoReplay.replace`, `src/arena/autoView.ts:462` : un tirage par coup garde toutes les lignes déjà jouées, vérifié ligne à ligne, sinon rejeu silencieux jusqu'à l'instant). Les touches `skill1` à `skill4` (1 à 4, remappables), la croix de la manette (haut, droite, bas, gauche), un clic sur la ligne de la barre (`AutoHud.ts:140`).
- **Les trois à la fois** : la tactique lance les compétences seule et l'on peut aussi les lancer : c'est la semi-auto que l'opérateur ne veut plus. Un appui accepté **même en pause** (vérifié dans l'arène : `press` pendant `paused = true` renvoie vrai et enregistre l'appui) ; « Passer » joue le reste du duel par la tactique avec les appuis faits ; `V2State.$pending` (SY-10, `src/ui/playArena.ts:105`, `settlePending` dans `advance.ts`) écrit à l'ouverture de l'arène le résultat que la tactique donne : celui d'un combat quitté ; la répétition de maître Corvin (`v2prep.ts`) joue le plan, jamais la main ; le carnet lit le duel joué (`boutNote`, les appuis compris).
- **Le contrat projet § 6.1**, tel que SY-13, AC-19 et BL1 l'ont amendé, écrit : « …les compétences sont des coups d'éclat comptés, un nombre d'usages par combat selon leur niveau et un délai entre deux, lancés selon le plan de combat préparé par le joueur, une condition par compétence et un plan par rival, **ou à sa main pendant le combat**… ». La clause en gras est ce que les deux modes réécrivent.

### 2.2 Ce que l'opérateur a décidé (à citer, `briefs/combat-auto.md`)
- AC-09 « L’automatique qui place ses soutiens ; le joueur règle ses quatre compétences et leur ordre » ; AC-10 « L’automatique d’abord ; le semi-automatique revu après mon essai » (§ 15.1) ; **SY-07 « Les trois : l’automatique, la tactique, la main »** (remplace AC-10) ; SY-08 « Une condition par compétence, l’ordre gardé » (gardé par PB-1, BL2) ; **SY-09 « Au prochain choix de Ren, une compétence en attente »** ; **SY-10 « Le résultat de la tactique écrit à l’ouverture »** ; SL1-3 (l'automatique garde la plus forte pour la rupture) ; SL1-7 (le coup puissant jamais l'une des quatre) ; BL2 (le plan de combat, un plan par rival ; § 36).
- **Décisions A3 voisines** (§ 26.1, § 33) : SY-02, SY-05, **SY-13** (le § 6.1 amendé), AC-19, PB-1, PB-3, **BL1** (le § 6.1 amendé de nouveau, « Oui, l'amender »), BL1-3, BL1-9. SY-07, SY-08, SY-09 et SY-10 ne sont **pas** des A3 : ce sont des choix ordinaires de la fiche SY1 (quatorze sur quatorze à la recommandation, journal Passe SY2).

### 2.3 Le résumé de ce que les deux modes changent
| | aujourd'hui | auto | manuel |
|---|---|---|---|
| qui lance une compétence | la tactique, et la main en plus | la tactique seule | le joueur seul |
| attaque simple, coup puissant, garde, esquive | automatiques | automatiques | automatiques |
| tactique, plan par rival | lus | lus | gardés, non lus |
| touches 1 à 4, croix, clic sur la barre | lancent | ne font rien | lancent |
| « Passer » | tactique + appuis faits | tactique | rend le reste à l'auto |
| résultat d'un combat quitté (SY-10) | résultat de la tactique | idem | idem (le plan) |

## 3. Le constat : la configuration jouée

Joué dans un vrai navigateur (Chrome, Puppeteer, touches réelles : `tools/` + scripts de bloc-notes), à 1920 × 1080 et 1280 × 720, sur `v2-day7-training` (terrain d'entraînement), `v2-day1-morning` (quai) et `v2-day2-afternoon` (fiche de match), avec seize compétences possédées. La manette : `tools/pad-proof.mjs`, 52 contrôles verts, 8 en échec (voir § 7).

### 3.1 Quatre défauts
1. **Espace ne fait rien sur les trois places** (terrain d'entraînement, parvis, halle). `talk` est lié à E **et à Espace** (`src/settings/keys.ts:45`) ; `playPlaza.ts:76` et `playForecourt.ts:36` appellent `preventDefault()` sur cette action même quand une page est ouverte, ce qui coupe l'activation native d'un bouton par Espace (l'écouteur `ActorSystem` du quai ne le fait pas : sur le quai, Espace marche). Le pied de page de la page des compétences annonce « Espace · Laisser de côté / Emporter » : la touche ne répond pas là où le joueur prépare (maître Corvin est au terrain d'entraînement). Entrée marche partout (activation native). La manette, dont X est Espace, subit la même chose sur les places. `wares.ts` a son propre écouteur d'Espace et marche.
2. **Laisser de côté se perd** : la page passe à « 3 sur 4 » mais `setLoadout` exige exactement quatre compétences (`v2skills.ts`) ; la page n'agit que quand il y en a de nouveau quatre. Échap puis K : la compétence est revenue sans un mot (capture `k03`).
3. **L'« Attaque puissante »** est dans la liste et se laisse « emporter » (4 sur 4, Entrée permis) alors que le jeu la refuse (`v2.loadout.heavy`, SL1-7) ; l'ordre à gauche n'en montre que trois (capture `k05`).
4. **La liste n'est qu'une fenêtre** : 44 px de haut à 1280 × 720 sur la page K (moins d'une ligne de 60 px), 76 px sur la fiche de match, 204 px (trois lignes et demie) à 1080p avec seize compétences : jamais les quatre portées d'un coup.

### 3.2 Ce qui n'est pas évident
- **Quatre gestes, quatre endroits** : posséder (la liste), emporter (le carré, Espace), ordonner (← →, A et D au QWERTY ; l'ordre est dans la colonne de gauche, sous le héros), régler (C fait défiler la condition du rôle, jusqu'à sept, sans montrer les autres).
- **Plein, il faut d'abord laisser de côté** puis emporter : deux gestes, avec le défaut n° 2 entre les deux.
- **La condition courante** n'est lue que dans l'ordre à gauche (page K) ; sur la fiche de match le plan est tout en bas de la colonne de gauche, sous le pli à 1080p (capture `m02`).
- **L'ultime et la super** : une phrase fixe en bas de page et un refus après coup.
- **Le plan général et le plan d'un rival** : la même page sert pour K (plan général), la fiche de match (le plan gardé pour ce rival, ligne « Gardé pour tes combats contre… ») et la fiche avant un défi ; rien ne dit lequel on règle avant de lire une ligne.
- **La barre du duel** (`a01`) montre 1 à 4 devant les compétences et ne dit nulle part qu'elles partent aussi seules.
- Équipement (`g01`) : page nette ; sac vide, un grand vide ; les quatre emplacements sont des lignes de texte, non des cases à remplir.

Captures (publiées avec la fiche, hors du dépôt) : `k05-heavy-brought`, `k01-open-1280`, `k03-reopen-lost`, `m02-matchsheet`, `a01-arena-hud`, `g01-gear`.

## 4. Les propositions

### 4.1 La page (CM-02 à CM-05)
**A, recommandée : « Quatre places et un catalogue »** : une page. En haut les quatre places, des cartes dans l'ordre d'emploi (nom, famille, rang, niveau, usages et délai, la condition en une phrase avec un menu qui liste toutes celles du rôle, ← → pour avancer ou reculer, « Retirer »), une place libre en pointillé ; en dessous le catalogue de ce qu'on possède, par filtre de famille, chaque tuile disant « ✓ place 2 », « libre », ou la raison grisée (« Une ultime au plus : l'Estoc est à la place 3 »). Un clic ou Entrée sur une tuile la place dans la première place libre, ou demande « remplacer laquelle ? » quand les quatre sont prises ; sur une place, retire. Le remplacement est atomique (le jeu exige quatre compétences : la place libre n'existe qu'à l'écran tant que le choix n'est pas fini) ; tout est gardé à l'instant, Échap ferme sans perte. L'attaque puissante quitte le catalogue (une attaque de base : une ligne « toujours : attaque simple, coup puissant »). **Maquette jouable dans la fiche** (CM-02), rendue aussi en images à la publication.
B : garder la page, ne réparer que les défauts du § 3.1. C : deux écrans, le catalogue (K) et le plan (fiche de match).
Gestes (CM-03) : Entrée ou clic place ou retire ; Suppr ou Retour arrière retire la place choisie ; ← → ordonnent ; C ouvre la liste des conditions ; manette : A place ou retire, X retire, gâchettes ordonnent, Y condition ; Espace reste accepté partout.
Équipement (CM-06) : présentation seulement, **après** la fusion du chantier 5 (`wares.ts` est son fichier) : quatre cases du même dessin.

### 4.2 Les deux modes (CM-07 à CM-14)
- **Un champ du kit**, `kit.mode: 'auto' | 'manual'`, dans la partie (il décide le résultat des combats : hors écran, SY-10, la répétition) ; auto au départ ; une sauvegarde d'avant : auto (CM-08). L'interrupteur sur la page des compétences, la fiche de match et la porte de l'arène.
- **Auto** : `kit.tactic` et `kit.plans` comme aujourd'hui ; les touches 1 à 4, la croix et le clic ne font rien (la barre montre la condition de chaque compétence, aucune touche).
- **Manuel** : la tactique n'est pas lue (le décideur de Ren ne prend aucune compétence de lui-même) ; les appuis passent par `commands` comme aujourd'hui (le mécanisme SY-09 existe, prouvé : l'arène relance le duel avec les appuis) ; la barre montre 1 à 4 et cerne la compétence prête. Un appui en attente reste « au prochain choix de Ren » ; **les appuis en pause restent acceptés** (CM-10 : pause tactique) ; « Passer » rend le reste à l'auto et le dit.
- **Les mêmes règles de duel dans les deux modes** : rien du duel ne change, la course (PB-3) ne bouge pas, la répétition et le hors-écran jouent le plan.
- **Les plans** : gardés, cachés en manuel ; la condition `never` (« Jamais : seulement à ma main », `auto.cond.never`) devient « Désactivée : jamais en auto » (CM-12).
- **Résultat d'un combat quitté** : celui du plan, dans les deux modes ; la répétition le dit en manuel (CM-13).
- **Tutoriel et guide** : une dixième leçon à la première partie manuelle ; « Le duel » et « Préparer un combat » à jour ; les actions `skill1` à `skill4` du remappage renommées « (manuel) » ; la croix de la manette active en manuel seulement (CM-14).

## 5. Les mesures (laboratoire, rien dans le jeu)

`node tools/auto-manual.mjs --policies=planner,reference,curious --seeds=101..300` (Node seul ; `tools/auto-lab.mjs` comme bibliothèque). Le décideur de Ren (`DECIDERS.player`) est remplacé pour des parties entières du TournamentLab ; les rivaux gardent l'automatique du jeu. Les parties : celles de la Passe BE1 et suivantes (le jeu au `c75e1e4`, la course de GP4-2 en vigueur), 200 parties tenues à part.

Un joueur manuel est modélisé par **ce qu'il veut lancer** (`wish` : `general` = la règle de rôle de l'automatique, le jugement d'un expert ; `ready` = chaque compétence dès qu'elle est prête, le débutant ; `none`) et **comment il appuie** (`lag` : l'appui est le souhait formé `lag` choix de Ren plus tôt ; `lapse` : un appui oublié sur `lapse` ; `bonus` : la puissance des compétences qu'il lance × `bonus`). Un choix de Ren revient toutes les une à trois secondes : « un choix en retard » veut dire qu'il agit sur ce qu'il a lu au choix d'avant.

Titres sur 200 parties (planificateur / référence / curieux) :

| Joueur | planif. | réf. | curieux |
|---|---|---|---|
| **automatique (le jeu)** | 24 | 33 | 25 |
| manuel, jugement du plan général, à temps (contrôle : identique, au tour près) | 24 | 33 | 25 |
| … un choix en retard | 10 | 16 | 5 |
| … deux choix en retard | 4 | 4 | 3 |
| … oublie un appui sur quatre | 14 | 28 | 12 |
| … oublie un appui sur deux | 7 | 13 | 7 |
| manuel, dès que prêtes (le débutant) | 10 | 12 | 3 |
| manuel, aucun appui | 0 | 0 | 0 |
| un choix en retard, compétences ×1,15 | 18 | 29 | — |
| un choix en retard, compétences ×1,3 | 29 | 47 | — |
| à temps, compétences ×1,15 | 39 | 49 | — |

Étapes : le joueur qui n'appuie sur rien sort en poule (jour 4 : 18 %, jour 5 : 3 %) ; le planificateur en retard d'un choix passe la poule du jour 5 à 62 % (86 % automatique).
Durées (planificateur) : 109 / 167 / 199 s en auto (poule, tableau, finale) ; 114 / 165 / 187 s en retard d'un choix ; 126 / 157 / 178 s sans appui : le rythme tient dans les durées de SL1-2.

**Lecture.** (1) Les compétences portent le jeu : sans appui, 0 % de titres. (2) Un manuel qui joue le jugement de l'automatique **à temps** fait exactement l'automatique : le manuel n'est jamais plus facile, il est au mieux égal. (3) Dès qu'il lit l'arène un choix en retard (une à trois secondes), le manuel perd 14 à 17 points de titres : le gambit réagit à l'instant, une main non. (4) Le plan par rival mesuré en CF2 (54 % de titres contre 33 %) dit la marge qu'un joueur qui connaît ses rivaux peut gagner par le jugement seul ; le manuel peut l'atteindre, l'auto aussi, avec un plan réglé par rival. (5) Une récompense de ×1,15 sur les compétences lancées à la main met un joueur à temps à 39 % et 49 % : très au-dessus de l'auto ; l'effet d'un bonus est fort. **Donc** : si les appuis restent permis en pause (CM-10), le manuel peut être neutre ; sans la pause, il est plus dur et demanderait un bonus de l'ordre de ×1,15 à ×1,3 pour un joueur qui lit avec une ou deux secondes de retard.

**Limites** : un modèle, non une personne (le retard est quantifié en choix de Ren, un grain de une à trois secondes ; une réaction de 0,5 s n'est pas mesurable avec lui) ; il ne mesure ni l'agrément ni le ressenti ; le jugement du joueur modèle est celui de l'automatique, non meilleur : il borne l'écart sans mesurer le plafond. À juger en jeu par l'opérateur.

## 6. Ce qui touche une décision A3
- **Le contrat projet § 6.1** (A3 : SY-13, AC-19, BL1) : la clause « ou à sa main pendant le combat » est réécrite par les deux modes. Aucune réécriture sans l'A3 : la fiche CM-07 porte le texte proposé et le choix « décision A3 : change le § 6.1 du contrat projet ». Ce qui reste du § 6.1 est inchangé.
- **PB-3** (la course calée sur le planificateur à 50 %) : aucune option de la fiche ne la change ; l'automatique n'est pas modifié, la course n'est pas recalée. CM-11 le dit.
- SY-07, SY-09, SY-10 (non A3) sont changés ; SY-08, AC-09, BL2, SL1-3, SL1-7 gardés.
- Le contrat de gameplay § 1 (« combat en tour par tour dynamique, contrat projet § 6.1 ») renvoie au § 6.1 : pas de texte propre à amender.

## 7. Écarts consignés (non tranchés)
- Le **pad-proof** échoue déjà sur huit contrôles avant ce travail, tous des attentes périmées de l'outil : la liste des pages du menu (maître Corvin y a sa page depuis BL3, la marche LB / RB en compte quatre) et les six contrôles de réglages qui en dépendent ; le pied de la fiche de match (l'outil attend « X, D-pad gauche, D-pad droite, A, B » ; la touche C / Y de la tactique s'y est ajoutée) ; le pied du duel (la croix de la main s'y est ajoutée). Les nombres 4 3 4 (laisser de côté, reprendre) sont verts. À remettre à jour avec la construction.
- `tools/auto-tactics.mjs` référence encore `AU.tacticChoice` (absent depuis La Brute) et les PA : ses modes ne tournent pas sur le jeu d'aujourd'hui ; `tools/auto-manual.mjs` n'en dépend pas.
- Une demande de l'opérateur de ce jour : « consolider certains aspects » : la configuration de l'équipement est ici une présentation seulement (CM-06) ; le catalogue, les prix, la revente et les effets des pièces sont au chantier 5.

## 8. Le plan de construction (après la relecture)
1. Consigner chaque décision mot pour mot (les A3 d'abord), amender le § 6.1 si CM-07 le choisit, le dire au journal.
2. Les défauts du § 3.1 (l'Espace des places d'abord, avec un test sur l'écouteur).
3. `kit.mode`, une action `setMode`, la lecture dans `v2KitOf` / `autoRen` (un plan jamais lu en manuel), le duel et le hors-écran inchangés ; la sauvegarde d'avant en auto.
4. La page des compétences (`src/ui/skills.ts`), la fiche de match et la fiche avant un défi ; les gestes clavier, souris, manette ; l'attaque puissante hors du catalogue.
5. L'arène (`ArenaApp.press`, `AutoHud`, `autoView`) : les touches 1 à 4 inactives en auto, la barre en deux versions, « Passer » en manuel, SY-10 et la répétition.
6. Textes anglais et français (`en.ts`, `fr-texts.ts`), tutoriel (une leçon), guide, remappage (noms), manette.
7. Tests : `tests/auto-hand.test.mjs` refait pour le mode ; chaque règle contre un oracle ; chaque texte dans les deux langues ; `tests/pad.test.mjs`, `settings`, `tutorial`, `language`, `texts`.
8. Preuves dans le navigateur (DEV port libre) : `auto-arena-proof`, `gauge-proof`, `tutorial-proof`, `play-flow`, `pad-proof` (mis à jour), `remap-proof`, `ui-text`, en `PAGE_LANG=fr`, `REDUCED=1`, `MOTION=reduce`.
9. La course n'est recalée que si une mesure l'exige (aucune règle du duel ne change). Rebase sur `origin/main` (le chantier 5), journal, fusion en avance rapide.
