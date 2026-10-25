# Journal de bord — archive : passes CB1 et C1 (2026-10-25)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-10-25 (Passe RC1) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe CB1 — L'atelier « système de combat » (étape 0 de la feuille de route, E1 / E16) : la spécification du « tour par tour dynamique », mené par l'opérateur (2026-10-25)

### Demande, mot pour mot
- Note de l'opérateur sur E1 / E16 (fiche de la Passe D8) : « Nous devons faire une tache entiere concernant le systeme de combat et la logique car
  c'est quelque chose de nouveau que seul moi a l'entiere comprehension ». Séance locale lancée par la séance parente, en parallèle du système de
  design de l'interface (« si il y a pas de conflit ») : l'opérateur mène, la séance prépare, interroge, consigne et rédige ; aucun code de combat.
- Cadre : tant que la séance de l'interface tenait la seule branche, ni branche, ni commit, ni fichier suivi touché ; tout le travail dans le
  dossier de notes partagé (`combat-workshop/` : état des lieux, réponses mot pour mot, référence Unity, brouillon, fiche). Aucun serveur lancé.
  Branche `combat-system-cb1` ouverte depuis `main` (`f17daf6`) après la fusion de la Passe UI3, annoncée par la séance parente et vérifiée
  (`git fetch --prune`, `git branch -a` : aucune autre branche).

### Méthode
- **État des lieux** (lu : `AGENTS.md`, ce journal, la feuille de route, les Passes A1 à A3, P1, P2, L7, D8, AA1, les trois contrats, `src/combat`,
  `src/arena/CombatSim.ts`, `FighterArt.ts`, le prototype et son rapport) : le combat de l'arène est en temps réel, sans attente, avec des PA, une
  garde tenue, une esquive dans une fenêtre et des techniques à recharge. Le rapport du prototype (`arena/source/runtime-bakeoff-report.txt`,
  passe 9) le donne pour la spécification de l'opérateur, venue après une version « Dynamic Turn-Based » à jauge. Les contrats disent « tour
  par tour ».
- **Cinq groupes de questions** posés dans la conversation, ouverts, chacun avec ce que le code fait comme repère : le modèle et la boucle ; les
  actions ; la résistance, la défense, l'adversaire, la fin ; les ressources, la préparation, les équipes ; les points ouverts, l'écran, les
  animations, les contrats, l'ordre. Chaque réponse recopiée mot pour mot (annexe A de la spécification).
- **La référence de l'opérateur** (G1) : son ancien combat Unity (`…\Unity\MyGame\Assets\game\Base\Battle`, C#, 6 057 lignes), lu en lecture
  seule comme concept : charge tenue d'une barre, file d'exécution une action à la fois, garde tenue (miroir, regain), « Transe », effets d'état,
  1 contre N. Aucun code repris ; l'opérateur en retire ensuite la charge tenue, les gardes spéciales et la Transe (G2).

### Les mots de l'opérateur qui fondent le système (extraits ; le texte entier est l'annexe A de `briefs/combat-system.md`)
- Le modèle (G1) : « Il propose une tour par tour dynamique... et ou chaque actions demandent un temps de chargement pour exexcuter, une garde
  pour se proteger » ; « on dirait meme une inspiration de expedition 33 sauf que nous on est toujours actif dans le combat pas de temps de
  pause. l'adversaire IA a la priorite donc quand ll attaque rien ne l'empeche et si on a le meme timing d'attaque que lui on peut etre
  repousser. »
- Les actions (G1) : « 2 aactions de defense : esquive (utilise les points d'action PA), garde ( utilise pas les PA mais subit des degats reduit
  et peut parfois etourdir selon l'attaque ). 2 attaques simples : leeger (accumule des PA) et puissante (propose une attaque puissante et peut
  etourdir parfois si jauge de resistance est brise ), et 4 competences speciales ( offensive, defensive, soutien) ».
- Sans charge (G2) : « les touches seront instantanee pour le joueur, juste donc pas de charge ni garde specia et pas de transe. a la place de
  charge, par exemple l'attaque lourde ou les competences auront un temps de delai ( preparation auto ) ».
- La défense (G3) : « seulement garder et esquiver, il peut tenter d'attaquer maiis aucune execution se fera et il se prendra des degats car
  l'adversaires sera toujours en pleine execution ».
- La résistance (G2, G3, G4, G5) : « tous les cousps » ; « Oui une seul regle me va » ; « un etourdissement de 5-10s, degats legerement accrus
  .... le but est de donner  un avantage sans briser le combat » ; « elle peut baisser legerement et progressivement avec le temps pour faire
  simplle » ; « Oui surtout pour l'adversaire c;est une barre de break » ; sur un coup lourd contre une garde : « seulement monter la jauge plus
  vite ».
- La fin et la durée (G4, G5) : « Oui KO pour la fin du duel » ; « 5-10min selon la complexite de l'adversaire et ces points de vie ».
- Les équipes, plus tard (G4) : « un concept de switch pour le joueur [...] je prefere tous les adversares max 3 ».
- Les contrats et l'ordre (G5) : « Je te laisse gerer mais il est sur qu'il faut mettre a jour au besoin afin de commencer sur une base saine » ;
  « je te laisse la liberte de choisir selon ce que tu penses le plus judicieux ».

### La fiche — [OK] 11 choix sur 11 enregistrés et relus
- Page privée https://claude.ai/artifact/97p5rqdpTgrqLNLcsBXVNi, collection `decisions`, relue vide après publication. Les protections de la Passe
  D8, reprises dans le gabarit : pont attendu 10 s, chaque écriture relue (`get`) avant « Enregistré et relu », copie locale, choix faits avant
  la connexion écrits à la connexion. Relue après « La fiche du combat est remplie. » : **11 documents sur 11**, cliqués le 25/10 entre 06 h 03
  et 06 h 06 UTC, une note.

| # | Décision | Choix de l'opérateur, mot pour mot | Note | |
|---|---|---|---|---|
| CB-1 | La spécification | « Approuvée » | — | = |
| CB-2 | La liste des animations | « Approuvée pour Ren, puis Marek et Vessa » | — | = |
| CB-3 | Une action lancée juste avant une attaque adverse | « Annulée, PA rendus » | — | = |
| CB-4 | Jusqu'où va la phase de défense | « Toute la séquence, intervalles compris » | — | = |
| CB-5 | Les valeurs de départ | « D'autres valeurs (ma note) » | « 1 par defaut » | ≠ |
| CB-6 | Ce que montre le HUD | « Comme recommandé » | — | = |
| CB-7 | L'aide complète et le repérage | « Comme recommandé » | — | = |
| CB-8 | Amender « tour par tour » (décision A3) | « Amender maintenant, ces trois phrases » | — | = |
| CB-9 | Le contrat de combat | « Plus tard, après l'essai » | — | = |
| CB-10 | Le combat par défaut pendant la mise en œuvre | « Derrière un paramètre, défaut après mon essai » | — | = |
| CB-11 | L'équilibrage « modéré » (L7-4) | « Intégré à C1 / C3 » | — | = |

- **CB-5** : la note se lisait de deux façons. Question posée : « Sur CB-5, votre note dit « 1 par defaut ». Quelle valeur passe à 1 ? » ;
  réponse : « Les PA au départ » (le duel commence avec 1 PA au lieu de 3 ; les autres valeurs restent un point de départ, à régler à l'essai).

### Fait — [OK]
- `briefs/combat-system.md` : la spécification approuvée, avec les choix de la fiche intégrés (§ 16) et les réponses mot pour mot (annexe A).
  - Le modèle : temps continu ; l'attaque légère instantanée, l'attaque puissante et les compétences avec un délai de préparation automatique ;
    les PA dépensés par les compétences et l'esquive (1 au départ, 5 au plus comme point de départ, +1 par légère qui touche, aucune recharge) ;
    l'adversaire prioritaire pendant toute sa séquence, le joueur ne pouvant que garder ou esquiver ; une jauge de résistance par combattant, une
    seule règle, remplie par les coups reçus et la garde, vidée lentement par le temps, son break étourdit 5 à 10 s avec des dégâts légèrement
    accrus puis repart de zéro ; le K.O. seul ; des duels de 5 à 10 minutes.
  - L'adversaire : des pauses plus courtes selon son niveau, garde et esquive pour certains, 2 à 4 compétences.
  - La préparation : quatre compétences choisies avant le duel, obtenues par achats, entraînement et duels en ville ; une arme améliorable et 2
    ou 3 accessoires.
  - L'écran : l'aide discrète avec une légère alerte, les jauges des deux combattants.
  - Les équipes plus tard : un personnage actif changé par un bouton, trois adversaires au plus.
  - Les points laissés à l'essai (§ 11), les écarts avec le code (§ 12) et les contrats (§ 13).
  - **La liste des animations** (§ 14) : 13 clés, 34 images pour Ren, une par famille de compétences ; Marek de 24 à 34.
  - L'ordre de mise en œuvre (§ 15), choisi par la séance sur délégation : C1 à C5, puis les feuilles de combat.
- **Les contrats, décision A3 (CB-8)** : `contracts/PROJECT_MASTER_CONTRACT.md` § 1 et § 6.1 et `contracts/GAMEPLAY_MASTER_CONTRACT.md` § 1 :
  les trois phrases « tour par tour » remplacées par le texte montré sur la fiche, mot pour mot ; une note d'amendement datée dans l'en-tête de
  chacun, avec le texte d'avant ; rien d'autre ne change. **L'écart E1 / E16 est clos.** E14 / E15 reste une tâche à part.
- `AGENTS.md` (contrats maîtres), `briefs/roadmap-2026-10.md` (étape 0 faite, la liste des animations à l'étape 1, les choix de la fiche), « À
  reprendre » (0b, 6c).
- Aucun code ne change.

### Journal — [OK] archivage (passes gardées au-delà d'environ 60 Ko)
- Cette passe écrite, les passes gardées faisaient 61 536 octets. AA1 et UI1, closes (fusionnées), partent d'un seul bloc vers
  `journal/24-passes-AA1-UI1.md` (21 433 octets de passes, SHA-256 du bloc `556f3f7cd668104c…`) ; restent 40 319 octets. Preuve **8 / 8** (script
  hors dépôt, contre la copie de `JOURNAL.md` d'avant le déplacement : corps de l'archive égal au bloc ; AA1, UI1 contigus, suivis de UI2 ; plus
  dans `JOURNAL.md` ; chacune dans un seul fichier de `journal/` ; `JOURNAL.md` inchangé à partir de UI2 ; seules la phrase d'en-tête et une
  ligne d'index changent ; en-tête comme `journal/23` ; CRLF seuls). Contrôle négatif : un bit changé dans une copie de l'archive → 7 / 8.

### Validation
- Documentation seule : typecheck, `npm test` **162 / 162**, build, `art:validate` (18 manifestes, 30 sources, 0 erreur).

### Restes [?]
- **La mise en œuvre**, chaque lot dans sa séance : C1 d'abord (le cœur du duel, en simulation pure, derrière un paramètre ; l'arène d'aujourd'hui
  reste le défaut, prouvée à 0 px, et son empreinte contre le prototype reste valable).
- **À l'essai de l'opérateur** (après C2) : le maximum de PA (4 ou 5), le regain de PA avec le temps, les recharges, l'action objet, l'esquive en
  arrière ou de côté, la taille et la vitesse de la jauge, le surplus de dégâts du break, la durée réelle des duels ; puis le défaut (CB-10).
- **Non tranché, à définir à la phase d'équipe** : la priorité quand plusieurs adversaires attaquent. **Hors de cette spécification** : les effets
  d'état (« autre statut handicapant », G1), à décider si l'arme ou les compétences en demandent.
- Le contrat de combat (`COMBAT_MASTER_CONTRACT.md`) s'écrira après l'essai (CB-9).

### Pensée
- Avant de questionner l'opérateur sur « ses » règles, chercher d'où viennent celles du code : ici, le prototype appliquait déjà sa spécification
  (passe 9 du rapport). L'écart avec le contrat était un mot (« tour par tour ») plus qu'un système, et l'opérateur l'a nommé « tour par tour
  dynamique ».
- Des questions ouvertes posées par petits groupes, avec le code comme repère et une relecture de « ce que j'ai compris » en tête du groupe
  suivant, font ressortir les trous un à un (le « repoussé », l'étendue de la défense) ; ce que la séance comble se marque et passe sur la fiche.
- Une note qui se lit de deux façons (« 1 par defaut ») se fait préciser par une question courte avant d'être consignée : on ne choisit pas la
  lecture.

## Passe C1 — Le cœur du duel du « tour par tour dynamique » (lot C1 de `briefs/combat-system.md`), en simulation pure, derrière son paramètre (2026-10-25)

### Demande
- Séance locale lancée par la séance parente : mettre en œuvre le lot C1 de la spécification (§ 15) : la jauge de résistance et son break, la garde
  sans bris direct, la priorité de l'adversaire pendant toute sa séquence (CB-4), le « repoussé » (CB-3), le délai de préparation automatique, les PA
  (1 au départ, CB-5 ; 5 au plus ; aucune recharge), quatre emplacements de compétences en familles, le K.O. seul, les pauses de l'adversaire selon
  son niveau, des PV et des dégâts pour des duels de 5 à 10 minutes, le bot et la résolution hors écran (E6) recalculés. Contraintes : derrière un
  paramètre (CB-10), l'arène d'aujourd'hui par défaut avec son empreinte `ARENA_SIM_HASH` ; nombres provisoires ; ni HUD ni sprites (C2) ; C3 et
  l'équilibrage L7-4 après.
- Branche `combat-c1` depuis `main` (`c784e04`), seule branche de travail (`git fetch --prune`, `git branch -a`). `.gitignore`, modifié par une autre
  séance, laissé non commité. Aucun serveur lancé (simulation sans navigateur).

### Fait — [OK]
- **`src/combat/dynamic.ts`** (nouveau, pur, à pas fixe de 1/120 s, graine) : `DynamicSim`, `DYNAMIC_DATA`, ses événements (pour C2) et son
  empreinte. `src/arena/CombatSim.ts` et tout `src/arena` ne changent pas et ne le chargent pas.
  - **Le temps ne s'arrête pas** [G1] : l'attaque légère part à la touche (préparation 0) ; l'attaque puissante (0,34 s) et chaque compétence (0,30 à
    0,70 s) ont une **préparation automatique** avant leur élan [G2] ; l'impact = départ + préparation + élan.
  - **PA** : 1 au départ (CB-5), 5 au plus ; +1 par attaque légère qui porte (« porte » = non esquivée, comme aujourd'hui) ; les compétences et
    l'esquive (1 PA) les dépensent ; aucune recharge [G5] ; le regain avec le temps existe comme réglage, coupé (`ap.regen` = 0, § 11).
  - **La priorité de l'adversaire (CB-4)** : `inSeq` du départ de son premier coup à la fin de l'élan (`follow`) du dernier, intervalles compris ;
    pendant ce temps toute attaque ou compétence du joueur est refusée (`commandDenied`, `why: 'defense'`) et rien ne part [G3] ; garde et esquive
    restent ; une commande en attente tombe au début de la séquence.
  - **Le « repoussé » (CB-3, « Annulée, PA rendus »)** : une action qui n'a pas encore porté au début d'une séquence est annulée, ses PA rendus
    (événement `pushed`) ; le joueur est repoussé jusqu'au premier coup de la séquence, qu'il reçoit sans garde ni esquive (« court recul, coup
    reçu », texte de la fiche) ; une action qui a porté finit normalement.
  - **La garde** : tenue, −60 % (CB-5), sans PA ; **aucun bris direct** : le coup puissant gardé est « guarded » et remplit la jauge plus vite [G5].
  - **La jauge de résistance, une règle pour les deux** [G3] : chaque coup qui porte l'augmente (gardé compris, part `resist.guard` = 1 ; esquivé :
    rien) ; le temps la vide (1,8 / s) [G4] ; pleine (100), c'est le **break** : étourdi 6 s (dans 5-10), dégâts reçus ×1,2 (« légèrement », départ
    CB-5), la jauge tenue pleine puis remise à zéro [G5] ; l'adversaire brisé reprend 1 s après (`afterStun`) ; un break pendant sa séquence la
    termine.
  - **Quatre emplacements** (`loadout`, `SKILL_SLOTS` = 4, contrôlés par `checkDynData`) ; une compétence non emportée est refusée (`why: 'slot'`).
    Les quatre techniques d'aujourd'hui, mêmes noms, dégâts et PA, sont **offensives** (Tourbillon perd son étourdissement, § 5) ; s'y ajoutent
    **Rempart** (défensive : 6 s de dégâts reçus ×0,6 et de résistance reçue ×0,5, 2 PA) et **Ferveur** (soutien : 8 s de dégâts portés ×1,25 et de
    résistance portée ×1,5, 3 PA). Emplacements par défaut : Coup éclair, Estocade, Rempart, Ferveur (le choix est C4).
  - **Le K.O. seul** [G4] : aucune limite de temps dans la simulation (un duel passé 10 minutes continue).
  - **Les pauses selon le niveau** [G1] : `restByLevel` 1 → 8-12 s, 2 → 6-10, 3 → 5-9, 4 → 3,5-6,5, 5 → 2-4 (« presque full actif ») ; l'adversaire
    reste sans PA, avec ses séquences d'aujourd'hui (combo, légère seule, puissante seule).
- **Les adversaires sur ces règles** (`src/combat/profiles.ts`, `DYN_PROFILES`, `dynDuelData`) : chaque profil garde ses temps, ses poids et ses
  combos ; son niveau vient de ses pauses d'aujourd'hui (Tobin 1 ; Cassius, Ilse, Rhosk 2 ; Orla, Marek 3 ; Vessa 4) ; PV ×10, puis Marek dégâts
  ×1,25, Vessa PV ×0,8, Tobin PV ×1,15 ; un coup adverse ajoute 6 (léger) ou 16 (puissant) à la jauge. Le joueur : 2 200 PV. Marek de
  `DYN_PROFILES` redonne exactement `DYNAMIC_DATA` (test).
- **Le bot** (`runDynamicBotDuel`, `src/combat/bot.ts`) : dans une séquence, garde tenue d'un bout à l'autre ou non (tiré par séquence, 0,2 + 0,6 ×
  adresse), esquive des coups puissants dans la fenêtre (0,25 + 0,65 × adresse, un PA) ; dans les pauses, Rempart quand sa jauge passe 50, Ferveur
  quand il n'en a pas, les offensives quand ses PA le permettent (il en garde un pour l'esquive dès 0,5), la puissante quand ses PA sont pleins ou
  l'adversaire brisé, sinon la légère ; « prudent » (probabilité = adresse), il garde les actions lentes pour quand la plus courte pause de
  l'adversaire laisse le temps de porter. Un duel sans K.O. en 30 min ne rend pas de vainqueur (jamais vu).
- **Le paramètre (CB-10)** : une partie suit ces règles seulement avec `flags.combat = 'dynamic'` (`dynamicRules`, `src/tournament/pool.ts`) : ses
  duels dans `DynamicSim` (`botOutcome`, `dynSheetData`), ses matchs hors écran dans la course de ces règles ; `autoplay` / `labReport(…, rules)`
  et `tools/tournament-lab.mjs --rules=dynamic` le posent. Sans lui, tout est l'arène et le tournoi d'aujourd'hui. Le mode jouable ne le pose pas
  (C2).

### [KO] Le soin sans recharge
- Premier jet du soutien : « Second souffle », 15 % des PV pour 3 PA, sans recharge (la spécification n'en prévoit pas). Mesuré : contre Marek, à
  l'adresse 0,6 avec 60 % de ses PV, le bot soigne 12,6 fois par duel (1 588 PV soignés pour 1 985 reçus) et gagne 10 duels sur 10 ; le modèle hors
  écran ne pouvait plus prédire (erreur jusqu'à 0,89). **Cause** : une légère qui porte rend 1 PA, soit environ un PA par seconde de pause ; un effet
  qui grandit avec le besoin devient sans borne sans recharge. **Remplacé** par Ferveur, borné par le temps d'attaque. Rempart a été raccourci (10 s
  ×0,5 → 6 s ×0,6) pour la même raison. Un soin demanderait une recharge ou un nombre d'usages : point pour l'essai (§ 11).

### Les nombres (provisoires, « à régler » à l'essai)
- **Durées** (bot à l'adresse de référence 0,5, graines tenues à part 101..140, médiane [min-max]) : Tobin 5,4 min [5,0-5,7], Cassius 5,9, Orla
  6,5, Vessa 6,6 [5,9-7,3], Ilse 7,0, Marek 7,8 [7,4-8,4], Rhosk 8,1 [7,8-8,5] ; à l'adresse 1, Tobin 5,1 [4,8-5,4] ; perdus à l'adresse 0, 5,9 à
  8,1 min. Breaks de l'adversaire : environ 1 à 1,6 par minute (0,5 à 1 contre Vessa, aux pauses courtes) ; breaks du joueur : rares, sauf contre
  Vessa (0,15 à 0,4 par minute) ; repoussé : environ un tiers des séquences.
- **La victoire suit l'adresse en marche d'escalier** : un duel de 7 minutes fait la moyenne de quarante séquences. Taux du bot (graines tenues à
  part) : Marek 0 % à 0,3, 28 % à 0,4, 47 % à 0,45, 93 % à 0,5 ; Vessa 0 % à 0, 40 % à 0,2, 63 % à 0,3, 100 % à 0,5 ; préparé (+26,5 % de dégâts :
  lame trempée et deux entraînements) contre Marek, 70 % à 0,3 ; Tobin, Cassius, Ilse, Orla gagnés dès l'adresse 0 ou presque. Seuils (50 %) :
  Vessa ≈ 0,25, Marek ≈ 0,45 ; « modéré » (Passe D8) les plaçait vers 0,2 et 0,4, avec des courbes douces (duels de 30 s).
- **Parties entières** (`tournament-lab --rules=dynamic`, 50 graines) : duels gagnés idle 34 % (« modéré » : 34 %), négligente 65 % (53), diligente
  99 % (72), prudente 100 % (79), perdante 0 % ; forge brûlée idle 68 %, négligente 100 % ; surprises 0,18 à 0,40 par partie (1,24 à 1,64
  aujourd'hui) : la course raide les rend rares.

### La résolution hors écran (E6) — [OK]
- `dynRates` (`profiles.ts`), des seuls nombres d'un kit : le cycle de l'adversaire (sa séquence, sa pause), ce qu'une séquence coûte au défenseur de
  référence (la règle du bot : garde tenue, puissantes esquivées, premier coup reçu quand il est repoussé), les breaks de l'adversaire (une pause
  remplacée par l'étourdissement), la part de Rempart (lue sur ce que la jauge du joueur reçoit) ; constantes mesurées sur les graines de calibration
  1..20 (`DYN_RACE`) ; course logistique de pente `DYN_RACE_SLOPE` = 14, sans avance (ajustée : écart quadratique 0,124 sur 88 cas, écart maximal
  0,154). Les matchs hors écran d'une partie « dynamique » : `dynRacerOf` (PV, dégâts contre le défenseur de référence) et cette pente.
- **Graines tenues à part 101..140, tolérance 0,2 écrite avant** (`tests/combat-dynamic.test.mjs`) : 31 cas (chaque profil à 0, 0,5, 1 ; Marek,
  Vessa, Rhosk près de leur seuil ; une blessure, une lame, la préparation, un adversaire préparé) : **écart maximal 0,19** (Marek à 0,6 avec 80 %
  des PV : 0,68 contre 0,49), les autres ≤ 0,14.
- **[?]** Aucune simulation ne fait combattre deux adversaires : la course rival contre rival reprend la pente validée sur le joueur.

### Preuves
- **L'arène d'aujourd'hui inchangée** : `src/arena` sans diff et sans import des nouvelles règles (test) ; `ARENA_SIM_HASH` tenu contre le prototype
  (tests existants) ; `raceWinChance` garde sa pente 3,2 par défaut (test) ; **le TournamentLab classique identique** sur `main` figé (`c784e04`,
  copie hors dépôt) et la branche : 50 graines × 5 politiques, 250 parties, rapports égaux à l'octet (SHA-256 `9b99e7cd44e9ae46…`) ; deux
  empreintes de partie de `main` figé épinglées dans le test (idle graine 7, prudente graine 12).
- **Le bundle de production** (la même configuration de build pour `main` figé et la branche) : 18 fichiers identiques à l'octet (dont
  `CombatSim`, le worker des peintres, les feuilles cuites et les polices) ; les 12 autres ne diffèrent que par les noms hachés des morceaux qu'ils
  importent, sauf `save.js`, le morceau des modules purs du jeu (51 970 → 56 869 octets : les nouvelles règles et leur course). **[KO → corrigé]**
  un premier build changeait aussi `playArena.js` (+28 octets) : la vérification d'équipe de `sheetData`, mise en commun avec `dynSheetData` ;
  `sheetData` est remis tel quel, le morceau redevient identique. Aucun navigateur : rien de neuf ne s'affiche, et l'arène charge le même code.
- **Tests** : `tests/combat-dynamic.test.mjs` (17) : chaque règle contre un oracle écrit d'après la règle (impact = départ + préparation + élan ; gain,
  vidange et break de la jauge ; départ, gain, plafond et coûts des PA ; phase de défense sur toute une séquence, intervalles visités ; repoussé ;
  K.O. seul ; pauses par niveau sur 600 s par niveau ; Rempart et Ferveur), les durées, le bot, la course hors écran, une partie sous le paramètre,
  l'arène intacte ; 15 s, le plus long fichier.
- **32 fautes injectées une à une, toutes attrapées** (script hors dépôt, fichiers rendus à l'octet, SHA-256 vérifiés) : PA de départ à 3, légère
  sans gain, PA sans plafond, esquive gratuite, garde sans résistance, jauge sans vidange, jauge gardée après le break, break sans dégâts accrus, bris
  de garde rétabli, défense pendant les coups seulement, attaques acceptées dans une séquence, repoussé sans PA rendus, pas de repoussé, garde levée
  en étant repoussé, action portée annulée aussi, limite de temps à 10 min, pauses sans niveau, légère préparée, impact sans préparation, emplacements
  non contrôlés, nombre d'emplacements libre, Rempart sans fin, Ferveur sans effet, repoussé relâché tout de suite, bot sans garde, bot sans
  prudence, modèle sans Rempart, modèle à la pente classique, matchs hors écran « dynamiques » dans la course classique, duel du TournamentLab sans les
  règles, PA d'entraînement ignorés, course classique changée. **[KO → corrigé]** la 31e ne s'appliquait pas (son ancre se trouvait deux fois, dans
  `duelData` et `dynDuelData`) : ancre précisée, rejouée seule, attrapée. Une faute envisagée, la jauge remplie pendant le break, ne change rien
  d'observable (elle est déjà au plafond) : écartée.
- **Validation** : typecheck, `npm test` **179 / 179** (162 + 17 ; 20,6 s au lieu de 11 : le fichier des nouvelles règles tourne 15 s), build,
  `art:validate` (18 manifestes, 30 sources, 0 erreur).

### Restes [?]
- **C2** : l'arène montre `DynamicSim` (jauges des deux combattants, alerte légère, clips d'aujourd'hui sur les nouveaux moments : `prep` dans
  l'état d'animation, `pushed`, `sequenceStart` / `sequenceEnd`, `break`, `effect`), le paramètre de comparaison dans l'adresse ; puis l'essai de
  l'opérateur (§ 11 et le défaut). Le mode jouable et `?scene=arena` lisent toujours `CombatSim` ; les états nommés ne posent pas le paramètre.
- **À l'essai** : les effets de Rempart et de Ferveur (proposition de la séance), un soin avec recharge ou nombre d'usages, la fin de la phase de
  défense (fin de l'élan du dernier coup) et la durée du repoussé (jusqu'au premier coup), la jauge (100, 1,8 / s, apports), le break (6 s, ×1,2),
  les pauses par niveau, les PV, les seuils de Vessa et de Marek ; les PA sont abondants (un par légère qui porte) : la préparation et le repoussé
  limitent les compétences plus que leur coût.
- **E28 « disputé »** : avec des duels longs, il se joue sur le seuil d'adresse de chaque rival, pas sur le hasard ; à juger à l'essai, puis en C3.
- Le bot use peu d'Estocade (4 PA : Coup éclair part avant) ; le script d'empreinte n'atteint ni K.O. ni break du joueur (les tests les couvrent).
- C3 (garde, esquive et compétences des rivaux, sept profils, L7-4), C4, C5 : tâches à part ; le contrat de combat après l'essai (CB-9).

### Pensée
- Un duel long décide par la moyenne : la victoire suit l'adresse en marche d'escalier. Une course fidèle à ces duels a une pente raide (14 contre
  3,2), et « disputé » se règle par le seuil d'adresse de chaque rival.
- Avec une ressource abondante et sans recharge, un effet qui grandit avec le besoin (un soin) devient sans borne ; un effet borné dans le temps
  reste borné par le temps d'attaque. Se mesure avec le bot avant d'être proposé.
- Un modèle « des seuls nombres » se décompose et se compare pièce par pièce à la simulation (temps libre, dégâts par séquence, part de la
  protection, breaks) avant d'ajuster sa pente : la part de Rempart, invisible dans les moyennes, expliquait l'écart de Vessa.
- Un oracle de test vient de la règle écrite (« impact = départ + préparation + élan »), une empreinte de `main` figé épingle le chemin par défaut,
  et une faute qui ne change rien d'observable n'est pas une faute (la jauge « remplie pendant le break » plafonne déjà à 100 : écartée).

