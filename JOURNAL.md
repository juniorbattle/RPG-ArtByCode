# Journal de bord — Cité du Tournoi (Merchant District, nuit)

Objet : garder une trace honnête de ce qui a été fait, de ce qui a marché, de ce qui a raté et de **pourquoi**, pour que
la suite parte d'un état connu. À compléter à chaque passe (une entrée par passe, la plus récente en bas).

Légende : **[OK]** réussi · **[KO]** échec / impasse · **[?]** non résolu ou à surveiller · **Pensée** = raisonnement / leçon.

> Les passes 0 à S1b sont archivées **mot pour mot** dans `journal/` (Passes M3, M6 et M7, 2026-10-18) ; ce fichier garde les passes récentes,
> « À reprendre » et « Principes à garder ». Un renvoi à une passe archivée (« journal pass 6k », « JOURNAL, Passe 4A-0B ») se lit
> dans le fichier que donne l'index.

| Archive | Passes | Dates |
|---|---|---|
| [`journal/01-passes-0-4B.md`](journal/01-passes-0-4B.md) | 0, 1, 2 (+ « État à la fin de la passe 2 »), 3, 3b, 4B | 10/10 → 12/10 |
| [`journal/02-passes-4A-0A-4A-quindecies.md`](journal/02-passes-4A-0A-4A-quindecies.md) | 4A-0A, 4A-0B, 4A, 4A-bis, 4A-ter, 4A-quater, 4A-quinquies, 4A-sexies, 4A-septies, 4A-octies, 4A-nonies, 4A-decies, 4A-undecies, 4A-duodecies, 4A-terdecies, 4A-quattuordecies, 4A-quindecies | 12/10 → 16/10 |
| [`journal/03-passes-4A-sedecies-M2.md`](journal/03-passes-4A-sedecies-M2.md) | 4A-sedecies, 4A-septendecies, 4A-duodevicies, 4A-undevicies, 4A-vicies, 5, 4A-unvicies, 5b, 4A-duovicies, 4A-tervicies, M1, 4A-quatervicies, M2 | 16/10 → 17/10 |
| [`journal/04-passes-6-6k.md`](journal/04-passes-6-6k.md) | 6, 6b, 6c, 6d, 6e, 6f, 6g, 6h, 6i, 6j, 6k | 17/10 → 18/10 |
| [`journal/05-passes-M3-M4.md`](journal/05-passes-M3-M4.md) | M3, Q1, Q1b, M4 | 18/10 |
| [`journal/06-passes-M5-S1b.md`](journal/06-passes-M5-S1b.md) | M5, S1, S2, S1b | 18/10 |

---

## Passe H0 — Héros premium : brief et prompt de la planche source ; décision sur l'enseigne de la forge (2026-10-18)

### Complément de la Passe S1b
- Passe S1b fusionnée en avance rapide (`1634b59`) ; runs GitHub : S1 `39174062375` / `39174069769`, S2 `39175497168` / `39175505682`, S1b
  `39176075688` / `39176097041` (branche / `main`) : success.
- Enseigne de la forge devant la tête du forgeron (C) : décision de l'opérateur, mot pour mot : « celui ci c'est different car le npc forge
  se trouve a l'interieur du decors dans c'est logique le beau de decors surpasse le sprite ». Rien à changer.

### Demande (2026-10-18)
- Troisième point des priorités (Passe M5) : « travailler sur notre héros premium ». Consigne de la séance parente : un héros cuit à la
  densité de la distribution par la chaîne existante, critiqué à l'aveugle par un agent neuf ; production et Gold Master à l'opérateur ;
  aucune provenance inventée.
- Branche `hero-premium` ouverte depuis `main` (`1634b59`).

### Constat — [OK]
- Aucune source multi-vues du héros dans l'Art Lab. La planche complémentaire (14 personnages, classée « C, utile pour les personnages
  clés » par l'opérateur le 16/10) montre « 01. Protagonist — Young Adventurer » sous une seule vue (trois-quarts) ; les PNJ venaient de
  planches à 4 ou 6 vues découpées par leurs scripts de rig. Une marche ne s'invente pas depuis une vue (« Principes à garder ») : il faut
  une planche de l'opérateur.

### Décisions de l'opérateur (2026-10-18) — [OK]
- Base de dessin, mot pour mot : « 01 Protagonist (Recommandé) ». Vitesse, mot pour mot : « Foulée de course (Recommandé) » (2,5 m/s
  gardés ; le cycle de profil doit reculer le pied d'appui d'≈ 9 texels par image à ×2, contre 4-4,5 pour la distribution, Passe S2).

### Fait
- `art-lab/characters/briefs/hero-proposal.md` : décisions, brief (figure d'après la vue 01, proportions de la base commune, 1,78 m),
  contraintes mesurées (densité, foulée, entrée `replaces: ['player']` seulement après approbation), prompt anglais de la planche (face, dos,
  profil au repos, deux poses de course de profil, même échelle et même ligne de sol, fond gris uni), méthode à réception (celle des PNJ),
  critères, risques.
- Pièces jointes du prompt (non versionnées, `art-lab/characters/scratch/hero-premium/attachments/`) : `design-01-protagonist-crop-x2.png`
  (vue 01 recadrée de la planche complémentaire archivée, ×2 ; SHA-256 `fbdf11b5…`) et
  `quality-dockworker-x2-v2-front-side-back-x6-neutral.png` (docker v2 au repos, face / profil / dos ×6 au plus proche voisin sur gris
  `#808080` ; `93d5e3a6…`).

### Restes [?]
- **En attente de l'opérateur** : la planche générée, livrée en PNG d'origine, avec l'outil, la date et le prompt effectivement utilisés.
- Avec Maj (4,25 m/s), la borne × 1,6 de l'horloge laissera glisser : à décider à la livraison.

### Pensée
- Un personnage clé se prépare comme les PNJ : la source d'abord (multi-vues, fichier d'origine, provenance déclarée), puis la chaîne ; une
  contrainte d'animation (la foulée de course) s'écrit dans le prompt, chiffrée, avant la génération.

## Passe M6 — Journal : archivage des passes M3 à M4 (2026-10-18)

### Pourquoi
- Règle d'`AGENTS.md` : au-delà d'environ 60 Ko de passes dans `JOURNAL.md`, les passes closes les plus anciennes partent d'un bloc dans
  `journal/`. Après la Passe H0 : 61 672 octets de passes (M3 11 863, Q1 10 023, Q1b 4 187, M4 2 860, M5 7 366, S1 10 922, S2 7 224,
  S1b 3 967, H0 3 260).
- Branche `journal-archive-m3-m4` ouverte depuis `main` (`aa58d31`).

### Fait — [OK]
- M3, Q1, Q1b et M4 (closes : décision de l'opérateur consignée, branches fusionnées) déplacées d'un bloc, dans leur ordre, à l'octet, dans
  `journal/05-passes-M3-M4.md` (en-tête de quelques lignes, une ligne `---`, puis les 28 933 octets inchangés, SHA-256 `e80b0dfcc58a44af…`) ;
  ligne ajoutée à l'index ; phrase d'en-tête : « Les passes 0 à M4 sont archivées… (Passes M3 et M6) ». `JOURNAL.md` : 96 085 → 67 249 octets
  avant cette entrée.
- Preuve (script hors dépôt, contre `git show aa58d31:JOURNAL.md` ramené aux fins de ligne de la copie de travail) : **7 / 7** — corps de
  l'archive = octets retirés (SHA-256 et longueur) ; les 4 sections déplacées retrouvées chacune une seule fois, dans la nouvelle archive
  seulement ; les 5 passes gardées inchangées ; `JOURNAL.md` = l'original moins le bloc, aux deux lignes d'index près ; CRLF seuls dans les
  deux fichiers. Contrôle négatif : « 15 / 15 contrôles » changé en « 15 / 16 » dans une copie de l'archive → 5 / 7 (SHA-256 et section).
  Avec cette entrée ajoutée, le contrôle « original moins le bloc » échoue comme attendu (lignes en plus).
- **[KO → compris]** première exécution : 2 / 7 ; `git show` rend le blob de l'index en LF (0 CRLF, 946 LF), la copie de travail est en CRLF
  (`autocrlf`) : comparer aux fins de ligne de la copie de travail, comme en Passe M3.

### Pensée
- Une preuve d'octets contre l'historique git compare des fins de ligne : le blob est celui de l'index, pas celui du disque.

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

## Passe H1 — Héros premium : casting 1 (trois planches de personnages), design du protagoniste choisi, prompt v2 (2026-10-18)

### Reçu
- L'opérateur a collé trois planches de personnages (WebP 1447 × 1087, avec perte ; le même profil ICC générique que les planches archivées,
  qui sont des copies ré-encodées) avec une note collée par lui : ce sont des références de casting, « et non des spritesheets de production directement
  exploitables » ; le protagoniste issu du « 01. Young Adventurer » se développe « dans une planche individuelle détaillée » ; « Les
  personnages représentés ne deviennent pas automatiquement canoniques » ; « La priorité reste le protagoniste H0 ».
- Elles ne viennent pas du prompt du brief (§ 5, v1 : un seul personnage, cinq vues, fond gris) : plusieurs personnages, fond bleu nuit,
  textes. Outil, date et prompt non déclarés.

### Mesures du protagoniste — [OK] proportions ; [?] grille
- Réglette sur la vue de face (± 0,015), tête cheveux compris jusqu'au menton sur la hauteur : planche 1 ≈ 0,31, planche 2 ≈ 0,32,
  planche 3 ≈ 0,35 ; même lecture sur la planche source de la distribution : docker ≈ 0,31, voyageur ≈ 0,34. Les trois sont dans la famille
  de la distribution. Hauteurs ≈ 146-148 / 145 / 136-141 px, contre 153-174 px pour les vues des PNJ sur leurs planches (le pas de
  reconstruction se règle par personnage, 1,775 à 2,0).
- Grille de pixels : un spectre des gradients ne trouve pas de pas net, mais il n'en trouve pas non plus sur la planche 01-16 (pas connu :
  1,775) : méthode non concluante, abandonnée ; le pas se fixera sur la planche individuelle.
- Défauts de cohérence relevés : planches 1 et 2, pantalon foncé au repos et clair en course, aucun vrai profil au repos (deux 3/4 face,
  deux 3/4 dos) ; planche 3, jambes confuses aux images 3-4 de la course, cape de « 01b » rouge puis grise dans sa 4e vue ; partout, fond
  bleu nuit proche de la cape indigo.
- Planches de revue (non versionnées) : `art-lab/characters/scratch/hero-premium/casting-1/board-1-designs.png`, `board-2-course.png`,
  `board-3-proportions.png`.

### Décisions de l'opérateur (2026-10-18), mot pour mot
- Design du protagoniste : « Planche 1 (Recommandé) » (fidèle au 01 d'origine, expression calme).
- Pantalon : « Foncé (Recommandé) », dans toutes les vues, course comprise.
- Archivage des trois planches : « Oui, à l'octet (Recommandé) ».

### Fait — [OK]
- Archivage à l'octet dans `art-lab/characters/reference/sources/` : `tournament-roster-casting-2026-10-18-a.webp` (planche 1),
  `tournament-roster-casting-2026-10-18-b.webp` (planche 2), `main-characters-casting-2026-10-18.webp` (planche 3), chacune avec sa fiche
  `.source.json` : classement « casting, non canonique », mesures, décision, provenance **non déclarée**, droits non vérifiés.
- Brief `briefs/hero-proposal.md` : décision 3 (casting 1), figure et proportions d'après la planche 1, § 5 remplacé par le **prompt v2**
  (le v1 n'a pas servi ; il reste dans l'historique git), § 9 « Casting 1 » (mesures, défauts, statut du reste des planches).
- Prompt v2 : images jointes = les 6 vues de repos et les 5 images de course de la planche 1 (×2, sans texte, refaites depuis la planche
  archivée) ; le docker n'est plus joint ; demande un vrai profil au repos, le pantalon foncé partout, le motif de cape cohérent, des pixels
  nets d'une seule taille, un fond gris neutre ; profils tournés vers la droite comme la course jointe.

### Restes [?]
- La planche individuelle (PNG d'origine, outil, date, prompt) : l'opérateur la génère avec le v2. Ensuite, § 6 du brief.
- Le reste des trois planches (tenues alternatives, combattants, personnages narratifs, PNJ importants) : propositions, aucune production
  avant validation de leur design.

### Preuves
- `art:validate` : 14 manifestes, 7 sources archivées dont les 3 nouvelles, 0 erreur. Contrôle négatif : un octet ajouté à une archive
  donne 2 erreurs (taille, SHA-256) ; archive restaurée, SHA-256 de nouveau celui du fichier collé.
- SHA-256 des trois archives = ceux des trois fichiers collés dans la séance (`f44f86af…`, `fcb38cda…`, `2a7962f8…`).
- `typecheck`, `npm test` (37 / 37), `build` : OK. Aucun code ni asset du jeu changé.

### Pensée
- Une planche de casting se mesure contre les planches sources de la distribution avec la même lecture (réglette sur la source, pas sur un
  export) : 0,33 mesuré sur l'export du docker et 0,31 sur sa source décrivent la même tête.
- Une méthode de mesure se teste d'abord sur un cas connu : le spectre des gradients, muet sur la planche 01-16 dont le pas est connu,
  n'était pas une preuve d'absence de grille sur les nouvelles planches.

## Passe M7 — Journal : archivage des passes M5 à S1b (2026-10-18)

### Pourquoi
- Règle d'`AGENTS.md` : au-delà d'environ 60 Ko de passes dans `JOURNAL.md`, les passes closes les plus anciennes partent d'un bloc dans
  `journal/` (seuil signalé par la séance des retouches après la Passe V3). Après la Passe H1 : 64 127 octets de passes (M5 7 366, S1 10 922,
  S2 7 224, S1b 3 967, H0 3 260, M6 2 021, V0 2 745, V1 7 285, V2 3 458, V3 11 032, H1 4 847).
- Réponse de l'opérateur, mot pour mot (le mode automatique de l'outil avait d'abord refusé la fusion de `hero-casting`) : « Je t'autorise à
  fusionner hero-casting dans main en avance rapide, à pousser main et à supprimer la branche, puis à faire l'archivage M7 du journal. »
- Branche `journal-archive-m5-s1b` ouverte depuis `main` (`a5e06a5`).

### Fait — [OK]
- M5, S1, S2 et S1b (closes : décisions de l'opérateur consignées, branches fusionnées) déplacées d'un bloc, dans leur ordre, à l'octet, dans
  `journal/06-passes-M5-S1b.md` (en-tête de quelques lignes, une ligne `---`, puis les 29 479 octets inchangés, SHA-256
  `238e3288750e1829…`) ; ligne ajoutée à l'index ; phrase d'en-tête : « Les passes 0 à S1b… (Passes M3, M6 et M7) ». `JOURNAL.md` :
  100 416 → 71 034 octets avant cette entrée ; 34 648 octets de passes gardées (H0 à H1). H0 reste près de H1 : le héros est en cours.
- Preuve (script hors dépôt, contre `git show a5e06a5:JOURNAL.md` ramené en CRLF ; cette entrée laissée hors de la comparaison) : **8 / 8** —
  corps de l'archive = octets retirés (SHA-256 et longueur) ; les 4 sections retrouvées chacune une seule fois, dans la nouvelle archive
  seulement ; passes gardées H0 à H1 inchangées ; `JOURNAL.md` = l'original moins le bloc, à la phrase d'en-tête et à la ligne d'index près ;
  archives 01 à 05 inchangées ; CRLF seuls dans les deux fichiers. Contrôle négatif : un mot changé (`maskSafeBlending` →
  `maskSafeBlendinG`) dans une copie de l'archive → 6 / 8 (SHA-256 et section).

### Pensée
- Une coupe d'archive suit les séances (nettoyage et points 1-2 des priorités ensemble) et laisse près de la passe en cours celle qu'elle
  prolonge.

## À reprendre (par priorité)

> Élaguée le 18/10 (Passe M3) : seul le travail ouvert reste, regroupé par thème ; ce qui est fait vit dans sa passe. Les anciens repères
> (-3 … 6) cités par les passes antérieures renvoient à la liste de `7086340` (`git show 7086340:JOURNAL.md`).

**1. Distribution de personnages — décisions de l'opérateur, non traitées** (état de la distribution : `art-lab/characters/README.md`)
- **Variantes de PNJ** (demande de l'opérateur du 17/10, mot pour mot : « Par ailleurs a la suite de nos travaux de sprites NPC qui sont
  presque peuple partout sur le district Merchant, on creera par la suite des variantes de NPC avec couleur de cheveux et peau different pour
  amener plus de diversite au jeu »). Contraintes connues : la texture cuite garantit 336 images et en porte 322 (dix feuilles,
  1024 × 2016) : une variante en feuille séparée ne rentre pas sans agrandir la texture ; la teinte aléatoire de la foule (± 10 % par canal
  sur tout le sprite) ne s'applique plus aux feuilles cuites (Passe 4A-tervicies). **Passes V1 / V2** : masques de matière, recoloration au
  rendu, approuvées pour la production le 18/10 (PNJ uniques en original). Passe V3 : trait rosé sous la bouche du voyageur et manches du forgeron
  (les « texels pâles à l'épaule ») corrigés dans les masques, approuvés le 18/10. Reste : les images de frappe du forgeron presque sans
  masque (invisible tant qu'il est fixé à son original). À arbitrer avec l'opérateur : quels personnages, combien de variantes,
  quelles teintes dans la direction artistique.
- **Mise en scène** : la marchande ne marche pas à son étal (collisionneur ; la déplacer de 0,5 m serait une décision de mise en scène) ; un
  second garde différent (miroir ou variante) au lieu de jumeaux, lances ; seuls 2 des 5 citadins (artisane, voyageur) paraissent à la
  graine 1842 et à la densité 1 (`round(2 × densité)` promeneurs ; « remplacer seulement »).
- **Mouvement** (Passe S2 : cadence réglée sur la vitesse vue à l'écran, pieds plantés pour la foule et les gardes ; Passe V3 : docker
  régularisé, glissement ≈ 0 en B / C / D) : restes des critiques du docker, communs à ses deux cycles : pas d'attaque du talon, botte de
  passage posée sur celle d'appui (image 4), poussée faible ; cycle 3 + 3 sans double appui (hérité du garde) ; en A, l'horloge touche son
  plancher pour un profil qui va presque en profondeur. Bras immobiles des citadins en marche : pas une priorité, décision de l'opérateur du
  18/10, mot pour mot : « les bras immobiles des citadins quand ils marchent n'est pas une priorites dans notre strucutre HD-2D, ce n'est pas problematique ».
- **Fidèles aux planches, non changés exprès** : bonnet / sac de la marchande selon la vue ; costumes des citadins différents selon la vue
  (tablier, sac, chemise).
- **Lisibilité** : tête du marteau cuit peu lisible sur la lueur de l'enclume (Passe 4A-vicies).
- **Restes mineurs** relevés par les critiques : sections « Restent » des passes 4A-tervicies et 4A-quatervicies.
- **Contrat et sources** : C2 (PNG versionné + JSON, `runtime-integration-contract.md` section 11) proposé le 16/10, appliqué par la
  distribution de production, sans confirmation explicite consignée : à faire confirmer. Originaux des planches de référence à retrouver
  (l'opérateur s'en charge) ; droits de tiers non vérifiés exhaustivement.
- **Héros premium** (Passes H0, H1) : casting 1 tranché par l'opérateur (design de la planche 1, pantalon foncé, trois planches archivées) ;
  prompt v2 prêt (`briefs/hero-proposal.md` § 5) ; **en attente de la planche individuelle de l'opérateur** (PNG d'origine, outil, date,
  prompt utilisé). Le reste des planches du casting : propositions non canoniques, design à valider avant toute production.
- **Personnages clés et suite de l'art** : héros et chat restent générés (densité ×1) ; ni personnage clé ni personnage **original** au
  même niveau ; E4 non lancée. Avant d'étendre : densité du cast (héros), liseré dépendant de la densité (liseré par sprite non implémenté),
  largeurs de texel inégales à ≈ 2 px / texel, cycle de marche en A. Décision ouverte : quelles planches étaient réellement rejetées (la
  consigne de 4A en parlait sans les montrer ; les trois planches archivées sont toutes classées comme références). Le modelé ×1,5 n'est
  plus la voie principale (Passes 4A-quater / quinquies).
- **Point de QA (pas une tâche)** : PNJ ×2 près de 1 px écran / texel (caméra A, PNJ lointains) : détails d'un texel qui clignotent ;
  surveiller à chaque nouveau PNJ. Mesuré en Passe S2 (graine 1842) : distribution ×2 à 0,35-0,78 px / texel en A, 0,65-1,68 en B, 0,97-2,02
  en C, 1,15-1,29 en D ; héros ×1 à 1,6 / 3,0 / 3,3 / 2,9.

**2. Occlusion du joueur (Passes 3 / 3b)**
- Un montant sombre de la bannière du bateau n'est pas découpé par le reveal et coupe le joueur ; la casquette tombe dans la bande tramée ;
  la trame « rampe » quand l'ellipse bouge. Ne rien changer sans inventaire visuel et technique (`tools/occ-inventory.mjs`) qui justifie un
  nouvel occluder.
- Relecture humaine en mouvement (style C, rayons 40–70 / 80–120 px, fondu 0,2 / 0,3 s) ; décider si les PNJ d'interaction doivent entrer
  dans le reveal ; chercher un cas où la passe « derrière » restaure vraiment des pièces (sinon envisager de la couper pour gagner ≈ 90 ms
  de bake) ; rejouer l'inventaire à chaque changement de zones de caméra ou de composition (bateau, lampadaires).

**3. `SpriteRenderer`** (Passe S1 : superposition retirée, masque de protection propre, auréole mesurée en mouvement ; Passe S1b : une seule
profondeur par sprite, le décor derrière un personnage ne le coupe plus ; l'enseigne devant le forgeron est voulue, opérateur, Passe H0) —
restent des décisions d'image : le bord des feuilles cuites ×2 (frange bleutée sur le contour d'auteur ; décision du 18/10 : contour d'auteur gardé, à faire au point 2) ;
la lisibilité du forgeron dans l'in-scatter de la forge (part des personnages 45 %, `known-issues/forge-smith-inscatter-C.png`) ; un halo placé
devant un personnage s'applique désormais entièrement (B : héros sous la lanterne, plus clair au visage).

**4. Zones de caméra** — validées par simulation (Passe 4B, `tools/camsim.mjs`), pas par de vrais joueurs : (a) D place toujours le joueur
**à droite** du centre (NDC +0,35 → +0,68), contrepartie de la continuité avec C ; (b) le long du bord de l'eau (z > 2,4) on passe **B → D**
sans traverser C ; (c) lacet max 0,96° / image en C ↔ D (≤ 0,55° ailleurs) ; (d) les transitions B → C vers l'ouest (−254 px/s) et B → A
(−131 px/s) font glisser le joueur à l'envers à l'écran (héritage de la passe 2, mesuré en 4B, non corrigé). Contrainte : la caméra de D reste
à z < ~18,5 (maisons de la rive opposée dès z = 19,8, invisibles de A/B/C) ; tout cadrage plus reculé exige de les retirer ou de les abaisser.

**5. Visibilité / culling**
- **Décisions de l'opérateur (Passe 5b)** : D ×4 (+75 ms de bake), poses AB à w = 0,5 pour la maison 609, corrections de géométrie
  (fissures, quai coplanaire) qui seules rendraient `viewport-proof` vert.
- **Écarts connus de `viewport-proof`** (9 échecs, tous expliqués en Passe 5b) : fissures MSAA (7719 C, 30417 CD 720p, 1 px de 1842 D
  2560 × 1080), lanières non attrapées à ×2 (30417 D 720p / 665 × 1200 : partie 73 ; 1842 D 2560 × 1080 ; 7719 AB 665 × 1200), maison 609
  (30417 AB). Pixels « order » (30417 B 109 px, AB 31 px, A / BC 1 px en 720p) rapportés sans échouer. Tout nouvel écart :
  `tools/vis-why.mjs` avant de toucher au bake.
- **Écart hérité [?]** : 17 px d'étincelle dans le canal coupés par le bake (B, joueur 15,5 ; −2,7), `known-issues/pass2-vis-speck.png` ;
  Passe 5b (1842, 720p) : 6 px aujourd'hui ; 6 lanières forcées (reflets de maisons de la ville moyenne, murs est de `bg2` / `tall`) → 1 px,
  non élucidé.
- **Coût d'un bake neuf** : le cache (P5, Passe 6d) relit un bake en 36 ms au lieu de 337 ; un bake neuf reste ≈ 300 ms par pages (Passe 5,
  273 poses), génération ≈ 910 ms. Piste : n'échantillonner que les poses concernées quand seul un réglage de caméra change ; réduire CD / BD
  (168 poses sur 273) a coûté 4 pièces de Tier 3 en précision : seulement avec une preuve.
- **Ordre des classes de dessin** : 41 classes, A/B/C pondérés ×2 (D dessine ≈ tout : 98,8 k / 100,8 k). Si D s'alourdit (nouveau
  contenu), rejouer `planDraw` avec un autre poids ou séparer D dans un mesh à part (+ appels de dessin).

**6. Performances GPU (Passes 6 à 6k, plan P0-P9 terminé, tout accepté et fusionné)** — Restent [?] : la cause du ralentissement des
rappels rAF de la passe 6j (ni charge CPU ni charge GPU ; hypothèse : rafraîchissement dynamique de l'écran ou du pilote) ; une lecture de
vsync trop **basse** n'est pas corrigée par le contrôle en session (jamais observée). Non mesuré : autres navigateurs / GPU, cache de
shaders d'un profil persistant, 780M sans contention (fenêtre calme, témoin à l'appui). Écartés (mesurés, Passe 6) : pré-passage de
profondeur (≤ 0,75 ms en 1080p avant son propre coût), filtre de l'ombre de lune (≤ 4 %) ; FXAA, qui flouterait le pixel-art sans masque des
sprites.

**7. Outillage, documentation, dette**
- **Port 5173** partagé avec un autre projet local et `vite.config.ts` sans `strictPort` : les outils peuvent photographier la mauvaise
  appli. Servir les baselines sur `:518x --strictPort` ; décider avec l'opérateur s'il faut changer le défaut (outillage, pas runtime).
- **Tests et CI — restes (Passe Q1)** : le libellé `ubuntu-latest` passe à Ubuntu 26 dès le 19/10 (épingler `ubuntu-24.04` = décision de
  l'opérateur) ; le rejet « images requises manquantes » de `loadProductionCast` n'est pas testé (il faudrait lui passer une liste) ;
  d'autres fonctions pures sans test (`parseFrameCap`, `lerpState`, `needMask`, `bakeKey` du cache du bake) ; les tests ne sont pas typés
  (`.mjs`, hors `tsconfig`).
- **Code mort mineur** (Passe M5) : des `void x;` qui taisent des paramètres, des types exportés sans usage hors de leur fichier.
- **Archivage du journal** (Passe M4) : le critère « operator decision recorded, branch merged » d'`AGENTS.md` date d'avant la fusion
  sans demande ; lire « branche fusionnée » suffit, à confirmer par l'opérateur. Après la Passe V3, les passes gardées font 59,3 Ko : la prochaine
  passe dépasse le seuil d'environ 60 Ko, archiver alors les plus anciennes closes (M5 et suivantes).
- **Dette** : l'ancienne rive opposée (`row(...)` en « sec ») rejoue ses tirages sans rien dessiner — à retirer proprement une fois qu'on
  accepte de décaler la ville lointaine d'une graine.

## Principes à garder

> Dédoublonnés et regroupés le 18/10 (Passe M3 ; liste précédente : `git show 7086340:JOURNAL.md`). Ce qu'`AGENTS.md` dit déjà n'est pas
> recopié ici.

### Mesure et performances
- Mesurer d'abord, optimiser ensuite : minuteurs GPU, variantes entrelacées dans une seule session, base figée. Relever l'adaptateur
  réellement utilisé (`WEBGL_debug_renderer_info`) dans chaque mesure : un portable hybride rend sur l'iGPU par défaut, quoi que demande
  `powerPreference`. Mesurer à la définition de l'écran de l'opérateur (dpr compris), pas seulement en 1080p.
- Un temps GPU pris sur un poste partagé ne vaut qu'avec son témoin de contention (autres processus sur le même adaptateur) ; à défaut, le
  minimum des tours entrelacés est l'estimation sans contention. La traîne du temps d'image en headless n'est pas une mesure.
- Une première fois (programme, variante, dessin) se mesure par une sonde dédiée : aucune moyenne ne la voit. Un intervalle rAF ne
  s'attribue qu'avec un repère (le départ de la boucle, un `gl.finish()` chronométré) : le plus grand intervalle depuis le chargement est le
  plus long bloc synchrone, pas forcément la première image.
- Un travail de démarrage déplacé dans un Worker reste une fonction pure à graine fixe ; il se prouve à l'octet (empreinte de chaque sortie,
  ordre de création des objets qui tirent `Math.random`) et par ses pannes injectées ; le jeu démarre sans Worker (repli par job, chien de
  garde). Une sonde de démarrage observe dès le premier repère, pas depuis `DOMContentLoaded`.
- Une cadence se mesure dans une vraie fenêtre avec vsync (`tools/cadence.mjs`), une « surcharge » en watts (RAPL, SoC = boîtier − cœurs),
  pas en % d'occupation GPU. La vsync se sonde au repos (les rappels que le plafond saute) : la médiane ou le minimum des horodatages rAF de
  la boucle ne la retrouvent pas, leur grille (le plus grand intervalle dont ils sont tous multiples) si ; une grandeur qui peut changer
  pendant la session (le rythme des rappels de Chrome) se revérifie pendant la session, avec des échantillons qu'elle ne fausse pas (passe 6k).
- La cadence préfère la régularité au nombre d'images (choix de l'opérateur, `e60` puis `a60`) : quand le GPU ne tient plus son créneau, un
  pas plus long et régulier plutôt qu'un mélange ; le retour au pas court se vérifie par un essai.
- Une passe plein écran se paie d'abord en bande passante : réduire ses échantillons sans retirer la passe ne gagne rien sur une iGPU ; un
  effet « en demi-résolution » ne paie que si sa recomposition tient dans une passe qui existe déjà (passe 6j).
- Un nombre écrit par un script pour un autre programme s'écrit dans la culture invariante, et en entier quand c'est un compteur ; un
  lecteur qui reçoit l'illisible le dit (passe 6i).
- Un résultat calculé mis en cache se relit seulement pour les mêmes entrées exactes : la clé couvre tout ce qu'il lit (géométrie, poses,
  réglages, code du calcul, GPU) ; une entrée douteuse est un échec de cache, jamais un culling.
- Une allocation, un plafond matériel ou une texture partagée se dimensionne contre le minimum **garanti** par la norme (WebGL2 : 2 048),
  jamais la valeur de la machine de développement, et se vérifie (complétude du framebuffer, erreurs GL) ; une texture partagée se
  dimensionne pour la distribution entière, candidats compris, avant de les ajouter (l'adressage par case entière permet d'élargir sans
  changer une image).

### Visibilité, rendu, caméras
- Toute coupe de géométrie se prouve par un diff d'images `static=1`, culling actif contre `vis=0`, avec `occ=0` : la phase du fondu de
  reveal entre deux régénérations fabrique de faux écarts (1 377 px sur B).
- La rastérisation dépend de la position d'une tuile dans sa cible : les comptes bruts ne se comparent qu'à mise en page égale ; la
  non-régression se prouve sur les masques et les images finales.
- Un écart élagué / `vis=0` s'explique **causalement** (`tools/vis-why.mjs` : pièce forcée → 0 px ; témoin d'ordre) avant de toucher au bake ;
  un pixel décidé par l'ordre de dessin (faces coplanaires) ou par un seul échantillon MSAA (fissure) ne dit rien du culling.
- Le bake échantillonne des points : monter sa résolution fait aussi perdre des pièces ; un supplément s'ajoute aux comptes (tuiles fines
  additives) et va là où la géométrie se présente de chant (D). Toute modification des masques replanifie les classes : prouver le rendu
  canonique contre une base figée, pas seulement contre `vis=0`.
- Le besoin d'une pièce se mesure **par jeu de poses** (stables et mélanges séparés) ; mélanger les deux fait dessiner en C stable ce que seul
  un mélange voit. Pondérer les cadrages historiques pour qu'un nouveau cadrage ne les alourdisse pas.
- Ne pas ajouter de contenu pour combler le vide ; dépenser la complexité là où la caméra la perçoit.
- Garder le déterminisme par graine : toute suppression de code doit préserver les tirages aléatoires.
- Un `discard` ne se paie que là où il sert : variante de matériau liée seulement pendant l'effet, sinon le matériau de slot d'origine ;
  « au repos » doit coûter exactement la passe précédente (mêmes appels de dessin, image pixel-identique).
- Ne taguer que ce que l'inventaire mesure (rayons caméra → joueur contre les vrais triangles), jamais ce que l'intuition suggère.
- Le DOF et le masque de protection (alpha de scène) sont des contrats : un effet qui écrit de l'alpha ne doit pas toucher ce canal. Tout ce
  qui est dessiné après la passe opaque garde l'alpha de destination (`maskSafeBlending`) : un canal-contrat se protège à l'écriture, pas en le
  réparant après coup ; un mode de mélange de bibliothèque se lit dans son code (prémultiplié ou non) avant d'être réécrit (Passe S1).
- Un échantillonnage « au plus proche » du matériel ne se rejoue pas par une formule : on retrouve le texel par sa valeur (Passe S1).
- Un nouveau cadrage se cherche **empiriquement** (`tools/camsearch.mjs`) et se valide en **marchant** (`tools/camsim.mjs`) : la vitesse du
  joueur à l'écran pendant la transition ne doit jamais changer de signe par rapport à sa marche ; une transition interpolée entre deux
  cadrages hérite de l'écart de position écran des deux, d'où l'ancrage (`blendPose`) + un cadrage cible calé sur la sortie du cadrage
  précédent.
- Une caméra qui recule traverse la géométrie qui est « derrière la caméra » des autres cadrages : vérifier z caméra contre ce qui est généré
  de ce côté (rive opposée).

### Preuves
- Une preuve doit pouvoir échouer : un contrôle négatif avant d'accepter « 0 écart » (Lab : `filter=linear` ; revue d'agent : un défaut
  planté qu'elle doit trouver à l'aveugle ; « 0 trou » : remplissage depuis le bord ; mesure de stabilité en mouvement : un cas connu
  mauvais qu'elle doit séparer, sinon elle ne vaut que comme indice et le jugement reste visuel). Un résultat « 0 » d'un outil se recoupe
  avec une valeur connue avant d'être cru. Un test unitaire aussi : des fautes injectées une à une, chacune attrapée ; son oracle est
  indépendant du code testé (pas d'aller-retour par lui) et ses données exercent les cas limites (égalités, bords), vérifiés par le test même
  (Passe Q1).
- Une preuve « pixel-identique » exige une capture déterministe : `Math.random` à graine, pas fixes, horloge figée, RNG internes remis à
  zéro, une chauffe par cadrage **et par origine** (serveur), et un témoin de répétition (deux chargements : 0 px) **avant** toute
  comparaison ; un écart d'un niveau sur 255 se traque par sondes de variantes du shader. Avec des personnages, la boucle du jeu ne doit
  jamais tourner hors du harnais (`App.start` neutralisé dès le chargement, Passe M5).
- Pendant une série de mesures ou de captures sur un serveur de développement, ne rien modifier ni reconstruire de ce qu'il sert (`src/`
  compris : rechargement HMR) ; recadrer une preuve par projection, jamais par supposition ; un masquage d'acteur se vérifie (base masquée
  contre base non masquée) : avec la distribution cuite, un acteur porte l'id de sa planche.
- Une auréole se mesure : ce que le post-traitement fait changer autour d'une silhouette, personnage présent / absent, image par image en
  mouvement, puis effet par effet (`tools/sprite-halo.mjs`, Passe S1).
- Une échelle écran se dérive du code caméra du jeu à la position réelle du joueur (`evalAnchor` + `applyPose`), jamais de la distance de
  pivot d'un cadrage.
- Ajouter des sprites ne doit rien changer aux autres : une texture qui ne grandit jamais pour les sprites validés, et pour les nouveaux un
  adressage par case entière (t ∈ [0, 1] × taille de case, plancher + clamp, lecture au centre du texel) qui ne dépend ni de la taille de
  l'atlas ni de la place de la case. Des octets identiques ne garantissent pas une image identique : `floor(vUv × taille)` départage les
  égalités exactes (bord de texel au centre d'un pixel) selon la taille de la texture, et une formule normalisée par la taille de la texture
  ne peut pas y être stable. Toute croissance d'atlas se prouve par un balayage d'échelles, pas par quelques captures.
- Plusieurs densités de sprites partagent un seul renderer si chaque densité *k* garde le même rectangle monde (cadre 32k × 48k, pieds à 45k) :
  la densité est une affaire d'atlas, la hauteur une affaire d'instance.

### Personnages : art et critique
- Un personnage se juge **dans la scène** à chaque itération (aperçu `?labsprite`, avant / après au même endroit) et **à côté du cast
  existant** (héros compris : densité de texel, proportions et hauteur monde à la même profondeur), pas seulement agrandi ni contre la
  référence : lumière chaude, liseré et voisinage du cast changent la lecture.
- Une critique d'art voit l'image, lit à froid avant la consigne, cite des pixels et vérifie la passe précédente ; le score monte avec des
  preuves, pas avec des intentions. Critique à l'aveugle = étiquettes tirées au sort, clé hors du champ du critique, nouvel agent à chaque
  tour, auto-critique écrite **avant** de lire le verdict. Toute correction ou reprise (de rig comprise, comptée contre la planche
  précédente) repasse une critique à l'aveugle par un agent neuf : elle crée ses propres pertes ; une retouche qui ne gagne pas clairement à
  l'aveugle est annulée, pas empilée.
- Une métrique de propreté (pixels isolés, alternances) n'est pas une métrique de forme : seule une critique aveugle juge la lecture du volume.
- Le classement des références (cible / support / rejet) se fait **confirmer par l'opérateur avant de produire** ; on mesure une référence
  (grille, taille, couleurs) avant d'en déduire une contrainte de résolution ou de technique.
- Avant une génération, comparer le brief lui-même aux personnages des références qui seront jointes : une combinaison de traits peut
  déjà décrire un personnage existant ; la liste de contrôle d'originalité nomme ces personnages.
- Un modelé se peint par **masses** (3-4 valeurs par forme, plis rendus par le bord des aplats) ; une spécification pixel par pixel écrite en
  texte donne de la moucheture (alternances) ou des blocs. La forme vient d'abord de l'information de la source (densité, dégradés peints) :
  préserver sa qualité, puis une finition ciblée ; la finition par agent est fiable pour les défauts **nommés et localisés**, pas pour
  repeindre un volume.
- Les contraintes de l'asset reconstruit (cadre 64 × 96, pieds rangée 90, anneau transparent, alpha binaire) ne s'imposent pas à
  l'illustration source : on ne dégrade jamais le modelé, l'expression ou les matières d'une source pour obtenir une grille parfaite ; la
  mesure de la source règle la reconstruction, elle ne la refuse pas.
- Une hauteur de présentation se décide sur la figure **dessinée** (mesurée dans l'atlas), pas sur une valeur nominale du code ; une carrure
  ne se corrige pas par l'échelle : les proportions se chiffrent dans le prompt et se mesurent sur la source avant toute reconstruction.
- Un personnage plus grand que le cadre se rééchantillonne à un pas plus grossier et se présente à l'échelle commune : une densité de texel
  unique dans la scène prime sur la taille relative de la planche (écart chiffré et consigné).
- Les vues qu'il faut à une marche (face, dos, profil) se prennent sur une planche multi-vues de la même échelle, jamais inventées depuis une
  seule face ; la recette entière (recadrages, palette, retouches, animation) vit dans un script de rig rejouable au texel près.
- Une famille de personnages se produit par gabarit, mais chaque vue se mesure avant : sens du profil contre la planche (avant tout miroir),
  rangée basse de chaque jambe (l'ombre du sol de la planche décale toute une vue), boîte de la seule matière pour une gamme peinte (filtrée
  par sa teinte), boîte de la pièce pour une botte.
- Après toute reconstruction, chercher les bandes quasi noires de la fermeture verticale entre deux masses (nuque / épaules, entre les jambes)
  et les comparer à la planche, pas à la reconstruction : elles se lisent comme des cheveux ou des sangles qui n'existent pas. Remède retenu
  (4A-unvicies) : `reconstruct-grid --closing-from=48` : pas de fermeture au-dessus de la taille, gardée en dessous (elle y restaure les
  contours sombres des jambes et des bottes ; la couper partout les a perdus) ; compter avant / après le fond enclavé et les zones des pieds.
- Retouche ciblée : changer la **chroma** d'une zone fautive en gardant ses valeurs corrige sans repeindre ; ajouter une masse sombre crée un
  nouveau motif (ras-de-cou).
- La copie assombrie d'une pièce lointaine (botte, jambe) garde un plancher de clarté (jamais sous sa propre clarté ni sous un seuil) :
  une soustraction constante écrase les tons sombres au noir du contour. Deux pièces de même forme se séparent d'abord par la profondeur
  (la lointaine plus haut à l'écran) puis par la valeur, et une pièce déplacée se borne à ce qui la cache.
- Une pièce animée emporte son contour (une colonne de contour à deux texels de la peau, une rangée basse rangée dans un autre calque) ; ce
  qu'elle découvre prend ce qui est derrière elle dans le sens du mouvement (au-dessus pour ce qui descend, en dessous pour ce qui monte),
  jamais une couleur prise de côté hors de portée.
- Un mouvement destiné à se lire en jeu se dimensionne en pixels écran (2 texels à ~1,8 px / texel), pas en texels de la planche, et se fixe
  explicitement (rebond imposé de 2 rangées au contact) : il ne se déduit pas seulement de l'IK ; une affirmation de critique se mesure
  (rangées, texels) avant d'être corrigée.
- Une marche capturée se fait à **pas fixe** avec les **vraies entrées**, sur un itinéraire d'abord validé sans rendu (`camsim`) ; chaque
  image se rend avant d'être capturée ; un témoin (même art, autre densité, **même renderer**) sur le même trajet est la seule référence qui
  donne un sens aux chiffres de stabilité.
- La vue d'un personnage qui marche se tire de son pas projeté à l'écran (avec hystérésis), pas de l'angle de son cap avec l'axe de la
  caméra : sous un tangage de 8°, 20° de cap font déjà ~55° à l'écran. Un regard mis en scène (spawn, conversation) garde la règle monde.
- La cadence d'une marche cuite suit la vitesse que montrent ses pas : de profil, la vitesse le long de l'axe droit de la caméra (le seul
  axe où le sprite montre le glissement du pied), de face ou de dos la vitesse entière, sur la vitesse que dessine le cycle à l'échelle du
  cadrage ; un glissement se mesure dans cet axe, en mouvement (`tools/foot-slip.mjs`, Passe S2).
- Un personnage qui agit sur un objet (frappe, geste) regarde l'objet : son orientation se calcule depuis la géométrie (vecteur personnage →
  point d'action), jamais un angle choisi pour l'apparence ; un cycle qui n'existe que de profil en tire son côté écran dans tout cadrage.
- Un cycle synchronisé avec un effet (étincelles du marteau) garde son nombre d'images et l'image de l'impact ; le moteur n'a pas de durée
  par image.
- Un cycle cuit se règle sur la mesure du moteur (`walkSlide` : centre des appuis sur la rangée des pieds) : botte de contact à plat, pied
  arrière qui quitte la rangée au décollement ; une inclinaison ou une pointe qui traîne rendent le cycle irrégulier (Passe V3).
- Une mesure qu'avance un critique (dérive, rangées, texels) se vérifie sur les pixels de sa propre planche avant de peser son verdict ; une
  planche de critique reproduit l'avance réelle du jeu et se lit à 1:1 ; un désaccord qui persiste revient à l'opérateur, image en mouvement à
  l'appui (Passe V3).
- Un masque de matière se vérifie contre la planche de référence : des texels « oubliés » peuvent être la bonne matière et la zone autour la
  fausse (manches du forgeron, Passe V3) ; une ombre que les règles ne prennent pas se relève à la main (rectangle forcé), pas par une règle
  générale.

### Provenance et approbations
- Rien d'externe ne devient « canon » en silence : un manifeste de provenance (`art-lab/characters/manifests`) avec approbation nommée et
  datée est la seule voie vers `runtimeUse: production`. Deux niveaux d'approbation distincts : *approved visual baseline*
  (`approved: true` + `runtimeUse: "lab"`) et *approved production asset* (`runtimeUse: "production"`, tâche explicite + droits confirmés).
  Une approbation de production ne s'écrit jamais au nom de l'opérateur : l'intégration se prépare derrière la porte du manifeste et
  l'opérateur l'ouvre. Une source aux droits non confirmés s'archive par empreinte, jamais par copie dans Git.
- Une approbation visuelle se fige tout de suite : empreintes SHA-256, paramètres, décisions datées, script de vérification ; un artefact
  approuvé ne vit pas seulement dans un dossier ignoré sans que l'opérateur le sache.
- La révision d'un asset approuvé se projette sur sa palette approuvée, épinglée en fichier (aucune couleur nouvelle), et s'inscrit à côté de
  l'approbation (demande citée, empreinte précédente, comptes de texels) ; la confirmation de l'opérateur se demande, elle ne se présume pas.
- Une provenance confirmée par l'opérateur se consigne **mot pour mot et datée**, distincte d'une vérification technique (C2PA) ; ce qui
  manque ne se déduit pas. L'absence d'original n'interdit pas à elle seule la production : droits et autorisation s'évaluent à part. Un
  statut remplacé se garde dans un historique, jamais effacé.
- Une image qui sert de référence se garde **dans son fichier d'origine** (PNG téléchargé, manifeste C2PA intact) dès le premier jour : une
  copie collée en séance est transcodée et perd toute provenance. Une correspondance visuelle se chiffre contre des témoins (elle-même = 0,
  planche sœur = 23) avant d'être affirmée ou exclue.
- Une source archivée se versionne **à l'octet** (empreinte et `cmp` avant commit, attribut binaire) avec une fiche : nature (copie ou
  original), provenance déclarée, droits, dérivés et commande de reconstruction ; jamais de faux original ni de métadonnée fabriquée ;
  `art:validate` revérifie ses octets contre la fiche à chaque passage, contrôle négatif à l'appui.
- Un outil figé par empreinte dans un paquet approuvé s'étend par options désactivées par défaut, prouvées par le `--rebuild` du paquet ;
  l'empreinte se met alors à jour avec une note de maintenance (ancienne valeur gardée).

### Outillage, documentation, processus
- Un outil externe de production d'art (Aseprite et son agent) n'étant jamais une dépendance (`AGENTS.md`), une passe d'outillage se prouve
  par un bundle `dist` identique au SHA-256 et 0 px de différence sur les quatre cadrages. Il s'installe épinglé (version exacte, tag,
  auto-update coupé), en portée locale, après lecture de son code d'installation et un dry-run ; jamais avec l'installeur « tout-en-un »
  d'amont s'il écrit hors de cette portée. Pour toute passe d'art : pont persistant, Aseprite relancé après lui, test de fumée
  `smoke-test/4a0b/` après toute mise à jour (`art-lab/README.md`).
- Ne jamais écrire « validé » pour un logiciel qu'on n'a pas exécuté : `art:doctor` affiche l'état réel (`NOT INSTALLED` est un état
  valide) ; « validé » appartient à un test de bout en bout (4A-0B).
- Le chargement des instructions d'agent se mesure (`/context` dans une session neuve) : jamais de `CLAUDE.md` dans un dossier parent d'un
  projet qui vit de son `AGENTS.md`.
- Un statut de README se réécrit à l'état courant, daté, avec un renvoi au journal pour l'historique ; « À reprendre » ne garde que l'ouvert :
  ce qui est fait en sort à la clôture de sa passe (Passe M3). De même pour les images : les références (`screenshots/calibration/`) se
  refont à chaque changement visible du jeu, les preuves des passes closes vivent dans l'historique git (Passe M5).
- Une autorisation de suppression vaut pour la liste et la taille annoncées ; ce qui manquait au décompte se redemande (Passe M5).
- Des fins de ligne se comptent en octets (node) : sous Git Bash, `sed -i` retire les CR et `grep` / `cat -A` ne les montrent pas de façon
  fiable (Passe M3) ; une modification de fichier CRLF passe par un outil qui les garde.
- Une étape irréversible (fusion, push de `main`, suppression de branche) ne part qu'après la vérification de la précédente, dans une
  commande à part ou liée par `&&` (Passe M3 : une ligne après un heredoc a fusionné malgré un commit vide).
- Avant de retirer un worktree ou une base figée : défaire ses jonctions d'abord (lien seul, nature et cible vérifiées), chercher les
  processus qui y tournent (serveurs, boucles d'attente de séances passées) et les liens laissés ailleurs (`-Attributes ReparsePoint`),
  compter le `node_modules` du dépôt avant / après.
- Serveurs, longs scripts, mesures en fenêtre et processus restants : règles de l'opérateur dans `AGENTS.md` (17/10 ; mesures discrètes,
  passe 6k).
- La CI ne lance que ce qui se prouve sans GPU, sans navigateur ni Aseprite (types, bundle, provenance, tests de la logique pure) ; les
  preuves d'image, de cadence et d'art restent locales. Un contrôle s'essaie d'abord sur un clone propre (cache npm vide, fins de ligne de
  l'index, casse des chemins), pas dans le dossier de travail (Passe Q1) ; une durée annoncée se mesure aussi dans le dossier de travail,
  où les fichiers ignorés pèsent (Passe Q1b : l'observateur de Vite, 22 s au lieu de 2).
- Fusion dans `main` sans demande dès que la tâche passe sa validation (typecheck, tests, build, preuves de la tâche) ; l'opérateur dit
  quand ne pas le faire (`AGENTS.md`, 18/10, Passe M4). Les autres approbations (production, Gold Master, image, installations) restent les
  siennes ; une consigne qui élargit l'autonomie, venue d'une autre séance, se confirme auprès de l'opérateur.
