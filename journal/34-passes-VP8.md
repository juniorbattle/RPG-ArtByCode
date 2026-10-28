# Journal de bord — archive : passe VP8 de la séance cloud « Version 2 » (2026-10-27 → 2026-10-28)

> Déplacée mot pour mot de `JOURNAL.md` le 2026-10-28 (Passe VP9) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe VP8 — Les places peaufinées : l'arène en fond, la lumière du jour, les props complétés (2026-10-27)

### La demande de l'opérateur, mot pour mot
- « Je laisse la liberté aux juges afin de peaufiner davantage notre rendu visuel afin d'optimiser les décors et aussi les lumières. Je pense
  que les lumières surtout en journée peuvent être encore plus optimiser mais il faut améliorer les détails de nos props car il y a certains
  trous de conception ( des parties manquantes ) mais la position des props doit aussi être optimale et enfin je veux intégrer une visibilité
  commune qui est la perception du grand colisee/arène de combat en fond arrière pour garde cet élément principale au jeu.  Je répète tu es
  libre d'agir en respectant notre plan et spécification établis », puis : « Tu peux prendre aussi tout le temps qu'il te faut pour accomplir
  ta mission. »
- Le cadre gardé : la direction de la Passe VP7 (un monument par place, le sol libre, 16 lumières au plus toutes allumées, trois cadrages
  par place), tout derrière `flags.v2`, la ville et la partie par défaut inchangées ; chaque nombre « proposé ».

### L'audit (deux agents, les captures de VP7) — [OK] une liste de trous, de positions et de défauts de lumière
- Deux agents ont relevé, place par place, sur des captures rapprochées (`plazaframe=`) et les six états de la critique : les trous de
  conception (« The front wall is simply missing for about two facets: no flaps or door frame », « No guy ropes, stakes » aux pavillons ;
  « the top is a plain white box, with no stool or ledger » chez le greffier ; « The fountain is dry » ; les braseros « empty bowls on bare
  thin poles, with no coals or flame » ; le tableau d'affichage et sa caisse au milieu du passage ; les bords des dallages « a staircase of
  whole flags with no kerb »), les positions (les braseros du ring posés sur ses coins ; une butte de tir devant une rue ; la table de banquet
  dans le passage vers la scène ; l'étal de bougies et le théâtre de marionnettes trop au large) et la lumière du jour (« every cast shadow,
  opening and window pane flattens to one textureless navy at about 21/255 », « canvas near clipping (95th percentile 243) », « a milky haze
  washes out the gate, the pavilions and the tower bases only about 20 m away »).

### Lot A : l'arène vue des autres places (`farArena`, `src/world/Plazas.ts`; `src/world/PlazaCamera.ts`) — [OK]
- Le parvis a l'arène pour monument ; l'entraînement et la place festive la voient maintenant au-dessus de leurs rangées nord : un demi-tambour
  de 52 m de rayon (la moitié tournée vers la place), dans la langue de la façade du parvis : deux étages d'arcades entre des piles, des
  cordons, une corniche crénelée, le mur intérieur de la cavea qui monte derrière jusqu'à 16,1 m, ses fenêtres, des mâts aux fanions du
  tournoi sur sa crête ; la nuit, des arches et des torches allumées sans lumière à elles (l'ambiance hors budget). Son centre à
  (∓20, −110), sur une butte de 8 m (`y0`). [KO] à sa hauteur sur un sol plat : les toits de 13-14 m à 45 m de la caméra le cachaient tout
  entier. Les maisons lointaines et les flèches à l'emplacement de l'arène ne sont plus construites (leurs tirages gardés : les graines
  inchangées).
- Les cadrages d'arrivée et du milieu de l'entraînement et de la place festive 2° plus bas (4,5° au lieu de 6,5°) : à 6,5°, le haut du cadre
  se tenait à 11° au-dessus de l'horizon, la ligne des toits, et l'arène n'était qu'un liseré. La surface de l'arène dans le cadre au-dessus
  des toits (1280 x 720, un script de travail qui projette la ligne des toits de chaque cadrage) : entraînement arrivée **20,9 k → 34,2 k
  px²**, milieu **16,2 k → 25,6 k**, ring 26,0 k (inchangé) ; place festive arrivée **39,0 k → 55,5 k**, milieu **27,9 k → 44,7 k**, scène
  2,8 k (le cadrage regarde la scène, au fond). Le test des cadrages (le héros dans le cadre et au-dessus du bord proche, aucun monument qui le
  cache ou que le bas du cadre coupe) passe aux nouveaux tangages.

### Lot A2 : l'arène vue du quai d'une partie de la version 2 (`skyline=arena`, `src/district/DistantCity.ts`) — [OK]
- La « visibilité commune » jusqu'au quai : dans le district, seul le plan d'ensemble A (le bout ouest du quai et l'arrivée) montre le ciel
  de la ville lointaine (B n'en montre qu'un coin en haut à droite, D aucun : captures de travail). Dans une partie de la version 2, l'arène se
  dresse sur la pente de la ville haute à la place de la cathédrale, à gauche du château, dans l'ouverture entre la rangée du quai et lui :
  un tambour de 24 m de rayon, trois étages d'arcades (les baies cintrées du matériau lointain, une par travée et par étage, éclairées la nuit
  comme ses fenêtres), des cordons, un attique et ses petites fenêtres, un parapet, seize mâts aux fanions bleus et or du tournoi ; dans le
  seul matériau de la ville lointaine.
- `skyline=arena`, posé par la page de jeu pour une partie de la version 2 seulement, à côté de `heraldry=tournament` ; absent = la
  cathédrale. La ville lointaine d'aujourd'hui est construite **octet pour octet** comme sur `main` (empreinte SHA-256 de ses tampons et de
  ses parties, `4e80a621…`, la même sur `main` et sur la branche) ; avec l'arène, toutes les autres parties (le château, la ville haute, les
  arbres après elle) gardent leurs sommets : ni tirage du générateur ni identifiant déplacé (`tests/v2-skyline.test.mjs`, quatre tests ; six
  fautes injectées, six prises, les fichiers rendus à l'octet près). Le test des emblèmes suit la ligne de `playTown.ts` qui pose les deux.
- Vu en jeu (la page de jeu, une partie de la version 2, le premier matin, `camera=A`) : l'arène au-dessus de la ville dans la brume du matin.

### Lot B : la lumière du jour (`src/world/PlazaApp.ts`) — [OK]
- Le soleil un peu plus bas contre le ciel (`PLAZA_SUN` : gain 1,18 → **1,05**), le remplissage du ciel, du sol et de la lumière d'appoint
  plus haut (0,86 → **1,5**, `uFillCol` compris), la saturation × **0,95** : les ombres portées et les ouvertures ne tombent plus à un bleu
  nuit uniforme, la toile des pavillons ne sature plus. DEV `plazasun=key,fill,sat` (porté par la page de jeu, comme `plazafog` et
  `plazadof`, que la page ne portait pas).
- La brume de jour à partir de 20 m et à la densité de l'état du jour (`PLAZA_FOG_DAY` ; la nuit garde 12 m et × 1,6) : la porte et les
  pavillons à 20 m ne sont plus voilés de lait.
- Les feux de jour : les braises, les flammes et les torches des travées de l'arène portent l'émission dans leur teinte, neuf fois
  (`fireTint`, l'équivalent de 0,55 au lieu des 0,06 de l'état du jour) ; les lanternes et les fenêtres restent éteintes (J4). [KO] l'émission
  du verre montée à 0,55 pour toute la page : les vitres des maisons s'allumaient en orange en plein jour (leurs cases d'intérieur éclairé).
- Les fenêtres et les colombages plus sombres de jour qu'en VP7 (pixels sous 25 : entraînement 1,3-3,2 % → 9,2-12,8 %, parvis 1,7-4,6 % →
  8,5-11,5 %) : c'était la brume qui les relevait ; le plan B de midi du district en a **13 %** (moyenne 101) : les places rejoignent sa
  valeur, les ombres portées relevées par le remplissage.
- Les flaques des braseros la nuit seulement (de jour, celle du ring « as blood » sur le sable ; celles des tours de la porte « stains »).

### Lot C : les props complétés — [OK]
- Les feux : une flamme pleine sur chaque brasero (`flameAt` : trois langues tournées autour de l'axe, chacune une lame qui s'amincit, les
  deux faces, dans le verre allumé de l'atlas, `aux.y` = 1, le scintillement des fenêtres du district) et des braises dans la case chaude de
  l'atlas ; une flamme vivante par-dessus (`Particles`, le mode `brazier` : les langues de la flamme de l'arène resserrées à la taille du bol,
  et ses braises qui montent ; un nouveau mode, que la ville et l'arène n'appellent pas). [KO] les lames sans coordonnées de texture : elles
  prenaient le bord sombre de l'atlas et brûlaient noir ; puis la case `HOT_UV` de la forge : elle traverse un barreau de plomb, une croix
  noire sur une lame d'un mètre. Le pied de chaque brasero évasé.
- Les pavillons : les deux pans de la porte rabattus contre la toile, quatre haubans et leurs piquets du côté opposé à la place ; de jour, la
  face intérieure de la toile et du toit à l'ombre à la place du panneau sombre qui bouchait la porte (« a black slab standing in the tent »).
- La fontaine du parvis : le tour du bassin et ses vasques dans le grain lisse du plâtre (le grain de pierre en faisait « a wire grid » ;
  remis dans la pierre à l'itération 1, ci-dessous) ; l'eau qui tombe des deux vasques en gouttes (`Particles`, le mode `spray` : huit becs par vasque, des gouttes d'un bleu pâle qui gardent
  leur couleur jusqu'à l'eau). [KO] des filets pleins (dix-huit de 3 cm, puis dix de 1,8 cm) : « a white cage » autour des vasques.
- Le greffier : son registre ouvert, un encrier, un rouleau et son tabouret ; la guérisseuse : une poutre de façade, un lambrequin festonné,
  une toile de fond (retirée à l'itération 1), sa lanterne au coin de l'auvent ; le tableau d'affichage et sa caisse contre la rangée ouest (ils barraient le passage) ;
  le réverbère du milieu et la charrette du parvis retirés.
- Les dallages : les demi-dalles des bords gardées et une bordure de pierre plus sombre de chaque côté (retirées à l'itération 1).
- L'entraînement : les buttes de tir plus épaisses (deux cordes, une jambe de force, un rebord), la tribune fermée à ses bouts par des
  planches en escalier et un garde-corps au dos, les cordes du ring qui fléchissent, les poteaux de son ouverture coiffés, les limons des
  marches, la porte de l'enclos du mannequin ouverte ; le seau, le tonneau et les bottes de paille rangés au pied des rangées, la paille
  éparse plus pâle.
- La place festive : le kiosque fermé au fond par une toile or et ivoire, les haubans de la scène piquetés, les tambours cerclés et tendus ;
  le théâtre de marionnettes avec son décor peint, ses rideaux rouges, deux marionnettes et un petit toit, au pied de la rangée ouest ; la
  table de banquet tournée hors du passage vers la scène (et les points de foule de midi à la nuit avec elle) ; l'étal de poteries et celui
  des bougies au pied de la rangée est. [KO] l'étal de bougies avancé à z −4,9 puis −3,9 : il cachait la tête du héros à l'entrée de la rue
  est depuis le cadrage de la scène (le test des cadrages) ; remis à −3,4.

### La première critique à l'aveugle (VP8 contre VP7), deux agents — [?] la place festive devant, l'entraînement à égalité, le parvis derrière
- Les planches : les six états de la critique (les places à l'arrivée et au milieu, de jour et de nuit) de VP7 (`e540e53`) et de VP8,
  la planche cachée du district et R, sous des lettres tirées au sort.
- Panneau A (le district caché 7,5, R 8) : parvis VP7 **7** / VP8 **6**, entraînement **6** / **6,5** (« The arena on the skyline is the
  structural improvement the yard needs »), place festive **6,5** / **7** (« The arena adds a landmark and a depth layer, and the puppet booth
  adds story »). Panneau B (le district caché 7,5, R 8) : parvis **7** / **6,5**, entraînement **6** / **5,5**, place festive **6,5** / **7**.
- Ce qui a coûté à VP8 : la fontaine dans le grain du plâtre (« untextured white and looks like a placeholder; at night it glows like a
  lamp »), le dallage aux demi-dalles et à la bordure (« a ruler-edged rectangle that reads like a rug » ; la ligne brisée de VP7 « fade[s]
  into the cobbles naturally »), les flammes pleines de jour (« flat orange cones that read as traffic cones »), la toile du fond de la
  guérisseuse (« a closed white box »). Demandé aussi : le terrain d'entraînement strié (« horizontal streaks, as if the texture were
  stretched along the view »), la foule devant les marches du ring, la porte du parvis sans silhouette contre le ciel (« Reframe (lower the
  pitch or pull back) so the tower tops and battlements stand against the sky »). Dans le district caché : la rive opposée du plan
  d'ensemble, « a row of blank grey boxes » (district gelé).

### Itération 1 — [?] les retours de la critique
- Remis comme en VP7 : la fontaine dans le grain de la pierre (ses gouttes gardées), le dallage aux bords brisés sans bordure, la
  guérisseuse sans toile de fond (sa poutre et son lambrequin gardés).
- Les braseros : la flamme pleine la nuit seulement ; de jour, les braises (la teinte du feu) et la flamme vivante des particules.
- L'entraînement : le grain fin de la terre (la grenaille, le bruit fin et celui des normales) s'efface où il devient plus fin qu'un ou deux
  pixels (`fwidth`, comme les traits du râteau ; sous `SAND` seulement, la terre de l'entraînement) ; les points de foule devant les marches
  du ring déplacés sur les côtés (matin, midi, fin de journée).
- Le parvis : l'arrivée et le milieu 2° plus bas (4,5°), comme les deux autres places : la crête crénelée de la porte contre le ciel.
  [KO] d'abord : l'étal de l'armurier cachait la tête du héros à l'entrée de la rue est (le test des cadrages) ; l'étal 2 m plus au sud, le
  râtelier au nord de lui, l'armurière avec lui : le pavillon est dégagé (le point de l'audit) et le test passe.
- La place festive la nuit : l'étal du potier, au bord droit du cadre, éteint (« a large warm haze floods the right edge, and nothing
  visible is big enough to cast it »). Les lumières de nuit : parvis 15, entraînement 16, place festive 15 (VP7 : 16 / 15 / 16), toutes
  allumées, aucune au-delà de 16 dans un cadrage.
- Le TournamentLab (30 graines, oisif et diligent, règles d'aujourd'hui et dynamiques) : **identique** à `main` (`e540e53`).

### La deuxième critique à l'aveugle (itération 1 contre VP7), deux agents — [OK] VP8 devant sur les trois places, pour les deux panneaux
- Panneau C (le district caché 7,5, R 8) : parvis VP7 **6,5** / VP8 **7** (« The flagpoles and the lit braziers are its only differences,
  and both help »), entraînement **5,5** / **6** (« The lit braziers give the night its only real focal points, the arena backdrop gives
  the place an identity »), place festive **6** / **6,5** (« The arena ties the square to the tournament and adds a far layer »).
  Panneau D (le district caché 7,5, R 8) : parvis **6,5** / **7**, entraînement **5,5** / **6**, place festive **6** / **6,5**.
- L'écart moyen (VP8 − VP7) : premier tour parvis −0,75, entraînement 0, place festive +0,5 ; deuxième tour **+0,5** partout.
- Ce qui reste, commun aux deux panneaux : l'arène coupée par le haut du cadre (« it reads as a band of stone rather than a colosseum »,
  « Frame its rim and push it back with haze ») ; la façade de la porte la nuit, « a flat ambient-blue wall over the whole upper half, lit
  only by the portcullis glow » ; le sol vide du bas des cadres (la direction de VP7 le garde libre) ; la terre de l'entraînement encore
  « smeared », son bord avec les pavés ; la rive opposée du plan d'ensemble du district (gelé).

### Itération 2 — [?] l'arène sous une bande de ciel, la porte éclairée de l'intérieur la nuit
- L'arrivée et le milieu de l'entraînement et de la place festive à **3°** (au lieu de 4,5°), l'arène plus basse : sur une butte de 4,5 m
  (au lieu de 8), au centre (−20, −115) derrière l'entraînement et (20, −110) derrière la place festive. Le script de la ligne des toits :
  sa crête **12 à 28 px sous le haut du cadre** (720 lignes) dans les quatre cadrages, au lieu de coupée de 29 à 70 px ; sa surface au-dessus
  des toits : entraînement 23,4 k / 22,5 k px², place festive 36,4 k / 31,9 k (coupée, avant : 34,2 k / 25,6 k et 55,5 k / 44,7 k). Le
  plan du monument (le ring, la scène) n'est pas changé. Le test des cadrages passe à 3°. [KO] 2° : à l'entraînement, ses maisons hautes
  coupent toujours l'arène ; la reculer (−125 à −160 m) sans la hausser : elle passe sous les toits.
- La porte du parvis la nuit : une lumière basse au fond de quelques arches de l'étage (au-dessus des tunnels éclairés, deux et quatre
  travées de la porte), sans lumière à elle (l'ambiance hors budget), qui s'éteint vers le haut (la teinte par sommet, `aoY`, que le verre
  multiplie). Pensée : une boîte du verre sans coordonnées de texture prend le bord de l'atlas (`boxUV` hors de [0, 1], bloqué au bord,
  la bordure sombre des cases) : les tunnels « éclairés la nuit » depuis VP6 étaient noirs ; avec la case chaude, d'abord des rectangles
  orange saturés (« red slab », troisième critique de VP6), puis le dégradé. Les arches et les torches de l'arène lointaine de même.

### La troisième critique à l'aveugle (itération 2 contre VP7), deux agents — [OK] VP8 devant sur les trois places, pour les deux panneaux
- Panneau E (le district caché 7,5, R 8) : parvis VP7 **6,5** / VP8 **7** (« The torches give the motivated amber accent [...] the gate now
  holds at night »), entraînement **5,5** / **6** (« there is now a back layer, and the flames at night give the light a source »), place
  festive **6** / **6,5**. Panneau F (le district caché 7,5, R 8,5) : parvis **6** / **6,5**, entraînement **5,5** / **6**, place festive
  **6,5** / **7** (« It has a finished foreground layer, a skyline, and warm lamps close to the camera »).
- L'écart moyen (VP8 − VP7) : **+0,5** sur chaque place, pour la deuxième fois.
- Ce qu'ils reprochent aux changements de l'itération 2 : les lumières des arches de l'étage, au bord du cadre, « saturated red lit slits
  [...] read as a bug » ; de jour, le dessus des braseros « orange discs, not fire » ; une lanterne du bord proche coupée par le bas du cadre
  (à 3°) ; la balustrade de la place festive, de jour, « the brightest and largest object in frame » ; les verts et le rouge du théâtre de
  marionnettes hors de la palette ; le bord de la terre et des pavés, « a noisy, jagged blend rather than a built edge ».

### Itération 3 — [?] les retours de la troisième critique
- Retirées : les lumières des arches de l'étage du parvis. Les tunnels gardent la leur, ambrée et plus faible.
- Les braises de jour à trois fois l'émission du jour au lieu de neuf : des braises sous le soleil, pas des disques orange.
- Le bord proche en pierre un tiers plus sombre de jour (« Bring the balustrade's value down by about 30% »).
- Le théâtre de marionnettes : son décor peint en ivoire et or, ses rideaux en bleu du tournoi.
- L'entraînement : une bordure de traverses de bois le long du côté sud de la terre (la voie de la porte du quai ouverte), le bord de la terre
  moins effrangé dans le shader (sous `SAND`) ; les deux lanternes intérieures de la barrière (sans lumière) retirées ; les points de foule de
  la nuit écartés des braseros du ring (« At night a flame sits against an NPC's body »).

### La quatrième critique à l'aveugle (itération 3 contre VP7), deux agents — [KO] VP7 devant de jour pour les deux panneaux
- Panneau G (le district caché 8, R 8,5) : parvis VP7 **6,5** / VP8 **6** (« Only the grade differs, and W's sunlit stone with blue shadows
  matches R. D is grey and brown »), entraînement **6** / **6** (« L keeps the stage clear and the arena wall on the skyline »), place festive
  **6** / **6,5** (« F keeps the arena wall, shows less dead floor »). Panneau H (le district caché 7,5, R 8) : parvis **6,5** / **6**,
  entraînement **6,5** / **5,5** (« The cobble and sand meet in a straight seam with black edge slabs: an exposed geometry edge » ; VP7 :
  « the cobble and sand join is ragged and scattered »), place festive **7** / **6,5** (« The hazier, bluer midday is closest to R's »).
- Pensée : les deux panneaux de ce tour lisent la différence de lumière du jour que les tours 2 et 3 préféraient (« A's shadows also stay
  truly dark, while M's day is milky with lifted shadows ») comme un défaut ; l'écart d'un tour à l'autre sur les mêmes planches de VP7 (le
  parvis de VP7 6 à 7 selon le tour) dit le bruit : une demi-note sur deux panneaux n'est un signal que si elle se répète. Ce qui se répète
  ici : les ombres de jour « grey and brown » (le rebond chaud du sol relevé avec le ciel) et les braseros de jour (« red caps look like
  plastic »). La bordure de bois : un panneau la veut (« Put a timber or stone curb », tour 3), l'autre la rejette sombre (tour 4).

### Itération 4 — [?] des ombres bleues de jour, les braseros en fer de jour
- La lumière du jour des places : le remplissage du ciel et la lumière d'appoint à × 1,5, le rebond du sol à × 0,95 (au lieu de 1,5 pour les
  trois), la saturation × 1 (au lieu de 0,95) ; la brume de jour à partir de 16 m, × 1,25 la densité de l'état du jour (au lieu de 20 m et
  × 1). DEV `plazasun=key,sky,ground,sat`. Saturation moyenne de la première vue (HSV, 320 x 180) : parvis VP7 0,329, itération 3 0,273,
  itération 4 **0,305** ; entraînement 0,380 / 0,375 / **0,398** ; place festive 0,335 / 0,315 / **0,345** ; le plan B de midi du district
  0,379.
- Les braseros de jour : des cendres (une boîte sombre) sur le bol, sans braises qui brillent ; leur flamme vivante est celle des particules
  (`brazier`), en jeu ; la nuit comme avant.
- La bordure de l'entraînement en bois clair, vieilli (sombre, « black edge slabs ») ; le bord de la terre un peu plus effrangé.

### La cinquième critique à l'aveugle (itération 4, l'état final, contre VP7), deux agents — [?] la place festive et l'entraînement devant, le parvis à égalité
- Panneau I (le district caché 7,5, R 8) : parvis VP7 **7** / VP8 **6,5** (« T is better, by a small margin. It has a warm key light on the
  stone, a cool shadow fill and more atmosphere »), entraînement **5,5** / **6** (« Y is better. It keeps the arena context, its braziers
  are lit, and its focal ring is unobstructed »), place festive **5,5** / **6,5** (« The arena's curved wall and pennant poles on the
  skyline place the square in the tournament city »). Panneau J (le district caché 8, R 8,5) : parvis **6,5** / **6,5**, entraînement
  **6** / **6,5**, place festive **6** / **6,5**.
- L'écart (VP8 − VP7) des cinq tours, moyenne des deux panneaux : parvis −0,75, +0,5, +0,5, −0,5, −0,25 (**−0,1** en moyenne) ;
  entraînement 0, +0,5, +0,5, −0,5, +0,5 (**+0,2**) ; place festive +0,5, +0,5, +0,5, 0, +0,75 (**+0,45**).
- Demandé encore, à tous les tours : meubler le sol du bas des cadres (« Dress the near third of the frame (cart, well, benches, tree,
  crates) ») — la direction de VP7 le garde libre, la décision de l'opérateur ; la façade de la porte plus profonde ; des flaques de lumière
  sous les guirlandes la nuit ; la terre de l'entraînement « at texel scale » ; la rive opposée du plan d'ensemble du district (gelé).

### L'archivage du journal — [OK]
- `JOURNAL.md` dépassait 60 Ko (141 Ko) : la Passe VP7 (fusionnée, `e540e53`) déplacée mot pour mot dans
  `journal/33-passes-VP7.md` (un en-tête, une ligne `---`, puis les octets inchangés), sa ligne ajoutée à l'index. Preuve : le corps archivé
  égale les octets retirés (SHA-256 `24df829eea736cbc…` des deux côtés, 36 128 octets), le même bloc que celui de `main` ; chaque section VP
  dans un seul fichier (les doublons de noms connus, V0 à V3, C1, C2, V5, sont antérieurs) ; pas de CRLF, ni avant ni après.

### Les preuves finales de la Passe VP8 — [OK], quelques pixels du résidu connu en [?]
- Sur un instantané figé de l'état final (`d3e5d42`, servi sur un port à part), contre `main` (`e540e53`) servi sur un autre :
  - la visibilité des places, élaguée contre `vis=0`, sans personnages, six états, douze places du héros : **1 px différent sur 72 vues**
    (écart 1 sur 255, la place festive la nuit au coin ouest ; VP7 : 2 px). Cuissons neuves : parvis 427 poses, entraînement 501, place
    festive 565 (54-64 s en rendu logiciel, deux pages à la fois) ;
  - le quai, élagué contre `vis=0` (A1, A2, le passage A-B, B, D ; de nuit et à midi) : la ville d'aujourd'hui et la ville d'une partie de
    la version 2 (`skyline=arena`) **identiques de nuit** (A1 40 px, A2 3 px, le résidu du district, sur `main` aussi) ; à midi, avec
    l'arène, A1 59 px au lieu de 54, A2 9 au lieu de 5, A-B 6 au lieu de 4. `vis-why` (1920 x 1080) : A2 8 px (écart 4, dont 4 décidés par
    l'ordre de tracé), A-B 7 px (écart 5, dont 3) ; les 32 parties « manquées » remises dans l'ensemble actif n'y changent rien (des maisons
    de la ville lointaine vues dans le miroir, plus fines qu'un pixel de la cuisson ; l'arène n'en est pas) : la classe de résidu connue
    (Passe 5b), [?] ;
  - le district contre `main` : A à D de nuit et à midi, B avec son panneau, **identiques au pixel** (9 sur 9) ;
  - `play-flow` par défaut et `V2=1` : « all checks passed », aucune erreur de page ; l'écran titre (`title-proof`) : ses trois
    comparaisons identiques au pixel ;
  - les sorties des places et du quai parcourues dans les deux sens (`exits-proof`, « every way walked both ways ») sur l'instantané de
    l'itération 2 (`ca9ec48`) ; les voies, les sorties et leurs points d'arrivée n'ont pas changé depuis.
- Le TournamentLab (30 graines, oisif et diligent, règles d'aujourd'hui et dynamiques) : identique à `main`.
- `npm test` 278 sur 278 (dont `tests/v2-skyline.test.mjs`, six fautes injectées, six prises), `npm run typecheck`, `npm run build`,
  `npm run art:validate` (0 erreur).

### Conclusion de la Passe VP8 — [?] la demande faite ; à l'aveugle, la place festive et l'entraînement devant VP7, le parvis à égalité
- La « visibilité commune » de l'arène : vue de chaque lieu d'une partie de la version 2 : le monument du parvis ; au-dessus des rangées
  nord de l'entraînement et de la place festive, sa crête sous une bande de ciel (les cadrages d'arrivée et du milieu à 3°) ; sur la pente
  de la ville lointaine du quai, dans le plan d'ensemble, à la place de la cathédrale (`skyline=arena`). La ville d'aujourd'hui est
  construite octet pour octet comme sur `main`.
- La lumière du jour : le soleil un peu plus bas, le ciel plus haut, les ombres bleues, la brume de jour plus loin ; les feux qui brûlent
  de jour (les tunnels de l'arène) portent leur lumière dans leur teinte, les lanternes et les fenêtres éteintes (J4) ; les braseros en fer
  de jour, leur flamme vivante (les particules) en jeu.
- Les trous de conception comblés : les flammes et les braises des braseros (et les verres sans coordonnées de texture qui brûlaient noir),
  les pans et les haubans des pavillons et leur intérieur, l'eau de la fontaine, le registre et le tabouret du greffier, la façade et le
  lambrequin de la guérisseuse, les buttes de tir, la tribune, les cordes et les marches du ring, la toile du kiosque, les haubans de la scène,
  les tambours, le théâtre de marionnettes, la bordure de la terre d'entraînement. Les positions : le tableau d'affichage hors du passage,
  l'étal de l'armurier qui cachait un pavillon et le héros, les braseros hors des coins du ring, la table de banquet hors du passage vers la
  scène, la foule hors des marches du ring et des braseros, les lanternes coupées par le bas du cadre retirées.
- À l'aveugle, cinq tours de deux panneaux contre VP7 : la place festive **+0,45** en moyenne, l'entraînement **+0,2**, le parvis **−0,1**.
  Pensée : d'un tour à l'autre, la même lumière de jour est louée puis reprochée (« A's shadows also stay truly dark » ; « D is grey and
  brown ») ; seuls les écarts qui se répètent sur plusieurs tours ont été suivis. Ce que les juges demandent à chaque tour et que la direction
  refuse : un sol meublé. La revue de l'opérateur en jeu décide.

