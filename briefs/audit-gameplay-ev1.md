# Audit de la couche de jeu de la version 2 — étape 5 de la feuille de route (Passe EV1, 05/11/2026)

Audit et proposition seulement : aucune règle ni aucun contenu du jeu n'a changé. La fiche d'arbitrages qui en sort est `briefs/fiche-ev1.html`
(publiée en page privée, lien au journal, Passe EV1).

## 0. La demande

L'opérateur, relayé par la séance mère, nomme la suite : « le travail sur les evenements dynamique et aussi les actions d'interactions : vol, defi,
etc... ». C'est l'étape 5 de `briefs/roadmap-2026-10.md` (« Les événements dynamiques (`src/events/`) et les phases du tournoi selon les contrats ;
la structure narrative et des cinématiques jouées en direct »), la seule étape pas encore commencée. Tout ce qui est audité vit derrière `flags.v2` ;
le jeu par défaut reste inchangé jusqu'à l'essai de l'opérateur (V2-17 « Pas encore »).

Lu : `AGENTS.md`, `JOURNAL.md` en entier, les trois contrats maîtres (gameplay §§ 1-14, tournoi §§ 1-15, projet §§ 3.3-3.5, 4, 8, 9, 13),
`briefs/cloud-session-v2-brief.md` (lots V4, V6, V7), `briefs/v2-trial.md`. Code audité : `src/events/` (`engine.ts`, `types.ts`, `catalog.ts`,
`v2catalog.ts`), `src/simulation/v2town.ts`, `v2.ts`, `v2gear.ts`, `v2skills.ts`, `v2places.ts`, `roles.ts`, `actions.ts`, `slot.ts`,
`src/tournament/v2calendar.ts`, `pulse.ts`, `offscreen.ts`, `lab.ts`, `src/narrative/v2story.ts`, `people.ts`, `dialogue.ts`, `src/ui/townUi.ts`,
`journal.ts`, `playTown.ts`, `playPlaza.ts`, `playArena.ts`, `src/simulation/look.ts`.

## 1. Ce que la version 2 a aujourd'hui

- **Les événements** : 32 définitions (les 18 de la tranche, `catalog.ts`, et 14 de la version 2, `v2catalog.ts`, lues après elles dans une partie
  v2 seulement, `slot.ts`). Chaque événement est une donnée : une condition sur l'état et le pouls, des effets, une cause écrite, un texte ; les
  majeurs nomment leurs signes et leurs réponses (`types.ts`). Ils se lisent à la fin de chaque créneau (`engine.ts`), après les matchs hors écran et
  l'activité des rivaux. Le hasard (`chance`) ne choisit qu'entre des événements dont les causes tiennent.
- **Deux chaînes de sabotage ciblé**, toutes deux de Cassius : la forge du quai (deux signes, six réponses : payer la garde, veiller soi-même,
  payer l'informateur, dénoncer, réparer, la lame de Mara) et l'armure trafiquée avant un combat de la coupe (deux signes, quatre réponses : la
  vérification de Hilde, la garde, la dénonciation, la confrontation ; l'effet : +15 % de dégâts reçus ce jour-là).
- **Les actions en ville** (`v2town.ts`, lot V4) : marchander (une fois par boutique et par jour ; la chance suit la réputation et la bienveillance
  du marchand ; −15 % pour la journée, ou +10 % et la bienveillance −4), défier (Orla, Ilse au terrain d'entraînement, Vessa au parvis, de jour ;
  un créneau ; un duel à mi-vie dans l'arène ; gagné : la compétence du combattant apprise ou montée, +3 de réputation ; perdu : −1, sans blessure),
  voler (la pièce la moins chère de la boutique ; plus facile la nuit et quand la garde est mince ; pris : une amende jusqu'à 15 pièces, −8 à −12
  de réputation, la boutique fermée pour la journée et ses prix en hausse le lendemain, les autres boutiques ouvertes).
- **Les dix jours** (`v2calendar.ts`) : la poule (jours 2, 4, 5), la coupe, les demi-finales et les combats de la Porte (jour 6), le match majeur
  (jour 8), la finale (jour 10) ; jours libres 3, 7, 9. **Le récit** (`v2story.ts`) : une réplique par acte pour cinq rivaux (Marek, Vessa,
  Cassius, Orla, Ilse ; rien pour Rhosk et Tobin), le recrutement d'Orla (+1 PA en duel), cinq cinématiques de deux ou trois répliques (l'arrivée,
  la coupe, Orla, la veille, la finale).

## 2. Les contrats contre le code

| Exigence | État | Où |
|---|---|---|
| § 5 puissance immédiate (équipement, entraînement, consommables) | **couvert** | entraînement (`roles.ts`, `v2skills.ts`), quatre boutiques et paliers d'arme (`v2gear.ts`), Corvin |
| § 5 résilience (soin, repos, protection) | **couvert** | repos, Sœur Anwen, onguent, garde payée, veille, vérification de Hilde |
| § 5 information (observer un rival, enquêter, acheter une rumeur) | **mince** | observer : Vessa et Marek seulement, au parvis, de jour (`roles.ts` `scout`) ; aucun autre adversaire de la poule ni de la coupe ; l'informateur ne parle que du sabotage ; Lio : +3 de réputation et une phrase ; l'activité hors écran des rivaux est écrite invisible (`offscreen.ts`, `visible: false`) |
| § 5 relation (aider une recrue, un marchand, une faction) | **mince** | la cargaison de la tranche (Tam, Hale, Bram), aider Mara, s'entraîner avec Orla ; aucune action de relation avec les gens de la version 2 (Hilde, Corvin, Pip, Brann, Wren, Odo) ni avec une faction |
| § 5 investissement (débloquer un service, un atelier, un raccourci) | **absent** | rien ; réparer la forge ne fait que revenir à l'état d'avant un sabotage |
| § 5 opportunité (challenge urbain, événement rare) | **mince** | trois défis, la leçon ouverte de Corvin (−20 % un jour), les bookmakers (10 pièces) ; aucun événement rare où le joueur entre |
| § 8 réaction de la ville, observable sans écran de debug | **mince** | le quai : sa foule suit l'excitation (3 à 12 passants, `look.ts`), la forge brûlée se voit, pluie du jour 3, pavois de jour ; les places : la foule suit l'heure seule (`PLAZA_CROWD`) ; le reste passe par des répliques et des bandeaux de texte |
| Tournoi § 9 : le pouls consommé par la ville, visuellement et systémiquement | **mince** | `playerFame`, `publicPressure`, `activeCompetitors` ne sont lus par rien ; `commerce` par une seule réplique de Mara |
| § 9 d'abord collectif, ciblé quand le joueur devient dangereux | **couvert** | vols à la tire, vandalisme, tricheurs, rixe, querelle Dree / Temple ; le ciblé exige une victoire ou 35 de réputation, et la rancune de Cassius : le joueur qui ne gagne pas n'est jamais visé |
| § 9 / projet § 9.3 fair-play d'un sabotage majeur (deux parmi indices, prévention, mitigation, enquête, alternative, compensation, auteur) | **couvert, avec trois réserves** | forge : 2 signes, 6 réponses ; armure : 2 signes, 4 réponses. Réserves : une seule réponse (la garde du quai à 15 pièces) déjoue les deux chaînes, y compris aux vestiaires de l'arène ; l'effet de l'armure trafiquée ne se lit nulle part à l'écran ; un seul saboteur (Cassius) |
| Projet § 9.2 escalade (espionnage, intimidation, vol, tentative de blessure, désinformation, pression sur un commerçant, sabotage d'entraînement) | **mince** | pression sur un commerçant (la forge) et tentative de blessure (l'armure) seulement |
| § 10 économie : varie selon quartier, étape, pénurie, réputation, relation, événement, jour / nuit ; pas de cul-de-sac | **couvert** | `shopPrice` (`v2gear.ts`) ; une boutique fermée en laisse trois ; la forge perdue a trois sorties |
| § 11 l'échec ouvre une situation | **couvert, sans mordant** | défaite : points et réputation ; hors de la coupe : les combats de la Porte ; blessure : repos, soin, onguent ; pris à voler : amende, autre boutique. Mais un voleur à réputation 0 se qualifie 9 fois sur 10 (§ 4) : la réputation ne pèse pas sur le tournoi |
| Verrou 8 : causalité des événements importants | **couvert dans les données** | chaque événement porte sa cause ; deux textes promettent ce que rien ne fait (« Mara will count the stall tonight » après un vol réussi) |
| Projet § 8.1 : la nuit, réseau social, économique et clandestin | **mince** | la nuit, une seule boutique ouverte (Pip), Cassius sur la place, l'informateur au quai ; le vol de nuit n'existe qu'à l'étal de Pip |
| Tournoi § 8 : un éliminé ne disparaît pas | **mince** | les quatre de la Porte combattent encore ; aucun ne devient défiable, recrutable ou hostile |
| Tournoi § 10 : un grand événement public hors combat | **absent** | la parade du jour 9 est une ligne de texte |
| Projet § 13 : cinématiques in-engine dépendantes de l'état | **couvert, court** | cinq scènes jouées en direct, deux ou trois répliques chacune ; aucune ne dépend d'un résultat (élimination, défaite, sabotage démasqué) |
| Gameplay § 7 / projet § 5.1 : recrutement et phase d'équipe | **écart consigné** | Orla seule, +1 PA ; la phase d'équipe reste un écart (Passe V6) : un chantier plus tard, hors de cette fiche |

## 3. Les mesures (TournamentLab `--rules=v2`, graines 1 à 50)

### 3a. Le laboratoire tel qu'il est
| Politique | Combats gagnés | Qualifié | Couronné | Blessures | Événements visibles par partie |
|---|---|---|---|---|---|
| `diligent` (adresse 0,6) | 59,6 % | 88 % | 2 % | 0,76 | 39 |
| `idle` (adresse 0,3) | 0 % | 0 % | 0 % | 1,74 | 31 |

- Avec `diligent`, 26 définitions sur 32 se déclenchent ; six jamais : `steel-shortage`, `merchant-favour`, `v2-steel-caravan`, `v2-quay-alert`,
  `v2-thief-talk`, `v2-challenge-fame` (elles attendent une action que le bot ne fait pas). `merchant-favour` et `v2-steel-caravan` ne partent dans
  aucune des politiques mesurées.
- **La répétition** : `night-market` 10 fois par partie (le même texte chaque jour), `colosseum-roar` 5,8, `v2-puppet-show` 4,8 : 52 % des lignes
  d'événement d'une partie diligente (52 % aussi pour le joueur `idle`, sans le spectacle de marionnettes : 17 définitions seulement s'y
  déclenchent).
- **Le sabotage** : la forge est tentée dans les 50 parties diligentes et déjouée dans les 50 (le bot paie la garde chaque soir, 7,5 fois par partie,
  112 pièces) ; l'armure est trafiquée dans 19 parties, déjouée par la même garde dans 15, trouvée par Hilde dans 4. Le joueur `idle` n'est jamais
  visé.
- Aucun participant oublié (0), comme le contrat du tournoi § 13 le demande.

### 3b. Les actions en ville (script hors dépôt, mêmes graines, mêmes modules purs)
- **Disponibles** (à chaque créneau, quelque part en ville) : marchander 100 % des créneaux, voler 100 % (de jour dans trois boutiques, la nuit chez
  Pip seulement), défier 50 % (les matins et les après-midi sans combat). Chance moyenne : vol 39 % (23 à 70 %), marchandage 46 % (26 % pour le joueur
  `idle`, faute de réputation).
- **Le bot ne marchande, ne vole, ne défie, n'observe, n'écoute ni n'achète d'information** : `diligentV2` (`lab.ts`) soigne, paie la garde, fait
  vérifier l'armure, achète deux armures et s'entraîne. Trois joueurs « explorateurs » ont été écrits pour cet audit, sur la base du diligent :

| Politique | Combats gagnés | Qualifié | Réputation finale | Pièces finales | Fait par partie |
|---|---|---|---|---|---|
| diligent | 59,6 % | 88 % | 66 | 7 | — |
| défieur (défie chaque fois qu'il peut) | 46,8 % | 64 % | 89 | 4 | 15 défis, **15 gagnés** (100 %), 2 compétences apprises, 5 défis sans gain (compétence au plafond) |
| voleur (vole chaque fois qu'il peut) | 63,6 % | 90 % | **0,2** | 1 | 33 vols, 7 réussis, 26 pris, 3,6 fermetures |
| marchandeur | 60,8 % | 94 % | 66 | 10 | 40 marchandages, 37,5 % réussis, la bienveillance qui s'effrite |

- Lecture : **le défi n'a pas d'enjeu** (gagné à 100 % à mi-vie ; il coûte le créneau d'entraînement, d'où moins de victoires, et le bot n'emporte
  jamais ce qu'il apprend) ; **le vol n'a pas de suite** (pris 26 fois, réputation à 0, et pourtant qualifié 9 fois sur 10) ; **le marchandage est un
  dé gratuit** (aucune décision, aucun lien avec un achat).

### 3c. Ce que le bot ne voit pas
- Les actions ci-dessus, l'observation, la quête de la cargaison, le recrutement d'Orla (le diligent v2 ne s'entraîne jamais avec elle) ; il ne change
  jamais ses quatre compétences ; il paie la garde chaque soir sans lire les signes ; il ne lit pas les textes. Le laboratoire ne compte ni la marche
  entre les lieux, ni ce que l'écran montre, ni le prix d'un soir passé à une action. Toute mesure de cette fiche sur la valeur d'une compétence
  apprise ou d'une information est donc hors de sa portée.

## 4. Une partie jouée dans le navigateur (DEV, `?play=1&new=1&v2=1`, graine 1842, jour 1 et la fiche du jour 2)

- **Lisible** : le dialogue en bas (P4) ; la page des marchandises montre le marchandage avec sa chance (« About 28 % to win a bargain ») et son
  résultat en ambre ; la liste « Here » (Q) montre le vol avec sa chance (« about 30 % not to be seen ») ; le vol pris s'annonce en haut de l'écran ;
  la cinématique d'arrivée (bandes, portrait, trois répliques).
- **Défauts relevés** :
  1. **Sur les trois places, ce qui arrive à la fin d'un créneau ne s'affiche pas** : la page se recharge (l'heure change) et l'interface part de la
     dernière entrée du journal (`playPlaza.ts` : `st.log.length - 1`), alors que le quai garde ce qu'il a déjà montré (`playTown.ts`, `SEEN`).
     Vérifié : « Wait » au parvis, l'annonce des hérauts n'apparaît qu'au journal (J). Les signes de sabotage, la leçon de Corvin, les bookmakers
     partent souvent à la fin d'un créneau passé sur une place.
  2. **Un vol réussi depuis la liste « Here » ne dit rien à l'écran** : le bandeau est caché tant que la liste est ouverte
     (`body.pm-talking #pm-toast`) ; seul le sous-titre « Ren · whetstone » change.
  3. **Le défi est étiqueté « free »** alors que son libellé dit « a slot » (le créneau est pris au résultat) : la règle P2 veut « free » seulement
     quand rien n'est dépensé.
  4. **Le journal affiche « Why: action:steal »** sous une conséquence d'action : un identifiant de code à l'écran (UM-R3 « Tous les retirer »).
  5. **Le défi d'entraînement à mi-vie se joue dans le Colisée plein** : 88 spectateurs, la foule sonore, alors qu'il s'annonce « sur le sable » du
     terrain d'entraînement.
  6. **La fiche de match dit « scouting would tell you more »** pour tout adversaire, alors qu'on ne peut observer que Vessa et Marek.
  7. Un vol réussi promet « Mara will count the stall tonight » : rien ne se passe le soir.
- **La scène ne réagit pas** : pris à voler, Mara reste à son étal, aucun garde ne vient, la foule ne change pas ; la conséquence vit dans les
  chiffres (réputation 10 → 2, pièces 60 → 45) et dans un bandeau.

## 5. Ce qui reste hors de cette fiche
- **Le recrutement et la phase d'équipe** (gameplay § 3.2-3.3, § 7 ; tournoi §§ 2, 5, 15 ; projet § 5.1) : un écart consigné depuis la Passe V6, un
  chantier plus tard, à concevoir avec l'opérateur après l'étape 5.
- Les nombres du duel, l'art des personnages, le son : leurs fiches sont closes ou à part.

## 6. La proposition (détaillée sur la fiche)
Seize choix, en six familles : les corrections de lecture (EV-1) ; voler, défier, marchander (EV-2 à EV-6) ; les événements (EV-7 à EV-10) ;
l'information et la ville (EV-11, EV-12) ; le récit, les cinématiques et le festival (EV-13, EV-14) ; le découpage en lots et le joueur du laboratoire
(EV-15, EV-16). Chaque lot sera une séance à part, derrière `flags.v2`, avec ses preuves (le jeu par défaut à 0 px et au JSON près) et sa fiche.

## 7. Les décisions de l'opérateur (Passe EV2, 05/11/2026)

La fiche est relue : **seize choix sur seize à la recommandation**, consignés mot pour mot au journal (Passe EV2), avec quatre notes :
- EV-2 : « Mais il peut aussi avoir une possibilite de combat et de represaille reelle, d'ailleurs on parle de reputation mais comment cela
  fonctionne ? » (la réponse, lue dans le code, est dans la Passe EV2) ;
- EV-4 : « Je voulais integrer aussi des pnjs generiques qui peuvent etre des combattants present lors de qualifs/eliminatoires par exemple » ;
- EV-6 : « mais on peut aussi marchander avec les passants pour obtenir un objet qui possede au lieu de le voler par exemple, ce qui peut donner
  l"obtention de items unique ou rentable comme dans octopath travaler » ;
- EV-7 : « il faut que cela puisse impacter la preparation du joueur en jouant sur cet aspect imprevisible ».

Le message de l'opérateur, mot pour mot : « c'est rempli, la fiche. n'oublie pas l'importance narrative et la coherence du gameplay, il se peut que
nous devions creer des combattants generiques ( des elimines pour les qualifications pour la phase de groupe/finales ), mais il faut pas se perdre
dans la structure du jeu. sinon c"est pas bon ». À la question de leur place, sa réponse : **« En ville, structure gardée (Recommandé) »** : les dix
jours et la poule de huit restent ; les combattants génériques sont les éliminés des qualifications tenues avant l'arrivée de Ren, ils restent en
ville, acceptent un défi et servent de gros bras dans une représaille ; leurs sprites viendront des planches approuvées, sur fiche.

La suite (EV-15 « L1 à L6 dans cet ordre ») : L1 la lecture ; L2 voler, défier, marchander (avec la représaille, les génériques, le marchandage
avec les passants, la réputation et le soupçon expliqués, le joueur « curieux » du laboratoire) ; L3 l'information et les réponses au sabotage ;
L4 les événements et les rivalités (chacun touche la préparation) ; L5 la ville qui réagit ; L6 le récit, les scènes et le festival. Chaque lot
dans sa séance, derrière `flags.v2`, la structure du tournoi gardée.

## 8. L1, la lecture (Passe EVL1, 05/11/2026)

Les défauts 1, 2, 3, 4, 6 et 7 du § 4 sont corrigés dans une partie de la version 2 ; le 5 (le défi au Colisée plein) est l'arène aux gradins vides
d'EV-5, lot L2. Le jeu par défaut reste tel quel : son journal montre encore les codes des actions (`action:repair`, `action:report`,
`action:confront`, `match:…`), les nouvelles d'une action prise dans une bande y restent cachées, et son quai redit au créneau suivant ce que le
bandeau a montré (écarts consignés au journal, Passe EVL1). Ce qui revient à L2 : le vol découvert le lendemain (EV-2 ; le texte du vol réussi ne
promet plus rien d'ici là), la réputation et le soupçon expliqués dans le jeu, le défi à pleine vie avec une mise, une fois par phase, dans l'arène
aux gradins vides (EV-3, EV-5).

## 9. L2, voler, défier, marchander (Passes EVL2 et EVL3, 05-06/11/2026)

Construit derrière `flags.v2` sur la branche `claude/l2-ville`, non fusionné. EV-2 : le soupçon à côté de la réputation, expliqués dans le jeu ; le vol
noté, découvert à l'aube ; au-delà de 50, la fouille et les quatre étals fermés jusqu'à la restitution chez Hale, toujours ouverte ; le greffier ; les étals
forcés la nuit ; la représaille de Corra Dunmere, affrontée ou payée. EV-3 / EV-5 : le défi à pleine vie, une mise (10 pièces ou 5 du nom), une fois par
phase, jamais de blessure, dans l'arène aux gradins vides. EV-4 : dès le jour 6, un rival hors du titre ; trois combattants génériques (Ser Aldric, Corra,
Frère Ambrose), en portrait seul jusqu'à leur art. EV-6 : trois arguments au moment d'acheter ; trois passants avec une pièce unique (Fenwick, Lady Edda,
Sela). EV-16 : le joueur curieux (50 parties : 50 % de combats gagnés, qualifié à 62 %, 3,7 défis gagnés sur 6,8, 2,7 vols découverts). Le jeu par défaut
est identique (0 px, empreintes, laboratoire au JSON près). La fiche du lot : https://claude.ai/artifact/JtHMUAQxrAoHdNq8wRytGP (`briefs/fiche-l2.html`),
quatorze cartes.

**Relue en Passe EVL4 (06/11/2026)** : treize choix sur quatorze à la recommandation. L2-2 sans choix cliqué, avec la note de l'opérateur, mot pour mot :
« Hum cela m'a l'air un peu sophistique, la version de octopath traveler est parait plus simple car on etabli un pourcentage de vol sur une personne et si
le vol echoue alors la reputation baisse au bout de 2-3 essaies ... donc que preferons nous ? ». À la question posée dans la conversation, sa réponse :
**« Des marques (Recommandé) »** : le registre du sergent Hale compte une marque par vol pris ou découvert à l'aube ; à trois marques, les étals refusent et la
garde fouille, jusqu'à la restitution chez Hale ; plus de points cachés. L2-11 « Ces trois figures, une tâche à part après la fusion » (Aldric : le chevalier
n° 07 de la planche des personnages principaux ; Corra : le panneau 2 de G1 ; Ambrose : le panneau 4 de G1). L2-14 « Fusionner après la fiche, essayer
ensuite ». La suite : L3, l'information et les réponses au sabotage (EV-10, EV-11).

## 10. L3, l'information et les réponses au sabotage (Passe EVL5, 07/11/2026)

Construit derrière `flags.v2` sur la branche `claude/l3-information`, non fusionné. EV-11 : chaque rival de la poule observé là où il s'entraîne et à son heure
(un créneau, ses compétences sur la fiche de match) ; une rumeur du prochain adversaire, sa santé et sa forme, à la salle de Lio (3 pièces, juste deux fois sur
trois) ou à l'inconnu sur le quai le soir (8 pièces, jamais faux, les secrets en plus) ; la page du tournoi dit ce que la ville a vu chaque rival faire depuis
hier, sans ses actes secrets. EV-10 : la garde du quai garde la forge seule, la chambre forte du greffier Odo garde l'équipement la veille d'un combat ; le trafic
ne part plus que la veille d'un combat du joueur (sur `main`, 14 fois sur 19 sans effet avec le diligent) ; la sangle coupée se lit sur la fiche de match et se
découvre après le combat ; Lady Edda nomme les couleurs de la maison Dree, le rapport à Hale paie l'équipement. Le jeu par défaut est identique (0 px,
empreintes, laboratoire au JSON près pour les règles classiques et dynamiques, l'idle v2 et les parties scriptées) ; le diligent v2 garde ses combats et ses
taux mais plus son JSON (la garde, les trafics sans effet : carte L3-9). La fiche du lot : https://claude.ai/artifact/SJ7N5DK32AqxGMaYKPCxGs
(`briefs/fiche-l3.html`), douze cartes.

**Relue en Passe EVL6 (07/11/2026)** : douze choix sur douze à la recommandation, sans note ; L3-9 « Accepter l’écart » (le diligent v2 garde ses combats et ses
taux, plus son JSON) ; L3-11 « Les garder pour L4 » (Hale, Corra, Ambrose) ; L3-12 « Fusionner après la fiche, essayer ensuite » : fusionné. La suite : L4, les événements
et les rivalités (EV-7 à EV-9).
