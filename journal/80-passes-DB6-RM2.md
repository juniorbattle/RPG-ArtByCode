# Journal de bord — archive : passes DB6, RM2 (2026-11-09)

> Déplacées mot pour mot de `JOURNAL.md` le 2026-11-10 (Passe ECO1) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe DB6 — La fiche DB5 relue : sept sur sept, une hors recommandation et une note ; deux décisions A3 consignées ; l'équipement ajouté à l'audit (2026-11-09)

### Les choix de l'opérateur, mot pour mot
- L'opérateur, mot pour mot : « Fiche remplie /// mais nsommes nous sure totalement ? ». Collection `decisions` de https://claude.ai/artifact/GbCXvxRKve2YsYP74YYK4Y (`briefs/fiche-db5.html`), cliquée le 2026-11-09 entre 19 h 34 min 09 s et 19 h 38 min 36 s UTC :

| Carte | Ce qu'elle demandait | Choix | Note |
|---|---|---|---|
| DB5-1 | Le poids des compétences | « 20 % (28 % au niveau 5) » | — |
| DB5-2 | La garde des rivaux, à briser | « 90 %, garde à −80 % » | — |
| DB5-3 | Une recharge pour chaque compétence | « 5 × le temps de charge » | — |
| DB5-4 | La rupture : le temps de frapper fort | « 10 s, ×2, jauge de 70 » | — |
| DB5-5 | L’attaque simple | « 1 % » (recommandé : 0,5 %) | — |
| DB5-6 | Quand le joueur monte ses compétences | « PV ×1,4 au tableau » | — |
| DB5-7 | Les combats épiques | « La finale » | « mais aussi des defis particuliers ( a definir plus tard ) » |

- **Décisions A3 consignées** (E11), le 2026-11-09 : **DB5-3 « 5 × le temps de charge »** remplace « Pas de recharge » (spécification § 4, § 11) et C2-5 « Aucune » (§ 17), la porte que G5 laissait ouverte (« pas prevu mais cela peut etre integre si on juge que le jeu est pas assez structure ») ; **DB5-4 « 10 s, ×2, jauge de 70 »** remplace DB-5 « Jauge par les compétences, ×2 pendant 8 s » (la jauge de 100) : l'étourdissement de 10 s reste dans les 5 à 10 s de G3. La durée « en 2 et 5 min » (Passe DB5) les accompagne.
- DB5-2 (« garde à −80 % ») change le point de départ −60 % de la garde (CB-5), une règle pour les deux combattants : son choix, consigné. DB5-7 : les « défis particuliers » épiques restent à définir avec lui.

### Sa question, et la réponse mesurée
- À « mais nsommes nous sure totalement ? » : non, pas totalement. Mesuré sur le paquet exact de ses choix (l'attaque simple à 1 %, coups des rivaux ×1,6 sur ceux de DB3, 20 graines par rival) : 2,2 min au joueur moyen (rivaux 2,0 à 2,4), escalier 15 / 61 / 91 %, marteleur 0 %, l'attaque simple la moitié des dégâts ; un joueur entraîné passe sous 2 min (niveau 3 : 1,6 min ; niveau 5 : 1,3 min ; 1,8 min encore face aux rivaux ×1,4 du tableau) ; ×1,8 au tableau ramènerait le niveau 5 à 2,1 min mais le joueur du niveau 1 n'y gagnerait que 11 % ; l'épique de la finale 5,1 à 5,3 min. À 0,5 % : 3,0 min, le niveau 5 au tableau 2,1 min. Le reste dit sans détour : le bot n'est pas un joueur (il ne garde pas sa compétence pour la rupture), les recharges sont prototypées hors du jeu et leur affichage n'est pas conçu, la garde à 90 % change l'identité des rivaux, rien n'est recalé sur des parties entières. Question posée : revenir à 0,5 % ou garder 1 %.
- Puis l'opérateur, mot pour mot : « mais n'oublie pas qu'il y a aussi l'amelioration des armes et armures donc attaque defense et etc... ».

### L'équipement mesuré — [OK] il cassait le calibrage
- **L'outil** : `gear<n>` (quatre états, comme `v2Mods` les donne : 0 rien ; 1 ce que porte le joueur du laboratoire, ×1,10 sur l'attaque et ×0,94 sur les dégâts reçus ; 2 la lame au palier 1, une pierre, une séance, la cotte, l'enveloppe, ×1,37 / ×0,88 / PV ×1,06 ; 3 la lame au palier 3, une pierre, deux séances, la cotte, l'enveloppe, l'anneau, ×1,65 / ×0,88 / PV ×1,06 / jauge ×0,85) ; `gearatk<k>` (l'attaque d'équipement à k % de la sienne, la défense entière) ; les variantes qui fixent les dégâts du joueur (`skp`, `lightpct`) gardent l'attaque d'équipement par-dessus.
- **Le joueur du laboratoire s'équipe à peine** (20 parties) : `diligent` ×1,05 à ×1,10 sur l'attaque (son entraînement, une pierre), ×0,94 sur les dégâts reçus (la veste) ; `curious` ×1,00 à ×1,06, ×0,91 à ×0,94. Le recalage de DB3 valait pour un joueur peu équipé. [?] L'attaque plus faible du curieux (moins d'entraînement) peut expliquer une part de sa chute relevée en DB3 ; non prouvé.
- **La grille** (attaque simple 0,5 %, le paquet DB5, 10 graines par rival, le joueur moyen) : en poule, de 3,1 min (rien, niveau 1) à 1,1 min (équipement 3, niveau 5), l'Estocade alors à 55 % de la barre franche et 105 % sur une rupture ; au tableau (×1,4) de 3,5 à 1,2 min ; la finale (×2,5) de 6,9 à 2,1 min. À 1 % : 2,2 à 0,7 min en poule. Fichier de la grille hors dépôt ; refaite par `--audit` sur `gear<n>+lv<n>+epic<k>`.
- **Le rythme des règles** : l'entraînement monte une compétence d'un niveau par créneau jusqu'au niveau 3 (`TRAIN_CAP`), les niveaux 4 et 5 viennent des défis gagnés ; l'équipement s'achète avec les pièces. Courbe attendue retenue pour la mesure : poule niveau 1, équipement 1 ; tableau niveau 3, équipement 2 ; finale niveau 3, équipement 3.
- **Quatre corrections sur cette courbe** (et un joueur en avance, niveau 5 tout équipé, et en retard, niveau 1 sans rien, au tableau) : DB5 tel quel 2,9 / 2,2 / 3,0 min (en avance 1,2 min, en retard 3,5 min et 34 %) ; rivaux seuls plus endurants (×1,8 au tableau, ×4 en finale) 2,9 / 3,0 / 4,7 (en retard 13 %) ; attaque d'équipement à moitié seule 3,0 / 2,6 / 3,7 ; **attaque d'équipement à moitié, ×1,6 au tableau, ×3,5 en finale : 3,0 / 3,0 / 5,1 min** (en avance 1,9 min, l'Estocade de niveau 5 à 27 % de la barre d'un rival du tableau, 54 % sur une rupture ; en retard 3,6 min et 23 %). Avec l'attaque simple à 1 %, ce dernier réglage donne 2,2 / 2,4 / 4,2 min. [KO de méthode, corrigé] un premier relevé lisait les variantes par leur ordre alors que des clés identiques d'une correction à l'autre (la poule) s'étaient fondues : relu par clé.
- `briefs/audit-combat-db5.md` § 5 bis : l'équipement, sa progression, ce tableau, la lecture.

### La fiche DB6 — publiée, rien de décidé
- https://claude.ai/artifact/F3ebcGDEjkwBvStFpGgQpp (`briefs/fiche-db6.html`), collection `decisions` relue vide ; vérifiée dans Chrome (deux cartes, six options, aucune erreur, aucun débordement à 375 px) : **DB6-1** tenir 2 à 5 minutes quand le joueur s'équipe (« Attaque d’équipement à moitié, ×1,6 / ×3,5 », qui remplace le ×1,4 de DB5-6) ; **DB6-2** l'attaque simple (« 0,5 % », son 1 % de DB5-5 parmi les options). Ce qui reste incertain y est dit (le bot, les recharges à construire, la courbe tirée des règles).

### Validation
- Rien du jeu ne change sur cette branche (l'outil, l'audit, les fiches, le journal) : `npm run typecheck` ; `npm test` ; `npm run build` ; `npm run art:validate` : voir le commit.
- Les passes gardées dépassaient 60 Ko (64,3 Ko) : RG1, RG2 et RG3 (branches fusionnées) déplacées à l'octet dans `journal/76-passes-RG1-RG3.md`, la ligne ajoutée à l'index ; preuve par script : le corps de l'archive égale les 28 294 octets retirés, le journal reconstruit égale l'original, CRLF partout, chaque passe dans un seul fichier. 36,7 Ko de passes restent.

### Où reprendre
- Attendre la fiche DB6 ; consigner ; amender `briefs/combat-system.md` (§ 2 la durée, § 4 les recharges, § 5 la garde et la riposte, § 6 la rupture, § 11, § 18) ; appliquer dans le jeu par défaut tout le combat de DB4 à DB6 (les compétences en part de la barre et l'échelle Marek 600 / Ren 150, les PV des rivaux resserrés, leur garde à 90 % et la garde à −80 %, les recharges comme règle de `DynamicSim` portée par ses données et leur affichage dans le HUD, la rupture 10 s ×2 et la jauge de 70, l'attaque simple, l'attaque d'équipement si DB6-1 la réduit, les rivaux du tableau et l'épique de la finale au calendrier) ; recaler sur des parties entières (six sur dix) et remesurer `V2_RACERS` ; revoir les états nommés et les textes du tutoriel du premier combat (ils lisent les nombres du duel) ; prouver ; fusionner ; puis l'essai de l'opérateur. Les « défis particuliers » épiques de DB5-7 restent à définir avec lui.

### Après la publication de la fiche DB6 — la direction de l'opérateur, mot pour mot (2026-11-09)
- « Les donnes que je donne sont a titre suggestifs le but 'est pas de controller de maniere strict la duree du combat si un combat dure plus longtemps, c'est que c'est normal... moi je veux de la coherence... avoir des combats rythmes et passionnant avec des actions impactantes... mais nou'oublions pas que nous basons les actions d'un combattant par ses stats personnelles  ameliorer a travers les equipement  et/ou le niveau gagnes etc... bref c'est un rpg notre jeu , et je trouve que nous negligeons cette aspect »
- Lecture : les durées (DB5, « 2 et 5 min ») sont des repères, pas un réglage à tenir strictement ; ce qui compte : la cohérence, des combats rythmés et passionnants, des actions qui pèsent, et des dégâts **tirés des statistiques propres de chaque combattant** (montées par l'équipement et les niveaux), comme dans un RPG. La fiche DB6 chiffrait encore des parts de barre et des corrections de durée : **suspendue** (à ne pas remplir), remplacée par une proposition de statistiques des combattants (la suite). [?] « le niveau gagnes » : les niveaux des compétences, ou un niveau du personnage ? Le contrat projet § 7 fonde la progression sur plusieurs couches (compétences, équipement, armes, relations…) et dit : « Le jeu doit éviter qu'une unique statistique de niveau rende toutes les autres décisions secondaires. » Des statistiques montées par l'équipement, l'entraînement et les niveaux des compétences y tiennent ; un niveau du personnage devrait rester une couche parmi d'autres : à lui demander.

### Pensée
- Un réglage fait sur un personnage nu ne tient pas : chaque couche de progression (niveaux, arme, forge, entraînement) multiplie les dégâts, et leur produit (×2,3) décide de la fin du tournoi. Un équilibre se mesure sur la courbe attendue du joueur, avec un joueur en avance et un en retard de part et d'autre.
- L'opérateur avait raison de rappeler l'équipement : le modèle de l'audit le laissait de côté.

## Passe RM2 — La fiche du remappage relue : dix sur dix à la recommandation, avant de construire (2026-11-09)

### Demande
- L'opérateur, mot pour mot : « Sheet filled ». Relire `decisions` (https://claude.ai/artifact/4P3YLfmeqPEzbtMkPDiZK3, source `briefs/fiche-remappage.html`) et consigner mot pour mot, avant de construire.

### Les choix de l'opérateur, mot pour mot
- Neuf cartes cliquées sur la fiche le 2026-11-09, entre 20 h 26 min 27 s et 20 h 26 min 46 s UTC, aucune note. **RM-2 n'avait aucun choix enregistré** (la collection relue n'en a pas de document : carte non cliquée ou écriture perdue). Une ligne absente n'étant pas un choix, la question a été posée à l'opérateur dans la conversation, avec les trois options de la carte ; sa réponse, mot pour mot : « Deux touches par action, celles d’aujourd’hui au départ » (l'étiquette « (Recommended) » de la question laissée de côté).

| Carte | Ce qu'elle demandait | Choix |
|---|---|---|
| RM-1 | Quelles actions peut-on changer | « Les actions du jeu, les touches des pages fixes » |
| RM-2 | Une ou deux touches par action | « Deux touches par action, celles d’aujourd’hui au départ » (dans la conversation) |
| RM-3 | Le clavier seul, ou la manette aussi | « Le clavier seul ; la manette garde sa disposition » |
| RM-4 | Une touche déjà prise, et les touches réservées | « Échanger les deux touches, une liste de touches réservées » |
| RM-5 | Tes touches et la ligne « Clavier » | « Chaque clavier garde ses touches ; la ligne donne celles de départ » |
| RM-6 | Les touches affichées suivent-elles les tiennes | « Toutes les touches affichées suivent, tutoriel compris » |
| RM-7 | Le nom des touches en français | « Les noms français : Espace, Entrée, Échap, Maj » |
| RM-8 | Où et comment on change une touche | « Dans la partie Contrôles, une ligne par action » |
| RM-9 | Où les touches sont gardées | « Dans les réglages du navigateur, jamais dans la sauvegarde » |
| RM-10 | Le lot, ses preuves et la fusion | « Un lot fusionné dès ses preuves, ton essai ensuite » |

### Ce qu'ils demandent : le lot à construire
- **Les actions modifiables** (RM-1) : marcher (les quatre directions), courir, parler (la réplique suivante d'une scène suit cette touche, comme E aujourd'hui), la liste, la carte, les six raccourcis des pages (journal, tournoi, compétences, équipement, réglages, guide), couper le son ; au duel l'attaque, la garde, l'esquive et la pause. Fixes : Échap (menu, retour, passer une scène, réglages depuis la pause), Entrée, les flèches et Espace dans les pages, H et R au duel. Le duel du jeu d'avant (`v2=0`, touches 1 à 6) et le prototype de l'arène gardent les leurs.
- **Deux cases par action** (RM-2), remplies au départ avec les touches d'aujourd'hui (W A S D et les flèches ; E et Espace ; au duel J et 1, K et B, L et A) ; chacune se change, la seconde peut rester vide, une action garde toujours au moins une touche ; rien de gardé = le jeu d'aujourd'hui, touche pour touche.
- **Le clavier seul** (RM-3) : la manette garde la disposition de la fiche MN (MN-2 à MN-6), montrée en regard dans la table ; elle presse les touches du jeu (`isTrusted` faux), que la traduction laisse telles quelles, comme l'AZERTY aujourd'hui.
- **Les conflits** (RM-4) : dans un même moment (la marche : la ville, les places, Explore, avec la liste et les raccourcis ; le duel), la touche choisie passe à l'action et l'action qui l'avait prend l'ancienne touche, une ligne le dit ; d'un moment à l'autre une touche peut servir deux fois. Réservées, jamais proposées : Échap, Entrée, Tab, F1 à F12, Ctrl, Alt, la touche Windows, et Retour arrière, qui vide une case (RM-8). Les touches d'outil cèdent : H et R au duel, H (le panneau DEV) et F (la forge) dans Explore ne font plus leur outil quand une action y est.
- **L'AZERTY** (RM-5) : la ligne « Clavier » donne les touches de départ du clavier choisi ; chaque clavier garde ses propres touches (passer de l'un à l'autre ne perd rien) ; « Touches par défaut » remet celles du clavier affiché. Une touche est retenue par sa place (`code`) et la lettre qu'elle montrait quand le joueur l'a choisie : elle répond Maj tenue ou non (la touche 1 d'un AZERTY répond enfin au duel), et les touches affichées montrent cette lettre.
- **Les touches affichées** (RM-6) suivent toutes, à l'instant : le bas de l'écran, le menu, la barre et la pause du duel, les scènes, l'écran titre, les textes du tutoriel et du guide, la table des contrôles, le HUD d'Explore ; chacune montre la première touche de l'action, la table les deux ; chacune retient son action, que la couche de la manette lit pour montrer son bouton (aujourd'hui `capButton` lit la lettre).
- **Les noms** (RM-7) : en français Espace, Entrée, Échap, Maj, Flèches ; en anglais les noms anglais ; un signe s'affiche tel quel.
- **La page** (RM-8) : dans la partie Contrôles, une ligne par action avec ses deux cases et le bouton de manette en regard ; Entrée ou un clic sur une case, « Appuyez sur une touche », Échap annule, Retour arrière vide la case ; une ligne « Touches par défaut » en bas ; les touches fixes montrées en gris ; la manette parcourt la page et remet les défauts, une touche se choisit au clavier.
- **La garde** (RM-9) : dans `cite-du-tournoi.settings`, chaque touche vérifiée à la lecture (une touche inconnue ou réservée reprend son défaut), jamais dans la sauvegarde ; un navigateur piloté par les outils part des touches d'aujourd'hui.
- **La livraison** (RM-10) : un lot dans le jeu par défaut (VD-8), fusionné dès ses preuves : le jeu sans touche gardée à 0 px contre `main` (DEV et paquets), des tests (la table, les échanges, chaque clavier et ses touches, chaque touche affichée), une preuve au clavier dans un navigateur qui ne s'annonce pas piloté (chaque action changée puis jouée : la marche, la liste, une scène, le duel), la manette inchangée (`tools/pad-proof.mjs`), `tools/ui-text.mjs` et `tools/ui-contrast.mjs` sur les nouvelles lignes dans les deux langues ; ensuite l'essai de l'opérateur.

### Suite
- Le lot du remappage dans une séance à part (son brief : cette passe et la Passe RM1, l'inventaire des trois façons de lire une touche et des touches affichées). `AGENTS.md` (section « Settings », « Controls ») dit les choix.

### Pensée
- Une carte restée vide n'est pas un choix : la collection relue se compte contre les cartes de la fiche avant de consigner, et la question manquante se pose à l'opérateur (ici neuf documents pour dix cartes).

