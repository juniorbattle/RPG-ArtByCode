# Journal de bord — archive : passes 4A-sedecies à M2 (2026-10-16 → 2026-10-17)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-10-18 (Passe M3) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe 4A-sedecies — Distribution de production : docker et marchande animés (idle, marche, parole), intégrés au jeu ; activation = approbation opérateur (2026-10-16)

### Demande opérateur (2026-10-16)
- Mot pour mot : « mais tu as deja les images ref, je te trouve que tu n'es pas assez autonome, travaille en te basant sur les images refs partages
  et effectue un travaikl coherent avec un resultat final correct qui sera visible en prod, je veux que les personnages soient integres et
  fonctionneles idle, marche. valide ce que tu as besoin pour achever cette tache. je veux juste un retour lorsque le resultat finale est pret ».
- Lu comme : ne plus attendre la source V4 ; partir des planches déjà partagées ; le docker et la marchande intégrés au jeu de production,
  avec idle et marche dans toutes les directions ; un seul retour, à la fin.

### Sources — [OK] la planche 01-16 donne quatre vues par PNJ
- La planche « 16 generic townsfolk » montre chaque PNJ de face, de trois-quarts, de dos et de profil, à la même échelle : c'est la matière
  d'une marche. Docker = n° 05 (rangée 2), marchande = n° 02 (rangée 1). Recadrages : docker dos 195,347,269,505, profil 282,345,341,505 ;
  marchande face 388,117,452,272, dos 546,121,608,272, profil 620,122,683,272 ; pas 1,775 (celui du docker). La face du docker refaite par la
  même chaîne est **identique au bit** à `x2-auto.png` du paquet approuvé.
- La marchande de la planche (n° 02) remplace la source ChatGPT V3 : proportions de la base commune d'origine, trois vues, même style que
  le docker. `merchant-x2-v1` reste comme preuve. (La consigne d'originalité face à 02 / 03 / 09 visait la génération d'un nouveau dessin ;
  l'opérateur demande maintenant de partir des références.)

### Chaîne — [OK] outils, recette rejouable
- `quantize-palette.mjs` : une palette pour plusieurs vues (le k-means de `reconstruct-grid` sur toutes les vues, ou les couleurs d'un
  sprite approuvé). Sur la seule face du docker, il reproduit `x2-quant64.png` **au bit**. Docker : dos et profil sur les 64 couleurs de
  l'export approuvé ; marchande : un k-means joint de 64 couleurs (erreur OKLab moyenne 14-15 ‰).
- `rig-engine.mjs` (découpe, remappage de rangées, rotation RotSprite, IK à deux os, membres peints, déplacement avec remplissage,
  souffle) ; `build-character.mjs` : planche archivée → reconstruction par direction → palette → `prepare` (miroir, recalage, retouches
  notées) → images → contrôles du contrat → Aseprite en lot (`.aseprite` + PNG + JSON, tags `<anim>-<dir>`) → chaque image exportée
  comparée au texel près. `--check` reconstruit dans un dossier temporaire et compare : **identique** pour les deux. La recette entière
  tient dans `art-lab/characters/rigs/<id>.rig.mjs`. `verify-provenance --rebuild` lance `--check` pour ces paquets : **intact** (et les
  deux paquets v1 restent intacts).
- Profil du docker : miroir (le profil natif du jeu regarde à gauche), décalé de 2 texels (bottes sur la colonne d'ancrage), rangée 0
  effacée et une rangée de casquette retirée (le profil se reconstruit sur 91 rangées, le cadre garde un anneau transparent).

### Animation — trois itérations, deux critiques indépendantes
- [KO] v1 du profil : tourner la masse du pantalon (les deux jambes fusionnées dans la vue) mêle les jambes et déforme les bottes.
- [OK] Jambes de profil **peintes** dans la rampe de la vue et posées par IK, bottes d'origine déplacées rigides. Marche à 6 images (cadence du
  jeu 7,5 i/s : 0,8 s le cycle). Face / dos : jambes remappées entre bassin et pied (levée 2 / 5 / 2 rangées), haut du corps qui suit la
  descente du profil. Marchande : bottes rigides sous la robe, ourlet, montée et descente du corps.
- Critique 1 (agent neuf, aveugle) : profil du docker 2/5 (jambes trop sombres et fines, pieds qui glissent au passage, botte arrière
  retournée), bras figés face / dos, marchande qui « glisse » face / dos, parole illisible de profil / dos, souffle en interrupteur.
  Cause de la botte : **erreur de signe** de la rotation du pied (pointe levée au lieu du talon). Corrigé.
- Critique 2 : profil 3/5, botte arrière résolue, souffle correct ; reste : les mouvements d'**un texel ne se lisent pas** à ~1,8 px / texel,
  foulée trop longue (fente), hochement à chaque syllabe. Itération 3 : bras 2 rangées, transfert de poids 2 texels, ourlet levé côté jambe
  qui passe, foulée 13 texels par pas (0,69 m/s contre 0,8-0,95 pour les promeneurs : léger glissement accepté), revers évasé au-dessus de la
  botte, levée de passage 6, parole sur 6 images (hochement une fois par cycle).
- Final : docker 30 images (idle 4 + marche 6, × 3 directions) ; marchande 48 (+ parole 6 × 3). Non changés exprès (viennent de la planche) :
  volume du bonnet selon la vue, sac de face de la marchande, sacoche du docker.

### Intégration production — [OK] implémentée ; [?] activation = approbation de l'opérateur
- `src/characters/BakedDecode.ts` (décodeur PNG exact + découpe JSON Aseprite, sortis de `src/lab/` ; le chargeur DEV les réutilise),
  `SheetMeta.ts`, `BakedCast.ts` (table : export importé comme ressource hachée, champs de garde du manifeste seulement, table `files` du
  paquet, archétype remplacé, échelle 0,9) ; `ActorSystem.cast` : même spawn, rôle, comportement et tirages ; seuls sprite, échelle et hauteur
  changent ; `?cast=generated` = ancienne distribution ; DEV seul : `?cast=candidate`. `art:validate` refuse un manifeste `production` dont
  le PNG ne correspond pas à son paquet (contrôle négatif vérifié).
- [KO → décision] L'outil de permission a **refusé** d'écrire une approbation « déléguée » dans les manifestes (approved / production au nom de
  l'opérateur). Les manifestes restent `candidate`, `runtimeUse: "lab"`, non approuvés : le jeu de production ne les charge pas. Activation =
  l'opérateur approuve (approved, status, approval, runtimeUse) ; rien d'autre à changer.
- Docker → porteur (le promeneur du quai et la ronde de la cour de la forge) ; marchande → marchande de l'étal principal. Elle **ne marche pas**
  en jeu : son point est dans la boîte englobante (alignée sur les axes) du collisionneur de l'étal, aucun pas n'y est possible (comme la marchande
  générée) ; sa marche est testée sur sol libre. Elle parle (bulle « … ») comme la marchande générée.

### Validation — [OK]
- Démarrage par défaut (aucun manifeste approuvé) contre `894c4d3` : **0 px** en A / B / C / D, personnages compris (captures déterministes) ;
  idem avec `?cast=generated`.
- `?cast=candidate` : les 11 personnages tirés gardent ordre, rôles, positions, teintes, comportements et niveaux de détail.
- Autotest (test 2) des deux planches : CPU 0, GPU 0 texel à 1 / 2 / 3 / 2,37, contrôles négatifs en échec, débordement 0. L'outil comparait
  la planche entière à une image (planches multi-images) : corrigé (découpe de `idle-down` 0).
- Perfs (`tools/perf.mjs`, entrelacé, 3 tours) : caméra B 9,49 ms (générée) / 9,51 ms (distribution), caméra C 9,22 / 9,05 ms (bruit) ; **108 appels de dessin** dans toutes les variantes ; texture cuite 512 × 960 (1,97 Mo) pour 78 images.
- Build : JS 824 923 → 847 433 o (gzip 238,64 → 243,67 Ko) + deux PNG (49 / 71 Ko) livrés mais non chargés tant que non approuvés ; code DEV
  absent. Une build de **simulation** (filtre ouvert aux candidats, hors dépôt) charge les deux planches depuis leurs ressources hachées,
  SHA-256 égaux aux paquets.
- Marche en scène (captures 1:1, pas de 1/60 s) : docker et marchande dans les trois directions ; planches dans `art-lab/characters/reviews/`.

### Pensée
- Une planche à quatre vues est la matière d'une marche : chercher les vues existantes avant de faire générer une image unique.
- Des jambes fusionnées dans une vue (profil) se **peignent** dans la rampe de la vue et se posent par IK ; tourner la masse ne marche pas.
- À ~1,8 px écran / texel, un mouvement d'un texel ne se voit pas : 2 texels pour tout ce qui doit se lire en mouvement.
- La critique par agent neuf, deux fois, a trouvé un bug (signe de rotation) que les planches à l'œil n'avaient pas montré.
- Une approbation ne s'écrit pas au nom de l'opérateur, même déléguée : préparer l'activation (un seul changement de manifeste) et la demander.

Preuves : `art-lab/characters/reviews/dockworker-x2-v2/`, `reviews/merchant-x2-v2/` (planches + README + autotests) ; paquets
`provenance/<id>/` ; captures brutes et scripts (walkcam, montage) dans `art-lab/characters/scratch/gm/` (non versionné).

## Passe 4A-septendecies — Approbation de production : docker et marchande actifs dans le jeu (2026-10-17)

### Décision opérateur (2026-10-17)
- Mot pour mot : « J'approuve dockworker-x2-v2 et merchant-x2-v2 pour la production (runtimeUse production). Active-les, valide, commite et
  pousse. »
- Manifestes : `status: "approved"`, `approved: true`, `approval` (opérateur, 2026-10-17, citation), `runtimeUse: "production"` ; paquets
  `PROVENANCE.json` : statut et décision ajoutés. Pas de Gold Master déclaré. Aucun autre changement de code : la porte du manifeste suffit.

### Validation — [OK]
- `art:validate` : 0 erreur (dont la règle de production : chaque PNG égal au SHA-256 de son paquet) ; `verify-provenance` intact (4 paquets).
- `npm run typecheck`, `npm run build` : verts ; JS 847 457 o (gzip 243,68 Ko) + les deux PNG (49 / 71 Ko), maintenant chargés.
- Build de production servie (`vite preview`) : par défaut les deux planches sont chargées (`runtimeUse` production, SHA-256 égaux aux paquets,
  texture cuite 512 × 960) ; le porteur et la marchande sont remplacés ; `?cast=generated` rend l'ancienne distribution ; `?cast=candidate`
  est ignoré (DEV seul).
- Captures déterministes A / B / C / D : build de production par défaut = rendu DEV relu en `?cast=candidate` : **0 px** ; build de production
  en `?cast=generated` : écarts identiques au pixel près à ceux mesurés à la passe précédente entre la distribution et `894c4d3`
  (20 013 / 95 258 / 46 657 / 17 995 px) : l'ancienne distribution reste intacte derrière le paramètre.

### Pensée
- Préparer l'intégration derrière la porte du manifeste a rendu l'activation triviale et sûre : un changement de données, prouvé par
  l'égalité au pixel avec ce qui avait été relu.

## Passe 4A-duodevicies — Distribution étendue : forgeron, garde, passant encapuchonné (candidats, activation = approbation opérateur) (2026-10-17)

### Demande (2026-10-17)
- Consigne de la séance de travail parente, pour le projet de l'opérateur : étendre la distribution cuite avec la même chaîne, depuis la
  planche 01-16 : n° 04 Blacksmith Helper → `blacksmith` (cycle `hammer` de profil à la forge : animation ou décision explicite), n° 06 City
  Guard → `guardA` / `guardB`, n° 13 Hooded Passerby → `hooded` ; manifestes `candidate` / `runtimeUse: "lab"`, paquets de provenance, câblage
  dans `BakedCast.ts` derrière la porte du manifeste ; ne jamais écrire d'approbation au nom de l'opérateur. Branche `cast-blacksmith-guard-hooded`.

### Sources et reconstruction — [OK] avec deux écarts mesurés
- Recadrages (vues 1, 3, 4 de chaque PNJ) : forgeron 1089,117,1170,271 / 1257,114,1339,272 / 1348,119,1407,272 ; garde 385,330,461,504 /
  548,334,622,505 / 633,334,692,506 ; encapuchonné 31,818,113,988 / 204,818,282,989 / 294,818,355,991. Entre le dos et le profil du garde et de
  l'encapuchonné il n'y a que 2-4 px de fond : la marge de 6 px de l'outil y fait entrer le voisin, les recadrages sont resserrés en conséquence.
- [KO → décision] **Le casque et la capuche ne tiennent pas dans le cadre** : au pas du docker (1,775) le garde fait 96-98 rangées et
  l'encapuchonné 99-100, pour 90 rangées disponibles au-dessus des pieds (tête rognée). Pas 1,9 / 1,92 / 1,95 / 2,0 testés : 1,92 ouvre une
  fente dans la capuche de dos, 2,0 casse le haut de la capuche ; **1,95 retenu pour les deux** (87-91 rangées). Première version à l'échelle
  0,9 × 1,95 / 1,775 (taille relative de la planche gardée) : la critique 1 a vu les texels 10 % plus gros à côté du forgeron. Retenu : **échelle
  0,9 pour toute la distribution** (même texel à l'écran), garde 1,86 m et encapuchonné 1,82 m, ~10 % plus petits que l'échelle unifiée de la
  planche (2,04 / 2,00 m). Forgeron au pas 1,775, 1,82 m.
- [KO → outil] La cape de l'encapuchonné est d'un marine proche du fond de la planche : le remplissage du fond (seuil 26) découpait des fentes
  transparentes dans le dos (89 texels de trous sur les rangées 20-80). Recadrages décalés : 43 à 156, jamais 0. Seuil 16 : 9 (dos) et 0
  (profil), plis gardés. → option `reconstruct-grid --bg-threshold=<n>` (désactivée par défaut), passée par `build-character` depuis
  `source.options` du rig.
- [OK, trouvé à la critique 2] Les « longs cheveux noirs » du forgeron (face et dos) sont un **artefact de la fermeture verticale** : le fond
  entre la mâchoire / la nuque et les épaules est rempli de la couleur la plus sombre (la planche montre oreilles et fond). Mesure d'abord
  trompeuse : la masse de dos avait la même valeur que la reconstruction pleine couleur (L 0,352 / 0,354) — normal, l'artefact est dans la
  reconstruction elle-même. Corrigé dans `prepare` (`trimDark` : bandes quasi noires coupées à un texel de contour) ; le seuil devait être 0,15
  (le noir du dos est à L 0,14).
- Palettes jointes de 64 couleurs : erreur OKLab moyenne forgeron 12,4-13,3 ‰, garde 13,6-15,3 ‰, encapuchonné 7,2-10,6 ‰.

### Animation — trois itérations, deux critiques aveugles (agent neuf, lecture à froid, auto-critique écrite avant)
- Itération 1 : la recette du docker (jambes de profil peintes + IK, remappage face / dos), jambes rigides glissées sous l'ourlet pour le garde
  et l'encapuchonné (tabard, cape), marteau peint (la planche ne montre aucun outil). Critique 1 : **4/10** — boucle du marteau qui traverse le
  corps (image 3 devant → image 0 derrière), marches face / dos à ~1 texel, jambes de profil confondues, tissus figés, artefacts (barre du poing
  du garde : masque de bras qui emportait un bord de cape ; brin sur l'épaule du garde de dos : fente de fond ; carré creux de l'encapuchonné :
  trou laissé par le cisaillement de la cape), texels 10 % plus gros. Cause de « la marche glisse » chez l'encapuchonné : **aucun rebond** de
  profil (la descente venait de l'IK seule, nulle pour lui).
- Itération 2 : rebond imposé de 2 rangées (contact le plus bas), levée 3 / 5 / 3, jambe lointaine deux pas plus sombre, tissus qui traînent
  d'une image (2-3 texels), ourlets cisaillés de 2, bras du marteau en deux segments cerclés de sombre, échelle 0,9. Critique 2 (vérifie la 1) :
  **6/10** — corrigés : boucle, artefacts, densité, tissus ; restent : image 1 du marteau (bras confondu avec le bandeau dans l'éclat de la
  forge), frappe à plat, pieds de profil « en bouillie », balancement des bras. Affirmation vérifiée et **fausse** : « rebond d'un seul côté »
  (rangées hautes mesurées 6 4 5 6 4 5) ; vraie pour le profil du forgeron (amplitude 1 : l'IK impose déjà 1 rangée au passage → +1).
- Itération 3 (non relue par un critique, vérifiée au texel par l'auteur) : marteau = levée devant, armé derrière la tête (bras à hauteur
  d'épaule, ne croise plus visage ni bandeau), frappe tête sous le poing avec 3 texels de penché, rebond ; bras face / dos 3 rangées ; îlots
  < 4-6 texels retirés autour des pieds ; botte lointaine plus sombre ; bandes noires coupées.
- Marteau : 4 images à 5,5 i/s, **frappe sur l'image 2**, celle où `App` déclenche les étincelles ((t × 5,5 − 2) / 4) ; le moteur n'a pas de
  durée par image : 4 images obligatoires pour rester synchrone.
- Final : forgeron 34 images (idle 4 + marche 6 × 3 directions + marteau 4), garde 30, encapuchonné 30. Non changés exprès : souffle d'une
  rangée (celui de la distribution approuvée), valeurs sombres / mains claires / visage de l'encapuchonné (la planche).

### Intégration — [OK] implémentée ; [?] activation = approbation de l'opérateur
- `BakedCast.ts` : trois entrées `candidate` ; `replaces` devient une liste (un garde pour `guardA` et `guardB`) ; `needs: ['side/hammer']`
  pour le forgeron (chargement refusé s'il manque). Spawns, rôles, positions, teintes, comportements, orientations, niveaux de détail
  inchangés (test des acteurs, forge normale et sabotée) ; seuls sprite, échelle et hauteur changent (+ l'animation de départ du porteur,
  déjà acceptée).
- **Capacité de la texture cuite** : 78 + 94 images = 172 → 512 × 2112 au-delà des 2048 garantis par WebGL2 (`BW` 512 = 168 images x2).
  `BW` → 1024 (336 images) : 1024 × 480 par défaut, 1024 × 1056 avec les candidats. Adressage par case entière : aucun effet sur l'image.
- `build-character.mjs` : animation `hammer` (ordre idle, walk, talk, hammer ; 182 ms) et `source.options`. Les deux outils changés ont leur
  empreinte mise à jour dans les quatre paquets existants (note de maintenance, ancienne empreinte gardée) après `verify-provenance --rebuild`
  **identique** avant et après ; les 7 paquets `intact`.

### Validation — [OK]
- Démarrage par défaut contre `main` (`f34e2f2`, arbre servi à part) : **0 px** en A / B / C / D et C / D forge sabotée ; `?cast=generated`
  identique au pixel (écart max 0) à celui de `main` ; `?cast=candidate` : seuls les PNJ remplacés, leurs ombres / reflets et le halo
  d'in-scatter autour d'eux changent.
- Autotest (test 2), les cinq planches, texture 1024 × 480 et 1024 × 1056 : CPU 0, GPU 0 texel à 1 / 2 / 3 / 2,37, contrôles négatifs en
  échec (docker 6 616 / 10 804, comme à la passe 4A-sedecies), débordement 0 (négatif 37 517).
- Perfs (`tools/perf.mjs`, entrelacé, 3 tours, itération 1, mêmes nombres d'images) : B 9,31 (`main`) / 9,31 (générée) / 9,20 (production) /
  9,35 ms (candidats) ; C 9,13 / 9,12 ; D forge sabotée 8,47 / 8,51 : bruit ; 108 / 111 appels de dessin partout.
- Build : JS 869 600 o (gzip 246,0 Ko, +22 Ko : tables d'images JSON) + trois PNG livrés non chargés (47 / 55 / 64 Ko). `art:validate` 0 erreur.
- Densité écran au spawn (1080p) : forgeron 1,5 (B) - 2,1 (C), encapuchonné 1,8-2,7, gardes de la barrière **0,5 (A) / 1,05 (B)** px / texel.

### Constats hors périmètre (non changés)
- Le forgeron de `forge-work` regarde à l'opposé de l'enclume en B et C (étincelles à 35-50 px à sa gauche, marteau à droite) : orientation
  du spawn générée, identique avant ; décision de mise en scène.
- Un seul garde pour deux : uniformes et visages identiques ; les lances des gardes générés disparaissent (aucune sur la planche).

### Pensée
- La fermeture verticale de la reconstruction transforme le fond entre deux masses (nuque / épaules) en traits noirs : chercher ces bandes
  sur chaque vue, et comparer à la planche, pas à la reconstruction (qui contient l'artefact).
- Un personnage plus haut que le cadre se rééchantillonne plus gros, mais se présente à l'échelle commune : la densité de texel se voit tout de
  suite à côté du cast, une taille 10 % plus petite non.
- Une affirmation de critique se mesure avant d'être suivie (rebond « d'un seul côté » : faux ; « cheveux noirs » : vrai, mais pas pour la
  raison supposée).
- Un rebond imposé, pas seulement déduit de l'IK : un personnage aux jambes courtes sous un manteau n'en avait aucun.

Preuves : `art-lab/characters/reviews/blacksmith-x2-v1/`, `guard-x2-v1/`, `hooded-x2-v1/` (planches, marche et marteau en scène, comparaisons,
autotests) ; paquets `provenance/<id>/` ; captures brutes, critiques et scripts dans `art-lab/characters/scratch/cast2/` (non versionné).

## Passe 4A-undevicies — Approbation de production : forgeron, garde, passant encapuchonné actifs dans le jeu (2026-10-17)

### Décision opérateur (2026-10-17)
- Mot pour mot : « J'approuve blacksmith-x2-v1, guard-x2-v1 et hooded-x2-v1 pour la production (runtimeUse production). Active-les, valide,
  commite et pousse. »
- Manifestes : `status: "approved"`, `approved: true`, `approval` (opérateur, 2026-10-17, citation), `runtimeUse: "production"` ; paquets
  `PROVENANCE.json` : statut et décision ajoutés. Pas de Gold Master déclaré. Aucun changement de code : la porte du manifeste suffit.

### Validation — [OK]
- `art:validate` : 0 erreur (règle de production : chaque PNG égal au SHA-256 de son paquet) ; `verify-provenance` intact (paquets des cinq
  planches de production).
- `npm run build` (typecheck compris) : vert ; JS 869 640 o (gzip 246,04 Ko) + les cinq PNG, maintenant chargés.
- Build de production servie (`vite preview`) : par défaut les cinq planches sont chargées en `production` (SHA-256 égaux aux paquets, texture
  cuite 1024 × 1056) ; forgeron, gardes (barrière et forge sabotée) et passants encapuchonnés remplacés ; `?cast=generated` rend l'ancienne
  distribution ; `?cast=candidate` est sans effet en production (DEV seul).
- Captures déterministes A / B / C / D et C / D forge sabotée : build de production par défaut = rendu DEV relu en `?cast=candidate` : **0 px**
  dans les six vues ; build de production en `?cast=generated` = DEV `?cast=generated` = distribution générée de `main` (`f34e2f2`) : **0 px**
  (écart maximal 0) : l'ancienne distribution reste intacte derrière le paramètre.

### Pensée
- Deuxième activation par la seule porte du manifeste : la preuve tient en deux égalités au pixel (production = rendu relu ; générée = `main`).

## Passe 4A-vicies — Forge : le forgeron frappe du côté de l'enclume (orientation du spawn ; approuvée par l'opérateur) (2026-10-17)

### Demande (2026-10-17)
- Consigne d'une séance parente, pour le projet de l'opérateur : le forgeron `forge-work` frappe à l'opposé de l'enclume en B et C (constat
  hors périmètre de la passe 4A-duodevicies). Choisir une orientation (ou un autre changement minimal de mise en scène) pour que la frappe
  tombe côté enclume en B, C et D ; rôle, comportement et tirages inchangés ; preuves par projections et captures déterministes A-D
  (`?cast=generated`, DEV `?cast=candidate`) ; vérifier la gerbe d'étincelles (image 2 du marteau) à la tête du marteau. Change l'image de
  démarrage : **approbation explicite de l'opérateur avant d'atterrir**.
- Pendant la mesure, une autre séance a commité l'approbation des trois planches (`2b2707f`, passe 4A-undevicies) et fusionné
  `cast-blacksmith-guard-hooded` dans `main` (`8693690`) : le forgeron cuit est désormais celui du démarrage par défaut. Aucune ligne de
  `src/` ni octet de planche n'a changé entre `14b8686` et `8693690` (diff hors fins de ligne CRLF ; contrôle `?cast=generated` `14b8686` contre
  `8693690` en B : 0 px) : les paires mesurées contre `14b8686` restent valables ; la paire « démarrage par défaut » est refaite contre une
  copie figée de `8693690`.

### Cause — [OK] mesurée
- La forge est en miroir (`mirror: true` dans `layoutSlots`, donc `m = −1` pour toute graine). Graine 1842 : forgeron à (7,60 ; −3,15),
  émetteur d'étincelles `X(ax, −0,1), 0,95, az` à (7,05 ; 0,95 ; −3,40) : 0,55 m vers −x et 0,25 m plus loin de la caméra.
- `facing = m × 0,2π` donne le regard (−0,588 ; 0,809), presque vers la caméra. Le cycle `hammer` n'existe que de profil : `SpriteRenderer`
  prend `side/hammer` retourné par `sideFlip = sx > 0` (sx = composante du regard sur la droite caméra, `ActorSystem.applyFacing`).
  sx = +0,669 (A), +0,367 (B), +0,407 (C), −0,276 (D) : profil tourné vers la droite en **A**, B et C, alors que les étincelles sont à
  gauche des pieds dans les quatre cadrages. Le constat de la passe 4A-duodevicies oubliait A (petit à l'écran, mais tête du marteau à 29-32 px
  du mauvais côté en 1080p).

### Changement — orientation seule
- `src/district/ForgeGenerator.ts` : `Math.PI * 0.2` → `Math.atan2(0.55, -0.25)` (114,4°, × `m`) : le forgeron regarde le point de frappe
  (l'émetteur). Regard (−0,910 ; −0,414). Ce regard est parallèle au vecteur forgeron → émetteur : le côté écran du profil a toujours le signe
  de la position des étincelles le long de la droite caméra, quel que soit le cadrage. Pour tout lacet de −78° à −20° (A à D et leurs mélanges),
  les deux termes de sx sont négatifs : aucune bascule pendant une transition.
- sx après : −0,594 (A), −0,838 (B), −0,814 (C), −0,997 (D) ; milieux de mélange AB −0,728, BC −0,826, CD −0,963, BD −0,969. `dir` passe de
  `down` à `side` en B, C, D (même image `side/hammer`, même retournement) et reste `down` en A (repli sur le profil, comme avant).
- Ce qui ne change pas : relevé complet des acteurs juste après `populate` (base `14b8686` contre arbre de travail, générée et candidate, forge
  normale et sabotée, 11 / 13 acteurs) : **seul `faceVec` du forgeron `forge-work` diffère** ; positions, graines et attentes de comportement,
  points de patrouille, teintes, échelles, animations, bulles identiques. Le spawn `forge-alarm` (forge sabotée) n'est pas touché. Parler au
  forgeron le tourne toujours vers le joueur (comportement existant).

### Projections (1080p, `tools/eval.mjs` sur `window.__app`) — [OK]
- Tête du marteau = plus grand amas 8-connexe des texels opaques dans l'image 2 et transparents dans les images 0, 1, 3 (généré : 20 texels,
  colonnes 5-8 × rangées 30-35 ; cuit : 97 texels ×2, 1-16 × 54-65), placée par la formule du shader (`uBillRight` / `uBillUp`, échelle,
  retournement) puis projetée. Écart horizontal émetteur − centre de la tête (px), généré / cuit :

  | cadrage | avant | après | émetteur au-dessus du centre (après) |
  |---|---|---|---|
  | A | −28,6 / −32,1 (tête à droite) | +0,1 / +3,7 | 11 / 8 px |
  | B | −64,4 / −71,9 | −3,7 / +3,8 | 16 / 11 px |
  | C | −90,9 / −101,6 | −4,7 / +6,0 | 20 / 12 px |
  | D | −11,9 / −2,5 | inchangé | 25 / 18 px |
  | mélanges AB / BC / CD / BD (après) | — | +0,3 / −1,9 / −9,6 / −7,9 ; +5,1 / +5,9 / −0,4 / −0,4 | 7-22 px |

- L'émetteur est au bord haut de la tête (généré : 7 px au-dessus de sa boîte en A, B, C, 13 px en D, soit 1,4-4 texels ; cuit : 0-4 px en A,
  B, C, 7 px en D) : la tête frappe la barre chaude (0,91-0,945 m), l'émetteur est à 0,95 m. D était déjà ainsi avant. Émetteur non déplacé.

### Captures déterministes (`baked-proof.mjs shots`, 1920 × 1080) — [OK]
- Vues A, B (2 ; 1,5), C (8 ; 1), D (16 ; 2), C / D forge sabotée. 90 pas = image 0 du marteau ; 113 pas = image 2, 3 pas après la gerbe (pas
  110). Témoins de répétition (deux chargements de l'arbre de travail) : **0 px** dans les six vues, générée et par défaut.
- `?cast=generated` (`14b8686` contre travail) : A 672 px, B 14 272, C 22 202, **D 0**, C / D sabotée **0** ; à 113 pas A 659, B 11 101,
  C 23 252, D 0. En B, 10 723 px autour du forgeron (écart max 150) ; ailleurs 3 549 px à ≤ 7 niveaux, dont 3 312 à 1 niveau (halo de
  post-traitement) et un amas à 3-7 niveaux à ~200 px à sa gauche : sa longue ombre portée par le feu de forge, qui se retourne avec lui.
- Démarrage par défaut (forgeron cuit, `8693690` contre travail) : A 620, B 141 635, C 279 496, **D 0**, C / D sabotée **0** ; à 113 pas
  A 748, B 9 171, C 23 274, D 0 — identiques au pixel près à la paire DEV `?cast=candidate` contre `14b8686`. Les boîtes couvrent l'écran : en C, 129 661 px autour du forgeron (max 149)
  et 149 835 ailleurs, dont 148 739 à **1 niveau** (max 8 dans l'ombre) ; le témoin à 0 px montre que ce champ à 1 niveau est déterministe,
  causé par le changement (halo du post-traitement autour d'un sprite clair devant la lueur), pas du bruit.
- Vu au zoom (C, B ; 1 et 7 pas après la gerbe) : les étincelles naissent sur la tête du marteau, côté enclume, pour les deux sprites. Observation
  (non changée) : la tête du marteau cuit, claire, se détache mal sur la lueur de l'enclume ; avant elle se lisait sur le tonneau sombre.

### Décision opérateur (2026-10-17) — [OK] approuvé
- Mot pour mot : « J'approuve l'orientation du forgeron vers l'enclume (Passe 4A-vicies). Ouvre une branche pour cette tâche, commite le
  changement, le journal et les captures, puis pousse. »
- `npm run typecheck` vert. Changement, journal et captures clés commités ensemble sur la branche de la tâche (`cast-polish-facing`,
  partagée sur décision de l'opérateur avec les correctifs de distribution d'une autre séance, chacune ne commitant que ses fichiers), poussée.
- Fusion demandée par l'opérateur, mot pour mot : « si tout est bon on peut merge vers main comme cela l'autre tache en cours sera a jour ».
  Vérifié avant sur une copie propre de `700179e` : `npm run build` vert (typecheck compris, JS 869,65 Ko, gzip 246,05 Ko), `art:validate`
  0 erreur. `main` avancé en avance rapide jusqu'au commit de cette note, sans changer la branche de l'arbre partagé. La branche
  `cast-polish-facing` est **gardée** : les correctifs de distribution de l'autre séance y sont en cours (non commités) ; elle se fusionne et
  se supprime quand l'opérateur juge cette autre tâche finie.

### Pensée
- Une animation qui n'existe que de profil prend son côté écran du signe d'une seule composante du regard : un regard « presque vers la caméra »
  change de côté d'un cadrage à l'autre. Un personnage qui agit sur un objet regarde **l'objet** (vecteur dans le plan, depuis la géométrie),
  pas un angle choisi pour l'apparence : son côté écran suit alors l'objet dans tout cadrage.
- Un constat se vérifie dans les quatre cadrages, pas seulement dans ceux cités : A avait le même défaut.
- Un écart d'image qui couvre tout l'écran se lit par zones et par niveaux, avec un témoin de répétition, avant d'être jugé.

Preuves (non versionnées) : `art-lab/characters/scratch/smith-facing/` (captures, diffs, recadrages, scripts) ; recadrages clés dans
`screenshots/calibration/smith-facing/`.

---

## Passe 5 — Fenêtres étroites : bake de visibilité par pages bornées, repli explicite, recadrage du cadre 16:9 (2026-10-17)

### Demande (2026-10-17)
- Mission de l'opérateur, transmise par une séance parente : dans des aperçus étroits ou verticaux, une grande partie du Merchant District
  s'affiche sans ses bâtiments (PNJ, lanternes, quai, flaques et reflets restent). Bug bloquant : correctif définitif, prouvé empiriquement,
  sans dégrader le rendu canonique 16:9. Pistes fournies : A débordement GPU du bake (`Visibility.ts`), B FOV excessif (`CameraRig.ts`),
  C `App.resize()` sans re-bake. Hors périmètre : personnages, distribution, sources Aseprite, direction artistique, implantation, eau, VFX.
- Base : `700179e` puis `2eb83d1` (même `src/`, seul le journal diffère). Mesures dans deux arbres détachés servis sur :5186 (base figée)
  et :5187 (travail), chacun avec son cache Vite (deux serveurs sur le même `node_modules` se disputent `.vite/deps` : EPERM).

### Cause — [OK] démontrée (base, graine 1842, `clean=1&static=1&freeze=7.3&occ=0`)
- `bakeVisibility` empilait toutes les tuiles dans **une** cible de 3 840 × H, H = 35 rangées × round(480 / aspect) + 18 rangées ×
  round(240 / aspect) : 11 880 px en 16:9, 21 120 en 900 × 900, **38 104 en 665 × 1200**. Limites ici (ANGLE D3D11, Iris Xe) :
  MAX_TEXTURE_SIZE = MAX_RENDERBUFFER_SIZE = 16 384.
- 665 × 1200 et 900 × 900 : `glRenderbufferStorage` → GL_INVALID_VALUE (« Desired resource size is greater than max renderbuffer size »),
  `texImage2D: width or height out of range`, puis 258 avertissements GL_INVALID_FRAMEBUFFER_OPERATION ; la réduction GPU lit une texture
  incomplète → **0 pixel compté dans les 8 jeux** → Tier 3 = 738/738 pièces, **17/17 bâtiments entièrement retirés**, 7 615 triangles
  gardés (géométrie non taguée : sol, eau, lampes, étals) au lieu de 100 788. Élagué contre `vis=0` : 229 074 px (665 × 1200), 416 983 px
  (900 × 900). L'appli ne signalait rien : échec silencieux. Même chose sur 7719 et 30417 (735/735 et 740/740 pièces retirées).
- 1920 × 1080 et 1280 × 720 : même bake (il ne dépend que de l'aspect), Tier 3 317/738, 0 px contre `vis=0`. Mais la cible 16:9 dépasse
  déjà 8 192 (limite de nombreux GPU) et pèse ≈ 700 Mio transitoires (RGBA8 + profondeur, deux cibles avec la passe « derrière »).
- B confirmé : `fov × (16:9 / aspect)^0,85` donne 80,8° vertical en 665 × 1200 (30° en B), 48,9° en 900 × 900 ; même avec `vis=0`, le
  district n'est qu'une bande entre ciel et eau (`viewport-fix/B-665x1200-static-before-after.png`).
- C : sur la base, 1920 × 1080 → 665 × 1200 → 1920 × 1080 sans rechargement (pose B par défaut) : 0 px contre un chargement neuf à chaque
  étape. Rien ne re-bake après un changement d'aspect, mais aucune pièce manquante n'a été **montrée** ici (le bake 16:9 + 6 % couvrait
  cette pose) : [?] non démontré, rendu impossible par construction (ci-dessous).

### Correctif
1. **Bake par pages bornées** (`Visibility.ts`) : tuiles inchangées (480 × 270 / 240 × 135 en 16:9 ; bornées à 480 de haut sous l'aspect 1),
   rangées en étagères dans des pages ≤ `BAKE_PAGE` = 2 048 (minimum garanti WebGL2), bornées aussi par MAX_TEXTURE_SIZE,
   MAX_RENDERBUFFER_SIZE et MAX_VIEWPORT_DIMS. Chaque page est rendue puis comptée dans les **mêmes** compteurs additifs (GPU), ou relue et
   décodée (CPU) ; une seule relecture des compteurs à la fin. 16:9 : 13 pages de 1 920 × 2 025 ; cibles du bake **75,3 Mio** (deux pages +
   deux compteurs) au lieu de ≈ 704 Mio. Vues miroir, comptes par pièce × 8 jeux et passe « derrière » conservés (`uTile` en coordonnées de page).
2. **Repli explicite** : cible incomplète (`checkFramebufferStatus`), erreur GL levée pendant le bake, ou un jeu qui a des poses mais aucun
   pixel compté → `VisBakeError`. `App.regenerate` garde alors **toutes** les pièces (comme `vis=0`), écrit un `console.error`, expose
   `visibility.error` dans `snapshot()` et une ligne « VISIBILITY BAKE FAILED, culling off » au panneau. Compteur flottant incomplet → relecture
   CPU (pas un échec).
3. **Cadrage** (`CameraRig.applyFrame`) : le champ vertical d'une pose est celui du 16:9 à tout aspect (plus d'élargissement). Une fenêtre plus
   étroite que 16:9 montre un **recadrage horizontal du cadre 16:9**, placé par un décentrement d'objectif (`projectionMatrix.elements[8]`)
   tel que le joueur garde son NDC du cadre 16:9 ; ≥ 16:9 : inchangé (Hor+). Le recadrage ne sort jamais du cadre baké : il ne peut montrer
   aucune pièce coupée. Le graphe compose ses poses à `rig.poseAspect` = clamp(aspect, 16:9, cadre baké) (`?blend=`, `visproof`,
   `occ-inventory` aussi) ; reflet, particules, reveal et sprites lisent la matrice de projection et suivent.
4. **Resize** (`App.resize`) : le bake couvre max(aspect, 16:9) (`rig.frame`). Plus étroit : rien à refaire. Plus large que le cadre baké :
   recadrage vertical du cadre baké en attendant, puis, 400 ms après la fin du resize, district reconstruit pour le nouveau cadre (même graine ;
   `ActorSystem.rebind` : acteurs et particules gardent leur état). Bake raté ou `vis=0` : `rig.frame` = ∞ (tout est gardé).
5. Contrôles DEV : `?visfail=alloc` (page au-delà de la limite GPU : vrai refus), `?visfail=zero` (comptes effacés après un bake réussi),
   `?vispage=<px>` (taille de page). Outil `tools/viewport-proof.mjs` (bake, géométrie du cadre, culling, resize, contrôles négatifs).

### Validation
- **Rendu canonique 1920 × 1080** (`baked-proof.mjs shots`, scène complète : distribution, particules, reveal ; `freeze=7.3`) : A, B, C, D,
  AB, BC, CD, BD × graines 1842 / 7719 / 30417 : base contre travail **0 px dans les 24 vues** ; témoin de répétition (base deux fois) 0 px ;
  contrôle négatif `camB=-57.45` (lacet +0,05°) : B et les mélanges avec B diffèrent (0,78-1,19 M px), C, D, CD à 0, A à 0 / 39 px (le bake de B
  change). Premier essai sans `freeze` : témoin à 1,88 M px partout (grain lié à `uTime`) → mesure refaite.
- **Comptes par pièce** (16:9, base contre travail) : 1842 : 294 pièces aux comptes différents (Σ|Δ| = 2 788 px sur ≈ 25 M comptés), **2 masques**
  changent (pièces 97, 106 : 1-2 px, gagnent CD / AB) ; Tier 3 317 = 317, triangles gardés 100 788 = 100 788 ; 42 classes au lieu de 41,
  triangles dessinés B 210,1 k =, C 167,9 k =, D 239,2 → 239,5 k. 7719 : 4 masques, Tier 3 302 → 303 (pièce 146 : mur est, étage 2, rangée
  du fond, 1 px en CD → 0), 100 502 → 100 270 triangles. 30417 : 4 masques, Tier 3 304 = 304 (73 coupée, 106 gardée), 97 071 → 97 183.
  Toutes : murs latéraux de la rangée du fond vus par **un** pixel de bake (≈ 4 px écran en 1080p). Cause : la rastérisation dépend de la
  position de la tuile dans la cible (y ≤ 2 048 au lieu de ≤ 11 880 : précision du viewport et de la profondeur) ; preuve : pages de 2 048 /
  1 024 / 600 → Σ|Δ| 2 788 / 2 911 / 3 014 contre la base, mêmes masques ; la base rejouée deux fois : 0.
- **`tools/viewport-proof.mjs`** (travail ; 1920 × 1080, 1280 × 720, 900 × 900, 665 × 1200, 390 × 844, 2560 × 1080 × trois graines × 9 poses) :
  bake réussi partout, Tier 3 identique de 390 × 844 à 1920 × 1080 (même bake) ; coins de la vue dans le cadre baké ≤ 1,0000, dérive du NDC du
  joueur < 1e-6 ; contrôle « ancien objectif » 1,744 (900 × 900), 3,609 (665 × 1200), 4,974 (390 × 844) : le test voit le débordement.
  Élagué contre `vis=0` : en 1920 × 1080, 1280 × 720 et 2560 × 1080, **listes identiques à la base** pour les trois graines (écarts hérités,
  voir À reprendre 2b / 5) ; en fenêtre étroite 0 px sauf D-far 0-4 px et 7719 AB 2 px en 665 × 1200 (même nature). Base en 665 × 1200 :
  113 959-257 632 px par pose, 17/17 bâtiments retirés.
- **Resize sans rechargement** : 1920 × 1080 → 665 × 1200 → 1920 × 1080 → 2560 × 1080 (re-bake, cadre 2,3704) → 665 × 1200 : **0 px** contre
  un chargement neuf à chaque étape.
- **Contrôles négatifs du repli** (665 × 1200) : `visfail=alloc` → « the 1920 x 16385 page target is incomplete (status 0x8cd6; GPU limit
  16384) », Tier 3 0/738, 0 px contre `vis=0`, une erreur console ; `visfail=zero` → « no pixel counted for A, B, C, D, AB, BC, CD, BD (273 poses,
  13 pages of 1920 x 2025) », idem. Le même outil sur la base échoue (50 contrôles) : il détecte le bug.
- **Coûts** (entrelacés, même session) : bake (médianes, 5 tours × 2 régénérations) 367 → 300 ms, génération 926 → 910 ms (à froid
  1 083 → 1 046) ; 665 × 1200 : 307 ms. GPU (`perf.mjs`, deux séries) : 108 appels des deux côtés ; médianes B 10,57 / 10,99 puis 9,85 / 10,23 ms,
  C 9,73 / 9,40, D 9,22 / 9,52 : signes mélangés, dans le bruit (± 1 ms par tour ; les passes de post-traitement, qui ne peuvent pas différer,
  bougent autant). Mémoire résidente inchangée (188 Mo estimés) ; transitoire du bake ≈ 704 → 75,3 Mio (calculé sur les tailles allouées).
- `npm run typecheck` vert.

### Écarts et arbitrages pour l'opérateur
- **Cadrage étroit = recadrage** : 665 × 1200 montre 31 % de la largeur du 16:9 (900 × 900 : 56 %), à la même hauteur ; les repères de bord de
  cadre (lune en A, bateau et bannière en B) peuvent sortir du champ (`viewport-fix/A-…`, `B-…`, `D-…`). Montrer plus de contexte vertical
  exigerait un bake élargi (plus de pièces gardées en 16:9) : décision de l'opérateur, non faite.
- Les fenêtres entre 4:3 et 16:9 (portables 16:10) recadrent aussi (90 % de la largeur en 16:10) au lieu d'élargir le champ de 9 %.
- 2 à 4 pièces marginales par graine changent de masque (± 1 pixel de bake) ; images canoniques identiques sur 24 vues.
- Élargir la fenêtre au-delà du cadre baké coûte une régénération (≈ 0,9 s de fil principal) après le resize ; les PNJ gardent leur état.
- `viewport-proof.mjs` sort en erreur tant que les écarts hérités (À reprendre 2b / 5) ne sont pas élucidés : 22 contrôles en échec, tous
  identiques sur la base.

### Décision opérateur (2026-10-17) — branche
- Mot pour mot : « I approve a dedicated branch viewport-visibility-fix from main (2eb83d1) even though cast-polish-facing is still open.
  Commit the fix, journal, AGENTS.md, tool and key images, then push. » Exception à la règle d'une seule branche de travail, accordée par
  l'opérateur : `cast-polish-facing` (correctifs de distribution d'une autre séance) reste ouverte en parallèle ; aucun fichier commun
  (vérifié avec cette séance : ses lignes d'`App.ts` / `ActorSystem.ts` ne recoupent pas les nôtres). Fusion dans `main` quand l'opérateur
  juge la tâche finie ; l'arbitrage du cadrage (ci-dessus) reste ouvert.

### Décision opérateur (2026-10-17) — [OK] acceptée
- Mot pour mot (relayé par la séance principale) : « J'accepte la Passe 5 et le recadrage des fenêtres étroites tel quel : fusionne
  viewport-visibility-fix dans main, pousse main et supprime la branche. »
- Arbitrage du cadrage tranché : le recadrage du cadre 16:9 est gardé tel quel (pas de bake élargi). Branche `viewport-visibility-fix`
  fusionnée en avance rapide dans `main`, `main` poussé, branche supprimée (locale et distante). Les écarts de culling hérités
  (À reprendre 5) sont étudiés par une séance séparée.

### Pensée
- Une allocation GPU se dimensionne contre le minimum garanti (2 048) et se **vérifie** (complétude, erreurs GL) ; un bake qui conclut
  « rien n'est visible » est une erreur, pas une réponse : le repli garde tout et le dit.
- Un résultat de visibilité ne vaut que pour le cadre qu'il a baké : le rendu ne doit jamais montrer plus large (recadrer) ou il faut re-baker.
  Un recadrage par décentrement d'objectif garde la composition autour du joueur sans sortir du cadre validé.
- La rastérisation dépend de la position de la tuile dans la cible : des comptes bruts ne se comparent qu'à mise en page égale ; une preuve
  de non-régression compare les masques et les images finales.
- Une capture « déterministe » de `baked-proof` exige aussi `freeze=` (grain lié au temps) ; le témoin de répétition l'a montré.

Preuves (non versionnées) : dossier de travail de la séance (sondes, diffs, comptes, journaux de mesure) ; images clés dans
`screenshots/calibration/viewport-fix/`.

---

## Passe 4A-unvicies — Distribution : pixels noirs de la reconstruction et vue des marcheurs choisie à l'écran (2026-10-17)

### Demande (2026-10-17)
- Constat de l'opérateur, mot pour mot : « il y a encore quelques imperfections qu'il faudra corriger : presence de pixel noir sur le sprite,
  c'est leger mais tout de meme present. par ailleurs je remarque aussi les directions de sprite ne sont pas optimal, lorsque le sprite docker
  marche vers le haut et bas, son sprite position n'est pas bien oriente et donne l'impression qui marche de travers... cela est peut etre du a
  l'angle de la camera de la scene on en a 3 differentes. il faudra faire une correction ».
- Décision, mot pour mot : « Fais les deux corrections (pixels noirs et direction des sprites en marche) sur la même branche que la séance du
  forgeron, chacun ne commitant que ses fichiers. » Branche partagée `cast-polish-facing` (base `2eb83d1`). Pendant le travail, la passe 5
  (fenêtres étroites, autre séance, ses propres worktrees) a atterri dans `main` (`05d5f39`, `App.ts`, `ActorSystem.ts` et d'autres fichiers) :
  le commit de cette passe, jamais poussé avant, a été rejoué au-dessus de `main` (rebase local, aucun conflit ; hunks disjoints) et toutes
  les preuves finales ci-dessous sont refaites contre une copie figée de `05d5f39`.

### 1. Pixels noirs — cause [OK] mesurée
- `reconstruct-grid` ferme verticalement les trous courts (≤ max(3, round(3 × 3,55 / pas)) rangées : 6 au pas 1,775, 5 au pas 1,95) avec sa
  couleur la plus sombre. Plus haut que la taille, le fond vu entre deux masses (entre cheveux et épaules, à côté de la mâchoire et du cou)
  devient un trait quasi noir qui se lit comme une longue mèche : les cinq planches en avaient (rangées 16-47). Les « longs cheveux noirs » du
  forgeron (4A-duodevicies) étaient ce défaut ; sa coupe `trimDark` (L OKLab < 0,15) laissait des texels juste au-dessus du seuil. S'y
  ajoutaient des fragments détachés près des poings du forgeron dans le balancement des bras (6 îlots < 6 texels).

### Correction, essai 1 — [KO] fermeture coupée partout
- `--no-closing` sur les cinq planches : traits du cou partis, mais une **critique à l'aveugle** (agent neuf, planches ×4, sans savoir ce qui
  avait changé) a trouvé des bottes qui flottent. Mesuré contre les planches approuvées : face du forgeron, rangées 78-82, 94 → 69 texels
  opaques par image ; dos du passant 84 → 64 ; chaussure de la marchande 41 → 34 ; contours de jambes et bords de jupe cassés sur les cinq ;
  4 trous d'épingle d'un texel ouverts. La fermeture **restaure** les contours sombres des jambes et des bottes que le remplissage du fond prend
  pour du fond : c'était sa raison d'être (passe 4A E2, « bandes de cheville / contours » ; ce journal le notait déjà). Essai abandonné avant
  commit.

### Correction retenue — [OK] fermeture seulement sous la rangée 48
- `reconstruct-grid --closing-from=<rangée>` (désactivée par défaut, sortie identique au bit sans elle : les paquets `dockworker-x2-v1` et
  `merchant-x2-v1` se reconstruisent à l'identique, note de maintenance avec l'ancienne empreinte), passée par `build-character` depuis
  `source.options.closingFrom` ; les cinq rigs : `closingFrom: 48`. Les retouches de jambes approuvées de `prepare()` sont gardées telles
  quelles ; `trimDark` du forgeron retiré (plus rien à couper).
- **[KO → corrigé]** Une requantification refait le k-means et déplace toutes les couleurs (109 293 texels recolorés sur la marchande au
  premier essai). → Palettes approuvées **épinglées** : `provenance/<id>/palette.png` (les 64 couleurs de l'export approuvé) et
  `palette: { from }` ; le docker se projetait déjà sur l'export v1. Dernière passe sur chaque image : îlots < 6 texels retirés (forgeron,
  garde, passant), trous d'épingle fermés ≤ 2 texels remplis avec la couleur voisine la plus sombre (forgeron, passant : `fillPinholes`),
  chaque texel ramené à `palette.png`. Face du docker (export v1 approuvé) inchangée.

  | planche | texels retirés | ajoutés | recolorés | couleurs nouvelles | fond enclavé (texels) avant → après | îlots < 6 avant → après |
  |---|---|---|---|---|---|---|
  | `dockworker-x2-v2` | 501 | 0 | 0 | 0 | 10 → 10 | 0 → 0 |
  | `merchant-x2-v2` | 1 843 | 0 | 1 754 | 0 | 1 → 1 | 0 → 0 |
  | `blacksmith-x2-v1` | 930 | 6 | 1 366 | 0 | 4 → 0 | 6 → 0 |
  | `guard-x2-v1` | 884 | 0 | 893 | 0 | 151 → 151 | 0 → 0 |
  | `hooded-x2-v1` | 441 | 4 | 1 558 | 0 | 12 → 8 | 0 → 0 |

  Texels retirés : tous au-dessus de la rangée 48, sauf 49 du forgeron (fragments près des poings), 39 du garde et 31 du passant (bas des traits
  du cou qui commencent plus haut : profil du garde x 44, rangées 48-53 ; face du passant x 49-51, rangées 50-55). Les zones des bottes signalées
  par la critique sont revenues identiques aux planches approuvées (0 texel changé). « Recolorés » = passés à une autre couleur de la **même**
  palette approuvée ; [?] cause non isolée (hypothèse : affectation au plus proche de `palette.png` au lieu de l'affectation du k-means
  d'origine). Mêmes images, étiquettes, disposition et JSON.
- `--check` : les cinq reconstruites à l'identique ; 7 paquets intacts (`verify-provenance`) ; `art:validate` 0 erreur. Paquets et manifestes
  consignent la révision (demande citée, empreinte précédente, comptes). Images : `reviews/<id>/0N-revision-black-pixels.png` (approuvée /
  révisée / changements).
- Défauts relevés par la critique à l'aveugle et **déjà présents dans les planches approuvées** (zones mesurées : 0 texel changé ; non traités
  ici) : manches du docker coupées par le balancement des bras (marche de face 2-3 : bande 12 × 2 à x 8-19, rangées 53-54 ; encoches ; marche
  de dos 5 : trou 5 × 2) ; contour de bras détaché et petites languettes du forgeron de dos ; trous dans le tabard du garde (marche de face
  2-3, profil 0 : 2 × 7), tiret sombre au poing (marche de face 0 / 5), jambe arrière réduite à un filet (profil 2 / 5) ; trou de 2 × 2 dans la
  main du passant (marche de face 2-3) ; chaussure de la marchande à une rangée de l'ourlet (marche 4-5). → « À reprendre ».

### 2. Direction en marche — cause [OK] mesurée
- `ActorSystem.applyFacing` tirait la vue du regard **en monde** contre le lacet caméra : face / dos tant que |vers caméra| ≥ 0,85 |droite
  caméra|, soit jusqu'à 49,6° de l'axe de la caméra. Sous le tangage des cadrages (2,5° A, 8° B et D, 8,5° C), l'axe de profondeur est écrasé à
  l'écran et la perspective tire le pas vers le point de fuite. Angle à l'écran depuis la verticale d'un pas à θ de l'axe (position du joueur) :
  B au centre 15° → 49°, 30° → 67°, 45° → 76° ; A 15° → 52-66° ; D au bord droit (NDC 0,73) un pas droit devant monte déjà à 52°. Le long du
  quai (+x) en B, le docker marche à 32,5° de l'axe : vue de dos, glissement à ~67° de la verticale. C'est la marche en crabe vue par l'opérateur.
- 60 s de simulation (vrai `update`, pas de 1/60 s, PNJ en marche) : pas dont la vue contredit le mouvement écran (face / dos à plus de 50° de
  la verticale, profil à moins de 40°) : **B 67,2 %, C 61,4 %, A 31,5 %, D 12,9 %** (arbre rebasé ; 36,7 % / 11,9 % en A / D
  avant le rebase, autre tirage des marcheurs).

### Correction — [OK]
- Un cap **de marche** (`face(a, v, true)` : l'entrée du joueur, la cible d'un marcheur) prend sa vue d'un pas de 5 cm projeté par la vraie
  caméra (`screenFacing`) : profil au-delà de 50° de la verticale écran, face / dos en deçà de 40°, vue gardée entre les deux (hystérésis) ;
  haut / bas selon le sens du pas à l'écran, retournement = pas vers la droite. Gardée à l'arrêt (aucun saut), recalculée à chaque image
  (mélanges de caméra). Les regards **mis en scène** gardent la règle monde : orientation de spawn (forgeron à l'enclume, marchande, gardes),
  tour vers le joueur pour parler. Repli sur la règle monde sans caméra ou derrière elle.
- `App.ts` : une ligne (la caméra passée au constructeur d'`ActorSystem`) ; `SpriteRenderer.ts` : champ `faceWalk`.

### Preuves (arbre rebasé sur `05d5f39`) — [OK]
- Simulation, après : 0 % de vues contraires (par construction) ; changements de vue à cap constant (clignotement) : 0 avant, 0 après, A-D.
- Joueur, A-D : W dos, S face, A / D profil inchangés ; les diagonales passent de dos / face à **profil** (pas à ~75° de la verticale écran) ;
  vue gardée au relâchement.
- Marche capturée du docker (B, seedé, pas fixes) : `reviews/dockworker-x2-v2/07-walk-facing-cameraB.png` (le long du quai : face → profil ;
  droit devant à 12,6° de l'axe : dos dans les deux cas).
- CPU : 3 600 appels d'`ActorSystem.update` (11 acteurs) : 9,4 → 9,9 µs puis 6,1 → 6,8 µs par appel (+0,5-0,7 µs). GPU (`tools/perf.mjs`
  entrelacé, B, 2 tours, avant le rebase) : 9,66 ms / 9,67 ms ; 108 appels de dessin et 210,1 k triangles des deux côtés.
- Captures déterministes (`baked-proof.mjs shots`, 1920 × 1080, 90 pas, `freeze=7.3`, `main` figé `05d5f39` servi à part) : témoin de
  répétition (deux chargements du travail) **0 px** dans les six vues. Démarrage par défaut, `main` contre travail : A 7 912 px, B 33 753,
  C 4 288, D 2 886, C sabotée 8 233, D sabotée 19 307 : sur les personnages cuits (traits du cou), leurs ombres et reflets, et les marcheurs
  passés de face / dos à profil (diff de B vu en entier). `?cast=generated`, tout écart compté : A 5 614 px, B 29 460, **C 0, D 0, C sabotée
  0**, D sabotée 13 770 : uniquement des porteurs générés en marche passés de dos à profil, avec ombres, reflets et halos (vu au zoom).
- Autotests des cinq planches (`?baked=<id>`) : CPU 0 / GPU 0 texel à 1, 2, 3, 2,37, contrôles négatifs en échec, débordement 0.
- `npm run typecheck`, `npm run build` verts (JS 874,18 Ko, gzip 247,96 Ko ; 873,01 / 247,49 à `05d5f39`).

### Décision opérateur (2026-10-17)
- Mot pour mot : « si la tache est fini on peut commit/push vers main ». Les preuves finales vertes, `main` est avancé en avance rapide jusqu'au
  commit de cette passe et poussé. Les images de revue des planches révisées n'ont pas été montrées une à une à l'opérateur avant ce message :
  les paquets le consignent (l'approbation du 17/10 porte sur les planches précédentes, empreintes gardées).
- Suppression de la branche demandée par l'opérateur, mot pour mot : « Oui : bascule ce dossier sur main et supprime la branche
  cast-polish-facing (locale et distante). » : le dossier partagé passe sur `main` (même commit, aucun fichier changé), la branche est
  supprimée en local et sur `origin`. La prochaine tâche ouvre sa propre branche.

### Limites
- Pas encore vu en mouvement par un humain ; bande d'hystérésis 40° / 50° choisie, pas réglée avec l'opérateur.
- Le tour vers le joueur pour parler garde la règle monde (comportement existant, hors périmètre).

### Pensée
- Avant de couper une règle d'un outil, relire pourquoi elle existe : la fermeture verticale fabriquait les traits du cou **et** restaurait les
  contours des jambes. La couper par zone, pas partout ; puis compter le fond enclavé et les zones sensibles avant / après.
- Une critique à l'aveugle sur le résultat final trouve ce que la vérification de l'auteur ne cherche pas ; chacun de ses constats se mesure
  contre la version approuvée pour séparer régression et défaut hérité.
- Une requantification déplace toutes les couleurs : une palette approuvée s'épingle en fichier, et une révision se projette dessus.
- Sous un tangage bas, l'angle d'un pas avec l'axe de la caméra ne dit presque rien de son mouvement à l'écran : la vue d'un marcheur se tire
  du pas projeté, avec hystérésis ; un regard mis en scène garde la règle monde.

Preuves (non versionnées) : `art-lab/characters/scratch/cast2/` (`facing.js`, `flicker.js`, `walkcam2.mjs`, `revsheet.mjs`, `proof-facing*/`,
`proof-final5/`, `selftest2/`) ; images clés dans `art-lab/characters/reviews/<id>/` et `screenshots/calibration/cast-polish/`.

---

## Passe 5b — Écarts élagué / `vis=0` hérités : explication pièce par pièce, tuiles fines pour D, témoin d'ordre de dessin (2026-10-17)

### Demande (2026-10-17)
- Mission transmise par la séance de la Passe 5 : élucider les écarts élagué / `vis=0` qui empêchent `tools/viewport-proof.mjs` de sortir à 0
  (À reprendre 2b et 5), pièce par pièce (registre `district.visibility.registry`, comptes bruts), puis proposer et mesurer un correctif qui
  garde le rendu canonique 1920 × 1080 identique au pixel et coûte peu de temps de bake. Interdits : géométrie, implantation, personnages,
  direction artistique. Preuves `visproof` / `viewport-proof` (`occ=0`) + témoin de répétition ; serveurs `:518x --strictPort`, un cache Vite
  chacun ; textes en CRLF ; pas de nouvelle branche sans l'accord de l'opérateur.
- Mesures d'abord sur `7e2ebfe` (Passe 5), puis travail rebasé sur `main` = `f57e69d` (Passes 5 et 4A-unvicies fusionnées ; `src/` de la
  culling inchangé entre les deux). Serveurs : travail `:5183`, base figée `:5184` (arbre détaché de `main`, dossier de la séance).

### Méthode
- Sonde : la scène d'ID du bake (gardée en enveloppant le rappel `bake` de `generate`, même district régénéré) rendue par la caméra exacte de
  la pose — directe à 2× / 4× la fenêtre, miroir (caméra de reflet de la dernière image) à 2× sa cible — liste les pièces que cette caméra
  montre et que le jeu actif ne dessine pas, avec leur nombre de pixels dans une tuile de bake à cette même pose (480 de large, FOV × 1,06 :
  « tile ») et dans une tuile 8 × plus fine (« tile8x »). tile 0 et tile8x > 0 = lanière plus fine qu'un pixel de bake.
- Preuve causale : la pose refaite avec ces pièces forcées dans le jeu actif (un compte ajouté) → écart restant.
- Témoin d'ordre : `vis=0` rejoué avec les triangles de chaque mesh en ordre inverse ; un pixel qui change est décidé par l'ordre de dessin.
- Pixels restants : bissection par niveau de dessin (`setLevel`), puis par pièce (forçage), passe de scène seule avec / sans MSAA, zoom 32 × 32
  par pixel (sous-fenêtre de projection), lancer de rayons aux positions d'échantillons.
- Devenu `tools/vis-why.mjs` (pièces manquées + tile / tile8x, forçage, témoin d'ordre) ; le témoin d'ordre est entré dans `viewport-proof`.

### Constat — trois causes, chacune prouvée (avant correctif, `main`)
1. **Ordre de dessin de faces coplanaires — [OK] démontré ; pas un défaut de culling.** 30417 B (2 ; 1,5) : 109 px en 1080p (max 4), 36 px en
   720p. Le rayon du pixel (1857 ; 495) touche deux faces de `far-city` à la même distance (66,40 m) dans le plan z = 4,95 : l'about du pont
   principal (partie 280, x 46,5-53,5, y −2,35 à −0,6) et le mur de quai lointain (non tagué, x 46,5-52,5, y −1,75 à 0,05), superposés entre
   y −1,75 et −0,6 au-dessus de l'eau (−1,15). Le tri par classes inverse leur ordre (classes 12 puis 14) : **échanger ces deux seules faces**
   dans le tampon d'index élagué → **0 px**. Écart inchangé sans DOF / bloom / in-scatter (117 px) et sans reflet (108 px). Même nature :
   31 des 48 px de 30417 AB (1080p), 30417 A 1 px et 1842 BC 1 px (720p) : 100 % de ces pixels changent quand `vis=0` est dessiné à l'envers.
   Toute replanification des classes peut retourner ces pixels (constaté : D ×4 rend les 31 px de 30417 AB égaux à `vis=0`).
2. **Lanières plus fines qu'un pixel de bake — [OK] démontré ; vrai défaut de culling.** Le bake échantillonne le quart de la résolution
   (miroir : le huitième) ; une pièce vue sur moins d'un pixel de bake peut n'avoir aucun compte alors que le rendu (MSAA 4×) la montre.
   Chacune a tile 0 / tile8x > 0 à la pose exacte et, forcée, ramène la pose à **0 px** :
   - 1842 D (26 ; 3,5) : partie 89 (east3, mur ouest, ét. 2 ; besoin CD + BD, 1 px chacun) : 3 px en 1080p (max 21), 1 px en 720p — **le
     pixel (1244 ; 185) d'À reprendre 2b** ; en 2560 × 1080 : parties 76 (east2 ouest ét. 1) et 93 (east3 est ét. 3, Tier 3 à ce cadre).
   - 7719 D (26 ; 3,5) : partie 73 (east2 ouest ét. 1, Tier 3) : 4 px (max 55) en 1080p, 3 px en 720p ; en 2560 × 1080 partie 63 (east1 ouest
     ét. 1, Tier 3) : la ligne d'un pixel de 57 px (max 41, x 1426-1427) ; aussi 900 × 900, 665 × 1200, 390 × 844.
   - 7719 D (16 ; 2) 720p, 30417 D (26 ; 3,5) 720p et 665 × 1200 (partie 73), 7719 AB 665 × 1200 (2 px, 6 pièces) : levés au forçage à 4×.
   - 30417 AB (−9,4 ; 1) : maison 609 de la ville haute (Tier 3) et 3 voisines : 17 px (1080p), 5 px (720p). 609 n'apparaît qu'autour du poids
     de mélange 0,5 : tile8x 1-27 aux poses x −11 / −9,4 / −7,5 × z −1 / 1 / 2,5 à w = 0,5, **0** à w = 0,33 et 0,67 (les poids échantillonnés
     pour AB) : vue **entre** deux poses et plus fine qu'un pixel de bake. Des tuiles AB ×4 ne l'attrapent pas.
   - Item 5b (1842, B à 15,5 ; −2,7, 720p) : aujourd'hui 6 px (max 6) ; 6 lanières forcées (reflets de maisons de la ville moyenne, murs est
     de `bg2` / `tall`) → 1 px, non élucidé [?].
   - Ce sont des murs latéraux de la rangée de façade (D les voit presque de chant : lacet −20°) ou des maisons lointaines. Beaucoup d'autres
     pièces manquent de la même façon sans franchir le seuil (reflets de la ville moyenne : bandes horizontales sous le pixel du miroir, floues).
3. **Fissures de rastérisation vues par un seul échantillon MSAA — [OK] démontré ; hors de portée d'un bake.** 7719 C (8 ; 1) : 1 px (151 ; 94),
   max 12 (le même en 2560 × 1080 : (471 ; 94)). Seule la classe 45 (D + CD + BD) le change, et dans elle la seule partie 29 (shopA, mur est,
   ét. 2 : plâtre, pan de bois, verre ; aucun créneau soumis au vent), 4,7 m **derrière** le mur de façade (partie 27) que montre le pixel.
   Passe de scène seule : sans MSAA, ajouter la classe change **0 px dans toute l'image** ; avec MSAA 4×, exactement ce pixel. Vrais matériaux
   rendus à 32 × 32 échantillons par pixel sur 3 × 3 pixels : 0 différent ; rayons aux 4 positions d'échantillons D3D : tous sur la façade. Un
   échantillon MSAA passe par une fissure (sous 1/32 px) au bas du mur de façade (y = 6,631) et voit le pan de bois de 29. Même constat pour
   30417 CD (14 ; 1) 720p (914 ; 241) (classe BD, MSAA seul, 0 / 9 216 au zoom) ; 1842 D (26 ; 3,5) 2560 × 1080 (2367 ; 280), MSAA seul,
   derrière lui une pièce Tier 3.

### Mesures des options (1920 × 1080, médianes de 3 régénérations, même session ; « jeux » = bits de besoin gagnés / perdus)
| variante | bake | jeux (1842) | triangles dessinés |
|---|---|---|---|
| actuel | 177 ms | — | A 91,6 k, B 84,2 k, C 63,1 k, D 98,9 k |
| tout ×2 (`visscale=2`) | 344 ms | +81 / −11 | +0,06 à +1,1 k |
| tout ×4 | 989 ms | +97 / −8 | +0,6 à +3,1 k |
| D ×2 additif | 191-194 ms (3 graines) | +2 (D) | D 0 à +652 (A, B, C inchangés) |
| D ×4 additif | 249-257 ms | +3 (D) | D +218 à +678 |
| A + B + C + D ×2 additif | 229-232 ms | +4 | ≤ +1,3 k |
| A + B + C + D ×4 additif | 386 ms | +9 | ≤ +2,3 k |
- Monter toute la résolution **perd** aussi des jeux (−11 à 2×) : l'échantillonnage ponctuel est une loterie, un supplément doit être additif.
- Le bake est dominé par les sommets (estimé d'après ×1 / ×2 / ×4) : 546 rendus complets d'une scène d'ID de 120 540 triangles ≈ 120 ms sur 177 ;
  ×2 coûte +167 ms ≈ 3 × 56 ms de remplissage + comptage, ×4 +812 ms ≈ 15 × 56. Un rendu supplémentaire des arêtes en lignes (rastérisation conservatrice) coûterait au moins autant : écarté.
- Garder toutes les lanières coûterait peu au rendu (≤ +3 % de triangles à ×4) : c'est le bake qui est cher, pas le résultat.

### Correctif
- `BAKE_FINE` (`Visibility.ts`) : les 21 poses stables de D (16:9) reçoivent une seconde tuile de vue directe à 2× (960 × 540), comptée dans
  les mêmes compteurs, sans fenêtres de reveal : **additif**, une pièce ne peut que gagner des jeux. D seul parce qu'il voit tous les murs
  latéraux de chant (les autres cadrages les voient à 30-60° d'incidence). Coût mesuré (12 paires alternées dans une session) : médiane des
  écarts **+20 ms** (1842) et **+18 ms** (7719) sur un bake de 160-210 ms ; première série +14 à +16 ms. Pages 13 → 16, cibles inchangées
  (37,7 Mio). Parties gagnant D : 1842 89 et 93, 7719 73 ; rien sur 30417.
- DEV : `?visfine=D:4|A+B+C+D:2|0` (0 = sans tuiles fines), `?visscale=k` (toutes les tuiles k×).
- `viewport-proof` : témoin d'ordre (une pose qui diffère est rejouée sur `vis=0` en ordre inverse ; les pixels à ≤ 1 px d'un pixel qui
  change sont « order », comptés à part, en échec seulement avec `--strict`) ; `--q=` (requête ajoutée) ; `tools/vis-why.mjs`.

### Validation
- **Rendu canonique** (`baked-proof.mjs shots`, scène complète, `clean=1&freeze=7.3`, 1920 × 1080 ; A, B, C, D (16 ; 2), D (26 ; 3,5), AB, BC,
  CD, BD × graines 1842 / 7719 / 30417 = 27 vues) : témoin `main` contre `main` **0 px** partout ; travail contre `main` **0 px dans 25 vues**,
  dont les 24 vues canoniques de la Passe 5 ; seules diffèrent D (26 ; 3,5) 1842 (5 px, max 21 : lanières 89 / 93 désormais dessinées) et
  7719 (4 px, max 55 : partie 73) — à ces poses le travail est égal à `vis=0` ; travail contre travail : identique.
- **`viewport-proof`** (six tailles × trois graines × 9 poses) : `main` 22 contrôles en échec avant le témoin d'ordre (Passe 5, même code de culling),
  18 avec ;
  travail **9** (redimensionnement 0 px, contrôles `visfail` corrects ; Tier 3 identique de 390 × 844 à 1920 × 1080, même bake : 1842 317, 7719
  303 → 302 (partie 73 gardée), 30417 304). Restent : les trois fissures
  (7719 C 1080p et 2560, 30417 CD 720p, et 1 des 3 px de 1842 D 2560), les lanières non attrapées à ×2 (1842 D 2560 : 2 px ; 30417 D 720p et
  665 × 1200 : partie 73 ; 7719 AB 665 × 1200 : 2 px), la maison 609 (30417 AB 1080p 17 px, 720p 5 px).
- Variantes sur trois tailles (1080p, 2560 × 1080, 720p) : actuel 13 échecs, D ×2 7, D ×4 6 (ne restent que fissures et 609).
- `npm run typecheck` et `npm run build` verts.

### Arbitrages pour l'opérateur
- D ×4 au lieu de ×2 : ≈ +75 ms de bake (première série), attrape aussi la partie 73 de 30417 et les lanières de 1842 en 2560 × 1080 (6 échecs au lieu de 7 sur trois tailles).
- 609 : ajouter des poses AB à w = 0,5 rendues à ×4 (≈ +20 ms estimés, non mesuré) ou densifier les poids de AB / BC (2 aujourd'hui, 6 pour CD / BD).
- Fissures (jonctions en T au bas des étages en encorbellement) et faces coplanaires du quai lointain : corrections de géométrie, hors périmètre ;
  tant qu'elles existent, `viewport-proof` ne peut pas sortir à 0 (les faces coplanaires sont rapportées « order » sans échouer).

### Décision opérateur (2026-10-17) — branche
- Mot pour mot (relayé par la séance de la Passe 5) : « No new branch yet: the culling-diff session keeps its work uncommitted until
  cast-polish-facing is merged and deleted. » Puis : ouvrir la branche depuis le `main` du moment, commiter et pousser en une fois.
- Condition remplie avant le commit : `cast-polish-facing` fusionnée dans `main` (`f57e69d`) et supprimée (`git ls-remote` : seule `main`).
  Branche `vis-residue-5b` ouverte depuis `f57e69d`, un commit (travail + journal), poussée. Fusion dans `main` quand l'opérateur juge la
  tâche finie ; les arbitrages ci-dessus restent ouverts.

### Décision opérateur (2026-10-17) — [OK] acceptée
- Mot pour mot : « J'accepte la Passe 5b telle quelle (tuiles fines ×2 pour D) : fusionne vis-residue-5b dans main, pousse main et supprime
  la branche. »
- Tuiles fines ×2 des poses stables de D gardées telles quelles. Branche `vis-residue-5b` fusionnée en avance rapide dans `main` (`77621bb`),
  `main` poussé, branche supprimée (locale et distante ; le worktree de la séance archivée qui l'avait extraite est passé en HEAD détaché sur
  le même commit, aucun fichier changé). Les arbitrages ci-dessus (D ×4, poses AB à w = 0,5 pour 609, géométrie) restent ouverts.

### Pensée
- Un écart de culling se prouve **causalement** (pièce forcée → 0 px, faces échangées → 0 px), pas par proximité : sur ces poses, des dizaines
  de pièces manquent sans effet visible.
- Un échantillonnage ponctuel n'est jamais conservatif : monter la résolution fait aussi perdre des pièces ; un supplément de bake doit s'ajouter
  aux comptes existants, et se concentrer là où la géométrie se présente de chant.
- Un pixel décidé par l'ordre de dessin ne dit rien du culling : le témoin d'ordre (`vis=0` à l'envers) le sépare ; et toute modification des
  masques replanifie les classes, donc la preuve canonique se fait contre la base figée, pas seulement contre `vis=0`.
- Une différence qui n'existe qu'avec MSAA et à aucun des 1 024 sous-échantillons d'un zoom est une fissure de rastérisation : aucun bake ne la voit.
- Un script de mesure qui modifie des paramètres d'URL entre variantes doit les remettre tous à zéro : une variante a hérité `visfine=0` et
  semblait « sans effet » (rattrapé parce que le nombre de pages n'avait pas bougé).

Preuves (non versionnées) : dossier de travail de la séance (sondes `probe.mjs`, `classify.mjs`, `bisect.mjs`, `partbisect.mjs`, `toggle.mjs`,
`fullrt*.mjs`, `zoomreal.mjs`, `masks.mjs`, journaux de mesure, captures) ; images clés dans `screenshots/calibration/vis-residue/`.

---

## Passe 4A-duovicies — Distribution : revue des planches révisées, passe de rig sur les défauts hérités (C3) (2026-10-17)

### Demande (2026-10-17)
- Séance de travail unique, reprise des séances précédentes (Passes 5, 5b, 4A-vicies, 4A-unvicies). Mot pour mot : « Montre-moi les cinq
  planches révisées une à une (C1), puis on décidera de la passe de rig. » Puis : « Les cinq planches révisées me conviennent. Ouvre une
  branche pour la passe de rig C3 sur les défauts hérités, en commençant par le garde. » Branche `cast-rig-fixes` ouverte depuis `main`
  (`55363fc`) et poussée.

### Revue des planches révisées (C1) — [OK] approuvées par l'opérateur
- Montrées une à une : `reviews/<id>/0N-revision-black-pixels.png` (approuvée / révisée / changements, première image de chaque animation),
  puis, pour décider de la passe de rig, une planche des cycles de marche par personnage (×3, fond enclavé en magenta, images signalées par la
  critique à l'aveugle de la 4A-unvicies encadrées ; non versionnée).
- Approbation consignée mot pour mot (« Les cinq planches révisées me conviennent. ») dans les cinq paquets (`approvals`, `revisions[].approval`,
  `status`), manifestes (`notes`) et README de revue ; elle porte sur les exports de la 4A-unvicies (empreintes inchangées). Aucune planche
  n'est déclarée Gold Master. `art:validate` 0 erreur, `verify-provenance` : cinq paquets intacts.
- Recolorations de la 4A-unvicies (893 à 1 754 texels par planche, même palette) : cause toujours non isolée [?].

### Méthode de la passe de rig (C3)
- Chaque défaut relevé par la critique à l'aveugle de la 4A-unvicies est d'abord mesuré dans la planche exportée (fond enclavé par
  remplissage depuis le bord du cadre, îlots, vidage texte des rangées de la vue et de l'image) puis rattaché à la ligne du script de rig qui
  le produit ; la correction se fait dans le script (rejouable au texel près), jamais par retouche de l'export. Essai d'abord hors du dépôt
  (`build-character --check --keep`), comptes avant / après (retirés / ajoutés / recolorés, couleurs nouvelles), puis construction réelle et
  `--check`. Critique à l'aveugle par un agent neuf (étiquettes X / Y tirées au sort, clé gardée hors de sa portée, auto-critique écrite
  avant le verdict), marche capturée dans la scène, captures déterministes du démarrage contre une base figée (`dab59f9`, `:5184`).

### Garde (`guard-x2-v1`) — [OK] corrigé et approuvé
- Causes mesurées (toutes présentes dans la planche approuvée) :
  - face, marche 2-3, trou dans le tabard à côté du poing droit qui remonte (8 et 12 texels de fond enclavé) : le poing découvre des
    texels que le remplissage cherche à 3 texels vers l'extérieur, dans un masque de bras large de 7 → rien trouvé, transparent ;
  - face, marche 0 / 5, tiret sombre sous le poing gauche : la rangée 66 (contour bas du poing) est hors du masque du bras (rangées 47-65) et
    reste en place quand le poing remonte de 3 rangées ;
  - dos, toutes les images (repos compris), un trou d'un texel dans la cape en (40 ; 51) de la vue reconstruite ;
  - profil, marche 0 / 1 / 5, une lanière transparente entre le pan du tabard et le bras (2 à 8 texels) : les colonnes avant du masque du
    bras sont du tabard, hors de portée de la recherche vers +x ; un repli vers −x a d'abord pris le liseré clair du tabard (liseré doublé)
    **[KO, abandonné avant commit]** ; retenu : ces texels gardent leur propre couleur ;
  - profil, marche 0-5, la « jambe arrière réduite à un filet » : un fil vertical sombre d'un texel derrière les jambes = le bord arrière
    de la jambe source (colonne 40, rangées 78-86), tombé dans le masque de la cape et cisaillé avec elle.
- Correctifs (script `rigs/guard-x2-v1.rig.mjs` seulement) : masques des bras de face jusqu'à la rangée 66 (poing rigide sur 8 rangées :
  la bande étirée est inchangée), repli « texel sous le bras dans sa colonne » pour ce qu'un poing qui remonte découvre ; trou de la vue de
  dos rempli par la couleur de cape voisine ; `filled` garde la couleur propre du texel ; colonne 40 sous la rangée 77 sortie de la cape.
- Planche contre la précédente : 43 texels retirés, 68 ajoutés, 65 recolorés, 0 couleur nouvelle, 20 images changées (repos de face et de
  profil inchangés). Fond enclavé restant : 2 texels (fente tabard / cape, face 2) et les poches jambe arrière / cape en profil 0 (12) et
  3 (6 + 2), du vide entre la jambe et la cape. `--check` identique, `verify-provenance` intact, `art:validate` 0 erreur ; mêmes images,
  étiquettes et JSON ; `npm run build` vert (JS 874,48 Ko).
- Jeu : démarrage par défaut (A, B, C, D, C et D forge sabotée, 1920 × 1080, `clean=1&freeze=7.3`) **0 px** contre la base figée, témoin
  de répétition 0 px : les gardes restent immobiles et de face, les images corrigées ne se voient que si un garde marche ou se détourne.
  Marche provoquée dans la scène (caméra B, garde de la barrière envoyé sur le quai, les autres masqués) : quatre vues, cycle complet,
  avant / après → `reviews/guard-x2-v1/07-rig-c3-walk-in-scene-cameraB.png` ; planche `06-rig-c3-before-after.png`.
- Critique à l'aveugle (agent neuf) : révisée **7/10**, précédente **4,5/10** ; toutes les différences sont des défauts de la précédente
  (trous du tabard jugés « sérieux », fente de profil qui clignote, fil « qui se lit comme une jambe réduite à un fil »), aucun défaut
  nouveau. Auto-critique écrite avant : mêmes corrections attendues ; elle annonçait la fente et la poche, pas la lecture « talon » du coin
  de galon. Restent (hérités, non traités) : le coin du galon d'ourlet au bout de la cape de profil se lit comme un talon détaché (x 46-50,
  rangées 81-84), la jambe arrière presque toujours cachée de profil, la fente 1 × 2, la poche de profil 3.
- Paquet : nouvelle révision (`revisions`, demande citée, empreinte précédente `fa8224c1…`, nouvelle `564f1505…`), `status`, chaîne ;
  manifeste (`notes`) ; README de revue. **Approuvé par l'opérateur le 17/10** (voir « Décision opérateur ») ; aucune planche déclarée Gold Master.


### Passant encapuchonné (`hooded-x2-v1`) — [OK] corrigé et approuvé
- Cause mesurée : face, marche 0 / 2 / 3 / 5, la main (masque peau + 1) descendue de 2 rangées laisse sa place remplie de côté par le contour
  sombre de la main (une tache) ou transparente (trou de 2 × 2 dans la main gauche à l'écran, images 2-3 : 4 + 4 texels de fond enclavé ;
  `fillPinholes` ne ferme que ≤ 2 texels).
- Correctif (script seul, `swingPart`) : une main descendue remplit d'abord les rangées qu'elle découvre en haut de son masque avec le texel
  juste au-dessus, colonne par colonne (la manche continue).
- Planche : 0 retiré, 8 ajoutés, 72 recolorés, 0 couleur nouvelle, 4 images (marche de face) ; fond enclavé 8 → 0 ; `--check` identique,
  paquet intact. Critique à l'aveugle : révisée **8/10**, précédente **5/10** ; toutes les différences sont des défauts de la précédente
  (le trou, des avant-bras qui se lisent « sectionnés » dans 4 images sur 6), aucun défaut nouveau. Restent (hérités) : une bande sombre de
  l'ourlet arrière qui pend derrière le talon de profil, des éperons d'un texel sur le contour de l'ourlet.
- Images : `reviews/hooded-x2-v1/05-rig-c3-before-after.png`, `06-rig-c3-walk-in-scene-cameraB.png`. **Approuvé par l'opérateur le 17/10** (voir « Décision opérateur »).


### Forgeron (`blacksmith-x2-v1`) — [OK] corrigé et approuvé
- Causes mesurées (dos, marche 0-5) : la colonne de contour extérieure de chaque bras est à 2 texels de la peau, hors du masque
  (`skinSpans` = peau + 1) : elle reste en place quand le poing remonte (« contour de bras détaché », jusqu'à un contour doublé avec un texel
  de vide à l'image 3) ; la rangée basse du poing (66 = `hipY`) appartient au calque des jambes et reste sur la jambe (les « petites
  languettes » sous le poing).
- Correctif (bras de dos seulement ; face, profil et frappe identiques) : masques élargis d'un texel du côté extérieur ; les texels de bras
  à `hipY` et dessous suivent le bras ; le calque des jambes y reçoit le texel de jambe juste dessous dans sa colonne (sinon rien). Essai
  intermédiaire **[KO, abandonné avant commit]** : le texel de hanche voisin vers le corps prolongeait le contour de la hanche de 3 texels
  hors du corps (un rebord sombre).
- Planche : 33 retirés, 44 ajoutés, 45 recolorés, 0 couleur nouvelle, 6 images (marche de dos) ; `--check` identique, paquet intact.
  Critique à l'aveugle : révisée **7,5/10**, précédente **5,5/10** ; toutes les différences sont des corrections (contour doublé, fil et
  dessous de poing flottant), aucun défaut nouveau. Restent (hérités) : l'épaule gauche crénelée de la marche de face (une coche et des
  encoches), des trous de contour du poing gauche qui alternent, une coche à côté du poing droit.
- Images : `reviews/blacksmith-x2-v1/06-rig-c3-before-after.png`, `07-rig-c3-walk-in-scene-cameraB.png`. **Approuvé par l'opérateur le 17/10** (voir « Décision opérateur »).


### Marchande (`merchant-x2-v2`) — [OK] corrigé et approuvé
- Cause mesurée : la botte 0 repose sur la rangée 89 dans la vue (la vue de repos la garde là) et la marche la pose sur la rangée 90 ; aux
  images où le corps est haut (bob 0 : face et dos 4-5, botte plantée), une rangée vide sépare l'ourlet (rangée 85) de la botte (rangée 87) :
  la chaussure flotte sous l'ourlet. Même cause, un texel de fond enclavé à l'image 3 de face.
- Correctif (script seul) : un trou d'une rangée juste au-dessus d'une botte prend la rangée haute de la botte (sa tige sombre monte sous
  l'ourlet).
- Planche : 0 retiré, 30 ajoutés, 0 recoloré, 0 couleur nouvelle, 5 images ; fond enclavé 1 → 0 ; `--check` identique, paquet intact.
  Critique à l'aveugle : révisée **7/10**, précédente **6/10** ; la chaussure flottante et le trou corrigés, aucun défaut nouveau (la
  chaussure y a une rangée de plus : lue comme une cheville un peu plus longue ; une encoche de l'ourlet ne se voit plus qu'à l'image 3).
- Défauts hérités relevés par cette critique, **hors de la liste de l'opérateur, non traités** : de profil, les deux chaussures se fondent
  en une semelle large (images 2 et 5) traversée d'une barre noire (image 4) ; de face et de dos, le corps saute de 2 texels de côté
  (report de poids `SHIFT` = 0, 2, 1, 0, −2, −1) ; une encoche de l'ourlet qui clignote.
- Images : `reviews/merchant-x2-v2/06-rig-c3-before-after.png`, `07-rig-c3-walk-in-scene-cameraB.png`. **Approuvé par l'opérateur le 17/10** (voir « Décision opérateur »).


### Docker (`dockworker-x2-v2`) — [OK] corrigé et approuvé
- Cause mesurée : face 0 / 2 / 3 / 5 et dos 0 / 2 / 3 / 5, l'avant-bras descendu de 2 rangées par `R.movePart` laisse en haut de son masque
  2 rangées que `movePart` remplit de côté (couleur sombre du gilet : une bande qui coupe la manche) ou laisse transparentes (encoches au
  bord ; trou de 5 × 2 = 10 texels de fond enclavé au dos, image 5).
- Correctif (script seul, `forearmDown` ; le moteur `rig-engine.mjs`, dont l'empreinte est dans sept paquets, n'est pas touché) : ces
  rangées prennent, colonne par colonne, le texel juste au-dessus du masque, partout où l'avant-bras a des texels dans la colonne (la manche
  continue).
- Critique à l'aveugle, tour 1 : révisée 7,5/10, précédente 5,5/10, mais deux restes relevés : une encoche d'un texel **créée** par le
  correctif (face 2 : colonne du contour extérieur laissée vide, ma condition « texel d'origine opaque ») et, hérités, une couture grise
  dans le bras droit de dos (image 0) et un texel de contour isolé (images 2-3) : le masque du bras droit (x 42-49) laissait les colonnes
  50-52 de la manche et de son contour en place quand l'avant-bras rentre. Repris : condition « l'avant-bras a des texels dans la colonne »,
  masque jusqu'à x 52 (essai à x 51 **[KO]** : la colonne 52 du contour restait fixe à son tour).
- Tour 2 (agent neuf) : révisée 7,5/10, précédente 5/10, aucun défaut nouveau ; le plus visible restant, hérité : un tiret sombre à côté
  de la cuisse au dos (images 0 / 5) = la rangée 66 (bord bas du poing gauche = `hipY`) restée sur la jambe quand le poing remonte. Repris
  comme pour le forgeron : masque du bras gauche de dos jusqu'à la rangée 66, ces texels suivent le bras, le calque des jambes y reçoit le
  texel de jambe juste dessous. Tour 3 (agent neuf) : révisée **8/10**, précédente **5/10**, toutes les différences sont des corrections ; effets secondaires notés : le bras étiré s'allonge un peu en mouvement (répétition d'une rangée), un décroché d'un texel au coude (dos 0) ; restent (hérités) : le dessus de la casquette, barre sombre épaisse aux coins cassés, des ruptures d'un texel au poignet, à l'ourlet du pantalon et à la hanche de profil.
- Planche finale contre la précédente : 35 retirés, 117 ajoutés, 158 recolorés, 0 couleur nouvelle, 9 images (face 0 / 2 / 3 / 5, dos 0 / 2 / 3 / 4 / 5) ; fond enclavé 10 → 0 ; `--check` identique, paquet intact ; démarrage par défaut
  0 px dans les six vues, témoin 0 px.
- Images : `reviews/dockworker-x2-v2/08-rig-c3-before-after.png`, `09-rig-c3-walk-in-scene-cameraB.png`. **Approuvé par l'opérateur le 17/10** (voir « Décision opérateur »).

### Synthèse et preuves communes
- Cinq planches révisées dans leur script de rig, aucune couleur nouvelle (palettes approuvées épinglées), mêmes images, étiquettes et JSON ;
  `art:validate` 0 erreur ; `verify-provenance` : les cinq paquets intacts ; `npm run build` vert.
- Démarrage par défaut (A, B, C, D, C et D forge sabotée, 1920 × 1080, `clean=1&freeze=7.3`, base figée `dab59f9` servie sur `:5184`) :
  0 px dans les six vues avec les cinq planches, témoin de répétition 0 px. Les images corrigées sont des marches de face / dos (et le dos
  du garde) que le démarrage ne montre pas à ce pas ; elles se voient quand un personnage marche vers la caméra ou s'en éloigne.
- Marches provoquées dans la scène (caméra B, personnage envoyé sur le quai dégagé, autres acteurs masqués, pas fixes) : avant / après pour
  chacun (`reviews/<id>/…-rig-c3-walk-in-scene-cameraB.png`, vues qui changent seulement).
- Défauts hérités relevés par les critiques, **hors de la liste de l'opérateur, non traités** → « À reprendre » -1d.

### Décision opérateur (2026-10-17) — [OK] approuvée
- Les cinq avant / après (`reviews/<id>/…-rig-c3-before-after.png`) et les verdicts des critiques montrés en séance. Mot pour mot :
  « J'approuve les cinq planches corrigées de la passe C3 pour la production : fusionne cast-rig-fixes dans main, pousse main et supprime la branche. »
- Consigné dans les cinq paquets (`approvals`, `revisions[]` de la passe, `status`), manifestes (`notes`) et README de revue ; aucune
  planche déclarée Gold Master. Branche `cast-rig-fixes` fusionnée en avance rapide dans `main`, `main` poussé, branche supprimée
  (locale et distante). La prochaine tâche ouvre sa propre branche.

### Pensée
- Une pièce qui bouge emporte tout ce qui la dessine : son contour (une colonne à deux texels de la peau, la rangée basse d'un poing), même
  quand il tombe dans un autre calque (les jambes à partir de `hipY`). Les cinq planches avaient la même famille de défauts : un contour
  resté en place (tiret, languettes, fil, couture) ou une place découverte remplie de côté hors de portée (trous, bandes sombres).
- Ce qu'une pièce découvre se remplit par ce qui est derrière elle dans le sens du mouvement : au-dessus pour un avant-bras ou une main
  qui descend (la manche continue), en dessous pour un poing qui remonte (la cape, la jambe) ; un repli « de côté » se vérifie : vers
  l'avant il a doublé le liseré du garde, vers le corps il a sorti la hanche du forgeron de 3 texels.
- Un défaut se mesure dans l'export (fond enclavé par remplissage depuis le bord, îlots, vidage texte de la vue et de l'image), se rattache à
  une ligne du script, se corrige dans le script, s'essaie hors du dépôt (`--check --keep`) et se compte (retirés / ajoutés / recolorés)
  avant la construction réelle.
- Une reprise se re-critique par un agent neuf : le tour 1 du docker a trouvé une encoche que le correctif venait de créer. La critique
  à l'aveugle voit aussi des défauts hérités hors de la demande : les noter, ne pas élargir la passe sans l'opérateur.
- GNU `sed` : `` \` `` est une ancre (début du tampon), pas un accent grave échappé ; écrire les blocs du journal sans échappement
  (heredoc entre apostrophes) et vérifier le diff avant de pousser.

## Passe 4A-tervicies — Distribution : la foule du quartier marchand, cinq citadins cuits (2026-10-17)

### Demande (2026-10-17)
- Mot pour mot : « Je veux finaliser les NPC manquants de Merchant district afin d'avoir tous nos personnages de la scenes prets puis enfin
  passer au menage M1 et defaults herites, il faudra aussi faire un travail sur les performances GP, afin de s'assurer que le projet run bien
  dans le navigateur sans surcharge ». Réponses aux questions de la séance : foule « 5 citadins ordinaires (Recommandé) » (planche 01-16 :
  03 Artisane, 07 Voyageur, 09 Citadine, 15 Vieux marchand ; planche 17-24 : 22 Coursier) ; héros et chat « Générés pour l'instant
  (Recommandé) » ; nouveaux PNJ placés « Non, remplacer seulement (Recommandé) ». Branche `cast-crowd` ouverte depuis `main` (`549aab9`) et
  poussée. Pause demandée (« Rapide pause »), reprise (« On peut reprendre la session »).
- Cette passe ne fait que la foule ; le ménage M1, les défauts hérités (-1d) et les performances GPU restent à faire, chacun sur sa branche.

### Méthode
- Cinq rigs (`rigs/{artisan,traveler,townswoman,older-merchant,courier}-x2-v1.rig.mjs`) tirés d'un gabarit à deux familles : **robe**
  (artisane, citadine) = la marche de la marchande approuvée (corps et robe qui rebondissent, ourlet en retard, bottes rigides derrière la
  robe ; profil : une botte de la vue et une copie plus sombre sur le cycle de cheville du docker) ; **pantalon** (voyageur, vieux marchand,
  coursier) = face / dos du garde approuvé (corps au-dessus de l'entrejambe qui rebondit, bas de jambes rigides derrière lui), profil du
  docker (deux jambes peintes par IK dans la gamme du pantalon de la vue, botte de la vue déplacée rigidement). Bras immobiles (choix de la
  marchande approuvée : les balancements de bras étaient la source des défauts hérités de la 4A-duovicies). Vues reconstruites
  (`reconstruct-grid --closing-from=48`), une palette k-means de 64 couleurs par personnage, cadre 64 × 96, pieds rangée 90, échelle 0,9.
- Jeu : `BakedCast.ts` déclare les cinq feuilles à la place des variantes générées `crowd0`..`crowd4` (les promeneurs en tirent une par
  apparition) ; elles ne se chargent qu'avec `?cast=candidate` (DEV) tant que les manifestes sont `candidate`. `ActorSystem.spawn` : une
  feuille cuite garde ses couleurs (la teinte aléatoire de la foule, l'outil de variété des modèles générés, ne s'y applique pas ; les tirages
  restent).
- Preuves à chaque tour : planches ×3, marches provoquées en scène (caméra B, un citadin neuf envoyé à gauche, à droite, en s'éloignant et en
  revenant, les autres acteurs masqués, pas fixes de 1/60 s), fond enclavé compté (remplissage depuis le bord), critiques à l'aveugle par
  des agents neufs (étiquettes tirées au sort, clé hors de leur portée, auto-critique écrite avant), `--check`, autotest de texture,
  captures déterministes contre une base figée (`549aab9` servie sur `:5184`).

### Constats et corrections (tous dans les scripts de rig, rejouables au texel près)
- **Profil de l'artisane à l'envers** [OK] : la 4e vue de NPC 03 regarde déjà à gauche sur la planche (celle de la marchande, à droite) ;
  le miroir commun la faisait marcher à reculons. Profil gardé tel quel, chaussure de 12 colonnes, ourlet 84 ; les quatre autres vérifiés.
- **Jambes peintes de profil brunes ou noires** (pantalons) [OK] : la gamme était échantillonnée sur des rangées entières (manteau, sac,
  tablier). Puis : boîte de texels de pantalon mesurée par vue (`legs`) ; teinte filtrée (à 40° de la teinte médiane des texels chromatiques,
  ou quasi neutre : sans ce filtre, un seul texel gris mauve donnait la teinte moyenne du voyageur) ; cinquième le plus sombre écarté ; jambe
  lointaine = gamme proche 0,07 L plus sombre (au tour 2, un même gris pour les deux tibias les fondait).
- **Bottes de profil en fragments** [OK] : « 9 colonnes depuis l'orteil le plus avancé » prenait l'orteil de la botte lointaine ou l'ombre
  sous l'ourlet (épingles sombres de la citadine) → boîte mesurée de la botte proche (`bootRect`). Copie lointaine : 0,16 plus sombre →
  chaussures bordeaux (voyageur), 0,1 → bottes fondues (tour 2), retenu 0,13 (pantalons) et 0,16 (citadine). Citadine à 11 colonnes
  **[KO, tour 3]** : la colonne de contour de l'orteil coupée, le bout brun se fondait dans le sol chaud → retour à 13 colonnes.
- **Ombre du sol sous les semelles du coursier** (profil, dos) [OK] : `align` la prenait pour les semelles, vue entière 2 rangées trop haute
  (saut au demi-tour, dalle noire de 7 × 2 sous la botte) → effacée en coordonnées alignées (`BELOW`), vue réalignée.
- **Pieds plantés au-dessus de la rangée 90** dans les vues de face / dos (rangée 88-89 : la pose dessinée) [OK] : le pied planté sautait
  d'une rangée à chaque pas et le repos sautait dans la marche → chaque jambe posée sur la rangée 90 pour repos et marche (`setDown`), sa
  rangée haute répétée sous le corps.
- **Tibias quasi noirs** (vieux marchand de face, coursier de dos, lus comme des trous) [OK] : sous l'entrejambe + 2, un texel de L < 0,12
  aux quatre voisins opaques prend la couleur de palette un cran plus claire (`liftLegs`) ; le contour reste.
- **Glissade latérale des robes** [OK] : report de poids 2 → 1 texel (celui de la marchande).
- Voyageur : bout de sangle détaché du sac (face) et éclat sombre entre les jambes (dos) effacés [OK]. Citadine : trous de 1-2 texels
  comblés par le voisin le plus sombre (`fillPinholes` de la distribution approuvée) [OK].
- Fond enclavé : 0 dans les 90 images de marche et les repos. Rangée la plus basse : 90 dans les 150 images (une critique annonçait un
  profil « qui flotte d'un texel » : mesuré faux, non corrigé).

### Critiques à l'aveugle
- Tour 1 (candidat contre la variante générée qu'il remplace, en scène ; planche contre la référence) : artisane 7 / 3,5 (planche 6,5),
  voyageur 6,5 / 3 (6), citadine 6,5 / 3 (6), vieux marchand 7 / 3,5 (6,5), coursier 6 / 3 (6). Toutes jugent le candidat très au-dessus ;
  reproche commun : haut du corps figé.
- Tour 2 (révisée / précédente) : artisane 6 / 5, voyageur 6 / 5, citadine 5,5 / 4 (introduit : une semelle unique en profil 4-5), vieux
  marchand 6,5 / 6 (perte : bottes fondues de profil), coursier 6,5 / 5 (perte : jambes lointaines fondues).
- Tour 3 (voyageur, citadine, vieux marchand, coursier) : 6,5 / 6, citadine 6 / 6,5 (tour 2 préféré : orteil coupé), 6,5 / 6, 6,5 / 5,5 ;
  aucun défaut nouveau chez les trois autres. Tour 4 (citadine finale, 13 colonnes, copie
  lointaine 0,16, trous comblés, contre celle du tour 2) : 6,5 / 6, aucun défaut nouveau.
- Auto-critiques écrites avant chaque tour ; elles annonçaient les pertes de contraste de la jambe lointaine, pas l'orteil coupé.

### Preuves finales
- Jeu (DEV `?cast=candidate`) : dix feuilles cuites chargées sans erreur, 322 images sur les 336 que la texture garantit (1024 × 2016) ;
  les deux promeneurs de la graine 1842 deviennent `artisan-x2-v1` et `traveler-x2-v1` (teinte 1 / 1 / 1, échelle 0,9 × tirage).
- Démarrage par défaut (A, B, C, D, C et D forge sabotée, 1920 × 1080, `clean=1&freeze=7.3`) : **0 px** contre la base figée `549aab9`,
  témoin de répétition 0 px (les candidats ne se chargent qu'avec le drapeau DEV ; la ligne de teinte d'`ActorSystem` ne touche que les
  feuilles cuites, dont aucune n'a de teinte aujourd'hui). Avec les candidats : A 23 522 px, B 82 508, C 74 211, D 24 515, C sabotée 23 257,
  D sabotée 36 633 (les deux promeneurs, leur ombre, leur reflet).
- Autotest de texture (`?baked=<id>`) des cinq feuilles finales : CPU 0, GPU 0 texel aux échelles 1, 2, 3, 2,37, contrôles négatifs en échec,
  débordement 0. `--check` : les cinq se reconstruisent à l'identique ; `verify-provenance` : cinq paquets intacts ; `art:validate` 0 erreur
  (14 manifestes) ; `npm run build` vert (JS 910,49 Ko contre 874,48 Ko au build de la passe C3 : les métadonnées des cinq feuilles ; leurs PNG
  partent aussi dans `dist` sans être chargés, comme le prévoit `BakedCast`).
- Revue : `reviews/<id>/` (planche ×3, marche en scène générée / candidate, autotest, README) et `reviews/crowd-4a-tervicies/` (B et C,
  générée / candidats, rapport des captures). Revus en candidats (manifestes `status: candidate`, `runtimeUse: "lab"`, paquets `CANDIDATE`), puis
  **approuvés par l'opérateur le 17/10** (voir « Décision opérateur ») ; aucun personnage déclaré Gold Master.

### Décision opérateur (2026-10-17) — [OK] approuvée
- À la demande « Montre-moi les cinq planches une à une avant que je décide. », les cinq planches (`reviews/<id>/01-frames-x3.png`) montrées
  une à une avec les corrections et les verdicts des critiques, puis les deux décisions ouvertes (bras, visibilité). Mot pour mot :
  « J'approuve les cinq citadins pour la production : fusionne cast-crowd dans main, pousse main et supprime la branche. »
- Consigné dans les cinq paquets (`approvals` avec l'empreinte de l'export, `status`), manifestes (`status: approved`, `approved: true`,
  `runtimeUse: "production"`, `approval`, `notes`) et README de revue ; `AGENTS.md` (distribution de production : les cinq citadins, seuls le
  héros et le chat restent générés) ; commentaire de `BakedCast.ts` (quatre reconstruits à un pas plus grossier, 1,8-2,0 contre 1,775 : le
  « trois » du commit précédent était faux). Aucun personnage déclaré Gold Master.
- Après approbation (DEV, sans drapeau) : le démarrage par défaut charge les dix feuilles cuites en production ; ses captures (A, B, C, D, C et
  D forge sabotée, 1920 × 1080, `seed=1842&clean=1&freeze=7.3`) sont **identiques au pixel** (0 px, écart max 0) à celles des candidats
  d'avant l'approbation (`?cast=candidate`) ; témoin de répétition 0 px ; `?cast=generated` diffère toujours (A 50 097 px, B 168 293,
  C 272 340, D 97 352, C sabotée 155 893, D sabotée 137 651 : toute la distribution générée). `verify-provenance` : cinq paquets intacts ;
  `art:validate` 0 erreur (14 manifestes) ; `typecheck` et `npm run build` verts (JS 910,55 Ko).
- Branche `cast-crowd` fusionnée en avance rapide dans `main`, `main` poussé, branche supprimée (locale et distante).

### Restent (décisions de l'opérateur, non traités)
- Bras immobiles en marche (les cinq critiques) : un balancement se ferait comme pour le docker, avec les mêmes risques (contours laissés).
- Costumes différents selon la vue, fidèles aux planches : tablier absent de profil (citadine, vieux marchand), sac absent de profil (voyageur),
  chemise de couleur différente (vieux marchand).
- Cycle 3 + 3 sans double appui (hérité du garde), moucheture orange de l'écharpe du coursier, tablier et mains clairs sous les lanternes,
  quelques éperons d'un texel (talon, orteil, bord du sac), coin sombre entre les jambes de dos (voyageur).
- **Visibilité** : à la densité 1 et à la graine 1842, la foule ne compte que 2 promeneurs (`round(2 × densité)`) : l'artisane et le voyageur ;
  la citadine, le vieux marchand et le coursier n'apparaissent qu'avec d'autres graines ou une densité plus forte (« remplacer seulement »).

### Pensée
- La 4e vue d'une planche n'est pas toujours tournée du même côté : un profil se vérifie contre la planche avant d'être miroité.
- Une gamme peinte s'échantillonne sur une boîte de la seule matière, filtrée par sa teinte : un texel étranger au milieu des quantiles
  colore toute la jambe. Une pièce découpée « par colonnes depuis l'orteil » prend ce qui dépasse le plus (orteil de l'autre botte, ombre) :
  une boîte mesurée par vue.
- Les vues reconstruites portent l'ombre du sol de la planche ; `align` la prend pour les semelles et décale toute la vue : compter la
  rangée basse par jambe et par vue.
- Une affirmation de critique se mesure avant correction (« flotte d'un texel » : faux) ; chaque reprise se re-critique par un agent neuf :
  il a trouvé deux pertes créées par la reprise (bottes fondues, orteil coupé).

## Passe M1 — Ménage : worktrees, bases figées et jonctions `node_modules` (2026-10-17)

### Demande (2026-10-17)
- Mot pour mot : « Oui, lance le ménage M1 sur sa propre branche. » (réponse à « On attaque le ménage M1 maintenant ? »), deuxième étape de la
  demande de la passe 4A-tervicies (« … puis enfin passer au menage M1 et defaults herites … »). Périmètre noté en -1e : `HD-2D-visbase`
  (jonction `node_modules` d'abord, jamais sa cible), worktree `kind-wilson` détaché et branche locale `claude/kind-wilson-a0fa95`, entrées
  `base-cast3` / `base-main5` de `.claude/launch.json`. Branche `housekeeping-m1` ouverte depuis `main` (`4a31577`) et poussée.
- En cours de passe, l'opérateur a ajouté une tâche pour plus tard (mot pour mot en -1f) : des variantes de PNJ (cheveux, peau).

### Fait
- État de départ : `HD-2D-visbase` (détaché, `700179e`) et `.claude/worktrees/kind-wilson-a0fa95` (détaché, `77621bb`) propres (rien de
  modifié ni de non suivi ; `dist/` ignoré dans kind-wilson), leurs têtes dans `main` ; `claude/kind-wilson-a0fa95` (`f57e69d`) ancêtre de
  `main`, sans branche distante. Chacun portait une jonction `node_modules` vers celui du dépôt.
- `node_modules` du dépôt compté avant et après chaque retrait : 44 entrées, 52 `package.json` (profondeur 3), vite 8.3.1, three 0.186.1,
  typescript 5.9.3 : inchangé du début à la fin.
- `HD-2D-visbase` [OK] : jonction retirée (`rmdir` sur le lien seul), puis `git worktree remove` : worktree désinscrit et vidé, mais le dossier
  vide refusé (« Permission denied ») : un serveur Vite d'une séance précédente (lancé à 06:22, `:5186`, configuration d'un ancien scratchpad)
  y avait son répertoire courant. Arrêté (il ne servait plus rien : sa jonction venait de partir), dossier supprimé.
- `kind-wilson` [OK] : jonction retirée ; `git worktree remove` refusé de même : deux boucles d'attente `until grep … sleep 5` d'une séance
  de la passe 5b (07:40, en attente d'une ligne de log qui ne viendrait plus) y avaient leur répertoire courant. Arrêtées, dossier supprimé,
  `git worktree prune` sans reste ; branche `claude/kind-wilson-a0fa95` supprimée (`git branch -d` : fusionnée).
- `.claude/launch.json` [OK] : entrées `base-cast3` / `base-main5` retirées (et `crowd-base` de la passe 4A-tervicies) ; restent `dev`,
  `dev-cast2`, `dev-cast3`. Le dossier `.claude/` n'est pas versionné : rien de ceci n'est dans le commit.
- Jonctions orphelines [OK] : recherche des liens sous le dossier temporaire des séances HD-2D (`Get-ChildItem -Attributes ReparsePoint`) :
  cinq autres jonctions vers le `node_modules` du dépôt dans d'anciens scratchpads (`base-05d5f39` / `base-2eb83d1`, les bases des deux
  entrées retirées ; `base-14b8686`, `base-8693690`, `v-700179e`). Risque : un nettoyage récursif du dossier temporaire qui suivrait une
  jonction viderait le `node_modules` du dépôt. Les cinq liens retirés (script Node : lien et cible vérifiés, puis `unlinkSync`) ; plus aucun
  lien sous ce dossier ; les deux bases des entrées retirées supprimées (instantanés de `2eb83d1` / `05d5f39`, tous deux dans `main`). Les
  jonctions des séances RPGCards ne sont pas touchées.
- [KO] `cmd //c "rmdir <chemin>"` depuis Git Bash : « chemin d'accès introuvable » pour les chemins du dossier temporaire (rien supprimé),
  alors qu'il avait marché pour `HD-2D-visbase` ; repli Node (`lstat` / `readlink` / `unlink`).
- Vérifications : `git worktree list` = le dépôt seul ; branches `main` et `housekeeping-m1` ; `typecheck` 0, `npm run build` vert,
  `art:validate` 0 erreur (14 manifestes).

### Décision opérateur (2026-10-17) — [OK] acceptée
- Mot pour mot : « La tâche est terminée et acceptée : fusionne housekeeping-m1 dans main, pousse main et supprime la branche. Arrête aussi les deux
  vieux serveurs Vite sur 5174 et 5180. »
- Les deux serveurs Vite d'hier arrêtés (ligne de commande vérifiée avant) : `:5180` (lancé le 16/10 à 20:23 avec le `node_modules` du
  dépôt) et `:5174` (16/10 à 22:48, base `base-894c4d3` d'un ancien scratchpad dont le `node_modules` n'existait plus ; `:5174` est le port
  des bases figées de `tools/eval.mjs` : un outil pointé dessus aurait photographié cette vieille base). Ports 5174 et 5180 libres.
- Branche `housekeeping-m1` fusionnée en avance rapide dans `main`, `main` poussé, branche supprimée (locale et distante).

### Restent (décisions de l'opérateur, non traités)
- Bases figées restantes, sans lien désormais : `base-14b8686`, `base-8693690`, `v-700179e`, `base-894c4d3` (scratchpads de séances passées).
- `.claude/launch.json` : `dev-cast2` (`:5186`) et `dev-cast3` (`:5189`) servent le dépôt lui-même sur d'autres ports : sans objet.

### Pensée
- `git worktree remove` désinscrit et vide le worktree, puis échoue sur le dossier vide tant qu'un processus y a son répertoire courant
  (serveur, boucle d'attente d'une séance passée) : chercher les processus par leur ligne de commande, vérifier qu'ils ne servent plus
  rien, les arrêter, puis supprimer le dossier.
- Une jonction se cherche partout où des bases figées ont été montées (scratchpads des séances passées), pas seulement là où l'on se
  souvient d'en avoir créé ; elle se défait comme un lien (nature et cible vérifiées), jamais par une suppression récursive.

## Passe 4A-quatervicies — Distribution : défauts hérités -1d (d)-(h) des cinq planches approuvées (2026-10-17)

### Demande (2026-10-17)
- Mot pour mot : « Oui, lance les défauts hérités -1d (d)-(h) sur leur propre branche. » (troisième étape de la demande de la passe
  4A-tervicies : « … puis enfin passer au menage M1 et defaults herites, il faudra aussi faire un travail sur les performances GP … ») ; une
  seule branche pour les cinq (les mots de l'opérateur ; « branche par branche » était ma formulation de -1e). Branche
  `cast-inherited-defects` ouverte depuis `main` (`f9ad117`) et poussée. Reprise après une pause : « Oui on peut coontinuer notre tache que
  nous faisions ».
- En cours de passe, mot pour mot : « Tu peux deleguer sur une autre session la tache de performance et optimisation du jeu via GPU et etc...
  en te basant sur le travail fait sur le projet RPGCards qui semble etre bien reussi ». Conflit avec la règle « une branche à la fois »
  signalé ; arbitrage de l'opérateur : « Analyse seule d'abord (Recommandé) ». Séance « Performances GPU : analyse et plan » lancée : lecture
  seule de RPGCards, mesures `tools/perf.mjs`, plan chiffré dans le dossier de notes partagé des séances (hors dépôt) ; ni branche ni commit
  avant la fusion de cette branche et l'accord de l'opérateur sur le plan.

### Méthode
- Celle de la passe C3 : chaque défaut mesuré dans la planche (vidages texte, zooms, comptes : texels clairs posés sur le fond, éperons,
  fond enclavé, clarté OKLab), rattaché à la ligne du rig qui le produit, corrigé dans le script seulement. Nouveau banc d'essai hors du
  dépôt : `frames()` d'une copie modifiée du rig rejoué sur les vues committées, variantes côte à côte et comptées, puis construction réelle
  et `--check`. Palettes approuvées épinglées : 0 couleur nouvelle partout. Critiques à l'aveugle par des agents neufs (X / Y tirés au sort,
  clé hors de leur portée, auto-critique écrite avant) ; chaque reprise re-critiquée.

### (d) Marchande (`merchant-x2-v2`)
- Report de poids de face / dos : `SHIFT` 0, 2, 1, 0, −2, −1 → 0, 1, 1, 0, −1, −1 (celui des robes de la foule) [OK].
- Profil, chaussures fondues : chaque chaussure fait 10 colonnes (bout clair, talon sombre ; vérifié sur la planche) et l'écart du cycle
  aux images 2 / 5 (6,8 colonnes) les fait chevaucher de ~3 colonnes ; la copie lointaine, 0,1 plus sombre au même niveau, s'y fondait.
  - Tour 1 : copie 0,16 plus sombre → critique révisée 7 / précédente 6 (le saut de côté corrigé, les chaussures séparées par la valeur) ;
    **perte** : talon lointain noir de contour, « bloc noir » à l'image 3 (19 texels sous L 0,15) [KO partiel].
  - Tour 2 : assombrissement avec plancher (`flooredDarkener` : −0,16 sans descendre sous min(L propre, 0,2) ; 4 texels sous L 0,15) →
    7,3 / 7,0 ; restent une semelle continue (images 2 / 5) et une bande sombre (image 3).
  - Tour 3 : botte lointaine une rangée plus haut (plus loin de la caméra, comme la planche la dessine au repos ; son haut passe sous
    l'ourlet) → 7,5 / 7 (profondeur cohérente, plus de semelle continue à l'image 5 ni de tiret à l'image 1) ; **perte** : à l'image 3, sa
    rangée haute dépassait devant la jupe (4 texels sombres) ; notés aussi : pied lointain soulevé de 2 à l'image 0 (pied qui décolle),
    bout lointain collé à la semelle proche à l'image 4, botte lointaine presque noire à l'image 5.
  - Tour 4 : rien de la botte lointaine au-dessus de la rangée basse de l'ourlet (4 texels retirés) → 7,5 / 7,0 ; coût noté : un creux de
    2 texels au bord avant de l'ourlet à l'image 3, presque invisible sur le sol de nuit.
- Contre la planche approuvée : 380 texels retirés, 329 ajoutés, 6 124 recolorés (surtout le corps décalé d'un texel aux images 1 et 4
  de face et de dos), 10 images, 0 couleur nouvelle.

### (e) Garde (`guard-x2-v1`)
- Le « talon détaché » est le coin beige de la cape (x 45-47, rangées 81-82, et son renflement x 47-49, rangée 80, du profil), seul à
  hauteur des tibias, dans les couleurs des bottes : effacé dans `prepare` (repos de profil compris) [OK]. Essai **[KO]** : le recolorer
  dans le bleu de la cape laissait une tache sombre et un point isolé.
- Jambe arrière : 8 à 43 texels visibles selon l'image (botte 19 à 49), cachée surtout aux images 1, 2, 4 ; sa gamme peinte était deux crans
  et demi plus sombre que la proche, près du bleu de la cape → un cran [OK, en partie : elle reste réduite à un pied aux images 1 / 4].
- Critique : révisée 7,5 / précédente 6 ; coûts notés : bout de cape sans contour (invisible à l'échelle du jeu), un peu moins de
  profondeur entre les jambes aux images 2 / 3. Planche : 89 retirés, 98 recolorés, 10 images.

### (f) Passant (`hooded-x2-v1`)
- La bande sombre derrière le talon = une mèche du bas de la cape (x 43-47, rangées 82-87 du profil), cisaillée avec elle : effacée dans
  `prepare` [OK] (la variante x 44-47 / 83-87 laissait une pointe sombre à l'image 2). Critique : 7,5 / 5,5 ; seul coût : le talon arrière
  de l'image 3, que la mèche couvrait, plat et sans contour. Planche : 171 retirés, 9 recolorés, 10 images.

### (g) Forgeron (`blacksmith-x2-v1`)
- Causes (marche de face) : la colonne de contour extérieure de chaque bras est à 2 texels de la peau, hors du masque (peau + 1) : elle
  restait en place quand le bras s'étire, se resserre ou se décale (épaule et bras crénelés) — la cause corrigée de dos en C3 ; le contour
  bas du poing (rangée 63) est sous une peau ombrée (L 0,55-0,58, sous le seuil 0,6 du test de peau) et restait en place quand le poing
  remonte (le contour du poing qui va et vient). Baisser le seuil aurait pris le tablier (même teinte) : écarté.
- Correctifs : `outer: 1` et `down: 1` sur les bras de face (la rangée sous la dernière rangée de peau hérite de son masque). Texels clairs
  posés sur le fond, bras gauche, images 0-5 : 11 / 1 / 8 / 8 / 1 / 10 → 5 / 1 / 3 / 2 / 1 / 4 (repos : 1, venu de la vue).
- Critique 1 : 7 / 6, **perte** : un cran d'un texel au coude, (12, 50) de l'image 3 (le décalage vers l'intérieur emporte la colonne de
  contour) → `closeNotches` (dans les boîtes des bras, un texel transparent entre deux texels de contour sombres au-dessus et au-dessous
  prend le plus sombre : 1 seul texel changé). Critique 2 : 7,5 / 7,3 (ce texel). Planche : 6 retirés, 42 ajoutés, 11 recolorés, 4 images.
- Restent (hérités) : la ligne d'épaule gauche pointillée de la vue de face elle-même (repos compris), une entaille sous le poing gauche
  (x 17), le bord du tablier sans contour sous le poing droit (images 2-3), un cran (49, 67) à l'image 5.

### (h) Docker (`dockworker-x2-v2`)
- Dessus de casquette : de face une barre de 2 rangées, coins percés dans les trois vues → `capOutline` dans `prepare` : rangée 2 de la
  barre retirée (face), marches de contour manquantes dessinées dans la couleur du contour, trous du bord comblés par la couleur voisine
  (coordonnées consignées ; la vue de face est l'export v1 approuvé, modifié ici et non dans l'export) [OK].
- Bras qui s'allonge : l'avant-bras qui passe devant descendait de 2 rangées (la manche étirée d'autant) → 1 rangée [OK].
- Critique : 7,5 / 6, aucun trou, cassure ni saut ajouté ; coûts : balancement plus petit et asymétrique (+1 / −2, lisible), couronne de
  face une rangée plus basse. Planche : 169 retirés, 147 ajoutés, 775 recolorés, les 30 images (la casquette est partout).

### Preuves communes
- Les cinq : `--check` identique, `verify-provenance` intact, autotest de texture exact (CPU 0, GPU 0 aux échelles 1 / 2 / 3 / 2,37,
  contrôles négatifs en échec, débordement 0), mêmes images, étiquettes et JSON, 0 couleur nouvelle ; `art:validate` 0 erreur (14 manifestes) ;
  `typecheck` 0, `npm run build` vert (JS 910,55 Ko).
- Démarrage par défaut (A, B, C, D, C et D forge sabotée, 1920 × 1080, `clean=1&freeze=7.3`) contre `main` (`f9ad117`) servi à part :
  **diffère**, comme attendu : A 280 px, B 1 390, C 1 146, D 2 176, C sabotée 732, D sabotée 336 ; témoin de répétition 0 px. Attribution
  (outil de preuve avec masquage) : dockers masqués → A 84, B 133, C 331, D 74, C et D sabotées inchangées ; passant masqué → C sabotée 0
  (D monte à 3 681 : il cachait un docker) ; dockers et passant masqués → 0 px en A, B, C et C sabotée, 74 px en D et 137 px en D sabotée : les deux gardes de la barrière, de
  profil au repos en D (leur coin de cape) ; dockers, passant et gardes masqués → 0 px en D et D sabotée. Les écarts sont donc la casquette des deux dockers (toutes leurs
  images changent, repos compris) et le repos de profil du passant ; les autres changements sont des images de marche que le démarrage ne
  montre pas à ce pas.
- Marches en scène (caméra B, personnage neuf envoyé à gauche, à droite, en s'éloignant et en revenant, autres acteurs masqués, pas de
  1/60 s), avant (`main`) / après, vues qui changent : `reviews/<id>/…-inherited-defects-walk-in-scene-cameraB.png` ; planches avant /
  après : `…-inherited-defects-before-after.png`.
- Paquets : nouvelle révision (`revisions`, demande citée, empreintes avant / après, comptes, approbation en attente), `status`, `chain` ;
  manifestes (`notes`) ; README de revue ; `selftest.json` rafraîchis. **Approuvé par l'opérateur le 17/10** (voir « Décision opérateur ») ; aucune planche
  déclarée Gold Master.

### Décision opérateur (2026-10-17) — [OK] approuvée
- Les cinq avant / après (`reviews/<id>/…-inherited-defects-before-after.png`) montrés en séance avec les verdicts des critiques et les
  restes. Mot pour mot :
  « J'approuve les cinq planches corrigées des défauts hérités pour la production : fusionne cast-inherited-defects dans main, pousse main et supprime la branche. »
- Consigné dans les cinq paquets (`approvals`, `revisions[]` de la passe, `status`), manifestes (`notes`) et README de revue ; aucune
  planche déclarée Gold Master. Branche `cast-inherited-defects` fusionnée en avance rapide dans `main`, `main` poussé, branche supprimée
  (locale et distante).

### Restent (non traités)
- Marchande : les limites relevées au tour 3-4 (voir plus haut) ; corps sans bras ni balancement de jupe en marche. Garde : cape rigide,
  jambe arrière réduite à un pied aux images de passage. Passant : talon arrière plat à l'image 3, cassure de contour au dos de la cape.
  Forgeron : ligne d'épaule pointillée de la vue, entaille sous le poing gauche, bord de tablier sans contour. Docker : manche resserrée de
  2 rangées au recul, sangle sans contour (images 2-3), bras de profil presque immobile, bottes de profil fondues.

### Pensée
- Un assombrissement par soustraction écrase les tons déjà sombres au noir du contour : un plancher (ne pas descendre sous sa propre
  clarté ni sous un seuil) garde l'écart sur le cœur sans créer de blocs noirs.
- Deux pièces de même forme se séparent mieux par un indice de profondeur (la plus lointaine plus haut à l'écran, la caméra plongeant)
  que par la valeur seule ; tout déplacement d'une pièce se borne ensuite à ce qui la cache (l'ourlet) pour ne pas dépasser de la
  silhouette.
- Une règle de réparation (fermer un cran d'un texel) se borne à une zone et se compte avant / après : ici un seul texel changé.
- Pendant des captures du serveur de travail, ne rien reconstruire : une planche réécrite recharge la page (Vite) et casse la capture en
  cours. Avec la distribution cuite, un acteur se masque par l'id de sa planche (`dockworker-x2-v2`), pas par son archétype (`porter`) :
  un masquage sans effet se vérifie (base masquée contre base non masquée).
- Chaque agent critique écrit dans son propre dossier : quatre agents dans un même dossier ont écrasé les fichiers les uns des autres.

---

## Passe M2 — Règle de l'opérateur : serveurs de développement et processus d'arrière-plan (2026-10-17)

### Demande (2026-10-17)
- Règle de l'opérateur, datée du 2026-10-17, ajoutée à `AGENTS.md` : section « Dev servers and background processes », entre « Commands » et
  « Useful URL params ». Le texte a été rédigé dans la séance « Vérification des accès aux projets », qui le destinait à la « Séance commune
  HD-2D » ; celle-ci étant archivée, l'opérateur l'a fait envoyer à la séance « Cité du Tournoi Local », mot pour mot : « Envoie la consigne
  à la session Cité du Tournoi Local. » Consigne transmise : insérer la section mot pour mot, la journaliser, ne committer que `AGENTS.md` et
  `JOURNAL.md` sur la branche active, pousser.

### Pourquoi
- Des séances HD-2D demandaient sans cesse l'autorisation de l'opérateur pour des balayages des processus du système
  (`Get-CimInstance Win32_Process`) et des `taskkill` sur les restes de séries de mesures (ports 4191 / 4192). Ces commandes visent tout le
  système et peuvent atteindre des programmes sans rapport. L'opérateur veut que les séances passent par leurs propres outils : serveurs par
  `preview_start` / `preview_stop` (entrées de `.claude/launch.json`), longs scripts par `run_in_background` / `TaskStop` ; un processus qui
  leur échappe se signale (port et PID propriétaire) et l'opérateur décide.

### Fait
- [OK] `AGENTS.md` : section insérée mot pour mot. `JOURNAL.md` : cette passe et un principe. Aucun code, aucune mesure.
- Commit sur la branche active `perf-gpu` (celle de la séance « Performances GPU : analyse et plan », qui travaille dans le même dossier), avec
  ces deux fichiers seuls : ses modifications non committées (`tools/perf.mjs`, `tools/bench-common.mjs`, `tools/gpu-witness.ps1`) n'y sont pas.
- Cette règle remplace la méthode de la passe M1 (« chercher les processus par leur ligne de commande, […] les arrêter ») : désormais on
  signale le port et son PID, et l'opérateur décide.

### Pensée
- Un processus lancé hors des outils de la séance ne se retrouve ensuite qu'en balayant tout le système. L'effort se place donc au lancement
  (outils de la séance, entrée `launch.json`) et en fin de séance (tout arrêter), pas dans un nettoyage après coup.

---

