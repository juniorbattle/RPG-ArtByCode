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

## À reprendre (par priorité)

0. **Reveal d'occlusion** (passe 3b) : relecture humaine en mouvement (choix du style C, rayons 40–70 / 80–120 px, fondu 0,2 / 0,3 s) ; décider si les PNJ d'interaction
   doivent entrer dans le reveal ; chercher un cas où la passe « derrière » restaure vraiment des pièces (sinon envisager de la couper pour gagner ≈ 90 ms de bake) ;
   rejouer l'inventaire (`tools/occ-inventory.mjs`) à chaque changement de zones de caméra ou de composition (bateau, lampadaires).
1. **`SpriteRenderer`** (prévu) : remplacer la superposition 55 % par une vraie séparation (passe dédiée ou masque propre)
   pour supprimer l'auréole ; revoir le pas de silhouette/contour ; valider sur des PNJ en mouvement (pas seulement
   des captures figées) et sur la graine 7719 / 30417.
2. **Zones de caméra** : les faire valider par de vrais parcours joueur (A→B→C→B→A, courses, collisions) ; vérifier
   l'hystérésis aux bords de la zone C.
3. **Coût de régénération** (+250 ms de la passe 2, puis ≈ +150–180 ms de la passe 3b) : mettre en cache les identifiants par graine, ou
   n'échantillonner que les poses concernées quand seul un réglage de caméra change.
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
