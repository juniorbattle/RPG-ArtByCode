# Journal de bord — archive : passe V2C1 (2026-10-29)

> Déplacée mot pour mot de `JOURNAL.md` le 2026-11-01 (Passe FX3) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe V2C1 — La décision V2-2 de l'opérateur appliquée : rien ne coupe la charge (2026-10-29)

### Demande, mot pour mot
- La décision de l'opérateur sur la fiche de l'essai (Passe FV3) : V2-2 « Ce qui coupe une charge » = « Rien ne la coupe » (contre « Garder »,
  recommandé, et « Seul un coup reçu la coupe ») ; le seul choix de la fiche qui s'écarte de la recommandation.
- Séance ouverte par celle de la Passe FV3 ; branche `v2c1-charge-rien` depuis `main` (`94e15ca`). Tout derrière `flags.v2` ; les temps de charge
  (V2-1 « Garder »), les PA (AV-6) et l'équilibrage (V2-3 « Garder » : `V2_FOE_HIT` 1,3, `V2_FOES`) ne changent pas.

### La règle — [OK] (`src/combat/charge.ts`)
- Retiré : la règle « proposé » de la Passe V1 (un coup reçu sans garde, l'esquive du joueur, son break ou le K.O. coupaient la charge ; relâchée
  pendant la séquence adverse, elle était refusée et perdue). L'événement `chargeCut` n'existe plus.
- **Les cas limites, chacun « proposé »**, lus au plus près de « rien » :
  1. **La garde et l'esquive** : un coup reçu, gardé ou non, et l'esquive du joueur gardent la charge, qui continue de monter (trois touches
     distinctes, tenues ensemble si l'on veut ; l'esquive coûte toujours son PA, un palier peut se fermer).
  2. **La montée** : la charge ne monte que joueur libre (au repos, en garde, pendant l'esquive), comme avant ; pendant une action, repoussé ou
     étourdi, elle est gardée sans monter et remonte dès qu'il est libre.
  3. **Relâchée pendant la priorité de l'adversaire** (G3 / CB-4, toute sa séquence), ou le joueur étourdi, repoussé ou encore dans une action :
     elle **attend** (`chargeWait`) et part au premier pas où le joueur peut agir (`chargeRelease`), au meilleur palier que ses PA ouvrent alors,
     au plus celui atteint au relâché. La priorité de l'adversaire reste entière : rien ne part pendant sa séquence. Une nouvelle pression pendant
     l'attente commence une nouvelle charge, dont le palier attend derrière le premier.
  4. **Le break** : la charge est gardée, figée pendant l'étourdissement, et remonte après ; relâchée pendant l'étourdissement, elle attend sa fin.
     **Le K.O.** finit le duel : une charge tenue ou en attente finit avec lui, sans partir (`chargeEnd`) ; rien d'autre ne finit une charge.
  - Le « repoussé » (CB-3) vaut pour l'action lancée, comme avant.
- **Le HUD** : la bande des paliers reste pendant l'attente et montre le palier qui partira, le bouton d'attaque dit son nom (`chargeHudModel`
  `waiting`, `src/arena/v2Arena.ts` ; `DynamicHud.chargeUpdate`) ; aucun texte neuf. Un moment scripté de plus, `chargeWait` (relâchée pendant
  une séquence de Marek), vérifié sur sa capture : « Puissante » en surbrillance dans la bande, le bouton « Puissante » grisé pendant la séquence.
- **Le bot** (`runV2BotDuel`) joue la règle : il esquive aussi en chargeant (il s'en abstenait parce que l'esquive coupait) et ne tient plus la
  garde pour protéger une charge (le motif a disparu) ; le bot imprudent qui lâche pendant une séquence voit son palier attendre.
- **La course hors écran recalée** (`V2_RACERS`, le modèle du duel, comme en Passe VP4) : chaque mise à terre plus courte (Vessa la plus touchée,
  591 → 326 s ; Marek 620 → 511) ; étalonnée sur les graines 1..40, vérifiée sur les graines 41..60 (écarts sous 10 %), le test rejoue 41..46.
  [KO] Le protocole d'avant (1..20, vérifié sur 21..26) : la cadence de dégâts de Tobin à 16 % sur 21..26, hors de la tolérance de 12 % ; d'où
  l'étalonnage élargi. Marek reste le plus fort de la course, Tobin le plus faible ; Vessa passe de la deuxième à l'avant-dernière place.

### L'empreinte du duel chargé (`V2_SIM_HASH`) — [OK] mise à jour, justifiée
- Le script fixe (`runV2Fingerprint`, rejoué dans la page par `tools/arena-scene-check.mjs`) gardait la charge sous la garde et ne relâchait jamais
  pendant une séquence : il n'exerçait pas la nouvelle règle. Réécrit (360 s au lieu de 300) : jusqu'à 40 s d'un duel la garde contre les coups
  légers et des esquives deux secondes sur trois, charge tenue ou non ; jusqu'à 110 s la garde contre tout, jusqu'au break ; puis ni l'une ni
  l'autre, jusqu'au K.O. ; des relâchés à leur heure, séquence adverse comprise ; à chaque K.O. une remise à zéro (l'ancien script ne relançait
  plus d'attaque après la première : `next` restait à ~300 s).
- Le test compte ce que le script atteint, une charge tenue : 38 coups reçus sans garde, 25 gardés, 5 esquives, un break et un K.O. (une fin de
  charge) ; 121 charges, 61 relâchés qui attendent, 118 départs ; aucune coupe, aucun départ refusé. Nouvelle empreinte : `2042:2:idle:4.850:18.180:3.850:-;6002:0:idle:1.467:29.800:-:-;60.733|1:4.858:`
  (au milieu du second duel, une charge de 4,86 s tenue) ; elle vaut aussi dans la page (`sameAsRecorded`).

### L'effet sur l'équilibre — [?] il bouge nettement : à l'opérateur
- TournamentLab `--rules=v2`, 50 graines (le joueur préparé = la politique `diligent`, adresse 0,6) :

| | `main` (V1 / VP4) | la règle seule, bot d'avant | la règle, le bot qui la joue, la course recalée (livré) |
|---|---|---|---|
| victoires du joueur préparé | 60,4 % | 74,4 % | **84,0 %** |
| blessures par partie | 2,10 | 1,88 | 0,90 |
| qualifié / finaliste / champion | 94 % / 38 % / 0 % | 100 % / 58 % / 8 % | 100 % / 88 % / **28 %** |
| victoires du joueur oisif (0,3) | 0 % | 3,9 % | 3,0 % |

- Graines 1..30 (la marche de la Passe VP4) : adresse 0,4 : 14,5 % → 37,8 % ; 0,75 : 82,0 % → 97,3 %, couronné 20 % → 87 % ; 0,9 : 93,3 % →
  99,3 %, couronné 67 % → 97 %.
- **La durée des duels** (bot à 0,6) : sur les sept rivaux, 10 duels chacun, de 8,0 à 7,05 min en moyenne (le plus long : 9,6 → 8,9 min) ; par
  rival (20 duels, graines 1001-1020) : Vessa 8,3 → 5,4 min, Orla 8,0 → 7,1, Ilse 9,1 → 7,7, Tobin 5,7 → 5,3 ; Marek 7,9 min des deux côtés. Les victoires du bot à 0,5 / 0,6 :
  Marek 5 / 10 % → 50 / 40 %, Vessa 35 / 75 % → 100 / 100 %, Orla 25 / 55 % → 80 / 100 %, Ilse 45 / 90 % → 95 / 100 % ; Cassius, Rhosk et Tobin
  déjà à 90-100 %. À 0,2 rien ne change ; Marek reste le plus dur. La règle pèse surtout contre les rivaux qui frappent vite (Vessa) : chaque coup
  reçu y coupait une charge.
- **Une conséquence de second ordre** : la tentative de sabotage de l'équipement par Cassius (`v2-gear-tamper`, V2-14) tombe de 21 parties
  `diligent` sur 40 à 1 sur 40 (graines 1..40). Le joueur gagne plus, a plus de pièces et paie la garde de nuit plus souvent (7,6 → 8,8 nuits par
  partie) : la sécurité reste au-dessus de 64, le second signe (les casiers ouverts) vient tard (le soir du jour 9 ou 10), après les soirs où la
  tentative peut venir (jours 5, 7, 9). Rien n'est changé aux événements ; `tests/v2-coherence.test.mjs` prend la partie de la graine 34 (la seule des
  40 qui la porte encore) à la place de celle de la graine 3.

### Un réglage proposé à l'opérateur — non appliqué
- Les coups des rivaux plus forts (`V2_FOE_HIT`), sous la nouvelle règle ; la course hors écran mise à l'échelle (ses cadences × k / 1,3 : une
  estimation, non remesurée). TournamentLab, 50 graines (préparé, oisif) et 30 (les adresses 0,4, 0,75, 0,9) :

| `V2_FOE_HIT` | préparé (0,6) | blessures | finaliste / champion | 0,4 | 0,75 (champion) | 0,9 (champion) | duel moyen à 0,6 |
|---|---|---|---|---|---|---|---|
| 1,3 avant V2-2 (`main`) | 60,4 % | 2,10 | 38 % / 0 % | 14,5 % | 82,0 % (20 %) | 93,3 % (67 %) | 8,0 min |
| 1,3 livré | 84,0 % | 0,90 | 88 % / 28 % | 37,8 % | 97,3 % (87 %) | 99,3 % (97 %) | 7,05 min |
| 1,5 | 76,0 % | 1,32 | 48 % / 14 % | 18,5 % | 90,7 % (57 %) | 98,0 % (90 %) | 6,96 min |
| 1,6 | 71,2 % | 1,50 | 40 % / 8 % | 14,1 % | 87,3 % (40 %) | 98,0 % (90 %) | 6,90 min |
| 1,7 | 64,8 % | 1,68 | 26 % / 4 % | 6,5 % | 84,7 % (33 %) | 96,7 % (83 %) | 6,82 min |
| **1,8** | **60,4 %** | 1,90 | 18 % / 4 % | 3,3 % | 81,3 % (23 %) | 94,0 % (70 %) | 6,71 min |

- **Proposé : × 1,8** : il retrouve la marche que l'opérateur a gardée (V2-3 « Garder », la rudesse de la Passe VP4) : le joueur préparé à 60,4 %,
  le bon couronné une fois sur quatre (23 % contre 20 %), l'expert deux fois sur trois (70 % contre 67 %). Autre voie : × 1,6 (71 %), qui laisse au
  joueur une part de la facilité que la charge sans coupure lui rend. Le défaut de la version 2 reste celui d'aujourd'hui (× 1,3) jusqu'à sa
  décision ; tout réglage sera mesuré à nouveau (la course remesurée, pas mise à l'échelle).

### Les preuves
- `npm run typecheck`, `npm test` **280 / 280** (code de sortie 0, vérifié), `npm run build`, `npm run art:validate` (0 erreur, 0 avertissement).
- `tests/combat-charge.test.mjs` réécrit pour la règle (14 tests : « nothing cuts a charge », « a release the duel cannot take waits », « the K.O.
  ends the duel and the charge with it », le HUD de l'attente, la marche sous V2-2, la course sur 41..46, l'empreinte et ce qu'elle atteint) ;
  oracles écrits depuis le texte de la règle. **14 fautes injectées une à une, 14 attrapées**, chaque fichier rendu à l'octet (SHA-256) : la coupe
  par un coup reçu, par l'esquive, par le break ; la montée pendant l'étourdissement, pendant une action ; un relâché perdu, essayé tout de suite
  (refusé), gardé à un palier sans PA, remplacé par le suivant, parti pendant que le joueur ne peut pas agir, jamais parti ; pas de fin au K.O. ; le
  HUD qui ignore l'attente ; le script d'empreinte revenu à la garde de l'ancienne règle.
- **Le jeu par défaut inchangé** : TournamentLab `classic` et `dynamic`, `diligent` et `idle`, 50 graines, et `DYNAMIC_SIM_HASH` : JSON **identique
  à l'octet** à celui de `main` figé (`94e15ca`, SHA-256 `40fa7aa7…` des deux côtés). `play-flow` par défaut, victoire : `0025acce7a403773`, la même
  empreinte qu'aux Passes UI3, UI4, V0 et FV4.
- **L'ancien schéma `input=keys` inchangé** : en Node, les données de la page (`makeV2Duel`, `v2=1&input=keys`), celles des sept rivaux et le duel
  joué par `runDynamicFingerprint` identiques à `main` figé ; `ArenaApp.ts` n'est pas touché. [?] `tools/arena-scene-check.mjs` ne sait pas jouer
  `v2=1&input=keys` (« sim.view is not a function » : son script v2 suppose le duel chargé ; le même code sur `main`) : limite de l'outil, notée.
- Sur GPU (Radeon 780M, `dev-strict` :5186 par `preview_start`, son onglet fermé aussitôt, arrêté à la fin) : `arena-scene-check` **PASS** sous
  `v2=1` (le contrôle vivant avance de 4,908 s, l'empreinte `sameAsRecorded`, 87 rendus de moments sans erreur, télégraphe 6,77:1 et 6,97:1 en
  deutéranopie, le sol dégagé du HUD dans 77 cas), sous les règles d'aujourd'hui (`sameAsPrototype`) et `combat=dynamic` (`sameAsRecorded`) ;
  `play-flow` `V2=1` victoire (1842, jour 2) `5cfe614a12cc08bd` et défaite (7719, jour 2) `671a95a659b6ac06`, rejouées en Node à la même empreinte,
  « all checks passed », aucune erreur de page ; captures `chargeWait`, `chargeGuard`, `chargeHeavy` (`FREEZE_CSS=1`), relues, non gardées.
- Documents : `briefs/combat-system.md` § 4b (la règle et ses cas limites), `briefs/v2-trial.md` (la charge, l'équilibrage), `AGENTS.md` (le
  paramètre `v2=1`).

### Pensée
- Une règle qui retire une pénalité se mesure deux fois : la règle seule, puis avec le bot qui la joue ; le bot encodait l'ancienne règle (il
  n'esquivait pas en chargeant, il gardait pour protéger sa charge), et la moitié de l'effet (74 → 84 %) venait de là.
- Un effet de second ordre se cherche dans ce qui dépend du résultat des combats : plus de victoires, plus de pièces, la garde payée, et une chaîne
  d'événements (le sabotage) qui ne trouve plus son soir.
- Un script d'empreinte écrit pour une règle n'en exerce pas une autre : il se réécrit pour passer par chaque chemin de la nouvelle, et le test compte
  ces passages (sinon l'empreinte ne garde que ce que l'ancien script touchait).

