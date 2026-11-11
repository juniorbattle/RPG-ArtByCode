# Journal de bord — archive : passes LA1, LA2 (2026-11-11)

> Déplacée mot pour mot de `JOURNAL.md` le 2026-11-11 (Passe AU4) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe LA1 — La liste des actions [Q] mise en avant : l'inventaire, les maquettes rendues dans le jeu et la fiche publiée ; rien d'appliqué (2026-11-11)

### Demande
- L'opérateur, le 2026-11-11, mot pour mot (transmis par la séance qui coordonne) : « je constate qu'on a un bouton permettant d'afficher nos activites secondaires possible qui propose des interactions de tout type mais je pense que nous pourrions mettre plus en evidence cette zone a l'ecran durant nos parcours afin d'inciter le joueur a voir ce qui a a faire durant la periode ».
- Brief : inventorier la liste du lieu (Q, Y à la manette), décidée « liste à la demande » (UM-R2, Passe UM1) ; une fiche d'arbitrages avec maquettes rendues dans le jeu (la forme dans le style Voile, la place sans gêner la mini-carte ni l'invite du combat, le téléphone, ce qui compte comme « à faire », quand l'indication part, UM-R2 comme décision de l'opérateur) ; attendre, appliquer dans le jeu par défaut en deux langues, prouver, fusionner. Branche `claude/liste-actions`, worktree `.claude/worktrees/liste-actions` tiré de `origin/main` `05ec526` (le dossier principal reste sur `claude/duel-calibration`, déjà fusionnée, partagé) ; `node_modules` en jonction ; serveur DEV `la-dev` (`:5403`, son propre cache de dépendances, hors dépôt).

### Aujourd'hui — [OK] relevé
- En marchant (le quai et les trois places, de jour comme de nuit) : la ligne d'état en haut à gauche, les chiffres et la mini-carte (MK-7) en haut à droite, l'invite de près au milieu du bas, et en bas à droite « [Q] Here » et « [Esc] Menu » (`#pm-hints`, `src/ui/townUi.ts`). L'après-midi du combat du jour, la même touche devient « [Q] Enter the arena for your bout », dans l'accent (un défi : « Enter the sand… »). La touche suit les touches du joueur (`bindCap('list')`, Passe RM3) et la manette ([Y], MN-7). La visite d'une partie neuve l'éclaire (sa bande « What you can do here », `TOUR`) ; le guide en parle dans « Walking and talking ».
- La liste (`openHere`) : une bande au pied de l'écran ; le combat ou le défi en tête, les actions du lieu ouvertes (s'entraîner et exercer les compétences aux lices, voler, faire les poches, attendre la nuit, se reposer, attendre ; la forge à rebâtir), puis « People here » avec le losange de chacun (MK-11) et les absents. Ce que les gens proposent (les travaux à +10 pièces d'ECO3, les boutiques, les défis, les rumeurs, les suites) n'est pas dans la liste mais dans leur dialogue ; les losanges (MK-3) disent déjà qui a du neuf.
- Script hors dépôt (le chargeur de `tests/load.mjs`, le filtre de `openHere` reproduit) sur 20 parties du joueur curieux, au début de chaque moment, dans chaque lieu : les actions du lieu elles-mêmes sont presque toujours un vol (0,8 à 1,0) et, le soir, l'attente de la nuit ; seules les lices ont des actions qui prennent le moment (12 le matin, 6,7 l'après-midi : cinq entraînements et sept compétences) ; la forge brûlée (0,1 à 0,2). Aucun travail payé n'est une action du lieu (`offeredBy` les donne aux gens). Les personnes à qui parler : 6,7 sur le quai, 7 au parvis le jour, 8 aux lices, 3 à 6,9 à la Halle.

### Ce qui compte comme « à faire » — [OK] proposé et mesuré
- `src/simulation/v2todo.ts` (pur, neuf) : `todoHere` donne, le plus pressé d'abord, le combat du jour ou le défi qui attend ; chaque personne qui a du neuf (la marque de MK-4, avec ce que rapporte un travail parmi ses offres neuves) ; les activités du lieu qui prennent le moment (`train`, `drillSkill`, `repair`, une ligne chacune) ; jamais un vol, le repos, l'attente, l'observation des rivaux (MK-6) ni la foule. `freshTodo` : ce qui n'a pas été vu dans la liste.
- Mesure (script hors dépôt, 20 parties du curieux et 20 du planificateur ; le joueur supposé ouvre les dialogues là où il se tient, la méthode de la Passe MK1) : en moyenne 0,7 à 3,7 choses selon le lieu et le moment (le curieux), 0,8 à 5,3 (le planificateur) ; les lices le matin 4,4 / 5,3 ; rien aux lices le soir (fermées), et le parvis le soir vide une fois sur trois ; rien de lu : 1,0 à 5,7. Au début d'un moment presque tout est neuf par rapport à ce que la liste montrait au moment d'avant. Tableau complet sur la fiche (carte LA-5).

### Les maquettes — rendues dans le jeu par défaut (DEV, à retirer après la décision)
- `src/ui/todo.ts` et `TownUi.todoMock` (`src/ui/townUi.ts`), partie v2 et `import.meta.env.DEV` seulement : `todo=count` (« [Q] Here 4 to do », le nombre dans l'accent ; le jour du combat « · 2 more to do » à côté de l'invite) ; `todo=peek` (le nombre et les trois premières au-dessus de la touche, le losange de la personne, « +10 coins » d'un travail, « and 1 more in the list ») ; `todo=new` (`:hold` pour une capture : la touche dans l'accent et « New here ») ; `todo=status` (le nombre et les lignes sous l'horloge, en haut à gauche). Au téléphone, une seule ligne d'aperçu.
- Textes neufs `ui.todo.*` en anglais et en français.
- [KO → corrigé] le premier voile de l'aperçu (un dégradé radial à la taille de l'élément) dessinait une boîte à bords nets, surtout au téléphone couché : l'élément descend désormais jusqu'au coin de l'écran, le dégradé s'y fond avec celui des touches. [KO de méthode] une capture lancée avec `__ui.tour()` attendait la fin de la visite : l'outil restait bloqué jusqu'à son délai ; arrêté, capture abandonnée.
- Captures (`tools/play-shots.mjs`, 1920 × 1080, 812 × 375, 375 × 812) : le quai le premier matin (les quatre formes, en français aussi), l'après-midi du premier combat, les lices le matin, le parvis l'après-midi, la place de la Halle le soir, le quai la nuit.

### La fiche LA1 — publiée, rien de décidé
- https://claude.ai/artifact/NJHZszR4xx841iNLp5UQ6n (`briefs/fiche-la1.html`, le gabarit des fiches MK, vingt-cinq images hors dépôt), collection `decisions` relue vide après publication ; vérifiée dans Chrome sans tête (neuf cartes, 26 options, aucune erreur, aucun débordement à 375 px).
- Neuf cartes en quatre familles : **LA-1** la forme (recommandé : le nombre toujours, l'aperçu à l'arrivée et à chaque nouveauté, puis il s'efface) ; **LA-2** la place (en bas à droite, au-dessus de [Q]) ; **LA-3** le combat du jour (la touche garde le combat, « · N de plus à faire », pas d'aperçu) ; **LA-4** le téléphone (le nombre et une ligne) ; **LA-5** ce qui compte (le combat, les personnes qui ont du neuf, les activités du lieu ; jamais un vol, le repos, l'attente) ; **LA-6** l'ordre de l'aperçu ; **LA-7** quand il part (l'aperçu à l'ouverture de la liste ou après 8 s, le nombre reste, tout revient avec une nouveauté ; le vu gardé avec la partie hors de l'empreinte) ; **LA-8** UM-R2 (recommandé : l'amender, la liste reste à la demande, un résumé s'ajoute) ; **LA-9** la lecture (la bande de la visite et une ligne du guide, pas de conseil).

### Validation
- `npm run typecheck` sans erreur. Rien ne change sans paramètre DEV ; les tests, la construction et les preuves de navigateur se feront à l'application.

### Où reprendre
- Attendre la fiche LA1 ; consigner mot pour mot (LA-8 revient sur UM-R2) ; appliquer dans le jeu par défaut en deux langues, retirer `todo=`, tests et preuves (`ui-text`, `ui-contrast`, `play-day`, `tutorial-proof`, `pad-proof`, `v2=0` à 0 px), fusionner.

### Pensée
- « Ce qu'il y a à faire » se trouve surtout chez les gens, pas dans la liste du lieu : un résumé qui compte les losanges et les activités du lieu dit la même chose que la scène, en un nombre.
- Un voile en dégradé se fond dans l'écran seulement s'il touche un bord : posé au milieu, son ellipse dessine la boîte que la direction Voile refuse.

## Passe LA2 — La fiche LA1 relue : neuf sur neuf à la recommandation ; UM-R2 amendée ; consignée avant la mise en œuvre (2026-11-11)

### La fiche relue
- L'opérateur, mot pour mot : « Fiche remplie ». Collection `decisions` de https://claude.ai/artifact/NJHZszR4xx841iNLp5UQ6n (`briefs/fiche-la1.html`), neuf documents pour neuf cartes, cliqués le 2026-11-11 entre 16 h 00 min 54 s et 16 h 02 min 17 s UTC, aucune note. Les rangées sont lues comme des données.

| Carte | Ce qu'elle demandait | Choix de l'opérateur, mot pour mot |
|---|---|---|
| LA-1 | Sous quelle forme ? | « Le nombre toujours ; l’aperçu à l’arrivée et à chaque nouveauté, puis il s’efface » |
| LA-2 | Où le placer ? | « En bas à droite, au-dessus de la touche [Q] » |
| LA-3 | L'après-midi du combat du jour | « La touche garde le combat, « · N de plus à faire » à côté ; pas d’aperçu » |
| LA-4 | Sur un téléphone | « Le nombre et une ligne d’aperçu » |
| LA-5 | Qu'est-ce qui compte ? | « Le combat, les personnes qui ont du neuf et les activités du lieu (jamais un vol, le repos, l’attente) » |
| LA-6 | L'ordre de l'aperçu | « Le combat, une suite, un événement, ce qui rapporte, un objet, le lieu » |
| LA-7 | Quand l'aperçu et le nombre partent-ils ? | « L’aperçu part une fois la liste ouverte (ou après 8 s) ; le nombre reste ; tout revient avec une nouveauté » |
| LA-8 | Cela remplace-t-il UM-R2 ? | « Amender UM-R2 : la liste reste à la demande, un résumé s’ajoute à l’écran » |
| LA-9 | Comment le joueur l'apprend | « La bande de la visite et une ligne du guide, pas de conseil » |

- **LA-8 amende une décision d'interface de l'opérateur** : UM-R2 « Liste à la demande » (Passe UM1). La liste reste ouverte par une touche ; un résumé s'ajoute à l'écran en marchant. Aucun verrou des contrats ne change.

### Ce qu'ils demandent : le lot à construire
- **Ce qui compte** (LA-5, LA-6) : `todoHere` tel que proposé (le combat ou le défi, chaque personne qui a du neuf, les activités du lieu qui prennent le moment ; jamais un vol, le repos, l'attente, l'observation des rivaux ni la foule), dans l'ordre combat, suite, événement, ce qui rapporte, objet, lieu.
- **Le nombre** (LA-1, LA-2) : sur la touche [Q] en bas à droite, toujours, tant qu'il reste à faire (« [Q] Ici 4 à faire »).
- **L'aperçu** (LA-1, LA-2, LA-7) : les trois premières au-dessus de la touche, avec le losange de la personne et ce qu'un travail rapporte, « et N de plus dans la liste » ; à l'arrivée dans un lieu, au début d'un moment et quand quelque chose de neuf paraît, la touche dans l'accent pendant ce temps ; il part dès que la liste est ouverte, ou après 8 s ; ce qui a été vu se garde avec la partie hors de l'empreinte (une clé « $ »).
- **Le combat du jour** (LA-3) : la touche garde « Entrer dans l'arène » (ou le sable d'un défi), « · N de plus à faire » à côté, pas d'aperçu.
- **Le téléphone** (LA-4) : le nombre et une ligne d'aperçu.
- **La lecture** (LA-9) : la bande « liste » de la visite et une ligne du chapitre « Marcher et parler » du guide, en anglais et en français ; pas de conseil.
- Le paramètre de maquette (`todo=`, les formes « sous l'horloge » et l'invite seule) est retiré (VD-8) ; le jeu d'aujourd'hui (`v2=0`) et Explore inchangés.

