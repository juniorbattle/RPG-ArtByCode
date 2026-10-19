# Journal de bord — archive : passes M5 à S1b (2026-10-18)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-10-18 (Passe M7) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe M5 — Nettoyage : captures périmées, code mort, brouillons locaux, entrées de lancement (2026-10-18)

### Demande (2026-10-18)
- Priorités d'art de l'opérateur, transmises par la séance parente, mot pour mot : « corriger la superposition des sprites dans
  SpriteRenderer, consolider la cohérence visuelle des personnages et leur deplacement dans la scene selon l'angle de camera, puis
  travailler sur notre héros premium et les variantes de PNJ. » Une tâche, donc une branche, par point, dans cet ordre.
- Avant le premier point, en voyant la capture de la Passe 2 (`known-issues/smith-halo-before-after.png`, distribution générée),
  l'opérateur, mot pour mot : « On est plus sur cette config visuel on a integre nos sprite npc v2 non ? », puis : « Fais moi un petit
  nettoyage pour partir sur une base saie avant car nous avons d'anciens elements qui semblent etre obsolete ».
- La branche `sprite-overlay-separation`, vide (aucun commit, jamais poussée), est supprimée ; branche `cleanup-base-saine` ouverte depuis
  `main` (`1a84a06`) après `git fetch --prune` (aucune autre branche).

### Inventaire
- Suivi par git : 115 Mo de captures dans `screenshots/`, dont les images « de référence » de `calibration/` (Passe 2 : distribution
  générée, pas de cadrage D) ; code mort : 6 déclarations inutilisées (`tsc --noUnusedLocals --noUnusedParameters`) et quatre exports jamais
  importés (`buildVegetation`, module entier ; `addBunting` ; `blurField` ; `emblemRect`).
- Local, ignoré : `art-lab/characters/scratch/` 8,1 Go (dossiers des passes 4A-decies à 4A-unvicies, dont deux bases figées) ; 30 dossiers de
  séances dans `%TEMP%\claude\` (scratchpads) ; `.claude/launch.json` : `dev-cast2` / `dev-cast3` sans objet
  (Passe M1), `pv-base` / `pv-work` (séance perf).
- Suppressions locales irréversibles : question posée à l'opérateur ; réponse, mot pour mot : « Brouillons Art Lab (~7,3 Go),Scratchpads
  terminés (~3,5 Go) ».

### Dépôt — [OK]
- Code mort retiré, aucun tirage aléatoire touché : `src/props/Vegetation.ts` (jamais importé depuis le désencombrement de la Passe 1),
  `addBunting` (`Banners.ts`), `blurField` (`noise.ts`), `emblemRect` (`PropGenerator.ts`), le lambda `hAt` et son `void hAt`
  (`RoofGenerator.ts`), le champ `lib` jamais lu (`Particles.ts`), des imports et une variable inutilisés (`ForgeGenerator.ts`,
  `characterLab.ts`, `runtimePreview.ts`, `Banners.ts`, `PropGenerator.ts`). `tsc --noUnusedLocals --noUnusedParameters` : 0 erreur (6
  avant). Laissés : des `void x;` qui taisent des paramètres (11 fichiers) et des types exportés sans usage hors de leur fichier.
- Captures : 43 fichiers (64,7 Mo) des passes closes retirés de l'arbre : `calibration/compare-cam{A,B,C}.png`, `calibration/perf.json`,
  `calibration/{cast-polish,smith-facing,viewport-fix}/`, `4a-0a/`, `p4b/`, `known-issues/smith-halo-before-after.png`. Ils restent lisibles
  par `git show 1a84a06:<chemin>` ; les passes archivées qui les citent ne sont pas retouchées.
- Gardés : `calibration/occlusion/` (« À reprendre » §2), `calibration/vis-residue/` et `known-issues/pass2-vis-speck.png` (§5), et
  `screenshots/4a/` entier : le manifeste `porter-gm-v1` le cite comme preuve (`art:validate` vérifie le chemin) et l'opérateur l'a gardé
  « with all evidence » (15/10).
- Références refaites sur l'état actuel (`1a84a06`, distribution cuite) : `calibration/cam{A-establishing,B-merchant,C-forge,D-frontal}.png`
  (1920 × 1080, graine 1842, `freeze=7.3`, `Math.random` à graine, 120 pas de 1/60 s) ; `known-issues/sprite-overlay-forge-C.png` (×3) : le
  forgeron cuit délavé dans la lueur de la forge, objet du premier point des priorités.
- `AGENTS.md` : l'entrée `dev-strict` remplace `dev-cast2` / `dev-cast3`. Les README de deux critiques (`shared-atlas-4a-decies`,
  `texel-addressing-4a-undecies`) disent que leurs captures locales sont supprimées (les images clés restent dans leur dossier).

### Local — [OK]
- `art-lab/characters/scratch/` : 8,1 Go → 824 Mo. Supprimés : `addr-fix`, `baked-proof`, `cast2`, `gm`, `smith-facing`, `baseline-eecea58`,
  `before-5d10a37`. Gardés : `e2-x2-candidate` (copie de travail de la planche de référence et preuves locales que cite le paquet de
  provenance de `dockworker-x2-v1`), `npc2-merchant` (pièces jointes de la proposition), `storage-bench` (rapport cité par le contrat),
  `selfcritique-guard.md`.
- Dossiers de séances : sept séances closes supprimées (≈ 3,5 Go ; bases figées `base-14b8686`, `base-8693690`, `base-2cbb858`, `base-main`,
  `base-p1`…). Avant : aucun point de réparation (jonction) dans les cibles (`Get-ChildItem -Recurse -Attributes ReparsePoint`) ;
  `node_modules` du dépôt : 4 988 fichiers avant et après.
- `.claude/launch.json` (non versionné) : `dev-cast3` retiré ; `dev-cast2` devient `dev-strict` (`node node_modules/vite/bin/vite.js
  --port 5186 --strictPort`, sans `npx`, qui laissait un `node` enfant, Passe 2).

### Preuves
- Témoin de répétition, `static=1` : A, B, C, D, forge sabotée, graines 7719 et 30417 en A, deux chargements : 0 px (écart max 0). Après le
  retrait du code mort : 0 px, écart max 0, sur les sept vues.
- Bundle : `main` (archive figée construite avec les mêmes options) contre la branche : les dix PNG et le worker identiques ; le JS principal ne
  diffère que par le champ `lib` retiré (`lib` et `this.lib=e`), le reste identique à l'octet ; `index.html` ne diffère que par le nom haché du
  JS.
- `npm run typecheck` [OK], `npm test` 24 / 24, `npm run build` [OK], `npm run art:validate` : 14 manifestes, 4 sources archivées, 0 erreur,
  0 avertissement.
- **[KO → corrigé] harnais de capture avec personnages** : attendre après `__ready` laisse tourner la vraie boucle un nombre variable d'images
  avant la prise en main ; la même capture de C avec personnages différait (écart max 9). Corrigé en neutralisant `App.start` dès le
  chargement (`evaluateOnNewDocument`, setter sur `window.__app`) : chaque image est rendue pas à pas, deux chargements de C avec personnages
  → 0 px, écart max 0. Le harnais (scratchpad de cette séance) sera versionné avec le point 1, qui en a besoin.

### Restes [?]
- Dossier de la séance perf `c6b9b403…` (3,8 Go ; `pv/base`, `pv/work`, servis par les entrées `pv-base` / `pv-work`) : oublié dans le
  décompte présenté à l'opérateur (« ~3,5 Go »), donc pas supprimé ; à redemander. Celui de la séance parente (`a0b00d58…`, actif, base
  `base-894c4d3`) n'est pas touché.
- Le contrat d'intégration (section 12) cite encore `scratch/baked-proof/` ; son texte n'est pas retouché (les images clés sont dans
  `reviews/shared-atlas-4a-decies/`).

### Pensée
- Une image « de référence » vieillit sans bruit : celle de la Passe 2 a failli servir d'état actuel. Les références se refont à chaque
  changement visible du jeu (distribution comprise) ; les preuves des passes closes vivent dans l'historique git.
- Une capture avec personnages n'est déterministe que si la boucle du jeu ne tourne jamais hors du harnais.
- Une autorisation de suppression vaut pour la liste et la taille annoncées : un dossier oublié dans le décompte se redemande.

## Passe S1 — `SpriteRenderer` : masque de protection intact, superposition 55 % retirée, in-scatter des personnages à pleine résolution (2026-10-18)

### Demande (2026-10-18)
- Premier point des priorités de l'opérateur (citées mot pour mot en Passe M5) : « corriger la superposition des sprites dans
  SpriteRenderer ». « À reprendre » §3 : remplacer la superposition 55 % par une vraie séparation (passe dédiée ou masque propre) pour
  supprimer l'auréole ; revoir le pas de silhouette / contour ; valider sur des PNJ en mouvement et sur les graines 7719 / 30417.
- Branche `sprite-overlay-separation` ouverte depuis `main` (`07bc42d`).

### Complément de la Passe M5
- M5 fusionnée en avance rapide (`07bc42d`), runs GitHub `39169021336` (branche) et `39169036997` (`main`) : success.
- Dossier de la séance perf `c6b9b403…` (3,8 Go, oublié dans le décompte présenté) : redemandé ; réponse de l'opérateur, mot pour mot :
  « Oui, supprime-le ». Avant : aucun point de réparation, ports 5188 / 5190 sans écoute ; supprimé, entrées `pv-base` / `pv-work` retirées
  de `.claude/launch.json` ; `node_modules` du dépôt : 4 988 fichiers après.

### Diagnostic, avant tout changement — [OK]
- Captures déterministes (`tools/detshots.mjs`), un effet coupé à la fois sur la même image, en C, B et D. La superposition (seconde passe
  des personnages à 55 % après les effets transparents, test de profondeur `LessEqual`) faisait deux choses : réécrire l'alpha de scène
  (masque de protection du DOF et de l'in-scatter) et ramener à 45 % les effets transparents devant un personnage. Sans elle, le héros sous
  le halo d'une lanterne devenait flou (B) et le forgeron fantomatique (C).
- Cause de l'effacement : le mélange additif de three (non prémultiplié : `SRC_ALPHA, ONE` en couleur, `ONE, ONE` en alpha) ajoute 1 à
  l'alpha par fragment de particule ; le mélange normal (fumée, décalques, ombres de contact) l'augmente aussi. Sur un personnage : protection
  perdue. Sur le décor : alpha 2 dans chaque disque de halo de lanterne, donc flou du DOF × 2 et in-scatter × 1,55 dans le disque, avec un bord
  net (le `discard` du disque). La superposition remettait le personnage à son alpha mais pas le décor autour : c'était l'auréole (une bulle
  plus floue et plus brumeuse découpée autour du personnage). Le principe « le DOF et le masque de protection sont des contrats » était violé
  depuis la Passe 2.
- Délavage : d'abord l'in-scatter (C : sans lui, contours sombres et rampes du forgeron rendus), protégé à 45 % sur les personnages par un
  masque lu à demi-résolution.

### Fait
1. `maskSafeBlending` (`SceneUniforms.ts`) : ce qui est dessiné après la passe opaque mélange sa couleur comme avant (normal / additif non
   prémultiplié, ou additif prémultiplié) et garde l'alpha de destination (`ZERO, ONE`) : particules (fumée, lueurs, halos, poussière),
   décalques, ombres de contact, composition du bloom. Le masque n'est plus écrit que par la passe opaque.
2. Superposition 55 % retirée (maillage, matériau, `overlayAmount`) : un appel de dessin de moins. Un effet devant un personnage s'y applique
   entièrement, comme sur le reste de l'image.
3. In-scatter : le DOF transmet le masque dans son alpha ; le grade applique la part des personnages à pleine résolution (`keep = mix(0,45,
   1, a)`, valeur inchangée) ; la passe d'in-scatter (demi-résolution) range dans son alpha la classe du pixel dont elle a lu la profondeur
   (personnage ou décor : parmi les 2 × 2 pixels autour du texel, celui qui porte exactement cette profondeur) ; le grade suréchantillonne
   depuis les texels de la classe du pixel, et prend le bilinéaire matériel quand les quatre en sont (partout loin des personnages).
4. Outils : `tools/detshots.mjs` (le harnais déterministe de la Passe M5 : `App.start` neutralisé, pas fixes, variantes sur la même image),
   `tools/sprite-halo.mjs` (l'auréole mesurée en mouvement, `POST=air|bloom|dof` pour l'attribuer). `AGENTS.md` : « Rendering notes » et
   « Commands ».

### Preuves
- Base `main` figée (`07bc42d`, servie sur :5187, entrée `base-s0` de `.claude/launch.json`) : 0 px contre le serveur de dev de `main` sur la
  même capture de C avec personnages.
- Monde statique (`static=1` : A, B, C, D, forge sabotée, graines 7719 et 30417 en A) contre `main` : 1 à 6 pixels à 1 niveau sur 255, aucun
  au-dessus. Attribué par deux sondes : sans le `keep` du grade, mêmes pixels ; avec l'ancien `keep` remis dans la passe d'in-scatter, 0 px.
  C'est l'ancien `mix(0,45, 1, 1)`, qui ne vaut pas exactement 1 en flottant ; le nouveau code ne multiplie plus le décor.
- **[KO → corrigé]** première version : le bloom de three compose en prémultiplié (`ONE, ONE`), pas en `SRC_ALPHA, ONE` ; le halo de la lune et
  des lampes lointaines avait disparu (A : 3,3 % des pixels, jusqu'à 113 niveaux). Mode prémultiplié ajouté à `maskSafeBlending`.
- **[KO → corrigé]** lire profondeur et classe par `texelFetch(floor(uv × taille))` ne tombe pas toujours sur le pixel que choisit le filtrage
  au plus proche : monde statique changé (4-6 % des pixels, jusqu'à 98 niveaux). La profondeur se lit comme avant, la classe vient du pixel qui
  porte exactement cette profondeur.
- En mouvement (`sprite-halo`, 6 s à 1/60 s, mesure toutes les 10 images, PNJ qui marchent selon leurs comportements, héros piloté par les
  vraies touches en B, C et D), « avant » = `main` figé, « après » = cette branche, mêmes images. Anneau = |écart de luminance| entre
  personnages présents et absents, post-traitement actif, sur 1 à 6 px autour de la silhouette (tête à hanches) ; contraste = écart-type de la
  luminance du sprite, post-traitement actif / coupé :

| Cadrage / graine | échantillons | anneau médian (niveaux) | part de l'anneau > 4 niveaux (médiane) | anneau p90 | contraste médian |
|---|---|---|---|---|---|
| A / 1842 | 386 | 1,36 → 0,47 | 12,0 → 2,2 % | 2,68 → 1,03 | 0,773 → 0,796 |
| B / 1842 | 376 | 2,28 → 1,3 | 15,2 → 4,1 % | 8,14 → 7,53 | 0,924 → 0,927 |
| C / 1842 | 288 | 1,21 → 0,57 | 8,5 → 2,8 % | 10,65 → 10,75 | 0,979 → 0,978 |
| D / 1842 | 165 | 0,35 → 0,11 | 2,0 → 0,4 % | 13,92 → 13,95 | 0,998 → 0,998 |
| A / 7719 | 396 | 1,33 → 0,4 | 10,0 → 2,1 % | 2,23 → 0,99 | 0,766 → 0,798 |
| B / 7719 | 386 | 1,27 → 0,93 | 9,6 → 4,6 % | 6,56 → 6,06 | 0,952 → 0,954 |
| A / 30417 | 366 | 1,1 → 0,36 | 10,0 → 1,7 % | 2,28 → 0,62 | 0,791 → 0,8 |
| B / 30417 | 386 | 2,04 → 0,84 | 11,8 → 5,2 % | 7,55 → 7,04 | 0,936 → 0,943 |

- L'anneau qui reste est presque tout au premier pixel hors silhouette (héros en B, in-scatter seul : 18,4 → 8,2 niveaux à 1 px, 0,63 → 0,02 à
  2 px) : pixels de bord multi-échantillonnés, en partie couverts par le personnage. La traîne (p90) tient au chat (premier plan, protégé à
  80 % : son propre flou de profondeur, anneau ≈ 13-16 niveaux avant comme après) et à la marchande (grande bulle « … » protégée, lanterne
  devant son visage). Attribution (B, 1842) : DOF 0,26 → 0,15, bloom 0,04 → 0,04, in-scatter 2,06 → 0,74 (avant le suréchantillonnage par
  classe) ; le forgeron 2,43 → 0,47.
- Performances (`tools/perf.mjs`, Radeon 780M, 3 tours entrelacés, témoin de contention propre 3 / 3) : B 1080p 9,69 → 9,62 ms, C 1080p
  9,66 → 9,65 ms, B 2560 × 1267 14,72 → 14,56 ms (médianes) ; grade 0,28 / 0,43 ms et in-scatter 0,45 / 0,70 ms inchangés ; 114 → 113 appels
  de dessin. Neutre, dans le bruit.
- Références `screenshots/calibration/cam{A,B,C,D}-*.png` refaites (même protocole que la Passe M5) ; images clés de la passe dans
  `screenshots/calibration/sprite-s1/` ; `tools/detshots.mjs` reproduit au pixel près (0 px) la capture du harnais de la Passe M5.
- `npm run typecheck`, `npm test` (24 / 24), `npm run build`, `npm run art:validate` (14 manifestes, 0 erreur).

### Changement visible (captures montrées à l'opérateur)
- Les disques de halo de lanterne ne floutent et n'embrument plus le décor plus que le reste de l'image : la bulle autour des personnages
  disparaît.
- Un halo placé devant un personnage s'applique entièrement (il était ramené à 45 %) : le héros, en B, sous la lanterne qui est devant lui, est
  plus clair au visage.
- Le forgeron reste délavé par l'in-scatter de la forge (part des personnages inchangée, 45 %) : `known-issues/forge-smith-inscatter-C.png`.

### Pas de silhouette / contour — [?] proposition, non appliquée
- Le traitement de bord (`uEdge` : bord côté lumière éclairci vers la lumière clé, bord opposé assombri, liseré de lune au sommet) a été écrit
  pour les sprites générés ×1. Sur les feuilles cuites ×2, qui portent leur propre contour sombre, le bord côté lune devient une frange bleutée
  pointillée (voyageur en B, côté gauche des cheveux et de l'écharpe) ; sur le héros ×1, il se voit à peine. Pistes : pas d'éclaircissement du
  bord sur les feuilles cuites (contour d'auteur gardé), ou un pas de bord proportionnel à la densité. Décision d'image : à l'opérateur.

### Restes [?]
- Lisibilité du forgeron dans la forge : la part des personnages dans l'in-scatter (45 %) est un réglage d'image ; à proposer avec le point 2
  (cohérence visuelle des personnages), jamais par l'éclairage global.
- Anneau résiduel du chat au premier plan (son flou de profondeur) et des pixels de bord.

### Décision opérateur (2026-10-18) — [OK]
- Captures montrées (`sprite-s1/B-stall-x2-before-after.png`, `C-forge-x2-before-after.png`, `B-full-before-after.png`,
  `rim-proposal-x1-x2.png`), deux questions (posées en anglais par erreur). Réponses, mot pour mot : halo devant un personnage —
  « Fully applied (Recommended) » (S1 fusionnée telle quelle) ; bord des feuilles cuites ×2 — « Keep the authored outline » (pas
  d'éclaircissement du bord sur les feuilles cuites, liseré de lune et assombrissement du côté ombre gardés ; fait au point 2).

### Pensée
- Un canal qui sert de contrat (l'alpha = masque de protection) se protège à l'écriture, par les facteurs de mélange de chaque passe, pas en le
  réparant après coup : la réparation (la superposition) cachait la corruption sur les personnages et la laissait autour d'eux.
- Un mode de mélange de bibliothèque se lit dans son code (prémultiplié ou non) avant d'être réécrit.
- Un échantillonnage « au plus proche » du matériel ne se rejoue pas par une formule : on retrouve le texel par sa valeur.
- Une auréole se mesure : ce que le post-traitement fait changer autour d'une silhouette, personnage présent / absent, image par image et en
  mouvement, puis par effet.

## Passe S2 — Personnages : cadence de marche réglée sur la vitesse vue à l'écran, contour d'auteur gardé, densités mesurées (2026-10-18)

### Demande (2026-10-18)
- Deuxième point des priorités de l'opérateur (Passe M5) : « consolider la cohérence visuelle des personnages et leur deplacement dans la
  scene selon l'angle de camera ». Points de départ : « À reprendre » §1 (bande 40° / 50° et diagonales du joueur de profil, à juger en
  mouvement ; foulée du docker ; bras immobiles en marche ; densité ×1 / ×2 ; détails d'un texel qui clignotent en A) et la décision de
  l'opérateur en Passe S1 (« Keep the authored outline »).
- Branche `cast-coherence-motion` ouverte depuis `main` (`c45e621`, Passe S1 fusionnée). Base figée de `main` servie sur :5187 (entrée
  `base-main`).

### Foulée — [OK] mesurée sur les feuilles
- Sur la rangée des pieds (45k) des images de marche de profil, les pieds sont des segments opaques ; le pied d'appui recule de 4 à 4,5
  texels par image sur 9 feuilles sur 10 (×2), soit 0,63-0,71 m/s à la cadence de 7,5 images / s et à l'échelle 0,9 de la distribution.
  Le jeu les fait marcher à 0,8 (gardes, encapuchonné), 0,9 (docker) et 0,95 m/s (foule) : les pieds patinaient. Le cycle du docker n'est
  pas un tapis roulant régulier (botte tenue une image puis 4 texels, double appui : glissements 0 / 2 / 2,5 / 4) ; la « foulée de 13 texels
  par pas » de la Passe 4A-sedecies était l'écart entre les pieds, pas le glissement du pied d'appui.
- `walkSlide` (`src/characters/Stride.ts`) mesure cela au chargement de la distribution (`CastMember.walkSpeed`) ; un cycle irrégulier (un
  glissement à plus de 30 % de la médiane, ou une botte tenue) rend `null`. Outil : `tools/art-lab/stride.mjs` (même fonction).

### Cadence — [OK] l'horloge d'animation suit la vitesse que montrent les pas
- **[KO → compris] première mesure en mouvement** : comparer la dérive du pied d'appui à la vitesse totale du marcheur donnait 0,5-0,7 de
  glissement avant comme après. Un profil n'affiche le glissement du pied que le long de l'axe droit de la caméra (le plan du billboard) ;
  un marcheur montré de profil alors qu'il va surtout en profondeur (règle de l'écran, Passe 4A-unvicies : 20° de cap font déjà ~55° à
  l'écran) traverse l'écran lentement. Exemple relevé (artisane, B) : 0,051 m d'avance à l'écran par image d'animation contre 0,094 m de
  recul du pied : les pieds faisaient un moonwalk, et une cadence accélérée l'aggravait.
- `ActorSystem.walkClock` : de profil, la vitesse le long de l'axe droit de la caméra ; de face / de dos, la vitesse entière ; divisée par la
  vitesse que dessine le cycle à l'échelle du cadrage (`charScale`, que l'app transmet), bornée à [0,4 ; 1,6] ; 1 pour un sprite généré ou un
  cycle irrégulier (docker). Seul `a.t` avance plus ou moins vite : positions, cibles, tirages aléatoires inchangés (vérifié : 11 acteurs,
  positions, animations et vues identiques après 60 s, graines 1842 et 30417). `WALK_CADENCE` (7,5) nommé dans `SpriteRenderer.ts`.
- Mesure en mouvement (`tools/foot-slip.mjs`, `App.update` à 1/60 s, 40 s par cas, sans rendu ; à chaque changement d'image, dérive du pied
  d'appui le long de l'axe droit de la caméra sur l'avance du marcheur : 0 = planté, négatif = moonwalk), médianes avant → après :

| Cas | artisane | voyageur / citadine | docker |
|---|---|---|---|
| A, 1842 | −2,40 → −0,36 (horloge au plancher 0,4) | voyageur −1,18 → −0,01 | 0,09 → 0,09 |
| B, 1842 | −0,76 → −0,08 | voyageur −0,42 → 0,01 | 0,11 → 0,11 |
| C, 1842 | −0,95 → −0,04 | voyageur −0,58 → 0,00 | 0,04 → 0,04 |
| D, 1842 | 0,01 → 0,01 | voyageur 0,17 → 0,02 | 0,48 → 0,48 |
| B, 7719 | −0,19 → 0,01 | citadine −0,61 → −0,07 | −0,18 → −0,18 |
| B, 30417 | — | citadine −0,55 → −0,03 ; voyageur −0,21 → 0,01 | 0,17 → 0,17 |

- Revue en mouvement : `tools/flipbook.mjs` (même exécution déterministe sur deux serveurs, recadrage qui suit un acteur, lecture
  synchronisée dans une page HTML autonome) ; artisane en C, `main` contre cette branche, montrée à l'opérateur (page hors dépôt, 9 Mo).

### Contour d'auteur — [OK] décision de l'opérateur appliquée
- `BODY_FRAG` : pas d'éclaircissement du bord côté lumière sur une feuille cuite (`litEdge = 0`) ; liseré de lune au sommet et
  assombrissement côté ombre gardés. `sprite-s2/B-edge-x4-before-after.png` : contour sombre rendu à gauche du voyageur et de la marchande.
  [?] Le liseré de lune au sommet, gardé comme demandé, se lit encore comme une frange bleutée sur l'escalier d'une chevelure en épis
  (voyageur, à droite).

### Densités — [?] mesurées, à décider
- Pixels écran par texel (graine 1842, positions de capture des références) : A : distribution ×2 0,35-0,78, héros ×1 1,61, chat ×1 0,99 ;
  B : ×2 0,65-1,68, héros 3,04 ; C : ×2 0,97-2,02, héros 3,31 ; D : ×2 1,15-1,29, héros 2,92, chat 4,51. En A, la distribution passe sous
  un pixel par texel : les détails d'un texel tombent et reviennent en mouvement (le point de QA). Le héros ×1 a des texels deux fois plus
  gros que la distribution autour de lui (point 3 : héros cuit à la densité de la distribution). Rien changé ici.

### Preuves
- Monde statique (`static=1`, A, B, C, D, forge sabotée, graines 7719 / 30417 en A) contre la Passe S1 : 0 px, écart max 0.
- Tests : `tests/stride.test.mjs` (4 tests : tapis roulant synthétique dans les deux sens, `null` sans profil / sans pied / cycle à botte
  tenue, table des 10 feuilles de production, `walkClock` : axe de la caméra, échelle, bornes, sprite généré, cycle irrégulier) ; contrôle
  négatif : trois fautes injectées une à une (vitesse entière de profil, échelle ignorée, contrôle de régularité retiré), chacune attrapée.
  `npm test` 28 / 28.
- Références `screenshots/calibration/cam{A,B,C,D}-*.png` refaites ; `npm run typecheck`, `npm run build`, `npm run art:validate`.

### Restes [?]
- Docker : cycle irrégulier, horloge 1 ; glissement mesuré +0,1 en B / C, +0,48 en D. Le corriger demanderait de reprendre sa marche dans son
  script de rig (révision d'un asset approuvé : critique à l'aveugle et accord de l'opérateur).
- Bras immobiles en marche des citadins : même voie (scripts de rig), non traité.
- En A, l'horloge touche son plancher pour les profils qui vont presque en profondeur (artisane −0,36).
- Héros généré : horloge 1 ; il marche à 2,5 m/s. Pour le héros cuit (point 3), un cycle dessiné pour cette vitesse (glissement ≈ 9 texels
  par image à ×2 avec l'horloge à 1,6) ou une vitesse revue.

### Pensée
- Un glissement de pied se mesure dans l'axe où le sprite peut le montrer : un profil ne montre que l'axe droit de la caméra ; la vitesse
  totale d'un marcheur vu de profil peut être surtout en profondeur.
- Une animation se règle sur ce que l'écran montre (la règle de vue de la Passe 4A-unvicies vaut aussi pour la cadence), sans toucher aux
  positions ni aux tirages.

## Passe S1b — `SpriteRenderer` : une seule profondeur par sprite (le décor derrière un personnage ne le coupe plus) (2026-10-18)

### Demande (2026-10-18)
- En voyant la capture du contour (`sprite-s2/B-edge-x4-before-after.png`), l'opérateur, mot pour mot : « cela ne semble pas corriger on a
  toujours une partie du decors qui se voit par dessus le sprite NPC » : une lanterne de l'étal couvre les cheveux de la marchande. La
  « superposition des sprites » du premier point des priorités visait donc aussi (surtout) le décor dessiné par-dessus les personnages, que
  la Passe S1 (superposition 55 %, masque) ne traitait pas.
- Branche `sprite-depth-card` ouverte depuis `main` (`378664d`, Passe S2 fusionnée, runs non relevés ici).

### Cause — [OK]
- Profondeur de vue (graine 1842, B) : marchande 23,07 m, lanterne 23,56 m, soit **0,5 m derrière** ses pieds, et pourtant dessinée sur sa
  tête. Le sprite est un quadrilatère penché avec le tangage de la caméra (`tilt` 0,85) : son sommet (la tête) est ≈ 0,25 m plus profond que
  ses pieds, et passe derrière ce qui se trouve derrière le personnage. Le même défaut faisait traverser les sprites par les poteaux, murs et
  autres sprites tout proches, et enfonçait la rangée basse des bottes dans le pavé (bande bleutée floue sous les semelles).

### Fait
- `BODY_VERT`, passe principale seulement (le miroir garde la profondeur du quadrilatère) : le dessin est inchangé (inclinaison, ancrage sur
  la grille de pixels), mais tout le sprite prend **une seule profondeur**, celle de son ancrage, avancée vers la caméra de la demi-épaisseur du
  corps (`SPRITE_DEPTH_CARD` = 0,2 m, uniforme `uDepthCard`, < 0 = l'ancienne profondeur) : `clip.z = ndc(ancrage avancé) × clip.w`. Ce qui est
  plus proche que cette carte cache toujours le personnage (comptoir devant ses jambes, autre personnage devant lui) ; ce qui est derrière ne
  le coupe plus.

### Preuves
- Avant / après sur la même image (même page, `uDepthCard` = −1 puis 0,2 ; A, B, C, D, graine 1842, 120 pas) : changements limités à la
  lanterne de la marchande (B, 722 px) et aux semelles (A, B, C, D : bottes dessinées en entier au lieu de s'enfoncer dans le pavé).
  `sprite-s1b/B-merchant-lantern-x3.png`, `sprite-s1b/feet-x4.png`.
- Ce qui reste caché (post-traitement coupé, carte contre « sans test de profondeur ») : un personnage derrière un autre (garde derrière le
  héros en D), le chat derrière une borne, les mains du forgeron derrière l'enclume, et la tête du forgeron derrière l'enseigne de la forge
  (C) : l'enseigne pend à la poutre de devant, le forgeron travaille dedans, l'occultation est réelle : question de mise en scène,
  `sprite-s1b/C-smith-sign-staging-x2.png`.
- Monde statique (`static=1`, sept vues) contre la Passe S1 : 0 px, écart max 0.
- Performances (`tools/perf.mjs`, 780M, 2 tours, sans contention) : B 9,36 → 9,35 ms, C 9,20 → 9,15 ms (même page, uniforme basculé).
- Références `cam{A,B,C,D}-*.png` refaites ; `npm run typecheck`, `npm test`, `npm run build`, `npm run art:validate`.

### Restes [?]
- Mise en scène : l'enseigne de la forge cache la tête du forgeron en C (la remonter, la déplacer ou déplacer le forgeron : décision de
  l'opérateur).
- Un accessoire mince à moins de 0,2 m devant l'ancrage (un poteau) ne cache plus le personnage : ce corps a de l'épaisseur.

### Pensée
- Un billboard n'a pas d'épaisseur : penché pour l'apparence, il prend une profondeur que le personnage n'a pas. Dessin et profondeur se
  séparent : le dessin suit la caméra, la profondeur reste celle de l'ancrage (une carte), avancée de la demi-épaisseur du corps.
- Une demande d'image se vérifie sur l'image que l'opérateur montre avant d'interpréter son vocabulaire : « superposition » désignait le décor
  par-dessus les personnages, pas seulement la superposition à 55 %.

