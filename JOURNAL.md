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

## Passe 4A — Gold master Merchant District : le portefaix du canal (branche `character-gold-master-4a-1`, base `03ed8a1`, 2026-10-15)

Demande : **un seul** PNJ générique au niveau « gold master » (pas de roster), plus haut que le cast actuel, intégré au runtime, validé par une vraie critique ;
second PNJ important seulement si le premier convainc. Références de l'opérateur, classées ainsi (classement à confirmer par l'opérateur) : image 2 (PNJ raffinés 17-24,
vues 6 faces) = **référence B** ; image 3 (roster illustré, vignette de canal) = **référence C**, support seulement (rendu proche d'Octopath) ; image 1 (« 16 generic
townsfolk ») = **rejetée**. Aucune capture runtime fournie : la référence A, ce sont nos captures. Les images B / C ne sont **pas** stockées dans le dépôt (non autorisé explicitement).
Preuves : `art-lab/characters/reviews/porter-gm-v1/` (progression v1-v9, planche, filmstrip, `critiques.md`), `screenshots/4a/`. Manifeste : `porter-gm-v1` (`candidate`, `approved: false`, `runtimeUse: lab`).

### 4A.1 Choix et méthode

- **Archétype : portefaix du canal** — il vit où se trouve la composition (quai, bateau, étals), le runtime a déjà un `porter` (avant / après au même endroit),
  le sac sur l'épaule donne une silhouette asymétrique, le costume se superpose (lin, gilet de laine, épaulière de cuir, corde, ceinture, molletières), base de la famille Dock Worker.
- **Format inchangé** : 32 × 48, vue de face (`down`), pied ligne 45, plus proche voisin. Le cast actuel : porteur 35 px de haut / 40 couleurs, joueur 41 px / 58 couleurs.
- **Production** : grilles de pixels écrites à la main (texte + légende) et poussées en direct dans Aseprite 1.3.18.6 par le serveur MCP du plugin 0.8.2 (petit client MCP stdio,
  outils `draw` grid / `export` / `validate` / `look`), rendus 8x regardés à chaque itération ; la source de production est `source/porter-gm-v1.aseprite` (calque `porter`, 4 trames, tag `idle`).
  Pas de génération d'image : les ébauches et toutes les corrections sont du pixel délibéré.
- **Aperçu dans la scène (dev seul)** : `?labsprite=<id>&labpos=x,z` (`src/lab/runtimePreview.ts`) remplace en mémoire les cellules `porter/*` de l'atlas par l'export et fige l'acteur face
  caméra ; `labsprite=-` = l'image « avant » au même endroit. Branche `import.meta.env.DEV` dans `main.ts` : **bundle de production identique à l'octet** (vérifié).
- **Critique** : `pixel-critic` ne voit pas le sprite → agent indépendant neuf (lecture seule) avec un dossier de preuves (8x, carte ASCII à coordonnées, captures A / B / C, avant / après,
  atlas du cast, références), **lecture à froid avant la consigne**, puis constats localisés au pixel ; à partir du 2ᵉ passage, vérification des constats précédents.

### 4A.2 Itérations (v1 → v9)

- v1 bloc : lisible mais **trop étroit** à côté du cast, bouche « qui crie », sac le plus lumineux de l'image, bras levé sans structure. v2 : carrure 15 px, tête +1 rang (front sous la visière, nez, moustache, barbe), bras levé construit.
- v3-v4 : sac à « oreille » et col noué ; **[KO → corrigé] paréidolie** : les pixels du pli du sac formaient un visage triste à l'échelle runtime → pli en ligne continue ; chemise / sac / gilet assombris pour rendre le visage focal.
- **Critique 1 (v4) : 5/10**, « pas encore » (sac rectangle dressé, port = salut, costume en bandes horizontales comme le #05 rejeté, regard fixe). v5 : sac couché, sangle diagonale, plissement d'yeux,
  bras gauche décollé, 45 → 39 couleurs ; **[KO]** l'avant-bras traversant le sac le cachait et la manche horizontale lisait comme un bras tendu → v6 : avant-bras le long du sac.
- **Critique 2 (v6) : 6/10**, « proche » (crochet = main-crochet, sangle = signature du héros, tête / sac / bras fondus en une masse chaude, sac collé au bord, prise illogique).
  v7 : tête décalée de 1 px à l'opposé de la charge + colonne séparatrice froide, **poing fermé sur le col noué du sac**, épaule chargée relevée sur une épaulière 4 × 2, sac plus froid et bombé,
  harnais de chanvre, vrai poing sur le crochet ; idle 4 trames ; 31 couleurs.
- **Critique 3 (v7 animé) : 7/10**, critères 1-5 PASS, 6 PARTIEL (tête « brique », avant-bras « bâton », torse droit en ombre ; sourcils en colère → las).
  v8 : coins de tête arrondis, sourcils las, poing 5 px à jointures claires + revers relevé + bras foreshortened, bord de gilet éclairé, harnais arrêté à un nœud de poitrine, 30 couleurs.
- **Vérification (v8) : 8/10**, « proche : boucher 3 trous, baisser le bloc de manche » → **v9 (candidat final)** : trous bouchés (contrôle objectif : 0 pixel transparent enfermé sur les 4 trames),
  manche passée dans l'ombre, bouton en lin (la boucle reste le seul accent chaud), sourcils extérieurs adoucis. v9 n'a pas été re-lu par un agent : ses changements sont les prescriptions du vérificateur + le contrôle objectif.

### 4A.3 Résultat mesuré

- **[OK] Sprite** `porter-gm-v1` : 4 trames (repos 700 / expiration 500 / repos 700 / clignement 160 ms), boîte x 1-30 / y 4-45, **30 couleurs**, 0 pixel semi-transparent,
  `validate` Aseprite **100 « Clean. »** (contour sélectif cohérent), 0 trou ; l'expiration bouge 256 px, le clignement 2 px. SHA-256 (16) : source `d9025da100ff7809`, planche `76bb48f970f0d814`, atlas `e7dcc9dcae86cb0d`.
- **[OK] Character Lab** sur l'export réel : auto-test **0 écart** à 1x / 4x / échelle runtime A 2,42 · B 4,55 · C 4,96 · D 4,37 ; `NEAREST/NEAREST` relu au pilote ; contrôle négatif
  `filter=linear` **échoue** (11 659 / 14 431 écarts). `screenshots/4a/character-lab-*`.
- **[OK] Runtime** (seed 1842, `freeze=7.3`, 1920 × 1080, `:5180 --strictPort`) : A (bord du canal, lampe, ~2,4x), B (flaque de lanterne sur pavés mouillés), C (lampe de la forge) ;
  avant / après au même endroit `screenshots/4a/before-after-{A,B,C}-3x.png`. Lisible aux trois cadrages (casquette, barbe, sac, crochet à 2,4x).
- **[OK] Runtime par défaut inchangé** : quatre cadrages `static=1` **0 px (max 0)** contre la baseline de 4A-0B, mêmes appels de dessin / triangles ; `dist` identique au SHA-256 (`f81b4d7b…`).

### 4A.4 Non résolu / décisions opérateur

- **[?] Décision : style du héros.** Le portefaix suit la référence B (petits yeux modelés, tête ≈ 38 % de la hauteur mais plus étroite que les épaules) ; le joueur reste chibi
  (grands yeux ronds, visage plat) → décalage visible côte à côte (`before-after-C`, `runtime-B`). Les critiques placent la correction côté héros ; à trancher avant de décliner le cast.
- **[?] Approbation** de `porter-gm-v1` (manifeste `candidate`) : rien n'entre au runtime sans `approved: true` + tâche explicite.
- **[?] Non fait** : directions `up` / `side`, cycles `walk` / `carry` (le porteur du runtime marche en `carry` : l'aperçu le fige debout) ; l'idle runtime n'affiche que 2 trames (2 cellules d'atlas) ;
  aucune variante (2 acteurs `porter` dans le district → clones dans l'aperçu) ; second PNJ important **non tenté** (le premier n'est pas encore approuvé).
- **[?]** Contrôle « image / référence B » par des agents seulement ; jugement humain de l'opérateur attendu. Les scripts de création (client MCP, poussée de grilles, idle) sont restés hors dépôt.

### 4A.5 Erreurs de méthode / d'outillage (pour ne pas les refaire)

- **[KO → corrigé]** Juger un sprite seulement en 8x : l'étroitesse (v1), la paréidolie du sac (v3), la manche-« aile » (v5) et le sac fondu dans la barbe (v6) ne se voient **qu'en scène**,
  sous la lumière chaude et le liseré du rendu. Le contrôle runtime doit être dans la boucle de chaque itération, pas à la fin.
- **[KO → corrigé]** Les coordonnées des critiques utilisent les glyphes de `look ascii` d'Aseprite (≠ mes lettres de palette) : refaire la table de correspondance à chaque carte.
- **[KO → corrigé]** Corriger « au pied de la lettre » une demande de critique peut casser autre chose (v5 : avant-bras en diagonale devant le sac) : revalider en scène.
- **[KO]** Positions de capture : en C, l'objectif long met la bannière du bateau et un PNJ encapuchonné devant certains points du quai → chercher la place (3 essais) ; l'aperçu habille **tous** les acteurs `porter`.
- Rappels 4A-0B confirmés : pont persistant + Aseprite relancé après lui ; `MSYS_NO_PATHCONV=1` ; JSON de chemins Windows avec `/`.

## Passe 4A-bis — Remise en question du pipeline personnages (étude, aucune production, 2026-10-15)

Décision opérateur : `porter-gm-v1` **non approuvé**, retouches suspendues, gardé comme **baseline expérimentale** (manifeste passé en `experimental`) ;
aucune production de personnage avant validation d'une nouvelle stratégie ; les personnages peuvent avoir un traitement différent de l'environnement (même univers, autre technique).

- **[KO] Erreur de cible de la passe 4A.** La planche « 16 generic townsfolk (unified style & scale) » (image 1 de 4A) est la **cible** de l'opérateur ; je l'avais classée
  « rejetée » à cause de son titre et donnée aux trois critiques comme contre-exemple. Toute la passe 4A visait donc les deux autres images. Pensée : un classement de références
  se fait confirmer par l'opérateur **avant** de produire, surtout quand une consigne parle de planches rejetées sans les montrer.
- **[OK] Mesure de la référence** (`refgrid`, scripts hors dépôt) : ce n'est **pas** du pixel art strict — blocs de 3 à 4 px d'image, irréguliers, bords adoucis, dégradés dans les blocs
  (image peinte qui imite le pixel art, très probablement générée puis réduite : à confirmer par l'opérateur). Le pas le plus stable (vieux marchand) ≈ 3,5 px → figure ≈ **45-48 pixels de haut**,
  ≈ 20-23 de large, proportions chibi (tête large ≈ 40 % de la hauteur), ≈ 300-600 teintes par figure. Les autres mesures automatiques tombent sur des harmoniques : le pas n'est pas constant.
- **[OK] Reconstruction stricte** du docker (#05) sur grille 32 × 48 (pas 3,55, phase cherchée par variance minimale) : figure 20 × 44, **tient dans le format actuel** et garde l'essentiel
  (proportions, visage, cheveux, matières) **sans aucun nettoyage**. Pensée : la résolution 32 × 48 n'est **pas** le verrou principal ; le dessin et les proportions le sont.
- **[OK/?] En scène** (aperçu dev, B / C / A, même endroit) : la reconstruction a plus de charme que `porter-gm-v1` et s'accorde aux proportions du joueur (le « conflit de style
  avec le héros » de 4A venait de ma mauvaise cible) ; mais elle sort **pâle et bruitée** — pas de contour, trous du découpage d'ombre, 548 couleurs, et l'éclairage des sprites
  (relèvement côté lumière, liseré) délave les tons clairs. À traiter : nettoyage + réglage de la réponse lumineuse des sprites (paramètre runtime, pas résolution).
- Captures de l'étude (non versionnées : elles dérivent de l'image de référence de l'opérateur) : comparaisons à trois (porteur actuel / `porter-gm-v1` / reconstruction) en A et B.
- Recommandation et pipelines comparés : voir la réponse d'étude de la conversation (résumé : pipeline hybride — base dessinée ou générée hors runtime, reconstruite sur grille,
  finition humaine dans Aseprite, déclinaisons et intégration pilotées par le code ; résolution conservée ~45-48 px de figure avec un canevas plus large ; réglage du rendu des sprites).

## Passe 4A-ter — E2 / E3 : faisabilité artistique (tests seulement, aucun asset produit ni commité, 2026-10-15)

Cadre opérateur : E2 et E3 seulement, arrêt avant E4. Références classées par **contenu et approbation explicite**, jamais par nom de fichier ; densités **réellement**
différentes comparées à **même taille monde** ; pas de limite de palette imposée avant comparaison ; finition **autonome** Claude Code + Aseprite AI Artist ; preuves natives, crops au plus
proche voisin, captures à position identique, revue indépendante qui prouve avoir vu les images. Matériel de test : le docker #05 (vue de face) de la planche de référence.
Preuves (hors dépôt, dérivées de la référence) : dossier de travail de la session (`e2v/`, `e2f/`, `e2rt/`, `e3/`, `e3s/`, `p2rt/`, `review-e2e3/`).

### Outillage (dev seul)
- `src/lab/runtimePreview.ts` étendu : planche d'une autre densité → **second rendu de sprites** (même shader, mêmes lumières, même liseré) à la **même taille monde**
  (densité = hauteur de cadre / 48, mètres par texel = `PIXEL_WORLD` / densité) ; `labhd=1` force ce chemin même en 32 × 48 (comparaisons à traitement identique : le porteur du
  runtime est en détail `crowd`, protection DOF 0,8) ; `spritelight=sat,chroma,edge,vertMin,tone,overlay,unlit` surcharge le traitement lumineux des personnages (environnement inchangé).
  **[OK]** bundle de production identique au SHA-256 (`f81b4d7b…`), typecheck OK.
- **[KO → contourné]** Aseprite (fenêtre) ne s'est pas reconnecté au pont même au premier plan forcé (`SetForegroundWindow`) → **mode headless** d'AI Artist (`serve --headless`,
  instance batch dédiée, aucune fenêtre) : fonctionne, état rechargé depuis le fichier à chaque appel.

### E2 — résultats
- Sources reconstruites sur grille stricte : ×1 (32 × 48, figure 45 px, 623 couleurs), ×1,5 (48 × 72, 67 px, 1 288), ×2 (64 × 96, 89 px, 2 153).
- **[OK] Palette** (×1) : 96 / 64 / 48 indiscernables à 8x ; à 32, léger aplatissement chemise / peau, aucun trait perdu (revue : même avis). Les 623 couleurs sont du bruit. Densités supérieures non testées.
- **[OK] Densité, même taille monde** : ×1 → ×1,5 = gain net en B / C (yeux, bretelles, mains) ; ×1,5 → ×2 = gain plus faible (mèches, reflets), surtout en C ; en A ×1,5 ≈ ×2
  et ×2 tombe vers 1 px écran / texel (limite du plus proche voisin). **[?]** scintillement en mouvement non mesuré.
- **[OK/?] Finition autonome** (Claude Code + AI Artist headless, aucun humain) sur ×1,5 / 64 couleurs :
  passe 1 (contour unifié, épines / trous / bruit, yeux à reflet, sourcils, bouche, bottes refaites, ombre de mâchoire) **3 min 17 s**, ≈ 230 px posés + 177 mécaniques ;
  passe 2 (col en V, chemise en 4 tons + patte + boutons, boucle laiton, doigts, mèche désaturée) **1 min 37 s**, 177 px. `validate` 90-100.
- **Revue indépendante** (agent neuf, preuves de vue vérifiées sur les fichiers) : proximité à la référence — passe 2 sans liseré **7/10**, ×2 auto 6, passe 1 6, ×1,5 auto 4,5, ×1 auto 3.
  Reste : **rendu de la forme** (chemise en rayures verticales, manches, pantalon sans lumière directionnelle), main droite + bâton, volume des cheveux.
  Pensée : la finition par agent corrige vite et sûrement des défauts **nommés et localisés** ; elle n'a pas encore montré qu'elle sait **peindre la forme** (demander « nettoyer le bruit » a donné des rayures).

### E3 — résultats
- **[OK]** Termes intérieurs (saturation, chroma ambiante, assombrissement du bas, compression tonale, surimpression) : quasi sans effet sur cette image (chemise L207 de L0 à L5 ; albedo seul 222).
  La pâleur vient surtout de l'**albedo** (chemise claire de la référence), pas du traitement.
- **[OK] Le liseré de silhouette est le seul terme nuisible** pour un art à contour sombre : mesuré porteur seul (`static=1`, contrôle L0 / L0 = 0 px) — B : 952 px écran éclaircis
  (luminance 23 → 90), C (forge) : 1 239 px (21 → 100) ; le contour devient bleu-gris / clair côté lumière. Sans liseré (L1) : contour net, intégration conservée.
- **[KO → corrigé]** Ma première mesure (4 419 px) était gonflée par le mouvement des autres PNJ entre captures ; le relecteur l'a relevé ; refaite en scène déterministe.

### Erreurs de méthode (pour ne pas les refaire)
- **[KO → corrigé]** Le retrait d'ombre par couleur mangeait le pantalon et les chevilles (sombres comme l'ombre et le fond) → règles de forme (fermeture verticale, îlots) + ombre limitée aux dernières rangées.
- **[KO → corrigé]** Recadrages A de la passe 2 qui coupaient le porteur. Toute mesure par différence d'images se fait en scène déterministe (`static=1` + aperçu) avec un contrôle à 0.

## Passe 4A-quater — E2 modelé : peindre la forme sur la trame ×1,5 (test seulement, aucun asset produit ni commité, 2026-10-15)

Cadre opérateur : uniquement le docker ×1,5 de la passe 2 ; démontrer un vrai modelé (volumes, plis, matières) dans Aseprite via les outils d'AI Artist ; lumière haut-gauche
sans lumière de scène peinte ; comparaison A (×1,5 passe 2) / B (×1,5 modelé) / C (×2 auto) / D (référence) à **même taille monde** — natif, plus proche voisin, caméras B / C / A
en L1 (sans liseré), aucun changement du rendu ; critique indépendante **à l'aveugle** ; 2 itérations au plus ; si le ×1,5 reste inférieur au ×2 sur formes, vêtements ou
expressivité : arrêter et recommander un autre pipeline. Pas d'E4, aucun personnage de production touché.

Temps réel (horloge) : 19:50:56 → 20:20:24, ≈ 29,5 min jusqu'à la 2e critique (Aseprite headless : quelques secondes par appel). Itération 1 : 19:51 → 20:04 (1a / 1b procédural,
1c retouches, 1d peint à la main) ; captures + critique 1 : 20:04 → 20:13 ; itération 2 : 20:13 → 20:16 ; captures + critique 2 : 20:16 → 20:20.

### Itération 1
- **[KO]** 1a / 1b, modelé procédural (normales de cylindres pour torse / manches / jambes, plis tracés, quantifié sur rampe) : du volume, mais une coupure **verticale** nette entre moitié
  éclairée et moitié ombrée (les rayures reviennent) ; pantalon trop clair et trop bleu — rampe montée à L ≈ 100 alors que la référence mesure **L 45-76** (échantillonnée ensuite).
- **[KO → corrigé]** 1c, retouches transversales posées par coordonnées : 2 px du contour de l'épaule droite écrasés et 1 px hors silhouette ; réparé en 1d.
- 1d : chemise et pantalon **peints à la main rangée par rangée** (rampes échantillonnées sur la référence : chemise 7 tons à ombres mauves chaudes, pantalon 7 tons ardoise-violet),
  avec contrôle « la cible est bien un pixel du vêtement » (0 avertissement), 512 px via `draw`.
- Critique aveugle 1 (agent neuf, étiquettes tirées au sort, clé hors de son champ, preuves de vue vérifiées) : **passe 2 1re, ×2 auto 2e, modelé 1d 3e** — « moucheture rose-crème
  sur la chemise, damier sur le pantalon : les formes se lisent comme une texture ». Volumes : 6 / 7 / 5. Gagnant chemise et pantalon : ×2. Cause trouvée dans ma spécification :
  des valeurs alternées à 1 px (ex. `BABABCBCCD`). Mesure : 25,2 % de pixels isolés dans les vêtements (passe 2 : 23,5 %).

### Itération 2
- Masses de 3-4 valeurs par forme, plis rendus par le **bord des aplats** (pas de ligne de 1 px), terminateur courbe sur le torse, blousant + 2 plis de rentré ; bouche ramenée à un trait
  de 2 px (la critique 1 lisait une bouche ouverte décentrée), ombre de mâchoire sur le cou ; 518 px via `draw`, `validate` 90.
- Mesure (vêtements, pixels intérieurs) : pixels isolés **16 %** (passe 2 23,5 ; 1d 25,2), alternances à 1 px **16,2 %** (26,4 ; 26,2).
- Critique aveugle 2 (nouvel agent, nouvelles étiquettes) : **it2 ≈ passe 2** (« it2 devant d'un cheveu, dans le bruit de jugement »), ×2 auto 3e au global. Volumes : it2 **4**,
  passe 2 5, ×2 6 — la chemise d'it2 « en carrés gris par blocs plutôt qu'en modelé » ; gagnant chemise + manches : ×2 (à l'échelle de la planche) ; pantalon : it2 (revers justifié,
  mais les deux jambes se fondent en scène) ; tête : it2 (bouche calme, proche de la cible).
- En scène (B, lumière chaude), la chemise des trois ×1,5 tire au blanc : le modelé ajouté y est à peine perceptible.

### Bilan — [KO] objectif non atteint, arrêt après 2 itérations
- Le modelé ×1,5 peint par l'agent **n'a pas été lu comme du volume** par deux critiques aveugles (volumes 5 puis 4, **sous** la passe 2 non modelée : 6 puis 5) et reste **inférieur
  au ×2 auto sur les formes** (7 puis 6). Les seuls gains sont des corrections **nommées et localisées** (bouche, revers de pantalon).
- La baisse du bruit mesurée (23,5 → 16 % de pixels isolés) n'a pas suffi : une métrique de propreté ne mesure pas la lecture de la forme.
- Les deux critiques donnent au ×2 la meilleure forme et les meilleurs plis et le pénalisent sur des **défauts de dessin localisés** : traînée rose de la bouche au col (lue « langue »),
  mèche sombre à droite jusqu'à l'épaule, bosse rectangulaire sur la calotte, chevilles / bottes fragmentées, contour qui disparaît sur les bras ; à 1:1 son détail devient mou
  (983 couleurs non quantifiées). À l'échelle de jeu, les ×1,5 se lisent aussi bien ou mieux (7 contre 5-6).
- **Recommandation** : arrêter le modelé sur ×1,5 ; essayer la **finition artistique du ×2** — partir du ×2 auto, quantifier en palette groupée (64-96 couleurs), corriger
  les défauts nommés ci-dessus (col / bouche, mèche, calotte, bottes, contour unifié) **sans repeindre les volumes**, puis même grille A/B/C/D en aveugle. Si elle échoue :
  **une meilleure source illustrée** (vue de face peinte à plus haute définition que la planche, dont la figure ne fait que ≈ 45-48 blocs) avant reconstruction sur grille — le ×2 n'a de
  la forme que parce qu'il rééchantillonne les dégradés peints à l'intérieur des blocs de la source.
- **[?]** Non testé : finition du ×2, tenue en mouvement, caméra D, autres graines.

### Erreurs de méthode (pour ne pas les refaire)
- **[KO → corrigé]** Variables shell écrasées par les étiquettes d'anonymisation (`M`, `R`, `K` = chemins) : premier jeu de panneaux vide ; refait avec des noms distincts.
- **[KO → corrigé]** Un outil de mesure découpait ses arguments sur « : » (chemins `C:`) → séparateur « | ».
- Contrôle de déterminisme de la capture refaite : 0 px (caméra B, passe 2). Auto-critique écrite **avant** chaque critique aveugle, pour comparer honnêtement.

Preuves (hors dépôt, dérivées de la référence) : dossier de travail de la session `e2m/` (it1d.png, it2.png, sources `.aseprite` 1c / 1d / 2, `scene1/`, `scene2/`, `critic-fs1/`,
`critic-fs2/`, `final/fs-*.png`, auto-critiques) et clés d'anonymisation à part. Runtime inchangé : aucun fichier `src/` touché par cette passe, bundle `index-B5BamZwF.js`
SHA-256 `f81b4d7b…` identique, exports temporaires `test-e2-fs-*` supprimés, `art:validate` 0 erreur.

## Passe 4A-quinquies — Direction PNJ « ×2 auto » et validation en scène du candidat C (test seulement, rien en production, 2026-10-15)

### Décisions opérateur (après revue manuelle d'E2)
- **Hiérarchie artistique.** Niveau 1, PNJ standards : qualité proche du sprite **C — ×2 auto** — proportions stylisées, visage expressif sans surdétail, volumes et matières
  préservés, finition Aseprite ciblée sur les vrais défauts, déclinaisons possibles plus tard (jamais de retour à des sprites génériques simplistes). Niveau 2, personnages clés :
  qualité supérieure (planches les plus raffinées), même direction générale.
- **Conséquence technique.** On n'impose plus une trame ×1,5 fortement retravaillée : d'abord **préserver la qualité de la source**, puis une finition Aseprite sélective. La voie
  « modelé ×1,5 » n'est plus la direction principale ; pas de nouvelle exploration large.
- **C — ×2 auto = candidat approuvé pour la validation en scène**, baseline à tester dans le Merchant District ; **pas** un Gold Master de production.
- Avant de verrouiller sa densité : stabilité en mouvement (surtout caméra A) et preuve qu'on sait produire un personnage **original** à ce niveau. Pas de roster, de
  généralisation ni de personnage clé pour l'instant.
- Rangement : le candidat (PNG, rapport, planche source, scripts de reconstruction, preuves) est copié dans `art-lab/characters/scratch/e2-x2-candidate/` (ignoré par Git via
  `art-lab/**/scratch/`, jamais commité ; README sur place). Pas de source `.aseprite` (sortie automatique directe). Reconstruction vérifiée **identique au bit près**
  (SHA-256 `62acd603…`) depuis la copie.

### Méthode (environnement inchangé, aperçu dev seul)
- `src/lab/runtimePreview.ts` (dev, compilé hors production) : `labdetail` (niveau de détail / protection DOF des acteurs du second rendu ; `crowd` = celui du porteur),
  `labscale` (échelle de présentation par acteur), `labfollow=1` (le premier acteur prend la place du joueur, masqué, chaque image : marche réelle dans les cadrages) et une poignée
  non énumérable sur le groupe du second rendu (les outils de mesure l'éteignent pour isoler les pixels du sprite). Aucune géométrie, lumière ou shader du district touché.
- Export temporaire `test-npc-x2c` (= le ×2, 64 × 96, pied rangée 90) + témoin `test-npc-x1c` (même art reconstruit en 32 × 48) dans `exports/`, recréés / supprimés par
  `scene/install-test-exports.sh` ; supprimés en fin de passe.
- Captures 1920 × 1080, graine 1842, `freeze=7.3` : caméras **A / B / C / D**, 3 emplacements chacune, AVANT (porteur runtime) / APRÈS (×2, traitement L0 actuel) / APRÈS L1
  (sans liseré), + mêmes vues en `static=1` pour les mesures (seul le sprite diffère). Scripts : `scene/run-captures.sh`, `project.mjs` (projection écran), `light.mjs`, `motion.mjs`.
- Revue indépendante (agent neuf, ne voit que les planches et la référence ; auto-évaluation écrite avant de lire son verdict : `scene/self-assessment.md`).

### Résultats
- **[OK] Lecture et qualité.** Le ×2 est nettement au-dessus du porteur runtime dans les 4 cadrages : rôle (« docker ») lisible en B à 1:1 par trois bandes de valeur
  + casquette ; visage lisible en B / C / D ; silhouette nette sur fonds chauds. Revue (avant / après, /10) : lisibilité 5 / 8, direction artistique 5 / 7, silhouette 5 / 7,
  visage 5 / 6, constance chaud / froid 5 / 7 ; par caméra A 5 / 6, B 5 / 7, C 5 / 7, D 5 / 6.
- **Densité écran mesurée** (px écran par texel du ×2, projection réelle) : A 0,96-1,24 (le bout du quai passe juste sous 1 : quelques texels sautent), B 1,8-2,2,
  C 2,25-2,62, D 1,97-2,42. Le liseré du rendu lit le texel voisin (`1.0 / uAtlasSize`) : il fait **1 texel**, donc deux fois moins de pixels écran sur le ×2.
- **[KO → réglage] Échelle monde.** Figure ×2 = 89 texels × 0,0235 m = **2,09 m** ; runtime (atlas) : héros 1,93 m, gardes 2,02, marchand / forgeron 1,88, encapuchonné 1,83,
  porteur 1,65. Le PNJ générique dépasse le héros ; à `labscale=0.9` (1,88 m) il passe juste dessous et la revue le juge juste (`review/scale-B.png`).
- **[OK/?] Lumière.** Luminance du ×2 aux 12 emplacements du même ordre que le porteur runtime (moyenne 86-130 contre 85-161) ; décile clair (chemise) **189-212 partout**,
  y compris dans le noir de D (fond 34-46) : la chemise « s'allume » dans les zones froides — trait du traitement des sprites, commun au cast, pas propre au ×2. Bascule chaud / froid
  (R−B) de +16 (A) à −8 (D).
- **L0 vs L1.** L1 (sans liseré) est meilleur sur fonds chauds (A / B / C : le contour du sprite reste continu, L0 le remplace par une frange lavande brisée) ; L0 aide en D
  (sépare casquette / bras du sol sombre). Pas de traitement par sprite : rendre le liseré **dépendant de la densité** (décision moteur).
- **[?] Mouvement, caméra A.** `motion.mjs` (pas fixe 1/60 s, rendu avec / sans le sprite, « churn » = part des pixels du sprite qui changent d'une image à l'autre après
  recalage) : contrôles immobiles **0 %** ; ×2 ≈ témoin ×1 partout (médianes A latéral 4,8 / 4,5 %, A profondeur 6,4 / 6,4, A bout du quai 6,0 / 5,8, B 6,0 / 6,0). Mais le
  **contrôle négatif** (échelle 0,6 : le ×2 à 0,6-0,7 px / texel) ne sépare pas non plus (8,6 / 8,2) : la mesure n'est **pas assez sensible** pour prouver l'absence de
  scintillement. Contrôle visuel : 8 images consécutives et la boucle `review/motion-viewer.html` sans popping visible (yeux, casquette, boucle présents à chaque image). Reste à juger
  par l'opérateur, et avec un vrai cycle de marche (le PNJ testé glisse sur une seule image).
- **[KO, cast] Cohérence avec le reste du casting.** Texels deux fois plus petits que ceux du héros et des autres PNJ, ≈ 3,2 têtes contre ≈ 2,4, visage à reflets contre yeux-points :
  à côté du héros (C emplacement 3, D emplacement 1, `scale-B`), c'est le héros qui devient le personnage le moins fin à l'écran. Non corrigeable sur ce sprite.
- **Défauts du sprite (corrigeables)** : traînée rose bouche → col lue comme une langue (B / C / D, visible à 1:1 en C) ; mèche gauche qui descend jusqu'à l'épaule ; moucheture
  sur la chemise et les cuisses (2 153 couleurs) ; casquette plus saturée que l'ardoise de la référence ; jambes qui se perdent sur sol sombre en D.

### Conclusion
- **[OK, sous conditions] C — ×2 auto fonctionne comme style de base des PNJ génériques** : bonne cible de qualité, meilleur que le porteur actuel sur lisibilité, rôle,
  palette et fidélité à la référence. Ce n'est **pas** un remplacement direct dans le cast actuel.
- **Prochaine étape recommandée (revue et moi d'accord) : (B) une très petite passe de nettoyage, puis verrouiller** : (1) bouche / col séparés (trait de 1-2 texels, ombre de
  mâchoire, V du col en ombre de chemise froide) ; (2) mèche gauche arrêtée à l'oreille ; (3) regroupement de palette + texels orphelins sur chemise et pantalon **sans repeindre
  les volumes** (la revue propose 32 couleurs ; l'échelle de palette d'E2 montre un aplatissement à 32 : tester 64-96) ; (4) optionnel, à arbitrer : chemise −10 % et casquette
  désaturée ; (5) hauteur par défaut 1,88 m (échelle 0,9 ou recadrage du cadre 64 × 96).
- **Conditions avant d'étendre la baseline** : décision de densité du cast (héros en ×2 d'abord, ou plan de migration) ; liseré dépendant de la densité ; politique sur les largeurs
  de texel inégales à ≈ 2 px / texel (B / C) ; cycle de marche testé en A ; preuve d'un personnage **original** au même niveau.

### Erreurs de méthode (pour ne pas les refaire)
- **[KO → corrigé]** Emplacement 3 de C caché derrière la bannière du bateau (le reveal ne protège que le joueur) → déplacé en (12,4 ; 0,2).
- **[KO → corrigé]** Premier cadrage d'échelle raté : en B, l'axe x est surtout de la **profondeur** ; une position « à côté » du joueur se calcule par projection (`project.mjs`).
- **[KO → corrigé]** `$(pwd)` en Git Bash donne `/c/...` : converti pour un argument seul, pas dans `"label|chemin"` → `pwd -W`. `boxes.txt` sans fin de ligne finale : la dernière
  ligne sautait dans `while read`.
- Captures : quelques images isolées où le masque du sprite explose (même sur un trajet immobile) = défaut ponctuel de capture, écarté par médiane / p90, signalé dans le rapport.
- Le serveur de dev dédié meurt avec la reprise de session : le relancer (`:5180 --strictPort`) avant toute capture.

Preuves (hors dépôt, dérivées de la référence) : `art-lab/characters/scratch/e2-x2-candidate/scene/` — `shots/` (captures brutes), `review/` (planches A-D plein cadre et
emplacements, `scale-B`, bandes de mouvement, `motion-viewer.html`), `motion*/` + `motion-report.json`, `light.json`, `projections.json`, `self-assessment.md`. Runtime inchangé :
bundle `index-B5BamZwF.js` SHA-256 `f81b4d7b…` identique, typecheck OK, `art:validate` 0 erreur, exports temporaires supprimés, rien commité.

## Passe 4A-sexies — Très petite passe de nettoyage du ×2 + validation en scène A-D (approuvée, test seulement, 2026-10-16)

Approbation opérateur : bouche / col, mèche gauche, palette regroupée **sans repeindre les volumes**, hauteur 1,88 m ; même validation A-D ; **arrêt avant verrouillage**.
Outil : Aseprite AI Artist 0.8.2 en **headless** (outils MCP du plugin dans la session : `sprite_manage`, `palette`, `recolor`, `look`, `draw`, `validate`, `export`).
Temps réel : 00:21 → 00:27 édition v1 (≈ 6 min) ; captures + critique jusqu'à 00:36 ; v2 00:36 → 00:39 ; retour à v1 00:46.
Source : `art-lab/characters/scratch/e2-x2-candidate/clean/x2-clean.aseprite` → `x2-clean.png` (64 × 96, pied 90, SHA-256 `9e1de3ba…`), dossier ignoré par Git.

### Ce qui a été fait (v1, retenue)
- **[OK] Palette** : k-means OKLab **64 couleurs** pondéré visage (déjà produit en E2, figé) : erreur moyenne 12,1 ‰ (max 43), indiscernable de la source à l'œil.
  **[KO]** L'extraction d'Aseprite (`palette extract` 96 / 64) remplace la palette **sans remapper** les pixels malgré `remapArt` ; après `recolor snap`, erreur 16-18 ‰ (max 69) et
  chemise rosie / marbrée (`clean/pal-compare.png`) → rejetée.
- **[OK] Texels orphelins** : 9 seulement (majorité 6/8 très proche, visage exclu pour garder les reflets des yeux). La moucheture vue en jeu est un marbrage de 2-3 texels
  hérité de la peinture : la lisser serait repeindre, non fait.
- **[OK] Bouche / col** : bouche 3 × 2 orange → trait fermé de 2 texels centré entre les yeux ; V du col (x 33-40, rangées 32-37) : **mêmes valeurs, chroma rouge retirée**
  (15 `replace` limités à la zone). La traînée « langue » disparaît dans les 4 caméras.
- **[OK/?] Mèche gauche** : la poche sombre sous l'oreille (5-7 texels, rangées 26-30 = fond de la référence enfermé) devient du fond, contour refermé ; la mèche s'arrête
  à l'oreille. Reste un contour + ombre de mâchoire de 2-3 texels jusqu'à l'épaule (lu « partiel » par la critique).
- **Hauteur 1,88 m** = échelle de présentation **0,9** (donnée, aucun pixel touché ; `labscale=0.9`). Conséquence : en A le ×2 descend à **0,86-1,11 px écran / texel**
  (B 1,6-2,0, C 2,0-2,35, D 1,8-2,2).
- `validate` 100 (notes : 65 entrées de palette, pas de couleur unique de contour), 66 texels modifiés sur la base 64 couleurs.

### Validation
- Captures A-D, mêmes 3 emplacements, avant (porteur runtime) / ×2 auto / ×2 nettoyé (tous deux à 1,88 m) / nettoyé L1, + vues `static=1` (contrôle déterministe : 0 px)
  et échelle à côté du héros (`scene/run-captures-clean.sh`, planches `scene/review-clean/`).
- **Critique à l'aveugle** (Q / Z tirés au sort, clé hors champ ; auto-évaluation écrite avant : `clean/self-assessment.md`) : nettoyé **nettement meilleur** que ×2 auto,
  uniquement par la bouche / le col — visage 7 contre 4, col / cou 6 contre 3, proximité de la cible 7,5 contre 6, lisibilité 1:1 B 8 / C 8 / D 7 / A 7 (contre 6 / 6 / 5 / 6).
  Aucune régression ailleurs (« identiques pixel pour pixel hors visage et col », pas de dérive de couleur). Verdict : **« oui, avec une réserve mineure »** pour verrouiller.
  Défauts restants signalés : V du col faible / gris moucheté (lu « barbe naissante » en D), colonne sombre des deux côtés de la tête jusqu'à l'épaule (cou peu visible),
  bas du visage un peu long, marbrage des cuisses en C (léger). Hors sprite : densité de texel mélangée avec le cast, frange bleue du liseré sur le contour.
- **[?] Marche en caméra A** à 1,88 m (bout du quai, 1,04 → 0,9 px / texel, quelques texels sautent) : 8 images consécutives sans popping visible (yeux, casquette, boucle) ;
  churn 6,5 % contre 6,1 % pour le témoin ×1 — mesure insensible (cf. 4A-quinquies), jugement visuel seulement ; boucle dans `scene/review/motion-viewer.html` (3e colonne).

### Essai rejeté (v2)
- **[KO]** Micro-retouche sur les deux réserves (41 texels : peau du cou sous l'oreille gauche ; V net = ombre de gorge sombre + rabats) : à la vraie grille, l'ombre de gorge forme un
  **croissant sombre** sous le menton, lu ras-de-cou / bavoir en C et D (critique à l'aveugle v1 / v2 : différence non résolue à l'échelle des planches, mais le défaut est nommé ;
  vérifié moi-même à ×6 / ×12 : `clean/neck-v1-v2.png`). Gain du cou négligeable. Retour à v1, restaurée au bit près ; v2 archivée (`clean/x2-clean-v2-rejected.aseprite`,
  `scene/shots-clean-v2-rejected/`). Pensée : un V de col à cette densité se règle **avec la peau** (rangée claire entre menton et ombre), pas avec une masse sombre.

### Conclusion (arrêt avant verrouillage, comme demandé)
- Le ×2 nettoyé (v1) est le **candidat prêt à verrouiller** comme qualité de base des PNJ génériques, sous réserve mineure. À décider par l'opérateur : verrouiller tel quel, ou
  une dernière retouche du col (rangée de peau entre menton et ombre, V étroit, un texel ivoire par pointe de col) et / ou de la colonne sombre droite (non approuvée ici).
- Conditions inchangées avant d'étendre : densité du cast (héros), liseré dépendant de la densité, politique des largeurs de texel inégales, cycle de marche, personnage original.

### Erreurs de méthode (pour ne pas les refaire)
- `palette extract` d'AI Artist 0.8.2 ne remappe pas les pixels d'un sprite RGB : enchaîner `recolor snap` et **mesurer l'erreur** (`clean/qerr.mjs`) avant d'adopter une palette.
- `look` `ascii` refuse un sprite de plus de 261 couleurs : regrouper la palette avant toute édition au texel.
- Planche de critique trop réduite (3 442 px affichés à 2 000) : une différence de 1-2 texels doit être montrée **à la vraie grille** (×6-×12), sinon la critique ne peut pas trancher.
- `projections.json` / `project.mjs` ignoraient l'échelle d'acteur : corrigé (`info.scale`). La bande de mouvement de la v1 vaut pour la version retenue.

Preuves (hors dépôt) : `art-lab/characters/scratch/e2-x2-candidate/clean/` (source, palettes testées, retouches `edit1.json` / `edit2.json`, comparaisons) et `scene/`
(`shots-clean/`, `review-clean/`, `critic-clean/`, `critic-clean-v1-v2/`, `motion-far-clean/`). Runtime inchangé : bundle `index-B5BamZwF.js` SHA-256 `f81b4d7b…`, typecheck OK,
`art:validate` 0 erreur, exports temporaires supprimés, rien commité.

## Passe 4A-septies — Baseline PNJ approuvée et validation dynamique en Merchant District (chemin expérimental, rien en production, 2026-10-16)

### Décision opérateur (2026-10-16)
- **×2 nettoyé v1 = baseline visuelle approuvée des PNJ standards** (v2 rejetée). Ce n'est **pas** un Gold Master technique complet ni une autorisation de production.
  Conserver exactement ses sources, sa provenance, ses paramètres de reconstruction et ses preuves ; **pas d'autre retouche artistique** pour l'instant.
- Direction : PNJ standards = qualité du ×2 nettoyé v1 ; personnages clés = finition et expressivité supérieures ; **une seule direction artistique, des budgets de précision
  différents** ; **ne jamais dégrader le nouveau personnage pour l'aligner sur les anciens sprites**. Le personnage reste dans un chemin expérimental jusqu'à l'approbation
  de son intégration ; arrêt pour arbitrage avant toute variante ou tout nouveau personnage.
- **[OK] Provenance figée** : `art-lab/characters/scratch/e2-x2-candidate/PROVENANCE.json` (14 fichiers sous SHA-256 : sprite, source `.aseprite`, base 64 couleurs, ×2 plein,
  planche source, retouches, scripts ; paramètres de reconstruction ; étapes de nettoyage ; décisions datées) + `verify-provenance.mjs` (« baseline intact ») ; fichiers clés
  en lecture seule. **Risque** : ce dossier est ignoré par Git et n'existe que sur cette machine (un `git clean -X` l'effacerait) — stockage durable à décider.

### Méthode (environnement et effets intacts, aucune animation ni orientation ajoutée)
- `src/lab/runtimePreview.ts` (dev seul) : `labfollow=1` (le PNJ prend la place du joueur, masqué), `labscale`, `labdetail` ; hauteur = échelle de présentation, **texture
  inchangée** (64 × 96).
- `scene/dyn/dynwalk.mjs` : boucle de l'appli reprise à **pas fixe 1/60 s**, joueur piloté par les **vraies touches** (même pilotage que `tools/camsim.mjs`) → zones, transitions,
  collisions, DOF, reveal du jeu. Par image : recadrage 1:1 (séquences), pixels du sprite isolés (rendu avec / sans), churn (part des pixels qui changent d'une image à la
  suivante après recalage ±3 px), silhouette, part du contour restée sombre. Itinéraires vérifiés d'abord avec `camsim` : quai A → AB → B → BC → C → CD → D (881 images),
  bord de l'eau B → BD → D sans C (503).
- 9 marches : quai à **1,88 / 1,75 / 1,65 m**, quai au **témoin ×1** (même art en 32 × 48, **même renderer de labo** : la comparaison isole la densité), bord de l'eau,
  3 **PNJ fixes** sous caméra mobile, caméra C **avec / sans liseré**. Visionneuses `scene/dyn/viewer-*.html` (lecture 60 / 30 / 15 / 4 i/s, curseur, zoom, état caméra par image).
- Revue indépendante sur planches d'images consécutives (auto-évaluation écrite avant : `scene/dyn/self-assessment.md`).

### Résultats
- **[OK] Stabilité ×2 = densité actuelle** (churn médian ×2 / ×1, même trajet) : A 5,7 / 5,6 %, B 7,5 / 7,3, C 9,4 / 9,6, D 10,2 / 9,8, transitions 11,4 / 10,3. La revue voit
  la même chose sur les images consécutives en B (« aussi stable que ×1, bien plus lisible »). Contrôles immobiles : 0 %.
- **[?] Caméra A** (1,1-1,2 px écran / texel) : la revue voit des détails d'**un texel** changer d'une image à l'autre (taches de la calotte, bouche, bord de casquette) — la
  perte de texels attendue du plus proche voisin près de 1:1 ; les grands blocs restent stables. La mesure ne le détecte pas (A a le churn le plus bas) : **le churn ne mesure
  pas le scintillement de texel** (confirmé : il compte surtout lumière, DOF, reflets ; cf. 4A-quinquies). PNJ fixes lointains : jusqu'à 0,57 px / texel en A.
- **[OK] Transitions** AB / BC / CD : croissance / réduction progressive, aucun saut ; CD ancré tient taille et position.
- **Hauteurs** (même texture) : churn médian 1,88 / 1,75 / 1,65 m — A 5,7 / 6,0 / 6,1, B 7,5 / 8,2 / 8,7, C 9,4 / 9,4 / 10,2, D 10,2 / 10,4 / 11,0. Px / texel en B : 1,9-2,0 /
  1,7-1,9 / 1,6-1,8. **1,88 m** est le plus stable (proche de 2 px / texel en B) et le plus proche du héros (1,93 m).
- **PNJ fixes, caméra mobile** : médianes B 4,5 %, C 4,4 %, D 6,2 %. Les pics viennent d'**occlusions réelles** (héros ou PNJ qui passent devant ; ellipse de reveal du joueur
  qui découvre à moitié un PNJ placé derrière la bannière — le reveal ne protège que le joueur, conçu ainsi), pas du sprite.
- **Contours** : part du contour restée sombre A 3,7 %, B 19, C 34, D 57 (×1 : 1,6 / 16 / 30 / 53). Caméra C : liseré L0 28,6 % contre L1 45 %, churn identique → le liseré ne
  déstabilise pas, il éclaircit le contour (lisibilité) ; en D le pantalon se fond dans les pavés sombres.
- **DOF** : le PNJ reste net partout où il est le sujet ; PNJ fixes nets en B / C / D.
- **[OK] Performances** (`tools/perf.mjs`, caméra B, 3 tours entrelacés, bruit ≈ ±0,2 ms) : base 9,23 ms GPU ; renderer actuel +8 / +32 porteurs 9,63 / 9,67 ; ×2 1 / 8 / 32 PNJ
  9,15 / 9,31 / 9,54 ; témoin ×1 32 PNJ 9,68. **Coût égal au renderer actuel** à la marge de mesure ; le chemin expérimental ajoute **4 appels de dessin fixes** (son propre
  renderer) ; texture 24 Ko par image de sprite (6 Ko en 32 × 48). Non mesuré : plusieurs feuilles ×2 différentes, animations.
- **[KO → expliqué] « Image noire » 718** relevée par la revue en transition CD : JPEG de séquence seul (1,8 Ko), la même image est normale dans les 3 autres marches et la mesure
  (captures PNG) est normale → **raté de capture**, pas le rendu. 7 sur 7 396 JPEG au total, à des images différentes ; les visionneuses les signalent et affichent l'image
  précédente ; `dynwalk.mjs` reprend désormais toute capture anormalement petite.

### Conclusion (arrêt pour arbitrage, comme demandé)
- **Revue : « oui, avec conditions » pour passer à la planification de l'intégration** (pas à l'intégration). Moi : d'accord.
- Conditions moteur / scène : (1) **politique sous ≈ 1,2 px / texel** (caméra A, PNJ lointains, résolutions plus basses) : feuille préfiltrée ou repli 32 × 48 — à tester
  pour le popping ; (2) **densité du héros et du cast** : le héros 32 × 48 paraît plus grossier que les figurants ×2 (décider avant d'étendre) ; (3) **reveal de la bannière** :
  un montant sombre n'est pas découpé et coupe le joueur, la casquette tombe dans la bande tramée, la trame « rampe » quand l'ellipse bouge (Passe 3, pas le sprite ; à examiner) ;
  (4) un **renderer de sprites unique** pour le ×2 (aujourd'hui second renderer expérimental : vérifier surimpression 55 %, masque DOF, miroir, grille de lumières) ;
  (5) liseré par caméra ou L1 (lisibilité seulement).
- Sprite (aucune retouche faite, conformément à l'arrêt) : détails d'un texel qui clignotent sous ≈ 1,2 px / texel ; contraste pantalon / pavés en D ; cycle de marche et autres
  orientations non testés (à refaire avant d'en faire la baseline « PNJ qui marche »).

### Erreurs de méthode (pour ne pas les refaire)
- **[KO → corrigé]** Itinéraire en ligne droite → le joueur bute contre l'étal (3 900 images au lieu de 881) puis contre les bornes du bord de l'eau (x ≈ 9, z 3,4 / 3,6) :
  **valider un itinéraire avec `camsim` (sans rendu, secondes) avant toute marche capturée**.
- **[KO → corrigé]** Captures puppeteer qui pendent : (a) un onglet ouvert après la page de scène la met en arrière-plan (plus d'images produites) → `bringToFront` ;
  (b) deux captures de suite sans nouveau rendu ; (c) `clip.scale` (redimensionne la page). Avec la boucle reprise à la main : **un rendu avant chaque capture**.
- **[KO → corrigé]** `tools/perf.mjs` vise :5173 par défaut : passer `BASE_URL` du serveur dédié.
- Je ne suis réveillé qu'à la fin d'une commande d'arrière-plan : pour une série longue, un `Monitor` qui émet à chaque étape (sinon l'opérateur doit relancer).

Preuves (hors dépôt) : `art-lab/characters/scratch/e2-x2-candidate/scene/dyn/` (`runs/` 9 marches, `report.json`, `perf.json` + `run-perf.log`, `review/`, visionneuses,
`self-assessment.md`, `README.md`). Runtime inchangé : bundle `index-B5BamZwF.js` SHA-256 `f81b4d7b…`, typecheck OK, `art:validate` 0 erreur, exports temporaires supprimés.

## Passe 4A-octies — Conservation versionnée de la baseline et contrat d'intégration multi-résolution (2026-10-16)

### Décisions opérateur (2026-10-16)
1. Rapport dynamique validé : **×2 nettoyé v1 = baseline artistique ET dynamique approuvée des PNJ standards** — pas une approbation d'intégration en production, ni de ses
   futures animations / orientations.
2. Conservation durable et versionnée (pas seulement `scratch/`), provenance et droits de la planche vérifiés **avant** de proposer son archivage, statut distinguant
   *approved visual baseline* et *approved production asset*.
3. Densité ×2 (64 × 96) conservée ; **pas de LOD ni de repli 32 × 48** (résultats insuffisants pour le justifier) ; la limite de la caméra A reste un **point de QA**.
4. **Hauteurs monde = paramètres indépendants de la résolution** ; 1,88 m n'est pas une taille universelle.
5. Contrat technique d'intégration dans `SpriteAtlas` / `SpriteRenderer` à présenter **avant** implémentation ; pas de remplacement des sprites, pas de refonte.
6. Héros inchangé ; le standard ×2 vise les PNJ ordinaires, les personnages clés auront un budget supérieur.
7. Anomalie du montant de la bannière = **problème d'occlusion indépendant**, reveal non modifié ; tout nouvel occluder exige un inventaire visuel et technique.
8. Prochaine priorité artistique : un **deuxième PNJ original** de même qualité (pas d'amélioration sans fin du premier) ; pas de roster, de refonte du héros ni d'animations
   complètes sans nouveau contrat. Arrêt pour validation après cette passe.

### Provenance et droits de la planche source
- **[?] Droits non vérifiables** : la planche « 16 generic townsfolk » (WebP 302 814 octets, SHA-256 `1c3bc603…36ce`) ne porte **aucune métadonnée de provenance** (profil ICC sRGB
  seul : ni EXIF, ni XMP, ni auteur, ni générateur) ; elle a été fournie par l'opérateur en séance (fichiers 1, 4 et 5 identiques). Origine et droits d'usage à confirmer par
  l'opérateur. **Non archivée dans Git** (règle de `reference/README.md`) ; identifiée par empreinte et recadrage. Les images dérivées (×2, nettoyé, preuves) héritent de cette
  question ouverte.

### Conservation (fichiers suivis, prêts à commiter)
- Manifeste `art-lab/characters/manifests/dockworker-x2-v1.manifest.json` : `status: approved`, `approved: true` (opérateur, 2026-10-16), **`runtimeUse: "lab"`** = *approved visual
  baseline* ; *approved production asset* = `runtimeUse: "production"`, réservé à une tâche explicite + droits confirmés (convention écrite dans `art-lab/characters/README.md`).
- Source `art-lab/characters/source/dockworker-x2-v1.aseprite` (v1) ; export Aseprite `exports/dockworker-x2-v1.png` + `.json` (identique pixel pour pixel à la v1).
- Paquet de provenance `art-lab/characters/provenance/dockworker-x2-v1/` : `PROVENANCE.json` (SHA-256 de 9 fichiers, paramètres, étapes, décisions datées, point de QA),
  `x2-auto.png` (×2 original), `x2-quant64.png`, `cleanup-ops.json`, `reconstruction-report.json`, `README.md`.
- Outils portables : `tools/art-lab/reconstruct-grid.mjs` (reconstruction sur grille, sans chemin machine), `tools/art-lab/replay-pixel-ops.mjs` (rejoue les opérations
  `draw` enregistrées sans Aseprite), `tools/art-lab/verify-provenance.mjs` (empreintes ; `--sheet` + `--rebuild` : chaîne complète).
- **[OK] Chaîne complète vérifiée** : planche → ×2 plein **bit pour bit**, → 64 couleurs **bit pour bit**, → nettoyage rejoué **pixel pour pixel** = export approuvé ; contrôle
  négatif (autre planche) refusé. Preuves essentielles : `art-lab/characters/reviews/dockworker-x2-v1/` (6,6 Mo, aucune image ne contient la planche elle-même).
- **[KO → corrigé]** J'avais écrit (4A-sexies, `PROVENANCE.json` local) que le k-means 64 couleurs n'était pas déterministe : il l'est (initialisation déterministe) — la
  reconstruction refaite redonne le fichier au bit près. Et j'ai d'abord écrit de mémoire une empreinte complète de la planche (seuls 16 caractères étaient connus) : remplacée
  par la valeur calculée avant toute vérification. Pensée : une empreinte se calcule, ne se recopie jamais.

### Contrat d'intégration (proposition, rien d'implémenté)
- `art-lab/characters/runtime-integration-contract.md`. Fait mesuré : atlas 512 × 720 (234 images, 2,9 Mo), un renderer instancié, **taille monde et décalage des pieds
  partagés**. Invariant proposé : une densité *k* = cadre 32k × 48k, pieds à la rangée 45k → **même rectangle monde** (1,504 × 2,256 m, 0,141 m) : aucun changement de shader
  pour la taille ou l'ancrage, la densité ne change que la case d'atlas ; hauteur = échelle par instance. Changements : cases *k × k* dans le même atlas (aucun appel de dessin
  en plus), `BakedSpec`, chargeur réservé aux manifestes `production` (cuisson au build recommandée), repli « face / idle » au lieu de faire disparaître un PNJ incomplet,
  apparitions hors du flux RNG. 6 tests d'acceptation (dont pixel-identique sans PNJ ×2, et pixel-identique au rendu validé de l'aperçu) ; 10 risques (dont **droits de la
  planche bloquants pour la production**).

### Erreurs de méthode
- Voir les deux corrections ci-dessus. Le dossier `scratch/` reste la seule copie de la planche source et des preuves complètes : à décider avec l'opérateur.
- **[KO → corrigé]** Empreintes de fichiers texte prises brutes : un checkout Git sous Windows convertit les fins de ligne (CRLF) et la vérification aurait échoué ailleurs ; l'export
  JSON d'Aseprite est même écrit en CRLF. Règle désormais : texte (`.json .mjs .js .ts .md .txt`) haché en LF, binaires tels quels (`hashRule` dans `PROVENANCE.json`), testé sur
  une copie CRLF simulée (5 / 5).

## Passe 4A-nonies — Vérification de provenance de la planche source et contrat d'intégration v2 (rien d'implémenté, 2026-10-16)

### Décisions opérateur (2026-10-16)
- Commit local `eecea58` accepté comme étape préparatoire, à garder intact ; ni push ni fusion sans autorisation.
- Déclaration de l'opérateur : les planches originales de référence de Cité du Tournoi ont été générées avec ChatGPT / OpenAI sous notre direction artistique. Demande :
  vérifier que `4.webp` en est une (et non une inspiration externe), sans déduire de métadonnée ni fabriquer de preuve ; statut inchangé tant que ce n'est pas vérifié.
- Contrat : direction **approuvée en principe** (un `SpriteRenderer` commun, plusieurs densités, un atlas unifié), **implémentation non autorisée** ; présenter le contenu,
  les 6 tests, les 10 risques et les fichiers touchés (compatibilité 32 × 48, ancrage des pieds, filtrage, animations futures, mémoire GPU, batching).
- Deuxième PNJ original : pas avant validation du contrat **et** de la méthode de création de la nouvelle source artistique.

### Provenance de `4.webp` — [?] plausible, non démontrable depuis le fichier
- **Identité** : `4.webp` = images 1, 4 et 5 collées par l'opérateur dans cette séance (15/10, 21:32:58 et 22:51:56 UTC), octet pour octet (SHA-256 `1c3bc603…36ce`,
  302 814 o), = `scratch/e2-x2-candidate/input/reference-sheet-4.webp`. Aucune déclaration d'origine en séance avant celle du 16/10.
- **Contenu** : titre « Cité du Tournoi — Merchant District — Night », « NPC SPRITE PRODUCTION REFERENCE — 16 GENERIC TOWNSFOLK (UNIFIED STYLE & SCALE) », 16 personnages
  numérotés × 4 vues ; l'image 2 continue la série (n° 17-24, même en-tête), l'image 3 porte aussi le nom du projet. Le nom du projet fait partie de la composition : rien
  n'indique une œuvre extérieure — ce n'est pas pour autant une preuve d'auteur ou d'outil.
- **Fichier** : WebP VP8 avec pertes, 1448 × 1086, un seul bloc de métadonnées = profil ICC sRGB générique de 456 o (copyright « Google Inc. 2016 », typique d'un encodeur
  Chromium / Skia) ; ni EXIF, ni XMP, ni C2PA. Les 3 images collées ont le même profil → **copies transcodées par le copier-coller**, pas les fichiers d'origine.
- **Indice, pas preuve** : 1448 × 1086 (et 1122 × 1402 pour l'image 3, pendant portrait de 1402 × 1122) sont des tailles natives de ChatGPT : sur cette machine, des PNG
  « ChatGPT Image … » (mai 2026) à ces tailles portent un manifeste C2PA d'OpenAI ; aucune image Gemini locale n'a ces tailles.
- **Original introuvable localement** : inventaire en lecture seule de 24 674 images (Bureau, Téléchargements, Documents, Images, Vidéos ; OneDrive par nom seulement, rien lu
  pour ne pas télécharger de fichier cloud) : aucun « ChatGPT Image » postérieur au 30/08/2026 lié à ce projet ; comparaison en vignettes 96 × 72 avec les 34 images 4:3 :
  meilleur écart 30,1, contre 23,1 pour la planche sœur (image 2) et 0 pour elle-même → aucun original sur le disque.
- **Conclusion** : cohérent avec la déclaration, **non vérifié**. Aucun fichier de provenance modifié ; manifeste inchangé (`approved` visuel, `runtimeUse: "lab"`), droits
  « UNCONFIRMED ». Voie de preuve : l'opérateur récupère l'original dans son compte ChatGPT (bibliothèque ou conversation, PNG téléchargé) → vérification de la présence et du
  contenu du manifeste C2PA (émetteur OpenAI) et de la correspondance visuelle (copie avec pertes : comparaison par écart, pas par empreinte), puis documentation. La
  validation cryptographique de la signature demanderait un outil (`c2patool`) à installer : sur autorisation seulement.

### Contrat d'intégration v2 (proposition, rien d'implémenté)
- `art-lab/characters/runtime-integration-contract.md` : sections **8 (compatibilité)** et **9 (fichiers touchés)** ajoutées après relecture du code et mesures dans l'appli
  (graine 1842) ; test 1 dédoublé (a : aucun asset chargé → atlas identique à l'octet ; b : asset chargé mais non placé → image identique au pixel) ; R11 (lecture de la case
  voisine au bord d'un quad), R12 (vue de côté miroir pour les orientations futures).
- **Mesures** : dernière rangée opaque **45 dans 232 des 234 cases générées** (les 2 bulles : 43), ×2 v1 : **90** ; **0 texel opaque sur le pourtour** de chaque case (générées
  et ×2 v1, marges G 13 / D 10 / H 2 / B 5) ; 0 texel semi-transparent dans le ×2 v1 ; atlas 512 × 720 ; `MAX_TEXTURE_SIZE` 16 384 sur cette machine.
- **[KO → corrigé]** La v1 annonçait un plafond de 4 096 texels : WebGL2 ne garantit que 2 048 → **104 images ×2** à largeur 512, contrôle au démarrage.
- Points précisés : la foule tire ses places en évitant une liste `taken` (y ajouter les PNJ cuits déplacerait la foule → ajout en fin de `populate`, chevauchement signalé) ;
  `Actor.height` (ombres, bulle) est distinct de `scale` ; `frameIndex` ignore les durées Aseprite (cadences fixes) ; l'émissif occupe 1 canal sur 4 (R8 = −37,5 %, hors contrat).

### Erreurs de méthode
- **[KO → corrigé]** `cat > "$TMPDIR/…"` sans heredoc a attendu l'entrée standard (commande bloquée, fichier vide créé dans le Temp, supprimé) ; un `find` sur tout le profil a
  dépassé 5 min → inventaire Node ciblé (dossiers lourds sautés, OneDrive par nom seulement).

## Passe 4A-decies — Contrat v3 amendé, implémentation expérimentale de l'atlas partagé (flag dev, rien en production, 2026-10-16)

### Décisions opérateur (2026-10-16)
1. **Provenance** : « Je confirme que nos planches de référence originales ont été créées avec ChatGPT sous ma direction artistique. » À
   enregistrer comme **déclaration opérateur**, distincte d'une provenance vérifiée ; aucune métadonnée fabriquée ; vérifications à compléter
   si le PNG original revient. Expériences locales autorisées, **production bloquée**.
2. **Contrat v2 accepté avec amendements** — principes : un `SpriteRenderer` partagé, un atlas 32 × 48 + 64 × 96, aucun changement de shader
   de production si les invariants suffisent, ancrage / DOF / éclairage / ombres / occlusion conservés, **rendu des personnages existants
   inchangé**, pas de LOD, environnement intact. A : prouver que l'agrandissement de l'atlas garde exactement les anciens pixels et le rendu
   32 × 48 malgré les nouvelles UV normalisées ; B : repli face / repos seulement pour un asset expérimental immobile et explicite, en
   production chaque orientation / animation nécessaire est validée, aucune absence masquée ; C : comparer module TS généré et PNG / atlas
   précuits versionnés (build, bundle, chargement, mémoire, appels de dessin), le plus simple à qualité identique.
3. Implémentation expérimentale autorisée **sous flag dev** ; six tests avec contrôles négatifs ; générateur, caméras, reveal intouchés ;
   s'arrêter si une contrainte sort du périmètre.
4. Deuxième PNJ : stratégie validée (source originale, archétype distinct du docker — **artisane ou marchande** d'abord —, qualité au moins
   ×2 v1, reconstruction ×2, finition Aseprite limitée aux défauts réels, critique indépendante, validation en scène) ; **pas pendant
   l'implémentation**. Garder `eecea58` et sa provenance, commit local permis, rien poussé / fusionné, arrêt avant toute activation production.

### Provenance — [OK] déclaration enregistrée, [?] non vérifiée
- `provenance/dockworker-x2-v1/source-declaration.json` (nouveau ; aucun fichier de `eecea58` modifié, `verify-provenance` : intact) :
  phrase de l'opérateur citée, nature « déclaration, pas une preuve », faits techniques (aucune métadonnée, copie transcodée, taille native
  ChatGPT = indice, original introuvable), « rien n'est déduit », conséquences (local oui, production non), étapes si l'original revient.
  `verify-provenance.mjs` l'affiche à part (non hachée). README des personnages à jour.

### Implémentation (flag dev `?baked=`)
- `BakedSprites.ts` (types, `requiredFrames`, `checkBakedSheet`) ; `SpriteAtlas.build(specs, baked, maxTextureSize)` : blocs cuits rangés
  **dans les rangées de données au-dessus** des cases générées (octets et expressions UV des cases générées inchangés), alias face / repos
  **explicites et listés** ; `ActorSystem` : apparitions écrites ajoutées après toutes celles de la graine, hors `taken`, refusées avec une
  erreur explicite s'il manque une image requise ; `spawn` accepte un `t` (plus d'appel à `Math.random` pour elles) ; `App` / `main.ts` :
  chargeur DEV en import dynamique ; `src/lab/bakedLoader.ts` : barrière manifeste, SHA-256 contre le paquet de provenance, décodage PNG exact,
  tags Aseprite `<anim>-<dir>`, harnais de mesure. **`SpriteRenderer.ts` et tous les shaders : non modifiés** (B se règle avant l'apparition).
- Outils : `tools/art-lab/baked-proof.mjs` (captures déterministes, parade, auto-test, règles, acteurs), `png.mjs`, `storage-bench.mjs`,
  `dynwalk.mjs` + `dynwalk-report.mjs` (sortis de `scratch/`, compatibles avec les deux chemins). Bundle de production 818 648 → 822 553 o
  (+3,9 Ko : code de l'atlas partagé, inerte sans feuille cuite) ; chargeur DEV absent du bundle (vérifié par chaînes).

### Résultats (base = arbre `eecea58` servi sur :5181 ; détail : contrat section 12, preuves `reviews/shared-atlas-4a-decies/`)
- **[OK] Test 1** : atlas sans feuille cuite identique à l'octet ; cadrages A-D avec personnages et `static=1` : 0 px (8 vues) ; feuille chargée
  non placée (atlas 816) : rangées générées identiques, 0 px (8 vues). **Parade** des 234 images générées, atlas 720 / 816 / 1968 : 0 px
  (27 rendus) ; **contrôle négatif** (UV normalisées par l'ancienne hauteur) : 480 000 à 1 200 000 px.
- **[?] Amendement A — égalités de texel** : balayage de 17 échelles : 816 → 0 / 51 rendus ; 1968 → **1 rendu sur 51** (échelle 2,1 :
  1 032 px sur 5 lignes). Et un cas réel à 816 : **caméra C, le héros, 16 px sur une ligne** (test 3). Mécanisme : un bord de texel tombe
  exactement au centre d'une ligne de pixels ; `floor(vUv × H)` départage l'égalité par l'arrondi flottant, qui dépend de la hauteur de
  l'atlas. Les deux résultats sont des échantillons justes (le bord se déplace d'une ligne de pixels), mais l'image n'est plus identique au
  bit. Les octets, eux, ne bougent jamais.
- **[OK] Test 2** : bloc ×2 dans l'atlas principal = export décodé indépendamment (0 octet) ; échantillonnage GPU aux échelles 1 / 2 / 3 /
  2,37 : 0 texel faux ; contrôles négatifs (rangée décalée d'une ligne : 6 616 ; linéaire non centré : 10 804).
- **[OK] Test 3** : 12 PNJ ×2 aux places de 4A-sexies, ancien renderer d'aperçu vs renderer principal : **0 px sur chaque PNJ ×2** (A-D) ;
  le seul écart de l'image (C, héros) est l'effet A ci-dessus (l'aperçu garde un atlas de 720 rangées).
- **Test 4** : **[OK]** même outil (`dynwalk.mjs`, `Math.random` à graine, horloge figée par image), routes de 4A-septies. Quai 1,88 m, churn
  médian chemin partagé / ancien aperçu / 4A-septies : A 5,8 / 5,7 / 5,7, B 7,6 / 7,6 / 7,5, C 9,4 / 9,4 / 9,4, D 10,2 / 10,2 / 10,2, transitions
  11,4 / 11,5 / 11,4 ; 881 images, aucune sans le sprite. PNJ fixes (3 PNJ × 5 groupes = 14 couples) : à moins de **0,8 point** de 4A-septies
  partout ; le PNJ n° 3 sort du masque sur 20 images, les mêmes que dans 4A-septies (occlusion du décor, pas une disparition). Le témoin
  « PNJ fixes » par l'ancien aperçu a été arrêté (une heure de plus ; le témoin du quai montrait déjà 0,1 point d'écart).
- **[OK] Test 5** (caméra B, 3 tours, bruit jusqu'à ±1 ms cette session) : base 9,91 ms GPU, 114 appels ; ×2 partagé 1 / 8 / 32 PNJ 10,21 /
  10,12 / 10,21 ms, **114 appels** ; porteurs actuels 8 / 32 : 10,20 / 11,12 ms ; ancien aperçu ×2 32 : 10,52 ms, **118 appels (+4)** ;
  atlas +393 Ko (512 × 816).
- **[OK] Test 6** : typecheck, build, `art:validate` (0 erreur) ; graines 1842 / 7719 / 30417 : les 11 personnages de la graine identiques à
  `eecea58`, les ×2 seulement ajoutés à la fin. **Règles B** 8 / 8 : PNJ interactif sans repli → refusé (« missing frames up/idle,
  side/idle ») ; PNJ de foule jamais tourné → accepté ; avec orientation → refusé ; repli explicite → accepté, alias listés ; mot-clé
  inconnu, `?baked` + `?labsprite`, asset sans paquet de provenance, id inconnu → refusés ; contrôles de feuille sur 8 feuilles fabriquées.

### Amendement C — [OK] mesuré, décision proposée : PNG versionné (C2)
- Builds de production (3 chacun), `vite preview`, cache coupé : module TS **+33 433 o de JS** (+5 034 gzip) pour une seule image ×2 ;
  PNG **+1 891 o de JS** (+957 gzip, décodeur) + fichier de 5 196 o. Chargeur seul : 0,2 ms (module) contre 10,6-14,6 ms (PNG : requête +
  empreinte + décodage), recouvert par le démarrage (temps jusqu'à prêt identique au bruit près). Atlas **identique à l'octet** entre les deux,
  mêmes appels de dessin, build identique au bruit près. Le module duplique dans Git des pixels déjà suivis et hachés (l'export) et grossit
  le JS linéairement (≈ 1,6 Mo pour un PNJ de 48 images, extrapolation) ; le PNG garde **une seule source** et le chargeur déjà utilisé.

### Erreurs de méthode (pour ne pas les refaire)
- **[KO → corrigé]** Captures « identiques » qui ne l'étaient pas : écran de chargement en fondu sur le canvas, bulle qui lit
  `performance.now`, **RNG propre des particules** (`Rng(99)`) qui tourne entre chargements, et **premier chargement d'un cadrage** dans une
  session de navigateur différent des suivants (69 634 px en A) → attente du retrait du chargement, horloge figée, RNG remis à zéro, une
  chauffe par cadrage, et un **témoin de répétition** (deux chargements : 0 px) avant toute comparaison.
- **[KO → corrigé]** Contrôle négatif « mauvaise hauteur d'atlas » invalide : la requantification au plus proche l'annule (0 écart) →
  remplacé par une rangée décalée. Un contrôle négatif se vérifie lui-même.
- **[KO → corrigé]** Attendu de l'auto-test calculé avec l'échelle demandée (2,37) au lieu de la taille arrondie de la cible (2,375).
- **[KO → corrigé]** `src/` modifié pendant une série sur le même serveur dev → rechargement HMR, une mesure perdue (graine 1842), relancée.
- **[KO → corrigé]** Premier recadrage du test 3 fait sur le **héros** (positions supposées ; `tools/eval.mjs` tourne en 1280 × 720, les
  captures en 1920 × 1080) → recadrage par projection. C'est ce recadrage qui a montré que l'écart de C portait sur le héros (effet A).
- **[KO → corrigé]** Test 4, première marche du chemin partagé : churn de A à 17 % (4A-septies : 5,7). Cause : pour isoler le sprite, le
  harnais recalcule les instances ; les **bulles de dialogue lisent l'horloge** et bougeaient entre les rendus « avec » et « sans », donc
  entraient dans le masque (hauteur 185 px au lieu de 107). L'ancien aperçu ne recalculait que son propre renderer. Correction dans l'outil
  (`dynwalk.mjs` : une horloge figée par image), vérifiée sur 32 images (masque 107 px, churn image par image = celui de 4A-septies), puis
  marche refaite. Pensée : une mesure par différence « avec / sans » doit figer tout ce qui bouge entre ses deux rendus.
- Le serveur dev :5180 de la passe précédente tournait encore (arrêter la tâche ne tue pas `vite.js`) ; un fichier absent est servi comme
  `index.html` (200) par le serveur dev → le chargeur exige une réponse JSON.

## Passe 4A-undecies — Adressage des texels indépendant de la taille de l'atlas (flag dev, rien en production, 2026-10-16)

### Décision opérateur (2026-10-16)
« Adressage entier » pour l'amendement A ; refus qu'un changement de taille de l'atlas puisse modifier les texels affichés par les
personnages existants. Mission ciblée sur le renderer de sprites et son atlas, sous contrôle expérimental ; pas de migration GLSL1 → GLSL3
pour `texelFetch` ; arrêt et présentation des implications si une modification plus large devient indispensable ; aucun appel de dessin
en plus ; `5d10a37` = point de restauration ; commit local seulement si toutes les preuves sont satisfaisantes. Critère final : ajouter des
sprites ne doit jamais modifier l'apparence des sprites déjà validés.

### Anomalie initiale — [OK] reproduite sur `5d10a37`
- Parade, échelle 2,1, atlas de 1 968 rangées : **1 032 px** sur 5 lignes (sprites 32 × 48 générés), identique à la passe précédente.
- Scène, caméra C, joueur en (9,6 ; 1,0), ×2 **chargé mais pas placé** : le **héros** change de **16 px** (atlas 816) et **20 px** (atlas 1 968)
  sur une ligne, contre la baseline `eecea58`.

### Cause précise
- Un texel était choisi par `floor(vUv × H)` ; `vUv` est interpolé entre des sommets dont les valeurs v = 1 − cy / H sont des flottants
  arrondis, puis remultiplié par H. À l'échelle de certains cadrages, l'ancrage calé sur la grille de pixels place un bord de texel
  **exactement** au centre d'une ligne de pixels : la valeur exacte est un entier et l'erreur d'arrondi (~10⁻⁴ texel) décide du texel. Ces
  erreurs dépendent de H (valeurs aux sommets et multiplicateur) : agrandir l'atlas renversait certaines égalités. Le billboard étant presque
  vertical, toute la ligne bascule d'un texel. Les octets, eux, ne changeaient jamais.
- Conséquence : aucune formule normalisée par la taille de la texture ne peut être stable ; il faut que **ni les valeurs interpolées ni le
  multiplicateur** ne dépendent de la taille de l'atlas ou de la place de la case.

### Correction (périmètre : `SpriteAtlas.ts`, `SpriteRenderer.ts`, chargeur et outils DEV)
- **Sprites générés : chemin inchangé et texture figée.** La texture générée redevient exactement celle de `eecea58` (512 × 720) et ne grandit
  plus jamais : mêmes octets, mêmes UV, même code d'échantillonnage → leurs égalités se résolvent comme dans la baseline, pour toujours.
- **Sprites cuits : leur propre texture**, adressée par **case entière** (x0, y0, l, h) : `texel = case.xy + clamp(floor(t × case.zw), 0,
  case.zw − 1)` avec t ∈ [0, 1] sur le quad (aux sommets : 0 ou 1 exactement), puis lecture **au centre du texel** (`(texel + 0,5) / taille`,
  exacte en plus-proche-voisin quelle que soit la taille). Politique de frontière explicite : un bord exactement au centre d'un pixel donne
  le texel supérieur, pareil pour tout atlas ; jamais de lecture hors de la case (clamp) ; voisins du liseré hors case = transparents.
  Même fonction GLSL (`BAKED_GLSL`) pour le corps, la superposition, les ombres et l'auto-test. `texture2D` au centre du texel : pas de
  `texelFetch`, pas de migration.
- **Batching commun conservé** : un attribut d'instance `iCell` (largeur 0 = sprite généré), deux textures liées au même matériau ;
  les deux chemins sont lus sans branche autour des lectures de texture, l'instance choisit. **Aucun appel de dessin en plus.**

### Écart de compilation trouvé et éliminé
- Premier essai : 5 rendus sur 51 différaient de **1 niveau sur 255** sur 1 pixel (sprites générés, toutes variantes, même sans ×2) :
  non pas un mauvais texel mais un arrondi de l'éclairage recompilé. Isolé par variantes du shader (sondes de 15 rendus) : ombres modifiées
  = 0 px ; corps modifié = 5 px ; sélection de couleur seule = 0 ; + émissif = 0 ; **+ liseré = 5**. Le choix entre généré et cuit fait sur
  les **valeurs `step` du liseré** changeait l'ordonnancement du calcul ; fait sur les **échantillons d'alpha avant `step`**, le code
  généré redevient identique au bit (0 px). Pensée : un shader partagé se vérifie au bit, et un écart d'un niveau se cherche par sondes.
- **[?] Non expliqué** (expérience écartée) : nouveaux sommets + anciens fragments du corps donnaient 135 037 px d'écart, sur la fumée
  de la cheminée et les étincelles. Configuration non retenue, cause non cherchée.

### Résultats (la version retenue ; détails `reviews/texel-addressing-4a-undecies/`)
- Texture générée **identique à l'octet** à `eecea58` dans toutes les variantes (sans ×2, ×2 seul, ×2 + 103 images, ×2 rangé en dernier).
- **Parade des 234 images générées, 17 échelles × 3 lots, miroirs alternés** : baseline vs nouveau sans ×2 / ×2 (texture 96 rangées) / ×2 +
  103 images (1 248 rangées) / ×2 déplacé : **0 px sur 4 × 51 rendus**. Contrôle négatif (UV générées décalées d'une rangée) : 141 590 px au
  minimum par rendu.
- **Parade du ×2** (48 copies, miroirs alternés, 17 échelles) : texture de 96 rangées vs 1 248 rangées vs case déplacée en (448 ; 1 152) :
  **0 px sur 2 × 51 rendus**. L'ancien adressage (`5d10a37`) : 102 px au minimum sur chacun des 51 rendus, et différent entre 816 et 1 968
  rangées. Contrôle négatif (case décalée d'une rangée) : 78 375 px au minimum par rendu.
- **Scènes A / B / C / D**, avec personnages et `static=1`, dont la place du héros en C : nouveau sans ×2 / ×2 chargé (96 et 1 248 rangées),
  non placé : **0 px** (9 vues × 4 variantes).
- **Auto-test** (code d'adressage de production) : 0 octet et 0 texel faux aux échelles 1 / 2 / 3 / 2,37, case en (0 ; 0) d'une texture
  512 × 96 **et** en (448 ; 1 152) d'une texture 512 × 1 248 ; **débordement** : 4 × 2 cases opaques sans anneau transparent, 6 échelles × 4
  décalages sous-pixel × 8 cases = 192 rendus, **0 pixel étranger sur 4 277 568** ; contrôles négatifs : rangée décalée 6 616, linéaire non
  centré 10 804, arrondi sans clamp **37 517 pixels étrangers**.
- **×2 vs aperçu validé** (12 PNJ aux places de 4A-sexies) : **sans les ombres de sprites, 0 px dans les 4 cadrages** (corps, liseré,
  superposition, DOF), pour la texture de 96 comme de 1 248 rangées. **Avec les ombres : 3 / 40 / 67 / 4 px (A / B / C / D), jusqu'à 12 / 255**,
  identiques entre 96 et 1 248 rangées → **[?] divergence stable de l'ombre portée du ×2** : l'aperçu lisait l'ombre par le plus-proche-voisin
  du matériel (arrondi à 1 / 256 de texel), le nouveau chemin par le même plancher entier que le corps ; ils diffèrent sur les quasi-égalités.
  Présentée à l'opérateur avec l'alternative (tableau de textures, construction GLSL 3). **Décision opérateur (2026-10-16) : écart
  accepté** (stable, même règle que le corps) ; commit local de la correction, rien poussé.
- **Performance** (4 tours entrelacés, caméra B ; le 4e tour a chauffé pour presque toutes les variantes) : 114 appels de dessin partout ;
  tours 1-3, ancien / nouveau : base 9,13 / 9,23 ms, ×2 1 PNJ 9,27 / 9,22, 8 PNJ 9,28 / 9,42, 32 PNJ 9,63 / 9,67 → dans le bruit. Une texture
  de plus (1 × 1 sans ×2 ; 512 × 96 = 192 Ko avec, sans couche émissive). Bundle de production 822 553 → 824 920 o.
- Typecheck, build, `art:validate`, provenance intacte ; chargeur DEV absent du bundle.

### Erreurs de méthode
- **[KO → corrigé]** La chauffe par cadrage ne visait que le premier serveur : le premier chargement d'un cadrage est propre à **chaque
  origine** (74 491 px en A sur le second serveur) → une chauffe par serveur et par cadrage.
- **[KO → corrigé]** Le chargeur plaçait la première feuille chargée : avec `bakedsynfirst=1`, des PNJ synthétiques au lieu du docker → il
  place la première feuille demandée.
- La série complète a été arrêtée dès le premier écart d'un niveau (inutile de mesurer le reste sur un shader faux), puis relancée sur la
  version retenue.

## Passe 4A-duodecies — Provenance des planches de référence confirmée par l'opérateur (documentation seule, 2026-10-16)

### Décision opérateur (2026-10-16)
Les planches « Cité du Tournoi — Merchant District — Night » (PNJ 1 à 24) ont été générées avec ChatGPT / OpenAI à partir de nos
instructions de direction artistique ; ce ne sont pas des planches d'un artiste extérieur ; `4.webp` est une copie réencodée de l'une de ces
générations. À enregistrer comme **provenance confirmée par l'opérateur**, sans prétendre à une vérification C2PA ; l'absence des originaux
ne doit pas être présentée comme une interdiction automatique de production ; droits et autorisation de production s'évaluent à part ;
baseline ×2 v1 et toute sa traçabilité conservées ; aucune métadonnée inventée.

### Ce qui a été consigné — [OK]
- `provenance/dockworker-x2-v1/source-declaration.json` : statut « provenance confirmée par l'opérateur, non vérifiée cryptographiquement » ;
  **les deux déclarations du jour citées mot pour mot** ; faits techniques inchangés ; « rien n'est déduit » (ni date, ni modèle, ni prompt,
  ni compte, ni C2PA) ; **série** : planche PNJ 01-16 (cette source) et planche PNJ 17-24 identifiées par leur SHA-256 (calculé sur les copies
  collées en séance) ; la troisième planche collée ce jour-là (« NPC CHARACTER REFERENCE SHEET », 14 personnages) **n'est pas nommée** par
  la clarification : aucun statut ne lui est attribué ; droits / production : évaluation séparée, l'absence des originaux n'interdit pas
  à elle seule ; **historique** : le texte précédent (« production BLOCKED … ») gardé mot pour mot.
- `PROVENANCE.json` : champ `origin` ajouté, `rights` mis à jour, ancien texte conservé dans `source.sheet.history`, décision datée ajoutée
  à `approvals` ; modifications ciblées (le reste du fichier inchangé à l'octet). Manifeste : note de la référence mise à jour en citant
  l'ancienne formulation ; **approbation de la baseline intacte** (`approved`, `runtimeUse: "lab"`).
- README du paquet, README des personnages, contrat (statut, risque n° 1), README de preuves 4A-decies (sa dernière phrase annonçait une
  production bloquée) ; `verify-provenance.mjs` affiche le nouveau statut et la ligne droits / production, jamais comme une preuve.
- Vérifications : `verify-provenance` → **intact** (les 9 empreintes de la chaîne inchangées) ; avec la planche : `ok source sheet` ;
  `art:validate` 0 erreur. Aucun code du jeu modifié.
- La planche reste hors Git (stockage = approbation explicite de l'opérateur) ; sa seule copie dans le projet est dans `scratch/`.

## Passe 4A-terdecies — Droits d'usage, troisième planche, archivage de la source ; proposition du 2e PNJ (2026-10-16)

### Décisions opérateur (2026-10-16)
1. Planches Merchant District générées avec ChatGPT / OpenAI sous notre direction artistique ; **usage autorisé** comme sources et
   références artistiques, y compris pour des assets d'un jeu commercial, **sous réserve des droits de tiers applicables** ; selon
   l'opérateur, les conditions d'OpenAI attribuent à l'utilisateur les droits d'OpenAI sur les sorties, dans la mesure permise par la loi ;
   provenance confirmée par déclaration, **non certifiée cryptographiquement** ; ni l'absence de C2PA ne vaut interdiction automatique, ni
   les droits de tiers ne sont présentés comme vérifiés exhaustivement.
2. Troisième planche (« NPC CHARACTER REFERENCE SHEET », 14 personnages) : création originale ChatGPT, même ensemble mais génération
   distincte des 24 PNJ ; **référence complémentaire** (personnages importants, costumes, silhouettes élaborées) ; ne remplace pas la
   baseline ×2 v1.
3. Archivage versionné de `4.webp` dans `art-lab/characters/reference/sources/`, octets préservés, sans faux original ni C2PA fictif.
4. `dockworker-x2-v1` reste le standard visuel des PNJ ordinaires ; ces décisions n'autorisent pas à remplacer des PNJ de production.
5. Commit local permis ; ni push ni fusion sans autorisation ; ensuite rapport de conservation et proposition du 2e PNJ, sans production.

### Conservation — [OK]
- `reference/sources/merchant-district-night-npc-01-16.webp` : **copie à l'octet** (SHA-256 `1c3bc603…36ce`, 302 814 o, `cmp` identique à
  la copie de `scratch/`) + fiche `merchant-district-night-npc-01-16.source.json` (format, nature « copie réencodée, pas l'original »,
  noms d'origine, provenance déclarée, droits, dérivés et commande de reconstruction, « rien d'inventé »). `*.webp binary` ajouté à
  `.gitattributes` (Git ne touche jamais aux octets).
- `PROVENANCE.json` : `source.sheet.path` (la copie archivée), `storage` et `rights` à jour, anciennes valeurs dans `history`, décision
  datée dans `approvals` ; manifeste : `references[0].path` pointe sur la source archivée (approbation inchangée) ;
  `source-declaration.json` : troisième déclaration citée mot pour mot, troisième planche classée « complémentaire », anciennes valeurs
  dans `history`.
- `verify-provenance` vérifie désormais la source archivée par défaut ; **chaîne complète refaite depuis le dépôt** (`--rebuild`) : ×2
  plein et 64 couleurs **identiques au bit**, nettoyage rejoué **identique au pixel** à l'export approuvé ; contrôle négatif (autre planche)
  refusé. `art:validate` 0 erreur.
- Documentation : `reference/README.md` (dossier `sources/`, classement des trois planches), README du paquet et des personnages, contrat
  (statut, risque n° 1). Les planches PNJ 17-24 et « 14 personnages » ne sont **pas** archivées (archivage validé pour `4.webp` seul) :
  leurs empreintes sont consignées, leurs seules copies sont dans le dossier temporaire de la séance.

### Proposition du 2e PNJ — `art-lab/characters/briefs/npc2-proposal.md` (rien de commencé)
Recommandation : **la marchande** (rôle existant à l'étal du héros : comparaison au même endroit ; contraste de silhouette maximal avec le
docker). Méthode : prompt validé → génération ChatGPT par l'opérateur, **PNG d'origine téléchargé** → archivage à l'octet → mesure de la
grille avant acceptation → reconstruction ×2 → critique aveugle contre v1 → finition limitée (≤ 2 itérations) → validation en scène par le
chemin partagé + `dynwalk` → paquet de provenance, `runtimeUse: "lab"`, arrêt pour décision.

### Gouvernance
- **[?] Conflit de consignes signalé** : `AGENTS.md` (règle du 16/10) demande de pousser chaque commit d'une branche de travail ; la
  consigne de cette passe dit « ne pousse ni ne fusionne sans mon autorisation ». Appliqué : la consigne explicite de la passe (commit
  local seulement) ; arbitrage demandé. **Arbitré (opérateur, 16/10)** : la règle d'`AGENTS.md` reste la règle par défaut ; branche poussée.

## Passe 4A-quattuordecies — La marchande : décisions, correction de méthode ; archivage des deux autres planches (2026-10-16)

### Décisions opérateur (2026-10-16)
1. Proposition du 2e PNJ validée : **marchande adulte** ; **une seule figure originale**, entière, de face (pas une planche) ; le
   **nouveau prompt artistique de l'opérateur** remplace l'ébauche ; **hauteur monde 1,66 m** pour commencer, indépendante de la densité
   64 × 96. Niveau de qualité `dockworker-x2-v1`, référence stylistique la planche 01-16, aucun personnage existant reproduit.
2. **Correction de méthode** : ne pas forcer la génération initiale sur une grille de pixels parfaite si cela détériore le modelé, les
   expressions et les matières ; E2 a montré que le ×2 peut préserver une illustration riche et qu'un nettoyage trop strict dégrade ; la
   grille 64 × 96, la rangée des pieds 90 et les marges transparentes sont des contraintes de l'**asset reconstruit**, pas de l'illustration source.
3. Conservation versionnée des planches PNJ 17-24 et « 14 personnages », à l'octet, avec fiches de provenance ; classification artistique conservée.
4. Production : **attendre le PNG original** de la marchande ; ensuite source conservée sans transformation, provenance, ×2, comparaison
   au docker approuvé, au plus deux itérations Aseprite ciblées, Character Lab + A / B / C / D, stabilité et performances par le renderer
   partagé, critique indépendante. Ni roster, ni orientation, ni animation, ni remplacement de la marchande existante ; `runtimeUse:
   "lab"` jusqu'à validation explicite ; pas de fusion dans `main` avant que la tâche artistique soit terminée et acceptée.

### Archivage des deux planches — [OK]
- Copies retrouvées dans le dossier temporaire de la séance (images 2 et 3 collées le 15/10, 21:32:58 UTC), empreintes égales à celles
  déjà consignées ; copiées à l'octet (`cmp` identique) : `reference/sources/merchant-district-night-npc-17-24.webp` (SHA-256
  `3b30b930…d6d4`, 311 654 o, WebP 1448 × 1086) et `reference/sources/merchant-district-night-npc-character-reference-sheet.webp`
  (`05c101db…97af`, 377 714 o, 1122 × 1402). Même structure que la planche 01-16 : VP8X + profil ICC sRGB générique de 456 o
  (« Google Inc. 2016 ») + VP8 avec pertes ; ni EXIF, ni XMP, ni C2PA. Attribut binaire déjà en place (`*.webp binary`).
- Fiches `.source.json` : format, contenu lu sur l'image, classification (actuelle et ancienne), nature « copie réencodée, pas
  l'original », provenance, droits, aucun dérivé, usage comme référence par `porter-gm-v1`, « rien d'inventé ».
- Classification conservée : 17-24 = série des 24 PNJ (C) ; « 14 personnages » = référence complémentaire (C). L'ancien classement de la
  passe 4A (B « PNJ raffinés », C « roster de soutien », jamais confirmé) est gardé comme historique.
- `source-declaration.json` : 4e déclaration citée mot pour mot, chemins des trois planches, anciennes valeurs dans `history`. Manifeste
  `porter-gm-v1` : `references[].path` vers les planches archivées (catégories d'époque et note « MISCLASSIFIED » gardées, statut et
  approbation inchangés). `reference/README.md`, README des personnages et de l'Art Lab, `AGENTS.md` (commande) à jour.
- **Nouveau contrôle** : `npm run art:validate` vérifie chaque fichier de `reference/sources/` contre sa fiche (SHA-256, taille, nom) et
  signale un fichier sans fiche ou une fiche sans fichier. Contrôles négatifs sur une copie jetable (un bit inversé, un octet ajouté,
  fichier retiré, fichier sans fiche, fiche qui nomme un autre fichier) : 5 / 5 détectés ; copie intacte : 0. Dépôt : 3 sources OK, 0 erreur.

### Brief de la marchande — [OK] mis à jour, rien produit
- `art-lab/characters/briefs/npc2-proposal.md` passe de « proposition » à « brief validé » : décisions, prompt de l'opérateur cité tel quel
  (§ 6 ; l'ébauche reste dans `2bc05a6`), brief aligné sur ce prompt (35-40 ans, 3-3,5 têtes, châle, bourse, un seul accent ambré),
  contraintes séparées « illustration source » / « asset reconstruit », méthode en 10 étapes selon la liste de l'opérateur, critère
  d'originalité (côte à côte avec les marchandes des trois planches).
- Retiré : la règle de la proposition « une source sans grille propre est régénérée, pas réparée ». La mesure de la source règle la
  reconstruction, elle ne la refuse pas ; une régénération ne se décide que sur l'art (opérateur).
- **[?] Risque signalé** : une figure seule en grand donnera ≈ 10-15 px source par texel (v1 : 1,775) ; la médiane de 9 points de
  `reconstruct-grid.mjs` n'a été validée que sur des blocs de ≈ 3,5 px : à mesurer sur la source (contre une moyenne par case) avant de choisir.

### Pensée
- La règle « régénérer une source sans grille » de la proposition contredisait E2 : la planche de référence elle-même n'est pas du pixel
  art strict (4A-bis) et le ×2 n'a de la forme que parce qu'il rééchantillonne la peinture à l'intérieur des blocs (4A-quater). Les
  contraintes de format appartiennent à l'asset reconstruit.

### Pièce jointe pour la génération — [OK] préparée, non versionnée
- Demande de l'opérateur : une version agrandie au plus proche voisin de `dockworker-x2-v1`, à joindre au prompt de génération (l'export
  de 64 × 96 serait illisible pour le générateur).
- Depuis l'export approuvé (`exports/dockworker-x2-v1.png`, SHA-256 `9e1de3ba…8441`), dans `art-lab/characters/scratch/npc2-merchant/attachments/`
  (ignoré par Git) : `dockworker-x2-v1-x8.png` (×8 exact, fond transparent, 512 × 768, SHA-256 `a0616dc3…360b`) et
  `dockworker-x2-v1-x8-neutral.png` (×8 sur gris neutre uni `#808080`, 608 × 912, SHA-256 `891c3f63…bfdf`) : figure de 41 × 89 texels
  (boîte 13,2 → 53,90) placée en (17 ; 12) sur un cadre de 76 × 114 texels (2:3, marges larges), alpha binaire aplati.
- Vérifié : chaque bloc 8 × 8 relu dans les fichiers écrits = le texel attendu (0 écart) ; l'export n'a aucun texel d'alpha partiel.
  Codec exact `tools/art-lab/png.mjs` (sans gestion de couleur) ; paramètres, empreintes des fichiers et des pixels dans
  `attachments-report.json` à côté : les pixels se refont à l'identique.
- À la livraison : relever quelles images l'opérateur a jointes ; si c'est l'un de ces fichiers, comparer son empreinte et l'archiver avec
  la fiche de la source.

### Prompt v2 de l'opérateur et revue — [?] décision de l'opérateur
- Reçu de l'opérateur : un second prompt, écrit pour accompagner les images jointes (docker ×8, références de style du Merchant District),
  qui reprend la mise en garde « ne pas copier le docker ». Consigné tel quel dans le brief (§ 6.2) ; le prompt effectivement utilisé reste à
  confirmer à la livraison.
- **[?] Risque d'originalité** (planche 01-16 relue à côté du brief, recadrages ×2) : n° 02 « Merchant (Female) » porte déjà la combinaison du
  brief — chignon brun, robe bleue, tablier ivoire, petite bourse (plus coiffe blanche à volant, col blanc, manches bouffantes blanches) ;
  n° 03 « Artisan (Female) » le chignon, le tablier et la sacoche ; n° 09 « Townswoman (Female) » le fichu bleu clair et le tablier ivoire.
  Avec cette planche jointe comme référence de style, le générateur a sous les yeux une marchande très proche de la demande ; or le but du
  2e PNJ est de prouver un personnage **original** au niveau de v1 (4A-quinquies). Liste de contrôle d'originalité du brief (§ 4) complétée.
- Contraintes de v1 absentes de v2 qui comptent pour la reconstruction ou les critères : fond **uniforme** (extraction) ; les deux bottines
  visibles sur la même ligne de sol (rangée 90) ; 3-3,5 têtes, pas de chibi ; un seul accent ambré ; mains lisibles ; ni tramage, ni bruit,
  ni rayures mécaniques (ils se reconstruisent en moucheture : 4A-quater). Nouveau dans v2 : « de face ou très légèrement tournée »,
  compatible avec le repos de face de v1 (lui-même légèrement tourné).
- Proposé à l'opérateur, **non validé** : ajouter à v2 le bloc ci-dessous (ou joindre la planche sans les n° 02, 03 et 09).
  ```text
  Additional requirements:
  * Do not copy any character from the attached reference sheets, especially "02. Merchant (Female)", "03. Artisan (Female)" and "09. Townswoman (Female)": same world and quality, clearly different design; avoid their signature elements (white frilled cap or bonnet, white lace collar, puffed white sleeves).
  * Adult proportions, approximately 3–3.5 heads tall; not chibi.
  * One small warm amber accent only (belt buckle or trim); no other bright warm colour: hair, leather and skin stay muted.
  * Clearly readable hands.
  * Both boots fully visible, both feet on the same ground line.
  * Background: one flat, uniform neutral colour; no gradient, no vignette, no floor, no cast shadow.
  * Clean pixel clusters: no dithering, no scattered noise, no mechanical stripes, no pillow shading.
  ```
- Pensée : une combinaison de traits peut déjà décrire un personnage existant ; le brief se compare aux références jointes **avant** la
  génération, pas seulement le résultat après.

## Passe 4A-quindecies — La marchande : source originale archivée, reconstruction ×2, scène A-D ; source à régénérer (proportions) (2026-10-16)

### Décisions opérateur (2026-10-16)
- La nouvelle image de marchande (ChatGPT, prompt V3) est la **source artistique originale approuvée** du 2e PNJ expérimental ; le sprite
  ne l'est pas ; préserver au maximum l'illustration ; `runtimeUse: "lab"` ; ni roster, ni orientation, ni animation, ni remplacement de la
  marchande de production ; pas de fusion dans `main`.
- Réponses aux questions : PNG d'origine déposé (retrouvé sur le bureau de l'opérateur) ; V3 = v2 + bloc d'ajouts proposé ; image jointe :
  le docker ×8 gris seul. Les planches renvoyées par l'opérateur (« base commune » de tous les personnages) sont les trois déjà archivées.
- Après la comparaison en scène : « c'est surtout un problème de proportion » → **régénérer la source** (même dessin, proportions de la base
  commune ; prompt V4).

### Source — [OK] archivée à l'octet, C2PA lu
- La pièce jointe de la séance n'est qu'une copie WebP transcodée (61 Ko, ICC générique). Le PNG d'origine (`marchande_en_pixel_art_livre_en_main.png`,
  1 349 750 o) a été retrouvé sur le bureau ; correspondance chiffrée : écart moyen 1,01 / 255 (PSNR 44,2 dB), témoin décalé de 16 px : 10,19.
- Archivé tel quel : `reference/sources/npc2-merchant-source-2026-10-16.png` (SHA-256 `e3292f6d…196b`) + fiche (`art:validate` le contrôle).
  PNG 1024 × 1536 RGB, morceaux IHDR / caBX / IDAT / IEND.
- **C2PA OpenAI présent** : c2pa.created par ChatGPT (gpt-image), trainedAlgorithmicMedia, 2026-10-16T23:38:51Z ; générateur « OpenAI Media
  Service API » ; **liaison dure (c2pa.hash.data) recalculée : identique** ; signature non validée (c2patool non installé). Lecture seule.
- Écarts au brief, approuvés par l'opérateur avec la source : tresse auburn au lieu du chignon, ni châle ni tablier, gilet ardoise, carnet
  d'inventaire, plusieurs accents laiton.

### Analyse et reconstruction — [OK] chaîne déterministe, deux options d'outil
- Fond gris (124 ; 124 ; 124), écart-type 0,7, valeurs 120-128, coins identiques. Figure 499 × 1 223 px ; grille d'art ≈ 11,3 px (x 11,40 ;
  y ≈ 11,2, irrégulière), soit ≈ 108 pixels d'art : **la source est plus fine que le cadre** (≤ 89 rangées) ; la reconstruction **réduit**
  (≈ 0,81 texel par pixel d'art) alors que celle du docker doublait.
- Pas 13,9 / 14,3 / 14,75 / 15,3 / 15,7 testés (figures 88 / 85 / 83 / 79 / 78 texels) : **13,9 retenu** (visage, doigts, accessoires).
  La bouche (un tiers de pixel d'art de haut) disparaît à tous les pas.
- `reconstruct-grid.mjs` : deux options **désactivées par défaut**. `--holes` rend transparents 21 texels de fond enfermé (poche du cou 16,
  bras 3, main 1, mèches 1), **après** la fermeture verticale : la première version les vidait avant, et la fermeture les remplissait de noir
  (38 texels fermés au lieu de 26). `--no-shadow` : la règle d'ombre des planches mangeait 7 texels des semelles (rangée 90). Les 26 texels
  fermés sont tous sur le contour.
- Sans option, sortie inchangée : la reconstruction du docker refaite est **identique au bit** (pleine, 64 couleurs) et son nettoyage rejoué
  au pixel. L'empreinte de l'outil, figée dans le paquet du docker, est mise à jour avec une note de maintenance (ancienne empreinte gardée).
  `verify-provenance` transmet désormais `reconstruction.options` à l'outil.
- 64 couleurs : erreur OKLab moyenne 9,5 ‰ (visage 6,3, max 33,4), sous les 12,1 ‰ acceptés pour le docker ; pleine / 96 / 64 indiscernables à
  ×5 ; 48 / 32 aplatissent la peau et la jupe.

### Finition — [OK] itération 1 (18 texels), rejouable
- 13 texels de frange grise du contour (docker : 0) → voisin sombre le plus proche ; encoche des cheveux (19,19) refermée ; contour de la
  mâchoire sur la poche du cou (2 texels) ; bouche restituée (2 texels `#c37958`, valeur de la source `#c67754`). Sourcils doux dans la
  source aussi : non touchés. Aseprite `validate` 100 ; `replay-pixel-ops` = export au pixel.
- Paquet `provenance/merchant-x2-v1/` (déclaration mot pour mot, `PROVENANCE.json`) : `verify-provenance --rebuild` **intact** depuis la
  source archivée. Manifeste `experimental`, non approuvé, `runtimeUse: "lab"`.

### Validation — [OK] Character Lab et scène A-D
- Character Lab : 0 texel faux à 1×, 4× et à l'échelle runtime, A-D ; contrôle négatif (linéaire) en échec (32 407 / 40 445).
- Chemin partagé (`?baked=`, repli `bakedfallback=front-idle` explicite, amendement B) : captures déterministes A-D. **Non-régression : 0 px**
  (répétition ; marchande chargée non placée ; marchande + docker chargés) dans les 4 cadrages.
- Projection (1080p) à 1,66 m : A 0,88 px écran / texel, B 1,81, C 1,8-2,1, D 1,6-1,9 (docker à 1,88 m en B : 2,03).
- Lecture en jeu : tresse, visage, gilet, carnet, jupe lisibles en B / C / D. En D le bas de la jupe se fond dans les pavés (comme le pantalon
  du docker) ; la poche du cou laisse voir le décor (tache claire en B) ; à l'emplacement exact de la marchande en B, la lanterne de l'étal
  masque le visage (placement).
- Liseré : le chemin partagé n'a pas de réglage par sprite (intensité par acteur selon les lumières, `uEdge` global) ; L1 exigerait de changer
  l'éclairage de tout le cast, exclu : montré en L0 comme le docker.

### [KO → décision] Proportions et taille
- Opérateur : le passant généré paraît « plus gros et imposant ». Mesuré dans l'atlas : la marchande générée **dessinée** fait 1,88 × 1,08 m
  (23 × 40 texels × 0,047) ; son 1,66 m n'est que la valeur **nominale** `HEIGHT` (ombre, bulle) : mon brief l'avait prise pour sa taille
  (corrigé). Cast : héros 1,93 × 1,13 ; porteur 1,65 × 1,03 ; forgeron 1,88 × 1,22. Nouvelle marchande à 1,66 m : 1,66 × 0,68 m.
- Comparaison à même profondeur (pieds sur la même ligne d'écran), 1,66 / 1,88 m : la hauteur se règle, **pas la carrure**. Sur les sprites ×2 :
  tête 0,26 de la hauteur (≈ 3,8 têtes) contre 0,33 (≈ 3,1) pour le docker ; largeur de tête 0,29 / 0,35 ; épaules 0,35 / 0,40 ; largeur
  maximale 0,41 / 0,48. La chaîne conserve exactement le rapport de la source (0,41 / 0,41) : **le défaut est dans la source** (le prompt V3
  demandait 3 à 3,5 têtes).
- Décision opérateur : **régénérer**. Prompt V4 au brief (§ 6.4) : même dessin, proportions du docker chiffrées, deux images jointes (la source
  V3 pour le dessin, le docker ×8 pour les proportions) ; contrôle des proportions sur la source avant toute reconstruction.
- Non fait sur ce candidat, reporté au nouveau : critique aveugle (auto-évaluation écrite, critique non lancée), marche dynamique, perfs GPU.

### Pensée
- Une hauteur nominale du code n'est pas la taille dessinée : mesurer la figure dans l'atlas avant de fixer une hauteur de présentation.
- La chaîne conserve exactement les proportions de la source, elle ne les corrige pas : les proportions se chiffrent dans le prompt et se
  mesurent sur la source avant de reconstruire (part de la tête, largeur de tête, épaules), contre la base commune.

Preuves : `art-lab/characters/reviews/merchant-x2-v1/` (planches + README) ; captures brutes et scripts dans le dossier de travail de la séance.

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

## Passe 4A-tervicies — Distribution : la foule du quartier marchand, cinq citadins cuits (candidats) (2026-10-17)

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
  générée / candidats, rapport des captures). Manifestes `status: candidate`, `approved: false`, `runtimeUse: "lab"` ; paquets
  `CANDIDATE`, `approvals` vide. **En attente de l'approbation de l'opérateur** ; aucun personnage déclaré Gold Master.

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

---

## À reprendre (par priorité)

**-2. Fenêtres étroites (Passe 5)** — bake par pages bornées + repli explicite + recadrage du cadre 16:9 : bâtiments présents à tout format
testé (390 × 844 à 2560 × 1080), rendu canonique 16:9 identique au pixel (24 vues, trois graines). **Tâche acceptée par l'opérateur le 17/10**
(« J'accepte la Passe 5 et le recadrage des fenêtres étroites tel quel : fusionne viewport-visibility-fix dans main, pousse main et supprime
la branche. ») : recadrage gardé tel quel, branche fusionnée en avance rapide dans `main` puis supprimée. Écarts de culling hérités :
élucidés en Passe 5b (ci-dessous).

**-2b. Écarts élagué / `vis=0` (Passe 5b)** — chaque écart expliqué et prouvé (pièce forcée → 0 px, faces échangées → 0 px, MSAA seul) :
ordre de dessin de faces coplanaires du quai lointain (30417 B, AB), lanières plus fines qu'un pixel de bake (murs latéraux vus de chant en D,
maison 609 entre deux poses AB), fissures vues par un seul échantillon MSAA (7719 C, 30417 CD). Correctif : tuiles fines ×2 pour les poses
stables de D (`BAKE_FINE`, ≈ +18-20 ms de bake), rendu canonique identique (25 / 27 vues à 0 px, les 2 autres = lanières désormais dessinées),
`viewport-proof` 22 → 9 échecs ; témoin d'ordre dans `viewport-proof`, `tools/vis-why.mjs`. **Tâche acceptée par l'opérateur le 17/10**
(« J'accepte la Passe 5b telle quelle (tuiles fines ×2 pour D) : fusionne vis-residue-5b dans main, pousse main et supprime la branche. ») :
branche `vis-residue-5b` fusionnée en avance rapide dans `main` (`77621bb`) puis supprimée (locale et distante). **Restent à décider par
l'opérateur** : D ×4 (+75 ms), poses AB à w = 0,5 pour 609, corrections de géométrie (fissures, quai coplanaire) qui seules rendraient
l'outil vert.

**-1. PROCHAIN** — Passe 4A-undecies close : adressage par case entière commité (sprites générés identiques au bit à `eecea58`, ×2 stable
quelle que soit la taille de l'atlas, aucun débordement, aucun appel en plus) ; écart de l'ombre portée du ×2 face à l'ancien aperçu
(3-67 px par vue, ≤ 12 / 255) **accepté par l'opérateur** : l'ombre suit la règle entière du corps. Restent ouverts : C2 (PNG versionné) à confirmer ;
droits : usage comme source **autorisé** (16/10, sous réserve des droits de tiers, non vérifiés exhaustivement), les trois planches archivées dans
`reference/sources/` (octets contrôlés par `art:validate`) ; les originaux restent à retrouver (l'opérateur s'en charge). **Fait : distribution de production active** (Passes 4A-sedecies / septendecies) : `dockworker-x2-v2` (porteur) et `merchant-x2-v2`
(marchande de l'étal) approuvés le 17/10 et chargés par le jeu. **Tâche acceptée par l'opérateur le 17/10** (« La tâche est terminée et
acceptée : fusionne la branche dans main, pousse main et supprime la branche. ») : branche `character-gold-master-4a-1` fusionnée en avance
rapide dans `main`, puis supprimée. La prochaine tâche ouvre sa propre branche. Restent ouverts : la marchande ne marche pas à son étal (collisionneur ; la déplacer de 0,5 m serait une
décision de mise en scène), foulée du docker 0,69 m/s contre 0,8-0,95 (léger glissement), bonnet / sac selon la planche. `merchant-x2-v1` reste comme
preuve ; la source V4 n'est plus attendue. Restauration : `5d10a37`. Branche poussée à chaque commit (règle `AGENTS.md`).
**-1b. Fait (Passes 4A-duodevicies / undevicies)** : `blacksmith-x2-v1`, `guard-x2-v1` (les deux gardes), `hooded-x2-v1` **approuvés pour la
production le 17/10** et chargés par le jeu (cinq planches cuites). **Tâche acceptée par l'opérateur le 17/10** (« La tâche est terminée et
acceptée : fusionne la branche cast-blacksmith-guard-hooded dans main, pousse main et supprime la branche. ») : branche fusionnée en avance
rapide dans `main`, puis supprimée (locale et distante) ; la prochaine tâche ouvre sa propre branche. Décisions de mise en scène ouvertes : un second garde différent (miroir ou variante) au lieu de
jumeaux, lances. Restent générés : héros, chat, foule.
**-1c. Fait (Passe 4A-vicies)** : forgeron tourné vers l'enclume (`Math.atan2(0.55, -0.25)`), frappe côté enclume en A, B, C, D et mélanges,
D et forge sabotée identiques au pixel ; change l'image de démarrage en A, B, C. **Approuvé par l'opérateur le 17/10** et **fusionné dans
`main`** (avance rapide, à sa demande) ; la branche partagée `cast-polish-facing` reste ouverte pour les correctifs de distribution de l'autre
séance. Observation ouverte : tête du marteau cuit peu lisible sur la lueur de l'enclume.
**-1d. Fait (Passe 4A-unvicies)** : traits noirs du cou retirés des cinq planches (fermeture verticale seulement sous la rangée 48,
palettes approuvées épinglées, jambes identiques aux planches approuvées) et vue des marcheurs tirée de leur pas projeté à l'écran ; fusionné
dans `main` à la demande de l'opérateur (« si la tache est fini on peut commit/push vers main »). (a) **Fait (Passe 4A-duovicies)** : planches
révisées montrées une à une et approuvées par l'opérateur le 17/10 (« Les cinq planches révisées me conviennent. »). Ouverts : (b) à juger en
mouvement : la bande 40° / 50° et les diagonales du joueur, désormais de profil ; (c) défauts hérités des planches approuvées relevés par la
critique à l'aveugle (manches du docker coupées par le balancement des bras, trous du tabard du garde, main du passant, jambe arrière du garde
de profil, contour de bras du forgeron de dos, chaussure de la marchande) : passe de rig **faite** (Passe 4A-duovicies, branche
`cast-rig-fixes`) : les cinq planches corrigées dans leur script de rig (critiques à l'aveugle, révisée contre précédente : garde 7 / 4,5,
passant 8 / 5, forgeron 7,5 / 5,5, marchande 7 / 6, docker 8 / 5 au troisième tour), **approuvées par l'opérateur le 17/10**
(« J'approuve les cinq planches corrigées de la passe C3 pour la production : fusionne cast-rig-fixes dans main, pousse main et supprime la branche. ») ; branche fusionnée en avance rapide dans `main` puis supprimée (locale et distante). Défauts hérités relevés par ces critiques, hors de la liste, **non traités** : (d) marchande : de
profil les deux chaussures se fondent en une semelle (images 2, 5 ; barre noire en 4), de face / dos le corps saute de 2 texels de côté
(`SHIFT`) ; (e) garde : le coin du galon d'ourlet au bout de la cape de profil se lit comme un talon détaché, la jambe arrière presque
toujours cachée de profil ; (f) passant : une bande sombre de l'ourlet arrière pend derrière le talon de profil ; (g) forgeron : épaule
gauche crénelée de face, contours du poing gauche qui alternent ; (h) docker : dessus de casquette en barre sombre aux coins cassés (toutes
les images), bras étiré qui s'allonge un peu en marche de face. Branche `cast-polish-facing` supprimée (locale et distante) à la demande de l'opérateur.
**-1e. Foule (Passe 4A-tervicies, branche `cast-crowd`)** : cinq citadins cuits **candidats** (`artisan-x2-v1`, `traveler-x2-v1`,
`townswoman-x2-v1`, `older-merchant-x2-v1`, `courier-x2-v1`) à la place de `crowd0`..`crowd4` derrière `?cast=candidate` (DEV) ; critiques à
l'aveugle finales 6-6,5/10 (3-3,5 pour la foule générée qu'ils remplacent) ; démarrage par défaut 0 px. **En attente de l'approbation de
production de l'opérateur.** Décisions ouvertes : bras immobiles en marche (reproche commun des critiques), costumes différents selon la vue
(fidèles aux planches), seuls 2 des 5 citadins visibles à la graine 1842 et à la densité 1, cycle sans double appui. Ensuite, dans l'ordre
demandé : ménage M1 (HD-2D-visbase : jonction `node_modules` d'abord, jamais sa cible ; worktree `kind-wilson` détaché et la branche locale
`claude/kind-wilson-a0fa95` ; entrées `base-cast3` / `base-main5` de `.claude/launch.json`), défauts hérités -1d (d)-(h) branche par branche,
performances GPU (`tools/perf.mjs`, base figée).
**-0c. Point de QA (pas une tâche)** : PNJ ×2 près de 1 px écran / texel (caméra A, PNJ lointains) : détails d'un texel qui clignotent ; surveiller à chaque nouveau PNJ.
Mesuré à la passe 4A-duodevicies : gardes de la barrière à 0,5 (A) et 1,05 (B) px / texel.
**-0d. Occlusion (problème indépendant, Passe 3)** : un montant sombre de la bannière du bateau n'est pas découpé par le reveal et coupe le joueur ; la casquette tombe dans la bande
tramée ; la trame « rampe » quand l'ellipse bouge. Ne rien changer sans inventaire visuel et technique (`tools/occ-inventory.mjs`) qui justifie un nouvel occluder.
Avant d'étendre : densité du cast (héros), liseré dépendant de la densité, largeurs de texel inégales à ≈ 2 px / texel, cycle de marche en A, personnage **original** au même niveau.
Pas de roster, de généralisation ni de personnage clé ; E4 **non lancée**. Le modelé ×1,5 n'est plus la voie principale. Décisions ouvertes : liseré par sprite (non implémenté),
quelles planches étaient réellement rejetées (la consigne de 4A en parlait sans les montrer ; les trois planches archivées sont toutes classées comme références). `porter-gm-v1` reste une baseline expérimentale.
Garder pour toute passe d'art : pont persistant, Aseprite relancé après lui, test de fumée `smoke-test/4a0b/` après toute mise à jour (épinglé 0.8.2, auto-update coupé), critique par agent neuf (cf. `art-lab/README.md`).
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
2b. **Fait (Passe 5b)** : le pixel (1244 ; 185) de D (26 ; 3,5) en 1280 × 720 était la lanière du mur ouest d'east3 (partie 89, étage 2) vue
   de chant, sous le pixel de bake ; gardée en D par les tuiles fines (0 px en 1080p et 720p ; en 2560 × 1080 restent 2 lanières + 1 fissure).
3. **Coût de régénération** (+250 ms de la passe 2, ≈ +150–180 ms de la passe 3b, **≈ +180 ms de la passe 4B** : 505–523 → 682–715 ms ; bake 200 → 330 ms pour 273 poses ;
   passe 5 : bake par pages 367 → 300 ms en médiane, génération ≈ 910 ms avec la distribution actuelle) :
   mettre en cache les identifiants par graine, ou n'échantillonner que les poses concernées quand seul un réglage de caméra change ; réduire CD / BD (168 poses sur 273) a coûté 4 pièces de Tier 3 en précision : à ne faire qu'avec une preuve.
3b. **Ordre des classes de dessin** : 41 classes, A/B/C pondérés ×2 (D dessine ≈ tout : 98,8 k / 100,8 k). Si D devient lourd (nouveau contenu), rejouer `planDraw` avec un autre poids ou séparer D dans un mesh à part (+ appels de dessin).
3c. **Rive opposée / z caméra** : la caméra de D doit rester à z < ~18,5 (maisons de la rive opposée dès z = 19,8). Tout cadrage plus reculé exige de retirer ou d'abaisser ces maisons (elles sont aujourd'hui invisibles de A/B/C).
4. **Rendu** : MSAA 4× → test d'un MSAA 2× / FXAA après le travail sur les sprites ; DOF et bloom à demi-résolution.
5. **Autres graines** — **élucidé en Passe 5b** (voir -2b) : reste dans `viewport-proof` 9 échecs connus, tous expliqués : fissures MSAA
   (7719 C, 30417 CD 720p, 1 px de 1842 D 2560 × 1080), lanières non attrapées à ×2 (30417 D 720p / 665 × 1200 : partie 73 ; 1842 D 2560 × 1080 ;
   7719 AB 665 × 1200), maison 609 (30417 AB). Pixels « order » (30417 B 109 px, AB 31 px, A / BC 1 px en 720p) rapportés sans échouer.
   Tout nouvel écart : `tools/vis-why.mjs` avant de toucher au bake.
5b. **Écart hérité** : 17 px d'étincelle dans le canal coupés par le bake (B, joueur 15,5 ; −2,7) — voir `known-issues/pass2-vis-speck.png`.
   Passe 5b (1842, 720p) : aujourd'hui 6 px ; 6 lanières forcées (reflets de maisons de la ville moyenne, murs est de `bg2` / `tall`) → 1 px,
   non élucidé [?].
6. **Dette** : l'ancienne rive opposée (`row(...)` en « sec ») rejoue ses tirages sans rien dessiner — à retirer proprement
   une fois qu'on accepte de décaler la ville lointaine d'une graine.

## Principes à garder

- Une allocation GPU se dimensionne contre le minimum garanti (WebGL2 : 2 048) et se vérifie (complétude du framebuffer, erreurs GL) ; un bake
  qui conclut « rien n'est visible » est une erreur : le repli garde toutes les pièces et le signale (console, stats, panneau).
- Un résultat de visibilité ne vaut que pour le cadre baké : une fenêtre plus étroite montre un recadrage de ce cadre (décentrement d'objectif,
  joueur au même NDC), jamais un champ plus large ; plus large que le cadre baké, on recadre puis on re-bake.
- La rastérisation dépend de la position d'une tuile dans sa cible : les comptes bruts ne se comparent qu'à mise en page égale ; la
  non-régression se prouve sur les masques et les images finales.
- Un écart élagué / `vis=0` s'explique **causalement** (`tools/vis-why.mjs` : pièce forcée → 0 px ; témoin d'ordre) avant de toucher au bake ;
  un pixel décidé par l'ordre de dessin (faces coplanaires) ou par un seul échantillon MSAA (fissure) ne dit rien du culling.
- Le bake échantillonne des points : monter sa résolution fait aussi perdre des pièces ; un supplément s'ajoute aux comptes (tuiles fines
  additives) et va là où la géométrie se présente de chant (D). Toute modification des masques replanifie les classes : prouver le rendu
  canonique contre une base figée, pas seulement contre `vis=0`.

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
- Un personnage se juge **dans la scène** à chaque itération (aperçu `?labsprite`, avant / après au même endroit), pas seulement agrandi : lumière chaude, liseré et voisinage du cast changent la lecture.
- Une critique d'art doit voir l'image, lire à froid avant la consigne, citer des pixels, et vérifier la passe précédente ; le score monte avec des preuves, pas avec des intentions.
  Un « 0 trou » / « 0 écart » se prouve par un contrôle objectif (remplissage depuis le bord ; contrôle négatif du Lab).
- Le classement des références (cible / support / rejet) se fait **confirmer par l'opérateur avant de produire** ; on mesure une référence (grille, taille, couleurs) avant d'en déduire
  une contrainte de résolution ou de technique.
- Un modelé se peint par **masses** (3-4 valeurs par forme, plis rendus par le bord des aplats) ; une spécification pixel par pixel écrite en texte donne de la moucheture (alternances)
  ou des blocs. La forme vient d'abord de l'information de la source (densité, dégradés peints) ; la finition par agent est fiable pour les défauts **nommés et localisés**, pas pour repeindre un volume.
- Une métrique de propreté (pixels isolés, alternances) n'est pas une métrique de forme : seule une critique aveugle juge la lecture du volume. Critique à l'aveugle = étiquettes tirées au sort,
  clé hors du champ du critique, nouvel agent à chaque tour, auto-critique écrite **avant** de lire le verdict.
- Préserver d'abord la qualité de la source artistique, puis une finition ciblée sur des défauts nommés ; un sprite se valide **à côté du cast existant** (héros compris) :
  densité de texel, proportions et hauteur monde se comparent à la même profondeur, pas seulement contre la référence.
- Une mesure de stabilité en mouvement doit d'abord prouver qu'elle sépare un cas connu mauvais (contrôle négatif) ; sinon elle ne vaut que comme indice et le jugement reste visuel.
- Retouche ciblée : changer la **chroma** d'une zone fautive en gardant ses valeurs corrige sans repeindre ; ajouter une masse sombre crée un nouveau motif (ras-de-cou). Une retouche
  qui ne gagne pas clairement à l'aveugle est annulée, pas empilée.
- Une marche capturée se fait à **pas fixe** avec les **vraies entrées**, sur un itinéraire d'abord validé sans rendu (`camsim`) ; chaque image se rend avant d'être capturée ; un
  témoin (même art, autre densité, **même renderer**) sur le même trajet est la seule référence qui donne un sens aux chiffres de stabilité.
- Une approbation visuelle se fige tout de suite : empreintes SHA-256, paramètres, décisions datées, script de vérification ; un artefact approuvé ne vit pas seulement dans un
  dossier ignoré sans que l'opérateur le sache.
- Deux niveaux d'approbation distincts : *approved visual baseline* (`approved: true` + `runtimeUse: "lab"`) et *approved production asset* (`runtimeUse: "production"`, tâche
  explicite + droits confirmés). Une source aux droits non confirmés s'archive par empreinte, jamais par copie dans Git.
- Plusieurs densités de sprites partagent un seul renderer si chaque densité *k* garde le même rectangle monde (cadre 32k × 48k, pieds à 45k) : la densité est une affaire
  d'atlas, la hauteur une affaire d'instance.
- Une image qui sert de référence se garde **dans son fichier d'origine** (PNG téléchargé, manifeste C2PA intact) dès le premier jour : une copie collée en séance est transcodée
  et perd toute provenance. Une correspondance visuelle se chiffre contre des témoins (elle-même = 0, planche sœur = 23) avant d'être affirmée ou exclue.
- Un plafond matériel se cite au minimum **garanti** par la norme (WebGL2 : 2 048), pas à la valeur de la machine de développement.
- Une preuve « pixel-identique » exige une capture déterministe : `Math.random` à graine, pas fixes, horloge figée, RNG internes remis à
  zéro, une chauffe par cadrage, et un témoin de répétition (deux chargements : 0 px) **avant** toute comparaison.
- Des octets identiques ne garantissent pas une image identique : `floor(vUv × taille)` départage les égalités exactes (bord de texel au centre
  d'un pixel) selon la taille de la texture. Toute croissance d'atlas se prouve par un balayage d'échelles, pas par quelques captures.
- Ne jamais modifier `src/` pendant une série de mesures sur le même serveur dev (rechargement HMR) ; recadrer une preuve par projection,
  jamais par supposition.
- Ajouter des sprites ne doit rien changer aux autres : une texture qui ne grandit jamais pour les sprites validés, et pour les nouveaux un
  adressage par case entière (t ∈ [0, 1] × taille de case, plancher + clamp, lecture au centre du texel) qui ne dépend ni de la taille de
  l'atlas ni de la place de la case. Une formule normalisée par la taille de la texture ne peut pas être stable aux égalités exactes.
- Une chauffe se fait par cadrage **et par origine** (serveur) ; un écart d'un niveau sur 255 se traque par sondes de variantes du shader.
- Une provenance confirmée par l'opérateur se consigne **mot pour mot et datée**, distincte d'une vérification technique (C2PA) ; ce qui
  manque ne se déduit pas. L'absence d'original n'interdit pas à elle seule la production : droits et autorisation s'évaluent à part. Un
  statut remplacé se garde dans un historique, jamais effacé.
- Une source archivée se versionne **à l'octet** (empreinte et `cmp` avant commit, attribut binaire) avec une fiche : nature (copie ou
  original), provenance déclarée, droits, dérivés et commande de reconstruction ; jamais de faux original ni de métadonnée fabriquée ;
  `art:validate` revérifie ses octets contre la fiche à chaque passage, contrôle négatif à l'appui.
- Les contraintes de l'asset reconstruit (cadre 64 × 96, pieds rangée 90, anneau transparent, alpha binaire) ne s'imposent pas à l'illustration
  source : on ne dégrade jamais le modelé, l'expression ou les matières d'une source pour obtenir une grille parfaite ; la mesure de la source
  règle la reconstruction, elle ne la refuse pas.
- Avant une génération, comparer le brief lui-même aux personnages des références qui seront jointes : une combinaison de traits peut
  déjà décrire un personnage existant ; la liste de contrôle d'originalité nomme ces personnages.
- Une hauteur de présentation se décide sur la figure **dessinée** (mesurée dans l'atlas), pas sur une valeur nominale du code ; une carrure
  ne se corrige pas par l'échelle : les proportions se chiffrent dans le prompt et se mesurent sur la source avant toute reconstruction.
- Un outil figé par empreinte dans un paquet approuvé s'étend par options désactivées par défaut, prouvées par le `--rebuild` du paquet ;
  l'empreinte se met alors à jour avec une note de maintenance (ancienne valeur gardée).
- Les vues qu'il faut à une marche (face, dos, profil) se prennent sur une planche multi-vues de la même échelle, jamais inventées depuis une
  seule face ; la recette entière (recadrages, palette, retouches, animation) vit dans un script de rig rejouable au texel près.
- Un mouvement destiné à se lire en jeu se dimensionne en pixels écran (2 texels à ~1,8 px / texel), pas en texels de la planche.
- Une approbation de production ne s'écrit jamais au nom de l'opérateur : l'intégration se prépare derrière la porte du manifeste et
  l'opérateur l'ouvre.
- Après toute reconstruction, chercher les bandes quasi noires de la fermeture verticale entre deux masses (nuque / épaules, entre les jambes)
  et les comparer à la planche, pas à la reconstruction : elles se lisent comme des cheveux ou des sangles qui n'existent pas. Remède retenu
  (4A-unvicies) : `reconstruct-grid --closing-from=48` : pas de fermeture au-dessus de la taille, gardée en dessous (elle y restaure les
  contours sombres des jambes et des bottes ; la couper partout les a perdus) ; compter avant / après le fond enclavé et les zones des pieds.
- La révision d'un asset approuvé se projette sur sa palette approuvée, épinglée en fichier (aucune couleur nouvelle), et s'inscrit à côté de
  l'approbation (demande citée, empreinte précédente, comptes de texels) ; la confirmation de l'opérateur se demande, elle ne se présume pas.
- La vue d'un personnage qui marche se tire de son pas projeté à l'écran (avec hystérésis), pas de l'angle de son cap avec l'axe de la
  caméra : sous un tangage de 8°, 20° de cap font déjà ~55° à l'écran. Un regard mis en scène (spawn, conversation) garde la règle monde.
- Un personnage plus grand que le cadre se rééchantillonne à un pas plus grossier et se présente à l'échelle commune : une densité de texel
  unique dans la scène prime sur la taille relative de la planche (écart chiffré et consigné).
- Un mouvement de marche se fixe explicitement (rebond imposé de 2 rangées au contact), il ne se déduit pas seulement de l'IK ; une
  affirmation de critique se mesure (rangées, texels) avant d'être corrigée.
- Une texture partagée se dimensionne contre le minimum garanti (WebGL2 : 2 048) pour la distribution entière, candidats compris, avant de
  les ajouter ; l'adressage par case entière permet d'élargir sans changer une image.
- Un cycle synchronisé avec un effet (étincelles du marteau) garde son nombre d'images et l'image de l'impact ; le moteur n'a pas de durée
  par image.
- Un personnage qui agit sur un objet (frappe, geste) regarde l'objet : son orientation se calcule depuis la géométrie (vecteur personnage →
  point d'action), jamais un angle choisi pour l'apparence ; un cycle qui n'existe que de profil en tire son côté écran dans tout cadrage.
- Une pièce animée emporte son contour (une colonne de contour à deux texels de la peau, une rangée basse rangée dans un autre calque) ; ce
  qu'elle découvre prend ce qui est derrière elle dans le sens du mouvement (au-dessus pour ce qui descend, en dessous pour ce qui monte),
  jamais une couleur prise de côté hors de portée. Chaque correction de rig se compte contre la planche précédente et repasse une critique à
  l'aveugle par un agent neuf.
- Une famille de personnages se produit par gabarit, mais chaque vue se mesure avant : sens du profil contre la planche (avant tout miroir),
  rangée basse de chaque jambe (l'ombre du sol de la planche décale toute une vue), boîte de la seule matière pour une gamme peinte (filtrée
  par sa teinte), boîte de la pièce pour une botte. Une reprise se re-critique par un agent neuf : elle crée ses propres pertes.
