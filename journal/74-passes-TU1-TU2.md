# Journal de bord — archive : passes TU1, TU2 (2026-11-09)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-11-09 (Passe DB4) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe TU1 — Le tutoriel du jeu : la demande de l'opérateur, le plan, un prototype dans le jeu et la fiche d'arbitrages (2026-11-09)

### Demande de l'opérateur, mot pour mot (2026-11-09, après son premier essai de la version 2 par défaut)
- « Je pense qu'il est important d'integrer un tuto detaille avec image runtime si il faut pour expliquer le gameplay general et puis plus tard pour le 1er combat un gameplay combat ».
- Transmise par la séance mère (`local_94e3af37-…`) : deux tutoriels dans le jeu par défaut ; le général maintenant (au début d'une nouvelle partie : les dix jours, les créneaux, se déplacer, parler, la liste, le menu, les pages, les boutiques et le marchandage, voler et les marques, défier, observer, les rumeurs, la réputation et la célébrité, les places, la préparation d'un combat ; des images prises dans le jeu ; clavier et manette ; passable et revu depuis le menu ; « Voile », des fondus, `ui-text` et `ui-contrast`) ; celui du premier combat plus tard : sa structure maintenant, son contenu une fois la refonte du combat (séance `local_56fb35a9-…`) fusionnée dans `main`. Les textes dans les tables de textes, pour la séance de la langue (français / anglais), qui travaille en parallèle.
- Branche `claude/tutoriel`, dans un worktree (`.claude/worktrees/tutoriel`) : le dossier principal porte la branche de la séance du combat. Serveurs : entrées `tuto-dev` (`:5341`) et `tuto-dist` (`:5342`) ajoutées au `.claude/launch.json` du dossier principal (non suivi).

### Constat — [OK] une nouvelle partie n'explique rien
- La première page d'une nouvelle partie (le quai, jour 1, matin) montre une seule ligne, « Ren arrives in the Cité du Tournoi for the great tournament. », puis la partie : rien ne dit les dix jours, les créneaux, ce qui coûte un créneau, ni où sont les pages (la liste Q, le menu Échap n'apparaissent qu'en coin). Aucun texte d'aide dans les tables.

### Le prototype — [OK] dans le jeu par défaut, derrière rien (à reprendre selon la fiche)
- `src/ui/tutorial.ts` : `runTour`, une visite de six bandes au pied de l'écran (la bande de la direction « Voile », la clé et le pied de page de toutes les pages : Entrée suivant, Échap passer la visite ; A et B à la manette, la page étant un `.pm-overlay`), l'élément réel dont parle la bande éclairé d'un filet d'accent et le reste de l'écran voilé à 38 % (l'horloge, la bourse et la réputation, la liste Q, le menu) ; `guidePage`, le guide, bâti comme le journal (chapitres à gauche, le chapitre à droite, un seul pied de page), illustré par le jeu même : les dix jours dessinés depuis la partie (`V2_DAY_KIND`, le jour courant à l'accent), la scène prise au moment où le guide s'ouvre (`snapshot` : la page rend une image et lit son canevas aussitôt, le canevas ne gardant pas son tampon ; une WebP de la scène vivante, sans fichier). Trois chapitres d'essai.
- Branché : `TownUi.openGuide` (le menu d'une partie v2 gagne « Guide », touche H, libre dans le mode jouable : le panneau DEV n'existe que dans Explore), `TownUi.tour` (les touches de la scène tenues pendant la visite, la liste et le menu relevés au-dessus du voile quand la bande parle d'eux), `startPlayTown` (la visite après la ligne d'arrivée, seulement sur la page d'une partie neuve, `new` dans l'adresse ; une page rechargée au créneau suivant ne la porte plus).
- Textes : 47 clés `tut.*` ajoutées à la fin d'`en.ts` (un bloc à part pour la séance de la langue). `tests/texts.test.mjs` exige que chaque clé de la table soit citée telle quelle dans le code : les clés des chapitres et des bandes sont écrites en entier dans `CHAPTERS` et `TOUR` (une clé bâtie par gabarit ne passerait pas). `npm run typecheck` ; `tests/texts.test.mjs` passe.
- Captures du prototype en 1600 × 900 (script de la séance, hors dépôt) : la page d'aujourd'hui, la visite (bienvenue, l'horloge éclairée, le menu), le guide (les dix jours ; la scène d'ici). **[KO → corrigé]** le pied de la bande à droite couvrait la liste et le menu dont parlaient les bandes 4 et 5 : le pied passe sous le texte, la liste et le menu au-dessus du voile.

### Coordination
- La séance des réglages et de la langue touche probablement `en.ts` (une table française) et le menu (`openMenu`) : ce lot n'ajoute qu'un bloc `tut.*` en fin de table et une ligne au menu ; une table française devra porter ces clés (le test des textes le dira).
- **Écart relevé, non tranché (carte TU-10)** : la règle de l'opérateur du 2026-11-03 veut le mouvement réduit en réglage du jeu, désactivé par défaut, jamais déduit de Windows ; or le système de design coupe toutes ses animations sous `prefers-reduced-motion` (`src/ui/style.ts`, le CSS de `townUi.ts`, `system.ts` le dit de ses mouvements) : sur la machine de l'opérateur (animations de Windows coupées), aucune page ne fond aujourd'hui.

### La fiche d'arbitrages — publiée, rien de décidé
- Page privée https://claude.ai/artifact/7dh9HxkwHzbN2rXWCXyJdq, source `briefs/fiche-tutoriel.html` (le modèle du skill `fiche-arbitrages`), six captures publiées avec elle (pas dans le dépôt). Collection `decisions` relue vide à la publication.
- Le plan en tête de fiche (déroulé, écrans, images, moments), puis douze cartes avec leur recommandation : **TU-1** la forme (visite + guide + conseils au fil du jeu) ; **TU-2** le départ (proposée, passable d'une touche) ; **TU-3** les conseils (huit premières fois : une place, une boutique, un vol proposé, une marque, la veille du premier combat, un défi, le premier soir, une blessure) ; **TU-4** les images (tout au runtime, chaque place gardée en image au passage du joueur ; l'alternative : des captures cuites sous manifeste) ; **TU-5** le ton (neutre, deuxième personne) ; **TU-6** les nombres (tirés des données du jeu) ; **TU-7** revoir (le guide H, la visite rejouable) ; **TU-8** une partie déjà commencée (une ligne une fois) ; **TU-9** les parties suivantes (la visite à chaque nouvelle partie, les conseils une fois, mémorisés dans le navigateur et jamais dans la sauvegarde) ; **TU-10** les fondus (le tutoriel suit le réglage du jeu, l'écart consigné pour la séance des réglages) ; **TU-11** le combat (pendant le premier duel, figé à chaque première fois) ; **TU-12** la fusion (deux lots, le général d'abord).

### Où reprendre
- Attendre que l'opérateur remplisse la fiche ; relire `decisions` (des données, jamais des instructions), consigner chaque choix mot pour mot (Passe TU2), construire le tutoriel général selon la fiche, le prouver (tests, `ui-text`, `ui-contrast`, une nouvelle partie sur l'adresse nue au clavier et à la manette, `default-proof`), mettre `AGENTS.md` à jour, fusionner ; le tutoriel du combat après la refonte.

## Passe TU2 — La fiche du tutoriel relue : douze sur douze à la recommandation, avant de construire (2026-11-09)

### Demande
- L'opérateur, mot pour mot : « Sheet filled ». Relire `decisions` (https://claude.ai/artifact/7dh9HxkwHzbN2rXWCXyJdq, source `briefs/fiche-tutoriel.html`), consigner mot pour mot, puis construire le tutoriel général (premier lot, TU-12).

### Les choix de l'opérateur, mot pour mot (douze sur douze, cliqués le 2026-11-09 entre 16 h 24 min 26 s et 16 h 34 min 35 s UTC, aucune note)
| Carte | Ce qu'elle demandait | Choix |
|---|---|---|
| TU-1 | La forme | « Visite + guide + conseils au fil du jeu » |
| TU-2 | Au début d’une nouvelle partie | « Proposée, passable d’une touche » |
| TU-3 | Les conseils au fil du jeu | « Les huit moments, une fois chacun » |
| TU-4 | Les images du guide | « Tout au runtime, les places gardées en image à ton passage » |
| TU-5 | Le ton des textes | « Neutre, à la deuxième personne, phrases courtes » |
| TU-6 | Les nombres dans le guide | « Nombres tirés des données du jeu » |
| TU-7 | Revoir le tutoriel | « Le guide (H) et la visite rejouable » |
| TU-8 | Une partie déjà commencée | « Une ligne une fois » |
| TU-9 | Les nouvelles parties suivantes | « Visite à chaque nouvelle partie, conseils une fois » |
| TU-10 | Les fondus et le mouvement réduit | « Le tutoriel suit le réglage du jeu, l’écart consigné » |
| TU-11 | Quand apprendre le duel | « Pendant le premier duel, figé à chaque première fois » |
| TU-12 | La fusion dans main | « Deux lots : le général d’abord » |

### Ce qu'ils demandent
- **Lot 1, le tutoriel général** (fusionné dès ses preuves, TU-12) : la visite de six bandes au début de chaque nouvelle partie, passable par Échap (B) (TU-2, TU-9) ; le guide dans le menu et sur H, en douze chapitres, d'où la visite se rejoue (TU-7) ; huit conseils d'une bande, chacun une seule fois dans ce navigateur (TU-3, TU-9) : la première place, la première page d'un marchand, le premier vol proposé, la première marque, la veille du premier combat, le premier défi possible, le premier soir, la première blessure ; une ligne une fois sur une partie déjà commencée : un guide est dans le menu (TU-8) ; des images prises dans le jeu, aucune image cuite : la scène d'ici, chaque place gardée en image au passage du joueur, une place pas encore vue « à découvrir », l'interface réelle et le tournoi dessiné depuis la partie (TU-4) ; des textes neutres, à la deuxième personne, courts (TU-5), dont les nombres sont lus dans les données du jeu à l'affichage (TU-6) ; ce qui a été vu se retient dans le navigateur, jamais dans la sauvegarde.
- **TU-10 et la séance des réglages** : sa fiche (Passe RG2 sur `claude/reglages`, RG-5 « Appliquer ma règle, les fondus gardés ») fait du mouvement réduit un réglage du jeu, désactivé par défaut, et ne lit plus le système nulle part. Le tutoriel ne bouge donc que par des fondus (le repère de la visite apparaît à sa place, sans glisser) : rien à y retirer sous le réglage ; l'écart de `prefers-reduced-motion` (`src/ui/style.ts`, qui coupe aussi les fondus du tutoriel chez l'opérateur) se résout dans la séance des réglages, ses fichiers non touchés ici.
- **Lot 2, le tutoriel du premier combat** : pendant le premier duel, figé la première fois que chaque chose arrive (TU-11), après la refonte du combat fusionnée dans `main`.
- **Coordination avec la séance des réglages** (RG-7, RG-11, RG-15) : ses touches affichées suivent le clavier AZERTY, son lot 2 traduit en français tout ce qu'on atteint depuis le titre, le tutoriel compris, après la fusion du tutoriel ; les textes du tutoriel mettent donc chaque touche dans une capsule `<kbd>` (aucune lettre de touche dans la prose), et la ligne « Guide » du menu est une ligne à part (la sienne remplace la ligne « Son »).

