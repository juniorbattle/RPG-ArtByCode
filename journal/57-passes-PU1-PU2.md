# Journal de bord — archive : passes PU1, PU2 (2026-11-04)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-11-05 (Passe EV2) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe PU1 — Le public des gradins de l'arène : état des lieux, prototype en citadins cuits approuvés, coût mesuré, fiche d'arbitrages (2026-11-04)

### Demande
- L'opérateur, mot pour mot, transmis par la séance mère : « il faudra travailler nos pnjs publics dans les gradins pendant le combat car ils sont encore concu en code generique ». Le brief : un état des lieux (fabrication, densité, animation, nombre, coût, ce qu'on en voit dans les trois cadrages, de jour et de nuit), une proposition faite de personnages tirés des feuilles déjà approuvées (jamais un design neuf), la façon d'obtenir une pose de spectateur sans inventer, la variété, la réaction aux moments du duel en accord avec la foule sonore de S3 / S5 (sans la modifier), le budget E24 ; une fiche d'arbitrages, puis attendre les choix avant de cuire ou d'approuver quoi que ce soit. Ne pas toucher à `src/combat` (une autre séance peut y travailler).
- Rappel : l'opérateur avait déjà choisi, en Passe AA1, AA1-4 « Les citadins cuits de la ville + variantes V1 » ; le travail attendait sa séance.

### État des lieux — [OK] mesuré
- **Fabrication** (`src/arena/ArenaScene.ts`, `src/arena/ArenaApp.ts`, `src/arena/FighterArt.ts`) : 25 spectateurs (graine 1842), sur les rangs 0 et 1 des gradins seulement, de 32° à 60° de chaque côté de la porte, 4 places tentées par segment de porte et 2 ailleurs, une sur deux gardée (tirage de l'arène). Ce sont les cinq archétypes de foule du générateur de la ville, peints à ×1 puis doublés dans des cases de 64 × 96, de face, repos et bouche ouverte (4 images chacun), échelle 0,62, teinte froide fixe [0,5 ; 0,56 ; 0,74] de jour comme de nuit. Acclamation : bouche ouverte et saut de 7 cm pendant 1,4 s, pour une part du public à chaque coup reçu (même paré), au K.O. et au break (`cheer`). Un pixel de figure ≈ 3 px en 1080p.
- **Coût** : aucun appel de dessin propre (l'appel instancié des combattants). Duel de la version 2 de nuit 9,80 ms GPU en 1080p, à midi 8,55 (tableau ci-dessous).
- **Ce qu'on en voit** (`tools/arena-scene-shots.mjs`, `HOLD=1`, `FREEZE_CSS=1`, 1920 × 1080, `?scene=arena&v2=1&clean=1`, nuit et `time=midday`, moments `calm`, `foeSkill` (la légère avancée de caméra quand l'adversaire prépare) et `ko`) : 21 des 25 dans le cadre de base, en haut à gauche et à droite, sur la crête des gradins ; à côté des feuilles de combat ×3, des poupées à grosse tête, mêmes vêtements, bleu pâle à midi. Le preset `charging` de la version 2 ne fait pas charger l'adversaire : `foeSkill` montre l'avancée.

### Le prototype — [OK], DEV seulement, rien de cuit ni d'approuvé
- **`src/lab/arenaCrowd.ts`** (`?crowdlab=town|plaza|mix`), atteint par un import dynamique gardé par `import.meta.env.DEV` dans `ArenaApp` (trois crochets : l'installation après les spectateurs, les événements, la mise à jour) : compilé hors de la version publiée, l'arène sans le paramètre inchangée.
  - Les feuilles passent la porte de production (`loadProductionCast` : manifeste approuvé, SHA-256 contre le dossier de provenance, fichier de variantes approuvé et empreintes de ses masques) ; seules leurs images de repos (12 par feuille) entrent dans un atlas à part (1024 × 384, 1,5 Mo), dessiné par un second `SpriteRenderer` au cadre de la ville (32 × 48), contour noir à 25 % de jour comme de nuit (règle S3b), gain de silhouette de l'arène, ombre des feuilles de combat (CX-L1 0,65 / CX-L2 1,3), protection de flou 0,35 comme aujourd'hui, échelle 0,62 × 0,9.
  - Places : `crowdseat=today` (les 25 de l'arène), `medium` (47 : les quatre rangs de 32° à 60°, une place tous les ~0,85 m, une sur trois vide), `dense` (88 : tous les ~0,55 m, une sur cinq vide), calculées par formule et hachage, sans tirage : la construction de l'arène n'est pas touchée.
  - Variété : la variante de chaque place par `variantOf` (sans tirage), une horloge de respiration par spectateur (décalée, ×0,85 à ×1,15), chaque aile tournée vers l'arène (la face des habitants est un trois-quarts tourné à gauche, `frontLeft` : l'aile gauche est retournée). `crowdvar=0` les originaux seuls.
  - `crowdsit=1` : chaque spectateur 42 cm plus bas, derrière la marche de son rang (une seule profondeur par sprite : la marche cache les jambes), assis sans image neuve.
  - `crowdreact=sound` : la réaction calquée sur `crowdOf` (`src/audio/sfx.ts`, lu, non modifié) : la clameur au K.O. (tous, 3 s de sauts), le sursaut au break (75 %, puis souffle retenu), l'acclamation sur les techniques de Ren (80 %), le « oh » sur les autres coups puissants touchés (45 %, un petit saut) ; absent = la règle d'aujourd'hui.
- **À l'écran** : 67 des 88 places dans le cadre de base ; ~72 px par mètre aux gradins en 1080p, un pixel de feuille ≈ 1,3 px (les passants du quartier en plan B : 0,65 à 1,68), une figure ~100 px.
- **Défaut trouvé et corrigé dans le prototype** : le hachage rendait des nombres négatifs (le `^=` de JavaScript est signé) ; une place tirait un habitant d'indice négatif et la page s'arrêtait ; `>>> 0` à la fin.

### Mesures GPU — [OK] sous la nuit B
`tools/perf.mjs`, Radeon 780M (adaptateur relevé), serveur DEV `:5194`, variantes entrelacées, quatre tours, 5 s chacune, témoin de contention ; le panneau navigateur de la séance fermé.

| Page | 1920 × 1080 (médiane propre) | 2560 × 1440 (min des tours) | Appels |
|---|---|---|---|
| Nuit B (`seed=1842&clean=1&camera=B`) | 10,33 (3/4) | 16,10 | 107 |
| Duel de nuit, aujourd'hui | 9,80 (4/4) | 14,94 | 92 |
| Duel de nuit, 25 places cuites | 9,42 (4/4) | — | 95 |
| Duel de nuit, 88 cuites debout | 9,62 (4/4) | 14,92 | 95 |
| Duel de nuit, 88 cuites assises | 9,65 (4/4) | 14,89 | 95 |
| Duel à midi, aujourd'hui | 8,55 (4/4) | 13,38 | 94 |
| Duel à midi, 88 cuites | 8,62 (4/4) | 12,80 | 97 |

- Le même duel varie de 1 à 2 ms d'un tour à l'autre (nuit : 8,88 à 10,50) ; tour par tour, la foule dense de nuit fait −0,93 / +0,95 / −0,18 / −0,31 ms, à midi +0,02 / +0,10 / +0,01 / +0,16 : l'écart ne se distingue pas du bruit, et tout reste sous la nuit B. Trois appels de plus (le second rendu de sprites). Processeur : `App.update` +0,2 à +0,3 ms par image pour 88 spectateurs (0,42 → 0,69 ms de nuit).
- **[?] 2560 × 1440** : un autre processus Chrome (pid 28384, pas une page de cette séance) a occupé 18 à 39 % de la 780M aux tours 3 et 4, et le tour 2 a un pic non signalé (22,90 pour la foule dense, 19,21 pour aujourd'hui) ; seul le tour 1 est sûr (nuit B 18,81 ; duel de nuit 14,94, dense 14,92, assis 14,89 ; midi 13,38, dense 12,80), d'où le minimum des tours dans le tableau. À refaire au calme avec la construction choisie.

### La fiche — publiée, rien de décidé
- Page privée https://claude.ai/artifact/SrsNyUPheNRHpLaSqNtPPY, source `briefs/fiche-public-gradins.html` (gabarit `fiche-arbitrages`, collection `decisions`, relue vide à la publication). Les 51 images (captures réduites à 1280 px et agrandis en JPEG, deux animations du K.O. de 16 images) sont publiées avec la page, pas dans le dépôt ; six images clés dans `screenshots/calibration/public-PU1/`. Vérifiée en local avec le squelette du service : 8 cartes, aucune image cassée, aucun débordement à 1 200 et 390 px.
- Un état des lieux (fabrication, coût, les trois cadrages de nuit et de midi, agrandis), le prototype et le tableau des coûts, puis huit cartes :
  - PU-1 la source, recommandé « Les cinq habitants du quartier, avec leurs variantes » (AA1-4, déjà approuvés ; les citadins des places sans variantes se répètent : deux marchands ambulants identiques côte à côte sur l'agrandi) ;
  - PU-2 la densité, recommandé « Dense : 88 places » ;
  - PU-3 la posture, recommandé « Debout » (assis derrière le parapet en alternative, sans image neuve) ;
  - PU-4 la variété, recommandé « Variantes, horloges décalées, ailes tournées vers l'arène » ;
  - PU-5 la réaction, recommandé « Calquée sur la foule sonore » ;
  - PU-6 une image bras levés, recommandé « Oui, par génération d'après les planches (tâche suivante, au plus 5 $) » (alternatives : le rig sans génération — les bras des habitants sont peints dans le torse, à redessiner pour chacun comme le marteau du forgeron — ou « Non : les sauts suffisent ») ;
  - PU-7 la portée, recommandé « Derrière la version 2 seulement » ;
  - PU-8 l'approbation, recommandé « Approuver : en production dans les gradins de la version 2, avec les choix de cette fiche ».

### Limites
- Rien n'est construit pour la production : le prototype est un outil de revue, en DEV. Les preuves de la construction (0 px de l'arène par défaut contre `main`, tests, `arena-scene-check`, `arena-sheet-proof`, perf au calme) viendront avec elle.
- Les animations de la fiche sont des captures pas à pas (0,1 s) du K.O. : pas le ressenti en jeu.
- Aucune image générée, aucun registre de génération ouvert.

### Où reprendre
- Relire `decisions` quand l'opérateur dit la fiche remplie, consigner ses choix mot pour mot ici et dans les dossiers de provenance des feuilles choisies, puis construire derrière la version 2 (ou ce qu'il décide) : le module de production à la place du labo, les tests, les preuves, la perf au calme, puis fusionner. Si PU-6 l'ouvre, la planche d'acclamation dans sa propre tâche.

### Pensée
- Une décision déjà prise (AA1-4) se retrouve avant d'en préparer une neuve : la fiche la rappelle et la complète au lieu de la reposer.
- Un prototype de revue qui charge des feuilles approuvées passe par la même porte que la production (manifeste, empreinte, masques) : l'image montrée est celle qui serait approuvée.
- Un hachage en JavaScript se termine par `>>> 0` : `^=` rend un entier signé, et un indice négatif ne se voit qu'à l'exécution.

## Passe PU2 — La fiche du public relue, huit sur huit : les cinq habitants dans les gradins de la version 2, en production (2026-11-04)

### Demande
- L'opérateur, mot pour mot : « Fiche remplie ». Relire `decisions` (https://claude.ai/artifact/SrsNyUPheNRHpLaSqNtPPY), consigner mot pour mot, construire ce qui est choisi, avec ses tests et ses preuves, puis fusionner (Passe PU1).

### Les choix de l'opérateur, mot pour mot (huit sur huit, sans note ; cliqués le 2026-11-05 entre 02 h 51 et 02 h 55 UTC)
| Carte | Ce qu'elle demandait | Choix |
|---|---|---|
| PU-1 | Qui s'assoit dans les gradins | « Les cinq habitants du quartier, avec leurs variantes » |
| PU-2 | Combien de spectateurs | « Dense : 88 places » |
| PU-3 | Debout, ou assis derrière le parapet | « Debout » |
| PU-4 | Pour que la foule ne se répète pas | « Variantes, horloges décalées, ailes tournées vers l’arène » |
| PU-5 | Quand la foule réagit | « Calquée sur la foule sonore » |
| PU-6 | Une image bras levés | « Non : les sauts suffisent » |
| PU-7 | Où ce public apparaît | « Derrière la version 2 seulement » |
| PU-8 | Les feuilles des habitants dans les gradins | « Approuver : en production dans les gradins de la version 2, avec les choix de cette fiche » |

Sept choix suivent la recommandation de leur carte ; PU-6 non (recommandé : la planche générée) : aucune image n'est générée, aucune tâche de planche d'acclamation n'est ouverte.

### Fait — [OK]
- **`src/arena/stands.ts`** (pur) : les 88 places (`standsSeats` : les quatre rangs, des tours de la porte à 60°, une place tous les ~0,55 m, une sur cinq vide, par hachage, sans tirage) ; qui s'assoit où (`seatOf`) ; les horloges de respiration (`breathRate`, `breathPhase`) ; les réactions (`reactionOf` = `crowdOf` de `src/audio/sfx.ts`, lu, non modifié ; `REACTION` : la clameur au K.O. à 100 % pendant 3 s, le sursaut au break à 75 % puis le souffle retenu, l'acclamation sur les techniques de Ren à 80 %, le « oh » sur les autres coups puissants touchés à 45 %) ; `takes`, `reactionPose`.
- **`src/arena/StandsCast.ts`**, chargé à la demande par un duel aux règles de la version 2 seulement (`?scene=arena&v2=1`, les combats d'une partie version 2) : les cinq feuilles par la porte de production de la ville (`loadProductionCast` : manifestes approuvés, SHA-256 contre leurs dossiers de provenance, fichier de variantes approuvé et empreintes de ses masques), leurs images de repos dans une texture à part (1024 × 384), un second rendu de sprites au cadre de la ville, le contour noir de S3b de jour et de nuit, l'ombre des feuilles de combat (CX-L1 / CX-L2), chaque aile tournée vers l'arène, une erreur si une feuille ou ses variantes manquent.
- **`src/arena/ArenaApp.ts`** : un duel de la version 2 installe le public (sauf `cast=generated`) et ne crée plus les spectateurs générés ; les événements du duel lui sont passés ; `__stats().stands`. **`src/arena/ArenaScene.ts`** : `TIER` et `TOWER_W` exportés, la même valeur (2,8 m) ; aucune géométrie ni aucun tirage ne change.
- **Le prototype de la fiche est retiré** (`src/lab/arenaCrowd.ts`, ses trois crochets DEV).
- **Défaut du prototype corrigé** : chaque place tirait son habitant seule, et le voyageur ne s'asseyait que 6 fois sur 88 (23 / 6 / 21 / 20 / 18), ce qui allait contre PU-4. Les places vont maintenant par blocs de cinq, chacun une permutation des cinq habitants par son hachage : 17 ou 18 places chacun, jamais deux fois le même dans un bloc. C'est la seule différence d'image avec les captures de la fiche (les mêmes places, les mêmes variantes par place).
- **L'approbation, mot pour mot** : une entrée `approvals` dans les dossiers de provenance des cinq habitants (la décision PU-8 et la portée : les sept autres choix, la même image, les mêmes variantes, les gradins d'un duel de la version 2), et une phrase dans la note de leurs manifestes. Les exports, leurs SHA-256 et le fichier de variantes ne changent pas.
- **`AGENTS.md`** : le public dans le principe de production de l'art, `cast=generated`, la liste des tests.

### Tests — [OK]
- `tests/arena-stands.test.mjs`, six tests : les 88 places contre la géométrie du mur, relue depuis leurs positions (angle, rayon, hauteur de leur rang, au moins 0,3 m entre voisins, chaque rang des deux ailes peuplé, aucun `Math.random`) ; les cinq habitants 17 ou 18 fois, les quinze apparences, les blocs de cinq tous différents, les horloges ; les réactions contre la liste de la décision écrite dans le test, puis sur tout un duel chargé (le script de `V2_SIM_HASH`) : à chaque événement la réaction est celle du son, et les quatre moments sont atteints ; les parts, les départs, les poses ; l'approbation dans les cinq dossiers et manifestes ; le câblage (un seul import dynamique, sous la garde v2 et `cast`, aucun import statique, le prototype absent).
- **Six fautes injectées une à une, toutes attrapées** : la part du sursaut, le « oh » oublié, les places tirées une à une, les places au-delà de 60°, `cast=generated` ignoré, des sauts trop hauts.

### Preuves
- **0 px contre `main` figé (`0d280c8`)**, captures déterministes (`HOLD=1`, `FREEZE_CSS=1`, 1920 × 1080) : l'arène par défaut de nuit, à midi et avec son HUD, et le duel de la version 2 avec `cast=generated`, chacun au calme, au K.O. et en charge ; quinze paires à 0 px (écart maximal 0) sur les serveurs DEV, témoin de répétition à 0 px. **Sur les paquets de production** (`vite build` de la branche et de `main`, servis par `vite preview`) : les mêmes pages à 0 px, et la ville de nuit et à midi (`detshots`) à 0 px sans panneau ; avec le panneau DEV, 151 px de texte de performance diffèrent, autant entre deux chargements de `main`. Le paquet se redécoupe (Banners et CombatSheets en morceaux à part) : ces captures en sont la preuve.
- **Contrôle négatif** : le duel de la version 2 de la branche contre celui de `main` diffère (8,3 % des pixels au calme, 11,4 % au K.O.).
- `tools/arena-scene-check.mjs "v2=1"` : PASS (l'empreinte du duel égale `V2_SIM_HASH`, aucune erreur, 96 rendus) ; sans paramètre : PASS (identique au prototype). `tools/arena-sheet-proof.mjs --secs=25` : les sept rivaux OK de nuit, Marek et Vessa OK à midi, aucune image hors des feuilles.
- `npm run typecheck`, `npm test` (410 sur 410), `npm run build`, `npm run art:validate` (61 manifestes, 85 sources, 23 manifestes du son, 0 erreur) ; le paquet ne contient plus le prototype.

### Le rejeu sur `main` — [OK]
- `main` a bougé pendant ce travail : les Passes CH1 et CH2 de la séance de la charge (`96a5741` : l'attaque puissante devient une compétence, `V2_SIM_HASH` change ; elles ont aussi archivé SA1 et SN18 dans `journal/54-passes-SA1-SN18.md`). Aucun fichier du public n'y est touché (`ArenaApp.ts`, `ArenaScene.ts`, `crowdOf`, les feuilles et leurs dossiers inchangés).
- PU1 et PU2 sont rejouées sur une branche neuve, `claude/public-gradins-r`, sans push forcé : PU1 par `cherry-pick` (le journal recomposé sur celui de `main`), PU2 avec ses fichiers et les trois modifications d'`AGENTS.md` réappliquées sur la version de `main`. L'ancienne branche `claude/public-gradins` (PU1 seule) est supprimée après la fusion.
- Refait contre `96a5741` : `npm test` 410 sur 410 (le duel chargé aux nouvelles règles atteint toujours les quatre réactions) ; 0 px de l'arène par défaut (nuit, midi, HUD) et du duel v2 `cast=generated` en DEV et sur les paquets de production, la ville de nuit et à midi à 0 px sur les paquets ; contrôle négatif : le duel v2 avec le public diffère (5,2 % des pixels au calme) ; `arena-scene-check "v2=1"` PASS sur le nouveau `V2_SIM_HASH`, sans paramètre PASS ; `arena-sheet-proof` les sept rivaux OK.
- Les mesures GPU ci-dessous sont prises sur la base `0d280c8` : les changements de la charge ne touchent pas au rendu.

### Mesures GPU — [OK] E24 tenu
`tools/perf.mjs`, Radeon 780M, quatre tours propres sur quatre à chaque série, le panneau navigateur fermé.
- **Sous la nuit B, tour par tour** (même série) : en 1920 × 1080, nuit B 9,85 ms, le duel de nuit de la version 2 avec le public 8,98, à midi 7,43 ; en 2560 × 1440, 17,46 / 14,86 / 13,56. Le duel de nuit reste sous la nuit B à chaque tour, de 0,6 à 2,1 ms en 1080p et de 1,7 à 2,6 ms en 1440p.
- **Avant / après exact** (le duel de la version 2 de `main` figé contre celui de la branche, entrelacés, 1080p) : de nuit 8,98 → 9,69 ms en médiane, écarts tour par tour +0,35 / +1,49 / −0,23 / +0,59, médiane des écarts +0,47 ms ; à midi 7,96 → 8,00, écarts +0,55 / +0,13 / +0,01 / +0,04. Trois appels de plus (95 contre 92 de nuit, 97 contre 94 à midi). Le coût du public se voit la nuit (les 21 lumières dans le shader des sprites, et les ombres de 88 spectateurs), pas le jour.
- La série `cast=generated` de cette passe change aussi les combattants (générés) : elle sert la comparaison à la nuit B, pas l'avant / après.

### Limites
- **Personne n'a encore vu ce public en jouant** : l'essai en jeu reste à l'opérateur (un duel d'une partie version 2, de nuit et de jour).
- Pistes si la nuit devait s'alléger un jour : les ombres des spectateurs (contact, lumières et lune, jusqu'à quatre quads chacun), que la distance rend presque invisibles ; non faites, l'image approuvée les a.
- Le calcul processeur du second rendu : +0,2 à +0,3 ms par image (Passe PU1).

### Le journal
- Avec cette passe, les passes gardées auraient dépassé 60 Ko. SN19 à SN22 sont archivées mot pour mot dans `journal/55-passes-SN19-SN22.md`, avec leur ligne d'index. Le déplacement est prouvé : le corps de l'archive est identique aux 31 213 octets retirés ; SN19, SN20, SN21 et SN22 n'existent chacune que dans ce fichier ; aucune fin de ligne seule (CRLF gardé).

### Où reprendre
- L'essai en jeu de l'opérateur. Rien d'autre d'ouvert de ce côté : PU-6 ferme la planche d'acclamation.

### Pensée
- Un prototype de revue se relit avant de devenir production : un tirage indépendant par place, invisible sur une capture, laissait un habitant sur cinq presque absent ; le test d'équilibre l'a vu, pas l'œil.
- Un paramètre « de comparaison » peut changer plus qu'on ne croit (`cast=generated` rend aussi les combattants générés) : l'avant / après d'un coût se mesure contre la base figée, à paramètres égaux.

