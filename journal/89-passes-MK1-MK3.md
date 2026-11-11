# Journal de bord — archive : passes MK1, MK2, MK3 (2026-11-11)

> Déplacée mot pour mot de `JOURNAL.md` le 2026-11-11 (Passe AL1) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe MK1 — La bulle « … », les PNJ utiles et la mini-carte : l'inventaire, les maquettes rendues dans le jeu et la fiche publiée ; rien d'appliqué (2026-11-11)

### Demande
- L'opérateur, le 2026-11-11, mot pour mot (transmis par la séance qui a ouvert celle-ci, avec deux captures de la marchande de l'étal du quai, de jour) : « actuellement la commercante est seule a avoir son icon dialogue et cela ressemble a une defaut de conception, je pense il faudra l'enlever ou adapter. car il va falloir pourvoir mettre en avant de maniere subtile les pnjs avec lesquels l'interaction peut etre utile car ils ont un objet ou un evenement a proposer, peut etre meme integrer aussi une mini map sur le coin ».
- Brief : inventorier la bulle et les PNJ utiles, une fiche d'arbitrages avec maquettes rendues dans le jeu (la mini-carte comme décision de l'opérateur, UM-R5), attendre, appliquer dans le jeu par défaut en deux langues, prouver, fusionner. Ne pas toucher aux cycles de marche ni à `src/characters/` (une autre séance corrige la marche en diagonale). Branche `claude/marques-pnj`, worktree `.claude/worktrees/marques-pnj` (le dossier principal reste sur `claude/duel-calibration`, déjà fusionnée, partagé par d'autres séances), tirée de `main` `eab6d50` ; `node_modules` en jonction vers celui du dossier principal ; serveur DEV `mpn-dev` (`:5401`, son propre cache de dépendances, hors dépôt).

### La bulle — [OK] trouvée
- Le générateur du quartier donne deux rôles « qui parlent » : la marchande de l'étal (`merchant-talk`) et le premier garde de la barrière est (`guard-talk-idle`, `src/props/MarketGenerator.ts`) ; `ActorSystem.spawnNpc` leur pose la bulle `dots` en permanence, `SpriteRenderer` la dessine (une cellule générée de l'atlas, `makeBubble`). Elle date du quartier libre (Passe 4A), avant le mode jouable.
- Où : le quai seulement, de jour comme de nuit, dans toute partie (le jeu par défaut et `v2=0`) et dans Explore ; Mara à son étal, Hale à la barrière (rarement dans le cadre). Les trois places n'en ont aucune (`PlazaApp` ne pose pas de bulle).
- **[KO] un défaut de plus** : `interact()` met `talkTimer` à 2,5 s et la mise à jour donne `bubble = 'dots'` (et l'animation `talk`) à la cible ; rien ne les retire ensuite : toute personne non figurante à qui l'on appuie [E] (le porteur, Wynn, le forgeron, l'inconnu) garde la bulle jusqu'au rechargement de la page. Lu dans le code (seules quatre affectations de `bubble`) ; [?] pas reproduit dans le navigateur (l'essai par script n'a pas trouvé de cible : la position posée du héros n'était pas prise par la boucle).

### Les PNJ utiles — [OK] mesurés
- Classés d'après l'état du jeu, comme le dialogue les lit : les actions qu'une personne offre (`offeredBy`) et que le jeu accepte maintenant, et ce que lui parler change à lui seul (`onTalk` : Lady Edda témoin de la sangle, frère Ambrose témoin du conte, la cargaison de Tam, Orla présentée). Trois sortes proposées : objet (marchandises, forge, compétences, soins, travaux payés, revente), événement (défi de la phase, entraînement avec Orla, bonnes actions et cortèges du festival, rumeur du jour, garde payée), suite (rapport, restitution, réponses à Vessa et à Rhosk, gros bras de Corra, forge à réparer, les témoins). L'observation des rivaux (`scout`, ouverte toute la journée) jamais marquée ; la foule des passants non plus.
- Script hors dépôt (le chargeur de `tests/load.mjs`, les politiques du laboratoire) : 20 parties v2, graines 1 à 20, à chaque créneau réel, dans chaque lieu, les personnes visibles (un sprite sur la page) et celles qui auraient une marque. Joueur « curieux » (600 créneaux) :

| Lieu, moment | Visibles | Tout ce qui est possible | Ce qui est neuf | Événements et suites |
|---|---|---|---|---|
| Quai, matin / après-midi / soir | 7 / 7 / 7 | 3,4 / 2,7 / 2,3 | 1,4 / 0,3 / 2,2 | 1,9 / 1,5 / 1,6 |
| Parvis | 6 / 6 / 1 | 3,7 / 2,7 / 0,1 | 1,9 / 1,6 / 0,1 | 1,7 / 1,5 / 0 |
| Lices | 4 / 4 / 0 | 2,9 / 1,8 / 0 | 2,0 / 0,5 / 0 | 1,6 / 1,3 / 0 |
| Place de la Halle | 1 / 3,9 / 4,9 | 1,0 / 1,8 / 3,3 | 0,9 / 1,4 / 3,1 | 0,1 / 0,1 / 1,0 |

- « Ce qui est neuf » suppose que le joueur a ouvert le dialogue de chaque personne du lieu où il se tient (le moins de marques possible). Le « planificateur » donne des nombres proches. Par personne : Mara a quelque chose 86 % des matins, Hilde, Corvin, Pip et Sela presque toujours (leur boutique) ; les rivaux un défi par phase ; Lio sa rumeur chaque jour et son travail le soir ; l'inconnu sa rumeur la nuit ; Hale une suite dès qu'un vol est connu.
- [KO de méthode, corrigé] un premier compte marquait comme « vu » tout ce qui était offert dans les quatre lieux à chaque créneau (zéro nouveauté l'après-midi) ; refait en ne comptant comme vu que le lieu où le joueur se tient. Une suite de conversation clée par le jour revenait chaque jour : clée une fois pour toutes.

### Les maquettes — rendues dans le jeu par défaut (DEV, à retirer après la décision)
- `src/simulation/v2marks.ts` (pur) : `marksOf` (qui est là et ce qu'il offre, la sorte la plus forte d'abord), `offerKey` (ce qui rend une offre la même : le jour d'un travail, la phase d'un défi), `freshMark`.
- `src/ui/npcMarks.ts` : une marque au-dessus de la tête, en DOM sur le canevas, sur le voile des étiquettes de sortie et dans l'accent ; trois styles derrière `npcmark=` (DEV) : `losange` (vide = objet, plein = événement, vide autour d'un plein = suite), `mot` (le mot de près), `sol` (un liseré d'un pixel aux pieds). Pour les maquettes, la bulle du quai est retirée quand `npcmark` est donné.
- `src/ui/minimap.ts` : un petit plan 2D sans cadre, traits d'un pixel en ivoire qui s'effacent au bord sur un voile, l'accent pour les PNJ marqués (la forme de leur marque) et les sorties, le héros en ivoire au centre, tourné comme la caméra ; `minimap=tr|bl` (DEV), 168 px, 104 px au téléphone. Le quai depuis `walk` et `colliders`, les places depuis `walk`, `lanes`, `blockers`, `exits` de `Plazas.ts`.
- Textes neufs (`v2.mark.*`, `v2.map.title`) en anglais et en français. Câblés dans `playTown.ts` et `playPlaza.ts`, partie v2 seulement et `import.meta.env.DEV` : rien ne change sans paramètre.
- Captures (`tools/play-shots.mjs`, 1920 × 1080 et 812 × 375) : le quai le premier matin (les trois styles), le parvis et les lices le matin, la place de la Halle le soir, le quai la nuit (`v2-wanted-night`), le téléphone ; la mini-carte en haut à droite et en bas à gauche. Regardées : le losange se lit de jour comme de nuit ; au téléphone il est un peu gros (à réduire d'un tiers) ; la mini-carte du quai est une bande étroite en diagonale (le quai tourné comme la caméra).
- **Coût mesuré** (Radeon 780M, Chrome, `tools/eval.mjs`, neuf séries) : dessin du plan 0,021 à 0,029 ms en médiane (une image sur trois), les marques 0,008 à 0,010 ms par image pour huit personnes ; le calcul des marques à chaque action seulement. [?] La composition du navigateur (un petit canevas, des éléments DOM) non mesurée : à faire GPU saturé (`tools/cadence.mjs`, `fps=off`) à l'application.

### La fiche MK1 — publiée, rien de décidé
- https://claude.ai/artifact/5zanTkRhq2WoHbC384bt1C (`briefs/fiche-mk1.html`, le gabarit des fiches DB, quinze images), collection `decisions` relue vide après publication ; vérifiée dans Chrome sans tête (onze cartes, 32 options, aucune erreur, aucun débordement à 375 px).
- Onze cartes en cinq familles : **MK-1** la bulle (recommandé : la retirer du jeu par défaut, Explore garde sa courte réaction à [E] corrigée, `v2=0` inchangé) ; **MK-2** la forme (le losange) ; **MK-3** les trois sortes (trois formes du losange, la sorte dite dans l'invite de près) ; **MK-4** le déclencheur (ce qui est neuf depuis la dernière conversation) ; **MK-5** après l'interaction (part à l'ouverture du dialogue, revient avec une nouveauté ; le « vu » gardé avec la partie hors de l'empreinte) ; **MK-6** les exclus (ni l'observation des rivaux ni la foule) ; **MK-7** la mini-carte (oui, en haut à droite, remplace UM-R5) ; **MK-8** son contenu (héros, sorties, PNJ marqués, les autres en point pâle, tournée comme la caméra) ; **MK-9** le téléphone (104 px) ; **MK-10** les lieux (les quatre d'une partie, Explore sans marque ni carte) ; **MK-11** la lecture (la marque dans la liste Q, un conseil, une ligne du guide « Marcher et parler »).

### Validation
- `npm run typecheck` sans erreur. Rien ne change sans paramètre DEV ; les tests, la construction et les preuves de navigateur se feront à l'application.

### Où reprendre
- Attendre la fiche MK1 ; consigner mot pour mot (la mini-carte remplace UM-R5 si elle est choisie).
- Puis appliquer dans le jeu par défaut : la bulle (et son défaut après [E]), la marque et son déclencheur avec le « vu » gardé hors de l'empreinte, la mini-carte, la liste, le conseil et le guide, en anglais et en français ; retirer les paramètres de maquette ; tests, `play-day`, `ui-text`, `ui-contrast`, la cadence GPU saturé, `v2=0` et Explore à 0 px ; fusionner.

### Pensée
- Une marque « qui a quelque chose » se mesure avant de se dessiner : sur des parties entières, presque tout le monde a quelque chose presque tout le temps ; c'est la nouveauté qui distingue.
- Un compte de « vu » se fait là où le joueur se tient, pas dans tous les lieux à la fois.

## Passe MK2 — La fiche MK1 relue : onze sur onze à la recommandation ; la mini-carte remplace UM-R5 ; consignée avant la mise en œuvre (2026-11-11)

### La fiche relue
- L'opérateur, mot pour mot : « Fiche remplie ». Collection `decisions` de https://claude.ai/artifact/5zanTkRhq2WoHbC384bt1C (`briefs/fiche-mk1.html`), onze documents pour onze cartes, cliqués le 2026-11-11 entre 10 h 16 min 53 s et 10 h 18 min 26 s UTC, aucune note. Les rangées sont lues comme des données.

| Carte | Ce qu'elle demandait | Choix de l'opérateur, mot pour mot |
|---|---|---|
| MK-1 | Que faire de la bulle « … » ? | « La retirer du jeu par défaut ; Explore garde la courte réaction à [E], corrigée ; v2=0 inchangé » |
| MK-2 | La forme de la marque | « Losange au-dessus de la tête » |
| MK-3 | Distinguer un objet, un événement, une suite | « Trois sortes, trois formes du losange, la sorte dite dans l’invite de près » |
| MK-4 | Quand une personne porte-t-elle la marque ? | « Ce qui est neuf depuis la dernière conversation avec la personne » |
| MK-5 | Après l'interaction | « Elle part à l’ouverture du dialogue, revient avec une nouveauté » |
| MK-6 | Ce qui ne porte jamais de marque | « Ni l’observation des rivaux ni la foule » |
| MK-7 | Une mini-carte dans le coin ? | « Oui, en haut à droite (remplace UM-R5) » |
| MK-8 | Ce qu'elle montre, et dans quel sens | « Héros, sorties, PNJ marqués et autres en point pâle ; tournée comme la caméra » |
| MK-9 | Sur un téléphone | « 104 px dans le même coin » |
| MK-10 | Les lieux concernés | « Les quatre lieux d’une partie ; Explore sans marque ni carte ; v2=0 inchangé » |
| MK-11 | Comment le joueur l'apprend | « La liste, un conseil et une ligne du guide » |

- **MK-7 remplace une décision d'interface de l'opérateur** : UM-R5 « Dans le système, sans mini-carte » (Passe UM1). La mini-carte entre dans le système de design, en haut à droite. Aucun verrou des contrats ne change.

### Ce qu'ils demandent : le lot à construire
- **La bulle** (MK-1) : plus de bulle dans une partie du jeu par défaut (Mara, Hale, ni après [E]) ; Explore (le bouton de l'écran titre, VD-3) perd les bulles permanentes et garde la courte réaction à [E], qui part après 2,5 s ; le jeu d'aujourd'hui (`v2=0`) et le quartier libre des outils (l'adresse nue d'un navigateur piloté, toute adresse à paramètres) inchangés. Le code de `src/characters/` n'est pas touché (une autre séance y travaille) : la bulle se règle depuis les pages.
- **La marque** (MK-2, MK-3, MK-6) : un losange au-dessus de la tête, dans l'accent, sur le voile des étiquettes ; vide pour un objet, plein pour un événement, vide autour d'un plein pour une suite ; de près l'invite dit la sorte ; ni l'observation des rivaux ni la foule ; au téléphone, un tiers plus petit.
- **Le déclencheur** (MK-4, MK-5) : seulement ce qui est neuf depuis la dernière ouverture du dialogue de la personne ; ce que le joueur a vu se garde avec la partie, hors de l'empreinte (une clé « $ ») ; une offre revient neuve quand elle change (le travail le lendemain, le défi à la phase suivante, la rumeur chaque jour, une pièce nouvelle).
- **La mini-carte** (MK-7 à MK-9) : en haut à droite sous les pièces et la réputation, 168 px, 104 px au téléphone ; le héros, les sorties, les PNJ marqués (la forme de leur marque) et les autres en point pâle ; tournée comme la caméra ; cachée pendant les pages, les dialogues et les scènes.
- **Les lieux** (MK-10) : le quai et les trois places d'une partie du jeu par défaut ; Explore sans marque ni carte ; `v2=0` inchangé.
- **La lecture** (MK-11) : la marque dans la liste (Q) à côté du nom ; un conseil la première fois qu'une marque paraît ; une ligne dans le chapitre « Marcher et parler » du guide ; en anglais et en français.
- Les paramètres de maquette (`npcmark=`, `minimap=`, les styles « mot » et « sol », le coin bas à gauche) sont retirés (VD-8).

## Passe MK3 — La fiche MK1 appliquée dans le jeu par défaut : plus de bulle, le losange de ce qui est neuf, la mini-carte en haut à droite (2026-11-11)

### Demande
- Appliquer les onze choix consignés en Passe MK2 dans le jeu par défaut, en anglais et en français, prouver, fusionner, puis l'essai de l'opérateur. Branche `claude/marques-pnj` ; `src/characters/` non touché (la séance de la marche en diagonale y travaillait).

### Ce qui est construit — [OK]
- **La bulle** (MK-1) : une partie v2 n'en a plus (`playTown.ts` retire celles de Mara et de Hale au chargement et ne passe plus par la minuterie de conversation du quartier, qui donnait la bulle à qui l'on parlait sans jamais la retirer) ; la ville derrière l'écran titre et Explore n'ont plus de bulle permanente et gardent la courte réaction à [E], qui part avec sa minuterie, la pose de parole rendue (`src/ui/bubbles.ts`, appelé par `main.ts` sur le seul chemin de l'écran titre) ; le jeu d'aujourd'hui (`v2=0`) et le quartier libre des outils inchangés.
- **Le pur** : `src/simulation/v2offers.ts` (la table des trois sortes, chaque action rangée une fois ; `offerKey` : le jour d'une offre quotidienne, la phase d'un défi, le reste par ce qu'il nomme ; `seeOffers`, `seenOf`) et `src/simulation/v2marks.ts` (`offersHere`, `freshMark`, `peopleMarks`, une fois par état). L'action `talk` d'une partie v2 garde, à l'ouverture du dialogue, les clés de tout ce que la personne offre alors (`V2State.$seen`, une clé « $ » : dans la sauvegarde, hors de l'empreinte) ; l'observation des rivaux et la foule ne sont jamais marquées (MK-6).
- **La marque** (MK-2, MK-3) : `src/ui/npcMarks.ts`, le losange dans l'accent sur le voile des étiquettes, vide / plein / vide autour d'un plein, un tiers plus petit au téléphone, caché pendant une page, un dialogue ou une scène ; l'invite de près dit la sorte (« Talk to Mara, the merchant · Item » / « Parler à Mara, la marchande · Objet », `ui.talkToMark`), réécrite quand la marque change.
- **La mini-carte** (MK-7 à MK-9) : `src/ui/minimap.ts`, en haut à droite sous les chiffres, 168 px, 104 px au téléphone ; le quai depuis `walk` et `colliders`, les places depuis `walk`, `lanes`, `blockers`, `exits` ; `src/ui/peopleLayer.ts` réunit les marques et le plan pour les deux pages.
- **La lecture** (MK-11) : le losange à côté du nom dans la liste (Q) ; le conseil `npcMark` (« Someone has something new » / « Quelqu’un a du nouveau »), la première fois qu'une marque paraît, une fois l'accueil de la page fini ; une ligne du chapitre « Marcher et parler » (`tut.ch.moving.marks`).
- Les paramètres de maquette (`npcmark=`, `minimap=`, les styles « mot » et « sol », le coin bas à gauche) sont retirés.

### Tests — [OK]
- `tests/v2-marks.test.mjs` (neuf, neuf tests ; oracles écrits d'après les décisions) : Mara marquée « objet » le premier matin, son travail clé par le jour ; Lio le soir, événement plutôt qu'objet ; l'observation des rivaux jamais marquée sur trois parties entières (le cas atteint) ; la marque partie à l'ouverture du dialogue et revenue le lendemain avec le travail du jour ; le « vu » hors de l'empreinte et gardé par la sauvegarde ; les clés d'offre ; Lady Edda, témoin de la sangle, une suite qui part une fois entendue ; aucune marque dans le jeu d'aujourd'hui ; les bulles d'Explore. Fautes injectées une à une : le « vu » non gardé (trois tests échouent), les offres quotidiennes sans leur jour (trois), l'observation classée « événement » (un). Deux fautes sans effet observable (retirer `scout` de la liste des exclus quand la table ne le range pas ; la foule, qui n'offre rien sur trois parties) : des gardes, pas des fautes.
- `tests/texts.test.mjs` a refusé une clé jamais demandée (`v2.map.title`, retirée) ; `tests/town-roles.test.mjs` épingle la ligne `if (behindTitle) behindTitle(hud); else hud();` suivie de `app.start();` : l'appel des bulles placé avant elle.
- `npm run typecheck` sans erreur ; `npm test` **603 / 603** ; `npm run build` ; `npm run art:validate` (73 manifestes, 123 sources, 23 du son, 0 erreur).
- Rejouée sur `main` `6eb30f6` (Passe MD1, la marche en diagonale, d'une autre séance, qui avait archivé ECO1 et TF1 : l'archive de MK1, identique en ses octets archivés, laissée à la sienne) dans `claude/marques-pnj-2`, sans réécrire `claude/marques-pnj` déjà poussée ; le journal recomposé par script. Les passes gardées dépassaient alors 60 Ko : ECO2 et ECO3 (branches fusionnées) déplacées d'un bloc, à l'octet, dans `journal/86-passes-ECO2-ECO3.md`, leur ligne ajoutée à l'index ; preuve par script : le corps de l'archive égale les octets retirés, chaque passe dans un seul fichier, CRLF partout.

### Preuves dans le navigateur (serveur DEV `mpn-dev`, :5401 ; `main` figé `eab6d50` sur `mpn-main`, :5402) — [OK]
- Captures (`play-shots`) : le quai le premier matin sans bulle, Mara, Bram et Tam marqués, la mini-carte ; l'invite près de Mara en anglais et en français ; la liste (Q) avec les losanges ; la marque de Mara partie après son dialogue, celles de Bram et Tam restées (lu aussi dans la page : `__people.marks.state()`, le `$seen` de Mara) ; la place de la Halle le soir et au téléphone, le parvis.
- **`tools/ui-text.mjs`** : l'invite, la liste, le conseil et le guide, en anglais et en français, 1920 × 1080, 1280 × 720 et 812 × 375 : **30 / 30**. [KO de méthode, corrigé] le conseil n'était mesuré qu'à la première taille (vu une fois, il ne revient pas dans le même navigateur) : forcé à chaque taille après avoir vidé le stockage.
- **`tools/ui-contrast.mjs`** (les mêmes pages et l'invite sur la place de la Halle la nuit) : chaque texte neuf au-dessus de 4,5:1 (l'invite 5,2:1 au plus bas, le conseil 6,95:1, le guide 7,6:1) ; échouent, sans lien avec ce lot : l'étiquette de sortie « Vers la place de la Halle » en fondu selon la distance (1,3:1, `exits.ts` inchangé) et « coins » / « pièces » au téléphone (4,24 à 4,44:1, relevé depuis la Passe TU3).
- `tools/play-day.mjs` : **tout passe**, Node rejoue `75272cc6a835113b` comme le navigateur (la même empreinte qu'avant : le « vu » est hors de l'empreinte).
- `tools/tutorial-proof.mjs` : **tout passe** (64 vérifications) ; `tools/default-proof.mjs` : **tout passe** (40), Explore compris. Les deux outils voient maintenant le conseil des marques après la visite (Mara marquée) et le ferment : [KO → corrigé] sans cela, H puis le menu de la manette tombaient sur le conseil.
- `tools/title-proof.mjs` : **tout passe** ; Explore égale `main` figé **sans ses bulles** à 0 px (seuil 0, avec et sans H), et diffère de `main` avec ses bulles (8 078 px : le contrôle) ; l'adresse des outils (`?time=midday&herolook=1…`) égale `main` à 0 px, bulles comprises. L'outil capture désormais la base aussi sans ses bulles (`-quiet.png`). [KO antérieur, corrigé] il attendait les boutons de l'écran titre sans « Settings » (ajouté en Passe RG3).
- Le jeu d'aujourd'hui : `tools/detshots.mjs` sur `play=1&state=day1-morning` (`v2=0`, la bulle de Mara comprise) : **0 px** contre `main` figé, témoin de répétition 0 px.
- **Coût** : JS (Passe MK1) 0,02 à 0,03 ms par dessin du plan, 0,01 ms par image pour huit marques ; la composition, GPU saturé (`tools/cadence.mjs`, `fps=off`, 1920 × 1080, trois tours entrelacés contre `main` figé) : 76 / 67 / 85 images/s pour `main`, 67 / 67 / 94 pour la branche, des écarts dans le bruit d'un tour à l'autre (sans témoin de contention).

### Où reprendre
- L'essai en jeu de l'opérateur : la marque (lisibilité de jour, dans la foule de midi, en mouvement), le déclencheur et son retour, la mini-carte (le quai, étroit, s'y lit en bande diagonale), le conseil.
- Relevés : l'étiquette de sortie compte au contraste pendant son fondu de distance (l'outil la mesure à mi-opacité) ; « coins » / « pièces » au téléphone toujours sous 4,5:1.

### Pensée
- Une marque se règle par ce qui est neuf, et ce qui est neuf se garde avec la partie mais hors de l'empreinte : la simulation reste la même, le joueur voit ce qu'il n'a pas encore lu.
- Retirer un élément d'un parcours change les outils qui le comparent : la preuve « Explore = main » devient « Explore = main sans bulle », et la base avec bulle sert de contrôle.
- Un code qu'une autre séance travaille (`src/characters/`) se contourne depuis les pages : la règle tient sans toucher son fichier.

