# Journal de bord — archive : passes PR1, PR2, FT1, FT2 (2026-11-08)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-11-08 (Passe EVL12) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe PR1 — La personnalisation de Ren : atelier de conception, chaque axe classé par son coût, la fiche publiée (2026-11-08)

### Demande
- Transmise par la séance mère (`local_4c821720-…`). L'opérateur, mot pour mot (2026-11-08) : « pour le protagonist on va plutot adopter une personnalisation de personnage avec cheveux : coupe/couleur, couleur de peau et trait et peut etre meme type d'arme ». Ren a été retiré de la tâche des peaux des rivaux (séance `local_4fd30fe2-…`, branche `claude/rivaux-peaux`) au profit de cette personnalisation.
- La consigne : un atelier de conception, pas de code ; inventorier, classer chaque axe par son coût réel (recoloration, nouveaux dessins, arme), proposer un plan par lots, l'écran et la portée, puis une fiche d'arbitrages. Rien ne change dans le jeu avant la relecture.
- Lu d'abord : `JOURNAL.md` en entier, `AGENTS.md`, les trois contrats, `briefs/combat-system.md`, `briefs/cloud-session-v2-brief.md`, `briefs/roadmap-2026-10.md`, la Passe H4 (`journal/09-passes-H1-H4.md`). Branche `claude/ren-perso`, dans un worktree à part (`.claude/worktrees/ren-perso`) : les branches `claude/l5-ville` et `claude/rivaux-peaux` sont ouvertes par deux autres séances.

### Ce que disent les contrats et les décisions déjà prises — [OK]
- **Contrats** : aucun ne parle d'une création de personnage ni de l'apparence du héros. Le verrou 1 du contrat de gameplay (« Le joueur commence comme combattant individuel ») ne la gêne pas. Le contrat projet compte « armes » parmi les couches de progression (§ 7), sans verrou sur un choix de départ. Aucun verrou touché, aucun écart à consigner.
- **Passe H4 (19/10)** : l'opérateur avait déjà voulu « des declinaisons du protagonist afin de laisser le choix au joueur de choisir le personnage qu'il veut », et choisi « Une base + couleurs (Recommandé) » contre « Plusieurs coiffures dès le départ » et « Personnages distincts ». Une coupe au choix change cette décision : la carte PR-COUPE le dit.
- **L'arme** : la spécification du combat (§ 8, G4) porte la décision de l'opérateur « arme predefini avec amelioration (stats-effets) ». Un type d'arme au choix la change : la carte PR-ARME le dit. Les trois armes de la version 2 (`training-sword`, `imported-blade`, `duelist-sabre`, `src/simulation/gear.ts`) changent les chiffres de Ren, jamais son dessin.

### Inventaire — [OK]
- **Les feuilles de Ren** : `hero-x2-v4` (ville, 60 images : repos 4 et course 8 dans cinq orientations ; sert aussi au jeu par défaut et à « Explore the district ») et `hero-x3-combat` (duel, 39 images : les 34 de la liste CB-2 et les 5 poses de charge). Une seule palette de 64 couleurs pour les deux (la feuille de combat épingle celle de la ville). En ville, Ren ne montre pas son arme ; en combat, toutes les images la tiennent.
- **Les couleurs** (mesurées sur les deux exports) : trois couleurs sont de la peau seule (`fcc89f`, `f8ba8f`, `f6ad7a`) ; six autres teintes de peau servent aussi aux reflets des cheveux. Aucune couleur n'appartient aux cheveux seuls : leurs bruns sont ceux des gants, des sangles et des bottes (au plus 65 % d'une couleur dans la tête). La cape bleue (teinte 205-250°) ne partage ses couleurs avec rien.
- **Le jeu** : `newGame(seed, name)` ; « New game » de l'écran titre demande le nom (K2) et ouvre le jeu par défaut (`?play=1&new=1&name=…`) ; une partie v2 s'ouvre par `&v2=1` ; `PlayerState` n'a aucun champ d'apparence. Le visage des portraits et du HUD vient de l'image de face de la feuille de ville (`preloadPortraits`).
- **La méthode réutilisable** : les rampes approuvées des PNJ (`variants.json` : peau `light`, `medium`, `tan`, `dark` ; cheveux `dark`, `chestnut`, `auburn`, `ash`, `grey`), le masque par couleurs de palette et ses règles de groupe (`src/characters/FighterSkins.ts`, Passe GS1), le masque des cheveux des PNJ (`src/characters/Variants.ts`), les documents Aseprite de revue (`tools/art-lab/skin-aseprite.mjs`). La branche `claude/rivaux-peaux` n'a encore aucun commit : rien à reprendre d'elle aujourd'hui.

### Le coût de chaque axe
| Axe | Nature | Images à dessiner | D'où |
|---|---|---|---|
| Couleur de peau | recoloration au chargement | 0 | les rampes approuvées des PNJ |
| Couleur des cheveux | recoloration, masque par groupe (les bruns du cuir) | 0 ; corrections à la main des images aux bras levés et du K.O. | idem ; documents Aseprite de revue |
| Cape (hors demande) | recoloration, masque simple | 0 ; rampes neuves à approuver | — |
| Coupe | nouvelle forme | 99 par coupe (60 ville + 39 combat) | une planche de design validée par l'opérateur (outil de génération, moins de 1 $), puis des planches générées depuis les feuilles de Ren et reconstruites par ses rigs ; deux tâches de génération par coupe, chacune sous 5 $ |
| Traits du visage | yeux : recoloration (2-3 texels) ; marques : peintes à la main (environ 5 têtes en ville, jusqu'à 39 en combat) ; barbe : une forme, au coût d'une coupe | selon le sens | Aseprite à la main ; la barbe comme une coupe |
| Trait de caractère (autre lecture) | une règle du jeu | 0 | la spécification et le laboratoire |
| Type d'arme | 39 images de combat par arme, rien en ville ; ses règles si elle en a | 39 par arme | des planches générées comme celles de RC1 / RC2 (2,60 $ pour sept planches) ; les images des rivaux armés ne servent pas : elles montrent leur corps |

### Les aperçus — [OK], prototype hors dépôt
- Un script de cette séance (dossier temporaire de la séance, pas dans le dépôt) recolore les deux feuilles avec la formule du shader (`recolor` de `FighterSkins.ts`, rampes en lumière linéaire) et des masques prototypes : la peau par ses trois couleurs, plus les teintes partagées entourées de peau (4 voisins sur 8, deux passes) ; les cheveux par les teintes chaudes au-dessus du menton en ville, et en combat par le groupe qui touche le visage (le plus grand, ou un groupe d'au moins un quart de lui qui touche la peau, dans un cercle de 27 texels, l'or de la garde et les yeux exclus) ; la cape par sa teinte.
- **[KO → corrigé] trois fois sur les images de combat** : un gant levé pris pour des cheveux (règle du groupe), puis le haut des cheveux coupé par un cercle centré trop bas (le visage masqué n'est que le bas du visage), puis les yeux et les sourcils recolorés avec les cheveux (une bande au-dessus du visage exclue).
- **[?] limites montrées sur la fiche** : en combat, un reste de cheveux d'origine au front ; un gant levé encore pris dans une image aux bras au-dessus de la tête (`skillDef.1`, retirée des aperçus) ; le revers sombre de la cape en course garde son bleu ; des ombres bleues du pantalon prises pour la cape. La production passera par la méthode de GS1 : règles de groupe, corrections à la main, critiques à froid, documents Aseprite.
- Sept planches publiées avec la fiche (pas dans le dépôt) : les masques en ville et en combat, les cinq peaux, les six cheveux, cinq capes, six combinaisons en ville et en combat. Aucune image générée.

### La fiche — publiée, rien de décidé
- Page privée https://claude.ai/artifact/JjQFRHBVUx6qg993hh9E8E, source `briefs/fiche-ren-perso.html` (la page de la fiche GS1). Collection `decisions` relue vide à la publication ; une image publiée relue, identique à l'octet (SHA-256).
- Dix cartes : PR-PEAU (« Original + les quatre peaux des PNJ ») ; PR-CHEVCOUL (« Original + les cinq teintes des PNJ ») ; PR-ENSEMBLE (« Ça me va, premier lot ») ; PR-CAPE, hors demande (« Garder l’indigo ») ; PR-COUPE (« Plus tard : design d’abord, puis une coupe à la fois ») ; PR-TRAIT, le sens de « trait », sans recommandation (les traits du visage, barbe ou non ; un trait de caractère ; les deux) ; PR-ARME (« Atelier à part (règles d’abord), après les couleurs ») ; PR-ECRAN (« Une page après le nom, fixée pour la partie » : la structure de la page de l'équipement, Ren en grand qui tourne, une ligne par choix, la manette) ; PR-PORTEE (« Derrière flags.v2 ») ; PR-LOTS (« Valider ce plan » : lot 1 les couleurs et l'écran, lot 2 les coupes, lot 3 l'arme, chacun dans sa séance).

### Relevés hors de la tâche
- Les passes gardées font environ 72 500 octets, au-delà des 60 Ko. Je ne les archive pas ici : la séance du lot L5 (branche `claude/l5-ville`) archive les Passes I2 à EVL6 sur sa branche ; archiver les mêmes passes ici ferait deux archives concurrentes. La branche qui fusionnera la seconde rejouera son journal sur `main`.

### Où reprendre
- Relire `decisions` quand l'opérateur dit la fiche remplie, consigner ses choix mot pour mot (Passe PR2), lister les lots décidés comme tâches, chacun pour sa séance, puis fusionner la branche (le journal et la page de la fiche seulement).

### Pensée
- Une personnalisation se classe par ce qu'elle change dans les feuilles : une couleur ne touche aucune image, une forme les touche toutes. Le nombre d'images se compte sur les exports (60 + 39), pas sur la liste des animations.
- Une décision ancienne de l'opérateur (H4 « Une base + couleurs », G4 « arme predefini ») se retrouve avant de proposer : la nouvelle demande la change peut-être, et la fiche le dit au lieu de l'ignorer.
- Un mot qui se lit de deux façons (« trait ») va sur la fiche comme une question, sans recommandation.
- Un masque de cheveux sur une feuille de combat ne tient ni par la couleur ni par une seule règle : chaque règle ajoutée (le groupe, le cercle, la bande des yeux) se vérifie sur les images qu'elle fait tomber.

## Passe PR2 — La fiche relue : un Ren unique (peau hâlée, cheveux gris, cape ivoire) à la place de la personnalisation ; la branche fusionnée (2026-11-08)

### Demande
- L'opérateur, mot pour mot : « Fiche remplie mais avant d'implementer quoi que ce soit, je veux avoir ton avis si c'est judicieux de lancer cette tache car elle peut sembler energivore et cela reste un plus, on peut aussi juste s'attarder sur une seul et unique design et d'assurer que les couleurs sont optimales et definitifs, par defaut je veux que le personnage est une couleur mate de peau des cheveux  hâlée et gris  et une cape soit aesoiaw ou ivoire ».
- Relu `decisions` (https://claude.ai/artifact/JjQFRHBVUx6qg993hh9E8E, source `briefs/fiche-ren-perso.html`), donné mon avis, puis posé une question : « A single Ren (tan, grey hair) instead of the customisation: which cloak? ». Réponse de l'opérateur, mot pour mot : « Yes, ivory cloak ».

### Les choix de l'opérateur sur la fiche, mot pour mot (dix sur dix, cliqués le 2026-11-08 entre 05 h 19 et 05 h 23 UTC)
| Carte | Ce qu'elle demandait | Choix | Note |
|---|---|---|---|
| PR-PEAU | La couleur de peau de Ren | « Original + les quatre peaux des PNJ » | — |
| PR-CHEVCOUL | La couleur des cheveux | « Original + les cinq teintes des PNJ » | — |
| PR-ENSEMBLE | Peau et cheveux ensemble | « Ça me va, premier lot » | — |
| PR-CAPE | La couleur de la cape (hors demande) | « Garder l’indigo » | « j'aime bien la version ivoire » |
| PR-COUPE | La coupe de cheveux | « Plus tard : design d’abord, puis une coupe à la fois » | — |
| PR-TRAIT | Le sens de « trait » | « Les traits du visage (yeux, marques) » | — |
| PR-ARME | Le type d'arme | « Atelier à part (règles d’abord), après les couleurs » | — |
| PR-ECRAN | Où et quand le joueur choisit | « Une page après le nom, fixée pour la partie » | — |
| PR-PORTEE | Derrière la version 2 | « Derrière flags.v2 » | — |
| PR-LOTS | Le plan par lots | « Valider ce plan » | — |

- Neuf choix suivent la recommandation de leur carte ; PR-TRAIT n'en avait pas. La note de PR-CAPE contredit l'option cliquée : la décision était suspendue (Principes : « Une note qui contredit l'option cliquée suspend la décision »), et le message de l'opérateur l'a tranchée (la cape ivoire).
- Lecture du message : « une couleur mate de peau » = la peau hâlée (rampe `tan`) ; « des cheveux […] gris » = la rampe `grey` ; « aesoiaw » est lu « ardoise » (l'essai de la carte PR-CAPE) ; la réponse « Yes, ivory cloak » rend cette lecture sans effet.

### Mon avis, donné avant la décision — [OK]
- **Réduire est judicieux.** Le lot 1 complet (trente combinaisons, la page de création, le choix dans la sauvegarde, la recoloration partout, les preuves d'une partie jouée) est la part lourde ; les coupes (99 images chacune) et l'arme (39 images, peut-être des règles) le sont davantage. Un look unique coûte à peu près le tiers du lot 1 : une variante fixée par masque, la méthode des génériques (Passe GS2), sans page ni champ de sauvegarde. Rien n'est perdu : les masques d'un Ren unique sont ceux qu'une personnalisation reprendrait. Les feuilles approuvées ne changent pas ; une retouche va dans le fichier des masques.
- **Les aperçus** (le même prototype qu'en PR1, hors dépôt ; deux planches envoyées à l'opérateur : en ville et en duel, Ren d'aujourd'hui, puis hâlé et gris avec la cape ardoise, puis avec la cape ivoire) : avec l'ardoise, la figure devient grise de haut en bas et la tête se perd dans la capuche ; avec l'ivoire, les cheveux gris se détachent et la silhouette se lit mieux, surtout la nuit. Réserves : de face, le torse crème se fond un peu dans la cape ; à midi, l'ivoire peut pâlir sur le sable de l'arène. L'ivoire fait partie de la palette verrouillée (« desaturated ivory »).
- **[?] Le gris des cheveux** se lit anthracite plutôt qu'argent à la taille du jeu, avec la rampe `grey` des PNJ : des couleurs « optimales et définitives » demandent de régler les rampes (cheveux, cape) dans le jeu, aux quatre moments de la journée, avant l'approbation.

### La décision
- **Un Ren unique, derrière la version 2** : peau hâlée (rampe `tan` des PNJ, approuvée), cheveux gris (rampe `grey`, à régler en jeu pour qu'ils se lisent argent), cape ivoire (rampe à écrire et à faire approuver ; l'essai de PR1 sert de départ). Variante fixée, recolorée au chargement sur `hero-x2-v4` et `hero-x3-combat` (la ville d'une partie v2, les places, les portraits et le HUD, le duel) ; les feuilles et leurs exports inchangés ; le jeu par défaut et « Explore the district » gardent le Ren d'aujourd'hui (PR-PORTEE ; le district est gelé).
- **La personnalisation n'est pas construite.** Ses choix sur la fiche restent consignés ci-dessus pour une reprise éventuelle : le choix des peaux et des cheveux et la page de création (PR-PEAU, PR-CHEVCOUL, PR-ENSEMBLE, PR-ECRAN), les coupes (PR-COUPE), les traits du visage (PR-TRAIT), l'atelier de l'arme (PR-ARME). PR-LOTS ne s'applique plus tel quel : il reste un seul lot décidé.
- Cohérent avec la décision H4 (« Une base + couleurs ») : un seul dessin, des couleurs.

### Le lot décidé (une tâche, dans sa propre séance)
- **Ren unique** : les masques de peau, de cheveux et de cape de Ren sur ses deux feuilles, par la méthode de GS1 (masque par couleurs de palette, règles de groupe, corrections à la main lues dans les documents Aseprite de revue, critiques à froid ; Ren est toujours à l'écran : des masques plus propres que ceux des PNJ) ; les rampes réglées en jeu (le gris qui se lit argent, l'ivoire de la cape) le soir, le matin, à midi et en fin de journée ; une fiche courte avec des captures en jeu ; à l'approbation, le fichier des variantes avec la variante fixée et les empreintes des masques, la recoloration dans la ville, les places, les portraits, le HUD et le duel d'une partie v2 ; les preuves (une partie v2 jouée et rejouée en Node, le jeu par défaut à 0 px contre `main` en DEV et sur les deux paquets) ; `AGENTS.md`. La branche `claude/rivaux-peaux` (les peaux des rivaux) touche peut-être les mêmes fichiers (`FighterSkins.ts`, `fighters.json`) : la séance du lot part après elle, ou rejoue sur `main`.

### Le rejeu sur `main` et l'archive
- Pendant la fiche, `main` a avancé (lot L5, Passes EVL9 / EVL10, qui ont archivé I2 à EVL6). Pour éviter un push forcé : une branche neuve `claude/ren-perso-2` tirée d'`origin/main` (`d59ed1c`), le commit de PR1 rejoué, le journal recomposé par un script Node (la passe PR1 et sa ligne d'« À reprendre » ajoutées au journal de `main`, CRLF gardé). La branche `claude/ren-perso` est supprimée après la fusion.
- Les passes gardées faisaient 69 168 octets : les Passes EVL7 et EVL8 (branche `claude/l4-rivalites`, fusionnée) sont déplacées à l'octet dans `journal/65-passes-EVL7-EVL8.md` ; le corps de l'archive est égal aux 21 711 octets retirés, chaque passe est dans un seul fichier, CRLF gardé.

### La fusion
- La branche `claude/ren-perso-2` (Passes PR1, PR2 : le journal et la page de la fiche, aucun code) est fusionnée en avance rapide dans `main` ; `main` est poussé ; les branches `claude/ren-perso` et `claude/ren-perso-2` supprimées, locales et distantes.

### Pensée
- Un atelier qui classe les choix par leur coût sert aussi à réduire : l'opérateur, voyant le prix, a gardé la valeur (la diversité, un protagoniste à la peau hâlée) et laissé le « plus ». Le travail qui reste à faire est celui que la suite reprendrait.
- Une couleur « définitive » se juge dans le jeu, sous ses quatre lumières : la rampe grise des PNJ, à la taille de Ren, dit anthracite et non argent.

## Passe FT1 — Les fanions des places suivent la fête : trois paliers du pouls `festivity`, derrière `flags.v2` ; la fiche publiée (2026-11-08)

### Demande
- Transmise par la séance mère (`local_583db797-…`), d'après L5-3 « Fanions dans une tâche à part, pas de volets » (Passe EVL10) : faire suivre la fête aux guirlandes déjà approuvées des trois places de la version 2, aucun décor neuf, pas de volets ; une cuisson de visibilité par palier, prouvée à 0 px contre `vis=0` aux cadrages des places, et son coût ; le jeu par défaut à 0 px contre `main` (DEV et paquets), le laboratoire identique ; une fiche d'arbitrages avec des captures de chaque palier ; fusionner après sa relecture.
- Lu d'abord : `JOURNAL.md` en entier (Passes EVL9, EVL10), la Passe FV4 (méthode des preuves de visibilité des places et de leur cuisson), `AGENTS.md` (« Art direction », J6 ; « Visibility-driven generation »). Branche `claude/fanions-fete` dans un worktree (`.claude/worktrees/fanions-fete`) : d'autres séances travaillent en parallèle dans le dossier principal (la branche `claude/ren-perso-2` de la séance de personnalisation existe aussi).
- Interrompue une fois par la limite d'usage (commit `3adff47`, cette passe « en cours »), reprise sur la demande de l'opérateur.

### La mesure d'abord — le pouls de la fête de jour
- Laboratoire hors dépôt, 50 parties v2 par politique, le pouls relevé à chaque action : `festivity` vaut de jour l'excitation × 0,8 (80 au plus) plus ce que les événements ajoutent ; 36 le premier matin, 44 à 60 le jour 2, 67 à 87 le jour 3, 80 à 94 le jour 5, puis 87 à 100 (l'idle plafonne à 84-88 des jours 6 à 9 : sans les événements, l'excitation seule ne dépasse pas 80).
- Part des visites aux places de jour par palier (1 / 2 / 3) : à 50 et 80, le diligent 20 / 7 / 74 % (tout tendu dès le jour 4, le palier 2 presque jamais vu) ; à 60 et 90, 20 / 12 / 69 % (tout tendu dès le jour 5, 96 % des visites), le curieux 21 / 22 / 57 % ; à 40 et 70, 20 / 0 / 80 %. Le diligent n'est pas sur les places de jour le jour 2.

### Fait — [OK], derrière la version 2
1. **La règle** (`src/simulation/v2react.ts` `plazaBunting`, `BUNTING_AT` ; `src/world/Plazas.ts` `buntingHangs`, `hang`) : de jour, palier 1 sous 60 (une guirlande de façade sur deux, la première de chaque rang : le premier étage de chaque maison, chaque travée de la galerie des lices), palier 2 de 60 à 89 (toutes les guirlandes des façades), palier 3 dès 90 (et les cordes qui traversent la place, les guirlandes des portes : la place telle qu'elle était). La nuit ne change pas. Guirlandes par palier : parvis 3 / 6 / 8, lices 3 / 5 / 7, place de la halle 6 / 11 / 14. Une guirlande ne tire aucun nombre aléatoire : parties, instances, autres créneaux inchangés ; le palier 3 est la place d'avant à l'octet.
2. **[KO → corrigé] l'ordre d'abord construit** (le cœur et les portes au palier 1, puis une façade sur deux, puis toutes) : sur les captures avec la foule, les trois paliers se distinguaient à peine (0,1 à 0,3 % de l'image au-dessus de 24 niveaux entre les paliers 1 et 3, quinze places du héros) : les deux grandes cordes de la halle et des lices sont ce que le cadre montre le plus, et elles y étaient dès le palier 1. L'ordre est inversé : les façades d'abord, les cordes et les portes au palier 3.
3. **Les seuils** : d'abord 50 et 80, passés à 60 et 90 d'après la mesure (chaque palier se voit pendant la poule ; au-delà de 80, ce sont les événements de la fête qui tendent le reste). Sur la fiche (FT-2).
4. **La page** (`src/ui/playPlaza.ts`, `PlazaApp.opts.bunting`) passe le palier de l'état ; DEV `plazabunting=1|2|3` le force (compilé hors des paquets) ; `__stats().bunting` dit le palier et les guirlandes. Le cache des cuissons des places passe de 6 à 12 entrées (trois places, la nuit et trois paliers de jour : chaque palier est une géométrie, donc une clé).
5. **`AGENTS.md`** : la règle (paramètres de la version 2) et le test (« Commands »).

### Tests — [OK]
- **`tests/v2-bunting.test.mjs`** (neuf, 7 tests), oracles écrits dans le test : les seuils à leurs bornes (59/60, 89/90), la table des sites par palier, sans palier = palier 3 à l'octet dans chaque créneau, la nuit sans guirlande quel que soit le palier, les comptes par palier et par place, un palier n'ôte que des triangles de fanions et de cordes (les couleurs du pavois écrites dans le test ; tout autre créneau à l'octet, mêmes parties, mêmes instances), les travées de la galerie des lices (1, 3, 5 au palier 1, toutes ensuite) relevées sur la géométrie, le branchement de la page et la taille du cache.
- **Fautes injectées une à une** (script hors dépôt, chaque fichier rendu à l'octet et vérifié par SHA-256) : 21 sur 21 attrapées sur la règle finale. [KO → réécrite] Une faute de la première série (« une guirlande de porte la nuit » par le seul prédicat) passait : la porte est aussi gardée par `if (day)` à son appel, la faute ne changeait rien ; réécrite en ôtant les deux gardes, attrapée.
- `npm test` : 501 sur 502 dans le worktree ; le seul échec est `tests/arena-day.test.mjs`, le chargeur SSR qui ne trouve pas `three` dans un worktree (Passes GA1, GS1, GS2), à relancer dans le dossier principal après la fusion. `npm run typecheck`, `npm run build`.

### Preuves — [OK]
- **Serveurs** par `preview_start` (entrées `ft-*` ajoutées à `.claude/launch.json`, non suivi) : la branche en DEV `:5311`, `main` figé (`git archive` de `d59ed1c`, `three` copié, une configuration sans import de `vite`) en DEV `:5312`, les deux paquets par `vite preview` `:5313` et `:5314`.
- **La visibilité de chaque palier** (`tools/plaza-shots.mjs`, 1920 × 1080, `static=1`, élaguée contre `vis=0`, seuil 0 : tout écart d'un niveau compte ; le parvis à midi, les lices le matin, la halle l'après-midi ; 12 places du héros par place, les quatre coins, le milieu des bords, quatre places intérieures, 13 pour la halle avec son coin ouest de la Passe FV4) : 0 px sur 111 vues (37 par palier ; les paliers 1 et 2 refaits sur la règle finale, le palier 3, inchangé, prouvé sur la première série). Témoins (la halle chargée deux fois à chaque palier) : 0 px. Contrôle négatif (la caméra forcée derrière la halle, depuis le nord, après la pose du héros) : 13 227 px. Les parties cachées sont les mêmes à chaque palier (parvis 54 sur 211, lices 18 sur 162, halle 48 sur 246) : seules les guirlandes, non suivies (partie 0) ou portées par une porte ou une travée, changent.
- **Le coût d'une cuisson neuve** (`tools/startup.mjs`, `viscache=0`, 4 chargements, 1080p, aucune contention relevée, Radeon 780M ; médianes par palier, la règle finale) : parvis 289 ms à chaque palier (573 poses, 18 pages), lices 169, 172 et 179 ms (327 poses, 11 pages), halle 280, 276 et 284 ms (527 poses, 17 pages) ; le palier n'y change rien (FV4 : 260, 164, 260 ms ; la page prête en 3,8 à 4,3 s ici, chaque chargement d'un profil neuf). Une cuisson par palier et par navigateur, relue du cache ensuite.
- **Le jeu par défaut et les places inchangés contre `main` figé** : `detshots` (la ville de nuit et à midi, le mode jouable par défaut et v2 à l'ouverture), l'arène par défaut et le duel v2 (prêt, fenêtre, K.O., `HOLD=1 FREEZE_CSS=1`), les trois places de nuit et au palier 3 de jour (avec la foule, deux places du héros chacune) : 22 vues sur 22 à 0 px en DEV ; témoin de répétition 0 px ; contrôles négatifs (nuit contre midi, arène contre duel v2, défaut contre v2, place de nuit contre de jour) tous différents (4,9 à 99,8 %). **Les paquets** : les dix vues hors états nommés à 0 px ; l'entrée garde sa taille (220 032 octets), les morceaux qui importent `v2react` changent d'empreinte.
- **Laboratoire** : sept séries (classique et dynamique, idle et diligent ; v2 idle, diligent, curieux ; graines 1 à 50) identiques à l'octet (`cmp` des JSON) contre `main` : la règle ne fait que lire l'état.
- Captures de la fiche (`plaza-shots`, avec la foule, 1920 × 1080) : la place du héros où les paliers 1 et 3 diffèrent le plus, choisie par diff parmi cinq par place. La foule ne se place pas au même endroit d'un palier à l'autre (des tirages de `Math.random` dans les images avant la pose) : les captures de comparaison du décor sont faites en `static=1`.

### Archive du journal
- Faite au rejeu sur `main`, en Passe FT2 (la branche archivait les passes EVL7 à GS2 ; `main` avait archivé EVL7 et EVL8 entre-temps).

### La fiche — publiée, rien de décidé
- Page privée https://claude.ai/artifact/GXRRjoaFhhaoT8V7HFUFUQ, source `briefs/fiche-fanions.html` (la page de la fiche de L5), quatre images publiées avec elle (pas dans le dépôt) : chaque place aux trois paliers (le décor seul, `static=1`, à la place du héros où les paliers 1 et 3 diffèrent le plus parmi ses 12 ou 13 places : la halle 57 582 px, les lices 36 851, le parvis 10 831 au-dessus de 24 niveaux) et la halle vue du joueur avec la foule. La collection `decisions` a été relue vide à la publication. Vérifiée en local avant : six cartes, les quatre images chargées, aucun débordement à 375 px, aucune erreur.
- Six cartes, chacune avec sa recommandation : FT-1 trois paliers (« Garder ») ; FT-2 les seuils (« 60 et 90 » ; 50 et 80, 40 et 70 en alternatives, avec la part des visites de chacun) ; FT-3 l'ordre (« Les façades d'abord, le cœur au palier 3 », l'ordre d'abord construit en alternative, et pourquoi il a été écarté) ; FT-4 la nuit et le quai inchangés (« Garder ainsi ») ; FT-5 la visibilité et le coût (« Accepter ») ; FT-6 « Fusionner après la fiche, essayer ensuite ».
- Vu sur les captures et dit sur la fiche : dans le cadre principal de la halle, les paliers 1 et 2 ne diffèrent que par les façades des arcades en bord de cadre ; le parvis reste discret à tout palier (ses guirlandes sont petites dans son cadre).

### Où reprendre
- Relire `decisions` quand l'opérateur dit la fiche remplie, consigner mot pour mot, appliquer (un seuil ou un ordre : une ligne chacun, puis les preuves touchées), relancer `tests/arena-day.test.mjs` dans le dossier principal, fusionner selon FT-6.

### Pensée
- Une règle de décor se juge sur ce que le cadre montre : l'élément le plus visible décide de l'ordre des paliers, sinon trois états prouvés se ressemblent à l'écran. On le mesure (le diff entre les paliers, à plusieurs places du héros) avant de publier.
- Un seuil se choisit sur la part des visites qu'il donne à chaque palier, pas sur la plage du pouls : à 50 et 80, le palier du milieu existait dans le code et presque jamais à l'écran.
- Une faute injectée qui passe peut tomber sur une garde redondante : on vérifie qu'elle change un comportement avant d'accuser le test.

## Passe FT2 — La fiche des fanions relue : six sur six à la recommandation ; la branche rejouée sur `main` et fusionnée (2026-11-08)

### Demande
- L'opérateur, mot pour mot : « Fiche remplie ». Relire `decisions` (https://claude.ai/artifact/GXRRjoaFhhaoT8V7HFUFUQ, source `briefs/fiche-fanions.html`), consigner mot pour mot, appliquer ce qui change, refaire les preuves touchées, puis fusionner selon FT-6.

### Les choix de l'opérateur, mot pour mot (six sur six, cliqués le 2026-11-08 entre 14 h 20 et 14 h 21 UTC, aucune note)
| Carte | Ce qu'elle demandait | Choix |
|---|---|---|
| FT-1 | Trois paliers : la place se pare à mesure que la fête monte | « Garder » |
| FT-2 | Les seuils : le palier 2 dès 60, le palier 3 dès 90 | « 60 et 90 » |
| FT-3 | Ce qui se tend d'abord : les façades, puis le cœur de la place | « Les façades d’abord, le cœur au palier 3 » |
| FT-4 | La nuit et le quai ne changent pas | « Garder ainsi » |
| FT-5 | Chaque palier a sa cuisson, prouvée à 0 px | « Accepter » |
| FT-6 | Fusionner, puis ton essai | « Fusionner après la fiche, essayer ensuite » |

- Les six choix suivent la recommandation de leur carte : rien à appliquer, la règle reste telle que la Passe FT1 l'a construite et prouvée (de jour, une façade sur deux sous 60, toutes dès 60, les cordes du cœur et les portes dès 90 ; la nuit et le quai inchangés ; pas de volets).

### Le rejeu sur `main` — [OK]
- Pendant la fiche, `main` a avancé de deux commits (Passes PR1, PR2 : la personnalisation de Ren, `6316327`) : `JOURNAL.md`, `briefs/fiche-ren-perso.html` et l'archive `journal/65-passes-EVL7-EVL8.md`, aucun code. La branche archivait elle aussi EVL7 et EVL8 (avec GS1 et GS2, dans une archive numérotée 65) : les deux archives se recoupaient. Pour éviter un push forcé (Principes, Passes SN3, SN5, GS2) : une branche neuve `claude/fanions-fete-2` tirée d'`origin/main`, les huit fichiers hors journal repris de l'ancienne branche, identiques à l'octet (mêmes empreintes d'objets git) ; le journal refait sur celui de `main` : les Passes FT1 et FT2 ajoutées, l'archive 65 de la branche abandonnée (celle de `main` garde EVL7 et EVL8), GS1 et GS2 archivées à part (ci-dessous).

### Archive du journal
- Les passes GS1 et GS2 (branches fusionnées) déplacées à l'octet dans `journal/66-passes-GS1-GS2.md` : le corps de l'archive est égal aux 18569 octets retirés, chaque passe est dans un seul fichier, les fins de ligne CRLF sont gardées.

### Preuves
- Aucun code ne change depuis `8e534d7` (le rejeu reprend les mêmes octets) et `main` n'a touché aucun fichier que lisent les preuves : celles de la Passe FT1 tiennent (visibilité de chaque palier à 0 px sur 111 vues, coût de la cuisson, jeu par défaut et places de nuit et au palier 3 à 0 px contre `main` en DEV et sur les paquets, laboratoire identique, 21 fautes injectées). `npm run typecheck` et `npm test` relancés dans le dossier principal après la fusion, `tests/arena-day.test.mjs` compris (il échouait dans le worktree) : typecheck propre, `npm test` **505 sur 505** sur `f4c94fc`.

### La fusion
- La branche `claude/fanions-fete-2` (Passes FT1, FT2) est fusionnée en avance rapide dans `main` (FT-6 « Fusionner après la fiche, essayer ensuite ») ; `main` est poussé ; les branches `claude/fanions-fete` (remplacée par le rejeu) et `claude/fanions-fete-2` supprimées, locales et distantes ; le worktree retiré. Ton essai : `npm run dev`, puis `/?play=1&new=1&v2=1`, et suivre les jours (une façade sur deux les jours 1 et 2, toutes les jours 3 et 4, la place entièrement pavoisée dès le jour 5 environ) ; en DEV, `/?play=1&state=v2-square-afternoon&plazabunting=1` (puis 2, puis 3) montre chaque palier sur la place de la halle.

### Pensée
- Deux séances qui archivent le journal en parallèle peuvent prendre les mêmes passes : au moment de fusionner, l'archive se refait sur le journal de `main` (son index, sa taille), jamais en recollant celle de la branche.

