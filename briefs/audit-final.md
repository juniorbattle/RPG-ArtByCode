# Audit final du gameplay et de la structure — Passe AU1 (11/11/2026)

## 0. La demande, la méthode

**La demande de l'opérateur, le 2026-11-11, mot pour mot** (transmise par la séance qui coordonne) : « Bon on semble etre sur la fin du projet globale, bien sure il y aura des ajustements mais nous sommes sur la fin d'un projet pret. donc je vais que tu me fasses un audit complet du gameplay et structure globale du projet pour conclure et valider le tout ».

**Le cadre** : un audit en lecture et en mesure seulement. Aucune règle, aucun nombre, aucun contenu du jeu n'a changé ; aucun écart n'est résolu (règle C3) ; les décisions vont sur la fiche d'arbitrages AU1. Tout est mesuré sur `main` à `59e284a` (Passe AL1), dans le worktree `.claude/worktrees/audit-final` (branche `claude/audit-final`), avec son propre serveur DEV (`au-dev`, :5411).

**Ce qui a été fait**
- `npm run typecheck`, `npm test`, `npm run build`, `npm run art:validate`.
- Le TournamentLab sur les graines 1 à 50 avec ses quatre politiques (`idle`, `diligent`, `curious`, `planner`), soit 200 parties de dix jours.
- Deux parties entières dans le navigateur, en français puis en anglais, la seconde en rechargeant chaque page comme un joueur.
- Les preuves existantes : `default-proof`, `tutorial-proof`, `play-day`, `play-flow` (gagné et perdu), `pad-proof`, `settings-proof`, `remap-proof`, `exits-proof`, puis `ui-text` (47 pages et formats) et `ui-contrast` (24), en français et en anglais.
- Un film des changements d'écran, avec et sans le mouvement réduit du système.
- `tools/perf.mjs` (budget E24) et `tools/startup.mjs` sur des pages représentatives.
- Trois relectures du code déléguées à des agents, chacune avec ses propres mesures :
  - la structure de `src/` (dépendances, code mort, `v2=0`, paramètres d'adresse) ;
  - les systèmes de la ville (sur 40 graines par politique et des sondes ciblées) ;
  - le duel et la progression (un banc dont la copie du bot donne la même empreinte que `runV2BotDuel` sur 105 duels sur 105).
- Leurs constats ont été recoupés dans le code avant d'entrer ici : chaque ligne citée a été relue.

**Les scripts hors dépôt** (`ten-days.mjs`, `transitions.mjs`, `nosave.mjs`, `testmap.cjs`, et les bancs des agents) sont recopiés avec leurs sorties dans le dossier de notes partagé de la séance qui coordonne (`audit-final-AU1/`). Ils ne sont pas des outils du dépôt.

**Légende** : « mesuré » = un nombre tiré de parties, d'une preuve ou d'une sonde, graines données ; « code » = lu dans la source (fichier:ligne) ; « hypothèse » = une lecture non prouvée. Les politiques du laboratoire sont des bots (adresse 0,6 au duel), pas des joueurs : ce qu'ils ne font jamais dit ce que les bots sautent, pas ce qu'une personne sauterait.

---

## 1. Le verdict

**Le socle est solide.**
- 619 tests sur 619, la CI verte sur ses douze dernières exécutions, 73 manifestes de production sans erreur, aucun secret dans l'arbre ni dans l'historique.
- Toutes les preuves de navigateur passent (410 vérifications, 47 pages de texte sur 47).
- La simulation ne touche jamais Three.js et rejoue à l'empreinte près dix jours joués dans le navigateur.
- Les places et le duel restent sous le budget GPU ; le quai v2 la nuit en plan B est à égalité en 1080p et juste au-dessus en 1440p (§ 5.4).
- Le jeu par défaut contient ce que l'opérateur a demandé depuis le 9 novembre : le tutoriel, les réglages, les deux langues, la manette, le remappage, le duel recalé, l'argent, les marques, la mini-carte, les sorties et la liste [Q].

**Ce qui sépare ce jeu d'un jeu « prêt » tient en trois points.**
1. **L'opérateur n'a joué aucun des lots livrés depuis le 9 novembre au soir** : le dossier principal était resté sur `df16326` (DB10) jusqu'à ce matin (§ 7).
2. **La campagne ne se gagne pas.**
   - Aucune des 200 parties du laboratoire ne couronne le joueur. Un joueur qui gagne aussi quinze défis par partie ne le fait qu'une fois sur 40.
   - La demi-finale du jour 6 est une falaise (4 % pour le planificateur) après une poule gagnée à 100 % dès le jour 4.
   - À l'inverse, une stratégie que le jeu ne montre pas, apporter l'attaque puissante, gagne presque tout (93 à 98 % en finale). La difficulté réelle dépend donc moins de la préparation que du choix de quatre compétences.
3. **L'écart le plus large aux contrats, la phase d'équipe et le recrutement**, est consigné depuis la Passe V6 et n'a jamais été tranché. Les contrats l'exigent ; seul un amendement A3 de l'opérateur peut le sortir de cette version.

**À côté, des défauts que le joueur rencontrera** : chaque nouvelle partie est la même graine (1842) ; un stockage bloqué fait perdre la partie en silence ; les changements de page coupent au noir au lieu de fondre (la règle 6 bis de l'opérateur) ; plusieurs règles de la ville se contredisent (§ 2.3) ; plusieurs nombres décisifs du duel ne sont dits nulle part.

**Les documents de gouvernance ont dépassé leur usage** : `AGENTS.md` fait 181 Ko (15 Ko le 15/10) et chaque séance doit le lire ; « À reprendre » et « Principes » du journal font 130 Ko, sans règle d'archivage.

| Système | Verdict | En un mot |
|---|---|---|
| La journée et ses créneaux | solide | trois créneaux, navigation gratuite, combat d'après-midi protégé |
| Le tournoi et le calendrier | à reprendre | poule qui ne trie pas, falaise au jour 6, titre hors d'atteinte ; « éliminé » jamais écrit |
| Le duel | à reprendre | rythme et rupture conformes, marteleurs battus ; deux stratégies dominantes ; des nombres cachés |
| La progression de Ren | à reprendre | PV et stats lisibles ; les niveaux de compétences que la courbe suppose ne sont atteints par personne |
| L'économie et les travaux | solide | l'équipement de la courbe atteint à temps par le planificateur ; la revente jamais rentable (voulu) |
| Les boutiques et le marchandage | à reprendre | les paliers de Bram perdus en changeant d'arme ; trois textes périmés |
| Les vols et les marques | à reprendre | trois ruptures de logique (le vol pris facturé, le vol d'un recherché, la bourse vide) |
| Les défis | à reprendre | ≈ 95 % gagnés au jour 1 et +24 PV pour toujours : la meilleure action d'un créneau |
| L'information (rumeurs, observation) | solide, mince | lisible ; ne change aucune décision que la simulation propose (hypothèse) |
| Le sabotage et ses réponses | solide | deux chaînes, signes et réponses ; la garde payée chaque nuit coûte 125 pièces |
| Les rivaux qui se souviennent | solide | aucune rupture trouvée |
| Les scènes et le festival | solide | le défilé lisible ; le « jour après jour » des textes vaut un seul travail |
| Les marques, la mini-carte, les sorties, la liste [Q] | solide | les losanges ne reviennent pas pour une offre renouvelée (soin, vérification, restitution) |
| Le tutoriel et la première heure | solide | 64 / 64 ; une leçon couvre la barre d'actions |
| Les langues, la manette, les réglages, le remappage | solide | 410 vérifications ; le contraste de « pièces » au téléphone, connu |
| Les transitions d'écran | écart | coupe au noir en une image, sauf la sortie à pied |
| La sauvegarde | à reprendre | stockage bloqué → la partie repart dans le jeu d'aujourd'hui |
| Le son | solide | reçu (S5) ; Safari à essayer |
| La structure du code | solide | couches pures propres ; un fichier pur mal rangé soude 19 dossiers en un cycle ; 13 exports morts |
| Les tests et la CI | solide | 619 / 619 en 2 min ; aucun test ne garde la courbe de bout en bout |
| La performance (E24) | à la limite | places et duel sous la nuit B ; le quai v2 la nuit en plan B +0,03 ms (1080p), +0,33 ms (1440p) |
| Les documents | à reprendre | `AGENTS.md` 181 Ko, journal 184 Ko |

---

## 2. Le gameplay joué de bout en bout

### 2.1 Dix jours au laboratoire (TournamentLab, graines 1 à 50, quatre politiques)

Commande : `node tools/tournament-lab.mjs --seeds=1..50 --policy=<p> --json=…`. Chaque partie va jusqu'au soir du jour 10, sans erreur.

| | idle (adresse 0,3, ne prépare rien) | diligent (0,6) | curious (0,6, toute la ville) | planner (0,6, l'argent et l'équipement de la courbe DB7) |
|---|---|---|---|---|
| combats du joueur gagnés | **34,9 %** | 55,2 % | **64,0 %** | 60,4 % |
| victoires par partie (0 / 1 / 2 / 3 / 4 / 5) | 3 / 19 / 22 / 6 / 0 / 0 | 0 / 0 / 17 / 28 / 5 / 0 | 0 / 0 / 7 / 26 / 17 / 0 | 0 / 0 / 11 / 27 / 12 / 0 |
| qualifié pour les demi-finales | **62 %** | 100 % | 96 % | 98 % |
| finaliste | 0 % | 4 % | **24 %** | 4 % |
| **champion** | **0 %** | **0 %** | **0 %** | **0 %** |
| classement final (1er … 8e) | 0 0 0 31 0 1 18 0 | 0 2 3 45 0 0 0 0 | 0 12 8 28 0 2 0 0 | 0 2 14 33 0 1 0 0 |
| blessures du joueur par partie | 1,34 | 1,02 | 0,56 | 0,60 |
| forge brûlée à la fin | 94 % | 0 % | 24 % | 100 % (réparée 50 / 50) |
| sangle coupée subie (parties) | 31 | 1 | 1 | 49 |
| pièces à la fin | 113,7 | 4,7 | 40,7 | 80,3 |
| travaux payés par partie | 0 | 0 | 0 | 11,8 |
| pièces d'équipement achetées avant le jour 6 / le jour 10 | 0 / 0 | 1 / 1,04 | 2,7 / 3,2 | **4 / 7** |
| vols, pris, trouvés à l'aube | — | — | 5,0 / 1,5 / 2,9 | — |
| défis tentés, gagnés | — | — | 8,5 / 5,3 | — |
| tête du défilé des Lanternes | Marek 50 | Marek 50 | joueur 9, Marek 41 | joueur 24, Marek 26 |
| participants oubliés / éliminations comptées | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |

- **Aucune des 200 parties ne couronne le joueur** ; aucune politique ne gagne ses cinq combats.
  - Le curieux atteint la finale une fois sur quatre et la perd douze fois sur douze.
  - Le planificateur achète tout l'équipement que suppose la courbe DB7 (7 pièces au jour 10). Il perd surtout la demi-finale du jour 6 (14 troisièmes places, 33 quatrièmes).
- **Le titre avec les défis** (banc de l'agent de la ville, `challenger`, 40 graines). Le planificateur qui gagne aussi tous les défis qu'il peut (15 par partie) monte à 722 PV au jour 10 contre 391. Il atteint la finale onze fois sur 40 et ne la gagne jamais. Avec Orla recrutée en plus (+1 PA) : **un seul titre sur 40**. C'est le seul titre vu sur plus de 300 parties de bots.
- **La poule ne trie presque pas** : le joueur qui ne prépare rien et se bat à 0,3 d'adresse se qualifie 31 fois sur 50. C'est voulu par DB11-7 (« la poule plus facile ») ; la marche entre la poule et le tableau est donc haute.
- **« Éliminé » n'est jamais écrit dans une partie v2** : les éliminés passent `gate` (`src/tournament/v2calendar.ts:77`). Deux conséquences :
  - le taux d'élimination du laboratoire lit 0 (`src/tournament/lab.ts:341`) ;
  - le pouls `activeCompetitors` reste à 8 du premier au dernier jour (`src/tournament/pulse.ts:19`), et rien ne le lit.
- Les 35 événements des deux catalogues (`v2catalog.ts` 17, `catalog.ts` 18) se déclenchent tous au moins une fois sur les 200 parties : 52 identifiants d'événements, de signes et de conséquences.

### 2.2 Dix jours dans le navigateur

- `play-day` (le jour 1 par l'interface) : **54 / 54**, Node rejoue `75272cc6a835113b` comme le navigateur. `play-flow` gagné et perdu : **24 / 24** chacun.
- **Deux parties entières**, script hors dépôt `ten-days.mjs` :
  - le principe : une nouvelle partie du jeu par défaut dans le mode jouable ; chaque action choisie dans la page par le planificateur du laboratoire (son module servi par Vite) ;
  - à chaque combat, la page de l'arène ouverte depuis la sauvegarde (l'adversaire et l'étape lus dans le HUD), puis l'issue du bot ;
  - à la fin, Node rejoue la même graine.
  - **Graine 1, en français** : 59 actions, la partie finit au soir du jour 10 ; l'arène s'ouvre cinq fois avec « La poule · tour 1 » (Vessa Lark), « tour 2 » (Orla Brask), « tour 3 » (Cassius Dree), « Demi-finale » (Ilse Morrow), « La finale » (Marek Varn) ; finale perdue, Marek champion. **Empreinte du navigateur = Node (`e4061f6213518375`)**, aucune erreur de page ni de console.
  - **Graine 2, en anglais, chaque créneau rechargé par l'interface** (`__ui.run`, le chemin d'un clic de joueur) : 58 actions, **65 pages ouvertes** ; la poule gagnée, la demi-finale perdue contre Vessa, le match pour la troisième place perdu contre Orla, Marek champion. **Empreinte = Node (`86b1758dab4fc891`)**, aucune erreur.
  - Chargement d'une page : médiane **4,4 s**, au plus 6,0 s, 4 min 39 s d'attente sur la partie (serveur DEV). La Passe Q4b mesurait 2,86 s pour la même page le 20/10 ; le paquet de production : § 5.4.
- **Deux défauts trouvés en marge**, vérifiés dans le navigateur (`nosave.mjs`) :
  - **Une nouvelle partie part toujours de la graine 1842.**
    - Code : l'écran titre ouvre `?play=1&new=1&name=…` sans graine (`src/ui/title.ts:134`), et le mode jouable prend alors 1842 (`src/ui/play.ts:53`).
    - Conséquence : tous les joueurs jouent le même tirage ; seules leurs actions, qui consomment le générateur, font diverger la partie.
    - Le contrat projet veut une campagne « courte, dense et rejouable » (§ 4).
  - **Sans sauvegarde lisible, la page repart dans le jeu d'aujourd'hui.**
    - Code : `?play=1` sans sauvegarde ouvre une partie `v2=0` de la graine 1842, en anglais (`play.ts:55` : `newGame` sans `withRules`).
    - Mesuré, avec le stockage bloqué : une nouvelle partie v2 au jour 1, puis « Attendre » et son rechargement ; on se retrouve dans une partie du jeu d'aujourd'hui, jour 1, matin, sans avertissement (seule la carte des nouvelles du début).

### 2.3 Une fiche par système

#### La journée, les créneaux, le calendrier
- **Ce que c'est** : dix jours de trois créneaux.
  - La poule les jours 2, 4 et 5 ; la coupe ; les demi-finales et la Porte au jour 6 ; la troisième place au jour 8 ; la finale au jour 10 ; les jours 3, 7 et 9 libres (`v2calendar.ts:55-66`, `:104-138`).
  - Gratuits : marcher, parler, acheter, marchander, voler, les rumeurs, la chambre forte, la vérification de Hilde, la garde payée, un défi posé (le guide le dit, `en.ts:1277`).
- **Ce qui marche** : l'après-midi du combat refuse toute autre action qui prend le créneau (`advance.ts:56-60`) ; les bourses montent avec le tableau (`pool.ts:106`).
- **Mesuré** (160 parties de l'agent de la ville) : la coupe se joue sur les points de poule.
  - 9 points : 79 sur 79 qualifiés ; 6 points : 29 sur 31 ; 4 points : 3 sur 7 ; 3 points : 0 sur 10.
  - Deux défaites de poule sans point « serré » ne qualifient jamais.
- **Impasse sans blocage** : un joueur qui perd à la Porte au jour 6 n'a plus de combat (13 parties sur 40 du bot idle). Les jours 7 à 10 ne changent plus sa place finale (`v2Ranking`, `v2calendar.ts:153-159`) : rien ne se joue.

#### Le duel (DB1 à DB13, spécification `briefs/combat-system.md` § 18-20)

**La méthode**
- `node tools/duel-balance.mjs --audit --policies=bot,strat,spam,gspam --variant=rpg+rs1+lv1 --seeds=1..20` reproduit DB13 : 71 / 92 / 99 %, le marteleur qui garde à 9 %, 2,1 min.
- Un banc hors dépôt, 30 graines × 7 rivaux par étape, joue le joueur attendu de la courbe DB7 avec des bots d'adresse 0,2 / 0,5 / 0,9 :
  - poule : `rs1 lv1`, 300 PV ;
  - tableau : `rs2 lv3 rhp370` ;
  - finale : `rs3 lv3 rhp440`.

**Ce qui marche**
- La pente du joueur attendu monte : poule 69 / 91 / 99 %, tableau 53 / 81 / 93 %, finale 36 / 64 / 89 %.
- Le marteleur de l'attaque simple perd tout (0 % sur 210 duels à chaque étape). Le marteleur qui garde perd au tableau et en finale (0 %) ; en poule il gagne 9 % (Tobin 37 %, Cassius 20 %).
- Le rythme :
  - le rival rompt environ deux fois par minute, dix secondes chaque fois, soit un tiers du duel étourdi ;
  - Ren gagne avec 38 à 56 % de ses PV ;
  - 5,5 à 6,5 séquences adverses par minute, la moitié lancées par la riposte, 5,3 à 5,8 s libres entre deux.
- Le guide lit ses nombres dans les données du duel (`src/ui/tutorial.ts:251`). La sangle coupée est dite sur la fiche de match. Les PV de Ren et leur origine (`healthParts`) égalent ceux du duel.

**La durée contre la cible de l'opérateur** (A3 de DB5 : « en 2 et 5 min », l'épique au-delà)

| Étape | Médiane (bot 0,2 / 0,5 / 0,9) | p10-p90 | au-delà de 5 min | **sous 2 min** |
|---|---|---|---|---|
| Poule | 2,3 / 2,2 / 1,9 min | 0,9-3,3 | 0 % | **37 / 43 / 57 %** |
| Tableau | 2,5 / 2,3 / 2,3 min | 1,4-3,6 | 0 % | 30 / 32 / 33 % |
| Finale | 4,0 / 3,9 / 3,8 min | 2,4-5,3 | 19 / 9 / 6 % | 3 / 0 / 0 % |

- Tobin dure environ une minute à toutes les adresses.
- Dans les parties entières (bot 0,6) : la poule dure 1,0 à 2,1 min, la demi-finale 1,6 à 2,4, la finale 3,4 à 3,7.
- **Un tiers à plus de la moitié des combats de poule tombent sous les deux minutes de la cible.**

**Stratégie dominante n° 1 : apporter l'attaque puissante**
- Elle appartient au joueur dès le départ et peut être emportée (`src/combat/skillbook.ts:102`, CH-4), mais le kit de départ ne la contient pas (`V2_START_KIT`, `src/combat/v2duel.ts:98`).
- Elle coûte 1 PA, se charge en 1,7 s et recharge en 8,5 s, **moins que l'étourdissement de 10 s d'une rupture**.
- Les rivaux gardent 90 % des coups dans leurs pauses (`v2duel.ts:199`). Gardée, elle ajoute 74 à 165 à une jauge de 70 : sa part ×2 de `V2_POWER`, ×3 de `V2_SKILL_GAUGE`, ×10 / Endurance, ×2 quand elle est gardée (`v2duel.ts:79,87,107`, `dynamic.ts:370`). **Elle rompt chaque rival de poule en un coup.**
- Un plan qui la charge dès qu'elle est prête gagne **99 à 100 % en poule, même à 0,2 d'adresse, et 93 à 98 % en finale** ; les combats de poule tombent à 0,8 min.

**Stratégie dominante n° 2 : des offensives à la place de Rempart et Ferveur**
- Les quatre offensives `t1,t2,t3,t4` : poule 100 %, finale 97 à 99 %. Tourbillon (45 pièces) et Fendoir (40 pièces) rompent même sans garde.
- **Le kit avec lequel chaque partie commence est le plus faible des kits mesurés.**
- Par seconde de recharge, toutes les offensives font la même chose (3,1 à 3,9 dégâts) : la puissance et la recharge suivent toutes deux le temps de charge. Elles se distinguent par le coût en PA, la jauge (27 pour la Fente, 164 pour le Fendoir) et le perçage de garde.

**La défense et une exception aux règles**
- Esquiver chaque coup lourd décide (poule 100 %, finale 90 %). Tenir la garde seule est un piège (finale 46 %, Ren rompu quatre fois par duel).
- Le rival ne choisit sa garde ou son esquive qu'au repos (`dynamic.ts:325`). Une compétence relâchée pendant sa séquence attend et part quand il récupère : elle n'est gardée que 3 à 12 % du temps, au lieu de 62 à 83 %. Ce n'est pas dominant (une frappe nette remplit moins la jauge), mais le joueur ne peut pas le lire.

**Des nombres qui décident et que le joueur ne lit nulle part** (la fiche DB7 posait « Aucun nombre caché », `briefs/stats-combattants.md:128`)
1. La garde du rival à 90 % et ses esquives (Vessa 35 %, Cassius 20 %).
2. Un coup gardé remplit deux fois la jauge du gardien. La leçon dit pourtant « guarded or not » (`en.ts:1372`) et conseille « Mix your skills and your guard » (`en.ts:1376`).
3. Les recharges (5 × le temps de charge) : absentes du guide, de la leçon et de la page des compétences (`src/ui/skills.ts:29-35`) ; visibles seulement sur la bande des paliers, pendant la charge.
4. La page des compétences montre le coup net, alors que 62 à 83 % des compétences hors rupture sont gardées (dégâts ×0,2).
5. La préparation du rival (×1,00 à ×1,25 sur ses coups, `rivalMods`, `src/tournament/pool.ts:37`) n'est pas sur la fiche de match.
6. La Vivacité affichée d'un rival se lit contre son propre kit (`KIT_VIV`) : Marek, Cassius et Ilse montrent 7 et ne pausent pas pareil.
7. Aucun texte ne dit ce que font l'Attaque, la Défense, l'Endurance et la Vivacité (`stat.*`, `en.ts:752-755`).
8. L'attaque puissante, l'outil le plus fort du duel, n'est ni orientée ni bornée.

#### La progression de Ren

| Politique (médianes) | Poule j2 | Poule j4 | Poule j5 | Demi-finale j6 | Finale j10 |
|---|---|---|---|---|---|
| planificateur | 300 PV, Atq 14 / Déf 11 / End 10 / Viv 10 | 324 | 366 | 390, 14 / 13 / 10 / 9,5 | 414, 16,5 / 14 / 12 / 9,5 |
| curieux | 316, 11 / 11 / 12 / 10 | 360 | 401 | 454 | 558, 10 / 13,5 / 12 / 9,5 |
| diligent | 300 | 324 | 348 | 372 | 396 |

- Les PV = 300 + 24 par victoire + l'équipement + les séances « Santé » (DB11-5, DB11-6). Le curieux gagne 5,3 défis sur 8,5 par partie, soit +128 PV de vigueur, et garde l'épée d'entraînement.
- **Les niveaux des compétences restent à 1 chez toutes les politiques** : l'Estocade du planificateur est au niveau 1 dans ses 250 combats.
- Un défaut de l'outil, pas du jeu : le plan du planificateur exerce le Coup éclair puis l'attaque puissante (`src/tournament/lab.ts:126`), qui n'est pas dans son kit, alors que son commentaire dit « drills the Thrust » (`lab.ts:86`).

#### La courbe de difficulté (poule, tableau, finale)

| Politique | Poule j2 / j4 / j5 | Demi-finale | 3e place | Finale | Champion |
|---|---|---|---|---|---|
| planificateur | 68 / 100 / 100 % | **4 %** (contre Vessa : 0 sur 37) | 30 % | 0 sur 2 | 0 % |
| curieux | 76 / 100 / 100 % | 25 % (Vessa 16 %) | 22 % | 0 sur 12 | 0 % |
| diligent | 66 / 100 / 100 % | 4 % | 6 % | 0 sur 2 | 0 % |
| ne fait que combattre | 22 / 48 / 90 % | 0 % | 0 % | — | 0 % |

**Une courbe en dents de scie**
- Le premier combat (Vessa, jour 2) est le plus dur de la poule : l'ordre est fixe (`src/tournament/v2calendar.ts:28-30`).
- Les deux combats suivants sont gagnés à 100 %, puis vient une falaise au jour 6. Vessa est le rival le plus dur à chaque étape.
- Le « six sur dix » global (60 %) est la moyenne de deux paliers, pas une pente.

**Pourquoi les parties s'écartent de la courbe** (chaque facteur isolé, bot 0,6)

| Combat | Niveau 3, sans préparation | Niveau 3, avec la préparation | Niveau 1, sans préparation | Niveau 1, avec la préparation |
|---|---|---|---|---|
| tableau (Vessa, Orla, Ilse, Rhosk, Marek ; préparation ×1,22) | 82 % | 63 % | 42 % | **25 %** |
| finale (Marek, Vessa, Orla ; préparation ×1,25) | 42 % | 23 % | — | 1 % |

1. **Le calibrage de DB10 / DB13 (`tools/duel-balance.mjs`) ne compte pas la préparation des rivaux.** Dans les parties, elle multiplie leurs coups par 1,09 au jour 2, 1,21 en demi-finale et 1,25 en finale.
2. **Aucune politique ne joue le joueur attendu (niveau 3 au tableau).** Rien ne dit au joueur que le tableau suppose ses compétences au niveau 3.
3. Le planificateur se bat 45 fois sur 49 en demi-finale avec la sangle coupée (+15 % de dégâts reçus), qu'il ne fait jamais recoudre.

Un joueur faiblement équipé (l'équipement 1) gagne 45 / 70 / 87 % au tableau et 20 / 34 / 75 % en finale.

#### L'économie, les travaux, les bourses

**Les quatre travaux** (`v2work.ts`)
- Un par lieu à son moment, 10 pièces, +15 de faveur auprès de l'employeur, une fois par jour chacun, refusés à un joueur recherché.
- Le joueur l'apprend par le guide « Gagner des pièces », le conseil « À court de pièces » et l'étiquette « +10 pièces ».
- Le planificateur en prend 11,7 par partie, soit 117 pièces : son plus gros revenu.

**Les pièces d'une partie** (agent de la ville, 40 graines)

| Politique | Entrées | Sorties |
|---|---|---|
| planificateur | ≈ 259 : travaux 117, bourses de poule 55, bourses du tableau 35, bourse des Lanternes 15,8, bookmakers 9,8 | ≈ 212 : équipement 122, paliers de forge 75, réparation 12, tire-laines 3 |
| curieux | ≈ 146 : bourses 98, défis gagnés 18, guilde 9,4, bookmakers 9, festival 5,3, rapport 3,8 | ≈ 164 : passants 54, marchandages 22, amendes 16, mises 14, vérifications de Hilde 13,5, boutique 12, garde 12, rumeurs 10, chambre forte 5 |
| diligent | ≈ 108 : bourses 84, guilde 15, bookmakers 9,3 | ≈ 163 : **la garde 125** (8,3 nuits à 15), vérifications 13,8, armure 22 |
| idle | ≈ 64 : bourses 61, bookmakers 3,5 | tire-laines et tricheurs 9 |

- **L'équipement de la courbe DB7 est atteint à temps** par le planificateur, au jour 6 (40 parties sur 40) comme au jour 10. Aucune autre politique ne l'atteint.
- Un travail vaut la moitié de la bourse d'une victoire de poule (10 contre 20).
- Effet non dit dans le guide : les +15 de faveur d'un travail atteignent d'un coup le seuil de remise de 10 % d'un marchand (`v2gear.ts:98`) et font marcher sa lanterne derrière le joueur au festival (`v2festival.ts:76-85`). Le guide dit seulement « gagne sa faveur ».
- **La revente** (`v2work.ts:76`, la moitié du prix de liste, chez Mara le jour, sans créneau) n'est jamais rentable, comme voulu (ECO-6).
- **Un texte manque** : une victoire dit sa bourse (`en.ts:95`) ; une défaite ne dit jamais la sienne (`en.ts:221`, `:1030-1033`), alors que le guide dit « gagné ou perdu ».
- La politique diligente montre le coût de la prudence : la garde payée chaque nuit attrape le saboteur 40 fois sur 40, mais mange 125 pièces par partie.

#### Les boutiques, l'équipement, le marchandage

**Ce que c'est**
- Quatre boutiques. Le prix = liste × lieu × réputation (−15 % à 60) × faveur (−10 % à 15) × pénurie d'acier (×1,4) × nuit (+20 %) × majoration après un vol (+25 %) (`v2gear.ts:94-101`).
- On porte une arme à paliers, une armure et deux accessoires. Les nombres « après » de la page viennent de l'action réelle sur une copie (`preview.ts`).

**Les paliers de Bram appartiennent à la main, pas à l'arme.** Acheter ou porter une autre arme remet le palier à 0, les pièces et le créneau perdus (`v2gear.ts:121`, `:173`).
- Sonde : un palier sur l'épée d'entraînement, puis la lame achetée : palier 0 ; l'épée reprise : palier 0.
- La trempe du Wyrmsteel, elle, suit le joueur à chaque échange (`v2gear.ts:32-34`). Rien ne dit ni l'un ni l'autre.

**Des textes périmés**
- Le palier dit « +8 % damage » (`en.ts:773`), la trempe « +15 % damage » (`en.ts:103`). Les deux valent +1 en Attaque depuis DB7-2, soit +4,2 % contre la Défense 8 de Vessa et +5,9 % contre la Défense 16 de Marek en finale.
- La pénurie d'acier dit que Mara monte « every blade » (`catalog.ts:85`) ; dans une partie v2, elle monte les armes **et les armures** de toutes les boutiques (`v2gear.ts:97`).
- La faveur de Mara promet « a tenth off … from now on » (`catalog.ts:103`). Dans une partie v2, la remise est un seuil de faveur qui se perd (−8 après un marchandage « ami » perdu, −20 après un vol) pendant que Mara continue de dire « For you, a tenth off » (`dialogue.ts:100`).

**Le marchandage domine l'achat simple**
- Un marchandage perdu ne coûte ni pièce ni créneau, seulement de la faveur (−4, ou −8 pour « ami »), et l'achat reste ouvert au même moment (`v2gear.ts:145-154`, `v2barter.ts:105-106`). Essayer d'abord n'est jamais pire en pièces.
- Le guide le dit (« A bargain lost costs nothing more »).

**Autres points**
- Un passant pris à faire les poches boude le joueur pour toute la partie (`v2town.ts:152`) ; la restitution ne lève pas la bouderie, et sa pièce unique est perdue pour de bon. Le jeu ne le dit pas.
- L'objet `champion-token` (`gear.ts:69`) n'est donné par rien.

#### Les vols, les marques, la restitution

**Ce que c'est** (`v2town.ts`, `v2law.ts`, `v2watch.ts` ; appris par le guide « Voler et le guet », un conseil et une bande de la visite)
- Un vol ne prend pas de créneau.
- Pris sur le fait : une amende, −8 à −15 de réputation, −20 à −25 de faveur, l'étal barré, une marque, l'avertissement du greffier puis un point de poule.
- Non vu : le propriétaire peut le découvrir à l'aube suivante (60 %), ce qui fait une marque.
- Trois marques : le joueur est recherché (fouilles à l'aube, aucun étal ni travail) ; la restitution chez Hale efface tout.

**Mesuré** (300 graines par scénario) : le vol n'est pas une faille.
- Une série de vols le matin du jour 1 rapporte 1,13 pièce et coûte 2,87 prises, −43 pièces, −10 de réputation et −1,87 point de poule.
- Une série de nuit (quatre étals forcés) rapporte 10 pièces, mais la fouille de l'aube reprend tout.

**Trois ruptures de logique**
1. **Un vol pris sur le fait est facturé à la restitution comme si la pièce avait été prise** : il est enregistré avec l'objet visé et sans objet pris (`v2town.ts:124-131`), puis la restitution fait payer au prix de liste ce qui n'est pas rendu (`v2law.ts:129-133`).
   - Sonde : pris en volant une pierre à aiguiser (amende 15), la restitution demande 13 (les 8 de la pierre et les 5 de Hale). Le guide dit « returning or paying for what you took ».
   - Pire : un exemplaire acheté plus tard au prix fort est « rendu » à la restitution, saisi à la fouille de l'aube et refusé à la revente, parce que `holds` compare par identifiant d'objet (`v2law.ts:47-51`, `v2work.ts:78`).
2. **Un joueur recherché peut encore voler** aux étals qui refusent de lui vendre (`v2town.ts:82-89` ne lit pas l'état de recherché), sans marque de plus (le registre s'arrête à trois, `v2law.ts:40`). Une pièce volée le matin d'un combat est portée dans ce combat.
3. **Une bourse vide efface le registre pour un créneau** (`v2law.ts:195-209` : la restitution prend ce que la bourse contient, plus un créneau si elle ne suffit pas). Une bourse pleine paie tout : 86 pièces dans la sonde. L'incitation est inversée.

**Ce que le joueur ne sait pas** : seule la première aube peut découvrir un vol (`v2law.ts:95`). Un vol qui passe sa première aube est sauf pour de bon, sauf fouille d'un recherché.

**Ce qui marche** : Wynn posté à un étal volé y bloque les vols, et l'étiquette le dit (`v2watch.ts:152-169`).

#### Les défis
- **Ce que c'est** (`v2town.ts:33-56`, `:158-265`) :
  - Orla, Vessa, Ilse et six combattants génériques dès le jour 1 ; les rivaux sortis du titre à partir du jour 6 ;
  - une fois par combattant et par moitié de partie ;
  - une mise de 10 pièces (20 rendues si l'on gagne) ou de 5 de réputation ;
  - perdu : la mise, jamais de blessure ;
  - gagné : une compétence apprise ou montée, et **+24 PV pour toujours** (`stats.ts:27`).
- **Mesuré** (jour 1, kit de départ, sans équipement, bot 0,6, 15 graines) : Orla 100 %, Ilse 100 %, Vessa 80 %, Aldric 93 %, Piers 87 %, Kell 100 %, Ambrose 100 %, Corra 100 %, Lucan 93 %.
- **Stratégie dominante** : à environ 95 % de victoires, un défi rapporte autant qu'un travail en pièces, plus 24 PV permanents et une compétence. Neuf combattants dans la première moitié, jusqu'à treize dans la seconde.
  - Le joueur qui les gagne tous (15 par partie) termine à 722 PV au lieu de 391.
  - Même lui ne gagne le titre qu'une fois sur 40 (avec Orla, § 2.1).
- Une représaille gagnée ne compte pas comme une victoire pour la vigueur (`v2town.ts:243`). C'est une lecture défendable, mais le jeu ne la dit pas.

#### Les compétences, l'entraînement, les soins
- **Les compétences** : Corvin en vend trois (35 à 45 pièces) ; le sable exerce une compétence d'un niveau par créneau, jusqu'au niveau 3 ; les défis enseignent et montent jusqu'au niveau 5. Aucun bot n'en achète, et le niveau 3 que suppose la courbe n'est atteint par personne.
- **L'entraînement** : +1 à une stat choisie ou +20 PV au prochain combat, deux séances au plus, gardées entre deux jours libres. Les fermetures du sable refusent la séance et disent pourquoi.
- **Les soins** : à un seul niveau de blessure, Sœur Anwen (un créneau et 8 pièces) est dominée par le repos (un créneau, gratuit), sauf quand ses soins sont offerts.

#### L'information
- **Ce que c'est** : ce que la ville a vu, sur la page du tournoi (gratuit) ; la rumeur de Lio (3 pièces, juste deux fois sur trois) ; celle de l'inconnu (8 pièces, jamais fausse) ; observer un rival (un créneau : ses compétences sur la fiche de match).
- **Ce qui marche** : tout est lisible.
- **Hypothèse** : aucune ne change une règle (la rumeur `V2State.heard` n'est lue que par les pages). L'adversaire est fixé et les quatre compétences ne se choisissent contre rien de ce que dit la rumeur : leur valeur ne se sent que dans le jeu du duel.

#### Le sabotage et ses réponses
- **Ce que c'est** : deux chaînes, chacune avec deux signes et ses réponses (L3, conforme au § 9.3 du contrat projet).
  - La chaîne de la forge vient après la première victoire.
  - La chaîne de l'équipement commence avec la demi-finale.
- **Mesuré** :
  - la forge brûle dans les 40 parties du planificateur, qui ne paie jamais la garde ;
  - la garde nocturne de la politique diligente attrape le saboteur 40 fois sur 40, pour 125 pièces par partie ;
  - le curieux, qui ne paie la garde qu'après un signe, l'attrape environ 25 fois sur 40.
- **Un état lu presque par rien** : `pulse.sabotageRisk` est monté par cinq sources et lu par une seule réplique des passants (`dialogue.ts:151`) ; aucune règle ne le lit.
- Une fois le saboteur pris par la garde, l'action « Report » reste dans la liste du diligent, refusée toute la partie (`roles.ts:197-200`).

#### Les rivaux qui se souviennent, Orla, la ville qui réagit
- Les attitudes (rancune, amitié, respect), le conte de Vessa, Rhosk sur le sable, les saluts selon la célébrité : aucune rupture trouvée.
- **Orla peut être recrutée sur le terrain d'entraînement le soir, quand elle n'y est pas** (`v2story.ts:79-80` ne vérifie pas sa présence), alors que lui parler est refusé à la même heure.
- Aucun bot ne la recrute.

#### Les scènes et le festival
- Le défilé des Lanternes est lisible, dit sur la page du tournoi, dans les mots de chacun et par Wren.
- Le planificateur, qui ne fait aucune bonne action, mène le défilé dans 53 % de ses parties : ses travaux font de quatre marchands des « habitués ». Le curieux, qui en fait deux par partie, le mène dans 18 % (ses marques divisent la foule, ses vols aigrissent les marchands).
- « you bought from me day after day » et « you trained in my yard day after day » (`en.ts:550`, `:544`) valent une faveur de 15, qu'un seul travail atteint.
- Quand le joueur ne peut pas mener, marcher derrière un rival ne coûte rien et rapporte +3 de réputation et un ami (`v2festival.ts:157-161`) ; aucun bot ne le fait (code, non mesuré).

#### Les marques, la liste [Q], les accès
- En moyenne 3,2 à 4,1 choses « à faire » à chaque décision.
- **Les losanges ne reviennent pas pour une offre renouvelée du même genre** (`offerKey`, `v2offers.ts:24-32`) : les soins d'Anwen sur une nouvelle blessure, la vérification de Hilde le jour d'une sangle coupée, une seconde restitution, une seconde représaille. Le nombre de la liste les manque aussi.
- Les accès : chaque lieu est ouvert à chaque moment, sauf la rue du défilé ; les fermetures du sable sont dites. Aucune rupture.

#### Les actions que rien n'appelle et l'état jamais lu
- **Jamais prises par un bot** (40 parties par politique) : talk, nightfall, askPapers, haul, temper, keepWatch, buyInfo, register, spar, listen, taunt, confront, buySkill, pickpocket, cancelChallenge, recruit, payMuscle, confrontVessa, walkBehind, walkOwn, sell.
  - `buy` et `restock` sont cachées dans une partie v2 (le jeu d'aujourd'hui).
  - La cargaison d'acier (askPapers, haul, temper) commence par parler à Tam, ce qu'aucun bot ne fait. Elle marche dans une partie v2 (sonde : +8 pièces, la trempe à 10 pièces).
- **État écrit et jamais lu** :
  - le pouls : `activeCompetitors` n'est lu par rien ; `sabotageRisk`, `commerce` et `publicPressure` par une réplique chacun ;
  - des drapeaux : `plot:forge`, `watched`, `challenge-won`, `sabotaged-day` ;
  - une douzaine de faits, dont les `knownFacts` des rivaux écrits par leur espionnage ;
  - l'objet `champion-token`.

---

## 3. La conformité aux contrats

Légende : **fait** · **partiel** · **écart**. « Consigné » : l'écart est déjà écrit au journal (la passe citée) ; « non consigné » : cet audit le relève pour la première fois. Aucun écart n'est résolu ici.

### 3.1 Contrat projet (v1.2, amendé en CB1, AV1 / V1, CH1)

| § | Exigence | État | Preuve | Consigné ? |
|---|---|---|---|---|
| 0 | 3D low-poly « conçue principalement dans Blender », Blender source d'autorité spatiale, glTF | **écart** | la ville est générée par le code au démarrage | consigné (E14 / E15, Passe D8 : « Amender le contrat : la génération par le code est la voie du projet ») ; **l'amendement n'est toujours pas écrit** |
| 0, 1, 2 | Recrutement progressif puis formats d'équipe ; « construire progressivement une équipe » | **écart** | Orla seule (+1 PA, `v2.recruit.label`) ; `TeamState` typé, jamais formé (`state.ts:43`) | consigné (V6 ; L6-12) |
| 3.1 | Le tournoi influence foule, prix et stocks, dialogues, rivalités, **paris**, **sponsors**, quêtes, sabotages, émotions, sécurité | **partiel** | tout est fait, sauf les paris (l'événement des bookmakers seulement) et les sponsors (**aucune trace** dans `src/`, `briefs/` ni le journal) | paris : consigné (ECO-5) ; **sponsors : non consigné** |
| 3.2 | Trois créneaux, navigation gratuite | **fait** | `advance.ts` | — |
| 3.3 / 3.4 | Ville causale, conséquences plutôt que scripts | **fait** | chaque événement porte sa cause, le pouls se calcule de l'état | — |
| 3.5 | Énergie de festival | **fait** | défilé du jour 9, fanions selon la fête | — |
| 4 | Campagne de 10 journées, « courte, dense et rejouable » | **partiel** | 10 jours ; **chaque nouvelle partie part de la graine 1842** (§ 2.2) | **non consigné** |
| 5.1 | Phases individuelle → transition → équipe | **partiel** | phase I complète, transition partielle, phase III absente | consigné (V6) |
| 5.3 | Vie des concurrents (état persistant ; entraînement, blessures, sabotage, sanction, élimination…) | **partiel** | `CompetitorState` (`state.ts:38`) ; « éliminé » jamais écrit en v2 (§ 2.1) | **non consigné** |
| 6.1 | Combat « tour par tour dynamique » à trois commandes | **fait** | contrat amendé (A3 CB-8, AV-5, CH1) | — |
| 6.1 | « Moteur conçu dès le départ pour supporter plusieurs combattants » | **écart** | `DynFighterId = 'ren' \| 'marek'` (`dynamic.ts:22`) ; la spécification dit pourtant « le moteur reste prêt pour plusieurs combattants, avec des camps en listes » (`combat-system.md` § 10) | **non consigné** (la spécification affirme le contraire du code) |
| 6.3 | La préparation modifie le combat | **fait** | stats, équipement en points, séances, compétences, observation, sangle | — |
| 7 | Progression en couches, sans statistique unique | **fait** | compétences, équipement, attitudes, connaissance, réputation, services | — |
| 8.1 | Jour / nuit change foule, services, PNJ, activités, sécurité, musique, risques | **fait** | `CROWD_TURN`, Pip la nuit, sable fermé la nuit, musique par heure, étals forcés | — |
| 8.2 | Colisée visible de plusieurs quartiers | **fait** | `farArena`, `skyline=arena` (VP8) | — |
| 9.1-9.3 | Types d'événements, escalade, anti-frustration | **fait** | 35 événements, tous déclenchés ; deux chaînes de sabotage avec signes et réponses | — |
| 10.1 | Stack Vite / TS / Three.js / Blender / glTF | **partiel** | ni Blender ni glTF | consigné (E14 / E15) |
| 10.2 | Simulation sans Three.js, `advance` headless | **fait** | aucune des cinq couches pures n'atteint `three` (analyse des imports, § 5.1) | — |
| 10.3 | RNG à graine, tests reproductibles, sauvegardes versionnées, migrations prévues, états nommés | **fait** | `SAVE_VERSION` (`state.ts:7`) ; aucune migration encore (`advance.ts:126`) ; 28 états nommés v2 | — |
| 10.4 | Arborescence conceptuelle | **partiel** | pas de `rendering/` (le rendu est réparti sur 8 dossiers), `tools/` hors de `src/`, 12 dossiers en plus | — |
| 12.2 | Manifeste pour tout asset externe ou généré | **fait** | 73 manifestes, 123 sources, 23 du son, 0 erreur | — |
| 13 | Cinématiques in-engine selon l'état | **fait** | `v2story.ts`, quatre scènes selon l'état | — |
| 14 | Tranche verticale | **fait** | Passes L0-L7 ; budget : Q4 / Q4b, FV4 et § 5.4 | — |
| 15 | Non-objectif V1 : « génération runtime de la ville » | **écart** | la ville est générée à chaque démarrage | consigné (E14 / E15) |
| 16 | Definition of Done | **fait** pour les lots récents | voir les réserves du § 5 | — |

### 3.2 Contrat gameplay (v1.0, amendé en CB1)

| § | Exigence | État | Preuve | Consigné ? |
|---|---|---|---|---|
| 1 | Cinq systèmes indissociables | **partiel** | recrutement réduit à Orla | consigné (V6) |
| 2 | La boucle canonique | **fait** | échéance → information → lieu → événement → combat → résultats → réaction | — |
| 3.1 | Âge I | **fait** | — | — |
| 3.2 | Âge II (convaincre des combattants, synergies) | **partiel** | célébrité, attitudes, ami qui avertit ; ni recrutement ni synergie | consigné (V6) |
| 3.3 | Âge III (roster, lineups, remplaçants) | **écart** | absent | consigné (V6) |
| 4 / 4.2 | Temps comme ressource, sans micro-punition | **fait** | navigation gratuite, étiquette « 1 créneau » | — |
| 4.1 | Activités qui prennent du temps | **partiel** | toutes sauf le recrutement et le « rendez-vous » | recrutement consigné |
| 5 | Six familles de préparation | **partiel** | **investissement** (« débloquer un service, améliorer un atelier, ouvrir un raccourci ») absent : réparer la forge ne fait que revenir à l'état d'avant | relevé « absent » en Passe EV1 ; **aucune décision depuis** |
| 6 | Chaque quartier : identité, fonction, risques, jour / nuit, raison de revenir | **fait** | quai, parvis, lices, place de la Halle | — |
| 7 | Recrutement | **écart** | Orla seule | consigné (V6) |
| 8 | Ville dynamique observable sans écran de debug | **fait** | L5, losanges, liste [Q] | — |
| 9 | Sabotage fair-play | **fait** | L3 | — |
| 10 | Économie sans cul-de-sac à la fermeture d'un service | **fait** | ECO3 ; étals fermés : les passants vendent ; forge brûlée : trois sorties | — |
| 11 | L'échec ouvre une situation ; pas de campagne mathématiquement perdue après une erreur | **partiel** | défaite : points ; hors coupe : la Porte ; blessure : soins. **Le titre n'est jamais gagné au laboratoire** (§ 2.1), et deux défaites de poule sans point serré ne qualifient jamais | **non consigné** |
| 12 | Déterminisme headless | **fait** | dix jours dans le navigateur à l'empreinte de Node (§ 2.2) | — |
| 13 | Tranche verticale gameplay | **fait** | Passe L7 | — |
| 14 | Verrous 1 à 10 | 1, 2, 4 à 9 **faits** ; 3 tenu à vide (ni recrutement ni équipe) ; 10 **écart** | — | 10 consigné (V6) |

### 3.3 Contrat tournoi (v1.0)

| § | Exigence | État | Preuve | Consigné ? |
|---|---|---|---|---|
| 1 | Horloge, spectacle, réputation, rivalités, économie… et « transforme le joueur solitaire en leader d'équipe » | **partiel** | tout sauf le leader d'équipe | consigné (V6) |
| 2 | Tournoi évolutif, phases I → II → III | **partiel** | phase I complète, II partielle, III absente | consigné |
| 3 | Pas de 12 équipes, pas de 3v3 d'entrée | **fait** | — | — |
| 4 | « Le Tournament Agent doit pouvoir simuler plusieurs calendriers pour comparer » | **écart** | un seul calendrier (`v2calendar.ts`) ; aucune option de calendrier au laboratoire | **non consigné** |
| 5 | `CompetitorState` (champs minimum) | **fait** | `state.ts:38`, `teamId?` compris | — |
| 6 | Simulation hors écran au même modèle que les combats vus | **fait** | course prouvée contre des duels complets ; « recrutés » absent | — |
| 7 | Rivalités fondées sur des faits | **partiel** | attitudes et causes, répliques, gestes, Vessa, Rhosk ; aucun effet sur le comportement en combat ni le recrutement | — |
| 8 | Élimination ≠ suppression narrative | **fait** | éliminés défiables, au festival, dans les scènes | — |
| 9 | `TournamentWorldPulse` consommé par la ville | **partiel** | tous les champs calculés ; **`activeCompetitors` faux en v2 (toujours 8) et lu par rien** ; `sabotageRisk`, `commerce`, `publicPressure` lus par une réplique chacun | **non consigné** (la valeur fausse) ; « lu par rien » relevé en EV1 |
| 10 | Un grand événement public original | **fait** | « La Lanterne de Tête » | — |
| 11 | Lisibilité du bracket | **fait** | page T, ligne d'état, guide | — |
| 12 | Déterminisme | **fait** | — | — |
| 13 | TournamentLab : états, journées, concurrents, résultats, graines, oubliés, éliminations et blessures, transition d'équipe | **partiel** | le taux d'élimination lit 0 en v2 ; la transition d'équipe imprime « outside the slice » | **non consigné** (le taux) ; transition consignée |
| 14 | Critères de validation | **partiel** | aucun passage en équipe | consigné |
| 15 | Verrous 1 à 10 | 1, 3 à 8 **faits** ; 2 « progression vers le collectif » **écart** ; 9 sans objet ; 10 tenu (aucun verrou changé sans A3) | — | 2 consigné |

### 3.4 Le budget de performance (E24) et les règles transverses de l'opérateur

- **E24, « Pas plus cher que la nuit B, à définition égale »** : § 5.4.
- **La règle 6 bis de l'opérateur (2026-11-03), les transitions d'écran** : « no hard cut between screens … fade to black, change the screen only under the black … then lift the black on a frame that is ready ».
  - **Partiel** : la levée du noir est un fondu, mais l'entrée dans le noir coupe en une image (§ 4.4).
  - **Non consigné** : aucune passe n'a prouvé cette règle dans ce projet.
- **Le mouvement réduit, réglage du jeu, jamais lu sur le système** : **fait** (RG-5 ; `settings-proof` le prouve dans les deux sens).

---

## 4. L'expérience du joueur

### 4.1 Les preuves existantes, rejouées sur `main` (serveur DEV de l'audit, :5411)

| Outil | Ce qu'il joue | Résultat |
|---|---|---|
| `default-proof` | l'adresse nue comme une personne l'ouvre (navigateur non piloté, vraie règle de lecture automatique, manette simulée) | **40 / 40**, 51 s |
| `tutorial-proof` | la visite, le guide, les conseils, le premier duel et ses leçons, le jeu d'aujourd'hui sans tutoriel | **64 / 64**, 134 s |
| `play-day` | le jour 1 par l'interface ; Node à la même empreinte | **54 / 54** |
| `play-flow` gagné / perdu | jusqu'au combat, la fiche de match, l'arène, le retour en ville ; Node à la même empreinte | **24 / 24** et **24 / 24** |
| `pad-proof` | une manette Xbox puis DualSense simulée : la ville, les pages, le duel, la vibration, les symboles | **61 / 61** |
| `settings-proof` | les réglages depuis le titre, le menu, V et la pause du duel ; la qualité ; AZERTY ; le mouvement réduit ; la langue | **65 / 65** |
| `remap-proof` | les touches tapées comme un vrai clavier (QWERTY, AZERTY), l'échange, les touches réservées, les noms français | **46 / 46** |
| `exits-proof` | chaque sortie du quai et des trois places, dans les deux sens | **32 / 32** |
| `ui-text` | 18 pages en français et en anglais, 1920 × 1080, 812 × 375 et 375 × 812 (titre, quai, trois places, liste, Mara, compétences, équipement, réglages, guide, duel) | **47 / 47** : aucun texte sous 16 px (14 au téléphone), deux polices, aucun caractère hors du sous-ensemble, rien de coupé |
| `ui-contrast` | 12 pages, deux tailles, deux instants | **16 / 24** (détail en 4.3) |

Aucune erreur de page dans aucun de ces outils.

### 4.2 La première heure
- **L'écran titre** : « Cité du Tournoi », « The pool of eight », quatre entrées sur la ville de midi (Nouvelle partie, Explorer le quartier, Réglages, Français · English) ; « titre » à la première touche (VD-5).
- **La visite** : six bandes au pied de l'écran, chacune éclaire l'élément dont elle parle ; à la manette, « [A] Suivant / [B] Passer la visite ».
- **Le guide** : treize chapitres et douze conseils, chacun une fois. `AGENTS.md` dit encore « twelve chapters » : le chapitre « Gagner des pièces » est venu avec ECO3.
- **Le premier duel** : figé à la première fois de chaque chose, sept leçons. Sur la capture `tutorial/6-duel-lesson`, **la bande de la leçon couvre la barre d'actions du duel** : ses libellés (« Esquive », « Attaque ») se devinent en transparence sous le texte.

### 4.3 La lisibilité, les deux langues, le téléphone
- **Texte** : 47 / 47 (ci-dessus).
- **Contraste** (`ui-contrast`, deux instants, 4,5:1 au moins), 16 sur 24 :
  - **« coins » / « pièces » de la ligne d'état au téléphone couché** : 4,26 à 4,30:1 sur le quai, dans la liste et chez Mara (4,55 à 4,70:1 au parvis et aux lices). Connu depuis la Passe TU3, le `main` figé compris.
  - **Les chiffres de dégâts flottants du duel** (« -10 », `.hit`) : **1,41 à 1,69:1**, en français comme en anglais, à 1920 × 1080 et à 812 × 375. Les captures de l'arène de la Passe UM8 (5,75:1) prenaient des instants sans chiffre ; **non consigné**.
  - Le reste : la ligne d'échéance 5,15 à 6,06:1, l'étiquette « +10 pièces » 8,67:1, le guide 7,72:1, l'équipement 8,19:1, le titre 7,97:1.

### 4.4 Les transitions d'écran et le mouvement réduit
**La méthode** (script hors dépôt `transitions.mjs`) : un film de la page (screencast du protocole DevTools, chaque image) pendant quatre changements d'écran, la luminance moyenne de chaque image, avec le mouvement réduit du système absent puis émulé (« reduce »).

| Changement | Avant | L'image suivante | Ensuite |
|---|---|---|---|
| créneau (« Attendre » depuis la liste) | scène 0,35-0,40 | **0,031** (le noir de la navigation), puis l'écran de chargement 0,066 | fondu vers la nouvelle scène, 0,07 → 0,15 sur une vingtaine d'images |
| lieu par la carte | 0,35-0,40 | **0,031** | fondu |
| titre → nouvelle partie | 0,32 | **0,031** | fondu |
| entrée dans l'arène (fiche de match) | la fiche, voilée, 0,14 ; sous « reduce », la scène réapparaît une image (0,34) puis **0,031** | | fondu |

**Lecture**
- **L'entrée dans le noir est une coupe en une image** ; la levée du noir est un fondu ; aucune coupe d'une scène à une autre.
- `go()` (`src/ui/play.ts:29-35`) navigue sans fondu. Seule la sortie à pied (`src/ui/exits.ts`, `.pm-fade`, 0,35 s vers l'encre) fond avant de partir.
- Le mouvement réduit du système ne change rien, comme le veut RG-5.

### 4.5 Le son, la manette, les réglages, le remappage
- **Le son** est reçu (S5, Passe SN22). Restent l'essai Safari sur un appareil Apple (SC-SAFARI) et la jointure AAC, non jugée.
- **La manette** : 61 / 61. Reste l'essai de l'opérateur avec sa manette (MN-11 : le son à la première pression, la vibration, la zone morte).
- **Les réglages** : 65 / 65 ; **le remappage** : 46 / 46. Restent les essais de l'opérateur (RG3, RM-10).

---

## 5. La structure du projet

### 5.1 L'architecture de `src/`
(Agent de structure : analyse des imports par l'analyseur TypeScript du dépôt, scripts hors dépôt.)

**L'inventaire**
- 197 fichiers TypeScript, 39 207 lignes, 2,83 Mo, en 21 dossiers.
- Les plus gros : `world` (3 288 lignes), `narrative` (3 895, dont les tables de texte), `simulation` (3 368), `arena` (5 200).
- Le plus gros fichier : `src/world/Plazas.ts`, 2 261 lignes et 211 Ko (7,5 % des octets de `src`).
- Une entrée (`src/main.ts`), un worker (`painter.worker.ts`), la page du Character Lab.

**Les couches pures n'atteignent jamais Three.js** : `simulation`, `tournament`, `combat`, `events` et `narrative`, 57 fichiers.
- Ni `three` (en import statique ou dynamique), ni DOM, ni `Math.random`, ni horloge.
- Leurs seuls imports extérieurs : `core/rng.ts` et `arena/CombatSim.ts`, un fichier pur rangé dans `arena/`.
- **Le § 10.2 du contrat projet tient dans le code.**

**Les cycles**
- Ce seul fichier mal rangé soude 19 des 21 dossiers en un cycle. Compté dans `combat`, on retrouve trois grappes : le domaine pur, le rendu de la ville, les pages.
- Le domaine pur forme lui-même un nœud cyclique : 12 fichiers par les imports statiques, 34 avec les types.
- Côté rendu : app ↔ district, app ↔ settings, app ↔ debug, arena ↔ ui, atmosphere ↔ materials.

**Le code mort**
- Aucun fichier orphelin : 188 fichiers atteints en production, 192 avec les imports DEV.
- `tournament/lab.ts` et `combat/bot.ts` ne servent qu'aux tests et aux outils.
- Sur 1 573 exports, 13 ne servent nulle part : `hasSave` et `clearSave` (`ui/save.ts`), `useTable`, `currentTone`, `plazaCamPose`, `statText`, `v2PresetNames`, `DIRS34`, et cinq types dont `TeamState`.
- `?sprites` et `?sheetScale` (`main.ts:92-109`) sont une vue de débogage du premier commit, dans le chemin de production, documentée nulle part.

**Le jeu d'aujourd'hui (`v2=0`)**
- 7 fichiers, 704 lignes, ne servent qu'à lui : `playForecourt`, `playLanterns`, `PlaceApp`, `LanternRow`, `Presets`, `narrative/texts`, `CombatSim`.
- `CombatSim` ne peut pas partir seul : les profils des rivaux v2 sont bâtis sur ses données (`combat/profiles.ts:146`).
- Ses branches dans les fichiers partagés font 101 lignes dans 28 fichiers. En tout, environ 1,0 à 1,4 k lignes (2,5 à 3,5 % de `src`) ; 23 fichiers de test et plusieurs outils le jouent.

**Les paramètres d'adresse** : 113 noms lus, tous ceux d'`AGENTS.md` encore lus.
- Une vingtaine comparent à des décisions déjà prises et relèvent de VD-8 : `camblend`, `camfollow`, `views`, `facing`, `npcfacing`, `spriteedge`, `fx=off`, `input=keys`, `cast=generated`, `dyn`, `crowd`, `occstyle`, `occtest`, `occbehind`, `plazaframe`, `plazafog`, `plazadof`, `plazasun`, `fighteredge`, `fightershade`, les valeurs `*=candidate`, `fighterskin`, `padglyph`, `sprites`, `sheetScale`.
- La comparaison avec le jeu d'aujourd'hui passe par `v2=0` et `combat=dynamic`.

**Le reste**
- Aucun TODO, aucun `console.log`, aucun `@ts-ignore`.
- 70 `any`, dont 54 sont les crochets `(window as any).__…` que les outils pilotent, livrés aussi en production.

### 5.2 Les tests et la CI
- **619 / 619** en **122,5 s** de suite (2 min 04 s de bout en bout) : 82 fichiers, 609 appels `test()`. `AGENTS.md` dit encore « ~2 s ».
- **La couverture directe** (modules chargés par nom dans un test) :
  - `combat` 9 / 9, `narrative` 10 / 10 ;
  - `simulation` 22 / 29 (les autres passent par `index.ts`) ;
  - `ui` 13 / 31 : les pages (`playTown`, `playPlaza`, `playArena`, `title`, `settings`, `minimap`, `npcMarks`, `exits`, `todo`, `zoneCard`…) ne sont prouvées que par les outils de navigateur, que la CI ne lance pas.
- **Ce qui manque** :
  - aucun test ne garde la campagne de bout en bout (« le joueur préparé peut gagner le titre ») ni la règle 6 bis ;
  - le taux d'élimination du laboratoire n'est gardé par rien ;
  - `play-day` et le guide de `default-proof` restent relevés instables sous charge (Passes VD1, RG3 ; ils ont passé ici).
- **La CI** (`.github/workflows/ci.yml` : Node 22, `ubuntu-24.04` épinglé, typecheck, build, `art:validate`, `npm test`) : ses douze dernières exécutions sont **vertes**, en 131 à 229 s, sous un délai de 15 min.

### 5.3 Le paquet
- 30,6 Mio d'assets :
  - 11,8 Mio d'Opus et 10,6 Mio d'AAC (un seul format chargé par joueur, à la demande : SA-17 « 12 Mo au plus » tenu) ;
  - 5,9 Mio de PNG ;
  - 2,36 Mio de JavaScript en 296 morceaux (**713 Kio gzip**) ;
  - deux polices (44 Kio).
- Le plus gros morceau, `Sky`, fait 421 Kio (110 gzip) ; l'entrée, 19 Kio ; la table française, 139 Kio, chargée à la demande.

### 5.4 Le démarrage et le GPU (budget E24)

**La méthode GPU** (`tools/perf.mjs`) : le serveur DEV de l'audit, la 780M (ANGLE D3D11), le panneau du navigateur de la séance fermé, le témoin de contention allumé. Huit variantes entrelacées dans une même session : 4 tours en 1920 × 1080, 3 en 2560 × 1440. « Écart » = la médiane des écarts **tour par tour** à la nuit B (la méthode de la Passe FV4).
- En 1080p, un Chrome étranger tenait 16 à 24 % de l'adaptateur dans certains tours (ceux-là sont marqués) ; les tours de 1440p sont tous propres.

| Page (ms de GPU par image) | 1920 × 1080 | écart à B | 2560 × 1440 | écart à B |
|---|---|---|---|---|
| nuit B (`seed=1842&clean=1&camera=B`) | 9,93 (4/4 propres) | — | 15,53 (3/3) | — |
| quai v2, plan B, nuit (`&skyline=arena&heraldry=tournament&herolook=1`) | 10,02 | **+0,03** (−0,40 à +2,02) | 15,86 | **+0,33** (−1,02 à +0,44) |
| quai d'une partie v2, matin (`v2-day1-morning`) | 9,54 | −0,69 | 14,06 | −1,79 |
| parvis, nuit | 8,64 | −1,37 | 13,54 | −1,99 |
| lices, nuit | 9,00 | −0,78 | 14,51 | −1,02 |
| place de la Halle, nuit | 9,27 | −0,43 | 14,52 | −1,09 |
| duel d'une partie, après-midi du jour 2 (les gradins) | 8,15 | −1,70 | 12,93 | −2,60 |
| duel v2, nuit (`scene=arena`) | 9,40 | −0,33 | 15,09 | −0,74 |

- **Les places et le duel sont sous la nuit B**, à chaque définition.
- **Le quai v2 en plan B la nuit est à égalité en 1080p (+0,03 ms) et juste au-dessus en 1440p (+0,33 ms, +2 %)**. À la Passe FV4, c'était +0,13 / +0,14 ms, et l'opérateur avait choisi « Accepter l'égalité » (FV5). Rien de ce qui a changé depuis n'est mesuré à part : la différence tient dans la dispersion des tours (un tour négatif sur trois en 1440p).
- Ce que le navigateur compose (les voiles, la mini-carte, les losanges, l'aperçu de la liste) n'est pas vu par ces minuteries (Passe UM2) et n'est pas mesuré ici.

**Le démarrage** (`tools/startup.mjs`, 1080p, 4 chargements, médiane [min-max])

| Page | Serveur | Prête |
|---|---|---|
| le quartier, nuit (l'adresse des outils) | production (`vite preview`) | **1,43 s** [1,30-2,28] |
| **une nouvelle partie** (le quai d'une partie v2) | production | **3,67 s** [3,48-3,89] |
| le quai d'une partie v2 (état nommé) | DEV | 5,63 s [4,05-5,85] |
| le parvis (état nommé) | DEV | 4,63 s [3,94-4,73] (un GPU étranger à chaque chargement) |

- Le quartier lui-même coûte environ 1,3 s (peinture 0,4, génération 0,34, régénération 0,36, départ 0,16) ; **le mode jouable ajoute environ 2,2 s** en production (son code, les distributions cuites, l'interface).
- **Chaque créneau et chaque lieu rechargent une page** : 65 rechargements dans une partie (§ 2.2), soit 3 à 4 min d'écran de chargement par partie en production. La Passe Q4b mesurait la page du premier matin à 2,86 s sur un serveur DEV le 20/10 ; elle en prend 4,05 à 5,85 aujourd'hui sur le même genre de serveur.
- `tools/startup.mjs` ne sait pas mesurer la page de l'arène : elle s'arrête sur `window.__app.renderer`, qui n'existe pas dans l'arène. C'est un défaut de l'outil.

### 5.5 Les documents
- **`AGENTS.md` : 180 877 octets, 813 lignes, 28 648 mots**, soit environ 45 000 jetons lus par chaque séance.
  - Sa croissance : 15 Ko le 15/10, 55 Ko le 20/10, 84 Ko le 01/11, 111 Ko le 04/11, 178 Ko le 11/11.
  - **« Commands » fait 53,9 Ko** (70 puces ; la plus longue, la liste des fichiers de test, 4,6 Ko) ; **« Useful URL params » 34,9 Ko** (un paragraphe de 10,4 Ko) ; puis « Art direction » 18,7 Ko, « Sound » 12,3 Ko, « Settings » 12,2 Ko.
  - Ce sont des catalogues (outils, paramètres, historique des décisions) plus que des règles. Plusieurs chiffres ont vieilli : « ~2 s » pour les tests, « twelve chapters ».
- **`JOURNAL.md` : 184 393 octets.**
  - L'en-tête et l'index font 11 Ko, les passes gardées 43 Ko (sous les 60 Ko de la règle).
  - **« À reprendre » fait 69 Ko et « Principes à garder » 61 Ko.** La règle d'archivage ne couvre que les passes : ces deux sections grandissent sans borne et gardent des lignes closes.
  - `journal/` : 89 archives, 2,4 Mo.
- `briefs/` : 73 fichiers, 2,1 Mo.
- **Le dépôt** : 474 commits, 2 149 fichiers suivis, un paquet git de 742 Mio. `screenshots/` suit 190 fichiers, **193 Mo**.

### 5.6 Manifestes, secrets, branches, worktrees
- `npm run art:validate` : **73 manifestes, 123 sources archivées, 23 manifestes du son, 0 erreur**.
- **Les secrets** : aucun motif de clé (`sk-…`, `OPENAI_API_KEY=…`, `ghp_…`, clé privée) dans l'arbre ni dans l'historique (`git log --all -G` sur les 474 commits) ; aucun `.env` jamais ajouté.
- **Les chemins machine** : un seul dans l'arbre, `JOURNAL.md:296` (Passe AL1, `C:\Users\…\HD-2D`). Dans l'historique, la Passe D4 (corrigée en D5) et AL1. Le dépôt est public.
- **Les branches** : 9 branches locales `claude/*` en plus de `main` et de celle de l'audit, **toutes fusionnées** (aucun commit d'avance) ; une seule branche distante, `origin/main`.
- **Les worktrees** : **15 sous `.claude/worktrees/`** en plus de celui de l'audit, tous sur des commits de `main`.
  - Deux ont un fichier modifié : `compassionate-haibt-8c3e5e` (`src/audio/catalogue.json`) et `rivaux-peaux` (un fichier `nul`, artefact Windows).
  - Quatre ont un `node_modules` réel au lieu d'une jonction.
- **Les serveurs** : `.claude/launch.json` (non suivi) compte 61 configurations, dont des dizaines vers des copies figées d'anciennes séances.

---

## 6. Ce qu'il reste pour un projet « prêt »

**L'effort** est estimé en séances d'agent (une séance ≈ une passe du journal : construire, tester, prouver, fusionner), plus le temps de l'opérateur quand une fiche ou un essai est en jeu.

**Les niveaux** : « bloquant » = un « prêt » ne se déclare pas sans lui ; « important » = un défaut que le joueur rencontrera ; « finition » = un reste qui se règle en passant.

### Bloquant
| # | Quoi | Pourquoi | Effort | Carte |
|---|---|---|---|---|
| B1 | **L'essai de réception de l'opérateur sur le `main` d'aujourd'hui** | depuis le 09/11, ses essais tournaient sur `df16326` (DB10) ; aucun lot d'ECO2 à AL1 n'a été joué par lui (§ 7) | une page d'essai guidée (½ séance), puis 2 à 3 h de jeu de l'opérateur | AU-01 |
| B2 | **Le titre hors d'atteinte et la falaise du jour 6 ; à l'inverse, deux stratégies dominantes** | 0 titre sur 200 parties ; le calibrage omet la préparation des rivaux et suppose le niveau 3 ; l'attaque puissante apportée et les défis (+24 PV pour toujours) changent tout | une séance de mesure sur des parties entières et une fiche (comme DB11), puis une séance de recalage | AU-03 |
| B3 | **La phase d'équipe et le recrutement** (contrats projet § 1, 2, 5.1-5.2 ; gameplay § 1, 3.2-3.3, 7, verrou 10 ; tournoi § 2, verrou 2) | l'écart le plus large ; consigné depuis V6, jamais tranché | soit un amendement A3 (½ séance, les mots de l'opérateur), soit un chantier de plusieurs semaines (fiche, moteur à plusieurs combattants, roster, formats) | AU-05 |

### Important
| # | Quoi | Preuve | Effort | Carte |
|---|---|---|---|---|
| I1 | Chaque nouvelle partie part de la graine 1842 | `title.ts:134`, `play.ts:53` ; vérifié | ¼ séance | AU-06 |
| I2 | Stockage bloqué : la partie repart dans le jeu d'aujourd'hui, en anglais, au jour 1, sans le dire | `play.ts:55` ; vérifié dans le navigateur | ½ séance | AU-06 |
| I3 | Les changements de page coupent au noir en une image (règle 6 bis) | § 4.4 | ½ séance (le fondu de `exits.ts` partagé par `go()`) | AU-07 |
| I4 | Les nombres cachés du duel (garde 90 %, coup gardé ×2, recharges, préparation du rival, ce que fait chaque stat) | § 2.3 | ½ à 1 séance de textes en deux langues | AU-04 |
| I5 | Trois ruptures de logique des vols (le vol pris facturé et ses copies saisies, le vol d'un recherché, la bourse vide) | § 2.3 | ½ séance | AU-08 |
| I6 | Les paliers de Bram perdus en changeant d'arme, sans le dire ; des textes périmés (+8 %, +15 %, « every blade », « from now on », « day after day », la bourse d'une défaite) | § 2.3 | ½ séance | AU-08 |
| I7 | Les losanges qui ne reviennent pas pour une offre renouvelée ; Orla recrutée en son absence | § 2.3 | ¼ séance | AU-08 |
| I8 | Le pouls `activeCompetitors` constant (8) et le taux d'élimination à 0 en v2 | § 2.1 | ¼ séance (l'empreinte des parties change : à dire) | AU-08 |
| I9 | `AGENTS.md` à 181 Ko ; « À reprendre » et « Principes » du journal à 130 Ko | § 5.5 | 1 séance | AU-09 |
| I10 | Neuf branches fusionnées, quinze worktrees, 61 configurations de serveur | § 5.6 | ¼ séance, avec l'accord de l'opérateur | AU-10 |
| I11 | Une vingtaine de paramètres d'essai (VD-8), `?sprites` en production ; le jeu d'aujourd'hui (`v2=0`) | § 5.1 | ½ séance pour les paramètres ; `v2=0` après le Gold Master | AU-11 |
| I12 | L'amendement E14 / E15 jamais écrit | Passe D8 | ½ séance, avec les mots de l'opérateur | AU-12 |
| I13 | Les sponsors, l'investissement, les calendriers comparés (contrats projet § 3.1, gameplay § 5, tournoi § 4) | § 3 | à trancher | AU-13 |
| I14 | 3,7 s d'écran de chargement à chaque créneau et à chaque lieu en production (65 rechargements par partie) ; le quai v2 la nuit juste au-dessus du budget en 1440p | § 5.4 | une séance de mesure (où vont les 2,2 s du mode jouable) avant toute décision | à la fiche de recalage ou à une tâche à part, après l'essai |

### Finition
| # | Quoi | Preuve | Effort |
|---|---|---|---|
| F1 | « coins » / « pièces » au téléphone couché, 4,26 à 4,30:1 (connu depuis TU3) | `ui-contrast` | ¼ séance |
| F2 | Les chiffres de dégâts flottants du duel à 1,4-1,7:1 | `ui-contrast` | ¼ séance |
| F3 | La bande d'une leçon du premier duel couvre la barre d'actions | capture | ¼ séance |
| F4 | Les phrases à montant nul ; la cause « the pool's bouts » sur des événements du tableau | Passe TF1 | ¼ séance (la seconde change des empreintes) |
| F5 | Les outils : le planificateur exerce une compétence hors de son kit ; `duel-balance` sans la préparation des rivaux ; `startup.mjs` ne mesure pas l'arène ; `play-day` et `default-proof` fragiles | § 2.3, § 5.4, journal | ½ séance |
| F6 | 13 exports morts ; `CombatSim` pur dans `arena/` ; `core/` mêlé ; « Report » refusé toute la partie ; l'état jamais lu (§ 2.3) | § 5.1 | ½ séance |
| F7 | Le chemin machine de `JOURNAL.md:296` ; `screenshots/` suivi à 193 Mo | § 5.5-5.6 | ¼ séance, sans réécrire l'histoire |
| F8 | Les restes d'art : Piers (GS-RET), PR3-RESTES, RC2-2, N7, les icônes d'objets, la manette entre deux directions (MD1), les trois-quarts des PNJ (RH4), le sol libre des places (VP7-VP9) | « À reprendre » | chacun sa séance, à la demande |
| F9 | Le recul de la caméra C → B au bord de l'eau (RK3, options de la Passe K8), ouvert depuis le 19/10 | Passe K8 | ½ séance si l'option 1 |
| F10 | Les fenêtres basses (568 × 320) : la barre d'actions du duel et le pied de la fiche de match dépassent | Passes AF1, DB13 | ¼ séance |

---

## 7. Les essais en jeu de l'opérateur encore ouverts

**Le fait qui pèse sur tous** : le dossier principal du dépôt, celui de `npm run dev` et de http://127.0.0.1:5173/, est resté sur `claude/duel-calibration` à `df16326` (Passe DB10) du 2026-11-09 à 18 h 23 jusqu'à ce matin ; la séance qui coordonne l'a remis sur `main` avant cet audit.

Si l'opérateur jouait depuis ce dossier, **ses essais du 10 et du 11 novembre ont tourné sans** :
- ECO2-ECO3 (l'argent) ;
- DB11-DB13 (le duel recalé) ;
- TF1 (les textes français repris) ;
- MD1 (la marche en diagonale) ;
- MK1-MK6 (les marques, la mini-carte, les sorties) ;
- LA1-LA3 (la liste [Q]) ;
- AL1.

Ses retours de ces deux jours (« Bon il y a du mieux » sur le duel, le français, les lices introuvables) portent donc sur la version de DB10.

| Essai | Lot | Ce qu'il faut juger | Source |
|---|---|---|---|
| Le duel recalé | DB13 | la jauge, le rythme de la poule, la riposte, les PV de Ren, la séance « Santé », la finale de 3,9 min | Passe DB13 |
| L'argent | ECO3 | les travaux à 10 pièces, les bourses, la revente, « +10 pièces », le conseil | Passe ECO3 |
| Le français | RG4, TF1 | les 75 entrées reprises ; « héros » contre « hérauts » (introuvable : où l'a-t-il vu ?) | Passe TF1 |
| Le remappage | RM3 | une ligne par action, deux touches, l'échange, AZERTY | RM-10 |
| La manette | MN2 | le son à la première pression, la vibration, la zone morte | MN-11 |
| Safari | SN10-SN22 | les boucles AAC sur un appareil Apple | SC-SAFARI |
| Les marques et la mini-carte | MK3 | le losange, la mini-carte | Passe MK3 |
| Les sorties | MK6, AL1 | le chevron, le carton d'arrivée, la sortie fermée, les noms à 13 m ; puis, s'il le faut, la fiche d'éléments nouveaux | Passes MK6, AL1 |
| La liste [Q] | LA3 | le nombre, l'aperçu, les 8 s, le téléphone | Passe LA3 |
| Le tutoriel | TU3, TU4 | la visite, le guide, les conseils, les leçons du premier duel | Passes TU3, TU4 |
| Les réglages | RG3 | la qualité, le mouvement réduit, les volumes | Passe RG3 |
| La marche en diagonale | MD1 | le héros de profil au-delà de 67,5° | Passe MD1 |
| La charge sans palier puissant | CH1 | le ressenti des temps de charge à 0,85 | CH-5 |
| Les effets du duel | FX2-FX5 | dans une partie | Passe FX5 |
| Les gradins | PU1 | les 88 places, les sauts sur la foule sonore | Passe PU2 |
| L'arène de jour | AD1 | le duel et le parvis au jour du créneau | Passe AD1 |
| Les places | VP7-VP9, FT1 | la revue en jeu, les fanions selon la fête | Passes VP9, FT2 |
| La ville qui vit | L2-L6 | les vols et les marques, l'information, les rivalités, la ville qui réagit, le récit, le festival | L2-14, L3-12, L4-14, L5-14, FT-6 |
| Ren | PR3, PR4 | peau hâlée, cheveux acier, cape ivoire | Passe PR4 |
| Les fenêtres basses | AF1 | la bande au sol et les anneaux à 568 × 320 | Passe AF1 |

---

## 8. Les décisions qui attendent l'opérateur

**Elles sont regroupées sur la fiche d'arbitrages AU1** : https://claude.ai/artifact/BMLcgX5TJ4tSkNMEVLW1Sh (`briefs/fiche-au1.html`). La page de synthèse : https://claude.ai/artifact/ByP98Bt9vbnmst86XZpAYc (`briefs/synthese-au1.html`). Chaque carte a une option recommandée et sa raison ; aucune n'est appliquée avant ses choix.

| Carte | La décision |
|---|---|
| AU-01 | La réception : un essai guidé sur le `main` d'aujourd'hui |
| AU-02 | Le statut du jeu (Gold Master : RJ3, L7-6b, la décision de l'opérateur) |
| AU-03 | La difficulté : le titre, la falaise du jour 6, l'attaque puissante, les défis |
| AU-04 | Les nombres cachés du duel |
| AU-05 | La phase d'équipe et le recrutement (verrous : A3) |
| AU-06 | La graine d'une nouvelle partie et la sauvegarde perdue |
| AU-07 | Les transitions d'écran (règle 6 bis) |
| AU-08 | Les ruptures de logique de la ville et les textes périmés |
| AU-09 | `AGENTS.md` et le journal |
| AU-10 | Le ménage des branches, des worktrees et des serveurs |
| AU-11 | Les paramètres d'essai et le jeu d'aujourd'hui (`v2=0`) |
| AU-12 | L'amendement E14 / E15 (la génération par le code) |
| AU-13 | Les sponsors, l'investissement, les calendriers comparés |
| AU-14 | Le genre du joueur (Passes RG4, TF1) |
| AU-15 | « Chevalière du Temple » et « un dixième » contre « 10 % » |
| AU-16 | Le recul de la caméra C → B (RK3, Passe K8) |
| AU-17 | Les restes d'art |

---

## 9. Les décisions de l'opérateur (Passe AU2, 2026-11-11)

La fiche relue : dix-sept choix sur dix-sept, seize à la recommandation. Les choix sont cités mot pour mot ; les décisions A3 sont marquées.

| Carte | Choix, mot pour mot | Note |
|---|---|---|
| AU-01 | « Un essai guidé sur le main d’aujourd’hui, une page qui liste ce qu’il faut juger » | — |
| AU-02 | « Pas encore : après l’essai de réception et les bloquants » | — |
| AU-03 | « Recaler tout de suite, sans attendre l’essai » | « car cela semble vraiment impactant, avec nos simulations on ne parvient jamais a gagner, il faut re-configurer notre gameplay combat » |
| AU-04 | « Tout dire (guide, leçons, page des compétences, fiche de match), les règles inchangées » | — |
| AU-05 (A3) | « La sortir de cette version : amender les contrats (A3), la phase d’équipe devient la suite » | — |
| AU-06 | « Corriger les deux (graine tirée et montrée ; la version 2 gardée, le défaut dit) » | — |
| AU-07 | « Appliquer la règle : le même fondu au noir avant chaque changement de page » | — |
| AU-08 | « Une séance de correctifs, chaque règle alignée sur ce que le jeu dit » | — |
| AU-09 | « Alléger AGENTS.md (règles et renvois) et élaguer le journal, avec une règle de taille » | — |
| AU-10 | « Tout nettoyer après vérification (les deux fichiers modifiés montrés d’abord) » | — |
| AU-11 | « Retirer les paramètres d’essai maintenant ; garder v2=0 jusqu’au Gold Master » | — |
| AU-12 (A3) | « L’écrire maintenant (A3), comme les amendements de CB1, AV1 et CH1 » | — |
| AU-13 (A3) | « Hors de cette version : consigner les trois écarts (A3) » | — |
| AU-14 | « Ren au masculin, les tournures neutres de TF1 gardées » | — |
| AU-15 | « Garder « Chevalière », écrire « 10 % » partout » | — |
| AU-16 | « Laisser (option 3) » | — |
| AU-17 | « Plus tard, chacun à ta demande » | « il faut conserver la note pour retravailler desuss le moment venu » |

Les chantiers qu'ils demandent sont détaillés dans le journal (Passe AU2) ; chacun part dans sa propre séance.

**La direction de l'opérateur sur le combat** (Passe AU3, mot pour mot) : « je pense que nous devons partir du principe que les duels seront des combats auto par ordinateur ou nous les joueurs nous allons surtout nous focus sur la preparation du combat ( equipement, skills, etc...) donc on doit bien adapter le systeme de combat avec des valeur coherente pour une simulation optimale puis par la suite on vera si on effectue un systeme semi-auto... le vrai changement sera d'integrer un zone de charge/attente avant d'agir peut etre que voir comment adapter cela avec AP bref il faut bien penser a ce la », puis « sinon les autres chantiers semblent bon mais comme je dis tout ce qu'il est lie au combat devra etre repenser donc ».

Ce qui en découle :
- Le chantier n° 1 devient une refonte du combat autour de duels joués par l'ordinateur, conçue comme l'atelier CB1.
- Les nombres du duel dits (AU-04) attendent cette refonte.
- Le § 6.1 du contrat projet (les trois commandes) sera amendé par une décision A3 avant la construction.
- Les décisions A3 déjà prises sur le duel (DB5, DB5-3, DB5-4, DB-2, DB7-1 à DB7-6, DB11-2, DB11-5, DB11-6) se relisent dans l'atelier avec l'opérateur.

**Une inspiration de l'opérateur pour l'atelier** (Passe AU4) : *La Brute* (Motion Twin, 2008), des combats automatiques décidés par les statistiques et la préparation. Son fonctionnement a été lu dans le code de son remake (https://github.com/Zenoo/labrute) ; rien n'en est copié.
- Une ligne de temps d'initiative décide qui agit : chaque action fait attendre son auteur selon son arme et sa vitesse. C'est la zone de charge et d'attente demandée en AU3.
- La préparation (armes, compétences, animal ; un choix entre deux propositions à chaque niveau) décide de l'issue ; le combat est calculé, puis montré.
- Pour l'atelier : ce que deviennent les PA sur une telle ligne de temps ; un même modèle pour les duels vus et hors écran (contrat tournoi § 6) ; la durée de 2 à 5 minutes (DB5, A3) pour un duel regardé ; ce qui est tiré au hasard et ce qui est dit au joueur. Le principe est repris, pas le jeu.

**Les réponses de l'opérateur** (Passe AU5, mot pour mot dans le journal) : une ligne de temps, et les PA gardés pour les compétences sauf meilleur choix ; la défense et l'esquive à définir avec les cinq stats ; le modèle le plus juste, et un semi-automatique où le joueur choisit quand lancer ses compétences ; une durée suffisante pour profiter du duel. Le problème qu'il nomme : « le joueur perd trop souvent face au ennemie avance/expert ». Cinq propositions sont notées pour l'atelier, rien n'est décidé :
- le temps décide quand, les PA décident quoi ;
- la garde et l'esquive en réactions calculées par la Défense et la Vivacité, sans sixième stat ;
- une simulation et trois façons de décider (l'IA, l'automatique du joueur, le semi-automatique) ;
- la durée comptée en actions ;
- partir de la courbe : un joueur de référence par étape, réellement atteignable, et les rivaux calés dessus, leur préparation comprise.

---

## Annexe — les commandes

```
npm run typecheck ; npm test ; npm run build ; npm run art:validate
node tools/tournament-lab.mjs --seeds=1..50 --policy=idle|diligent|curious|planner --json=<f>
node tools/duel-balance.mjs --audit --policies=bot,strat,spam,gspam --variant=rpg+rs1+lv1 --seeds=1..20
BASE_URL=http://127.0.0.1:5411/ node tools/default-proof.mjs <dir>   (de même tutorial-proof, play-day, play-flow win|lose, pad-proof, settings-proof, remap-proof, exits-proof)
BASE_URL=… node tools/ui-text.mjs --json=<f> "<nom>|<adresse>|1920x1080,812x375,375x812|<js>" …
BASE_URL=… node tools/ui-contrast.mjs --json=<f> --shots=2 "<nom>|<adresse>|1920x1080,812x375|<js>" …
BASE_URL=… node tools/perf.mjs --rounds=4 --secs=4 "<nom>|<adresse>" …   (et --size=2560x1440 --rounds=3)
```
