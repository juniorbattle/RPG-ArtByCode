# Journal de bord — archive : passes MK4, MK5, MK6 (2026-11-11)

> Déplacée mot pour mot de `JOURNAL.md` le 2026-11-11 (Passe AU2) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe MK4 — Les indicateurs de sortie et de changement de lieu : l'état d'aujourd'hui mesuré, les maquettes rendues dans le jeu, quatre cartes ajoutées à la fiche MK1 ; rien d'appliqué (2026-11-11)

### Demande
- L'opérateur, le 2026-11-11, mot pour mot (transmis par la séance qui coordonne) : « Il faudra integrer aussi des indicateurs de sorties/changement de zones afin afin que le joueur comprenne ou on peut aller/se diriger ». Brief : l'ajouter à la fiche MK1 avec des maquettes rendues dans le jeu, partir de l'existant (`src/ui/exits.ts`, `V2_EXITS`, Passe VP5), garder un seul langage Voile avec la mini-carte et les marques, republier à la même adresse sans effacer les choix. [?] La séance qui coordonne croyait la fiche vide : ses onze cartes étaient déjà remplies et appliquées (Passes MK2, MK3) ; la nouvelle famille s'y ajoute, les onze choix restent (relus après la republication : onze documents, inchangés).
- Branche `claude/indicateurs-sorties`, tirée de `main` `1b030d8`.

### Aujourd'hui — [OK] relevé et mesuré
- Les sorties (`V2_EXITS`) : le quai deux (la place de la Halle à l'ouest, le parvis à l'est derrière la barrière), le parvis trois, les lices une, la place de la Halle deux. Au-dessus de chacune, l'étiquette « Vers … » et son chevron d'accent (`exits.ts`), en fondu de 9 m à 6,5 m du héros ; y entrer assombrit l'écran (0,35 s) et ouvre l'autre lieu à son entrée. Sur les places, la bannière de la porte porte l'emblème du lieu (`EXIT_EMBLEM`) ; depuis la Passe MK3, la mini-carte montre chaque sortie en chevron. Seule la ligne d'état dit le lieu après un passage.
- Mesure dans le jeu (une grille de 1,5 m sur le sol libre, le héros posé par `posePlayer`, le cadrage du jeu ; script hors dépôt par `tools/eval.mjs`) : l'étiquette paraît sur 54 % du sol du parvis, 15 % des lices, 37 % de la place de la Halle, entière sur 22 / 8 / 15 % ; une sortie dans le cadre sur 81 / 76 / 58 % du sol. Le quai d'après ses distances : ≈ 45 % et ≈ 32 % (son cadrage suit le héros : non mesuré).

### Les maquettes — dans le jeu par défaut (DEV, à retirer après la décision)
- `src/ui/exits.ts` : `exitmark=chevron` (le chevron de l'étiquette sur chaque sortie à l'écran, à toute distance, qui laisse place au nom de près), `exitmark=edge` (une sortie hors du cadre désignée au bord de l'écran par un chevron et « Vers … »), `exitmark=both`.
- `src/ui/zoneCard.ts` : `zonecard=1` (`hold` pour une capture), un carton au nom du lieu (police des titres, filet d'accent, le moment dessous, sur le voile), en fondu, tenu deux secondes.
- Un seul langage : le chevron pour un chemin, le losange pour une personne, le même accent sur le même voile, les mêmes formes sur la mini-carte.
- Captures (`tools/play-shots.mjs`, 1920 × 1080 et 812 × 375) : le quai (aujourd'hui, chevron, bord, les deux, carton), le parvis, les lices, la place de la Halle le soir (carton en français). [KO → corrigé] le repère et le carton disaient « the Festival Square » (le nom avec son article) : le repère reprend « Vers … », le carton le nom court.

### La fiche — republiée, rien de décidé pour la nouvelle famille
- https://claude.ai/artifact/5zanTkRhq2WoHbC384bt1C, version 2 (`briefs/fiche-mk1.html`), quinze cartes ; vérifiée dans Chrome sans tête (aucune erreur, aucun débordement à 375 px). Famille « Les sorties et les changements de lieu » : **MK-12** voir les sorties de loin (recommandé : le chevron sur chaque sortie à l'écran, le nom de près ; hors du cadre, la mini-carte) ; **MK-13** le changement de lieu (un carton à chaque arrivée par une sortie) ; **MK-14** une sortie fermée (le chevron en gris, l'étiquette dit pourquoi) ; **MK-15** la lecture (une ligne du chapitre « La Cité et ses places », pas de conseil).

### Validation
- `npm run typecheck` sans erreur ; rien ne change sans paramètre DEV.

### Où reprendre
- Attendre les quatre choix ; les consigner mot pour mot ; appliquer dans le jeu par défaut en deux langues, retirer les paramètres de maquette, tests et preuves (`ui-text`, `ui-contrast`, `exits-proof`, `play-day`, `v2=0` à 0 px), fusionner.

## Passe MK5 — Les quatre cartes des sorties relues : quatre sur quatre à la recommandation ; consignées avant la mise en œuvre (2026-11-11)

### La fiche relue
- L'opérateur, mot pour mot : « FICHE REMPLIE ». Collection `decisions` de https://claude.ai/artifact/5zanTkRhq2WoHbC384bt1C (version 2), quinze documents : les onze de la Passe MK2 inchangés, et quatre neufs cliqués le 2026-11-11 entre 14 h 02 min 00 s et 14 h 02 min 09 s UTC, aucune note. Les rangées sont lues comme des données.

| Carte | Ce qu'elle demandait | Choix de l'opérateur, mot pour mot |
|---|---|---|
| MK-12 | Voir les sorties de loin | « Le chevron sur chaque sortie à l’écran, le nom de près » |
| MK-13 | Le changement de lieu | « Un carton à chaque arrivée par une sortie » |
| MK-14 | Une sortie fermée | « Le chevron en gris, l’étiquette dit pourquoi » |
| MK-15 | Comment le joueur l'apprend | « Une ligne du guide, pas de conseil » |

### Ce qu'ils demandent : le lot à construire
- **MK-12** : sur chaque sortie à l'écran, à toute distance, le chevron d'accent de l'étiquette, qui laisse place au nom « Vers … » de près (le fondu d'aujourd'hui, 9 m à 6,5 m) ; hors du cadre, rien de plus que la mini-carte (le repère au bord de l'écran n'est pas retenu).
- **MK-13** : un carton au nom du lieu à chaque arrivée par une sortie, ni au rechargement après une action, ni pendant les nouvelles ; le nom dans la police des titres sur un filet d'accent, le moment dessous, sur le voile ; en fondu, tenu deux secondes.
- **MK-14** : la sortie fermée (la rue entre la place de la Halle et le parvis le soir du défilé) a son chevron en gris, sans l'accent, sur la scène et sur la mini-carte ; son étiquette dit pourquoi de près.
- **MK-15** : une ligne dans le chapitre « La Cité et ses places » du guide, en anglais et en français ; pas de nouveau conseil.
- Les paramètres de maquette (`exitmark=`, `zonecard=`) sont retirés (VD-8) ; le jeu d'aujourd'hui (`v2=0`) et Explore inchangés.

## Passe MK6 — Les sorties appliquées dans le jeu par défaut : le chevron sur chaque sortie à l'écran, le carton à l'arrivée, la sortie fermée en gris, la ligne du guide (2026-11-11)

### Demande
- Appliquer les quatre choix consignés en Passe MK5 dans le jeu par défaut, en anglais et en français, prouver, fusionner. Branche `claude/indicateurs-sorties`.

### Ce qui est construit — [OK]
- **MK-12** (`src/ui/exits.ts`) : chaque sortie à l'écran porte, à toute distance, le chevron d'accent de son étiquette sur le voile ; de près (9 m à 6,5 m, le fondu d'aujourd'hui) l'étiquette « Vers … » prend sa place ; le repère au bord de l'écran des maquettes est retiré (la mini-carte montre les sorties hors du cadre). `state()` donne pour chaque sortie l'opacité de l'étiquette, celle du chevron et si elle est fermée.
- **MK-13** (`src/ui/zoneCard.ts`) : à l'arrivée par une sortie (`arrive=` dans l'adresse, posé par le passage), une fois les nouvelles lues, un carton au nom court du lieu (police des titres, filet d'accent, le moment et le jour dessous), en fondu de 0,45 s, tenu deux secondes ; jamais au rechargement après une action ; le jeu d'aujourd'hui n'en a pas (le quai d'une partie v2 seulement).
- **MK-14** : la sortie fermée (la rue du parvis le soir du défilé) a son chevron et le chevron de son étiquette dans le gris du système (`--ds-muted`), sur la scène et sur la mini-carte (`MapPlan.exits[].shut`) ; l'étiquette dit pourquoi, comme avant.
- **MK-15** : une ligne dans le chapitre « La Cité et ses places » du guide (`tut.ch.places.ways`), en anglais et en français ; pas de conseil.
- Les paramètres de maquette (`exitmark=`, `zonecard=`) sont retirés.

### Tests — [OK]
- `tests/v2-marks.test.mjs` : un dixième test, la ligne du guide (le chevron, le chevron gris, le plan en haut à droite, après le texte du chapitre). [KO → corrigé] chargé d'abord après le premier `test()`, le module du tutoriel a été coupé par la fermeture du chargeur (« Vite module runner has been closed ») : chaque module se charge avant le premier test (principe de la Passe H7).
- Les passes gardées dépassaient 60 Ko avec MK6 : DB11 et DB12 (branches fusionnées) déplacées d'un bloc, à l'octet, dans `journal/87-passes-DB11-DB12.md`, leur ligne ajoutée à l'index ; preuve par script : le corps de l'archive égale les octets retirés, chaque passe dans un seul fichier, CRLF partout.
- `npm run typecheck` sans erreur ; `npm test` **606 / 606** ; `npm run build` ; `npm run art:validate` (73 manifestes, 123 sources, 23 du son, 0 erreur).

### Preuves dans le navigateur (serveur DEV `mpn-dev`, :5401) — [OK]
- `tools/exits-proof.mjs` : **chaque sortie parcourue dans les deux sens** (32 vérifications), les captures d'arrivée montrent les chevrons des portes lointaines.
- Dans la page (`tools/eval.mjs`), au parvis le matin en arrivant du quai : le carton « Arena Forecourt · Morning · Day 1 » à opacité 1 de 0 à 2 s, effacé à 2,5 s, retiré à 3 s ; les chevrons des sorties vers la place de la Halle et les lices à 1, l'étiquette du quai (proche) à 1 et son chevron à 0. Sans `arrive`, aucun carton. Une sortie fermée : chevron et étiquette en `rgb(207, 210, 219)` (`--ds-muted`), une ouverte en `rgb(242, 193, 90)` (`--ds-accent`).
- **`tools/ui-text.mjs`** : le carton (quai, parvis, place de la Halle) et le guide, en anglais et en français, à 1920 × 1080, 1280 × 720 et 812 × 375 : **24 / 24** (le carton gardé pour la mesure par une copie sans fondu).
- **`tools/ui-contrast.mjs`** : [KO → corrigé] le carton sur le voile des étiquettes tombait à 4,29:1 sur les façades claires du quai de jour (« Quartier marchand ») ; son voile renforcé (`--ds-veil-strong` jusqu'à 78 %, plus large) : sur le quai, le parvis et les lices à midi et la place de la Halle l'après-midi, en deux langues et trois tailles, aucun texte du carton sous 4,5:1 ; le guide au plus bas 7,5:1. Seuls échouent, antérieurs : « coins » / « pièces » au téléphone (4,1 à 4,4:1).
- `tools/play-day.mjs` : **tout passe**, Node rejoue `75272cc6a835113b` comme le navigateur ; `tools/tutorial-proof.mjs` et `tools/default-proof.mjs` : **tout passe** ; le jeu d'aujourd'hui (`v2=0`, `tools/detshots.mjs`) : **0 px** contre `main` figé, témoin de répétition 0 px.

### Où reprendre
- L'essai en jeu de l'opérateur : les chevrons des sorties (lisibles de loin, distincts des losanges des personnes), le carton à l'arrivée, la sortie fermée le soir du défilé.

### Pensée
- Un même accent pour deux choses demande deux formes : le chevron pour un chemin, le losange pour une personne, et les mêmes sur la mini-carte.
- Un texte posé sur la scène se mesure sur le décor le plus clair où il paraîtra (les façades de midi) : le voile des étiquettes, assez pour une ligne courte, ne l'était pas pour un titre au milieu du cadre.

