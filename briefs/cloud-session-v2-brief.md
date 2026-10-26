# Brief — séance cloud « Version 2 » de Cité du Tournoi (avance autonome)

Ce brief est versionné dans `briefs/cloud-session-v2-brief.md` (journal, Passe AV1). Relis-le après chaque compactage du contexte. Parle et
écris en français : journal, bilan, notes. Le code et les textes du jeu sont en anglais (AV-4).

## 0. Pleine autonomie, sans relais

- **L'opérateur ne te répond pas pendant la séance, et aucune séance locale ne te relaie** (AV-19 « Pas de relais »). Ne t'arrête jamais pour
  demander, n'attends aucune réponse. Avance sur tout le brief, lot après lot, jusqu'au bilan.
- **Le mandat de l'opérateur**, mot pour mot : « je veux que la session cloud soit full autonome en avancant sur tous les aspects possible sans
  mon interventions sans le bsoin des outils externes... cela comprend : narration, structure, gameplay, sons, bref je veux une avance concrete
  afin que nous puissons nous concentre sur les details restants qui demandent une supervision ».
- **Tu tranches toi-même les détails** que la fiche ne fixe pas : nombres, contenus, textes, mise en page (AV-3 « Elle tranche les détails,
  notés « proposé » »). Chacun est noté **« proposé »** au journal, avec sa raison, pour la revue de l'opérateur. Ce n'est jamais présenté comme
  une décision de l'opérateur.
- **Les décisions réservées à l'opérateur**, que tu ne prends pas :
  - l'approbation d'un art pour la production, et toute nouvelle feuille cuite ;
  - le Gold Master ;
  - le jeu par défaut : il ne change pas (§ 2) ;
  - le contenu, les cadrages et l'aspect du Merchant District, qui est clos ;
  - les installations, dont toute nouvelle dépendance npm ;
  - les verrous des contrats, sauf l'amendement que l'opérateur a décidé en AV-5 (§ 3, lot V1).
- **Un écart entre un contrat et le code** se consigne au journal ; il ne se tranche pas.

## 1. À lire d'abord, dans cet ordre

1. `AGENTS.md` : les règles du dépôt (branches, journal, preuves, art, outils).
2. `JOURNAL.md`, **en entier**, dont la Passe AV1 (la fiche de ce mandat). Un fichier de `journal/` ne s'ouvre que par son index.
3. `contracts/` : `PROJECT_MASTER_CONTRACT.md`, `GAMEPLAY_MASTER_CONTRACT.md`, `TOURNAMENT_MASTER_CONTRACT.md`. Ils font foi sur le gameplay et le
   tournoi : relis leurs verrous (§ 14 du gameplay, § 15 du tournoi) avant chaque lot.
4. `briefs/combat-system.md` (la spécification du combat, approuvée en CB1), `briefs/combat-trial-c2.md` et la Passe C2F (l'essai de l'opérateur).
5. `briefs/roadmap-2026-10.md`, puis `briefs/cloud-session-playable-feedback.md` (les leçons de la première séance cloud, § 5 ci-dessous).

## 2. Le drapeau « version 2 » et le jeu par défaut

- AV-2 « Un drapeau « version 2 » pour tout, défaut inchangé » : **tous** les nouveaux systèmes de cette séance s'activent ensemble par un seul
  drapeau de partie, `flags.v2`. Une nouvelle partie le prend par `?play=1&new=1&v2=1` (comme `combat=dynamic`), et il est gardé dans la
  sauvegarde. Les pages hors mode jouable le prennent par `?v2=1` quand il le faut (arène, districts).
- `flags.v2` implique les règles du combat dynamique (`flags.combat = 'dynamic'`), avec la nouvelle commande du lot V1.
- **Sans le drapeau, le jeu reste celui d'aujourd'hui**, prouvé à 0 px contre `main` figé (§ 5). Le défaut ne change qu'après l'essai de
  l'opérateur, dans une tâche à part.

## 3. La mission : les lots, dans l'ordre

AV-1 « Tout ce qui se fait par le code ». Fais les lots **dans l'ordre**. Chacun est fusionné dans `main` dès qu'il passe sa validation : un arrêt
en route doit laisser `main` jouable. Si un lot bute, consigne-le, laisse-le derrière le drapeau et passe au suivant.

**V0 — Le drapeau et les tables de textes.**
- `flags.v2` (§ 2), son passage dans la sauvegarde et les pages, un état nommé de départ (`src/simulation/named.ts`).
- AV-4 « Anglais, textes rassemblés » : les textes du jeu (dialogues, interface, événements, quêtes) rassemblés dans des tables, sans en changer un
  mot pour le jeu par défaut, pour qu'une traduction reste une tâche à part.

**V1 — La commande à trois touches et l'attaque chargée** (décision A3 de l'opérateur, AV-5).
- La demande de l'opérateur, mot pour mot : « Ah et enfin on aura une dernier optimisation pour le systeme de combat. surtout cote joueur, au lieu
  d'avoir plusieurs touches d'action on en aura 3 ( garde, esquive, attaque ) sauf que l'attaque sera comme une charge a niveau : donc une simple
  pression permet de faire une attaque simple, en restant legerement appuye pendant 2-3s, on utilise une attaque lourde, si on reste 5 seconde
  de plus on debloque une action de competences et ainsi de suite, les competences les plus puissantes nous obligerait a charger pendant peut
  etre 10s ( ce n'est qu'un exemple ) mais donc peut etre quee nous aurrions des niveau de competences qui determine le puissance et le temps de
  charge ( exemple de final fantasy 6 avec le personnage Cyan ) ».
- Ses décisions : AV-5 « Oui, amender (A3), l'ancien schéma gardé pour comparer » ; AV-6 « Garder les PA en plus de la charge » ; AV-7 « Comme
  Cyan, paliers successifs » ; AV-8 « Un niveau par compétence ».
- **L'amendement** : dans `briefs/combat-system.md` (§§ 1, 4, et la liste des animations § 14) et dans la phrase amendée du § 6.1 du contrat projet,
  remplace « pas de charge tenue » par la charge par paliers. Chaque texte amendé note en tête la décision AV-5, citée mot pour mot et datée du
  26/10/2026, comme l'amendement CB-8 l'a fait. Le reste des contrats ne change pas.
- **La règle** : trois touches, garde (tenue), esquive, attaque.
  - L'attaque se charge en la tenant : une pression = l'attaque légère ; tenue ~2-3 s = l'attaque lourde ; puis, palier après palier, les
    compétences emportées, rangées par temps de charge. Relâcher lance celle du palier atteint (comme Cyan). Le HUD montre le palier.
  - Les PA restent (AV-6) : une compétence coûte toujours ses PA ; un palier dont les PA manquent ne s'ouvre pas, et le HUD le montre.
  - Le niveau d'une compétence (AV-8) fixe sa puissance et son temps de charge ; pas de niveau global du joueur (contrat projet § 7).
  - Ce qui coupe une charge (un coup reçu, la priorité de l'adversaire, le « repoussé » de CB-3) : tu le fixes, noté « proposé ».
  - L'ancien schéma de C2 (touches 1-6) reste disponible derrière un paramètre (par exemple `input=keys`) pour comparer à l'essai.
  - Le pad et le tactile suivent le même schéma. Clavier et pad : la touche d'attaque ne doit pas entrer en conflit avec la marche du parvis.
- **Les animations** : la charge se montre avec les images d'aujourd'hui. Liste, dans la spécification, les poses de charge à ajouter aux feuilles
  cuites. La feuille de Marek est **en pause** jusqu'à la nouvelle commande (AV-10 « Mettre Marek en pause jusqu'à la nouvelle commande ») : ta
  liste lui servira à reprendre. Ne touche pas aux feuilles ni à la branche `marek-combat-x3`.
- **C3, les adversaires**, sous la nouvelle commande : la garde et l'esquive des rivaux, leurs 2 à 4 compétences, les sept profils plus Marek et
  Vessa, l'équilibrage vers « modéré » (L7-4, CB-11 « Intégré à C1 / C3 »), le bot et la course hors écran recalés (TournamentLab
  `--rules=dynamic` et avec `v2`).

**V2 — Les compétences** (C4 ; AV-9 « Achat, entraînement et défi »).
- Un catalogue court : une douzaine de compétences au plus, des familles offensive, défensive et de soutien, chacune avec son temps de charge, ses
  PA et ses niveaux.
- On les obtient par l'achat (un maître d'armes, cher), l'entraînement (un créneau, une compétence de base) et le défi en ville (battre un
  combattant apprend sa compétence et fait monter les niveaux, comme Octopath Traveler).
- On en emporte quatre au duel, choisies à la fiche de match (l'écran de préparation).

**V3 — L'équipement et les boutiques** (C5 ; AV-12 « Arme + 3 accessoires, une boutique par district », avec la note de l'opérateur, mot pour mot :
« arme + armure + 2 accessoires »).
- **La note fait foi** : une arme améliorable par paliers, une armure et deux accessoires.
- Une boutique par district, chacune avec sa spécialité. Les prix suivent le district, la réputation, la relation, les événements et le jour, sans
  « simulation financière lourde » (contrat de gameplay § 10). Les objets d'aujourd'hui (pierre à aiguiser, onguent, lame importée, trempe de
  Bram) sont repris dans ce système.

**V4 — Les actions en ville** (AV-11 « Les trois, le vol avec ses conséquences »).
- **Marchander** : selon la réputation et la relation avec le marchand.
- **Défier** : un duel en ville, pour apprendre une compétence et monter ses niveaux (V2) ; il coûte un créneau quand le contrat le veut (§ 4.1).
- **Voler** : un vrai risque, plus facile de nuit. Pris, la réputation baisse, la garde s'en mêle, les prix montent ou la boutique ferme pour la
  journée. Une échappatoire existe toujours (contrat projet, règle anti-frustration).
- Aucune n'est un mini-jeu isolé (contrat de gameplay § 1) : chacune change un état réel.

**V5 — Les districts** (AV-13 « Le cloud les bâtit, la revue en local après » ; AV-14 « Cuits réutilisés, générés provisoires pour le reste »).
- **Dans l'ordre** : le parvis de l'arène (la place principale) d'abord, puis la zone d'entraînement, puis la place festive, qui remplace la
  maquette Lantern Row. Le tout derrière le drapeau.
- **Le principe de l'opérateur**, mot pour mot : « Avec une volonte de respecter nos structure etabli dans district merchant mais en y ajout plus de
  profondeur, surtout pour la place principal et training, je veux que les zones est plus d'espaces et non un long couloir comme district
  merchant ». Donc les générateurs et la structure du Merchant District, mais des places ouvertes : une zone praticable en surface, un graphe de
  cadrages pour un espace ouvert, des poses de bake sur toute la surface.
- Chaque district a son identité, sa fonction, ses occasions et ses risques, son profil de jour et de nuit (contrat de gameplay § 6), et ses états
  du jour (`DayState`).
- **Les PNJ** : les onze feuilles cuites approuvées et leurs variantes V1, placées par rôle ; pour un rôle sans feuille, un sprite généré par le
  code, marqué provisoire. Tiens la liste des personnages à cuire plus tard au journal, et respecte la place dans la texture (672 images garanties,
  ~382 prises).
- **Ce qui reste local** : les mesures GPU, les preuves de visibilité sur GPU, la revue visuelle de l'opérateur. Fais les preuves en rendu logiciel
  que tu peux (bake réussi, aucune pièce perdue contre `vis=0`) et liste ce qui doit être refait en local.

**V6 — La narration et les cinématiques** (AV-15 « Structure, dialogues et cinématiques »).
- La structure des dix jours du tournoi (verrou de planification du contrat projet § 4) : actes, fil principal, arcs des rivaux, recrutement
  d'Orla.
- Les dialogues, et des cinématiques jouées en direct aux moments clés : caméra scriptée, dialogues, mouvements des sprites existants.
- Chaque texte est marqué « proposé » pour la relecture de l'opérateur.

**V7 — Les événements dynamiques** (AV-16 « Relier et compléter »).
- Relie les dix-huit événements d'aujourd'hui aux nouveaux systèmes : boutiques, équipement, défis, vols, districts.
- Ajoute ceux qu'il faut pour que chaque district ait les siens, de jour et de nuit. Garde les signes et les réponses pour les sabotages (contrat
  de gameplay § 9) et les preuves par le TournamentLab.

**V8 — Le son** (AV-17 « Effets, ambiances et musique simple »).
- Tout par le code (Web Audio), sans fichier audio : les effets (combat, interface, pas), des ambiances par lieu et par moment de la journée, une
  musique simple.
- Un réglage de volume et une coupure. Derrière le drapeau.
- Le son ne démarre qu'après un geste de la personne (règle des navigateurs).

**V9 — L'interface**, dans le système de design UI3 (direction C « Héraldique pixel », `src/ui/design/`).
- P4 (le dialogue en bas, l'orateur visible), P5 (« Here » réduit aux actions du lieu) et P6 (la fiche de match et la victoire), « Avec la
  direction choisie ».
- Les écrans des lots V1 à V8 : le palier de charge, les compétences et leurs niveaux, l'équipement, les boutiques, les actions en ville, le
  journal de quête, le volume.
- `tools/ui-text.mjs` doit passer : 16 px sur ordinateur, 14 px au téléphone.

**V10 — Le bilan et l'essai.**
- Une adresse d'essai de la version 2, et un guide `briefs/v2-trial.md` : touches, parcours conseillé, ce qu'il faut regarder.
- Une fiche d'arbitrages en HTML dans `briefs/`, bâtie sur la page de la fiche AV (`briefs/fiche-av1.html` : choix enregistrés et relus ; change son
  `GROUPS`, son en-tête, sa clé locale et son récapitulatif), pour l'essai de l'opérateur : chaque
  « proposé » important, le passage au défaut, ce qui reste local. Une séance locale la publiera.
- Le bilan au journal.

## 4. Les limites et le dépôt

- **Pas de service externe** (ni génération d'images, ni Aseprite, ni le GPU de l'opérateur) et **aucune nouvelle dépendance** : `npm ci` seulement.
  Chrome tourne en rendu logiciel (SwiftShader : `CHROME_ARGS` comme dans `AGENTS.md`).
- **Les branches** (AV-18 « Tout de suite, en exception à la règle ») : une branche locale `marek-combat-x3` existe sur la machine de l'opérateur, en
  pause, sans commit. Elle n'existe pas sur le dépôt distant : ne la crée pas et n'y touche pas. Toi, tu as **une seule branche** pour toute la
  séance, le même nom à chaque lot. Chaque commit est poussé tout de suite, et chaque lot est fusionné en avance rapide dans `main`. Pas de force
  push, pas de réécriture d'historique.
- Les commits « (en cours) » sont permis sur ta branche : le crochet de fin de tour veut un arbre propre.
- Avant chaque push, vérifie l'absence de secrets et de chemins machine.
- Les fins de ligne : les tests doivent aussi passer sur un clone Windows en `core.autocrlf` (un oracle qui lit le disque normalise en LF ; Passe Q3).

## 5. Les preuves

- **Le jeu par défaut inchangé**, à chaque lot : `main` figé servi sur un autre port, puis `tools/detshots.mjs` à 0 px (la ville A, B, C, D, de nuit
  et à midi), l'écran titre (`tools/title-proof.mjs`), l'arène (`tools/arena-scene-check.mjs`, `clean=1` à 0 px), `tools/play-flow.mjs` victoire et
  défaite, sans le drapeau.
- **Le drapeau** : `tools/play-flow.mjs` et `tools/play-day.mjs` avec `v2`, le TournamentLab sur 50 graines avec `v2`, rejoué en Node à la même
  empreinte.
- **Chaque nouveau test attrape d'abord des fautes injectées** (trois au moins), et les fichiers sont rendus à l'octet.
- typecheck, `npm test`, build, `art:validate` à chaque lot ; la CI lue par l'API GitHub publique.
- **Le temps** : en rendu logiciel, un démarrage de page prend 2 à 3 minutes et une série de preuves 20 à 40 minutes. Prévois environ un quart de
  la séance pour elles, au plus deux navigateurs à la fois, et `fps=off` des deux côtés d'une preuve en direct.

## 6. Le journal

- Une passe par lot (V0 à V10), en français, dans le même commit que le travail. Résultats **[OK]**, **[KO]** ou **[?]**, mesures, leçon.
- Les « proposé » listés à part dans chaque passe.
- Archive les plus anciennes passes quand celles gardées dépassent environ 60 Ko (règle d'`AGENTS.md`, avec sa preuve).
- Mets à jour `briefs/roadmap-2026-10.md`, « À reprendre » et `AGENTS.md` (paramètres, commandes) à chaque lot.

## 7. La fin

- Le bilan au journal : ce qui est fait, ce qui ne l'est pas et pourquoi, les « proposé », ce qui reste local (mesures GPU, revue visuelle des
  districts, poses de charge des feuilles, personnages à cuire), la fiche de l'essai.
- `main` à jour, ta branche fusionnée puis supprimée. Si GitHub refuse la suppression depuis le cloud, note-le au bilan : une séance locale la
  supprimera.
