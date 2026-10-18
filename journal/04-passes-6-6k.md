# Journal de bord — archive : passes 6 à 6k (2026-10-17 → 2026-10-18)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-10-18 (Passe M3) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe 6 — Performances GPU / navigateur : état mesuré, plan chiffré, outillage (P0) (2026-10-17)

### Demande (2026-10-17)
- Mot pour mot : « il faudra aussi faire un travail sur les performances GP, afin de s'assurer que le projet run bien dans le navigateur sans
  surcharge », puis : « Tu peux deleguer sur une autre session la tache de performance et optimisation du jeu via GPU et etc... en te basant
  sur le travail fait sur le projet RPGCards qui semble etre bien reussi ». Arbitrage (règle « une seule branche ») : « Analyse seule
  d'abord » — mesurer, écrire un plan chiffré, sans branche tant que `cast-inherited-defects` n'est pas fusionnée.
- Plan validé, mot pour mot : « Je valide le plan perf-gpu : ouvre la branche perf-gpu depuis main et commence par P0 puis P1 (chauffe des
  variantes d'occlusion), chaque piste avec sa preuve. » Branche `perf-gpu` ouverte depuis `main` (`2cbb858`, après la fusion de
  `cast-inherited-defects`) et poussée. Le plan complet est dans les notes de séance (`perf-gpu-plan.md`) ; l'essentiel est ci-dessous.

### Conditions de mesure — [OK] établies, deux croyances corrigées
- **Le GPU n'est pas une Iris Xe.** Portable Ryzen 7 8845HS : Radeon 780M intégrée (adaptateur choisi par Chrome) et RTX 4060 Laptop.
  `powerPreference: 'high-performance'` ne bascule pas Chrome sur la RTX ; `--force_high_performance_gpu` le fait (vérifié par
  `WEBGL_debug_renderer_info`). Écran 2560 × 1600 à 175 % : une fenêtre maximisée rend ≈ 2560 × 1450 (`min(dpr, 2)`) : la définition
  réelle de l'opérateur est 1440p, pas 1080p.
- Chrome 155 headless, ANGLE D3D11, vsync coupée ; base figée (`git archive` + copie de `node_modules/three`, sans jonction), **build de
  production** servi par `vite preview` sur `:5188 --strictPort`.
- **[KO] → contourné : contention.** D'autres séances (RPGCards `tools/perf-trace.mjs` / `qa-product.mjs`, captures headless) rendaient sur
  la même 780M pendant presque tous les tours (10-65 % du moteur 3D relevés par compteur de performance) : un minuteur GPU compte ce
  partage. Les chiffres de la 780M sont des **majorants** ; on lit la médiane, le **minimum** (la contention ne fait qu'ajouter) et les
  tours propres. La RTX, que personne d'autre n'utilisait, donne des chiffres propres.
- **[KO] Traîne du temps d'image en headless** : p95 ≈ 25-35 ms même quand le GPU fait 10-12 ms ; une page vide montre déjà p95 40 ms dans
  le même harnais (contrôle négatif). Seuls les minuteurs GPU sont crus.
- Méthode : pendant l'analyse, j'ai identifié les sources de contention par des balayages en lecture seule des processus du système
  (`Get-CimInstance Win32_Process`), avant que la règle de la passe M2 ne me parvienne ; rien n'a été arrêté. L'outillage n'en fait plus :
  le PID GPU du navigateur vient du navigateur lui-même (CDP `SystemInfo.getProcessInfo`).

### État mesuré (seed 1842, caméra B sauf mention ; ms GPU par image)
| Cas | 780M 1080p | 780M 1440p | RTX 1080p | RTX 1440p |
|---|---|---|---|---|
| A / B / C / D / C→D 50 % (médianes) | 10,8 / 12,3 / 11,7 / 10,0 / 11,3 | 16,3 / 17,8 / 21,0 / 17,4 / 17,6 | — / 2,97 / 2,92 / — / — | — / 4,94 / 4,97 / — / — |
| passe scène (B) | 7,3 | 10,7-12,1 | 1,87 | 3,1 |
| reflet / DOF / bloom / in-scatter / grade (B) | 1,0 / 1,0 / 1,1 / 0,5 / 0,3 | 1,2-1,4 / 1,8-2,0 / 1,3-1,4 / 0,8 / 0,5 | | |
- 720p : 5,7-6,3 ms. Appels de dessin 108-114, triangles 168-242 k, CPU ≈ 2 ms par image (RTX) : **aucun n'est le goulot**. Sur la 780M
  le temps JS de `render` (9-20 ms) n'est que l'attente du GPU.
- Ablations (780M, B) : sans MSAA −3,7 à −4,0 ms (1080p), −4,6 (1440p, tour propre) ; MSAA 2× −1,4 à −2,2 / −2,0 ; matériau trivial
  (ombrage) −2,0 ms seulement (≈ 27 % de la scène) : **la scène est limitée par la bande passante du MSAA 4× RGBA16F**, pas par l'ombrage
  (sur la RTX c'est l'inverse : ombrage ≈ 65 % de la scène). Rendu interne 0,75 en 1440p : 18,3-21,6 → 10,9-13,5 ms (−40 %). Reflet à
  1/4 : −0,5 / −0,7 ms. Ombre de lune coupée : ≤ 4 %, non conclusif. Sprites et particules (`static=1`) : ≈ 0.
- Surdessin de la passe scène (ordre réel) : 1,53 (A) à 1,67 (B) fragment ombré par pixel couvert.
- `UnrealBloomPass` part déjà de la demi-résolution : « bloom à demi-résolution » (point 4 ci-dessous) est acquis.
- Démarrage (production, 8 chargements, sous contention) : `__ready` 5,5 s [4,3-7,2] = peinture des textures 2,8 s [2,2-4,1] (pavés
  0,75 s, enduit 0,53 s…, fil principal) + atlas 0,16 s + génération 1,28 s (bake 0,49 s : soumission 0,20, attente GPU 0,29) + **première
  image bloquée 1,6 s** [1,4-3,5] (28 programmes, après le début du fondu de l'écran de chargement).
- **À-coup majeur** : la première révélation d'occlusion gèle l'image **295 à 1 084 ms** (17 chargements) ; 4 programmes créés (28 → 32) ;
  les suivantes sont normales. Forge : 6-15 ms ; régénération : 1,2-2,2 s (connu, point 3).

### Leçons de RPGCards (lecture seule)
- Transposé : programmes intermittents gardés et **préparés par un dessin témoin** (leur passe 12 : « garder le programme sans le dessiner
  laissait 38 ms ») ; mesure image par image et percentiles ; adaptateur relevé dans chaque mesure ; froid / chaud nommé.
- Non transposé : lumière peinte (gain prouvé sous SwiftShader seulement ; HD-2D a sa grille de lumières et un éclairage verrouillé), canvas
  `willReadFrequently` (nos peintres écrivent des tableaux typés), rendu à la demande (HD-2D rend en continu ; rAF s'arrête déjà onglet
  masqué). RPGCards n'a jamais eu de minuteur GPU. Aucun code copié.

### Plan validé (ordre de travail)
- Niveau 1, image identique : **P1** chauffe des variantes d'occlusion ; **P2** première image sous l'écran de chargement + compilation
  parallèle (`compileAsync`, `KHR_parallel_shader_compile` présent) ; **P3** peintres de textures en Web Workers (fonctions pures à graine
  fixe : −1,3 à −1,8 s attendus, octets identiques) ; **P4** plafond de cadence (165 Hz : la 780M tourne à 100 % dès qu'elle dépasse
  60 img/s ; défaut à décider) ; **P5** cache du bake par (graine, cadre, empreinte du build).
- Niveau 2, l'image change, décision de l'opérateur sur captures : **P6** résolution interne plafonnée en HiDPI (−40 % en 1440p, seule
  piste qui atteint ≈ 14 ms) ; **P7** MSAA 2× ; **P8** reflet à 1/4 ; **P9** DOF demi-résolution (non mesuré).
- Écartés pour l'instant (mesurés) : pré-passage de profondeur (gain théorique ≤ 0,75 ms en 1080p avant son propre coût), filtre de l'ombre
  de lune (≤ 4 %).

### P0 — Outillage — [OK]
- `tools/perf.mjs` (même CLI, rétrocompatible) : taille par variante (`|WxH[@dpr]`, `--size`), `--warm`, `--gpu=igpu|dgpu`, adaptateur
  affiché, valeur GPU **de chaque image** (inversion de la moyenne glissante de `GpuTimer` : moyenne et p95 par passe), JS de
  `App.update` / `App.render`, **témoin de contention** (`tools/gpu-witness.ps1` : compteurs « GPU Engine » en lecture seule ; tour marqué
  `*` si un autre processus dépasse `--thr` % — défaut 15, l'application Claude elle-même prend 10-18 % — sur le même adaptateur ;
  médiane des tours propres et minimum). `tools/startup.mjs` (phases du démarrage, première image, première / seconde révélation, forge,
  régénération, programmes créés), `tools/overdraw.mjs` (surdessin), `tools/bench-common.mjs` (lancement, adaptateur, témoin).
- `AGENTS.md` : outils, adaptateur réel (780M / RTX 4060, plus d'« Iris Xe »), recette d'une base figée.
- Preuve : `npm run build` du dépôt contre la base figée `2cbb858` : bundle JS `7d35d83d…` et 11 fichiers sur 12 identiques au SHA-256 ;
  `dist/index.html` ne diffère que par les fins de ligne (**[KO] de méthode** : `git archive` applique `core.autocrlf=true` et écrit des CRLF
  dans la base ; d'où `git -c core.autocrlf=false archive` dans la recette). `typecheck` 0.

### P1 — Chauffe des variantes d'occlusion — [OK]
- Cause : les variantes `OCC` / `OCC_INST` ne sont liées que pendant un fondu ; leur premier usage compile 4 programmes (28 → 32), puis
  ANGLE / D3D11 crée encore ses shaders au **premier dessin**. Deux essais côté page avant la bonne réponse :
  - **[KO]** `renderer.compileAsync(scene, camera)` avec la cible par défaut : 19 programmes inutiles (28 → 47), la clé de programme
    dépend de la cible liée (RT linéaire RGBA16F contre canevas sRGB) ; la révélation en a recréé 4 et gelait toujours ≈ 300 ms ;
  - **[KO]** le même, `sceneRT` liée : exactement les 4 bons programmes (aucun créé à la révélation), mais toujours 277-313 ms au premier
    dessin (le palier [KO] de RPGCards passe 12, « garder le programme sans le dessiner », retrouvé ici) ;
  - **[OK]** un dessin jetable avec les variantes liées : première révélation 295-870 → 8-16 ms.
- Changement (`App.warmOcclusionVariants`, appelé à la fin de `regenerate`, quand le niveau de dessin est encore complet) : variantes liées,
  `setOccActive(true)`, `frustumCulled` coupé le temps du dessin (lampadaires instanciés hors cadre), un rendu du miroir et de `sceneRT` (tous
  deux redessinés à chaque image, jamais présentés), puis l'état d'origine. Les fondus sont à 0 (remis par `OcclusionReveal.setup`) : aucun
  `discard`. Sauté si `occ=0` (rien ne change alors). Aucun coût par image.
- Preuves (build de production pour les temps, serveurs dev pour les captures, base figée `2cbb858`) :
  - **à-coup** (`tools/startup.mjs`, 5 + 5 chargements entrelacés, 780M) : première révélation **315 ms [301-769] → 11 ms [1-22]**, programmes
    créés à la révélation 4 → 0 ; révélations suivantes inchangées (31-50 ms au pire sous contention) ; `__ready` 2,42 → 2,38 s, première
    image bloquée 0,88 → 0,97 s (dans la dispersion : base 0,88-2,58 s) : le coût de la chauffe se fond dans la première image ;
  - **pixels** (`static=1&freeze=7.3`, seuil 0) : 13 vues (A, B, C, D, AB, BC, CD, BD, trois `occforce=all`, graines 7719 et 30417) et
    6 vues avec une **vraie révélation** (lampadaires -9 / 0 / 0 / 18 / 27 et bannière du bateau, en B, C, D) : **0 px** contre la base ;
    témoin de répétition (deux chargements de la base) 0 px partout ; contrôle négatif (`occ=0` sur les 6 vues révélées) : 528 à
    3 860 px, la comparaison sait échouer. **[KO] de méthode** au passage : les vues `occforce=all` ne découpaient rien (aucun occluder
    devant le joueur à ces positions, B / `occforce` = 0 px) ; d'où les 6 positions trouvées par la détection elle-même ;
  - **coût par image** (`tools/perf.mjs`, 3 tours, tous propres) : B 1080p 9,33 → 9,40 ms, B en révélation 9,39 → 9,57 ms (dispersion des
    tours 9,2-10,1) ; 108 / 114 appels, 210,1 k triangles des deux côtés ;
  - `typecheck` 0, `npm run build` vert. `viewport-proof` non rejoué : rien du culling ni du bake ne change (la chauffe ne touche que
    les matériaux liés et la visibilité des maillages d'occluders le temps d'un rendu).
- Chiffres propres au passage : cette série tournait sans contention (3/3 tours propres) : B 1080p **9,3 ms** sur la 780M, contre 11,3-12,3 ms
  en médiane pendant l'analyse (sous contention) ; la peinture des textures 1,1-1,5 s contre 2,2-4,1 s (la contention était aussi CPU). Les
  chiffres de l'analyse sont donc des majorants d'environ 20 % (GPU) et ×2 (démarrage) : le gain attendu de P3 se révise à ≈ −0,7 s.

### P2 — Première image sous l'écran de chargement, liaison parallèle des programmes — [OK] petit gain ; [KO] l'estimation du plan
- **[KO] d'attribution (analyse et sonde de P0)** : le « blocage de la première image » (1,4-3,5 s sous contention, 0,9 s au calme) était le
  plus grand intervalle rAF **depuis la toute première image** : c'est le bloc synchrone de `regenerate()` (génération, bake et, depuis P1,
  chauffe), sous l'écran de chargement. Mesuré côté page (`regenerate` et `render` enveloppés d'un `gl.finish()` chronométré, build de
  production) : arriéré GPU après `regenerate` 0 ms, première vraie image 21-277 ms (11 programmes de post-traitement), les suivantes
  2-5 ms. L'estimation du plan (« −1 à −1,5 s ») ne tenait donc pas. `tools/startup.mjs` corrigé : bloc `regenerate` du démarrage, temps
  jusqu'à `start()`, première image **après** `start()`, programmes créés par les premières images.
- Essai dans une copie jetable (modes `sync` / `async`, 4 chargements chacun, au calme) : chauffe seule (programmes de la scène + variantes
  + envois) 148-207 ms (médiane 192) ; `compileAsync` (avec `KHR_parallel_shader_compile`, présent) **avant** la chauffe : liaison 19-25 ms
  sans bloquer le fil principal, puis chauffe 115-182 ms (médiane 116) : ≈ −50 à −75 ms. Programmes 2 → 21 → 21 → 32 : aucun doublon (la
  cible `sceneRT` liée pendant `compileAsync`, voir P1).
- Changement (`App.init` / `App.prepareFirstFrame`) : le démarrage appelle `regenerate(undefined, { warm: false })`, puis, une fois la pose
  de caméra fixée, `compileAsync` avec les variantes et `sceneRT` liées, la chauffe (P1) et une image complète (miroir, scène, post), avant
  la fin de `init()` : l'écran de chargement ne s'efface plus sur une image qui compile encore. Les régénérations suivantes gardent la
  chauffe synchrone dans `regenerate` (programmes déjà en cache). `warmOcclusionVariants` remet lui-même le niveau de dessin complet
  (appelable hors de `regenerate`).
- Preuves (contre la base figée P1 `f80834d` pour les temps, `2cbb858` pour les pixels) :
  - **démarrage** (`tools/startup.mjs` corrigé, 6 + 6 chargements entrelacés, aucun sous contention) : première image après `start()`
    **17 ms [3-20] → 4 ms [3-8]**, programmes créés par les premières images **11 → 0** ; bloc `regenerate` 922 [884-2 535] → 709 [680-739]
    ms, suivi de 228 [188-234] ms de préparation sous l'écran ; `__ready` 2 557 [2 282-4 511] → 2 495 [2 299-2 564] ms : **durée totale
    inchangée** (dans le bruit), le travail est seulement déplacé et un peu parallélisé ;
  - **pixels** (seuil 0) : 19 vues (les 13 de P1 + les 6 à révélation réelle) **0 px** contre `2cbb858` ; témoin de répétition 0 px ;
    contrôle négatif `occ=0` 528-3 860 px ; chemin `occ=0` (6 vues) 0 px contre la base en `occ=0` (contrat « identique à la passe 2 ») ;
  - **coût par image** : B 1080p 10,90 → 10,97 ms ; C 1440p 18,51 → 18,91 ms dans un premier ordre, puis 18,95 / 18,85 (P1) contre
    19,25 / 18,38 (P2) en ordre inversé et répété (tous les tours propres) : aucun écart ; le code par image n'a pas changé ;
  - `typecheck` 0, `npm run build` vert.
- Constat au passage : un onglet d'aperçu masqué (fenêtre 0 × 0) fait échouer le bake (« NaN x 960 page target ») et le repli garde tout,
  comme prévu (comportement antérieur, non lié à P2, non traité).

### Décision opérateur (2026-10-17) — [OK] P0 + P1 + P2 acceptés
- Mot pour mot : « Fusionne d'abord perf-gpu (P0 + P1 + P2) dans main, pousse main et supprime la branche ; on ouvrira une nouvelle branche
  pour la suite. »
- Branche `perf-gpu` fusionnée en avance rapide dans `main`, `main` poussé, branche supprimée (locale et distante). Les pistes suivantes
  (P3…) ouvriront leur propre branche depuis `main`.
- Au passage, l'opérateur a autorisé par défaut les actions de routine de la tâche, mot pour mot : « Tu as toutes les permissions necessaires
  qui ne soont pas sensible pour faire ta tache de session, plus besoin de me demander ». Liste blanche ajoutée en conséquence dans
  `.claude/settings.local.json` (ignoré par git) : outils, build, git en lecture, add / commit / push, lectures et copies ; rien de
  destructif.

### Pensée
- Mesurer d'abord a encore déplacé la cible : on croyait le MSAA et le DOF / bloom « les plus gros postes » (passe 2) sur une Iris Xe ; sur
  la 780M réelle, c'est la bande passante du MSAA 4× HDR et la définition 1440p de l'écran de l'opérateur. Et l'à-coup le plus visible
  (première révélation) n'apparaît dans aucune moyenne : il faut une sonde dédiée aux premières fois.
- Sur un poste partagé, un temps GPU n'est crédible qu'avec son témoin de contention ; à défaut, le minimum des tours entrelacés.
- Sur ANGLE / D3D11, « compilé » ne veut pas dire « prêt » : seul un dessin réel, vers une cible de même format, finit un programme. Une
  preuve au pixel d'un effet conditionnel se fait sur des vues où l'effet agit vraiment (contrôle négatif non nul), pas sur un drapeau forcé.

## Passe 6b — Performances : P3, peintres de textures en Web Workers (2026-10-17)

### Demande (2026-10-17)
- Séance reprise d'un clone de la séance « Performances GPU : analyse et plan » (archivée par l'opérateur pour que les nouvelles permissions
  automatiques s'appliquent). Mot pour mot : « Go : ouvre la branche de P3 depuis main et commence les peintres de textures en Web Workers,
  avec leurs preuves. » Branche `perf-p3-texture-workers` ouverte depuis `main` (`51b9167`) et poussée.

### Changement — [OK]
- `PainterJobs.ts` : les neuf peintures de `MaterialLibrary` (pierre, brique, enduit avec sa pierre sous-jacente, colombages, planches,
  toits, tissu, métal, pavés) en jobs nommés, graines et paramètres déplacés tels quels. `painter.worker.ts` : un job par message, les deux
  tableaux renvoyés par transfert (sans copie). `PainterPool.ts` : pool de Workers modules, file du plus long au plus court (pavés, enduit,
  pierre…), chaque Worker prend le job suivant dès qu'il est libre.
- Repli sur le fil principal, job par job : Worker non constructible, erreur (script introuvable, exception), réponse d'erreur, ou silence
  de 20 s (chien de garde) ; ce qui reste dans la file quand plus aucun Worker ne tourne est peint sur le fil principal. Avertissement
  console `[painters]` et `lib.painterFallbacks`. `?painters=main` (fil principal, ordre d'avant) et `?painters=<n>`.
- `MaterialLibrary.init` : pendant que les Workers peignent, le fil principal peint les atlas canevas (DOM, ≈ 12 ms) ; les textures THREE
  sont ensuite créées **dans l'ordre d'avant** : ids 34-63 identiques, uuid (`Math.random`) tirés dans le même ordre, tableau `textures`
  inchangé. `timings` : temps propre de chaque job, `paint wall`, `paint workers`.
- Défaut : min(4, cœurs − 1) Workers, fil principal en dessous de 2 (voir la taille du pool). Vite sort le Worker en chunk séparé
  (`painter.worker-*.js`, 14 Ko) ; serveur dev et build de production marchent tous deux.
- **[KO] de sonde corrigé** (`tools/startup.mjs`) : l'observateur des étiquettes de l'écran de chargement s'attachait à `DOMContentLoaded`,
  après la première étiquette (posée pendant l'exécution du module) ; la phase « paint » partait donc de la seconde (ASHLAR, posée après
  le job pierre, ≈ 0,2 s). Il observe désormais dès le départ et « paint » part de WHITE. Conséquences : la peinture « 1,1-1,5 s au calme »
  de la passe 6 omettait la pierre (≈ 1,3-1,7 s en vrai), d'où le gain révisé de P3 (« ≈ −0,7 s ») trop prudent ; et avec les Workers,
  l'ancienne sonde affichait 301 ms (fin de la pierre → READY) au lieu de 550.

### Preuves (base figée `51b9167` servie en production sur `:5188`, build de la branche figé sur `:5190`, serveur dev de la branche)
- **Octets** (script de séance `p3-hash.mjs`) : SHA-256 des 30 textures de la bibliothèque (21 tableaux, 9 canevas), ordre et ids compris :
  **identiques à la base** avec 4 Workers (défaut), 1, 2 et 8, sur le fil principal, en dev (Workers et fil principal), et sous trois pannes
  injectées avant tout script : `Worker` absent (repli complet), script du Worker introuvable (4 erreurs → 4 replis), Worker muet (chien de
  garde : 4 replis, chargement 25 s). Témoin de répétition (base deux fois) identique ; contrôle négatif (un octet des pavés inversé avant
  hachage) détecté.
- **Pixels** (`static=1&freeze=7.3`, 1920 × 1080, comparaison à l'octet des PNG, sinon `tools/diff.mjs` seuil 0) : 13 vues — A, B, C, D, AB,
  BC, CD, BD, A et B `occforce=all`, forge sabotée en C, B graine 7719, D graine 30417 `occforce=all` ; 6 avec une révélation active (3 réelles :
  lampadaire -9 en B et B 7719, lampadaire 0 en BC ; 3 forcées) — **identiques à l'octet** contre la base pour les Workers, `painters=main` et
  le serveur dev ; base deux fois identique ; contrôle négatif (`freeze=7.31`) : 91 % des pixels diffèrent.
- **Démarrage** (`tools/startup.mjs` corrigé, production, 6 + 6 + 6 chargements entrelacés, 1920 × 1080, 780M, 0 / 18 sous contention GPU) :
  peinture **1 803 [1 759-1 817] → 550 [517-603] ms** ; `__ready` **3 638 [3 453-4 681] → 2 495 [2 167-2 635] ms** (−1,14 s, −31 %) ;
  `painters=main` : 1 762 / 3 634 ms, soit la base (le repli coûte ce que coûtait l'ancien code). Génération, bake, bloc `regenerate`,
  première image après le départ, première révélation : inchangés (dans la dispersion). Une première série avec l'ancienne sonde donnait
  la même conclusion (`__ready` 3 722 → 2 437 ms).
- **Taille du pool** (`p3-sweep.mjs`, 4 tours entrelacés, build figé) : peinture 1 766 (fil principal) / 1 984 (1 Worker) / 987 (2) / 700 (3) /
  **545 (4)** / 536 (6) / 553 (8) ms : plateau dès 4, la peinture est bornée par le plus long job (pavés ≈ 0,5 s). **[?]** chaque job est
  ≈ 10 % plus lent dans un Worker que sur le fil principal (somme des jobs 1 716 → 1 940 ms ; cause non cherchée) : un Worker seul perd contre
  le fil principal, d'où le défaut « fil principal en dessous de 2 Workers » (ajouté après les mesures ; sur cette machine le défaut reste 4,
  chemins prouvés ci-dessus).

### Décision opérateur (2026-10-17) — [OK] P3 accepté
- Mot pour mot : « J'accepte P3 tel quel : fusionne perf-p3-texture-workers dans main, pousse main et supprime la branche. »
- Branche `perf-p3-texture-workers` fusionnée en avance rapide dans `main`, `main` poussé, branche supprimée (locale et distante). P4 ouvrira
  sa propre branche depuis `main`.
- **Coût par image** (`tools/perf.mjs`, B 1080p avec révélation, 3 tours entrelacés, tous propres) : 13,49 [13,10-13,70] → 12,88
  [12,84-13,36] ms, mêmes appels (114), triangles (210,1 k) et textures (50) : le code par image n'a pas changé, écart dans la dispersion.
  (Ces valeurs sont plus hautes que les 9,3 ms de P1 : même GPU, autre état thermique ou d'alimentation ; seule la comparaison entrelacée
  compte.)
- `typecheck` 0, `npm run build` vert. Preuves et scripts dans les notes de séance (`perf-gpu-evidence/p3/`).

### Pensée
- Une sonde de démarrage doit voir le tout premier repère : un observateur branché sur `DOMContentLoaded` rate ce que le module écrit pendant
  son exécution. Relire la suite réelle des repères enregistrés avant d'attribuer une phase ; un gain estimé sur une phase mal bornée l'est
  aussi.
- Déplacer des fonctions pures à graine fixe dans des Workers se prouve à l'octet (empreinte de chaque sortie) **et** par l'ordre de création
  des objets qui tirent `Math.random` (ids, uuid) ; le repli se prouve en injectant les pannes (Worker absent, script introuvable, Worker
  muet), pas en le supposant.
- Le parallélisme est borné par le plus long job : au-delà de 4 Workers rien ne bouge. Découper un peintre changerait ses tirages (non fait).

## Passe 6c — Performances : P4, plafond de cadence — mesures et options (2026-10-17)

### Demande (2026-10-17)
- Mot pour mot : « Go P4 : ouvre sa branche depuis main, mesure d'abord la cadence et propose-moi les options de plafond avant d'en choisir
  le défaut. » Branche `perf-p4-frame-cap` ouverte depuis `main` (`e27a914`) et poussée. **Le défaut reste « sans plafond » tant que
  l'opérateur n'a pas choisi** (choisi ensuite : `e60`, voir la décision ci-dessous).

### Outillage — [OK]
- `tools/cadence.mjs` : la cadence **vue par le joueur**, dans une fenêtre Chrome **visible**, maximisée, vsync active (`launchHeaded` dans
  `bench-common.mjs` : ni `--disable-gpu-vsync` ni `--disable-frame-rate-limit`, suivi d'occlusion coupé). Intervalles entre deux
  `App.render` comptés en vsyncs, part irrégulière (intervalles hors du nombre le plus fréquent), occupation 3D du processus GPU (témoin),
  et **puissance** : `tools/energy-witness.ps1` lit les compteurs « Energy Meter » RAPL (lecture seule ; nom du jeu de compteurs localisé,
  trouvé par l'instance `RAPL_Package0_PKG` ; énergie en pWh, horloge en ms, unités calibrées contre la puissance instantanée) ; **SoC =
  boîtier − cœurs** = la part de la 780M (et de la mémoire), sans le travail CPU des autres processus. Page vide en référence à chaque tour.
- Écran : Radeon 780M à **165 Hz** (vsync mesurée 6,0-6,1 ms), 2560 × 1600 à 175 %, sur secteur. Fenêtre maximisée : 2560 × 1267 internes
  (≈ 1440p, le cas réel de l'opérateur).
- **[KO] de mesure, contourné** : une fois, la page vide statique a lu 12,1 ms (82,6 Hz) pendant que le jeu, animé, sondait 6,1 ms : le
  rafraîchissement dynamique de Windows baisse la fréquence d'un contenu fixe. Les intervalles sont désormais comptés avec la vsync sondée
  par la page elle-même ; cette série-là n'est lue que par ses p50 / p95.
- **Occupation ≠ puissance** : à 55 img/s en 1080p le GPU reste « occupé » 56-71 % alors que la puissance SoC est divisée par ≈ 3 : le pilote
  baisse les fréquences quand il y a du jeu. Seule la puissance mesure la « surcharge » (chaleur, ventilateur, batterie).

### Cadence actuelle, sans plafond — mesurée
- ≈ 1440p : 44-71 img/s selon la charge, **intervalles de 2 et 3 vsyncs mêlés (24-54 % irréguliers)**, GPU occupé 97-100 %, SoC 41-45 W.
- 1080p : 75-100 img/s, **1 et 2 vsyncs mêlés (23-36 % irréguliers)**, GPU 97-100 %, SoC 39-44 W.
- Le GPU est saturé en permanence et la cadence alterne : le pire des deux mondes.

### Mécanisme (`src/app/FrameCap.ts`, `?fps=`) — défaut `off`, image identique
- La boucle garde son rappel rAF à chaque vsync ; un rappel que le plafond refuse saute `update` et `render` (le `dt` suivant couvre les
  vsyncs sautées). Modes : `off` (boucle d'avant), `<n>` (moyenne de n img/s : intervalles alternés si l'écran n'en est pas multiple),
  `v<k>` (une image toutes les k vsyncs), `e<n>` (régulier près de n : toutes les round(fréquence / n) vsyncs ; 165 Hz → 55, 144 → 72,
  120 → 60, 60 → 60). `__stats().frameCap` et le panneau affichent le mode et la vsync.
- La vsync vient d'une **sonde au démarrage** : une chaîne rAF pendant que les Workers peignent (fil principal libre) ; médiane 6,0-6,1 ms
  à chaque chargement, `painters=main` compris. Sans assez d'échantillons : 16,7 ms, ce qui ne fait que relâcher le plafond.
- **[KO] ×2, affiner la vsync dans la boucle** : (1) médiane des intervalles qui suivent un rappel sauté : sous contention GPU ils valent
  souvent 2 vsyncs, l'estimation est passée à 12,1 ms et `e60` est retombé à « chaque vsync », sans plafond ; (2) minimum des intervalles,
  « jamais plus courts qu'une vsync » : faux, Chrome livre des rappels à 2,8-4,4 ms d'écart à 165 Hz, l'estimation a plongé et `v4` a tourné
  à 55 img/s. Les horodatages rAF de la boucle ne sont pas sur la grille vsync : seule la sonde au repos fait foi.

### Options mesurées (code final, `tools/cadence.mjs`, 2-3 tours ; SoC des tours les moins contaminés, plages sur plusieurs séries)
| Option | ≈ 1440p : img/s, irrégulier, SoC | 1080p : img/s, irrégulier, SoC | Remarque |
|---|---|---|---|
| `off` (actuel) | 44-71, 24-54 %, 41-45 W | 75-100, 23-36 %, 39-44 W | GPU saturé, cadence alternée |
| `60` (moyenne) | 59-60, 25 %, 38-42 W | 60, 25 %, 16-19 W | alterne 2 et 3 vsyncs à 165 Hz, par construction |
| `e60` (≈ 60 régulier) | **55,0, 0-0,2 %, 35 W** | **55,0, 0 %, 14,5-15 W** | 3 vsyncs exactement ; 72 à 144 Hz, 60 à 60 / 120 Hz |
| `v2` (82,5) | intenable (58-70, 21-44 %) | 80-82, 0-6 %, 34 W | seulement si le GPU tient 12,1 ms |
| `v4` (41,3) | 41,3, 0 %, 17-20 W | 41,3, 0 %, 10-12 W | le plus sobre, cadence basse |
- Page vide (référence) : SoC 2,2-2,7 W dans les tours calmes. **Contention** : d'autres séances rendaient sur la même 780M pendant la plupart
  des tours (Chrome headless à 16-52 %, signalés par le témoin) ; elles gonflent le SoC et perturbent `off` / `60` ; les lignes `e60` / `v4`
  restent régulières même sous contention.

### Preuves
- **Pixels** (`static=1&freeze=7.3`, 13 vues de la passe 6b, PNG comparés à l'octet) : plafond `off` (défaut), `e60`, `60`, `v2` puis, sur le
  build final, `off`, `e60`, `v4` : **identiques à la base figée `e27a914`** ; base deux fois identique ; contrôle négatif (`freeze=7.31`)
  détecté.
- Robustesse : `painters=main` + `e60` (sonde sur un fil principal occupé) : 55,0 img/s réguliers, vsync 6,1 ms sondée.
- `typecheck` 0, `npm run build` vert.

### Décision opérateur (2026-10-17) — [OK] `e60` par défaut
- Mot pour mot : « Je choisis e60 (≈ 60 régulier) comme plafond par défaut ; ?fps=off reste disponible. »
- `DEFAULT_FRAME_CAP` = `e60` (`App.ts`). `tools/perf.mjs` et `tools/startup.mjs` ajoutent `fps=off` quand la requête ne fixe pas `fps`
  (`uncapped` dans `bench-common.mjs`) : ils mesurent toujours la boucle sans plafond, comparable aux passes précédentes ; `tools/cadence.mjs`
  mesure ce que voit le joueur. Les autres outils (captures, preuves de culling) voient le défaut : image identique.
- Preuves du défaut : 13 vues sans paramètre (`e60` actif : 288-291 rappels sautés, vsync sondée 6,1 ms) et avec `fps=off` **identiques à
  l'octet** à la base `e27a914` ; contrôle négatif détecté. Vraie fenêtre, sans paramètre : `e60` actif (3 vsyncs). Cette série-là est tombée
  sous forte contention (un autre Chrome à 22-32 % de la même 780M) : en 1080p `e60` reste régulier à 95 % (54 img/s, SoC 30 W contaminé) ;
  en ≈ 1440p **ni `e60` ni `off` ne tiennent** (36,8 / 41,3 img/s, 54-60 % irréguliers) : le GPU partagé ne tient plus 3 vsyncs (18,3 ms).
  **[?] Piste** : un pas adaptatif (passer à 4 vsyncs quand les images ratent leur créneau, revenir à 3 quand elles le tiennent) garderait une
  cadence régulière sur un GPU plus faible ou chargé ; non fait (hors de la décision de l'opérateur), à proposer.

### Décision opérateur (2026-10-17) — [OK] P4 accepté
- Mot pour mot : « J'accepte P4 tel quel (e60 par défaut) : fusionne perf-p4-frame-cap dans main, pousse main et supprime la branche. »
- Branche `perf-p4-frame-cap` fusionnée en avance rapide dans `main`, `main` poussé, branche supprimée (locale et distante). P5 ouvrira sa
  propre branche depuis `main`.

### Pensée
- Une cadence se mesure dans une vraie fenêtre, sur l'écran réel, avec la vsync : le harnais headless (vsync coupée) ne dit rien de la
  régularité. Et une fréquence d'écran n'est pas une constante : le rafraîchissement dynamique la baisse sur un contenu fixe.
- L'occupation GPU n'est pas une puissance (le pilote baisse les fréquences) : la « surcharge » se mesure en watts (RAPL : boîtier − cœurs).
- Des horodatages rAF ne sont pas une horloge vsync : ni leur médiane après un saut, ni leur minimum ne retrouvent la vsync ; une sonde au
  repos, si. Une auto-correction qui se nourrit de son propre effet (les sauts qu'elle provoque) peut lever le plafond qu'elle règle.

## Passe 6d — Performances : P5, cache du bake de visibilité (2026-10-18)

### Demande (2026-10-18)
- Mot pour mot : « Go P5 : ouvre sa branche depuis main et commence le cache du bake de visibilité, avec ses preuves. » Branche
  `perf-p5-bake-cache` ouverte depuis `main` (`4334d57`) et poussée.

### Changement — [OK]
- `src/district/BakeCache.ts` : `bakeVisibilityCached` enveloppe `bakeVisibility` (mêmes arguments, même résultat). **Clé** = hachage 64 bits
  (deux voies 32 bits) de tout ce dont le résultat dépend : la géométrie des scènes d'ID (chaque maillage : matrice, côté et shaders du
  matériau, attributs `position` / `aPart`, index), celle de la passe « derrière », les poses échantillonnées (tous leurs champs, pleine
  précision), les fenêtres de révélation de chaque pose (calculées comme le bake, caméra de la pose au champ élargi), le cadre, le niveau
  d'eau, le nombre de pièces, les options et le plafond de page (limites GPU), **le code du bake** (`bakeCodeFingerprint()` dans
  `Visibility.ts` : shaders d'ID / de comptage, sources de `bakeVisibility`, du compteur et d'`applyPose`, constantes), la révision de Three
  et la chaîne du GPU. Toute modification d'une de ces entrées est un échec de cache, donc un bake neuf.
- Stockage : mémoire de la séance + `localStorage` (6 entrées, la plus ancienne retirée ; ≈ 63 Ko chacune : les comptes de pixels complets de
  chaque ensemble et de la passe « derrière », pour que rapports et statistiques restent identiques). Entrée illisible, de mauvaise taille,
  à somme de contrôle fausse ou qui échoue au contrôle du bake (un ensemble sans aucun pixel) = échec de cache ; un bake qui échoue n'est
  jamais stocké ; les contrôles négatifs DEV `visfail` contournent le cache ; un résultat relu est copié (aucun tableau partagé).
- `?viscache=0` (bake neuf, rien stocké), `?viscache=verify` (bake neuf comparé à l'entrée stockée : `verify-ok` / `verify-mismatch`, erreur
  console). `__stats().visibility.bakeCache` / `bakeKeyMs`, panneau (« bake N ms (hit) »).

### Preuves
- **Empreintes** (script de séance `p5-proof.mjs`, serveur dev, une instance de navigateur) : 3 graines × 6 tailles de `viewport-proof`,
  chacune chargée quatre fois (cache coupé, premier chargement, second, `verify`) ; l'empreinte de tout ce que décide le bake (comptes de
  chaque ensemble pour toutes les pièces, rapport « derrière », classes, préfixes et triangles dessinés par cadrage, Tier 3) est **identique
  sur les quatre chargements des 18 combinaisons** (72 chargements) ; second chargement servi par le cache, `verify-ok` partout. Les fenêtres plus
  étroites que 16:9 bakent le cadre 16:9 : leur premier chargement relit donc à juste titre l'entrée du 1920 × 1080 (**[KO] de mon attente**
  dans le premier passage du script, pas du cache). Régénération dans la séance 1842 → 7719 → 1842 : succès mémoire, empreintes égales aux
  bakes neufs, 18-19 ms. Contrôles : `camD` réglé, `visfine=0`, `occbehind=0` → échec de cache (la clé les voit) ; `occ=0` juste après
  `occbehind=0` → succès avec la même empreinte (mêmes entrées du bake : pas de passe « derrière » ; **[KO] de mon contrôle**, qui l'attendait
  en échec).
- **`viewport-proof`** (serveurs dev, branche contre base figée `4334d57`) : sortie **identique ligne à ligne** (mêmes 9 écarts connus de la
  passe 5b, mêmes pixels et maxima, mêmes Tier 3, redimensionnement sans rechargement identique, contrôles `visfail=alloc|zero` repliés),
  seuls les temps de bake diffèrent (10-17 ms servis par le cache contre 176-284 ms).
- **Pixels** (production, 13 vues de la passe 6b) : PNG **identiques à l'octet** à la base avec le cache (10 succès, 3 échecs = premier
  chargement de chaque graine) et avec `viscache=0` ; base deux fois identique ; contrôle négatif détecté.
- **Temps** (`tools/startup.mjs`, production, 6 + 6 + 6 chargements entrelacés, 780M, 0 / 18 sous contention GPU) : bake **337 [331-364] →
  36 [35-37] ms** après le premier chargement ; bloc `regenerate` du démarrage 946 → 653 ms ; **`__ready` 2 282 [1 999-2 307] → 1 984
  [1 914-2 400] ms** (−0,3 s) ; régénération vers une graine déjà vue 845 → 596-685 ms ; `viscache=0` : 2 240 ms, soit la base. Un échec de
  cache coûte ≈ +36 ms une fois (clé ≈ 20 ms, stockage). Le gain prévu par le plan (−0,44 à −0,73 s) était mesuré sous contention.
- `typecheck` 0, `npm run build` vert.

### Décision opérateur (2026-10-18) — [OK] P5 accepté
- Mot pour mot : « J'accepte P5 tel quel : fusionne perf-p5-bake-cache dans main, pousse main et supprime la branche. »
- Branche `perf-p5-bake-cache` fusionnée en avance rapide dans `main`, `main` poussé, branche supprimée (locale et distante). Les pistes P6-P9
  changent l'image : elles attendent la décision de l'opérateur sur captures côte à côte, chacune sur sa propre branche.

### Pensée
- Un cache d'un calcul GPU ne se justifie que si sa clé couvre **toutes** ses entrées, le code du calcul compris (sa source à l'exécution) et
  le GPU ; il se prouve par l'égalité bake neuf = relu (`verify`) sur une matrice, et par des contrôles où la clé doit changer, et un où
  elle ne doit pas (deux réglages qui donnent les mêmes entrées).
- Avant d'écrire l'attente d'un test, relire ce que le système est censé faire : deux « échecs » de cette passe étaient mes attentes (cadre
  16:9 partagé, `occ=0` = `occbehind=0`), pas le cache.

## Passe 6e — Performances : P6, résolution interne plafonnée — captures et mesures (2026-10-18)

### Demande (2026-10-18)
- Mot pour mot : « Go P6 : ouvre sa branche depuis main et prépare les captures côte à côte (natif contre résolution interne plafonnée, en
  1440p) avec les mesures, avant toute décision. » Branche `perf-p6-render-scale` ouverte depuis `main` (`45be91f`) et poussée. **Rien
  n'est décidé : le défaut reste natif.**

### Mécanisme (`App.resize`, `?res=`) — défaut natif, inchangé
- `?res=<lignes>p[:px]` : au plus lignes² × 16 / 9 pixels rendus (1080p = 1920 × 1080, 1260p = 2240 × 1260) ; au-delà, la scène **et le
  reflet** sont rendus plus petits (facteur √(budget / pixels)) et le navigateur agrandit le canevas, lissé (bilinéaire) ou au plus proche
  voisin avec `:px` (`image-rendering: pixelated`). Les sprites restent accrochés à la grille des pixels **internes** (`uResolution`). Sous le
  budget, rien ne change. Le curseur « render scale » du panneau (qui ne réduisait pas le reflet) est inchangé.

### Captures (production, 2560 × 1440, `seed=1842&clean=1&freeze=7.3`, A-D ; composites dans `perf-gpu-evidence/p6/compare/`)
- **1260p (2240 × 1260)** : presque indiscernable du natif à l'échelle 1 ; un léger adoucissement des arêtes fines au zoom.
- **1080p lissé (1920 × 1080)** : sprites et pavés nettement plus doux (le pixel-art perd son tranchant), fines fissures de l'enduit et
  barreaux du balcon adoucis ; l'ambiance (brume, lumières, DOF) ne change pas.
- **1080p `pixelated`** : net, mais les texels des sprites prennent des largeurs inégales (agrandissement × 1,33) et les diagonales des
  colombages deviennent des escaliers.

### Mesures
- **GPU** (`tools/perf.mjs`, 2560 × 1440, 780M, 3 tours propres sur 3) : B natif 15,76 ms → 1260p 12,22 (−22 %) → 1080p **9,26 (−41 %)** ;
  C natif 15,20 → 1080p 9,07 (−40 %) ; mémoire des cibles 277 → 229 → 188 Mo. **1080p à dpr 1 : 9,26 contre 9,23 ms** (sous le budget, rien
  ne change).
- **Vraie fenêtre maximisée** (`tools/cadence.mjs`, 2560 × 1267 internes en natif, plafond `e60`, 2 tours, aucun processus étranger, SoC de la
  page vide 2,4-2,9 W) : natif 55 img/s réguliers, GPU 86 %, **SoC 36-37 W** ; 1260p (2388 × 1182) 55 réguliers, 76-77 %, SoC 32 W ; 1080p
  (2047 × 1013) 55 réguliers, 64 %, **SoC 16 W (−56 %)**. Sans plafond de cadence : natif 57-60 img/s (16-28 % irréguliers), 1080p 85-86 img/s
  (10-15 % irréguliers), SoC 36-40 W dans les deux cas (le GPU reste saturé).
- Marge : en natif, `e60` laisse le GPU à 86 % (la contention de la passe 6c lui faisait déjà rater ses créneaux) ; à 1080p, 64 %.

### Décision opérateur (2026-10-18) — [OK] natif par défaut
- Options présentées : natif (aucun changement), 1260p lissé, 1080p lissé, 1080p `pixelated`, ou un budget adaptatif (non construit).
- Mot pour mot : « Garde la résolution native par défaut ; ?res= reste disponible. » Aucun changement de code : sans `?res=`, le rendu est
  celui d'avant (même chemin, `resCap` nul) ; `?res=` reste un réglage manuel. Preuve : 13 vues `static=1&freeze=7.3` sans `?res=`
  **identiques à l'octet** à la base `45be91f` ; base deux fois identique ; contrôle négatif détecté.

### Décision opérateur (2026-10-18) — [OK] P6 accepté
- Mot pour mot : « J'accepte P6 tel quel (natif par défaut, ?res= manuel) : fusionne perf-p6-render-scale dans main, pousse main et supprime
  la branche. »
- Branche `perf-p6-render-scale` fusionnée en avance rapide dans `main`, `main` poussé, branche supprimée (locale et distante). P7 ouvrira sa
  propre branche depuis `main`.

### Pensée
- Une réduction de définition se juge sur le pixel-art (les sprites) et sur les arêtes fines, pas sur la vue d'ensemble : l'ambiance ne bouge
  pas, le tranchant si. Le budget se fixe en pixels rendus, pas en facteur : un écran 1080p ne doit rien perdre.
- La puissance ne suit pas le temps GPU linéairement : −41 % de temps GPU donnent −56 % de SoC sous plafond de cadence (le pilote baisse
  les fréquences quand il a de la marge).

## Passe 6f — Performances : P7, MSAA 4× contre 2× — captures et mesures (2026-10-18)

### Demande (2026-10-18)
- Mot pour mot : « Go P7 : ouvre sa branche depuis main et prépare les captures côte à côte MSAA 4× contre 2× (arêtes, sprites, lampes)
  avec les mesures, avant toute décision. » Branche `perf-p7-msaa` ouverte depuis `main` (`a830315`) et poussée. **Rien n'est décidé : le
  défaut reste 4×.**

### Mécanisme
- `?msaa=0|2|4|8` : nombre d'échantillons de la cible de scène (`post.params.msaa`, lu avant le premier dimensionnement). Défaut 4,
  inchangé.

### Captures (production, 2560 × 1440, `seed=1842&clean=1&freeze=7.3`, A-D, avec et sans personnages ; composites dans
`perf-gpu-evidence/p7/compare/`)
- **Écart mesuré** (vues `static=1`, `tools/diff.mjs`) : 4× contre 2× : **0,26-0,62 % des pixels** à plus de 16 niveaux (sur 255), 1-1,8 %
  à plus de 4, tous sur des arêtes ; 4× contre sans MSAA : 0,44-1,02 % à plus de 16. Le reste (9-12 % des pixels à plus de 0) est un bruit
  de 1 à 4 niveaux réparti sur les surfaces (résolution de profondeur lue par le DOF / l'in-scatter), invisible.
- **Arêtes nettes du premier plan** (lampadaire, cordages, bornes, mât) : 4× et 2× quasi indiscernables à × 1,5 ; sans MSAA, la corde et le
  mât font des escaliers. **Fond** (colombages, toits) : brume et DOF masquent la différence ; sans MSAA, légers escaliers sur les diagonales.
- **Sprites** : identiques quel que soit le MSAA (quads alignés sur les texels, test alpha).
- **Non vu** : le scintillement des arêtes fines en mouvement (moins d'échantillons = plus de crépitement possible sur les cordages) ; les
  captures sont figées.

### Mesures
- **GPU** (`tools/perf.mjs`, 780M, B) : le seul tour entièrement propre donne 2560 × 1440 : 4× **15,94 ms**, 2× **13,79 (−13 %)**, sans 10,64 ;
  passe scène 10,62 / 8,51 / 5,40 ; 1080p : 9,30 / 8,09 / 6,23. Une seconde série de 4 tours est tombée sous forte contention (un autre
  Chrome à 25-39 % du GPU, deux PID d'une autre séance) : ses minima confirment l'ordre (B 1440p 16,26 / 16,48 contaminé), pas les écarts.
  Mémoire des cibles (estimation `__stats`) : 1440p 277 → 221 Mo (2×) → 192 (sans) ; 1080p 188 → 157 → 141.
- **Vraie fenêtre maximisée** (`tools/cadence.mjs`, plafond `e60`, 3 tours propres) : 4× 55 img/s réguliers, GPU 84-86 %, **SoC 35,6-36,5 W** ;
  2× 55 img/s réguliers, GPU 73-75 %, **SoC 31,1-32,4 W (≈ −12 %)**. Une première série (4×, 2×, sans) était contaminée (un autre Chrome
  jusqu'à 99 %) : seule sa ligne 4× (37,4 W) est retenue.
- **Culling** (`tools/viewport-proof.mjs --q=msaa=2`, serveur dev) : décisions identiques (le bake ne dépend pas du MSAA : mêmes Tier 3, mêmes
  triangles) ; **10 écarts élagué / `vis=0` contre 9 en 4×**, pas les mêmes : le résidu « fissures vues par un seul échantillon » change
  d'échantillons (1 à 4 px par vue, max 3-19 niveaux), l'écart connu de 30417 AB reste (64 px dont 53 d'ordre de dessin, contre 48 / 31).
  Si 2× est choisi, chaque nouvel écart s'explique par `tools/vis-why.mjs` avant d'être accepté (règle de la passe 5b) : non fait.
- Pendant les mesures, un Chrome d'une autre séance (PID 34736, lancé à 02:04:30, au milieu de ma série) occupait 92 % du GPU ; ni arrêté
  ni touché (règle M2).

### Décision opérateur (2026-10-18) — [OK] 4× par défaut
- Options présentées : garder 4× (aucun changement), 2× (≈ −13 % de temps GPU, ≈ −12 % de SoC, arêtes fines un peu moins lisses,
  scintillement en mouvement non vérifié), sans MSAA (−33 %, escaliers visibles : déconseillé).
- Mot pour mot : « Garde le MSAA 4× par défaut ; ?msaa= reste disponible. » Aucun changement de code : sans `?msaa=`, la cible garde 4
  échantillons. Preuve : 13 vues `static=1&freeze=7.3` sans `?msaa=` **identiques à l'octet** à la base (`main` `a830315`) ; base deux fois
  identique ; contrôle négatif détecté. Les écarts `viewport-proof` propres à 2× restent non expliqués (2× n'est pas le défaut).

### Décision opérateur (2026-10-18) — [OK] P7 accepté
- Mot pour mot : « J'accepte P7 tel quel (MSAA 4× par défaut, ?msaa= manuel) : fusionne perf-p7-msaa dans main, pousse main et supprime la
  branche. »
- Branche `perf-p7-msaa` fusionnée en avance rapide dans `main`, `main` poussé, branche supprimée (locale et distante). P8 ouvrira sa propre
  branche depuis `main`.

### Pensée
- Un écart d'image se lit à plusieurs seuils : « 9 % des pixels diffèrent » ne dit rien tant qu'on ne sépare pas le bruit de 1-4 niveaux des
  arêtes à plus de 16 ; et se juge là où la scène est nette (premier plan), pas dans le fond que la brume et le DOF lissent déjà.
- Sous contention, une seule série propre vaut mieux que des médianes contaminées : relancer quand le témoin est calme, et le dire.

## Passe 6g — Performances : P8, reflet planaire 1/2 contre 1/4 — captures et mesures (2026-10-18)

### Demande (2026-10-18)
- Mot pour mot : « Go P8 : ouvre sa branche depuis main et prépare les captures côte à côte du reflet 1/2 contre 1/4 (canal en A, B, D)
  avec les mesures, avant toute décision. » Branche `perf-p8-reflection` ouverte depuis `main` (`5cb5ad7`) et poussée. **Rien n'est
  décidé : le défaut reste 1/2.**

### Mécanisme
- `?refl=<échelle>` : taille du reflet planaire par rapport à la définition interne (`reflection.scale`, défaut 0,5, inchangé). Le reflet
  garde ses mips et l'ondulation du shader d'eau.

### Captures (production, 2560 × 1440, `seed=1842&clean=1&freeze=7.3`, A, B, D, avec et sans personnages ; composites dans
`perf-gpu-evidence/p8/compare/`)
- **Écart** (vues `static=1`) : confiné au canal ; 3-6 % des pixels changent un peu, **0,44-0,55 % de plus de 8 niveaux** (maximum
  129-178 : les traînées de reflet des lampadaires et des fenêtres).
- À l'échelle 1 : à 1/4, les traînées des lampadaires et les reflets des façades (D) s'adoucissent et s'étalent un peu ; l'ondulation de
  l'eau floutait déjà le reflet, la lecture d'ensemble du canal ne change pas.

### Mesures
- **GPU** (`tools/perf.mjs`, 780M, 4 tours propres sur 4) : passe reflet **B 2560 × 1440 1,11 → 0,47-0,52 ms**, A 0,84 → 0,38-0,40, B 1080p
  0,74 → 0,35 ; total B 1440p 15,47-16,11 → 14,69-16,58 (médianes 15,50 / 15,30, un tour bruité), A 1440p 13,52 → 13,04 (−3,5 %), B 1080p 9,25 →
  8,84 (−4,4 %).
- **Vraie fenêtre maximisée** (`tools/cadence.mjs`, `e60`, 3 tours propres) : 1/2 GPU 84-87 %, SoC 35,2-37,7 W ; 1/4 GPU 82-83 %, SoC
  35,5-35,9 W : 55 img/s réguliers dans les deux cas ; écart de puissance de 0 à 2 W, **dans le bruit de la mesure**.

### Décision opérateur (2026-10-18) — [OK] 1/2 par défaut
- Options présentées : garder 1/2 (aucun changement) ou 1/4 (−0,4 à −0,6 ms par image, puissance inchangée dans la mesure, reflets un peu
  plus doux).
- Mot pour mot : « Garde le reflet à 1/2 par défaut ; ?refl= reste disponible. » Aucun changement de code : sans `?refl=`, le reflet garde
  l'échelle 0,5. Preuve : 13 vues `static=1&freeze=7.3` sans `?refl=` **identiques à l'octet** à la base (`main` `5cb5ad7`) ; base deux fois
  identique ; contrôle négatif (`freeze=7.31`) détecté (91 % des pixels de B diffèrent).

### Décision opérateur (2026-10-18) — [OK] P8 accepté
- Mot pour mot : « J'accepte P8 tel quel (reflet 1/2 par défaut, ?refl= manuel) : fusionne perf-p8-reflection dans main, pousse main et
  supprime la branche. »
- Branche `perf-p8-reflection` fusionnée en avance rapide dans `main`, `main` poussé, branche supprimée (locale et distante). P9 ouvrira sa
  propre branche depuis `main`.

### Pensée
- Un poste de 1 ms sur 16 ne se voit plus en watts sous plafond de cadence : la passe de reflet était déjà à 7 % du temps GPU ; diviser
  ses pixels par 4 la ramène à 3 %, sans effet mesurable sur la puissance.

## Passe 6h — Performances : pas adaptatif du plafond de cadence (`?fps=a60`) — mesures (2026-10-18)

### Demande (2026-10-18)
- Mot pour mot : « Go pas adaptatif : ouvre sa branche depuis main et mesure d'abord le plafond qui passe de 3 à 4 vsyncs quand le GPU rate
  son créneau, avec cadence.mjs, avant toute décision. » Branche `perf-p4b-adaptive-cap` ouverte depuis `main` (`2560ce9`) et poussée. Les
  mesures ont été faites avec `e60` par défaut et le pas adaptatif en mode manuel, `?fps=a60` (choisi ensuite par défaut : voir la décision).

### Mécanisme (`src/app/FrameCap.ts`)
- `a<n>` = `e<n>` (toutes les round(fréquence / n) vsyncs, 3 à 165 Hz) plus un pas adaptatif. Une image rendue est **en retard** quand
  son intervalle dépasse le pas + ½ vsync (horodatages rAF, ceux que la porte du plafond utilise déjà). **3 retards parmi les 30 dernières
  images** → une vsync de plus par image, jusqu'au plancher de 30 img/s (5 vsyncs à 165 Hz). Après 4 s à un pas plus long, **essai** du pas
  plus court pendant 2 s : gardé s'il tient ; sinon défait, et l'attente avant l'essai suivant double (au plus 16 s, remise à 4 s après un
  essai réussi). Ne comptent pas : la première image, un trou ≥ 250 ms (régénération, onglet caché) et les 2 s qui suivent (grâce), ni les
  6 images qui suivent un changement de pas.
- `__stats().frameCap` : `every` (pas courant), `steps`, `trialsFailed`, `log` (« ms rAF:pas ») ; panneau ; `tools/cadence.mjs` les affiche
  (et `t0` dans le JSON pour caler `log` sur les intervalles).
- Le chemin `e60` (défaut) ne change pas : même calcul de pas, même porte. Preuve pixel ci-dessous.

### Charge GPU synthétique (outil de mesure, hors dépôt : `perf-gpu-evidence/p4b/`)
- Pour faire rater le créneau à volonté, un crochet `cadence.mjs` ajoute après chaque `App.render` un triangle plein écran dans une cible
  1024² (boucle sin / cos de n itérations, GL brut puis `renderer.resetState()`), chronométré par le `GpuTimer` du jeu (passe « load ») :
  ≈ 4,5 µs par itération sur la 780M (`tools/perf.mjs`, 2560 × 1267 : n = 100 → 0,46 ms, 200 → 0,89, 400 → 1,79). C'est une charge **par
  image rendue** (une scène plus lourde, un GPU plus faible), pas une contention extérieure. Charges utilisées, extrapolées : n = 780
  (≈ +3,5 ms), 1250 (≈ +5,5 ms), 2700 (≈ +12 ms). Vue B (`seed=1842&clean=1&player=-4.6,0.6`), fenêtre maximisée 2560 × 1267, 165 Hz.

### Première série — [KO] deux défauts, corrigés
- **Démarrage** : sans charge, `a60` montait à 4 puis 5 vsyncs dans les 0,3 s qui suivent la première image (les premières images de la
  boucle durent 30-100 ms), puis redescendait d'un pas toutes les 4 s : 44,7-44,8 img/s et 54 % d'intervalles hors de 3 vsyncs dans la
  fenêtre mesurée, à chaque chargement. Corrigé par la grâce de 2 s et les 6 images de stabilisation.
- **Retour lent** : après deux essais ratés sous charge l'attente était de 16 s (plafond 32 s) : la charge partie, `a60` est resté à 4 vsyncs
  ≈ 15 s. Plafond ramené à 16 s.
- Le principe tenait déjà : sous charge, 4 vsyncs réguliers au lieu du mélange 3 / 4 d'`e60`.

### Seconde série (code final, 2 tours, `tools/cadence.mjs`)
| Charge | `e60` (défaut) | `a60` | `v4` |
|---|---|---|---|
| aucune | 55,0 img/s, 3 vsyncs 99,5-100 % ; SoC 36,7 W | 55,0 img/s, 3 vsyncs 99,5-100 %, **0 changement** ; SoC 37,2 W | — |
| +3,5 ms | 48,8-48,9 img/s, 3 vsyncs 62-64 % / 4 : 35-36 % ; SoC 40,5 W | 42,1 img/s, **4 vsyncs 90,5-90,8 %** ; SoC 35,3 W | — |
| +5,5 ms | 44,0-44,1 img/s, 4 vsyncs 70-72 % / 3 : 26-28 % ; SoC 40,0 W | 41,6 img/s, **4 vsyncs 95,5 %** ; SoC 38,6 W | 41,1 img/s, 4 vsyncs 100 % ; SoC 38,2 W |
| +12 ms | 33,4-33,6 img/s, 5 vsyncs 83-87 % / 4 : 12 % (quelques 6-14) | 33,3 img/s, **5 vsyncs 94-95 %** | — |
- Dans `a60`, le reste (3 vsyncs à +3,5 / +5,5 ms, 4 à +12 ms) est l'essai raté tombé dans la fenêtre de 8 s : entre deux essais, 100 % au
  pas long. SoC du premier tour seulement : le témoin d'énergie n'a plus rendu d'échantillon à partir du milieu de la série (cause trouvée
  en passe 6i : le compteur du boîtier a passé 1e15 pWh et s'est écrit « 1,011E+15 »).
- **Charge qui arrive et repart** (charge +5,5 ms de 4 à 14 s d'une fenêtre de 30 s) : `e60` passe de 55 à 45,4-46,3 img/s, **4 vsyncs
  56-63 % / 3 : 37-44 %** pendant la charge. `a60` passe à 4 vsyncs **0,33-0,43 s** après l'arrivée de la charge : 42,0-42,2 img/s, **4 vsyncs
  91-92 %** (le reste : un essai à 8,4 s, défait en 0,4 s) ; la charge partie à 14 s, il revient à 3 vsyncs à l'essai suivant (16,8 s, attente
  doublée à 8 s), puis 55 img/s réguliers : 2,8 s de 41 img/s de trop.
- Coût en régime chargé durable : un essai raté toutes les 4, 8 puis 16 s, ≈ 0,4-0,6 s de mélange 3 / 4 chacun (≈ 3 % du temps, calculé).

### Outillage — [KO] `TaskStop` n'arrête que le shell
- Un étalonnage puis un balayage lancés en `run_in_background` (`bash script.sh`) et arrêtés par `TaskStop` ont continué : seul bash s'est
  arrêté, node et son Chrome ont couru jusqu'au bout (≈ 1 min) et le balayage relancé les a vus comme contention étrangère (PID 32848 /
  21852, 37-61 % du GPU). Repérés par `Get-Process -Id` sur les PID du témoin, attendus jusqu'à leur sortie, mesures refaites ; aucun processus
  arrêté à la main. Règle notée dans AGENTS (section des processus).

### Preuves
- Pixels (`static=1&freeze=7.3`, 13 vues de la passe 6b, builds figés) : sans paramètre (`e60`) et avec `fps=a60`, **identiques à l'octet**
  à la base `main` `2560ce9` (13 / 13 chacun) ; base deux fois identique ; contrôle négatif (`freeze=7.31`) détecté (91 % des pixels de B).
- `typecheck` 0, `npm run build` vert : même bundle (`index-0fz2QHsv.js`) que le build mesuré par la seconde série et la preuve.

### Options pour l'opérateur
1. **Garder `e60` par défaut** (aucun changement) ; `?fps=a60` reste un réglage manuel.
2. **`a60` par défaut** : identique à `e60` tant que le GPU tient ses 3 vsyncs (mesuré : 55,0 img/s, aucun changement de pas) ; quand il ne
   les tient plus (GPU plus faible, autre programme sur le GPU, fenêtre plus grande), 41 img/s réguliers au lieu d'un mélange 3 / 4 à
   44-49 img/s, un essai de retour toutes les 4-16 s, et jusqu'à 16 s à 41 img/s après la fin d'une longue charge.
- Le choix est entre régularité et nombre d'images sous charge ; sur cette machine au calme, rien ne change.

### Décision opérateur (2026-10-18) — [OK] `a60` par défaut
- Mot pour mot : « Je choisis a60 (pas adaptatif) comme plafond par défaut ; ?fps=e60 reste disponible. »
- `DEFAULT_FRAME_CAP` = `a60` (`App.ts`) ; `?fps=e60` garde le pas fixe, `?fps=off` la boucle sans plafond ; `tools/perf.mjs` et
  `tools/startup.mjs` mesurent toujours sans plafond (`fps=off` ajouté).
- Preuves du défaut (build figé de la branche, `index-CLn5puYo.js`, le même que `npm run build`, sans paramètre) : 13 vues `static=1&freeze=7.3` **identiques à l'octet** à `main` `2560ce9`
  (et de même avec `fps=a60`) ; base deux fois identique ; contrôle négatif détecté. Vraie fenêtre maximisée, sans paramètre : `a60` actif,
  **55,0 img/s, 3 vsyncs 100 %, aucun changement de pas** au calme ; sous la charge +5,5 ms, **41,6 img/s, 4 vsyncs 95,2 %** (le reste : un
  essai défait en 0,36 s) contre `?fps=e60` 46,0 img/s, 4 vsyncs 58 % / 3 : 42 %. Le témoin d'énergie n'a rendu aucun échantillon sur cette
  série (déjà muet depuis le milieu de la seconde ; cause en passe 6i) : pas de puissance pour cette vérification.

### Décision opérateur (2026-10-18) — [OK] pas adaptatif accepté
- Mot pour mot : « J'accepte le pas adaptatif tel quel (a60 par défaut, ?fps=e60 manuel) : fusionne perf-p4b-adaptive-cap dans main, pousse
  main et supprime la branche. »
- Branche `perf-p4b-adaptive-cap` fusionnée en avance rapide dans `main`, `main` poussé, branche supprimée (locale et distante). La suite
  (P9, témoin d'énergie muet) ouvrira sa propre branche depuis `main`.

### Pensée
- Le retard d'une image se lit dans les horodatages rAF, à condition d'écarter le démarrage et les trous : les premières images de la boucle
  ont suffi à pousser le pas au plancher à chaque chargement.
- La marge du GPU ne se prédit pas : ses minuteries incluent la contention (étalonnage : 31 ms au lieu de 15,6 avec un autre Chrome sur le GPU) et le
  pilote baisse les fréquences quand il y a du jeu ; le pas plus court se vérifie donc par un essai, pas par un calcul.

## Passe 6i — Outillage : le témoin d'énergie muet en cours de série (2026-10-18)

### Demande (2026-10-18)
- Mot pour mot : « Go témoin d'énergie : ouvre sa branche depuis main et trouve pourquoi tools/energy-witness.ps1 ne rend plus
  d'échantillons en cours de série, avec ses preuves. » Branche `tools-energy-witness` ouverte depuis `main` (`74ccb91`) et poussée.

### Symptôme
- Passe 6h : puissance `NaN` à partir du 9e variant du premier tour de la seconde série (lancée à 04:00:25, vers 04:03), puis sur **toutes**
  les mesures suivantes, y compris dans des processus neufs (série dynamique, vérification du défaut, page vide comprise) : le défaut tenait
  à la machine, pas à la vie d'un processus témoin.

### Cause — [OK] trouvée et prouvée
- Le script écrivait les compteurs en `[double]` avec `-f`, dans la culture de la session (**fr-FR**). Un `[double]` de plus de 15 chiffres
  s'écrit en notation scientifique avec la virgule décimale française : `999999999999999` → « 999999999999999 », mais `1000000000000000` →
  « 1E+15 » et `1011028324583330` → « 1,01102832458333E+15 ». Le lecteur (`Number` dans `bench-common.mjs`) rend `NaN` pour cette chaîne
  (« 1.011…E+15 », avec un point, se lirait), et `meanPower` rend `NaN` sans rien dire.
- Le compteur « énergie » du boîtier (RAPL, en pWh) cumule depuis le départ du compteur (son horloge : 195 430 531 ms ≈ 54 h, sans doute le
  démarrage de la machine) : il a passé **1e15 pWh (1 kWh, ≈ 18,6 W de moyenne sur 54 h)** pendant la seconde série. Cohérence : à 04:27:08 il
  valait 1,011028e15 pWh, soit 1,1e13 pWh (39,7 kJ) au-delà du seuil, ≈ 28 W de moyenne depuis 04:03, ce que donnent les séries, les preuves et
  le repos de cette période. La somme des cœurs (7,6e14 pWh) l'aurait passé plus tard.
- Aucun chiffre publié n'est faux : sous le seuil, les valeurs s'écrivaient en entiers (lues justes) ; au-delà, elles étaient illisibles, donc
  absentes (`NaN`), jamais mal lues. Le `[double]` perdait aussi le 16e chiffre (résolution 10 pWh), sans effet sur des écarts de 1e10-1e11.

### Correctif
- `tools/energy-witness.ps1` : les compteurs (`RawValue`, des `UInt64`) sont gardés en `[decimal]` et écrits en entiers dans la culture
  invariante (`[string]::Format(InvariantCulture, …)`) : pleine précision, lisibles dans toute culture et à toute valeur.
- `tools/bench-common.mjs` : une ligne illisible est signalée une fois (« [energy-witness] unparsable sample … ») et laissée de côté, au lieu
  de rendre la puissance `NaN` en silence.

### Preuves
- Culture `fr-FR`, formats ci-dessus relevés dans PowerShell 5.1 ; `Number("1,01102832458333E+15")` = `NaN`.
- Ancien et nouveau script lancés ensemble 6 s sur les mêmes compteurs : l'ancien écrit « 1,0113348909625E+15 », le nouveau
  « 1011334790362500 » ; `meanPower` sur l'ancien journal : `NaN` ; sur le nouveau : boîtier 11,9 W, SoC 2,5 W (repos).
- Bout en bout (`tools/cadence.mjs`, serveur dev, vue B, défaut `a60`, 2 tours) : la puissance revient, page vide boîtier 7,0-12,9 W / SoC
  2,5-3,0 W, jeu 57,9-58,7 W / **SoC 37,3-39,0 W** à 55,0 img/s réguliers (passes 6c-6h, même vue : 35-37 W), aucune ligne signalée illisible.

### Décision opérateur (2026-10-18) — [OK] réparation acceptée
- Mot pour mot : « J'accepte la réparation du témoin d'énergie telle quelle : fusionne tools-energy-witness dans main, pousse main et supprime
  la branche. »
- Branche `tools-energy-witness` fusionnée en avance rapide dans `main`, `main` poussé, branche supprimée (locale et distante).

### Pensée
- Un nombre écrit par un script pour un autre programme s'écrit dans la culture invariante, et en entier quand c'est un compteur : la
  culture de la machine et la taille du nombre ne doivent pas changer son format. Et un lecteur qui reçoit l'illisible le dit.

## Passe 6j — Performances : P9, DOF en demi-résolution — captures et mesures (2026-10-18)

### Demande (2026-10-18)
- Mot pour mot : « Go P9 : ouvre sa branche depuis main et prépare les captures côte à côte du DOF pleine contre demi-résolution (A, B, D)
  avec les mesures, avant toute décision. » Branche `perf-p9-dof-half` ouverte depuis `main` (`64cf157`) et poussée. Mesuré avec le DOF
  pleine résolution par défaut et `?dof=half` en réglage manuel (abandonné ensuite : voir la décision).

### Mécanisme (`src/atmosphere/PostFX.ts`, `?dof=half|full`)
- `?dof=half` : la même collecte (26 échantillons, `DOF_FRAG` inchangé) sur une cible de demi-largeur et demi-hauteur, son rayon toujours en
  pixels pleine résolution ; puis une recomposition pleine résolution (`DOF_UP_FRAG`) : un pixel dont le cercle de confusion reste sous le
  seuil de la collecte (0,35 px) garde exactement la couleur de la scène (décor net, personnages protégés), au-delà il prend le flou
  rééchantillonné (fondu de 0,35 à 1,5 px). Le calcul du cercle de confusion est partagé (`DOF_COC`) ; le texte final de `DOF_FRAG` est
  identique caractère pour caractère à celui de `main` (2 006 caractères, comparés).
- `__stats().resolution` porte « DOF0.5 » ; le minuteur GPU sépare `dof` (collecte) et `dofup` (recomposition). +7 Mo de cible en 1440p.

### Captures (production, 2560 × 1440, `seed=1842&clean=1&freeze=7.3`, A, B, D, avec et sans personnages ; composites dans
`perf-gpu-evidence/p9/compare/`)
- Écart (vues `static=1`) : A 24,9 % des pixels changent un peu, **0,30 % de plus de 8 niveaux** (max 94) ; B 25,0 % / **0,53 %** (max 110) ;
  D 7,0 % / **0,17 %** (max 113). Seuls changent les bords des zones floues (quai et lampadaires du premier plan, fenêtres et toits du fond,
  bord gauche) ; la zone nette (personnages, étal, forge) est identique au pixel, comme voulu.
- À l'œil (crops ×1 et ×2) : les deux images se confondent ; en demi-résolution les bords flous sont un peu plus doux, et les fortes lumières
  floues (lanterne de D à ×2) montrent une légère marche.

### Mesures GPU (`tools/perf.mjs`, 780M, 4 tours propres sur 4, médianes)
| Vue | DOF plein : total / passe DOF | DOF demi : total / collecte + recomposition |
|---|---|---|
| B 2560 × 1440 | 16,55 / 1,67 ms | 16,72 / 0,87 + 1,04 = 1,91 ms |
| A 2560 × 1440 | 13,68 / 1,88 ms | 14,18 / 0,97 + 0,91 = 1,88 ms |
| D 2560 × 1440 | 14,21 / 1,41 ms | 15,02 / 0,79 + 1,09 = 1,88 ms |
| B 1920 × 1080 | 9,95 / 0,96 ms | 9,78 / 0,46 + 0,58 = 1,04 ms |
- **[KO] aucun gain** : la collecte en demi-résolution coûte bien deux fois moins (pas quatre : ses 26 échantillons lisent des textures
  pleine résolution, moins bien en cache), mais la recomposition est une passe plein écran de plus (lire couleur et profondeur, écrire
  RGBA16F : ≈ 1 ms en 1440p sur la 780M), ce que la passe DOF pleine payait déjà ; la passe DOF était limitée par cette bande passante, pas
  par ses échantillons.

### Vraie fenêtre (`tools/cadence.mjs`, 3 tours) — **[?] inexploitable**
- Une charge CPU étrangère pendant toute la série : page vide à 22-25 W de boîtier, SoC calculé à −5,3 à 0,9 W (les cœurs dépassaient le
  boîtier entre deux lectures : sous forte charge CPU, « boîtier − cœurs » n'est plus une mesure du SoC). **La sonde de vsync du plafond a lu
  10,1 / 10,4 / 13 ms au lieu de 6,1 dans 3 chargements sur 12** (tous au premier tour) : le plafond a alors tourné à un pas faux. Série
  non relancée : le minuteur GPU tranche déjà.

### Preuves
- Pixels (`static=1&freeze=7.3`, 13 vues) : sans paramètre et avec `dof=full`, **identiques à l'octet** à la base `main` `64cf157` (13 / 13
  chacun) ; base deux fois identique ; contrôle négatif détecté. `typecheck` 0.

### Options pour l'opérateur
1. **Abandonner P9** : retirer le code de la branche, garder au journal la mesure et les captures (le DOF pleine résolution reste).
2. Garder `?dof=half` en réglage manuel : sans gain mesuré sur la 780M, image un peu plus douce aux bords flous.
3. Essayer une variante plus profonde : recomposer le DOF dans la passe d'étalonnage (qui lit déjà l'image en pleine résolution) et sortir le
   bloom de son mélange actuel ; gain estimé ≤ 0,8 ms en 1440p d'après les passes mesurées, bloom changé, nouvelles captures nécessaires ;
   sous `a60` au calme, un gain de cette taille ne s'est pas vu en watts (P8).

### Décision opérateur (2026-10-18) — [OK] P9 abandonné
- Mot pour mot : « J'abandonne P9 : retire le code de ?dof=half de la branche, garde la mesure et les captures au journal, puis prépare la
  fusion. »
- Code retiré : `src/atmosphere/PostFX.ts` et `src/app/App.ts` repris de `main`, entrée `dof=` retirée d'AGENTS ; `git diff main -- src tools
  AGENTS.md` vide, `typecheck` 0. La branche n'apporte plus que cette passe du journal ; captures et mesures restent dans
  `perf-gpu-evidence/p9/` (notes partagées). Le DOF reste en pleine résolution.

### Décision opérateur (2026-10-18) — [OK] P9 accepté (journal seul)
- Mot pour mot : « J'accepte P9 tel quel (abandonné, journal seul) : fusionne perf-p9-dof-half dans main, pousse main et supprime la branche. »
- Branche `perf-p9-dof-half` fusionnée en avance rapide dans `main`, `main` poussé, branche supprimée (locale et distante). Le plan GPU
  (P0-P9) est terminé ; reste la piste de la sonde de vsync (voir « À reprendre »).

### Pensée
- Une passe plein écran se paie d'abord en bande passante : réduire ses échantillons sans retirer la passe ne gagne rien sur une iGPU. Un
  effet « en demi-résolution » ne paie que si sa recomposition tient dans une passe qui existe déjà.
- Une sonde de vsync au démarrage peut se tromper sous forte charge CPU étrangère (3 chargements sur 12) : à durcir (piste ouverte).
  **Corrigé en passe 6k** : la charge CPU (ni GPU) ne le reproduit pas ; c'est le rythme des rappels de Chrome lui-même qui avait changé.

## Passe 6k — Performances : la sonde de vsync du plafond, contrôlée en cours de session (2026-10-18)

### Demande (2026-10-18)
- Mot pour mot : « Go sonde de vsync : ouvre sa branche depuis main, reproduis la mauvaise lecture (10-13 ms au lieu de 6,1) sous charge CPU et
  durcis la sonde du plafond, avec ses preuves. » Branche `perf-vsync-probe` ouverte depuis `main` (`8d0386c`) et poussée.
- En cours de tâche, mot pour mot : « peut tu faire tes tests navigateurs discretement ? » (voir « Outils discrets »).

### Reproduction — [KO] pas reproduite par une charge
- Outil `tools/vsync-probe.mjs` : fenêtre avec vsync, n chargements, lecture de la sonde et de ses intervalles bruts, charge CPU (fils occupés)
  ou GPU (le jeu sans plafond dans un Chrome headless) en option. Build de production identique à `main` (même bundle `index-CLn5puYo.js`).
- **0 lecture fausse sur 30 chargements** : au calme 0/6, sous 16 fils occupés (16 cœurs logiques) 0/8, sous un autre Chrome qui sature le GPU
  0/8, les deux ensemble 0/8 ; les intervalles de la sonde tombent à 95-99 % sur un intervalle d'écran (6,1 ms) dans tous les cas.
- **Relecture des données de la passe 6j** (rappels rAF par seconde pendant la fenêtre mesurée) : B demi, tour 1 : sonde 10,1 ms et
  **98,5 rappels/s** ; D plein, tour 1 : sonde 13 ms et **116 rappels/s** ; D demi, tour 1 : sonde 10,4 ms mais **159,5 rappels/s** ; tous les
  autres : 161-165/s. La sonde ne s'était pas trompée sur ses échantillons : **Chrome a livré ses rappels plus lentement pendant une à deux
  minutes**, puis est revenu à 165 Hz ; une lecture unique au démarrage a alors réglé toute la session sur un pas faux. Cause du ralentissement
  **[?]** : ni la charge CPU ni la charge GPU seules (ci-dessus) ; hypothèse : un rafraîchissement dynamique de l'écran ou du pilote.
- Les séries de la passe 6h montrent aussi que, quand le GPU ne suit pas les images du jeu, Chrome espace lui-même les rappels (57-126/s
  sous la charge synthétique en `e60`, 163-166/s dès que les images tiennent) : les rappels de la boucle ne lisent l'écran que si le GPU ne
  freine pas.

### Mécanisme (`src/app/FrameCap.ts`) — contrôle en cours de session
- Sur chaque fenêtre de 1,5 s d'un mode calé sur la vsync, sans image en retard (intervalle > pas + ½ vsync) ni trou ≥ 250 ms : lecture =
  la médiane des intervalles qui **finissent sur un rappel sauté** par le plafond (un rappel au repos arrive au rythme de l'écran), ou, avec
  moins de 30 rappels sautés (boucle limitée par le GPU, chaque rappel rend), **la grille de tous les rappels** (`gridInterval` : le plus
  grand intervalle dont ils sont tous des multiples entiers à 12 % près, seulement s'ils couvrent au moins deux multiples d'au moins 10 %
  chacun). Deux lectures consécutives d'accord à 5 % et à plus de 10 % de la valeur courante la remplacent (`vsyncFrom` 'loop', les deux
  sens) ; le pas adaptatif repart alors de zéro.
- **[KO] premier jet** : la médiane de tous les intervalles. Avec une lecture de 13 ms sur l'écran 165 Hz, la boucle limitée par le GPU
  espaçait chaque rappel de 18,1 ms, aucune image ne comptait en retard (seuil 19,5 ms), et 18,1 ms a été pris pour la vsync (4 chargements sur
  4). D'où les rappels sautés, puis la grille, qui ne répond rien sur des intervalles tous égaux.
- `__stats().frameCap` : `vsyncChanges`, `vsyncLog` ; `cadence.mjs` compte les intervalles avec la vsync de la page si elle vient de la sonde
  ou du contrôle, avec la sienne sinon. DEV seulement : `?vsyncprobe=<ms>` (une lecture fausse à la demande) et `?vsyncwatch=0` (contrôle
  coupé), absents du bundle de production.

### Validation (`tools/vsync-probe.mjs --play`, `tools/cadence.mjs`, fenêtre discrète)
- **Correction** (serveur dev, lectures forcées) : 10,4 ms → 6,05-6,10 ms dans **3 chargements sur 3** (5,8-6,6 s après le chargement) ;
  13 ms en 1280 × 720 (GPU peu chargé, des rappels sautés) → 6,1 dans **3 sur 3** (4,2-5,0 s) ; 13 ms en fenêtre maximisée (GPU saturé :
  la grille) → 6,1 dans 2 sur 4 au bout de 8 s, et dans les deux tours de `cadence.mjs` (6,6 et 7,2 s) : **55,0 img/s, 3 vsyncs 100 %,
  GPU 84 %, SoC 35,9-36,3 W**, contre, contrôle coupé, 49,3-65,5 img/s, 44-49 % irréguliers, GPU 97 %. Contrôle coupé : la lecture reste
  fausse (2 sur 2).
- **Aucun faux changement** (production, défaut `a60`) : au calme 0 sur 4, sous un autre Chrome qui sature le GPU 0 sur 4, sous 16 fils occupés
  0 sur 3 (10 s de jeu chacun) ; GPU saturé par le jeu lui-même (`cadence.mjs`, charge synthétique : `e60` +5,5 ms, `a60` +12 ms, `v3` +5,5 ms) :
  0 changement.
- **Limite [?]** : une lecture trop **basse** (4 ms forcée) n'est pas corrigée : jugées avec cette vsync, les images paraissent en retard et
  les fenêtres sont écartées ; la cadence reste près du bon pas (`a60` monte à 5-6 pas de 4 ms, soit ≈ 3 vsyncs réelles). Jamais observée.

### Outils discrets — [OK]
- `launchHeaded` place désormais la fenêtre hors de l'écran (`--window-position=-3000,0`), sans la mettre au premier plan ; `cadence.mjs` et
  `vsync-probe.mjs` réutilisent son premier onglet (**un nouvel onglet prenait le focus clavier** : `document.hasFocus()` vrai, des frappes
  seraient parties dans une fenêtre invisible) et émulent la fenêtre maximisée (`MAX_VIEWPORT` : 1463 × 724 à 1,75 → 2560 × 1267).
  Vérifié : rappels à 6,1 ms, DPR 1,75, état `visible`, pas de focus, sonde du jeu 6,1 ms ; au calme mêmes valeurs qu'en fenêtre visible
  (55,0 img/s réguliers, SoC 36 W). `--visible=1` rend l'ancienne fenêtre maximisée. Les deux premières séries de validation de cette passe
  (avant la demande) étaient encore visibles.

### Preuves
- Pixels (`static=1&freeze=7.3`, 13 vues, builds figés) : sans paramètre (`a60` avec le contrôle) et avec `fps=e60`, **identiques à l'octet**
  à la base `main` `8d0386c` (13 / 13 chacun) ; base deux fois identique ; contrôle négatif détecté. `typecheck` 0, `npm run build` vert
  (même bundle `index-B8aQqSrE.js` que la validation de production et la preuve).

### Décision opérateur (2026-10-18) — [OK] durcissement accepté
- Mot pour mot : « J'accepte le durcissement de la sonde de vsync tel quel (contrôle en cours de session, outils discrets) : fusionne
  perf-vsync-probe dans main, pousse main et supprime la branche. »
- Branche `perf-vsync-probe` fusionnée en avance rapide dans `main`, `main` poussé, branche supprimée (locale et distante).

### Pensée
- Une mesure unique au démarrage décrit le démarrage : une grandeur qui peut changer pendant la session se revérifie pendant la session, et
  seulement avec des échantillons qu'elle ne fausse pas (ici les rappels au repos, ou la grille quand il n'y en a pas).
- Avant de durcir contre une cause, la reproduire : la « charge CPU » de la passe 6j était une coïncidence, les données de la même série
  (rappels par seconde) le montraient déjà.

