# Le duel après l'essai du 10 novembre 2026 — mesures et proposition (Passe DB11)

Ce document accompagne la fiche DB11 (`briefs/fiche-db11.html`). Rien n'est appliqué au jeu avant les choix de l'opérateur.

## 1. Ses mots, mot pour mot (2026-11-10)

> « Bon il y a du mieux par contre, il y a des zones d'ameliorations :
> * d'abord la barre de break pour nos ennemies est trop lente a monter elle devrait montrer plus vite sachant qu'ils ont plus de pv, de plus les ennemies attaquent beaucoup trop souvent des le debut du jeu alors qu'ils devraient avoir un plus long temps de pause et vers la fin du jeu peut etree garder le rythme actuelle ou proposer des combos plus long
> [...]
> * d'ailleurs je nai pas cerne les moyens d'augementer les points de vie de notre protagoniste, il faudrait aussi rapprocher les points de vie de nos adversaires au debut du jeu »

Quatre points : la jauge de rupture des rivaux, le rythme des rivaux en début de tournoi (et la fin), la façon de monter les PV de Ren, l'écart de PV au début. L'économie (gagner de l'argent) et les textes français sont traités par d'autres séances : rien ici ne touche aux prix ni aux revenus.

## 2. Ce que fait le jeu aujourd'hui (`main` df16326)

### La jauge de rupture
- Une jauge de 70 (DB5-4, A3), qui se vide de 1,26 par seconde. Ce qu'un coup y ajoute : sa part × 10 / l'Endurance de la cible ; un coup gardé l'ajoute deux fois (DB9) ; dans leurs pauses, les rivaux gardent 90 % des coups (DB5-2).
- L'attaque simple ajoute 0,5 (DB9 : à 2, le marteleur qui tient la garde gagnait). Les compétences ajoutent leur part ×2 (DB-5).

| Contre | Attaque simple (gardée) | Coup éclair (gardé) | Estocade (gardée) |
|---|---|---|---|
| Vessa (End 7) | 0,7 (1,4) | 34 (69) | 71 (143) |
| Orla (End 11) | 0,5 (0,9) | 22 (44) | 45 (91) |
| Cassius (End 9) | 0,6 (1,1) | 27 (53) | 56 (111) |
| Marek (End 12) | 0,4 (0,8) | 20 (40) | 42 (83) |

- Une attaque simple ne la fait pas monter plus vite qu'elle ne redescend. Deux Coups éclairs gardés à 17 s d'écart (la recharge) ne brisent pas Orla : 44 − 21 + 44 = 67, sous 70. Seule l'Estocade gardée brise d'un coup, après 7,65 s de charge, 4 PA et 38 s de recharge.

### Le rythme des rivaux
- Leurs pauses suivent leur niveau (`DYNAMIC_DATA.restByLevel`) : Tobin 8-12 s, Cassius, Ilse et Rhosk 6-10 s, Orla et Marek 5-9 s, Vessa 3,5-6,5 s. **Vessa, la plus rapide, est le premier combat du joueur** (jour 2), puis Orla (jour 4) et Cassius (jour 5).
- La riposte (DB-2, A3) : au 3e coup simple dans sa pause, la séquence part 0,3 s après.
- Mesuré (bot 0,5, 20 graines par rival, la poule) : **7,8 séquences adverses par minute, dont 56 % lancées par la riposte** ; 5,6 s entre la fin d'une séquence et la suivante. Le marteleur : 16 séquences par minute, 89 % par la riposte. C'est la riposte, plus que la longueur des pauses, qui fait « attaquer trop souvent ».

### Les PV
- Ren : 150 au départ, +12 par combat gagné (DB7-4), et trois objets (la bande +9, la médaille +8, la perle +5). Les rivaux en poule : 500 à 700 (DB7-5), soit 3,3 à 4,7 fois Ren.
- Où le jeu le dit : la page d'équipement montre les PV avant et après un achat. Nulle part ailleurs : ni l'écran de victoire, ni la fiche de match (qui montre les stats de l'adversaire seulement), ni le guide ne parlent de la vigueur.

## 3. La méthode

- `node tools/duel-balance.mjs --audit` (Node seul), les stats du jeu, le joueur attendu de la fiche DB7 à chaque étape (la référence de DB4-5 depuis la réponse « The DB7 sheet's curve », Passe DB10) :
  - poule : équipement 1, compétences au niveau 1 (`rpg+rs1+lv1`) ;
  - tableau : équipement 2, niveau 3, 185 PV, la croissance du tableau (`rpg+rs2+lv3+stage1+rhp185`) ;
  - finale : tout équipé, niveau 3, 220 PV, la croissance de la finale (`rpg+rs3+lv3+stage2+rhp220`).
- Le bot du jeu à l'adresse 0,2 / 0,5 / 0,9 (faible / moyen / fort), 20 graines par rival, les sept rivaux ; et le **marteleur qui tient la garde** (`gspam`, le joueur parfait d'une seule tactique, Passe DB9 : il doit perdre).
- Jetons ajoutés à l'outil pour cette passe : `gspam` (la politique), `clen<n>` (combos plus longs), `tempo<k>`, `decay<k>`, `sgk<k>`, `vivd<n>` (l'adversaire n de Vivacité sous sa fiche) ; nouveaux relevés : séquences par minute, part lancée par la riposte, temps libre entre deux séquences, ruptures par minute, PV de Ren restants.
- Limites : le bot n'est pas un joueur (il tape, déclenche la riposte, charge l'Estocade d'abord) ; les durées et les taux sont ceux de ce bot. Les fichiers de mesure sont hors dépôt ; chaque ligne se refait par la commande et sa variante.

## 4. Ce que chaque levier donne (bot faible / moyen / fort ; marteleur)

### La poule (le joueur attendu ; aujourd'hui 29 / 59 / 89 %, marteleur 7 %, 2,1 min)
Chaque ligne : le paquet recommandé (§ 5) avec un levier changé.

| Variante | Victoires | Marteleur | Durée | Séquences / min | Ruptures / min |
|---|---|---|---|---|---|
| aujourd'hui | 29 / 59 / 89 % | 7 % | 2,1 min | 7,8 | 1,12 |
| **le paquet recommandé** | **71 / 92 / 99 %** | **9 %** | **2,1 min** | **5,5** | **2,01** |
| sans le rythme (Vivacité de la fiche) | 43 / 71 / 94 % | 2 % | 1,9 | 6,5 | 1,94 |
| pauses ×1,6 au lieu de la Vivacité | 75 / 90 / 100 % | 7 % | 2,0 | 5,8 | 2,09 |
| riposte au 4e coup en poule | 73 / 96 / 99 % | **19 %** | 2,0 | 5,0 | 2,04 |
| jauge d'aujourd'hui | 47 / 80 / 98 % | **23 %** | 2,3 | 6,6 | 1,22 |
| jauge de 50 au lieu de « compétences ×1,5 » | 66 / 89 / 95 % | 4 % | 2,2 | 5,6 | 1,87 |
| attaque simple ×3 à la jauge | 65 / 91 / 99 % | **51 %** | 2,2 | 5,9 | 1,82 |
| rivaux à 80 % de leurs PV en poule | 82 / 97 / 99 % | **19 %** | 1,8 | 5,3 | 2,12 |
| rivaux à 70 %, Ren à 150 | 89 / 97 / 99 % | **29 %** | 1,6 | 5,4 | 2,07 |
| coups des rivaux ×1,2 en poule | 61 / 84 / 99 % | 5 % | 2,1 | 5,5 | 2,01 |
| coups des rivaux ×1,4 en poule | 49 / 77 / 95 % | 2 % | 2,0 | 5,6 | 2,00 |

- Rival par rival (bot moyen) : aujourd'hui Vessa 25 %, Orla 40 %, Cassius 80 % ; avec le paquet 70 %, 95 %, 100 %. Le premier combat est aujourd'hui le plus dur de la poule.
- Ren à 300 et tous les coups des rivaux ×2 donnent exactement les mêmes taux que Ren à 150 (vérifié : 71 / 92 / 99 % des deux côtés) : chaque coup enlève la même part de la barre.

### Le tableau (aujourd'hui 51 / 74 / 92 %, 2,1 min)

| Variante | Victoires | Marteleur | Durée |
|---|---|---|---|
| aujourd'hui | 51 / 74 / 92 % | 4 % | 2,1 min |
| la jauge plus vive seule (croissance ×1,3) | 70 / 91 / 95 % | 3 % | 1,8 |
| **la jauge plus vive, PV ×1,6 au tableau** | **59 / 84 / 94 %** | **0 %** | **2,2** |
| idem, Vivacité −1 au tableau | 71 / 84 / 98 % | 1 % | 2,2 |
| jauge de 50, PV ×1,6 | 56 / 77 / 94 % | 0 % | 2,2 |
| jauge d'aujourd'hui, PV ×1,6 | 38 / 69 / 89 % | 1 % | 2,3 |

### La finale (aujourd'hui 30 / 70 / 94 %, 3,2 min)

| Variante | Victoires | Marteleur | Durée |
|---|---|---|---|
| aujourd'hui | 30 / 70 / 94 % | 1 % | 3,2 min |
| **combos +1 coup, la jauge plus vive** | **39 / 69 / 87 %** | **0 %** | **2,9** |
| la jauge plus vive seule | 61 / 86 / 95 % | 0 % | 3,0 |
| combos +1, jauge de 50 | 43 / 63 / 80 % | 0 % | 2,8 |
| combos +1, jauge d'aujourd'hui | 27 / 59 / 85 % | 0 % | 3,2 |

## 5. Le paquet recommandé

1. **La jauge** : les compétences la remplissent 1,5 fois plus (×3 au lieu de ×2), elle se vide deux fois moins vite (0,63 par seconde). Un Coup éclair gardé brise Vessa et Cassius ; deux brisent Orla (65 − 11 + 65). Ruptures par minute ×1,8. L'attaque simple reste à 0,5 : la remplir plus ramène le marteleur.
2. **Le rythme** : en poule, la Vivacité des rivaux est leur fiche moins 3 (Vessa 10, Orla 8, Cassius 7…) ; au tableau et en finale, leur fiche. Leur tempo suit déjà leur Vivacité (Passe DB8) : Vessa en poule 4,6-8,5 s de pause au lieu de 3,5-6,5, ses coups 30 % plus lents à partir (plus de temps pour les esquiver). La riposte reste au 3e coup simple : qui charge une compétence a toute la pause, qui tape trois fois est attaqué.
3. **La fin** : en finale, les combos ont un coup de plus.
4. **Les PV de Ren** : tout ce qui touche à ses PV ×2 (300 au départ, +24 par victoire, l'équipement ×2) et les coups des rivaux ×2 : le même équilibre, l'écart au début de 3,3 à 4,7 fois ramené à 1,7 à 2,3. Le jeu le dit : l'écran de victoire (« +24 PV de vigueur »), la fiche de match (les stats de Ren à côté de celles de l'adversaire, d'où viennent ses PV), le guide, un conseil à la première victoire ; et une séance « Santé » au sable d'entraînement, +20 PV au prochain combat.
5. **Le calage** : la poule plus facile (71 / 92 / 99 %), le tableau tenu sur la courbe de la fiche DB7 (PV des rivaux ×1,6 au tableau au lieu de ×1,3, recalé sur 79 %), la finale telle quelle (39 / 69 / 87 %, la fiche : 26 / 66 / 100 %).

## 6. Ce qui reste incertain
- Le bot charge l'Estocade d'abord : sa première rupture vient vers 29 s dans tous les paquets. Un joueur qui joue le Coup éclair verra la jauge monter plus tôt (Vessa : une rupture au premier Coup éclair gardé).
- La riposte décide du rythme pour qui tape ; seul l'essai dira si les pauses plus longues suffisent.
- La poule à 92 % pour le joueur moyen est un choix : c'est la phase où l'on apprend.
- Le calage du tableau et les courses hors écran (`V2_RACERS`) se refont après les choix, sur des parties entières.
- L'équipement compte dans la courbe (équipement 1, 2, 3 aux trois étapes). La séance de l'économie (Passe ECO1, fusionnée pendant cette passe) a mesuré qu'aujourd'hui un joueur qui achète dans l'ordre de la courbe n'atteint jamais l'équipement 2 au jour 6 ni l'équipement 3 au jour 10 ; sa fiche propose des petits travaux et des bourses par étape qui les rendent atteignables (97 %). Avec l'équipement 1 au tableau et en finale (bot faible / moyen / fort, 20 graines) :

| Étape, équipement 1 | Aujourd'hui | Le paquet |
|---|---|---|
| Tableau (niveau 3, 185 PV ; paquet : PV des rivaux ×1,6) | 41 / 67 / 94 % | 46 / 73 / 89 % |
| Finale (niveau 3, 220 PV ; paquet : combos +1) | 20 / 34 / 84 % | 25 / 44 / 75 % |
| Finale, équipement 2 | 26 / 51 / 86 % | 24 / 54 / 77 % |

  Le calage du tableau et de la finale se fait donc après les choix des deux fiches, sur l'équipement que l'économie permettra.
