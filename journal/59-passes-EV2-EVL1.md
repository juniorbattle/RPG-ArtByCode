# Journal de bord — archive : passes EV2, EVL1 (2026-11-05)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-11-07 (Passe GA1) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe EV2 — La fiche de l'étape 5 relue, seize sur seize : les choix et les notes de l'opérateur consignés mot pour mot ; les combattants génériques en ville, la structure gardée (2026-11-05)

### Demande
- L'opérateur, mot pour mot : « c'est rempli, la fiche. n'oublie pas l'importance narrative et la coherence du gameplay, il se peut que nous devions creer des combattants generiques ( des elimines pour les qualifications pour la phase de groupe/finales ), mais il faut pas se perdre dans la structure du jeu. sinon c"est pas bon ».
- Relire `decisions` (https://claude.ai/artifact/Ky78QRmuxrikUw1KM6yPcr, source `briefs/fiche-ev1.html`), consigner les choix mot pour mot. Rien ne se construit dans cette passe : EV-15 range le travail en lots, chacun dans sa séance.

### Les choix de l'opérateur, mot pour mot (seize sur seize ; cliqués le 2026-11-05 entre 21 h 39 et 22 h 27 UTC)
| Carte | Ce qu'elle demandait | Choix | Note de l'opérateur |
|---|---|---|---|
| EV-1 | Six défauts de lecture, à corriger avant le reste ? | « Les corriger en premier (lot L1) » | — |
| EV-2 | Le vol : un risque qui dure ? | « Un soupçon qui dure, une sortie par la restitution » | « Mais il peut aussi avoir une possibilite de combat et de represaille reelle, d'ailleurs on parle de reputation mais comment cela fonctionne ? » |
| EV-3 | Le défi : quel enjeu ? | « Pleine vie, une mise, une fois par phase » | — |
| EV-4 | Qui peut-on défier ? | « Les trois, puis les éliminés à partir du jour 6 » | « Je voulais integrer aussi des pnjs generiques qui peuvent etre des combattants present lors de qualifs/eliminatoires par exemple » |
| EV-5 | Où se joue le défi ? | « L’arène aux gradins vides » | — |
| EV-6 | Le marchandage : une décision ou un dé ? | « Au moment d’acheter, un argument à choisir » | « mais on peut aussi marchander avec les passants pour obtenir un objet qui possede au lieu de le voler par exemple, ce qui peut donner l"obtention de items unique ou rentable comme dans octopath travaler » |
| EV-7 | Quels nouveaux événements, dans quel ordre ? | « Les suites des actions, puis un par lieu, puis le ciblé » | « il faut que cela puisse impacter la preparation du joueur en jouant sur cet aspect imprevisible » |
| EV-8 | Les ambiances qui se répètent | « Hors des nouvelles, dans les répliques et le son » | — |
| EV-9 | Qui agit contre le joueur, ou pour lui ? | « Chaque rival se souvient ; deux autres agissent » | — |
| EV-10 | Les réponses au sabotage | « Une réponse par lieu, un effet lisible » | — |
| EV-11 | Observer un rival, acheter une rumeur | « Observer tout adversaire, rumeurs, activité lisible » | — |
| EV-12 | Ce que la ville montre | « Les places lisent le pouls, la célébrité compte » | — |
| EV-13 | Combien de récit et de scènes jouées ensuite ? | « Compléter les arcs, quatre scènes selon l’état » | — |
| EV-14 | Le grand événement public hors combat | « Un festival le jour 9, conçu sur une fiche à part » | — |
| EV-15 | Le découpage en lots | « L1 à L6 dans cet ordre » | — |
| EV-16 | Un joueur du laboratoire qui fait ces actions | « Ajouter le joueur curieux au laboratoire » | — |

Les seize choix suivent la recommandation de leur carte. Les quatre notes complètent leur choix sans le contredire.

### La question posée sur les combattants génériques — tranchée
- La note sur EV-4 et le message pouvaient ajouter un jour de qualifications au calendrier ou seulement des gens en ville. Une question courte, posée dans la conversation, mot pour mot : « Les combattants génériques (ta note sur EV-4 et ton message) : quelle place leur donner ? Aujourd'hui le tournoi a dix jours et une poule de huit (Ren et sept rivaux) dès le jour 2, sans qualifications. »
- **Réponse de l'opérateur : « En ville, structure gardée (Recommandé) »**, dont le texte disait : « Les dix jours et la poule de huit restent. Les génériques sont les éliminés des qualifications tenues avant l'arrivée de Ren : ils restent en ville, acceptent un défi, servent de gros bras dans une représaille (ta note sur EV-2). Leurs sprites viendront des planches approuvées, sur fiche. » Les autres options écartées : « Une qualification au jour 1 », « Des barrages avant les finales ».
- Donc : le calendrier, la poule de huit et la coupe ne changent pas ; aucun verrou ni aucun contrat n'est touché. Les combattants génériques sont des personnages du monde, pas un tour du tournoi. Leur art passe par une fiche (personnages tirés des planches de référence, jamais un design neuf sans demander).

### La réponse à la question de l'EV-2 : comment marche la réputation (lu dans le code)
- Un nombre de 0 à 100 (10 au départ), affiché en haut à droite. Il monte avec une victoire (+15, +20 contre Marek), une défaite serrée (+2), l'inscription (+2), un défi gagné (+3), les paroles de Lio (+3), la provocation de Cassius (+4), la confrontation (+5), la dénonciation (+5) et la couronne (+20). Il descend avec une défaite (−5), un défi perdu (−1) et un vol pris (−8 à −12).
- Ce qu'il change : les prix des boutiques (jusqu'à −15 % à 60), les compétences de Corvin (−10 % dès 40), la chance de marchander, le départage de la poule à points égaux (`standings`, `src/tournament/pool.ts`), la cible du sabotage (dès 35, ou une victoire) et son risque, une réplique du barde dès 40.
- Ce qu'il ne change pas : le duel, l'accès aux lieux et aux gens ; la « célébrité » et la « pression du public », calculées à partir de lui, ne sont lues par rien (Passe EV1). Le jeu ne l'explique nulle part. D'où le voleur à réputation 0 qualifié 9 fois sur 10.
- À trancher dans la séance de L2, sur sa fiche (« proposé ») : deux nombres distincts, la **réputation** (le nom public, que le tournoi et la ville lisent) et le **soupçon** (ce que la garde sait de toi, EV-2), chacun expliqué dans le jeu ; ce que la réputation ouvre et ferme, avec EV-12 (« la célébrité compte »).

### Ce que ces choix veulent dire pour les lots (EV-15 « L1 à L6 dans cet ordre »)
- **Pour chaque lot**, la consigne de l'opérateur : l'importance narrative et la cohérence du gameplay, « il faut pas se perdre dans la structure du jeu » : les dix jours, la poule de huit, la coupe et les finales restent ; chaque ajout se rattache à un personnage, un lieu et un moment de ce calendrier.
- **L1, la lecture** (EV-1) : les six défauts de la Passe EV1.
- **L2, voler, défier, marchander** (EV-2 à EV-6, EV-16) : le soupçon qui dure et la restitution, avec « une possibilite de combat et de represaille reelle » (pris, un combat possible contre la garde ou les gros bras d'un marchand) ; la réputation et le soupçon expliqués ; le défi à pleine vie, avec une mise, une fois par phase, dans l'arène aux gradins vides ; Orla, Ilse et Vessa, puis les éliminés dès le jour 6, et les **combattants génériques** en ville (les éliminés des qualifications d'avant l'arrivée de Ren) ; le marchandage au moment d'acheter, un argument à choisir, et **le marchandage avec les passants** pour un objet qu'ils possèdent (des objets uniques ou rentables, à la manière d'Octopath Traveler, sans rien en reprendre que la mécanique) ; le joueur « curieux » du laboratoire. Lot large : sa séance peut le découper en deux, sans changer l'ordre (par exemple le vol, le marchandage et les passants ; puis le défi et les génériques, dont l'art demande sa fiche).
- **L3, l'information et les réponses au sabotage** (EV-10, EV-11).
- **L4, les événements et les rivalités** (EV-7 à EV-9) : « il faut que cela puisse impacter la preparation du joueur en jouant sur cet aspect imprevisible » : chaque événement neuf change ce que le joueur peut préparer (un service, un prix, une personne, un adversaire), annoncé par ses causes.
- **L5, la ville qui réagit** (EV-12). **L6, le récit, les scènes et le festival** (EV-13, EV-14 ; les règles du festival sur une fiche à part).
- Hors des lots : le recrutement et la phase d'équipe, toujours un chantier plus tard.

### Fait — [OK], documents seulement
- Ce journal, `briefs/audit-gameplay-ev1.md` (§ 7, les décisions) et l'étape 5 de `briefs/roadmap-2026-10.md`. Aucun fichier de `src/`, `tests/`, `tools/` ni aucun contrat ne change.
- **Le journal** : avec cette passe, les passes gardées auraient dépassé 60 Ko. PU1 et PU2 (leur branche fusionnée) sont archivées mot pour mot dans `journal/57-passes-PU1-PU2.md`, avec leur ligne d'index (preuve ci-dessous).

### Preuves
- `npm run typecheck`, `npm test`, `npm run build`, `npm run art:validate` sur le commit de cette passe (seuls des documents changent).
- Le déplacement : le corps de `journal/57-passes-PU1-PU2.md` est identique aux 20 493 octets retirés ; PU1 et PU2 n'existent chacune que dans ce fichier ; aucune fin de ligne seule (CRLF gardé). Passes gardées : 42,9 Ko.

### Où reprendre
- **L1, la lecture**, dans sa propre séance (EV-15), derrière `flags.v2`, avec ses preuves ; puis L2.

### Pensée
- Une note de fiche qui ajoute un système (des combattants génériques) se fait situer avant de devenir un lot : la même phrase pouvait ajouter un jour au calendrier ou des gens à la ville, et seule la réponse de l'opérateur le dit.
- Une question de l'opérateur écrite sur une fiche (« comment cela fonctionne ? ») reçoit sa réponse lue dans le code, au journal comme dans la conversation ; elle dit souvent ce que le joueur ne sait pas non plus.

## Passe EVL1 — Étape 5, lot L1 : la lecture de la version 2, les six défauts corrigés (2026-11-05)

### Demande
- Transmise par la séance mère : construire le lot L1 de l'étape 5, le choix EV-1 de l'opérateur « Les corriger en premier (lot L1) » (Passe EV2). Il s'agit des six défauts de lecture relevés en jouant la version 2 (Passe EV1, `briefs/audit-gameplay-ev1.md` § 4). Aucune règle ne change, tout reste derrière `flags.v2` et le jeu par défaut reste identique (V2-17 « Pas encore »). Là où un défaut touche aussi le jeu par défaut (le journal, la liste Q), il n'est corrigé que dans une partie v2, et l'écart est consigné.
- La consigne de l'opérateur pour chaque lot : l'importance narrative et la cohérence du gameplay, sans « se perdre dans la structure du jeu ».

### Fait — [OK], derrière la version 2
1. **Les nouvelles des places.**
   - `src/ui/news.ts` (nouveau) garde dans le navigateur ce que le joueur a vu du journal du jeu (`seenBefore`, `markSeen`, avec la clé du quai depuis la Passe L4). Les trois places (`playPlaza.ts`) en partent au lieu de la dernière entrée, puis l'écrivent à leur tour. `playTown.ts` appelle les mêmes fonctions, avec le même comportement.
   - Une page v2 (les places et le quai) compte aussi comme vu ce qu'une action montre sans recharger la page (`keepSeen`). Sans cela, chaque marche vers une place aurait redit dans « Meanwhile » l'achat qui venait d'être lu.
   - Une cinématique de place attend que les nouvelles soient lues (`TownUi.newsRead`), sinon elle cachait leur bande.
2. **Les nouvelles d'une action, dans la bande où elle est prise** (`townUi.ts`, `run`).
   - Dans une partie v2, quand la liste Q ou un dialogue est ouvert, les nouvelles se rangent sous le nom du lieu ou sous les paroles de la personne, en ambre (`.pm-dlg .who .news`), là où le joueur lit. Elles partent à la bande suivante.
   - Le bandeau du haut reste caché sous une bande (règle commune aux deux jeux). Le jeu par défaut garde ce bandeau.
   - Effet voulu : la nouvelle d'une première parole (la présentation d'Orla) se lit désormais dans son dialogue.
3. **« free » seulement quand rien n'est dépensé.**
   - `ActionDef.later` désigne un créneau réservé maintenant et pris plus tard. Il apparaît dans `ActionOption.later`, seulement sur les actions qui en réservent un.
   - Le défi porte `later: () => 1`. Son `cost` reste 0 : la règle ne bouge pas et le créneau est toujours pris au `challengeResult`. `costTag` compte ce créneau, et le défi dit désormais « 1 slot ».
   - Son libellé ne répète plus le créneau : « Challenge {name} to a bout on the sand (won, a skill) » (règle P2, le prix dit une fois).
4. **Les causes du journal en mots** (`journal.ts`, `whyOf`, partie v2).
   - Une cause écrite en phrase reste telle quelle.
   - Un code se dit en mots : `action:steal` devient « your hand in a stall », `action:checkGear` « Hilde's look at your gear », `match:<id>` « your bout against <nom> », `challenge:<qui>` « your challenge to <nom> », les autres actions « what you did ». Les autres codes (`quest:`, `tournament:`…) ne s'affichent pas.
5. **La fiche de match juste sur l'observation** (`foeIntel` ; `SCOUTED` dans `roles.ts`, liste désormais partagée par l'action `scout` et par la fiche).
   - « scouting would tell you more » ne s'affiche plus que pour Vessa et Marek.
   - Pour les autres : « You have never watched {name} train: the bout will show you the skills. ». Ce texte reste juste tant que L3 (EV-11) n'étend pas l'observation, et la fiche suivra d'elle-même la liste.
6. **Le vol réussi** dit désormais « Nobody sees your hand: {item} is yours, and {name} has noticed nothing. » : il ne promet plus de soir. Le vol découvert le lendemain revient à L2 (EV-2).
- **Outils** : `tools/play-day.mjs` `V2=1` joue ses pas par l'interface de la page (`__ui.run`, comme un joueur) et vérifie :
  - un vol pris dans la liste Q, dit dans sa bande, puis la liste rouverte sans l'ancienne nouvelle ;
  - les nouvelles d'une place après un créneau fini sur elle, et aucune après une marche ;
  - le défi d'Orla étiqueté « 1 slot » ;
  - les causes du journal en mots.
- **`AGENTS.md`** : le test, `play-day` (sa suite de description, glissée sous `pad-proof`, remise en place).

### Écarts consignés — le jeu par défaut, inchangé exprès
- Son journal écrit encore « Why: action:repair », « action:report », « action:confront », et « match:r… » sous une blessure (contraire à UM-R3).
- Les nouvelles d'une action prise dans une bande (dénoncer, confronter, une action de la liste Q) y restent cachées sous `body.pm-talking`.
- Son quai redit au créneau suivant ce que le bandeau a déjà montré : « vu » y vaut ce qui était au journal à l'ouverture de la page.
- Ces trois points se corrigent quand la version 2 deviendra le défaut, ou sur une décision de l'opérateur. La place du parvis et Lantern Row de la tranche (`playForecourt`, `playLanterns`) ne sont pas touchées.

### Tests — [OK]
- **`tests/v2-reading.test.mjs`** (neuf tests ; les oracles ne passent pas par le code testé) :
  - le créneau est lu sur les états : jour et créneau avant et après, avec le résultat du défi appliqué, gagné et perdu ;
  - les rivaux observables sont lus sur les actions offertes au fil d'une partie ;
  - les causes sont lues sur les entrées de douze parties v2 du laboratoire et d'un voleur pris ;
  - « Wait » sur quatre places, avec le défaut reproduit par l'oracle (depuis la dernière entrée, rien ne s'affiche) ;
  - le parcours marchandage, puis créneau, puis marche, avec un stockage en mémoire ;
  - le câblage des places, du quai, de la bande et de la scène ;
  - le texte du vol, et rien ne suit le vol le soir et la nuit.
- **Onze fautes injectées une à une, toutes attrapées** :
  - la place repart de la dernière entrée ;
  - `keepSeen` marque aussi au rechargement ;
  - `costTag` ignore le créneau réservé ;
  - `whyOf` rend le code ;
  - la fiche dit « scouting » pour tous ;
  - le vol promet encore le soir ;
  - les nouvelles en bande aussi dans le jeu par défaut ;
  - le quai v2 sans `keepSeen` ;
  - `whyOf` traduit aussi dans le jeu par défaut ;
  - la scène n'attend plus les nouvelles ;
  - la carte du duel hors de `newsRead`.

### Preuves — [OK]
- Serveurs par `preview_start` : la branche en DEV `:5241` ; `main` figé (`git archive` de `fda36f6`) en DEV `:5242` ; les deux paquets de production par `vite preview` `:5243` et `:5244`.
- **Le jeu par défaut, inchangé** :
  - `detshots` à 0 px contre `main` figé sur sept vues : la ville de nuit et à midi ; le mode jouable par défaut à l'ouverture, avec la liste Q, le dialogue de Mara, le journal et le tableau. Le témoin de répétition est à 0 px.
  - La ville d'une partie v2 est elle aussi à 0 px (l'ouverture, la liste Q, Mara, le journal). **Contrôle négatif** : la même liste après un vol diffère, 3 752 px dans la seule ligne de nouvelles.
  - `title-proof` : trois paires à 0 px. Contrôle négatif (`BASE_QUERY=`, la nuit de `main`) : 99,7 % de différence.
  - `play-flow` : par défaut `0025acce7a403773`, et `V2=1` `cf669f2d59e33a8d`, les empreintes des Passes CH1 et MN2.
  - `play-day` par défaut : tous les contrôles passent, avec la même empreinte `6a942086a2616ab2` sur la branche et sur `main` figé.
  - TournamentLab : règles classiques, dynamiques et v2, 50 graines, `idle` et `diligent`, plus les trois scripts : le rapport (`labReport`, ce que `--json` écrit) et l'empreinte de chaque partie sont identiques au JSON près.
  - Les paquets de production découpent les mêmes morceaux que `main`.
  - Sur ces paquets (`vite build` de la branche et de `main` figé), les mêmes douze vues donnent le même résultat qu'en DEV : 0 px partout sauf la ligne de nouvelles du vol (3 752 px), témoin à 0 px.
- **La version 2** :
  - `play-day` `V2=1` (graines 1842, 7719, 30417 et 5) : tous les contrôles passent. Le vol est réussi avec 1842 et pris avec les trois autres, et le journal dit alors « Why: your hand in a stall ». Les nouvelles de l'entraînement après l'entraînement avec Orla s'affichent (« Meanwhile in the Cité »), et Node rejoue avec la même empreinte.
  - Une place avec nouvelles et cinématique (`v2-forecourt-midday`, `cutscene=1`, la clé « vu » remise en arrière) : la bande des hérauts paraît, la scène attend 2,5 s sans partir, puis part à Entrée. Sur `main` figé, la même page n'a pas de bande et la scène part tout de suite : le défaut 1 reproduit.
  - `ui-text` : 12 pages sur 12. Ce sont la liste après un vol réussi et après un vol pris, le dialogue d'Orla, le journal avec sa cause, et la fiche de match contre Vessa et contre Orla (jour 4), chacune à 1 600 × 900 et 390 × 844. Le plus petit texte fait 16 px sur ordinateur et 14 px au téléphone.
  - `ui-contrast` (deux moments) : 10 pages sur 10 au-dessus de 4,5:1. Les lignes de nouvelles en ambre sont à 7,9-8,3:1.
  - `pad-proof` : tous les contrôles passent (59).
- `npm run typecheck`, `npm test` 430 sur 430, `npm run build`, `npm run art:validate`.

### Ce qui revient à L2 (voler, défier, marchander)
- **Le vol découvert** (EV-2 « Un soupçon qui dure, une sortie par la restitution », avec la note de l'opérateur sur une représaille réelle). Le texte du vol réussi ne promet plus rien : c'est L2 qui écrit la découverte du lendemain et son texte, à rattacher à un personnage, un lieu et un moment du calendrier.
- **La réputation et le soupçon expliqués dans le jeu** (Passe EV2) : deux nombres distincts, ce que chacun ouvre et ferme.
- **Le défi** : pleine vie, une mise, une fois par phase (EV-3), dans l'arène aux gradins vides (EV-5). Le Colisée plein du défi, défaut 5 du § 4 de l'audit, revient à L2, pas à L1. Si L2 ajoute une mise, `coins` s'ajoute à `later` dans la même étiquette.
- **Pour L3** : l'observation étendue (EV-11) passe par `SCOUTED` (ou ce qui la remplacera), que la fiche de match lit déjà.

### Limites
- La bande des nouvelles d'une place n'a été mesurée par `ui-text` qu'à travers les autres bandes du même composant (`overlay`, inchangé) ; la bande d'arrivée elle-même a été vue sur les captures de `play-day`.
- Personne n'a joué une cinématique de place avec nouvelles au clavier jusqu'au bout. Le contrôle s'arrête à la première ligne de la scène.

### Pensée
- Une page qui reprend ses nouvelles là où le joueur les a laissées compte aussi ce qu'elle a montré en route ; sinon chaque déplacement redit ce que le joueur vient de lire.
- Un prix payé plus tard reste un prix. L'interface le lit dans le cœur, par un champ d'affichage, sans changer la règle qui le prend.
- Ce qui s'ouvre par-dessus une bande la cache : une scène attend la lecture de ce qui l'a précédée.

