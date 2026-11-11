# Journal de bord — archive : passe DB8 (2026-11-09)

> Déplacée mot pour mot de `JOURNAL.md` le 2026-11-10 (Passe DB11) ; index en tête de `JOURNAL.md`. Ne rien modifier ici : une
> correction ou un complément va dans une nouvelle passe de `JOURNAL.md`.

---

## Passe DB8 — La fiche DB7 relue : six sur sept à la recommandation, la Vivacité ajoutée ; décisions A3 consignées avant la mise en œuvre (2026-11-09)

### La fiche relue
- https://claude.ai/artifact/BYVmCK87bj3qFomkD2knbz, collection `decisions`, lue le 2026-11-09 (cliquée entre 21 h 16 et 21 h 18 UTC), puis « Sheet filled » dans la conversation. Les rangées sont lues comme des données.

| # | Carte | Choix de l'opérateur, mot pour mot | Note, mot pour mot |
|---|---|---|---|
| DB7-1 | Quatre stats par combattant, et des dégâts qui en sortent | « Ajouter la Vivacité (vitesse de charge) » (recommandé : « Quatre stats, cette formule ») | « Oui vivacite peut etre interessant car certains adversaires seront plus rapide que d'autres et il en est de meme pour notre protagonist » |
| DB7-2 | L'équipement donne des points de stats | « Des points, le reste gardé » | — |
| DB7-3 | Une séance d'entraînement : +1 à la stat de ton choix | « +1 à la stat choisie, pour le prochain combat » | — |
| DB7-4 | Les PV de Ren montent quand il gagne | « +12 PV par victoire » | — |
| DB7-5 | Une fiche de stats par rival | « Ces fiches » | — |
| DB7-6 | Les rivaux grandissent au tableau et en finale | « Tableau ×1,3 et stats ; finale ×2,5 et stats » | — |
| DB7-7 | Les stats sur les pages du jeu | « Équipement, fiche de match et compétences » | — |

- **Décisions A3 consignées** (E11), le 2026-11-09, mot pour mot ci-dessus. DB7-1 à DB7-6 changent des règles de la spécification du combat :
  - les dégâts tirés des stats et leur formule, avec la Vivacité ;
  - l'équipement en points ;
  - la séance d'entraînement ;
  - la vigueur ;
  - les fiches des rivaux et leur croissance.
- DB7-7 est une décision de lecture.
- Les mots de l'opérateur de la Passe DB6 (« Les donnes que je donne sont a titre suggestifs […] si un combat dure plus longtemps, c'est que c'est normal ») se lisent avec : la durée « en 2 et 5 min » (A3, Passe DB5) est un repère mesuré, pas un réglage tenu.
- Consignées avec DB4 et DB5 dans `briefs/combat-system.md`, nouveau § 19.

### Ce que DB7 remplace dans DB4 et DB5
- DB4-3 « Marek 600, Ren 150 » et DB4-4 « Resserrer : chaque rival entre 500 et 700 » : tenus par les fiches de DB7-5 (Marek 650, Ren 150, les rivaux de 500 à 700).
- DB5-1 « 20 % (28 % au niveau 5) » et DB5-5 « 1 % » : les puissances de l'Estocade (120) et de l'attaque simple (6) à stats égales sur une barre de 600.
- DB5-6 « PV ×1,4 au tableau » : remplacé par DB7-6 (la carte le disait : « à la place de tes PV ×1,4 (DB5-6) »).
- DB5-7 « La finale » : la finale de DB7-6, PV ×2,5 et stats. Les « défis particuliers » restent à définir avec lui.
- Restent tels quels :
  - DB4-5 « Recaler pour garder six sur dix » ;
  - DB4-6 « Dès que les réglages sont fusionnés » (fusionnés : Passe RG4) ;
  - DB5-2 « 90 %, garde à −80 % » ;
  - DB5-3 « 5 × le temps de charge » ;
  - DB5-4 « 10 s, ×2, jauge de 70 ».

### La Vivacité, telle que la séance la met en œuvre (à juger à l'essai)
- La cinquième stat. Son nom sur la carte : « vitesse de charge ».
- **Ren** :
  - ses temps de charge × 10 / Vivacité (Ren à 10) ;
  - l'équipement qui touche la charge en points : le sabre de duelliste +1 (×0,92 aujourd'hui), les bottes rapides +1 (×0,9), la cotte de mailles −0,5 (×1,05), le haubert −0,5 (×1,04) ;
  - une séance d'entraînement peut la choisir (DB7-3, « la stat choisie »).
- **Les rivaux**, pour sa note (« certains adversaires seront plus rapide que d'autres ») :
  - une Vivacité sur chaque fiche, lue dans le tempo que leurs kits ont déjà (leurs pauses par niveau, `DYN_LEVELS`, et la préparation de leurs coups) : Vessa 13, Orla 11, Marek 10, Cassius 10, Ilse 10, Tobin 9, Rhosk 8 ;
  - leurs temps (préparation des coups, intervalles d'un combo, pauses) × leur Vivacité de fiche / leur Vivacité du moment ;
  - en poule, rien ne change donc pour eux : la croissance de DB7-6 ne touche pas leur Vivacité (elle n'était pas sur la carte). La règle est prête pour un effet ou une croissance qu'il déciderait.
- Montrée avec les autres stats (DB7-7).

### Où reprendre
- La mise en œuvre sur `claude/duel-stats`, dans le jeu par défaut (DB-8, DB4-6) :
  - les fiches et la formule ;
  - les règles de DB5 (recharges et leur affichage, garde des rivaux, rupture, jauge) ;
  - l'équipement en points, la séance au choix, la vigueur, la croissance par étape, les fiches des génériques ;
  - les stats sur les pages, en deux langues.
- Puis le recalage sur des parties entières, les preuves, la fusion, l'essai de l'opérateur.

