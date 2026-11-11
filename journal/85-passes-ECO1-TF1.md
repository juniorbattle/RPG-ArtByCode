# Journal de bord — archive : passes ECO1, TF1 (2026-11-10)

> Déplacée mot pour mot de `JOURNAL.md` le 2026-11-11 (Passe MD1) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe ECO1 — L'argent d'une partie de la version 2 : l'inventaire, la courbe des pièces mesurée et la fiche publiée ; rien d'appliqué (2026-11-10)

### Demande
- L'opérateur, après son essai du 2026-11-10, mot pour mot : « On doit aussi pouvoir trouver le moyen de gagner de l'argent pour financer notre equipement et preparer nos prochains combats car ils semble dur de gagner de l'argent par moment ».
- Séance ouverte par une autre séance (brief : inventorier l'économie, mesurer la courbe des pièces au TournamentLab, préparer une fiche chiffrée, attendre les choix ; ne pas toucher aux nombres du duel, qu'une séance parallèle retravaille ; ajouter les textes français sans réécrire les existants). Branche `claude/economie-v2`, tirée de `main` `df16326` (Passe DB10).

### L'inventaire — [OK]
- **Ce qui rapporte** : 60 pièces au départ (`content.ts`) ; 20 par combat gagné, 5 par combat perdu, de la poule à la finale (`pool.ts` `applyPlayerDuel`, six combats au plus) ; 100 au champion, à la fin (`v2calendar.ts`) ; un défi gagné avec mise, +10 net, une fois par phase (`v2town.ts`, `STAKE`) ; les caisses de Mara le matin au quai, +6 et un créneau (`roles.ts` `restock`, la seule tâche payée) ; la cargaison d'acier, +8 une fois ; le rapport à Hale +15, le saboteur pris +15 (la guilde) ; la Bourse des Lanternes, 30, au seul qui ouvre le défilé du jour 9 (`v2festival.ts`) ; des événements (+10 des parieurs du parvis, −4, −5).
- **Ce qui coûte** : la lame importée 30, le sabre 61, la forge 10 / 25 / 40 (`TIER_PRICE` ; une arme neuve repart au palier 0), la veste 21, la cotte 46, le haubert 34, l'anneau 28, les bottes 33, la bande 14, le ruban 11 ; la pierre 8 avant chaque combat (consommée), l'onguent 10, les soins 8 ; une compétence 35 à 45 (`skillbook.ts`) ; les rumeurs 3 ou 8, la chambre forte 5, Hilde 5, le guet 15 la nuit, la forge à réparer après un sabotage ; la mise d'un défi 10.
- **La courbe du combat** (Passe DB10, « The DB7 sheet's curve ») suppose l'équipement 2 au tableau (la lame au palier 1, la cotte, la bande : environ 100 pièces) et l'équipement 3 en finale (les trois paliers, l'anneau, la bande, la cotte, la pierre : environ 200).

### La courbe des pièces mesurée — [OK]
- Script hors dépôt (le chargeur de `tests/load.mjs`, les politiques du laboratoire, 30 parties v2, graines 1..30) : la bourse chaque matin et chaque pièce gagnée ou dépensée rangée par action.

| Joueur | Bourse le matin j2 / j4 / j6 / j8 / j10 | Gagné en 10 jours | Dépenses principales | Objets portés |
|---|---|---|---|---|
| `idle` | 60 / 60 / 76 / 80 / 81 | +21 (combats 27, événements −7) | aucune | 0 |
| `diligent` | 25 / 8 / 27 / 8 / 5 | +68 (combats 53, événements 15) | le guet 96 (chaque soir, sans signe), la veste 20, Hilde 8 | 1 |
| `curious` | 0 / 4 / 19 / 12 / 20 | +87 (combats 63, défis 9, événements 11, festival 4) | pièces des passants 44, marchandages 19, amendes de vol 16, guet 14, rumeurs 8 | 2,8 |

- **Aucun joueur du laboratoire n'achète d'arme ni de palier** : le laboratoire ne voit pas l'économie que la courbe du combat suppose.
- **Un joueur « planificateur »** (script hors dépôt, `plan.mjs` : il se soigne, achète dans l'ordre de la courbe — la lame, la forge, la cotte, la bande, la forge, l'anneau, la forge —, répare la forge quand elle est froide, s'entraîne deux fois, exerce l'Estocade et l'attaque puissante, combat au bot 0,6 ; les travaux et les bourses proposés simulés en ajoutant des pièces à l'état, aucune règle changée), 30 parties :

| Variante | Pièces en plus | Équipement 2 au jour 6 | Équipement 3 au jour 10 | Combats gagnés | Finale atteinte |
|---|---|---|---|---|---|
| aujourd'hui | — | 0 % (2,1 objets sur 7) | 0 % (3,7) | 45 % | 3 % |
| les caisses de Mara seules (+6) | +7 | 0 % | 0 % | 45 % | 7 % |
| un travail par jour, 8 | +80 | 50 % | 17 % | 48 % | 13 % |
| **un travail par jour, 10** | **+100** | **97 %** | **50 %** (80 % achetables ce matin-là) | **51 %** | **20 %** |
| un travail par jour, 15 | +150 | 100 % | 100 % (64 pièces en trop à la fin) | 50 % | 10 % |
| un travail par lieu et par jour, 10 (11,6 travaux) | +116 | 97 % | 87 % | 51 % | 17 % |
| bourses par étape seules | +18 | 0 % | 0 % | 45 % | 3 % |
| **un travail par jour à 10 et bourses par étape** | **+123** | **97 %** | **97 %** | **51 %** | **20 %** |

- [KO de méthode, corrigé] un premier passage du planificateur restait bloqué au deuxième palier : la forge sabotée (il ne paie pas le guet) ; le script répare désormais la forge (30 réparations sur 30 parties). Un sondage qui laissait passer le temps sur un après-midi de combat bouclait sans fin (l'attente y est refusée) : arrêté, non relancé.
- [?] Le planificateur est un programme à ordre d'achat fixe ; un joueur réel dépense aussi en compétences, pièces des passants et rumeurs. Les victoires (45 → 51 %) et la finale atteinte (1 → 6 sur 30) bougent peu sur 30 parties.

### La fiche ECO1 — publiée, rien de décidé
- https://claude.ai/artifact/RmLKYWsLnJfp9yRS7dRCTB (`briefs/fiche-eco1.html`, le gabarit des fiches DB), collection `decisions` relue vide après publication.
- Huit cartes en cinq familles :
  - **ECO-1** le constat (« C’est bien ça ») ;
  - **ECO-2** les petits travaux, un par lieu à son moment, chez quelqu'un qu'on connaît (le quai le matin chez Mara, ses caisses ; le terrain d'entraînement le matin chez Maître Corvin, les boucliers de ses élèves ; le parvis l'après-midi chez Hilde, les armures des combattants du jour ; la place de la halle le soir chez Lio, servir dans sa salle), un créneau, l'amitié de l'employeur comme Mara aujourd'hui ; recommandé « Un travail par jour, à son lieu et à son moment » ;
  - **ECO-3** la paie : recommandé « 10 pièces » ;
  - **ECO-4** les bourses par étape : recommandé « jour 6 35 / 10, jour 8 45 / 15, finale 80 / 30 », la poule et les 100 du champion inchangés ;
  - **ECO-5** les paris chez les parieurs du parvis : recommandé « Pas de paris » (une défaite coûterait aussi la mise, au moment où l'argent manque) ;
  - **ECO-6** la revente : recommandé « Mara rachète à moitié prix ce qui est dans le sac, jamais un objet volé » ;
  - **ECO-7** la lecture : recommandé l'étiquette « +10 pièces » dans la liste (Q), un chapitre « Gagner des pièces » dans le guide (H), un conseil au premier achat refusé faute de pièces ;
  - **ECO-8** le laboratoire : recommandé un joueur « planificateur » de plus, les trois autres inchangés (les nombres que les tests épinglent ne bougent pas).
- Le croisement avec les stats est dit sur la fiche : l'équipement donne des points de stats (DB7-2), un joueur mieux équipé gagne plus, ce qui est le but (le ramener à la courbe sur laquelle le duel a été recalé) ; aucun nombre du duel ne change.

### Validation
- Rien du jeu ne change sur cette branche (la fiche, le journal, l'archive) : `npm run typecheck` sans erreur ; `npm test` 587 / 587 ; `npm run build` réussi ; `npm run art:validate` 73 manifestes, 123 sources, 23 manifestes de son, 0 erreur.
- [KO → expliqué] un premier `npm test` donnait 584 tests et un échec (`arena-day` : « Failed to load url /node_modules/three/... ») : le worktree n'avait qu'un `node_modules` de caches, Vite y cherchait `three`. Une jonction vers le `node_modules` du dossier principal (comme en Passe RM3) : 587 / 587.
- Les passes gardées auraient dépassé 60 Ko : DB6 et RM2 (branches fusionnées) déplacées à l'octet dans `journal/80-passes-DB6-RM2.md`, leur ligne ajoutée à l'index ; preuve par script : le corps de l'archive égale les octets retirés, le journal reconstruit égale l'original, CRLF partout, chaque passe dans un seul fichier.

### Où reprendre
- Attendre la fiche ECO1 ; consigner ses choix mot pour mot.
- Puis appliquer dans le jeu par défaut : les règles dans la simulation (les travaux, la paie, les bourses, la revente), leurs textes en anglais et en français, la liste (Q), le guide (H) et le conseil, les tests, le laboratoire (le planificateur), les preuves de navigateur (`play-day`, `ui-text`, `ui-contrast`) ; rejouer sur le dernier `main` (les séances du duel et de la relecture du français travaillent en parallèle), fusionner, puis l'essai de l'opérateur.

### Pensée
- Un réglage calé sur un joueur « équipé » suppose une économie qui le laisse s'équiper : la courbe du combat et la courbe des pièces se mesurent ensemble, sur un joueur qui achète ce que la courbe suppose.
- Un joueur de laboratoire qui paie chaque soir une protection sans signe cache le manque d'argent derrière une dépense : on range chaque pièce par action avant de conclure.

## Passe TF1 — Les textes français repris après l'essai de l'opérateur : les restes d'anglais cherchés partout, la table relue, 75 entrées et trois mots du duel corrigés (2026-11-10)

### Demande
- L'opérateur, après son essai du 2026-11-10, mot pour mot : « puis tu re-travailleras les textes francais car il manque certaines traductions et enfin certains textes sont pas optimales heros au lieu de herauts par exenple ».
- Séance lancée par la séance principale, en parallèle de deux autres (l'équilibre du duel, l'économie), dont les fichiers ne sont pas touchés. Branche `claude/textes-fr`, tirée de `main` `df16326`, avancée sur `b8f8481` (Passe ECO1, documents seulement) avant le commit. Serveur DEV `textes-dev` (`:5393`, son propre `cacheDir`, hors dépôt).

### Les restes d'anglais — [OK] presque rien, trouvé et traduit
- **Les données que le code garde en anglais** (script en Node, hors dépôt) : les noms et titres des personnes, les noms, épithètes et histoires des rivaux et des génériques, les compétences adverses (`FOE_SKILLS`), les noms des actions, chaque phrase et cause des deux catalogues d'événements : toutes ont leur entrée `=<anglais>`. Aucune clé de `en.ts` sans français ; les entrées identiques à l'anglais sont des noms propres ou des mots qui s'écrivent pareil (Journal, Menu, Pause, Guide, Endurance, Charge).
- **Le jeu joué en français dans un navigateur** (un script de balayage hors dépôt, `lang=fr`, chaque texte visible et chaque `title`, `aria-label`, `placeholder` relevés) : treize états nommés de la version 2 (du premier matin à l'épilogue, le voleur recherché, la sangle, le conte de Vessa, le festival, Cassius démasqué), dans chacun la liste « Ici », le menu, la carte, le journal, le tableau, les compétences, l'équipement, le guide chapitre par chapitre, les quatre parties des réglages et chaque personne présente ; la visite d'une partie neuve ; le duel (la carte d'entrée, 28 moments, la pause, les leçons du premier combat) ; l'écran titre ; Explore ; l'écran de chargement. 1 172 textes distincts dans la ville, 122 dans le duel. Les mots anglais repérés par un détecteur (le vocabulaire de `en.ts` absent de la table française), puis les libellés courts relus à l'œil.
- **Trouvé** : les noms des boutons de manette (infobulles des contrôles, nom accessible de chaque touche affichée : « Cross », « View », « D-pad up »…) : `padName` (`src/input/glyphs.ts`) passe par `word`, onze entrées neuves (Croix, Rond, Carré, Affichage, Créer, Moins, Accueil, Croix directionnelle : haut, bas, gauche, droite) ; l'anglais inchangé. Dans le duel d'une partie : « challenger » sous le nom de Ren, devenu « prétendant » ; « 12 garde » (un coup reçu en garde, mot du prototype qui se lit comme une garde et non comme des dégâts), devenu « Gardé · 12 » ; le palier « Légère » de la bande de charge, devenu « Rapide » comme le « coup rapide » du tutoriel (`DYN_TEXTS_FR_GAME`, `CHARGE_TEXTS_FR`, `src/arena/DynamicHud.ts`).
- **« héros » au lieu de « hérauts »** : [?] introuvable dans le jeu. Chaque « heralds » de l'anglais dit « hérauts » (sept lignes, dont le jour 2, Orla, les tambours du Colisée) ; « héros » n'a jamais été dans la table (`git log -S`). Le seul « héros » affiché est le sous-titre de Ren sur la page de l'arène seule (`?scene=arena`, « Ren, le héros »), qui garde les mots du prototype par décision (Passe RG4) ; le duel d'une partie n'en a pas. À demander à l'opérateur où il l'a vu.

### La relecture — [OK] 75 entrées corrigées
- Trois agents neufs, un tiers de la table chacun, sous un même brief (contresens, termes du tournoi et du Moyen Âge, cohérence d'un écran à l'autre, registre de RG-11, fautes, typographie, tournures lourdes ; mêmes marqueurs et touches ; noms gardés, titres et lieux traduits) : 67 propositions, chacune lue contre l'anglais ; une en double écartée, quatre reformulées, neuf ajoutées par mes soins. Appliquées par un script qui exige l'ancien texte exact.
- **Corrections de sens notables** :
  - « Railler Cassius Dree devant la taverne » (dehors) → « en pleine taverne » (devant ses clients) ;
  - « Laisser tomber la nuit » (abandonner) → « Laisser venir la nuit » ;
  - le tutoriel du duel : « [K] vous met en garde » (vous avertit) → « [K] lève votre garde » ;
  - « elle surgit d’une fente » (d'une fissure) → « elle frappe en se fendant » (Vessa, l'escrime) ;
  - « Appris par la salle de Lio » (la salle aurait appris) → « Appris auprès de » ;
  - « encaissez les coups du poteau » (le poteau ne frappe pas) → « frappez le poteau » ;
  - « Hilde jure » (prête serment) → « lâche un juron », et le valet qui posait des questions « sur cette armure » ;
  - la représaille de Corra : « {items} pour {name} » perdait la restitution → « elle a repris {items} pour {name} » ;
  - Odo « raye un point de votre score […] le paie au tableau » → « vous retire un point dans la poule […] au classement » (la poule, pas le tableau) ;
  - « vols pris sur le fait » → « vols surpris » ; « À trois, » (un compte à rebours) → « À trois marques » ;
  - « tu as fait honneur à ma maison » (« you were good to my house ») → « tu as rendu service à ma maison » ;
  - le jour 8 nommé « Finales » à côté de « Finale » dans le guide → « Grande affiche », son nom partout ailleurs.
- **Un nom pour une chose** : « fiche de match » partout (le mot de l'opérateur sur la fiche DB7, carte DB7-7 ; la table disait « fiche de combat ») ; « coup rapide » (la page des compétences disait « Attaque légère », la bande de charge « Légère ») ; « Coup puissant » sur la page d'équipement (à côté de « Charge puissante » et « Attaque puissante » ; « Coup lourd » reste le coup des rivaux) ; « l’estrade » de la halle (deux « scène ») ; « sur le parvis » (trois « au parvis ») ; « devant tout le parvis » (deux « devant le parvis », un lieu) ; « Attaque » parmi Garde, Esquive, Pause dans les contrôles ; « caractéristique » au lieu de « stat » dans le guide.
- **Noms des compétences adverses** : « Veillée » → « Veillée d’armes » (Ilse, chevalière du Temple), « Résolution du champion » → « Détermination du champion » (le jeu a déjà « Résolution de rendu »), « Épaule des docks » → « Coup d’épaule des docks », « Chute de fer » → « Chute de Fer » (comme la Porte de Fer).
- **Le genre du joueur, encore à trancher** (Passe RG4) : là où une phrase le fixait sans que l'anglais le fasse, une tournure neutre : « de ne pas être vu » → « qu’on ne vous voie pas » (trois libellés de vol), « personne ne vous a vu » → « personne n’a rien vu », les passants (« celui de la poule », « un de la poule, celui-là », « celui du registre », « recherche celui-là »), « gars du Sud » (Rhosk), « l’ami » (Wren, qui vouvoie, et un passant). Le reste du choix (« Vous êtes le champion »…) attend la décision.
- **Tournures** : Marek « Je ne suis rien de plus » → « C’est tout ce que je suis » ; Vessa « Une taille chanceuse » → « Un coup de chance » ; « Bonne journée à toi ! » (un au revoir) → « Bien le bonjour ! » ; « Chantez, la place ! » → « Chantez, gens de la place ! » ; « Dites un mot » → « Un mot de vous » ; « Chez les marionnettes » → « Au spectacle de marionnettes » ; « hors course pour le titre » → « hors de la course au titre » ; « {key} reste au jeu ou au navigateur » → « La touche {key} est réservée au jeu ou au navigateur » ; et quelques autres (le journal de la passe dans le commit).
- **Typographie** : sept lignes (les six ajoutées par la Passe DB9, la forme « |tu » d'une réplique du défilé) avaient une espace ordinaire avant « : » ou dans les guillemets : insécables. Un script vérifie toute la table : plus aucune espace ordinaire avant : ; ? ! », après «, aucune apostrophe droite, aucun guillemet collé.
- **Laissé** : « Sœur Anwen », « Frère Ambrose » en majuscule au milieu d'une phrase (la table est constante ; l'usage voudrait la minuscule, comme « le sergent Hale ») ; « =Townsfolk » → « les passants », « =passers-by » → « des gens de la ville » (inversés par le sens, la phrase se lit bien) ; les points de la Passe RG4 (« Chevalière du Temple », « un dixième » et « 10 % », les montants nuls, la cause « les combats de la poule »).

### Validation
- `npm run typecheck` sans erreur ; `npm test` **588 / 588**, dont un test neuf dans `tests/language.test.mjs` (un nom pour la fiche de match et pour le coup rapide, « hérauts » et jamais « héros », jamais « au parvis », les mots du duel, les boutons de manette en français et en anglais, aucun genre donné au joueur par les passants) ; `tests/language.test.mjs` et `tests/texts.test.mjs` verts (mêmes marqueurs et touches) ; `npm run build` ; `npm run art:validate` (73 manifestes, 123 sources, 23 du son, 0 erreur).
- **`tools/ui-text.mjs` en français** (la liste « Ici » avec les libellés de vol, l'équipement, les compétences, les contrôles, le guide, le tableau au jour 7, Hale au registre, le duel en rupture ; 1920 × 1080, 1280 × 720, 812 × 375) : **24 / 24**, aucun texte sous 16 px (14 au téléphone), aucun caractère hors du sous-ensemble, aucune troncature.
- **`tools/settings-proof.mjs`** : PASS (65 vérifications, sa section de la langue comprise : la ligne « Français · English », un navigateur français, une partie neuve en français, la pause d’un duel, le jeu d’aujourd’hui en anglais) ; **`tools/remap-proof.mjs`** : PASS (46 vérifications, les noms français des touches).
- **L'anglais** : `en.ts` n'est pas touché ; `padName` rend l'anglais tel quel en anglais (`word` est l'identité, le test le vérifie) ; seules les tables françaises du duel changent. Le jeu anglais est donc le même par construction ; [?] pas de capture à 0 px contre le `main` figé dans cette passe.
- Les passes gardées dépassaient 60 Ko avec TF1 (63,0 Ko) : DB7 (branche fusionnée) déplacée à l’octet dans `journal/81-passes-DB7.md`, sa ligne ajoutée à l’index ; preuve par script : le corps de l’archive égale les 8 101 octets retirés, le journal reconstruit égale l’original, CRLF partout, chaque passe dans un seul fichier. 54,9 Ko de passes restent.
- **[KO → corrigé, dans la méthode]** deux modifications de la table faites pendant que le balayage lisait les pages du serveur DEV ont rechargé ces pages (le module HMR) : une vingtaine d'étapes perdues, rejouées ensuite sans toucher aux fichiers. Le principe était connu (Passe RM3) : rien ne se modifie de ce qu'un serveur sert à une preuve en cours.

### Où reprendre
- L'essai de l'opérateur en français ; lui demander où il a vu « héros ».
- Le genre du joueur (Passe RG4) : la décision reste à prendre ; les tournures neutres de cette passe tiennent dans les deux cas.

### Pensée
- Chercher l'anglais restant se fait en deux temps : les données que le code garde hors de la table (un script les compte toutes), puis le jeu joué en français avec un détecteur de vocabulaire anglais, parce qu'un nom accessible ou un mot du duel vit hors des tables.
- Un relecteur qui compare chaque ligne à l'anglais trouve les faux amis (« jure », « met en garde », « laisser tomber ») qu'une lecture du seul français laisse passer ; une liste de termes faite d'avance trouve les doublons d'un écran à l'autre (« fiche de combat » / « fiche de match »).

