# Journal de bord — archive : passes EVL9, EVL10 (2026-11-08)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-11-08 (Passe PR4) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe EVL9 — Le lot L5 de l'étape 5, « la ville qui réagit » : Wynn à l'étal volé, les passants sur chaque place, la célébrité qui salue, les gestes des rivaux, la foule des places selon le pouls ; la fiche de lot publiée (2026-11-08)

### Demande
- Transmise par la séance mère (`local_94e3af37-…`) : construire le lot L5 de l'étape 5 derrière `flags.v2`, le jeu par défaut inchangé au pixel, d'après le choix de l'opérateur EV-12 « Les places lisent le pouls, la célébrité compte » (Passe EV2), sa recommandation mot pour mot : « Les places lisent le pouls comme le quai (la foule, les fanions, une boutique aux volets fermés). La célébrité change ce que disent les passants et qui salue le héros, et un garde se poste à l’étal le jour d’un vol. Tout cela avec les sprites et les décors déjà approuvés : rien de neuf sans fiche. » ; partir de ce que L4 donne (`stanceOf`, `memoryOf`, les ambiances `v2quiet`, `boutIn` / `status`) ; la consigne : l'importance narrative et la cohérence du gameplay, sans se perdre dans la structure. Deux points relevés hors des lots précédents, laissés à décider : « Your bouts are fought » au jour 7 pour un finaliste, et Hale qui dit « tonight » le matin.
- Lu d'abord : `JOURNAL.md` en entier (Passes EVL5 à EVL8 en détail), `briefs/audit-gameplay-ev1.md`, la carte EV-12 de `briefs/fiche-ev1.html`, `AGENTS.md`. Branche `claude/l5-ville` dans un worktree, ouverte sans commit pendant que la séance des peaux finissait, puis avancée sur `main` après sa fusion (Passe GS2, `d9b7aa0` : aucun fichier en commun) ; premier commit poussé ensuite (`8c45b24`).

### Fait — [OK], derrière la version 2
1. **Le garde à l'étal volé** (`src/simulation/v2watch.ts`, neuf) : Wynn, l'homme de Hale (le second garde du quai), se poste à l'étal d'un vol connu : pris sur le fait, le jour même et le lendemain ; un étal forcé la nuit, les deux jours suivants (le jour où il reste fermé et le suivant) ; découvert à l'aube, ce jour-là ; une restitution chez Hale le renvoie ; la poche d'un passant n'a pas d'étal. Il se tient chez Mara sur le quai (`src/ui/playTown.ts` : son sprite déplacé à côté d'elle, aucun tirage du district changé) ou sur une place près de Hilde, Corvin ou Pip (un « spot » `wynn` par place, `src/world/Plazas.ts` ; au parvis, la porte garde un seul garde à côté de lui : deux fois la même feuille dans le cadre se lisaient comme des jumeaux) ; il n'est plus au quai pendant ce temps. Tant qu'il est là, **le vol à cet étal est refusé**, la raison dite, et la liste (Q) le montre refusé (`src/ui/townUi.ts`, comme l'entraînement refusé de L4) : la seule règle neuve du lot. On peut lui parler (« Sergeant Hale has me by Hilde's stall today… ») ; Hale dit où est son homme.
2. **Les passants sur chaque place** : « Townsfolk » est à qui parler sur les trois places comme sur le quai, à toute heure (`placeIn`, `talkableHere` ; `PlazaApp.nearby` prend un passant de la foule) ; leurs répliques sont celles du quai, ouvertes par une phrase selon la célébrité ou le registre de Hale (`folkLine`, `src/narrative/dialogue.ts`).
3. **La célébrité** (`src/simulation/v2react.ts`, neuf) : le pouls `playerFame`, que rien ne lisait, en quatre paliers (inconnu sous 25, remarqué, connu dès 55, célébré dès 80). Un passant que le héros approche à moins de 2,4 m réagit une fois par page : un sur quatre remarqué, un sur deux connu, tous célébré ; il s'arrête, se tourne vers le héros et sa phrase flotte au-dessus de lui trois secondes (`src/ui/hails.ts`, neuf ; le voile des étiquettes de sortie ; deux à la fois au plus). Sa phrase suit le jour : la couronne ; un combat aujourd'hui (et les paris quand `publicPressure`, l'autre pouls sans lecteur, atteint 60) ; un combat gagné ou perdu hier ou aujourd'hui, l'adversaire nommé ; la finale à venir ; un combat demain ; sinon celle du palier. Le registre de Hale passe avant : une ou deux marques, un passant sur trois chuchote ; recherché, tous se détournent, un sur trois dit pourquoi.
4. **Les gestes des rivaux** : un rival debout sur une place réagit à 3,2 m selon son attitude de L4 (`gestureOf`) : un ami lève la main, un rival battu qui respecte fait un signe de tête, un rancunier se détourne.
5. **La foule des places selon le pouls** : celle des trois places suivait l'heure seule ; elle suit l'excitation comme celle du quai (un passant de plus tous les 12 points au-dessus de 60), et se rassemble où sont les ambiances que L4 a sorties des nouvelles : le parvis un après-midi de combats (+3), la place de la halle le soir du marché de nuit (+3) et de la parade (jour 9, +4) ; entre 2 et 15 (`plazaCrowd`, `gatheringOf`).
6. **Deux lectures corrigées, dans la version 2 seule** : un vainqueur de demi-finale lisait « Your bouts are fought » aux jours 7 et 8 (la finale n'est tirée qu'après le jour 8) : la ligne d'état, la page du tournoi et la rumeur nomment désormais la finale et l'autre finaliste (`pendingFinal`, `src/tournament/v2calendar.ts` ; `nextOpponent`). Hale dit « after dark » de jour et « tonight » le soir ; le jeu par défaut garde « tonight » (écart consigné).
7. **Les saluts ne jouent que sur l'horloge de la scène** (`PlazaApp.stepped`, `App.simTime`) : une page figée par un outil de capture n'en montre aucun.
8. **États nommés** (DEV) : `v2-watch-forecourt` (graine 1 : pris chez Hilde le premier matin, le parvis l'après-midi), `v2-watch-quay` (pris chez Mara), `v2-famous-training` (le jour 7 au terrain d'entraînement, célébré, Orla amie). **`tools/town-flow.mjs`** (neuf) : `watch`, `quay`, `hails`. **Textes** : 36 clés neuves, « proposées ».

### Non construit — [?], sur la fiche (L5-3)
- **Les fanions et les volets fermés** de la recommandation : les guirlandes des places (J6) et leurs étals font partie de leur décor cuit, dont la géométrie entre dans la cuisson de visibilité ; les faire suivre la fête demande un décor par palier, une cuisson neuve et sa preuve de visibilité à 0 px contre `vis=0`. Les volets n'existent pas parmi les décors approuvés (« rien de neuf sans fiche »). La fiche propose les fanions dans une tâche à part et pas de volets sans décor approuvé.

### Mesures — TournamentLab
- **Identique au JSON près contre `main` figé sur 21 séries** : règles classiques et dynamiques (idle, diligent) et version 2 (idle, diligent, curieux), graines 1-50, 51-100, 101-150. Le lot ne change que ce que les pages montrent ; sa seule règle neuve ne touche aucun bot (le curieux ne vole que le registre propre, et Wynn n'est posté qu'après un vol connu, donc une marque). Comparé d'abord à `96cd71e`, puis les mêmes conclusions sur `d9b7aa0` (la fusion des peaux ne touche pas la simulation).
- **Le palier du diligent au matin** (50 parties) : inconnu les jours 1-2 ; remarqué à 88 % les jours 3-4 ; connu à 82 % le jour 6 ; célébré à 34 % les jours 7-8, 64 % le jour 9, 72 % le jour 10.
- **Le curieux** porte une marque dès le jour 2 dans les 50 parties (il ne règle chez Hale qu'à trois marques) : ses passants chuchotent toute la partie ; Wynn est posté 2,5 jours par partie chez lui, jamais chez le diligent.

### Tests — [OK]
- **`tests/v2-react.test.mjs`** (neuf, 12 tests), oracles écrits dans le test : les jours de garde de chaque cas (pris, forcé la nuit, découvert, réglé, invisible, une poche), chaque étal et sa place, le dernier vol connu ; un vol pris chez Hilde de bout en bout (parler à Wynn, l'étal fermé ce jour, le refus le lendemain avec ses mots, Wynn absent du quai puis revenu, l'autre étal ouvert) ; Mara et Hale ; une restitution ; les passants partout en v2, au quai seulement au défaut ; les paliers à leurs bornes (24/25, 54/55, 79/80) ; qui salue (1 sur 4, 1 sur 2, tous ; les chuchotements et les détournements) ; les phrases de chaque contexte (la pression à 59 et 60) ; deux saluts de suite jamais les mêmes mots ; les répliques des passants ; les gestes ; la foule (la formule, chaque rassemblement, les bornes) ; la finale en attente ; Hale ; le jeu par défaut sans rien de tout cela et sa liste de conversation intacte.
- `tests/v2-places.test.mjs` : « Townsfolk » parmi les gens des places de la version 2.
- **Fautes injectées une à une** (script hors dépôt, chaque fichier rendu à l'octet et vérifié par SHA-256 après chacune) : 31, toutes attrapées : les jours de garde (le lendemain d'une prise, la nuit, l'aube, réglé, une poche, le plus ancien vol), Wynn qui ne quitte pas le quai, les passants au quai seulement, la garde ou un salut dans le jeu par défaut, le vol permis sous les yeux du garde, chaque seuil de célébrité et de fréquence décalé d'un cran, les marques après la célébrité, chaque recherché qui parle, les paris dès 61, une défaite saluée comme une victoire, la finale en attente oubliée ou gardée après une demi-finale perdue, les mots tirés par le passant, un rancunier qui salue, la foule tous les 10 points, la clameur chaque après-midi, le marché de la veille, la parade au jour 10, le plafond à 16, Hale de jour le soir, les mots du registre intervertis, Wynn muet à son poste.
- `npm test` **498 sur 498**, `npm run typecheck`, `npm run build`, `npm run art:validate`.

### Preuves — [OK]
- **Serveurs** par `preview_start` (entrées `l5-*` ajoutées à `.claude/launch.json`, non suivi) : la branche en DEV `:5301`, `main` figé (`git archive` de `d9b7aa0`, dossier de travail temporaire) en DEV `:5302`, les deux paquets par `vite preview` `:5303` et `:5304`.
- **Le jeu par défaut, inchangé** : `detshots` à l'octet près (écart maximal nul) contre `main` figé, dix-huit vues : la ville de nuit et à midi ; le mode jouable par défaut à l'ouverture, avec la liste Q, Mara, le journal et le tableau ; son premier soir avec la liste ; la ville d'une partie v2 à l'ouverture, avec la liste Q et Mara ; l'arène par défaut et le duel v2, trois moments chacun (`HOLD=1 FREEZE_CSS=1`). Témoin de répétition à l'octet près ; contrôles négatifs (nuit contre midi, ouverture contre liste, journal contre tableau, arène contre duel, défaut contre v2) tous différents. **Les paquets** : les mêmes dix-huit vues à l'octet près (le premier soir y est sans valeur : l'état nommé n'existe qu'en DEV). L'entrée change de forme : 220 032 octets contre 220 045, l'import du morceau `play` direct au lieu de `.then(e=>e.t)` (le découpage du graphe de modules, aucun comportement changé).
- **Empreintes**, celles de `main` : `play-day` par défaut `6a942086a2616ab2`, `V2=1` `456b834c7af247e4` (DEV, la branche et `main`) ; `play-flow` sur les paquets, par défaut `0025acce7a403773`, `V2=1` `f3974c5eedc75e97`.
- **Le lot joué dans le navigateur, rejoué en Node** (`tools/town-flow.mjs`, DEV) : `watch` (Wynn près de l'étal de Hilde, ses mots, le vol fermé ce jour, refusé le lendemain avec sa raison, le quai sans Wynn, revenu au jour 3 après le combat du jour 2) : Node `4c20aba86f8b5665` = navigateur ; `quay` (Wynn à 1,27 m de Mara, Hale, Wynn, le vol refusé) : `d9046d47125bea6b` ; `hails` (la foule de la place égale à `plazaCrowd`, un passant qui salue avec la phrase que l'état dit, deux voisins aux phrases différentes, Orla qui lève la main, un passant à qui l'on parle, un salut sur le quai) : `5c88bbf6cfa53368`.
- **`ui-text`** : sept pages, chacune à 1 600 × 900 et 390 × 844, quatorze sur quatorze : Wynn chez Hilde et chez Mara, Hale, la liste (Q) au vol refusé, un passant sur la place, la page du tournoi au jour 7, une phrase au-dessus d'un passant ; 16 px et 14 px au plus petit, polices chargées.
- Vu sur les captures : [KO → corrigé] deux passants voisins disaient la même phrase au même moment (la phrase suivait le passant) : elle suit désormais l'ordre des saluts de la page. Le héros posé devant Orla la cachait : la pose de l'outil décalée.
- Environnement : une jonction `node_modules/three` du worktree vers le dossier principal (dossier ignoré), à défaire en fin de tâche, comme aux Passes GA1 et EVL7.

### La fiche — publiée, rien de décidé
- Page privée https://claude.ai/artifact/MsxZqyzPvSThAefPLkAZ1z, source `briefs/fiche-l5.html` (la page de la fiche de L4), dix captures publiées avec elle (pas dans le dépôt). La collection `decisions` a été relue vide à la publication. Vérifiée en local avant : quatorze cartes, les dix images chargées, aucun débordement à 375 px, aucune erreur.
- Quatorze cartes, chacune avec sa recommandation : L5-1 Wynn à l'étal volé (« Garder ») ; L5-2 la foule selon le pouls (« Garder ») ; L5-3 les fanions et les volets (« Fanions dans une tâche à part, pas de volets ») ; L5-4 qui salue, quatre paliers (« Garder ») ; L5-5 ce qu'ils disent (« Garder ») ; L5-6 le registre de Hale d'abord (« Garder ») ; L5-7 les gestes des rivaux (« Garder ») ; L5-8 les passants sur chaque place (« Garder ») ; L5-9 la finale en attente (« Garder la correction ») ; L5-10 Hale de jour (« Garder ») ; L5-11 le laboratoire identique (« Accepter ») ; L5-12 le pouls sans lecteur (« Laisser ainsi ») ; L5-13 ce qui revient à L6 (« L6 ensuite ») ; L5-14 « Fusionner après la fiche, essayer ensuite ».

### Archive du journal
- Les passes I2, EVL5 et EVL6 (branches fusionnées) déplacées à l'octet dans `journal/64-passes-I2-EVL6.md` : le corps de l'archive est égal aux 32 240 octets retirés, chaque passe est dans un seul fichier, les fins de ligne CRLF sont gardées ; les passes gardées font ensuite environ 40 000 octets.

### Où reprendre
- Relire `decisions` quand l'opérateur dit la fiche remplie, consigner mot pour mot (journal, `briefs/audit-gameplay-ev1.md`), appliquer, refaire les preuves touchées, puis fusionner selon L5-14. La passe qui fusionne dit ce qui revient à L6 (le récit, les scènes, le festival : EV-13, EV-14).

### Pensée
- Un lot qui fait « réagir la ville » peut presque tout lire sans rien écrire : la foule, les saluts et les gestes se tirent de l'état, et le laboratoire reste identique au JSON près ; la seule règle neuve (pas de vol sous les yeux du garde) donne au signe visible un effet simple.
- Une phrase tirée par l'index d'un passant se répète chez son voisin : ce qui varie d'une réplique à l'autre se tire de l'ordre où elles sont dites, pas de qui les dit.
- Une réaction en jeu qui dépend du temps se lie à l'horloge propre de la scène : une page figée par un outil n'avance pas, et ses captures restent celles d'avant.
- Ce que le joueur témoin du laboratoire fait d'une règle se mesure avant de la juger : le curieux porte une marque dès le jour 2 dans toutes les parties, et ses passants ne le salueraient jamais ; c'est une conséquence du choix de sa politique (régler seulement à trois marques), à montrer sur la fiche.
## Passe EVL10 — La fiche de L5 relue : quatorze sur quatorze à la recommandation ; la branche fusionnée (2026-11-08)

### Demande
- L'opérateur, mot pour mot : « Fiche remplie ». Relire `decisions` (https://claude.ai/artifact/MsxZqyzPvSThAefPLkAZ1z, source `briefs/fiche-l5.html`), consigner mot pour mot, appliquer ce qui change, refaire les preuves touchées, puis fusionner selon L5-14.

### Les choix de l'opérateur, mot pour mot (quatorze sur quatorze, cliqués le 2026-11-08 entre 05 h 14 et 05 h 16 UTC, aucune note)
| Carte | Ce qu'elle demandait | Choix |
|---|---|---|
| L5-1 | Wynn se poste à l'étal volé, et on n'y vole plus | « Garder » |
| L5-2 | La foule des places suit le pouls, et se rassemble où la ville vit | « Garder » |
| L5-3 | Les fanions et les volets fermés : pas construits | « Fanions dans une tâche à part, pas de volets » |
| L5-4 | Qui salue le héros : quatre paliers | « Garder » |
| L5-5 | Ce qu'ils disent : la nouvelle du jour d'abord | « Garder » |
| L5-6 | Le registre de Hale passe avant la célébrité | « Garder » |
| L5-7 | Les rivaux sur les places montrent leur attitude | « Garder » |
| L5-8 | On parle aux passants sur chaque place | « Garder » |
| L5-9 | Un finaliste ne lit plus « Your bouts are fought » aux jours 7 et 8 | « Garder la correction » |
| L5-10 | Hale ne dit plus « tonight » le matin | « Garder » |
| L5-11 | Le laboratoire identique au JSON près | « Accepter » |
| L5-12 | Le pouls : ce qui reste sans lecteur | « Laisser ainsi » |
| L5-13 | Ce qui revient à L6 : le récit, les scènes, le festival | « L6 ensuite » |
| L5-14 | Fusionner, puis ton essai | « Fusionner après la fiche, essayer ensuite » |

- Les quatorze choix suivent la recommandation de leur carte : rien à appliquer, le lot reste tel que la Passe EVL9 l'a construit et prouvé. Les fanions selon la fête deviennent une tâche à part, après l'essai de l'opérateur (L5-3) ; pas de volets sans un décor approuvé sur fiche. Le nombre de concurrents en lice reste sans lecteur (L5-12). Les deux lectures corrigées le restent, dans la version 2 seule (L5-9, L5-10) ; le jeu par défaut garde sa phrase de Hale (écart consigné).

### Preuves
- Aucun code ne change depuis `d5689db`, et `main` est resté à `d9b7aa0` (vérifié sur `origin/main` avant la fusion) : les preuves de la Passe EVL9 tiennent telles quelles (tests, 0 px du jeu par défaut en DEV et sur les paquets, empreintes `play-day` et `play-flow`, laboratoire au JSON près, `town-flow` rejoué en Node, `ui-text`). `npm run typecheck` et `npm test` relancés sur le commit de cette passe.

### La fusion
- La branche `claude/l5-ville` (Passes EVL9, EVL10) est fusionnée en avance rapide dans `main` (L5-14 « Fusionner après la fiche, essayer ensuite ») ; `main` est poussé, et la branche supprimée, locale et distante ; le worktree retiré, sa jonction `node_modules/three` défaite d'abord. Ton essai : `npm run dev`, puis `/?play=1&new=1&v2=1` ; en DEV, `/?play=1&state=v2-watch-forecourt` (Wynn chez Hilde), `/?play=1&state=v2-watch-quay` (Wynn chez Mara), `/?play=1&state=v2-famous-training` (le jour 7, célébré, Orla amie).

### Ce qui revient à la suite
- **L6** (L5-13 « L6 ensuite ») : le récit, les scènes et le festival, d'après EV-13 (compléter les arcs de Rhosk et Tobin ; quatre scènes selon l'état : hors de la coupe, après la demi-finale, Cassius démasqué, l'épilogue) et EV-14 (un festival le jour 9 sur la place de la halle, ses règles sur une fiche à part) ; la parade du jour 9 rassemble déjà la foule de la place (L5-2). L4-6 « Laisser ainsi » (aider un autre rival qu'Orla) reste pour L6 ou la phase d'équipe.
- **Les fanions selon la fête** (L5-3) : une tâche à part, après l'essai : les guirlandes déjà approuvées des places suivant la fête par paliers, une cuisson de visibilité par palier et sa preuve à 0 px contre `vis=0`.

### Pensée
- Une fiche relue sans note, toute à la recommandation, n'appelle pas de nouvelle preuve quand ni le code ni `main` n'ont bougé : on le vérifie (le commit, `origin/main`) avant de fusionner.

