# Journal de bord — archive : passes SA1, SN18 (2026-11-04)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-11-04 (Passe CH1) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe SA1 — Le fond gris d'un sprite en combat : l'image `strike.1` de Marek, sa cause dans la chaîne, l'audit de toutes les feuilles (2026-11-04)

### Demande
- L'opérateur, mot pour mot, transmis par la séance mère : « en combat j'ai remarque le fond d'un sprite n'est pas totalement transparent ( gris il me semble ) il faut audit et corriger cela et s'assurer que les autres sprites sont clean aussi ». La demande autorise la correction, pas l'approbation en production d'une feuille changée.

### Le sprite vu — [OK] trouvé
- **`marek-x3-combat`, image `strike.1`** (la figure `cut`, l'image du milieu de son coup simple, jouée à chacun de ses coups simples ; dans le duel du script de capture, la première fois à 10,1 s). L'image portait un rectangle opaque beige-gris autour de Marek (sa boîte, lame comprise, 170 × 138 texels, pleine à 95 %), et ses parties claires (cheveux, acier, reflets de l'armure) étaient transparentes : le fond et les gris de la figure inversés. Capturé dans le vrai duel (`?scene=arena&v2=1&foe=marek`, le duel mené jusqu'à ce que Marek joue lui-même `strike.1`), de nuit et à midi.

### La cause — [OK] prouvée, dans la chaîne, pas dans le rendu
- `rivalRig` grandit la tête des figures sur la planche (`growHead`) et donne à `reconstruct-grid.mjs` une boîte agrandie vers le haut (`grownBox`). `isolate`, qui peint les figures voisines avec le fond, ne travaillait que sur la boîte de la figure (± 40 px). Pour `cut` (planche a), la boîte agrandie monte de 144 à 98 ; son coin haut-gauche, (1049, 92) une fois la marge de 6 px ôtée, tombe sur la lame de la figure voisine `windup` (pixels 125,122,116 ; le fond vert de la planche : 3,166,73), restée hors de la zone d'`isolate`.
- `reconstruct-grid` prend la première case de sa découpe pour le fond. Il a pris l'acier gris : le vert, à plus de 60 du gris, est resté figure ; `--holes` a vidé les texels proches du gris dans la figure (cheveux, lame, reflets) ; la palette de Marek a changé le vert en beige-gris (bruit compris : la moucheture) ; `dehalo` n'a pelé que deux anneaux de bord.
- Mesuré sur toutes les figures des huit rigs de combat (le coin de chaque découpe après `isolate`, contre le fond de sa planche) : `cut` de Marek à 226 ; toutes les autres à 36 au plus (le bruit du fond vert contre le pixel de coin de la planche). Une seule figure touchée.
- **Le rendu est hors de cause** : le chargeur (`CombatSheets.cellsOf`) refuse déjà tout alpha partiel et tout texel sur l'anneau de la case ; la texture est en `NearestFilter`, sans mipmaps, en `ClampToEdge` ; le rectangle était fait de texels opaques, connexes à la silhouette, au milieu de la case : aucun de ces contrôles ne pouvait le voir.

### L'audit de toutes les feuilles de production — [OK]
- Mesuré texel par texel, image par image (scripts dans le dossier temporaire de la séance), sur les 8 feuilles de combat (Ren et les sept rivaux, 259 images) et les 31 feuilles de la ville (la distribution du quartier, `hero-x2-v4`, les quinze du casting et les cinq citadins) : alpha partiel, texels transparents colorés, texels sur l'anneau de la case, îlots détachés, poches transparentes enclavées, texels de bord gris moyens ou verdâtres, remplissage de la boîte englobante, plus longue arête droite de la silhouette ; puis chaque feuille de combat regardée sur fond magenta, les points suspects zoomés sur fond vert.

| Mesure | Combat (8 feuilles) | Ville (31 feuilles) |
|---|---|---|
| Alpha partiel, texels transparents colorés | 0 | 0 |
| Texels sur l'anneau de la case | 0 | 0 |
| Bords verdâtres | 0 | 0 |
| Remplissage de la boîte, le plus haut | 0,95 (`strike.1` de Marek), puis 0,69 | 0,81 (la marchande) |
| Arête droite la plus longue | 165 texels (`strike.1` de Marek), puis 61 (une lame) sur 192 | 25 sur 64 |
| Îlots détachés | les lames tombées des K.O. (Marek 242 texels, Vessa, Ilse, Ren 199) et 17 bouts de Ren de 1 à 7 texels (31 texels) | 0 |

- Relevés sans défaut : les taches roses vues sur fond magenta chez Vessa (`block.0`) sont l'ombre violette de son visage, opaque ; celle de Rhosk (`skillOff.1`) est le vrai jour entre son bras levé et sa tête. Les poches enclavées (224 à 1 202 texels par feuille) sont les jours entre les jambes, les bras et les lames. Les 17 bouts détachés de Ren sont des gris neutres et des bords sombres d'acier : des morceaux de lame que `blade2` laisse autour d'une main, pas du fond ; non touchés, à revoir avec la lame si l'opérateur le demande.

### Fait — [OK]
- **La chaîne corrigée** (`art-lab/characters/rigs/lib/combat.mjs`) : `isolate` couvre aussi la découpe que lira `reconstruct-grid` (la boîte agrandie), le critère de la figure gardée restant sa boîte ; `cornerIsBackground` arrête la construction si les deux pas en carré au coin de la découpe ne sont pas le fond de la planche, au test d'`isolate` lui-même. `isolate` et `grownBox` sont exportés pour le test.
- **Reconstruit** : `build-combat.mjs --check` sur les huit rigs avec la chaîne corrigée : Ren, Vessa, Orla, Cassius, Ilse, Rhosk et Tobin reconstruits identiques ; Marek différent. Marek reconstruit : une seule image change, `strike.1` (22 236 texels sur la case) ; les 31 autres identiques au texel. Sa lame entière dépasse maintenant l'avant de la case : la case recule le corps de 37 texels (`meta.pushed` `strike.1` : 37, comme `kneel` 32), l'arène avance le sprite d'autant.
- Les packs des sept feuilles inchangées : seule l'empreinte de `lib/combat.mjs` mise à jour (elles se reconstruisent à l'octet avec la nouvelle chaîne), leurs exports et leurs approbations intacts. Le pack de Marek : ses fichiers reconstruits et une entrée `revisions` qui dit l'approbation en attente. Son manifeste n'a pas été touché avant l'approbation de l'opérateur (ci-dessous).
- **`tests/sheet-clean.test.mjs`** : chaque feuille de personnage approuvée en production (39), chaque image : alpha binaire, anneau transparent, figure non vide, remplissage de sa boîte au plus 0,9, aucune arête droite de la moitié de la case ; puis le garde de la chaîne sur `cut` de Marek (l'ancienne isolation : le coin refusé ; la nouvelle : accepté). Contrôle négatif : sur l'export de `main`, le test échoue sur `strike.1` seul (remplissage 95 %, arête de 165 texels).

### Preuves
- Avant / après dans le duel, de nuit et à midi, l'image jouée par le duel lui-même (captures déterministes, `HOLD=1`, `FREEZE_CSS=1`) : le rectangle gris, puis Marek seul sur les pavés.
- 0 px (`tools/diff.mjs`, écart maximal 0) entre avant et après : la ville de nuit (`seed=1842&intro=0`) et à midi, déterministes (`detshots`) ; l'arène par défaut (`?scene=arena`) ; le duel de la version 2 contre Vessa ; le duel contre Marek sur une autre image (`impact`).
- `arena-sheet-proof.mjs` : les sept rivaux OK de nuit, Marek OK à midi (25 de ses 32 images montrées, aucune image hors de la feuille) ; contre-épreuve `--q=cast=generated` : FAIL, comme il se doit.
- `npm run typecheck`, `npm test` 394 sur 394, `npm run build`, `npm run art:validate` (61 manifestes, 85 sources archivées, 0 erreur ; 22 manifestes de son).

### L'approbation — [OK]
- Montré à l'opérateur : l'image seule avant / après sur fond vert (×3), et le duel avant / après de nuit et à midi (`screenshots/calibration/sprite-alpha-SA1/`). Sa réponse, mot pour mot : « Approuver en production ».
- Consignée dans le manifeste de `marek-x3-combat` (`approval`, daté du 2026-11-04, l'approbation de la Passe CX2 citée à sa suite, et `notes`) et dans son pack (une seconde entrée d'`approvals` ; `revisions` dit l'approbation à la place de l'attente). La branche est fusionnée dans `main`.

### Limites
- La règle du test (remplissage, arête droite) attrape un fond resté en bloc ; un fond resté en mince bande contre la silhouette ne la franchirait pas : c'est le garde de la chaîne qui le refuse à la source.

### Où reprendre
- Rien de neuf. Les bouts de lame détachés de Ren, si l'opérateur les veut repris.

### Pensée
- Deux étapes d'une chaîne qui lisent deux boîtes différentes se trompent dans la marge entre les deux : ce qu'une étape nettoie doit couvrir ce que la suivante lit, et l'hypothèse « le coin est le fond » se vérifie là où elle est faite.
- Un contrôle d'export (alpha binaire, anneau transparent) ne voit pas un fond devenu opaque et connexe à la figure : il faut une mesure de forme (remplissage, arête droite) et un regard sur fond contrasté.

## Passe SN18 — Lot S2, fiche d'écoute : les lieux, la météo, l'interface et les pas (2026-11-04)

### Demande
- Le lot S2, confié par la séance mère « à lancer une fois le lot S3 fusionné » : la météo (pluie, neige, orage, vent, et la pluie du jour pluvieux), les ambiances des lieux (`ambienceOf` : ville, parvis, lices, place de la halle) et les sons définitifs de l'interface (`click`, `open`, `coin`, `denied`), plus les pas que le plan d'audit range dans S2. La foule par le code d'abord (SA-11c « Code d’abord, CC0 en complément »), les instruments, les tonalités et la couleur du groupe (F-SUITE), une fiche d'écoute avec des rendus du vrai moteur, puis n'appliquer que ce qui est décidé.
- Vérifié avant de commencer : le premier appel de cette séance a trouvé S3 non fusionné (`claude/sound-combats` au commit de `main`, la séance S3 au travail) et s'est arrêté. La séance S3 a ensuite écrit que S3 était clos sur `main` (`0e2c0ab`, Passe SN17, S3E-SUITE « Lancer S2 ») ; la branche a été mise à jour sur `0e2c0ab` avant tout travail.

### Ce qu'il y avait
- Les ambiances de l'audit : dans chaque lieu, une nappe de vent, d'eau et de « foule » en bruit filtré, des appels d'oscillateurs (marteau, oiseaux, grillons, cri, luth). La météo se voit et ne s'entend pas. L'interface et les pas sont les recettes du lot S0.
- Mesuré sur `main` (`render.mjs`, `analyse.mjs --check`) : les ambiances à −24,2 LUFS de jour et −25,3 la nuit, la musique à −20,0 / −20,2, soit 4,0 à 5,2 dB d'écart ; toutes les vérifications passent.
- **Le poids** : 12 280 918 octets en Opus après S3, soit 301 994 octets (0,29 Mio) sous les 12 Mio par format de SA-17, alors que le plan d'audit prévoyait 3 Mo pour S2 (note de passation de S3).

### Fait — [OK], une proposition, rien dans `main`
- **Ce qui se calcule dans la page** : `src/audio/places.ts`, pur. Chaque recette prend sa graine (mulberry32, jamais `Math.random`) et rend ses échantillons au premier besoin, à la fréquence du contexte. On y trouve :
  - le crépitement de la pluie (gouttes sur la pierre, bulles dans les flaques), en boucle circulaire de 7 s ;
  - le feu des braseros (claquements, crépitement fin, souffle des flammes), en boucle de 9 s ;
  - le tonnerre en trois prises (proche, avec craquement ; moyen ; lointain), dont le roulement est écrit au quart de la fréquence ;
  - trois chants d'oiseaux (moineaux ; un merle sur ré, mi, sol, la, deux octaves au-dessus ; hirondelles), le grillon, la chouette ;
  - l'enclume, l'entraînement (bois, acier, mannequin), l'écurie, les bois du bateau ;
  - les pas sur les pavés et sur la terre.

  Rien de cela n'est cuit : 0 octet.
- **Ce qui est cuit, seulement dans la proposition** : `art-lab/audio/sfx/places.sfx.mjs`, avec les instruments du groupe et les voix de la foule de S3.
  - Le clic : une lame de marimba (la), trois touchers.
  - L'ouverture : le vibraphone à la quinte (ré, la) sur le piano électrique.
  - La bourse : des pièces et un éclat de vibraphone (mi).
  - Le murmure de la ville et des lices : seize voix plus proches, l'air d'une rue, boucle de 12 s.
  - Le refus reprend le son du duel de S3, sans fichier neuf.

  Encodés comme une cuisson : 120 608 octets en Opus, 132 472 en AAC. Le total en Opus serait de 12 401 526 octets (11,83 Mio).
- **La table des lieux** (`ambienceOf`, `src/audio/score.ts`) lit la météo de la page (`WeatherNow`).
  - Des nappes jouées en direct, avec des rafales tirées des nombres du moteur : le vent (et son sifflement quand il forcit), l'eau du canal en vagues, la fontaine, le sifflement de la pluie, les fanions.
  - Des boucles : le murmure, la foule de l'arène reprise plus loin pour le parvis et la halle, la pluie, le feu.
  - Des appels.
  - La pluie fait taire les oiseaux et baisser la foule. La neige étouffe (un passe-bas) et fait crisser les pas. L'orage tonne après chaque éclair. Le vent change le niveau du vent et des fanions.
  - Les niveaux (`BED_LEVEL`, `LOOP_LEVEL`, `CALL_LEVEL`, `STEP_LEVEL`, `UI_LEVEL`, `LEVEL`) sont posés sur la sortie du moteur : chaque ambiance à −24,4 LUFS de jour et −25,2 la nuit.
- **Le moteur** (`src/audio/Sound.ts`) :
  - les nappes, les boucles et les appels ;
  - les sons calculés gardés pour la page (`made`) ;
  - les prises cuites décodées une fois (`takesOf`) ; la banque du duel ne charge plus que ses familles ;
  - l'interface jouée par les sons cuits, chargés au premier geste, avec repli sur les recettes de S0 ;
  - les pas selon le sol du lieu ;
  - le tonnerre sur l'événement `cdt-flash`, avec un délai selon la force de l'éclair (`thunderOf`).
- **Les branchements** :
  - `src/atmosphere/Weather.ts` envoie `cdt-flash` à chaque éclair, sans tirage ni changement d'image ;
  - `playPlaza` et `playTown` passent la météo de la page au son ; la ville d'une partie v2 prend aussi la météo de l'adresse, comme les places ;
  - `hooks.ts` joue le refus quand le jeu refuse une action ;
  - `tools/audio/harness.js` passe la météo d'une scène.
- **Les outils** : `tools/audio/places-listen.mjs` et `places-jobs.page.js`.
  - Ils copient `src/` dans un dossier à part, y encodent les sons proposés et les entrées du catalogue, et rendent les extraits depuis cette copie puis depuis `main` figé.
  - Ils écrivent les MP3 de la fiche.
  - Rien n'entre dans `src/audio/baked`.
- `crowd.sfx.mjs` et `duel.sfx.mjs` exportent les fonctions que le murmure et l'interface reprennent. Leurs rendus ne changent pas : `bake-sfx.mjs --check`, voir Preuves.

### Mesures
- `analyse.mjs --check` sur le rendu complet de la proposition : tout passe.
  - Les pages avec leur musique sont entre −18,2 et −18,9 LUFS.
  - La musique est 4,2 à 5,1 dB au-dessus de l'ambiance.
  - Les répétitions des nappes sont sous 0,1.
  - Le clic, l'ouverture et la bourse sont à 4,6 / 4,3 / 4,8 dB au-dessus de la foule de l'arène, contre 6,9 / 7,0 / 6,9 aujourd'hui. Au premier rendu, l'ouverture et la bourse échouaient (2,0 et 2,7 dB) : la résonance du vibraphone allongeait le son et baissait sa moyenne. Les queues ont été raccourcies, ce qui a aussi allégé les fichiers de 25 Ko.
- Les sons d'interface sont au niveau d'aujourd'hui : clic −23,6 LUFS contre −24,6, ouverture −21,4 contre −21,8, bourse −19,9 contre −17,9, refus −28,2 contre −27,3.
- Une marche de 18 pas fait −30,2 LUFS sur les pavés et −30,3 sur la terre, contre −25,6 aujourd'hui, presque au niveau du lieu.
- Les extraits de météo : la pluie du jour pluvieux −25,6 LUFS, l'orage avec ses quatre éclairs −20,8, la neige −26,6, le coup de vent −21,7.
- Le coût de chaque son calculé au premier usage, dans Chrome headless sur cette machine :
  - moins de 7 ms pour les pas, les oiseaux, les grillons, l'enclume, l'entraînement, l'écurie et le bateau ;
  - 16 ms pour la chouette, 17 à 23 ms pour le feu ;
  - 17 à 41 ms pour chaque tonnerre (faits en arrière-plan, un à la fois, pendant l'orage) ;
  - 43 à 47 ms pour la pluie (au début d'une page sous la pluie).

### La fiche
- Page privée https://claude.ai/artifact/FwMeKdEirAksUFBe3pd5eq, source `briefs/fiche-son-lieux.html`. Les 24 extraits MP3 sont publiés avec la page, pas dans le dépôt.
- Quatorze cartes :
  - à l'oreille, sans recommandation : S2-VILLE, S2-PARVIS, S2-LICES, S2-HALLE, S2-PLUIE, S2-ORAGE, S2-NEIGE, S2-VENT, S2-INTERFACE, S2-PAS ;
  - S2-MELANGE, recommandé « Bien dosé » ;
  - S2-POIDS, recommandé « Calculer dans la page, cuire l’interface et le murmure (121 Ko) » ;
  - S2-FOULE, recommandé « Le code suffit » ;
  - S2-SUITE, recommandé « Cuire et brancher dans la version 2 ce qui est validé ».
- `decisions` relu vide à la publication. Vérifiée en local à 1 200 et 390 px avec le squelette du service reproduit : 24 lecteurs chargés, aucun débordement.

### Limites
- **Personne n'a écouté.** Je n'ai pas d'oreille : les niveaux, les crêtes et les spectrogrammes (vus sur la ville, l'orage, l'interface et les pas) attrapent les défauts grossiers, pas la justesse d'une pluie ou d'une foule.
- La proposition est sur la branche, pas dans `main`. La fusion attend la fiche : n'appliquer que ce qui est décidé.
- Pas encore faits, et à faire avec l'application : `hooks-proof` et `page-proof` sur un serveur DEV, `decode-proof` sur les fichiers cuits, un test des recettes (déterminisme, boucles circulaires, aucune valeur non finie) et de la table.
- Les coûts de la pluie, du tonnerre, du feu et de la chouette peuvent coûter une image : à étaler si la proposition est validée.

### Où reprendre
- Relire `decisions` quand l'opérateur dit la fiche remplie, consigner mot pour mot, n'agir que sur ce qui est décidé. Si S2-SUITE est validé :
  - cuire l'interface et le murmure sous manifeste (`bake-sfx.mjs`, familles `interface` et `lieux`) ;
  - étaler les calculs coûteux ;
  - écrire les tests ;
  - faire les preuves : `analyse --check`, `engine-proof`, `decode-proof`, `hooks-proof`, `page-proof` ;
  - fusionner, puis donner l'essai en jeu.

### Pensée
- Quand la marge ne permet plus de cuire, le partage se fait par ce qui demande vraiment le calcul hors ligne. Les instruments du groupe et les voix se cuisent. La pluie, le feu, un oiseau ou une enclume se calculent dans la page en quelques millisecondes, comme les textures.
- Une mesure de niveau moyennée sur la durée d'un son pénalise sa queue : un son d'interface qui résonne longtemps se lit plus faible qu'il ne s'entend. On raccourcit la queue plutôt que de monter le son.

