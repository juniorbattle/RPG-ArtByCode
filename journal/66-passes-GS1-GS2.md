# Journal de bord — archive : passes GS1, GS2 (2026-11-08)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-11-08 (Passe FT2) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe GS1 — Les couleurs de peau des six combattants génériques : masques de peau et variantes recolorées au rendu, comme les PNJ (2026-11-08)

### Demande
- Transmise par la séance mère (`local_94e3af37-…`). L'opérateur, mot pour mot : « J'aimerai avoir de la diversite de couleur des personnages generiques generes en utilisant aseprite pour faire ces corrections ( exactement comme nous avons fait avec les pnjs ) car les personnages combattants ont tous la meme couleur de peau ».
- Les six génériques (Aldric, Corra, Ambrose : Passes GA1 / GA2 ; Lucan, Piers, Kell : Passes GA3 / GA4), chacun une feuille de ville ×2 (le visage des portraits) et une feuille de combat ×3, en production derrière `flags.v2`. Aucun dessin neuf ; une variante n'entre en production qu'approuvée (manifeste, fiche d'arbitrages) ; le jeu par défaut et la version 2 inchangés tant que la fiche n'est pas relue. Branche `claude/generiques-peaux` (worktree à part : la séance du lot L3 travaille en parallèle).

### La méthode — celle des PNJ (Passes V0 à V3)
- Les PNJ n'ont pas été reteints dans Aseprite : un masque de matière, fonction pure de la feuille approuvée et de réglages consignés dans `variants.json`, choisit la peau ; un texel masqué prend la couleur de la rampe cible à son rang de luminance dans la plage de peau de sa feuille (la formule du shader) ; le fichier n'entre en production qu'approuvé, avec l'empreinte des masques de chaque feuille vérifiée au chargement. La feuille et son export ne changent pas. C'est la méthode reprise ici.
- **[KO] la propagation des PNJ** (depuis l'image de repos de chaque vue, à 3 texels) ne suit pas une feuille de combat : la tête et les mains s'y déplacent de dizaines de texels (un K.O. couché). Mesuré sur les douze feuilles : la peau partage ses teintes avec les cheveux (Kell, Lucan), le cuir et l'or du bâton (Corra, Piers) ; une règle HSV seule prend le pantalon crème de Kell et les cheveux blonds de Corra.
- **[OK] le masque par couleurs de palette** (`src/characters/FighterSkins.ts`) : la feuille de combat épingle la palette de sa feuille de ville (Passes CX1 / GA1), le masque s'écrit donc par couleur : `skin` (les couleurs qui sont de la peau partout), `shade` (celles que la peau partage, prises seulement entourées de peau, 4 voisins sur 8, deux passes, la règle de remplissage des PNJ), `minPart` (le plus petit groupe gardé : un reflet de peau dans les cheveux), `feet` (un groupe tout entier dans les dernières rangées de la figure est le reflet d'une botte), et par image `frames` (ces deux seuils à part pour les K.O.), `force` (un rectangle où une couleur `shade` compte comme peau sans ses voisins : un visage dans l'ombre) et `clear`. Jamais un contour (valeur < 0,25, la règle des PNJ), ni les cheveux, ni les vêtements.
- Une variante par combattant, fixée (`fixed`), comme les PNJ uniques ; la recoloration (la formule du shader, `recolor`) se fait une fois sur les texels au chargement de la feuille : la feuille de combat avant son liseré peint de nuit, le visage du portrait et du HUD sur l'image de face de la feuille de ville. Les rampes sont celles de peau approuvées pour les PNJ (`light`, `medium`, `tan`, `dark`, Passe V2), recopiées telles quelles dans `art-lab/characters/variants/fighters.json`, non approuvé.
- Aldric n'a aucune peau visible (casque fermé, gantelets) : pas de masque, aucune variante possible sans dessin neuf.

### La relecture des masques — une première critique à froid, puis les règles de groupe
- Un agent neuf, à froid, sur des planches d'audit (chaque image de ville et de combat, l'original à côté de la variante foncée, agrandie) : Kell propre ; défauts surtout chez Lucan (le bord clair du tabard et les pans crème pris pour de la peau sur presque toutes les images de combat), Piers (le manteau crème rayé, ses oreilles, ses mains et ses ombres de visage oubliées), Corra (des grains dans ses cheveux et sur son bâton au K.O., des bouches et des poings rayés), Ambrose (la flamme de sa lanterne une fois, le liseré orangé de son visage), Kell (l'anneau de sa boucle sur deux images). Vérifié sur les pixels avant de corriger : une teinte claire de peau sert aussi aux reflets des tissus crème, en combat seulement (la feuille de ville ne la partage pas).
- **[KO] le noyau seul** (`core` : un groupe ne compte que s'il contient une couleur propre à la peau) : Piers n'a aucune couleur propre à sa peau en combat. Gardé dans le code, testé, inutilisé.
- **[OK] quatre règles de groupe** (`FighterSkins.ts`), chacune absente = rien ne change :
  - `foreign` / `foreignShare` : un groupe bordé surtout d'une autre matière en est un reflet (Piers : son manteau crème ; Corra : ses cheveux, à 85 % — son visage est encadré de cheveux, à 60 % ses visages tombaient ; Ambrose : sa lanterne) ;
  - `near` : un groupe doit avoir un texel à quelques texels d'une couleur d'ancrage (Lucan : ses rouges vifs de cheveux) ;
  - `relative` : un groupe plus petit qu'une part du plus grand de l'image tombe (Lucan, dont la seule peau est le visage : 0,7) ; [KO] `near` seul ne suffisait pas, les rouges vifs de ses cheveux reviennent sur sa cape et son tabard ;
  - `force` ne prend plus que les couleurs `shade` (un premier essai, qui forçait tout texel non-contour, aurait pris les cheveux bleus de Piers).
- Corrections à la main, lues sur la grille de l'image (les « corrections dans Aseprite » des PNJ, Passe V3) : Lucan `skillOff.1` effacé (son visage caché par sa lame levée, comme `heavy.1`), Kell la boucle (`skillOff.0`, `skillSup.0`), Corra deux grains au K.O., Piers son visage et sa main au sol (`force`).
- Une seconde critique, par un autre agent neuf, sur les planches refaites : voir plus bas.

### Tests — fautes injectées
- `tests/fighter-skins.test.mjs`, 8 tests : les règles de couleur et de groupe sur des images construites, la recoloration contre un oracle écrit dans le test (la formule du shader : rampe sRGB filtrée en lumière linéaire), la porte (non approuvé : rien ; candidat : la variante demandée ; approuvé : l'empreinte exigée, puis la variante fixée, jamais celle d'une revue), le fichier (les rampes de peau des PNJ à l'identique, les six combattants et leurs deux feuilles), les vraies feuilles (de la peau sur chaque image qui en montre, les images où elle se cache nommées : Lucan `heavy.1` et `skillOff.1`, Corra `ko.2` ; jamais un contour), l'exécution (rien de recoloré tant que le fichier attend l'opérateur ; le crochet des portraits sur les six).
- Quinze fautes injectées une à une (un script Node, chaque fichier rendu à l'empreinte après chacune) : quinze attrapées. Une première série en manquait une (une variante de revue passée en production) : le test de la porte la couvre désormais.

### La seconde et la troisième critique à froid — [OK] en partie, réserves nommées
- Seconde critique (un agent neuf, mêmes planches refaites) : Kell et Lucan presque propres ; deux visages entiers oubliés (Lucan `heavy.1`, Piers `heavy.3`), des mains sur les armes (Corra, Ambrose, Piers), l'oreille de Piers. Causes vérifiées sur les pixels : l'ancrage `near` rejetait le visage de Lucan quand ses cheveux sont dans l'ombre (retiré : `relative` et `foreign` suffisent), `foreign` rejetait le visage de Piers contre son col (seuil 0,75) et les mains d'Ambrose sur le laiton de son bâton (sa liste réduite à la flamme de la lanterne) ; les mains de Corra et d'Ambrose se coupent en petits groupes (`minPart` 5 pour eux). [KO, annulé] Prendre les tons dorés de Piers comme peau prenait tous ses galons ; [KO, annulé] un rectangle `paint` sur la main ouverte de Kell (`hit.0`, peinte dans l'ombre avec les bruns de ses cheveux) prenait son brassard. `paint` (les « force » des PNJ : tout texel non-contour d'un rectangle) reste dans le code, testé, inutilisé.
- Troisième critique (un agent neuf) : **Lucan propre ; Kell propre** (ses oreilles de dos, 3 texels) ; **Ambrose et Corra** : quelques doigts ou une main restés clairs sur le bâton dans certaines images (4 à 20 texels) ; **Piers** : ses mains sur la lance en partie claires dans une quinzaine d'images, son oreille de profil et une joue partielle dans quatre images. Aucune autre matière reprise. Ces réserves sont sur la fiche, avec une carte qui propose la retouche à la main.

### L'outil Aseprite — [OK]
- `tools/art-lab/skin-aseprite.mjs` : pour chaque feuille, un document de revue `<id>-peaux.aseprite` monté par Aseprite en mode batch (un script Lua, comme `build-combat.mjs`) : les images et étiquettes de la feuille, le calque « original », un calque masqué par peau candidate, le « masque peau » en cyan. Chaque document relu par Aseprite (`--split-layers`) : le calque original identique à l'export, texel pour texel, sur les dix feuilles. Écrits dans `art-lab/characters/scratch/generic-skins/` du dossier principal (ignoré par git) pour l'opérateur. L'outil n'écrit jamais une source approuvée ni un export.
- La fenêtre Aseprite n'était pas ouverte pendant la séance (pont du port 9932 actif, `preflight` : « Aseprite is not attached ») : rien n'a été dessiné en direct ; les rectangles de correction se lisent sur la grille des images (outils hors dépôt) et se reportent dans `fighters.json`.

### Preuves — [OK]
- **Avant l'approbation, rien ne change** : le duel v2 contre chacun des six (`?scene=arena&v2=1&foe=<id>`, calme et K.O., `HOLD=1 FREEZE_CSS=1`) à 0 px contre `main` figé (`bc37056`, `git archive`, DEV `:5293`), douze captures sur douze ; témoin de répétition 0 px ; contrôle négatif `fighterskin=dark` contre Kell : 2 274 px, sur Kell et son visage du HUD seulement. Le dialogue de Mara (jeu par défaut) et celui de Kell (v2) : la bande du dialogue et son portrait identiques à `main` (les écarts de `play-shots`, qui n'est pas une preuve au pixel, restent dans la scène vivante au-dessus de la bande).
- **La variante suit partout** (DEV, `fighterskin=<rampe>`) : la feuille de combat dans le duel, le soir et à midi, le visage du HUD, le portrait du dialogue (captures de la fiche).
- `npm run typecheck`, `npm run build` (l'entrée garde sa taille, 220,04 ko : `portraits.ts` reçoit le crochet du visage), `npm run art:validate` (73 manifestes, 123 sources, 0 erreur), `npm test` 453 sur 454 : le seul échec est `tests/arena-day.test.mjs`, le chargeur SSR qui ne trouve pas `three` dans un worktree (Passes GA1, GA3, I2) ; la jonction qui le contournait a été refusée par le classifieur de permissions de la séance, le test sera relancé dans le dossier principal après la fusion.

### La fiche — publiée, rien de décidé
- Page privée https://claude.ai/artifact/Y9MB3fza2f6mcSBQidZnxB, source `briefs/fiche-generiques-peaux.html` (la page des fiches GA), dix images publiées avec elle (pas dans le dépôt) : pour chacun des cinq, la planche des peaux (l'original et les quatre peaux : le visage du portrait, la feuille de ville de face et de profil, six images de combat sur fond de nuit et de sable) et la planche du duel (le soir et à midi, avec le visage du HUD). Collection `decisions` relue vide à la publication.
- Huit cartes : GS-KELL « Foncée », GS-AMBROSE « Foncée », GS-PIERS « Hâlée », GS-CORRA « Moyenne », GS-LUCAN « Garder l’original » (recommandations, pour une distribution variée), GS-AL (Aldric, aucune peau visible : « Rien à changer »), GS-RET (les mains de Piers : « Retouche à part, Piers ensuite »), GS-PROD (« En production »).

### Où reprendre
- Relire `decisions` quand l'opérateur dit la fiche remplie, consigner mot pour mot ; inscrire dans `fighters.json` l'approbation (ses mots), la peau fixée de chacun (`variants` réduit à elle, `fixed` 1) et l'empreinte des masques de ses deux feuilles ; puis les preuves (le duel et le portrait sous la peau choisie, sans paramètre ; un défi joué de bout en bout ; le jeu par défaut à 0 px contre `main`, en DEV et sur les deux paquets), `AGENTS.md` (« Art production principle »), la fusion.

### Pensée
- Une palette partagée entre la peau et les tissus clairs se départage par le groupe (ce qui le borde, sa taille rapportée au plus grand, une couleur d'ancrage), pas par la couleur ; chaque règle se vérifie sur les images qu'elle fait tomber : `near` rejetait un visage aux cheveux dans l'ombre, `foreign` un visage contre un col.
- Trois critiques à froid successives ne disent pas la même chose : la première voit les erreurs de matière, la deuxième les oublis entiers, la troisième ce qui reste à l'échelle du jeu. Chaque constat se vérifie sur les pixels avant d'être corrigé (le visage de Lucan à `heavy.1`, dit caché en GA3, a été redessiné visible).

## Passe GS2 — La fiche des peaux relue : Kell et Ambrose en peau foncée en production derrière la version 2, Piers après sa retouche ; la branche fusionnée (2026-11-08)

### Les choix de l'opérateur, mot pour mot (huit sur huit, cliqués le 2026-11-08 entre 02 h 12 et 02 h 13 UTC, aucune note ; l'opérateur : « Fiche remplie »)
| Carte | Choix |
|---|---|
| GS-kell | « Foncée (dark) » |
| GS-ambrose | « Foncée (dark) » |
| GS-piers | « Hâlée (tan) » |
| GS-corra | « Garder l’original » |
| GS-lucan | « Garder l’original » |
| GS-AL | « Rien à changer » |
| GS-RET | « Retouche à part, Piers ensuite » |
| GS-PROD | « En production » |

- Sept choix suivent la recommandation ; GS-corra non (recommandé : « Moyenne (medium) »).

### Fait — [OK]
- `art-lab/characters/variants/fighters.json` approuvé (les choix cités, la demande de l'opérateur mot pour mot) : Kell et Ambrose `variants: ["dark"]`, `fixed: 1`, empreintes des masques (Kell `b9f287d0` ville, `299b3625` combat ; Ambrose `51e39815`, `0b356b6e`) ; Piers `variants: ["tan"]` sans `fixed`, `pending` (GS-RET) ; Corra, Lucan, Aldric sans variante. Notes ajoutées aux six manifestes de Kell, Ambrose et Piers (aucun paquet de provenance ne hache un manifeste).
- `tests/fighter-skins.test.mjs` : 10 tests (les choix de l'opérateur épinglés) ; quinze fautes injectées sur le fichier approuvé, quinze attrapées. `npm run typecheck`, `npm run art:validate` (0 erreur).
- Preuves (DEV, sans paramètre, contre `main` figé `bc37056`) : le duel v2 contre Kell et Ambrose change (eux et leur visage du HUD seulement, le soir et à midi) ; contre Aldric, Corra, Lucan et Piers, 0 px (calme, K.O., midi). Le portrait du dialogue de Kell suit la peau foncée.

### Le rejeu sur `main` — [OK]
- Pendant la fiche, `main` a avancé de cinq commits (lots L3 et L4, Passes EVL5 à EVL8, l'archive des Passes GA1 à GA4) ; seul `JOURNAL.md` se recoupait. Pour éviter un push forcé (Principes, Passes SN3 / SN5) : une branche neuve `claude/generiques-peaux-2` tirée d'`origin/main` (`96cd71e`), les quatre commits rejoués un à un, le journal de `main` recevant les passes GS (un script Node, CRLF gardé). Vérifié : les changements hors journal de la branche neuve sont identiques à l'octet à ceux de l'ancienne (`cmp` des deux diffs).

### Preuves après approbation, sur la base `96cd71e` — [OK]
- **Le défi joué** (`tools/challenge-flow.mjs`, DEV) contre Kell et Ambrose, gagné et perdu : tous les contrôles passent (chacun sur sa feuille, son visage dans le dialogue, Node rejoue à la même empreinte), et les empreintes sont celles de `main` figé : Kell `2e5b87945f89e57e` / `d0a062c63e4e82e8`, Ambrose `01b87391a8674b7e` / `ebad7ba4859e7e86` (la peau ne touche pas l'état du jeu). Sur le paquet de production, le défi gagné contre Kell passe, et sa capture du duel le montre en peau foncée, son visage du HUD aussi.
- **Le jeu par défaut, inchangé** : `detshots` (la ville de nuit et à midi, le mode jouable par défaut et v2 à l'ouverture) et l'arène (par défaut et v2 contre Marek, calme et K.O., `HOLD=1 FREEZE_CSS=1`) à 0 px contre `main` figé, en DEV (huit vues) ; témoin de répétition 0 px ; contrôle négatif (nuit contre midi) 94 %. Les deux paquets de production : 0 px sur huit vues ; l'entrée grandit d'un octet (220 045 contre 220 044 : le crochet du visage dans `portraits.ts`). [?] `foe=` est une page DEV compilée hors du paquet : la vue « Kell » du paquet montre Marek, ce n'est pas une preuve de la peau en production ; le défi joué en est une.
- Le duel v2 (DEV, sans paramètre) : Kell et Ambrose changent, eux et leur visage du HUD seulement ; Aldric, Corra, Lucan et Piers à 0 px (calme, K.O., midi).
- `npm run typecheck`, `npm run build`, `npm run art:validate` (73 manifestes, 0 erreur), `npm test` 482 sur 483 dans le worktree (`arena-day`, l'environnement), relancé dans le dossier principal après la fusion (ci-dessous).
- `AGENTS.md` : « Art production principle » (les variantes de peau des génériques, les choix de l'opérateur, `fighterskin=`) et « Commands » (les trois outils, le test).

### La fusion
- La branche `claude/generiques-peaux-2` (Passes GS1, GS2) est fusionnée en avance rapide dans `main` ; `main` est poussé ; les branches `claude/generiques-peaux` (remplacée par le rejeu) et `claude/generiques-peaux-2` supprimées, locales et distantes.

### Ce qui suit
- **GS-RET « Retouche à part, Piers ensuite »** : une tâche à part. Les mains de Piers sur sa lance (une quinzaine d'images), son oreille de profil et une joue partielle dans quatre images, par des rectangles relevés à la main (`force`, `clear`, `paint` par image dans `fighters.json`, lus sur ses documents Aseprite de revue), puis une fiche courte ; sa peau « Hâlée (tan) » s'appliquera alors (`fixed`, empreintes). Les doigts restés clairs d'Ambrose sur son bâton et la main ouverte de Kell au coup reçu peuvent passer dans la même retouche.

### Pensée
- Une demande « comme pour les PNJ » se lit dans ce qui a été fait pour eux (le journal, le code) : les PNJ n'ont pas été reteints, un masque approuvé avec ses empreintes l'a été ; c'est cela qui se reprend, et ce qui ne se transpose pas (la propagation) se dit et se remplace.
- Une page DEV compilée hors du paquet (`foe=`) donne un faux 0 px en production : la preuve en production passe par le chemin du joueur (le défi joué).
- Un script passé entre guillemets doubles au shell perd ses accents graves (substitution de commande) : un texte de journal s'écrit depuis un fichier.

