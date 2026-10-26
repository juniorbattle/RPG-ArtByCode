# Journal de bord — archive : passes AV1 et V0 à V10 de la séance cloud « Version 2 » (2026-10-26)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-10-26 (Passe VP2) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`. Ces passes V0 à V10 sont celles de la séance cloud
> « Version 2 » ; les passes V0 à V3 des variantes de PNJ (18/10) sont dans `journal/08-passes-V0-V3.md`.

---

## Passe AV1 — Le mandat de la séance cloud « Version 2 » : la fiche de l'opérateur (19 sur 19) et le brief (2026-10-26)

### Demande, mot pour mot
- Opérateur : « par la suite nous allons continuer notre travail sur les feuilles de combat des personnages puis on va aussi finaliser les
  environnement de chaque district ( merchant est deja fait ) avec leur pnj integre, on recupera certains pnjs re-utilisable puis en integrons de
  nouveau selon le besoin. Enfin on construira enfin notre systeme d'evenement dynamique. il faut prevoir d'optimiser les boutiques d'equipement,
  ( et donc le systeme d'equipement ), le systeme de gain de competences ( peut etre proposer des duels en ville afin d'acquerir une nouvelle
  comptences comme octopah traveler cela permet aussi de monter en niveau ), je pense a integrer un systeme interactif comme octopath traveler :
  vol, marchander, defier qui peut etre interessant en ville mais on doit rester structurer et simple dans notre jeu sinon il prendra trop de
  temps a finir de developper. donc on a une grosse tache a faire que nous pouvons lancer en session cloud pendant plusieurs heures de maniere
  autonome ( cela ne doit pas necessiter une utilisation d'outils externe ) »
- Puis, sur le combat : « Ah et enfin on aura une dernier optimisation pour le systeme de combat. surtout cote joueur, au lieu d'avoir plusieurs
  touches d'action on en aura 3 ( garde, esquive, attaque ) sauf que l'attaque sera comme une charge a niveau : donc une simple pression permet de
  faire une attaque simple, en restant legerement appuye pendant 2-3s, on utilise une attaque lourde, si on reste 5 seconde de plus on debloque
  une action de competences et ainsi de suite, les competences les plus puissantes nous obligerait a charger pendant peut etre 10s ( ce n'est
  qu'un exemple ) mais donc peut etre quee nous aurrions des niveau de competences qui determine le puissance et le temps de charge ( exemple de
  final fantasy 6 avec le personnage Cyan ) »
- Puis, sur la fiche : « oui prepare la fiche mais comprends que je veux que la session cloud soit full autonome en avancant sur tous les aspects
  possible sans mon interventions sans le bsoin des outils externes... cela comprend : narration, structure, gameplay, sons, bref je veux une
  avance concrete afin que nous puissons nous concentre sur les details restants qui demandent une supervision »
- Branche `cloud-brief-av1` depuis `main` (`306dbb1`).

### Constats avant la fiche — [OK]
- Un relevé en lecture seule des contrats, de la spécification du combat, de la feuille de route et du code a trouvé quatre heurts :
  - la charge tenue contredit la spécification approuvée (« Les touches sont instantanées : pas de charge tenue », choix G2) et la phrase amendée
    du contrat projet § 6.1 ;
  - un niveau global se heurte au contrat projet § 7 (« éviter qu'une unique statistique de niveau rende toutes les autres décisions
    secondaires ») ;
  - le vol est, dans le contrat projet (§§ 3.4, 9.2), une menace contre le joueur ; un vol par le joueur est nouveau ;
  - les districts demandent le GPU et la revue visuelle de l'opérateur.
- Dans le code : une boutique (Mara, trois objets), aucun emplacement d'équipement, aucune acquisition de compétence (six compétences codées en dur,
  la composition fixe `['t1','t4','d1','s1']`), aucun niveau du joueur, dix-huit événements, le parvis = le sable de l'arène réutilisé.

### La fiche — [OK] publiée, 19 choix sur 19 enregistrés et relus
- Page privée https://claude.ai/artifact/85frj6Jpc8GqfGvwgXKAid, collection `decisions` (vide à la publication, relue par `list`), bâtie sur la page de
  la fiche CB1 (pont attendu 10 s, chaque écriture relue).
- Relue après « fiche remplie » : 19 documents, cliqués le 26/10 entre 04 h 31 et 04 h 41 UTC, une note.

### Les choix de l'opérateur, mot pour mot
« = » : la recommandation de la fiche est suivie ; « ≠ » : le choix diffère, et c'est lui qui fait foi.

| # | Décision | Recommandation | Choix de l'opérateur | Note | |
|---|---|---|---|---|---|
| AV-1 | Le périmètre | « Tout ce qui se fait par le code » | « Tout ce qui se fait par le code » | — | = |
| AV-2 | Le jeu par défaut | « Un drapeau « version 2 » pour tout, défaut inchangé » | « Un drapeau « version 2 » pour tout, défaut inchangé » | — | = |
| AV-3 | Les détails non fixés | « Elle tranche les détails, notés « proposé » » | « Elle tranche les détails, notés « proposé » » | — | = |
| AV-4 | La langue des textes | « Anglais, textes rassemblés » | « Anglais, textes rassemblés » | — | = |
| AV-5 | A3 · trois touches et la charge | « Oui, amender (A3), l'ancien schéma gardé pour comparer » | « Oui, amender (A3), l'ancien schéma gardé pour comparer » | — | = |
| AV-6 | Les PA et les emplacements | « Plus de PA, la charge est le prix » | « Garder les PA en plus de la charge » | — | ≠ |
| AV-7 | Les paliers | « Comme Cyan, paliers successifs » | « Comme Cyan, paliers successifs » | — | = |
| AV-8 | Les niveaux | « Un niveau par compétence » | « Un niveau par compétence » | — | = |
| AV-9 | Obtenir une compétence | « Achat, entraînement et défi » | « Achat, entraînement et défi » | — | = |
| AV-10 | Les feuilles de combat | « Marek continue, poses de charge après » | « Mettre Marek en pause jusqu'à la nouvelle commande » | — | ≠ |
| AV-11 | Les actions en ville | « Les trois, le vol avec ses conséquences » | « Les trois, le vol avec ses conséquences » | — | = |
| AV-12 | L'équipement | « Arme + 3 accessoires, une boutique par district » | « Arme + 3 accessoires, une boutique par district » | « arme + armure + 2 accessoires » | = (la note fait foi) |
| AV-13 | Les districts | « Le cloud les bâtit, la revue en local après » | « Le cloud les bâtit, la revue en local après » | — | = |
| AV-14 | Les PNJ | « Cuits réutilisés, générés provisoires pour le reste » | « Cuits réutilisés, générés provisoires pour le reste » | — | = |
| AV-15 | La narration | « Structure, dialogues et cinématiques » | « Structure, dialogues et cinématiques » | — | = |
| AV-16 | Les événements | « Relier et compléter » | « Relier et compléter » | — | = |
| AV-17 | Le son | « Effets, ambiances et musique simple » | « Effets, ambiances et musique simple » | — | = |
| AV-18 | Le départ | « Après la fusion de Marek » | « Tout de suite, en exception à la règle » | — | ≠ |
| AV-19 | Le relais local | « Pas de relais » | « Pas de relais » | — | = |

- **AV-5 est la décision A3** de l'opérateur, datée du 26/10/2026 : elle autorise l'amendement de `briefs/combat-system.md` et de la phrase du
  contrat projet § 6.1 pour la charge par paliers, fait par la séance cloud (lot V1), l'ancien schéma gardé derrière un paramètre.
- **AV-10** : la séance locale de la feuille de Marek était déjà en pause à la demande de l'opérateur (« je veux une pause. »), sa branche
  `marek-combat-x3` locale à `306dbb1`, sans commit, avec deux sources archivées non suivies (`marek-turnaround-2026-10-26-a1` et `-b1`). Elle
  reste en pause jusqu'à la nouvelle commande.
- **AV-18** : la règle d'une branche à la fois a une exception, décidée par l'opérateur : la séance cloud part pendant que `marek-combat-x3` existe
  en local, en pause.

### Fait — [OK]
- `briefs/cloud-session-v2-brief.md` : le brief de la séance cloud, à partir de ces choix. Le drapeau `flags.v2` (le jeu par défaut inchangé), onze
  lots V0 à V10 dans l'ordre (le drapeau et les textes ; la commande chargée et C3 ; les compétences ; l'équipement et les boutiques ; marchander,
  défier, voler ; les trois districts ; la narration et les cinématiques ; les événements ; le son par le code ; l'interface P4-P6 ; le bilan et la
  fiche d'essai), les limites, les preuves et les leçons de la première séance cloud.
- `briefs/roadmap-2026-10.md` et `AGENTS.md` renvoient au brief. Aucun code ne change.

### Restes [?]
- La séance cloud elle-même, lancée après cette passe.
- Ce qui restera local après elle : les mesures GPU, les preuves de visibilité sur GPU et la revue visuelle des districts, les poses de charge des
  feuilles cuites (Marek repris), les personnages à cuire.

### Pensée
- Une demande nouvelle qui contredit une décision déjà prise (ici « pas de charge ») se tranche sur la fiche avant le lancement : une séance cloud
  ne peut pas demander, et l'amendement doit citer la décision de l'opérateur.

## Passe V0 — Séance cloud « Version 2 », lot V0 : le drapeau `flags.v2` et les textes du jeu rassemblés en tables (2026-10-26)

### Demande
- Séance cloud « Version 2 », en pleine autonomie (brief `briefs/cloud-session-v2-brief.md`, fiche de la Passe AV1). Lot V0 : le drapeau de partie
  `flags.v2` (AV-2 « Un drapeau « version 2 » pour tout, défaut inchangé »), son passage dans la sauvegarde et les pages, un état nommé de départ ;
  les textes du jeu rassemblés dans des tables sans changer un mot du jeu par défaut (AV-4 « Anglais, textes rassemblés »).
- Branche unique de la séance : `claude/friendly-davinci-17lk4m`, depuis `main` (`3b0c9d5`). Pas de serveur de prévisualisation dans la séance
  cloud : `main` figé (`git archive 3b0c9d5`) et un instantané de la branche (`git archive` du commit prouvé), servis hors dépôt par le vite du dépôt
  (:5201 et :5202, chacun son dossier de cache) ; Chrome de Playwright en rendu logiciel (`--use-angle=swiftshader`).

### Fait — [OK]
- **Le drapeau** (`src/simulation/v2.ts`, pur) : `isV2`, `makeV2` (le drapeau et les règles dynamiques qu'il implique, `flags.combat = 'dynamic'`,
  brief § 2), `wantsV2` (`v2` ou `v2=1` ; `v2=0` et le reste = le jeu d'aujourd'hui). Une nouvelle partie le prend par `?play=1&new=1&v2=1`
  (`withRules`, `src/ui/play.ts`), un état nommé par `&v2=1` ; il vit dans `flags`, donc dans la sauvegarde (aucun changement de format :
  `schemaVersion` reste 1). État nommé `v2-day1-morning` (`NAMED_STATES` porte `v2: true`). TournamentLab : `--rules=v2`.
- **Les textes en tables** (`src/narrative/text/`) : `en.ts`, la table anglaise (≈ 300 clés : le temps, les actions et leurs refus, les rôles,
  les répliques, la poule, les rivaux hors écran, l'interface du mode jouable : panneaux, tableau, fiche de match, écran titre), `tx(clé, valeurs)`
  qui remplit les `{nom}` et refuse une valeur manquante. Passés à la table : `actions.ts`, `roles.ts`, `advance.ts`, `slot.ts`, `content.ts`,
  `dialogue.ts`, `pool.ts`, `offscreen.ts`, `townUi.ts`, `board.ts`, `playArena.ts`, `playTown.ts`, `playLanterns.ts`, `title.ts`. Restent tels
  quels, déjà des tables : les événements (`src/events/catalog.ts`), les personnes et les rivaux (`people.ts`, `roster.ts`), les noms d'actions
  (`texts.ts`), les mots du HUD de l'arène (`TEXTS_EN` / `DYN_TEXTS_EN`) ; et l'écran de chargement (`src/ui/loading.ts`, sur le chemin par défaut,
  qui ne doit atteindre aucun module de jeu : test de `game-core`).

### Les « proposé » du lot
- `v2` sans valeur vaut `v2=1` (comme les paramètres météo) ; toute autre valeur est le jeu d'aujourd'hui.
- Une seule table de textes pour la simulation et l'interface, sous `src/narrative/text/` (module pur, lisible par les tests), plutôt qu'une table
  par dossier.

### Les preuves
- **Les textes inchangés** (oracle hors dépôt, sur le code de `main` puis de la branche) : 136 empreintes — 100 parties du TournamentLab (deux
  politiques, 25 graines, règles d'aujourd'hui et dynamiques ; l'empreinte d'une partie contient chaque texte de son journal), 24 parties
  scriptées (prudente, négligente, perdante, 8 graines) avec le condensé de chaque libellé, chaque refus et chaque réplique de chaque personne à
  chaque pas, et les 12 états nommés : **identiques**. L'oracle voit une faute : un mot changé dans une ligne cachée du journal (`off.spy`), ou
  dans une réplique (`line.lio.talk`) → condensé différent. Second oracle : chaque fragment de chaque littéral des fichiers d'avant (balises et
  `${…}` retirés) se retrouve dans le nouveau fichier ou la table : 201 + 90 fragments, 0 manquant.
- **`tests/texts.test.mjs`** (5) : chaque clé demandée existe, chaque clé de la table est demandée ; `tx` remplit, refuse une valeur manquante et
  une clé inconnue, ne montre jamais d'accolade ; les textes du jeu par défaut épinglés depuis `main` (33 valeurs) ; le drapeau (adresse,
  sauvegarde, règles, état nommé, TournamentLab) ; seuls `play.ts`, `named.ts` et `lab.ts` le posent. **8 fautes injectées sur 8 attrapées**
  (un mot, une clé retirée, une clé jamais demandée, une valeur manquante acceptée, v2 sans règles dynamiques, `v2=0` pris pour v2, l'état nommé
  sans drapeau, un texte sur la mauvaise clé), fichiers rendus à l'octet (SHA-256).
- **Le jeu par défaut contre `main` figé**, en rendu logiciel, 1920 × 1080 :
  - la ville (`tools/detshots.mjs`, 120 pas) : nuit A, B, C, D, midi A, B, C, D, et B la nuit avec panneau et HUD : **9 sur 9 identiques à
    l'octet** ; contrôle négatif du comparateur (B sans et avec panneau) : 350 916 px différents ;
  - l'arène, scène seule (`tools/arena-scene-shots.mjs`, `HOLD=1`, `clean=1`) : ancien duel, 9 moments et une chauffe ; nouveau duel
    (`combat=dynamic`), 7 moments et une chauffe : **18 sur 18 identiques à l'octet** ;
  - `tools/play-flow.mjs` victoire (1842, jour 2) : **empreinte `0025acce7a403773`**, la même que les Passes UI3 et UI4, des deux côtés ;
  - `tools/play-flow.mjs` défaite (7719, jour 3) : **empreinte `397959404c18f714`**, la même que les Passes UI3 et UI4, des deux côtés ;
  - `tools/title-proof.mjs` (`main` figé contre la branche) : toutes ses vérifications OK ; « Explore » contre `?time=midday` de `main` (panneau
    fermé), « Explore » après H contre `main` (panneau ouvert), `?time=midday` de la branche contre `main` : **identiques à l'octet** ; rôles
    inversés, **l'écran titre** sans et avec sauvegarde : **identique à l'octet** (ses textes passés à la table) ;
  - `tools/arena-scene-check.mjs` (`fps=off`) : l'empreinte du prototype, 42 rendus, télégraphe 6,94:1 (deutéranopie 7,15), sol dégagé 22 cas sur 22,
    0 erreur, **mais FAIL** sur le contrôle vivant (« advanced 0 » : 5 images en tout, la simulation n'avance pas pendant les touches) ; **le même
    FAIL sur `main` figé**, aux mêmes nombres : une limite du rendu logiciel sans tête (Passe L6), pas de la branche. À refaire sur GPU en local.
- **Le drapeau en direct** (instantané de la branche) : `tools/play-flow.mjs` avec `V2=1` (victoire, 1842) : le drapeau posé, l'arène joue
  le duel dynamique, **rejoué en Node à la même empreinte** (`793455bb62498b63`) ; `tools/play-day.mjs` avec `V2=1` : le drapeau posé, le premier jour
  et chaque rechargement depuis la sauvegarde, **rejoué en Node** (`9bf8024c0810a17f`). **[KO → expliqué]** un premier rejeu Node de `play-flow` V2
  différait : il chargeait l'arbre de travail (où le lot V1 changeait déjà la course v2) et non l'instantané servi ; rejoué avec les outils de
  l'instantané : égal. **[KO → corrigé, outil]** `play-day` refusait « E ouvre le dialogue de Mara » des deux côtés, `main` figé compris (« words 0 ») :
  depuis la Passe UI3 les répliques sont dans le parchemin sous la rangée du portrait, et l'outil ne comptait que la rangée ; il compte le parchemin.
- **TournamentLab `--rules=v2`**, 50 graines : rejoué deux fois, rapports identiques à l'octet ; mêmes résultats que `--rules=dynamic` (V0 ne fait
  que poser le drapeau ; diligent : 99 % de victoires, 0 participant oublié).
- Validation : typecheck, `npm test` **207 / 207** (202 + 5), build, `art:validate` (19 manifestes, 40 sources, 0 erreur).

### Journal — [OK] archivage
- Les passes gardées dépassaient 60 Ko avec cette passe : AP1, UI4, AF1, AP2 et RC2, closes (fusionnées), partent d'un seul bloc vers
  `journal/29-passes-AP1-RC2.md` (53 462 octets) ; reste AV1. Preuve **9 / 9** (script hors dépôt, contre la copie d'avant le déplacement : corps de
  l'archive égal aux octets retirés ; cinq passes dans l'ordre ; chacune dans un seul fichier, par sa ligne de titre entière ; AV1 et la suite
  inchangées à l'octet ; LF seuls). Contrôle négatif : un bit changé dans une copie de l'archive → le corps ne correspond plus.

### Pensée
- Un déplacement de textes se prouve par ce qu'ils produisent, pas par leur relecture : l'empreinte d'une partie contient tout son journal, et un
  condensé des libellés et répliques à chaque pas de parties scriptées couvre ce que le journal ne garde pas ; une faute d'un mot dans une ligne
  cachée doit le changer (contrôle négatif).
- Sans serveur de prévisualisation, deux instantanés figés (`git archive`) servis par le vite du dépôt, chacun son cache, laissent l'arbre de
  travail libre pendant les 40 minutes d'une série en rendu logiciel.

## Passe V1 — Séance cloud « Version 2 », lot V1 : la commande à trois touches et l'attaque chargée par paliers (A3, AV-5), les niveaux par compétence, C3 (les adversaires), l'équilibrage, le bot et la course recalés (2026-10-26)

### Demande
- Lot V1 du brief (`briefs/cloud-session-v2-brief.md` § 3) : l'amendement A3 décidé par l'opérateur (AV-5 « Oui, amender (A3), l'ancien schéma
  gardé pour comparer »), la règle des trois touches et de la charge (AV-6 « Garder les PA en plus de la charge », AV-7 « Comme Cyan, paliers
  successifs », AV-8 « Un niveau par compétence »), puis C3 (garde, esquive et 2 à 4 compétences des rivaux, sept profils plus Marek et Vessa,
  l'équilibrage vers « modéré », L7-4 / CB-11), le bot et la course hors écran recalés. Tout derrière `flags.v2`.

### L'amendement — [OK] (décision A3, citée mot pour mot et datée)
- `briefs/combat-system.md` : en tête, l'amendement du 26/10/2026 avec la demande de l'opérateur mot pour mot et AV-5 à AV-8 ; § 1 (trois touches),
  § 4 (« pas de charge tenue » remplacé, sous la version 2, par la charge par paliers ; gardé pour l'ancien schéma), un nouveau § 4b (la règle,
  ses nombres « proposé ») et, au § 14, la liste des poses de charge à ajouter aux feuilles (5 images pour Ren et Vessa ; aucune pour Marek, qui
  ne charge pas) : elle servira à reprendre la feuille de Marek (AV-10), à laquelle rien n'est touché.
- `contracts/PROJECT_MASTER_CONTRACT.md` § 6.1 : « le joueur agit par des actions instantanées ou à délai de préparation, les compétences payées en
  points d'action » devient « le joueur agit par trois commandes, la garde, l'esquive et l'attaque, l'attaque chargée en la tenant, par paliers,
  de l'attaque légère à l'attaque puissante puis aux compétences, les compétences payées en points d'action et réglées par leur niveau » ; l'en-tête
  note l'amendement (AV-5, mot pour mot, daté). Le reste des contrats ne change pas.

### Fait — [OK]
- **La charge** (`src/combat/charge.ts`, pur) : `ChargedDuel` enveloppe `DynamicSim`, qui ne change pas de règle : `attack(true)` commence une
  charge, `attack(false)` lance le palier atteint ; `chargeTiers` : la légère (une pression), la puissante à 2 s, puis les quatre compétences par
  leur temps de charge à leur niveau ; un palier dont les PA manquent ne s'ouvre pas (le meilleur palier ouvert atteint part) ; les événements
  `chargeStart`, `chargeTier`, `chargeCut`, `chargeRelease`.
- **Les niveaux** (`src/combat/skills.ts`) : un niveau 1 à 5 par compétence, +10 % de puissance par niveau, un temps de charge plus court ; aucun
  niveau du joueur.
- **Le duel de la version 2** (`src/combat/v2duel.ts`) : `v2DuelData(rival)` = le duel dynamique d'aujourd'hui, la puissante et les compétences
  sans préparation automatique (la charge en tient lieu), un coup chargé payé par sa tenue (`V2_POWER`), les compétences à leur niveau, la
  défense et les compétences de l'adversaire ; `input: 'keys'` garde la commande C2 sur le même adversaire et les mêmes niveaux.
- **C3** (`src/combat/dynamic.ts`, par des champs optionnels de `DynData.ai` : sans eux, rien ne change, `DYNAMIC_SIM_HASH` tenu) : `ai.defense`
  (dans ses pauses, une fois par attaque du joueur, la part qu'il esquive — la puissante et les compétences seulement — et la part qu'il garde) ;
  `ai.skills` (ses compétences, chacune une séquence à elle, cadencées par leur recharge : l'adversaire n'a pas de PA) ; 17 compétences adverses
  (`FOE_SKILLS` : offensives longues et annoncées, défensives, de soutien) ; `V2_FOES` : les sept rivaux, 2 à 4 compétences chacun, la défense
  des « sophistiqués ».
- **Le bot** (`runV2BotDuel`, `src/combat/bot.ts`) : trois touches ; il choisit un palier comme le bot dynamique choisit une action, tient la
  charge le temps du palier, garde pour la garder pendant une séquence (adresse ≥ 0,5).
- **La course hors écran** (`V2_RACERS`, `v2RacerOf`, `V2_RACE_SLOPE` 8) : chaque rival par le temps que met le bot de référence (adresse 0,5) à
  l'abattre et les dégâts par seconde qu'il lui fait ; mesurée sur les graines 1-20, vérifiée sur les graines 21-26 (12 %) ; les matchs hors
  écran d'une partie v2 la prennent (`pool.ts`), le bot de la partie v2 joue la fiche v2 (`lab.ts`, `match.ts` `v2SheetData`).
- **L'arène** : `?scene=arena&v2=1` (Ren contre Marek de C3), le duel d'une partie v2 (`playArena.ts`), `&input=keys` pour l'ancien schéma
  (`src/arena/v2Arena.ts`) ; touches J (ou 1) attaque tenue, K (ou B) garde tenue, L (ou A) esquive, aucune touche de marche du parvis ; manette
  X / B / A ; le bouton Attaque se tient au toucher. HUD (`DynamicHud` avec son option `charge`, absente = le HUD de C2 tel quel) : trois boutons,
  la bande des paliers (atteints, celui qui part, le suivant et sa progression, les fermés barrés), l'alerte légère avant les compétences
  adverses, aide discrète comprise ; sous 600 px de haut, la bande se retire et le bouton dit le palier. La charge se montre avec les images
  d'aujourd'hui : l'image 0 de `heavy` tenue, un éclat à chaque palier.

### Les « proposé » du lot (à l'essai de l'opérateur)
- La puissante à **2 s** de tenue (le bas des « 2-3 s ») ; les compétences de **2,7 à 9 s** selon leur niveau (Estocade 9 → 6 s, « les plus
  puissantes ~10 s ») ; un palier de compétence au moins 0,25 s après la puissante.
- **La charge remplace la préparation automatique** ; un coup chargé paie sa tenue : puissante ×2,2 de dégâts, Éclair ×4, Fente ×4,2,
  Tourbillon ×3,2, Estocade ×3,4, leur jauge ×2 à ×2,5 ; Rempart et Ferveur ×1,5 de durée ; la légère inchangée.
- **Ce qui coupe une charge** : un coup reçu sans garde, l'esquive du joueur, son break, le K.O. ; un coup gardé la garde ; elle ne monte que
  joueur libre ; relâchée pendant la séquence adverse : refusée, perdue.
- **Touches** : J / K / L (et 1 / B / A) ; manette X / B / A.
- **C3** : défense de Marek (garde 0,35), Vessa (esquive 0,35, garde 0,1), Cassius (0,2 / 0,2), Ilse (garde 0,3), Rhosk et Orla (garde 0,15),
  Tobin aucune ; compétences adverses à recharge (16 à 40 s), 22 à 32 % des séquences quand une est prête ; leurs nombres (`FOE_SKILLS`).
- **L'équilibrage « modéré »** (`V2_FOES` : PV et dégâts par rival) : une marche d'escalier selon l'adresse du bot, chaque rival son seuil ; Marek
  le plus dur. Mesuré (20 duels par case, graines 1001-1020) :

| Rival | adresse 0,2 | 0,4 | 0,5 | 0,6 | 0,9 | durée |
|---|---|---|---|---|---|---|
| Tobin | 100 % | 100 % | 100 % | 100 % | 100 % | 5,4-7,6 min |
| Orla | 0 % | 40 % | 100 % | 100 % | 100 % | 7,3-8,8 min |
| Cassius | 35 % | 95 % | 100 % | 100 % | 100 % | 7,1-11,1 min |
| Ilse | 15 % | 50 % | 100 % | 100 % | 100 % | 7,8-11,2 min |
| Rhosk | 15 % | 55 % | 100 % | 100 % | 100 % | 8,3-12,0 min |
| Vessa | 0 % | 40 % | 90 % | 90 % | 100 % | 7,6-10,1 min |
| Marek | 0 % | 0 % | 25 % | 60 % | 100 % | 7,4-9,4 min |

  Tobin reste facile (« the Hopeful », adresse < 0,2 suffit) ; des duels de Rhosk et d'Ilse dépassent 10 min à adresse 0,4.
- TournamentLab `--rules=v2` (50 graines) : diligent (adresse 0,6) **69 %** de victoires, oisif (0,3) **1 %** ; blessures du joueur 0,98 par partie
  en diligent (la règle des blessures d'aujourd'hui, une victoire à moins de 15 % des PV, frappe souvent sous la version 2 : à revoir, noté).
- La pente de la course v2 : 8 (contre 14 aujourd'hui), pour qu'un rival d'un tiers plus faible gagne encore une fois sur dix.

### Les preuves
- **Le défaut inchangé** (`main` figé `5c6259d` servi sur :5201, l'instantané du lot `45c0439` sur :5202, SwiftShader, `fps=off`) : la ville A, B, C,
  D de nuit et à midi et B avec son panneau, **9 / 9 identiques à l'octet** ; l'arène `clean=1` sous CombatSim et sous `combat=dynamic`, **14 / 14
  identiques** ; l'arène avec son HUD : 10 / 14 identiques au premier passage, les quatre autres (la pulsation CSS des boutons et de l'alerte,
  dont la phase dépend du temps de chargement) **identiques une fois les animations CSS figées** (`FREEZE_CSS=1`, nouvelle option de
  `tools/arena-scene-shots.mjs` : 8 / 8) ; l'écran titre et « Explore the district » (`tools/title-proof.mjs`) : tous les contrôles OK, les trois
  paires **identiques à l'octet** ; `play-flow` victoire `0025acce7a403773` et défaite `397959404c18f714` des deux côtés, les empreintes de UI3.
- **Le drapeau** : `arena-scene-check "v2=1&fps=off"` **PASS** (le hachage `V2_SIM_HASH` du script de la version 2, aucune erreur dans les moments,
  le télégraphe 6,76:1 et 6,97:1 en deutéranopie, le sol dégagé du HUD aux 77 cas, et le contrôle vivant a avancé de 0,05 s cette fois) ; les huit
  moments de la charge capturés (`chargeHeavy`, `chargeSkill`, `chargeLocked`, `chargeGuard`, `foeSkill`, `released`...) et à 812 x 375 à midi ;
  `ui-text` 5 / 5 pages (16 px sur ordinateur, 14 px au téléphone, polices chargées) ; `play-flow V2=1` victoire `768c3c42c6ddcfa7` et défaite
  `37d81c372d3b1e92` rejouées en Node à la même empreinte, mais **[KO] de l'outil** : son contrôle « the arena plays » attendait `dynamic` (écrit en
  V0, avant les règles `v2`) ; l'arène joue bien `v2` ; contrôle corrigé (`V2 ? 'v2'`), repassé au lot V2 ; `play-day V2=1` OK (`9bf8024c0810a17f`).
- **TournamentLab `--rules=v2`**, 50 graines, deux passages au JSON **identique à l'octet** : diligent 72 % de victoires du joueur, blessé 0,8 par
  partie, 0 participant oublié, les 18 événements tirés ; oisif 2 %.
- typecheck, `npm test` (218 tests, dont `tests/combat-charge.test.mjs`, 11 tests, **14 / 14 fautes injectées attrapées**, fichiers rendus à
  l'octet), build et `art:validate` sur l'instantané propre (`git archive`) du commit `45c0439`.
- **Reste local** : l'essai en main de la charge (le ressenti des 2 s et des paliers), le contrôle vivant d'`arena-scene-check` en rendu matériel,
  les poses de charge à dessiner (§ 14), la reprise de la feuille de Marek (AV-10).

### Pensée
- Un coup qui demande du temps doit le rendre : la première mesure (dégâts d'aujourd'hui sous la charge) donnait 0 % de victoires à toute adresse
  sous 0,9 ; la charge n'a de sens que si un palier rapporte plus que les attaques légères qu'il remplace.
- Un tirage qui sert à deux décisions (esquiver ou garder) se lit par cas : la part d'esquive comptée pour une attaque légère qu'on n'esquive pas
  la faisait garder à coup sûr ; le test l'a vu avant le bot.

## Passe V2 — Séance cloud « Version 2 », lot V2 : les compétences (C4 ; AV-9 « Achat, entraînement et défi ») (2026-10-26)

### Fait — [OK]
- **Le catalogue** (`src/combat/skillbook.ts`) : douze compétences, six offensives (Flash cut, Thrust, Lunge, Feint, Whirlwind, Sunder), trois
  défensives (Rampart, Iron Skin, Riposte Stance), trois de soutien (Fervour, Battle Cry, Focus) ; chacune son temps de charge, ses PA et ses
  niveaux 1 à 5 (`src/combat/skills.ts` du lot V1). Les six nouvelles sont des actions de `DynamicSim` construites par `skillAction` ;
  `DYNAMIC_SIM_HASH` et `V2_SIM_HASH` tenus.
- **Les sources** (`src/simulation/v2skills.ts`) : quatre de départ (celles d'aujourd'hui, niveau 1) ; l'entraînement (`drillSkill`, un créneau :
  apprendre une compétence de base, Lunge ou Feint, ou monter une compétence possédée, jusqu'au niveau 3) ; l'achat chez Maître Corvin
  (`buySkill` : Whirlwind 45, Sunder 40, Iron Skin 35 pièces, un dixième de moins à 40 de réputation) ; le défi (lot V4 : Orla enseigne Battle
  Cry, Ilse Riposte Stance, Vessa Focus, et le défi gagné de nouveau monte le niveau au-delà de 3).
- **Quatre au duel** (`setLoadout`) : choisies à la fiche de match (`openSkills(true)`, lot V9), gardées dans la sauvegarde (`v2.kit`) ; les
  paliers de la charge sont les quatre emportées, rangées par temps de charge à leur niveau.
- Maître Corvin (`PEOPLE.corvin`, personne de la version 2 seulement) ; l'écran des compétences (K).
- `tests/v2-skills.test.mjs` (6 tests) : **8 / 8 fautes injectées attrapées**, fichiers rendus à l'octet.

### Les « proposé » du lot
- Les prix (35 à 45 pièces), le plafond de l'entraînement (niveau 3), la remise de réputation ; les maîtres des défis (Orla, Ilse, Vessa).
- Les nouvelles compétences et leurs nombres (`NEW_SKILLS`, `V2_POWER`) : Sunder ×5 (sa jauge), Feint ×3,2, Iron Skin 1,4 de durée, Riposte
  Stance 1,6, Battle Cry 1,5, Focus 1,3.

### Pensée
- Une compétence ajoutée au duel l'est par des données, jamais par une règle : `DynamicSim` ne change pas, son empreinte le prouve.

## Passe V3 — Séance cloud « Version 2 », lot V3 : l'équipement et les boutiques (C5 ; AV-12, avec la note « arme + armure + 2 accessoires ») (2026-10-26)

### Fait — [OK]
- **L'équipement** (`src/simulation/gear.ts`, `v2gear.ts`) : une arme améliorable (trois paliers chez Bram, 10 / 25 / 40 pièces, un créneau, de
  jour, forge en état ; la trempe Wyrmsteel d'aujourd'hui compte pour un palier), une armure, deux accessoires, un sac ; quatorze pièces
  (deux armes à acheter, trois armures, six accessoires, la pierre à aiguiser et l'onguent d'aujourd'hui). Chaque pièce change un nombre réel du
  duel (`v2Mods` → `v2SheetData`) : les dégâts, les dégâts reçus, les PA de départ, la jauge, le temps de charge, la durée des effets, les PV.
- **Les boutiques** : une par district, chacune sa spécialité : Mara (le district : la lame importée, les cuirs du quai, les consommables),
  l'armurière Hilde (le parvis : armures et anneau), le maître d'armes Corvin (le terrain d'entraînement : le sabre et les bottes), Pip (la place
  festive, de l'après-midi au soir : les porte-bonheur). La partie v2 achète par ce système (`shopBuy`, `equip`), Mara ne vend plus par
  `buy` dans une partie v2 ; le jeu par défaut garde son étal.
- **Les prix** (`shopPrice`) : le prix de liste × le district × la réputation (jusqu'à -15 %) × la relation avec le marchand (-10 % à 15) × la
  pénurie d'acier d'aujourd'hui (lames et armures) × la nuit (+20 %) × un marchandage du jour (lot V4) ; sans « simulation financière lourde ».
- `tests/v2-gear.test.mjs` (5 tests) : **5 / 5 fautes attrapées** (une manquée au premier passage, le prix du deuxième palier : le test n'achetait
  jamais ce palier ; assertion ajoutée).

### Les « proposé » du lot
- Les quatorze pièces, leurs prix et leurs effets ; les facteurs des boutiques (armurière ×1,15, maître ×1,1, Pip ×0,9) ; la nuit +20 %.

## Passe V4 — Séance cloud « Version 2 », lot V4 : marchander, défier, voler (AV-11 « Les trois, le vol avec ses conséquences ») (2026-10-26)

### Fait — [OK]
- `src/simulation/v2town.ts`, chaque action change un état réel (contrat de gameplay § 1) :
  - **marchander** : une fois par jour et par boutique, la chance selon la réputation et la relation (0,1 à 0,85) ; réussi, 15 % de moins pour la
    journée ; manqué, un dixième de plus et la relation -4 ;
  - **défier** : un combattant présent (Orla, Ilse au terrain d'entraînement, Vessa au parvis), jamais l'après-midi de son propre combat, un à la
    fois et une fois par jour ; le duel se joue dans l'arène à mi-vie (`challengeSheetFor`), il prend un créneau (contrat § 4.1) ; gagné : la
    compétence du combattant apprise ou montée, +3 de réputation ; perdu : -1, sans blessure ;
  - **voler** : plus facile la nuit et quand la garde est mince ; réussi, la pièce la moins chère non possédée ; pris : réputation -8 (-12 si la
    bourse ne paie pas toute l'amende), amende de 15 au plus, la boutique fermée au joueur pour la journée, ses prix +25 % le lendemain ; jamais
    de prison, les autres boutiques restent ouvertes (l'échappatoire du contrat projet).
- `tests/v2-town.test.mjs` (4 tests) : **5 / 5 fautes attrapées** (une manquée au premier passage, la nuit sans effet : l'oracle de la chance
  écrit dans le test l'a ajoutée).

### Les « proposé » du lot
- Les chances, l'amende, les durées (la journée, le lendemain), la mi-vie des défis, la réputation gagnée ou perdue.

## Passe V5 — Séance cloud « Version 2 », lot V5 : les districts, trois places ouvertes (AV-13 « Le cloud les bâtit, la revue en local après » ; AV-14) (2026-10-26)

### Demande
- Le parvis d'abord, puis la zone d'entraînement, puis la place festive qui remplace Lantern Row, « plus d'espaces et non un long couloir »,
  avec les générateurs du Merchant District ; les feuilles cuites réutilisées par rôle, des sprites générés provisoires pour les autres.

### Fait — [OK]
- **Les places** (`src/world/Plazas.ts`) : trois places de 22 x 19 m praticables en surface, bâties avec les générateurs du district
  (`createMerchantBuilding`, les accessoires d'`InstanceBatch`, les bannières, les maisons lointaines) : le parvis (la porte du Colisée, la
  fontaine, la table du greffier, l'étal de l'armurière, le coin de la guérisseuse, les braseros la nuit) ; le terrain d'entraînement (trois
  cercles de sable et leurs poteaux, les râteliers, la remise du maître, la caserne) ; la place festive (la scène, les étals, les guirlandes de
  lanternes allumées la nuit, la taverne). Les points des personnes et de la foule sont des tables (`PLAZA_SPOTS`, `PLAZA_WANDER`).
- **La page** (`src/world/PlazaApp.ts`, `src/ui/playPlaza.ts`) : le rendu de la ville (matériaux, lumières, ciel, lune ou soleil, ombre, reflet
  des flaques, post-traitement) dans l'état du jour du créneau ; le héros marche (flèches, WASD), la caméra le suit sur toute la surface et se
  penche du côté où il va (une pose fonction lisse de sa place : le graphe de cadrages d'un espace ouvert, sans coupe) ; E parle à la personne
  à côté. Pas de bake de visibilité : tout est dessiné (les places sont petites).
- **La simulation** : la place `training` (seulement dans une partie v2, `V2_PLACES`) ; Lantern Row devient « the Festival Square », ouverte de
  jour comme de nuit ; les personnes déplacées dans une partie v2 (`v2at`, `placeOf`) : Orla au terrain d'entraînement (l'entraînement et
  `spar` la suivent), Corvin et Ilse aussi, Pip et le barde Wren sur la place festive, le sergent Brann (nouveau, le maître d'exercice) ;
  l'armurière au parvis. Le jeu par défaut garde ses trois lieux, ses gens et ses pages.
- **Les PNJ** : les feuilles cuites approuvées par rôle (le héros, les gardes au portail du parvis, l'encapuchonné sur la place la nuit, les cinq
  passants et leurs variantes V1) ; pour les treize rôles sans feuille, un sprite généré par le code (`prov-<id>`), marqué provisoire.
- `tests/v2-places.test.mjs` (4 tests) : **6 / 6 fautes attrapées**.

### Les personnages à cuire plus tard (provisoires aujourd'hui)
Odo, Anwen, Hilde, Corvin, Pip, Lio, Orla, Vessa, Marek, Ilse, Cassius (portraits en ville et sprites sur les places), le sergent Brann, le
barde Wren. Les feuilles de combat x3 de Ren et Marek suivent leur propre chemin (AV-10).

### Les preuves (instantané `e499446`, SwiftShader)
- Le défaut inchangé contre `main` figé : la ville **9 / 9**, l'arène **14 / 14**, l'arène et son HUD **14 / 14** à animations CSS figées des deux
  côtés, `play-flow` victoire et défaite aux empreintes de UI3.
- Les places : captures de jour et de nuit, au téléphone ; `ui-text` **4 / 4 pages** ; `play-flow V2=1` **[KO] de l'outil** (il cliquait
  « Enter the arena » puis attendait l'adresse ; la version 2 ouvre d'abord la fiche de match : outil corrigé), `play-day V2=1` **[KO] de
  l'outil** (Orla est au terrain d'entraînement dans une partie v2 ; l'horloge dit « / 10 » : outil corrigé). Repassés sur la tête finale
  (Passe V10).

### Les « proposé » du lot
- La taille et la composition des places, leur cadrage, la répartition des gens, la foule par état du jour (nuit 4, matin 6, midi 9, fin 7).

### Reste local
- Les mesures GPU des places, la revue visuelle en rendu matériel ; aucune visibilité à prouver (pas de bake).

### Pensée
- Un espace ouvert n'a pas besoin d'un graphe de cadrages écrit pose par pose : une pose qui est une fonction lisse de la place du héros donne
  la continuité des fondus ancrés sans les écrire.

## Passe V6 — Séance cloud « Version 2 », lot V6 : la narration, les dix jours et les cinématiques (AV-15 « Structure, dialogues et cinématiques ») (2026-10-26)

### Fait — [OK]
- **Les dix jours** (`src/tournament/v2calendar.ts`, le verrou de planification du contrat projet § 4) : une partie v2 dure dix jours
  (`daysOf`) ; la poule en trois tours (jours 2, 4, 5 : Vessa, Orla, Cassius pour le joueur ; chaque paire une fois) ; **la coupe** après
  l'après-midi du jour 5 (les quatre meilleurs aux demi-finales du jour 6, 1 contre 4 et 2 contre 3 ; les quatre autres aux **combats de la
  Porte**) ; **le match majeur** du jour 8 (la troisième place, la finale de la Porte) ; **la finale** du jour 10 ; le champion couronné, +20 de
  réputation et 100 pièces s'il s'agit du joueur ; jours 3, 7 et 9 libres. Les hérauts annoncent chaque jour. La sauvegarde d'un jour au-delà
  de 3 n'est relue que pour une partie v2.
- **L'histoire** (`src/narrative/v2story.ts`) : les arcs des rivaux dits par leurs mots selon l'acte et ce qui s'est passé entre vous (Marek,
  Vessa, Cassius, Orla, Ilse) ; **le recrutement d'Orla** au jour 7 si elle est devenue une amie (`recruit`) : alliée pour la phase d'équipe,
  +1 PA au début des duels d'ici là ; l'écran de fin de la version 2 (le rang final, `v2Ranking`).
- **Les cinématiques jouées en direct** (`CUTSCENES`, `src/ui/cutscene.ts`) : l'arrivée (parvis), la coupe (parvis, soir du jour 5), Orla
  (terrain d'entraînement, jour 7), la veille de la finale (place festive, soir du jour 9), le matin de la finale (parvis) ; caméra scriptée,
  marche des sprites, répliques en bas avec bandes noires, passables (Échap) ; chacune une fois (`watched`). Un navigateur piloté par un outil
  ne les joue qu'avec `cutscene=1` (comme l'écran titre et `navigator.webdriver`).
- TournamentLab `--rules=v2`, 50 graines, diligent (adresse 0,6) : le joueur **passe toujours la coupe**, finaliste **64 %**, champion **10 %** (Marek), 5 combats
  par partie, 75,6 % de victoires, 1,96 blessure par partie ; oisif : coupe 4 %, septième en général. Le jeu par défaut au TournamentLab
  (classic diligent et oisif, dynamic) : **JSON identique à l'octet à `main`** sur 50 graines.
- `tests/v2-story.test.mjs` (6 tests) : **7 / 7 fautes attrapées** (une manquée d'abord, la coupe prise par le bas : le test vérifie désormais
  les points de la poule).

### Écart consigné
- La phase d'équipe du contrat projet (§ 5.1) n'existe pas : le tournoi de la version 2 reste en duels 1 contre 1 jusqu'à la finale ; Orla
  recrutée est préparée pour elle. Écart consigné, non tranché.

### Les « proposé » du lot
- Le calendrier (poule en trois tours, coupe à quatre, Porte, match majeur), les adversaires de la poule, le prix du champion ; tous les textes
  des rivaux et des cinématiques (`v2.line.*`, `v2.scene.*`, `v2.day.*`) ; l'effet d'Orla (+1 PA).

### Pensée
- Un tableau qui se construit après un créneau se teste sur des parties entières : chaque partie du TournamentLab vérifie la coupe, les
  finalistes et le champion.

## Passe V7 — Séance cloud « Version 2 », lot V7 : les événements dynamiques (AV-16 « Relier et compléter ») (2026-10-26)

### Fait — [OK]
- **Les dix-huit d'aujourd'hui reliés** par ce qu'ils changent déjà : la pénurie d'acier fait monter les lames et armures des boutiques, la
  faveur de Mara est sa relation, la forge sabotée arrête les paliers de Bram, les aumônes du Temple la guérisseuse, les tire-laine la bourse ;
  `night-market` et `upset-talk` ont une issue v2 qui nomme la place festive (condition `{ v2: true }`, fausse dans le jeu par défaut).
- **Quatorze événements nouveaux** (`src/events/v2catalog.ts`, lus après les dix-huit dans une partie v2 seulement) : chaque district de jour et
  de nuit (la caravane d'acier et l'alerte de la garde au district ; les bookmakers et la veillée au parvis ; la leçon ouverte de Corvin, un
  cinquième de moins, et la rixe de la caserne au terrain ; les marionnettes, la parade des lanternes et les tricheurs sur la place festive) ;
  le vol pris et le défi gagné ont leurs suites ; **le sabotage ciblé de la phase éliminatoire** (contrat § 4, jour 6) : une sangle coupée la
  nuit avant un combat du tableau (+15 % de dégâts reçus ce jour-là), annoncé par deux signes (l'armurière questionnée, les casiers ouverts),
  avec ses réponses : Hilde vérifie l'équipement (`checkGear`, 5 pièces), la garde payée, le signalement, la confrontation.
- Le moteur : les conditions `v2`, `today`, `semi` et les effets `today`, `tomorrow` (`src/events/types.ts`, `engine.ts`).
- `tests/v2-events.test.mjs` (4 tests) : **6 / 7 fautes attrapées** ; la manquée (la parade passée à l'après-midi) laisse un événement de nuit
  à la place festive (les tricheurs) : le test exige un événement de nuit par district, ce qui reste vrai — faute sans effet sur la règle.
- TournamentLab v2 : les événements tirés sur 50 graines (diligent) : la leçon 99 fois, les marionnettes 246, les bookmakers 48, la veillée et la
  parade 50, le sabotage de l'équipement 50 (Cassius est hostile dans toutes ces parties : à revoir, noté).

### Les « proposé » du lot
- Les quatorze événements, leurs causes, leurs chances, leurs textes ; le sabotage dans chaque partie où Cassius est hostile.

## Passe V8 — Séance cloud « Version 2 », lot V8 : le son par le code (AV-17 « Effets, ambiances et musique simple ») (2026-10-26)

### Fait — [OK]
- `src/audio/score.ts` (pur) : treize effets (coup, coup puissant, garde, esquive, palier, lancer, K.O., break, clic, ouverture, pièce, pas,
  refus), faits d'oscillateurs et de bruit filtré avec leurs enveloppes ; les ambiances de chaque lieu par l'état du jour (des lits de bruit
  filtré : foule, vent, eau, la clameur de l'arène ; des appels épars : oiseaux le jour, grillons la nuit, le marteau de la forge, un luth sur
  la place festive, les clameurs du Colisée les après-midi de combat) ; un air pincé sur le mode de l'état du jour (pentatonique le matin,
  diatonique à midi et en fin de journée, dorien la nuit), généré d'une graine, qui revient à la tonique.
- `src/audio/Sound.ts` (Web Audio) : le contexte n'est créé qu'au premier geste (touche ou clic) ; volume, part de la musique, coupure gardés dans
  le navigateur (une commodité ; un stockage bloqué donne les valeurs par défaut) ; chargé à la demande par les seules pages de la version 2 (les
  places, le district d'une partie v2, le duel v2) ; V ouvre le réglage, N coupe.
- `tests/v2-sound.test.mjs` (5 tests) : **6 / 6 fautes attrapées** (une manquée d'abord, une note hors du mode : le test lisait le mode dans la
  table elle-même ; il vérifie désormais la forme des modes).

### Les « proposé » du lot
- Tous les timbres, les gains, les tempos (66 la nuit à 96 à midi), les modes, les ambiances par lieu.

### Reste local
- L'écoute : aucun son n'est entendu en rendu logiciel sans haut-parleur ; la revue des mélanges est à faire en local.

## Passe V9 — Séance cloud « Version 2 », lot V9 : l'interface P4, P5, P6 et les écrans des lots V1 à V8 (2026-10-26)

### Fait — [OK]
- Dans le système de design UI3, derrière `flags.v2` :
  - **P4** : le dialogue en bas de l'écran, la scène visible au-dessus, la caméra des places tournée vers l'orateur ;
  - **P5** : « Here » réduit aux actions du lieu ouvertes maintenant ; le repos et l'attente sous l'état du joueur ;
  - **P6** : la fiche de match (l'étape du tournoi, l'adversaire avec son visage, son épithète et sa présentation, ce qu'on sait de ses
    compétences — l'espionnage le dit —, l'équipement porté, le conseil d'Orla) avant le choix des quatre ; au retour, la victoire ou la défaite
    en grand ;
  - les écrans des lots : le palier de charge (V1), les compétences (K), l'équipement (G), les boutiques et les actions en ville dans les
    dialogues, le son (V), les cinématiques, l'écran de fin des dix jours.
- `tools/ui-text.mjs` : **8 / 8 pages** (dialogue, fiche de match, son, cinématique ; 1920 x 1080 et 812 x 375) et 4 / 4 pour les places :
  16 px au moins sur ordinateur, 14 px au téléphone, les deux polices chargées, aucun caractère hors de leur sous-ensemble.

### Les « proposé » du lot
- La mise en page des trois écrans, les textes de la fiche et du résultat.

## Passe V10 — Séance cloud « Version 2 », le bilan et l'essai (2026-10-26)

### L'essai
- Le guide : `briefs/v2-trial.md` (l'adresse `?play=1&new=1&v2=1`, les touches, un parcours d'une heure, ce qu'il faut regarder, ce qui reste
  local). La fiche d'arbitrages : `briefs/fiche-v2.html` (bâtie sur `briefs/fiche-av1.html` : 18 points en cinq groupes, sa clé locale
  `fiche-v2-v1`, son récapitulatif) ; une séance locale la publiera.

### Les preuves de la tête finale
- Instantané `256d9ab` (la tête du code, `git archive`) servi sur :5202 contre `main` figé (`5c6259d`, le défaut de V1 est le même) sur :5201,
  SwiftShader, `fps=off` des deux côtés :
  - **le défaut inchangé** : la ville A, B, C, D de nuit et à midi et B avec son panneau **9 / 9 identiques à l'octet** ; l'arène `clean=1` sous
    CombatSim et `combat=dynamic` **14 / 14** ; l'arène et son HUD **14 / 14** (animations CSS figées des deux côtés, `FREEZE_CSS=1`) ; soit
    **37 / 37** ; l'écran titre et « Explore the district » : 10 contrôles OK, les trois paires **identiques à l'octet** ; `play-flow` victoire
    `0025acce7a403773` et défaite `397959404c18f714`, les empreintes de UI3 ; le TournamentLab du jeu par défaut (classic diligent et oisif,
    `--rules=dynamic`, 50 graines) : **JSON identique à l'octet à celui de `main`** (empreinte de chaque partie comprise) ;
  - **le drapeau** : `play-flow V2=1` victoire (jour 2, Vessa) `ae47f4e169b1e2ef` et défaite (jour 4, Orla, l'outil généralisé aux jours de la
    version 2) `6c78b2357fd9f347`, chacune la fiche de match, l'arène en règles `v2`, rejouée en Node à la même empreinte ; `play-day V2=1` OK
    (`08a511b9678f6d85`) ; TournamentLab `--rules=v2` 50 graines deux fois au JSON identique ; `arena-scene-check "v2=1"` : hachage `V2_SIM_HASH`,
    aucune erreur, télégraphe 6,76:1, sol dégagé aux 77 cas, mais **[KO] du seul contrôle vivant** (0 s avancée en rendu logiciel ; 0,05 s en
    V1 : le contrôle vivant est local) ; les places (`__stats()`) : 80 à 119 appels de dessin, 53 000 à 75 000 triangles de place, 7 à 11
    lumières, l'atlas généré 512 x 1248 et l'atlas cuit 2048 x 2016 (celui de la ville : les places n'ajoutent aucune feuille) ; captures de
    jour, au crépuscule, de nuit, au téléphone, la cinématique d'arrivée, la fiche de match ; `ui-text` 8 / 8 pages (Passe V9) et 4 / 4 (places).
- typecheck, `npm test` (**252 tests**, 0 échec), build et `art:validate` (0 erreur) sur l'instantané propre.

### Le bilan
- **Fait** : les onze lots V0 à V10, tous derrière `flags.v2`, le jeu par défaut inchangé (prouvé à 0 px, au TournamentLab à l'octet, au
  `play-flow`) : la commande à trois touches et la charge par paliers (A3), C3 et l'équilibrage, douze compétences, l'équipement et quatre
  boutiques, marchander / défier / voler, trois places ouvertes, les dix jours et cinq cinématiques, quatorze événements nouveaux et le sabotage
  ciblé de la phase éliminatoire, le son par le code, P4 à P6. 9 nouveaux fichiers de tests (dont `texts` et `combat-charge`), chacun passé à l'épreuve des fautes injectées.
- **Pas fait, et pourquoi** : la phase d'équipe (écart consigné avec le contrat projet § 5.1 : hors du mandat, la recrue est préparée) ; les
  textes de combat des compétences adverses restent dans `src/combat/v2duel.ts` (`FOE_SKILLS`, en anglais, hors des tables : à déplacer) ; les
  portraits des personnes de la version 2 sans feuille cuite (Corvin, Hilde, Pip, Brann, Wren : pas de visage dans les dialogues) ; une
  fiche de match pour les défis.
- **Les « proposé »** : listés dans chaque passe V0 à V9 ; les plus importants sont dans la fiche `briefs/fiche-v2.html`.
- **Ce qui reste local** : les mesures GPU des places et des pages v2 (budget E24) ; la revue visuelle des places, des cinématiques et des écrans
  en rendu matériel ; l'écoute du son ; le contrôle vivant d'`arena-scene-check` ; les cinq poses de charge (§ 14) et la feuille de Marek (AV-10) ;
  les personnages à cuire (Passe V5) ; le passage au défaut, après l'essai de l'opérateur.
- **La branche** : `claude/friendly-davinci-17lk4m` est fusionnée dans `main` (avance rapide, CI verte sur `4a9e478`) et supprimée en local ; sa suppression sur le dépôt distant a été refusée depuis le cloud (« the remote end hung up unexpectedly ») : une séance locale la supprimera (`git push origin --delete claude/friendly-davinci-17lk4m`).
- **Les règles revues à l'essai** : la règle des blessures (fréquentes sous la charge), le sabotage de l'équipement dans chaque partie où
  Cassius est hostile, des duels longs contre Rhosk et Ilse.

### Pensée
- Un seul drapeau pour une dizaine de systèmes rend le défaut facile à prouver : chaque preuve du défaut est la même d'un lot à l'autre, et le
  TournamentLab compare des parties entières à l'octet.
- Les outils de preuve écrits avant un système le manquent (`play-flow`, `play-day`) : leurs contrôles de la version 2 ont échoué pour de
  mauvaises raisons ; un lot qui change un parcours change aussi l'outil qui le parcourt, dans le même commit.

