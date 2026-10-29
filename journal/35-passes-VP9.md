# Journal de bord — archive : passe VP9 de la séance cloud « Version 2 » (2026-10-28)

> Déplacée mot pour mot de `JOURNAL.md` le 2026-10-29 (Passe RC3) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe VP9 — Deux places à leur propre structure : les lices au pied du rempart, la place de la halle (2026-10-28)

### La demande de l'opérateur, mot pour mot
- « C'est très bien. Par contre il trouve que place festival, entraînement et parvis sont un peu similaire sur la structure et l'angle de plan
  contrairement à merchant qui se distinguent visuellement. Parvis est compréhensible car nous sommes devant l'arène mais place festival et
  entraînement devraient proposer une structure architectural diffente pour apporte des scènes uniques et inédites sinon je valide la qualité
  et la précision du rendu. Il faut rester de même »
- Ses deux choix, sur la question posée (trois structures proposées par place, la recommandation en tête) : « Quelle structure pour le
  terrain d'entraînement ? » = « Lices au pied du rempart (Recommandé) » ; « Quelle structure pour la place festive ? » = « Place de la halle
  (Recommandé) ». Les descriptions proposées : « La cour longe le rempart de la ville : un long mur crénelé, deux tours rondes, un chemin de
  ronde et son escalier ; en face, les écuries et une galerie de bois à étage pour les spectateurs. Caméra oblique le long du mur (une
  diagonale, comme le quai du district) ; l'arène se dresse derrière le rempart. » et « Une grande halle médiévale (charpente ouverte sur
  piliers de bois) au fond : la scène et les lanternes dessous ; des maisons à arcades (couverts) en courbe sur un côté. Caméra en plongée de
  trois-quarts (≈ 15°) qui montre le dallage et les guirlandes d'en haut ; l'arène au-dessus des toits. »
- Le cadre gardé : le parvis tel quel (prouvé à l'octet), tout derrière `flags.v2`, la ville et la partie par défaut inchangées, les règles de
  VP7 (un monument, le sol libre, 12 à 16 lumières toutes allumées, trois cadrages par place) ; chaque nombre « proposé ».

### Lot 1 : les lices (`src/world/Plazas.ts` : `LISTS`, `rampart`, `roundTower`, `wallStair`, `listsGallery`, `lanceRack`) — [OK] construites
- Le rempart de la cité au nord (face intérieure z -10, chemin de ronde à 7,8 m, de x -27 à 44) : au premier état un parement enduit d'un gris froid entre des
  pilastres de pierre (en pierre de taille depuis l'itération 3), sur une plinthe en talus, archères dans leur cadre de pierre, contreforts, cordon, trous de boulin, table de corbeaux
  sous le parapet intérieur, merlons du parapet extérieur contre le ciel, torches sur consoles ; une tranche de 4,4 m en deux parties de
  visibilité (le parement, le couronnement). Deux tours rondes (l'angle, x -18,6, au fond ; la proche, x 5, coupée par le haut du cadre en
  repoussoir, sa porte carrée sous un linteau), toits coniques à coyau en ardoise de la ville, fanions ; l'escalier monte le long du mur vers
  la tour d'angle sur deux arcs ; la galerie des spectateurs ferme l'ouest au-dessus des écuries (gradins, toile rayée du tournoi, écus
  peints, loge des juges sous un auvent rayé) et son passage est la sortie vers le parvis. Le ring des champions devant la galerie (marches
  vers l'est), le ring au mannequin, les buttes, le râtelier d'armes et celui des lances au pied du mur, des bottes de foin sur la cour
  proche, deux braseros, trois longues bannières pendues au chemin de ronde ; deux cordes du chemin de ronde à l'avant-toit de la galerie
  (fanions de jour, lanternes et une flaque de lumière chacune la nuit).
- La caméra (`src/world/PlazaCamera.ts`) : le long du mur depuis l'est, basse (4,5-5°), trois cadrages par zone le long de la cour (yaw 46,
  52, 64) ; l'arène au nord-ouest au-dessus de la galerie, le parvis entre les deux places (la géographie de VP8 gardée : le parvis à l'ouest
  des lices). Écart à l'aperçu de la question : la caméra est à l'est et regarde l'ouest (le miroir du schéma), pour que l'arène (au nord du
  parvis, donc au nord-ouest des lices) se lève dans le cadre et que la sortie vers le parvis soit au fond de la perspective. Le soleil de
  midi du sud-est sur le rempart et la galerie (`MIDDAY` 30 / 46 ; du sud-ouest, -40 / 38, depuis l'itération 4), l'ombre sur 36 m (`SHADOW`), la lune un quart plus forte sur les lices.

### Lot 2 : la place de la halle (`HALL`, `ARC`, `marketHall`, `arcades`, `well`, `FLAGS`) — [OK] construite
- La halle au nord : poteaux de chêne sur dés de pierre en trois rangs, liens, sablières et entraits, toit en croupe d'ardoise par plaques
  (quelques-unes de lichen), trois lucarnes à lames, lanterneau de faîte, fanions ; la scène dessous (sans son dais : le toit de la halle la
  couvre), les couronnes de bougies (la lumière clé de nuit), les bannières du tournoi pendues aux entraits, l'étal de bougies sous sa travée
  ouest ; on marche sous sa première travée. Les maisons à couverts en courbe à l'est (un appentis d'ardoise sur poteaux à liens courbes
  devant les maisons en retrait), la sortie vers le parvis par une brèche de la courbe sous un arc ; la rangée ouest droite (la taverne), le
  puits devant les couverts, le castelet, les tonneaux ; la porte du quai et, au premier plan, des auges de fleurs entre des dés, une lanterne
  allumée de chaque côté. Le sol : des pavés en panneaux dans un treillis de bandes de dalles en diagonale, 7 m d'écart (`FLAGS`,
  `src/materials/GroundShaders.ts`). Trois cordes hautes (7 m) de la rangée ouest aux couverts : fanions de jour, lanternes et deux flaques
  de lumière par corde fanionnée la nuit. 16 lumières la nuit.
- La caméra : haute de trois-quarts depuis le sud-ouest (12°, yaw -36 / -34, 24 et 22 m), le dallage et les guirlandes vus d'en haut ; sous
  l'avant-toit de la halle, un cadrage bas (5°, yaw -12, 16 m) ; l'arène au nord-est au-dessus des toits (même géographie). Écart à
  l'aperçu : les couverts sont à l'est (le miroir), pour la même raison.
- [KO] Le kiosque de VP6-VP8 : aucune place ne tient les règles de cadrage (une recherche sur une grille de 0,5 m, `bandsearch.mjs` de la
  séance : devant les travées de la halle il la masquait et un cadrage la coupait par le bas, près des couverts il cachait la sortie vers le
  parvis) ; un puits à ferronnerie le remplace, la scène de la halle est la place de la musique.

### La première critique à l'aveugle (le premier état, `cbe36dd`), quatre agents — [OK] les lices uniques, [?] la halle au gabarit du parvis, [KO] la qualité sous VP8
- Méthode (`mkrev9.py` de la séance) : deux juges de la distinction, l'un sur les planches de VP8, l'autre sur celles de VP9 (les trois places
  et le quai, quatre planches sous des lettres tirées au hasard, jour et nuit à deux places chacune), note de 10 = une scène unique ; deux
  panneaux de qualité sur les mêmes planches (VP8 et VP9 de l'entraînement et de la place festive, le quai caché parmi elles, la référence
  R = 8 de VP7-VP8).
- Distinction. VP8 : l'entraînement 5, le parvis 6, la place festive 3, le quai 9, « C, D and G read as variants of one template ». VP9 :
  les lices 9, le parvis 6, la halle 6, le quai 9 ; « A and F read as variants of one square template re-dressed with a different landmark »
  (le parvis et la halle : le pavé, le chemin de dalles de la balustrade au point d'eau, les étals à gauche, le héros de dos au milieu).
- Qualité (panneau 1 / panneau 2) : l'entraînement de VP8 5 / 5, les lices 4 / 4 ; la place festive de VP8 6 / 6, la halle 5 / 5 ; le quai
  7 / 7. Les lices : « a grid of identical oversized grey blocks with heavy black grout », le lierre « outside the palette », le sable vide,
  des ombres sans objet (les maisons du sud hors du cadre), une nuit « near black » et « a leopard print » sous les feux, l'appareil
  d'entraînement lu « as a gallows ». La halle : un PNJ géant coupé par le bas du cadre, « the roof eats the frame », les fanions à hauteur
  des têtes, des lanternes qui « light nothing », un chemin de dalles « crude ».

### Itération 1 — [?] les retours de la première critique
- Les lices : [KO] le lierre (l'emplacement des feuilles rend un vert néon quelle que soit sa teinte) et la quintaine (une potence) retirés ;
  les maisons au sud de la cour retirées (leurs ombres sans objet) ; deux cordes de lanternes avec une flaque chacune ([KO] des mâts le long
  du bord sud pour les porter : « a vertical pole cutting the frame ») ; des cailloux dans la terre, ses taches humides resserrées sous les
  feux ; la pierre du mur à son échelle propre.
- La halle : les fanions depuis les deuxièmes étages (7 m), deux flaques de lumière par corde, l'étal sous la halle (l'ouest de la place
  libre), le chemin de dalles remplacé par un dallage du sol entier, la toiture par plaques, les personnes éloignées du bas du cadre.

### La deuxième critique à l'aveugle (itération 1), trois agents — [OK] les deux places distinctes, [KO] la qualité encore sous VP8
- Distinction (un juge, les planches de VP9) : le quai 9, les lices 8, la halle 7, le parvis 6. « E and G read as two dressings of the same
  layout » (le parvis et la halle : un sol libre et le héros seul au milieu, un point d'eau central, un fond parallèle au cadre, une caméra
  dans l'axe), et le second cadrage de la halle « just a closer, tighter version of the first ».
- Qualité (panneau 1 / panneau 2) : l'entraînement de VP8 6 / 6, les lices 5 / 4,5 ; la place festive de VP8 6,5 / 6,5, la halle 6,5 / 5,5 ;
  le quai 7,5 / 7. Les lices : « one uniformly tiled brick texture over half the frame », « no base grime », la porte de la tour « a jagged
  black hole », l'escalier « a thin floating pole », une nuit « badly underexposed » (47 / 255 de luminance moyenne en bas contre 69 pour R),
  « no foreground props such as racks, straw or weapons », le sable en traînées. La halle : « a perfectly regular grid of large, clean square
  flagstones [...] a CG or bathroom floor », la maison coupée au bord gauche, « no sky is visible, so the scene feels boxed-in », des
  lucarnes « like stickers » la nuit, le toit uniforme.

### Itération 2 — [?] les retours de la deuxième critique
- Les lices : le parement enduit d'un gris froid entre des pilastres de pierre, la pierre gardée aux cadres (plinthe, cordons, archères,
  corbeaux, parapets), le pied du mur assombri ([KO] l'enduit dans la teinte de la pierre : une crème hors de la palette froide ; [KO] la
  pierre seule à 0,4 x puis à 1 x : un carrelage de briques) ; l'escalier sur deux arcs à claveaux ; la porte de la tour carrée sous un
  linteau, ses planches fermées ; le râtelier de lances et des bottes de foin ([KO] le râtelier sur la cour proche : la caméra de la galerie
  posée dessus, les pointes des lances en deux grands cônes au travers du cadre ; au pied du mur après la tour proche) ; la lune un quart
  plus forte sur les lices ; le ratissage plus discret.
- La halle : les pavés en panneaux dans un treillis de bandes de dalles en diagonale ([KO] des dalles de 1,35 m, « un damier » ; de 1,1 m, le
  « bathroom floor » ; des bandes de 0,9 m tous les 6 m, un carrelage vu d'en haut : 0,56 m tous les 7 m) ; la première maison de la rangée
  ouest retirée ; la rangée nord à deux étages, sans rangée arrière (le ciel au-dessus) ; l'arène plus loin ; les lucarnes à lames, sans
  lueur ; le toit en cinq rangs de plaques ; le puits devant les couverts ; un cadrage bas sous l'avant-toit de la halle ; l'arrivée et la
  place à 12°.

### La troisième critique à l'aveugle (itération 2), trois agents — [OK] les deux places distinctes, [KO] la qualité encore sous VP8
- Distinction (un juge, les planches de VP9) : le quai 9, les lices 7, la halle 7, le parvis 6 ; « None of the four reads outright as a
  re-dressed copy » ; ce qui rapproche encore : le mur de pierre pâle et ses grandes bannières bleues (le parvis et les lices), la galerie et
  la halle (« a blue-roofed, timber-posted gallery or hall with banners between the posts »), le héros de dos au milieu.
- Qualité (panneau 1 / panneau 2) : l'entraînement de VP8 6 / 5,5, les lices 5 / 5 ; la place festive de VP8 6,5 / 6,5, la halle 5,5 / 6 ; le
  quai 7,5 / 8. Les lices : le rempart et les tours « huge pale grey-white surfaces with thin crack lines and almost no masonry, overexposed by
  day [...] At night [...] bright lavender », des archères « like stickers », le sable vide et flou, la galerie noire la nuit, la rampe de
  l'escalier « a single thin line that reads as a cable ». La halle : le treillis « reads like paving tiles or a car park », le toit (une
  tache verte, de jour un seul plan, de nuit « a featureless dark slab »), les lucarnes noires la nuit, une lumière plate (« no strong sun
  shadows, so it reads overcast »), peu de ciel.
- Le TournamentLab (30 graines, oisif et diligent, règles d'aujourd'hui et dynamiques) : identique à `main` (`5a69031`) ; le parvis haché à
  l'octet, les quatre moments : identique à `main`.

### Itération 3 — [?] les retours de la troisième critique
- Les lices : le parement en appareil de pierre de taille, chaque bloc sa géométrie, sa teinte (quelques-uns plus chauds, d'autres plus
  froids), sa part de la texture, 3,5 cm en saillie sur son mortier, plus sombre vers le pied (`ashlarBand`, `ashlarRing` : les assises posées
  depuis le début du mur, sans couture d'une tranche à l'autre ; les tambours des tours de même) ; la face de jour sous le stuc du parvis, la
  pierre de nuit aussi sombre que la façade du parvis ; les archères en retrait dans leur encadrement ; la margelle de l'escalier dans la
  pierre du parapet, une assise de haut ; des lanternes aux poteaux des écuries la nuit (sans lumière) ; le flou proche des lices plus léger
  (0,22 au lieu de 0,45 : leur caméra basse sur une longue cour).
- La halle : le sol en pavés traversés d'une rose de dalles autour du milieu de la place (huit rayons, deux cercles à 4,6 et 9,2 m, le bord
  d'un médaillon ; les dalles un peu plus claires que la moyenne des pavés) ; une lueur faible entre les lames des lucarnes la nuit ; le
  soleil de la place à droite de sa caméra (à midi du sud-est, en fin de journée bas du sud par son côté ouvert : il était derrière la caméra,
  chaque ombre cachée derrière ce qui la portait) ; les cadrages d'arrivée et de place un peu plus haut (plus de ciel et l'arène au-dessus des
  toits).

### La quatrième critique à l'aveugle (itération 3), trois agents — [OK] la halle devant VP8, [KO] les lices encore derrière
- Distinction : le quai 9, les lices 7, la halle 7, le parvis 6 (« No pair is the same template re-dressed ») ; ce qui rapproche encore : le
  rempart à bannières du parvis et des lices, un même plan bas, de face, le héros de dos au milieu (les deux vues du parvis, la seconde des
  lices et de la halle).
- Qualité (panneau 1 / panneau 2) : la halle **7 / 7** contre la place festive de VP8 6,5 / 6 (« the strongest composition among the new
  places. The hall is a clear monument and the compass-rose paving leads the eye ») ; les lices 5 / 5 contre l'entraînement de VP8 6 / 5,5 ; le
  quai 8 / 8. Les lices : des blocs « oversized cinder-block bricks » et une seconde pierre rayée qui ne s'accorde pas (la texture de pierre
  des encadrements), aucune ombre portée sur le sable de jour, le sable de nuit « blotchy, oily », une flaque dure devant le ring, la base des
  tours à facettes, l'enclos coupé au bord droit.

### Itération 4 — [?] les lices seules
- L'appareil plus fin (assises de 0,36-0,5 m, blocs de 0,6-1,25 m, `ASHLAR`), les encadrements, corniches, parapets, merlons et l'escalier dans
  la matière des blocs (`wallTrim` ; le mortier seul dans la pierre) ; les tours à 44 côtés ; au-dessus de la porte de la tour proche, les
  armes de la cité sculptées et peintes dans un panneau de pierre.
- Le soleil de midi des lices du sud-ouest (-40°, 38°) : rasant le long du rempart, les ombres des tours et des contreforts sur le mur, celles
  des choses sur le sable ; la galerie à l'ombre de son toit.
- Le sable de nuit mat et uniformément humide, aucune flaque sur la terre (ni celles de la cour, ni les creux du masque ; la flaque de la
  critique en était un), les chemins usés moins sombres ; l'enclos du mannequin 0,8 m plus à l'ouest.

### La cinquième critique à l'aveugle (itération 4), trois agents — [OK] distinction 8 / 8, la qualité à égalité de VP8 (panneau 2)
- Distinction : le quai 9, les lices 8, la halle 8, le parvis 7 (« None of the four reads as the same template re-dressed ») ; restent proches
  la seconde vue de la halle et celle du parvis (une structure large en haut du cadre, le héros au milieu), le rempart à bannières du parvis
  et des lices.
- Qualité, panneau 2 : la halle 6 contre la place festive de VP8 6, les lices 5 contre l'entraînement de VP8 5, le quai 7. Les lices : le mur
  et la tour la nuit « lit flat and too bright (grey-lavender), brighter than the ground beside the braziers », sous la galerie « a flat,
  almost black navy area » (les ouvertures des écuries). La halle : le sol vide, les flaques noires aux reflets durs, le fond derrière les
  poteaux délavé, le toit.

- Qualité, panneau 1 : la halle 6,5 contre 6, les lices 5,5 contre 6, le quai 7. Les lices : de jour la pierre « overexposed [...] reads as
  plaster, not R's cool slate » (la moyenne de luminance du haut du cadre à 145 / 255 contre 117 pour VP8), la galerie « a near-black navy
  block » (à l'ombre du soleil du sud-ouest) ; la nuit, le tiers bas du cadre noir (31 / 255 contre 57 pour VP8) et la pierre « mauve-pink ».
  La halle : pas d'ombre lisible au sol, les flaques de nuit, le toit taché de vert.

### Itération 5 — [?] les lices au plus près de VP8, la halle peaufinée
- Les lices : la pierre de nuit un cran plus sombre (la face 0,35, les encadrements 0,62 de leur teinte de jour), de jour aussi et plus froide
  (la face 0,4, les encadrements 0,7) ; derrière les demi-portes des écuries, leur fond de planches dans la pénombre au lieu d'un vide noir ;
  la lumière du brasero de la cour proche plus large la nuit (3,4, 9,5 m), la lanterne de l'enclos du mannequin sur son côté proche, le sable
  de nuit un peu moins assombri : le tiers bas du cadre de nuit de 31 à 45 / 255 (première vue) et de 46 à 50 (seconde).
- La halle : le lichen du toit d'un gris chaud ; une seule petite flaque sous la halle au lieu de deux grandes ; son soleil de fin de journée
  un peu plus haut (28°, 24°).

### La sixième critique à l'aveugle (itération 5), deux panneaux — [OK] la halle devant VP8, les lices devant VP8 en moyenne
- Qualité (panneau 1 / panneau 2) : la halle 7 / 6,5 contre la place festive de VP8 6,5 / 6 ; les lices 5 / 6,5 contre l'entraînement de VP8
  5,5 / 4,5 ; le quai 7,5 / 7,5. Panneau 2 : les lices « the best architecture of the new scenes [...] believable scale » ; panneau 1 : « a
  regular grid of identical pale grey blocks [...] It reads as cinder block », la galerie « a flat dark-navy plane » à midi, les lucarnes de
  nuit « like electric heater grilles ».
- Sur les deux dernières critiques (quatre notes de panneau chacune) : la halle 6,5 contre 6,1 pour la place festive de VP8, les lices 5,5
  contre 5,25 pour l'entraînement de VP8 ; la distinction 8 / 8 (cinquième).

### Itération 6 — [?] deux retouches, la dernière
- Les lucarnes de la halle la nuit d'un ambre faible ; les demi-portes des écuries d'un chêne plus clair et leur fond moins sombre, le bois de
  la galerie 1,4 fois plus clair de jour. [?] La galerie reste sombre à l'ombre de son toit sous le soleil du sud-ouest (les textures de
  planches et de poutres sont sombres) : le prix du soleil rasant sur le rempart.

### L'archivage du journal — [OK]
- `JOURNAL.md` dépassait 60 Ko (120 Ko) : la Passe VP8 (fusionnée, `5a69031`) déplacée mot pour mot dans `journal/34-passes-VP8.md` (un
  en-tête, une ligne `---`, puis les octets inchangés), sa ligne ajoutée à l'index. Preuve : le corps archivé égale les octets retirés
  (SHA-256 `c8616692c3424d20…` des deux côtés, 28 211 octets), le même bloc que celui de `main` ; chaque titre de passe dans un seul fichier ;
  pas de CRLF, ni avant ni après.

### Les tests généralisés — [OK]
- `tests/v2-plaza-vis.test.mjs` : l'axe de chaque place (`PLAZA_AXIS` : celui du parvis et de la halle du quai au monument, celui des lices le
  long du mur), son bord proche (`PLAZA_NEAR` : aucun sur les lices), la place de sa caméra (`ROOM`), le cœur du sol libre (la marche moins
  2 m, 3 m côté caméra : celui du parvis inchangé) ; `v2-exits` (`OPEN_AFTER` du parvis seul), `v2-places` (`PLAZA_WALKS`, la foule loin du
  pied des cadrages), `v2-story` (les regards dans la marche de leur place). 278 tests sur 278.
- Les fautes injectées, une à une, chaque fichier rendu à l'octet ensuite (`cmp`) : prises, le cadrage d'arrivée de la halle trop haut (le héros
  sous le bord du cadre), le bord proche de la halle au-dessus du héros, une brèche entre deux zones de la halle (aucun cadrage), le ring des
  lices au milieu de la cour (69,3 % du cœur libre), un regard de `v2-story` hors de sa place, la caméra des lices derrière le rempart ;
  [KO] cette dernière passait d'abord : la place de la caméra des lices ne bornait pas le côté du rempart, bornée depuis (z ≥ -9). Passées, et
  laissées : un point de rassemblement dans l'enclos du mannequin, un castelet au milieu de la halle (des tolérances voulues des tests :
  le sol libre à 70 et 75 %, les points de foule contrôlés contre la marche).
- Le parvis : son bâti haché (géométrie de chaque emplacement, lumières, émetteurs, obstacles, sorties, places, foule, instances, masque du
  sol, cadrages et poses de l'empreinte) identique à main pour les quatre moments de la journée.

### Les preuves finales de la Passe VP9 — [OK]
- Sur un instantané figé de l'état final (`cae5438`, servi sur un port à part ; depuis, seuls le test de la place de la caméra et ce journal
  ont changé), contre `main` (`5a69031`) servi sur un autre :
  - la visibilité des places, élaguée contre `vis=0`, sans personnages, huit états (les lices à midi, la nuit et le matin ; la halle en fin de
    journée, la nuit et le matin ; le parvis à midi et la nuit), douze places du héros chacun : **0 px différent sur 96 vues**. Cuissons
    neuves : les lices 323 poses (14-16 s en rendu logiciel), la halle 513 (31-49 s), le parvis 565, ses poses identiques à celles de `main`
    (rectification : la Passe VP8 notait « parvis 427, entraînement 501, place festive 565 » ; sur `main` ce sont parvis 565, entraînement 427,
    place festive 501) ;
  - le district contre `main` : A à D de nuit et à midi, B avec son panneau, **identiques au pixel** (9 sur 9) ;
  - les sorties des places et du quai parcourues dans les deux sens (`exits-proof`) : « every way walked both ways » ;
  - `play-flow` par défaut et `V2=1` : « all checks passed », aucune erreur de page ; l'écran titre (`title-proof`) : ses trois comparaisons
    identiques au pixel.
- Le parvis haché à l'octet (géométrie de chaque emplacement, lumières, émetteurs, obstacles, sorties, places, foule, instances, masque du sol,
  cadrages et poses) : identique à `main` aux quatre moments de la journée. Le TournamentLab (30 graines, oisif et diligent, règles
  d'aujourd'hui et dynamiques) : identique à `main`, sur l'état final.
- `npm test` 278 sur 278, `npm run typecheck`, `npm run build`, `npm run art:validate` (0 erreur).
- Le bâti statique (hors instances) : les lices 60 177 triangles à midi, 60 744 la nuit (l'entraînement de VP8 : 148 702 et 149 066) ; la halle
  118 720 et 120 658 (la place festive de VP8 : 145 364 et 146 224) ; 16 lumières la nuit au plus (les lices 15, la halle 16).

### Conclusion de la Passe VP9 — [OK] deux places à leur propre structure, au niveau de VP8 ; [?] la revue en jeu de l'opérateur
- La demande : « place festival et entraînement devraient proposer une structure architectural diffente pour apporte des scènes uniques et
  inédites [...] Il faut rester de même ». Les lices au pied du rempart (le mur de la cité en pierre de taille, deux tours rondes, le chemin de
  ronde et son escalier, la galerie des spectateurs sur les écuries, vus le long du mur depuis l'est) et la place de la halle (la grande halle
  de bois et sa scène, les maisons à couverts en courbe, le puits, la rose de dalles, vues de haut depuis le sud-ouest) ; le parvis à l'octet.
- À l'aveugle : la distinction de 5 (l'entraînement) et 3 (la place festive) pour VP8 à 8 et 8 (cinquième tour), « None of the four reads as
  the same template re-dressed » ; la qualité, en moyenne des deux derniers tours (quatre notes de panneau), la halle 6,5 contre 6,1 pour la
  place festive de VP8, les lices 5,5 contre 5,25 pour l'entraînement de VP8 : au niveau de VP8 ou au-dessus, à la variance des juges près
  (un point d'un panneau à l'autre). Six tours de critique et six itérations, chaque nombre « proposé ».
- Ce qui reste (« À reprendre ») : la revue en jeu de l'opérateur, en rendu matériel ; la galerie des lices sombre à l'ombre de son toit ; les
  flaques de nuit ; le sol libre ; les flammes figées des captures.

