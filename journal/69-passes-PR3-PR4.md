# Journal de bord — archive : passes PR3, PR4 (2026-11-08)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-11-08 (Passe RS2) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe PR3 — Ren unique : peau hâlée, cheveux gris, cape ivoire, recolorés derrière la version 2 ; la fiche courte publiée, rien en production (2026-11-08)

### Demande
- L'opérateur, mot pour mot : « Do this task here: “Ren unique : peau hâlée, cheveux gris, cape ivoire” » (le lot décidé en Passe PR2). Branche `claude/ren-unique`, worktree `.claude/worktrees/ren-perso` (il trouve les `node_modules` du dossier principal en remontant l'arborescence : `npm run typecheck` et les tests tournent sans jonction).

### Fait — [OK], hors du jeu
- `src/characters/HeroLook.ts` (neuf, pur) : la carte des matières de Ren par image (1 peau, 2 cheveux, 3 cape). La peau par le masque par couleurs de palette de GS1 (`frameSkin`, ses trois couleurs propres et les teintes partagées entourées de peau) ; la cape par ses cinq bleus et son pli le plus sombre (`23263f`, valeur 0,247, compté malgré la règle du contour : `outline: true`) ; les cheveux, qui n'ont aucune couleur propre, par leurs bruns **dans le rectangle de tête de chaque image** (`head`), moins les rectangles `clear` (les yeux), plus `paint`. Les plages de clarté sont épinglées dans le fichier, une par matière sur les deux feuilles : le sprite de ville et le combattant prennent la même couleur pour le même texel. La porte comme en GS2 : rien tant que le fichier n'est pas approuvé, l'empreinte des cartes vérifiée au chargement ; un mode candidat pour la revue DEV.
- `art-lab/characters/variants/hero.json` (non approuvé) : la peau `tan` des PNJ (approuvée), deux rampes de cheveux (`grey` des PNJ, `silver` plus claire, à juger : la `grey` se lit anthracite, Passe PR2), la cape `ivory` (l'essai de PR1), le look `tan` / `silver` / `ivory`, les rectangles de tête des 99 images proposés par l'outil, les yeux des images de combat.
- `tools/art-lab/hero-look.mjs` (neuf) : `--suggest` (les rectangles des images qui n'en ont pas), `--ranges`, `--fingerprints` ; des planches de revue (l'original, les cartes, le look). Empreintes provisoires : ville `8b583c8d`, combat `d908565e`.
- Vu sur la première planche (repos de face et de dos) : peau, cheveux et cape propres en ville, la cape ivoire entière, plis compris.


### La suite de la passe — [OK], derrière la version 2, rien en production
1. **Les cartes relues image par image** (outil `--heads`, `--text`) et corrigées, avec les remarques de l'opérateur pendant le travail, mot pour mot : « il y a encore quelques imperfections mais on est sur la bonne voie », puis « encore des imperfections visibles...la peau proche des cheveux semble argente ». Règles ajoutées, chacune vérifiée sur les images qu'elle fait tomber :
   - `join` (combat, 4 texels) : le plus grand groupe de cheveux et les groupes proches de lui, sans chaîne. Un gant levé, la garde de l'épée, une sangle tombent. [KO → corrigé] À 2 texels, une pointe du sommet séparée par son contour tombait ; à 4, la garde de droite de `skillDef.1` revenait (rectangle à la main).
   - `rim` : un brun de contour (valeur sous 0,25) touchant les cheveux et pas la peau devient cheveux. Sans lui, un halo brun-rouge entourait les cheveux argent en ville.
   - **les plages de clarté sur les texels éclairés seulement** (`materialRanges`). [KO → corrigé] Le contour compté dans la plage tassait toute la chevelure en bas de la rampe : anthracite.
   - `skinFlood` (les deux feuilles) : la peau gagne ses teintes d'ombre depuis le visage (le bord du front, les joues, l'oreille). C'est la remarque de l'opérateur : ces teintes étaient prises pour des cheveux et passaient en argent.
   - `eyes` : la bande des yeux ne protège que leurs couleurs. Les iris et les cils de Ren sont peints avec des bruns de cheveux (`452825`, `4e2d28`, `733e2c`) : sans la bande, les yeux passaient en argent ; avec une bande qui protégeait tout, la frange restait brune au-dessus de l'œil.
   - la bouche et le fard (`a37e71`, `7d5e57`) retirés des couleurs de cheveux, le fard `b76d37` ajouté aux teintes de peau de la ville. [KO → corrigé] Le seuil de 3 texels contre les points de peau sur le cuir effaçait la peau du front, faite de groupes de 1 ou 2 texels : retiré en ville.
   - corrections à la main (`clear`), lues sur la grille : `strike.0`, `strike.1`, `heavy.1`, `skillDef.1`, `chargeHi.0`, `chargeHi.1` (poings, avant-bras, garde).
2. **La rampe des cheveux.** 86 % des texels de cheveux tombent dans le premier cinquième de leur plage, que quelques reflets très clairs étirent vers le haut. Le gris des PNJ y donne de l'anthracite. Deux rampes dessinées pour cette répartition : `steel` (acier, un gris moyen) et `silver` (argent). Le premier intervalle de chacune porte tout le modelé.
3. **Le branchement** (`src/characters/HeroLookCast.ts`) : la ville d'une partie v2 (`herolook=1`, posé par `playTown.ts` ; `App` charge le module à la demande), les places (`PlazaApp`), les portraits et la figure de l'équipement (`preloadPortraits` reçoit un `tone`), le duel (`CombatCast`, avant le liseré peint) et le visage du HUD (`bakedFaces`). Un crochet `tone` dans `BakedCast` (le même que celui de la séance des peaux des rivaux, non commitée : la seconde fusion rejouera). DEV : `herolook=candidate`, `herolook=<peau>.<cheveux>.<cape>`.
4. **L'outil** : `--lineup` (une rangée par look), `--text` (la carte d'une image sur sa grille), `--resuggest`, `--per=0`.

### Tests — [OK]
- `tests/hero-look.test.mjs`, 10 tests : la zone de tête, la bande des yeux, la règle de groupe (sans chaîne), le contour, le pli de la cape, la propagation de la peau, la recoloration contre un oracle écrit dans le test, la porte, le fichier (la peau `tan` des PNJ, la cape ivoire, une tête sur chaque image, les plages égales à celles des cartes), les vraies feuilles (peau, cheveux et cape sur chaque image, un contour changé seulement s'il est listé), le branchement (les seuls modules qui importent le look sont ceux de la version 2).
- **Quinze fautes injectées une à une** (un script hors dépôt, chaque fichier rendu et vérifié par SHA-256) : quinze attrapées. [KO → corrigé] « le contour pris à côté de la peau » passait d'abord : mon point de test était trop loin des cheveux pour que la règle l'atteigne en deux passes ; le test vise maintenant le texel qui touche les deux.
- `npm test` : 502 sur 505 dans le worktree avant les dernières corrections. [KO → corrigé] Deux tests de branchement existants échouaient : seul `CombatCast` peut nommer la feuille de combat (mon module et un commentaire la nommaient), et la ligne des portraits de `playTown.ts` est épinglée (Ren s'ajoute à la ligne suivante). Le troisième, `arena-day`, est l'échec connu du chargeur SSR dans un worktree (Passes GA1, GS1). Les fichiers touchés relancés ensuite : `hero-look`, `combat-sheet`, `plaza-cast`, `fighter-skins`, `baked-cast`, 46 sur 46. `npm run typecheck`, `npm run build` (le look dans son morceau, 12 Ko ; l'entrée 220,31 Ko contre 220,04).

### Preuves — [OK]
- **Serveurs** par `preview_start` : la branche en DEV (`:5301`), `main` figé (`git archive` de `6316327`) en DEV (`:5303`).
- **Avant l'approbation, rien ne change** : `detshots` à 0 px contre `main` figé : la ville de nuit et à midi, la partie par défaut, la ville v2 le matin et le soir ; `plaza-shots` à 0 px (le parvis à midi, le terrain d'entraînement au coucher du soleil) ; `arena-scene-shots` à 0 px (le duel v2 le soir, au K.O., à midi ; l'arène par défaut).
- **Contrôle négatif** (`herolook=candidate`) : les vues v2 changent, dans le rectangle de Ren (ville 7 371 à 11 867 px ; parvis 9 995 px ; duel 8 703 px : Ren, son reflet dans la flaque, son visage du HUD) ; la partie par défaut reste à 0 px.
- Captures de la fiche (DEV, déterministes) : la ville le matin, à midi et le soir, le parvis à midi, le terrain d'entraînement au coucher du soleil, la place de la halle la nuit, le duel à midi et la nuit ; l'original, l'acier et l'argent, côte à côte.

### La critique à froid — [OK] après corrections
- Un agent neuf, sur toutes les images (planches entières et gros plans). Combat « pas livrable », ville « les cheveux, la cape et les dos propres ; la gorge et la mâchoire à reprendre ». Ses planches dataient d'avant plusieurs corrections ; chaque constat vérifié sur l'état du moment.
- Justes et corrigés :
  - des mèches brunes coupées net par le rectangle de tête dans la chute et les K.O. : les planches en gros plan coupaient au rectangle et le cachaient. Remède : `grow`, les cheveux croissent hors du rectangle par leurs couleurs, 10 texels au plus, jamais à travers la peau ni une zone exclue ;
  - l'ombre du cou et de la gorge passée en gris, une bande de l'oreille au col en combat, une « barbiche » en ville : `neck`, une zone par image (sous la bouche, au bord arrière de la mâchoire en combat ; la gorge sous le menton et la joue éloignée de trois-quarts en ville), où les bruns des cheveux deviennent la peau à l'ombre. [KO → corrigé] Comptée dans la plage de la peau, cette ombre la descendait de 0,21 à 0,03 et le visage s'éclaircissait : elle est marquée à part (matière 4), recolorée comme la peau, hors de la plage ;
  - l'oreille grise : `e28a5a` et `da7447` ne servent qu'au visage sur la feuille de combat, comptées comme peau ;
  - l'iris gris (`hit.0`), la bouche, le fard : déjà corrigés.
- Restes nommés sur la fiche (carte PR3-RESTES) : des pointes de frange peintes dans les bruns des cils restent foncées sur l'œil ; les sourcils et cils bruns (voulu) ; quelques texels de peau sur le cuir passent au hâlé ; le contour bleu nuit de la cape reste. De profil, la mèche devant l'oreille devient grise avec un reflet clair : elle est dessinée ainsi.

### La fiche — publiée, rien de décidé
- Page privée https://claude.ai/artifact/5AaWY6E5fut3Ye3UTvnGXv, source `briefs/fiche-ren-look.html` (la page de la fiche PR1), onze images publiées avec elle (pas dans le dépôt). Collection `decisions` relue vide à la publication ; une image publiée relue, identique à l'octet (SHA-256).
- Six cartes : PR3-CHEVEUX (« Acier (gris moyen) » ; « Argent (plus clair) », « Anthracite (le gris des PNJ) ») ; PR3-PEAU (« Hâlée, comme montrée ») ; PR3-CAPE (« Ivoire, comme montrée ») ; PR3-MAREK, Ren et Marek tous deux gris au premier duel (« Bien ainsi ») ; PR3-RESTES (« En production maintenant, les corriger ensuite ») ; PR3-PROD (« En production »).
- Le fichier garde le look `silver` en attendant la carte PR3-CHEVEUX ; l'approbation y écrira la teinte choisie.

### Où reprendre
- Relire `decisions` quand l'opérateur dit la fiche remplie ; consigner mot pour mot (Passe PR4) ; inscrire dans `hero.json` l'approbation, la teinte de cheveux choisie et les empreintes des deux feuilles ; refaire les preuves après l'approbation (une partie v2 jouée et rejouée en Node, le jeu par défaut à 0 px en DEV et sur les deux paquets) ; `AGENTS.md` ; la fusion.

### Relevés hors de la tâche
- La séance des peaux des rivaux (`local_4fd30fe2-…`, branche `claude/rivaux-peaux`, commit `39aea75`) ajoute le même crochet `tone` à `BakedCast.ts` : convenu par message, elle fusionne la première et ce lot rejouera en gardant son crochet ; si cette fiche est relue avant, ce lot fusionne et le conflit se résout en gardant une seule déclaration.
- Le serveur de `main` figé a pris le port 5303 (5302 occupé).

### Pensée
- Une rampe se dessine pour la répartition des texels qu'elle reçoit : quand quelques reflets étirent la plage, toute une matière tient dans le premier intervalle, et c'est lui qui fait la teinte qu'on voit.
- Une matière qui n'a aucune couleur propre (les cheveux de Ren) se prend par une zone et des groupes ; chaque règle ajoutée se vérifie sur les images qu'elle fait tomber, et un contour pris avec elle ne doit pas étirer sa plage.
- Les yeux d'un sprite peuvent être peints avec les couleurs des cheveux : la bande qui les protège ne protège que leurs couleurs.

## Passe PR4 — La fiche du look relue : six sur six à la recommandation ; Ren hâlé, aux cheveux acier et à la cape ivoire en production derrière la version 2 ; la branche fusionnée (2026-11-08)

### Les choix de l'opérateur, mot pour mot (six sur six, cliqués le 2026-11-08 entre 14 h 21 et 14 h 22 UTC, aucune note ; l'opérateur : « Sheet filled »)
| Carte | Ce qu'elle demandait | Choix |
|---|---|---|
| PR3-CHEVEUX | La teinte des cheveux gris | « Acier (gris moyen) » |
| PR3-PEAU | La peau hâlée | « Hâlée, comme montrée » |
| PR3-CAPE | La cape ivoire | « Ivoire, comme montrée » |
| PR3-MAREK | Ren et Marek, deux têtes grises au premier duel | « Bien ainsi » |
| PR3-RESTES | Les imperfections restantes | « En production maintenant, les corriger ensuite » |
| PR3-PROD | Ren en production derrière la version 2 | « En production » |

- Les six choix suivent la recommandation de leur carte.

### Fait — [OK]
- `art-lab/characters/variants/hero.json` approuvé : `approved`, l'approbation et les six choix cités, le look `tan` / `steel` / `ivory`, les empreintes des cartes (`hero-x2-v4` `195fecaa`, la feuille de combat `f6213ce0`). Les rampes `grey` et `silver` restent dans le fichier, pour mémoire.
- `tests/hero-look.test.mjs` épingle les choix : le look, les rampes acier et ivoire telles que la fiche les montrait, l'approbation, les empreintes égales à celles des cartes, la production qui applique le look aux deux feuilles. 11 tests.
- `AGENTS.md` : « Art production principle » (le look de Ren, ses fichiers, son approbation), « Commands » (l'outil, le test), le paramètre `herolook`.

### Preuves après l'approbation — [OK]
- Serveurs par `preview_start` : la branche et `main` figé (`6316327`) en DEV (`:5301`, `:5302`), leurs paquets de production par `vite preview` (`:5306`, `:5307`).
- **Le jeu par défaut, inchangé** : en DEV, la ville de nuit et à midi, la partie par défaut, l'arène par défaut, à 0 px contre `main` figé ; sur les deux paquets, la ville de nuit et à midi et l'arène par défaut, à 0 px.
- **La version 2 sans paramètre** : la ville v2 (graine 1842, premier matin) change, Ren seul (11 691 px) ; elle égale à 0 px la revue de la fiche (`herolook=tan.steel.ivory`) : la production applique le look approuvé, exactement. Le duel v2 change, Ren, son reflet et son visage du HUD (8 563 px), en DEV comme sur les paquets.
- **Une partie v2 jouée et rejouée en Node** : `play-flow` `V2=1` (gagné) sur les deux paquets : `f3974c5eedc75e97` des deux côtés, aucune erreur de page ; `play-day` `V2=1` (DEV) sur la branche : tous les contrôles passent, Node rejoue à `456b834c7af247e4`, l'empreinte de la Passe EVL7 (le look ne touche pas l'état du jeu). La même série sur `main` figé a été arrêtée avec ses serveurs (limite d'usage) : comparaison faite contre l'empreinte consignée.
- `npm run typecheck`, `npm run art:validate` (0 erreur), `tests/hero-look.test.mjs` 11 sur 11.

### Le rejeu sur `main` — [OK]
- Interrompue par la limite d'usage au moment de fusionner : `main` avait avancé pendant la passe (`21c8822`, Passes FT1 / FT2), l'avance rapide n'était plus possible. Les cinq commits de `claude/ren-unique` sont rejoués sur `main` dans `claude/ren-unique-2`, sans réécrire la branche poussée.
- Conflits : le journal (les passes FT1 / FT2 et PR3 / PR4 gardées dans l'ordre de leur fusion, la ligne vide entre deux passes rétablie) ; `AGENTS.md`, la ligne des paramètres de la version 2, où les fanions (FT1) et `herolook` s'ajoutaient chacun à un autre endroit : les deux ajouts insérés à leur place. `src/ui/playPlaza.ts` et `src/world/PlazaApp.ts`, touchés des deux côtés, fusionnés par git sans conflit. Le code rejoué est celui de `claude/ren-unique` plus celui de FT1, rien d'autre (`git diff claude/ren-unique -- src tests tools art-lab` : les six fichiers de FT1 seulement).
- Validation sur le rejeu : `npm run typecheck` 0 erreur ; `npm run art:validate` 73 manifestes, 123 sources archivées, 23 manifestes du son, 0 erreur ; `npm test` 512 sur 513, le seul échec `tests/arena-day.test.mjs`, le chargeur SSR qui ne trouve pas `three` dans un worktree (Passes FT1, PR3 : il passe dans le dépôt principal) ; `npm run build` réussi, `HeroLookCast` son propre morceau (15,79 kB), l'entrée 220,31 kB.
- Une preuve de plus, sur les places où FT1 et ce lot se rencontrent (`PlazaApp`) : `tools/plaza-shots.mjs`, la branche en DEV (`:5301`), la place de la halle l'après-midi et les lices à midi, le look approuvé contre `herolook=-.-.-` (le Ren d'aujourd'hui) : au-delà de 2 niveaux, l'écart tient tout entier dans le cadre de Ren et de son ombre (3 803 px et 6 131 px) ; en dessous, la lumière de la cape ivoire diffusée par la post-production, sur le sol autour de lui. Deux captures du même état : 0 px.

### Archive du journal
- Les passes gardées dépassaient 60 Ko (67,9 Ko) après le rejeu : EVL9 et EVL10 (branche fusionnée) déplacées à l'octet dans `journal/67-passes-EVL9-EVL10.md`, la ligne ajoutée à l'index ; preuve faite par script : le corps archivé égale les octets retirés, le journal reconstruit égale l'original, chaque passe dans un seul fichier, CRLF partout. 48,7 Ko de passes gardées.

### La fusion
- La branche `claude/ren-unique-2` (Passes PR3, PR4 rejouées) est fusionnée en avance rapide dans `main` ; `main` est poussé ; `claude/ren-unique` et `claude/ren-unique-2` supprimées, locales et distantes (le contenu de la première est dans `main`). La séance des peaux des rivaux (`claude/rivaux-peaux`, non fusionnée) rejouera sur `main` : son crochet `tone` dans `BakedCast.ts` est le même que celui de ce lot (convenu par message, Passe PR3).

### Ce qui suit
- PR3-RESTES « En production maintenant, les corriger ensuite » : une retouche à la main, plus tard, si l'opérateur voit en jeu une pointe de frange foncée sur l'œil, un reflet hâlé sur le cuir ou le contour bleu nuit de la cape.
- L'essai en jeu de l'opérateur : `npm run dev`, puis `/?play=1&new=1&v2=1`.

### Pensée
- Une approbation se prouve par le chemin du joueur : la ville d'une partie v2 sans paramètre doit égaler, au pixel près, la revue que la fiche montrait ; le jeu par défaut doit rester à 0 px, en DEV et sur les paquets.
- Deux lots qui ajoutent chacun un paramètre à la même longue ligne d'`AGENTS.md` se rejouent en insérant chaque ajout à sa place, jamais en choisissant un côté ; un lot rejoué après un autre se prouve aussi là où leurs fichiers se croisent.

