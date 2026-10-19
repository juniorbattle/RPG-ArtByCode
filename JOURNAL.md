# Journal de bord — Cité du Tournoi (Merchant District, nuit)

Objet : garder une trace honnête de ce qui a été fait, de ce qui a marché, de ce qui a raté et de **pourquoi**, pour que
la suite parte d'un état connu. À compléter à chaque passe (une entrée par passe, la plus récente en bas).

Légende : **[OK]** réussi · **[KO]** échec / impasse · **[?]** non résolu ou à surveiller · **Pensée** = raisonnement / leçon.

> Les passes 0 à M4 sont archivées **mot pour mot** dans `journal/` (Passes M3 et M6, 2026-10-18) ; ce fichier garde les passes récentes,
> « À reprendre » et « Principes à garder ». Un renvoi à une passe archivée (« journal pass 6k », « JOURNAL, Passe 4A-0B ») se lit
> dans le fichier que donne l'index.

| Archive | Passes | Dates |
|---|---|---|
| [`journal/01-passes-0-4B.md`](journal/01-passes-0-4B.md) | 0, 1, 2 (+ « État à la fin de la passe 2 »), 3, 3b, 4B | 10/10 → 12/10 |
| [`journal/02-passes-4A-0A-4A-quindecies.md`](journal/02-passes-4A-0A-4A-quindecies.md) | 4A-0A, 4A-0B, 4A, 4A-bis, 4A-ter, 4A-quater, 4A-quinquies, 4A-sexies, 4A-septies, 4A-octies, 4A-nonies, 4A-decies, 4A-undecies, 4A-duodecies, 4A-terdecies, 4A-quattuordecies, 4A-quindecies | 12/10 → 16/10 |
| [`journal/03-passes-4A-sedecies-M2.md`](journal/03-passes-4A-sedecies-M2.md) | 4A-sedecies, 4A-septendecies, 4A-duodevicies, 4A-undevicies, 4A-vicies, 5, 4A-unvicies, 5b, 4A-duovicies, 4A-tervicies, M1, 4A-quatervicies, M2 | 16/10 → 17/10 |
| [`journal/04-passes-6-6k.md`](journal/04-passes-6-6k.md) | 6, 6b, 6c, 6d, 6e, 6f, 6g, 6h, 6i, 6j, 6k | 17/10 → 18/10 |
| [`journal/05-passes-M3-M4.md`](journal/05-passes-M3-M4.md) | M3, Q1, Q1b, M4 | 18/10 |

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

### Pensée
- Deux matières de même teinte qui se recouvrent (une frange rousse sur une peau claire) se départagent par l'endroit où chaque couleur se
  rencontre seule (le haut de la tête), pas par sa couleur.
- Une règle générale corrigée se revérifie sur toutes les feuilles : elle crée ses propres défauts ailleurs (cou, bonnets).

## À reprendre (par priorité)

> Élaguée le 18/10 (Passe M3) : seul le travail ouvert reste, regroupé par thème ; ce qui est fait vit dans sa passe. Les anciens repères
> (-3 … 6) cités par les passes antérieures renvoient à la liste de `7086340` (`git show 7086340:JOURNAL.md`).

**1. Distribution de personnages — décisions de l'opérateur, non traitées** (état de la distribution : `art-lab/characters/README.md`)
- **Variantes de PNJ** (demande de l'opérateur du 17/10, mot pour mot : « Par ailleurs a la suite de nos travaux de sprites NPC qui sont
  presque peuple partout sur le district Merchant, on creera par la suite des variantes de NPC avec couleur de cheveux et peau different pour
  amener plus de diversite au jeu »). Contraintes connues : la texture cuite garantit 336 images et en porte 322 (dix feuilles,
  1024 × 2016) : une variante en feuille séparée ne rentre pas sans agrandir la texture ; la teinte aléatoire de la foule (± 10 % par canal
  sur tout le sprite) ne s'applique plus aux feuilles cuites (Passe 4A-tervicies). **Passes V1 / V2** : masques de matière, recoloration au
  rendu, approuvées pour la production le 18/10 (PNJ uniques en original). Restent : quelques texels (trait rosé sous la bouche du voyageur,
  épaule du forgeron de profil), à reprendre si l'opérateur les relève. À arbitrer avec l'opérateur : quels personnages, combien de variantes,
  quelles teintes dans la direction artistique.
- **Mise en scène** : la marchande ne marche pas à son étal (collisionneur ; la déplacer de 0,5 m serait une décision de mise en scène) ; un
  second garde différent (miroir ou variante) au lieu de jumeaux, lances ; seuls 2 des 5 citadins (artisane, voyageur) paraissent à la
  graine 1842 et à la densité 1 (`round(2 × densité)` promeneurs ; « remplacer seulement »).
- **Mouvement** (Passe S2 : cadence réglée sur la vitesse vue à l'écran, pieds plantés pour la foule et les gardes) : cycle du docker
  irrégulier (botte tenue une image, double appui), horloge 1, glissement +0,1 en B / C et +0,48 en D : à reprendre dans son script de rig ;
  bras immobiles en marche des citadins (reproche commun des critiques) ; cycle 3 + 3 sans double appui (hérité du garde) ; en A, l'horloge
  touche son plancher pour un profil qui va presque en profondeur.
- **Fidèles aux planches, non changés exprès** : bonnet / sac de la marchande selon la vue ; costumes des citadins différents selon la vue
  (tablier, sac, chemise).
- **Lisibilité** : tête du marteau cuit peu lisible sur la lueur de l'enclume (Passe 4A-vicies).
- **Restes mineurs** relevés par les critiques : sections « Restent » des passes 4A-tervicies et 4A-quatervicies.
- **Contrat et sources** : C2 (PNG versionné + JSON, `runtime-integration-contract.md` section 11) proposé le 16/10, appliqué par la
  distribution de production, sans confirmation explicite consignée : à faire confirmer. Originaux des planches de référence à retrouver
  (l'opérateur s'en charge) ; droits de tiers non vérifiés exhaustivement.
- **Héros premium** (Passe H0) : brief et prompt prêts (`briefs/hero-proposal.md`, design « 01 Protagonist », foulée de course) ; **en
  attente de la planche source de l'opérateur** (PNG d'origine, outil, date, prompt utilisé).
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
  sans demande ; lire « branche fusionnée » suffit, à confirmer par l'opérateur.
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
