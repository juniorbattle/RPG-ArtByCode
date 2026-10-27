# Journal de bord — archive : passe VP7 de la séance cloud « Version 2 » (2026-10-27)

> Déplacée mot pour mot de `JOURNAL.md` le 2026-10-27 (Passe VP8) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe VP7 — La direction des places : cadrages composés, sol libre, plan d'éclairage, population par période (2026-10-27)

### La demande de l'opérateur, mot pour mot
- Après la conclusion de la Passe VP6 (8/10 pas atteint), la question de l'opérateur : « Oui comment tu gérerait le budget lumière l'idée
  et surtout d'optimiser le design et la qualité par ce jeu de lumière et d'effet. Jouer aussi sur nos angles de caméra comme district
  merchant et proposer une direction belle, simple et épuré, par exemple je constate que tu as intégré trop d'élément et cela impacte la zone
  de déplacement alors que les endroits se doivent d'être spacieux et libre avec de la population qui peuple les rues selon lez périodes.
  Qu'en penses tu ? »
- La direction proposée (cinq points) : une règle de composition (un monument par place, le centre libre, au moins 70 % du sol praticable
  sans obstacle, les accessoires dans une bande de 2 m au pied des façades et un seul groupe au monument ; « On retire le reste : le puits, la
  table aux tourtes, le râtelier de lances, les caisses du milieu, les poteaux superflus, les bancs isolés ») ; la population à la place des
  objets, par moment de la journée ; trois ou quatre cadrages composés par place, comme le graphe du district, le bord proche hors du cadre par
  construction ; le budget de lumières comme mise en scène (une lumière principale au monument, deux ou trois flaques qui guident, l'ambiance
  hors budget, 12 à 16 vraies lumières par cadrage décidées d'avance, plus de choix automatique ; des flaques sous les lumières principales, un
  halo sur la lumière principale seulement) ; la méthode (une place d'abord, jugée par paires contre le district).
- La réponse de l'opérateur, mot pour mot : « " On retire le reste : le puits, la table aux tourtes, le râtelier de lances, les caisses du
  milieu, les poteaux superflus, les bancs isolés. " il peut en avoir mais cela doit être bien contrôlé et non en surnombre. Sinon oui ton plan
  me plaît. Exécute la tâche complète telle quelle de manière autonome, en faisant la totalité de ce qui y a à faire. Tu as tout le temps
  qu'il faut. Sois autonome et propose moi un résultat convaincant. Merci »
- Tout ce qui suit est derrière `flags.v2` (les pages des places), la ville et la partie par défaut inchangées ; chaque nombre « proposé ».

### Lot 1 : les cadrages composés (`src/world/PlazaCamera.ts`, `src/world/PlazaApp.ts`, `src/world/PlazaVisibility.ts`) — [OK]
- Trois cadrages par place au lieu de la caméra qui suivait le héros partout (une fonction lisse de sa place, journal Passe VP1) : l'arrivée
  (`entry`, le héros au sud de z 0,5 : toute la place, son monument entier, les toits et la citadelle contre le ciel), le plan moyen (`court`
  au parvis et à la place festive, `yard` à l'entraînement) et le plan du monument (`gate`, `stage`, `ring`). Chacun : un lacet, un tangage,
  une distance, un champ, un pivot qui suit le héros par un gain et dans des bornes (la formule du graphe du district, `CameraGraph.ts`), une
  zone ; la zone la plus prioritaire qui contient le héros l'emporte, la courante tient 0,9 m au-delà de son bord (l'hystérésis du district).
  La page amortit chaque champ de la pose vers le cadrage voulu (le passage glisse, sans coupe). Le regard d'un dialogue ou d'une cinématique
  garde la formule de la première version (`lookPose`). DEV : `plazaframe=<id>:yaw,pitch,dist,fov,hx,hy,hz[,gx,gz];...` règle un cadrage
  pendant la mise au point (remplace `plazacam=`). Les touches de déplacement gardent le lacet sous lequel elles ont été pressées tant qu'elles
  restent tenues (la règle du district) : un changement de cadrage ne tourne pas la marche.
- Le bord proche hors du cadre par construction : le sol praticable s'arrête à z 3,6 au lieu de 6,8 (la voie de la porte du quai continue
  jusqu'au bord). Pensée : avec une caméra basse au sud, un héros visible à 1,5 m de la balustrade la montre toujours (il faudrait une caméra
  plongeant à près de 40°) ; à 4,4 m, aucun cadrage ne la montre.
- Les cadrages ont été composés par le calcul avant d'être capturés (des scripts de travail, non versionnés) : sur une grille de 1 m de tout
  le sol de chaque zone, le héros dans l'image (pieds |x| ≤ 0,9, y ≥ −0,92, tête ≤ 0,9), la balustrade sous le bas de l'image, la tête du
  héros jamais derrière un monument (le kiosque, la scène, les pavillons, les piles de la porte), ni derrière un étal à l'emplacement d'un
  personnage ou à l'entrée d'une rue ; puis une recherche par grille des tangage, distance, pivot et gain. Ces règles sont devenues le test.
  Pensée : une capture SwiftShader coûte une minute, le calcul de toutes les places d'un cadrage une seconde ; la capture ne sert plus qu'au
  jugement de l'œil.
- La cuisson de visibilité suit : chaque cadrage sur sa zone élargie de l'hystérésis à chaque place du sol et des voies de sortie (tous les
  1,5 m, leurs coins exacts), les passages d'un cadrage à l'autre là où les zones se touchent (à un quart, à mi-chemin, aux trois quarts,
  le héros immobile ou un pas plus loin), les regards des dialogues et leur chemin depuis chaque cadrage, les regards des cinématiques et leurs
  passages depuis le cadrage de chaque entrée.

### Lot 2 : l'épuration contrôlée (`src/world/Plazas.ts`) — [OK]
- La place festive : le kiosque (le monument) contre la taverne à côté de la scène, au fond de la place (au milieu, il cachait le héros qui
  passait derrière lui à toute caméra du sud) ; le théâtre de marionnettes au pied de la rangée ouest, les trois étals au pied de la rangée
  est, un seul tas de tonneaux au pied de la rangée ouest et un dans le coin derrière le kiosque. Retirés : la table aux tourtes, ses caisses
  et son poteau, les deux tables de banquet, les tonneaux du marchand de cidre et son poteau, les bancs, les tabourets, le réverbère du coin
  nord-ouest.
- Le parvis : le monument est la porte de l'arène, la voie processionnelle y mène tout droit ; les pavillons des concurrents dans les coins
  nord, le greffier contre la rangée ouest, l'armurier et son râtelier de lames contre la rangée est, la guérisseuse au sud-ouest. Retirés : la
  fontaine du milieu (son eau, ses lanternes, son parvis rayonnant), le râtelier de lances et ses caisses, les quatre réverbères du milieu.
  Ajoutés : deux mâts aux bannières du tournoi de part et d'autre de la voie, à mi-chemin de la porte, une lanterne sur chacun (les flaques
  qui guident l'œil la nuit).
- L'entraînement : le monument est le ring des champions, sur l'axe de la cour devant la tribune des spectateurs ; le cercle du mannequin à
  l'ouest, les buttes de tir au pied de la rangée est, un râtelier et les bottes de paille au pied de la rangée ouest. Retirés : la barrière de
  joute en travers de la cour, la quintaine, l'abreuvoir et le banc du bord proche, le second râtelier, le troisième brasero du ring, le
  brasero et le réverbère du milieu.
- La part du sol praticable libre (grille de 25 cm, le rayon du héros compris) et celle de son milieu (|x| < 9, −14 < z < 3), avant (`main`)
  et après : parvis 75,3 → **80,8 %** (milieu 77,5 → **92,5 %**), entraînement 69,3 → **72,4 %** (70,2 → **76,0 %**, le ring de 5,8 m y
  compte), place festive 68,5 → **79,7 %** (67,7 → **92,5 %**). Le test : au moins 70 % du sol et 75 % de son milieu.

### Lot 3 : le plan d'éclairage — [OK]
- Les lumières d'une place la nuit, avant et après : parvis 51 → **16**, entraînement 34 → **15**, place festive 48 → **16**. Toutes brûlent :
  plus de choix à l'exécution (`pickPlazaLights` retiré), plus de lumière qui s'éteint au fond quand une autre s'allume devant ; la limite de
  24 de la ville ne bouge pas. Au cadre le plus large, chaque cadrage voit toutes celles de sa place (la place est compacte) : 16 au plus.
- La hiérarchie : la lumière principale au monument (le kiosque ; la lanterne de la porte et ses deux braseros ; la lanterne du ring et ses
  deux braseros), la seule avec un halo ; les guides (les deux flaques des guirlandes sur la voie de la place festive, les deux mâts du parvis,
  les réverbères du bord sud) ; l'ambiance hors budget : les fenêtres et les lanternes lointaines brillent sans lumière à elles (les
  fenêtres des maisons, sauf les deux tavernes de la place festive ; la lanterne au fond de chaque rue ; les torches des travées de l'arène ;
  les bougies des étals ; les lanternes de la balustrade et de la porte du quai). Des flaques sous les lumières principales.

### Lot 4 : la population par moment de la journée — [OK]
- `PLAZA_GATHER` (`src/world/Plazas.ts`) : les points où la foule se rassemble et marche, par place et par moment (le matin quelques mains
  aux étals, au ring ou chez le greffier ; à midi des groupes autour du monument et des étals ; en fin de journée vers les sorties et les lieux
  éclairés ; la nuit quelques-uns près des lumières). La page les forme seuls le matin, par trois à midi, par deux en fin de journée et la nuit,
  chaque groupe tourné vers son premier, et les laisse s'attarder selon le moment (moins d'une seconde à 3 s le matin, 7 à 13 s à midi).
  `PLAZA_CROWD` (`src/simulation/v2places.ts`) : 5 le matin, 12 à midi, 8 en fin de journée, 4 la nuit (6 / 9 / 7 / 4).

### Les tests — [OK]
- `tests/v2-plaza-vis.test.mjs` : les poses de la cuisson réécrites pour les cadrages ; un test des cadrages (trois ou quatre par place,
  chaque place du sol et des voies dans la zone de l'un, chaque changement fait et défait à 0,9 m du bord, puis à chaque place du sol libre
  et dans chaque cadrage qui peut la montrer : le héros dans l'image, la balustrade dehors, sa tête jamais derrière un monument ni derrière un
  étal à un personnage ou à l'entrée d'une rue ; les touches gardent leur lacet) ; un test de l'espace libre. `tests/v2-exits.test.mjs` : les
  passants de chaque moment de la journée contournent ce qui se tient sur la place ; le plan d'éclairage (12 à 16 lumières la nuit, aucun
  choix à l'exécution, un halo seulement sur la lumière principale, au plus quatre feux le jour). `tests/v2-places.test.mjs` : les points de
  chaque moment dans le sol praticable. `npm test` : 274 sur 274.

### La première critique à l'aveugle de VP7 (deux agents) — [KO] l'itération 1 derrière VP6 partout
- Le protocole de VP6 : deux agents neufs, la planche R du district, sept planches aux lettres tirées au sort (chaque place dans `main`
  `b68769d`, la fin de VP6, et dans VP7, le district caché), quatre images par planche (le héros à l'arrivée 0 / 2 et au milieu −1,5 / −3,
  de jour et de nuit, la caméra de chaque version).
- Panneau U (le district caché 7,5) : parvis VP6 **6,5** / VP7 **5,5**, entraînement **6,5** / **5**, place festive **7** / **6**. Panneau V
  (le district caché 7,5) : parvis **7** / **5,5**, entraînement **7** / **6**, place festive **7,5** / **6**. Les deux préfèrent VP6 pour
  chaque place. Rapporté à un district à 8 : VP7 parvis 6, entraînement 5,5 à 6,5, place festive 6,5 ; VP6 7 à 8.
- Ce que les deux disent de VP7 : un cadrage centré et symétrique (« the camera is centred with the hero on the axis, where R uses
  diagonals »), « half of each frame is empty cobble », le monument petit au loin (le ring « tiny in a huge empty patch of sand »), la fontaine
  regrettée au parvis (« K has a real focal point »), la foule en rangs (« queue-like rows », « a police lineup »), les tours blanches et le
  mur gris du Colisée au fond lus comme des primitives, la nuit sombre au milieu, des accessoires et un personnage coupés par le bas de
  l'image (la tente de la guérisseuse, l'étal du potier, la charrette).
- Pensée : le sol libre n'est pas le défaut, c'est le cadrage qui le montre. L'arrivée large (27 à 30 m, champ 38°, de face) et les plans
  moyens de face font du sol la moitié de l'image ; la caméra de VP6, de biais et proche (lacet ±18 à 22°, 19 à 21 m), le comprimait en bande
  comme la caméra du district comprime le quai. La fontaine du parvis n'était pas dans la liste de l'opérateur : l'avoir retirée au nom du
  « centre libre » a ôté le seul point focal du milieu.
- La preuve de visibilité de l'itération 1 (`static=1`, la page cuite contre `vis=0`, six états x douze places du héros dont les coins, les
  bords et les entrées des rues) : 2 px différents sur 72 vues (un pixel d'un écart de 1 sur 255 dans deux vues de la place festive, la même
  place du héros : un échantillon MSAA, le résidu connu de la Passe 5b). Mais la cuisson est passée de 200 à 1 100 poses environ (90 s au lieu
  de 16 en SwiftShader) : les passages entre cadrages, échantillonnés à chaque place du sol, cinq voisins et trois poids.

### Itération 2 — [?] près et de biais, la fontaine rendue, la foule en cercles
- Les cadrages : de biais et proches comme la caméra de VP6 (18 à 21 m, champ 35 à 40°), le héros dans le tiers inférieur des plans moyens
  et rapprochés ; le plan d'arrivée le montre entrant par le bas de l'image (le seul moyen, avec une caméra basse, de garder la balustrade
  dehors quand il en est à 4,6 m : le sol praticable s'arrête maintenant à z 3,4). Deux règles de plus au test : aucun monument (la fontaine,
  le kiosque, la scène, le ring : `PLAZA_MONUMENTS`) coupé par le bas de l'image, la caméra toujours entre les deux rangées (au-delà, le
  pignon de la première maison remplissait un côté de l'image). Les lacets trouvés sous ces règles : parvis 8° (la fontaine au centre les
  impose : plus de biais, elle sort coupée), entraînement −6 / −10°, place festive −6 / −12 / 8°.
- Le parvis : la fontaine rendue au milieu de la voie (son bassin, son eau, ses quatre lanternes dont deux allumées, les guides), les deux
  mâts retirés ; dans le test, elle cache une tête par sa vasque seulement (1,25 m de rayon, 2,05 m de haut). La guérisseuse, le potier, le
  marchand de bougies, le tas de tonneaux, les bottes de paille du sud-est remontés au nord de la bande d'arrivée (coupés par le bas de
  l'image).
- La foule : chaque groupe en cercle autour de son point, chacun tourné vers le milieu (trois de front se lisaient comme une file) ; les
  points de chaque moment alternent le près et le loin (trois groupes côte à côte devant la scène faisaient un rang).
- Le fond : le tambour du Colisée retiré du ciel de la place festive et de l'entraînement ; trois flèches de la citadelle au lieu de cinq,
  plus loin (165 à 200 m) et plus sombres.
- La cuisson : les passages entre cadrages sur une colonne de la grille sur deux, trois voisins au lieu de cinq : 480 à 590 poses.
- Le sol libre : parvis 76,1 % (milieu 87,0 %), entraînement 72,8 % (76,5 %), place festive 80,0 % (92,5 %) ; 15 à 16 lumières la nuit.

### La deuxième critique à l'aveugle (itération 2 contre VP6), deux agents — [KO] VP6 encore devant partout
- Panneau W (le district caché 7,5) : parvis VP6 **6,5** / itération 2 **5,5**, entraînement **7** / **5**, place festive **7** / **5**.
  Panneau X (le district caché 7,5) : parvis **7** / **6**, entraînement **6,5** / **5,5**, place festive **7** / **6**.
- Les deux décrivent l'itération 2 comme « low, frontal, centred camera with an empty foreground » et VP6 comme « higher three-quarter camera
  with a foreground layer » : « the rail fence in the foreground gives a real diagonal leading line », « the balustrade [...] make three
  layers », et pour VP7 « the bottom 40 % of every frame is empty cobble ». Leurs reproches à VP6 restent ceux de sa balustrade (« overexposed
  and smeared », « streaky ») et des réverbères qui coupent les personnages (« a lamp post stands directly in front of the pair »), plus un
  joint sombre en travers de la place festive (la rigole) et la voie dallée « like a decal ».
- Pensée : la règle « le bord proche hors du cadre » de la direction proposée retirait le premier plan sans le remplacer ; la direction
  prévoyait aussi « un élément de premier plan sur un côté, comme le bateau du district », que les itérations 1 et 2 n'avaient pas mis. Les
  quatre panneaux de deux tours le réclament : le défaut de la balustrade de VP6 était son dessin, pas sa présence (le quai du district et son
  eau sont le premier plan de ses cadrages).

### Itération 3 — [?] le bord proche redevient le premier plan, la caméra suit de biais
- Le bord sud : une balustrade plus basse (1,0 m, ses piliers 1,14 m), plus sombre, dans le grain lisse du plâtre (« streaky »), une
  tablette et des piliers tous les 5 m environ avec une lanterne ; à l'entraînement la clôture de bois. Leurs lanternes (deux par balustrade,
  trois sur la clôture) et celles de la porte du quai éclairent le premier plan la nuit, à la place des quatre réverbères du bord sud, retirés
  (« in the way »). Le sol praticable va de nouveau jusqu'à 2 m de la balustrade (z 6,0).
- Les cadrages : l'arrivée et le plan moyen reprennent la caméra de VP6 (de biais, 21 m, tangage 6,5°, le pivot 2,5 à 4 m devant le héros),
  avec un lacet qui tourne vers le côté où le héros marche (`turn`, 0,8 à 1,2° par mètre : la caméra reste entre les rangées) ; les plans
  du monument (la porte, le ring, la scène) gardent ceux de l'itération 2. Dans le test, la règle « le bord proche hors du cadre » devient
  « la tête du héros au-dessus du bord proche » ; les autres restent.
- Le flou de profondeur des places au premier plan à 0,45 de celui de la ville (`dofNear`, PostFX : 1 pour la ville, une multiplication par
  1,0 exacte). Le soleil de midi choisi par place : au parvis il rase la façade de l'arène depuis l'est (62° / 42°), à l'entraînement il vient
  de l'ouest (−35° / 46°), la place festive garde le sien.

### La troisième critique à l'aveugle (itération 3 contre VP6), deux agents — [KO] VP6 encore devant, l'écart réduit au parvis
- Panneau Y (le district caché 8,5) : parvis VP6 **7** / itération 3 **6,5**, entraînement **7** / **5,5**, place festive **7,5** / **6,5**.
  Panneau Z (le district caché 8) : parvis **7,5** / **6,5**, entraînement **7** / **5,5**, place festive **7,5** / **6**.
- Le jour du parvis de l'itération 3 est loué (panneau Y : « It has the best daylight of all the squares. The sunlit tower against the
  castle's shadow across the right half gives a clear sun direction, form and depth », « the square reads as spacious ») ; ses nuits sont le
  reproche principal (« The night collapses », « the lower half of both night frames is black »). À l'entraînement : « the platform is a small
  object in the upper middle and the lower half is empty sand », « about two-thirds of each night frame is black » ; à la place festive :
  « The lantern strings light nothing on the ground, so the night foreground is black ». Les reproches à VP6 restent ses réverbères au milieu
  (« About six thin lamp posts are scattered across the open floor with no logic, one between the hero and the fountain », « a lamp post
  stands directly in front of the talking couple ») : ce que la direction a retiré.
- Corrections menues après ce tour (commit 273b79a) : la rigole sombre de la place festive retirée (« a dark seam across the square », tour
  2), les voies dallées un peu plus sombres (`PAVE` 0,64 / 0,63 / 0,62 : « like a decal »), une contremarche sous les marches du ring.
- Pensée : les deux panneaux mesurent l'écart surtout la nuit ; le sol libre au milieu ne s'éclaire plus par des réverbères posés dessus,
  il doit recevoir la lumière du bord proche, du monument et de guides qui n'encombrent pas le sol.

### Itération 4 — [?] les nuits rééquilibrées sans réverbère au milieu, l'entraînement plus près
- Les lumières du bord proche (les lanternes de la balustrade, de la clôture et de la porte du quai) montées à 1,4 m au-dessus de leur
  support et avancées de 0,8 m vers la place, par place (`NEAR_LIGHT`, intensité / rayon) : 4,4 / 10,5 au parvis et à l'entraînement, 2,4 / 8
  à la place festive ; la clôture de l'entraînement porte quatre lanternes (−7,6, −2,6, 2,6, 7,6) au lieu de trois.
- Le monument et ses guides plus forts : les lanternes de la fontaine 3,6 / 9,5, la lanterne du ring 4,4 / 9, ses deux braseros 3,2 / 7, une
  lanterne sur le poteau d'entrée de l'anneau du mannequin (3,0 / 8,5), la lanterne de la guérisseuse 3,0 / 8. À la place festive, les deux
  lanternes murales retirées et leurs deux lumières données aux guirlandes : quatre flaques sous la guirlande qui traverse la place (2,6 / 8)
  au lieu de deux. Chaque place garde 16 lumières, toutes allumées.
- Un premier essai plus fort à la place festive (le bord proche 2,8 / 9 et les guirlandes 3,2 / 9) l'a rendue trop claire et laiteuse
  [KO] : moyenne de la moitié basse 69,7 / 69,4 (p1 / p2) contre 54,7 / 50,9 pour VP6, 17,6 / 15,8 % de pixels sous 25 contre 27 / 40 %.
- L'entraînement : le plan moyen rapproché (21 → 17 m, « Push the camera in so the platform fills the central third »), ses personnes et
  sa foule de midi écartées du ring (Ilse en −4,6 / −7,0, Vessa en 5,8 / −2,6 ; « eight or more silhouettes merging »).
- Mesures (moitié basse du cadre, moyenne de luminance 0-255, p1 / p2 ; pixels sous 25) contre VP6 : parvis 52,8 / 56,6 (VP6 58,4 / 59,2 ;
  36,5 / 38,5 % contre 29,1 / 37,4 %), entraînement 46,4 / 49,1 (55,0 / 57,5 ; 38 % contre 30 / 32 %), place festive 63,0 / 62,6 (54,7 /
  50,9 ; 23,0 / 20,8 % contre 27,0 / 39,9 %). Les nuits du parvis et de l'entraînement restent plus sombres que VP6, sans réverbère au milieu :
  un sol froid sous la lune et des flaques chaudes au bord, au monument et sur les guides, l'indigo du district.

### La quatrième critique à l'aveugle (itération 4 contre VP6), deux agents — [KO] VP6 encore devant de 0,5 à 1,5 point
- Panneau S (le district caché 7,5, R 8) : parvis VP6 **6,5** / itération 4 **6**, entraînement **6** / **5**, place festive **6,5** /
  **5,5**. Panneau T (le district caché 7,5, R 8) : parvis **7** / **6,5**, entraînement **6,5** / **5**, place festive **6,5** / **5,5**.
- Ce qu'ils demandent et que la direction refuse : remplir le sol (« Fill the floor between the gazebo and the stalls with clustered dressing
  (tables, benches, barrels, a cart) », « Populate the midground floor: benches, tables, a well, a cart ») ; les deux préfèrent chaque fois
  la version meublée. Ce qu'ils reprochent à VP6 et que la direction a retiré : « Lamp posts form tangents with characters », « A lamp post
  grows out of the foreground couple [...] the worst tangent on any sheet ».
- Ce qu'ils reprochent à l'itération 4 et qui ne contredit pas la direction : à l'arrivée de l'entraînement « the ring is small and far away
  behind a band of fence and empty cobbles » ; au premier plan « two orphan balustrade posts and a stub of wall » (les piliers de pierre pâle
  de la porte du quai, 2 m de haut), « Never crop newels at mid-height » ; « At night the tents glow ivory with no light source » ; « Under the
  ring, a black void shows between the striped skirt panels » ; « Puddles read as white holes in the ground » ; le théâtre de marionnettes
  vu de côté, « A tall white box at the left edge reads as an untextured placeholder » ; la nuit, « the lower half falls to near-black ».
- Pensée : le juge à l'aveugle d'images fixes récompense la densité ; la direction de l'opérateur (« spacieux et libre ») est un choix qu'il
  ne voit pas en jeu (marcher sans buter). Ses reproches précis restent bons à prendre ; ses demandes de meubler le sol sont écartées.

### Itération 5 — [?] les reproches précis corrigés, une guirlande de lanternes sur l'entraînement
- La porte du quai : deux dés de la balustrade, un peu plus larges et plus hauts (1,28 m), dans son plâtre sombre, une lanterne sur chacun ;
  les travées de la balustrade finissent à leurs dés (ses dés d'extrémité retirés). [KO] les piliers de pierre pâle de 2 m.
- Les pavillons la nuit : la toile à 0,72 de sa valeur, le fond de la porte éclairé de l'intérieur (un panneau du matériau `glow`), la
  lumière du pavillon y avait déjà sa source.
- Le ring : chaque marche un bloc jusqu'au sol (le vide sous l'escalier) ; ses deux flaques plus petites, devant les braseros (devant le
  plancher, elles reflétaient sa jupe ivoire) ; les braises de tous les braseros au-dessus du bord de la vasque (dedans, elles ne se voyaient
  pas). Le théâtre de marionnettes tourné vers l'arrivée (lacet 1,3 → 0,5 rad).
- L'arrivée de l'entraînement plus près (21 → 17 m, le pivot 1 m plus loin) : le ring au tiers du milieu.
- La lune des places 0,68 → 0,8 de celle de la ville : le sol froid, indigo, plus lisible la nuit.
- L'entraînement : une guirlande d'une rangée à l'autre au-dessus de la cour (z 1,2), les fanions du tournoi le jour, onze lanternes la nuit
  et deux flaques de lumière dessous (2,6 / 8), le sol proche éclairé sans poteau sur le sol ; ses deux lumières prises aux deux lanternes du
  milieu de la clôture, qui brillent sans lumière à elles. Toujours 16 lumières. [KO] la même guirlande au-dessus de l'arrivée du parvis
  (z 1,6) : elle barrait la fontaine et la porte, le centre de la place, de jour et de nuit ; retirée.
- Mesures (moitié basse, p1 / p2) : parvis 53,2 / 56,3, entraînement 66,4 / 61,5 (était 44,7 / 49,8), place festive 62,5 / 60,8 ; VP6
  58,4 / 59,2, 55,0 / 57,5, 54,7 / 50,9. Le sol libre (grille de 25 cm) : parvis **78,9 %** (milieu 87,4), entraînement **76,0 %** (77,3),
  place festive **82,4 %** (92,8) ; `main` 75,3 / 69,3 / 68,5 %.

### Les tests de la Passe VP7 prouvés par des défauts injectés — [OK]
- `faults.py` (les fichiers rendus octet pour octet, SHA-256) : `tests/v2-plaza-vis.test.mjs` attrape 5 défauts sur 5 (l'hystérésis à
  0,3 m ; l'arrivée du parvis à 8 m, le héros ou le bord proche hors règle ; la porte du parvis à 30° de champ, la fontaine coupée par le bas ;
  l'anneau du mannequin en obstacle de 4,2 m, le sol plus libre ; les touches qui ne gardent plus leur lacet) ; `tests/v2-exits.test.mjs`
  3 sur 3 (un halo sur chaque lanterne ; une dix-septième lumière à l'entraînement ; un point de foule du matin dans la fontaine).

### La cinquième critique à l'aveugle (itération 5 contre VP6), deux agents — [?] l'entraînement de l'itération 5 devant VP6 pour un panneau
- Panneau U5 (le district caché 7,5, R 8) : parvis VP6 **6,5** / itération 5 **5,5**, entraînement **6,5** / **5,5**, place festive **7** /
  **6**. Panneau V5 (le district caché 7, R 8) : parvis **6,5** / **5,5**, entraînement **5,5** / **6** (« X is better than A [...] a ring
  that is lit at night. A's night is a black void »), place festive **6,5** / **5**.
- Les reproches précis à l'itération 5 : le sable, « The sand has a combed, ridged texture that causes moiré », « reads as a rendering bug » ;
  « Puddles on sand show as black ovals » ; l'entraînement la nuit, « lit by an even warm fill rather than by visible sources » ; « the
  pennant line at eye level flattens it » ; le parvis, « At night it is murky: only the gate glows », « Light the night: sconces on the
  gatehouse ». Les demandes contraires à la direction reviennent (« Fill the middle ground with benches, tables, barrels, a well or a tree »)
  et sont écartées ; les réverbères de VP6 restent son défaut principal (« There are so many lamp posts that the verticals cut through
  characters »).

### Itération 6 — [?] le sable sans stries, le mur de l'arène éclairé
- Le râteau du sable (`GroundShaders.ts`, sous `SAND` : la ville ne le compile pas) s'efface où ses arcs se rapprochent à moins d'une
  dizaine de pixels (`fwidth` de sa phase entre 0,25 et 0,7) : il reste au pied de la caméra, le reste de la cour est une terre battue
  tachetée. [KO] l'effacement à deux pixels (0,9 à 2,2) : les stries restaient lisibles.
- Plus de flaque sur la terre de l'entraînement (celles du ring et de la guirlande). La guirlande pendue plus haut (5,6 m aux rangées), ses
  deux flaques de lumière plus serrées (3,4 / 6,2 à 3,2 m).
- Le parvis : deux torches de la façade de l'arène allumées, une travée de part et d'autre de la porte (x ±6,6), les deux lumières prises
  aux pavillons (leur porte brille sans lumière à elle). [KO] la paire à deux travées : elle se tenait derrière les pavillons, hors du cadre.
- Mesures (moitié basse, p1 / p2) : parvis 51,2 / 51,6, entraînement 65,4 / 60,7, place festive 62,5 / 60,8. Toujours 16 lumières par
  place, au plus quatre feux le jour.

### L'archivage du journal — [OK]
- Les passes VP3 à VP6 (fusionnées dans `main`, closes), 56 362 octets, déplacées mot pour mot dans `journal/32-passes-VP3-VP6.md` (un
  en-tête, une ligne `---`, puis les octets inchangés) ; la ligne de l'index ajoutée. Preuve : le corps de l'archive égale les octets retirés
  (SHA-256 `fa2a83085dd5f6fb…` des deux côtés) ; le bloc retiré était identique à celui de `origin/main` ; chaque section VP3 à VP6 dans un
  seul fichier (les doublons de noms connus, V0 à V3, C1, C2, V5, sont antérieurs à ce déplacement) ; pas de CRLF, ni avant ni après.
  `JOURNAL.md` : 163 084 → 106 855 octets.

### La sixième critique à l'aveugle (itération 6 contre VP6), deux agents — [?] le parvis de VP7 devant pour un panneau, la place festive derrière
- Panneau P6 (le district caché 7,5, R 8) : parvis VP6 **6** / itération 6 **6,5** (« Z is better than T [...] At night the lit gate and the
  candle-lit fountain set the hero off clearly, the best night readability of any square »), entraînement **6,5** / **6**, place festive
  **7** / **5,5**. Panneau Q6 (le district caché 8, R 8,5) : parvis **7** / **6**, entraînement **6,5** / **5**, place festive **7** / **5,5**.
- La place festive reste la plus loin : « Half of every frame is an even cobble floor with no wear, holding one barrel and one crate. It looks
  like an unfinished level », « Group props at the focal points (trestle tables and benches around the bandstand) ». L'entraînement : « The
  pennants are oversized, each about the size of a window, and hang in a straight line across the facades ».

### Itération 7 — [?] un seul groupe de mobilier à la place festive, des fanions plus petits
- La place festive : une table de banquet (3,2 m, ses bancs, ses bols et ses paniers) au pied du kiosque, entre lui et le théâtre de
  marionnettes, le seul groupe de mobilier de la place (la règle de l'opérateur : « il peut en avoir mais cela doit être bien contrôlé et non
  en surnombre ») ; la voie vers la scène libre. Un point de foule du matin déplacé de 0,4 m. [KO] baisser la caméra de l'arrivée (tangage
  6,5 → 4 ou 5°, le pivot remonté) : la part de sol vide ne bouge presque pas, le héros se tient près de la caméra.
- L'entraînement : les fanions de la guirlande plus petits (0,3 m au lieu de 0,42) et plus serrés, la guirlande plus pendante (1,5 m).
- Le sol libre : parvis **78,9 %** (milieu 87,4), entraînement **76,0 %** (77,3), place festive **80,5 %** (90,0) ; `main` 75,3 / 69,3 / 68,5 %.

### La septième critique à l'aveugle (itération 7, l'état final, contre VP6), deux agents — [?] le parvis et l'entraînement à égalité, la place festive derrière
- Panneau M7 (le district caché 7,5, R 8) : parvis VP6 **6,5** / VP7 **5,5**, entraînement **6,5** / **5,5**, place festive **7** / **5,5**.
  Panneau N7 (le district caché 7,5, R 8) : parvis **7** / **7,5** (« H is better than D. H has the axial composition, the value structure
  from sunlight against shadow, and less vertical clutter. D's night is clearly better »), entraînement **6,5** / **7** (« P is better than
  G. P has the clear centred focal point [...] P's floor material and its brown night must be fixed first »), place festive **7** / **6**.
- L'écart moyen (VP7 − VP6) par tour, deux panneaux : parvis −1 (tour 2), −0,75, −0,5, −1, −0,25, **−0,25** (tour 7) ; entraînement −1,5,
  −1,5, −1,25, −0,25, −1, **−0,25** ; place festive −1,5, −1,25, −1, −1,25, −1,5, **−1,25**. Les panneaux d'un même tour s'écartent d'un
  point ou plus sur une même planche : une demi-note n'est pas un signal.

### Les preuves finales de la Passe VP7 — [OK], un pixel en [?]
- Sur un instantané figé de l'état final (`fa43dfe`, servi sur un port à part) : les sorties des places et du quai parcourues dans les deux
  sens (`exits-proof`, « every way walked both ways ») ; la visibilité des places, élaguée contre `vis=0`, sans personnages, six états, douze
  places du héros (les bords, les coins, les entrées des rues, le milieu) : **2 px différents sur 72 vues**, le même pixel dans les deux
  vues de la place festive depuis le coin ouest (−11 / −9,6), de jour et de nuit, une petite tache plus sombre sur un mur de plâtre (14 et 17
  sur 255) que `vis=0` montre et que la version élaguée ne montre pas : un éclat vu entre deux poses échantillonnées, la classe de résidu
  connue (Passe 5b) ; `vis-why` ne sait que le district, non expliqué plus loin [?]. Le district contre `main` (`b68769d`) : A à D de nuit
  et à midi, B avec son panneau, **identiques au pixel** (9 sur 9). `play-flow` par défaut et `V2=1` : « all checks passed », aucune erreur
  de page. Le TournamentLab (30 graines, oisif, diligent, règles dynamiques) : **identique** à `main`.
- `npm test` 274 sur 274, `npm run typecheck`, `npm run build`, `npm run art:validate` (0 erreur).
- La cuisson de visibilité d'une place (neuve, rendu logiciel) : parvis 427 poses, 37-39 s ; entraînement 501, 46 s ; place festive 565, 42-44 s
  (VP6 : environ 200 poses) ; en cache ensuite. Le coût GPU des places en rendu matériel reste à mesurer en local (budget E24).

### Conclusion de la Passe VP7 — [?] la direction appliquée ; à l'aveugle, le parvis et l'entraînement rejoignent VP6, la place festive non
- La direction de l'opérateur est appliquée et prouvée : un monument par place et le sol libre (parvis **78,9 %**, entraînement **76,0 %**,
  place festive **80,5 %** du sol praticable, contre 75,3 / 69,3 / 68,5 % sur `main`) ; le puits, la table aux tourtes, le râtelier de
  lances, les caisses du milieu, les poteaux superflus et les bancs isolés retirés, un seul groupe de mobilier gardé à la place festive ;
  trois cadrages composés par place, choisis par la zone du héros comme le graphe du district ; un plan de 16 lumières par place, toutes
  allumées, la lumière principale au monument ; la foule par moment de la journée.
- Contre VP6 à l'aveugle, sept tours : l'écart s'est refermé sur le parvis et l'entraînement (−0,25 au dernier tour, chacun devant VP6
  pour un panneau), pas sur la place festive (−1,25). Ce que les juges demandent encore et que la direction refuse : un sol meublé (« Fill the
  foreground with a cart, crates, a well [...] plus lamp posts »). Ce qu'ils reprochent toujours à VP6 : ses réverbères qui coupent les
  personnages.
- Pensée : un juge d'images fixes récompense la densité ; l'espace libre se juge en marchant. La revue de l'opérateur en jeu décide. Si la
  place festive doit se rapprocher des juges sans perdre son sol libre : un second groupe de mobilier aux étals (la règle « bien contrôlé »),
  ou une arrivée plus proche (19 m, essayée en capture, non retenue).
- Vu par tous les panneaux de tous les tours, hors de la tâche : la rive opposée du plan d'ensemble du district (le cadre « am » de la planche
  cachée), « grey boxes », « blockout » ; le district est gelé, c'est une décision de l'opérateur.

