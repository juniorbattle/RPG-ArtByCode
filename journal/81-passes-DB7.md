# Journal de bord — archive : passe DB7 (2026-11-09)

> Déplacée mot pour mot de `JOURNAL.md` le 2026-11-10 (Passe TF1) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe DB7 — Les statistiques des combattants : une proposition mesurée et sa fiche ; la fiche DB6 remplacée ; rien d'appliqué (2026-11-09)

### Demande
- La direction de l'opérateur après la fiche DB6 (consignée mot pour mot en Passe DB6 : « nous basons les actions d'un combattant par ses stats personnelles […] c'est un rpg notre jeu »), puis, à la question de préparer une proposition de statistiques : « Oui, prépare-la ».
- Branche `claude/duel-stats`, tirée de `main` `f1610f6`, avancée en avance rapide sur `b1b889b` (Passe RM2, d'une autre séance) avant le commit.

### Le prototype — [OK] hors écran, rien du jeu touché
- `tools/duel-balance.mjs`, variante `rpg` (la table `RPG`).
- Quatre stats par combattant : PV, Attaque, Défense, Endurance.
  - Dégâts d'un coup = puissance × 2·Atq / (Atq + Déf) : ×1 à stats égales, rendements décroissants, jamais zéro.
  - Jauge × 10 / Endurance.
- Ren : 150 / 10 / 10 / 10.
- Les puissances de Ren suivent DB5 : l'attaque simple 6 (1 % d'une barre de 600), l'Estocade 120 (20 %), les autres compétences offensives au prorata de leur temps de charge, `LEVEL_POWER` par-dessus.
- Les coups des rivaux : 5,6 / 16,8 / 25,2, soit 4 / 11 / 17 % des 150 PV de Ren à stats égales (d'abord 4 / 12 / 18 × `fpow140`).
- Les jetons :

| Jeton | Ce qu'il règle |
|---|---|
| `rs<n>` | l'état d'équipement en points |
| `lv<n>` | le niveau des compétences |
| `stage<n>` | la croissance des rivaux (0 poule, 1 tableau, 2 finale, 3 à 11 les essais) |
| `rhp<N>` | les PV de base de Ren |
| `vhp`, `vatk`, `vdef`, `vend` | la fiche de l'adversaire, pendant un réglage |

- Le paquet DB5 en jetons : `fguard90+greduce80+cd5+gauge70+stun10`.
- Mesure : bot 0,2 / 0,5 / 0,9 et marteleur, 10 graines par rival (20 pour Vessa).

### Ce que la mesure a appris
- **[KO] La finale par les seuls PV adverses.**
  - Première croissance (finale +3 Atq / +3 Déf / +2 End et PV ×2,5, Ren à 150 PV) : le joueur attendu 21 %, le joueur en retard 0 %.
  - PV ×4 (avec ou sans coups allégés) : 0 à 19 %, perdue en 3 min.
  - La durée d'un combat est bornée par la survie de Ren (aucun soin) : gonfler la barre adverse rend la finale perdue, pas longue.
- **[OK] La vigueur.** Les PV de Ren montent au fil du parcours (150 en poule, 185 au tableau, 220 en finale) : la finale attendue passe à 41-66 % selon la croissance, en 3,5 min. Proposé : +12 PV par victoire, PV seuls (contrat projet § 7).
- **[KO, corrigé] Vessa.** À 500 / 11 / 9 / 8, elle donnait 0 à 10 % au joueur moyen, alors qu'elle est son premier combat (jour 2) : son kit (enchaînements rapides) pèse autant que sa fiche. À 500 / 7 / 8 / 7 : 60 % (20 graines). Seule la part de son Attaque change.
- **Le tableau.**
  - +2 / +2 / +1 et PV ×1,15 : 90 %, trop facile.
  - +3 / +3 / +2 et PV ×1,3 : 74 à 79 %, retenu.
  - PV ×1,4 seuls (DB5-6) : 91 %.
- **La finale, finaliste par finaliste** (joueur attendu, 220 PV) :

| Croissance | Marek | Orla | Ilse | Rhosk |
|---|---|---|---|---|
| PV ×3, stats +1 / +3 / +2 | 0 % | 10 % | 30 % | 60 % |
| **PV ×2,5, stats +1 / +3 / +2 (retenu)** | **20 %** (fort : 100 %, 5,4 min) | **50 %** | **80 %** | **70 %** |
| PV ×2, stats +1 / +2 / +2 | 70 % | 90 % | 100 % | 90 % |
| PV ×2,5 seuls, sans stats en plus | 40 % | 100 % | 100 % | 100 % |

  Contre les sept rivaux, avec PV ×2 et stats +1 / +2 / +2 : 87 %.
- **La courbe proposée** (moyen ; faible / fort entre parenthèses) :

| Étape | Victoires | Durée | Estocade franche / sur une rupture |
|---|---|---|---|
| Poule | 64 % (17 / 99) | 2,2 min | 21 % / 43 % |
| Tableau | 79 % (39 / 97) | 2,4 min | — |
| Finale | 66 % (26 / 100), Marek 20 % | 3,5 min | — |

  - En avance : 100 % en 1,3 min (poule), 99 % en 1,4 min (tableau), 90 % en 3,0 min (finale).
  - En retard : 56 % (poule), 20 % (tableau), 11 % (finale ; le joueur fort y met 5,6 min).
  - Le marteleur : 0 % partout, sauf 17 % en poule tout équipé au niveau 3.
  - Sans vigueur : tableau 63 %, finale 33 % (Marek 0 %).
- **L'entraînement aujourd'hui.** +5 % de dégâts par séance, deux au plus, remis à zéro après le combat du joueur (`src/tournament/pool.ts`). La proposition le garde passager : +1 à la stat choisie.
- Fichiers de mesure hors dépôt ; refaits par `--audit --seeds=1..10 --skills=0.2,0.5,0.9 --variant="rpg+fguard90+greduce80+cd5+gauge70+stun10+rs<n>+lv<n>[+stage<n>][+rhp<N>]"`.

### La proposition — `briefs/stats-combattants.md`
- Les quatre stats et la formule (DB7-1).
- L'équipement en points, objet par objet (DB7-2) : la lame +2 Atq, un palier +1, la cotte +3 Déf, l'anneau +2 End, la bande +9 PV... Tout équipé au niveau 5 : ×1,8 en poule au lieu de ×2,3.
- La séance d'entraînement : +1 à la stat choisie pour le prochain combat (DB7-3).
- La vigueur (DB7-4).
- Une fiche par rival, tirée de son style (`src/combat/profiles.ts`), les PV dans les 500-700 de DB4-4 (DB7-5).
- La croissance (DB7-6) : tableau +3 / +3 / +2 et PV ×1,3 à la place de DB5-6 ; finale +1 / +3 / +2 et PV ×2,5 pour l'épique de DB5-7.
- Les stats montrées sur la page d'équipement, la fiche de match et les compétences (DB7-7).
- La courbe, les limites, ce qu'il faudra construire.

### La fiche DB7 — publiée, rien de décidé
- https://claude.ai/artifact/BYVmCK87bj3qFomkD2knbz (`briefs/fiche-db7.html`).
  - Sept cartes en trois familles : la règle (DB7-1 à DB7-4), les rivaux (DB7-5, DB7-6), ce qui se voit (DB7-7).
  - La collection `decisions` relue vide.
  - Vérifiée dans Chrome sans tête : sept cartes, 21 options, cinq tables, aucune erreur, aucun débordement à 375 px.
- La fiche DB6 porte maintenant le lien vers DB7 (« elle remplace cette fiche », version 3). Ses choix ne sont pas à remplir.
- La durée : les mots de l'opérateur (Passe DB6) font de « 2 et 5 min » un repère. La fiche donne les durées mesurées sans les tenir pour une cible ; la décision A3 consignée en Passe DB5 reste écrite telle quelle.

### Validation
- Rien du jeu ne change sur cette branche (l'outil de mesure, la proposition, les fiches, le journal) : `npm run typecheck` sans erreur ; `npm test` 576 / 576 ; `npm run build` réussi ; `npm run art:validate` 73 manifestes, 123 sources archivées, 23 manifestes de son, 0 erreur.
- Les passes gardées auraient dépassé 60 Ko : DB4 (branche fusionnée) déplacée à l'octet dans `journal/77-passes-DB4.md`, sa ligne ajoutée à l'index ; preuve par script : le corps de l'archive égale les 6 875 octets retirés, le journal reconstruit égale l'original, CRLF partout, chaque passe dans un seul fichier. 53,7 Ko de passes restent.

### Où reprendre
- Attendre la fiche DB7, puis la consigner.
- Amender `briefs/combat-system.md` : § 2, § 4 les recharges, § 5 la garde, § 6 la rupture, § 11, § 18, et les stats.
- Appliquer dans le jeu par défaut DB4, DB5 et DB7 :
  - les fiches et la formule dans les données du duel et `DynamicSim` ;
  - l'équipement en points dans `v2Mods` ;
  - la vigueur dans l'état du joueur ;
  - la croissance des rivaux par étape du calendrier, et les fiches des génériques ;
  - les recharges et leur affichage, la garde des rivaux, la rupture 10 s, la jauge de 70 ;
  - les stats sur les pages, en deux langues.
- Recaler sur des parties entières (six sur dix) et `V2_RACERS` ; revoir les états nommés et le tutoriel du premier combat.
- Prouver, fusionner, puis l'essai de l'opérateur. Les « défis particuliers » de DB5-7 restent à définir avec lui.

### Pensée
- Sans soin, la longueur d'un duel est bornée par la survie du joueur : un combat épique demande que ses PV montent aussi (ou que les coups adverses baissent), pas seulement une barre adverse plus grosse.
- La fiche d'un rival se règle contre son kit, rival par rival : une formule seule n'en fait pas un premier combat abordable (Vessa).
- Une moyenne sur sept rivaux cache le combat qui compte : la finale se mesure contre ses finalistes probables (Marek).

