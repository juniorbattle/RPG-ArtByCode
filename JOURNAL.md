# Journal de bord — Cité du Tournoi (Merchant District, nuit)

Objet : garder une trace honnête de ce qui a été fait, de ce qui a marché, de ce qui a raté et de **pourquoi**, pour que
la suite parte d'un état connu. À compléter à chaque passe (une entrée par passe, la plus récente en bas).

Légende : **[OK]** réussi · **[KO]** échec / impasse · **[?]** non résolu ou à surveiller · **Pensée** = raisonnement / leçon.

> Les passes 0 et 1 sont reconstruites à partir de l'historique git et d'`AGENTS.md` uniquement : je n'y ai pas pris
> part, je ne rapporte donc que ce que les commits et la doc établissent. La passe 2 est détaillée, c'est celle que j'ai menée.

---

## Passe 0 — Prototype initial (`d409e9f`, 2026-10-10)

Prototype procédural HD-2D : Three.js + TypeScript (Vite), tout est généré par le code au démarrage (géométrie,
textures, sprites, éclairage). Architecture posée dès ce commit : générateur de bâtiments par grammaire de façade,
acteurs en sprites pixel-art billboards, `LightRig` partagé par tous les shaders, post-traitement maison (DOF, bloom,
in-scatter, grade), panneau de direction artistique, graine déterministe (`seed=1842`).

- Caméra d'origine : vue diorama fixe, perspective faible, tilt-shift, suivi borné du joueur.
- Le dépôt contenait ~21 captures d'itération en vrac à la racine de `screenshots/`.

## Passe 1 — Passe de direction artistique (`c1dd1e2`, puis `c147211`)

Objectif : une vue 3/4 verrouillée depuis l'autre côté du canal, palette monochrome (indigo/ardoise, ambre seule note
chaude), « détail orchestré ».

- **[OK]** Composition axée sur le canal : un quai jouable, barrière de gardes à l'est, bateau amarré, étal héros comme ancre.
- **[OK]** Façades du premier et second plan toutes générées à plein détail jusqu'au pont ; modules simplifiés
  (`DistantCity.ts`) réservés à l'arrière-plan non jouable.
- **[OK]** Atmosphère : ciel + lune, brouillard exponentiel en hauteur fondu dans le ciel, reflets du canal corrigés
  de la parallaxe, in-scatter des lanternes, discipline de palette dans le grade.
- **[OK]** Désencombrement : bunting, lierre, buissons, la plupart des bannières et props éparpillés retirés.
- **[OK]** Outils : `tools/compare.mjs`, `AGENTS.md` (commandes, paramètres d'URL, direction artistique verrouillée).
- Nettoyage (`c147211`) : anciennes captures supprimées, comparatifs finaux dans `screenshots/art-pass/`.
  Ce dossier a lui-même été supprimé à la passe 2 (demande utilisateur) ; les images restent récupérables dans
  l'historique git (`git show c1dd1e2:screenshots/art-pass/compare-01-hero.png`) si on veut revoir la vue verrouillée d'origine.
- **Pensée** : la règle « ce n'est pas le détail qu'il faut limiter, c'est le détail non orchestré » vient de là ; elle
  a guidé toute la passe 2. Conséquence directe : la caméra était *l'unique* vue validée, donc tout le coût de la scène
  était calibré sur une seule image — d'où la passe 2.

---

## Passe 2 — Calibration V2 : caméras, visibilité, lisibilité des personnages (non commitée au moment de l'écriture)

Demande : (1) graphe de 3 caméras, (2) génération pilotée par la visibilité, (3) lisibilité des personnages,
(4) ne rien ajouter, (5) mesurer avant/après. Livrables : captures A/B/C, tableau perf, rapport, notes personnages.

### 2.0 Mesurer avant d'optimiser

- **[KO] Première mesure inutilisable.** Les temps d'image se rangeaient en paquets de 16,7 / 33,3 ms (vsync) : tout A/B
  était du bruit. Premier correctif tenté (forcer une synchro CPU/GPU par `readPixels` à chaque image) : pire, les
  chiffres sont devenus encore plus instables (GPU intégré Iris Xe qui chauffe, 21 → 47 ms selon le moment).
- **[OK] Vraie solution :** minuteurs GPU (`EXT_disjoint_timer_query_webgl2`, `src/debug/GpuTimer.ts`) par passe
  (reflet / scène / air / DOF / bloom / grade) + `tools/perf.mjs` qui **entrelace** les variantes dans une seule session
  navigateur sur plusieurs tours, contre une **copie figée du code d'origine** servie sur un autre port (worktree git).
- **[OK] Le profil a corrigé mes intuitions.** Le hors-passe-scène ne coûtait presque rien ; les vrais coûts étaient
  le `discard` du reflet (≈ −6 ms une fois retiré, car il désactivait l'early-z), les 24 lumières bouclées par pixel
  (≈ −8 ms avec 8 lumières), et les triangles des bois/pans de bois. Je n'ai donc pas « optimisé à l'aveugle ».
- **Pensée** : sur cette machine, toute mesure sans minuteur GPU et sans entrelacement est trompeuse. Ne jamais
  comparer des chiffres de deux sessions différentes.

### 2.1 Graphe de caméras (`src/app/CameraGraph.ts`)

- **[OK]** A (établissement), B (marchand), C (forge), zones avec hystérésis (0,9 m), transitions 0,6–1,2 s,
  interpolation de lacet/inclinaison/distance/fov/pivot/échelle des persos. Mesuré en marchant : 1,18 s, ≤ 0,55°/image.
- **[OK]** Touches de déplacement « verrouillées » sur le lacet du moment de l'appui : la direction de marche ne dévie
  jamais pendant une transition.
- **[OK]** Maintien de la vue A à l'ouverture jusqu'au premier mouvement (« où suis-je ? »).
- **[KO] Première caméra C inutilisable.** Ma première C (rapprochée, 18,5 m) était masquée par la bannière du bateau
  amarré (à x≈1,6, z≈6,35), pile entre la caméra et la cour de la forge. J'ai testé 4 variantes manuelles
  (`cam=...`) : les vues plus proches ne dégagent pas la ligne de vue. **Solution retenue :** C n'est pas un
  « rapprochement » mais un **zoom au téléobjectif** (fov 24) pris presque depuis la position de B ; la bannière reste
  un élément de cadre à droite. **Pensée** : « plus près » n'est pas toujours « mieux » dans une scène à occulteurs
  authorés ; le fov est un levier de mise en scène aussi important que la distance.
- **[OK]** Débogage assisté par paramètres d'URL ajoutés (`camera=`, `camB=…`, `blend=A,B,0.5`, `intro=0`).
- **[?]** Les zones (A : x < −9,4 ; C : x 4,2–13,2, z < 2,4) sont des valeurs posées à la main, pas dérivées d'une
  analyse de gameplay. À revalider avec de vrais parcours.

### 2.2 Visibilité (`src/district/Visibility.ts`)

Principe : chaque mur par étage / toit / maison lointaine / pont = une « pièce ». Le GPU rend des tuiles d'identifiants
depuis ~102 poses du graphe (+ jumelles miroir pour le reflet), compte les pixels par pièce, puis on trie.
Classes : toujours / pas en C / seulement en A / **cachée (Tier 3)**. Un maillage statique est ordonné
[toujours | pasC | seulA] : une caméra = une plage de dessin, aucun appel de dessin en plus.

- **[OK]** 343 pièces sur 736 retirées (27,7 k triangles) ; murs arrière jamais générés ; ombres des pièces cachées
  gardées uniquement pour le rendu unique de l'ombre de lune, puis libérées.
- **[OK] Preuve par différence d'images.** Rendu culling actif vs `vis=0`, sur A, B, C **et** sur des poses de
  transition non échantillonnées : 0 pixel de différence au-delà du seuil (écart max 0–1). C'est la garantie « pas de
  popping », vérifiée et non supposée.
- **[KO] Dépendance fragile corrigée à temps.** Mon premier étiquetage des pièces mettait les identifiants de pièces
  en dur (`[3,1,2]`) : faux dès qu'on a plusieurs étages. Remplacé par un registre explicite par étage.
- **[KO → OK] Poteaux d'angle.** Au début, les poteaux et plinthes d'angle d'un mur latéral comptaient dans la pièce
  latérale, qui apparaissait « visible » alors que seul le poteau l'était. Ils sont désormais attribués à la façade.
- **[KO → OK] Déterminisme.** Supprimer le mur arrière retirait un tirage aléatoire → tous les bâtiments de toutes les
  graines changeaient. Le tirage est conservé volontairement (commentaire dans le code). Idem pour l'ancienne rive
  opposée : ses tirages sont rejoués pour que le reste de la ville ne bouge pas.
- **[KO → OK] Coût du calcul.** Lecture CPU de toutes les tuiles : ~370 ms. Réduction GPU (points additifs vers une
  texture de compteurs) : correcte (comptes identiques) mais **plus lente** (~200 ms) à cause de la sérialisation des
  blends sur des compteurs chauds ; passage à 64 « lanes » : ~146 ms de lecture. Au final, ~250 ms ajoutés à chaque
  régénération. **[?]** Acceptable pour un outil d'édition, pas pour du streaming de zones.
- **[OK] Tier 1 — rive opposée.** Même tronçon, mêmes ~24 maisons, pas plus : rangée cohérente (pignons sur le canal,
  alignement continu, module d'étage unique, pierre au rez / colombages aux étages). Le shader « lointain » reçoit un
  mode colombage sans coût de géométrie.
- **Pensée** : la visibilité *mesurée* bat la visibilité *devinée* : ma liste manuelle de choses « sûrement cachées » aurait
  retiré des pièces visibles (ex. des façades latérales ouest visibles en A) et gardé des pièces mortes (ville haute).

### 2.3 Nettoyage du rendu (hors géométrie)

- **[OK]** Reflet découpé par **plan proche oblique** au lieu de `discard` par fragment → early-z rétabli sur tout.
- **[OK]** **Grille de lumières** par cellule de sol : chaque pixel ne boucle que sur les lumières qui l'atteignent
  (résultat identique au pixel près). Capacité par cellule = `MAX_LIGHTS` pour qu'aucune lumière ne puisse être perdue
  (le max observé était 15, trop près de ma première borne de 16 : corrigé).
- **[OK]** Ciel dessiné en dernier avec test de profondeur (il remplissait tout l'écran avant d'être recouvert).
- **[KO]** **Le culling de lumières par frustum n'apporte presque rien** (0 lumière écartée sur A/B/C) : les rayons
  sont grands et tout le quai est toujours à l'écran. Je l'ai gardé (coûte peu, utile si on étend la zone) mais le gain
  réel vient de la grille. À ne pas présenter comme un gain.
- **Pensée** : le MSAA 4× (~10 ms) et DOF+bloom (~8 ms) restent les plus gros postes ; ce sont des choix de rendu, pas
  du travail « inutile ». Je ne les ai pas touchés (cadre validé de la direction artistique).

### 2.4 Lisibilité des personnages

- **[OK] Cause racine trouvée.** Le « sharp-bilinear » du shader échantillonnait les **bords** de texels au lieu de
  leurs centres : chaque pixel mélangeait deux texels (flou, palette délavée). Passage à l'échantillonnage au plus
  proche, centres de texels explicites.
- **[OK]** Ancrage calé sur la grille de pixels de la cible de rendu (plus de scintillement en mouvement).
- **[OK]** DOF : l'alpha de la scène sert de masque de protection (joueur, cible d'interaction, PNJ importants = nets ;
  foule 80 %). L'in-scatter lit le même masque.
- **[OK]** Échelles ×1,12 (B) / ×1,15 (C) / ×1,00 (A) ; contour côté lumière / côté ombre ; ombre de contact renforcée ;
  éclairage ambre/bleu atténué mais conservé ; cheveux de foule assombris pour que la tête du joueur reste la plus claire.
- **[OK] Deux PNJ invisibles depuis le début découverts par hasard.** Le forgeron (animation de marteau uniquement
  de profil, le sprite était silencieusement ignoré dès que sa direction n'était pas `side`) et un garde (animation
  « talk » inexistante). Repli sur la bonne vue/animation + orientation mémorisée en monde (`faceVec`) pour que les PNJ
  gardent leur direction quand la caméra pivote.
- **[KO] Le forgeron noyé dans la lueur de la forge.** L'in-scatter additif + bloom le lavaient. Essais : (1) compresser
  davantage la lumière chaude sur les sprites → insuffisant ; (2) réduire l'in-scatter sur le masque → mieux mais halo ;
  (3) **superposition des personnages à 55 % après les effets transparents** (`overlay`) → lisible, mais laisse une
  légère auréole et coûte 1 appel de dessin. **[?] Solution de compromis, pas élégante.**
- **Pensée** : le travail sur les sprites est volontairement **arrêté ici** (décision utilisateur) : le moteur de sprites
  (`SpriteRenderer`) sera repris à part. Voir « À reprendre ».

### 2.5 Résultats chiffrés (entrelacés, même session, minuteurs GPU)

| Vue | GPU avant → après | Triangles | Passe scène |
|---|---|---|---|
| A établissement | 46,8 → 29,2 ms (−38 %) | 291 k → 227 k | 32,4 → 15,4 ms |
| B marchand | 43,3 → 36,2 ms (−16 %) | 291 k → 225 k | 29,8 → 22,4 ms |
| C forge | 47,6 → 37,3 ms (−22 %) | 291 k → 187 k | 32,1 → 22,6 ms |
| Même caméra qu'avant | 46,9 → 35,9 ms (−24 %) | 291 k → 227 k | 32,6 → 21,5 ms |

Inchangé : 107 → 108 appels de dessin, 48 → 49 textures, ~188 MB, 50 géométries, 24 lumières, 17 bâtiments.
Régénération : ~0,45 → ~0,8 s.

- **Honnêteté sur les chiffres** : le GPU dérive thermiquement (le « avant » de A est parfois 45, parfois 48) ; les écarts
  B (−16 %) sont plus modestes que A parce que B montre davantage de façades réellement visibles. Le baseline de la demande
  (35–37 FPS) correspondait à la fenêtre vsync, pas au coût GPU réel (~21 FPS borné GPU) : à ne pas comparer tel quel.

### 2.6 Erreurs de méthode / d'outillage (pour ne pas les refaire)

- Sous Windows, `git` n'est que dans le PATH de bash, pas de PowerShell : lancer les commandes git en bash.
- Un très long heredoc en bash a été tronqué en silence (fichier coupé en plein milieu) : j'ai repéré la troncature en
  relisant la fin du fichier ; écrire les gros fichiers avec l'outil d'édition, pas avec un heredoc.
- J'ai pris une réduction de capture (prévisualisation réduite) pour un changement de cadrage de la caméra A ; vérifié
  par comparaison côte à côte : le cadrage était bien le même. Toujours comparer avec `compare.mjs` / `diff.mjs`.
- Les captures contenant des PNJ/fumée ne sont pas déterministes : utiliser `static=1` avant tout diff d'images.
- Le dossier du worktree de baseline ne se supprimait pas (« Device or resource busy ») : ce n'était pas Windows mais
  le serveur Vite de la baseline, dont le processus `node` enfant survit à l'arrêt du shell. Cause trouvée avec
  `Get-CimInstance Win32_Process` ; après `Stop-Process` des deux PID, suppression OK.
- J'ai supprimé trop vite des captures intermédiaires puis dû régénérer les captures finales : trier les images à
  garder **avant** de nettoyer.

---

## État à la fin de la passe 2

- Build et typecheck OK. **Rien n'est commité** au moment où ce journal est écrit.
- Fichiers neufs : `src/app/CameraGraph.ts`, `src/district/Visibility.ts`, `src/debug/GpuTimer.ts`,
  `tools/{perf,diff,zoom,walk}.mjs`, `screenshots/calibration/`.
- Images conservées dans `screenshots/calibration/` : `camA-establishing.png`, `camB-merchant.png`, `camC-forge.png`
  (rendu final, 1920x1080), `compare-camA/B/C.png` (avant/après côte à côte), `perf.json` (mesures brutes) et
  `known-issues/smith-halo-before-after.png` (le forgeron noyé dans la lueur / auréole de la superposition : point 1
  de « À reprendre »). Les captures intermédiaires ont été supprimées ; pour refaire un « avant », servir le commit
  `c147211` (worktree git) sur un autre port et utiliser `tools/perf.mjs` / `npm run shots` avec `BASE_URL`.
- Process résiduel à connaître : un serveur Vite lancé via `npx` laisse un processus `node` enfant après l'arrêt du
  shell ; il verrouille le dossier du worktree. Tuer le PID du `vite.js` du worktree avant de supprimer le dossier
  (fait : `%LOCALAPPDATA%\Temp\rpg-baseline` supprimé).
- Documentation à jour : `AGENTS.md` (graphe de caméras, visibilité, notes de rendu, paramètres d'URL, outils).

---

## Passe 3 — « 1B. Player Occlusion Reveal » (préparation ; IMPLÉMENTÉE dans « Passe 3b » plus bas)

**Statut au moment de la préparation : aucune ligne de code écrite, rien mesuré.** Cette entrée fixe la demande, les
contraintes déduites du code actuel et un plan d'attaque. Tout ce qui est marqué **[?]** est une hypothèse à vérifier,
pas un résultat (les résultats sont dans la Passe 3b). Ce qui est marqué **[fait]** a été relu dans le code le jour de la rédaction.

### Demande (résumé fidèle)

La caméra semi-fixe ne doit jamais perdre la lecture du joueur à cause de géométrie d'avant-plan. Quand un objet
**marqué** `cameraOccludable` (prop, mur/toit de bâtiment, arbre, enseigne, pilier, balcon…) coupe la ligne caméra → torse
du joueur, on révèle le joueur par une **zone locale douce** (cercle/ellipse centrée sur sa projection écran), pas en rendant
l'objet entier transparent. Rayon intérieur ≈ 45–70 px, bord adouci ≈ 80–120 px (à la résolution de référence), ajustés selon la
distance caméra, la taille apparente du personnage et l'ancrage actif. Fondu entrée 150–250 ms, sortie 200–350 ms, hystérésis
anti-clignotement, plusieurs occludeurs simultanés, valable en A/B/C **et pendant les transitions**, coût négligeable
(compter occludeurs actifs, draw calls ajoutés, impact temps de frame). Style à choisir par essai : A alpha doux, B dissolve
tramé/pixel, C combinaison. À éviter : trous durs, popping, bâtiments entiers translucides, artefacts de tri, contours lumineux.

### Faits du code qui conditionnent la conception

1. **[fait] Il n'y a pas d'« objet » côté rendu.** Toute la géométrie statique (bâtiments, étal héros, bannières, bateau) est
   fusionnée **par matériau** (`static:<slot>`). Le tag `cameraOccludable` doit donc être **par pièce** (le système de pièces
   de la passe 2 existe : `Frame.part`, `MeshBuilder.part`), pas par mesh. Mais l'identifiant de pièce n'est aujourd'hui dans
   la géométrie de **rendu** nulle part (seulement dans la géométrie du bake, attribut `aPart`) : il faudra l'y ajouter.
2. **[fait] Les props instanciés** (lampadaires, barils, lanternes, bornes) sont des `InstancedMesh` par prototype × slot
   avec `instanceColor` = teinte : pas d'attribut libre par instance. Un lampadaire est donc occludable **au niveau du
   prototype** (variante de matériau), pas de l'instance.
3. **[fait] Matériaux de slot partagés** (`ShaderMaterial`, uniformes via le sac global `U`) : un reveal partagé par uniformes
   globaux est naturel, sans matériau par objet.
4. **[fait] On a retiré tous les `discard` des shaders de surface en passe 2** (gain ≈ 6 ms : le `discard` coupait l'early-z).
   Un reveal par `discard` partout les ferait revenir. Pistes : variante de matériau « occludable » uniquement sur les
   pièces taguées (le coût early-z ne touche que ces draws), **alpha-to-coverage** (MSAA 4× actif → seulement 4 niveaux,
   donc à coupler à un tramage), ou blending (tri et écriture de profondeur : à éviter).
5. **[fait] L'alpha de la scène est le masque de protection DOF / in-scatter** (`1 − protection`, lu par le DOF et l'air).
   Tout reveal qui écrit un alpha ≠ 1 (alpha-to-coverage, blending) entre en conflit avec ce masque. **[?]** à résoudre
   avant de choisir la technique.
6. **[fait] Le reflet du canal rend les mêmes matériaux** (passe miroir, drapeau `uClipY > −100`). Le reveal doit être coupé dans
   cette passe (sinon reflets incohérents), et ne pas toucher le rendu d'ombre de lune (matériau de remplacement).
7. **[fait → risque majeur] Le bake de visibilité ne compte que ce qui est vu en premier.** Ce qui se trouve *derrière* un
   occludeur n'est jamais compté visible, donc peut être classé Tier 3 et **supprimé** ; les murs arrière ne sont de toute façon
   pas générés. Percer un trou dans un occludeur montrerait alors de la géométrie manquante (intérieurs creux). Le bake devra
   inclure une **couche « derrière les occludables »** (second rendu d'identifiants sans les pièces occludables, depuis les poses
   utiles). Conséquence : une partie du gain de la passe 2 peut être rendue ; **à remesurer**.
8. **[fait → risque majeur] Profondeur et sprites.** Le joueur est un billboard testé en profondeur ; la superposition à 55 %
   (`overlay`) utilise `LessEqual`. Si l'occludeur écrit sa profondeur dans la zone révélée, le joueur situé derrière est
   rejeté par le test de profondeur : **le reveal doit aussi empêcher l'écriture de profondeur** dans la région révélée (donc
   `discard` / couverture), pas seulement baisser l'alpha. À coordonner avec la reprise du `SpriteRenderer` (point 1 de
   « À reprendre ») : les deux chantiers touchent le même ordre de rendu.
9. **[fait] Ordre dans `App.update`** : acteurs → `graph.update` → ensemble visible → sprites. L'occlusion doit se calculer
   **après** `graph.update` (pose finale de l'image, y compris en transition) et avec l'échelle des personnages courante
   (×1,00 / ×1,12 / ×1,15) pour la taille apparente.
10. **[?] Occludeurs probables (à inventorier, pas à deviner)** : lampadaires du quai (z = 4,15), bateau (coque, mât, bannière
    fleur de lys vers (1,6 ; 2,6–4,5 ; 6,35)), toile/auvent de l'étal héros, enseignes et auvents de façades, bannières, chevalets
    de la barrière, poteaux/linteau du porche de la forge vus depuis C. Les bâtiments occultent rarement (le joueur est sur le
    quai devant les façades), sauf joueur sous un porche ou dans la baie. Petits props (barils, caisses, bornes) : ignorés
    comme demandé.

### Conception candidate (hypothèses)

- **Détection (CPU, cadencée)** : test segment caméra → cible (torse ≈ `pos + 0,5 × hauteur × échelle`) contre des **volumes
  proxy** (AABB/capsules) des pièces taguées, pas contre les maillages. Quelques dizaines de volumes, coût négligeable.
  Sortie : un état cible par pièce, avec fondu (entrée 150–250 ms, sortie 200–350 ms) et hystérésis (entrée immédiate, sortie
  retardée + marge spatiale). Le fondu par pièce passe au shader par une petite texture/tableau indexé par identifiant de pièce.
- **Shader (partagé)** : pour un fragment d'une pièce taguée : masque ellipse en pixels autour de la projection du joueur,
  rayons ≈ 45–70 (intérieur) / 80–120 (bord) px à 1080p, mis à l'échelle par la résolution interne et par la hauteur
  apparente du sprite. **Test de profondeur** : seuls les fragments plus proches de la caméra que le joueur (marge) sont
  concernés, ce qui limite naturellement le reveal au chemin caméra → joueur sans rien ajouter.
- **Rendu du dissolve** : à choisir par captures comparatives A / B / C. **[?] Favori : B ou C avec tramage aligné sur la grille
  de pixels du rendu interne** (cohérent avec les sprites calés sur la grille), sans bruit temporel (pas de scintillement) ;
  le doux (A) seulement au centre.
- **Plomberie** : attribut de pièce sur les géométries occludables (0 draw call en plus, quelques octets par sommet) plutôt
  que de séparer des maillages (draw calls en plus). Props instanciés : variante de matériau par prototype.
- **Debug** : `occ=0` (désactive), `occdebug=1` (surligne les pièces occludables actives), compteurs dans `__stats()` et le panneau
  (`active`, `parts`, `tests`, `ms`).

### Plan par étapes (ordre proposé)

0. **Inventaire empirique** des occludeurs : lancer des rayons depuis des poses échantillonnées du graphe vers une grille de
   positions du joueur sur le quai, lister les pièces réellement traversées. On ne tague que ça.
1. Métadonnées + plomberie **sans effet visuel** (reveal = 0) → image **pixel-identique** (`static=1`, `diff.mjs`).
2. Détection CPU + états + fondus + stats ; test avec `walk.mjs` (journal par image des états).
3. Shader reveal en trois variantes A/B/C + captures comparatives (zoom pixel) → choix documenté ici.
4. Couche « derrière les occludables » dans le bake + contrôle `vis=0` vs défaut avec reveal forcé (aucun trou).
5. Transitions : `blend=A,B,0.5`, `blend=B,C,0.5` et marche réelle ; aucun saut d'état entre images.
6. Perf entrelacée avant/après (minuteurs GPU, baseline figée) : GPU ms, draw calls, occludeurs actifs.
7. Mise à jour de ce journal (réussites **et** échecs).

### Critères d'acceptation mesurables (à confirmer)

- Reveal désactivé ou aucun occludeur → image identique au pixel près (`static=1`).
- Aucune géométrie manquante dans la zone révélée (diff `vis=0` / défaut avec reveal forcé).
- Fondus sans saut (journal par image), y compris pendant un blend de caméra.
- Perf : « négligeable » **à définir avec l'utilisateur** ; proposition : ≤ +2 % du temps GPU (≈ 0,7 ms) et **+0 draw call**
  (tolérance +N à justifier).

### Décisions à valider avant de coder

- Résolution de référence des rayons en pixels : 1080p interne ? (et mise à l'échelle sur la résolution réelle).
- Joueur seul, ou aussi la **cible d'interaction** (PNJ) ? La demande ne parle que du joueur.
- Faire cette tâche **avant ou en même temps que** la reprise du `SpriteRenderer` (profondeur / ordre de rendu partagés).
- Le reflet du canal doit-il montrer l'occludeur entier (hypothèse retenue) ?
- Seuil de « négligeable » (voir ci-dessus).

### Leçons déjà acquises qui s'appliquent

- Pas de `discard` global (early-z) ; mesurer **entrelacé** avec minuteurs GPU, jamais d'une session à l'autre.
- Toute coupe/ajout de géométrie ou de masque se prouve par un diff `static=1`.
- Ne consommer aucun tirage aléatoire de plus ni de moins (déterminisme par graine).
- Ne pas ajouter de contenu : on étiquette l'existant, on ne le multiplie pas.

---

## Passe 3b — Player Occlusion Reveal : implémentation (non commitée, à la demande de l'utilisateur)

Décisions verrouillées par la demande : joueur seul ; 1080p = résolution de référence des rayons (mise à l'échelle sur la
résolution interne réelle) ; reflet = occludeur entier ; ombres inchangées ; aucun contenu ajouté ; mesurer sans tricher.
Fichiers : `src/app/Occlusion.ts` (neuf), `ShaderChunks.ts` (`occReveal`), `MaterialLibrary.occVariant`, `MerchantDistrictGenerator`
(registre, découpe des meshes, passe « derrière »), `Visibility.ts` (passe derrière), `App.ts`, `DebugPanel`, outils
`tools/occ-inventory.mjs`, `tools/occ-compare.mjs`, `walk.mjs` (fondus). Images : `screenshots/calibration/occlusion/`.

### 3b.0 Inventaire empirique des occludeurs (étape 0)

`tools/occ-inventory.mjs` : pour une grille de positions du joueur sur le quai (813 rayons : 1 m × 0,75 m, positions dans
un collider exclues) et la pose que le graphe utiliserait là (cadrage réglé + poses de fondu A↔B / B↔C à 0,25 / 0,5 / 0,75),
trace caméra → point du joueur contre **tous** les triangles rendus (maillages fusionnés, instances développées) et regroupe les
touches. Trois hauteurs : torse (0,55 h), tête (0,9 h), jambes (0,2 h). JSON bruts dans `calibration/occlusion/inventory-*.json`.

| Rayon | Bloqués | Ce qui bloque (cases de grille touchées) |
|---|---|---|
| torse | 83 / 813 (10,2 %) | **bannière du bateau** (21+16+5+5), **lampadaire x=0** (8+1), x=−18 (5+3), x=9 (3), **mât** (5+4) ; planches / pierre de la forge : une seule case chacune |
| tête | 94 / 813 (11,6 %) | bannière (33+21+2), lampadaires x=0 (8+4), x=−18 (2+2), x=9 (2), mât (5), **voile roulée** (3+2) ; poteaux / pierre de la forge : **une seule case** (13,5 ; −3,2) |
| jambes | 91 / 813 (11,2 %) | bannière, mât, lampadaires (pied), **petits props** (caisses, barils, bornes : ≤ 4 cases chacun), accessoires de forge à y ≈ 0,5 |

- **[OK] Ensemble retenu (9 occludeurs)** : `boat-banner` (bannière fleur de lys), `boat-rig` (mât + vergue + voile
  roulée, pièce locale n°1 de `boat()`), et les 7 lampadaires du quai (prototype instancié `lampPost#0`, un occludeur par instance).
- **[OK] Rejetés, avec preuve** : coque du bateau (**0** touche : son plat-bord est sous la ligne de visée caméra → torse) ;
  façades / toits / balcons (**0** touche : le joueur est devant les façades) ; barils, caisses, bornes, accessoires de
  forge bas (n'apparaissent qu'au rayon « jambes », ≤ 4 cases, petits : le brief les exclut) ; porche de la forge (une seule
  case, joueur collé au mur nord : **[?]** à revoir si la zone C est retravaillée) ; étal héros (cloth/caisses : 2–3 cases sur la
  rangée z = −3,2) ; lanternes murales (1 case) ; planches x = 10,3 z = −1,77 (le joueur y est *dans* la planche).
- **[KO → corrigé] Premier lancement trompeur** : après une édition PowerShell du script (regex sur des fins de ligne CRLF), la
  fermeture `}, FRAC)` a disparu : le script a rendu « 0 rayon bloqué » pour les trois hauteurs, y compris le torse qui en donnait 83.
  **Pensée** : un résultat « 0 » doit être recoupé avec une valeur connue avant d'être cru.
- **Pensée** : la liste « probable » du journal (étal, auvents, façades, forge, bannières) était fausse aux trois quarts. Le
  mesuré donne un ensemble plus petit et différent (aucun auvent de façade, aucune façade).

### 3b.1 Plomberie (étape 1)

- **[OK] Identité = les parties de visibilité de la passe 2.** Les occludeurs statiques sont enregistrés comme parties
  (`kind:'occluder'`) via `registerOcc` ; `addRanged` sort leurs triangles de chaque slot vers un mesh `occ:static:<slot>` dont les
  sommets portent `aOcc` (indice d'occludeur). Aucun RNG consommé (3 graines comparées : 1842, 7719, 30417).
- **[OK] Variantes de matériau, pas de matériau par objet** : `MaterialLibrary.occVariant(slot, instanced)` ajoute `#define OCC` /
  `OCC_INST` au même programme et **partage les uniformes** du matériau de slot par référence. Les lampadaires instanciés
  reprennent leurs draws existants (seul le matériau change : indice = `uOccBase + gl_InstanceID`).
- **[KO → OK] Première version : +6 appels de dessin en permanence** (3 meshes `occ:*` × passe principale + passe miroir, même sans
  reveal). Corrigé : les triangles occludables sont aussi copiés en **préfixe** du mesh principal
  `[occludable | toujours | pasC | seulA]` ; au repos le `drawRange` part de 0 (le mesh principal les dessine) et les meshes `occ:*` sont
  `visible=false` ; pendant un reveal le `drawRange` commence après le préfixe et les meshes `occ:*` (variante) prennent le relais.
  Résultat : **repos = 108 appels = Pass 2 ; reveal actif = 114** (+3 × 2 passes).
- **[OK] Pixel-identique quand inactif** (`static=1`, `diff.mjs`, seuil 2) : `occ=0` vs baseline gelée (worktree du commit `e43620b`,
  port 5174) sur A, B, C : **0 pixel, écart max 0** ; système actif mais au repos (positions sans occludeur) : B, B', C, graines
  7719 et 30417 : **0 pixel, max 0** ; appels de dessin 99 = 99.
- Le reveal n'existe que dans `occReveal()` : variante liée **uniquement pendant qu'un fondu est > 0** ; le reste du temps, aucun
  `discard` nulle part (early-z Pass 2 intact). Ignoré dans la passe miroir (`uClipY`), ombres inchangées (matériau de
  remplacement), alpha toujours 1 (le masque de protection DOF / in-scatter n'est pas touché).

### 3b.2 Détection et état temporel (étapes 2-3)

- **[OK]** Après `CameraGraph.update` (pose finale, y compris en fondu) : segment caméra → torse (`pos.y + 0,55 × h × échelle`)
  contre des boîtes proxy **voxélisées (0,5 m) depuis les vrais sommets** (banderole : 15 boîtes, mât : 17, lampadaire : 14–22).
  9 tests / image, **≈ 0,01–0,02 ms** CPU. Plusieurs occludeurs simultanés (ex. mât + bannière).
- Fondu entrée 0,2 s / sortie 0,3 s, délai de relâchement 0,25 s, rayon de test 0,35 m à l'entrée et 0,5 m tant qu'actif.
- **[KO → OK] Rayon d'entrée 0,22 m trop juste** : en B et BC le mât (fin) restait devant le bras du joueur sans déclencher.
  Relevé à 0,35 / 0,5 m (demi-largeur du sprite). Faux positifs sans effet : seuls les fragments **≥ 0,35 m plus proches que le
  joueur** sont découpés (test de profondeur de vue dans le shader).
- **[OK] Validé en simulation (pas fixe 1/60 s, vraie `graph.update`, joueur à 2,5 m/s)** : A→B (lampadaire −18), B→C→B aller et retour (bannière,
  mât, lampadaires 0 et 9) : **0 inversion de fondu** (donc 0 clignotement), pas de fondu max 0,083/image à 60 Hz, saut max du centre du reveal
  3–4,5 px/image (= le déplacement du joueur), variation du rayon ≤ 0,67 px/image pendant un fondu de caméra. Marche réelle
  (`walk.mjs`, touche d, 20 fps headless) : 0 inversion, saut du centre ≤ 8 px/image.
- **[?]** La marche réelle avec les touches de `walk.mjs` ne franchit pas A→B (le joueur glisse contre le collider du lampadaire x=−9) :
  la transition A↔B n'est testée qu'en simulation + image figée (`blend=A,B,0.5`).

### 3b.3 Reveal écran et choix du style (étapes 4-6)

- **[OK] Ellipse locale** centrée sur la projection du torse (arrondie au pixel), demi-axes d'après la hauteur apparente du sprite
  rapportée à 1080p : intérieur 40–70 px, extérieur 80–120 px (rapport k = 1,7–1,8), `rx = 0,8 ry` ; mise à l'échelle par `H/1080`
  (à 1280×720 les axes valent ×0,667). Même fonction (`revealSize`/`playerReveal`) au runtime et dans le bake.
- **[OK] Profondeur / couverture** : `discard` **sur les seuls fragments occludables**, donc couleur *et* profondeur sont retirées : le sprite passe
  son test de profondeur (visible en image : joueur entier derrière la bannière). Le superposé à 55 % (`LessEqual`) reste cohérent : aucune
  modification de `SpriteRenderer` (étape 9 : rien à faire).
- Trois styles, motifs ancrés sur la grille de pixels du rendu interne (aucun bruit temporel : seuil constant par pixel) :
  **A SOFT** bruit IGN 1 px ; **B DITHER** Bayer 4×4 sur blocs de 2 px ; **C HYBRID** bruit fin au cœur, Bayer 2 px sur le bord.
  Captures : `variants-{A,B,C,AB,BC}.png` (4 panneaux : sans reveal / A / B / C, recadrage ×2 au plus proche).
- **Choix : C HYBRID** (défaut). **A** est le moins visible mais son grain fin n'a aucun rapport avec la grille de pixels des sprites et
  se lit comme du bruit sur les grandes surfaces sombres (vergue) ; **B** est cohérent avec les sprites mais le damier 2 px est trop
  lisible sur la vergue et la bannière ; **C** garde le motif pixel-art là où il se dissout (bord) et le grain fin là où il est le moins visible (cœur).
  Choix **esthétique sur images fixes** : **[?]** non jugé en mouvement par un humain (par construction le motif est statique à l'écran :
  il « défile » sur l'objet quand le joueur bouge, il ne scintille pas).
- **Constat inattendu (utile)** : le DOF rend le premier plan flou (bannière, vergue), ce qui adoucit le motif sans rien ajouter ; les pixels du
  joueur (alpha de scène = 0) sortent tôt du DOF (rayon < 0,35 px) et restent nets. Le masque de protection n'a pas bougé.
- **[KO, non essayé] alpha-to-coverage / blending** écartés *par raisonnement, non mesurés* : A2C écrit l'alpha du fragment dans la cible
  (masque de protection DOF / in-scatter corrompu : le bord du reveal serait un anneau net) ; le blending a les problèmes de tri / écriture de profondeur.
- **[OK] Reflet / ombres** : reveal forcé vs `occ=0` (`static=1`) : la zone qui diffère est une boîte locale autour du joueur (ex. B :
  [786,534]-[965,733] sur 1920×1080) ; **aucun pixel d'eau modifié** → le reflet rend l'occludeur entier.

### 3b.4 Visibilité : géométrie derrière un occludeur (étape 7)

- **[OK] Passe « derrière »** : `bakeVisibility` rend aussi, pour chaque pose non miroir, le monde **sans** les parties occludables, en n'identifiant que
  les pixels à l'intérieur de fenêtres de reveal (54 ellipses par pose : joueur ±4 m × 6 rangées z, mêmes formules que le runtime, marge ×1,25).
  Les comptes s'ajoutent à ceux de la passe normale dans `classify` (aucune pièce Tier 3 n'est restaurée « en bloc »).
- **[OK] Preuve** (`static=1`, `occforce=all`, A / B / C / AB / BC) : visibilité active vs `vis=0` avec reveal forcé = **identique** : A 0 px,
  C 0 px, B 17 px, AB 1 px, BC 3 px — **exactement les mêmes écarts que sans reveal** (`occ=0`) : le reveal n'ajoute **aucun** trou.
  `vis-proof-B.png`.
- **[?] La passe « derrière » ne restaure aucune pièce sur la scène actuelle** (`behindParts = 0`, Tier 3 inchangé : 343 / 738, 27 698 triangles). Elle a de
  vrais pixels (stress `?occtest=shopA`, façade rez-de-chaussée occludable : 642 806 px comptés dans les fenêtres, 0 pièce restaurée) ; sans elle
  (`occbehind=0`) l'image est la même. Elle reste une assurance pour de futurs occludeurs (coût ci-dessous), **sa valeur n'est pas démontrée par un cas qui restaure
  quelque chose**.
- **[?] Écart hérité de la passe 2, non causé par le reveal** : 17 px d'une étincelle orange dans le canal (B, joueur 15,5 ; −2,7, x≈1480 y≈622)
  existent avec `vis=0` mais sont coupés par le bake par défaut (même sans reveal). L'écart de la passe 2 (« 0 px sur A/B/C ») était mesuré sur d'autres positions.
  Image : `known-issues/pass2-vis-speck.png`.

### 3b.5 Outils / debug (étape 10)

`?occ=0`, `?occstyle=soft|dither|hybrid`, `?occforce=all|0,2`, `?occdebug=1` (boîtes proxy vertes = éligibles, rouges = actives, ellipses intérieure /
extérieure, liste), `?occbehind=0`, `?occtest=<ids>` (façades occludables : test de contrainte du bake). Panneau : bascule, style, overlay ; ligne
« occlusion … actifs / éligibles … tests … ms » ; `__stats().occlusion`. `occdebug-B.png`. Limite : `OCC_MAX = 16` occludeurs.

### 3b.6 Performance (étape 12)

Minuteurs GPU, variantes **entrelacées** dans une session, contre la copie gelée de la passe 2 (port 5174). **Cette session tournait dans un régime GPU bien plus rapide que la
passe 2 (≈ 10 ms contre 29–47 ms) : ces chiffres ne se comparent pas au tableau 2.5, seulement entre lignes d'une même exécution.** Bruit de mesure observé : ± 0,5 ms (jusqu'à
+ 2 ms sur un échantillon thermique isolé, `perf-run2` A, tour 3).

| Cas (exécution) | Base Pass 2 | Nouveau | Δ | Appels |
|---|---|---|---|---|
| B repos, joueur 2 ; −1,2 (3 tours) | 11,60 ms | 11,16 ms | −0,44 (bruit) | 108 → **108** |
| B reveal hybride (3 tours) | 10,96 | 10,55 (occ=0 : 10,87 ; soft 11,12 ; dither 11,03) | −0,41 / +0,16 / +0,07 | 108 → 114 |
| C reveal (3 tours) | 10,70 | 10,79 | +0,09 | 108 → 114 |
| A reveal, lampadaire (5 tours) | 10,30 | 9,77 (occ=0 : 10,07) | −0,53 (bruit) | 108 → 114 |
| BC reveal (5 tours) | 11,71 | 11,96 | **+0,25 (+2,1 %)** | 108 → 114 |

- Passes (B, 3 tours) : reflet 0,84→0,88, scène 7,02→6,82, DOF 1,32→1,15, bloom 0,95→0,92, grade 0,29→0,27 ; BC : scène 7,53→7,72.
  Triangles, textures (49, 188 MB), lumières : inchangés. Détection CPU ≈ 0,01–0,02 ms.
- **Verdict** : coût GPU **non distinguable du bruit** (|Δ| ≤ 0,5 ms, pire cas mesuré +0,25 ms ≈ +2,1 %), sous le budget de 0,7 ms / 2 %. Je ne prétends pas à mieux que
  cela : la précision de la machine ne permet pas de dire « 0 ms ». **+0 appel de dessin au repos, +6 (3 meshes × 2 passes) pendant un reveal** (idéal « +0 » atteint hors reveal).
- Régénération (`perf-run2`, même session) : base ≈ 500–515 ms (gen) / bake 125–134 ms ; nouveau par défaut 654–692 ms / 210–225 ms ; `occ=0` ≈ 555 ms / 128 ms.
  Donc la passe « derrière » coûte **≈ +90 ms de bake** et la plomberie (découpe + préfixe des meshes, boîtes proxy) ≈ +40–55 ms ; au total ≈ +150–180 ms à chaque
  régénération. Dans `perf-run1` (avant le préfixe, session plus lente) : gen 1010 ms vs 778 ms.

### 3b.7 Ce qui n'a pas été fait / limites

- **[?]** Jugement visuel en mouvement par un humain ; seules les images fixes et les journaux image par image ont été examinés.
- **[?]** PNJ d'interaction non inclus (joueur seul, demandé) ; l'architecture (tableau de fondus, test segment → boîtes) s'étend à une 2ᵉ cible sans refonte.
- **[?]** Lampadaires : le reveal de caméra A découpe lanterne + fût sur toute l'ellipse (mince objet, grand trou) ; lisible mais à rejuger.
- Le forgeron noyé dans la lueur (halo) n'est **pas** résolu ni touché (point 1 de « À reprendre »).

---

## Passe 4B — Caméra D : plan frontal sur la façade / le district (non commitée, à la demande de l'utilisateur)

Demande : étendre le graphe avec un 4ᵉ cadrage D, **sans toucher C** (le zoom téléobjectif sur la forge) : A → B → C → D, D s'active
après la forge, façade quasi de face, transition C→D 0,8–1,3 s sans « orbite », contrôles stables, retour D→C, bake de visibilité
étendu, ré-inventaire des occludeurs (mesuré, pas deviné), perf contre la passe 3, preuves visuelles. Baseline : worktree gelé de
`b11a84d` servi sur :5174 (`%TEMP%\rpg-base3`, `node node_modules/vite/bin/vite.js --port 5174`). Images : `screenshots/p4b/`
(`evidence/` = les 10 captures demandées + contact sheet `contact-C-CD-D.png` + `walk-CD-sheet.png`, `d-candidates-D1-D2-D3.png`,
`d-refinement-E1-E3.png`, `evidence/occ-inventory/*.json`, `evidence/perf.json`). Fichiers : `CameraGraph.ts`, `Visibility.ts`,
`MerchantDistrictGenerator.ts`, `App.ts` ; outils neufs `tools/camsearch.mjs`, `tools/camsim.mjs`, `tools/visproof.mjs`
(+ `eval.mjs` accepte `BASE_URL`, `occ-inventory.mjs` connaît CD / BD et compte les rayons bloqués par jeu de poses).

### 4B.1 Trouver D empiriquement

- **[KO] Première série de candidats D1/D2/D3 (dist 27–32, fov 26–32, comme un « C reculé »).** Captures noires / fenêtres collées à
  l'écran : la caméra se retrouve **dans les maisons de la rive opposée**. Cause : en vue presque de face, la caméra est à
  `pivot.z + dist·cos(yaw)·cos(pitch)` ≈ 28 m, et `canalRow` pose des maisons à z = 19,8 (rangée 1) et 29,7 (rangée 2) sur tout
  x < 30. A / B / C ne les voient jamais (elles sont derrière la caméra, le bake en classe une partie en `A` seulement) ; une caméra
  frontale les traverse. **Contrainte déduite : z caméra < ~18,5**, donc `dist·cos(yaw)·cos(pitch) ≲ 19,5` → D est un objectif de 20 m /
  fov 36 (D1 −12°, D2 −22°, D3 −32° rejouées à dist 19–21, `d-candidates-D1-D2-D3.png`), **pas** un téléobjectif. Je n'ai pas retiré
  les maisons de la rive opposée (aucune modif d'environnement), je ne les ai juste pas laissées sur le trajet de la caméra.
- Choix de lacet : −12° est plat (presque orthographique, la barrière ne fuit plus), −32° rejoue du « B » ; **−20°** garde une fuite
  nette de la façade vers +x sans multiplier les lignes de perspective. Hauteur/pitch : `d-refinement-E1-E3.png` — pitch 5° ou
  pivot y 2,4 laissent un bas de cadre vide et couronnent les toits ; **pitch 8°, pivot y 3,2** montrent toute la façade, toitures
  comprises, avec le quai en bas.
- **D final** : yaw −20, pitch 8, dist 20, fov 36, shift 0, charScale ×1,12 (B : ×1,12 ; C : ×1,15 ; le joueur fait ≈ 167 px de haut à
  1080p (estimation par la hauteur de cadre : 156 en B, 195 en C) : **pas** agrandi). Pivot : `home [10,8 ; 3,2 ; −1,0]`, `ref [14 ; 1,2]`, `gain [0,85 ; 0,25]`.
  Caméra à z ≤ 18,2 sur tout le quai (marge 1,6 m avant le mur de la rangée 1).

### 4B.2 Zone, hystérésis, ancre

- Zone D : x ≥ 14,0, **tout z**, priorité 3 ; relâchement à 13,1 (marge 0,9 m existante). C est inchangée (x 4,2–13,2, z < 2,4) : C tient
  jusqu'à 14,1 vers l'est, donc **C → D direct** pour qui traverse la cour de la forge. Le forgeron et la zone d'interaction s'arrêtent
  à x ≈ 11,5 ; le flanc est de la forge est à 12,6 : D n'arrive qu'1,4 m après.
- **[?] Découverte : C n'est presque jamais traversée « à la main ».** Dans B/C la touche « droite » pousse en diagonale vers le
  canal (+z) ; le joueur finit collé au bord (z ≈ 4) où la zone C (z < 2,4) n'existe pas. Il faut `w,d` (ou steering) pour marcher à z < 2,4.
  Conséquence : le long du bord de l'eau la transition est **B → D** (jeu `BD` ajouté au graphe et au bake). Je ne force pas C, ce serait
  une modification de comportement de C. À juger avec des vrais joueurs.
- **[KO → OK] Première D : le joueur glissait à l'envers.** Premier pivot de D centré sur le joueur (NDC x −0,08 à l'entrée contre
  +0,36 en C) : pendant C→D le sprite marchait vers la droite mais **dérivait vers la gauche de l'écran jusqu'à −728 px/s** (57 images).
  Cause : le terme `w'·(ndcD − ndcC)` de la transition l'emporte sur la vitesse de marche (~0,1 NDC/s) dès que l'écart dépasse ≈ 0,1.
  Correctif en deux temps : (1) **D est réglé pour que le joueur y entre là où il se tenait en C** (NDC x ≈ +0,35 à x = 14) ;
  (2) **mélange ancré** (`CameraGraph.blendPose`) pour toute transition qui touche D : la pose interpolée est translatée (pivot seul,
  le long du droit / haut de la caméra : profondeur et échelle intactes) jusqu'à ce que le torse du joueur se projette à
  `lerp(NDC dans la source, NDC dans la cible, w)` ; exact aux deux bouts, 2 itérations, ≈ 0 coût. C'est le « point d'ancrage mobile »
  demandé : pas de balancement du joueur par la rotation de 40°, pas de saut. **A/B/C et AB/BC restent des `lerpState` purs.**
  Après correctif : 0 image à l'envers sur C→D.
- **Contrepartie assumée [?]** : dans D le joueur est **toujours à droite du centre** (NDC x +0,35 → +0,68 de x = 14 à 26), jamais à gauche.
  C'est la conséquence directe de la contrainte de continuité avec C (sinon : dérive arrière). Les captures « joueur gauche / centre /
  droite » sont donc x = 14,3 / 20 / 26 (NDC +0,35 / +0,55 / +0,68), pas trois positions d'écran réparties. La forge sort du cadre vers x ≈ 20.
  Ça ne donne pas d'« espace devant » le joueur (vers l'est) : à rejuger visuellement.
- Durée : le plafond du mélange passe de 1,2 à **1,3 s** pour les mélanges touchant D (lacet 38°) : mesuré 1,28 s ; pas de lacet max
  par image 0,96° à 60 Hz (contre 0,53° pour AB, ≤ 0,55° en passe 2) ; 0,37° en marche réelle headless à ~20 fps. **[?]** lacet par image plus
  élevé que le reste du graphe : c'est le prix d'un lacet de 38° en 1,3 s ; à juger en mouvement.

### 4B.3 Contrôles (mesuré avec `tools/camsim.mjs`, vrai `App.update`, pas de 1/60 s)

`camsim` fait marcher le joueur réel (collisions comprises) à pas fixe, sans rendu ; `g=x,z` = joueur qui vise un point en choisissant à
chaque image la combinaison de touches la plus proche sous le **lacet verrouillé**. Note d'outil : les lampadaires du quai (x = 0, 9, 18…, z = 4,15)
sont des colliders : un joueur collé au bord s'y bloque, d'où le steering.

| Scénario | Résultat |
|---|---|
| C→D en maintenant `w,d` | 1 changement (C>D à x = 14,03), 1,28 s, lacet de contrôle **0,000°** de saut tant que la touche est tenue, 0 image à l'envers, NDC joueur 0,13→0,68 |
| D→C en maintenant `a`/`s,a` | D>C à x = 13,07 ; 0 changement de lacet de contrôle ; 0 image à l'envers (bord de l'eau : D>B à 13,09, voir plus haut) |
| A>B>C>D en steering (−12 → 24) | A>B x −8,46 · B>C x 4,24 · C>D x 14,03 ; 0 inversion de cadrage ; saut de contrôle 0 |
| D>C>B>A en steering | D>C x 13,07 · C>B x 3,26 · B>A x −9,41 ; 0 inversion |
| Arrêt en plein C→D | la transition se termine seule en 1,28 s (le temps, pas la distance) ; le lacet de contrôle se resynchronise à l'arrêt |
| Demi-tour pendant C→D | C>D x 14,03 puis D>C x 13,06 (le joueur doit refaire 0,9 m) : **1 inversion** C→D→C, voulue (le joueur a vraiment fait demi-tour) ; mélange interrompu reprend depuis sa pose courante |
| 25 va-et-vient de ±0,3 m autour de x = 14 | **0** inversion (hystérésis) |
| Course (`shift`) contre le flanc de la forge / les lampadaires | 1 transition, saut max du joueur à l'écran au-delà de son propre mouvement ≤ 4 px/image |

- **Images à l'envers hors D (hérité, non touché)** : B→C vers l'ouest 100 images / −254 px/s, B→A 12 images / −131 px/s : transitions de la
  passe 2, laissées telles quelles (« A/B/C inchangés »). D→C : 16 images à −28 px/s au pire (le retard de suivi du pivot, négligeable).
- Steering « droite » maintenu à travers C→D : le joueur reste à la même direction **monde** (verrouillée) ; il se resynchronise sur le
  lacet de D (−20°) au relâchement : la touche « droite » en D est alors ≈ +x pur (en C/B, 0,5 / 0,87 → diagonale vers le canal).
  Ce changement de mapping au relâchement est le comportement existant ; pas de saut de lacet de contrôle en cours de marche.

### 4B.4 Visibilité (le gros chantier de la passe)

- **Le schéma [toujours | pasC | seulA] ne tient plus avec 4 cadrages** (chaque pièce a désormais 4+ combinaisons de besoins).
  Remplacé par un **masque de besoin sur 8 jeux** de poses (A, B, C, D, AB, BC, CD, BD) : une pièce = les jeux qui la montrent ; une
  classe = un masque distinct (41 classes sur la graine 1842). Chaque mesh statique range ses triangles classe par classe ; un cadrage
  ou un mélange dessine **le préfixe de classes** jusqu'à la dernière dont il a besoin (`levelOf`) : toujours un seul `drawRange`, **+0
  appel de dessin**, le préfixe d'occludeurs de la passe 3 reste valable (début à 0).
- **Ordre des classes : `planDraw`** minimise la somme (pondérée) des triangles dessinés sur les 8 configurations (4 cadrages + 4 mélanges) :
  recherche exhaustive si ≤ 8 classes, sinon recherche locale déterministe (4 départs, déplacements d'une classe). Vérifié hors ligne :
  60 départs aléatoires ne font pas mieux ; borne inférieure « chacun dessine exactement ce dont il a besoin » = 649 k, atteint 712 k (poids
  égaux) / 1,13 M pondéré.
- **[KO → OK] Poids égaux = régression de A/B.** Sans pondération : A 100,7 k (+8,5 % contre 92,8 k), B 95,2 k (+3,6 % contre 91,9 k), C 63,1 k, D 79,3 k.
  Pondération ×2 sur A/B/C et leurs mélanges : **A 91,6 k, B 84,2 k, C 63,1 k (tous ≤ passe 3 : 92,8 / 91,9 / 72,9 k)** mais D 98,8 k, CD 100,1 k,
  BD 100,8 k (≈ « tout »). Il n'existe que ces deux points de Pareto sur cette scène (testé poids 1,1 / 1,25 / 1,5 / 2 / 3). **Choix : poids ×2** (critère « A/B/C inchangés »,
  C **−13 %** de triangles par bonus) ; D ne bénéficie presque pas du culling (98,8 k sur 100,8 k gardés) — mesuré, voir perf : sans effet visible sur le temps GPU.
- **Jeux séparés pour les mélanges** (avant : un jeu de mélange comptait pour les **deux** cadrages d'extrémité, donc une pièce vue
  seulement pendant BC était dessinée en C stable). Désormais un cadrage stable dessine ce que ses poses stables montrent ; un mélange
  ajoute ses propres pièces. Corollaire : C pèse moins qu'en passe 3 alors que le bake est plus large.
- **Échantillonnage** (`samplePoses(walk, aspect)`) : 102 → **273 poses** (A 18, B 26 (−18 : B ne couvre plus x ≥ 14), C 12, D 21, AB 16, BC 12, **CD 78, BD 90**).
  CD / BD : joueur à x ∈ {13,1 ; 14 ; 15 ; 16,5 ; 18} (le foyer traîne derrière le joueur, la caméra a déjà bougé), z représentatifs, poids
  {0 ; 0,2 ; … ; 1} (y compris les extrémités hors zone), poses **ancrées** comme à l'exécution. Une version « économe » (216 poses, x/z/poids réduits) classait
  **321** pièces en Tier 3 au lieu de 317 : 4 pièces visibles seulement depuis les poses supprimées → je garde la version dense (principe : rien de ce qu'un mélange peut montrer n'est coupé).
- **Résultats (graine 1842)** : 738 pièces, **Tier 3 : 343 → 317 (+26 pièces visibles)**, triangles gardés 92 842 → **100 788 (+7 946, +8,6 %)**, Tier 3
  27 698 → 19 752 triangles. Triangles par configuration : A 91,6 k · B 84,2 k · C 63,1 k · D 98,8 k · AB 91,6 k · BC 84,6 k · CD 100,1 k · BD 100,8 k.
  Les pièces rendues visibles par D sont surtout des murs latéraux (est / ouest) de 	all, 	avern, east1–3, gE0/1, g4 et un toit de la ville haute (liste par masque relevée à la main sur la graine 1842, non exhaustive) ; **rien n'a été ajouté** ni restauré à la main.
- **Coût du bake / régénération** (même session, entrelacé) : bake GPU **≈ 195–202 → 322–338 ms (+≈ 130 ms)**, régénération totale **505–523 → 682–715 ms (+≈ 180 ms)**.
  **[?]** le coût de régénération double presque par rapport à la passe 1 ; la piste « ne ré-échantillonner que les poses touchées » (À reprendre n° 3) devient plus utile.
- **Preuve (`tools/visproof.mjs`, élagué vs `vis=0`, même session, `static=1`, seuil 2/255)** : stables A, B (2), C (2), D (6 positions dont fond de quai z = −2,8 et x = 26),
  mélanges CD (7 poses, 25/50/75 %, x = 13,1 à 19), BD (3 poses), BC, AB : **0 px** partout, sauf **D à (26 ; 3,5) : 1 px (écart 19) en (1244 ; 185)**
  — **[?]** non élucidé (1 pixel ; probablement une étincelle/particule chaude comme `known-issues/pass2-vis-speck.png`). Autre écart apparent : B (−4,6 ; 0,6)
  **1 377 px** *avec* le reveal ; **0 px avec `occ=0`** et 1 280 px identiques sur la baseline gelée de la passe 3 : c'est la phase du fondu de reveal entre deux
  régénérations (le lampadaire), pas du culling. **Toujours lancer visproof avec `occ=0`.**
- **A/B/C inchangés (baseline vs nouveau, `static=1`)** : A, B, B bord, C, C bord, AB 50 %, BC 50 %, B forcé à x = 13,5 : **écart max 0–1/255, 0 px au-dessus du seuil 24**.

### 4B.5 Rive opposée / fond

D ne montre pas de trou de fond nouveau : le cadre est rempli par la façade nord (générée à plein détail) ; en haut à gauche on voit la ville haute déjà présente.
**Aucun bâtiment ajouté.** Aucun module de fond, aucune brume ajoutée. Les maisons de la rive opposée restent derrière la caméra de D (voir 4B.1).

### 4B.6 Ré-inventaire des occludeurs (mesuré : `tools/occ-inventory.mjs`, 1 092 rayons : poses C, CD 0,25 / 0,5 / 0,75, D, BD, + A/AB/B/BC)

| Rayon | Bloqués (tous jeux) | D stable | CD (225 rayons) | BD (54) |
|---|---|---|---|---|
| torse (0,55 h) | 108 (9,9 %) | **2 / 118** | 29 | 2 |
| tête (0,9 h) | 122 (11,2 %) | 3 / 118 | 35 | 2 |
| jambes (0,2 h) | 117 (10,7 %) | 4 / 118 | 27 | 6 |

(passe 3 : 813 rayons, 10,2 % au torse.) **Conservés** : `boat-banner`, `boat-rig`, 7 lampadaires (9 au total) — la bannière bloque pendant CD jusqu'à x = 19,5 et le lampadaire
x = 18 est le **seul** bloqueur du D stable (2 cases). **Candidats mesurés et rejetés (0 ajouté)** : bannière de façade (x = 15,4 ; y 1,9 ; z = −3,15) et auvents / toiles
de façade (x 14,5–25,5, z = −3,15) : 1–4 cases, **uniquement** à z = −3,2 (joueur collé au mur), tête seulement ; tonneaux x = 17,5 et bornes x = 16,5–17,5 : jambes seulement,
≤ 4 cases ; planches / pierre / poutres du flanc est de la forge (x = 12,5–13,5, z = −3,2) : 1–5 cases, joueur collé au mur, aucune en D ; piliers de forge : 0.
**Aucune façade ni enseigne en D ne cache le joueur.** `OCC_MAX` inchangé, table inchangée.
- **Validation C↔D (camsim, reveals réels)** : `lampadaire 9`, `18`, `boat-banner`, `boat-rig` : **0 inversion de fondu** (0 clignotement) sur tous les scénarios (traversées A↔D, demi-tours, arrêt),
  pas de fondu max 0,083/image, saut du centre du reveal au-delà du déplacement du joueur ≤ 4,1 px/image. Marche réelle (`walk.mjs`, ~20 fps) : 0 inversion, saut du centre ≤ 4,0 px. Capture `10-D-occdebug.png` :
  le lampadaire x = 18 est dissous autour du joueur, joueur entier visible, boîtes proxy rouges au bon endroit. `behindParts` toujours 0 (la passe « derrière » ne restaure toujours rien : **[?]** inchangé).
  Aucune trouée de Tier 3 visible (visproof avec reveal forcé non rejoué sur D : **[?]**, mais les fenêtres de la passe derrière couvrent maintenant les poses CD / BD / D : `player` est fourni à chaque pose).

### 4B.7 Performance (même session, entrelacé, 3 tours, minuteurs GPU, 1080p, `static=1`)

| Cas | Passe 3 | Passe 4B | Δ | Triangles (3 → 4B) | Appels |
|---|---|---|---|---|---|
| A | 8,26 ms | 8,27 | +0,01 | 227,2 k → 224,6 k | 99 = 99 |
| B | 9,07 | 9,14 | +0,07 | 225,2 k → **209,9 k** | 105 = 105 |
| C | 9,13 | 9,01 | −0,12 | 187,3 k → **167,7 k** | 99 = 99 |
| CD 50 % | — | 9,10 | — | — → 241,6 k | 99 |
| D (même pose servie par la baseline en « B » surchargé) | 8,82 | 8,67 | −0,15 | 236,0 k → 239,0 k | 99 = 99 |

Passes (4B) : C reflet 0,75 / scène 5,83 / DOF 0,94 / bloom 0,77 ; CD reflet 0,77 / scène 5,89 / DOF 0,91 / bloom 0,79 ; D reflet 0,73 / scène 5,48 / DOF 0,77 / bloom 0,93 (grade ≈ 0,27–0,30, air ≈ 0,45).
Le bruit de la machine est ≈ ±0,3–0,5 ms (cf. passe 3b) : **aucune différence distinguable du bruit**, y compris pour D qui dessine presque tout. Pièces visibles (parts − Tier 3) : 395 → 421.
CD est un peu plus lourd (+≈ 0,1 ms, + triangles) mais dans le bruit. **[?]** Je n'ai pas mesuré CD contre une baseline équivalente (elle n'a pas de D) ni D en conditions thermiques « chaudes ».

### 4B.8 Ce qui n'a pas été fait / limites

- **[?]** Jugement humain en mouvement : tout est mesuré par journaux par image et captures fixes, pas par un joueur.
- **[?]** Le D « joueur à droite » (voir 4B.2) : à rejuger. Non testé : tolérer une dérive arrière de |ΔNDC| ≲ 0,08 pendant la transition (permettrait d'entrer en D un peu plus à gauche, pas « à gauche »). Décaler la zone D vers l'est n'aide pas : le NDC de C croît avec x.
- **[?]** B → D le long du bord de l'eau (jamais de C). Si on veut « A → B → C → D » strict, il faudrait que C couvre aussi z > 2,4 (changement de comportement de C : non fait).
- **[?]** Pas d'édition d'environnement. Pas de défaut de construction exposé par D à l'œil (façades est des maisons visibles de face : OK).
- **[?]** Régénération +180 ms ; le panneau de debug n'expose pas D (le sélecteur de cadrage la liste via `CAM_IDS`, non testé à la main).

### 4B.9 Erreurs de méthode / d'outillage (pour ne pas les refaire)

- **[KO] Incident : `node_modules` du projet vidé.** Le worktree de baseline avait un `node_modules` en **jonction** vers celui du projet ; `git worktree remove --force`
  a suivi la jonction et supprimé le contenu réel (typescript, three, vite, `.bin`…). Réparé par `npm ci` (74 paquets, lockfile inchangé) **après avoir arrêté les deux serveurs
  Vite du projet** qui verrouillaient des fichiers (réinstallation refusée par l'OS tant qu'ils tournaient), puis redémarrage de `npm run dev`. Règle : avant de supprimer un worktree,
  retirer la jonction avec `cmd /c rmdir <worktree>\node_modules` (supprime le lien seul), ou ne jamais lier `node_modules` et lancer vite depuis le worktree avec une copie.
- **[KO] Troncature d'un fichier d'outil** (`occ-inventory.mjs`) par un `Set-Content` d'une variable nulle après une erreur d'indice : restauré par `git checkout`, réédité avec l'outil d'édition.
  Ne pas enchaîner `Substring` et écriture sans vérifier l'index ; fichiers CRLF : les `.Replace` multi-lignes PowerShell échouent, utiliser l'outil d'édition.
- `tools/diff.mjs a b $null 2` : un argument `$null` est supprimé par PowerShell, le seuil `2` est devenu le nom du fichier de sortie (un PNG nommé `2` à la racine, supprimé) et le seuil restait 24.

---

## Passe 4A-0A — Préparation du Character Art Toolchain (branche `character-art-toolchain-1`, base `d7c439b`, outillage seul)

Demande : préparer le dépôt pour un futur pipeline de personnages Aseprite-first (Opus / Devin → Aseprite AI Artist → édition au pixel →
review / fix → animation → atlas → Character Lab Three.js), **sans installer Aseprite, sans commencer la production 4A, sans toucher à la scène**.
Principe posé : *maximiser la complexité perçue en minimisant la complexité runtime* ; les outils externes ne sont jamais des dépendances runtime.
Base vérifiée : `main` = `d7c439b3b08280d7643d8cfe3f658de6ad49b928` (Pass 4B, caméra D), arbre propre ; branche créée depuis ce SHA.
Images / preuves : `screenshots/4a-0a/` (`lab-synthetic.png`, `lab-filter-comparison.png`, `contact-synthetic.png`, `lab-selftest.json`,
`runtime-scale-validation.json`). Docs : `art-lab/README.md`, `art-lab/characters/README.md`, `art-lab/characters/reference/README.md`.

### 4A-0A.1 Ce qui existe maintenant

- **[OK] Squelette `art-lab/`** : `characters/{reference/{A-runtime-baseline,B-runtime-quality-targets,C-sprite-quality},source,exports,reviews,smoke-test,manifests}`
  (`.gitkeep`), README de pipeline (références → brief → silhouette → Aseprite → palette → critique → corrections → animation → export → métadonnées → Lab → validation runtime),
  taxonomie A/B/C/D à autorité inégale, 19 portes de qualité (dont « le personnage doit augmenter la valeur de production perçue du district »),
  note d'architecture des PNJ génériques (famille → variation contrôlée → nettoyage artistique → sprite cuit). Aucune image de référence commitée.
- **[OK] Provenance** : `manifest.example.json` + `tools/art-lab/validate-manifest.mjs` (`npm run art:validate`). Contrat : `approved: true` exige statut `approved` + `approval {by, date}` ;
  `runtimeUse: production` exige `approved: true` ; fichiers requis dès `experimental` ; clés inconnues refusées ; sources / exports **orphelins** (sans manifeste) signalés.
  Testé sur un dépôt factice : 9 cas invalides rejetés (approuvé sans approbation, production non approuvée, clé inconnue, fichier manquant, mauvais nom de fichier,
  chemin à antislash, statut/approved incohérents, id dupliqué, JSON cassé), 1 manifeste complet accepté, 1 export orphelin signalé.
- **[OK] `npm run art:doctor`** (`tools/art-lab/doctor.mjs`, lecture seule, `--json`) : Node, dépôt, Art Lab, Aseprite, AI Artist. Sortie réelle ici : `Aseprite ... NOT INSTALLED`,
  `Aseprite AI Artist ... NOT CONFIGURED`, `READY FOR 4A-0B AFTER ASEPRITE INSTALLATION`, code 0. Jamais de « OK » pour un logiciel absent ni de « validé » (il ne peut pas le prouver).
  Branches vérifiées avec de faux exécutables (`.exe` de test compilés en `%TEMP%`, hors dépôt) : chemin `ASEPRITE_PATH` invalide, fichier ou dossier valide (1.3.14 → « FOUND »),
  1.2.40 → « TOO OLD », bannière illisible → « version unknown », fichier non nommé *aseprite* → jamais exécuté. Détection du câblage agent : seuls les **noms** de fichiers de config sont affichés.
- **[OK] `tools/art-lab/make-contact-sheet.mjs`** (`npm run art:sheet`) : planche de revue étiquetée, plus proche voisin, une ligne par tag, `json-array` / `json-hash` / grille.
  Réutilise Chrome via `puppeteer-core` comme les autres outils (aucune dépendance ajoutée).
- **[OK] Hygiène** : `.gitignore` (exécutables / dossiers d'installation / paquets d'extension Aseprite, sauvegardes et temporaires, câblage agent `.mcp.json` `.cursor/mcp.json` `.codex/` `*.bak-*`, secrets,
  caches) **sans** ignorer les `.aseprite` du projet ; `.gitattributes` (`*.aseprite *.ase *.png binary`). Vérifié avec `git check-ignore` : 29 chemins qui doivent être ignorés le sont, 17 qui ne doivent pas l'être ne le sont pas ;
  aucun fichier suivi n'est devenu « modifié » à cause de `.gitattributes`.
- **[OK] `AGENTS.md`** : principe de production d'art + politique durable (outils externes jamais en dépendance, manifeste approuvé pour tout passage au runtime, sources vs exports) + commandes. **Ne dit pas** qu'Aseprite est validé.

### 4A-0A.2 Character Lab (dev seul) : `character-lab.html` + `src/lab/` (3 modules)

- **[OK] Aller-retour synthétique** : RGBA généré par code → canvas → blob PNG → `<img>` décodée → texture GPU Three.js, comme un fichier sur disque. Page Vite **séparée** que le point d'entrée du jeu n'importe jamais.
- **[OK] Contrat de texture = `SpriteAtlas`** : plus proche voisin, sans mipmaps, clamp, sRGB, alpha droit, fond gris neutre (`bg=neutral|dark|light`), ancre du pied calée sur la grille de pixels.
  Trois vues sur une même ligne de pied : **1x**, **4x nearest**, **échelle runtime** d'un cadrage A/B/C/D ; planche entière avec la trame courante ; lecture des tags ; trames rognées (`spriteSourceSize`).
- **[OK] Auto-test pixel par pixel** (`window.__lab.selfTest()`) : pour chaque pixel de chaque vue, recalcule le texel que le GPU doit échantillonner et compare le tampon d'image au PNG décodé sur le fond ; lit aussi l'état de filtre GL
  auprès du pilote. Résultat 1920×1080 : 1x 1 872 px / 0 écart ; 4x 25 872 px / 0 écart ; runtime B 4,551× 33 304 px / 0 écart (146 pixels exactement sur une frontière de texel écartés) ; filtre `NEAREST / NEAREST`, delta max 0.
- **[OK] Le test peut échouer** (contrôle négatif `&filter=linear`, volontairement faux) : 4x 6 594 écarts (Δ max 182), runtime 8 190 (Δ max 187), 1x 0 écart (attendu : pixel centré). `lab-filter-comparison.png` montre la différence.
- **[OK] Échelle runtime vérifiée contre le jeu** : px écran par texel de sprite à 1080p (joueur à la position de référence du cadrage) **A 2,415 / B 4,551 / C 4,960 / D 4,366**. À 720p le Lab donne 1,610 / 3,034 / 3,306 / 2,910 et le jeu en cours
  d'exécution (`window.__app`, caméra réelle) mesure 1,610 / 3,034 / 3,306 / 2,910 (horizontalement +0,3 %). Non entier à tous les cadrages : des largeurs de texel inégales sont **normales** au runtime et visibles dans cette vue.
- **[OK] Formats d'export** : parseur des deux formes JSON d'Aseprite (`--data … --format json-array|json-hash --list-tags`, forme vérifiée dans la doc CLI d'Aseprite). Une trame rognée (`trimmed`, `spriteSourceSize`, forme `json-hash`) se rend
  **pixel pour pixel comme la version non rognée** (diff 0 px) et passe l'auto-test.
- **[?] La fixture synthétique est écrite à la main** (forme d'un export Aseprite, pas un export réel) : le Lab n'a jamais lu un vrai fichier Aseprite.
- **[?] Limites du Lab** : exactitude à l'écran seulement à zoom navigateur 100 % et DPR entier (l'auto-test lit le tampon, pas l'écran) ; vérifié sur Chrome / ANGLE D3D11 seulement ; l'échelle runtime ignore le DOF, la passe miroir, l'élargissement de fov des fenêtres étroites
  (aspect fixé à 16:9) et suppose le joueur à une position de référence par cadrage (en marchant, la distance caméra-joueur varie). La **règle de taille** (`PIXEL_WORLD × act.scale × charScale` le long de la verticale du billboard) est lue dans le shader de `SpriteRenderer`,
  pas mesurée sur des pixels rendus.

### 4A-0A.3 Recherche amont : `with-pebbly/aseprite-ai-artist` (lue, **rien exécuté**)

- **[OK]** Le paquet npm est **`@pebbly/aseprite-ai-artist`** (dernier observé : **0.8.2**, MIT, `engines.node >=22.6.0`, bin `aseprite-ai-artist`) ; `aseprite-ai-artist` et `@with-pebbly/aseprite-ai-artist` répondent **404**. Version non épinglée dans le dépôt : à épingler à ce que 4A-0B valide.
- Exigences : **Aseprite 1.3+** (API Lua WebSocket absente en 1.2 ; lancer Aseprite une fois), Node ≥ 22.6 (ici 22.14.0). Chaîne : agent –MCP→ serveur –pont 127.0.0.1 (9931 / 9932)→ extension Aseprite. 18 outils MCP, 14 workflows `aseprite:*`
  (`studio` `brief` `concept` `new` `palette` `draw` `shade` `rig` `animate` `tileset` `review` `fix` `export` `submit`), 62 règles de pixel art, critique « à froid » (`pixel-critic`). Clients cités : Claude Code, omp, OpenCode, Codex, Gemini, Cursor, VS Code, Windsurf — **pas** le CLI Devin.
- **Pièges notés pour 4A-0B** : `install --all --agents` modifie des configs utilisateur et ajoute une section à `AGENTS.md` (utiliser `--dry-run` d'abord) ; `aseprite:submit` ouvre une PR publique (ne jamais l'utiliser sur nos assets) ; `install --project` écrit des chemins machine dans le dépôt (d'où le `.gitignore`).
- **[?]** L'auteur écrit lui-même que l'effet de sa boucle critique sur la qualité « n'est pas encore mesuré » : à traiter comme une source de brouillon soumise à nos portes de qualité.

### 4A-0A.4 Preuve que le jeu n'a pas changé

- **[OK] Bundle de production identique à l'octet** : `dist/assets/index-B5BamZwF.js` (818,64 kB) et `dist/index.html`, SHA-256 avant = après (F81B4D7B… / D70DFE4D…) ; `dist` ne contient ni `character-lab.html` ni aucune chaîne `characterLab` / `__lab` / `Aseprite`.
  Le Lab est servi par le serveur de dev seulement (le build ne prend que `index.html`).
- **[OK] Quatre cadrages, seed 1842, `static=1`, `freeze=7.3`, 1920×1080, serveur dédié :5180** : baseline vs après = **0 px de différence (max 0)** en A, B, C et D ; la baseline contre elle-même (A/A2, D/D2) = 0 px, donc le harnais est déterministe.
  Statistiques identiques avant / après : appels de dessin A 99 / B 105 / C 99 / D 99 ; triangles 224 586 / 209 890 / 167 738 / 239 018 ; 44 textures, 188,38 MB, 24 lumières. **0 appel de dessin, 0 texture, 0 géométrie, 0 shader ajoutés au jeu.**
- `npm install` : « 0 vulnérabilités », `package-lock.json` inchangé (git le montrait ` M` à cause de l'horodatage seul ; hash du contenu identique à `HEAD`). Aucune dépendance ajoutée. `npm run typecheck` et `npm run build` OK.

### 4A-0A.5 Ce qui n'est PAS fait / reste inconnu

- **[?] Aseprite n'est pas installé** ; **[?] Aseprite AI Artist n'a jamais été installé ni exécuté** ; **[?] le MCP n'est pas validé**. Le doctor n'a jamais tourné contre un vrai Aseprite :
  `--noinapp --version` (puis repli `--version`) est supposé accepté par toutes les versions 1.3+, **non vérifié**.
- **[?]** Aucun test automatisé dans le dépôt (pas de lanceur) : `art:validate` / `art:doctor` sont des commandes manuelles ; rien ne les lance en CI.
- **[?]** `.gitignore` ignore des configs d'agent de portée projet (`.mcp.json`, `.codex/`, …) : si une config assainie doit être partagée, `git add -f` explicite. `.devin/` n'est pas ignoré.
- Hors périmètre respecté : aucune production de personnage, aucun gold master, aucune amélioration des sprites, aucune expérience PixelLab, aucun changement de caméras / géométrie / éclairage / SpriteRenderer.

### 4A-0A.6 Erreurs de méthode / d'outillage (pour ne pas les refaire)

- **[KO → corrigé] Nom de paquet.** `npm view aseprite-ai-artist` → 404 : le nom GitHub (`with-pebbly/aseprite-ai-artist`) n'est pas le nom npm. Lire le README amont avant de supposer un nom.
- **[KO → corrigé] Premier auto-test : 36 / 132 / 135 écarts**, tous sur une seule ligne de pixels : la ligne-guide du pied (superposition à 35 %) était comptée comme du sprite. Un test de pixels doit masquer ses propres surimpressions.
- **[KO → corrigé] Première échelle runtime fausse** : formule `rendu / (2 · dist · tan(fov/2))` avec la distance du **pivot** ; le joueur est en réalité à 31,1 / 23,5 / 27,8 / 20,9 m de la caméra (A / B / C / D) contre 44 / 26 / 27 / 20 m de pivot, soit +45 % (A) à +11 % (B) d'erreur.
  Mesuré dans le jeu (`window.__app`), puis recalculé avec `CameraGraph.evalAnchor` + `applyPose` : égalité à la 3ᵉ décimale. Dériver une échelle écran du code caméra du jeu, pas d'un paramètre d'auteur.
- **Un test qui passe peut être vide** : « 0 écart » n'a de valeur qu'avec un contrôle négatif qui échoue (filtre linéaire : 6 594 écarts).
- **`git check-ignore -v` affiche aussi les règles de négation** (`!.env.example`) : faux « échec » du test d'hygiène ; vérifier le code de sortie sans `-v` (1 = non ignoré).
- **PowerShell mange le premier `--`** de `npm run x -- --flag` (le shim `npm.ps1`) : npm avale alors `--flag` comme option à lui (`--json` perdu, `--port 5191` → `5191` devient la **racine** de Vite → 404 partout, faux « échec » de `art:lab`).
  Écrire `npm run x '--' --flag` (guillemets) ou appeler `node tools/art-lab/<script>.mjs --flag` ; noté dans `art-lab/README.md` et `AGENTS.md`. Valable aussi pour les anciens `npm run shots -- …`.
- Deux serveurs Vite écoutaient déjà sur :5173 (dont un autre projet, `RPGThreeJS`) : j'ai lancé le mien sur `:5180 --strictPort` pour que la baseline vienne bien de **cet** arbre. Le processus `node` enfant de ce serveur est arrêté en fin de passe.
- Fichiers de travail du Lab en `art-lab/**/tmp/` (ignoré par git, vérifié) puis supprimés ; faux exécutables Aseprite et fixtures de test uniquement dans `%TEMP%`.

## Passe 4A-0B — Intégration d'Aseprite AI Artist et test de fumée (branche `character-art-toolchain-1`, base `51b89b9`, 2026-10-15)

Demande : installer et prouver la chaîne Aseprite → agent → export → Character Lab, **sans** commencer la 4A ni toucher au runtime.
Autorisé par l'opérateur : extension Aseprite, plugin Claude Code en portée **locale**, dépendances strictement nécessaires, pont MCP local,
sprites / exports de test, docs Art Lab + journal ; interdit : `install --all --agents`, PixelLab, soumission publique, personnages de production,
caméras / rendu / gameplay. Agent : Claude Code 2.1.301 (Opus 5.5), qui a aussi mené l'onboarding ci-dessous. Preuves : `art-lab/characters/smoke-test/4a0b/`.

### 4A-0B.0 Onboarding Claude Code (avant la passe, aucune modification du dépôt)

- **[OK]** Claude Code lit `AGENTS.md` nativement (≥ 2.1.277) ; `~/.claude/CLAUDE.md` (principes universels, hors dépôt, ≈ 1,3 k tokens) créé à la demande de l'opérateur.
  Session neuve, `/context` : User 1,2 k + `AGENTS.md` 6 k tokens, chacun **une fois** ; `JOURNAL.md` **non** chargé. Aucun `CLAUDE.md` de projet (décision opérateur).
- **[OK] Piège mesuré** (fixtures en bac à sable, `claude -p`) : un `CLAUDE.md` ou `.claude/CLAUDE.md` dans un dossier **parent** du projet coupe le chargement natif d'`AGENTS.md` ;
  le `~/.claude/CLAUDE.md` utilisateur en est exclu (doc + session réelle dans HD-2D), bien que `C:\Users\<moi>` soit un parent du dépôt.
- `/doctor prompt-audit` : aucun conflit entre `~/.claude/CLAUDE.md` et `AGENTS.md` (une remarque de style sur `AGENTS.md:92-93`, laissée telle quelle).

### 4A-0B.1 Ce qui est installé (rien dans Git)

| Pièce | Version exacte | Où |
|---|---|---|
| Aseprite | 1.3.18.6-x64 (`--noinapp --version` accepté, code 0) | `C:\Program Files\Aseprite` (installé par l'opérateur avant la passe) |
| Extension Lua | aseprite-ai-artist **0.8.2**, `ai-artist.lua` SHA-256 `bdb4d8d8…` | `%APPDATA%\Aseprite\extensions\aseprite-ai-artist` |
| Plugin Claude Code | `aseprite@aseprite-ai-artist` **0.8.2** (MCP 18 outils, 14 skills, 4 agents, 2 hooks) | activé dans `.claude/settings.local.json` (portée **locale**, ignoré par git) |
| Marketplace | `with-pebbly/aseprite-ai-artist#v0.8.2` (commit `5894b12`), `autoUpdate: false` | déclarée en portée locale |

- **[OK] Vérifié avant d'installer** : `npm view` (0.8.2 toujours `latest`, 3 dépendances `ws` / `zod` / `@modelcontextprotocol/sdk`, aucun script d'installation),
  intégrité du tarball = registre (`sha512-blkv8…`), tag `v0.8.2` = npm 0.8.2 (extension, skills, agents, hooks, règles identiques hors fins de ligne), le `dist/` construit
  localement par le lanceur du plugin (`npm ci --ignore-scripts` + `tsc`) = `dist/` publié (hors source maps). Hooks lus : sonde TCP locale + marqueur dans `%TEMP%`.
- **[OK] Dry-runs** : `install-extension --dry-run` n'écrit rien (dossier absent après) ; le code de `install` montre que `install claude` écrirait un serveur **utilisateur**
  dans `~/.claude.json` avec `@latest` (non épinglé, chargé dans tous les projets) et `--agents` ajouterait une section à `AGENTS.md` : **non utilisés**. Pas de serveur MCP autonome (doublon).
- **[OK] Soumission publique bloquée** : `.claude/settings.local.json` → `deny: Skill(aseprite:submit), Bash(gh repo fork:*), Bash(gh pr create:*)` ; vérifié en session neuve :
  « Skill execution blocked by permission rules ». `gh` n'est de toute façon pas installé.
- **[OK] Session neuve dans HD-2D** : hook SessionStart actif, 18 outils `mcp__plugin_aseprite_aseprite__*`, 14 skills `aseprite:*`, 4 agents. Coût permanent ≈ 1,7 k tokens
  (`claude plugin details`), dans ce dépôt seulement. `~/.claude.json` ne contient aucun `mcpServers` (seulement un compteur `pluginUsage`).

### 4A-0B.2 Test de fumée (le vrai aller-retour)

Deux sessions **neuves** `claude -p --model opus` dans le dépôt (la session pilote ne voit pas un plugin installé après son démarrage), consignes et rapports verbatim
dans `smoke-test/4a0b/`. Sprite `smoke-4a0b-v1` : mannequin de test 32×48 RGB, **pas** un personnage.

1. **[OK] Connexion** : `preflight` → `ready: true`, Aseprite 1.3.18.6, extension 0.8.2, `features: draw_batch, recolor, validate, tileset, reference, filmstrip`.
2. **[OK] Création** : palette exacte de 8 entrées, calques `body` / `markers`, `colorsSnapped: []`.
3. **[OK] Pixels exacts** (`read_pixels` / `look ascii`) : valeurs attendues aux coordonnées demandées, ligne opaque la plus basse y = 44 (pied runtime y = 45).
4. **[OK] Modification ciblée** : 2 pixels (yeux), voisins inchangés, `pixelsChanged: 2`.
5. **[OK] Palette / calques** : `sprite_info` conforme, `offPaletteColors: []`. `validate` signale les 4 marqueurs de coin comme « strays » (voulus) ;
   `palette analyze` annonce un « quasi-doublon » transparent / lui-même (**[?]** défaut probable de l'analyseur).
6. **[OK] Animation 4 trames**, 120 ms, tag `test` ; diff entre trames successives 68 px, jamais dans un coin ; pied à y = 44 sur les 4 trames.
   Effet de **ma** consigne : en trames 2 et 4, la ligne y = 29 est vide (1 px entre torse et jambes) ; conforme à la consigne, visible sur la planche.
7. **[OK] Critique + correction fondée sur preuve** — contrôle négatif : session A a planté **un** pixel hors palette (#00ff00, trame 3, (5,20)) ; la session B ne le savait pas.
   `validate` l'a trouvé à l'aveugle (palette + stray + outline), lecture avant → `clear` 1×1 → lecture après ; rien d'autre modifié.
   **[KO] `aseprite:pixel-critic` n'a pas pu voir le sprite** : sa définition d'agent n'accorde que `Read` / `Glob` / `Grep` (aucun outil MCP aseprite) ; il l'a dit lui-même. Revue faite par le skill `aseprite:review` + `validate`.
8. **[OK] Export réel** : `ExportSpriteSheet` d'Aseprite (json-array, `listTags`), planche 128×48, 4 trames non rognées, tag `test` 0–3, calques listés.
   **[?]** L'outil `export` renvoie la taille d'une trame (32×48), pas celle de la planche.
9. **[OK] Character Lab** (1920×1080, Chrome / ANGLE D3D11) : auto-test **réussi** sur A / B / C / D (échelles 2,42 / 4,55 / 4,96 / 4,37), **0 écart** à 1x, 4x et runtime, filtre
   `NEAREST / NEAREST` relu au pilote. **Contrôle négatif** `filter=linear` : **échoue** (4 950 et 6 212 écarts, Δ max 119 / 139). Fixture synthétique : chiffres identiques à 4A-0A (1 872 / 25 872 / 33 304 px).
   Décodage indépendant des 4 trames : coins magenta, pied y = 44, 0 pixel semi-transparent, 0 couleur hors palette, défaut absent de l'export.
10. **[OK] Vérifications** : `art:sheet` (planche de revue 4x dans `reviews/`), manifeste `smoke-4a0b-v1` (`experimental`, `runtimeUse: lab`, `approved: false`, générateur
    aseprite-ai-artist 0.8.2 / claude-opus-5-5) → `art:validate` et `--strict` : 0 erreur ; avant le manifeste, le contrôle d'orphelins signalait bien les 3 fichiers. `npm run typecheck` OK.

### 4A-0B.3 Preuve que le runtime n'a pas changé

- **[OK] Bundle identique à l'octet** : `dist/assets/index-B5BamZwF.js` `f81b4d7b…` et `dist/index.html` `d70dfe4d…` avant = après (= 4A-0A) ; aucune chaîne `characterLab` / `__lab` / `aseprite` / `smoke-4a0b` dans `dist`.
- **[OK] Quatre cadrages** (graine 1842, `static=1`, `freeze=7.3`, 1920×1080, serveur dédié `:5180 --strictPort`) : avant vs après **0 px (max 0)** en A, B, C, D ; A vs A (avant) 0 px.
  Appels de dessin / triangles identiques : A 99 / 224 586, B 105 / 209 890, C 99 / 167 738, D 99 / 239 018.

### 4A-0B.4 Fichiers modifiés (dépôt)

- `tools/art-lab/doctor.mjs` : détecte le plugin Claude Code (portée, ref épinglée, auto-update, version en cache), la version de l'extension Aseprite, signale un plugin hors portée
  locale ou une version extension ≠ plugin ; `~/.claude.json` ne compte que de vrais `mcpServers` (avant : le compteur `pluginUsage` passait pour du « câblage »). Toujours en
  lecture seule, ne dit jamais « validé ». Contrôle négatif sur un faux `HOME` : portée utilisateur + extension 0.8.2 / cache 0.9.0 détectés, `pluginUsage` ignoré.
- `art-lab/README.md` (statut, configuration installée, reproduction, pièges), `art-lab/characters/README.md` (statut), ce journal.
- Nouveaux : `art-lab/characters/{source/smoke-4a0b-v1.aseprite, exports/smoke-4a0b-v1.{png,json}, manifests/smoke-4a0b-v1.manifest.json, reviews/smoke-4a0b-v1-contact.png, smoke-test/4a0b/}`.
- Hors dépôt : extension Aseprite, plugin et marketplace (cache Claude Code), `.claude/settings.local.json` (ignoré). Aucune dépendance npm ajoutée, `package.json` inchangé.

### 4A-0B.5 Ce qui n'est PAS fait / reste ouvert

- **[?]** Non exercés : `studio`, `brief`, `concept`, `shade`, `rig`, `animate`, `tileset`, `fix`, les agents palette / rig / animation, le mode headless ; rien n'est dit de la **qualité** artistique produite.
- **[?]** Critique « à froid » : `pixel-critic` inutilisable tel quel en 0.8.2 (outils manquants). Contournement possible sans toucher à l'amont : une critique lancée par un agent général
  avec la consigne de `pixel-critic`, ou un agent de projet — à décider avant la 4A.
- **[?]** Le Lab n'auto-teste que la première trame du tag ; les autres trames ont été vérifiées par décodage séparé (script hors dépôt), pas par `selfTest()`.
- **[?]** Le manifeste n'accepte que `kind: character` : le mannequin de test y est déclaré comme tel, signalé dans `notes`.

### 4A-0B.6 Erreurs de méthode / d'outillage (pour ne pas les refaire)

- **[KO → corrigé] Aseprite « redémarré » mais pas relancé** : même PID, démarré à 14:54 avant l'installation de l'extension (16:14) → `pluginConnected: false`. Vérifier l'heure de
  démarrage du processus, pas seulement sa présence ; une extension n'est lue qu'au lancement.
- **[KO → contourné] Pont qui meurt avec la session** : le pont lancé par le serveur MCP d'une session `claude -p` (pourtant « détaché ») ne survit pas à la fin de la session sous Windows,
  et l'extension ne re-compose le pont **que si la fenêtre Aseprite a le focus** (minuterie Lua liée à l'UI) ; une session suivante voyait donc `ready: false`. `AppActivate` n'a pas suffi
  (Windows refuse le vol de focus). Correctif : un pont persistant (`dist/cli.js bridge`) lancé une fois, puis Aseprite lancé **après** lui (connexion immédiate au démarrage).
- **[KO → corrigé] Git Bash réécrit les chemins** : `/context` devenait `C:/Program Files/Git/context`, `/art-lab/...` devenait `C:/Program Files/Git/art-lab/...` (le Lab affichait « cannot load »).
  `MSYS_NO_PATHCONV=1` pour tout argument qui commence par `/` ; à l'inverse, avec cette variable, Node ne comprend plus `/c/Users/...` : passer `C:/Users/...`.
- **[KO → corrigé] Imbriquer `claude` depuis une session Claude Code** : désactiver d'abord les variables `CLAUDE*` héritées (identifiants de session, jeton de messagerie), sinon la session fille se croit enfant de la mère.
- Les preuves versionnées ne doivent pas contenir de chemin machine : la racine du dépôt est remplacée par `<repo>` dans les consignes et rapports copiés.

---

## À reprendre (par priorité)

**-1. PROCHAIN : Passe 4A — personnages premium (gold masters)**, **uniquement sur ordre de l'opérateur**. Avant d'y entrer : décider comment faire la critique à froid
(`pixel-critic` 0.8.2 n'a pas les outils MCP, cf. 4A-0B.5) ; lancer Aseprite **après** le pont, ou garder un pont persistant pour les sessions sans surveillance ; refaire le test de fumée
(`smoke-test/4a0b/`) après toute mise à jour d'Aseprite, de l'extension ou du plugin (épinglés en 0.8.2, auto-update coupé).
-0b. **Port 5173** partagé avec un autre projet local et `vite.config.ts` sans `strictPort` : les outils peuvent photographier la mauvaise appli. Servir les baselines sur `:518x --strictPort` ;
  décider avec l'opérateur s'il faut changer le défaut (outillage, pas runtime).

0. **Reveal d'occlusion** (passe 3b) : relecture humaine en mouvement (choix du style C, rayons 40–70 / 80–120 px, fondu 0,2 / 0,3 s) ; décider si les PNJ d'interaction
   doivent entrer dans le reveal ; chercher un cas où la passe « derrière » restaure vraiment des pièces (sinon envisager de la couper pour gagner ≈ 90 ms de bake) ;
   rejouer l'inventaire (`tools/occ-inventory.mjs`) à chaque changement de zones de caméra ou de composition (bateau, lampadaires).
1. **`SpriteRenderer`** (prévu) : remplacer la superposition 55 % par une vraie séparation (passe dédiée ou masque propre)
   pour supprimer l'auréole ; revoir le pas de silhouette/contour ; valider sur des PNJ en mouvement (pas seulement
   des captures figées) et sur la graine 7719 / 30417.
2. **Zones de caméra** : validées par simulation (passe 4B, `tools/camsim.mjs`) mais pas par de vrais joueurs. Points ouverts : (a) D place toujours le joueur
   **à droite** du centre (NDC +0,35 → +0,68) — contrepartie de la continuité avec C ; (b) le long du bord de l'eau (z > 2,4) on passe **B → D** sans jamais
   traverser C ; (c) lacet max 0,96°/image en C↔D (contre ≤ 0,55° ailleurs) ; (d) les transitions B→C vers l'ouest (−254 px/s) et B→A (−131 px/s) font glisser le joueur à
   l'envers à l'écran (héritage de la passe 2, mesuré en 4B, non corrigé).
2b. **Pixel à élucider** : D à (26 ; 3,5), 1 px d'écart (19/255) en (1244 ; 185) entre élagué et `vis=0`.
3. **Coût de régénération** (+250 ms de la passe 2, ≈ +150–180 ms de la passe 3b, **≈ +180 ms de la passe 4B** : 505–523 → 682–715 ms ; bake 200 → 330 ms pour 273 poses) :
   mettre en cache les identifiants par graine, ou n'échantillonner que les poses concernées quand seul un réglage de caméra change ; réduire CD / BD (168 poses sur 273) a coûté 4 pièces de Tier 3 en précision : à ne faire qu'avec une preuve.
3b. **Ordre des classes de dessin** : 41 classes, A/B/C pondérés ×2 (D dessine ≈ tout : 98,8 k / 100,8 k). Si D devient lourd (nouveau contenu), rejouer `planDraw` avec un autre poids ou séparer D dans un mesh à part (+ appels de dessin).
3c. **Rive opposée / z caméra** : la caméra de D doit rester à z < ~18,5 (maisons de la rive opposée dès z = 19,8). Tout cadrage plus reculé exige de retirer ou d'abaisser ces maisons (elles sont aujourd'hui invisibles de A/B/C).
4. **Rendu** : MSAA 4× → test d'un MSAA 2× / FXAA après le travail sur les sprites ; DOF et bloom à demi-résolution.
5. **Autres graines** : le culling a été vérifié au pixel sur la graine 1842 ; refaire le contrôle `vis=0` vs défaut sur
   7719 et 30417 avant de se fier à la visibilité sur toute graine (la passe 3b n'a vérifié que l'identité « reveal au repos vs
   baseline » sur ces graines, pas le culling lui-même).
5b. **Écart hérité** : 17 px d'étincelle dans le canal coupés par le bake (B, joueur 15,5 ; −2,7) — voir `known-issues/pass2-vis-speck.png` ;
   élargir les poses échantillonnées ou comprendre quelle pièce l'émet.
6. **Dette** : l'ancienne rive opposée (`row(...)` en « sec ») rejoue ses tirages sans rien dessiner — à retirer proprement
   une fois qu'on accepte de décaler la ville lointaine d'une graine.

## Principes à garder

- Mesurer d'abord (minuteurs GPU, entrelacé, baseline figée), optimiser ensuite.
- Toute coupe de géométrie se prouve par un diff d'images `static=1`, culling actif vs `vis=0`.
- Ne pas ajouter de contenu pour combler le vide ; dépenser la complexité là où la caméra la perçoit.
- Garder le déterminisme par graine : toute suppression de code doit préserver les tirages aléatoires.
- Un `discard` ne se paie que là où il sert : variante de matériau liée seulement pendant l'effet, sinon le matériau de slot d'origine ;
  « au repos » doit coûter exactement la passe précédente (mêmes appels de dessin, image pixel-identique).
- Ne taguer que ce que l'inventaire mesure (rayons caméra → joueur contre les vrais triangles), jamais ce que l'intuition suggère ;
  un résultat « 0 » d'un outil se recoupe avec une valeur connue avant d'être cru.
- Le DOF et le masque de protection (alpha de scène) sont des contrats : un effet qui écrit de l'alpha ne doit pas toucher ce canal.
- Un nouveau cadrage se cherche **empiriquement** (`tools/camsearch.mjs`) et se valide en **marchant** (`tools/camsim.mjs`) : la vitesse du joueur à l'écran pendant la transition ne doit jamais
  changer de signe par rapport à sa marche ; une transition interpolée entre deux cadrages hérite de l'écart de position écran des deux, d'où l'ancrage (`blendPose`) + un cadrage cible calé sur la sortie du cadrage précédent.
- Une caméra qui recule traverse la géométrie qui est « derrière la caméra » des autres cadrages : vérifier z caméra contre ce qui est généré de ce côté (rive opposée).
- Le besoin d'une pièce se mesure **par jeu de poses** (stables et mélanges séparés) ; mélanger les deux fait dessiner en C stable ce que seul un mélange voit. Pondérer les cadrages historiques pour qu'un nouveau cadrage ne les alourdisse pas.
- Comparer le culling avec `occ=0` : la phase du fondu de reveal entre deux régénérations fabrique de faux écarts (1 377 px sur B).
- Un outil externe de production d'art (Aseprite et son agent) n'est jamais une dépendance de build, d'installation ou de runtime ; une passe d'outillage se prouve par un bundle `dist` identique au SHA-256 et 0 px de différence sur les quatre cadrages.
- Rien d'externe ne devient « canon » en silence : un manifeste de provenance (`art-lab/characters/manifests`) avec approbation nommée et datée est la seule voie vers `runtimeUse: production`. Les `.aseprite` sont des sources, les PNG + JSON des sorties cuites.
- Ne jamais écrire « validé » pour un logiciel qu'on n'a pas exécuté : `art:doctor` affiche l'état réel (`NOT INSTALLED` est un état valide) ; « validé » appartient à un test de bout en bout (4A-0B).
- Un test de preuve doit pouvoir échouer : prévoir un contrôle négatif (Lab : `filter=linear`) avant d'accepter « 0 écart ».
- Une échelle écran se dérive du code caméra du jeu à la position réelle du joueur (`evalAnchor` + `applyPose`), jamais de la distance de pivot d'un cadrage.
- Un outil externe s'installe épinglé (version exacte, tag, auto-update coupé), en portée locale, après lecture de son code d'installation et un dry-run ; jamais avec l'installeur
  « tout-en-un » d'amont s'il écrit hors de cette portée. Une revue d'agent se prouve par un défaut planté qu'elle doit trouver à l'aveugle.
- Le chargement des instructions d'agent se mesure (`/context` dans une session neuve) : jamais de `CLAUDE.md` dans un dossier parent d'un projet qui vit de son `AGENTS.md`.
