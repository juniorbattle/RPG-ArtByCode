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

## À reprendre (par priorité)

1. **`SpriteRenderer`** (prévu) : remplacer la superposition 55 % par une vraie séparation (passe dédiée ou masque propre)
   pour supprimer l'auréole ; revoir le pas de silhouette/contour ; valider sur des PNJ en mouvement (pas seulement
   des captures figées) et sur la graine 7719 / 30417.
2. **Zones de caméra** : les faire valider par de vrais parcours joueur (A→B→C→B→A, courses, collisions) ; vérifier
   l'hystérésis aux bords de la zone C.
3. **Coût de régénération** (+250 ms) : mettre en cache les identifiants par graine, ou n'échantillonner que les poses
   concernées quand seul un réglage de caméra change.
4. **Rendu** : MSAA 4× → test d'un MSAA 2× / FXAA après le travail sur les sprites ; DOF et bloom à demi-résolution.
5. **Autres graines** : le culling a été vérifié au pixel sur la graine 1842 ; refaire le contrôle `vis=0` vs défaut sur
   7719 et 30417 avant de se fier à la visibilité sur toute graine.
6. **Dette** : l'ancienne rive opposée (`row(...)` en « sec ») rejoue ses tirages sans rien dessiner — à retirer proprement
   une fois qu'on accepte de décaler la ville lointaine d'une graine.

## Principes à garder

- Mesurer d'abord (minuteurs GPU, entrelacé, baseline figée), optimiser ensuite.
- Toute coupe de géométrie se prouve par un diff d'images `static=1`, culling actif vs `vis=0`.
- Ne pas ajouter de contenu pour combler le vide ; dépenser la complexité là où la caméra la perçoit.
- Garder le déterminisme par graine : toute suppression de code doit préserver les tirages aléatoires.
