# Journal de bord — archive : passes VP3 à VP6 de la séance cloud « Version 2 » (2026-10-27)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-10-27 (Passe VP7) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe VP3 — Les emblèmes du tournoi sur les drapeaux de la version 2 (2026-10-27)

### Demande
La demande de l'opérateur (séance cloud, 2026-10-27), mot pour mot : « Ok dans ce cas nous allons encore optimiser le decor de nos 2 nouvelles
places ( je ne Pas la place quartier festif, donc une nouvelle place à ajouter ) et je veux un résultat de 8/10 au minimum, donc il faut prendre
le temps qu'il faut pour atteindre l'objectif voulu. Sinon je remarque que nous avons beaucoup de drapeau avec des emblèmes non pertinent je veux
des emblèmes lies a notre tournoi comme des deux épées qui se croisent ou , des silhouette de combattants bref tout ce qui est du domaine
compétition et festivité. Un joueur qui se prépare gagne 85%, c'est étrange car cela veut dire que le jeu est facilement maîtrisable, il faudrait
donc augmenter à la porte des dégâts des ennemies pour qu'ils soient plus impactant ou rendre le gameplay combat un peu plus rude. Sinon je veux
que les villes soient connecté dans qu'on puisse se déplacer d'un endroit à un autre via des entrés/sorties comme dans un final fantasy 9 . Brer
comme je l'ai dit travaille de manière autonome et sois optimale en prenant le temps qu'il faut pour un travail magistral. »

Lecture (« proposé ») : quatre lots, tous derrière `flags.v2` (la règle de la séance « Version 2 », le jeu par défaut inchangé et prouvé) : les
emblèmes (cette passe), le combat de la version 2 plus rude (Passe VP4), les entrées / sorties à pied entre le quartier et les trois places
(Passe VP5), le décor des trois places à 8/10 au moins en critique à l'aveugle (Passe VP6 ; « la place quartier festif » : la place festive
existe depuis le lot V5 à la place de Lantern Row, on ne la voyait pas faute d'y aller à pied, elle est traitée comme la troisième place à
amener à 8).

### Fait — [OK] : huit emblèmes du tournoi, un atlas 4 x 4 pour les pages de la version 2 seulement
- `src/materials/CanvasArt.ts` : huit emblèmes nouveaux après les huit d'aujourd'hui (cellules 8 à 15, aucune cellule déplacée) : `swords` (deux
  épées croisées, pointes en haut), `duel` (deux combattants face à face, lames croisées, champ parti en deux bleus), `laurel` (la couronne de
  laurier du vainqueur autour d'une étoile), `trophy` (la coupe du champion), `helm` (le heaume de joute et son panache), `horn` (la trompette
  du héraut et sa bannière), `lances` (deux lances de joute croisées derrière un écu), `crown` (la couronne du champion sur un phylactère) ;
  champs dans le bleu royal du tournoi (S3 de l'interface), charges or et ivoire, motifs (parti, bande, losanges) découpés dans leur cellule.
- L'atlas a deux tailles : `makeEmblemAtlas(rows)`, 2 rangées = l'atlas d'aujourd'hui, **les mêmes appels de dessin sur la même toile 768 x 512
  que `main`** (empreinte du journal d'appels sous une toile enregistreuse : `1309cb6d…`, identique à celle de `main` `aaa48f0`) ; 4 rangées =
  le même dessin puis les huit nouveaux. `setTournamentHeraldry(on)` choisit la taille avant que la bibliothèque de matériaux peigne ; les
  bannières et les enseignes prennent leur cellule par `emblemRect` (`FacadeGrammar.ts` : à 2 rangées les rectangles d'aujourd'hui, à
  l'identique ; à 4 les mêmes texels de retrait ; un emblème du tournoi demandé à l'atlas d'aujourd'hui lève une erreur).
- Qui l'active : les places (toujours, `PlazaApp`), la ville d'une partie v2 (`playTown` ajoute `heraldry=tournament`, lu par `App` ; l'adresse
  libre l'accepte aussi pour la revue), l'arène de la version 2 (`ArenaApp`, `rules === 'v2'`). Jamais les pages d'aujourd'hui (le quartier,
  le parvis et Lantern Row de la partie d'aujourd'hui, l'arène d'aujourd'hui).
- Les drapeaux changés : sur les places, la grande bannière de la porte du Colisée = `duel`, les deux longues bannières voisines = `lances` /
  `trophy`, les flammes des mâts = `crown` (porte), `swords` et `laurel` en alternance ; la bannière de maison la plus proche du foyer =
  `swords` (parvis), `helm` (terrain d'entraînement), `laurel` (place festive) ; la bannière de la scène = `horn`. Dans la ville d'une partie
  v2 : la grande bannière de la guilde = `swords`, celle de la taverne = `trophy`, celle du bateau = `duel`. Dans l'arène v2 : les deux grandes
  bannières des tours = `duel` / `crown`, les flammes = `swords` / `laurel`. Les enseignes de métier (clé, mortier, ciseaux, chope, enclume)
  restent des enseignes ; les bannières de la forge (marteaux, enclume) restent celles du forgeron.
- Tests : `tests/v2-heraldry.test.mjs` (4 tests : l'atlas d'aujourd'hui appel pour appel contre l'empreinte de `main`, les cellules et leurs
  retraits, toute bannière des trois places de jour et de nuit sur un emblème du tournoi (seules les enseignes de métier gardent les leurs) et
  le refus de l'atlas d'aujourd'hui, les pages qui l'activent) ; `tests/heraldry-canvas.mjs` (la toile enregistreuse) ; `v2-plaza-vis` construit
  les places avec l'atlas du tournoi comme leur page. Capture : le parvis à midi, la porte (lances, duel, coupe ; épées croisées sur la maison
  de droite).

### Pensée
- Étendre un atlas sans toucher l'existant : peindre les cellules nouvelles **après** les anciennes et seulement dans une toile plus haute ;
  le journal des appels de dessin (une toile enregistreuse, sans navigateur) prouve que l'atlas d'aujourd'hui n'a pas changé d'un appel.
- Un motif de champ se découpe dans sa cellule : sans découpe, les losanges débordaient sur les voisines (vu sur la première planche).

## Passe VP4 — Le combat de la version 2 plus rude : les coups adverses 30 % plus forts (2026-10-27)

### Demande
La demande de la Passe VP3 : « Un joueur qui se prépare gagne 85%, c'est étrange car cela veut dire que le jeu est facilement maîtrisable, il
faudrait donc augmenter à la porte des dégâts des ennemies pour qu'ils soient plus impactant ou rendre le gameplay combat un peu plus rude. »

### Les leviers essayés (TournamentLab, parties v2 entières, graines 1..20 / 1..30, le joueur préparé = la politique `diligent` à 0,6)
| Réglage | idle (0,3) | préparé faible (0,4) | préparé (0,6) | préparé bon (0,75) | expert (0,9) |
|---|---|---|---|---|---|
| aujourd'hui (C3) | 2,5 % | 33 % (0,3) | 84 % | – | 100 % |
| fréquence des compétences + 0,08 / + 0,12 et coups × 1,2 / × 1,15 | ~0 % | 15-18 % | 80-83 % | – | 95-98 % |
| coups × 1,2 | 0 % | 8 % (0,3) | 72 % | – | 94 % |
| coups × 1,25 | 0 % | 19 % | 65 % | 85 % | 95 % |
| **coups × 1,3 (retenu)** | 0 % | 15 % | 62 % | 82 % | 93 % |
| coups × 1,5 / × 1,7 | 0 % | 0 % | 42 % / 25 % | – | 83 % / 76 % |

- [KO] La fréquence des compétences adverses ne durcit presque rien : elles sont longues et télégraphiées, le bot les esquive ; plus il en
  lance, moins il frappe. Le levier est le dégât de chaque coup, celui que nomme la demande.
- [?] Une finale à paliers : avec × 1,3 partout, le joueur préparé moyen perd toutes ses finales contre Marek (0 sur 12) ; affaiblir Marek seul
  (× 0,8 à 0,9 en plus) le couronne parfois (1 à 4 sur 14) mais rend la couronne presque sûre au bon joueur et à l'expert (73-97 %) : le duel
  d'un bot à compétence fixe est un seuil. Écarté : la couronne reste au bon et à l'expert, l'essai de l'opérateur tranchera.

### Fait — [OK], « proposé », derrière `flags.v2`
- `V2_FOE_HIT = 1.3` (`src/combat/v2duel.ts`) : tous les coups et toutes les compétences des sept rivaux de la version 2 (les duels du
  tournoi, les défis, les rixes) ; le duel d'aujourd'hui et les règles dynamiques sans le drapeau inchangés.
- La course hors écran mesurée à nouveau (graines de calibrage 1..20) : les temps de mise à terre inchangés, chaque dégât par seconde
  × 1,29-1,33 (`V2_RACERS`), l'ordre des forces gardé (Marek le plus fort, Tobin le plus faible) ; le rapport de deux rivaux, qui décide un
  match hors écran, ne bouge pas.
- `V2_SIM_HASH` (l'empreinte du duel chargé de la scène, `src/arena/v2Arena.ts`, et `tools/arena-scene-check.mjs`) : seule la santé finale
  de Ren change (1279 -> 979).
- Mesure (TournamentLab, 50 graines, `--rules=v2`) : préparé (`diligent`) **60,4 %** des combats gagnés (85,2 % avant), 2,1 blessures par
  partie (1,08), qualifié 94 % (100 %), finaliste 38 % (96 %), champion 0 % (28 %) ; `idle` 0 % (2,5 %). Graines 1..30 : bon (0,75) champion
  20 %, expert (0,9) champion 67 %.
- Tests : `combat-charge` (un test nouveau : des parties v2 entières sur les graines 1..12, l'escalier par la compétence et la préparation ;
  la course hors écran et l'empreinte à jour) ; `v2-coherence` : la tentative de sabotage de l'équipement demande un combat de la phase
  finale, qu'un joueur `idle` n'atteint plus : la partie de la graine 3 (`diligent`) la porte.
- Le jeu par défaut : le TournamentLab `classic` et `dynamic`, `diligent` et `idle`, 50 graines : JSON identiques à ceux de `main` figé
  (`aaa48f0`).

### Pensée
- Une mesure de « difficulté » se lit par paliers de compétence, pas sur un seul joueur : le même réglage donne 0 % de couronnes au joueur
  moyen et 67 % à l'expert. C'est la marche entre les deux qu'on règle.

## Passe VP5 — La ville reliée à pied : des entrées et des sorties comme dans Final Fantasy IX (2026-10-27)

### Demande
La demande de la Passe VP3 : « je veux que les villes soient connecté dans qu'on puisse se déplacer d'un endroit à un autre via des
entrés/sorties comme dans un final fantasy 9 ». Jusqu'ici une partie v2 changeait de lieu par la carte (M), sans marcher.

### Fait — derrière `flags.v2` (« proposé » : le plan, les côtés, les largeurs)
- Le plan (`V2_EXITS`, `src/simulation/v2places.ts`, pur) : d'ouest en est la place festive, le parvis et le terrain d'entraînement ; le quai
  en dessous des deux premiers (son bout ouest sous la place festive, son bout est, passé la barrière des gardes, sous le parvis). Chaque voie se
  prend dans les deux sens : quai ouest ↔ place festive (porte du quai), quai est ↔ parvis (porte du quai), parvis ouest ↔ place festive est,
  parvis est ↔ entraînement ouest. `arrivalSide` donne le côté par lequel on arrive.
- Les places (`src/world/Plazas.ts`) : la rangée de maisons s'ouvre sur une ruelle là où la place a une sortie (`OPEN_AFTER` : après quelle
  maison ; 4,4 m), sous une porte de pierre en arc (deux piles, l'arc, le mur et son chaperon, l'écu du lieu où elle mène : le casque pour
  l'entraînement, la trompette pour la place festive, le duel pour le parvis ; une lanterne sur chaque pile allumée la nuit, une autre au bout de
  la ruelle) ; les ruelles pavées plus sombre jusqu'au second rang. La sortie vers le quai : une porte de deux piliers bas au bord sud.
  `PlazaBuild` porte ses voies (`exits` : la ruelle praticable, le rectangle au-delà duquel on part, le point d'arrivée et le regard, l'ancre
  du panneau) et ses ruelles (`lanes`) ; `walkTo` marche dans la place et ses ruelles. [KO puis OK] la première version prenait le point le
  plus proche de tous les rectangles : un long pas depuis la bordure « sautait » dans la porte du quai (trouvé par le test) ; désormais un pas
  n'aboutit que dans un rectangle qui touche celui où l'on se tient, sinon il glisse le long des bords de celui-ci.
- Le quai d'une partie v2 (`playTown`) : ses deux bouts (`WALK.x0`, `WALK.x1`) avec une touche tenue ; l'arrivée par `player=x,z`.
- L'écran (`src/ui/exits.ts`) : au-dessus de chaque sortie une étiquette « To the … » dans le cadre de tag du système de design, qui apparaît
  quand le héros approche (9 m) ; franchir la sortie assombrit l'écran (0,35 s), enregistre le déplacement (`move`, sans coût de temps comme la
  carte) et ouvre la page suivante avec `arrive=<lieu quitté>` : on y arrive à l'entrée qui mène d'où l'on vient, tourné vers la place. La carte
  (M) reste, comme raccourci.
- Une cinématique déplacée : Orla rejoint le joueur entre le cercle d'épée et les lices (son ancien chemin traversait une clôture du nouveau
  terrain, Passe VP6).
- Tests : `tests/v2-exits.test.mjs` (3 : le plan pris dans les deux sens et tout lieu atteint depuis le quai ; chaque place, de jour et de nuit :
  ses sorties sont celles de son lieu, ses rangées ouvertes du bon côté, l'arrivée dans la marche et loin de tout obstacle, la ruelle marchée
  jusqu'à la sortie avec la marche de la page, la bordure qui tient ailleurs ; le quai : les arrivées dans sa marche, la preuve navigateur sur les
  mêmes voies). Outil : `tools/exits-proof.mjs` (chaque voie de chaque lieu en navigateur : le héros dans la ruelle, la touche tenue, l'écran
  noir, le déplacement enregistré, `arrive=` dans l'adresse ; puis la page suivante : le héros à l'entrée qui mène d'où il vient, la voie du
  retour parmi ses étiquettes ; une capture par arrivée).

## Passe VP6 — Le décor des trois places vers 8/10 (2026-10-27)

### Ce qui change (itérations 1 à 3, `src/world/Plazas.ts`, `src/world/PlazaApp.ts`)
- Le cadrage : de biais et plus bas (`BASE_YAW` parvis 18°, entraînement 22°, place festive −20° ; tangage 7 / 6,5°, 21 / 18 m, champ 35°)
  au lieu de presque de face (−8, 9, −5° ; 8,5 / 7,5°, 23 / 20 m, 32°) : une rangée fuit en diagonale, la sortie du côté regardé se voit de
  face. `plazacam=` (DEV) règle le cadrage d'une place pendant la mise au point.
- Le parvis : une voie processionnelle dallée de la porte du quai à la porte de l'arène, un parvis rayonnant autour de la fontaine et son eau
  (surface, jet, quatre filets), deux mâts à bannières (épées croisées, couronne) de part et d'autre de la porte, deux pavillons rayés des
  concurrents dans les coins nord (éclairés de l'intérieur la nuit), le tableau du tournoi (l'arbre des combats peint) près du greffier,
  l'armurier et son râtelier au sud de la rue de l'est, la guérisseuse près du quai, la charrette du charretier et des caisses au premier plan ;
  le Colisée avec une plinthe plus sombre et un parapet crénelé sur la corniche ; la nuit, des torches sur les piles de la porte et deux travées
  plus loin, quatre lanternes autour de la fontaine.
- Le terrain d'entraînement : une cour de sable battu dans une bordure pavée (un pavé avec des disques de sable se lisait comme une place),
  les lices (la barrière peinte aux couleurs du tournoi, ses deux couloirs de sable marqués d'ornières), la quintaine, une tribune rayée devant la
  caserne, deux cercles d'épée, deux buttes de tir, les râteliers près de la rue du parvis ; des mannequins plus épais avec un heaume, un bouclier
  rond et des pieds en croix ; une clôture le long du bord sud.
- La place festive : un mât de mai (ruban enroulé, couronne de verdure, rubans courts libres au vent ; la première version, des rubans tendus
  jusqu'à des piquets, se lisait comme les perches d'une tente) hors de l'axe de la scène, deux tables de banquet, un théâtre de marionnettes
  (bleu et ivoire), les étals en toiles rayées (paramètre `stripes` de `stall`, les étals du district inchangés), la scène habillée (flammes aux
  poteaux, coffre, tambour, deux lanternes à l'avant).
- Commun : les trottoirs dallés le long des rangées, des décalcomanies (fissures, taches, paille, ornières, feuilles, éclats) ; le bord sud :
  plus de bordure ni de ruelle sombre (« le quai sans son eau »), une ligne de bornes entre les réverbères (écartés de l'axe) et, au bord
  proche de l'image, un muret de jardinières et leur verdure, ouvert par la porte du quai ; les maisons du fond plus basses (3 étages) et au-delà
  des tours et des flèches de la citadelle, le tambour du Colisée plus proche ; les passants dont les pieds sortent du bas de l'image ne sont
  pas dessinés (des têtes coupées au bord).

### La première critique à l'aveugle (itération 2) — [?] « pas encore » partout
- Agent neuf, six planches aux lettres tirées au sort (chaque place avant, depuis `main` `aaa48f0`, et après), la planche du district (B nuit,
  D nuit, B midi, C midi) en référence. Cohérence / qualité : **parvis 6 / 5 → 7 / 6,5**, **entraînement 7 / 5 → 6 / 6**, **place festive
  7,5 / 6,5 → 6,5 / 6**. Les paires : le nouveau parvis et le nouvel entraînement devant, l'ancienne place festive devant (« le mât de mai devant
  la scène, deux points focaux sur un axe », les rubans « des fils », le théâtre rouge hors palette).
- Ses reproches communs : la bande morte du premier plan (la bordure « le quai sans son eau » et des pavés énormes), aucune profondeur au-delà
  de la première rangée (peu de ciel, pas de silhouette au loin), des sols plats, des têtes coupées au bas de l'image, des personnages
  provisoires (générés) d'une autre densité. Repris à l'itération 3 (ci-dessus) ; les personnages provisoires restent ceux du lot V5 (à cuire
  par la chaîne de l'art).

### La deuxième critique à l'aveugle (itération 3), étalonnée — [?] « oui avec réserves » (parvis, place festive), « pas encore » (entraînement)
- Agent neuf ; sept planches : chaque place à l'itération 2 et à l'itération 3, et **une planche cachée du district lui-même** (A midi, D midi,
  B nuit, C nuit) pour savoir où tombe son « 8 ». Le district caché : **10 / 8** ; la référence : 8. Les places (cohérence / qualité) :
  parvis 7,5 / 6,5 → **7 / 7**, entraînement 7 / 5,5 → **6 / 5,5**, place festive **8 / 7** (rubans en étoile, itération 2) et 7 / 6,5 (rubans
  pendants, itération 3). Verdict : parvis et place festive « oui avec réserves », entraînement « pas encore ».
- Ses reproches : le vert « néon » des jardinières (le district n'a aucun vert), des pavés deux fois trop gros contre les personnages (« une
  mosaïque noir et blanc plus bruyante que les figures »), le mur de l'arène uniforme, la fontaine « une vasque à quatre pieds » (les quatre
  poteaux de lanternes autour se lisaient comme les pieds d'une table), des halos de réverbères trop larges ; à l'entraînement un sol « dalle
  sans texture » et une bande bleue « qui brille plus que ce qui est éclairé », la nuit un vide noir autour du héros ; à la place festive les
  rubans pendants « des bandes de papier ».

### Itération 4 — ce qui en est fait
- Le sol des places : des pavés 1,6 fois plus petits et moins contrastés (vers leur moyenne), par deux variantes du shader du sol compilées
  pour les places seulement (`COBBLE_SCALE`, `COBBLE_CONTRAST`, `src/materials/GroundShaders.ts` ; le district compile le code sans elles).
- L'entraînement : une vraie terre battue (variante `SAND` du même shader : la lumière, les ombres, le mouillé et le masque du sol, des
  nuances à trois échelles et un râteau léger ; [KO] d'abord presque blanche, ses valeurs prises comme des sRGB alors que l'albédo du sol est
  linéaire ; divisée par trois) à la place de la dalle de plâtre ; les planches des lices en bois peint (le plâtre les faisait briller la nuit) ;
  deux réverbères près des cercles, deux braseros aux bouts de la tribune ; plus de clôture au sud (deux barrières parallèles avec la balustrade).
- Le premier plan : une balustrade de pierre (balustres, main courante, dés tous les 7 m) à la place des jardinières et de leur vert.
- Le parvis : la fontaine reprise (une colonne plus lourde, une large vasque basse, un second étage, un fleuron ; l'eau en filets blancs mats :
  en métal brillant ils se lisaient comme une cage de tiges d'acier), des lanternes sur son rebord au lieu des poteaux, des pilastres et leurs
  chapiteaux sur les piles du Colisée et des blocs plus petits, une arcade haute sur trois éclairée la nuit, les pavillons plus lumineux, le
  halo des réverbères réduit.
- La place festive : les rubans du mât de mai de nouveau en étoile jusqu'à des piquets, mais larges et avec leur fléchissement ; de jour une
  seule corde de fanions (au-dessus de la scène) pour ne pas empiler les lignes.

### La troisième critique à l'aveugle (itération 4), étalonnée — [?] « pas encore » partout
- Agent neuf ; sept planches (itérations 3 et 4 de chaque place, le district caché). Le district caché 10 / 8, la référence 8. Les places,
  itération 4 : **parvis 7 / 6,5**, **entraînement 7 / 6**, **place festive 7,5 / 6,5** (chaque fois devant l'itération 3, « les jardinières
  vertes »). Reproches : le mur de l'arène « un seul plan plat à la brique bruyante », les filets de la fontaine « des pattes d'araignée », un
  garde qui semble debout dans la vasque, la nuit un quart d'image noir et « un bloc rouge sous deux bannières » (les arcades hautes éclairées) ;
  à l'entraînement « pas de point focal », le sol encore plat ; à la place festive la scène « une boîte rayée sans volume de tente », les
  lanternes « qui n'éclairent rien », le vert de la couronne du mât de mai.

### Itération 5 — des points focaux monumentaux
- Le parvis : **deux tours de porte** sur les travées qui encadrent la porte (3,2 m en avant de l'arcade, 15,4 m et un parapet crénelé sur
  mâchicoulis, les cordons des étages, des archères, la bannière du tournoi sur leur face, une flamme sur un mât, une torche la nuit) ; entre
  les piles et les arcs de pierre, des panneaux lisses de stuc (le mur n'est plus une seule texture) ; le fond des arcs moins noir de jour ;
  plus d'arcades hautes « éclairées » ; les mâts retirés, les braseros devant les tours, les gardes de part et d'autre de la porte, les pavillons
  un peu plus au sud ; la fontaine sans ses filets (le jet seul) ; un réverbère à droite.
- L'entraînement : **l'estrade des champions** à la place du second cercle (un plancher surélevé, des marches côté place, des poteaux d'angle,
  des cordes sur trois côtés, les flammes du tournoi, un râtelier et un brasero) ; la terre battue un peu plus sombre ; la terre piétinée autour
  du mannequin et des marches ; les buttes de tir déplacées.
- La place festive : la scène sous **un toit de tente rayé à faîtage**, sa frange festonnée et ses haubans ; une **piste de danse** de planches
  rayonnantes autour du mât de mai ; la couronne du mât en tissu or et ivoire (plus de vert), des rubans plus bleus ; de la lumière au sol sous les
  cordes de lanternes la nuit ; l'étal des chandelles écarté de la caméra.
- Commun : les pavés deux fois plus petits et plus calmes encore (`COBBLE_SCALE` 2, `COBBLE_CONTRAST` 0,55) ; les passants coupés par les
  bords latéraux de l'image ne sont pas dessinés non plus.
- Le jeu par défaut : le quartier en B nuit, D midi et A fin de journée sous la pluie, la branche contre `main` figé : **0 pixel** (le shader
  du sol compile les mêmes instructions sans les variantes des places).

### La quatrième critique à l'aveugle (itération 5), étalonnée — [OK] « oui avec réserves » (parvis, place festive), [?] entraînement
- Agent neuf ; sept planches (itérations 4 et 5, le district caché : 10 / 8, la référence 8). Itération 5 : **parvis 8 / 7** (« la structure la
  plus forte des nouvelles places : une voie qui mène, un point focal centré, des tours qui donnent l'échelle du monument »), **place festive
  8 / 7**, **entraînement 7 / 6,5** (« l'estrade est un vrai point focal »). Chaque fois devant l'itération 4. Verdicts : parvis et place festive
  « oui avec réserves », entraînement « pas encore ».
- Ses reproches : la fontaine sèche (le point focal mort), la porte un vide noir la nuit, la balustrade « des poteaux grossiers à la texture
  étirée, brûlée de jour », les bornes « éparpillées sur la place », la moitié droite de la place festive « un champ de pavés mort », l'auvent
  proche surexposé la nuit ; à l'entraînement le sable « une planche beige au contour noir », les bottes de paille « des cubes sans texture »,
  l'estrade « une boîte brune », la moitié gauche noire la nuit.

### Itération 6
- La fontaine : son eau dans **le matériau du canal** (ses rides, le ciel et les lumières en reflet) dans la vasque et les deux coupes, un
  anneau d'écume ; [KO] d'abord invisible : le rebord de la vasque était un prisme fermé, un couvercle à 0,64 m sur l'eau (depuis la Passe VP1) ;
  refait en anneau (le dessus, les faces intérieure et extérieure).
- La porte de l'arène la nuit : une lanterne sous son arc et sa lumière sur les vantaux ; les tunnels derrière deux arcades basses de chaque
  côté éclairés d'ambre (l'arcade haute « bloc rouge » ne revient pas).
- La balustrade : des balustres plus fins et plus serrés au grain lisse du plâtre, l'ensemble plus sombre, des dés plus minces ; plus de ligne de
  bornes ; la marche va jusqu'à la balustrade (`z1` 3 → 6,8 ; la caméra garde son bord : aucune pose nouvelle).
- L'entraînement : une bordure de pierre claire autour de la terre battue (plus de cadre de bois noir), les bottes de paille de l'accessoire du
  district (texturées, teintées), un brasero entre le cercle et l'estrade ; l'estrade : des chapeaux de laiton sur les poteaux, ses flancs tendus
  de toile rayée bleu et ivoire.
- La place festive : le coin du marchand de cidre à droite (tonneaux, caisse, deux bancs, une lanterne sur poteau allumée la nuit) ; l'étal des
  chandelles proche de la caméra éteint la nuit.

### La cinquième critique à l'aveugle (itération 6), étalonnée — [?] « pas encore » partout
- Agent neuf ; sept planches (itérations 5 et 6, le district caché : 10 / 8, la référence 8). Itération 6 : **parvis 7,5 / 6,5**, **place
  festive 7,5 / 6,5**, **entraînement 6,5 / 5,5** ; chaque fois devant l'itération 5 (l'entraînement : « ses braseros allumés font d'une cour
  morte une flaque de lumière lisible »). Verdicts : « pas encore » partout, la place festive « la plus proche ».
- Ses reproches communs : aucune profondeur (« ni perspective ni brume étagée »), des boîtes fermées vues d'un même balcon, la nuit sans
  flaques de lumière ; au parvis le mur « un grand plan plat de brique en carreaux », les arcades hautes « des découpes noires », le centre noir
  la nuit ; à l'entraînement le sable « un plan beige plat », les bottes de paille « des cubes jaunes sans texture qui semblent émissifs »,
  l'estrade « une boîte brune », ses cordes « des lignes épaisses et claires qui flottent », la clôture « des bâtons noirs » ; à la place
  festive le mât de mai « un cône de bandes droites sur un disque brun [...] une armature de tente », les lanternes des cordes qui « flottent »
  (leurs fils invisibles), l'auvent proche.

### Itération 7
- La mesure d'abord : les places de nuit déclarent 25 à 41 lumières pour les 24 d'une image (`MAX_LIGHTS`) ; triées par leur seule priorité,
  au parvis les quatre réverbères du bord sud (priorité 6) et ceux de l'intérieur (5) **n'étaient jamais allumés** (25 lumières de priorité 7
  à 9 passaient avant). [OK] La page des places choisit ses 22 lumières par proximité du héros (ou du point d'une cinématique), la priorité
  propre d'une lumière valant 8 m, avec 0,3 de maintien ; une lumière qui sort du choix s'éteint en fondu, une qui entre s'allume en fondu
  (aussitôt quand la page est posée) ; la `LightRig` de la ville est inchangée. `__stats()` (et `tools/plaza-shots.mjs`) donnent
  `lightsActive`.
- La brume des places commence à 12 m (16 dans la ville) et 1,6 fois plus dense que celle de l'état du jour ou de la nuit (leurs rangées du fond
  sont à 35-40 m de la caméra, les maisons lointaines du district à plus de 100 m) ; `plazafog=début,densité` (DEV) la règle.
- La place festive : le mât de mai remplacé par **un kiosque à musique** (une base octogonale de pierre et ses trois marches, un plancher, huit
  poteaux ivoire et leur garde-corps, un toit d'ardoise du matériau des maisons jusqu'à un fleuron de laiton et son fanion, un lambrequin rayé
  à festons, un plafond, des lanternes allumées la nuit et sa lumière propre, un tambour, des tabourets), dans le quart nord-ouest ([KO] d'abord
  au milieu de la place : il cachait le héros arrêté derrière lui) ; les cordes de lanternes rayonnent de son fleuron vers les rangées et la
  scène, des cordes visibles, une flaque de lumière sous chaque longue corde, les fanions du jour sur trois d'entre elles ; le théâtre de
  marionnettes à l'ouest, l'étal des chandelles tourné et écarté de la caméra.
- Le parvis : les tours de la porte en enduit, chaînées de pierre aux angles (de grands blocs calmes ; [KO] d'abord des blocs de 0,5 m, une
  « fermeture éclair » le long de chaque angle), l'enduit plus sombre vers le pied ; la pierre de l'arène en blocs plus grands ; de jour, les
  arcades hautes sont des niches dans l'ombre de leur tête avec une porte vers la galerie ; deux réverbères où la voie rejoint le parvis de la
  fontaine ; les lanternes de la fontaine plus fortes.
- L'entraînement : la terre battue refaite dans la variante `SAND` du shader (des plaques sèches et humides, des mottes, du grain et des
  graviers sombres, les arcs d'un râteau, la terre plus sombre et lisse là où l'on marche) ; les bottes de paille : [KO] dans le grain des
  planches elles se lisaient comme des caisses ; [OK] des galettes de paille pressée de deux tons, chacune un peu décalée, et leurs liens ; le
  cercle sans son disque de plâtre (la terre de la cour), sa clôture en bois clair et plus épaisse ; l'estrade : une toile de combat à bord bleu
  et cercle peint, des cordes de chanvre fines qui fléchissent ; les réverbères du bord sud aussi forts que ceux des autres places.
- Les passants contournent ce qui se tient sur la place (la fontaine, le kiosque, les pavillons, l'estrade) au lieu de le traverser
  (`steer`, `src/world/Plazas.ts`) ; un point de la foule de l'entraînement était dans l'estrade (déplacé). Test : les places des personnes et
  les points de la foule hors des grandes choses, chaque marche d'un point à un autre arrivée et tenue dehors (`tests/v2-exits.test.mjs`).

### La sixième critique à l'aveugle (itération 7), étalonnée — [OK] parvis et place festive « oui avec réserves », [?] entraînement
- Agent neuf ; sept planches (itérations 6 et 7, le district caché : 10 / 8, la référence 8). Itération 7 : **parvis 8 / 7** (« la hiérarchie
  la plus claire des sept planches » ; la pierre taillée claire « s'accorde à la palette de R et garde le contraste des bannières », la brique
  de l'itération 6 « un papier peint »), **place festive 8,5 / 7** (« son centre a une masse et la forme des toits de la ville »), **entraînement
  8 / 6,5** (« de vraies bottes de paille », la toile du ring « un point focal qui prend la lumière ») ; chaque fois devant l'itération 6.
  Verdicts : parvis « oui avec réserves », place festive « oui avec réserves » dans le cadre large, « pas encore » dans le cadre proche,
  entraînement « pas encore ».
- Ses reproches : au parvis des arcades et des fenêtres « découpes noires sans profondeur », la porte sans passage, le tiers inférieur gauche
  noir la nuit, des caisses coupées au coin de l'image, la balustrade nette ; à la place festive le kiosque collé à la tente de la scène (« leurs
  rayures se fondent en une masse bleu pâle »), son intérieur sombre la nuit, l'auvent proche, le tiers avant vide ; à l'entraînement la terre
  « un quad plat aux bords droits », la toile du ring la plus claire de l'image et coupée par son bord, les objets du bord droit illisibles
  (« des planches pâles penchées, un disque noir sur un poteau »), la bande entre la balustrade et la cour « un espace mort ».

### Itération 8
- Commun : une profondeur de champ propre aux places (`dofRange` 9 m au lieu de 16, le flou lointain jusqu'à 0,5 au lieu de 0,22 ;
  `plazadof=` en DEV) : une place tient entière entre 13 et 40 m de la caméra, le district ne floute que sa ville lointaine ; le premier plan
  (la balustrade) et les rangées du fond s'adoucissent, le décalage « tilt-shift » du HD-2D. Le choix des lumières pèse la distance plus fort
  (une priorité vaut 6 m) et les réverbères des places passent de 6 / 5 à 7 / 6.
- Le parvis : **de jour la porte est un passage** de 7 m (ses murs et sa voûte dans l'ombre, son dallage) au bout duquel l'arène est au
  soleil (le sable, les gradins), la herse levée devant ; la nuit, les vantaux fermés comme avant ; la lanterne de la guérisseuse allumée la
  nuit ; les caisses du coin de l'image rangées près de l'armurier.
- La place festive : le kiosque avancé et écarté de la scène (-7,4 ; -8,6), son lambrequin or et ivoire (la scène garde le bleu et l'ivoire),
  une lanterne à chacun de ses huit poteaux et une couronne de bougies au plafond, sa lumière plus basse et plus forte : la flaque principale de
  la nuit ; le théâtre de marionnettes dans le coin nord-ouest derrière lui ([KO] à l'ouest il se tenait dans les cadres proches, un panneau
  rayé coupé par le bord de l'image, et Pip devant la caméra) ; l'étal des chandelles à l'est, tourné vers la place ; au sud-ouest des fûts,
  des caisses et un banc, des choses basses ; sur les pavés proches des pétales et des papiers aux couleurs du tournoi.
- L'entraînement : **la terre battue dans le sol même** (`SAND_RECT` du shader, `plazaGroundDefines`) : son bord effiloché par le bruit, la
  terre répandue sur les pavés, plus de plan séparé ni de bordure ; la cour descend jusqu'aux réverbères du sud ; dans la bande devant la
  balustrade un abreuvoir (son eau dans le matériau du canal) et un banc ; les buttes de tir tournées vers le sud de la cour, le bouclier de la
  quintaine bleu à bord ivoire et umbo de laiton ; une lanterne à chaque poteau de l'estrade et sa lumière la nuit, sa toile plus sombre.

### La septième critique à l'aveugle (itération 8), étalonnée — [OK] parvis et place festive « oui avec réserves », [?] entraînement
- Agent neuf ; sept planches (itérations 7 et 8, le district caché : 10 / 8 ; la référence 8,5 pour ce critique). Itération 8 : **parvis 7 / 7**
  (« la porte devient une destination »), **place festive 8 / 7**, **entraînement 7 / 6,5** ; chaque fois devant l'itération 7 (la place
  festive de l'itération 7 : 6,5, « son étal proche, le pire recadrage de la série »). Verdicts : parvis et place festive « oui avec réserves »,
  entraînement « pas encore ».
- Ses reproches : au parvis la lumière au bout de la porte « un champ blanc vide », les chaînages « des cubes régulièrement espacés collés aux
  angles, le signe procédural le plus net », la pierre crème hors de la palette froide, les pavés proches vides, les maisons de gauche noires la
  nuit ; à la place festive « une brume chaude laiteuse sur la moitié gauche la nuit » (mesurée plus claire que les nuits de R), des tonneaux
  coupés au bas du cadre proche, les tables nues ; à l'entraînement la toile de l'estrade « le plan le plus clair de chaque image », l'estrade
  à cordes « un ring de boxe moderne », le cadre proche « un treillis de clôture sans sujet », le banc « comme un débris sur la route » ; pour
  les trois « une caméra haute derrière une balustrade floue et massive ».

### Itération 9
- La brume laiteuse : l'in-scatter des lumières (PostFX) croît avec la densité de la brume, que l'itération 7 avait multipliée par 1,6 ; la page
  des places divise `airlight` d'autant (l'in-scatter de l'état du jour ou de la nuit, la profondeur de la brume gardée).
- Le parvis : la pierre et l'enduit plus froids (gris) ; les chaînages affleurants, de hauteurs et de longueurs irrégulières, d'un ton à peine
  différent ; au bout du passage, le sable au soleil, la barrière, sept gradins dans leur ombre et une bannière ; les murs du passage plus sombres
  vers le fond ; une lanterne murale allumée sur chaque rangée latérale la nuit (en plus des trois près du point focal).
- Le bord sud des trois places : une balustrade plus basse (0,78 m, ses dés 0,86 m au lieu de 1,12 / 1,22), les piliers de la porte du quai
  plus minces et plus bas.
- L'entraînement : l'estrade sans toile ni cordes : un garde-corps de bois sur trois côtés, ses planches assombries au milieu et un cercle tracé
  à la craie ; plus de clôture autour du mannequin, un pel (le poteau d'escrime) à côté ; le banc contre la balustrade ; la paille plus sombre.
- La place festive : le halo de la lumière du kiosque réduit, plus de halo sous les cordes ; les tonneaux et le banc du sud-ouest contre la
  rangée ouest.

### La huitième critique à l'aveugle (itérations 8 et 9), étalonnée — [KO] l'itération 9 derrière la 8 partout
- Agent neuf, plus sévère : le district caché **7** (8 la nuit, 7 le plan large de jour), la référence 8. Itération 8 / itération 9 :
  **parvis 6 / 5,5**, **entraînement 6 / 5,5**, **place festive 7 / 6,5** ; ramenées à 8 pour le district (son écart à son propre 7) :
  l'itération 8 à 7, 7 et 8. Verdicts : place festive « oui avec réserves » (itération 8), parvis et entraînement « pas encore ».
- [KO] Ce que l'itération 9 a perdu : la balustrade basse et les piliers minces de la porte du quai lus comme « des moignons de mur sombres et
  flous, comme des erreurs de géométrie » (la septième les trouvait « massifs », la huitième préfère la balustrade haute « un bord de terrasse
  voulu, comme le quai de R ») ; l'estrade sans cordes « ne se lit plus comme un ring » et le mannequin sans clôture (la septième lisait les
  cordes sur la toile blanche comme un ring de boxe, la huitième veut « des poteaux, des cordes, des marches, des fanions ») ; les tonneaux
  contre la rangée ouest laissaient « la moitié basse vide, comme un parking ». Pensée : deux critiques se contredisent d'une passe à l'autre ;
  la préférence par paires dans une même critique décide, et une seule critique ne suffit plus (la suivante : deux agents).
- Ses reproches qui restent : au parvis la façade « plate comme un panneau » dans le cadre proche, les pavés vides à gauche de la voie ; à
  l'entraînement les bottes de paille au premier plan ; à la place festive la tente de la scène « une boîte rayée sans pointe », le sol sans
  dessin.

### Itération 10
- Revenu à l'itération 8 pour la balustrade, les piliers de la porte du quai, les cordes de l'estrade (sur ses planches assombries et son cercle
  de craie de l'itération 9, sans toile) et la clôture du mannequin (avec le pel) ; gardés de l'itération 9 : la pierre froide, les chaînages
  irréguliers, le bout du passage habité, l'in-scatter rendu, les lanternes des rangées latérales.
- Le parvis : à gauche de la voie, un râtelier de lances de joute aux couleurs du tournoi, des caisses et un tonneau.
- L'entraînement : les bottes de paille près des râteliers à l'ouest, le brasero du milieu retiré, le banc revenu dans la bande du sud.
- La place festive : le sol dessiné (une voie de dalles de la porte du quai à la scène, un anneau de dalles autour du kiosque, un caniveau de
  pavés en travers) ; la tente de la scène **en croupe, sa faîtière courte haute au milieu** et ses deux fanions (la pointe qui manquait de face) ;
  les fûts et les caisses dans le coin sud-ouest, le banc près d'eux.

### La neuvième critique à l'aveugle (itérations 8 et 10), deux agents — [?] l'itération 10 devant, 7 à 7,5 rapportée au district
- Deux agents neufs sur les mêmes planches aux lettres différentes (la variance d'un seul critique dépassait l'écart à mesurer). Le district
  caché : **7** et **7,5** (la référence 8,5 et 8). Itération 10 / itération 8, panneau I puis J : **parvis 6 / 6** et **7 / 6,5**,
  **entraînement 6 / 5,5** et **6 / 5**, **place festive 6,5 / 7** et **6,5 / 6** (I préférait les tonneaux près du kiosque, J les voies de
  dalles : « elles structurent le sol et mènent l'œil »). Moyennes rapportées à un district à 8 : parvis 7,25, entraînement 6,75, place
  festive 7,25. Verdicts : parvis « oui avec réserves » (J), place festive « oui avec réserves » (I), entraînement « pas encore » (les deux).
- Reproches communs aux deux : chaque place est « un champ ouvert aux accessoires semés sur les bords, quand R serre les siens dans une rue
  étroite », peu de ciel, la balustrade floue en bande grise ; la nuit « un lavis chaud » sur le mur de l'arène, une « boue brune » à
  l'entraînement, des lanternes qui « flottent sans rien éclairer » ; au parvis la porte de jour « un vide blanc » (les deux) ; à l'entraînement
  des poteaux minces semés partout, le réverbère qui coupe le cadre large en deux, le ring à agrandir ; à la place festive le milieu bas vide,
  les bords des dalles en escalier.

### Itération 11
- La caméra des places plus basse et plus longue (tangage 7 → 5,5°, au nord 6,5 → 5 ; 21 → 22 m, au nord 18 → 18,5 ; champ 35 → 30°) :
  moins de sol vide dans le cadre, plus de façades, les accessoires plus serrés (essai de trois objectifs côte à côte d'abord, `plazacam=`).
- La nuit en flaques : les braseros des places (2,8, rayon 6,2, halo 1, au lieu de 3, 8, 1,7), les réverbères (4,2 / 3,2, rayons 10 / 8,5,
  halo 0,7), les torches de l'arène et des tours plus courtes (rayons 4,8 et 5,2) ; sous chaque corde de lanternes de la place festive une ou
  deux flaques au sol.
- Le parvis : le bout du passage de la porte dans l'ombre de l'arène (le sable et les gradins assombris, la herse en silhouette devant).
- La place festive : au milieu bas, près de la voie, une table de tourtes et de bière, sa lanterne sur poteau allumée la nuit, des caisses, un
  tonneau, un panier.
- L'entraînement : l'estrade agrandie (5,8 m de côté au lieu de 4,8, son plancher à 0,72 m), son râtelier contre son flanc, son brasero à
  l'écart ; le réverbère du milieu retiré, un brasero près du mannequin pour la nuit ; l'instructeur écarté du mannequin ; un point de la foule
  déplacé ([KO] d'abord un passant coincé entre l'estrade agrandie et son râtelier : le test des marches l'a trouvé).

### La dixième critique à l'aveugle (itérations 10 et 11), deux agents — [KO] l'objectif plus long de l'itération 11
- Panneaux K et L, le district caché **7,5** chez les deux. Itération 10 / itération 11 : K **parvis 6,5 / 6**, **entraînement 6,5 / 6**,
  **place festive 7 / 6,5** ; L **6,5 / 6**, **6 / 5,5**, **6 / 6,5**. Les deux préfèrent le cadrage plus large de l'itération 10 pour le
  parvis et l'entraînement (« il garde les bannières, la tente et les personnages entiers », « les créneaux et le ciel au-dessus des
  bannières : on lit un château »), K aussi pour la place festive. Rapportée à un district à 8 : l'itération 10 à 7 (parvis), 6,75
  (entraînement), 7 (place festive). Verdicts : place festive « oui avec réserves » (K), le reste « pas encore ».
- Leurs raisons structurelles : des rez-de-chaussée morts (« pas de devantures, rien d'éclairé »), des foules réparties « comme des pions,
  toutes tournées vers la caméra », une lumière du jour plate (aucune ombre portée à travers la place), la même balustrade dans chaque place,
  le parvis « un mur, pas un château » (« des tours à toits d'ardoise »), le milieu de la place festive à meubler (« un puits ou une
  charrette »).

### Itération 12
- Revenu à la caméra de l'itération 10 ; gardés de l'itération 11 : la nuit en flaques, l'ombre au bout du passage, la table de la place
  festive, le ring agrandi et le brasero du mannequin (le panneau K : « la version qui garde le héros dans la lumière »).
- Les rangées latérales tout en devantures (plus de maison sans boutique au rez-de-chaussée : leurs auvents, leurs intérieurs, leurs
  enseignes).
- La foule deux par deux à ses points, chaque paire tournée l'une vers l'autre (le second à 0,8 m, du premier côté libre de ce qui se tient
  là).
- Le soleil de midi des places plus bas et de côté (élévation 62 → 50°, azimut 12 → 32°) : des ombres portées à travers la place.
- Le parvis : un toit d'ardoise en pyramide sur chaque tour de la porte, son épi de laiton et son fanion.
- L'entraînement : son bord sud une clôture de bois pour les spectateurs (les deux autres places gardent la balustrade) ; le cercle de craie
  éteint la nuit.
- La place festive : un puits au milieu (sa margelle, ses deux montants, son treuil, son petit toit d'ardoise, un seau).

### La onzième critique à l'aveugle (itérations 10 et 12), deux agents — [?] l'itération 12 devant sauf pour la place festive
- Panneaux M et N, le district caché **8** et **7,5**. Itération 12 / itération 10 : M **parvis 6,5 / 7**, **entraînement 6 / 5,5**, **place
  festive 7 / 7,5** ; N **7 / 6,5**, **6 / 5,5**, **6,5 / 7**. L'entraînement de l'itération 12 devant chez les deux (« la seule version dont
  le ring se lit la nuit, sa clôture convient au lieu »), le parvis partagé (N : « les boutiques des rez-de-chaussée retirent les socles
  morts »), la place festive de l'itération 10 devant chez les deux : [KO] le puits « un bon accessoire au mauvais endroit », collé au kiosque
  dans le cadre proche. Rapportées à un district à 8 (moyenne des deux : 7,75) : parvis 7, place festive sans le puits 7,5, entraînement 6,25.
  Verdicts : place festive « oui avec réserves » (les deux), parvis « oui avec réserves » (N), « pas encore, mais proche » (M), entraînement
  « pas encore » (les deux).
- Leurs reproches à l'entraînement, quatre critiques sur cinq : « une forêt de bâtons » (les poteaux et les lisses), l'estrade « une palette,
  pas un ring », le sol usé illisible, le ring sombre la nuit ; au parvis le mur éclairé « sans source visible » la nuit, des meurtrières
  « aux deux tiers de la taille d'un personnage ».

### Itération 13
- La place festive : plus de puits.
- L'entraînement : plus de clôture autour du mannequin (sa bordure marque le cercle) ; l'estrade surélevée (plancher à 1 m, quatre marches),
  un brasero à chacun de ses coins avant (allumés jour et nuit), sa lumière plus forte et plus près des planches ; l'usure du sol en anneaux
  autour du mannequin et de l'estrade et une allée vers les buttes (les chemins du masque) ; Orla s'arrête devant le bord nord de l'estrade
  agrandie (sa cinématique, `src/narrative/v2story.ts`).
- Le parvis : les meurtrières des tours à la moitié de leur taille ; la pierre de l'arène plus sombre la nuit (0,72 au lieu de 0,84) : les
  flaques des torches portent le mur.

### La douzième critique à l'aveugle (itérations 12 et 13), deux agents — [?] la place festive sans puits devant, l'entraînement veut sa clôture
- Panneaux O et P, le district caché **7,5** chez les deux. Itération 13 / itération 12 : O **parvis 6 / 6** (« aucune différence visible »),
  **entraînement 5,5 / 6**, **place festive 7 / 6,5** ; P **6,5 / 6,5**, **6 / 6,5**, **6,5 / 6**. Les deux préfèrent la place festive sans
  le puits et l'entraînement avec la clôture du mannequin (« les piquets donnent au gros plan de nuit une couche de silhouettes au premier
  plan » : le contraire de quatre critiques sur cinq auparavant). Rapportées à un district à 8 : parvis 6,75, place festive 7,25,
  entraînement 6,75 (avec sa clôture). Verdicts : place festive « oui avec réserves » (O), le reste « pas encore » (le parvis « le plus
  proche » pour P).
- Leurs reproches qui restent : au parvis la pierre trop claire (« presque blanche de jour »), le mur « en carton », l'eau de la fontaine
  « une bande blanche de plastique » ; à la place festive la balustrade, le midi plat, les maisons du fond répétées ; à l'entraînement le ring
  (« le chef de file le plus terne de l'image »), le sol, le midi « délavé » ; pour les trois le sol (40 à 50 % du cadre) et le flou du
  premier plan (« une bouillie tilt-shift »).

### Itération 14
- La clôture du mannequin rendue (celle de l'itération 12).
- Le parvis : sa pierre un cran plus sombre de jour aussi (0,86) ; l'anneau d'écume de la fontaine plus mince et gris.
- Les places : le flou du premier plan réduit (`dofRange` 12 au lieu de 9, le lointain gardé à 0,5) ; de jour, le soleil plus fort (× 1,18)
  contre le remplissage du ciel et du sol (× 0,86) : des ombres portées plus franches (`PLAZA_SUN`, ces valeurs de la page seulement).

### La treizième critique à l'aveugle (itérations 13 et 14), deux agents — [?] des leviers trop fins pour être vus
- Panneaux Q et R, le district caché **7,5** chez les deux. Les deux trouvent le parvis et la place festive des itérations 13 et 14 « sans
  différence perceptible » (les captures diffèrent pourtant de 6 niveaux de gris en moyenne : la lumière du jour et le flou) : parvis 6,5 / 6,5
  chez les deux, place festive 7 / 7. L'entraînement : R préfère la clôture rendue (6,5 / 6), Q la cour sans clôture (6 / 6, « de peu ») ;
  la clôture reste. Rapportées à un district à 8 : **parvis 7, place festive 7,5, entraînement 6,75**. Verdicts : place festive « oui avec
  réserves » (les deux), parvis « pas encore, mais proche » (Q), entraînement « pas encore ».
- Le reproche que tous les panneaux des tours 12 et 13 répètent : la nuit, le tiers bas de chaque place sombre au noir, là où les pavés
  mouillés du quai de R portent la lumière des réverbères ; le kiosque « vide et terne dedans ».

### Itération 15
- Une lanterne sur les dés de la balustrade (les poteaux de la clôture à l'entraînement), allumée la nuit, sa flaque de lumière sur les pavés
  proches et une flaque d'eau pour la refléter (`edgeLanterns`) ; le choix des lumières près du héros les prend quand il est au sud.
- Le kiosque plus clair dedans (5 au lieu de 4, et une seconde lumière basse sur ses planches).

### La quatorzième critique à l'aveugle (itérations 14 et 15), deux agents — [?] le budget des lumières
- Panneaux S et T, le district caché **7,5** chez les deux. Itération 15 / itération 14 : S **parvis 5,5 / 5,5**, **entraînement 6 / 6**,
  **place festive 7 / 7** ; T **7 / 7**, **5,5 / 6**, **6,5 / 6,5**. Les deux voient les lanternes du bord sud éclairer enfin le premier plan
  la nuit (S : « un rythme de lumières premier plan, milieu, fond, comme le quai bordé de réverbères de R »), et les deux voient ce qu'elles
  coûtent : la scène, les étals et la porte plus sombres, « comme si des lumières étaient tombées pour tenir un budget. Réglez le budget plutôt
  que de choisir entre les deux » (S). Le kiosque plus clair : la place festive de l'itération 15 devant chez les deux, de peu.
- [OK] Le budget : les lanternes du bord gardent leur lumière mais à la priorité la plus basse (4,5 : allumées quand il reste une place, les
  lumières de la scène, des étals et de la porte d'abord) ; la page en prend 23 au lieu de 22 (une seule gardée pour le fondu de sortie).
  Les preuves finales ont tourné sur l'itération 15 avant ce réglage : il ne touche que des priorités de lumières (aucune géométrie, aucune
  pose, aucun cheminement).

### Conclusion de la Passe VP6 — [?] 8/10 pas atteint : environ 7 rapporté au district
- Quatorze critiques à l'aveugle, dont six à deux agents ; à chaque tour une planche cachée du district lui-même pour étalonner (le district
  y a eu 7 à 8, jamais plus : ce protocole note R lui-même 8 à 8,5). Qualité des places, rapportée à un district à 8 (l'écart de chaque
  critique à sa propre note du district, moyenné sur les deux panneaux quand il y en a deux) :

| Critique | Itération | Parvis | Place festive | Entraînement |
|---|---|---|---|---|
| 1 (brute, sans planche du district) | 2 | 6,5 | 6 | 6 |
| 4 | 5 | 7 | 7 | 6,5 |
| 6 | 7 | 7 | 7 | 6,5 |
| 9 (2 agents) | 10 | 7,25 | 7,25 | 6,75 |
| 11 (2 agents) | 12 | 7 | 7,5 (sans le puits) | 6,25 |
| 13 (2 agents) | 14 | 7 | 7,5 | 6,75 |
| 14 (2 agents) | 15 | 6,75 | 7,25 | 6,25 |

- Les verdicts des derniers tours : la place festive « oui avec réserves » à côté du district (presque tous les panneaux depuis le 9e),
  le parvis « pas encore, mais proche », l'entraînement « pas encore ». La demande de l'opérateur (8/10 au minimum) **n'est pas atteinte** :
  les cinq dernières itérations ont plafonné autour de 7, chaque gain d'un critique perdu chez un autre (la clôture du mannequin, la
  balustrade, l'objectif). Pensée : le juge à l'aveugle varie d'un point d'un agent à l'autre ; seule la préférence par paires dans un même
  tour, à deux agents, a guidé les choix ; l'écart qui reste est structurel, pas un réglage.
- Ce qui reste, d'après les critiques convergentes (à décider avec l'opérateur, une tâche à part) : au parvis, une façade de l'arène modelée
  (relief, mâchicoulis, une ligne de toits contre le ciel dans le cadre proche, une pierre à la densité des maisons) ; à l'entraînement, une
  mise en scène du ring et un cadrage proche qui le montre entier ; partout, un sol moins vaste dans le cadre (« 40 à 50 % du cadre, leur
  matériau le plus faible ») et un premier plan nocturne éclairé sans prendre les lumières du fond (un budget de lumières plus grand pour les
  places : `MAX_LIGHTS` est commun avec la ville) ; les personnages provisoires de la version 2 cuits par la chaîne de l'art (tous les
  critiques les écartent, aucun ne les note).

### Les tests prouvés par des défauts injectés (Passes VP3 à VP5) — [OK]
- Cinq défauts, chacun attrapé, les fichiers rendus octet pour octet (`cmp`) : les huit emblèmes du tournoi peints aussi dans l'atlas
  d'aujourd'hui (`v2-heraldry` : 1 échec, l'empreinte des appels), une bannière d'une place revenue à la fleur de lys (`v2-heraldry` : 1), une
  voie qui ne revient pas par le côté opposé (`v2-exits` : 2), `walkTo` revenu au point le plus proche de tous les rectangles (`v2-exits` : 1),
  les coups des rivaux revenus à C3 (`combat-charge` : 3, l'escalier, la course hors écran, l'empreinte).
- La documentation : `AGENTS.md` (les tests, `tools/exits-proof.mjs`, `heraldry=tournament`, `arrive=`, `plazacam=`, `V2_FOE_HIT`) et la fiche
  d'essai `briefs/v2-trial.md` (le parcours à pied, l'équilibrage plus rude, les emblèmes, les places reprises).

### Les tests de la Passe VP6 prouvés par des défauts injectés — [OK]
- Trois défauts, chacun attrapé par `tests/v2-exits.test.mjs` (1 échec chacun), `src/world/Plazas.ts` rendu octet pour octet (`cmp`) : les
  passants sans contournement (`steer` ne tourne plus : « kept out of what stands there (0.70 m in) ») ; les lumières choisies par leur
  seule priorité (« the lamp at -9.4,-13.8 lit » : le réverbère près du héros éteint) ; un point de la foule dans le kiosque (« clear of »).

### Les preuves finales de la Passe VP6 — [OK]
- Sur l'itération 15 servie depuis un instantané (`:5202`), `main` figé `aaa48f0` à côté (`:5201`), une preuve après l'autre (jamais deux
  navigateurs à la fois), SwiftShader : `tools/exits-proof.mjs` « every way walked both ways » ; la visibilité des places, six états (parvis
  nuit / midi, entraînement midi / nuit, place festive nuit / fin de journée) x neuf poses du héros (le centre, les quatre coins, la porte de
  l'arène, trois points du milieu), `static=1`, la page cuite contre `vis=0` : **0 px différent sur 54 vues** ; le district A-D de nuit et à
  midi et B avec son panneau, 1920 x 1080, `tools/detshots.mjs` 120 pas, la branche contre `main` : **9 vues sur 9 identiques** ;
  `tools/play-flow.mjs win` par défaut (21 contrôles) et `V2=1` (22) : « all checks passed ».
- Sur l'arbre de la branche au réglage du budget (`6cc4bad`) : `npm run typecheck`, `npm run build`, `npm run art:validate` (0 erreur),
  `npm test` 273 sur 273 ; le TournamentLab, graines 1 à 30, `idle`, `diligent` et `--rules=dynamic`, JSON **identiques** octet pour octet à
  ceux de `main`.

