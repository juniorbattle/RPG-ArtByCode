# Journal de bord — archive : passes V0 à V3 (2026-10-18)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-10-19 (Passe T1) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe V0 — Variantes de PNJ (cheveux / peau) : analyse des palettes, proposition (2026-10-18)

### Demande
- Quatrième point des priorités (Passe M5) : « les variantes de PNJ » ; demande de l'opérateur du 17/10 citée mot pour mot dans « À
  reprendre » §1 (couleurs de cheveux et de peau différentes). Branche `npc-variants` ouverte depuis `main` (`3a7c242`).

### Analyse — [OK] mesurée ; [KO] une permutation de couleurs seule
- `tools/art-lab/palette-ramps.mjs` : pour chacune des dix feuilles de production (64 couleurs chacune), chaque couleur comptée sur toutes les
  images et située dans la hauteur de la figure ; classement proposé : « peau » (teinte 8-45°, saturation 0,18-0,65, valeur ≥ 0,42), « cheveux »
  (≥ 75 % des texels dans le tiers haut, hors peau). Planche : `reviews/npc-variants-v0/palette-ramps.png` (vue de face, puis cheveux / peau /
  autres).
- Constat : les rampes de cheveux sortent nettement pour l'artisane (11 couleurs), le voyageur (8) et le coursier (7) ; ailleurs le « tiers
  haut » attrape une coiffe, un bonnet, un casque ou une capuche (forgeron, docker, gardes, encapuchonné, marchande, citadine ; vieux
  marchand : 0). Les 17 à 33 couleurs « peau » mêlent peau, cuir, bois et reflets de cheveux bruns : mêmes teintes. Une permutation de palette
  par couleur recolorerait aussi ceintures, sacs et coiffes : la piste « rampes de cheveux et de peau, à l'affichage, sur la même feuille »
  (« À reprendre » §1) ne tient pas sans masque.

### Proposition (à arbitrer par l'opérateur)
- Un **masque de matière** par feuille (cheveux, peau), calque du `.aseprite` construit par le script de rig (rejouable), exporté à côté de la
  feuille et haché dans son paquet de provenance ; au chargement, il est rangé dans le canal alpha de la texture cuite (255 = autre, 254 =
  cheveux, 253 = peau : le test d'alpha à 0,5 ne voit rien, l'export approuvé n'est pas modifié).
- Au rendu : un indice de variante par instance et une table de rampes (cheveux, peau) appliquée par rang de luminance sur les seuls texels
  masqués. Aucune image ajoutée à la texture cuite (322 / 336), aucun appel de dessin en plus.
- Une variante n'atteint la production qu'approuvée par l'opérateur, comme une feuille (manifeste ou fichier de variantes approuvé).

### Restes [?]
- **En attente de l'opérateur** : quels personnages, combien de variantes, quelles familles de teintes dans la direction artistique, et
  l'accord sur le masque.

### Pensée
- Une palette quantifiée depuis une peinture partage ses couleurs entre matières : recolorer « une rampe » demande de savoir où elle est, pas
  seulement quelle couleur elle a.

## Passe V1 — Variantes de PNJ (cheveux / peau) : masques de matière, recoloration au rendu, porte d'approbation (2026-10-18)

### Décisions de l'opérateur (2026-10-18), mot pour mot
- Personnages : « Les 5 citadins (Recommandé),Les gardes,Le docker,Les PNJ uniques aussi ». Nombre : « 2 variantes (Recommandé) ». Cheveux :
  « Noir / brun foncé,Châtain / auburn,Blond cendré,Gris / blanc ». Peau : « Claire à foncée (Recommandé) ». La question proposait un masque de
  matière par feuille, « tiré du fichier Aseprite par le script de rig ».
- Branche `npc-variants-v1` ouverte depuis `main` (`709c6a1`).

### Masques — [KO] par couleur seule ; [OK] zones grossières + règles de couleur + propagation
- **[KO]** Règles de couleur seules (teinte, saturation, valeur, part dans le tiers haut) : la peau, le lin et le cuir clair partagent teintes et
  saturations dans les palettes de 64 couleurs (coursier : peau `f8c59e` s 0,36, chemise `f6d2b0` s 0,28) ; les coiffes, casques et capuches
  tombent dans « cheveux ».
- **[KO → écarté]** Propager un calque de masque par les opérations du script de rig : rotations RotSprite (EPX sur les couleurs) et membres
  peints ; trop fragile.
- **[OK]** `src/characters/Variants.ts` (`sheetMasks`) : sur l'image 0 du repos de chaque vue (face, dos, profil), des zones grossières en
  texels (cheveux ; peau : visage et mains) et des règles de couleur dedans (peau : teinte 5-45°, saturation ≥ 0,22 près d'une manche de lin,
  ≥ 0,1 ou 0,05 pour un visage ou des mains sans lin à côté, valeur ≥ 0,55 ; cheveux : chauds et saturés, ou tout sauf le contour ; contour :
  valeur < 0,25, jamais recoloré) ; les autres images d'une vue prennent, texel par texel, la matière du texel de même couleur le plus proche
  de la vue de référence, à 3 texels au plus. Zones posées sur des vues quadrillées des dix feuilles (`art-lab/characters/variants/variants.json`) ;
  revue sur toutes les images (`tools/art-lab/variant-masks.mjs`). Le vieux marchand garde ses cheveux et sa barbe gris (peau seule) ;
  l'encapuchonné n'a que menton et mains.
- Le dessin reste intact : la feuille approuvée et son `.aseprite` ne changent pas (alpha binaire contrôlé par `checkBakedSheet`) ; l'atlas
  range la matière dans l'alpha de **sa** texture (255 autre, 254 cheveux, 253 peau) après ses contrôles.

### Rendu — [OK]
- `BODY_FRAG` : un texel masqué prend la couleur de la rampe cible à son rang de luminance (lumière linéaire) dans la plage de sa matière sur
  la feuille, puis l'éclairage habituel ; rampes de 5 arrêts dans une petite texture (une ligne par rampe). Attributs d'instance `iVarA` /
  `iVarB` ; aucun appel de dessin, aucune image de la texture cuite en plus (322 / 336).
- Variante d'un acteur (`variantOf`) : depuis son identifiant (0 = l'original), ou fixée par archétype (`guardB` : 1, les gardes ne sont plus
  jumeaux) ; aucun tirage aléatoire (graines intactes).

### Porte — [OK]
- Le fichier de variantes n'est appliqué en production que s'il est approuvé (`approved: true`, `approval` : qui, quand) ; il porte alors
  l'empreinte des masques de chaque feuille, vérifiée au chargement (refus sinon). DEV : `?variants=candidate` montre le fichier non approuvé.

### Propositions soumises à l'opérateur (à approuver)
- Rampes (5 arrêts sRGB, sourdes, nuit) : cheveux `dark`, `chestnut`, `auburn`, `ash` (blond cendré, réchauffé après une première version
  qui se lisait verdâtre à côté des peaux orangées), `grey` ; peaux `light`, `medium`, `tan`, `dark`.
- Deux variantes par feuille (table du fichier), planche `reviews/npc-variants-v1/lineup.png` ; les PNJ uniques (marchande, forgeron,
  encapuchonné) gardent l'original tant que l'opérateur n'en fixe pas un.

### Preuves
- Jeu par défaut (fichier non approuvé) contre `main` figé (`709c6a1`), avec personnages, harnais déterministe, A / B / C / D : **0 px, écart
  max 0**. **[KO → corrigé]** d'abord 14 572 px en A, sur les seuls personnages : la texture des rampes, créée au démarrage, tire
  `Math.random` pour son uuid ; sous graine, chaque tirage suivant (les phases d'animation des PNJ à leur apparition) se décalait. Elle n'est
  plus créée qu'au premier acteur qui montre une variante.
- **[KO → corrigé]** l'atlas revalide les feuilles (`checkBakedSheet` : alpha 0 ou 255) : des matières écrites dans les images refusaient le
  chargement (`?variants=candidate`). Les matières vont à côté de la feuille (`BakedSheet.materials`) et l'atlas les écrit dans sa texture
  après ses contrôles.
- `?variants=candidate` contre le défaut : A 4 452 px, B 14 066, C 10 255, D 484 (> 8 niveaux), uniquement sur des personnages.
- Remarque de l'opérateur pendant la revue, mot pour mot : « Il y a quelques imperfections sur les pnjs sprites surtout concernant les sprite
  avec la peau plus fonce ». Vu au zoom : lèvres, reflets pâles, ombre saturée d'une joue ou d'une oreille, mèche claire restés à la couleur
  d'origine (hors règle de couleur). Corrigé par un remplissage (deux passes : un texel hors contour entouré de peau, 4 voisins sur 8, devient
  peau ; entouré de cheveux, 5 sur 8, devient cheveux) et deux zones de visage élargies (docker : l'oreille ; voyageur : la bouche). Restent :
  un trait rosé sous la bouche du voyageur, quelques texels pâles à l'épaule du forgeron de profil.
- Empreintes actuelles des masques (à inscrire au fichier à l'approbation) : artisane `01e8ce61`, forgeron `84d39b5d`, coursier `306ddcde`,
  docker `237d92c3`, garde `6db9d991`, encapuchonné `50f2dcdf`, marchande `31ff3147`, vieux marchand `67922527`, citadine `20b824bb`, voyageur
  `459616b1`.
- Tests : `tests/variants.test.mjs` (7 : zones et règles, propagation à 3 texels et pas au-delà, empreintes, `variantOf`, plages et rampes,
  fichier de variantes, porte : non approuvé = rien, candidat = appliqué, alpha binaire gardé dans les feuilles, approuvé à mauvaise empreinte =
  refus) ; `npm test` 35 / 35 ; `typecheck`, `build`, `art:validate`.
- Performances (`tools/perf.mjs`, 2 tours, sans contention) : B 10,48 → 10,12 ms, C 10,11 → 10,45 ms avec les variantes : dans le bruit.
- Planches : `reviews/npc-variants-v1/lineup.png` (original + 2 variantes, face et profil, sans éclairage), `reviews/npc-variants-v1/masks.png`
  (masques sur les images de repos et de marche).

### Pensée
- Une palette quantifiée depuis une peinture partage ses couleurs entre matières : où est la matière se dit par une zone, quelle couleur elle
  prend se dit par une règle ; la propagation par « même couleur, tout près » suit les petits déplacements des images d'un cycle.
- Une métadonnée d'affichage (la matière) ne réécrit pas l'asset approuvé : elle vit à côté (fichier approuvé, empreinte) et entre dans la
  texture du moteur, pas dans l'export.
- **[KO] méthode** : modifier `variants.json` et `Variants.ts` pendant une série de captures a rechargé les pages du serveur de dev en cours de
  capture (écarts et délais) : la règle « ne rien modifier de ce que sert le serveur pendant une série » vaut aussi pour les données.

## Passe V2 — Variantes de PNJ : approbation de l'opérateur, correction des masques signalée par lui (2026-10-18)

### Complément de la Passe V1
- V1 fusionnée en avance rapide (`ecf997d`) ; production inchangée tant que le fichier de variantes n'était pas approuvé.

### Décisions de l'opérateur (2026-10-18), mot pour mot
- Après la planche, la comparaison en scène (B) et les gros plans des peaux foncées : production — « Oui, approuve » ; PNJ uniques —
  « Originaux partout » (marchande, forgeron et encapuchonné fixés à leur original).
- Puis, en voyant le voyageur à cheveux foncés : « il semble avoir une erreur pour ce pnj avec sa tete ses cheveux . peux tu verifier ».
- Branche `npc-variants-approval` ouverte depuis `main` (`ecf997d`).

### Correction — [OK]
- Cause : la frange du voyageur, orange comme sa peau, tombe dans la zone du visage ; la règle de peau y passait avant celle des cheveux et
  prenait ses mèches claires pour de la peau : sur une variante, une frange à moitié couleur peau, rayée de mèches sombres.
- Règle de frange (`referenceMask`) : là où zone de cheveux et zone de peau se chevauchent, une couleur rencontrée comme cheveux hors du
  visage au moins aussi souvent que dans le chevauchement reste cheveux. Revue des dix feuilles : elle a fait apparaître deux défauts, corrigés
  par réglage de feuille : une tache sombre sous le menton de l'artisane (ombre du cou prise pour des cheveux : zone en sommet de tête +
  mèches latérales) ; des points bruns sur les bonnets de la citadine et de la marchande (ombres chaudes de la toile : plafond de valeur des
  cheveux `hairMax` 0,7 / 0,72, zones de cheveux de la marchande sous le bonnet).
- Planches : `reviews/npc-variants-v2/traveler-fringe-before-after-x5.png`, `lineup.png`, `masks.png`.

### Approbation inscrite
- `art-lab/characters/variants/variants.json` : `approved: true`, `approval` (opérateur, 2026-10-18, phrases citées, correction des masques
  rapportée), empreintes des masques corrigés par feuille (artisane `eddf88c9`, forgeron `222f8949`, coursier `4056437b`, docker `09fbb257`,
  garde `2bd58755`, encapuchonné `50f2dcdf`, marchande `8c0a3135`, vieux marchand `67922527`, citadine `a7936a07`, voyageur `54d62bc3`),
  vérifiées au chargement. Pas un Gold Master.

### Preuves
- Rendu de production (fichier approuvé, sans paramètre) contre `main` (`709c6a1`, sans variantes), harnais déterministe : A 3 445 px,
  B 10 379, C 10 094, D 468 (> 8 niveaux), uniquement sur des personnages ; la marchande (fixée) reste à l'identique.
  `reviews/npc-variants-v2/B-production-main-vs-variants.png`.
- Tests : `tests/variants.test.mjs` (8 : le fichier approuvé du dépôt se charge en production avec ses propres empreintes, variantes et
  fixations) ; `npm test` 36 / 36 ; `typecheck`, `art:validate`.

### Confirmation de l'opérateur (2026-10-18) — [OK]
- Masques corrigés montrés (voyageur avant / après, rendu de production en B, planche complète) ; réponse, mot pour mot : « Oui, fusionne ».

### Pensée
- Deux matières de même teinte qui se recouvrent (une frange rousse sur une peau claire) se départagent par l'endroit où chaque couleur se
  rencontre seule (le haut de la tête), pas par sa couleur.
- Une règle générale corrigée se revérifie sur toutes les feuilles : elle crée ses propres défauts ailleurs (cou, bonnets).

## Passe V3 — PNJ : trois restes mineurs corrigés (voyageur, forgeron, docker), approuvés par l'opérateur (2026-10-18)

### Demande (2026-10-18)
- Transmise par la séance « Priorités artistiques » (séance parente), à traiter tout de suite dans une séance à part : trois des quatre restes
  mineurs qu'elle avait listés : le trait rosé sous la bouche du voyageur et les texels pâles à l'épaule du forgeron de profil (« À
  reprendre » §1, Passes V1 / V2), le cycle de marche irrégulier du docker (Passe S2). Pour les deux premiers, dire d'abord si la cause est le
  masque ou la feuille.
- Le quatrième est écarté par l'opérateur, mot pour mot : « les bras immobiles des citadins quand ils marchent n'est pas une priorites dans notre strucutre HD-2D, ce n'est pas problematique ».
- Branche `npc-minor-fixes` ouverte depuis `main` (`c5e7836`) après `git fetch --prune` (aucune autre branche), poussée.

### 1. Voyageur, trait rosé sous la bouche — [OK] le masque, pas la feuille
- De face, l'ombre du menton (4 texels de la rangée 36, `703638` / `5d403a` : teinte 358° / 10°, valeur 0,44 / 0,36) est trop rouge et trop
  sombre pour la règle de peau, et le remplissage ne la prend pas (3 voisins de peau sur 8, il en faut 4) : sur une variante, elle gardait son
  rouge d'origine sous un menton foncé. Visible en scène (B, graine 1842, voyageur à cheveux foncés). Sur l'original, c'est l'ombre du cou :
  la feuille est juste.
- Correctif : option de masque `force` (`Variants.ts`) : par vue, des rectangles relevés à la main où tout texel ni contour ni exclu prend
  une matière, dans la vue de référence, après les règles et le remplissage (puis propagé aux autres images comme le reste). Voyageur : ces 4
  texels en peau ; la couleur `665963` (gris-violet du foulard) exclue : la propagation la prenait pour de la peau dans le foulard sous le
  menton (images d'inspiration / d'expiration) ; de profil, la zone des cheveux s'arrête à la rangée 31 au lieu de 34 : le bas du menton
  (6 texels) passait en cheveux (une ligne sombre ou châtain sous la bouche selon la variante), le haut du sac (13 texels) aussi.
- Empreinte du masque `54d62bc3` → `0e6e3b03`.

### 2. Forgeron, texels pâles à l'épaule de profil — [OK] le masque : la manche était peinte en peau
- La planche de référence archivée montre une chemise crème à manches courtes sous le tablier, avant-bras nus. Les zones de peau des bras
  partaient de l'épaule (saturation minimale 0,05) : sur une variante, la manche entière devenait peau ; les gris pâles du col (`e0d3cf`,
  `d4c5bf`, `c3b2b1`), pris en partie ou juste hors des zones, restaient pâles : ce sont les « texels pâles à l'épaule ». Élargir la zone
  pour les rattraper aurait aggravé l'erreur.
- Correctif : bras de face et de dos en saturation minimale 0,35 (toile ≤ 0,33, peau ≥ 0,39 sur cette feuille) ; de profil, où la toile et le
  reflet de l'avant-bras partagent `edd1b4`, une zone d'avant-bras sous l'ourlet (rangée 51 à 0,35, rangées 52-66 à 0,05) ; les gris pâles du
  col et du bandeau exclus. Manches et col gardent leur toile dans toutes les variantes ; avant-bras, visage et cou restent peau.
- Empreinte `222f8949` → `baed056d`. Aucun pixel du jeu ne change : le forgeron est fixé à son original (« Originaux partout », Passe V2) ;
  contrôle : forgeron masqué ou non, aucun écart supplémentaire.
- [?] Vu en passant, non traité : les 4 images de frappe (profil) ne sont presque pas masquées (le bras levé s'éloigne de plus de 3 texels de
  la vue de référence, la propagation ne le retrouve pas) ; invisible en production pour la même raison.

### 3. Docker, cycle irrégulier — [OK] le script de rig
- Cause mesurée sur la rangée des pieds (texel 90) : la botte de contact, inclinée de 6° (talon d'abord), laissait sa pointe hors de la
  rangée ; de l'image 0 à 1, son bord avant restait en place pendant que son talon avançait de 5 texels (la « botte tenue une image ») ; au
  décollement (lever 2), la pointe du pied arrière restait sur la rangée (le double appui). Centres des appuis : 2,5 / 4 / 2 texels par image,
  `walkSlide` → `null`.
- Correctif (`rigs/dockworker-x2-v2.rig.mjs`, `CYCLE`, deux nombres) : botte de contact à plat (6° → 0), pied arrière levé d'une rangée de
  plus au décollement (2 → 3), qui quitte ainsi la rangée des pieds. Banc d'essai hors du dépôt (méthode de la Passe 4A-quatervicies) : l'autre
  voie essayée (lever 2 et « dégager la rangée » dans la boucle du pied levé) donne les mêmes images, la plus simple est gardée ; des angles de
  décollement plus raides (−26° à −32°) font retoucher la pointe au sol (`walkSlide` de nouveau `null`). [KO] Garder l'inclinaison de 6° avec
  le pied arrière dégagé : `walkSlide` 3,25, accepté par la tolérance de 30 % mais une alternance 2,5 / 4 qui patine.
- Seules les images de marche de profil 0 et 3 changent : 54 texels retirés, 24 ajoutés, 319 recolorés, 0 couleur nouvelle ; vues, images,
  étiquettes et JSON inchangés ; `--check` identique ; empreinte du masque de variantes inchangée (`09fbb257`). `walkSlide` : `null` → 4 texels
  par image (0,634 m/s à l'échelle 1) ; horloge ×1,27 en B / D, ×1,23 en C (`tools/art-lab/stride.mjs`).
- Glissement en mouvement (`tools/foot-slip.mjs`, 40 s par cas, médiane, 0 = planté), base `main` figée (`c5e7836`, servie sur :5188) →
  branche : A 1842 0,09 → −0,04 ; B 1842 0,11 → 0,04 ; C 1842 0,04 → 0,01 ; D 1842 0,48 → −0,01 ; B 7719 −0,18 → −0,00 ; B 30417 0,17 →
  −0,00. La base reproduit exactement les valeurs de la Passe S2 ; les autres feuilles mesurent à l'identique avant / après (12 sur 12).

### Critique à l'aveugle du docker — [?] partagée ; [OK] ses mesures vérifiées
- Trois agents neufs (étiquettes tirées au sort, clé hors de leur portée, auto-critique écrite avant chaque verdict) :
  - tour 1 (sol avancé de la foulée de conception, 13 texels pour 3 images, pour les deux) : révisé 5,5 / 10, actuel 5 / 10, révisé préféré
    (le pied avant ne patine plus après le contact) ; son « glissement de 2 texels au décollement » est mesuré au coin bas-gauche de la botte
    levée : la pointe (ses texels les plus bas) avance de 4, comme le sol ;
  - tour 2 (sol avancé de l'avance réelle du jeu en B : 5,07 texels par image pour l'actuel à l'horloge 1, 4 pour le révisé à l'horloge
    1,27) : actuel 7, révisé 5 ; lu sur une image réduite (sa propre réserve), ses dérives (révisé −2 à −3 texels par image) sont contredites
    par les pixels de sa planche : la botte d'appui du révisé occupe exactement les texels 129-142,8 sur ses trois images, celle de l'actuel
    change de forme au contact puis avance de 1,2 texel par image ;
  - tour 3 (les pieds seuls, lus à 1:1) : actuel 7, révisé 4 ; même contradiction (le révisé mesure 129,0-142,8 sur ses trois images, le
    critique y lit +1,6 par image).
- La règle « une retouche qui ne gagne pas clairement à l'aveugle est annulée » n'a pas été appliquée seule, les verdicts reposant sur des
  mesures que les pixels réfutent : décision laissée à l'opérateur, flip-book en mouvement à l'appui. Relevés par les trois, communs aux deux
  versions : pas d'attaque du talon, la botte qui passe à l'image 4 posée sur celle d'appui, une poussée faible.

### Preuves
- Démarrage par défaut (`tools/detshots.mjs`, A / B / C / D, graine 1842, `clean=1&freeze=7.3`, 120 pas) contre `main` figé : A 395 px, B
  7 258, C 2 563, D 2 848 (> 8 niveaux) ; docker et voyageur masqués : 0 px, tous niveaux, dans les quatre ; docker seul masqué : A 151 px,
  B 171 (le menton du voyageur à variante). Le masquage change 12 000 à 56 000 px (contrôle). Témoin de répétition 0 px. Rendu de production
  (sans paramètre) contre le rendu `?variants=candidate` montré à l'opérateur : 0 px (A, B).
- Tant que leurs empreintes n'étaient pas inscrites, la porte de production a refusé les masques changés (`npm test` : 3 échecs « variant
  masks baed056d are not the approved masks 222f8949 ») : contrôle négatif de la porte.
- Tests : `tests/variants.test.mjs` +1 (option `force` : rectangle appliqué, jamais sur un contour ni sur une couleur exclue, propagé,
  limité à sa vue ; quatre fautes injectées une à une, chacune attrapée) ; `tests/stride.test.mjs` : docker attendu à 4 (régression
  remesurée exprès) ; `npm test` 37 / 37 ; `typecheck`, `build`, `art:validate` (14 manifestes, 0 erreur), `verify-provenance` intact.
- Références `screenshots/calibration/cam{A,B,C,D}-*.png` refaites (requêtes de `tools/screenshots.mjs`, capture déterministe, 120 pas,
  témoin 0 px) : elles dataient de la Passe S1b et ne montraient pas encore les variantes de V2 (`main` en différait sur les seuls
  personnages) ; docker et voyageur masqués, 0 px contre `main`.
- Planches : `reviews/npc-variants-v3/` (voyageur, forgeron, planche des variantes avant / après, `lineup.png`, `masks.png`),
  `reviews/dockworker-x2-v2/12-walk-v3-before-after.png` ; flip-book (caméra B, `main` contre la branche) hors suivi git :
  `art-lab/characters/scratch/npc-fixes-v3/` (32 Mo).

### Décision de l'opérateur (2026-10-18) — [OK]
- Planches, flip-book, verdicts des trois critiques et leurs contradictions mesurées montrés ; question : « Approuvez-vous ces assets corrigés
  pour la production (masques du voyageur et du forgeron, planche du docker) ? » ; réponse, mot pour mot : « J'approuve les trois
  (Recommandé) ».
- Inscrit : `variants.json` (empreintes `0e6e3b03` et `baed056d`, note d'approbation complétée) ; paquet de provenance du docker
  (`approvals`, `revisions[]` V3 avec empreintes avant / après, `status`, `chain`), manifeste (`notes`), README de revue. Aucun Gold Master.

### Pensée
- Avant d'élargir une zone de masque pour rattraper des texels oubliés, regarder la planche de référence : les texels pâles de l'épaule du
  forgeron étaient la manche ; c'est la peau autour qui était fausse.
- Une ombre de peau trop sombre ou trop rouge pour une règle de couleur se relève à la main (rectangle forcé, consigné, couvert par
  l'empreinte), pas par une règle générale qui toucherait les autres feuilles.
- Un cycle cuit se règle sur la mesure du moteur : `walkSlide` lit le centre des appuis sur la rangée des pieds ; une botte inclinée ou une
  pointe qui traîne déplacent ce centre et rendent le cycle irrégulier, même quand le point d'appui est juste.
- Une mesure qu'avance un critique (une dérive en texels) se vérifie sur les pixels de sa propre planche avant de peser son verdict ; une
  planche de critique reproduit l'avance réelle du jeu (l'horloge) et se lit à 1:1 ; un désaccord qui persiste revient à l'opérateur, image en
  mouvement à l'appui.

