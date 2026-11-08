# Journal de bord — archive : passes I2, EVL5, EVL6 (2026-11-07 → 2026-11-08)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-11-08 (Passe EVL9) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe I2 — Le verrou du registre de `gen-image.mjs` : chaque requête comptée une fois, le plafond vérifié sous le verrou ; la branche fusionnée (2026-11-08)

### Demande
- Transmise par la séance mère (`local_faa4cca6-…`), d'après le choix de l'opérateur GA3-S3 « Une tâche à part » (Passes GA3, GA4) : un verrou autour de chaque lecture-écriture du registre de `tools/art-lab/gen-image.mjs`, le plafond par tâche vérifié sous ce verrou, un test hors ligne avec plusieurs `generate()` simultanés (une tâche, deux tâches), et la faute « verrou retiré » injectée. Aucune génération réelle, la clé jamais lue. Branche `claude/gen-image-lock`.

### Le défaut (Passe GA3)
- `generate()` chargeait le registre, réservait, sauvait, envoyait, puis sauvait au règlement **la copie prise avant l'envoi**. Avec deux requêtes à la fois, la seconde écrasait la réservation de la première, puis le règlement de la première remettait l'entrée de la seconde à « pending ».
- En GA3, cela a donné des requêtes payées restées à leur pire estimation (Lucan à 4,08 $ au lieu de 1,23 $, deux refus pour un faux dépassement) et une entrée disparue (la planche propre de Kell, 0,39 $).
- Le défaut se reproduit dans un seul processus : deux `generate()` lancés ensemble suffisent, parce que l'envoi est une attente entre la lecture et l'écriture.

### Fait — [OK]
1. **Le verrou** (`withLedger`) :
   - `<registre>.lock`, créé en exclusif (`fs.openSync(…, 'wx')`), qui contient un jeton, le pid et l'heure. Sous lui : lire le registre tel qu'il est sur le disque, le modifier, l'écrire, libérer ;
   - une attente bornée avec reprise (2 à 40 ms, un peu de hasard), puis l'abandon après 30 s, avant tout envoi (« nothing sent ») ;
   - un verrou de plus de 15 s est périmé : son processus est mort, puisque l'outil ne le tient que le temps d'une lecture et d'une écriture, jamais pendant une requête. Il est renommé à part (de deux processus qui le cassent, un seul renommage réussit), supprimé s'il est bien celui jugé périmé, rendu sinon ;
   - un processus ne libère que son propre verrou (le jeton) ;
   - Windows répond EPERM tant qu'un verrou libéré est encore en cours de suppression : traité comme « occupé ».
2. **`generate()`** :
   - la réservation se fait sous le verrou : le plafond est vérifié contre le registre de ce moment, réservations des autres processus comprises ; un refus n'écrit rien ;
   - le règlement se fait sous le verrou : l'entrée est retrouvée par son `id` (un UUID, champ neuf) dans le registre relu, jamais dans la copie d'avant l'envoi ; si elle a disparu (un registre reconstruit à la main entre-temps), elle est rajoutée avec une note ;
   - les trois issues (pas de réponse, erreur HTTP, réponse) passent par ce règlement ;
   - une réponse dont l'image ne peut être gardée (pas un PNG) est réglée à son coût (« answered; images not kept: … »). Avant, elle restait « pending » à son pire coût ;
   - `--dry-run` et `--spent` lisent sous le verrou, sans écrire.
3. **Les noms d'images**, un défaut trouvé en écrivant le test — [KO → corrigé] : le nom `<tâche>-<seconde>-<n>.png` ne dépend que de la seconde. Deux requêtes d'une même tâche dans la même seconde écrivaient donc la même image et la même fiche, et la première était perdue. Chaque image est désormais créée en exclusif ; un nom déjà pris reçoit les huit premiers caractères de l'`id` de la requête (`<tâche>-<seconde>-<id8>-<n>.png`). La première image garde le nom d'aujourd'hui.
4. `AGENTS.md` (« Image generation ») : la règle du verrou. L'en-tête de l'outil la répète.

### Tests — [OK]
- `tests/gen-image.test.mjs`, quatre tests neufs, hors ligne (le faux fetch, la fausse clé). La requête k envoie l'invite `p<k>` ; sa réponse dit `req_<k>` (aussi dans les octets de l'image) et coûte son propre usage, un oracle écrit dans le test :
  - six `generate()` à la fois, quatre sur une tâche et deux sur une autre, les réponses revenues dans un autre ordre (60, 10, 45, 0, 30 et 15 ms), à un instant figé (les quatre images d'une tâche dans la même seconde). Chaque requête figure une fois dans sa tâche, « answered » à son coût, aucune « pending » ; l'entrée d'avant est gardée ; chaque image a un nom à elle et sa fiche ; aucun verrou n'est laissé ;
  - le plafond : 4,75 $ déjà dépensés, deux requêtes de 0,1664 $ au plus lancées ensemble (une seule tient) et une sur une autre tâche ; aucune réponse ne revient avant que les trois soient réservées ou refusées. Une est refusée sans rien envoyer, l'autre tâche est servie, la tâche reste sous 5 $ ;
  - quatre processus Node lancés au même instant (un fichier « go » qu'ils attendent tous), sur deux tâches : chaque requête comptée une fois, à son coût ;
  - un verrou vieux d'une heure est cassé. Un verrou vivant fait attendre la requête, puis renoncer sans envoyer ni écrire, et il reste à son porteur ; libéré pendant l'attente, la requête part après la libération ;
  - le test des échecs s'allonge d'une réponse qui n'est pas un PNG, réglée à son coût.
- **La pause.** Les tests concurrents attendent 5 à 15 ms entre la lecture et l'écriture du registre (`lock.pause`, une option des seuls tests). Sans elle, une lecture-écriture synchrone ne laisse jamais deux écrivains se croiser dans un processus. Mesuré : le verrou et les pauses retirés, les deux tests dans un processus passent, et le test entre processus n'échoue que 3 fois sur 5 ; avec les pauses, il échoue 10 fois sur 10.
- **Sept fautes injectées une à une** (un script Node ; l'outil restauré et vérifié à l'empreinte après chacune), chacune attrapée 3 fois sur 3 :

| Faute | Tests qui échouent |
|---|---|
| le verrou retiré | les quatre neufs (entre processus : 10 fois sur 10) |
| le règlement écrit la copie prise avant l'envoi (l'ancien code) | une tâche et deux, le plafond, entre processus |
| le plafond vérifié hors du verrou | le plafond |
| un verrou périmé jamais cassé | le verrou périmé |
| les noms d'images écrasés | une tâche et deux, entre processus |
| un verrou tenu qui n'est pas attendu | les quatre neufs |
| une réponse sans image gardée, pas réglée | les échecs |

- **Stabilité** : le fichier de test lancé 25 fois de suite, 25 passes (1,4 s chacune). [KO → corrigé] Une première version du test du plafond échouait une fois sur deux : la première requête, réglée à son coût réel (0,04 $, sous son estimation), laissait de la place à la seconde avant que celle-ci réserve. C'était le plafond qui marchait, pas deux réservations à la fois. Les réponses attendent désormais que les trois requêtes soient réservées ou refusées.
- `npm test` **448 sur 448**, `npm run typecheck`, `npm run art:validate` (73 manifestes, 123 sources archivées, 0 erreur ; 23 manifestes de son).
- **La ligne de commande, sans rien envoyer** :
  - `--dry-run` dans le worktree : rien écrit, aucun verrou laissé ;
  - `--spent --root=<dossier principal>` sur le vrai registre, lu sous le verrou : identique à l'octet avant et après (SHA-256), aucun verrou laissé.
- Environnement : une jonction `node_modules/three` vers le dossier principal, comme en GA1 et GA3, défaite en fin de tâche.

### Limites — [?]
- Le verrou est un fichier dans le dossier du registre : il protège les processus qui partagent ce dossier (le même checkout, ou `--root` vers lui). Deux worktrees sans `--root` ont chacun leur registre, comme avant.
- Un cas reste possible en théorie : trois processus en quelques microsecondes autour d'un verrou périmé (un renommage qui prend un verrou neuf, rendu par un lien qui échoue si un autre a déjà pris la place). Il faut d'abord un processus mort en tenant le verrou.
- La tâche n'a rien coûté : aucune requête envoyée.

### Archive du journal
- La passe EVL4 (branche `claude/l2-ville`, fusionnée) est déplacée à l'octet dans `journal/61-passes-EVL4.md` : le corps de l'archive est égal aux octets retirés, chaque passe est dans un seul fichier, les fins de ligne CRLF sont gardées.

### La fusion
- La branche `claude/gen-image-lock` est fusionnée en avance rapide dans `main` ; `main` est poussé, et la branche supprimée, locale et distante.

### Pensée
- Un outil qui lit puis réécrit un fichier partagé autour d'une attente (une requête réseau) écrase ce que d'autres ont écrit entre-temps : la seconde écriture relit le fichier sous un verrou, elle ne réécrit jamais sa copie.
- Un test de concurrence doit pouvoir échouer : sans fenêtre entre la lecture et l'écriture, un test dans un seul processus ne voit pas la faute qu'il cherche. On le mesure en retirant la faute, puis la fenêtre.
- Un plafond réglé au coût réel libère de la place pendant que d'autres requêtes attendent : un test qui veut deux réservations simultanées retient les réponses jusqu'à ce qu'elles soient faites.

## Passe EVL5 — Le lot L3 de l'étape 5 : observer tout adversaire, deux sources de rumeurs, ce que la ville a vu, une réponse au sabotage par lieu ; la fiche de lot publiée (2026-11-07)

### Demande
- Transmise par la séance mère (`local_eff96499-…`) : construire le lot L3 de l'étape 5 derrière `flags.v2`, le jeu par défaut inchangé, d'après les choix de l'opérateur sur la fiche EV1 (Passe EV2) : EV-11 « Observer tout adversaire, rumeurs, activité lisible » et EV-10 « Une réponse par lieu, un effet lisible ». Leurs recommandations, telles que la fiche les écrivait : « Observer tout adversaire annoncé, là où il s'entraîne et à son heure. Acheter une rumeur sur un rival (une blessure, un équipement, un complot) à Lio ou à l'informateur, vraie ou fausse selon la source. Rendre une part de l'activité hors écran lisible au tableau du tournoi (T). » ; « La garde du quai garde la forge ; les vestiaires ont leur propre parade (Odo, ou une nuit à la caserne). L'armure trafiquée se remarque à la fiche de match quand on a vu un signe (« une sangle semble coupée »), et l'enquête mène à l'auteur et à une compensation. »
- Lu d'abord : `JOURNAL.md` en entier, `briefs/audit-gameplay-ev1.md` (§§ 2, 3, 6, 7), la Passe EVL4 (« Ce qui revient à L3 »), `AGENTS.md`. Branche `claude/l3-information`.

### Fait — [OK], derrière la version 2 (`src/simulation/v2intel.ts`, neuf)
1. **Observer tout adversaire** (EV-11) : `SCOUTED_V2` (`src/simulation/roles.ts`), les sept rivaux de la poule, chacun là où il s'entraîne et à son heure (`src/narrative/people.ts`) : Vessa et Marek sur le parvis de jour, Orla et Ilse au terrain d'entraînement de jour, Cassius sur la place de la halle le soir (il croise le fer avec le maître d'armes de sa maison derrière la scène), Rhosk et Tobin au terrain d'entraînement de jour à partir du jour 6. Un créneau, une fois par rival ; une phrase de style par rival (« proposé »), tirée de ses compétences (`V2_FOES`) sans les nommer ; les compétences s'écrivent ensuite sur la fiche de match et la page du tournoi (le fait `scouted:<id>`, déjà lu). Le jeu par défaut garde `SCOUTED` (Vessa et Marek, sur le parvis, ses mots) ; `scoutable(st)` dit la liste de chaque jeu (fiche de match, laboratoire).
2. **Deux sources de rumeurs** (EV-11) : l'action `rumour`, sur ton prochain adversaire (`nextOpponent`), une fois par jour et par source, sans créneau :
   - la salle de Lio, sur la place de la halle à toute heure, une tournée à 3 pièces, juste deux fois sur trois ; quand elle se trompe, la santé est retournée (entier ↔ blessé) et la forme en est une autre ; elle ne dit jamais de secret ;
   - l'inconnu encapuchonné, sur le quai le soir, 8 pièces, jamais faux, et lui seul dit les secrets du rival depuis hier (une rencontre avec un homme encapuchonné d'abord, sinon : il t'a regardé t'entraîner).
   Ce qu'elle dit : la santé (`fit`, `hurt`, `injured`) et la forme, tirée de la préparation que le rival a gagnée hors écran (`formOf` : sous 40 « still rusty », sous 70 « in good form », puis « as sharp as a new blade » ; ses coups valent 1 + préparation ÷ 400, `rivalMods`). La dernière rumeur entendue de chaque rival est gardée telle qu'elle a été dite (`V2State.heard`, jamais la vérité) et se lit sur la page du tournoi et sur la fiche de match, avec sa source et son jour.
3. **Ce que la ville a vu** (EV-11) : sur la page du tournoi (T), pour chaque rival, « Seen in town since yesterday: … » (`seenInTown`), lu dans le journal caché des rivaux (`src/tournament/offscreen.ts`) : entraînements comptés, achats, repos, avec qui il a bu ou échangé des mots (le nom retrouvé dans les mots mêmes que le journal a écrits). Les actes secrets (`spy`, `plot`) n'y paraissent jamais. Rien d'autre ne change : une lecture.
4. **Une réponse par lieu** (EV-10) : la garde payée sur le quai ne garde plus que la forge, dans tous les jeux (les textes `v2.payWatch.*` retirés, ceux du jeu par défaut servent aux deux). Les vestiaires ont leur parade : `lockGear`, la chambre forte du greffier Odo, sur le parvis de jour, la veille d'un combat du joueur (le jour 5 aussi : la coupe donne un combat aux huit le jour 6), 5 pièces, sans créneau. Le trafic (`v2-gear-tamper`) la trouve vide : « At dawn Odo picks up a button in House Dree's colours by its door », l'auteur connu (`culprit-known`), comme la garde le faisait.
5. **Le trafic seulement la veille d'un combat du joueur** — [KO → corrigé], relevé sur `main` : avec le diligent v2, la sangle était coupée dans 19 parties sur 50, dont 14 la veille d'un jour où il ne combattait pas (le jour 9, hors de la finale) : un sabotage sans effet. Une condition neuve des événements, `{ boutTomorrow: true }` (`src/events/types.ts`, `engine.ts`), le réserve à la veille d'un combat du joueur, aux mêmes soirs (jours 5, 7, 9) : 5 parties sur 50 avec le diligent. Pour un finaliste, Cassius vise la finale plutôt qu'un jour 8 sans combat.
6. **Un effet lisible** (EV-10) : la fiche de match dit la sangle coupée et pas recousue, en couleur d'accent (`strapCut`, `v2.sheet.strap`), avec sa réponse : Hilde la recoud avant la cloche (5 pièces, action mineure, permise l'après-midi du combat). Combattue telle quelle, elle se découvre après le combat (`tamper:suffered`, fait `tamper-suffered`, `applyPlayerDuel`).
7. **L'enquête, l'auteur, la compensation** (EV-10) : Lady Edda, sur le parvis de jour, dont le fils (Ser Aldric) a perdu en qualification sur une sangle qui a lâché : après le premier signe (« a servant asked Hilde… »), elle le dit (un signe de plus, en paroles) ; après une sangle combattue sans auteur connu, lui parler suffit : elle reconnaît la coupe et les couleurs de la maison Dree (`edda:witness`, `culprit-known`). Le rapport au sergent Hale paie l'équipement (`v2.report.gearLog` : Cassius −3 points, +15 pièces de la bourse du tournoi) quand la forge n'a pas été touchée ; Edda le sait ensuite. La confrontation sur la place a ses mots pour la sangle ; l'avertissement de l'inconnu (`buyInfo`) nomme les deux lieux et leurs parades. « Proposé » : le récit dit désormais que la main de Cassius a aussi coupé la sangle d'Aldric.
8. **Le joueur curieux** (EV-16, `src/tournament/lab.ts`) : la garde après un signe à la forge seulement ; la chambre forte la veille d'un combat après un signe aux vestiaires ; une rumeur de Lio la veille de chaque combat (une bourse gardée pour le soin) ; son prochain adversaire regardé là où il s'entraîne ; Edda quand une sangle combattue n'a pas d'auteur ; le rapport à Hale. Le diligent ne change pas.
9. **Deux états nommés** (DEV) : `v2-strap-day6` (graine 1842 : Cassius provoqué le premier soir, chaque combat de la poule gagné, les deux signes au jour 4, la coupe en deuxième place, la sangle coupée la nuit du jour 5, la salle de Lio interrogée sur Orla, puis le parvis avant la demi-finale) et `v2-strap-day7` (la demi-finale gagnée sur la sangle coupée, le lendemain matin au parvis). Joués par les actions du jeu, sans champ écrit.
10. **`tools/play-day.mjs` `V2=1`** : la chambre forte d'Odo la veille du premier combat et la parole de l'inconnu le soir, chacune lue dans le bandeau ; le lendemain, la page du tournoi ouverte sur Vessa dit ce que la ville a vu et la parole de l'inconnu, avec son jour.
11. **Textes** (`src/narrative/text/en.ts`) : 54 clés neuves, « proposé » ; les deux clés `v2.payWatch.*` retirées. `AGENTS.md` : la version 2 (`v2=1`), les tests, `play-day`.

### Écart avec la consigne de la tâche — [?] consigné, sur la fiche (L3-9)
- La consigne voulait le TournamentLab identique au JSON près pour le diligent et l'idle v2. C'est vrai pour les règles classiques et dynamiques, l'idle v2 et les trois parties scriptées. Pour le diligent v2, c'est impossible avec EV-10 : il paie la garde chaque soir et elle gardait les vestiaires. Décomposé sur les graines 1 à 50 : dans les 50 parties, mêmes points, rang, victoires, blessures et forge, mêmes taux ; changent la phrase de la garde (dans chaque partie, donc chaque empreinte), 14 sangles coupées sans effet qui disparaissent (point 5) et une sangle trouvée par Hilde au lieu de la garde (graine 4). Sur les graines 51 à 100 et 101 à 150 : mêmes taux ; 22 et 23 sangles sans effet disparues, une trouvée par Hilde, et une ou deux soirées de tricheurs aux cartes de plus (la garde qui déjouait relevait la sécurité de 4, Hilde non).

### Mesures — TournamentLab `--rules=v2`
| | Graines | main (`bc37056`) | branche |
|---|---|---|---|
| diligent : victoires · qualifié · finaliste · blessures | 1-50 | 59,6 % · 88 % · 20 % · 0,76 | identique |
| curieux : victoires · qualifié · finaliste · blessures | 1-50 | 54,9 % · 68 % · 8 % · 0,50 | 51,0 % · 74 % · 16 % · 1,04 |
| curieux | 51-100 | 53,6 % · 62 % · 14 % · 0,72 | 53,3 % · 68 % · 14 % · 0,68 |
| curieux | 101-150 | 56,5 % · 84 % · 8 % · 0,82 | 56,6 % · 76 % · 24 % · 0,70 |

- Ce que le curieux fait du lot (1-50, par partie) : 3,4 rumeurs de Lio (10 pièces), 2,1 observations (1,0 avant), 1,0 chambre forte ; 0,64 trafic tenté, 0,54 déjoué par Odo (0,04 par la garde avant), 0,10 trouvé par Hilde (0,18), 0 subi ; 0,26 rapport à Hale.
- **Les blessures doublées sur 1-50 ne se reproduisent pas** sur deux autres jeux de 50 graines (0,72 → 0,68 ; 0,82 → 0,70). **Décomposition** (une copie hors dépôt, chaque pièce de la politique éteinte à part) : toutes éteintes, les règles du lot redonnent exactement les chiffres de `main` (forge brûlée 0,12, combats perdus 2,22, blessures au combat 0,48, pièces finales 9,78) ; la rumeur seule déplace la forge brûlée (0,12 → 0,30) : trois pièces de moins changent la nuit où Corra attend sur le quai (le curieux l'affronte avant de payer la garde, politique de L2), et c'est cette nuit-là que la forge brûle. Un bruit de politique, pas une règle.
- Les tentatives sur l'équipement montent chez le curieux (0,38 → 0,64) : il ne paie plus la garde après un signe aux vestiaires, et la garde relevait la sécurité de la nuit, ce qui retardait le second signe (0,46 s'il la payait encore).

### Tests — [OK]
- **`tests/v2-intel.test.mjs`** (neuf, 12 tests), oracles écrits dans le test (lieux et heures, seuils de forme, veilles du calendrier) : chaque rival regardé exactement là et quand il s'entraîne, sur dix jours, trois moments et quatre lieux, une fois, la fiche de match qui nomme ses compétences ; le jeu par défaut et ses deux rivaux ; les deux sources (lieux, heures, prix, une fois par jour, sans adversaire à venir, la bourse) ; l'inconnu toujours juste, secrets compris, sur 40 tirages ; Lio juste à 2/3 ± 0,05 sur 900 tirages, sans secret, ses mensonges qui retournent la santé et changent la forme ; ce que la ville a vu, compté contre le journal caché sur une partie entière, sans un secret ; la chambre forte (les veilles des jours 1, 3, 4, 5, pas 2) ; la garde aux mots de la forge dans les deux jeux ; la sangle dite, recousue ou trouvée après le combat ; Edda (signe, témoin une fois, mot après le rapport) ; le rapport et la confrontation selon la chaîne ; l'avertissement de l'inconnu ; le curieux qui s'en sert.
- `tests/v2-events.test.mjs` : la garde ne garde plus les vestiaires, la chambre forte du soir même les garde (pas celle d'un autre soir), aucun trafic la veille d'un jour sans combat, celui de la veille de la finale ; `tests/cost-tags.test.mjs` : les rumeurs (3, 8) et la chambre forte (5) contre leur `apply`.
- **Fautes injectées une à une** (script hors dépôt, chaque fichier rendu à l'octet et vérifié par SHA-256) : 22, dont 21 attrapées au premier passage (Lio toujours juste, l'inconnu sans secret, Lio qui dit les secrets, un mensonge qui garde la santé, la page qui montre l'espionnage, « depuis avant-hier », la chambre forte sans combat le lendemain, sans le jour 5, la garde qui garde encore les vestiaires, la chambre forte d'un autre soir, la sangle combattue non trouvée, Edda sans sangle combattue, son signe sans le premier signe, Cassius qu'on ne peut plus regarder, Rhosk avant le jour 6, le rapport de l'équipement quand la forge est connue, un seuil de forme décalé, les rumeurs dans le jeu par défaut, le curieux sans chambre forte). [KO → corrigé] « Le trafic sans combat le lendemain » passait : le cas de test retirait aussi la demi-finale, et la condition `semi` suffisait à tout refuser ; réécrit (un finaliste le jour 7), attrapé. « Tout le monde observable dans le jeu par défaut » ne changeait rien d'observable (sa liste ne lit pas `scoutable`) : remplacée par « la liste du parvis du jeu par défaut étendue », attrapée.
- `npm test` **460 sur 460**, `npm run typecheck`, `npm run build`, `npm run art:validate` (73 manifestes, 123 sources archivées, 0 erreur ; 23 manifestes de son).

### Preuves — [OK]
- **Serveurs** par `preview_start` : la branche en DEV `:5281`, `main` figé (`git archive` de `bc37056`) en DEV `:5282`, les deux paquets de production par `vite preview` `:5283` et `:5284`.
- **Le jeu par défaut, inchangé** : `detshots` à 0 px au seuil 0 contre `main` figé sur douze vues (la ville de nuit et à midi ; le mode jouable par défaut à l'ouverture, avec la liste Q, Mara, le journal et le tableau ; son premier soir avec la liste ; la ville d'une partie v2 à l'ouverture, avec la liste Q et Mara), l'arène par défaut et le duel v2, trois moments chacun (`HOLD=1 FREEZE_CSS=1`) : dix-huit images à 0 px, témoin de répétition à 0 px, contrôle négatif (nuit contre midi) 97 %. **Les paquets** : les mêmes dix-huit images à 0 px, sauf la ville de nuit et à midi : 237 et 244 pixels dans le compteur « FPS / frame ms » du panneau de performance, une mesure vivante (vu agrandi : 60 contre 12 images par seconde ; le témoin branche contre branche y bouge aussi à midi, 81 pixels), comme en Passe GA4 ; l'entrée garde sa taille (220 044 octets) ; changent `save` (+5,6 Ko : la simulation), `text` (+4,4 Ko), `board`, `townUi`, et les noms des morceaux qui les nomment.
- **Empreintes** : `play-day` par défaut `6a942086a2616ab2` (celle des Passes EVL1 à GA4) ; `play-flow` sur le paquet de production : par défaut `0025acce7a403773`, `V2=1` `cf669f2d59e33a8d`, sur les deux paquets (celles des Passes EVL1 à GA4 : la partie v2 de `play-flow` ne passe par rien de ce lot).
- **Une partie v2 jouée dans le navigateur** : `play-day` `V2=1` (1842) : tous les contrôles passent (la chambre forte et la parole de l'inconnu dans le bandeau, la page du tournoi sur Vessa : « Seen in town since yesterday: drilled, drank with Tobin Fenn. », « Heard from the hooded stranger on day 1: Vessa Lark is whole, and is still rusty… »), Node rejoue à la même empreinte, `9f7aa09e947f678b` (elle change : deux actions de plus).
- **`ui-text`** : neuf pages, chacune à 1 600 × 900 et 390 × 844, dix-huit sur dix-huit : Odo et sa chambre forte, Lio et sa rumeur, l'inconnu le soir, la fiche de match à la sangle coupée, la page du tournoi (vu, entendu), Edda (signe, témoin), Cassius et Orla à regarder ; 16 px et 14 px au plus petit.
- Vu sur les captures (`play-shots`, DEV) : la fiche de la demi-finale avec la rumeur de Lio sur Orla et la sangle en couleur d'accent ; Edda le jour 7 ; la page du tournoi au jour 6. Corrigé après les avoir vues : la page disait « drilled » et la rumeur « has hardly drilled » le même jour (la forme est la préparation cumulée) : les formes deviennent « still rusty », « in good form » ; l'étiquette de Lio répétait ses 3 pièces à côté de l'étiquette de prix (la forme « (3 coins: …) » que `shortLabel` sait lire).

### La fiche — publiée, rien de décidé
- Page privée https://claude.ai/artifact/SJ7N5DK32AqxGMaYKPCxGs, source `briefs/fiche-l3.html` (la page de la fiche de L2), neuf captures publiées avec elle (pas dans le dépôt). La collection `decisions` a été relue vide à la publication.
- Douze cartes, chacune avec sa recommandation : L3-1 observer tout adversaire (« Garder ») ; L3-2 les deux sources (« Garder ») ; L3-3 ce que dit une rumeur (« Garder les mots, sans chiffre ») ; L3-4 ce que la ville a vu (« Garder ») ; L3-5 la chambre forte d’Odo (« Garder Odo (5 pièces) » ; « une nuit à la caserne » en alternative) ; L3-6 le trafic seulement la veille d’un combat (« Garder la correction ») ; L3-7 la sangle sur la fiche de match (« Garder ») ; L3-8 Lady Edda, l’auteur et la compensation (« Garder ») ; L3-9 l’écart du diligent au JSON (« Accepter l’écart ») ; L3-10 le curieux avant et après (« Garder ») ; L3-11 Hale, Corra et Ambrose pour L4 (« Les garder pour L4 ») ; L3-12 « Fusionner après la fiche, essayer ensuite ».

### Archive du journal
- Les passes GA1 et GA2 (branche `claude/generiques-art`, fusionnée) déplacées à l'octet dans `journal/62-passes-GA1-GA2.md` : le corps de l’archive est égal aux octets retirés (23 572 octets), chaque passe est dans un seul fichier, les fins de ligne CRLF sont gardées. Les passes gardées font ensuite environ 50 000 octets.

### Relevés hors du lot
- « Your bouts are fought » le jour 7 pour un finaliste (déjà relevé, Passe EVL3) : vu de nouveau sur la capture d'Edda ; il revient à L5 ou à une décision.
- La branche locale `claude/generiques-peaux` (à `bc37056`, sans commit, non poussée) existe dans un autre worktree : une autre séance. Celle-ci fusionnera la première ou rejouera sur `main`.

### Où reprendre
- Relire `decisions` quand l'opérateur dit la fiche remplie, consigner mot pour mot (journal, `briefs/audit-gameplay-ev1.md`), appliquer, refaire les preuves touchées, puis fusionner selon L3-12. La passe qui fusionne dit ce qui revient à L4 : les événements et les rivalités (EV-7 à EV-9), et Hale, Corra et Ambrose (L3-11).

### Pensée
- Une consigne de preuve écrite avant la conception (« au JSON près pour le diligent ») se relit contre le choix qu'elle accompagne : un joueur témoin qui s'appuyait sur l'ancienne règle ne peut pas rester identique ; on prouve alors ce qui doit l'être (ses combats, ses taux) et l'on nomme chaque différence.
- Un sabotage se mesure à ce qu'il change : lister, pour chaque tentative du laboratoire, ce qui s'est passé le lendemain a montré qu'elle frappait 14 fois sur 19 un jour sans combat.
- Une politique dont chaque pièce dépensée change la nuit suivante se juge sur plusieurs jeux de graines et pièce par pièce : sur un seul jeu, un doublement des blessures n'était que du bruit.
- Un mot d'interface se relit à côté des autres pages le même jour : « drilled » sur la page du tournoi et « has hardly drilled » dans la rumeur disaient deux choses vraies qui se lisaient comme une contradiction.

## Passe EVL6 — La fiche de L3 relue : douze sur douze à la recommandation ; la branche fusionnée (2026-11-07)

### Demande
- L'opérateur, mot pour mot : « Fiche remplie ». Relire `decisions` (https://claude.ai/artifact/SJ7N5DK32AqxGMaYKPCxGs, source `briefs/fiche-l3.html`), consigner mot pour mot, appliquer ce qui change, refaire les preuves touchées, puis fusionner selon L3-12.

### Les choix de l'opérateur, mot pour mot (douze sur douze, cliqués le 2026-11-08 entre 01 h 43 et 01 h 45 UTC, aucune note)
| Carte | Ce qu'elle demandait | Choix |
|---|---|---|
| L3-1 | Observer tout adversaire, là où il s'entraîne | « Garder » |
| L3-2 | Deux sources de rumeurs, vraies ou fausses selon la source | « Garder » |
| L3-3 | Ce que dit une rumeur : la santé et la forme | « Garder les mots, sans chiffre » |
| L3-4 | Ce que la ville a vu, sur la page du tournoi | « Garder » |
| L3-5 | La garde du quai garde la forge ; Odo garde les vestiaires | « Garder Odo (5 pièces) » |
| L3-6 | Le trafic d'armure seulement la veille d'un de tes combats | « Garder la correction » |
| L3-7 | La sangle coupée se lit sur la fiche de match | « Garder » |
| L3-8 | Lady Edda, l'auteur et la compensation | « Garder » |
| L3-9 | Le diligent v2 n'est plus identique au JSON près | « Accepter l’écart » |
| L3-10 | Le joueur curieux, avant et après | « Garder » |
| L3-11 | Hale, Corra et Ambrose, laissés pour L4 | « Les garder pour L4 » |
| L3-12 | Fusionner, puis ton essai | « Fusionner après la fiche, essayer ensuite » |

- Les douze choix suivent la recommandation de leur carte. Rien à appliquer : le lot reste tel que la Passe EVL5 l'a construit et prouvé. « Une nuit à la caserne » (l'autre parade de la recommandation EV-10) n'est pas construite (L3-5). L'écart avec la consigne de la tâche (le diligent v2 au JSON près) est accepté par l'opérateur (L3-9) : le joueur diligent garde ses combats, ses points et ses taux, mais plus son JSON.

### Preuves
- Aucun code ne change depuis `aa141a2`, et `main` est resté à `bc37056` : les preuves de la Passe EVL5 tiennent telles quelles (tests, 0 px du jeu par défaut en DEV et sur les paquets, empreintes `play-day` et `play-flow`, laboratoire, partie v2 jouée dans le navigateur et rejouée en Node, `ui-text`). `npm run typecheck` et `npm test` relancés sur le commit de cette passe.

### La fusion
- La branche `claude/l3-information` (Passes EVL5, EVL6) est fusionnée en avance rapide dans `main` (L3-12 « Fusionner après la fiche, essayer ensuite ») ; `main` est poussé, et la branche supprimée, locale et distante. Ton essai : `npm run dev`, puis `/?play=1&new=1&v2=1`.

### Ce qui revient à L4 (les événements et les rivalités, EV-7 à EV-9)
- EV-7 « Les suites des actions, puis un par lieu, puis le ciblé », avec la note de l'opérateur, mot pour mot : « il faut que cela puisse impacter la preparation du joueur en jouant sur cet aspect imprevisible » ; EV-8 « Hors des nouvelles, dans les répliques et le son » ; EV-9 « Chaque rival se souvient ; deux autres agissent ».
- Les gens que L3 laisse à L4 (L3-11 « Les garder pour L4 ») : le sergent Hale et son registre (une rumeur), Corra Dunmere et Frère Ambrose (des yeux en ville la nuit). EV-9 recommandait aussi qu'« un rival aidé peut avertir d'un sabotage ».
- Ce que L3 donne à L4 : la condition `{ boutTomorrow: true }` des événements ; le journal caché des rivaux lu par la page du tournoi (`seenInTown`), qui montrera ce que leurs rivalités changent ; les rumeurs gardées telles qu'elles ont été dites (`V2State.heard`) ; les deux chaînes de Cassius, chacune avec sa parade à son lieu.
- Hors de L4 : « Your bouts are fought » le jour 7 pour un finaliste (Passes EVL3, EVL5), à L5 ou sur décision.

### Pensée
- Une fiche relue sans note, toute à la recommandation, n'appelle pas de nouvelle preuve quand ni le code ni `main` n'ont bougé : on le vérifie (le commit, `origin/main`) avant de fusionner, plutôt que de refaire les séries.

