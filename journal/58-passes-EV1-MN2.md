# Journal de bord — archive : passes EV1, MN1, MN2 (2026-11-05)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-11-06 (Passe EVL2) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe EV1 — Étape 5 : l'audit des événements, des actions en ville et du récit de la version 2 ; la fiche d'arbitrages publiée (2026-11-05)

### Demande
- L'opérateur, relayé par la séance mère, nomme la suite, mot pour mot : « le travail sur les evenements dynamique et aussi les actions d'interactions : vol, defi, etc... ». C'est l'étape 5 de `briefs/roadmap-2026-10.md`, la seule pas encore commencée.
- La tâche confiée : auditer la couche de jeu de la version 2 (événements, actions en ville, récit et cinématiques) contre les contrats de gameplay et du tournoi, la mesurer au TournamentLab, jouer une partie dans le navigateur, puis publier une fiche d'arbitrages. Audit et proposition seulement : aucune règle ni aucun contenu du jeu ne change avant les choix de l'opérateur. Le recrutement et la phase d'équipe restent un écart consigné (chantier plus tard).

### Fait — [OK], documents seulement
- **Le rapport** : `briefs/audit-gameplay-ev1.md` (la carte des exigences contre le code, les mesures, la partie jouée, ce qui reste hors de la fiche).
- **La fiche** : page privée https://claude.ai/artifact/Ky78QRmuxrikUw1KM6yPcr, source `briefs/fiche-ev1.html` (la page de la fiche CH1, son attente du pont portée à 10 s), onze captures du vrai jeu publiées avec la page (pas dans le dépôt). Collection `decisions` relue vide à la publication ; une écriture d'essai dans `probe`, lue puis effacée : la base répond.
- Aucun fichier de `src/`, `tests/`, `tools/` ni aucun contrat ne change.

### La carte des contrats — ce que la version 2 fait aujourd'hui
- **Couvert** : la préparation par la puissance et par la résilience (gameplay § 5) ; le collectif d'abord, le ciblé quand le joueur devient dangereux (§ 9 : le joueur qui ne gagne pas n'est jamais visé) ; le fair-play des deux sabotages de Cassius (la forge : deux signes, six réponses ; l'armure : deux signes, quatre réponses) ; l'économie sans cul-de-sac (§ 10) ; l'échec qui ouvre une situation (§ 11) ; la cause écrite de chaque événement (verrou 8).
- **Mince** : l'information (on n'observe que Vessa et Marek ; l'activité hors écran des rivaux est écrite `visible: false`) ; la relation (rien avec les gens de la version 2 ni avec une faction) ; l'opportunité (trois défis, la leçon de Corvin, les bookmakers) ; la réaction visible de la ville (§ 8 et tournoi § 9 : le quai suit l'excitation, les places ne lisent que l'heure ; `playerFame`, `publicPressure` et `activeCompetitors` ne sont lus par rien, `commerce` par une seule réplique) ; l'escalade du contrat projet § 9.2 (deux formes sur sept, un seul saboteur) ; la nuit « clandestine » du projet § 8.1 ; l'éliminé qui reste en ville (tournoi § 8).
- **Absent** : l'investissement (§ 5 : débloquer un service, améliorer un atelier) ; le grand événement public hors combat (tournoi § 10 : la parade du jour 9 est une ligne de texte).
- **Écart consigné, inchangé** : le recrutement et la phase d'équipe (gameplay § 7, projet § 5.1).

### Mesures — [OK] TournamentLab `--rules=v2`, graines 1 à 50
| Politique | Combats gagnés | Qualifié | Couronné | Blessures | Lignes d'événement par partie |
|---|---|---|---|---|---|
| `diligent` | 59,6 % | 88 % | 2 % | 0,76 | 39,2 |
| `idle` | 0 % | 0 % | 0 % | 1,74 | 30,7 |

- 26 définitions sur 32 se déclenchent avec `diligent` ; six jamais (`steel-shortage`, `merchant-favour`, `v2-steel-caravan`, `v2-quay-alert`, `v2-thief-talk`, `v2-challenge-fame` : elles attendent une action que le bot ne fait pas). Trois ambiances font 52 % des lignes : `night-market` 10 fois par partie (un seul texte), `colosseum-roar` 5,8, `v2-puppet-show` 4,8.
- Sabotage : la forge tentée et déjouée dans les 50 parties (le bot paie la garde du quai chaque soir, 7,5 fois, 112 pièces) ; l'armure trafiquée dans 19, déjouée par la même garde dans 15, trouvée par Hilde dans 4. Aucun participant oublié.
- **Trois joueurs « explorateurs »** écrits pour l'audit (un script hors du dépôt qui charge les modules purs comme le laboratoire ; mêmes graines ; le diligent pour le reste) :
  - le défieur : 15 défis par partie, **15 gagnés** (à mi-vie de l'adversaire), 2 compétences apprises, 5 défis sans gain au plafond ; 46,8 % de combats officiels gagnés (le défi prend le créneau d'entraînement et le bot n'emporte jamais ce qu'il apprend) ;
  - le voleur : 33 vols par partie, 7 réussis, 26 pris, 3,6 fermetures, réputation finale **0,2**, et pourtant qualifié dans 90 % des parties (63,6 % de combats gagnés : ce qu'il vole s'équipe) ;
  - le marchandeur : 40 marchandages par partie, 37,5 % réussis, la bienveillance qui s'effrite.
- Disponibilité, à chaque créneau, quelque part : marchander 100 %, voler 100 % (la nuit chez Pip seulement), défier 50 % ; chance moyenne d'un vol 39 % (23 à 70 %), d'un marchandage 46 % (26 % pour `idle`).
- **Ce que le bot ne voit pas** : il ne marchande, ne vole, ne défie, n'observe, n'écoute et n'achète jamais d'information ; il ne fait ni la cargaison ni l'entraînement avec Orla ; il ne change jamais ses quatre compétences ; il paie la garde sans lire les signes ; le laboratoire ne compte ni la marche, ni l'écran, ni le prix d'un soir.

### La partie jouée — [OK] serveur DEV du worktree (port 5197, `preview_start`, arrêté), `?play=1&new=1&v2=1`, graine 1842
- Lisible : le dialogue en bas, la chance du marchandage et son résultat dans la page des marchandises, la chance du vol dans la liste Q, le vol pris en haut de l'écran, la cinématique d'arrivée.
- **Défauts relevés, non corrigés (audit seulement ; carte EV-1)** :
  - **[KO] sur les trois places, les événements de fin de créneau ne s'affichent pas** : la page se recharge et l'interface part de `st.log.length - 1` (`playPlaza.ts`), alors que le quai garde ce qu'il a montré (`playTown.ts`, `SEEN`). Vérifié : « Wait » au parvis, les hérauts au journal seulement ;
  - un vol réussi depuis la liste Q ne s'affiche pas (`#pm-toast` caché sous `body.pm-talking`) ;
  - le défi étiqueté « free » alors qu'il prend un créneau (règle P2) ;
  - « Why: action:steal » au journal (UM-R3) ;
  - « scouting would tell you more » pour tout adversaire, alors qu'on n'observe que Vessa et Marek ;
  - « Mara will count the stall tonight » : rien ne se passe le soir.
- Le défi « sur le sable » du terrain d'entraînement se joue dans le Colisée plein (88 spectateurs, la foule sonore). Pris à voler, la scène ne bouge pas (Mara à son étal, aucun garde).

### La fiche — publiée, rien de décidé
Seize cartes, chacune avec sa recommandation :
- EV-1, les six défauts de lecture : « Les corriger en premier (lot L1) » ;
- EV-2, le vol : « Un soupçon qui dure, une sortie par la restitution » ;
- EV-3, l'enjeu du défi : « Pleine vie, une mise, une fois par phase » ;
- EV-4, qui défier : « Les trois, puis les éliminés à partir du jour 6 » ;
- EV-5, où se joue le défi : « L’arène aux gradins vides » ;
- EV-6, le marchandage : « Au moment d’acheter, un argument à choisir » ;
- EV-7, les nouveaux événements : « Les suites des actions, puis un par lieu, puis le ciblé » ;
- EV-8, les ambiances répétées : « Hors des nouvelles, dans les répliques et le son » ;
- EV-9, les rivaux : « Chaque rival se souvient ; deux autres agissent » ;
- EV-10, les réponses au sabotage : « Une réponse par lieu, un effet lisible » ;
- EV-11, l'information : « Observer tout adversaire, rumeurs, activité lisible » ;
- EV-12, la ville : « Les places lisent le pouls, la célébrité compte » ;
- EV-13, le récit : « Compléter les arcs, quatre scènes selon l’état » ;
- EV-14, le festival : « Un festival le jour 9, conçu sur une fiche à part » ;
- EV-15, les lots : « L1 à L6 dans cet ordre » (L1 lecture, L2 actions en ville, L3 information et réponses au sabotage, L4 événements et rivalités, L5 la ville qui réagit, L6 récit, scènes et festival) ;
- EV-16, le laboratoire : « Ajouter le joueur curieux au laboratoire ».

### Limites
- Les explorateurs sont des politiques simples (une tentative de chaque action à chaque occasion) : ils montrent l'absence d'enjeu, pas la façon dont joue une personne. Personne n'a joué un défi jusqu'au bout dans cette passe (la porte de l'arène vue, le duel non joué).
- Les captures sont celles du jour 1 et de la fiche du jour 2 ; la nuit sur la place de la halle (Cassius, Pip) n'a pas été jouée.

### Où reprendre
- Relire `decisions` quand l'opérateur dit la fiche remplie, consigner ses choix mot pour mot ici et dans `briefs/audit-gameplay-ev1.md`, puis préparer les séances des lots selon EV-15, chacune derrière `flags.v2` avec ses preuves et sa fiche.

### Pensée
- Un bot de laboratoire qui ne fait pas une action ne peut pas en mesurer le poids : un joueur témoin qui la fait à chaque occasion le donne (le défi gagné 15 fois sur 15, le voleur qualifié à réputation 0).
- Un événement n'a de conséquence que si quelqu'un lit ce qu'il écrit : cinq événements écrivent `playerFame`, que rien ne lit. On cherche les lecteurs d'un effet avant de le compter.
- Une page qui se recharge reprend ses nouvelles là où le joueur les a laissées : partir de la dernière entrée efface ce qui s'est passé pendant le changement.

## Passe MN1 — La manette : état des lieux des entrées, proposition de correspondance, prototype de revue des glyphes, fiche d'arbitrages (2026-11-05)

### Demande
- Transmise par la séance mère : l'opérateur joue sur PC avec une manette de console et demande si le jeu la prend en charge. Aujourd'hui, seul le duel de l'arène en lit une. La tâche : rendre toute la partie version 2 jouable à la manette (Xbox, PlayStation, générique ; l'API Gamepad du navigateur, disposition standard). Elle comprend l'état des lieux de chaque chemin d'entrée avec une proposition, une couche commune (une correspondance pure et un petit lecteur) et les glyphes à l'écran. Une fiche d'arbitrages passe **avant** de construire (correspondance, style des glyphes, portée, vibration). Viennent ensuite la construction derrière le drapeau choisi, les tests, une preuve dans le navigateur par une manette simulée, `ui-text` et `ui-contrast` sur les glyphes, la fusion et l'essai de l'opérateur avec sa manette.

### État des lieux — [OK] relevé dans le code
| Où | Clavier aujourd'hui | Manette aujourd'hui |
|---|---|---|
| Marcher (ville `ActorSystem`, places `PlazaApp`) | WASD ou flèches dans le sens de la caméra, tenu tant qu'une touche reste enfoncée (`controlYaw`, `moveYaw`) ; Maj ×1,2 | rien |
| Parler | E ou Espace près de quelqu'un (`playTown`, `playPlaza`) | rien |
| La liste du lieu, le combat du jour | Q (`townUi.ts`) | rien |
| Le menu et les pages | Échap ; M, J, T, K, G, V ; N coupe le son | rien |
| Listes, dialogues, boutiques, fiche de match | ↑ ↓ (`arrowKeys`), Entrée l'action, Échap la sortie (`footBtn`, `overlay`), Espace sur la page K ; les curseurs du son à la souris ou ← → (natif) | rien |
| Cinématiques (`cutscene.ts`) | E, Espace, Entrée ; Échap passe | rien |
| Sorties (`exits.ts`) | marcher dedans, une touche tenue (`actors.keys.size`, `PlazaApp.moving`) | rien |
| Écran titre (`title.ts`) | ↑ ↓, Entrée, Échap ; le nom au clavier | rien |
| Avant et après le combat (`playArena.ts`) | Entrée sur « Fight », puis sur « Back to the city » | rien |
| Duel de la version 2 (`ArenaApp`, `v2Arena.ts`) | J / 1 attaque tenue, K / B garde tenue, L / A esquive, Espace pause, R recommencer | `pollPad` : la **première** manette, `V2_PAD` X attaque tenue, B garde tenue, A esquive, Start pause, Back recommencer ; le HUD affiche toujours J, K, L |

- **Constat** : toutes les pages de la version 2 se pilotent déjà sans souris (flèches, Entrée, Échap, Espace). La manette peut appuyer ces mêmes touches (des événements clavier synthétiques sur l'élément actif) : la correspondance devient une table, aucune page n'est réécrite. Il manque deux gestes au clavier sans souris : faire défiler le texte de détail d'une page (molette seulement) et passer d'une page du menu à la voisine ; le stick droit et les gâchettes hautes peuvent les donner.
- **L'arène par défaut** garde sa manette du prototype (A esquive, B garde, X / Y les attaques, gâchettes et bumpers les techniques) : non touchée.
- **Les polices embarquées** n'ont ni les symboles PlayStation (U+25A1, U+25B3, U+25CB) ni le ☰ (U+2630) : hors de `LATIN_RANGE`. Ils se dessinent en SVG, de la couleur du texte. Les lettres A / B / X / Y, LB, L1 et + / − sont dans le sous-ensemble.
- **Le son** démarre au premier geste (`Sound.unlock` sur `pointerdown` / `keydown`). D'après des forums de moteurs (Construct, pixi-sound), un bouton de manette ne compte pas comme geste dans Chrome ; non vérifiable sans manette réelle : carte MN-10.

### Prototype de revue — [OK], DEV seulement, branché à aucune manette
- **`src/input/pad.ts`** (pur) : les boutons de la disposition standard (`BTN`), la famille d'une manette par son identifiant (`padFamily` : Sony 054c, Nintendo 057e ou le nom ; les autres en lettres Xbox), la zone morte radiale rééchelonnée (`deadZone`, 0,22), la marche demandée (`walkOf` : la croix à pleine vitesse, le stick de 30 % à 100 %, B tenu pour courir), les touches par contexte (`KEYS` : exploration, page, cinématique), le duel (`DUEL`, `duelCommands` : une commande tenue descend au premier de ses boutons et remonte au dernier lâché), la direction des pages avec hystérésis (`navDir`) et sa répétition (`Repeater` : 0,4 s puis toutes les 0,12 s), le bouton qu'affiche une touche selon sa place (`capButton`), la vibration par événement du duel (`rumbleOf`).
- **`src/input/glyphs.ts`** : chaque bouton dans la touche du système de design (`capOf` : rond pour les boutons de face et les sticks, pilule pour les gâchettes et les petits boutons ; les styles `outline`, `colour`, `word` pour la fiche) et leur CSS (`PAD_CSS`).
- **`src/input/prompts.ts`** : la classe `Prompts` remplace le contenu des `<kbd>` par le bouton (un `MutationObserver` les trouve à mesure qu'ils paraissent ; la clé gardée dans `data-key` ; rendue par `set(null)`). `reviewPrompts` sert le paramètre DEV `?padglyph=xbox|ps|nintendo[:outline|colour|word]`, importé par `main.ts` sous `import.meta.env.DEV`, compilé hors du paquet.
- **`src/ui/style.ts`, `fillFoot`** : la sortie (`.out`, à droite) se reconnaissait au texte de sa touche (« Esc ») ; une touche qui montre un bouton n'a plus ce texte. `fillFoot` lit `data-key`, puis le texte comme avant : rien ne change au clavier.
- `npm run typecheck` sans erreur.

### Captures
- `tools/play-shots.mjs` sur le serveur DEV du worktree (`:5231`, par `preview_start`), 1600 × 900 : `v2-day1-morning` avec Mara près du héros (le hint `E`, `Q`, `Esc`), son dialogue, sa boutique et le menu ; `v2-day2-afternoon` et la fiche de match (`Space`, `Enter`, `Esc`) ; au clavier, Xbox, PlayStation et Nintendo ; les trois styles ; au téléphone (390 × 844). `tools/arena-scene-shots.mjs` (`HOLD=1`, `FREEZE_CSS=1`) : le duel `?scene=arena&v2=1&time=midday` au premier palier, la barre K / L / J devenue B / A / X puis Rond / Croix / Carré.
- Les 21 images sont publiées avec la page, pas dans le dépôt ; quatre images clés dans `screenshots/calibration/manette-MN1/`.

### La fiche — publiée, rien de décidé
- Page privée https://claude.ai/artifact/F2fYfXXjwL5y6o7p5q4fj1, source `briefs/fiche-manette.html` (gabarit `fiche-arbitrages`, collection `decisions`, relue vide à la publication). Vérifiée en local avant : 11 cartes, aucune image cassée, aucun débordement à 1 200 et 390 px, aucune erreur de page. Elle s'ouvre sur l'état des lieux, puis onze cartes :
  - MN-1 la portée, recommandé « La version 2 et la navigation de l’écran titre » (pour prendre « Continue » à la manette ; le jeu par défaut, son arène et Explore au clavier) ;
  - MN-2 la marche, recommandé « Le stick règle la vitesse, B tenu pour courir » ;
  - MN-3 l'exploration, recommandé « Valider ce plan » (A parler, Y la liste, Menu le menu, Affichage la carte ; J, T, K, G, V par le menu) ;
  - MN-4 les pages, recommandé « Valider ce plan » (croix ou stick les lignes, A l'action, B la sortie, X emporter / laisser, croix ← → les curseurs, stick droit le détail, LB / RB la page voisine du menu) ;
  - MN-5 le duel, recommandé « Les deux : X, B, A et les gâchettes en double » (RT attaque, LT garde : tenir la charge et la garde avec le pouce sur l'esquive, comme J, K, L) ;
  - MN-6 les cinématiques, recommandé « A la ligne suivante, Menu pour passer » ;
  - MN-7 le style, recommandé « Contour, sans couleur » (les pastilles de marque sortent de la palette UM-S3) ;
  - MN-8 la famille, recommandé « Selon la manette (Xbox, PlayStation, Nintendo) » ;
  - MN-9 la vibration, recommandé « Oui, discrète, avec un interrupteur sur la page du son » ;
  - MN-10 le son à la manette seule, recommandé « Une ligne discrète tant que le son attend » ;
  - MN-11 la suite, recommandé « Fusionner après les preuves, essayer ensuite ».

### Limites
- Aucune manette n'est encore lue hors du duel : le prototype ne fait que montrer les glyphes. `ui-text` et `ui-contrast` passeront sur les glyphes avec la construction.
- Personne n'a branché de vraie manette sur cette branche ; le geste du son à la manette reste à voir à l'essai.

### Où reprendre
- Relire `decisions` quand l'opérateur dit la fiche remplie, consigner mot pour mot, construire derrière la portée choisie (le lecteur `src/input/PadInput.ts`, la marche analogique dans `ActorSystem` et `PlazaApp` sans toucher au chemin clavier, les touches synthétiques des pages, les glyphes, la vibration), les tests de la correspondance et de la navigation, la preuve navigateur d'une manette simulée (`navigator.getGamepads` remplacé dans la page) sur le premier jour et un combat, `ui-text` / `ui-contrast`, le jeu au clavier à 0 px contre `main`, puis fusionner selon MN-11.

### Pensée
- Une interface déjà pilotable entièrement au clavier se donne à la manette en appuyant ses propres touches : la correspondance devient une table qu'on teste en Node, et chaque page garde son seul code.
- Un code qui reconnaît un bouton au texte de sa touche (`fillFoot`) casse dès que la touche montre autre chose : la clé se garde à part (`data-key`), le texte n'est qu'un affichage.

## Passe MN2 — La fiche de la manette relue, onze sur onze : la manette dans la version 2 (2026-11-05)

### Demande
- L'opérateur, mot pour mot : « Fiche remplie ». Relire `decisions` (https://claude.ai/artifact/F2fYfXXjwL5y6o7p5q4fj1, source `briefs/fiche-manette.html`), consigner mot pour mot, construire ce qui est choisi, avec ses tests et ses preuves, puis fusionner selon MN-11 (Passe MN1).

### Les choix de l'opérateur, mot pour mot (onze sur onze, sans note ; cliqués le 2026-11-05 entre 21 h 33 et 21 h 34 UTC)
| Carte | Ce qu'elle demandait | Choix |
|---|---|---|
| MN-1 | Où la manette joue | « La version 2 et la navigation de l’écran titre » |
| MN-2 | Marcher et courir au stick | « Le stick règle la vitesse, B tenu pour courir » |
| MN-3 | En marchant dans la ville et sur les places | « Valider ce plan » |
| MN-4 | Dans les pages, les listes et les dialogues | « Valider ce plan » |
| MN-5 | Le duel de la version 2 | « Les deux : X, B, A et les gâchettes en double » |
| MN-6 | Les cinématiques des places | « A la ligne suivante, Menu pour passer » |
| MN-7 | Le style des boutons à l’écran | « Contour, sans couleur » |
| MN-8 | Quels boutons montrer | « Selon la manette (Xbox, PlayStation, Nintendo) » |
| MN-9 | Vibrer sous les coups | « Oui, discrète, avec un interrupteur sur la page du son » |
| MN-10 | Si la manette n’ouvre pas le son | « Une ligne discrète tant que le son attend » |
| MN-11 | Fusionner, puis ton essai avec ta manette | « Fusionner après les preuves, essayer ensuite » |

Les onze choix suivent la recommandation de leur carte.

### Fait — [OK], derrière la version 2 et l'écran titre (MN-1)
- **`src/input/PadInput.ts`** : le lecteur dans la page. Il démarre quand le navigateur annonce une manette (`gamepadconnected`) ou en tient déjà une, et lit celle qui a servi en dernier (branchement à chaud). Sans manette, aucune boucle ne tourne et rien de la page ne change. Il déduit le contexte de ce que la page montre (`contextOf` : une ligne de cinématique, une page modale `#title-screen` / `.pm-overlay` / `.pm-talk`, sinon le duel ou la marche que la page déclare).
  - Dans une page, il appuie les touches que l'interface affiche : des événements clavier synthétiques sur l'élément qui a le focus. Chaque page répond donc par son propre code clavier, sans réécriture. Entrée presse le bouton si la page ne l'a pas pris (le défaut du clavier), comme pour la fiche de match qui prend Entrée elle-même.
  - La croix et le stick font les flèches, et à défaut l'élément voisin (la page du son), ← → un curseur ; le stick droit fait défiler le détail.
  - X ne presse Espace que là où une touche Espace est affichée (la page K et la fiche de match). LB / RB vont à la page voisine du menu.
  - Sur l'écran titre, B revient comme le bouton « Back » de « New game » (`data-pad-back` ; au clavier, Échap n'y répond que dans le champ).
  - Une direction tenue d'un contexte à l'autre ne parcourt pas la liste qui s'ouvre tant qu'elle n'est pas relâchée.
- **La marche** (MN-2) : `ActorSystem.pad` et `PlazaApp.pad` reçoivent `walkOf` (la croix à pleine vitesse, le stick de 30 % à 100 % par sa zone morte, B tenu court ×1,2 comme Maj). Ils ne la lisent que si aucune touche de marche n'en demande une : le chemin du clavier reste le même calcul (un facteur `× 1` exact). Le sens est pris par le lacet de la caméra et tenu pendant la marche (`controlYaw`, `moveYaw`), comme au clavier. Sur les places, l'horloge du cycle suit la vitesse du stick (pas de patinage). Les sorties de la ville comptent la marche de la manette comme une touche tenue.
- **Les pages** (`townUi.ts`) : `tabPage` (LB / RB, l'ordre du menu : carte, journal, tournoi, compétences, équipement, son). Le bouton « Gamepad vibration » s'ajoute à la page du son (V) seulement quand une manette a été vue sur la page (MN-9) ; il est réglé dans le navigateur (`cite-du-tournoi.pad`).
- **Le duel** (MN-5) : `ArenaApp` installe la manette commune pour le duel chargé de la version 2 (`DUEL` : X ou RT l'attaque tenue, B ou LT la garde tenue, A l'esquive, Menu la pause, Affichage le recommencement de la page de l'arène ; `duelCommands` : une commande tenue descend au premier de ses boutons et remonte au dernier lâché). `pollPad` s'efface devant elle et reste tel quel pour toutes les autres arènes. Les coups reçus par Ren font vibrer la manette (`rumbleOf`, MN-9). La pause dit « [Menu] to resume » quand la manette sert (une ligne de plus, masquée au clavier).
- **Les touches à l'écran** (MN-7, MN-8) : `prompts.ts` a désormais une instance partagée. La revue `?padglyph=` la force ; sinon c'est `PadInput` qui la règle selon le dernier appareil utilisé.
- **Le son** (MN-10) : `Sound.asleep` (le son attend un geste, sauf s'il est coupé). Un bouton de manette tente `unlock()`. La ligne « Click or press a key to hear the game » paraît en haut au centre, sur le voile, tant que la manette sert et que le son dort.
- **Textes** : `v2.sound.vibration`, `v2.pad.sound`. **`AGENTS.md`** : la section « Gamepad », l'outil `pad-proof`, le test.

### Tests — [OK]
- **`tests/pad.test.mjs`** (onze tests ; oracles écrits dans le test, d'après la disposition standard et les tables de la fiche) :
  - les boutons et la famille par les identifiants de Chrome et de Firefox ; la zone morte et la marche ;
  - les touches par contexte, avec les écouteurs des pages qui les entendent ;
  - le duel, avec `V2_PAD` gardé entier (charge et garde tenues ensemble, esquive au pouce) ;
  - la navigation et sa répétition, `stepIndex`, `tabTo`, `contextOf` ;
  - toutes les touches que l'interface de la version 2 écrit, relevées dans les sources (E, Entrée, Échap, Espace, Q, N, M, J, T, K, G, V ; la barre du duel K, L, J, la fenêtre L, la pause Espace) : chacune a un bouton ou se cache ;
  - les glyphes de chaque famille dans le sous-ensemble des polices, les symboles dessinés, aucune couleur dans le contour ;
  - la vibration ; le câblage (import dynamique seulement, la ville sous `isV2`, l'arène sous `charge`, `pollPad` gardé).
- **Huit fautes injectées une à une, toutes attrapées** : RT retiré de l'attaque, les commandes tenues prises bouton par bouton, l'Échap du coin donné à B, le vendeur Sony oublié, le triangle écrit en texte (hors du sous-ensemble), la manette lue malgré une touche tenue, la marche la plus lente à 0, les raccourcis du menu montrés.
- `npm test` **421 sur 421**, `npm run typecheck`, `npm run build` (le prototype de revue absent du paquet ; `PadInput` et `pad` en morceaux à part).

### Preuves — [OK]
- **Une manette simulée dans le navigateur** (`tools/pad-proof.mjs`, serveur DEV du worktree, `navigator.getGamepads` remplacé avant les scripts de la page) : **tous les contrôles passent**. Dans une partie version 2 neuve (graine 1842) :
  - A ferme les nouvelles et les touches deviennent Y et Menu ;
  - le stick marche à 3,60 m/s, à demi-inclinaison 0,58 de la pleine vitesse (attendu 0,57), B tenu court ×1,19 ; la croix marche ;
  - près de Mara, A ouvre son dialogue, la croix parcourt ses lignes, A ouvre ses marchandises, la croix atteint la pierre à aiguiser, A l'achète (60 → 52 pièces), B revient à elle, B la quitte ;
  - Y ouvre la liste, B la ferme ;
  - Menu ouvre le menu (raccourcis cachés sauf la carte), A le journal, puis RB / RB / LB : « Journal > The tournament > Your skills > The tournament » ;
  - la page du son montre l'interrupteur allumé ; la croix atteint le curseur de la musique (50 → 45) ; A coupe puis rallume la vibration ;
  - Affichage ouvre la carte ; une touche du clavier rend les touches, une pression de la manette les reprend.
- **Le combat** :
  - Y ouvre la liste sur « Enter the arena », A la fiche de match, où X laisse puis reprend une compétence (4, 3, 4 ; pied X, A, B) ; A entre dans l'arène ;
  - A « Fight » ; la barre montre B, A, X ; X tenu charge jusqu'au premier palier, RT garde la charge quand X est lâché, et la lâcher la lance ;
  - LT tient la garde, A esquive, Menu met en pause (« to resume » sous le bouton) puis reprend ;
  - un coup puissant reçu fait vibrer (`dual-rumble`, 200 ms, 0,55 / 0,4) ; le combat se décide comme dans `play-flow`, puis A « Back to the city » ;
  - **Node rejoue les 8 actions appliquées par les pages : même empreinte `5e91b2655a73ef84`**.
- **Une place, l'écran titre, les autres manettes** :
  - sur le parvis (`v2-forecourt-morning`, `cutscene=1`), la ligne de la cinématique montre A et Menu, A donne la ligne suivante, Menu passe le reste ; le stick entre dans la sortie vers l'entraînement (`arrive=forecourt`) ;
  - sur l'écran titre, la croix passe de « Continue » à « New game », A ouvre le nom, B revient, A « Continue » reprend la partie ;
  - une DualSense montre Triangle et Options en symboles ;
  - **le jeu par défaut** : aucune couche, le héros ne bouge pas, les touches restent Q et Échap ; **l'arène par défaut** : aucune couche commune.
- **Le clavier inchangé, 0 px contre `main` figé** (`git archive` de `0cc8727`, un autre serveur DEV ; seuil 0) :
  - la ville par défaut de nuit et à midi (`detshots`), la ville du mode jouable par défaut, la ville d'une partie version 2 avec son interface ;
  - le duel de la version 2 (calme, premier palier, K.O.), l'arène par défaut (calme, K.O.), le parvis d'une partie version 2 (`plaza-shots`) ;
  - dix paires à 0 px, le témoin de répétition à 0 px. **Contrôle négatif** : la ville version 2 avec les glyphes forcés diffère de `main` (7 664 px, dans le coin des touches).
  - **Sur les paquets de production** (`vite build` de la branche et de `main` figé, servis par `vite preview`) : la ville de nuit et à midi, la ville du mode jouable par défaut et en version 2, le duel version 2 (calme, K.O.) et l'arène par défaut (calme, K.O.) : huit paires à 0 px, témoin à 0 px.
- **`ui-text`** sur les pages à glyphes forcés : 17 pages sur 17 (ville Xbox et PlayStation, dialogue, fiche de match à 1600 × 900 et 390 × 844 ; menu Nintendo, son avec l'interrupteur, la ligne du son, le duel et sa pause à 1600 × 900 et 812 × 375). Le plus petit texte fait 16 px sur ordinateur et 14 px au téléphone ; seulement les deux polices embarquées, aucun caractère hors du sous-ensemble (le « − » de Nintendo compris).
- **`ui-contrast`** sur les mêmes pages, deux moments chacune : 17 sur 17 au-dessus de 4,5:1 (le plus bas 5,31:1, la ligne de l'échéance déjà mesurée en UM2 ; la ligne du son 12,89:1). Les symboles dessinés ont la couleur du texte de leur touche, sur le même voile ; l'outil ne mesure que le texte.
- **Les parcours d'avant, inchangés** : `play-flow` `V2=1` victoire (1842, jour 2) `cf669f2d59e33a8d` et par défaut `0025acce7a403773`, les empreintes de la Passe CH1, rejouées en Node ; `play-day` `V2=1` et par défaut : tous les contrôles passent ; `arena-scene-check` sous `v2=1` **PASS** (`sameAsRecorded`) et par défaut **PASS**. `npm run art:validate` sans erreur.

### Défauts trouvés — [KO → corrigé]
- **La première direction sur une page était avalée** : en changeant de contexte, le répéteur était amorcé avec la direction tenue, même au premier contact de la manette avec la page. Sur l'écran titre, le premier « bas » ne bougeait rien. L'amorçage ne vaut désormais que d'un contexte à un autre ; repasser au clavier remet le contexte à zéro.
- **Les preuves elles-mêmes** :
  - la marche mesurée près de l'étal de Mara butait sur ses collisions (0 m/s) : les marches partent de la place de départ, toutes du même point ;
  - une cinématique n'écoute qu'une ligne à la fois (entre deux lignes, la caméra bouge et les gens marchent, au clavier aussi) : la preuve attend la ligne suivante, et presse Menu jusqu'à la fin ;
  - « Continue » navigue pendant la pression : la pression part avec la page.
- **Un serveur DEV modifié pendant une preuve** : les fautes injectées dans `src/` pendant la première série ont rechargé les pages en cours (HMR) et fabriqué trois faux échecs. Toute la série a été refaite sans toucher au code (principe déjà écrit, rappelé ici).

### Le journal
- Avec cette passe, les passes gardées auraient dépassé 60 Ko (70 Ko). CH1 et CH2 (leur branche fusionnée) sont archivées mot pour mot dans `journal/56-passes-CH1-CH2.md`, avec leur ligne d'index. Le déplacement est prouvé : le corps de l'archive est identique aux 17 227 octets retirés ; CH1 et CH2 n'existent chacune que dans ce fichier ; aucune fin de ligne seule (CRLF gardé). Passes gardées : 51,7 Ko.
- `main` a bougé pendant ce travail (Passe EV1 de la séance d'audit du gameplay, des documents seulement) : les commits MN1 et MN2 sont rejoués sur une branche neuve, `claude/manette`, depuis `main`, sans push forcé ; le journal recomposé (MN1 et MN2 après EV1). Le code est identique à celui des preuves (`git diff` vide sur `src`, `tests`, `tools`).

### Limites
- **Personne n'a branché de vraie manette.** Restent à voir à l'essai de l'opérateur : si une pression de manette démarre le son dans Chrome (sinon la ligne paraît), la vibration réelle, le ressenti de la zone morte et des 30 %.
- La vibration n'existe que dans Chrome et Edge (pas dans Firefox) ; une manette sans disposition standard (`mapping` vide) est lue par ses indices tels quels.
- « New game » sur l'écran titre lance le jeu par défaut, qui ne lit pas de manette (MN-1) : une partie version 2 s'ouvre toujours par `?play=1&new=1&v2=1`.

### Où reprendre
- L'essai de l'opérateur avec sa manette : `npm run dev`, puis `/?play=1&new=1&v2=1`, la manette branchée (une pression pour que le navigateur la voie).

### Pensée
- Une page qui se pilote déjà entièrement au clavier se donne à la manette par ses propres touches. La correspondance est une table testée en Node, et le jeu au clavier se prouve à 0 px parce qu'aucune page n'a changé de chemin.
- Un « au premier contact » et un « en passant d'un contexte à l'autre » ne sont pas le même événement : une direction tenue entre deux pages s'ignore, une première pression ne s'ignore jamais.
- Une preuve de navigateur mesure dans un endroit libre : un mur à deux mètres fausse une vitesse sans faire échouer le code.

