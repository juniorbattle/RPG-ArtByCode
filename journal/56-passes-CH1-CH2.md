# Journal de bord — archive : passes CH1, CH2 (2026-11-04 → 2026-11-05)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-11-05 (Passe MN2) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe CH1 — La charge sans palier puissant : l'attaque puissante devient une compétence, les temps de charge raccourcis (décision A3 du 2026-11-04)

### Demande
- **La décision de l'opérateur, le 2026-11-04, en deux messages, mot pour mot** (relayés par la séance mère) : « petite correction : peut etre que nous devrions enlever attaque puissante et nous contenter d'avoir uniquement attaque simple + 4 skills, qu'en penses tu ? », puis, après l'avis de la séance mère : « On peut la retirer mais donc on devra aussi revoir le temps de chargement des autres actions qui seront legerement plus courts attaque puissante deviendra une des competences par exemple.. faisons ca aussi dans une sous-session ».
- C'est une **décision A3** (E11, « A3 = ma décision citée mot pour mot au journal ») : elle modifie la commande chargée décidée en A3 / AV-5 / AV-7 (Passes AV1, V1).
- La tâche confiée : consigner la décision ; amender seulement les phrases qui décrivent l'échelle de la charge ; changer la commande de la version 2 seule ; faire de la puissante une compétence avec ses niveaux et sa place dans l'apprentissage ; raccourcir les temps de charge, retirer le plancher ; proposer et mesurer les nombres. Les rivaux gardent leur attaque puissante, et la règle des blessures V2B1-1 (« A. K.O. par un coup puissant ») reste intacte. Le jeu par défaut et `combat=dynamic` ne changent pas. Une fiche si des choix restent ouverts.

### Les textes amendés — [OK] (ancien → nouveau)
- **Contrat projet, § 6.1** : « l'attaque chargée en la tenant, par paliers, de l'attaque légère à l'attaque puissante puis aux compétences, les compétences payées en points d'action » → « l'attaque chargée en la tenant, par paliers, de l'attaque légère aux compétences, l'attaque puissante comptée parmi elles, les compétences payées en points d'action ». L'en-tête du contrat porte une note datée du 2026-11-04 avec les deux messages. La note de l'amendement du 2026-10-26 (l'en-tête, vers la ligne 13), qui cite l'ancien texte, est laissée telle quelle : c'est le relevé de ce jour-là.
- **`briefs/combat-system.md`** :
  - en tête, l'amendement du 04/11/2026 (les deux messages, ce qui est amendé, les nombres « proposé ») ;
  - § 1 : « de l'attaque légère (une pression) à l'attaque puissante puis aux compétences, palier après palier (§ 4b). Les deux attaques et les quatre compétences restent les actions du joueur ; seule la commande change. » → « de l'attaque légère (une pression) aux quatre compétences emportées, palier après palier, l'attaque puissante devenue l'une d'elles (§ 4b). L'attaque légère et les compétences, l'attaque puissante comprise, restent les actions du joueur. » ;
  - § 4b, « La charge » : « tenue 2 s (« proposé », le bas des « 2-3 s » de l'opérateur), l'attaque puissante ; puis les quatre compétences emportées, rangées par leur temps de charge à leur niveau (de 2,7 à 9 s au niveau 1-5, « proposé » ; un palier de compétence vient au moins 0,25 s après la puissante) » → une pression, puis les quatre compétences emportées ; la puissante une compétence offensive possédée dès le départ, emportée ou non, montée par l'entraînement jusqu'au niveau 3 ; les temps à 0,85 de ceux de la Passe V1 (2,05 à 7,65 s, la puissante 1,7 à 1,3 s), plus de plancher ; la puissante à 1 PA sous les trois touches, une partie sans PA n'ayant que l'attaque légère jusqu'à ce qu'une attaque légère touche ;
  - § 4b, la puissance : la phrase de `V2_POWER` complétée (les dégâts d'un coup chargé pris à 0,85 de ce tableau, `V2_POWER_TRIM`) ;
  - § 14 : les poses `charge` (« avant le palier de la puissante » → « avant le premier palier ») et `chargeHi` (« au-delà de la puissante » → « dès le premier palier, celui d'une compétence »).
- **`AGENTS.md`**, le paramètre `v2=1` : « (light, heavy at 2 s, then the four skills by their charge time at their level, AV-7 / AV-8, each still paid in AP, AV-6; » → « (light, then the four skills brought by their charge time at their level, AV-7 / AV-8, each still paid in AP, AV-6; the heavy attack one of those skills since the operator's decision A3 of 2026-11-04, journal Passe CH1, [les deux messages mot pour mot]: owned from the start, brought or not, 1 AP, the charge times and the charged blows' damage at 0.85 of before, CHARGE_TRIM / V2_POWER_TRIM, « proposé »; ».
- **`briefs/v2-trial.md`** : la ligne de la touche J et celle des temps de charge.

### Fait — [OK], derrière `flags.v2`
- **L'échelle** (`src/combat/charge.ts`) : `chargeTiers` = l'attaque légère (une pression), puis les quatre compétences par leur temps de charge (égalités par leur place). `HEAVY_AT` et le plancher « 0,25 s après la puissante » sont retirés.
- **Les temps** (`src/combat/skills.ts`) : `BASE_CHARGE` garde les temps de la Passe V1, la puissante y entre ([2 ; 1,85 ; 1,7 ; 1,6 ; 1,5] avant la réduction) ; `SKILLS` = `CHARGE_TRIM` (0,85) de ces temps, arrondis à 0,05 s au demi supérieur. Les quatre de départ au niveau 1 : Rempart 3,5 → 3 s, Éclair 4 → 3,4, Ferveur 5 → 4,25, Estocade 9 → 7,65 ; la puissante 1,7 / 1,55 / 1,45 / 1,35 / 1,3 s.
- **La puissante, une compétence** :
  - `SKILL_BOOK.heavy` (offensive, `start`) ; `skillAction('heavy')` lui donne sa famille et garde son genre `heavy` (son coup, son son, son effet, la défense des rivaux qui l'esquivent) ;
  - `v2DuelData` lui donne sa famille, l'admet parmi les quatre (le contrôle `checkDynData` de `dynamic.ts` l'accepte : une ligne de contrôle, aucune règle du duel ne change, `DYNAMIC_SIM_HASH` tenu), lui applique son niveau quand elle est emportée, et 1 PA sous les trois touches (`V2_POWER.heavy.ap`) ; l'ancien schéma (`input=keys`) la garde gratuite ;
  - `V2_START_KIT` : les quatre d'aujourd'hui emportées, la puissante possédée au niveau 1 après elles ; une sauvegarde v2 d'avant la reçoit au niveau 1 à sa lecture (`deserialize`, la partie par défaut lue telle quelle) ; l'entraînement la monte jusqu'au niveau 3, comme les autres compétences de départ ; son nom sur les pages est « Heavy attack » (`ui.skill.heavy`, aucune clé de texte nouvelle).
- **La puissance suit la tenue** (`V2_POWER_TRIM` = `CHARGE_TRIM`) : les dégâts d'un coup chargé offensif à 0,85 du tableau `V2_POWER` (la puissante ×1,87 au lieu de ×2,2, l'Estocade ×2,89 au lieu de ×3,4) ; la jauge et la durée de Rempart et de Ferveur inchangées. Sans cela, le joueur préparé gagnait 75 % des combats (voir Mesures).
- **Le bot** (`pickTier`) joue la puissante comme avant, quand ses PA sont pleins ou l'adversaire brisé, si elle est emportée ; les autres compétences comme avant.
- **La course hors écran** (`V2_RACERS`) remesurée : étalonnage sur les graines 1 à 40, vérification sur 41 à 60 (écarts de 4,1 % au plus ; le test rejoue 41 à 46).
- **L'arène et la lecture**, sans image, effet ni son neuf, rien recuit :
  - `chargeFrame` : la pose haute dès le premier palier (avant : au-delà de la puissante) ;
  - l'effet de palier, le bip et la couche de tension (`chargeLevel`, `RISING_TIER`) : la même formule, le niveau 1 est maintenant le premier palier de compétence ;
  - les moments : `chargeHeavy` devient `chargeFirst` (« Charge (premier palier) »), `chargeWait` attend sur le premier palier ;
  - le script d'empreinte du duel (`runV2Fingerprint`) a ses tenues sur les nouveaux paliers ([0,05 ; 3,1 ; 0,05 ; 3,5 ; 0,05 ; 4,3 ; 7,7 ; 0,05 ; 9,4 ; 12]) : il passe de nouveau par chaque chemin de V2-2 (charge tenue : 27 coups reçus sans garde, 25 gardés, 6 esquives, un break et le K.O. ; 41 relâchés qui attendent, 81 départs, aucun refus). **`V2_SIM_HASH`** = `1913:2:idle:8.133:55.900:-:-;7407:0:idle:1.358:0.000:-:-;83.867|1:8.458:`.
- **Les pages** (`src/simulation/preview.ts`, `src/ui/skills.ts`) : « Heavy blow » et « Heavy charge » sont ceux de la puissante à son niveau, emportée ou non ; l'échelle de la page K ne montre la puissante que si elle est choisie.
- **Les outils** : `tools/arena-scene-check.mjs` (son empreinte et ses tenues), `tools/arena-sheet-proof.mjs` (le moment renommé).
- **Les tests** : `combat-charge` (l'échelle, la puissante emportée, une partie sans PA, l'attente, le HUD, les tenues de l'outil égales à celles du code), `v2-skills` (treize compétences, la puissante possédée, entraînée, emportée, l'ancienne sauvegarde), `v2-gear`, `wares`, `ui-pages`, `combat-cast` (les images de charge), `v2-injury` (ses chiffres remesurés, voir Preuves).

### Mesures — TournamentLab `--rules=v2` (50 parties ; 30 pour les joueurs bon et expert), bot de la version 2, 20 duels par rival et par adresse
| Variante | préparé | blessures | qualifié · finaliste · couronné | bon · expert | duel moyen | sabotage tenté |
|---|---|---|---|---|---|---|
| `main` (V2C2, V2B1) | 60,4 % | 0,80 | 88 · 18 · 4 % | 84,0 · 95,3 % | 5,1 à 9,9 min | 22 / 50 |
| La puissante retirée, temps et puissance d'aujourd'hui | 61,0 % | 0,70 | 94 · 18 · 4 % | 82,0 · 96,7 % | 5,1 à 10,0 | 22 |
| Temps ×0,85, puissance gardée | 74,8 % | 0,42 | 98 · 62 · 4 % | 87,3 · 98,0 % | 5,2 à 9,2 | 7 |
| **Proposé : temps et puissance ×0,85, course remesurée** | **59,6 %** | **0,76** | **88 · 20 · 2 %** | **82,7 · 96,7 %** | **5,2 à 10,0** | **19** |
| Temps et puissance ×0,9 | 62,8 % | 0,60 | 94 · 28 · 2 % | 82,0 · 98,7 % | 5,1 à 10,1 | 23 |
| Temps et puissance ×0,8 | 62,4 % | 0,48 | 94 · 32 · 2 % | 81,3 · 96,7 % | 5,2 à 10,3 | 19 |
| Proposé, la puissante à la place de l'Estocade, 1 PA | 61,6 % | 0,72 | 90 · 18 · 4 % | 82,0 · 94,7 % | 5,0 à 10,0 | 24 |
| Idem, la puissante gratuite | 63,6 % | 0,54 | 98 · 22 · 0 % | 84,7 · 94,0 % | 5,0 à 10,1 | 22 |

- Les lignes ×0,9 et ×0,8 gardent la course remesurée pour 0,85. La plus longue case du proposé : Rhosk à l'adresse 0,6, 10,0 min en moyenne (9,9 sur `main`) ; Marek reste le plus dur (90 % à 0,9). Avec les quatre de départ, le coût de la puissante ne change rien (59,6 % à 0 et à 1 PA).
- `main` est mesuré par le même script sur un `git archive` figé de `0d280c8` : il retrouve exactement les chiffres de V2C2 et V2B1, et la course épinglée.

### Preuves — [OK]
- `npm test` **404 sur 404**, `npm run typecheck`, `npm run build`, `npm run art:validate` (61 manifestes, 85 sources, 23 manifestes du son, 0 erreur).
- **Le jeu par défaut inchangé** : TournamentLab `classic` et `dynamic`, cinq politiques (`diligent`, `idle`, `careful`, `careless`, `losing`), 50 graines : dix JSON **identiques à l'octet** à ceux de `main` figé ; `DYNAMIC_SIM_HASH` le même ; `play-flow` par défaut `0025acce7a403773`, l'empreinte d'avant.
- **La règle des blessures V2B1-1 intacte** : les six tests de la règle de `tests/v2-injury.test.mjs` passent sans changement ; le septième épinglait les chiffres de la décision sur 50 graines, remesurés et épinglés de nouveau en le nommant (0,76 et 1,74 blessure, 59,6 %, couronné 2 %, qualifié 88 %).
- Sur un serveur DEV (worktree, port 5194, par `preview_start`, son onglet fermé, arrêté à la fin) :
  - `arena-scene-check` sous `v2=1` **PASS** (le contrôle vivant avance de 4,9 s, l'empreinte `sameAsRecorded`, 96 rendus de moments sans erreur, télégraphe 6,45:1 et 6,65:1 en deutéranopie, le sol dégagé du HUD dans 77 cas) ; par défaut **PASS** (`sameAsPrototype`) ; `combat=dynamic` **PASS** (`sameAsRecorded`) ;
  - `arena-sheet-proof` : les sept rivaux OK de nuit et à midi, aucune image hors des feuilles ; contre-épreuve `--q=cast=generated` : FAIL, comme il se doit ;
  - `play-flow` `V2=1` victoire (1842, jour 2) `cf669f2d59e33a8d` et défaite (7719, jour 2) `66590f734fa53d82`, rejouées en Node à la même empreinte ; `play-day` `V2=1` et par défaut : tous les contrôles passent ;
  - `ui-text` : la page K la puissante emportée (1600 × 900 et 390 × 844) et le premier palier dans l'arène (1600 × 900 et 812 × 375), 4 pages sur 4.

### Défauts trouvés — [KO → corrigé]
- **`arena-scene-check` rejoue sa propre copie du script d'empreinte** : avec les tenues d'avant, la page donnait l'ancienne empreinte et le contrôle échouait. Ses tenues sont celles du code, et `tests/combat-charge.test.mjs` compare désormais les deux listes.
- **La page K ouvrait sur la puissante non emportée** : `play-day` l'a vu (Espace refusait, « quatre déjà »). La puissante était la première compétence possédée ; elle est rangée après les quatre de départ.
- **Un arrondi flottant** : 1,5 × 0,85 = 1,2749… arrondissait à 1,25. L'arrondi se fait au demi supérieur ; six temps hors des quatre de départ changent d'un cran, aucune mesure n'en dépend.
- **Environnement** : ce worktree n'avait pas de `node_modules` ; `tests/arena-day.test.mjs` ne trouvait pas `three`. Une copie de `node_modules/three` (pas de jonction, comme pour les bases figées), ignorée par git, comme dans les autres worktrees.

### La fiche
- Page privée https://claude.ai/artifact/E3wBJw2yyKhhCcnzb2167G, source `briefs/fiche-ch1.html`, quatre captures du vrai jeu publiées avec la page (pas dans le dépôt). Six cartes, chacune avec sa recommandation :
  - CH-1, les temps de charge : « 0,85 (−15 %) » ;
  - CH-2, la puissance des coups chargés : « La puissance suit la tenue (×0,85) » ;
  - CH-3, le coût de la puissante : « 1 PA » ;
  - CH-4, les quatre d'une partie neuve : « Les quatre d’aujourd’hui, la puissante à côté » ;
  - CH-5, la lecture du premier palier : « Bien ainsi (à confirmer en jeu) » ;
  - CH-6, la suite : « Fusionner après la fiche, essayer ensuite ».
- `decisions` relu vide à la publication. Le code est déjà réglé sur les recommandations ; un autre choix se refait et se remesure.

### Limites
- **Personne n'a joué la nouvelle charge.** Le bot garde sa façon de jouer la puissante (PA pleins ou adversaire brisé) ; un joueur réel la jouera autrement.
- La branche n'est pas fusionnée : elle attend la fiche (CH-6).

### Où reprendre
- Relire `decisions` quand l'opérateur dit la fiche remplie, consigner mot pour mot, appliquer ce qui change, refaire les mesures et les preuves touchées, puis fusionner selon CH-6.

### Pensée
- Quand la puissance suit la tenue, raccourcir la charge ne change plus l'équilibre (61,9 à 62,8 % de 1 à 0,8) : seul le ressenti change. Raccourcir sans toucher à la puissance faisait passer le joueur préparé de 60 à 75 %.
- Un outil qui recopie un script du code pour le jouer dans la page se garde par un test qui compare les deux copies.
- Ce que le joueur possède sans l'emporter se range après ce qu'il emporte : la première ligne d'une page est celle que le clavier touche.

## Passe CH2 — La fiche de la charge relue, six sur six : les nombres de la Passe CH1 décidés, la branche fusionnée (2026-11-04 → 2026-11-05)

### Demande
- L'opérateur, mot pour mot : « Fiche remplie ». Relire `decisions` (https://claude.ai/artifact/E3wBJw2yyKhhCcnzb2167G, source `briefs/fiche-ch1.html`), consigner les choix mot pour mot, n'appliquer que ce qu'ils décident, puis fusionner selon CH-6 (Passe CH1).

### Les choix de l'opérateur, mot pour mot (six sur six, sans note)
Relus par `list` : 6 documents, cliqués le 2026-11-05 entre 02 h 57 et 02 h 58 UTC.

| Carte | Ce qu'elle demandait | Choix |
|---|---|---|
| CH-1 | Les temps de charge : plus courts de combien ? | « 0,85 (−15 %) » |
| CH-2 | La puissance des coups chargés | « La puissance suit la tenue (×0,85) » |
| CH-3 | Ce que coûte l'attaque puissante | « 1 PA » |
| CH-4 | Les quatre compétences d'une partie neuve | « Les quatre d’aujourd’hui, la puissante à côté » |
| CH-5 | Ce que montre le premier palier | « Bien ainsi (à confirmer en jeu) » |
| CH-6 | Fusionner, puis l'essai en jeu | « Fusionner après la fiche, essayer ensuite » |

Les six choix suivent la recommandation de leur carte.

### Ce que ces choix veulent dire — [OK]
- Le code de la Passe CH1 était déjà réglé sur ces six recommandations : **aucune règle ni aucun nombre ne change**, aucune mesure n'est à refaire.
- Les nombres « proposé » de la Passe CH1 sont décidés : la spécification (`briefs/combat-system.md`, en tête et § 4b), `AGENTS.md` (le paramètre `v2=1`) et les commentaires de `src/combat/skills.ts` et `src/combat/v2duel.ts` citent désormais CH-1 à CH-4 à la place de « proposé ».
- CH-5 : la lecture du premier palier se confirme en jeu ; CH-6 : fusion maintenant, l'essai en jeu de l'opérateur dans `main` ensuite (`npm run dev`, puis `/?scene=arena&v2=1` et `/?play=1&new=1&v2=1`, K pour les compétences).

### Preuves
- `npm run typecheck`, `npm test`, `npm run build`, `npm run art:validate` sur le commit de cette passe (seuls des commentaires et des documents changent depuis la Passe CH1).

### Où reprendre
- L'essai en jeu de l'opérateur : le ressenti des temps raccourcis, la puissante emportée ou non, le premier palier (CH-5).

