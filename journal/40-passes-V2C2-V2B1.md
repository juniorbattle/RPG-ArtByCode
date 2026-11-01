# Journal de bord — archive : passes V2C2, V2B1 (2026-10-29 → 2026-10-30)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-11-01 (Passe CA3) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe V2C2 — L'équilibrage de la version 2 recalé après V2-2 : les rivaux plus rudes, de nouveau six combats sur dix (2026-10-29)

### Les décisions de l'opérateur, mot pour mot (relayées par la séance de la Passe FV3)
- Question : « Fait-on durcir les rivaux pour revenir vers 60 % ? » ; réponse de l'opérateur : « Oui, recaler ». L'objectif : revenir vers 60 % de
  victoires du joueur préparé, avec la charge que rien ne coupe (V2-2), comme après la Passe VP4 ; vérifier la durée des duels et les blessures.
- **Exception à la règle d'une branche**, comme l'AV-18 : question « Le recalage peut-il ouvrir sa branche malgré `ren-cut-x3` ? » ; réponse de
  l'opérateur : « Oui, exception ». La branche `ren-cut-x3` (la séance de Marek, dans sa propre copie de travail) reste ouverte et n'est pas touchée ;
  branche `v2c2-recalage` depuis `main` (`3bff52e`), les mesures faites avant sa création. Pendant le recalage, la Passe RC3 (`ea93a6c`) a été
  fusionnée dans `main` et a archivé la Passe VP9 : le commit du recalage a été refait sur elle (aucun fichier commun hors du journal ; l'archive de
  VP9 de cette séance, au corps identique à l'octet, laissée pour la sienne), ce qui permet l'avance rapide.

### Le réglage retenu — [OK] (`src/combat/v2duel.ts`, derrière `flags.v2`)
- **`V2_FOE_HIT` 1,3 → 1,45** (les coups et les compétences des sept rivaux) et **`V2_FOE_HP` = 1,2**, nouveau (leurs PV, 20 % de plus).
- **Écart à la proposition de la Passe V2C1 (× 1,8 sur les coups seuls)** : elle retrouve bien 60,4 %, mais des duels tombent sous les « 5 à 10
  minutes » de l'opérateur [G5] (C2-2 « Comme mesurées (5 à 9 min) ») : le joueur faible (adresse 0,2) perd contre Marek en 4,0 min et contre Orla en
  4,4, contre Marek à 0,4 en 4,9 ; 4 cases sur 35. Des coups plus forts raccourcissent les duels que le joueur perd ; des PV plus hauts les
  rallongent. Le mélange retenu tient les trois critères : 60 %, chaque duel moyen entre 5 et 10 min, moins de blessures qu'en VP4.
- **La course hors écran remesurée** (`V2_RACERS`, comme en V2C1 : étalonnage sur les graines 1..40, vérification sur 41..60, écarts sous 6 % ; le
  test rejoue 41..46) : chaque mise à terre 1,2 fois plus longue, chaque cadence de dégâts environ 1,11 fois celle de la Passe V2C1. Marek reste le
  plus fort, Tobin le plus faible.
- Le duel de l'ancien schéma (`input=keys`) joue contre les mêmes rivaux (AV-5, « l'ancien schéma gardé pour comparer ») : il prend leurs nouveaux
  nombres, voulu.

### Les réglages essayés — TournamentLab `--rules=v2` (50 graines : le préparé, adresse 0,6 ; 30 graines : 0,75 et 0,9) et durées (bot, 20 duels par case, 7 rivaux × 5 adresses)
La course mise à l'échelle pour les essais (une estimation), remesurée pour le réglage retenu.

| coups / PV | préparé | blessures | champion | 0,75 (champion) | 0,9 (champion) | duel moyen le plus court | cases sous 5 min | le plus long |
|---|---|---|---|---|---|---|---|---|
| VP4 (1,3 / 1, avant V2-2) | 60,4 % | 2,10 | 0 % | 82,0 % (20 %) | 93,3 % (67 %) | 5,3 min (Tobin à 0,9) | 0 / 35 | 10,1 |
| V2C1 (1,3 / 1) | 84,0 % | 0,90 | 28 % | 97,3 % (87 %) | 99,3 % (97 %) | 4,6 (Vessa à 0,9) | 1 / 35 | 10,0 |
| 1,8 / 1 | 60,4 % | 1,90 | 4 % | 81,3 % (23 %) | 94,0 % (70 %) | 4,0 (Marek à 0,2) | 4 / 35 | 8,2 |
| 1,5 / 1,2 | 59,6 % | 1,94 | 4 % | 80,7 % (17 %) | 95,3 % (77 %) | 4,9 | 1 / 35 | 9,8 |
| 1,6 / 1,15 | 58,0 % | 1,72 | 4 % | 80,0 % (13 %) | 95,3 % (77 %) | 4,7 | 2 / 35 | 9,4 |
| 1,6 / 1,25 | 48,6 % | 2,02 | 2 % | 74,0 % (10 %) | 91,3 % (57 %) | 4,7 | 2 / 35 | 10,2 |
| 1,4 / 1,3 | 60,0 % | 1,86 | 4 % | 81,3 % (13 %) | 95,3 % (77 %) | 5,25 | 0 / 35 | 10,6 |
| 1,5 / 1,25 | 57,2 % | 2,02 | 4 % | 79,3 % (13 %) | 94,7 % (73 %) | 4,9 | 1 / 35 | 10,2 |
| 1,45 / 1,25 | 60,8 % | 2,02 | 4 % | 80,0 % (13 %) | 95,3 % (77 %) | 5,1 | 0 / 35 | 10,2 |
| **1,45 / 1,2 (retenu, course remesurée)** | **60,4 %** | **1,74** | **4 %** | 84,0 % (27 %) | 95,3 % (77 %) | **5,1 (Marek à 0,2)** | **0 / 35** | **9,8 (Rhosk à 0,6)** |

### L'état livré — [OK]
- Le joueur préparé : **60,4 %** des combats gagnés (VP4 : 60,4 % ; V2C1 : 84,0 %), 1,74 blessure par partie (2,10 ; 0,90), qualifié 88 %,
  finaliste 18 %, couronné 4 % ; l'oisif 0 % ; l'adresse 0,4 2,5 % (VP4 14,5 %), 0,75 couronné 27 % (20 %), 0,9 couronné 77 % (67 %).
- Par rival à 0,6 (victoires, durée moyenne ; VP4 entre parenthèses) : Marek 0 %, 7,7 min (10 %, 7,9) ; Vessa 85 %, 6,4 (75 %, 8,3) ; Orla 50 %, 8,1
  (55 %, 8,0) ; Cassius 95 %, 8,7 (100 %, 8,1) ; Ilse 80 %, 9,1 (90 %, 9,1) ; Rhosk 75 %, 9,8 (100 %, 8,6) ; Tobin 100 %, 6,3 (100 %, 5,7). Marek
  reste le plus dur (100 % seulement à 0,9, en 9,6 min). Des duels isolés sortent des bornes (3,97 à 10,85 min), comme en VP4 (4,7 à 12,8).
- La tentative de sabotage de Cassius (V2-14), devenue rare en V2C1 (1 partie diligente sur 40), revient dans 16 sur 40 (21 en VP4) ; 7,55 nuits
  de garde payées par partie (VP4 7,58).

### Les preuves
- `npm run typecheck`, `npm test` **280 / 280** (code de sortie 0, vérifié), `npm run build`, `npm run art:validate` (0 erreur, 0 avertissement).
- Tests : la marche de la Passe VP4 retrouvée (graines 1..12 : le préparé 65 %, aucune couronne ; l'expert 93 %, couronné 67 %), `V2_FOE_HIT` et
  `V2_FOE_HP` épinglés ; la durée des duels bornée à **5 à 10 min** (au lieu de 5 à 13 : la cible de l'opérateur) ; la course sur 41..46 ;
  `tests/v2-coherence.test.mjs` garde la partie de la graine 34 (elle porte la tentative). **6 fautes injectées sur le réglage, 6 attrapées** (les
  coups revenus à 1,3, les PV non relevés, les coups seuls à 1,8, les PV appliqués deux fois, la course de la Passe V2C1 gardée, les PV donnés au
  joueur aussi) ; **les 14 fautes de la règle (Passe V2C1), 14 attrapées** de nouveau ; chaque fichier rendu à l'octet.
- **`V2_SIM_HASH`** mis à jour (les rivaux changent, le script non) : `1857:5:idle:0.525:41.025:-:-;7125:0:idle:1.033:41.125:-:-;73.267|1:1.925:` ;
  le script passe encore par chaque chemin de V2-2 (35 coups reçus sans garde, 23 gardés, 3 esquives, un break et un K.O. charge tenue, 60
  relâchés qui attendent, 118 départs, aucune coupe ni refus).
- **Le jeu par défaut inchangé** : TournamentLab `classic` et `dynamic`, `diligent` et `idle`, 50 graines, et `DYNAMIC_SIM_HASH` : JSON identique à
  l'octet à celui de `main` avant V2C1 (`94e15ca`, SHA-256 `40fa7aa7…`).
- Sur GPU (Radeon 780M, `dev-strict` :5186 par `preview_start`, son onglet fermé aussitôt, arrêté à la fin) : `arena-scene-check` **PASS** sous
  `v2=1` (le contrôle vivant avance de 4,917 s, l'empreinte `sameAsRecorded`, 87 rendus de moments sans erreur, télégraphe 6,77:1 et 6,97:1 en
  deutéranopie, le sol dégagé du HUD dans 77 cas), sous les règles d'aujourd'hui (`sameAsPrototype`) et `combat=dynamic` (`sameAsRecorded`) ;
  `play-flow` `V2=1` victoire (1842, jour 2) `5cfe614a12cc08bd` et défaite (7719, jour 2) `671a95a659b6ac06`, rejouées en Node à la même empreinte ;
  par défaut, victoire `0025acce7a403773` ; « all checks passed », aucune erreur de page.
- Documents : `briefs/v2-trial.md` (l'équilibrage), `briefs/combat-system.md` § 4b (le renvoi), `AGENTS.md` (`V2_FOE_HIT`, `V2_FOE_HP`).

### Pensée
- Un recalage de difficulté se vérifie aussi par la durée des duels : un seul levier (les coups) rend les défaites courtes ; deux leviers opposés
  (les coups et les PV) règlent ensemble le taux de victoires et la durée.

## Passe V2B1 — La décision V2-4 de l'opérateur : la règle des blessures de la version 2, seul un K.O. par un coup puissant blesse (2026-10-29 → 2026-10-30)

### Demande
- La décision de l'opérateur sur la fiche de l'essai (Passe FV3) : V2-4 « Les blessures sous la version 2 » = « Revoir (tâche à part) ». Séance ouverte par celle de la
  Passe FV3 ; branche `v2b1-blessures` depuis `main` (`7089fa7`). Tout derrière `flags.v2`.

### Le diagnostic — TournamentLab `--rules=v2`, 50 graines, l'équilibrage de la Passe V2C2 (script hors dépôt qui suit chaque combat du joueur)
- **D'où elles viennent** : joueur préparé (`diligent`, adresse 0,6), 1,74 blessure par partie, 87 en tout : **47 victoires serrées (54 %)**, 40 K.O. par un coup puissant
  (46 %). 31 % de ses victoires finissent sous 15 % des PV et 60 % sous 25 % : sous la charge que rien ne coupe (V2-2), le joueur encaisse pour charger ; le seuil de 15 %,
  venu de l'arène d'aujourd'hui, tombe au milieu de ses victoires ordinaires. Bon joueur (0,75) : 1,26 par partie, 50 des 63 sur des victoires serrées, 39 contre Orla ;
  expert (0,9) : 0,30, 11 contre Marek ; celui qui ne prépare rien (`idle`, 0,3) : 1,62, ses K.O. seuls (il ne gagne rien). Défaites du préparé : 47 sur un coup léger,
  40 sur un coup puissant, 12 sur une compétence.
- **Ce qu'elles coûtent** : -20 % des PV par niveau, deux niveaux au plus. Trois réponses : le repos (un créneau, un niveau), Sœur Anwen (un créneau et 8 pièces, ou gratuite
  après l'aumône du Temple ; tous les niveaux), l'onguent de Mara (10 pièces de jour, sans créneau, un niveau).
- **[?] Une limite du laboratoire, à savoir** : la politique `diligent` se soigne toujours le soir même, par le repos, un soir qu'elle laisse sinon vide (la garde payée ne
  prend pas de créneau). Ses 0 combats livrés blessé rendent **victoires, couronnes, entraînements, nuits de garde et pièces identiques sous toutes les règles** : le
  laboratoire ne voit pas le prix du soir perdu, que paie un joueur réel (les veilles, les informateurs, le vol, les événements de nuit). Elle n'utilise jamais la guérisseuse
  ni l'onguent. Pour mesurer le poids d'une blessure, un joueur préparé qui ne se soigne jamais (il décide comme s'il était indemne) : il ne gagne que **24 %** des combats livrés
  blessé (60 % sinon), 46,6 % sur la partie au lieu de 60,4 %, finaliste 6 % au lieu de 18 %.
- **Les contrats** : gameplay § 11, mot pour mot, « L'échec doit produire une nouvelle situation. Exemples : blessure → soin, repos ou nouvelle composition » ; § 14, verrous 5
  « Le temps crée des choix macro, pas de la micro-punition » et 9 « L'échec ouvre des réponses ». Une victoire qui blesse n'est pas un échec.

### Les règles mesurées
| Blessures par partie (50 graines) | ne prépare rien | préparé | bon | expert | préparé sans soins : victoires | mot de la guérisseuse, parties préparées / 50 |
|---|---|---|---|---|---|---|
| Aujourd'hui : K.O. puissant, ou victoire sous 15 % | 1,62 | 1,74 | 1,26 | 0,30 | 46,6 % | 45 |
| **A. K.O. par un coup puissant (choisie)** | **1,62** | **0,80** | **0,26** | **0,02** | **55,4 %** | **28** |
| B. A, ou victoire sous 5 % | 1,62 | 0,92 | 0,60 | 0,06 | 53,8 % | 32 |
| C. K.O. par un coup puissant ou une compétence | 2,32 | 1,04 | 0,38 | 0,08 | 54,0 % | 37 |
| D. Toute défaite | 4,00 | 1,98 | 0,80 | 0,22 | 46,5 % | 50 |

- Identiques sous les cinq règles, pour le joueur qui se soigne : préparé 60,4 %, qualifié 88 %, finaliste 18 %, couronné 4 % ; bon 84,0 %, 100 %, 80 %, 24 % ; expert 95,6 %, 100 %,
  100 %, 78 % ; `v2-gear-tamper` 22 parties préparées sur 50, `rival-injured` 37. Aucun événement de la version 2 ne lit `player.injury` hors de `healer-offer`, et les
  rivaux hors écran ne se blessent déjà qu'à la défaite (`playOffscreenMatches`, inchangé).

### La fiche — [OK] 2 choix sur 2, enregistrés et relus
- Page privée https://claude.ai/artifact/F1h2YdHuQY4oiy3Q1i4Vfo (source `briefs/fiche-v2b1.html`), collection `decisions` vide à la publication, relue par `list` : 2 documents,
  cliqués le 30/10 à 12 h 24 UTC, aucune note. Message de l'opérateur, mot pour mot : « Fiche remplie ».

| # | Décision | Recommandation | Choix de l'opérateur | Note | |
|---|---|---|---|---|---|
| V2B1-1 | Quand un combat blesse-t-il le joueur ? | « A. K.O. par un coup puissant » | « A. K.O. par un coup puissant » | — | = |
| V2B1-2 | L'effet d'une blessure et ses trois réponses | « Garder » | « Garder » | — | = |

### Fait — [OK] (`src/tournament/pool.ts`, `applyPlayerDuel`)
- Sous `flags.v2`, `hurt` = défaite dont le coup final est de genre `heavy` ; une victoire ne blesse jamais, à aucun seuil. Une ligne ; le jeu par défaut et `combat=dynamic`
  gardent leur règle (K.O. puissant, ou victoire sous 15 %). Le coup final vient du même `kind` dans le duel réel (`ArenaApp`, événement `impact`) et chez le bot. L'effet (-20 % par
  niveau, deux niveaux) et les trois réponses ne changent pas (V2B1-2). Aucun texte neuf : `duel.injured` dit toujours la blessure et ses réponses.
- `briefs/v2-trial.md` (la règle), `AGENTS.md` (le paramètre `v2=1`, la liste des tests).

### Les preuves
- `npm run typecheck`, `npm test` **287 / 287** (code de sortie 0, vérifié, 7 tests de plus), `npm run build`, `npm run art:validate` (19 manifestes, 40 sources, 0 erreur).
- `tests/v2-injury.test.mjs` (7 tests, oracles écrits depuis le texte des décisions) : une victoire v2 ne blesse à aucun PV (1 PV, 5 %, 14,99 %, 15 %…) ni sur aucun coup final ; une
  défaite v2 blesse sur `heavy` seul, à tout niveau de l'adversaire ; deux niveaux au plus ; **le jeu par défaut à sa borne** (14,99 % blesse, 15 % non), sous les deux règles ;
  l'effet et les trois réponses (créneau, pièces, niveaux) ; douze parties entières (préparé et oisif) : chaque blessure suit un K.O. puissant et chacun blesse, les cas séparés par
  la règle atteints (le test compte les K.O., les victoires serrées et les autres défaites) ; les chiffres de la décision sur 50 graines (0,80 et 1,62 blessure, 60,4 %, couronné 4 %).
- **16 fautes injectées sur 16 attrapées**, chaque fichier rendu à l'octet (SHA-256) : la règle d'avant en v2, le drapeau inversé, la victoire serrée retirée partout, les règles B, C et
  D, aucune blessure en v2, le seuil du défaut à 0,14 et en `<=`, un plafond à trois niveaux, la blessure sans message, l'effet à 10 %, le repos qui soigne tout ou sans créneau, Anwen
  à un seul niveau, l'onguent qui soigne tout.
- **La règle livrée égale l'essai A** : le JSON du diagnostic sur 50 graines (six joueurs) identique à celui du réglage temporaire, retiré avant le commit.
- **Le jeu par défaut inchangé** : TournamentLab `classic` et `dynamic`, cinq politiques (`diligent`, `idle`, `careful`, `careless`, `losing`), 50 graines : dix JSON **identiques à
  l'octet** à ceux de `main` figé (`7089fa7`, `cmp` fichier par fichier ; SHA-256 de l'ensemble `26ba5ad1…` des deux côtés).
- Sur navigateur (Radeon 780M, `dev-strict` :5186 par `preview_start`, son onglet fermé aussitôt, arrêté à la fin) : `play-flow` `V2=1` victoire (1842, jour 2) `5cfe614a12cc08bd` et défaite (7719, jour 2) `671a95a659b6ac06`, rejouées en Node à la même
  empreinte ; par défaut, victoire `0025acce7a403773` ; « all checks passed », aucune erreur de page. Mêmes empreintes qu'en Passe V2C2 : ces deux combats scriptés ne dépendent pas de la
  clause retirée (la victoire n'est pas serrée, la défaite ne passe par aucune victoire) ; c'est `tests/v2-injury.test.mjs` qui la garde.

### Journal — [OK] archivage (passes gardées au-delà d'environ 60 Ko)
- Les passes gardées seraient passées au-delà de 60 Ko avec celle-ci. FV1, FV2 et FV3, closes (fusionnées), partent vers `journal/36-passes-FV1-FV3.md` (bloc de 7396 octets) ; restent
  48.3 Ko avant cette passe. Preuve par un script hors dépôt contre la copie de `JOURNAL.md` d'avant le déplacement (8 contrôles, contrôle négatif compris) ; la liste
  des derniers archivages de « À reprendre » suit.

### Restes [?]
- Le prix réel d'une blessure (le soir perdu, le choix du soin) reste à juger dans l'essai en jeu de l'opérateur : le laboratoire ne le mesure pas. La politique `diligentV2` n'est pas
  changée (elle ne soigne qu'au repos).

### Pensée
- Avant de comparer des règles, vérifier que la politique du laboratoire peut les distinguer : un joueur qui répond toujours à la pénalité, à un prix que le laboratoire ne compte
  pas, donne les mêmes victoires partout ; un joueur témoin qui n'y répond jamais en donne le poids.
- Un seuil chiffré hérité d'une autre boucle de combat se relit contre la distribution que produit la nouvelle : 15 % des PV était une victoire rare dans l'arène d'aujourd'hui, c'est un
  tiers des victoires sous la charge.
- `sed -i` sous Git Bash retire les CR (déjà noté) : la remise en CRLF se fait au prochain passage par `node`, et se vérifie.

