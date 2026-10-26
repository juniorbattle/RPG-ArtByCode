# Journal de bord — archive : passes AP1, UI4, AF1, AP2 et RC2 (2026-10-26)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-10-26 (Passe V0) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe AP1 — La page publiée de l'arène republiée au même lien avec le HUD d'aujourd'hui (décision C2-16) (2026-10-26)

### Demande
- Séance locale lancée par la séance parente : republier la page privée de l'arène de la Passe P2
  (https://claude.ai/artifact/EzSKUGk1jrCSxLENY5CC44) **au même lien**, avec le HUD d'aujourd'hui (système de design de la Passe UI3, barre
  d'actions à 60 px de la Passe C2) : décision C2-16 « La republier » (Passe C2F). La page de l'essai du nouveau duel
  (https://claude.ai/artifact/HnfCTWXSggDVVyVUskTBJK) ne change pas.
- Branche `arena-page-republish` depuis `main` (`d604a3b`), **dans un worktree hors du dossier partagé** : deux autres séances travaillent dans le
  même dossier (l'écran de chargement, C2-14 ; la feuille de combat complète de Ren), qui est passé pendant cette passe sur leur branche
  `ren-combat-x3-full`. Le build se fait sur l'instantané de `main`, jamais sur la copie partagée ; aucune branche n'y est changée par cette
  séance. `.gitignore` et `.claude/` jamais commités. Serveur : `c216-arena-page` (:5213, `vite preview` du dossier du build), par
  `preview_start` / `preview_stop`.

### Fait — [OK] le build et la page
- `tools/arena-scene-page.mjs` à l'identique sur le worktree : son build et sa page, ligne pour ligne, par un script hors dépôt qui importe le
  vite du dépôt par son chemin (`configFile: false` : le worktree n'a que `node_modules/three`, et `vite.config.ts` n'ajoute aux options de l'outil
  que celles du serveur de développement). `scene=arena`, titre « Arène des Champions », 30 fichiers dans `assets/` (scripts, les trois polices,
  les feuilles PNG de la distribution que le bundle référence).
- **Les mêmes 30 fichiers, aux mêmes noms hachés, que la page de l'essai C2** (publiée en Passe C2 depuis `5ce9d5b`) : le bundle de production
  n'a pas changé depuis (Passes AA2 et RC1 : identique à l'octet) ; seule l'adresse que pose la page diffère (`scene=arena` contre
  `scene=arena&combat=dynamic`).
- L'ancienne page (version 1, Passe P2) : trois scripts (`index-EoT3_oc6.js`, `ArenaApp-jwP2gsAa.js`, `painter.worker-DgtNG3xK.js`) et le HUD
  d'avant le système de design (Segoe UI, cadres plats).

### Vérifié avant de publier — la page dans le squelette du service, servie en local
- `check.html` = le squelette que le service ajoute (relu sur la version 1 : doctype, `charset`, `viewport`, styles de base) suivi
  d'`arena-page.html`, servi par `vite preview`.
- **`tools/arena-scene-check.mjs`** (`BASE_URL=…/check.html`) : **PASS** — le jeu en direct (touches pendant que la boucle tourne : 4,9 s,
  dernière action `heavy`, Marek à 732), l'empreinte égale au prototype et à l'enregistrée, 42 rendus sans erreur, 92 appels de dessin, 133 k
  triangles, 23 lumières, télégraphe **6,94:1** (deutéranopie 7,15), comme `main` en Passe C2. **[KO → expliqué]** le premier passage : FAIL sur
  une seule erreur, un 404 de `/favicon.ico` que Chrome demande au serveur statique local (une sonde des requêtes l'a nommé ; le service fournit
  son icône) ; avec une icône locale, non publiée : 0 erreur.
- **`tools/ui-text.mjs`** sur la même page : **10 pages sur 10** (le démarrage en 1920 × 1080, 1280 × 720 et 812 × 375 ; la fenêtre d'esquive en
  aide complète aux trois tailles ; la technique et le K.O. en 1920 × 1080 et 812 × 375) : rien sous 16 px (ordinateur) ni 14 px (téléphone), les
  deux polices embarquées chargées, aucun caractère hors de leur sous-ensemble, aucun texte coupé.
- Dans la page : les huit boutons de la barre font **60 px** (de 1 008 à 1 068 en 1920 × 1080) ; polices « CdT Pixel » et « CdT Text » seules.

### Publié — [OK] au même lien, version 2
- Lue avant (`read` : version `1792419271-af6f`, quatre fichiers), publiée par son `url` : la page et les 30 fichiers `assets/*` ; les deux anciens
  scripts devenus orphelins retirés ; le travailleur des peintres garde son nom et son SHA-256. **Version 2** (`1792976900-d25d`), 31 fichiers.
- **Relue après publication** (les 31 fichiers par `read`) : **30 sur 30 identiques à l'octet** au build (SHA-256), et la page que sert le
  service (`index.html`) **identique à l'octet à `check.html`** : ce que les contrôles ci-dessus ont joué est exactement ce que le lien sert.

### Avant / après
- `tools/arena-scene-shots.mjs` (`HOLD=1`, une capture de chauffe, transitions et animations CSS figées) sur l'ancienne page (les fichiers de la
  version 1, relus avant de publier, servis en local) et sur la nouvelle : mêmes moments, mêmes états de la simulation (`charging`, `window` en
  aide complète, `technique`, `ko`), en 1920 × 1080 et 812 × 375. Après : cartes en neuf tranches, Pixelify pour les noms et les nombres,
  Alegreya pour les mots, touches en capuchons, barre de 60 px aux sous-libellés entiers ; la scène inchangée.
  `screenshots/calibration/ap1-arena-page/window-1920-before-after.png`.

### [?] Relevé en passant (hors de la tâche, rien changé)
- En **812 × 375** (téléphone en paysage), aide complète, au moment `window` : **la bande au sol et les anneaux ne paraissent pas** dans le build
  d'aujourd'hui, alors que leurs uniformes sont posés (`uTele` 1, `uRings` 1, `uOpen` 1 ; vu aussi dans le panneau navigateur, hors de l'outil de
  capture). L'ancienne page les montre à la même taille ; le build d'aujourd'hui les montre en 1920 × 1080 et en 1280 × 720 (le contraste de
  `arena-scene-check`). Cause non cherchée ; c'est l'état de `main`, la page publiée le reproduit.
  `screenshots/calibration/known-issues/arena-floor-band-812x375.png` (avant à gauche, après à droite).

### Restes [?]
- **La page dans le visualiseur de claude.ai** n'est pas ouverte d'ici : le panneau navigateur de la séance demande une connexion (comme en Passe
  C2), et la séance ne se connecte pas à la place de l'opérateur. Prouvé : les octets servis, et leur jeu dans le squelette du service ; pas
  prouvé : la page dans son cadre (bac à sable, polices, travailleur, WebGL du visualiseur).
- La bande au sol en 812 × 375 (ci-dessus), à diagnostiquer dans une tâche à part.

### Validation
- Journal et deux images seulement ; le code est celui de `d604a3b`. Le build de production de la page réussit ; `art:validate` (19 manifestes,
  33 sources, 0 erreur) ; typecheck, `npm test` et build par la CI de la branche (clone propre : le worktree n'a pas les dépendances de
  développement, la copie partagée est sur la branche d'une autre séance).

### Journal — [OK] archivage (passes gardées au-delà d'environ 60 Ko)
- Avec cette passe, les passes gardées dépassaient 63 Ko. C2 et AA2, closes (fusionnées), partent d'un seul bloc vers
  `journal/27-passes-C2-AA2.md` (31 886 octets, bloc de 31 612 octets, SHA-256 `c23a8a13ca7d97cd…`) ; restent environ 32 Ko. Preuve **8 / 8**
  (script hors dépôt, contre la copie de `JOURNAL.md` d'avant le déplacement : corps de l'archive égal au bloc ; C2, AA2 contigus, suivis de RC1 ;
  plus dans `JOURNAL.md` ; chacune dans un seul fichier de `journal/`, par sa ligne de titre entière (une autre Passe C2, 19/10, vit dans
  `journal/11`) ; RC1 et la suite inchangées à l'octet ; seules la phrase d'en-tête et une ligne d'index changent ; en-tête comme `journal/26` ;
  LF seuls). Contrôle négatif : un bit changé dans une copie de l'archive → 7 / 8. Le worktree est extrait sans conversion des fins de ligne :
  les fichiers y sont en LF, comme dans l'index (les preuves précédentes, dans la copie partagée, lisaient le CRLF qu'y met `core.autocrlf`).

### Pensée
- Une page publiée qu'on ne peut pas ouvrir dans son visualiseur se prouve par ses octets relus (SHA-256 contre le build vérifié) et par le jeu de
  ces mêmes octets dans le squelette que le service ajoute ; reste nommé ce que seul le visualiseur peut montrer.
- Un dossier partagé par plusieurs séances change de branche sous les pieds : une tâche qui doit construire `main` le fait dans un worktree de
  `main`, jamais dans la copie partagée.
- Une erreur d'un contrôle se nomme avant d'être écartée : le seul 404 était l'icône que Chrome demande au serveur statique, pas une ressource de
  la page.

## Passe UI4 — L'écran de chargement dans le système de design de l'interface (décision C2-14) (2026-10-26)

### Demande
- Séance locale lancée par la séance parente : passer l'écran de chargement (affiché avant la ville, l'arène, le parvis et chaque page du mode
  jouable ; police du système et palette à part, construit dans `src/main.ts`) au système de design de la Passe UI3 : décision C2-14 « Tâche à
  part » (Passe C2F), avec la direction C « Héraldique pixel ». Preuves demandées : captures avant / après, `tools/ui-text.mjs` (16 px ordinateur,
  14 px téléphone, polices embarquées seules), la ville et l'arène à 0 px contre `main` figé une fois l'écran retiré, tests, build.
- Branche `loading-screen-ds` depuis `main` (`d604a3b`), **dans un worktree hors du dossier partagé** (d'autres séances y travaillent et en
  changent la branche : il est passé sur `ren-combat-x3-full`) ; avancée en avance rapide sur `main` (`e8970b1`, Passe AP1 : le journal, une
  archive et deux images, aucun fichier de `src/`, `tests/` ni `tools/`) avant le commit. `.gitignore` et `.claude/` jamais commités. Serveurs
  (`preview_start` / `preview_stop`) : `ls-branch` (:5214, le worktree), `ls-frozen-main` (:5215, `d604a3b` hors dépôt, le code de `e8970b1`),
  `ls-dist-branch` / `ls-dist-main` (:5216 / :5217, `vite preview` des deux builds de production).

### Fait — [OK] l'écran de chargement dans le système (`src/ui/loading.ts`)
- **Bâti sur les jetons seuls** : le nom « CITÉ DU TOURNOI » en Pixelify (taille `pixelHuge` : 40 px sur ordinateur, 30 au téléphone ; or clair
  et ombre portée, comme l'écran titre), la progression dans le cadre de jauge peint par le code (`--ds-f-gauge`, neuf tranches ; remplissage à
  l'ambre de l'action, filet clair en haut), le statut en Alegreya (`--ds-fs-small` : 16 / 14 px, `muted`), le fond à l'encre du ton ; aucune
  couleur, police ni taille hors des jetons. Les textes restent ceux d'aujourd'hui (« GENERATING <phase> »), l'ellipse devient typographique
  (« PAINTING THE NIGHT… »).
- **Le ton suit `DayState` (L2)** : pour la ville et l'arène, celui de l'adresse (`time=`, la nuit sans lui) ; « Explore the district » passe à
  midi ; dans le mode jouable, le ton de la page qu'ouvre la sauvegarde (`pageTone`, `src/ui/play.ts` : l'état du créneau, Lantern Row celui de
  la nuit, comme chaque page l'installe), posé dans la même tâche que l'apparition du contenu : aucune image dans un autre ton. La ligne
  d'ouverture suit : « PAINTING THE NIGHT… » la nuit, « PAINTING THE DAY… » de jour (avant : la nuit partout sauf « Explore »).
- **Le contenu paraît une fois les deux polices chargées** (`ready` : `fontsReady`, ou une seconde au plus ; `reveal`) ; jusque-là l'écran n'est
  que l'encre du ton : jamais une police de repli, jamais un texte qui surgit. Chaque scène démarre ensuite (avant, la ville démarrait dans la
  tâche même qui créait l'écran). Mesuré dans le build de production (ville, Chrome sans tête) : les trois polices demandées à 235 ms, chargées à
  249 ms, la première phase de la scène à 316 ms.
- **Une erreur** dit sa raison sur l'écran, en ambre clair (`loadingError` : les trois sites d'erreur de `main.ts` et `play.ts` en un), et
  `window.__error` comme avant ; un module du mode jouable qui ne charge pas n'est plus une erreur silencieuse.
- `main.ts` ne construit plus d'écran ; `system.ts` dit que l'écran l'installe sur chaque page, la ville libre comprise (son panneau DEV et son
  HUD n'en usent pas).
- **Constat sur `main`** : la ligne « PAINTING THE NIGHT... » n'était jamais peinte pour la ville ni l'arène : leur première phase la remplaçait
  dans la tâche qui créait l'écran (un observateur de mutations posé avant le chargement voit « GENERATING WHITE/FLAT » comme premier texte).

### Avant / après (`screenshots/calibration/ui4-loading/`)
- Harnais hors dépôt : l'écran retenu (son retrait ignoré, son fondu coupé une fois la page prête), deux états du même chargement (l'ouverture,
  jauge vide ; la progression, « GENERATING MATERIALS » à 60 %) ; dix pages : la ville la nuit, le matin, à midi, à la fin de journée ; l'arène la
  nuit et à midi ; le duel, le parvis et Lantern Row du mode jouable ; une erreur (`scene=arena&combat=dynamic&dyn=bogus:1`) ; en 1920 × 1080,
  812 × 375 et 375 × 812 : 57 captures de chaque côté. Cinq paires gardées : la ville la nuit (progression), à midi (l'ouverture, le ton du jour),
  le téléphone tenu droit à la fin de journée, le duel du mode jouable en paysage, l'erreur.

### Les preuves
- **La ville** (`tools/detshots.mjs`, 120 pas, 1920 × 1080) : nuit A, B, C, D, B avec panneau et HUD, midi B et D, le mode jouable au premier
  matin : **8 sur 8 identiques à l'octet** à `main` figé ; témoin (deux chargements de `main`) 8 sur 8.
- **L'arène** (`tools/arena-scene-shots.mjs`, `HOLD=1`, 1920 × 1080 ; deux captures de chauffe qui retirent l'écran, quel que soit son aspect,
  et coupent transitions et animations CSS) : ancien duel 9 moments (`charging`, `strike`, `heavyRen`, `block`, `dodge`, `impact`, `technique`,
  `combo`, `ko`), nouveau duel 9 (`charging`, `strike`, `prep`, `ward`, `combo`, `pushed`, `foeBreak`, `broken`, `koRen`), chacun en scène seule la
  nuit et à midi et avec le HUD la nuit : **56 sur 56 identiques à l'octet** (54 moments et les deux chauffes) ; témoin 56 sur 56. **Contrôle
  négatif** : sans la chauffe, la capture de `charging` diffère de 12 181 px, tous dans la boîte du contenu de l'écran ([752, 484, 1167, 592]).
- **« Explore the district »** (`tools/title-proof.mjs`, `main` figé contre la branche) : toutes ses vérifications OK ; Explore contre
  `?time=midday` de `main` (panneau fermé), Explore après H contre `main` (panneau ouvert), `?time=midday` de la branche contre celle de `main` :
  **identiques à l'octet** ; témoin négatif (panneau fermé contre ouvert) : 25,7 % des pixels. Rôles inversés : **l'écran titre**, sans et avec
  sauvegarde, **identique à l'octet** à celui de `main` (l'écran de chargement est dessous, son contenu retenu).
- **Le mode jouable** (`tools/play-flow.mjs`) : victoire contre Vessa (1842, jour 2) et défaite contre Marek (7719, jour 3), l'état final rejoué
  en Node : **mêmes empreintes** que la Passe UI3 (`0025acce7a403773`, `397959404c18f714`), aucune erreur de page.
- **`tools/ui-text.mjs`** : sur la branche (serveur DEV ; l'écran montré par son propre module, `import('/src/ui/loading.ts')`, une fois la page
  prête) : la nuit à l'ouverture et en progression, le matin, midi, la fin de journée dans l'arène, l'erreur réelle, et l'écran titre par-dessus
  l'écran retenu, en 1920 × 1080, 1280 × 720, 812 × 375 et 375 × 812 : **26 pages sur 26** (rien sous 16 / 14 px, les deux polices chargées,
  aucun caractère hors du sous-ensemble, aucun texte coupé ; le message d'erreur se replie sur trois lignes au téléphone) ; build de
  production, l'erreur réelle : **4 sur 4** ; **contrôle négatif**, le build de `main` : **0 sur 2** (« Segoe UI », 14 px sur ordinateur, aucune
  police chargée).
- **Le bundle** (même configuration) : 30 fichiers contre 31 ; le module `system` (5,8 Ko) entre dans le morceau principal (`index` : 985,0 →
  992,1 Ko) ; les trois polices et 13 autres fichiers identiques à l'octet ; les morceaux du mode jouable ne changent que par leurs imports.
- **Le démarrage** (`tools/startup.mjs`, builds de production, ville, 5 tours entrelacés ; un Chrome étranger tenait 16 à 70 % de la 780M pendant
  les tours 1 à 3) : prête en **2 792 ms [2 525-3 181]** sur `main`, **2 937 [2 472-3 193]** sur la branche ; aucun écart au-delà du bruit
  (la branche plus rapide aux tours 3 à 5). L'attente des polices, mesurée directement : environ 14 ms.
- **Tests** : `tests/loading-screen.test.mjs` (5, sur un faux document : ce que l'écran ajoute, où et quand son contenu paraît) : le ton et la
  ligne d'ouverture de chaque état du jour (les couleurs lues dans la table de `tokens.ts`), le contenu retenu jusqu'à `reveal` ; `ready` après
  les trois polices, jamais plus d'une seconde (horloge simulée) ; l'erreur, sa couleur, gardée à un changement de ton ; `pageTone` contre un
  oracle écrit d'après les règles sur les états nommés (la fin de journée, Lantern Row la nuit, le duel selon le créneau) ; le CSS de l'écran
  (aucune couleur littérale, polices et tailles des jetons, le cadre de jauge) et `main.ts` sans écran à lui. Deux tests mis à jour, leur
  rigueur gardée : `tests/game-core.test.mjs` (le chemin par défaut n'atteint de `src/ui` que l'écran et le système) et
  `tests/town-roles.test.mjs` (Passe D9 : `startTown` et `startArena` restent ceux de `d129433` à leur seule ligne d'erreur près ; avant le
  dispatch, toutes les lignes de `d129433` hors des cinq de l'ancien écran). **20 fautes injectées sur 20 attrapées** (ton ignoré, lignes
  inversées, contenu jamais montré, `ready` sans borne ou sans polices, erreur sans couleur ou écrasée par le ton, couleur hexadécimale,
  autre cadre, 14 px, police système, Lantern Row ou le duel au mauvais ton, l'écran de nuit quelle que soit l'adresse, le panneau fermé
  partout, l'erreur hors de l'écran dans `startTown` ou `startArena`, un écran du mode jouable sur le chemin par défaut, une ligne d'avant le
  dispatch changée, un style propre à `main.ts`), fichiers rendus à l'octet (SHA-256).
- **Validation** : typecheck, `npm test` **200 / 200** (195 + 5), build, `art:validate` (19 manifestes, 33 sources, 0 erreur).

### [?] Relevé
- Dans le panneau navigateur de la séance, caché, après « Explore » sur le build de production : la graisse 700 d'Alegreya restait « unloaded »
  alors que son fichier avait été chargé (entrée de ressource). Non reproduit dans Chrome sans tête (adresse directe, écran titre, « Explore » :
  les trois « loaded »). L'écran de chargement n'utilise pas la graisse 700.

### Restes [?]
- **À voir en jeu par l'opérateur** : l'écran dans ses quatre tons, avec la palette provisoire (S3, « Cela peut changer par la suite »).
- Les autres écrans de la liste UI : P4, P5, P6 ; les bustes (L4) ; chacun dans sa séance.

### Pensée
- Un écran qui s'écrit dans une police embarquée attend ses polices avant que la scène prenne le fil principal : avec `font-display: block`, un
  texte peut rester invisible tout un bloc synchrone. L'attente se borne (une seconde) et se mesure (14 ms ici).
- Ce qu'un écran « montre » se vérifie dans la page avant d'être décrit : la ligne d'ouverture de `main` n'était jamais peinte, remplacée dans
  la même tâche.
- Un test qui fige un fichier contre un ancien commit se met à jour en nommant chaque changement voulu (une ligne remplacée, cinq lignes
  retirées), jamais en abandonnant la comparaison ; ses fautes injectées le prouvent encore.
- Une preuve « une fois l'écran retiré » retire l'écran dans le harnais, quel que soit son aspect des deux côtés, et se double d'un contrôle sans
  ce retrait (12 181 px) : sinon le 0 px pourrait venir d'un écran absent des deux captures.

## Passe AF1 — La bande au sol et les anneaux de l'arène sous le HUD des fenêtres basses : la fenêtre d'esquive passe sur le bouton Esquive, le signe de priorité en haut (2026-10-26)

### Demande
- Dans cette séance, après la Passe AP1, l'opérateur : « Do this task here: “Bande au sol de l'arène absente en 812 × 375” » (la tâche proposée
  à la fin de la Passe AP1). Branche `arena-floor-phone` depuis `main` (`e8970b1`), dans un worktree hors du dossier partagé (comme en AP1 : le
  dossier partagé est sur la branche d'une autre séance). Serveurs : `afp-branch` (:5224, le worktree) et `afp-frozen-main` (:5225, `e8970b1`
  figé hors dépôt), par `preview_start` / `preview_stop`.
- `main` a reçu la Passe UI4 (l'écran de chargement, `2225bf7`) pendant la tâche : avance rapide impossible. Question à l'opérateur, réponse
  mot pour mot : « Rebaser + push forcé (Recommandé) » (écarté : « Commit de fusion »). La branche est rejouée sur `2225bf7` (conflits dans
  `JOURNAL.md` seulement : les deux passes et les deux principes gardés, la ligne de 6e fusionnée) et repoussée avec `--force-with-lease` ; les
  contrôles de l'arène sont rejoués sur le résultat contre `2225bf7` figé (ci-dessous).

### La cause — [OK] : la bande n'était pas absente, la barre du HUD la couvrait
- **[KO → corrigé] le relevé de la Passe AP1** : « la bande au sol et les anneaux ne paraissent pas » était une lecture d'image. La capture
  `hud=0` qui semblait le confirmer ne prouvait rien : sans HUD, `FloorUI` n'est pas dessiné du tout (`updateFloor` lie les anneaux et le
  télégraphe à `hudVisible`). Mesuré : la bande et les anneaux sont dessinés ; **la barre « Fenêtre d'esquive » les couvre**.
- La mesure (dans la page, transitions figées) : la bande et les anneaux échantillonnés sur le sol (441 et 96 points), projetés par la caméra de
  l'arène, contre les boîtes que peint le HUD (fond, cadre, image, texte). La bande occupe toujours la même fraction de la hauteur (0,739 à
  0,784 H : le champ vertical est fixe), la barre est à une distance fixe du bas (94 px, 72 px au téléphone) : elle la couvre sous ~582 px de
  haut. Ancien duel, aide complète, moment `window` : 0 de 1920 × 1080 à 1280 × 600 ; bande couverte à 33 % en 1024 × 540 et 960 × 540, 78 % en
  900 × 500, 89 % en 844 × 390, 100 % en 812 × 375, 740 × 360 et 667 × 375, 78 % en 568 × 320 (anneaux de 35 à 100 %) ; pendant **toute la
  fenêtre de réaction**, l'instant où la bande vire à l'ivoire et pulse.
- Introduit par la Passe UI3 (`f17daf6`) : la barre monte de 80 à 94 px du bas (58 → 72 au téléphone) et s'épaissit (cadre en neuf tranches).
  La Passe P2 la posait plus bas et plus fine : l'ancienne page (Passe AP1) montre la bande en 812 × 375.
- **Second recouvrement, trouvé par la même mesure** : dans le nouveau duel, le signe de priorité (« Marek attaque ») est posé, sur les fenêtres
  de moins de 1 241 px de large et les téléphones, à la place de la barre (Passe C2) : il couvre 28 à 45 % des anneaux pendant chaque séquence
  adverse, **aide discrète (le défaut) comprise**, sous 600 px de haut.

### Les choix de l'opérateur, mot pour mot
« = » : la recommandation est suivie. Questions posées dans la séance (AskUserQuestion), avec un aperçu de chaque option.

| # | Question | Recommandation | Choix de l'opérateur | |
|---|---|---|---|---|
| AF1-1 | Sous ~600 px de haut, où va le compte à rebours de la fenêtre d'esquive ? | « Sur le bouton Esquive (Recommandé) » | « Sur le bouton Esquive (Recommandé) » | = |
| AF1-2 | Nouveau duel, sous ~600 px de haut : où va le signe de priorité ? | « À la place de l'alerte (Recommandé) » | « À la place de l'alerte (Recommandé) » | = |

- Écartés : « Retirer la barre », « Recadrer l'arène » (AF1-1) ; « Ne pas y toucher ici » (AF1-2).
- **AF1-2 appliqué au plus près, avec un écart que je signale** : l'option disait « en haut au centre, à la hauteur de l'alerte (30 %), entre les
  cartes et les têtes ». Les cartes du nouveau duel (PV, résistance, PA, étiquettes) sont plus hautes que celles de l'ancien : à 27 % le signe
  tombait **sur les cartes** (1024 × 540 : sur les jauges, entre les deux cartes ; 812 × 375 : sur le coin de la carte de Ren) — **[KO → refait]**
  ma première version. Et en 900 × 500 il n'y a plus de place entre le bas des cartes (230 px) et le haut des têtes (~239 px) : le signe couvrait
  le haut des deux têtes — **[KO → refait]** ma deuxième version (sous les cartes partout). Retenu : en haut au centre dans les deux cas, **au-dessus
  des cartes, à côté du titre**, tant que la fenêtre garde la mise en page d'ordinateur (481 à 600 px de haut, moins de 1 241 px de large) ; **sous
  les cartes** sur un téléphone (480 px de haut ou moins), où le titre est masqué et les cartes collées en haut. Les fenêtres larges gardent leur
  place d'aujourd'hui (entre les cartes, `top:84px`), qui ne touchait pas le sol. À revoir en jeu par l'opérateur.

### Fait — [OK]
- **`src/arena/ArenaHud.ts`** (ancien duel, et les règles communes) : un trait `.wl` au pied du bouton Esquive, le trait de préparation du
  système (2 texels, ambre, lueur), avec la même condition (`win` = barre allumée) et le même compte à rebours (`scaleX` du temps restant) que la
  barre ; `@media (max-height:600px)` : la barre retirée (`display:none`), le trait affiché. Au-dessus de 600 px : rien ne change (le trait est
  `display:none`, la classe `win` n'y a pas d'effet).
- **`src/arena/DynamicHud.ts`** (nouveau duel) : le même trait ; le signe : `(max-width:1240px) and (max-height:600px)` → en haut au centre
  (`top:12px`, une ligne) ; `(max-height:480px)` → sous la plus basse des deux cartes (+6 px, calculé dans `update` depuis leurs boîtes : elles
  grandissent avec les étiquettes Rempart / Ferveur) ; dans les deux cas il s'efface pendant que l'alerte est affichée (aide complète : classe
  `al` sur la racine, comme `wb` pour la barre).
- **`tools/arena-scene-check.mjs`**, contrôle 4 « les marques du sol hors du HUD » : à chaque taille de `FLOOR_SIZES` (par défaut de 1920 × 1080 à
  568 × 320, onze tailles), aux moments où le HUD montre une barre ou un signe au-dessus du sol (`window` ; sous les nouvelles règles aussi
  `denied`), en aide complète (bande et anneaux) et discrète (anneaux), aucun point échantillonné ne doit tomber dans une boîte que peint le HUD.
- Images : `screenshots/calibration/af1-arena-floor/` (quatre avant / après : 812 × 375 ancien duel à la fenêtre, 812 × 375 et 900 × 500 nouveau
  duel en aide discrète, 1024 × 540 nouveau duel à la fenêtre). `known-issues/arena-floor-band-812x375.png` (Passe AP1) retirée : le problème est
  résolu (elle reste dans l'historique, `e8970b1`).

### Les preuves
- **Le contrôle 4 peut échouer** : sur `main` figé, **FAIL** — ancien duel 8 cas couverts sur 22 (les huit tailles sous 600 px de haut), nouveau
  duel 32 sur 44 (la barre et le signe). Sur la branche : **PASS, 0 sur 22 et 0 sur 44**.
- **Fautes injectées une à une** (fichiers rendus à l'octet, SHA-256), chacune attrapée : la barre gardée sur fenêtre basse → FAIL (bande et
  anneaux sous la barre, 1024 × 540 et 812 × 375) ; la règle finale du signe des fenêtres basses retirée → FAIL, 4 cas sur 12 (les anneaux sous le
  signe, aide discrète, 1024 × 540 et 900 × 500) ; sur la première version, la règle du signe retirée → FAIL aussi (1024 × 540 et 812 × 375).
- **`arena-scene-check`** sur la branche, code final : ancien duel **PASS** (jeu en direct 4,8 s, dernière action `heavy` ; empreinte du
  prototype ; 42 rendus ; télégraphe 6,94:1, deutéranopie 7,15, comme `main` ; 0 erreur ; sol dégagé 22 cas sur 22) ; nouveau duel **PASS**
  (`DYNAMIC_SIM_HASH` ; 63 rendus ; 6,77:1 / 6,98 ; 0 erreur ; sol dégagé 44 sur 44).
- **Le HUD contre `main` figé** (scripts hors dépôt, harnais de `arena-scene-shots` : `Math.random` à graine 1842, boucle tenue, capture de
  chauffe, transitions et animations figées ; 19 moments sous les deux règles et les deux aides, 7 tailles, 133 paires) :
  - témoin (deux chargements de `main`) : 132 sur 133 à 0 px ; la dernière, 27 px à ±1 niveau dans un petit rectangle de la scène
    (147-200 × 157-207, en 1280 × 600 et 1280 × 720 selon le chargement : un bruit de chargement de `main` lui-même, vu aussi dans une première série) ;
  - **1920 × 1080 et 1280 × 720 : 0 px** sur les 38 paires, à ce même bruit près (7 paires en 1280 × 720, 11 à 27 px à ±1, le même rectangle) ;
  - sous 600 px de haut, l'écart vient de **trois choses seulement**, prouvées une à une : (1) **la barre retirée** — visible pendant la fenêtre ;
    invisible (opacité 0) le reste du temps, mais présente dans l'arbre de calques de `main` : la retirer change l'arrondi du compositeur de ±1
    niveau sur l'image entière à certaines tailles (900 × 500 : ~45 000 px ; 568 × 320 : 3 370 px en haut) — **`main` avec la seule barre retirée
    est identique à la branche, 0 px** ; (2) le trait du bouton Esquive ; (3) le signe déplacé. Contre « `main` sans la barre », 95 paires : 51 à
    0 px, toutes les autres ne diffèrent que dans le bouton Esquive et le signe, sauf 5 en 1280 × 600 (11 à 27 px à ±1, le rectangle du bruit). En
    1024 × 540, 2 px à ±1 sous la barre retirée : les mêmes que donne `main` quand on n'y retire que la barre.
- **Le signe** (script hors dépôt, boîtes dans la page, transitions figées ; `denied`, `foeBreak`, `broken`, `ward` ; neuf tailles de 1280 × 600 à
  568 × 320) : jamais sur une carte ni sur le titre ; en haut, au-dessus des cartes de 1024 × 540 à 900 × 500 ; sous les cartes, avec une marge sous
  les têtes, en 844 × 390, 812 × 375, 740 × 360 et 667 × 375 ; en 568 × 320 il touche le haut des têtes (ci-dessous).
- **`tools/ui-text.mjs`** sur la branche, code final : **34 pages sur 34** (les deux règles, aide complète et discrète, de 1920 × 1080 à 740 × 360 ; le
  mode jouable en 812 × 375 et 1024 × 540) : rien sous 16 / 14 px, les polices embarquées seules, aucun texte coupé ; plus aucun texte couvert sur
  les fenêtres basses à mise en page d'ordinateur (2 avec la première version du signe, posée sur les cartes).
- Typecheck ; `npm test` et build par la CI de la branche (le worktree n'a pas toutes les dépendances de développement). Pas de mesure GPU : le
  changement est du DOM, la scène ne change pas (`main` sans la barre = branche hors du bouton et du signe).

### [?] Relevé en passant, hors de la tâche (rien changé)
- **568 × 320** (petit téléphone en paysage) : la barre d'actions est plus large que l'écran, « Garde » et le dernier bouton coupés
  (`ui-text`, ancien et nouveau duel, déjà sur `main`) ; le signe sous les cartes y touche le haut des têtes (22 px entre les cartes et les têtes
  pour un signe de 29 px).
- **L'alerte du nouveau duel** (aide complète, à 27 % / 30 %) chevauche les cartes sur les fenêtres basses (1024 × 540, 812 × 375), déjà sur `main`
  : les cartes du nouveau duel sont plus hautes que celles pour lesquelles l'alerte a été placée.
- À 900 × 500, la carte de Marek passe « 7990 / 8000 » et « le champion » sur deux lignes (déjà sur `main`).

### Restes [?]
- La lecture en jeu par l'opérateur : le trait au pied d'Esquive (à côté du bouton qui pulse) et le signe en haut / sous les cartes.
- Les trois relevés ci-dessus, à décider (tâche à part).

### Pensée
- « Ne paraît pas » se mesure avant d'être cru : une bande « absente » était couverte, et la capture sans HUD qui semblait le confirmer ne dessine
  pas le sol du tout.
- Un élément d'interface placé à une distance fixe du bas rencontre ce que la caméra place à une fraction fixe de la hauteur : la limite se
  calcule (ici ~582 px) et se vérifie à toutes les hauteurs, pas seulement aux tailles mesurées jusque-là (1920 × 1080, 1280 × 720, 812 × 375).
- Un choix d'interface décrit en mots (« à la hauteur de l'alerte, entre les cartes et les têtes ») se vérifie à chaque taille : quand ses deux
  moitiés se contredisent, l'écart se dit à l'opérateur au lieu d'en garder une en silence.

## Passe AP2 — Les deux pages publiées de l'arène republiées avec le build de `main` (`1ee9752`, Passe AF1) (2026-10-26)

### Demande
- Dans cette séance, après la Passe AF1, l'opérateur, mot pour mot : « Oui : republie les deux pages de l'arène
  (https://claude.ai/artifact/EzSKUGk1jrCSxLENY5CC44 et https://claude.ai/artifact/HnfCTWXSggDVVyVUskTBJK) au même lien, avec le build de main
  d'aujourd'hui. » Branche `arena-pages-republish` depuis `main` (`1ee9752`), worktree hors du dossier partagé (journal seulement).

### Fait — [OK]
- `tools/arena-scene-page.mjs` sur le worktree (même voie qu'en Passe AP1 : le vite du dépôt par son chemin, `configFile: false`), deux fois :
  `scene=arena` « Arène des Champions » et `scene=arena&combat=dynamic` « Arène de l'essai C2 » (le titre que porte la page publiée) ; les deux
  builds donnent les mêmes **29 fichiers** (le morceau `system` est désormais dans `index` : l'écran de chargement de la Passe UI4 installe le système
  de design sur chaque page) ; `index.html` n'a pas changé depuis la Passe AP1, l'outil reste valable.
- **Vérifié avant de publier**, chaque page dans le squelette du service, servie en local : `arena-scene-check` **PASS** (ancien duel : empreinte du
  prototype, 42 rendus, télégraphe 6,94:1, sol dégagé 22 cas sur 22 ; nouveau duel : `DYNAMIC_SIM_HASH`, 63 rendus, 6,77:1, 44 sur 44 ; 0 erreur) ;
  `ui-text` **6 pages sur 6** pour chacune (dont 812 × 375 et 1024 × 540).
- **Publiées par leur `url`** : la page des Champions en version 3 (`1792983508-403e`), celle de l'essai C2 en version 2 (`1792983522-8e38`) ; les 14
  anciens scripts devenus orphelins retirés. **Relues** (les 30 fichiers de chacune) : **29 sur 29 identiques à l'octet** au build, et la page que sert
  le service identique à la page contrôlée ; 30 fichiers publiés chacune, aucun reste.

### Restes [?]
- Comme en Passe AP1, la lecture dans le visualiseur de claude.ai n'est pas vérifiée d'ici (le panneau navigateur de la séance demande une connexion).

### Pensée
- Un build se compare d'un jour à l'autre par ses noms hachés : la liste des fichiers à retirer d'une page publiée se calcule (anciens moins
  nouveaux), sinon les anciens morceaux restent publiés à côté des nouveaux.

## Passe RC2 — La feuille de combat de Ren complète : les 34 images de la liste CB-2, les reprises de RC1-1, la lame redessinée, le bord en règle du rendu, une fiche d'arbitrages (2026-10-26)

### Demande
- Séance locale lancée par la séance parente : compléter `hero-x3-combat` (labo) jusqu'aux 34 images de la liste CB-2 (`briefs/combat-system.md`
  § 14) : les 12 images manquantes (`dodge` 2 **en arrière**, C2-7 ; `skillOff` 4 ; `skillDef` 3, Rempart ; `skillSup` 3, Ferveur, C2-10) par la
  voie de RC1 (génération par `tools/art-lab/gen-image.mjs`, une requête à la fois, reconstruction au pas de chaque planche sur la palette de
  `hero-x2-v4`) ; les reprises de RC1-1 (la victoire de profil, une vraie taille pour la coupe, la lame à deux texels) ; le bord (RC1-2) dans la
  feuille complète, sa forme proposée à l'opérateur avant de la faire ; les emprunts du module DEV retirés, `koFrame` gardé ; une critique à
  l'aveugle dans la scène contre la première feuille ; les preuves de RC1 ; une fiche d'arbitrages.
- Branche `ren-combat-x3-full` depuis `main` (`d604a3b`), rejouée sur `main` (`d41bf36`) avant la fusion (plus bas). Une autre séance tient `arena-page-republish` (C2-16) dans son propre worktree.
  `.gitignore` et `.claude/`, modifiés hors de cette tâche, jamais commités. Serveurs : `dev-strict` (:5186) et `main` figé (`d604a3b`, copie hors
  dépôt, :5203, entrée locale `rc2-frozen-main`), par `preview_start` / `preview_stop`.

### La question à l'opérateur, mot pour mot
- « Le bord de Ren (RC1-2 « Liseré peint la nuit, contour noir de jour ») : sous quelle forme le met-on dans la feuille complète de 34 images ? »
  Réponse : **« Règle du rendu (Recommandé) »** : une seule feuille de 34 images ; le liseré froid peint dans les texels au chargement des
  feuilles cuites de l'arène quand la page est la nuit (la règle `rimLight` des générés, déjà celle du module DEV) ; de jour le contour noir 25 % ;
  aucune case de plus ; ses couleurs calculées, hors de la palette ; la même règle pour Marek et Vessa. Écartée : « Variante de nuit des images »
  (34 images de plus, Marek ne tient plus dans la texture de 2 048).

### La génération — [OK] sept planches archivées sur douze images, une requête à la fois
- Tâche `ren-combat-x3-full`, gpt-image-2, n = 2, haute qualité, 1536 × 1024 ; références : la planche v4-b, la planche v3 et les planches a2 et
  b2 de RC1 (pour H : v4-b, a2, b2 et un recadrage de l'armé et de la suite de a2). Prompts dans le dossier ignoré
  `art-lab/characters/scratch/ren-combat-full/prompts/` (`ren-combat-c.txt` à `-h.txt`).
  - C (fente, coupe, esquive, victoire) : la fente et l'esquive arrivent ; la victoire reste de face dans les deux variantes, la poussée en l'air.
  - D (Rempart, Ferveur) : **[KO]** le « mur » de Rempart, demandé « horizontal en travers de la poitrine », est vu de bout de profil : le
    générateur dessine une pointe tendue ; le cri de Ferveur est de trois-quarts.
  - E (reprise ciblée, « profil strict » répété) : la victoire de profil, une parade haute (la lame horizontale au-dessus de la tête, demandée
    dans le plan de l'image), le cri de profil, une poussée pied au sol.
  - F, G, H : la coupe (plus bas), et dans F et G deux poussées d'esquive (trop larges pour la case, ou un coup de pied).
- Coût : six requêtes, 0,4365 + 0,4353 + 0,4369 + 0,4380 + 0,4385 + 0,4194 = **2,60 $** (plafond de 5 $ de la tâche).
- **Archivées** comme sources non canoniques (`--archive`, octets et records) : `ren-combat-x3-2026-10-26-c1`, `-c2`, `-d1`, `-d2`, `-e1`, `-e2`,
  `-f2` ; G et H restent dans le dossier ignoré (aucune figure retenue).

### Le choix des figures — critiques à l'aveugle (agents neufs, lettres tirées au sort, clé hors de leur champ)
- n° 1, onze emplacements : la fente de `c2` (préparation, élan ; 7) avec la reprise de `c1` (le critique propose ce mélange) ; la poussée de
  l'esquive `c2` (5,5 : un saut groupé, faute de mieux) et sa réception `c1` (6,5) ; Rempart : préparation `d2` (7), parade haute `e2` (6),
  retour `d1` (le retour de Ferveur de D-1, que le critique juge mieux placé après la parade) ; Ferveur : préparation `d2` (7,5), cri `e2` (7,5),
  retour `d2` (7) ; la victoire `e1` (la lame levée vers l'avant, un cri : 8). Auto-critique écrite avant : 6 choix sur 11 concordants.
- **[KO → contourné]** la fente profonde de C ne tient pas dans la case à la hauteur du héros (202 à 236 texels pour 190) : la frappe de
  `skillOff` reprend la fente de RC1 (a2), que la reprise de la coupe sort de `strike`.
- La coupe, quatre essais : n° 2, la coupe de E-1 3 (« une estocade ») contre la taille A de F-2 6 (« la seule qui se lise comme une taille ») ;
  n° 4, F-2 3 (« la lame au-dessus de la tête de l'adversaire ») contre G-1 3 (« une estocade ») ; n° 5, F-2 5 (« la seule vraie taille, trop tôt
  dans le geste ») devant quatre tailles à deux mains de H (2 à 4 : estocades ou doublons de la suite). Retenue : la taille de F-2 ; la case
  interdit d'abaisser sa lame au rig (sous 36°, la pointe sortirait de la case) ; réserve sur la fiche (RC2-2). Mes auto-critiques ont choisi G-1
  puis H-2 : classées dernières ou presque.

### La feuille — [OK] 34 images (manifeste `lab`, non approuvé)
- `art-lab/characters/rigs/hero-x3-combat.rig.mjs` : dix planches, `clips` dans l'ordre du § 14 (idle 2, ready 2, strike 3, heavy 4, skillOff 4,
  skillDef 3, skillSup 3, block 2, dodge 2, hit 2, recover 2, ko 3, victory 2).
- Échelle : le pas de chaque planche par sa figure debout (D-1 2,4453, D-2 2,4063, E-1 2,2813, E-2 2,2578, F-2 2,1328). **[KO → réglé]** pour C-1 et
  C-2, la hauteur debout (214, la victoire de C-1) donnait des têtes 15 % plus grandes que celles de RC1, vues côte à côte sur les reconstructions :
  leur pas partage l'écart (1,797 : têtes 7 % plus grandes, corps 7 % plus courts). Le visage mesuré par la peau n'est pas un étalon (12 à 19
  texels sur les seules images de RC1).
- Placement : la case pousse le corps pour que la lame tienne (posture 8, coupe 21, élan de la fente 52, fente 34, réception de l'esquive 15,
  genou à terre 24 texels).
- **La lame redessinée** (reprise « la lame à deux texels ») : la reconstruction la cassait (son gris moyen, proche du fond, partait avec le fond).
  `blade2` la redessine sur chaque figure de la garde à la pointe, épinglées par figure (`BLADES`, proposées par un RANSAC sur les texels neutres,
  vérifiées sur calques) : les éclats neutres à moins de 5 texels du segment retirés (sauf contre le corps, hors de la garde), puis les lignes de
  la lame, posées seulement sur le vide ou le neutre (une main devant la lame reste devant). **[KO → corrigé]** deux texels « clair + gris moyen »
  se perdaient sur le pavé de midi ; « clair + foncé » ne montrait qu'un texel par lumière dans la scène (la nuit le foncé disparaît sur le pavé,
  le jour le clair) : la critique n° 3 lit « un fil d'un pixel ». **Maintenant deux texels clairs (248,233,216 et 230,201,183) et un bord sombre
  (50,46,50)**, chaque ligne plus courte d'un texel vers la pointe. **[KO → corrigé]** là où la pointe générée était le point le plus bas de la
  figure (la puissante, l'épée plantée, l'épée au sol), la lame redessinée ne touchait plus la rangée 270 et le contrat d'image refusait la
  feuille : ces pointes sont épinglées sur la rangée 270.
- Export : 34 images, feuille 1152 × 1728, **64 couleurs, toutes de la palette de `hero-x2-v4`** ; paquet de provenance (dix sources, chaîne, table
  des fichiers), manifeste `lab` (ses notes disent la règle du bord) ; `build-combat.mjs --check` : **reconstruite identique**.

### Dans le duel — [OK] sans emprunt, derrière le paramètre DEV
- `src/lab/fighterDensity.ts` : `COMBAT.borrow` retiré ; `sheetFrame` (pure) choisit l'image de la feuille d'après l'image que le duel a choisie et
  l'animation de la simulation : `skill` et `slash` (renommés par le § 14) et les compétences offensives jouent `skillOff` (0 la préparation tenue,
  sans préparation la première moitié de l'élan ; 1 l'élan ; 2 la frappe jusqu'à l'impact + 0,12 s ; 3 la suite) ; Rempart et Ferveur leurs
  familles (0 jusqu'à l'impact, 1 l'effet pendant toute la suite du geste, `dur`, 2 le retour pendant la récupération) ; tout autre clip image
  pour image ; la victoire une fois le duel fini ; `koFrame` gardé. À l'installation, toute image que `sheetFrame` peut demander doit exister dans
  la feuille. La portée des techniques se mesure sur la frappe de `skillOff`. `ArenaApp` passe l'animation et la fin du duel à `present` (ligne
  derrière `import.meta.env.DEV &&`).
- **[KO → corrigé]** l'effet de Rempart et de Ferveur ne durait d'abord que 0,12 s : les moments scriptés `ward` et `boost` tombaient sur l'image de
  retour, et la critique n° 3 a comparé ces retours aux images empruntées de la première feuille.
- Vérifié dans la page : ancien duel (repos, attaque, puissante, technique sur `skillOff.2`, garde, esquive `dodge.1`, coup reçu) ; nouveau duel
  (préparation de la puissante, préparation de compétence `skillOff.0`, technique, Rempart, Ferveur, repoussé, étourdi, K.O.).

### Critique à l'aveugle dans la scène, contre la première feuille
- Huit moments (repos, frappe, technique, esquive, victoire, préparation de compétence, Rempart, Ferveur), la nuit et à midi : `main` figé (la
  première feuille et ses emprunts) contre la branche, recadrés sur les deux combattants, lettres tirées au sort par moment.
- n° 3 : **la première feuille 6, la complète 5** (la première gagne 6 moments sur 8 dans chaque lumière : la lame en fil, Rempart et Ferveur sur
  leur retour). Auto-critique écrite avant : la complète 7, la première 5,5.
- n° 6, après les deux corrections (agent neuf) : **la complète 6, la première 4,5**, meilleure ou égale sur 13 captures sur 16 ; le critique a
  regroupé les captures par version sans erreur. Restes relevés : la lame en bande uniforme, sans effilement, en marches à midi ; l'impact de la
  coupe (la lame au-dessus de la tête de Marek) ; la réception de l'esquive proche de la posture, la cape coupée par le bord de l'écran quand Ren
  recule au bord ; le torse de trois-quarts de la parade de Rempart ; la nuit, le pantalon et les bottes fondus dans le pavé. Auto-critique : 6,5
  contre 5,5.

### Les mesures
- Texture : 34 cases, 1920 × 1152 (avec Marek complet : 68 cases sur 70) ; texel 2,34 px en 1080p (les cases de RC1).
- GPU (`tools/perf.mjs`, serveur de la branche, 1920 × 1080, 5 tours entrelacés, `fps=off`, témoin de contention au seuil de 15 %, onglets du
  panneau fermés : **5 tours propres sur 5**, Radeon 780M ; mesuré avec la lame « clair + foncé », mêmes cases et même texture) : nuit B **10,25** ms
  [10,00-12,06] ; arène d'aujourd'hui **9,73** ; feuille complète **9,41** ; à midi 8,88 ; nouveau duel avec la feuille 9,49. Mêmes 92 appels de
  dessin, 133 k triangles. **E24 tenu**.

### Les preuves
- L'arène par défaut contre `main` figé (`tools/arena-scene-shots.mjs`, `HOLD=1`, 1920 × 1080, graine 1842, deux captures de chauffe : voile de
  chargement retiré, transitions et animations CSS coupées) : 9 moments par règle, ancien et nouveau duel, scène seule la nuit et à midi, HUD la
  nuit : **54 sur 54 à 0 px**, témoin (deux chargements de `main`) **54 sur 54** ; contrôles négatifs (la même capture avec la feuille ; avec et sans
  HUD) : 16 % et 19 % des pixels diffèrent.
- Bundle de production (même configuration que `main` figé) : **31 fichiers sur 31 identiques à l'octet**, refait après le dernier changement du
  module DEV.
- `tests/combat-sheet.test.mjs` (9) : la feuille `lab` hors de la distribution et son paquet ; les dix sources archivées non canoniques, celles que
  lit le rig ; les 34 images de la liste CB-2 (oracle écrit d'après le § 14), la case ×3, le contrat d'image, les seules couleurs de
  `hero-x2-v4` ; aucun emprunt, `skill` et `slash` sur `skillOff` ; `sheetFrame` contre un oracle écrit d'après le tableau, bords compris ;
  chaque lame de base en deux clairs et un bord sombre le long du segment épinglé ; le liseré peint, le bord selon l'état du jour, la garde DEV.
  **18 fautes injectées sur 18 attrapées** (fichiers rendus à l'octet, SHA-256). **[KO → corrigé]** le décalage de l'horloge du K.O. (0,25 → 0,3)
  passait d'abord entre les points de l'oracle : bords 0,24 / 0,25 / 0,26 ajoutés.
- Validation : typecheck, `npm test` **197 / 197**, `art:validate` (19 manifestes, 40 sources, 0 erreur), `build-combat.mjs --check` identique.

### La fiche — [OK] 5 choix sur 5 enregistrés et relus
- Page privée https://claude.ai/artifact/Qp6XpMixMBX25YkJNJZVCX, collection `decisions`, relue vide après publication ; les protections des fiches
  précédentes (pont attendu 10 s, chaque écriture relue). Relue après « La fiche de la feuille complète de Ren (RC2) est remplie. » : **5 documents
  sur 5**, cliqués le 26/10 entre 03 h 04 min 04 s et 03 h 04 min 06 s UTC, aucune note.

### Les choix de l'opérateur, mot pour mot
« = » : la recommandation de la fiche est suivie.

| # | Décision | Recommandation | Choix de l'opérateur | Note | |
|---|---|---|---|---|---|
| RC2-1 | La feuille de combat de Ren, complète (34 images) | « Complète : la garder en labo comme base » | « Complète : la garder en labo comme base » | — | = |
| RC2-2 | La coupe (l'image d'impact de l'attaque légère) | « La garder ; reprise dédiée plus tard » | « La garder ; reprise dédiée plus tard » | — | = |
| RC2-3 | La lame : deux texels d'acier et un bord sombre | « Deux texels d'acier et un bord sombre (comme fait) » | « Deux texels d'acier et un bord sombre (comme fait) » | — | = |
| RC2-4 | Le bord de la feuille : une règle du rendu | « Confirmé » | « Confirmé » | — | = |
| RC2-5 | L'entrée en production de la feuille | « Pas encore : avec la feuille de Marek » | « Pas encore : avec la feuille de Marek » | — | = |

- **Ce qui en suit** (rien d'autre n'est appliqué : la feuille est déjà celle que la fiche décrit) :
  - RC2-1 : la feuille reste en labo, base de la feuille de production ; ses réserves se reprennent par passes ciblées.
  - RC2-2 : la taille de F-2 reste l'image d'impact de `strike` ; une reprise dédiée plus tard, avec la feuille de Marek, d'après la spécification
    du critique (les deux mains à hauteur d'épaule, la lame de 0 à 15° au-dessus de l'horizontale, les poignets cassés, le visage de profil, la
    cape qui suit ; une traînée dans la couche d'effets).
  - RC2-3 : deux texels d'acier clairs et un bord sombre (trois texels de large) : la règle de lame des feuilles de combat suivantes.
  - RC2-4 : le bord est une règle du rendu (le liseré peint au chargement la nuit, le contour noir de jour) ; à l'entrée en production, elle passe
    dans le chargeur des feuilles cuites de l'arène, pour Ren, Marek et Vessa.
  - RC2-5 : pas de production : la feuille entre avec celle de Marek (la suivante de la feuille de route, ×3, même voie), dans une tâche
    d'intégration avec l'approbation des deux manifestes.

### L'intégration dans `main` — [OK] rejouée sur `main`
- Pendant la tâche, `main` a avancé de quatre passes (AP1, UI4, AF1, AP2 ; AP1 avait archivé C2 et AA2 dans `journal/27`). Question à
  l'opérateur : « main a avancé de quatre passes pendant la tâche (AP1, UI4, AF1, AP2). Comment j'intègre la feuille de Ren dans main ? »
  Réponse : **« Rebaser la branche (Recommandé) »** (le commit rejoué sur `main`, la branche de tâche seule poussée en forçant ; `main` reste
  linéaire). Écarté : « Commit de fusion ».
- Une modification de `.gitignore`, hors de cette tâche, empêchait le rebase en place sans la ranger : le commit a été picoré sur `main` (`HEAD`
  détachée), `JOURNAL.md` et `journal/27` repris de `main` (son archivage C2-AA2 gardé, celui de la branche retiré), cette passe réappliquée ; la
  branche déplacée sur le résultat et poussée avec `--force-with-lease`.
- Refait contre `main` d'après (`d41bf36`, copie hors dépôt, :5204 ; sa chauffe retire aussi l'écran de chargement de la Passe UI4) : l'arène
  par défaut **54 sur 54 à 0 px** (témoin 54 / 54, contrôle négatif avec et sans HUD : 19 % des pixels) ; le bundle de production **30 fichiers sur
  30 identiques à l'octet** ; typecheck, `npm test` **202 / 202**, `art:validate` (19 manifestes, 40 sources, 0 erreur), `build-combat.mjs --check`
  identique ; le déplacement du journal 8 / 8. Le temps GPU n'est pas remesuré : la feuille et sa texture sont les mêmes, et UI4, AF1 ne changent
  que l'interface (DOM).

### Journal — [OK] archivage (passes gardées au-delà d'environ 60 Ko)
- La Passe AP1 a archivé C2 et AA2 pendant la tâche (l'archivage des mêmes passes, fait sur la branche, est retiré au rebase). Avec cette passe,
  les passes gardées dépassaient 60 Ko (58 Ko avant elle) : RC1 et C2F, closes (fusionnées), partent d'un seul bloc vers
  `journal/28-passes-RC1-C2F.md` (24 055 octets) ; restent 51,9 Ko. Preuve **8 / 8** (script hors dépôt, contre la copie de `JOURNAL.md` d'avant le
  déplacement : corps de l'archive égal au bloc ; RC1, C2F contigus, suivis de AP1 ; plus dans `JOURNAL.md` ; chacune dans un seul fichier de
  `journal/`, par sa ligne de titre entière ; AP1, UI4, AF1 et AP2 inchangées à l'octet ; seules la phrase d'en-tête et une ligne d'index
  changent ; en-tête comme `journal/27` ; CRLF seuls). Contrôle négatif : un bit changé dans une copie de l'archive → 7 / 8.

### Pensée
- Un trait fin se dimensionne par ce qui en reste visible sur chaque fond : une lame « un clair, un foncé » n'a qu'un texel visible par lumière ;
  deux clairs bordés d'un foncé tiennent la nuit et le jour.
- Un moment scripté se vérifie sur l'image qu'il montre avant une critique comparative : un découpage trop court a fait juger un retour à la
  place d'un effet.
- Une pose dont la géométrie se voit de bout en profil (« en travers de la poitrine ») se décrit au générateur dans le plan de l'image.
- Les planches d'une même série n'ont pas les mêmes proportions : la hauteur debout et la tête donnent des pas qui diffèrent jusqu'à 15 % ; on les
  compare sur les reconstructions côte à côte, et un écart qu'on ne peut pas éviter se partage et se nomme.
- Une image d'impact (la coupe) est un geste que la génération rend mal : après deux échecs sur la même pose, le poser à l'opérateur plutôt que
  dépenser davantage.
- Mes auto-critiques écrites avant le verdict se sont trompées trois fois sur six dans cette passe : elles mesurent mon biais, elles ne choisissent
  pas.

