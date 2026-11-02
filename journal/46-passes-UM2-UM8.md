# Journal de bord — archive : passes UM2, UM3, UM4, UM5, UM6, UM7, UM8 (2026-11-02)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-11-02 (Passe SN5) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe UM2 — Lot 0 de la direction « Voile » et le dialogue : la fondation remplacée partout sur la branche, montrée à l'opérateur avant la suite (2026-11-01, en cours)

### Demande
- Suite de la Passe UM1. Lot 0 selon le plan de la fiche (jetons, polices, primitives, retrait des cadres), puis un seul écran, le dialogue, montré en jeu (UM-T2) avant d'attaquer les lots 1 à 5. UM-T1 : remplacement sur la branche `claude/ui-voile-9516af`, sans double style, **rien de ce code sur `main` avant l'essai de l'opérateur**.

### Fait — [OK]
- **Jetons** (`src/ui/design/tokens.ts`) : ivoire, gris clair et un accent, or le jour, ambre la nuit ; l'encre glisse selon le ton ; `VEIL` donne les forces de voile (92, 84, 66 %) ; nouvelle échelle `TYPE`.
- **Polices** (UM-T3) : Marcellus (14 552 octets) et Source Sans 3 variable (28 872 octets), 43 Ko contre 60, téléchargées de Google Fonts, inscrites dans `FONTS.md` avec source, licence et SHA-256. Pixelify Sans et Alegreya Sans quittent le dépôt.
- **Primitives** (`system.ts`) : `--ds-veil-*`, les dégradés `--ds-grad-b`, `-t`, `-spot`, la touche au trait.
- **Retrait des cadres** (UM-S2) : `frames.ts` et ses tests retirés, plus aucun `border-image`, `--ds-px`, ni `pixelated` hors des visages, dans `style`, `townUi`, `title`, `loading`, `exits`, `cutscene`, `ArenaHud`, `DynamicHud`. Les autres écrans gardent leur mise en page, dépouillée : lots 1 et 2.
- **Le dialogue** : une bande basse `.pm-talk` dans **toutes** les parties (P4 n'existait que dans la version 2), visage, nom et réplique à gauche, choix à droite ; le HUD s'efface derrière, sauf le statut ; les flèches parcourent les choix (`arrowKeys`). Le prix n'est plus écrit deux fois (`shortLabel`, à l'affichage : la table de textes ne bouge pas) ; « You meet Mara » reste au journal et quitte l'écran.
- `tools/ui-contrast.mjs`, nouvel outil : chaque texte contre les pixels vraiment sous lui, page photographiée texte transparent, 5 % les moins favorables de chaque boîte, échec sous 4,5:1. `tools/arena-scene-page.mjs` accepte `play=1`.

### Les mesures GPU — [KO] puis [OK]
- [KO] `tools/perf.mjs` : les minuteries WebGL ne voient pas le compositing du navigateur. Dialogue de midi 8,45 ms, sans voile 8,49 ms, avec un flou lourd 8,43 ms : le contrôle négatif ne bouge pas. Ces chiffres ne disent rien des voiles.
- [KO] `tools/cadence.mjs` plafonné à 55 images/s : occupation GPU 69 à 71 % sur toutes les variantes, y compris un `backdrop-filter: blur(40px)` plein écran. Aucune sensibilité non plus.
- [OK] Le même outil **GPU saturé** (`fps=off`) : le contrôle se voit. Sans voile 110,4 et 110,7 images/s ; voile 109,3 et 104,7 ; flou plein écran 98,0 et 89,9.

| Temps d'image à GPU saturé, 1080p, 780M, médiane de 3 tours, 0 processus étranger | `main` | Voile |
|---|---|---|
| Nuit B (`seed=1842&clean=1&camera=B`) | — | 10,06 ms |
| Exploration, midi | 9,40 ms | 9,24 ms |
| Dialogue, midi | 9,68 ms | 9,47 ms |
| Dialogue, nuit | 10,48 ms | 10,14 ms |
| Duel, nuit | 9,48 ms | 9,45 ms |

- Budget E24 : tenu sur chaque page, sauf le dialogue de nuit à égalité, +0,08 ms (+0,8 %), dans la dispersion de la mesure (88 à 100 images/s selon le tour). Voile coûte moins que l'interface de `main` sur les quatre pages : il retire le plein écran assombri du dialogue et les cadres. [?] À l'opérateur (UM2-5).
- Un tour de duel à 70,4 images/s dans la série : refait en six tours, 104,4 à 107,4, `main` et Voile confondus, non reproduit.

### Le titre sur la vraie ville (UM-R4) — [OK] mesuré, non construit
- Paquet de production, cinq chargements, médianes : titre actuel sur fond noir 58 ms ; ville à midi prête 1 230 ms (+1,17 s) ; avec une visibilité recalculée 1 393 ms (+1,34 s). Premier chargement d'un navigateur : 2,0 à 2,2 s. La fiche annonçait environ une seconde. [?] L'ordre d'affichage est à l'opérateur (UM2-4).

### Les contrastes dans le vrai jeu — [OK]
- 16 pages, 2 instants par page, seuil 4,5:1, 0 texte en dessous. Dialogue sur les quatre états 8,66 à 9,37:1 ; au téléphone 8,22 et 9,34:1 ; exploration 9,93 à 11,91:1 ; duel avec alerte 5,72 à 6,45:1 ; titre 9,48:1 ; dialogue d'une place 9,17:1.
- Contrôle négatif : un texte ivoire nu sur le décor à midi donne 2,75:1, refusé par l'outil.

### Les preuves
- `npm run typecheck`, `npm test` **318 / 318**, `npm run build`, `npm run art:validate` (56 manifestes, 60 sources, 0 erreur).
- **Rien ne change sous l'interface** : paquets de production contre `main` figé (`6cafd14`), seuil 0, 1080p : ville de nuit et ville à midi (`clean=1`), arène au moment de la fenêtre, duel `v2=1` à midi sur deux moments (`hud=0`) : **0 px**. Écran de K.O. : il change, voulu (il reste affiché sous `hud=0`). Contrôle négatif : arène avec son HUD, 36,6 % des pixels.
- [KO → corrigé] Mes premières captures de l'arène diffèrent de 100 % : l'outil photographiait le fondu de l'écran de chargement, défaut déjà noté en Passe FV4. Refait avec `FREEZE_CSS=1`.
- `tools/ui-text.mjs` : 21 pages et formats, aucun texte sous 16 px, 14 au téléphone, polices embarquées chargées. [KO → corrigé] Le contrôle des textes coupés a trouvé les paliers de charge et les boutons au téléphone rognés par `overflow:hidden`, sans cadre pour les loger : refait 8 / 8 sur les pages de duel.
- `tools/arena-scene-check.mjs`, défaut, `combat=dynamic`, `v2=1` : PASS, empreintes retrouvées, sol dégagé 22 / 22, 44 / 44, 77 / 77, télégraphe 6,4 à 6,9:1. [KO → corrigé] Le voile du bas de 170 px couvrait les marques au sol sous 720 px de haut, comme la fiche l'avait prévu : la plus basse se tient à 21,6 % de la hauteur, le voile fait `min(170px, 21vh)`.
- `play-day` et `play-flow`, défaut et `V2=1`, `exits-proof` : tout passe, empreintes rejouées en Node.

### Fiche et essai
- Fiche de lot, privée : https://claude.ai/artifact/Q83foWSZ72ZS4Kc6p9kXNe (source `briefs/fiche-ui-voile-lot0.html`, cinq cartes, `decisions` vide à la publication).
- Page jouable, privée : https://claude.ai/artifact/Xz1bEgcEVWxB2fEhWh2BjR (`play=1&new=1&name=Ren&noreload=1&v2=1` : une seule page, elle ne change pas de lieu). [?] Non ouverte dans le visualiseur de claude.ai : le navigateur intégré n'y est pas connecté.

### Restes [?]
- **Chiffres** : Marcellus n'a qu'une série de chiffres, « 10 » se lit presque « IO ». La direction disait « Marcellus (titres et chiffres) » : à l'opérateur (UM2-3), rien changé.
- **Téléphone** : la bande prend 64,6 % de l'écran, le statut en plus ; 33 à 38,5 % sur ordinateur. La moitié d'écran visée est au lot 3.
- Les écrans hors dialogue sont dépouillés, pas refaits : lots 1 et 2. Les textes de développeur sont toujours là : lot 4.
- Non mesuré : les voiles sur la RTX 4060, en 2560 × 1440 ; le rendu en mouvement n'a pas été jugé par un œil humain.
- Les lots 1 à 5 attendent la réponse de l'opérateur. Rien de ce lot sur `main`.

### Pensée
- Le contrôle négatif a sauvé la mesure : deux outils rendaient un « zéro » plausible qui ne prouvait rien. Un coût de composition se mesure GPU saturé, et le contrôle lourd passe avant les chiffres.
- Un chiffre recopié de mémoire dans une fiche se remesure avant publication : mes « 58 % » du téléphone en valaient 64,6.
- Une police choisie sur une maquette se relit dans ses plus petits usages : le défaut du « 10 » y était déjà, l'image l'a laissé passer.

## Passe UM3 — La fiche du lot 0 relue, et le lot 1 : l'état, le menu unique, la liste à la demande, le titre sur la vraie ville (2026-11-02, branche)

### Les décisions de l'opérateur, mot pour mot
- Fiche https://claude.ai/artifact/Q83foWSZ72ZS4Kc6p9kXNe, 5 documents relus, tous à la recommandation, aucune note. Message de l'opérateur, mot pour mot : « Fiche remplie ».

| # | Décision | Choix de l'opérateur |
|---|---|---|
| UM2-1 | Le dialogue en jeu | « Validé, enchaîner les lots 1 à 5 » |
| UM2-2 | La fondation sur les autres écrans | « Bonne base » |
| UM2-3 | Les chiffres en Marcellus | « Chiffres en Source Sans 3 » |
| UM2-4 | Le titre sur la vraie ville | « Le titre d'abord, la ville apparaît derrière » |
| UM2-5 | Le dialogue de nuit et le budget | « Accepter l'égalité » |

- UM2-3 change le texte de la direction A (« Marcellus (titres et chiffres) ») : les chiffres de la police de titre viennent désormais de Source Sans 3, par une seconde `@font-face` sur `U+0030-0039` (`DIGITS`, `system.ts`). Les titres et les noms restent en Marcellus.

### Fait, lot 1 — [OK]
- **L'exploration** (UM-R1, UM-R2) : plus de barre de touches ni de panneau. En haut à gauche le jour, ses traits, le moment et le lieu, la prochaine échéance (TOURNOI § 11) ; à droite les pièces et la réputation, et la blessure si elle existe ; l'invite E en bas ; `Q` et `Esc` dans le coin. L'état pose ses textes sur deux voiles radiaux.
- **La liste à la demande** : `Q` ouvre une bande basse, les actions du lieu, le repos, l'attente, les personnes (Lantern Row n'a pas d'autre accès à elles). La touche `Q` a été choisie libre de tout usage : ni le déplacement ni le panneau DEV ne s'en servent. **Le combat du jour** remplace le libellé du coin par « Enter the arena for your bout », en accent, toujours visible.
- **Le menu unique** : `Esc`, plein écran, avec Carte, Journal, Tournoi, Compétences, Équipement, Son et leurs touches, puis les sauvegardes. M, J, T, K, G, V restent.
- **Les écrans** : pages sur un voile plein écran, HUD masqué derrière ; les nouvelles en bande basse. Compétences : la sélection marquée d'un trait et de l'accent, au lieu d'une teinte qui se lisait comme un bouton éteint. Équipement : quatre emplacements côte à côte. Carte : plus de « free » à chaque ligne, la phrase du haut le dit. Cinématique : la bande du dialogue, les bandes dans l'encre du ton, « Next » et « Skip » réduits à deux indications.
- **Le titre** (UM-R4, UM2-4) : il paraît tout de suite sur l'encre, la ville à midi monte derrière, l'encre s'efface ; ses boutons répondent dès le départ (« Explore » avant la fin : l'écran de chargement prend le relais). Le HUD et le panneau DEV attendent « Explore the district », et les touches pressées sur le titre restent sur lui : la ville derrière ne marche pas.
- Retirés : les étiquettes de lieu des places et de Lantern Row, redites de l'état, dont « a mock-up of the third place » (UM-R3).

### Les preuves
- `tools/ui-text.mjs` : 21 pages sur 23 au premier passage ; [KO → corrigé] les deux échecs étaient l'étiquette de lieu, retirée.
- `tools/ui-contrast.mjs`, 14 pages, deux instants : 4,82:1 au plus bas (« Menu » sur l'eau de midi), 5,31 à 6,18:1 pour l'état ; 7,4:1 sur le voile plein écran, 7,97:1 au titre. [?] Marge fine sur l'eau de midi : le foyer des voiles ponctuels passe de 55 à 68 %.
- `play-day`, défaut et `V2=1`, `exits-proof` : tout passe. [KO → corrigé] `play-flow` cliquait sur la touche du coin, qui porte le même libellé que la ligne de la liste : l'outil vise `.pm-talk`.
- [KO → réécrit] Le test qui comparait `startTown` à `d129433` au caractère près ne peut plus tenir, le titre le veut derrière lui : il vérifie désormais l'ordre titre, puis ville, et le chemin des autres adresses. La preuve au pixel reste `tools/title-proof.mjs`.

### Pensée
- Deux éléments peuvent porter le même libellé : un outil vise un conteneur, pas un texte.
- Une information redite ne se réduit pas, elle s'enlève : l'étiquette de lieu ne servait plus à rien une fois l'état au propre.

## Passe UM4 — Lot 2 : le duel en voile, un seul écran de préparation, le K.O. (2026-11-02, branche)

### Note de l'opérateur, en cours de lot
- Mot pour mot : « je trouve la nouvelle direction plutot bonne par contre je trouve que les menu/panels donc equipement/achat peut etre trop simpliste ... apres peut etre que cela pourra ette travailler apres ». Le travail continue ; une carte à ce sujet ira sur la fiche de l'essai, rien n'est changé dans le plan sans sa réponse.

### Fait — [OK]
- **Les deux HUD** (`ArenaHud`, `DynamicHud`) selon la maquette : nom en Marcellus, points de vie à droite, jauge de 6 px, résistance en filet de 2 px dont le mot ne paraît qu'une fois brisée ; les commandes au pied ; plus de titre « Cité du Tournoi », plus de carte. Le rôle et l'étape du combat restent dans les `aria-label`.
- **Les visages** restent, sans cadre, à une échelle entière : ×3 ou ×2 pour un visage généré de 24 px, ×2 ou ×1 pour un visage cuit de 32 px (la version du lot 0 les posait à ×2,25).
- **Les paliers de charge** n'apparaissent qu'à la charge, plus de rangée fantôme à l'arrêt. **L'alerte** : le texte seul sur son voile, sans losange, et le signe de priorité s'efface devant elle à toutes les tailles : une seule plaque.
- **Le K.O.** : le reste du HUD s'éteint, un mot de 120 px sur une bande fondue aux quatre bords, un filet d'accent. Il reste lisible sur l'effet de K.O. (14,09:1).
- **La préparation** (P6) : dans la version 2, un seul écran, la fiche de match de la ville, l'adversaire à gauche, les quatre compétences à droite ; à la porte de l'arène, une bande basse avec l'étape, le nom et « Fight », les combattants visibles. Le jeu par défaut garde son rapport d'observation dans cette bande. Les paragraphes de touches sont retirés : la barre est juste en dessous (`ui.arena.keys*`).

### Les preuves
- `arena-scene-check`, défaut, `combat=dynamic`, `v2=1` : PASS, empreintes retrouvées, sol dégagé 22 / 22, 44 / 44, 77 / 77, télégraphe 6,46 à 6,94:1.
- `ui-text` : 18 pages et formats sur 18. [KO → corrigé] Ma ligne de la page de la porte passait un mot sans code ; refaite au lot suivant.
- `ui-contrast`, 10 pages, deux instants : 5,75:1 au plus bas (« Attaque » à midi), K.O. 14,09:1 ; fiche de match 7,7:1 ; fenêtre basse 5,8:1.
- [KO → corrigé] `play-flow` lisait `#ah-title`, retiré : il lit l'`aria-label` du HUD. Défaut gagné, défaut perdu et `V2=1` : tout passe.

### Pensée
- Une seule plaque pour une alerte tient à une règle, pas à un réglage de taille : la règle existait pour les fenêtres basses, elle vaut partout.

## Passe UM5 — Lot 3 : le téléphone et les fenêtres basses (2026-11-02, branche)

### Fait — [OK]
- **Téléphone** (UM-L3) : une ligne d'état, deux boutons au pied, plus de rangées d'onglets. La bande de dialogue tient dans 52 % de la hauteur : les choix défilent sous la réplique, « Leave » reste collé au bas de la liste, les raisons d'un choix refusé s'effacent pour gagner la place.
- **Fenêtres basses** : la bande garde ses deux colonnes ; le duel garde la mise en page du lot 2, faces à une échelle entière.
- [OK] Une étiquette de sortie reste entière sur un écran étroit : sa moitié de largeur borne sa position (`exits.ts`), elle sortait de l'écran à l'audit.

### Les preuves
- `ui-text` en 375 × 812, 812 × 375 et 568 × 320 sur les pages des lots 1 et 2 : aucun texte sous 14 px, aucun coupé. Contrastes : dialogue au téléphone 9,03:1, duel en 812 × 375 5,8:1.
- [?] Le toucher reste hors de la tranche (E30) : ces écrans sont lus sur un téléphone, pas joués.

## Passe UM6 — Lot 4 : Explore, le chargement, les textes de développeur (2026-11-02, branche)

### Fait — [OK]
- **UM-R5** : `src/debug/Hud.ts` entre dans le système (lieu et heure sur leur voile, invite au pied) et la mini-carte quitte le jeu. Le panneau DEV ne change pas.
- **UM-R3** : le chargement ne montre plus `GENERATING WHITE/FLAT` ; il dit « Painting the day… », et la phase reste lisible par les outils dans `data-phase` (`progressOn`, `tools/startup.mjs`). Les mots « slice » quittent l'écran : titre, fin de partie, tableau, refus (« The pool is over. »). `index.html` ne nomme plus de police système.
- `tools/title-proof.mjs` compare la scène seule : le HUD a changé à dessein, le quartier non.

### Les preuves
- `tools/title-proof.mjs` sur les paquets de production contre `main` figé : toutes ses vérifications passent. « Explore the district » contre `time=midday`, panneau fermé et ouvert, et l'adresse directe : **0 px** au seuil 0. Contrôle négatif contre la nuit : 99,7 % des pixels.
- [KO → corrigé] Premier passage à 3 % : le masque épargnait tout `canvas`, donc la mini-carte de `main` restait dans l'image. Il vise désormais `#view`.
- `tools/startup.mjs` relit ses phases par `data-phase` : le temps de peinture revient (336 ms).
- `npm test` **321 / 321** : le refus des parties finies et le tableau par défaut changent de texte, comme UM-R3 le demande ; les empreintes des parties scriptées n'ont pas bougé.

### Pensée
- Un masque « tout sauf la scène » se pose sur l'identifiant de la scène, pas sur son type d'élément.

## Passe UM7 — Lot 5 : le mouvement, le bilan des mesures, l'essai de l'opérateur (2026-11-02, branche)

### Fait — [OK]
- **Le mouvement**, comme le décrit la direction A : fondu et glissement de 8 px en 160 ms à l'entrée des pages, la bande basse qui monte du bord, les filets des listes tracés de gauche à droite, l'invite et l'alerte qui glissent, le K.O. qui pose son mot puis son trait (`ds-in`, `ds-rise`, `ds-rule`). Rien ne bouge sous `prefers-reduced-motion`. [?] Jugé sur captures et par test : le rendu en mouvement attend l'œil de l'opérateur.
- Le prix n'est plus écrit deux fois non plus sur « (5 coins) » sans phrase, vu sur la capture de Hilde.

### Les mesures GPU finales — [KO] puis [OK]
- [KO] Première série à GPU saturé : 64 à 120 images/s, un duel à +1 ms contre `main`. La cause était la mienne : les onglets du panneau du navigateur ouvraient l'adresse nue, qui fait désormais tourner la ville derrière le titre. Ils comptaient comme un processus étranger. Série jetée, onglets fermés.
- [OK] Le duel isolé, puis les pages, au calme, quatre tours sur quatre sans processus étranger, 1080p, 780M, GPU saturé :

| Page | `main` | Voile |
|---|---|---|
| Nuit B (`seed=1842&clean=1&camera=B`) | — | 9,89 ms |
| Exploration, midi | 8,42 ms | 8,47 ms |
| Exploration, nuit | 10,36 ms | 9,76 ms |
| Dialogue, nuit | 9,87 ms | 9,79 ms |
| Page plein écran, nuit | — | 9,66 ms |
| Titre sur la ville | — | 7,77 ms |
| Duel, nuit | 8,54 ms | 8,54 ms |

- Le duel, isolé : `main`, Voile, sans voiles, sans transitions et sans HUD donnent 8,52 à 8,55 ms, 114,6 à 118,3 images/s. Le coût des voiles n'y est pas mesurable.
- **E24 tenu** sur toutes ces pages. Les pages de nuit varient d'un tour à l'autre (86 à 108 images/s) : à ces niveaux, 0,1 ms ne se lit pas. L'égalité acceptée en UM2-5 n'a plus lieu d'être invoquée : le dialogue de nuit passe sous la nuit B dans cette série, sans que l'écart soit lisible.

### Les preuves finales, sur le code de cette passe
- `npm run typecheck`, `npm test` **322 / 322**, `npm run build`, `npm run art:validate`.
- `ui-text` : **54 pages et formats sur 54**. `ui-contrast`, 25 pages, deux instants : 5,31:1 au plus bas, sur la ligne d'échéance ; duel 5,75:1 ; titre sur la ville 8,22:1 ; K.O. 14,08:1 ; téléphone 9,03:1 ; Explore 9,6:1.
- `arena-scene-check`, trois règles : PASS, sol dégagé 22, 44, 77 cas, empreintes retrouvées.
- `play-day` défaut et `V2=1`, `exits-proof` ; `play-flow` sur le paquet de production, victoire, défaite, `V2=1` : tout passe.
- `title-proof` et paquets de production contre `main` figé : **0 px** sous l'interface, ville de nuit, ville à midi, « Explore the district » panneau fermé et ouvert, arène, duel `v2=1` sur deux moments.

### L'essai
- Fiche privée : https://claude.ai/artifact/BMswCMs729J2uPbU8C23Df (source `briefs/fiche-ui-voile-essai.html`, trois cartes, `decisions` vide à la publication). Page jouable republiée, même adresse que la Passe UM2, toujours non ouverte dans le visualiseur.
- La note de l'opérateur sur l'équipement et les achats (Passe UM4) y a sa carte : un lot à part, le héros en grand, le détail de la ligne sélectionnée, la comparaison avant et après, sans image neuve.

### Restes [?]
- Non mesuré : la RTX 4060, le 2560 × 1440. Les cinématiques n'ont pas de capture de preuve : relues dans le code, à voir en jeu.
- Le chapitre du téléphone reste de la lecture : le toucher est hors de la tranche (E30).
- La branche attend la réponse de l'opérateur : rien de ce code sur `main` (UM-T1).

### Pensée
- Une mesure de GPU se lance fenêtres de test fermées : une page qui, depuis ce lot, fait tourner une scène n'est plus une page au repos.
- Un écart qui surprend se décompose avant de se justifier : retirer un à un voiles, transitions et HUD a montré qu'il n'existait pas.

## Passe UM8 — L'essai de l'opérateur relu : Voile fusionnée dans `main` (2026-11-02)

### Les décisions de l'opérateur, mot pour mot
- Fiche https://claude.ai/artifact/BMswCMs729J2uPbU8C23Df, 3 documents relus, tous à la recommandation, aucune note. Message de l'opérateur, mot pour mot : « Fiche remplie ».

| # | Décision | Choix de l'opérateur |
|---|---|---|
| UM7-1 | L'ensemble en jeu | « Fusionner dans main » |
| UM7-2 | Le mouvement | « Garder » |
| UM7-3 | Enrichir l'équipement et les achats | « Lot à part : héros, détail, comparaison » |

- UM7-1 lève la réserve d'UM-T1 : l'interface A « Voile » est celle de `main`. UM7-3 n'entre pas dans cette fusion : c'est une tâche à part, sans image neuve, le héros en grand, le détail de la ligne sélectionnée et la comparaison avant et après.

### Fait — [OK]
- La branche repart de `main` à jour (`c965623`, Passe CX4) : ses six commits rejoués sans push forcé, `main` reste linéaire. Le seul fichier en commun avec la séance de combat qui entrait en conflit était `JOURNAL.md`, deux ajouts au même endroit, les deux gardés.

### Les preuves, sur le code fusionné
- `npm run typecheck`, `npm test` **323 / 323**, `npm run build`, `npm run art:validate` (61 manifestes, 85 sources, 0 erreur).
- **Rien ne change sous l'interface** : paquets de production contre `main` figé (`c965623`), seuil 0 : ville de nuit et à midi, arène, duel `v2=1` sur deux moments, « Explore the district » panneau fermé et ouvert, l'adresse directe : **0 px**.
- `arena-scene-check`, défaut et `v2=1` : PASS, sol dégagé 22 / 22 et 77 / 77, empreintes retrouvées, télégraphe 6,46 et 6,94:1.
- `ui-text` avec les feuilles de la Passe CX4, Vessa et Orla, et la fiche de match : 4 pages sur 4.
- `play-day` ; `play-flow` sur le paquet de production, victoire, défaite, `V2=1` : tout passe.
- Mesures GPU et contrastes : ceux de la Passe UM7 ; le rejeu ne touche à aucune règle de style.

### Journal — [OK] archivage
- Les passes gardées faisaient 72,7 Ko. CA3 à CA7, closes, partent d'un seul bloc vers `journal/44-passes-CA3-CA7.md` (21 215 octets) ; restent 52,5 Ko. Preuve : corps de l'archive égal au bloc, chaque passe dans un seul fichier, les autres passes inchangées.

### Restes [?]
- Le lot de l'équipement et des achats (UM7-3).
- Non mesuré : les voiles sur la RTX 4060, en 2560 × 1440. Les cinématiques n'ont pas de capture de preuve.
- La page jouable publiée montre le code d'avant le rejeu sur `main` : même interface, sans les feuilles de la Passe CX4.

### Pensée
- Un fichier de journal écrit par deux séances à la fois se rejoue en union : les deux ajouts restent, aucun n'est à arbitrer.

