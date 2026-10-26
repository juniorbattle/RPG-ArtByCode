# Journal de bord — archive : passes C2 et AA2 (2026-10-25)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-10-26 (Passe AP1) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe C2 — L'arène montre le duel du « tour par tour dynamique » (lot C2 de `briefs/combat-system.md`), derrière son paramètre ; l'interface UI3 vérifiée sur tout le parcours de l'arène ; l'essai de l'opérateur préparé (2026-10-25)

### Demande
- Séance locale lancée par la séance parente : le lot C2 de la spécification (§ 15 : « les jauges et l'alerte légère au HUD ; les clips
  d'aujourd'hui branchés sur les nouveaux moments ; le paramètre de comparaison avec l'ancien combat »), derrière le paramètre de la décision
  CB-10 (« Derrière un paramètre, défaut après mon essai ») ; le HUD du nouveau duel bâti avec le système UI3 ; la demande de l'opérateur, mot
  pour mot : « Profitions aussi pour nous assurer que le nouveau UI/HUD est bien integre » (le parvis, le duel, la pause, le K.O., la victoire
  et la défaite, le retour en ville ; ordinateur et téléphone ; jour et nuit) ; l'essai de l'opérateur préparé sans l'accomplir (adresse, guide,
  fiche). Le défaut ne change pas.
- Branche `combat-c2` depuis `main` (`a954902`), seule branche de travail (`git fetch --prune`, `git branch -a`). `.gitignore` et `.claude/`,
  modifiés hors de cette tâche, jamais commités. Serveurs : `dev-strict` (:5186) et `main` figé (`a954902`, copie hors dépôt, :5199, entrée
  locale `c2-frozen-main`), et le build de l'essai (:5200, `c2-trial`), par `preview_start` / `preview_stop`.
- Nom : « Passe C2 » est le lot C2 du combat ; la Passe C2 du 19/10 (la foule, « Cinq par défaut ») est dans `journal/11-passes-H7-D2.md`.

### Fait — [OK] le duel dynamique dans l'arène, derrière son paramètre
- **Le paramètre** (CB-10) : `?scene=arena&combat=dynamic` ; dans le mode jouable, `&combat=dynamic` sur une partie neuve (ou un état nommé)
  pose `flags.combat = 'dynamic'` (`withRules`, `src/ui/play.ts`), gardé dans la sauvegarde : ses duels se jouent dans `DynamicSim` avec son HUD,
  ses matchs hors écran dans la course de ces règles (Passe C1). Sans lui, l'arène et le tournoi d'aujourd'hui. `arenaRules`
  (`src/arena/dynamicView.ts`) : un duel du mode jouable suit le drapeau de sa partie, jamais l'adresse.
- **`src/arena/dynamicView.ts`** (nouveau, pur, testé en Node) : le choix des règles ; les touches (1 légère, 2 puissante, 3-6 les quatre
  emplacements dans leur ordre, A esquive, B garde ; la manette de même) ; **les réglages de l'essai** dans l'adresse (`&dyn=clé:valeur,...` : PA
  au plus, au départ, regain ; taille et vidange de la jauge ; durée et dégâts du break ; garde ; niveau de l'adversaire ; PV), chaque valeur
  bornée, une clé inconnue ou une valeur hors plage refusée avec un message ; les clips d'aujourd'hui sur les nouveaux moments (offensive →
  `skill`, défensive → la garde `block`, soutien → la lame levée `victory` ; la préparation tient la première image, § 14 ; sans préparation,
  `clipFrame` d'aujourd'hui, image pour image) ; **le modèle du HUD** (`dynHudModel`) lu des requêtes des règles.
- **`src/arena/DynPresets.ts`** : 21 moments scriptés du nouveau duel (calme, légère, préparation de la puissante et d'Estocade, compétence,
  Rempart, Ferveur, séquence adverse, attaque refusée en défense, fenêtre d'esquive, garde, puissante gardée, esquive, impact, repoussé, break
  de l'adversaire, break du joueur, K.O. de chaque côté), pour les captures, la mesure du texte et le guide.
- **`src/arena/ArenaApp.ts`** : la simulation du duel est `CombatSim` (aujourd'hui) ou `DynamicSim` selon `arenaRules` ; la présentation lit
  l'interface commune (`DuelSim`). Sous les nouvelles règles seulement : les touches des emplacements, les clips et images de `dynamicView`,
  l'élan d'une compétence qui attend la fin de sa préparation, et trois moments : le break (éclair, secousse, braises, acclamation), le repoussé
  (recul), l'effet d'une compétence (lueur). Le chemin d'aujourd'hui garde son code (prouvé ci-dessous).
- **Le mode jouable** (`playArena.ts`) : une partie « dynamique » joue son duel dans `DynamicSim` (`dynSheetData`), avec le HUD anglais du
  nouveau duel et **l'aide discrète pour tous** (CB-7) : le repérage de l'adversaire donne un rapport à l'écran de préparation
  (`dynSheetView`, `src/combat/match.ts` : son style, ses pauses par niveau, son coup puissant) au lieu d'allumer le sol ; la ligne des touches
  dit la priorité de l'adversaire. Rempart et Ferveur ont leurs noms anglais (Rampart, Fervour). `dyn=` passe de la ville à l'arène (`CARRY`).

### Le HUD du nouveau duel — [OK] (`src/arena/DynamicHud.ts`)
- Bâti sur les règles du HUD de l'arène (`ArenaHud.ts`, système de design de la Passe UI3, exportées pour lui) et sur ses jetons : le ton du
  jour de l'arène, les cadres en neuf tranches, Pixelify pour les noms et nombres, Alegreya pour les mots, rien sous 16 px (ordinateur) ni 14 px
  (téléphone). Ce qu'il lit (CB-6 « Comme recommandé ») vient de `dynHudModel` :
  - sous les PV de chaque carte, la jauge de résistance (« Résistance » pour Ren, « Break » pour l'adversaire, or rayé) ; brisée, elle reste
    pleine en ambre qui palpite, son libellé devient « Brisé · 6 s » et le temps écoulé de l'étourdissement la grise ;
  - les PA en losanges (cinq, un allumé au départ) ; les quatre emplacements sur la barre (touches 3 à 6), chacun avec son coût en losanges et
    sa famille (« offensive », « défense », « soutien » ; la famille masquée jusqu'à 1 500 px de large pour que la barre tienne) ; aucune recharge ;
  - la priorité de l'adversaire (CB-4) : pendant toute sa séquence, la légère, la puissante et les compétences s'assombrissent, la garde et
    l'esquive restent ; un signe « Marek attaque · Garde ou esquive » (ou « Marek brisé — frappez ! », « Résistance brisée ») en haut au
    centre, au-dessus de la barre sur un téléphone ou une fenêtre de moins de 1 241 px ; une attaque tentée fait trembler son bouton et le signe ;
  - la préparation : le bouton de l'action s'allume et un trait ambré se remplit à son pied ; « Préparation » sous la carte de Ren ;
  - Rempart et Ferveur : une étiquette avec le temps restant sous la carte, le bouton bordé de bleu ; le repoussé : « Repoussé · 4 PA rendus » ;
    le break : « Brisé ! » au-dessus du combattant ;
  - l'aide (CB-7) : le signe de la priorité dans l'aide discrète (le défaut) et complète, pas avec `assist=off` ; l'aide complète ajoute
    l'alerte, la barre de la fenêtre d'esquive et le télégraphe d'aujourd'hui. L'alerte légère « surtout pour les compétences » attend les
    compétences des adversaires (C3).
- **Textes** : français pour `?scene=arena`, anglais pour le mode jouable ; chaque caractère dans le sous-ensemble des polices (test).

### L'interface UI3 sur tout le parcours de l'arène — la demande de l'opérateur
- **Mesuré dans la page** (`tools/ui-text.mjs`, 31 écrans × 1920 × 1080, 1280 × 720, 812 × 375, 375 × 812 : l'arène la nuit et à midi dans la
  fenêtre, en séquence, au K.O., en pause, sous `hud=0` au K.O. et en pause ; la fiche de match, le duel, le K.O., la victoire et la défaite du
  mode jouable ; le parvis le matin et à la fin de journée ; la ville au retour ; sous les deux règles, et pour le nouveau duel le break de
  chaque côté, Rempart, le repoussé) : premier passage **120 pages sur 124** ; après les corrections ci-dessous, les 84 pages qu'elles touchent
  remesurées : **84 sur 84**. Plus petit texte : 16 px sur ordinateur, 14 px au téléphone ; polices embarquées seules ; aucun caractère hors
  sous-ensemble ; aucun texte coupé.
- **Corrigé dans le système** (rien d'une décision de l'opérateur) :
  - **les écrans de K.O. et de pause sous `hud=0`** (ou H) gardaient l'ancien aspect (Segoe UI, Passe UI3) : ils prennent celui du système, HUD
    affiché ou masqué ;
  - **la barre d'actions revient à 60 px** (P3) avec ses textes du système (S4) : la touche à côté des deux lignes au lieu d'au-dessus du
    sous-libellé (76,8 px depuis la Passe UI3). Mesurée de 1 241 à 1 920 px de large, sous les deux règles : 60 px, sous-libellés entiers (3,3
    à 4,4 px sous leur bord), rien hors de l'écran. **[KO → corrigé]** une première version faisait bien 60 px, mais par sa hauteur fixe : la
    hauteur de ligne posée avant `font:inherit` était effacée par lui, et le sous-libellé passait le bord de 0,1 px à 1 920 px ;
  - **[KO → corrigé]** la barre du nouveau duel (huit boutons, coût et famille) sortait de l'écran de 23 px à 1 280 px et de 42 px à 1 241 : la
    famille se masque jusqu'à 1 500 px (le coût reste) ;
  - **[KO → corrigé]** téléphone tenu droit avec le HUD masqué : la couche « Tournez l'appareil », à opacité 0, restait au-dessus du K.O. et de la
    pause (la mesure les comptait couverts, 0 texte) et prenait les touchers : elle sort du rendu quand le HUD est masqué ;
  - **[KO → corrigé]** le signe de la priorité passait sous la barre de la fenêtre d'esquive (téléphone) puis sur la carte de Ren (667 px de
    large) : au-dessus de la barre sur les fenêtres de moins de 1 241 px et les téléphones, effacé quand la barre de la fenêtre paraît ; la barre
    éteinte est cachée (`visibility`) et ne recouvre plus rien.
- **Écarts relevés, sur la fiche** (C2-13 à C2-16) : sous 1 241 px de large, les sous-libellés de la barre restent masqués et la barre fait 61,6
  px (57,4 au téléphone) ; l'écran de chargement (police du système, palette à part) ; tenu droit, « Tournez l'appareil » couvre le duel, la fiche
  de match passe au-dessus et en cache le bas ; la page publiée de la Passe P2 montre l'ancien HUD. Sans décision propre, gardés de l'audit : le
  titre de l'arène sur le ciel de jour (non rejugé ici).

### Les preuves
- **L'arène d'aujourd'hui contre `main` figé** (`tools/arena-scene-shots.mjs`, `HOLD=1`, graine 1842, un moment de chauffe : écran de chargement
  retiré, transitions coupées, animations figées ; dix moments : `charging`, `window` en aide complète, `combo`, `guardbreak`, `impact`,
  `technique`, `strike`, `heavyRen`, `ko`, la pause ; 1920 × 1080 et 812 × 375 ; `clean=1`, `hud=0`, le HUD affiché ; la nuit et à midi) :
  - témoin (deux chargements de `main`) : **0 px les 110** ;
  - **`clean=1` (la scène seule), la nuit et à midi : 0 px les 44** ; **`hud=0` (la nuit) : 0 px les 18 autres que le K.O. et la pause**, qui changent
    d'aspect (voulu, ci-dessus) ;
  - **le HUD affiché** : chaque moment ne diffère que dans le rectangle de la barre (1 920 : [249, 991, 1670, 1068] ; 812 : [99, 309, 713, 361])
    ; au moment `window`, 4 751 px (1 920) et 1 696 px (812) hors de lui, tous à 23 px au plus du bouton « Esquive » allumé de `main` (son halo,
    comme en Passe UI2) ; l'écran de K.O. affiché avec le HUD : identique hors de la barre.
- **La ville** (`tools/detshots.mjs`, 120 pas, 1920 × 1080) : nuit A, B, C, D, B avec panneau et HUD, midi B et D, le mode jouable au premier
  matin : témoin **0 px**, la branche **0 px les huit**.
- **Le bundle** (même configuration pour `main` figé et la branche) : 17 fichiers sur 30 identiques à l'octet ; le morceau de la ville (`index`)
  égal à celui de `main` une fois les noms hachés remplacés, sauf un nom de morceau préchargé (`CombatSim` → `dynamic` : Rollup range
  `CombatSim` dans le morceau qu'il partage désormais avec les nouvelles règles) ; les autres morceaux du mode jouable ne changent que par les
  noms hachés et les alias d'import.
- **`tools/arena-scene-check.mjs`** : l'arène d'aujourd'hui sur `main` figé et sur la branche, la nuit et à midi : **PASS**, empreinte égale au
  prototype, 42 rendus, télégraphe **6,94:1** la nuit (deutéranopie 7,15) et **4,31:1** à midi (4,44), égaux à `main` ; le nouveau duel (l'outil
  rejoue alors le script de `runDynamicFingerprint`) : **PASS**, empreinte égale à `DYNAMIC_SIM_HASH`, 63 rendus (21 moments × 3 aides),
  télégraphe 6,77:1 / 4,26:1.
- **`tools/play-flow.mjs`** (nouveau : `COMBAT=dynamic`) : victoire contre Vessa (1842, jour 2) et défaite contre Marek (7719, jour 3), sous les
  deux règles, l'état final rejoué en Node : **mêmes empreintes** ; l'ancien duel redonne celles de la Passe UI3 (`0025acce7a403773`,
  `397959404c18f714`) ; le nouveau, `6c88371709600791` et `7a997ae3e081be92`.
- **Tests** : `tests/arena-dynamic.test.mjs` (9) : le choix des règles ; les touches et la manette ; chaque réglage de l'essai contre la donnée
  attendue, les refus, la donnée de départ intacte ; les images (préparation tenue, § 14) contre des oracles écrits d'après le texte, et
  `clipFrame` d'aujourd'hui image pour image sans préparation ; chaque clip demandé par un duel présent chez Ren, Marek et Vessa ; **le modèle
  du HUD à chaque pas** d'un duel de 300 s et des 21 moments (plus de 30 000 pas : phase, PV, jauge, break, PA, coûts, attaques verrouillées
  pendant toute séquence, garde et esquive jamais verrouillées, préparation, effets) ; chaque moment atteint son état ; les textes dans le
  sous-ensemble ; le drapeau du mode jouable et l'aide discrète du repérage ; l'arène d'aujourd'hui ne charge pas les nouvelles règles. Le test
  de la Passe C1 « rien sous `src/arena` n'importe les nouvelles règles » est restreint aux modules de l'arène d'aujourd'hui (l'`ArenaApp`
  choisit désormais, par son paramètre).
- **25 fautes injectées une à une** (fichiers rendus à l'octet, SHA-256) : **23 attrapées** au premier passage. Les deux autres : « la jauge
  brisée non tenue pleine » ne change rien d'observable (la règle la garde déjà à son maximum pendant le break) : écartée ; « le repoussé sans sa
  séquence » retombait sur la première séquence de Marek à 1 s : **[KO → corrigé]** le test vérifie aussi l'instant du repoussé (avant
  `ai.start`), la faute rejouée seule est attrapée. Soit **24 sur 24**.
- **Validation** : typecheck, `npm test` **188 / 188**, build, `art:validate` (18 manifestes, 30 sources, 0 erreur).

### Le budget GPU (E24 : « Pas plus cher que la nuit B, à définition égale »)
- `tools/perf.mjs` sur le serveur de la branche, 1920 × 1080, 5 tours entrelacés, `fps=off`, témoin de contention au seuil de 15 % : **5 tours
  propres sur 5** pour chaque page, adaptateur Radeon 780M, aucun onglet du jeu ouvert dans le panneau de la séance.

| Page | ms de GPU, médiane [min-max] | écart à la nuit B (médiane) |
|---|---|---|
| nuit B (`seed=1842&clean=1&camera=B`) | 9,98 [9,47-10,99] | — |
| arène d'aujourd'hui (`scene=arena`) | 9,27 [8,93-9,53] | −7 % |
| arène, nouveau duel (`scene=arena&combat=dynamic`) | 9,19 [8,75-9,70] | −8 % |
| duel du mode jouable, nouveau duel, midi (`day2-afternoon`) | 8,57 [7,82-9,49] | −14 % |

- Le nouveau duel coûte ce que coûte l'arène d'aujourd'hui (mêmes 92 appels de dessin, 133 k triangles ; le HUD est du DOM) : **sous la nuit B**,
  à définition égale (E24 tenu, avec la réserve de l'opérateur sur les zones plus grandes). Seul le JS de mise à jour monte un peu (0,60 → 0,68 ms
  par image, médiane : le modèle du HUD).

### L'essai de l'opérateur — préparé
- **Le guide** : `briefs/combat-trial-c2.md` (les adresses, les réglages `dyn=`, les touches, ce qu'il faut regarder, ce que C2 ne fait pas).
- **Les adresses** (serveur de développement) : `?scene=arena&combat=dynamic` ; de jour `&time=midday` ; l'ancien `?scene=arena` ; une partie
  `?play=1&new=1&combat=dynamic&name=Ren` ; directement aux duels `?play=1&state=day2-afternoon&scene=arena&combat=dynamic` (`day3-afternoon`).
- **La page jouable sans serveur** : https://claude.ai/artifact/HnfCTWXSggDVVyVUskTBJK (privée ; build de production par
  `tools/arena-scene-page.mjs <dir> "scene=arena&combat=dynamic"`, l'outil prend désormais l'adresse et le titre) ; le même build servi en local
  (:5200) joue les nouvelles règles, polices chargées. La page publiée demande une connexion dans le panneau navigateur de la séance : non
  ouverte là.
- **La fiche d'arbitrages** : https://claude.ai/artifact/2BFmUTe6GFRAjq92TEHNPc (privée, collection `decisions`, relue vide après publication ;
  les protections des fiches précédentes : pont attendu 10 s, chaque écriture relue). Seize points : le défaut (C2-1) et la durée des duels ;
  les nombres du § 11 (PA au plus, regain, recharges, action objet, esquive, jauge, break, Rempart et Ferveur) ; le HUD et le signe de la
  priorité ; les écarts de l'interface. Images : `screenshots/calibration/c2-arena/`.

### Journal — [OK] archivage (passes gardées au-delà d'environ 60 Ko)
- Avant cette passe, les passes gardées faisaient 57 009 octets ; avec elle, plus de 75 000. UI2 et UI3, closes (fusionnées), partent d'un seul
  bloc vers `journal/25-passes-UI2-UI3.md` (29 597 octets, SHA-256 du bloc `63328e12a5be10b9…`). Preuve **8 / 8** (script hors dépôt, contre la
  copie de `JOURNAL.md` d'avant le déplacement : corps de l'archive égal au bloc ; UI2, UI3 contigus, suivis de CB1 ; plus dans `JOURNAL.md` ;
  chacune dans un seul fichier de `journal/` ; CB1 inchangée à l'octet ; seules la phrase d'en-tête et une ligne d'index changent ; en-tête comme
  `journal/24` ; CRLF seuls). Contrôle négatif : un bit changé dans une copie de l'archive → 7 / 8.

### Restes [?]
- **L'essai de l'opérateur en jeu**, puis sa fiche ; le défaut reste l'arène d'aujourd'hui jusqu'à sa décision (CB-10).
- **C3** (garde, esquive et compétences des rivaux ; l'alerte légère des compétences ; L7-4), C4, C5, chacun dans sa séance ; les feuilles de
  combat après l'essai et AA1-3.
- Les images d'aujourd'hui sur les nouveaux moments sont des emprunts : Rempart joue la garde, Ferveur la lame levée, la préparation tient la
  première image (§ 14 attend `skillOff`, `skillDef`, `skillSup`, `ko` jusqu'à terre).
- Les nombres flottants des moments figés (`jump`) sont saisis à l'opacité 0 par les captures, comme avant cette passe (ancien duel compris) ;
  les images de revue les figent visibles par un style de capture.
- Le contraste du télégraphe du nouveau duel (6,77:1) se lit sur son moment `window`, un peu plus tôt dans la charge que celui d'aujourd'hui.
- Les écarts de l'interface relevés ci-dessus, sur la fiche.

### Pensée
- Une propriété posée avant un raccourci (`line-height` puis `font:inherit`) est effacée par lui : une hauteur se mesure dans la page, ligne et
  bord de coupe compris, pas seulement la boîte (la barre « faisait 60 px », le sous-libellé débordait).
- `opacity: 0` ne retire pas un élément : il garde le pointeur et recouvre ce qui est dessous ; un outil qui teste le recouvrement le voit,
  l'œil non. Une couche cachée sort du rendu (`display`, `visibility`).
- Un signe placé « au centre entre les cartes » se vérifie à chaque largeur où les cartes changent de taille (30vw sous 1 241 px) et sur les
  téléphones étroits (667 px), contre tout ce qui partage sa place (la barre de la fenêtre d'esquive).
- Un moment scripté se vérifie à son instant aussi : sans sa séquence forcée, le « repoussé » arrivait quand même, par la première séquence
  naturelle de l'adversaire.
- Un mode ajouté derrière un paramètre dans une page existante se prouve par la scène seule (`clean=1`) à 0 px, puis par l'interface, dont
  chaque changement voulu se borne (rectangle, halo) et se nomme.

## Passe AA2 — L'essai de densité des combattants de l'arène (décision AA1-3) : le héros cuit dans le duel à ×2, ×3 et ×4, une fiche d'arbitrages (2026-10-25)

### Demande
- Séance locale lancée par la séance parente, pendant l'essai du duel C2 par l'opérateur : l'essai décidé en AA1-3, « Essai en scène ×2 contre ×4
  d'abord ». `hero-x2-v4` dans le cadrage du duel à ×2 tel quel, puis reconstruit à ×4 depuis ses planches archivées par la chaîne du héros (rig de
  labo, manifeste `lab`) ; derrière un paramètre réservé au serveur DEV ; l'arène par défaut à 0 px contre `main` figé, ancien duel et
  `combat=dynamic` ; captures côte à côte (×2, ×4, Ren généré, la ville), recadrages, texel mesuré, coût dans l'atlas, temps GPU (E24), ce que
  chaque densité implique pour les feuilles de combat ; une fiche d'arbitrages, relue et consignée. La tâche demande aussi de chiffrer « un autre
  facteur » : le ×3 est construit par la même recette pour être montré.
- Branche `arena-density-aa2` depuis `main` (`5ce9d5b`), seule branche de travail (`git fetch --prune`, `git branch -a`). `.gitignore` et `.claude/`
  jamais commités. Serveurs : `dev-strict` (:5186) et `main` figé (`5ce9d5b`, copie hors dépôt, :5201, entrée locale `aa2-frozen-main`), par
  `preview_start` / `preview_stop`. Aucune image générée ; la fiche de l'essai C2 n'est pas touchée.

### Fait — [OK] le paramètre, réservé au serveur DEV
- **`src/lab/fighterDensity.ts`** (nouveau, DEV) : `?scene=arena&fighterdensity=x2|x3|x4` charge `hero-x2-v4` (production), `hero-x3-trial` ou
  `hero-x4-trial` (labo) par le chargeur de `?baked=` (`loadSheet`, exporté de `src/lab/bakedLoader.ts` : manifeste, SHA-256 contre le paquet de
  provenance, décodage à l'octet) ; chaque image de profil (repos 4, marche 8) est posée dans une case d'arène (64 × 96 pixels de la ville à k
  texels par pixel, pieds sur la rangée 90 k, comme `FighterArt` place une image de la ville) d'une texture cuite rangée en cases entières (la voie
  « baked » du `SpriteRenderer`, adressage par case entière). Ren garde la pose choisie pendant tout le duel (`fighterpose=idle|walk|idle.<i>|walk.<i>`),
  à l'échelle de présentation du héros en ville (0,9) et avec son contour noir (S3b ; `fighteredge=rim` : le liseré du shader) ; Marek reste le
  combattant généré ×2, témoin de la densité d'aujourd'hui. `window.__density` : la feuille, la case, la texture, `measure()` (le texel à l'écran).
- **`src/arena/ArenaApp.ts`** : trois lignes derrière `import.meta.env.DEV &&` et un champ `declare` (jamais émis).
- **Preuves du défaut** : `tools/arena-scene-shots.mjs` (`HOLD=1`, 1920 × 1080, graine 1842 ; une capture de chauffe qui retire le voile de
  chargement et coupe les transitions CSS, **[KO → corrigé]** la première série la prenait dans son fondu : 1,1 à 2 millions de pixels entre deux
  chargements de `main`) : ancien duel 9 moments, nouveau duel 9 moments, la nuit et à midi en scène seule, et HUD affiché : **témoin 0 px sur 54,
  branche contre `main` figé 0 px sur 54**. **Bundle de production identique à l'octet** à celui de `main` figé (31 fichiers, même configuration) :
  le paramètre et le module de labo en sont retirés.

### Fait — [OK] le héros reconstruit à ×3 et ×4 (rigs de labo)
- **`art-lab/characters/rigs/hero-trial.common.mjs`** : `trialRig(K)`, la recette de `hero-x2-v3` pour la vue de profil, toutes ses longueurs
  multipliées par S = K / 2 (arrondies au texel) : le profil de la planche v4-b (même recadrage) reconstruit au pas 3,4 / S, la palette de
  `hero-x2-v4` épinglée (aucune couleur nouvelle), la préparation (halo, mèches, fentes, pieds centrés), le souffle du repos, et la course de la
  planche v3 (rangée du bas, huit images) passée par le rig de course (découpe, cisaillement depuis la hanche, enjambée, vol). **Aucune retouche
  du visage** : à ×3 et ×4 la reconstruction garde l'œil et la bouche que `hero-x2-v3` avait dû redessiner à ×2 (Passe H9).
  `hero-x4-trial.rig.mjs` = `trialRig(4)` (128 × 192, pieds rangée 180, pas 1,7), `hero-x3-trial.rig.mjs` = `trialRig(3)` (96 × 144, pieds 135,
  pas 2,2667). Les planches et la palette sont vérifiées par SHA-256 avant usage.
- **`tools/art-lab/build-trial.mjs`** (nouveau) : la chaîne de `build-character.mjs` à la taille de cadre que déclare le rig (reconstruction,
  palette épinglée, contrat d'image, Aseprite 1.3.18.6, chaque image exportée comparée) ; `build-character.mjs` et `rig-engine.mjs` ne changent
  pas (leurs empreintes sont dans les paquets approuvés). `--check` : **reconstruits identiques**, les deux.
- **Manifestes `lab`, non approuvés** (`experimental`), paquets de provenance (sources, chaîne, table des fichiers), hors de la distribution
  (aucune entrée de `BakedCast`). Pas de pose de combat : les planches archivées dessinent le héros sans épée ; aucune image générée.
- Figure de repos de profil : ×2 1 875 texels opaques sur 84 rangées, ×3 4 220 sur 127, ×4 7 467 sur 170 ; 60 à 63 couleurs de la même palette.

### Les mesures
- **Le texel à l'écran**, mesuré dans la page (largeur du quad de Ren projetée, échelle 0,9) : ×2 **3,50 px** en 1080p (4,67 en 1440p), ×3
  **2,34** (3,11), ×4 **1,75** (2,34) ; Ren généré (échelle 1) 3,89 (5,19).
- **[KO → corrigé] la référence de la ville** : l'audit AA1 donnait « environ 1,5 » pour la distribution cuite. Mesuré pour le héros (`hero-x2-v4`,
  ×2, échelle 0,9) à 1920 × 1080, graine 1842 : A 1,23 ; B 2,04 à 2,10 ; C 2,32 ; D 2,04 ; en 2560 × 1440, B 2,88. Le 1,5 vient des PNJ en B (0,65
  à 1,68, Passe S2). Le héros cuit posé à ×2 dans le duel a donc des texels **1,7 fois** plus gros qu'en ville (pas 2,5) ; le ×3 tombe sur le texel
  du héros dans les cadrages proches de la ville.
- **L'atlas** (case d'arène = 64 × 96 pixels de la ville) : ×2 case 128 × 192, 160 par texture de 2 048, 96 Ko ; ×3 192 × 288, 70, 216 Ko ; ×4
  256 × 384, **40**, 384 Ko. Un duel complet de la liste CB1 (Ren 34 + Marek 34 = 68 images) : ×2 une texture 2 048 × 960, 7,5 Mo ; ×3 une
  texture 1 920 × 2 016, 14,8 Mo, **2 cases libres** ; ×4 **deux textures** (34 par combattant), 2 × 15 Mo, et le `SpriteRenderer` ne lit
  aujourd'hui qu'une texture cuite.
- **GPU** (`tools/perf.mjs`, serveur de la branche, 1920 × 1080, 5 tours entrelacés, `fps=off`, témoin de contention au seuil de 15 %, aucun onglet
  du jeu dans le panneau : **5 tours propres sur 5**, Radeon 780M) : nuit B **9,80** ms [9,54-9,91] ; arène d'aujourd'hui **8,88** [8,74-9,23] ; ×2
  **9,14** [8,68-9,37] ; ×3 **9,06** [8,77-12,37 : un tour plus lent sur toutes les passes, propre selon le témoin] ; ×4 **9,07** [8,79-9,18]. Mêmes 92
  appels de dessin, 133 k triangles. **E24 tenu** pour les trois densités ; la densité ne change pas le coût du duel (la surface du quad est la
  même, seule la texture lue change).

### Captures (`screenshots/calibration/aa2-fighter-density/`)
- Au moment `charging` (Ren au repos), `clean=1`, la nuit et à midi, 1920 × 1080 et 2560 × 1440 : la ville en référence (B, `player=-1,2`, `crowd=0`
  — **[KO → refait]** un passant cachait le héros), Ren généré, ×2, ×3, ×4, recadrés au même agrandissement ; la tête au plus proche ; la marche ;
  la nuit avec le contour de la ville et avec le liseré du shader. À l'œil : le ×3 et le ×4 montrent l'œil, les mèches, les boucles et le bord de
  la cape que le ×2 fond en blocs ; l'écart ×3 → ×4 est plus petit que ×2 → ×3.
- **[?] La nuit** : la lune est derrière la porte de l'arène ; les générés portent un liseré froid peint dans leurs images (`rimLight`), le héros cuit
  avec le contour noir de S3b se détache mal du pavé ; le liseré du shader le borde d'un trait fin et pointillé. Sur la fiche (AA2-2).

### La fiche — [OK] publiée, 3 choix sur 3 enregistrés et relus
- Page privée https://claude.ai/artifact/Y6Ur6JL2TDrrMR4rhve9oP, collection `decisions`, relue vide après publication ; les protections des fiches
  précédentes (pont attendu 10 s, chaque écriture relue). Trois points : AA2-1 la densité (recommandé ×3), AA2-2 le bord la nuit (recommandé :
  trancher sur la première feuille de Ren), AA2-3 les feuilles d'essai (recommandé : les garder jusqu'à la feuille de Ren).

### Les choix de l'opérateur, mot pour mot
« = » : la recommandation de la fiche est suivie.

| # | Décision | Recommandation | Choix de l'opérateur | Note | |
|---|---|---|---|---|---|
| AA2-1 | La densité des feuilles de combat de Ren, Marek et Vessa | « ×3 » | « ×3 » | — | = |
| AA2-2 | Le bord d'un combattant cuit contre le contre-jour de la lune | « Trancher sur la première feuille de Ren » | « Trancher sur la première feuille de Ren » | — | = |
| AA2-3 | Les feuilles d'essai et le paramètre `fighterdensity` | « Les garder jusqu'à la feuille de Ren » | « Les garder jusqu'à la feuille de Ren » | — | = |

- Relue après « La fiche de densité des combattants est remplie. » : **3 documents sur 3** dans `decisions`, cliqués le 25/10 entre 09 h 42 et
  09 h 43 UTC, aucune note ; chaque écriture relue par la page avant « Enregistré et relu ».
- **Ce qui en suit** (rien d'autre n'est appliqué par cette passe) :
  - les feuilles de combat de Ren (34 images, CB-2), puis de Marek et de Vessa, se produisent **à ×3** : cases de 192 × 288 texels (cadre 96 × 144
    par image de la ville, pieds rangée 135), reconstruction au pas 2,27 des planches générées, une seule texture cuite par duel (70 cases ; 68 pour
    Ren + Marek complets) ; les compétences signature demanderont une seconde texture ou des cases ajustées à la figure ;
  - le héros aura deux feuilles : la ville garde `hero-x2-v4` (×2), l'arène prend sa feuille de combat ×3, repos et marche refaits par la même
    recette (`trialRig(3)` en montre la voie) ; rien n'entre en production sans manifeste approuvé par l'opérateur ;
  - le bord la nuit (contour noir, liseré du shader, liseré peint) se tranche sur la première feuille de Ren, rendus côte à côte ;
  - `hero-x3-trial`, `hero-x4-trial` et `?fighterdensity=` restent, en labo et sur le serveur DEV, jusqu'à la feuille de Ren ; puis on les retire.

### Tests et validation
- `tests/fighter-density.test.mjs` (3) : les feuilles d'essai sont `lab`, non approuvées, hors de la distribution (candidats compris), leur export
  contre leur paquet ; chacune est le profil du héros de production (repos et marche, mêmes nombres d'images) à sa densité ; l'arène n'atteint
  l'essai que derrière `import.meta.env.DEV`, et aucun autre fichier de `src/` hors `src/lab`. **4 fautes injectées sur 4 attrapées** (manifeste
  approuvé, une image de marche retirée, une garde DEV retirée, une importation hors de l'arène), fichiers rendus à l'octet (SHA-256).
- Typecheck, `npm test` **191 / 191**, build, `art:validate` (20 manifestes, 30 sources, 0 erreur), `build-trial.mjs --check` ×2.
- Journal : avec cette passe, les passes gardées font 59,2 Ko, sous le seuil d'environ 60 Ko : pas d'archivage.

### Pensée
- Une référence chiffrée d'un audit se remesure avant de fonder une décision : « environ 1,5 » était la foule, le héros fait 2,0 à 2,3 ; l'écart à
  combler passait de 2,5 à 1,7, et le facteur qui le comble devient ×3.
- Une capture de chauffe se vérifie par son témoin : sans elle, le voile de chargement en fondu donnait des millions de pixels d'écart entre deux
  chargements du même `main`.
- Un outil dont l'empreinte est épinglée dans des paquets approuvés ne s'étend pas en place pour un essai : un pilote voisin qui reprend sa chaîne
  garde les paquets valides et se prouve par son propre `--check`.
- Une recette paramétrée par la densité (`trialRig(K)`) se prouve en reconstruisant à l'identique la première sortie après le refactoring, avant
  d'en tirer une seconde.

