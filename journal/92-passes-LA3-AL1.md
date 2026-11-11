# Journal de bord — archive : passes LA3, AL1 (2026-11-11)

> Déplacée mot pour mot de `JOURNAL.md` le 2026-11-11 (Passe AC1) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe LA3 — La fiche LA1 appliquée dans le jeu par défaut : le nombre sur la touche [Q], l'aperçu des trois premières, le vu gardé hors de l'empreinte (2026-11-11)

### Demande
- Appliquer les neuf choix consignés en Passe LA2 dans le jeu par défaut, en anglais et en français, prouver, fusionner. Branche `claude/liste-actions`.

### Ce qui est construit — [OK]
- **Ce qui compte** (LA-5, LA-6) : `src/simulation/v2todo.ts` (pur) : `todoHere` (le combat du jour ou le défi, chaque personne qui a du neuf, les activités du lieu qui prennent le moment, une ligne chacune ; jamais un vol, le repos, l'attente, l'observation des rivaux ni la foule), `orderTodo` (combat, suite, événement, ce qui rapporte, objet, lieu ; stable), `freshTodo`. La clé d'une personne est courte (une empreinte de ses offres neuves) : elle change quand une offre est neuve.
- **Le vu** (LA-7) : `seeTodo` garde, à l'ouverture de la liste, les clés de ce qu'elle tient à faire et qu'elle a été ouverte ici à ce moment (`openedKey`), dans `V2State.$todo` (une clé « $ » : dans la sauvegarde, hors de l'empreinte ; 160 clés au plus) ; `todoSeen`.
- **Le nombre et l'aperçu** (LA-1 à LA-4, LA-7) : `src/ui/todo.ts` (`TodoCue`), branché dans `TownUi` (le quai et les trois places d'une partie v2) : « [Q] Here 4 to do » / « [Q] Ici 4 à faire », le nombre dans l'accent et la police des titres, toujours tant qu'il reste à faire ; au-dessus, sur un voile qui monte du coin de l'écran (sans bord), « To do here » / « À faire ici » et les trois premières (le losange de la personne, « +10 coins » d'un travail, un petit trait et « 1 slot » pour une activité du lieu), puis « and N more in the list » ; à l'arrivée (une fois les nouvelles lues, et la visite d'une partie neuve finie) et dès que quelque chose de neuf paraît, la touche dans l'accent pendant ce temps ; il part à l'ouverture de la liste ou après 8 s, en fondu ; une page rechargée ne le remontre pas si la liste a été ouverte ici à ce moment et que rien n'est neuf. Caché pendant une page, un dialogue ou la liste. Le jour du combat, la touche garde « Enter the arena for your bout » et dit « · 2 more to do » / « · 2 de plus à faire » à côté, sans aperçu. Au téléphone, une ligne d'aperçu.
- **La lecture** (LA-9) : la bande « liste » de la visite (`tut.tour.list.body`) et une ligne du chapitre « Walking and talking » du guide (`tut.ch.moving.todo`), en anglais et en français ; pas de conseil.
- **Le voile des touches au téléphone couché** : [KO → corrigé] l'après-midi du combat, « [Q] Enter the arena for your bout · 2 more to do » allonge la ligne ; le voile radial des touches (`--ds-grad-spot`, à la taille de la ligne) laissait « Menu » à 1,97:1 (déjà 2,37:1 sur `main` figé, sans le texte de plus) ; un remplissage plus large déplaçait le défaut sur [Q] (3,65:1). Sur cette taille, dans une partie v2, le voile passe sur un pseudo-élément plus large que la ligne (sans bord) : 4,65 à 4,71:1 au plus bas.
- Le paramètre de maquette `todo=` et ses formes (sous l'horloge, l'invite seule) sont retirés. `AGENTS.md` (Interface : UM-R2 amendée par LA-8 ; le test neuf).

### Tests — [OK]
- `tests/v2-todo.test.mjs` (neuf, huit tests ; oracles écrits d'après les décisions, les actions lues dans le jeu) : le quai le premier matin (Tam suite, Piers événement, Mara objet qui paie ce que dit son travail, Bram objet ; ni vol ni attente, ouverts pourtant) ; les lices le matin (les personnes, puis le sable et les compétences, une ligne chacune, un créneau chacune ; jamais l'observation) et rien le soir ; le combat en tête ; une personne à qui l'on a parlé sort ; ce qui rapporte avant un objet ; l'ordre de LA-6 sur une liste construite ; le vu gardé par la sauvegarde, hors de l'empreinte, le moment dit, le lendemain neuf, 160 clés au plus ; rien dans le jeu d'aujourd'hui ; la bande et la ligne du guide en deux langues, sans chiffre. Fautes injectées une à une : un vol compté (deux tests échouent), le vu non gardé (un), ce qui rapporte sans rang (un ; d'abord sans effet sur les listes réelles, où Mara précède déjà Bram : le test sur une liste construite ajouté pour l'attraper).

### Preuves dans le navigateur (serveur DEV `la-dev`, :5403 ; `main` figé `05ec526` sur `la-main`, :5404) — [OK]
- Dans la page (script hors dépôt) : à l'arrivée sur le quai, l'aperçu (Tam, Piers, Mara +10 coins, « and 1 more ») et la touche allumée ; parti à 8,6 s, le nombre resté ; la page rechargée sans avoir ouvert la liste : de nouveau ; la liste ouverte : parti ; la page rechargée ensuite : rien (le vu gardé) ; Mara écoutée : 3 à faire.
- Captures (`tools/play-shots.mjs`) : le quai le matin à 1920 × 1080, 812 × 375 et 375 × 812, en français, après la liste, le combat du jour, les lices, la place de la Halle le soir.

- **`tools/ui-text.mjs`** : le quai le matin en anglais et en français à 1920 × 1080, 1280 × 720, 812 × 375 et 375 × 812, les lices, la place de la Halle le soir, le combat du jour en deux langues, le guide « Walking and talking » en deux langues : **18 / 18** (l'en-tête de l'aperçu à 16 px, 14 au téléphone).
- **`tools/ui-contrast.mjs`** (`--shots=2`) : [KO → corrigé] l'en-tête « To do here » en gris en haut du voile à 3,15:1 (3,39:1 en français) : passé en ivoire semi-gras, le voile plus fort sur ses trois cinquièmes ; ensuite le quai (quatre tailles, deux langues), les lices, le parvis l'après-midi, la place de la Halle le soir, le quai la nuit, le combat du jour (deux tailles, deux langues) : chaque texte neuf au-dessus de 4,5:1 ; seul échoue, antérieur (relevé depuis la Passe TU3) : « coins » au téléphone couché sur le quai (4,25:1).
- `tools/play-day.mjs` : **tout passe** (54 vérifications), Node rejoue `75272cc6a835113b` comme le navigateur (la même empreinte : le vu est hors de l'empreinte) ; `tools/tutorial-proof.mjs` : **tout passe** (64) ; `tools/pad-proof.mjs` : **tout passe** (61 ; la touche affiche [Y] à la manette) ; `tools/default-proof.mjs` : **tout passe** (40).
- Le jeu d'aujourd'hui (`v2=0`, `tools/detshots.mjs` sur `play=1&state=day1-morning`, 30 pas) : **0 px** au seuil 0 contre `main` figé, témoin de répétition 0 px (la capture de la liste ouverte n'est pas déterministe, `main` contre `main` compris : non retenue).

### Validation
- `npm run typecheck` sans erreur ; `npm test` **614 / 614** ; `npm run build` ; `npm run art:validate` (73 manifestes, 123 sources, 23 du son, 0 erreur).
- Les passes gardées dépassaient 60 Ko avec LA1 à LA3 : DB13 et MD1 (branches fusionnées) déplacées d'un bloc, à l'octet, dans `journal/88-passes-DB13-MD1.md`, leur ligne ajoutée à l'index ; preuve par script : le corps de l'archive égale les 21 345 octets retirés, chaque passe dans un seul fichier, CRLF partout.

### Où reprendre
- L'essai en jeu de l'opérateur : le nombre sur la touche, l'aperçu à l'arrivée et à la nouveauté (assez visible sans gêner ?), les 8 s, le combat du jour, le téléphone.

### Pensée
- Un « déjà vu » qui doit survivre au rechargement d'une page vit dans la partie, hors de l'empreinte, comme les losanges : la simulation ne change pas, l'écran se souvient.
- Un voile radial à la taille d'une ligne s'efface à ses deux bouts : une ligne qui s'allonge y perd ses mots d'extrémité ; un voile plus large que la ligne les garde.
- Une faute injectée sans effet dit que les données d'essai ne départagent pas la règle : un oracle sur une liste construite la départage.

## Passe AL1 — Les lices le jour 1 et la visibilité des chemins : l'accès reproduit, la fermeture du sable dite, les noms plus tôt (2026-11-11)

### Demande
- Retour d'essai de l'opérateur du 2026-11-11, mot pour mot (transmis par la séance qui coordonne) : « durant mes tests je ne suis pas parvenu a acceder au training ground lors du premier jour et , je pense que nous devrions optimiser la visibilite sur les chemins d'acces des autres secteurs de la ville car visuellement on peut parfois galerer a trouver on dirait ». Brief : reproduire sur une nouvelle partie du jeu par défaut à chaque moment du jour 1 (sorties, carte, liste), dire s'il s'agit d'une règle (la dire partout avec sa raison) ou d'un bug (le corriger), vérifier si l'essai a pu se faire avant la Passe MK6, un test qui garde l'accès ; mesurer la visibilité des sorties, appliquer la solution la plus simple qui ne change pas l'apparence décidée, une fiche sinon. Pour la séance, un retour d'essai, pas une décision.
- Branche `claude/acces-lices`, worktree `.claude/worktrees/acces-lices` tiré de `main` `05ec526` (exception à la règle d'une branche : `claude/liste-actions` d'une autre séance existe, chacune dans son worktree) ; `node_modules` en jonction ; serveur DEV `al-dev` (:5405, son propre cache).

### Reproduit — [OK] ni règle de fermeture ni chemin bloqué
- **Dans le navigateur, une nouvelle partie depuis l'adresse nue** (le navigateur intégré, l'écran titre en français : « Nouvelle partie », la visite, le conseil des marques) : sur le quai, la carte (M) propose « Aller au parvis de l'Arène », « Aller aux lices », « Aller à la place de la Halle ». La liste (Q) ne porte pas les déplacements (UM-R2 : la carte les porte).
- **À pied, au clavier, à chaque moment du jour 1** (script hors dépôt, puppeteer, de vraies touches fléchées dirigées à l'écran vers des points de passage, `tutorial=1&cutscene=1` comme chez une personne) : le quai jusqu'à son bout est, derrière les gardes ; le parvis (après la scène d'inscription de Clerk Odo le matin, que [E] fait avancer) jusqu'à sa rue est ; les lices. **Matin, après-midi et soir : les trois passent.**
- **La simulation** : `move` vers les lices n'a aucune condition dans une partie v2 ; seule la rue entre la place de la Halle et le parvis est fermée, le soir du défilé (jour 9, FE-7, MK-14).
- **La géométrie des places** (le pas du héros `walkTo`, inondation depuis chaque entrée) : chaque sortie de chaque place est atteinte depuis chaque entrée ; le passage le plus étroit vers la rue des lices sur le parvis laisse environ 3 m. [KO de méthode, corrigé] une première inondation bornée à 200 000 pas disait la rue des lices inatteignable : la borne coupait la recherche ; sans borne, tout passe.
- **Une règle trouvée, non dite là où l'on choisit d'y aller** : les lices restent ouvertes la nuit, mais leur sable ferme au crépuscule (`train.closed`) ; il est aussi fermé le matin après la rixe des casernes et tenu par Rhosk le jour où il le prend (lot L4). Le jeu ne le disait que dans la liste (Q) une fois sur place ; le soir du jour 1, les lices sont vides (aucune personne n'y est le soir, Passe MK1) et rien n'y est ouvert.
- **Le texte du guide se trompait** : « Three squares open from it » / « Trois places s'y ouvrent » (chapitre « La Cité et ses places ») ; le quai n'a que deux sorties, les lices s'ouvrent depuis le parvis. Rien sur le quai ne nommait les lices.

### L'essai de l'opérateur et la Passe MK6 — [?] probablement avant
- Le dossier principal du dépôt (`C:\Users\miche\Documents\Projects\HD-2D`, celui de `npm run dev` et de http://127.0.0.1:5173/) est sur la branche `claude/duel-calibration` à `df16326` (Passe DB10) depuis le 2026-11-09 à 18 h 23 (`git reflog`). S'il sert le jeu de l'opérateur, son essai tournait sans ECO2-ECO3, DB11-DB13, MD1 ni MK1-MK6 : ni mini-carte, ni chevron de loin (l'étiquette ne paraissait qu'à 9 m), ni carton d'arrivée. Aucun serveur n'écoutait sur 5173 au moment de la vérification : non confirmé. Les règles de déplacement n'ont pas changé entre `df16326` et `main` (`git diff` : seules les vues de MD1 dans `PlazaApp.ts`).

### Mesuré — la visibilité des sorties (avant)
- Script hors dépôt : le héros posé sur une grille de 1,5 m du sol libre (places : `posePlayer`, la caméra posée ; quai : 2 m, la caméra laissée se poser 1,7 s), 1920 × 1080, `__exits.state()` : le chevron ou l'étiquette à l'écran, le nom lisible (opacité ≥ 0,5). Les mêmes chiffres de jour et de nuit.

| Lieu | Sortie | Chevron à l'écran | Nom lisible (9 m) |
|---|---|---|---|
| Quai | place de la Halle / parvis | 27 % / 98 % | 24 % / 22 % |
| Parvis | Halle / lices / quai | 47 % / 52 % / 51 % | 11 % / 8 % / 18 % |
| Lices | parvis | 90 % | 11 % |
| Place de la Halle | parvis / quai | 64 % / 45 % | 6 % / 22 % |

- Depuis l'arrivée : du quai sur le parvis, les trois chevrons à l'écran, aucun nom sinon celui du retour ; de la Halle ou des lices sur le parvis, seul le chevron du retour (les deux autres hors du cadre, sur la mini-carte seulement).

### Corrigé et appliqué — [OK] sans élément visible nouveau
- **Le pur** : `src/simulation/v2access.ts` (`wayShut` : la seule sortie fermée, le soir du défilé ; `placeNote` : ce qui est fermé aux lices maintenant, le sable la nuit, le matin après la rixe, le jour de Rhosk ; `wayNote` : ce qu'une étiquette ajoute à « Vers … »).
- **La fermeture du sable dite là où l'on choisit d'y aller**, avec sa raison, en anglais et en français : l'étiquette de la sortie (« To the Training Ground · the sand is shut until dawn » / « Vers les lices · le sable est fermé jusqu'à l'aube » ; « … until noon » / « jusqu'à midi » après la rixe ; « Rhosk holds the sand today » / « Rhosk tient le sable aujourd'hui ») et la ligne de la carte (« Go to the Training Ground · … » / « Aller aux lices · … », le libellé de l'action `move` : `src/ui/townUi.ts`, que la séance de la liste travaille, n'est pas touché). La sortie reste dans l'accent, sur la scène comme sur la mini-carte : elle est ouverte, seul le sable est fermé (le gris de MK-14 dit une sortie qu'on ne peut pas passer). [?] La mini-carte n'a pas de texte : elle ne le dit pas.
- **Les lices nommées depuis le quai et la place de la Halle** : l'étiquette d'une sortie vers le parvis ajoute « · the Training Ground beyond » / « · les lices au-delà ».
- **Le guide corrigé** (« La Cité et ses places ») : « Two squares open from it: the Festival Square at its west end, the Arena Forecourt past the guards at its east end; the Training Ground opens from the Arena Forecourt. » / « Deux places s'y ouvrent : la place de la Halle à son bout ouest, le parvis de l'Arène au-delà des gardes à son bout est ; les lices s'ouvrent depuis le parvis de l'Arène. »
- **Le nom plus tôt** (`NAME_NEAR`, `src/ui/exits.ts`) : l'étiquette prend la place du chevron à 13 m (9 m depuis la Passe VP5), le fondu sur les 2,5 derniers mètres comme avant. Un réglage à l'intérieur de « le nom de près » (MK-12) : le chevron à toute distance et le nom de près restent. Balayage, même méthode que la mesure (paramètre DEV provisoire, retiré) :

| Portée du nom | Quai (Halle / parvis) | Parvis (Halle / lices / quai) | Lices (parvis) | Halle (parvis / quai) |
|---|---|---|---|---|
| 9 m (avant) | 24 / 22 % | 11 / 8 / 18 % | 11 % | 6 / 22 % |
| 11 m | 27 / 25 % | 19 / 14 / 32 % | 15 % | 13 / 34 % |
| **13 m (retenu)** | **27 / 31 %** | **26 / 22 / 46 %** | **18 %** | **19 / 44 %** |
| 15 m | 27 / 35 % | 33 / 29 / 50 % | 27 % | 27 / 45 % |

  13 m double environ la part du sol d'où l'on lit les noms ; au-delà, plusieurs étiquettes se lisent à la fois au cœur du parvis.
- `ExitMarkers.state()` donne aussi le texte de chaque étiquette (pour les preuves). Le jeu d'aujourd'hui (`v2=0`) n'a pas de sortie : rien n'y change.

### Tests — [OK]
- `tests/v2-access.test.mjs` (neuf, cinq tests, oracles écrits d'après la règle) : chaque lieu, chaque moment, chaque jour, depuis chaque autre lieu, ouvert, ou refusé avec la raison que dit son étiquette (seule la rue du défilé, dans les deux sens, le soir du jour 9 : le cas atteint) ; les lices le jour 1 depuis le quai, le parvis et la Halle à chaque moment, le sable ouvert de jour, fermé le soir, la note et la ligne de la carte ; la note des lices dite exactement quand le sable refuse une séance, sur deux parties entières et les états de Rhosk et de la rixe (chaque cas atteint) ; le guide qui ne dit plus « trois places » depuis le quai, en anglais et en français ; à pied, chaque sortie de chaque place atteinte depuis chaque entrée, de jour et de nuit (une inondation au pas du héros ; les moments et les paliers de fête ne changent pas le sol : quinze constructions, trois formes). Faute injectée : un obstacle devant la rue des lices sur le parvis, attrapé (« from the way in from lanterns, the way to training is reached on foot »). [KO → corrigé] la première version prenait 54 s (quinze constructions de places et des inondations au quart de mètre) : six constructions, des pas d'un demi-mètre (le passage le plus étroit fait 3 m), deux parties : 13 s.
- `tests/tutorial.test.mjs` épinglait l'ancienne phrase du guide : mis à jour en le disant.
- Les passes gardées dépassaient 60 Ko avec AL1 (63,4 Ko) : MK1, MK2 et MK3 (branches fusionnées) déplacées d'un bloc, à l'octet, dans `journal/89-passes-MK1-MK3.md`, leur ligne ajoutée à l'index ; preuve par script : le corps de l'archive égale les 22 197 octets retirés, chaque passe dans un seul fichier, CRLF partout ; 41,7 Ko de passes restent.
- `npm run typecheck` sans erreur ; `npm test` **611 / 611** avant le rejeu, **619 / 619** sur le code combiné (LA3 compris), `exits-proof` et `play-day` refaits dessus (même empreinte) ; `npm run build` ; `npm run art:validate` (73 manifestes, 123 sources, 23 du son, 0 erreur).

### Preuves dans le navigateur (serveur DEV `al-dev`, :5405 ; `main` figé `05ec526` servi par `mpn-dev`, :5401) — [OK]
- `tools/exits-proof.mjs` : **chaque sortie parcourue dans les deux sens** (32 vérifications).
- `tools/play-day.mjs` : **tout passe**, Node rejoue `75272cc6a835113b` comme le navigateur (la même empreinte qu'avant : rien ne change dans la simulation).
- `tools/ui-text.mjs` : les étiquettes avec leur note (le quai, le parvis le soir, la Halle vers le parvis), la carte, le guide, en anglais et en français, 1920 × 1080, 1280 × 720, 812 × 375 : **30 / 30**.
- `tools/ui-contrast.mjs` (1920 × 1080 et 812 × 375) : chaque texte neuf au-dessus de 4,5:1 (au plus bas « Vers le parvis de l'Arène · les lices au-delà » 4,54:1 sur les façades du quai de jour, la carte 6,85:1, le guide 7,53:1) ; échouent seuls, antérieurs (Passes TU3, MK3, MK6) : « coins » / « pièces » au téléphone sur la place de la Halle, 3,94 / 3,97:1.
- Captures avant / après (hors dépôt, `play-shots`, `main` figé contre la branche, en deux langues) : le quai à 10 m de son bout est (avant : rien que le chevron ; après : « Vers le parvis de l'Arène · les lices au-delà ») ; le parvis le soir près de la rue des lices (avant : l'étiquette à demi effacée « Vers les lices » ; après : « Vers les lices · le sable est fermé jusqu'à l'aube ») ; la carte le soir (« Go to the Training Ground · the sand is shut until dawn »).

### La fusion
- `main` avait reçu les Passes LA1 à LA3 (la liste des activités, l'autre séance ; DB13 et MD1 archivées par elle) : le commit rejoué sur `d0141fd` sans conflit.

### Où reprendre
- **L'essai de l'opérateur sur le `main` d'aujourd'hui** : s'il joue depuis le dossier principal, celui-ci doit d'abord quitter `claude/duel-calibration` (`df16326`) pour `main` (décision de l'opérateur ou de la séance qui coordonne : aucune séance de travail ne change la branche de ce dossier). Il y verra MK3, MK6, la liste (LA3) et cette passe.
- **Si les chemins restent difficiles à trouver** après cet essai, une fiche d'arbitrages : des éléments visibles nouveaux (les noms sur la mini-carte, un repère au sol devant chaque sortie, les noms montrés à l'arrivée), à rendre dans le jeu ; non préparée ici, l'opérateur n'ayant vraisemblablement pas vu MK6.
- Relevés : arrivé sur le parvis depuis la Halle ou les lices, on ne voit que le chevron de sa sortie de retour (les deux autres sur la mini-carte seulement) ; la mini-carte ne dit pas que le sable est fermé (sans texte) ; « coins » / « pièces » au téléphone sous 4,5:1.

### Pensée
- Un « je n'y arrive pas » se reproduit d'abord avec la version que l'opérateur a jouée : un dossier de travail resté sur une vieille branche montre un autre jeu que `main`.
- Une recherche bornée qui échoue ne prouve rien : la borne doit se lire dans le résultat.

