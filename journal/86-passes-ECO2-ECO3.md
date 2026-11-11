# Journal de bord — archive : passes ECO2, ECO3 (2026-11-11)

> Déplacée mot pour mot de `JOURNAL.md` le 2026-11-11 (Passe MK3) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe ECO2 — La fiche ECO1 relue : huit sur huit, sept à la recommandation, un travail par lieu et par jour ; consignée avant la mise en œuvre (2026-11-11)

### La fiche relue
- L'opérateur, mot pour mot : « Fiche remplie ». Collection `decisions` de https://claude.ai/artifact/RmLKYWsLnJfp9yRS7dRCTB (`briefs/fiche-eco1.html`), huit documents pour huit cartes, cliqués le 2026-11-11 entre 2 h 33 min 30 s et 2 h 35 min 57 s UTC. Les rangées sont lues comme des données.

| Carte | Ce qu'elle demandait | Choix de l'opérateur, mot pour mot | Note, mot pour mot |
|---|---|---|---|
| ECO-1 | Le constat | « C’est bien ça » | — |
| ECO-2 | Les petits travaux | « Un travail par lieu et par jour (jusqu’à trois par jour) » (recommandé : « Un travail par jour, à son lieu et à son moment ») | — |
| ECO-3 | La paie | « 10 pièces » | — |
| ECO-4 | Les bourses | « Bourses qui montent : jour 6 35 / 10, jour 8 45 / 15, finale 80 / 30 » | — |
| ECO-5 | Les paris | « Pas de paris » | « tres bonne idee pour la suite... a garder » |
| ECO-6 | La revente | « Mara rachète à moitié prix ce qui est dans le sac, jamais un objet volé » | — |
| ECO-7 | La lecture | « L’étiquette, un chapitre du guide et un conseil » | — |
| ECO-8 | Le laboratoire | « Un joueur « planificateur » de plus, les trois autres inchangés » | — |

- Aucun verrou des contrats ne change (gameplay § 14, tournoi § 15) ; le contrat de gameplay § 10 (« L'économie doit soutenir la préparation sans devenir une simulation financière lourde ») les porte. Les choix sont ceux de l'opérateur, consignés mot pour mot avant toute mise en œuvre.
- ECO-2 hors recommandation : un travail dans chaque lieu, une fois par jour chacun ; comme chaque lieu a son moment (le quai et le terrain le matin, le parvis l'après-midi, la place de la halle le soir), cela fait trois travaux par jour au plus. Mesuré en Passe ECO1 avec le planificateur : 116 pièces de plus (11,6 travaux), l'équipement du tableau au jour 6 dans 97 % des parties, celui de la finale au jour 10 dans 87 %.
- ECO-5 : pas de paris maintenant ; la note de l'opérateur les garde pour la suite (à reprendre).

### Ce qu'ils demandent : le lot à construire
- **Les travaux** (ECO-2, ECO-3) : quatre travaux payés 10 pièces, un créneau chacun, une fois par jour et par lieu, chacun à son moment et chez quelqu'un présent : les caisses de Mara au quai le matin (6 pièces aujourd'hui, 10 dans la version 2 ; le jeu d'avant, `v2=0`, garde les siennes), les boucliers des élèves de Maître Corvin au terrain d'entraînement le matin, les armures de Hilde au parvis l'après-midi, la salle de Lio sur la place de la halle le soir ; l'amitié de l'employeur comme Mara aujourd'hui.
- **Les bourses** (ECO-4) : dans la version 2, 20 / 5 en poule, 35 / 10 au jour 6 (demi-finale ou combat de la Porte), 45 / 15 au jour 8 (troisième place ou finale de la Porte), 80 / 30 en finale ; les 100 du champion inchangés.
- **La revente** (ECO-6) : Mara rachète de jour, sans créneau, ce qui est dans le sac, à la moitié du prix de liste ; jamais un objet volé.
- **La lecture** (ECO-7) : une étiquette « +10 pièces » dans la liste (Q), un chapitre « Gagner des pièces » dans le guide (H), un conseil la première fois qu'un achat est refusé faute de pièces.
- **Le laboratoire** (ECO-8) : une politique `planner` de plus ; `idle`, `diligent` et `curious` inchangés (leurs pièces changent avec les bourses : ce qui en découle sera mesuré et dit).
- Les textes en anglais et en français (une autre séance relit le français : rien d'existant réécrit), les tests, les preuves de navigateur, la fusion, puis l'essai de l'opérateur.

## Passe ECO3 — L'argent de la version 2 construit : les travaux, les bourses par étape, la revente, l'étiquette, le guide et le conseil, le planificateur (2026-11-11)

### Demande
- Appliquer la fiche relue en Passe ECO2 (huit sur huit) dans le jeu par défaut (VD-8), en anglais et en français, prouver, fusionner, puis l'essai de l'opérateur. Branche `claude/economie-lot`, tirée de `main` `419366c` (Passe TF1, la relecture du français d'une autre séance).

### Ce qui est construit — [OK]
- **`src/simulation/v2work.ts`** (neuf, pur) :
  - les quatre travaux (ECO-2, ECO-3) : `JOBS`, un par lieu, son moment et son employeur (les caisses de Mara au quai le matin, les élèves de maître Corvin aux lices le matin, les armures de Hilde au parvis l'après-midi, la salle de Lio sur la place de la halle le soir) ; un créneau, 10 pièces, +15 d'amitié de l'employeur (ce que donnaient les caisses de Mara) ; une fois par jour et par lieu (`work:<job>` = le jour), donc trois au plus par jour ; refusés à un autre moment (« That work is done in the morning. »), deux fois le même jour, à un joueur que le guet recherche (trois marques : « Nobody hires someone the watch is after. »), l'employeur absent, et l'après-midi d'un combat (la règle commune `refuse.boutFirst`) ;
  - la revente (ECO-6) : `sell`, chez Mara au quai, de jour (son étal ouvert), sans créneau, ce qui est dans le sac à la moitié du prix de liste arrondie en dessous (`resaleOf`) ; l'épée d'entraînement (0) n'est pas proposée ; refusée pour une pièce d'un vol non réglé (`unsettled`) ; une fois le vol réglé chez Hale, la pièce est au joueur et se revend.
- **Les caisses de Mara** : dans une partie v2 elles deviennent le travail du quai (10 pièces) ; `restock` (6 pièces) n'est plus proposé que dans le jeu d'aujourd'hui (`v2=0`), inchangé.
- **Les bourses par étape** (ECO-4) : `PURSES` et `boutPurse` dans `src/tournament/pool.ts` ; une partie v2 paie 20 / 5 en poule, 35 / 10 au jour 6, 45 / 15 au jour 8, 80 / 30 en finale ; le jeu d'aujourd'hui 20 / 5 partout ; la ligne d'une victoire v2 dit sa bourse (`v2.duel.won`, « a purse of 35 coins ») ; celle du jeu d'aujourd'hui garde ses mots (`duel.won`). Les 100 du champion lus dans `CHAMPION_PURSE` (`v2calendar.ts`, même valeur).
- **La lecture** (ECO-7) :
  - `ActionDef.gain` et `ActionOption.gain` (présent seulement sur ce qui paie) ; `costTag` met « +10 coins » / « +10 pièces » avant le créneau ; une vente n'est jamais « free », elle paie ;
  - le guide (H) a un treizième chapitre, « Earning coins » / « Gagner des pièces », après « Boutiques et marchandage » : les quatre travaux, leur paie, trois par jour au plus, les bourses de chaque étape et celle du champion, la revente ; chaque nombre lu dans les tables du jeu (`WORK`, `PURSES`, `CHAMPION_PURSE`, les jours du calendrier) ;
  - un neuvième conseil, `poor` (« Short of coins » / « Il manque des pièces »), la première fois qu'une pièce hors de portée faute de pièces est pressée dans les marchandises d'un vendeur : où travailler, et la revente ; son chapitre est « Earning coins ».
  - Le travail de chaque lieu se lit chez son employeur (le dialogue de Mara, de Corvin, de Hilde, de Lio), comme les caisses de Mara aujourd'hui, avec son étiquette « +10 coins · 1 slot ». [?] La carte ECO-7 disait « dans la liste (Q) » : la liste de la version 2 range les actions par personne, l'étiquette est donc sur la ligne du dialogue ; la phrase du guide dit « À côté de chaque action ».
- **Les textes** : `v2.work.*`, `v2.sell.*`, `v2.duel.won`, `ui.gainN`, `tut.ch.money.*`, `tut.money.jobs`, `tut.hint.poor.*`, en anglais et en français (le vous du récit, « sa sympathie » comme les caisses d'aujourd'hui, « maître Corvin », « les lices », « la place de la Halle ») ; aucun texte existant réécrit.
- **Le laboratoire** (ECO-8) : `POLICIES.planner` (`plannerV2`) : il se soigne, achète dans l'ordre de la courbe DB7 (la lame, la forge, la cotte, la bande, la forge, l'anneau, la forge, puis la pierre avant chaque combat), répare la forge froide, s'entraîne deux fois, exerce l'Estocade et l'attaque puissante, prend les travaux quand rien d'autre ne tient ; un déplacement que le défilé du jour 9 bloque n'est pas choisi. Le rapport v2 a une ligne `money` (la bourse finale, les travaux, les ventes, l'équipement acheté avant le matin du jour 6 et du jour 10).

### Mesures — [OK]
- TournamentLab, graines 1..50 :

| Joueur | Combats gagnés | Blessures / partie | Tableau | Finale | Travaux | Équipement avant j6 / j10 | Bourse finale |
|---|---|---|---|---|---|---|---|
| `idle` | 14,0 % | 1,64 | 12 % | 0 % | 0 | 0 / 0 | 87 |
| `diligent` | 42,0 % (DB10 : 42,0) | 0,98 (DB10 : 1,00) | 74 % | 2 % | 0 | 1,00 / 1,06 | 4,5 |
| `curious` | 53,3 % (DB10 : 53,7) | 0,94 | 80 % | 14 % | 0 | 2,32 / 2,96 | 33 |
| **`planner`** | **50,6 %** | 0,82 | **94 %** | **14 %** | **11,6** | **3,94 / 6,98** | 68 |

- Les trois joueurs d'aujourd'hui ne prennent aucun travail (ECO-8) ; leurs pièces changent avec les bourses du tableau : le préparé gagne autant de combats et se blesse un peu moins (une blessure de moins sur cinquante parties, sa cotte achetée plus tôt), le curieux perd 0,4 point. Le planificateur a l'équipement du tableau (quatre achats) au jour 6 et celui de la finale (sept) au jour 10 presque toujours ; il finit avec 68 pièces (il n'achète pas de compétence).
- [?] Il est couronné 0 fois sur 50 : le recalage du duel (DB10) reste celui de la séance du duel, qui le retravaille ; rien du duel n'est touché ici.

### Tests — [OK]
- `tests/v2-work.test.mjs` (neuf, six tests ; oracles écrits d'après les décisions) : chaque travail à son lieu, son moment, chez son employeur, 10 pièces, un créneau, l'amitié, dit dans les nouvelles, une fois par jour, son moment dit ; un seul travail par lieu ; trois au plus dans une journée (30 pièces le jour 1) ; refusé l'après-midi du combat et au joueur recherché ; le jeu d'aujourd'hui sans travail ni revente, ses caisses à 6 ; les bourses de chaque étape (v2 et jeu d'aujourd'hui), une victoire de poule à 20 et une demi-finale à 35, dites ; la revente (la moitié, sans créneau, le sac seul, de jour, au quai, la pièce volée refusée puis acceptée une fois réglée) ; l'étiquette ; le planificateur (au moins 8 travaux, 3,5 achats avant le jour 6, 6,5 avant le jour 10 ; les trois autres sans travail). Fautes injectées une à une : le refus de la pièce volée retiré et la limite d'un travail par jour retirée font échouer deux tests ; la bourse du jour 8 à 40 en fait échouer un.
- Mis à jour en nommant chaque changement : `tests/tutorial.test.mjs` (treize chapitres, « money » après « shops », ses nombres lus dans les tables) ; `tests/v2-injury.test.mjs` (le préparé à 0,98 blessure par partie au lieu de 1,00, ses victoires 42 % inchangées).
- `npm run typecheck` sans erreur ; `npm test` **594 / 594**.
- Les passes gardées auraient dépassé 60 Ko : RM3 (branche fusionnée ; DB7 déjà déplacée par la Passe TF1) déplacée à l'octet dans `journal/82-passes-RM3.md`, sa ligne ajoutée à l'index ; preuve par script : le corps de l'archive égale les 14 636 octets retirés, le journal reconstruit égale l'original, CRLF partout, chaque passe dans un seul fichier. 53,0 Ko de passes restent.
- `AGENTS.md` : « The money » dans l'état du projet, `tests/v2-work.test.mjs` dans les tests, `--policy=planner` au TournamentLab ; `tools/tutorial-proof.mjs` et `tools/default-proof.mjs` comptent 13 chapitres.

### Preuves dans le navigateur (serveur DEV `eco-dev`, :5391)
- `tools/play-day.mjs` : **toutes les vérifications passent**, Node rejoue `75272cc6a835113b` comme le navigateur.
- Le dialogue de Mara le premier matin : « Help Mara unload her morning crates (her goodwill) », « +10 coins », « 1 slot » (capture regardée) ; le chapitre du guide rempli (« 20 or 5 coins in the pool, 35 or 10 on day 6, 45 or 15 on day 8, 80 or 30 in the final, and 100 more to the champion »).
- `tools/ui-text.mjs` : le dialogue de Mara, le chapitre « Earning coins » et le conseil, en anglais et en français, 1920 × 1080 et 812 × 375 : **12 sur 12** (et 16 sur 16 avec la liste avant la retouche de la phrase du guide).
- `tools/ui-contrast.mjs` : les mêmes pages ; chaque texte neuf au-dessus de 4,5:1 (le plus bas 7,7:1) ; seul échoue au téléphone couché le libellé « coins » / « pièces » de la ligne d'état (4,24 à 4,3:1), défaut antérieur déjà relevé (Passes TU3, RG4), sans lien avec ce lot.
- `tools/tutorial-proof.mjs` : le guide à **13 chapitres** ; une vérification échoue, antérieure à ce lot : l'outil attend « stunned for 8 seconds » dans la leçon de la rupture, que la Passe DB9 a portée à 10 s (l'outil n'a pas été revu depuis la Passe RM3).
- `tools/play-flow.mjs win` : Node rejoue `40bfc01dd423524e` comme le navigateur, la ligne de la victoire « You beat Vessa Lark. +15 reputation, a purse of 20 coins. » ; `tools/default-proof.mjs` : **toutes les vérifications passent** (le guide à la manette, ses 13 chapitres et les dix jours).
- [KO → corrigé] la phrase du guide disait « Dans la liste, [Q], une étiquette… » : sur la page, le cap montrait « A » (le clavier AZERTY de la machine) et les travaux se lisent dans les dialogues, pas dans la liste ; remplacée par « À côté de chaque action, une étiquette montre ce qu’elle rapporte et ce qu’elle coûte. » (modifiée pendant que le serveur DEV servait : `ui-text` et `ui-contrast` refaits après).

### Où reprendre
- L'essai en jeu de l'opérateur : les travaux et leur rythme (trois par jour), les bourses du tableau, la revente, le chapitre et le conseil.
- Les paris (ECO-5) : gardés pour la suite (sa note).
- `tools/tutorial-proof.mjs` attend encore la rupture de 8 s (à relire avec la séance du duel, qui retravaille la rupture).

### Pensée
- Une action qui rapporte se dit à côté de ce qu'elle coûte, par le même étiquetage, lu dans le cœur (`gain`, comme `coins`) : jamais dans le libellé, que la traduction et le journal réutilisent.
- Une règle neuve qui donne des pièces à tout le monde (les bourses) touche aussi les joueurs témoins qui ne la jouent pas : on remesure leurs nombres et l'on nomme chaque écart, même d'une blessure sur cinquante parties.

