# Journal de bord — archive : passes VP1 et VP2 de la séance cloud « Version 2 » (2026-10-26 → 2026-10-27)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-10-27 (Passe VP6) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe VP1 — Les décors des places de la version 2 contre le Merchant District : audit, reprise, visibilité (2026-10-26)

### Demande
- L'opérateur, mot pour mot : « je vais te demander une nouvelle passe d'optimisation concernant la génération de décors/environnement par code
  pour nos nouveaux districts afin qui atteigne un niveau aussi optimale que merchant district. ( le but est de determiner si le decors
  artistique tient bien la route de maniere coherente ) C'est une passe que tu peux prendre le temps de faire de manière autonome. Avant que
  nous repassons en local. Refais aussi une revue sur la cohérence gameplay général hors combat et donc les événements dynamiques. » (la
  revue du gameplay : Passe VP2).

### Les outils (commits `8c01978`, `773b646`)
- `tools/plaza-shots.mjs <outDir> "<état nommé>" "<requête>" "nom|x,z[|js]" ...` : captures déterministes d'une place (le héros posé en x, z par
  `PlazaApp.posePlayer`, la caméra posée d'un coup, `Math.random` semé, la boucle jamais lancée), `?static=1` sur les places (sans personnages ni
  particules : le décor seul), le rapport `__stats()` imprimé ; les états nommés de chaque place à chaque moment (`v2-forecourt-midday`,
  `v2-forecourt-night`, `v2-training-midday`, `v2-training-night`, `v2-square-morning`, en plus de ceux de la Passe V5).

### L'audit — [KO] du premier jet (V5)
- Critique à l'aveugle (agent neuf, étiquettes tirées au sort, la vue B du district comme référence, 10 captures) : cohérence avec le district
  **parvis 3 / 10** (qualité 3), **entraînement 4** (3,5), **place festive 5** (4,5). Causes relevées : le cadrage (trop haut et trop loin : la place
  vue d'avion, les façades en bande au fond), l'habillage (pas de pavois de jour, des primitives nues, des auvents pastel), la lumière (la nuit
  à une luminance moyenne de 27 à 37 contre 52 à 59 pour le district B : des places noires, sans le rythme des lampes), des maisons au bois plus
  serré et aux fenêtres plus allumées que celles du district.

### La reprise (`src/world/Plazas.ts`, `src/world/PlazaApp.ts`) — dans la langue du district
- **Les façades** : les nombres du district (`COMMON` : asymétrie 0,42, part de bois 0,32, toits 0,95 ; fenêtres allumées 0,46), un second
  rang derrière chaque côté dont l'étage passe au-dessus du faîte du premier, des rangs latéraux ; chaque mur par étage et chaque toit est une
  pièce de visibilité.
- **Les points focaux** : le parvis a la façade courbe à arcades du Colisée et sa porte au nord (le tambour du Colisée vu de loin depuis les
  deux autres places), la fontaine au centre ; le terrain d'entraînement trois cercles de sable surélevés (teinte sable, plus de vert), leurs
  barrières et mannequins, des râteliers, la remise du maître, du foin ; la place festive la scène, les étals du marché du district
  (`MarketGenerator`, leur lumière sous la toile), la taverne.
- **La lumière, ressource rare** : un rythme de réverbères sur le côté ouvert (z 3,9), trois lanternes murales allumées près du point focal
  (`FOCUS`), les autres éteintes ; une bannière sur la prise la plus proche ; les cordons de lanternes la nuit, le pavois du tournoi de jour
  seulement (J6, `garland`).
- **Le sol** : un masque comme celui du district (`plazaMask` : la crasse au pied des murs, les chemins usés entre les points focaux, des
  flaques où les lampes les prennent).
- **Le lointain** : un anneau de 26 maisons lointaines (pièces de visibilité) de 52 à 92 m.
- **Le cadrage** : plus bas et plus serré (tangage 10 → 8,5° vers le nord, 23 → 20 m, focale 32°, lacet par place, les personnages x 1,12 comme B),
  une lumière clé par état du jour (`plazaKeyLight`), le cadre de 2,4 (`PLAZA_FRAME` : une fenêtre plus large voit un recadrage, jamais une pièce
  coupée).
- Trois itérations de captures (de jour, au crépuscule, de nuit, au téléphone) ; corrigés en route : des têtes d'arcs blanches (éventails tournés
  du mauvais côté), des trous entre les arcs et les bandeaux (des panneaux de mur ajoutés), des cercles de sable verts (la texture de pierre
  teintée de sable : la teinte du plâtre), du foin surexposé (la teinte des accessoires du district, x 1,5 : un foin local).

### La visibilité des places (`src/world/PlazaVisibility.ts`) — [OK]
- La règle du district sur un espace ouvert : chaque mur et chaque toit est une pièce ; la caméra (une fonction lisse de la place du héros,
  `plazaCamPose`) est échantillonnée sur toute la surface praticable tous les 1,5 m et sur ses bords, à chaque point de personne cadré par un
  dialogue (9 m), à chaque regard des cinématiques jouées sur la place, au cadre de 2,4 et avec le miroir des flaques ; une pièce qu'aucun
  échantillon ne montre quitte toutes les passes de l'image (une pièce cachée qui porte une ombre reste dans la passe d'ombre). Un seul
  ensemble (`A`), pas de classes de dessin. Un bake qui échoue garde tout (`?vis=0` : sans bake).
- Mesures (SwiftShader, 1280 x 720) : parvis 264 poses, **75 pièces sur 211 cachées**, triangles de la place 96 300 → 64 500 (**- 33 %**), triangles
  de l'image 216 000 → 153 000 ; entraînement 257 poses, 122 900 → 84 600 (- 31 %) ; place festive 256 poses, 112 100 → 89 600 (- 20 %).
- **Preuve « élagué contre `vis=0` »** (`static=1`, 9 poses par place dont 5 hors de la grille du bake, 4 états) : **34 / 36 identiques au pixel** ;
  deux résidus de 13 et 19 pixels isolés. Expliqués par deux essais DEV (`?visstep=0,75` : une grille deux fois plus fine ; `?visfine=A:2` : une
  tuile deux fois plus fine) : avec les deux, **0 pixel** aux deux poses ; le premier (entraînement, coin est : la caméra y est celle de la pose
  (9, 2) de la grille, elle se bloque à x ± 9 et z - 15..2) part avec la grille plus fine, le second (place festive) a deux points dont l'un part
  avec la grille et l'autre avec la tuile : des lamelles **plus minces qu'un pixel du bake** à la pose montrée, qu'une tuile plus fine ou une
  pose voisine attrape : la classe du résidu connu du district (Passe 5b). Gardé : la grille de 1,5 m sans tuile fine (le bake 3,5 fois plus
  de poses et quatre fois plus de pixels pour quelques pixels isolés).
- **Le cache** : le bake des places passe par celui du district (`bakeVisibilityCached`, sa clé couvre toutes les entrées) dans des entrées à
  lui (`PLAZA_STORE`, 6 : trois places de jour et de nuit), pour ne jamais chasser celles du district ; `?viscache=0 | verify` comme en ville.
  Chaque déplacement entre lieux recharge une page : une place relue coûte quelques millisecondes au lieu d'un bake.

### La deuxième critique à l'aveugle — [OK] partiel
- Agent neuf, six planches aux étiquettes tirées au sort (les trois places avant et après la reprise, sans dire lesquelles), la planche du
  district (B nuit, D nuit, B midi, C midi) comme référence. Cohérence / qualité : **parvis 3 / 3 → 7 / 6,5, entraînement 3 / 2,5 → 7 / 6, place
  festive 4 / 3,5 → 7 / 6,5** ; « B, H et D pourraient passer pour le même jeu ; Q et T ressemblent à des maquettes » (Q, T, W : les places d'avant).
- Ce qu'elle reprochait encore, et ce qui en est fait :
  - le Colisée « un mur droit qui remplit le haut de chaque image, sans ciel », ses briques « en carrelage » et bleu-blanc la nuit, la chope de la
    taverne sur ses bannières : **fait** — plus d'attique (la corniche à 11,25 m est le haut, les mâts et leurs flammes dans le ciel ; le mur de
    la cavea abaissé à 15,5 m, second plan de la silhouette), des blocs plus grands (`uvScale` 0,6), la pierre plus sombre (et 0,84 x la nuit), la
    fleur de lys du tournoi sur ses bannières et sur celle du parvis ; la caméra un peu plus basse (tangage 10 → 8,5° au sud, 8,5 → 7,5° au nord ;
    B est à 8°) ; et l'intrados de chaque arc (sans lui, un croissant clair bordait chaque tête) ;
  - « un grand rectangle blanc » au premier plan (l'auvent de la guérisseuse) : **fait**, à rayures du Temple (bleu et ivoire éteints) ;
  - les mannequins « des cylindres pâles sur un piquet, des bornes » : **fait** — des bras sur la traverse, des poignets de paille, un corps de
    paille serré d'une corde sombre, une tête de toile ; les cercles de sable « des disques plats, des flaques la nuit » : **fait** — un bord
    usé plus sombre et deux arcs de râteau ;
  - « la place s'ouvre sur une plaine pavée jusqu'à l'horizon » (les coins nord) : **fait**, une maison du second rang dans chaque coin nord
    (entraînement, place festive) ; les maisons lointaines « des blocs pâles juste derrière les maisons » : **fait**, plus loin (62 à 104 m) et
    plus basses (5 à 9 m) ; le tambour du Colisée vu des autres places plus loin, plus bas, plus sombre ;
  - « neuf fenêtres sur quatorze allumées » : **fait**, 0,3 au lieu de 0,46 ;
  - le pavois de la place festive « un mur de flammes entre la caméra et la scène » : **fait**, deux cordes sur quatre de jour, plus hautes ; la
    scène « une dalle sous une planche blanche » : **fait**, des poteaux avant, une plinthe, une toile de fond rayée, l'auvent bleu du tournoi ;
  - **gardé** : les réverbères de jour (« des bâtons gris ») sont le prototype même du quai du district ; les passants coupés au bas de l'image
    (comme C midi dans la référence).

### La troisième critique à l'aveugle — [?] « pas encore »
- Agent neuf, plus sévère et qui mesure (la couleur du quart le plus clair des images de nuit) ; six planches tirées au sort : les places de
  la deuxième critique et celles d'après ses corrections. Chaque paire : **les corrigées devant** (parvis 5 → 6, entraînement 5,5 → 6,5, place
  festive 5,5 → 7 ; qualité 4,5 → 5, 5 → 6, 5,5 → 6,5). Son verdict à côté du district : **« pas encore »** ; ce qui bloque : le Colisée qui ne
  se lit pas comme tel (son haut jamais dans l'image), des nuits lilas (le quart le plus clair : parvis 100 / 90 / 100, entraînement 120 / 108 /
  112, place festive 137 / 124 / 128 contre 140 / 117 / 104 au district : le plâtre sous la lune plus clair que les lampes), des auvents blancs
  brûlés, des accessoires coupés au bord de l'image, le bas des cadrages larges vide.
- Les deux critiques ne s'accordent pas sur l'attique (la deuxième : « pas de bord haut, pas de ciel » ; la troisième : « ajoutez un attique et
  montrez le haut ») mais bien sur la cause : à 11,25 m, le haut de la façade sort du cadre de la caméra des places (le haut de l'image à
  10,7-11,2 m à sa distance). Repris (itération 5, captures en cours) : l'arcade sur deux étages de 5,3 et 8,9 m, la corniche à 9,35 m (le rebord de
  la cavea à 15,5 m et une bande de ciel au-dessus) ; la lune des places à 0,8 x et les lampes plus chaudes et plus larges (4,6 et 12 m, 3,2 et
  9 m ; lanternes murales 2,7 et 9 m) ; le bord sud ouvert : une bordure de pierre, les pavés plus sombres de la ruelle et une borne entre
  chaque paire de réverbères ; les bras des mannequins d'une seule barre de paille.
- Itération 5 vue : le haut du Colisée, ses mâts et le ciel dans le cadre ; des mannequins qui se lisent ; la bordure et les bornes au bas de
  l'image. La nuit (luminance moyenne ; couleur moyenne du quart le plus clair) : parvis 44,8 → 47,0 (100 / 89 / 99 → 105 / 92 / 97),
  entraînement 54,6 → 57,3 (122 / 107 / 111 → 129 / 111 / 110), place festive 57,1 → 57,3 (137 / 124 / 131 → 141 / 126 / 127), contre B nuit
  57,7 (142 / 118 / 105) : plus chaude à moitié chemin ; la lune passe à 0,68 x.

### La quatrième critique à l'aveugle — [OK] avec réserves (entraînement, place festive), [?] pas encore (parvis)
- Agent neuf ; six planches : celles de la troisième critique et celles de l'itération 5. Chaque paire : entraînement **7 / 6** (itération 5)
  contre 6,5 / 5, place festive **7 / 6,5** contre 7 / 6, parvis **6 / 5,5 (l'itération 4, le Colisée haut)** contre 5,5 / 5 (abaissé : son haut plat
  et ses mâts nus « une boîte à antennes », le monument a perdu sa masse). Verdict : l'entraînement et la place festive **tiennent à côté du
  district « avec des réserves »**, le parvis **« pas encore »** (le Colisée ne se lit pas comme tel : droit, plat, pas plus haut que les maisons).
  « Les nuits sont le point fort : le rythme des fenêtres allumées, les flaques ambrées des lampes, les pavés mouillés » ; de jour, la palette, les
  toits bleus et le pavois sont justes.
- Repris : le Colisée revient à ses deux étages hauts (6,4 et 10,8 m, la corniche à 11,25) ; toutes les lanternes des cordes de la place festive
  allumées (la moitié pendait en boîtes noires), la scène éclairée de sa lumière chaude la nuit et l'ivoire de sa toile de fond assombri (« un bloc
  lavande froid »), le barde devant la scène (il se tenait derrière son plancher, la tête au-dessus d'un comptoir), plus de guirlande des façades
  aux réverbères sur la place festive (les cordes en travers suffisent), la ruelle d'une teinte plus claire (« une bande noire la nuit »).
- **Gardé pour la revue locale** (les réserves) : la composition frontale et symétrique (le district mène l'œil par une diagonale vers des points
  focaux en couches, doublés de reflets) ; le Colisée qui demande un vrai travail de monument (une façade courbe qui fuit aux deux bouts, trois
  ordres, plus haut que les maisons, et un cadrage qui en montre le haut : la caméra des places ne le permet pas sans changer de point de vue) ;
  les cercles de sable sans bordure de bois visible ; les étals tous du même modèle (le générateur du district, inchangé) ; des personnages coupés
  au bas de l'image (une caméra qui suit le héros sur une place ouverte passe derrière les autres) ; la fontaine sans eau.

### Le bake, suite
- Les poses de transition (Passe VP1, suite) : la page amène chaque champ de la pose vers sa cible ; un dialogue ou une cinématique passe donc
  par les mélanges de deux regards, que la grille n'échantillonne pas (le district échantillonne ses fondus AB, BC, CD, BD) : le chemin du
  héros à chaque personne (0,25, 0,5, 0,75) et d'un regard de cinématique au suivant (depuis la pose de départ du héros et retour). Les poses
  identiques ne sont cuites qu'une fois (la caméra se bloque à x ± 9 et z - 15..2 : les marges répètent des poses) : 264 → 239 poses au parvis,
  257 → 207 à l'entraînement, 256 → 202 sur la place festive.
- `tests/v2-plaza-vis.test.mjs` (5 tests : les pièces et l'élagage, les poses, la caméra fonction lisse de la place, le cache et l'échec, la
  lumière rare) : **9 / 10 fautes attrapées** ; la manquée (le bord est non échantillonné) est un mutant équivalent : la caméra bloquée à x ± 9
  donne aux bords les poses de la grille.

### Les preuves de la tête finale (code `10b3e7a` pour les places, SwiftShader)
- **Élagué contre `vis=0`** (`static=1`, six états : parvis de nuit et à midi, entraînement à midi et de nuit, place festive de nuit et l'après-midi,
  9 poses chacun dont 5 hors de la grille, à 1 280 x 720 ; parvis à midi et place festive de nuit à 2 560 x 1 080 et à 844 x 390, 3 poses
  chacun) : **57 / 66 identiques au pixel**, 50 pixels de résidu en tout sur 9 captures, aux mêmes quatre endroits de jour comme de nuit. Avec
  la grille et la tuile deux fois plus fines (DEV) : trois des quatre poses tombent à 0 ; la quatrième garde 2 pixels où l'image élaguée montre
  le ciel (110 / 151 / 197) et `vis=0` un mélange de ciel et de surface (79 / 89 / 118) : la couverture partielle (MSAA) d'une lamelle plus
  mince que le pixel de la tuile fine (1,8 pixel d'écran) : la classe du résidu connu du district (Passe 5b).
- Le bake : parvis 239 poses, 74 pièces sur 212 cachées, 96 500 → 64 900 triangles de place (- 33 %) ; entraînement 207 poses, 97 sur 279,
  137 800 → 96 300 (- 30 %) ; place festive 202 poses, 65 sur 242, 126 400 → 102 600 (- 19 %) ; 26 à 34 s par bake neuf en rendu logiciel
  (à mesurer sur le GPU, en local), en cache ensuite.
- La nuit des places (luminance moyenne ; couleur moyenne du quart le plus clair) : parvis 44,8 - 46,1 (104 / 90 / 94 à 119 / 102 / 102),
  entraînement 50,5 - 56,4 (122 / 111 / 118 à 128 / 110 / 108), place festive 52,1 - 69,4 (134 / 120 / 122 à 177 / 160 / 148), contre B nuit
  57,7 (142 / 118 / 105) et D nuit 50,9 (144 / 120 / 105) : la luminance du district, une couleur plus neutre au parvis (son grand mur de
  pierre sous la lune).

### Pensée
- Un décor « cohérent » se mesure contre la référence, pas dans l'absolu : la critique à l'aveugle avec le district B comme témoin a nommé des
  causes précises (cadrage, luminance moyenne, habillage), chacune corrigeable dans la langue du district plutôt que par des ajouts.
- La visibilité d'un espace ouvert se cuit comme celle d'un couloir : il suffit que la caméra soit une fonction de la place du héros pour
  l'échantillonner sur une grille.

## Passe VP2 — La cohérence du gameplay hors combat de la version 2 et ses événements dynamiques (2026-10-26)

### La revue
- Quatre parties v2 entières (graines 1, 7, 11, 42, politique `diligent`) parcourues lieu par lieu et créneau par créneau : chaque texte
  lisible (le journal, les mots des gens, les libellés, les refus, le tableau du tournoi) récolté et relu ; les journaux d'événements de
  50 parties au TournamentLab. Ce qui ne tenait pas (G1 à G11) :
  - **G1** le tableau du tournoi d'une partie v2 était celui de la tranche (« Phase I · the pool of eight », « The slice ends with the pool's
    second round », la prochaine échéance cherchée dans les tours de la tranche) ;
  - **G2** des textes de la tranche dans la version 2 : le greffier (« days two and three », « two rounds »), l'inscription (« two bouts »),
    le refus de fin (« The slice is over. »), la ligne du prochain combat et de fin, « Continue » à l'écran titre, Lio « the lantern-row
    innkeeper » sur la place festive ; l'en-tête de l'arène (« Pool of eight · round 4 » pour une demi-finale) ;
  - **G3** les hérauts criaient chaque matin « this afternoon's bouts » en double de la ligne du calendrier, même les jours sans combat (3, 7,
    9) ; la clameur du Colisée (« the pool's other bouts ») tous les après-midi, jours libres compris, et pendant la finale du joueur ; la pluie
    du troisième jour ne tombait qu'en ville ;
  - **G4** les tricheurs aux cartes « by the fountain » sur la place festive (la fontaine est au parvis) ; le barde aussi ;
  - **G5** le sabotage de l'équipement : ses deux signes et la tentative tombaient le même soir (le 5e : la demi-finale n'est connue qu'à la
    coupe), sans un créneau pour y répondre ; la garde payée ne parlait que de la forge ;
  - **G6** les combats du tableau final donnaient des points de poule (le classement de fin les mêlait), et une défaite en demi-finale disait
    « The pool goes on: a defeat costs points, not the tournament » ;
  - **G7** les passants : « The pool isn't over » après la coupe, « Listen to them roar » les jours libres (l'excitation saturée dès le 4e jour) ;
  - **G8** Vessa battue le 2e jour : « Next year, I'll have you » (huit jours de tournoi restent) ;
  - **G9** Corvin « riche » à 45 pièces, le prix catalogue, quand sa leçon ou la réputation baissent le prix ;
  - **G10** un encapuchonné figurant la nuit sur la place festive, qu'on ne pouvait pas aborder et qui se lisait comme l'informateur (qui est
    au quai) ;
  - **G11** la politique `diligent` du TournamentLab ne faisait qu'attendre dans une partie v2 (son terrain d'entraînement a quitté le parvis) :
    les mesures v2 de la Passe V10 sont celles d'un joueur qui ne prépare rien.

### Fait — [OK], tout derrière `flags.v2` (le jeu par défaut inchangé)
- **G1** `v2BoardHtml` (`src/ui/board.ts`) : l'acte, le prochain combat de poule ou du tableau par son nom (`stageName`), le classement de poule,
  les règles de la poule, de la coupe et du tableau, chaque résultat par son étape.
- **G2** des textes v2 (`v2.register.log`, `v2.line.odo.*`, `v2.next.*`, `v2.title.over`, `v2.arena.round`, `v2.end.order`), le refus de fin
  « The tournament is over. », `titleOf` (Lio « the festival square's innkeeper »), l'arène nommant l'étape ; l'écran de fin v2 classe par
  l'ordre final (le tableau d'abord, puis la poule).
- **G3** les hérauts au premier matin seulement dans une partie v2 ; la ligne du calendrier à la tombée de la nuit ajoute leur + 3 d'excitation ;
  la clameur seulement un après-midi de combats que le joueur ne livre pas (`{ others: true }`), avec le texte du tableau (jours 6, 8) ou de la
  finale (jour 10) ; la pluie du jour humide sur les places aussi (`rainOf`, la météo de la ville dans `PlazaApp`).
- **G4** « by the stage » (tricheurs, barde). **G5** un nouveau `{ firedBefore }` (un événement d'un créneau antérieur) : le premier signe dès la
  2e manche de poule si le joueur est parmi les quatre premiers (la demi-finale en vue), le second au créneau suivant au plus tôt, la tentative
  seulement après les deux ; la garde payée veille aussi sur les casiers (`v2.payWatch.*`). Sur 40 parties oisives : signes les 5e après-midi
  et 5e soir, tentative le 7e soir.
- **G6** les combats du tableau (`stage`) ne donnent plus de points de poule ; une défaite y dit ce qu'elle coûte (`v2.duel.lost*`).
- **G7** les passants parlent du tableau et de la finale, la clameur seulement un jour de combats. **G8** `v2.line.vessa.lost`. **G9** le prix du
  jour (`skillPrice`). **G10** plus d'encapuchonné figurant sur la place festive.
- **G12** (vu en relisant le catalogue) la bagarre de la caserne promettait dans sa description « le terrain d'entraînement fermé le lendemain
  matin », ce que rien ne faisait : le sergent Brann en parle le lendemain matin (`{ tomorrow: 'brawl' }`, `v2.line.drill.brawl`), la
  description dit ce que fait l'événement.
- **G11** `diligent` dans une partie v2 (`diligentV2`) : la guérisseuse quand il est blessé (sinon le repos), la garde payée au crépuscule, le
  regard de Hilde le matin d'un combat une fois un signe vu, la veste rembourrée puis la cotte de mailles quand la bourse le permet, le sable du
  terrain d'entraînement de jour.
- `tools/play-flow.mjs` : une partie v2 nomme l'étape de son combat dans le HUD de l'arène (« The pool · round 1 ») ; l'outil l'attendait sous le
  nom de la tranche (« Pool of eight ») : sa vérification suit le jeu (le défaut garde la sienne).
- `tests/v2-coherence.test.mjs` (6 tests) : **13 / 13 fautes attrapées** ; `tests/v2-events` et `tests/v2-places` mis à jour (les deux signes
  avant la tentative ; aucun encapuchonné sur la place).

### Mesures (TournamentLab `--rules=v2`, 50 graines)
- `diligent` : avant (V10, la politique qui attend) victoires 75,6 %, blessures 1,96 par partie, champion 10 %, finaliste 64 % ; après
  (`diligentV2`) victoires 85,2 %, blessures **1,08**, champion 28 %, finaliste 96 % (l'ordre final : 14 champions, 34 seconds, 2 troisièmes :
  Marek reste le mur). `idle` : victoires 2,5 %, blessures 1,74 par partie, tentative sur l'équipement 2 parties sur 50.
- **Le jeu par défaut** : le JSON du TournamentLab (`diligent`, `idle`, `careful`, `careless`, `losing`, en `classic` et `dynamic`, 50 graines)
  **identique à l'octet** à celui de `main` figé (`1289683`).

### Les preuves des deux passes (la branche contre `main` figé `1289683`, SwiftShader)
- **Le jeu par défaut inchangé** : la ville A, B, C, D de nuit et à midi et B avec son panneau **9 / 9 identiques à l'octet** ; l'arène `clean=1`
  sous CombatSim **7 / 7** et `combat=dynamic` **7 / 7** ; leurs HUD à animations CSS figées des deux côtés (`FREEZE_CSS=1`) **4 / 4 et 4 / 4**
  (sans le gel, quatre captures du HUD diffèrent des deux côtés comme en Passe V10 : les animations) ; `play-flow` victoire `0025acce7a403773`
  et défaite `397959404c18f714`, les empreintes de UI3 ; le TournamentLab (cinq politiques en `classic` et `dynamic`, 50 graines) **JSON
  identique à l'octet** ; l'écran titre : 7 contrôles OK, deux paires de captures identiques ; la troisième (Explore puis H contre `?time=midday` panneau ouvert) à
  2 pixels d'un niveau, dans l'anticrénelage du texte du panneau DEV ouvert par H (« low mist », « ember »), deux fois de suite ; **[OK] après
  contrôle** : `main` contre `main` 0 px, la branche contre elle-même 0 px, et la capture « Explore puis H » de la branche identique à celle de
  `main` (0 px) dans ce troisième passage : la même construction donne les deux images, une variation d'un passage à l'autre du panneau ouvert
  par H, pas un changement du code (les passes précédentes l'avaient toujours eue à 0).
- **Le drapeau** : `play-flow V2=1` victoire (jour 2, Vessa, « The pool · round 1 » dans le HUD) `5cfe614a12cc08bd` et défaite (jour 4, Orla)
  `879ce64069698f77`, chacune rejouée en Node à la même empreinte (elles changent depuis V10 : la ligne du calendrier ajoute l'excitation des
  hérauts) ; `play-day V2=1` OK ; le TournamentLab v2 rejoué identique ; `ui-text` : le tableau du tournoi v2 à 1 920 x 1 080, 1 280 x 720 et au
  téléphone OK ; le parvis à 812 x 375 **[KO] déjà sur `main`** (l'onglet « Here » coupé par le bas de l'écran du téléphone couché : le même
  échec sur `main` figé ; l'interface est celle du jeu par défaut : laissé à une tâche à part, noté dans « À reprendre »).
- `npm run typecheck`, `npm test` (**263 tests**, 0 échec), `npm run build`, `npm run art:validate` (0 erreur) ; CI verte sur la branche
  (`1711656`).
- **La branche** : `claude/friendly-davinci-17lk4m` fusionnée dans `main` par avance rapide (`1289683` → la tête de ces deux passes), après la CI
  verte ; sa suppression locale et distante suit (le dépôt distant l'avait refusée depuis le cloud en Passe V10 : à refaire en local si besoin).

### Les « proposé »
- Les seuils du premier signe (2e manche, rang 1 à 4), le + 3 d'excitation par ligne du calendrier, les textes nouveaux, la politique
  `diligentV2`.

### Pensée
- Un système conçu pour trois jours garde ses hypothèses dans ses textes et ses conditions (« demain », « la poule continue », « tous les
  matins ») : récolter tout ce qu'un joueur peut lire sur des parties entières, puis chercher les mots de l'ancien format, les trouve mieux
  qu'une relecture du code.
- Un signe n'annonce que s'il précède : une condition « a eu lieu » vraie dans le même créneau donne un signe et son événement d'un même coup.

