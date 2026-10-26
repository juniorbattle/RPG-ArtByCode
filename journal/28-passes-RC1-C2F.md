# Journal de bord — archive : passes RC1 et C2F (2026-10-25 → 2026-10-26)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-10-26 (Passe RC2) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe RC1 — La première feuille de combat de Ren à ×3 (étape 1 de la feuille de route, décision AA2-1) : 22 images générées puis reconstruites, dans le duel derrière un paramètre DEV, une fiche d'arbitrages (2026-10-25)

### Demande
- Séance locale lancée par la séance parente : la première feuille de combat de Ren (`hero-x2-v4`) à la densité ×3 décidée en AA2-1 (« ×3 »), étape 1
  de `briefs/roadmap-2026-10.md` : une feuille de labo `hero-x3-combat` (cases de 192 × 288 texels, pieds rangée 270, palette de `hero-x2-v4`
  épinglée), montrée dans le duel derrière un paramètre DEV ; le bord la nuit (AA2-2 « Trancher sur la première feuille de Ren ») ; les mesures
  (texel, texture, GPU) ; une fiche d'arbitrages. Les planches du héros ne dessinant ni épée ni pose de combat, la voie se propose à l'opérateur
  avant toute génération.
- Branche `ren-combat-x3` depuis `main` (`8c9a4ad`), seule branche de travail (`git fetch --prune`, `git branch -a`). `.gitignore` et `.claude/`,
  modifiés hors de cette tâche, jamais commités. Serveurs : `dev-strict` (:5186) et `main` figé (`8c9a4ad`, copie hors dépôt, :5202, entrée
  locale `rc1-frozen-main`), par `preview_start` / `preview_stop`.
- **L'essai C2** : sa fiche (https://claude.ai/artifact/2BFmUTe6GFRAjq92TEHNPc) est encore vide (0 document dans `decisions`, relu au début de la
  séance). Elle peut changer l'esquive (en arrière ou de côté) et les compétences.

### Les choix de l'opérateur avant de dessiner, mot pour mot
- Question : « Les planches du héros n'ont ni épée ni pose de combat. Par quelle voie dessine-t-on l'épée et les poses de la feuille ×3 de Ren ? »
  Réponse : **« Génération (Recommandé) »** (deux requêtes par `tools/art-lab/gen-image.mjs`, gpt-image-2, références v4-b et v3 ; le rig fait
  le souffle et l'encaisse). Écartés : « Dessin par rig seul » (de profil, le bras n'est pas séparable du buste), « Hybride ».
- Question : « La fiche C2 n'est pas encore remplie, et elle peut changer l'esquive (en arrière ou de côté) et les compétences. Que met-on dans
  cette première feuille ? » Réponse : **« Clés hors C2 (Recommandé) »** : idle, ready, strike, heavy, block, hit, recover, ko, victory, 22
  images sur 34 ; `dodge`, `skillOff`, `skillDef`, `skillSup` attendent la fiche C2.

### La génération — [OK], avec un incident [KO → consigné]
- Deux prompts (`art-lab/characters/scratch/ren-combat/prompts/ren-combat-a.txt`, `-b.txt`, dans le dossier ignoré) : le même héros de profil
  tourné à gauche, une épée simple (lame d'acier, garde et pommeau en laiton comme ses boucles, poignée de cuir), dans sa main proche ; A : repos,
  posture, armé, coupe, suite, garde, coup reçu, reprise, étourdi ; B : rassemblement, lame levée, coup puissant, victoire, suite, chute, genou,
  au sol ; fond gris uni, aucune traînée, aucun effet. Chaque requête : n = 2, haute qualité, 1536 × 1024, références `hero-turnaround-v4-2026-10-19-b`
  et `hero-turnaround-v3-2026-10-19`.
- **[KO] Deux requêtes lancées en parallèle** : elles ont démarré dans la même seconde, leurs images portent le même nom
  (`ren-combat-x3-<horodatage>-<n>.png`) : les deux images de la requête A ont été **écrasées** par celles de B (0,39 $ perdus), et le registre
  (« ledger »), lu par les deux au départ et réécrit par chacune, garde la réservation non soldée de A (2,03 $ inscrits pour 1,16 $ réels :
  surestimé de 0,87 $, du côté prudent). A relancée seule ensuite. **Leçon** : une requête de `gen-image.mjs` à la fois (noms à la seconde,
  registre sans verrou).
- **Coût réel** : trois requêtes, 0,3857 + 0,3860 + 0,3857 = **1,16 $** (sous le plafond de 5 $ de la tâche).
- **Critique à l'aveugle des variantes** (agent neuf, étiquettes tirées au sort, clé hors de son champ) : planche A, **A-2 6,5 contre A-1 6** (la
  garde et l'étourdi plus lisibles ; la reprise du coup reçu de A-1 « nettement meilleure ») ; planche B, **B-2 6,5 contre B-1 5,5** (lame levée
  au sol et non en saut, genou à terre et non à quatre pattes). Auto-critique écrite avant le verdict : A-1 (figures plus grandes), B-2. Relevé
  par le critique sur les quatre : la victoire de face, le torse du repos de trois-quarts, un détail (mèches, plis) trop fin pour 42 pixels.
- **Archivées** comme sources non canoniques (`--archive`, octets et records) : `ren-combat-x3-2026-10-25-a1`, `-a2`, `-b2` dans
  `art-lab/characters/reference/sources/` ; B-1 reste dans le dossier ignoré.

### La feuille `hero-x3-combat` — [OK] (manifeste `lab`, non approuvé)
- **`art-lab/characters/rigs/hero-x3-combat.rig.mjs`** : par figure, la figure seule sur sa planche (les autres repeintes du fond), reconstruite
  par `reconstruct-grid.mjs` au **pas de sa planche** (hauteur de la figure debout sur les 128 rangées du repos de `hero-x3-trial` : a1 2,1875, a2
  1,875, b2 2,2266 ; A-2 dessine son héros plus petit) dans un cadre de 384 × 288, pieds rangée 270 ; le halo gris retiré sur les couleurs
  pleines (avant la palette : la lame grise est au bord partout et la règle de couleur des essais l'aurait effacée) ; la couleur OKLab la plus
  proche de la palette de `hero-x2-v4` (aucune couleur nouvelle : **64 couleurs**, toutes de cette palette) ; îlots de moins de 12 texels
  retirés ; **les hanches sur la colonne 96** (le milieu des deux pieds, l'axe de `FighterArt` entre pied avant et pied arrière ; réglées à l'œil
  pour les trois images du K.O.), avancées du moins qu'il faut pour que la lame tienne dans la case : **coupe 34 texels, genou à terre 24,
  posture 8** (la case fait 64 pixels de ville de large, l'épée générée est plus longue que celle de Ren généré) ; la semelle remise sur la rangée
  270. Puis le rig : l'image 1 de `idle`, `ready`, `victory` = le souffle (inspiration, levée de 2 rangées) de l'image 0 ; `recover` 1 = l'expiration
  (tête plus basse) ; `block` 1 (l'encaisse) = le haut du corps cisaillé de 3 texels en arrière.
- **`tools/art-lab/build-combat.mjs`** (nouveau) : la chaîne d'assemblage de `build-trial.mjs` pour la case d'arène (64k × 96k, pieds 90k, axe
  32k) et les clés de combat (étiquettes `<clé>-side`) ; contrôle d'image (alpha binaire, anneau transparent, chaque image sur la rangée des
  pieds), Aseprite 1.3.18.6, chaque image exportée comparée à celle du rig ; `build-trial.mjs`, `build-character.mjs` et `rig-engine.mjs` ne
  changent pas. `--check` : **reconstruite identique**.
- Export : **22 images** (idle 2, ready 2, strike 3, heavy 4, block 2, hit 2, recover 2, ko 3, victory 2), feuille 1152 × 1152 ; paquet de
  provenance (sources, chaîne, table des fichiers), manifeste `lab`, hors de la distribution.

### Dans le duel — [OK] derrière le paramètre DEV
- **`src/lab/fighterDensity.ts`** : `?scene=arena&fighterdensity=combat` charge la feuille (manifeste, SHA-256 contre le paquet, décodage exact,
  contrat d'image vérifié) dans la texture cuite de l'arène ; ses images prennent **les clés de Ren** (`ren/side/<clé>.<i>/0`) : le duel les joue
  sur ses propres moments, sous les deux règles, à l'échelle 0,9 du héros. Les clips que la feuille ne dessine pas encore **empruntent** ses
  images (`dodge` = `hit`, `skill` et `slash` = `strike`) ; **le K.O. joue ses trois images** sur sa propre horloge (`koFrame` : chute avant 0,25 s,
  genou avant 0,6 s, au sol ensuite ; le clip du duel n'en a que deux) ; la portée (`reach`) est mesurée sur la lame (la frappe touche Marek).
  `&fighterpose=<clé>.<i>` tient une image, `__density.setPose()` la change sans recharger (captures) ; `&fighteredge=dark|rim|painted`.
  Marek reste généré ×2. Les valeurs `x2`, `x3`, `x4` de l'essai AA2 ne changent pas.
- **Vérifié en jeu** : `strike`, `heavyRen`, `block`, `dodge` (emprunt), `impact`, `technique` (emprunt), la victoire ; le nouveau duel : `prep`,
  `ward` (Rempart sur la garde), `boost` (Ferveur sur la victoire), `pushed`, `broken` (étourdi), `koRen` (le K.O. passe par 0, 1, 2 à 0,25 et
  0,6 s, pas à pas de 1/60 s).

### Le bord la nuit (AA2-2) — rendus côte à côte
- Trois bords : le contour noir 25 % de la ville (S3b, défaut du paramètre), le liseré du shader (`rim`), et **un liseré peint** dans les texels
  (`painted`, la règle `rimLight` de `FighterArt` : un texel froid sur les bords haut et arrière que la lune attrape, un peu sur l'avant, jamais la
  rangée des pieds ; avec le liseré du shader, comme les générés). La nuit : au contour noir, la cape et le pantalon tombent dans le pavé ; le
  liseré du shader trace un pointillé ; le liseré peint détache la tête, la cape et la jambe arrière d'un trait continu. À midi, les trois se
  lisent, le liseré peint y ajoute un bord clair bleuté. Sur la fiche (RC1-2) ; le liseré peint n'est qu'un aperçu du module DEV (couleurs hors de
  la palette, appliquées au chargement).

### Les mesures
- **Texel à l'écran** (quad de Ren projeté, échelle 0,9) : **2,34 px** en 1920 × 1080, **3,11** en 2560 × 1440, la nuit et à midi (le héros en ville :
  2,0 à 2,3 ; Ren généré 3,89).
- **Texture** : case de 192 × 288, **70 cases** par texture de 2 048 ; les 22 cases prennent 1 920 × 864 (6,6 Mo) ; Ren complet (34) et Marek
  complet (34) : 68 cases, 2 libres, comme prévu en AA2.
- **GPU** (`tools/perf.mjs`, serveur de la branche, 1920 × 1080, 5 tours entrelacés, `fps=off`, témoin de contention au seuil de 15 %, onglets de la
  séance fermés : **5 tours propres sur 5**, Radeon 780M) : nuit B **8,78** ms [8,63-8,96] ; arène d'aujourd'hui **8,02** [7,95-8,20] ; feuille ×3
  **7,98** [7,98-8,12] ; liseré peint **7,97** [7,93-8,02] ; nouveau duel avec la feuille **8,01** [7,94-8,16]. Mêmes 92 appels de dessin, 133 k
  triangles. **E24 tenu**.

### Critique à l'aveugle de la feuille dans la scène
- Agent neuf, étiquettes tirées au sort : six moments du duel la nuit (repos, attaque légère, élan de la puissante, garde, coup reçu, victoire),
  Ren généré contre la feuille. **La feuille 6, Ren généré 5** ; « à ne pas expédier tel quel » (7 ou plus). La feuille : ses six moments se lisent,
  la fente, l'élan de la puissante et le coup reçu mieux que chez le généré (dont le coup reçu se lit comme une garde). Ses défauts : la lame d'un
  texel se perd sur le pavé et le fond clair ; la cape et le pantalon tombent dans le pavé la nuit ; les ceinturons font un fourmillement
  sombre ; Ren n'est plus « du même monde » que Marek resté ×2 (attendu jusqu'à sa feuille, AA2-1). Auto-critique écrite avant : la feuille 7,
  le généré 5 (surestimée d'un point).

### Les preuves
- **L'arène par défaut contre `main` figé** (`tools/arena-scene-shots.mjs`, `HOLD=1`, 1920 × 1080, graine 1842, deux captures de chauffe) : ancien duel
  9 moments (`charging`, `strike`, `heavyRen`, `block`, `dodge`, `impact`, `technique`, `combo`, `ko`), nouveau duel 9 (`charging`, `strike`, `prep`,
  `ward`, `combo`, `pushed`, `foeBreak`, `broken`, `koRen`), scène seule la nuit et à midi, et le HUD affiché la nuit : **54 sur 54 à 0 px**,
  témoin (deux chargements de `main`) **54 sur 54**. **[KO → corrigé]** une première série du HUD différait aussi au témoin (10 captures sur 18,
  dans les cartes et le signe : les transitions CSS) : refaite avec les transitions et animations coupées à la chauffe, 18 sur 18.
- **Bundle de production** identique à l'octet à celui de `main` figé (même configuration, **31 fichiers**), avant et après le dernier changement
  du module DEV.
- **Tests** : `tests/combat-sheet.test.mjs` (6) : la feuille `lab`, non approuvée, hors de la distribution, chaque fichier de son paquet à son
  empreinte ; ses sources archivées, non canoniques, celles que lit le rig, la palette épinglée ; ses images : les clés hors C2 avec leurs nombres
  (oracle écrit d'après le § 14), la case ×3, le contrat d'image, les seules couleurs de `hero-x2-v4` ; chaque image que le duel demande à Ren
  trouvée (la feuille ou un emprunt) et l'horloge du K.O. ; le liseré peint sur les seuls texels de bord, jamais l'alpha ni la rangée du sol ;
  aucun fichier de `src/` hors `src/lab` ne nomme la feuille. **10 fautes injectées sur 10 attrapées** (manifeste approuvé, manifeste en
  production, esquive non prêtée, horloge du K.O. décalée, K.O. à deux images, liseré à l'intérieur, liseré sur la rangée du sol, feuille nommée
  hors du labo, source déclarée canonique, empreinte de source du rig), fichiers rendus à l'octet (SHA-256).
- **Validation** : typecheck, `npm test` **197 / 197** (191 + 6), build, `art:validate` (21 manifestes, 33 sources, 0 erreur), `build-combat.mjs --check` ;
  après la fiche (ci-dessous) : `npm test` **195 / 195** (les 3 tests des feuilles d'essai retirés, un ajouté), `art:validate` (19 manifestes, 33
  sources, 0 erreur).

### La fiche — [OK] publiée, 4 choix sur 4 enregistrés et relus
- Page privée https://claude.ai/artifact/KxFxjXUajBWpgsxcfJo2WC, collection `decisions`, relue vide après publication ; les protections des fiches
  précédentes (pont attendu 10 s, chaque écriture relue). Relue après « La fiche de la feuille de combat de Ren est remplie. » : **4 documents sur
  4**, cliqués le 25/10 entre 22 h 21 min 10 s et 22 h 21 min 30 s UTC, aucune note.

### Les choix de l'opérateur, mot pour mot
« = » : la recommandation de la fiche est suivie.

| # | Décision | Recommandation | Choix de l'opérateur | Note | |
|---|---|---|---|---|---|
| RC1-1 | La première feuille de combat de Ren (22 images) | « Bonne base : compléter après la fiche C2, avec les reprises » | « Bonne base : compléter après la fiche C2, avec les reprises » | — | = |
| RC1-2 | Le bord de Ren contre le contre-jour de la lune | « Liseré peint la nuit, contour noir de jour » | « Liseré peint la nuit, contour noir de jour » | — | = |
| RC1-3 | L'entrée en production de la feuille | « Pas encore : en labo jusqu'à la feuille complète » | « Pas encore : en labo jusqu'à la feuille complète » | — | = |
| RC1-4 | Les feuilles d'essai hero-x3-trial, hero-x4-trial et fighterdensity=x2\|x3\|x4 | « Les retirer, garder fighterdensity=combat » | « Les retirer, garder fighterdensity=combat » | — | = |

- **Ce qui en suit** :
  - RC1-1 : la feuille est une bonne base ; les 12 images qui restent (`dodge`, `skillOff`, `skillDef`, `skillSup`) se font **après la fiche C2**,
    par la même voie (génération puis reconstruction), et la même génération **reprend** la victoire de profil, une vraie taille pour la coupe et
    la lame à deux texels. Tâche à part, après la fiche C2.
  - RC1-2 : **le liseré peint la nuit, le contour noir 25 % de jour** ; appliqué ci-dessous comme défaut du paramètre DEV ; dans la feuille
    complète, le liseré se fera dans les texels (une variante de nuit des images, ou une règle du rendu des feuilles cuites de l'arène), à
    trancher par la tâche qui les produit.
  - RC1-3 : **pas de production** : la feuille reste en labo jusqu'à la feuille complète (34 images) avec son bord ; puis une tâche
    d'intégration avec l'approbation du manifeste par l'opérateur.
  - RC1-4 : appliqué ci-dessous.

### Après la fiche — [OK] RC1-4 et RC1-2 appliqués
- **RC1-4** : `hero-x3-trial` et `hero-x4-trial` retirés (manifestes, exports, sources `.aseprite`, paquets de provenance, rigs, et la recette
  commune `hero-trial.common.mjs` : 17 fichiers, 438 577 octets, gardés dans l'historique git) ; `tests/fighter-density.test.mjs`, qui les testait,
  retiré (sa garde « derrière `import.meta.env.DEV` » passe dans `tests/combat-sheet.test.mjs`) ; `src/lab/fighterDensity.ts` ne garde que
  `fighterdensity=combat` et refuse toute autre valeur (`fighterdensity "x3": combat`) ; `tools/art-lab/build-trial.mjs` reste (outil générique,
  sa première utilisation notée retirée) ; les commentaires d'`ArenaApp.ts` et de `bakedLoader.ts` mis à jour (aucun code).
- **RC1-2** : sans `fighteredge`, le bord suit l'état du jour de la page (`edgeFor`) : la nuit (pas de `time`, ou `time=night`) le liseré peint
  (8 148 texels de liseré sur les 22 images, mesuré en page), de jour le contour noir. Vérifié dans la page : nuit `painted`, midi et matin
  `dark`, `fighteredge=dark` la nuit `dark`.
- **Tests** : `tests/combat-sheet.test.mjs` (7) : le bord selon l'état du jour, les valeurs `x2`, `x3`, `x4` et vide refusées, les manifestes
  d'essai absents, la garde DEV d'`ArenaApp` reprise. **13 fautes injectées sur 13 attrapées** (les 10 d'avant et : bord inversé, valeur d'essai
  acceptée, garde DEV retirée), fichiers rendus à l'octet.
- **Preuves** : l'arène par défaut contre `main` figé refaite : **54 sur 54 à 0 px** (mêmes moments, scène seule la nuit et à midi, HUD figé, ancien et
  nouveau duel) ; bundle de production identique à l'octet (31 fichiers) ; `build-combat.mjs --check` identique.

### Journal — [OK] archivage (passes gardées au-delà d'environ 60 Ko)
- Avec cette passe, les passes gardées dépassaient 70 Ko. CB1 et C1, closes (fusionnées), partent d'un seul bloc vers
  `journal/26-passes-CB1-C1.md` (27 412 octets) ; restent 46 Ko. Preuve **8 / 8** (script hors dépôt, contre la copie de `JOURNAL.md` d'avant le
  déplacement : corps de l'archive égal au bloc ; CB1, C1 contigus, suivis de C2 ; plus dans `JOURNAL.md` ; chacune dans un seul fichier de
  `journal/`, par sa ligne de titre entière ; C2 et AA2 inchangées à l'octet ; seules la phrase d'en-tête et une ligne d'index changent ; en-tête
  comme `journal/25` ; CRLF seuls). **[KO → corrigé]** le contrôle 4 cherchait le début de titre « Passe C1 » : une autre Passe C1 (la foule, 19/10) vit dans
  `journal/10` ; il compare désormais la ligne de titre entière. Contrôle négatif : un bit changé dans une copie de l'archive → 7 / 8.

### Pensée
- Deux appels d'un outil qui nomme ses fichiers à la seconde et réécrit un registre lu au départ ne se lancent pas en parallèle : l'un écrase
  l'autre, et le registre perd une écriture. Un outil à registre se sert une requête à la fois.
- Une règle de nettoyage par couleur (le halo gris du fond) se relit contre ce que la nouvelle matière dessine en gris (une lame d'acier, toute en
  bord) : avant la palette, sur la distance au fond lui-même, pas sur une plage de gris.
- Plusieurs planches générées n'ont pas la même échelle : chaque figure se reconstruit au pas de sa planche, réglé sur une hauteur commune, et
  l'ancrage (les hanches, entre les deux pieds) se fixe avant de juger le mouvement ; ce que la case refuse (une lame trop longue) se chiffre et
  se nomme.
- Une capture d'interface se fige par son témoin : sans transitions coupées, deux chargements du même `main` différaient dans le HUD.

## Passe C2F — La fiche de l'essai C2 relue et consignée : 16 choix sur 16, le défaut après C3 (2026-10-26)

### Demande
- Dans la séance de la feuille de combat de Ren (Passe RC1), l'opérateur : « cest rempli non », puis « done ». La fiche de la Passe C2
  (https://claude.ai/artifact/2BFmUTe6GFRAjq92TEHNPc, collection `decisions`) était vide à la première relecture (0 document) : les choix
  pouvaient être restés dans le navigateur (la page les garde et les renvoie à la connexion) ; l'opérateur l'a rouverte, puis « done ».
- Branche `c2-sheet-record` depuis `main` (`8babb52`), seule branche de travail. Documentation seule : aucun code ne change.

### La fiche — [OK] 16 choix sur 16 enregistrés et relus
- Relue après « done » : **16 documents sur 16**, cliqués le 26/10 entre 00 h 49 min 30 s et 00 h 53 min 06 s UTC, aucune note ; chaque écriture
  relue par la page avant « Enregistré et relu ».

### Les choix de l'opérateur, mot pour mot
« = » : la recommandation de la fiche est suivie.

| # | Décision | Recommandation | Choix de l'opérateur | Note | |
|---|---|---|---|---|---|
| C2-1 | Le nouveau duel devient-il le défaut ? (CB-10) | « Pas encore : après C3 et un second essai » | « Pas encore : après C3 et un second essai » | — | = |
| C2-2 | La durée des duels | « Comme mesurées (5 à 9 min) » | « Comme mesurées (5 à 9 min) » | — | = |
| C2-3 | Le maximum de points d'action | « 5 PA » | « 5 PA » | — | = |
| C2-4 | Un PA rendu avec le temps | « Aucun » | « Aucun » | — | = |
| C2-5 | Les recharges des compétences | « Aucune » | « Aucune » | — | = |
| C2-6 | L'action objet en combat | « Plus tard (C4 / C5) » | « Plus tard (C4 / C5) » | — | = |
| C2-7 | La direction de l'esquive | « En arrière » | « En arrière » | — | = |
| C2-8 | La jauge de résistance | « Comme aujourd'hui » | « Comme aujourd'hui » | — | = |
| C2-9 | Le break : étourdissement et dégâts | « 6 s, ×1,2 » | « 6 s, ×1,2 » | — | = |
| C2-10 | Rempart et Ferveur | « Les garder » | « Les garder » | — | = |
| C2-11 | Ce que montre le HUD (CB-6) | « Approuvé » | « Approuvé » | — | = |
| C2-12 | Le signe de la priorité dans l'aide discrète | « Dans l'aide discrète » | « Dans l'aide discrète » | — | = |
| C2-13 | La barre d'actions dans une fenêtre étroite | « Accepter » | « Accepter » | — | = |
| C2-14 | L'écran de chargement | « Tâche à part » | « Tâche à part » | — | = |
| C2-15 | Le téléphone tenu droit | « Le garder » | « Le garder » | — | = |
| C2-16 | La page publiée de l'ancienne arène | « La republier » | « La republier » | — | = |

### Ce qui en suit (rien d'autre n'est appliqué par cette passe)
- **Le défaut (C2-1)** : l'arène et le tournoi d'aujourd'hui restent le défaut ; le nouveau duel y passera **après C3** (les adversaires avec
  garde, esquive et compétences) **et un second essai** de l'opérateur. Le contrat de combat (CB-9) attend toujours ce second essai.
- **Les nombres du § 11 (C2-2 à C2-9)** : ceux d'aujourd'hui sont tenus : durées de 5 à 9 minutes, **5 PA** au plus (1 au départ, CB-5), **aucun
  regain** de PA avec le temps, **aucune recharge**, l'**action objet plus tard** (C4 / C5), l'**esquive en arrière**, la jauge comme aujourd'hui
  (100, 1,8 / s), le **break de 6 s à ×1,2**. Aucune valeur de `DYNAMIC_DATA` ne change.
- **Les compétences (C2-10)** : Rempart (défensive) et Ferveur (soutien) sont gardées pour C3 / C4 : les familles défensive et soutien restent.
- **Le HUD (C2-11, C2-12)** : approuvé ; le signe de la priorité reste dans l'aide discrète.
- **L'interface (C2-13 à C2-16)** : la barre sous 1 241 px acceptée telle quelle ; « Tournez l'appareil » gardé ; deux tâches à part :
  **l'écran de chargement** dans le système de design (C2-14, avec P6) et **la page publiée de l'ancienne arène** (Passe P2) à republier au même
  lien avec le HUD d'aujourd'hui (C2-16, `tools/arena-scene-page.mjs`).
- **Pour la feuille de combat de Ren (Passe RC1)** : la fiche C2 débloque les 12 images restantes : `dodge` **en arrière** (C2-7), `skillOff`,
  `skillDef` (Rempart) et `skillSup` (Ferveur) (C2-10) ; RC1-1 les veut par la même voie, avec les reprises (la victoire de profil, une vraie
  taille pour la coupe, la lame à deux texels) et le liseré peint de nuit (RC1-2).

### Validation
- Documentation seule : typecheck, `npm test` **195 / 195**, build, `art:validate` (19 manifestes, 33 sources, 0 erreur).

### Pensée
- Une collection vide après « c'est rempli » ne dit pas que l'opérateur n'a rien choisi : la page garde les choix non enregistrés dans le
  navigateur et les renvoie à la connexion. Le dire, faire rouvrir la page (ou copier le récapitulatif), relire ensuite.

