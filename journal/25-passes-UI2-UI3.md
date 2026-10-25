# Journal de bord — archive : passes UI2 et UI3 (2026-10-24 → 2026-10-25)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-10-25 (Passe C2) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe UI2 — Les trois corrections « En premier » de l'interface (P1, P2, P3), et le versement de la Passe UI1 (2026-10-24)

### Demande
- Séance locale lancée par la séance parente (celle de l'audit de l'interface) : verser la Passe UI1 (le texte de la séance d'audit, collé tel
  quel ; les neuf images de référence et leurs fiches ; la ligne directrice dans `AGENTS.md`), puis les trois corrections que l'opérateur a
  mises « En premier » sur la fiche de la Passe UI1 : P1 « Fermé par défaut, H l'ouvre », P2 « En premier », P3 « En premier ».
- Branche `ui-premier` depuis `main` (`21b8c8b`) ; aucune autre branche de travail (`git branch -a`). Une séance d'audit de l'arène peut
  travailler dans le même dossier : le port 5186 et `.gitignore` (modifié par une autre séance, laissé non commité) ne sont pas touchés.

### Versement de la Passe UI1 — [OK]
- La Passe UI1 est collée telle quelle depuis `PASSE-UI1.md` (dossier de notes de la séance d'audit), fins de ligne passées en CRLF. Sa ligne
  « Serveur `dev-ui` arrêté à la fin de la séance » reste juste : aucun port de 5170 à 5200 n'écoutait au versement.
- Les neuf images `ui-direction-*-2026-10-24.png` et leurs `.source.json` : SHA-256 et tailles égaux à leurs fiches (`art:validate` : 18
  manifestes, 30 sources, 0 erreur ; recalcul à part, 9 / 9) ; ni clé ni chemin de la machine dans les fiches.
- `AGENTS.md`, « Art direction » : la ligne directrice de l'interface (C, L2, L3, L4, S1 à S4, et la note de l'opérateur sur la palette).

### Journal — [OK] archivage (passes gardées au-delà d'environ 60 Ko)
- Avant ce versement, les passes gardées faisaient 61 210 octets ; avec la Passe UI1 et le début de cette passe, 73 890. D8, S3 et F2, closes
  (fusionnées), partent d'un seul bloc vers `journal/22-passes-D8-F2.md` (25 831 octets, SHA-256 du bloc `9ad5d0928d2b5663…`) ; restent 48 059
  octets (59 904 avec cette passe complète). Preuve **8 / 8** (script hors dépôt, contre la copie de `JOURNAL.md` d'avant le déplacement : corps de l'archive égal au bloc ; D8, S3,
  F2 contigus, suivis de S3b ; plus dans `JOURNAL.md` ; chacune dans un seul fichier de `journal/` ; `JOURNAL.md` inchangé à partir de S3b ;
  seules la phrase d'en-tête et une ligne d'index changent ; en-tête comme `journal/21` ; CRLF seuls). Contrôle négatif : un bit changé dans une
  copie de l'archive → 7 / 8. Le même script vérifie que la Passe UI1 du journal est le texte de `PASSE-UI1.md` (fins de ligne mises à part).

### P1 « Fermé par défaut, H l'ouvre » — [OK]
- `src/main.ts` : `exploreByDay` appelle `startTown({ panelClosed: true })` ; `startTown` cache alors le panneau DEV (`display: none`) et met la
  mini-carte à sa place sans panneau (`setMapRight(14)`), comme après H. H fait ce qu'il faisait (le panneau se bascule lui-même, la mini-carte
  le suit) : il ouvre le panneau, puis le referme. **Portée la plus étroite** (leçon de la Passe D9) : seul le bouton de l'écran titre ferme le
  panneau ; toute autre adresse (`startTown()` de l'aiguillage) l'ouvre comme avant, pour les outils et les preuves.
- `tests/town-roles.test.mjs` : le test d'« Explore » fige le nouvel appel (`startTown({ panelClosed: true })`), l'aiguillage sans option, les
  trois seuls appels de `startTown`, et `startTown` égal à celui de `d129433` à deux changements près (l'option, la ligne du panneau fermé),
  construits depuis `git show` (oracle indépendant) ; le comportement de H, l'écran de chargement et `startArena` inchangés.
- `tools/title-proof.mjs` : la page de base reçoit `BASE_KEYS` avant sa capture (défaut `h` : son panneau fermé par H, la vue qu'ouvre
  Explore ; `BASE_KEYS=` : le panneau ouvert, le contrôle négatif) ; Explore est capturé une seconde fois après H (`-h.png`), et l'adresse
  propre de la branche (`?time=midday`, sans écran titre) aussi (`branch-*.png`), toutes deux contre la base sans touche ; l'état du panneau est
  vérifié sur chaque page (fermé + mini-carte à 14 px, ou ouvert + 300 px ; H ouvre, H referme). `AGENTS.md` : la commande.

### P2 « En premier » — [OK]
- Le prix en pièces vient du cœur du jeu : `ActionDef.coins` (facultatif, 0 par défaut) pour les six actions qui prennent des pièces : `buy`
  (`priceOf` : pénurie et faveur de Mara), `temper` (10), `repair` (`repairCost` : 12, ou 6 avec Orla), `buyInfo` (10), `heal` (8, 0 quand le
  Temple paie), `payWatch` (15) ; `ActionOption.coins` le porte (`actions()`). Les `apply` ne changent pas : aucune empreinte d'état ne bouge.
- `costTag` (`src/ui/townUi.ts`) : une étiquette par monnaie, « N coins » quand l'action en dépense, « 1 slot » quand elle prend le créneau,
  les deux côte à côte (`.cost+.cost`), « free » seulement si rien n'est dépensé. Un gain (« +6 coins » de Mara) n'est pas un coût.
- `tests/cost-tags.test.mjs` (3 tests) : chaque option de chaque état nommé, dans les trois lieux, riche (et pauvre, prix tous neutres ou tous
  changés), avec la pénurie et la faveur, le Temple, la blessure, la forge brûlée, Orla amie, une à une ou ensemble : `coins` égale la règle
  écrite dans le test **et** ce que l'`apply` de l'action retire vraiment de la bourse (deux oracles qui ne passent pas par `coins()`) ; le
  balayage vérifie qu'il atteint chaque action payante, les deux prix du soin et des soufflets et les prix changés de Mara ; les étiquettes sur
  cinq cas ; les marchandises de Mara au premier matin.

### P3 « En premier » — [OK]
- Mesure (`main` figé, 1920 × 1080) : les boutons sont en `border-box`, 54 px ; le sous-libellé finit à 56,2 px du haut du bouton et le
  débordement est coupé au bord intérieur (52,5 px) : sa moitié basse (« hold », « 1 AP », « +1 AP », « breaks guard ») disparaissait. Ce n'est
  pas la largeur : aucun texte ne déborde de côté.
- `src/arena/ArenaHud.ts` : `.ah-b` passe de 54 à **60 px** de haut (la ligne finit à 56,3 px, bord à 58,5) ; rien d'autre. Les règles du
  téléphone (`max-width: 900px` : 48 px, sous-libellés masqués ; `max-height: 480px` : 42 px) priment et ne changent pas. À 932 × 430 (téléphone
  large en paysage), la ligne du sous-libellé tombe déjà entièrement sous le bord : rien de rogné à l'écran, rien changé.

### Preuves
- Serveurs : `main` figé (`21b8c8b`, copie hors dépôt, :5197) et la branche figée (la même copie avec les six fichiers de `src/` de la branche,
  égaux à l'octet près des fins de ligne, :5198), entrées locales `ui-premier-main` / `ui-premier-branch` ; le port 5186 jamais touché.
- **La ville à 0 px contre `main` figé** (`tools/detshots.mjs`, 120 pas, graine 1842, 1920 × 1080, seuil 0) : témoin de répétition (deux
  chargements de `main`) **0 px les dix** d'abord ; puis la branche : nuit A, B, C, D avec personnages, B statique, midi B et D (`clean=1`),
  B avec le panneau DEV et le HUD (sans `clean`), le mode jouable (`play=1&state=day1-morning` : « Here » et ses étiquettes) : **0 px les
  neuf**. Seul le dialogue de Mara change : 1 178 px, tous dans [1124, 501, 1187, 610], la colonne des étiquettes (« FREE » → « 8 COINS »,
  « 10 COINS », « 30 COINS » ; « 1 SLOT » inchangé). En 812 × 375 : le mode jouable 0 px, Mara 1 178 px dans [570, 155, 633, 264].
- **P1, le bouton** (`tools/title-proof.mjs`, navigateur non piloté, 1920 × 1080 et 812 × 375) : 20 contrôles sur 20 (boutons sans et avec
  sauvegarde, rien de généré derrière l'écran titre, panneau fermé + mini-carte à 14 px après Explore, H l'ouvre (300 px) puis le referme,
  panneau ouvert sur l'adresse `?time=midday` de la branche et sur celle de `main`, fermé sur `main` après H). Aux deux tailles : Explore =
  `main` `?time=midday` après H **0 px** ; Explore après H = `main` sans touche **0 px** ; la branche `?time=midday` = `main` **0 px** ;
  contrôle négatif, Explore contre `main` sans touche : 16,5 % des pixels en 1080p (dans [1450, 0, 1919, 1079], le panneau), 44,3 % au
  téléphone. Vu aussi dans le panneau navigateur de l'application (non piloté) : Explore → panneau fermé, mini-carte à 14 px ; H → ouvert.
- **P3, l'arène** (`tools/arena-scene-shots.mjs`, `HOLD=1`, seuil 0) : un moment de chauffe (écran de chargement retiré, transitions et
  animations CSS coupées, fiche de match retirée : le même JS des deux côtés), puis dix moments (`calm`, `charging`, `window` en aide complète,
  `combo`, `guardbreak`, `impact`, `technique`, `strike`, `heavyRen`, `ko`), en 1920 × 1080 et 812 × 375, pour `?scene=arena` (FR) et pour le HUD
  du mode jouable (`play=1&state=day2-afternoon`, `TEXTS_EN`) :
  - témoin de répétition (deux chargements de `main`) : **0 px les quarante** ;
  - **812 × 375, FR et EN : 0 px les vingt** (la barre du téléphone garde 42 px et masque ses sous-libellés) ;
  - 1920 × 1080, FR et EN : la barre de la branche va de y 1008 à 1068 (1014 sur `main`) ; huit moments sur dix diffèrent **dans son seul
    rectangle** [493, 1008, 1426, 1066] (32 000 à 44 000 px) ; `window` et `combo` ont en plus 3 317 à 3 411 px hors de lui (jusqu'à 47
    niveaux), tous dans x 596-716 et y ≥ 986 : à 22 px au plus du bouton « Esquive » allumé (616,5-696,5), son halo (`box-shadow` de 16 px de
    flou) qui monte de 6 px avec lui. **Tout le reste à 0 px.**
  - **[KO → compris]** le premier rectangle permis (la barre + 16 px) laissait dehors 538 px de ce halo : un flou de 16 px est une gaussienne
    d'écart type 8 px, dont la traîne passe 16 px (ici 22 px à un niveau près). Le contrôle a été refait sur les pixels hors de la barre, pas le
    rectangle élargi pour faire passer.
  - `tools/arena-scene-check.mjs` sur la branche figée : **PASS** (empreinte égale au prototype, 42 rendus sans erreur, télégraphe 6,94:1).
- **Tests** : `npm test` **156 / 156** (153 + les trois de `tests/cost-tags.test.mjs`). **Treize fautes injectées une à une, toutes
  attrapées**, fichiers rendus à l'octet (SHA-256) : P2 — l'étiquette sans les pièces (l'ancien « FREE »), « free » à côté d'un prix, le prix
  catalogue (sans pénurie ni faveur), le soin toujours payant, les soufflets à 12 avec Orla, l'option sans ses pièces, les 15 pièces du guet
  oubliées, les 10 de l'informateur oubliées ; P1 — Explore panneau ouvert, toutes les adresses panneau fermé, l'option lue nulle part, la
  mini-carte laissée à la place du panneau, l'aiguillage des outils panneau fermé.
- **[KO → contourné] [?]** un script de mesure hors test qui chargeait `src/` par `tests/load.mjs` ne rendait pas la main (hypothèse non
  vérifiée : le chargeur garde son serveur jusqu'au crochet `after()` de `node:test`) : arrêté par `TaskStop`, et le balayage simplement réduit (pauvre seulement avec les prix
  tous neutres ou tous changés : 3,9 s → 1,1 s).
- **Avant / après** (`screenshots/calibration/ui2-premier/`) : `p1-explore-1920x1080.png`, `p1-explore-812x375.png` (le panneau fermé) ;
  `p2-mara-1920x1080.png` (recadrage), `p2-mara-812x375.png`, `p2-anwen-paid-1920x1080.png` (le soin payant, « 8 COINS » et « 1 SLOT » côte à
  côte ; image de revue : le drapeau du Temple retiré dans la page) ; `p3-bar-1920x1080-fr.png`, `p3-bar-1920x1080-en.png` (la barre ×2).

### Validation
- typecheck, `npm test` **156 / 156**, build, `art:validate` (18 manifestes, 30 sources, 0 erreur).

### Restes [?]
- Le reste de l'étape 2 attend le système de design (2.3) : S1 à S4, L2, L3, L4, puis P4, P5, P6 écran par écran. La barre de l'arène garde ses
  10 à 12 px de texte : S4 (16 px au moins sur ordinateur) la redessinera ; P3 n'a fait que rendre lisible ce qui était coupé.
- Le libellé des achats répète le prix (« Buy a whetstone (8 coins: … ») à côté de l'étiquette : à alléger avec le système de design.
- Au téléphone en paysage, la barre de l'arène masque les sous-libellés (`max-width: 900px`), et un téléphone large (932 × 430) les coupe
  entièrement sous son bord de 42 px : rien de rogné à l'écran, mais rien de lisible non plus ; à reprendre avec L3.
- `play-shots` et `detshots` ne capturent pas le parvis par `__app` (c'est une `ArenaApp`) : les images du parvis restent des images de revue.

### Pensée
- Un libellé « rogné » se mesure avant d'être corrigé : boîte (`border-box`), ligne du texte et bord de coupe. Ici la coupe était verticale
  (une ligne de 15,4 px dans 11 px de place), pas la largeur ; la hauteur seule a suffi, et les règles du téléphone, qui priment, n'ont pas bougé.
- Une preuve « la différence tient dans le rectangle » compte ce que l'élément dessine hors de sa boîte (halo, ombre) : un flou CSS de r px
  porte plus loin que r (ici 22 px pour 16). On vérifie les pixels du dehors un par un (où, combien, de combien), on n'élargit pas le rectangle.
- Ce que l'interface affiche d'une règle du jeu (un prix) se lit dans le cœur, et se vérifie contre ce que l'action fait vraiment (son
  `apply`), pas contre son libellé.
- La portée la plus étroite (Passe D9) s'applique encore : le panneau fermé par une option du seul bouton, et l'aiguillage des outils intact,
  prouvé par la capture de l'adresse directe de la branche.

## Passe UI3 — Le système de design de l'interface (étape 2.3 de la feuille de route) : jetons, cadres en neuf tranches, polices embarquées, composants, téléphone (2026-10-25)

### Demande
- Séance locale lancée par la séance parente : construire le système de design décidé sur la fiche de la Passe UI1 (S1 à S4, L2, L3, L4, direction C
  « Héraldique pixel »), l'appliquer aux écrans de `src/ui`, `src/world` et au HUD de l'arène ; P4 à P6 restent des tâches à part, sauf ce que le
  système impose en passant ; la ville sans le mode jouable et toute adresse `clean=1` / `hud=0` à 0 px contre `main` figé. L'atelier « système de
  combat » travaille en parallèle sans branche ni fichier suivi : cette séance tient la seule branche.
- Branche `ui-design-system` depuis `main` (`ae52d37`), seule branche de travail. Serveurs : `dev-ui` (le dépôt, :5187) et `main` figé (`ae52d37`,
  copie hors dépôt, :5188, entrée locale `ui-ds-main`) ; le port 5186 jamais touché.

### Les polices (S1) — choix de l'opérateur, mot pour mot
- Aucune police libre n'était sur la machine. Question posée (téléchargement et couple), réponse de l'opérateur : « Pixelify + Alegreya
  (Recommandé) ». Téléchargées le 25/10 depuis Google Fonts (`fonts.gstatic.com`, sous-ensemble latin, accents compris) avec leurs licences
  (`github.com/google/fonts`, SIL OFL 1.1) : Pixelify Sans (titres, noms, nombres, touches ; 12 016 octets, police variable) ; Alegreya Sans 400 et
  700 (texte ; 23 708 et 23 976 octets). Source, licence, droits d'auteur et SHA-256 de chaque fichier : `src/ui/fonts/FONTS.md` ; `.gitattributes` :
  `*.woff2` binaire, les `OFL-*.txt` gardés à l'octet.
- **[?]** Pixelify Sans est dessinée sur un dixième de son em (mesuré : un fût de 20 px à 200 px) : la gamme garde 20, 30 et 40 px (pixel de 2, 3,
  4 px). Ses contours tombent à un demi-pixel de la grille à 20 px : les bords sont adoucis par l'anticrénelage du navigateur (mesuré au canevas :
  82 % des pixels de bord partiels à 20 px), aucune taille ne les rend nets.

### Fait — [OK]
- **`src/ui/design/tokens.ts`** : toutes les couleurs de l'interface, en jetons (S3 : bleu royal, ivoire, or, ambre de l'action ; provisoire,
  « Cela peut changer par la suite » : un changement de palette est un changement de ce fichier), en **quatre tons** (L2 : la nuit, qui est aussi le
  soir, le matin, midi, la fin de journée) ; la gamme des tailles (S4 : 16 px au moins sur ordinateur, 14 au téléphone, `PHONE_QUERY` =
  `(max-width:700px),(max-height:480px)`) ; le texel des cadres (2 px CSS).
- **`src/ui/design/frames.ts`** (S2) : les cadres en pixel art peints par le code, un texel par pixel, en neuf tranches (`border-image`, `stretch`,
  `image-rendering: pixelated`) : panneau (bleu, bordure d'or, un clou d'or à chaque coin), parchemin (dialogues), boutons (repos, survol / focus en
  or, action en ambre, indisponible), étiquettes de coût (ambre ; bleu clair pour « free »), touches (ivoire, ombrées), jauge. Fonction pure : la
  même en Node (tests) et dans la page.
- **`src/ui/design/system.ts`** : les `@font-face` (familles `"CdT Pixel"` et `"CdT Text"`, `unicode-range` du sous-ensemble latin, `font-display:
  block`), le ton de la page en propriétés CSS (`installDesign(time)`), les cadres en images PNG du ton, `fontsReady()`. Le système vit dans son propre
  morceau du bundle (`system-*.js`) : le morceau principal de la ville ne le contient pas (vérifié dans `dist/`).
- **Les écrans** : `style.ts` (cartes, titres en police pixel, boutons, étiquettes, touches, parchemin, tableaux), `townUi.ts` (état, barre, « Here »,
  invite, nouvelles, dialogue sur parchemin), `board.ts`, `title.ts` (ton de la nuit), `playArena.ts` (fiche de match, victoire), `playForecourt.ts`,
  `playLanterns.ts` ; chaque page pose le ton de son créneau (`lookOf`, l'arène par `arenaQuery`, Lantern Row la nuit) et attend les polices (et les
  portraits) avant `__ready`. Les cartes s'ouvrent en haut (`focus({ preventScroll })` : le journal se lit depuis son titre).
- **Le téléphone (L3)** : une bande en haut (l'état), des onglets en bas (« Here » d'abord, puis carte, journal, tournoi, menu ; touches masquées),
  la liste de « Here » en feuille au-dessus des onglets, chaque carte (dialogue compris) en feuille au bas de l'écran ; en paysage, l'état en haut à
  gauche, « Here » en haut à droite, les onglets en bas.
- **Les portraits (L4)** : `portraits.ts` peint le visage de la feuille cuite (image de face au repos, 32 × 32 texels depuis la rangée du haut,
  centrés sur la tête ; SHA-256 contrôlé contre le paquet de provenance, comme la distribution) pour Mara, Bram, Hale et Wynn (la même feuille : la
  variante de Wynn n'est pas peinte), l'inconnu encapuchonné, Tam, les citadins et le joueur ; le portrait du générateur reste pour les rivaux, les
  officiels, l'aubergiste et les combattants de l'arène (aucune feuille cuite ne les porte). `BakedCast.castSource(id)` donne l'export d'une feuille
  de production.
- **Le HUD de l'arène** (`ArenaHud.ts`) : le même système, le ton de l'état du jour de l'arène (`parseTime`) ; cartes des combattants en panneaux,
  noms et nombres en police pixel, jauges dans la palette (le challenger en bleu clair, l'adversaire en ambre : plus de rouge), barre d'actions en
  boutons du système (touche à côté du nom, sous-libellé dessous), diamants de coût dessinés en CSS (le « ◆ » n'est pas dans le sous-ensemble),
  alerte, fenêtre d'esquive, chiffres flottants, K.O. et pause. `ArenaApp.init` attend les polices.
  - **Le HUD masqué** (`hud=0`, H) garde ses écrans de K.O. et de pause d'avant (règles `#arena-hud.off`) : toute adresse `hud=0` reste à 0 px.
  - **La barre d'actions** fait 76 px de haut à 1920 × 1080 (60 px décidés en P3 : le texte à 16-18 px demande la place) ; les sous-libellés restent
    entiers (bas à 66,2 px pour un bord intérieur à 68,2), aucun nom coupé. **[KO → corrigé]** à pleine largeur elle mesurait 1 411 px et sortait
    d'une fenêtre de 1 280 px (x = -65) : de 1 241 à 1 500 px, noms courts des techniques et libellés à 16 px (1 196 px de large) ; jusqu'à 1 240 px,
    la touche sur le nom et les sous-libellés masqués (comme le téléphone auparavant sous 900 px).
  - **[KO → corrigé]** la fenêtre d'esquive, montée avec la barre (116 px du bas), passait sur le sol devant le télégraphe, là où
    `arena-scene-check` lit son contraste (2,19:1 lu au lieu de 6,94:1 : la couleur relevée était l'ambre de la barre). Elle est revenue juste
    au-dessus de la barre d'actions (94 px du bas, lueur de 6 px), son libellé à sa gauche.
- `FloorUI.ts` n'a pas changé : ses anneaux (bleu, ambre) et son télégraphe (ambre, ivoire) sont déjà dans la palette.

### Les outils
- **`tools/ui-text.mjs`** (nouveau) : dans la page, chaque nœud de texte visible (élément et ancêtres affichés, visibles, non transparents ; le plus
  haut élément au centre du texte est le sien, sinon il est couvert) : taille et police calculées, chaque caractère contre le sous-ensemble des
  polices, texte coupé par la fenêtre ou par un ancêtre `overflow: hidden` (une boîte qui défile n'est pas une coupe). Échoue sous 16 px (ordinateur)
  ou 14 px (téléphone), sur une autre police que les deux embarquées, sur un caractère hors sous-ensemble, sur un texte coupé, sur des polices non
  chargées.
  - **[KO → compris]** premier passage, 80 pages sur 88 : l'écran de chargement, sous l'écran titre, était compté (d'où le test de recouvrement).
    Deuxième : les textes d'une carte qui défile (journal, tableau) comptés comme coupés par la fenêtre (corrigé dans l'outil) ; un vrai défaut :
    la légende de Lantern Row sur un téléphone en portrait (`nowrap`, coupée, et posée sur les onglets) : elle passe à la ligne au-dessus des onglets.

### Preuves
- **La ville sans le mode jouable à 0 px** (`tools/detshots.mjs`, 120 pas, graine 1842, 1920 × 1080, seuil 0) : témoin de répétition (deux
  chargements de `main` figé) **0 px les neuf** ; la branche : nuit A, B, C, D, B statique, midi B et D (`clean=1`), B avec le panneau DEV et le HUD,
  de nuit et à midi : **0 px les neuf**. Les fichiers changés depuis (`src/ui`, `ArenaHud.ts`) ne sont pas chargés par la ville.
- **L'écran titre** (`tools/title-proof.mjs`, navigateur non piloté, 1920 × 1080 et 812 × 375) : 10 contrôles sur 10 aux deux tailles ; « Explore the
  district » = `main` `?time=midday` après H, Explore après H = `main`, la branche `?time=midday` = `main` : **0 px les six**.
- **L'arène, `hud=0` et `clean=1`, à 0 px** (`tools/arena-scene-shots.mjs`, `HOLD=1`, moment de chauffe, seuil 0) : dix moments (`calm`, `charging`,
  `window` en aide complète, `combo`, `guardbreak`, `impact`, `technique`, `strike`, `heavyRen`, `ko`), en 1920 × 1080 et 812 × 375 : témoin
  (`hud=0`, 1920) 0 px les dix ; la branche **0 px les quarante**, K.O. compris (refait après la dernière retouche du HUD : 0 px).
- **`tools/arena-scene-check.mjs`** sur la branche : **PASS** la nuit et à midi (`time=midday`) : empreinte de la simulation égale au
  prototype, 42 rendus sans erreur ; contraste du télégraphe **6,94:1** la nuit (deutéranopie 7,15) et **4,31:1** à midi (4,44), **égal à `main`
  figé** mesuré de même (et à la Passe AD1). La zone « devant » du télégraphe reçoit encore la traîne de la lueur de la fenêtre d'esquive sur ses
  premières rangées (moyenne [34, 37, 48] contre [21, 28, 50] sur `main`, la nuit) ; le contraste retenu est celui du fond, inchangé.
- **`tools/play-flow.mjs`** : victoire contre Vessa (1842, jour 2) et défaite contre Marek (7719, jour 3), l'état final rejoué en Node avec la même
  empreinte (`0025acce7a403773`, `397959404c18f714`), 0 erreur de page.
- **La taille du texte mesurée dans la page** (`tools/ui-text.mjs`, 22 écrans × 1920 × 1080, 1280 × 720, 375 × 812, 812 × 375 : titre et saisie du
  nom, ville au matin, le soir, à la fin de journée, « Here » au téléphone, nouvelles, dialogue de Mara, journal, tableau, carte, menu, parvis,
  dialogue d'Orla, Lantern Row, fiche de match, duel dans la fenêtre d'esquive, fin de la tranche, arène `?scene=arena` dans la fenêtre, à l'impact,
  au K.O., en pause) : **88 pages sur 88**, 1 522 textes ; le plus petit texte : **16 px sur ordinateur, 14 px au téléphone** ; polices chargées,
  aucune autre police, aucun caractère hors sous-ensemble, aucun texte coupé. Après la dernière retouche du HUD, les pages de l'arène, du duel et du
  parvis repassées : **28 pages sur 28**. **Contrôle négatif** (un texte de 12 px en Segoe UI avec « ✓ », un autre sorti de l'écran) : les quatre
  défauts trouvés, 0 page sur 2.
- **Tests** : `tests/ui-design.test.mjs` (6) : les polices contre la table de `FONTS.md` (taille, SHA-256, WOFF2, OFL, aucun fichier sans fiche) ;
  aucune police système dans les écrans (sauf les écrans du HUD masqué) ; quatre tons aux mêmes jetons, teintes dans la palette (bleus et indigos,
  ors et ambres, ou presque neutres ; ni vert ni rouge), contrastes WCAG des paires de texte (7:1 pour la lecture, 4,5:1 sinon ; formule écrite dans
  le test) ; la gamme des tailles et aucune taille littérale sous 16 px dans le CSS des écrans ; chaque cadre en neuf tranches (couleurs du ton,
  alpha binaire et symétrique, bords constants sur leur longueur, centre uni, contour d'encre) ; le recadrage du visage. **Huit fautes injectées une à
  une, toutes attrapées**, fichiers rendus à l'octet (SHA-256) : un jeton vert, un texte secondaire illisible, un bord de cadre non uniforme, un
  bouton entaillé à un seul coin, une police à la mauvaise taille dans `FONTS.md`, un texte de 12 px, une police système, le visage recadré une rangée
  trop bas. **[KO → compris]** une première faute (la pointe d'un clou retirée) ne changeait rien (la pointe tombe sur le contour, déjà d'encre) :
  remplacée, le test n'a pas été touché.
- **Validation** : typecheck, `npm test` **162 / 162**, build, `art:validate` (18 manifestes, 30 sources, 0 erreur).
- **Avant / après** (`screenshots/calibration/ui3-design/`, `main` figé à gauche) : `town-mara-morning-1920x1080.png`, `town-night-1920x1080.png`,
  `matchsheet-1920x1080.png`, `mara-phone-375x812.png`, `town-morning-phone-375x812.png`, `forecourt-morning-812x375.png`,
  `arena-window-night-1920x1080.png`, `arena-window-midday-1280x720.png`, `arena-window-midday-812x375.png`, `title-1920x1080.png`.

### Journal — [OK] archivage (passes gardées au-delà d'environ 60 Ko)
- Avant cette passe, les passes gardées faisaient 59 904 octets ; avec elle, plus de 76 000. S3b, F3, D9, FR1 et AD1, closes (fusionnées), partent
  d'un seul bloc vers `journal/23-passes-S3b-AD1.md` (25 051 octets, SHA-256 du bloc `71b28f3af1e03ec5…`) ; restent 34 853 octets avant cette passe.
  Preuve **8 / 8** (script hors dépôt, contre la copie de `JOURNAL.md` d'avant le déplacement : corps de l'archive égal au bloc ; S3b, F3, D9, FR1,
  AD1 contigus, suivis d'AA1 ; plus dans `JOURNAL.md` ; chacune dans un seul fichier de `journal/` ; `JOURNAL.md` inchangé à partir d'AA1 ; seules la
  phrase d'en-tête et une ligne d'index changent ; en-tête comme `journal/22` ; CRLF seuls). Contrôle négatif : un bit changé dans une copie de
  l'archive → 7 / 8. **[KO → corrigé]** un premier déplacement (S3b à FR1) laissait 62 Ko avec cette passe : refait depuis la copie d'avant, AD1
  compris ; le sixième contrôle cherchait encore l'ancien nom de fichier : le contrôle a été corrigé, pas les fichiers.

### Restes [?]
- **Hors portée, inchangés** : l'écran de chargement (créé par `main.ts` pour toutes les pages, police système), le panneau DEV et le HUD de la ville
  libre ; ils ne sont pas dans le mode jouable, sauf l'écran de chargement, visible pendant la génération.
- P4 (le dialogue en bas sur ordinateur, le locuteur visible), P5 (« Here » réduit aux actions du lieu), P6 (la fiche de match, la victoire, le
  journal, le tableau) : tâches à part. Le libellé des achats répète toujours le prix à côté de l'étiquette.
- Au téléphone, l'invite « E Talk to … » (inutile sans clavier) passe sur la feuille de « Here » quand elle est ouverte ; les tactiles restent hors
  tranche (E30).
- La barre d'actions de l'arène est plus haute que les 60 px de P3 (76 px) ; sous 1 241 px de large, ses sous-libellés sont masqués.
- Les bustes des personnages principaux (L4, plus tard) ; le visage de Wynn sans sa variante ; le joueur montre le visage de `hero-x2-v4` dans les
  dialogues alors que l'arène montre Ren généré (AA1-1 l'attend).
- La palette reste provisoire (note de l'opérateur) : à juger en jeu par l'opérateur, de jour et de nuit.
- L'artefact publié de l'arène (Passe P2) montre l'ancien HUD.

### Pensée
- Un « 0 px » se mesure sur ce qu'une adresse montre vraiment : sous `hud=0`, les écrans de K.O. et de pause restent visibles ; ils gardent leur
  ancien aspect derrière la classe qui masque le HUD, prouvé sur le moment du K.O.
- Un outil qui mesure le texte d'une page se trompe de deux façons opposées : il compte ce qui est caché sous un autre élément, ou il prend pour une
  coupe ce qui défile. Son contrôle négatif porte les quatre défauts qu'il doit trouver.
- Une mesure qui lit des pixels (le contraste du télégraphe) lit aussi ce que l'interface pose dessus : une barre déplacée a fait tomber le chiffre
  sans changer le télégraphe. La règle de l'outil (le sol devant le télégraphe) devient une règle de mise en page.
- Une barre qui grandit avec la taille du texte se mesure à chaque largeur de fenêtre, pas seulement en 1080p : 1 411 px ne tiennent pas dans 1 280.
- Une faute injectée qui ne change rien n'est pas une faute : elle se vérifie avant de conclure qu'un test est faible.

