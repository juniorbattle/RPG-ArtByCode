# Journal de bord — archive : passes GA3, GA4 (2026-11-07 → 2026-11-08)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-11-08 (Passe EVL7) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe GA3 — Trois combattants génériques de plus, Lucan Rook, Piers Calloway et Kell Barrow : six feuilles candidates, leur place dans le jeu, la fiche de lot publiée (2026-11-07)

### Demande
- Transmise par la séance mère (`local_9c4ca758-…`) : faire les trois combattants que l'opérateur a retenus sur la fiche des génériques (Passe GA2) : GA-P1, GA-P2, GA-P3 « Oui, ainsi », GA-P4 « Une tâche à part, après celle-ci ». Les figures de la planche de tournoi a (`tournament-roster-casting-2026-10-18-a-original.png`) et leur rôle, tels que proposés et acceptés :
  - n° 08 « Swordmaster » → « Lucan Rook, the Red Blade » : battu par Marek en qualification, il s'entraîne devant la porte de l'arène le soir ; au parvis le soir ; profil de Marek ;
  - n° 09 « Spear Champion » → « Piers Calloway, of the Long Spear » : il garde les barges sur le quai le jour ; au quai le jour ; profil de Vessa ; sa lance depuis le texte (X4) ; réserve : ses cheveux bleus rappellent Cassius ;
  - n° 14 « Martial Artist » → « Kell Barrow, the Bare Fist » : il se bat pour quelques pièces sur les marches de la halle le matin ; à la place de la halle le matin ; profil de Tobin ; à mains nues.
- La recette des Passes GA1 / GA2, derrière `flags.v2`, le jeu par défaut inchangé. Branche `claude/generiques-plus`.

### Fait — [OK], tout `candidate` jusqu'à la fiche
1. **Trois planches propres** (une requête de deux variantes chacune, 0,39 $). Références : la planche PNJ 01-16, la planche propre du casting `casting-clear-2026-11-01-a`, la figure découpée de la planche de tournoi (agrandie ×2 au plus proche, hors dépôt). Retenues :
   - Lucan, variante 1 : elle garde la cuirasse d'acier de sa figure, la variante 2 la remplaçait par une tunique ;
   - Piers, variante 2 : le manteau crème de sa figure, l'autre le peignait blanc ;
   - Kell, variante 1 : des vues plus nettes.
   Archivées à l'octet : `lucan-clear-2026-11-07`, `piers-clear-2026-11-07`, `kell-clear-2026-11-07`.
2. **Trois feuilles de ville** `lucan-x2-v1`, `piers-x2-v1`, `kell-x2-v1` (`clearRig`, 12 images debout, 48 couleurs), à même échelle à côté de Ren, Marek, Vessa, Tobin, Cassius et Aldric. Les têtes, relues à la source :
   - Kell agrandie de 1,2 sur 83 rangs, comme Cassius et Tobin (23 texels de large sinon) ;
   - Lucan et Piers agrandies de 1,1 après la critique (84 texels de haut, « un peu petits », le portrait de Lucan sur son col) : 86 texels, le visage dans le cadrage du portrait comme pour le casting.
3. **Les planches de poses** (gpt-image-2), les invites de GA1 adaptées à chaque arme et au kit du rival emprunté : l'épée longue de Lucan et la lance de Piers depuis le texte (X4), Kell à mains nues (chaque coup est un poing).
   - Lucan : sept planches. Les planches a à d, puis trois reprises : e, Iron Gate de profil (la planche c la dessinait de face dans ses deux variantes) ; f et g, après la critique.
   - Piers : six planches, a à d, puis e et f après la critique.
   - Kell : quatre planches. Son kit, celui de Tobin, tient en trois (ni garde ni compétence de garde) ; d est une reprise faite après la critique.
4. **Trois feuilles de combat** (`rivalRig`) :
   - `lucan-x3-combat`, 32 images : kit de Marek (garde, Iron Fall, Iron Gate, Champion's Resolve) ;
   - `piers-x3-combat`, 34 images : kit de Vessa (garde, esquive, Quickblade Lunge, Brace, Tempo) ;
   - `kell-x3-combat`, 27 images : kit de Tobin (Wild Swing, Farmboy Grit).
   Hauteurs debout : Lucan 125, Piers 123, Kell 128. Pour Piers, 118 au départ, celle de Vessa : à 125, sa fente (le manteau et la lance à l'horizontale) dépasse la case de 192 texels. Chaque pas est réglé sur la hauteur d'une figure debout de sa planche, du haut des cheveux aux semelles (`stand`), puis relu à l'œil sur la feuille entière (la planche b de Piers corrigée de 305 à 292).
5. **Manifestes et paquets de provenance** des six feuilles : `candidate`, `runtimeUse: lab` ; rien dans le jeu ne les charge. Vues en DEV dans le duel par `?scene=arena&v2=1&fighterdensity=combat&foe=<id>`.
6. **Leur place dans le jeu**, derrière la version 2 :
   - `src/narrative/generics.ts` : leur profil, PV et dégâts « proposés » (Lucan 0,85 / 0,9 sur le profil du champion ; Piers et Kell 0,9 / 0,95) ;
   - `src/narrative/people.ts` : Lucan au parvis le soir, Piers au quai le matin et l'après-midi, Kell à la place de la halle le matin, `generic: true` ;
   - leurs répliques (`v2.line.lucan`, `.piers`, `.kell`) ;
   - le défi : `challengeable` les prend avec les génériques ;
   - une figure générée de l'arène en attendant leurs feuilles : `FOES.lucan = FOES.marek`, `FOES.piers = FOES.kell = FOES.vessa` ;
   - le joueur curieux du laboratoire les défie après les autres (`lab.ts`).
7. **`tools/challenge-flow.mjs`** : `[who]` accepte `lucan`, `piers`, `kell` ; en chemin vers le soir, le combat officiel du jour est gagné (comme le fait déjà la représaille) ; un combattant du quai est défié sans déplacement. **`AGENTS.md`** : le paramètre `[who]`.

### La critique à l'aveugle — puis les reprises
- Un agent neuf, à froid, avec : les figures d'origine, les feuilles de ville à côté du casting, les portraits, chaque image de combat sur fond de nuit et de jour, le duel la nuit et à midi.

| | Ville : propreté / fidélité / place | Combat : propreté / fidélité / proportions / poses | Nuit / midi | Verdict |
|---|---|---|---|---|
| Lucan | 9 / 8 / 7 | 7 / 8 / 7 / 7 | 8 / 8 | avec petites corrections |
| Piers | 9 / 7 / 7 | 6 / 8 / 5 / 6 | 6 / 8 | à reprendre, de façon ciblée |
| Kell | 9 / 8 / 9 | 9 / 8 / 9 / 7 | 8 / 8 | avec petites corrections |

- **Vérifié sur les pixels avant de corriger.** [KO] « La pointe de l'épée et le fer de lance coupés au bord de la case » : faux. La source dessine des pointes émoussées, et `place` pousse un corps trop long vers la droite jusqu'à ce que son pixel le plus à gauche touche la colonne 1. Le critique l'a reconnu à la revérification.
- **Corrigé, sur des planches de reprise :**
  - Lucan :
    - le coup reçu, l'épée pointée vers Ren, se lisait comme une estoc ;
    - son rétablissement ;
    - la levée du coup puissant (le visage caché) ;
    - l'étourdi et la victoire, avec l'épée à pleine longueur.
  - Piers :
    - sa taille ;
    - Tempo et l'atterrissage de l'esquive, lance couchée, se lisaient comme des attaques : la lance pointe désormais en haut ;
    - le rétablissement après un coup ;
    - le K.O. (la lance à plat sous lui faisait un bord droit de 101 texels, que la règle de `sheet-clean` refuse dès 96).
  - Kell :
    - la fin de son coup puissant, à genoux, avait la même boîte que le K.O. ;
    - la levée, les poings joints au-dessus de la tête, se lisait comme un étirement ;
    - la préparation du ralliement, les mains sur la tête, se lisait comme une douleur.
- **Revérifiées par le même critique** : Lucan 9/8/8 en ville, 8/8/8/7 en combat, nuit 8, midi 8, avec petites corrections ; Piers 9/7/8, 8/8/6/7, nuit 6, midi 8, avec petites corrections ; Kell 9/8/9, 9/8/9/9, nuit 8, midi 8, prêt. Il demandait encore deux choses :
  - le second coup reçu de Lucan : son accroupi se lisait comme l'élan du coup puissant ; repris debout, il recule l'épée levée (planche g) ;
  - le K.O. de Piers, la lance dressée à 35° depuis son dos : repris, la lance couchée derrière lui, et le bout qui dépassait des bottes masqué (`mask`) pour tenir dans la case (planche f).
  Ces deux dernières reprises n'ont pas repassé de critique.
- **Reste, en réserve sur la fiche** : la lance de Piers n'a pas une seule longueur. Sa partie visible va d'environ 120 texels (au repos, une partie de la hampe passe derrière le manteau) à 175 (à la victoire, il la tient droite, plus haute que lui). Deux reprises n'y ont rien fait : le générateur ne tient pas une longueur d'une planche à l'autre. Un masque côté talon trouerait le manteau dans la posture. La nuit, ses cheveux bleu nuit se fondent dans la porte. Sa ressemblance avec Cassius en portrait a sa carte.

### Défauts trouvés — [KO → corrigé]
- **Deux processus de `gen-image.mjs` à la fois corrompent son registre.** Chaque instance charge le registre, réserve, puis réécrit sa propre copie au règlement : lancées en parallèle (trois, puis neuf requêtes), les instances se sont écrasées. Résultats :
  - des requêtes payées restaient « pending » à leur pire estimation : Lucan comptait 4,08 $ au lieu de 1,23 $, et ses deux requêtes suivantes ont été refusées pour un faux dépassement du plafond ;
  - l'entrée de la planche propre de Kell avait disparu : 0,39 $ non comptés.

  Le registre des trois tâches est reconstruit depuis les fiches de provenance des images (chaque requête une fois, à son coût réel `fromUsage`, une note dans chaque entrée), la copie d'avant gardée hors dépôt ; ensuite, une seule requête à la fois. [?] L'outil n'a pas de verrou : carte GA3-S3.
- Iron Gate dessiné de face, la fente de Piers trop large pour la case, le K.O. de Piers au bord droit : voir plus haut.
- Mon script : des apostrophes non échappées dans `generics.ts` (typecheck rouge), corrigées à la main ; un premier essai de `challenge-flow` contre Kell, avant tout branchement, échoue comme attendu sur le visage et la feuille (le contrôle négatif).

### Le compte OpenAI de nouveau à sec, puis rechargé — [OK]
- La reprise de Kell : « HTTP 429: You have no credits remaining », deux fois, non facturé. Demandé à l'opérateur par la séance mère ; l'opérateur, mot pour mot : « compte recharge ».

### Coûts (registre de `gen-image.mjs`, plafond 5 $ par combattant)
| Combattant | Requêtes | Total |
|---|---|---|
| Lucan | 7 (planche propre, a à d, reprises e, f, g) | 3,32 $ |
| Piers | 6 (planche propre, a à d, reprises e, f) | 2,90 $ |
| Kell | 5 facturées (planche propre, a, b, c, reprise d) et deux 429 non facturés | 2,07 $ |

### Mesures — TournamentLab, graines 1 à 50
- **Contre `main` figé (`4c7cb9c`)**, au JSON près identiques : les règles classiques et dynamiques (diligent), et en v2 `idle` et `diligent`.
- **`curious` (v2)** : 54,9 % de combats gagnés, comme avant ; qualifié à 68 % (66 %) ; finaliste à 8 %. Il fait 7,9 défis par partie (7,1), dont 4,6 gagnés (3,8) : les trois nouveaux s'ajoutent à sa liste, après les autres.

### Tests — [OK]
- **`tests/v2-town.test.mjs`** : un test neuf pour les trois.
  - Chacun est à son lieu et à son heure, refusé aux autres heures et ailleurs, sur le profil de son rival avec ses nombres.
  - Il n'enseigne rien, la mise revient double, et le bot finit le duel v2.
  - Aucun des trois n'existe dans le jeu par défaut.
  - Quatre fautes injectées une à une, toutes attrapées : Kell aussi l'après-midi, Piers sur Orla, Lucan de jour, Lucan à pleine vie.
- **`tests/combat-cast.test.mjs`** : les trois feuilles de combat sont tenues au contrat de toute feuille (le kit du rival emprunté, la case, la palette de leur feuille de ville, leur paquet). Ce sont des candidates : ni approuvées ni chargées.
- La règle de `tests/sheet-clean.test.mjs` passe sur les six candidates : toutes propres. `build-character --check` et `build-combat --check` : les six se reconstruisent à l'identique.
- `npm test` 444 sur 444, `npm run typecheck`, `npm run build`, `npm run art:validate` (73 manifestes, 123 sources archivées, 0 erreur).
- `ui-text` : les dialogues de Lucan (parvis, le soir), de Piers (quai, le matin) et de Kell (halle, le matin), à 1 600 × 900 et 390 × 844 : six pages sur six, 16 et 14 px au plus petit.
- Environnement : une jonction `node_modules/three` vers le dossier principal (dossier ignoré, à défaire en fin de tâche), comme en GA1.

### Archive du journal
- Les passes EVL2 et EVL3 (branche `claude/l2-ville`, fusionnée) déplacées à l'octet dans `journal/60-passes-EVL2-EVL3.md` : le corps de l'archive est égal aux 21 806 octets retirés, chaque passe est dans un seul fichier, les fins de ligne CRLF sont gardées.

### La fiche — publiée, rien de décidé
- Page privée https://claude.ai/artifact/AnVwmX5TVwWNzM9ddzyoAT, source `briefs/fiche-generiques-plus.html` (la page de GA1), 24 images publiées avec elle (pas dans le dépôt).
- La collection `decisions` a été relue vide à la publication.
- Vérifiée en local avant : 10 cartes, 35 animations, les 26 images chargées, aucun débordement à 375 px.
- Dix cartes, chacune avec sa recommandation :
  - GA3-LU1 et GA3-LU2, GA3-PI1 et GA3-PI2, GA3-KE1 et GA3-KE2 : chaque feuille, « Production » ;
  - GA3-PI3, la ressemblance de Piers avec Cassius : « Garder (la figure fait foi) » ;
  - GA3-S1, le branchement : « Les six ensemble » ;
  - GA3-S2, leurs nombres : « Garder » ;
  - GA3-S3, le verrou du registre de `gen-image.mjs` : « Une tâche à part ».

### Où reprendre
- Relire `decisions` quand l'opérateur dit la fiche remplie, consigner mot pour mot. Passer en production ce qu'il approuve (manifestes, `GENERIC_FACES` dans `PlazaCast.ts`, `CombatCast.ts`, `tests/combat-cast.test.mjs` sans les candidats). Puis les preuves :
  - le jeu par défaut à 0 px contre `main` figé, en DEV et sur les deux paquets de production ;
  - `challenge-flow` gagné et perdu contre chacun, sous sa feuille ;
  - `arena-sheet-proof` ;
  - `play-flow` et `play-day`.
  Ensuite `AGENTS.md` (« Art production principle »), puis la fusion.

### Pensée
- Un constat de la critique se vérifie sur les pixels avant d'être corrigé : la « pointe coupée » était une pointe émoussée que la case poussait jusqu'à son bord.
- Le générateur ne tient pas la longueur d'une arme d'une planche à l'autre, même quand l'invite la fixe sur une figure de référence. Une arme longue (lance, bâton) le montre plus qu'une épée : mieux vaut la mesurer tôt et la dire sur la fiche que l'espérer d'une reprise.
- Un outil qui lit puis réécrit un fichier partagé ne se lance pas en parallèle sans verrou : la reconstruction est possible parce que chaque image garde sa propre fiche de provenance.

## Passe GA4 — La fiche des trois génériques de plus relue : dix sur dix, les six feuilles en production derrière la version 2, une note sur la diversité des couleurs de peau ; la branche fusionnée (2026-11-07 → 2026-11-08)

### Demande
- L'opérateur, mot pour mot : « Fiche remplie ». Relire `decisions` (https://claude.ai/artifact/AnVwmX5TVwWNzM9ddzyoAT, source `briefs/fiche-generiques-plus.html`), consigner mot pour mot, passer en production ce qu'il approuve, refaire les preuves, fusionner.

### Les choix de l'opérateur, mot pour mot (dix sur dix, cliqués le 2026-11-07 entre 23 h 56 et 23 h 57 UTC)
| Carte | Ce qu'elle demandait | Choix | Note de l'opérateur |
|---|---|---|---|
| GA3-LU1 | Lucan Rook, la feuille de ville | « Production » | « par contre je veux de la diversivite et non uniquement des personnages a la meme couleur de peau sinon oui je suis satisfait. » |
| GA3-LU2 | Lucan Rook, la feuille de combat ×3 | « Production » | — |
| GA3-PI1 | Piers Calloway, la feuille de ville | « Production » | — |
| GA3-PI2 | Piers Calloway, la feuille de combat ×3 | « Production » | — |
| GA3-PI3 | Piers et Cassius se ressemblent en portrait | « Garder (la figure fait foi) » | — |
| GA3-KE1 | Kell Barrow, la feuille de ville | « Production » | — |
| GA3-KE2 | Kell Barrow, la feuille de combat ×3 | « Production » | — |
| GA3-S1 | Le branchement | « Les six ensemble » | — |
| GA3-S2 | Leurs nombres de combat | « Garder » | — |
| GA3-S3 | Un verrou pour le registre de `gen-image.mjs` | « Une tâche à part » | — |

- Les dix choix suivent la recommandation de leur carte. La réserve sur la lance de Piers (GA3-PI2) est acceptée avec la feuille ; sa ressemblance avec Cassius est gardée (GA3-PI3).
- **La note sur GA3-LU1** ne retire pas l'approbation (« sinon oui je suis satisfait »). Elle vise la distribution : les combattants et les personnes faits jusqu'ici ont presque tous la même couleur de peau claire. Elle est consignée comme une direction pour les prochains personnages (« À reprendre ») : je ne l'ai pas appliquée aux feuilles approuvées, ce serait un dessin neuf sans son choix.

### Fait — [OK]
1. **Les six feuilles approuvées** : manifestes `approved: true`, `runtimeUse: production`, la carte de chacune et GA3-S1 cités ; paquets de provenance à jour (`approvals`) ; les vingt sources archivées passent « approuvées à travers leurs feuilles » (trois planches propres, dix-sept planches de poses).
2. **Branchées derrière la version 2** :
   - `src/arena/CombatCast.ts` : `lucan`, `piers`, `kell` dans ses quatre motifs ; un défi les montre sur leur feuille, sur les clips du rival qu'ils empruntent ;
   - `src/characters/PlazaCast.ts` : `GENERIC_FACES`, leurs visages dans les portraits d'une partie de la version 2 (dialogues, HUD du duel), sans place sur une place ;
   - la figure générée de l'arène (`FOES.lucan`, `.piers`, `.kell`) reste la place de repli de `cast=generated`.
3. `tests/combat-cast.test.mjs` (plus de candidats : les six en production, leurs visages dans `PlazaCast`), `tests/baked-cast.test.mjs` et `tests/stride.test.mjs` (leurs feuilles de ville hors du quartier et des marches) ; `tests/sheet-clean.test.mjs` mesure désormais les six.
4. `AGENTS.md` (« Art production principle »), `art-lab/characters/README.md`, `art-lab/characters/reference/README.md`.

### Tests — [OK]
- Trois fautes injectées une à une, toutes attrapées : Kell retiré du motif de `CombatCast`, Piers de `GENERIC_FACES`, Lucan sur le profil d'Ilse.
- `npm test` **444 sur 444**, `npm run typecheck`, `npm run build`, `npm run art:validate` (73 manifestes, 123 sources archivées, 0 erreur).

### Preuves — [OK]
- **Serveurs** (par `preview_start`) : la branche en DEV `:5271`, `main` figé (`git archive` de `4c7cb9c`) en DEV `:5272`, les deux paquets de production par `vite preview` `:5273` et `:5274`.
- **`challenge-flow`** (DEV) :
  - Lucan gagné et perdu : `05e60bcbb8b9956f`, `9f1537003e154edd` ;
  - Piers gagné et perdu : `c92f44fcdd643334`, `4f6900db0ab1712c` ;
  - Kell gagné et perdu : `6aa48e097071136b`, `d0a062c63e4e82e8`.

  Tous les contrôles passent : chacun sur sa feuille de production, son visage dans le dialogue, Node rejoue à la même empreinte. **Contrôle négatif** (Passe GA3, avant le branchement) : le défi à Kell échouait sur le visage et la feuille.
- **`arena-sheet-proof`** (DEV, `foe=<générique>`), la nuit (60 s) et à midi (20 s) : 0 image hors feuille, les visages cuits 32 × 32 dans le HUD. Images vues : Lucan 25 et 24 de ses 32 ; Piers 25 et 24 de 34 ; Kell 23 et 21 de 27. Contrôle négatif `--q=cast=generated` : 2 464 images hors feuille, FAIL.
- **Le jeu par défaut, inchangé** :
  - `detshots` à 0 px au seuil 0 contre `main` figé, sept vues : la ville de nuit et à midi ; le mode jouable par défaut à l'ouverture, avec la liste Q et Mara ; la ville d'une partie v2 à l'ouverture et avec la liste Q. Témoin de répétition à 0 px ; contrôle négatif (nuit contre midi) 97 % ;
  - l'arène par défaut et le duel v2 contre Marek, trois moments chacun, à 0 px (`HOLD=1 FREEZE_CSS=1`), témoin à 0 px.
- **Les paquets de production** :
  - les mêmes sept vues et l'arène (défaut et v2, calme et K.O.) à 0 px. Une exception lue puis expliquée : la ville de nuit du premier chargement de `main` diffère de 199 pixels dans le compteur « FPS / frame ms » du panneau de performance, une mesure vivante. `main` diffère de lui-même d'un chargement à l'autre (199 px) ; la branche contre `main` au chargement suivant : 0 px ; deux chargements de la branche : 0 px ;
  - l'entrée garde sa taille (220 044 octets) ; changent `CombatCast`, `PlazaCast`, `FighterArt`, les six feuilles et les morceaux qui les nomment.
- **Empreintes**, celles des Passes EVL1 à GA2 :
  - `play-flow` sur le paquet de production : par défaut `0025acce7a403773`, `V2=1` `cf669f2d59e33a8d` ;
  - `play-day` (DEV) : par défaut `6a942086a2616ab2`, `V2=1` `98f385cda8abd0e9`.
- **`ui-text`**, les trois dialogues avec leur visage, chacun à 1 600 × 900 et 390 × 844 : six pages sur six, 16 et 14 px au plus petit.
- **Vu sur les captures de `challenge-flow`** : le visage de Lucan dans son dialogue au parvis le soir, celui de Piers dans le HUD de son duel, Piers en garde sur le sable. L'outil photographie encore le fondu de l'écran de chargement sur certaines captures (déjà relevé en Passe GA2).

### La fusion
- La branche `claude/generiques-plus` (Passes GA3, GA4) est fusionnée en avance rapide dans `main` ; `main` est poussé, la branche supprimée, locale et distante.

### Ce qui suit
- **GA3-S3 « Une tâche à part »** : un verrou autour de la lecture et de l'écriture du registre de `gen-image.mjs`, avec son test.
- **La note sur la diversité** (GA3-LU1) : les prochains personnages (génériques, casting) avec des couleurs de peau variées, chacun sur le choix de l'opérateur. Les planches de référence du casting en montrent peu : il faudra les choisir ou les demander. Aucun dessin neuf sans lui demander.

### Pensée
- Une note écrite à côté d'une approbation se lit pour ce qu'elle demande : ici une direction pour la suite (« sinon oui je suis satisfait »), pas une reprise des feuilles approuvées.
- Une différence de pixels sur un paquet se lit avant d'accuser la branche : `main` contre lui-même la montrait aussi, c'était un compteur vivant.

