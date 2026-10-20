# Journal de bord — archive : passes L2 et L3 (2026-10-20)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-10-20 (Passe Q4) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

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

